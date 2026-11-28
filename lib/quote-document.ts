// 파일 경로: lib/quote-document.ts
// 온라인 견적서 품목 정리, 카카오톡·문자 공유 본문 및 PDF 파일명 생성 단일 출처(SSOT)

import {
  STORE,
  getCategoryWarrantyInfo,
  isProductSold,
  normalizeProductCategory,
  type QuoteBasketItem,
} from "./site";

export interface QuoteDocumentMeta {
  recipientName: string;
  contactName: string;
  quoteName: string;
  quoteDate: string;
  validDays: number;
  deliveryNote: string;
}

export interface QuoteLineItem {
  no: number;
  id: string;
  category: string;
  title: string;
  modelName: string | null;
  quantity: number;
  remark: string;
  sold: boolean;
}

export interface QuoteDocumentSummary {
  lineItems: QuoteLineItem[];
  totalKindCount: number;
  totalUnits: number;
  soldItemCount: number;
  defaultQuoteName: string;
}

/**
 * KST(Asia/Seoul) 기준 YYYY-MM-DD 날짜 문자열 생성
 */
export function formatQuoteDateKst(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * 견적함 품목 조합 기반 기본 견적명 자동 생성
 */
export function buildDefaultQuoteName(items: QuoteBasketItem[]): string {
  if (!items || items.length === 0) {
    return "중고가전 구매 견적";
  }
  const uniqueCategories = Array.from(
    new Set(items.map((item) => normalizeProductCategory(item.category)))
  );
  if (uniqueCategories.length === 1) {
    return `${uniqueCategories[0]} 구매 견적`;
  }
  if (uniqueCategories.length === 2) {
    return `${uniqueCategories[0]}, ${uniqueCategories[1]} 구매 견적`;
  }
  return `${uniqueCategories[0]} 외 ${uniqueCategories.length - 1}개 품목 구매 견적`;
}

/**
 * 견적 품목 목록을 수량·보증 기준 중심으로 정규화 (금액 계산 없음)
 */
export function buildQuoteDocumentSummary(
  items: QuoteBasketItem[]
): QuoteDocumentSummary {
  const safeItems = Array.isArray(items) ? items : [];
  let totalUnits = 0;
  let soldItemCount = 0;

  const lineItems: QuoteLineItem[] = safeItems.map((item, idx) => {
    const category = normalizeProductCategory(item.category);
    const quantity =
      typeof item.quantity === "number" &&
      Number.isFinite(item.quantity) &&
      item.quantity >= 1
        ? Math.min(99, Math.floor(item.quantity))
        : 1;
    const sold = isProductSold(item.status);

    totalUnits += quantity;
    if (sold) {
      soldItemCount += 1;
    }

    const warrantyShort = getCategoryWarrantyInfo(category).shortLabel;
    const remark = sold ? "판매완료 (유사재고 협의)" : warrantyShort;

    return {
      no: idx + 1,
      id: item.id,
      category,
      title: item.title.trim(),
      modelName: item.modelName?.trim() || null,
      quantity,
      remark,
      sold,
    };
  });

  return {
    lineItems,
    totalKindCount: lineItems.length,
    totalUnits,
    soldItemCount,
    defaultQuoteName: buildDefaultQuoteName(safeItems),
  };
}

/**
 * 카카오톡 붙여넣기 / 문자(SMS) 직통 발송용 견적서 요약 본문 생성 (금액 계산 제외)
 */
export function buildQuoteShareMessage(
  items: QuoteBasketItem[],
  meta: QuoteDocumentMeta
): string {
  const summary = buildQuoteDocumentSummary(items);
  const quoteTitle = meta.quoteName.trim() || summary.defaultQuoteName;

  const headerLines = [
    `[${STORE.name} 온라인 견적 요청서]`,
    `• 견적명: ${quoteTitle}`,
    meta.recipientName.trim() ? `• 수신처: ${meta.recipientName.trim()}` : "",
    meta.contactName.trim() ? `• 담당자/연락처: ${meta.contactName.trim()}` : "",
    `• 작성일: ${meta.quoteDate} (유효기간 ${meta.validDays}일)`,
  ].filter(Boolean);

  const itemLines = summary.lineItems.map((line) => {
    const soldTag = line.sold ? " [유사재고 협의]" : "";
    return `${line.no}. ${line.title} × ${line.quantity}대${soldTag}`;
  });

  return [
    ...headerLines,
    "",
    `[선택 품목 총 ${summary.totalKindCount}종 · ${summary.totalUnits}대]`,
    ...itemLines,
    "",
    `• 배송·설치: ${meta.deliveryNote.trim() || "직영 배송·설치 협의"}`,
    `• 공급사: ${STORE.legalName} (${STORE.tel} / ${STORE.roadAddress})`,
    "위 품목 기준으로 실물 재고 및 견적·설치 일정 안내 부탁드립니다.",
  ].join("\n");
}

/**
 * 안전한 PDF 다운로드 파일명 생성
 */
export function buildQuotePdfFilename(
  recipientName: string,
  quoteDate: string
): string {
  const dateCompact = quoteDate.replace(/[^0-9]/g, "") || "quote";
  const safeRecipient = recipientName
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  if (safeRecipient) {
    return `${STORE.name}_견적서_${safeRecipient}_${dateCompact}.pdf`;
  }
  return `${STORE.name}_견적서_${dateCompact}.pdf`;
}
