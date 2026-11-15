// 파일 경로: lib/guides/tool-slugs.ts

export type GuideToolKind =
  | "aircon-sizing"
  | "power-contract"
  | "clearance-entry"
  | "energy-payback";

export const SLUG_TO_GUIDE_TOOL: Record<string, GuideToolKind> = {
  // 1. 에어컨 냉방 평형 & 전압/전선 판정기
  "aircon-pyeong-sizing-cafe-restaurant": "aircon-sizing",
  "aircon-single-large-vs-multi-split": "aircon-sizing",
  "aircon-relocation-cost-variables": "aircon-sizing",
  "aircon-how-it-works-and-parts": "aircon-sizing",
  "why-ceiling-aircon-install-costs-more": "aircon-sizing",
  "why-no-outdoor-unit-on-walkway-defrost": "aircon-sizing",
  "fixed-speed-vs-inverter-aircon": "aircon-sizing",
  "outdoor-unit-louver-ventilation-fire": "aircon-sizing",
  "aircon-removal-pump-down-piping": "aircon-sizing",
  "winter-heating-heatpump-vs-electric-heater": "aircon-sizing",
  "aircon-2in1-vs-two-singles-home": "aircon-sizing",
  // 2. 매장 계약전력(kW) 부하 시뮬레이터
  "voltage-220v-vs-380v": "power-contract",
  "startup-closure-docs-and-power": "power-contract",
  "electricity-bill-capacity-and-kepco": "power-contract",
  "commercial-induction-plug-vs-breaker": "power-contract",
  "neutral-wire-risk-and-licensed-electrician": "power-contract",
  "elb-vs-mccb-breaker-trip-check": "power-contract",
  "store-takeover-appliances-power-checklist": "power-contract",
  "commercial-gas-vs-induction-kitchen-setup": "power-contract",
  "cable-reel-power-strip-tracking-fire": "power-contract",
  // 3. 출입문 통로·사다리차 진입 판정기
  "ladder-truck-and-clearance": "clearance-entry",
  "why-never-lay-fridge-flat-moving": "clearance-entry",
  "wash-tower-all-in-one-vs-separate-cleaning": "clearance-entry",
  "free-waste-pickup-15990903-vs-used-buyback": "clearance-entry",
  "fridge-kitchen-fit-vs-freestanding-clearance": "clearance-entry",
  // 4. 에너지 라벨 kWh & 차액 회수기간 계산기
  "energy-efficiency-rating-myth-and-kwh": "energy-payback",
  "inverter-aircon-24h-on-vs-off-electricity": "energy-payback",
};

/** 해당 정보 가이드 글이 인터랙티브 현장 계산기를 포함하는지 확인합니다. */
export function hasGuideInteractiveTool(slug: string): boolean {
  return slug in SLUG_TO_GUIDE_TOOL;
}
