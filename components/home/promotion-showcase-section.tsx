"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon, ICON, SafeImg } from "../../lib/ui";
import { STORE, STORE_MERCHANT_POLICY, trackEvent } from "../../lib/site";

export interface PromotionItem {
  id: string;
  badge: string;
  badgeTone: "orange" | "navy" | "emerald" | "amber";
  title: string;
  headline: string;
  description: string;
  benefits: string[];
  imageSrc: string;
  href: string;
  categoryTag: "package" | "business" | "season" | "refurb";
}

export const PROMOTION_ITEMS: PromotionItem[] = [
  {
    id: "promo-studio-pack",
    badge: "입주 묶음 특가",
    badgeTone: "orange",
    title: "[원룸 · 오피스텔] 필수 입주 가전 패키지 기획전",
    headline: "냉장고 + 세탁기 묶음 구매 시 배송비 전액 지원",
    description:
      "원룸·오피스텔 맞춤 소형 냉장고와 콤팩트 통돌이/드럼 세탁기를 세트로 구성해 합리적인 가격에 장만하세요.",
    benefits: [
      "분해 고압세척 및 작동 점검 100% 완료",
      "대전 · 세종권 당일/익일 직영 직배송 및 수평 설치",
      "약정 보증 기간 내 이상 시 무상 A/S 보증서 발급",
    ],
    imageSrc: "/images/promotions/promo-studio-pack.jpg",
    href: "/gallery?category=냉장고&bundle=1",
    categoryTag: "package",
  },
  {
    id: "promo-commercial-kitchen",
    badge: "창업 설비 패키지",
    badgeTone: "navy",
    title: "[식당 · 카페 창업] 업소용 냉장 · 주방설비 패키지",
    headline: "45박스 냉장고 + 제빙기 + 작업대 맞춤 납품",
    description:
      "식당 오픈 및 카페 창업에 필수적인 대용량 업소용 냉동/냉장 설비와 주방 집기를 패키지로 한 번에 준비하세요.",
    benefits: [
      "식당 규격별 45박스·테이블냉장고·쇼케이스 매장 보유",
      "단상 220V / 삼상 380V 전기 규격 사전 맞춤 점검",
      "사업자 전자세금계산서 100% 즉시 발행",
    ],
    imageSrc: "/images/promotions/promo-commercial-kitchen.jpg",
    href: "/gallery?category=업소용기기",
    categoryTag: "business",
  },
  {
    id: "promo-hvac-summer",
    badge: "사계절 시즌 특가",
    badgeTone: "emerald",
    title: "[사계절 냉난방기] 인버터 절전형 에어컨 특별전",
    headline: "스탠드 · 벽걸이 · 천장형 최대 8개월 무상 보증",
    description:
      "전문 기사가 실내기·실외기 사이클을 정밀 점검하고 완전 분해 세척을 마친 검증된 사계절 냉난방기를 만나보세요.",
    benefits: [
      "실내기 + 실외기 1:1 호환 세트 구성 출고",
      "냉매 압력 및 콤프레샤 정밀 시운전 완료",
      "품목별 최대 8개월 안심 무상 보증 적용",
    ],
    imageSrc: "/images/promotions/promo-hvac-summer.jpg",
    href: "/gallery?category=에어컨/냉난방기",
    categoryTag: "season",
  },
  {
    id: "promo-refurb-cleaning",
    badge: "안심 리퍼브",
    badgeTone: "orange",
    title: "[전문 세척관] 고압 스팀 분해 세척 리퍼브 가전전",
    headline: "보이지 않는 내부 오염까지 100% 분해 살균",
    description:
      "단순 겉면 닦기가 아닌 모터, 팬, 세탁조까지 분해해 고압 세척과 살균 소독을 완료한 안심 가전만 출고합니다.",
    benefits: [
      "전문 분해 세척 및 고온 스팀 살균 전수 검수",
      "오프라인 1·2층 직영 쇼룸에서 전원 인가 직접 확인",
      `기능 이상 시 ${STORE_MERCHANT_POLICY.merchantReturnDays}일 이내 무상 교환 안심 정책`,
    ],
    imageSrc: "/images/promotions/promo-refurb-cleaning.jpg",
    href: "/#reviews-section",
    categoryTag: "refurb",
  },
  {
    id: "promo-buyback-cash",
    badge: "당일 즉시 정산",
    badgeTone: "amber",
    title: "[방문 매입] 쓰던 가전 사진 보내고 당일 현금 수거",
    headline: "정면 사진 + 명판 사진만 문자로 전송하면 끝",
    description:
      "이사·인테리어로 처분할 가전 사진을 보내주시면 시세를 확인해 드리며, 기사님 방문 수거 즉시 100% 정산해 드립니다.",
    benefits: [
      "문자 또는 카카오톡으로 사진 전송 시 30분 내 예상가 안내",
      "전문 기사가 사다리차/화물차로 직접 안전 분리 수거",
      "현장 수거 완료 즉시 100% 당일 계좌 입금",
    ],
    imageSrc: "/images/promotions/promo-studio-pack.jpg",
    href: "/purchase",
    categoryTag: "package",
  },
  {
    id: "promo-warehouse-stock",
    badge: "미등록 실시간 재고",
    badgeTone: "navy",
    title: "[실시간 창고] 홈페이지 미등록 대기 매물 1:1 찾기",
    headline: "중촌동 매장 창고의 세척 완료 재고를 1분 만에 확인",
    description:
      "홈페이지에 아직 사진을 올리지 못한 입고 대기 가전과 주방설비가 매장에 상시 대기 중입니다. 찾으시는 모델을 바로 물어보세요.",
    benefits: [
      "찾으시는 가전 모델명/용량을 말씀하시면 창고 즉시 조회",
      "세척 점검 중인 최신 입고 매물 사진 카톡으로 실시간 전송",
      "희망 사양에 맞춘 맞춤 가전 예약 상담 가능",
    ],
    imageSrc: "/images/promotions/promo-commercial-kitchen.jpg",
    href: "/inquiry?write=1",
    categoryTag: "business",
  },
];

const TABS = [
  { key: "all", label: "전체 프로모션" },
  { key: "package", label: "입주 · 패키지" },
  { key: "business", label: "식당 · 창업 설비" },
  { key: "season", label: "시즌 냉난방" },
  { key: "refurb", label: "안심 세척 리퍼브" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function PromotionShowcaseSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const filteredItems =
    activeTab === "all"
      ? PROMOTION_ITEMS
      : PROMOTION_ITEMS.filter((item) => item.categoryTag === activeTab);

  return (
    <section
      id="promotions-section"
      aria-labelledby="promo-title"
      className="border-b border-[#E5E8EB] bg-[#F9FAFB] py-12 sm:py-16 lg:py-20"
    >
      <div className="hb-container">
        {/* 상단 섹션 타이틀 및 탭 (쿠쿠몰 스타일) */}
        <div className="flex flex-col items-center text-center">
          <span className="text-hb-xs font-bold uppercase tracking-[0.12em] text-[#F05600]">
            SPECIAL CURATION &amp; PROMOTION
          </span>
          <h2
            id="promo-title"
            className="mt-2 text-hb-2xl sm:text-hb-3xl font-bold tracking-[-0.03em] text-[#191F28]"
          >
            {STORE.name} 추천 프로모션 &amp; 기획전
          </h2>
          <p className="mt-2 text-hb-sm sm:text-hb-base text-[#4E5968] max-w-xl break-keep">
            원룸 입주부터 식당·카페 창업까지, 상황별 묶음 혜택과 전문 세척 검수를 마친 테마별 실매물을 만나보세요.
          </p>

          {/* 탭 네비게이션 */}
          <div
            role="tablist"
            aria-label="기획전 분류"
            className="mt-6 flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-2xl bg-white border border-[#E5E8EB] shadow-2xs"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveTab(tab.key);
                    trackEvent("click_promo_tab", { tab: tab.key });
                  }}
                  className={`h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl text-hb-xs sm:text-hb-sm font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#191F28] text-white shadow-2xs"
                      : "text-[#6B7684] hover:text-[#191F28] hover:bg-[#F2F4F6]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 모바일: 부드러운 수평 스냅 캐러셀 (Snap Scroll) / 태블릿·데스크톱: 2~3열 와이드 그리드 */}
        <div className="mt-8 sm:mt-10 flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0 items-stretch no-scrollbar">
          {filteredItems.map((item, idx) => {
            const badgeBg =
              item.badgeTone === "orange"
                ? "bg-[#F05600] text-white"
                : item.badgeTone === "navy"
                ? "bg-[#191F28] text-white"
                : item.badgeTone === "emerald"
                ? "bg-[#027A3B] text-white"
                : "bg-amber-600 text-white";

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() =>
                  trackEvent("click_promo_card", {
                    promo_id: item.id,
                    title: item.title,
                  })
                }
                className="group flex flex-col w-[84vw] max-w-[340px] shrink-0 snap-center sm:w-auto sm:max-w-none rounded-3xl border border-[#E5E8EB] bg-white overflow-hidden shadow-card hover:shadow-card-hover hover:border-[#D1D6DB] hover:-translate-y-1 transition-all duration-200"
              >
                {/* 상단 이미지 아트워크 영역 */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2F4F6]">
                  <SafeImg
                    src={item.imageSrc}
                    alt={item.title}
                    eager={idx === 0}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                  {/* 좌상단 뱃지 */}
                  <span
                    className={`absolute left-3.5 top-3.5 rounded-lg px-2.5 py-1 text-hb-xs font-bold tracking-tight shadow-md ${badgeBg}`}
                  >
                    {item.badge}
                  </span>

                  {/* 이미지 하단 오버레이 펀치라인 헤드라인 */}
                  <p className="absolute left-3.5 right-3.5 bottom-3 text-hb-sm font-bold text-white drop-shadow-md truncate">
                    {item.headline}
                  </p>
                </div>

                {/* 하단 텍스트 정보 영역 */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-hb-base sm:text-hb-lg font-bold text-[#191F28] group-hover:text-[#F05600] transition-colors break-keep leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-hb-xs sm:text-hb-sm text-[#4E5968] leading-relaxed break-keep">
                      {item.description}
                    </p>
                  </div>

                  {/* 3대 혜택 불릿 포인트 */}
                  <div className="pt-3 border-t border-[#F2F4F6] space-y-1.5 text-hb-xs text-[#6B7684]">
                    {item.benefits.map((b, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <Icon
                          d={ICON.check}
                          className="w-3.5 h-3.5 text-[#F05600] shrink-0 mt-0.5"
                        />
                        <span className="leading-snug">{b}</span>
                      </div>
                    ))}
                  </div>

                  {/* 하단 더보기 링크 버튼 */}
                  <div className="pt-2 flex items-center justify-between text-hb-xs font-bold text-[#F05600]">
                    <span>기획전 상품 및 혜택 보기</span>
                    <Icon
                      d={ICON.arrow}
                      className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 모바일 전용 스와이프 안내 힌트 */}
        <div className="mt-3 flex sm:hidden items-center justify-center gap-1.5 text-hb-xs font-semibold text-[#8B95A1] select-none">
          <Icon d={ICON.left} className="w-3 h-3 text-[#B0B8C1]" />
          <span>좌우로 넘겨서 기획전 둘러보기</span>
          <Icon d={ICON.right} className="w-3 h-3 text-[#B0B8C1]" />
        </div>
      </div>
    </section>
  );
}
