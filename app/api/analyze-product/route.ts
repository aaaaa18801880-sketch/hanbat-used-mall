import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 파일당 8MB

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
      description: "관리자가 추가로 확인해야 하는 정보",
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
        { error: "AI 서비스 설정(GEMINI_API_KEY)을 확인해 주세요." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const multipleFiles = formData.getAll("files");
    const entries = multipleFiles.length ? multipleFiles : formData.getAll("file");

    const files = entries.filter(
      (item): item is File => item instanceof File
    );

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
1. 사진에서 실제로 확인되는 브랜드, 모델명, 용량, 도어 구성, 라벨의 사양을 구분해서 판독하세요.
2. 관리자 카테고리가 지정되었다면 이를 우선 사용하세요.
3. 모델명은 실제로 판독할 수 있을 때만 기재하세요. 판독할 수 없다면 빈 문자열("")로 두세요.
4. 모델명, 에너지효율등급, 월간 소비전력 등을 임의로 추측하지 마세요.
5. 작동 여부, 흠집, 사용 기간, 보증, 배송 조건은 사진으로 확인되지 않는 한 기재하지 마세요.

[검색 규칙]
${
  useSearch
    ? `모델명이 명확히 확인될 때만 검색하세요.
제조사 공식 사이트와 제품 설명서를 우선해 해당 모델의 사양을 검증하세요.
유사 모델의 사양을 현재 제품에 적용하지 마세요.`
    : `인터넷 검색 없이 사진에서 확인되는 정보만 사용하세요.
모델의 기억이나 추측으로 수치를 보완하지 마세요.`
}

[상품 제목]
- 브랜드, 제품 종류, 확인된 모델명이나 특징을 사용하세요.
- 불필요한 수식어와 과장된 광고 표현을 피하세요.

[상세 설명]
- 실제 가전 판매자가 고객에게 설명하듯 자연스럽게 작성하세요.
- 핵심 사양을 짧고 명확하게 전달하세요.
- 확인되지 않은 정보는 설명에서 제외하세요.
- 확인이 필요한 사항은 needsReview 배열에 별도로 기록하세요.

반드시 지정된 JSON 형식으로만 응답하세요.
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

    // 검색 활성화 시 responseSchema 충돌 방지 분기 처리
    const config = useSearch
      ? {
          tools: [{ googleSearch: {} }],
        }
      : {
          responseMimeType: "application/json",
          responseSchema: productSchema,
        };

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

    const responseText = response.text?.trim();

    if (!responseText) {
      throw new Error("AI 응답이 비어 있습니다.");
    }

    // 마크다운 백틱 및 서식 제거
    const cleanJson = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const result: unknown = JSON.parse(cleanJson);

    if (
      !isRecord(result) ||
      typeof result.category !== "string" ||
      !result.category.trim() ||
      typeof result.title !== "string" ||
      !result.title.trim() ||
      typeof result.specDetails !== "string" ||
      typeof result.modelNumber !== "string" ||
      !Array.isArray(result.needsReview) ||
      !result.needsReview.every((item) => typeof item === "string")
    ) {
      throw new Error("AI 결과의 필수 항목이 올바르지 않습니다.");
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
      category: result.category,
      title: result.title,
      specDetails: result.specDetails,
      modelNumber: result.modelNumber,
      needsReview: result.needsReview,
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