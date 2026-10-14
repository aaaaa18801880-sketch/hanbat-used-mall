import crypto from "crypto";
import { NextRequest } from "next/server";
import { createServerSupabaseClient, isAuthorizedAdminUser } from "./supabase";

/* ════════════════════════════════════════════════════════════
   1. 서버 측 관리자 요청 검증 (Route Handler용)
   ════════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════════
   2. 문의 비밀번호 해시 및 레거시 평문 하위호환 검증
   ════════════════════════════════════════════════════════════ */
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

  // 1) 신규 scrypt 해시 포맷 검증: scrypt$<salt>$<hexHash>
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

  // 2) 기존 운영 DB의 평문 비밀번호 레코드 하위 호환 검증 (타이밍 공격 방지)
  const candidateBuf = Buffer.from(candidate, "utf8");
  const storedBuf = Buffer.from(stored, "utf8");
  if (candidateBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, storedBuf);
}

/* ════════════════════════════════════════════════════════════
   3. 요청 제한 (Rate Limiter - 비밀번호 대입 및 외부 API 남용 방지)
   ════════════════════════════════════════════════════════════ */
interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

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
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  current.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

/* ════════════════════════════════════════════════════════════
   4. 서버 측 이미지 업로드 정밀 검증 (확장자 불신, 매직바이트 시그니처 검사)
   ════════════════════════════════════════════════════════════ */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function hasValidImageMagicBytes(buf: Buffer): boolean {
  if (buf.length < 12) return false;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
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

  // WebP: "RIFF" .... "WEBP"
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return true;
  }

  // HEIC / HEIF / AVIF: ISO Base Media File Format ("ftyp" at offset 4)
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
