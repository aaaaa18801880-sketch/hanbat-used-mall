// 파일 경로: components/products/recent-viewed-strip.tsx
"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  clearRecentViewedProducts,
  EMPTY_RECENT_VIEWED,
  formatProductPrice,
  getRecentViewedProducts,
  isProductSold,
  MAX_QUOTE_BASKET_ITEMS,
  removeRecentViewedProduct,
  subscribeRecentViewed,
  toggleQuoteBasketItem,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/icons";
import { SafeImg, useQuoteBasket } from "../../lib/ui";

const getServerRecentSnapshot = () => EMPTY_RECENT_VIEWED;

/**
 * 비로그인 최근 본 매물 가로 스트립 컴포넌트
 * - compact 모드: /gallery 상단 배치용 슬림 원라인 카드 + 원클릭 비교·견적함 담기
 * - 기본 모드: /[id] 하단 배치용 카드 스트립
 */
export function RecentViewedStrip({
  excludeId,
  compact = false,
  className = "",
}: {
  excludeId?: string;
  compact?: boolean;
  className?: string;
}) {
  const allItems = useSyncExternalStore(
    subscribeRecentViewed,
    getRecentViewedProducts,
    getServerRecentSnapshot
  );
  const basketItems = useQuoteBasket();

  const items = excludeId
    ? allItems.filter((x) => x.id !== excludeId)
    : allItems;

  if (items.length === 0) return null;

  if (compact) {
    return (
      <section
        aria-label="최근 본 매물"
        className={`border-y border-[#E6E5E0] bg-white py-3.5 ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-hb-xs font-bold text-[#141A23] tabular-nums">
              최근 본 매물 ({items.length})
            </span>
            <span className="hidden sm:inline text-hb-xs text-[#7B8492] truncate">
              확인한 매물을 바로 비교·견적함에 담을 수 있습니다
            </span>
          </div>
          <button
            type="button"
            onClick={() => clearRecentViewedProducts()}
            className="shrink-0 text-hb-xs font-medium text-[#64748B] hover:text-[#141A23] underline underline-offset-2 cursor-pointer"
          >
            기록 비우기
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-0.5 scrollbar-none">
          {items.map((item) => {
            const sold = isProductSold(item.status);
            const inBasket = basketItems.some((b) => b.id === item.id);
            return (
              <div
                key={item.id}
                className="group flex w-[235px] sm:w-[255px] shrink-0 items-center gap-2.5 rounded-[4px] border border-[#E6E5E0] bg-[#FAF9F7] p-2 hover:border-[#141A23]/40 transition-colors"
              >
                <Link
                  href={`/${item.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2.5"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[3px] bg-[#F5F5F2]">
                    <SafeImg
                      src={item.imageUrl}
                      alt={item.title}
                      className={`h-full w-full object-cover mix-blend-multiply ${
                        sold ? "grayscale opacity-65" : ""
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-hb-xs font-semibold text-[#64748B] truncate">
                      {item.category}
                    </span>
                    <p className="truncate text-hb-xs font-semibold text-[#141A23] group-hover:underline underline-offset-2">
                      {item.title}
                    </p>
                  </div>
                </Link>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const res = toggleQuoteBasketItem({
                        id: item.id,
                        title: item.title,
                        category: item.category,
                        price: item.price,
                        status: item.status,
                        imageUrl: item.imageUrl,
                      });
                      if (res.limitReached) {
                        toast.error(
                          `견적함에는 최대 ${MAX_QUOTE_BASKET_ITEMS}개까지 담을 수 있습니다.`
                        );
                      } else if (res.added) {
                        toast.success("비교·견적함에 담았습니다.");
                      } else {
                        toast("비교·견적함에서 뺐습니다.");
                      }
                    }}
                    className={`rounded-md px-2 py-0.5 text-hb-xs font-bold transition-colors cursor-pointer ${
                      inBasket
                        ? "bg-[#C84312] text-white"
                        : "border border-[#E2DDD3] bg-[#FAF9F6] text-[#141A23] hover:border-[#141A23]"
                    }`}
                    aria-label={
                      inBasket
                        ? `${item.title} 비교함에서 제거`
                        : `${item.title} 비교함에 담기`
                    }
                  >
                    {inBasket ? "담김" : "비교담기"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecentViewedProduct(item.id)}
                    aria-label={`${item.title} 최근 본 목록에서 삭제`}
                    className="text-hb-xs text-[#94A3B8] hover:text-[#141A23] cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="최근 본 매물"
      className={`rounded-2xl border border-[#E2DDD3] bg-white p-4 sm:p-5 shadow-2xs ${className}`}
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
          className="inline-flex min-h-6 items-center text-hb-xs font-semibold text-[#64748B] hover:text-[#141A23] underline underline-offset-2 cursor-pointer"
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
              className="group relative flex w-[168px] sm:w-[186px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] hover:border-[#141A23] transition-colors"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  removeRecentViewedProduct(item.id);
                }}
                aria-label={`${item.title} 최근 본 목록에서 삭제`}
                className="absolute right-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-red-600 cursor-pointer"
              >
                <Icon d={ICON.close} className="w-3 h-3" />
              </button>

              <Link href={`/${item.id}`} className="flex flex-1 flex-col">
                <div className="relative aspect-square w-full overflow-hidden bg-[#F4F3F0] border-b border-[#E2DDD3]">
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
                <div className="p-2.5 flex flex-1 flex-col justify-between bg-white">
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
