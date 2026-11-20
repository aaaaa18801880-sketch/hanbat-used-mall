"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICON, Icon } from "../../lib/icons";
import { STORE, telHref, trackEvent } from "../../lib/site";
import {
  HanbatBrandLogo,
  useQuoteBasket,
  closeTopLayerElement,
  isOutsideDialogBounds,
} from "./ui-primitives";

const HEADER_NAV = [
  { label: "판매 제품", href: "/gallery", matchPrefix: "/gallery" },
  { label: "가전 매입", href: "/purchase", matchPrefix: "/purchase" },
  { label: "업소·창업", href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0", matchPrefix: "" },
  { label: "정보 게시판", href: "/guide", matchPrefix: "/guide" },
  { label: "매장 안내", href: "/#location-section", matchPrefix: "" },
] as const;

const DRAWER_QUICK_CATEGORIES = [
  { label: "에어컨·냉난방기", href: "/gallery?category=에어컨/냉난방기" },
  { label: "냉장고·김치냉장고", href: "/gallery?category=냉장고" },
  { label: "세탁기·건조기", href: "/gallery?category=세탁기/건조기" },
  { label: "업소용 냉장·주방", href: "/gallery?category=업소용기기" },
  { label: "주방·소형가전", href: "/gallery?category=기타" },
  { label: "견적 문의 게시판", href: "/inquiry" },
] as const;

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const basketCount = useQuoteBasket().length;
  const drawerRef = useRef<HTMLDialogElement>(null);

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

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer || !menuOpen) return;
    if ("closedBy" in HTMLDialogElement.prototype) return;

    let pressedOutside = false;
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutsideDialogBounds(e.clientX, e.clientY, drawer);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutsideDialogBounds(e.clientX, e.clientY, drawer)) {
        pressedOutside = false;
        setMenuOpen(false);
        return;
      }
      pressedOutside = false;
    };

    drawer.addEventListener("pointerdown", onPointerDown);
    drawer.addEventListener("pointerup", onPointerUp);
    return () => {
      drawer.removeEventListener("pointerdown", onPointerDown);
      drawer.removeEventListener("pointerup", onPointerUp);
    };
  }, [menuOpen]);

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
                  className={`hb-tab-indicator relative px-3.5 xl:px-4 py-2 text-hb-base font-semibold rounded-lg transition-[color,background-color,transform] duration-150 active:scale-[0.97] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] ${
                    isActive
                      ? "text-[#C84312] font-bold"
                      : "text-[#141A23] hover:text-[#C84312] hover:bg-[#FAF9F6]"
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFF4EE] border border-[#F5CEBE] px-3.5 h-10 text-hb-xs font-bold text-[#C84312] hover:bg-[#C84312] hover:text-white active:scale-[0.96] transition-[background-color,color,transform] duration-150 whitespace-nowrap"
                title="담아둔 관심 매물 견적함 문의하기"
              >
                <Icon d={ICON.bag} className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">견적함</span>
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C84312] px-1 text-hb-xs font-bold text-white tabular-nums">
                  {basketCount}
                </span>
              </Link>
            )}

            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", { location: "site_header" })
              }
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] px-3.5 h-10 text-hb-sm font-bold text-[#141A23] hover:border-[#CFC8BA] hover:bg-[#F5F3EE] active:scale-[0.96] transition-[background-color,border-color,transform] duration-150 whitespace-nowrap tabular-nums"
              aria-label={`전화 상담 ${STORE.tel}`}
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#C84312]" />
              <span>전화 상담</span>
              <span className="hidden xl:inline text-[#334155] font-bold">
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

            {children}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] text-[#141A23] lg:hidden hover:bg-[#F5F3EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] active:scale-[0.96] transition-[background-color,transform] duration-150"
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
        onCancel={(e) => {
          e.preventDefault();
          setMenuOpen(false);
        }}
        onClose={() => {
          if (menuOpen) setMenuOpen(false);
        }}
        className="hb-drawer lg:hidden h-dvh w-full max-w-full bg-white p-0 border-0 overscroll-contain flex-col open:flex"
      >
        <div className="flex h-[66px] items-center justify-between border-b border-[#E2E6EC] px-4 sm:px-6 bg-white">
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
            className="grid h-10 w-10 place-items-center rounded-lg border border-[#E2E6EC] bg-[#F7F8FA] text-[#141A23] active:scale-[0.96] transition-transform"
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
            <ul className="divide-y divide-[#E2E6EC] border-y border-[#E2E6EC]">
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
                          ? "text-[#E8521A]"
                          : "text-[#141A23] hover:text-[#E8521A]"
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
                  className="flex items-center justify-between rounded-lg border border-[#E2E6EC] bg-[#F7F8FA] px-3.5 py-3 text-hb-sm font-semibold text-[#141A23] hover:border-[#141A23] active:scale-[0.96] transition-[border-color,transform] duration-150"
                >
                  <span className="truncate">{cat.label}</span>
                  <Icon
                    d={ICON.right}
                    className="w-3.5 h-3.5 text-[#E8521A] shrink-0"
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E6EC] bg-[#F1F3F6] p-4 text-hb-sm text-[#334155] space-y-1.5">
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

        <div className="grid grid-cols-2 gap-2.5 border-t border-[#E2E6EC] bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
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
