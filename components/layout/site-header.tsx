"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICON, Icon } from "../../lib/icons";
import { STORE, telHref, trackEvent, triggerQuickInquiry } from "../../lib/site";
import { type HeroHeaderTone } from "../../lib/hero-banners";
import {
  HanbatBrandLogo,
  useQuoteBasket,
  closeTopLayerElement,
  isOutsideDialogBounds,
} from "./ui-primitives";

const HEADER_NAV = [
  { label: "판매 제품", href: "/gallery", matchPrefix: "/gallery" },
  { label: "셀프견적", href: "/quote", matchPrefix: "/quote" },
  { label: "가전 매입", href: "/purchase", matchPrefix: "/purchase" },
  { label: "문의 게시판", href: "/inquiry", matchPrefix: "/inquiry" },
  { label: "정보 게시판", href: "/guide", matchPrefix: "/guide" },
] as const;

const DRAWER_QUICK_CATEGORIES = [
  { label: "에어컨·냉난방기", href: "/gallery?category=에어컨/냉난방기" },
  { label: "냉장고·김치냉장고", href: "/gallery?category=냉장고" },
  { label: "세탁기·건조기", href: "/gallery?category=세탁기/건조기" },
  { label: "업소용 냉장·주방", href: "/gallery?category=업소용기기" },
  { label: "주방·소형가전", href: "/gallery?category=기타" },
  { label: "폐업·대량 매입", href: "/purchase#purchase-form" },
] as const;

const SCROLL_SWITCH_Y = 12;

function subscribeScrollState(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}

function getScrollSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.scrollY > SCROLL_SWITCH_Y;
}

function getServerScrollSnapshot(): boolean {
  return false;
}

export function SiteHeader({
  children,
  overlayHero = false,
  heroTone = "light",
}: {
  children?: React.ReactNode;
  overlayHero?: boolean;
  heroTone?: HeroHeaderTone;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const basketCount = useQuoteBasket().length;
  const drawerRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);

  const isScrolled = useSyncExternalStore(
    subscribeScrollState,
    getScrollSnapshot,
    getServerScrollSnapshot
  );

  // 홈 최상단(스크롤 전)에서는 히어로 슬라이더 배경과 자연스럽게 통합, 스크롤 즉시 원색(화이트) 고정
  const isTransparentHero = overlayHero && !isScrolled;
  const isDarkHeroOverlay = isTransparentHero && heroTone === "dark";

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;

    if (menuOpen) {
      drawer.removeAttribute("data-closing");
      if (!drawer.open) {
        try {
          drawer.showModal();
        } catch {
          // Ignore invalid dialog state during teardown
        }
      }
      return;
    }

    if (drawer.open) {
      void closeTopLayerElement(drawer);
    }
  }, [menuOpen]);

  const handleDrawerPointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    if (!menuOpen) return;
    if (typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype) {
      return;
    }
    pressedOutsideRef.current = isOutsideDialogBounds(
      e.clientX,
      e.clientY,
      e.currentTarget
    );
  };

  const handleDrawerPointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    if (!menuOpen) {
      pressedOutsideRef.current = false;
      return;
    }
    if (typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype) {
      pressedOutsideRef.current = false;
      return;
    }
    if (
      pressedOutsideRef.current &&
      isOutsideDialogBounds(e.clientX, e.clientY, e.currentTarget)
    ) {
      pressedOutsideRef.current = false;
      setMenuOpen(false);
      return;
    }
    pressedOutsideRef.current = false;
  };

  const headerPositionClass = overlayHero
    ? "fixed top-0 inset-x-0 z-50"
    : "sticky top-0 z-50";

  const headerSurfaceClass = isTransparentHero
    ? "bg-transparent border-b border-transparent"
    : isScrolled
    ? "bg-white/95 backdrop-blur-md border-b border-[#E4DED4] shadow-[0_4px_20px_rgba(19,34,56,0.07)]"
    : "bg-white/95 backdrop-blur-md border-b border-[#E4DED4]";

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#141A23] focus:px-4 focus:py-2.5 focus:text-hb-sm focus:font-bold focus:text-white focus:shadow-lg"
      >
        본문 바로가기
      </a>

      <header
        data-overlay-hero={overlayHero ? "true" : "false"}
        data-scrolled={isScrolled ? "true" : "false"}
        className={`hb-header w-full transition-[background-color,border-color,box-shadow] duration-200 ${headerPositionClass} ${headerSurfaceClass}`}
      >
        <div className="w-full px-5 sm:px-8 lg:px-10 xl:px-14 2xl:px-16 flex h-[64px] sm:h-[68px] lg:h-[74px] items-center justify-between gap-4 lg:gap-6">
          {/* 1. 브랜드 로고 */}
          <div className="flex items-center shrink-0">
            <Link
              href="/"
              className={`inline-flex items-center py-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 ${
                isDarkHeroOverlay
                  ? "focus-visible:ring-white"
                  : "focus-visible:ring-[#141A23]"
              }`}
              aria-label={`${STORE.name} 홈으로 이동`}
            >
              <HanbatBrandLogo dark={isDarkHeroOverlay} />
            </Link>
          </div>

          {/* 2. 핵심 내비게이션 메뉴 (플래그십 풀와이드 타이포그래피) */}
          <nav
            className="hidden lg:flex items-center justify-center gap-1 xl:gap-3 2xl:gap-5"
            aria-label="주요 메뉴"
          >
            {HEADER_NAV.map((item) => {
              const isActive =
                item.matchPrefix && pathname?.startsWith(item.matchPrefix);

              const linkColorClass = isDarkHeroOverlay
                ? isActive
                  ? "text-white font-extrabold"
                  : "text-white/90 hover:text-white hover:bg-white/10"
                : isTransparentHero
                ? isActive
                  ? "text-[#141A23] font-extrabold"
                  : "text-[#141A23]/90 hover:text-[#141A23] hover:bg-black/[0.05]"
                : isActive
                ? "text-hb-brand-text font-extrabold"
                : "text-[#141A23] hover:text-hb-brand-text hover:bg-hb-surface-muted";

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`hb-tab-indicator relative px-3 xl:px-3.5 py-2 text-hb-base font-bold tracking-[-0.024em] rounded-lg transition-[color,background-color,transform] duration-150 active:scale-[0.97] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 ${
                    isDarkHeroOverlay
                      ? "focus-visible:ring-white"
                      : "focus-visible:ring-hb-navy"
                  } ${linkColorClass}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 3. 우측 주요 행동 (견적함 · 전화 상담 · 카카오톡 상담 · 간편 견적) */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            {basketCount > 0 && (
              <Link
                href="/quote"
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 h-9 text-hb-xs sm:text-hb-sm font-bold active:scale-[0.96] transition-[background-color,color,border-color,transform] duration-150 whitespace-nowrap ${
                  isDarkHeroOverlay
                    ? "border-white/25 bg-white/15 text-white backdrop-blur-sm hover:bg-white/20"
                    : isTransparentHero
                    ? "border-[#141A23]/15 bg-white/60 text-[#141A23] backdrop-blur-sm hover:bg-white"
                    : "bg-hb-warm border-hb-border-strong text-hb-text-primary hover:bg-hb-navy hover:text-white"
                }`}
                title="담아둔 관심 매물 셀프견적서 확인하기"
              >
                <Icon d={ICON.bag} className="w-4 h-4" />
                <span className="hidden xs:inline">견적함</span>
                <span
                  className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-hb-xs font-bold tabular-nums leading-none ${
                    isDarkHeroOverlay
                      ? "bg-[#FF8A50] text-[#141A23]"
                      : "bg-hb-navy text-white"
                  }`}
                >
                  {basketCount}
                </span>
              </Link>
            )}

            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", { location: "site_header" })
              }
              className={`hidden md:inline-flex items-center gap-1.5 rounded-lg border px-3.5 h-9 text-hb-sm font-bold active:scale-[0.96] transition-[background-color,border-color,color,transform] duration-150 whitespace-nowrap tabular-nums ${
                isDarkHeroOverlay
                  ? "border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/40"
                  : isTransparentHero
                  ? "border-[#141A23]/15 bg-white/60 text-[#141A23] backdrop-blur-sm hover:bg-white/95 hover:border-[#141A23]/30"
                  : "border-hb-border bg-hb-surface-muted text-hb-text-primary hover:border-hb-navy hover:bg-white"
              }`}
              aria-label={`전화 상담 ${STORE.tel}`}
            >
              <Icon
                d={ICON.phone}
                className={`w-4 h-4 shrink-0 ${
                  isDarkHeroOverlay ? "text-[#FF8A50]" : "text-hb-brand-text"
                }`}
              />
              <span>전화 상담</span>
              <span
                className={`hidden 2xl:inline font-bold ${
                  isDarkHeroOverlay ? "text-white/85" : "text-hb-text-secondary"
                }`}
              >
                {STORE.tel}
              </span>
            </a>

            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("click_kakao_consult", { location: "site_header" })
              }
              className="hidden sm:inline-flex hb-btn-kakao !rounded-lg !gap-1.5 h-9 px-3.5 text-hb-sm whitespace-nowrap"
              aria-label="카톡 상담 (카카오톡 채널 열기)"
            >
              <Icon d={ICON.chat} className="w-4 h-4 shrink-0" />
              <span>카톡 상담</span>
            </a>

            <button
              type="button"
              onClick={() => {
                const isPurchase = Boolean(pathname?.startsWith("/purchase"));
                trackEvent(
                  isPurchase ? "begin_buyback_inquiry" : "begin_buy_inquiry",
                  { location: "site_header" }
                );
                triggerQuickInquiry({
                  type: isPurchase ? "내 물건 팔기" : "구매 문의",
                });
              }}
              className={`hidden lg:inline-flex items-center justify-center gap-1.5 rounded-lg h-9 px-3.5 text-hb-sm font-bold tracking-[-0.01em] whitespace-nowrap cursor-pointer active:scale-[0.97] transition-[background-color,color,transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 ${
                isDarkHeroOverlay
                  ? "bg-white text-[#141A23] hover:bg-[#F3EFE9] shadow-sm focus-visible:ring-white"
                  : "hb-btn-accent !rounded-lg !gap-1.5 focus-visible:ring-hb-navy"
              }`}
            >
              <Icon d={ICON.pen} className="w-4 h-4 shrink-0" />
              <span>간편 견적</span>
            </button>

            {children}

            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", {
                  location: "site_header_mobile",
                })
              }
              aria-label="대표전화 상담 연결"
              className={`inline-flex md:hidden items-center gap-1 h-9 px-3 rounded-lg border text-hb-xs font-bold active:scale-[0.96] transition-[background-color,border-color,color,transform] duration-150 whitespace-nowrap ${
                isDarkHeroOverlay
                  ? "border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                  : isTransparentHero
                  ? "border-[#141A23]/15 bg-white/60 text-[#141A23] backdrop-blur-sm hover:bg-white"
                  : "border-hb-border bg-hb-surface-muted text-hb-text-primary hover:bg-hb-warm"
              }`}
            >
              <Icon
                d={ICON.phone}
                className={`w-3.5 h-3.5 shrink-0 ${
                  isDarkHeroOverlay ? "text-[#FF8A50]" : "text-hb-brand-text"
                }`}
              />
              <span>전화</span>
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={`grid h-9 w-9 place-items-center rounded-lg border lg:hidden focus-visible:outline-none focus-visible:ring-2 active:scale-[0.96] transition-[background-color,border-color,color,transform] duration-150 ${
                isDarkHeroOverlay
                  ? "border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:ring-white"
                  : isTransparentHero
                  ? "border-[#141A23]/15 bg-white/60 text-[#141A23] backdrop-blur-sm hover:bg-white focus-visible:ring-hb-navy"
                  : "border-hb-border bg-hb-surface-muted text-hb-text-primary hover:bg-hb-warm focus-visible:ring-hb-navy"
              }`}
              aria-label="전체 메뉴 열기"
              aria-expanded={menuOpen}
            >
              <Icon d={ICON.menu} className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* 모바일·태블릿 내비게이션 드로어 (Native Top-Layer <dialog>) */}
      <dialog
        ref={drawerRef}
        aria-label="모바일 전체 메뉴"
        {...({ closedby: "any" } as Record<string, string>)}
        onPointerDown={handleDrawerPointerDown}
        onPointerUp={handleDrawerPointerUp}
        onCancel={(e) => {
          e.preventDefault();
          setMenuOpen(false);
        }}
        onClose={() => {
          if (menuOpen) setMenuOpen(false);
        }}
        className="hb-drawer lg:hidden h-dvh w-full max-w-full bg-white p-0 border-0 overscroll-contain flex-col open:flex"
      >
        <div className="flex h-[64px] items-center justify-between border-b border-[#E2DDD3] px-5 sm:px-8 bg-white">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="inline-flex items-center"
          >
            <HanbatBrandLogo size="compact" />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-[#E2DDD3] bg-[#FAF9F6] text-[#141A23] active:scale-[0.96] transition-transform"
            aria-label="메뉴 닫기"
          >
            <Icon d={ICON.close} className="w-5 h-5" />
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-6"
          aria-label="모바일 메뉴 목록"
        >
          <div>
            <p className="text-hb-xs font-bold text-[#64748B] mb-2">
              주요 메뉴
            </p>
            <ul className="divide-y divide-[#E2DDD3] border-y border-[#E2DDD3]">
              {HEADER_NAV.map((item) => {
                const isActive =
                  item.matchPrefix && pathname?.startsWith(item.matchPrefix);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center justify-between py-3.5 text-hb-base font-bold transition-colors ${
                        isActive
                          ? "text-[#C84312]"
                          : "text-[#141A23] hover:text-[#C84312]"
                      }`}
                    >
                      <span>{item.label}</span>
                      <Icon
                        d={ICON.right}
                        className="w-4 h-4 text-[#94A3B8]"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="text-hb-xs font-bold text-[#64748B] mb-2.5">
              품목별 바로가기
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DRAWER_QUICK_CATEGORIES.map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg border border-[#E2DDD3] bg-[#FAF9F6] px-3.5 py-3 text-hb-sm font-semibold text-[#141A23] hover:border-[#141A23] active:scale-[0.96] transition-[border-color,transform] duration-150"
                >
                  <span className="truncate">{cat.label}</span>
                  <Icon
                    d={ICON.right}
                    className="w-3.5 h-3.5 text-[#C84312] shrink-0"
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#E2DDD3] bg-[#F2EEE7] p-4 text-hb-sm text-[#334155] space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#141A23]">
                {STORE.name} 직영 매장
              </p>
              <span className="hb-trim rounded bg-[#141A23] px-2 py-1 text-hb-xs font-bold text-white">
                {STORE.since}년 개업
              </span>
            </div>
            <p>
              주소: {STORE.address} ({STORE.addressNote})
            </p>
            <p>
              영업시간: {STORE.hours} ({STORE.closed})
            </p>
            <p className="tabular-nums">
              대표전화: <strong className="text-[#141A23]">{STORE.tel}</strong>{" "}
              · 직통:{" "}
              <strong className="text-[#141A23]">{STORE.mobile}</strong>
            </p>
          </div>
        </nav>

        <div className="grid grid-cols-2 gap-2.5 border-t border-[#E2DDD3] bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <a
            href={telHref(STORE.tel)}
            onClick={() =>
              trackEvent("click_tel_consult", { location: "mobile_drawer" })
            }
            className="hb-btn-primary h-12 text-hb-sm"
          >
            <Icon d={ICON.phone} className="w-4 h-4 text-[#FF8A50]" /> 전화
            상담
          </a>
          <a
            href={STORE.kakaoChat}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("click_kakao_consult", { location: "mobile_drawer" })
            }
            className="hb-btn-kakao h-12 text-hb-sm"
          >
            <Icon d={ICON.chat} className="w-4 h-4" /> 카톡 상담
          </a>
        </div>
      </dialog>
    </>
  );
}
