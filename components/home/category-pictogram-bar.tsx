"use client";

import React from "react";
import Link from "next/link";
import { trackEvent, type InquiryTypeValue } from "../../lib/site";
import { Icon, ICON, SectionHeading } from "../../lib/ui";

export type PictogramKey =
  | "aircon"
  | "fridge"
  | "washer"
  | "biz"
  | "small"
  | "all";

/**
 * 프리미엄 가전 쇼룸 톤앤매너에 맞춘 고정밀 입체형 가전 벡터 아이콘 (6종)
 */
function CategoryVectorIcon({ type }: { type: PictogramKey }) {
  switch (type) {
    case "aircon":
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          className="h-14 w-14 shrink-0"
          aria-hidden="true"
        >
          {/* 하단 그림자 */}
          <ellipse cx="32" cy="56" rx="20" ry="2.5" fill="#0E1A2B" fillOpacity="0.08" />
          {/* 벽걸이 에어컨 본체 */}
          <rect
            x="6"
            y="12"
            width="52"
            height="22"
            rx="5"
            fill="#FFFFFF"
            stroke="#0E1A2B"
            strokeWidth="2.2"
          />
          {/* 상단 입체 베젤 하이라이트 */}
          <path
            d="M11 16H53"
            stroke="#E5E2DC"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* 우측 디지털 온도 표시창 */}
          <rect x="42" y="18.5" width="9" height="4.5" rx="1.5" fill="#0E1A2B" />
          <circle cx="45" cy="20.75" r="1" fill="#38BDF8" />
          <circle cx="48.2" cy="20.75" r="1" fill="#D9531E" />
          {/* 하단 토출구 루버(날개) */}
          <path
            d="M8 27.5H56"
            stroke="#0E1A2B"
            strokeWidth="1.8"
          />
          <rect
            x="11"
            y="29.5"
            width="42"
            height="2.5"
            rx="1"
            fill="#DCE6F2"
          />
          {/* 냉기류 클린 라인 */}
          <path
            d="M19 39C19 43.5 15.5 46 15.5 50.5"
            stroke="#0284C7"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M32 39C32 44.5 29.5 47.5 29.5 52"
            stroke="#D9531E"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M45 39C45 43.5 48.5 46 48.5 50.5"
            stroke="#0284C7"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "fridge":
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          className="h-14 w-14 shrink-0"
          aria-hidden="true"
        >
          <ellipse cx="32" cy="58" rx="17" ry="2.5" fill="#0E1A2B" fillOpacity="0.08" />
          {/* 4도어 양문형 냉장고 외곽 프레임 */}
          <rect
            x="14"
            y="7"
            width="36"
            height="48"
            rx="4"
            fill="#FFFFFF"
            stroke="#0E1A2B"
            strokeWidth="2.2"
          />
          {/* 좌상단 비스포크 톤 패널 */}
          <path
            d="M15.2 11C15.2 9.45 16.45 8.2 18 8.2H31V31H15.2V11Z"
            fill="#F3F5F8"
          />
          {/* 하단 메탈릭 패널 */}
          <path
            d="M15.2 33H48.8V51C48.8 52.55 47.55 53.8 46 53.8H18C16.45 53.8 15.2 52.55 15.2 51V33Z"
            fill="#FAF9F7"
          />
          {/* 가로·세로 도어 분할선 */}
          <line x1="32" y1="8" x2="32" y2="54" stroke="#0E1A2B" strokeWidth="2" />
          <line x1="15" y1="32" x2="49" y2="32" stroke="#0E1A2B" strokeWidth="2.2" />
          {/* 중앙 히든 포켓 핸들 그루브 */}
          <rect x="15" y="30.2" width="34" height="3.6" fill="#0E1A2B" />
          {/* 디스펜서 / 컨트롤 패널 */}
          <rect
            x="20"
            y="15"
            width="6"
            height="9"
            rx="1.5"
            fill="#0E1A2B"
          />
          <rect x="21.5" y="17" width="3" height="2" rx="0.5" fill="#D9531E" />
          {/* 도어 핸들 포인트 */}
          <line x1="29" y1="15" x2="29" y2="25" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="35" y1="15" x2="35" y2="25" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case "washer":
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          className="h-14 w-14 shrink-0"
          aria-hidden="true"
        >
          <ellipse cx="32" cy="58" rx="18" ry="2.5" fill="#0E1A2B" fillOpacity="0.08" />
          {/* 드럼세탁기 본체 */}
          <rect
            x="13"
            y="8"
            width="38"
            height="47"
            rx="4.5"
            fill="#FFFFFF"
            stroke="#0E1A2B"
            strokeWidth="2.2"
          />
          {/* 상단 컨트롤 조작부 */}
          <path
            d="M14.2 12.5C14.2 10.68 15.68 9.2 17.5 9.2H46.5C48.32 9.2 49.8 10.68 49.8 12.5V18H14.2V12.5Z"
            fill="#F3F5F8"
          />
          <line x1="14" y1="18" x2="50" y2="18" stroke="#0E1A2B" strokeWidth="1.8" />
          {/* 세제 투입구 & 다이얼 & LED */}
          <rect x="18" y="12.2" width="8" height="3.2" rx="1" fill="#0E1A2B" />
          <circle cx="32" cy="13.8" r="2.3" fill="#D9531E" />
          <rect x="39" y="12.2" width="7" height="3.2" rx="1" fill="#0E1A2B" />
          {/* 원형 강화유리 도어 외부 베젤 */}
          <circle
            cx="32"
            cy="36.5"
            r="12.5"
            fill="#0E1A2B"
          />
          {/* 내부 드럼 윈도우 */}
          <circle
            cx="32"
            cy="36.5"
            r="9"
            fill="#E0F2FE"
          />
          {/* 드럼 내부 수류 웨이브 */}
          <path
            d="M23.5 37.5C26.5 34.5 29.5 39.5 32.5 37C35.5 34.5 38 38.5 40.5 36.5V41C38.5 44 35.5 45.5 32 45.5C28.5 45.5 25.5 43.5 23.5 40.5V37.5Z"
            fill="#38BDF8"
            fillOpacity="0.45"
          />
          <path
            d="M25 37C27.5 35 30 38.5 32.5 36.5C35 34.5 37.5 37.5 39.5 36"
            stroke="#0284C7"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "biz":
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          className="h-14 w-14 shrink-0"
          aria-hidden="true"
        >
          <ellipse cx="32" cy="58" rx="20" ry="2.5" fill="#0E1A2B" fillOpacity="0.08" />
          {/* 업소용 45박스 스텐 냉장고 본체 */}
          <rect
            x="11"
            y="8"
            width="42"
            height="45"
            rx="3"
            fill="#F1F5F9"
            stroke="#0E1A2B"
            strokeWidth="2.2"
          />
          {/* 상단 기계실(콤프레서 커버) */}
          <rect
            x="12.2"
            y="9.2"
            width="39.6"
            height="7.5"
            rx="1.8"
            fill="#0E1A2B"
          />
          {/* 기계실 루버 통풍구 & 녹색 온도계 */}
          <line x1="16" y1="13" x2="25" y2="13" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="41" y="11" width="7.5" height="3.8" rx="1" fill="#10B981" />
          {/* 4도어 분할선 */}
          <line x1="32" y1="17" x2="32" y2="52" stroke="#0E1A2B" strokeWidth="2" />
          <line x1="12" y1="34.5" x2="52" y2="34.5" stroke="#0E1A2B" strokeWidth="2" />
          {/* 4도어 매립형 스텐 손잡이 */}
          <rect x="27" y="22" width="2.2" height="7" rx="1" fill="#D9531E" />
          <rect x="34.8" y="22" width="2.2" height="7" rx="1" fill="#D9531E" />
          <rect x="27" y="39.5" width="2.2" height="7" rx="1" fill="#0E1A2B" />
          <rect x="34.8" y="39.5" width="2.2" height="7" rx="1" fill="#0E1A2B" />
          {/* 하단 높이조절 다리 */}
          <line x1="16" y1="53" x2="16" y2="56.5" stroke="#0E1A2B" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="48" y1="53" x2="48" y2="56.5" stroke="#0E1A2B" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case "small":
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          className="h-14 w-14 shrink-0"
          aria-hidden="true"
        >
          <ellipse cx="32" cy="55" rx="20" ry="2.5" fill="#0E1A2B" fillOpacity="0.08" />
          {/* 소형 주방가전(오븐/전자레인지) 본체 */}
          <rect
            x="8"
            y="16"
            width="48"
            height="32"
            rx="4.5"
            fill="#FFFFFF"
            stroke="#0E1A2B"
            strokeWidth="2.2"
          />
          {/* 전면 조리창 */}
          <rect
            x="13"
            y="21"
            width="27"
            height="22"
            rx="2.5"
            fill="#0E1A2B"
          />
          {/* 내부 온기 포켓 하이라이트 */}
          <path
            d="M18 36H35"
            stroke="#D9531E"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M21 31.5C21 28.5 23.5 26.5 26.5 26.5C29.5 26.5 32 28.5 32 31.5"
            stroke="#FDBA74"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* 우측 컨트롤 패널 */}
          <rect x="44" y="21" width="7" height="4" rx="1" fill="#F1F5F9" stroke="#0E1A2B" strokeWidth="1.4" />
          <circle cx="47.5" cy="31" r="2.6" fill="#D9531E" />
          <circle cx="47.5" cy="39" r="2.6" fill="#0E1A2B" />
          {/* 하단 받침 */}
          <line x1="15" y1="48" x2="15" y2="51" stroke="#0E1A2B" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="49" y1="48" x2="49" y2="51" stroke="#0E1A2B" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case "all":
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          className="h-14 w-14 shrink-0"
          aria-hidden="true"
        >
          <rect
            x="11"
            y="11"
            width="18"
            height="18"
            rx="4"
            fill="#FFFFFF"
            fillOpacity="0.16"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <rect
            x="35"
            y="11"
            width="18"
            height="18"
            rx="4"
            fill="#D9531E"
            stroke="#FF8A50"
            strokeWidth="2"
          />
          <rect
            x="11"
            y="35"
            width="18"
            height="18"
            rx="4"
            fill="#FFFFFF"
            fillOpacity="0.16"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <rect
            x="35"
            y="35"
            width="18"
            height="18"
            rx="4"
            fill="#FFFFFF"
            fillOpacity="0.16"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <path
            d="M41 20H47M47 20L44.5 17.5M47 20L44.5 22.5"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

const CATEGORY_CARDS: Array<{
  key: PictogramKey;
  label: string;
  subItems: string;
  tags: readonly string[];
  badge: string;
  href: string;
}> = [
  {
    key: "aircon",
    label: "에어컨 · 냉난방기",
    subItems: "가정용 벽걸이·스탠드·2in1부터 상가용 중대형 냉난방기까지",
    tags: ["벽걸이", "스탠드", "2in1 멀티", "업소용 냉난방기"],
    badge: "냉매 · 센트 점검 완료",
    href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
  },
  {
    key: "fridge",
    label: "냉장고 · 김치냉장고",
    subItems: "원룸 소형·일반형부터 양문형·4도어·스탠드 김치냉장고까지",
    tags: ["양문형·4도어", "일반형", "원룸 소형", "김치냉장고"],
    badge: "내외부 고온 스팀 살균",
    href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
  },
  {
    key: "washer",
    label: "세탁기 · 건조기",
    subItems: "완전 분해 세척을 마친 드럼세탁기·통돌이·건조기·워시타워",
    tags: ["드럼세탁기", "통돌이", "의류건조기", "워시타워"],
    badge: "세탁조 분해 고압세척",
    href: "/gallery?category=%EC%84%B8%ED%83%81%EA%B8%B0%2F%EA%B1%B4%EC%A1%B0%EA%B8%B0",
  },
  {
    key: "biz",
    label: "업소용 냉장 · 주방설비",
    subItems: "식당·카페·프랜차이즈 창업을 위한 핵심 주방 설비 일체",
    tags: ["45박스 냉장고", "테이블냉장", "음료·주류 쇼케이스", "제빙기·세척기"],
    badge: "식당 · 카페 창업 설비",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
  },
  {
    key: "small",
    label: "주방 · 생활 소형가전",
    subItems: "원룸 입주·자취·사무실에 바로 쓰는 실속형 필수가전 모음",
    tags: ["TV·모니터", "전자레인지", "정수기·청정기", "생활소형"],
    badge: "원룸 · 오피스텔 필수",
    href: "/gallery?category=%EC%A3%BC%EB%B0%A9%2F%EC%86%8C%ED%98%95%EA%B0%80%EC%A0%84",
  },
  {
    key: "all",
    label: "전체 판매 제품 보기",
    subItems: "중촌동 직영 매장에 등록된 전 품목 실매물 가격·사양 한눈에 비교",
    tags: ["전체 품목", "모델명 검색", "가격대별 정렬", "묶음 견적함"],
    badge: "전체 실매물 쇼룸",
    href: "/gallery",
  },
];

export function CategoryPictogramBar({
  onSelectInquiry,
}: {
  onSelectInquiry?: (type: InquiryTypeValue) => void;
}) {
  void onSelectInquiry;

  return (
    <section
      id="category-section"
      aria-labelledby="category-section-heading"
      className="bg-[#F7F6F3] border-b border-[#E5E2DC] py-14 sm:py-20"
    >
      <div className="hb-container">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="취급 품목 안내"
            title={<span id="category-section-heading">품목별 판매 제품 탐색</span>}
            desc="가정용 필수 가전부터 식당·카페 업소용 주방 설비까지 원하는 품목을 선택해 현재 보유 재고를 확인해 보세요."
          />
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#0E1A2B] hover:text-[#D9531E] transition-colors self-start sm:self-end"
          >
            <span>전체 상품 갤러리 이동</span>
            <Icon d={ICON.arrow} className="w-4 h-4 text-[#D9531E]" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_CARDS.map((item) => {
            const isAll = item.key === "all";
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() =>
                  trackEvent("filter_gallery", {
                    category: item.label,
                    location: "category_section",
                  })
                }
                className={`group flex flex-col justify-between rounded-xl border p-5 sm:p-6 transition-all ${
                  isAll
                    ? "border-[#0E1A2B] bg-[#0E1A2B] text-white hover:bg-[#172842]"
                    : "border-[#E5E2DC] bg-white text-[#0E1A2B] hover:border-[#0E1A2B] shadow-2xs"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-block rounded px-2.5 py-0.5 text-[11px] font-bold ${
                        isAll
                          ? "bg-[#D9531E] text-white"
                          : "bg-[#FAF9F7] border border-[#E5E2DC] text-[#D9531E]"
                      }`}
                    >
                      {item.badge}
                    </span>
                    <h3
                      className={`mt-2.5 text-[18px] sm:text-[19px] font-extrabold tracking-[-0.02em] ${
                        isAll
                          ? "text-white"
                          : "text-[#0E1A2B] group-hover:text-[#D9531E]"
                      } transition-colors`}
                    >
                      {item.label}
                    </h3>
                    <p
                      className={`mt-1.5 text-[13px] leading-relaxed break-keep ${
                        isAll ? "text-white/75" : "text-[#4B5362]"
                      }`}
                    >
                      {item.subItems}
                    </p>
                  </div>

                  <div
                    className={`grid h-16 w-16 shrink-0 place-items-center rounded-xl border transition-transform duration-200 group-hover:scale-[1.03] ${
                      isAll
                        ? "border-white/15 bg-white/10"
                        : "border-[#EAE7E0] bg-[#FAF9F7]"
                    }`}
                  >
                    <CategoryVectorIcon type={item.key} />
                  </div>
                </div>

                <div
                  className={`mt-5 pt-3.5 border-t flex items-center justify-between gap-2 ${
                    isAll ? "border-white/15" : "border-[#EFECE6]"
                  }`}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded px-2 py-0.5 text-[11.5px] font-semibold ${
                          isAll
                            ? "bg-white/10 text-white/90"
                            : "bg-[#F6F5F2] text-[#4B5362]"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 text-[12.5px] font-bold ${
                      isAll
                        ? "text-[#FF8A50]"
                        : "text-[#0E1A2B] group-hover:text-[#D9531E]"
                    }`}
                  >
                    <span>보러가기</span>
                    <Icon
                      d={ICON.arrow}
                      className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
