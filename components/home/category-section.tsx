"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon, ICON, SafeImg, SectionHeading } from "../../lib/ui";

type CategoryCardItem = {
  key: string;
  title: string;
  dbCategory: string;
  group: "home" | "biz";
  groupLabel: string;
  summary: string;
  items: string;
  image: string;
};

const CATEGORY_CARDS: CategoryCardItem[] = [
  {
    key: "aircon",
    title: "에어컨 · 냉난방기",
    dbCategory: "에어컨/냉난방기",
    group: "home",
    groupLabel: "가정·상가 겸용",
    summary: "벽걸이 · 스탠드 · 2in1 · 중대형 인버터 냉난방기",
    items: "평형별 냉난방 용량 및 배관·설치 환경 맞춤 상담",
    image: "/images/cat-ac.png",
  },
  {
    key: "fridge",
    title: "냉장고 · 김치냉장고",
    dbCategory: "냉장고",
    group: "home",
    groupLabel: "가정용 가전",
    summary: "양문형 · 4도어 · 일반형 · 스탠드/뚜껑형 김치냉장고",
    items: "원룸 소형부터 대용량 패밀리 사이즈까지 세척 완료",
    image: "/images/cat-fridge.png",
  },
  {
    key: "washer",
    title: "세탁기 · 의류건조기",
    dbCategory: "세탁기/건조기",
    group: "home",
    groupLabel: "가정용 가전",
    summary: "드럼세탁기 · 통돌이 · 워시타워 · 대용량 건조기",
    items: "분해 세척 및 탈수·건조 작동 테스트 완료 제품",
    image: "/images/cat-washer.png",
  },
  {
    key: "commercial-fridge",
    title: "업소용 냉장고 · 쇼케이스",
    dbCategory: "업소용기기",
    group: "biz",
    groupLabel: "업소용 설비",
    summary: "25·30·45박스 수직냉장고 · 테이블냉장고 · 음료/주류 쇼케이스",
    items: "식당·카페·마트 매장 규격에 맞춘 냉장·냉동 설비",
    image: "/images/cat-commercial.png",
  },
  {
    key: "commercial-kitchen",
    title: "제빙기 · 식기세척기 · 주방기기",
    dbCategory: "업소용기기",
    group: "biz",
    groupLabel: "업소용 설비",
    summary: "업소용 제빙기 · 식기세척기 · 간택기 · 튀김기 · 스텐 작업대",
    items: "창업 세트 구성 및 매장 확장·정리 일괄 견적 지원",
    image: "/images/cat-kitchen.png",
  },
];

export function CategorySection() {
  const [filter, setFilter] = useState<"all" | "home" | "biz">("all");

  const filtered = CATEGORY_CARDS.filter(
    (c) => filter === "all" || c.group === filter
  );

  return (
    <section
      id="category-section"
      aria-labelledby="category-heading"
      className="border-b border-[#E4E0D8] bg-[#F6F5F2] py-16 sm:py-20 lg:py-24"
    >
      <div className="hb-container">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Product Categories"
            title={<span id="category-heading">취급 품목 카테고리</span>}
            desc="찾으시는 품목을 선택하시면 현재 판매 중인 실매물 갤러리로 이동합니다."
          />

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex rounded-md border border-[#DDD9D1] bg-white p-1"
              role="tablist"
              aria-label="품목 구분 필터"
            >
              {(
                [
                  { k: "all", label: "전체 품목" },
                  { k: "home", label: "가정용 가전" },
                  { k: "biz", label: "업소용 기기" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.k}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.k}
                  onClick={() => setFilter(tab.k)}
                  className={`h-9 rounded px-4 text-[13.5px] font-semibold transition-colors ${
                    filter === tab.k
                      ? "bg-[#0E1A2B] text-white"
                      : "text-[#4B5260] hover:text-[#0E1A2B]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Link
              href="/gallery?category=기타"
              className="inline-flex h-11 items-center gap-1.5 rounded-md border border-[#DDD9D1] bg-white px-4 text-[13.5px] font-semibold text-[#0E1A2B] hover:border-[#0E1A2B] transition-colors"
            >
              <span>기타 가전 보기</span>
              <Icon d={ICON.right} className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {filtered.map((cat) => (
            <li key={cat.key} className="flex">
              <Link
                href={`/gallery?category=${encodeURIComponent(cat.dbCategory)}`}
                className="group flex w-full flex-col overflow-hidden rounded-md border border-[#E4E0D8] bg-white transition-all duration-200 hover:border-[#0E1A2B]/50 hover:shadow-card"
              >
                <div className="relative aspect-[4/3] sm:aspect-[4/5] w-full overflow-hidden bg-[#EFECE6]">
                  <SafeImg
                    src={cat.image}
                    alt={`${cat.title} 대표 이미지`}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-3 top-3 rounded-sm bg-white/95 px-2 py-0.5 text-[11px] font-bold text-[#0E1A2B] shadow-2xs">
                    {cat.groupLabel}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="text-[16px] font-bold text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors sm:text-[17px]">
                    {cat.title}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] font-medium text-[#4B5260] leading-snug">
                    {cat.summary}
                  </p>
                  <p className="mt-2 text-[12.5px] text-[#6B7280] leading-relaxed">
                    {cat.items}
                  </p>

                  <div className="mt-auto pt-4 flex items-center justify-between text-[13px] font-bold text-[#0E1A2B] group-hover:text-[#D9531E]">
                    <span>매물 보러가기</span>
                    <Icon
                      d={ICON.arrow}
                      className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
