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
            "linear-gradient(180deg, rgba(230,246,252,0.96) 0%, rgba(230,246,252,0.84) 52%, rgba(230,246,252,0.12) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(230,246,252,0.92) 0%, rgba(230,246,252,0.78) 38%, rgba(230,246,252,0) 56%)",
        },
      };
    case "champagne-gold":
      return {
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(248,244,232,0.96) 0%, rgba(248,244,232,0.84) 52%, rgba(248,244,232,0.12) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(248,244,232,0.92) 0%, rgba(248,244,232,0.78) 38%, rgba(248,244,232,0) 56%)",
        },
      };
    case "midnight-navy":
      return {
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(1,3,10,0.94) 0%, rgba(1,3,10,0.78) 54%, rgba(1,3,10,0.14) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(1,3,10,0.92) 0%, rgba(1,3,10,0.72) 38%, rgba(1,3,10,0) 56%)",
        },
      };
    case "sage-mist":
      return {
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(234,242,236,0.96) 0%, rgba(234,242,236,0.84) 52%, rgba(234,242,236,0.12) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(234,242,236,0.92) 0%, rgba(234,242,236,0.78) 38%, rgba(234,242,236,0) 56%)",
        },
      };
    case "charcoal-bronze":
      return {
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(11,16,23,0.94) 0%, rgba(11,16,23,0.78) 54%, rgba(11,16,23,0.14) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(11,16,23,0.92) 0%, rgba(11,16,23,0.72) 38%, rgba(11,16,23,0) 56%)",
        },
      };
    case "store-photo":
    default:
      return {
        mobileBackdropStyle: {
          background:
            "linear-gradient(180deg, rgba(15,24,38,0.92) 0%, rgba(15,24,38,0.74) 54%, rgba(15,24,38,0.26) 100%)",
        },
        desktopScrimStyle: {
          background:
            "linear-gradient(90deg, rgba(15,24,38,0.94) 0%, rgba(15,24,38,0.78) 42%, rgba(15,24,38,0) 62%)",
        },
      };
  }
}

export function HeroPromoCarousel({
  onOpenVisitModal,
  activeIndex: controlledIndex,
  onActiveIndexChange,
}: {
  sellingCount?: number;
  onOpenVisitModal: () => void;
  activeIndex?: number;
  onActiveIndexChange?: (nextIndex: number) => void;
}) {
  const [uncontrolledIndex, setUncontrolledIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [liveStatus, setLiveStatus] = useState("");

  const total = HERO_BANNER_SLIDES.length;
  const activeIndex = controlledIndex ?? uncontrolledIndex;
  const activeSlide = HERO_BANNER_SLIDES[activeIndex];
  const scrims = getSlideScrims(activeSlide.theme);

  const commitIndex = useCallback(
    (nextIndex: number) => {
      if (onActiveIndexChange) {
        onActiveIndexChange(nextIndex);
      } else {
        setUncontrolledIndex(nextIndex);
      }
    },
    [onActiveIndexChange]
  );

  const selectSlide = useCallback(
    (nextIndex: number, announce = true) => {
      commitIndex(nextIndex);
      if (announce) {
        const target = HERO_BANNER_SLIDES[nextIndex];
        setLiveStatus(
          `${total}개 중 ${nextIndex + 1}번째 배너: ${target.headlineTop} ${target.headlineBottom}`
        );
      }
    },
    [commitIndex, total]
  );

  const goStep = useCallback(
    (delta: number) => {
      const next = getWrappedBannerIndex(activeIndex, delta, total);
      selectSlide(next, true);
    },
    [activeIndex, selectSlide, total]
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
      commitIndex(getWrappedBannerIndex(activeIndex, 1, total));
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [activeIndex, commitIndex, isPaused, isHovered, total]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === "A" || tag === "BUTTON" || tag === "INPUT") return;
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
      className="w-full"
    >
      {/* 100vw 풀스크린 히어로 배너 캐러셀 (투명 오버레이 상단 헤더와 일체형 컬러 연동) */}
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
        className="hb-banner-theme group relative w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#141A23] transition-colors duration-300"
      >
        <div className="hb-hero-stage relative w-full flex flex-col justify-center">
          {/* 배경 비주얼 레이어: 100vw 풀블리드 배경 위에 대형 16:9 스튜디오 비주얼을 우측 배치 */}
          <div className="pointer-events-none absolute inset-0 flex justify-center overflow-hidden">
            <div className="relative h-full w-full max-w-[1800px]">
              {HERO_BANNER_SLIDES.map((slide, idx) => {
                const isCurrent = idx === activeIndex;
                return (
                  <div
                    key={slide.id}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${total}개 중 ${idx + 1}번째: ${slide.headlineBottom}`}
                    aria-hidden={!isCurrent}
                    className={`pointer-events-none absolute inset-0 flex justify-end transition-opacity duration-500 ease-out ${
                      isCurrent ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div className="hb-hero-media-frame">
                      <Image
                        src={slide.imageSrc}
                        alt={slide.imageAlt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 1320px, 1680px"
                        priority={idx === 0}
                        loading="eager"
                        quality={90}
                        className={
                          slide.theme === "store-photo"
                            ? "object-cover object-center"
                            : "object-cover object-right"
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 모바일 상단 텍스트 보호 그라데이션 */}
          <div
            className="pointer-events-none absolute inset-0 sm:hidden"
            style={scrims.mobileBackdropStyle}
            aria-hidden="true"
          />
          {/* 태블릿·데스크톱 좌측 텍스트 보호 그라데이션 (100vw 전체 연속 블렌딩) */}
          <div
            className="pointer-events-none hidden sm:block absolute inset-0"
            style={scrims.desktopScrimStyle}
            aria-hidden="true"
          />

          {/* 중앙 컨테이너 정렬 콘텐츠 레이어 (상단 오버레이 헤더 여백 확보) */}
          <div className="hb-container relative z-10 pt-24 pb-24 sm:pt-28 sm:pb-28 lg:pt-32 lg:pb-28">
            <div className="max-w-full sm:max-w-[58%] lg:max-w-[52%]">
              {/* 상단 브랜드/신뢰 바 */}
              <div className="hb-banner-eyebrow flex flex-wrap items-center gap-x-2.5 gap-y-1 text-hb-xs sm:text-hb-sm lg:text-hb-base font-extrabold tracking-tight">
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
              <h1 id="hero-title" className="mt-3.5 sm:mt-4 hb-banner-h1">
                <span className="hb-banner-h1-top block">
                  {activeSlide.headlineTop}
                </span>
                <span className="hb-banner-h1-bottom block mt-2">
                  {activeSlide.headlineBottom}
                </span>
              </h1>

              {/* 서브 설명 */}
              <p className="hb-banner-sub mt-4 sm:mt-6 max-w-xl text-hb-sm sm:text-hb-base lg:text-hb-lg font-medium leading-relaxed break-keep [text-wrap:pretty]">
                {activeSlide.subtitle}
              </p>

              {/* 단일 핵심 CTA 캡슐 버튼 */}
              <div className="mt-8 sm:mt-10 flex items-center gap-3">
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
                    className="hb-banner-cta inline-flex min-h-[48px] sm:min-h-[52px] items-center gap-2.5 rounded-full px-7 py-3 text-hb-sm sm:text-hb-base font-bold transition-[background-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#141A23] [touch-action:manipulation]"
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
                    className="hb-banner-cta inline-flex min-h-[48px] sm:min-h-[52px] items-center gap-2.5 rounded-full px-7 py-3 text-hb-sm sm:text-hb-base font-bold transition-[background-color,transform] duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#141A23] [touch-action:manipulation]"
                  >
                    <span>{activeSlide.ctaLabel}</span>
                    <Icon d={ICON.arrow} className="w-4 h-4 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 좌우 이전/다음 슬라이드 버튼 (데스크톱 호버/포커스 시 노출) */}
          <button
            type="button"
            onClick={() => goStep(-1)}
            aria-label="이전 기획전 배너 보기"
            className="hidden sm:grid absolute left-5 lg:left-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 place-items-center rounded-full bg-white/85 text-[#141A23] backdrop-blur-sm border border-black/10 shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] transition-opacity duration-150 cursor-pointer [touch-action:manipulation]"
          >
            <Icon d={ICON.left} className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => goStep(1)}
            aria-label="다음 기획전 배너 보기"
            className="hidden sm:grid absolute right-5 lg:right-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 place-items-center rounded-full bg-white/85 text-[#141A23] backdrop-blur-sm border border-black/10 shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] transition-opacity duration-150 cursor-pointer [touch-action:manipulation]"
          >
            <Icon d={ICON.right} className="w-5 h-5" />
          </button>

          {/* 하단 컨트롤 바 (와이드 세그먼트 라인 인디케이터 + 미니멀 컨트롤 캡슐) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-5 sm:bottom-8 z-20">
            <div className="hb-container flex items-center justify-between gap-4 sm:gap-6">
              {/* 좌측~중앙 와이드 세그먼트 페이지네이션 바 (6개 슬라이드 직관 선택) */}
              <div
                className="pointer-events-auto flex flex-1 max-w-[480px] items-center gap-1.5 sm:gap-2"
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
                      onClick={() => selectSlide(idx, true)}
                      className="flex-1 inline-flex min-h-[28px] items-center justify-center py-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm [touch-action:manipulation]"
                    >
                      <span
                        className={`hb-banner-dot block w-full rounded-full transition-[height,background-color] duration-200 ${
                          isCurrent ? "h-[3px]" : "h-[2px]"
                        }`}
                        aria-selected={isCurrent}
                      />
                    </button>
                  );
                })}
              </div>

              {/* 우측 하단 미니멀 컨트롤 캡슐 (카운터 + 일시정지 + 이전/다음) */}
              <div className="pointer-events-auto inline-flex items-center gap-1.5 shrink-0">
                <div className="inline-flex h-9 items-center gap-2 rounded-full bg-[#141A23]/75 px-3.5 text-hb-xs font-bold text-white backdrop-blur-md tabular-nums">
                  <span>
                    {activeIndex + 1} / {total}
                  </span>
                  <span className="h-2.5 w-px bg-white/30" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => setIsPaused((prev) => !prev)}
                    aria-label={isPaused ? "배너 자동 재생" : "배너 자동 재생 일시정지"}
                    className="px-1 text-white/90 hover:text-white cursor-pointer [touch-action:manipulation]"
                  >
                    {isPaused ? "재생" : "정지"}
                  </button>
                </div>

                <div className="inline-flex h-9 items-center overflow-hidden rounded-full bg-[#141A23]/75 text-white backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => goStep(-1)}
                    aria-label="이전 배너"
                    className="grid h-9 w-9 place-items-center hover:bg-white/15 cursor-pointer [touch-action:manipulation]"
                  >
                    <Icon d={ICON.left} className="w-3.5 h-3.5" />
                  </button>
                  <span className="h-3 w-px bg-white/25" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => goStep(1)}
                    aria-label="다음 배너"
                    className="grid h-9 w-9 place-items-center hover:bg-white/15 cursor-pointer [touch-action:manipulation]"
                  >
                    <Icon d={ICON.right} className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 스크린리더용 슬라이드 변경 라이브 안내 */}
        <p role="status" aria-live="polite" className="sr-only">
          {liveStatus}
        </p>
      </div>
    </section>
  );
}
