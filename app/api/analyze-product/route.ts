import { NextRequest, NextResponse } from "next/server";
import { sanitizeOldManufactureYear } from "../../../lib/site";
import { resolveAnalyzedProductCategory } from "../../../lib/product-category-audit";
import { parseAnalyzedImageCrops } from "../../../lib/image-smart-crop";
import {
  buildProductAnalysisPrompt,
  sanitizeProductDraftArray,
  sanitizeProductDraftText,
} from "../../../lib/product-ai-prompt";
import {
  checkRateLimit,
  getClientIp,
  verifyAdminRequest,
} from "../../../lib/server-security";
import {
  extractValidatedImageParts,
  generateGeminiWithFallback,
  parseGeminiJsonObject,
} from "../../../lib/server-gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILES = 3;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
// 요구사항 6 준수: 기존 사이트 내부의 Gemini API 모델 ID("gemini-3.8-flash") 유지
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_GEMINI_MODEL = "gemini-2.5-flash";

function cleanAndParseAIJson(responseText: string): Record<string, unknown> {
  const { parsed, cleaned } = parseGeminiJsonObject(responseText);
  if (parsed) return parsed;
  if (!cleaned) return {};

  // 시도 3: 정규식 필드별 복원 추출 (응답이 일부 잘리거나 구문 오류가 있어도 핵심 필드 살림)
  const fallback: Record<string, unknown> = {};

  const extractString = (key: string): string => {
    const regex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
    const match = cleaned.match(regex);
    if (match && match[1]) {
      return match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .trim();
    }
    return "";
  };

  const extractArray = (key: string): string[] => {
    const regex = new RegExp(`"${key}"\\s*:\\s*\\[([\\s\\S]*?)\\]`);
    const match = cleaned.match(regex);
    if (match && match[1]) {
      const items: string[] = [];
      const itemRegex = /"((?:[^"\\]|\\.)*)"/g;
      let m: RegExpExecArray | null;
      while ((m = itemRegex.exec(match[1])) !== null) {
        items.push(
          m[1]
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\")
            .trim()
        );
      }
      return items;
    }
    return [];
  };

  const cat = extractString("category");
  if (cat) fallback.category = cat;

  const t = extractString("title");
  if (t) fallback.title = t;

  const mn = extractString("modelNumber");
  if (mn) fallback.modelNumber = mn;

  const sd = extractString("specDetails") || extractString("description");
  if (sd) fallback.specDetails = sd;

  const note = extractString("sourceVerificationNote");
  if (note) fallback.sourceVerificationNote = note;

  const po = extractArray("photoObserved");
  if (po.length > 0) fallback.photoObserved = po;

  const sds = extractArray("searchDerivedSpecs");
  if (sds.length > 0) fallback.searchDerivedSpecs = sds;

  const nr = extractArray("needsReview");
  if (nr.length > 0) fallback.needsReview = nr;

  // imageRotations 객체 배열 추출
  const extractObjects = (key: string): Array<Record<string, unknown>> => {
    const regex = new RegExp(`"${key}"\\s*:\\s*\\[([\\s\\S]*?)\\]`);
    const match = cleaned.match(regex);
    if (match && match[1]) {
      try {
        const arr = JSON.parse(`[${match[1]}]`);
        if (Array.isArray(arr)) return arr;
      } catch {
        const itemRegex = /\{\s*"index"\s*:\s*(\d+)\s*,\s*"rotate"\s*:\s*(\d+)\s*\}/g;
        const list: Array<Record<string, unknown>> = [];
        let m: RegExpExecArray | null;
        while ((m = itemRegex.exec(match[1])) !== null) {
          list.push({ index: Number(m[1]), rotate: Number(m[2]) });
        }
        return list;
      }
    }
    return [];
  };

  const ir = extractObjects("imageRotations");
  if (ir.length > 0) fallback.imageRotations = ir;

  const cropsMatch = cleaned.match(/"imageCrops"\s*:\s*\[([\s\S]*?)\](?=\s*,|\s*\})/);
  if (cropsMatch && cropsMatch[1]) {
    try {
      const parsedCrops = JSON.parse(`[${cropsMatch[1]}]`);
      if (Array.isArray(parsedCrops)) fallback.imageCrops = parsedCrops;
    } catch {
      // ignore partial imageCrops truncation
    }
  }

  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await verifyAdminRequest(req);
    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error || "관리자 권한이 필요합니다." },
        { status: adminCheck.status }
      );
    }

    const ip = getClientIp(req);
    const rate = await checkRateLimit(
      `analyze_product:${adminCheck.email || ip}`,
      10,
      60 * 1000,
      { failureMode: "fail-closed" }
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `AI 분석 요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          skipped: true,
          error:
            "서버에 GEMINI_API_KEY가 설정되어 있지 않아 AI 분석을 수행할 수 없습니다.",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const imgResult = await extractValidatedImageParts(formData, {
      maxFiles: MAX_FILES,
      maxFileSizeBytes: MAX_FILE_SIZE,
      fallbackErrorMessage: "유효하지 않은 이미지 파일입니다.",
      supportSingleFileField: true,
    });
    if (!imgResult.ok) {
      return NextResponse.json({ error: imgResult.error }, { status: 400 });
    }

    const categoryValue = formData.get("category");
    const categoryHint =
      typeof categoryValue === "string" ? categoryValue.trim().slice(0, 60) : "";

    const useSearch = formData.get("searchSpecs") === "true";

    const currentYear = new Date().getFullYear();

    const prompt = buildProductAnalysisPrompt({
      currentYear,
      categoryHint,
    });

    const visionConfig: Record<string, unknown> = {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 4096,
    };

    const searchConfig: Record<string, unknown> = {
      tools: [{ googleSearch: {} }],
      temperature: 0.1,
      maxOutputTokens: 4096,
    };

    let usedSearchFallbackToVision = false;
    let geminiResult: Awaited<ReturnType<typeof generateGeminiWithFallback>>;

    if (useSearch) {
      try {
        geminiResult = await generateGeminiWithFallback({
          apiKey,
          defaultModel: DEFAULT_GEMINI_MODEL,
          fallbackModel: FALLBACK_GEMINI_MODEL,
          prompt,
          imageParts: imgResult.imageParts,
          config: searchConfig,
          timeoutMs: 16000,
        });
      } catch (searchErr: unknown) {
        console.warn(
          "[analyze-product] 검색 연동 분석 지연/오류로 사진 판독 전용 모드로 전환:",
          searchErr instanceof Error ? searchErr.message : String(searchErr)
        );
        usedSearchFallbackToVision = true;
        geminiResult = await generateGeminiWithFallback({
          apiKey,
          defaultModel: DEFAULT_GEMINI_MODEL,
          fallbackModel: FALLBACK_GEMINI_MODEL,
          prompt,
          imageParts: imgResult.imageParts,
          config: visionConfig,
          timeoutMs: 18000,
        });
      }
    } else {
      geminiResult = await generateGeminiWithFallback({
        apiKey,
        defaultModel: DEFAULT_GEMINI_MODEL,
        fallbackModel: FALLBACK_GEMINI_MODEL,
        prompt,
        imageParts: imgResult.imageParts,
        config: visionConfig,
        timeoutMs: 22000,
      });
    }

    const { text: responseText, modelUsed, response } = geminiResult;
    const rawParsed = cleanAndParseAIJson(responseText);

    const aiCategory =
      typeof rawParsed.category === "string" ? rawParsed.category.trim() : "";
    const rawTitleForCategory =
      typeof rawParsed.title === "string" ? rawParsed.title.trim() : "";

    const finalCategory = resolveAnalyzedProductCategory({
      aiCategory,
      title: rawTitleForCategory,
      categoryHint,
    });

    let modelNumber = rawParsed.modelNumber
      ? String(rawParsed.modelNumber).trim()
      : "";

    // 모델명이 명시적 키에서 빠졌을 경우, 제목이나 관찰 텍스트에서 모델명 패턴 보조 탐지
    if (!modelNumber || modelNumber === "미확인") {
      const textToScan = `${rawParsed.title || ""} ${Array.isArray(rawParsed.photoObserved) ? rawParsed.photoObserved.join(" ") : ""}`;
      const modelMatch = textToScan.match(/\b([A-Z0-9]{3,8}-[A-Z0-9]{3,8}|[A-Z]{1,3}\d{2,4}[A-Z0-9]{2,8})\b/i);
      if (modelMatch && modelMatch[1]) {
        modelNumber = modelMatch[1].toUpperCase();
      }
    }

    const title =
      rawParsed.title && typeof rawParsed.title === "string" && rawParsed.title.trim()
        ? rawParsed.title.trim()
        : modelNumber
        ? `${finalCategory} (${modelNumber})`
        : "중고 가전/기기";

    let specDetails =
      rawParsed.specDetails && typeof rawParsed.specDetails === "string"
        ? rawParsed.specDetails.trim()
        : typeof rawParsed.description === "string"
        ? rawParsed.description
        : "";

    const photoObserved = Array.isArray(rawParsed.photoObserved)
      ? rawParsed.photoObserved
          .map((item) => String(item).trim())
          .filter(Boolean)
      : [];

    const searchDerivedSpecs = Array.isArray(rawParsed.searchDerivedSpecs)
      ? rawParsed.searchDerivedSpecs
          .map((item) => String(item).trim())
          .filter(Boolean)
      : [];

    // specDetails가 혹시라도 비어있을 경우, 수집된 관찰/검색 정보로 구조화된 초안 자동 합성
    if (!specDetails) {
      const parts: string[] = [];
      parts.push("[한눈에 보는 제품 정보]");
      parts.push(
        modelNumber
          ? `${modelNumber} 모델의 실물 사진 판독 기반 등록 초안입니다.`
          : "실물 사진을 기반으로 작성된 등록 초안입니다."
      );
      if (photoObserved.length > 0) {
        parts.push("\n[제품 특징]");
        photoObserved.forEach((p) => parts.push(`• ${p}`));
      }
      if (searchDerivedSpecs.length > 0 || modelNumber) {
        parts.push("\n[주요 사양]");
        if (modelNumber) parts.push(`• 모델명: ${modelNumber}`);
        searchDerivedSpecs.forEach((s) => parts.push(`• ${s}`));
      }
      specDetails = parts.join("\n");
    }

    if (
      modelNumber &&
      modelNumber !== "미확인" &&
      !specDetails.includes("모델명")
    ) {
      if (specDetails.includes("[주요 사양]")) {
        specDetails = specDetails.replace(
          "[주요 사양]",
          `[주요 사양]\n• 모델명: ${modelNumber}`
        );
      } else {
        specDetails = `[주요 사양]\n• 모델명: ${modelNumber}\n\n` + specDetails;
      }
    }

    const needsReview = Array.isArray(rawParsed.needsReview)
      ? rawParsed.needsReview
          .map((item) => String(item).trim())
          .filter(Boolean)
      : [];

    const chunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

    const sourceUrls = Array.from(
      new Set(
        chunks.flatMap((chunk: { web?: { uri?: string } }) => {
          const url = chunk.web?.uri;
          return url && /^https?:\/\//i.test(url) ? [url] : [];
        })
      )
    ).slice(0, 5);

    if (!modelNumber && !needsReview.some((r) => r.includes("모델명"))) {
      needsReview.unshift(
        "사진에서 정확한 모델명이 판독되지 않았습니다. 실물 라벨을 확인해 주세요."
      );
    }

    if (
      (sourceUrls.length > 0 || searchDerivedSpecs.length > 0) &&
      !needsReview.some((r) => r.includes("동일") || r.includes("일치"))
    ) {
      needsReview.push(
        "검색 출처의 제품과 실제 사진 속 제품(세부 모델·연식·용량)이 동일한지 반드시 확인 후 저장해 주세요."
      );
    }

    const sourceVerificationNote =
      typeof rawParsed.sourceVerificationNote === "string" &&
      rawParsed.sourceVerificationNote.trim()
        ? rawParsed.sourceVerificationNote.trim()
        : sourceUrls.length > 0 || searchDerivedSpecs.length > 0
        ? "검색으로 확인된 사양은 참고용 초안입니다. 실제 사진 속 제품과 동일한 모델인지 확인한 뒤 저장해 주세요."
        : "사진에서 판독된 초안입니다. 미확인 사양은 직접 확인 후 보충해 주세요.";

    const imageRotations = Array.isArray(rawParsed.imageRotations)
      ? rawParsed.imageRotations
          .map((item) => {
            if (item && typeof item === "object") {
              const obj = item as Record<string, unknown>;
              const index = typeof obj.index === "number" ? obj.index : 0;
              const rotate = typeof obj.rotate === "number" ? obj.rotate : 0;
              const res: {
                index: number;
                rotate: number;
                brightness?: number;
                contrast?: number;
              } = { index, rotate };
              if (typeof obj.brightness === "number") res.brightness = obj.brightness;
              if (typeof obj.contrast === "number") res.contrast = obj.contrast;
              return res;
            }
            return null;
          })
          .filter(
            (
              it
            ): it is {
              index: number;
              rotate: number;
              brightness?: number;
              contrast?: number;
            } =>
              it !== null &&
              it.index > 0 &&
              [0, 90, 180, 270].includes(it.rotate)
          )
      : [];

    if (usedSearchFallbackToVision) {
      needsReview.unshift(
        "인터넷 검색 연동이 지연되어 첨부 사진 판독 기준으로 초안을 생성했습니다."
      );
    }

    const sanitized = sanitizeOldManufactureYear(
      {
        category: finalCategory,
        title: sanitizeProductDraftText(title) || title,
        specDetails: sanitizeProductDraftText(specDetails),
        modelNumber,
        photoObserved: sanitizeProductDraftArray(photoObserved),
        searchDerivedSpecs: sanitizeProductDraftArray(searchDerivedSpecs),
        needsReview: sanitizeProductDraftArray(needsReview),
      },
      currentYear
    );

    const imageCrops = parseAnalyzedImageCrops(rawParsed.imageCrops);

    return NextResponse.json({
      isDraft: true,
      modelUsed, // <-- 실제 사용된 모델(폴백 포함) 반환
      category: sanitized.category || finalCategory,
      title: sanitized.title || title,
      specDetails: sanitized.specDetails || sanitizeProductDraftText(specDetails),
      modelNumber,
      photoObserved: sanitized.photoObserved || photoObserved,
      searchDerivedSpecs: sanitized.searchDerivedSpecs || searchDerivedSpecs,
      sourceVerificationNote: sanitizeProductDraftText(sourceVerificationNote),
      needsReview: sanitized.needsReview || needsReview,
      sourceUrls,
      imageRotations,
      imageCrops,
    });

  } catch (error: unknown) {
    console.error(
      "AI 상품 분석 에러:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      {
        error:
          "상품 이미지 분석 중 오류가 발생했습니다. 직접 입력하거나 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}
