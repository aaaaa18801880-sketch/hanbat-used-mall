// 파일 경로: lib/site.ts
// 사이트 공통 상수, 데이터 표준 코드 및 유틸리티 단일 출처 (Single Source of Truth)

export const STORE = {
  name: "한밭중고전자",
  legalName: "한밭중고전자",
  ceo: "김영종",
  owner: "김영종",
  url: "https://hanbatmall.com",
  since: 1997,
  tel: "042-523-8179",
  tel2: "042-527-4888",
  mobile: process.env.NEXT_PUBLIC_STORE_MOBILE || "010-6631-8179",
  mobileLegacy: "010-5406-8179",
  address: "대전광역시 중구 대전천서로 691-62 1, 2층",
  roadAddress: "대전광역시 중구 대전천서로 691-62 1, 2층",
  jibunAddress: "대전광역시 중구 중촌동 144",
  addressNote: "중촌동 144 · 중촌고가도로 밑",
  parking: "매장 앞 전용 주차장 이용 가능",
  hours: "월~토 09:00 - 19:00",
  closed: "일요일 별도 문의",
  bizNo: "314-01-70945",
  mailOrderNo: "2011-대전서구-0292",
  privacyOfficer: "김태현(sunny3815@naver.com)",
  kakaoChannel: "https://pf.kakao.com/_XmyrX",
  kakaoChat: "https://pf.kakao.com/_XmyrX/chat",
  cafe: "https://cafe.naver.com/hanbatmall",
  naverMap: "https://naver.me/F5DkWQ4z",
  naverMapShort: "https://naver.me/F5DkWQ4z",
} as const;

/* ════════════════════════════════════════════════════════════
   0. 공식 보증/반품/배송 정책 단일 출처 (SSOT)
   ════════════════════════════════════════════════════════════ */
export const STORE_MERCHANT_POLICY = {
  applicableCountry: "KR",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 7,
  returnMethod: "https://schema.org/ReturnInStore",
  returnFees: "https://schema.org/FreeReturn",
  warrantyAircon:
    "에어컨류 계약조건별 최대 8개월 무상 보증 (사전 협의 및 계약서 명시 기준)",
  warrantyMajor:
    "주요 가전 계약조건별 최대 4개월 무상 보증 (사전 협의 및 계약서 명시 기준)",
  warrantyGeneral:
    "품목 및 거래 계약 조건에 따른 협의 보증 (사전 협의 및 계약서 명시 기준)",
} as const;

export const STORE_SHIPPING_POLICY = {
  currency: "KRW",
  rate: 0,
  destinationCountry: "KR",
  minHandlingDays: 0,
  maxHandlingDays: 1,
  minTransitDays: 1,
  maxTransitDays: 3,
} as const;

export const STORAGE_BUCKETS = {
  inquiries: "inquiries",
  legacyProductImages: "product-images",
} as const;

/* ════════════════════════════════════════════════════════════
   1. 상품(products) 상태 및 카테고리 표준 정의
   ════════════════════════════════════════════════════════════ */
export const PRODUCT_STATUS = {
  SELLING: "판매중",
  RESERVED: "예약중",
  SOLD: "판매완료",
} as const;

export type ProductStatusValue =
  (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export const PRODUCT_STATUS_LIST: readonly ProductStatusValue[] = [
  PRODUCT_STATUS.SELLING,
  PRODUCT_STATUS.RESERVED,
  PRODUCT_STATUS.SOLD,
] as const;

export const PRODUCT_CATEGORIES = [
  "에어컨/냉난방기",
  "냉장고",
  "세탁기/건조기",
  "업소용기기",
  "기타",
] as const;

export type ProductCategoryValue = (typeof PRODUCT_CATEGORIES)[number];

export const DELIVERY_REVIEW_CATEGORY = "배송인증" as const;

export const PRODUCT_CONDITION_GRADES = [
  "S급 (새상품급)",
  "A급 (사용감 적음)",
  "B급 (보통)",
  "C급 (노후/점검필요)",
] as const;

export function isProductSold(status?: string | null): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === "판매완료" || s === "sold" || s === "soldout";
}

export function isProductReserved(status?: string | null): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === "예약중" || s === "reserved";
}

export function normalizeProductStatus(
  status?: string | null
): ProductStatusValue {
  if (isProductSold(status)) return PRODUCT_STATUS.SOLD;
  if (isProductReserved(status)) return PRODUCT_STATUS.RESERVED;
  return PRODUCT_STATUS.SELLING;
}

export function getProductStatusLabel(status?: string | null): string {
  return normalizeProductStatus(status);
}

export function normalizeProductCategory(
  raw?: string | null
): ProductCategoryValue {
  const c = (raw ?? "").trim();
  if ((PRODUCT_CATEGORIES as readonly string[]).includes(c)) {
    return c as ProductCategoryValue;
  }
  if (c.includes("에어컨") || c.includes("냉난방")) return "에어컨/냉난방기";
  // 가정용 소형가전·생활가전·영상가전은 '주방/소형가전'으로 들어와도 '기타'로 정확히 분류
  if (
    c.includes("소형") ||
    c.includes("생활") ||
    c.includes("전자레인지") ||
    c.includes("밥솥") ||
    c.includes("TV") ||
    c.includes("모니터")
  )
    return "기타";
  if (
    c.includes("업소") ||
    c.includes("주방") ||
    c.includes("쇼케이스") ||
    c.includes("제빙기")
  )
    return "업소용기기";
  if (c.includes("냉장") || c.includes("김치")) return "냉장고";
  if (c.includes("세탁") || c.includes("건조") || c.includes("워시"))
    return "세탁기/건조기";
  return "기타";
}

export function getInquiryLabel(category?: string | null): string {
  const normalized = normalizeProductCategory(category);
  switch (normalized) {
    case "에어컨/냉난방기":
      return "설치 환경별 견적 상담";
    case "업소용기기":
      return "수량별·세트 할인 문의";
    case "냉장고":
    case "세탁기/건조기":
      return "배송·설치 맞춤 견적";
    default:
      return "실시간 재고·특가 문의";
  }
}

export function hasProductPrice(price?: number | null): boolean {
  return typeof price === "number" && Number.isFinite(price) && price > 0;
}

export function formatProductPrice(
  price?: number | null,
  category?: string | null
): string {
  return hasProductPrice(price)
    ? `${Number(price).toLocaleString()}원`
    : getInquiryLabel(category);
}

export function extractModelName(
  description?: string | null,
  title?: string | null
): string | null {
  // 인자 순서가 (description, title) 또는 (title, description) 어느 쪽으로 들어와도 안전하게 탐색
  const combined = `${description ?? ""}\n${title ?? ""}`;
  const explicitMatch = combined.match(
    /(?:[•\-*]\s*모델명\s*[:：]\s*|\[모델명\]\s*)([^\n\r]+)/i
  );
  if (explicitMatch && explicitMatch[1]) {
    const cleaned = explicitMatch[1].trim();
    if (
      cleaned &&
      cleaned !== "미확인" &&
      cleaned !== "없음" &&
      cleaned !== "-"
    ) {
      return cleaned.slice(0, 60);
    }
  }

  for (const source of [title ?? "", description ?? ""]) {
    const codeMatch = source.match(/\b([A-Z]{2,5}[0-9A-Z\-]{4,18})\b/);
    if (codeMatch && /[0-9]/.test(codeMatch[1])) {
      return codeMatch[1];
    }
  }

  return null;
}

export function extractSpecCapsules(
  title?: string | null,
  description?: string | null,
  maxTags = 3
): string[] {
  const combined = `${title ?? ""}\n${description ?? ""}`;
  if (!combined.trim()) return [];

  const tags: string[] = [];
  const addTag = (label: string) => {
    const normalized = label.trim();
    if (normalized && !tags.includes(normalized) && tags.length < maxTags) {
      tags.push(normalized);
    }
  };

  const boxMatch = combined.match(/\b(25|30|45|65)\s*박스/);
  if (boxMatch) addTag(`${boxMatch[1]}박스`);

  const pyeongMatch = combined.match(/\b(\d{1,2})\s*평(?:형)?\b/);
  if (pyeongMatch) addTag(`${pyeongMatch[1]}평형`);

  const literMatch = combined.match(/\b(\d{2,4})\s*(?:L|리터)\b/i);
  if (literMatch) addTag(`${literMatch[1]}L`);

  const kgMatch = combined.match(/\b(\d{1,3}(?:\.\d)?)\s*kg\b/i);
  if (kgMatch) addTag(`${kgMatch[1]}kg`);

  const widthMmMatch = combined.match(
    /\b(900|1200|1500|1800|2100|2400)\s*(?:mm|각|폭)/i
  );
  if (widthMmMatch) addTag(`폭 ${widthMmMatch[1]}mm`);

  const KEYWORD_RULES: ReadonlyArray<{ pattern: RegExp; label: string }> = [
    { pattern: /냉동\s*1\s*칸|1\/4\s*냉동|냉장\s*3.*냉동\s*1/i, label: "냉동1칸/냉장3칸" },
    { pattern: /냉동\s*2\s*칸|냉장\s*2.*냉동\s*2|반반|하프/i, label: "냉동2칸/냉장2칸" },
    { pattern: /올냉장|전칸\s*냉장/, label: "올냉장" },
    { pattern: /올냉동|전칸\s*냉동/, label: "올냉동" },
    { pattern: /상냉장\s*하냉동|상냉장/, label: "상냉장 하냉동" },
    { pattern: /좌냉동\s*우냉장/, label: "좌냉동 우냉장" },
    { pattern: /2\s*in\s*1|투인원/i, label: "2in1" },
    { pattern: /냉난방/, label: "냉난방겸용" },
    { pattern: /인버터/, label: "인버터" },
    { pattern: /삼상|380\s*V/i, label: "삼상 380V" },
    { pattern: /단상/, label: "단상 220V" },
    { pattern: /에너지\s*효율\s*1등급|1등급/, label: "1등급" },
    { pattern: /4\s*도어|포도어/, label: "4도어" },
    { pattern: /양문형/, label: "양문형" },
    { pattern: /워시타워/, label: "워시타워" },
    { pattern: /스탠드(?:형)?/, label: "스탠드형" },
    { pattern: /벽걸이(?:형)?/, label: "벽걸이형" },
    { pattern: /천장형|4\s*way|포웨이/i, label: "천장형" },
    { pattern: /창문형/, label: "창문형" },
    { pattern: /드럼/, label: "드럼형" },
    { pattern: /통돌이|전자동/, label: "통돌이" },
    { pattern: /테이블\s*냉장|작업대\s*냉장/, label: "테이블냉장" },
    { pattern: /쇼케이스/, label: "쇼케이스" },
    { pattern: /제빙기/, label: "제빙기" },
    { pattern: /식기세척기/, label: "식기세척기" },
  ];

  for (const rule of KEYWORD_RULES) {
    if (tags.length >= maxTags) break;
    if (rule.pattern.test(combined)) {
      addTag(rule.label);
    }
  }

  return tags;
}

/**
 * [EVO-010] 다중 검색어(토큰 분할) 지원 표준 검색 매칭 헬퍼
 * - 공백으로 분리된 모든 검색어 토큰이 대상 텍스트 중 하나 이상에 포함되어야 일치(AND 조건)로 판정합니다.
 * - 대소문자 무시, 공백 무시, null/undefined 안전 처리
 * - 예: 'LG 오브제' 입력 시 제목, 모델명, 본문 중 분산되어 있어도 정확히 매칭
 */
export function matchesSearchQuery(
  rawQuery: string | null | undefined,
  ...fields: (string | number | null | undefined)[]
): boolean {
  if (!rawQuery) return true;
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const combinedHay = fields
    .map((f) => (f !== null && f !== undefined ? String(f).toLowerCase() : ""))
    .join(" ");

  return tokens.every((token) => combinedHay.includes(token));
}

export function parseProductDescription(description?: string | null): {
  summary: string[];
  features: string[];
  specs: Array<{ label: string; value: string }>;
  inspectionAndAs: string[];
  checkPoints: string[];
  consultationGuide: string[];
  rawRest: string[];
  hasStructuredSections: boolean;
} {
  const text = (description ?? "").trim();
  if (!text) {
    return {
      summary: [],
      features: [],
      specs: [],
      inspectionAndAs: [],
      checkPoints: [],
      consultationGuide: [],
      rawRest: [],
      hasStructuredSections: false,
    };
  }

  const lines = text.split(/\r?\n/);
  let currentSection:
    | "summary"
    | "features"
    | "specs"
    | "as"
    | "check"
    | "consultation"
    | "rest" = "rest";
  const summary: string[] = [];
  const features: string[] = [];
  const specs: Array<{ label: string; value: string }> = [];
  const inspectionAndAs: string[] = [];
  const checkPoints: string[] = [];
  const consultationGuide: string[] = [];
  const rawRest: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^\[한눈에\s*보는\s*(제품\s*)?정보\]/i.test(line)) {
      currentSection = "summary";
      continue;
    }
    if (/^\[(핵심|제품)\s*특징\]/i.test(line)) {
      currentSection = "features";
      continue;
    }
    if (/^\[(제품\s*)?주요\s*사양\]/i.test(line)) {
      currentSection = "specs";
      continue;
    }
    if (/^\[점검\s*및\s*A\/S\s*안내\]/i.test(line)) {
      currentSection = "as";
      continue;
    }
    if (/^\[(구매\s*및\s*설치\s*전\s*확인사항|설치\s*전\s*체크)\]/i.test(line)) {
      currentSection = "check";
      continue;
    }
    if (/^\[상담\s*안내\]/i.test(line)) {
      currentSection = "consultation";
      continue;
    }

    const cleanedBullet = line.replace(/^[•\-*✔✅💬]\s*/, "").trim();

    if (currentSection === "summary") {
      summary.push(cleanedBullet);
    } else if (currentSection === "features") {
      features.push(cleanedBullet);
    } else if (currentSection === "specs") {
      const colonIdx = cleanedBullet.indexOf(":");
      if (colonIdx > 0 && colonIdx < 25) {
        specs.push({
          label: cleanedBullet.slice(0, colonIdx).trim(),
          value: cleanedBullet.slice(colonIdx + 1).trim(),
        });
      } else {
        specs.push({ label: "사양", value: cleanedBullet });
      }
    } else if (currentSection === "as") {
      inspectionAndAs.push(cleanedBullet);
    } else if (currentSection === "check") {
      checkPoints.push(cleanedBullet);
    } else if (currentSection === "consultation") {
      consultationGuide.push(cleanedBullet);
    } else {
      rawRest.push(line);
    }
  }

  const hasStructuredSections =
    summary.length > 0 ||
    features.length > 0 ||
    specs.length > 0 ||
    inspectionAndAs.length > 0 ||
    checkPoints.length > 0 ||
    consultationGuide.length > 0;

  return {
    summary,
    features,
    specs,
    inspectionAndAs,
    checkPoints,
    consultationGuide,
    rawRest,
    hasStructuredSections,
  };
}

/**
 * 연식이 5년 이상(2026년 기준 2020년 및 그 이전 연도)인 중고 제품의 제조년월/연식 표기를 자동 제외하는 정제 함수
 * - 2026년 기준: 2020년 및 그 이전(2020, 2019, 2018...) -> 제조년월 일절 미표기
 * - 최근 5년 이내 최신 제품(2021년 이후) -> 강점이 되므로 정상 표기 유지
 */
export function sanitizeOldManufactureYear<
  T extends {
    title?: string;
    specDetails?: string;
    aiDraftSummary?: string;
    photoObserved?: string[];
    searchDerivedSpecs?: string[];
    needsReview?: string[];
  }
>(data: T, currentYear = new Date().getFullYear()): T {
  const oldYearThreshold = currentYear - 6; // e.g. 2026 - 6 = 2020년

  const isOldYear = (yearNum: number) =>
    yearNum >= 1970 && yearNum <= oldYearThreshold;

  const extractYearFromText = (str: string): number | null => {
    // 4자리 연도 (1970 ~ 2099)
    const m = str.match(/\b(19\d\d|20\d\d)\b/);
    if (m) return Number(m[1]);
    // 2자리 연식 (예: '18년식, 18년식, '20년형)
    const m2 = str.match(/(?:'|\b)([89]\d|[0-2]\d)\s*년(?:식|형)/);
    if (m2) {
      const val = Number(m2[1]);
      return val >= 70 ? 1900 + val : 2000 + val;
    }
    return null;
  };

  const isOldManufactureLine = (line: string): boolean => {
    const trimmed = line.trim();
    const hasMfgKeyword =
      /(?:제조년월|제조년월일|제조일자|제조일|제조년도|제조연월|제조연도|생산년월|생산일자|연식|년형|년식)/.test(
        trimmed
      );
    if (!hasMfgKeyword) return false;
    const year = extractYearFromText(trimmed);
    return year !== null && isOldYear(year);
  };

  // 1. title 정제: 2018년식 등 구형 연식 표기 제거
  let cleanTitle = data.title || "";
  if (cleanTitle) {
    cleanTitle = cleanTitle
      .replace(
        /\b(?:19\d\d|20[0-1]\d|2020|'?[0-2][0-9])\s*년(?:식|형)\s*[,·/]?\s*/g,
        ""
      )
      .replace(
        /\s*[,·/]\s*(?:19\d\d|20[0-1]\d|2020|'?[0-2][0-9])\s*년(?:식|형)/g,
        ""
      )
      .replace(
        /\(\s*(?:19\d\d|20[0-1]\d|2020|'?[0-2][0-9])\s*년(?:식|형)\s*\)/g,
        ""
      )
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  // 2. specDetails / aiDraftSummary 정제: 제조년월 라인 제거
  let cleanSpecDetails = data.specDetails || "";
  if (cleanSpecDetails) {
    const lines = cleanSpecDetails.split(/\r?\n/);
    const filteredLines = lines.filter((line) => !isOldManufactureLine(line));
    cleanSpecDetails = filteredLines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  // 3. photoObserved 정제
  // 예: "제조자: 오텍캐리어주식회사 / 제조년월일: 2018.06.05 확인" -> "제조자: 오텍캐리어주식회사 확인"
  const cleanPhotoObserved = (data.photoObserved || [])
    .map((item) => {
      if (isOldManufactureLine(item)) {
        if (item.includes("/") || item.includes("·") || item.includes(",")) {
          const parts = item.split(/[/·,]/);
          const preserved = parts
            .map((p) => p.trim())
            .filter((p) => !isOldManufactureLine(p));
          return preserved.length > 0 ? preserved.join(" / ") : "";
        }
        return "";
      }
      return item;
    })
    .filter(Boolean);

  // 4. searchDerivedSpecs 정제
  const cleanSearchSpecs = (data.searchDerivedSpecs || []).filter(
    (item) => !isOldManufactureLine(item)
  );

  // 5. needsReview 정제: 구형 제품의 경우 "제조년월 확인 필요" 검토 알림도 불필요하므로 제외
  const cleanNeedsReview = (data.needsReview || []).filter((item) => {
    if (item.includes("제조년월") || item.includes("연식")) {
      return false;
    }
    return true;
  });

  return {
    ...data,
    title: cleanTitle,
    specDetails: cleanSpecDetails,
    aiDraftSummary: cleanSpecDetails,
    photoObserved: cleanPhotoObserved,
    searchDerivedSpecs: cleanSearchSpecs,
    needsReview: cleanNeedsReview,
  };
}

export function extractStorageFilesByBucket(imageUrls: string[]): {
  inquiries: string[];
  productImages: string[];
} {
  const inquiries: string[] = [];
  const productImages: string[] = [];

  for (const url of imageUrls) {
    if (!url) continue;
    const inqMatch = url.match(
      /\/storage\/v1\/object\/public\/inquiries\/([^?#]+)/
    );
    if (inqMatch && inqMatch[1]) {
      inquiries.push(decodeURIComponent(inqMatch[1]));
      continue;
    }
    const prodMatch = url.match(
      /\/storage\/v1\/object\/public\/product-images\/([^?#]+)/
    );
    if (prodMatch && prodMatch[1]) {
      productImages.push(decodeURIComponent(prodMatch[1]));
    }
  }

  return { inquiries, productImages };
}

/* ════════════════════════════════════════════════════════════
   2-0. 1초 직통 간편 상담 모달(Quick Inquiry Modal) 전역 브릿지
   ════════════════════════════════════════════════════════════ */
export const QUICK_INQUIRY_EVENT = "hb-quick-inquiry-open";

export interface QuickInquiryDetail {
  type?: InquiryTypeValue;
  productTitle?: string;
  modelName?: string;
  category?: string;
  envNote?: string;
  useBundle?: boolean;
}

export function triggerQuickInquiry(detail?: QuickInquiryDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(QUICK_INQUIRY_EVENT, { detail })
  );
}

/* ════════════════════════════════════════════════════════════
   2. 관심 매물 견적함 (묶음 문의 · 수량 조절 · 비교 연동) localStorage 헬퍼
   ════════════════════════════════════════════════════════════ */
export const QUOTE_BASKET_STORAGE_KEY = "hb_quote_basket_v1";
export const QUOTE_BASKET_EVENT = "hb-quote-basket-updated";
export const MAX_QUOTE_BASKET_ITEMS = 8;

export interface QuoteBasketItem {
  id: string;
  title: string;
  category: string;
  price: number | null;
  quantity?: number;
  status?: string | null;
  conditionGrade?: string | null;
  description?: string | null;
  modelName?: string | null;
  imageUrl?: string | null;
}

export function getQuoteBasket(): QuoteBasketItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUOTE_BASKET_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is QuoteBasketItem =>
          Boolean(
            item &&
              typeof item.id === "string" &&
              typeof item.title === "string"
          )
      )
      .map((item) => ({
        ...item,
        quantity:
          typeof item.quantity === "number" &&
          Number.isFinite(item.quantity) &&
          item.quantity >= 1
            ? Math.min(99, Math.floor(item.quantity))
            : 1,
      }));
  } catch {
    return [];
  }
}

function saveQuoteBasket(items: QuoteBasketItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      QUOTE_BASKET_STORAGE_KEY,
      JSON.stringify(items)
    );
    window.dispatchEvent(new CustomEvent(QUOTE_BASKET_EVENT));
  } catch {
    // 브라우저 로컬 스토리지 비활성화/용량 초과 시에도 사이트가 정상 동작하도록 무시
  }
}

export function isInQuoteBasket(productId: string): boolean {
  return getQuoteBasket().some((item) => item.id === productId);
}

export function toggleQuoteBasketItem(item: QuoteBasketItem): {
  added: boolean;
  limitReached?: boolean;
  items: QuoteBasketItem[];
} {
  const current = getQuoteBasket();
  const exists = current.some((x) => x.id === item.id);
  if (exists) {
    const next = current.filter((x) => x.id !== item.id);
    saveQuoteBasket(next);
    return { added: false, items: next };
  }
  if (current.length >= MAX_QUOTE_BASKET_ITEMS) {
    return { added: false, limitReached: true, items: current };
  }
  const normalizedItem: QuoteBasketItem = {
    ...item,
    quantity:
      typeof item.quantity === "number" && item.quantity >= 1
        ? Math.min(99, Math.floor(item.quantity))
        : 1,
  };
  const next = [...current, normalizedItem];
  saveQuoteBasket(next);
  return { added: true, items: next };
}

export function updateQuoteBasketItemQuantity(
  productId: string,
  nextQuantity: number
): QuoteBasketItem[] {
  const safeQty = Math.max(1, Math.min(99, Math.floor(nextQuantity || 1)));
  const current = getQuoteBasket();
  const next = current.map((item) =>
    item.id === productId ? { ...item, quantity: safeQty } : item
  );
  saveQuoteBasket(next);
  return next;
}

export function removeQuoteBasketItem(productId: string): QuoteBasketItem[] {
  const next = getQuoteBasket().filter((x) => x.id !== productId);
  saveQuoteBasket(next);
  return next;
}

export function clearQuoteBasket(): void {
  saveQuoteBasket([]);
}

export function formatQuoteBasketSummary(items: QuoteBasketItem[]): {
  autoTitle: string;
  autoDescription: string;
  hasCommercialItem: boolean;
  totalKnownPrice: number;
  pricedCount: number;
  totalUnitCount: number;
  soldItemCount: number;
} {
  if (items.length === 0) {
    return {
      autoTitle: "",
      autoDescription: "",
      hasCommercialItem: false,
      totalKnownPrice: 0,
      pricedCount: 0,
      totalUnitCount: 0,
      soldItemCount: 0,
    };
  }

  let totalKnownPrice = 0;
  let pricedCount = 0;
  let totalUnitCount = 0;
  let soldItemCount = 0;
  let hasCommercialItem = false;

  const lines = items.map((item, idx) => {
    const cat = normalizeProductCategory(item.category);
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const sold = isProductSold(item.status);
    totalUnitCount += qty;

    if (cat === "업소용기기") hasCommercialItem = true;
    if (sold) {
      soldItemCount += 1;
    } else if (hasProductPrice(item.price)) {
      totalKnownPrice += Number(item.price) * qty;
      pricedCount += 1;
    }

    const unitPriceStr = sold
      ? "판매완료 · 유사매물 재고문의"
      : formatProductPrice(item.price, cat);
    const subtotalStr =
      !sold && hasProductPrice(item.price) && qty > 1
        ? ` (단가 ${Number(item.price).toLocaleString()}원 × ${qty}대 = ${(
            Number(item.price) * qty
          ).toLocaleString()}원)`
        : ` (${unitPriceStr})`;
    const modelStr = item.modelName ? ` | 모델명: ${item.modelName}` : "";

    return `${idx + 1}. [${cat}] ${item.title}${modelStr} | 희망수량: ${qty}대${subtotalStr}\n   - 상품번호: #${String(
      item.id
    ).slice(0, 8)} / 상세링크: ${STORE.url}/${item.id}`;
  });

  const firstTitle = items[0].title;
  const autoTitle =
    items.length === 1
      ? `[상품문의] ${firstTitle}${
          (items[0].quantity || 1) > 1 ? ` (${items[0].quantity}대)` : ""
        }`
      : `[묶음견적 ${items.length}종 / 총 ${totalUnitCount}대] ${firstTitle} 외 ${
          items.length - 1
        }건`;

  const priceSummaryLine =
    pricedCount > 0
      ? `\n• 표시 가격 합계(구매 가능 ${pricedCount}종 기준): ${totalKnownPrice.toLocaleString()}원 (세트 구매 및 배송·설치 여건에 따라 맞춤 조율 가능)`
      : "";

  const soldNoticeLine =
    soldItemCount > 0
      ? `\n※ 목록 중 판매완료 상품(${soldItemCount}건)은 매장 내 동일·유사 스펙 재고로 함께 확인 부탁드립니다.`
      : "";

  const autoDescription = [
    `[선택한 관심 매물 목록 — 총 ${items.length}종 (${totalUnitCount}대)]`,
    ...lines,
    priceSummaryLine,
    soldNoticeLine,
    "",
    "[추가 문의 사항]",
    "• 희망 배송/설치 지역: ",
    "• 설치 층수(엘리베이터 유무): ",
    "• 재고 여부 및 묶음 견적 부탁드립니다.",
  ]
    .filter((l) => l !== "")
    .join("\n");

  return {
    autoTitle,
    autoDescription,
    hasCommercialItem,
    totalKnownPrice,
    pricedCount,
    totalUnitCount,
    soldItemCount,
  };
}

/* ════════════════════════════════════════════════════════════
   2-2. [신규 기능 ④] 비로그인 최근 본 상품 (Recently Viewed) localStorage 헬퍼
   ════════════════════════════════════════════════════════════ */
export const RECENT_VIEWED_STORAGE_KEY = "hb_recent_views_v1";
export const RECENT_VIEWED_EVENT = "hb-recent-views-updated";
export const MAX_RECENT_VIEWED_ITEMS = 10;

export interface RecentViewedItem {
  id: string;
  title: string;
  category: string;
  price: number | null;
  status?: string | null;
  conditionGrade?: string | null;
  modelName?: string | null;
  imageUrl?: string | null;
  viewedAt: number;
}

export function getRecentViewedProducts(): RecentViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_VIEWED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentViewedItem =>
        Boolean(
          item &&
            typeof item.id === "string" &&
            typeof item.title === "string"
        )
    );
  } catch {
    return [];
  }
}

export function addRecentViewedProduct(
  item: Omit<RecentViewedItem, "viewedAt">
): RecentViewedItem[] {
  if (typeof window === "undefined" || !item?.id || !item?.title) return [];
  try {
    const current = getRecentViewedProducts().filter((x) => x.id !== item.id);
    const nextItem: RecentViewedItem = {
      ...item,
      category: normalizeProductCategory(item.category),
      viewedAt: Date.now(),
    };
    const next = [nextItem, ...current].slice(0, MAX_RECENT_VIEWED_ITEMS);
    window.localStorage.setItem(
      RECENT_VIEWED_STORAGE_KEY,
      JSON.stringify(next)
    );
    window.dispatchEvent(new CustomEvent(RECENT_VIEWED_EVENT));
    return next;
  } catch {
    return [];
  }
}

export function removeRecentViewedProduct(
  productId: string
): RecentViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const next = getRecentViewedProducts().filter((x) => x.id !== productId);
    window.localStorage.setItem(
      RECENT_VIEWED_STORAGE_KEY,
      JSON.stringify(next)
    );
    window.dispatchEvent(new CustomEvent(RECENT_VIEWED_EVENT));
    return next;
  } catch {
    return [];
  }
}

export function clearRecentViewedProducts(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RECENT_VIEWED_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(RECENT_VIEWED_EVENT));
  } catch {
    // ignore
  }
}

/* ════════════════════════════════════════════════════════════
   2-3. [신규 기능 ⑧ & ⑨] 카테고리별 맞춤 FAQ 및 재고 경과일 계산 헬퍼
   ════════════════════════════════════════════════════════════ */
export function getDaysSinceCreated(createdAt?: string | null): number {
  if (!createdAt) return 0;
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - createdMs) / (1000 * 60 * 60 * 24)));
}

export function getCategoryFaqs(
  category?: string | null,
  isSold = false
): Array<{ q: string; a: string }> {
  const cat = normalizeProductCategory(category);
  const list: Array<{ q: string; a: string }> = [];

  if (isSold) {
    list.push({
      q: "이 상품은 판매완료인데 비슷한 규격의 다른 재고가 있나요?",
      a: `네, ${STORE.name} 중촌동 직영 매장에는 홈페이지에 미처 올리지 못한 동일·유사 규격(${cat}) 매물이 상시 입고되어 있습니다. 상단의 [동일·유사 모델 재고 문의] 또는 대표전화(${STORE.tel})로 연락주시면 즉시 확인해 드립니다.`,
    });
  }

  if (cat === "에어컨/냉난방기") {
    list.push(
      {
        q: "에어컨·냉난방기 구매 시 실내기와 실외기가 모두 포함되나요? 단품 구매도 가능한가요?",
        a: "냉난방 성능과 냉매 호환 보증을 위해 실내기와 실외기 1:1 세트 구성으로만 판매하며, 실외기만 별도로 단독 구매하시는 것은 어렵습니다.",
      },
      {
        q: "설치 비용은 어떻게 산정되며 보증 기간은 얼마인가요?",
        a: "설치비(배관 길이, 타공 여부, 앵글 거치, 단상/삼상 전기 작업 등)는 현장 여건을 사진이나 전화로 알려주시면 사전 안내해 드리며, 에어컨·냉난방기는 판매 계약 조건에 따라 최대 8개월 무상 A/S 보증이 적용됩니다.",
      }
    );
  } else if (cat === "업소용기기") {
    list.push(
      {
        q: "식당·카페 오픈용으로 여러 대를 묶음 구매하면 세트 할인이나 세금계산서 발행이 되나요?",
        a: "네, 45박스 냉장고·테이블냉장고·쇼케이스·제빙기 등 복수 품목을 [견적함]에 담아 일괄 문의해 주시면 수량별 맞춤 견적과 함께 전자세금계산서(및 카드·현금영수증)를 100% 정식 발행해 드립니다.",
      },
      {
        q: "업소용 장비 도입 전 매장 전원이나 급·배수에서 무엇을 확인해야 하나요?",
        a: "대형 냉장·주방설비는 단상 220V / 삼상 380V 전원 규격과 주방 출입문 통과 폭(가로×깊이), 제빙기·식기세척기의 경우 급·배수 배관 위치를 미리 확인해 주시면 정확한 설치가 가능합니다.",
      }
    );
  } else if (cat === "냉장고" || cat === "세탁기/건조기") {
    list.push(
      {
        q: "엘리베이터가 없는 층이거나 기존에 쓰던 가전이 있는데 동시 수거(보상매입)가 되나요?",
        a: "일반 배송·수평 설치를 기본 지원하며, 엘리베이터 없는 2층 이상 계단 운반이나 사다리차 필요 여부만 사전에 협의합니다. 배송 당일 기존 가전 동시 수거 및 보상매입(차액 정산)도 원스톱으로 가능합니다.",
      },
      {
        q: "중고 냉장고·세탁기의 위생 상태와 A/S 보증 기준이 궁금합니다.",
        a: "입고 후 전문 엔지니어가 분해 고압 살균 세척과 냉각·탈수·누수 시운전을 완료한 제품만 출고하며, 주요 가정용 가전은 계약 조건에 따라 최대 4개월 무상 A/S를 보증합니다.",
      }
    );
  } else {
    list.push({
      q: "오프라인 매장에서 실물을 직접 보고 구매하거나 배송 상담을 받을 수 있나요?",
      a: `네, ${STORE.roadAddress}(${STORE.addressNote}) 1·2층 직영 쇼룸에 방문하시면 작동 상태를 직접 확인하실 수 있으며, 품목과 지역에 따라 직배송 또는 방문 수령 상담이 가능합니다.`,
    });
  }

  list.push({
    q: "배송 가능 지역은 어디까지인가요?",
    a: "대전 전 지역(중구·서구·유성구·동구·대덕구)과 세종·청주·천안·공주·계룡 등 충청권 당일/익일 직배송은 물론, 품목과 수량에 따라 전국 각지 배송·설치 상담을 지원합니다.",
  });

  return list;
}

/* ════════════════════════════════════════════════════════════
   3. 당근마켓 · 네이버 카페 · 블로그 홍보글 자동 생성기
   ════════════════════════════════════════════════════════════ */
export function generatePromoPostText(product: {
  id: string;
  title: string;
  category?: string | null;
  price?: number | null;
  status?: string | null;
  condition_grade?: string | null;
  description?: string | null;
}): string {
  const categoryLabel = normalizeProductCategory(product.category);
  const priceText = isProductSold(product.status)
    ? "판매완료 (유사 모델 재고 문의)"
    : formatProductPrice(product.price, categoryLabel);
  const modelName = extractModelName(product.description, product.title);
  const capsules = extractSpecCapsules(product.title, product.description, 4);
  const parsed = parseProductDescription(product.description);

  const specLines: string[] = [];
  if (modelName) specLines.push(`• 모델명: ${modelName}`);
  if (product.condition_grade)
    specLines.push(`• 상태등급: ${product.condition_grade}`);
  if (capsules.length > 0)
    specLines.push(`• 핵심규격: ${capsules.join(" / ")}`);

  for (const s of parsed.specs) {
    if (s.label === "모델명" && modelName) continue;
    specLines.push(`• ${s.label}: ${s.value}`);
  }

  const featureLines = parsed.features.map((f) => `✔ ${f}`);
  const rawFallback =
    !parsed.hasStructuredSections && product.description
      ? product.description.trim()
      : "";

  const tagCategory =
    categoryLabel === "업소용기기"
      ? "#대전업소용냉장고 #대전업소용주방기기 #식당창업집기"
      : categoryLabel === "에어컨/냉난방기"
      ? "#대전중고에어컨 #대전중고냉난방기"
      : categoryLabel === "냉장고"
      ? "#대전중고냉장고 #대전중고김치냉장고"
      : "#대전중고세탁기 #대전중고가전";

  return [
    `[${STORE.name} 실매물 안내] ${product.title}`,
    "",
    `■ 판매 가격: ${priceText}`,
    `■ 품목 분류: ${categoryLabel} (${getProductStatusLabel(product.status)})`,
    ...(specLines.length > 0 ? ["", "[제품 주요 사양]", ...specLines] : []),
    ...(featureLines.length > 0
      ? ["", "[제품 특징 및 검수 상태]", ...featureLines]
      : []),
    ...(rawFallback ? ["", "[상세 설명]", rawFallback] : []),
    "",
    "────────────────────────────",
    `✅ ${STORE.name} 안심 거래 원칙 (SINCE ${STORE.since})`,
    "• 입고 후 분해 세척·정비 및 작동 검수를 마친 실매물입니다.",
    "• 사후 A/S 보증: 품목 및 계약 조건에 따라 상이 (에어컨 최대 8개월 / 가전 최대 4개월, 사전 협의 기준)",
    "• 대전·세종·충청권 및 전국 배송·설치 상담 / 세금계산서 발행 가능",
    "",
    `📍 매장 위치: ${STORE.address} (${STORE.addressNote}, ${STORE.parking})`,
    `🕒 영업 시간: ${STORE.hours} (${STORE.closed})`,
    `📞 직통 문의: ${STORE.tel} / ${STORE.mobile}`,
    `🔗 상세 사진·재고 확인: ${STORE.url}/${product.id}`,
    `☕ 공식 카페: ${STORE.cafe}`,
    "",
    `#대전중고가전 #한밭중고전자 #중촌동중고가전 ${tagCategory}`,
  ].join("\n");
}

/* ════════════════════════════════════════════════════════════
   4. 문의(purchase_requests) 역할 구분 및 표준 상태 전이 정의
   ════════════════════════════════════════════════════════════ */
export const INQUIRY_TYPES = [
  "구매 문의",
  "내 물건 팔기",
  "대량·업소용 상담",
  "기타 문의",
] as const;

export type InquiryTypeValue = (typeof INQUIRY_TYPES)[number];

export const INQUIRY_STATUS = {
  RECEIVED: "접수",
  REVIEWING: "검토중",
  VISIT_SCHEDULED: "방문예정",
  ANSWERED: "답변완료",
  COMPLETED: "매입완료",
  CANCELED: "취소",
  NOTICE: "공지",
} as const;

export type InquiryStatusValue =
  (typeof INQUIRY_STATUS)[keyof typeof INQUIRY_STATUS];

export const INQUIRY_ADMIN_STATUS_OPTIONS: ReadonlyArray<{
  value: InquiryStatusValue;
  label: string;
  desc: string;
  badgeClass: string;
}> = [
  {
    value: INQUIRY_STATUS.RECEIVED,
    label: "접수",
    desc: "신규 접수되어 확인 대기 중인 상태",
    badgeClass: "bg-[#FFF5F0] text-[#D9531E] border border-[#FADCD0]",
  },
  {
    value: INQUIRY_STATUS.REVIEWING,
    label: "검토중",
    desc: "담당자가 사진·재고·견적을 확인 중인 상태",
    badgeClass: "bg-amber-50 text-amber-800 border border-amber-200",
  },
  {
    value: INQUIRY_STATUS.VISIT_SCHEDULED,
    label: "방문예정",
    desc: "매입 수거 또는 배송·설치 방문 일정이 조율된 상태",
    badgeClass: "bg-blue-50 text-blue-800 border border-blue-200",
  },
  {
    value: INQUIRY_STATUS.ANSWERED,
    label: "답변완료",
    desc: "고객에게 온라인 답변 또는 전화 안내를 완료한 상태",
    badgeClass: "bg-[#0E1A2B] text-white border border-[#0E1A2B]",
  },
  {
    value: INQUIRY_STATUS.COMPLETED,
    label: "매입완료",
    desc: "현장 수거 및 대금 정산(또는 판매 거래)이 완료된 상태",
    badgeClass: "bg-emerald-700 text-white border border-emerald-700",
  },
  {
    value: INQUIRY_STATUS.CANCELED,
    label: "취소",
    desc: "고객 요청 또는 조건 불일치로 취소된 상태",
    badgeClass: "bg-neutral-200 text-neutral-600 border border-neutral-300",
  },
] as const;

export function isPriorityInquiryStatus(status?: string | null): boolean {
  const s = (status ?? "접수").trim();
  return s === "접수" || s === "검토중";
}

export const isSellInquiry = (t?: string | null) =>
  t === "내 물건 팔기" ||
  t === "내 물건팔기" ||
  t === "매입문의" ||
  t === "매입 신청";

export const isBuyInquiry = (t?: string | null) =>
  t === "구매 문의" || t === "구매문의" || t === "판매 제품 상담";

export const isBulkBizInquiry = (t?: string | null) =>
  t === "대량·업소용 상담" || t === "업소용 상담" || t === "대량 문의";

export const getInquiryTypeLabel = (t?: string | null): string => {
  if (t === "공지사항") return "공지사항";
  if (isSellInquiry(t)) return "내 물건 팔기";
  if (isBulkBizInquiry(t)) return "대량·업소용 상담";
  if (isBuyInquiry(t)) return "구매 문의";
  return "기타 문의";
};

/* ════════════════════════════════════════════════════════════
   5. 외부 알림(Telegram / 알림톡) 5대 발송 상태 표준 정의
   ════════════════════════════════════════════════════════════ */
export const NOTIFICATION_STATUS = {
  PENDING: "발송 대기",
  SUCCESS: "발송 성공",
  NOT_CONFIGURED: "설정 미완료",
  EXTERNAL_ERROR: "외부 서비스 오류",
  RETRY_REQUIRED: "재시도 필요",
} as const;

export type NotificationStatusCode = keyof typeof NOTIFICATION_STATUS;
export type NotificationStatusLabel =
  (typeof NOTIFICATION_STATUS)[NotificationStatusCode];

export interface NotificationDispatchResult {
  channel: "telegram" | "alimtalk";
  status: NotificationStatusCode;
  statusLabel: NotificationStatusLabel;
  sent: boolean;
  retryable: boolean;
  deduplicated?: boolean;
  message: string;
  timestamp: string;
}

/* ════════════════════════════════════════════════════════════
   6. 개인정보(PII) 원천 차단 GA4 이벤트 추적 유틸리티
   ════════════════════════════════════════════════════════════ */
export type AnalyticsEventName =
  | "view_item"
  | "search_products"
  | "add_to_quote_basket"
  | "compare_products"
  | "click_tel_consult"
  | "click_sms_consult"
  | "click_kakao_consult"
  | "begin_buyback_inquiry"
  | "submit_inquiry_success"
  | "filter_gallery"
  | "click_situation_preset";

const FORBIDDEN_PII_KEYS = new Set([
  "name",
  "username",
  "phone",
  "tel",
  "mobile",
  "password",
  "pw",
  "description",
  "content",
  "email",
  "address",
]);

export function trackEvent(
  eventName: AnalyticsEventName,
  params?: Record<string, string | number | boolean | null | undefined>
): void {
  if (typeof window === "undefined") return;
  const gtag = (
    window as unknown as { gtag?: (...args: unknown[]) => void }
  ).gtag;
  if (typeof gtag !== "function") return;

  const safeParams: Record<string, string | number | boolean> = {};
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      if (val === undefined || val === null) continue;
      if (FORBIDDEN_PII_KEYS.has(key.toLowerCase())) continue;
      if (
        typeof val === "string" &&
        /01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(val)
      ) {
        continue;
      }
      safeParams[key] = typeof val === "string" ? val.slice(0, 80) : val;
    }
  }

  try {
    gtag("event", eventName, safeParams);
  } catch {
    // ignore
  }
}

export function isRecentlyCreated(
  createdAt?: string | null,
  days = 7
): boolean {
  if (!createdAt) return false;
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return false;
  return Date.now() - createdMs < days * 24 * 60 * 60 * 1000;
}

/* ════════════════════════════════════════════════════════════
   7. 전화번호, 문자(SMS) 직통 연결, 마스킹, 이미지 유틸리티
   ════════════════════════════════════════════════════════════ */
export const telHref = (num: string) => `tel:${num.replace(/[^0-9+]/g, "")}`;

/**
 * [신규 기능 ①] 직통 휴대폰(010-6631-8179) 문자 메시지(SMS/MMS) 바로 보내기 링크 생성기
 * - 스마트폰에서 클릭 시 기본 메시지 앱이 열리며 안내 문구가 자동 입력됩니다.
 */
export function smsHref(
  num: string = STORE.mobile,
  bodyText?: string
): string {
  const cleaned = num.replace(/[^0-9+]/g, "");
  if (!bodyText || !bodyText.trim()) {
    return `sms:${cleaned}`;
  }
  return `sms:${cleaned}?body=${encodeURIComponent(bodyText.trim())}`;
}

/**
 * [EVO-009] 상품별 직통 SMS 상담 본문 표준 단일 출처(SSOT) 생성기
 * - 실매물 문의 및 판매완료 유사매물 재고 문의 문구를 통일하고 링크를 포함하여 즉각적인 실물 대조 지원
 */
export function buildProductInquirySmsBody(product: {
  id?: string;
  title: string;
  category?: string;
  price?: number | null;
  status?: string | null;
  modelName?: string | null;
}): string {
  const sold = isProductSold(product.status);
  const cat = normalizeProductCategory(product.category);
  const modelPart = product.modelName ? ` (${product.modelName.trim()})` : "";
  const pricePart =
    !sold && hasProductPrice(product.price)
      ? ` (가격: ${formatProductPrice(product.price, cat)})`
      : "";
  const linkPart = product.id ? `\n- 상품링크: ${STORE.url}/${product.id}` : "";

  if (sold) {
    return `[${STORE.name} 유사매물문의] 판매완료된 '[${cat}] ${product.title.trim()}'${modelPart}와 비슷한 스펙의 현재 구매 가능한 재고 문의드립니다.${linkPart}`;
  }
  return `[${STORE.name} 상품문의] [${cat}] ${product.title.trim()}${modelPart}${pricePart} 실매물 재고 및 배송·설치 견적 문의드립니다.${linkPart}`;
}

export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export const isValidPhone = (value: string): boolean => {
  const cleaned = value.replace(/\D/g, "");
  return /^0\d{8,10}$/.test(cleaned);
};

export function maskName(rawName?: string | null): string {
  const t = (rawName ?? "").trim();
  if (!t) return "고*객";

  // "한밭식당(중촌동)" 또는 "홍길동 (둔산동)" 형태의 지역 괄호 분리 마스킹
  const match = t.match(/^(.*?)\s*(\(.*\))$/);
  if (match) {
    const main = match[1].trim();
    const region = match[2].trim();
    if (main.length <= 1) return `${main}* ${region}`;
    if (main.length === 2) return `${main.charAt(0)}* ${region}`;
    return `${main.charAt(0)}${"*".repeat(Math.min(main.length - 2, 3))}${main.slice(-1)} ${region}`;
  }

  if (t.length === 1) return `${t}*`;
  if (t.length === 2) return `${t.charAt(0)}*`;
  return `${t.charAt(0)}${"*".repeat(Math.min(t.length - 2, 3))}${t.slice(-1)}`;
}

export function maskPhone(rawPhone?: string | null): string {
  const cleaned = (rawPhone ?? "").replace(/\D/g, "");
  if (cleaned.length < 7) return "***-****";
  return `${cleaned.slice(0, 3)}-****-${cleaned.slice(-4)}`;
}

export function splitImages(value?: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((x): x is string => typeof x === "string" && x.trim() !== "")
      .map((s) => s.trim());
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

export function extractInquiryImages(row: {
  images?: unknown;
  image_url?: unknown;
}): string[] {
  const fromArray = splitImages(row.images);
  if (fromArray.length > 0) return fromArray;
  return splitImages(row.image_url);
}

export const MAX_PHOTOS = 3;
export const MAX_REVIEW_PHOTOS = 5;
export const MAX_FILE_MB = 15;

export function validateImageFiles(
  files: File[],
  maxCount = MAX_PHOTOS
): { ok: File[]; error?: string } {
  const ok: File[] = [];
  let error: string | undefined;
  for (const f of files) {
    if (!f.type.startsWith("image/")) {
      error = "이미지 파일만 첨부할 수 있습니다.";
      continue;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      error = `사진 한 장당 ${MAX_FILE_MB}MB 이하만 첨부할 수 있습니다.`;
      continue;
    }
    ok.push(f);
  }
  if (ok.length > maxCount) {
    error = `사진은 최대 ${maxCount}장까지 첨부할 수 있습니다.`;
    return { ok: ok.slice(0, maxCount), error };
  }
  return { ok, error };
}

export function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.78
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.onload = (event) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            canvas.width = 0;
            canvas.height = 0;
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("이미지 압축에 실패했습니다."));
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export interface ImageEnhanceOptions {
  degrees?: number;
  brightness?: number; // 1.0 = 원본, 1.15 = +15% 광도 증가
  contrast?: number;   // 1.0 = 원본, 1.10 = +10% 대비 증가
  saturate?: number;   // 1.0 = 원본, 1.05 = +5% 생생한 채도
  quality?: number;
}

/**
 * [스마트 쇼룸 리터칭 엔진]
 * 이미지 File을 캔버스를 통해 회전 및 스튜디오 광도·대비·선명화 필터를 적용하여
 * 추가 API 비용 없이 무손실 고화질 쇼룸 사진으로 변환
 */
export function enhanceImageFile(
  file: File,
  options: ImageEnhanceOptions = {}
): Promise<File> {
  const {
    degrees = 0,
    brightness = 1.0,
    contrast = 1.0,
    saturate = 1.0,
    quality = 0.92,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.onload = (event) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
      img.onload = () => {
        const normalizedDeg = ((degrees % 360) + 360) % 360;
        const needsRotate = normalizedDeg !== 0;
        const needsFilter = brightness !== 1.0 || contrast !== 1.0 || saturate !== 1.0;

        if (!needsRotate && !needsFilter) {
          resolve(file);
          return;
        }

        const isSwap = normalizedDeg === 90 || normalizedDeg === 270;
        const canvas = document.createElement("canvas");
        canvas.width = isSwap ? img.height : img.width;
        canvas.height = isSwap ? img.width : img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        if (needsFilter) {
          ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (needsRotate) {
          ctx.rotate((normalizedDeg * Math.PI) / 180);
        }
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.toBlob(
          (blob) => {
            canvas.width = 0;
            canvas.height = 0;
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const enhancedFile = new File([blob], cleanName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(enhancedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 이미지 File을 캔버스를 통해 지정된 각도(기본 90도 시계방향)로 회전하여 새로운 File 객체를 반환
 */
export function rotateImageFile(
  file: File,
  degrees = 90,
  quality = 0.92
): Promise<File> {
  return enhanceImageFile(file, { degrees, quality });
}

/**
 * [메모리 누수 원천 차단]
 * 임시 생성된 Blob/Object URL을 안전하게 해제하여 브라우저 메모리 점유 누적 방지
 */
export function revokeObjectUrls(
  urls?: Array<string | null | undefined> | null
): void {
  if (typeof window === "undefined" || !window.URL || !urls) return;
  for (const u of urls) {
    if (u && typeof u === "string" && u.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(u);
      } catch {
        // ignore
      }
    }
  }
}

/* ════════════════════════════════════════════════════════════
   8. 상담 유형별 AI 사진 분석 스키마 및 구조화 문의 포맷/파서
   ════════════════════════════════════════════════════════════ */
export type FactSourceType = "사진 판독" | "고객 직접 입력";
export type FactVerificationStatus =
  | "확인됨"
  | "일부 판독(재확인 필요)"
  | "미확인";

export interface ExtractedFactItem {
  label: string;
  value: string;
  source: FactSourceType;
  status: FactVerificationStatus;
}

export interface PhotoBreakdownItem {
  photoIndex: number;
  role: string;
  summary: string;
}

export interface PurchaseAnalysisData {
  photoTypes: string[];
  requestedProduct: string;
  confirmedSpecs: string[];
  installationObservations: string[];
  purchaseRequirements: string[];
}

export interface SellAnalysisData {
  manufacturer: string;
  manufacturingDate: string;
  safetyLabelReadability:
    | "선명함"
    | "일부만 보임"
    | "판독 불가"
    | "라벨 사진 없음";
  safetyLabelDetails: string[];
  visibleConditionNotes: string[];
  photoLabelConsistency:
    | "일치 확인"
    | "단일 사진/비교 대상 없음"
    | "불일치 의심 — 확인 필요";
  operatingStatusNote: string;
  confirmedQuantity: string;
}

export interface BulkRequestedItem {
  id: string;
  category: string;
  observedInPhotoCount: number | null;
  requestedQuantity: string;
  modelNumber: string;
  specs: string;
  verificationStatus:
    | "고객 입력 확인"
    | "사진 참고 확인(수량 미정)"
    | "추가 확인 필요";
}

export interface BulkElectricalInfo {
  phaseType: "단상 220V" | "삼상 380V" | "모름/미확인";
  observedVoltage: string;
  contractPower: string;
  readability: string;
  voltageUpgradeStatus: "필요" | "불필요" | "모름·현장 확인 필요";
  notes: string;
}

export interface BulkInstallationInfo {
  spaceLayout: string;
  utilities: string;
  accessRoute: string;
  removalAndExtra: string;
  targetRegionAndSchedule: string;
}

export interface BulkAnalysisData {
  businessType: string;
  requestedItems: BulkRequestedItem[];
  electricalInfo: BulkElectricalInfo;
  installationInfo: BulkInstallationInfo;
}

export interface OtherAnalysisData {
  inquirySummary: string;
  observedItems: string[];
}

export interface AnalyzeInquiryResponse {
  success: boolean;
  inquiryType: InquiryTypeValue;
  applianceCategory: ProductCategoryValue | "";
  title: string;
  modelNumber: string;
  conditionGrade: string | null;
  descriptionDraft: string;
  summaryNote: string;
  photoBreakdown: PhotoBreakdownItem[];
  extractedFacts: ExtractedFactItem[];
  missingInfo: string[];
  followUpQuestions: string[];
  purchaseAnalysis?: PurchaseAnalysisData;
  sellAnalysis?: SellAnalysisData;
  bulkAnalysis?: BulkAnalysisData;
  otherAnalysis?: OtherAnalysisData;
}

export interface StructuredInquiryPayload {
  inquiryType: InquiryTypeValue;
  customerContent: string;
  linkedProductUrl?: string;
  applianceCategory?: string;
  modelNumber?: string;
  region?: string;
  schedule?: string;
  /* 매입 전용 고객 확인 값 */
  manufacturingDate?: string;
  operatingStatus?: string;
  conditionGrade?: string;
  /* 대량·업소용 전용 고객 확인 값 */
  businessType?: string;
  bulkItems?: Array<{
    category: string;
    requestedQuantity: string;
    modelNumber?: string;
    specs?: string;
  }>;
  electricalPhase?: string;
  voltageUpgrade?: string;
  spaceAndUtilities?: string;
  accessAndRemoval?: string;
  /* AI 참고 메타데이터 (고객 직접 입력과 분리) */
  aiReference?: {
    summaryNote: string;
    extractedFacts: ExtractedFactItem[];
    missingInfo: string[];
    followUpQuestions: string[];
  } | null;
}

export interface ParsedStructuredInquiry {
  isStructured: boolean;
  customerContent: string;
  structuredLines: Array<{ label: string; value: string }>;
  bulkItems: string[];
  aiSummaryLines: string[];
  missingAndQuestions: string[];
}

const STRUCTURED_HEADER = "[상담 조건 및 확인 정보]";
const AI_REF_HEADER = "[AI 사진 판독 참고 요약 — 관리자 확인용]";

export function formatStructuredInquiryDescription(
  payload: StructuredInquiryPayload
): string {
  const sections: string[] = [];

  const cleanContent = payload.customerContent.trim();
  if (cleanContent) {
    sections.push(cleanContent);
  }

  const metaLines: string[] = [];
  if (payload.linkedProductUrl?.trim()) {
    metaLines.push(`• 문의 상품 링크: ${payload.linkedProductUrl.trim()}`);
  }
  if (
    payload.inquiryType !== "기타 문의" &&
    payload.applianceCategory?.trim()
  ) {
    metaLines.push(`• 품목 분류: ${payload.applianceCategory.trim()}`);
  }
  if (payload.inquiryType !== "기타 문의" && payload.modelNumber?.trim()) {
    metaLines.push(`• 모델명: ${payload.modelNumber.trim()}`);
  }
  if (payload.region?.trim()) {
    metaLines.push(
      `• ${
        payload.inquiryType === "내 물건 팔기"
          ? "방문 수거 지역"
          : "설치/현장 지역"
      }: ${payload.region.trim()}`
    );
  }
  if (payload.schedule?.trim()) {
    metaLines.push(`• 희망 일정/층수: ${payload.schedule.trim()}`);
  }

  if (payload.inquiryType === "내 물건 팔기") {
    if (payload.manufacturingDate?.trim()) {
      metaLines.push(`• 제조년월(연식): ${payload.manufacturingDate.trim()}`);
    }
    if (payload.operatingStatus?.trim()) {
      metaLines.push(`• 고객 확인 작동 상태: ${payload.operatingStatus.trim()}`);
    }
    if (payload.conditionGrade?.trim()) {
      metaLines.push(`• 고객 선택 외관 상태: ${payload.conditionGrade.trim()}`);
    }
  }

  if (payload.inquiryType === "대량·업소용 상담") {
    if (payload.businessType?.trim()) {
      metaLines.push(`• 업종 및 용도: ${payload.businessType.trim()}`);
    }
    if (payload.bulkItems && payload.bulkItems.length > 0) {
      const itemStrings = payload.bulkItems
        .filter((it) => it.category.trim())
        .map((it) => {
          const qty = it.requestedQuantity.trim() || "미확인(상담 필요)";
          const mdl = it.modelNumber?.trim()
            ? ` / 모델·규격: ${it.modelNumber.trim()}`
            : "";
          const spc = it.specs?.trim() ? ` (${it.specs.trim()})` : "";
          return `  - ${it.category.trim()} | 희망 수량: ${qty}${mdl}${spc}`;
        });
      if (itemStrings.length > 0) {
        metaLines.push(`• 희망 장비 및 수량 목록:\n${itemStrings.join("\n")}`);
      }
    }
    if (payload.electricalPhase?.trim()) {
      metaLines.push(`• 매장 전기 환경: ${payload.electricalPhase.trim()}`);
    }
    if (payload.voltageUpgrade?.trim()) {
      metaLines.push(`• 승압 필요 여부: ${payload.voltageUpgrade.trim()}`);
    }
    if (payload.spaceAndUtilities?.trim()) {
      metaLines.push(
        `• 설치 공간·설비 조건: ${payload.spaceAndUtilities.trim()}`
      );
    }
    if (payload.accessAndRemoval?.trim()) {
      metaLines.push(
        `• 반입 동선·철거 요청: ${payload.accessAndRemoval.trim()}`
      );
    }
  }

  if (metaLines.length > 0) {
    sections.push(`${STRUCTURED_HEADER}\n${metaLines.join("\n")}`);
  }

  if (payload.aiReference) {
    const aiLines: string[] = [];
    if (payload.aiReference.summaryNote) {
      aiLines.push(`• 판독 요약: ${payload.aiReference.summaryNote}`);
    }
    const photoFacts = payload.aiReference.extractedFacts.filter(
      (f) => f.source === "사진 판독"
    );
    if (photoFacts.length > 0) {
      aiLines.push(
        `• 사진 확인 항목: ${photoFacts
          .map((f) => `${f.label}(${f.value} - ${f.status})`)
          .join(", ")}`
      );
    }
    if (payload.aiReference.missingInfo.length > 0) {
      aiLines.push(
        `• 미확인 항목: ${payload.aiReference.missingInfo.join(" / ")}`
      );
    }
    if (payload.aiReference.followUpQuestions.length > 0) {
      aiLines.push(
        `• 추가 확인 권장 질문: ${payload.aiReference.followUpQuestions.join(
          " / "
        )}`
      );
    }
    if (aiLines.length > 0) {
      sections.push(`${AI_REF_HEADER}\n${aiLines.join("\n")}`);
    }
  }

  return sections.join("\n\n").slice(0, 4900);
}

export function parseStructuredInquiryDescription(
  rawDescription?: string | null
): ParsedStructuredInquiry {
  const text = (rawDescription || "").trim();
  if (!text.includes(STRUCTURED_HEADER) && !text.includes(AI_REF_HEADER)) {
    return {
      isStructured: false,
      customerContent: text,
      structuredLines: [],
      bulkItems: [],
      aiSummaryLines: [],
      missingAndQuestions: [],
    };
  }

  let customerPart = text;
  let structuredPart = "";
  let aiPart = "";

  if (customerPart.includes(AI_REF_HEADER)) {
    const splitAi = customerPart.split(AI_REF_HEADER);
    customerPart = splitAi[0].trim();
    aiPart = (splitAi[1] || "").trim();
  }

  if (customerPart.includes(STRUCTURED_HEADER)) {
    const splitStruct = customerPart.split(STRUCTURED_HEADER);
    customerPart = splitStruct[0].trim();
    structuredPart = (splitStruct[1] || "").trim();
  }

  const structuredLines: Array<{ label: string; value: string }> = [];
  const bulkItems: string[] = [];

  structuredPart.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("- ")) {
      bulkItems.push(trimmed.slice(2).trim());
      return;
    }
    if (trimmed.startsWith("•")) {
      const body = trimmed.slice(1).trim();
      const colonIdx = body.indexOf(":");
      if (colonIdx > 0) {
        const label = body.slice(0, colonIdx).trim();
        const value = body.slice(colonIdx + 1).trim();
        if (value) {
          structuredLines.push({ label, value });
        }
      }
    }
  });

  const aiSummaryLines: string[] = [];
  const missingAndQuestions: string[] = [];

  aiPart.split("\n").forEach((line) => {
    const trimmed = line.replace(/^[•\-*]\s*/, "").trim();
    if (!trimmed) return;
    if (
      trimmed.startsWith("미확인 항목:") ||
      trimmed.startsWith("추가 확인 권장 질문:")
    ) {
      missingAndQuestions.push(trimmed);
    } else {
      aiSummaryLines.push(trimmed);
    }
  });

  return {
    isStructured: true,
    customerContent: customerPart,
    structuredLines,
    bulkItems,
    aiSummaryLines,
    missingAndQuestions,
  };
}
