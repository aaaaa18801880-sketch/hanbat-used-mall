"use client";

// 파일 경로: components/gallery/gallery-bulk-action-bar.tsx
// 관리자 일괄 선택 플로팅 작업 바 (관리자 선택 모드일 때만 지연 로딩)

import React from "react";
import { Icon, ICON } from "../../lib/icons";

export function GalleryBulkActionBar({
  selectedCount,
  totalFilteredCount,
  isBulkLoading,
  onToggleSelectAll,
  onBulkStatusChange,
  onBulkDelete,
  onClose,
}: {
  selectedCount: number;
  totalFilteredCount: number;
  isBulkLoading: boolean;
  onToggleSelectAll: () => void;
  onBulkStatusChange: (status: "판매중" | "예약중" | "판매완료") => void;
  onBulkDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-16 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 bg-[#141A23]/95 text-white px-4 sm:px-6 py-3.5 rounded-xl shadow-2xl border border-white/15 max-w-[95vw] overflow-x-auto">
      <span className="text-hb-sm font-bold whitespace-nowrap">
        <strong className="text-[#FEE500]">{selectedCount}</strong>개 선택됨
      </span>

      <button
        type="button"
        onClick={onToggleSelectAll}
        className="text-hb-xs font-semibold text-white/90 px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 whitespace-nowrap cursor-pointer"
      >
        {selectedCount === totalFilteredCount ? "선택 해제" : "전체 선택"}
      </button>

      <button
        type="button"
        disabled={selectedCount === 0 || isBulkLoading}
        onClick={() => onBulkStatusChange("판매중")}
        className="text-hb-xs font-bold text-white px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 whitespace-nowrap cursor-pointer"
      >
        판매중 변경
      </button>

      <button
        type="button"
        disabled={selectedCount === 0 || isBulkLoading}
        onClick={() => onBulkStatusChange("예약중")}
        className="text-hb-xs font-bold text-white px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-40 whitespace-nowrap cursor-pointer"
      >
        예약중 변경
      </button>

      <button
        type="button"
        disabled={selectedCount === 0 || isBulkLoading}
        onClick={() => onBulkStatusChange("판매완료")}
        className="text-hb-xs font-bold text-white px-3 py-1.5 rounded bg-[#334155] hover:bg-[#606877] disabled:opacity-40 whitespace-nowrap cursor-pointer"
      >
        판매완료 처리
      </button>

      <button
        type="button"
        disabled={selectedCount === 0 || isBulkLoading}
        onClick={onBulkDelete}
        className="text-hb-xs font-bold text-white px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-40 whitespace-nowrap cursor-pointer"
      >
        선택 삭제
      </button>

      <button
        type="button"
        onClick={onClose}
        className="text-white/70 hover:text-white p-1 cursor-pointer"
        aria-label="선택 모드 닫기"
      >
        <Icon d={ICON.close} className="w-4 h-4" />
      </button>
    </div>
  );
}
