import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  PRODUCT_CATEGORIES,
  normalizeProductCategory,
  sanitizeOldManufactureYear,
} from "../../../lib/site";
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

function cleanAndParseAIJson(responseText: string): Record<string, unknown> {
  if (!responseText || typeof responseText !== "string") {
    return {};
  }

  // 1. 마크다운 코드블록 제거
  let cleaned = responseText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  // 최외곽 { ... } 추출
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 시도 1: 표준 JSON 파싱
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    // 실패 시 보정 시도로 진행
  }

  // 시도 2: JSON 문자열 값 내부의 비이스케이프 줄바꿈/탭 보정 후 파싱
  try {
    const sanitized = cleaned.replace(
      /"((?:[^"\\]|\\.)*)"/g,
      (match) => {
        return match
          .replace(/(?<!\\)\r?\n/g, "\\n")
          .replace(/(?<!\\)\t/g, "\\t");
      }
    );
    const parsed = JSON.parse(sanitized);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    // 실패 시 정규식 필드 추출 폴백으로 진행
  }

  // 시도 3: 정규식 필드별 복원 추출 (응답이 일부 잘리거나 구문 오류가 있어도 핵심 필드 살림)
  const fallback: Record<string, unknown> = {};

  const extractString = (key: string): string => {
    const regex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
    const match = cleaned.match(regex);
    if (match && match[1]) {
      return match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .trim();
    }
    return "";
  };

  const extractArray = (key: string): string[] => {
    const regex = new RegExp(`"${key}"\\s*:\\s*\\[([\\s\\S]*?)\\]`);
    const match = cleaned.match(regex);
    if (match && match[1]) {
      const items: string[] = [];
      const itemRegex = /"((?:[^"\\]|\\.)*)"/g;
      let m: RegExpExecArray | null;
      while ((m = itemRegex.exec(match[1])) !== null) {
        items.push(
          m[1]
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\")
            .trim()
        );
      }
      return items;
    }
    return [];
  };

  const cat = extractString("category");
  if (cat) fallback.category = cat;

  const t = extractString("title");
  if (t) fallback.title = t;

  const mn = extractString("modelNumber");
  if (mn) fallback.modelNumber = mn;

  const sd = extractString("specDetails") || extractString("description");
  if (sd) fallback.specDetails = sd;

  const note = extractString("sourceVerificationNote");
  if (note) fallback.sourceVerificationNote = note;

  const po = extractArray("photoObserved");
  if (po.length > 0) fallback.photoObserved = po;

  const sds = extractArray("searchDerivedSpecs");
  if (sds.length > 0) fallback.searchDerivedSpecs = sds;

  const nr = extractArray("needsReview");
  if (nr.length > 0) fallback.needsReview = nr;

  // imageRotations 객체 배열 추출
  const extractObjects = (key: string): Array<Record<string, unknown>> => {
    const regex = new RegExp(`"${key}"\\s*:\\s*\\[([\\s\\S]*?)\\]`);
    const match = cleaned.match(regex);
    if (match && match[1]) {
      try {
        const arr = JSON.parse(`[${match[1]}]`);
        if (Array.isArray(arr)) return arr;
      } catch {
        const itemRegex = /\{\s*"index"\s*:\s*(\d+)\s*,\s*"rotate"\s*:\s*(\d+)\s*\}/g;
        const list: Array<Record<string, unknown>> = [];
        let m: RegExpExecArray | null;
        while ((m = itemRegex.exec(match[1])) !== null) {
          list.push({ index: Number(m[1]), rotate: Number(m[2]) });
        }
        return list;
      }
    }
    return [];
  };

  const ir = extractObjects("imageRotations");
  if (ir.length > 0) fallback.imageRotations = ir;

  return fallback;
}

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

    const currentYear = new Date().getFullYear();
    const oldYearThreshold = currentYear - 6; // 2026년 기준 2020년 (5년 이상 지난 제품 기준점)

    const prompt = `
## 역할
당신은 중고 가전 및 업소용 주방기기를 전문적으로 판매하는 '한밭중고전자'의 상품 상세페이지 전문 카피라이터입니다.
제품 정보를 단순히 나열하는 데 그치지 않고, 소비자가 제품의 용도와 장점을 이해하고 구매 및 설치 여부를 합리적으로 판단할 수 있도록 핵심만 간결하고 명확하게 작성합니다.

## 핵심 작성 원칙

1. 사실 기반 작성 (환각/추측 절대 금지)
- 첨부된 사진(명판 스티커, 모델명, 에너지소비효율 라벨, 외관, 도어 형태)에 근거한 사실만 사용합니다.
- 제품 상태가 불명확하면 상태가 좋다고 단정하지 말고 확인이 필요한 항목("needsReview")으로 표시합니다.

2. 과장 광고 금지 및 객관적 수치 사용
- '초절전', '최고급', '완벽한 성능' 등 근거 없는 미사여구를 절대 사용하지 않습니다.
- 소비전력, 용량, 크기 수치는 정확히 숫자로 표기합니다.

3. [필수 - 냉장고/냉장냉동고 구획 및 도어 구성 특정 원칙]
- 냉장고 및 업소용 냉장냉동고(45박스, 30박스, 25박스, 65박스, 4도어, 양문형 등)처럼 내부가 분할된 기기는 **① 몇 칸이 냉장이고 몇 칸이 냉동인지(도어 수/칸수 분할)**, **② 각각 어디가 냉장실이고 어디가 냉동실인지(물리적 위치: 좌상단, 우측 전체, 상단, 하단 등)**를 반드시 구체적으로 명시해야 합니다.
- 업소용 냉장냉동고(우성, 유니크, 라셀르 등) 판별 지침:
  * 모델명 'RF'/'3RF': '냉동 1칸 / 냉장 3칸' (통상 상단 좌측 1도어가 냉동실, 나머지 우측 2도어 및 좌측 하단 1도어가 냉장실)
  * 모델명 '2RF'/'2R2F'/'HRF': '냉동 2칸 / 냉장 2칸' (통상 좌측 세로 2도어가 냉동실, 우측 세로 2도어가 냉장실)
  * 모델명 'R': '4칸 전체 냉장실 (올냉장)'
  * 모델명 'F': '4칸 전체 냉동실 (올냉동)'
  * 25박스/30박스 2도어: 통상 '상단 냉동 1칸 / 하단 냉장 1칸' 또는 '올냉장'
- 가정용 냉장고: 4도어='상냉장 하냉동', 양문형='좌냉동 우냉장'
- 가정용 냉장고(삼성 비스포크, LG 디오스/오브제컬렉션, 위니아 등):
  * 에너지소비효율등급 라벨 또는 명판 스티커에서 모델명(예: RF85T9111AP 등), 전체 용량(예: 850L 등), 월간소비전력량(kWh/월) 등을 정밀 판독
  * 상품명 예시: "삼성 비스포크 4도어 냉장고 850L (상냉장 하냉동, RF85T9111AP)"
- 필수 반영 위치:
  * 상품명("title"): 구획 요약 포함 (예: "우성 45박스 업소용 4도어 직냉식 냉장냉동고 (냉동 1칸 / 냉장 3칸, CWS-1243RF)")
  * [한눈에 보는 제품 정보]: 도어별 위치와 칸수 구성을 1문장 이상 할애하여 구체적으로 설명
  * [제품 특징]: 도어별 분할 수납 특징 필수 작성
  * [주요 사양]: 도어 및 구획 구성, 냉동실 위치, 냉장실 위치 명시

4. 출력 섹션 구성 (불필요한 중복 안내 제거, 핵심 3개 섹션으로 압축)
상세페이지 시스템에 이미 고정 표기되는 [점검 및 A/S 안내], [구매 및 설치 전 확인사항], [상담 안내]는 별도로 작성하지 마세요.
오직 아래 3개 항목만 작성합니다:
- [한눈에 보는 제품 정보]: 제품의 용도, 권장 설치 공간, 핵심 장점 및 구획 구조(2~3문장)
- [제품 특징]: 제품의 핵심 기능 및 차별점 (2~3개 불릿)
- [주요 사양]: 모델명, 크기, 용량, 도어/구획 구성, 전원, 특이사항(단상/삼상, 전용선 필요 시 등)

5. [필수] 사진 방향 자동 감지 (imageRotations)
- 첨부된 각 사진(전달된 이미지 순서대로 1번부터)의 기기 외관이나 에너지라벨/명판 텍스트가 옆으로 누워있는지 판독하여, 사람이 고개를 기울이지 않고 정방향으로 편안하게 읽을 수 있도록 세우기 위해 '시계방향'으로 몇 도 회전해야 하는지(rotate: 0, 90, 180, 270)를 반드시 판정하세요:
  * 0: 이미 정상 정방향으로 서 있음
  * 90: 사진 속 기기나 라벨 글자가 왼쪽으로 90도 누워있음 (시계방향 90도 회전 필요)
  * 180: 거꾸로 뒤집혀 있음 (180도 회전 필요)
  * 270: 오른쪽으로 90도 누워있음 (반시계 90도 / 시계방향 270도 회전 필요)

6. [필수] 제조년월 / 연식 표기 절대 원칙 (5년 이상 지난 제품은 제조년월 일절 미표기)
- 기준 연도: 현재는 ${currentYear}년입니다.
- **연식이 5년 이상 지난 기기(${oldYearThreshold}년 및 그 이전 연도: ${oldYearThreshold}년, ${oldYearThreshold - 1}년, ...)인 경우**:
  * 상품명("title"), [한눈에 보는 제품 정보], [제품 특징], [주요 사양], 사진 판독("photoObserved"), 검색 사양("searchDerivedSpecs"), 검토 필요("needsReview") 등 어떠한 항목에서도 제조년월, 제조년도, 연식(예: "2018년식", "제조년월: 2018.06", "2018년형", "2018년 제조" 등)을 절대 표기하거나 언급하지 마세요!
  * 사진 명판에 2020년 이전(2020년 포함) 제조년월이 적혀 있더라도 아예 생략하고 쓰지 않습니다.
  * 사양("specDetails")의 [주요 사양] 목록에서도 '제조년월' 항목 자체를 아예 빼고 작성하세요.
- **반대로, 최근 5년 이내 최신 기기(${oldYearThreshold + 1}년~${currentYear}년: ${oldYearThreshold + 1}년 이후)**인 경우에만 제품의 가치를 높여주는 강점이 되므로 제조년월/연식을 정상 표기할 수 있습니다.

## 카테고리 자동 판별
관리자 선택값("${categoryHint || "미지정"}")과 무관하게, 첨부 사진 속 실제 제품을 보고 아래 5개 중 하나로 분류:
- "에어컨/냉난방기": 벽걸이/스탠드/천장형 에어컨, 시스템 냉난방기 전용 (※ TV나 다른 가전은 절대 에어컨으로 분류 금지)
- "냉장고"
- "세탁기/건조기"
- "업소용기기"
- "기타": TV, 모니터, 컴퓨터, 영상가전, 전자레인지, 밥솥, 청소기, 주방·생활 소형가전 (※ TV 및 디스플레이는 절대 '에어컨/냉난방기'가 아니며 반드시 '기타'로 분류)

## 출력 형식 (반드시 다른 해설 문장 없이 아래 유효한 JSON 형식으로만 응답)
{
  "category": "업소용기기",
  "title": "우성 45박스 업소용 4도어 직냉식 냉장냉동고 (냉동 1칸 / 냉장 3칸, CWS-1243RF)",
  "modelNumber": "CWS-1243RF",
  "imageRotations": [
    { "index": 1, "rotate": 0 },
    { "index": 2, "rotate": 90 }
  ],
  "photoObserved": [
    "제품 유형: 업소용 45박스 4도어 수직형 냉장냉동고 외관 확인",
    "명판 모델명: CWS-1243RF 판독됨"
  ],
  "searchDerivedSpecs": [
    "전체 규격: 1,260 × 800 × 1,900 mm (가로×깊이×높이)",
    "도어 및 구획: 4도어 (냉동 1칸 / 냉장 3칸)",
    "소비전력: 2.5A / 단상 220V 60Hz"
  ],
  "sourceVerificationNote": "사진 속 명판 및 도어 구조(냉동 1칸/냉장 3칸)와 일치하는지 확인해 주세요.",
  "specDetails": "[한눈에 보는 제품 정보]\\n식당 및 업소 주방에서 가장 대중적으로 사용되는 우성 45박스 4도어 직냉식 냉장냉동고입니다. 총 4개 도어 중 좌측 상단 1칸은 냉동실, 나머지 3칸(우측 2칸 + 좌측 하단 1칸)은 대용량 냉장실로 나뉘어 있어, 신선 식자재와 자주 쓰는 냉동 식자재를 효율적으로 분리 보관할 수 있습니다.\\n\\n[제품 특징]\\n• 도어별 냉장/냉동 분할 수납: 좌상단 1칸 냉동실 + 나머지 3칸 냉장실 구성으로 불필요한 냉기 유출 최소화\\n• 견고한 스테인리스 외관: 오염과 부식에 강해 바쁜 업소 주방에서도 위생적인 관리 가능\\n• 직냉식 강력 냉각: 벽면 직접 냉각 방식으로 식재료의 수분 증발을 억제하여 신선도 유지\\n\\n[주요 사양]\\n• 모델명: CWS-1243RF\\n• 도어 및 구획 구성: 4도어 (냉동 1칸 / 냉장 3칸)\\n• 냉동실 위치: 좌측 상단 1도어\\n• 냉장실 위치: 우측 상·하단 및 좌측 하단 3도어\\n• 크기(외경): 1,260 × 800 × 1,900 mm (가로×깊이×높이)\\n• 전원 규격: 단상 220V / 60Hz (정격전류 2.5A)\\n• 설치 참고: 제품 가로폭(1,260mm) 및 높이(1,900mm) 출입문 통과 공간 사전 확인 필요",
  "needsReview": [
    "실제 명판 스티커의 정격전압 및 외관 상태 확인 필요"
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

    // 초고속 처리: 불필요한 사족 방지 및 충분한 출력 버퍼(4096 토큰)로 응답 잘림 방지
    const config = useSearch
      ? {
          tools: [{ googleSearch: {} }],
          temperature: 0.1,
          maxOutputTokens: 4096,
        }
      : {
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 4096,
        };

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
    const rawParsed = cleanAndParseAIJson(responseText);

    const aiCategory =
      typeof rawParsed.category === "string" ? rawParsed.category.trim() : "";
    const normalizedAiCategory = (
      PRODUCT_CATEGORIES as readonly string[]
    ).includes(aiCategory)
      ? aiCategory
      : normalizeProductCategory(aiCategory);

    // AI 카테고리가 비어있거나 "기타"이고, 관리자가 기존에 선택한 유효 카테고리가 있으면 보존
    const finalCategory =
      normalizedAiCategory && normalizedAiCategory !== "기타"
        ? normalizedAiCategory
        : categoryHint && (PRODUCT_CATEGORIES as readonly string[]).includes(categoryHint)
        ? categoryHint
        : normalizedAiCategory || "기타";

    let modelNumber = rawParsed.modelNumber
      ? String(rawParsed.modelNumber).trim()
      : "";

    // 모델명이 명시적 키에서 빠졌을 경우, 제목이나 관찰 텍스트에서 모델명 패턴 보조 탐지
    if (!modelNumber || modelNumber === "미확인") {
      const textToScan = `${rawParsed.title || ""} ${Array.isArray(rawParsed.photoObserved) ? rawParsed.photoObserved.join(" ") : ""}`;
      const modelMatch = textToScan.match(/\b([A-Z0-9]{3,8}-[A-Z0-9]{3,8}|[A-Z]{1,3}\d{2,4}[A-Z0-9]{2,8})\b/i);
      if (modelMatch && modelMatch[1]) {
        modelNumber = modelMatch[1].toUpperCase();
      }
    }

    const title =
      rawParsed.title && typeof rawParsed.title === "string" && rawParsed.title.trim()
        ? rawParsed.title.trim()
        : modelNumber
        ? `${finalCategory} (${modelNumber})`
        : "중고 가전/기기";

    let specDetails =
      rawParsed.specDetails && typeof rawParsed.specDetails === "string"
        ? rawParsed.specDetails.trim()
        : typeof rawParsed.description === "string"
        ? rawParsed.description
        : "";

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

    // specDetails가 혹시라도 비어있을 경우, 수집된 관찰/검색 정보로 구조화된 초안 자동 합성
    if (!specDetails) {
      const parts: string[] = [];
      parts.push("[한눈에 보는 제품 정보]");
      parts.push(
        modelNumber
          ? `${modelNumber} 모델의 실물 사진 판독 기반 등록 초안입니다.`
          : "실물 사진을 기반으로 작성된 등록 초안입니다."
      );
      if (photoObserved.length > 0) {
        parts.push("\n[제품 특징]");
        photoObserved.forEach((p) => parts.push(`• ${p}`));
      }
      if (searchDerivedSpecs.length > 0 || modelNumber) {
        parts.push("\n[주요 사양]");
        if (modelNumber) parts.push(`• 모델명: ${modelNumber}`);
        searchDerivedSpecs.forEach((s) => parts.push(`• ${s}`));
      }
      specDetails = parts.join("\n");
    }

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

    const imageRotations = Array.isArray(rawParsed.imageRotations)
      ? rawParsed.imageRotations
          .map((item) => {
            if (item && typeof item === "object") {
              const obj = item as Record<string, unknown>;
              const index = typeof obj.index === "number" ? obj.index : 0;
              const rotate = typeof obj.rotate === "number" ? obj.rotate : 0;
              return { index, rotate };
            }
            return null;
          })
          .filter(
            (it): it is { index: number; rotate: number } =>
              it !== null &&
              it.index > 0 &&
              [0, 90, 180, 270].includes(it.rotate)
          )
      : [];

    const sanitized = sanitizeOldManufactureYear(
      {
        category: finalCategory,
        title,
        specDetails,
        aiDraftSummary: specDetails,
        modelNumber,
        photoObserved,
        searchDerivedSpecs,
        needsReview,
      },
      currentYear
    );

    return NextResponse.json({
      isDraft: true,
      modelUsed, // <-- 실제 사용된 모델(폴백 포함) 반환
      category: sanitized.category || finalCategory,
      title: sanitized.title || title,
      specDetails: sanitized.specDetails || specDetails,
      aiDraftSummary: sanitized.aiDraftSummary || specDetails,
      modelNumber,
      photoObserved: sanitized.photoObserved || photoObserved,
      searchDerivedSpecs: sanitized.searchDerivedSpecs || searchDerivedSpecs,
      sourceVerificationNote,
      needsReview: sanitized.needsReview || needsReview,
      sourceUrls,
      imageRotations,
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
