// 파일 경로: components/home/featured-products-section.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  getCategoryWarrantyInfo,
  isProductSold,
  STORE,
  STORE_MERCHANT_POLICY,
  telHref,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";
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
    headline: "완전 분해 고압 살균세척 · 실외기 콤프레셔 및 냉매 압력 테스트",
    points: [
      "분해 고압세척 및 열교환기 핀 살균 완료",
      "냉매 가스 누설 진공 시험 및 압축기 시운전",
      AIRCON_WARRANTY.detailLabel,
    ],
    icon: "aircon",
  },
  fridge: {
    badge: "냉장고·김치냉장고 출고 기준",
    headline: "내부 선반·도어패킹 고온 스팀 클리닝 · 콤프레셔 냉각 사이클 시운전",
    points: [
      "선반·야채칸 분해 세척 및 탈취 소독 완료",
      "콤프레셔 냉각 사이클 온도 측정 시험",
      MAJOR_WARRANTY.detailLabel,
    ],
    icon: "fridge",
  },
  washer: {
    badge: "세탁기·건조기 출고 기준",
    headline: "세탁조 분해 세척 및 내부 잔여물 제거 · 고속 탈수 진동 밸런스 검수",
    points: [
      "세탁조 전면 분해 살균 및 내부 잔여물 세척",
      "고속 탈수 진동 밸런스 및 급수/배수 누수 시험",
      MAJOR_WARRANTY.detailLabel,
    ],
    icon: "washer",
  },
  small: {
    badge: "TV·소형가전 출고 기준",
    headline: "화면 무결점 점검 · 포트 입출력 및 전원 안정성 정밀 테스트",
    points: [
      "화면 패널 잔상 및 백라이트 균일도 검수",
      "HDMI/음향 단자 및 리모컨 수신 정밀 점검",
      `기능 불량 시 ${STORE_MERCHANT_POLICY.merchantReturnDays}일 이내 무상 교환·환불 보장`,
    ],
    icon: "small",
  },
  bizFridge: {
    badge: "업소용 냉장설비 출고 기준",
    headline: "상업용 고출력 콤프레셔 압력 측정 · 디지털 온도센서 캘리브레이션",
    points: [
      "상업용 콤프레셔 냉각 성능 및 가스 충전 완비",
      "즉시 식당 영업 투입 가능한 청결 소독 상태",
      "사업자 전자세금계산서 발행 및 직배송",
    ],
    icon: "biz-fridge",
  },
  showcase: {
    badge: "쇼케이스 출고 기준",
    headline: "도어 유리 결로 방지 열선 점검 · 음료/주류 보관 최적 온도 테스트",
    points: [
      "도어 유리 열선 및 LED 내부 조명 전체 점검",
      "급속 냉각 사이클 및 서리 발생 방지 시험",
      "식당·카페 매장 맞춤 배송 및 자리 배치",
    ],
    icon: "showcase",
  },
  kitchen: {
    badge: "제빙기·주방설비 출고 기준",
    headline: "얼음 생성 사이클 측정 · 급수 전자밸브 및 배수 펌프 정밀 검수",
    points: [
      "제빙 노즐 스팀 살균 및 얼음 생산량 검증",
      "스테인리스 주방설비 연마 및 세척 완료",
      "창업 일괄 납품 및 사업자 세금계산서 발행",
    ],
    icon: "kitchen",
  },
};

const INITIAL_DISPLAY_LIMIT = 8;

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
  const [visibleCount, setVisibleCount] = useState(INITIAL_DISPLAY_LIMIT);

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
      ? `${selectedCategory.label} 전시 매물`
      : "쇼룸 전시 매물";

  const galleryHref = selectedCategory?.href || "/gallery";

  const currentCategoryKey = selectedCategory?.key || "all";
  const categoryFact =
    currentCategoryKey !== "all" ? CATEGORY_QUALITY_FACTS[currentCategoryKey] : undefined;

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      id="featured-products-section"
      aria-labelledby="featured-heading"
      className={
        embedded
          ? "bg-white pt-4 pb-10 sm:pt-5 sm:pb-12"
          : "border-b border-[#E2E6EC] bg-white pt-6 pb-12 sm:pt-8 sm:pb-16"
      }
    >
      <div className="hb-container">
        {/* 클린 카탈로그 헤더: 1줄 컴팩트 컨트롤 바 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E2E6EC]">
          {/* 좌측: 타이틀 + 건수 + (필터 해제 버튼) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <h2
              id="featured-heading"
              className="text-hb-xl sm:text-hb-2xl font-bold tracking-[-0.025em] text-[#141A23]"
            >
              {activeCategoryTitle}
            </h2>
            <span className="text-hb-sm sm:text-hb-base font-bold text-[#64748B] tabular-nums">
              {filteredProducts.length}건
            </span>
            {selectedCategory && selectedCategory.key !== "all" && onResetCategory && (
              <button
                type="button"
                onClick={() => {
                  setVisibleCount(INITIAL_DISPLAY_LIMIT);
                  onResetCategory();
                }}
                className="rounded-full bg-[#F1F3F6] px-2.5 py-1 text-hb-xs font-bold text-[#4E5968] hover:bg-[#E2E6EC] hover:text-[#141A23] active:scale-[0.96] transition-[background-color,color,transform] duration-150 cursor-pointer"
              >
                전체 품목 보기
              </button>
            )}
          </div>

          {/* 우측: 전체 매물 링크 */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href={galleryHref}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#141A23] hover:bg-[#1E2736] text-white px-4 py-2 text-hb-xs sm:text-hb-sm font-bold shadow-xs active:scale-[0.96] transition-[background-color,transform] duration-150"
            >
              <span>상세 필터 · 전체 매물 보기</span>
              <Icon d={ICON.arrow} className="w-3.5 h-3.5 text-[#FB923C]" />
            </Link>
          </div>
        </div>

        {/* 선택 카테고리 특화 검수 기준 스트립 */}
        {!loading && !error && categoryFact && (
          <div className="mt-4 rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] p-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E6EC] flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <ModernApplianceIcon
                name={categoryFact.icon}
                className="w-8 h-8 shrink-0 text-[#141A23]"
              />
              <div className="min-w-0">
                <span className="hb-trim block text-hb-xs font-bold text-[#E8521A]">
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
                  className="inline-flex items-center gap-1.5 font-semibold text-[#334155] tabular-nums"
                >
                  <Icon
                    d={ICON.check}
                    className="w-3.5 h-3.5 text-[#E8521A] shrink-0"
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
            className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4 items-stretch"
            aria-hidden="true"
          >
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white animate-pulse"
              >
                <div className="aspect-square bg-[#F1F3F6]" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-1/3 rounded-full bg-[#F1F3F6]" />
                  <div className="h-5 w-4/5 rounded-lg bg-[#F1F3F6]" />
                  <div className="h-6 w-1/2 rounded-lg bg-[#F1F3F6] pt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-7 rounded-2xl bg-[#F7F8FA] border border-[#E2E6EC] p-8 sm:p-10 text-center">
            <p className="text-hb-base font-bold text-[#141A23]">
              상품 목록을 불러오지 못했습니다.
            </p>
            <p className="mt-1.5 text-hb-sm text-[#64748B]">
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
          <div className="mt-7 flex flex-col items-start justify-between gap-6 rounded-2xl bg-[#F7F8FA] border border-[#E2E6EC] p-6 sm:p-8 sm:flex-row sm:items-center">
            <div>
              <p className="text-hb-lg font-bold text-[#141A23]">
                선택하신 분류의 온라인 등록 매물을 준비 중입니다.
              </p>
              <p className="mt-1 text-hb-sm text-[#4E5968]">
                매장에는 온라인에 미처 올리지 못한 가전과 주방설비가 상시 준비되어 있습니다. 찾으시는 품목을 말씀해 주시면 즉시 재고를 확인해 드립니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              {selectedCategory && selectedCategory.key !== "all" && onResetCategory && (
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
            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4 items-stretch">
              {displayedProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  eager={idx < 2}
                />
              ))}
            </div>

            {/* 하단 더보기 및 전체 갤러리 이동 바 */}
            <div className="mt-10 pt-6 border-t border-[#E2E6EC] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-hb-xs sm:text-hb-sm text-[#64748B]">
                표시 중:{" "}
                <strong className="font-bold text-[#141A23] tabular-nums">
                  {displayedProducts.length}
                </strong>{" "}
                / 전체{" "}
                <strong className="font-bold text-[#141A23] tabular-nums">
                  {filteredProducts.length}
                </strong>
                건
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                {filteredProducts.length > visibleCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 8)}
                    className="hb-btn-outline h-11 px-5 text-hb-sm font-bold cursor-pointer active:scale-[0.96]"
                  >
                    <span>이 화면에서 매물 더보기 (+8)</span>
                    <Icon d={ICON.down} className="w-4 h-4" />
                  </button>
                )}
                <Link
                  href={galleryHref}
                  className="hb-btn-primary h-11 px-6 text-hb-sm font-bold active:scale-[0.96]"
                >
                  <span>전체 판매 제품 갤러리 ({totalSellingCount}건)</span>
                  <Icon d={ICON.arrow} className="w-4 h-4 text-[#FB923C]" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Wrapper>
  );
}
