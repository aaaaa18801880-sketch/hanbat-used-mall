"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trackEvent, type InquiryTypeValue } from "../../lib/site";
import { SafeImg } from "../../lib/ui";

export type PictogramKey =
  | "aircon"
  | "fridge"
  | "washer"
  | "small"
  | "bizFridge"
  | "showcase"
  | "kitchen"
  | "sell"
  | "clearance"
  | "storePkg"
  | "certified";

interface QuickMenuItem {
  key: PictogramKey;
  label: string;
  imageSrc: string;
  href?: string;
  inquiryType?: InquiryTypeValue;
  group: "home" | "biz" | "service";
}

const QUICK_MENU_ITEMS: QuickMenuItem[] = [
  // 1. 가정용 가전 (분해 살균세척 & 무상 A/S 보증)
  {
    key: "aircon",
    label: "에어컨",
    imageSrc: "/illustrations/picto-aircon.jpg",
    href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
    group: "home",
  },
  {
    key: "fridge",
    label: "냉장고",
    imageSrc: "/illustrations/picto-fridge.jpg",
    href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
    group: "home",
  },
  {
    key: "washer",
    label: "세탁기",
    imageSrc: "/illustrations/picto-washer.jpg",
    href: "/gallery?category=%EC%84%B8%ED%83%81%EA%B8%B0%2F%EA%B1%B4%EC%A1%B0%EA%B8%B0",
    group: "home",
  },
  {
    key: "small",
    label: "소형가전",
    imageSrc: "/illustrations/picto-small.jpg",
    href: "/gallery?category=%EC%A3%BC%EB%B0%A9%2F%EC%86%8C%ED%98%95%EA%B0%80%EC%A0%84",
    group: "home",
  },
  // 2. 업소용 설비 (식당·카페 전문 검수)
  {
    key: "bizFridge",
    label: "업소용냉장",
    imageSrc: "/illustrations/picto-biz-fridge.jpg",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EB%83%89%EC%9E%A5",
    group: "biz",
  },
  {
    key: "showcase",
    label: "쇼케이스",
    imageSrc: "/illustrations/picto-showcase.jpg",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EC%87%BC%EC%BC%80%EC%9D%B4%EC%8A%A4",
    group: "biz",
  },
  {
    key: "kitchen",
    label: "주방설비",
    imageSrc: "/illustrations/picto-kitchen.jpg",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
    group: "biz",
  },
  // 3. 매입 · 창업 지원 서비스 (원스톱 직영)
  {
    key: "sell",
    label: "가전팔기",
    imageSrc: "/illustrations/picto-sell.jpg",
    inquiryType: "내 물건 팔기",
    group: "service",
  },
  {
    key: "clearance",
    label: "폐업정리",
    imageSrc: "/illustrations/picto-clearance.jpg",
    href: "/purchase",
    group: "service",
  },
  {
    key: "storePkg",
    label: "창업상담",
    imageSrc: "/illustrations/picto-store-pkg.jpg",
    inquiryType: "대량·업소용 상담",
    group: "service",
  },
  {
    key: "certified",
    label: "배송후기",
    imageSrc: "/illustrations/picto-certified.jpg",
    href: "#reviews-section",
    group: "service",
  },
];

export function CategoryPictogramBar({
  onSelectInquiry,
}: {
  onSelectInquiry: (type: InquiryTypeValue) => void;
}) {
  const [hoveredKey, setHoveredKey] = useState<PictogramKey | null>(null);

  return (
    <section
      id="category-section"
      aria-label="취급 품목 및 주요 서비스 바로가기"
      className="bg-white border-b border-[#E5E2DC] py-4 sm:py-5"
    >
      <div className="hb-container">
        {/* 1번 사진 벤치마크: 단일 수평 카테고리 내비게이션 바 */}
        <div
          className="flex items-center justify-between gap-1 sm:gap-1.5 lg:gap-2 overflow-x-auto scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0"
          onMouseLeave={() => setHoveredKey(null)}
        >
          {QUICK_MENU_ITEMS.map((item) => {
            const isHovered = hoveredKey === item.key;
            // 그룹 간 얇은 구분선 (소형가전 뒤, 주방설비 뒤)
            const showDividerAfter =
              item.key === "small" || item.key === "kitchen";

            const itemContent = (
              <div
                className={`group relative flex flex-col items-center justify-center py-2.5 px-2 sm:px-3 rounded-xl transition-all duration-200 cursor-pointer w-[76px] sm:w-[86px] lg:w-full min-w-0 shrink-0 lg:shrink ${
                  isHovered ? "bg-[#F2F4F8] shadow-2xs" : "hover:bg-[#F7F8FA]"
                }`}
              >
                {/* 3D 픽토그램 아이콘 (Image 1 스타일: 단일 플랫 래퍼) */}
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5">
                  <SafeImg
                    src={item.imageSrc}
                    alt={item.label}
                    eager
                    className="h-full w-full object-contain scale-[1.12] transition-transform duration-200 group-hover:scale-[1.20]"
                  />
                </div>

                {/* 카테고리 텍스트 레이블 */}
                <span
                  className={`mt-1.5 text-center text-[12px] sm:text-[13px] font-bold tracking-[-0.02em] whitespace-nowrap transition-colors ${
                    isHovered
                      ? "text-[#D9531E]"
                      : "text-[#2B3340] group-hover:text-[#D9531E]"
                  }`}
                >
                  {item.label}
                </span>

                {/* 활성/호버 시 미세 하단 인디케이터 바 */}
                <span
                  aria-hidden="true"
                  className={`mt-1 h-0.5 rounded-full bg-[#D9531E] transition-all duration-200 ease-out ${
                    isHovered ? "w-4 opacity-100" : "w-0 opacity-0"
                  }`}
                />
              </div>
            );

            return (
              <React.Fragment key={item.key}>
                {item.inquiryType ? (
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("begin_buyback_inquiry", {
                        category: item.label,
                        location: "top_pictogram_bar",
                      });
                      onSelectInquiry(item.inquiryType!);
                    }}
                    onMouseEnter={() => setHoveredKey(item.key)}
                    className="shrink-0 lg:shrink lg:flex-1 flex justify-center focus:outline-hidden"
                  >
                    {itemContent}
                  </button>
                ) : (
                  <Link
                    href={item.href || "/gallery"}
                    onClick={() =>
                      trackEvent("filter_gallery", {
                        category: item.label,
                        location: "top_pictogram_bar",
                      })
                    }
                    onMouseEnter={() => setHoveredKey(item.key)}
                    className="shrink-0 lg:shrink lg:flex-1 flex justify-center focus:outline-hidden"
                  >
                    {itemContent}
                  </Link>
                )}

                {/* 그룹 간 얇은 세로 헤어라인 구분선 (데스크톱에서 자연스럽게 3개 영역 분리) */}
                {showDividerAfter && (
                  <div
                    className="hidden lg:block h-9 w-px bg-[#E5E2DC] self-center shrink-0 mx-1"
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
