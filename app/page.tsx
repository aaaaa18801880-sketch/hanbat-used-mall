"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";

/* ════════════════════════════════════════════════════════════
   0. 설정값
   ════════════════════════════════════════════════════════════ */
const STORE = {
  name: "한밭중고전자",
  url: "https://hanbatmall.com",
  since: 1997,
  ceo: "김영종",
  tel: "042-523-8179",
  mobile: "010-5406-8179",
  address: "대전광역시 중구 중촌동 144",
  addressNote: "중촌고가도로 밑",
  hours: "월~토 09:00 - 19:00",
  closed: "일요일 휴무",
  parking: "매장 앞 전용 주차장 이용 가능",
  bizNo: "314-01-70945",
  mailOrderNo: "2011-대전서구-0292",
  privacyOfficer: "김태현(sunny3815@naver.com)",
  kakaoChannel: "https://pf.kakao.com/_XmyrX",
  kakaoChat: "https://pf.kakao.com/_XmyrX/chat",
  cafe: "https://cafe.naver.com/hanbatmall",
  naverMap: "https://naver.me/F5DkWQ4z",
};

const TABLE = {
  products: "products",
  inquiries: "purchase_requests",
};
const BUCKET = {
  inquiries: "inquiries",
};

const HERO_IMAGES = [
  "/main-bg.png",
  "/main-bg2.png",
  "/main-bg3.png",
];

const MAP_EMBED_SRC = `https://maps.google.com/maps?q=${encodeURIComponent(STORE.address)}&z=16&output=embed`;
const KAKAO_MAP = `https://map.kakao.com/link/search/${encodeURIComponent(STORE.address)}`;

const YEARS = new Date().getFullYear() - STORE.since;

const G = {
  aircon: "에어컨/냉난방기",
  fridge: "냉장고",
  washer: "세탁기/건조기",
  biz: "업소용기기",
} as const;
const galleryHref = (c?: string | null) => (c ? `/gallery?category=${encodeURIComponent(c)}` : "/gallery");

/* ════════════════════════════════════════════════════════════
   1. 타입 & 정적 데이터
   ════════════════════════════════════════════════════════════ */
type Review = { id: string | number; title: string | null; image_url: string | null; created_at: string };
type InquiryRow = {
  id: string | number;
  inquiry_type: string | null;
  category: string | null;
  name: string | null;
  status: string | null;
  is_notice: boolean | null;
  created_at: string;
};
type InquiryType = "구매 문의" | "내 물건 팔기" | "기타 문의";

type Category = {
  key: string;
  name: string;
  desc: string;
  group: "home" | "biz";
  gallery: string;
  keywords: string[];
  exclude?: string[];
  image?: string;
};

const CATEGORIES: Category[] = [
  { key: "ac", name: "에어컨 · 냉난방기", desc: "벽걸이 · 스탠드 · 천장형 · 시스템", group: "home", gallery: G.aircon, keywords: ["에어컨", "냉난방기", "스탠드", "벽걸이", "2in1", "투인원", "시스템", "천장형"], image: "/images/cat-ac.png" },
  { key: "fridge", name: "냉장고 · 김치냉장고", desc: "양문형 · 일반형 · 스탠드형 · 뚜껑형", group: "home", gallery: G.fridge, keywords: ["냉장고", "김치냉장고", "양문형", "김치"], exclude: ["업소", "박스", "쇼케이스"], image: "/images/cat-fridge.png" },
  { key: "washer", name: "세탁기 · 건조기", desc: "통돌이 · 드럼 · 워시타워 · 의류건조기", group: "home", gallery: G.washer, keywords: ["세탁기", "건조기", "워시타워", "드럼", "통돌이"], image: "/images/cat-washer.png" },
  { key: "bizfridge", name: "업소용 냉장고 · 쇼케이스", desc: "25·30·45박스 · 음료 · 주류 · 반찬", group: "biz", gallery: G.biz, keywords: ["업소용", "냉장고", "박스", "쇼케이스"], image: "/images/cat-commercial.png" },
  { key: "kitchen", name: "제빙기 · 식기세척기 · 주방기기", desc: "카페 · 식당 · 주점 · 작업대 · 튀김기", group: "biz", gallery: G.biz, keywords: ["제빙기", "식기세척기", "식세기", "레인지", "튀김기", "작업대", "싱크", "오븐", "주방"], image: "/images/cat-kitchen.png" },
];

const NAV = [
  { label: "중고가전", href: "/gallery" },
  { label: "에어컨·냉난방기", href: galleryHref(G.aircon) },
  { label: "업소용 주방기기", href: galleryHref(G.biz) },
  { label: "냉장·냉동", href: galleryHref(G.fridge) },
  { label: "세탁기·건조기", href: galleryHref(G.washer) },
  { label: "매입문의", href: "#sell-section" },
];
const NAV_EXTRA = [
  { label: "배송·설치 인증", href: "#reviews-section" },
  { label: "오시는 길", href: "#location-section" },
  { label: "문의게시판", href: "/inquiry" },
];

const USP = [
  { t: "세척·정비 후 판매", d: "입고된 제품은 세척과 정비, 검수를 마친 뒤 판매합니다." },
  { t: "무상 A/S", d: "에어컨·냉난방기 8개월, 그 외 제품 4개월. 보증 기간은 계약 내용에 따라 달라질 수 있습니다." },
  { t: "판매와 매입을 한 곳에서", d: "필요한 가전 구매와 쓰지 않는 가전 처분을 한 번에 상담합니다." },
  { t: "전국 배송·설치", d: "구미·포항·창원·부산·거제 등 여러 지역 거래 사례가 있습니다. 제품과 지역에 따라 상담해 드립니다." },
  { t: "대량 거래 · 세금계산서", d: "식당·카페 폐업, 매장 정리 같은 대량 거래도 세금계산서로 증빙합니다." },
];

const SELL_CASES = ["이사", "폐업", "업종 변경", "매장 정리", "대량 처분"];
const SELL_STEPS = [
  { t: "사진·정보 접수", d: "문의 폼이나 카카오톡으로 제품 사진과 모델명을 보내주세요." },
  { t: "견적 안내", d: "사진을 확인하고 매입 견적을 안내해 드립니다." },
  { t: "방문 확인·수거", d: "원하시는 날짜에 기사님이 방문해 상태를 최종 확인하고 수거합니다." },
  { t: "즉시 입금", d: "수거가 끝나는 즉시 지정 계좌로 전액 입금합니다." },
];

const FAQS = [
  {
    q: "먼 지역(수도권·타 광역시)도 배송이나 설치가 가능한가요?",
    a: "가능합니다. 제품과 지역에 따라 전국 어디든 배송·설치 상담이 가능합니다. 실제로 구미, 포항, 경산, 안동, 경주는 물론 창원, 부산, 거제 등 여러 지역의 거래 사례가 있습니다.",
  },
  {
    q: "구매 후 고장이 나면 어떻게 하나요?",
    a: "에어컨 및 냉난방기는 8개월, 그 외 제품은 4개월 무상 A/S를 보장합니다. (단, 계약 내용에 따라 보증 기간은 달라질 수 있습니다.)",
  },
  {
    q: "매입이 결정되면 대금 지급은 어떻게 이루어지나요?",
    a: "기사님이 현장에 방문하여 제품 상태를 최종 확인하고 수거가 완료되는 즉시, 지정해주신 계좌로 100% 전액 입금 처리해 드립니다.",
  },
  {
    q: "영업시간과 매장 위치가 어떻게 되나요?",
    a: "영업시간은 09:00 ~ 19:00 (일요일 휴무)이며, 오프라인 매장은 대전광역시 중구 중촌동 144에 위치해 있습니다.",
  },
];

const INQUIRY_TYPES: InquiryType[] = ["구매 문의", "내 물건 팔기", "기타 문의"];
const MAX_PHOTOS = 3;
const MAX_REVIEW_PHOTOS = 5;
const MAX_FILE_MB = 15;

/* ════════════════════════════════════════════════════════════
   2. 유틸
   ════════════════════════════════════════════════════════════ */
const telHref = (n: string) => `tel:${n.replace(/[^0-9]/g, "")}`;

function splitImages(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((s) => s.trim());
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}
const isValidPhone = (v: string) => /^0\d{8,10}$/.test(v.replace(/\D/g, ""));

function maskName(n?: string | null) {
  const t = (n ?? "").trim();
  if (!t) return "고객";
  return t.length === 1 ? `${t}*` : `${t[0]}${"*".repeat(Math.min(t.length - 1, 2))}`;
}
const shortDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
};
const typeShort = (t?: string | null) =>
  t === "내 물건 팔기" || t === "내 물건팔기" || t === "매입문의" ? "매입" : t === "구매 문의" || t === "구매문의" ? "구매" : "기타";

function validateImages(files: File[], max: number) {
  const ok = files.filter((f) => f.type.startsWith("image/"));
  if (ok.length !== files.length) toast.error("이미지 파일만 올릴 수 있습니다.");
  const sized = ok.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
  if (sized.length !== ok.length) toast.error(`${MAX_FILE_MB}MB 이하 사진만 올릴 수 있습니다.`);
  if (sized.length > max) toast.error(`사진은 최대 ${max}장까지 올릴 수 있습니다.`);
  return sized.slice(0, max);
}

async function compressImage(file: File, max = 1600, quality = 0.82): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", quality));
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function uploadImages(bucket: string, files: File[]) {
  const urls: string[] = [];
  for (const f of files) {
    const blob = await compressImage(f);
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    urls.push(supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl);
  }
  return urls;
}

/* ════════════════════════════════════════════════════════════
   3. 디자인 토큰 (Tailwind 클래스)
   ════════════════════════════════════════════════════════════ */
const WRAP = "mx-auto w-full max-w-[1240px] px-5 sm:px-6 lg:px-8";
const BTN = "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
const BTN_ACCENT = `${BTN} bg-[#D9531E] text-white hover:bg-[#BF4715] focus-visible:ring-[#D9531E]`;
const BTN_NAVY = `${BTN} bg-[#0E1A2B] text-white hover:bg-[#22324A] focus-visible:ring-[#0E1A2B]`;
const BTN_LINE = `${BTN} border border-[#0E1A2B]/15 bg-white text-[#0E1A2B] hover:border-[#0E1A2B]/60 focus-visible:ring-[#0E1A2B]`;
const BTN_KAKAO = `${BTN} bg-[#FEE500] text-[#191600] hover:bg-[#F2D900] focus-visible:ring-[#191600]`;
const INPUT = "w-full rounded-md border border-[#DDD9D1] bg-white px-3.5 py-3 text-[15px] text-[#0E1A2B] placeholder:text-neutral-400 transition-colors focus:border-[#0E1A2B] focus:outline-none focus:ring-1 focus:ring-[#0E1A2B]";
const LABEL = "mb-1.5 block text-[13px] font-semibold text-[#0E1A2B]";

/* ════════════════════════════════════════════════════════════
   4. 작은 공용 컴포넌트
   ════════════════════════════════════════════════════════════ */
const I = {
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
  chat: "M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  external: "M7 17L17 7M8 7h9v9",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  left: "M15 18l-6-6 6-6",
  right: "M9 18l6-6-6-6",
  down: "M6 9l6 6 6-6",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  pen: "M4 20h4L19 9l-4-4L4 16v4z",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
};
function Icon({ d, className = "h-5 w-5", strokeWidth = 1.8 }: { d: string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function SafeImg({ src, alt, className = "", eager = false }: { src?: string; alt: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);

  if (!src || failed) {
    return <div className="flex h-full w-full items-center justify-center bg-[#E9E6E0] text-[12px] text-neutral-400">이미지 준비 중</div>;
  }
  return <img src={src} alt={alt} className={className} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />;
}

function SectionHead({ eyebrow, title, desc, dark = false, className = "" }: { eyebrow: string; title: React.ReactNode; desc?: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <div className={`hb-reveal ${className}`}>
      <p className={`text-[12px] font-semibold uppercase tracking-[0.22em] ${dark ? "text-[#F08A5D]" : "text-[#D9531E]"}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-[28px] font-bold leading-[1.25] tracking-[-0.02em] sm:text-[34px] lg:text-[40px] ${dark ? "text-white" : "text-[#0E1A2B]"}`}>{title}</h2>
      {desc && <p className={`mt-4 max-w-xl text-[15px] leading-relaxed sm:text-base ${dark ? "text-white/70" : "text-[#4B5260]"}`}>{desc}</p>}
    </div>
  );
}

function Modal({ open, onClose, label, children, variant = "sheet" }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode; variant?: "sheet" | "dark" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      className={`fixed inset-0 z-[70] flex justify-center ${variant === "dark" ? "items-center bg-[#05080D]/95 p-3 sm:p-8" : "items-end bg-[#0E1A2B]/50 sm:items-center sm:p-6"}`}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   5. 메인 페이지
   ════════════════════════════════════════════════════════════ */
export default function Home() {
  /* 데이터 */
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [recent, setRecent] = useState<InquiryRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  /* UI */
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catFilter, setCatFilter] = useState<"all" | "home" | "biz">("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [lightbox, setLightbox] = useState<{ review: Review; index: number } | null>(null);
  const [inquiryType, setInquiryType] = useState<InquiryType>("구매 문의");
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setHeroIdx((p) => (p + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  /* 관리자 */
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [reviewPreviews, setReviewPreviews] = useState<string[]>([]);
  const [uploadingReview, setUploadingReview] = useState(false);

  /* ── 데이터 로드 ── */
  const loadReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase.from(TABLE.products).select("id, title, image_url, created_at").eq("category", "배송인증").order("created_at", { ascending: false });
      if (error) throw error;
      setReviews((data ?? []) as Review[]);
    } catch (err) {
      console.error("인증사진 불러오기 실패:", err);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const loadRecent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLE.inquiries)
        .select("id, inquiry_type, category, name, status, is_notice, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      setRecent(((data ?? []) as InquiryRow[]).filter((r) => !r.is_notice).slice(0, 5));
    } catch (err) {
      console.error("최근 문의 불러오기 실패:", err);
    }
  }, []);

  useEffect(() => {
    loadReviews();
    loadRecent();
    supabase.auth.getSession().then(({ data }) => setIsAdmin(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setIsAdmin(!!session));
    return () => sub.subscription.unsubscribe();
  }, [loadReviews, loadRecent]);

  /* ── 헤더 스크롤 상태 ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── 모바일 메뉴 ── */
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  /* ── 스크롤 등장 효과 ── */
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".hb-reveal:not(.is-in)"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reviewsLoading]);

  /* ── 파생 데이터 ── */
  const catImages = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of CATEGORIES) {
      if (c.image) map[c.key] = c.image;
    }
    return map;
  }, []);

  const visibleCats = CATEGORIES.filter((c) => catFilter === "all" || c.group === catFilter);
  const shownReviews = showAllReviews ? reviews : reviews.slice(0, 5);

  const openInquiry = useCallback((type?: InquiryType) => {
    if (type) setInquiryType(type);
    setMenuOpen(false);
    document.getElementById("inquiry-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /* ── 관리자 ── */
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
      if (error) throw error;
      toast.success("관리자로 로그인했습니다.");
      setLoginOpen(false);
      setAdminPassword("");
    } catch {
      toast.error("이메일 또는 비밀번호를 확인해 주세요.");
    } finally {
      setLoggingIn(false);
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("로그아웃했습니다.");
  };

  const pickReviewFiles = (list: FileList | null) => {
    if (!list) return;
    const files = validateImages([...reviewFiles, ...Array.from(list)], MAX_REVIEW_PHOTOS);
    reviewPreviews.forEach((u) => URL.revokeObjectURL(u));
    setReviewFiles(files);
    setReviewPreviews(files.map((f) => URL.createObjectURL(f)));
  };
  const closeReviewModal = useCallback(() => {
    setReviewModalOpen(false);
    setReviewTitle("");
    setReviewFiles([]);
    setReviewPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
  }, []);

  const handleReviewUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim()) return toast.error("제목을 입력해 주세요.");
    if (reviewFiles.length === 0) return toast.error("사진을 1장 이상 선택해 주세요.");
    setUploadingReview(true);
    try {
      const urls = await uploadImages(BUCKET.inquiries, reviewFiles);
      const { error } = await supabase.from(TABLE.products).insert({
        title: reviewTitle.trim(),
        category: "배송인증",
        image_url: urls.join(","),
        price: 0,
        status: "판매중"
      });
      if (error) throw error;
      toast.success("인증사진을 등록했습니다.");
      closeReviewModal();
      loadReviews();
    } catch (err) {
      console.error(err);
      toast.error("등록하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setUploadingReview(false);
    }
  };

  const handleDeleteReview = async (id: Review["id"]) => {
    if (!confirm("이 인증사진을 정말 삭제하시겠습니까?")) return;
    try {
      const { error } = await supabase.from(TABLE.products).delete().eq("id", id);
      if (error) throw error;
      toast.success("삭제했습니다.");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("삭제하지 못했습니다.");
    }
  };

  /* ── 라이트박스 ── */
  const lbImages = lightbox ? splitImages(lightbox.review.image_url) : [];
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const moveLightbox = useCallback(
    (step: number) =>
      setLightbox((lb) => {
        if (!lb) return lb;
        const n = splitImages(lb.review.image_url).length;
        return n ? { ...lb, index: (lb.index + step + n) % n } : lb;
      }),
    []
  );
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") moveLightbox(-1);
      if (e.key === "ArrowRight") moveLightbox(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, moveLightbox]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(STORE.address);
      toast.success("주소를 복사했습니다.");
    } catch {
      toast.error("복사하지 못했습니다.");
    }
  };

  /* ── 구조화 데이터 ── */
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ElectronicsStore",
        "@id": `${STORE.url}/#store`,
        name: STORE.name,
        description: "대전 중고가전 판매·매입 전문. 중고 냉장고·세탁기·에어컨·냉난방기와 업소용 냉장고·제빙기·쇼케이스·상업용 주방기기를 판매·매입하며 전국 배송·설치를 상담합니다.",
        url: STORE.url,
        telephone: "+82-42-523-8179",
        foundingDate: String(STORE.since),
        address: { "@type": "PostalAddress", streetAddress: "중촌동 144", addressLocality: "중구", addressRegion: "대전광역시", addressCountry: "KR" },
        openingHoursSpecification: [
          { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "09:00", closes: "19:00" },
        ],
        areaServed: "KR",
        sameAs: [STORE.cafe, STORE.kakaoChannel],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <div className="hb-root min-h-screen bg-[#F6F5F2] text-[#1F2530]">
      <style>{GLOBAL_CSS}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ─────────────── ① HEADER ─────────────── */}
      <header
        className={`sticky top-0 z-50 border-b transition-[background-color,border-color] duration-300 ${
          scrolled ? "border-[#E4E0D8] bg-white" : "border-transparent bg-[#F6F5F2]"
        }`}
      >
        <div className={`${WRAP} flex h-16 items-center gap-4 lg:h-[72px]`}>
          <a href="/" className="flex shrink-0 items-center gap-2.5" aria-label="한밭중고전자 홈">
            <span className="grid h-9 w-9 place-items-center rounded-[5px] bg-[#0E1A2B] text-[12px] font-bold tracking-tight text-white">한밭</span>
            <span className="leading-none">
              <span className="block text-[17px] font-bold tracking-[-0.02em] text-[#0E1A2B]">한밭중고전자</span>
              <span className="mt-1 block text-[10px] font-medium tracking-[0.22em] text-neutral-500">SINCE {STORE.since}</span>
            </span>
          </a>

          <nav className="hidden flex-1 justify-center lg:flex" aria-label="주요 메뉴">
            <ul className="flex items-center">
              {NAV.map((n) => (
                <li key={n.label}>
                  <a href={n.href} className="relative rounded px-2.5 py-2 text-[14px] font-medium text-[#2A3140] transition-colors hover:text-[#0E1A2B] xl:px-3.5 xl:text-[15px] after:absolute after:inset-x-2.5 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-[#0E1A2B] after:transition-transform after:duration-300 hover:after:scale-x-100">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <a href={telHref(STORE.tel)} className="hidden items-center gap-1.5 px-2 text-[14px] font-semibold text-[#0E1A2B] xl:inline-flex">
              <Icon d={I.phone} className="h-4 w-4" />
              {STORE.tel}
            </a>
            <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className={`${BTN_KAKAO} h-10 px-3.5 text-[14px]`} aria-label="카카오톡 상담">
              <Icon d={I.chat} className="h-4 w-4" />
              <span className="hidden xl:inline">카카오톡</span>
            </a>
            <button type="button" onClick={() => openInquiry()} className={`${BTN_NAVY} h-10 px-4 text-[14px]`}>
              문의하기
            </button>
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <a href={telHref(STORE.tel)} className="grid h-10 w-10 place-items-center rounded-md text-[#0E1A2B]" aria-label={`전화 상담 ${STORE.tel}`}>
              <Icon d={I.phone} />
            </a>
            <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center rounded-md text-[#0E1A2B]" aria-label="카카오톡 상담">
              <Icon d={I.chat} />
            </a>
            <button type="button" onClick={() => setMenuOpen(true)} className="grid h-10 w-10 place-items-center rounded-md text-[#0E1A2B]" aria-label="메뉴 열기" aria-expanded={menuOpen}>
              <Icon d={I.menu} />
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white lg:hidden" role="dialog" aria-modal="true" aria-label="전체 메뉴">
          <div className={`${WRAP} flex h-16 items-center justify-between border-b border-[#EEEBE5]`}>
            <span className="text-[17px] font-bold text-[#0E1A2B]">한밭중고전자</span>
            <button type="button" onClick={() => setMenuOpen(false)} className="grid h-10 w-10 place-items-center" aria-label="메뉴 닫기">
              <Icon d={I.close} />
            </button>
          </div>
          <nav className={`${WRAP} flex-1 overflow-y-auto py-4`} aria-label="모바일 메뉴">
            <ul>
              {[...NAV, ...NAV_EXTRA].map((n) => (
                <li key={n.label} className="border-b border-[#F0EDE7]">
                  <a href={n.href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-4 text-[17px] font-semibold text-[#0E1A2B]">
                    {n.label}
                    <Icon d={I.right} className="h-4 w-4 text-neutral-400" />
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-md bg-[#F6F5F2] p-4 text-[14px] text-[#4B5260]">
              <p className="font-semibold text-[#0E1A2B]">{STORE.hours}</p>
              <p className="mt-0.5">{STORE.closed} · {STORE.address}</p>
            </div>
          </nav>
          <div className={`${WRAP} grid grid-cols-2 gap-2 border-t border-[#EEEBE5] py-3 pb-[max(12px,env(safe-area-inset-bottom))]`}>
            <a href={telHref(STORE.tel)} className={`${BTN_NAVY} h-12 text-[15px]`}>
              <Icon d={I.phone} className="h-4 w-4" /> 전화 상담
            </a>
            <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className={`${BTN_KAKAO} h-12 text-[15px]`}>
              <Icon d={I.chat} className="h-4 w-4" /> 카카오톡
            </a>
          </div>
        </div>
      )}

      <main>
        {/* ─────────────── ② HERO (프리미엄 텍스트 오버레이형) ─────────────── */}
        <section className="relative w-full bg-[#0E1A2B] overflow-hidden">
          <div className="relative w-full max-w-[1920px] mx-auto min-h-[500px] sm:min-h-[600px] lg:min-h-[680px] flex items-center">
            {HERO_IMAGES.map((src, i) => (
              <div key={src} className={`absolute inset-0 transition-opacity duration-1000 ${heroIdx === i ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                <SafeImg src={src} alt={`한밭중고전자 메인 배너 ${i + 1}`} eager={i === 0} className="h-full w-full object-cover object-center" />
              </div>
            ))}
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0E1A2B]/95 via-[#0E1A2B]/70 to-transparent sm:via-[#0E1A2B]/60" />
            <div className="absolute inset-0 z-10 bg-black/10" />

            <div className={`relative z-20 w-full ${WRAP} py-16 sm:py-20`}>
              <div className="max-w-2xl text-white">
                <p className="inline-flex items-center gap-2 text-[13px] font-medium text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D9531E] motion-safe:animate-pulse" aria-hidden="true" />
                  SINCE {STORE.since} · 대전 중촌동 오프라인 매장
                </p>
                <h1 id="hero-title" className="mt-4 font-bold tracking-[-0.03em] text-white">
                  <span className="block text-[15px] font-semibold tracking-normal text-white/80 sm:text-base">
                    대전 중고가전 판매·매입 전문 한밭중고전자
                  </span>
                  <span className="mt-3 block text-[36px] leading-[1.2] sm:text-[46px] lg:text-[54px] lg:leading-[1.15] drop-shadow-lg">
                    새것 같은 중고가전,<br />
                    합리적인 가격으로.
                  </span>
                </h1>
                <p className="mt-6 max-w-[520px] text-[16px] leading-[1.75] text-white/90 sm:text-[17px] drop-shadow-md break-keep">
                  {STORE.since}년부터 가정용 가전과 업소용 냉장·주방 설비를 판매하고 매입해 왔습니다. 전국 배송·설치와 매장 정리 같은 대량 거래도 상담해 드립니다.
                </p>
                
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[420px]">
                  <button type="button" onClick={() => openInquiry()} className={`${BTN_ACCENT} h-[52px] text-[15px] sm:text-base shadow-lg w-full`}>
                    무료 매입 견적 문의
                  </button>
                  <Link href="/gallery" className="inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-200 border border-white/40 bg-white/10 text-white hover:bg-white/20 hover:border-white/60 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white h-[52px] text-[15px] sm:text-base w-full shadow-lg">
                    판매 제품 보기
                    <Icon d={I.arrow} className="h-4 w-4" />
                  </Link>
                </div>
                
                <p className="mt-6 text-[14px] text-white/70 flex items-center gap-2">
                  <Icon d={I.phone} className="h-4 w-4" />
                  전화 상담 <a href={telHref(STORE.tel)} className="font-bold text-white hover:underline">{STORE.tel}</a>
                  <span className="mx-1.5 text-white/30">|</span>
                  {STORE.hours}
                </p>
              </div>
            </div>

            <div className="absolute bottom-6 sm:bottom-8 inset-x-0 flex justify-center gap-2.5 z-20">
              {HERO_IMAGES.map((_, i) => (
                <button key={i} type="button" onClick={() => setHeroIdx(i)} aria-label={`${i + 1}번째 사진 보기`}
                  className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 shadow-md ${heroIdx === i ? "bg-white w-8 sm:w-10" : "bg-white/40 w-2 sm:w-2.5 hover:bg-white/70"}`} />
              ))}
            </div>
          </div>
        </section>

        {/* 신뢰 지표 */}
        <div className="border-y border-[#E4E0D8] bg-white">
          <dl className={`${WRAP} grid grid-cols-2 lg:grid-cols-4`}>
            {[
              { k: String(STORE.since), v: `대전에서 ${YEARS}년째 영업` },
              { k: "오프라인 매장", v: "직접 보고 구매 가능" },
              { k: "전국 배송·설치", v: "제품·지역별 상담" },
              { k: "세금계산서", v: "투명한 거래 증빙" },
            ].map((s, i) => (
              <div key={s.k} className={`py-5 sm:py-6 ${i % 2 === 1 ? "pl-5 sm:pl-8" : ""} ${i > 1 ? "border-t border-[#EEEBE5] lg:border-t-0" : ""} ${i > 0 ? "lg:border-l lg:border-[#EEEBE5] lg:pl-8" : ""}`}>
                <dt className="text-[17px] font-bold tracking-[-0.01em] text-[#0E1A2B] sm:text-[19px]">{s.k}</dt>
                <dd className="mt-1 text-[13px] text-[#6B7280] sm:text-[14px]">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ─────────────── ③ 신뢰 / 서비스 USP ─────────────── */}
        <section className="py-16 sm:py-20 lg:py-28" aria-labelledby="usp-title">
          <div className={`${WRAP} grid gap-10 lg:grid-cols-12 lg:gap-16`}>
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <SectionHead
                  eyebrow="Why Hanbat"
                  title={
                    <span id="usp-title">
                      중고라서 불안한 부분,
                      <br />
                      먼저 확인하고 보냅니다.
                    </span>
                  }
                  desc="판매부터 매입, 배송과 설치까지 한밭중고전자가 직접 책임지는 범위입니다."
                />
              </div>
            </div>
            <ol className="lg:col-span-8">
              {USP.map((u, i) => (
                <li key={u.t} className="grid grid-cols-[44px_1fr] gap-x-4 border-t border-[#DDD9D1] py-6 last:border-b sm:grid-cols-[64px_220px_1fr] sm:gap-x-6 sm:py-7">
                  <span className="text-[13px] font-semibold tabular-nums text-[#D9531E] sm:text-[14px]">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-[17px] font-bold text-[#0E1A2B] sm:text-[18px]">{u.t}</h3>
                  <p className="col-start-2 mt-1.5 text-[15px] leading-relaxed text-[#4B5260] sm:col-start-3 sm:mt-0">{u.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─────────────── ④ 상품 카테고리 (세로형 aspect-[4/5] 적용) ─────────────── */}
        <section id="category-section" className="bg-white py-16 sm:py-20 lg:py-28" aria-labelledby="cat-title">
          <div className={WRAP}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <SectionHead eyebrow="Products" title={<span id="cat-title">어떤 제품을 찾으시나요?</span>} desc="가정용부터 업소용 설비까지, 세척과 정비를 마친 제품을 카테고리별로 확인하세요." />
              <div className="flex items-center gap-4">
                <div className="inline-flex rounded-md border border-[#DDD9D1] p-1" role="tablist" aria-label="카테고리 구분">
                  {(
                    [
                      { k: "all", l: "전체" },
                      { k: "home", l: "가정용" },
                      { k: "biz", l: "업소용" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.k}
                      type="button"
                      role="tab"
                      aria-selected={catFilter === f.k}
                      onClick={() => setCatFilter(f.k)}
                      className={`h-9 rounded px-4 text-[14px] font-semibold transition-colors ${catFilter === f.k ? "bg-[#0E1A2B] text-white" : "text-[#4B5260] hover:text-[#0E1A2B]"}`}
                    >
                      {f.l}
                    </button>
                  ))}
                </div>
                <Link href="/gallery" className="hidden items-center gap-1.5 text-[14px] font-semibold text-[#0E1A2B] underline-offset-4 hover:underline sm:inline-flex">
                  전체 제품 보기 <Icon d={I.arrow} className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* 💡 비율을 세로형 카드로 변경했습니다: aspect-[4/5] */}
            <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 lg:mt-12 lg:grid-cols-5 lg:gap-x-4 lg:gap-y-10">
              {visibleCats.map((c) => {
                const img = catImages[c.key];
                const no = CATEGORIES.indexOf(c) + 1;
                return (
                  <li key={c.key}>
                    <Link href={galleryHref(c.gallery)} className="group block" aria-label={`${c.name} 제품 보기`}>
                      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-[#EFECE6]">
                        {img ? (
                          <SafeImg src={img} alt={`중고 ${c.name} 판매 제품`} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
                        ) : (
                          <div className="flex h-full w-full flex-col justify-between p-4 transition-colors duration-300 group-hover:bg-[#E7E3DB] sm:p-5">
                            <span className="text-[12px] font-semibold tabular-nums tracking-[0.18em] text-[#A29C90]">{String(no).padStart(2, "0")}</span>
                            <span className="text-[15px] font-semibold leading-snug text-[#8F897D] sm:text-lg">{c.desc}</span>
                          </div>
                        )}
                        <span className="absolute left-2.5 top-2.5 rounded-sm bg-white/95 px-1.5 py-0.5 text-[11px] font-semibold text-[#4B5260]">{c.group === "home" ? "가정용" : "업소용"}</span>
                      </div>
                      <div className="mt-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-bold text-[#0E1A2B] transition-colors group-hover:text-[#D9531E] sm:text-[16px]">{c.name}</h3>
                          {img && <p className="mt-0.5 truncate text-[13px] text-[#6B7280]">{c.desc}</p>}
                        </div>
                        <Icon d={I.arrow} className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#D9531E]" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Link href="/gallery" className={`${BTN_LINE} mt-10 h-12 w-full text-[15px] sm:hidden`}>
              전체 제품 보기 <Icon d={I.arrow} className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ─────────────── ⑤ 배송·설치 인증 ─────────────── */}
        <section id="reviews-section" className="py-16 sm:py-20 lg:py-28" aria-labelledby="review-title">
          <div className={WRAP}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHead
                eyebrow="Delivery & Installation"
                title={
                  <span id="review-title">
                    우리는 제품만
                    <br className="sm:hidden" /> 보내지 않습니다.
                  </span>
                }
                desc="배송부터 설치까지, 현장에서 직접 찍은 사진으로 확인하세요."
              />
              <div className="flex items-center gap-3">
                {reviews.length > 0 && <p className="text-[14px] text-[#6B7280]">현장 기록 {reviews.length}건</p>}
                {isAdmin && (
                  <button type="button" onClick={() => setReviewModalOpen(true)} className={`${BTN_NAVY} h-10 px-4 text-[14px]`}>
                    <Icon d={I.plus} className="h-4 w-4" /> 인증사진 등록
                  </button>
                )}
              </div>
            </div>

            {reviewsLoading ? (
              <div className="mt-10 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4" aria-hidden="true">
                <div className="col-span-2 row-span-2 aspect-square animate-pulse rounded-md bg-[#E9E6E0]" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-md bg-[#E9E6E0]" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="mt-10 flex flex-col items-start gap-5 rounded-md border border-[#E4E0D8] bg-white px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#F6F5F2] text-[#8A8478]">
                    <Icon d={I.camera} />
                  </span>
                  <div>
                    <p className="text-[16px] font-bold text-[#0E1A2B]">현장 사진을 정리하고 있습니다.</p>
                    <p className="mt-1 text-[14px] text-[#4B5260]">배송·설치 사례가 궁금하시면 카카오톡으로 편하게 물어보세요.</p>
                  </div>
                </div>
                <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className={`${BTN_KAKAO} h-11 shrink-0 px-5 text-[14px]`}>
                  <Icon d={I.chat} className="h-4 w-4" /> 카카오톡 문의
                </a>
              </div>
            ) : (
              <>
                <ul className="mt-10 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                  {shownReviews.map((r, i) => {
                    const imgs = splitImages(r.image_url);
                    const big = i === 0 && reviews.length >= 5;
                    return (
                      <li key={r.id} className={big ? "col-span-2 row-span-2" : ""}>
                        <div className="group relative aspect-square overflow-hidden rounded-md bg-[#E4E1DA]">
                          <button type="button" onClick={() => setLightbox({ review: r, index: 0 })} className="block h-full w-full" aria-label={`${r.title ?? "배송·설치"} 사진 크게 보기`}>
                            <SafeImg src={imgs[0]} alt={`${r.title ?? "배송·설치"} 현장 사진`} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                          </button>
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent px-3 pb-3 pt-10 sm:px-4 sm:pb-4">
                            <p className={`line-clamp-1 font-semibold text-white ${big ? "text-[15px] sm:text-[17px]" : "text-[13px] sm:text-[14px]"}`}>{r.title}</p>
                            <p className="mt-0.5 text-[11px] text-white/70">{shortDate(r.created_at)}</p>
                          </div>
                          {imgs.length > 1 && (
                            <span className="pointer-events-none absolute right-2 top-2 rounded-sm bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white">+{imgs.length - 1}</span>
                          )}
                          {isAdmin && (
                            <button type="button" onClick={() => handleDeleteReview(r.id)} className="absolute left-2 top-2 rounded-sm bg-white px-2 py-1 text-[11px] font-semibold text-red-600 shadow-sm">
                              삭제
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {reviews.length > 5 && (
                  <div className="mt-8 text-center">
                    <button type="button" onClick={() => setShowAllReviews((v) => !v)} className={`${BTN_LINE} h-12 px-7 text-[15px]`}>
                      {showAllReviews ? "접기" : `현장 사진 ${reviews.length - 5}건 더 보기`}
                      <Icon d={I.down} className={`h-4 w-4 transition-transform ${showAllReviews ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ─────────────── ⑥ 매입 서비스 ─────────────── */}
        <section id="sell-section" className="bg-[#0E1A2B] py-16 text-white sm:py-20 lg:py-28" aria-labelledby="sell-title">
          <div className={`${WRAP} grid gap-12 lg:grid-cols-12 lg:gap-16`}>
            <div className="lg:col-span-5">
              <SectionHead
                dark
                eyebrow="Buyback"
                title={
                  <span id="sell-title">
                    쓰지 않는 가전,
                    <br />
                    그냥 버리지 마세요.
                  </span>
                }
                desc="가정용 가전부터 업소용 냉장·주방 설비까지 사진 한 장으로 매입 견적을 받아보세요. 원하시는 날짜에 방문해 수거합니다."
              />
              <p className="mt-8 text-[13px] font-semibold text-white/50">이럴 때 연락 주세요</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {SELL_CASES.map((s) => (
                  <li key={s} className="rounded-sm border border-white/20 px-3 py-1.5 text-[14px] font-medium text-white/90">
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-9 flex flex-col gap-2.5 sm:flex-row">
                <button type="button" onClick={() => openInquiry("내 물건 팔기")} className={`${BTN_ACCENT} h-[52px] px-7 text-[16px] focus-visible:ring-offset-[#0E1A2B]`}>
                  무료 매입 견적 받기 <Icon d={I.arrow} className="h-4 w-4" />
                </button>
                <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className={`${BTN} h-[52px] border border-white/25 px-6 text-[15px] text-white hover:border-white/60 focus-visible:ring-white`}>
                  <Icon d={I.chat} className="h-4 w-4" /> 카톡으로 사진 보내기
                </a>
              </div>
            </div>

            <div className="lg:col-span-7">
              <h3 className="text-[15px] font-semibold text-white/60">매입 진행 순서</h3>
              <ol className="mt-5 border-t border-white/15">
                {SELL_STEPS.map((s, i) => (
                  <li key={s.t} className="grid grid-cols-[48px_1fr] gap-x-4 border-b border-white/15 py-6 sm:grid-cols-[72px_1fr] sm:py-7">
                    <span className="text-[28px] font-bold leading-none tabular-nums text-white/25 sm:text-[34px]">{i + 1}</span>
                    <div>
                      <p className="text-[17px] font-bold sm:text-[19px]">{s.t}</p>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-white/70">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-[13px] text-white/50">가격 흥정 없이, 사진과 현장 확인을 기준으로 견적을 안내합니다.</p>
            </div>
          </div>
        </section>

        {/* ─────────────── ⑦ 가정용 / 업소용 ─────────────── */}
        <section className="bg-white py-16 sm:py-20 lg:py-28" aria-labelledby="split-title">
          <div className={WRAP}>
            <SectionHead eyebrow="Home & Business" title={<span id="split-title">집에서 쓰는 가전부터 매장 설비까지</span>} className="max-w-2xl" />
            <div className="mt-10 grid gap-3 lg:mt-12 lg:grid-cols-2 lg:gap-4">
              {[
                {
                  dark: false,
                  eyebrow: "For Home",
                  title: "가정용 중고가전",
                  desc: "이사, 신혼, 원룸, 사무실에 필요한 가전을 합리적인 가격으로 준비하세요.",
                  items: ["스탠드·벽걸이 에어컨", "양문형 냉장고", "김치냉장고", "세탁기", "건조기"],
                  href: "/gallery",
                  cta: "가정용 제품 보기",
                  img: "/images/home-bg.png", // ✨ 가정용 배경 연결 완료
                },
                {
                  dark: true,
                  eyebrow: "For Business",
                  title: "업소용·상업용 장비",
                  desc: "식당·카페 창업과 매장 확장에 필요한 냉장·주방 설비. 대량 구매와 폐업 매입도 상담합니다.",
                  items: ["업소용 냉장고", "쇼케이스", "제빙기", "식기세척기", "냉난방기", "상업용 주방기기"],
                  href: galleryHref(G.biz),
                  cta: "업소용 제품 보기",
                  img: "/images/biz-bg.png", // ✨ 업소용 배경 연결 완료
                },
              ].map((b) => (
                <Link
                  key={b.title}
                  href={b.href}
                  className={`group flex flex-col overflow-hidden rounded-md transition-colors ${b.dark ? "bg-[#1C2432] text-white hover:bg-[#222C3C]" : "bg-[#EFECE6] text-[#0E1A2B] hover:bg-[#E9E5DD]"}`}
                >
                  {b.img && (
                    <div className="aspect-[16/8] overflow-hidden">
                      <SafeImg src={b.img} alt={`${b.title} 판매 제품`} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-7 sm:p-10">
                    <p className={`text-[12px] font-semibold uppercase tracking-[0.22em] ${b.dark ? "text-[#F08A5D]" : "text-[#D9531E]"}`}>{b.eyebrow}</p>
                    <h3 className="mt-3 text-[24px] font-bold tracking-[-0.02em] sm:text-[30px]">{b.title}</h3>
                    <p className={`mt-3 max-w-md text-[15px] leading-relaxed ${b.dark ? "text-white/70" : "text-[#4B5260]"}`}>{b.desc}</p>
                    <ul className={`mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[14px] font-medium ${b.dark ? "text-white/85" : "text-[#2A3140]"}`}>
                      {b.items.map((it) => (
                        <li key={it} className="flex items-center gap-1.5">
                          <span className={`h-1 w-1 rounded-full ${b.dark ? "bg-white/40" : "bg-[#0E1A2B]/40"}`} aria-hidden="true" />
                          {it}
                        </li>
                      ))}
                    </ul>
                    <span className={`mt-auto inline-flex items-center gap-2 pt-8 text-[15px] font-bold ${b.dark ? "text-white" : "text-[#0E1A2B]"}`}>
                      {b.cta}
                      <Icon d={I.arrow} className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────── ⑧ FAQ ─────────────── */}
        <section id="faq-section" className="py-16 sm:py-20 lg:py-28" aria-labelledby="faq-title">
          <div className={`${WRAP} grid gap-10 lg:grid-cols-12 lg:gap-16`}>
            <div className="lg:col-span-4">
              <SectionHead eyebrow="FAQ" title={<span id="faq-title">자주 묻는 질문</span>} />
              <p className="mt-5 text-[15px] leading-relaxed text-[#4B5260]">
                더 궁금한 점은{" "}
                <a href={telHref(STORE.tel)} className="font-semibold text-[#0E1A2B] underline underline-offset-4">
                  {STORE.tel}
                </a>{" "}
                또는{" "}
                <a href={telHref(STORE.mobile)} className="font-semibold text-[#0E1A2B] underline underline-offset-4">
                  {STORE.mobile}
                </a>
                로 편히 문의해 주세요.
              </p>
            </div>
            <div className="border-t border-[#DDD9D1] lg:col-span-8">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={f.q} className="border-b border-[#DDD9D1]">
                    <h3>
                      <button
                        type="button"
                        id={`faq-q-${i}`}
                        aria-expanded={open}
                        aria-controls={`faq-a-${i}`}
                        onClick={() => setOpenFaq(open ? null : i)}
                        className="flex w-full items-start justify-between gap-6 py-5 text-left sm:py-6"
                      >
                        <span className="flex gap-3 text-[16px] font-semibold leading-snug text-[#0E1A2B] sm:text-[17px]">
                          <span className="text-[#D9531E]">Q.</span>
                          {f.q}
                        </span>
                        <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#DDD9D1] text-[#0E1A2B] transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
                          <Icon d={I.plus} className="h-3.5 w-3.5" strokeWidth={2} />
                        </span>
                      </button>
                    </h3>
                    <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <p className="pb-6 pl-7 pr-10 text-[15px] leading-[1.8] text-[#4B5260]">{f.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

{/* ─────────────── ⑨ 오시는 길 (와이드 레이아웃 + 구글 지도) ─────────────── */}
        <section id="location-section" className="bg-white pt-16 sm:pt-20 lg:pt-28" aria-labelledby="loc-title">
          {/* 타이틀 영역 */}
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pb-8 lg:pb-12">
            <div className="flex flex-col mb-8 sm:mb-10">
              <p className="text-[12px] font-bold tracking-[0.2em] text-[#D9531E] uppercase mb-3">Location</p>
              <h2 id="loc-title" className="text-[28px] sm:text-[34px] font-bold text-[#0E1A2B] tracking-[-0.02em] leading-tight break-keep">직접 보고 고르는 실제 매장</h2>
              <p className="mt-3 text-[14.5px] sm:text-[15px] text-[#4B5260] leading-relaxed max-w-2xl break-keep">사진만으로 판단하기 어려운 제품은 대전 중촌동 매장에서 직접 확인하세요.</p>
            </div>
          </div>
          
          {/* 지도 및 정보 영역 (화면 전체 가로폭 꽉 채우기) */}
          <div className="w-full border-y border-[#E4E0D8] bg-[#FAF9F7] flex flex-col lg:flex-row">
            {/* 지도 영역 (화면의 60% 차지, 와이드 비율 유지) */}
            <div className="relative w-full h-[400px] sm:h-[500px] lg:h-auto lg:w-[60%] bg-[#EFECE6]">
              <iframe 
                title="한밭중고전자 매장 위치 지도" 
                src="https://maps.google.com/maps?q=%EB%8C%80%EC%A0%84+%EC%A4%91%EA%B5%AC+%EC%A4%91%EC%B4%88%EB%8F%99+144&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade" 
                className="absolute inset-0 h-full w-full border-0" 
                allowFullScreen 
              />
            </div>
            
            {/* 정보 영역 (화면의 40% 차지) */}
            <div className="flex flex-col p-8 sm:p-12 lg:w-[40%] lg:p-16 xl:px-20 xl:py-24 justify-center bg-white border-l border-[#E4E0D8]">
              <h3 className="text-[26px] font-bold tracking-[-0.02em] text-[#0E1A2B] sm:text-[30px]">한밭중고전자</h3>
              <dl className="mt-8 divide-y divide-[#EEEBE5] text-[15px]">
                <div className="grid grid-cols-[80px_1fr] gap-4 py-4 first:pt-0 last:pb-0">
                  <dt className="font-semibold text-[#8A8478]">주소</dt>
                  <dd className="text-[#1F2530]">대전광역시 중구 중촌동 144<span className="block text-[13px] text-[#6B7280] mt-1">중촌고가도로 밑</span></dd>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-4 py-4 first:pt-0 last:pb-0">
                  <dt className="font-semibold text-[#8A8478]">전화</dt>
                  <dd className="text-[#1F2530]">
                    <a href="tel:042-523-8179" className="font-semibold text-[#0E1A2B] underline-offset-4 hover:underline">042-523-8179</a>
                    <span className="mx-1.5 text-neutral-300">/</span>
                    <a href="tel:010-5406-8179" className="font-semibold text-[#0E1A2B] underline-offset-4 hover:underline">010-5406-8179</a>
                  </dd>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-4 py-4 first:pt-0 last:pb-0">
                  <dt className="font-semibold text-[#8A8478]">영업시간</dt>
                  <dd className="text-[#1F2530]">월~토 09:00 - 19:00<span className="block text-[13px] text-[#6B7280] mt-1">일요일 휴무</span></dd>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-4 py-4 first:pt-0 last:pb-0">
                  <dt className="font-semibold text-[#8A8478]">주차</dt>
                  <dd className="text-[#1F2530]">매장 앞 전용 주차장 이용 가능</dd>
                </div>
              </dl>
              <div className="mt-10 grid grid-cols-2 gap-2">
                <a href="https://map.naver.com/v5/entry/address/36.335503,127.406981,%EB%8C%80%EC%A0%84%EA%B4%91%EC%97%AD%EC%8B%9C+%EC%A4%91%EA%B5%AC+%EC%A4%91%EC%B4%88%EB%8F%99+144,jibun" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-[#0E1A2B] text-white hover:bg-[#22324A] h-12 text-[14px]">네이버 지도 길찾기</a>
                <a href="https://map.kakao.com/link/to/한밭중고전자,36.335503,127.406981" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border border-[#0E1A2B]/15 bg-white text-[#0E1A2B] hover:border-[#0E1A2B]/60 h-12 text-[14px]">카카오맵</a>
              </div>
              <p className="mt-4 text-[13px] text-[#8A8478]">모바일에서는 버튼을 누르면 길안내 앱으로 연결됩니다.</p>
            </div>
          </div>
        </section>

        {/* ─────────────── ⑩ 문의 CTA + 문의 폼 ─────────────── */}
        <section id="inquiry-section" className="py-16 sm:py-20 lg:py-28" aria-labelledby="cta-title">
          <div className={WRAP}>
            <div className="hb-reveal mx-auto max-w-3xl text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#D9531E]">Contact</p>
              <h2 id="cta-title" className="mt-3 text-[28px] font-bold leading-[1.3] tracking-[-0.02em] text-[#0E1A2B] sm:text-[36px] lg:text-[42px]">
                찾으시는 제품이 없으신가요?
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-[#4B5260] sm:text-[17px]">
                필요한 제품 사진 한 장만 보내주세요.
                <br className="hidden sm:block" /> 구매부터 매입까지 한밭중고전자에서 상담해 드립니다.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
                <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className={`${BTN_KAKAO} h-[52px] text-[15px]`}>
                  <Icon d={I.chat} className="h-4 w-4" /> 카카오톡 상담
                </a>
                <a href={telHref(STORE.tel)} className={`${BTN_NAVY} h-[52px] text-[15px]`}>
                  <Icon d={I.phone} className="h-4 w-4" /> 전화 상담
                </a>
                <a href="#inquiry-form" className={`${BTN_LINE} h-[52px] text-[15px]`}>
                  <Icon d={I.pen} className="h-4 w-4" /> 문의 남기기
                </a>
              </div>
            </div>

            <div className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-12 lg:gap-8">
              <div id="inquiry-form" className="scroll-mt-24 rounded-md border border-[#E4E0D8] bg-white p-5 sm:p-8 lg:col-span-7 lg:p-10">
                <h3 className="text-[20px] font-bold text-[#0E1A2B] sm:text-[22px]">판매 / 매입 통합 문의</h3>
                <p className="mt-1.5 text-[14px] text-[#6B7280]">남겨주신 문의는 확인 후 연락드립니다. 문의게시판에서 진행 상황을 볼 수 있습니다.</p>
                <InquiryForm type={inquiryType} setType={setInquiryType} onSubmitted={loadRecent} />
              </div>

              <aside className="flex flex-col gap-6 lg:col-span-5">
                <div className="rounded-md bg-[#0E1A2B] p-6 text-white sm:p-8">
                  <h3 className="text-[15px] font-semibold text-white/60">바로 연락하기</h3>
                  <a href={telHref(STORE.tel)} className="mt-3 block text-[28px] font-bold tracking-[-0.01em] sm:text-[32px]">
                    {STORE.tel}
                  </a>
                  <a href={telHref(STORE.mobile)} className="mt-1 block text-[18px] font-semibold text-white/85">
                    {STORE.mobile}
                  </a>
                  <p className="mt-5 border-t border-white/15 pt-5 text-[14px] text-white/70">
                    {STORE.hours} · {STORE.closed}
                  </p>
                </div>

                <div className="rounded-md border border-[#E4E0D8] bg-white p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-bold text-[#0E1A2B]">최근 문의 현황</h3>
                    <Link href="/inquiry" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#4B5260] hover:text-[#0E1A2B]">
                      문의게시판 <Icon d={I.right} className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  {recent.length === 0 ? (
                    <p className="mt-5 text-[14px] text-[#8A8478]">아직 표시할 문의가 없습니다.</p>
                  ) : (
                    <ul className="mt-4 divide-y divide-[#EEEBE5]">
                      {recent.map((r) => (
                        <li key={r.id} className="flex items-center gap-3 py-3 text-[14px]">
                          <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-bold ${typeShort(r.inquiry_type) === "매입" ? "bg-[#FBE9E1] text-[#B5431A]" : "bg-[#E8ECF2] text-[#0E1A2B]"}`}>
                            {typeShort(r.inquiry_type)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[#1F2530]">{r.category || "문의"}</span>
                          <span className="shrink-0 text-[12px] text-[#8A8478]">
                            {maskName(r.name)} · {r.status ?? "접수"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      {/* ─────────────── ⑪ FOOTER ─────────────── */}
      <footer className="bg-[#0B1522] text-white/70">
        <div className={`${WRAP} py-14 lg:py-16`}>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-[18px] font-bold text-white">한밭중고전자</p>
              <h2 className="mt-4 text-[15px] font-semibold text-white/85">전국 중고가전 판매·매입 전문, 한밭중고전자</h2>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed">
                한밭중고전자는 {STORE.since}년부터 쌓아온 중고가전 유통 노하우로 중고 냉장고, 세탁기, 에어컨, 냉난방기부터 업소용 냉장고, 제빙기, 쇼케이스, 상업용 주방기기까지 판매·매입합니다. 전국 단위 판매와 대량 거래가 가능하며, 제품 특성에 맞춰 배송과 설치를 진행합니다.
              </p>
            </div>
            <nav className="grid grid-cols-2 gap-8 text-[14px] sm:grid-cols-3 lg:col-span-7" aria-label="하단 메뉴">
              <div>
                <p className="font-semibold text-white">제품</p>
                <ul className="mt-4 space-y-2.5">
                  {NAV.slice(0, 5).map((n) => (
                    <li key={n.label}>
                      <a href={n.href} className="hover:text-white">{n.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white">고객지원</p>
                <ul className="mt-4 space-y-2.5">
                  <li><a href="#sell-section" className="hover:text-white">매입문의</a></li>
                  {NAV_EXTRA.map((n) => (
                    <li key={n.label}><a href={n.href} className="hover:text-white">{n.label}</a></li>
                  ))}
                  <li><a href={STORE.cafe} target="_blank" rel="noopener noreferrer" className="hover:text-white">네이버 카페</a></li>
                  <li><a href={STORE.kakaoChannel} target="_blank" rel="noopener noreferrer" className="hover:text-white">카카오톡 채널</a></li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="font-semibold text-white">매장</p>
                <ul className="mt-4 space-y-2.5">
                  <li>{STORE.address}</li>
                  <li><a href={telHref(STORE.tel)} className="hover:text-white">{STORE.tel}</a></li>
                  <li><a href={telHref(STORE.mobile)} className="hover:text-white">{STORE.mobile}</a></li>
                  <li>{STORE.hours}</li>
                </ul>
              </div>
            </nav>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-[12px] leading-relaxed text-white/45 lg:flex-row lg:items-end lg:justify-between">
            <p>
              상호 {STORE.name} · 대표 {STORE.ceo} · 사업자등록번호 {STORE.bizNo} · 통신판매업신고 {STORE.mailOrderNo}
              <br />
              개인정보관리책임자 {STORE.privacyOfficer} · {STORE.address}
              <br />© {new Date().getFullYear()} {STORE.name}. All rights reserved.
            </p>
            <div>
              {isAdmin ? (
                <button type="button" onClick={handleLogout} className="text-white/45 underline-offset-4 hover:text-white hover:underline">
                  관리자 로그아웃
                </button>
              ) : (
                <button type="button" onClick={() => setLoginOpen(true)} className="text-white/35 underline-offset-4 hover:text-white hover:underline">
                  관리자
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="h-[68px] lg:hidden" aria-hidden="true" />
      </footer>

      {/* ─────────────── 모바일 하단 고정 CTA ─────────────── */}
      {!menuOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E4E0D8] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="grid h-[60px] grid-cols-3">
            <a href={telHref(STORE.tel)} className="flex flex-col items-center justify-center gap-0.5 text-[12px] font-semibold text-[#0E1A2B]">
              <Icon d={I.phone} className="h-5 w-5" /> 전화
            </a>
            <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-0.5 border-x border-[#EEEBE5] text-[12px] font-semibold text-[#0E1A2B]">
              <Icon d={I.chat} className="h-5 w-5" /> 카카오톡
            </a>
            <button type="button" onClick={() => openInquiry()} className="flex flex-col items-center justify-center gap-0.5 bg-[#D9531E] text-[12px] font-semibold text-white">
              <Icon d={I.pen} className="h-5 w-5" /> 문의하기
            </button>
          </div>
        </div>
      )}

      {/* ─────────────── 라이트박스 ─────────────── */}
      <Modal open={!!lightbox} onClose={closeLightbox} label="배송·설치 사진" variant="dark">
        {lightbox && (
          <div className="relative flex w-full max-w-5xl flex-col">
            <div className="mb-3 flex items-center justify-between text-white">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{lightbox.review.title}</p>
                <p className="text-[12px] text-white/50">
                  {shortDate(lightbox.review.created_at)}
                  {lbImages.length > 1 && ` · ${lightbox.index + 1} / ${lbImages.length}`}
                </p>
              </div>
              <button type="button" onClick={closeLightbox} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white hover:bg-white/10" aria-label="닫기">
                <Icon d={I.close} />
              </button>
            </div>
            <div className="relative flex items-center justify-center">
              <img src={lbImages[lightbox.index]} alt={`${lightbox.review.title ?? "배송·설치"} 현장 사진 ${lightbox.index + 1}`} className="max-h-[78vh] w-auto max-w-full rounded object-contain" />
              {lbImages.length > 1 && (
                <>
                  <button type="button" onClick={() => moveLightbox(-1)} className="absolute left-1 grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70 sm:-left-14" aria-label="이전 사진">
                    <Icon d={I.left} />
                  </button>
                  <button type="button" onClick={() => moveLightbox(1)} className="absolute right-1 grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70 sm:-right-14" aria-label="다음 사진">
                    <Icon d={I.right} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─────────────── 관리자 로그인 ─────────────── */}
      <Modal open={loginOpen} onClose={() => setLoginOpen(false)} label="관리자 로그인">
        <form onSubmit={handleAdminLogin} className="w-full rounded-t-lg bg-white p-6 sm:max-w-sm sm:rounded-lg sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-[#0E1A2B]">관리자 로그인</h2>
            <button type="button" onClick={() => setLoginOpen(false)} className="grid h-9 w-9 place-items-center" aria-label="닫기">
              <Icon d={I.close} />
            </button>
          </div>
          <label className={`${LABEL} mt-5`} htmlFor="admin-email">이메일</label>
          <input id="admin-email" type="email" autoComplete="username" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={INPUT} />
          <label className={`${LABEL} mt-4`} htmlFor="admin-pw">비밀번호</label>
          <input id="admin-pw" type="password" autoComplete="current-password" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={INPUT} />
          <button type="submit" disabled={loggingIn} className={`${BTN_NAVY} mt-6 h-12 w-full text-[15px] disabled:opacity-60`}>
            {loggingIn ? "로그인 중…" : "로그인"}
          </button>
        </form>
      </Modal>

      {/* ─────────────── 인증사진 등록 (관리자) ─────────────── */}
      <Modal open={reviewModalOpen} onClose={closeReviewModal} label="배송·설치 인증사진 등록">
        <form onSubmit={handleReviewUpload} className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white p-6 sm:max-w-lg sm:rounded-lg sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-[#0E1A2B]">배송·설치 인증사진 등록</h2>
            <button type="button" onClick={closeReviewModal} className="grid h-9 w-9 place-items-center" aria-label="닫기">
              <Icon d={I.close} />
            </button>
          </div>
          <label className={`${LABEL} mt-5`} htmlFor="review-title">제목</label>
          <input id="review-title" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} placeholder="예) 대전 유성구 식당 45박스 냉장고 설치" className={INPUT} />
          <p className={`${LABEL} mt-4`}>사진 (최대 {MAX_REVIEW_PHOTOS}장)</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {reviewPreviews.map((src, i) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded bg-[#EFECE6]">
                <img src={src} alt={`선택한 사진 ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(src);
                    setReviewFiles((f) => f.filter((_, j) => j !== i));
                    setReviewPreviews((p) => p.filter((_, j) => j !== i));
                  }}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                  aria-label={`사진 ${i + 1} 삭제`}
                >
                  <Icon d={I.close} className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {reviewFiles.length < MAX_REVIEW_PHOTOS && (
              <label className="grid aspect-square cursor-pointer place-items-center rounded border border-dashed border-[#CFCAC0] text-[#8A8478] hover:border-[#0E1A2B] hover:text-[#0E1A2B]">
                <Icon d={I.plus} />
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { pickReviewFiles(e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>
          <button type="submit" disabled={uploadingReview} className={`${BTN_NAVY} mt-6 h-12 w-full text-[15px] disabled:opacity-60`}>
            {uploadingReview ? "업로드 중…" : "등록하기"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   6. 문의 폼
   ════════════════════════════════════════════════════════════ */
function InquiryForm({ type, setType, onSubmitted }: { type: InquiryType; setType: (t: InquiryType) => void; onSubmitted: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSell = type === "내 물건 팔기";

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    const next = validateImages([...files, ...Array.from(list)], MAX_PHOTOS);
    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };
  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setFiles((f) => f.filter((_, j) => j !== i));
    setPreviews((p) => p.filter((_, j) => j !== i));
  };

  const reset = () => {
    setName("");
    setPhone("");
    setTitle("");
    setModel("");
    setDescription("");
    setPassword("");
    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles([]);
    setPreviews([]);
    setAgree(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("이름을 입력해 주세요.");
    if (!isValidPhone(phone)) return toast.error("연락처를 정확히 입력해 주세요.");
    if (!title.trim()) return toast.error(isSell ? "매입 받을 제품을 입력해 주세요." : "찾으시는 제품을 입력해 주세요.");
    if (!description.trim()) return toast.error("문의 내용을 입력해 주세요.");
    if (password.length < 4) return toast.error("게시글 비밀번호를 4자리 이상 입력해 주세요.");
    if (!agree) return toast.error("개인정보 수집·이용에 동의해 주세요.");

    setSubmitting(true);
    try {
      const images = files.length ? await uploadImages(BUCKET.inquiries, files) : [];
      const finalDescription = model.trim() ? `[모델명] ${model.trim()}\n\n${description.trim()}` : description.trim();
      const { error } = await supabase.from(TABLE.inquiries).insert({
        name: name.trim(),
        phone,
        password,
        inquiry_type: type,
        category: title.trim(),
        region: "대전/기타",
        description: finalDescription,
        images,
        status: "접수",
      });
      if (error) throw error;

      fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone, type, title: title.trim() }),
      }).catch((err) => console.error("텔레그램 알림 실패:", err));

      toast.success("문의가 접수되었습니다. 확인 후 연락드리겠습니다.");
      reset();
      onSubmitted();
    } catch (err) {
      console.error(err);
      toast.error("접수하지 못했습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-7" noValidate>
      <fieldset>
        <legend className={LABEL}>문의 유형</legend>
        <div className="grid grid-cols-3 gap-1 rounded-md bg-[#F2F0EC] p-1">
          {INQUIRY_TYPES.map((t) => (
            <label key={t} className={`flex h-11 cursor-pointer items-center justify-center rounded text-[14px] font-semibold transition-colors ${type === t ? "bg-white text-[#0E1A2B] shadow-sm" : "text-[#6B7280] hover:text-[#0E1A2B]"}`}>
              <input type="radio" name="inquiry-type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
              {t === "내 물건 팔기" ? "매입(내 물건 팔기)" : t}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="iq-name">이름</label>
          <input id="iq-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} placeholder="홍길동" />
        </div>
        <div>
          <label className={LABEL} htmlFor="iq-phone">연락처</label>
          <input id="iq-phone" type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className={INPUT} placeholder="010-0000-0000" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <label className={LABEL} htmlFor="iq-title">{isSell ? "매입 받을 제품" : "찾으시는 제품"}</label>
          <input id="iq-title" value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT} placeholder={isSell ? "예) 업소용 45박스 냉장고 2대" : "예) 벽걸이 에어컨 6평형"} />
        </div>
        <div>
          <label className={LABEL} htmlFor="iq-model">
            모델명 <span className="font-normal text-[#8A8478]">(선택)</span>
          </label>
          <input id="iq-model" value={model} onChange={(e) => setModel(e.target.value)} className={INPUT} placeholder="아는 경우 입력" />
        </div>
      </div>

      <div className="mt-4">
        <label className={LABEL} htmlFor="iq-desc">문의 내용</label>
        <textarea
          id="iq-desc"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${INPUT} resize-none leading-relaxed`}
          placeholder={isSell ? "사용 기간, 상태, 수거 희망 지역·날짜를 알려주세요." : "원하시는 용량·크기, 예산, 배송 지역을 알려주세요."}
        />
      </div>

      <div className="mt-4">
        <p className={LABEL}>
          사진 <span className="font-normal text-[#8A8478]">(최대 {MAX_PHOTOS}장{isSell ? " · 매입 견적이 더 정확해집니다" : ""})</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={src} className="relative h-20 w-20 overflow-hidden rounded bg-[#EFECE6]">
              <img src={src} alt={`첨부 사진 ${i + 1}`} className="h-full w-full object-cover" />
              <button type="button" onClick={() => removeFile(i)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white" aria-label={`첨부 사진 ${i + 1} 삭제`}>
                <Icon d={I.close} className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {files.length < MAX_PHOTOS && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-[#CFCAC0] text-[11px] font-medium text-[#8A8478] transition-colors hover:border-[#0E1A2B] hover:text-[#0E1A2B]">
              <Icon d={I.camera} className="h-5 w-5" />
              사진 추가
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { pickFiles(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label className={LABEL} htmlFor="iq-pw">
          게시글 비밀번호 <span className="font-normal text-[#8A8478]">(문의게시판에서 내 글 확인용, 4자리 이상)</span>
        </label>
        <input id="iq-pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${INPUT} sm:max-w-[240px]`} />
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-[#4B5260]">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#0E1A2B]" />
        <span>
          상담을 위해 이름·연락처·문의 내용을 수집하며, 상담 완료 후 관련 법령에 따라 처리합니다. 개인정보 수집·이용에 동의합니다.
        </span>
      </label>

      <button type="submit" disabled={submitting} className={`${BTN_ACCENT} mt-6 h-14 w-full text-[16px] disabled:opacity-60`}>
        {submitting ? "접수 중…" : isSell ? "무료 매입 견적 요청하기" : "문의 접수하기"}
      </button>
    </form>
  );
}

/* ════════════════════════════════════════════════════════════
   7. 전역 CSS
   ════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
html{scroll-behavior:smooth;scroll-padding-top:84px}
.hb-root{word-break:keep-all;overflow-wrap:break-word;-webkit-font-smoothing:antialiased}
.hb-reveal{opacity:0;transform:translate3d(0,16px,0);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
.hb-reveal.is-in{opacity:1;transform:none}
.hb-fade{animation:hbFade .9s cubic-bezier(.16,1,.3,1) .1s both}
@keyframes hbFade{from{opacity:0;transform:translate3d(0,12px,0)}to{opacity:1;transform:none}}
.hb-scroll{scrollbar-width:none}.hb-scroll::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.hb-reveal,.hb-fade{opacity:1!important;transform:none!important;transition:none!important;animation:none!important}}
`;