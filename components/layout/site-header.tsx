"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICON, Icon } from "../../lib/icons";
import { STORE, telHref, trackEvent, triggerQuickInquiry } from "../../lib/site";
import {
  HanbatBrandLogo,
  useQuoteBasket,
  closeTopLayerElement,
  isOutsideDialogBounds,
} from "./ui-primitives";

const HEADER_NAV = [
  { label: "판매 제품", href: "/gallery", matchPrefix: "/gallery" },
  { label: "가전 매입", href: "/purchase", matchPrefix: "/purchase" },
  { label: "문의 게시판", href: "/inquiry", matchPrefix: "/inquiry" },
  { label: "정보 게시판", href: "/guide", matchPrefix: "/guide" },
  { label: "오시는 길", href: "/#location-section", matchPrefix: "" },
] as const;

const DRAWER_QUICK_CATEGORIES = [
  { label: "에어컨·냉난방기", href: "/gallery?category=에어컨/냉난방기" },
  { label: "냉장고·김치냉장고", href: "/gallery?category=냉장고" },
  { label: "세탁기·건조기", href: "/gallery?category=세탁기/건조기" },
  { label: "업소용 냉장·주방", href: "/gallery?category=업소용기기" },
  { label: "주방·소형가전", href: "/gallery?category=기타" },
  { label: "폐업·대량 매입", href: "/purchase#purchase-form" },
] as const;

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const basketCount = useQuoteBasket().length;
  const drawerRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);

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

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#141A23] focus:px-4 focus:py-2.5 focus:text-hb-sm focus:font-bold focus:text-white focus:shadow-lg"
      >
        본문 바로가기
      </a>

      <header className="hb-header sticky top-0 z-50 w-full hb-glass">
        <div className="hb-container flex h-16 sm:h-[72px] items-center justify-between gap-4">
          {/* 1. 브랜드 로고 */}
          <div className="flex items-center shrink-0">
            <Link
              href="/"
              className="inline-flex items-center py-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23]"
              aria-label={`${STORE.name} 홈으로 이동`}
            >
              <HanbatBrandLogo />
            </Link>
          </div>

          {/* 2. 핵심 내비게이션 메뉴 (절제형 타이포그래피 링크) */}
          <nav
            className="hidden lg:flex items-center justify-center gap-1 xl:gap-2"
            aria-label="주요 메뉴"
          >
            {HEADER_NAV.map((item) => {
              const isActive =
                item.matchPrefix && pathname?.startsWith(item.matchPrefix);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`hb-tab-indicator relative px-3.5 xl:px-4 py-2 text-hb-base font-semibold rounded-lg transition-[color,background-color,transform] duration-150 active:scale-[0.97] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hb-navy ${
                    isActive
                      ? "text-hb-brand-text font-bold"
                      : "text-hb-text-primary hover:text-hb-brand-text hover:bg-hb-surface-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 3. 우측 주요 행동 (견적함 · 전화 상담 · 카카오톡 상담) */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {basketCount > 0 && (
              <Link
                href="/inquiry?write=1&bundle=1"
                className="inline-flex items-center gap-1.5 rounded-xl bg-hb-warm border border-hb-border-strong px-3.5 h-10 text-hb-xs font-bold text-hb-text-primary hover:bg-hb-navy hover:text-white active:scale-[0.96] transition-[background-color,color,transform] duration-150 whitespace-nowrap"
                title="담아둔 관심 매물 견적함 문의하기"
              >
                <Icon d={ICON.bag} className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">견적함</span>
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-hb-navy px-1 text-hb-xs font-bold text-white tabular-nums">
                  {basketCount}
                </span>
              </Link>
            )}

            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", { location: "site_header" })
              }
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-hb-border bg-hb-surface-muted px-3.5 h-10 text-hb-sm font-bold text-hb-text-primary hover:border-hb-navy hover:bg-white active:scale-[0.96] transition-[background-color,border-color,transform] duration-150 whitespace-nowrap tabular-nums"
              aria-label={`전화 상담 ${STORE.tel}`}
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5 text-hb-brand-text" />
              <span>전화 상담</span>
              <span className="hidden xl:inline text-hb-text-secondary font-bold">
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
              className="hidden sm:inline-flex hb-btn-kakao h-10 px-3.5 text-hb-sm whitespace-nowrap"
              aria-label="카톡 상담 (카카오톡 채널 열기)"
            >
              <Icon d={ICON.chat} className="w-3.5 h-3.5" />
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
              className="hidden lg:inline-flex min-[1520px]:hidden hb-btn-accent h-10 px-3.5 text-hb-sm whitespace-nowrap cursor-pointer"
            >
              <Icon d={ICON.pen} className="w-3.5 h-3.5" />
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
              className="inline-flex md:hidden items-center gap-1 h-10 px-2.5 rounded-xl border border-hb-border bg-hb-surface-muted text-hb-xs font-bold text-hb-text-primary hover:bg-hb-warm active:scale-[0.96] transition-[background-color,transform] duration-150 whitespace-nowrap"
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5 text-hb-brand-text shrink-0" />
              <span>전화</span>
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-hb-border bg-hb-surface-muted text-hb-text-primary lg:hidden hover:bg-hb-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hb-navy active:scale-[0.96] transition-[background-color,transform] duration-150"
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
        <div className="flex h-[66px] items-center justify-between border-b border-[#E2DDD3] px-4 sm:px-6 bg-white">
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
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6"
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
