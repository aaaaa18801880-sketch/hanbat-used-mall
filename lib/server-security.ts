// 파일 경로: lib/server-security.ts
import crypto from "crypto";
import { promisify } from "util";
import { NextRequest } from "next/server";
import {
  createAnonServerClient,
  createServerSupabaseClient,
  isAuthorizedAdminUser,
} from "./supabase";

const scryptAsync = promisify(crypto.scrypt);

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

    if (!token || token.length > 4096) {
      return {
        ok: false,
        error: "관리자 인증 토큰이 필요합니다.",
        status: 401,
      };
    }

    // 최소 권한 원칙: JWT 검증 시 Service Role 대신 Anon 클라이언트 사용
    const client =
      typeof createAnonServerClient === "function"
        ? createAnonServerClient(token)
        : createServerSupabaseClient(token, false);
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
const MAX_PASSWORD_INPUT_LENGTH = 128;

export function isScryptHashedPassword(value?: string | null): boolean {
  return typeof value === "string" && value.trim().startsWith(HASH_PREFIX);
}

export function hashInquiryPassword(plainPassword: string): string {
  const normalized = plainPassword.trim().slice(0, MAX_PASSWORD_INPUT_LENGTH);
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(normalized, salt, 64).toString("hex");
  return `${HASH_PREFIX}${salt}$${derivedKey}`;
}

export async function hashInquiryPasswordAsync(
  plainPassword: string
): Promise<string> {
  const normalized = plainPassword.trim().slice(0, MAX_PASSWORD_INPUT_LENGTH);
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(normalized, salt, 64)) as Buffer;
  return `${HASH_PREFIX}${salt}$${derivedKey.toString("hex")}`;
}

function timingSafeStringMatch(a: string, b: string): boolean {
  const digestA = crypto.createHash("sha256").update(a, "utf8").digest();
  const digestB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(digestA, digestB) && a.length === b.length;
}

export function verifyInquiryPassword(
  inputPassword: string,
  storedPassword?: string | null
): boolean {
  if (!storedPassword || !inputPassword) return false;
  const candidate = inputPassword.trim();
  const stored = storedPassword.trim();
  if (!candidate || !stored || candidate.length > MAX_PASSWORD_INPUT_LENGTH) {
    return false;
  }

  if (stored.startsWith(HASH_PREFIX)) {
    const parts = stored.split("$");
    if (parts.length !== 3) return false;
    const [, salt, originalHashHex] = parts;
    if (!salt || !originalHashHex) return false;
    try {
      const candidateKey = crypto.scryptSync(candidate, salt, 64);
      const originalKey = Buffer.from(originalHashHex, "hex");
      if (candidateKey.length !== originalKey.length) return false;
      return crypto.timingSafeEqual(candidateKey, originalKey);
    } catch {
      return false;
    }
  }

  return timingSafeStringMatch(candidate, stored);
}

export async function verifyInquiryPasswordWithMeta(
  inputPassword: string,
  storedPassword?: string | null
): Promise<{ valid: boolean; isLegacyPlaintext: boolean }> {
  if (!storedPassword || !inputPassword) {
    return { valid: false, isLegacyPlaintext: false };
  }
  const candidate = inputPassword.trim();
  const stored = storedPassword.trim();
  if (!candidate || !stored || candidate.length > MAX_PASSWORD_INPUT_LENGTH) {
    return { valid: false, isLegacyPlaintext: false };
  }

  if (stored.startsWith(HASH_PREFIX)) {
    const parts = stored.split("$");
    if (parts.length !== 3) {
      return { valid: false, isLegacyPlaintext: false };
    }
    const [, salt, originalHashHex] = parts;
    if (!salt || !originalHashHex) {
      return { valid: false, isLegacyPlaintext: false };
    }
    try {
      const candidateKey = (await scryptAsync(candidate, salt, 64)) as Buffer;
      const originalKey = Buffer.from(originalHashHex, "hex");
      if (candidateKey.length !== originalKey.length) {
        return { valid: false, isLegacyPlaintext: false };
      }
      const valid = crypto.timingSafeEqual(candidateKey, originalKey);
      return { valid, isLegacyPlaintext: false };
    } catch {
      return { valid: false, isLegacyPlaintext: false };
    }
  }

  const valid = timingSafeStringMatch(candidate, stored);
  return { valid, isLegacyPlaintext: valid };
}

interface RateBucket {
  count: number;
  resetAt: number;
}

const MAX_RATE_BUCKETS = 5000;
const rateBuckets = new Map<string, RateBucket>();

export type NotificationAttemptStatus = "PENDING" | "SENT" | "FAILED";

interface NotificationDedupEntry {
  status: NotificationAttemptStatus;
  expiresAt: number;
  updatedAt: number;
}

const MAX_DEDUP_KEYS = 2000;
const PENDING_INFLIGHT_WINDOW_MS = 8 * 1000;
const notificationDedupCache = new Map<string, NotificationDedupEntry>();

export function getClientIp(req: NextRequest | Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // 마지막 값은 신뢰 프록시가 덧붙인 실제 접속 IP이고, 앞쪽 값은 클라이언트가 임의로 넣을 수 있습니다.
    const hops = forwarded
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
    const clientIp = hops[hops.length - 1];
    if (clientIp && clientIp.length <= 64) return clientIp;
  }
  const realIp = (req.headers.get("x-real-ip") || "").trim();
  if (realIp && realIp.length <= 64) return realIp;
  return "unknown-ip";
}

function pruneRateBuckets(now: number): void {
  if (rateBuckets.size > 200) {
    for (const [k, bucket] of rateBuckets.entries()) {
      if (now > bucket.resetAt) rateBuckets.delete(k);
    }
  }
  if (rateBuckets.size >= MAX_RATE_BUCKETS) {
    const overflow = rateBuckets.size - MAX_RATE_BUCKETS + 1;
    let removed = 0;
    for (const k of rateBuckets.keys()) {
      rateBuckets.delete(k);
      removed += 1;
      if (removed >= overflow) break;
    }
  }
}

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  pruneRateBuckets(now);

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

/**
 * 문의 게시글 비밀번호 검증 전용 이중 브루트포스 방어
 * 1) IP + 게시글 ID 기준: 5분당 최대 5회 시도 허용
 * 2) 게시글 ID 전역 실패 누적 Lockout: 다중 IP 분산 공격 시 게시글당 15분간 최대 10회 실패 시 일시 잠금
 */
export function checkInquiryPasswordRateLimit(
  ip: string,
  inquiryId: string
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  pruneRateBuckets(now);

  const lockoutBucket = rateBuckets.get(`pw_lockout:${inquiryId}`);
  if (lockoutBucket && now <= lockoutBucket.resetAt && lockoutBucket.count >= 10) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((lockoutBucket.resetAt - now) / 1000)
    );
    return { allowed: false, retryAfterSec };
  }

  return checkRateLimit(`pw_verify:${ip}:${inquiryId}`, 5, 5 * 60 * 1000);
}

export function recordInquiryPasswordFailure(inquiryId: string): void {
  checkRateLimit(`pw_lockout:${inquiryId}`, 10, 15 * 60 * 1000);
}

function pruneNotificationDedupCache(now: number): void {
  for (const [k, entry] of notificationDedupCache.entries()) {
    if (now > entry.expiresAt) {
      notificationDedupCache.delete(k);
    }
  }
  if (notificationDedupCache.size >= MAX_DEDUP_KEYS) {
    const overflow = notificationDedupCache.size - MAX_DEDUP_KEYS + 1;
    let removed = 0;
    for (const k of notificationDedupCache.keys()) {
      notificationDedupCache.delete(k);
      removed += 1;
      if (removed >= overflow) break;
    }
  }
}

export function checkNotificationIdempotency(
  dedupKey: string,
  ttlMs = 3 * 60 * 1000,
  forceRetry = false
): { isDuplicate: boolean; status?: NotificationAttemptStatus } {
  const now = Date.now();
  pruneNotificationDedupCache(now);

  if (!forceRetry) {
    const existing = notificationDedupCache.get(dedupKey);
    if (existing && now < existing.expiresAt) {
      if (existing.status === "SENT") {
        return { isDuplicate: true, status: "SENT" };
      }
      if (
        existing.status === "PENDING" &&
        now - existing.updatedAt < PENDING_INFLIGHT_WINDOW_MS
      ) {
        return { isDuplicate: true, status: "PENDING" };
      }
    }
  }

  notificationDedupCache.set(dedupKey, {
    status: "PENDING",
    expiresAt: now + ttlMs,
    updatedAt: now,
  });
  return { isDuplicate: false, status: "PENDING" };
}

export function markNotificationSent(
  dedupKey: string,
  ttlMs = 3 * 60 * 1000
): void {
  const now = Date.now();
  notificationDedupCache.set(dedupKey, {
    status: "SENT",
    expiresAt: now + ttlMs,
    updatedAt: now,
  });
}

export function markNotificationFailed(dedupKey: string): void {
  const now = Date.now();
  notificationDedupCache.set(dedupKey, {
    status: "FAILED",
    expiresAt: now + 60 * 1000,
    updatedAt: now,
  });
}

export function getNotificationIdempotencyState(
  dedupKey: string
): NotificationDedupEntry | null {
  const entry = notificationDedupCache.get(dedupKey);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const VALID_ISOBMFF_IMAGE_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
  "avif",
  "avis",
]);

export function detectImageMimeFromMagicBytes(
  buf: Buffer
): "image/jpeg" | "image/png" | "image/webp" | "image/heic" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
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
    return "image/png";
  }
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buf.subarray(8, 12).toString("ascii").toLowerCase();
    if (VALID_ISOBMFF_IMAGE_BRANDS.has(brand)) {
      return "image/heic";
    }
  }
  return null;
}

function hasValidImageMagicBytes(buf: Buffer): boolean {
  return detectImageMimeFromMagicBytes(buf) !== null;
}

function isMimeCompatibleWithDetected(
  declaredMime: string,
  detectedMime: "image/jpeg" | "image/png" | "image/webp" | "image/heic"
): boolean {
  if (declaredMime === detectedMime) return true;
  if (
    (declaredMime === "image/heic" || declaredMime === "image/heif") &&
    detectedMime === "image/heic"
  ) {
    return true;
  }
  return false;
}

export async function validateServerImageFiles(
  files: File[],
  options: {
    maxFiles: number;
    maxFileSizeBytes: number;
    maxTotalSizeBytes?: number;
  }
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

  const maxTotalBytes =
    options.maxTotalSizeBytes ??
    Math.min(options.maxFiles * options.maxFileSizeBytes, 20 * 1024 * 1024);
  let runningTotalBytes = 0;

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

    runningTotalBytes += file.size;
    if (runningTotalBytes > maxTotalBytes) {
      const maxTotalMb = Math.round(maxTotalBytes / (1024 * 1024));
      return {
        ok: false,
        error: `첨부 사진의 총 용량이 허용 한도(${maxTotalMb}MB)를 초과했습니다.`,
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

    const detectedMime = detectImageMimeFromMagicBytes(buffer);
    if (!detectedMime || !isMimeCompatibleWithDetected(mime, detectedMime)) {
      return {
        ok: false,
        error: "파일 확장자(MIME)와 실제 이미지 헤더 시그니처가 일치하지 않습니다.",
      };
    }

    validated.push({
      mimeType: detectedMime === "image/heic" ? mime : detectedMime,
      base64: buffer.toString("base64"),
    });
  }

  return { ok: true, validated };
}
