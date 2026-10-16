// 파일 경로: app/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  UnifiedInquiryForm,
  type LinkedProductContext,
} from "../components/inquiry/unified-inquiry-form";

/* ════════════════════════════════════════════════════════════
   1. 정적 데이터 및 상수 (기존 사업자 사실 문구 100% 보존)
   ════════════════════════════════════════════════════════════ */
const HERO_SLIDES = [
  {
    src: "/images/home-bg.png",
    tabLabel: "가정용 가전",
    badge: "HOME APPLIANCE SHOWROOM",
    caption:
      "가정용 중고가전 · 양문형 냉장고·에어컨·세탁기·건조기 분해 세척 및 검수 완료",
    pos: "object-center",
  },
  {
    src: "/images/biz-bg.png",
    tabLabel: "업소용 설비",
    badge: "COMMERCIAL & KITCHEN",
    caption:
      "업소용 냉장·주방설비 · 45박스 냉장고·쇼케이스·제빙기·식기세척기 상시 보유",
    pos: "object-center",
  },
  {
    src: "/main-bg2.png",
    tabLabel: "오프라인 매장",
    badge: "OFFLINE STOREFRONT",
    caption: `대전 중구 유천로 13(중촌동) ${STORE.name} 직영 매장 · 실물 확인 및 전용 주차`,
    pos: "object-center",
  },
  {
    src: "/main-bg.png",
    tabLabel: "물류·전국배송",
    badge: "LOGISTICS & INSTALLATION",
    caption:
      "대형 냉난방기·업소용 설비 보관 창고 운영 및 전국 직영 배송·설치 지원",
    pos: "object-[70%_center]",
  },
] as const;

const OPERATING_YEARS = new Date().getFullYear() - STORE.since;

const G = {
  aircon: "에어컨/냉난방기",
  fridge: "냉장고",
  washer: "세탁기/건조기",
  biz: "업소용기기",
  kitchen: "주방/소형가전",
} as const;

const galleryHref = (c?: string | null) =>
  c ? `/gallery?category=${encodeURIComponent(c)}` : "/gallery";

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

const CATEGORIES = [
  {
    key: "ac",
    name: "에어컨 · 냉난방기",
    desc: "벽걸이 · 스탠드 · 천장형 · 시스템",
    badge: "무상 A/S 8개월",
    group: "home" as const,
    gallery: G.aircon,
    image: "/images/cat-ac.png",
  },
  {
    key: "fridge",
    name: "냉장고 · 김치냉장고",
    desc: "양문형 · 4도어 · 일반형 · 김치냉장고",
    badge: "고압 살균세척",
    group: "home" as const,
    gallery: G.fridge,
    image: "/images/cat-fridge.png",
  },
  {
    key: "washer",
    name: "세탁기 · 건조기",
    desc: "통돌이 · 드럼 · 워시타워 · 의류건조기",
    badge: "작동·누수 검수",
    group: "home" as const,
    gallery: G.washer,
    image: "/images/cat-washer.png",
  },
  {
    key: "bizfridge",
    name: "업소용 냉장고 · 쇼케이스",
    desc: "25·30·45박스 · 테이블냉장고 · 음료·주류",
    badge: "창업·매장 설비",
    group: "biz" as const,
    gallery: G.biz,
    image: "/images/cat-commercial.png",
  },
  {
    key: "kitchen",
    name: "제빙기 · 식기세척기 · 주방기기",
    desc: "카페 제빙기 · 업소용 세척기 · 스텐 작업대",
    badge: "식당·카페 필수",
    group: "biz" as const,
    gallery: G.biz,
    image: "/images/cat-kitchen.png",
  },
] as const;

const USP = [
  {
    t: "세척·정비 후 판매",
    tag: "INSPECTION & CLEANING",
    d: "입고된 모든 제품은 전문 엔지니어가 분해 세척과 정비, 시운전 검수를 마친 뒤 쇼룸에 진열합니다.",
  },
  {
    t: "명확한 무상 A/S 보증",
    tag: "WARRANTY SERVICE",
    d: "에어컨·냉난방기 8개월, 그 외 제품 4개월 무상 A/S를 보증합니다. (계약 내용에 따라 보증 기간은 달라질 수 있습니다.)",
  },
  {
    t: "판매와 매입을 한 곳에서",
    tag: "BUY & SELL ONE-STOP",
    d: "필요한 가전 구매와 쓰지 않는 가전·주방설비 처분을 한 번의 일정으로 동시에 진행하실 수 있습니다.",
  },
  {
    t: "전국 단위 배송·설치",
    tag: "NATIONWIDE DELIVERY",
    d: "대전·충청권은 물론 구미·포항·창원·부산·거제 등 전국 다수 지역 배송 및 설치 거래 실적을 보유하고 있습니다.",
  },
  {
    t: "대량 거래 · 세금계산서 발행",
    tag: "B2B TAX INVOICE",
    d: "식당·카페 오픈 패키지 도입이나 폐업·매장 정리 같은 사업자 거래 시 세금계산서를 투명하게 발행합니다.",
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
    d: "온라인 문의 폼이나 카카오톡으로 제품 전면 사진, 모델명(명판), 수거 지역을 보내주세요.",
  },
  {
    t: "견적 안내",
    d: "담당자가 외관 상태와 연식·수요를 확인하여 합리적인 매입 가견적을 신속히 안내해 드립니다.",
  },
  {
    t: "방문 확인·수거",
    d: "고객님이 원하시는 날짜와 시간에 맞춰 전문 기사님이 직접 방문해 안전하게 분리·수거합니다.",
  },
  {
    t: "즉시 입금",
    d: "현장 수거가 완료되는 즉시 지정하신 계좌로 매입 대금 전액을 100% 현금 입금해 드립니다.",
  },
] as const;

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
    a: `영업시간은 ${STORE.hours} (${STORE.closed})이며, 오프라인 매장은 ${STORE.address}에 위치해 있습니다.`,
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
  const [catFilter, setCatFilter] = useState<"all" | "home" | "biz">("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [lightbox, setLightbox] = useState<{
    review: Review;
    index: number;
  } | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  /* 통합 문의 폼 연동 상태 */
  const [inquiryType, setInquiryType] =
    useState<InquiryTypeValue>("구매 문의");
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

  const visibleCats = useMemo(
    () =>
      CATEGORIES.filter((c) => catFilter === "all" || c.group === catFilter),
    [catFilter]
  );
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
      await navigator.clipboard.writeText(STORE.address);
      toast.success("매장 주소가 클립보드에 복사되었습니다.");
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

  const currentSlide = HERO_SLIDES[heroIdx] || HERO_SLIDES[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F2] text-[#1F2530]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ① 상단 공통 헤더 */}
      <SiteHeader>
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden md:inline-flex items-center rounded-md border border-[#DDD9D1] bg-[#FAF9F7] px-3 h-9 sm:h-10 text-[12px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B] whitespace-nowrap"
          >
            관리자 대시보드
          </Link>
        )}
        <button
          type="button"
          onClick={() => openInquiry("구매 문의")}
          className="hb-btn-primary h-9 sm:h-10 px-3 sm:px-4 text-[12.5px] sm:text-[13px] whitespace-nowrap"
        >
          문의하기
        </button>
      </SiteHeader>

      <main className="flex-1">
        {/* ② HERO 섹션 (텍스트 없는 고해상도 쇼룸 이미지 뷰어 + 명확한 품목 태그 + 직관적인 전환 동선) */}
        <section
          aria-labelledby="hero-title"
          className="relative w-full bg-[#0E1A2B] text-white border-b border-[#1C2B40] overflow-hidden"
        >
          {/* 은은한 쇼룸 배경 광원 디테일 */}
          <div
            className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-[#D9531E]/10 blur-[110px]"
            aria-hidden="true"
          />

          <div className="hb-container relative py-7 sm:py-12 lg:py-16">
            <div className="grid items-center gap-7 sm:gap-9 lg:grid-cols-12 lg:gap-10 xl:gap-12">
              {/* 좌측 5컬럼: 핵심 브랜드 정체성, 취급 품목 칩, 주요 행동 유도 */}
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] sm:text-[12px] font-semibold text-white/90">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#D9531E]"
                    aria-hidden="true"
                  />
                  <span>
                    SINCE {STORE.since} · 대전 중촌동 직영 매장 · 전국 배송
                  </span>
                </div>

                <h1
                  id="hero-title"
                  className="mt-3.5 sm:mt-4 font-bold tracking-[-0.03em] text-white"
                >
                  <span className="block text-[13px] sm:text-[14.5px] font-bold tracking-normal text-[#FF8A50]">
                    가정용 중고가전 · 업소용 냉장·주방설비 전문 {STORE.name}
                  </span>
                  <span className="mt-2 block text-[26px] leading-[1.22] xs:text-[29px] sm:text-[38px] lg:text-[40px] xl:text-[44px] lg:leading-[1.18] break-keep">
                    검수 마친 새것 같은 가전,
                    <br />
                    정직하고 합리적인 가격으로.
                  </span>
                </h1>

                <p className="mt-3 sm:mt-4 max-w-[490px] text-[13.5px] sm:text-[15px] leading-[1.68] text-white/80 break-keep">
                  {STORE.since}년부터 에어컨·냉장고·세탁기부터 식당·카페 업소용 냉장·주방기기까지 직접 세척·검수하여 판매하고 합리적인 기준으로 방문 매입합니다.
                </p>

                {/* 핵심 취급 품목 빠른 진입 태그 */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {[
                    { label: "에어컨·냉난방기", href: galleryHref(G.aircon) },
                    { label: "냉장고·김치냉장고", href: galleryHref(G.fridge) },
                    { label: "세탁기·건조기", href: galleryHref(G.washer) },
                    { label: "업소용 냉장·주방설비", href: galleryHref(G.biz) },
                  ].map((tag) => (
                    <Link
                      key={tag.label}
                      href={tag.href}
                      className="inline-flex items-center gap-1 rounded border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11.5px] sm:text-[12px] font-semibold text-white/85 hover:border-[#FF8A50] hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <span>{tag.label}</span>
                      <Icon
                        d={ICON.right}
                        className="w-3 h-3 text-[#FF8A50]"
                      />
                    </Link>
                  ))}
                </div>

                {/* 1·2차 전환 CTA 버튼 (320px~1920px 줄바꿈 방지) */}
                <div className="mt-5 sm:mt-7 grid grid-cols-2 gap-2.5 sm:gap-3 max-w-[440px]">
                  <Link
                    href="/gallery"
                    className="hb-btn-accent h-11 sm:h-12 px-3 sm:px-5 text-[13px] xs:text-[13.5px] sm:text-[15px] shadow-lg whitespace-nowrap"
                  >
                    <span>판매 매물 보기</span>
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
                    className="hb-btn border border-white/30 bg-white/10 text-white hover:bg-white hover:text-[#0E1A2B] h-11 sm:h-12 px-3 sm:px-5 text-[13px] xs:text-[13.5px] sm:text-[15px] whitespace-nowrap"
                  >
                    <span>방문 매입 견적 신청</span>
                  </button>
                </div>

                {/* 직통 상담 데스크 요약 바 */}
                <div className="mt-5 sm:mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-[12.5px] sm:text-[13px] text-white/80">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-white/75">
                      <Icon
                        d={ICON.phone}
                        className="h-3.5 w-3.5 text-[#FF8A50]"
                      />
                      직통 상담
                    </span>
                    <a
                      href={telHref(STORE.tel)}
                      onClick={() =>
                        trackEvent("click_tel_consult", {
                          location: "hero_bar",
                        })
                      }
                      className="font-bold text-white hover:text-[#FF8A50] underline underline-offset-4 text-[14px] sm:text-[15px]"
                    >
                      {STORE.tel}
                    </a>
                    <span className="text-white/25" aria-hidden="true">
                      /
                    </span>
                    <a
                      href={telHref(STORE.mobile)}
                      onClick={() =>
                        trackEvent("click_tel_consult", {
                          location: "hero_bar_mobile",
                        })
                      }
                      className="font-semibold text-white/85 hover:text-[#FF8A50]"
                    >
                      {STORE.mobile}
                    </a>
                  </div>
                  <span className="text-[12px] text-white/65">
                    {STORE.hours} ({STORE.closed})
                  </span>
                </div>
              </div>

              {/* 우측 7컬럼: 쇼룸 비주얼 아카이브 프레임 (이미지 내장 텍스트 충돌 원천 제거) */}
              <div className="lg:col-span-7">
                <div className="overflow-hidden rounded-md border border-white/15 bg-[#09121E] shadow-2xl">
                  {/* 상단 슬라이드 메타 바 */}
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#0B1524] px-3.5 sm:px-4 py-2 text-[11px] sm:text-[11.5px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold tabular-nums text-[#FF8A50]">
                        0{heroIdx + 1} / 0{HERO_SLIDES.length}
                      </span>
                      <span className="text-white/25" aria-hidden="true">
                        ·
                      </span>
                      <span className="truncate font-semibold tracking-wider text-white/80 uppercase">
                        {currentSlide.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setHeroIdx(
                            (prev) =>
                              (prev - 1 + HERO_SLIDES.length) %
                              HERO_SLIDES.length
                          )
                        }
                        aria-label="이전 쇼룸 사진"
                        className="grid h-6 w-6 place-items-center rounded bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                      >
                        <Icon d={ICON.left} className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setHeroIdx((prev) => (prev + 1) % HERO_SLIDES.length)
                        }
                        aria-label="다음 쇼룸 사진"
                        className="grid h-6 w-6 place-items-center rounded bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                      >
                        <Icon d={ICON.right} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 메인 쇼룸 사진 프레임 */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#09121E]">
                    {HERO_SLIDES.map((slide, i) => (
                      <div
                        key={slide.src}
                        className={`absolute inset-0 transition-opacity duration-500 ${
                          heroIdx === i ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                      >
                        <SafeImg
                          src={slide.src}
                          alt={slide.caption}
                          eager={i === 0}
                          className={`h-full w-full object-cover ${slide.pos}`}
                        />
                        <div
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#09121E]/90 via-[#09121E]/35 to-transparent"
                          aria-hidden="true"
                        />
                      </div>
                    ))}

                    {/* 슬라이드 캡션 오버레이 */}
                    <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 px-3.5 sm:px-4 py-2.5">
                      <p className="text-[12px] sm:text-[13px] font-medium text-white/95 truncate">
                        {currentSlide.caption}
                      </p>
                    </div>
                  </div>

                  {/* 하단 슬라이드 탭 컨트롤 바 */}
                  <div
                    className="grid grid-cols-4 divide-x divide-white/10 border-t border-white/10 bg-[#101D30]"
                    role="tablist"
                    aria-label="쇼룸 사진 선택"
                  >
                    {HERO_SLIDES.map((slide, i) => {
                      const active = heroIdx === i;
                      return (
                        <button
                          key={slide.tabLabel}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setHeroIdx(i)}
                          className={`px-2 py-2.5 text-center text-[11.5px] sm:text-[12.5px] font-bold transition-colors truncate ${
                            active
                              ? "bg-[#D9531E] text-white"
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="hidden sm:inline mr-1 opacity-75 tabular-nums">
                            0{i + 1}.
                          </span>
                          <span>{slide.tabLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ③ 신뢰 지표 스트립 (기존 사실 문구 보존 + 또렷한 정보 위계) */}
        <div className="border-b border-[#E4E0D8] bg-white">
          <dl className="hb-container grid grid-cols-2 lg:grid-cols-4">
            {[
              {
                badge: "HISTORY",
                k: `SINCE ${STORE.since}`,
                v: `대전 중촌동에서 ${OPERATING_YEARS}년째 직영 영업`,
              },
              {
                badge: "SHOWROOM",
                k: "오프라인 직영 매장",
                v: "매장 방문 실물 확인 · 전용 주차 지원",
              },
              {
                badge: "WARRANTY",
                k: "무상 A/S 보증",
                v: "에어컨 8개월 · 일반가전 4개월 보증",
              },
              {
                badge: "B2B SUPPORT",
                k: "전국 배송 · 세금계산서",
                v: "창업·폐업 대량 거래 적법 증빙 발행",
              },
            ].map((s, i) => (
              <div
                key={s.k}
                className={`py-4 sm:py-5 ${
                  i % 2 === 1 ? "pl-3.5 sm:pl-7 border-l border-[#EEEBE5]" : "pr-2"
                } ${i > 1 ? "border-t border-[#EEEBE5] lg:border-t-0" : ""} ${
                  i > 0 ? "lg:border-l lg:border-[#EEEBE5] lg:pl-7" : ""
                }`}
              >
                <span className="block text-[10px] font-bold tracking-[0.14em] text-[#D9531E]">
                  {s.badge}
                </span>
                <dt className="mt-0.5 text-[15px] font-bold tracking-[-0.015em] text-[#0E1A2B] sm:text-[17px]">
                  {s.k}
                </dt>
                <dd className="mt-0.5 text-[12px] text-[#6B7280] sm:text-[13px] break-keep">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ④ 실시간 판매 중인 추천 매물 섹션 */}
        <FeaturedProductsSection
          products={featuredProducts}
          loading={productsLoading}
          error={productsError}
          onRetry={loadFeaturedProducts}
          onInquireProduct={(productTitle) =>
            openInquiry("구매 문의", `[상품문의] ${productTitle}`)
          }
        />

        {/* ⑤ 품목별 카테고리 탐색 (PC 5열 쇼룸 인덱스 / 모바일 홀수 행 여백 보정) */}
        <section
          id="category-section"
          className="border-b border-[#E4E0D8] bg-[#F6F5F2] py-14 sm:py-20"
          aria-labelledby="cat-title"
        >
          <div className="hb-container">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading
                eyebrow="Category Index"
                title={<span id="cat-title">어떤 품목을 찾으시나요?</span>}
                desc="가정용 필수가전부터 식당·카페 업소용 설비까지, 세척과 정비를 마친 실물 매물을 품목별로 확인하세요."
              />
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
                <div
                  className="inline-flex rounded-md border border-[#DDD9D1] bg-white p-1"
                  role="tablist"
                  aria-label="카테고리 구분"
                >
                  {(
                    [
                      { k: "all", l: "전체 (5)" },
                      { k: "home", l: "가정용 (3)" },
                      { k: "biz", l: "업소용 (2)" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.k}
                      type="button"
                      role="tab"
                      aria-selected={catFilter === f.k}
                      onClick={() => setCatFilter(f.k)}
                      className={`h-9 rounded px-3.5 text-[13px] font-bold transition-colors ${
                        catFilter === f.k
                          ? "bg-[#0E1A2B] text-white"
                          : "text-[#4B5260] hover:text-[#0E1A2B]"
                      }`}
                    >
                      {f.l}
                    </button>
                  ))}
                </div>
                <Link
                  href="/gallery"
                  className="inline-flex items-center gap-1.5 text-[13px] sm:text-[13.5px] font-bold text-[#0E1A2B] underline-offset-4 hover:underline"
                >
                  전체 제품 갤러리 <Icon d={ICON.arrow} className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <ul className="mt-8 sm:mt-10 grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
              {visibleCats.map((c, idx) => {
                const isLastOddOnMobile =
                  visibleCats.length % 2 === 1 &&
                  idx === visibleCats.length - 1;
                return (
                  <li
                    key={c.key}
                    className={
                      isLastOddOnMobile
                        ? "col-span-2 md:col-span-1"
                        : "col-span-1"
                    }
                  >
                    <Link
                      href={galleryHref(c.gallery)}
                      className="group flex flex-col h-full rounded-md border border-[#E4E0D8] bg-white overflow-hidden shadow-2xs hover:border-[#0E1A2B] hover:shadow-card transition-all duration-200"
                      aria-label={`${c.name} 제품 보기`}
                    >
                      <div
                        className={`relative overflow-hidden bg-[#EFECE6] border-b border-[#EEEBE5] ${
                          isLastOddOnMobile
                            ? "aspect-[16/9] md:aspect-[4/5]"
                            : "aspect-[4/5]"
                        }`}
                      >
                        <SafeImg
                          src={c.image}
                          alt={`중고 ${c.name} 판매 제품`}
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        />
                        <div className="absolute left-2.5 right-2.5 top-2.5 flex items-center justify-between gap-1">
                          <span
                            className={`rounded-sm px-2 py-0.5 text-[10.5px] font-bold ${
                              c.group === "home"
                                ? "bg-white/95 text-[#0E1A2B]"
                                : "bg-[#0E1A2B]/90 text-white"
                            }`}
                          >
                            {c.group === "home" ? "가정용" : "업소용"}
                          </span>
                          <span className="rounded-sm bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {c.badge}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-1 items-start justify-between gap-2 p-3.5 sm:p-4">
                        <div className="min-w-0">
                          <h3 className="text-[14px] sm:text-[15px] font-bold text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors leading-snug">
                            {c.name}
                          </h3>
                          <p className="mt-1 line-clamp-1 text-[12px] text-[#6B7280]">
                            {c.desc}
                          </p>
                        </div>
                        <Icon
                          d={ICON.arrow}
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#8A8478] group-hover:translate-x-0.5 group-hover:text-[#D9531E] transition-all"
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ⑥ 가정용 vs 업소용 안내 (고객 유형별 에디토리얼 룩북 스플릿) */}
        <section
          className="border-b border-[#E4E0D8] bg-white py-14 sm:py-20"
          aria-labelledby="split-title"
        >
          <div className="hb-container">
            <SectionHeading
              eyebrow="Home & Business Solutions"
              title={
                <span id="split-title">
                  가정용 필수가전부터 상업용 주방설비까지 맞춤 공급
                </span>
              }
              desc="일반 가정 고객님과 식당·카페·사무실 사업자 고객님 각각의 예산과 설치 환경에 맞춘 전문 상담을 제공합니다."
            />
            <div className="mt-8 sm:mt-10 grid gap-5 lg:grid-cols-2">
              {[
                {
                  dark: false,
                  eyebrow: "FOR HOME · B2C",
                  title: "가정용 중고가전 쇼룸",
                  desc: "이사, 신혼살림, 원룸·오피스텔, 자취방에 필요한 가전을 고압 세척과 검수를 마친 상태로 합리적인 가격에 준비하세요.",
                  items: [
                    "스탠드·벽걸이 에어컨",
                    "양문형·4도어 냉장고",
                    "스탠드·뚜껑형 김치냉장고",
                    "드럼·통돌이 세탁기",
                    "의류건조기·워시타워",
                    "전자레인지·소형가전",
                  ],
                  href: "/gallery?category=냉장고",
                  cta: "가정용 판매 제품 보기",
                  inquiryMode: "구매 문의" as InquiryTypeValue,
                  inquiryCta: "가정용 구매 상담",
                  img: "/images/home-bg.png",
                },
                {
                  dark: true,
                  eyebrow: "FOR BUSINESS · B2B",
                  title: "업소용 · 상업용 냉장·주방 장비",
                  desc: "식당·카페·프랜차이즈 창업 패키지 도입부터 매장 확장, 폐업·업종변경 일괄 정리까지 세금계산서 발행과 함께 원스톱으로 지원합니다.",
                  items: [
                    "25·30·45박스 업소용 냉장고",
                    "테이블·반찬 냉장고",
                    "음료·주류 쇼케이스",
                    "업소용 제빙기·식기세척기",
                    "중대형 냉난방기",
                    "스텐 작업대·상업용 주방기기",
                  ],
                  href: galleryHref(G.biz),
                  cta: "업소용 설비 매물 보기",
                  inquiryMode: "대량·업소용 상담" as InquiryTypeValue,
                  inquiryCta: "창업·폐업 대량 상담",
                  img: "/images/biz-bg.png",
                },
              ].map((b) => (
                <div
                  key={b.title}
                  className={`group flex flex-col overflow-hidden rounded-md border transition-colors ${
                    b.dark
                      ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                      : "border-[#E4E0D8] bg-[#FAF9F7] text-[#0E1A2B]"
                  }`}
                >
                  <Link
                    href={b.href}
                    className="relative aspect-[2/1] overflow-hidden bg-[#EFECE6] block"
                  >
                    <SafeImg
                      src={b.img}
                      alt={`${b.title} 쇼룸 이미지`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span
                      className={`absolute left-4 top-4 rounded-sm px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${
                        b.dark
                          ? "bg-[#D9531E] text-white"
                          : "bg-white/95 text-[#0E1A2B]"
                      }`}
                    >
                      {b.eyebrow}
                    </span>
                  </Link>
                  <div className="flex flex-1 flex-col p-5 sm:p-7">
                    <h3 className="text-[20px] font-bold sm:text-[24px]">
                      {b.title}
                    </h3>
                    <p
                      className={`mt-2 text-[13.5px] sm:text-[14.5px] leading-relaxed ${
                        b.dark ? "text-white/75" : "text-[#4B5260]"
                      }`}
                    >
                      {b.desc}
                    </p>
                    <ul
                      className={`mt-5 grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-4 text-[13px] font-medium ${
                        b.dark
                          ? "border-white/15 text-white/85"
                          : "border-[#E4E0D8] text-[#1F2530]"
                      }`}
                    >
                      {b.items.map((it) => (
                        <li key={it} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#D9531E] shrink-0" />
                          <span className="truncate">{it}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-6 flex flex-wrap items-center gap-2.5">
                      <Link
                        href={b.href}
                        className={`hb-btn h-10 px-4 text-[13px] ${
                          b.dark
                            ? "bg-[#D9531E] text-white hover:bg-[#BF4715]"
                            : "bg-[#0E1A2B] text-white hover:bg-[#1C2D47]"
                        }`}
                      >
                        <span>{b.cta}</span>
                        <Icon d={ICON.arrow} className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openInquiry(b.inquiryMode)}
                        className={`hb-btn h-10 px-4 text-[13px] ${
                          b.dark
                            ? "border border-white/25 bg-white/10 text-white hover:bg-white/20"
                            : "border border-[#DDD9D1] bg-white text-[#0E1A2B] hover:border-[#0E1A2B]"
                        }`}
                      >
                        <span>{b.inquiryCta}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑦ 왜 한밭중고전자인가 (아키텍처 스펙 매트릭스 레이아웃) */}
        <section
          className="border-b border-[#E4E0D8] bg-[#F6F5F2] py-14 sm:py-20"
          aria-labelledby="usp-title"
        >
          <div className="hb-container grid gap-10 lg:grid-cols-12 lg:gap-14 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <SectionHeading
                eyebrow="Quality & Service Standard"
                title={
                  <span id="usp-title">
                    중고라서 불안한 부분,
                    <br />
                    먼저 확인하고 보냅니다.
                  </span>
                }
                desc="판매부터 매입, 배송과 설치까지 한밭중고전자가 1995년부터 직접 책임지는 5대 운영 원칙입니다."
              />

              <div className="mt-6 rounded-md border border-[#E4E0D8] bg-white p-5">
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#D9531E]">
                  Direct Inspection Guarantee
                </p>
                <p className="mt-1.5 text-[14.5px] font-bold text-[#0E1A2B]">
                  전 품목 입고 즉시 3단계 작동·위생 검수 진행
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#4B5260]">
                  냉매 압력·콤프레샤 작동·온도 편차·누수 테스트를 통과하고 고압 세척을 마친 제품만 매장 쇼룸과 홈페이지에 등록합니다.
                </p>
              </div>
            </div>

            <ol className="lg:col-span-7 border-t border-[#DDD9D1] bg-white rounded-md border border-[#E4E0D8] divide-y divide-[#EEEBE5] overflow-hidden">
              {USP.map((u, i) => (
                <li
                  key={u.t}
                  className="grid grid-cols-[42px_1fr] gap-x-3 p-5 sm:grid-cols-[56px_190px_1fr] sm:gap-x-5 sm:p-6 hover:bg-[#FAF9F7] transition-colors"
                >
                  <span className="text-[15px] font-bold tabular-nums text-[#D9531E] sm:text-[16px]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[15.5px] font-bold text-[#0E1A2B] sm:text-[16.5px]">
                      {u.t}
                    </h3>
                    <span className="mt-0.5 block text-[10.5px] font-bold tracking-wider text-[#8A8478]">
                      {u.tag}
                    </span>
                  </div>
                  <p className="col-start-2 mt-2 text-[13.5px] sm:text-[14px] leading-relaxed text-[#4B5260] sm:col-start-3 sm:mt-0">
                    {u.d}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ⑧ 배송·설치 현장 기록 */}
        <section
          id="reviews-section"
          className="border-b border-[#E4E0D8] bg-white py-14 sm:py-20"
          aria-labelledby="review-title"
        >
          <div className="hb-container">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="Delivery & Installation Archive"
                title={<span id="review-title">배송 · 설치 현장 기록</span>}
                desc="가정집부터 식당·카페·사무실까지, 한밭중고전자가 직접 배송하고 설치한 실제 현장 사진입니다."
              />
              <div className="flex items-center gap-3">
                {reviews.length > 0 && (
                  <span className="rounded-md border border-[#E4E0D8] bg-[#FAF9F7] px-3 py-1.5 text-[13px] font-semibold text-[#4B5260] tabular-nums">
                    누적 현장 기록{" "}
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
              <div className="mt-8 grid grid-cols-2 gap-3.5 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] animate-pulse rounded-md bg-[#E9E6E0]"
                  />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="mt-8 flex flex-col items-start gap-4 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[15.5px] font-bold text-[#0E1A2B]">
                    현장 사진을 정리하고 있습니다.
                  </p>
                  <p className="mt-1 text-[13.5px] text-[#4B5260]">
                    배송·설치 사례가 궁금하시면 카카오톡으로 편하게 물어보세요.
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
                        className="group relative overflow-hidden rounded-md border border-[#E4E0D8] bg-[#FAF9F7] hover:border-[#0E1A2B] transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => setLightbox({ review: r, index: 0 })}
                          className="relative block aspect-[4/3] w-full overflow-hidden bg-[#EFECE6]"
                          aria-label={`${r.title ?? "배송·설치"} 사진 크게 보기`}
                        >
                          <SafeImg
                            src={imgs[0]}
                            alt={`${r.title ?? "배송·설치"} 현장 사진`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                          <span className="absolute left-2.5 bottom-2.5 rounded-sm bg-[#0E1A2B]/85 px-2 py-0.5 text-[10.5px] font-bold text-white">
                            직영 배송·설치
                          </span>
                          {imgs.length > 1 && (
                            <span className="absolute right-2.5 top-2.5 rounded-sm bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums">
                              +{imgs.length - 1}장 더보기
                            </span>
                          )}
                        </button>
                        <div className="flex items-center justify-between gap-2 bg-white px-4 py-3.5">
                          <p className="line-clamp-1 text-[14px] font-bold text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors">
                            {r.title || "배송 및 설치 완료"}
                          </p>
                          <span className="shrink-0 text-[12px] text-[#8A8478] tabular-nums">
                            {shortDate(r.created_at)}
                          </span>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r.id)}
                            className="absolute left-2.5 top-2.5 rounded-sm bg-white/95 px-2 py-1 text-[11px] font-bold text-red-600 shadow"
                          >
                            삭제
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {reviews.length > 6 && (
                  <div className="mt-7 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllReviews((v) => !v)}
                      className="hb-btn-outline h-11 px-7 text-[13.5px]"
                    >
                      {showAllReviews
                        ? "접기"
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
        </section>

        {/* ⑨ 매입 서비스 안내 (다크 네이비 배경 + 4단계 프로세스 + 원본 무손실 매입 안내문 뷰어) */}
        <section
          id="sell-section"
          className="bg-[#0E1A2B] py-14 text-white sm:py-20"
          aria-labelledby="sell-title"
        >
          <div className="hb-container grid gap-10 lg:grid-cols-12 lg:gap-14 items-start">
            <div className="lg:col-span-5">
              <SectionHeading
                dark
                eyebrow="Appliance Buyback Service"
                title={
                  <span id="sell-title">
                    쓰지 않는 가전·주방설비,
                    <br />
                    사진 한 장으로 견적 받으세요.
                  </span>
                }
                desc="가정용 대형가전부터 식당·카페 업소용 냉장·주방 설비까지 합리적인 시세로 매입합니다. 원하시는 날짜에 방문해 안전하게 수거하고 즉시 현금 정산해 드립니다."
              />
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {SELL_CASES.map((s) => (
                  <li
                    key={s}
                    className="rounded-sm border border-white/20 bg-white/[0.04] px-2.5 py-1 text-[12.5px] font-medium text-white/90"
                  >
                    #{s}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openInquiry("내 물건 팔기")}
                  className="hb-btn-accent h-12 px-5 text-[14.5px]"
                >
                  <span>온라인 매입 견적 신청</span>
                  <Icon d={ICON.arrow} className="h-4 w-4" />
                </button>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-12 px-5 text-[14.5px]"
                >
                  <Icon d={ICON.chat} className="h-4 w-4" />
                  <span>카톡으로 사진 보내기</span>
                </a>
              </div>

              <div className="mt-4">
                <Link
                  href="/purchase"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/75 hover:text-[#FF8A50] underline underline-offset-4"
                >
                  <span>매입 전용 안내 페이지 자세히 보기</span>
                  <Icon d={ICON.right} className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="text-[12.5px] font-bold uppercase tracking-wider text-[#FF8A50]">
                  매입 진행 4단계 프로세스
                </h3>
                <ol className="mt-3 border-t border-white/15">
                  {SELL_STEPS.map((s, i) => (
                    <li
                      key={s.t}
                      className="grid grid-cols-[44px_1fr] gap-x-4 border-b border-white/15 py-4 sm:grid-cols-[56px_1fr] sm:py-5"
                    >
                      <span className="text-[22px] font-bold leading-none tabular-nums text-[#FF8A50]">
                        0{i + 1}
                      </span>
                      <div>
                        <p className="text-[16px] font-bold sm:text-[17px]">
                          {s.t}
                        </p>
                        <p className="mt-1 text-[13.5px] leading-relaxed text-white/75">
                          {s.d}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 매입 안내문 원본 비율 프리뷰 및 확대 모달 트리거 */}
              <div className="rounded-md border border-white/15 bg-white/[0.04] p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="inline-block rounded-sm bg-[#D9531E]/25 px-2 py-0.5 text-[11px] font-bold text-[#FF8A50]">
                      필독 가이드
                    </span>
                    <h4 className="mt-1 text-[15px] font-bold text-white">
                      매입 신청 전 사진 촬영 및 확인 사항 안내문
                    </h4>
                    <p className="mt-0.5 text-[12.5px] text-white/70">
                      전면 사진 · 모델명/제조년월 스티커 · 특이사항 확인 방법을 한눈에 확인하세요.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuideModalOpen(true)}
                    className="hb-btn border border-white/25 bg-white/10 px-3.5 h-9 text-[12.5px] text-white hover:bg-white hover:text-[#0E1A2B] shrink-0 self-start sm:self-center"
                  >
                    <Icon d={ICON.search} className="w-3.5 h-3.5" />
                    <span>안내문 크게 보기</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setGuideModalOpen(true)}
                  className="mt-3.5 block w-full overflow-hidden rounded border border-white/15 bg-white p-2 hover:border-[#FF8A50] transition-colors"
                  aria-label="제품 매입 안내문 원본 비율로 크게 보기"
                >
                  <SafeImg
                    src="/매입 안내문.png"
                    alt="제품 매입 시 고객 안내문: 1. 전면 사진, 2. 모델명 및 제조년월 확인, 3. 특이사항 안내, 4. 매입 시 유의할 점"
                    className="max-h-[210px] w-full object-contain mx-auto"
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ⑩ FAQ (외곽 카드 테두리를 제거하고 상하 헤어라인으로 정돈) */}
        <section
          id="faq-section"
          className="border-b border-[#E4E0D8] bg-[#F6F5F2] py-14 sm:py-20"
          aria-labelledby="faq-title"
        >
          <div className="hb-container grid gap-8 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionHeading
                eyebrow="FAQ"
                title={<span id="faq-title">자주 묻는 질문</span>}
              />
              <p className="mt-4 text-[14px] leading-relaxed text-[#4B5260]">
                추가 문의는 대표전화{" "}
                <a
                  href={telHref(STORE.tel)}
                  className="font-bold text-[#0E1A2B] underline tabular-nums"
                >
                  {STORE.tel}
                </a>{" "}
                또는{" "}
                <a
                  href={telHref(STORE.mobile)}
                  className="font-bold text-[#0E1A2B] underline tabular-nums"
                >
                  {STORE.mobile}
                </a>
                로 연락해 주세요.
              </p>
            </div>
            <div className="divide-y divide-[#DDD9D1] border-y border-[#DDD9D1] lg:col-span-8">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={f.q}>
                    <h3>
                      <button
                        type="button"
                        id={`faq-q-${i}`}
                        aria-expanded={open}
                        aria-controls={`faq-a-${i}`}
                        onClick={() => setOpenFaq(open ? null : i)}
                        className="flex w-full items-start justify-between gap-4 sm:gap-6 py-5 text-left"
                      >
                        <span className="flex gap-2.5 sm:gap-3 text-[14.5px] font-bold leading-snug text-[#0E1A2B] sm:text-[16px]">
                          <span className="text-[#D9531E] shrink-0">Q.</span>
                          <span>{f.q}</span>
                        </span>
                        <span
                          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#DDD9D1] text-[#0E1A2B] transition-transform ${
                            open ? "rotate-45 bg-[#0E1A2B] text-white" : "bg-white"
                          }`}
                        >
                          <Icon d={ICON.plus} className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </h3>
                    {open && (
                      <div
                        id={`faq-a-${i}`}
                        role="region"
                        aria-labelledby={`faq-q-${i}`}
                        className="pb-5 pl-6 sm:pl-7 pr-2 sm:pr-4 text-[13.5px] sm:text-[14px] leading-[1.75] text-[#4B5260]"
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

        {/* ⑪ 오시는 길 (방문 정보 중심의 스플릿 레이아웃 + 주소 복사 + 매장 외관 실사) */}
        <section
          id="location-section"
          className="border-b border-[#E4E0D8] bg-white py-14 sm:py-20"
          aria-labelledby="location-title"
        >
          <div className="hb-container">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Showroom Location"
                title={<span id="location-title">오프라인 매장 오시는 길</span>}
                desc={`${STORE.address} (${STORE.addressNote}) · 매장 앞 방문 주차 가능`}
              />
              <button
                type="button"
                onClick={handleCopyAddress}
                className="hb-btn-outline h-10 px-4 text-[13px] self-start sm:self-end shrink-0"
              >
                <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#D9531E]" />
                <span>도로명 주소 복사</span>
              </button>
            </div>

            <div className="mt-8 grid overflow-hidden rounded-md border border-[#E4E0D8] lg:grid-cols-12 shadow-card">
              <div className="relative h-[300px] sm:h-[380px] lg:col-span-7 lg:h-auto lg:min-h-[440px] bg-[#EFECE6]">
                <iframe
                  title="한밭중고전자 매장 위치 지도"
                  src="https://maps.google.com/maps?q=%EB%8C%80%EC%A0%84+%EC%A4%91%EA%B5%AC+%EC%A4%91%EC%B4%8C%EB%8F%99+144&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen
                />
              </div>

              <div className="bg-[#0E1A2B] text-white p-5 sm:p-8 lg:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div>
                      <p className="text-[#FF8A50] font-bold text-[11px] tracking-widest uppercase">
                        Showroom Info
                      </p>
                      <h3 className="text-[21px] sm:text-[23px] font-bold tracking-tight mt-0.5">
                        {STORE.name}
                      </h3>
                    </div>
                    <span className="rounded bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/90">
                      실물 확인 가능
                    </span>
                  </div>

                  {/* 매장 외관 사진 프리뷰 */}
                  <div className="mb-5 overflow-hidden rounded border border-white/15 bg-[#09121E]">
                    <div className="aspect-[16/8] w-full overflow-hidden">
                      <SafeImg
                        src="/main-bg2.png"
                        alt="대전 중구 유천로 13 한밭중고전자 매장 외관"
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  </div>

                  <ul className="flex flex-col gap-3.5 text-[13.5px] sm:text-[14px]">
                    <li className="pb-3.5 border-b border-white/10">
                      <p className="text-[11.5px] text-white/60 font-semibold mb-1">
                        전화 상담 문의
                      </p>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
                        <a
                          href={telHref(STORE.tel)}
                          className="text-[20px] sm:text-[22px] font-bold hover:text-[#FF8A50]"
                        >
                          {STORE.tel}
                        </a>
                        <a
                          href={telHref(STORE.mobile)}
                          className="text-[14.5px] text-white/80 hover:text-[#FF8A50]"
                        >
                          ({STORE.mobile})
                        </a>
                      </div>
                    </li>
                    <li className="pb-3.5 border-b border-white/10">
                      <p className="text-[11.5px] text-white/60 font-semibold mb-1">
                        매장 주소
                      </p>
                      <p className="leading-snug font-semibold">
                        {STORE.address}
                      </p>
                      <p className="text-[12px] text-white/65 mt-0.5">
                        {STORE.addressNote} · {STORE.parking}
                      </p>
                    </li>
                    <li>
                      <p className="text-[11.5px] text-white/60 font-semibold mb-1">
                        영업시간 안내
                      </p>
                      <p className="font-semibold">{STORE.hours}</p>
                      <p className="text-[12px] text-[#FF8A50] mt-0.5">
                        ※ {STORE.closed}
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-2.5">
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

        {/* ⑫ 통합 문의 섹션 */}
        <section
          id="inquiry-section"
          className="py-14 sm:py-20 bg-[#F6F5F2]"
          aria-labelledby="cta-title"
        >
          <div className="hb-container">
            <SectionHeading
              eyebrow="Online Consultation Desk"
              title={<span id="cta-title">판매 · 매입 통합 상담 신청</span>}
              desc="찾으시는 가전·설비 재고 문의부터 방문 매입 견적 신청까지 남겨주시면 담당자가 빠르게 확인 후 연락드립니다."
            />

            <div className="mt-8 grid gap-8 lg:grid-cols-12 items-start">
              <div
                id="inquiry-form"
                className="rounded-md border border-[#E4E0D8] bg-white p-4 xs:p-5 sm:p-8 lg:col-span-7 shadow-card"
              >
                <UnifiedInquiryForm
                  defaultType={inquiryType}
                  linkedProduct={linkedProduct}
                  onSuccess={() => loadRecent()}
                />
              </div>

              <aside className="flex flex-col gap-5 lg:col-span-5">
                <div className="rounded-md bg-[#0E1A2B] p-5 text-white sm:p-7">
                  <span className="inline-block rounded-sm bg-[#D9531E] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white">
                    Direct Call
                  </span>
                  <h3 className="mt-2 text-[14px] font-semibold text-white/75">
                    급하신 용무는 전화·카톡으로 바로 문의하세요
                  </h3>
                  <a
                    href={telHref(STORE.tel)}
                    className="mt-2 block text-[25px] font-bold tracking-tight sm:text-[28px] hover:text-[#FF8A50] tabular-nums"
                  >
                    {STORE.tel}
                  </a>
                  <a
                    href={telHref(STORE.mobile)}
                    className="mt-0.5 block text-[15.5px] font-semibold text-white/85 hover:text-[#FF8A50] tabular-nums"
                  >
                    직통 휴대전화: {STORE.mobile}
                  </a>
                  <div className="mt-4 grid grid-cols-2 gap-2">
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
                  <p className="mt-4 border-t border-white/15 pt-3.5 text-[12.5px] text-white/70">
                    {STORE.hours} · {STORE.closed}
                  </p>
                </div>

                <div className="rounded-md border border-[#E4E0D8] bg-white p-5 sm:p-7">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EEEBE5]">
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
                    <p className="mt-4 text-[13.5px] text-[#8A8478]">
                      최근 접수된 문의 내역이 없습니다.
                    </p>
                  ) : (
                    <ul className="mt-2 divide-y divide-[#EEEBE5]">
                      {recent.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center gap-2.5 py-3 text-[13px] sm:text-[13.5px]"
                        >
                          <span className="shrink-0 rounded-sm bg-[#F2F0EC] px-2 py-0.5 text-[11px] font-bold text-[#0E1A2B]">
                            {getInquiryTypeLabel(r.inquiry_type)}
                          </span>
                          <Link
                            href="/inquiry"
                            className="min-w-0 flex-1 truncate font-medium text-[#1F2530] hover:text-[#D9531E]"
                          >
                            {r.category || "상담 문의"}
                          </Link>
                          <span className="shrink-0 text-[11.5px] text-[#8A8478]">
                            {r.masked_name || maskName(r.name)} ·{" "}
                            <strong className="text-[#0E1A2B]">
                              {r.status ?? "접수"}
                            </strong>
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

        {/* 데스크톱 전용 슬림 퀵바 */}
        <aside
          aria-label="빠른 바로가기"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col bg-white shadow-[0_8px_28px_rgba(14,26,43,0.12)] border-y border-l border-[#DDD9D1] rounded-l-lg overflow-hidden w-[78px]"
        >
          <div className="bg-[#0E1A2B] text-white text-[10.5px] font-bold py-2 text-center tracking-widest">
            QUICK
          </div>
          <div className="flex flex-col divide-y divide-[#EEEBE5]">
            <Link
              href="/gallery"
              className="flex flex-col items-center justify-center py-3 px-1 hover:bg-[#FAF9F7] transition-colors"
            >
              <span className="text-[11.5px] font-bold text-[#1F2530]">
                제품 보기
              </span>
            </Link>
            <Link
              href="/purchase"
              className="flex flex-col items-center justify-center py-3 px-1 hover:bg-[#FAF9F7] transition-colors"
            >
              <span className="text-[11.5px] font-bold text-[#D9531E]">
                매입 신청
              </span>
            </Link>
            <a
              href="#location-section"
              className="flex flex-col items-center justify-center py-3 px-1 hover:bg-[#FAF9F7] transition-colors"
            >
              <span className="text-[11.5px] font-bold text-[#1F2530]">
                오시는 길
              </span>
            </a>
            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", { location: "quick_bar" })
              }
              className="flex flex-col items-center justify-center py-3 px-1 hover:bg-[#FAF9F7] transition-colors"
            >
              <span className="text-[11.5px] font-bold text-[#1F2530]">
                전화문의
              </span>
            </a>
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("click_kakao_consult", { location: "quick_bar" })
              }
              className="flex flex-col items-center justify-center py-3 px-1 bg-[#FEE500] hover:bg-[#F2D900] transition-colors"
            >
              <span className="text-[11.5px] font-bold text-[#191600]">
                카톡상담
              </span>
            </a>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="bg-[#FAF9F7] text-[#0E1A2B] py-2.5 text-[11px] font-bold tracking-wider hover:bg-[#EFECE6]"
            >
              TOP ↑
            </button>
          </div>
        </aside>
      </main>

      {/* ⑬ 공통 푸터 및 단일 모바일 하단 CTA 바 */}
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
          <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg border border-[#E4E0D8] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E4E0D8] bg-[#0E1A2B] px-5 py-3.5 text-white">
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
                className="mx-auto max-h-[72vh] w-auto max-w-full object-contain rounded border border-[#E4E0D8] bg-white"
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#E4E0D8] bg-white px-5 py-3.5">
              <span className="text-[12.5px] text-[#4B5260] hidden sm:inline">
                안내문에 맞춰 사진을 보내주시면 정확한 견적 안내가 가능합니다.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setGuideModalOpen(false);
                    openInquiry("내 물건 팔기");
                  }}
                  className="hb-btn-accent h-10 px-4 text-[13px]"
                >
                  바로 매입 견적 신청하기
                </button>
                <button
                  type="button"
                  onClick={() => setGuideModalOpen(false)}
                  className="hb-btn-outline h-10 px-4 text-[13px]"
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
          <div className="relative flex w-full flex-col rounded-lg bg-[#0B1522] p-4 sm:p-5 text-white shadow-2xl border border-white/15">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF8A50]">
                  Delivery &amp; Installation Record
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
            <div className="relative flex items-center justify-center bg-[#060C14] rounded p-2">
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
            className="w-full rounded-lg bg-white p-6 sm:p-8 shadow-2xl border border-[#E4E0D8]"
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
            className="w-full rounded-lg bg-white p-6 sm:p-8 shadow-2xl border border-[#E4E0D8]"
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
                  className="relative aspect-square overflow-hidden rounded bg-[#EFECE6]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`선택 사진 ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
              {reviewFiles.length < MAX_REVIEW_PHOTOS && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded border border-dashed border-[#CFCAC0] text-[#8A8478]">
                  <Icon d={ICON.plus} />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isAnalyzingReview}
                    className="sr-only"
                    onChange={(e) => {
                      pickReviewFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
            <button
              type="submit"
              disabled={uploadingReview || isAnalyzingReview}
              className="hb-btn-primary mt-6 h-11 w-full text-[14.5px]"
            >
              {uploadingReview ? "업로드 중…" : "등록하기"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
