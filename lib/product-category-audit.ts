// 파일 경로: lib/product-category-audit.ts
// 상품 표준 카테고리 오분류 탐지 및 AI 분석 카테고리 보정 순수 도메인 모듈

import {
  PRODUCT_CATEGORIES,
  normalizeProductCategory,
  type ProductCategoryValue,
} from "./site";

type ProductCategory = ProductCategoryValue;

export interface ProductCategoryCandidate {
  id: string;
  title?: string | null;
  category?: string | null;
}

export interface ProductCategoryMismatch {
  id: string;
  title: string;
  currentCategory: ProductCategory;
  suggestedCategory: ProductCategory;
  reason: string;
}

const COMMERCIAL_STRONG_PATTERN =
  /업소용|식당|카페|주방설비|집기류|제빙기|수저소독기|식기세척기|쇼케이스|실링기|그리들|가스그릴|상화식|로스타|육수냉장고|숙성냉장고|숙성고|테이블\s*냉장고|반찬냉장고|찬밧드|토핑냉장고|체스트\s*냉동고|주스\s*디스펜서|커피\s*자판기|25박스|30박스|35박스|45박스|65박스/i;

const SMALL_OR_LIVING_ETC_PATTERN =
  /전자레인지|광파오븐|전기오븐|오븐|전기밥솥|밥솥|진공청소기|청소기|공기청정기|텔레비전|LED\s*TV|QLED\s*TV|OLED\s*TV|스마트\s*TV|\bTV\b|모니터|침대|전기온수기|온수기/i;

const HVAC_PATTERN =
  /에어컨|냉난방|냉풍기|실내기|실외기|천장형|카세트형|휘센|무풍/;

const WASHER_DRYER_PATTERN =
  /세탁기|건조기|통돌이|워시타워|트롬|통버블|워블|스타일러|에어드레서/;

const DOMESTIC_FRIDGE_PATTERN =
  /냉장고|김치냉장고|딤채|김치톡톡|변온냉동고/;

function isStandardProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

/**
 * 제품명(title)만 보고 명확하게 특정되는 표준 카테고리를 추론합니다.
 * 모호하거나 복합적인 경우 null을 반환하여 오탐(false positive)을 방지합니다.
 */
export function inferCategoryFromTitle(
  title: string | null | undefined
): ProductCategory | null {
  const safeTitle = (title || "").trim();
  if (!safeTitle) return null;

  // 배송·설치 사진이 잘못 제품으로 들어간 문구는 자동 추정 제외
  if (/상차\s*및\s*고객\s*배송|배송\s*운반/.test(safeTitle)) {
    return null;
  }

  // 1) 에어컨/냉난방기 (상업용 스탠드·천장형 포함 표준 카테고리는 항상 '에어컨/냉난방기')
  if (HVAC_PATTERN.test(safeTitle)) {
    return "에어컨/냉난방기";
  }

  // 2) 소형 쇼케이스 미니 냉장고(예: 50L)는 가정·사무실 겸용이므로 기존 분류 존중(null)
  if (/미니\s*쇼케이스\s*냉장고/i.test(safeTitle)) {
    return null;
  }

  // 3) 세탁기/건조기 (식기세척기와 혼동 금지)
  if (WASHER_DRYER_PATTERN.test(safeTitle) && !/식기세척기/.test(safeTitle)) {
    return "세탁기/건조기";
  }

  // 4) 업소용 주방·냉장·홀 집기 (건습식 청소기처럼 기타/업소용 경계 품목은 제외)
  if (
    COMMERCIAL_STRONG_PATTERN.test(safeTitle) &&
    !/진공청소기|청소기/.test(safeTitle)
  ) {
    return "업소용기기";
  }

  // 5) 가정용 냉장고·김치냉장고
  if (DOMESTIC_FRIDGE_PATTERN.test(safeTitle)) {
    return "냉장고";
  }

  // 6) 소형·생활·주방가전 (전자레인지, 광파오븐, 밥솥, TV, 공기청정기, 침대, 온수기 등)
  if (SMALL_OR_LIVING_ETC_PATTERN.test(safeTitle)) {
    return "기타";
  }

  return null;
}

/**
 * 등록된 상품의 현재 카테고리와 제품명이 명백히 충돌하는 오분류 건을 탐지합니다.
 */
export function detectProductCategoryMismatch(
  product: ProductCategoryCandidate
): ProductCategoryMismatch | null {
  const safeTitle = (product.title || "").trim();
  if (!safeTitle) return null;

  const currentCategory = normalizeProductCategory(product.category);
  const inferred = inferCategoryFromTitle(safeTitle);
  if (!inferred || inferred === currentCategory) {
    return null;
  }

  // 고신뢰 충돌 케이스만 선별하여 오탐 방지
  if (
    inferred === "기타" &&
    (currentCategory === "에어컨/냉난방기" ||
      currentCategory === "세탁기/건조기" ||
      currentCategory === "냉장고")
  ) {
    return {
      id: product.id,
      title: safeTitle,
      currentCategory,
      suggestedCategory: "기타",
      reason: `소형·생활가전 제품명이 '${currentCategory}'로 분류되어 보증 정책이 오표시될 수 있습니다.`,
    };
  }

  if (inferred === "업소용기기" && currentCategory !== "업소용기기") {
    return {
      id: product.id,
      title: safeTitle,
      currentCategory,
      suggestedCategory: "업소용기기",
      reason: `업소용 설비·집기 제품명이 '${currentCategory}'로 분류되어 있습니다.`,
    };
  }

  if (
    (inferred === "에어컨/냉난방기" ||
      inferred === "냉장고" ||
      inferred === "세탁기/건조기") &&
    currentCategory !== inferred
  ) {
    return {
      id: product.id,
      title: safeTitle,
      currentCategory,
      suggestedCategory: inferred,
      reason: `제품명 기준 '${inferred}' 품목이 '${currentCategory}'로 분류되어 있습니다.`,
    };
  }

  return null;
}

/**
 * 상품 목록 전체에서 카테고리 오분류 의심 항목을 일괄 추출합니다.
 */
export function auditProductCategories(
  products: readonly ProductCategoryCandidate[]
): ProductCategoryMismatch[] {
  const mismatches: ProductCategoryMismatch[] = [];
  for (const product of products) {
    const mismatch = detectProductCategoryMismatch(product);
    if (mismatch) {
      mismatches.push(mismatch);
    }
  }
  return mismatches;
}

/**
 * AI 상품 분석 결과(aiCategory), 판독된 제품명(title), 폼 기본값(categoryHint)을 조합해
 * 최종 표준 카테고리를 안전하게 결정합니다.
 *
 * 핵심 방어:
 * - 업로드 폼의 기본값("에어컨/냉난방기")이 AI가 정확히 판독한 "기타"(전자레인지·오븐·TV 등)를
 *   덮어쓰는 기존 버그를 근본적으로 차단합니다.
 */
export function resolveAnalyzedProductCategory({
  aiCategory,
  title,
  categoryHint,
}: {
  aiCategory?: string | null;
  title?: string | null;
  categoryHint?: string | null;
}): ProductCategory {
  const rawAi = (aiCategory || "").trim();
  const rawHint = (categoryHint || "").trim();
  const titleInferred = inferCategoryFromTitle(title);

  // 1) AI가 명시적으로 표준 5대 카테고리(기타 포함)를 반환한 경우 신뢰하되, 제목과 명백히 충돌하면 보정
  if (rawAi) {
    const normalizedAi = isStandardProductCategory(rawAi)
      ? rawAi
      : normalizeProductCategory(rawAi);

    if (titleInferred && titleInferred !== normalizedAi) {
      const mismatch = detectProductCategoryMismatch({
        id: "draft",
        title,
        category: normalizedAi,
      });
      if (mismatch) {
        return mismatch.suggestedCategory;
      }
    }
    return normalizedAi;
  }

  // 2) AI 카테고리가 비어 있으면 제목 기반 추론을 폼 기본값보다 우선
  if (titleInferred) {
    return titleInferred;
  }

  // 3) 제목으로도 특정되지 않을 때만 관리자 힌트 사용
  if (rawHint && isStandardProductCategory(rawHint)) {
    return rawHint;
  }

  return "기타";
}
