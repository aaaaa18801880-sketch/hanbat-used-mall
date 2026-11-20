// 파일 경로: components/home/home-page-client.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
  STORE_NAVIGATION,
  INQUIRY_STATUS,
  telHref,
  maskName,
  splitImages,
  compressImage,
  revokeObjectUrls,
  MAX_REVIEW_PHOTOS,
  MAX_FILE_MB,
  STORAGE_BUCKETS,
  isProductSold,
  getCategoryWarrantyInfo,
  getInquiryTypeLabel,
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
import { AiRecommendationGuideSection } from "./ai-recommendation-guide-section";
import { ShowroomTrustShowcase } from "./showroom-trust-showcase";
import {
  HomeGuideShowcase,
  type HomeGuidePreviewItem,
} from "./home-guide-showcase";
import {
  formatInquiryRelativeDate,
  getInquiryTypeTone,
  isInquiryAnswered,
  summarizeInquiryActivity,
} from "../../lib/inquiry-feed";

const AirconGuideModal = dynamic(
  () =>
    import("../products/aircon-set-guide-banner").then(
      (m) => m.AirconGuideModal
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
const OPERATING_YEARS = new Date().getFullYear() - STORE.since;

export type Review = {
  id: string | number;
  title: string | null;
  image_url: string | null;
  created_at: string;
};

type InquiryRow = {
  id: string | number;
  inquiry_type?: string | null;
  category: string | null;
  name: string | null;
  masked_name?: string | null;
  status: string | null;
  is_notice: boolean | null;
  created_at?: string | null;
};

type FaqCategoryKey = "all" | "buy" | "delivery" | "sell";

const FAQ_FILTER_OPTIONS: ReadonlyArray<{
  key: FaqCategoryKey;
  label: string;
}> = [
  { key: "all", label: "전체 질문" },
  { key: "buy", label: "구매·A/S" },
  { key: "delivery", label: "배송·설치" },
  { key: "sell", label: "매입·결제" },
];

const FAQS: ReadonlyArray<{
  group: Exclude<FaqCategoryKey, "all">;
  tag: string;
  q: string;
  a: string;
}> = [
  {
    group: "buy",
    tag: "직거래 비교 · 매장 구매 혜택",
    q: "당근 등 개인 직거래 대신 매장에서 구매하면 어떤 점이 더 좋나요?",
    a: `개인 직거래는 용달 섭외와 무거운 가전 운반을 직접 해야 하고, 집에 가져와서 고장 나도 환불이나 수리를 받기 어렵습니다. ${STORE.name}에서는 매장 직영 기사가 집 안까지 직접 배송하고 수평·배관 설치까지 안전하게 마무리해 드립니다. 현장 확인 후 고압세척과 배송 전 작동 점검을 마친 제품만 판매하며, 에어컨 최대 8개월, 일반 가전 최대 4개월간 무상 A/S를 보증해 드리니 안심하고 쓰실 수 있습니다.`,
  },
  {
    group: "delivery",
    tag: "세종 · 충청권 배송 및 출장 매입",
    q: "대전 외에 세종, 청주 등 인근 지역도 배송과 방문 매입이 되나요?",
    a: `네, 가능합니다. 대전 전 지역은 물론 세종, 청주, 천안, 공주, 계룡, 논산 등 충청권 전역에 직영 기사가 직접 배송·설치해 드리며, 이사나 폐업 시 방문 매입도 함께 진행합니다. 그 외 지역도 안전한 화물 택배로 배송을 지원합니다.`,
  },
  {
    group: "delivery",
    tag: "배송 일정 · 이사 지정일 예약",
    q: "원하는 배송 날짜나 이사 일정에 맞춰서 받아볼 수 있나요?",
    a: "네, 가능합니다. 원하시는 이사나 입주 날짜에 맞춰 지정일 배송으로 예약해 두실 수 있습니다. 대전 및 인근 지역은 매장 재고 확인 후 당일이나 익일 빠른 배차도 가능하니, 급하게 가전이 필요하신 경우에도 편하게 일정 문의해 주세요.",
  },
  {
    group: "buy",
    tag: "A/S 접수 · 보증 기준",
    q: "사용하다가 고장 나면 A/S는 어떻게 신청하나요?",
    a: `대표전화(${STORE.tel})나 카카오톡으로 증상을 남겨주시면 직영 기사가 확인 후 방문 점검과 수리를 진행합니다. 보증 기간(에어컨 최대 8개월, 일반 가전 최대 4개월) 내 정상 사용 중 발생한 기능 이상은 무상으로 수리해 드리며, 수리가 어려운 경우 동급 제품으로 교환해 드립니다. (※ 세부 보증 기간은 구매 시 거래 조건 기준 적용)`,
  },
  {
    group: "sell",
    tag: "보상판매 · 기존 가전 수거",
    q: "새로 사면서 기존에 쓰던 가전을 처분하거나 폐가전 수거도 가능한가요?",
    a: "네, 가능합니다. 새 가전을 배송·설치해 드리는 날 기존 가전을 현장에서 바로 수거해 드립니다. 연식과 작동 상태가 양호한 가전은 매입 금액만큼 결제 금액에서 빼드리는 보상판매를 진행하며, 노후 고장 가전도 현장 여건에 따라 함께 수거·철거 상담이 가능합니다.",
  },
  {
    group: "delivery",
    tag: "계단 운반 · 에어컨 설치비",
    q: "엘리베이터가 없는 층이거나 에어컨 설치 시 추가 비용이 나오나요?",
    a: "냉장고·세탁기는 1층 및 엘리베이터가 있는 건물 기준 기본 배송·수평 설치가 무료로 지원됩니다. 엘리베이터가 없는 2층 이상 계단 운반이나 사다리차 진입이 필요한 경우에만 사전 협의 후 최소 실비가 적용됩니다. 에어컨은 배관 길이, 타공 여부, 실외기 앵글 등에 따라 달라지므로, 설치 장소 사진을 보내주시면 현장 추가금 없이 정확한 견적을 먼저 안내해 드립니다.",
  },
  {
    group: "buy",
    tag: "에어컨 · 냉난방기 구매 안내",
    q: "에어컨 살 때 실외기만 따로 살 수도 있나요?",
    a: `${STORE.name}의 모든 에어컨과 냉난방기는 냉매 호환성과 냉방 효율 보증을 위해 실내기와 실외기를 1:1 세트로만 판매합니다. 실외기 단품 구매는 지원하지 않으니 양해 부탁드립니다. 공간 평수와 배관 환경에 맞는 모델은 언제든 문의해 주시면 맞춤 추천해 드립니다.`,
  },
  {
    group: "sell",
    tag: "비대면 주문 · 결제 방법",
    q: "매장에 직접 가지 않고 온라인이나 전화로 바로 구매할 수 있나요?",
    a: `네, 가능합니다. 원하시는 매물의 실물 사진과 작동 확인 내용을 카카오톡으로 꼼꼼하게 확인하신 뒤 비대면으로 주문하실 수 있습니다. 계좌이체, 신용카드 결제, 현금영수증 및 사업자 전자세금계산서 발행을 모두 지원합니다.`,
  },
  {
    group: "sell",
    tag: "가전 판매 견적 팁",
    q: "가전을 팔고 싶은데, 사진을 어떻게 찍어 보내야 견적이 바로 나오나요?",
    a: "① 제품 정면 전체 사진, ② 측면이나 문 안쪽에 붙은 '에너지소비효율 스티커 또는 정격 명판(모델명·제조년월)' 사진, ③ 외관 흠집 유무와 엘리베이터 유무(층수)를 함께 알려주시면 현장 감가 없이 가장 빠르고 정확한 매입 견적을 안내해 드립니다.",
  },
];

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

  /* 카테고리 탐색 선택 상태 */
  const [selectedCategory, setSelectedCategory] =
    useState<ShowroomCategoryItem>(SHOWROOM_CATEGORIES[0]);

  /* 배송·설치 사례 및 최근 문의 상태 */
  const [reviews, setReviews] = useState<Review[]>(initialReviews ?? []);
  const [reviewsLoading, setReviewsLoading] = useState(
    initialReviews === null
  );
  const [recent, setRecent] = useState<InquiryRow[]>(initialRecent ?? []);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const isAdmin = useIsAdminSession();

  /* UI 인터랙션 상태 (FAQ 기본 닫힘) */
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [faqFilter, setFaqFilter] = useState<FaqCategoryKey>("all");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<
    "all" | "home" | "commercial"
  >("all");
  const [lightbox, setLightbox] = useState<{
    review: Review;
    index: number;
  } | null>(null);
  const [airconModalOpen, setAirconModalOpen] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);

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
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;
    const rows = (data ?? []) as ProductItem[];
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

  const inquiryActivity = useMemo(
    () => summarizeInquiryActivity(recent),
    [recent]
  );

  const filteredFaqs = useMemo(
    () =>
      faqFilter === "all"
        ? FAQS
        : FAQS.filter((item) => item.group === faqFilter),
    [faqFilter]
  );

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
      toast.success(`도로명 주소(${STORE.roadAddress})가 복사되었습니다.`);
    } catch {
      toast.error("주소 복사에 실패했습니다.");
    }
  };

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
      const [{ supabase }, { compressAndUploadProductImages }] =
        await Promise.all([
          import("../../lib/supabase"),
          import("../../lib/product-ops"),
        ]);
      const urls = await compressAndUploadProductImages(reviewFiles, {
        maxWidth: 1600,
        quality: 0.82,
        bucket: STORAGE_BUCKETS.inquiries,
        prefix: "delivery",
      });

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
      const [{ supabase }, { removeProductImagesFromStorage }] =
        await Promise.all([
          import("../../lib/supabase"),
          import("../../lib/product-ops"),
        ]);
      const target = reviews.find((r) => r.id === id);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;

      if (target?.image_url) {
        await removeProductImagesFromStorage(splitImages(target.image_url));
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

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#141A23]">

      {/* [S0] 상단 공통 헤더 */}
      <SiteHeader>
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden md:inline-flex items-center rounded-lg border border-[#CBD2DC] bg-[#F7F8FA] px-3.5 h-10 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-white active:scale-[0.96] transition-[border-color,background-color,transform] duration-150 whitespace-nowrap"
          >
            관리자
          </Link>
        )}
      </SiteHeader>

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {/* ════════════════════════════════════════════════════════════
            [S1] 쇼룸 아키텍처 히어로 (좌: 핵심 메시지 & 듀얼 액션 독 + 스펙 캡슐 / 우: 직영 쇼룸 외관 & 현장 정보)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="hero-section"
          aria-labelledby="hero-title"
          className="relative w-full border-b border-[#E2E6EC] hb-ambient-hero"
        >
          <div className="hb-container py-5 sm:py-8 lg:py-11">
            <div className="grid items-center gap-5 sm:gap-7 lg:grid-cols-12 lg:gap-10">
              {/* 좌측 (7열): 브리핑 아이브로우 배지 + H1 + 3대 출고 스펙 + 3대 목적 허브 */}
              <div className="lg:col-span-7 min-w-0 flex flex-col justify-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-hb-xs sm:text-hb-sm font-bold">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[#C84312] tracking-tight">
                      <span
                        className="h-2 w-2 rounded-sm bg-[#E8521A]"
                        aria-hidden="true"
                      />
                      <span>
                        SINCE {STORE.since} · {OPERATING_YEARS}년 직영
                      </span>
                    </span>
                    <span className="text-[#CBD2DC]" aria-hidden="true">
                      |
                    </span>
                    <span className="font-semibold text-[#475569]">
                      {STORE.jibunAddress} 1·2층 직영 쇼룸
                    </span>
                  </div>

                  <h1
                    id="hero-title"
                    className="mt-2.5 hb-fluid-h1 text-[#141A23] break-keep font-bold [text-wrap:balance]"
                  >
                    고압세척과 작동 점검을 마친
                    <br />
                    <span className="text-[#C84312]">검증된 중고가전</span> · 업소용 설비
                  </h1>

                  <p className="mt-2 max-w-xl text-hb-sm sm:text-hb-base leading-[1.6] text-[#475569] break-keep [text-wrap:pretty]">
                    가정용 냉장고·세탁기·에어컨부터 식당·카페 창업 주방설비까지, 배송 전 작동 점검 후{" "}
                    <strong className="font-semibold text-[#141A23]">무상 A/S 보증</strong>과 함께 출고합니다.
                  </p>

                  {/* 스위스 벤토 2.0 3단 핵심 신뢰 지표 스트립 */}
                  <div className="mt-3.5 max-w-2xl grid grid-cols-3 divide-x divide-[#E2DDD3] rounded-xl border border-[#E2DDD3] bg-white/95 shadow-2xs">
                    <div className="px-3 py-2 sm:px-4 sm:py-2.5">
                      <span className="block text-hb-xs font-semibold text-[#475569] truncate">
                        에어컨 · 냉난방
                      </span>
                      <strong className="mt-0.5 block text-hb-xs sm:text-hb-sm font-extrabold text-[#C84312] tabular-nums truncate">
                        {getCategoryWarrantyInfo("에어컨/냉난방기").compactLabel}
                      </strong>
                    </div>
                    <div className="px-3 py-2 sm:px-4 sm:py-2.5">
                      <span className="block text-hb-xs font-semibold text-[#475569] truncate">
                        냉장 · 세탁 · 업소
                      </span>
                      <strong className="mt-0.5 block text-hb-xs sm:text-hb-sm font-extrabold text-[#141A23] tabular-nums truncate">
                        {getCategoryWarrantyInfo("냉장고").compactLabel}
                      </strong>
                    </div>
                    <div className="px-3 py-2 sm:px-4 sm:py-2.5">
                      <span className="block text-hb-xs font-semibold text-[#475569] truncate">
                        방문 매입 · 증빙
                      </span>
                      <strong className="mt-0.5 block text-hb-xs sm:text-hb-sm font-extrabold text-[#141A23] tabular-nums truncate">
                        당일 정산 · 계산서
                      </strong>
                    </div>
                  </div>

                  {/* 핵심 행동 2개 고도화: 구매(실매물 확인) + 매입(방문 매입·폐업 정리 통합 허브) */}
                  <div className="mt-4 max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Link
                      href="/gallery"
                      className="group flex items-center justify-between gap-3 rounded-xl bg-[#141A23] px-4 py-3 text-left text-white shadow-sm hover:bg-[#1E2736] active:scale-[0.98] transition-[background-color,transform] duration-150"
                    >
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-2 text-hb-sm font-bold text-white">
                          <span>실매물 확인</span>
                          {sellingCount > 0 && (
                            <span className="rounded-md bg-white/15 px-2 py-0.5 font-mono text-hb-xs font-bold text-[#FF8A50] tabular-nums">
                              {sellingCount}대
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-hb-xs text-white/75 truncate">
                          전시장 실물 · 충청권 직영 배송
                        </span>
                      </div>
                      <Icon
                        d={ICON.arrow}
                        className="w-4 h-4 shrink-0 text-[#FF8A50] transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>

                    <Link
                      href="/purchase"
                      className="group flex items-center justify-between gap-3 rounded-xl bg-[#C84312] px-4 py-3 text-left text-white shadow-sm hover:bg-[#B2390D] active:scale-[0.98] transition-[background-color,transform] duration-150"
                    >
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 text-hb-sm font-bold text-white">
                          <span>가전 · 폐업 설비 팔기</span>
                        </span>
                        <span className="mt-0.5 block text-hb-xs text-white/90 truncate">
                          당일 방문 수거 · 현장 즉시 입금
                        </span>
                      </div>
                      <Icon
                        d={ICON.arrow}
                        className="w-4 h-4 shrink-0 text-white transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-hb-xs text-[#475569]">
                    <a
                      href={STORE.kakaoChat}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#141A23] underline underline-offset-4 hover:text-[#C84312]"
                    >
                      <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#C84312]" />
                      <span>카카오톡 사진 1장 매입 견적</span>
                    </a>
                    <span className="text-[#CBD2DC]" aria-hidden="true">
                      ·
                    </span>
                    <Link
                      href="/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0"
                      className="font-semibold text-[#475569] hover:text-[#141A23] underline underline-offset-4"
                    >
                      식당·카페 업소용 설비 바로보기
                    </Link>
                  </div>
                </div>
              </div>

              {/* 우측 (5열): 대형 쇼룸 사진 + 상태 칩 + 단일 주소/영업시간/길찾기 도크 */}
              <div className="lg:col-span-5 min-w-0 flex flex-col justify-between rounded-2xl overflow-hidden border border-[#E2DDD3] bg-white hb-surface-card hover:translate-y-0">
                <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-[#141A23]">
                  <Image
                    src="/store-exterior.jpg"
                    alt={`${STORE.roadAddress}(${STORE.jibunAddress}) ${STORE.name} 1·2층 직영 대형 전시장 및 전용 주차장 실물 외관 전경`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    priority
                    loading="eager"
                    quality={80}
                    className="object-cover object-center"
                  />

                  <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-[#141A23]/90 backdrop-blur-md border border-white/15 px-2.5 py-1 text-hb-xs font-bold text-white shadow-sm">
                    <Icon d={ICON.pin} className="w-3.5 h-3.5 text-[#FF8A50] shrink-0" />
                    <span>1·2층 직영 쇼룸 · 실물 상시 전시</span>
                  </div>
                </div>

                {/* 벤토 3단 현장 인프라 지표 바 */}
                <div className="grid grid-cols-3 divide-x divide-[#E2DDD3] border-t border-[#E2DDD3] bg-[#FAF9F6] text-center sm:text-left">
                  <div className="px-3 py-2 sm:px-4 sm:py-2.5">
                    <span className="block text-hb-xs font-semibold text-[#475569]">
                      전용 주차
                    </span>
                    <strong className="block text-hb-xs font-bold text-[#141A23] tabular-nums">
                      8대 · 1톤 상차
                    </strong>
                  </div>
                  <div className="px-3 py-2 sm:px-4 sm:py-2.5">
                    <span className="block text-hb-xs font-semibold text-[#475569]">
                      출고 점검
                    </span>
                    <strong className="block text-hb-xs font-bold text-[#141A23]">
                      배송 전 작동 점검
                    </strong>
                  </div>
                  <div className="px-3 py-2 sm:px-4 sm:py-2.5">
                    <span className="block text-hb-xs font-semibold text-[#475569]">
                      직영 배송
                    </span>
                    <strong className="block text-hb-xs font-bold text-[#141A23]">
                      당일 · 지정일 배차
                    </strong>
                  </div>
                </div>

                {/* 하단 단일 주소 + 영업시간 + 길찾기 도크 */}
                <div className="border-t border-[#E2E6EC] px-3.5 py-3 sm:px-5 bg-white flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-1.5 text-hb-xs sm:text-hb-sm font-bold text-[#141A23] truncate max-w-full">
                      <Icon d={ICON.pin} className="w-3.5 h-3.5 shrink-0 text-[#C84312]" />
                      <span className="truncate">{STORE.roadAddress}</span>
                    </p>
                    <p className="mt-0.5 text-hb-xs text-[#475569] truncate tabular-nums">
                      {STORE.hours} · {STORE.closed}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("open_showroom_modal", {
                        location: "hero_exterior_card",
                      });
                      setVisitModalOpen(true);
                    }}
                    className="group shrink-0 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#CBD2DC] bg-[#F7F8FA] px-3 py-2 text-hb-xs font-bold text-[#141A23] shadow-2xs hover:border-[#C84312] hover:bg-[#C84312] hover:text-white active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 cursor-pointer"
                  >
                    <span>길찾기 · 매장안내</span>
                    <Icon
                      d={ICON.right}
                      className="w-3.5 h-3.5 text-[#C84312] group-hover:text-white transition-[color,transform] duration-150 group-hover:translate-x-0.5"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [2/6] 품목별 쇼룸 탐색 바 → 실시간 쇼룸 전시 매물 (물건 먼저) → 4단계 현장 확인·세척·출고 신뢰
            ════════════════════════════════════════════════════════════ */}
        <section
          aria-label="품목별 쇼룸 카탈로그"
          className="bg-white"
        >
          <CategoryPictogramBar
            embedded
            selectedKey={selectedCategory.key}
            categoryCounts={categoryCounts}
            onSelectCategory={(item) => {
              setSelectedCategory(item);
            }}
          />
        </section>

        <FeaturedProductsSection
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
        />

        <ShowroomTrustShowcase />

        {/* ════════════════════════════════════════════════════════════
            [3/6] 오프라인 직영 쇼룸 오시는 길 (확대 지도) 및 실시간 상담 현황 (#inquiry-section + #location-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="inquiry-section"
          className="border-b border-[#E2E6EC] bg-white py-9 sm:py-12"
          aria-labelledby="cta-title"
        >
          <div className="hb-container">
            <SectionHeading
              title={
                <span id="cta-title" className="[text-wrap:balance]">
                  오프라인 매장 오시는 길 및 실시간 1:1 문의
                </span>
              }
              desc="대전·세종·충청권 직배송은 물론, 매장에 직접 방문해 실물 확인 후 상차하실 수 있습니다."
            />

            <div className="mt-6 grid gap-5 lg:grid-cols-12 items-stretch">
              {/* 좌측 (7열): 확대된 오프라인 매장 지도 및 주소·편의시설 일체형 카드 (#location-section) */}
              <div
                id="location-section"
                aria-labelledby="location-title"
                className="scroll-mt-24 lg:col-span-7 min-w-0 flex flex-col overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white shadow-2xs"
              >
                <div className="relative h-[280px] sm:h-[340px] lg:h-[370px] w-full bg-[#F1F3F6] overflow-hidden">
                  {mapLoaded ? (
                    <iframe
                      title={`${STORE.name} 매장 위치 지도`}
                      src="https://maps.google.com/maps?q=%EB%8C%80%EC%A0%84+%EC%A4%91%EA%B5%AC+%EC%A4%91%EC%B4%8C%EB%8F%99+144&t=&z=16&ie=UTF8&iwloc=&output=embed"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0 h-full w-full border-0"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMapLoaded(true)}
                      className="group relative flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,_rgba(232,82,26,0.10),_transparent_55%),linear-gradient(135deg,#F8FAFC_0%,#E9EEF4_100%)] px-6 text-center transition-colors hover:bg-[#E4EBF2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#141A23] cursor-pointer"
                    >
                      <span
                        className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,#CBD5E1_1px,transparent_1px),linear-gradient(to_bottom,#CBD5E1_1px,transparent_1px)] [background-size:32px_32px]"
                        aria-hidden="true"
                      />
                      <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E2E6EC] bg-white text-[#C84312] shadow-sm transition-transform group-hover:scale-105">
                        <Icon d={ICON.pin} className="h-6 w-6" />
                      </span>
                      <div className="relative z-10 space-y-1">
                        <span className="inline-block rounded-md bg-white/90 border border-[#CBD2DC] px-2.5 py-0.5 text-hb-xs font-bold text-[#0F766E]">
                          전용 주차 8대 · 1톤 화물 진입 수월
                        </span>
                        <p className="text-hb-base sm:text-hb-lg font-bold text-[#141A23]">
                          {STORE.name} 오프라인 매장 위치 지도
                        </p>
                        <p className="text-hb-xs sm:text-hb-sm text-[#475569]">
                          {STORE.roadAddress} ({STORE.addressNote})
                        </p>
                      </div>
                      <span className="relative z-10 inline-flex items-center gap-1.5 rounded-xl bg-[#141A23] px-4 py-2 text-hb-xs sm:text-hb-sm font-bold text-white shadow-xs transition-colors group-hover:bg-[#C84312]">
                        <span>크게 지도 펼치기</span>
                        <Icon d={ICON.right} className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  )}
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between border-t border-[#E2E6EC] bg-white space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <h3
                        id="location-title"
                        className="text-hb-base sm:text-hb-lg font-bold text-[#141A23] break-keep [text-wrap:balance]"
                      >
                        {STORE.roadAddress}
                      </h3>
                      <p className="mt-0.5 text-hb-xs sm:text-hb-sm text-[#475569]">
                        지번: {STORE.jibunAddress} ({STORE.addressNote}) · {STORE.hours} ({STORE.closed})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="hb-btn-outline h-9 px-3.5 text-hb-xs font-bold shrink-0 self-start active:scale-[0.96] cursor-pointer"
                    >
                      <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#C84312]" />
                      <span>주소 복사</span>
                    </button>
                  </div>

                  <p className="pt-3 border-t border-[#E2DDD3] text-hb-xs sm:text-hb-sm text-[#475569] leading-relaxed">
                    <strong className="font-semibold text-[#141A23]">전용 주차 8대</strong>(1톤 화물 진입 수월) ·{" "}
                    <strong className="font-semibold text-[#141A23]">현장 전원 확인</strong> 후 당일 상차 · 중촌고가교 밑 도보 2분
                  </p>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <a
                      href={STORE.naverMap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hb-btn-outline h-10 text-hb-xs sm:text-hb-sm font-bold"
                    >
                      <span>네이버 지도 길찾기</span>
                    </a>
                    <a
                      href={STORE_NAVIGATION.kakaoTo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hb-btn-outline h-10 text-hb-xs sm:text-hb-sm font-bold"
                    >
                      <span>카카오맵 길찾기</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* 우측 (5열): 실시간 고객 문의 현황 보드 (실데이터 누적 건수·답변율·상대시각 표시) */}
              <div className="lg:col-span-5 min-w-0 flex flex-col justify-between">
                <div className="rounded-2xl border border-[#E2DDD3] bg-white overflow-hidden flex-1 flex flex-col justify-between shadow-2xs">
                  <div>
                    {/* 상단 실시간 접수 헤더 + 실데이터 활동 지표 */}
                    <div className="bg-[#FAF9F6] border-b border-[#E2DDD3] px-4 py-3.5 sm:px-5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-2 min-w-0">
                          <Icon
                            d={ICON.chat}
                            className="h-4 w-4 text-[#C84312] shrink-0"
                          />
                          <h3 className="text-hb-sm sm:text-hb-base font-bold text-[#141A23] truncate">
                            실시간 접수된 문의 현황
                          </h3>
                        </div>
                        <Link
                          href="/inquiry"
                          className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#C84312] hover:underline shrink-0"
                        >
                          <span>전체 게시판</span>
                          <Icon d={ICON.right} className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      {/* 실데이터 기반 3단 활동 요약 */}
                      <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[#E2DDD3] bg-[#E2DDD3]">
                        <div className="bg-white px-2.5 py-2 text-center">
                          <span className="block text-hb-xs text-[#64748B]">
                            누적 접수
                          </span>
                          <strong className="mt-0.5 block font-mono text-hb-sm font-extrabold text-[#141A23] tabular-nums">
                            {typeof totalInquiryCount === "number" &&
                            totalInquiryCount > 0
                              ? `${totalInquiryCount.toLocaleString()}건`
                              : `${recent.length}건`}
                          </strong>
                        </div>
                        <div className="bg-white px-2.5 py-2 text-center">
                          <span className="block text-hb-xs text-[#64748B]">
                            최근 답변율
                          </span>
                          <strong className="mt-0.5 block font-mono text-hb-sm font-extrabold text-[#0F766E] tabular-nums">
                            {inquiryActivity.totalShown > 0
                              ? `${inquiryActivity.answeredRate}%`
                              : "신속 응대"}
                          </strong>
                        </div>
                        <div className="bg-white px-2.5 py-2 text-center">
                          <span className="block text-hb-xs text-[#64748B]">
                            매입 · 구매
                          </span>
                          <strong className="mt-0.5 block font-mono text-hb-xs sm:text-hb-sm font-extrabold text-[#C84312] tabular-nums">
                            {inquiryActivity.totalShown > 0
                              ? `${inquiryActivity.sellCount} · ${inquiryActivity.buyOrBulkCount}`
                              : "상시 접수"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* 최근 문의 피드 리스트 */}
                    <div className="px-4 sm:px-5">
                      {recent.length === 0 ? (
                        <div className="py-6 text-hb-xs text-[#334155] space-y-1.5">
                          <p className="font-bold text-[#141A23]">
                            비밀번호로 보호되는 1:1 비공개 견적 게시판입니다.
                          </p>
                          <p className="text-[#475569] leading-relaxed break-keep">
                            가전 구매 재고 확인, 방문 매입, 식당·카페 업소용 묶음 견적을 남겨주시면 신속히 안내해 드립니다.
                          </p>
                        </div>
                      ) : (
                        <>
                          <ul className="divide-y divide-[#F1F3F6]">
                            {(showAllRecent ? recent : recent.slice(0, 7)).map(
                              (r) => {
                                const isDone = isInquiryAnswered(r.status);
                                const tone = getInquiryTypeTone(r.inquiry_type);
                                const cleanCategory = (
                                  r.category || "상담 문의"
                                ).replace(/^\[[^\]]+\]\s*/, "");
                                const relDate = formatInquiryRelativeDate(
                                  r.created_at
                                );

                                const typeBadgeClass =
                                  tone === "sell"
                                    ? "bg-[#FFF4EE] text-[#C84312] border border-[#FED7AA]"
                                    : tone === "bulk"
                                    ? "bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4]"
                                    : "bg-[#F1F3F6] text-[#141A23] border border-[#E2E6EC]";

                                return (
                                  <li
                                    key={r.id}
                                    className="flex items-center justify-between gap-2 py-2.5 text-hb-xs"
                                  >
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                      <span
                                        className={`shrink-0 rounded-md px-2 py-0.5 text-hb-xs font-bold leading-none ${typeBadgeClass}`}
                                      >
                                        {getInquiryTypeLabel(r.inquiry_type)}
                                      </span>
                                      <Link
                                        href="/inquiry"
                                        className="min-w-0 flex-1 truncate text-hb-xs sm:text-hb-sm font-semibold text-[#141A23] hover:text-[#C84312] transition-colors"
                                      >
                                        {cleanCategory || "상담 문의"}
                                      </Link>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5 text-hb-xs">
                                      <span className="text-[#475569] font-medium">
                                        {r.masked_name || maskName(r.name)}
                                      </span>
                                      {relDate && (
                                        <span className="hidden sm:inline font-mono text-hb-xs text-[#64748B] tabular-nums">
                                          {relDate}
                                        </span>
                                      )}
                                      <span
                                        className={`rounded-md px-1.5 py-0.5 text-hb-xs font-bold leading-none ${
                                          isDone
                                            ? "bg-[#F0FDFA] text-[#0F766E] border border-[#0D9488]/25"
                                            : "bg-[#FFF4EE] text-[#C84312] border border-[#C84312]/25"
                                        }`}
                                      >
                                        {r.status ?? INQUIRY_STATUS.RECEIVED}
                                      </span>
                                    </div>
                                  </li>
                                );
                              }
                            )}
                          </ul>

                          {recent.length > 7 && (
                            <div className="pt-2 pb-1 text-center">
                              <button
                                type="button"
                                onClick={() => setShowAllRecent((v) => !v)}
                                className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#475569] hover:text-[#141A23] cursor-pointer"
                              >
                                <span>
                                  {showAllRecent
                                    ? "접기"
                                    : `최근 문의 ${recent.length - 7}건 더 보기`}
                                </span>
                                <Icon
                                  d={ICON.down}
                                  className={`h-3.5 w-3.5 transition-transform ${
                                    showAllRecent ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* 하단 즉시 견적 접수 영역 */}
                  <div className="mt-2 border-t border-[#E2DDD3] bg-[#FAF9F6] px-4 py-3.5 sm:px-5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-hb-xs text-[#475569]">
                      <span className="font-mono font-semibold tabular-nums">
                        {STORE.tel} · {STORE.mobile}
                      </span>
                      <span className="font-bold text-[#0F766E]">
                        비공개 비밀글 · 사진 첨부 가능
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openInquiry("구매 문의")}
                        className="hb-btn-accent min-h-[42px] h-10 px-3 text-hb-xs font-bold cursor-pointer active:scale-[0.96]"
                      >
                        <Icon d={ICON.pen} className="w-3.5 h-3.5" />
                        <span>1:1 간편 견적 접수</span>
                      </button>
                      <Link
                        href="/inquiry?write=1"
                        className="hb-btn-outline min-h-[42px] h-10 px-3 text-hb-xs font-bold active:scale-[0.96]"
                      >
                        <span>
                          {typeof totalInquiryCount === "number" &&
                          totalInquiryCount > 0
                            ? `문의글 작성 (${totalInquiryCount}건+)`
                            : "상세 문의글 작성 →"}
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [5/6] 배송 · 설치 현장 기록 (#reviews-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="reviews-section"
          className="border-b border-[#E2E6EC] bg-[#F7F8FA] py-8 sm:py-11"
          aria-labelledby="review-title"
        >
          <div className="hb-container">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-4 border-b border-[#E2E6EC]">
              <SectionHeading
                title={<span id="review-title" className="[text-wrap:balance]">직영 배송 · 설치 현장 기록</span>}
                desc={`가정집부터 식당·카페·사무실까지 ${STORE.name}가 직접 배송·설치한 현장 사진입니다.`}
              />
              <div className="flex items-center gap-3 shrink-0">
                {reviews.length > 0 && (
                  <span className="text-hb-xs sm:text-hb-sm font-bold text-[#475569] tabular-nums">
                    현장 기록{" "}
                    <strong className="text-[#141A23]">{reviews.length}</strong>건
                  </span>
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
                  className="inline-flex rounded-xl border border-[#E2E6EC] bg-white p-1"
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
                  <Icon d={ICON.shieldCheck} className="w-3.5 h-3.5 text-[#E8521A]" />
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
              <div className="mt-6 flex flex-col items-start gap-4 border-y border-[#E2E6EC] bg-white px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
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
                        className="group relative flex w-[68vw] max-w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[#E2E6EC] bg-white shadow-2xs hover:border-[#CBD2DC] hover:shadow-card hover:-translate-y-0.5 transition-[border-color,box-shadow,transform] duration-150 sm:w-auto sm:max-w-none sm:shrink"
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
                        <div className="bg-white px-3 py-2.5 border-t border-[#E2E6EC] flex items-center justify-between gap-2">
                          <p className="line-clamp-1 text-hb-xs font-bold text-[#141A23] group-hover:text-[#C84312] transition-colors min-w-0">
                            {r.title || "배송 및 설치 완료"}
                          </p>
                          <Link
                            href={bridge.href}
                            className="shrink-0 inline-flex items-center gap-0.5 rounded-md bg-[#F7F8FA] border border-[#E2E6EC] px-2 py-0.5 text-hb-xs font-bold text-[#C84312] hover:border-[#C84312] hover:bg-[#FFF4EE] transition-colors"
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

        {/* ════════════════════════════════════════════════════════════
            [5/7] 개인 직거래 vs 직영 매장 비교 (VS 디시전 카드)
            ════════════════════════════════════════════════════════════ */}
        <AiRecommendationGuideSection />

        {/* ════════════════════════════════════════════════════════════
            [6/7] 자주 묻는 질문 (#faq-section — 12컬럼 에디토리얼 + 주제 필터)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="faq-section"
          className="border-b border-[#E2E6EC] bg-white py-10 sm:py-14"
          aria-labelledby="faq-title"
        >
          <div className="hb-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-start">
              {/* 좌측 4컬럼: 제목 · 주제 필터 · 빠른 상담 카드 */}
              <div className="lg:col-span-4 lg:sticky lg:top-24">
                <p className="font-mono text-hb-xs font-bold uppercase tracking-widest text-[#C84312]">
                  FAQ &amp; GUIDE
                </p>
                <h2
                  id="faq-title"
                  className="mt-1.5 text-hb-xl sm:text-hb-2xl font-extrabold tracking-tight text-[#141A23] leading-tight break-keep [text-wrap:balance]"
                >
                  자주 묻는 질문
                </h2>
                <p className="mt-2 text-hb-sm text-[#475569] leading-relaxed break-keep">
                  보증 기준, 배송·설치 비용, 기존 가전 매입까지 구매 전 가장 많이 확인하시는 내용을 모았습니다.
                </p>

                {/* 주제별 필터 탭 */}
                <div
                  className="mt-5 flex flex-wrap gap-2"
                  role="tablist"
                  aria-label="자주 묻는 질문 주제 필터"
                  onKeyDown={(e) =>
                    handleTabListKeyDown(
                      e,
                      FAQ_FILTER_OPTIONS.map((o) => o.key),
                      faqFilter,
                      (next) => {
                        setFaqFilter(next);
                        setOpenFaq(0);
                      }
                    )
                  }
                >
                  {FAQ_FILTER_OPTIONS.map((opt) => {
                    const active = faqFilter === opt.key;
                    const count =
                      opt.key === "all"
                        ? FAQS.length
                        : FAQS.filter((f) => f.group === opt.key).length;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        role="tab"
                        tabIndex={active ? 0 : -1}
                        aria-selected={active}
                        onClick={() => {
                          setFaqFilter(opt.key);
                          setOpenFaq(0);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-hb-xs font-bold transition-colors cursor-pointer ${
                          active
                            ? "bg-[#141A23] text-white"
                            : "border border-[#E2E6EC] bg-[#F7F8FA] text-[#475569] hover:border-[#141A23] hover:text-[#141A23]"
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span
                          className={`font-mono tabular-nums ${
                            active ? "text-white/75" : "text-[#64748B]"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 바로 물어보기 안내 박스 */}
                <div className="mt-6 rounded-2xl border border-[#E2DDD3] bg-[#FAF9F6] p-4">
                  <p className="text-hb-xs font-bold text-[#141A23]">
                    찾으시는 내용이 없으신가요?
                  </p>
                  <p className="mt-1 text-hb-xs text-[#475569] leading-relaxed break-keep">
                    설치 공간 사진이나 모델명을 보내주시면 매장 담당자가 바로 확인해 드립니다.
                  </p>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openInquiry("구매 문의")}
                      className="hb-btn-primary h-9 px-3.5 text-hb-xs active:scale-[0.97]"
                    >
                      <Icon d={ICON.chat} className="h-3.5 w-3.5" />
                      <span>1:1 간편 문의</span>
                    </button>
                    <a
                      href={telHref(STORE.tel)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#CBD2DC] bg-white px-3.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] transition-colors tabular-nums"
                    >
                      <Icon d={ICON.phone} className="h-3.5 w-3.5 text-[#C84312]" />
                      <span>{STORE.tel}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* 우측 8컬럼: 아코디언 목록 */}
              <div className="lg:col-span-8" role="tabpanel" aria-label="선택한 주제의 자주 묻는 질문">
                <div className="divide-y divide-[#E2E6EC] rounded-2xl border border-[#E2E6EC] bg-white overflow-hidden">
                  {filteredFaqs.map((f, i) => {
                    const open = openFaq === i;
                    return (
                      <div
                        key={f.q}
                        className={`transition-colors ${
                          open ? "bg-[#FAF9F6]" : "bg-white hover:bg-[#F7F8FA]"
                        }`}
                      >
                        <h3>
                          <button
                            type="button"
                            id={`faq-q-${i}`}
                            aria-expanded={open}
                            aria-controls={`faq-a-${i}`}
                            onClick={() => setOpenFaq(open ? null : i)}
                            className="flex w-full items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left cursor-pointer"
                          >
                            <div className="min-w-0">
                              <span className="inline-block rounded-md bg-white border border-[#E2E6EC] px-2 py-0.5 text-hb-xs font-bold text-[#64748B]">
                                {f.tag}
                              </span>
                              <span className="mt-1.5 flex items-start gap-2.5">
                                <span className="font-mono text-hb-xs sm:text-hb-sm font-bold text-[#C84312] shrink-0 pt-0.5 tabular-nums">
                                  Q{String(i + 1).padStart(2, "0")}.
                                </span>
                                <span className="block text-hb-sm sm:text-hb-base font-bold leading-snug text-[#141A23] break-keep">
                                  {f.q}
                                </span>
                              </span>
                            </div>
                            <span
                              className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-transform duration-200 ${
                                open
                                  ? "rotate-45 bg-[#141A23] text-white border-[#141A23]"
                                  : "bg-white border-[#CBD2DC] text-[#141A23]"
                              }`}
                            >
                              <Icon d={ICON.plus} className="h-3.5 w-3.5" />
                            </span>
                          </button>
                        </h3>
                        <div
                          id={`faq-a-${i}`}
                          role="region"
                          aria-labelledby={`faq-q-${i}`}
                          aria-hidden={!open}
                          data-open={open ? "true" : "false"}
                          inert={!open}
                          className="hb-faq-panel"
                        >
                          <div className="px-5 pb-5 sm:px-6 sm:pl-14 text-hb-xs sm:text-hb-sm leading-[1.75] text-[#475569] break-keep [text-wrap:pretty]">
                            {f.a.includes(STORE.tel) ? (
                              <>
                                {f.a.split(STORE.tel).map((part, pIdx, arr) => (
                                  <React.Fragment key={pIdx}>
                                    {part}
                                    {pIdx < arr.length - 1 && (
                                      <a
                                        href={telHref(STORE.tel)}
                                        className="font-bold text-[#E8521A] hover:underline underline-offset-2 tabular-nums"
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
                              <div className="mt-3.5 pt-3 border-t border-[#E2DDD3] flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => setAirconModalOpen(true)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD2DC] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-[#F7F8FA] active:scale-[0.96] transition-[border-color,background-color,transform] duration-150 cursor-pointer"
                                >
                                  <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#E8521A]" />
                                  <span>에어컨 세트 구성 안내문 크게 보기</span>
                                </button>
                                <Link
                                  href="/gallery?category=에어컨/냉난방기"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#141A23] px-3 py-1.5 text-hb-xs font-bold text-white hover:bg-[#232B36] active:scale-[0.96] transition-[background-color,transform] duration-150"
                                >
                                  <span>에어컨 실매물 보러가기 →</span>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [7/7] 가전 · 전기 · 설치 정보 게시판 비주얼 쇼케이스
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
      {airconModalOpen && (
        <AirconGuideModal
          open={airconModalOpen}
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
            className="w-full rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E2E6EC]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-hb-lg font-bold text-[#141A23]">
                배송·설치 인증사진 등록
              </h2>
              <button
                type="button"
                onClick={closeReviewModal}
                aria-label="닫기"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#F1F3F6] text-[#334155] active:scale-[0.96] transition-[background-color,transform]"
              >
                <Icon d={ICON.close} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="hb-label" htmlFor="review-title">
                제목
              </label>
              {isAnalyzingReview && (
                <span className="text-hb-xs font-semibold text-[#E8521A]">
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
                  className="relative aspect-square overflow-hidden rounded-lg bg-[#F1F3F6]"
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
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CBD2DC] bg-[#F7F8FA] text-hb-xs font-semibold text-[#64748B] hover:border-[#E8521A] hover:text-[#E8521A] active:scale-[0.96] transition-[border-color,color,transform] duration-150">
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
