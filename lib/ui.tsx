"use client";

import React, { useState, useEffect } from "react";
import { STORE } from "./site";

/* ════════════════════════════════════════════════════════════
   1. 아이콘 모음 (ICON & Icon 컴포넌트)
   ════════════════════════════════════════════════════════════ */
export const ICON = {
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  chat: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  check: "M20 6 9 17l-5-5",
  close: "M18 6 6 18M6 6l12 12",
  plus: "M12 5v14M5 12h14",
  search: "m21 21-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  left: "m15 18-6-6 6-6",
  right: "m9 18 6-6-6-6",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-12 0V7a5 5 0 0 1 10 0v4",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zm-4.27 13a2 2 0 0 1-3.46 0",
  image: "M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm12.5 5-5-5-6 6-3-3-4 4",
  menu: "M4 7h16M4 12h16M4 17h16",
};

export function Icon({
  d,
  className = "w-4 h-4",
  strokeWidth = 2,
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
      {...props}
    >
      <path d={d} />
    </svg>
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
      <div className={`flex items-center justify-center bg-[#EFECE6] text-[#8A8478] text-[12px] font-medium select-none ${className}`}>
        이미지 준비중
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      onError={() => setError(true)}
      className={className}
      {...props}
    />
  );
}

/* ════════════════════════════════════════════════════════════
   3. 모달 컴포넌트 (Modal)
   ════════════════════════════════════════════════════════════ */
export function Modal({
  children,
  onClose,
  label = "모달",
  panelClassName = "",
  overlayClassName = "",
  sheet = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label?: string;
  panelClassName?: string;
  overlayClassName?: string;
  sheet?: boolean;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn ${overlayClassName}`}
      onClick={onClose}
    >
      <div
        className={`w-full ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   4. 상단 공통 헤더 (SiteHeader) - 공식 로고 및 네비게이션
   ════════════════════════════════════════════════════════════ */
export function SiteHeader({ children }: { children?: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#E4E0D8] bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-5 sm:px-6 lg:h-[72px] lg:px-8">
          {/* lib/ui.tsx 파일 내 로고 링크 영역 */}
<a href="/" className="flex shrink-0 items-center py-1 group" aria-label="한밭중고전자 홈">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src="/logo.png" // 또는 /images/logo.png
    alt="한밭중고전자"
    className="h-11 sm:h-[50px] lg:h-[54px] w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
  />
</a>

          {/* 데스크톱 메뉴 */}
          <nav className="hidden items-center gap-2 lg:flex" aria-label="주요 메뉴">
            <a
              href="/gallery"
              className="rounded-md px-3.5 py-2 text-[14px] xl:text-[15px] font-semibold text-[#4B5260] hover:text-[#0E1A2B] hover:bg-neutral-100 transition-colors"
            >
              판매 제품
            </a>
            <a
              href="/#reviews-section"
              className="rounded-md px-3.5 py-2 text-[14px] xl:text-[15px] font-semibold text-[#4B5260] hover:text-[#0E1A2B] hover:bg-neutral-100 transition-colors"
            >
              배송·설치 인증
            </a>
            <a
              href="/#location-section"
              className="rounded-md px-3.5 py-2 text-[14px] xl:text-[15px] font-semibold text-[#4B5260] hover:text-[#0E1A2B] hover:bg-neutral-100 transition-colors"
            >
              오시는 길
            </a>
            <a
              href="/inquiry"
              className="rounded-md px-3.5 py-2 text-[14px] xl:text-[15px] font-semibold text-[#4B5260] hover:text-[#0E1A2B] hover:bg-neutral-100 transition-colors"
            >
              문의게시판
            </a>
          </nav>

          {/* 우측 공통 버튼 영역 */}
          <div className="flex items-center gap-2.5">
            {children}

            <a
              href={`tel:${STORE.tel.replace(/[^0-9]/g, "")}`}
              className="hidden xl:inline-flex items-center gap-1.5 text-[14px] font-bold text-[#0E1A2B] hover:text-[#D9531E] transition-colors ml-1"
            >
              <Icon d={ICON.phone} className="w-4 h-4 text-[#D9531E]" />
              <span>{STORE.tel}</span>
            </a>

            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-md bg-[#FEE500] text-[#191600] hover:bg-[#F2D900] font-semibold h-10 px-3.5 text-[13px] shadow-xs transition-colors"
              aria-label="카카오톡 상담"
            >
              <Icon d={ICON.chat} className="w-4 h-4" />
              <span>카카오톡</span>
            </a>

            {/* 모바일 햄버거 메뉴 버튼 */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-md text-[#0E1A2B] lg:hidden hover:bg-neutral-100"
              aria-label="메뉴 열기"
            >
              <Icon d={ICON.menu} className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 전체화면 메뉴 */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white lg:hidden" role="dialog" aria-modal="true">
          <div className="flex h-16 items-center justify-between border-b border-[#EEEBE5] px-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="한밭중고전자" className="h-9 sm:h-[42px] w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="grid h-10 w-10 place-items-center text-[#0E1A2B]"
              aria-label="메뉴 닫기"
            >
              <Icon d={ICON.close} className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="divide-y divide-[#F0EDE7]">
              <li>
                <a href="/gallery" onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-4 text-[16px] font-bold text-[#0E1A2B]">
                  판매 제품 <Icon d={ICON.right} className="w-4 h-4 text-neutral-400" />
                </a>
              </li>
              <li>
                <a href="/#reviews-section" onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-4 text-[16px] font-bold text-[#0E1A2B]">
                  배송·설치 인증 <Icon d={ICON.right} className="w-4 h-4 text-neutral-400" />
                </a>
              </li>
              <li>
                <a href="/#location-section" onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-4 text-[16px] font-bold text-[#0E1A2B]">
                  오시는 길 <Icon d={ICON.right} className="w-4 h-4 text-neutral-400" />
                </a>
              </li>
              <li>
                <a href="/inquiry" onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-4 text-[16px] font-bold text-[#0E1A2B]">
                  문의게시판 <Icon d={ICON.right} className="w-4 h-4 text-neutral-400" />
                </a>
              </li>
            </ul>

            <div className="mt-6 rounded-md bg-[#F6F5F2] p-4 text-[14px] text-[#4B5260]">
              <p className="font-bold text-[#0E1A2B]">{STORE.hours}</p>
              <p className="mt-1">{STORE.address}</p>
            </div>
          </nav>

          <div className="grid grid-cols-2 gap-2 border-t border-[#EEEBE5] p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <a href={`tel:${STORE.tel.replace(/[^0-9]/g, "")}`} className="flex h-12 items-center justify-center gap-1.5 rounded-md bg-[#0E1A2B] text-[15px] font-bold text-white">
              <Icon d={ICON.phone} className="w-4 h-4" /> 전화 문의
            </a>
            <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-1.5 rounded-md bg-[#FEE500] text-[15px] font-bold text-[#191600]">
              <Icon d={ICON.chat} className="w-4 h-4" /> 카카오톡
            </a>
          </div>
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   5. 하단 푸터 (SiteFooter)
   ════════════════════════════════════════════════════════════ */
export function SiteFooter({
  isAdmin = false,
  onAdminClick,
}: {
  isAdmin?: boolean;
  onAdminClick?: () => void;
}) {
  return (
    <footer className="border-t border-[#E4E0D8] bg-white text-[#4B5260] text-[13px] py-10 sm:py-12 mt-auto">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#EEEBE5]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-[16px] text-[#0E1A2B]">{STORE.name}</span>
              <span className="text-[11px] font-semibold text-[#8A8478] bg-[#F6F5F2] border border-[#E4E0D8] px-2 py-0.5 rounded">
                SINCE {STORE.since}
              </span>
            </div>
            <p className="text-[13px] text-[#6B7280] leading-relaxed break-keep">
              대전·충청 중고가전 및 식당·카페 업소용 주방기기 전문 매입·판매 매장
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`tel:${STORE.tel.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center gap-1.5 font-bold text-[#0E1A2B] bg-[#F6F5F2] border border-[#DDD9D1] px-3.5 py-2 rounded-md hover:bg-[#EFECE6] transition-colors"
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#D9531E]" />
              {STORE.tel}
            </a>
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-[#191600] bg-[#FEE500] hover:bg-[#F2D900] px-3.5 py-2 rounded-md transition-colors"
            >
              <Icon d={ICON.chat} className="w-3.5 h-3.5" />
              카카오톡 상담
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] text-[#8A8478]">
          <div className="space-y-1">
            <p>
              매장 주소: {STORE.address} | 영업시간: {STORE.hours}
            </p>
            <p>© {STORE.name}. All rights reserved.</p>
          </div>
          {onAdminClick && (
            <button
              type="button"
              onClick={onAdminClick}
              className="text-[11px] text-[#8A8478] hover:text-[#0E1A2B] underline decoration-neutral-300 underline-offset-4 transition-colors"
            >
              {isAdmin ? "관리자 모드 로그아웃" : "관리자 로그인"}
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════
   6. 모바일 하단 CTA 바 (MobileCtaBar)
   ════════════════════════════════════════════════════════════ */
export function MobileCtaBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-[#DDD9D1] bg-white/95 backdrop-blur-md px-4 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] shadow-lg">
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`tel:${STORE.tel.replace(/[^0-9]/g, "")}`}
          className="flex h-11 items-center justify-center gap-1.5 rounded-md bg-[#0E1A2B] text-[14px] font-bold text-white shadow-xs active:bg-[#22324A]"
        >
          <Icon d={ICON.phone} className="w-4 h-4 text-white" /> 전화 문의
        </a>
        <a
          href={STORE.kakaoChat}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center justify-center gap-1.5 rounded-md bg-[#FEE500] text-[14px] font-bold text-[#191600] shadow-xs active:bg-[#F2D900]"
        >
          <Icon d={ICON.chat} className="w-4 h-4" /> 카톡 상담
        </a>
      </div>
    </div>
  );
}

/* 호환용 빈 컴포넌트 */
export function AdminLoginModal() {
  return null;
}