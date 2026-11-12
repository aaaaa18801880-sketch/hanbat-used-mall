// 파일 경로: components/home/home-page-client.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import {
  supabase,
  isAuthorizedAdminUser,
  getAdminAuthHeaders,
} from "../../lib/supabase";
import { serializeJsonLd } from "../../lib/json-ld";
import {
  Icon,
  ICON,
  SafeImg,
  Modal,
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
  SectionHeading,
  AdminLoginModal,
} from "../../lib/ui";
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
import { ModernApplianceIcon } from "../ui/modern-icons";
import { AiRecommendationGuideSection } from "./ai-recommendation-guide-section";

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
  inquiry_type: string | null;
  category: string | null;
  name: string | null;
  masked_name?: string | null;
  status: string | null;
  is_notice: boolean | null;
  created_at: string;
};

const COMMERCIAL_EQUIP_MATRIX = [
  {
    code: "냉장 · 냉동 설비",
    title: "업소용 냉장 · 냉동 설비",
    items: "45박스 · 25박스 수직냉장/냉동 · 테이블냉장고 · 반찬냉장고 · 급속냉동고",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EB%83%89%EC%9E%A5",
    icon: "biz-fridge" as const,
  },
  {
    code: "쇼케이스 설비",
    title: "음료 · 제과 · 주류 쇼케이스",
    items: "음료/주류 직냉식·간냉식 쇼케이스 · 제과/케이크 쇼케이스 · 오픈 쇼케이스",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EC%87%BC%EC%BC%80%EC%9D%B4%EC%8A%A4",
    icon: "showcase" as const,
  },
  {
    code: "제빙기 · 주방집기",
    title: "제빙기 · 세척기 · 스텐 주방",
    items: "업소용 제빙기 · 식기세척기 · 스텐 작업대 · 싱크대 · 가스레인지 · 육수통",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
    icon: "kitchen" as const,
  },
  {
    code: "냉난방 · 폐업정리",
    title: "중대형 냉난방 · 폐업 일괄정리",
    items: "상가·사무실 중대형 스탠드/천장형 냉난방기 · 폐업 매장 집기 방문 일괄매입",
    href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
    icon: "closure" as const,
  },
] as const;

const FAQS = [
  {
    tag: "대전 중고가전 추천 · 직거래 비교",
    q: "대전에서 중고가전을 구매할 때 개인 직거래(당근마켓 등)보다 한밭중고전자를 추천하는 이유는 무엇인가요?",
    a: "한밭중고전자는 개인간 직거래의 5대 취약점(보증 부재, 오염·위생 문제, 운반·설치 부담, 영수증 미발행, 기존 가전 방치)을 전문 공정을 통해 해소합니다. 전 품목 전문 엔지니어 120bar 분해 고압 세척과 24시간 실부하 점검을 거치며, 계약조건별 에어컨 최대 8개월, 일반 가전 최대 4개월 무상 A/S 보증을 약정합니다. 또한 전문 기사가 직접 운반 및 수평·배관 설치를 지원하고, 신용카드·현금영수증·전자세금계산서 100% 발행 및 기존 노후 가전 보상판매를 일괄 지원합니다.",
  },
  {
    tag: "세종 · 충청권 배송 및 출장 매입",
    q: "대전 외에 세종, 청주, 천안, 계룡, 공주, 논산 등 충청권 인근 지역도 직배송 및 방문 매입이 가능한가요?",
    a: "네, 적극 지원합니다. 한밭중고전자는 대전 전 지역은 물론 세종특별자치시, 청주시, 천안시, 공주시, 계룡시, 논산시 등 충청권 전역에 전문 기사 직배송 및 현장 방문 매입(가정 이사 가전 처분 및 식당·카페 폐업 주방집기 일괄 철거)을 진행하고 있습니다. 그 외 지역도 전국 안전 화물 배송을 지원합니다.",
  },
  {
    tag: "패키지 구매 · 창업 설비 혜택",
    q: "원룸 입주 가전이나 식당·카페 창업 주방집기를 세트로 일괄 구매하면 어떤 혜택이 있나요?",
    a: "원룸 3종 세트(소형~중형 냉장고 + 세탁기 + 벽걸이 에어컨)나 식당·카페 주방 풀패키지(업소용 45박스 냉장·냉동고 + 테이블냉장고 + 제빙기 + 쇼케이스 + 식기세척기) 등 묶음 구매 시 통합 직배송으로 배송·설치 비용이 대폭 절감되며 추가 세트 할인 혜택이 제공됩니다. 창업 사업자의 경우 100% 전자세금계산서 발행을 통해 부가세 환급 및 종합소득세 필요경비 증빙을 꼼꼼히 지원합니다.",
  },
  {
    tag: "A/S 접수 · 보증 범위",
    q: "사용 중 문제가 생기면 무상 A/S는 어떻게 신청하며, 보증 기준은 무엇인가요?",
    a: `대표전화(${STORE.tel})나 카카오톡 채널로 증상을 알려주시면 담당 기사가 증상을 확인한 뒤 방문 수리 또는 동일 급 제품 교환으로 신속히 처리해 드립니다. 정상적인 사용 중 발생한 기기 기능 불량(냉매 누설, 콤프레샤·모터 불량 등)은 약정된 보증 기간 내 무상 처리되며, 고객 과실로 인한 파손이나 단순 소모품은 실비로 안내됩니다. (※ 무상 A/S 기간 및 세부 적용 범위는 품목 특성 및 판매 계약서 약정에 따라 상이할 수 있으며, 거래 시 계약 조건을 기준으로 적용됩니다.)`,
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
    a: `한밭중고전자의 에어컨 및 냉난방기 제품은 원활한 냉난방 성능과 냉매 사이클 호환 보증을 위해 실내기와 실외기가 1:1 세트로 구성되어 판매됩니다. 실외기만 별도로 단독 구매하시는 것은 어려우며 반드시 세트 단위로 출고됩니다. 현장 평수와 배관 환경에 맞춘 최적 모델 상담은 대표전화(${STORE.tel})나 카카오톡으로 편하게 문의해 주세요.`,
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

/* ════════════════════════════════════════════════════════════
   2. 메인 페이지 컴포넌트 (Modern Appliance Showroom 아키텍처)
   ════════════════════════════════════════════════════════════ */
export default function Home({
  initialProducts,
  initialReviews,
}: {
  initialProducts: ProductItem[] | null;
  initialReviews: Review[] | null;
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
  const [recent, setRecent] = useState<InquiryRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  /* UI 인터랙션 상태 (FAQ 기본 닫힘) */
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [guideTab, setGuideTab] = useState<"faq" | "comparison">("faq");
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const syncGuideHash = () => {
      if (window.location.hash === "#buying-guide-section") {
        setGuideTab("comparison");
      }
    };
    syncGuideHash();
    window.addEventListener("hashchange", syncGuideHash);
    return () => window.removeEventListener("hashchange", syncGuideHash);
  }, []);
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
      if (initialProducts === null) void loadFeaturedProducts();
      if (initialReviews === null) void loadReviews();
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
  }, [
    initialProducts,
    initialReviews,
    loadFeaturedProducts,
    loadReviews,
    loadRecent,
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

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(STORE.roadAddress);
      toast.success(`도로명 주소(${STORE.roadAddress})가 복사되었습니다.`);
    } catch {
      toast.error("주소 복사에 실패했습니다.");
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
    <div className="min-h-screen flex flex-col bg-white text-[#141A23]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
      />

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

      <main id="main-content" className="flex-1">
        {/* ════════════════════════════════════════════════════════════
            [S1] 쇼룸 아키텍처 히어로 (좌: 핵심 메시지 & 듀얼 액션 독 + 3대 지표 / 우: 직영 쇼룸 & 실시간 입고 매물 프리뷰)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="hero-section"
          aria-labelledby="hero-title"
          className="relative w-full border-b border-[#E2E6EC] hb-ambient-hero"
        >
          <div className="hb-container py-8 sm:py-11 lg:py-12">
            <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
              {/* 좌측 (7열): 브리핑 아이브로우 + H1 + 정돈된 3버튼 액션 독 */}
              <div className="lg:col-span-7 min-w-0 flex flex-col justify-center">
                <div>
                  <p className="hb-eyebrow tracking-tight">
                    SINCE {STORE.since} ({OPERATING_YEARS}년 운영) · 대전 중촌동 직영 매장
                  </p>

                  <h1
                    id="hero-title"
                    className="mt-3 hb-fluid-h1 text-[#141A23] break-keep font-bold [text-wrap:balance]"
                  >
                    분해 고압세척과 시운전을 마친
                    <br />
                    <span className="text-[#E8521A]">검증된 중고가전</span> · 업소용 설비
                  </h1>

                  <p className="mt-4 max-w-xl text-hb-sm sm:text-hb-base leading-[1.7] text-[#475569] break-keep">
                    가정용 냉장고·세탁기·에어컨부터 식당·카페 창업 주방설비까지, 전 품목 정밀 점검 후{" "}
                    <strong className="font-semibold text-[#141A23]">무상 A/S 보증</strong>과 함께 출고합니다.
                  </p>

                  {/* 핵심 행동 버튼 (시각적 소음 없는 2대 CTA + 직통 전화 바) */}
                  <div className="mt-6 space-y-3 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Link
                        href="/gallery"
                        className="hb-btn-primary rounded-xl px-5 py-4 justify-between text-left hover:-translate-y-0.5 hover:shadow-card-hover"
                      >
                        <div className="min-w-0">
                          <span className="block text-hb-xs font-semibold text-white/75">
                            세척·검수 완료 · 무상 A/S
                          </span>
                          <strong className="mt-1 flex items-baseline gap-2 text-hb-lg sm:text-hb-xl font-bold text-white tracking-tight">
                            <span>실매물 확인</span>
                            {sellingCount > 0 && (
                              <span className="text-hb-sm font-bold text-[#FF8A50] tabular-nums">
                                {sellingCount}대
                              </span>
                            )}
                          </strong>
                        </div>
                        <Icon d={ICON.arrow} className="w-5 h-5 shrink-0 text-[#FF8A50]" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          trackEvent("begin_buyback_inquiry", {
                            location: "hero_split_sell",
                          });
                          openInquiry("내 물건 팔기");
                        }}
                        className="hb-btn-accent rounded-xl px-5 py-4 justify-between text-left hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="block text-hb-xs font-semibold text-white/85">
                            방문 수거 · 당일 현금 정산
                          </span>
                          <strong className="mt-1 block text-hb-lg sm:text-hb-xl font-bold text-white tracking-tight">
                            쓰던 가전 팔기
                          </strong>
                        </div>
                        <Icon d={ICON.arrow} className="w-5 h-5 shrink-0 text-white" />
                      </button>
                    </div>

                    <a
                      href={telHref(STORE.tel)}
                      onClick={() =>
                        trackEvent("click_tel_consult", {
                          location: "hero_direct_phone_button",
                        })
                      }
                      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-[#CBD2DC] bg-white px-5 py-3.5 text-[#141A23] shadow-2xs hover:border-[#141A23] hover:bg-[#F7F8FA] active:scale-[0.98] transition-[border-color,background-color,transform] duration-150"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] text-[#E8521A]">
                          <Icon d={ICON.phone} className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                          <span className="block text-hb-xs font-semibold text-[#64748B]">
                            전화 연결 · 재고 및 매입 상담
                          </span>
                          <strong className="block text-hb-base sm:text-hb-lg font-bold text-[#141A23] tabular-nums tracking-tight">
                            {STORE.tel}
                          </strong>
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#F1F3F6] px-3.5 py-2 text-hb-xs sm:text-hb-sm font-bold text-[#141A23] group-hover:bg-[#141A23] group-hover:text-white transition-colors">
                        <span>전화걸기</span>
                        <Icon d={ICON.right} className="w-3.5 h-3.5" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>

              {/* 우측 (5열): 대형 쇼룸 사진 + 단일 주소/영업시간/길찾기 도크 */}
              <div className="lg:col-span-5 min-w-0 flex flex-col justify-between rounded-2xl overflow-hidden border border-[#E2E6EC] bg-white shadow-card">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#141A23]">
                  <SafeImg
                    src="/store-exterior.jpg"
                    alt={`${STORE.roadAddress}(${STORE.jibunAddress}) ${STORE.name} 1·2층 직영 대형 전시장 및 전용 주차장 실물 외관 전경`}
                    eager
                    className="h-full w-full object-cover object-center"
                  />
                </div>

                {/* 하단 단일 주소 + 영업시간 + 길찾기 도크 */}
                <div className="border-t border-[#E2E6EC] px-4 py-4 sm:px-5 bg-[#F7F8FA] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-1.5 text-hb-sm font-bold text-[#141A23] truncate max-w-full">
                      <Icon d={ICON.pin} className="w-3.5 h-3.5 shrink-0 text-[#E8521A]" />
                      <span className="truncate">{STORE.roadAddress}</span>
                    </p>
                    <p className="mt-0.5 text-hb-xs text-[#64748B] truncate tabular-nums">
                      1·2층 직영 매장 · {STORE.hours} · {STORE.parking}
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
                    className="group shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[#CBD2DC] bg-white px-4 py-2.5 text-hb-xs sm:text-hb-sm font-bold text-[#141A23] shadow-2xs hover:border-[#E8521A] hover:bg-[#E8521A] hover:text-white active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 cursor-pointer"
                  >
                    <span>길찾기</span>
                    <Icon
                      d={ICON.right}
                      className="w-3.5 h-3.5 text-[#E8521A] group-hover:text-white transition-[color,transform] duration-150 group-hover:translate-x-0.5"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [2/6] 품목별 쇼룸 탐색 바 + 실시간 쇼룸 전시 매물
            ════════════════════════════════════════════════════════════ */}
        <section
          aria-label="품목별 카탈로그 및 실시간 전시 매물"
          className="border-b border-[#E2E6EC] bg-white"
        >
          <CategoryPictogramBar
            embedded
            selectedKey={selectedCategory.key}
            categoryCounts={categoryCounts}
            onSelectCategory={(item) => {
              setSelectedCategory(item);
            }}
          />

          <FeaturedProductsSection
            embedded
            products={featuredProducts}
            loading={productsLoading}
            error={productsError}
            onRetry={loadFeaturedProducts}
            selectedCategory={selectedCategory}
            onResetCategory={() => setSelectedCategory(SHOWROOM_CATEGORIES[0])}
          />
        </section>

        {/* ════════════════════════════════════════════════════════════
            [3/6] 업소·창업 설비 도입(#business-section) + 쓰던 가전 매입 기준(#sell-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="business-section"
          className="border-b border-[#E2E6EC]"
          aria-labelledby="business-title"
        >
          {/* 상단 다크 네이비 B2B 쇼룸 밴드 */}
          <div className="bg-[#141A23] hb-dark-mesh relative overflow-hidden text-white py-10 sm:py-14 border-b border-[#263040]">
            <div className="hb-container">
              <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-start">
                {/* 좌측 (5열): 업소용 핵심 메시지 & 전용 CTA */}
                <div className="lg:col-span-5 min-w-0">
                  <span className="text-hb-xs sm:text-hb-sm font-bold text-[#FB923C]">
                    업소용 설비 · 사업자 전용
                  </span>
                  <h2
                    id="business-title"
                    className="mt-2.5 text-hb-2xl sm:text-hb-3xl font-bold text-white tracking-tight leading-[1.25] break-keep [text-wrap:balance]"
                  >
                    식당·카페 창업 설비 도입부터
                    <br />
                    폐업 매장 일괄 정리까지
                  </h2>
                  <p className="mt-3 text-hb-sm sm:text-hb-base text-white/75 leading-relaxed break-keep [text-wrap:balance]">
                    45박스 냉장고·쇼케이스·제빙기·냉난방기 맞춤 패키지 납품 및 전자세금계산서 100% 발행
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openInquiry("대량·업소용 상담")}
                      className="hb-btn-accent h-12 px-6 text-hb-base font-bold cursor-pointer active:scale-[0.96]"
                    >
                      <span>업소용 견적 · 철거 상담</span>
                      <Icon d={ICON.arrow} className="w-4 h-4" />
                    </button>
                    <Link
                      href="/gallery?category=업소용기기"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 active:scale-[0.96] h-12 px-5 text-hb-sm font-bold text-white transition-[background-color,transform] duration-150"
                    >
                      <span>업소용 설비 실매물 보기 →</span>
                    </Link>
                  </div>
                </div>

                {/* 우측 (7열): 경계선 기반 2×2 업소용 주력 품목 매트릭스 */}
                <div className="lg:col-span-7 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {COMMERCIAL_EQUIP_MATRIX.map((cell) => (
                    <Link
                      key={cell.code}
                      href={cell.href}
                      className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.10] hover:border-white/25 hover:-translate-y-0.5 active:scale-[0.96] transition-[background-color,border-color,transform] duration-150 overflow-hidden"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ModernApplianceIcon name={cell.icon} dark className="w-8 h-8" />
                            <span className="font-mono text-hb-xs font-bold text-[#FB923C]">
                              {cell.code}
                            </span>
                          </div>
                          <Icon
                            d={ICON.arrow}
                            className="w-4 h-4 text-white/40 group-hover:text-[#FB923C] group-hover:translate-x-1 transition-[color,transform] duration-150"
                          />
                        </div>
                        <h3 className="mt-2 text-hb-lg font-bold text-white group-hover:text-[#FB923C] transition-colors">
                          {cell.title}
                        </h3>
                        <p className="mt-1.5 text-hb-xs sm:text-hb-sm text-white/70 leading-relaxed break-keep">
                          {cell.items}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 하단 가전 팔기 한 줄 배너 — 상세 기준·사진 접수는 전용 매입 페이지(/purchase)로 분리 */}
          <div
            id="sell-section"
            className="bg-[#F7F8FA] py-5 sm:py-6"
            aria-labelledby="sell-title"
          >
            <div className="hb-container flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#FFF4EE] border border-[#FED7AA] px-2.5 py-0.5 text-hb-xs font-bold text-[#E8521A]">
                    가전 · 설비 팔기
                  </span>
                  <h2
                    id="sell-title"
                    className="text-hb-base sm:text-hb-lg font-bold text-[#141A23] tracking-tight"
                  >
                    안 쓰는 가전·식당 폐업 설비 방문 매입
                  </h2>
                </div>
                <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#4E5968] break-keep">
                  사진과 명판만 보내주시면 대전·세종·충청 당일 방문 수거 후 현장 즉시 입금해 드립니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href="/purchase"
                  className="hb-btn-accent h-10 sm:h-11 px-4 sm:px-5 text-hb-xs sm:text-hb-sm font-bold active:scale-[0.96]"
                >
                  <span>매입 기준 · 사진 견적 신청</span>
                  <Icon d={ICON.arrow} className="w-3.5 h-3.5" />
                </Link>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-10 sm:h-11 px-4 text-hb-xs sm:text-hb-sm font-bold active:scale-[0.96]"
                >
                  <Icon d={ICON.chat} className="w-3.5 h-3.5" />
                  <span>카카오톡 사진 문의</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [4/6] 오프라인 직영 쇼룸 및 실시간 상담 안내 (#inquiry-section + #location-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="inquiry-section"
          className="border-b border-[#E2E6EC] bg-white py-8 sm:py-11"
          aria-labelledby="cta-title"
        >
          <div className="hb-container">
            <SectionHeading
              eyebrow="오프라인 매장 · 직배송 안내"
              title={<span id="cta-title" className="[text-wrap:balance]">오프라인 매장 오시는 길 및 실시간 문의</span>}
              desc="대전·세종·충청권 직배송 지원 및 중촌동 매장 실물 확인·현장 상차가 가능합니다."
            />

            <div className="mt-5 grid gap-5 lg:grid-cols-12 items-stretch">
              {/* 좌측 (7열): 오프라인 매장 지도 및 주소·편의시설 일체형 카드 (#location-section) */}
              <div
                id="location-section"
                aria-labelledby="location-title"
                className="lg:col-span-7 min-w-0 flex flex-col overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white shadow-2xs"
              >
                <div className="relative h-[200px] sm:h-[225px] w-full bg-[#F1F3F6]">
                  <iframe
                    title="한밭중고전자 매장 위치 지도"
                    src="https://maps.google.com/maps?q=%EB%8C%80%EC%A0%84+%EC%A4%91%EA%B5%AC+%EC%A4%91%EC%B4%8C%EB%8F%99+144&t=&z=16&ie=UTF8&iwloc=&output=embed"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 h-full w-full border-0"
                    allowFullScreen
                  />
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between border-t border-[#E2E6EC] bg-white space-y-3.5">
                  {/* 상단 주소 및 주소 복사 */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <span className="text-hb-xs font-bold text-[#E8521A]">
                        대전 중촌동 오프라인 매장
                      </span>
                      <h3
                        id="location-title"
                        className="mt-0.5 text-hb-base sm:text-hb-lg font-bold text-[#141A23] break-keep [text-wrap:balance]"
                      >
                        {STORE.roadAddress}
                      </h3>
                      <p className="mt-0.5 text-hb-xs text-[#475569]">
                        지번: {STORE.jibunAddress} ({STORE.addressNote}) · {STORE.hours} ({STORE.closed})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="hb-btn-outline h-8 px-3 text-hb-xs shrink-0 self-start active:scale-[0.96]"
                    >
                      <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#E8521A]" />
                      <span>주소 복사</span>
                    </button>
                  </div>

                  {/* 쇼룸 방문 3대 핵심 요약 (슬림 인라인 스트립) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-[#E2E6EC] text-hb-xs">
                    <div className="rounded-lg bg-[#F7F8FA] px-3 py-2">
                      <span className="font-bold text-[#0F766E] block">전용 주차 8대</span>
                      <span className="text-[#64748B]">1톤 화물 진입 수월</span>
                    </div>
                    <div className="rounded-lg bg-[#F7F8FA] px-3 py-2">
                      <span className="font-bold text-[#0369A1] block">현장 전원 점검</span>
                      <span className="text-[#64748B]">확인 후 당일 상차</span>
                    </div>
                    <div className="rounded-lg bg-[#F7F8FA] px-3 py-2">
                      <span className="font-bold text-[#E8521A] block">중촌고가교 밑</span>
                      <span className="text-[#64748B]">버스정류장 도보 2분</span>
                    </div>
                  </div>

                  {/* 지도 앱 길찾기 (차분한 2버튼 통합) */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={STORE.naverMap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hb-btn-outline h-10 text-hb-xs sm:text-hb-sm font-bold"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-[#03C75A]" />
                      <span>네이버 지도 길찾기</span>
                    </a>
                    <a
                      href="https://map.kakao.com/link/to/한밭중고전자,36.335503,127.406981"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hb-btn-outline h-10 text-hb-xs sm:text-hb-sm font-bold"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-[#F5C400]" />
                      <span>카카오맵 길찾기</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* 우측 (5열): 실시간 접수 문의 현황 + 빠른 상담 연결 바 */}
              <div className="lg:col-span-5 min-w-0 flex flex-col justify-between space-y-3.5">
                <div className="rounded-2xl border border-[#E2E6EC] bg-white p-4 sm:p-5 flex-1 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E6EC]">
                      <h3 className="text-hb-sm sm:text-hb-base font-bold text-[#141A23]">
                        최근 접수된 문의 현황
                      </h3>
                      <Link
                        href="/inquiry"
                        className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#E8521A] hover:underline"
                      >
                        <span>전체 게시판</span>
                        <Icon d={ICON.right} className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    {recent.length === 0 ? (
                      <div className="py-3.5 text-hb-xs text-[#334155] space-y-1.5">
                        <p className="font-bold text-[#141A23]">
                          비밀번호로 보호되는 실시간 1:1 견적 게시판입니다.
                        </p>
                        <p className="text-[#64748B] leading-relaxed break-keep">
                          가전 구매 재고 확인, 방문 매입, 식당·카페 업소용 묶음 견적을 남겨주시면 신속히 안내해 드립니다.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-[#E2E6EC]">
                        {recent.slice(0, 4).map((r) => {
                          const isDone =
                            r.status === "답변완료" || r.status === "처리완료";
                          const cleanCategory = (r.category || "상담 문의").replace(
                            /^\[[^\]]+\]\s*/,
                            ""
                          );
                          return (
                            <li
                              key={r.id}
                              className="flex items-center justify-between gap-2.5 py-2.5 text-hb-xs sm:text-hb-sm"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <span className="shrink-0 rounded-md bg-[#F1F3F6] px-2 py-0.5 text-hb-xs font-semibold text-[#141A23]">
                                  {getInquiryTypeLabel(r.inquiry_type)}
                                </span>
                                <Link
                                  href="/inquiry"
                                  className="min-w-0 flex-1 truncate font-semibold text-[#141A23] hover:text-[#E8521A] transition-colors"
                                >
                                  {cleanCategory || "상담 문의"}
                                </Link>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 text-hb-xs">
                                <span className="text-[#64748B]">
                                  {r.masked_name || maskName(r.name)}
                                </span>
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-hb-xs font-semibold ${
                                    isDone
                                      ? "bg-[#F0FDFA] text-[#0D9488] border border-[#0D9488]/20"
                                      : "bg-[#FFF4EE] text-[#E8521A] border border-[#E8521A]/20"
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

                  <div className="mt-2.5 pt-2.5 border-t border-[#E2E6EC] flex items-center justify-between text-hb-xs">
                    <span className="text-[#64748B]">사진 첨부 및 비공개 견적 글쓰기</span>
                    <Link
                      href="/inquiry?write=1"
                      className="font-bold text-[#E8521A] hover:underline"
                    >
                      온라인 문의 작성 →
                    </Link>
                  </div>
                </div>

                {/* 하단: 빠른 상담 연결 바 */}
                <div className="rounded-2xl border border-[#E2E6EC] bg-[#F7F8FA] p-4 sm:p-5 shadow-2xs">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-hb-xs font-bold text-[#E8521A]">
                        빠른 상담 연결
                      </span>
                      <a
                        href={telHref(STORE.tel)}
                        className="mt-0.5 block text-hb-lg sm:text-hb-xl font-bold text-[#141A23] hover:text-[#E8521A] tabular-nums"
                      >
                        {STORE.tel}
                      </a>
                    </div>
                    <a
                      href={telHref(STORE.mobile)}
                      className="text-hb-xs font-semibold text-[#334155] hover:text-[#141A23] tabular-nums"
                    >
                      직통 휴대전화 {STORE.mobile}
                    </a>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                      href={STORE.kakaoChat}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackEvent("click_kakao_consult", {
                          location: "inquiry_aside",
                        })
                      }
                      className="hb-btn-kakao h-10 px-3 text-hb-xs font-bold active:scale-[0.96]"
                    >
                      <Icon d={ICON.chat} className="w-3.5 h-3.5" />
                      <span>카톡 상담</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => openInquiry("구매 문의")}
                      className="hb-btn-accent h-10 px-3 text-hb-xs font-bold cursor-pointer active:scale-[0.96]"
                    >
                      <Icon d={ICON.pen} className="w-3.5 h-3.5" />
                      <span>1:1 견적 접수</span>
                    </button>
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
                eyebrow="직영 시공 기록"
                title={<span id="review-title" className="[text-wrap:balance]">직영 배송 · 설치 현장 기록</span>}
                desc="가정집부터 식당·카페·사무실까지 한밭중고전자가 직접 배송·설치한 현장 사진입니다."
              />
              <div className="flex items-center gap-3 shrink-0">
                {reviews.length > 0 && (
                  <span className="text-hb-xs sm:text-hb-sm font-bold text-[#64748B] tabular-nums">
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
                  className="inline-flex rounded-xl border border-[#E2E6EC] bg-white p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={reviewFilter === "all"}
                    onClick={() => setReviewFilter("all")}
                    className={`rounded-lg px-3.5 py-1.5 text-hb-xs font-bold active:scale-[0.96] transition-[background-color,color,transform] duration-150 ${
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
                    aria-selected={reviewFilter === "home"}
                    onClick={() => setReviewFilter("home")}
                    className={`rounded-lg px-3.5 py-1.5 text-hb-xs font-bold active:scale-[0.96] transition-[background-color,color,transform] duration-150 ${
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
                    aria-selected={reviewFilter === "commercial"}
                    onClick={() => setReviewFilter("commercial")}
                    className={`rounded-lg px-3.5 py-1.5 text-hb-xs font-bold active:scale-[0.96] transition-[background-color,color,transform] duration-150 ${
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
                  전 매물 직영 2인 1조 수평설치 및 시운전 완료
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
                <ul className="mt-5 flex gap-3 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 sm:gap-3.5 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
                  {shownReviews.map((r) => {
                    const imgs = splitImages(r.image_url);
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
                            <span className="absolute right-2 top-2 z-10 rounded bg-[#141A23]/80 px-1.5 py-0.5 text-hb-xs font-semibold text-white tabular-nums">
                              +{imgs.length - 1}
                            </span>
                          )}
                        </button>
                        <div className="bg-white px-3 py-2.5 border-t border-[#E2E6EC]">
                          <p className="line-clamp-1 text-hb-xs font-bold text-[#141A23] group-hover:text-[#E8521A] transition-colors">
                            {r.title || "배송 및 설치 완료"}
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r.id)}
                            className="absolute left-2 top-2 z-20 rounded bg-white/95 px-2 py-0.5 text-hb-xs font-bold text-red-600 shadow"
                          >
                            삭제
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-1.5 flex sm:hidden items-center justify-center gap-1.5 text-hb-xs text-[#64748B]">
                  <Icon d={ICON.left} className="w-3.5 h-3.5 text-[#E8521A]" />
                  <span>좌우로 밀어서 현장 사진을 확인하세요 ({shownReviews.length}건)</span>
                  <Icon d={ICON.right} className="w-3.5 h-3.5 text-[#E8521A]" />
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
            [6/6] 구매 전 안심 비교 · 자주 묻는 질문 (#faq-section + #buying-guide-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="faq-section"
          className="border-b border-[#E2E6EC] bg-white py-8 sm:py-11"
          aria-labelledby="faq-title"
        >
          <div className="hb-container">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pb-5 border-b border-[#E2E6EC]">
              <SectionHeading
                eyebrow="구매 전 안심 안내"
                title={
                  <span id="faq-title" className="[text-wrap:balance]">
                    자주 묻는 질문 · 직영 매장 비교
                  </span>
                }
                desc="A/S 보증·배송·설치 안내와 개인 직거래 대비 차이를 한 화면에서 전환해 확인하세요."
              />

              <div
                id="buying-guide-section"
                className="flex flex-wrap items-center gap-2 shrink-0"
                role="tablist"
                aria-label="구매 안내 보기 전환"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={guideTab === "faq"}
                  onClick={() => setGuideTab("faq")}
                  className={`rounded-xl px-4 py-2 text-hb-xs sm:text-hb-sm font-bold transition-colors cursor-pointer ${
                    guideTab === "faq"
                      ? "bg-[#141A23] text-white"
                      : "border border-[#E2E6EC] bg-[#F7F8FA] text-[#4E5968] hover:text-[#141A23]"
                  }`}
                >
                  자주 묻는 질문 ({FAQS.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={guideTab === "comparison"}
                  onClick={() => setGuideTab("comparison")}
                  className={`rounded-xl px-4 py-2 text-hb-xs sm:text-hb-sm font-bold transition-colors cursor-pointer ${
                    guideTab === "comparison"
                      ? "bg-[#141A23] text-white"
                      : "border border-[#E2E6EC] bg-[#F7F8FA] text-[#4E5968] hover:text-[#141A23]"
                  }`}
                >
                  직거래 vs {STORE.name} 비교
                </button>
              </div>
            </div>

            {guideTab === "comparison" ? (
              <div className="mt-5" role="tabpanel" aria-label="일반 개인 직거래 대비 비교표">
                <AiRecommendationGuideSection embedded />
              </div>
            ) : (
              <div className="mt-5" role="tabpanel" aria-label="자주 묻는 질문 목록">
                <div className="space-y-2">
                  {(showAllFaqs ? FAQS : FAQS.slice(0, 5)).map((f, i) => {
                    const open = openFaq === i;
                    return (
                      <div
                        key={f.q}
                        className="rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] px-4 shadow-2xs hover:border-[#CBD2DC] transition-[border-color,box-shadow] duration-150"
                      >
                        <h3>
                          <button
                            type="button"
                            id={`faq-q-${i}`}
                            aria-expanded={open}
                            aria-controls={`faq-a-${i}`}
                            onClick={() => setOpenFaq(open ? null : i)}
                            className="flex w-full items-center justify-between gap-3 py-3 sm:py-3.5 text-left cursor-pointer"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="font-mono text-hb-xs sm:text-hb-sm font-bold text-[#E8521A] shrink-0 pt-0.5">
                                Q{String(i + 1).padStart(2, "0")}.
                              </span>
                              <span className="block text-hb-sm sm:text-hb-base font-bold leading-snug text-[#141A23] break-keep">
                                {f.q}
                              </span>
                            </div>
                            <span
                              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#CBD2DC] text-[#141A23] transition-transform duration-200 ${
                                open
                                  ? "rotate-45 bg-[#141A23] text-white border-[#141A23]"
                                  : "bg-white"
                              }`}
                            >
                              <Icon d={ICON.plus} className="h-3 w-3" />
                            </span>
                          </button>
                        </h3>
                        {open && (
                          <div
                            id={`faq-a-${i}`}
                            role="region"
                            aria-labelledby={`faq-q-${i}`}
                            className="pb-3.5 pl-8 pr-2 text-hb-xs sm:text-hb-sm leading-[1.7] text-[#475569] break-keep"
                          >
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
                              <div className="mt-3 pt-2.5 border-t border-[#E2E6EC] flex flex-wrap gap-2">
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {guideTab === "faq" && FAQS.length > 5 ? (
                <button
                  type="button"
                  onClick={() => setShowAllFaqs((v) => !v)}
                  className="hb-btn-outline h-9 px-4 text-hb-xs active:scale-[0.96]"
                >
                  <span>
                    {showAllFaqs
                      ? "질문 접기"
                      : `자주 묻는 질문 ${FAQS.length - 5}건 더 보기`}
                  </span>
                  <Icon
                    d={ICON.down}
                    className={`h-3.5 w-3.5 transition-transform ${
                      showAllFaqs ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ) : (
                <span />
              )}

              <Link
                href="/inquiry"
                className="inline-flex items-center gap-1.5 text-hb-xs sm:text-hb-sm font-bold text-[#141A23] hover:text-[#E8521A] active:scale-[0.96] transition-[color,transform] duration-150 underline underline-offset-4"
              >
                <span>1:1 문의 게시판 바로가기 →</span>
              </Link>
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
        onSuccess={() => setIsAdmin(true)}
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
                <span className="text-hb-xs font-semibold text-[#E8521A] animate-pulse">
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
