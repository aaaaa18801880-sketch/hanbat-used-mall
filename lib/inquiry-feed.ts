// 파일 경로: lib/inquiry-feed.ts
// 최근 접수된 문의 현황 요약 및 날짜 포맷 순수 헬퍼 (실데이터 기반)

import { INQUIRY_STATUS, getInquiryTypeLabel } from "./site";

export interface InquiryFeedItem {
  id: string | number;
  inquiry_type?: string | null;
  category: string | null;
  name: string | null;
  masked_name?: string | null;
  status: string | null;
  is_notice: boolean | null;
  created_at?: string | null;
}

export interface InquiryActivitySummary {
  totalShown: number;
  answeredCount: number;
  sellCount: number;
  buyOrBulkCount: number;
  answeredRate: number;
}

export function isInquiryAnswered(status?: string | null): boolean {
  return (
    status === INQUIRY_STATUS.ANSWERED || status === INQUIRY_STATUS.COMPLETED
  );
}

export function getInquiryTypeTone(
  inquiryType?: string | null
): "sell" | "buy" | "bulk" | "other" {
  const label = getInquiryTypeLabel(inquiryType);
  if (label.includes("팔기") || label.includes("매입")) return "sell";
  if (label.includes("업소") || label.includes("대량")) return "bulk";
  if (label.includes("구매")) return "buy";
  return "other";
}

export function formatInquiryRelativeDate(
  isoDate?: string | null,
  nowMs = Date.now()
): string {
  if (!isoDate) return "";
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return "";

  const diffMs = nowMs - ts;
  if (diffMs < 0) return "방금";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "방금 전";
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "어제";
  if (diffDays <= 6) return `${diffDays}일 전`;

  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
}

export function summarizeInquiryActivity(
  items: readonly InquiryFeedItem[]
): InquiryActivitySummary {
  const valid = items.filter((item) => !item.is_notice);
  const totalShown = valid.length;
  if (totalShown === 0) {
    return {
      totalShown: 0,
      answeredCount: 0,
      sellCount: 0,
      buyOrBulkCount: 0,
      answeredRate: 0,
    };
  }

  let answeredCount = 0;
  let sellCount = 0;
  let buyOrBulkCount = 0;

  for (const item of valid) {
    if (isInquiryAnswered(item.status)) answeredCount += 1;
    const tone = getInquiryTypeTone(item.inquiry_type);
    if (tone === "sell") sellCount += 1;
    else buyOrBulkCount += 1;
  }

  return {
    totalShown,
    answeredCount,
    sellCount,
    buyOrBulkCount,
    answeredRate: Math.round((answeredCount / totalShown) * 100),
  };
}
