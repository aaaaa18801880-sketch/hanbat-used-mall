"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import {
  STORE,
  telHref,
  smsHref,
  trackEvent,
  getQuoteBasket,
  removeQuoteBasketItem,
  clearQuoteBasket,
  toggleQuoteBasketItem,
  QUOTE_BASKET_EVENT,
  formatProductPrice,
  isProductSold,
  type QuoteBasketItem,
} from "./site";

/* ════════════════════════════════════════════════════════════
   1. 공통 아이콘 및 브랜드 로고 시스템
   ════════════════════════════════════════════════════════════ */
export const ICON = {
  phone:
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  chat: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  check: "M20 6 9 17l-5-5",
  close: "M18 6 6 18M6 6l12 12",
  plus: "M12 5v14M5 12h14",
  search: "m21 21-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  left: "m15 18-6-6 6-6",
  right: "m9 18 6-6-6-6",
  down: "m6 9 6 6 6-6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-12 0V7a5 5 0 0 1 10 0v4",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zm-4.27 13a2 2 0 0 1-3.46 0",
  image:
    "M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm12.5 5-5-5-6 6-3-3-4 4",
  camera:
    "M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  pen: "M4 20h4L19 9l-4-4L4 16v4z",
  pin: "M12 21s-7-5.686-7-11a7 7 0 1 1 14 0c0 5.314-7 11-7 11zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  menu: "M4 7h16M4 12h16M4 17h16",
  bag: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  copy: "M9 9h11v11H9zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
} as const;

export function Icon({
  d,
  className = "w-4 h-4",
  strokeWidth = 1.9,
  ...props
}: React.SVGProps<SVGSVGElement> & {
  d: string;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

/**
 * 한밭중고전자 벡터 브랜드 마크 (심볼 + 한글 브랜드명)
 * - 작은 장식 문구를 배제하고 모든 해상도(헤더·모바일·푸터)에서 선명한 가독성을 유지합니다.
 */
export function HanbatBrandLogo({
  dark = false,
  size = "default",
}: {
  dark?: boolean;
  size?: "default" | "compact";
}) {
  const pillarFill = dark ? "#FFFFFF" : "#0E1A2B";
  const accentFill = dark ? "#FF7A45" : "#D9531E";

  return (
    <span className="inline-flex items-center gap-2.5 sm:gap-3 select-none">
      <svg
        viewBox="0 0 44 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={
          size === "compact"
            ? "h-8 w-9 shrink-0"
            : "h-9 w-10 sm:h-10 sm:w-11 shrink-0"
        }
      >
        {/* 좌측 H 기둥 상·하단 */}
        <path d="M2 7.5L12.5 2V15.5L2 22V7.5Z" fill={pillarFill} />
        <path d="M2 27.5L12.5 21V38H2V27.5Z" fill={pillarFill} />
        {/* 우측 H 기둥 상·하단 */}
        <path d="M42 7.5L31.5 2V15.5L42 22V7.5Z" fill={pillarFill} />
        <path d="M42 27.5L31.5 21V38H42V27.5Z" fill={pillarFill} />
        {/* 중앙 오렌지 지붕 라인 */}
        <path
          d="M22 9L2 21.5V26.5L22 14L42 26.5V21.5L22 9Z"
          fill={accentFill}
        />
        {/* 중앙 4분할 창문 */}
        <rect x="16.5" y="21" width="4.6" height="4.6" rx="1" fill={accentFill} />
        <rect x="22.9" y="21" width="4.6" height="4.6" rx="1" fill={accentFill} />
        <rect x="16.5" y="27.2" width="4.6" height="4.6" rx="1" fill={accentFill} />
        <rect x="22.9" y="27.2" width="4.6" height="4.6" rx="1" fill={accentFill} />
      </svg>
      <span
        className={`font-extrabold tracking-[-0.035em] leading-none ${
          size === "compact"
            ? "text-[19px] sm:text-[20px]"
            : "text-[20px] xs:text-[22px] sm:text-[24px]"
        } ${dark ? "text-white" : "text-[#0E1A2B]"}`}
      >
        {STORE.name}
      </span>
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   2. 안전 이미지 컴포넌트 (SafeImg)
   ════════════════════════════════════════════════════════════ */
export function SafeImg({
  src,
  alt = "",
  className = "",
  eager = false,
  ...props
}: Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "className"
> & {
  src?: string | null;
  alt?: string;
  className?: string;
  eager?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null | undefined>(
    undefined
  );
  const error = Boolean(src && failedSrc === src);

  if (!src || error) {
    return (
      <div
        role="img"
        aria-label={alt || "상품 이미지 준비 중"}
        className={`flex flex-col items-center justify-center gap-1 bg-[#F0EDE7] text-[#667085] text-[12.5px] font-medium select-none ${className}`}
      >
        <Icon d={ICON.image} className="w-5 h-5 text-[#858076]/70" />
        <span>이미지 준비 중</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding={eager ? "sync" : "async"}
      onError={() => setFailedSrc(src)}
      className={className}
      {...props}
    />
  );
}

/* ════════════════════════════════════════════════════════════
   3. 공통 섹션 헤더 (SectionHeading)
   ════════════════════════════════════════════════════════════ */
export function SectionHeading({
  eyebrow,
  title,
  desc,
  dark = false,
  className = "",
}: {
  eyebrow: string;
  title: React.ReactNode;
  desc?: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow && (
        <div className="inline-flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              dark ? "bg-[#FF8A50]" : "bg-[#D9531E]"
            }`}
            aria-hidden="true"
          />
          <p
            className={`text-[13px] sm:text-[13.5px] font-bold tracking-[-0.01em] ${
              dark ? "text-[#FF8A50]" : "text-[#D9531E]"
            }`}
          >
            {eyebrow}
          </p>
        </div>
      )}
      <h2
        className={`mt-2 text-[24px] font-extrabold leading-[1.26] tracking-[-0.025em] break-keep sm:text-[30px] lg:text-[34px] ${
          dark ? "text-white" : "text-[#0E1A2B]"
        }`}
      >
        {title}
      </h2>
      {desc && (
        <p
          className={`mt-2.5 max-w-2xl text-[15px] leading-[1.68] break-keep sm:text-[16px] ${
            dark ? "text-white/75" : "text-[#434B59]"
          }`}
        >
          {desc}
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   4. 접근성 강화 모달 컴포넌트
   ════════════════════════════════════════════════════════════ */
export function Modal({
  children,
  onClose,
  label = "대화상자",
  panelClassName = "",
  overlayClassName = "",
  sheet = false,
  open = true,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label?: string;
  panelClassName?: string;
  overlayClassName?: string;
  sheet?: boolean;
  open?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      if (!panelRef.current) return;
      const autoFocusEl = panelRef.current.querySelector<HTMLElement>(
        "[autofocus], input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [href]"
      );
      if (autoFocusEl) {
        autoFocusEl.focus();
      } else {
        panelRef.current.focus();
      }
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={`fixed inset-0 z-[70] flex justify-center ${
        sheet
          ? "items-end sm:items-center p-0 sm:p-4"
          : "items-center p-3 sm:p-6"
      } bg-[#0E1A2B]/65 backdrop-blur-xs ${overlayClassName}`}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`w-full focus:outline-none ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   5. 상단 공통 헤더 (SiteHeader — 단일 1단 구조: 로고 · 핵심 메뉴 · 전화 · 카톡)
   ════════════════════════════════════════════════════════════ */
const HEADER_NAV = [
  { label: "판매 제품", href: "/gallery", matchPrefix: "/gallery" },
  { label: "취급 품목", href: "/#category-section", matchPrefix: "" },
  { label: "가전 매입", href: "/purchase", matchPrefix: "/purchase" },
  { label: "출고·설치", href: "/#reviews-section", matchPrefix: "" },
  { label: "매장 위치", href: "/#location-section", matchPrefix: "" },
  { label: "상담·문의", href: "/inquiry", matchPrefix: "/inquiry" },
] as const;

const DRAWER_QUICK_CATEGORIES = [
  { label: "에어컨·냉난방기", href: "/gallery?category=에어컨/냉난방기" },
  { label: "냉장고·김치냉장고", href: "/gallery?category=냉장고" },
  { label: "세탁기·건조기", href: "/gallery?category=세탁기/건조기" },
  { label: "업소용 냉장·주방", href: "/gallery?category=업소용기기" },
  { label: "주방·소형가전", href: "/gallery?category=주방/소형가전" },
  { label: "전체 판매 제품", href: "/gallery" },
] as const;

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [basketCount, setBasketCount] = useState(0);

  useEffect(() => {
    const syncBasket = () => setBasketCount(getQuoteBasket().length);
    syncBasket();
    window.addEventListener(QUOTE_BASKET_EVENT, syncBasket);
    window.addEventListener("storage", syncBasket);
    return () => {
      window.removeEventListener(QUOTE_BASKET_EVENT, syncBasket);
      window.removeEventListener("storage", syncBasket);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#0E1A2B] focus:px-4 focus:py-2.5 focus:text-[14px] focus:font-bold focus:text-white focus:shadow-lg"
      >
        본문 바로가기
      </a>

      <header className="sticky top-0 z-50 w-full border-b border-[#E6E3DC] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] sm:h-[76px] w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
          {/* 1. 브랜드 로고 (심볼 + 한글 브랜드명 단일 라인) */}
          <div className="flex items-center shrink-0">
            <Link
              href="/"
              className="inline-flex items-center py-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B]"
              aria-label="한밭중고전자 홈으로 이동"
            >
              <HanbatBrandLogo />
            </Link>
          </div>

          {/* 2. 핵심 내비게이션 메뉴 */}
          <nav
            className="hidden lg:flex items-center justify-center gap-1 xl:gap-1.5"
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
                  className={`relative px-3 xl:px-3.5 py-2 text-[15px] xl:text-[15.5px] font-bold rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B] ${
                    isActive
                      ? "text-[#D9531E] bg-[#FFF5F0]"
                      : "text-[#0E1A2B] hover:text-[#D9531E] hover:bg-[#F7F6F3]"
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9531E] bg-[#FFF5F0] px-3 h-10 text-[13px] font-bold text-[#D9531E] hover:bg-[#D9531E] hover:text-white transition-colors whitespace-nowrap"
                title="담아둔 관심 매물 일괄 견적 문의하기"
              >
                <Icon d={ICON.bag} className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">견적함</span>
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D9531E] px-1 text-[11px] font-bold text-white tabular-nums">
                  {basketCount}
                </span>
              </Link>
            )}

            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", { location: "site_header" })
              }
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-[#D7D2C8] bg-[#FAF9F7] px-3.5 h-10 text-[13.5px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B] hover:bg-white transition-colors whitespace-nowrap tabular-nums"
              aria-label={`전화 상담 ${STORE.tel}`}
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#D9531E]" />
              <span>전화 상담</span>
              <span className="hidden xl:inline text-[#434B59] font-semibold">
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
              className="hidden sm:inline-flex hb-btn-kakao h-10 px-3.5 text-[13.5px] whitespace-nowrap"
              aria-label="카카오톡 채널 상담 열기"
            >
              <Icon d={ICON.chat} className="w-3.5 h-3.5" />
              <span>카톡 상담</span>
            </a>

            {children}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-[#E6E3DC] bg-[#FAF9F7] text-[#0E1A2B] lg:hidden hover:bg-[#F0EDE7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B] transition-colors"
              aria-label="전체 메뉴 열기"
              aria-expanded={menuOpen}
            >
              <Icon d={ICON.menu} className="w-5 h-5" strokeWidth={2.1} />
            </button>
          </div>
        </div>
      </header>
      <div
        id="main-content"
        tabIndex={-1}
        className="sr-only focus:outline-none"
      />

      {/* 모바일·태블릿 내비게이션 드로어 */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-white lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="모바일 전체 메뉴"
        >
          <div className="flex h-[68px] items-center justify-between border-b border-[#E6E3DC] px-4 sm:px-6 bg-white">
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
              className="grid h-10 w-10 place-items-center rounded-lg border border-[#E6E3DC] bg-[#FAF9F7] text-[#0E1A2B]"
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
              <p className="text-[12.5px] font-bold text-[#667085] mb-2">
                주요 서비스 메뉴
              </p>
              <ul className="divide-y divide-[#E6E3DC] border-y border-[#E6E3DC]">
                {HEADER_NAV.map((item) => {
                  const isActive =
                    item.matchPrefix && pathname?.startsWith(item.matchPrefix);
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center justify-between py-3.5 text-[16px] font-bold transition-colors ${
                          isActive
                            ? "text-[#D9531E]"
                            : "text-[#0E1A2B] hover:text-[#D9531E]"
                        }`}
                      >
                        <span>{item.label}</span>
                        <Icon
                          d={ICON.right}
                          className="w-4 h-4 text-[#858076]"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <p className="text-[12.5px] font-bold text-[#667085] mb-2.5">
                품목별 매물 바로가기
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DRAWER_QUICK_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-lg border border-[#E6E3DC] bg-[#FAF9F7] px-3.5 py-3 text-[13.5px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B]"
                  >
                    <span className="truncate">{cat.label}</span>
                    <Icon
                      d={ICON.right}
                      className="w-3.5 h-3.5 text-[#D9531E] shrink-0"
                    />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#E6E3DC] bg-[#F7F6F3] p-4 text-[13.5px] text-[#434B59] space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#0E1A2B]">
                  {STORE.name} 직영 매장
                </p>
                <span className="rounded bg-[#0E1A2B] px-2 py-0.5 text-[11px] font-bold text-white">
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
                대표전화: <strong className="text-[#0E1A2B]">{STORE.tel}</strong>{" "}
                · 직통:{" "}
                <strong className="text-[#0E1A2B]">{STORE.mobile}</strong>
              </p>
            </div>
          </nav>

          <div className="grid grid-cols-2 gap-2.5 border-t border-[#E6E3DC] bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", { location: "mobile_drawer" })
              }
              className="hb-btn-primary h-12 text-[14.5px]"
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
              className="hb-btn-kakao h-12 text-[14.5px]"
            >
              <Icon d={ICON.chat} className="w-4 h-4" /> 카톡 상담
            </a>
          </div>
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   6. 관심 매물 플로팅 견적함 바 (QuoteBasketFloatingBar)
   ════════════════════════════════════════════════════════════ */
export function QuoteBasketFloatingBar() {
  const [items, setItems] = useState<QuoteBasketItem[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const sync = () => setItems(getQuoteBasket());
    sync();
    window.addEventListener(QUOTE_BASKET_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(QUOTE_BASKET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <aside
      aria-label="관심 매물 견적함"
      className="fixed bottom-[64px] lg:bottom-6 right-2.5 sm:right-6 z-40 w-[calc(100vw-20px)] max-w-[400px] rounded-lg border border-white/15 bg-[#0E1A2B] text-white shadow-floating"
    >
      {expanded && (
        <div className="border-b border-white/15 p-3.5 max-h-[240px] overflow-y-auto space-y-2 bg-[#132238] rounded-t-lg">
          <div className="flex items-center justify-between text-[12px] text-white/75 pb-1">
            <span className="font-semibold">
              담아둔 관심 매물 ({items.length}건)
            </span>
            <button
              type="button"
              onClick={() => {
                clearQuoteBasket();
                toast.success("견적함을 비웠습니다.");
              }}
              className="text-[11.5px] font-semibold text-[#FF8A50] hover:underline"
            >
              전체 비우기
            </button>
          </div>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded bg-white/5 px-2.5 py-2 text-[12.5px]"
            >
              <Link
                href={`/${item.id}`}
                className="min-w-0 flex-1 truncate font-semibold text-white hover:text-[#FF8A50]"
              >
                {item.title}
              </Link>
              <span className="shrink-0 text-[11.5px] text-white/75 tabular-nums">
                {formatProductPrice(item.price, item.category)}
              </span>
              <button
                type="button"
                onClick={() => removeQuoteBasketItem(item.id)}
                aria-label={`${item.title} 견적함에서 제거`}
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-red-600 hover:text-white"
              >
                <Icon d={ICON.close} className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 items-center gap-2 text-left text-[13px] font-bold text-white hover:text-[#FF8A50]"
        >
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D9531E] text-[12px] font-bold text-white tabular-nums">
            {items.length}
          </span>
          <span className="truncate">
            관심 매물 견적함{" "}
            <span className="text-[11.5px] font-normal text-white/70">
              ({expanded ? "접기" : "열기"})
            </span>
          </span>
        </button>

        <Link
          href="/inquiry?write=1&bundle=1"
          className="hb-btn-accent h-9 px-3.5 text-[12.5px] shrink-0 whitespace-nowrap"
        >
          <span>일괄 견적 문의</span>
          <Icon d={ICON.arrow} className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}

/* ════════════════════════════════════════════════════════════
   6-2. 아정당 스타일 우측 플로팅 퀵 상담 윙 (FloatingQuickWing)
   ════════════════════════════════════════════════════════════ */
export function FloatingQuickWing() {
  const [isOpen, setIsOpen] = useState(true);

  const handleInquiryClick = (type: string) => {
    trackEvent("begin_buyback_inquiry", {
      category: type,
      location: "floating_quick_wing",
    });

    if (typeof window !== "undefined") {
      const el = document.getElementById("inquiry-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
      window.location.href = `/inquiry?write=1&type=${encodeURIComponent(type)}`;
    }
  };

  return (
    <aside
      aria-label="빠른 상담 바로가기"
      className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end transition-transform duration-300 ease-out select-none ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* 접기 / 펼치기 토글 탭 버튼 (패널 좌측 바깥에 항상 부착) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "상담 퀵메뉴 접기" : "상담 퀵메뉴 열기"}
        title={isOpen ? "상담창 접기" : "상담창 열기"}
        className="absolute -left-9 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center py-3 px-1.5 rounded-l-xl border-y border-l border-[#CBD5E1] bg-white text-[#0E1A2B] shadow-[-4px_2px_12px_rgba(14,26,43,0.1)] hover:bg-[#FAF9F7] transition-colors cursor-pointer"
      >
        <span className="text-[13px] font-extrabold text-[#D9531E] leading-none mb-1">
          {isOpen ? "›" : "‹"}
        </span>
        <span className="text-[11px] font-extrabold text-[#0E1A2B] [writing-mode:vertical-lr] tracking-widest">
          상담하기
        </span>
      </button>

      {/* 본체 카드 (아정당 스타일 플로팅 윙) */}
      <div className="w-[184px] rounded-l-2xl border-y border-l border-[#CBD5E1] bg-white p-3.5 shadow-[-8px_6px_28px_rgba(14,26,43,0.12)] space-y-2.5">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between px-1 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full bg-[#10B981] animate-pulse"
              aria-hidden="true"
            />
            <strong className="text-[15px] font-extrabold text-[#0E1A2B] tracking-tight">
              상담하기
            </strong>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[12px] font-bold text-[#8A8478] hover:text-[#0E1A2B] cursor-pointer"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 1. 비밀 혜택 1초 견적 (연하늘색 버튼) */}
        <button
          type="button"
          onClick={() => handleInquiryClick("내 물건 팔기")}
          className="group flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#EEF4FF] hover:bg-[#DBEAFE] py-2.5 px-3 text-[13px] font-extrabold text-[#1D4ED8] transition-colors border border-[#BFDBFE] cursor-pointer"
        >
          <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#1D4ED8] text-[10px] font-black text-white">
            ₩
          </span>
          <span className="tracking-tight">1초 맞춤 견적</span>
        </button>

        {/* 2. 실시간 카톡상담 (카카오 옐로우 버튼) */}
        <a
          href={STORE.kakaoChat}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("click_kakao_consult", { location: "floating_quick_wing" })
          }
          className="group flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] py-2.5 px-3 text-[13px] font-extrabold text-[#191600] transition-colors shadow-2xs cursor-pointer"
        >
          <svg
            className="w-4 h-4 shrink-0 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 3c-5.5 0-10 3.6-10 8 0 2.8 1.8 5.2 4.6 6.6l-.9 3.4c-.1.3.2.6.5.4l4.2-2.8c.5.1 1.1.1 1.6.1 5.5 0 10-3.6 10-8s-4.5-7.7-10-7.7z" />
          </svg>
          <span className="tracking-tight">실시간 카톡상담</span>
        </a>

        {/* 3. 맞춤 상담 신청 (밝은 그레이 버튼) */}
        <button
          type="button"
          onClick={() => handleInquiryClick("구매 문의")}
          className="group flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EDF2F7] py-2.5 px-3 text-[13px] font-extrabold text-[#0E1A2B] transition-colors border border-[#CBD5E1] cursor-pointer"
        >
          <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#D9531E]" />
          <span className="tracking-tight">맞춤 상담 신청</span>
        </button>

        {/* 4. 나에게 맞는 상품 찾기 (로얄 블루 / 네이비 버튼) */}
        <Link
          href="/gallery"
          onClick={() =>
            trackEvent("filter_gallery", { location: "floating_quick_wing" })
          }
          className="group flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0E1A2B] hover:bg-[#1C2D47] py-2.5 px-3 text-[13px] font-extrabold text-white transition-colors shadow-2xs"
        >
          <span className="tracking-tight">나에게 맞는 상품 찾기</span>
        </Link>

        {/* 5. 직통 전화 카드 (아정당 하단 박스 스타일) */}
        <div className="rounded-xl bg-[#F0F5FF] border border-[#DBEAFE] p-2.5 text-center space-y-1">
          <p className="text-[11px] font-bold text-[#4B5260] leading-tight">
            한밭중고전자 365일
            <br />
            <span className="text-[#1D4ED8] font-extrabold">전화상담 환영</span>
          </p>

          <a
            href={telHref(STORE.tel)}
            onClick={() =>
              trackEvent("click_tel_consult", { location: "floating_quick_wing_tel" })
            }
            className="block text-[17.5px] font-extrabold text-[#0E1A2B] hover:text-[#D9531E] tracking-tight tabular-nums transition-colors"
          >
            {STORE.tel}
          </a>

          <a
            href={telHref(STORE.mobile)}
            onClick={() =>
              trackEvent("click_tel_consult", {
                location: "floating_quick_wing_mobile",
              })
            }
            className="block text-[12px] font-bold text-[#64748B] hover:text-[#0E1A2B] tabular-nums transition-colors"
          >
            직통: {STORE.mobile}
          </a>

          <div className="pt-1">
            <a
              href={telHref(STORE.tel)}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-[#D9531E] border border-[#FADCD0] shadow-2xs hover:bg-[#FFF5F0] transition-colors"
            >
              <Icon d={ICON.phone} className="w-3 h-3" />
              <span>전화 바로걸기</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ════════════════════════════════════════════════════════════
   7. 하단 공통 푸터 (SiteFooter)
   ════════════════════════════════════════════════════════════ */
export function SiteFooter({
  isAdmin = false,
  onAdminClick,
}: {
  isAdmin?: boolean;
  onAdminClick?: () => void;
}) {
  return (
    <>
      <QuoteBasketFloatingBar />
      <FloatingQuickWing />
      <footer className="bg-[#0E1A2B] text-white/80 mt-auto border-t border-[#1C2D47]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-12 pb-10 border-b border-white/10">
            {/* 브랜드 및 직통 고객센터 영역 */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <HanbatBrandLogo dark size="compact" />
                <span className="rounded bg-[#D9531E]/20 border border-[#D9531E]/40 px-2 py-0.5 text-[11px] font-bold text-[#FF8A50]">
                  {STORE.since}년 개업
                </span>
              </div>
              <p className="max-w-md text-[14px] leading-[1.7] text-white/75 break-keep">
                가정용 중고가전(에어컨·냉난방기·냉장고·세탁기·건조기)부터 식당·카페 업소용 냉장·주방 설비까지 직접 분해·고압세척 및 작동 검수를 마친 정직한 상품만 출고합니다.
              </p>

              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 max-w-md">
                <p className="text-[12px] font-bold text-[#FF8A50]">
                  고객상담 및 방문 매입 직통 센터
                </p>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 tabular-nums">
                  <a
                    href={telHref(STORE.tel)}
                    onClick={() =>
                      trackEvent("click_tel_consult", {
                        location: "site_footer",
                      })
                    }
                    className="text-[21px] font-extrabold text-white hover:text-[#FF8A50] transition-colors"
                  >
                    {STORE.tel}
                  </a>
                  <a
                    href={telHref(STORE.mobile)}
                    onClick={() =>
                      trackEvent("click_tel_consult", {
                        location: "site_footer_mobile",
                      })
                    }
                    className="text-[14px] font-semibold text-white/80 hover:text-white transition-colors"
                  >
                    직통 {STORE.mobile}
                  </a>
                </div>
                <p className="mt-1 text-[12.5px] text-white/65">
                  영업시간 {STORE.hours} · {STORE.closed} · 세금계산서 즉시 발행
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href={telHref(STORE.tel)}
                  onClick={() =>
                    trackEvent("click_tel_consult", { location: "site_footer" })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3.5 py-2.5 text-[13px] font-bold text-white transition-colors tabular-nums"
                >
                  <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#FF8A50]" />
                  전화 상담 연결
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent("click_kakao_consult", {
                      location: "site_footer",
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#FEE500] hover:bg-[#F2D900] px-3.5 py-2.5 text-[13px] font-bold text-[#191600] transition-colors"
                >
                  <Icon d={ICON.chat} className="w-3.5 h-3.5" />
                  카카오톡 실시간 상담
                </a>
              </div>
            </div>

            {/* 내비게이션 링크 */}
            <nav
              className="grid grid-cols-2 gap-8 text-[14px] sm:grid-cols-3 lg:col-span-7"
              aria-label="푸터 메뉴"
            >
              <div>
                <p className="font-bold text-white text-[13.5px]">
                  취급 품목 안내
                </p>
                <ul className="mt-3.5 space-y-2.5 text-white/70">
                  <li>
                    <Link
                      href="/gallery?category=에어컨/냉난방기"
                      className="hover:text-white transition-colors"
                    >
                      에어컨 · 냉난방기
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/gallery?category=냉장고"
                      className="hover:text-white transition-colors"
                    >
                      냉장고 · 김치냉장고
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/gallery?category=세탁기/건조기"
                      className="hover:text-white transition-colors"
                    >
                      세탁기 · 건조기
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/gallery?category=업소용기기"
                      className="hover:text-white transition-colors"
                    >
                      업소용 냉장 · 주방기기
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/gallery?category=주방/소형가전"
                      className="hover:text-white transition-colors"
                    >
                      주방 · 생활 소형가전
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-white text-[13.5px]">
                  고객 지원 · 매입
                </p>
                <ul className="mt-3.5 space-y-2.5 text-white/70">
                  <li>
                    <Link
                      href="/gallery"
                      className="hover:text-white transition-colors"
                    >
                      실시간 판매 제품 갤러리
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/purchase"
                      className="hover:text-white transition-colors"
                    >
                      중고가전 방문 매입 신청
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/#reviews-section"
                      className="hover:text-white transition-colors"
                    >
                      배송 · 설치 현장 사례
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/inquiry"
                      className="hover:text-white transition-colors"
                    >
                      고객 문의 · 매입 게시판
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="hover:text-white transition-colors"
                    >
                      개인정보처리방침
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="font-bold text-white text-[13.5px]">
                  오프라인 매장 안내
                </p>
                <ul className="mt-3.5 space-y-2 text-white/70 text-[13.5px] leading-relaxed">
                  <li className="text-white font-semibold">{STORE.roadAddress}</li>
                  <li className="text-white/85">지번: {STORE.jibunAddress}</li>
                  <li>({STORE.addressNote})</li>
                  <li>영업시간: {STORE.hours}</li>
                  <li>휴무안내: {STORE.closed}</li>
                  <li className="pt-1 text-[#FF8A50] font-semibold">
                    매장 앞 전용 주차 · 실물 확인 가능
                  </li>
                </ul>
              </div>
            </nav>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-[12.5px] leading-relaxed text-white/55">
            <div>
              <p>
                상호: {STORE.legalName} · 대표자: {STORE.ceo} · 사업자등록번호:{" "}
                {STORE.bizNo} · 통신판매업신고: {STORE.mailOrderNo}
              </p>
              <p className="mt-0.5">
                개인정보보호책임자: {STORE.privacyOfficer} · 주소:{" "}
                {STORE.roadAddress} (지번: {STORE.jibunAddress}, {STORE.addressNote}) · 대표전화: {STORE.tel} ·
                휴대전화: {STORE.mobile}
              </p>
              <p className="mt-1">
                © {new Date().getFullYear()} {STORE.name}. All rights reserved.
              </p>
            </div>

            {onAdminClick && (
              <button
                type="button"
                onClick={onAdminClick}
                className="text-[12.5px] text-white/55 hover:text-white underline underline-offset-4 transition-colors self-start sm:self-end shrink-0"
              >
                {isAdmin ? "관리자 로그아웃" : "관리자 로그인"}
              </button>
            )}
          </div>
        </div>
        <div className="h-[54px] lg:hidden" aria-hidden="true" />
      </footer>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   8. 모바일 하단 고정 CTA 바 (최소 높이 52px 슬림 설계)
   ════════════════════════════════════════════════════════════ */
export interface MobileProductCtaContext {
  id: string;
  title: string;
  category: string;
  price: number | null;
  status?: string | null;
  modelName?: string | null;
  imageUrl?: string | null;
  inquiryHref: string;
}

export function MobileCtaBar({
  onInquiryClick,
  productContext,
}: {
  onInquiryClick?: () => void;
  productContext?: MobileProductCtaContext;
}) {
  const [inBasket, setInBasket] = useState(false);

  useEffect(() => {
    if (!productContext) return;
    const sync = () => {
      setInBasket(getQuoteBasket().some((x) => x.id === productContext.id));
    };
    sync();
    window.addEventListener(QUOTE_BASKET_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(QUOTE_BASKET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [productContext]);

  if (productContext) {
    const sold = isProductSold(productContext.status);
    const priceLabel = sold
      ? "판매완료"
      : formatProductPrice(productContext.price, productContext.category);
    const productSmsBody = `[한밭중고전자 상품문의] ${productContext.title}${
      productContext.modelName ? ` (${productContext.modelName})` : ""
    } 재고 및 가격 문의드립니다.`;

    return (
      <div
        role="region"
        aria-label="상품 상세 모바일 구매·문의 바"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D7D2C8] bg-white/98 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(14,26,43,0.08)] lg:hidden"
      >
        <div className="flex h-[56px] items-center justify-between gap-2 px-3">
          <div className="min-w-0 flex items-center gap-2">
            {!sold && (
              <button
                type="button"
                onClick={() => {
                  const res = toggleQuoteBasketItem({
                    id: productContext.id,
                    title: productContext.title,
                    category: productContext.category,
                    price: productContext.price,
                    modelName: productContext.modelName,
                    imageUrl: productContext.imageUrl,
                  });
                  if (res.limitReached) {
                    toast.error("견적함에는 최대 8개까지 담을 수 있습니다.");
                  } else if (res.added) {
                    toast.success("견적함에 상품을 담았습니다.");
                  } else {
                    toast("견적함에서 제외했습니다.");
                  }
                }}
                aria-pressed={inBasket}
                className={`flex h-9 shrink-0 flex-col items-center justify-center rounded border px-2 text-[10.5px] font-bold transition-colors ${
                  inBasket
                    ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E]"
                    : "border-[#D7D2C8] bg-[#FAF9F7] text-[#434B59]"
                }`}
              >
                <Icon
                  d={inBasket ? ICON.check : ICON.plus}
                  className="h-3.5 w-3.5"
                />
                <span>{inBasket ? "담김" : "견적함"}</span>
              </button>
            )}
            <div className="min-w-0">
              <span className="block truncate text-[10.5px] font-semibold text-[#667085]">
                {productContext.category}
              </span>
              <strong
                className={`block truncate text-[14px] font-bold leading-tight ${
                  sold ? "text-[#858076]" : "text-[#0E1A2B]"
                }`}
              >
                {priceLabel}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", {
                  location: "product_mobile_bar",
                })
              }
              aria-label="전화 상담"
              className="grid h-9 w-9 place-items-center rounded-md bg-[#0E1A2B] text-white"
            >
              <Icon d={ICON.phone} className="h-4 w-4 text-[#FF8A50]" />
            </a>
            <a
              href={smsHref(STORE.mobile, productSmsBody)}
              onClick={() =>
                trackEvent("click_sms_consult", {
                  location: "product_mobile_bar",
                })
              }
              aria-label="문자 문의"
              className="flex h-9 flex-col items-center justify-center rounded-md border border-[#D9531E] bg-[#FFF5F0] px-2 text-[10.5px] font-bold text-[#D9531E]"
            >
              <span>문자</span>
            </a>
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("click_kakao_consult", {
                  location: "product_mobile_bar",
                })
              }
              aria-label="카카오톡 문의"
              className="grid h-9 w-9 place-items-center rounded-md bg-[#FEE500] text-[#191600]"
            >
              <Icon d={ICON.chat} className="h-4 w-4" />
            </a>
            <Link
              href={productContext.inquiryHref}
              className="hb-btn-accent h-9 px-3 text-[12.5px] whitespace-nowrap"
            >
              <span>문의</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="모바일 빠른 상담 바"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D7D2C8] bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_14px_rgba(14,26,43,0.06)] lg:hidden"
    >
      <div className="grid h-[52px] grid-cols-4 divide-x divide-[#E6E3DC]">
        <a
          href={telHref(STORE.tel)}
          onClick={() =>
            trackEvent("click_tel_consult", { location: "mobile_cta_bar" })
          }
          className="flex items-center justify-center gap-1 bg-[#0E1A2B] text-[12px] font-bold text-white active:bg-[#1C2D47]"
        >
          <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#FF8A50]" />
          <span>전화상담</span>
        </a>
        <a
          href={smsHref(
            STORE.mobile,
            "[한밭중고전자 문의] 품목/지역/사진을 보내주시면 빠르게 견적을 안내해 드립니다."
          )}
          onClick={() =>
            trackEvent("click_sms_consult", { location: "mobile_cta_bar" })
          }
          className="flex items-center justify-center gap-1 bg-[#FFF5F0] text-[12px] font-bold text-[#D9531E] active:bg-[#FADCD0]"
        >
          <Icon d={ICON.chat} className="w-3.5 h-3.5" />
          <span>문자·사진</span>
        </a>
        <a
          href={STORE.kakaoChat}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("click_kakao_consult", { location: "mobile_cta_bar" })
          }
          className="flex items-center justify-center gap-1 bg-[#FEE500] text-[12px] font-bold text-[#191600] active:bg-[#F2D900]"
        >
          <Icon d={ICON.chat} className="w-3.5 h-3.5" />
          <span>카톡상담</span>
        </a>
        {onInquiryClick ? (
          <button
            type="button"
            onClick={() => {
              trackEvent("begin_buyback_inquiry", {
                location: "mobile_cta_bar",
              });
              onInquiryClick();
            }}
            className="flex items-center justify-center gap-1 bg-white text-[12px] font-bold text-[#0E1A2B] active:bg-[#F7F6F3]"
          >
            <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#D9531E]" />
            <span>문의·매입</span>
          </button>
        ) : (
          <Link
            href="/inquiry"
            className="flex items-center justify-center gap-1 bg-white text-[12px] font-bold text-[#0E1A2B] active:bg-[#F7F6F3]"
          >
            <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#D9531E]" />
            <span>문의·매입</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export function AdminLoginModal() {
  return null;
}
