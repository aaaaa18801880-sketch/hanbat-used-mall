"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  clearRecentViewedProducts,
  EMPTY_RECENT_VIEWED,
  formatProductPrice,
  getRecentViewedProducts,
  isProductSold,
  removeRecentViewedProduct,
  subscribeRecentViewed,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/icons";
import { SafeImg } from "../../lib/ui";

const getServerRecentSnapshot = () => EMPTY_RECENT_VIEWED;

/**
 * 비로그인 최근 본 매물 가로 스트립 컴포넌트
 * - 비교 모달/공간 플래너 번들에서 분리하여 /gallery 및 /[id] 초기 JS 부하를 줄입니다.
 */
export function RecentViewedStrip({
  excludeId,
  className = "",
}: {
  excludeId?: string;
  className?: string;
}) {
  const allItems = useSyncExternalStore(
    subscribeRecentViewed,
    getRecentViewedProducts,
    getServerRecentSnapshot
  );
  const items = excludeId
    ? allItems.filter((x) => x.id !== excludeId)
    : allItems;

  if (items.length === 0) return null;

  return (
    <section
      aria-label="최근 본 매물"
      className={`rounded-xl border border-[#E2E6EC] bg-white p-4 sm:p-5 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-hb-base font-bold text-[#141A23]">
            최근 본 매물 ({items.length})
          </h2>
          <span className="hidden sm:inline text-hb-xs text-[#64748B]">
            로그인 없이 현재 기기에만 안전하게 저장됩니다
          </span>
        </div>
        <button
          type="button"
          onClick={() => clearRecentViewedProducts()}
          className="inline-flex min-h-6 items-center text-hb-xs font-semibold text-[#64748B] hover:text-[#141A23] underline underline-offset-2"
        >
          기록 비우기
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {items.map((item) => {
          const sold = isProductSold(item.status);
          return (
            <div
              key={item.id}
              className="group relative flex w-[170px] sm:w-[190px] shrink-0 flex-col overflow-hidden rounded-lg border border-[#E2E6EC] bg-[#F7F8FA] hover:border-[#141A23] transition-colors"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  removeRecentViewedProduct(item.id);
                }}
                aria-label={`${item.title} 최근 본 목록에서 삭제`}
                className="absolute right-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-red-600"
              >
                <Icon d={ICON.close} className="w-3 h-3" />
              </button>

              <Link href={`/${item.id}`} className="flex flex-1 flex-col">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F1F3F6] border-b border-[#E2E6EC]">
                  <SafeImg
                    src={item.imageUrl}
                    alt={item.title}
                    className={`h-full w-full object-cover ${
                      sold ? "grayscale opacity-70" : ""
                    }`}
                  />
                  {sold && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-[#141A23]/85 px-1.5 py-0.5 text-hb-xs font-bold text-white">
                      판매완료
                    </span>
                  )}
                </div>
                <div className="p-2.5 flex flex-1 flex-col justify-between">
                  <div>
                    <span className="block text-hb-xs font-semibold text-[#64748B] truncate">
                      {item.category}
                    </span>
                    <p className="mt-0.5 line-clamp-1 text-hb-xs font-bold text-[#141A23] group-hover:text-[#E8521A]">
                      {item.title}
                    </p>
                  </div>
                  <strong className="mt-1.5 block text-hb-sm font-bold text-[#141A23] tabular-nums">
                    {sold
                      ? "판매완료"
                      : formatProductPrice(item.price, item.category)}
                  </strong>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
