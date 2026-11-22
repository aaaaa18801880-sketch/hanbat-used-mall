// 파일 경로: app/api/admin/telegram-inbox/setup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { STORE } from "../../../../../lib/site";
import {
  checkRateLimit,
  getClientIp,
  verifyAdminRequest,
} from "../../../../../lib/server-security";
import {
  getTelegramBotToken,
  getTelegramIngestChatId,
  getTelegramWebhookSecret,
} from "../../../../../lib/telegram-server";

export const runtime = "nodejs";

interface DiscoveredTelegramChat {
  chatId: string;
  title: string;
  type: string;
}

function asRecord(val: unknown): Record<string, unknown> | null {
  return val && typeof val === "object" && !Array.isArray(val)
    ? (val as Record<string, unknown>)
    : null;
}

function extractChatFromUpdate(update: unknown): DiscoveredTelegramChat | null {
  const root = asRecord(update);
  if (!root) return null;

  const container =
    asRecord(root.channel_post) ??
    asRecord(root.message) ??
    asRecord(root.my_chat_member);
  const chat = asRecord(container?.chat);
  if (!chat || chat.id === undefined) return null;

  const chatId = String(chat.id).trim();
  const type = typeof chat.type === "string" ? chat.type : "unknown";
  const title =
    (typeof chat.title === "string" && chat.title.trim()) ||
    (typeof chat.username === "string" && `@${chat.username}`) ||
    chatId;

  return { chatId, title, type };
}

/**
 * 관리자 전용 텔레그램 웹훅 상태 조회 및 봇이 초대된 채널/그룹 Chat ID 탐색
 * - TELEGRAM_BOT_TOKEN 등 민감 키 값은 절대 클라이언트에 반환하지 않습니다.
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
    `tg_setup_get:${adminCheck.email || getClientIp(req)}`,
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

  const botToken = getTelegramBotToken();
  const ingestChatId = getTelegramIngestChatId();
  const webhookSecret = getTelegramWebhookSecret();

  if (!botToken) {
    return NextResponse.json(
      {
        botConfigured: false,
        ingestChatConfigured: Boolean(ingestChatId),
        webhookSecretConfigured: Boolean(webhookSecret),
        webhookUrl: null,
        pendingUpdateCount: 0,
        lastErrorMessage: null,
        recentChats: [],
      },
      { status: 200 }
    );
  }

  try {
    const infoRes = await fetch(
      `https://api.telegram.org/bot${encodeURIComponent(botToken)}/getWebhookInfo`,
      { method: "GET", signal: AbortSignal.timeout(8000), cache: "no-store" }
    );
    const infoJson = (await infoRes.json().catch(() => null)) as {
      ok?: boolean;
      result?: {
        url?: string;
        pending_update_count?: number;
        last_error_message?: string;
      };
    } | null;

    const webhookUrl =
      typeof infoJson?.result?.url === "string" && infoJson.result.url.trim()
        ? infoJson.result.url.trim()
        : null;
    const pendingUpdateCount =
      typeof infoJson?.result?.pending_update_count === "number"
        ? infoJson.result.pending_update_count
        : 0;
    const lastErrorMessage =
      typeof infoJson?.result?.last_error_message === "string" &&
      infoJson.result.last_error_message.trim()
        ? infoJson.result.last_error_message.trim()
        : null;

    // 웹훅이 아직 등록되지 않았을 때만 getUpdates로 봇이 속한 최근 채팅방·채널 탐색
    const recentChats: DiscoveredTelegramChat[] = [];
    if (!webhookUrl) {
      const updRes = await fetch(
        `https://api.telegram.org/bot${encodeURIComponent(botToken)}/getUpdates?limit=30&allowed_updates=${encodeURIComponent('["message","channel_post","my_chat_member"]')}`,
        { method: "GET", signal: AbortSignal.timeout(8000), cache: "no-store" }
      );
      const updJson = (await updRes.json().catch(() => null)) as {
        ok?: boolean;
        result?: unknown[];
      } | null;

      if (updJson?.ok && Array.isArray(updJson.result)) {
        const seen = new Map<string, DiscoveredTelegramChat>();
        for (const item of updJson.result) {
          const parsed = extractChatFromUpdate(item);
          if (parsed) {
            seen.set(parsed.chatId, parsed);
          }
        }
        recentChats.push(...Array.from(seen.values()));
      }
    }

    return NextResponse.json({
      botConfigured: true,
      ingestChatConfigured: Boolean(ingestChatId),
      webhookSecretConfigured: Boolean(webhookSecret),
      expectedWebhookUrl: `${STORE.url}/api/telegram/webhook`,
      webhookUrl,
      pendingUpdateCount,
      lastErrorMessage,
      recentChats,
    });
  } catch {
    return NextResponse.json(
      { error: "텔레그램 연동 상태 조회 중 통신 오류가 발생했습니다." },
      { status: 502 }
    );
  }
}

/**
 * 관리자 전용 텔레그램 웹훅 원클릭 등록 (서버 내부 토큰·시크릿 직접 사용)
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
    `tg_setup_post:${adminCheck.email || getClientIp(req)}`,
    10,
    60 * 1000,
    { failureMode: "fail-closed" }
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.` },
      { status: 429 }
    );
  }

  const botToken = getTelegramBotToken();
  const webhookSecret = getTelegramWebhookSecret();
  if (!botToken || !webhookSecret) {
    return NextResponse.json(
      {
        error:
          "Vercel 환경변수에 TELEGRAM_BOT_TOKEN 및 TELEGRAM_WEBHOOK_SECRET이 모두 설정되어야 웹훅을 등록할 수 있습니다.",
      },
      { status: 503 }
    );
  }

  const targetUrl = `${STORE.url}/api/telegram/webhook`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${encodeURIComponent(botToken)}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          secret_token: webhookSecret,
          allowed_updates: ["message", "channel_post"],
          drop_pending_updates: false,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      description?: string;
    } | null;

    if (!res.ok || !json?.ok) {
      return NextResponse.json(
        {
          error:
            json?.description ||
            `텔레그램 웹훅 등록에 실패했습니다 (HTTP ${res.status}).`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      webhookUrl: targetUrl,
      message: "텔레그램 사진 수집함 웹훅이 정상 등록되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { error: "텔레그램 웹훅 등록 요청 중 통신 오류가 발생했습니다." },
      { status: 502 }
    );
  }
}
