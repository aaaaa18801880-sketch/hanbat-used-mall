import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyGeminiError,
  GeminiBudgetExceededError,
  GeminiRateLimitError,
  generateGeminiWithFallback,
  getGeminiErrorStatus,
  resetGeminiRuntimeCachesForTest,
  resolveGeminiDailyLimit,
} from "../lib/server-gemini";

function makeMockResponse(text: string) {
  return { text } as Awaited<
    ReturnType<
      import("@google/genai").GoogleGenAI["models"]["generateContent"]
    >
  >;
}

test("resolveGeminiDailyLimit은 기본값 500과 0(비활성) 및 상한 10000을 안전하게 파싱한다", () => {
  assert.equal(resolveGeminiDailyLimit(undefined), 500);
  assert.equal(resolveGeminiDailyLimit(""), 500);
  assert.equal(resolveGeminiDailyLimit("invalid"), 500);
  assert.equal(resolveGeminiDailyLimit("0"), 0);
  assert.equal(resolveGeminiDailyLimit("-10"), 0);
  assert.equal(resolveGeminiDailyLimit("300"), 300);
  assert.equal(resolveGeminiDailyLimit("99999"), 10000);
});

test("classifyGeminiError는 429·404·thinking·503 에러를 정확히 구분한다", () => {
  assert.equal(classifyGeminiError(new Error("429 RESOURCE_EXHAUSTED")), "rate_limit");
  assert.equal(classifyGeminiError(new Error("404 model not found")), "model_not_found");
  assert.equal(
    classifyGeminiError(new Error("400 thinkingBudget is not supported")),
    "thinking_unsupported"
  );
  assert.equal(classifyGeminiError(new Error("503 Service Unavailable")), "transient");
  assert.equal(classifyGeminiError(new Error("403 API_KEY_INVALID")), "fatal");
});

test("일일 예산 초과 시 Gemini 모델 호출을 0회 실행하고 429 GeminiBudgetExceededError를 반환한다", async () => {
  resetGeminiRuntimeCachesForTest();
  let calls = 0;

  await assert.rejects(
    async () => {
      await generateGeminiWithFallback({
        apiKey: "test-key",
        defaultModel: "gemini-3.8-flash",
        fallbackModel: "gemini-3.5-flash-lite",
        prompt: "test",
        imageParts: [],
        budgetChecker: async () => ({
          allowed: false,
          dailyLimit: 500,
          retryAfterSec: 1800,
        }),
        callModel: async () => {
          calls += 1;
          return makeMockResponse('{"ok":true}');
        },
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof GeminiBudgetExceededError);
      assert.equal(getGeminiErrorStatus(err), 429);
      return true;
    }
  );

  assert.equal(calls, 0);
});

test("429 속도 제한 발생 시 4개 모델 연쇄 호출 없이 백오프 후 동일 모델 1회만 재시도한다", async () => {
  resetGeminiRuntimeCachesForTest();
  const attemptedModels: string[] = [];
  const sleepCalls: number[] = [];

  await assert.rejects(
    async () => {
      await generateGeminiWithFallback({
        apiKey: "test-key",
        defaultModel: "gemini-3.8-flash",
        fallbackModel: "gemini-3.5-flash-lite",
        prompt: "test",
        imageParts: [],
        skipDailyBudget: true,
        rateLimitBackoffMs: 10,
        sleep: async (ms) => {
          sleepCalls.push(ms);
        },
        callModel: async ({ model }) => {
          attemptedModels.push(model);
          throw new Error("429 RESOURCE_EXHAUSTED");
        },
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof GeminiRateLimitError);
      assert.equal(getGeminiErrorStatus(err), 429);
      return true;
    }
  );

  assert.deepEqual(attemptedModels, ["gemini-3.8-flash", "gemini-3.8-flash"]);
  assert.deepEqual(sleepCalls, [10]);
});

test("404 모델은 쿨다운 캐시에 기록되어 다음 요청부터 즉시 건너뛴다", async () => {
  resetGeminiRuntimeCachesForTest();
  const attemptedModels: string[] = [];

  const callModel = async ({ model }: { model: string }) => {
    attemptedModels.push(model);
    if (model === "gemini-missing-model") {
      throw new Error("404 model not found");
    }
    return makeMockResponse('{"ok":true}');
  };

  const first = await generateGeminiWithFallback({
    apiKey: "test-key",
    defaultModel: "gemini-missing-model",
    fallbackModel: "gemini-3.5-flash-lite",
    prompt: "first",
    imageParts: [],
    skipDailyBudget: true,
    callModel,
  });
  assert.equal(first.modelUsed, "gemini-3.5-flash-lite");

  const second = await generateGeminiWithFallback({
    apiKey: "test-key",
    defaultModel: "gemini-missing-model",
    fallbackModel: "gemini-3.5-flash-lite",
    prompt: "second",
    imageParts: [],
    skipDailyBudget: true,
    callModel,
  });
  assert.equal(second.modelUsed, "gemini-3.5-flash-lite");

  assert.deepEqual(attemptedModels, [
    "gemini-missing-model",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash-lite",
  ]);
});

test("thinkingConfig 미지원 모델은 캐시되어 두 번째 요청부터 thinkingConfig 없이 1회만 호출된다", async () => {
  resetGeminiRuntimeCachesForTest();
  const seenThinkingFlags: boolean[] = [];

  const callModel = async ({
    config,
  }: {
    model: string;
    config: Record<string, unknown>;
  }) => {
    const hasThinking = "thinkingConfig" in config;
    seenThinkingFlags.push(hasThinking);
    if (hasThinking) {
      throw new Error("400 thinkingBudget is not supported by this model");
    }
    return makeMockResponse('{"ok":true}');
  };

  await generateGeminiWithFallback({
    apiKey: "test-key",
    defaultModel: "gemini-3.8-flash",
    fallbackModel: "gemini-3.5-flash-lite",
    prompt: "first",
    imageParts: [],
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
    },
    skipDailyBudget: true,
    callModel,
  });

  await generateGeminiWithFallback({
    apiKey: "test-key",
    defaultModel: "gemini-3.8-flash",
    fallbackModel: "gemini-3.5-flash-lite",
    prompt: "second",
    imageParts: [],
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
    },
    skipDailyBudget: true,
    callModel,
  });

  assert.deepEqual(seenThinkingFlags, [true, false, false]);
});
