"use client";

/**
 * 실시간 판매 제품 갤러리 (지연 로딩 아키텍처):
 * - 상세 모달(`ProductDetailModal`)은 `ProductStructuredDescription` 및 `lib/product-ops.ts` 수정 로직을 지연 로딩합니다.
 * - 관리자 업로드(`GalleryAdminUploadController`)는 `compressAndUploadProductImages` 기반 등록을 지연 로딩합니다.
 * - 삭제·일괄 변경은 `lib/product-ops.ts` (`removeProductImagesFromStorage` 포함) 통합 CRUD를 사용합니다.
 */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import {
  getOptionalAdminAuthHeaders,
  notifyAdminAuthChanged,
} from "../../lib/admin-auth";
import { useIsAdminSession } from "../../lib/use-admin-session";
import {
  STORE,
  telHref,
  smsHref,
  splitImages,
  isProductPendingReview,
  isProductSold,
  PRODUCT_STATUS,
  normalizeProductStatus,
  normalizeProductCategory,
  hasProductPrice,
  extractModelName,
  trackEvent,
  addRecentViewedProduct,
} from "../../lib/site";
import {
  buildGalleryQueryUrl,
  CATEGORIES_WITH_ALL,
  computeCategoryCounts,
  filterAndSortGalleryProducts,
  PAGE_STEP,
  parseGalleryQueryParams,
  PRICE_RANGE_OPTIONS,
  SITUATION_PRESETS,
  type GalleryViewMode,
  type PriceRangeOption,
  type SortOption,
  type StatusFilter,
} from "../../lib/gallery-filter";
import {
  Icon,
  ICON,
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
  AdminLoginModal,
} from "../../lib/ui";
import {
  ProductCard,
  type ProductItem,
} from "../../components/products/product-card";
import { GallerySpecTable } from "../../components/products/gallery-spec-table";
import { RecentViewedStrip } from "../../components/products/recent-viewed-strip";
import { AirconSetGuideBanner } from "../../components/products/aircon-set-guide-banner";
import { useGalleryInitialProducts } from "../../components/gallery/gallery-initial-data";

const ProductDetailModal = dynamic(
  () =>
    import("../../components/gallery/product-detail-modal").then(
      (m) => m.ProductDetailModal
    ),
  { ssr: false }
);

const GalleryAdminUploadController = dynamic(
  () =>
    import("../../components/gallery/gallery-admin-upload-controller").then(
      (m) => m.GalleryAdminUploadController
    ),
  { ssr: false }
);

const GalleryBulkActionBar = dynamic(
  () =>
    import("../../components/gallery/gallery-bulk-action-bar").then(
      (m) => m.GalleryBulkActionBar
    ),
  { ssr: false }
);

/* ════════════════════════════════════════════════════════════
   메인 갤러리 페이지 컴포넌트
   ════════════════════════════════════════════════════════════ */
async function queryGalleryProducts(): Promise<ProductItem[]> {
  const { supabase } = await import("../../lib/supabase");
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, category, description, image_url, price, status, condition_grade, views, created_at"
    )
    .neq("category", "배송인증")
    .neq("status", PRODUCT_STATUS.PENDING_REVIEW)
    .order("created_at", { ascending: false })
    .limit(400);
  if (error) throw error;
  return ((data ?? []) as ProductItem[]).filter(
    (p) => !isProductPendingReview(p.status)
  );
}

export default function GalleryPage() {
  const initialProducts = useGalleryInitialProducts();
  const [products, setProducts] = useState<ProductItem[]>(
    () => initialProducts ?? []
  );
  const [isLoading, setIsLoading] = useState(() => initialProducts === null);
  const [loadError, setLoadError] = useState(false);
  const isAdmin = useIsAdminSession();

  /* 검색·필터·정렬·페이지네이션 상태 */
  const [activeCategory, setActiveCategory] = useState<string>("전체");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 2) return;
    const timer = window.setTimeout(() => {
      trackEvent("search_products", {
        query_length: trimmed.length,
        category: activeCategory,
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [search, activeCategory]);
  const [sort, setSort] = useState<SortOption>("latest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priceRange, setPriceRange] = useState<PriceRangeOption>("all");
  const [viewMode, setViewMode] = useState<GalleryViewMode>("card");
  const [urlParamsHydrated, setUrlParamsHydrated] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_STEP);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(
    null
  );

  /* 일괄 선택 관리 상태 */
  const [isSelectMode, setIsSelectMode] = useState(false);
  const effectiveSelectMode = isAdmin && isSelectMode;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  /* 관리자 로그인 · 신규 상품 등록 모달 */
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchProducts = useCallback(async (silent = false, showSpinner = false) => {
    if (!silent && showSpinner) {
      setIsLoading(true);
      setLoadError(false);
    }
    try {
      const rows = await queryGalleryProducts();
      setProducts(rows);
      setLoadError(false);
    } catch (err) {
      console.error("제품 목록 조회 실패:", err);
      if (!silent) setLoadError(true);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  /* 초기 URL 쿼리 파싱 및 최초 데이터 조회 */
  useEffect(() => {
    const parsed = parseGalleryQueryParams(
      new URLSearchParams(window.location.search)
    );
    queueMicrotask(() => {
      if (parsed.activeCategory) setActiveCategory(parsed.activeCategory);
      if (parsed.search) setSearch(parsed.search);
      if (parsed.sort) setSort(parsed.sort);
      if (parsed.statusFilter) setStatusFilter(parsed.statusFilter);
      if (parsed.priceRange) setPriceRange(parsed.priceRange);
      if (parsed.viewMode) setViewMode(parsed.viewMode);
      setUrlParamsHydrated(true);
    });

    if (initialProducts !== null) return;
    let active = true;
    void (async () => {
      try {
        const rows = await queryGalleryProducts();
        if (active) {
          setProducts(rows);
          setLoadError(false);
        }
      } catch (err) {
        console.error("제품 목록 조회 실패:", err);
        if (active) setLoadError(true);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialProducts]);

  const hasPricedProducts = useMemo(
    () => products.some((p) => hasProductPrice(p.price)),
    [products]
  );
  const effectivePriceRange = hasPricedProducts ? priceRange : "all";

  /* 필터 상태 변경 시 URL 쿼리 파라미터 동기화 (새로고침 시 유지) */
  useEffect(() => {
    if (!urlParamsHydrated) return;
    const nextUrl = buildGalleryQueryUrl(window.location.href, {
      activeCategory,
      search,
      sort,
      statusFilter,
      priceRange,
      viewMode,
      hasPricedProducts,
    });
    window.history.replaceState(null, "", nextUrl);
  }, [
    urlParamsHydrated,
    activeCategory,
    search,
    sort,
    statusFilter,
    priceRange,
    hasPricedProducts,
    viewMode,
  ]);

  /* 카테고리별 개수 및 상태별 개수 계산 */
  const categoryCounts = useMemo(
    () => computeCategoryCounts(products),
    [products]
  );

  const sellingCount = useMemo(
    () => products.filter((p) => !isProductSold(p.status)).length,
    [products]
  );

  /* 필터링 및 정렬된 상품 목록 (제품명 + 모델명 통합 검색) */
  const filteredProducts = useMemo(
    () =>
      filterAndSortGalleryProducts(products, {
        activeCategory,
        statusFilter,
        effectivePriceRange,
        search,
        sort,
      }),
    [products, activeCategory, statusFilter, effectivePriceRange, search, sort]
  );

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, visibleLimit),
    [filteredProducts, visibleLimit]
  );

  const resetFilters = () => {
    setActiveCategory("전체");
    setSearch("");
    setStatusFilter("all");
    setPriceRange("all");
    setSort("latest");
    setVisibleLimit(PAGE_STEP);
  };

  /* 카드 클릭 시 상세 모달 오픈 및 조회수 증가 (DB 실패 시 정확히 롤백) */
  const handleProductClick = async (product: ProductItem) => {
    if (isSelectMode) {
      toggleSelectProduct(product.id);
      return;
    }

    setSelectedProduct(product);
    const prodImages = splitImages(product.image_url);
    addRecentViewedProduct({
      id: product.id,
      title: product.title,
      category: product.category || "기타",
      price: product.price ?? null,
      status: product.status,
      conditionGrade: product.condition_grade ?? null,
      modelName: extractModelName(product.description, product.title) ?? null,
      imageUrl: prodImages[0] || null,
    });
    trackEvent("view_item", {
      category: normalizeProductCategory(product.category),
      status: normalizeProductStatus(product.status),
    });

    // 관리자 로그인 상태에서는 본인 검수/수정 클릭이므로 조회수를 올리지 않음
    if (isAdmin) return;

    const prevViews = product.views || 0;
    try {
      const viewedStr = sessionStorage.getItem("viewed_products") || "[]";
      const viewedList = JSON.parse(viewedStr) as string[];
      if (viewedList.includes(product.id)) return;

      const newViews = prevViews + 1;
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, views: newViews } : p))
      );
      setSelectedProduct((prev) =>
        prev && prev.id === product.id ? { ...prev, views: newViews } : prev
      );

      const authHeaders = await getOptionalAdminAuthHeaders();
      const res = await fetch(`/api/products/${product.id}/view`, {
        headers: authHeaders,
        method: "POST",
      });
      if (!res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, views: prevViews } : p
          )
        );
        setSelectedProduct((prev) =>
          prev && prev.id === product.id ? { ...prev, views: prevViews } : prev
        );
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        views?: number;
      } | null;
      const confirmedViews =
        data && typeof data.views === "number" ? data.views : newViews;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, views: confirmedViews } : p
        )
      );
      setSelectedProduct((prev) =>
        prev && prev.id === product.id
          ? { ...prev, views: confirmedViews }
          : prev
      );

      const nextStr = sessionStorage.getItem("viewed_products") || "[]";
      const nextList = JSON.parse(nextStr) as string[];
      if (!nextList.includes(product.id)) {
        nextList.push(product.id);
        sessionStorage.setItem("viewed_products", JSON.stringify(nextList));
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, views: prevViews } : p))
      );
    }
  };


  const handleProductUpdated = (updated: ProductItem) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setSelectedProduct(updated);
  };

  /* ───── 일괄 선택 및 상태 변경/삭제 (DB 성공 후에만 반영) ───── */
  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleBulkStatusChange = async (
    targetStatus: "판매중" | "예약중" | "판매완료"
  ) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setIsBulkLoading(true);
    const toastId = toast.loading(
      `${ids.length}개 상품 상태를 '${targetStatus}'(으)로 변경 중...`
    );

    try {
      const { bulkUpdateProductStatus } = await import("../../lib/product-ops");
      const { status, updatedCount } = await bulkUpdateProductStatus(
        ids,
        targetStatus
      );

      setProducts((prev) =>
        prev.map((p) => (selectedIds.has(p.id) ? { ...p, status } : p))
      );
      toast.success(
        `${updatedCount}개 상품이 '${status}' 처리되었습니다.`,
        { id: toastId }
      );
      setSelectedIds(new Set());
    } catch (err: unknown) {
      toast.error(
        "상태 변경 실패: " +
          (err instanceof Error ? err.message : "알 수 없는 오류"),
        { id: toastId }
      );
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (
      !confirm(
        `선택한 ${ids.length}개의 상품을 영구 삭제하시겠습니까? (복구할 수 없습니다)`
      )
    )
      return;

    setIsBulkLoading(true);
    const toastId = toast.loading(`${ids.length}개 상품 삭제 중...`);

    try {
      const { bulkDeleteProductRecords } = await import(
        "../../lib/product-ops"
      );
      const targetProducts = products.filter((p) => selectedIds.has(p.id));
      await bulkDeleteProductRecords(targetProducts);

      setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      toast.success(`${ids.length}개 상품이 삭제되었습니다.`, { id: toastId });
      setSelectedIds(new Set());
    } catch (err: unknown) {
      toast.error(
        "삭제 실패: " +
          (err instanceof Error ? err.message : "알 수 없는 오류"),
        { id: toastId }
      );
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (
      !confirm(
        `'${target?.title || "이 상품"}'을(를) 영구 삭제하시겠습니까?`
      )
    )
      return;

    try {
      const { deleteProductRecord } = await import("../../lib/product-ops");
      await deleteProductRecord(id, target?.image_url);

      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
      }
      toast.success("상품이 삭제되었습니다.");
    } catch (error: unknown) {
      toast.error(
        "삭제 실패: " +
          (error instanceof Error ? error.message : "알 수 없는 오류")
      );
    }
  };

  const handleAdminLogout = async () => {
    if (confirm("관리자 모드를 종료하시겠습니까?")) {
      const { supabase } = await import("../../lib/supabase");
      await supabase.auth.signOut();
      notifyAdminAuthChanged();
      setIsSelectMode(false);
      setSelectedIds(new Set());
      toast.success("관리자 모드가 종료되었습니다.");
    }
  };


  return (
    <div className="min-h-screen bg-white text-[#141A23] font-sans flex flex-col">
      <SiteHeader>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="hb-btn-primary h-10 sm:h-11 px-3.5 sm:px-4 text-hb-sm whitespace-nowrap"
            >
              <Icon d={ICON.plus} className="w-3.5 h-3.5" /> 상품 등록
            </button>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="hidden sm:inline-flex items-center rounded-lg border border-[#E2DDD3] bg-[#FAF9F6] px-3 h-10 sm:h-11 text-hb-xs font-semibold text-[#334155] hover:text-[#141A23]"
            >
              관리자 OFF
            </button>
          </div>
        )}
      </SiteHeader>

      {/* 상단 에디토리얼 쇼룸 헤더 (타이틀 + 전시 수량 + 검색창) */}
      <section className="bg-white">
        <div className="hb-container pt-6 pb-4 sm:pt-9 sm:pb-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="text-hb-2xl sm:text-hb-3xl font-bold text-[#141A23] tracking-[-0.03em] leading-[1.2]">
                  판매 제품 갤러리
                </h1>
                {!isLoading && (
                  <span className="font-mono text-hb-sm sm:text-hb-base font-bold text-[#475569] tabular-nums">
                    {sellingCount}건 전시중
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-hb-sm text-[#64748B] break-keep">
                {STORE.name} 중촌동 직영 전시장 실매물 · 고압세척 및 배송 전 작동 점검 완료
              </p>
            </div>

            {/* 통합 검색창 + 모바일 상세필터 토글 */}
            <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
              <div className="relative flex-1 lg:w-80">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none">
                  <Icon d={ICON.search} className="w-4 h-4" />
                </span>
                <input
                  id="gallery-search"
                  name="gallery-search"
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisibleLimit(PAGE_STEP);
                  }}
                  placeholder="브랜드·제품명·모델명 검색"
                  aria-label="브랜드, 제품명 또는 모델명 검색"
                  className="w-full h-10 pl-10 pr-8 rounded-full border border-[#D8D1C5] bg-[#FAF9F6] text-hb-base sm:text-hb-sm font-medium text-[#141A23] placeholder:text-[#64748B] focus:border-[#141A23] focus:bg-white focus:outline-none transition-[border-color,background-color] duration-150"
                />
                {search.trim() !== "" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setVisibleLimit(PAGE_STEP);
                    }}
                    aria-label="검색어 지우기"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#141A23] p-0.5 cursor-pointer"
                  >
                    <Icon d={ICON.close} className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobileFilterOpen((v) => !v)}
                aria-expanded={mobileFilterOpen}
                className={`lg:hidden h-10 px-3.5 inline-flex items-center gap-1.5 rounded-full border text-hb-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  mobileFilterOpen ||
                  statusFilter !== "all" ||
                  (hasPricedProducts && priceRange !== "all") ||
                  sort !== "latest"
                    ? "border-[#141A23] bg-[#141A23] text-white"
                    : "border-[#D8D1C5] bg-white text-[#141A23] hover:border-[#141A23]"
                }`}
              >
                <span>필터</span>
                <Icon
                  d={ICON.down}
                  className={`w-3.5 h-3.5 transition-transform ${
                    mobileFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 스티키 언더라인 카테고리 탭 및 미니멀 필터 바 */}
      <div className="sticky top-16 sm:top-[72px] z-30 border-b border-[#E2DDD3] bg-white/95 backdrop-blur-md">
        <div className="hb-container pt-1 pb-2.5 flex flex-col gap-2.5">
          {/* 1행: 좌측 언더라인 품목 탭 + 우측 데스크톱 인라인 셀렉트 */}
          <div className="flex items-center justify-between gap-4 border-b border-[#F1EFEA]">
            <div className="relative min-w-0 flex-1">
              <div
                className="flex items-center gap-5 sm:gap-7 overflow-x-auto scrollbar-none pr-8 sm:pr-2"
                role="tablist"
                aria-label="상품 카테고리 필터"
              >
                {CATEGORIES_WITH_ALL.map((cat) => {
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setActiveCategory(cat);
                        setVisibleLimit(PAGE_STEP);
                      }}
                      className={`relative pb-3 pt-1.5 inline-flex items-center text-hb-sm font-bold whitespace-nowrap transition-colors duration-150 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] rounded-t ${
                        active
                          ? "text-[#141A23]"
                          : "text-[#64748B] hover:text-[#141A23]"
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="ml-1.5 font-mono text-hb-xs font-semibold text-[#64748B] tabular-nums">
                        {categoryCounts[cat] || 0}
                      </span>
                      <span
                        className={`absolute inset-x-0 bottom-0 h-[2px] bg-[#141A23] transition-opacity duration-150 ${
                          active ? "opacity-100" : "opacity-0"
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
              {/* 모바일 가로 스크롤 우측 페이드 힌트 마스크 */}
              <div
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/95 to-transparent sm:hidden"
                aria-hidden="true"
              />
            </div>

            {/* 데스크톱 우측 인라인 필터 */}
            <div className="hidden lg:flex items-center gap-2 pb-2 shrink-0">
              <select
                id="gallery-status-desktop"
                name="gallery-status-desktop"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setVisibleLimit(PAGE_STEP);
                }}
                aria-label="판매 상태 필터"
                className="h-8 px-3 rounded-lg border border-[#E2DDD3] bg-white text-hb-xs font-semibold text-[#334155] hover:border-[#141A23] focus:border-[#141A23] focus:outline-none cursor-pointer"
              >
                <option value="all">전체 상태</option>
                <option value="selling">판매중만</option>
                <option value="reserved">예약중</option>
                <option value="sold">판매완료</option>
              </select>

              {hasPricedProducts && (
                <select
                  id="gallery-price-desktop"
                  name="gallery-price-desktop"
                  value={priceRange}
                  onChange={(e) => {
                    const nextPrice = e.target.value as PriceRangeOption;
                    setPriceRange(nextPrice);
                    setVisibleLimit(PAGE_STEP);
                    trackEvent("filter_gallery", {
                      category: activeCategory,
                      price_range: nextPrice,
                    });
                  }}
                  aria-label="가격대 범위 필터"
                  className={`h-8 px-3 rounded-lg border text-hb-xs font-semibold focus:border-[#141A23] focus:outline-none cursor-pointer ${
                    priceRange !== "all"
                      ? "border-[#C84312] bg-[#FFF4EE] text-[#C84312]"
                      : "border-[#E2DDD3] bg-white text-[#334155] hover:border-[#141A23]"
                  }`}
                >
                  {PRICE_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              <select
                id="gallery-sort-desktop"
                name="gallery-sort-desktop"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                aria-label="정렬 기준"
                className="h-8 px-3 rounded-lg border border-[#E2DDD3] bg-white text-hb-xs font-semibold text-[#334155] hover:border-[#141A23] focus:border-[#141A23] focus:outline-none cursor-pointer"
              >
                <option value="latest">최신 등록순</option>
                <option value="views">조회 많은순</option>
                <option value="priceAsc">낮은 가격순</option>
                <option value="priceDesc">높은 가격순</option>
              </select>
            </div>
          </div>

          {/* 2행: 맞춤 탐색 상황별 큐레이션 레일 */}
          <div
            className={`${
              mobileFilterOpen ? "flex" : "hidden lg:flex"
            } flex-col lg:flex-row lg:items-center justify-between gap-2`}
          >
              <div className="relative min-w-0 flex-1 flex items-center gap-2.5">
                <span className="hidden lg:inline-flex items-center shrink-0 text-hb-xs font-semibold text-[#64748B]">
                  맞춤 탐색
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pr-6 sm:pr-0 text-hb-xs">
                  {SITUATION_PRESETS.map((preset) => {
                    const active =
                      activeCategory === preset.category &&
                      (!preset.keyword || search === preset.keyword);
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setActiveCategory(preset.category);
                          setSearch(preset.keyword);
                          setVisibleLimit(PAGE_STEP);
                          trackEvent("click_situation_preset", {
                            preset: preset.label,
                            category: preset.category,
                            keyword: preset.keyword,
                          });
                        }}
                        className={`h-8 inline-flex items-center gap-1.5 rounded-full px-3.5 font-semibold transition-[background-color,color] shrink-0 cursor-pointer ${
                          active
                            ? "bg-[#141A23] text-white"
                            : "bg-[#F4F1EA] text-[#334155] hover:bg-[#EAE5DC] hover:text-[#141A23]"
                        }`}
                        title={preset.desc}
                      >
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
                {/* 모바일 가로 스크롤 우측 페이드 힌트 마스크 */}
                <div
                  className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/95 to-transparent sm:hidden"
                  aria-hidden="true"
                />
              </div>

              <div className="grid grid-cols-3 lg:hidden gap-1.5">
                <select
                  id="gallery-status-mobile"
                  name="gallery-status-mobile"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setVisibleLimit(PAGE_STEP);
                  }}
                  aria-label="모바일 판매 상태 필터"
                  className="h-10 px-2.5 rounded-lg border border-[#E2E6EC] bg-white text-hb-base sm:text-hb-xs font-bold text-[#141A23] focus:border-[#141A23] focus:outline-none"
                >
                  <option value="all">전체 상태</option>
                  <option value="selling">판매중만</option>
                  <option value="reserved">예약중</option>
                  <option value="sold">판매완료</option>
                </select>

                {hasPricedProducts && (
                  <select
                    id="gallery-price-mobile"
                    name="gallery-price-mobile"
                    value={priceRange}
                    onChange={(e) => {
                      const nextPrice = e.target.value as PriceRangeOption;
                      setPriceRange(nextPrice);
                      setVisibleLimit(PAGE_STEP);
                    }}
                    aria-label="모바일 가격대 필터"
                    className="h-10 px-2.5 rounded-lg border border-[#E2E6EC] bg-white text-hb-base sm:text-hb-xs font-bold text-[#141A23] focus:border-[#141A23] focus:outline-none"
                  >
                    {PRICE_RANGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  id="gallery-sort-mobile"
                  name="gallery-sort-mobile"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  aria-label="모바일 정렬 기준"
                  className="h-10 px-2.5 rounded-lg border border-[#E2E6EC] bg-white text-hb-base sm:text-hb-xs font-bold text-[#141A23] focus:border-[#141A23] focus:outline-none"
                >
                  <option value="latest">최신 등록순</option>
                  <option value="views">조회 많은순</option>
                  <option value="priceAsc">낮은 가격순</option>
                  <option value="priceDesc">높은 가격순</option>
                </select>
              </div>
            </div>
        </div>
      </div>

      {/* 메인 상품 그리드 */}
      <main id="main-content" tabIndex={-1} className="hb-container py-6 sm:py-8 flex-1 focus:outline-none">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-[#E5E0D7]">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-hb-xs sm:text-hb-sm text-[#475569]">
              {isLoading ? (
                "상품 목록을 불러오는 중..."
              ) : (
                <>
                  전체{" "}
                  <strong className="font-mono text-[#141A23] font-bold tabular-nums">
                    {filteredProducts.length}
                  </strong>
                  건
                </>
              )}
            </p>
            {(activeCategory !== "전체" ||
              search.trim() !== "" ||
              statusFilter !== "all" ||
              (hasPricedProducts && priceRange !== "all") ||
              sort !== "latest") && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-hb-xs font-bold text-[#C84312] underline underline-offset-4 hover:text-[#141A23] ml-1 cursor-pointer"
              >
                초기화
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="매물 표시 방식"
              className="hb-segmented-control"
            >
              <button
                type="button"
                aria-pressed={viewMode === "card"}
                onClick={() => {
                  setViewMode("card");
                  trackEvent("gallery_view_mode", { mode: "card" });
                }}
                className={`hb-segmented-item cursor-pointer ${
                  viewMode === "card"
                    ? "bg-[#141A23] text-white shadow-2xs"
                    : "text-[#475569] hover:text-[#141A23]"
                }`}
              >
                <Icon d={ICON.grid} className="w-3.5 h-3.5" />
                <span>카드 보기</span>
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "table"}
                onClick={() => {
                  setViewMode("table");
                  trackEvent("gallery_view_mode", { mode: "table" });
                }}
                className={`hb-segmented-item cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[#141A23] text-white shadow-2xs"
                    : "text-[#475569] hover:text-[#141A23]"
                }`}
              >
                <Icon d={ICON.list} className="w-3.5 h-3.5" />
                <span>스펙 표 보기</span>
              </button>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  setSelectedIds(new Set());
                }}
                className={`px-3 h-9 rounded-lg text-hb-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  effectiveSelectMode
                    ? "bg-[#C84312] text-white border-[#C84312]"
                    : "bg-white text-[#141A23] border-[#E2DDD3] hover:bg-[#FAF9F6]"
                }`}
              >
                <Icon d={ICON.check} className="w-3.5 h-3.5" />
                {effectiveSelectMode ? "선택 종료" : "일괄 관리"}
              </button>
            )}
          </div>
        </div>

        {activeCategory === "에어컨/냉난방기" && (
          <AirconSetGuideBanner variant="banner" className="mb-6" />
        )}

        {/* [기능 4] 비로그인 최근 본 매물 상단 슬림 스트립 */}
        <RecentViewedStrip compact className="mb-5" />

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 sm:gap-x-4 lg:gap-x-5 gap-y-7 sm:gap-y-9 lg:gap-y-11">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={`sk-${idx}`} className="animate-pulse">
                <div className="aspect-square rounded-lg bg-[#F4F3F0]" />
                <div className="pt-2.5 sm:pt-3 space-y-1.5">
                  <div className="h-3.5 bg-[#F4F3F0] rounded w-1/3" />
                  <div className="h-3.5 bg-[#F4F3F0] rounded w-11/12" />
                  <div className="h-3 bg-[#F4F3F0] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="py-16 px-6 text-center bg-white rounded-xl border border-[#E2E6EC]">
            <p className="text-[#141A23] text-hb-lg font-bold">
              상품 목록을 불러오지 못했습니다.
            </p>
            <p className="mt-1 text-hb-sm text-[#64748B]">
              네트워크 연결을 확인하신 후 다시 시도해 주세요.
            </p>
            <button
              type="button"
              onClick={() => void fetchProducts(false, true)}
              className="hb-btn-primary mt-5 h-10 px-5 text-hb-sm"
            >
              다시 불러오기
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white rounded-xl border border-[#E2E6EC] shadow-2xs">
            <p className="text-[#141A23] text-hb-lg font-bold">
              {search.trim()
                ? `'${search.trim()}' 검색 조건에 맞는 등록 매물이 없습니다.`
                : "선택하신 필터 조건에 맞는 상품이 없습니다."}
            </p>
            <p className="mt-1.5 text-[#64748B] text-hb-sm max-w-lg mx-auto break-keep">
              중촌동 직영 매장에는 온라인에 미처 올리지 못한 대기 매물이 많습니다. 찾으시는 품목을 바로 문의해 주시면 창고 재고를 즉시 확인해 드립니다.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={resetFilters}
                className="hb-btn-outline h-11 px-5 text-hb-sm"
              >
                전체 필터 초기화
              </button>
              <Link
                href={`/inquiry?write=1&type=${encodeURIComponent(
                  activeCategory === "업소용기기" ? "대량·업소용 상담" : "구매 문의"
                )}&title=${encodeURIComponent(
                  `[미등록 재고문의] ${
                    search.trim() || activeCategory
                  } 매물 재고 확인 부탁드립니다`
                )}`}
                className="hb-btn-accent h-11 px-5 text-hb-sm"
              >
                <Icon d={ICON.pen} className="w-4 h-4" />
                <span>
                  &lsquo;{search.trim() || activeCategory}&rsquo; 매장 미등록 재고 문의
                </span>
              </Link>
              <a
                href={smsHref(
                  STORE.mobile,
                  `[${STORE.name} 미등록재고문의] 홈페이지에서 '${
                    search.trim() || activeCategory
                  }' 검색 후 문의드립니다. 매장 보유 재고와 사진 확인 가능할까요?`
                )}
                className="hb-btn-primary h-11 px-5 text-hb-sm"
              >
                <Icon d={ICON.chat} className="w-4 h-4 text-[#FF8A50]" />
                <span>문자로 실물사진 요청</span>
              </a>
              <a
                href={STORE.kakaoChat}
                target="_blank"
                rel="noopener noreferrer"
                className="hb-btn-kakao h-11 px-5 text-hb-sm"
              >
                <Icon d={ICON.chat} className="w-4 h-4" /> 카톡으로 재고 문의
              </a>
            </div>
          </div>
        ) : (
          <>
            <h2 className="sr-only">판매 제품 목록</h2>
            {viewMode === "table" ? (
              <GallerySpecTable
                products={displayedProducts}
                isSelectMode={effectiveSelectMode}
                selectedIds={selectedIds}
                isAdmin={isAdmin}
                onProductClick={handleProductClick}
                onQuickView={handleProductClick}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 sm:gap-x-4 lg:gap-x-5 gap-y-6 sm:gap-y-7 lg:gap-y-8">
                {displayedProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    eager={idx < 5}
                    onSelect={effectiveSelectMode ? handleProductClick : undefined}
                    onQuickView={handleProductClick}
                    isSelectMode={effectiveSelectMode}
                    isSelected={selectedIds.has(product.id)}
                    isAdmin={isAdmin}
                    onDelete={handleDeleteProduct}
                  />
                ))}
              </div>
            )}

            {filteredProducts.length > visibleLimit && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + PAGE_STEP)}
                  className="hb-btn-outline h-12 px-8 text-hb-sm"
                >
                  <span>
                    상품 더 보기 ({filteredProducts.length - visibleLimit}건 남음)
                  </span>
                  <Icon d={ICON.down} className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* 미등록 매장 재고 및 맞춤 사양 문의 배너 */}
        <div className="mt-12 rounded-xl border border-[#E2E6EC] bg-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
          <div>
            <span className="hb-eyebrow">미등록 매장 재고 문의</span>
            <h2 className="mt-1.5 text-hb-lg font-bold text-[#141A23]">
              찾으시는 모델이나 용량·수량이 목록에 없으신가요?
            </h2>
            <p className="mt-1 text-hb-sm text-[#334155] leading-relaxed break-keep">
              중촌동 매장에는 세척·점검을 마치고 아직 홈페이지에 업로드되지 않은 가전과 업소용 주방설비가 상시 대기 중입니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={telHref(STORE.tel)}
              className="hb-btn-accent h-11 px-4 text-hb-sm"
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5" />
              <span>전화 재고 문의 ({STORE.tel})</span>
            </a>
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              className="hb-btn-kakao h-11 px-4 text-hb-sm"
            >
              <Icon d={ICON.chat} className="w-3.5 h-3.5" />
              <span>카톡 실물사진 요청</span>
            </a>
          </div>
        </div>
      </main>

      {/* 관리자 일괄 선택 플로팅 작업 바 (지연 로딩) */}
      {effectiveSelectMode && (
        <GalleryBulkActionBar
          selectedCount={selectedIds.size}
          totalFilteredCount={filteredProducts.length}
          isBulkLoading={isBulkLoading}
          onToggleSelectAll={toggleSelectAll}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkDelete={handleBulkDelete}
          onClose={() => {
            setIsSelectMode(false);
            setSelectedIds(new Set());
          }}
        />
      )}

      <SiteFooter
        isAdmin={isAdmin}
        onAdminClick={() =>
          isAdmin ? handleAdminLogout() : setIsAdminAuthModalOpen(true)
        }
      />
      <MobileCtaBar
        primaryActionLabel="재고·견적문의"
        inquiryFallbackType="구매 문의"
      />

      {/* 상세 보기 및 단건 수정 모달 (지연 로딩) */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isAdmin={isAdmin}
          onClose={() => setSelectedProduct(null)}
          onProductUpdated={handleProductUpdated}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {/* 관리자 신규 상품 등록 모달 (지연 로딩) */}
      {isAdmin && isUploadModalOpen && (
        <GalleryAdminUploadController
          open={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploaded={() => fetchProducts()}
        />
      )}

      {/* 관리자 로그인 모달 */}
      <AdminLoginModal
        open={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
      />
    </div>
  );
}