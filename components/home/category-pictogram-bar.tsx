// 파일 경로: components/home/category-pictogram-bar.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  trackEvent,
  type InquiryTypeValue,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";
import {
  ModernApplianceIcon,
  type ModernIconType,
} from "../ui/modern-icons";

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
    subLabel: "전 품목 보기",
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
    href: "/gallery?category=%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
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
    subLabel: "드럼·통돌이·워시타워",
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
    subLabel: "25·45박스·테이블냉장",
    icon: "biz-fridge",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EB%83%89%EC%9E%A5",
    filterCategory: "업소용기기",
    filterKeyword: "냉장",
    group: "biz",
  },
  {
    key: "showcase",
    label: "음료·주류 쇼케이스",
    subLabel: "음료·주류·제과",
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSelectInquiry,
}: {
  selectedKey?: PictogramKey;
  onSelectCategory?: (item: ShowroomCategoryItem) => void;
  categoryCounts?: Partial<Record<PictogramKey, number>>;
  onSelectInquiry?: (type: InquiryTypeValue) => void;
}) {
  const allItem = SHOWROOM_CATEGORIES[0];

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
      className="bg-white pt-6 pb-3 sm:pt-8"
    >
      <div className="hb-container">
        {/* 상단 쇼룸 카탈로그 컨트롤 바 */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-block h-4 w-1.5 rounded-full bg-gradient-to-b from-[#E8521A] to-[#FF6B35] shadow-xs"
              aria-hidden="true"
            />
            <h2 className="text-hb-base sm:text-hb-lg font-bold text-[#141A23] tracking-[-0.02em]">
              품목별 쇼룸 카탈로그
            </h2>
            <div className="hidden sm:inline-flex items-center gap-1.5 text-hb-xs font-medium text-[#64748B] pl-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#E8521A]/70" aria-hidden="true" />
              <span>품목을 선택하면 아래 전시장 매물이 즉시 필터링됩니다</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCategoryClick(allItem)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-hb-xs font-bold transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                selectedKey === "all"
                  ? "bg-[#141A23] text-white shadow-xs ring-1 ring-[#141A23]"
                  : "border border-[#E2E6EC] bg-white text-[#475569] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] hover:text-[#141A23]"
              }`}
            >
              <span>전체 실매물</span>
              {typeof categoryCounts?.all === "number" && (
                <span
                  className={`tabular-nums font-bold ${
                    selectedKey === "all" ? "text-[#FF8A50]" : "text-[#E8521A]"
                  }`}
                >
                  {categoryCounts.all}대
                </span>
              )}
            </button>
            <Link
              href="/gallery"
              className="group inline-flex items-center gap-1 rounded-full border border-[#E2E6EC] bg-white px-3.5 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-[#F8FAFC] active:scale-[0.96] transition-all duration-150"
            >
              <span>갤러리 전체보기</span>
              <Icon
                d={ICON.right}
                className="w-3.5 h-3.5 text-[#E8521A] transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>

        {/* 전 품목 쇼룸 카탈로그 독 (8열 벤토 컨트롤 타일 그리드) */}
        <div className="rounded-2xl border border-[#E2E6EC] bg-[#F8FAFC] p-2 sm:p-2.5 shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
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
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-xl p-3 sm:p-3.5 text-left transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] cursor-pointer ${
                    isSelected
                      ? "bg-[#141A23] text-white shadow-card ring-1 ring-[#141A23]"
                      : "border border-[#E2E6EC] bg-white text-[#141A23] shadow-2xs hover:border-[#CBD5E1] hover:shadow-card hover:-translate-y-0.5"
                  }`}
                >
                  {/* 상단 행: 좌측 정밀 아이콘 + 우측 B2B/실시간 대수 배지 */}
                  <div className="flex items-start justify-between gap-1.5 w-full">
                    <ModernApplianceIcon
                      name={item.icon}
                      dark={isSelected}
                      className="w-9 h-9 sm:w-10 sm:h-10 -ml-0.5 transition-transform duration-150 group-hover:scale-105"
                    />
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isBiz ? (
                        <span
                          className={`rounded-md px-1.5 py-0.5 font-mono text-hb-xs font-bold leading-none transition-colors duration-150 ${
                            isSelected
                              ? "bg-white/15 text-[#FF8A50] ring-1 ring-white/20"
                              : "bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7]"
                          }`}
                        >
                          B2B
                        </span>
                      ) : (
                        <span
                          className={`rounded-md px-1.5 py-0.5 font-mono text-hb-xs font-semibold leading-none tabular-nums transition-colors duration-150 ${
                            isSelected
                              ? "bg-white/15 text-white ring-1 ring-white/20"
                              : "bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B]"
                          }`}
                        >
                          {typeof count === "number" ? `${count}대` : "쇼룸"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 하단 행: 품목 타이틀 + 세부 서브라벨/전시 대수 */}
                  <div className="mt-2.5 min-w-0 w-full">
                    <strong
                      className={`block text-hb-xs sm:text-hb-sm font-bold tracking-[-0.015em] truncate transition-colors duration-150 ${
                        isSelected
                          ? "text-white"
                          : "text-[#141A23] group-hover:text-[#E8521A]"
                      }`}
                    >
                      {item.label}
                    </strong>
                    <span
                      className={`mt-0.5 block text-hb-xs font-medium truncate tabular-nums transition-colors duration-150 ${
                        isSelected
                          ? "text-[#FF8A50]"
                          : isBiz && typeof count === "number"
                          ? "text-[#0284C7] font-semibold"
                          : "text-[#64748B]"
                      }`}
                    >
                      {isBiz && typeof count === "number"
                        ? `${count}대 전시 · ${item.subLabel}`
                        : item.subLabel}
                    </span>
                  </div>

                  {/* 활성 상태 하단 시그널 오렌지 인디케이터 바 (Zero CLS, 라운드 일체형) */}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-1 bg-[#E8521A] transition-all duration-150 ${
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
    </section>
  );
}
