// 파일 경로: app/api/admin/telegram-inbox/thumbs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAnonServerClient } from "../../../../../lib/supabase";
import {
  checkRateLimit,
  getClientIp,
  verifyAdminRequest,
} from "../../../../../lib/server-security";
import {
  fetchTelegramFileBuffer,
  getTelegramBotToken,
} from "../../../../../lib/telegram-server";
import { createTelegramPreviewImage } from "../../../../../lib/server-image-sharp";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_THUMBS_PER_BATCH = 24;

/**
 * 관리자 전용 텔레그램 썸네일 다건 배치 프록시
 * - 20~24장의 경량 320px 썸네일을 단 1회의 Vercel 함수 호출로 묶어 내려줘 컴퓨팅/인증 비용을 90%+ 절감합니다.
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
    `tg_thumbs:${adminCheck.email || getClientIp(req)}`,
    60,
    60 * 1000,
    { failureMode: "fail-open" }
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.` },
      { status: 429 }
    );
  }

  const botToken = getTelegramBotToken();
  if (!botToken) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN이 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? Array.from(
        new Set(
          body.ids
            .map((id) => (typeof id === "string" ? id.trim() : ""))
            .filter((id) => id.length > 0 && id.length <= 64)
        )
      ).slice(0, MAX_THUMBS_PER_BATCH)
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ thumbs: {} });
  }

  try {
    const supabase = createAnonServerClient(adminCheck.accessToken);
    const { data, error } = await supabase
      .from("telegram_inbox_photos")
      .select("id, file_id, thumb_file_id")
      .in("id", ids);

    if (error) throw error;

    const rows = (data ?? []) as Array<{
      id: string;
      file_id: string;
      thumb_file_id?: string | null;
    }>;

    const thumbs: Record<string, string> = {};

    for (let i = 0; i < rows.length; i += 8) {
      const slice = rows.slice(i, i + 8);
      await Promise.all(
        slice.map(async (row) => {
          try {
            const targetFileId = row.thumb_file_id || row.file_id;
            const downloaded = await fetchTelegramFileBuffer({
              botToken,
              fileId: targetFileId,
              timeoutMs: 8000,
            });

            if (row.thumb_file_id) {
              const mime = downloaded.mimeType || "image/jpeg";
              thumbs[row.id] = `data:${mime};base64,${downloaded.buffer.toString("base64")}`;
              return;
            }

            const webp = await createTelegramPreviewImage(downloaded.buffer, {
              maxEdge: 320,
              format: "webp",
              quality: 68,
            });
            thumbs[row.id] = `data:image/webp;base64,${webp.toString("base64")}`;
          } catch {
            // 개별 썸네일 실패 시 타일 단건 재시도 경로에 위임
          }
        })
      );
    }

    return NextResponse.json(
      { thumbs },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "배치 썸네일 로드 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
