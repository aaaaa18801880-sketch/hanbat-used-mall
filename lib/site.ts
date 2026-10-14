// 사이트 공통 상수, 데이터 표준 코드 및 유틸리티 단일 출처 (Single Source of Truth)

export const STORE = {
  name: "한밭중고전자",
  url: "https://hanbatmall.com",
  since: 1997,
  ceo: "김영종",
  tel: "042-523-8179",
  tel2: "042-527-4888",
  // ⚠️ 확인 필요: 기존 lib/site.ts(010-5406-8179)와 app/page.tsx(010-6631-8179)가 상이하여 환경변수로 오버라이드 가능하도록 유지
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
   상품(products) 상태 및 카테고리 표준 정의
   ════════════════════════════════════════════════════════════ */
export const PRODUCT_STATUS = {
  SELLING: "판매중",
  RESERVED: "예약중",
  SOLD: "판매완료",
} as const;

export type ProductStatusValue = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export const PRODUCT_CATEGORIES = [
  "에어컨/냉난방기",
  "냉장고",
  "세탁기/건조기",
  "업소용기기",
  "기타",
] as const;

export type ProductCategoryValue = (typeof PRODUCT_CATEGORIES)[number];

export const DELIVERY_REVIEW_CATEGORY = "배송인증" as const;

/** DB에 'sold' 또는 '판매완료' 등으로 저장된 모든 판매완료 상태를 일관되게 판별 */
export function isProductSold(status?: string | null): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === "판매완료" || s === "sold" || s === "soldout";
}

/** DB에 'reserved' 또는 '예약중'으로 저장된 상태 판별 */
export function isProductReserved(status?: string | null): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === "예약중" || s === "reserved";
}

/** 어떤 레거시 상태값이 들어와도 표준 DB 상태값('판매중' | '예약중' | '판매완료')으로 정규화 */
export function normalizeProductStatus(status?: string | null): ProductStatusValue {
  if (isProductSold(status)) return PRODUCT_STATUS.SOLD;
  if (isProductReserved(status)) return PRODUCT_STATUS.RESERVED;
  return PRODUCT_STATUS.SELLING;
}

/** 화면 표시용 한글 상태 라벨 반환 */
export function getProductStatusLabel(status?: string | null): string {
  return normalizeProductStatus(status);
}

/** 구형 관리자 페이지('업소용 주방기기', '세탁기', 'TV' 등)의 카테고리를 5대 표준 카테고리로 정규화 */
export function normalizeProductCategory(raw?: string | null): ProductCategoryValue {
  const c = (raw ?? "").trim();
  if ((PRODUCT_CATEGORIES as readonly string[]).includes(c)) {
    return c as ProductCategoryValue;
  }
  if (c.includes("에어컨") || c.includes("냉난방")) return "에어컨/냉난방기";
  if (c.includes("업소") || c.includes("주방") || c.includes("쇼케이스") || c.includes("제빙기")) return "업소용기기";
  if (c.includes("냉장") || c.includes("김치")) return "냉장고";
  if (c.includes("세탁") || c.includes("건조") || c.includes("워시")) return "세탁기/건조기";
  return "기타";
}

/** 카테고리별 가격 미정 시 맞춤 상담 문구 반환 */
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

export function formatProductPrice(price?: number | null, category?: string | null): string {
  return hasProductPrice(price) ? `${Number(price).toLocaleString()}원` : getInquiryLabel(category);
}

/* ════════════════════════════════════════════════════════════
   문의(purchase_requests) 구분 및 상태 표준 정의
   ════════════════════════════════════════════════════════════ */
export const INQUIRY_TYPES = ["구매 문의", "내 물건 팔기", "기타 문의"] as const;
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

export const isSellInquiry = (t?: string | null) =>
  t === "내 물건 팔기" || t === "내 물건팔기" || t === "매입문의" || t === "매입 신청";
export const isBuyInquiry = (t?: string | null) =>
  t === "구매 문의" || t === "구매문의";
export const getInquiryTypeLabel = (t?: string | null): string =>
  isSellInquiry(t) ? "내 물건 팔기" : isBuyInquiry(t) ? "구매 문의" : t === "공지사항" ? "공지사항" : "기타 문의";

/* ════════════════════════════════════════════════════════════
   전화번호, 마스킹, 이미지 유틸리티
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

/** 문자열(콤마 구분) 또는 문자열 배열 모두 안전하게 이미지 URL 배열로 변환 */
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

/** 문의 레코드에서 images 배열과 레거시 image_url 단일 문자열을 모두 호환 추출 */
export function extractInquiryImages(row: { images?: unknown; image_url?: unknown }): string[] {
  const fromArray = splitImages(row.images);
  if (fromArray.length > 0) return fromArray;
  return splitImages(row.image_url);
}

export const MAX_PHOTOS = 3;
export const MAX_REVIEW_PHOTOS = 5;
export const MAX_FILE_MB = 15;

/** 클라이언트 측 1차 이미지 파일 검증 */
export function validateImageFiles(files: File[], maxCount = MAX_PHOTOS): { ok: File[]; error?: string } {
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

/** 클라이언트 측 Canvas 이미지 압축 (긴 변 1280px, JPEG 0.78) */
export function compressImage(file: File, maxDim = 1280, quality = 0.78): Promise<Blob> {
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
          (blob) => (blob ? resolve(blob) : reject(new Error("이미지 압축에 실패했습니다."))),
          "image/jpeg",
          quality
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}