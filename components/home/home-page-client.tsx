// 파일 경로: components/home/home-page-client.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { notifyAdminAuthChanged } from "../../lib/admin-auth";
import { useIsAdminSession } from "../../lib/use-admin-session";
import {
  SafeImg,
  Modal,
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
  SectionHeading,
  AdminLoginModal,
} from "../../lib/ui";
import { Icon, ICON } from "../../lib/icons";
import {
  STORE,
  splitImages,
  compressImage,
  revokeObjectUrls,
  MAX_REVIEW_PHOTOS,
  MAX_FILE_MB,
  isProductPendingReview,
  isProductSold,
  PRODUCT_STATUS,
  trackEvent,
  type InquiryTypeValue,
  triggerQuickInquiry,
} from "../../lib/site";
import { type ProductItem } from "../products/product-card";
import { FeaturedProductsSection } from "./featured-products-section";
import {
  CategoryPictogramBar,
  SHOWROOM_CATEGORIES,
  matchesShowroomCategory,
  type ShowroomCategoryItem,
  type PictogramKey,
} from "./category-pictogram-bar";
import { ShowroomTrustShowcase } from "./showroom-trust-showcase";
import {
  HomeGuideShowcase,
  type HomeGuidePreviewItem,
} from "./home-guide-showcase";
import { HomeFaqSection } from "./home-faq-section";
import {
  HomeLocationInquirySection,
  type HomeInquiryRow,
} from "./home-location-inquiry-section";
import { HeroPromoCarousel } from "./hero-promo-carousel";
import { HomeIntentRouter } from "./home-intent-router";
import { HERO_BANNER_SLIDES } from "../../lib/hero-banners";
import { filterHomeShowroomProducts } from "../../lib/home-showroom-filter";
import { getCategoryNoticeGuide } from "../../lib/notice-guides";

const NoticeGuideModal = dynamic(
  () =>
    import("../products/notice-guide-banner").then(
      (m) => m.NoticeGuideModal
    ),
  { ssr: false }
);

const ShowroomVisitModal = dynamic(
  () =>
    import("../showroom/showroom-visit-modal").then(
      (m) => m.ShowroomVisitModal
    ),
  { ssr: false }
);

/* ════════════════════════════════════════════════════════════
   1. 정적 데이터 및 상수 (기존 사업자 사실 문구 100% 보존)
   ════════════════════════════════════════════════════════════ */

export type Review = {
  id: string | number;
  title: string | null;
  image_url: string | null;
  created_at: string;
};

type InquiryRow = HomeInquiryRow;

function handleTabListKeyDown<T extends string>(
  e: React.KeyboardEvent<HTMLDivElement>,
  keys: readonly T[],
  current: T,
  onChange: (next: T) => void
) {
  const idx = keys.indexOf(current);
  if (idx < 0) return;

  let nextIdx = idx;
  if (e.key === "ArrowRight") nextIdx = (idx + 1) % keys.length;
  else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + keys.length) % keys.length;
  else if (e.key === "Home") nextIdx = 0;
  else if (e.key === "End") nextIdx = keys.length - 1;
  else return;

  e.preventDefault();
  onChange(keys[nextIdx]);
  const tabs = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  tabs[nextIdx]?.focus();
}

/* ════════════════════════════════════════════════════════════
   2. 메인 페이지 컴포넌트 (Modern Appliance Showroom 아키텍처)
   ════════════════════════════════════════════════════════════ */
export type GuidePreviewSummary = HomeGuidePreviewItem;

export default function Home({
  initialProducts,
  initialReviews,
  initialRecent = null,
  totalInquiryCount = null,
  guideTotalCount = 0,
  latestGuides = [],
}: {
  initialProducts: ProductItem[] | null;
  initialReviews: Review[] | null;
  initialRecent?: InquiryRow[] | null;
  totalInquiryCount?: number | null;
  guideTotalCount?: number;
  latestGuides?: readonly GuidePreviewSummary[];
}) {
  /* 실시간 판매 매물 상태 (서버 초기값이 있으면 즉시 렌더링) */
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>(
    initialProducts ?? []
  );
  const [productsLoading, setProductsLoading] = useState(
    initialProducts === null
  );
  const [productsError, setProductsError] = useState(false);

  /* 카테고리 탐색 및 빠른 검색 상태 */
  const [selectedCategory, setSelectedCategory] =
    useState<ShowroomCategoryItem>(SHOWROOM_CATEGORIES[0]);
  const [showroomSearch, setShowroomSearch] = useState("");

  /* 배송·설치 사례 및 최근 문의 상태 */
  const [reviews, setReviews] = useState<Review[]>(initialReviews ?? []);
  const [reviewsLoading, setReviewsLoading] = useState(
    initialReviews === null
  );
  const [recent, setRecent] = useState<InquiryRow[]>(initialRecent ?? []);
  const isAdmin = useIsAdminSession();

  /* UI 인터랙션 상태 */
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<
    "all" | "home" | "commercial"
  >("all");
  const [lightbox, setLightbox] = useState<{
    review: Review;
    index: number;
  } | null>(null);
  const [airconModalOpen, setAirconModalOpen] = useState(false);
  const airconNoticeGuide = getCategoryNoticeGuide("에어컨/냉난방기");
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const heroTheme =
    HERO_BANNER_SLIDES[activeBannerIndex]?.theme ?? HERO_BANNER_SLIDES[0].theme;

  /* 관리자 모달 상태 */
  const [loginOpen, setLoginOpen] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [reviewPreviews, setReviewPreviews] = useState<string[]>([]);
  const [uploadingReview, setUploadingReview] = useState(false);
  const [isAnalyzingReview, setIsAnalyzingReview] = useState(false);

  /* ── 1) 판매 매물 로드 ── */
  const fetchFeaturedList = useCallback(async (): Promise<ProductItem[]> => {
    const { supabase } = await import("../../lib/supabase");
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .neq("category", "배송인증")
      .neq("status", PRODUCT_STATUS.PENDING_REVIEW)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;
    const rows = ((data ?? []) as ProductItem[]).filter(
      (p) => !isProductPendingReview(p.status)
    );
    rows.sort((a, b) => {
      const soldA = isProductSold(a.status) ? 1 : 0;
      const soldB = isProductSold(b.status) ? 1 : 0;
      return soldA - soldB;
    });
    return rows;
  }, []);

  const loadFeaturedProducts = useCallback(async () => {
    try {
      setFeaturedProducts(await fetchFeaturedList());
    } catch (err) {
      console.error("추천 매물 로드 실패:", err);
      setProductsError(true);
    } finally {
      setProductsLoading(false);
    }
  }, [fetchFeaturedList]);

  /* ── 2) 배송·설치 인증 사진 로드 (상한선 24건) ── */
  const fetchReviewsList = useCallback(async (): Promise<Review[]> => {
    const { supabase } = await import("../../lib/supabase");
    const { data, error } = await supabase
      .from("products")
      .select("id, title, image_url, created_at")
      .eq("category", "배송인증")
      .order("created_at", { ascending: false })
      .limit(24);
    if (error) throw error;
    return (data ?? []) as Review[];
  }, []);

  const loadReviews = useCallback(async () => {
    try {
      setReviews(await fetchReviewsList());
    } catch (err) {
      console.error("인증사진 불러오기 실패:", err);
    } finally {
      setReviewsLoading(false);
    }
  }, [fetchReviewsList]);

  /* ── 3) 최근 문의 현황 로드 ── */
  const fetchRecentList = useCallback(async (): Promise<InquiryRow[]> => {
    const res = await fetch("/api/inquiries?limit=24");
    if (!res.ok) return [];
    const json = await res.json();
    const rows = (json.inquiries ?? []) as InquiryRow[];
    return rows.filter((r) => !r.is_notice).slice(0, 12);
  }, []);

  useEffect(() => {
    let active = true;
    if (initialProducts === null) {
      void (async () => {
        try {
          const rows = await fetchFeaturedList();
          if (active) setFeaturedProducts(rows);
        } catch (err) {
          console.error("추천 매물 로드 실패:", err);
          if (active) setProductsError(true);
        } finally {
          if (active) setProductsLoading(false);
        }
      })();
    }
    if (initialReviews === null) {
      void (async () => {
        try {
          const rows = await fetchReviewsList();
          if (active) setReviews(rows);
        } catch (err) {
          console.error("인증사진 불러오기 실패:", err);
        } finally {
          if (active) setReviewsLoading(false);
        }
      })();
    }
    if (initialRecent === null) {
      void (async () => {
        try {
          const rows = await fetchRecentList();
          if (active) setRecent(rows);
        } catch {
          if (active) setRecent([]);
        }
      })();
    }
    return () => {
      active = false;
    };
  }, [
    initialProducts,
    initialReviews,
    initialRecent,
    fetchFeaturedList,
    fetchReviewsList,
    fetchRecentList,
  ]);

  const activeProducts = useMemo(
    () => featuredProducts.filter((p) => !isProductSold(p.status)),
    [featuredProducts]
  );

  const sellingCount = activeProducts.length;
  const bizCount = useMemo(
    () => activeProducts.filter((p) => p.category === "업소용기기").length,
    [activeProducts]
  );

  /* 카테고리별 실시간 재고 수량 계산 (상호 배타 1:1 집계) */
  const categoryCounts = useMemo<Partial<Record<PictogramKey, number>>>(() => {
    const src = activeProducts.length > 0 ? activeProducts : featuredProducts;
    if (src.length === 0) return {};
    const map: Partial<Record<PictogramKey, number>> = {
      all: src.length,
    };
    for (const catItem of SHOWROOM_CATEGORIES) {
      if (catItem.key === "all") continue;
      map[catItem.key] = src.filter((p) =>
        matchesShowroomCategory(p, catItem)
      ).length;
    }
    return map;
  }, [activeProducts, featuredProducts]);

  const filteredShowroomCount = useMemo(
    () =>
      filterHomeShowroomProducts(featuredProducts, {
        selectedCategory,
        searchQuery: showroomSearch,
      }).length,
    [featuredProducts, selectedCategory, showroomSearch]
  );

  const getReviewBridgeMeta = (title?: string | null): {
    label: string;
    href: string;
  } => {
    const t = title || "";
    if (/업소|식당|카페|쇼케이스|테이블|제빙기|반찬|싱크|작업대|45박스|25박스/i.test(t)) {
      return {
        label: "업소용 실매물",
        href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
      };
    }
    if (/에어컨|냉난방|스탠드|벽걸이|천장|실외기|투인원/i.test(t)) {
      return {
        label: "에어컨 실매물",
        href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
      };
    }
    if (/세탁|건조|드럼|통돌이|워시타워/i.test(t)) {
      return {
        label: "세탁·건조기 실매물",
        href: "/gallery?category=%EC%84%B8%ED%83%81%EA%B8%B0%2F%EA%B1%B4%EC%A1%B0%EA%B8%B0",
      };
    }
    if (/냉장|김치|비스포크|양문|4도어/i.test(t)) {
      return {
        label: "냉장고 실매물",
        href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
      };
    }
    return {
      label: "관련 실매물",
      href: "/gallery",
    };
  };

  const filteredReviews = useMemo(() => {
    if (reviewFilter === "all") return reviews;
    if (reviewFilter === "commercial") {
      return reviews.filter((r) =>
        /업소|식당|카페|쇼케이스|테이블|제빙기|반찬|싱크|작업대|상가|사무실/i.test(
          r.title || ""
        )
      );
    }
    return reviews.filter(
      (r) =>
        !/업소|식당|카페|쇼케이스|테이블|제빙기|반찬|싱크|작업대/i.test(
          r.title || ""
        )
    );
  }, [reviews, reviewFilter]);

  const shownReviews = showAllReviews
    ? filteredReviews
    : filteredReviews.slice(0, 4);

  const openInquiry = useCallback(
    (type?: InquiryTypeValue, productTitle?: string) => {
      triggerQuickInquiry({
        type: type || "구매 문의",
        productTitle,
      });
    },
    []
  );

  const handleLogout = async () => {
    const { supabase } = await import("../../lib/supabase");
    await supabase.auth.signOut();
    notifyAdminAuthChanged();
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

      const { getAdminAuthHeaders } = await import("../../lib/supabase");
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
    revokeObjectUrls(reviewPreviews);
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
      revokeObjectUrls(prev);
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
      const { createDeliveryCaseRecord } = await import("../../lib/product-ops");
      await createDeliveryCaseRecord({
        title: reviewTitle,
        files: reviewFiles,
      });
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
      const { deleteDeliveryCaseRecord } = await import("../../lib/product-ops");
      const target = reviews.find((r) => r.id === id);
      await deleteDeliveryCaseRecord(id, target?.image_url);

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

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#141A23]">

      {/* [S0] 상단 공통 헤더 */}
      <SiteHeader>
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden md:inline-flex items-center rounded-lg border border-[#CFC7BA] bg-[#FAF9F6] px-3.5 h-10 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-white active:scale-[0.96] transition-[border-color,background-color,transform] duration-150 whitespace-nowrap"
          >
            관리자
          </Link>
        )}
      </SiteHeader>

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {/* ════════════════════════════════════════════════════════════
            [S1] 대형 기획전 히어로 배너 캐러셀 + 핵심 전환 퀵바
            ════════════════════════════════════════════════════════════ */}
        <HeroPromoCarousel
          sellingCount={sellingCount}
          onOpenVisitModal={() => setVisitModalOpen(true)}
          activeIndex={activeBannerIndex}
          onActiveIndexChange={setActiveBannerIndex}
        />

        {/* [S2] 히어로 직후 3대 목적 분기 (메인 배너 테마 연동) (#buyback-summary-section) */}
        <HomeIntentRouter
          sellingCount={sellingCount}
          bizCount={bizCount}
          activeBannerTheme={heroTheme}
        />

        {/* ════════════════════════════════════════════════════════════
            [S3] 품목별 쇼룸 탐색 바 + 실시간 쇼룸 전시 매물 통합 카탈로그 섹션
            ════════════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="category-heading"
          className="border-b border-hb-border bg-white"
        >
          <CategoryPictogramBar
            embedded
            selectedKey={selectedCategory.key}
            categoryCounts={categoryCounts}
            searchQuery={showroomSearch}
            onSearchQueryChange={setShowroomSearch}
            onQuickKeywordSelect={(keyword) => {
              setSelectedCategory(SHOWROOM_CATEGORIES[0]);
              setShowroomSearch(keyword);
            }}
            filteredCount={filteredShowroomCount}
            onSelectCategory={(item) => {
              setSelectedCategory(item);
            }}
          />

          <FeaturedProductsSection
            embedded
            products={featuredProducts}
            loading={productsLoading}
            error={productsError}
            onRetry={() => {
              setProductsLoading(true);
              setProductsError(false);
              void loadFeaturedProducts();
            }}
            selectedCategory={selectedCategory}
            onResetCategory={() => setSelectedCategory(SHOWROOM_CATEGORIES[0])}
            searchQuery={showroomSearch}
            onResetSearch={() => setShowroomSearch("")}
          />
        </section>

        {/* [S4] 01~04 매입·고압세척·작동 점검 과정 (#refurbish-process-section) */}
        <ShowroomTrustShowcase />

        {/* ════════════════════════════════════════════════════════════
            [S5] 배송 · 설치 현장 기록 (#reviews-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="reviews-section"
          className="hb-section-deferred border-b border-hb-border bg-white py-10 sm:py-14"
          aria-labelledby="review-title"
        >
          <div className="hb-container">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-4 border-b border-[#E2DDD3]">
              <SectionHeading
                title={<span id="review-title" className="[text-wrap:balance]">직영 배송 · 설치 현장 기록</span>}
                desc={`가정집부터 식당·카페·사무실까지 ${STORE.name}가 직접 배송·설치한 현장 사진입니다.`}
              />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 shrink-0 text-hb-xs sm:text-hb-sm">
                <a
                  href={STORE.naverMap}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent("click_nav_naver", {
                      channel: "naver_map_review",
                      location: "home_reviews_section",
                    })
                  }
                  className="inline-flex items-center gap-1 font-bold text-[#141A23] hover:text-[#C84312] transition-colors whitespace-nowrap"
                >
                  <span>네이버 지도 리뷰</span>
                  <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#0F766E]" />
                </a>
                <span className="text-[#CFC7BA]" aria-hidden="true">
                  |
                </span>
                <a
                  href={STORE.daangnLocalProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent("click_guide_tool_action", {
                      channel: "daangn_profile",
                      location: "home_reviews_section",
                    })
                  }
                  className="inline-flex items-center gap-1 font-bold text-[#141A23] hover:text-[#C84312] transition-colors whitespace-nowrap"
                >
                  <span>당근 비즈 후기</span>
                  <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#C84312]" />
                </a>
                {reviews.length > 0 && (
                  <>
                    <span className="text-[#CFC7BA]" aria-hidden="true">
                      |
                    </span>
                    <span className="font-bold text-[#475569] tabular-nums">
                      현장 <strong className="text-[#141A23]">{reviews.length}</strong>건
                    </span>
                  </>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="hb-btn-primary h-9 px-3.5 text-hb-xs active:scale-[0.96]"
                  >
                    <Icon d={ICON.plus} className="h-3.5 w-3.5" /> 인증사진 등록
                  </button>
                )}
              </div>
            </div>

            {/* [EVO-013] 시공 유형 분류 탭 */}
            {reviews.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5">
                <div
                  role="tablist"
                  aria-label="시공 현장 분류"
                  onKeyDown={(e) =>
                    handleTabListKeyDown(
                      e,
                      ["all", "home", "commercial"] as const,
                      reviewFilter,
                      setReviewFilter
                    )
                  }
                  className="inline-flex rounded-xl border border-[#E2DDD3] bg-white p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    tabIndex={reviewFilter === "all" ? 0 : -1}
                    aria-selected={reviewFilter === "all"}
                    onClick={() => setReviewFilter("all")}
                    className={`hb-tab-indicator hb-trim rounded-lg px-3.5 py-2 text-hb-xs font-bold active:scale-[0.96] transition-[background-color,color,transform] duration-150 ${
                      reviewFilter === "all"
                        ? "bg-[#141A23] text-white shadow-2xs"
                        : "text-[#334155] hover:text-[#141A23]"
                    }`}
                  >
                    전체 현장 ({reviews.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    tabIndex={reviewFilter === "home" ? 0 : -1}
                    aria-selected={reviewFilter === "home"}
                    onClick={() => setReviewFilter("home")}
                    className={`hb-tab-indicator hb-trim rounded-lg px-3.5 py-2 text-hb-xs font-bold active:scale-[0.96] transition-[background-color,color,transform] duration-150 ${
                      reviewFilter === "home"
                        ? "bg-[#141A23] text-white shadow-2xs"
                        : "text-[#334155] hover:text-[#141A23]"
                    }`}
                  >
                    가정용 (냉장고·세탁기·에어컨)
                  </button>
                  <button
                    type="button"
                    role="tab"
                    tabIndex={reviewFilter === "commercial" ? 0 : -1}
                    aria-selected={reviewFilter === "commercial"}
                    onClick={() => setReviewFilter("commercial")}
                    className={`hb-tab-indicator hb-trim rounded-lg px-3.5 py-2 text-hb-xs font-bold active:scale-[0.96] transition-[background-color,color,transform] duration-150 ${
                      reviewFilter === "commercial"
                        ? "bg-[#141A23] text-white shadow-2xs"
                        : "text-[#334155] hover:text-[#141A23]"
                    }`}
                  >
                    상가·식당 (업소용·냉난방)
                  </button>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5 text-hb-xs font-medium text-[#64748B]">
                  <Icon d={ICON.shieldCheck} className="w-3.5 h-3.5 text-[#C84312]" />
                  직영 기사 직접 운반 · 수평설치 및 작동 확인
                </span>
              </div>
            )}

            {reviewsLoading ? (
              <div className="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[16/10] animate-pulse rounded-xl bg-white"
                  />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="mt-6 flex flex-col items-start gap-4 border-y border-[#E2DDD3] bg-white px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-hb-base font-bold text-[#141A23]">
                    현장 사진을 정리하고 있습니다.
                  </p>
                  <p className="mt-1 text-hb-sm text-[#334155]">
                    배송·설치 사례가 궁금하시면 카카오톡으로 편하게 문의해 주세요.
                  </p>
                </div>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-10 shrink-0 px-4 text-hb-sm active:scale-[0.96]"
                >
                  <Icon d={ICON.chat} className="h-4 w-4" /> 카카오톡 문의
                </a>
              </div>
            ) : (
              <>
                <ul className="hb-hscroll-fade mt-5 flex gap-3 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 sm:gap-3.5 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
                  {shownReviews.map((r) => {
                    const imgs = splitImages(r.image_url);
                    const bridge = getReviewBridgeMeta(r.title);
                    return (
                      <li
                        key={r.id}
                        className="group relative flex w-[68vw] max-w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[#E2DDD3] bg-white shadow-2xs hover:border-[#CFC7BA] hover:shadow-card hover:-translate-y-0.5 transition-[border-color,box-shadow,transform] duration-150 sm:w-auto sm:max-w-none sm:shrink"
                      >
                        <button
                          type="button"
                          onClick={() => setLightbox({ review: r, index: 0 })}
                          className="relative block aspect-[16/10] w-full overflow-hidden bg-[#F1F3F6] cursor-pointer"
                          aria-label={`${r.title ?? "배송·설치"} 사진 크게 보기`}
                        >
                          <SafeImg
                            src={imgs[0]}
                            alt={`${r.title ?? "배송·설치"} 현장 사진`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                          {imgs.length > 1 && (
                            <span className="absolute right-2 top-2 z-10 rounded-md bg-[#141A23]/80 px-1.5 py-0.5 text-hb-xs font-semibold text-white tabular-nums">
                              +{imgs.length - 1}
                            </span>
                          )}
                        </button>
                        <div className="bg-white px-3 py-2.5 border-t border-[#E2DDD3] flex items-center justify-between gap-2">
                          <p className="line-clamp-1 text-hb-xs font-bold text-[#141A23] group-hover:text-[#C84312] transition-colors min-w-0">
                            {r.title || "배송 및 설치 완료"}
                          </p>
                          <Link
                            href={bridge.href}
                            className="shrink-0 inline-flex items-center gap-0.5 text-hb-xs font-bold text-[#C84312] hover:underline underline-offset-4 whitespace-nowrap"
                          >
                            <span>{bridge.label}</span>
                            <Icon d={ICON.right} className="w-3 h-3" />
                          </Link>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r.id)}
                            className="absolute left-2 top-2 z-20 rounded-md bg-white/95 px-2 py-0.5 text-hb-xs font-bold text-red-600 shadow"
                          >
                            삭제
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-1.5 flex sm:hidden items-center justify-center gap-1.5 text-hb-xs text-[#475569]">
                  <Icon d={ICON.left} className="w-3.5 h-3.5 text-[#C84312]" />
                  <span>좌우로 밀어서 현장 사진을 확인하세요 ({shownReviews.length}건)</span>
                  <Icon d={ICON.right} className="w-3.5 h-3.5 text-[#C84312]" />
                </div>
                {filteredReviews.length > 4 && (
                  <div className="mt-5 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllReviews((v) => !v)}
                      className="hb-btn-outline h-10 px-5 text-hb-xs sm:text-hb-sm active:scale-[0.96]"
                    >
                      {showAllReviews
                        ? "현장 사진 접기"
                        : `현장 사진 ${filteredReviews.length - 4}건 더 보기`}
                      <Icon
                        d={ICON.down}
                        className={`h-3.5 w-3.5 transition-transform ${
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

        {/* [6/8] 오프라인 직영 쇼룸 오시는 길 및 실시간 1:1 문의 (#inquiry-section + #location-section) */}
        <HomeLocationInquirySection
          recent={recent}
          totalInquiryCount={totalInquiryCount}
          onOpenInquiry={openInquiry}
        />

        {/* [7/8] 자주 묻는 질문 (#faq-section) */}
        <HomeFaqSection
          onOpenInquiry={openInquiry}
          onOpenAirconGuide={() => setAirconModalOpen(true)}
        />

        {/* ════════════════════════════════════════════════════════════
            [8/8] 가전 · 전기 · 설치 정보 게시판 비주얼 쇼케이스
            ════════════════════════════════════════════════════════════ */}
        <HomeGuideShowcase
          guides={[...latestGuides]}
          totalCount={guideTotalCount}
        />
      </main>

      {/* [S9] 공통 푸터 및 슬림 모바일 하단 CTA 바 */}
      <SiteFooter
        isAdmin={isAdmin}
        onAdminClick={() => (isAdmin ? handleLogout() : setLoginOpen(true))}
      />
      <MobileCtaBar onInquiryClick={() => openInquiry("구매 문의")} />

      {/* ── 에어컨/냉난방기 세트 구성 안내문 모달 ── */}
      {airconModalOpen && airconNoticeGuide && (
        <NoticeGuideModal
          open={airconModalOpen}
          guide={airconNoticeGuide}
          onClose={() => setAirconModalOpen(false)}
        />
      )}

      {/* ── [EVO-015] 쇼룸 방문 길찾기 & 실물 확인 모달 ── */}
      {visitModalOpen && (
        <ShowroomVisitModal
          open={visitModalOpen}
          onClose={() => setVisitModalOpen(false)}
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
          <div className="relative flex w-full flex-col rounded-2xl bg-[#141A23] p-4 sm:p-5 text-white shadow-2xl border border-white/15">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-hb-xs font-bold text-[#FB923C]">
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
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-[0.96] transition-[background-color,transform]"
              >
                <Icon d={ICON.close} />
              </button>
            </div>
            <div className="relative flex items-center justify-center bg-[#060C14] rounded-xl p-2">
              <SafeImg
                src={lbImages[lightbox.index]}
                alt={lightbox.review.title || "현장 사진"}
                eager
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
              />
              {lbImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => moveLightbox(-1)}
                    aria-label="이전 사진"
                    className="absolute left-3 grid h-10 w-10 place-items-center rounded-full bg-black/65 text-white hover:bg-black active:scale-[0.96] transition-[background-color,transform]"
                  >
                    <Icon d={ICON.left} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLightbox(1)}
                    aria-label="다음 사진"
                    className="absolute right-3 grid h-10 w-10 place-items-center rounded-full bg-black/65 text-white hover:bg-black active:scale-[0.96] transition-[background-color,transform]"
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
      <AdminLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
      />

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
            className="w-full rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E2DDD3]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-hb-lg font-bold text-[#141A23]">
                배송·설치 인증사진 등록
              </h2>
              <button
                type="button"
                onClick={closeReviewModal}
                aria-label="닫기"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#F2EEE7] text-[#334155] active:scale-[0.96] transition-[background-color,transform]"
              >
                <Icon d={ICON.close} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="hb-label" htmlFor="review-title">
                제목
              </label>
              {isAnalyzingReview && (
                <span className="text-hb-xs font-semibold text-[#C84312]">
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
                  className="relative aspect-square overflow-hidden rounded-lg bg-[#F2EEE7]"
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
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/75 text-white active:scale-[0.96] transition-transform"
                  >
                    <Icon d={ICON.close} className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {reviewFiles.length < MAX_REVIEW_PHOTOS && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CFC7BA] bg-[#FAF9F6] text-hb-xs font-semibold text-[#64748B] hover:border-[#C84312] hover:text-[#C84312] active:scale-[0.96] transition-[border-color,color,transform] duration-150">
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
              className="hb-btn-accent mt-6 h-11 w-full text-hb-sm active:scale-[0.96]"
            >
              {uploadingReview ? "등록 중…" : "등록하기"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
