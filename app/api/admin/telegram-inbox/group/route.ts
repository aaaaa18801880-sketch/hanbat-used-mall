// 파일 경로: app/api/admin/telegram-inbox/group/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAnonServerClient } from "../../../../../lib/supabase";
import {
  checkRateLimit,
  getClientIp,
  verifyAdminRequest,
} from "../../../../../lib/server-security";
import {
  generateGeminiWithFallback,
  parseGeminiJsonObject,
  type GeminiInlineImagePart,
} from "../../../../../lib/server-gemini";
import {
  fetchTelegramFileBuffer,
  getTelegramBotToken,
} from "../../../../../lib/telegram-server";
import { createTelegramPreviewImage } from "../../../../../lib/server-image-sharp";
import {
  normalizeAiGroupingResult,
  sortTelegramPhotosChronologically,
  type TelegramInboxPhoto,
} from "../../../../../lib/telegram-inbox";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BATCH_PHOTOS = 20;
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_GEMINI_MODEL = "gemini-3.5-flash-lite";

/**
 * 15~20장 단위 시간순 사진을 경량 썸네일(320px)로 AI에 전달해
 * 동일 제품 경계 묶음 + 손바닥/바닥/흔들림 불량컷을 자동 판별합니다.
 */
export async function POST(req: NextRequest) {
  const adminCheck = await verifyAdminRequest(req);
  if (!adminCheck.ok) {
    return NextResponse.json(
      { error: adminCheck.error || "관리자 권한이 필요합니다." },
      { status: adminCheck.status }
    );
  }

  const rate = await checkRateLimit(
    `tg_group:${adminCheck.email || getClientIp(req)}`,
    20,
    60 * 1000,
    { failureMode: "fail-closed" }
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.` },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const botToken = getTelegramBotToken();
  if (!apiKey || !botToken) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY 또는 TELEGRAM_BOT_TOKEN 설정이 필요합니다." },
      { status: 503 }
    );
  }

  let body: { photoIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const requestedIds = Array.isArray(body.photoIds)
    ? body.photoIds
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean)
        .slice(0, MAX_BATCH_PHOTOS)
    : [];

  if (requestedIds.length === 0) {
    return NextResponse.json(
      { error: "묶음을 분류할 사진 ID 목록이 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const supabase = createAnonServerClient(adminCheck.accessToken);
    const { data, error } = await supabase
      .from("telegram_inbox_photos")
      .select("*")
      .in("id", requestedIds)
      .eq("status", "pending");

    if (error) throw error;

    const ordered = sortTelegramPhotosChronologically(
      (data ?? []) as TelegramInboxPhoto[]
    );
    if (ordered.length === 0) {
      return NextResponse.json(
        { error: "분류 가능한 대기중 사진이 없습니다." },
        { status: 404 }
      );
    }

    // 4개씩 동시 다운로드 + 320px JPEG 경량 변환
    const imageParts: GeminiInlineImagePart[] = [];
    for (let start = 0; start < ordered.length; start += 4) {
      const slice = ordered.slice(start, start + 4);
      const chunkParts = await Promise.all(
        slice.map(async (photo) => {
          const downloaded = await fetchTelegramFileBuffer({
            botToken,
            fileId: photo.thumb_file_id || photo.file_id,
            timeoutMs: 8000,
          });
          const smallJpeg = await createTelegramPreviewImage(downloaded.buffer, {
            maxEdge: 320,
            format: "jpeg",
            quality: 74,
          });
          return {
            inlineData: {
              mimeType: "image/jpeg",
              data: smallJpeg.toString("base64"),
            },
          } satisfies GeminiInlineImagePart;
        })
      );
      imageParts.push(...chunkParts);
    }

    const timelineSummary = ordered
      .map(
        (p, idx) =>
          `${idx + 1}번: 촬영 ${p.taken_at}${p.media_group_id ? ` (앨범:${p.media_group_id.slice(-4)})` : ""}`
      )
      .join("\n");

    const prompt = `
당신은 중고가전 매장 매입·전시 사진 분류 보조자입니다.
전달된 ${ordered.length}장의 사진(1번~${ordered.length}번, 시간순)을 보고:
1) **같은 가전제품 1대(또는 1세트)**에 속하는 사진 번호끼리 순서대로 묶어 주세요.
   - 흔한 현장 패턴: [제품 외관 사진 1~2장] → 바로 뒤 [해당 제품의 명판 스티커·에너지라벨 1장] → 그 다음 [다른 제품 외관 사진]...
   - 명판 스티커·에너지라벨이 나오면 보통 그 제품 묶음이 끝나고 다음 외관부터 새 제품이 시작됩니다.
   - 에어컨 실내기 바로 뒤 실외기(또는 세트 라벨)는 같은 묶음으로 잡되, 명확히 다른 모델/품목이면 반드시 분리하세요.
   - 모든 1..${ordered.length}번 사진이 빠짐없이 정확히 1개 묶음에 포함되어야 합니다.
2) **손가림·초점 심한 흔들림·바닥 오촬영**으로 상품 등록에 쓸 수 없는 불량컷만 "badPhotos"에 표시하세요(정상 명판/외관은 절대 넣지 마세요).

[사진 촬영 시각 순서]
${timelineSummary}

반드시 다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{
  "groups": [
    { "indices": [1, 2] },
    { "indices": [3, 4] }
  ],
  "badPhotos": [
    { "index": 5, "reason": "손가림/초점 흐림" }
  ]
}
`.trim();

    const { text, modelUsed } = await generateGeminiWithFallback({
      apiKey,
      defaultModel: DEFAULT_GEMINI_MODEL,
      fallbackModel: FALLBACK_GEMINI_MODEL,
      prompt,
      imageParts,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
      timeoutMs: 25000,
    });

    const { parsed } = parseGeminiJsonObject(text);
    const { updates, badNotesById, groupCount } = normalizeAiGroupingResult({
      orderedPhotos: ordered,
      rawGroups: parsed?.groups,
      rawBadPhotos: parsed?.badPhotos,
    });

    for (const u of updates) {
      const note = badNotesById[u.id] ?? null;
      await supabase
        .from("telegram_inbox_photos")
        .update({
          group_key: u.group_key,
          sort_order: u.sort_order,
          ai_note: note,
        })
        .eq("id", u.id)
        .eq("status", "pending");
    }

    return NextResponse.json({
      ok: true,
      modelUsed,
      groupCount,
      updates,
      badNotesById,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "AI 제품 자동 묶음 분석 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
