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
    const rate = checkRateLimit(`analyze_product:${adminCheck.email || ip}`, 10, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `AI 분석 요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.` },
        { status: 429 }
      );
    }

    // 3. API 키 설정 확인 (미설정 시 성공으로 위장하지 않음)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          skipped: true,
          error: "서버에 GEMINI_API_KEY가 설정되어 있지 않아 AI 분석을 수행할 수 없습니다.",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const multipleFiles = formData.getAll("files");
    const entries = multipleFiles.length ? multipleFiles : formData.getAll("file");
    const files = entries.filter((item): item is File => item instanceof File);

    // 4. 파일 개수, 크기, MIME 타입 및 실제 바이너리 매직바이트(시그니처) 검증
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

    // 기존 프롬프트 구조와 응답 포맷을 보존하면서 미확인 제원 추측 금지(needsReview 기록) 지침 유지
    const prompt = `
당신은 한밭중고전자의 상품 등록 보조자입니다.
중고 가전과 업소용 주방기기의 상품 상세 정보를 모바일 가독성에 최적화된 형식으로 작성합니다.

[카테고리 자동 판별]
관리자 기본 선택값("${categoryHint || "미지정"}")과 무관하게, 첨부 사진 속 실제 제품을 보고 아래 5개 중 하나로 자동 분류하세요:
- "에어컨/냉난방기"
- "냉장고"
- "세탁기/건조기"
- "업소용기기"
- "기타"

[상품 설명 (specDetails) 작성 지침]
줄글 서술(긴 문장)이나 불필요한 미사여구는 쓰지 말고, [소주제 키워드: 핵심 내용] 형태의 간결한 불릿(•) 항목으로 구성하세요:

1. [핵심 특징]
• 2~3개의 핵심 장점만 선별하여 불릿(•)으로 작성
• 서식: "• [핵심 키워드]: 일상 실사용 시 편의성 1줄 요약"

2. [주요 사양]
• 모델명 표기 (필수): 라벨 스티커나 검색에서 확인된 모델명을 [주요 사양]의 맨 첫 번째 줄에 반드시 기재하세요. (예: "• 모델명: CSV-Q095GU" / 실내기·실외기 구분이 확인되면 병기). 확인되지 않는 경우에만 생략합니다.
• 제품 규격 수치를 불릿(•)으로 간결하게 정리:
  - 에어컨/냉난방기: 모델명, 제품 유형, 적용 면적(평형), 정격 냉난방능력(소비전력), 전원 규격 등
  - 냉장고/쇼케이스: 모델명, 전체 용량, 제품 크기(가로 × 높이 × 깊이 mm), 에너지효율등급, 도어 구성 등
  - 세탁기/건조기/업소용기기: 모델명, 용량, 크기, 소비전력 등
• 중요 원칙: 사진이나 공식 검색 결과에서 상품 모델명, 냉난방 능력, 소비전력, 용량, 연식 등을 명확히 확인하지 못한 경우 절대 추측하여 사실처럼 생성하지 말고, 해당 항목은 생략한 뒤 반드시 "needsReview" 배열에 관리자가 직접 확인해야 할 항목으로 기재하세요.

3. [설치 전 체크] (크기나 배관 등 사전 확인이 필요한 경우 1줄 작성)
• 가로/깊이 치수 통과 폭 또는 에어컨 배관·전원 확인 권장 안내 1줄

[출력 포맷 예시]
반드시 다른 설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "category": "에어컨/냉난방기",
  "title": "캐리어 엑스파워 골드 벽걸이 인버터 냉난방기 9평형",
  "specDetails": "[핵심 특징]\\n• 사계절 냉난방 겸용: 냉방(3,500W)과 난방(4,200W)을 한 대로 운영 가능\\n• 9평형 공간 맞춤: 원룸, 개인 작업실, 소형 상가 및 사무실 등 독립 공간 커버 용이\\n• 인버터 고효율 운전: 실내 온도에 맞춘 정밀 출력 제어로 불필요한 전력 낭비 최소화\\n\\n[주요 사양]\\n• 모델명: CSV-Q095GU\\n• 제품 유형: 벽걸이형 냉난방기\\n• 적용 면적: 약 9평형 (29.3㎡)\\n• 정격 냉방능력: 3,500 W (소비전력 1,070 W)\\n• 정격 난방능력: 4,200 W (소비전력 1,130 W)\\n• 전원 규격: 220V ~ 60Hz\\n\\n[설치 전 체크]\\n• 배관 및 실외기 거치 환경, 전원 규격을 사전에 확인해 주세요.",
  "modelNumber": "CSV-Q095GU",
  "needsReview": []
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
    const finalCategory = (PRODUCT_CATEGORIES as readonly string[]).includes(aiCategory)
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

    if (modelNumber && !specDetails.includes("모델명")) {
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
      ? rawParsed.needsReview.map((item) => String(item).trim()).filter(Boolean)
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

    return NextResponse.json({
      category: finalCategory,
      title,
      specDetails,
      modelNumber,
      needsReview,
      sourceUrls,
    });
  } catch (error: unknown) {
    console.error(
      "AI 상품 분석 에러:",
      error instanceof Error ? error.message : "Unknown error"
    );
    // 내부 스택 트레이스나 API 키 정보를 브라우저에 노출하지 않음
    return NextResponse.json(
      { error: "상품 이미지 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}