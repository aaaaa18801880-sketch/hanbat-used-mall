// 파일 경로: components/home/category-pictogram-bar.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  trackEvent,
  triggerQuickInquiry,
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
    icon: "all",
    imageSrc: "/illustrations/picto-fridge.jpg",
    href: "/gallery",
    filterCategory: "전체",
    group: "all",
  },
  {
    key: "aircon",
    label: "에어컨·냉난방",
    subLabel: "벽걸이·스탠드·천장형",
    icon: "aircon",
    imageSrc: "/illustrations/picto-aircon.jpg",
    href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
    filterCategory: "에어컨/냉난방기",
    group: "home",
  },
  {
    key: "fridge",
    label: "냉장고·김치냉장",
    subLabel: "양문형·4도어·일반",
    icon: "fridge",
    imageSrc: "/illustrations/picto-fridge.jpg",
    href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
    filterCategory: "냉장고",
    group: "home",
  },
  {
    key: "washer",
    label: "세탁기·건조기",
    subLabel: "드럼·통돌이·워시타워",
    icon: "washer",
    imageSrc: "/illustrations/picto-washer.jpg",
    href: "/gallery?category=%EC%84%B8%ED%83%81%EA%B8%B0%2F%EA%B1%B4%EC%A1%B0%EA%B8%B0",
    filterCategory: "세탁기/건조기",
    group: "home",
  },
  {
    key: "small",
    label: "TV·소형가전",
    subLabel: "TV·전자레인지·기타",
    icon: "small",
    imageSrc: "/illustrations/picto-small.jpg",
    href: "/gallery?category=%EA%B8%B0%ED%83%80",
    filterCategory: "기타",
    group: "home",
  },
  {
    key: "bizFridge",
    label: "업소용 냉장고",
    subLabel: "25·45박스·테이블냉장",
    icon: "biz-fridge",
    imageSrc: "/illustrations/picto-biz-fridge.jpg",
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
    imageSrc: "/illustrations/picto-showcase.jpg",
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
    imageSrc: "/illustrations/picto-kitchen.jpg",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
    filterCategory: "업소용기기",
    group: "biz",
  },
];

const ACTION_BENTO_ITEMS: ReadonlyArray<{
  label: string;
  sub: string;
  icon: ModernIconType;
  inquiryType?: InquiryTypeValue;
  scrollTarget?: string;
}> = [
  {
    label: "가전 방문매입",
    sub: "당일 수거·현금 입금",
    icon: "sell",
    inquiryType: "내 물건 팔기",
  },
  {
    label: "식당·카페 폐업정리",
    sub: "주방설비 일괄 매입·철거",
    icon: "closure",
    inquiryType: "대량·업소용 상담",
  },
  {
    label: "창업 패키지 상담",
    sub: "업종별 맞춤 설비 견적",
    icon: "startup",
    inquiryType: "대량·업소용 상담",
  },
  {
    label: "출고·설치 사례",
    sub: "실제 현장 납품 기록",
    icon: "shield",
    scrollTarget: "reviews-section",
  },
];

export function CategoryPictogramBar({
  selectedKey = "all",
  onSelectCategory,
  categoryCounts,
  onSelectInquiry,
}: {
  selectedKey?: PictogramKey;
  onSelectCategory?: (item: ShowroomCategoryItem) => void;
  categoryCounts?: Partial<Record<PictogramKey, number>>;
  onSelectInquiry?: (type: InquiryTypeValue) => void;
}) {
  const allItem = SHOWROOM_CATEGORIES[0];
  const homeItems = SHOWROOM_CATEGORIES.filter((c) => c.group === "home");
  const bizItems = SHOWROOM_CATEGORIES.filter((c) => c.group === "biz");

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

  const handleActionClick = (action: (typeof ACTION_BENTO_ITEMS)[number]) => {
    if (action.inquiryType) {
      trackEvent("begin_buyback_inquiry", {
        location: "category_pictogram_bar",
      });
      if (onSelectInquiry) {
        onSelectInquiry(action.inquiryType);
      } else {
        triggerQuickInquiry({ type: action.inquiryType });
      }
      return;
    }
    if (action.scrollTarget && typeof document !== "undefined") {
      document
        .getElementById(action.scrollTarget)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="category-section"
      aria-label="취급 품목 및 주요 서비스 바로가기"
      className="border-b border-[#E5E2DC] bg-white py-7 sm:py-10"
    >
      <div className="hb-container">
        {/* 상단 쇼룸 카탈로그 컨트롤 바 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#ECE9E2]">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-block h-4 w-1 rounded-full bg-[#D9531E]"
              aria-hidden="true"
            />
            <h2 className="text-hb-base sm:text-hb-lg font-extrabold text-[#0E1A2B] tracking-tight">
              품목별 쇼룸 카탈로그 &amp; 원스톱 서비스
            </h2>
            <span className="hidden md:inline text-hb-xs text-[#646E7E]">
              품목을 선택하시면 아래에서 실시간 전시 매물을 바로 필터링합니다
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCategoryClick(allItem)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-hb-xs font-extrabold transition-all cursor-pointer ${
                selectedKey === "all"
                  ? "bg-[#0E1A2B] text-white shadow-2xs"
                  : "border border-[#CFCAC0] bg-[#FAF9F7] text-[#0E1A2B] hover:border-[#0E1A2B]"
              }`}
            >
              <span>전체 실매물</span>
              {typeof categoryCounts?.all === "number" && (
                <span className="text-[#FF8A50] tabular-nums">
                  {categoryCounts.all}대
                </span>
              )}
            </button>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1 rounded-full border border-[#E5E2DC] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#0E1A2B] hover:border-[#0E1A2B] hover:text-[#D9531E] transition-colors"
            >
              <span>갤러리 전체보기</span>
              <Icon d={ICON.right} className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 모바일·태블릿·데스크톱 3단 적응형 벤토 그리드 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5 items-stretch">
          {/* 1. 가정·원룸 중고가전 (5컬럼) */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-[#E5E2DC] bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-card">
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#0E1A2B] px-2.5 py-1 text-hb-xs font-extrabold text-white">
                  가정 · 원룸 가전
                </span>
                <span className="text-hb-xs font-bold text-[#3E4756]">
                  분해 고압 살균 · 무상 A/S
                </span>
              </div>
              <Link
                href="/gallery"
                className="text-hb-xs font-bold text-[#D9531E] hover:underline"
              >
                전체보기 →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {homeItems.map((item) => {
                const isSelected = selectedKey === item.key;
                const count = categoryCounts?.[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleCategoryClick(item)}
                    className={`group relative flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 rounded-xl border p-3 sm:py-3.5 sm:px-2 text-left sm:text-center transition-all duration-200 hover:-translate-y-1 cursor-pointer ${
                      isSelected
                        ? "border-[#0E1A2B] bg-[#0E1A2B] text-white shadow-card ring-2 ring-[#D9531E]/20"
                        : "border-[#E5E2DC] bg-white text-[#0E1A2B] shadow-2xs hover:border-[#0E1A2B] hover:shadow-md"
                    }`}
                  >
                    <ModernApplianceIcon
                      name={item.icon}
                      dark={isSelected}
                      className="w-11 h-11 sm:w-12 sm:h-12"
                    />
                    <div className="min-w-0 flex-1 sm:w-full">
                      <strong
                        className={`block text-hb-xs sm:text-hb-sm font-extrabold truncate ${
                          isSelected
                            ? "text-white"
                            : "text-[#0E1A2B] group-hover:text-[#D9531E]"
                        }`}
                      >
                        {item.label}
                      </strong>
                      <span
                        className={`mt-0.5 block text-hb-xs font-medium truncate ${
                          isSelected ? "text-[#FF8A50]" : "text-[#646E7E]"
                        }`}
                      >
                        {typeof count === "number"
                          ? `${count}대 전시`
                          : item.subLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 식당·카페 업소용 설비 (3컬럼 — 다크 네이비 글래스 테마) */}
          <div className="lg:col-span-3 flex flex-col justify-between rounded-2xl border border-[#1E2F48] hb-dark-mesh p-4 sm:p-5 text-white shadow-card">
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <span className="rounded-md bg-[#D9531E] px-2.5 py-1 text-hb-xs font-extrabold text-white">
                식당 · 카페 B2B
              </span>
              <span className="text-hb-xs font-semibold text-white/75">
                전자세금계산서 100%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-2.5">
              {bizItems.map((item) => {
                const isSelected = selectedKey === item.key;
                const count = categoryCounts?.[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleCategoryClick(item)}
                    className={`group flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 rounded-xl border p-3 sm:py-3.5 sm:px-2 text-left sm:text-center backdrop-blur-xs transition-all duration-200 hover:-translate-y-1 cursor-pointer ${
                      isSelected
                        ? "border-[#FF8A50] bg-white/20 shadow-md ring-2 ring-[#FF8A50]/30"
                        : "border-white/15 bg-white/[0.06] hover:border-[#FF8A50] hover:bg-white/[0.12]"
                    }`}
                  >
                    <ModernApplianceIcon
                      name={item.icon}
                      dark
                      className="w-11 h-11 sm:w-12 sm:h-12"
                    />
                    <div className="min-w-0 flex-1 sm:w-full">
                      <strong className="block text-hb-xs font-extrabold text-white group-hover:text-[#FF8A50] truncate">
                        {item.label}
                      </strong>
                      <span className="mt-0.5 block text-hb-xs text-white/70 truncate">
                        {typeof count === "number"
                          ? `${count}대 전시`
                          : item.subLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 방문매입 · 폐업정리 · 창업상담 (4컬럼 — 웜 오렌지 포인트 테마) */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-[#FADCD0] bg-gradient-to-br from-[#FFF8F5] to-[#FFF0E8] p-4 sm:p-5 shadow-card">
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <span className="rounded-md bg-[#D9531E] px-2.5 py-1 text-hb-xs font-extrabold text-white">
                방문매입 · 원스톱
              </span>
              <span className="text-hb-xs font-bold text-[#B5431A]">
                수거 당일 현금 입금
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ACTION_BENTO_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleActionClick(item)}
                  className="group flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 rounded-xl border border-[#FADCD0] bg-white p-3 sm:py-3.5 sm:px-2 text-left sm:text-center shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-[#D9531E] hover:shadow-md cursor-pointer"
                >
                  <ModernApplianceIcon
                    name={item.icon}
                    className="w-11 h-11 sm:w-12 sm:h-12"
                  />
                  <div className="min-w-0 flex-1 sm:w-full">
                    <strong className="block text-hb-xs font-extrabold text-[#0E1A2B] group-hover:text-[#D9531E] truncate">
                      {item.label}
                    </strong>
                    <span className="mt-0.5 block text-hb-xs font-medium text-[#646E7E] truncate">
                      {item.sub}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
