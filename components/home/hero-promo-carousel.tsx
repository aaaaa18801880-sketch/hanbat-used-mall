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
import { STORE, telHref, trackEvent } from "../../lib/site";

const AUTOPLAY_INTERVAL_MS = 5500;

interface SlidePalette {
  surfaceBg: string;
  mobileBackdropStyle: React.CSSProperties;
  desktopScrimStyle: React.CSSProperties;
  eyebrowClass: string;
  headlineTopClass: string;
  headlineBottomClass: string;
  subtitleClass: string;
  ctaClass: string;
}

function getSlidePalette(theme: HeroBannerSlide["theme"]): SlidePalette {
  switch (theme) {
    case "mint-aqua":
      return {
        surfaceBg: "bg-[#E2F4F1]",
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(226,244,241,0.96) 0%, rgba(226,244,241,0.88) 55%, rgba(226,244,241,0.18) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(226,244,241,0.98) 0%, rgba(226,244,241,0.92) 38%, rgba(226,244,241,0.45) 54%, rgba(226,244,241,0) 68%)",
        },
        eyebrowClass: "text-[#0F5156]",
        headlineTopClass: "text-[#0F3D3E]",
        headlineBottomClass: "text-[#146B66]",
        subtitleClass: "text-[#2C5555]",
        ctaClass:
          "bg-[#176862] text-white hover:bg-[#11524D] shadow-sm",
      };
    case "sage-green":
      return {
        surfaceBg: "bg-[#E6F3EC]",
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(230,243,236,0.96) 0%, rgba(230,243,236,0.88) 55%, rgba(230,243,236,0.18) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(230,243,236,0.98) 0%, rgba(230,243,236,0.92) 38%, rgba(230,243,236,0.45) 54%, rgba(230,243,236,0) 68%)",
        },
        eyebrowClass: "text-[#1F5444]",
        headlineTopClass: "text-[#163B30]",
        headlineBottomClass: "text-[#2A6F5A]",
        subtitleClass: "text-[#35594D]",
        ctaClass:
          "bg-[#2F6F5E] text-white hover:bg-[#235648] shadow-sm",
      };
    case "warm-apricot":
      return {
        surfaceBg: "bg-[#FDF1E6]",
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(253,241,230,0.96) 0%, rgba(253,241,230,0.88) 55%, rgba(253,241,230,0.18) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(253,241,230,0.98) 0%, rgba(253,241,230,0.92) 38%, rgba(253,241,230,0.45) 54%, rgba(253,241,230,0) 68%)",
        },
        eyebrowClass: "text-[#8A3B16]",
        headlineTopClass: "text-[#3B2113]",
        headlineBottomClass: "text-[#B84A1C]",
        subtitleClass: "text-[#634332]",
        ctaClass:
          "bg-[#B84A1C] text-white hover:bg-[#993B14] shadow-sm",
      };
    case "store-photo":
    default:
      return {
        surfaceBg: "bg-[#141A23]",
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(16,24,39,0.88) 0%, rgba(16,24,39,0.72) 55%, rgba(16,24,39,0.28) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(16,24,39,0.92) 0%, rgba(16,24,39,0.78) 42%, rgba(16,24,39,0.32) 64%, rgba(16,24,39,0.08) 100%)",
        },
        eyebrowClass: "text-[#FDE68A]",
        headlineTopClass: "text-white",
        headlineBottomClass: "text-[#FF9E6D]",
        subtitleClass: "text-white/85",
        ctaClass:
          "bg-white text-[#141A23] hover:bg-[#F3F4F6] shadow-sm",
      };
  }
}

export function HeroPromoCarousel({
  sellingCount,
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
  const palette = getSlidePalette(activeSlide.theme);

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
      <div className="hb-container pt-4 sm:pt-5 pb-5 sm:pb-7">
        {/* 대형 기획전 비주얼 배너 캐러셀 (쿠팡·하이마트·오늘의집형 프로모션 쇼케이스) */}
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="한밭중고전자 주요 기획전 배너"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-black/5 shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] focus-visible:ring-offset-2 transition-colors duration-300 ${palette.surfaceBg}`}
        >
          {/* 배경 비주얼 레이어 (크로스페이드) */}
          <div className="relative min-h-[340px] sm:min-h-[360px] lg:min-h-[410px] w-full flex flex-col justify-between">
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
              style={palette.mobileBackdropStyle}
              aria-hidden="true"
            />
            {/* 태블릿·데스크톱 좌측 텍스트 보호 그라데이션 */}
            <div
              className="pointer-events-none hidden sm:block absolute inset-0"
              style={palette.desktopScrimStyle}
              aria-hidden="true"
            />

            {/* 좌측 콘텐츠 레이어 */}
            <div className="relative z-10 flex flex-1 flex-col justify-center px-6 pt-7 pb-16 sm:px-16 sm:py-12 lg:px-20 lg:py-14 max-w-full sm:max-w-[60%] lg:max-w-[56%]">
              {/* 상단 브랜드/신뢰 바 */}
              <div
                className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-hb-xs sm:text-hb-sm font-extrabold tracking-tight ${palette.eyebrowClass}`}
              >
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
                <span className={`block ${palette.headlineTopClass}`}>
                  {activeSlide.headlineTop}
                </span>
                <span className={`block mt-0.5 ${palette.headlineBottomClass}`}>
                  {activeSlide.headlineBottom}
                </span>
              </h1>

              {/* 서브 설명 */}
              <p
                className={`mt-2.5 sm:mt-3.5 max-w-md text-hb-sm sm:text-hb-base font-medium leading-relaxed break-keep [text-wrap:pretty] ${palette.subtitleClass}`}
              >
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
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-2.5 text-hb-sm font-bold transition-[background-color,transform] duration-150 active:scale-[0.97] ${palette.ctaClass}`}
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
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-2.5 text-hb-sm font-bold transition-[background-color,transform] duration-150 active:scale-[0.97] cursor-pointer ${palette.ctaClass}`}
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
                    className={`h-2 rounded-full transition-[width,background-color] duration-200 cursor-pointer ${
                      isCurrent
                        ? "w-7 bg-white shadow-xs"
                        : "w-2 bg-black/25 hover:bg-black/45"
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

        {/* 배너 바로 아래 핵심 전환 퀵바 (실매물 · 방문 매입 · 카톡 사진 견적 · 전화 직통) */}
        <div className="mt-3.5 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <Link
            href="/gallery"
            className="group flex items-center justify-between gap-2 sm:gap-2.5 rounded-2xl border border-hb-border bg-hb-surface-muted px-3 sm:px-4 py-3 hover:border-[#141A23] hover:bg-white transition-[border-color,background-color] duration-150"
          >
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 text-hb-sm font-bold text-[#141A23]">
                <span>실매물 확인</span>
                {sellingCount > 0 && (
                  <span className="font-mono text-hb-xs font-bold text-[#C84312] tabular-nums">
                    {sellingCount}대
                  </span>
                )}
              </span>
              <span className="block text-hb-xs text-[#475569] truncate">
                고압세척 · 보증 출고
              </span>
            </div>
            <Icon
              d={ICON.right}
              className="w-4 h-4 shrink-0 text-[#64748B] group-hover:text-[#141A23] group-hover:translate-x-0.5 transition-transform"
            />
          </Link>

          <Link
            href="/purchase"
            className="group flex items-center justify-between gap-2 sm:gap-2.5 rounded-2xl border border-hb-border bg-hb-surface-muted px-3 sm:px-4 py-3 hover:border-[#141A23] hover:bg-white transition-[border-color,background-color] duration-150"
          >
            <div className="min-w-0">
              <span className="block text-hb-sm font-bold text-[#141A23] truncate">
                가전 · 폐업 매입
              </span>
              <span className="block text-hb-xs text-[#475569] truncate">
                당일 방문 · 현장 정산
              </span>
            </div>
            <Icon
              d={ICON.right}
              className="w-4 h-4 shrink-0 text-[#C84312] group-hover:translate-x-0.5 transition-transform"
            />
          </Link>

          <a
            href={STORE.kakaoChat}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("click_kakao_consult", { location: "home_hero_dock" })
            }
            className="group flex items-center justify-between gap-2 sm:gap-2.5 rounded-2xl border border-[#F2D900] bg-[#FFFBEB] px-3 sm:px-4 py-3 hover:bg-[#FEE500] transition-colors duration-150"
          >
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 text-hb-sm font-bold text-[#191600]">
                <Icon d={ICON.chat} className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">카톡 사진 견적</span>
              </span>
              <span className="block text-hb-xs text-[#574A00] truncate">
                사진 1장으로 1분 확인
              </span>
            </div>
            <Icon
              d={ICON.right}
              className="w-4 h-4 shrink-0 text-[#191600] group-hover:translate-x-0.5 transition-transform"
            />
          </a>

          <a
            href={telHref(STORE.tel)}
            onClick={() =>
              trackEvent("click_tel_consult", { location: "home_hero_dock" })
            }
            className="group flex items-center justify-between gap-2 sm:gap-2.5 rounded-2xl border border-hb-border bg-hb-surface-muted px-3 sm:px-4 py-3 hover:border-[#141A23] hover:bg-white transition-[border-color,background-color] duration-150"
          >
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 text-hb-sm font-bold text-[#141A23] tabular-nums">
                <Icon d={ICON.phone} className="w-3.5 h-3.5 shrink-0 text-[#C84312]" />
                <span className="truncate">{STORE.tel}</span>
              </span>
              <span className="block text-hb-xs text-[#475569] truncate">
                <span className="sm:hidden">{STORE.hours}</span>
                <span className="hidden sm:inline">{STORE.hours} 직영 상담</span>
              </span>
            </div>
            <Icon
              d={ICON.right}
              className="w-4 h-4 shrink-0 text-[#64748B] group-hover:text-[#141A23] group-hover:translate-x-0.5 transition-transform"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
