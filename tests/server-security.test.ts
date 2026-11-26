// 파일 경로: tests/server-security.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hashInquiryPasswordAsync,
  verifyInquiryPasswordWithMeta,
  normalizeAndValidateIp,
  getClientIp,
  verifySameOriginRequest,
  checkRateLimit,
  checkInquiryPasswordRateLimit,
  recordInquiryPasswordIpFailure,
  validateInquiryUploadSlotRequest,
  checkNotificationIdempotency,
  markNotificationSent,
  markNotificationFailed,
  detectImageMimeFromMagicBytes,
} from "../lib/server-security";
import { isAuthorizedAdminUser } from "../lib/supabase";
import {
  toInquiryListItem,
  toInquiryDetailItem,
} from "../lib/server-inquiries";

describe("lib/server-security 보안 모듈 단위 테스트", () => {
  it("scrypt 비밀번호 해싱·검증 및 레거시 평문 감지를 수행한다", async () => {
    const hash = await hashInquiryPasswordAsync("pass-1234!");
    assert.ok(hash.startsWith("scrypt$"));

    const ok = await verifyInquiryPasswordWithMeta("pass-1234!", hash);
    assert.deepEqual(ok, { valid: true, isLegacyPlaintext: false });

    const fail = await verifyInquiryPasswordWithMeta("wrong-pw", hash);
    assert.deepEqual(fail, { valid: false, isLegacyPlaintext: false });

    const legacy = await verifyInquiryPasswordWithMeta("1234", "1234");
    assert.deepEqual(legacy, { valid: true, isLegacyPlaintext: true });
  });

  it("신뢰 IP 정규화와 스푸핑 헤더 우회 차단을 수행한다", () => {
    assert.equal(normalizeAndValidateIp("::ffff:192.168.1.10"), "192.168.1.10");
    assert.equal(normalizeAndValidateIp("not-an-ip"), null);

    const req = new Request("https://hanbatmall.com/api/inquiries", {
      headers: {
        "x-forwarded-for": "1.1.1.1, 203.0.113.5",
        "cf-connecting-ip": "198.51.100.7",
      },
    });
    assert.equal(getClientIp(req), "198.51.100.7");
  });

  it("Same-Origin CSRF 검증이 교차 출처 요청을 차단한다", () => {
    const sameOriginReq = new Request("https://hanbatmall.com/api/inquiries", {
      method: "POST",
      headers: {
        origin: "https://hanbatmall.com",
        "sec-fetch-site": "same-origin",
      },
    });
    assert.equal(verifySameOriginRequest(sameOriginReq), true);

    const crossSiteReq = new Request("https://hanbatmall.com/api/inquiries", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        "sec-fetch-site": "cross-site",
      },
    });
    assert.equal(verifySameOriginRequest(crossSiteReq), false);

    const headerlessBotReq = new Request(
      "https://hanbatmall.com/api/analyze-inquiry",
      { method: "POST" }
    );
    assert.equal(verifySameOriginRequest(headerlessBotReq), true);
    assert.equal(
      verifySameOriginRequest(headerlessBotReq, { requireOriginHeader: true }),
      false
    );

    const spoofedVercelHostReq = new Request(
      "https://internal.local/api/inquiries",
      {
        method: "POST",
        headers: {
          origin: "https://attacker-app.vercel.app",
          "x-forwarded-host": "attacker-app.vercel.app",
        },
      }
    );
    assert.equal(verifySameOriginRequest(spoofedVercelHostReq), false);
  });

  it("비밀번호 Rate Limit이 정상 열람은 잠그지 않고 오입력 시에만 IP·게시글 잠금을 차감한다", async () => {
    const counts = new Map<string, number>();
    const rpcRunner = async (
      _fn: string,
      args: Record<string, unknown>
    ) => {
      const key = String(args.p_key);
      const max = Number(args.p_max_attempts);
      const inc = Boolean(args.p_increment);
      const prev = counts.get(key) ?? 0;
      const next = inc ? prev + 1 : prev;
      if (inc && prev < max) {
        counts.set(key, next);
      }
      const allowed = inc ? prev < max : prev < max;
      return {
        data: [
          {
            allowed,
            retry_after_sec: allowed ? 0 : 120,
            current_count: counts.get(key) ?? 0,
          },
        ],
        error: null,
      };
    };

    // 동일 문의글 정상 조회 6회 연속 시에도 pw_verify 잠금이 걸리지 않음
    for (let i = 0; i < 6; i++) {
      const res = await checkInquiryPasswordRateLimit("203.0.113.9", "inq-ok", {
        rpcRunner,
      });
      assert.equal(res.allowed, true);
    }

    // 오입력 5회 기록 후에는 차단됨
    for (let i = 0; i < 5; i++) {
      await recordInquiryPasswordIpFailure("203.0.113.9", "inq-fail", {
        rpcRunner,
      });
    }
    const blocked = await checkInquiryPasswordRateLimit(
      "203.0.113.9",
      "inq-fail",
      { rpcRunner }
    );
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.reason, "lockout");
  });

  it("서명 업로드 슬롯 요청 검증(validateInquiryUploadSlotRequest)이 개수·형식·용량을 차단한다", () => {
    assert.equal(validateInquiryUploadSlotRequest([]).ok, false);
    assert.equal(
      validateInquiryUploadSlotRequest(
        Array.from({ length: 6 }, () => ({
          mimeType: "image/jpeg",
          sizeBytes: 1024,
        }))
      ).ok,
      false
    );
    assert.equal(
      validateInquiryUploadSlotRequest([
        { mimeType: "image/svg+xml", sizeBytes: 1024 },
      ]).ok,
      false
    );
    assert.equal(
      validateInquiryUploadSlotRequest([
        { mimeType: "image/jpeg", sizeBytes: 7 * 1024 * 1024 },
      ]).ok,
      false
    );

    const valid = validateInquiryUploadSlotRequest([
      { mimeType: "image/jpeg", sizeBytes: 420_000 },
      { mimeType: "image/webp", sizeBytes: 310_000 },
    ]);
    assert.equal(valid.ok, true);
    assert.equal(valid.slots?.length, 2);
    assert.equal(valid.slots?.[0].ext, "jpg");
    assert.equal(valid.slots?.[1].ext, "webp");
  });

  it("checkRateLimit fail-closed 모드가 RPC 오류 시 요청을 거부한다", async () => {
    const denied = await checkRateLimit("pw_lockout:test-1", 5, 60_000, {
      failureMode: "fail-closed",
      rpcRunner: async () => ({
        data: null,
        error: { code: "50000", message: "db error" },
      }),
    });
    assert.deepEqual(denied, { allowed: false, retryAfterSec: 30 });

    const allowed = await checkRateLimit("pw_lockout:test-2", 5, 60_000, {
      failureMode: "fail-closed",
      rpcRunner: async () => ({
        data: [{ allowed: true, retry_after_sec: 0, current_count: 1 }],
        error: null,
      }),
    });
    assert.deepEqual(allowed, { allowed: true, retryAfterSec: 0 });
  });

  it("알림 멱등성 상태 머신(PENDING -> FAILED -> 재시도 -> SENT)이 일관되게 동작한다", async () => {
    const id = `test-${Date.now()}`;
    const first = await checkNotificationIdempotency(id, 60_000, false, "telegram");
    assert.equal(first.isDuplicate, false);
    assert.equal(first.status, "PENDING");

    // PENDING 중 중복 차단
    const inflightDup = await checkNotificationIdempotency(
      id,
      60_000,
      false,
      "telegram"
    );
    assert.equal(inflightDup.isDuplicate, true);

    // 실패 기록 후 재시도 허용
    await markNotificationFailed(id, "network timeout", "telegram");
    const retryAfterFail = await checkNotificationIdempotency(
      id,
      60_000,
      false,
      "telegram"
    );
    assert.equal(retryAfterFail.isDuplicate, false);

    // 발송 성공 후 일반 중복 차단, 관리자 forceRetry는 허용
    await markNotificationSent(id, 60_000, "telegram");
    const afterSentDup = await checkNotificationIdempotency(
      id,
      60_000,
      false,
      "telegram"
    );
    assert.equal(afterSentDup.isDuplicate, true);

    const forceRetryRes = await checkNotificationIdempotency(
      id,
      60_000,
      true,
      "telegram"
    );
    assert.equal(forceRetryRes.isDuplicate, false);
  });

  it("이미지 매직 바이트 시그니처로 위조 파일을 식별한다", () => {
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    const fakeHeader = Buffer.from("<html><script>alert(1)</script></html>");

    assert.equal(detectImageMimeFromMagicBytes(jpegHeader), "image/jpeg");
    assert.equal(detectImageMimeFromMagicBytes(pngHeader), "image/png");
    assert.equal(detectImageMimeFromMagicBytes(fakeHeader), null);
  });
});

describe("관리자 권한 및 문의 DTO 개인정보 보호 검증", () => {
  it("이메일 미인증 계정과 user_metadata 위조는 관리자 인가를 거부한다", () => {
    assert.equal(
      isAuthorizedAdminUser({
        id: "u1",
        email: "sunny3815@naver.com",
        email_confirmed_at: undefined,
        app_metadata: {},
        user_metadata: { role: "admin" },
        aud: "authenticated",
        created_at: "",
      }),
      false
    );

    assert.equal(
      isAuthorizedAdminUser({
        id: "u2",
        email: "attacker@example.com",
        email_confirmed_at: "2026-01-01T00:00:00Z",
        app_metadata: {},
        user_metadata: { role: "admin" },
        aud: "authenticated",
        created_at: "",
      }),
      false
    );

    assert.equal(
      isAuthorizedAdminUser({
        id: "u3",
        email: "sunny3815@naver.com",
        email_confirmed_at: "2026-01-01T00:00:00Z",
        app_metadata: { role: "admin" },
        user_metadata: {},
        aud: "authenticated",
        created_at: "",
      }),
      true
    );
  });

  it("비관리자 목록/상세 DTO에서 타인의 전화번호·본명·본문·사진이 마스킹/제거된다", () => {
    const rawRow = {
      id: 101,
      name: "김철수",
      phone: "010-1234-5678",
      inquiry_type: "내 물건 팔기",
      category: "냉장고",
      description: "민감한 주소와 연락처 포함 본문",
      is_notice: false,
      status: "접수",
      admin_reply: "관리자 메모",
      created_at: "2026-11-01T00:00:00Z",
    };

    const publicListItem = toInquiryListItem(rawRow, {
      isAdmin: false,
      images: ["https://signed.example/1.jpg"],
      hasImages: true,
    });
    assert.equal(publicListItem.phone, null);
    assert.equal(publicListItem.name, "김*수");
    assert.equal(publicListItem.description, null);
    assert.deepEqual(publicListItem.images, []);
    assert.equal(publicListItem.admin_reply, null);

    const adminDetail = toInquiryDetailItem(rawRow, {
      isAdmin: true,
      images: ["https://signed.example/1.jpg"],
    });
    assert.equal(adminDetail.phone, "010-1234-5678");
    assert.equal(adminDetail.name, "김철수");
    assert.equal(adminDetail.description, "민감한 주소와 연락처 포함 본문");
  });
});
