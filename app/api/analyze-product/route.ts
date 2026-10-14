import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { PRODUCT_CATEGORIES, normalizeProductCategory } from "../../../lib/site";
import {
  checkRateLimit,
  getClientIp,
  validateServerImageFiles,
  verifyAdminRequest,
} from "../../../lib/server-security";

export const runtime = "nodejs";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  try {
    // 1. 서버 측 관리자 인증·권한 검증
    const adminCheck = await verifyAdminRequest(req);
    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error || "관리자 권한이 필요합니다." },
        { status: adminCheck.status }
      );
    }

    // 2. API 비용 통제를 위한 Rate Limit (분당 10회)
    const ip = getClientIp(req);
    const rate = checkRateLimit(
      `analyze_product:${adminCheck.email || ip}`,
      10,
      60 * 1000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `AI 분석 요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
        },
        { status: 429 }
      );
    }

    // 3. API 키 설정 확인
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
    const multipleFiles = formData.getAll("files");
    const entries = multipleFiles.length
      ? multipleFiles
      : formData.getAll("file");
    const files = entries.filter((item): item is File => item instanceof File);

    // 4. 파일 개수, 크기, MIME 타입 및 실제 바이너리 시그니처 검증
    const fileValidation = await validateServerImageFiles(files, {
      maxFiles: MAX_FILES,
      maxFileSizeBytes: MAX_FILE_SIZE,
    });

    if (!fileValidation.ok || !fileValidation.validated) {
      return NextResponse.json(
        { error: fileValidation.error || "유효하지 않은 이미지 파일입니다." },
        { status: 400 }
      );
    }

    const categoryValue = formData.get("category");
    const categoryHint =
      typeof categoryValue === "string" ? categoryValue.trim().slice(0, 60) : "";

    const useSearch = formData.get("searchSpecs") === "true";

    const prompt = `
당신은 한밭중고전자의 상품 등록 보조자입니다.
중고 가전과 업소용 주방기기의 상품 상세 정보를 모바일 가독성에 최적화된 형식으로 작성합니다.

[절대 준수 원칙 - 허위·추측 사양 생성 금지]
1. 사진 속 명판(라벨)이나 외관에서 직접 확인되지 않은 모델명, 연식(제조년월), 냉난방 능력, 소비전력, 용량 등을 절대 추측하여 확정값처럼 적지 마세요.
2. 사진에서 직접 판독한 정보("photoObserved")와 모델명 검색으로 얻은 참고 사양("searchDerivedSpecs")을 반드시 구분하세요.
3. 사진의 글씨가 흐릿하거나 검색 결과와 사진이 조금이라도 다르거나 확인할 수 없는 값(예: 정확한 연식, 평형, 전압, 단상/삼상 여부 등)은 본문에 단정적으로 적지 말고 반드시 "needsReview" 배열에 담당자 검토 항목으로 추가하세요.

[카테고리 자동 판별]
관리자 기본 선택값("${categoryHint || "미지정"}")과 무관하게, 첨부 사진 속 실제 제품을 보고 아래 5개 중 하나로 자동 분류하세요:
- "에어컨/냉난방기"
- "냉장고"
- "세탁기/건조기"
- "업소용기기"
- "기타"

[상품 설명 (specDetails) 작성 지침]
줄글 서술이나 과장된 광고 문구는 쓰지 말고, 확인된 정보만 아래 불릿(•) 항목으로 구성하세요:

1. [핵심 특징]
• 사진과 모델에서 확인된 2~3개의 핵심 특징만 간결하게 요약

2. [주요 사양]
• 모델명: 라벨에서 명확히 읽힌 경우에만 첫 줄에 기재 (불확실하면 생략 후 needsReview에 기록)
• 확인된 규격 수치만 불릿(•)으로 정리 (검색 사양을 참조한 경우 담당자가 확인할 수 있도록 searchDerivedSpecs에도 별도 기록)

3. [설치 전 체크]
• 가로/깊이 치수 통과 폭 또는 배관·전원 규격 사전 확인 권장 안내 1줄

반드시 다른 설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "category": "에어컨/냉난방기",
  "title": "캐리어 벽걸이 인버터 냉난방기",
  "specDetails": "[핵심 특징]\\n• 사계절 냉난방 겸용 벽걸이형 모델\\n\\n[주요 사양]\\n• 모델명: CSV-Q095GU\\n• 제품 유형: 벽걸이형 냉난방기\\n\\n[설치 전 체크]\\n• 배관 및 실외기 거치 환경, 전원 규격을 사전에 확인해 주세요.",
  "modelNumber": "CSV-Q095GU",
  "photoObserved": ["제품 외관: 벽걸이형 실내기", "라벨 모델명: CSV-Q095GU"],
  "searchDerivedSpecs": ["정격 냉방능력: 3,500W (검색 참조)", "적용 면적: 약 9평형 (검색 참조)"],
  "needsReview": ["실제 제조년월(연식) 라벨 육안 확인 필요", "실외기 포함 여부 및 배관 상태 확인 필요"]
}
`;

    const imageParts = fileValidation.validated.map((item) => ({
      inlineData: {
        mimeType: item.mimeType,
        data: item.base64,
      },
    }));

    const ai = new GoogleGenAI({ apiKey });

    const config = useSearch
      ? { tools: [{ googleSearch: {} }] }
      : { responseMimeType: "application/json" };

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, ...imageParts],
        },
      ],
      config,
    });

    const responseText = response.text?.trim() || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let rawParsed: Record<string, any> = {};

    if (jsonMatch) {
      try {
        rawParsed = JSON.parse(jsonMatch[0]);
      } catch {
        console.warn("AI 응답 JSON 파싱 보정 처리");
      }
    }

    const aiCategory =
      typeof rawParsed.category === "string" ? rawParsed.category.trim() : "";
    const finalCategory = (
      PRODUCT_CATEGORIES as readonly string[]
    ).includes(aiCategory)
      ? aiCategory
      : normalizeProductCategory(aiCategory);

    const title =
      rawParsed.title && typeof rawParsed.title === "string"
        ? rawParsed.title.trim()
        : "중고 가전/기기";

    let specDetails =
      rawParsed.specDetails && typeof rawParsed.specDetails === "string"
        ? rawParsed.specDetails.trim()
        : rawParsed.description || "";

    const modelNumber = rawParsed.modelNumber
      ? String(rawParsed.modelNumber).trim()
      : "";

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

    const needsReview = Array.isArray(rawParsed.needsReview)
      ? rawParsed.needsReview
          .map((item) => String(item).trim())
          .filter(Boolean)
      : [];

    if (!modelNumber && needsReview.length === 0) {
      needsReview.push(
        "사진에서 정확한 모델명이 확인되지 않았습니다. 실물 명판을 확인해 주세요."
      );
    }

    const chunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

    const sourceUrls = Array.from(
      new Set(
        chunks.flatMap((chunk: any) => {
          const url = chunk.web?.uri;
          return url && /^https?:\/\//i.test(url) ? [url] : [];
        })
      )
    ).slice(0, 5);

    return NextResponse.json({
      category: finalCategory,
      title,
      specDetails,
      modelNumber,
      photoObserved,
      searchDerivedSpecs,
      needsReview,
      sourceUrls,
    });
  } catch (error: unknown) {
    console.error(
      "AI 상품 분석 에러:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      {
        error:
          "상품 이미지 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}