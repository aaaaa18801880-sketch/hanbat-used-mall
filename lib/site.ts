// 사이트 공통 상수, 데이터 표준 코드 및 유틸리티 단일 출처 (Single Source of Truth)

export const STORE = {
  name: "한밭중고전자",
  url: "https://hanbatmall.com",
  since: 1997,
  ceo: "김영종",
  tel: "042-523-8179",
  tel2: "042-527-4888",
  mobile: process.env.NEXT_PUBLIC_STORE_MOBILE || "010-6631-8179",
  mobileLegacy: "010-5406-8179",
  address: "대전광역시 중구 중촌동 144",
  addressNote: "중촌고가도로 밑",
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
  const desc = description ?? "";
  const explicitMatch = desc.match(
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

  const t = title ?? "";
  const codeMatch = t.match(/\b([A-Z]{2,5}[0-9A-Z\-]{4,18})\b/);
  if (codeMatch && /[0-9]/.test(codeMatch[1])) {
    return codeMatch[1];
  }

  return null;
}

export function parseProductDescription(description?: string | null): {
  features: string[];
  specs: Array<{ label: string; value: string }>;
  checkPoints: string[];
  rawRest: string[];
  hasStructuredSections: boolean;
} {
  const text = (description ?? "").trim();
  if (!text) {
    return {
      features: [],
      specs: [],
      checkPoints: [],
      rawRest: [],
      hasStructuredSections: false,
    };
  }

  const lines = text.split(/\r?\n/);
  let currentSection: "features" | "specs" | "check" | "rest" = "rest";
  const features: string[] = [];
  const specs: Array<{ label: string; value: string }> = [];
  const checkPoints: string[] = [];
  const rawRest: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^\[핵심\s*특징\]/i.test(line)) {
      currentSection = "features";
      continue;
    }
    if (/^\[주요\s*사양\]/i.test(line)) {
      currentSection = "specs";
      continue;
    }
    if (/^\[설치\s*전\s*체크\]/i.test(line)) {
      currentSection = "check";
      continue;
    }

    const cleanedBullet = line.replace(/^[•\-*]\s*/, "").trim();

    if (currentSection === "features") {
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
    } else if (currentSection === "check") {
      checkPoints.push(cleanedBullet);
    } else {
      rawRest.push(line);
    }
  }

  const hasStructuredSections =
    features.length > 0 || specs.length > 0 || checkPoints.length > 0;

  return {
    features,
    specs,
    checkPoints,
    rawRest,
    hasStructuredSections,
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
   2. 문의(purchase_requests) 역할 구분 및 표준 상태 전이 정의
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

/** 관리자가 명시적으로 선택하여 변경할 수 있는 표준 상태 목록 */
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
   3. 외부 알림(Telegram / 알림톡) 5대 발송 상태 표준 정의
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
   4. 전화번호, 마스킹, 이미지 유틸리티
   ════════════════════════════════════════════════════════════ */
export const telHref = (num: string) => `tel:${num.replace(/[^0-9+]/g, "")}`;

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
          (blob) =>
            blob
              ? resolve(blob)
              : reject(new Error("이미지 압축에 실패했습니다.")),
          "image/jpeg",
          quality
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}