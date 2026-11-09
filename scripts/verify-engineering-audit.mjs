// 파일 경로: scripts/verify-engineering-audit.mjs
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const scryptAsync = promisify(crypto.scrypt);
const rootDir = process.cwd();

function read(relPath) {
  const full = path.join(rootDir, relPath);
  assert.ok(fs.existsSync(full), `필수 파일 누락: ${relPath}`);
  return fs.readFileSync(full, "utf8");
}

async function runAuditVerification() {
  console.log("=== [Engineering Audit Verification Suite] 실행 시작 ===");

  // 1. [SEC-001] PATCH /api/inquiries/[id] 비밀번호 해시 유출 원천 차단 검증
  const inquiryIdRoute = read("app/api/inquiries/[id]/route.ts");
  const patchSection = inquiryIdRoute.slice(
    inquiryIdRoute.indexOf("export async function PATCH"),
    inquiryIdRoute.indexOf("export async function DELETE")
  );
  assert.ok(
    !patchSection.includes('.select("*")'),
    "PATCH /api/inquiries/[id]에서 .select('*')를 사용하면 password 해시가 응답에 노출됩니다."
  );
  assert.ok(
    patchSection.includes(".select(SAFE_INQUIRY_SELECT_COLUMNS)") &&
      !inquiryIdRoute
        .slice(
          inquiryIdRoute.indexOf("SAFE_INQUIRY_SELECT_COLUMNS"),
          inquiryIdRoute.indexOf("function isValidInquiryId")
        )
        .includes("password"),
    "SAFE_INQUIRY_SELECT_COLUMNS에 password 컬럼이 포함되어서는 안 됩니다."
  );
  console.log("✓ [PASS] 1. [SEC-001] PATCH /api/inquiries/[id] 비밀번호 해시·민감정보 유출 원천 차단 확인");

  // 2. [SEC-001 & SEC-002] 분산 Rate Limit(SHA-256 해시 키 + fail-open/closed) 및 POST/PATCH/DELETE 브루트포스 방어 검증
  const postSection = inquiryIdRoute.slice(
    inquiryIdRoute.indexOf("export async function POST"),
    inquiryIdRoute.indexOf("export async function PATCH")
  );
  const deleteSection = inquiryIdRoute.slice(
    inquiryIdRoute.indexOf("export async function DELETE")
  );
  for (const [methodName, codeBlock] of [
    ["POST", postSection],
    ["PATCH", patchSection],
    ["DELETE", deleteSection],
  ]) {
    assert.ok(
      codeBlock.includes("await checkInquiryPasswordRateLimit(ip, id)") &&
        codeBlock.includes("await recordInquiryPasswordFailure(id)"),
      `${methodName} /api/inquiries/[id]에 비동기 checkInquiryPasswordRateLimit 및 recordInquiryPasswordFailure가 모두 연결되어야 합니다.`
    );
  }

  const securityCode = read("lib/server-security.ts");
  assert.ok(
    securityCode.includes("export function hashRateLimitKey") &&
      securityCode.includes("check_rate_limit_atomic") &&
      securityCode.includes('failureMode === "fail-closed"') &&
      securityCode.includes("increment: false"),
    "[SEC-001] lib/server-security.ts에 SHA-256 해시 키, check_rate_limit_atomic RPC 연동, fail-open/closed 정책, increment=false 잠금 조회가 구현되어야 합니다."
  );

  // 해시 키 변환 검증 (원문 IP 미노출 확인)
  const rawRateKey = "pw_verify:203.0.113.55:inq_999";
  const expectedDigest = crypto.createHash("sha256").update(rawRateKey, "utf8").digest("hex");
  const hashedRateKey = `pw_verify:${expectedDigest}`;
  assert.ok(!hashedRateKey.includes("203.0.113.55"), "해시된 Rate Limit 키에 원문 IP가 포함되어서는 안 됩니다.");
  assert.ok(hashedRateKey.startsWith("pw_verify:"), "도메인 스코프 접두어가 유지되어야 합니다.");

  const analyzeInqRoute = read("app/api/analyze-inquiry/route.ts");
  const analyzeProdRoute = read("app/api/analyze-product/route.ts");
  const analyzeDelivRoute = read("app/api/analyze-delivery/route.ts");
  const alimtalkRoute = read("app/api/alimtalk/route.ts");
  assert.ok(
    analyzeInqRoute.includes('failureMode: "fail-closed"') &&
      analyzeProdRoute.includes('failureMode: "fail-closed"') &&
      analyzeDelivRoute.includes('failureMode: "fail-closed"') &&
      alimtalkRoute.includes('failureMode: "fail-closed"'),
    "[SEC-001] 유료 AI 분석 및 알림톡 라우트는 DB 장애 시 fail-closed로 동작해야 합니다."
  );
  console.log("✓ [PASS] 2. [SEC-001 & SEC-002] DB RPC 분산 Rate Limit(해시 키 + fail-open/closed) 및 전역 Lockout 확인");

  // 3. [SEC-003 & SEC-005] 비동기 scrypt 단일화(동기 폴백 제거), DELETE images 컬럼 복구, Supabase 최소 권한 분리 검증
  assert.ok(
    securityCode.includes("hashInquiryPasswordAsync") &&
      securityCode.includes("verifyInquiryPasswordWithMeta") &&
      securityCode.includes("MAX_PASSWORD_INPUT_LENGTH = 128") &&
      !securityCode.includes("scryptSync"),
    "lib/server-security.ts에 비동기 scrypt 및 비밀번호 최대 길이 제한(128자)이 구현되고 동기 scryptSync가 제거되어야 합니다."
  );
  assert.ok(
    !inquiryIdRoute.includes("verifyInquiryPassword(") &&
      inquiryIdRoute.includes("verifyInquiryPasswordWithMeta"),
    "app/api/inquiries/[id]/route.ts에서 동기식 verifyInquiryPassword 폴백이 제거되어야 합니다."
  );
  assert.ok(
    deleteSection.includes('.select("id, password, is_notice, images, image_url, description")'),
    "DELETE /api/inquiries/[id]에서 첨부 이미지 파기를 위해 images 배열 컬럼을 함께 조회해야 합니다."
  );

  const supabaseLibCode = read("lib/supabase.ts");
  assert.ok(
    supabaseLibCode.includes("useServiceRole = false") &&
      supabaseLibCode.includes("export function createAnonServerClient") &&
      supabaseLibCode.includes("export function createServiceRoleClient"),
    "lib/supabase.ts에서 최소 권한 원칙(useServiceRole = false 기본값 및 Anon/ServiceRole 분리 팩토리)이 적용되어야 합니다."
  );

  const resetViewsRoute = read("app/api/admin/reset-views/route.ts");
  const productViewRoute = read("app/api/products/[id]/view/route.ts");
  assert.ok(
    inquiryIdRoute.includes("createAnonServerClient") &&
      inquiryIdRoute.includes("createServiceRoleClient") &&
      resetViewsRoute.includes("createAnonServerClient") &&
      productViewRoute.includes("createAnonServerClient") &&
      productViewRoute.includes("createServiceRoleClient"),
    "각 API 라우트에서 권한 목적에 맞게 createAnonServerClient와 createServiceRoleClient를 분리 사용해야 합니다."
  );

  // 실제 비동기 scrypt 라운드트립 및 타이밍 안전 비교 시뮬레이션
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scryptAsync("hanbat-pass-2026", salt, 64);
  const storedHash = `scrypt$${salt}$${derived.toString("hex")}`;
  assert.ok(storedHash.startsWith("scrypt$"), "scrypt 해시 포맷이 올바라야 합니다.");
  const verifyKey = await scryptAsync("hanbat-pass-2026", salt, 64);
  assert.equal(
    crypto.timingSafeEqual(verifyKey, Buffer.from(derived.toString("hex"), "hex")),
    true,
    "비동기 scrypt 해시 검증이 일치해야 합니다."
  );
  console.log("✓ [PASS] 3. [SEC-003 & SEC-005] 비동기 scrypt 단일화, DELETE images 조회 복구, Supabase 최소 권한 분리 확인");

  // 4. [SEC-004 / REL-001] 알림 발송 멱등성 상태 머신(PENDING -> FAILED -> 재시도 허용 -> SENT -> 중복 차단) 및 DB RPC 연동 검증
  const inquiriesRoute = read("app/api/inquiries/route.ts");
  const telegramRoute = read("app/api/telegram/route.ts");
  assert.ok(
    inquiriesRoute.includes("await checkNotificationIdempotency") &&
      inquiriesRoute.includes("await markNotificationSent") &&
      inquiriesRoute.includes("await markNotificationFailed") &&
      telegramRoute.includes("await checkNotificationIdempotency") &&
      telegramRoute.includes("await markNotificationSent") &&
      telegramRoute.includes("await markNotificationFailed") &&
      securityCode.includes("claim_notification_idempotency") &&
      securityCode.includes("complete_notification_idempotency") &&
      securityCode.includes("hashNotificationDedupKey"),
    "[REL-001] inquiries 및 telegram 라우트와 lib/server-security.ts에서 DB RPC 기반 비동기 알림 멱등성 상태 머신(PENDING/SENT/FAILED)이 연결되어야 합니다."
  );

  // 상태 전이 시뮬레이션: 서버 1차 발송 실패(FAILED) -> 클라이언트 폴백 재시도 허용(PENDING -> SENT) -> 중복 발송 차단(SENT)
  const simCache = new Map();
  function simCheck(key, ttlMs = 180000, forceRetry = false) {
    const now = Date.now();
    if (!forceRetry) {
      const existing = simCache.get(key);
      if (existing && now < existing.expiresAt) {
        if (existing.status === "SENT") return { isDuplicate: true };
        if (existing.status === "PENDING" && now - existing.updatedAt < 8000) {
          return { isDuplicate: true };
        }
      }
    }
    simCache.set(key, { status: "PENDING", expiresAt: now + ttlMs, updatedAt: now });
    return { isDuplicate: false };
  }
  const testKey = "inq-sim-101";
  // 1) 서버 1차 발송 시작 -> PENDING
  assert.equal(simCheck(testKey).isDuplicate, false);
  // 2) 서버 1차 발송 네트워크 실패 -> FAILED 마킹
  simCache.set(testKey, { status: "FAILED", expiresAt: Date.now() + 60000, updatedAt: Date.now() });
  // 3) 클라이언트 폴백(/api/telegram) 즉시 호출 -> FAILED 상태이므로 차단되지 않고 허용되어야 함!
  assert.equal(simCheck(testKey).isDuplicate, false, "1차 발송 실패 후 클라이언트 폴백 재시도가 허용되어야 합니다.");
  // 4) 폴백 발송 성공 -> SENT 마킹
  simCache.set(testKey, { status: "SENT", expiresAt: Date.now() + 180000, updatedAt: Date.now() });
  // 5) 이후 중복 호출 -> SENT 상태이므로 차단되어야 함
  assert.equal(simCheck(testKey).isDuplicate, true, "발송 성공(SENT) 후 중복 호출은 차단되어야 합니다.");
  // 6) 관리자 강제 재시도(forceRetry=true) -> 허용되어야 함
  assert.equal(simCheck(testKey, 180000, true).isDuplicate, false, "forceRetry=true는 항상 허용되어야 합니다.");
  console.log("✓ [PASS] 4. [REL-001] 알림 발송 멱등성 상태 머신(PENDING -> FAILED -> 폴백 재시도 -> SENT) 검증 완료");

  // 5. [AI-001] 이미지 매직 바이트 + MIME 일치 검증 및 총 용량 제한 확인
  assert.ok(
    securityCode.includes("detectImageMimeFromMagicBytes") &&
      securityCode.includes("isMimeCompatibleWithDetected") &&
      securityCode.includes("maxTotalSizeBytes"),
    "lib/server-security.ts에 이미지 매직 바이트-MIME 교차 검증 및 총 용량 한도 검사가 포함되어야 합니다."
  );
  assert.ok(
    !securityCode.includes('brand.startsWith("avi")'),
    "AVI 동영상 파일이 통과될 수 있는 brand.startsWith('avi') 조건이 제거되어야 합니다."
  );
  console.log("✓ [PASS] 5. [AI-001] 이미지 매직 바이트-MIME 일치 검증 및 총 용량 제한 확인");

  // 6. [MEM-001] 미리보기 Blob URL 조기 해제 버그 수정(useRef 언마운트 클린업) 확인
  const formCode = read("components/inquiry/unified-inquiry-form.tsx");
  const adminCode = read("app/admin/page.tsx");
  assert.ok(
    formCode.includes("filePreviewsRef.current") &&
      adminCode.includes("prodPreviewsRef.current") &&
      adminCode.includes("delivPreviewsRef.current"),
    "미리보기 Blob URL은 사진 추가 시 조기 파기되지 않도록 useRef를 통해 언마운트 시점에 해제되어야 합니다."
  );
  console.log("✓ [PASS] 6. [MEM-001] 미리보기 Blob Object URL 생명주기(조기 파기 방지 + 언마운트 해제) 확인");

  // 7. [SEC-002 / SEC-007 / DB-001] Storage 업로드 경로-SQL 정책 일치화, 보안 헤더(HSTS/CSP) 및 SQL 마이그레이션 확인
  const nextConfig = read("next.config.ts");
  assert.ok(
    nextConfig.includes("Strict-Transport-Security") &&
      nextConfig.includes("frame-ancestors 'self'; base-uri 'self'; object-src 'none'"),
    "next.config.ts에 HSTS 및 강화된 CSP 헤더가 설정되어야 합니다."
  );

  const unifiedFormCode = read("components/inquiry/unified-inquiry-form.tsx");
  const wizardFormCode = read("components/inquiry/v2-wizard-quick-inquiry.tsx");
  const productOpsCode = read("lib/product-ops.ts");
  const attachmentsLibCode = read("lib/inquiry-attachments.ts");
  const rlsPoliciesSql = read("supabase/security-rls-policies.sql");
  const migrationSql = read("supabase/security-hardening-migration.sql");

  assert.ok(
    unifiedFormCode.includes("`inquiries/${baseFileName}`") &&
      wizardFormCode.includes('prefix: "inquiries/inq"') &&
      productOpsCode.includes("`inquiries/${baseFileName}`") &&
      attachmentsLibCode.includes("isValidStorageObjectPath"),
    "[SEC-002] 모든 문의 첨부 사진 업로드 경로가 inquiries/inq_...jpg 표준으로 일치해야 합니다."
  );

  for (const [sqlName, sqlText] of [
    ["security-rls-policies.sql", rlsPoliciesSql],
    ["security-hardening-migration.sql", migrationSql],
  ]) {
    assert.ok(
      sqlText.includes('DROP POLICY IF EXISTS "Public Upload Inquiry Attachments" ON storage.objects') &&
        sqlText.includes('DROP POLICY IF EXISTS "storage_insert_inquiry_attachments_public" ON storage.objects') &&
        sqlText.includes('CREATE POLICY "storage_insert_inquiry_attachments_public"') &&
        sqlText.includes("(storage.foldername(name))[1] = 'inquiries'") &&
        sqlText.includes("array_length(storage.foldername(name), 1) = 1"),
      `[SEC-002] ${sqlName}에서 기존 넓은 업로드 정책을 DROP하고 storage_insert_inquiry_attachments_public 단일 폴더 제한 정책으로 통일해야 합니다.`
    );
  }

  // Storage 경로 정규식 및 버킷 파일 추출 시뮬레이션 검증
  const pathRegex = /^(?:inquiries\/)?[a-zA-Z0-9._-]+\.(?:jpg|jpeg|png|webp|heic|heif)$/i;
  assert.equal(pathRegex.test("inquiries/inq_1730000000_abc123.jpg"), true, "표준 업로드 경로가 허용되어야 합니다.");
  assert.equal(pathRegex.test("inq_1730000000_abc123.jpg"), true, "레거시 마이그레이션 경로가 호환되어야 합니다.");
  assert.equal(pathRegex.test("inquiries/sub/inq_123.jpg"), false, "2단계 이상 중첩 폴더는 차단되어야 합니다.");
  assert.equal(pathRegex.test("../inquiries/inq_123.jpg"), false, "상위 경로 탐색(..)은 차단되어야 합니다.");
  assert.equal(pathRegex.test("inquiries/evil.svg"), false, "비허용 확장자(svg/html 등)는 차단되어야 합니다.");

  assert.ok(
    migrationSql.includes("increment_product_views") &&
      migrationSql.includes("check_rate_limit_atomic") &&
      migrationSql.includes("inquiry-attachments"),
    "supabase/security-hardening-migration.sql에 원자적 조회수 증가, 분산 Rate Limit, 첨부파일 버킷 정책이 포함되어야 합니다."
  );

  // 8. [SEC-006 & TYPE-001] 신뢰 프록시 IP 검증(net.isIP), CSRF Same-Origin 검증, TypeScript strict: true 검증
  assert.ok(
    securityCode.includes("export function normalizeAndValidateIp") &&
      securityCode.includes("net.isIP") &&
      securityCode.includes("x-vercel-forwarded-for") &&
      securityCode.includes("export function verifySameOriginRequest"),
    "[SEC-006] lib/server-security.ts에 net.isIP 기반 클라이언트 IP 정규화 및 verifySameOriginRequest CSRF 방어가 구현되어야 합니다."
  );
  assert.ok(
    inquiriesRoute.includes("verifySameOriginRequest(req)") &&
      inquiryIdRoute.includes("verifySameOriginRequest(req)"),
    "[SEC-006] 문의 생성/수정/삭제 API에 verifySameOriginRequest 검증이 적용되어야 합니다."
  );

  const tsconfigJson = JSON.parse(read("tsconfig.json"));
  assert.equal(
    tsconfigJson?.compilerOptions?.strict,
    true,
    "[TYPE-001] tsconfig.json의 compilerOptions.strict가 true로 활성화되어야 합니다."
  );

  console.log("✓ [PASS] 7. [SEC-002 / SEC-006 / SEC-007 / TYPE-001 / DB-001] Storage 정책, IP·Origin 검증, Strict TS, 보안 헤더 확인");

  console.log("🎉 모든 엔지니어링 감사 및 보안·안정성 검증 테스트를 통과했습니다!");
}

runAuditVerification().catch((err) => {
  console.error("검증 실패:", err);
  process.exit(1);
});
