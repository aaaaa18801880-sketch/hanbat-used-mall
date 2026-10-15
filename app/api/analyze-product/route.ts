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
// 요구사항 6 준수: 기존 사이트 내부의 Gemini API 모델 ID("gemini-3.8-flash") 유지
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

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
중고 가전과 업소용 주방기기의 상품 상세 정보를 모바일 가독성에 최적화된 초안으로 작성합니다.

[핵심 원칙 - 근거 없는 수치 추측 금지 및 3계층 출처 구분]
1. 모델명, 소비전력, 냉방·난방 능력, 용량(L/kg), 크기(mm), 에너지효율등급, 제조년월(연식) 등을 생성할 때 사진이나 공식 검색 근거가 없으면 절대 숫자를 추측해 채우지 마세요.
2. 아래 3가지 정보를 엄격히 구분하여 작성하세요:
   - "photoObserved": 첨부된 사진(외관, 명판 스티커, 도어 형태 등)에서 직접 눈으로 판독한 사실 목록
   - "searchDerivedSpecs": 인터넷 검색을 통해 확인한 공식/일반 제원 목록 (검색을 사용하지 않았거나 검색 결과가 없으면 빈 배열 [])
   - "specDetails": 관리자가 편집 후 사용할 상품 설명 초안
3. 검색 출처가 존재하더라도 해당 출처의 제품과 실제 사진 속 제품(연식/세부 파생모델)이 동일한지 관리자가 확인해야 하므로, 불확실하거나 대조가 필요한 항목은 반드시 "needsReview" 배열에 구체적으로 기록하세요.

[카테고리 자동 판별]
관리자 기본 선택값("${categoryHint || "미지정"}")과 무관하게, 첨부 사진 속 실제 제품을 보고 아래 5개 중 하나로 자동 분류하세요:
- "에어컨/냉난방기"
- "냉장고"
- "세탁기/건조기"
- "업소용기기"
- "기타"

반드시 다른 설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "category": "에어컨/냉난방기",
  "title": "캐리어 벽걸이 인버터 냉난방기",
  "modelNumber": "CSV-Q095GU",
  "photoObserved": [
    "제품 유형: 벽걸이형 실내기 외관 확인",
    "명판 스티커 모델명: CSV-Q095GU 판독됨"
  ],
  "searchDerivedSpecs": [
    "정격 냉방능력: 3,500W / 난방능력: 4,200W (모델명 검색 기준)",
    "적용 면적: 약 9평형 (29.3㎡)"
  ],
  "sourceVerificationNote": "검색된 CSV-Q095GU 제원이 실제 사진 속 제품의 세부 연식·전원 규격과 일치하는지 명판을 대조해 주세요.",
  "specDetails": "[핵심 특징]\\n• 사계절 냉난방 겸용: 냉방과 난방을 한 대로 운영 가능한 벽걸이형 모델\\n\\n[주요 사양]\\n• 모델명: CSV-Q095GU\\n• 제품 유형: 벽걸이형 냉난방기\\n\\n[설치 전 체크]\\n• 배관 및 실외기 거치 환경, 전원 규격을 사전에 확인해 주세요.",
  "needsReview": [
    "실제 제조년월(연식) 및 정격전압 라벨 육안 확인 필요",
    "검색 출처의 제품과 실제 사진 속 제품이 동일한지 확인 필요"
  ]
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

    const FALLBACK_GEMINI_MODEL = "gemini-2.5-flash";
    let modelUsed = DEFAULT_GEMINI_MODEL;
    let response;

    try {
      response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }, ...imageParts],
          },
        ],
        config,
      });
    } catch (modelErr: any) {
      const msg = String(modelErr?.message || "");
      if (
        DEFAULT_GEMINI_MODEL !== FALLBACK_GEMINI_MODEL &&
        (msg.includes("404") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("not supported"))
      ) {
        modelUsed = FALLBACK_GEMINI_MODEL;
        response = await ai.models.generateContent({
          model: FALLBACK_GEMINI_MODEL,
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }, ...imageParts],
            },
          ],
          config,
        });
      } else {
        throw modelErr;
      }
    }


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

    return NextResponse.json({
      isDraft: true,
      modelUsed, // <-- 실제 사용된 모델(폴백 포함) 반환
      category: finalCategory,
      title,
      specDetails,
      aiDraftSummary: specDetails,
      modelNumber,
      photoObserved,
      searchDerivedSpecs,
      sourceVerificationNote,
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
          "상품 이미지 분석 중 오류가 발생했습니다. 직접 입력하거나 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}
