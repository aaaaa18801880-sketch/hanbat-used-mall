// 파일 경로: lib/gallery-filter.ts
// 판매 제품 갤러리 필터·정렬·카운트·URL 쿼리 동기화 순수 도메인 헬퍼

import {
  extractModelName,
  hasProductPrice,
  isProductReserved,
  isProductSold,
  matchesSearchQuery,
  normalizeProductCategory,
  PRODUCT_CATEGORIES,
} from "./site";

export type PriceRangeOption =
  | "all"
  | "under30"
  | "30to70"
  | "70to150"
  | "over150";
export type SortOption = "latest" | "views" | "priceAsc" | "priceDesc";
export type StatusFilter = "all" | "selling" | "reserved" | "sold";
export type GalleryViewMode = "card" | "table";

export const CATEGORIES_WITH_ALL = ["전체", ...PRODUCT_CATEGORIES] as const;
export const PAGE_STEP = 25;

export const PRICE_RANGE_OPTIONS: ReadonlyArray<{
  value: PriceRangeOption;
  label: string;
  min?: number;
  max?: number;
}> = [
  { value: "all", label: "전체 가격대" },
  { value: "under30", label: "30만원 이하", max: 300000 },
  { value: "30to70", label: "30만 ~ 70만원", min: 300000, max: 700000 },
  { value: "70to150", label: "70만 ~ 150만원", min: 700000, max: 1500000 },
  { value: "over150", label: "150만원 이상", min: 1500000 },
] as const;

export const SITUATION_PRESETS = [
  {
    label: "원룸·자취필수",
    category: "냉장고",
    keyword: "",
    desc: "원룸·오피스텔 입주용 가전",
  },
  {
    label: "카페·디저트창업",
    category: "업소용기기",
    keyword: "쇼케이스",
    desc: "제빙기·테이블냉장·쇼케이스",
  },
  {
    label: "식당·주방설비",
    category: "업소용기기",
    keyword: "45박스",
    desc: "45박스·식기세척기·작업대",
  },
  {
    label: "사계절 냉난방",
    category: "에어컨/냉난방기",
    keyword: "냉난방",
    desc: "상가·사무실·가정용 냉난방기",
  },
] as const;

export interface FilterableGalleryProduct {
  title: string;
  category: string | null;
  description?: string | null;
  price: number | null;
  status: string | null;
  created_at: string;
  views?: number | null;
}

export interface GalleryFilterState {
  activeCategory: string;
  search: string;
  sort: SortOption;
  statusFilter: StatusFilter;
  priceRange: PriceRangeOption;
  viewMode: GalleryViewMode;
}

const VALID_SORTS = new Set<SortOption>([
  "latest",
  "views",
  "priceAsc",
  "priceDesc",
]);
const VALID_STATUSES = new Set<StatusFilter>([
  "all",
  "selling",
  "reserved",
  "sold",
]);
const VALID_PRICE_RANGES = new Set<PriceRangeOption>([
  "all",
  "under30",
  "30to70",
  "70to150",
  "over150",
]);

/**
 * URLSearchParams에서 유효한 갤러리 필터 초기 상태를 파싱합니다.
 */
export function parseGalleryQueryParams(
  params: URLSearchParams
): Partial<GalleryFilterState> {
  const next: Partial<GalleryFilterState> = {};

  const catParam = params.get("category");
  if (catParam) {
    const normalized =
      catParam === "전체" ? "전체" : normalizeProductCategory(catParam);
    if ((CATEGORIES_WITH_ALL as readonly string[]).includes(normalized)) {
      next.activeCategory = normalized;
    }
  }

  const qParam = params.get("q");
  if (qParam) {
    next.search = qParam;
  }

  const sortParam = params.get("sort") as SortOption | null;
  if (sortParam && VALID_SORTS.has(sortParam)) {
    next.sort = sortParam;
  }

  const statusParam = params.get("status") as StatusFilter | null;
  if (statusParam && VALID_STATUSES.has(statusParam)) {
    next.statusFilter = statusParam;
  }

  const priceParam = params.get("price") as PriceRangeOption | null;
  if (priceParam && VALID_PRICE_RANGES.has(priceParam)) {
    next.priceRange = priceParam;
  }

  if (params.get("view") === "table") {
    next.viewMode = "table";
  }

  return next;
}

/**
 * 현재 필터 상태를 URL 쿼리스트링으로 직렬화합니다.
 */
export function buildGalleryQueryUrl(
  currentHref: string,
  state: GalleryFilterState & { hasPricedProducts: boolean }
): string {
  const url = new URL(currentHref);

  if (state.activeCategory && state.activeCategory !== "전체") {
    url.searchParams.set("category", state.activeCategory);
  } else {
    url.searchParams.delete("category");
  }

  if (state.search.trim()) {
    url.searchParams.set("q", state.search.trim());
  } else {
    url.searchParams.delete("q");
  }

  if (state.sort !== "latest") {
    url.searchParams.set("sort", state.sort);
  } else {
    url.searchParams.delete("sort");
  }

  if (state.statusFilter !== "all") {
    url.searchParams.set("status", state.statusFilter);
  } else {
    url.searchParams.delete("status");
  }

  if (state.hasPricedProducts && state.priceRange !== "all") {
    url.searchParams.set("price", state.priceRange);
  } else {
    url.searchParams.delete("price");
  }

  if (state.viewMode === "table") {
    url.searchParams.set("view", "table");
  } else {
    url.searchParams.delete("view");
  }

  return url.toString();
}

/**
 * 카테고리별 매물 개수를 집계합니다.
 */
export function computeCategoryCounts<T extends { category: string | null }>(
  products: readonly T[]
): Record<string, number> {
  const counts: Record<string, number> = { 전체: products.length };
  for (const product of products) {
    const key = normalizeProductCategory(product.category);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/**
 * 갤러리 상품 목록을 카테고리·상태·가격대·검색어로 필터링하고 정렬합니다.
 * - 판매완료 매물은 정렬 기준과 무관하게 항상 하단으로 배치됩니다.
 */
export function filterAndSortGalleryProducts<
  T extends FilterableGalleryProduct,
>(
  products: readonly T[],
  {
    activeCategory,
    statusFilter,
    effectivePriceRange,
    search,
    sort,
  }: {
    activeCategory: string;
    statusFilter: StatusFilter;
    effectivePriceRange: PriceRangeOption;
    search: string;
    sort: SortOption;
  }
): T[] {
  const q = search.trim().toLowerCase();

  const list = products.filter((p) => {
    const cat = normalizeProductCategory(p.category);
    if (activeCategory !== "전체" && cat !== activeCategory) return false;

    const sold = isProductSold(p.status);
    const reserved = isProductReserved(p.status);
    if (statusFilter === "selling" && (sold || reserved)) return false;
    if (statusFilter === "reserved" && !reserved) return false;
    if (statusFilter === "sold" && !sold) return false;

    if (effectivePriceRange !== "all") {
      if (!hasProductPrice(p.price)) return false;
      const priceVal = Number(p.price);
      if (effectivePriceRange === "under30" && priceVal > 300000) return false;
      if (
        effectivePriceRange === "30to70" &&
        (priceVal < 300000 || priceVal > 700000)
      ) {
        return false;
      }
      if (
        effectivePriceRange === "70to150" &&
        (priceVal < 700000 || priceVal > 1500000)
      ) {
        return false;
      }
      if (effectivePriceRange === "over150" && priceVal < 1500000) return false;
    }

    if (q) {
      const modelText = extractModelName(p.description, p.title) || "";
      if (!matchesSearchQuery(q, p.title, modelText, p.description)) {
        return false;
      }
    }

    return true;
  });

  const MAX = Number.MAX_SAFE_INTEGER;
  return [...list].sort((a, b) => {
    const soldA = isProductSold(a.status) ? 1 : 0;
    const soldB = isProductSold(b.status) ? 1 : 0;
    if (soldA !== soldB) return soldA - soldB;

    if (sort === "priceAsc") {
      return (
        (hasProductPrice(a.price) ? a.price! : MAX) -
        (hasProductPrice(b.price) ? b.price! : MAX)
      );
    }
    if (sort === "priceDesc") {
      return (b.price || 0) - (a.price || 0);
    }
    if (sort === "views") {
      return (b.views || 0) - (a.views || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
