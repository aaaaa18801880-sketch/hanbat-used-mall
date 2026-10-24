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
  | "kitchen";

interface QuickMenuItem {
  key: PictogramKey;
  label: string;
  imageSrc: string;
  href: string;
  group: "home" | "biz";
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
    href: "/gallery?category=%EA%B8%B0%ED%83%80",
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
];

export function CategoryPictogramBar({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSelectInquiry,
}: {
  onSelectInquiry?: (type: InquiryTypeValue) => void;
}) {
  const [hoveredKey, setHoveredKey] = useState<PictogramKey | null>(null);

  return (
    <section
      id="category-section"
      aria-label="취급 품목 바로가기"
      className="bg-white border-b border-[#E5E2DC] py-4 sm:py-5"
    >
      <div className="hb-container">
        <div
          className="flex items-center justify-start lg:justify-between gap-2 sm:gap-3 lg:gap-4 overflow-x-auto scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0"
          onMouseLeave={() => setHoveredKey(null)}
        >
          {QUICK_MENU_ITEMS.map((item) => {
            const isHovered = hoveredKey === item.key;
            const showDividerAfter = item.key === "small";

            return (
              <React.Fragment key={item.key}>
                <Link
                  href={item.href}
                  onClick={() =>
                    trackEvent("filter_gallery", {
                      category: item.label,
                      location: "top_pictogram_bar",
                    })
                  }
                  onMouseEnter={() => setHoveredKey(item.key)}
                  className="shrink-0 lg:shrink lg:flex-1 flex justify-center focus:outline-none"
                >
                  <div
                    className={`group relative flex flex-col items-center justify-center py-2.5 px-2.5 sm:px-3.5 rounded-xl transition-all duration-200 cursor-pointer w-[84px] sm:w-[96px] lg:w-full min-w-0 shrink-0 lg:shrink ${
                      isHovered
                        ? "bg-[#F2F4F8] shadow-2xs"
                        : "hover:bg-[#F7F8FA]"
                    }`}
                  >
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5">
                      <SafeImg
                        src={item.imageSrc}
                        alt={item.label}
                        eager
                        className="h-full w-full object-contain scale-[1.12] transition-transform duration-200 group-hover:scale-[1.20]"
                      />
                    </div>

                    <span
                      className={`mt-1.5 text-center text-hb-xs sm:text-hb-sm font-bold tracking-[-0.02em] whitespace-nowrap transition-colors ${
                        isHovered
                          ? "text-[#D9531E]"
                          : "text-[#2B3340] group-hover:text-[#D9531E]"
                      }`}
                    >
                      {item.label}
                    </span>

                    <span
                      aria-hidden="true"
                      className={`mt-1 h-0.5 rounded-full bg-[#D9531E] transition-all duration-200 ease-out ${
                        isHovered ? "w-4 opacity-100" : "w-0 opacity-0"
                      }`}
                    />
                  </div>
                </Link>

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
