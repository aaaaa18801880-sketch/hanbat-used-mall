// 파일 경로: app/api/telegram/webhook/route.ts
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "../../../../lib/supabase";
import { parseTelegramWebhookUpdate } from "../../../../lib/telegram-inbox";
import {
  getTelegramIngestChatId,
  getTelegramWebhookSecret,
} from "../../../../lib/telegram-server";

export const runtime = "nodejs";

function verifyTelegramSecretToken(
  providedToken: string,
  expectedSecret: string
): boolean {
  if (!providedToken || !expectedSecret) return false;
  const a = crypto.createHash("sha256").update(providedToken, "utf8").digest();
  const b = crypto.createHash("sha256").update(expectedSecret, "utf8").digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * 텔레그램 상품 등록 전용 방 사진 수신 웹훅
 * - 이미지 바이너리 대신 file_id 메타데이터만 즉시 DB에 기록하여 무료 스토리지/대역폭을 0바이트로 절감합니다.
 */
export async function POST(req: NextRequest) {
  const expectedSecret = getTelegramWebhookSecret();
  const ingestChatId = getTelegramIngestChatId();

  if (!expectedSecret || !ingestChatId) {
    return NextResponse.json(
      {
        ok: false,
        error: "텔레그램 사진 수집함 웹훅 환경변수가 설정되지 않았습니다.",
      },
      { status: 503 }
    );
  }

  const providedToken = (
    req.headers.get("x-telegram-bot-api-secret-token") || ""
  ).trim();
  if (!verifyTelegramSecretToken(providedToken, expectedSecret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let update: unknown;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseTelegramWebhookUpdate(update, ingestChatId);
  if (!parsed.matched) {
    // 텔레그램이 다른 메시지(텍스트/타 채팅방)로 재시도 루프에 빠지지 않도록 200 OK로 안전 무시
    return NextResponse.json({ ok: true, ignored: parsed.reason });
  }

  const { photo } = parsed;

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("telegram_inbox_photos").insert({
      telegram_update_id: photo.telegramUpdateId,
      chat_id: photo.chatId,
      message_id: photo.messageId,
      media_group_id: photo.mediaGroupId,
      file_id: photo.fileId,
      file_unique_id: photo.fileUniqueId,
      thumb_file_id: photo.thumbFileId,
      source_kind: photo.sourceKind,
      mime_type: photo.mimeType,
      file_size: photo.fileSize,
      width: photo.width,
      height: photo.height,
      sort_order: photo.messageId,
      status: "pending",
      taken_at: photo.takenAtIso,
    });

    if (error) {
      // 중복 웹훅 재전송(23505 unique violation)은 정상 멱등 처리
      if (error.code === "23505" || /duplicate key/i.test(error.message)) {
        return NextResponse.json({ ok: true, deduplicated: true });
      }
      console.error("[telegram/webhook] DB insert error:", error.message);
      return NextResponse.json(
        { ok: false, error: "DB 저장 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, saved: true });
  } catch (err: unknown) {
    console.error(
      "[telegram/webhook] exception:",
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.json(
      { ok: false, error: "웹훅 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
