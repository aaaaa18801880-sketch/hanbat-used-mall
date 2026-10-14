"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { STORE, telHref, trackEvent } from "./site";

/* ════════════════════════════════════════════════════════════
   1. 공통 아이콘 시스템
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
} as const;

export function Icon({
  d,
  className = "w-4 h-4",
  strokeWidth = 1.9,
  ...props
}: {
  d: string;
  className?: string;
  strokeWidth?: number;
  [key: string]: any;
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

/* ════════════════════════════════════════════════════════════
   2. 안전 이미지 컴포넌트 (SafeImg - LCP 우선순위 및 에러 대체 화면)
   ════════════════════════════════════════════════════════════ */
export function SafeImg({
  src,
  alt = "",
  className = "",
  eager = false,
  ...props
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  eager?: boolean;
  [key: string]: any;
}) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    return (
      <div
        role="img"
        aria-label={alt || "상품 이미지 준비 중"}
        className={`flex items-center justify-center bg-[#EFECE6] text-[#6B7280] text-[13px] font-medium select-none ${className}`}
      >
        이미지 준비 중
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
      onError={() => setError(true)}
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
      <p
        className={`text-[12px] font-bold uppercase tracking-[0.2em] ${
          dark ? "text-[#FF8A50]" : "text-[#D9531E]"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-2.5 text-[25px] font-bold leading-[1.28] tracking-[-0.02em] break-keep sm:text-[31px] lg:text-[35px] ${
          dark ? "text-white" : "text-[#0E1A2B]"
        }`}
      >
        {title}
      </h2>
      {desc && (
        <p
          className={`mt-3.5 max-w-2xl text-[15px] leading-[1.7] break-keep sm:text-[16px] ${
            dark ? "text-white/80" : "text-[#4B5260]"
          }`}
        >
          {desc}
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   4. 접근성 강화 모달 컴포넌트 (포커스 트랩, ESC 닫기, 포커스 복원)
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
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 모달 오픈 시 첫 번째 포커스 가능 요소(입력창 우선, 없으면 첫 버튼)로 포커스 이동
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
   5. 상단 공통 헤더 (SiteHeader - 스킵 링크 및 명시적 로고 치수)
   ════════════════════════════════════════════════════════════ */
const HEADER_NAV = [
  { label: "판매 제품 갤러리", href: "/gallery" },
  { label: "가정용·업소용 품목", href: "/#category-section" },
  { label: "매입 안내", href: "/#sell-section" },
  { label: "배송·설치 사례", href: "/#reviews-section" },
  { label: "오시는 길", href: "/#location-section" },
  { label: "문의게시판", href: "/inquiry" },
] as const;

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

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
      {/* 키보드 사용자용 본문 바로가기 링크 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[#0E1A2B] focus:px-4 focus:py-2.5 focus:text-[14px] focus:font-bold focus:text-white focus:shadow-lg"
      >
        본문 바로가기
      </a>

      <header className="sticky top-0 z-50 w-full border-b border-[#E4E0D8] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] sm:h-[84px] w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          <div className="flex items-center shrink-0">
            <Link
              href="/"
              className="flex items-center py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B]"
              aria-label="한밭중고전자 홈으로 이동"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="한밭중고전자"
                width={200}
                height={60}
                fetchPriority="high"
                className="h-[52px] sm:h-[60px] w-auto object-contain transition-opacity hover:opacity-90"
              />
            </Link>
          </div>

          <nav
            className="hidden lg:flex items-center justify-center gap-6 xl:gap-8"
            aria-label="주요 메뉴"
          >
            {HEADER_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="py-1.5 text-[15px] font-semibold text-[#1F2530] hover:text-[#D9531E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B] rounded transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2 sm:gap-2.5 shrink-0">
            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", { location: "site_header" })
              }
              className="hidden xl:inline-flex items-center gap-1.5 rounded-md border border-[#DDD9D1] bg-[#FAF9F7] px-3.5 h-10 text-[13px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B] transition-colors whitespace-nowrap"
              aria-label={`대표 전화 ${STORE.tel} 연결`}
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#D9531E]" />
              <span>{STORE.tel}</span>
            </a>

            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("click_kakao_consult", { location: "site_header" })
              }
              className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-md bg-[#FEE500] hover:bg-[#F2D900] text-[#191600] font-bold h-10 px-3.5 text-[13px] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B]"
              aria-label="카카오톡 채널 상담 열기"
            >
              <Icon d={ICON.chat} className="w-3.5 h-3.5" />
              <span>카톡 상담</span>
            </a>

            {children}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-md border border-[#E4E0D8] text-[#0E1A2B] lg:hidden hover:bg-[#F6F5F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B] transition-colors"
              aria-label="전체 메뉴 열기"
              aria-expanded={menuOpen}
            >
              <Icon d={ICON.menu} className="w-5 h-5" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 내비게이션 드로어 */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-white lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="모바일 전체 메뉴"
        >
          <div className="flex h-[76px] items-center justify-between border-b border-[#E4E0D8] px-4 sm:px-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="한밭중고전자"
              width={160}
              height={46}
              className="h-[46px] w-auto object-contain"
            />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-md border border-[#E4E0D8] text-[#0E1A2B]"
              aria-label="메뉴 닫기"
            >
              <Icon d={ICON.close} className="w-5 h-5" />
            </button>
          </div>

          <nav
            className="flex-1 overflow-y-auto px-5 py-4"
            aria-label="모바일 메뉴 목록"
          >
            <ul className="divide-y divide-[#EEEBE5]">
              {HEADER_NAV.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between py-4 text-[16px] font-bold text-[#0E1A2B] hover:text-[#D9531E]"
                  >
                    <span>{item.label}</span>
                    <Icon d={ICON.right} className="w-4 h-4 text-[#8A8478]" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-md border border-[#E4E0D8] bg-[#F6F5F2] p-4 text-[13px] text-[#4B5260] space-y-1.5">
              <p className="font-bold text-[#0E1A2B]">
                {STORE.name} 오프라인 매장
              </p>
              <p>
                주소: {STORE.address} ({STORE.addressNote})
              </p>
              <p>
                영업시간: {STORE.hours} ({STORE.closed})
              </p>
              <p>대표전화: {STORE.tel}</p>
            </div>
          </nav>

          <div className="grid grid-cols-2 gap-2.5 border-t border-[#E4E0D8] bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", { location: "mobile_drawer" })
              }
              className="flex h-12 items-center justify-center gap-2 rounded-md bg-[#0E1A2B] text-[14px] font-bold text-white"
            >
              <Icon d={ICON.phone} className="w-4 h-4" /> 전화 상담
            </a>
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("click_kakao_consult", { location: "mobile_drawer" })
              }
              className="flex h-12 items-center justify-center gap-2 rounded-md bg-[#FEE500] text-[14px] font-bold text-[#191600]"
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
   6. 하단 공통 푸터 (SiteFooter)
   ════════════════════════════════════════════════════════════ */
export function SiteFooter({
  isAdmin = false,
  onAdminClick,
}: {
  isAdmin?: boolean;
  onAdminClick?: () => void;
}) {
  return (
    <footer className="bg-[#0B1522] text-white/75 mt-auto border-t border-[#0E1A2B]">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-12 pb-10 border-b border-white/10">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <span className="text-[19px] font-bold text-white tracking-tight">
                {STORE.name}
              </span>
              <span className="rounded-sm bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/85">
                SINCE {STORE.since}
              </span>
            </div>
            <p className="mt-3 max-w-md text-[14px] leading-[1.7] text-white/70 break-keep">
              가정용 중고가전(냉장고·세탁기·에어컨·냉난방기)부터 식당·카페 업소용 냉장·주방 설비까지 직접 검수·세척하여 판매하고 합리적인 기준으로 매입합니다.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <a
                href={telHref(STORE.tel)}
                onClick={() =>
                  trackEvent("click_tel_consult", { location: "site_footer" })
                }
                className="inline-flex items-center gap-1.5 rounded-md bg-white/10 hover:bg-white/15 px-3.5 py-2 text-[13px] font-bold text-white transition-colors"
              >
                <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#FF8A50]" />
                {STORE.tel}
              </a>
              <a
                href={STORE.kakaoChat}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent("click_kakao_consult", { location: "site_footer" })
                }
                className="inline-flex items-center gap-1.5 rounded-md bg-[#FEE500] hover:bg-[#F2D900] px-3.5 py-2 text-[13px] font-bold text-[#191600] transition-colors"
              >
                <Icon d={ICON.chat} className="w-3.5 h-3.5" />
                카카오톡 상담
              </a>
            </div>
          </div>

          <nav
            className="grid grid-cols-2 gap-8 text-[14px] sm:grid-cols-3 lg:col-span-7"
            aria-label="푸터 메뉴"
          >
            <div>
              <p className="font-bold text-white text-[13px] uppercase tracking-wider">
                취급 품목
              </p>
              <ul className="mt-3.5 space-y-2 text-white/70">
                <li>
                  <Link
                    href="/gallery?category=에어컨/냉난방기"
                    className="hover:text-white"
                  >
                    에어컨 · 냉난방기
                  </Link>
                </li>
                <li>
                  <Link
                    href="/gallery?category=냉장고"
                    className="hover:text-white"
                  >
                    냉장고 · 김치냉장고
                  </Link>
                </li>
                <li>
                  <Link
                    href="/gallery?category=세탁기/건조기"
                    className="hover:text-white"
                  >
                    세탁기 · 건조기
                  </Link>
                </li>
                <li>
                  <Link
                    href="/gallery?category=업소용기기"
                    className="hover:text-white"
                  >
                    업소용 냉장 · 주방기기
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-white text-[13px] uppercase tracking-wider">
                고객 지원
              </p>
              <ul className="mt-3.5 space-y-2 text-white/70">
                <li>
                  <Link href="/purchase" className="hover:text-white">
                    중고가전 매입 신청
                  </Link>
                </li>
                <li>
                  <Link href="/#reviews-section" className="hover:text-white">
                    배송 · 설치 사례
                  </Link>
                </li>
                <li>
                  <Link href="/inquiry" className="hover:text-white">
                    문의게시판
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    개인정보처리방침
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="font-bold text-white text-[13px] uppercase tracking-wider">
                오프라인 매장
              </p>
              <ul className="mt-3.5 space-y-2 text-white/70 text-[13px]">
                <li>{STORE.address}</li>
                <li>({STORE.addressNote})</li>
                <li>영업시간: {STORE.hours}</li>
                <li>휴무안내: {STORE.closed}</li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-[12px] leading-relaxed text-white/55">
          <div>
            <p>
              상호: {STORE.name} · 대표: {STORE.ceo} · 사업자등록번호:{" "}
              {STORE.bizNo} · 통신판매업신고: {STORE.mailOrderNo}
            </p>
            <p className="mt-0.5">
              개인정보보호책임자: {STORE.privacyOfficer} · 주소: {STORE.address}
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} {STORE.name}. All rights reserved.
            </p>
          </div>

          {onAdminClick && (
            <button
              type="button"
              onClick={onAdminClick}
              className="text-[12px] text-white/55 hover:text-white underline underline-offset-4 transition-colors self-start sm:self-end"
            >
              {isAdmin ? "관리자 로그아웃" : "관리자 로그인"}
            </button>
          )}
        </div>
      </div>
      <div className="h-[64px] lg:hidden" aria-hidden="true" />
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════
   7. 단일화된 모바일 하단 고정 CTA 바 (MobileCtaBar)
   ════════════════════════════════════════════════════════════ */
export function MobileCtaBar({
  onInquiryClick,
}: {
  onInquiryClick?: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="모바일 빠른 상담 바"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#DDD9D1] bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(14,26,43,0.08)] lg:hidden"
    >
      <div className="grid h-[58px] grid-cols-3 divide-x divide-[#EEEBE5]">
        <a
          href={telHref(STORE.tel)}
          onClick={() =>
            trackEvent("click_tel_consult", { location: "mobile_cta_bar" })
          }
          className="flex items-center justify-center gap-1.5 bg-[#0E1A2B] text-[13px] font-bold text-white active:bg-[#1C2D47]"
        >
          <Icon d={ICON.phone} className="w-4 h-4 text-[#FF8A50]" />
          <span>전화 상담</span>
        </a>
        <a
          href={STORE.kakaoChat}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("click_kakao_consult", { location: "mobile_cta_bar" })
          }
          className="flex items-center justify-center gap-1.5 bg-[#FEE500] text-[13px] font-bold text-[#191600] active:bg-[#F2D900]"
        >
          <Icon d={ICON.chat} className="w-4 h-4" />
          <span>카톡 상담</span>
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
            className="flex items-center justify-center gap-1.5 bg-white text-[13px] font-bold text-[#0E1A2B] active:bg-[#F6F5F2]"
          >
            <Icon d={ICON.pen} className="w-4 h-4 text-[#D9531E]" />
            <span>문의 남기기</span>
          </button>
        ) : (
          <Link
            href="/inquiry"
            className="flex items-center justify-center gap-1.5 bg-white text-[13px] font-bold text-[#0E1A2B] active:bg-[#F6F5F2]"
          >
            <Icon d={ICON.pen} className="w-4 h-4 text-[#D9531E]" />
            <span>문의게시판</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export function AdminLoginModal() {
  return null;
}