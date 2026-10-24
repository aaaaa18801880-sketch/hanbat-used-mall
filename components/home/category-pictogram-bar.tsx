// 파일 경로: components/home/category-pictogram-bar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { trackEvent, type InquiryTypeValue } from "../../lib/site";
import { Icon, ICON, SafeImg } from "../../lib/ui";

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
  imageSrc: string;
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
    imageSrc: "/illustrations/picto-fridge.jpg",
    href: "/gallery",
    filterCategory: "전체",
    group: "all",
  },
  {
    key: "aircon",
    label: "에어컨·냉난방",
    subLabel: "벽걸이·스탠드·천장형",
    imageSrc: "/illustrations/picto-aircon.jpg",
    href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
    filterCategory: "에어컨/냉난방기",
    group: "home",
  },
  {
    key: "fridge",
    label: "냉장고",
    subLabel: "양문형·일반·김치",
    imageSrc: "/illustrations/picto-fridge.jpg",
    href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
    filterCategory: "냉장고",
    group: "home",
  },
  {
    key: "washer",
    label: "세탁기·건조기",
    subLabel: "드럼·통돌이·건조",
    imageSrc: "/illustrations/picto-washer.jpg",
    href: "/gallery?category=%EC%84%B8%ED%83%81%EA%B8%B0%2F%EA%B1%B4%EC%A1%B0%EA%B8%B0",
    filterCategory: "세탁기/건조기",
    group: "home",
  },
  {
    key: "small",
    label: "TV·소형가전",
    subLabel: "TV·전자레인지·기타",
    imageSrc: "/illustrations/picto-small.jpg",
    href: "/gallery?category=%EA%B8%B0%ED%83%80",
    filterCategory: "기타",
    group: "home",
  },
  {
    key: "bizFridge",
    label: "업소용 냉장",
    subLabel: "45박스·테이블냉장",
    imageSrc: "/illustrations/picto-biz-fridge.jpg",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EB%83%89%EC%9E%A5",
    filterCategory: "업소용기기",
    filterKeyword: "냉장",
    group: "biz",
  },
  {
    key: "showcase",
    label: "쇼케이스",
    subLabel: "음료·주류·제과",
    imageSrc: "/illustrations/picto-showcase.jpg",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EC%87%BC%EC%BC%80%EC%9D%B4%EC%8A%A4",
    filterCategory: "업소용기기",
    filterKeyword: "쇼케이스",
    group: "biz",
  },
  {
    key: "kitchen",
    label: "업소 주방설비",
    subLabel: "제빙기·세척기·작업대",
    imageSrc: "/illustrations/picto-kitchen.jpg",
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
  return (
    <section
      id="category-section"
      aria-label="취급 품목 탐색 시스템"
      className="bg-white border-b border-[#E5E2DC] py-6 sm:py-8"
    >
      <div className="hb-container">
        {/* 상단 카테고리 탐색 헤더 바 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-[#ECE9E2]">
          <div className="flex items-center gap-3">
            <span className="inline-block h-4 w-1 bg-[#D9531E]" aria-hidden="true" />
            <h2 className="text-hb-base sm:text-hb-lg font-extrabold text-[#0E1A2B] tracking-tight">
              품목별 쇼룸 카탈로그
            </h2>
            <span className="hidden sm:inline text-hb-xs text-[#646E7E]">
              원하시는 품목을 선택하면 아래에서 실시간 전시 매물을 바로 확인하실 수 있습니다
            </span>
          </div>
          <div className="flex items-center gap-3 text-hb-xs font-semibold text-[#646E7E]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#0E1A2B]" />
              가정·원룸 가전
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#D9531E]" />
              식당·카페 업소설비
            </span>
            <Link
              href="/gallery"
              className="ml-auto sm:ml-2 inline-flex items-center gap-1 font-bold text-[#0E1A2B] hover:text-[#D9531E]"
            >
              <span>상세 검색</span>
              <Icon d={ICON.right} className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 8대 쇼룸 카테고리 탭 그리드 (모바일 4열 · 데스크톱 8열 고정으로 스크롤 숨김 없이 한눈에 탐색) */}
        <div
          role="tablist"
          aria-label="품목별 쇼룸 필터"
          className="mt-4 grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5"
        >
          {SHOWROOM_CATEGORIES.map((item) => {
            const isSelected = selectedKey === item.key;
            const count = categoryCounts?.[item.key];
            const isBiz = item.group === "biz";

            const content = (
              <div
                className={`group relative flex flex-col items-center justify-between rounded-lg px-2 py-3 sm:px-3 sm:py-3.5 transition-all duration-150 cursor-pointer h-full ${
                  isSelected
                    ? "bg-[#0E1A2B] text-white shadow-card"
                    : "bg-[#FAF9F7] text-[#0E1A2B] hover:bg-[#F1EFEA]"
                }`}
              >
                {/* 상단 그룹 인디케이터 점 */}
                <span
                  aria-hidden="true"
                  className={`absolute top-2 right-2 h-1.5 w-1.5 rounded-full ${
                    isSelected
                      ? "bg-[#FF8A50]"
                      : isBiz
                      ? "bg-[#D9531E]/60"
                      : "bg-[#0E1A2B]/25"
                  }`}
                />

                {/* 통일된 스튜디오 아이콘 프레임 */}
                <div
                  className={`h-11 w-11 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center p-1 transition-transform duration-200 group-hover:-translate-y-0.5 ${
                    isSelected ? "bg-white" : "bg-white/90"
                  }`}
                >
                  <SafeImg
                    src={item.imageSrc}
                    alt={item.label}
                    eager
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* 카테고리명 및 서브 설명 */}
                <div className="mt-2 text-center min-w-0 w-full">
                  <span
                    className={`block truncate text-hb-xs sm:text-hb-sm font-extrabold tracking-tight ${
                      isSelected
                        ? "text-white"
                        : "text-[#0E1A2B] group-hover:text-[#D9531E]"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`mt-0.5 hidden sm:block truncate text-hb-xs ${
                      isSelected ? "text-white/75" : "text-[#646E7E]"
                    }`}
                  >
                    {typeof count === "number" ? `${count}대 전시` : item.subLabel}
                  </span>
                </div>

                {/* 선택 상태 하단 액센트 바 */}
                <span
                  aria-hidden="true"
                  className={`mt-2 h-0.5 rounded-full transition-all duration-200 ${
                    isSelected
                      ? "w-8 bg-[#FF8A50]"
                      : "w-0 bg-transparent group-hover:w-5 group-hover:bg-[#D9531E]/50"
                  }`}
                />
              </div>
            );

            if (onSelectCategory) {
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    trackEvent("filter_gallery", {
                      category: item.label,
                      location: "top_pictogram_bar",
                    });
                    onSelectCategory(item);
                  }}
                  className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B] rounded-lg min-w-0"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() =>
                  trackEvent("filter_gallery", {
                    category: item.label,
                    location: "top_pictogram_bar",
                  })
                }
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B] rounded-lg min-w-0"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
