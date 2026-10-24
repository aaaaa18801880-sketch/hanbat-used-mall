// 파일 경로: app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  supabase,
  isAuthorizedAdminUser,
  getAdminAuthHeaders,
} from "../lib/supabase";
import {
  Icon,
  ICON,
  SafeImg,
  Modal,
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
  SectionHeading,
} from "../lib/ui";
import {
  STORE,
  telHref,
  smsHref,
  maskName,
  splitImages,
  compressImage,
  MAX_REVIEW_PHOTOS,
  MAX_FILE_MB,
  STORAGE_BUCKETS,
  isProductSold,
  getInquiryTypeLabel,
  extractStorageFilesByBucket,
  trackEvent,
  type InquiryTypeValue,
  triggerQuickInquiry,
} from "../lib/site";
import { type ProductItem } from "../components/products/product-card";
import { FeaturedProductsSection } from "../components/home/featured-products-section";
import { CategoryPictogramBar } from "../components/home/category-pictogram-bar";
import { AirconGuideModal } from "../components/products/aircon-set-guide-banner";

/* ════════════════════════════════════════════════════════════
   1. 정적 데이터 및 상수 (기존 사업자 사실 문구 100% 보존)
   ════════════════════════════════════════════════════════════ */
const OPERATING_YEARS = new Date().getFullYear() - STORE.since;

type Review = {
  id: string | number;
  title: string | null;
  image_url: string | null;
  created_at: string;
};

type InquiryRow = {
  id: string | number;
  inquiry_type: string | null;
  category: string | null;
  name: string | null;
  masked_name?: string | null;
  status: string | null;
  is_notice: boolean | null;
  created_at: string;
};

const TRUST_SUMMARY_CARDS = [
  {
    badge: "01 · 입고 검수 및 세척",
    title: "분해 세척·작동 검수 후 출고",
    desc: "입고된 모든 가전과 주방설비는 엔지니어가 분해 고압 세척과 냉매·콤프레샤·누수·시운전 테스트를 통과한 제품만 출고합니다.",
  },
  {
    badge: "02 · 책임 보증 약정",
    title: "계약 조건별 무상 A/S 보증",
    desc: "품목 및 계약 조건에 따라 에어컨·냉난방기 최대 8개월, 냉장고·세탁기 등 일반 가전 최대 4개월 무상 A/S를 약정 지원합니다. (거래 형태 및 계약 조건 기준)",
  },
  {
    badge: "03 · 사업자 정식 증빙",
    title: "사업자 증빙 및 직배송 완비",
    desc: "대전·세종·충청권 직배송 수평 설치는 물론 전자세금계산서·신용카드·현금영수증을 100% 정식 발행합니다.",
  },
] as const;

const SELL_STEPS = [
  {
    t: "사진·정보 접수",
    d: "사진·문자·카톡으로 제품 전면과 모델명(명판), 수거 지역을 남겨주세요.",
  },
  {
    t: "빠른 견적 안내",
    d: "외관 상태와 연식·시세를 종합 검토하여 합리적인 매입가를 신속히 안내합니다.",
  },
  {
    t: "방문 확인·수거",
    d: "원하시는 일정에 전문 기사가 방문하여 안전하게 제품을 분리·수거합니다.",
  },
  {
    t: "현장 즉시 입금",
    d: "수거가 완료되는 즉시 지정하신 계좌로 매입 대금 전액을 현금 송금합니다.",
  },
] as const;

const FAQS = [
  {
    tag: "A/S 접수 · 보증 범위",
    q: "사용 중 문제가 생기면 무상 A/S는 어떻게 신청하며, 보증 기준은 무엇인가요?",
    a: "대표전화(042-523-8179)나 카카오톡 채널로 증상을 알려주시면 담당 기사가 증상을 확인한 뒤 방문 수리 또는 동일 급 제품 교환으로 신속히 처리해 드립니다. 정상적인 사용 중 발생한 기기 기능 불량(냉매 누설, 콤프레샤·모터 불량 등)은 약정된 보증 기간 내 무상 처리되며, 고객 과실로 인한 파손이나 단순 소모품은 실비로 안내됩니다. (※ 무상 A/S 기간 및 세부 적용 범위는 품목 특성 및 판매 계약서 약정에 따라 상이할 수 있으며, 거래 시 계약 조건을 기준으로 적용됩니다.)",
  },
  {
    tag: "보상판매 · 기존 가전 철거",
    q: "중고가전을 구매하면서 기존에 쓰던 가전을 반납(보상매입)하거나 폐가전 수거도 되나요?",
    a: "네, 가능합니다. 구매하신 제품을 배송·설치해 드리는 날 기존 가전을 함께 수거해 드립니다. 연식과 상태가 양호한 제품은 매입가를 산정해 구매 금액에서 차감(보상판매)해 드리며, 노후된 고장 가전도 반출 여건에 따라 함께 철거·수거 상담이 가능합니다.",
  },
  {
    tag: "배송비 · 추가 설치비 기준",
    q: "엘리베이터가 없는 건물이나 에어컨 설치 시 추가 비용 기준은 어떻게 되나요?",
    a: "일반 가전(냉장고·세탁기)은 기본 배송·수평 설치가 지원되며, 엘리베이터 없는 2층 이상 계단 운반이나 사다리차가 필요한 현장만 사전에 투명하게 협의합니다. 에어컨·냉난방기는 설치 장소의 배관 길이, 타공 여부, 외벽 앵글 유무, 전기 규격(단상/삼상)을 사진으로 먼저 보여주시면 현장 추가금 걱정 없이 정확한 예상 견적을 안내해 드립니다.",
  },
  {
    tag: "에어컨 · 냉난방기 구매 안내",
    q: "에어컨이나 냉난방기 구매 시 실외기만 따로 단독 구매할 수 있나요?",
    a: "한밭중고전자의 에어컨 및 냉난방기 제품은 원활한 냉난방 성능과 냉매 사이클 호환 보증을 위해 실내기와 실외기가 1:1 세트로 구성되어 판매됩니다. 실외기만 별도로 단독 구매하시는 것은 어려우며 반드시 세트 단위로 출고됩니다. 현장 평수와 배관 환경에 맞춘 최적 모델 상담은 대표전화(042-523-8179)나 카카오톡으로 편하게 문의해 주세요.",
  },
  {
    tag: "결제 수단 · 세금계산서",
    q: "오프라인 매장 방문 없이 비대면 구매도 가능한가요? 결제 방법과 증빙 서류가 궁금합니다.",
    a: "매장 직접 방문(대전 중구 중촌동 144)은 물론, 바쁘신 분들을 위해 실물 상세 사진·작동 영상을 카톡으로 먼저 확인하신 뒤 비대면 주문도 가능합니다. 계좌이체, 신용카드 결제, 현금영수증 및 사업자 전자세금계산서 발행을 모두 지원합니다.",
  },
  {
    tag: "빠른 매입 사진 촬영 팁",
    q: "내 물건 팔기(매입) 신청 시 현장 감가 없이 가장 빠르게 견적을 받으려면 어떤 사진이 필요한가요?",
    a: "① 제품 정면 전체 사진, ② 측면이나 내부에 붙어 있는 '정격 명판 스티커(모델명·제조년월 표기)' 근접 사진, ③ 외관 흠집이나 설치 층수(계단/출입문) 정보를 함께 남겨주시면, AI 자동 분석과 담당자 검토를 거쳐 현장 흥정 없는 정확한 매입 견적을 안내받으실 수 있습니다.",
  },
] as const;

const shortDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
};

/* ════════════════════════════════════════════════════════════
   2. 메인 페이지 컴포넌트 (8섹션 클린 아키텍처)
   ════════════════════════════════════════════════════════════ */
export default function Home() {
  /* 실시간 판매 매물 상태 */
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);

  /* 배송·설치 사례 및 최근 문의 상태 */
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [recent, setRecent] = useState<InquiryRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  /* UI 인터랙션 상태 (FAQ 기본 닫힘) */
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [lightbox, setLightbox] = useState<{
    review: Review;
    index: number;
  } | null>(null);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [airconModalOpen, setAirconModalOpen] = useState(false);

  /* 관리자 모달 상태 */
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [reviewPreviews, setReviewPreviews] = useState<string[]>([]);
  const [uploadingReview, setUploadingReview] = useState(false);
  const [isAnalyzingReview, setIsAnalyzingReview] = useState(false);

  /* ── 1) 실시간 판매 매물 로드 ── */
  const loadFeaturedProducts = useCallback(async () => {
    await Promise.resolve();
    setProductsLoading(true);
    setProductsError(false);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .neq("category", "배송인증")
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) throw error;
      const rows = (data ?? []) as ProductItem[];
      rows.sort((a, b) => {
        const soldA = isProductSold(a.status) ? 1 : 0;
        const soldB = isProductSold(b.status) ? 1 : 0;
        return soldA - soldB;
      });
      setFeaturedProducts(rows);
    } catch (err) {
      console.error("추천 매물 로드 실패:", err);
      setProductsError(true);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  /* ── 2) 배송·설치 인증 사진 로드 (상한선 24건) ── */
  const loadReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, image_url, created_at")
        .eq("category", "배송인증")
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      setReviews((data ?? []) as Review[]);
    } catch (err) {
      console.error("인증사진 불러오기 실패:", err);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  /* ── 3) 최근 문의 현황 로드 ── */
  const loadRecent = useCallback(async () => {
    try {
      const res = await fetch("/api/inquiries?limit=8");
      if (!res.ok) {
        setRecent([]);
        return;
      }
      const json = await res.json();
      const rows = (json.inquiries ?? []) as InquiryRow[];
      setRecent(rows.filter((r) => !r.is_notice).slice(0, 5));
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadFeaturedProducts();
      void loadReviews();
      void loadRecent();
    });
    supabase.auth
      .getSession()
      .then(({ data }) =>
        setIsAdmin(isAuthorizedAdminUser(data.session?.user))
      );
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setIsAdmin(isAuthorizedAdminUser(session?.user))
    );
    return () => sub.subscription.unsubscribe();
  }, [loadFeaturedProducts, loadReviews, loadRecent]);

  const sellingCount = useMemo(
    () => featuredProducts.filter((p) => !isProductSold(p.status)).length,
    [featuredProducts]
  );

  const shownReviews = showAllReviews ? reviews : reviews.slice(0, 6);

  const openInquiry = useCallback(
    (type?: InquiryTypeValue, productTitle?: string) => {
      triggerQuickInquiry({
        type: type || "구매 문의",
        productTitle,
      });
    },
    []
  );

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(STORE.roadAddress);
      toast.success("도로명 주소(대전천서로 691-62 1, 2층)가 복사되었습니다.");
    } catch {
      toast.error("주소 복사에 실패했습니다.");
    }
  };

  /* ── 관리자 로그인 / 로그아웃 ── */
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });
      if (error) throw error;
      if (!isAuthorizedAdminUser(data.user)) {
        await supabase.auth.signOut();
        toast.error("관리자 권한이 허용되지 않은 계정입니다.");
        return;
      }
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

  /* ── AI 배송 사진 분석 및 업로드 ── */
  const analyzeReviewPhoto = async (files: File[]) => {
    if (files.length === 0) return;
    setIsAnalyzingReview(true);
    const toastId = toast.loading(
      "AI가 현장 사진을 분석하여 배송 후기 제목 초안을 작성 중입니다..."
    );

    try {
      const formData = new FormData();
      for (const file of files.slice(0, 2)) {
        const compressedBlob = await compressImage(file);
        const optimizedFile = new File([compressedBlob], file.name, {
          type: "image/jpeg",
        });
        formData.append("files", optimizedFile);
      }

      const authHeaders = await getAdminAuthHeaders();
      const res = await fetch("/api/analyze-delivery", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분석 실패");

      if (data.title) {
        setReviewTitle(data.title);
        toast.success("배송·설치 제목 초안이 작성되었습니다.", { id: toastId });
      }
    } catch {
      toast.error("제목 자동 완성 실패. 직접 입력해 주세요.", { id: toastId });
    } finally {
      setIsAnalyzingReview(false);
    }
  };

  const pickReviewFiles = (list: FileList | null) => {
    if (!list) return;
    const valid = Array.from(list).filter(
      (f) => f.type.startsWith("image/") && f.size <= MAX_FILE_MB * 1024 * 1024
    );
    const files = [...reviewFiles, ...valid].slice(0, MAX_REVIEW_PHOTOS);
    reviewPreviews.forEach((u) => URL.revokeObjectURL(u));
    setReviewFiles(files);
    setReviewPreviews(files.map((f) => URL.createObjectURL(f)));

    if (!reviewTitle.trim() && files.length > 0) {
      analyzeReviewPhoto(files);
    }
  };

  const closeReviewModal = useCallback(() => {
    setReviewModalOpen(false);
    setReviewTitle("");
    setReviewFiles([]);
    setReviewPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
    setIsAnalyzingReview(false);
  }, []);

  const handleReviewUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim()) return toast.error("제목을 입력해 주세요.");
    if (reviewFiles.length === 0)
      return toast.error("사진을 1장 이상 선택해 주세요.");
    setUploadingReview(true);
    try {
      const urls: string[] = [];
      for (const f of reviewFiles) {
        const blob = await compressImage(f, 1600, 0.82);
        const fileName = `delivery_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .upload(fileName, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        urls.push(
          supabase.storage
            .from(STORAGE_BUCKETS.inquiries)
            .getPublicUrl(fileName).data.publicUrl
        );
      }

      const { error } = await supabase.from("products").insert({
        title: reviewTitle.trim(),
        category: "배송인증",
        image_url: urls.join(","),
        price: 0,
        status: "판매중",
      });
      if (error) throw error;
      toast.success("인증사진을 등록했습니다.");
      closeReviewModal();
      loadReviews();
    } catch {
      toast.error("등록하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setUploadingReview(false);
    }
  };

  const handleDeleteReview = async (id: Review["id"]) => {
    if (!confirm("이 인증사진을 정말 삭제하시겠습니까?")) return;
    try {
      const target = reviews.find((r) => r.id === id);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;

      if (target?.image_url) {
        const { inquiries: inqFiles } = extractStorageFilesByBucket(
          splitImages(target.image_url)
        );
        if (inqFiles.length > 0) {
          await supabase.storage
            .from(STORAGE_BUCKETS.inquiries)
            .remove(inqFiles);
        }
      }

      toast.success("삭제했습니다.");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("삭제하지 못했습니다.");
    }
  };

  /* ── 라이트박스 ── */
  const lbImages = lightbox ? splitImages(lightbox.review.image_url) : [];
  const moveLightbox = useCallback((step: number) => {
    setLightbox((lb) => {
      if (!lb) return lb;
      const n = splitImages(lb.review.image_url).length;
      return n ? { ...lb, index: (lb.index + step + n) % n } : lb;
    });
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") moveLightbox(-1);
      if (e.key === "ArrowRight") moveLightbox(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, moveLightbox]);

  /* ── FAQPage 구조화 데이터 ── */
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0E1A2B]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* [S0] 상단 공통 헤더 */}
      <SiteHeader>
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden md:inline-flex items-center rounded-lg border border-[#CFCAC0] bg-[#FAF9F7] px-3.5 h-10 text-hb-xs font-bold text-[#0E1A2B] hover:border-[#0E1A2B] whitespace-nowrap"
          >
            관리자
          </Link>
        )}
      </SiteHeader>

      <main className="flex-1">
        {/* ════════════════════════════════════════════════════════════
            [S1] 히어로 + 2카드 목적 분기 (좌: 쓰던 가전 팔기 / 우: 중고가전 사기)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="hero-section"
          aria-labelledby="hero-title"
          className="relative w-full border-b border-[#E5E2DC] bg-[#FAF9F7]"
        >
          <div className="hb-container py-10 sm:py-14 lg:py-16">
            <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
              {/* 좌측 (7열): 핵심 메시지 + 2카드 목적 분기 + 업소 텍스트 링크 */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E2DC] bg-white px-3.5 py-1 text-hb-xs font-semibold text-[#0E1A2B] shadow-2xs">
                  <span className="font-bold text-[#D9531E]">{STORE.name}</span>
                  <span className="h-3 w-px bg-[#E5E2DC]" aria-hidden="true" />
                  <span className="text-[#3E4756]">
                    SINCE {STORE.since} · 대전 중촌동 직영 매장 ({OPERATING_YEARS}년 운영)
                  </span>
                </div>

                <h1
                  id="hero-title"
                  className="mt-4 text-hb-2xl sm:text-hb-3xl font-bold leading-[1.28] tracking-[-0.03em] text-[#0E1A2B] break-keep"
                >
                  가정용 가전부터 업소용 주방설비까지,
                  <br />
                  <span className="text-[#D9531E]">분해 세척·검수를 마친</span>{" "}
                  실매물만 출고합니다
                </h1>

                <p className="mt-3 max-w-2xl text-hb-sm sm:text-hb-base leading-[1.65] text-[#3E4756] break-keep">
                  대전 중촌동 1·2층 직영 쇼룸에서 실물을 직접 확인하실 수 있으며, 사용하던 가전과 설비는 방문 수거 당일 현금으로 정산해 드립니다.
                </p>

                {/* 2-Card Split: 좌측 '쓰던 가전 팔기' (매입 강조) / 우측 '중고가전 사기' */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                  {/* 좌측 카드: 쓰던 가전 팔기 (Primary 강조) */}
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("begin_buyback_inquiry", {
                        location: "hero_split_sell",
                      });
                      openInquiry("내 물건 팔기");
                    }}
                    className="group flex flex-col justify-between rounded-xl border-2 border-[#0E1A2B] bg-[#0E1A2B] p-5 text-left text-white shadow-card hover:bg-[#16263D] transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="inline-block rounded bg-[#D9531E] px-2.5 py-0.5 text-hb-xs font-bold text-white">
                        방문 수거 · 당일 정산
                      </span>
                      <h2 className="mt-2.5 text-hb-xl font-extrabold text-white">
                        쓰던 가전 팔기
                      </h2>
                      <p className="mt-1.5 text-hb-xs sm:text-hb-sm text-white/80 leading-relaxed break-keep">
                        사진만 보내면 견적 → 방문 수거 → 당일 현금 정산
                      </p>
                    </div>
                    <div className="mt-5 pt-3 border-t border-white/15 flex items-center justify-between text-hb-sm font-bold text-[#FF8A50]">
                      <span>매입 신청</span>
                      <Icon
                        d={ICON.arrow}
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </button>

                  {/* 우측 카드: 중고가전 사기 */}
                  <Link
                    href="/gallery"
                    className="group flex flex-col justify-between rounded-xl border-2 border-[#E5E2DC] bg-white p-5 text-left text-[#0E1A2B] shadow-card hover:border-[#0E1A2B] transition-colors"
                  >
                    <div>
                      <span className="inline-block rounded bg-[#FFF5F0] border border-[#FED7AA] px-2.5 py-0.5 text-hb-xs font-bold text-[#D9531E]">
                        세척·검수 완료 · 무상 A/S
                      </span>
                      <h2 className="mt-2.5 text-hb-xl font-extrabold text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors">
                        중고가전 사기
                      </h2>
                      <p className="mt-1.5 text-hb-xs sm:text-hb-sm text-[#3E4756] leading-relaxed break-keep">
                        {sellingCount > 0
                          ? `검수 마친 실매물 ${sellingCount}개 판매 중`
                          : "분해 세척·작동 점검을 마친 실매물 상시 전시"}
                      </p>
                    </div>
                    <div className="mt-5 pt-3 border-t border-[#E5E2DC] flex items-center justify-between text-hb-sm font-bold text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors">
                      <span>판매 제품 보기</span>
                      <Icon
                        d={ICON.arrow}
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                </div>

                {/* 하단 1줄 보조 링크: 업소·창업 상담 */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-hb-sm text-[#3E4756]">
                  <a
                    href="#business-section"
                    className="inline-flex items-center gap-1.5 font-semibold text-[#3E4756] hover:text-[#D9531E] transition-colors"
                  >
                    <span>식당·카페 창업이나 폐업 정리이신가요?</span>
                    <strong className="font-bold text-[#0E1A2B] underline underline-offset-4">
                      업소 상담 →
                    </strong>
                  </a>
                </div>
              </div>

              {/* 우측 (5열): 대표 오프라인 직영 매장 사진 카드 */}
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-xl border border-[#E5E2DC] bg-white shadow-card">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F0EDE7]">
                    <SafeImg
                      src="/main-bg2.png"
                      alt={`대전 중구 대전천서로 691-62(중촌동 144) ${STORE.name} 오프라인 직영 매장 외관`}
                      eager
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="border-t border-[#E5E2DC] bg-white p-3.5 sm:px-4 sm:py-3 text-hb-xs text-[#3E4756] space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#0E1A2B] min-w-0">
                      <Icon
                        d={ICON.pin}
                        className="w-4 h-4 text-[#D9531E] shrink-0"
                      />
                      <span className="truncate">
                        {STORE.roadAddress}{" "}
                        <span className="font-normal text-[#646E7E] whitespace-nowrap">
                          ({STORE.addressNote})
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#646E7E] tabular-nums pt-1.5 border-t border-[#F0EDE7]">
                      <span className="whitespace-nowrap">
                        영업시간{" "}
                        <strong className="font-semibold text-[#0E1A2B]">
                          {STORE.hours}
                        </strong>
                      </span>
                      <span className="font-bold text-[#D9531E] bg-[#FFF5F0] border border-[#FED7AA] rounded px-2 py-0.5 whitespace-nowrap">
                        매장 앞 전용 주차 가능
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [S2] 취급 품목 7종 픽토그램 바 (#category-section)
            ════════════════════════════════════════════════════════════ */}
        <CategoryPictogramBar />

        {/* ════════════════════════════════════════════════════════════
            [S3] 지금 판매 중인 제품 8개 프리뷰 & 최근 본 매물 (#featured-products-section)
            ════════════════════════════════════════════════════════════ */}
        <FeaturedProductsSection
          products={featuredProducts}
          loading={productsLoading}
          error={productsError}
          onRetry={loadFeaturedProducts}
        />

        {/* ════════════════════════════════════════════════════════════
            [S4] 배송 · 설치 현장 기록 (#reviews-section) + 3열 핵심 보증 요약 (#usp-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="reviews-section"
          className="border-b border-[#E5E2DC] bg-[#FAF9F7] py-12 sm:py-16 lg:py-20"
          aria-labelledby="review-title"
        >
          <div className="hb-container">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                title={<span id="review-title">배송 · 설치 현장 기록</span>}
                desc="가정집부터 식당·카페·사무실까지 한밭중고전자가 직접 배송하고 설치한 실제 현장 사진입니다."
              />
              <div className="flex items-center gap-3">
                {reviews.length > 0 && (
                  <span className="rounded-lg border border-[#E5E2DC] bg-white px-3.5 py-2 text-hb-xs font-semibold text-[#3E4756] tabular-nums shadow-2xs">
                    누적 등록{" "}
                    <strong className="text-[#0E1A2B]">{reviews.length}</strong>
                    건
                  </span>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="hb-btn-primary h-10 px-4 text-hb-xs"
                  >
                    <Icon d={ICON.plus} className="h-4 w-4" /> 인증사진 등록
                  </button>
                )}
              </div>
            </div>

            {reviewsLoading ? (
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] animate-pulse rounded-xl bg-[#F0EDE7]"
                  />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="mt-8 flex flex-col items-start gap-4 rounded-xl border border-[#E5E2DC] bg-white px-6 py-8 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
                <div>
                  <p className="text-hb-base font-bold text-[#0E1A2B]">
                    현장 사진을 정리하고 있습니다.
                  </p>
                  <p className="mt-1 text-hb-sm text-[#3E4756]">
                    배송·설치 사례가 궁금하시면 카카오톡으로 편하게 문의해 주세요.
                  </p>
                </div>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-11 shrink-0 px-4 text-hb-sm"
                >
                  <Icon d={ICON.chat} className="h-4 w-4" /> 카카오톡 문의
                </a>
              </div>
            ) : (
              <>
                <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {shownReviews.map((r) => {
                    const imgs = splitImages(r.image_url);
                    return (
                      <li
                        key={r.id}
                        className="group relative overflow-hidden rounded-xl border border-[#E5E2DC] bg-white hover:border-[#0E1A2B] transition-colors shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => setLightbox({ review: r, index: 0 })}
                          className="relative block aspect-[4/3] w-full overflow-hidden bg-[#F0EDE7] cursor-pointer"
                          aria-label={`${r.title ?? "배송·설치"} 사진 크게 보기`}
                        >
                          <SafeImg
                            src={imgs[0]}
                            alt={`${r.title ?? "배송·설치"} 현장 사진`}
                            className="h-full w-full object-cover"
                          />
                          {imgs.length > 1 && (
                            <span className="absolute right-3 top-3 z-10 rounded bg-[#0E1A2B]/80 px-2 py-0.5 text-hb-xs font-semibold text-white tabular-nums">
                              +{imgs.length - 1}장
                            </span>
                          )}
                        </button>
                        <div className="flex items-center justify-between gap-2 bg-white px-4 py-3.5 border-t border-[#E5E2DC]">
                          <p className="line-clamp-1 text-hb-sm font-semibold text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors">
                            {r.title || "배송 및 설치 완료"}
                          </p>
                          <span className="shrink-0 text-hb-xs text-[#646E7E] tabular-nums">
                            {shortDate(r.created_at)}
                          </span>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r.id)}
                            className="absolute left-3 top-3 z-20 rounded bg-white/95 px-2.5 py-1 text-hb-xs font-bold text-red-600 shadow"
                          >
                            삭제
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {reviews.length > 6 && (
                  <div className="mt-8 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllReviews((v) => !v)}
                      className="hb-btn-outline h-11 px-7 text-hb-sm"
                    >
                      {showAllReviews
                        ? "현장 사진 접기"
                        : `현장 사진 ${reviews.length - 6}건 더 보기`}
                      <Icon
                        d={ICON.down}
                        className={`h-4 w-4 transition-transform ${
                          showAllReviews ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* 3열 핵심 보증 요약 (#usp-section) */}
            <div
              id="usp-section"
              className="mt-10 pt-10 border-t border-[#E5E2DC]"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                {TRUST_SUMMARY_CARDS.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <span className="inline-block rounded bg-[#FFF5F0] border border-[#FED7AA] px-2.5 py-0.5 text-hb-xs font-bold text-[#D9531E]">
                        {card.badge}
                      </span>
                      <h3 className="mt-2.5 text-hb-lg font-bold text-[#0E1A2B]">
                        {card.title}
                      </h3>
                      <p className="mt-1.5 text-hb-sm text-[#3E4756] leading-relaxed break-keep">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [S5] 쓰던 가전 매입 안내 (#sell-section) — 4단계 가로 카드 + 즉시 행동 바
            ════════════════════════════════════════════════════════════ */}
        <section
          id="sell-section"
          className="border-b border-[#E5E2DC] bg-white py-12 sm:py-16 lg:py-20"
          aria-labelledby="sell-title"
        >
          <div className="hb-container">
            <SectionHeading
              title={
                <span id="sell-title">쓰던 가전, 사진만 보내주세요</span>
              }
              desc="가정용 대형가전부터 식당·카페 업소용 냉장·주방 설비까지 연식과 상태를 확인하여 합리적인 시세로 매입하며, 방문 수거 당일 현장에서 정산해 드립니다."
            />

            <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              {SELL_STEPS.map((s, i) => (
                <li
                  key={s.t}
                  className="flex flex-col justify-between rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-hb-xs font-bold text-[#D9531E] tabular-nums">
                        0{i + 1}단계
                      </span>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#E5E2DC] text-hb-xs font-bold text-[#0E1A2B] tabular-nums">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-hb-lg font-bold text-[#0E1A2B]">
                      {s.t}
                    </h3>
                    <p className="mt-1.5 text-hb-sm leading-relaxed text-[#3E4756] break-keep">
                      {s.d}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-7 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openInquiry("내 물건 팔기")}
                  className="hb-btn-accent h-12 px-6 text-hb-base font-bold"
                >
                  <span>매입 신청</span>
                  <Icon d={ICON.arrow} className="h-4 w-4" />
                </button>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-12 px-6 text-hb-base font-bold"
                >
                  <Icon d={ICON.chat} className="h-4 w-4" />
                  <span>카톡으로 사진 보내기</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-hb-sm">
                <button
                  type="button"
                  onClick={() => setGuideModalOpen(true)}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#3E4756] hover:text-[#0E1A2B] underline underline-offset-4 cursor-pointer"
                >
                  <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#D9531E]" />
                  <span>촬영 가이드 보기</span>
                </button>
                <Link
                  href="/purchase"
                  className="inline-flex items-center gap-1 font-bold text-[#0E1A2B] hover:text-[#D9531E] underline underline-offset-4"
                >
                  <span>매입 안내 자세히 →</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [S6] 업소·창업·폐업 배너 (#business-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="business-section"
          className="border-b border-[#E5E2DC] bg-white py-10 sm:py-14"
          aria-labelledby="business-title"
        >
          <div className="hb-container">
            <div className="rounded-2xl bg-[#0E1A2B] text-white p-6 sm:p-8 lg:p-10 shadow-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <span className="inline-block rounded bg-[#D9531E] px-2.5 py-0.5 text-hb-xs font-bold text-white">
                    B2B · 업소용 설비 납품 및 일괄 매입
                  </span>
                  <h2
                    id="business-title"
                    className="mt-3 text-hb-xl sm:text-hb-2xl font-bold text-white tracking-tight"
                  >
                    식당·카페 창업, 폐업 정리
                  </h2>
                  <ul className="mt-3 space-y-1.5 text-hb-sm text-white/80">
                    <li>
                      · 업소용 45박스 냉장고·테이블냉장고·음료 쇼케이스·제빙기 묶음 견적
                    </li>
                    <li>
                      · 폐업 매장 주방설비·냉난방기 방문 수거 및 일괄 매입·철거
                    </li>
                    <li>
                      · 사업자 전자세금계산서 · 신용카드 · 현금영수증 100% 정식 발행
                    </li>
                  </ul>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => openInquiry("대량·업소용 상담")}
                    className="hb-btn-accent h-12 px-6 text-hb-base font-bold"
                  >
                    <span>업소 상담</span>
                    <Icon d={ICON.arrow} className="w-4 h-4" />
                  </button>
                  <Link
                    href="/gallery?category=업소용기기"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 h-12 px-5 text-hb-sm font-bold text-white transition-colors"
                  >
                    <span>업소용 매물 보기 →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [S7] 자주 묻는 질문 (#faq-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="faq-section"
          className="border-b border-[#E5E2DC] bg-[#FAF9F7] py-12 sm:py-16 lg:py-20"
          aria-labelledby="faq-title"
        >
          <div className="hb-container grid gap-8 lg:grid-cols-12 lg:gap-12 items-start">
            <div className="lg:col-span-4">
              <SectionHeading
                title={<span id="faq-title">자주 묻는 질문 (FAQ)</span>}
                desc="A/S 보증 기간, 보상판매 차액 정산, 설치 비용 등 상담 전 가장 많이 물어보시는 핵심 질문입니다."
              />
              <div className="mt-5">
                <Link
                  href="/inquiry"
                  className="inline-flex items-center gap-1.5 text-hb-sm font-bold text-[#0E1A2B] hover:text-[#D9531E] underline underline-offset-4"
                >
                  <span>더 궁금한 점은 문의 게시판에서 →</span>
                </Link>
              </div>
            </div>

            <div className="divide-y divide-[#E5E2DC] rounded-xl border border-[#E5E2DC] bg-white lg:col-span-8 overflow-hidden shadow-2xs">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div
                    key={f.q}
                    className="transition-colors hover:bg-[#FAF9F7]"
                  >
                    <h3>
                      <button
                        type="button"
                        id={`faq-q-${i}`}
                        aria-expanded={open}
                        aria-controls={`faq-a-${i}`}
                        onClick={() => setOpenFaq(open ? null : i)}
                        className="flex w-full items-center justify-between gap-4 p-4 sm:p-5 text-left"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#FFF5F0] text-hb-xs font-extrabold text-[#D9531E]">
                            Q
                          </span>
                          <div className="min-w-0">
                            <span className="inline-block rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2 py-0.5 text-hb-xs font-bold text-[#434B59] mb-1">
                              {f.tag}
                            </span>
                            <span className="block text-hb-base font-bold leading-snug text-[#0E1A2B] break-keep">
                              {f.q}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#D7D2C8] text-[#434B59] transition-transform duration-200 ${
                            open
                              ? "rotate-45 bg-[#0E1A2B] text-white border-[#0E1A2B]"
                              : "bg-white"
                          }`}
                        >
                          <Icon d={ICON.plus} className="h-4 w-4" />
                        </span>
                      </button>
                    </h3>
                    {open && (
                      <div
                        id={`faq-a-${i}`}
                        role="region"
                        aria-labelledby={`faq-q-${i}`}
                        className="border-t border-[#F0EDE7] bg-[#FAF9F7] px-5 py-4 sm:px-6 sm:pl-[60px] text-hb-sm leading-[1.75] text-[#434B59] break-keep"
                      >
                        {f.a.includes(STORE.tel) ? (
                          <>
                            {f.a.split(STORE.tel).map((part, pIdx, arr) => (
                              <React.Fragment key={pIdx}>
                                {part}
                                {pIdx < arr.length - 1 && (
                                  <a
                                    href={telHref(STORE.tel)}
                                    className="font-bold text-[#D9531E] hover:underline underline-offset-2 tabular-nums"
                                  >
                                    {STORE.tel}
                                  </a>
                                )}
                              </React.Fragment>
                            ))}
                          </>
                        ) : (
                          f.a
                        )}

                        {f.tag === "에어컨 · 냉난방기 구매 안내" && (
                          <div className="mt-3.5 pt-3 border-t border-[#E8E4DC] flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setAirconModalOpen(true)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0052CC] bg-white px-3.5 py-1.5 text-hb-xs font-bold text-[#0052CC] hover:bg-[#F0F6FF] transition-colors shadow-2xs cursor-pointer"
                            >
                              <Icon d={ICON.search} className="w-3.5 h-3.5" />
                              <span>에어컨 세트 구성 안내문 크게 보기</span>
                            </button>
                            <Link
                              href="/gallery?category=에어컨/냉난방기"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0E1A2B] px-3.5 py-1.5 text-hb-xs font-bold text-white hover:bg-[#1C2D47] transition-colors shadow-2xs"
                            >
                              <span>에어컨 실매물 보러가기 →</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [S8] 연락처 · 매장 안내 통합 섹션 (#inquiry-section + #location-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="inquiry-section"
          className="border-b border-[#E5E2DC] bg-white py-12 sm:py-16 lg:py-20"
          aria-labelledby="cta-title"
        >
          <div className="hb-container">
            <SectionHeading
              title={<span id="cta-title">상담 연결 및 오프라인 매장 안내</span>}
              desc="전화·카톡·문자로 바로 연결하시거나 대전 중촌동 직영 쇼룸에 방문해 실물을 확인하실 수 있습니다."
            />

            <div className="mt-8 grid gap-6 lg:grid-cols-12 items-stretch">
              {/* 좌측 (5열): 직통 연락처 카드 + 최근 문의 현황 */}
              <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
                <div className="rounded-xl bg-[#0E1A2B] border border-[#182942] p-6 text-white shadow-card">
                  <span className="inline-block rounded bg-[#D9531E] px-2.5 py-0.5 text-hb-xs font-bold text-white">
                    직통 고객센터
                  </span>
                  <p className="mt-2.5 text-hb-sm text-white/80">
                    구매·매입·업소용 견적 모두 빠르게 안내해 드립니다
                  </p>
                  <a
                    href={telHref(STORE.tel)}
                    className="mt-2 block text-hb-2xl font-extrabold tracking-tight text-white hover:text-[#FF8A50] tabular-nums"
                  >
                    {STORE.tel}
                  </a>
                  <a
                    href={telHref(STORE.mobile)}
                    className="mt-0.5 block text-hb-base font-semibold text-white/85 hover:text-[#FF8A50] tabular-nums"
                  >
                    직통 휴대전화: {STORE.mobile}
                  </a>
                  <p className="mt-2 text-hb-xs text-white/65">
                    영업시간 {STORE.hours} · {STORE.closed}
                  </p>

                  {/* 2×2 직통 액션 그리드 */}
                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    <a
                      href={telHref(STORE.tel)}
                      onClick={() =>
                        trackEvent("click_tel_consult", {
                          location: "inquiry_aside",
                        })
                      }
                      className="hb-btn bg-white/10 hover:bg-white/20 text-white h-11 text-hb-sm"
                    >
                      <Icon
                        d={ICON.phone}
                        className="w-4 h-4 text-[#FF8A50]"
                      />
                      <span>전화 상담</span>
                    </a>
                    <a
                      href={STORE.kakaoChat}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackEvent("click_kakao_consult", {
                          location: "inquiry_aside",
                        })
                      }
                      className="hb-btn-kakao h-11 text-hb-sm"
                    >
                      <Icon d={ICON.chat} className="w-4 h-4" />
                      <span>카톡 상담</span>
                    </a>
                    <a
                      href={smsHref(
                        STORE.mobile,
                        "[한밭중고전자 문의] 품목/지역/사진을 보내주시면 빠르게 견적을 안내해 드립니다."
                      )}
                      onClick={() =>
                        trackEvent("click_sms_consult", {
                          location: "inquiry_aside",
                        })
                      }
                      className="hb-btn bg-white/10 hover:bg-white/20 text-white h-11 text-hb-sm"
                    >
                      <Icon d={ICON.chat} className="w-4 h-4 text-[#FF8A50]" />
                      <span>문자 보내기</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => openInquiry("구매 문의")}
                      className="hb-btn-accent h-11 text-hb-sm font-bold"
                    >
                      <Icon d={ICON.pen} className="w-4 h-4" />
                      <span>견적 문의</span>
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-hb-xs">
                    <span className="text-white/70">사진 첨부 및 게시판 작성</span>
                    <Link
                      href="/inquiry?write=1"
                      className="font-bold text-[#FF8A50] hover:underline"
                    >
                      온라인 문의 글쓰기 →
                    </Link>
                  </div>
                </div>

                {/* 최근 접수된 문의 현황 */}
                <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-5 shadow-2xs flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
                      <h3 className="text-hb-base font-bold text-[#0E1A2B]">
                        최근 접수된 문의 현황
                      </h3>
                      <Link
                        href="/inquiry"
                        className="inline-flex items-center gap-1 text-hb-xs font-semibold text-[#D9531E] hover:underline"
                      >
                        <span>전체 게시판</span>
                        <Icon d={ICON.right} className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    {recent.length === 0 ? (
                      <p className="mt-4 text-hb-sm text-[#646E7E]">
                        최근 접수된 문의 내역이 없습니다.
                      </p>
                    ) : (
                      <ul className="mt-2 hb-list">
                        {recent.map((r) => {
                          const isDone =
                            r.status === "답변완료" || r.status === "처리완료";
                          return (
                            <li key={r.id} className="hb-list-row text-hb-sm">
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <span className="shrink-0 rounded bg-white border border-[#E5E2DC] px-2 py-0.5 text-hb-xs font-semibold text-[#0E1A2B]">
                                  {getInquiryTypeLabel(r.inquiry_type)}
                                </span>
                                <Link
                                  href="/inquiry"
                                  className="min-w-0 flex-1 truncate font-semibold text-[#0E1A2B] hover:text-[#D9531E] transition-colors"
                                >
                                  {r.category || "상담 문의"}
                                </Link>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 text-hb-xs">
                                <span className="text-[#646E7E]">
                                  {r.masked_name || maskName(r.name)}
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-hb-xs font-semibold ${
                                    isDone
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-[#FFF5F0] text-[#D9531E] border border-[#FADCD0]"
                                  }`}
                                >
                                  {r.status ?? "접수중"}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* 우측 (7열): 오프라인 매장 지도 및 주소 안내 (#location-section) */}
              <div
                id="location-section"
                aria-labelledby="location-title"
                className="lg:col-span-7 flex flex-col overflow-hidden rounded-xl border border-[#E5E2DC] bg-white shadow-card"
              >
                <div className="relative h-[280px] sm:h-[340px] w-full bg-[#F0EDE7]">
                  <iframe
                    title="한밭중고전자 매장 위치 지도"
                    src="https://maps.google.com/maps?q=%EB%8C%80%EC%A0%84+%EC%A4%91%EA%B5%AC+%EC%A4%91%EC%B4%8C%EB%8F%99+144&t=&z=16&ie=UTF8&iwloc=&output=embed"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 h-full w-full border-0"
                    allowFullScreen
                  />
                </div>

                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between border-t border-[#E5E2DC]">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <span className="text-hb-xs font-bold text-[#D9531E]">
                        오프라인 직영 쇼룸
                      </span>
                      <h3
                        id="location-title"
                        className="mt-0.5 text-hb-xl font-extrabold text-[#0E1A2B]"
                      >
                        {STORE.roadAddress}
                      </h3>
                      <p className="mt-1 text-hb-sm text-[#3E4756]">
                        지번: {STORE.jibunAddress} ({STORE.addressNote})
                      </p>
                      <p className="mt-1 text-hb-xs font-semibold text-[#646E7E]">
                        영업시간: {STORE.hours} · {STORE.closed} · {STORE.parking}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="hb-btn-outline h-10 px-3.5 text-hb-xs shrink-0 self-start"
                    >
                      <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#D9531E]" />
                      <span>도로명 주소 복사</span>
                    </button>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E5E2DC] grid grid-cols-2 gap-3">
                    <a
                      href={STORE.naverMap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hb-btn bg-[#03C75A] text-white hover:bg-[#02b350] h-11 text-hb-sm"
                    >
                      네이버 지도 길찾기
                    </a>
                    <a
                      href="https://map.kakao.com/link/to/한밭중고전자,36.335503,127.406981"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hb-btn-kakao h-11 text-hb-sm"
                    >
                      카카오맵 길찾기
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* [S9] 공통 푸터 및 슬림 모바일 하단 CTA 바 */}
      <SiteFooter
        isAdmin={isAdmin}
        onAdminClick={() => (isAdmin ? handleLogout() : setLoginOpen(true))}
      />
      <MobileCtaBar onInquiryClick={() => openInquiry("구매 문의")} />

      {/* ── 매입 안내문 원본 비율 확대 모달 ── */}
      {guideModalOpen && (
        <Modal
          open={guideModalOpen}
          onClose={() => setGuideModalOpen(false)}
          label="제품 매입 안내문 크게 보기"
          panelClassName="max-w-4xl"
        >
          <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-[#E5E2DC] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E2DC] bg-[#0E1A2B] px-5 py-3.5 text-white">
              <div>
                <h3 className="text-hb-base font-bold">
                  {STORE.name} 제품 매입 안내문
                </h3>
                <p className="text-hb-xs text-white/70">
                  촬영 가이드 및 매입 시 유의사항 안내
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGuideModalOpen(false)}
                aria-label="닫기"
                className="grid h-8 w-8 place-items-center rounded bg-white/10 text-white hover:bg-white/20"
              >
                <Icon d={ICON.close} className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#FAF9F7] p-4 sm:p-6">
              <SafeImg
                src="/매입 안내문.png"
                alt="제품 매입 시 고객 안내문 전체 이미지"
                eager
                className="mx-auto max-h-[72vh] w-auto max-w-full object-contain rounded border border-[#E5E2DC] bg-white"
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#E5E2DC] bg-white px-5 py-3.5">
              <span className="text-hb-xs text-[#434B59] hidden sm:inline">
                안내문에 맞춰 사진을 보내주시면 정확한 견적 안내가 가능합니다.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setGuideModalOpen(false);
                    openInquiry("내 물건 팔기");
                  }}
                  className="hb-btn-accent h-10 px-4 text-hb-sm"
                >
                  바로 매입 견적 신청하기
                </button>
                <button
                  type="button"
                  onClick={() => setGuideModalOpen(false)}
                  className="hb-btn-outline h-10 px-4 text-hb-sm"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 에어컨/냉난방기 세트 구성 안내문 모달 ── */}
      {airconModalOpen && (
        <AirconGuideModal
          open={airconModalOpen}
          onClose={() => setAirconModalOpen(false)}
        />
      )}

      {/* ── 라이트박스 모달 ── */}
      {lightbox && (
        <Modal
          open={!!lightbox}
          onClose={() => setLightbox(null)}
          label="배송·설치 사진 확대 보기"
          panelClassName="max-w-4xl"
        >
          <div className="relative flex w-full flex-col rounded-xl bg-[#0E1A2B] p-4 sm:p-5 text-white shadow-2xl border border-white/15">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-hb-xs font-bold text-[#FF8A50]">
                  직영 배송 · 설치 현장 기록
                </span>
                <p className="truncate text-hb-base font-bold">
                  {lightbox.review.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="닫기"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <Icon d={ICON.close} />
              </button>
            </div>
            <div className="relative flex items-center justify-center bg-[#060C14] rounded-lg p-2">
              <SafeImg
                src={lbImages[lightbox.index]}
                alt={lightbox.review.title || "현장 사진"}
                eager
                className="max-h-[70vh] w-auto max-w-full rounded object-contain"
              />
              {lbImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => moveLightbox(-1)}
                    aria-label="이전 사진"
                    className="absolute left-3 grid h-10 w-10 place-items-center rounded-full bg-black/65 text-white hover:bg-black"
                  >
                    <Icon d={ICON.left} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLightbox(1)}
                    aria-label="다음 사진"
                    className="absolute right-3 grid h-10 w-10 place-items-center rounded-full bg-black/65 text-white hover:bg-black"
                  >
                    <Icon d={ICON.right} />
                  </button>
                </>
              )}
            </div>
            {lbImages.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2 overflow-x-auto py-1">
                {lbImages.map((imgUrl, idx) => (
                  <button
                    key={imgUrl + idx}
                    type="button"
                    onClick={() =>
                      setLightbox((prev) =>
                        prev ? { ...prev, index: idx } : prev
                      )
                    }
                    className={`h-12 w-12 shrink-0 overflow-hidden rounded border-2 ${
                      lightbox.index === idx
                        ? "border-[#FF8A50]"
                        : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <SafeImg
                      src={imgUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* 배송·설치 현장 기록 - 실매물 갤러리 및 맞춤 견적 브릿지 */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3.5">
              <span className="text-hb-xs text-white/75">
                이 현장과 비슷한 제품이나 설치 견적이 궁금하신가요?
              </span>
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <Link
                  href="/gallery"
                  onClick={() => setLightbox(null)}
                  className="rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-hb-xs font-bold text-white hover:bg-white/20"
                >
                  판매 중인 실매물 보기
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const refTitle = lightbox.review.title || "배송·설치 현장 사례";
                    setLightbox(null);
                    openInquiry("구매 문의", `[설치사례 참고문의] ${refTitle}`);
                  }}
                  className="hb-btn-accent h-9 px-4 text-hb-xs"
                >
                  <span>이 사례처럼 견적 문의하기</span>
                  <Icon d={ICON.arrow} className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 관리자 로그인 모달 ── */}
      {loginOpen && (
        <Modal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          label="관리자 로그인"
          panelClassName="max-w-sm"
        >
          <form
            onSubmit={handleAdminLogin}
            className="w-full rounded-xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E5E2DC]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-hb-lg font-bold text-[#0E1A2B]">
                관리자 로그인
              </h2>
              <button
                type="button"
                onClick={() => setLoginOpen(false)}
                aria-label="닫기"
              >
                <Icon d={ICON.close} />
              </button>
            </div>
            <label className="hb-label" htmlFor="admin-email">
              이메일
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="hb-input mt-1 mb-4"
            />
            <label className="hb-label" htmlFor="admin-pw">
              비밀번호
            </label>
            <input
              id="admin-pw"
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="hb-input mt-1"
            />
            <button
              type="submit"
              disabled={loggingIn}
              className="hb-btn-primary mt-6 h-11 w-full text-hb-sm"
            >
              {loggingIn ? "로그인 중…" : "로그인"}
            </button>
          </form>
        </Modal>
      )}

      {/* ── 배송·설치 인증사진 등록 모달 (관리자) ── */}
      {reviewModalOpen && (
        <Modal
          open={reviewModalOpen}
          onClose={closeReviewModal}
          label="배송·설치 인증사진 등록"
          panelClassName="max-w-lg"
        >
          <form
            onSubmit={handleReviewUpload}
            className="w-full rounded-xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E5E2DC]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-hb-lg font-bold text-[#0E1A2B]">
                배송·설치 인증사진 등록
              </h2>
              <button
                type="button"
                onClick={closeReviewModal}
                aria-label="닫기"
              >
                <Icon d={ICON.close} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="hb-label" htmlFor="review-title">
                제목
              </label>
              {isAnalyzingReview && (
                <span className="text-hb-xs font-semibold text-[#D9531E] animate-pulse">
                  AI 제목 초안 생성 중...
                </span>
              )}
            </div>
            <input
              id="review-title"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="사진 첨부 시 AI가 제목 초안을 작성합니다"
              className="hb-input mt-1"
            />
            <p className="hb-label mt-4">
              사진 (최대 {MAX_REVIEW_PHOTOS}장)
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {reviewPreviews.map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-square overflow-hidden rounded bg-[#F0EDE7]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`선택 사진 ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = reviewFiles.filter((_, idx) => idx !== i);
                      reviewPreviews.forEach((u) => URL.revokeObjectURL(u));
                      setReviewFiles(next);
                      setReviewPreviews(
                        next.map((f) => URL.createObjectURL(f))
                      );
                    }}
                    aria-label="사진 제거"
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/75 text-white"
                  >
                    <Icon d={ICON.close} className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {reviewFiles.length < MAX_REVIEW_PHOTOS && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-[#D7D2C8] bg-[#FAF9F7] text-hb-xs font-semibold text-[#667085] hover:border-[#D9531E] hover:text-[#D9531E]">
                  <Icon d={ICON.plus} className="w-5 h-5" />
                  <span className="mt-1">추가</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => pickReviewFiles(e.target.files)}
                  />
                </label>
              )}
            </div>
            <button
              type="submit"
              disabled={uploadingReview || isAnalyzingReview}
              className="hb-btn-accent mt-6 h-11 w-full text-hb-sm"
            >
              {uploadingReview ? "등록 중…" : "등록하기"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
