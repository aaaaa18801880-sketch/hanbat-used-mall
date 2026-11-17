// 파일 경로: lib/info-guides.ts
import {
  STORE,
  STORE_MERCHANT_POLICY,
  type ProductCategoryValue,
} from "./site";
import type {
  InfoGuideArticle,
  InfoGuidePriorityRole,
  InfoGuidePriorityTier,
  PrioritizedInfoGuideArticle,
} from "./guides/types";
import {
  sortGuidesByPriority,
  toGuideBoardSummary,
  type GuideBoardSummaryItem,
} from "./guides/meta";
import { AIRCON_GUIDE_ARTICLES } from "./guides/articles-aircon";
import { ELECTRICAL_OPS_GUIDE_ARTICLES } from "./guides/articles-electrical-ops";
import { HOME_KITCHEN_GUIDE_ARTICLES } from "./guides/articles-home-kitchen";
import {
  getGuideVerification,
  GUIDE_GOVERNANCE_DISCLAIMER,
} from "./guides/verification-sources";

export {
  INFO_GUIDE_CATEGORY_LIST,
  type InfoGuideCategory,
  type InfoGuideFilterCategory,
  type InfoGuideTable,
  type InfoGuideSection,
  type InfoGuideHeroImage,
  type InfoGuideCta,
  type InfoGuideSourceType,
  type InfoGuideRiskLevel,
  type InfoGuideSourceItem,
  type InfoGuideVerification,
  type InfoGuidePriorityTier,
  type InfoGuidePriorityRole,
  type InfoGuideArticle,
  type PrioritizedInfoGuideArticle,
} from "./guides/types";
export { GUIDE_GOVERNANCE_DISCLAIMER };

interface GuidePriorityMeta {
  priorityTier: InfoGuidePriorityTier;
  priorityRole: InfoGuidePriorityRole;
  priorityRank: number;
}

const TIER1_GUIDE_PRIORITY_CONFIG: Record<
  string,
  Omit<GuidePriorityMeta, "priorityTier">
> = {
  "appliance-buyback-no-deduction-guide": {
    priorityRole: "매입·처분",
    priorityRank: 1,
  },
  "why-used-over-new-and-store-over-p2p": {
    priorityRole: "구매·선택",
    priorityRank: 2,
  },
  "free-waste-pickup-15990903-vs-used-buyback": {
    priorityRole: "매입·처분",
    priorityRank: 3,
  },
  "store-takeover-appliances-power-checklist": {
    priorityRole: "매입·처분",
    priorityRank: 4,
  },
  "aircon-pyeong-sizing-cafe-restaurant": {
    priorityRole: "구매·선택",
    priorityRank: 5,
  },
  "voltage-220v-vs-380v": {
    priorityRole: "설치·계약",
    priorityRank: 6,
  },
  "resale-value-commercial-appliances": {
    priorityRole: "매입·처분",
    priorityRank: 7,
  },
  "used-appliance-nameplate-lifespan-guide": {
    priorityRole: "매입·처분",
    priorityRank: 8,
  },
  "ladder-truck-and-clearance": {
    priorityRole: "설치·계약",
    priorityRank: 9,
  },
  "aircon-removal-pump-down-piping": {
    priorityRole: "매입·처분",
    priorityRank: 10,
  },
  "store-lease-restoration-removal-dispute": {
    priorityRole: "매입·처분",
    priorityRank: 11,
  },
  "commercial-fridge-repair-vs-replace": {
    priorityRole: "매입·처분",
    priorityRank: 12,
  },
  "cooling-only-vs-heat-pump-nameplate": {
    priorityRole: "구매·선택",
    priorityRank: 13,
  },
  "fixed-speed-vs-inverter-aircon": {
    priorityRole: "구매·선택",
    priorityRank: 14,
  },
  "aircon-refrigerant-r22-r410a-r32-guide": {
    priorityRole: "구매·선택",
    priorityRank: 15,
  },
  "aircon-2in1-vs-two-singles-home": {
    priorityRole: "구매·선택",
    priorityRank: 16,
  },
  "aircon-single-large-vs-multi-split": {
    priorityRole: "구매·선택",
    priorityRank: 17,
  },
  "fridge-kitchen-fit-vs-freestanding-clearance": {
    priorityRole: "설치·계약",
    priorityRank: 18,
  },
  "commercial-45box-direct-vs-fan-cooling": {
    priorityRole: "구매·선택",
    priorityRank: 19,
  },
  "commercial-showcase-and-topping-fridge": {
    priorityRole: "구매·선택",
    priorityRank: 20,
  },
  "top-load-vs-front-load-washer-used-tips": {
    priorityRole: "구매·선택",
    priorityRank: 21,
  },
  "heat-pump-vs-heater-dryer-used-tips": {
    priorityRole: "구매·선택",
    priorityRank: 22,
  },
  "wash-tower-all-in-one-vs-separate-cleaning": {
    priorityRole: "구매·선택",
    priorityRank: 23,
  },
  "kimchi-fridge-lid-vs-stand-used-tips": {
    priorityRole: "구매·선택",
    priorityRank: 24,
  },
  "oled-vs-qled-led-used-tv-guide": {
    priorityRole: "구매·선택",
    priorityRank: 25,
  },
  "commercial-gas-vs-induction-kitchen-setup": {
    priorityRole: "구매·선택",
    priorityRank: 26,
  },
  "commercial-gas-grill-lpg-vs-lng-nozzle": {
    priorityRole: "설치·계약",
    priorityRank: 27,
  },
  "commercial-icemaker-air-vs-water-cooled": {
    priorityRole: "구매·선택",
    priorityRank: 28,
  },
  "commercial-fryer-gas-vs-electric-k-class": {
    priorityRole: "구매·선택",
    priorityRank: 29,
  },
  "commercial-water-heater-instant-vs-storage": {
    priorityRole: "구매·선택",
    priorityRank: 30,
  },
  "winter-heating-heatpump-vs-electric-heater": {
    priorityRole: "구매·선택",
    priorityRank: 31,
  },
  "startup-closure-docs-and-power": {
    priorityRole: "설치·계약",
    priorityRank: 32,
  },
  "energy-efficiency-rating-myth-and-kwh": {
    priorityRole: "구매·선택",
    priorityRank: 33,
  },
  "new-aircon-repair-delay": {
    priorityRole: "구매·선택",
    priorityRank: 34,
  },
};

const TIER2_GUIDE_ROLE_MAP: Record<string, InfoGuidePriorityRole> = {
  "fridge-warm-not-cooling-defrost": "고장·점검",
  "commercial-icemaker-not-freezing-causes": "고장·점검",
  "aircon-indoor-water-leak-causes": "고장·점검",
  "aircon-refrigerant-annual-recharge-myth": "고장·점검",
  "what-is-pcb-and-why-it-fails": "고장·점검",
  "commercial-fridge-condenser-cleaning": "고장·점검",
  "fridge-washer-gasket-mold-cleaning-safety": "고장·점검",
  "elb-vs-mccb-breaker-trip-check": "고장·점검",
  "commercial-dishwasher-3-essentials": "고장·점검",
  "aircon-pipe-reuse-aluminum-vs-copper": "고장·점검",
  "aircon-relocation-cost-variables": "고장·점검",
  "why-ceiling-aircon-install-costs-more": "고장·점검",
  "cafe-plumbing-drain-checklist": "고장·점검",
  "aircon-how-it-works-and-parts": "고장·점검",
  "electricity-bill-capacity-and-kepco": "고장·점검",
  "compressor-appliance-clearance-heat-dissipation": "안전·관리",
  "outdoor-unit-louver-ventilation-fire": "안전·관리",
  "neutral-wire-risk-and-licensed-electrician": "안전·관리",
  "commercial-induction-plug-vs-breaker": "안전·관리",
  "cable-reel-power-strip-tracking-fire": "안전·관리",
  "winter-freeze-icemaker-dishwasher-heater": "안전·관리",
  "freezer-defrost-knife-puncture-risk": "안전·관리",
  "why-never-lay-fridge-flat-moving": "안전·관리",
  "why-outdoor-unit-survives-rain-and-shock": "안전·관리",
  "why-no-outdoor-unit-on-walkway-defrost": "안전·관리",
  "inverter-aircon-24h-on-vs-off-electricity": "안전·관리",
  "kitchen-hood-duct-sirocco-vs-inline-fan": "안전·관리",
  "villa-old-house-drilling-angle-3kw": "안전·관리",
};

function resolveGuidePriorityMeta(article: InfoGuideArticle): GuidePriorityMeta {
  const tier1Config = TIER1_GUIDE_PRIORITY_CONFIG[article.slug];
  if (tier1Config) {
    return {
      priorityTier: 1,
      priorityRole: tier1Config.priorityRole,
      priorityRank: tier1Config.priorityRank,
    };
  }

  return {
    priorityTier: 2,
    priorityRole: TIER2_GUIDE_ROLE_MAP[article.slug] ?? "안전·관리",
    priorityRank: 100 + article.number,
  };
}

export {
  sortGuidesByPriority,
  toGuideBoardSummary,
  type GuideBoardSummaryItem,
};

export const INFO_GUIDE_ARTICLES: readonly PrioritizedInfoGuideArticle[] = [
  ...AIRCON_GUIDE_ARTICLES,
  ...ELECTRICAL_OPS_GUIDE_ARTICLES,
  ...HOME_KITCHEN_GUIDE_ARTICLES,
]
  .map((article) => ({
    ...article,
    ...resolveGuidePriorityMeta(article),
    updatedAt: "2026-11-15",
    verification: article.verification ?? getGuideVerification(article.slug),
  }))
  .sort((a, b) => a.number - b.number);

export function getInfoGuideBySlug(slug: string): InfoGuideArticle | undefined {
  return INFO_GUIDE_ARTICLES.find((article) => article.slug === slug);
}

export function getAdjacentInfoGuides(slug: string): {
  prev: InfoGuideArticle | null;
  next: InfoGuideArticle | null;
} {
  const idx = INFO_GUIDE_ARTICLES.findIndex((article) => article.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? INFO_GUIDE_ARTICLES[idx - 1] : null,
    next:
      idx < INFO_GUIDE_ARTICLES.length - 1 ? INFO_GUIDE_ARTICLES[idx + 1] : null,
  };
}

export function getRelatedInfoGuides(
  current: InfoGuideArticle,
  limit = 3
): InfoGuideArticle[] {
  const sameCategory = INFO_GUIDE_ARTICLES.filter(
    (a) => a.slug !== current.slug && a.category === current.category
  );
  const others = INFO_GUIDE_ARTICLES.filter(
    (a) => a.slug !== current.slug && a.category !== current.category
  );
  return [...sameCategory, ...others].slice(0, limit);
}

/**
 * 정보 글 주제와 가장 밀접한 실제 판매 상품 카테고리를 매핑합니다.
 * (정보 검색으로 유입된 소비자를 실제 검수 매물 탐색·구매로 자연스럽게 연결하기 위함)
 */
export function getRecommendedProductCategories(
  article: InfoGuideArticle
): readonly ProductCategoryValue[] {
  if (
    article.category === "에어컨 · A/S" ||
    article.category === "에어컨 · 원리/설치" ||
    article.slug === "voltage-220v-vs-380v"
  ) {
    return ["에어컨/냉난방기", "업소용기기"];
  }
  if (
    article.category === "업소용 주방설비" ||
    article.slug === "startup-closure-docs-and-power" ||
    article.slug === "electricity-bill-capacity-and-kepco" ||
    article.slug === "commercial-induction-plug-vs-breaker" ||
    article.slug === "cafe-plumbing-drain-checklist" ||
    article.slug === "resale-value-commercial-appliances"
  ) {
    return ["업소용기기", "에어컨/냉난방기", "냉장고"];
  }
  if (
    article.slug === "top-load-vs-front-load-washer-used-tips" ||
    article.slug === "heat-pump-vs-heater-dryer-used-tips"
  ) {
    return ["세탁기/건조기", "냉장고"];
  }
  if (article.category === "냉장고 · 세탁기") {
    return ["냉장고", "세탁기/건조기", "업소용기기"];
  }
  if (article.slug === "ladder-truck-and-clearance") {
    return ["냉장고", "업소용기기", "세탁기/건조기"];
  }
  return ["에어컨/냉난방기", "냉장고", "세탁기/건조기", "업소용기기"];
}

export function getGuideCommerceBridge(article: InfoGuideArticle): {
  primaryCategory: ProductCategoryValue;
  heading: string;
  description: string;
  galleryHref: string;
  galleryLabel: string;
} {
  const categories = getRecommendedProductCategories(article);
  const primaryCategory = categories[0];

  if (primaryCategory === "에어컨/냉난방기") {
    return {
      primaryCategory,
      heading: "점검을 마친 에어컨·냉난방기 매물",
      description: `냉매 압력, PCB, 배수 점검을 마친 매물입니다. ${STORE_MERCHANT_POLICY.warrantyAircon} 기준으로 출고하며 대전·세종·충청 직영 설치와 전국 화물 발송을 상담합니다.`,
      galleryHref: `/gallery?category=${encodeURIComponent("에어컨/냉난방기")}`,
      galleryLabel: "에어컨·냉난방기 전체 재고 보기",
    };
  }

  if (primaryCategory === "업소용기기") {
    return {
      primaryCategory,
      heading: "점검을 마친 업소용 냉장고·제빙기·주방설비 매물",
      description: `전력·배수 등 현장 조건을 확인한 뒤 바로 투입할 수 있는 매물입니다. 사업자 전자세금계산서 발행과 여러 품목 동시 납품 견적을 함께 진행합니다.`,
      galleryHref: `/gallery?category=${encodeURIComponent("업소용기기")}`,
      galleryLabel: "업소용기기 전체 재고 보기",
    };
  }

  if (primaryCategory === "냉장고") {
    return {
      primaryCategory,
      heading: "점검을 마친 냉장고·김치냉장고 매물",
      description: `제상 히터, 문패킹, 컴프레셔 동작을 점검한 매물입니다. ${STORE_MERCHANT_POLICY.warrantyMajor} 기준이 적용되며 문폭·사다리차 반입 여부를 미리 확인해 드립니다.`,
      galleryHref: `/gallery?category=${encodeURIComponent("냉장고")}`,
      galleryLabel: "냉장고·김치냉장고 전체 보기",
    };
  }

  if (primaryCategory === "세탁기/건조기") {
    return {
      primaryCategory,
      heading: "점검을 마친 세탁기·건조기 매물",
      description: `세탁조·열교환기 세척과 급배수·열풍 건조 시험을 마친 매물입니다. ${STORE_MERCHANT_POLICY.warrantyMajor} 기준을 적용합니다.`,
      galleryHref: `/gallery?category=${encodeURIComponent("세탁기/건조기")}`,
      galleryLabel: "세탁기·건조기 전체 보기",
    };
  }

  return {
    primaryCategory,
    heading: `${STORE.name} 전시장 보유 매물`,
    description: `${STORE.name}에서 기능 점검과 세척을 마친 매물입니다. ${STORE_MERCHANT_POLICY.warrantyMajor} 기준을 적용합니다.`,
    galleryHref: "/gallery",
    galleryLabel: "전체 판매 제품 보기",
  };
}

/**
 * 상품 상세 페이지([id])에서 해당 품목 구매 전 읽으면 좋은 현장 가이드를 반환합니다.
 */
export function getInfoGuidesForProductCategory(
  category: ProductCategoryValue,
  limit = 3
): InfoGuideArticle[] {
  const prioritySlugs: Record<ProductCategoryValue, readonly string[]> = {
    "에어컨/냉난방기": [
      "aircon-pyeong-sizing-cafe-restaurant",
      "aircon-single-large-vs-multi-split",
      "aircon-relocation-cost-variables",
      "inverter-aircon-24h-on-vs-off-electricity",
      "aircon-pipe-reuse-aluminum-vs-copper",
      "aircon-refrigerant-annual-recharge-myth",
      "aircon-indoor-water-leak-causes",
    ],
    냉장고: [
      "fridge-warm-not-cooling-defrost",
      "kimchi-fridge-lid-vs-stand-used-tips",
      "why-never-lay-fridge-flat-moving",
      "energy-efficiency-rating-myth-and-kwh",
    ],
    "세탁기/건조기": [
      "top-load-vs-front-load-washer-used-tips",
      "heat-pump-vs-heater-dryer-used-tips",
      "energy-efficiency-rating-myth-and-kwh",
      "ladder-truck-and-clearance",
    ],
    업소용기기: [
      "commercial-45box-direct-vs-fan-cooling",
      "commercial-fridge-repair-vs-replace",
      "commercial-induction-plug-vs-breaker",
      "cafe-plumbing-drain-checklist",
      "commercial-showcase-and-topping-fridge",
      "commercial-icemaker-not-freezing-causes",
      "resale-value-commercial-appliances",
    ],
    기타: [
      "energy-efficiency-rating-myth-and-kwh",
      "why-used-over-new-and-store-over-p2p",
      "ladder-truck-and-clearance",
    ],
  };

  const order = prioritySlugs[category] ?? prioritySlugs["기타"];
  const picked = order
    .map((slug) => getInfoGuideBySlug(slug))
    .filter((item): item is InfoGuideArticle => Boolean(item));

  if (picked.length >= limit) {
    return picked.slice(0, limit);
  }
  const existingSlugs = new Set(picked.map((p) => p.slug));
  const fallback = INFO_GUIDE_ARTICLES.filter((a) => !existingSlugs.has(a.slug));
  return [...picked, ...fallback].slice(0, limit);
}
