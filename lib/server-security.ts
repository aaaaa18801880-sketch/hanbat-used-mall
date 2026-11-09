// 파일 경로: lib/server-security.ts
import crypto from "crypto";
import net from "net";
import { promisify } from "util";
import { NextRequest } from "next/server";
import {
  createAnonServerClient,
  createServiceRoleClient,
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

    // [SEC-005] 최소 권한 원칙: JWT 검증 시 Service Role 대신 Anon 클라이언트 사용
    const client = createAnonServerClient(token);
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

export type RateLimitFailureMode = "fail-open" | "fail-closed";

export interface RateLimitOptions {
  failureMode?: RateLimitFailureMode;
  increment?: boolean;
  rpcRunner?: (
    fnName: string,
    args: Record<string, unknown>
  ) => Promise<{
    data: unknown;
    error: { code?: string; message?: string } | null;
  }>;
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

function hasServiceRoleConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function isRpcMissingError(
  err: { code?: string; message?: string } | null | undefined
): boolean {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  return (
    err.code === "PGRST202" ||
    err.code === "42883" ||
    msg.includes("could not find the function") ||
    msg.includes("does not exist")
  );
}

/**
 * [SEC-001] 분산 Rate Limit DB 저장용 SHA-256 해시 키 생성기
 * - DB(api_rate_limits.rate_key)에 원문 IP나 민감 식별자가 평문으로 저장되지 않도록 보호합니다.
 * - 키 앞단의 도메인 스코프(예: pw_verify, pw_lockout, inquiry_create 등)만 접두어로 유지합니다.
 */
export function hashRateLimitKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  const colonIdx = trimmed.indexOf(":");
  const rawScope = colonIdx > 0 ? trimmed.slice(0, colonIdx) : "rl";
  const safeScope = rawScope.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "rl";
  const digest = crypto
    .createHash("sha256")
    .update(trimmed, "utf8")
    .digest("hex");
  return `${safeScope}:${digest}`;
}

/**
 * [REL-001] 알림 발송 멱등성 DB 저장용 SHA-256 해시 키 생성기
 * - 폴백 키에 고객명·제목 등이 포함되더라도 DB에는 해시만 저장됩니다.
 */
export function hashNotificationDedupKey(
  rawDedupKey: string,
  channel = "telegram"
): string {
  const safeChannel = channel.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16) || "telegram";
  const digest = crypto
    .createHash("sha256")
    .update(`${safeChannel}:${rawDedupKey.trim()}`, "utf8")
    .digest("hex");
  return `notif:${safeChannel}:${digest}`;
}

/**
 * [SEC-006] IP 문자열 정규화 및 유효성 검증 (IPv4 / IPv6 / IPv4-mapped IPv6 / 포트 분리)
 * - 유효한 IP 형식이 아닌 임의 문자열(헤더 인젝션·스푸핑)은 null을 반환하여 Rate Limit 키 오염을 방지합니다.
 */
export function normalizeAndValidateIp(raw?: string | null): string | null {
  if (!raw) return null;
  let candidate = raw.trim();
  if (!candidate || candidate.length > 64) return null;

  if (candidate.startsWith("[")) {
    const closeBracket = candidate.indexOf("]");
    if (closeBracket > 1) {
      candidate = candidate.slice(1, closeBracket);
    }
  } else if (
    candidate.includes(".") &&
    candidate.includes(":") &&
    candidate.indexOf(":") === candidate.lastIndexOf(":")
  ) {
    candidate = candidate.slice(0, candidate.indexOf(":"));
  }

  const zoneIdx = candidate.indexOf("%");
  if (zoneIdx > 0) {
    candidate = candidate.slice(0, zoneIdx);
  }

  if (candidate.toLowerCase().startsWith("::ffff:")) {
    const mapped = candidate.slice(7);
    if (net.isIP(mapped) === 4) {
      return mapped;
    }
  }

  const version = net.isIP(candidate);
  if (version === 4) return candidate;
  if (version === 6) return candidate.toLowerCase();
  return null;
}

/**
 * [SEC-006] 신뢰 프록시 헤더 우선순위 및 net.isIP 검증 기반 클라이언트 IP 추출
 * 1) 플랫폼이 직접 주입하는 신뢰 헤더(x-vercel-forwarded-for, cf-connecting-ip, x-real-ip)를 우선 검증
 * 2) 일반 x-forwarded-for는 우측(신뢰 프록시 홉)부터 역순으로 탐색하여 첫 번째 유효 IP를 채택
 */
export function getClientIp(req: NextRequest | Request): string {
  const vercelForwarded = req.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    const hops = vercelForwarded.split(",");
    for (let i = hops.length - 1; i >= 0; i--) {
      const valid = normalizeAndValidateIp(hops[i]);
      if (valid) return valid;
    }
  }

  const cfIp = normalizeAndValidateIp(req.headers.get("cf-connecting-ip"));
  if (cfIp) return cfIp;

  const realIp = normalizeAndValidateIp(req.headers.get("x-real-ip"));
  if (realIp) return realIp;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",");
    for (let i = hops.length - 1; i >= 0; i--) {
      const valid = normalizeAndValidateIp(hops[i]);
      if (valid) return valid;
    }
  }

  return "unknown-ip";
}

/**
 * [SEC-006] 상태 변경(POST/PATCH/DELETE) API에 대한 Cross-Origin(CSRF) 요청 검증
 */
export function verifySameOriginRequest(req: NextRequest | Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const reqOrigin = new URL(req.url).origin;
    if (origin === reqOrigin) return true;
    const host =
      req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    }
    return false;
  } catch {
    return false;
  }
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

export function checkRateLimitMemory(
  hashedKey: string,
  maxAttempts: number,
  windowMs: number,
  increment = true
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  pruneRateBuckets(now);

  const current = rateBuckets.get(hashedKey);

  if (!increment) {
    if (!current || now > current.resetAt) {
      return { allowed: true, retryAfterSec: 0 };
    }
    if (current.count >= maxAttempts) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((current.resetAt - now) / 1000)
      );
      return { allowed: false, retryAfterSec };
    }
    return { allowed: true, retryAfterSec: 0 };
  }

  if (!current || now > current.resetAt) {
    rateBuckets.set(hashedKey, { count: 1, resetAt: now + windowMs });
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
 * [SEC-001] DB RPC(check_rate_limit_atomic) 기반 멀티 인스턴스 분산 Rate Limit
 * - 원문 키 대신 SHA-256 해시 키(hashRateLimitKey)를 DB에 전달합니다.
 * - 기능별 장애 정책(failureMode):
 *   * 'fail-closed': 비밀번호 검증·유료 AI 분석·알림톡 등 고위험 경로는 런타임 DB 장애 시 요청을 차단합니다.
 *   * 'fail-open': 고객 문의 작성·조회수 등 가용성 우선 경로는 DB 장애 시 인메모리 버킷으로 폴백합니다.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  options?: RateLimitOptions
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const failureMode = options?.failureMode ?? "fail-open";
  const increment = options?.increment ?? true;
  const hashedKey = hashRateLimitKey(key);
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  const runner =
    options?.rpcRunner ??
    (hasServiceRoleConfig()
      ? async (fnName: string, args: Record<string, unknown>) => {
          const client = createServiceRoleClient();
          const res = await client.rpc(fnName, args);
          return {
            data: res.data as unknown,
            error: res.error as { code?: string; message?: string } | null,
          };
        }
      : null);

  if (!runner) {
    return checkRateLimitMemory(hashedKey, maxAttempts, windowMs, increment);
  }

  try {
    const { data, error } = await runner("check_rate_limit_atomic", {
      p_key: hashedKey,
      p_max_attempts: maxAttempts,
      p_window_sec: windowSec,
      p_increment: increment,
    });

    if (!error && data) {
      const row = (Array.isArray(data) ? data[0] : data) as
        | {
            allowed?: boolean;
            retry_after_sec?: number;
            current_count?: number;
          }
        | undefined;
      if (row && typeof row.allowed === "boolean") {
        const retryAfterSec = Math.max(0, Number(row.retry_after_sec) || 0);
        const currentCount = Math.max(0, Number(row.current_count) || 0);
        const now = Date.now();
        rateBuckets.set(hashedKey, {
          count: currentCount,
          resetAt:
            retryAfterSec > 0 ? now + retryAfterSec * 1000 : now + windowMs,
        });
        return { allowed: row.allowed, retryAfterSec };
      }
    }

    if (error && isRpcMissingError(error)) {
      return checkRateLimitMemory(hashedKey, maxAttempts, windowMs, increment);
    }

    if (failureMode === "fail-closed") {
      return { allowed: false, retryAfterSec: 30 };
    }
    return checkRateLimitMemory(hashedKey, maxAttempts, windowMs, increment);
  } catch {
    if (failureMode === "fail-closed") {
      return { allowed: false, retryAfterSec: 30 };
    }
    return checkRateLimitMemory(hashedKey, maxAttempts, windowMs, increment);
  }
}

/**
 * 문의 게시글 비밀번호 검증 전용 이중 브루트포스 방어 (분산 RPC + Fail-Closed)
 * 1) 게시글 ID 전역 실패 누적 Lockout 조회(increment=false): 다중 IP 분산 공격 시 15분간 10회 실패 도달 시 잠금
 * 2) IP + 게시글 ID 기준 시도 차감(increment=true): 5분당 최대 5회 시도 허용
 */
export async function checkInquiryPasswordRateLimit(
  ip: string,
  inquiryId: string,
  options?: Pick<RateLimitOptions, "rpcRunner">
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const lockout = await checkRateLimit(
    `pw_lockout:${inquiryId}`,
    10,
    15 * 60 * 1000,
    {
      failureMode: "fail-closed",
      increment: false,
      rpcRunner: options?.rpcRunner,
    }
  );
  if (!lockout.allowed) {
    return lockout;
  }

  return checkRateLimit(`pw_verify:${ip}:${inquiryId}`, 5, 5 * 60 * 1000, {
    failureMode: "fail-closed",
    increment: true,
    rpcRunner: options?.rpcRunner,
  });
}

export async function recordInquiryPasswordFailure(
  inquiryId: string,
  options?: Pick<RateLimitOptions, "rpcRunner">
): Promise<void> {
  await checkRateLimit(`pw_lockout:${inquiryId}`, 10, 15 * 60 * 1000, {
    failureMode: "fail-closed",
    increment: true,
    rpcRunner: options?.rpcRunner,
  });
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

function checkNotificationIdempotencyMemory(
  hashedKey: string,
  ttlMs = 3 * 60 * 1000,
  forceRetry = false
): { isDuplicate: boolean; status?: NotificationAttemptStatus } {
  const now = Date.now();
  pruneNotificationDedupCache(now);

  if (!forceRetry) {
    const existing = notificationDedupCache.get(hashedKey);
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

  notificationDedupCache.set(hashedKey, {
    status: "PENDING",
    expiresAt: now + ttlMs,
    updatedAt: now,
  });
  return { isDuplicate: false, status: "PENDING" };
}

/**
 * [REL-001] DB RPC(claim_notification_idempotency) 기반 멀티 인스턴스 알림 발송 멱등성 검증
 * - PENDING(발송 중) -> SENT(완료) / FAILED(실패 시 폴백 재시도 즉시 허용) 상태 전이를 원자적으로 제어합니다.
 */
export async function checkNotificationIdempotency(
  dedupKey: string,
  ttlMs = 3 * 60 * 1000,
  forceRetry = false,
  channel = "telegram"
): Promise<{ isDuplicate: boolean; status?: NotificationAttemptStatus }> {
  const hashedKey = hashNotificationDedupKey(dedupKey, channel);
  const ttlSec = Math.max(10, Math.ceil(ttlMs / 1000));
  const stalePendingSec = Math.max(
    3,
    Math.ceil(PENDING_INFLIGHT_WINDOW_MS / 1000)
  );

  if (hasServiceRoleConfig()) {
    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase.rpc(
        "claim_notification_idempotency",
        {
          p_dedup_key: hashedKey,
          p_channel: channel,
          p_ttl_sec: ttlSec,
          p_stale_pending_sec: stalePendingSec,
          p_force_retry: forceRetry,
        }
      );

      if (!error && data) {
        const row = (Array.isArray(data) ? data[0] : data) as
          | {
              is_duplicate?: boolean;
              current_status?: string;
            }
          | undefined;
        if (row && typeof row.is_duplicate === "boolean") {
          const status =
            (row.current_status as NotificationAttemptStatus) || "PENDING";
          const now = Date.now();
          notificationDedupCache.set(hashedKey, {
            status,
            expiresAt: now + ttlMs,
            updatedAt: now,
          });
          return { isDuplicate: row.is_duplicate, status };
        }
      }
    } catch {
      // DB 장애 시 알림 유실 방지를 위해 인메모리 상태 머신으로 폴백 (fail-open)
    }
  }

  return checkNotificationIdempotencyMemory(hashedKey, ttlMs, forceRetry);
}

export async function markNotificationSent(
  dedupKey: string,
  ttlMs = 3 * 60 * 1000,
  channel = "telegram"
): Promise<void> {
  const hashedKey = hashNotificationDedupKey(dedupKey, channel);
  const now = Date.now();
  notificationDedupCache.set(hashedKey, {
    status: "SENT",
    expiresAt: now + ttlMs,
    updatedAt: now,
  });

  if (hasServiceRoleConfig()) {
    try {
      const supabase = createServiceRoleClient();
      await supabase.rpc("complete_notification_idempotency", {
        p_dedup_key: hashedKey,
        p_status: "SENT",
        p_ttl_sec: Math.max(10, Math.ceil(ttlMs / 1000)),
        p_error: null,
      });
    } catch {
      // Non-blocking fallback
    }
  }
}

export async function markNotificationFailed(
  dedupKey: string,
  errorMessage?: string,
  channel = "telegram"
): Promise<void> {
  const hashedKey = hashNotificationDedupKey(dedupKey, channel);
  const now = Date.now();
  notificationDedupCache.set(hashedKey, {
    status: "FAILED",
    expiresAt: now + 60 * 1000,
    updatedAt: now,
  });

  if (hasServiceRoleConfig()) {
    try {
      const supabase = createServiceRoleClient();
      await supabase.rpc("complete_notification_idempotency", {
        p_dedup_key: hashedKey,
        p_status: "FAILED",
        p_ttl_sec: 60,
        p_error: errorMessage ? errorMessage.slice(0, 240) : "dispatch_failed",
      });
    } catch {
      // Non-blocking fallback
    }
  }
}

export function getNotificationIdempotencyState(
  dedupKey: string,
  channel = "telegram"
): NotificationDedupEntry | null {
  const hashedKey = hashNotificationDedupKey(dedupKey, channel);
  const entry =
    notificationDedupCache.get(hashedKey) ??
    notificationDedupCache.get(dedupKey);
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
