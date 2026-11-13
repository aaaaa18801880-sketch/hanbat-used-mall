import { NextResponse } from "next/server";
import {
  maskPhone,
  NOTIFICATION_STATUS,
  STORE,
  type NotificationDispatchResult,
} from "./site";

export const TELEGRAM_DEDUP_WINDOW_MS = 10 * 60 * 1000;

/**
 * 알림 채널(Telegram / Alimtalk) 공통 JSON 응답 생성기
 */
export function notificationJson(
  channel: NotificationDispatchResult["channel"],
  statusCode: number,
  options: {
    success: boolean;
    status: NotificationDispatchResult["status"];
    sent: boolean;
    retryable: boolean;
    message: string;
    timestamp?: string;
    deduplicated?: boolean;
    skipped?: boolean;
    configured?: boolean;
    senderConfigured?: boolean;
    reason?: string;
  }
) {
  const payload: Record<string, unknown> = {
    success: options.success,
    channel,
    status: options.status,
    statusLabel: NOTIFICATION_STATUS[options.status],
    sent: options.sent,
    retryable: options.retryable,
    message: options.message,
    timestamp: options.timestamp ?? new Date().toISOString(),
  };
  if (options.deduplicated !== undefined) payload.deduplicated = options.deduplicated;
  if (options.skipped !== undefined) payload.skipped = options.skipped;
  if (options.configured !== undefined) payload.configured = options.configured;
  if (options.senderConfigured !== undefined) {
    payload.senderConfigured = options.senderConfigured;
  }
  if (options.reason !== undefined) payload.reason = options.reason;

  return NextResponse.json(payload, { status: statusCode });
}

/**
 * 개인정보 마스킹이 적용된 텔레그램 신규 접수 안내 메시지를 조립해 Bot API로 전송합니다.
 */
export async function postTelegramInquiryMessage(params: {
  botToken: string;
  chatId: string;
  inquiryId?: string | number | null;
  name: string;
  phone: string;
  type: string;
  title: string;
  timeoutMs?: number;
}): Promise<
  { outcome: "sent" } | { outcome: "http_error" } | { outcome: "exception"; error: string }
> {
  const idStr = params.inquiryId ? String(params.inquiryId).trim() : "";
  const maskedPhone = params.phone ? maskPhone(params.phone) : "미입력";
  const message = [
    `🚨 [${STORE.name} 신규 접수 알림]`,
    "",
    `• 구분: ${params.type}`,
    `• 접수자: ${params.name} (${maskedPhone})`,
    `• 제목: ${params.title}`,
    idStr ? `• 접수번호: #${idStr.slice(0, 8)}` : null,
    "",
    "🔒 개인정보 보호를 위해 전체 연락처와 첨부 사진은 홈페이지 관리자 대시보드(/admin)에서 확인해 주세요.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${params.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: params.chatId,
          text: message,
        }),
        signal: AbortSignal.timeout(params.timeoutMs ?? 4500),
      }
    );
    const resultJson = await res.json().catch(() => null);
    if (res.ok && resultJson?.ok !== false) {
      return { outcome: "sent" };
    }
    return { outcome: "http_error" };
  } catch (err) {
    return {
      outcome: "exception",
      error: err instanceof Error ? err.message : "telegram_network_error",
    };
  }
}
