import crypto from "crypto";
import { NextRequest } from "next/server";
import { createServerSupabaseClient, isAuthorizedAdminUser } from "./supabase";

export async function verifyAdminRequest(req: NextRequest | Request): Promise<{
  ok: boolean;
  email?: string;
  accessToken?: string;
  error?: string;
  status: number;
}> {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

    if (!token) {
      return {
        ok: false,
        error: "관리자 인증 토큰이 필요합니다.",
        status: 401,
      };
    }

    const client = createServerSupabaseClient(token);
    const {
      data: { user },
      error,
    } = await client.auth.getUser(token);

    if (error || !user) {
      return {
        ok: false,
        error: "유효하지 않거나 만료된 관리자 세션입니다.",
        status: 401,
      };
    }

    if (!isAuthorizedAdminUser(user)) {
      return {
        ok: false,
        error: "관리자 권한이 없는 계정입니다.",
        status: 403,
      };
    }

    return {
      ok: true,
      email: user.email,
      accessToken: token,
      status: 200,
    };
  } catch {
    return {
      ok: false,
      error: "관리자 권한 확인 중 오류가 발생했습니다.",
      status: 500,
    };
  }
}

const HASH_PREFIX = "scrypt$";

export function hashInquiryPassword(plainPassword: string): string {
  const normalized = plainPassword.trim();
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(normalized, salt, 64).toString("hex");
  return `${HASH_PREFIX}${salt}$${derivedKey}`;
}

export function verifyInquiryPassword(
  inputPassword: string,
  storedPassword?: string | null
): boolean {
  if (!storedPassword || !inputPassword) return false;
  const candidate = inputPassword.trim();
  const stored = storedPassword.trim();
  if (!candidate || !stored) return false;

  if (stored.startsWith(HASH_PREFIX)) {
    const parts = stored.split("$");
    if (parts.length !== 3) return false;
    const [, salt, originalHashHex] = parts;
    try {
      const candidateKey = crypto.scryptSync(candidate, salt, 64);
      const originalKey = Buffer.from(originalHashHex, "hex");
      if (candidateKey.length !== originalKey.length) return false;
      return crypto.timingSafeEqual(candidateKey, originalKey);
    } catch {
      return false;
    }
  }

  const candidateBuf = Buffer.from(candidate, "utf8");
  const storedBuf = Buffer.from(stored, "utf8");
  if (candidateBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, storedBuf);
}

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();
const notificationDedupCache = new Map<string, number>();

export function getClientIp(req: NextRequest | Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown-ip";
}

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const current = rateBuckets.get(key);

  if (!current || now > current.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (current.count >= maxAttempts) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000)
    );
    return { allowed: false, retryAfterSec };
  }

  current.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function checkNotificationIdempotency(
  dedupKey: string,
  ttlMs = 3 * 60 * 1000,
  forceRetry = false
): { isDuplicate: boolean } {
  const now = Date.now();
  for (const [k, expiresAt] of notificationDedupCache.entries()) {
    if (now > expiresAt) notificationDedupCache.delete(k);
  }

  if (!forceRetry) {
    const existingExpiry = notificationDedupCache.get(dedupKey);
    if (existingExpiry && now < existingExpiry) {
      return { isDuplicate: true };
    }
  }

  notificationDedupCache.set(dedupKey, now + ttlMs);
  return { isDuplicate: false };
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function hasValidImageMagicBytes(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return true;
  }
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return true;
  }
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buf.subarray(8, 12).toString("ascii").toLowerCase();
    if (
      brand.startsWith("hei") ||
      brand.startsWith("mif") ||
      brand.startsWith("msf") ||
      brand.startsWith("avi")
    ) {
      return true;
    }
  }
  return false;
}

export async function validateServerImageFiles(
  files: File[],
  options: { maxFiles: number; maxFileSizeBytes: number }
): Promise<{
  ok: boolean;
  error?: string;
  validated?: Array<{ mimeType: string; base64: string }>;
}> {
  if (!files || files.length === 0) {
    return { ok: false, error: "첨부된 이미지 파일이 없습니다." };
  }
  if (files.length > options.maxFiles) {
    return {
      ok: false,
      error: `사진은 한 번에 최대 ${options.maxFiles}장까지만 업로드할 수 있습니다.`,
    };
  }

  const validated: Array<{ mimeType: string; base64: string }> = [];

  for (const file of files) {
    if (file.size <= 0) {
      return { ok: false, error: "비어 있는 파일은 업로드할 수 없습니다." };
    }
    if (file.size > options.maxFileSizeBytes) {
      const maxMb = Math.round(options.maxFileSizeBytes / (1024 * 1024));
      return {
        ok: false,
        error: `파일 크기가 허용 한도(${maxMb}MB)를 초과했습니다.`,
      };
    }

    const mime = (file.type || "").toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return {
        ok: false,
        error: "허용되지 않는 파일 형식입니다. (JPG, PNG, WEBP, HEIC만 가능)",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!hasValidImageMagicBytes(buffer)) {
      return {
        ok: false,
        error: "파일 헤더 시그니처가 유효한 이미지 형식이 아닙니다.",
      };
    }

    validated.push({
      mimeType: mime,
      base64: buffer.toString("base64"),
    });
  }

  return { ok: true, validated };
}
