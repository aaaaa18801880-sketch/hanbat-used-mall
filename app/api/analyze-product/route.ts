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
중고 가전과 업소용 주방기기의 상품 상세 정보를 전문적으로 작성합니다.

[카테고리 자동 판별 - 최우선 순위]
관리자의 기본 선택값("${categoryHint || "미지정"}")에 구애받지 말고,
사진 속 실제 제품을 보고 아래 5개 중 하나로 자동 분류하세요:
- "에어컨/냉난방기"
- "냉장고"
- "세탁기/건조기"
- "업소용기기"
- "기타"

[상품 설명 (specDetails) 작성 지침 - 핵심 요약형]
긴 서술형 줄글이나 불필요한 미사여구는 절대 쓰지 마세요.
모바일 고객이 한눈에 읽을 수 있도록 간결한 글머리 기호(•) 항목으로만 깔끔하게 구성하세요.

작성 구조:
[제품 특징]
• 제품의 가장 핵심적인 실사용 편의 기능 1~2개를 1줄씩 간결하게 작성
• 제품 크기(가로/깊이)가 확인된 경우, 설치 공간 및 진입 동선 확인 권장 안내 1줄

[주요 사양]
• 전체 용량: 확인된 용량 (냉장/냉동 분할 표기 가능 시 병기)
• 제품 크기: 가로 × 높이 × 깊이 mm
• 에너지소비효율: 확인된 등급
• 도어 구성 / 모터 / 제원 등 확인된 핵심 스펙

[사실성 및 검증 원칙]
- 사진, 라벨, 공식 검색에서 실제로 확인된 수치만 기재하세요.
- 추측성 수치, 제조년도, 외관 상태, A/S 기간 등 확인되지 않은 정보는 적지 마세요.
- 카테고리는 자동 정정하므로 needsReview에 카테고리 불일치 경고를 넣지 마세요.

반드시 다른 설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "category": "냉장고",
  "title": "삼성 양문형 냉장고 846L (RS84T50716C)",
  "specDetails": "[제품 특징]\\n• 자주 찾는 음료와 식재료를 빠르게 꺼낼 수 있는 3도어 푸드쇼케이스\\n• 냉장 526L / 냉동 320L의 넉넉한 대용량 분할 수납 공간\\n• 설치 공간 및 진입 동선 확인 권장: 가로 912mm, 깊이 915mm\\n\\n[주요 사양]\\n• 전체 용량: 846L (냉장 526L / 냉동 320L)\\n• 제품 크기: 912 × 1,780 × 915 mm\\n• 에너지소비효율: 2등급\\n• 도어 구성: 양문형 3도어 푸드쇼케이스",
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