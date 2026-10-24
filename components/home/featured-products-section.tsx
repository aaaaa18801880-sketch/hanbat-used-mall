// 파일 경로: components/home/featured-products-section.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  isProductSold,
  normalizeProductCategory,
  STORE,
  telHref,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";
import {
  ProductCard,
  type ProductItem,
} from "../products/product-card";
import { RecentViewedStrip } from "../products/product-compare-modal";
import type { ShowroomCategoryItem } from "./category-pictogram-bar";

const INITIAL_DISPLAY_LIMIT = 8;

export function FeaturedProductsSection({
  products,
  loading,
  error,
  onRetry,
  selectedCategory,
  onResetCategory,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onInquireProduct,
}: {
  products: ProductItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  selectedCategory?: ShowroomCategoryItem;
  onResetCategory?: () => void;
  onInquireProduct?: (productTitle: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_DISPLAY_LIMIT);

  const filteredProducts = useMemo(() => {
    const active = products.filter((p) => !isProductSold(p.status));
    const source = active.length > 0 ? active : products;

    if (!selectedCategory || selectedCategory.key === "all") {
      return source;
    }

    return source.filter((p) => {
      const cat = normalizeProductCategory(p.category);
      if (cat !== selectedCategory.filterCategory) return false;
      if (selectedCategory.filterKeyword) {
        const hay = `${p.title} ${p.description || ""}`.toLowerCase();
        return hay.includes(selectedCategory.filterKeyword.toLowerCase());
      }
      return true;
    });
  }, [products, selectedCategory]);

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const totalSellingCount = useMemo(
    () => products.filter((p) => !isProductSold(p.status)).length,
    [products]
  );

  const activeCategoryTitle =
    selectedCategory && selectedCategory.key !== "all"
      ? `${selectedCategory.label} 전시 매물`
      : "실시간 쇼룸 전시 매물";

  const galleryHref = selectedCategory?.href || "/gallery";

  return (
    <section
      id="featured-products-section"
      aria-labelledby="featured-heading"
      className="border-b border-[#E5E2DC] bg-white py-10 sm:py-14 lg:py-16"
    >
      <div className="hb-container">
        {/* 에디토리얼 쇼룸 헤더 바 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-6 border-b-2 border-[#0E1A2B]">
          <div>
            <div className="flex items-center gap-2 text-hb-xs font-bold text-[#D9531E]">
              <span>LIVE SHOWROOM INVENTORY</span>
              <span>·</span>
              <span className="text-[#0E1A2B] tabular-nums">
                현재 구매 가능 총 {totalSellingCount}대
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
              <h2
                id="featured-heading"
                className="text-hb-2xl sm:text-hb-3xl font-extrabold tracking-tight text-[#0E1A2B]"
              >
                {activeCategoryTitle}
              </h2>
              <span className="text-hb-sm font-bold text-[#646E7E] tabular-nums">
                ({filteredProducts.length}건)
              </span>
              {selectedCategory && selectedCategory.key !== "all" && onResetCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setVisibleCount(INITIAL_DISPLAY_LIMIT);
                    onResetCategory();
                  }}
                  className="text-hb-xs font-bold text-[#D9531E] underline underline-offset-4 cursor-pointer"
                >
                  전체 품목으로 복귀
                </button>
              )}
            </div>
            <p className="mt-1 text-hb-sm text-[#3E4756]">
              대전 중촌동 1·2층 직영 매장에서 분해 고압세척과 시운전 검수를 마친 실매물입니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={galleryHref}
              className="hb-btn-primary h-11 px-5 text-hb-sm"
            >
              <span>상세 필터 · 전체 매물 보기</span>
              <Icon d={ICON.arrow} className="w-4 h-4 text-[#FF8A50]" />
            </Link>
          </div>
        </div>

        {/* 로딩 스켈레톤 상태 */}
        {loading ? (
          <div
            className="mt-8 grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4 items-stretch"
            aria-hidden="true"
          >
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-lg border border-[#E5E2DC] bg-white animate-pulse"
              >
                <div className="aspect-[4/3] bg-[#F0EDE7]" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-1/3 rounded bg-[#F0EDE7]" />
                  <div className="h-5 w-4/5 rounded bg-[#F0EDE7]" />
                  <div className="h-6 w-1/2 rounded bg-[#F0EDE7] pt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 border-y border-[#E5E2DC] bg-[#FAF9F7] p-8 sm:p-10 text-center">
            <p className="text-hb-base font-bold text-[#0E1A2B]">
              실시간 상품 목록을 불러오지 못했습니다.
            </p>
            <p className="mt-1.5 text-hb-sm text-[#646E7E]">
              네트워크 상태를 확인하시거나 잠시 후 다시 시도해 주세요.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="hb-btn-primary mt-5 h-11 px-5 text-hb-sm"
            >
              다시 불러오기
            </button>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="mt-8 flex flex-col items-start justify-between gap-6 border-y border-[#E5E2DC] bg-[#FAF9F7] p-6 sm:p-8 sm:flex-row sm:items-center">
            <div>
              <p className="text-hb-lg font-bold text-[#0E1A2B]">
                선택하신 분류의 온라인 등록 매물을 준비 중입니다.
              </p>
              <p className="mt-1 text-hb-sm text-[#3E4756]">
                매장에는 온라인에 미처 올리지 못한 가전과 주방설비가 상시 준비되어 있습니다. 찾으시는 품목을 말씀해 주시면 즉시 재고를 확인해 드립니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              {selectedCategory && selectedCategory.key !== "all" && onResetCategory && (
                <button
                  type="button"
                  onClick={onResetCategory}
                  className="hb-btn-outline h-11 px-4 text-hb-sm"
                >
                  전체 매물 보기
                </button>
              )}
              <a
                href={telHref(STORE.tel)}
                className="hb-btn-primary h-11 px-5 text-hb-sm"
              >
                <Icon d={ICON.phone} className="w-4 h-4" /> 전화로 재고 확인
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-7 grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4 items-stretch">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* 하단 더보기 및 전체 갤러리 이동 바 */}
            <div className="mt-9 pt-6 border-t border-[#ECE9E2] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-hb-xs sm:text-hb-sm text-[#646E7E]">
                표시 중:{" "}
                <strong className="font-bold text-[#0E1A2B] tabular-nums">
                  {displayedProducts.length}
                </strong>{" "}
                / 전체{" "}
                <strong className="font-bold text-[#0E1A2B] tabular-nums">
                  {filteredProducts.length}
                </strong>
                건 · 가격대 필터와 모델명 검색은 전체 갤러리에서 지원합니다.
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                {filteredProducts.length > visibleCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 8)}
                    className="hb-btn-outline h-11 px-5 text-hb-sm font-bold cursor-pointer"
                  >
                    <span>이 화면에서 매물 더보기 (+8)</span>
                    <Icon d={ICON.down} className="w-4 h-4" />
                  </button>
                )}
                <Link
                  href={galleryHref}
                  className="hb-btn-primary h-11 px-6 text-hb-sm font-bold"
                >
                  <span>전체 판매 제품 갤러리 ({totalSellingCount}대)</span>
                  <Icon d={ICON.arrow} className="w-4 h-4 text-[#FF8A50]" />
                </Link>
              </div>
            </div>
          </>
        )}

        <RecentViewedStrip className="mt-8 rounded-lg border border-[#E5E2DC]" />
      </div>
    </section>
  );
}
