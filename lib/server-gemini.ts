import { GoogleGenAI } from "@google/genai";
import { validateServerImageFiles } from "./server-security";

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

function isRetryableModelError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || "");
  const lowerMsg = msg.toLowerCase();
  return (
    msg.includes("404") ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("503") ||
    lowerMsg.includes("not found") ||
    lowerMsg.includes("no longer available") ||
    lowerMsg.includes("not supported") ||
    lowerMsg.includes("resource_exhausted") ||
    lowerMsg.includes("unavailable") ||
    lowerMsg.includes("internal") ||
    lowerMsg.includes("timeout") ||
    lowerMsg.includes("aborted") ||
    (err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError"))
  );
}

/**
 * Gemini 모델을 호출하고 404·미지원·일시적 지연 시 살아있는 모델 체인으로 자동 폴백 재시도합니다.
 */
export async function generateGeminiWithFallback(options: {
  apiKey: string;
  defaultModel: string;
  fallbackModel: string;
  prompt: string;
  imageParts: GeminiInlineImagePart[];
  config?: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<{
  text: string;
  modelUsed: string;
  response: Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>;
}> {
  const ai = new GoogleGenAI({ apiKey: options.apiKey });
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

  const candidateModels = Array.from(
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

  let lastError: unknown = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          ...baseConfig,
          abortSignal: AbortSignal.timeout(resolvedTimeoutMs),
        },
      });
      const text = response.text?.trim() || "";
      if (!text && i < candidateModels.length - 1) {
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
      const hasNext = i < candidateModels.length - 1;
      if (hasNext && isRetryableModelError(modelErr)) {
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
