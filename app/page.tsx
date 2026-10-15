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
   1. 정적 데이터 및 상수
   ════════════════════════════════════════════════════════════ */
const HERO_SLIDES = [
  {
    src: "/main-bg.png",
    label: "대전 중촌동 오프라인 매장 · 가정용·업소용 실매물 상시 전시",
  },
  {
    src: "/main-bg2.png",
    label: "입고 전 품목 분해 세척 및 냉각·작동 정밀 검수 완료",
  },
  {
    src: "/main-bg3.png",
    label: "단품 배송·설치부터 식당·카페 창업 및 폐업 일괄 정리까지",
  },
] as const;

const OPERATING_YEARS = new Date().getFullYear() - STORE.since;

const G = {
  aircon: "에어컨/냉난방기",
  fridge: "냉장고",
  washer: "세탁기/건조기",
  biz: "업소용기기",
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
    desc: "벽걸이 · 스탠드 · 천장형 · 중대형 인버터",
    group: "home" as const,
    gallery: G.aircon,
    image: "/images/cat-ac.png",
  },
  {
    key: "fridge",
    name: "냉장고 · 김치냉장고",
    desc: "양문형 · 4도어 · 일반형 · 스탠드/뚜껑형",
    group: "home" as const,
    gallery: G.fridge,
    image: "/images/cat-fridge.png",
  },
  {
    key: "washer",
    name: "세탁기 · 건조기",
    desc: "드럼 · 통돌이 · 워시타워 · 대용량 건조기",
    group: "home" as const,
    gallery: G.washer,
    image: "/images/cat-washer.png",
  },
  {
    key: "bizfridge",
    name: "업소용 냉장고 · 쇼케이스",
    desc: "25·30·45박스 수직형 · 테이블 · 음료/주류",
    group: "biz" as const,
    gallery: G.biz,
    image: "/images/cat-commercial.png",
  },
  {
    key: "kitchen",
    name: "제빙기 · 식기세척기 · 주방기기",
    desc: "카페 · 식당 · 주점 · 스텐 작업대 · 조리기기",
    group: "biz" as const,
    gallery: G.biz,
    image: "/images/cat-kitchen.png",
  },
] as const;

const USP = [
  {
    t: "세척·정비 후 판매",
    d: "입고된 모든 제품은 내·외부 세척과 작동 점검을 마친 뒤 출고합니다.",
  },
  {
    t: "명확한 무상 A/S 보증",
    d: "에어컨·냉난방기 8개월, 그 외 제품 4개월 무상 A/S를 보장합니다(계약 내용에 따라 상이할 수 있음).",
  },
  {
    t: "구매와 매입을 한 곳에서",
    d: "필요한 가전 구매와 기존 사용하던 가전·설비 처분을 한 번에 상담해 드립니다.",
  },
  {
    t: "전국 단위 배송·설치",
    d: "대전·충청권은 물론 구미·포항·창원·부산·거제 등 전국 거래 사례를 보유하고 있습니다.",
  },
  {
    t: "대량 거래 · 세금계산서 발행",
    d: "식당·카페 창업 패키지 도입 및 폐업 정리 등 사업자 거래 시 세금계산서를 투명하게 발행합니다.",
  },
] as const;

const SELL_CASES = ["이사 정리", "식당·카페 폐업", "업종 변경", "매장 리모델링", "대량 일괄 처분"] as const;
const SELL_STEPS = [
  {
    t: "사진 · 기본 정보 접수",
    d: "온라인 문의 폼이나 카카오톡으로 제품 외관 사진과 모델명을 보내주세요.",
  },
  {
    t: "사전 매입 견적 안내",
    d: "보내주신 사진과 연식·상태를 확인하여 합리적인 매입 견적을 안내합니다.",
  },
  {
    t: "약속 일정 방문 · 수거",
    d: "원하시는 날짜에 기사님이 직접 방문해 상태를 확인하고 안전하게 반출합니다.",
  },
  {
    t: "현장 즉시 대금 입금",
    d: "수거 작업이 끝나는 즉시 지정하신 계좌로 매입 대금 전액을 입금합니다.",
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
    a: `영업시간은 ${STORE.hours} (${STORE.closed})이며, 오프라인 매장은 ${STORE.address} (${STORE.addressNote})에 위치해 있습니다.`,
  },
] as const;

const shortDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
        d.getDate()
      ).padStart(2, "0")}`;
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

  /* 통합 문의 폼 연동 상태 */
  const [inquiryType, setInquiryType] = useState<InquiryTypeValue>("구매 문의");
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
    loadFeaturedProducts();
    loadReviews();
    loadRecent();
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
    <div className="min-h-screen flex flex-col bg-[#F6F5F2] text-[#1F2530]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ① 상단 공통 헤더 */}
      <SiteHeader>
        <button
          type="button"
          onClick={() => openInquiry("구매 문의")}
          className="hb-btn-primary h-10 px-4 text-[13px] whitespace-nowrap"
        >
          문의하기
        </button>
      </SiteHeader>

      <main className="flex-1">
        {/* ② HERO 섹션 (텍스트와 실물 매장 이미지가 서로 경쟁하지 않는 2단 에디토리얼 쇼룸 구조) */}
        <section
          aria-labelledby="hero-title"
          className="relative w-full bg-[#0E1A2B] text-white border-b border-[#1C2B40] overflow-hidden"
        >
          <div className="hb-container py-10 sm:py-14 lg:py-16">
            <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
              {/* 좌측: 브랜드 정체성·핵심 품목·행동 버튼 */}
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-bold tracking-wide text-white/90">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#D9531E]"
                    aria-hidden="true"
                  />
                  <span>SINCE {STORE.since} · 대전 중촌동 오프라인 매장 직접 운영</span>
                </div>

                <h1
                  id="hero-title"
                  className="mt-4 font-bold tracking-[-0.03em] text-white"
                >
                  <span className="block text-[14px] sm:text-[15px] font-bold text-[#FF8A50]">
                    가정용 중고가전 · 업소용 냉장 및 주방설비 전문 {STORE.name}
                  </span>
                  <span className="mt-2.5 block text-[30px] leading-[1.22] sm:text-[40px] lg:text-[44px] lg:leading-[1.18] break-keep">
                    검수를 마친 실매물 가전,
                    <br />
                    판매부터 방문 매입까지 한곳에서.
                  </span>
                </h1>

                <p className="mt-4 max-w-[520px] text-[15px] leading-[1.7] text-white/80 sm:text-[16px] break-keep">
                  {STORE.since}년부터 냉장고·세탁기·에어컨·냉난방기와 식당·카페용 45박스 냉장고·제빙기·쇼케이스를 직접 세척·정비하여 공급합니다. 단품 구매부터 폐업·이전 대량 매입까지 투명하게 상담해 드립니다.
                </p>

                {/* 핵심 전환 버튼 */}
                <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[430px]">
                  <Link
                    href="/gallery"
                    className="hb-btn-accent h-[50px] text-[15px] shadow-lg"
                  >
                    <span>판매 제품 갤러리 보기</span>
                    <Icon d={ICON.arrow} className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("begin_buyback_inquiry", {
                        location: "hero_cta",
                      });
                      openInquiry("내 물건 팔기");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-md font-bold border border-white/35 bg-white/10 text-white hover:bg-white/20 h-[50px] text-[15px] transition-colors"
                  >
                    <span>무료 매입 견적 신청</span>
                  </button>
                </div>

                {/* 직통 전화 및 영업시간 요약 바 */}
                <div className="mt-7 pt-5 border-t border-white/15 flex flex-wrap items-center gap-y-2 gap-x-5 text-[13px] sm:text-[13.5px] text-white/80">
                  <div className="flex items-center gap-2">
                    <Icon d={ICON.phone} className="h-4 w-4 text-[#FF8A50]" />
                    <span>직통 상담</span>
                    <a
                      href={telHref(STORE.tel)}
                      onClick={() =>
                        trackEvent("click_tel_consult", { location: "hero_bar" })
                      }
                      className="font-bold text-white hover:text-[#FF8A50] underline underline-offset-4 text-[14.5px]"
                    >
                      {STORE.tel}
                    </a>
                  </div>
                  <span className="hidden sm:inline text-white/25">|</span>
                  <div className="flex items-center gap-1.5 text-white/75">
                    <Icon d={ICON.clock} className="h-3.5 w-3.5 text-white/50" />
                    <span>
                      {STORE.hours} ({STORE.closed})
                    </span>
                  </div>
                </div>
              </div>

              {/* 우측: 대형 가전·매장 실물 사진의 존재감을 살리는 쇼룸 프레임 */}
              <div className="lg:col-span-6">
                <div className="overflow-hidden rounded-md border border-white/15 bg-[#132238] shadow-2xl">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#09121E]">
                    {HERO_SLIDES.map((slide, i) => (
                      <div
                        key={slide.src}
                        className={`absolute inset-0 transition-opacity duration-500 ${
                          heroIdx === i ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                      >
                        <SafeImg
                          src={slide.src}
                          alt={slide.label}
                          eager={i === 0}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                    ))}
                    <span className="absolute left-3.5 top-3.5 z-20 rounded-sm bg-[#0E1A2B]/85 border border-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                      매장 실물 쇼룸 {heroIdx + 1} / {HERO_SLIDES.length}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101D30] px-4 py-3 border-t border-white/10">
                    <p className="text-[12.5px] sm:text-[13px] font-medium text-white/85 truncate">
                      {HERO_SLIDES[heroIdx].label}
                    </p>
                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      role="tablist"
                      aria-label="매장 사진 전환"
                    >
                      {HERO_SLIDES.map((s, i) => (
                        <button
                          key={s.src}
                          type="button"
                          role="tab"
                          aria-selected={heroIdx === i}
                          aria-label={`${i + 1}번째 매장 사진 보기`}
                          onClick={() => setHeroIdx(i)}
                          className={`h-7 px-2.5 rounded text-[11.5px] font-bold transition-colors ${
                            heroIdx === i
                              ? "bg-[#D9531E] text-white"
                              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                          }`}
                        >
                          0{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ③ 신뢰 지표 스트립 (사실 기반 핵심 수치 및 운영 기준) */}
        <div className="border-b border-[#E4E0D8] bg-[#FAF9F7]">
          <dl className="hb-container grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E0D8]">
            {[
              {
                k: `SINCE ${STORE.since}`,
                v: `대전 중촌동 ${OPERATING_YEARS}년차 매장 운영`,
              },
              {
                k: "실매물 직접 확인",
                v: "세척·정비 완료 제품 상시 전시",
              },
              {
                k: "무상 A/S 보증",
                v: "냉난방기 8개월 · 일반가전 4개월",
              },
              {
                k: "세금계산서 발행",
                v: "창업·폐업 대량 거래 투명 증빙",
              },
            ].map((s, i) => (
              <div
                key={s.k}
                className={`py-4 sm:py-5 ${
                  i === 0 ? "pr-4 sm:pr-6" : " sm:px-6"
                } ${i % 2 === 1 ? "pl-4" : ""}`}
              >
                <dt className="text-[15px] font-bold tracking-[-0.01em] text-[#0E1A2B] sm:text-[16.5px]">
                  {s.k}
                </dt>
                <dd className="mt-0.5 text-[12.5px] text-[#4B5260] sm:text-[13px]">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ④ 실시간 판매 중인 추천 매물 섹션 (상품 탐색 중심) */}
        <FeaturedProductsSection
          products={featuredProducts}
          loading={productsLoading}
          error={productsError}
          onRetry={loadFeaturedProducts}
          onInquireProduct={(productTitle) =>
            openInquiry("구매 문의", `[상품문의] ${productTitle}`)
          }
        />

        {/* ⑤ 품목별 카테고리 탐색 (이미지 인덱스 중심) */}
        <section
          id="category-section"
          className="border-b border-[#E4E0D8] bg-[#F6F5F2] py-14 sm:py-20"
          aria-labelledby="cat-title"
        >
          <div className="hb-container">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading
                eyebrow="Product Categories"
                title={<span id="cat-title">취급 품목별 실매물 찾기</span>}
                desc="가정용 필수가전부터 식당·카페용 주방설비까지 원하는 품목을 선택해 재고를 확인하세요."
              />
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="inline-flex rounded-md border border-[#DDD9D1] bg-white p-1"
                  role="tablist"
                  aria-label="카테고리 구분"
                >
                  {(
                    [
                      { k: "all", l: "전체 품목" },
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
                      className={`h-9 rounded px-4 text-[13.5px] font-bold transition-colors ${
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
                  className="hidden items-center gap-1.5 text-[13.5px] font-bold text-[#0E1A2B] underline-offset-4 hover:underline sm:inline-flex"
                >
                  전체 갤러리 <Icon d={ICON.arrow} className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
              {visibleCats.map((c) => (
                <li key={c.key} className="flex">
                  <Link
                    href={galleryHref(c.gallery)}
                    className="group flex w-full flex-col overflow-hidden rounded-md border border-[#E4E0D8] bg-white transition-all duration-200 hover:border-[#0E1A2B]/50 hover:shadow-card"
                    aria-label={`${c.name} 제품 보기`}
                  >
                    <div className="relative aspect-[4/4.4] overflow-hidden bg-[#EFECE6] border-b border-[#EEEBE5]">
                      <SafeImg
                        src={c.image}
                        alt={`중고 ${c.name} 판매 제품`}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                      <span className="absolute left-2.5 top-2.5 rounded-sm bg-[#0E1A2B]/90 px-2 py-0.5 text-[10.5px] font-bold text-white">
                        {c.group === "home" ? "가정용" : "업소용"}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
                      <div>
                        <h3 className="text-[14.5px] font-bold text-[#0E1A2B] group-hover:text-[#D9531E] sm:text-[15.5px]">
                          {c.name}
                        </h3>
                        <p className="mt-1 text-[12px] text-[#6B7280] leading-snug">
                          {c.desc}
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-[#F2F0EC] flex items-center justify-between text-[12px] font-bold text-[#4B5260] group-hover:text-[#0E1A2B]">
                        <span>매물 보기</span>
                        <Icon
                          d={ICON.arrow}
                          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:text-[#D9531E]"
                        />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ⑥ 가정용 vs 업소용 맞춤 안내 (대비형 아키텍처 스플릿 레이아웃) */}
        <section
          className="border-b border-[#E4E0D8] bg-white py-14 sm:py-20"
          aria-labelledby="split-title"
        >
          <div className="hb-container">
            <SectionHeading
              eyebrow="Home & Commercial"
              title={
                <span id="split-title">
                  가정용 단품 구매부터 매장 주방설비 일괄 도입까지
                </span>
              }
              desc="설치하실 공간과 용도에 따라 적합한 제품군을 바로 확인하실 수 있습니다."
            />
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {[
                {
                  dark: false,
                  eyebrow: "For Home & Office",
                  title: "가정용 · 원룸 · 사무실 중고가전",
                  desc: "이사, 신혼, 자취방, 기숙사, 사무실 휴게 공간에 필요한 가전을 합리적인 가격으로 준비하세요.",
                  items: [
                    "스탠드·벽걸이 에어컨",
                    "양문형·일반 냉장고",
                    "스탠드·뚜껑 김치냉장고",
                    "드럼·통돌이 세탁기",
                    "의류건조기",
                  ],
                  href: "/gallery?category=냉장고",
                  cta: "가정용 제품 보러가기",
                  img: "/images/home-bg.png",
                },
                {
                  dark: true,
                  eyebrow: "For Restaurant & Cafe",
                  title: "업소용 냉장 · 상업용 주방설비",
                  desc: "식당·카페·주점 창업과 매장 확장에 필요한 냉장·주방 설비. 복수 품목 구매와 폐업 일괄 매입도 상담합니다.",
                  items: [
                    "25·45박스 업소용 냉장고",
                    "음료·주류 쇼케이스",
                    "업소용 제빙기",
                    "업소용 식기세척기",
                    "중대형 냉난방기",
                    "스텐 작업대·주방기기",
                  ],
                  href: galleryHref(G.biz),
                  cta: "업소용 설비 보러가기",
                  img: "/images/biz-bg.png",
                },
              ].map((b) => (
                <Link
                  key={b.title}
                  href={b.href}
                  className={`group flex flex-col overflow-hidden rounded-md border transition-all ${
                    b.dark
                      ? "border-[#0E1A2B] bg-[#0E1A2B] text-white hover:bg-[#16243B]"
                      : "border-[#E4E0D8] bg-[#FAF9F7] text-[#0E1A2B] hover:border-[#0E1A2B]/50 hover:bg-white"
                  }`}
                >
                  <div className="aspect-[16/7.5] overflow-hidden bg-[#EFECE6]">
                    <SafeImg
                      src={b.img}
                      alt={`${b.title} 판매 제품`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <p
                      className={`text-[11.5px] font-bold uppercase tracking-[0.18em] ${
                        b.dark ? "text-[#FF8A50]" : "text-[#D9531E]"
                      }`}
                    >
                      {b.eyebrow}
                    </p>
                    <h3 className="mt-1.5 text-[20px] font-bold sm:text-[23px]">
                      {b.title}
                    </h3>
                    <p
                      className={`mt-2 text-[14px] leading-relaxed ${
                        b.dark ? "text-white/75" : "text-[#4B5260]"
                      }`}
                    >
                      {b.desc}
                    </p>
                    <ul
                      className={`mt-4 flex flex-wrap gap-1.5 pt-4 border-t ${
                        b.dark ? "border-white/15" : "border-[#E4E0D8]"
                      }`}
                    >
                      {b.items.map((it) => (
                        <li
                          key={it}
                          className={`rounded-sm px-2.5 py-1 text-[12px] font-semibold ${
                            b.dark
                              ? "bg-white/10 text-white/90"
                              : "bg-white border border-[#E4E0D8] text-[#1F2530]"
                          }`}
                        >
                          {it}
                        </li>
                      ))}
                    </ul>
                    <span
                      className={`mt-auto inline-flex items-center gap-1.5 pt-5 text-[14px] font-bold ${
                        b.dark ? "text-[#FF8A50]" : "text-[#0E1A2B] group-hover:text-[#D9531E]"
                      }`}
                    >
                      <span>{b.cta}</span>
                      <Icon
                        d={ICON.arrow}
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ⑦ 왜 한밭중고전자인가 (카드 남용을 피한 정돈된 원장/테이블형 레이아웃) */}
        <section
          className="border-b border-[#E4E0D8] bg-[#F6F5F2] py-14 sm:py-20"
          aria-labelledby="usp-title"
        >
          <div className="hb-container grid gap-8 lg:grid-cols-12 lg:gap-12 items-start">
            <div className="lg:col-span-5">
              <SectionHeading
                eyebrow="Service Standard"
                title={
                  <span id="usp-title">
                    중고라서 불안한 부분,
                    <br />
                    먼저 확인하고 출고합니다.
                  </span>
                }
                desc="입고 검수부터 사후 보증, 방문 매입까지 한밭중고전자가 실제로 지키는 운영 기준입니다."
              />
            </div>

            <ol className="lg:col-span-7 rounded-md border border-[#E4E0D8] bg-white divide-y divide-[#EEEBE5] px-5 sm:px-7">
              {USP.map((u, i) => (
                <li
                  key={u.t}
                  className="grid grid-cols-[32px_1fr] gap-x-3 py-5 sm:grid-cols-[40px_170px_1fr] sm:gap-x-4 sm:py-5 items-baseline"
                >
                  <span className="text-[13px] font-bold tabular-nums text-[#D9531E]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-[15.5px] font-bold text-[#0E1A2B]">
                    {u.t}
                  </h3>
                  <p className="col-start-2 mt-1 text-[14px] leading-relaxed text-[#4B5260] sm:col-start-3 sm:mt-0">
                    {u.d}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ⑧ 매입 서비스 안내 (4단계 절차 타임라인 중심 다크 섹션) */}
        <section
          id="sell-section"
          className="bg-[#0E1A2B] py-14 text-white sm:py-20 border-b border-[#1C2B40]"
          aria-labelledby="sell-title"
        >
          <div className="hb-container grid gap-10 lg:grid-cols-12 lg:gap-14 items-start">
            <div className="lg:col-span-5">
              <SectionHeading
                dark
                eyebrow="Appliance Buyback"
                title={
                  <span id="sell-title">
                    쓰지 않는 가전과 주방설비,
                    <br />
                    사진 한 장으로 견적을 받아보세요.
                  </span>
                }
                desc="가정용 가전부터 식당·카페 폐업 시 나오는 대량 설비까지, 원하시는 날짜에 방문하여 수거하고 현장에서 즉시 입금합니다."
              />
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {SELL_CASES.map((s) => (
                  <li
                    key={s}
                    className="rounded-sm border border-white/20 bg-white/5 px-2.5 py-1 text-[12.5px] font-medium text-white/90"
                  >
                    #{s}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openInquiry("내 물건 팔기")}
                  className="hb-btn-accent h-[50px] px-6 text-[14.5px]"
                >
                  <span>무료 매입 견적 신청</span>
                  <Icon d={ICON.arrow} className="h-4 w-4" />
                </button>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-[50px] px-5 text-[14.5px]"
                >
                  <Icon d={ICON.chat} className="h-4 w-4" />
                  <span>카톡으로 사진 보내기</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {SELL_STEPS.map((s, i) => (
                  <div
                    key={s.t}
                    className="rounded-md border border-white/15 bg-[#142338] p-5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#FF8A50]">
                        STEP 0{i + 1}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                    </div>
                    <div className="mt-3">
                      <p className="text-[16.5px] font-bold text-white">
                        {s.t}
                      </p>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/75">
                        {s.d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ⑨ 배송·설치 현장 기록 */}
        <section
          id="reviews-section"
          className="border-b border-[#E4E0D8] bg-white py-14 sm:py-20"
          aria-labelledby="review-title"
        >
          <div className="hb-container">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-[#EEEBE5]">
              <SectionHeading
                eyebrow="Field Records"
                title={<span id="review-title">배송 · 설치 현장 기록</span>}
                desc="직접 현장에 운반하여 수평 맞춤과 배관·전원 연결까지 완료한 실제 거래 사진입니다."
              />
              <div className="flex items-center gap-3">
                {reviews.length > 0 && (
                  <p className="text-[13.5px] font-semibold text-[#6B7280]">
                    등록된 기록 <strong className="text-[#0E1A2B]">{reviews.length}</strong>건
                  </p>
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
                    className="aspect-[4/3] animate-pulse rounded-md bg-[#EFECE6]"
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
                        className="group relative overflow-hidden rounded-md border border-[#E4E0D8] bg-[#FAF9F7] hover:border-[#0E1A2B]/40 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => setLightbox({ review: r, index: 0 })}
                          className="relative block aspect-[4/3] w-full overflow-hidden bg-[#EFECE6] border-b border-[#EEEBE5]"
                          aria-label={`${r.title ?? "배송·설치"} 사진 크게 보기`}
                        >
                          <SafeImg
                            src={imgs[0]}
                            alt={`${r.title ?? "배송·설치"} 현장 사진`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                          {imgs.length > 1 && (
                            <span className="absolute right-2.5 top-2.5 rounded-sm bg-[#0E1A2B]/75 px-2 py-0.5 text-[10.5px] font-bold text-white">
                              +{imgs.length - 1}장
                            </span>
                          )}
                        </button>
                        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-white">
                          <p className="line-clamp-1 text-[14px] font-bold text-[#0E1A2B]">
                            {r.title || "배송 및 설치 완료"}
                          </p>
                          <span className="shrink-0 text-[12px] text-[#8A8478]">
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

        {/* ⑩ FAQ */}
        <section
          id="faq-section"
          className="border-b border-[#E4E0D8] bg-[#F6F5F2] py-14 sm:py-20"
          aria-labelledby="faq-title"
        >
          <div className="hb-container grid gap-8 lg:grid-cols-12 lg:gap-12 items-start">
            <div className="lg:col-span-4">
              <SectionHeading
                eyebrow="FAQ"
                title={<span id="faq-title">자주 묻는 질문</span>}
                desc="배송 지역, 무상 보증, 매입 정산과 관련하여 자주 문의하시는 사항입니다."
              />
              <p className="mt-4 text-[14px] leading-relaxed text-[#4B5260]">
                추가 문의는 대표전화{" "}
                <a
                  href={telHref(STORE.tel)}
                  className="font-bold text-[#0E1A2B] underline"
                >
                  {STORE.tel}
                </a>{" "}
                또는{" "}
                <a
                  href={telHref(STORE.mobile)}
                  className="font-bold text-[#0E1A2B] underline"
                >
                  {STORE.mobile}
                </a>
                로 연락해 주세요.
              </p>
            </div>
            <div className="divide-y divide-[#E4E0D8] border border-[#E4E0D8] bg-white px-5 sm:px-6 rounded-md lg:col-span-8">
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
                        className="flex w-full items-start justify-between gap-4 py-4 sm:py-5 text-left"
                      >
                        <span className="flex gap-2.5 text-[15px] font-bold leading-snug text-[#0E1A2B] sm:text-[16px]">
                          <span className="text-[#D9531E]">Q.</span>
                          <span>{f.q}</span>
                        </span>
                        <span
                          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#DDD9D1] text-[#0E1A2B] transition-transform ${
                            open ? "rotate-45 bg-[#0E1A2B] text-white" : ""
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
                        className="pb-5 pl-6 pr-4 text-[14px] leading-[1.75] text-[#4B5260]"
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

        {/* ⑪ 오시는 길 (지도와 방문 정보 카드가 겹치지 않고 정돈된 스플릿 뷰) */}
        <section
          id="location-section"
          aria-labelledby="location-title"
          className="border-b border-[#E4E0D8] bg-white py-14 sm:py-20"
        >
          <div className="hb-container">
            <SectionHeading
              eyebrow="Showroom Location"
              title={<span id="location-title">오프라인 매장 방문 안내</span>}
              desc="대전 중구 중촌고가도로 밑 전용 주차장이 마련된 매장에서 실물을 직접 확인하실 수 있습니다."
            />

            <div className="mt-8 grid overflow-hidden rounded-md border border-[#E4E0D8] bg-[#FAF9F7] lg:grid-cols-12">
              <div className="relative h-[320px] sm:h-[400px] lg:col-span-7 lg:h-auto lg:min-h-[440px] bg-[#EFECE6]">
                <iframe
                  title="한밭중고전자 매장 위치 지도"
                  src="https://maps.google.com/maps?q=%EB%8C%80%EC%A0%84+%EC%A4%91%EA%B5%AC+%EC%A4%91%EC%B4%8C%EB%8F%99+144&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen
                />
              </div>

              <div className="flex flex-col justify-between bg-[#0E1A2B] p-6 sm:p-8 lg:col-span-5 text-white">
                <div>
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#FF8A50]">
                    {STORE.name}
                  </span>
                  <h3 className="mt-1.5 text-[22px] font-bold tracking-tight">
                    {STORE.address}
                  </h3>
                  <p className="mt-1 text-[13.5px] text-white/75">
                    {STORE.addressNote} · {STORE.parking}
                  </p>

                  <dl className="mt-6 space-y-4 border-t border-white/15 pt-5 text-[14px]">
                    <div>
                      <dt className="text-[12px] font-semibold text-white/60">
                        대표 상담전화
                      </dt>
                      <dd className="mt-0.5 text-[22px] font-bold">
                        <a
                          href={telHref(STORE.tel)}
                          className="hover:text-[#FF8A50]"
                        >
                          {STORE.tel}
                        </a>
                      </dd>
                      <dd className="text-[14.5px] text-white/85">
                        휴대전화:{" "}
                        <a
                          href={telHref(STORE.mobile)}
                          className="hover:text-[#FF8A50]"
                        >
                          {STORE.mobile}
                        </a>
                      </dd>
                    </div>

                    <div className="pt-3 border-t border-white/10">
                      <dt className="text-[12px] font-semibold text-white/60">
                        영업시간 안내
                      </dt>
                      <dd className="mt-0.5 font-semibold">{STORE.hours}</dd>
                      <dd className="text-[12.5px] text-[#FF8A50] mt-0.5">
                        ※ {STORE.closed}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-7 pt-5 border-t border-white/15 grid grid-cols-2 gap-2.5">
                  <a
                    href={STORE.naverMap}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center rounded-md font-bold bg-[#03C75A] text-white text-[13.5px] hover:bg-[#02b350]"
                  >
                    네이버 지도 길찾기
                  </a>
                  <a
                    href="https://map.kakao.com/link/to/한밭중고전자,36.335503,127.406981"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center rounded-md font-bold bg-[#FEE500] text-[#191600] text-[13.5px] hover:bg-[#F2D900]"
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
              eyebrow="Online Inquiry"
              title={<span id="cta-title">판매 · 매입 통합 상담 신청</span>}
              desc="찾으시는 제품이나 처분하실 가전 정보를 남겨주시면 담당자가 확인 후 빠르게 연락드립니다."
            />

            <div className="mt-8 grid gap-7 lg:grid-cols-12 items-start">
              <div
                id="inquiry-form"
                className="rounded-md border border-[#E4E0D8] bg-white p-5 sm:p-8 lg:col-span-7 shadow-2xs"
              >
                <UnifiedInquiryForm
                  defaultType={inquiryType}
                  linkedProduct={linkedProduct}
                  onSuccess={() => loadRecent()}
                />
              </div>

              <aside className="flex flex-col gap-5 lg:col-span-5">
                <div className="rounded-md bg-[#0E1A2B] p-6 text-white sm:p-7">
                  <h3 className="text-[12.5px] font-bold uppercase tracking-wider text-[#FF8A50]">
                    Direct Consultation
                  </h3>
                  <p className="mt-1 text-[14px] text-white/75">
                    급한 재고 확인이나 당일 방문 수거 문의는 전화가 가장 빠릅니다.
                  </p>
                  <a
                    href={telHref(STORE.tel)}
                    className="mt-3 block text-[26px] font-bold tracking-tight sm:text-[28px] hover:text-[#FF8A50]"
                  >
                    {STORE.tel}
                  </a>
                  <a
                    href={telHref(STORE.mobile)}
                    className="mt-0.5 block text-[15.5px] font-semibold text-white/85 hover:text-[#FF8A50]"
                  >
                    휴대전화: {STORE.mobile}
                  </a>
                  <p className="mt-4 border-t border-white/15 pt-3.5 text-[13px] text-white/70">
                    {STORE.hours} · {STORE.closed}
                  </p>
                </div>

                <div className="rounded-md border border-[#E4E0D8] bg-white p-6 sm:p-7">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EEEBE5]">
                    <h3 className="text-[15.5px] font-bold text-[#0E1A2B]">
                      최근 접수된 문의 현황
                    </h3>
                    <Link
                      href="/inquiry"
                      className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#4B5260] hover:text-[#0E1A2B]"
                    >
                      <span>전체 게시판</span>
                      <Icon d={ICON.right} className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  {recent.length === 0 ? (
                    <p className="mt-5 text-[13.5px] text-[#8A8478]">
                      최근 접수된 문의 내역이 없습니다.
                    </p>
                  ) : (
                    <ul className="mt-2 divide-y divide-[#EEEBE5]">
                      {recent.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center gap-2.5 py-3 text-[13.5px]"
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
                          <span className="shrink-0 text-[12px] text-[#8A8478]">
                            {r.masked_name || maskName(r.name)} ·{" "}
                            <strong className="font-semibold text-[#0E1A2B]">
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
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col bg-white shadow-card border-y border-l border-[#DDD9D1] rounded-l-lg overflow-hidden w-[76px]"
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
                제품 갤러리
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
                전화상담
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

      {/* ── 라이트박스 모달 ── */}
      {lightbox && (
        <Modal
          open={!!lightbox}
          onClose={() => setLightbox(null)}
          label="배송·설치 사진 확대 보기"
          panelClassName="max-w-4xl"
        >
          <div className="relative flex w-full flex-col rounded-lg bg-[#0B1522] p-4 text-white">
            <div className="mb-3 flex items-center justify-between">
              <p className="truncate text-[15px] font-semibold">
                {lightbox.review.title}
              </p>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="닫기"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
              >
                <Icon d={ICON.close} />
              </button>
            </div>
            <div className="relative flex items-center justify-center">
              <SafeImg
                src={lbImages[lightbox.index]}
                alt={lightbox.review.title || "현장 사진"}
                eager
                className="max-h-[76vh] w-auto max-w-full rounded object-contain"
              />
              {lbImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => moveLightbox(-1)}
                    aria-label="이전 사진"
                    className="absolute left-2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white"
                  >
                    <Icon d={ICON.left} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLightbox(1)}
                    aria-label="다음 사진"
                    className="absolute right-2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white"
                  >
                    <Icon d={ICON.right} />
                  </button>
                </>
              )}
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
