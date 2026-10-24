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
  DuotoneIcon,
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
  normalizeProductCategory,
  formatProductPrice,
  getInquiryTypeLabel,
  extractStorageFilesByBucket,
  trackEvent,
  type InquiryTypeValue,
  triggerQuickInquiry,
} from "../lib/site";
import { type ProductItem } from "../components/products/product-card";
import { FeaturedProductsSection } from "../components/home/featured-products-section";
import {
  CategoryPictogramBar,
  SHOWROOM_CATEGORIES,
  type ShowroomCategoryItem,
  type PictogramKey,
} from "../components/home/category-pictogram-bar";
import { AirconGuideModal } from "../components/products/aircon-set-guide-banner";
import { ModernApplianceIcon } from "../components/ui/modern-icons";

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
    step: "01",
    badge: "입고 검수 및 세척",
    title: "분해 세척·작동 검수 후 출고",
    desc: "입고된 모든 가전과 주방설비는 엔지니어가 분해 고압 세척과 냉매·콤프레샤·누수·시운전 테스트를 통과한 제품만 출고합니다.",
    icon: "sparkle" as const,
  },
  {
    step: "02",
    badge: "책임 보증 약정",
    title: "계약 조건별 무상 A/S 보증",
    desc: "품목 및 계약 조건에 따라 에어컨·냉난방기 최대 8개월, 냉장고·세탁기 등 일반 가전 최대 4개월 무상 A/S를 약정 지원합니다. (거래 형태 및 계약 조건 기준)",
    icon: "shield" as const,
  },
  {
    step: "03",
    badge: "사업자 정식 증빙",
    title: "사업자 증빙 및 직배송 완비",
    desc: "대전·세종·충청권 직배송 수평 설치는 물론 전자세금계산서·신용카드·현금영수증을 100% 정식 발행합니다.",
    icon: "tax" as const,
  },
] as const;

const SELL_STEPS = [
  {
    step: "01",
    t: "사진·정보 접수",
    d: "사진·문자·카톡으로 제품 전면과 모델명(명판), 수거 지역을 남겨주세요.",
    icon: ICON.camera,
  },
  {
    step: "02",
    t: "빠른 견적 안내",
    d: "외관 상태와 연식·시세를 종합 검토하여 합리적인 매입가를 신속히 안내합니다.",
    icon: ICON.search,
  },
  {
    step: "03",
    t: "방문 확인·수거",
    d: "원하시는 일정에 전문 기사가 방문하여 안전하게 제품을 분리·수거합니다.",
    icon: ICON.truck,
  },
  {
    step: "04",
    t: "현장 즉시 입금",
    d: "수거가 완료되는 즉시 지정하신 계좌로 매입 대금 전액을 현금 송금합니다.",
    icon: ICON.wallet,
  },
] as const;

const COMMERCIAL_EQUIP_MATRIX = [
  {
    code: "B2B · 01",
    title: "업소용 냉장 · 냉동 설비",
    items: "45박스 · 25박스 수직냉장/냉동 · 테이블냉장고 · 반찬냉장고 · 급속냉동고",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EB%83%89%EC%9E%A5",
    icon: "biz-fridge" as const,
  },
  {
    code: "B2B · 02",
    title: "음료 · 제과 · 주류 쇼케이스",
    items: "음료/주류 직냉식·간냉식 쇼케이스 · 제과/케이크 쇼케이스 · 오픈 쇼케이스",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EC%87%BC%EC%BC%80%EC%9D%B4%EC%8A%A4",
    icon: "showcase" as const,
  },
  {
    code: "B2B · 03",
    title: "제빙기 · 세척기 · 스텐 주방",
    items: "업소용 제빙기 · 식기세척기 · 스텐 작업대 · 싱크대 · 가스레인지 · 육수통",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
    icon: "kitchen" as const,
  },
  {
    code: "B2B · 04",
    title: "중대형 냉난방 · 폐업 일괄정리",
    items: "상가·사무실 중대형 스탠드/천장형 냉난방기 · 폐업 매장 집기 방문 일괄매입",
    href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
    icon: "closure" as const,
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
   2. 메인 페이지 컴포넌트 (Modern Appliance Showroom 아키텍처)
   ════════════════════════════════════════════════════════════ */
export default function Home() {
  /* 실시간 판매 매물 상태 */
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);

  /* 카테고리 탐색 선택 상태 */
  const [selectedCategory, setSelectedCategory] =
    useState<ShowroomCategoryItem>(SHOWROOM_CATEGORIES[0]);

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

  const activeProducts = useMemo(
    () => featuredProducts.filter((p) => !isProductSold(p.status)),
    [featuredProducts]
  );

  const sellingCount = activeProducts.length;

  /* 히어로 우측 상단에 즉시 노출할 대표 실매물 3건 */
  const heroPreviewProducts = useMemo(
    () => (activeProducts.length > 0 ? activeProducts : featuredProducts).slice(0, 3),
    [activeProducts, featuredProducts]
  );

  /* 카테고리별 실시간 재고 수량 계산 */
  const categoryCounts = useMemo<Partial<Record<PictogramKey, number>>>(() => {
    const src = activeProducts.length > 0 ? activeProducts : featuredProducts;
    if (src.length === 0) return {};
    const map: Partial<Record<PictogramKey, number>> = {
      all: src.length,
    };
    for (const catItem of SHOWROOM_CATEGORIES) {
      if (catItem.key === "all") continue;
      map[catItem.key] = src.filter((p) => {
        const c = normalizeProductCategory(p.category);
        if (c !== catItem.filterCategory) return false;
        if (catItem.filterKeyword) {
          const hay = `${p.title} ${p.description || ""}`.toLowerCase();
          return hay.includes(catItem.filterKeyword.toLowerCase());
        }
        return true;
      }).length;
    }
    return map;
  }, [activeProducts, featuredProducts]);

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
    <div className="min-h-screen flex flex-col bg-white text-[#0E1A2B] overflow-x-hidden">
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

      <main id="main-content" className="flex-1">
        {/* ════════════════════════════════════════════════════════════
            [S1] 쇼룸 아키텍처 히어로 (좌: 핵심 메시지 & 듀얼 액션 독 + 3대 지표 / 우: 직영 쇼룸 & 실시간 입고 매물 프리뷰)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="hero-section"
          aria-labelledby="hero-title"
          className="relative w-full border-b border-[#E5E2DC] bg-[#F4F2ED]"
        >
          {/* 상단 직영 쇼룸 상태 스트립 */}
          <div className="border-b border-[#E5E2DC] bg-[#0E1A2B] text-white">
            <div className="hb-container py-2 flex flex-wrap items-center justify-between gap-2 text-hb-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8A50] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF8A50]" />
                </span>
                <span className="font-bold text-white truncate">
                  SINCE {STORE.since} · 대전 중촌동 1·2층 직영 쇼룸 ({OPERATING_YEARS}년 운영)
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-white/80 tabular-nums">
                <span className="inline-flex items-center gap-1.5">
                  <Icon d={ICON.clock} className="w-3.5 h-3.5 text-white/60" />
                  <span>영업시간: {STORE.hours}</span>
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon d={ICON.building} className="w-3.5 h-3.5 text-white/60" />
                  <span>매장 앞 전용 주차 완비</span>
                </span>
                <span>·</span>
                <strong className="inline-flex items-center gap-1 text-[#FF8A50]">
                  <Icon d={ICON.shieldCheck} className="w-3.5 h-3.5 text-[#FF8A50]" />
                  <span>현재 구매 가능 실매물 {sellingCount > 0 ? `${sellingCount}대` : "상시"} 전시</span>
                </strong>
              </div>
            </div>
          </div>

          <div className="hb-container py-8 sm:py-12 lg:py-14">
            <div className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
              {/* 좌측 (7열): 쇼룸 에디토리얼 헤드라인 + 듀얼 액션 독 + 무테두리 3대 기준 스트립 */}
              <div className="lg:col-span-7 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 text-hb-xs font-extrabold tracking-wider text-[#D9531E] uppercase">
                    <span>HANBAT APPLIANCE & COMMERCIAL SHOWROOM</span>
                  </div>

                  <h1
                    id="hero-title"
                    className="mt-3 hb-fluid-h1 text-[#0E1A2B] break-keep"
                  >
                    가정용 가전부터 업소용 주방설비까지,
                    <br />
                    <span className="text-[#D9531E]">분해 세척·검수를 마친</span>{" "}
                    실매물만 출고합니다
                  </h1>

                  <p className="mt-3.5 max-w-xl text-hb-sm sm:text-hb-base leading-[1.65] text-[#3E4756] break-keep">
                    대전 중촌동 1·2층 직영 쇼룸에서 작동 상태를 직접 확인하고 구매하실 수 있으며, 처분하시는 가전·식당 설비는 방문 수거 당일 현금으로 정산해 드립니다.
                  </p>

                  {/* 듀얼 핵심 행동 독 (중첩 박스 대신 선명한 2-Track CTA 버튼 그룹) */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                    <Link
                      href="/gallery"
                      className="group flex items-center justify-between rounded-lg bg-[#0E1A2B] px-5 py-4 text-white shadow-card hover:bg-[#182942] transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="block text-hb-xs font-bold text-[#FF8A50]">
                          세척·검수 완료 · 무상 A/S
                        </span>
                        <strong className="mt-0.5 block text-hb-lg font-extrabold text-white">
                          실매물 확인하기{" "}
                          {sellingCount > 0 && (
                            <span className="text-hb-sm font-bold text-white/80 tabular-nums">
                              ({sellingCount}대)
                            </span>
                          )}
                        </strong>
                      </div>
                      <span className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white group-hover:bg-[#D9531E] transition-colors">
                        <Icon d={ICON.arrow} className="w-4 h-4" />
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        trackEvent("begin_buyback_inquiry", {
                          location: "hero_split_sell",
                        });
                        openInquiry("내 물건 팔기");
                      }}
                      className="group flex items-center justify-between rounded-lg bg-[#D9531E] px-5 py-4 text-left text-white shadow-card hover:bg-[#C04615] transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <span className="block text-hb-xs font-bold text-white/90">
                          방문 수거 · 당일 현금 정산
                        </span>
                        <strong className="mt-0.5 block text-hb-lg font-extrabold text-white">
                          쓰던 가전 팔기
                        </strong>
                      </div>
                      <span className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/15 text-white group-hover:translate-x-0.5 transition-transform">
                        <Icon d={ICON.arrow} className="w-4 h-4" />
                      </span>
                    </button>
                  </div>

                  {/* 빠른 보조 동선: 업소 상담 & 직통 전화 */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-hb-xs sm:text-hb-sm text-[#3E4756]">
                    <a
                      href="#business-section"
                      className="inline-flex items-center gap-1.5 font-bold text-[#0E1A2B] hover:text-[#D9531E] transition-colors"
                    >
                      <span className="inline-block rounded bg-[#0E1A2B] px-2 py-0.5 text-hb-xs font-bold text-white">
                        B2B
                      </span>
                      <span>식당·카페 창업 납품 및 폐업 일괄정리 상담 →</span>
                    </a>
                    <a
                      href={telHref(STORE.tel)}
                      className="inline-flex items-center gap-1.5 font-bold text-[#3E4756] hover:text-[#0E1A2B] tabular-nums"
                    >
                      <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#D9531E]" />
                      <span>직통 {STORE.tel}</span>
                    </a>
                  </div>
                </div>

                {/* 하단 무테두리 3대 쇼룸 원칙 레저 (ModernApplianceIcon 결합) */}
                <div className="mt-8 pt-5 border-t-2 border-[#0E1A2B] grid grid-cols-3 gap-3 sm:gap-6">
                  <div className="min-w-0 flex items-start gap-2.5">
                    <ModernApplianceIcon name="sparkle" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-mono text-hb-xs font-extrabold text-[#D9531E]">
                        01 · INSPECTION
                      </span>
                      <p className="mt-0.5 text-hb-sm sm:text-hb-base font-extrabold text-[#0E1A2B] truncate">
                        분해 고압세척 출고
                      </p>
                      <p className="mt-0.5 hidden sm:block text-hb-xs text-[#434B59]">
                        냉매·콤프레샤·누수 시운전 통과
                      </p>
                    </div>
                  </div>
                  <div className="min-w-0 border-l border-[#D8D3C8] pl-3 sm:pl-5 flex items-start gap-2.5">
                    <ModernApplianceIcon name="shield" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-mono text-hb-xs font-extrabold text-[#D9531E]">
                        02 · WARRANTY
                      </span>
                      <p className="mt-0.5 text-hb-sm sm:text-hb-base font-extrabold text-[#0E1A2B] truncate">
                        무상 A/S 책임 보증
                      </p>
                      <p className="mt-0.5 hidden sm:block text-hb-xs text-[#434B59]">
                        에어컨 최대 8개월 · 가전 4개월
                      </p>
                    </div>
                  </div>
                  <div className="min-w-0 border-l border-[#D8D3C8] pl-3 sm:pl-5 flex items-start gap-2.5">
                    <ModernApplianceIcon name="tax" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-mono text-hb-xs font-extrabold text-[#D9531E]">
                        03 · DELIVERY & TAX
                      </span>
                      <p className="mt-0.5 text-hb-sm sm:text-hb-base font-extrabold text-[#0E1A2B] truncate">
                        직배송·세금계산서
                      </p>
                      <p className="mt-0.5 hidden sm:block text-hb-xs text-[#434B59]">
                        충청권 직배송 · 부가세 증빙 100%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 우측 (5열): 오프라인 직영 쇼룸 비주얼 + 실시간 입고 실매물 3종 독 */}
              <div className="lg:col-span-5 min-w-0 flex flex-col justify-between rounded-lg overflow-hidden border border-[#CFCAC0] bg-white shadow-card">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0E1A2B]">
                  <SafeImg
                    src="/main-bg2.png"
                    alt={`대전 중구 대전천서로 691-62(중촌동 144) ${STORE.name} 오프라인 직영 매장 외관`}
                    eager
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0E1A2B]/95 via-[#0E1A2B]/70 to-transparent px-4 pt-8 pb-3 text-white flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-hb-xs font-bold text-[#FF8A50]">
                        대전 중구 중촌동 1·2층 대형 직영 매장
                      </span>
                      <p className="text-hb-xs sm:text-hb-sm font-bold text-white truncate">
                        {STORE.roadAddress} ({STORE.addressNote})
                      </p>
                    </div>
                    <a
                      href="#location-section"
                      className="shrink-0 rounded bg-white/15 hover:bg-white/25 px-2.5 py-1 text-hb-xs font-bold text-white backdrop-blur-xs"
                    >
                      오시는 길
                    </a>
                  </div>
                </div>

                {/* 첫 화면에서 즉시 확인하는 실시간 매장 전시 가전 미니 쇼케이스 */}
                <div className="p-3.5 sm:p-4 bg-white flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#ECE9E2]">
                    <span className="text-hb-xs font-extrabold text-[#0E1A2B]">
                      방금 입고된 쇼룸 실매물 미리보기
                    </span>
                    <Link
                      href="/gallery"
                      className="text-hb-xs font-bold text-[#D9531E] hover:underline"
                    >
                      전체 보기 →
                    </Link>
                  </div>

                  {heroPreviewProducts.length > 0 ? (
                    <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                      {heroPreviewProducts.map((item) => {
                        const thumb = splitImages(item.image_url)[0];
                        const cat = normalizeProductCategory(item.category);
                        return (
                          <Link
                            key={item.id}
                            href={`/${item.id}`}
                            className="group block min-w-0 rounded-lg border border-[#E5E2DC] bg-white overflow-hidden hover:border-[#0E1A2B] transition-colors"
                          >
                            <div className="aspect-[4/3] w-full overflow-hidden bg-[#F5F4F0]">
                              <SafeImg
                                src={thumb}
                                alt={item.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="p-2">
                              <p className="truncate text-hb-xs font-bold text-[#0E1A2B] group-hover:text-[#D9531E]">
                                {item.title}
                              </p>
                              <p className="truncate text-hb-xs font-extrabold text-[#D9531E] tabular-nums">
                                {formatProductPrice(item.price, cat)}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="h-24 rounded bg-[#F3F1EC] animate-pulse"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [S2] 품목별 쇼룸 카탈로그 탐색 바 (#category-section)
            ════════════════════════════════════════════════════════════ */}
        <CategoryPictogramBar
          selectedKey={selectedCategory.key}
          categoryCounts={categoryCounts}
          onSelectCategory={(item) => {
            setSelectedCategory(item);
          }}
          onSelectInquiry={openInquiry}
        />

        {/* ════════════════════════════════════════════════════════════
            [S3] 실시간 쇼룸 전시 매물 (#featured-products-section)
            ════════════════════════════════════════════════════════════ */}
        <FeaturedProductsSection
          products={featuredProducts}
          loading={productsLoading}
          error={productsError}
          onRetry={loadFeaturedProducts}
          selectedCategory={selectedCategory}
          onResetCategory={() => setSelectedCategory(SHOWROOM_CATEGORIES[0])}
        />

        {/* ════════════════════════════════════════════════════════════
            [S4] 업소·창업·폐업 전용 풀블리드 다크 네이비 쇼룸 섹션 (#business-section)
            — 가정용 섹션과 시각적으로 완전히 분리된 B2B 설비 매트릭스
            ════════════════════════════════════════════════════════════ */}
        <section
          id="business-section"
          className="bg-[#0E1A2B] text-white py-12 sm:py-16 lg:py-20 border-b border-[#1E2F47]"
          aria-labelledby="business-title"
        >
          <div className="hb-container">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-start">
              {/* 좌측 (5열): 업소용 핵심 메시지 & 전용 CTA */}
              <div className="lg:col-span-5 min-w-0">
                <span className="inline-block rounded bg-[#D9531E] px-2.5 py-1 text-hb-xs font-extrabold text-white tracking-wider">
                  COMMERCIAL KITCHEN & B2B SOLUTION
                </span>
                <h2
                  id="business-title"
                  className="mt-3.5 text-hb-2xl sm:text-hb-3xl font-extrabold text-white tracking-tight leading-[1.25] break-keep"
                >
                  식당·카페 창업 설비 도입부터
                  <br />
                  폐업 매장 일괄 정리까지
                </h2>
                <p className="mt-3 text-hb-sm sm:text-hb-base text-white/75 leading-relaxed break-keep">
                  업소용 45박스 냉장고, 쇼케이스, 제빙기, 식기세척기, 중대형 냉난방기까지 예산에 맞춘 묶음 납품과 전자세금계산서 정식 발행을 원스톱으로 지원합니다.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openInquiry("대량·업소용 상담")}
                    className="hb-btn-accent h-12 px-6 text-hb-base font-bold cursor-pointer"
                  >
                    <span>업소용 견적 · 철거 상담</span>
                    <Icon d={ICON.arrow} className="w-4 h-4" />
                  </button>
                  <Link
                    href="/gallery?category=업소용기기"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 h-12 px-5 text-hb-sm font-bold text-white transition-colors"
                  >
                    <span>업소용 설비 실매물 보기 →</span>
                  </Link>
                </div>
              </div>

              {/* 우측 (7열): 경계선 기반 2×2 업소용 주력 품목 매트릭스 (일반 카드 반복 배제) */}
              <div className="lg:col-span-7 min-w-0 grid grid-cols-1 sm:grid-cols-2 border-t border-l border-white/15">
                {COMMERCIAL_EQUIP_MATRIX.map((cell) => (
                  <Link
                    key={cell.code}
                    href={cell.href}
                    className="group flex flex-col justify-between p-5 sm:p-6 border-r border-b border-white/15 bg-white/[0.03] hover:bg-white/[0.08] transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ModernApplianceIcon name={cell.icon} dark className="w-8 h-8" />
                          <span className="font-mono text-hb-xs font-bold text-[#FF8A50]">
                            {cell.code}
                          </span>
                        </div>
                        <Icon
                          d={ICON.arrow}
                          className="w-4 h-4 text-white/40 group-hover:text-[#FF8A50] group-hover:translate-x-1 transition-all"
                        />
                      </div>
                      <h3 className="mt-2 text-hb-lg font-extrabold text-white group-hover:text-[#FF8A50] transition-colors">
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
        </section>

        {/* ════════════════════════════════════════════════════════════
            [S5] 쓰던 가전 매입 절차 (#sell-section) — 좌우 비대칭 + 번호 연결형 타임라인
            ════════════════════════════════════════════════════════════ */}
        <section
          id="sell-section"
          className="border-b border-[#E5E2DC] bg-[#FAF9F7] py-12 sm:py-16 lg:py-20"
          aria-labelledby="sell-title"
        >
          <div className="hb-container">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-start">
              {/* 좌측 (4열): 매입 핵심 안내 및 직접 행동 버튼 */}
              <div className="lg:col-span-4 min-w-0">
                <span className="hb-eyebrow">DIRECT VISIT BUYBACK</span>
                <h2
                  id="sell-title"
                  className="mt-2 text-hb-2xl sm:text-hb-3xl font-extrabold text-[#0E1A2B] tracking-tight leading-[1.25] break-keep"
                >
                  쓰던 가전, 사진만 보내주세요
                </h2>
                <p className="mt-3 text-hb-sm sm:text-hb-base text-[#3E4756] leading-relaxed break-keep">
                  가정용 대형가전부터 식당·카페 업소용 설비까지 연식과 상태를 확인하여 합리적인 시세로 매입하며, 방문 수거 당일 현장에서 즉시 입금해 드립니다.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row lg:flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => openInquiry("내 물건 팔기")}
                    className="hb-btn-accent h-12 px-5 text-hb-base font-bold justify-between cursor-pointer"
                  >
                    <span>방문 매입 견적 신청하기</span>
                    <Icon d={ICON.arrow} className="h-4 w-4" />
                  </button>
                  <a
                    href={STORE.kakaoChat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hb-btn-kakao h-12 px-5 text-hb-base font-bold justify-between"
                  >
                    <span>카카오톡으로 사진 보내기</span>
                    <Icon d={ICON.chat} className="h-4 w-4" />
                  </a>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-hb-xs sm:text-hb-sm">
                  <button
                    type="button"
                    onClick={() => setGuideModalOpen(true)}
                    className="inline-flex items-center gap-1.5 font-bold text-[#3E4756] hover:text-[#0E1A2B] underline underline-offset-4 cursor-pointer"
                  >
                    <Icon d={ICON.camera} className="w-3.5 h-3.5 text-[#D9531E]" />
                    <span>매입 사진 촬영 가이드</span>
                  </button>
                  <Link
                    href="/purchase"
                    className="inline-flex items-center gap-1 font-bold text-[#0E1A2B] hover:text-[#D9531E] underline underline-offset-4"
                  >
                    <span>전용 매입 신청 페이지 →</span>
                  </Link>
                </div>
              </div>

              {/* 우측 (8열): 번호가 연결되는 4단계 매입 절차 타임라인 (카드 박스 나열 배제) */}
              <div className="lg:col-span-8 min-w-0 lg:pl-6 lg:border-l lg:border-[#D8D3C8]">
                <ol className="relative grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                  {SELL_STEPS.map((s, i) => (
                    <li
                      key={s.t}
                      className="relative flex items-start gap-4 pt-4 border-t-2 border-[#0E1A2B]"
                    >
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0E1A2B] font-mono text-hb-sm font-extrabold text-[#FF8A50]">
                          {s.step}
                        </span>
                        <DuotoneIcon
                          d={s.icon}
                          tone={i === 3 ? "orange" : "navy"}
                          size="sm"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-hb-xs font-bold text-[#D9531E]">
                          STEP 0{i + 1}
                        </span>
                        <h3 className="mt-0.5 text-hb-lg font-extrabold text-[#0E1A2B]">
                          {s.t}
                        </h3>
                        <p className="mt-1.5 text-hb-sm leading-relaxed text-[#3E4756] break-keep">
                          {s.d}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                {/* 하단 매입 팁 요약 스트립 */}
                <div className="mt-8 pt-5 border-t border-[#D8D3C8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-hb-xs sm:text-hb-sm text-[#3E4756]">
                  <div>
                    <strong className="font-bold text-[#0E1A2B]">
                      빠른 견적 팁:
                    </strong>{" "}
                    제품 정면 사진 + 모델명 스티커(명판) + 수거 층수(엘리베이터 유무)를 알려주시면 가장 정확합니다.
                  </div>
                  <a
                    href={smsHref(
                      STORE.mobile,
                      "[한밭중고전자 매입문의] 처분할 가전 사진과 지역을 보내주시면 빠르게 매입 견적을 안내해 드립니다."
                    )}
                    className="shrink-0 font-bold text-[#D9531E] hover:underline tabular-nums"
                  >
                    문자({STORE.mobile}) 바로 전송 →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            [S6] 배송 · 설치 현장 기록 (#reviews-section) + 3대 품질 원칙 레저 (#usp-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="reviews-section"
          className="border-b border-[#E5E2DC] bg-white py-12 sm:py-16 lg:py-20"
          aria-labelledby="review-title"
        >
          <div className="hb-container">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-[#E5E2DC]">
              <SectionHeading
                eyebrow="FIELD ARCHIVE"
                title={<span id="review-title">직영 배송 · 설치 현장 기록</span>}
                desc="가정집부터 식당·카페·사무실까지 한밭중고전자가 직접 배송하고 설치한 실제 현장 사진입니다."
              />
              <div className="flex items-center gap-3 shrink-0">
                {reviews.length > 0 && (
                  <span className="text-hb-sm font-bold text-[#646E7E] tabular-nums">
                    현장 기록{" "}
                    <strong className="text-[#0E1A2B]">{reviews.length}</strong>건
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
              <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] animate-pulse rounded-lg bg-[#F0EDE7]"
                  />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="mt-8 flex flex-col items-start gap-4 border-y border-[#E5E2DC] bg-[#FAF9F7] px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
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
                <ul className="mt-8 grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-3">
                  {shownReviews.map((r) => {
                    const imgs = splitImages(r.image_url);
                    return (
                      <li
                        key={r.id}
                        className="group relative overflow-hidden rounded-lg border border-[#E5E2DC] bg-white hover:border-[#0E1A2B] transition-colors"
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
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                          {imgs.length > 1 && (
                            <span className="absolute right-2.5 top-2.5 z-10 rounded bg-[#0E1A2B]/80 px-2 py-0.5 text-hb-xs font-semibold text-white tabular-nums">
                              +{imgs.length - 1}
                            </span>
                          )}
                        </button>
                        <div className="flex items-center justify-between gap-2 bg-white px-3.5 py-3 border-t border-[#ECE9E2]">
                          <p className="line-clamp-1 text-hb-xs sm:text-hb-sm font-bold text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors">
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
                            className="absolute left-2.5 top-2.5 z-20 rounded bg-white/95 px-2.5 py-1 text-hb-xs font-bold text-red-600 shadow"
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

            {/* 3열 핵심 보증 요약 레저 (#usp-section — 박스형 카드 대신 수평선과 타이포 위계 활용) */}
            <div
              id="usp-section"
              className="mt-12 pt-10 border-t-2 border-[#0E1A2B]"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {TRUST_SUMMARY_CARDS.map((card) => (
                  <div
                    key={card.title}
                    className="flex flex-col justify-between md:border-l md:first:border-l-0 md:border-[#E5E2DC] md:pl-6 md:first:pl-0"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-hb-base font-extrabold text-[#D9531E]">
                            {card.step}
                          </span>
                          <span className="text-hb-xs font-bold text-[#646E7E] uppercase">
                            {card.badge}
                          </span>
                        </div>
                        <ModernApplianceIcon name={card.icon} className="w-8 h-8 shrink-0" />
                      </div>
                      <h3 className="mt-2 text-hb-lg font-extrabold text-[#0E1A2B]">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-hb-sm text-[#3E4756] leading-relaxed break-keep">
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
            [S7] 자주 묻는 질문 (#faq-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="faq-section"
          className="border-b border-[#E5E2DC] bg-[#FAF9F7] py-12 sm:py-16 lg:py-20"
          aria-labelledby="faq-title"
        >
          <div className="hb-container grid gap-8 lg:grid-cols-12 lg:gap-12 items-start">
            <div className="lg:col-span-4 min-w-0">
              <SectionHeading
                eyebrow="CUSTOMER GUIDE"
                title={<span id="faq-title">자주 묻는 질문 (FAQ)</span>}
                desc="A/S 보증 기간, 보상판매 차액 정산, 설치 비용 등 상담 전 가장 많이 물어보시는 핵심 질문입니다."
              />
              <div className="mt-5">
                <Link
                  href="/inquiry"
                  className="inline-flex items-center gap-1.5 text-hb-sm font-bold text-[#0E1A2B] hover:text-[#D9531E] underline underline-offset-4"
                >
                  <span>1:1 문의 게시판 바로가기 →</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-8 min-w-0 divide-y divide-[#D8D3C8] border-y-2 border-[#0E1A2B]">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div
                    key={f.q}
                    className="transition-colors bg-transparent"
                  >
                    <h3>
                      <button
                        type="button"
                        id={`faq-q-${i}`}
                        aria-expanded={open}
                        aria-controls={`faq-a-${i}`}
                        onClick={() => setOpenFaq(open ? null : i)}
                        className="flex w-full items-center justify-between gap-4 py-4 sm:py-5 text-left cursor-pointer"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="mt-0.5 font-mono text-hb-sm font-extrabold text-[#D9531E] shrink-0">
                            Q0{i + 1}.
                          </span>
                          <div className="min-w-0">
                            <span className="inline-block text-hb-xs font-bold text-[#646E7E] mb-0.5">
                              [{f.tag}]
                            </span>
                            <span className="block text-hb-base font-bold leading-snug text-[#0E1A2B] break-keep">
                              {f.q}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#CFCAC0] text-[#0E1A2B] transition-transform duration-200 ${
                            open
                              ? "rotate-45 bg-[#0E1A2B] text-white border-[#0E1A2B]"
                              : "bg-white"
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
                        className="pb-5 pl-9 pr-4 text-hb-sm leading-[1.75] text-[#3E4756] break-keep"
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
                          <div className="mt-3.5 pt-3 border-t border-[#E5E2DC] flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setAirconModalOpen(true)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0E1A2B] bg-white px-3.5 py-1.5 text-hb-xs font-bold text-[#0E1A2B] hover:bg-[#FAF9F7] transition-colors cursor-pointer"
                            >
                              <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#D9531E]" />
                              <span>에어컨 세트 구성 안내문 크게 보기</span>
                            </button>
                            <Link
                              href="/gallery?category=에어컨/냉난방기"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0E1A2B] px-3.5 py-1.5 text-hb-xs font-bold text-white hover:bg-[#1C2D47] transition-colors"
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
            [S8] 상담 연결 및 오프라인 직영 쇼룸 안내 (#inquiry-section + #location-section)
            ════════════════════════════════════════════════════════════ */}
        <section
          id="inquiry-section"
          className="border-b border-[#E5E2DC] bg-white py-12 sm:py-16 lg:py-20"
          aria-labelledby="cta-title"
        >
          <div className="hb-container">
            <SectionHeading
              eyebrow="SHOWROOM & CONTACT"
              title={<span id="cta-title">상담 연결 및 오프라인 매장 안내</span>}
              desc="전화·카톡·문자로 바로 연결하시거나 대전 중촌동 직영 쇼룸에 방문해 실물을 확인하실 수 있습니다."
            />

            <div className="mt-8 grid gap-8 lg:grid-cols-12 items-stretch">
              {/* 좌측 (5열): 직통 연락처 콘솔 + 최근 문의 현황 */}
              <div className="lg:col-span-5 min-w-0 flex flex-col gap-6 justify-between">
                <div className="rounded-lg bg-[#0E1A2B] p-6 text-white">
                  <span className="inline-block rounded bg-[#D9531E] px-2.5 py-0.5 text-hb-xs font-bold text-white">
                    직통 고객센터
                  </span>
                  <p className="mt-2.5 text-hb-sm text-white/80">
                    구매·매입·업소용 견적 모두 빠르게 안내해 드립니다
                  </p>
                  <a
                    href={telHref(STORE.tel)}
                    className="mt-2 block text-hb-2xl sm:text-hb-3xl font-extrabold tracking-tight text-white hover:text-[#FF8A50] tabular-nums"
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
                      className="hb-btn-accent h-11 text-hb-sm font-bold cursor-pointer"
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

                {/* 최근 접수된 문의 현황 (경계선 리스트) */}
                <div className="border-t-2 border-[#0E1A2B] pt-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
                      <h3 className="text-hb-base font-extrabold text-[#0E1A2B]">
                        최근 접수된 문의 현황
                      </h3>
                      <Link
                        href="/inquiry"
                        className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#D9531E] hover:underline"
                      >
                        <span>전체 게시판</span>
                        <Icon d={ICON.right} className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    {recent.length === 0 ? (
                      <div className="py-4 text-hb-xs sm:text-hb-sm text-[#434B59] space-y-2.5">
                        <p className="font-bold text-[#0E1A2B]">
                          비밀번호로 보호되는 실시간 1:1 견적 게시판입니다.
                        </p>
                        <p className="text-hb-xs text-[#646E7E] leading-relaxed break-keep">
                          가전 구매 재고 확인, 방문 매입 신청, 식당·카페 업소용 묶음 견적을 남겨주시면 담당자가 확인 후 신속히 안내해 드립니다.
                        </p>
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openInquiry("내 물건 팔기")}
                            className="hb-btn-outline h-9 px-3 text-hb-xs"
                          >
                            <span>30초 간편 견적 접수</span>
                          </button>
                          <Link
                            href="/inquiry"
                            className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#0E1A2B] hover:text-[#D9531E] underline underline-offset-4 px-2"
                          >
                            <span>게시판 바로가기 →</span>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <ul className="divide-y divide-[#E5E2DC]">
                        {recent.map((r) => {
                          const isDone =
                            r.status === "답변완료" || r.status === "처리완료";
                          return (
                            <li
                              key={r.id}
                              className="flex items-center justify-between gap-3 py-3 text-hb-sm"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <span className="shrink-0 rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2 py-0.5 text-hb-xs font-semibold text-[#0E1A2B]">
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
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-[#FFF5F0] text-[#D9531E]"
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
                className="lg:col-span-7 min-w-0 flex flex-col overflow-hidden rounded-lg border border-[#E5E2DC] bg-[#FAF9F7]"
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

                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between border-t border-[#E5E2DC] bg-white space-y-5">
                  {/* 상단 주소 및 1·2층 직영 쇼룸 타이틀 */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-block rounded bg-[#0E1A2B] px-2 py-0.5 text-hb-xs font-bold text-white">
                          오프라인 직영 쇼룸
                        </span>
                        <span className="text-hb-xs font-bold text-[#D9531E]">
                          1·2층 대형 매장
                        </span>
                      </div>
                      <h3
                        id="location-title"
                        className="mt-1 text-hb-lg sm:text-hb-xl font-extrabold text-[#0E1A2B] break-keep"
                      >
                        {STORE.roadAddress}
                      </h3>
                      <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#3E4756]">
                        지번: {STORE.jibunAddress} ({STORE.addressNote})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="hb-btn-outline h-9 px-3 text-hb-xs shrink-0 self-start"
                    >
                      <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#D9531E]" />
                      <span>도로명 주소 복사</span>
                    </button>
                  </div>

                  {/* 쇼룸 방문 특화 3대 편의 시설 안내 (DuotoneIcon 결합) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-[#ECE9E2]">
                    <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-3 text-hb-xs">
                      <div className="flex items-center gap-2 font-bold text-[#0E1A2B]">
                        <DuotoneIcon d={ICON.pin} tone="orange" size="sm" />
                        <span>전용 주차장 완비</span>
                      </div>
                      <p className="mt-1.5 text-[#646E7E] leading-relaxed">
                        매장 정면 8대 전용 주차 · 승용차 및 1톤 화물차 진입 수월
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-3 text-hb-xs">
                      <div className="flex items-center gap-2 font-bold text-[#0E1A2B]">
                        <DuotoneIcon d={ICON.wrench} tone="navy" size="sm" />
                        <span>현장 실물 점검</span>
                      </div>
                      <p className="mt-1.5 text-[#646E7E] leading-relaxed">
                        전원 인가 및 시운전 직접 확인 후 당일 상차·수령 가능
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-3 text-hb-xs">
                      <div className="flex items-center gap-2 font-bold text-[#0E1A2B]">
                        <DuotoneIcon d={ICON.building} tone="emerald" size="sm" />
                        <span>오시는 길 랜드마크</span>
                      </div>
                      <p className="mt-1.5 text-[#646E7E] leading-relaxed">
                        중촌고가교 바로 밑 대전천변 · 중촌동 버스정류장 도보 2분
                      </p>
                    </div>
                  </div>

                  {/* 하단 영업 시간 정보 및 4대 원클릭 안내 버튼 */}
                  <div className="pt-4 border-t border-[#ECE9E2] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-hb-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0E1A2B]">영업 시간:</span>
                        <span className="font-semibold text-[#3E4756]">{STORE.hours}</span>
                        <span className="text-[#858076]">|</span>
                        <span className="text-[#646E7E]">{STORE.closed} (유선 협의 시 가능)</span>
                      </div>
                      <a
                        href={telHref(STORE.tel)}
                        className="font-bold text-[#D9531E] hover:underline tabular-nums"
                      >
                        전화 안내: {STORE.tel}
                      </a>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <a
                        href={STORE.naverMap}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hb-btn bg-[#03C75A] text-white hover:bg-[#02b350] h-11 text-hb-xs sm:text-hb-sm font-bold"
                      >
                        네이버 지도 길찾기
                      </a>
                      <a
                        href="https://map.kakao.com/link/to/한밭중고전자,36.335503,127.406981"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hb-btn-kakao h-11 text-hb-xs sm:text-hb-sm font-bold"
                      >
                        카카오맵 길찾기
                      </a>
                      <a
                        href={telHref(STORE.tel)}
                        className="hb-btn-outline h-11 text-hb-xs sm:text-hb-sm font-bold col-span-2 sm:col-span-1"
                      >
                        <Icon d={ICON.phone} className="w-4 h-4 text-[#D9531E]" />
                        <span>전화 길안내</span>
                      </a>
                    </div>
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
