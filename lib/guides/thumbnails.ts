// 파일 경로: lib/guides/thumbnails.ts
// 정보 게시판 69편 전체에 게시글 주제별 고유 메인 이미지를 1:1 매핑하는 결정론적 헬퍼

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
    alt: "겨울철 실외기 제상수 배출과 통행로 결빙 위험을 안내하는 현장 도해 이미지",
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
    alt: "카페 바에 설치된 업소용 제빙기 급수·배수 및 방열 점검 안내 이미지",
  },
  "commercial-dishwasher-3-essentials": {
    src: "/images/guide/photos/commercial-dishwasher-3-essentials.jpg",
    alt: "업소용 주방 스테인리스 식기세척기와 주방 설비 매장 전시 실사 사진",
  },
  "aircon-refrigerant-annual-recharge-myth": {
    src: "/images/guide/photos/aircon-refrigerant-annual-recharge-myth.jpg",
    alt: "에어컨 냉매 밀폐 순환 회로와 매니폴드 게이지 누설 점검 도해 이미지",
  },
  "aircon-pyeong-sizing-cafe-restaurant": {
    src: "/images/guide/photos/aircon-pyeong-sizing-cafe-restaurant.jpg",
    alt: "실평수 20평 기준 사무실·카페·음식점·고깃집별 권장 에어컨 평형 비교 도해 이미지",
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
    alt: "인버터 에어컨 껐다 켰다 반복 운전과 연속 유지 운전의 소비전력 비교 그래프 도해 이미지",
  },
  "aircon-indoor-water-leak-causes": {
    src: "/images/guide/photos/aircon-indoor-water-leak-causes.jpg",
    alt: "에어컨 실내기 드레인 호스 막힘과 물 떨어짐 점검 부위 안내 이미지",
  },
  "aircon-pipe-reuse-aluminum-vs-copper": {
    src: "/images/guide/photos/aircon-pipe-reuse-aluminum-vs-copper.jpg",
    alt: "에어컨 동배관과 알루미늄 배관의 재사용 가능 여부를 비교한 안내 이미지",
  },
  "commercial-showcase-and-topping-fridge": {
    src: "/images/guide/photos/commercial-showcase-and-topping-fridge.jpg",
    alt: "매장에 진열된 업소용 유리 도어 냉장 쇼케이스 전시 실사 사진",
  },
  "resale-value-commercial-appliances": {
    src: "/images/guide/photos/resale-value-commercial-appliances.jpg",
    alt: "업소용 주방 가전의 중고 재판매 가치와 브랜드·규격 기준 안내 이미지",
  },
  "energy-efficiency-rating-myth-and-kwh": {
    src: "/images/guide/photos/energy-efficiency-rating-myth-and-kwh.jpg",
    alt: "에너지소비효율등급 라벨과 실제 월간 소비전력량(kWh) 비교 안내 이미지",
  },
  "aircon-single-large-vs-multi-split": {
    src: "/images/guide/photos/aircon-single-large-vs-multi-split.jpg",
    alt: "대형 에어컨 1대 단독 설치와 중형 2대 분산 배치의 기류·전압 비교 도해 이미지",
  },
  "commercial-induction-plug-vs-breaker": {
    src: "/images/guide/photos/commercial-induction-plug-vs-breaker.jpg",
    alt: "업소용 인덕션 일반 16A 콘센트 위험과 30A~40A 전용 차단기 직결 비교 도해 이미지",
  },
  "cafe-plumbing-drain-checklist": {
    src: "/images/guide/photos/cafe-plumbing-drain-checklist.jpg",
    alt: "카페 주방 직수 분기·정수필터·제빙기 배수 구배 사전 체크리스트 도해 이미지",
  },
  "commercial-fridge-repair-vs-replace": {
    src: "/images/guide/photos/commercial-fridge-repair-vs-replace.jpg",
    alt: "업소용 냉장고 소모품 수리 구간과 콤프레샤·누설 중고 교체 손익분기 비교 도해 이미지",
  },
  "aircon-relocation-cost-variables": {
    src: "/images/guide/photos/aircon-relocation-cost-variables.jpg",
    alt: "에어컨 이전설치 시 배관 연장·앵글·매립배관 용접·냉매 충전 4대 추가비 변수 도해 이미지",
  },
  "neutral-wire-risk-and-licensed-electrician": {
    src: "/images/guide/photos/neutral-wire-risk-and-licensed-electrician.jpg",
    alt: "삼상 4선식 중성선(N선) 단선 시 220V 가전 380V 과전압 유입 경고 도해 이미지",
  },
  "elb-vs-mccb-breaker-trip-check": {
    src: "/images/guide/photos/elb-vs-mccb-breaker-trip-check.jpg",
    alt: "시험 버튼 유무로 구분하는 누전차단기(ELB)와 배선용차단기(MCCB) 비교 도해 이미지",
  },
  "oled-vs-qled-led-used-tv-guide": {
    src: "/images/guide/photos/oled-vs-qled-led-used-tv-guide.jpg",
    alt: "중고 TV 구매 전 OLED 번인 잔상과 QLED·LED 백라이트 멍 확인법 비교 도해 이미지",
  },
  "commercial-fridge-condenser-cleaning": {
    src: "/images/guide/photos/commercial-fridge-condenser-cleaning.jpg",
    alt: "업소용 냉장고 하단 기계실 응축기(방열판) 먼지 막힘과 청소 전후 비교 도해 이미지",
  },
  "outdoor-unit-louver-ventilation-fire": {
    src: "/images/guide/photos/outdoor-unit-louver-ventilation-fire.jpg",
    alt: "아파트 실외기실 루버창 닫힘 시 열기 재흡입 위험과 수평 완전 개방 비교 도해 이미지",
  },
  "aircon-removal-pump-down-piping": {
    src: "/images/guide/photos/aircon-removal-pump-down-piping.jpg",
    alt: "에어컨 철거 시 펌프다운 냉매 회수와 동배관 끝단 밀폐 테이핑 2단계 도해 이미지",
  },
  "wash-tower-all-in-one-vs-separate-cleaning": {
    src: "/images/guide/photos/wash-tower-all-in-one-vs-separate-cleaning.jpg",
    alt: "워시타워 직렬 배치와 세탁기·건조기 단독 병렬 배치의 수리·내림비 비교 도해 이미지",
  },
  "free-waste-pickup-15990903-vs-used-buyback": {
    src: "/images/guide/photos/free-waste-pickup-15990903-vs-used-buyback.jpg",
    alt: "방문 매입과 무상수거 기준을 판단하기 위해 거실 가전 상태를 현장에서 점검하는 실사 사진",
  },
  "store-takeover-appliances-power-checklist": {
    src: "/images/guide/photos/store-takeover-appliances-power-checklist.jpg",
    alt: "상가 인수 전 분전함 차단기 용량과 기존 주방 설비 점검 안내 이미지",
  },
  "winter-heating-heatpump-vs-electric-heater": {
    src: "/images/guide/photos/winter-heating-heatpump-vs-electric-heater.jpg",
    alt: "인버터 냉난방기(COP 300%+)와 전기온풍기(100%) 겨울 난방 효율·전기세 비교 도해 이미지",
  },
  "aircon-2in1-vs-two-singles-home": {
    src: "/images/guide/photos/aircon-2in1-vs-two-singles-home.jpg",
    alt: "가정용 스탠드·벽걸이 에어컨 전시장 진열 실사 사진",
  },
  "commercial-gas-vs-induction-kitchen-setup": {
    src: "/images/guide/photos/commercial-gas-vs-induction-kitchen-setup.jpg",
    alt: "업소용 가스 화구와 전기 인덕션의 화력·전기 승압·주방 열기 비교 도해 이미지",
  },
  "commercial-gas-grill-lpg-vs-lng-nozzle": {
    src: "/images/guide/photos/commercial-gas-grill-lpg-vs-lng-nozzle.jpg",
    alt: "업소용 가스기구 도시가스(LNG)와 LPG 노즐 구경 차이 및 오연결 경고 도해 이미지",
  },
  "winter-freeze-icemaker-dishwasher-heater": {
    src: "/images/guide/photos/winter-freeze-icemaker-dishwasher-heater.jpg",
    alt: "겨울 한파 대비 제빙기·식기세척기·온수기 잔수 제거 및 동파 예방 3단계 도해 이미지",
  },
  "freezer-defrost-knife-puncture-risk": {
    src: "/images/guide/photos/freezer-defrost-knife-puncture-risk.jpg",
    alt: "직냉식 냉동고 칼·송곳 성에 제거 시 매립 냉매관 천공 경고와 안전 제상법 도해 이미지",
  },
  "fridge-kitchen-fit-vs-freestanding-clearance": {
    src: "/images/guide/photos/fridge-kitchen-fit-vs-freestanding-clearance.jpg",
    alt: "키친핏(700mm)과 프리스탠딩(850mm+) 냉장고장 깊이·방열 여유 비교 도해 이미지",
  },
  "cable-reel-power-strip-tracking-fire": {
    src: "/images/guide/photos/cable-reel-power-strip-tracking-fire.jpg",
    alt: "감긴 전선 릴 과열과 멀티탭 16A(2,800W) 초과·트래킹 화재 예방 도해 이미지",
  },
  "compressor-appliance-clearance-heat-dissipation": {
    src: "/images/guide/photos/compressor-appliance-clearance-heat-dissipation.jpg",
    alt: "냉장고·제빙기·실외기 등 컴프레서 가전의 벽면 최소 방열 이격 거리 도해 이미지",
  },
  "used-appliance-nameplate-lifespan-guide": {
    src: "/images/guide/photos/used-appliance-nameplate-lifespan-guide.jpg",
    alt: "중고 가전 본체 정격 명판 제조년월 읽는 법과 공정위 부품 보유기간 기준 도해 이미지",
  },
  "aircon-refrigerant-r22-r410a-r32-guide": {
    src: "/images/guide/photos/aircon-refrigerant-r22-r410a-r32-guide.jpg",
    alt: "에어컨 냉매 R-22·R-410A·R-32 3세대 실린더와 규제·비용 비교 도해 이미지",
  },
  "commercial-fryer-gas-vs-electric-k-class": {
    src: "/images/guide/photos/commercial-fryer-gas-vs-electric-k-class.jpg",
    alt: "업소용 가스식·전기식 튀김기 비교와 주방 K급 소화기 비치 의무 도해 이미지",
  },
  "kitchen-hood-duct-sirocco-vs-inline-fan": {
    src: "/images/guide/photos/kitchen-hood-duct-sirocco-vs-inline-fan.jpg",
    alt: "식당 주방 배기 시로코팬과 인라인팬의 정압·덕트 길이별 선정 비교 도해 이미지",
  },
  "commercial-icemaker-air-vs-water-cooled": {
    src: "/images/guide/photos/commercial-icemaker-air-vs-water-cooled.jpg",
    alt: "업소용 제빙기 공랭식 방열 관리와 내부 청소 점검 부위 안내 이미지",
  },
  "cooling-only-vs-heat-pump-nameplate": {
    src: "/images/guide/photos/cooling-only-vs-heat-pump-nameplate.jpg",
    alt: "냉방전용 에어컨과 냉난방기(히트펌프) 제품 명판의 난방능력 표기 5초 구분 도해 이미지",
  },
  "commercial-water-heater-instant-vs-storage": {
    src: "/images/guide/photos/commercial-water-heater-instant-vs-storage.jpg",
    alt: "업소용 전기 순간온수기와 저장식 30~100L 온수기의 전력·밸브 관리 비교 도해 이미지",
  },
  "fridge-washer-gasket-mold-cleaning-safety": {
    src: "/images/guide/photos/fridge-washer-gasket-mold-cleaning-safety.jpg",
    alt: "냉장고 고무패킹 A4 용지 밀착 테스트와 드럼세탁기 곰팡이 안전 세척 도해 이미지",
  },
  "villa-old-house-drilling-angle-3kw": {
    src: "/images/guide/photos/villa-old-house-drilling-angle-3kw.jpg",
    alt: "빌라·구옥 에어컨 설치 전 외벽 코어 타공·실외기 앵글·주택 3kW 전기 한계 3대 점검 도해 이미지",
  },
  "store-lease-restoration-removal-dispute": {
    src: "/images/guide/photos/store-lease-restoration-removal-dispute.jpg",
    alt: "상가 퇴거 시 에어컨 타공·주방 덕트·전기 승압 원상복구 분쟁 예방 체크 도해 이미지",
  },
  "aircon-thin-copper-pipe-risks": {
    src: "/images/guide/photos/aircon-thin-copper-pipe-risks.jpg",
    alt: "에어컨 0.6mm 박육관과 0.8mm 이상 KS 정품 동배관의 단면 두께·내구성 비교 도해 이미지",
  },
  "aircon-pipe-length-and-refrigerant": {
    src: "/images/guide/photos/aircon-pipe-length-and-refrigerant.jpg",
    alt: "에어컨 배관 최소 3m·표준 5m·장배관 연장 시 정량 냉매 보충 구간 기준 도해 이미지",
  },
  "aircon-insulation-thickness-condensation": {
    src: "/images/guide/photos/aircon-insulation-thickness-condensation.jpg",
    alt: "에어컨 배관 보온재 두께 부족으로 인한 결로 및 누수 예방 안내 이미지",
  },
  "aircon-refrigerant-r32-r410a-r454b-guide": {
    src: "/images/guide/photos/aircon-refrigerant-r32-r410a-r454b-guide.jpg",
    alt: "차세대 에어컨 냉매 R-410A·R-32·R-454B 지구온난화지수(GWP) 비교 도해 이미지",
  },
  "aircon-refrigerant-recovery-and-leak-check": {
    src: "/images/guide/photos/aircon-refrigerant-recovery-and-leak-check.jpg",
    alt: "에어컨 철거 시 펌프다운 냉매 회수부터 진공·기밀 점검까지 3단계 공정 도해 이미지",
  },
  "aircon-refrigerant-recharge-cost-and-leak-first": {
    src: "/images/guide/photos/aircon-refrigerant-recharge-cost-and-leak-first.jpg",
    alt: "에어컨 냉매 충전 전 플레어 너트·서비스밸브·열교환기 3대 누설 부위 우선 점검 도해 이미지",
  },
  "commercial-aircon-refrigerant-management-guide": {
    src: "/images/guide/photos/commercial-aircon-refrigerant-management-guide.jpg",
    alt: "업소용·중대형 시스템 에어컨의 배관 정량 관리·R-32 환기·사전 시운전 4대 기준 도해 이미지",
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
