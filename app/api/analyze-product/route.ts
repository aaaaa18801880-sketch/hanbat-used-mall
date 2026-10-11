import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const VALID_CATEGORIES = [
  "에어컨/냉난방기",
  "냉장고",
  "세탁기/건조기",
  "업소용기기",
  "기타",
];

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const multipleFiles = formData.getAll("files");
    const entries = multipleFiles.length ? multipleFiles : formData.getAll("file");

    const files = entries.filter((item): item is File => item instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "제품 사진을 첨부해 주세요." },
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

    const imageParts = await Promise.all(
      files.slice(0, MAX_FILES).map(async (file) => ({
        inlineData: {
          mimeType: file.type || "image/jpeg",
          data: Buffer.from(await file.arrayBuffer()).toString("base64"),
        },
      }))
    );

    const ai = new GoogleGenAI({ apiKey });

    const config = useSearch
      ? { tools: [{ googleSearch: {} }] }
      : { responseMimeType: "application/json" };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
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
      } catch (parseErr) {
        console.warn("JSON 파싱 보정 시도:", parseErr);
      }
    }

    let finalCategory = "기타";
    const aiCategory = typeof rawParsed.category === "string" ? rawParsed.category.trim() : "";

    if (VALID_CATEGORIES.includes(aiCategory)) {
      finalCategory = aiCategory;
    } else if (aiCategory.includes("세탁") || aiCategory.includes("건조")) {
      finalCategory = "세탁기/건조기";
    } else if (aiCategory.includes("냉장") || aiCategory.includes("김치")) {
      finalCategory = "냉장고";
    } else if (aiCategory.includes("에어컨") || aiCategory.includes("냉난방")) {
      finalCategory = "에어컨/냉난방기";
    } else if (aiCategory.includes("업소") || aiCategory.includes("주방")) {
      finalCategory = "업소용기기";
    }

    const title =
      rawParsed.title && typeof rawParsed.title === "string"
        ? rawParsed.title.trim()
        : "중고 가전/기기";

    let specDetails =
      rawParsed.specDetails && typeof rawParsed.specDetails === "string"
        ? rawParsed.specDetails.trim()
        : (rawParsed.description || "");

    const modelNumber =
      rawParsed.modelNumber ? String(rawParsed.modelNumber).trim() : "";

    // 모델명이 확인되었으나 specDetails [주요 사양]에 모델명 표기가 빠져 있는 경우 자동 삽입
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
    console.error("AI 상품 분석 에러:", error);
    return NextResponse.json(
      {
        error: "상품 분석에 실패했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}