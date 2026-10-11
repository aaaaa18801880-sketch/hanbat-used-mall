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
중고 가전과 업소용 주방기기의 상품 상세 정보를 객관적이고 신뢰할 수 있게 작성합니다.

[카테고리 자동 판별]
관리자의 기본 선택값("${categoryHint || "미지정"}")과 무관하게, 첨부된 사진 속 실제 제품을 판별하여 아래 5개 중 하나로 자동 분류하세요:
- "에어컨/냉난방기"
- "냉장고"
- "세탁기/건조기"
- "업소용기기"
- "기타"

[상품 설명 (specDetails) 3단 구조 작성 규칙]
반드시 다음 세 영역으로 구분하여 작성하세요:

1. [제품 특징]
- 제품의 유형, 확인된 주요 기능, 핵심적인 특징을 소비자가 이해하기 쉬운 자연스러운 문장으로 2~4문장 작성합니다.
- 단순 스펙 나열 대신 기능이 일상적인 실사용에 어떤 편의를 제공하는지 서술합니다.
- 광고성/과장 표현('강력한', '뛰어난', '초고효율', '전기요금 절감', '빠른 냉방', '완벽한' 등)은 공식 근거가 없으면 절대 사용하지 않습니다.

2. [주요 사양]
- 냉방능력, 용량(냉장/냉동 분할 포함), 크기, 에너지소비효율 등급 등 확인된 수치를 항목별 불릿(•)으로 간결하게 정리합니다.
- 제품 크기는 반드시 '가로 × 높이 × 깊이 mm' 순서로 표기합니다.
- [제품 특징]과 동일한 문장을 불필요하게 중복 서술하지 않습니다.

3. [구매 전 확인 사항]
- 제품 크기나 설치 요건 등 소비자가 구매 전 현장에서 실제로 확인해야 하는 항목이 있을 때만 작성합니다.
- 단순 치수 반복을 지양하고, 해당 규격을 바탕으로 현관문 통과 폭, 엘리베이터 유무, 주방/다용도실 설치 여유 공간 등을 확인하도록 안내합니다.

[사실성 및 중고 상품 검증 원칙]
- 사진, 라벨, 공식 제조사 자료로 검증된 사실만 작성합니다. 정보가 적다면 억지로 늘리지 마세요.
- 평형, 연식, 용량, 소비전력 등 명확하지 않은 수치는 임의 보정하지 말고 needsReview 배열에 검토 사항으로 기록하세요.
- 실제 작동 여부, 외관 흠집, 청결도, 부품 교체 여부, 보증/배송 조건은 사진만으로 알 수 없으므로 절대 임의로 작성하지 마세요.
- 카테고리 자동 정정에 따른 불일치는 needsReview에 적지 않습니다.

반드시 다른 부연설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "category": "냉장고",
  "title": "삼성 양문형 냉장고 846L (RS84T50716C)",
  "specDetails": "[제품 특징]\\n글래스 도어 마감이 적용된 대용량 양문형 냉장고입니다. 상단에 별도 개폐가 가능한 푸드쇼케이스 도어가 장착되어 자주 찾는 음료와 식재료를 편리하게 꺼낼 수 있습니다. 냉장실과 냉동실이 좌우로 분리되어 대형 용기나 식자재를 용도별로 나누어 보관하기 용이합니다.\\n\\n[주요 사양]\\n• 전체 용량: 846L (냉장 526L / 냉동 320L)\\n• 제품 크기: 912 × 1,780 × 915 mm (가로 × 높이 × 깊이)\\n• 에너지소비효율: 2등급\\n• 도어 구성: 3도어 (푸드쇼케이스 도어 적용)\\n\\n[구매 전 확인 사항]\\n• 가로 912mm, 깊이 915mm 규격의 대형 냉장고이므로 주방 설치 공간과 출입문, 복도 통과 폭을 사전에 확인해 주시기 바랍니다.",
  "modelNumber": "RS84T50716C",
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