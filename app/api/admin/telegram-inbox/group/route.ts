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
  getTelegramIngestChatId,
} from "../../../../../lib/telegram-server";
import { createTelegramPreviewImage } from "../../../../../lib/server-image-sharp";
import {
  chunkTelegramItems,
  normalizeAiGroupingResult,
  sortTelegramPhotosChronologically,
  TELEGRAM_MAX_PHOTOS_PER_PRODUCT,
  TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT,
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
    const ingestChatId = getTelegramIngestChatId();
    let groupQuery = supabase
      .from("telegram_inbox_photos")
      .select("*")
      .in("id", requestedIds)
      .eq("status", "pending");
    if (ingestChatId) {
      groupQuery = groupQuery.eq("chat_id", ingestChatId);
    }
    const { data, error } = await groupQuery;

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

    // 6개씩 동시 다운로드 (이미 텔레그램 320px 썸네일이면 Sharp 재인코딩 생략해 CPU 절감)
    const imageParts: GeminiInlineImagePart[] = [];
    for (let start = 0; start < ordered.length; start += 6) {
      const slice = ordered.slice(start, start + 6);
      const chunkParts = await Promise.all(
        slice.map(async (photo) => {
          const downloaded = await fetchTelegramFileBuffer({
            botToken,
            fileId: photo.thumb_file_id || photo.file_id,
            timeoutMs: 8000,
          });
          if (photo.thumb_file_id) {
            return {
              inlineData: {
                mimeType: downloaded.mimeType || "image/jpeg",
                data: downloaded.buffer.toString("base64"),
              },
            } satisfies GeminiInlineImagePart;
          }
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
      .map((p, idx) => `${idx + 1}번: 전송 ${p.taken_at}`)
      .join("\n");

    const prompt = `
당신은 중고가전 매장 매입·전시 사진 분류 전문가입니다.
전달된 ${ordered.length}장의 사진(1번~${ordered.length}번, 시간순)을 직접 눈으로 확인하여 **같은 제품 1대씩** 분리하세요.

[가장 중요한 규칙 — 기본 ${TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT}장 구성 / 최대 ${TELEGRAM_MAX_PHOTOS_PER_PRODUCT}장 엄수]
1) 한밭중고전자는 **보통 1개 제품당 ${TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT}장**(예: 제품 외관 1장 + 명판·에너지효율라벨 1장, 또는 명판 1장 + 외관 1장)씩 순서대로 촬영해 올립니다.
2) **1개 묶음은 기본 ${TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT}장**으로 잡되, 외관+내부+명판 3장이 명백히 동일 모델·동일 장소의 같은 제품일 때만 최대 ${TELEGRAM_MAX_PHOTOS_PER_PRODUCT}장까지 허용합니다. **절대 4장 이상을 한 묶음으로 합치지 마세요.**
3) **전송 시각이 0~1초 차이로 같아도** 텔레그램에 여러 제품 사진을 한꺼번에 끌어다 올려서 시각이 같을 뿐입니다. 시각이나 순서만 보지 말고, 사진 속 가전의 **품목(냉장고/에어컨/세탁기/쇼케이스 등)·색상·배경**을 직접 비교해 다른 제품이 나오면 무조건 새 묶음으로 끊으세요.
4) 서로 다른 브랜드/색상/품목의 외관 사진이 연속되면 절대 합치지 말고 각각 1장 또는 ${TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT}장 단위로 분리하세요.
5) 에어컨 실내기 바로 뒤에 해당 실외기 또는 동일 제품 라벨이 온 경우에만 같은 묶음으로 잡습니다.
6) 1번~${ordered.length}번 사진이 빠짐없이, 중복 없이 정확히 1개 묶음에 포함되어야 합니다.

[불량컷 판별]
- **손바닥 가림·초점이 심하게 흔들려 식별 불가·빈 바닥 오촬영** 사진만 "badPhotos"에 표시하세요. (정상 제품 외관이나 에너지효율표/명판 사진은 절대 넣지 마세요.)

[사진 번호별 전송 시각]
${timelineSummary}

반드시 다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{
  "groups": [
    { "indices": [1, 2] },
    { "indices": [3, 4] }
  ],
  "badPhotos": [
    { "index": 5, "reason": "초점 심한 흔들림/손가림" }
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
        maxOutputTokens: 4096,
      },
      timeoutMs: 25000,
    });

    const { parsed } = parseGeminiJsonObject(text);
    const { updates, badNotesById, groupCount, lastGroupPhotoIds } =
      normalizeAiGroupingResult({
        orderedPhotos: ordered,
        rawGroups: parsed?.groups,
        rawBadPhotos: parsed?.badPhotos,
        maxGroupSize: TELEGRAM_MAX_PHOTOS_PER_PRODUCT,
      });

    for (const slice of chunkTelegramItems(updates, 10)) {
      const results = await Promise.all(
        slice.map((u) => {
          const note = badNotesById[u.id] ?? null;
          let upd = supabase
            .from("telegram_inbox_photos")
            .update({
              group_key: u.group_key,
              sort_order: u.sort_order,
              ai_note: note,
            })
            .eq("id", u.id)
            .eq("status", "pending");
          if (ingestChatId) upd = upd.eq("chat_id", ingestChatId);
          return upd;
        })
      );
      for (const r of results) {
        if (r.error) throw r.error;
      }
    }

    return NextResponse.json({
      ok: true,
      modelUsed,
      groupCount,
      updates,
      badNotesById,
      lastGroupPhotoIds,
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
