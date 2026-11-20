// 파일 경로: components/admin/admin-metrics-grid.tsx
"use client";

import React from "react";
import type { AdminMetrics } from "../../lib/admin-metrics";
import type { AdminTab } from "./admin-types";

interface AdminMetricsGridProps {
  metrics: AdminMetrics;
  onSelectTab: (tab: AdminTab) => void;
  onSelectInqStatusFilter: (status: string) => void;
}

/** 관리자 대시보드 상단 4종 운영 지표 요약 카드 */
export function AdminMetricsGrid({
  metrics,
  onSelectTab,
  onSelectInqStatusFilter,
}: AdminMetricsGridProps) {
  return (
    <section
      aria-label="운영 지표 요약"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      <button
        type="button"
        onClick={() => {
          onSelectTab("inquiries");
          onSelectInqStatusFilter("priority");
        }}
        className="text-left rounded-xl border border-[#FADCD0] bg-[#FFF4EE] p-4 hover:border-[#D9531E] transition-colors shadow-2xs"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-hb-xs sm:text-hb-xs font-bold text-[#E8521A]">
            우선 확인 필요 (접수·검토중)
          </span>
          <span className="h-2 w-2 rounded-full bg-[#E8521A]" />
        </div>
        <p className="mt-1.5 text-hb-xl sm:text-hb-2xl font-extrabold text-[#E8521A] tabular-nums">
          {metrics.priorityCount}건
        </p>
      </button>

      <button
        type="button"
        onClick={() => {
          onSelectTab("inquiries");
          onSelectInqStatusFilter("전체");
        }}
        className="text-left rounded-xl border border-[#E2E6EC] bg-white p-4 hover:border-[#141A23]/40 transition-colors shadow-2xs"
      >
        <span className="text-hb-xs sm:text-hb-xs font-bold text-[#6B7280] block">
          전체 문의 · 매입 신청
        </span>
        <p className="mt-1.5 text-hb-xl sm:text-hb-2xl font-extrabold text-[#141A23] tabular-nums">
          {metrics.totalInquiries}건{" "}
          <span className="text-hb-xs sm:text-hb-sm font-semibold text-[#6B7280]">
            (매입 {metrics.buybackCount})
          </span>
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("products")}
        className="text-left rounded-xl border border-[#E2E6EC] bg-white p-4 hover:border-[#141A23]/40 transition-colors shadow-2xs"
      >
        <span className="text-hb-xs sm:text-hb-xs font-bold text-[#6B7280] block">
          현재 판매중 / 예약중 재고
        </span>
        <p className="mt-1.5 text-hb-xl sm:text-hb-2xl font-extrabold text-[#141A23] tabular-nums">
          {metrics.sellingProducts}건{" "}
          <span className="text-hb-xs sm:text-hb-sm font-semibold text-amber-700">
            (예약 {metrics.reservedProducts})
          </span>
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("delivery")}
        className="text-left rounded-xl border border-[#E2E6EC] bg-white p-4 hover:border-[#141A23]/40 transition-colors shadow-2xs"
      >
        <span className="text-hb-xs sm:text-hb-xs font-bold text-[#6B7280] block">
          판매완료 / 배송사례
        </span>
        <p className="mt-1.5 text-hb-xl sm:text-hb-2xl font-extrabold text-[#4B5260] tabular-nums">
          {metrics.soldProducts}건{" "}
          <span className="text-hb-xs sm:text-hb-sm font-semibold text-[#6B7280]">
            (사례 {metrics.deliveryCount})
          </span>
        </p>
      </button>
    </section>
  );
}
