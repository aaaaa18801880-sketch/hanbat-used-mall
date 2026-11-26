// 파일 경로: lib/gallery-filter.ts
// 판매 제품 갤러리 필터·정렬·카운트·URL 쿼리 동기화 순수 도메인 헬퍼

import {
  extractModelName,
  extractWidthMmFromText,
  hasProductPrice,
  isProductPendingReview,
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
export type SortOption =
  | "latest"
  | "yearDesc"
  | "capacityDesc"
  | "capacityAsc"
  | "views"
  | "priceAsc"
  | "priceDesc";
export type StatusFilter = "all" | "selling" | "reserved" | "sold";
export type VoltageFilter = "all" | "220v" | "380v";
export type GalleryViewMode = "card" | "table";

export const CATEGORIES_WITH_ALL = ["전체", ...PRODUCT_CATEGORIES] as const;
export const PAGE_STEP = 25;

export const VOLTAGE_FILTER_OPTIONS: ReadonlyArray<{
  value: VoltageFilter;
  label: string;
}> = [
  { value: "all", label: "전체 전압" },
  { value: "220v", label: "단상 220V" },
  { value: "380v", label: "삼상 380V" },
] as const;

export const SORT_OPTION_LABELS: Record<SortOption, string> = {
  latest: "최신 등록순",
  yearDesc: "최신 제조년월순",
  capacityDesc: "평형·용량 큰순",
  capacityAsc: "평형·용량 작은순",
  views: "조회 많은순",
  priceAsc: "낮은 가격순",
  priceDesc: "높은 가격순",
};

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
  voltageFilter?: VoltageFilter;
  priceRange: PriceRangeOption;
  viewMode: GalleryViewMode;
}

const VALID_SORTS = new Set<SortOption>([
  "latest",
  "yearDesc",
  "capacityDesc",
  "capacityAsc",
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
const VALID_VOLTAGES = new Set<VoltageFilter>(["all", "220v", "380v"]);
const VALID_PRICE_RANGES = new Set<PriceRangeOption>([
  "all",
  "under30",
  "30to70",
  "70to150",
  "over150",
]);

export interface ProductCapacityMetric {
  value: number;
  unit: "평" | "L" | "kg" | "박스" | "mm";
  normalizedScore: number;
}

/**
 * 제목과 상세 설명에서 제조년월을 YYYYMM 정수(월 미표기 시 YYYY00)로 추출합니다.
 */
export function extractProductManufactureDateValue(
  title?: string | null,
  description?: string | null
): number | null {
  const combined = `${title ?? ""}\n${description ?? ""}`;
  if (!combined.trim()) return null;

  const isValidYear = (year: number) => year >= 2010 && year <= 2035;

  // 1순위: 월까지 표기된 제조년월 우선 추출 (예: "2024년 4월", "2019-06")
  const korMonthMatch = combined.match(
    /(?:^|[^\d])(20[12]\d)\s*년\s*(0?[1-9]|1[0-2])\s*월/
  );
  if (korMonthMatch) {
    const year = Number(korMonthMatch[1]);
    if (isValidYear(year)) {
      return year * 100 + Number(korMonthMatch[2]);
    }
  }

  const dashMonthMatch = combined.match(
    /(?:^|[^\d])(20[12]\d)[-.](0?[1-9]|1[0-2])(?=$|[^\d])/
  );
  if (dashMonthMatch) {
    const year = Number(dashMonthMatch[1]);
    if (isValidYear(year)) {
      return year * 100 + Number(dashMonthMatch[2]);
    }
  }

  // 2순위: 연도만 표기된 경우 (예: "2024년 제조", "2022년식", "'23년식")
  const korYearMatch = combined.match(/(?:^|[^\d])(20[12]\d)\s*년/);
  if (korYearMatch) {
    const year = Number(korYearMatch[1]);
    if (isValidYear(year)) {
      return year * 100;
    }
  }

  const shortMatch = combined.match(/(?:'|\b)([12]\d)\s*년(?:식|형)/);
  if (shortMatch) {
    const year = 2000 + Number(shortMatch[1]);
    if (isValidYear(year)) {
      return year * 100;
    }
  }

  return null;
}

/**
 * 제목·상세 설명·카테고리에서 평형/용량 크기 지표를 추출합니다.
 */
export function extractProductCapacityMetric(
  title?: string | null,
  description?: string | null,
  category?: string | null
): ProductCapacityMetric | null {
  const combined = `${title ?? ""}\n${description ?? ""}`;
  if (!combined.trim()) return null;

  const normalizedCategory = normalizeProductCategory(category);

  const pyeongMatch = combined.match(
    /(?<![A-Za-z0-9])(\d{1,3}(?:\.\d+)?)\s*평형?/
  );
  if (pyeongMatch) {
    const val = Number(pyeongMatch[1]);
    if (Number.isFinite(val) && val > 0 && val <= 300) {
      return { value: val, unit: "평", normalizedScore: val * 30 };
    }
  }

  if (normalizedCategory === "에어컨/냉난방기") {
    const kwMatch = combined.match(
      /(?<![A-Za-z0-9])(\d{1,2}(?:\.\d+)?)\s*kW\b/i
    );
    if (kwMatch) {
      const kw = Number(kwMatch[1]);
      if (Number.isFinite(kw) && kw > 0 && kw <= 100) {
        const pyeong = Math.round((kw / 0.4) * 10) / 10;
        return { value: pyeong, unit: "평", normalizedScore: pyeong * 30 };
      }
    }
  }

  const boxMatch = combined.match(/(?<![A-Za-z0-9])(\d{2,3})\s*박스/);
  if (boxMatch) {
    const val = Number(boxMatch[1]);
    if (Number.isFinite(val) && val > 0) {
      return { value: val, unit: "박스", normalizedScore: val * 26 };
    }
  }

  const literMatch = combined.match(
    /(?<![A-Za-z0-9-])(\d{2,4}(?:,\d{3})*)\s*(?:L|리터)(?![A-Za-z0-9])/i
  );
  if (literMatch) {
    const val = Number(literMatch[1].replace(/,/g, ""));
    if (Number.isFinite(val) && val >= 10 && val <= 9999) {
      return { value: val, unit: "L", normalizedScore: val };
    }
  }

  const kgMatch = combined.match(
    /(?<![A-Za-z0-9-])(\d{1,3}(?:\.\d+)?)\s*kg(?![A-Za-z0-9])/i
  );
  if (kgMatch) {
    const val = Number(kgMatch[1]);
    if (Number.isFinite(val) && val > 0) {
      return { value: val, unit: "kg", normalizedScore: val * 20 };
    }
  }

  const widthMm = extractWidthMmFromText(combined);
  if (widthMm) {
    return { value: widthMm, unit: "mm", normalizedScore: widthMm * 0.4 };
  }

  return null;
}

/**
 * 제목과 상세 설명에서 전원 규격(단상 220V / 삼상 380V)을 추출합니다.
 */
export function extractProductVoltage(
  title?: string | null,
  description?: string | null
): "220v" | "380v" | null {
  const combined = `${title ?? ""}\n${description ?? ""}`;
  if (!combined.trim()) return null;
  if (/(?:삼상|3상|380\s*V)/i.test(combined)) return "380v";
  if (/(?:단상|220\s*V)/i.test(combined)) return "220v";
  return null;
}

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

  const voltageParam = params.get("voltage") as VoltageFilter | null;
  if (voltageParam && VALID_VOLTAGES.has(voltageParam)) {
    next.voltageFilter = voltageParam;
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

  if (state.voltageFilter && state.voltageFilter !== "all") {
    url.searchParams.set("voltage", state.voltageFilter);
  } else {
    url.searchParams.delete("voltage");
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
export function computeCategoryCounts<
  T extends { category: string | null; status?: string | null },
>(products: readonly T[]): Record<string, number> {
  const visible = products.filter((p) => !isProductPendingReview(p.status));
  const counts: Record<string, number> = { 전체: visible.length };
  for (const product of visible) {
    const key = normalizeProductCategory(product.category);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

interface ProductMatchCriteria {
  activeCategory: string;
  statusFilter: StatusFilter;
  voltageFilter?: VoltageFilter;
  effectivePriceRange: PriceRangeOption;
  search: string;
}

function matchesProductCriteria<T extends FilterableGalleryProduct>(
  p: T,
  {
    activeCategory,
    statusFilter,
    voltageFilter = "all",
    effectivePriceRange,
    search,
  }: ProductMatchCriteria
): boolean {
  if (isProductPendingReview(p.status)) return false;

  const cat = normalizeProductCategory(p.category);
  if (activeCategory !== "전체" && cat !== activeCategory) return false;

  const sold = isProductSold(p.status);
  const reserved = isProductReserved(p.status);
  if (statusFilter === "selling" && (sold || reserved)) return false;
  if (statusFilter === "reserved" && !reserved) return false;
  if (statusFilter === "sold" && !sold) return false;

  if (voltageFilter !== "all") {
    const voltage = extractProductVoltage(p.title, p.description);
    if (voltage !== voltageFilter) return false;
  }

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

  const q = search.trim().toLowerCase();
  if (q) {
    const modelText = extractModelName(p.description, p.title) || "";
    if (!matchesSearchQuery(q, p.title, modelText, p.description)) {
      return false;
    }
  }

  return true;
}

/**
 * 판매 상태 필터별 일치 매물 수를 교차 집계합니다.
 */
export function computeStatusFacetCounts<T extends FilterableGalleryProduct>(
  products: readonly T[],
  criteria: Omit<ProductMatchCriteria, "statusFilter">
): Record<StatusFilter, number> {
  const base = products.filter((p) =>
    matchesProductCriteria(p, { ...criteria, statusFilter: "all" })
  );
  let selling = 0;
  let reserved = 0;
  let sold = 0;
  for (const p of base) {
    if (isProductSold(p.status)) sold += 1;
    else if (isProductReserved(p.status)) reserved += 1;
    else selling += 1;
  }
  return {
    all: base.length,
    selling,
    reserved,
    sold,
  };
}

/**
 * 전원 규격(단상 220V / 삼상 380V) 필터별 일치 매물 수를 교차 집계합니다.
 */
export function computeVoltageFacetCounts<T extends FilterableGalleryProduct>(
  products: readonly T[],
  criteria: Omit<ProductMatchCriteria, "voltageFilter">
): Record<VoltageFilter, number> {
  const base = products.filter((p) =>
    matchesProductCriteria(p, { ...criteria, voltageFilter: "all" })
  );
  let v220 = 0;
  let v380 = 0;
  for (const p of base) {
    const v = extractProductVoltage(p.title, p.description);
    if (v === "220v") v220 += 1;
    else if (v === "380v") v380 += 1;
  }
  return {
    all: base.length,
    "220v": v220,
    "380v": v380,
  };
}

/**
 * 상황별 맞춤 프리셋별 일치 매물 수를 집계합니다.
 */
export function computeSituationPresetCounts<
  T extends FilterableGalleryProduct,
>(products: readonly T[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const preset of SITUATION_PRESETS) {
    counts[preset.label] = products.filter((p) =>
      matchesProductCriteria(p, {
        activeCategory: preset.category,
        statusFilter: "all",
        voltageFilter: "all",
        effectivePriceRange: "all",
        search: preset.keyword,
      })
    ).length;
  }
  return counts;
}

/**
 * 갤러리 상품 목록을 카테고리·상태·전압·가격대·검색어로 필터링하고 정렬합니다.
 * - 판매완료 매물은 정렬 기준과 무관하게 항상 하단으로 배치됩니다.
 */
export function filterAndSortGalleryProducts<
  T extends FilterableGalleryProduct,
>(
  products: readonly T[],
  {
    activeCategory,
    statusFilter,
    voltageFilter = "all",
    effectivePriceRange,
    search,
    sort,
  }: ProductMatchCriteria & {
    sort: SortOption;
  }
): T[] {
  const list = products.filter((p) =>
    matchesProductCriteria(p, {
      activeCategory,
      statusFilter,
      voltageFilter,
      effectivePriceRange,
      search,
    })
  );

  const MAX = Number.MAX_SAFE_INTEGER;
  return [...list].sort((a, b) => {
    const soldA = isProductSold(a.status) ? 1 : 0;
    const soldB = isProductSold(b.status) ? 1 : 0;
    if (soldA !== soldB) return soldA - soldB;

    if (sort === "yearDesc") {
      const ya = extractProductManufactureDateValue(a.title, a.description);
      const yb = extractProductManufactureDateValue(b.title, b.description);
      if (ya !== null && yb !== null && ya !== yb) return yb - ya;
      if (ya !== null && yb === null) return -1;
      if (ya === null && yb !== null) return 1;
    }

    if (sort === "capacityDesc" || sort === "capacityAsc") {
      const ca = extractProductCapacityMetric(a.title, a.description, a.category);
      const cb = extractProductCapacityMetric(b.title, b.description, b.category);
      if (ca !== null && cb !== null) {
        const diff =
          ca.unit === cb.unit
            ? ca.value - cb.value
            : ca.normalizedScore - cb.normalizedScore;
        if (diff !== 0) return sort === "capacityDesc" ? -diff : diff;
      }
      if (ca !== null && cb === null) return -1;
      if (ca === null && cb !== null) return 1;
    }

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
