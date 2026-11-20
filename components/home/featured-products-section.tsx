// 파일 경로: components/home/featured-products-section.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  getCategoryWarrantyInfo,
  isProductSold,
  STORE,
  STORE_MERCHANT_POLICY,
  telHref,
  trackEvent,
  triggerQuickInquiry,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/icons";
import { useQuoteBasket } from "../../lib/ui";
import {
  ProductCard,
  type ProductItem,
} from "../products/product-card";
import {
  matchesShowroomCategory,
  type ShowroomCategoryItem,
} from "./category-pictogram-bar";
import {
  ModernApplianceIcon,
  type ModernIconType,
} from "../ui/modern-icons";

const ProductCompareModal = dynamic(
  () =>
    import("../products/product-compare-modal").then(
      (m) => m.ProductCompareModal
    ),
  { ssr: false }
);

interface CategoryQualityFact {
  badge: string;
  headline: string;
  points: [string, string, string];
  icon: ModernIconType;
}

const AIRCON_WARRANTY = getCategoryWarrantyInfo("에어컨/냉난방기");
const MAJOR_WARRANTY = getCategoryWarrantyInfo("냉장고");

const CATEGORY_QUALITY_FACTS: Record<string, CategoryQualityFact> = {
  aircon: {
    badge: "에어컨·냉난방기 출고 기준",
    headline: "고압세척 정리 · 실내외기 1:1 세트 구성 및 가스 누설·냉방 작동 점검",
    points: [
      "필터·열교환기 및 외관 고압세척 완료",
      "가스 누설 여부 및 냉방 작동 점검",
      AIRCON_WARRANTY.compactLabel,
    ],
    icon: "aircon",
  },
  fridge: {
    badge: "냉장고·김치냉장고 출고 기준",
    headline: "내부 선반·도어패킹 세척 · 배송 전 냉장·냉동 작동 점검",
    points: [
      "선반·야채칸·도어패킹 깔끔 세척 완료",
      "배송 전 냉장·냉동 냉기 작동 점검",
      MAJOR_WARRANTY.compactLabel,
    ],
    icon: "fridge",
  },
  washer: {
    badge: "세탁기·건조기 출고 기준",
    headline: "내·외부 고압세척 · 배송 전 급배수 및 탈수 작동 점검",
    points: [
      "내부·거름망·외관 고압세척 완료",
      "배송 전 급수·배수 및 탈수 작동 점검",
      MAJOR_WARRANTY.compactLabel,
    ],
    icon: "washer",
  },
  small: {
    badge: "TV·소형가전 출고 기준",
    headline: "화면 출력 · 단자 연결 및 전원 작동 상태 확인 후 출고",
    points: [
      "화면 출력 및 외관 상태 실물 확인",
      "단자 입출력 및 리모컨·전원 작동 점검",
      `초기 기능 불량 시 ${STORE_MERCHANT_POLICY.merchantReturnDays}일 이내 교환·환불 지원`,
    ],
    icon: "small",
  },
  bizFridge: {
    badge: "업소용 냉장설비 출고 기준",
    headline: "업소용 냉장·냉동 설비 고압세척 및 배송 전 냉각 작동 점검",
    points: [
      "내·외부 고압세척 및 냉각 작동 점검",
      "식당·카페 바로 투입 가능한 정리 상태",
      "사업자 전자세금계산서 발행 및 직배송",
    ],
    icon: "biz-fridge",
  },
  showcase: {
    badge: "쇼케이스 출고 기준",
    headline: "유리 도어·선반 세척 및 배송 전 냉각·조명 작동 점검",
    points: [
      "도어 유리 열선 및 내부 조명 작동 확인",
      "배송 전 냉각 작동 및 온도 도달 확인",
      "식당·카페 매장 맞춤 배송 및 자리 배치",
    ],
    icon: "showcase",
  },
  kitchen: {
    badge: "제빙기·주방설비 출고 기준",
    headline: "제빙기·주방설비 세척 정리 및 출고 전 기본 작동 점검",
    points: [
      "제빙기·주방설비 내·외부 세척 정리",
      "급수·배수 및 기본 작동 상태 확인",
      "창업 일괄 납품 및 사업자 세금계산서 발행",
    ],
    icon: "kitchen",
  },
};

const INITIAL_DISPLAY_LIMIT = 10;

export function FeaturedProductsSection({
  products,
  loading,
  error,
  onRetry,
  selectedCategory,
  onResetCategory,
  embedded = false,
}: {
  products: ProductItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  selectedCategory?: ShowroomCategoryItem;
  onResetCategory?: () => void;
  embedded?: boolean;
}) {
  const currentCategoryKey = selectedCategory?.key || "all";
  const [prevCategoryKey, setPrevCategoryKey] = useState(currentCategoryKey);
  const [visibleCount, setVisibleCount] = useState(INITIAL_DISPLAY_LIMIT);
  const [compareOpen, setCompareOpen] = useState(false);

  const basketItems = useQuoteBasket();

  if (prevCategoryKey !== currentCategoryKey) {
    setPrevCategoryKey(currentCategoryKey);
    setVisibleCount(INITIAL_DISPLAY_LIMIT);
  }

  const filteredProducts = useMemo(() => {
    const active = products.filter((p) => !isProductSold(p.status));
    const source = active.length > 0 ? active : products;

    if (!selectedCategory || selectedCategory.key === "all") {
      return source;
    }

    return source.filter((p) => matchesShowroomCategory(p, selectedCategory));
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
      ? `${selectedCategory.label} 검수 완료 실매물`
      : "검수 완료 쇼룸 전시 매물";

  const galleryHref = selectedCategory?.href || "/gallery";
  const tableViewHref = galleryHref.includes("?")
    ? `${galleryHref}&view=table`
    : `${galleryHref}?view=table`;

  const categoryFact =
    currentCategoryKey !== "all"
      ? CATEGORY_QUALITY_FACTS[currentCategoryKey]
      : undefined;

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      id="featured-products-section"
      aria-labelledby="featured-heading"
      className={
        embedded
          ? "bg-white pt-4 pb-10 sm:pt-6 sm:pb-14 border-t border-[#EAE5DC]"
          : "border-b border-[#E2DDD3] bg-white pt-8 pb-12 sm:pt-11 sm:pb-16"
      }
    >
      <div className="hb-container">
        {/* 상단 실매물 쇼케이스 헤더 및 빠른 비교/일람표 액션 바 */}
        {!embedded && (
          <div className="flex flex-col gap-3.5 sm:flex-row sm:items-end sm:justify-between pb-4 border-b border-[#E2E6EC]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-hb-xs font-bold text-[#0F766E]">
                <Icon d={ICON.shieldCheck} className="w-3.5 h-3.5 shrink-0" />
                <span>입고 확인 · 배송 전 작동 점검 실매물</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2.5">
                <h2
                  id="featured-heading"
                  className="text-hb-xl sm:text-hb-2xl font-bold tracking-[-0.025em] text-[#141A23]"
                >
                  {activeCategoryTitle}
                </h2>
                <span className="rounded-md bg-[#F1F3F6] px-2.5 py-0.5 font-mono text-hb-xs sm:text-hb-sm font-bold text-[#141A23] tabular-nums">
                  {filteredProducts.length}건
                </span>
                {selectedCategory &&
                  selectedCategory.key !== "all" &&
                  onResetCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setVisibleCount(INITIAL_DISPLAY_LIMIT);
                        onResetCategory();
                      }}
                      className="min-h-[34px] rounded-xl border border-[#CBD2DC] bg-white px-3 py-1 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-[#F7F8FA] active:scale-[0.96] transition-[border-color,background-color,transform] duration-150 cursor-pointer"
                    >
                      전체 품목 보기
                    </button>
                  )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href={tableViewHref}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#CBD2DC] bg-white px-3.5 py-2 text-hb-xs sm:text-hb-sm font-bold text-[#141A23] hover:border-[#141A23] hover:bg-[#F7F8FA] active:scale-[0.96] transition-[border-color,background-color,transform] duration-150 whitespace-nowrap"
              >
                <Icon d={ICON.list} className="w-3.5 h-3.5 text-[#C84312]" />
                <span>스펙 일람표</span>
              </Link>
              <Link
                href={galleryHref}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#141A23] hover:bg-[#1E2736] text-white px-4 py-2 text-hb-xs sm:text-hb-sm font-bold shadow-xs active:scale-[0.96] transition-[background-color,transform] duration-150 whitespace-nowrap"
              >
                <span>전체 매물 필터</span>
                <Icon d={ICON.arrow} className="w-3.5 h-3.5 text-[#FF8A50]" />
              </Link>
            </div>
          </div>
        )}

        {/* 빠른 비교 · 묶음 견적 진입 도크 (담긴 매물이 있을 때 즉시 활성화) */}
        {!loading && !error && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] px-4 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#141A23] text-[#FF8A50] shrink-0">
                <Icon d={ICON.columns} className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                {basketItems.length > 0 ? (
                  <p className="text-hb-xs sm:text-hb-sm font-bold text-[#141A23] truncate">
                    관심 매물{" "}
                    <span className="font-mono text-[#C84312] tabular-nums">
                      {basketItems.length}대
                    </span>
                    가 비교·견적함에 담겼습니다
                  </p>
                ) : (
                  <p className="text-hb-xs sm:text-hb-sm font-semibold text-[#334155] break-keep">
                    각 매물 사진 우측 하단의{" "}
                    <strong className="font-bold text-[#141A23]">하트(비교 담기)</strong>를 누르면 최대{" "}
                    <span className="font-mono font-bold tabular-nums text-[#C84312]">3대</span>{" "}
                    스펙·가로폭을 나란히 비교하고 한 번에 견적을 받을 수 있습니다.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {basketItems.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("compare_products", {
                        count: basketItems.length,
                        location: "home_featured_bar",
                      });
                      setCompareOpen(true);
                    }}
                    className="hb-btn-primary min-h-[38px] h-9 px-3.5 text-hb-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    <Icon d={ICON.columns} className="w-3.5 h-3.5 text-[#FF8A50]" />
                    <span>
                      나란히 스펙 비교 ({Math.min(basketItems.length, 3)})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("begin_buy_inquiry", {
                        count: basketItems.length,
                        use_bundle: true,
                        location: "home_featured_bar",
                      });
                      triggerQuickInquiry({
                        type: "구매 문의",
                        useBundle: true,
                      });
                    }}
                    className="hb-btn-accent min-h-[38px] h-9 px-3.5 text-hb-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    <Icon d={ICON.chat} className="w-3.5 h-3.5" />
                    <span>묶음 견적 문의</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    trackEvent("begin_buy_inquiry", {
                      category: selectedCategory?.label || "전체",
                      location: "home_featured_bar",
                    });
                    triggerQuickInquiry({
                      type: "구매 문의",
                      productTitle:
                        selectedCategory && selectedCategory.key !== "all"
                          ? `${selectedCategory.label} 맞춤 추천 문의`
                          : undefined,
                    });
                  }}
                  className="hb-btn-outline min-h-[38px] h-9 px-3.5 text-hb-xs font-bold whitespace-nowrap cursor-pointer"
                >
                  <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#C84312]" />
                  <span>조건별 맞춤 매물 추천받기</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 선택 카테고리 특화 검수 기준 스트립 (WCAG AA 대비 강화) */}
        {!loading && !error && categoryFact && (
          <div className="mt-3.5 rounded-xl border border-[#CBD2DC] bg-[#F7F8FA] p-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E6EC] flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <ModernApplianceIcon
                name={categoryFact.icon}
                className="w-8 h-8 shrink-0 text-[#141A23]"
              />
              <div className="min-w-0">
                <span className="hb-trim block text-hb-xs font-bold text-[#C84312]">
                  {categoryFact.badge}
                </span>
                <strong className="mt-0.5 block text-hb-xs sm:text-hb-sm font-bold text-[#141A23] break-keep [text-wrap:pretty]">
                  {categoryFact.headline}
                </strong>
              </div>
            </div>

            <div className="pt-2.5 lg:pt-0 lg:pl-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-hb-xs shrink-0">
              {categoryFact.points.map((pt) => (
                <span
                  key={pt}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#141A23] tabular-nums"
                >
                  <Icon
                    d={ICON.check}
                    className="w-3.5 h-3.5 text-[#0F766E] shrink-0"
                  />
                  <span>{pt}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 로딩 스켈레톤 상태 */}
        {loading ? (
          <div
            className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 sm:gap-x-4 lg:gap-x-5 gap-y-7 sm:gap-y-9 lg:gap-y-11"
            aria-hidden="true"
          >
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="animate-pulse">
                <div className="aspect-square rounded-lg bg-[#F4F3F0]" />
                <div className="pt-2.5 sm:pt-3 space-y-1.5">
                  <div className="h-3.5 w-1/3 rounded bg-[#F4F3F0]" />
                  <div className="h-3.5 w-11/12 rounded bg-[#F4F3F0]" />
                  <div className="h-3 w-2/3 rounded bg-[#F4F3F0]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl bg-[#F7F8FA] border border-[#E2E6EC] p-8 sm:p-10 text-center">
            <p className="text-hb-base font-bold text-[#141A23]">
              상품 목록을 불러오지 못했습니다.
            </p>
            <p className="mt-1.5 text-hb-sm text-[#475569]">
              네트워크 상태를 확인하시거나 잠시 후 다시 시도해 주세요.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="hb-btn-primary mt-5 h-11 px-5 text-hb-sm active:scale-[0.96]"
            >
              다시 불러오기
            </button>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="mt-6 flex flex-col items-start justify-between gap-6 rounded-2xl bg-[#F7F8FA] border border-[#E2E6EC] p-6 sm:p-8 sm:flex-row sm:items-center">
            <div>
              <p className="text-hb-lg font-bold text-[#141A23]">
                선택하신 분류의 온라인 등록 매물을 준비 중입니다.
              </p>
              <p className="mt-1 text-hb-sm text-[#475569]">
                매장에는 온라인에 미처 올리지 못한 가전과 주방설비가 상시 준비되어 있습니다. 찾으시는 품목을 말씀해 주시면 즉시 재고를 확인해 드립니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              {selectedCategory &&
                selectedCategory.key !== "all" &&
                onResetCategory && (
                  <button
                    type="button"
                    onClick={onResetCategory}
                    className="hb-btn-outline h-11 px-4 text-hb-sm active:scale-[0.96]"
                  >
                    전체 매물 보기
                  </button>
                )}
              <a
                href={telHref(STORE.tel)}
                className="hb-btn-primary h-11 px-5 text-hb-sm active:scale-[0.96]"
              >
                <Icon d={ICON.phone} className="w-4 h-4" /> 전화로 재고 확인
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 sm:gap-x-4 lg:gap-x-5 gap-y-7 sm:gap-y-9 lg:gap-y-11">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* 하단 더보기 및 전체 갤러리 이동 바 */}
            <div className="mt-12 pt-6 border-t border-[#E2E6EC] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-hb-xs sm:text-hb-sm text-[#475569]">
                표시 중:{" "}
                <strong className="font-mono font-bold text-[#141A23] tabular-nums">
                  {displayedProducts.length}
                </strong>{" "}
                / 전체{" "}
                <strong className="font-mono font-bold text-[#141A23] tabular-nums">
                  {filteredProducts.length}
                </strong>
                건
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                {filteredProducts.length > visibleCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                    className="hb-btn-outline h-11 px-5 text-hb-sm font-bold cursor-pointer active:scale-[0.96]"
                  >
                    <span>이 화면에서 매물 더보기 (+10)</span>
                    <Icon d={ICON.down} className="w-4 h-4" />
                  </button>
                )}
                <Link
                  href={galleryHref}
                  className="hb-btn-primary h-11 px-6 text-hb-sm font-bold active:scale-[0.96]"
                >
                  <span>전체 판매 제품 갤러리 ({totalSellingCount}건)</span>
                  <Icon d={ICON.arrow} className="w-4 h-4 text-[#FF8A50]" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {compareOpen && (
        <ProductCompareModal
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          items={basketItems}
        />
      )}
    </Wrapper>
  );
}
