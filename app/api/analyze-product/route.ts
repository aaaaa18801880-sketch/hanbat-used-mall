import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const productSchema = {
  type: "object",
  properties: {
    category: {
      type: "string",
      description: "상품 카테고리",
    },
    title: {
      type: "string",
      description: "검색하기 쉽고 사실에 기반한 상품 제목",
    },
    specDetails: {
      type: "string",
      description: "확인된 제품 특징과 사양만 담은 상세 설명",
    },
    modelNumber: {
      type: "string",
      description: "확인된 모델명. 판독할 수 없으면 빈 문자열",
    },
    needsReview: {
      type: "array",
      items: { type: "string" },
      description: "관리자가 추가로 확인해야 하는 정보 목록",
    },
  },
  required: [
    "category",
    "title",
    "specDetails",
    "modelNumber",
    "needsReview",
  ],
  additionalProperties: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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

    if (entries.length !== files.length || files.length === 0) {
      return NextResponse.json(
        { error: "올바른 이미지 파일을 전송해 주세요." },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `사진은 최대 ${MAX_FILES}장까지 첨부할 수 있습니다.` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (
        !ALLOWED_TYPES.has(file.type) ||
        file.size === 0 ||
        file.size > MAX_FILE_SIZE
      ) {
        return NextResponse.json(
          { error: "지원하지 않는 이미지 형식이거나 파일 크기가 8MB를 초과합니다." },
          { status: 400 }
        );
      }
    }

    const categoryValue = formData.get("category");
    const categoryHint =
      typeof categoryValue === "string"
        ? categoryValue.trim().slice(0, 60)
        : "";

    const useSearch = formData.get("searchSpecs") === "true";

    const prompt = `
당신은 한밭중고전자의 상품 등록 보조자입니다.
중고 가전과 업소용 주방기기의 상품 정보를 작성합니다.

[관리자 선택 카테고리]
${categoryHint || "미지정"}

[정보 작성 규칙]
1. 사진에서 실제로 확인되는 브랜드, 모델명, 용량, 도어 구성, 라벨 사양을 판독하세요.
2. 관리자 카테고리가 지정되었다면 이를 최우선으로 반영하세요.
3. 모델명은 실제로 판독할 수 있을 때만 작성하고, 불분명하면 빈 문자열("")로 두세요.
4. 작동 여부, 흠집, 보증 등 사진으로 확인되지 않는 내용은 작성하지 마세요.

[검색 규칙]
${
  useSearch
    ? `모델명이 명확히 확인될 때 구글 검색으로 공식 사양(냉장/냉동 분할 용량, 규격 등)을 검증하세요.`
    : `인터넷 검색 없이 사진에서 확인되는 정보만 사용하세요.`
}

반드시 다른 설명 없이 아래 순수 JSON 형식으로만 응답하세요:
{
  "category": "냉장고",
  "title": "삼성 비스포크 양문형 846L (RS84T50716C)",
  "specDetails": "냉장 526L / 냉동 320L, 푸드쇼케이스, 2등급",
  "modelNumber": "RS84T50716C",
  "needsReview": ["실제 외관 흠집 유무 확인 필요"]
}
`;

    const imageParts = await Promise.all(
      files.map(async (file) => ({
        inlineData: {
          mimeType: file.type,
          data: Buffer.from(await file.arrayBuffer()).toString("base64"),
        },
      }))
    );

    const ai = new GoogleGenAI({ apiKey });

    const config = useSearch
      ? { tools: [{ googleSearch: {} }] }
      : { responseMimeType: "application/json", responseSchema: productSchema };

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
    if (!responseText) {
      throw new Error("AI 응답이 비어 있습니다.");
    }

    // 마크다운이나 텍스트 내에서 JSON 블록만 안전 추출
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI 응답에서 JSON 형식을 추출할 수 없습니다: " + responseText.slice(0, 100));
    }

    const rawParsed = JSON.parse(jsonMatch[0]);

    if (!isRecord(rawParsed)) {
      throw new Error("AI 결과가 올바른 객체 형태가 아닙니다.");
    }

    // AI 응답 속성 안전 매핑 (null/타입 불일치 방어)
    const category =
      typeof rawParsed.category === "string" && rawParsed.category.trim()
        ? rawParsed.category.trim()
        : (categoryHint || "기타");

    const title =
      typeof rawParsed.title === "string" && rawParsed.title.trim()
        ? rawParsed.title.trim()
        : "중고 가전/기기";

    const specDetails =
      typeof rawParsed.specDetails === "string"
        ? rawParsed.specDetails.trim()
        : (typeof rawParsed.description === "string" ? rawParsed.description.trim() : "");

    const modelNumber =
      typeof rawParsed.modelNumber === "string"
        ? rawParsed.modelNumber.trim()
        : (rawParsed.modelNumber ? String(rawParsed.modelNumber) : "");

    const needsReview = Array.isArray(rawParsed.needsReview)
      ? rawParsed.needsReview.map((item) => String(item).trim()).filter(Boolean)
      : [];

    // 구글 검색 출처 URL 추출
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sourceUrls = Array.from(
      new Set(
        chunks.flatMap((chunk: any) => {
          const url = chunk.web?.uri;
          return url && /^https?:\/\//i.test(url) ? [url] : [];
        })
      )
    ).slice(0, 5);

    return NextResponse.json({
      category,
      title,
      specDetails,
      modelNumber,
      needsReview,
      sourceUrls,
    });
  } catch (error: unknown) {
    console.error("AI 상품 분석 실패:", error);
    return NextResponse.json(
      {
        error: "상품 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}