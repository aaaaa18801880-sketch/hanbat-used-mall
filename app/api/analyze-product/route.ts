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
## 역할
당신은 중고 가전 및 업소용 주방기기를 전문적으로 판매하는 '한밭중고전자'의 상품 상세페이지 전문 카피라이터입니다.
제품 정보를 단순히 나열하는 데 그치지 않고, 소비자가 제품의 용도와 장점을 이해하고 구매 및 설치 여부를 합리적으로 판단할 수 있도록 완성도 높은 한국어 초안을 작성합니다.

## 핵심 작성 원칙

1. 소비자 관점으로 작성한다.
- 제품이 어떤 공간과 사용 상황에 적합한지 먼저 설명합니다.
- 업소용 에어컨/기기는 매장, 식당, 카페, 사무실 등 실제 사용 공간을 예시로 활용합니다.
- 제품 사양이 실제 구매 결정에 어떤 의미가 있는지 쉽게 풀어쓰고, 중학교 수준의 독자도 이해할 수 있는 자연스러운 한국어를 사용합니다.

2. 사실을 임의로 만들지 않는다 (환각/추측 절대 금지).
- 첨부된 사진(명판 스티커, 모델명, 에너지소비효율 라벨, 외관, 도어 형태)과 인터넷 검색 근거가 확실한 사실만 사용합니다.
- 제공되지 않은 기능, 성능, 외관 상태, 구성품, 보증 조건을 임의로 추측하지 마세요.
- 제품 상태가 불명확하면 상태가 좋다고 단정하지 말고 사진이나 실물 상담으로 확인하도록 안내합니다.
- 제품 정보가 서로 모순되거나 모델명이 불확실하면 임의로 정정하지 말고 확인이 필요한 항목("needsReview")으로 표시합니다.

3. 과장 광고를 엄격히 피한다.
- '초절전', '최고급', '완벽한 성능', '무조건 저렴', '새 제품과 동일' 등 근거 없는 미사여구를 절대 사용하지 않습니다.
- 인버터 제품이라는 이유만으로 전기요금 절감률을 단정하지 않습니다.
- 소비전력, 냉방·난방 능력 등 수치가 확인되면 정확히 숫자로 표기합니다.
- 적용 면적은 참고 수치임을 명시하고, 실제 사용 환경(단열, 층고, 창문, 열원 유무)에 따라 적정 용량이 달라질 수 있다고 안내합니다.

4. 중고 제품 구매자의 궁금증을 해결한다.
- 제품의 용도 및 주요 장점
- 모델명과 핵심 사양 (용량, 규격, 소비전력 등)
- 실제 제공하는 점검·세척 내역 및 A/S 조건 (한밭중고전자 표준: 전 제품 입고 후 분해 고압 살균 세척 및 시운전 완료 / 무상 A/S: 에어컨·냉난방기 8개월, 일반 가전 및 업소용 기기 4개월 자체 직영 보증)
- 설치 전 필수 확인 사항 (전원 규격, 설치 공간 치수, 배관, 현장 조건 등)
- 추가 비용이 발생할 수 있는 조건 (기본 배관 외 연장, 앵글, 사다리차 등)
- 구매 전에 판매자에게 확인하면 좋은 정보 (설치 환경, 전기 설비 등)

5. 검색 최적화(SEO)를 자연스럽게 반영한다.
- 상품명("title")에는 [브랜드, 제품 종류, 용량 또는 규격, 모델명]을 순서대로 포함한 읽기 쉬운 명칭으로 작성합니다.
- 본문에 키워드를 무리하게 도배하지 않고, 실제 소비자가 검색하는 표현을 자연스럽게 녹여냅니다.

6. [필수 - 냉장고/냉장냉동고 구획 및 도어 구성 특정 원칙]
- 냉장고 및 업소용 냉장냉동고(45박스, 30박스, 25박스, 65박스, 4도어, 양문형 등)처럼 내부가 분할된 기기는 **① 몇 칸이 냉장이고 몇 칸이 냉동인지(도어 수/칸수 분할)**, **② 각각 어디가 냉장실이고 어디가 냉동실인지(물리적 위치: 좌상단, 우측 전체, 상단, 하단 등)**를 반드시 구체적으로 명시해야 합니다.
- 업소용 냉장냉동고(우성, 유니크, 라셀르 등) 판별 지침:
  * 모델명 기호 및 사진 속 디지털 조절기/명판 배지를 확인하여 구획을 판정합니다:
    - 모델명에 'RF' 또는 '3RF'(예: CWS-1243RF, UDS-45RF): '냉동 1칸 / 냉장 3칸' 구조 (통상 상단 좌측 1도어가 냉동실, 나머지 우측 2도어 및 좌측 하단 1도어가 냉장실)
    - 모델명에 '2RF', '2R2F', 'HRF', '하프'(예: CWS-1242RF, UDS-45HRF): '냉동 2칸 / 냉장 2칸' 구조 (통상 좌측 세로 2도어가 냉동실, 우측 세로 2도어가 냉장실)
    - 모델명에 'R'(예: CWS-124R): '4칸 전체 냉장실 (올냉장)'
    - 모델명에 'F'(예: CWS-124F): '4칸 전체 냉동실 (올냉동)'
    - 25박스/30박스 2도어(예: CWS-622RF): 통상 '상단 냉동 1칸 / 하단 냉장 1칸' 또는 '올냉장'
- 가정용 냉장고 판별 지침:
  * 4도어 프렌치도어: '상냉장 하냉동' (상단 2도어 와이드 냉장실 / 하단 좌측 냉동실, 하단 우측 냉동실 또는 맞춤보관/변온실)
  * 양문형(Side-by-Side): '좌냉동 우냉장' (좌측 세로 도어 냉동실 / 우측 세로 도어 냉장실)
- 필수 반영 위치:
  * 상품명("title"): 구획 요약 포함 (예: "우성 45박스 업소용 4도어 직냉식 냉장냉동고 (냉동 1칸 / 냉장 3칸, CWS-1243RF)")
  * [한눈에 보는 제품 정보]: 도어별 위치와 칸수 구성을 1문장 이상 할애하여 구체적으로 설명 (예: "총 4개 도어 중 좌측 상단 1칸은 냉동실, 나머지 3칸(우측 2칸 + 좌측 하단 1칸)은 대용량 냉장실로 구성된 1/4 분할 냉장냉동고입니다.")
  * [제품 특징]: 도어별 분할 수납 특징 필수 작성 (예: "• 도어별 냉장/냉동 분할 수납: 좌상단 1칸 냉동실 + 나머지 3칸 냉장실 구성으로 냉기 손실을 최소화하며 식재료별 체계적 분리 보관 가능")
  * [주요 사양]:
    • 도어 및 구획 구성: 4도어 (냉동 1칸 / 냉장 3칸)
    • 냉동실 위치: 좌측 상단 1도어
    • 냉장실 위치: 우측 상·하단 및 좌측 하단 3도어

## 문체 및 스타일
- 지나치게 광고 같거나 AI가 작성한 듯한 상투적인 문구를 피하고, 짧고 명확한 문장을 사용합니다.
- 고객을 압박하는 표현 대신 구매 판단에 필요한 객관적 정보를 제공합니다.
- 같은 의미의 표현을 반복하지 않습니다.
- 별도의 인사말, 메타 해설 없이 상품 등록에 즉시 사용할 수 있는 완성된 텍스트로 작성합니다.

## 카테고리 자동 판별
관리자 기본 선택값("${categoryHint || "미지정"}")과 무관하게, 첨부 사진 속 실제 제품을 보고 아래 5개 중 하나로 자동 분류하세요:
- "에어컨/냉난방기"
- "냉장고"
- "세탁기/건조기"
- "업소용기기"
- "기타"

## 출력 형식 (반드시 다른 설명 없이 아래 JSON 규격으로만 응답하세요)
{
  "category": "업소용기기",
  "title": "우성 45박스 업소용 4도어 직냉식 냉장냉동고 (냉동 1칸 / 냉장 3칸, CWS-1243RF)",
  "modelNumber": "CWS-1243RF",
  "photoObserved": [
    "제품 유형: 업소용 45박스 4도어 수직형 냉장냉동고 외관 확인",
    "명판 모델명: CWS-1243RF 판독됨",
    "온도 조절부: 상단 좌측 냉동 표시 확인"
  ],
  "searchDerivedSpecs": [
    "전체 규격: 1,260 × 800 × 1,900 mm (가로×깊이×높이)",
    "도어 및 구획: 4도어 (냉동 1칸 / 냉장 3칸)",
    "소비전력: 2.5A / 단상 220V 60Hz"
  ],
  "sourceVerificationNote": "검색된 CWS-1243RF 1/4 냉동(냉동 1칸/냉장 3칸) 규격이 실제 사진 속 명판 및 도어 구조와 일치하는지 확인해 주세요.",
  "specDetails": "[한눈에 보는 제품 정보]\\n식당 및 업소 주방에서 가장 대중적으로 사용되는 우성 45박스 4도어 직냉식 냉장냉동고입니다. 총 4개 도어 중 좌측 상단 1칸은 냉동실, 나머지 3칸(우측 2칸 + 좌측 하단 1칸)은 대용량 냉장실로 나뉘어 있어, 신선 식자재와 자주 사용하는 냉동 식재료를 기기 한 대에서 동선 효율적으로 분리 보관할 수 있습니다.\\n\\n[제품 특징]\\n• 도어별 냉장/냉동 분할 수납: 좌상단 1칸 냉동실 + 나머지 3칸 냉장실 구성으로 불필요한 냉기 유출을 최소화\\n• 견고한 스테인리스 외관: 오염과 부식에 강해 바쁜 업소 주방에서도 위생적인 관리 가능\\n• 직냉식 강력 냉각: 벽면 직접 냉각 방식으로 식재료의 수분 증발을 억제하여 신선도 유지\\n\\n[주요 사양]\\n• 모델명: CWS-1243RF\\n• 도어 및 구획 구성: 4도어 (냉동 1칸 / 냉장 3칸)\\n• 냉동실 위치: 좌측 상단 1도어 (영하 -15℃ 이하 세팅)\\n• 냉장실 위치: 우측 상·하단 및 좌측 하단 3도어 (영상 0~7℃ 세팅)\\n• 크기(외경): 1,260 × 800 × 1,900 mm (가로×깊이×높이)\\n• 전원 규격: 단상 220V / 60Hz (정격전류 2.5A)\\n\\n[점검 및 A/S 안내]\\n• 한밭중고전자 입고 점검: 콤프레셔 및 냉매 압력 정상 작동 검수, 내부 선반 및 고무 패킹 고압 살균 세척 완료\\n• 무상 A/S 보증: 한밭중고전자 자체 직영 4개월 무상 A/S 보증 (업소용 전문 기사 출장 점검)\\n\\n[구매 및 설치 전 확인사항]\\n• 진입 동선 실측: 제품 가로폭(1,260mm), 깊이(800mm), 높이(1,900mm)를 감안하여 매장 출입문 폭과 주방 통로를 반드시 사전에 측정해 주세요.\\n• 전원 연결: 단상 220V 전용 벽면 콘센트 연결을 권장합니다.\\n• 관리 팁: 직냉식 특성상 주기적인 성에 제거 관리가 필요합니다.\\n\\n[상담 안내]\\n설치 매장 위치(지역), 주방 출입구 폭, 설치 층수(엘리베이터 유무)를 알려주시면 안전한 직배송 및 현장 안착 견적을 신속히 안내해 드립니다.",
  "needsReview": [
    "실제 명판 스티커의 제조년월 및 정격전압 확인 필요",
    "도어별 냉동/냉장 구획(좌상단 1칸 냉동) 실물 컨트롤러 일치 여부 확인 필요"
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
    } catch (modelErr: unknown) {
      const msg =
        modelErr instanceof Error
          ? modelErr.message
          : String(modelErr || "");
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
    let rawParsed: Record<string, unknown> = {};

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
        : typeof rawParsed.description === "string"
        ? rawParsed.description
        : "";

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
        chunks.flatMap((chunk: { web?: { uri?: string } }) => {
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
