// 파일 경로: components/home/home-intent-router.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon, ICON } from "../../lib/icons";
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
      titleNode: (
        <>
          <span className="block">안 쓰는 가전·집기</span>
          <span className="block">사진만 보내면</span>
          <span className="block text-[#1D68E8]">직영 방문 매입</span>
        </>
      ),
      descLine1: "제조 10년 이내 가전과 폐업 집기",
      descLine2: "직접 수거하고 현장에서 바로 정산해요",
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
          <span className="block">고압세척·점검 끝낸</span>
          <span className="block">
            전시장 실물{" "}
            <span className="text-[#1D68E8]">
              {sellingCount > 0 ? `${sellingCount}대` : "매물"}
            </span>
          </span>
          <span className="block text-[#1D68E8]">실매물 갤러리</span>
        </>
      ),
      descLine1: `에어컨 ${airconWarranty} 지원`,
      descLine2: `주요가전 ${majorWarranty}·직영 배송`,
      surfaceClass: "bg-[#DAE4FE]",
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
          <span className="block">식당·카페 창업이라면</span>
          <span className="block">한 번에 맞추는</span>
          <span className="block text-[#1D68E8]">업소용 설비 세트</span>
        </>
      ),
      descLine1: `45박스·쇼케이스·제빙기 ${bizCount > 0 ? `${bizCount}대` : "다수"} 보유`,
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
      className="border-b border-[#346397]/20 bg-gradient-to-b from-[#497CB3] to-[#3E6FA5] py-14 sm:py-20 text-white"
    >
      <div className="hb-container">
        {/* 중앙 집중 대형 타이틀 (카카오뱅크형 화이트 하이라이트 블록) */}
        <div className="text-center">
          <h2
            id="intent-router-heading"
            className="hb-intent-display text-white"
          >
            목적에 맞게{" "}
            <span className="inline-block rounded-xl bg-white/95 px-3.5 py-0.5 text-[#36679C] shadow-xs align-baseline">
              바로 시작.
            </span>
          </h2>
        </div>

        {/* 3열 세로형 쇼케이스 카드 (단일 목적지 Link + 3D 젤리 일러스트) */}
        <div className="mt-9 sm:mt-11 mx-auto max-w-[930px] grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              onClick={card.onTrack}
              className={`group block rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#4274AB] ${card.surfaceClass} shadow-[0_18px_38px_rgba(16,45,82,0.2)] hover:-translate-y-1.5 hover:shadow-[0_24px_46px_rgba(16,45,82,0.28)] active:scale-[0.98] transition-[transform,box-shadow] duration-200`}
            >
              <article className="flex h-full min-h-[340px] md:min-h-[420px] flex-col justify-between px-6 pt-7 pb-5 sm:px-7 sm:pt-9 sm:pb-6 text-left">
                <div>
                  <h3 className="hb-intent-card-title text-[#141A23]">
                    {card.titleNode}
                  </h3>
                  <p className="mt-3.5 hb-intent-card-desc text-[#6B7684]">
                    <span className="block">{card.descLine1}</span>
                    <span className="block">{card.descLine2}</span>
                  </p>
                </div>

                <div className="mt-5 flex items-end justify-center">
                  <div className="relative h-[168px] w-[168px] sm:h-[192px] sm:w-[192px] overflow-hidden hb-jelly-blend">
                    <Image
                      src={card.imageSrc}
                      alt={card.imageAlt}
                      fill
                      sizes="(max-width: 768px) 168px, 192px"
                      quality={90}
                      className="object-contain transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.04]"
                    />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* 카드 외부 하단 가벼운 1줄 상담 연결 */}
        <div className="mt-8 mx-auto max-w-[930px] flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-hb-xs sm:text-hb-sm text-white/90">
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
            className="inline-flex items-center gap-1.5 font-semibold text-white/95 hover:text-[#FEE500] hover:underline underline-offset-4 transition-colors"
          >
            <span
              className="h-2 w-2 rounded-full bg-[#FEE500]"
              aria-hidden="true"
            />
            <span>카톡 사진 1장 견적</span>
          </a>

          <span className="text-white/35" aria-hidden="true">
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
            className="inline-flex items-center gap-1.5 font-semibold text-white/95 hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
          >
            <span>30초 간편 견적 남기기</span>
          </button>

          <span className="text-white/35" aria-hidden="true">
            ·
          </span>

          <a
            href={telHref(STORE.mobile)}
            className="inline-flex items-center gap-1 font-mono font-bold text-white hover:text-[#FEE500] transition-colors tabular-nums"
          >
            <Icon d={ICON.phone} className="w-3.5 h-3.5 text-white/85" />
            <span>매입 직통 {STORE.mobile}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
