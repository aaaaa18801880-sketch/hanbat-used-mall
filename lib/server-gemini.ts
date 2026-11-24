import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, validateServerImageFiles } from "./server-security";

export interface GeminiInlineImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

/**
 * FormData에서 업로드된 이미지 파일을 추출해 서버 보안 검증 후 Gemini inlineData 파트로 변환합니다.
 */
export async function extractValidatedImageParts(
  formData: FormData,
  options: {
    maxFiles: number;
    maxFileSizeBytes: number;
    fallbackErrorMessage: string;
    supportSingleFileField?: boolean;
  }
): Promise<
  | { ok: true; count: number; imageParts: GeminiInlineImagePart[] }
  | { ok: false; error: string }
> {
  const multipleFiles = formData.getAll("files");
  const entries =
    options.supportSingleFileField && multipleFiles.length === 0
      ? formData.getAll("file")
      : multipleFiles;
  const files = entries.filter((item): item is File => item instanceof File);

  const fileValidation = await validateServerImageFiles(files, {
    maxFiles: options.maxFiles,
    maxFileSizeBytes: options.maxFileSizeBytes,
  });

  if (!fileValidation.ok || !fileValidation.validated) {
    return {
      ok: false,
      error: fileValidation.error || options.fallbackErrorMessage,
    };
  }

  return {
    ok: true,
    count: fileValidation.validated.length,
    imageParts: fileValidation.validated.map((item) => ({
      inlineData: {
        mimeType: item.mimeType,
        data: item.base64,
      },
    })),
  };
}

const LIVE_FLASH_FALLBACK_CHAIN = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.7-flash",
  "gemini-flash-latest",
] as const;

const DEFAULT_DAILY_GEMINI_LIMIT = 500;
const MAX_DAILY_GEMINI_LIMIT = 10000;
const DAY_WINDOW_MS = 24 * 60 * 60 * 1000;
const UNAVAILABLE_MODEL_TTL_MS = 30 * 60 * 1000;
const RATE_LIMIT_BACKOFF_MS = 1500;
const DEFAULT_MAX_MODEL_ATTEMPTS = 2;

const unavailableModels = new Map<string, number>();
const thinkingUnsupportedModels = new Set<string>();

export type GeminiErrorCategory =
  | "rate_limit"
  | "model_not_found"
  | "thinking_unsupported"
  | "transient"
  | "fatal";

export class GeminiBudgetExceededError extends Error {
  readonly status = 429;
  readonly retryAfterSec: number;
  readonly dailyLimit: number;

  constructor(dailyLimit: number, retryAfterSec = 3600) {
    super(
      `오늘의 Gemini AI 호출 안전 한도(${dailyLimit}회/일)에 도달했습니다. GEMINI_DAILY_LIMIT 설정을 확인하거나 내일 다시 시도해 주세요.`
    );
    this.name = "GeminiBudgetExceededError";
    this.dailyLimit = dailyLimit;
    this.retryAfterSec = retryAfterSec;
  }
}

export class GeminiRateLimitError extends Error {
  readonly status = 429;

  constructor(message?: string) {
    super(
      message ||
        "Gemini API 요청 한도(429)에 도달했습니다. 잠시 후 다시 시도해 주세요."
    );
    this.name = "GeminiRateLimitError";
  }
}

export function getGeminiErrorStatus(err: unknown): number {
  if (
    err instanceof GeminiBudgetExceededError ||
    err instanceof GeminiRateLimitError
  ) {
    return 429;
  }
  if (classifyGeminiError(err) === "rate_limit") {
    return 429;
  }
  return 500;
}

export function classifyGeminiError(err: unknown): GeminiErrorCategory {
  const msg = err instanceof Error ? err.message : String(err || "");
  const lowerMsg = msg.toLowerCase();

  if (
    msg.includes("429") ||
    lowerMsg.includes("resource_exhausted") ||
    lowerMsg.includes("rate limit") ||
    lowerMsg.includes("quota")
  ) {
    return "rate_limit";
  }

  if (
    msg.includes("404") ||
    lowerMsg.includes("not found") ||
    lowerMsg.includes("no longer available")
  ) {
    return "model_not_found";
  }

  if (/thinking/i.test(msg)) {
    return "thinking_unsupported";
  }

  if (
    msg.includes("500") ||
    msg.includes("503") ||
    lowerMsg.includes("unavailable") ||
    lowerMsg.includes("internal") ||
    lowerMsg.includes("timeout") ||
    lowerMsg.includes("aborted") ||
    (err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError"))
  ) {
    return "transient";
  }

  return "fatal";
}

export function resolveGeminiDailyLimit(raw?: string): number {
  if (raw === undefined || raw === null || raw.trim() === "") {
    return DEFAULT_DAILY_GEMINI_LIMIT;
  }
  const parsed = Number(raw.trim());
  if (!Number.isFinite(parsed)) {
    return DEFAULT_DAILY_GEMINI_LIMIT;
  }
  if (parsed <= 0) {
    return 0;
  }
  return Math.min(MAX_DAILY_GEMINI_LIMIT, Math.floor(parsed));
}

function getKstDateKey(nowMs = Date.now()): string {
  const kstMs = nowMs + 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString().slice(0, 10);
}

export async function checkGeminiDailyBudget(
  options?: {
    dailyLimit?: number;
    nowMs?: number;
    rateLimitRunner?: (
      key: string,
      maxAttempts: number,
      windowMs: number
    ) => Promise<{ allowed: boolean; retryAfterSec: number }>;
  }
): Promise<{ allowed: boolean; dailyLimit: number; retryAfterSec: number }> {
  const dailyLimit =
    typeof options?.dailyLimit === "number"
      ? options.dailyLimit
      : resolveGeminiDailyLimit(process.env.GEMINI_DAILY_LIMIT);

  if (dailyLimit <= 0) {
    return { allowed: true, dailyLimit: 0, retryAfterSec: 0 };
  }

  const dateKey = getKstDateKey(options?.nowMs);
  const rateKey = `gemini_daily:${dateKey}`;
  const runner =
    options?.rateLimitRunner ??
    ((key, max, win) =>
      checkRateLimit(key, max, win, { failureMode: "fail-open" }));

  const res = await runner(rateKey, dailyLimit, DAY_WINDOW_MS);
  return {
    allowed: res.allowed,
    dailyLimit,
    retryAfterSec: res.retryAfterSec,
  };
}

function isModelMarkedUnavailable(model: string, nowMs = Date.now()): boolean {
  const expiresAt = unavailableModels.get(model);
  if (!expiresAt) return false;
  if (nowMs >= expiresAt) {
    unavailableModels.delete(model);
    return false;
  }
  return true;
}

function stripThinkingConfig(
  config: Record<string, unknown>
): Record<string, unknown> {
  if (!("thinkingConfig" in config)) return config;
  const next = { ...config };
  delete next.thinkingConfig;
  return next;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resetGeminiRuntimeCachesForTest(): void {
  unavailableModels.clear();
  thinkingUnsupportedModels.clear();
}

type GenerateContentResult = Awaited<
  ReturnType<GoogleGenAI["models"]["generateContent"]>
>;

/**
 * Gemini 모델을 호출하고 비용·호출 폭주를 방지하는 안전 가드를 적용합니다.
 * - 일일 호출 예산 가드(GEMINI_DAILY_LIMIT, 기본 500회/일)
 * - 404 모델 30분 쿨다운 캐시(존재하지 않는 모델 반복 호출 차단)
 * - thinkingConfig 미지원 모델 캐시(매 요청 2중 호출 차단)
 * - 429(속도 제한) 시 4개 모델 연쇄 호출 금지 → 짧은 백오프 후 최대 1회만 재시도
 * - 전체 시도 횟수 상한(기본 2회)으로 장애 시 연쇄 호출 폭증 차단
 */
export async function generateGeminiWithFallback(options: {
  apiKey: string;
  defaultModel: string;
  fallbackModel: string;
  prompt: string;
  imageParts: GeminiInlineImagePart[];
  config?: Record<string, unknown>;
  timeoutMs?: number;
  maxAttempts?: number;
  skipDailyBudget?: boolean;
  rateLimitBackoffMs?: number;
  budgetChecker?: () => Promise<{
    allowed: boolean;
    dailyLimit: number;
    retryAfterSec: number;
  }>;
  sleep?: (ms: number) => Promise<void>;
  callModel?: (params: {
    model: string;
    contents: unknown;
    config: Record<string, unknown>;
  }) => Promise<GenerateContentResult>;
}): Promise<{
  text: string;
  modelUsed: string;
  response: GenerateContentResult;
}> {
  if (!options.skipDailyBudget) {
    const budget = options.budgetChecker
      ? await options.budgetChecker()
      : await checkGeminiDailyBudget();
    if (!budget.allowed) {
      throw new GeminiBudgetExceededError(
        budget.dailyLimit,
        budget.retryAfterSec
      );
    }
  }

  const ai = options.callModel
    ? null
    : new GoogleGenAI({
        apiKey: options.apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

  const invokeModel =
    options.callModel ??
    ((params: {
      model: string;
      contents: unknown;
      config: Record<string, unknown>;
    }) =>
      ai!.models.generateContent({
        model: params.model,
        contents: params.contents as Parameters<
          GoogleGenAI["models"]["generateContent"]
        >[0]["contents"],
        config: params.config,
      }));

  const sleep = options.sleep ?? defaultSleep;
  const backoffMs =
    typeof options.rateLimitBackoffMs === "number" &&
    options.rateLimitBackoffMs >= 0
      ? options.rateLimitBackoffMs
      : RATE_LIMIT_BACKOFF_MS;

  const contents = [
    {
      role: "user",
      parts: [{ text: options.prompt }, ...options.imageParts],
    },
  ];
  const baseConfig = options.config ?? { responseMimeType: "application/json" };
  const hasTools =
    Array.isArray(baseConfig.tools) && baseConfig.tools.length > 0;
  const resolvedTimeoutMs =
    typeof options.timeoutMs === "number" && options.timeoutMs > 0
      ? options.timeoutMs
      : hasTools
      ? 40000
      : 25000;

  const allCandidates = Array.from(
    new Set(
      [
        options.defaultModel,
        options.fallbackModel,
        ...LIVE_FLASH_FALLBACK_CHAIN,
      ]
        .map((m) => m.trim())
        .filter(Boolean)
    )
  );

  const nowMs = Date.now();
  const activeCandidates = allCandidates.filter(
    (m) => !isModelMarkedUnavailable(m, nowMs)
  );
  const candidateModels =
    activeCandidates.length > 0 ? activeCandidates : allCandidates;

  const maxAttempts = Math.max(
    1,
    Math.min(
      candidateModels.length,
      options.maxAttempts ?? DEFAULT_MAX_MODEL_ATTEMPTS
    )
  );

  let lastError: unknown = null;
  let attemptsUsed = 0;

  for (let i = 0; i < candidateModels.length && attemptsUsed < maxAttempts; i++) {
    const model = candidateModels[i];
    attemptsUsed += 1;

    const effectiveBaseConfig = thinkingUnsupportedModels.has(model)
      ? stripThinkingConfig(baseConfig)
      : baseConfig;

    try {
      const response = await invokeModel({
        model,
        contents,
        config: {
          ...effectiveBaseConfig,
          abortSignal: AbortSignal.timeout(resolvedTimeoutMs),
        },
      });
      const text = response.text?.trim() || "";
      if (!text && attemptsUsed < maxAttempts && i < candidateModels.length - 1) {
        lastError = new Error(`Empty response from ${model}`);
        continue;
      }
      return {
        text,
        modelUsed: model,
        response,
      };
    } catch (modelErr: unknown) {
      lastError = modelErr;
      const category = classifyGeminiError(modelErr);

      if (category === "thinking_unsupported" && "thinkingConfig" in effectiveBaseConfig) {
        thinkingUnsupportedModels.add(model);
        const strippedConfig = stripThinkingConfig(effectiveBaseConfig);
        try {
          const retryRes = await invokeModel({
            model,
            contents,
            config: {
              ...strippedConfig,
              abortSignal: AbortSignal.timeout(resolvedTimeoutMs),
            },
          });
          const retryText = retryRes.text?.trim() || "";
          if (retryText) {
            return {
              text: retryText,
              modelUsed: model,
              response: retryRes,
            };
          }
        } catch (retryErr: unknown) {
          lastError = retryErr;
          if (classifyGeminiError(retryErr) === "rate_limit") {
            throw new GeminiRateLimitError();
          }
        }
        continue;
      }

      if (category === "model_not_found") {
        unavailableModels.set(model, Date.now() + UNAVAILABLE_MODEL_TTL_MS);
        // 404 모델은 쿨다운 캐시에 기록하고, 아직 남은 후보가 있으면 1회 추가 시도 허용
        if (i < candidateModels.length - 1) {
          continue;
        }
        throw modelErr;
      }

      if (category === "rate_limit") {
        // 429 시 다른 모델 3~4개를 연쇄 호출하지 않고, 백오프 후 동일 모델 1회만 재시도
        if (attemptsUsed < maxAttempts) {
          attemptsUsed += 1;
          if (backoffMs > 0) {
            await sleep(backoffMs);
          }
          try {
            const retryRes = await invokeModel({
              model,
              contents,
              config: {
                ...effectiveBaseConfig,
                abortSignal: AbortSignal.timeout(resolvedTimeoutMs),
              },
            });
            const retryText = retryRes.text?.trim() || "";
            if (retryText) {
              return {
                text: retryText,
                modelUsed: model,
                response: retryRes,
              };
            }
          } catch (retryErr: unknown) {
            lastError = retryErr;
          }
        }
        throw new GeminiRateLimitError();
      }

      if (category === "transient" && attemptsUsed < maxAttempts && i < candidateModels.length - 1) {
        continue;
      }

      throw modelErr;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini 모델 호출에 실패했습니다.");
}

/**
 * Gemini JSON 응답에서 마크다운 코드펜스와 비이스케이프 제어문자를 보정해 객체로 파싱합니다.
 */
export function parseGeminiJsonObject(responseText: string): {
  parsed: Record<string, unknown> | null;
  cleaned: string;
} {
  if (!responseText || typeof responseText !== "string") {
    return { parsed: null, cleaned: "" };
  }

  let cleaned = responseText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { parsed: parsed as Record<string, unknown>, cleaned };
    }
  } catch {
    // 문자열 내 제어문자 보정 후 재시도
  }

  try {
    const sanitized = cleaned.replace(/"((?:[^"\\]|\\.)*)"/g, (match) =>
      match.replace(/(?<!\\)\r?\n/g, "\\n").replace(/(?<!\\)\t/g, "\\t")
    );
    const parsed = JSON.parse(sanitized);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { parsed: parsed as Record<string, unknown>, cleaned };
    }
  } catch {
    // 호출부 폴백 처리에 위임
  }

  return { parsed: null, cleaned };
}
