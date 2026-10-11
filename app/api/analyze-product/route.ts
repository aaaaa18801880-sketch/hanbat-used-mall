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

[카테고리 자동 판별 규칙 - 최우선 순위]
관리자가 기존에 선택해 둔 기본값("${categoryHint || "미지정"}")과 상관없이,
첨부된 사진 속 실제 제품을 보고 반드시 아래 5개 카테고리 중 가장 알맞은 하나를 정확히 선택하세요:
- "에어컨/냉난방기": 스탠드, 벽걸이, 천장형 시스템 에어컨, 냉난방기
- "냉장고": 가정용 일반 냉장고, 양문형, 4도어, 김치냉장고
- "세탁기/건조기": 전자동(통돌이) 세탁기, 드럼 세탁기, 건조기, 워시타워
- "업소용기기": 식당/업소용 냉장고(우성, 유니크 등 25/45/65박스), 음료쇼케이스, 제빙기, 업소용 식기세척기, 테이블 냉장고 등
- "기타": TV, 모니터, 전자레인지 등 위 항목에 속하지 않는 가전

[기본 작성 및 사실성 검증 규칙]
- 사진, 라벨 스티커, 공식 자료에서 실제로 확인되는 정보만 작성하세요.
- 모델명은 실제로 판독할 수 있을 때만 작성하고, 불분명하면 빈 문자열("")로 두세요.
- 확인되지 않은 제조 연도, 작동 상태, 외관 흠집, 보증/배송 조건은 절대 추측하지 마세요.
- 카테고리는 위 규칙에 따라 자동으로 정정하므로, 단순 카테고리 불일치에 대한 경고는 needsReview에 작성하지 마세요.

[검색 규칙]
${
  useSearch
    ? `모델명이 확인되면 제조사 공식 자료를 검색해 정확한 규격, 용량, 공식 기능을 보완하세요.`
    : `인터넷 검색 없이 사진에서 확인되는 정보만 사용하세요.`
}

[상품 설명 (specDetails) 작성 지침]
1. 제품 소개 (첫 문단):
   - 제품의 종류와 핵심 특징을 자연스러운 한국어 문장 2~3개로 소개합니다.
   - 주요 기능이 일상적인 사용에서 어떤 실질적인 편의를 제공하는지 구체적으로 서술합니다.
   - 제품 크기가 확인된 경우, 설치 공간과 이동 동선 확인 안내를 덧붙입니다.

2. [주요 사양] 목록 (두 번째 문단):
   - 첫 문단과 한 줄을 띄운 후 "[주요 사양]" 소제목을 표시합니다.
   - 확인된 핵심 규격(총용량/kg, 크기, 에너지효율등급, 도어 구성 또는 모터 방식 등)을 글머리 기호(-) 목록으로 작성합니다.

[출력 포맷]
반드시 다른 설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "category": "세탁기/건조기",
  "title": "삼성 전자동 세탁기 18kg (WA18T7650KV)",
  "specDetails": "대용량 세탁물을 한 번에 해결할 수 있는 전자동 세탁기입니다. 강력한 수류와 모터 기술로 두꺼운 이불 빨래도 깔끔하게 세탁할 수 있어 실용적입니다. 다용도실 설치 공간과 출입문 폭을 미리 확인하시면 원활한 설치가 가능합니다.\\n\\n[주요 사양]\\n- 용량: 18kg\\n- 에너지소비효율: 2등급\\n- 모터 방식: 듀얼DD 모터",
  "modelNumber": "WA18T7650KV",
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

    // 카테고리 안전 매핑
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