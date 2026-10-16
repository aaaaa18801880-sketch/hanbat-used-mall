// 파일 경로: app/api/analyze-inquiry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  PRODUCT_CATEGORIES,
  normalizeProductCategory,
  type InquiryTypeValue,
  type ProductCategoryValue,
  type AnalyzeInquiryResponse,
  type ExtractedFactItem,
  type PhotoBreakdownItem,
  type BulkRequestedItem,
} from "../../../lib/site";
import {
  checkRateLimit,
  getClientIp,
  validateServerImageFiles,
} from "../../../lib/server-security";

export const runtime = "nodejs";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_GEMINI_MODEL = "gemini-2.5-flash";

const ALLOWED_INQUIRY_TYPES: readonly InquiryTypeValue[] = [
  "구매 문의",
  "내 물건 팔기",
  "대량·업소용 상담",
  "기타 문의",
];

function normalizeInquiryType(raw: string): InquiryTypeValue {
  const trimmed = raw.trim();
  if ((ALLOWED_INQUIRY_TYPES as readonly string[]).includes(trimmed)) {
    return trimmed as InquiryTypeValue;
  }
  if (trimmed.includes("구매")) return "구매 문의";
  if (trimmed.includes("대량") || trimmed.includes("업소")) {
    return "대량·업소용 상담";
  }
  if (trimmed.includes("기타")) return "기타 문의";
  return "내 물건 팔기";
}

interface UserInputContext {
  inquiryType: InquiryTypeValue;
  photoCount: number;
  userTitle: string;
  userModel: string;
  userRegion: string;
  userDescription: string;
  userBusinessType: string;
  userElectrical: string;
  userVoltageUpgrade: string;
}

const COMMON_AI_PRINCIPLES = `
[공통 핵심 원칙 — 사실과 미확인 정보의 엄격한 분리]
- 당신은 한밭중고전자의 고객 문의 작성을 돕는 보조 도구이며, 확인되지 않은 사실을 결정하는 도구가 아닙니다.
- 사진에서 실제로 확인되는 정보와 사진만으로 확인할 수 없는 정보를 엄격히 구분하세요.
- 모델명, 제조년월, 전압, 소비전력, 제품 수량, 제품 상태 등을 근거 없이 생성하거나 추측하지 마세요.
- 사진에서 판독할 수 없는 값은 빈 문자열("") 또는 "미확인", "고객 확인 필요"로 반환하세요.
- 사진 속 글자가 흐리거나 일부만 보이면 확정하지 말고 "일부 판독(재확인 필요)" 상태로 기록하세요.
- 고객이 현재 폼에 직접 입력한 내용과 사진에서 추출한 내용을 구분하세요. 고객이 입력한 제품명이나 수량을 임의로 바꾸지 마세요.
- 여러 사진이 첨부되면 각 사진(1번, 2번, 3번)의 내용을 개별 분석("photoBreakdown")한 뒤 동일 제품/현장인지 종합하고, 서로 다른 제품이나 현장의 사진을 하나의 제품으로 혼동하지 마세요.
- 확인되지 않은 정보는 상세 문의 초안("descriptionDraft")에 사실처럼 단정해 쓰지 말고, 고객이 채워 넣을 빈칸이나 후속 질문("followUpQuestions")으로 제시하세요.

[절대 혼동 금지 3대 기준]
1. 사진에 보이는 제품 대수 ≠ 고객이 실제로 구매하거나 처분하려는 희망 수량 (고객이 수량을 명시하지 않았다면 희망 수량은 반드시 "미확인"으로 처리)
2. 분전반·콘센트 사진에서 보이는 전기 표시 정보 ≠ 실제 승압 공사 필요 여부 판단 (사진만으로 승압이 필요하다고 절대 단정하지 말고 "모름·현장 확인 필요"로 처리)
3. 외관 사진에서 관찰되는 상태(흠집·외형) ≠ 제품의 실제 작동 상태(냉방·냉동 성능, 압축기, 소음, 누수, 전기 안전성 등 작동 여부는 사진으로 알 수 없으므로 "작동 상태 미확인 — 고객 확인 필요"로 분리)
`;

function buildUserContextBlock(ctx: UserInputContext): string {
  const lines = [
    `• 선택된 상담 유형: ${ctx.inquiryType}`,
    `• 첨부된 사진 수: ${ctx.photoCount}장`,
    ctx.userTitle ? `• 고객 입력 제목/품목: ${ctx.userTitle}` : null,
    ctx.userModel ? `• 고객 입력 모델명: ${ctx.userModel}` : null,
    ctx.userRegion ? `• 고객 입력 지역: ${ctx.userRegion}` : null,
    ctx.userBusinessType ? `• 고객 입력 업종: ${ctx.userBusinessType}` : null,
    ctx.userElectrical ? `• 고객 선택 전기환경: ${ctx.userElectrical}` : null,
    ctx.userVoltageUpgrade
      ? `• 고객 선택 승압여부: ${ctx.userVoltageUpgrade}`
      : null,
    ctx.userDescription
      ? `• 고객 작성 상세내용: ${ctx.userDescription}`
      : null,
  ].filter(Boolean);
  return `[현재 고객이 폼에 직접 입력한 정보]\n${lines.join("\n")}`;
}

function buildBuyPrompt(ctx: UserInputContext): string {
  return `
당신은 대전 중고가전·업소용 주방기기 전문 매장 '한밭중고전자'의 [구매 문의] 전용 AI 분석 도우미입니다.
목적: 고객이 원하는 제품의 재고·가격·배송·설치 상담을 빠르고 정확하게 받을 수 있도록 돕습니다.

${COMMON_AI_PRINCIPLES}

${buildUserContextBlock(ctx)}

[구매 문의 전용 분석 지침]
- 첨부된 사진이 (1) 구매 희망/참고 제품 사진인지, (2) 설치 예정 공간 사진인지, (3) 배관·콘센트·전기 환경 사진인지 먼저 구분하세요.
- 고객이 설치 장소만 촬영했다면 공간의 구조만 설명하고, 특정 모델이나 특정 평형/용량이 필요하다고 단정하지 마세요.
- 사진만으로 매장 재고 보유 여부, 판매 가격, 정확한 배송비, 설치비를 확정하지 마세요.
- 구매 문의이므로 매입용 상태 등급("conditionGrade")은 절대 평가하지 말고 null로 반환하세요.
- "applianceCategory"는 다음 5개 중 하나로 분류하세요: "에어컨/냉난방기", "냉장고", "세탁기/건조기", "업소용기기", "기타".

반드시 다른 부연 설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "applianceCategory": "에어컨/냉난방기",
  "title": "벽걸이 에어컨 재고 및 배송·설치 문의",
  "modelNumber": "",
  "conditionGrade": null,
  "summaryNote": "첨부하신 사진에서 제품 유형과 설치 공간 환경을 확인하여 구매 문의 초안을 정리했습니다.",
  "photoBreakdown": [
    { "photoIndex": 1, "role": "설치 공간 사진 / 참고 제품 사진", "summary": "사진에서 직접 확인된 내용 요약" }
  ],
  "extractedFacts": [
    { "label": "제품 종류", "value": "확인된 값 또는 미확인", "source": "사진 판독", "status": "확인됨" }
  ],
  "missingInfo": ["설치 희망 지역 및 층수(엘리베이터 유무)", "희망 용량 또는 예산 범위"],
  "followUpQuestions": ["설치하실 지역(동 단위)과 층수, 엘리베이터 유무를 알려주시겠어요?", "원하시는 용량(평형/리터)이나 선호 브랜드가 있으신가요?"],
  "purchaseAnalysis": {
    "photoTypes": ["참고 제품 사진"],
    "requestedProduct": "확인된 제품 종류 및 모델/특징 요약 (미확인 시 미확인 표기)",
    "confirmedSpecs": ["사진에서 읽히는 용량/규격만 기재, 없으면 빈 배열"],
    "installationObservations": ["사진에서 확인되는 설치 공간·콘센트·배관 사항, 없으면 빈 배열"],
    "purchaseRequirements": ["재고 및 설치 가능 여부 확인 요청"]
  },
  "descriptionDraft": "• 구매 희망 품목: \\n• 확인된 모델명/규격: (미확인 시 상담 후 결정)\\n• 사진 확인 사항: \\n• 설치 희망 지역 및 층수(엘리베이터 유무): \\n• 추가 문의사항(희망 배송일 등): "
}
`;
}

function buildSellPrompt(ctx: UserInputContext): string {
  return `
당신은 대전 중고가전·업소용 주방기기 전문 매장 '한밭중고전자'의 [내 물건 팔기 / 매입 문의] 전용 AI 분석 도우미입니다.
목적: 매입 가능 여부를 검토하고 관리자가 전화 상담 전에 제품의 주요 정보를 정확히 파악할 수 있게 돕습니다.

${COMMON_AI_PRINCIPLES}

${buildUserContextBlock(ctx)}

[내 물건 팔기(매입) 전용 분석 지침]
- 가전제품 종류와 사진에서 확인 가능한 제조사, 모델명(명판 식별 정보)을 추출하세요.
- 제조년월(연식)이 명판에서 실제로 선명하게 읽히는 경우에만 기록하고, 읽히지 않으면 절대 추정하지 말고 "미확인"으로 반환하세요.
- 전기용품 및 생활용품 안전관리법 관련 표시사항(정격전압, 소비전력, 인증번호 등 해당 품목 적용 라벨)의 가독성을 "선명함", "일부만 보임", "판독 불가", "라벨 사진 없음" 중 하나로 평가하세요. 모든 제품에 동일한 인증 표시가 있다고 단정하지 마세요.
- 외관 사진에서 관찰되는 긁힘, 찌그러짐, 변색, 부식, 파손 등은 있는 그대로의 관찰 사실("visibleConditionNotes")로만 작성하세요.
- 외관 사진만으로 "정상 작동함", "냉방/냉동 잘됨", "소음 없음"이라고 절대 단정하지 마세요. 작동 상태는 반드시 "작동 상태 미확인 — 고객 확인 필요"로 구분하세요.
- 제품 전체 사진과 명판 라벨 사진이 함께 있다면 두 사진이 같은 제품인지("일치 확인", "단일 사진/비교 대상 없음", "불일치 의심 — 확인 필요") 확인하세요.
- 사진만으로 제품 등급(S/A/B/C급)을 신뢰성 있게 확정할 수 없으므로 "conditionGrade"는 null로 반환하여 고객이 직접 선택하게 하세요.

반드시 다른 부연 설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "applianceCategory": "냉장고",
  "title": "양문형 냉장고 방문 매입 견적 문의",
  "modelNumber": "",
  "conditionGrade": null,
  "summaryNote": "첨부 사진에서 외관 및 라벨 판독 가능 정보를 추출했습니다. 실제 작동 상태와 수거 여건을 확인해 주세요.",
  "photoBreakdown": [
    { "photoIndex": 1, "role": "제품 외관 전면 / 명판 라벨", "summary": "사진별 판독 내용" }
  ],
  "extractedFacts": [
    { "label": "품목/제조사", "value": "확인된 값", "source": "사진 판독", "status": "확인됨" },
    { "label": "제조년월(연식)", "value": "미확인", "source": "사진 판독", "status": "미확인" },
    { "label": "작동 상태", "value": "작동 상태 미확인 — 고객 확인 필요", "source": "사진 판독", "status": "미확인" }
  ],
  "missingInfo": ["실제 정상 작동 여부(냉장·냉동·소음 등)", "정확한 제조년월(연식)", "수거 지역 및 층수(엘리베이터 유무)"],
  "followUpQuestions": ["현재 전원을 켰을 때 냉장·냉동이나 주요 기능이 정상 작동하나요?", "명판 스티커의 제조년월(연식)과 모델명을 확인해 주실 수 있나요?", "수거 방문할 지역(동 단위)과 층수, 엘리베이터 유무는 어떻게 되나요?"],
  "sellAnalysis": {
    "manufacturer": "확인된 제조사 또는 미확인",
    "manufacturingDate": "판독된 제조년월 또는 미확인",
    "safetyLabelReadability": "선명함 | 일부만 보임 | 판독 불가 | 라벨 사진 없음",
    "safetyLabelDetails": ["판독된 정격전압/소비전력/모델명 등 사실만 기재"],
    "visibleConditionNotes": ["외관 사진에서 직접 관찰되는 상태 요약"],
    "photoLabelConsistency": "일치 확인 | 단일 사진/비교 대상 없음 | 불일치 의심 — 확인 필요",
    "operatingStatusNote": "작동 상태 미확인 — 고객 확인 필요",
    "confirmedQuantity": "고객이 기재했거나 명확히 확인된 수량, 불확실하면 미확인"
  },
  "descriptionDraft": "• 매입 문의 품목: \\n• 확인된 제조사 / 모델명: \\n• 제조년월(연식): \\n• 사진상 외관 관찰 사항: \\n• 실제 작동 상태 (정상 작동 여부 직접 기입): [작동 상태 미확인 — 고객 확인 필요]\\n• 수거 희망 지역 / 층수(엘리베이터 유무) / 희망 일정: "
}
`;
}

function buildBulkPrompt(ctx: UserInputContext): string {
  return `
당신은 대전 중고가전·업소용 주방기기 전문 매장 '한밭중고전자'의 [대량·업소용 상담] 전용 AI 분석 도우미입니다.
목적: 식당·카페·베이커리·마트·사무실 등 사업자가 필요한 장비의 종류와 수량, 전기 및 설치 환경을 구조화하여 대량 구매·설치·폐업 정리 상담을 정확히 받도록 돕습니다.

${COMMON_AI_PRINCIPLES}

${buildUserContextBlock(ctx)}

[대량·업소용 상담 전용 분석 지침]
1. 장비 종류와 수량 구분:
   - 냉장고·냉동고(25/30/45박스, 테이블냉장고), 제빙기, 식기세척기, 쇼케이스, 냉난방기, 조리기기 등을 분류하세요.
   - 사진 속에 장비가 보인다는 이유만으로 고객이 그 장비를 구매하려 한다고 단정하지 마세요.
   - 사진에서 관찰되는 장비 대수("observedInPhotoCount")와 고객의 실제 구매 희망 수량("requestedQuantity")을 엄격히 분리하세요. 고객이 희망 수량을 직접 입력하지 않았다면 "requestedQuantity"는 반드시 "미확인"으로 반환하세요.
2. 전기 용량 및 승압:
   - 분전반, 차단기, 계량기, 명판 등이 사진에 있으면 읽을 수 있는 정보(단상/삼상, 표시 전압, 계약전력/차단기 용량)만 추출하고, 안 보이면 "미확인"으로 처리하세요.
   - 사진만 보고 승압이 필요하다고 절대 확정하지 마세요. "voltageUpgradeStatus"는 고객이 명시하지 않은 한 반드시 "모름·현장 확인 필요"로 설정하고, 실제 승압 여부는 장비 사양 및 현장 전기 조건 확인이 필요하다고 안내하세요.
3. 설치 환경 및 반입 동선:
   - 공간 구조, 급수·배수, 가스, 환기, 출입구 폭, 계단/엘리베이터 등을 사진에서 확인 가능한 수준으로만 정리하세요.
   - 사진에 치수가 없으면 가로·세로 길이(mm)를 숫자로 만들어내지 마세요. 공간이 넓어 보인다고 설치 가능하다고 확정하지 마세요.

반드시 다른 부연 설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "applianceCategory": "업소용기기",
  "title": "업소용 주방·냉장 설비 대량 도입 및 설치 상담",
  "modelNumber": "",
  "conditionGrade": null,
  "summaryNote": "첨부 사진과 입력 정보를 바탕으로 업소용 장비 목록과 전기·설치 확인 항목을 구조화했습니다.",
  "photoBreakdown": [
    { "photoIndex": 1, "role": "주방 설치 현장 / 분전반 / 참고 장비", "summary": "사진별 관찰 사실 요약" }
  ],
  "extractedFacts": [
    { "label": "확인된 장비/현장", "value": "관찰 내용", "source": "사진 판독", "status": "확인됨" }
  ],
  "missingInfo": ["품목별 정확한 구매 희망 수량", "매장 전기 규격(단상/삼상) 및 계약전력", "설치 희망 지역 및 일정"],
  "followUpQuestions": [
    "도입하시려는 품목별로 각각 몇 대씩 필요하신가요?",
    "매장 전기가 단상(220V)인지 삼상(380V)인지, 승압 여부가 확인되셨나요? (모르셔도 상담 가능합니다)",
    "설치 희망 지역과 오픈(또는 납품 희망) 일정이 언제인가요?"
  ],
  "bulkAnalysis": {
    "businessType": "고객 입력 업종 또는 미확인(식당/카페/사업장 등 확인 필요)",
    "requestedItems": [
      {
        "id": "item-1",
        "category": "사진에서 확인되거나 고객이 요청한 품목명",
        "observedInPhotoCount": 1,
        "requestedQuantity": "미확인",
        "modelNumber": "미확인",
        "specs": "사진에서 확인된 외형/규격만 기재",
        "verificationStatus": "사진 참고 확인(수량 미정)"
      }
    ],
    "electricalInfo": {
      "phaseType": "모름/미확인",
      "observedVoltage": "미확인",
      "contractPower": "미확인",
      "readability": "전기/분전반 사진 없음 또는 판독 불가",
      "voltageUpgradeStatus": "모름·현장 확인 필요",
      "notes": "실제 승압 필요 여부는 도입 장비 사양 및 현장 분전반 확인 후 판단이 필요합니다."
    },
    "installationInfo": {
      "spaceLayout": "사진에서 확인되는 공간 구조 (치수 추정 금지)",
      "utilities": "급수·배수·가스·환기·콘센트 관찰 사항 또는 미확인",
      "accessRoute": "출입구·계단·엘리베이터 등 반입 동선 확인 필요",
      "removalAndExtra": "기존 장비 철거 유무 및 세금계산서 발행 등 추가 요청 확인 필요",
      "targetRegionAndSchedule": "미확인 (고객 입력 필요)"
    }
  },
  "descriptionDraft": "• 업종 및 용도: \\n• 구매/도입 희망 장비 및 수량: (품목별 희망 대수를 적어주세요)\\n• 전기 환경 및 승압 확인: 단상/삼상 미확인 (모름·현장 확인 필요)\\n• 설치 공간 및 설비(급배수·가스·동선) 메모: \\n• 설치 희망 지역 및 일정: \\n• 기존 철거 유무 및 추가 요청사항: "
}
`;
}

function buildOtherPrompt(ctx: UserInputContext): string {
  return `
당신은 대전 중고가전·업소용 주방기기 전문 매장 '한밭중고전자'의 [기타 문의] 전용 AI 분석 도우미입니다.
목적: 고객의 질문 의도를 훼손하지 않고 핵심을 깔끔하게 정리합니다.

${COMMON_AI_PRINCIPLES}

${buildUserContextBlock(ctx)}

[기타 문의 전용 분석 지침]
- 일반적인 문의나 제품과 무관한 사진에 억지로 가전제품 종류, 제조사, 모델명, 제품 등급("conditionGrade")을 지정하지 마세요.
- 원래 문의 의도를 유지하고, 사진에서 명확히 확인되는 사실만 요약하세요.
- 제품 정보가 없으면 제품 분석 대신 문의 초안 정리 중심으로 처리하고, 답변에 꼭 필요한 질문만 1~2개 제안하세요.

반드시 다른 부연 설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "applianceCategory": "기타",
  "title": "기타 상담 문의드립니다",
  "modelNumber": "",
  "conditionGrade": null,
  "summaryNote": "첨부 사진에서 확인 가능한 내용만 요약하여 문의 초안을 정리했습니다.",
  "photoBreakdown": [
    { "photoIndex": 1, "role": "첨부 참고 이미지", "summary": "사진에서 명확히 확인되는 내용" }
  ],
  "extractedFacts": [],
  "missingInfo": ["구체적인 문의 용건 또는 희망 상담 내용"],
  "followUpQuestions": ["어떤 부분에 대해 가장 우선적으로 안내받기 원하시나요?"],
  "otherAnalysis": {
    "inquirySummary": "고객 문의 핵심 요약",
    "observedItems": ["사진에서 확인된 요소 (없으면 빈 배열)"]
  },
  "descriptionDraft": "• 문의 내용: \\n• 사진 참고 사항: \\n• 연락 희망 시간대 또는 추가 요청: "
}
`;
}

function cleanText(val: unknown, maxLen = 300, fallback = ""): string {
  if (typeof val !== "string") return fallback;
  const trimmed = val.trim();
  if (
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "N/A" ||
    trimmed === "없음"
  ) {
    return fallback;
  }
  return trimmed.slice(0, maxLen);
}

function cleanStringArray(val: unknown, maxItems = 8, maxLen = 200): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((item) => cleanText(item, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function sanitizeAnalysisResponse(
  raw: Record<string, unknown>,
  ctx: UserInputContext
): AnalyzeInquiryResponse {
  const { inquiryType } = ctx;

  const rawCat = cleanText(raw.applianceCategory, 40);
  let applianceCategory: ProductCategoryValue | "" = "기타";
  if (inquiryType === "기타 문의" && (!rawCat || rawCat === "기타")) {
    applianceCategory = "기타";
  } else if ((PRODUCT_CATEGORIES as readonly string[]).includes(rawCat)) {
    applianceCategory = rawCat as ProductCategoryValue;
  } else if (rawCat) {
    applianceCategory = normalizeProductCategory(rawCat);
  } else if (inquiryType === "대량·업소용 상담") {
    applianceCategory = "업소용기기";
  }

  const rawModel = cleanText(raw.modelNumber, 60);
  const isUnverifiedModel =
    !rawModel ||
    /^(미확인|알\s*수\s*없음|판독\s*불가|확인\s*불가|없음|unknown|none)$/i.test(
      rawModel
    );
  const modelNumber =
    inquiryType === "기타 문의"
      ? ""
      : isUnverifiedModel
      ? ctx.userModel || ""
      : rawModel;

  // 제품 등급(conditionGrade)은 AI가 임의로 확정하지 않도록 null 반환
  const conditionGrade: string | null = null;

  const defaultTitles: Record<InquiryTypeValue, string> = {
    "구매 문의": `${applianceCategory} 재고 및 구매·설치 문의`,
    "내 물건 팔기": `${applianceCategory} 방문 매입 견적 문의`,
    "대량·업소용 상담": "업소용 주방·냉장 설비 대량 도입 및 설치 상담",
    "기타 문의": "상담 문의드립니다",
  };

  const title =
    cleanText(raw.title, 80) || ctx.userTitle || defaultTitles[inquiryType];

  const summaryNote =
    cleanText(raw.summaryNote, 240) ||
    `첨부 사진 ${ctx.photoCount}장을 [${inquiryType}] 기준에 맞춰 분석했습니다. 미확인 항목을 확인 후 제출해 주세요.`;

  const photoBreakdown: PhotoBreakdownItem[] = Array.isArray(raw.photoBreakdown)
    ? raw.photoBreakdown
        .slice(0, MAX_FILES)
        .map((item: unknown, idx: number) => {
          const obj =
            item && typeof item === "object"
              ? (item as Record<string, unknown>)
              : {};
          return {
            photoIndex:
              typeof obj.photoIndex === "number" ? obj.photoIndex : idx + 1,
            role: cleanText(obj.role, 60, `사진 ${idx + 1}`),
            summary: cleanText(obj.summary, 200, "사진 판독 완료"),
          };
        })
    : [];

  const extractedFacts: ExtractedFactItem[] = Array.isArray(raw.extractedFacts)
    ? raw.extractedFacts.slice(0, 12).map((item: unknown) => {
        const obj =
          item && typeof item === "object"
            ? (item as Record<string, unknown>)
            : {};
        const rawSource = cleanText(obj.source, 30);
        const source =
          rawSource === "고객 직접 입력" ? "고객 직접 입력" : "사진 판독";
        const rawStatus = cleanText(obj.status, 30);
        const status =
          rawStatus === "확인됨" || rawStatus === "일부 판독(재확인 필요)"
            ? rawStatus
            : "미확인";
        return {
          label: cleanText(obj.label, 50, "확인 항목"),
          value: cleanText(obj.value, 140, "미확인"),
          source,
          status,
        };
      })
    : [];

  const missingInfo = cleanStringArray(raw.missingInfo, 8, 140);
  const followUpQuestions = cleanStringArray(raw.followUpQuestions, 6, 160);

  let descriptionDraft = cleanText(raw.descriptionDraft, 1800);

  const response: AnalyzeInquiryResponse = {
    success: true,
    inquiryType,
    applianceCategory,
    title,
    modelNumber,
    conditionGrade,
    descriptionDraft: "",
    summaryNote,
    photoBreakdown,
    extractedFacts,
    missingInfo,
    followUpQuestions,
  };

  if (inquiryType === "구매 문의") {
    const pa =
      raw.purchaseAnalysis && typeof raw.purchaseAnalysis === "object"
        ? (raw.purchaseAnalysis as Record<string, unknown>)
        : {};
    response.purchaseAnalysis = {
      photoTypes: cleanStringArray(pa.photoTypes, 4, 60),
      requestedProduct: cleanText(
        pa.requestedProduct,
        160,
        `${applianceCategory}${modelNumber ? ` (${modelNumber})` : ""}`
      ),
      confirmedSpecs: cleanStringArray(pa.confirmedSpecs, 6, 120),
      installationObservations: cleanStringArray(
        pa.installationObservations,
        6,
        150
      ),
      purchaseRequirements: cleanStringArray(pa.purchaseRequirements, 6, 150),
    };

    if (!descriptionDraft) {
      descriptionDraft = [
        `• 구매 희망 품목: ${response.purchaseAnalysis.requestedProduct}`,
        `• 확인된 모델명/사양: ${modelNumber || "미확인 (상담 시 추천 희망)"}`,
        response.purchaseAnalysis.installationObservations.length > 0
          ? `• 사진 확인 사항: ${response.purchaseAnalysis.installationObservations.join(", ")}`
          : null,
        `• 설치 희망 지역 및 층수(엘리베이터 유무): ${ctx.userRegion || "(입력 필요)"}`,
        `• 상세 문의 내용: `,
      ]
        .filter(Boolean)
        .join("\n");
    }
  } else if (inquiryType === "내 물건 팔기") {
    const sa =
      raw.sellAnalysis && typeof raw.sellAnalysis === "object"
        ? (raw.sellAnalysis as Record<string, unknown>)
        : {};
    const rawReadability = cleanText(sa.safetyLabelReadability, 40);
    const safetyLabelReadability = (
      ["선명함", "일부만 보임", "판독 불가", "라벨 사진 없음"] as const
    ).includes(rawReadability as "선명함")
      ? (rawReadability as
          | "선명함"
          | "일부만 보임"
          | "판독 불가"
          | "라벨 사진 없음")
      : "라벨 사진 없음";

    const rawConsistency = cleanText(sa.photoLabelConsistency, 50);
    const photoLabelConsistency = (
      [
        "일치 확인",
        "단일 사진/비교 대상 없음",
        "불일치 의심 — 확인 필요",
      ] as const
    ).includes(rawConsistency as "일치 확인")
      ? (rawConsistency as
          | "일치 확인"
          | "단일 사진/비교 대상 없음"
          | "불일치 의심 — 확인 필요")
      : "단일 사진/비교 대상 없음";

    const manufacturingDate = cleanText(
      sa.manufacturingDate,
      50,
      "미확인 (고객 확인 필요)"
    );

    const operatingStatusNote =
      "작동 상태 미확인 — 고객 확인 필요 (냉방·냉동 성능, 소음, 누수 등 실제 작동 여부를 선택/기재해 주세요)";

    response.sellAnalysis = {
      manufacturer: cleanText(sa.manufacturer, 50, "미확인"),
      manufacturingDate,
      safetyLabelReadability,
      safetyLabelDetails: cleanStringArray(sa.safetyLabelDetails, 6, 140),
      visibleConditionNotes: cleanStringArray(sa.visibleConditionNotes, 6, 150),
      photoLabelConsistency,
      operatingStatusNote,
      confirmedQuantity: cleanText(sa.confirmedQuantity, 40, "미확인"),
    };

    if (!descriptionDraft) {
      descriptionDraft = [
        `• 매입 문의 품목: ${applianceCategory} (${response.sellAnalysis.manufacturer !== "미확인" ? response.sellAnalysis.manufacturer : "제조사 확인 필요"})`,
        `• 판독 모델명: ${modelNumber || "미확인 (명판 확인 필요)"}`,
        `• 판독 제조년월(연식): ${manufacturingDate}`,
        response.sellAnalysis.visibleConditionNotes.length > 0
          ? `• 사진상 외관 관찰: ${response.sellAnalysis.visibleConditionNotes.join(", ")}`
          : `• 사진상 외관 관찰: 특이 파손 미관찰 (실물 확인 필요)`,
        `• 실제 작동 상태: 작동 상태 미확인 — 고객 확인 필요`,
        `• 수거 희망 지역 및 층수(엘리베이터 유무): ${ctx.userRegion || "(입력 필요)"}`,
      ].join("\n");
    }
  } else if (inquiryType === "대량·업소용 상담") {
    const ba =
      raw.bulkAnalysis && typeof raw.bulkAnalysis === "object"
        ? (raw.bulkAnalysis as Record<string, unknown>)
        : {};
    const rawItems = Array.isArray(ba.requestedItems) ? ba.requestedItems : [];

    const userMentionedQty = /(\d+)\s*(대|개|세트|조)/.test(
      `${ctx.userTitle} ${ctx.userDescription}`
    );

    const requestedItems: BulkRequestedItem[] =
      rawItems.length > 0
        ? rawItems.slice(0, 10).map((it: unknown, idx: number) => {
            const obj =
              it && typeof it === "object"
                ? (it as Record<string, unknown>)
                : {};
            const rawQty = cleanText(obj.requestedQuantity, 40, "미확인");
            const safeQuantity =
              !userMentionedQty && /^\d+\s*(대|개)?$/.test(rawQty)
                ? "미확인"
                : rawQty || "미확인";

            return {
              id: `bulk-item-${idx + 1}`,
              category: cleanText(obj.category, 60, "업소용 설비"),
              observedInPhotoCount:
                typeof obj.observedInPhotoCount === "number"
                  ? obj.observedInPhotoCount
                  : null,
              requestedQuantity: safeQuantity,
              modelNumber: cleanText(obj.modelNumber, 60, "미확인"),
              specs: cleanText(obj.specs, 120, ""),
              verificationStatus: userMentionedQty
                ? "고객 입력 확인"
                : "사진 참고 확인(수량 미정)",
            };
          })
        : [
            {
              id: "bulk-item-1",
              category: applianceCategory || "업소용 냉장·주방기기",
              observedInPhotoCount: null,
              requestedQuantity: "미확인",
              modelNumber: modelNumber || "미확인",
              specs: "",
              verificationStatus: "추가 확인 필요",
            },
          ];

    const elec =
      ba.electricalInfo && typeof ba.electricalInfo === "object"
        ? (ba.electricalInfo as Record<string, unknown>)
        : {};
    const inst =
      ba.installationInfo && typeof ba.installationInfo === "object"
        ? (ba.installationInfo as Record<string, unknown>)
        : {};

    const safeVoltageUpgrade: "필요" | "불필요" | "모름·현장 확인 필요" =
      ctx.userVoltageUpgrade === "필요"
        ? "필요"
        : ctx.userVoltageUpgrade === "불필요"
        ? "불필요"
        : "모름·현장 확인 필요";

    const rawPhase = cleanText(elec.phaseType, 40);
    const safePhase: "단상 220V" | "삼상 380V" | "모름/미확인" =
      ctx.userElectrical === "단상 220V" || rawPhase === "단상 220V"
        ? "단상 220V"
        : ctx.userElectrical === "삼상 380V" || rawPhase === "삼상 380V"
        ? "삼상 380V"
        : "모름/미확인";

    response.bulkAnalysis = {
      businessType:
        ctx.userBusinessType ||
        cleanText(ba.businessType, 60, "미확인 (업종 입력 권장)"),
      requestedItems,
      electricalInfo: {
        phaseType: safePhase,
        observedVoltage: cleanText(elec.observedVoltage, 60, "미확인"),
        contractPower: cleanText(elec.contractPower, 60, "미확인"),
        readability: cleanText(
          elec.readability,
          80,
          "분전반/전기 표시 미확인"
        ),
        voltageUpgradeStatus: safeVoltageUpgrade,
        notes: cleanText(
          elec.notes,
          180,
          "실제 승압 필요 여부는 장비 사양 및 현장 전기 조건 확인이 필요합니다."
        ),
      },
      installationInfo: {
        spaceLayout: cleanText(inst.spaceLayout, 180, "현장 치수/배치 확인 필요"),
        utilities: cleanText(
          inst.utilities,
          180,
          "급수·배수·가스·환기 조건 확인 필요"
        ),
        accessRoute: cleanText(
          inst.accessRoute,
          180,
          "출입구 폭 및 반입 동선 확인 필요"
        ),
        removalAndExtra: cleanText(
          inst.removalAndExtra,
          180,
          "기존 장비 철거 유무 및 추가 요청 확인 필요"
        ),
        targetRegionAndSchedule:
          ctx.userRegion ||
          cleanText(inst.targetRegionAndSchedule, 120, "미확인"),
      },
    };

    if (!response.followUpQuestions.some((q) => q.includes("몇 대"))) {
      response.followUpQuestions.unshift(
        "품목별로 각각 몇 대씩 구매(또는 설치)를 희망하시나요?"
      );
    }

    if (!descriptionDraft) {
      const itemSummary = requestedItems
        .map(
          (it) =>
            `  - ${it.category} | 희망 수량: ${it.requestedQuantity}${
              it.modelNumber && it.modelNumber !== "미확인"
                ? ` | 모델: ${it.modelNumber}`
                : ""
            }`
        )
        .join("\n");
      descriptionDraft = [
        `• 업종 및 용도: ${response.bulkAnalysis.businessType}`,
        `• 확인된 장비 및 희망 수량:\n${itemSummary}`,
        `• 전기 규격 / 승압 여부: ${safePhase} / 승압(${safeVoltageUpgrade})`,
        `• 설치 공간 및 설비 관찰: ${response.bulkAnalysis.installationInfo.spaceLayout} (${response.bulkAnalysis.installationInfo.utilities})`,
        `• 설치 희망 지역 및 일정: ${ctx.userRegion || "(입력 필요)"}`,
        `• 철거 유무 및 추가 요청사항: `,
      ].join("\n");
    }
  } else {
    const oa =
      raw.otherAnalysis && typeof raw.otherAnalysis === "object"
        ? (raw.otherAnalysis as Record<string, unknown>)
        : {};
    response.otherAnalysis = {
      inquirySummary: cleanText(
        oa.inquirySummary,
        240,
        "첨부 이미지 참고 일반 문의"
      ),
      observedItems: cleanStringArray(oa.observedItems, 6, 120),
    };

    if (!descriptionDraft) {
      descriptionDraft = [
        `• 문의 요약: ${response.otherAnalysis.inquirySummary}`,
        response.otherAnalysis.observedItems.length > 0
          ? `• 사진 확인 내용: ${response.otherAnalysis.observedItems.join(", ")}`
          : null,
        `• 상세 문의 내용: `,
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  response.descriptionDraft = descriptionDraft;
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`analyze_inquiry:${ip}`, 8, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `AI 분석 요청이 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "현재 AI 자동 분석 기능을 사용할 수 없습니다. 아래 입력란에 직접 적어주시면 빠르게 확인하겠습니다.",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const entries = formData.getAll("files");
    const files = entries.filter((item): item is File => item instanceof File);

    const fileValidation = await validateServerImageFiles(files, {
      maxFiles: MAX_FILES,
      maxFileSizeBytes: MAX_FILE_SIZE,
    });

    if (!fileValidation.ok || !fileValidation.validated) {
      return NextResponse.json(
        { error: fileValidation.error || "유효한 사진 파일을 첨부해 주세요." },
        { status: 400 }
      );
    }

    const inquiryType = normalizeInquiryType(
      String(formData.get("inquiryType") || "내 물건 팔기")
    );

    const ctx: UserInputContext = {
      inquiryType,
      photoCount: fileValidation.validated.length,
      userTitle: cleanText(formData.get("userTitle"), 100),
      userModel: cleanText(formData.get("userModel"), 60),
      userRegion: cleanText(formData.get("userRegion"), 80),
      userDescription: cleanText(formData.get("userDescription"), 1000),
      userBusinessType: cleanText(formData.get("userBusinessType"), 60),
      userElectrical: cleanText(formData.get("userElectrical"), 40),
      userVoltageUpgrade: cleanText(formData.get("userVoltageUpgrade"), 40),
    };

    const prompt =
      inquiryType === "구매 문의"
        ? buildBuyPrompt(ctx)
        : inquiryType === "대량·업소용 상담"
        ? buildBulkPrompt(ctx)
        : inquiryType === "기타 문의"
        ? buildOtherPrompt(ctx)
        : buildSellPrompt(ctx);

    const imageParts = fileValidation.validated.map((item) => ({
      inlineData: {
        mimeType: item.mimeType,
        data: item.base64,
      },
    }));

    const ai = new GoogleGenAI({ apiKey });
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
        config: { responseMimeType: "application/json" },
      });
    } catch (modelErr: unknown) {
      const msg =
        modelErr instanceof Error ? modelErr.message : String(modelErr || "");
      if (
        DEFAULT_GEMINI_MODEL !== FALLBACK_GEMINI_MODEL &&
        (msg.includes("404") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("not supported"))
      ) {
        response = await ai.models.generateContent({
          model: FALLBACK_GEMINI_MODEL,
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }, ...imageParts],
            },
          ],
          config: { responseMimeType: "application/json" },
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
        console.warn("[analyze-inquiry] JSON 파싱 폴백 처리");
      }
    }

    const sanitized = sanitizeAnalysisResponse(rawParsed, ctx);
    return NextResponse.json(sanitized);
  } catch (err: unknown) {
    console.error(
      "[analyze-inquiry] 분석 처리 중 오류:",
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.json(
      {
        error:
          "사진 분석 중 일시적인 오류가 발생했습니다. 아래 입력란에 직접 적어주시면 빠르게 확인하겠습니다.",
      },
      { status: 500 }
    );
  }
}
