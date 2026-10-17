// 파일 경로: app/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "../lib/site";
import { type ProductItem } from "../components/products/product-card";
import { FeaturedProductsSection } from "../components/home/featured-products-section";
import { CategoryPictogramBar } from "../components/home/category-pictogram-bar";
import {
  UnifiedInquiryForm,
  type LinkedProductContext,
} from "../components/inquiry/unified-inquiry-form";

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

const USP = [
  {
    no: "01",
    tag: "입고 검수 및 세척",
    t: "분해 세척 · 정밀 검수 후 출고",
    d: "입고된 모든 가전과 주방설비는 엔지니어가 분해 고압 세척과 냉매·콤프레샤·누수·시운전 테스트를 통과한 제품만 매장과 홈페이지에 등록합니다.",
    highlight: "전 제품 시운전 및 고압 세척 완료",
  },
  {
    no: "02",
    tag: "책임 보증 약정",
    t: "명확한 무상 A/S 책임 보증",
    d: "중고 구매 후 고장 걱정을 덜어드리도록 에어컨·냉난방기 8개월, 냉장고·세탁기 및 일반 가전 4개월 무상 A/S를 보증합니다. (계약 조건별 약정)",
    highlight: "냉난방기 8개월 · 일반가전 4개월 보증",
  },
  {
    no: "03",
    tag: "원스톱 교체 지원",
    t: "구매와 매입·철거를 한 번에",
    d: "이사나 매장 오픈·정리 시 필요한 제품 구매와 쓰던 가전 처분을 한 번의 방문 일정으로 동시 진행하여 시간과 운반 비용을 아껴드립니다.",
    highlight: "보상판매 차액 정산 · 동시 수거 가능",
  },
  {
    no: "04",
    tag: "직영 물류 시스템",
    t: "대전·충청 당일/익일 및 전국 직배송",
    d: "대전·세종·충청권 빠른 직배송은 물론 구미·포항·창원·부산 등 전국 다수 지역에 품목과 수량에 맞춘 안전 직배송·설치를 지원합니다.",
    highlight: "전문 기사 직접 방문 운반 및 수평 설치",
  },
  {
    no: "05",
    tag: "사업자 정식 증빙",
    t: "창업·폐업 대량 거래 및 세금계산서",
    d: "식당·카페·사무실 창업 패키지 도입이나 폐업 일괄 정리 시 합리적인 세트 견적과 함께 전자세금계산서를 100% 정식 발행합니다.",
    highlight: "전자세금계산서 · 신용카드 · 현금영수증",
  },
] as const;

const SELL_CASES = [
  "가정 이사·가전교체",
  "식당·카페 폐업정리",
  "업종 변경·리모델링",
  "사무실·기숙사 철거",
  "업소용 설비 일괄처분",
] as const;

const SELL_STEPS = [
  {
    t: "사진·정보 접수",
    d: "온라인 문의 폼, 문자, 카카오톡으로 제품 전면 사진과 모델명(명판), 수거 지역을 보내주세요.",
  },
  {
    t: "빠른 견적 안내",
    d: "담당자가 외관 상태와 연식·수요를 확인하여 합리적인 매입 가견적을 신속히 안내해 드립니다.",
  },
  {
    t: "방문 확인·수거",
    d: "고객님이 원하시는 날짜와 시간에 맞춰 전문 기사님이 직접 방문해 안전하게 분리·수거합니다.",
  },
  {
    t: "현장 즉시 입금",
    d: "수거가 완료되는 즉시 지정하신 계좌로 매입 대금 전액을 100% 현금 송금해 드립니다.",
  },
] as const;

const FAQS = [
  {
    tag: "A/S 접수 · 보증 범위",
    q: "사용 중 문제가 생기면 무상 A/S는 어떻게 신청하며, 보증 기준은 무엇인가요?",
    a: "대표전화(042-523-8179)나 카카오톡 채널로 증상을 알려주시면 담당 기사가 증상을 확인한 뒤 방문 수리 또는 동일 급 제품 교환으로 신속히 처리해 드립니다. 정상적인 사용 중 발생한 기기 기능 불량(냉매 누설, 콤프레샤·모터 불량 등)은 보증 기간 내 무상 처리되며, 고객 과실로 인한 파손이나 단순 소모품은 실비로 안내됩니다.",
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
   2. 메인 페이지 컴포넌트
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

  /* UI 인터랙션 상태 */
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [lightbox, setLightbox] = useState<{
    review: Review;
    index: number;
  } | null>(null);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  /* 통합 문의 폼 연동 상태 */
  const [inquiryType, setInquiryType] =
    useState<InquiryTypeValue>("내 물건 팔기");
  const [linkedProduct, setLinkedProduct] =
    useState<LinkedProductContext | null>(null);

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

  /* ── 1) 실시간 판매 매물 로드 (배송인증 제외) ── */
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
        .limit(12);

      if (error) throw error;
      const rows = (data ?? []) as ProductItem[];
      rows.sort((a, b) => {
        const soldA = isProductSold(a.status) ? 1 : 0;
        const soldB = isProductSold(b.status) ? 1 : 0;
        return soldA - soldB;
      });
      setFeaturedProducts(rows.slice(0, 8));
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

  const shownReviews = showAllReviews ? reviews : reviews.slice(0, 6);

  const openInquiry = useCallback(
    (type?: InquiryTypeValue, productTitle?: string) => {
      if (type) setInquiryType(type);
      if (productTitle) {
        setLinkedProduct({ productTitle });
      } else {
        setLinkedProduct(null);
      }
      document
        .getElementById("inquiry-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
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

      {/* [1] 상단 공통 헤더 */}
      <SiteHeader>
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden md:inline-flex items-center rounded-lg border border-[#CFCAC0] bg-[#FAF9F7] px-3.5 h-10 text-[13px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B] whitespace-nowrap"
          >
            관리자
          </Link>
        )}
      </SiteHeader>

      <main className="flex-1">
        {/* ════════════════════════════════════════════════════════════
            [2] 히어로 섹션 — 핵심 메시지 1개 · 보조 설명 1개 · 핵심 CTA 2개 · 대표 매장 비주얼 1개
            ════════════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="hero-title"
          className="relative w-full border-b border-[#E5E2DC] bg-[#FAF9F7]"
        >
          <div className="hb-container py-10 sm:py-14 lg:py-16">
            <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
              {/* 좌측: 핵심 메시지 + 보조 설명 + 핵심 CTA 2개 */}
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E2DC] bg-white px-3.5 py-1 text-[13px] font-semibold text-[#0E1A2B] shadow-2xs">
                  <span className="font-bold text-[#D9531E]">SINCE {STORE.since}</span>
                  <span className="h-3 w-px bg-[#E5E2DC]" aria-hidden="true" />
                  <span className="text-[#3E4756]">대전 중촌동 직영 가전·주방설비 ({OPERATING_YEARS}년 운영)</span>
                </div>

                <h1
                  id="hero-title"
                  className="mt-4 text-[28px] xs:text-[32px] sm:text-[38px] lg:text-[42px] font-bold leading-[1.24] tracking-[-0.028em] text-[#0E1A2B] break-keep"
                >
                  가정용 가전부터 업소용 주방설비까지,
                  <br />
                  <span className="text-[#D9531E]">
                    분해 세척·검수를 마친 실매물
                  </span>
                  만 출고합니다
                </h1>

                <p className="mt-4 max-w-[540px] text-[15.5px] sm:text-[16.5px] leading-[1.65] text-[#3E4756] break-keep">
                  대전 중촌동 1·2층 직영 매장에서 에어컨·냉장고·세탁기·업소용 설비를 직접 확인하실 수 있으며, 사용하던 가전과 폐업 설비는 방문 수거 당일 현금으로 정산해 드립니다.
                </p>

                <div className="mt-7 flex flex-col xs:flex-row items-stretch xs:items-center gap-3 max-w-[440px]">
                  <Link
                    href="/gallery"
                    className="hb-btn-primary flex-1 h-12 sm:h-13 px-6 text-[15.5px] whitespace-nowrap"
                  >
                    <span>판매 제품 보기</span>
                    <Icon d={ICON.arrow} className="h-4 w-4 shrink-0" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("begin_buyback_inquiry", {
                        location: "hero_cta",
                      });
                      openInquiry("내 물건 팔기");
                    }}
                    className="hb-btn-outline flex-1 h-12 sm:h-13 px-6 text-[15.5px] whitespace-nowrap"
                  >
                    <span>가전 매입 신청</span>
                  </button>
                </div>
              </div>

              {/* 우측: 대표 비주얼 1개 (실제 오프라인 직영 매장 사진) */}
              <div className="lg:col-span-6">
                <div className="overflow-hidden rounded-xl border border-[#E5E2DC] bg-white">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F0EDE7]">
                    <SafeImg
                      src="/main-bg2.png"
                      alt={`대전 중구 대전천서로 691-62(중촌동 144) ${STORE.name} 오프라인 직영 매장 외관`}
                      eager
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#E5E2DC] bg-white px-4 py-3 text-[13px] text-[#3E4756]">
                    <span className="font-semibold text-[#0E1A2B]">
                      {STORE.roadAddress} ({STORE.addressNote})
                    </span>
                    <span className="text-[#646E7E] tabular-nums">
                      영업시간 {STORE.hours} · 매장 앞 주차 가능
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [2-1] 취급 품목 · 주요 서비스 3D 픽토그램 퀵메뉴 바 (기존 위치 유지)
            ════════════════════════════════════════════════════════════ */}
        <CategoryPictogramBar onSelectInquiry={(type) => openInquiry(type)} />

        {/* ════════════════════════════════════════════════════════════
            [3] 핵심 서비스 선택 섹션 (중고가전 구매 · 가전 매입 신청 · 업소용·창업 상담)
            ════════════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="core-services-title"
          className="border-b border-[#E5E2DC] bg-white py-12 sm:py-16"
        >
          <div className="hb-container">
            <SectionHeading
              title={
                <span id="core-services-title">
                  중고가전 구매 · 방문매입 · 업소용 상담
                </span>
              }
              desc="가정용 단품 구매부터 사용하던 가전 처분, 식당·카페 창업 설비 납품까지 목적에 맞는 경로로 바로 이동하실 수 있습니다."
            />

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {/* 서비스 1: 중고가전 구매 */}
              <article className="group flex flex-col justify-between rounded-2xl border border-[#E5E2DC] bg-white p-5 sm:p-6 hover:border-[#0E1A2B] transition-colors shadow-2xs">
                <div>
                  <Link
                    href="/gallery"
                    className="relative mb-4 block h-40 sm:h-44 w-full overflow-hidden rounded-xl border border-[#38BDF8]/30 bg-[#50D6F0]"
                  >
                    <SafeImg
                      src="/illustrations/service-buy.jpg"
                      alt="분해 살균 세척을 마친 냉장고·세탁기·에어컨 일러스트"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </Link>

                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-[#0E1A2B] px-2.5 py-1 text-[11.5px] font-bold text-white">
                      01 · 중고가전 구매
                    </span>
                    <span className="text-[12px] font-semibold text-[#646E7E]">
                      가정 · 원룸 · 자취 · 사무실
                    </span>
                  </div>
                  <h3 className="mt-3 text-[20px] sm:text-[21px] font-bold text-[#0E1A2B] tracking-[-0.02em]">
                    검수·세척 완료 판매 제품 구매
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.6] text-[#3E4756] break-keep">
                    직영 엔지니어가 분해 고압 세척과 시운전을 마친 에어컨, 냉장고, 세탁기, 소형가전을 합리적인 정찰가로 구매하실 수 있습니다.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E5E2DC]">
                  <Link
                    href="/gallery"
                    className="hb-btn-primary w-full h-11 text-[14.5px]"
                  >
                    <span>판매 제품 보러가기</span>
                    <Icon d={ICON.arrow} className="w-4 h-4" />
                  </Link>
                </div>
              </article>

              {/* 서비스 2: 가전 매입 신청 */}
              <article className="group flex flex-col justify-between rounded-2xl border border-[#E5E2DC] bg-white p-5 sm:p-6 hover:border-[#0E1A2B] transition-colors shadow-2xs">
                <div>
                  <button
                    type="button"
                    onClick={() => openInquiry("내 물건 팔기")}
                    className="relative mb-4 block h-40 sm:h-44 w-full overflow-hidden rounded-xl border border-[#FB923C]/30 bg-[#FED2A6] cursor-pointer"
                  >
                    <SafeImg
                      src="/illustrations/service-sell.jpg"
                      alt="사진 전송 후 방문 수거 및 당일 현금 입금 매입 일러스트"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-[#D9531E] px-2.5 py-1 text-[11.5px] font-bold text-white">
                      02 · 가전 매입 신청
                    </span>
                    <span className="text-[12px] font-semibold text-[#646E7E]">
                      이사 · 가전교체 · 폐업정리
                    </span>
                  </div>
                  <h3 className="mt-3 text-[20px] sm:text-[21px] font-bold text-[#0E1A2B] tracking-[-0.02em]">
                    사용하던 가전 · 주방설비 방문 매입
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.6] text-[#3E4756] break-keep">
                    전면 사진과 모델명(명판)을 보내주시면 빠르게 매입 견적을 안내해 드리며, 희망 일자에 방문 수거 후 현장에서 즉시 송금합니다.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E5E2DC]">
                  <button
                    type="button"
                    onClick={() => openInquiry("내 물건 팔기")}
                    className="hb-btn-accent w-full h-11 text-[14.5px]"
                  >
                    <span>가전 매입 견적 신청</span>
                    <Icon d={ICON.arrow} className="w-4 h-4" />
                  </button>
                </div>
              </article>

              {/* 서비스 3: 업소용·창업 상담 */}
              <article className="group flex flex-col justify-between rounded-2xl border border-[#E5E2DC] bg-white p-5 sm:p-6 hover:border-[#0E1A2B] transition-colors shadow-2xs">
                <div>
                  <button
                    type="button"
                    onClick={() => openInquiry("대량·업소용 상담")}
                    className="relative mb-4 block h-40 sm:h-44 w-full overflow-hidden rounded-xl border border-[#34D399]/30 bg-[#7AEAD3] cursor-pointer"
                  >
                    <SafeImg
                      src="/illustrations/service-biz.jpg"
                      alt="업소용 스텐 냉장고·쇼케이스·제빙기 식당 카페 주방설비 일러스트"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-[#0E1A2B] px-2.5 py-1 text-[11.5px] font-bold text-white">
                      03 · 업소용 · 창업 상담
                    </span>
                    <span className="text-[12px] font-semibold text-[#646E7E]">
                      식당 · 카페 · 기숙사 · 관공서
                    </span>
                  </div>
                  <h3 className="mt-3 text-[20px] sm:text-[21px] font-bold text-[#0E1A2B] tracking-[-0.02em]">
                    업소용 주방설비 · 대량 패키지 상담
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.6] text-[#3E4756] break-keep">
                    45박스 스텐 냉장고, 테이블 냉장고, 음료·제과 쇼케이스, 제빙기 등 매장 오픈 설비 구성과 전자세금계산서 발행을 일괄 지원합니다.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E5E2DC]">
                  <button
                    type="button"
                    onClick={() => openInquiry("대량·업소용 상담")}
                    className="hb-btn-outline w-full h-11 text-[14.5px]"
                  >
                    <span>업소용 · 대량 상담 신청</span>
                    <Icon d={ICON.arrow} className="w-4 h-4 text-[#D9531E]" />
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [4] 실시간 추천 상품 — FeaturedProductsSection
            ════════════════════════════════════════════════════════════ */}
        <FeaturedProductsSection
          products={featuredProducts}
          loading={productsLoading}
          error={productsError}
          onRetry={loadFeaturedProducts}
          onInquireProduct={(productTitle) =>
            openInquiry("구매 문의", `[상품문의] ${productTitle}`)
          }
        />

        {/* ════════════════════════════════════════════════════════════
            [6] 출고·설치 사례 및 신뢰 근거 (#reviews-section + 5대 운영 원칙)
            ════════════════════════════════════════════════════════════ */}
        <section
          className="border-b border-[#E5E2DC] bg-white py-14 sm:py-20 lg:py-24"
          aria-labelledby="review-title"
        >
          <div className="hb-container">
            {/* 6-1. 실제 배송·설치 현장 기록 (#reviews-section) */}
            <div id="reviews-section">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeading
                  title={<span id="review-title">배송 · 설치 현장 기록</span>}
                  desc="가정집부터 식당·카페·사무실까지 한밭중고전자가 직접 배송하고 설치한 실제 현장 사진입니다."
                />
                <div className="flex items-center gap-3">
                  {reviews.length > 0 && (
                    <span className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] px-3.5 py-2 text-[13px] font-semibold text-[#3E4756] tabular-nums">
                      누적 등록{" "}
                      <strong className="text-[#0E1A2B]">{reviews.length}</strong>
                      건
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setReviewModalOpen(true)}
                      className="hb-btn-primary h-10 px-4 text-[13px]"
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
                <div className="mt-8 flex flex-col items-start gap-4 rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[16px] font-bold text-[#0E1A2B]">
                      현장 사진을 정리하고 있습니다.
                    </p>
                    <p className="mt-1 text-[14px] text-[#3E4756]">
                      배송·설치 사례가 궁금하시면 카카오톡으로 편하게 문의해 주세요.
                    </p>
                  </div>
                  <a
                    href={STORE.kakaoChat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hb-btn-kakao h-10 shrink-0 px-4 text-[13.5px]"
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
                          className="group relative overflow-hidden rounded-xl border border-[#E5E2DC] bg-white hover:border-[#0E1A2B] transition-colors"
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
                              <span className="absolute right-3 top-3 z-10 rounded bg-[#0E1A2B]/80 px-2 py-0.5 text-[11.5px] font-semibold text-white tabular-nums">
                                +{imgs.length - 1}장
                              </span>
                            )}
                          </button>
                          <div className="flex items-center justify-between gap-2 bg-white px-4 py-3.5 border-t border-[#E5E2DC]">
                            <p className="line-clamp-1 text-[14.5px] font-semibold text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors">
                              {r.title || "배송 및 설치 완료"}
                            </p>
                            <span className="shrink-0 text-[12.5px] text-[#646E7E] tabular-nums">
                              {shortDate(r.created_at)}
                            </span>
                          </div>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(r.id)}
                              className="absolute left-3 top-3 z-20 rounded bg-white/95 px-2.5 py-1 text-[11.5px] font-bold text-red-600 shadow"
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
                        className="hb-btn-outline h-11 px-7 text-[14px]"
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
            </div>

            {/* 6-2. 5대 품질·운영 원칙 (읽기 쉬운 편집형 레이아웃) */}
            <div className="mt-16 sm:mt-20 pt-12 sm:pt-16 border-t border-[#E5E2DC]">
              <div className="grid gap-8 lg:grid-cols-12 items-start">
                <div className="lg:col-span-4">
                  <SectionHeading
                    title={
                      <span id="usp-title">
                        중고가전 구매 시 불안한 점,
                        <br />
                        <span className="text-[#D9531E]">
                          5가지 원칙으로 보증합니다
                        </span>
                      </span>
                    }
                    desc={`입고 검수부터 분해 세척, 직배송 설치와 사후 A/S까지 ${STORE.name}가 ${STORE.since}년부터 지켜온 운영 기준입니다.`}
                  />
                </div>

                <ol className="lg:col-span-8 divide-y divide-[#E5E2DC] border-y border-[#E5E2DC]">
                  {USP.map((u) => (
                    <li
                      key={u.no}
                      className="py-5 sm:py-6 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6"
                    >
                      <div className="flex items-center gap-2.5 sm:w-44 shrink-0">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#0E1A2B] text-[12px] font-bold text-white tabular-nums">
                          {u.no}
                        </span>
                        <span className="text-[13px] font-bold text-[#D9531E]">
                          {u.tag}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <h3 className="text-[17px] sm:text-[18px] font-bold text-[#0E1A2B]">
                            {u.t}
                          </h3>
                          <span className="text-[12.5px] font-semibold text-[#0E1A2B] bg-[#FAF9F7] border border-[#E5E2DC] rounded px-2 py-0.5 shrink-0 self-start">
                            {u.highlight}
                          </span>
                        </div>
                        <p className="mt-2 text-[14.5px] leading-[1.65] text-[#3E4756] break-keep">
                          {u.d}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [7] 매입 안내 및 상담 접수 (#sell-section + #inquiry-section)
            — 명확한 4단계 매입 절차 + 원본 비율 매입 안내문 + 통합 상담 신청 폼
            ════════════════════════════════════════════════════════════ */}
        <section
          id="sell-section"
          className="border-b border-[#E5E2DC] bg-[#F7F6F3] py-14 sm:py-20 lg:py-24"
          aria-labelledby="sell-title"
        >
          <div className="hb-container">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 items-start">
              {/* 좌측: 매입 안내 핵심 요약 및 4단계 절차 */}
              <div className="lg:col-span-6">
                <SectionHeading
                  title={
                    <span id="sell-title">
                      쓰지 않는 가전과 매장 설비,
                      <br />
                      4단계 절차로 간편하게 매입합니다
                    </span>
                  }
                  desc="가정용 대형가전부터 식당·카페 업소용 냉장·주방 설비까지 연식과 상태를 확인하여 합리적인 시세로 매입하며, 방문 수거 당일 현장에서 정산해 드립니다."
                />

                <ul className="mt-5 flex flex-wrap gap-2">
                  {SELL_CASES.map((s) => (
                    <li
                      key={s}
                      className="rounded-md border border-[#CFCAC0] bg-white px-3 py-1 text-[13px] font-semibold text-[#0E1A2B]"
                    >
                      #{s}
                    </li>
                  ))}
                </ul>

                {/* 명확한 4단계 매입 진행 안내 */}
                <ol className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {SELL_STEPS.map((s, i) => (
                    <li
                      key={s.t}
                      className="flex flex-col justify-between rounded-xl border border-[#E5E2DC] bg-white p-4 sm:p-5"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold text-[#D9531E] tabular-nums">
                            STEP 0{i + 1}
                          </span>
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FAF9F7] border border-[#E5E2DC] text-[12px] font-bold text-[#0E1A2B] tabular-nums">
                            {i + 1}
                          </span>
                        </div>
                        <h4 className="mt-2 text-[16px] font-bold text-[#0E1A2B]">
                          {s.t}
                        </h4>
                        <p className="mt-1.5 text-[13.5px] leading-[1.6] text-[#3E4756] break-keep">
                          {s.d}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openInquiry("내 물건 팔기")}
                    className="hb-btn-accent h-11 px-5 text-[14.5px]"
                  >
                    <span>아래 양식으로 매입 신청</span>
                    <Icon d={ICON.arrow} className="h-4 w-4" />
                  </button>
                  <a
                    href={STORE.kakaoChat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hb-btn-kakao h-11 px-5 text-[14.5px]"
                  >
                    <Icon d={ICON.chat} className="h-4 w-4" />
                    <span>카톡으로 사진 보내기</span>
                  </a>
                  <Link
                    href="/purchase"
                    className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#0E1A2B] hover:text-[#D9531E] underline underline-offset-4 px-2 py-2"
                  >
                    <span>매입 전용 안내 페이지</span>
                    <Icon d={ICON.right} className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 우측: 매입 안내문 원본 비율(잘림 없음) 카드 */}
              <div className="lg:col-span-6">
                <div className="rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E2DC]">
                    <div>
                      <span className="inline-block rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2.5 py-0.5 text-[11.5px] font-bold text-[#D9531E]">
                        촬영 및 확인 가이드
                      </span>
                      <h3 className="mt-1.5 text-[17px] font-bold text-[#0E1A2B]">
                        매입 신청 전 사진 촬영 및 확인 사항
                      </h3>
                      <p className="mt-0.5 text-[13px] text-[#646E7E]">
                        전면 사진 · 모델명/제조년월 명판 · 특이사항 안내 (클릭 시 확대)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGuideModalOpen(true)}
                      className="hb-btn-outline h-9 px-3.5 text-[12.5px] shrink-0 self-start sm:self-center"
                    >
                      <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#D9531E]" />
                      <span>크게 보기</span>
                    </button>
                  </div>

                  {/* 텍스트 포함 안내문 이미지 원본 비율 유지 (object-contain, 잘림 없음) */}
                  <button
                    type="button"
                    onClick={() => setGuideModalOpen(true)}
                    className="mt-4 block w-full overflow-hidden rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-2 hover:border-[#0E1A2B] transition-colors"
                    aria-label="제품 매입 안내문 원본 비율로 크게 보기"
                  >
                    <SafeImg
                      src="/매입 안내문.png"
                      alt="제품 매입 시 고객 안내문: 1. 전면 사진, 2. 모델명 및 제조년월 확인, 3. 특이사항 안내, 4. 매입 시 유의할 점"
                      className="w-full h-auto object-contain mx-auto"
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* 통합 상담 신청 폼 (#inquiry-section / #inquiry-form) */}
            <div
              id="inquiry-section"
              className="mt-16 sm:mt-20 pt-12 sm:pt-16 border-t border-[#E5E2DC]"
            >
              <SectionHeading
                title={<span id="cta-title">구매 · 매입 · 업소용 통합 상담 신청</span>}
                desc="상담 유형을 선택하시고 품목과 연락처를 남겨주시면 담당자가 확인 후 신속히 연락드립니다."
              />

              <div className="mt-8 grid gap-7 lg:grid-cols-12 items-start">
                <div
                  id="inquiry-form"
                  className="rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-7 lg:p-8 lg:col-span-8"
                >
                  <UnifiedInquiryForm
                    defaultType={inquiryType}
                    linkedProduct={linkedProduct}
                    onSuccess={() => loadRecent()}
                  />
                </div>

                <aside className="flex flex-col gap-5 lg:col-span-4">
                  <div className="rounded-xl bg-[#0E1A2B] p-6 text-white">
                    <span className="inline-block rounded bg-[#D9531E] px-2.5 py-0.5 text-[11.5px] font-bold text-white">
                      직통 고객센터
                    </span>
                    <h3 className="mt-3 text-[14.5px] font-medium text-white/80">
                      급하신 용무는 전화·문자·카톡으로 바로 문의하세요
                    </h3>
                    <a
                      href={telHref(STORE.tel)}
                      className="mt-2 block text-[25px] font-bold tracking-tight sm:text-[28px] hover:text-[#FF8A50] tabular-nums"
                    >
                      {STORE.tel}
                    </a>
                    <a
                      href={telHref(STORE.mobile)}
                      className="mt-0.5 block text-[15px] font-semibold text-white/85 hover:text-[#FF8A50] tabular-nums"
                    >
                      직통 휴대전화: {STORE.mobile}
                    </a>
                    <div className="mt-5 grid grid-cols-2 gap-2.5">
                      <a
                        href={telHref(STORE.tel)}
                        onClick={() =>
                          trackEvent("click_tel_consult", {
                            location: "inquiry_aside",
                          })
                        }
                        className="hb-btn bg-white/10 hover:bg-white/20 text-white h-10 text-[13px]"
                      >
                        <Icon
                          d={ICON.phone}
                          className="w-3.5 h-3.5 text-[#FF8A50]"
                        />
                        전화 걸기
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
                        className="hb-btn-kakao h-10 text-[13px]"
                      >
                        <Icon d={ICON.chat} className="w-3.5 h-3.5" />
                        카톡 상담
                      </a>
                    </div>
                    <p className="mt-4 border-t border-white/15 pt-3 text-[12.5px] text-white/70">
                      영업시간 {STORE.hours} · {STORE.closed}
                    </p>
                  </div>

                  {/* 최근 접수된 문의 현황 */}
                  <div className="rounded-xl border border-[#E5E2DC] bg-white p-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
                      <h3 className="text-[15.5px] font-bold text-[#0E1A2B]">
                        최근 접수된 문의 현황
                      </h3>
                      <Link
                        href="/inquiry"
                        className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#D9531E] hover:underline"
                      >
                        <span>전체 게시판</span>
                        <Icon d={ICON.right} className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    {recent.length === 0 ? (
                      <p className="mt-4 text-[13.5px] text-[#646E7E]">
                        최근 접수된 문의 내역이 없습니다.
                      </p>
                    ) : (
                      <ul className="mt-3 hb-list">
                        {recent.map((r) => {
                          const isDone =
                            r.status === "답변완료" || r.status === "처리완료";
                          return (
                            <li key={r.id} className="hb-list-row text-[13.5px]">
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <span className="shrink-0 rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2 py-0.5 text-[11px] font-semibold text-[#0E1A2B]">
                                  {getInquiryTypeLabel(r.inquiry_type)}
                                </span>
                                <Link
                                  href="/inquiry"
                                  className="min-w-0 flex-1 truncate font-semibold text-[#0E1A2B] hover:text-[#D9531E] transition-colors"
                                >
                                  {r.category || "상담 문의"}
                                </Link>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 text-[12px]">
                                <span className="text-[#646E7E]">
                                  {r.masked_name || maskName(r.name)}
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
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
                </aside>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [흐름 7] 자주 묻는 질문(FAQ) 및 직영 매장 위치 (#faq-section + #location-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="faq-section"
          className="border-b border-[#E6E3DC] bg-white py-14 sm:py-20 lg:py-24"
          aria-labelledby="faq-title"
        >
          <div className="hb-container grid gap-10 lg:grid-cols-12 lg:gap-14 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-28">
              <SectionHeading
                title={<span id="faq-title">자주 묻는 질문 (FAQ)</span>}
                desc="A/S 책임 보증 기간, 보상판매 차액 정산, 설치 환경별 비용 기준 등 고객님들이 상담 전 가장 많이 물어보시는 핵심 질문입니다."
              />
              <p className="mt-4 text-[14.5px] leading-relaxed text-[#434B59]">
                추가 문의는 대표전화{" "}
                <a
                  href={telHref(STORE.tel)}
                  className="font-extrabold text-[#0E1A2B] underline underline-offset-4"
                >
                  {STORE.tel}
                </a>{" "}
                또는 직통{" "}
                <a
                  href={telHref(STORE.mobile)}
                  className="font-extrabold text-[#0E1A2B] underline underline-offset-4"
                >
                  {STORE.mobile}
                </a>
                로 연락해 주세요.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => openInquiry("구매 문의")}
                  className="hb-btn-primary h-11 px-4 text-[13.5px]"
                >
                  <Icon d={ICON.chat} className="h-4 w-4 text-[#FF8A50]" />
                  <span>온라인 문의하기</span>
                </button>
                <a
                  href={telHref(STORE.tel)}
                  className="hb-btn-outline h-11 px-4 text-[13.5px]"
                >
                  <Icon d={ICON.phone} className="h-4 w-4 text-[#D9531E]" />
                  <span>전화 바로 연결</span>
                </a>
              </div>
            </div>

            <div className="divide-y divide-[#E6E3DC] rounded-xl border border-[#E6E3DC] bg-white lg:col-span-8 overflow-hidden">
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
                        className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FFF5F0] text-[13px] font-extrabold text-[#D9531E]">
                            Q
                          </span>
                          <div className="min-w-0">
                            <span className="inline-block rounded bg-[#F7F6F3] px-2 py-0.5 text-[11.5px] font-bold text-[#434B59] mb-1.5">
                              {f.tag}
                            </span>
                            <span className="block text-[15.5px] font-bold leading-snug text-[#0E1A2B] sm:text-[16.5px] break-keep">
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
                        className="border-t border-[#F0EDE7] bg-[#FAF9F7] px-5 py-4 sm:px-6 sm:pl-[68px] text-[14.5px] leading-[1.75] text-[#434B59] break-keep"
                      >
                        {f.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 오프라인 매장 오시는 길 (#location-section) */}
        <section
          id="location-section"
          className="border-b border-[#E6E3DC] bg-[#F7F6F3] py-14 sm:py-20"
          aria-labelledby="location-title"
        >
          <div className="hb-container">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <SectionHeading
                title={<span id="location-title">오프라인 매장 위치 및 영업 안내</span>}
                desc={`${STORE.roadAddress} (${STORE.jibunAddress} · 중촌고가도로 밑) · 매장 앞 전용 주차 가능`}
              />
              <button
                type="button"
                onClick={handleCopyAddress}
                className="hb-btn-outline h-10 px-4 text-[13.5px] self-start sm:self-end shrink-0"
              >
                <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#D9531E]" />
                <span>도로명 주소 복사</span>
              </button>
            </div>

            <div className="mt-8 grid overflow-hidden rounded-xl border border-[#E6E3DC] bg-white lg:grid-cols-12 shadow-card">
              <div className="relative h-[300px] sm:h-[380px] lg:col-span-7 lg:h-auto lg:min-h-[440px] bg-[#F0EDE7]">
                <iframe
                  title="한밭중고전자 매장 위치 지도"
                  src="https://maps.google.com/maps?q=%EB%8C%80%EC%A0%84+%EC%A4%91%EA%B5%AC+%EC%A4%91%EC%B4%8C%EB%8F%99+144&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen
                />
              </div>

              <div className="bg-white text-[#0E1A2B] p-5 sm:p-8 lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#E6E3DC]">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div>
                      <p className="text-[#D9531E] font-bold text-[12.5px]">
                        오프라인 직영 쇼룸
                      </p>
                      <h3 className="text-[21px] sm:text-[23px] font-extrabold tracking-tight mt-0.5">
                        {STORE.name}
                      </h3>
                    </div>
                    <span className="rounded-md bg-[#F7F6F3] border border-[#E6E3DC] px-2.5 py-1 text-[12px] font-bold text-[#0E1A2B]">
                      방문 실물 확인 가능
                    </span>
                  </div>

                  {/* 매장 외관 사진 프리뷰 */}
                  <div className="mb-5 overflow-hidden rounded-lg border border-[#E6E3DC] bg-[#F0EDE7]">
                    <div className="aspect-[16/8] w-full overflow-hidden">
                      <SafeImg
                        src="/main-bg2.png"
                        alt="대전 중구 대전천서로 691-62(중촌동 144) 한밭중고전자 매장 외관"
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  </div>

                  <ul className="flex flex-col gap-3.5 text-[14px]">
                    <li className="pb-3.5 border-b border-[#E6E3DC]">
                      <p className="text-[12px] text-[#667085] font-bold mb-1">
                        전화 상담 문의
                      </p>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
                        <a
                          href={telHref(STORE.tel)}
                          className="text-[20px] sm:text-[22px] font-extrabold text-[#0E1A2B] hover:text-[#D9531E]"
                        >
                          {STORE.tel}
                        </a>
                        <a
                          href={telHref(STORE.mobile)}
                          className="text-[14.5px] font-semibold text-[#434B59] hover:text-[#D9531E]"
                        >
                          ({STORE.mobile})
                        </a>
                      </div>
                    </li>
                    <li className="pb-3.5 border-b border-[#E6E3DC]">
                      <p className="text-[12px] text-[#667085] font-bold mb-1">
                        매장 주소
                      </p>
                      <p className="leading-snug font-bold text-[#0E1A2B]">
                        {STORE.roadAddress}
                      </p>
                      <p className="text-[13px] text-[#434B59] mt-1">
                        지번: {STORE.jibunAddress}
                      </p>
                      <p className="text-[12.5px] text-[#667085] mt-0.5">
                        {STORE.addressNote} · {STORE.parking}
                      </p>
                    </li>
                    <li>
                      <p className="text-[12px] text-[#667085] font-bold mb-1">
                        영업시간 안내
                      </p>
                      <p className="font-bold text-[#0E1A2B]">{STORE.hours}</p>
                      <p className="text-[12.5px] font-semibold text-[#D9531E] mt-0.5">
                        ※ {STORE.closed}
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E6E3DC] grid grid-cols-2 gap-2.5">
                  <a
                    href={STORE.naverMap}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hb-btn bg-[#03C75A] text-white hover:bg-[#02b350] h-11 text-[13.5px]"
                  >
                    네이버 지도 길찾기
                  </a>
                  <a
                    href="https://map.kakao.com/link/to/한밭중고전자,36.335503,127.406981"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hb-btn-kakao h-11 text-[13.5px]"
                  >
                    카카오맵 길찾기
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 공통 푸터 및 슬림 모바일 하단 CTA 바 */}
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
          <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-[#E6E3DC] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E6E3DC] bg-[#0E1A2B] px-5 py-3.5 text-white">
              <div>
                <h3 className="text-[16px] font-bold">
                  {STORE.name} 제품 매입 안내문
                </h3>
                <p className="text-[12px] text-white/70">
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
                className="mx-auto max-h-[72vh] w-auto max-w-full object-contain rounded border border-[#E6E3DC] bg-white"
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#E6E3DC] bg-white px-5 py-3.5">
              <span className="text-[13px] text-[#434B59] hidden sm:inline">
                안내문에 맞춰 사진을 보내주시면 정확한 견적 안내가 가능합니다.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setGuideModalOpen(false);
                    openInquiry("내 물건 팔기");
                  }}
                  className="hb-btn-accent h-10 px-4 text-[13.5px]"
                >
                  바로 매입 견적 신청하기
                </button>
                <button
                  type="button"
                  onClick={() => setGuideModalOpen(false)}
                  className="hb-btn-outline h-10 px-4 text-[13.5px]"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </Modal>
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
                <span className="text-[12px] font-bold text-[#FF8A50]">
                  직영 배송 · 설치 현장 기록
                </span>
                <p className="truncate text-[15px] sm:text-[16px] font-bold">
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
            className="w-full rounded-xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E6E3DC]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-[#0E1A2B]">
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
              className="hb-btn-primary mt-6 h-11 w-full text-[14.5px]"
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
            className="w-full rounded-xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E6E3DC]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-[#0E1A2B]">
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
                <span className="text-[12px] font-semibold text-[#D9531E] animate-pulse">
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
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-[#D7D2C8] bg-[#FAF9F7] text-[12px] font-semibold text-[#667085] hover:border-[#D9531E] hover:text-[#D9531E]">
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
              className="hb-btn-accent mt-6 h-11 w-full text-[14.5px]"
            >
              {uploadingReview ? "등록 중…" : "등록하기"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
