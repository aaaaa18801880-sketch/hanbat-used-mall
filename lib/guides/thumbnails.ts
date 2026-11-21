// 파일 경로: lib/guides/thumbnails.ts
// 정보 게시판 69편 전체에 게시글별 고유 실사 메인 이미지를 1:1 매핑하는 결정론적 헬퍼

import type { InfoGuideCategory, InfoGuideHeroImage } from "./types";

export interface ResolvedGuideThumbnail {
  src: string;
  alt: string;
}

const SLUG_THUMBNAIL_MAP: Record<string, ResolvedGuideThumbnail> = {
  "new-aircon-repair-delay": {
    src: "/images/guide/photos/new-aircon-repair-delay.jpg",
    alt: "여름철 거실에 설치된 스탠드 에어컨과 점검 공구 가방 현장 실사 사진",
  },
  "voltage-220v-vs-380v": {
    src: "/images/guide/photos/voltage-220v-vs-380v.jpg",
    alt: "상가 분전함 내부의 단상 220V·삼상 380V 차단기와 배선 실사 사진",
  },
  "startup-closure-docs-and-power": {
    src: "/images/guide/photos/startup-closure-docs-and-power.jpg",
    alt: "창업 준비 중인 카페·식당 주방의 업소용 스테인리스 냉장고와 바 설비 실사 사진",
  },
  "electricity-bill-capacity-and-kepco": {
    src: "/images/guide/photos/electricity-bill-capacity-and-kepco.jpg",
    alt: "상가 건물 전력 계량기와 배관 설비가 정렬된 전기실 벽면 실사 사진",
  },
  "ladder-truck-and-clearance": {
    src: "/images/guide/photos/ladder-truck-and-clearance.jpg",
    alt: "아파트 베란다로 사다리차 리프트를 이용해 대형 냉장고를 반입하는 현장 실사 사진",
  },
  "why-used-over-new-and-store-over-p2p": {
    src: "/images/guide/photos/why-used-over-new-and-store-over-p2p.jpg",
    alt: "냉장고·세탁기·에어컨이 정돈 전시된 대형 중고 가전 전시장 내부 실사 사진",
  },
  "appliance-buyback-no-deduction-guide": {
    src: "/images/guide/photos/appliance-buyback-no-deduction-guide.jpg",
    alt: "가정 주방에서 매입 견적 확인을 위해 냉장고 정면을 스마트폰으로 촬영하는 실사 사진",
  },
  "aircon-how-it-works-and-parts": {
    src: "/images/guide/photos/aircon-how-it-works-and-parts.jpg",
    alt: "에어컨 내부 동배관 열교환기와 알루미늄 방열핀, 컴프레서 구조 실사 사진",
  },
  "why-outdoor-unit-survives-rain-and-shock": {
    src: "/images/guide/photos/why-outdoor-unit-survives-rain-and-shock.jpg",
    alt: "비 오는 날 건물 외벽 거치대에 고정되어 작동하는 에어컨 실외기 실사 사진",
  },
  "what-is-pcb-and-why-it-fails": {
    src: "/images/guide/photos/what-is-pcb-and-why-it-fails.jpg",
    alt: "인버터 에어컨 제어부 PCB 전자기판과 방열판·배선 커넥터 근접 실사 사진",
  },
  "why-ceiling-aircon-install-costs-more": {
    src: "/images/guide/photos/why-ceiling-aircon-install-costs-more.jpg",
    alt: "상가 카페 천장에 매립·노출 배관과 함께 시공된 4웨이 천장형 에어컨 실사 사진",
  },
  "why-no-outdoor-unit-on-walkway-defrost": {
    src: "/images/guide/photos/why-no-outdoor-unit-on-walkway-defrost.jpg",
    alt: "겨울철 눈과 성에가 쌓인 야외 에어컨 실외기 현장 실사 사진",
  },
  "fixed-speed-vs-inverter-aircon": {
    src: "/images/guide/photos/fixed-speed-vs-inverter-aircon.jpg",
    alt: "채광 좋은 아파트 거실 창가에 설치된 최신 인버터 스탠드 에어컨 실사 사진",
  },
  "fridge-warm-not-cooling-defrost": {
    src: "/images/guide/photos/fridge-warm-not-cooling-defrost.jpg",
    alt: "가정용 양문형 냉장고 내부 냉기 토출구와 선반을 확인하는 실사 사진",
  },
  "top-load-vs-front-load-washer-used-tips": {
    src: "/images/guide/photos/top-load-vs-front-load-washer-used-tips.jpg",
    alt: "다용도실에 설치된 드럼 세탁기의 내부 스테인리스 세탁조와 도어 패킹 실사 사진",
  },
  "why-never-lay-fridge-flat-moving": {
    src: "/images/guide/photos/why-never-lay-fridge-flat-moving.jpg",
    alt: "대형 스테인리스 냉장고를 수직 상태로 핸드카트에 고정해 운반하는 현장 실사 사진",
  },
  "commercial-45box-direct-vs-fan-cooling": {
    src: "/images/guide/photos/commercial-45box-direct-vs-fan-cooling.jpg",
    alt: "식당 주방에 설치된 업소용 4도어 45박스 스테인리스 냉장고 실사 사진",
  },
  "commercial-icemaker-not-freezing-causes": {
    src: "/images/guide/photos/commercial-icemaker-not-freezing-causes.jpg",
    alt: "업소용 제빙기 얼음 생성 상태와 저장고를 확인하는 현장 실사 사진",
  },
  "commercial-dishwasher-3-essentials": {
    src: "/images/guide/photos/commercial-dishwasher-3-essentials.jpg",
    alt: "업소용 주방 스테인리스 식기세척기 설치 및 세척 공간 실사 사진",
  },
  "aircon-refrigerant-annual-recharge-myth": {
    src: "/images/guide/photos/aircon-refrigerant-annual-recharge-myth.jpg",
    alt: "에어컨 냉매 압력과 누설 여부를 계측기로 점검하는 현장 실사 사진",
  },
  "aircon-pyeong-sizing-cafe-restaurant": {
    src: "/images/guide/photos/aircon-pyeong-sizing-cafe-restaurant.jpg",
    alt: "넓은 창과 테이블이 배치된 국내 카페·음식점 매장 홀 실사 사진",
  },
  "heat-pump-vs-heater-dryer-used-tips": {
    src: "/images/guide/photos/heat-pump-vs-heater-dryer-used-tips.jpg",
    alt: "히트펌프 의류건조기 하단 열교환기 콘덴서와 필터 점검부 실사 사진",
  },
  "kimchi-fridge-lid-vs-stand-used-tips": {
    src: "/images/guide/photos/kimchi-fridge-lid-vs-stand-used-tips.jpg",
    alt: "주방에 배치된 스테인리스 김치냉장고·냉장고 외관과 도어 마감 실사 사진",
  },
  "inverter-aircon-24h-on-vs-off-electricity": {
    src: "/images/guide/photos/inverter-aircon-24h-on-vs-off-electricity.jpg",
    alt: "에어컨 설정 온도와 운전 모드를 확인하는 벽면 컨트롤러 실사 사진",
  },
  "aircon-indoor-water-leak-causes": {
    src: "/images/guide/photos/aircon-indoor-water-leak-causes.jpg",
    alt: "벽걸이 에어컨 실내기 전면 송풍구와 드레인 점검 부위 실사 사진",
  },
  "aircon-pipe-reuse-aluminum-vs-copper": {
    src: "/images/guide/photos/aircon-pipe-reuse-aluminum-vs-copper.jpg",
    alt: "에어컨 냉매 배관에 사용되는 동배관과 체결 부위 근접 실사 사진",
  },
  "commercial-showcase-and-topping-fridge": {
    src: "/images/guide/photos/commercial-showcase-and-topping-fridge.jpg",
    alt: "매장에 설치된 업소용 유리 도어 냉장 쇼케이스 진열 실사 사진",
  },
  "resale-value-commercial-appliances": {
    src: "/images/guide/photos/resale-value-commercial-appliances.jpg",
    alt: "스테인리스 주방 작업대와 업소용 조리 설비가 정돈된 식당 주방 실사 사진",
  },
  "energy-efficiency-rating-myth-and-kwh": {
    src: "/images/guide/photos/energy-efficiency-rating-myth-and-kwh.jpg",
    alt: "실제 소비전력량(kWh)을 측정하는 디지털 전력량계 실사 사진",
  },
  "aircon-single-large-vs-multi-split": {
    src: "/images/guide/photos/aircon-single-large-vs-multi-split.jpg",
    alt: "상가 외벽에 여러 대의 에어컨 실외기가 병렬 배치된 현장 실사 사진",
  },
  "commercial-induction-plug-vs-breaker": {
    src: "/images/guide/photos/commercial-induction-plug-vs-breaker.jpg",
    alt: "고출력 인덕션 화구에서 조리가 진행 중인 주방 설비 실사 사진",
  },
  "cafe-plumbing-drain-checklist": {
    src: "/images/guide/photos/cafe-plumbing-drain-checklist.jpg",
    alt: "싱크대 하부에 연결된 직수 정수 필터와 급배수 배관 실사 사진",
  },
  "commercial-fridge-repair-vs-replace": {
    src: "/images/guide/photos/commercial-fridge-repair-vs-replace.jpg",
    alt: "냉장고 기계실 핵심 부품인 밀폐형 컴프레서 근접 실사 사진",
  },
  "aircon-relocation-cost-variables": {
    src: "/images/guide/photos/aircon-relocation-cost-variables.jpg",
    alt: "건물 외벽에 설치된 다수의 에어컨 실외기와 배관 시공 현장 실사 사진",
  },
  "neutral-wire-risk-and-licensed-electrician": {
    src: "/images/guide/photos/neutral-wire-risk-and-licensed-electrician.jpg",
    alt: "전선관과 전력 배선이 분기되어 시공된 전기 설비 현장 실사 사진",
  },
  "elb-vs-mccb-breaker-trip-check": {
    src: "/images/guide/photos/elb-vs-mccb-breaker-trip-check.jpg",
    alt: "누전차단기와 배선용차단기가 배열된 배전반 내부 실사 사진",
  },
  "oled-vs-qled-led-used-tv-guide": {
    src: "/images/guide/photos/oled-vs-qled-led-used-tv-guide.jpg",
    alt: "선명한 화질과 얇은 베젤을 확인할 수 있는 대형 OLED TV 실사 사진",
  },
  "commercial-fridge-condenser-cleaning": {
    src: "/images/guide/photos/commercial-fridge-condenser-cleaning.jpg",
    alt: "방열핀과 응축기 코일 상태를 점검하는 냉동·공조 열교환기 실사 사진",
  },
  "outdoor-unit-louver-ventilation-fire": {
    src: "/images/guide/photos/outdoor-unit-louver-ventilation-fire.jpg",
    alt: "건물 발코니와 실외기 공간에 설치된 에어컨 실외기 통풍 현장 실사 사진",
  },
  "aircon-removal-pump-down-piping": {
    src: "/images/guide/photos/aircon-removal-pump-down-piping.jpg",
    alt: "에어컨 철거·이전 시 점검하는 냉매 배관과 밸브 연결부 실사 사진",
  },
  "wash-tower-all-in-one-vs-separate-cleaning": {
    src: "/images/guide/photos/wash-tower-all-in-one-vs-separate-cleaning.jpg",
    alt: "세탁기와 건조기가 나란히·상하로 배치된 세탁 공간 실사 사진",
  },
  "free-waste-pickup-15990903-vs-used-buyback": {
    src: "/images/guide/photos/free-waste-pickup-15990903-vs-used-buyback.jpg",
    alt: "방문 매입과 무상수거 기준을 판단하기 위해 거실 가전 상태를 현장에서 점검하는 실사 사진",
  },
  "store-takeover-appliances-power-checklist": {
    src: "/images/guide/photos/store-takeover-appliances-power-checklist.jpg",
    alt: "에스프레소 머신과 바 카운터 설비가 갖춰진 카페 매장 실사 사진",
  },
  "winter-heating-heatpump-vs-electric-heater": {
    src: "/images/guide/photos/winter-heating-heatpump-vs-electric-heater.jpg",
    alt: "겨울철 실내 난방용 세라믹 전기히터 작동 모습 실사 사진",
  },
  "aircon-2in1-vs-two-singles-home": {
    src: "/images/guide/photos/aircon-2in1-vs-two-singles-home.jpg",
    alt: "가정용 스탠드형과 벽걸이형 2in1 멀티 에어컨 구성 실사 사진",
  },
  "commercial-gas-vs-induction-kitchen-setup": {
    src: "/images/guide/photos/commercial-gas-vs-induction-kitchen-setup.jpg",
    alt: "업소용 주방에 설치된 상업용 가스 레인지와 조리 화구 실사 사진",
  },
  "commercial-gas-grill-lpg-vs-lng-nozzle": {
    src: "/images/guide/photos/commercial-gas-grill-lpg-vs-lng-nozzle.jpg",
    alt: "가스 버너 노즐에서 파란 불꽃이 균일하게 연소되는 실사 사진",
  },
  "winter-freeze-icemaker-dishwasher-heater": {
    src: "/images/guide/photos/winter-freeze-icemaker-dishwasher-heater.jpg",
    alt: "겨울 한파에 배관과 수전 주변으로 고드름과 결빙이 생긴 현장 실사 사진",
  },
  "freezer-defrost-knife-puncture-risk": {
    src: "/images/guide/photos/freezer-defrost-knife-puncture-risk.jpg",
    alt: "냉동실 내부 선반에 성에와 얼음이 형성된 가정용 냉동고 실사 사진",
  },
  "fridge-kitchen-fit-vs-freestanding-clearance": {
    src: "/images/guide/photos/fridge-kitchen-fit-vs-freestanding-clearance.jpg",
    alt: "주방 수납장 라인에 맞춰 배치된 빌트인·스테인리스 냉장고 실사 사진",
  },
  "cable-reel-power-strip-tracking-fire": {
    src: "/images/guide/photos/cable-reel-power-strip-tracking-fire.jpg",
    alt: "여러 가전 플러그가 연결되는 멀티탭과 전원 배선 실사 사진",
  },
  "compressor-appliance-clearance-heat-dissipation": {
    src: "/images/guide/photos/compressor-appliance-clearance-heat-dissipation.jpg",
    alt: "냉장고 후면 방열 코일과 컴프레서 통풍 공간 실사 사진",
  },
  "used-appliance-nameplate-lifespan-guide": {
    src: "/images/guide/photos/used-appliance-nameplate-lifespan-guide.jpg",
    alt: "냉장고 본체에 부착된 제조년월·정격 사양 명판 라벨 근접 실사 사진",
  },
  "aircon-refrigerant-r22-r410a-r32-guide": {
    src: "/images/guide/photos/aircon-refrigerant-r22-r410a-r32-guide.jpg",
    alt: "R-410A 등 공조 냉매가 적용된 공랭식 에어컨·냉동기 설비 실사 사진",
  },
  "commercial-fryer-gas-vs-electric-k-class": {
    src: "/images/guide/photos/commercial-fryer-gas-vs-electric-k-class.jpg",
    alt: "식당 주방용 스테인리스 업소용 튀김기와 튀김 바스켓 실사 사진",
  },
  "kitchen-hood-duct-sirocco-vs-inline-fan": {
    src: "/images/guide/photos/kitchen-hood-duct-sirocco-vs-inline-fan.jpg",
    alt: "식당 주방 배기 후드 필터의 기름때 관리 상태를 보여주는 실사 사진",
  },
  "commercial-icemaker-air-vs-water-cooled": {
    src: "/images/guide/photos/commercial-icemaker-air-vs-water-cooled.jpg",
    alt: "매장 주방용 스테인리스 업소용 제빙기와 전면 통풍구 실사 사진",
  },
  "cooling-only-vs-heat-pump-nameplate": {
    src: "/images/guide/photos/cooling-only-vs-heat-pump-nameplate.jpg",
    alt: "현장 점검 기사가 냉난방 겸용 시스템 에어컨 작동 상태와 사양을 확인하는 실사 사진",
  },
  "commercial-water-heater-instant-vs-storage": {
    src: "/images/guide/photos/commercial-water-heater-instant-vs-storage.jpg",
    alt: "주방·매장 온수 공급용 저장식 전기온수기 탱크와 배관 실사 사진",
  },
  "fridge-washer-gasket-mold-cleaning-safety": {
    src: "/images/guide/photos/fridge-washer-gasket-mold-cleaning-safety.jpg",
    alt: "드럼 세탁기 투입구 고무패킹(가스켓)과 도어 밀착부 실사 사진",
  },
  "villa-old-house-drilling-angle-3kw": {
    src: "/images/guide/photos/villa-old-house-drilling-angle-3kw.jpg",
    alt: "콘크리트 벽면 에어컨 배관 타공용 다이아몬드 코어 드릴 실사 사진",
  },
  "store-lease-restoration-removal-dispute": {
    src: "/images/guide/photos/store-lease-restoration-removal-dispute.jpg",
    alt: "설비 철거와 원상복구가 진행 중인 공실 상가 내부 실사 사진",
  },
  "aircon-thin-copper-pipe-risks": {
    src: "/images/guide/photos/aircon-thin-copper-pipe-risks.jpg",
    alt: "에어컨 시공용 동배관 코일과 두께 마감 상태를 보여주는 실사 사진",
  },
  "aircon-pipe-length-and-refrigerant": {
    src: "/images/guide/photos/aircon-pipe-length-and-refrigerant.jpg",
    alt: "기계실과 천장을 따라 길게 시공된 공조 배관 라인 실사 사진",
  },
  "aircon-insulation-thickness-condensation": {
    src: "/images/guide/photos/aircon-insulation-thickness-condensation.jpg",
    alt: "결로 방지를 위해 발포 보온재로 감싼 공조 배관 마감 실사 사진",
  },
  "aircon-refrigerant-r32-r410a-r454b-guide": {
    src: "/images/guide/photos/aircon-refrigerant-r32-r410a-r454b-guide.jpg",
    alt: "에어컨 실외기 내부 컴프레서와 냉매 순환 계통 실사 사진",
  },
  "aircon-refrigerant-recovery-and-leak-check": {
    src: "/images/guide/photos/aircon-refrigerant-recovery-and-leak-check.jpg",
    alt: "공조 기사가 에어컨 실외기 배관과 냉매 회수를 점검하는 실사 사진",
  },
  "aircon-refrigerant-recharge-cost-and-leak-first": {
    src: "/images/guide/photos/aircon-refrigerant-recharge-cost-and-leak-first.jpg",
    alt: "에어컨 실외기 냉매 누설 부위와 서비스 밸브를 확인하는 실사 사진",
  },
  "commercial-aircon-refrigerant-management-guide": {
    src: "/images/guide/photos/commercial-aircon-refrigerant-management-guide.jpg",
    alt: "상업용 건물 옥상에 설치된 중대형 시스템 에어컨 실외기 실사 사진",
  },
};

const CATEGORY_FALLBACK_POOL: Record<
  InfoGuideCategory,
  readonly ResolvedGuideThumbnail[]
> = {
  "에어컨 · 냉난방": [
    SLUG_THUMBNAIL_MAP["fixed-speed-vs-inverter-aircon"],
    SLUG_THUMBNAIL_MAP["why-ceiling-aircon-install-costs-more"],
    SLUG_THUMBNAIL_MAP["what-is-pcb-and-why-it-fails"],
  ],
  "냉장고 · 세탁기": [
    SLUG_THUMBNAIL_MAP["fridge-warm-not-cooling-defrost"],
    SLUG_THUMBNAIL_MAP["top-load-vs-front-load-washer-used-tips"],
    SLUG_THUMBNAIL_MAP["heat-pump-vs-heater-dryer-used-tips"],
  ],
  "업소용 주방설비": [
    SLUG_THUMBNAIL_MAP["commercial-45box-direct-vs-fan-cooling"],
    SLUG_THUMBNAIL_MAP["commercial-showcase-and-topping-fridge"],
    SLUG_THUMBNAIL_MAP["commercial-icemaker-not-freezing-causes"],
  ],
  "전기 · 시공 · 반입": [
    SLUG_THUMBNAIL_MAP["voltage-220v-vs-380v"],
    SLUG_THUMBNAIL_MAP["ladder-truck-and-clearance"],
    SLUG_THUMBNAIL_MAP["electricity-bill-capacity-and-kepco"],
  ],
  "구매 · 매입 · 창업": [
    SLUG_THUMBNAIL_MAP["appliance-buyback-no-deduction-guide"],
    SLUG_THUMBNAIL_MAP["why-used-over-new-and-store-over-p2p"],
    SLUG_THUMBNAIL_MAP["startup-closure-docs-and-power"],
  ],
};

export function resolveGuideThumbnail(article: {
  slug: string;
  number: number;
  category: InfoGuideCategory;
  title: string;
  heroImage?: InfoGuideHeroImage;
}): ResolvedGuideThumbnail {
  // 1순위: 게시글별 1:1 고유 실사 메인 이미지
  const bySlug = SLUG_THUMBNAIL_MAP[article.slug];
  if (bySlug) {
    return bySlug;
  }

  if (article.heroImage?.src) {
    return {
      src: article.heroImage.src,
      alt: article.heroImage.alt || article.title,
    };
  }

  const pool = CATEGORY_FALLBACK_POOL[article.category];
  return pool[Math.abs(article.number) % pool.length];
}
