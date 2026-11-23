// 파일 경로: app/api/admin/telegram-inbox/image/route.ts
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

/**
 * 관리자 전용 텔레그램 수집함 이미지 안전 프록시
 * - /_next/image 변환 한도를 소모하지 않고 320px 경량 WebP 미리보기(또는 확대용 1200px)만 제공합니다.
 */
export async function GET(req: NextRequest) {
  const adminCheck = await verifyAdminRequest(req);
  if (!adminCheck.ok) {
    return NextResponse.json(
      { error: adminCheck.error || "관리자 권한이 필요합니다." },
      { status: adminCheck.status }
    );
  }

  const rate = await checkRateLimit(
    `tg_image:${adminCheck.email || getClientIp(req)}`,
    90,
    60 * 1000,
    { failureMode: "fail-open" }
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `이미지 요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.` },
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

  const id = (req.nextUrl.searchParams.get("id") || "").trim();
  const variant = req.nextUrl.searchParams.get("variant") === "full" ? "full" : "thumb";
  if (!id || id.length > 64) {
    return NextResponse.json({ error: "유효한 사진 ID가 필요합니다." }, { status: 400 });
  }

  try {
    const supabase = createAnonServerClient(adminCheck.accessToken);
    const { data, error } = await supabase
      .from("telegram_inbox_photos")
      .select("id, file_id, thumb_file_id")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });
    }

    const targetFileId =
      variant === "thumb" ? data.thumb_file_id || data.file_id : data.file_id;

    const downloaded = await fetchTelegramFileBuffer({
      botToken,
      fileId: targetFileId,
      timeoutMs: 10000,
    });

    // 텔레그램이 이미 생성한 320px 경량 썸네일(thumb_file_id)은 Sharp 재인코딩 없이 즉시 반환
    if (variant === "thumb" && data.thumb_file_id) {
      return new NextResponse(new Uint8Array(downloaded.buffer), {
        status: 200,
        headers: {
          "Content-Type": downloaded.mimeType || "image/jpeg",
          "Cache-Control": "private, max-age=86400",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const previewWebp = await createTelegramPreviewImage(downloaded.buffer, {
      maxEdge: variant === "thumb" ? 320 : 1200,
      format: "webp",
      quality: variant === "thumb" ? 72 : 84,
    });

    return new NextResponse(new Uint8Array(previewWebp), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "텔레그램 이미지를 불러오지 못했습니다.",
      },
      { status: 502 }
    );
  }
}
