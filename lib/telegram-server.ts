// 파일 경로: lib/telegram-server.ts
// 서버 전용 Telegram Bot API 연동 헬퍼 (원본·미리보기 파일 다운로드 및 환경설정 확인)

export interface TelegramIngestEnvStatus {
  botConfigured: boolean;
  ingestChatConfigured: boolean;
  webhookSecretConfigured: boolean;
}

export function getTelegramBotToken(): string {
  return (process.env.TELEGRAM_BOT_TOKEN || "").trim();
}

export function getTelegramIngestChatId(): string {
  return (process.env.TELEGRAM_INGEST_CHAT_ID || "").trim();
}

export function getTelegramWebhookSecret(): string {
  return (process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
}

export function getTelegramIngestEnvStatus(): TelegramIngestEnvStatus {
  return {
    botConfigured: Boolean(getTelegramBotToken()),
    ingestChatConfigured: Boolean(getTelegramIngestChatId()),
    webhookSecretConfigured: Boolean(getTelegramWebhookSecret()),
  };
}

/**
 * Telegram Bot API getFile -> file download 파이프라인으로 이미지 바이너리를 가져옵니다.
 * - Telegram 고정 도메인만 호출하여 SSRF 가능성을 원천 차단합니다.
 */
export async function fetchTelegramFileBuffer(params: {
  botToken: string;
  fileId: string;
  timeoutMs?: number;
}): Promise<{ buffer: Buffer; mimeType: string; filePath: string }> {
  const cleanFileId = params.fileId.trim();
  if (!cleanFileId || !/^[A-Za-z0-9_-]{8,200}$/.test(cleanFileId)) {
    throw new Error("유효하지 않은 텔레그램 file_id 입니다.");
  }

  const metaRes = await fetch(
    `https://api.telegram.org/bot${encodeURIComponent(params.botToken)}/getFile?file_id=${encodeURIComponent(cleanFileId)}`,
    {
      method: "GET",
      signal: AbortSignal.timeout(params.timeoutMs ?? 8000),
      cache: "no-store",
    }
  );

  const metaJson = (await metaRes.json().catch(() => null)) as {
    ok?: boolean;
    description?: string;
    result?: { file_path?: string; file_size?: number };
  } | null;

  if (!metaRes.ok || !metaJson?.ok || !metaJson.result?.file_path) {
    throw new Error(
      metaJson?.description || "텔레그램 파일 메타데이터 조회에 실패했습니다."
    );
  }

  const rawPath = metaJson.result.file_path.replace(/^\/+/, "");
  if (!rawPath || rawPath.includes("..") || /^https?:/i.test(rawPath)) {
    throw new Error("안전하지 않은 텔레그램 파일 경로입니다.");
  }

  const fileRes = await fetch(
    `https://api.telegram.org/file/bot${encodeURIComponent(params.botToken)}/${rawPath}`,
    {
      method: "GET",
      signal: AbortSignal.timeout(params.timeoutMs ?? 12000),
      cache: "no-store",
    }
  );

  if (!fileRes.ok) {
    throw new Error(`텔레그램 파일 다운로드 실패 (HTTP ${fileRes.status})`);
  }

  const arrBuf = await fileRes.arrayBuffer();
  const buffer = Buffer.from(arrBuf);
  if (buffer.length < 32 || buffer.length > 20 * 1024 * 1024) {
    throw new Error("유효하지 않거나 용량(20MB)을 초과한 이미지입니다.");
  }

  const lower = rawPath.toLowerCase();
  const mimeType = lower.endsWith(".webp")
    ? "image/webp"
    : lower.endsWith(".png")
    ? "image/png"
    : "image/jpeg";

  return { buffer, mimeType, filePath: rawPath };
}
