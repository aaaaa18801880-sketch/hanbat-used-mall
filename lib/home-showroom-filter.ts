// 파일 경로: lib/home-showroom-filter.ts
// 홈 쇼룸 빠른 검색 및 카테고리 통합 필터링 + 갤러리 검색 URL 생성 순수 헬퍼

import {
  isProductSold,
  matchesSearchQuery,
} from "./site";
import {
  matchesShowroomCategory,
  type ShowroomCategoryItem,
} from "./showroom-categories";

export interface HomeShowroomProductLike {
  id: string | number;
  title?: string | null;
  category?: string | null;
  description?: string | null;
  model_name?: string | null;
  spec_capsules?: readonly string[] | null;
  status?: string | null;
}

export const HOME_QUICK_SEARCH_KEYWORDS = [
  "45박스",
  "벽걸이 에어컨",
  "김치냉장고",
  "드럼세탁기",
  "제빙기",
  "쇼케이스",
] as const;

export const SERVICE_DELIVERY_REGIONS = [
  "대전 전 지역(중구·서구·유성구·동구·대덕구)",
  "세종",
  "계룡",
  "공주",
  "논산",
  "금산",
  "옥천",
  "청주",
  "천안",
] as const;

/**
 * 홈 쇼룸 전시 매물을 선택 카테고리 + 빠른 검색어(다중 토큰 AND)로 필터링합니다.
 * - 판매중(비판매완료) 매물이 있으면 우선 대상으로 삼고, 없으면 전체 매물에서 검색합니다.
 */
export function filterHomeShowroomProducts<T extends HomeShowroomProductLike>(
  products: readonly T[],
  options: {
    selectedCategory?: ShowroomCategoryItem;
    searchQuery?: string;
  }
): T[] {
  const active = products.filter((p) => !isProductSold(p.status));
  const source = active.length > 0 ? active : [...products];
  const trimmedQuery = (options.searchQuery ?? "").trim();

  const categoryFiltered =
    !options.selectedCategory || options.selectedCategory.key === "all"
      ? source
      : source.filter((p) =>
          matchesShowroomCategory(p, options.selectedCategory!)
        );

  if (!trimmedQuery) {
    return categoryFiltered;
  }

  return categoryFiltered.filter((p) =>
    matchesSearchQuery(
      trimmedQuery,
      p.title,
      p.category,
      p.description,
      p.model_name,
      p.spec_capsules ? p.spec_capsules.join(" ") : null
    )
  );
}

/**
 * 현재 홈 쇼룸의 선택 카테고리 및 검색어를 `/gallery` 경로 쿼리로 직렬화합니다.
 */
export function buildHomeGallerySearchHref(options: {
  baseHref?: string;
  searchQuery?: string;
  view?: "card" | "table";
}): string {
  const rawBase = options.baseHref || "/gallery";
  const [pathname, rawSearch = ""] = rawBase.split("?");
  const params = new URLSearchParams(rawSearch);

  const trimmedQuery = (options.searchQuery ?? "").trim();
  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  } else {
    params.delete("q");
  }

  if (options.view === "table") {
    params.set("view", "table");
  } else {
    params.delete("view");
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
