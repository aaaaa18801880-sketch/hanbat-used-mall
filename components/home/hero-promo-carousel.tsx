// 파일 경로: components/home/hero-promo-carousel.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  HERO_BANNER_SLIDES,
  getWrappedBannerIndex,
  type HeroBannerSlide,
} from "../../lib/hero-banners";
import { Icon, ICON } from "../../lib/icons";
import { trackEvent } from "../../lib/site";

const AUTOPLAY_INTERVAL_MS = 5500;

interface SlideScrims {
  mobileBackdropStyle: React.CSSProperties;
  desktopScrimStyle: React.CSSProperties;
}

function getSlideScrims(theme: HeroBannerSlide["theme"]): SlideScrims {
  switch (theme) {
    case "glacial-blue":
      return {
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(235,246,253,0.95) 0%, rgba(235,246,253,0.84) 55%, rgba(235,246,253,0.12) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(235,246,253,0.96) 0%, rgba(235,246,253,0.88) 38%, rgba(235,246,253,0.34) 54%, rgba(235,246,253,0) 68%)",
        },
      };
    case "champagne-gold":
      return {
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(250,243,232,0.95) 0%, rgba(250,243,232,0.84) 55%, rgba(250,243,232,0.12) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(250,243,232,0.96) 0%, rgba(250,243,232,0.88) 38%, rgba(250,243,232,0.34) 54%, rgba(250,243,232,0) 68%)",
        },
      };
    case "midnight-navy":
      return {
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(4,9,24,0.92) 0%, rgba(4,9,24,0.78) 55%, rgba(4,9,24,0.14) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(4,9,24,0.94) 0%, rgba(4,9,24,0.78) 38%, rgba(4,9,24,0.28) 55%, rgba(4,9,24,0) 70%)",
        },
      };
    case "store-photo":
    default:
      return {
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(16,24,39,0.90) 0%, rgba(16,24,39,0.74) 55%, rgba(16,24,39,0.26) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(16,24,39,0.94) 0%, rgba(16,24,39,0.80) 42%, rgba(16,24,39,0.34) 64%, rgba(16,24,39,0.08) 100%)",
        },
      };
  }
}

export function HeroPromoCarousel({
  sellingCount: _sellingCount,
  onOpenVisitModal,
}: {
  sellingCount: number;
  onOpenVisitModal: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const total = HERO_BANNER_SLIDES.length;
  const activeSlide = HERO_BANNER_SLIDES[activeIndex];
  const scrims = getSlideScrims(activeSlide.theme);

  const goStep = useCallback(
    (delta: number) => {
      setActiveIndex((prev) => getWrappedBannerIndex(prev, delta, total));
    },
    [total]
  );

  useEffect(() => {
    if (isPaused || isHovered) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => getWrappedBannerIndex(prev, 1, total));
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, isHovered, total]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goStep(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goStep(1);
    }
  };

  return (
    <section
      id="hero-section"
      aria-labelledby="hero-title"
      className="w-full border-b border-hb-border bg-white"
    >
      <div className="hb-container py-4 sm:py-6">
        {/* 대형 기획전 비주얼 배너 캐러셀 (쿠팡·하이마트·오늘의집형 프로모션 쇼케이스) */}
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="한밭중고전자 주요 기획전 배너"
          tabIndex={0}
          data-theme={activeSlide.theme}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          className="hb-banner-theme group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-black/5 shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] focus-visible:ring-offset-2 transition-colors duration-300"
        >
          {/* 배경 비주얼 레이어 (크로스페이드) */}
          <div className="relative min-h-[400px] sm:min-h-[440px] lg:min-h-[500px] w-full flex flex-col justify-between">
            {HERO_BANNER_SLIDES.map((slide, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <div
                  key={slide.id}
                  aria-hidden={!isCurrent}
                  className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out ${
                    isCurrent ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image
                    src={slide.imageSrc}
                    alt={slide.imageAlt}
                    fill
                    sizes="(max-width: 1280px) 100vw, 1320px"
                    priority={idx === 0}
                    loading="eager"
                    quality={85}
                    className={
                      slide.theme === "store-photo"
                        ? "object-cover object-center"
                        : "object-cover object-right"
                    }
                  />
                </div>
              );
            })}

            {/* 모바일 상단 텍스트 보호 그라데이션 */}
            <div
              className="pointer-events-none absolute inset-0 sm:hidden"
              style={scrims.mobileBackdropStyle}
              aria-hidden="true"
            />
            {/* 태블릿·데스크톱 좌측 텍스트 보호 그라데이션 */}
            <div
              className="pointer-events-none hidden sm:block absolute inset-0"
              style={scrims.desktopScrimStyle}
              aria-hidden="true"
            />

            {/* 좌측 콘텐츠 레이어 */}
            <div className="relative z-10 flex flex-1 flex-col justify-center px-6 pt-7 pb-16 sm:px-16 sm:py-12 lg:px-20 lg:py-14 max-w-full sm:max-w-[60%] lg:max-w-[56%]">
              {/* 상단 브랜드/신뢰 바 */}
              <div className="hb-banner-eyebrow flex flex-wrap items-center gap-x-2.5 gap-y-1 text-hb-xs sm:text-hb-sm font-extrabold tracking-tight">
                {activeSlide.eyebrowBrands.map((brand, i) => (
                  <React.Fragment key={brand}>
                    {i > 0 && (
                      <span className="opacity-40" aria-hidden="true">
                        ·
                      </span>
                    )}
                    <span>{brand}</span>
                  </React.Fragment>
                ))}
              </div>

              {/* 메인 헤드라인 (접근성·SEO H1 유지) */}
              <h1
                id="hero-title"
                className="mt-2.5 sm:mt-3 hb-banner-h1"
              >
                <span className="hb-banner-h1-top block">
                  {activeSlide.headlineTop}
                </span>
                <span className="hb-banner-h1-bottom block mt-0.5">
                  {activeSlide.headlineBottom}
                </span>
              </h1>

              {/* 서브 설명 */}
              <p className="hb-banner-sub mt-2.5 sm:mt-3.5 max-w-md text-hb-sm sm:text-hb-base font-medium leading-relaxed break-keep [text-wrap:pretty]">
                {activeSlide.subtitle}
              </p>

              {/* 단일 핵심 CTA 캡슐 버튼 */}
              <div className="mt-5 sm:mt-6 flex items-center gap-2.5">
                {activeSlide.action.kind === "link" ? (
                  <Link
                    href={activeSlide.action.href}
                    onClick={() =>
                      trackEvent(
                        activeSlide.id === "commercial-buyback"
                          ? "begin_buyback_inquiry"
                          : "click_situation_preset",
                        {
                          banner_id: activeSlide.id,
                          location: "home_hero_carousel",
                        }
                      )
                    }
                    className="hb-banner-cta inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-2.5 text-hb-sm font-bold transition-[background-color,transform] duration-150 active:scale-[0.97]"
                  >
                    <span>{activeSlide.ctaLabel}</span>
                    <Icon d={ICON.arrow} className="w-4 h-4 shrink-0" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("open_showroom_modal", {
                        location: "hero_banner_carousel",
                      });
                      onOpenVisitModal();
                    }}
                    className="hb-banner-cta inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-2.5 text-hb-sm font-bold transition-[background-color,transform] duration-150 active:scale-[0.97] cursor-pointer"
                  >
                    <span>{activeSlide.ctaLabel}</span>
                    <Icon d={ICON.arrow} className="w-4 h-4 shrink-0" />
                  </button>
                )}
              </div>
            </div>

            {/* 좌우 이전/다음 슬라이드 버튼 (데스크톱 호버/포커스 시 선명하게 표시) */}
            <button
              type="button"
              onClick={() => goStep(-1)}
              aria-label="이전 기획전 배너 보기"
              className="hidden sm:grid absolute left-3.5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 place-items-center rounded-full bg-white/80 text-[#141A23] backdrop-blur-sm border border-black/10 shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white transition-opacity duration-150 cursor-pointer"
            >
              <Icon d={ICON.left} className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => goStep(1)}
              aria-label="다음 기획전 배너 보기"
              className="hidden sm:grid absolute right-3.5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 place-items-center rounded-full bg-white/80 text-[#141A23] backdrop-blur-sm border border-black/10 shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white transition-opacity duration-150 cursor-pointer"
            >
              <Icon d={ICON.right} className="w-5 h-5" />
            </button>

            {/* 하단 중앙 페이지네이션 인디케이터 (레퍼런스 스타일 길쭉한 활성 캡슐) */}
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5"
              role="tablist"
              aria-label="배너 슬라이드 선택"
            >
              {HERO_BANNER_SLIDES.map((slide, idx) => {
                const isCurrent = idx === activeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    aria-label={`${idx + 1}번 배너: ${slide.headlineBottom}`}
                    onClick={() => setActiveIndex(idx)}
                    className={`hb-banner-dot h-2 rounded-full transition-[width,background-color] duration-200 cursor-pointer ${
                      isCurrent ? "w-7" : "w-2"
                    }`}
                  />
                );
              })}
            </div>

            {/* 하단 우측 카운터 + 자동재생 토글 캡슐 (예: 1 / 4) */}
            <div className="absolute bottom-3.5 right-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#141A23]/65 px-3 py-1 text-hb-xs font-bold text-white backdrop-blur-md tabular-nums">
              <span>
                {activeIndex + 1} / {total}
              </span>
              <span className="h-2.5 w-px bg-white/30" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={isPaused ? "배너 자동 재생" : "배너 자동 재생 일시정지"}
                className="text-white/90 hover:text-white cursor-pointer"
              >
                {isPaused ? "재생" : "정지"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
