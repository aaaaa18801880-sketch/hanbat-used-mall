import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as postInquiry } from "../app/api/inquiries/route";
import { POST as postAnalyzeInquiry } from "../app/api/analyze-inquiry/route";
import { POST as postTelegramWebhook } from "../app/api/telegram/webhook/route";
import { POST as postAlimtalk } from "../app/api/alimtalk/route";

function makeJsonRequest(
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test.describe("핵심 API 라우트 계약 테스트", () => {
  test("POST /api/inquiries: 교차 출처 CSRF 요청을 403으로 차단한다", async () => {
    const req = makeJsonRequest(
      "https://hanbatmall.com/api/inquiries",
      { category: "테스트" },
      { origin: "https://evil.example" }
    );
    const res = await postInquiry(req);
    assert.equal(res.status, 403);
    const json = (await res.json()) as { error?: string };
    assert.ok(json.error);
  });

  test("POST /api/inquiries: 잘못된 JSON 본문을 400으로 거부한다", async () => {
    const req = makeJsonRequest(
      "https://hanbatmall.com/api/inquiries",
      "{invalid-json",
      { origin: "https://hanbatmall.com", "x-forwarded-for": "203.0.113.10" }
    );
    const res = await postInquiry(req);
    assert.equal(res.status, 400);
  });

  test("POST /api/inquiries: 관리자 토큰 없는 공지사항 등록은 401로 거부한다", async () => {
    const req = makeJsonRequest(
      "https://hanbatmall.com/api/inquiries",
      {
        is_notice: true,
        category: "비인가 공지 시도",
        description: "테스트 본문",
      },
      { origin: "https://hanbatmall.com", "x-forwarded-for": "203.0.113.11" }
    );
    const res = await postInquiry(req);
    assert.equal(res.status, 401);
  });

  test("POST /api/inquiries: 허용되지 않은 inquiry_type 및 잘못된 전화번호를 400으로 거부한다", async () => {
    const badTypeReq = makeJsonRequest(
      "https://hanbatmall.com/api/inquiries",
      {
        inquiry_type: "임의의유형",
        category: "삼성 냉장고",
        name: "홍길동",
        phone: "010-1234-5678",
        password: "1234",
      },
      { origin: "https://hanbatmall.com", "x-forwarded-for": "203.0.113.12" }
    );
    const badTypeRes = await postInquiry(badTypeReq);
    assert.equal(badTypeRes.status, 400);

    const badPhoneReq = makeJsonRequest(
      "https://hanbatmall.com/api/inquiries",
      {
        inquiry_type: "구매 문의",
        category: "삼성 냉장고",
        name: "홍길동",
        phone: "123",
        password: "1234",
      },
      { origin: "https://hanbatmall.com", "x-forwarded-for": "203.0.113.13" }
    );
    const badPhoneRes = await postInquiry(badPhoneReq);
    assert.equal(badPhoneRes.status, 400);
  });

  test("POST /api/analyze-inquiry: Origin 누락 및 교차 출처 요청을 403으로 차단한다", async () => {
    const noOriginReq = new NextRequest(
      "https://hanbatmall.com/api/analyze-inquiry",
      { method: "POST" }
    );
    const noOriginRes = await postAnalyzeInquiry(noOriginReq);
    assert.equal(noOriginRes.status, 403);

    const crossOriginReq = new NextRequest(
      "https://hanbatmall.com/api/analyze-inquiry",
      {
        method: "POST",
        headers: { origin: "https://attacker.example" },
      }
    );
    const crossOriginRes = await postAnalyzeInquiry(crossOriginReq);
    assert.equal(crossOriginRes.status, 403);
  });

  test("POST /api/analyze-inquiry: GEMINI_API_KEY 미설정 시 503, 허니팟 입력 시 400을 반환한다", async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    const prevServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.GEMINI_API_KEY;

      const noKeyReq = new NextRequest(
        "https://hanbatmall.com/api/analyze-inquiry",
        {
          method: "POST",
          headers: {
            origin: "https://hanbatmall.com",
            "x-forwarded-for": "203.0.113.21",
          },
          body: new FormData(),
        }
      );
      const noKeyRes = await postAnalyzeInquiry(noKeyReq);
      assert.equal(noKeyRes.status, 503);

      process.env.GEMINI_API_KEY = "dummy-test-key";
      const botForm = new FormData();
      botForm.set("website", "https://spam.example");
      const botReq = new NextRequest(
        "https://hanbatmall.com/api/analyze-inquiry",
        {
          method: "POST",
          headers: {
            origin: "https://hanbatmall.com",
            "x-forwarded-for": "203.0.113.22",
          },
          body: botForm,
        }
      );
      const botRes = await postAnalyzeInquiry(botReq);
      assert.equal(botRes.status, 400);

      const emptyFormReq = new NextRequest(
        "https://hanbatmall.com/api/analyze-inquiry",
        {
          method: "POST",
          headers: {
            origin: "https://hanbatmall.com",
            "x-forwarded-for": "203.0.113.23",
          },
          body: new FormData(),
        }
      );
      const emptyFormRes = await postAnalyzeInquiry(emptyFormReq);
      assert.equal(emptyFormRes.status, 400);
    } finally {
      if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevKey;
      if (prevServiceKey === undefined)
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = prevServiceKey;
    }
  });

  test("POST /api/telegram/webhook: 미설정(503)·토큰 불일치(401)·오류 JSON(400)·비사진 메시지 무시(200) 계약을 지킨다", async () => {
    const prevSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const prevChatId = process.env.TELEGRAM_INGEST_CHAT_ID;
    try {
      delete process.env.TELEGRAM_WEBHOOK_SECRET;
      delete process.env.TELEGRAM_INGEST_CHAT_ID;

      const unconfiguredRes = await postTelegramWebhook(
        makeJsonRequest("https://hanbatmall.com/api/telegram/webhook", {})
      );
      assert.equal(unconfiguredRes.status, 503);

      process.env.TELEGRAM_WEBHOOK_SECRET = "test-webhook-secret-123";
      process.env.TELEGRAM_INGEST_CHAT_ID = "-1001234567890";

      const unauthRes = await postTelegramWebhook(
        makeJsonRequest(
          "https://hanbatmall.com/api/telegram/webhook",
          { update_id: 1 },
          { "x-telegram-bot-api-secret-token": "wrong-secret" }
        )
      );
      assert.equal(unauthRes.status, 401);

      const badJsonRes = await postTelegramWebhook(
        makeJsonRequest(
          "https://hanbatmall.com/api/telegram/webhook",
          "{not-json",
          { "x-telegram-bot-api-secret-token": "test-webhook-secret-123" }
        )
      );
      assert.equal(badJsonRes.status, 400);

      const ignoredRes = await postTelegramWebhook(
        makeJsonRequest(
          "https://hanbatmall.com/api/telegram/webhook",
          {
            update_id: 99,
            message: {
              message_id: 10,
              chat: { id: -1001234567890 },
              date: 1700000000,
              text: "사진 없는 일반 텍스트",
            },
          },
          { "x-telegram-bot-api-secret-token": "test-webhook-secret-123" }
        )
      );
      assert.equal(ignoredRes.status, 200);
      const ignoredJson = (await ignoredRes.json()) as {
        ok?: boolean;
        ignored?: string;
      };
      assert.equal(ignoredJson.ok, true);
      assert.ok(ignoredJson.ignored);
    } finally {
      if (prevSecret === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET;
      else process.env.TELEGRAM_WEBHOOK_SECRET = prevSecret;
      if (prevChatId === undefined) delete process.env.TELEGRAM_INGEST_CHAT_ID;
      else process.env.TELEGRAM_INGEST_CHAT_ID = prevChatId;
    }
  });

  test("POST /api/alimtalk: 비인가 관리자 토큰 없는 호출은 401을 반환한다", async () => {
    const req = makeJsonRequest("https://hanbatmall.com/api/alimtalk", {
      phone: "010-1234-5678",
    });
    const res = await postAlimtalk(req);
    assert.equal(res.status, 401);
  });
});
