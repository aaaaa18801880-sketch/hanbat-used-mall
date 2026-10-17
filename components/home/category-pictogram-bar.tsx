"use client";

import React from "react";
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
}

interface QuickMenuGroup {
  id: string;
  badgeText: string;
  badgeBgClass: string;
  items: QuickMenuItem[];
}

const QUICK_GROUPS: QuickMenuGroup[] = [
  {
    id: "home-appliances",
    badgeText: "무상 A/S + 살균세척",
    badgeBgClass: "bg-[#D9531E] text-white shadow-2xs",
    items: [
      {
        key: "aircon",
        label: "에어컨",
        imageSrc: "/illustrations/picto-aircon.jpg",
        href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
      },
      {
        key: "fridge",
        label: "냉장고",
        imageSrc: "/illustrations/picto-fridge.jpg",
        href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
      },
      {
        key: "washer",
        label: "세탁기",
        imageSrc: "/illustrations/picto-washer.jpg",
        href: "/gallery?category=%EC%84%B8%ED%83%81%EA%B8%B0%2F%EA%B1%B4%EC%A1%B0%EA%B8%B0",
      },
      {
        key: "small",
        label: "소형가전",
        imageSrc: "/illustrations/picto-small.jpg",
        href: "/gallery?category=%EC%A3%BC%EB%B0%A9%2F%EC%86%8C%ED%98%95%EA%B0%80%EC%A0%84",
      },
    ],
  },
  {
    id: "commercial-equip",
    badgeText: "식당·카페 설비",
    badgeBgClass: "bg-[#0E1A2B] text-white shadow-2xs",
    items: [
      {
        key: "bizFridge",
        label: "업소용냉장",
        imageSrc: "/illustrations/picto-biz-fridge.jpg",
        href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EB%83%89%EC%9E%A5",
      },
      {
        key: "showcase",
        label: "쇼케이스",
        imageSrc: "/illustrations/picto-showcase.jpg",
        href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EC%87%BC%EC%BC%80%EC%9D%B4%EC%8A%A4",
      },
      {
        key: "kitchen",
        label: "주방설비",
        imageSrc: "/illustrations/picto-kitchen.jpg",
        href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
      },
    ],
  },
  {
    id: "all-services",
    badgeText: "방문매입 · 원스톱",
    badgeBgClass: "bg-[#475569] text-white shadow-2xs",
    items: [
      {
        key: "sell",
        label: "가전팔기",
        imageSrc: "/illustrations/picto-sell.jpg",
        inquiryType: "내 물건 팔기",
      },
      {
        key: "clearance",
        label: "폐업정리",
        imageSrc: "/illustrations/picto-clearance.jpg",
        href: "/purchase",
      },
      {
        key: "storePkg",
        label: "창업상담",
        imageSrc: "/illustrations/picto-store-pkg.jpg",
        inquiryType: "대량·업소용 상담",
      },
      {
        key: "certified",
        label: "배송후기",
        imageSrc: "/illustrations/picto-certified.jpg",
        href: "#reviews-section",
      },
    ],
  },
];

export function CategoryPictogramBar({
  onSelectInquiry,
}: {
  onSelectInquiry: (type: InquiryTypeValue) => void;
}) {
  const [hoveredKey, setHoveredKey] = React.useState<PictogramKey | null>(null);

  return (
    <section
      id="category-section"
      aria-label="취급 품목 및 주요 서비스 바로가기"
      className="bg-white border-b border-[#E5E2DC] pt-8 pb-7 sm:pt-9 sm:pb-8"
    >
      <div className="hb-container">
        {/* 데스크톱(lg 이상): 4 : 3 : 4 비례 분할로 11개 아이템의 가로폭 균일화 / 모바일·태블릿: 스택 카드 */}
        <div
          className="flex flex-col lg:flex-row gap-6 lg:gap-4 items-stretch"
          onMouseLeave={() => setHoveredKey(null)}
        >
          {QUICK_GROUPS.map((group) => {
            const flexBasisClass =
              group.id === "home-appliances"
                ? "lg:flex-[4]"
                : group.id === "commercial-equip"
                ? "lg:flex-[3]"
                : "lg:flex-[4]";

            const gridColsClass =
              group.items.length === 3 ? "grid-cols-3" : "grid-cols-4";

            return (
              <div
                key={group.id}
                className={`relative rounded-[24px] bg-[#F4F6FA] border border-[#E5E9F2] px-3 sm:px-4 pt-7 pb-4 sm:pb-5 flex flex-col justify-center min-w-0 transition-colors hover:border-[#CFCAC0] ${flexBasisClass}`}
              >
                {/* 상단 좌측 플로팅 캡슐 배지 */}
                <span
                  className={`absolute -top-3.5 left-4 sm:left-5 inline-flex items-center rounded-full px-3 sm:px-3.5 py-1 text-[11.5px] sm:text-[12.5px] font-extrabold tracking-[-0.01em] whitespace-nowrap ${group.badgeBgClass}`}
                >
                  {group.badgeText}
                </span>

                <ul
                  className={`grid ${gridColsClass} gap-1.5 sm:gap-2 items-center`}
                >
                  {group.items.map((item) => {
                    const isHovered = hoveredKey === item.key;
                    const content = (
                      <>
                        {/* 호버 하이라이트 배경 */}
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute inset-0 rounded-2xl border transition-all duration-200 ease-out ${
                            isHovered
                              ? "scale-100 border-[#E5E2DC] bg-white opacity-100 shadow-card"
                              : "scale-95 border-transparent bg-white/0 opacity-0"
                          }`}
                        />
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="h-16 w-16 sm:h-[68px] sm:w-[68px] rounded-2xl bg-white border border-[#E5E9F2] shadow-2xs overflow-hidden flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5">
                            <SafeImg
                              src={item.imageSrc}
                              alt={item.label}
                              eager
                              className="h-full w-full object-contain scale-[1.18] transition-transform duration-300 group-hover:scale-[1.24]"
                            />
                          </div>
                          <span className="mt-2 text-center text-[13px] sm:text-[14.5px] font-extrabold tracking-[-0.02em] text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors whitespace-nowrap">
                            {item.label}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`mt-1 h-1 rounded-full bg-[#D9531E] transition-all duration-200 ease-out ${
                              isHovered ? "w-5 opacity-100" : "w-0 opacity-0"
                            }`}
                          />
                        </div>
                      </>
                    );

                    if (item.inquiryType) {
                      return (
                        <li
                          key={item.key}
                          className="min-w-0"
                          onMouseEnter={() => setHoveredKey(item.key)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              trackEvent("begin_buyback_inquiry", {
                                category: item.label,
                                location: "top_pictogram_bar",
                              });
                              onSelectInquiry(item.inquiryType!);
                            }}
                            className="group relative flex w-full flex-col items-center justify-center py-2 rounded-2xl transition-colors cursor-pointer"
                          >
                            {content}
                          </button>
                        </li>
                      );
                    }

                    return (
                      <li
                        key={item.key}
                        className="min-w-0"
                        onMouseEnter={() => setHoveredKey(item.key)}
                      >
                        <Link
                          href={item.href || "/gallery"}
                          onClick={() =>
                            trackEvent("filter_gallery", {
                              category: item.label,
                              location: "top_pictogram_bar",
                            })
                          }
                          className="group relative flex w-full flex-col items-center justify-center py-2 rounded-2xl transition-colors"
                        >
                          {content}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
