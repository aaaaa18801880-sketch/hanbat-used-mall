// 파일 경로: lib/telegram-server.ts
// 서버 전용 Telegram Bot API 연동 헬퍼 (원본·미리보기 파일 다운로드, file_path 단기 캐시 및 환경설정 확인)

export interface TelegramIngestEnvStatus {
  botConfigured: boolean;
  ingestChatConfigured: boolean;
  webhookSecretConfigured: boolean;
}

const FILE_PATH_CACHE_TTL_MS = 40 * 60 * 1000; // Telegram file_path는 최소 1시간 유효
const FILE_PATH_CACHE_MAX_SIZE = 500;
const filePathCache = new Map<string, { filePath: string; expiresAt: number }>();

function getCachedFilePath(fileId: string): string | null {
  const hit = filePathCache.get(fileId);
  if (!hit) return null;
  if (Date.now() >= hit.expiresAt) {
    filePathCache.delete(fileId);
    return null;
  }
  return hit.filePath;
}

function setCachedFilePath(fileId: string, filePath: string): void {
  if (filePathCache.size >= FILE_PATH_CACHE_MAX_SIZE) {
    const oldestKey = filePathCache.keys().next().value;
    if (oldestKey) filePathCache.delete(oldestKey);
  }
  filePathCache.set(fileId, {
    filePath,
    expiresAt: Date.now() + FILE_PATH_CACHE_TTL_MS,
  });
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

async function resolveTelegramFilePath(params: {
  botToken: string;
  cleanFileId: string;
  timeoutMs: number;
  bypassCache?: boolean;
}): Promise<string> {
  if (!params.bypassCache) {
    const cached = getCachedFilePath(params.cleanFileId);
    if (cached) return cached;
  }

  const metaRes = await fetch(
    `https://api.telegram.org/bot${encodeURIComponent(params.botToken)}/getFile?file_id=${encodeURIComponent(params.cleanFileId)}`,
    {
      method: "GET",
      signal: AbortSignal.timeout(params.timeoutMs),
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

  setCachedFilePath(params.cleanFileId, rawPath);
  return rawPath;
}

/**
 * Telegram Bot API getFile -> file download 파이프라인으로 이미지 바이너리를 가져옵니다.
 * - Telegram 고정 도메인만 호출하여 SSRF 가능성을 원천 차단합니다.
 * - 동일 file_id의 file_path를 40분간 캐시해 재조회/확대/커밋 시 getFile 왕복 호출을 절반으로 줄입니다.
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

  const metaTimeout = params.timeoutMs ?? 8000;
  const fileTimeout = params.timeoutMs ?? 12000;
  const hadCache = Boolean(getCachedFilePath(cleanFileId));

  let rawPath = await resolveTelegramFilePath({
    botToken: params.botToken,
    cleanFileId,
    timeoutMs: metaTimeout,
  });

  let fileRes = await fetch(
    `https://api.telegram.org/file/bot${encodeURIComponent(params.botToken)}/${rawPath}`,
    {
      method: "GET",
      signal: AbortSignal.timeout(fileTimeout),
      cache: "no-store",
    }
  );

  // 캐시된 file_path가 만료되었으면 1회 즉시 재조회 후 재시도
  if (!fileRes.ok && hadCache && (fileRes.status === 404 || fileRes.status === 410)) {
    filePathCache.delete(cleanFileId);
    rawPath = await resolveTelegramFilePath({
      botToken: params.botToken,
      cleanFileId,
      timeoutMs: metaTimeout,
      bypassCache: true,
    });
    fileRes = await fetch(
      `https://api.telegram.org/file/bot${encodeURIComponent(params.botToken)}/${rawPath}`,
      {
        method: "GET",
        signal: AbortSignal.timeout(fileTimeout),
        cache: "no-store",
      }
    );
  }

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
