// 파일 경로: lib/guides/thumbnails.ts
// 정보 게시판 65편 전체에 주제별 맞춤 로컬 일러스트 썸네일을 매핑하는 순수 결정론적 헬퍼

import type { InfoGuideCategory, InfoGuideHeroImage } from "./types";

export interface ResolvedGuideThumbnail {
  src: string;
  alt: string;
}

const SLUG_THUMBNAIL_MAP: Record<string, ResolvedGuideThumbnail> = {
  // 1페이지 최우선 12편: 모든 카드가 중복 없이 고유한 일러스트를 갖도록 1:1 매핑
  "appliance-buyback-no-deduction-guide": {
    src: "/images/guide/buyback-appraisal.jpg",
    alt: "가전 명판과 에너지 라벨을 사진 촬영해 현장 감가 없이 매입 견적을 받는 예시 일러스트",
  },
  "why-used-over-new-and-store-over-p2p": {
    src: "/images/guide/showroom-compare.jpg",
    alt: "오프라인 직영 가전 전시장에서 담당자가 냉장고와 가전을 설명하는 예시 일러스트",
  },
  "free-waste-pickup-15990903-vs-used-buyback": {
    src: "/images/guide/clearance-measure-points.jpg",
    alt: "폐가전 무상수거와 중고 매입 가능 품목을 현장에서 확인하는 예시 일러스트",
  },
  "store-takeover-appliances-power-checklist": {
    src: "/images/guide/commercial-kitchen-setup.jpg",
    alt: "점포 인수 전 업소용 냉장고와 주방 설비 상태를 점검하는 예시 일러스트",
  },
  "aircon-pyeong-sizing-cafe-restaurant": {
    src: "/images/guide/ceiling-aircon-install.jpg",
    alt: "상가·카페 천장형 에어컨과 평형별 냉방 용량 배치를 확인하는 예시 일러스트",
  },
  "voltage-220v-vs-380v": {
    src: "/images/guide/electrical-panel-check.jpg",
    alt: "상가 주방 분전함에서 단상 220V와 삼상 380V 차단기를 점검하는 예시 일러스트",
  },
  "resale-value-commercial-appliances": {
    src: "/images/guide/cafe-icemaker-bar.jpg",
    alt: "카페 제빙기와 업소용 바 설비의 중고 잔존 가치를 확인하는 예시 일러스트",
  },
  "used-appliance-nameplate-lifespan-guide": {
    src: "/images/guide/energy-label-compare.jpg",
    alt: "가전 측면에 부착된 제조년월 명판과 에너지 효율 스티커를 확인하는 예시 일러스트",
  },
  "ladder-truck-and-clearance": {
    src: "/images/guide/ladder-truck-delivery.jpg",
    alt: "사다리차 리프트로 대형 가전을 창문으로 안전하게 반입하는 예시 일러스트",
  },
  "aircon-removal-pump-down-piping": {
    src: "/images/guide/aircon-copper-vs-alu-pipe.jpg",
    alt: "에어컨 철거 전 냉매 회수와 동배관 마감 상태를 점검하는 예시 일러스트",
  },
  "store-lease-restoration-removal-dispute": {
    src: "/images/guide/outdoor-unit-weatherproof-inside.jpg",
    alt: "상가 원상복구 전 실외기와 배관·덕트 철거 범위를 점검하는 예시 일러스트",
  },
  "commercial-fridge-repair-vs-replace": {
    src: "/images/guide/fridge-warm-check.jpg",
    alt: "업소용 냉장고 냉기 저하 원인과 수리·교체 기준을 확인하는 예시 일러스트",
  },

  // 주요 주제별 세분 매핑
  "cooling-only-vs-heat-pump-nameplate": {
    src: "/images/guide/energy-label-compare.jpg",
    alt: "냉방전용 에어컨과 냉난방기 명판 표기를 비교 확인하는 예시 일러스트",
  },
  "fixed-speed-vs-inverter-aircon": {
    src: "/images/guide/aircon-summer-wait.jpg",
    alt: "정속형과 인버터 에어컨의 실사용 차이를 비교하는 예시 일러스트",
  },
  "aircon-refrigerant-r22-r410a-r32-guide": {
    src: "/images/guide/aircon-copper-vs-alu-pipe.jpg",
    alt: "에어컨 냉매 종류별 배관 및 호환 기준을 설명하는 예시 일러스트",
  },
  "aircon-2in1-vs-two-singles-home": {
    src: "/images/guide/showroom-compare.jpg",
    alt: "가정용 2in1 에어컨과 단독 벽걸이·스탠드 구성을 비교하는 예시 일러스트",
  },
  "aircon-single-large-vs-multi-split": {
    src: "/images/guide/ceiling-aircon-install.jpg",
    alt: "매장 대형 스탠드 1대와 다중 분산 설치 구조를 비교하는 예시 일러스트",
  },
  "fridge-kitchen-fit-vs-freestanding-clearance": {
    src: "/images/guide/clearance-measure-points.jpg",
    alt: "키친핏과 프리스탠딩 냉장고 설치 공간 가로폭과 여유 공간을 실측하는 예시 일러스트",
  },
  "commercial-45box-direct-vs-fan-cooling": {
    src: "/images/guide/commercial-kitchen-setup.jpg",
    alt: "업소용 45박스 직냉식과 간냉식 냉장고의 내부 구조를 비교하는 예시 일러스트",
  },
  "commercial-showcase-and-topping-fridge": {
    src: "/images/guide/cafe-icemaker-bar.jpg",
    alt: "음료 쇼케이스와 토핑 테이블 냉장고 배치 예시 일러스트",
  },
  "top-load-vs-front-load-washer-used-tips": {
    src: "/images/guide/washer-inspection-parts.jpg",
    alt: "통돌이와 드럼 세탁기 핵심 점검 부위를 확인하는 예시 일러스트",
  },
  "heat-pump-vs-heater-dryer-used-tips": {
    src: "/images/guide/washer-inspection-parts.jpg",
    alt: "히트펌프와 히터식 건조기 내부 점검 포인트를 설명하는 예시 일러스트",
  },
  "wash-tower-all-in-one-vs-separate-cleaning": {
    src: "/images/guide/washer-inspection-parts.jpg",
    alt: "워시타워 일체형과 분리형 세탁기·건조기 관리 비교 일러스트",
  },
  "kimchi-fridge-lid-vs-stand-used-tips": {
    src: "/images/guide/fridge-warm-check.jpg",
    alt: "뚜껑형과 스탠드형 김치냉장고 냉각 방식을 비교하는 예시 일러스트",
  },
  "oled-vs-qled-led-used-tv-guide": {
    src: "/images/guide/showroom-compare.jpg",
    alt: "중고 TV 패널 종류별 화면과 수명 차이를 비교하는 예시 일러스트",
  },
  "commercial-gas-vs-induction-kitchen-setup": {
    src: "/images/guide/electrical-panel-check.jpg",
    alt: "업소용 주방 가스와 인덕션 전력 설비 구성을 점검하는 예시 일러스트",
  },
  "commercial-icemaker-air-vs-water-cooled": {
    src: "/images/guide/icemaker-cleaning-points.jpg",
    alt: "업소용 제빙기 공랭식과 수냉식 관리 부위를 점검하는 예시 일러스트",
  },
  "commercial-dishwasher-3-essentials": {
    src: "/images/guide/commercial-kitchen-setup.jpg",
    alt: "업소용 식기세척기 온수·전기·배수 설치 조건을 확인하는 예시 일러스트",
  },
  "what-is-pcb-and-why-it-fails": {
    src: "/images/guide/outdoor-unit-pcb-inspection.jpg",
    alt: "에어컨 실외기 내부 PCB 기판과 주요 부품을 점검하는 예시 일러스트",
  },
  "aircon-indoor-water-leak-causes": {
    src: "/images/guide/aircon-water-leak.jpg",
    alt: "에어컨 실내기 물 떨어짐 원인과 드레인 호스 점검 예시 일러스트",
  },
  "aircon-pipe-reuse-aluminum-vs-copper": {
    src: "/images/guide/aircon-copper-vs-alu-pipe.jpg",
    alt: "에어컨 동배관과 알루미늄 배관 차이를 비교하는 예시 일러스트",
  },
  "why-ceiling-aircon-install-costs-more": {
    src: "/images/guide/ceiling-aircon-install.jpg",
    alt: "천장형 시스템 에어컨 설치 시공과 배관 작업 예시 일러스트",
  },
  "why-outdoor-unit-survives-rain-and-shock": {
    src: "/images/guide/outdoor-unit-weatherproof-inside.jpg",
    alt: "비·눈 속에서도 작동하는 실외기 방수 설계 내부 구조 일러스트",
  },
};

const CATEGORY_FALLBACK_POOL: Record<
  InfoGuideCategory,
  readonly ResolvedGuideThumbnail[]
> = {
  "에어컨 · 냉난방": [
    {
      src: "/images/guide/aircon-indoor-leak-check.jpg",
      alt: "에어컨 실내기 작동 상태와 냉방 점검 예시 일러스트",
    },
    {
      src: "/images/guide/ceiling-aircon-install.jpg",
      alt: "상업용·가정용 에어컨 설치와 냉방 용량 점검 예시 일러스트",
    },
    {
      src: "/images/guide/outdoor-unit-pcb-inspection.jpg",
      alt: "에어컨 실외기 내부 부품과 냉방 점검 예시 일러스트",
    },
    {
      src: "/images/guide/aircon-copper-vs-alu-pipe.jpg",
      alt: "에어컨 배관 자재와 시공 기준 예시 일러스트",
    },
  ],
  "냉장고 · 세탁기": [
    {
      src: "/images/guide/washer-inspection-parts.jpg",
      alt: "세탁기·건조기 주요 부품과 위생 관리 예시 일러스트",
    },
    {
      src: "/images/guide/fridge-warm-check.jpg",
      alt: "냉장고 냉각 상태와 내부 관리 점검 예시 일러스트",
    },
    {
      src: "/images/guide/clearance-measure-points.jpg",
      alt: "냉장고·세탁기 설치 공간 실측 기준 예시 일러스트",
    },
  ],
  "업소용 주방설비": [
    {
      src: "/images/guide/commercial-kitchen-setup.jpg",
      alt: "업소용 냉장고와 주방 설비 배치 점검 예시 일러스트",
    },
    {
      src: "/images/guide/icemaker-cleaning-points.jpg",
      alt: "업소용 제빙기와 주방 기기 내부 위생 관리 예시 일러스트",
    },
    {
      src: "/images/guide/cafe-icemaker-bar.jpg",
      alt: "카페·식당 쇼케이스와 제빙기 운영 점검 예시 일러스트",
    },
  ],
  "전기 · 시공 · 반입": [
    {
      src: "/images/guide/electrical-panel-check.jpg",
      alt: "매장 분전함과 차단기 전력 용량 점검 예시 일러스트",
    },
    {
      src: "/images/guide/ladder-truck-delivery.jpg",
      alt: "대형 가전 사다리차 반입과 출입구 확인 예시 일러스트",
    },
    {
      src: "/images/guide/clearance-measure-points.jpg",
      alt: "현관문·복도·설치 공간 폭 사전 실측 예시 일러스트",
    },
  ],
  "구매 · 매입 · 창업": [
    {
      src: "/images/guide/buyback-appraisal.jpg",
      alt: "중고가전 매입 전 명판 촬영과 견적 확인 예시 일러스트",
    },
    {
      src: "/images/guide/showroom-compare.jpg",
      alt: "직영 전시장에서 중고가전을 비교 선택하는 예시 일러스트",
    },
    {
      src: "/images/guide/energy-label-compare.jpg",
      alt: "에너지 효율 라벨과 소비전력 기준을 비교하는 예시 일러스트",
    },
  ],
};

export function resolveGuideThumbnail(article: {
  slug: string;
  number: number;
  category: InfoGuideCategory;
  title: string;
  heroImage?: InfoGuideHeroImage;
}): ResolvedGuideThumbnail {
  if (article.heroImage?.src) {
    return {
      src: article.heroImage.src,
      alt: article.heroImage.alt || article.title,
    };
  }

  const bySlug = SLUG_THUMBNAIL_MAP[article.slug];
  if (bySlug) {
    return bySlug;
  }

  const lower = `${article.slug} ${article.title}`.toLowerCase();
  if (lower.includes("washer") || lower.includes("dryer") || lower.includes("세탁") || lower.includes("건조기")) {
    return {
      src: "/images/guide/washer-inspection-parts.jpg",
      alt: `${article.title} 안내 일러스트`,
    };
  }
  if (lower.includes("icemaker") || lower.includes("제빙기")) {
    return {
      src: "/images/guide/icemaker-cleaning-points.jpg",
      alt: `${article.title} 안내 일러스트`,
    };
  }
  if (
    lower.includes("breaker") ||
    lower.includes("voltage") ||
    lower.includes("kepco") ||
    lower.includes("neutral") ||
    lower.includes("induction") ||
    lower.includes("power-strip") ||
    lower.includes("전기") ||
    lower.includes("차단기")
  ) {
    return {
      src: "/images/guide/electrical-panel-check.jpg",
      alt: `${article.title} 안내 일러스트`,
    };
  }
  if (lower.includes("fridge") || lower.includes("freezer") || lower.includes("냉장고") || lower.includes("냉동")) {
    return {
      src: "/images/guide/fridge-warm-check.jpg",
      alt: `${article.title} 안내 일러스트`,
    };
  }
  if (lower.includes("outdoor") || lower.includes("실외기") || lower.includes("louver") || lower.includes("제상")) {
    return {
      src: "/images/guide/outdoor-unit-defrost-ice.jpg",
      alt: `${article.title} 안내 일러스트`,
    };
  }
  if (lower.includes("pipe") || lower.includes("배관") || lower.includes("보온재")) {
    return {
      src: "/images/guide/aircon-copper-vs-alu-pipe.jpg",
      alt: `${article.title} 안내 일러스트`,
    };
  }

  const pool = CATEGORY_FALLBACK_POOL[article.category];
  return pool[Math.abs(article.number) % pool.length];
}
