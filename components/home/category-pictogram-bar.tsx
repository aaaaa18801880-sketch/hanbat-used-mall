"use client";

import React from "react";
import Link from "next/link";
import { trackEvent } from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";
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
    subLabel: "양문형·4도어·일반",
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
    subLabel: "제빙기·세척기·작업대",
    icon: "kitchen",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
    filterCategory: "업소용기기",
    group: "biz",
  },
];

export function CategoryPictogramBar({
  selectedKey = "all",
  onSelectCategory,
  categoryCounts,
}: {
  selectedKey?: PictogramKey;
  onSelectCategory?: (item: ShowroomCategoryItem) => void;
  categoryCounts?: Partial<Record<PictogramKey, number>>;
}) {
  const handleCategoryClick = (item: ShowroomCategoryItem) => {
    trackEvent("filter_gallery", {
      category: item.label,
      location: "top_pictogram_bar",
    });
    if (onSelectCategory) {
      onSelectCategory(item);
      if (typeof document !== "undefined") {
        document
          .getElementById("featured-products-section")
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  return (
    <section
      id="category-section"
      aria-label="취급 품목 및 주요 서비스 바로가기"
      className="bg-white pt-8 pb-5 sm:pt-10 sm:pb-6"
    >
      <div className="hb-container">
        {/* 상단 쇼룸 카탈로그 컨트롤 바 */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-5">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h2 className="text-hb-lg sm:text-hb-xl font-bold text-[#141A23] tracking-[-0.02em]">
              품목별 쇼룸 카탈로그
            </h2>
            {typeof categoryCounts?.all === "number" && (
              <span className="text-hb-xs sm:text-hb-sm font-semibold text-[#64748B] tabular-nums">
                총 {categoryCounts.all}대 · 품목 선택 시 아래 매물 필터링
              </span>
            )}
          </div>

          <Link
            href="/gallery"
            className="group inline-flex items-center gap-1.5 rounded-xl border border-[#CBD2DC] bg-white px-3.5 py-2 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-[#F7F8FA] active:scale-[0.96] transition-[border-color,background-color,transform] duration-150"
          >
            <span>갤러리 전체보기</span>
            <Icon
              d={ICON.right}
              className="w-3.5 h-3.5 text-[#E8521A] transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* 전 품목 쇼룸 카탈로그 (2색 중립 표면 위계) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5 sm:gap-3">
          {SHOWROOM_CATEGORIES.map((item) => {
            const isSelected = selectedKey === item.key;
            const count = categoryCounts?.[item.key];
            const isBiz = item.group === "biz";

            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleCategoryClick(item)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-xl p-3.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] cursor-pointer ${
                  isSelected
                    ? "bg-[#141A23] text-white shadow-card ring-1 ring-[#141A23]"
                    : "border border-[#E2E6EC] bg-white text-[#141A23] shadow-2xs hover:border-[#94A3B8] hover:shadow-card hover:-translate-y-0.5"
                }`}
              >
                  {/* 상단 행: 아이콘 + 간결한 대수 표기 */}
                  <div className="flex items-start justify-between gap-1.5 w-full">
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-xl border transition-colors duration-150 shrink-0 ${
                        isSelected
                          ? "bg-white/10 border-white/15"
                          : "bg-[#F7F8FA] border-[#E2E6EC] group-hover:bg-[#F1F3F6]"
                      }`}
                    >
                      <ModernApplianceIcon
                        name={item.icon}
                        dark={isSelected}
                        className="w-7 h-7"
                      />
                    </div>

                    <span
                      className={`font-mono text-hb-xs font-bold leading-none tabular-nums shrink-0 pt-1 ${
                        isSelected
                          ? "text-[#FF8A50]"
                          : isBiz
                          ? "text-[#E8521A]"
                          : "text-[#64748B]"
                      }`}
                    >
                      {typeof count === "number"
                        ? `${count}대`
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
                      {isBiz ? `업소 · ${item.subLabel}` : item.subLabel}
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
    </section>
  );
}
