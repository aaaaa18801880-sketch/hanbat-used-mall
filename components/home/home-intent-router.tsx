// 파일 경로: components/home/home-intent-router.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon, ICON } from "../../lib/icons";
import { type HeroBannerSlide } from "../../lib/hero-banners";
import {
  STORE,
  getCategoryWarrantyInfo,
  telHref,
  trackEvent,
  triggerQuickInquiry,
} from "../../lib/site";

interface IntentShowcaseCard {
  id: string;
  href: string;
  titleNode: React.ReactNode;
  descLine1: string;
  descLine2: string;
  surfaceClass: string;
  imageSrc: string;
  imageAlt: string;
  onTrack: () => void;
}

export function HomeIntentRouter({
  sellingCount,
  bizCount,
  activeBannerTheme = "glacial-blue",
}: {
  sellingCount: number;
  bizCount: number;
  activeBannerTheme?: HeroBannerSlide["theme"];
}) {
  const airconWarranty = getCategoryWarrantyInfo("에어컨/냉난방기").compactLabel;
  const majorWarranty = getCategoryWarrantyInfo("냉장고").compactLabel;

  const cards: readonly IntentShowcaseCard[] = [
    {
      id: "buyback",
      href: "/purchase#purchase-form",
      titleNode: (
        <>
          <span className="block">처분할 가전·집기</span>
          <span className="block">사진 한 장 보내면</span>
          <span className="block hb-intent-card-accent">직영 방문 수거</span>
        </>
      ),
      descLine1: "제조 10년 이내 가정용·폐업 집기",
      descLine2: "직접 방문해 현장에서 바로 정산합니다",
      surfaceClass: "bg-white",
      imageSrc: "/images/intent/buyback-3d.webp",
      imageAlt: "가전 방문 매입 및 현장 정산을 나타내는 3D 일러스트",
      onTrack: () =>
        trackEvent("begin_buyback_inquiry", {
          action: "purchase_page",
          location: "home_intent_router",
        }),
    },
    {
      id: "showroom",
      href: "/gallery",
      titleNode: (
        <>
          <span className="block">세척·점검 마친</span>
          <span className="block">
            전시장 보유{" "}
            <span className="hb-intent-card-accent-center tabular-nums">
              {sellingCount > 0 ? `${sellingCount}대` : "실매물"}
            </span>
          </span>
          <span className="block hb-intent-card-accent-center">
            실매물 바로 보기
          </span>
        </>
      ),
      descLine1: `에어컨 ${airconWarranty} 지원`,
      descLine2: `주요가전 ${majorWarranty} · 직영 배송`,
      surfaceClass: "bg-gradient-to-b from-[#EDF2FF] via-[#DFE8FF] to-[#DCE5FF]",
      imageSrc: "/images/intent/showroom-3d.webp",
      imageAlt: "고압세척과 무상 A/S 보증을 나타내는 3D 가전 쉴드 일러스트",
      onTrack: () =>
        trackEvent("begin_buy_inquiry", {
          action: "gallery_cta",
          location: "home_intent_router",
        }),
    },
    {
      id: "commercial",
      href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
      titleNode: (
        <>
          <span className="block">매장 오픈 준비라면</span>
          <span className="block">필요한 기기만 모은</span>
          <span className="block hb-intent-card-accent">업소용 주방 설비</span>
        </>
      ),
      descLine1: `45박스·쇼케이스·제빙기 ${bizCount > 0 ? `${bizCount}대` : "다수"} 전시`,
      descLine2: "전자세금계산서 발행과 일괄 납품까지",
      surfaceClass: "bg-white",
      imageSrc: "/images/intent/commercial-3d.webp",
      imageAlt: "업소용 냉장고와 쇼케이스 창업 설비를 나타내는 3D 일러스트",
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
      data-theme={activeBannerTheme}
      className="hb-intent-theme py-12 sm:py-16"
    >
      <div className="hb-container">
        <h2
          id="intent-router-heading"
          className="text-center hb-intent-display"
        >
          구매부터 매입·창업까지{" "}
          <span className="hb-intent-heading-accent">한 번에 해결하세요</span>
        </h2>

        <div className="mt-8 sm:mt-10 mx-auto max-w-[1000px] grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              onClick={card.onTrack}
              className={`hb-intent-card group block rounded-[22px] ${card.surfaceClass} hover:-translate-y-1.5 active:scale-[0.98] transition-[transform,box-shadow,border-color] duration-200`}
            >
              <article className="flex h-full min-h-[340px] md:min-h-[404px] flex-col justify-between px-7 pt-8 pb-6 text-left">
                <div>
                  <h3 className="hb-intent-card-title text-[#131C2B]">
                    {card.titleNode}
                  </h3>
                  <p className="mt-3 hb-intent-card-desc text-[#526071]">
                    <span className="block">{card.descLine1}</span>
                    <span className="block">{card.descLine2}</span>
                  </p>
                </div>

                <div className="mt-5 flex items-end justify-center">
                  <div className="relative h-[168px] w-[168px] sm:h-[188px] sm:w-[188px] overflow-hidden hb-jelly-blend">
                    <Image
                      src={card.imageSrc}
                      alt={card.imageAlt}
                      fill
                      sizes="(max-width: 768px) 168px, 188px"
                      quality={90}
                      className="object-contain transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.04]"
                    />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* 카드 외부 하단 1줄 빠른 상담 연결 */}
        <div className="hb-intent-meta mt-7 mx-auto max-w-[1000px] flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-hb-xs sm:text-hb-sm">
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
            className="hb-intent-meta-link inline-flex min-h-[36px] items-center gap-1.5 font-semibold hover:underline underline-offset-4 whitespace-nowrap"
          >
            <Icon d={ICON.chat} className="w-3.5 h-3.5 opacity-85" />
            <span>카톡 사진 1장 견적</span>
          </a>

          <span className="hb-intent-meta-dot" aria-hidden="true">
            ·
          </span>

          <button
            type="button"
            onClick={() => {
              trackEvent("begin_buyback_inquiry", {
                action: "quick_sell_modal",
                location: "home_intent_router",
              });
              triggerQuickInquiry({ type: "내 물건 팔기" });
            }}
            className="hb-intent-meta-link inline-flex min-h-[36px] items-center gap-1.5 font-semibold hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
          >
            <span>30초 간편 견적 남기기</span>
          </button>

          <span
            className="hidden sm:inline hb-intent-meta-dot"
            aria-hidden="true"
          >
            ·
          </span>

          <a
            href={telHref(STORE.mobile)}
            className="hb-intent-meta-link inline-flex min-h-[36px] items-center gap-1.5 font-mono font-bold tabular-nums whitespace-nowrap"
          >
            <Icon d={ICON.phone} className="w-3.5 h-3.5 opacity-85" />
            <span>매입 직통 {STORE.mobile}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
