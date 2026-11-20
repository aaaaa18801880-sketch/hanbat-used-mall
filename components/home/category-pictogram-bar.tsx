"use client";

import React from "react";
import Link from "next/link";
import { trackEvent, normalizeProductCategory } from "../../lib/site";
import { Icon, ICON } from "../../lib/icons";
import { ModernApplianceIcon, type ModernIconType } from "../ui/modern-icons";

export type PictogramKey =
  | "all"
  | "aircon"
  | "fridge"
  | "washer"
  | "small"
  | "bizFridge"
  | "showcase"
  | "kitchen";

export interface ShowroomCategoryItem {
  key: PictogramKey;
  label: string;
  subLabel: string;
  icon: ModernIconType;
  href: string;
  filterCategory: string;
  filterKeyword?: string;
  group: "all" | "home" | "biz";
}

export const SHOWROOM_CATEGORIES: ShowroomCategoryItem[] = [
  {
    key: "all",
    label: "전체 실매물",
    subLabel: "전 품목 한눈에",
    icon: "all",
    href: "/gallery",
    filterCategory: "전체",
    group: "all",
  },
  {
    key: "aircon",
    label: "에어컨·냉난방",
    subLabel: "벽걸이·스탠드·천장형",
    icon: "aircon",
    href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
    filterCategory: "에어컨/냉난방기",
    group: "home",
  },
  {
    key: "fridge",
    label: "냉장고·김치냉장",
    subLabel: "양문·4도어·김치",
    icon: "fridge",
    href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
    filterCategory: "냉장고",
    group: "home",
  },
  {
    key: "washer",
    label: "세탁기·건조기",
    subLabel: "드럼·통돌이·건조기",
    icon: "washer",
    href: "/gallery?category=%EC%84%B8%ED%83%81%EA%B8%B0%2F%EA%B1%B4%EC%A1%B0%EA%B8%B0",
    filterCategory: "세탁기/건조기",
    group: "home",
  },
  {
    key: "small",
    label: "TV·소형가전",
    subLabel: "TV·전자레인지·기타",
    icon: "small",
    href: "/gallery?category=%EA%B8%B0%ED%83%80",
    filterCategory: "기타",
    group: "home",
  },
  {
    key: "bizFridge",
    label: "업소용 냉장고",
    subLabel: "25·45박스·테이블",
    icon: "biz-fridge",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EB%83%89%EC%9E%A5",
    filterCategory: "업소용기기",
    filterKeyword: "냉장",
    group: "biz",
  },
  {
    key: "showcase",
    label: "음료·주류 쇼케이스",
    subLabel: "음료·주류·디저트",
    icon: "showcase",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EC%87%BC%EC%BC%80%EC%9D%B4%EC%8A%A4",
    filterCategory: "업소용기기",
    filterKeyword: "쇼케이스",
    group: "biz",
  },
  {
    key: "kitchen",
    label: "제빙기·주방설비",
    subLabel: "제빙기·세척기·스텐",
    icon: "kitchen",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EC%A0%9C%EB%B9%99%EA%B8%B0",
    filterCategory: "업소용기기",
    group: "biz",
  },
];

/**
 * 쇼룸 카테고리별 상호 배타(1:1) 매칭 SSOT
 * — 업소용기기 세부 3분류(업소용 냉장고 / 쇼케이스 / 제빙기·주방설비)가 겹치지 않도록 분리해
 *   세부 카테고리 합계가 항상 전체 매물 건수(all)와 일치하도록 보장합니다.
 */
export function matchesShowroomCategory(
  product: {
    category?: string | null;
    title?: string | null;
    description?: string | null;
    commercial_hint?: "showcase" | "bizFridge" | "kitchen" | null;
  },
  catItem: ShowroomCategoryItem
): boolean {
  if (catItem.key === "all") return true;
  if (normalizeProductCategory(product.category) !== catItem.filterCategory) {
    return false;
  }

  if (catItem.filterCategory === "업소용기기") {
    if (product.commercial_hint) {
      return catItem.key === product.commercial_hint;
    }
    const hay = `${product.title || ""} ${product.description || ""}`.toLowerCase();
    const isShowcase = hay.includes("쇼케이스");
    const isBizFridge = (hay.includes("냉장") || hay.includes("냉동")) && !isShowcase;

    if (catItem.key === "showcase") return isShowcase;
    if (catItem.key === "bizFridge") return isBizFridge;
    if (catItem.key === "kitchen") return !isShowcase && !isBizFridge;
  }

  if (catItem.filterKeyword) {
    const hay = `${product.title || ""} ${product.description || ""}`.toLowerCase();
    return hay.includes(catItem.filterKeyword.toLowerCase());
  }

  return true;
}

export function CategoryPictogramBar({
  selectedKey = "all",
  onSelectCategory,
  categoryCounts,
  embedded = false,
}: {
  selectedKey?: PictogramKey;
  onSelectCategory?: (item: ShowroomCategoryItem) => void;
  categoryCounts?: Partial<Record<PictogramKey, number>>;
  embedded?: boolean;
}) {
  const handleCategoryClick = (item: ShowroomCategoryItem) => {
    trackEvent("filter_gallery", {
      category: item.label,
      location: "top_pictogram_bar",
    });
    if (onSelectCategory) {
      onSelectCategory(item);
      document
        .getElementById("featured-products-section")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const selectedItem =
    SHOWROOM_CATEGORIES.find((c) => c.key === selectedKey) ||
    SHOWROOM_CATEGORIES[0];
  const selectedCount =
    typeof categoryCounts?.[selectedItem.key] === "number"
      ? categoryCounts[selectedItem.key]
      : categoryCounts?.all;
  const cardViewHref = selectedItem.href || "/gallery";
  const tableViewHref = cardViewHref.includes("?")
    ? `${cardViewHref}&view=table`
    : `${cardViewHref}?view=table`;

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      id="category-section"
      aria-label="취급 품목 및 주요 서비스 바로가기"
      className={embedded ? "bg-white pt-7 pb-3 sm:pt-9 sm:pb-4" : "bg-white pt-8 pb-5 sm:pt-10 sm:pb-6"}
    >
      <div className="hb-container">
        {/* 상단 쇼룸 카탈로그 단일 통합 컨트롤 바 */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2
              id="featured-heading"
              className="text-hb-xl sm:text-hb-2xl font-bold text-[#141A23] tracking-[-0.025em]"
            >
              {selectedItem.key === "all"
                ? "품목별 쇼룸 카탈로그"
                : `${selectedItem.label} 전시 매물`}
            </h2>
            {typeof selectedCount === "number" && (
              <span className="rounded-md bg-[#F1F3F6] px-2.5 py-0.5 font-mono text-hb-xs sm:text-hb-sm font-bold text-[#141A23] tabular-nums">
                {selectedCount}건 전시중
              </span>
            )}
            {selectedItem.key !== "all" && onSelectCategory && (
              <button
                type="button"
                onClick={() => onSelectCategory(SHOWROOM_CATEGORIES[0])}
                className="min-h-[36px] rounded-xl border border-[#CBD2DC] bg-white px-3 py-1 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-[#F7F8FA] active:scale-[0.96] transition-[border-color,background-color,transform] duration-150 cursor-pointer"
              >
                전체 품목 보기
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={cardViewHref}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#141A23] px-3.5 py-2 text-hb-xs font-bold text-white shadow-2xs hover:bg-[#1E2736] active:scale-[0.96] transition-[background-color,transform] duration-150"
            >
              <Icon d={ICON.grid} className="w-3.5 h-3.5 text-[#FF8A50]" />
              <span>카드형 갤러리</span>
            </Link>
            <Link
              href={tableViewHref}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#CBD2DC] bg-white px-3.5 py-2 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-[#F7F8FA] active:scale-[0.96] transition-[border-color,background-color,transform] duration-150"
            >
              <Icon d={ICON.list} className="w-3.5 h-3.5 text-[#C84312]" />
              <span>스펙 일람표 보기</span>
            </Link>
          </div>
        </div>

        {/* 전 품목 쇼룸 카탈로그 트레이 */}
        <div className="rounded-2xl border border-[#E2E6EC] bg-[#F7F8FA] p-2.5 sm:p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-2.5">
            {SHOWROOM_CATEGORIES.map((item) => {
              const isSelected = selectedKey === item.key;
              const count = categoryCounts?.[item.key];
              const isBiz = item.group === "biz";
              const isCoolIcon =
                item.key === "aircon" ||
                item.key === "fridge" ||
                item.key === "showcase";
              const isCleanIcon =
                item.key === "washer" || item.key === "kitchen";

              const iconBoxTone = isSelected
                ? "bg-white/10 border-white/15"
                : isCoolIcon
                ? "bg-[#F0F9FF] border-[#BAE6FD] group-hover:bg-[#E0F2FE]"
                : isCleanIcon
                ? "bg-[#F0FDFA] border-[#99F6E4] group-hover:bg-[#CCFBF1]"
                : "bg-[#FFF7ED] border-[#FED7AA] group-hover:bg-[#FFEDD5]";

              const countBadgeTone = isSelected
                ? "bg-white/15 text-[#FF8A50]"
                : isBiz
                ? "bg-[#FFF4EE] text-[#C84312] border border-[#FED7AA]"
                : "bg-[#F1F3F6] text-[#334155]";

              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleCategoryClick(item)}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-xl p-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] cursor-pointer ${
                    isSelected
                      ? "bg-[#141A23] text-white shadow-card ring-1 ring-[#141A23]"
                      : "border border-[#E2E6EC] bg-white text-[#141A23] shadow-2xs hover:border-[#94A3B8] hover:shadow-card hover:-translate-y-0.5"
                  }`}
                >
                  {/* 상단 행: 틴트 아이콘 웰 + 캡슐형 대수 표기 */}
                  <div className="flex items-start justify-between gap-1.5 w-full">
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-xl border transition-colors duration-150 shrink-0 ${iconBoxTone}`}
                    >
                      <ModernApplianceIcon
                        name={item.icon}
                        dark={isSelected}
                        className="w-7 h-7"
                      />
                    </div>

                    <span
                      className={`hb-trim rounded-full px-2 py-0.5 font-mono text-hb-xs font-bold leading-none tabular-nums shrink-0 ${countBadgeTone}`}
                    >
                      {typeof count === "number"
                        ? `${count}건`
                        : isBiz
                        ? "업소"
                        : "전체"}
                    </span>
                  </div>

                  {/* 하단 행: 품목명 + 서브라벨 */}
                  <div className="mt-3 min-w-0 w-full">
                    <strong
                      className={`block text-hb-sm font-bold tracking-tight truncate transition-colors duration-150 ${
                        isSelected
                          ? "text-white"
                          : "text-[#141A23] group-hover:text-[#E8521A]"
                      }`}
                    >
                      {item.label}
                    </strong>
                    <span
                      className={`mt-0.5 block text-hb-xs font-medium truncate transition-colors duration-150 ${
                        isSelected ? "text-white/75" : "text-[#64748B]"
                      }`}
                    >
                      {item.subLabel}
                    </span>
                  </div>

                  {/* 활성 상태 하단 시그널 오렌지 바 (Zero CLS) */}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-1 bg-[#E8521A] transition-opacity duration-150 ${
                      isSelected ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
