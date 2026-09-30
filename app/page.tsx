"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import {
  STORE, telHref, formatPhone, isValidPhone, maskName, splitImages,
  compressImage, validateImageFiles, MAX_PHOTOS,
} from "../lib/site";
import {
  Icon, ICON, SafeImg, Modal, SectionHead, SiteHeader, SiteFooter, MobileCtaBar, AdminLoginModal,
} from "../lib/ui";

/* ───────── 타입 ───────── */
interface Review { id: string; title: string; image_url: string | null; created_at: string }
interface InquiryRow {
  id: string; inquiry_type: string | null; category: string | null; name: string | null;
  status: string | null; is_notice: boolean | null; created_at: string;
}

/* ───────── 정적 콘텐츠 ───────── */
// 배송인증 사진이 하나도 없을 때만 쓰는 임시 이미지입니다. 실제 매장·현장 사진으로 교체하세요.
const FALLBACK_HERO = [
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=1200&auto=format&fit=crop",
];

const TRUST = [
  { icon: ICON.shield, title: "세척·정비 완료", desc: "검수를 거친 A급 제품" },
  { icon: ICON.tool, title: "무상 A/S", desc: "에어컨·냉난방기 8개월 / 그 외 4개월" },
  { icon: ICON.receipt, title: "세금계산서 발행", desc: "투명한 거래 증빙" },
  { icon: ICON.truck, title: "전국 배송·설치 상담", desc: "제품·지역별 상담 가능" },
];

const CATEGORY_CARDS = [
  { cat: "에어컨/냉난방기", title: "에어컨 / 냉난방기", sub: "벽걸이 · 스탠드 · 시스템", img: "/images/cat-ac.png" },
  { cat: "냉장고", title: "냉장고", sub: "양문형 · 일반형 · 김치냉장고", img: "/images/cat-fridge.png" },
  { cat: "세탁기/건조기", title: "세탁기 / 건조기", sub: "통돌이 · 워시타워 · 건조기", img: "/images/cat-washer.png" },
  { cat: "업소용기기", title: "업소용 기기", sub: "45박스 냉장고 · 쇼케이스 · 제빙기", img: "/images/cat-commercial.png" },
];

const FEATURES = [
  { icon: ICON.tag, text: "투명하고 합리적인 최고가 매입" },
  { icon: ICON.chat, text: "피곤한 가격 흥정 없이 깔끔하게" },
  { icon: ICON.calendar, text: "무거운 대형 가전, 원하는 날짜에 수거" },
  { icon: ICON.tool, text: "중고 제품도 철저한 검수 및 A/S 보장" },
  { icon: ICON.receipt, text: "세금계산서 발행 등 투명한 거래 증빙" },
];

// 문구는 기존 FAQ·안내 내용을 바탕으로 정리했습니다. 실제 진행 방식과 다르면 수정하세요.
const STEPS = [
  { title: "사진·정보 접수", desc: "아래 문의 폼이나 카톡으로 제품 사진과 모델명을 보내주세요." },
  { title: "견적 안내", desc: "사진을 확인하고 투명한 매입 견적을 안내해 드립니다." },
  { title: "방문 확인·수거", desc: "원하시는 날짜에 기사님이 방문해 상태를 최종 확인하고 수거합니다." },
  { title: "즉시 입금", desc: "수거가 완료되는 즉시 지정 계좌로 100% 전액 입금합니다." },
];

const FAQ = [
  { q: "먼 지역(수도권·타 광역시)도 배송이나 설치가 가능한가요?", a: "가능합니다. 제품과 지역에 따라 전국 어디든 배송·설치 상담이 가능합니다. 실제로 구미, 포항, 경산, 안동, 경주는 물론 창원, 부산, 거제 등 여러 지역의 거래 사례가 있습니다." },
  { q: "구매 후 고장이 나면 어떻게 하나요?", a: "에어컨 및 냉난방기는 8개월, 그 외 제품은 4개월 무상 A/S를 보장합니다. (단, 계약 내용에 따라 보증 기간은 달라질 수 있습니다.)" },
  { q: "매입이 결정되면 대금 지급은 어떻게 이루어지나요?", a: "기사님이 현장에 방문하여 제품 상태를 최종 확인하고 수거가 완료되는 즉시, 지정해주신 계좌로 100% 전액 입금 처리해 드립니다." },
  { q: "영업시간과 매장 위치가 어떻게 되나요?", a: `영업시간은 09:00 ~ 19:00 (일요일 휴무)이며, 오프라인 매장은 ${STORE.address}에 위치해 있습니다.` },
];

// 검색엔진용 구조화 데이터. 숨김 키워드 나열 대신 사용합니다.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": `${STORE.url}/#store`,
      name: STORE.name,
      url: STORE.url,
      telephone: "+82-42-523-8179",
      foundingDate: String(STORE.since),
      description: "대전 중촌동 중고가전 판매·매입 전문점. 냉장고, 세탁기, 에어컨, 냉난방기, 업소용 주방기기.",
      address: { "@type": "PostalAddress", streetAddress: "중촌동 144", addressLocality: "중구", addressRegion: "대전광역시", addressCountry: "KR" },
      openingHoursSpecification: [{
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00", closes: "19:00",
      }],
      sameAs: [STORE.kakaoChannel, STORE.cafe],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

const inputCls = "w-full border border-slate-300 p-3 rounded-xl bg-slate-50 text-sm outline-none focus:border-[#0b4b8b] focus:bg-white focus:ring-2 focus:ring-[#0b4b8b]/15 transition";
const fmtDate = (s: string) => new Date(s).toLocaleDateString("ko-KR");

/* ───────── 배송·설치 카드 ───────── */
function ReviewCard({ review, isAdmin, onDelete, onEnlarge }: {
  review: Review; isAdmin: boolean; onDelete: (id: string) => void; onEnlarge: (r: Review, index: number) => void;
}) {
  const images = splitImages(review.image_url);
  const [idx, setIdx] = useState(0);
  const step = (d: number) => setIdx((i) => (i + d + images.length) % Math.max(images.length, 1));

  return (
    <figure className="group">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
        <button type="button" onClick={() => onEnlarge(review, idx)} aria-label={`${review.title} 사진 크게 보기`} className="absolute inset-0 w-full h-full focus-visible:ring-2 focus-visible:ring-[#0b4b8b] focus-visible:ring-inset">
          <SafeImg src={images[idx]} alt={review.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </button>
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => step(-1)} aria-label="이전 사진" className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-[#0b4b8b] transition">
              <Icon d={ICON.left} />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="다음 사진" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-[#0b4b8b] transition">
              <Icon d={ICON.right} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/35 px-2 py-1 rounded-full">
              {images.map((_, i) => (
                <button key={i} type="button" onClick={() => setIdx(i)} aria-label={`${i + 1}번째 사진`} className={`w-1.5 h-1.5 rounded-full transition ${i === idx ? "bg-white scale-125" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
        {isAdmin && (
          <button type="button" onClick={() => onDelete(review.id)} aria-label="사진 삭제" className="absolute top-2 right-2 bg-red-600/90 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition">
            <Icon d={ICON.close} className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <figcaption className="mt-2.5 px-1">
        <p className="text-sm font-bold text-slate-800 line-clamp-1">{review.title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{fmtDate(review.created_at)}</p>
      </figcaption>
    </figure>
  );
}

/* ───────── 미리보기 썸네일 ───────── */
function PreviewGrid({ previews, onRemove }: { previews: string[]; onRemove: (i: number) => void }) {
  if (!previews.length) return null;
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {previews.map((src, i) => (
        <div key={src} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`첨부 사진 ${i + 1} 미리보기`} className="w-full h-full object-cover" />
          <button type="button" onClick={() => onRemove(i)} aria-label={`${i + 1}번 사진 삭제`} className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center transition">
            <Icon d={ICON.close} className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  /* 데이터 */
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [inquiryTotal, setInquiryTotal] = useState(0);

  /* 히어로 슬라이드 */
  const heroImages = useMemo(() => {
    const real = reviews.map((r) => splitImages(r.image_url)[0]).filter(Boolean).slice(0, 4);
    return real.length ? { list: real, real: true } : { list: FALLBACK_HERO, real: false };
  }, [reviews]);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    if (heroImages.list.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setHeroIdx((p) => (p + 1) % heroImages.list.length), 5000);
    return () => clearInterval(timer);
  }, [heroImages.list.length]);

  /* 관리자 */
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  /* 문의 폼 */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inquiryType, setInquiryType] = useState("구매 문의");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasElevator, setHasElevator] = useState("있음 (제품 적재 가능)");
  const [hasStairs, setHasStairs] = useState("없음 (1층 또는 엘리베이터 이동)");

  /* 인증사진 등록/확대 */
  const [isReviewUploadOpen, setIsReviewUploadOpen] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [reviewPreviews, setReviewPreviews] = useState<string[]>([]);
  const [uploadingReview, setUploadingReview] = useState(false);
  const [enlargedReview, setEnlargedReview] = useState<Review | null>(null);
  const [enlargedIndex, setEnlargedIndex] = useState(0);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* ───── 데이터 로딩 ─────
     공개 페이지에서는 화면에 필요한 컬럼만 가져옵니다. (이전: purchase_requests select("*") → 연락처·비밀번호까지 브라우저로 내려옴) */
  const fetchData = async () => {
    const [inq, rev] = await Promise.all([
      supabase
        .from("purchase_requests")
        .select("id, inquiry_type, category, name, status, is_notice, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("products")
        .select("id, title, image_url, created_at")
        .eq("category", "배송인증")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    if (inq.data) { setInquiries(inq.data as InquiryRow[]); setInquiryTotal(inq.count ?? inq.data.length); }
    if (rev.data) setReviews(rev.data as Review[]);
    setReviewsLoaded(true);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    checkSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setIsAdmin(!!session));
    fetchData();
    return () => authListener.subscription.unsubscribe();
  }, []);

  /* ───── 관리자 ───── */
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
      if (error) throw error;
      toast.success("관리자 로그인에 성공했습니다.");
      setIsAdminAuthModalOpen(false);
      setAdminEmail("");
      setAdminPassword("");
    } catch {
      toast.error("로그인 실패: 이메일이나 비밀번호를 확인해 주세요.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    if (confirm("관리자 모드를 종료하시겠습니까?")) {
      await supabase.auth.signOut();
      toast.success("관리자 모드가 종료되었습니다.");
    }
  };

  /* ───── 사진 선택 공통 ───── */
  const pickFiles = (
    e: React.ChangeEvent<HTMLInputElement>,
    current: File[],
    setFiles: (f: File[]) => void,
    setPreviews: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    const { ok, error } = validateImageFiles(picked);
    if (error) toast.error(error);
    if (current.length + ok.length > MAX_PHOTOS) {
      toast.error(`사진은 최대 ${MAX_PHOTOS}장까지 등록 가능합니다.`);
      return;
    }
    setFiles([...current, ...ok]);
    setPreviews((prev) => [...prev, ...ok.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (
    index: number, files: File[], previews: string[],
    setFiles: (f: File[]) => void, setPreviews: (p: string[]) => void
  ) => {
    URL.revokeObjectURL(previews[index]);
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const clearFiles = (previews: string[], setFiles: (f: File[]) => void, setPreviews: (p: string[]) => void) => {
    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles([]);
    setPreviews([]);
  };

  const uploadAll = async (files: File[], prefix: string) => {
    const urls: string[] = [];
    for (const file of files) {
      const blob = await compressImage(file);
      const fileName = `${prefix}${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const { error: uploadError } = await supabase.storage.from("inquiries").upload(fileName, blob, { contentType: "image/jpeg" });
      if (uploadError) throw new Error(`업로드 실패 (${uploadError.message})`);
      const { data } = supabase.storage.from("inquiries").getPublicUrl(fileName);
      if (data?.publicUrl) urls.push(data.publicUrl);
    }
    return urls;
  };

  /* ───── 문의 접수 ───── */
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !name.trim() || !phone.trim() || !password.trim()) {
      toast.error("필수 항목(* 표시)을 모두 입력해 주세요.");
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error("연락처를 올바르게 입력해 주세요. (예: 010-0000-0000)");
      return;
    }
    if (password.trim().length < 4) {
      toast.error("조회용 비밀번호는 4자 이상 입력해 주세요.");
      return;
    }
    if (!agreed) {
      toast.error("개인정보 처리방침에 동의해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const uploadedUrls = await uploadAll(selectedFiles, "");
      const finalDescription =
        inquiryType === "내 물건 팔기"
          ? `[현장 조건]\n- 엘리베이터: ${hasElevator}\n- 계단 작업: ${hasStairs}\n\n[상세 내용]\n${description}`
          : description;

      const { error } = await supabase.from("purchase_requests").insert({
        name, phone, password, inquiry_type: inquiryType,
        category: title, region: "대전/기타", description: finalDescription,
        images: uploadedUrls, is_notice: false, status: "접수",
      });
      if (error) throw error;

      fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, type: inquiryType, title }),
      }).catch((err) => console.error("텔레그램 전송 요청 실패:", err));

      toast.success("문의가 성공적으로 접수되었습니다! 빠르게 확인 후 연락드리겠습니다.");
      setName(""); setPhone(""); setPassword(""); setTitle(""); setDescription("");
      clearFiles(filePreviews, setSelectedFiles, setFilePreviews);
      setAgreed(false);
      setHasElevator("있음 (제품 적재 가능)"); setHasStairs("없음 (1층 또는 엘리베이터 이동)");
      fetchData();
    } catch (error: any) {
      toast.error("오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ───── 인증사진 등록/삭제 ───── */
  const closeReviewUpload = () => {
    setIsReviewUploadOpen(false);
    setReviewTitle("");
    clearFiles(reviewPreviews, setReviewFiles, setReviewPreviews);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || reviewFiles.length === 0) {
      toast.error("제목과 최소 1장의 사진을 등록해주세요.");
      return;
    }
    setUploadingReview(true);
    try {
      const urls = await uploadAll(reviewFiles, "review_");
      const { error } = await supabase.from("products").insert({
        title: reviewTitle, category: "배송인증", image_url: urls.join(","), price: 0, status: "판매중",
      });
      if (error) throw error;
      toast.success("인증사진 등록 완료.");
      closeReviewUpload();
      fetchData();
    } catch (error: any) {
      toast.error("오류 발생: " + error.message);
    } finally {
      setUploadingReview(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("이 인증사진을 정말 삭제하시겠습니까?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("삭제되었습니다.");
      fetchData();
    } catch (error: any) {
      toast.error("삭제 실패: " + error.message);
    }
  };

  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const handleGalleryDirectInquiry = () => {
    if (!enlargedReview) return;
    setInquiryType("구매 문의");
    setTitle(`[갤러리 참고] '${enlargedReview.title}' 현장 관련 상담 요청`);
    setEnlargedReview(null);
    setTimeout(() => scrollToSection("inquiry-section"), 150);
  };

  const showReviewSection = reviewsLoaded && (reviews.length > 0 || isAdmin);
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 10);
  const enlargedImages = enlargedReview ? splitImages(enlargedReview.image_url) : [];
  const stepEnlarged = (d: number) => setEnlargedIndex((i) => (i + d + enlargedImages.length) % enlargedImages.length);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }} />

      {/* 우측 퀵메뉴 (넓은 화면 전용) */}
      <aside aria-label="빠른 메뉴" className="fixed right-3 top-1/3 z-30 hidden xl:flex flex-col gap-1.5 bg-white shadow-2xl rounded-2xl p-2 border border-slate-200">
        <a href={telHref(STORE.tel)} className="flex flex-col items-center justify-center w-16 h-16 bg-[#0b4b8b] text-white rounded-xl hover:opacity-90 transition text-[11px] font-black gap-1">
          <Icon d={ICON.phone} className="w-5 h-5" /><span>전화상담</span>
        </a>
        <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center w-16 h-16 bg-[#FEE500] text-slate-900 rounded-xl hover:opacity-90 transition text-[11px] font-black gap-1">
          <Icon d={ICON.chat} className="w-5 h-5" /><span>카톡상담</span>
        </a>
        <button type="button" onClick={() => scrollToSection("inquiry-section")} className="flex flex-col items-center justify-center w-16 h-16 bg-slate-800 text-white rounded-xl hover:opacity-90 transition text-[11px] font-black gap-1">
          <Icon d={ICON.edit} className="w-5 h-5" /><span>판매/매입</span>
        </button>
        <a href={STORE.cafe} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center w-16 h-16 bg-emerald-600 text-white rounded-xl hover:opacity-90 transition text-[11px] font-black gap-1">
          <Icon d={ICON.list} className="w-5 h-5" /><span>제품확인</span>
        </a>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex flex-col items-center justify-center w-16 h-12 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition text-[10px] font-black">
          <Icon d={ICON.up} className="w-4 h-4" /><span>TOP</span>
        </button>
      </aside>

      <SiteHeader>
        <a href={telHref(STORE.tel)} className="inline-flex items-center gap-1.5 bg-[#0b4b8b] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition shadow-md whitespace-nowrap">
          <Icon d={ICON.phone} /> <span className="hidden min-[400px]:inline">{STORE.tel}</span><span className="min-[400px]:hidden">전화</span>
        </a>
        <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 bg-[#FEE500] hover:bg-[#f5dc00] text-slate-900 text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-md whitespace-nowrap">
          <Icon d={ICON.chat} /> 카톡 견적문의
        </a>
        <a href="/inquiry" className="hidden md:inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-900 text-sm font-extrabold px-4 py-2.5 rounded-xl transition shadow-md whitespace-nowrap">
          <Icon d={ICON.list} /> 문의게시판
        </a>
      </SiteHeader>

      {/* ───── Hero ───── */}
      <section className="relative bg-gradient-to-b from-white to-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-12 lg:pt-24 lg:pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#0b4b8b] text-xs font-black tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-600 motion-safe:animate-pulse" />
              SINCE {STORE.since} · 대전 오프라인 매장 운영
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.2] tracking-tighter mb-6 break-keep">
              30년의 정직함,<br />
              대전·충청 중고가전의<br className="hidden lg:block" />
              <span className="text-[#0b4b8b]">확실한 기준</span>이 되다.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0 break-keep font-medium">
              가정용 이사 정리부터 식당·카페 폐업 대량 매입까지.
              눈속임 없는 투명한 견적과 철저한 A/S로 고객님의 부담을 확실하게 덜어드립니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <a href="#inquiry-section" className="w-full sm:w-auto px-8 py-4 bg-[#0b4b8b] text-white rounded-xl font-bold text-[15px] hover:bg-[#093c70] transition shadow-md flex items-center justify-center gap-2">
                무료 견적 · 매입 상담 <Icon d={ICON.arrow} className="w-4 h-4" />
              </a>
              <a href="/gallery" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-[15px] hover:bg-slate-50 transition shadow-sm flex items-center justify-center">
                판매 중인 제품 보기
              </a>
            </div>
          </div>

          <div className="relative hidden md:block max-w-lg lg:max-w-none w-full mx-auto">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative bg-slate-200">
              {heroImages.list.map((src, i) => (
                <div key={src} className={`absolute inset-0 transition-opacity duration-1000 ${heroIdx % heroImages.list.length === i ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                  <SafeImg src={src} alt={heroImages.real ? "한밭중고전자 배송·설치 현장 사진" : "중고 가전 제품 이미지"} eager={i === 0} className="w-full h-full object-cover" />
                </div>
              ))}
              {heroImages.real && (
                <span className="absolute top-4 left-4 z-20 bg-black/55 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">실제 배송·설치 현장</span>
              )}
              <div className="absolute bottom-5 right-5 flex gap-2 z-20">
                {heroImages.list.map((_, i) => (
                  <button key={i} type="button" onClick={() => setHeroIdx(i)} aria-label={`${i + 1}번째 사진 보기`}
                    className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${heroIdx % heroImages.list.length === i ? "bg-white w-7" : "bg-white/60 w-2.5 hover:bg-white"}`} />
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white px-5 py-4 rounded-2xl shadow-xl border border-slate-100 z-20">
              <p className="text-[11px] font-black tracking-widest text-[#0b4b8b]">SINCE {STORE.since}</p>
              <p className="text-lg font-black text-slate-900 tracking-tight">대전 중촌동 오프라인 매장</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {TRUST.map((t) => (
              <li key={t.title} className="flex items-start gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#0b4b8b] flex items-center justify-center shrink-0"><Icon d={t.icon} className="w-5 h-5" /></span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 break-keep leading-snug">{t.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───── 카테고리 ───── */}
      <section className="py-16 sm:py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHead eyebrow="Products" title="어떤 제품을 찾으시나요?" desc="가정용부터 업소용까지, 꼼꼼하게 세척 및 정비된 A급 제품들입니다.">
            <a href="/gallery" className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-[#0b4b8b] hover:underline">전체 제품 보기 <Icon d={ICON.arrow} /></a>
          </SectionHead>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {CATEGORY_CARDS.map((c) => (
              <a key={c.cat} href={`/gallery?category=${encodeURIComponent(c.cat)}`} className="group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 shadow-sm hover:shadow-xl transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0b4b8b]">
                <SafeImg src={c.img} alt="" hideOnError className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-4 sm:p-5">
                  <h3 className="text-white font-bold text-base sm:text-xl tracking-tight">{c.title}</h3>
                  <p className="text-slate-300 text-[11px] sm:text-sm mt-1 flex items-center justify-between gap-2">
                    <span className="break-keep">{c.sub}</span>
                    <Icon d={ICON.arrow} className="w-4 h-4 shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition" />
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 안심 시스템 (다크 섹션으로 리듬 주기) ───── */}
      <section className="py-16 sm:py-24 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="text-center lg:text-left">
            <p className="text-xs font-black tracking-widest uppercase text-blue-300 mb-3">Why Hanbat</p>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black leading-[1.25] tracking-tighter mb-5 break-keep">
              중고가전 처분·구매,<br />이런 고민 중이세요?
            </h2>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-200 leading-snug mb-6 break-keep">
              언제 알아보고,<br />견적받고, 운반하고...
            </p>
            <p className="text-slate-400 text-[15px] leading-relaxed mb-8 break-keep max-w-lg mx-auto lg:mx-0">
              한밭중고전자는 폐업이나 이사 등으로 힘들어하시는 고객님들에게
              중고가전 처분과 구매만큼은 그 부담을 확실하게 덜어드리고자 합니다.
            </p>
            <a href="#inquiry-section" className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-7 py-3.5 rounded-xl hover:bg-slate-100 transition text-[15px]">
              빠른 견적 & 상담 요청 <Icon d={ICON.arrow} />
            </a>
          </div>
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 hover:bg-white/10 transition">
                <span className="w-10 h-10 rounded-xl bg-[#0b4b8b] flex items-center justify-center shrink-0"><Icon d={f.icon} className="w-5 h-5" /></span>
                <span className="font-bold text-[15px] sm:text-base break-keep">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───── 배송·설치 인증 (사진이 없으면 일반 방문자에게는 숨김) ───── */}
      {showReviewSection && (
        <section id="reviews-section" className="max-w-7xl mx-auto w-full px-4 py-16 sm:py-20 scroll-mt-24">
          <SectionHead eyebrow="Delivery & Installation" title="배송·설치 인증 갤러리" desc="한밭중고전자의 꼼꼼하고 안전한 실제 배송 및 설치 현장입니다.">
            {isAdmin && (
              <button type="button" onClick={() => setIsReviewUploadOpen(true)} className="mt-5 inline-flex items-center gap-1.5 bg-[#0b4b8b] hover:bg-[#093c70] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-md">
                <Icon d={ICON.plus} /> 사진 올리기
              </button>
            )}
          </SectionHead>
          {reviews.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-12 bg-white rounded-2xl border border-dashed border-slate-300">아직 등록된 인증사진이 없습니다. (관리자에게만 보이는 안내입니다.)</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-6 sm:gap-x-5">
                {visibleReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} isAdmin={isAdmin} onDelete={handleDeleteReview}
                    onEnlarge={(r, index) => { setEnlargedReview(r); setEnlargedIndex(index); }} />
                ))}
              </div>
              {reviews.length > 10 && (
                <div className="text-center mt-10">
                  <button type="button" onClick={() => setShowAllReviews((v) => !v)} className="text-sm font-bold text-[#0b4b8b] bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-xl transition">
                    {showAllReviews ? "접기" : `현장 사진 더 보기 (${reviews.length - 10}건)`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ───── 매입 진행 절차 ───── */}
      <section className="py-16 sm:py-20 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHead eyebrow="How it works" title="내 물건 팔기, 이렇게 진행됩니다" desc="사진 한 장으로 시작해 수거 즉시 입금까지, 복잡한 절차 없이 진행됩니다." />
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <span className="w-9 h-9 rounded-full bg-[#0b4b8b] text-white font-black flex items-center justify-center mb-4">{i + 1}</span>
                <h3 className="font-black text-slate-900 mb-1.5">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed break-keep">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───── 통합 문의 ───── */}
      <section id="inquiry-section" className="bg-slate-50 py-16 sm:py-20 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHead eyebrow="Customer Service" title="판매 / 매입 통합 문의" desc="필요하신 제품 구매나 안 쓰시는 가전 매입 견적을 간편하게 남겨주세요." />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-5 pb-4 border-b border-slate-100">바로 연락하기</h3>
                <div className="space-y-5 text-sm">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-1">대표 연락처</span>
                    <a href={telHref(STORE.tel)} className="font-black text-[#0b4b8b] text-2xl hover:underline block">{STORE.tel}</a>
                    <a href={telHref(STORE.mobile)} className="font-bold text-slate-600 text-lg hover:underline block mt-1">{STORE.mobile}</a>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-1">영업 시간</span>
                    <p className="font-bold text-slate-800">{STORE.hours} <span className="text-slate-500 font-medium">({STORE.closed})</span></p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className="bg-[#FEE500] hover:bg-[#f5dc00] text-slate-900 flex flex-col items-center justify-center p-4 rounded-2xl transition shadow-sm gap-2">
                  <Icon d={ICON.chat} className="w-7 h-7" />
                  <span className="text-[13px] font-black">카톡 상담</span>
                </a>
                <a href={telHref(STORE.tel)} className="bg-[#0b4b8b] hover:bg-[#093c70] text-white flex flex-col items-center justify-center p-4 rounded-2xl transition shadow-sm gap-2">
                  <Icon d={ICON.phone} className="w-7 h-7" />
                  <span className="text-[13px] font-black">전화 상담</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-6">문의 및 견적 작성</h3>
                <form onSubmit={handleInquirySubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <label htmlFor="inq-type" className="block text-xs font-bold text-slate-600 mb-1.5">문의 구분 *</label>
                      <select id="inq-type" value={inquiryType} onChange={(e) => setInquiryType(e.target.value)} className={`${inputCls} bg-white font-bold text-[#0b4b8b]`}>
                        <option value="구매 문의">상품 구매 문의</option>
                        <option value="내 물건 팔기">내 물건 팔기 (매입 견적)</option>
                        <option value="기타 문의">기타 문의</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="inq-pw" className="block text-xs font-bold text-slate-600 mb-1.5">조회용 비밀번호 *</label>
                      <div className="relative">
                        <input id="inq-pw" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={4}
                          className={`${inputCls} bg-white pr-14`} placeholder="숫자 4자리 권장" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0b4b8b] text-xs font-bold">
                          {showPassword ? "숨김" : "보기"}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">나중에 문의 내용을 확인할 때 사용합니다.</p>
                    </div>
                  </div>

                  {inquiryType === "내 물건 팔기" && (
                    <div className="bg-[#f0f6ff] border border-blue-200 rounded-2xl p-4 sm:p-5">
                      <p className="text-sm font-black text-[#0b4b8b] mb-3">빠르고 정확한 매입 접수 가이드</p>
                      <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed bg-white rounded-xl border border-blue-100 p-4 mb-4 break-keep">
                        가전제품의 <strong className="text-blue-600">정면, 측면, 내부(모델명 스티커)</strong> 사진을 함께 첨부해 주시면 훨씬 빠르고 정확한 최고가 매입 견적 산출이 가능합니다.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl border border-blue-100">
                        <div>
                          <label htmlFor="inq-elev" className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">엘리베이터 유무 (필수)</label>
                          <select id="inq-elev" value={hasElevator} onChange={(e) => setHasElevator(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 font-medium">
                            <option value="있음 (제품 적재 가능)">있음 (제품 적재 가능)</option>
                            <option value="있으나 작음 (적재 불가할 수 있음)">있으나 작음 (적재 불가할 수 있음)</option>
                            <option value="없음">없음</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="inq-stairs" className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">계단 작업 유무 (필수)</label>
                          <select id="inq-stairs" value={hasStairs} onChange={(e) => setHasStairs(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 font-medium">
                            <option value="없음 (1층 또는 엘리베이터 이동)">없음 (1층 또는 엘리베이터 이동)</option>
                            <option value="있음 (몇 층인지 아래에 기재 부탁드립니다)">있음 (사람이 들고 계단 이동)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="inq-name" className="block text-xs font-bold text-slate-600 mb-1.5">성함 / 상호명 *</label>
                      <input id="inq-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className={inputCls} placeholder="성함을 입력해 주세요" />
                    </div>
                    <div>
                      <label htmlFor="inq-phone" className="block text-xs font-bold text-slate-600 mb-1.5">연락처 *</label>
                      <input id="inq-phone" type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} required className={inputCls} placeholder="010-0000-0000" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="inq-title" className="block text-xs font-bold text-slate-600 mb-1.5">제목 (제품명/수량) *</label>
                    <input id="inq-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputCls}
                      placeholder={inquiryType === "내 물건 팔기" ? "예: 양문형 냉장고 및 세탁기 매입 견적 문의" : "예: OOO 제품 구매 및 배송 문의드립니다."} />
                  </div>

                  <div>
                    <label htmlFor="inq-desc" className="block text-xs font-bold text-slate-600 mb-1.5">상세 내용</label>
                    <textarea id="inq-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${inputCls} resize-none leading-relaxed`}
                      placeholder={inquiryType === "내 물건 팔기" ? "제품의 제조년월, 수리 이력, 스크래치 등 특이사항과 주소지(동, 층수)를 자세히 적어주시면 정확한 매입 견적이 가능합니다." : "방문 희망 일정, 배송 지역 등을 자유롭게 작성해 주세요."} />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label htmlFor="inq-files" className="flex items-center gap-2 text-[13px] font-bold text-slate-800 mb-2">
                      <Icon d={ICON.image} className="w-4 h-4 text-slate-500" /> 사진 첨부 (선택, 최대 {MAX_PHOTOS}장)
                    </label>
                    <input id="inq-files" type="file" accept="image/*" multiple disabled={selectedFiles.length >= MAX_PHOTOS}
                      onChange={(e) => pickFiles(e, selectedFiles, setSelectedFiles, setFilePreviews)}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-200 cursor-pointer disabled:opacity-50" />
                    <PreviewGrid previews={filePreviews} onRemove={(i) => removeFile(i, selectedFiles, filePreviews, setSelectedFiles, setFilePreviews)} />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="privacy" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-4 h-4 accent-[#0b4b8b] cursor-pointer" />
                      <label htmlFor="privacy" className="text-xs text-slate-600 cursor-pointer font-medium">
                        <a href="/privacy" target="_blank" className="underline font-bold text-[#0b4b8b] hover:text-blue-800">개인정보처리방침</a>에 동의합니다. (필수)
                      </label>
                    </div>
                    <button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[200px] bg-[#0b4b8b] hover:bg-[#093c70] disabled:opacity-60 disabled:cursor-wait text-white font-black py-4 px-8 rounded-xl transition shadow-md text-[15px]">
                      {loading ? "접수 처리 중..." : "이 내용으로 접수하기"}
                    </button>
                  </div>
                </form>
              </div>

              {/* 최근 문의: 데이터가 있을 때만, 최신 5건만 */}
              {inquiries.length > 0 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-900">최근 문의 현황 <span className="text-sm font-bold text-slate-400 ml-1">총 {inquiryTotal}건</span></h3>
                    <a href="/inquiry" className="text-xs font-bold text-[#0b4b8b] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1">전체보기 <Icon d={ICON.arrow} className="w-3 h-3" /></a>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {inquiries.map((inq) => (
                      <li key={inq.id}>
                        <a href="/inquiry" className="flex items-center gap-3 py-3.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition">
                          <span className="hidden sm:inline-block shrink-0 bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-md text-[11px]">{inq.inquiry_type || "문의"}</span>
                          <span className="flex-1 min-w-0 font-bold text-slate-800 text-sm truncate">{inq.category}</span>
                          <span className="hidden sm:inline text-slate-500 text-xs shrink-0">{inq.is_notice ? inq.name : maskName(inq.name)}</span>
                          <span className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold ${inq.status === "답변완료" ? "bg-[#0b4b8b] text-white" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>{inq.status || "접수"}</span>
                          <span className="text-slate-400 text-[11px] shrink-0 w-16 text-right">{fmtDate(inq.created_at)}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="bg-white py-16 sm:py-20 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-4">
          <SectionHead eyebrow="FAQ" title="자주 묻는 질문" />
          <div className="space-y-3">
            {FAQ.map((faq, idx) => {
              const open = openFaq === idx;
              return (
                <div key={faq.q} className={`border rounded-2xl overflow-hidden transition-colors ${open ? "border-[#0b4b8b]/40 bg-blue-50/30" : "border-slate-200 bg-white"}`}>
                  <h3>
                    <button type="button" id={`faq-q-${idx}`} aria-expanded={open} aria-controls={`faq-a-${idx}`} onClick={() => setOpenFaq(open ? null : idx)}
                      className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-50/70 transition">
                      <span className="flex items-start gap-3">
                        <span className="text-[#0b4b8b] font-black text-lg leading-none mt-0.5">Q</span>
                        <span className="font-bold text-slate-900 text-sm sm:text-base break-keep">{faq.q}</span>
                      </span>
                      <Icon d={ICON.down} className={`w-5 h-5 text-[#0b4b8b] shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                    </button>
                  </h3>
                  <div id={`faq-a-${idx}`} role="region" aria-labelledby={`faq-q-${idx}`} className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#0b4b8b] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">A</span>
                        <p className="text-slate-600 text-sm leading-relaxed break-keep">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-center mt-10 text-slate-600 text-sm sm:text-base">
            더 궁금한 점은{" "}
            <a href={telHref(STORE.tel)} className="font-black text-[#0b4b8b] text-base sm:text-lg hover:underline">{STORE.tel}</a>
            {" "}또는{" "}
            <a href={telHref(STORE.mobile)} className="font-black text-[#0b4b8b] text-base sm:text-lg hover:underline">{STORE.mobile}</a>
            로 편히 문의해 주세요.
          </p>
        </div>
      </section>

      {/* ───── 오시는 길 ───── */}
      <section id="location-section" className="py-16 sm:py-24 bg-slate-50 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHead eyebrow="Location" title="매장 오시는 길" desc="한밭중고전자 오프라인 매장에 방문하셔서 직접 제품을 확인해 보세요." />
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row">
            <div className="w-full lg:w-1/2 h-[300px] sm:h-[350px] lg:h-auto bg-slate-200 relative">
              <iframe title={`${STORE.name} 위치 지도`} src={`https://maps.google.com/maps?q=${encodeURIComponent(STORE.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                className="absolute inset-0 w-full h-full border-0" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
            <div className="w-full lg:w-1/2 p-6 sm:p-10 flex flex-col justify-center">
              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{STORE.name}</h3>
                <p className="text-slate-600 font-medium break-keep">{STORE.address} ({STORE.addressNote})</p>
              </div>
              <ul className="space-y-5 mb-8">
                {[
                  { icon: ICON.phone, label: "고객센터 / 매장 전화", value: (
                    <>
                      <a href={telHref(STORE.tel)} className="hover:underline">{STORE.tel}</a> / <a href={telHref(STORE.mobile)} className="hover:underline">{STORE.mobile}</a>
                    </>
                  ) },
                  { icon: ICON.clock, label: "영업시간", value: <>{STORE.hours} <span className="text-sm font-medium text-slate-500 ml-1">({STORE.closed})</span></> },
                  { icon: ICON.car, label: "주차 안내", value: "매장 앞 전용 주차장 이용 가능" },
                ].map((row) => (
                  <li key={row.label} className="flex items-center gap-4">
                    <span className="w-10 h-10 bg-blue-50 text-[#0b4b8b] rounded-full flex items-center justify-center shrink-0"><Icon d={row.icon} className="w-5 h-5" /></span>
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-0.5">{row.label}</p>
                      <p className="text-base font-black text-slate-800 tracking-tight">{row.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <a href={`https://map.kakao.com/link/search/${encodeURIComponent(STORE.address)}`} target="_blank" rel="noopener noreferrer" className="bg-[#fee500] hover:bg-[#ebd300] text-[#191919] text-xs sm:text-sm font-black py-3.5 rounded-xl flex items-center justify-center transition shadow-sm">카카오맵</a>
                <a href={`https://map.naver.com/p/search/${encodeURIComponent(STORE.address)}`} target="_blank" rel="noopener noreferrer" className="bg-[#03c75a] hover:bg-[#02b351] text-white text-xs sm:text-sm font-black py-3.5 rounded-xl flex items-center justify-center transition shadow-sm">네이버지도</a>
                <a href={`tmap://search?name=${encodeURIComponent(STORE.name)}`} className="bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black py-3.5 rounded-xl flex items-center justify-center transition shadow-sm">티맵 (모바일)</a>
              </div>
              <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">모바일에서 버튼을 누르면 길안내 앱으로 바로 연결됩니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 외부 채널 배너 ───── */}
      <section className="max-w-7xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
        <div className="bg-emerald-50 border border-emerald-200/80 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md overflow-hidden p-2 text-white">
              <SafeImg src="/naver-cafe.png" alt="" hideOnError className="w-full h-full object-contain bg-white rounded-sm" />
              <span className="sr-only">네이버 카페</span>
            </div>
            <div>
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Product Catalog</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">한밭중고전자 상품 카페</h3>
              <p className="text-xs text-slate-600 mt-1">현재 판매 중인 실제 제품들을 확인해 보세요</p>
            </div>
          </div>
          <a href={STORE.cafe} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-2xl text-xs transition shadow-md whitespace-nowrap">제품 보러가기 →</a>
        </div>
        <div className="bg-yellow-50 border border-yellow-200/80 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center shrink-0 shadow-md overflow-hidden p-2 text-slate-900">
              <SafeImg src="/kakao-logo.png" alt="" hideOnError className="w-full h-full object-contain" />
              <span className="sr-only">카카오톡</span>
            </div>
            <div>
              <span className="text-xs font-black text-yellow-800 uppercase tracking-wider">KakaoTalk Channel</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">카카오톡 채널</h3>
              <p className="text-xs text-slate-600 mt-1">사진 보내고 실시간 견적받기</p>
            </div>
          </div>
          <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold px-5 py-3 rounded-2xl text-xs transition shadow-md whitespace-nowrap">채팅 상담 →</a>
        </div>
      </section>

      {/* ───── 업체 소개 문구 (보이는 텍스트만 유지) ───── */}
      <section className="bg-slate-100 py-10 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center sm:text-left">
          <h2 className="text-xs font-black text-slate-500 mb-2">전국 중고가전 판매·매입 전문, {STORE.name}</h2>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed break-keep">
            {STORE.name}은 30년 가까운 중고가전 유통 노하우를 바탕으로 중고 냉장고, 세탁기, 에어컨, 냉난방기부터 업소용 냉장고, 제빙기, 쇼케이스, 상업용 주방기기까지 다양한 제품을 판매·매입합니다.
            전국 단위 판매 및 대량 거래가 가능하며, 제품 특성에 맞는 배송과 설치 서비스를 제공합니다.
          </p>
        </div>
      </section>

      <SiteFooter isAdmin={isAdmin} onAdminClick={() => (isAdmin ? handleAdminLogout() : setIsAdminAuthModalOpen(true))} />
      <MobileCtaBar inquiryHref="#inquiry-section" />

      {/* ───── 사진 확대 모달 ───── */}
      {enlargedReview && (
        <Modal label={`${enlargedReview.title} 사진`} onClose={() => setEnlargedReview(null)} z="z-[100]" sheet={false} overlayClassName="bg-black/90" panelClassName="max-w-5xl">
          <div className="flex flex-col items-center">
            <div className="relative w-full flex items-center justify-center">
              <button type="button" onClick={() => setEnlargedReview(null)} aria-label="닫기" className="absolute -top-11 right-0 text-white/70 hover:text-white transition p-1">
                <Icon d={ICON.close} className="w-7 h-7" />
              </button>
              <SafeImg key={enlargedImages[enlargedIndex]} src={enlargedImages[enlargedIndex]} alt={enlargedReview.title} eager className="max-w-full max-h-[65vh] sm:max-h-[75vh] object-contain rounded-xl shadow-2xl" />
              {enlargedImages.length > 1 && (
                <>
                  <button type="button" onClick={() => stepEnlarged(-1)} aria-label="이전 사진" className="absolute left-1 sm:left-4 bg-black/60 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-[#0b4b8b] transition">
                    <Icon d={ICON.left} className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={() => stepEnlarged(1)} aria-label="다음 사진" className="absolute right-1 sm:right-4 bg-black/60 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-[#0b4b8b] transition">
                    <Icon d={ICON.right} className="w-5 h-5" />
                  </button>
                  <span className="absolute bottom-3 bg-black/50 text-white text-xs font-bold px-3 py-1 rounded-full">{enlargedIndex + 1} / {enlargedImages.length}</span>
                </>
              )}
            </div>
            <div className="mt-5 w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10">
              <div className="text-center sm:text-left">
                <span className="bg-[#0b4b8b] text-white text-[11px] font-bold px-2.5 py-1 rounded mb-2 inline-block">배송·설치 갤러리</span>
                <p className="font-black text-white text-base sm:text-lg">{enlargedReview.title}</p>
              </div>
              <button type="button" onClick={handleGalleryDirectInquiry} className="w-full sm:w-auto bg-white hover:bg-slate-100 text-[#0b4b8b] font-black py-3.5 px-6 rounded-xl transition shadow-lg whitespace-nowrap text-sm sm:text-base inline-flex items-center justify-center gap-1.5">
                이 현장처럼 견적/상담 신청하기 <Icon d={ICON.arrow} />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ───── 인증사진 등록 모달 (관리자) ───── */}
      {isReviewUploadOpen && (
        <Modal label="배송·설치 사진 등록" onClose={closeReviewUpload} panelClassName="sm:max-w-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-slate-200 p-6 max-h-[92vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-slate-900 mb-4">배송·설치 사진 등록</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label htmlFor="rv-title" className="block text-xs font-bold text-slate-600 mb-1">장소 및 내용 (제목)</label>
                <input id="rv-title" type="text" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} required className={inputCls} placeholder="예: 둔산동 식당 냉난방기 설치" />
              </div>
              <div>
                <label htmlFor="rv-files" className="block text-xs font-bold text-slate-600 mb-1">현장 사진 첨부 (최대 {MAX_PHOTOS}장, 첫 사진이 대표)</label>
                <input id="rv-files" type="file" accept="image/*" multiple disabled={reviewFiles.length >= MAX_PHOTOS} required={reviewFiles.length === 0}
                  onChange={(e) => pickFiles(e, reviewFiles, setReviewFiles, setReviewPreviews)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer disabled:opacity-50" />
                <PreviewGrid previews={reviewPreviews} onRemove={(i) => removeFile(i, reviewFiles, reviewPreviews, setReviewFiles, setReviewPreviews)} />
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={closeReviewUpload} className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50">취소</button>
                <button type="submit" disabled={uploadingReview} className="w-1/2 py-2.5 rounded-xl bg-[#0b4b8b] text-white font-bold text-xs hover:bg-[#093c70] transition shadow-sm disabled:opacity-50">
                  {uploadingReview ? "업로드 중..." : "등록하기"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {isAdminAuthModalOpen && (
        <AdminLoginModal email={adminEmail} password={adminPassword} loading={isLoggingIn}
          onEmail={setAdminEmail} onPassword={setAdminPassword} onSubmit={handleAdminAuth} onClose={() => setIsAdminAuthModalOpen(false)} />
      )}
    </div>
  );
}
// ===== 파일 끝 =====
