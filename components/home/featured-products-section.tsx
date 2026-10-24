// 파일 경로: components/home/featured-products-section.tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  isProductSold,
  STORE,
  telHref,
} from "../../lib/site";
import { Icon, ICON, SectionHeading } from "../../lib/ui";
import {
  ProductCard,
  type ProductItem,
} from "../products/product-card";
import { RecentViewedStrip } from "../products/product-compare-modal";

const FEATURED_DISPLAY_LIMIT = 8;

export function FeaturedProductsSection({
  products,
  loading,
  error,
  onRetry,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onInquireProduct,
}: {
  products: ProductItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onInquireProduct?: (productTitle: string) => void;
}) {
  const sellingProducts = useMemo(() => {
    const active = products.filter((p) => !isProductSold(p.status));
    return (active.length > 0 ? active : products).slice(
      0,
      FEATURED_DISPLAY_LIMIT
    );
  }, [products]);

  const totalSellingCount = useMemo(
    () => products.filter((p) => !isProductSold(p.status)).length,
    [products]
  );

  return (
    <section
      id="featured-products-section"
      aria-labelledby="featured-heading"
      className="border-b border-[#E5E2DC] bg-white py-12 sm:py-16 lg:py-20"
    >
      <div className="hb-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            title={<span id="featured-heading">지금 판매 중인 제품</span>}
            desc="대전 중촌동 직영 매장에서 분해 세척과 작동 점검을 마친 실매물입니다."
          />

          <Link
            href="/gallery"
            className="hb-btn-outline h-11 px-5 text-hb-sm shrink-0 self-start sm:self-end"
          >
            <span>판매 제품 전체 보기</span>
            <Icon d={ICON.arrow} className="w-4 h-4 text-[#D9531E]" />
          </Link>
        </div>

        {/* 로딩 스켈레톤 상태 */}
        {loading ? (
          <div
            className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 items-stretch"
            aria-hidden="true"
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-[#E5E2DC] bg-white animate-pulse"
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
          <div className="mt-8 rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-8 sm:p-10 text-center">
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
        ) : sellingProducts.length === 0 ? (
          <div className="mt-8 flex flex-col items-start justify-between gap-6 rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-6 sm:p-8 sm:flex-row sm:items-center">
            <div>
              <p className="text-hb-lg font-bold text-[#0E1A2B]">
                신규 입고 상품을 검수 및 사진 등록 중입니다.
              </p>
              <p className="mt-1 text-hb-sm text-[#3E4756]">
                매장에는 온라인에 미처 올리지 못한 가전과 주방설비가 상시 준비되어 있습니다. 찾으시는 품목을 말씀해 주시면 즉시 재고를 확인해 드립니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <a
                href={telHref(STORE.tel)}
                className="hb-btn-primary h-11 px-5 text-hb-sm"
              >
                <Icon d={ICON.phone} className="w-4 h-4" /> 전화로 재고 확인
              </a>
              <a
                href={STORE.kakaoChat}
                target="_blank"
                rel="noopener noreferrer"
                className="hb-btn-kakao h-11 px-5 text-hb-sm"
              >
                <Icon d={ICON.chat} className="w-4 h-4" /> 카톡 문의
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 items-stretch">
              {sellingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3">
              <Link
                href="/gallery"
                className="hb-btn-outline h-12 px-8 text-hb-base font-bold"
              >
                <span>
                  {totalSellingCount > FEATURED_DISPLAY_LIMIT
                    ? `판매 제품 전체 보기 (${totalSellingCount}개)`
                    : "판매 제품 전체 보기"}
                </span>
                <Icon d={ICON.arrow} className="w-4 h-4 text-[#D9531E]" />
              </Link>
              <p className="text-hb-xs text-[#646E7E]">
                품목·가격대 필터와 모델명 검색은 전체 판매 제품 페이지에서 이용하실 수 있습니다.
              </p>
            </div>
          </>
        )}

        <RecentViewedStrip className="mt-8 rounded-xl border border-[#E5E2DC]" />
      </div>
    </section>
  );
}
