"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { STORE, telHref } from "./site";

/* ───────── 아이콘 (SVG path, 이모지 대체) ───────── */
export const ICON = {
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  close: "M18 6 6 18M6 6l12 12",
  plus: "M12 5v14M5 12h14",
  left: "m15 18-6-6 6-6",
  right: "m9 18 6-6-6-6",
  down: "m6 9 6 6 6-6",
  up: "m18 15-6-6-6 6",
  check: "M20 6 9 17l-5-5",
  arrow: "M5 12h14M12 5l7 7-7 7",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  image: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  car: "M5 17h14M3 13l2-6h14l2 6v4H3v-4zM7 17v2M17 17v2",
  truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  tool: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  receipt: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  calendar: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  edit: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
} as const;

export function Icon({ d, className = "w-4 h-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ───────── 이미지: 지연 로딩 + 오류 시 대체 ───────── */
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='400' height='400' fill='#f1f5f9'/><text x='50%' y='50%' fill='#94a3b8' font-size='18' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle'>이미지 준비 중</text></svg>"
  );

export function SafeImg({ src, alt, className, eager = false, hideOnError = false }: {
  src?: string; alt: string; className?: string; eager?: boolean; hideOnError?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (hideOnError && (failed || !src)) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed || !src ? PLACEHOLDER : src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

/* ───────── 모달: ESC / 배경 클릭 / 스크롤 잠금 / 포커스 복귀 / 중첩 대응 ───────── */
const modalStack: symbol[] = [];
let lockCount = 0;

export function Modal({
  label, onClose, children,
  panelClassName = "max-w-md",
  overlayClassName = "bg-black/50",
  z = "z-50",
  sheet = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
}: {
  label: string; onClose: () => void; children: ReactNode;
  panelClassName?: string; overlayClassName?: string; z?: string;
  sheet?: boolean; closeOnBackdrop?: boolean; closeOnEsc?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const id = Symbol("modal");
    modalStack.push(id);
    const previous = document.activeElement as HTMLElement | null;
    if (lockCount++ === 0) document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEsc && modalStack[modalStack.length - 1] === id) closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      modalStack.splice(modalStack.indexOf(id), 1);
      if (--lockCount === 0) document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [closeOnEsc]);

  return (
    <div
      className={`fixed inset-0 ${z} ${overlayClassName} backdrop-blur-sm flex justify-center ${sheet ? "items-end sm:items-center sm:p-4" : "items-center p-4"}`}
      onMouseDown={(e) => { if (closeOnBackdrop && e.target === e.currentTarget) onClose(); }}
    >
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={`w-full outline-none ${panelClassName}`}>
        {children}
      </div>
    </div>
  );
}

/* ───────── 섹션 제목 ───────── */
export function SectionHead({ eyebrow, title, desc, dark = false, children }: {
  eyebrow?: string; title: string; desc?: string; dark?: boolean; children?: ReactNode;
}) {
  return (
    <div className="text-center mb-10 sm:mb-12">
      {eyebrow && <p className={`text-xs font-black tracking-widest uppercase mb-2 ${dark ? "text-blue-300" : "text-[#0b4b8b]"}`}>{eyebrow}</p>}
      <h2 className={`text-2xl sm:text-3xl font-black tracking-tight break-keep ${dark ? "text-white" : "text-slate-900"}`}>{title}</h2>
      {desc && <p className={`mt-3 text-sm sm:text-base break-keep max-w-2xl mx-auto ${dark ? "text-slate-300" : "text-slate-500"}`}>{desc}</p>}
      {children}
    </div>
  );
}

/* ───────── 공통 헤더 / 푸터 / 모바일 상담 바 ───────── */
const NAV = [
  { label: "판매 제품", href: "/gallery" },
  { label: "배송·설치 인증", href: "/#reviews-section" },
  { label: "오시는 길", href: "/#location-section" },
  { label: "문의게시판", href: "/inquiry" },
];

export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition" aria-label={`${STORE.name} 홈`}>
          <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0b4b8b] flex items-center justify-center font-black text-base sm:text-lg ring-1 ring-white/20">한</span>
          <span className="whitespace-nowrap leading-tight">
            <span className="block text-base sm:text-xl font-black">{STORE.name}</span>
            <span className="hidden sm:block text-[10px] text-slate-400">대전 중구 중촌동 · SINCE {STORE.since}</span>
          </span>
        </a>
        <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-slate-300" aria-label="주요 메뉴">
          {NAV.map((n) => <a key={n.href} href={n.href} className="hover:text-white transition">{n.label}</a>)}
        </nav>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

export function SiteFooter({ isAdmin, onAdminClick }: { isAdmin: boolean; onAdminClick: () => void }) {
  return (
    <footer className="bg-slate-950 text-slate-400 py-10 pb-28 sm:pb-10 text-xs border-t border-slate-800 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-4 space-y-3">
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 pb-4 border-b border-slate-900 text-slate-300 font-bold">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <a href="/privacy" target="_blank" className="hover:text-white transition">개인정보처리방침</a><span aria-hidden="true" className="text-slate-700">|</span>
            <a href="/#location-section" className="hover:text-white transition">오시는 길</a><span aria-hidden="true" className="text-slate-700">|</span>
            <a href={STORE.kakaoChannel} target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-yellow-400">카카오채널</a><span aria-hidden="true" className="text-slate-700">|</span>
            <a href={STORE.cafe} target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-emerald-400">제품 확인 카페</a>
          </div>
          <div className="text-slate-500 text-[11px]">© {new Date().getFullYear()} {STORE.name}. All rights reserved.</div>
        </div>
        <div className="space-y-1 text-[11px] sm:text-xs leading-relaxed text-center sm:text-left break-keep">
          <p><strong className="text-slate-200">상호 :</strong> {STORE.name} &nbsp;|&nbsp; <strong className="text-slate-200">대표자 :</strong> {STORE.ceo} &nbsp;|&nbsp; <strong className="text-slate-200">주소 :</strong> {STORE.address}</p>
          <p>
            <strong className="text-slate-200">TEL :</strong> <a href={telHref(STORE.tel)} className="hover:text-white">{STORE.tel}</a> / {STORE.tel2} &nbsp;|&nbsp;{" "}
            <strong className="text-slate-200">HP :</strong> <a href={telHref(STORE.mobile)} className="hover:text-white">{STORE.mobile}</a> &nbsp;|&nbsp;{" "}
            <strong className="text-slate-200">사업자번호 :</strong> {STORE.bizNo} &nbsp;|&nbsp;{" "}
            <strong className="text-slate-200">통신판매신고번호 :</strong> {STORE.mailOrderNo}
          </p>
          <p className="text-slate-500">개인정보 보호책임자 : {STORE.privacyOfficer}</p>
        </div>
        <div className="pt-4 border-t border-slate-900 flex justify-center sm:justify-end">
          <button type="button" onClick={onAdminClick} className="text-slate-600 hover:text-slate-400 transition underline text-[11px]">
            {isAdmin ? "관리자 로그아웃" : "관리자 로그인"}
          </button>
        </div>
      </div>
    </footer>
  );
}

export function MobileCtaBar({ inquiryHref }: { inquiryHref?: string }) {
  return (
    <div className={`sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] grid gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] ${inquiryHref ? "grid-cols-3" : "grid-cols-2"}`}>
      <a href={telHref(STORE.tel)} className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#0b4b8b] text-white font-bold text-sm">
        <Icon d={ICON.phone} /> 전화
      </a>
      <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#FEE500] text-slate-900 font-bold text-sm">
        <Icon d={ICON.chat} /> 카톡
      </a>
      {inquiryHref && (
        <a href={inquiryHref} className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm">
          <Icon d={ICON.edit} /> 견적문의
        </a>
      )}
    </div>
  );
}

/* ───────── 관리자 로그인 모달 (3개 페이지 공통) ───────── */
export function AdminLoginModal({ email, password, loading, onEmail, onPassword, onSubmit, onClose }: {
  email: string; password: string; loading: boolean;
  onEmail: (v: string) => void; onPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void; onClose: () => void;
}) {
  const field = "w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0b4b8b] focus:ring-2 focus:ring-[#0b4b8b]/15";
  return (
    <Modal label="관리자 로그인" onClose={onClose} sheet={false} panelClassName="max-w-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
        <h3 className="font-bold text-slate-900 text-base mb-1">관리자 로그인</h3>
        <p className="text-xs text-slate-500 mb-4">관리자 이메일과 비밀번호를 입력해 주세요.</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input type="email" value={email} onChange={(e) => onEmail(e.target.value)} placeholder="이메일 주소" required autoFocus autoComplete="username" className={field} />
          <input type="password" value={password} onChange={(e) => onPassword(e.target.value)} placeholder="비밀번호" required autoComplete="current-password" className={field} />
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition">취소</button>
            <button type="submit" disabled={loading} className="w-1/2 py-2.5 rounded-xl bg-[#0b4b8b] text-white font-bold text-xs hover:bg-[#093c70] transition disabled:opacity-50">
              {loading ? "인증 중..." : "로그인"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}