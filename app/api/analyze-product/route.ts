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

[관리자 선택 카테고리]
${categoryHint || "미지정"}

[기본 작성 및 사실성 검증 규칙]
- 사진, 라벨 스티커, 공식 자료에서 실제로 확인되는 정보만 사용하세요.
- 관리자 카테고리가 지정되었다면 이를 최우선으로 반영하세요.
- 모델명은 실제로 판독할 수 있을 때만 작성하고, 불분명하면 빈 문자열("")로 두세요.
- 확인되지 않은 제조 연도, 성능, 작동 상태, 외관 흠집, 청결도, 보증 및 배송 조건은 절대 추측하여 작성하지 마세요.
- 에너지효율 등급을 근거로 전기요금 절감액이나 저전력 성능을 임의로 단정하지 마세요.
- 사양이 불명확하거나 상충하는 정보는 임의로 판단하지 말고 반드시 needsReview 배열에 검토 사항으로 기록하세요.

[검색 규칙]
${
  useSearch
    ? `모델명이 명확히 확인될 때 제조사 공식 자료를 최우선으로 검색하여 공식 규격과 기능을 검증하세요. 유사 모델의 사양을 현재 제품에 임의 적용하지 마세요.`
    : `인터넷 검색 없이 사진에서 확인되는 정보만 사용하세요. 기억이나 추측으로 수치를 보완하지 마세요.`
}

[상품 설명 (specDetails) 작성 지침]
단순 사양 나열이 아니라, 실제 온라인 쇼핑몰 상세 페이지에서 소비자가 읽기 편한 친절하고 신뢰감 있는 문체로 작성하세요.
과장된 수식어나 광고성 문구는 지양하고 아래 순서와 형식을 엄격히 따르세요:

1. 제품 소개 (첫 문단):
   - 제품의 종류와 핵심 특징을 자연스러운 한국어 문장 2~3개로 소개합니다.
   - 상품명에 이미 포함된 정보를 불필요하게 반복하지 않습니다.
   - 확인된 주요 기능이 일상적인 사용에서 어떤 실질적인 편의를 제공하는지 구체적으로 서술합니다 (단순 기능명 나열 금지).
   - 제품 크기(가로/세로/깊이)가 확인된 경우, 설치 공간과 출입문/엘리베이터 이동 동선을 미리 확인하도록 안내 문구를 포함합니다.

2. [주요 사양] 목록 (두 번째 문단):
   - 첫 문단과 한 줄을 띄운 후 "[주요 사양]" 소제목을 표시합니다.
   - 확인된 핵심 규격을 글머리 기호(-) 목록으로 간결하게 정리합니다.
     * 총용량 (냉장/냉동 분할 표기 가능한 경우 포함)
     * 크기 (가로 × 높이 × 깊이 mm)
     * 에너지소비효율등급 (라벨에서 확인된 경우)
     * 주요 제원 및 도어 구성

[출력 포맷]
반드시 다른 설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "category": "냉장고",
  "title": "삼성 비스포크 양문형 3도어 냉장고 846L",
  "specDetails": "넉넉한 수납공간과 맞춤형 도어 디자인을 갖춘 양문형 냉장고입니다. 자주 사용하는 식재료를 손쉽게 꺼낼 수 있는 푸드쇼케이스 도어가 적용되어 냉기 손실을 줄이고 일상적인 사용 편의성을 높였습니다. 설치 공간과 진입 동선의 가로·깊이 규격을 미리 확인하시면 더욱 안전한 배치가 가능합니다.\\n\\n[주요 사양]\\n- 총용량: 846L (냉장 526L / 냉동 320L)\\n- 크기: 912 × 1780 × 915 mm\\n- 에너지소비효율: 2등급\\n- 도어 구성: 양문형 3도어",
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

    const category =
      rawParsed.category && typeof rawParsed.category === "string"
        ? rawParsed.category.trim()
        : (categoryHint || "기타");

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
      category,
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