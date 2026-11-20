// 파일 경로: lib/admin-metrics.ts
import {
  extractModelName,
  getDaysSinceCreated,
  isPriorityInquiryStatus,
  isProductSold,
  matchesSearchQuery,
  normalizeProductCategory,
  normalizeProductStatus,
} from "./site";
import type {
  AdminDeliveryRow,
  AdminInquiryRow,
  AdminProductRow,
} from "../components/admin/admin-types";

export interface AdminMetrics {
  totalInquiries: number;
  priorityCount: number;
  buybackCount: number;
  totalProducts: number;
  sellingProducts: number;
  reservedProducts: number;
  soldProducts: number;
  staleSellingProducts: number;
  deliveryCount: number;
}

export interface AdminInquiryFilterParams {
  statusFilter: string;
  typeFilter: string;
  keyword: string;
}

export interface AdminProductFilterParams {
  categoryFilter: string;
  statusFilter: string;
  keyword: string;
}

/** 관리자 대시보드 상단 핵심 운영 지표 계산 (순수 함수) */
export function computeAdminMetrics(
  inquiries: readonly AdminInquiryRow[],
  products: readonly AdminProductRow[],
  deliveryCases: readonly AdminDeliveryRow[]
): AdminMetrics {
  const regularInquiries = inquiries.filter((i) => !i.is_notice);
  const priorityCount = regularInquiries.filter((i) =>
    isPriorityInquiryStatus(i.status)
  ).length;
  const buybackCount = regularInquiries.filter(
    (i) =>
      (i.inquiry_type || "").includes("팔기") ||
      (i.inquiry_type || "").includes("매입")
  ).length;
  const sellingProducts = products.filter(
    (p) => normalizeProductStatus(p.status) === "판매중"
  ).length;
  const reservedProducts = products.filter(
    (p) => normalizeProductStatus(p.status) === "예약중"
  ).length;
  const soldProducts = products.filter((p) => isProductSold(p.status)).length;
  const staleSellingProducts = products.filter(
    (p) =>
      normalizeProductStatus(p.status) === "판매중" &&
      getDaysSinceCreated(p.created_at) >= 30
  ).length;

  return {
    totalInquiries: regularInquiries.length,
    priorityCount,
    buybackCount,
    totalProducts: products.length,
    sellingProducts,
    reservedProducts,
    soldProducts,
    staleSellingProducts,
    deliveryCount: deliveryCases.length,
  };
}

/** 관리자 문의·매입 목록 필터링 및 우선순위·최신순 정렬 */
export function filterAdminInquiries(
  inquiries: readonly AdminInquiryRow[],
  { statusFilter, typeFilter, keyword }: AdminInquiryFilterParams
): AdminInquiryRow[] {
  const q = keyword.trim().toLowerCase();
  return inquiries
    .filter((i) => {
      if (statusFilter === "notice") return Boolean(i.is_notice);
      if (i.is_notice) return false;
      if (typeFilter !== "전체" && i.inquiry_type !== typeFilter) {
        return false;
      }
      if (statusFilter === "priority") {
        return isPriorityInquiryStatus(i.status);
      }
      if (statusFilter !== "전체" && (i.status || "접수") !== statusFilter) {
        return false;
      }
      if (q) {
        const hay = `${i.name || ""} ${i.phone || ""} ${i.category || ""} ${
          i.description || ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const priA = isPriorityInquiryStatus(a.status) ? 0 : 1;
      const priB = isPriorityInquiryStatus(b.status) ? 0 : 1;
      if (priA !== priB) return priA - priB;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
}

/** 관리자 재고 상품 목록 필터링 (카테고리·상태·30일+ 장기재고·키워드) */
export function filterAdminProducts(
  products: readonly AdminProductRow[],
  { categoryFilter, statusFilter, keyword }: AdminProductFilterParams
): AdminProductRow[] {
  return products.filter((p) => {
    const cat = normalizeProductCategory(p.category);
    const stat = normalizeProductStatus(p.status);
    if (categoryFilter !== "전체" && cat !== categoryFilter) {
      return false;
    }
    if (statusFilter === "stale30") {
      if (stat !== "판매중" || getDaysSinceCreated(p.created_at) < 30) {
        return false;
      }
    } else if (statusFilter !== "전체" && stat !== statusFilter) {
      return false;
    }
    if (keyword) {
      const modelName = extractModelName(p.description, p.title) || "";
      if (
        !matchesSearchQuery(keyword, p.id, p.title, modelName, p.description)
      ) {
        return false;
      }
    }
    return true;
  });
}
