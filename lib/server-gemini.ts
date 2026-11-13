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

/**
 * Gemini 모델을 호출하고 404/미지원 오류 시 지정된 폴백 모델로 1회 자동 재시도합니다.
 */
export async function generateGeminiWithFallback(options: {
  apiKey: string;
  defaultModel: string;
  fallbackModel: string;
  prompt: string;
  imageParts: GeminiInlineImagePart[];
  config?: Record<string, unknown>;
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
  const config = options.config ?? { responseMimeType: "application/json" };

  let modelUsed = options.defaultModel;
  let response;

  try {
    response = await ai.models.generateContent({
      model: options.defaultModel,
      contents,
      config,
    });
  } catch (modelErr: unknown) {
    const msg =
      modelErr instanceof Error ? modelErr.message : String(modelErr || "");
    if (
      options.defaultModel !== options.fallbackModel &&
      (msg.includes("404") ||
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("not supported"))
    ) {
      modelUsed = options.fallbackModel;
      response = await ai.models.generateContent({
        model: options.fallbackModel,
        contents,
        config,
      });
    } else {
      throw modelErr;
    }
  }

  return {
    text: response.text?.trim() || "",
    modelUsed,
    response,
  };
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
