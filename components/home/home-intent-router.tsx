// 파일 경로: components/home/home-intent-router.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Icon, ICON } from "../../lib/icons";
import {
  STORE,
  getCategoryWarrantyInfo,
  telHref,
  trackEvent,
  triggerQuickInquiry,
} from "../../lib/site";
import {
  IntentCardIllustration,
  type IntentIllustrationKind,
} from "./intent-illustrations";

interface IntentShowcaseCard {
  id: string;
  href: string;
  line1: string;
  line2: string;
  highlightAction: string;
  desc: string;
  accentColorClass: string;
  surfaceClass: string;
  illustration: IntentIllustrationKind;
  onTrack: () => void;
}

export function HomeIntentRouter({
  sellingCount,
  bizCount,
}: {
  sellingCount: number;
  bizCount: number;
}) {
  const airconWarranty = getCategoryWarrantyInfo("에어컨/냉난방기").compactLabel;
  const majorWarranty = getCategoryWarrantyInfo("냉장고").compactLabel;

  const cards: readonly IntentShowcaseCard[] = [
    {
      id: "buyback",
      href: "/purchase#purchase-form",
      line1: "제조 10년 이내",
      line2: "안 쓰는 가전·폐업 집기",
      highlightAction: "직영 방문 매입",
      desc: "정면·명판 사진만 올리면 예상 시세 안내 후 직접 방문 수거·현장 정산합니다.",
      accentColorClass: "text-[#C84312]",
      surfaceClass: "bg-white",
      illustration: "buyback",
      onTrack: () =>
        trackEvent("begin_buyback_inquiry", {
          action: "purchase_page",
          location: "home_intent_router",
        }),
    },
    {
      id: "showroom",
      href: "/gallery",
      line1: "고압세척 · 작동 점검 완료",
      line2:
        sellingCount > 0
          ? `전시장 실매물 ${sellingCount}대`
          : "가정용 실매물 쇼룸",
      highlightAction: "실매물 갤러리 보기",
      desc: `직영 출고 에어컨 ${airconWarranty} · 주요가전 ${majorWarranty}으로 안심하고 고르세요.`,
      accentColorClass: "text-[#0369A1]",
      surfaceClass: "bg-[#F1F5FA]",
      illustration: "showroom",
      onTrack: () =>
        trackEvent("begin_buy_inquiry", {
          action: "gallery_cta",
          location: "home_intent_router",
        }),
    },
    {
      id: "commercial",
      href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
      line1: "식당 · 카페 · 사무실 창업",
      line2:
        bizCount > 0
          ? `업소용 설비 ${bizCount}대 구비`
          : "45박스 · 쇼케이스 일괄",
      highlightAction: "업소용 설비 보기",
      desc: "냉장·냉동·제빙기·냉난방기 일괄 구성과 사업자 전자세금계산서 발행을 지원합니다.",
      accentColorClass: "text-[#C84312]",
      surfaceClass: "bg-white",
      illustration: "commercial",
      onTrack: () =>
        trackEvent("begin_bulk_inquiry", {
          action: "biz_set_gallery",
          location: "home_intent_router",
        }),
    },
  ];

  return (
    <section
      id="buyback-summary-section"
      aria-labelledby="intent-router-heading"
      className="border-b border-[#1E3554]/15 bg-gradient-to-b from-[#2A496E] to-[#203957] py-12 sm:py-16 text-white"
    >
      <div className="hb-container">
        {/* 중앙 집중 타이틀 (핵심 키워드 화이트 블록 강조) */}
        <div className="text-center">
          <h2
            id="intent-router-heading"
            className="text-hb-2xl sm:text-hb-3xl font-extrabold tracking-[-0.03em] text-white leading-tight break-keep"
          >
            목적에 맞게{" "}
            <span className="inline-block rounded-lg bg-white px-3 py-0.5 text-[#1F3A5A] shadow-xs align-baseline">
              바로 시작.
            </span>
          </h2>
        </div>

        {/* 3열 세로형 쇼케이스 카드 (단일 목적지 Link + 중첩 인터랙션 없음) */}
        <div className="mt-8 sm:mt-10 mx-auto max-w-[960px] grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              onClick={card.onTrack}
              className={`group block rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#223C5B] ${card.surfaceClass} shadow-[0_14px_34px_rgba(12,24,42,0.22)] hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(12,24,42,0.3)] active:scale-[0.98] transition-[transform,box-shadow] duration-200`}
            >
              <article className="flex h-full min-h-[250px] md:min-h-[348px] flex-col justify-between p-6 sm:p-7 text-left">
                <div>
                  <h3 className="text-hb-lg sm:text-hb-xl font-extrabold leading-[1.32] tracking-[-0.025em] text-[#141A23] break-keep">
                    <span className="block">{card.line1}</span>
                    <span className="block">{card.line2}</span>
                    <span
                      className={`mt-0.5 inline-flex items-center gap-1 ${card.accentColorClass}`}
                    >
                      <span>{card.highlightAction}</span>
                      <Icon
                        d={ICON.arrow}
                        className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </span>
                  </h3>
                  <p className="mt-3 text-hb-xs sm:text-hb-sm text-[#526071] leading-[1.6] break-keep">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-6 flex items-end justify-center pt-2">
                  <IntentCardIllustration kind={card.illustration} />
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* 카드 외부 하단 즉시 상담 보조 바 (카드 클릭 동선과 분리) */}
        <div className="mt-7 mx-auto max-w-[960px] flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-hb-xs sm:text-hb-sm text-white/90">
          <a
            href={STORE.kakaoChat}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("click_kakao_consult", {
                action: "kakao_photo_quote",
                location: "home_intent_router",
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-4 py-2 font-bold text-white transition-colors"
          >
            <span
              className="h-2 w-2 rounded-full bg-[#FEE500]"
              aria-hidden="true"
            />
            <span>카톡 사진 1장 매입·재고 견적</span>
          </a>

          <button
            type="button"
            onClick={() => {
              trackEvent("begin_buyback_inquiry", {
                action: "quick_sell_modal",
                location: "home_intent_router",
              });
              triggerQuickInquiry({ type: "내 물건 팔기" });
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-4 py-2 font-bold text-white transition-colors cursor-pointer"
          >
            <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#FFB085]" />
            <span>30초 간편 견적 남기기</span>
          </button>

          <a
            href={telHref(STORE.mobile)}
            className="inline-flex items-center gap-1.5 px-2 py-1 font-mono font-bold text-white/95 hover:text-[#FFB085] transition-colors tabular-nums"
          >
            <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#FFB085]" />
            <span>매입 직통 {STORE.mobile}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
