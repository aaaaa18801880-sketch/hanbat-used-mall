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

[상품 설명 (specDetails) 작성 지침 - 업그레이드된 불릿 구조]
줄글 서술(긴 문장)이나 AI 특유의 진부한 미사여구('~도움을 줍니다', '~설계되어')는 절대 금지합니다.
소비자가 한눈에 읽기 편하도록 [소주제 키워드: 핵심 내용] 형태의 간결한 불릿(•) 항목으로만 구성하세요:

1. [핵심 특징]
• 2~3개의 핵심 장점만 선별하여 불릿(•)으로 작성
• 서식: "• [핵심 키워드]: 일상 실사용 시 편의성 1줄 요약"
• 문장은 늘어지는 서술어 대신 명사형/간결체(예: ~지원, ~용이, ~구조, ~적용)로 작성

2. [주요 사양]
• 확인된 규격 수치를 불릿(•)으로 간결하게 정리
• 전체 용량, 크기(가로 × 높이 × 깊이 mm), 에너지소비효율등급, 도어 구성/방식 등

3. [설치 전 체크] (크기가 확인된 경우에만 1줄 작성)
• 가로/깊이 규격을 바탕으로 설치 장소 및 출입문/엘리베이터 통과 폭 확인 권장 문구 1줄

[출력 포맷 예시]
반드시 다른 설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "category": "냉장고",
  "title": "LG 디오스 스탠드 김치냉장고 402L",
  "specDetails": "[핵심 특징]\\n• 4도어 멀티 분리 수납: 상칸 양문 개폐 및 중·하칸 서랍형 구조로 식재료별 독립 보관 용이\\n• 리니어 컴프레서 탑재: 정밀한 온도 제어로 정온 유지 및 냉각 효율 지원\\n• 칸별 맞춤 보관 모드: 김치뿐만 아니라 야채/과일/육류 다목적 전환 활용 가능\\n\\n[주요 사양]\\n• 전체 용량: 402L\\n• 제품 크기: 666 × 1,795 × 795 mm (가로 × 높이 × 깊이)\\n• 에너지소비효율: 2등급\\n• 도어 구성: 스탠드형 4도어 (상칸 양문 / 중·하칸 서랍)\\n\\n[설치 전 체크]\\n• 가로 666mm, 깊이 795mm 규격으로 설치 공간과 현관/출입문 통과 폭을 사전에 확인해 주세요.",
  "modelNumber": "K417S11",
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

    const specDetails =
      rawParsed.specDetails && typeof rawParsed.specDetails === "string"
        ? rawParsed.specDetails.trim()
        : (rawParsed.description || "");

    const modelNumber =
      rawParsed.modelNumber ? String(rawParsed.modelNumber).trim() : "";

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