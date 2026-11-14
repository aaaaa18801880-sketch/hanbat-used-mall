// 파일 경로: components/guide/guide-diagrams.tsx
import React, { useId } from "react";
import { STORE, STORE_MERCHANT_POLICY } from "../../lib/site";
import { ICON, Icon } from "../../lib/ui";
import {
  AirconDrainLeakPhotoDiagram,
  AirconPipeComparisonPhotoDiagram,
  ClearanceMeasurePhotoDiagram,
  IcemakerCleaningPhotoDiagram,
  OutdoorUnitWeatherproofPhotoDiagram,
  PcbPhotoFailureDiagram,
  WasherInspectionPhotoDiagram,
} from "./guide-photo-hotspot-diagram";

export type GuideDiagramId =
  | "aircon-repair-timeline"
  | "voltage-220v-380v-breaker"
  | "startup-power-budget"
  | "kw-vs-kwh-water-analogy"
  | "clearance-ladder-blueprint"
  | "used-vs-new-vs-p2p-flow"
  | "buyback-inspection-points"
  | "aircon-cycle-parts"
  | "outdoor-unit-weatherproof"
  | "pcb-failure-causes"
  | "ceiling-vs-stand-install"
  | "defrost-cycle-walkway"
  | "fixed-speed-vs-inverter"
  | "fridge-freezer-airflow"
  | "washer-tub-inspection"
  | "fridge-tilt-oil-return"
  | "commercial-45box-cooling"
  | "icemaker-heat-rejection"
  | "commercial-dishwasher-setup"
  | "refrigerant-leak-myth"
  | "aircon-pyeong-sizing"
  | "dryer-heatpump-condenser"
  | "kimchi-fridge-cooling"
  | "inverter-duty-cycle-curve"
  | "aircon-drain-leak-causes"
  | "aircon-pipe-copper-vs-alu"
  | "showcase-condensation-drain"
  | "appliance-resale-value-factors"
  | "energy-grade-revision-curve"
  | "aircon-single-vs-multi"
  | "induction-wiring-breaker"
  | "cafe-plumbing-drain-check"
  | "commercial-fridge-repair-roi"
  | "aircon-relocation-cost-factors";

function DiagramFigure({
  title,
  caption,
  badgeLabel = "기술 도해 · 단면/계통도",
  children,
}: {
  title: string;
  caption: string;
  badgeLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="my-5 rounded-2xl border border-[#E2E6EC] bg-[#F8FAFC] p-3.5 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-hb-xs sm:text-hb-sm font-bold text-[#141A23] flex items-center gap-1.5">
          <Icon d={ICON.layers} className="w-4 h-4 text-[#E8521A] shrink-0" />
          <span>{title}</span>
        </p>
        <span className="inline-flex items-center rounded-md border border-[#E2E6EC] bg-white px-2 py-0.5 text-hb-xs font-semibold text-[#475569] shrink-0">
          {badgeLabel}
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#CBD5E1] bg-white p-2 sm:p-3 shadow-2xs">
        {children}
      </div>
      <figcaption className="mt-2.5 text-hb-xs text-[#475569] leading-[1.6] [text-wrap:pretty]">
        {caption}
      </figcaption>
    </figure>
  );
}

function AirconRepairTimelineDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="성수기(6~8월) 신형 인버터 에어컨 수리 대기 구조 도해"
      caption="최신 인버터 에어컨은 모델별 전용 기판(PCB)이 달라 현장 즉석 교체가 어렵습니다. 성수기 방문 적체와 부품 주문 기간이 겹쳐 평균 3~4주 소요됩니다."
    >
      <svg
        viewBox="0 0 760 270"
        className="w-full min-w-[540px] h-auto block font-sans"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          성수기 신형 인버터 에어컨 3~4주 수리 소요 타임라인 비교 도해
        </title>

        {/* 상단: 신형 인버터 타임라인 */}
        <text x="16" y="24" fontSize="13" fontWeight="700" fill="#141A23">
          신형 인버터 모델 · 여름철 성수기 고장 시 평균 타임라인 (총 3~4주)
        </text>

        {/* 1단계 */}
        <rect x="16" y="38" width="215" height="68" rx="10" fill="#FFF7ED" stroke="#FDBA74" />
        <text x="28" y="60" fontSize="12" fontWeight="700" fill="#C2410C">
          1단계 · 접수 및 1차 방문
        </text>
        <text x="28" y="78" fontSize="11" fill="#334155">
          에러코드 · 누설 판독만 진행
        </text>
        <text x="28" y="96" fontSize="12" fontWeight="700" fill="#141A23">
          대기 약 5 ~ 14일
        </text>

        <path d="M236 72 L254 72 M249 67 L254 72 L249 77" stroke="#94A3B8" strokeWidth="2" fill="none" />

        {/* 2단계 */}
        <rect x="260" y="38" width="250" height="68" rx="10" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="272" y="60" fontSize="12" fontWeight="700" fill="#B91C1C">
          2단계 · 모델 전용 PCB 부품 발주
        </text>
        <text x="272" y="78" fontSize="11" fill="#334155">
          연식별 호환 불가 → 본사 물류 대기
        </text>
        <text x="272" y="96" fontSize="12" fontWeight="700" fill="#141A23">
          품절 시 1 ~ 2주 이상 지연
        </text>

        <path d="M515 72 L533 72 M528 67 L533 72 L528 77" stroke="#94A3B8" strokeWidth="2" fill="none" />

        {/* 3단계 */}
        <rect x="539" y="38" width="205" height="68" rx="10" fill="#FFF7ED" stroke="#FDBA74" />
        <text x="551" y="60" fontSize="12" fontWeight="700" fill="#C2410C">
          3단계 · 2차 재방문 교체
        </text>
        <text x="551" y="78" fontSize="11" fill="#334155">
          부품 수령 후 기사 일정 재조율
        </text>
        <text x="551" y="96" fontSize="12" fontWeight="700" fill="#141A23">
          완료까지 추가 3 ~ 7일
        </text>

        {/* 하단 비교 박스 */}
        <line x1="16" y1="126" x2="744" y2="126" stroke="#E2E6EC" strokeDasharray="4 4" />

        <text x="16" y="150" fontSize="13" fontWeight="700" fill="#141A23">
          구조 차이 핵심: 왜 현장에서 바로 못 고칠까?
        </text>

        <rect x="16" y="164" width="352" height="90" rx="10" fill="#F8FAFC" stroke="#CBD2DC" />
        <text x="30" y="186" fontSize="12" fontWeight="700" fill="#141A23">
          신형 인버터 구조 (복잡한 전용 전자판)
        </text>
        <text x="30" y="206" fontSize="11" fill="#475569">
          실내기 PCB + 실외기 인버터 보드 + EEV + 센서 5~8종
        </text>
        <text x="30" y="224" fontSize="11" fill="#475569">
          • 연식·파생코드가 조금만 달라도 부품 호환 불가
        </text>
        <text x="30" y="242" fontSize="11" fill="#B91C1C" fontWeight="600">
          • 무상보증 후 보드 교체 시 수리비 수십만 원대 발생
        </text>

        <rect x="392" y="164" width="352" height="90" rx="10" fill="#F0FDFA" stroke="#99F6E4" />
        <text x="406" y="186" fontSize="12" fontWeight="700" fill="#0F766E">
          정속형 · 부품 수급 원활한 주력 연식
        </text>
        <text x="406" y="206" fontSize="11" fill="#334155">
          공용 릴레이·콘덴서·팬모터 위주의 비교적 단순한 배선
        </text>
        <text x="406" y="224" fontSize="11" fill="#334155">
          • 시중 자재 보유량이 많아 당일~2일 내 수리 가능 확률 높음
        </text>
        <text x="406" y="242" fontSize="11" fill="#0F766E" fontWeight="600">
          • 성수기 영업 공백이 치명적인 매장일수록 유리한 구조
        </text>
      </svg>
    </DiagramFigure>
  );
}

function VoltageBreakerDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="분전함(두꺼비집) 차단기 가닥수로 보는 단상 220V vs 삼상 380V 구분"
      caption="상가 계약 전 분전함 메인 차단기에 들어오는 전선 가닥 수를 먼저 세어 보세요. 삼상 380V 에어컨은 220V 전용 매장에서 작동하지 않습니다."
    >
      <svg
        viewBox="0 0 760 300"
        className="w-full min-w-[540px] h-auto block font-sans"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          단상 220V 2선식과 삼상 380V 4선식 분전함 차단기 배선 비교 도해
        </title>

        {/* 왼쪽: 단상 220V */}
        <rect x="16" y="14" width="352" height="272" rx="12" fill="#F8FAFC" stroke="#CBD2DC" />
        <rect x="16" y="14" width="352" height="38" rx="12" fill="#1E293B" />
        <rect x="16" y="40" width="352" height="12" fill="#1E293B" />
        <text x="32" y="39" fontSize="13" fontWeight="700" fill="#FFFFFF">
          단상 220V (2선식 · 2P 차단기)
        </text>

        {/* 전선 2가닥 (흑, 청) + 접지 */}
        <line x1="145" y1="62" x2="145" y2="108" stroke="#141A23" strokeWidth="6" />
        <line x1="195" y1="62" x2="195" y2="108" stroke="#2563EB" strokeWidth="6" />
        <line x1="255" y1="62" x2="255" y2="192" stroke="#16A34A" strokeWidth="3" strokeDasharray="4 3" />

        <text x="115" y="84" fontSize="11" fontWeight="700" fill="#141A23">
          L선
        </text>
        <text x="206" y="84" fontSize="11" fontWeight="700" fill="#2563EB">
          N선
        </text>
        <text x="264" y="92" fontSize="10" fontWeight="600" fill="#15803D">
          접지
        </text>

        {/* 2P 차단기 바디 */}
        <rect x="120" y="108" width="100" height="72" rx="8" fill="#FFFFFF" stroke="#64748B" strokeWidth="2" />
        <rect x="136" y="128" width="68" height="22" rx="4" fill="#E8521A" />
        <text x="170" y="143" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
          ON · 2P
        </text>
        <text x="170" y="170" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          전선 2가닥
        </text>

        {/* 설명 */}
        <rect x="32" y="200" width="320" height="72" rx="8" fill="#FFFFFF" stroke="#E2E6EC" />
        <text x="44" y="220" fontSize="11" fontWeight="700" fill="#141A23">
          적용: 가정집 · 원룸 · 23평형 이하 에어컨
        </text>
        <text x="44" y="240" fontSize="11" fill="#475569">
          • 전류 한 곳에 집중 → 30평대 이상 대형기는 배선 과열 위험
        </text>
        <text x="44" y="258" fontSize="11" fill="#C2410C" fontWeight="600">
          • 380V 전용 에어컨 연결 불가 (승압 공사 필요)
        </text>

        {/* 오른쪽: 삼상 380V */}
        <rect x="392" y="14" width="352" height="272" rx="12" fill="#FFFBF7" stroke="#FDBA74" />
        <rect x="392" y="14" width="352" height="38" rx="12" fill="#E8521A" />
        <rect x="392" y="40" width="352" height="12" fill="#E8521A" />
        <text x="408" y="39" fontSize="13" fontWeight="700" fill="#FFFFFF">
          삼상 380V (4선식 · 4P 차단기)
        </text>

        {/* 전선 4가닥 (R, S, T, N) + 접지 */}
        <line x1="472" y1="62" x2="472" y2="108" stroke="#141A23" strokeWidth="6" />
        <line x1="512" y1="62" x2="512" y2="108" stroke="#DC2626" strokeWidth="6" />
        <line x1="552" y1="62" x2="552" y2="108" stroke="#2563EB" strokeWidth="6" />
        <line x1="592" y1="62" x2="592" y2="108" stroke="#94A3B8" strokeWidth="6" />
        <line x1="650" y1="62" x2="650" y2="192" stroke="#16A34A" strokeWidth="3" strokeDasharray="4 3" />

        <text x="466" y="78" fontSize="11" fontWeight="700" fill="#141A23">
          R
        </text>
        <text x="506" y="78" fontSize="11" fontWeight="700" fill="#DC2626">
          S
        </text>
        <text x="546" y="78" fontSize="11" fontWeight="700" fill="#2563EB">
          T
        </text>
        <text x="586" y="78" fontSize="11" fontWeight="700" fill="#475569">
          N
        </text>
        <text x="658" y="92" fontSize="10" fontWeight="600" fill="#15803D">
          접지
        </text>

        {/* 4P 차단기 바디 */}
        <rect x="448" y="108" width="168" height="72" rx="8" fill="#FFFFFF" stroke="#64748B" strokeWidth="2" />
        <rect x="464" y="128" width="136" height="22" rx="4" fill="#141A23" />
        <text x="532" y="143" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
          ON · 4P (380V/220V)
        </text>
        <text x="532" y="170" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          전선 4가닥 (3상 + 중성선)
        </text>

        {/* 설명 */}
        <rect x="408" y="200" width="320" height="72" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="420" y="220" fontSize="11" fontWeight="700" fill="#141A23">
          적용: 30평 이상 대형 스탠드·천장형 4way·업소 설비
        </text>
        <text x="420" y="240" fontSize="11" fill="#475569">
          • 3개 상이 번갈아 밀어주어 대형 콤프레샤 시동이 안정적
        </text>
        <text x="420" y="258" fontSize="11" fill="#0F766E" fontWeight="600">
          • 1개 상 + N선 조합으로 220V 일반 콘센트도 함께 분기 가능
        </text>
      </svg>
    </DiagramFigure>
  );
}

function StartupPowerBudgetDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="소형 카페·식당 설비 총 전력(kW) 합산과 기존 5kW 상가 초과 예시"
      caption="냉장고·제빙기보다 물 데우는 전열기기(식기세척기 히터·커피머신·온수기)와 대형 냉난방기가 전력을 가장 많이 차지합니다."
    >
      <svg
        viewBox="0 0 760 250"
        className="w-full min-w-[540px] h-auto block font-sans"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          업소용 주방설비 소비전력 합산 및 계약전력 5kW 대비 부족 시뮬레이션 도해
        </title>

        <text x="16" y="26" fontSize="13" fontWeight="700" fill="#141A23">
          매장 설비별 예상 전력 합계: 약 12.5kW (동시 사용 75~80% 기준 실필요 9.5~10kW)
        </text>

        {/* 눈금 바 (0kW ~ 15kW: 1kW = 44px, x=28..688) */}
        <rect x="28" y="64" width="660" height="44" rx="8" fill="#F1F5F9" stroke="#CBD2DC" />

        {/* 누적 막대 (총 12.5kW -> 12.5 * 44 = 550px) */}
        {/* 냉난방 4kW (176px) */}
        <rect x="28" y="64" width="176" height="44" rx="8" fill="#E8521A" />
        <text x="116" y="90" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
          냉난방기 4.0kW
        </text>

        {/* 커피머신/식세 3.5kW (154px) */}
        <rect x="204" y="64" width="154" height="44" fill="#141A23" />
        <text x="281" y="90" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
          머신·세척기 3.5kW
        </text>

        {/* 온수기 2.5kW (110px) */}
        <rect x="358" y="64" width="110" height="44" fill="#0F766E" />
        <text x="413" y="90" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
          온수기 2.5kW
        </text>

        {/* 냉장·제빙기 1.5kW (66px) */}
        <rect x="468" y="64" width="66" height="44" fill="#475569" />
        <text x="501" y="90" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
          냉장 1.5
        </text>

        {/* 조명/POS 1kW (44px) */}
        <rect x="534" y="64" width="44" height="44" fill="#94A3B8" />
        <text x="556" y="90" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
          1.0
        </text>

        {/* 5kW 한계선 (28 + 5*44 = 248) */}
        <line x1="248" y1="42" x2="248" y2="144" stroke="#DC2626" strokeWidth="2.5" strokeDasharray="4 3" />
        <rect x="180" y="34" width="136" height="22" rx="4" fill="#FEF2F2" stroke="#DC2626" />
        <text x="248" y="49" textAnchor="middle" fontSize="11" fontWeight="700" fill="#B91C1C">
          소형 상가 한계 (5kW)
        </text>

        {/* 10kW 권장선 (28 + 10*44 = 468) */}
        <line x1="468" y1="112" x2="468" y2="148" stroke="#0F766E" strokeWidth="2" strokeDasharray="4 3" />
        <text x="468" y="162" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0F766E">
          실피크 기준 (약 10kW)
        </text>

        {/* 15kW 여유선 (28 + 15*44 = 688) */}
        <text x="688" y="126" textAnchor="end" fontSize="11" fontWeight="600" fill="#64748B">
          15kW 상가 여유
        </text>

        {/* 하단 해석 박스 */}
        <rect x="16" y="176" width="728" height="60" rx="10" fill="#FFF4EE" stroke="#FADCD0" />
        <text x="32" y="199" fontSize="12" fontWeight="700" fill="#141A23">
          현장 결론: 5kW 원룸형 상가에 그대로 세팅하면 점심 피크타임마다 차단기가 내려갑니다.
        </text>
        <text x="32" y="220" fontSize="11" fill="#475569">
          매장 임대차 계약 전 현재 계약전력이 최소 10~15kW 이상인지(또는 한전 증설 비용을 누가 낼지) 반드시 확인하세요.
        </text>
      </svg>
    </DiagramFigure>
  );
}

function KwVsKwhDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="분전함 순간 피크전력(kW) vs 월 누적 사용량(kWh) 및 요금 구조 계통도"
      caption="계약전력(kW)은 동시에 켤 수 있는 최대 출력 한계이고, 전력량(kWh)은 출력에 가동 시간을 곱해 계량기에 쌓이는 월 사용 총량입니다."
    >
      <svg
        viewBox="0 0 760 278"
        className="w-full min-w-[560px] h-auto block font-sans"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          계약전력 kW 순간 출력 게이지와 월 사용량 kWh 계량기 및 주택용 누진제 vs 상가 일반용 요금 곡선 도해
        </title>

        {/* 좌측: 계약전력 kW (순간 출력 게이지) */}
        <rect x="16" y="14" width="352" height="250" rx="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <text x="34" y="40" fontSize="13.5" fontWeight="700" fill="#E8521A">
          kW (킬로와트) · 동시에 켜는 순간 출력 한계
        </text>

        {/* 분전함 부하 게이지 바 */}
        <rect x="34" y="56" width="316" height="82" rx="8" fill="#FFFFFF" stroke="#E2E6EC" />
        <text x="46" y="76" fontSize="10.5" fontWeight="700" fill="#141A23">
          분전함 실시간 부하 비교 (예: 동시 가동 9.8kW 기준)
        </text>
        {/* 스케일 바 */}
        <rect x="46" y="88" width="292" height="18" rx="4" fill="#F1F5F9" stroke="#CBD5E1" />
        <rect x="46" y="88" width="191" height="18" rx="4" fill="#E8521A" />
        {/* 5kW 한계선 */}
        <line x1="143" y1="82" x2="143" y2="114" stroke="#DC2626" strokeWidth="2" strokeDasharray="3 2" />
        <text x="143" y="128" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#DC2626">
          5kW 한계(트립)
        </text>
        {/* 15kW 여유선 */}
        <line x1="338" y1="82" x2="338" y2="114" stroke="#0F766E" strokeWidth="2" />
        <text x="336" y="128" textAnchor="end" fontSize="9.5" fontWeight="700" fill="#0F766E">
          15kW 계약 여유
        </text>
        <text x="192" y="101" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#FFFFFF">
          9.8kW 동시 부하
        </text>

        <text x="34" y="164" fontSize="11" fill="#334155">
          • 기계들을 한꺼번에 켰을 때 버티는 차단기·계약 한계
        </text>
        <text x="34" y="186" fontSize="11" fill="#334155">
          • 상가 일반용은 계약전력 1kW당 월 고정 기본요금 부과
        </text>
        <text x="34" y="208" fontSize="11" fontWeight="700" fill="#C2410C">
          • 과다 계약 시 고정비 증가 / 부족 시 한전 증설(2~4주) 필요
        </text>
        <rect x="34" y="222" width="316" height="28" rx="6" fill="#FFF4EE" stroke="#FDBA74" />
        <text x="192" y="240" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#C2410C">
          표준 배선 참고: 20A(2.5SQ) / 30~40A(4~6SQ) 전용 차단기
        </text>

        {/* 우측: 사용량 kWh & 요금 곡선 */}
        <rect x="392" y="14" width="352" height="250" rx="12" fill="#F0FDFA" stroke="#99F6E4" strokeWidth="1.5" />
        <text x="410" y="40" fontSize="13.5" fontWeight="700" fill="#0F766E">
          kWh (킬로와트시) · 계량기 누적 월 사용량
        </text>

        {/* 계량기 공식 + 요금 단가 곡선 그래프 */}
        <rect x="410" y="56" width="316" height="108" rx="8" fill="#FFFFFF" stroke="#CCFBF1" />
        <text x="422" y="75" fontSize="10.5" fontWeight="700" fill="#141A23">
          주택용 누진제(계단형) vs 상가 일반용(단일단가) 단가 비교
        </text>
        <line x1="436" y1="84" x2="436" y2="152" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="436" y1="152" x2="610" y2="152" stroke="#94A3B8" strokeWidth="1.5" />
        {/* 주택용 계단 */}
        <path
          d="M440 144 L488 144 L488 124 L536 124 L536 96 L604 96"
          fill="none"
          stroke="#DC2626"
          strokeWidth="2.5"
        />
        <text x="580" y="90" fontSize="9" fontWeight="700" fill="#DC2626">
          주택용 누진(급등)
        </text>
        {/* 상가 단일단가 */}
        <line x1="440" y1="128" x2="604" y2="128" stroke="#0F766E" strokeWidth="2.5" strokeDasharray="5 3" />
        <text x="576" y="142" fontSize="9" fontWeight="700" fill="#0F766E">
          상가 일반용(일정)
        </text>
        {/* kWh 계산 칩 */}
        <rect x="618" y="84" width="98" height="68" rx="6" fill="#ECFDF5" stroke="#6EE7B7" />
        <text x="667" y="103" textAnchor="middle" fontSize="10" fontWeight="700" fill="#065F46">
          계산 예시
        </text>
        <text x="667" y="121" textAnchor="middle" fontSize="10" fill="#334155">
          2kW × 3시간
        </text>
        <text x="667" y="139" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0F766E">
          = 6kWh 누적
        </text>

        <text x="410" y="186" fontSize="11" fill="#334155">
          • 상가 일반용은 주택용처럼 사용량 급증 누진제가 없음
        </text>
        <text x="410" y="208" fontSize="11" fill="#334155">
          • 단, 계약전력 대비 월 450시간 초과 사용 시 부가금 부과
        </text>
        <rect x="410" y="222" width="316" height="28" rx="6" fill="#FFFFFF" stroke="#99F6E4" />
        <text x="568" y="240" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#0F766E">
          유지 팁: 응축기 먼지 제거·패킹 밀착으로 가동시간(h) 단축
        </text>
      </svg>
    </DiagramFigure>
  );
}

function ClearanceBlueprintDiagram() {
  return (
    <DiagramFigure
      badgeLabel="실사 점검 · 반입 동선"
      title="출입문 내경 실측 · 복도 90도 코너 · 베란다 사다리차 반입 3대 체크포인트"
      caption="설치 자리만 재면 문손잡이·복도 회전 구간에서 걸리기 쉽습니다. 번호 핀을 눌러 문틀 실측법, 90도 꺾임 기준, 사다리차 양중 조건을 확인해 보세요."
    >
      <ClearanceMeasurePhotoDiagram />
    </DiagramFigure>
  );
}

function UsedVsStoreFlowDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="개인 간 직거래 vs 직영 전문 매장 구매 과정 · 총소유비용(TCO) 비교 도해"
      caption="중고가전은 기계 값뿐 아니라 운반·설치·분해세척·고장 수리 위험까지 전 과정을 합산해야 실제 손익을 정확히 비교할 수 있습니다."
    >
      <svg
        viewBox="0 0 760 286"
        className="w-full min-w-[560px] h-auto block font-sans"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          개인 간 직거래와 직영 전문 매장의 배송 설치, A/S 보증 흐름 및 실질 총소유비용 비교 도해
        </title>

        {/* 상단: 개인 직거래 */}
        <text x="16" y="24" fontSize="12" fontWeight="700" fill="#64748B">
          일반 개인 직거래 (구매자 본인 부담 흐름)
        </text>
        <rect x="16" y="34" width="164" height="58" rx="8" fill="#F8FAFC" stroke="#CBD2DC" />
        <text x="98" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">
          1. 현금/이체 결제
        </text>
        <text x="98" y="75" textAnchor="middle" fontSize="10" fill="#64748B">
          카드 · 세금계산서 불가
        </text>

        <path d="M185 63 L201 63" stroke="#CBD2DC" strokeWidth="2" />

        <rect x="205" y="34" width="164" height="58" rx="8" fill="#F8FAFC" stroke="#CBD2DC" />
        <text x="287" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">
          2. 용달·기사 별도 섭외
        </text>
        <text x="287" y="75" textAnchor="middle" fontSize="10" fill="#64748B">
          운임·설치비 추가 지출
        </text>

        <path d="M374 63 L390 63" stroke="#CBD2DC" strokeWidth="2" />

        <rect x="394" y="34" width="164" height="58" rx="8" fill="#F8FAFC" stroke="#CBD2DC" />
        <text x="476" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">
          3. 내부 위생·수평 직접
        </text>
        <text x="476" y="75" textAnchor="middle" fontSize="10" fill="#64748B">
          분해세척 10~15만 원 추가
        </text>

        <path d="M563 63 L579 63" stroke="#CBD2DC" strokeWidth="2" />

        <rect x="583" y="34" width="161" height="58" rx="8" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="663" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="#B91C1C">
          4. 고장 시 보증 공백
        </text>
        <text x="663" y="75" textAnchor="middle" fontSize="10" fill="#B91C1C">
          수리비 본인 전액 부담
        </text>

        {/* 중단: 직영 매장 */}
        <text x="16" y="118" fontSize="12" fontWeight="700" fill="#141A23">
          {STORE.name} 직영 매장 (일괄 검수·설치 및 계약 보증 흐름)
        </text>
        <rect x="16" y="128" width="164" height="62" rx="8" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <text x="98" y="151" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          1. 정식 결제 · 세무 증빙
        </text>
        <text x="98" y="170" textAnchor="middle" fontSize="10" fill="#475569">
          카드 · 전자세금계산서
        </text>

        <path d="M185 159 L201 159" stroke="#E8521A" strokeWidth="2" />

        <rect x="205" y="128" width="164" height="62" rx="8" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <text x="287" y="151" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          2. 분해 세척 · 시운전
        </text>
        <text x="287" y="170" textAnchor="middle" fontSize="10" fill="#475569">
          고장 여부 사전 검수 완료
        </text>

        <path d="M374 159 L390 159" stroke="#E8521A" strokeWidth="2" />

        <rect x="394" y="128" width="164" height="62" rx="8" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <text x="476" y="151" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          3. 직영 기사 운반·설치
        </text>
        <text x="476" y="170" textAnchor="middle" fontSize="10" fill="#475569">
          수평 · 배관 마무리 지원
        </text>

        <path d="M563 159 L579 159" stroke="#E8521A" strokeWidth="2" />

        <rect x="583" y="128" width="161" height="62" rx="8" fill="#FFF4EE" stroke="#E8521A" strokeWidth="1.5" />
        <text x="663" y="151" textAnchor="middle" fontSize="11" fontWeight="700" fill="#C2410C">
          4. 계약 조건별 무상 A/S
        </text>
        <text x="663" y="170" textAnchor="middle" fontSize="9.5" fill="#C2410C">
          {STORE_MERCHANT_POLICY.warrantyAircon.split(" (")[0]}
        </text>

        {/* 하단: 총비용(TCO) 누적 막대 비교 */}
        <rect x="16" y="206" width="728" height="68" rx="10" fill="#F8FAFC" stroke="#CBD5E1" />
        <text x="30" y="226" fontSize="11" fontWeight="700" fill="#141A23">
          실제 지출 비용 합산 비교 (기계값 외 부대비용 포함 기준)
        </text>
        <text x="30" y="246" fontSize="10" fontWeight="700" fill="#64748B">
          직거래
        </text>
        <rect x="90" y="236" width="140" height="14" rx="2" fill="#94A3B8" />
        <rect x="232" y="236" width="90" height="14" rx="2" fill="#F59E0B" />
        <rect x="324" y="236" width="110" height="14" rx="2" fill="#EF4444" />
        <text x="444" y="247" fontSize="9.5" fill="#B91C1C">
          기계값 + 용달·설치비 + 별도 청소 + 무보증 수리 위험
        </text>

        <text x="30" y="266" fontSize="10" fontWeight="700" fill="#E8521A">
          직영매장
        </text>
        <rect x="90" y="255" width="210" height="14" rx="2" fill="#141A23" />
        <rect x="302" y="255" width="44" height="14" rx="2" fill="#0F766E" />
        <text x="356" y="266" fontSize="9.5" fontWeight="700" fill="#0F766E">
          검수·세척·설치 상담 일괄 포함 ({STORE_MERCHANT_POLICY.warrantyMajor.split(" (")[0]})
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  6-2. 방문 매입 시 기사 현장 감가 포인트 단면 도해 (7번 글)              */
/* ------------------------------------------------------------------ */
function BuybackInspectionPointsDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="방문 매입 시 기사가 현장에서 확인하는 4대 감가·우대 체크 위치"
      caption="명판 스티커(제조년월), 도어 패킹·내부 선반, 하부 부식 여부, 에어컨 펌프다운(냉매 회수) 상태를 먼저 갖추면 현장 감가를 줄일 수 있습니다."
    >
      <svg
        viewBox="0 0 760 276"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[560px] h-auto select-none"
      >
        <title id={titleId}>
          중고가전 방문 매입 시 냉장고 명판·선반·하부 부식 및 에어컨 펌프다운 점검 위치 도해
        </title>

        {/* 좌측: 냉장고/세탁기 점검 도면 */}
        <rect x="16" y="14" width="356" height="248" rx="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <text x="34" y="38" fontSize="12.5" fontWeight="700" fill="#141A23">
          1. 냉장고 · 세탁기 · 주방기기 현장 검수 위치
        </text>

        {/* 냉장고 측면/정면 외곽 도면 */}
        <rect x="44" y="58" width="98" height="168" rx="6" fill="#FFFFFF" stroke="#141A23" strokeWidth="2" />
        <line x1="44" y1="138" x2="142" y2="138" stroke="#141A23" strokeWidth="1.5" />
        <line x1="54" y1="82" x2="132" y2="82" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 2" />
        <line x1="54" y1="108" x2="132" y2="108" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 2" />
        <rect x="122" y="64" width="16" height="24" rx="2" fill="#FFF4EE" stroke="#E8521A" strokeWidth="1.5" />
        <rect x="44" y="212" width="98" height="14" fill="#FEE2E2" />

        <circle cx="130" cy="76" r="4" fill="#E8521A" />
        <line x1="134" y1="76" x2="164" y2="76" stroke="#E8521A" strokeWidth="1.5" />
        <text x="170" y="74" fontSize="10.5" fontWeight="700" fill="#C2410C">
          ① 옆면/내부 명판 스티커
        </text>
        <text x="170" y="90" fontSize="9.5" fill="#475569">
          제조년월 10년 이내(5년 내 우대) 확인
        </text>

        <circle cx="100" cy="108" r="4" fill="#1D4ED8" />
        <line x1="104" y1="108" x2="164" y2="122" stroke="#1D4ED8" strokeWidth="1.5" />
        <text x="170" y="122" fontSize="10.5" fontWeight="700" fill="#1D4ED8">
          ② 도어 고무패킹 · 선반/서랍
        </text>
        <text x="170" y="138" fontSize="9.5" fill="#475569">
          찢어짐·누락 부품 수만큼 부품비 차감
        </text>

        <circle cx="93" cy="218" r="4" fill="#DC2626" />
        <line x1="97" y1="218" x2="164" y2="176" stroke="#DC2626" strokeWidth="1.5" />
        <text x="170" y="174" fontSize="10.5" fontWeight="700" fill="#DC2626">
          ③ 하부 프레임 녹 · 외관 찍힘
        </text>
        <text x="170" y="190" fontSize="9.5" fill="#475569">
          바닥 부식·큰 찌그러짐 시 상품화 불가
        </text>

        <rect x="170" y="206" width="186" height="40" rx="6" fill="#FFFFFF" stroke="#E2E6EC" />
        <text x="180" y="223" fontSize="9.5" fontWeight="700" fill="#0F766E">
          사전 사진: 정면 + 명판 근접 + 흠집 + 층수
        </text>
        <text x="180" y="238" fontSize="9.5" fill="#475569">
          미리 전달하면 방문 당일 금액 변동 최소화
        </text>

        {/* 우측: 에어컨 펌프다운 & 반출 환경 */}
        <rect x="388" y="14" width="356" height="248" rx="12" fill="#FFFBF7" stroke="#FDBA74" strokeWidth="1.5" />
        <text x="406" y="38" fontSize="12.5" fontWeight="700" fill="#C2410C">
          2. 에어컨 매입 핵심 · 펌프다운(냉매 회수) 및 반출 조건
        </text>

        <rect x="406" y="58" width="110" height="82" rx="6" fill="#FFFFFF" stroke="#141A23" strokeWidth="2" />
        <circle cx="448" cy="98" r="24" fill="#F1F5F9" stroke="#475569" strokeWidth="1.5" />
        <rect x="516" y="106" width="18" height="24" rx="2" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.5" />
        <path d="M534 114 L564 114 M534 124 L564 124" stroke="#64748B" strokeWidth="3" />

        <text x="546" y="76" fontSize="10.5" fontWeight="700" fill="#0F766E">
          ④ 서비스밸브 펌프다운
        </text>
        <text x="546" y="94" fontSize="9.5" fill="#334155">
          실외기 안에 냉매(가스)를 잠가
        </text>
        <text x="546" y="108" fontSize="9.5" fill="#334155">
          회수한 상태로 배관 분리해야 제값
        </text>
        <text x="546" y="136" fontSize="9.5" fontWeight="700" fill="#DC2626">
          배관 칼절단·가스 방출 시 감가/불가
        </text>

        <rect x="406" y="156" width="322" height="90" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="420" y="177" fontSize="11" fontWeight="700" fill="#141A23">
          현장 반출 난이도별 견적 반영 기준
        </text>
        <text x="420" y="198" fontSize="10" fill="#0F766E" fontWeight="700">
          • 1층 · 승강기 탑승 · 차량 진입 가능 → 반출 비용 부담 최저
        </text>
        <text x="420" y="216" fontSize="10" fill="#475569">
          • 2층 이상 좁은 계단 · 옥상 난간 크레인/사다리차 → 작업비 반영
        </text>
        <text x="420" y="234" fontSize="10" fill="#C2410C">
          • 폐기물 수거만 필요 시 매입 품목과 묶어 동시 정리 상담 가능
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  7. 에어컨 냉매 순환 4대 부품과 고장 연결 도해 (8번 글)                */
/* ------------------------------------------------------------------ */
function AirconCyclePartsDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="에어컨 냉매 순환 4대 부품과 고장이 이어지는 위치"
      caption="에어컨은 열을 없애는 기계가 아니라 냉매가 실내 열을 빨아들여(증발기) 압축·배출(응축기)하는 순환 장치이므로 한 곳만 막혀도 전체가 멈춥니다."
    >
      <svg
        viewBox="0 0 760 300"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          실내기 증발기와 팽창밸브, 실외기 압축기와 응축기 4단계 냉매 순환과 부품별 고장 연결 도해
        </title>

        {/* 실내/실외 배경 영역 구분 */}
        <rect x="12" y="10" width="350" height="278" rx="12" fill="#EFF6FF" stroke="#BFDBFE" />
        <text x="187" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1D4ED8">
          실내기 영역 (열 흡수 · 찬바람 배출)
        </text>

        <rect x="398" y="10" width="350" height="278" rx="12" fill="#FFF7ED" stroke="#FED7AA" />
        <text x="573" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill="#C2410C">
          실외기 영역 (열 방출 · 더운바람 배출)
        </text>

        <line x1="380" y1="16" x2="380" y2="284" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="5 5" />

        {/* 4. 팽창밸브 */}
        <rect x="28" y="50" width="318" height="86" rx="10" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="1.5" />
        <text x="44" y="72" fontSize="12" fontWeight="700" fill="#1D4ED8">
          ④ 팽창밸브 / 모세관 (감압 분사기)
        </text>
        <text x="44" y="92" fontSize="10.5" fill="#334155">
          고압 액체 냉매를 좁은 통로로 통과시켜 차가운 저압 안개로 변환
        </text>
        <text x="44" y="114" fontSize="10.5" fontWeight="700" fill="#DC2626">
          고장: 진공 미흡·수분 유입 시 밸브 막힘 → 냉방 불능
        </text>

        {/* 1. 증발기 */}
        <rect x="28" y="182" width="318" height="90" rx="10" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.5" />
        <text x="44" y="204" fontSize="12" fontWeight="700" fill="#0F766E">
          ① 실내기 증발기(에바) + 송풍팬
        </text>
        <text x="44" y="224" fontSize="10.5" fill="#334155">
          차가운 냉매가 실내 열을 뺏어 기체로 증발 (결로 물받이 생성)
        </text>
        <text x="44" y="246" fontSize="10.5" fontWeight="700" fill="#DC2626">
          고장: 먼지·곰팡이 막힘 → 에바 얼음 결빙 · 배수 호스 누수
        </text>

        {/* 3. 응축기 */}
        <rect x="414" y="50" width="318" height="86" rx="10" fill="#FFFFFF" stroke="#E8521A" strokeWidth="1.5" />
        <text x="430" y="72" fontSize="12" fontWeight="700" fill="#C2410C">
          ③ 실외기 응축기(콘덴서) + 팬모터
        </text>
        <text x="430" y="92" fontSize="10.5" fill="#334155">
          뜨거운 고압 기체를 외부 바람으로 식혀 고압 액체로 응축
        </text>
        <text x="430" y="114" fontSize="10.5" fontWeight="700" fill="#DC2626">
          고장: 실외기 통풍 막힘·팬 고장 → 고압 차단 에러 · 정지
        </text>

        {/* 2. 압축기 */}
        <rect x="414" y="182" width="318" height="90" rx="10" fill="#FFFFFF" stroke="#141A23" strokeWidth="2" />
        <text x="430" y="204" fontSize="12" fontWeight="700" fill="#141A23">
          ② 압축기 (콤프레샤 · 실외기 심장)
        </text>
        <text x="430" y="224" fontSize="10.5" fill="#334155">
          미지근한 기체 냉매를 고온·고압(70도+) 기체로 강하게 압축
        </text>
        <text x="430" y="246" fontSize="10.5" fontWeight="700" fill="#DC2626">
          고장: 냉매 누설로 오일 순환 끊김 → 과열 코일 소손 · 고착
        </text>

        {/* 순환 화살표 */}
        {/* 3 -> 4 (고압 액관) */}
        <path d="M414 93 L356 93" stroke="#1D4ED8" strokeWidth="3" />
        <polygon points="348,93 358,87 358,99" fill="#1D4ED8" />
        <rect x="352" y="64" width="56" height="20" rx="4" fill="#141A23" />
        <text x="380" y="78" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#FFFFFF">
          액관
        </text>

        {/* 4 -> 1 (하강) */}
        <path d="M187 136 L187 172" stroke="#0F766E" strokeWidth="3" />
        <polygon points="187,180 181,170 193,170" fill="#0F766E" />
        <text x="198" y="162" fontSize="10" fontWeight="700" fill="#0F766E">
          저온 안개 분사
        </text>

        {/* 1 -> 2 (저압 가스관) */}
        <path d="M346 228 L404 228" stroke="#0F766E" strokeWidth="3" />
        <polygon points="412,228 402,222 402,234" fill="#0F766E" />
        <rect x="348" y="200" width="64" height="20" rx="4" fill="#141A23" />
        <text x="380" y="214" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#FFFFFF">
          가스관
        </text>

        {/* 2 -> 3 (상승) */}
        <path d="M573 182 L573 146" stroke="#E8521A" strokeWidth="3" />
        <polygon points="573,138 567,148 579,148" fill="#E8521A" />
        <text x="584" y="162" fontSize="10" fontWeight="700" fill="#C2410C">
          고온·고압 기체
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  8. 실외기 방수·내충격 단면 구조도 (9번 글)                          */
/* ------------------------------------------------------------------ */
function OutdoorUnitWeatherproofDiagram() {
  return (
    <DiagramFigure
      title="에어컨 실외기 내부 방수·방진 보호 구조와 고장 예외 위치"
      badgeLabel="실사 구조 · 방수 구역"
      caption="상판 겹침 지붕·수직 밀폐 전장함·방수 실링 팬모터·용접 밀폐 압축기가 빗물을 차단하지만, 위에서 고압수를 쏘거나 바닥 수위가 올라 침수되는 경우 및 루버창 닫힘 과열에는 취약합니다. 번호를 눌러 구조를 확인하세요."
    >
      <OutdoorUnitWeatherproofPhotoDiagram />
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  9. PCB 역할 및 4대 고장 원인 실사 + 핀 오버레이 (10번 글)             */
/* ------------------------------------------------------------------ */
function PcbFailureCausesDiagram() {
  return (
    <DiagramFigure
      title="실외기 인버터 PCB 실제 구조와 4대 손상 위치"
      badgeLabel="실사 구조 · 부위별 진단"
      caption="인버터 PCB는 좌측 전원·EMI·퓨즈(01), 중앙 대형 전해콘덴서(02), 알루미늄 방열판·IPM 모듈(03), 우측 제어 MCU·커넥터(04)로 나뉘며, 사진 위 번호나 카드를 누르면 해당 회로 구역을 확인할 수 있습니다."
    >
      <PcbPhotoFailureDiagram />
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  10. 천장형 vs 스탠드형 설치 공정·비용 비교 도해 (11번 글)             */
/* ------------------------------------------------------------------ */
function CeilingVsStandInstallDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="스탠드형 vs 천장형 에어컨 시공 구조·설치비 차이"
      caption="스탠드형은 바닥 거치 후 벽 타공·자연배수로 끝나지만, 천장형은 슬라브 행거 고정·배수펌프·천장 속 구배 배관과 마감 전후 2~3회 공정이 필요합니다."
    >
      <svg
        viewBox="0 0 760 278"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          스탠드형 에어컨의 바닥 설치 구조와 천장형 에어컨의 전산볼트 매립·드레인 펌프 시공 구조 비교
        </title>

        {/* 좌측: 스탠드형 */}
        <rect x="16" y="14" width="350" height="250" rx="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <text x="34" y="38" fontSize="13" fontWeight="700" fill="#141A23">
          일반 스탠드형 (설치 구조 단순 · 당일 완료)
        </text>

        {/* 도면 영역 */}
        <rect x="34" y="50" width="314" height="106" rx="8" fill="#FFFFFF" stroke="#E2E6EC" />
        {/* 바닥선 */}
        <line x1="48" y1="142" x2="334" y2="142" stroke="#64748B" strokeWidth="2" />
        {/* 스탠드 본체 */}
        <rect x="74" y="66" width="44" height="76" rx="4" fill="#E2E6EC" stroke="#141A23" strokeWidth="1.5" />
        <text x="96" y="106" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#141A23">
          실내기
        </text>
        {/* 직결 벽 타공 배관 + 자연배수 */}
        <path d="M118 128 L254 128" stroke="#1D4ED8" strokeWidth="3" />
        <line x1="176" y1="60" x2="176" y2="142" stroke="#94A3B8" strokeWidth="3" />
        <rect x="254" y="96" width="58" height="46" rx="4" fill="#FFF7ED" stroke="#E8521A" strokeWidth="1.5" />
        <text x="283" y="123" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#C2410C">
          실외기
        </text>
        <text x="220" y="114" textAnchor="middle" fontSize="9.5" fill="#1D4ED8">
          벽 타공 1회 직결 + 자연배수
        </text>

        {/* 스탠드 요약 3줄 */}
        <rect x="34" y="166" width="314" height="84" rx="8" fill="#FFFFFF" stroke="#E2E6EC" />
        <text x="48" y="186" fontSize="10.5" fontWeight="700" fill="#0F766E">
          • 작업 인원·시간: 1~2인 / 약 2~3시간 내외 당일 완료
        </text>
        <text x="48" y="208" fontSize="10.5" fill="#334155">
          • 고정·배수: 바닥 거치 + 호스 아래로 자연 낙차 배수
        </text>
        <text x="48" y="230" fontSize="10.5" fill="#334155">
          • 자재 추가: 기본 배관 초과 길이 정도만 계산
        </text>

        {/* 우측: 천장형 */}
        <rect x="394" y="14" width="350" height="250" rx="12" fill="#FFF4EE" stroke="#FDBA74" strokeWidth="1.5" />
        <text x="412" y="38" fontSize="13" fontWeight="700" fill="#C2410C">
          천장형 4Way·1Way (고난도 매립 · 2~3회 분할 공정)
        </text>

        {/* 도면 영역 */}
        <rect x="412" y="50" width="314" height="106" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        {/* 콘크리트 슬라브 */}
        <rect x="424" y="56" width="290" height="10" fill="#64748B" />
        <text x="570" y="64" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#FFFFFF">
          콘크리트 천장 슬라브 (앙카 · 전산볼트 4개 수평 매달기)
        </text>
        {/* 전산볼트 */}
        <line x1="472" y1="66" x2="472" y2="86" stroke="#141A23" strokeWidth="2" />
        <line x1="538" y1="66" x2="538" y2="86" stroke="#141A23" strokeWidth="2" />
        {/* 텍스/석고 천장면 */}
        <line x1="424" y1="106" x2="454" y2="106" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 2" />
        <line x1="556" y1="106" x2="714" y2="106" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 2" />
        {/* 매립 천장형 본체 */}
        <rect x="454" y="84" width="102" height="30" rx="3" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.5" />
        <text x="505" y="103" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1D4ED8">
          매립 본체 + 펌프
        </text>
        {/* 상승 후 구배 배수관 & 냉매관 */}
        <path d="M556 92 L582 76 L706 86" fill="none" stroke="#E8521A" strokeWidth="2.5" />
        <text x="640" y="74" textAnchor="middle" fontSize="9" fontWeight="700" fill="#C2410C">
          펌프 양정 + 경사(구배) 배관
        </text>
        <text x="570" y="142" textAnchor="middle" fontSize="9.5" fill="#475569">
          천장 타공 · 질소 용접 · 기밀 검사 · 마감 후 패널 조립
        </text>

        {/* 천장형 요약 3줄 */}
        <rect x="412" y="166" width="314" height="84" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="426" y="186" fontSize="10.5" fontWeight="700" fill="#C2410C">
          • 공정 횟수: 선배관(마감 전) + 패널·시운전(마감 후) 분할 방문
        </text>
        <text x="426" y="208" fontSize="10.5" fill="#334155">
          • 필수 공종: 천장 절개·보강, 드레인 펌프·PVC 구배, 누수 테스트
        </text>
        <text x="426" y="230" fontSize="10.5" fill="#334155">
          • 자재·위험: 장거리 동배관 용접 + 차단기 전용선 + 고소 사다리 작업
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  11. 냉난방기 제상 기능 & 길가 실외기 빙판 사고 도해 (12번 글)         */
/* ------------------------------------------------------------------ */
function DefrostCycleWalkwayDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="겨울 난방 '제상 운전' 원리와 길가 실외기 빙판·수증기 위험"
      caption="겨울철 냉난방기는 실외기에 얼어붙은 성에를 주기적으로 녹여(제상) 배출하므로 보행로에 바로 닿으면 빙판 낙상 사고와 화재 오인 신고가 발생합니다."
    >
      <svg
        viewBox="0 0 760 278"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          냉난방기 겨울 제상 운전 3단계와 길가 설치 시 제상수 결빙, 수증기 오인 신고, 안전한 설치 기준 도해
        </title>

        {/* 상단 3단계 흐름 */}
        <rect x="16" y="12" width="226" height="84" rx="10" fill="#EFF6FF" stroke="#93C5FD" />
        <text x="129" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1D4ED8">
          1. 겨울 난방 운전 (역순환)
        </text>
        <text x="129" y="54" textAnchor="middle" fontSize="10" fill="#334155">
          실내에 따뜻한 바람을 보내고
        </text>
        <text x="129" y="72" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1D4ED8">
          실외기는 냉동고처럼 영하로 냉각
        </text>

        <path d="M248 54 L262 54" stroke="#64748B" strokeWidth="2" />
        <polygon points="266,54 259,49 259,59" fill="#64748B" />

        <rect x="268" y="12" width="224" height="84" rx="10" fill="#F8FAFC" stroke="#94A3B8" />
        <text x="380" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          2. 실외기 알루미늄 핀 성에 결빙
        </text>
        <text x="380" y="54" textAnchor="middle" fontSize="10" fill="#334155">
          공기 중 수분이 실외기 핀에 얼어붙음
        </text>
        <text x="380" y="72" textAnchor="middle" fontSize="10" fontWeight="700" fill="#DC2626">
          얼음이 바람을 막으면 난방 급락
        </text>

        <path d="M498 54 L512 54" stroke="#64748B" strokeWidth="2" />
        <polygon points="516,54 509,49 509,59" fill="#64748B" />

        <rect x="518" y="12" width="226" height="84" rx="10" fill="#FFF4EE" stroke="#E8521A" />
        <text x="631" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="#C2410C">
          3. 자동 제상 운전 (성에 녹이기)
        </text>
        <text x="631" y="54" textAnchor="middle" fontSize="10" fill="#334155">
          실내기 잠시 멈추고 뜨거운 열을 역전
        </text>
        <text x="631" y="72" textAnchor="middle" fontSize="10" fontWeight="700" fill="#C2410C">
          다량의 물(제상수) + 흰 김 배출
        </text>

        {/* 하단 좌측: 길가 현장 위험 도해 */}
        <rect x="16" y="112" width="448" height="152" rx="12" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="32" y="134" fontSize="12" fontWeight="700" fill="#DC2626">
          길가 저층 무단 설치 시 실제 사고 · 민원 유형
        </text>

        {/* 건물 벽 & 보행로 단면 */}
        <rect x="30" y="146" width="28" height="92" fill="#CBD5E1" />
        <rect x="58" y="168" width="96" height="62" rx="6" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <text x="106" y="202" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#141A23">
          길가 실외기
        </text>

        {/* 수증기 표현 */}
        <path d="M84 162 Q78 148 90 144 M112 162 Q106 146 118 142 M138 162 Q132 148 144 144" fill="none" stroke="#94A3B8" strokeWidth="2" />
        <text x="230" y="160" fontSize="10" fontWeight="700" fill="#475569">
          하얀 수증기 → 행인이 &quot;불났다&quot; 119 오인 신고
        </text>

        {/* 바닥 빙판 */}
        <line x1="28" y1="238" x2="444" y2="238" stroke="#475569" strokeWidth="2" />
        <rect x="96" y="232" width="220" height="12" rx="4" fill="#93C5FD" opacity="0.85" />
        <path d="M106 230 L106 238 M126 230 L126 238" stroke="#1D4ED8" strokeWidth="2" />
        <text x="220" y="204" fontSize="10.5" fontWeight="700" fill="#DC2626">
          영하 날씨 제상수 인도 결빙 → 보행자 빙판 낙상!
        </text>
        <text x="220" y="222" fontSize="9.5" fill="#7F1D1D">
          행인 부상 시 점주 손해배상 · 구청 민원 시정명령
        </text>

        {/* 하단 우측: 필수 예방 수칙 */}
        <rect x="478" y="112" width="266" height="152" rx="12" fill="#F0FDFA" stroke="#5EEAD4" />
        <text x="494" y="134" fontSize="12" fontWeight="700" fill="#0F766E">
          실외기 설치 시 필수 안전 수칙
        </text>
        <text x="494" y="160" fontSize="10.5" fontWeight="700" fill="#141A23">
          1. 통행로 피한 건물 측면 · 옥상 배치
        </text>
        <text x="494" y="178" fontSize="10" fill="#334155">
          보행자 길에 부득이 접할 시 2m 이상 높임
        </text>
        <text x="494" y="204" fontSize="10.5" fontWeight="700" fill="#141A23">
          2. 하부 드레인 엘보 + 호스 하수구 직결
        </text>
        <text x="494" y="222" fontSize="10" fill="#334155">
          (단, 긴 호스 끝이 얼지 않게 경사·보온 마감)
        </text>
        <text x="494" y="246" fontSize="10" fontWeight="700" fill="#0F766E">
          3. 열풍·냉풍 직접 차단 에어가이드 설치
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  12. 정속형 vs 인버터 운전 출력 그래프 비교 도해 (13번 글)             */
/* ------------------------------------------------------------------ */
function FixedSpeedVsInverterDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="정속형(ON/OFF) vs 인버터(주파수 가변) 콤프레샤 출력 비교"
      caption="정속형은 100% 정지·가동을 반복해 부품이 단순·저렴하고, 인버터는 저속 유지로 전기세를 줄이는 대신 실외기 제어 보드 비중이 큽니다."
    >
      <svg
        viewBox="0 0 760 274"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          정속형 에어컨과 인버터 에어컨의 시간에 따른 콤프레샤 출력 변화 및 장단점 비교
        </title>

        {/* 좌측: 정속형 */}
        <rect x="16" y="14" width="350" height="246" rx="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <text x="34" y="38" fontSize="13" fontWeight="700" fill="#141A23">
          정속형 (무조건 0% 또는 100% 직진)
        </text>

        {/* 그래프 박스 */}
        <rect x="34" y="50" width="314" height="114" rx="8" fill="#FFFFFF" stroke="#E2E6EC" />
        <line x1="62" y1="64" x2="62" y2="148" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="62" y1="148" x2="332" y2="148" stroke="#94A3B8" strokeWidth="1.5" />
        <text x="56" y="76" textAnchor="end" fontSize="9" fill="#64748B">
          100%
        </text>
        <text x="56" y="148" textAnchor="end" fontSize="9" fill="#64748B">
          0%
        </text>
        {/* 사각파 */}
        <path
          d="M66 76 L132 76 L132 144 L182 144 L182 76 L246 76 L246 144 L296 144 L296 76 L326 76"
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="3"
        />
        <text x="198" y="106" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1D4ED8">
          켜짐(100%) / 꺼짐(0%) 반복
        </text>
        <text x="328" y="160" textAnchor="end" fontSize="9" fill="#64748B">
          운전 시간 →
        </text>

        <rect x="34" y="174" width="314" height="74" rx="8" fill="#FFFFFF" stroke="#E2E6EC" />
        <text x="48" y="194" fontSize="10.5" fontWeight="700" fill="#0F766E">
          장점: 회로 단순 · 고장률 낮고 부품 싸며 당일 현장 수리 유리
        </text>
        <text x="48" y="214" fontSize="10.5" fill="#DC2626">
          단점: 기동 시마다 큰 전류 · 하루 종일 틀면 전기요금 높음
        </text>
        <text x="48" y="234" fontSize="10" fill="#475569">
          추천: 창고·짧은 시간 가동 작업실 · 단순 내구성 중시 업장
        </text>

        {/* 우측: 인버터 */}
        <rect x="394" y="14" width="350" height="246" rx="12" fill="#FFF4EE" stroke="#FDBA74" strokeWidth="1.5" />
        <text x="412" y="38" fontSize="13" fontWeight="700" fill="#C2410C">
          인버터 (20~120% 가변 속도 저속 유지)
        </text>

        {/* 그래프 박스 */}
        <rect x="412" y="50" width="314" height="114" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <line x1="440" y1="64" x2="440" y2="148" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="440" y1="148" x2="710" y2="148" stroke="#94A3B8" strokeWidth="1.5" />
        <text x="434" y="76" textAnchor="end" fontSize="9" fill="#64748B">
          100%
        </text>
        <text x="434" y="122" textAnchor="end" fontSize="9" fill="#0F766E">
          유지
        </text>
        {/* 부드러운 감속 유지 곡선 */}
        <path
          d="M444 74 C480 74, 496 116, 536 122 L704 124"
          fill="none"
          stroke="#E8521A"
          strokeWidth="3"
        />
        <text x="612" y="110" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#C2410C">
          설정온도 도달 후 저속(30%) 정속 유지
        </text>
        <text x="706" y="160" textAnchor="end" fontSize="9" fill="#64748B">
          운전 시간 →
        </text>

        <rect x="412" y="174" width="314" height="74" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="426" y="194" fontSize="10.5" fontWeight="700" fill="#0F766E">
          장점: 하루 4시간 이상 연속 가동 시 전기세 절감 · 정숙한 운전
        </text>
        <text x="426" y="214" fontSize="10.5" fill="#DC2626">
          단점: 고집적 실외기 PCB 의존 · 보드 단가·성수기 수리 대기 높음
        </text>
        <text x="426" y="234" fontSize="10" fill="#475569">
          추천: 가정집 거실·카페·사무실 등 장시간 켜두는 상시 공간
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  13. 냉장고 냉동실 정상 · 냉장실 미지근 원인 단면 도해 (14번 글)      */
/* ------------------------------------------------------------------ */
function FridgeFreezerAirflowDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="냉동실은 얼어있는데 냉장실만 안 시원한 이유 (덕트 결빙 단면)"
      caption="냉장고는 대부분 냉동실 뒤판에서 만든 영하의 바람을 통로(덕트)와 팬으로 냉장실에 나눠 보내기 때문에 제상이 안 되면 냉장실부터 미지근해집니다."
    >
      <svg
        viewBox="0 0 760 278"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          정상 작동 시 냉기 순환과 증발기 성에 막힘 시 냉장실 온도 상승 단면 비교 도해
        </title>

        {/* 좌측: 정상 순환 */}
        <rect x="16" y="14" width="350" height="250" rx="12" fill="#F0FDFA" stroke="#5EEAD4" strokeWidth="1.5" />
        <text x="34" y="38" fontSize="12.5" fontWeight="700" fill="#0F766E">
          정상 순환 (제상 정상 · 바람길 열림)
        </text>

        <rect x="44" y="54" width="134" height="170" rx="8" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <line x1="44" y1="126" x2="178" y2="126" stroke="#141A23" strokeWidth="1.5" />
        <text x="111" y="76" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1D4ED8">
          냉동실 (-18℃)
        </text>
        <text x="111" y="96" textAnchor="middle" fontSize="9.5" fill="#475569">
          냉각기 + 송풍팬
        </text>
        <path d="M111 104 L111 154" stroke="#0F766E" strokeWidth="3" />
        <polygon points="111,162 105,152 117,152" fill="#0F766E" />
        <text x="111" y="182" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0F766E">
          냉장실 (+3℃)
        </text>
        <text x="111" y="202" textAnchor="middle" fontSize="9.5" fill="#475569">
          덕트로 찬바람 통과
        </text>

        <rect x="192" y="54" width="158" height="170" rx="8" fill="#FFFFFF" stroke="#CCFBF1" />
        <text x="204" y="78" fontSize="11" fontWeight="700" fill="#141A23">
          정상 제상 사이클
        </text>
        <text x="204" y="102" fontSize="10" fill="#334155">
          1. 냉각기에서 찬바람 생성
        </text>
        <text x="204" y="124" fontSize="10" fill="#334155">
          2. 8~12시간마다 히터가
        </text>
        <text x="204" y="140" fontSize="10" fill="#334155">
          성애를 자동 녹여 배출
        </text>
        <text x="204" y="166" fontSize="10" fontWeight="700" fill="#0F766E">
          3. 바람 통로가 막히지 않아
        </text>
        <text x="204" y="184" fontSize="10" fontWeight="700" fill="#0F766E">
          상·하칸 모두 일정 냉각
        </text>

        {/* 우측: 제상 고장 */}
        <rect x="394" y="14" width="350" height="250" rx="12" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.5" />
        <text x="412" y="38" fontSize="12.5" fontWeight="700" fill="#DC2626">
          고장 진행 (성애 얼음 막힘 · 냉장실 미지근)
        </text>

        <rect x="422" y="54" width="134" height="170" rx="8" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <line x1="422" y1="126" x2="556" y2="126" stroke="#141A23" strokeWidth="1.5" />
        <text x="489" y="76" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1D4ED8">
          냉동실 (-18℃ 유지)
        </text>
        <rect x="444" y="100" width="90" height="24" rx="4" fill="#93C5FD" />
        <text x="489" y="116" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1E3A8A">
          얼음 성에 통로 폐쇄
        </text>
        <text x="489" y="180" textAnchor="middle" fontSize="11" fontWeight="700" fill="#DC2626">
          냉장실 (+12℃ 이상)
        </text>
        <text x="489" y="200" textAnchor="middle" fontSize="9.5" fill="#DC2626">
          바람 안 넘어와 음식 상함
        </text>

        <rect x="570" y="54" width="158" height="170" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="582" y="78" fontSize="11" fontWeight="700" fill="#DC2626">
          3대 핵심 고장 부위
        </text>
        <text x="582" y="104" fontSize="10" fill="#334155">
          • 제상 히터 / 온도 퓨즈 단선
        </text>
        <text x="582" y="126" fontSize="10" fill="#334155">
          • 송풍 팬모터 얼어 고착
        </text>
        <text x="582" y="148" fontSize="10" fill="#334155">
          • 문짝 패킹 뜸(습기 유입)
        </text>
        <text x="582" y="178" fontSize="10" fontWeight="700" fill="#C2410C">
          코드 빼고 24h 녹인 뒤 재발 시
        </text>
        <text x="582" y="196" fontSize="10" fontWeight="700" fill="#C2410C">
          부품 고장 (수리/교체 검토)
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  14. 통돌이·드럼 중고 직거래 함정 vs 분해세척 도해 (15번 글)         */
/* ------------------------------------------------------------------ */
function WasherTubInspectionDiagram() {
  return (
    <DiagramFigure
      title="중고 세탁기 구매 전 손으로 확인하는 3대 핵심 점검 위치"
      badgeLabel="실사 점검 · 직거래 체크"
      caption={`${STORE.name} 출고 매물은 내·외조 고압세척 및 급수·탈수·배수 부하 시운전을 거쳐 출고됩니다. 개인 직거래나 매장 방문 시 도어 고무패킹(01), 세탁조·베어링 유격(02), 배수펌프 거름망(03)을 직접 눌러 확인하세요.`}
    >
      <WasherInspectionPhotoDiagram />
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  15. 냉장고 눕혀 운반 금지 & 오일 역류 안정 도해 (16번 글)            */
/* ------------------------------------------------------------------ */
function FridgeTiltOilReturnDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="냉장고를 눕혀 옮기면 안 되는 이유 (컴프레서 오일 역류 원리)"
      caption="하단 압축기 내부에 담긴 냉동 오일이 배관으로 역류한 상태에서 바로 전원을 켜면 압축기 윤활 부족·손상으로 수명이 급감합니다."
    >
      <svg
        viewBox="0 0 760 250"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          냉장고를 수직으로 운반할 때와 눕혀서 운반할 때 컴프레서 오일 역류 차이 도해
        </title>

        {/* 좌측: 눕혀 운반 */}
        <rect x="16" y="14" width="350" height="222" rx="12" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.5" />
        <text x="34" y="38" fontSize="12.5" fontWeight="700" fill="#DC2626">
          X. 승용차·SUV에 눕혀서 운반 시
        </text>

        {/* 눕혀진 냉장고 모식도 */}
        <rect x="52" y="64" width="166" height="68" rx="6" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <circle cx="82" cy="98" r="18" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
        <text x="82" y="102" textAnchor="middle" fontSize="9" fontWeight="700" fill="#DC2626">
          압축기
        </text>
        <path d="M100 92 L198 92" stroke="#DC2626" strokeWidth="4" strokeDasharray="6 3" />
        <text x="152" y="84" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#DC2626">
          오일이 냉매 배관으로 역류!
        </text>

        <rect x="34" y="148" width="314" height="72" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="48" y="168" fontSize="10.5" fontWeight="700" fill="#DC2626">
          바로 전원 꽂으면 오일 없이 가동 → 콤프레샤 손상
        </text>
        <text x="48" y="188" fontSize="10" fill="#334155">
          • 내부 선반·도어 힌지 파손 및 외관 찌그러짐 동반
        </text>
        <text x="48" y="206" fontSize="10" fontWeight="700" fill="#C2410C">
          • 부득이 눕혔다면 세운 뒤 최소 12~24시간 대기 후 통전
        </text>

        {/* 우측: 수직 운반 */}
        <rect x="394" y="14" width="350" height="222" rx="12" fill="#F0FDFA" stroke="#5EEAD4" strokeWidth="1.5" />
        <text x="412" y="38" fontSize="12.5" fontWeight="700" fill="#0F766E">
          O. 탑차 수직 세워 운반 (직영 기사 운반 표준)
        </text>

        {/* 세워진 냉장고 모식도 */}
        <rect x="444" y="54" width="68" height="106" rx="6" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <circle cx="478" cy="134" r="16" fill="#CCFBF1" stroke="#0F766E" strokeWidth="1.5" />
        <text x="478" y="138" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0F766E">
          오일 바닥
        </text>
        <text x="530" y="92" fontSize="10.5" fontWeight="700" fill="#0F766E">
          오일이 컴프레서 바닥에
        </text>
        <text x="530" y="110" fontSize="10.5" fontWeight="700" fill="#0F766E">
          안정적으로 유지됨
        </text>
        <text x="530" y="132" fontSize="10" fill="#475569">
          (계단 이동 시 45도 이하 살짝 기울임)
        </text>

        <rect x="412" y="168" width="314" height="52" rx="8" fill="#FFFFFF" stroke="#CCFBF1" />
        <text x="426" y="188" fontSize="10.5" fontWeight="700" fill="#0F766E">
          설치 후 약 2~3시간(겨울 3~4시간) 안정 뒤 가동 권장
        </text>
        <text x="426" y="206" fontSize="10" fill="#334155">
          수평 맞추고 정격 콘센트 단독 연결 (멀티탭 과열 금지)
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  16. 업소용 45박스 직냉식 vs 간냉식 & 주방 배치 도해 (17번 글)       */
/* ------------------------------------------------------------------ */
function Commercial45BoxCoolingDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="업소용 45박스 직냉식 vs 간냉식 내부 단면도 & 주방 응축기·화구 배치 기준"
      caption="직냉식은 내벽 동관이 조용히 식혀 수분 보존에 유리하고, 간냉식은 송풍팬 순환으로 문 여닫음이 잦은 주방에 적합합니다. 상부 응축기 청소와 화구 50cm 이격이 공통 관리 기준입니다."
    >
      <svg
        viewBox="0 0 760 296"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[560px] h-auto select-none"
      >
        <title id={titleId}>
          업소용 45박스 직냉식과 간냉식의 내부 냉각 단면도 및 상부 기계실·화구 이격 배치 도해
        </title>

        {/* 좌측: 직냉식 단면 */}
        <rect x="16" y="14" width="350" height="186" rx="12" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
        <text x="32" y="36" fontSize="12" fontWeight="700" fill="#1D4ED8">
          1. 직냉식 45박스 (내벽 동관 자연대류)
        </text>
        {/* 45박스 미니 단면 */}
        <rect x="30" y="48" width="96" height="136" rx="4" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <rect x="30" y="48" width="96" height="24" fill="#1E293B" />
        <text x="78" y="64" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#FFFFFF">
          상부 기계실
        </text>
        {/* 내벽 동관 코일 표시 */}
        <path d="M36 82 L36 174 M120 82 L120 174 M36 124 L120 124" stroke="#1D4ED8" strokeWidth="3" strokeDasharray="4 2" />
        <text x="78" y="108" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1D4ED8">
          내벽 직접냉각
        </text>
        <text x="78" y="156" textAnchor="middle" fontSize="8.5" fill="#475569">
          자연 대류 (바람 X)
        </text>

        <text x="138" y="68" fontSize="10" fontWeight="700" fill="#0F766E">
          장점: 식재료 수분 덜 마름
        </text>
        <text x="138" y="88" fontSize="9.5" fill="#334155">
          • 구조 단순, 부품 고장률 낮음
        </text>
        <text x="138" y="108" fontSize="9.5" fill="#DC2626">
          • 단점: 냉동칸 벽면 성에 누적
        </text>
        <text x="138" y="128" fontSize="9.5" fill="#334155">
          • 다이얼 강냉 시 냉장칸 얼 수 있음
        </text>
        <rect x="138" y="144" width="214" height="36" rx="6" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="245" y="166" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1D4ED8">
          적합: 정육 · 반찬 보관 · 조용한 주방
        </text>

        {/* 우측: 간냉식 단면 */}
        <rect x="394" y="14" width="350" height="186" rx="12" fill="#FFF4EE" stroke="#FDBA74" strokeWidth="1.5" />
        <text x="410" y="36" fontSize="12" fontWeight="700" fill="#C2410C">
          2. 간냉식 45박스 (송풍팬 강제순환)
        </text>
        {/* 45박스 미니 단면 */}
        <rect x="408" y="48" width="96" height="136" rx="4" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <rect x="408" y="48" width="96" height="24" fill="#1E293B" />
        <text x="456" y="64" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#FFFFFF">
          응축기 + 팬
        </text>
        <rect x="418" y="76" width="76" height="18" rx="3" fill="#FFF7ED" stroke="#E8521A" />
        <text x="456" y="88" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#C2410C">
          증발기 팬+히터
        </text>
        <path d="M432 98 L432 172 M456 98 L456 172 M480 98 L480 172" stroke="#E8521A" strokeWidth="2" strokeDasharray="3 2" />
        <text x="456" y="142" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#C2410C">
          강제 냉기순환
        </text>

        <text x="516" y="68" fontSize="10" fontWeight="700" fill="#0F766E">
          장점: 자동제상 · 온도 회복 빠름
        </text>
        <text x="516" y="88" fontSize="9.5" fill="#334155">
          • 위아래 칸 온도 편차 거의 없음
        </text>
        <text x="516" y="108" fontSize="9.5" fill="#DC2626">
          • 팬 앞 적재물로 막히면 냉기 차단
        </text>
        <text x="516" y="128" fontSize="9.5" fill="#334155">
          • 식재료 랩·밀폐용기 보관 권장
        </text>
        <rect x="516" y="144" width="214" height="36" rx="6" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="623" y="166" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#C2410C">
          적합: 회전 빠른 식당 · 카페 · 주점
        </text>

        {/* 하단 주방 배치 안전 치수 도면 */}
        <rect x="16" y="212" width="728" height="72" rx="10" fill="#141A23" />
        <text x="32" y="234" fontSize="11.5" fontWeight="700" fill="#FF8A50">
          주방 설치 치수 및 청소 수칙 (여름철 콤프레샤 과열 차단 예방)
        </text>
        <text x="32" y="254" fontSize="10.5" fill="#FFFFFF">
          1) 가스화구·튀김기에서 50cm 이상 이격 (불가 시 스텐 열차단판)   2) 45박스 천장 위 박스·적재물 금지(상부 배기 확보)
        </text>
        <text x="32" y="272" fontSize="10.5" fill="#A7F3D0">
          3) 상단(테이블형은 하단 측면) 응축기 핀코일 기름먼지 월 1회 결 방향 솔질 청소
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  17. 제빙기 얼음 안 얼 때 4대 원인 도해 (18번 글)                      */
/* ------------------------------------------------------------------ */
function IcemakerHeatRejectionDiagram() {
  return (
    <DiagramFigure
      badgeLabel="실사 점검 · 업소용 제빙기"
      title="업소용 언더카운터 제빙기 내부 단면과 제빙 불량 4대 점검 포인트"
      caption="얼음이 얇거나 안 얼 때는 상부 제빙판·노즐 스케일(①), 하단 응축기 먼지 망 막힘(②), 콤프레샤 매립 열기 과열(③), 우측 직수 필터·배수 역류(④) 순서로 점검해야 합니다."
    >
      <IcemakerCleaningPhotoDiagram />
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  18. 업소용 식기세척기 3대 필수 인프라 도해 (19번 글)                  */
/* ------------------------------------------------------------------ */
function CommercialDishwasherSetupDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="업소용 도어형 식기세척기 주방 배관 · 전기 · 배수 구배 입면 배치도"
      caption="애벌 싱크대 옆에 배치하되 50~80L 온수기(60℃+), 20~30A 단독 누전차단기(4SQ 배선), 본체 배수구보다 낮은 바닥 트렌치(구배)가 함께 준비돼야 역류 없이 가동됩니다."
    >
      <svg
        viewBox="0 0 760 288"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[560px] h-auto select-none"
      >
        <title id={titleId}>
          업소용 식기세척기 작업 동선 및 온수기, 전용 차단기, 세제 펌프, 바닥 트렌치 자연배수 경사 입면도
        </title>

        {/* 주방 바닥 기준선 */}
        <line x1="16" y1="224" x2="744" y2="224" stroke="#475569" strokeWidth="2.5" />
        {/* 바닥 트렌치 (움푹 파인 배수구) */}
        <path d="M402 224 L402 246 L486 246 L486 224" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2" />
        <text x="444" y="262" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1D4ED8">
          바닥 트렌치 배수구 (본체 출구보다 낮아야 함)
        </text>

        {/* 상단/좌측 설비 1: 전용 온수기 */}
        <rect x="24" y="24" width="118" height="72" rx="8" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.5" />
        <text x="83" y="46" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1D4ED8">
          1. 온수기 (50~80L)
        </text>
        <text x="83" y="64" textAnchor="middle" fontSize="9" fill="#334155">
          60도+ 온수 상시 공급
        </text>
        <text x="83" y="80" textAnchor="middle" fontSize="9" fill="#1D4ED8">
          수압 약하면 가압펌프
        </text>
        {/* 온수 배관 */}
        <path d="M142 60 L290 60 L290 120" fill="none" stroke="#1D4ED8" strokeWidth="3" />

        {/* 좌측 설비 2: 전용 분전함 차단기 */}
        <rect x="164" y="24" width="112" height="58" rx="6" fill="#FFF7ED" stroke="#E8521A" strokeWidth="1.5" />
        <text x="220" y="45" textAnchor="middle" fontSize="10" fontWeight="700" fill="#C2410C">
          2. 단독 차단기 30A
        </text>
        <text x="220" y="62" textAnchor="middle" fontSize="9" fill="#334155">
          4SQ 단독 배선 (멀티탭X)
        </text>
        <path d="M276 54 L318 54 L318 82" fill="none" stroke="#E8521A" strokeWidth="2.5" strokeDasharray="4 2" />

        {/* 애벌 세척 싱크대 (좌측) */}
        <rect x="30" y="138" width="218" height="86" rx="4" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
        <text x="139" y="172" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          애벌 싱크대 (인입 동선)
        </text>
        <text x="139" y="192" textAnchor="middle" fontSize="9.5" fill="#475569">
          음식물 찌꺼기 사전 헹굼 후 랙 투입
        </text>

        {/* 중앙: 도어형 식기세척기 본체 */}
        <rect x="262" y="82" width="132" height="142" rx="6" fill="#141A23" />
        <rect x="274" y="94" width="108" height="62" rx="4" fill="#1E293B" stroke="#94A3B8" />
        <text x="328" y="120" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
          도어형 세척기
        </text>
        <text x="328" y="138" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#FF8A50">
          헹굼 80℃+ / 3.5~5.5kW
        </text>
        {/* 하부 배수구 -> 트렌치 자연낙하 */}
        <path d="M366 206 L418 234" fill="none" stroke="#0F766E" strokeWidth="4" />
        <circle cx="366" cy="206" r="5" fill="#0F766E" />
        <text x="328" y="182" textAnchor="middle" fontSize="9" fill="#CBD5E1">
          자연배수 출구(바닥+15cm)
        </text>

        {/* 우측: 건조 작업대 + 세제/린스 공급기 */}
        <rect x="408" y="138" width="150" height="86" rx="4" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
        <text x="483" y="172" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#141A23">
          건조 인출대 (500×500랙)
        </text>
        <text x="483" y="192" textAnchor="middle" fontSize="9.5" fill="#475569">
          식기 반출 · 자연 건조
        </text>

        {/* 세제/린스 자동 공급기 */}
        <rect x="574" y="114" width="166" height="110" rx="8" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.5" />
        <text x="657" y="138" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#065F46">
          3. 세제·린스 공급기 호스
        </text>
        <rect x="594" y="156" width="48" height="52" rx="4" fill="#FFFFFF" stroke="#0F766E" />
        <text x="618" y="186" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0F766E">
          세제
        </text>
        <rect x="668" y="156" width="48" height="52" rx="4" fill="#FFFFFF" stroke="#1D4ED8" />
        <text x="692" y="186" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1D4ED8">
          린스
        </text>
        <path d="M594 166 L394 166" stroke="#0F766E" strokeWidth="2" strokeDasharray="3 2" />

        {/* 우측 상단 요약 박스 */}
        <rect x="412" y="24" width="328" height="72" rx="8" fill="#FFFBF7" stroke="#FDBA74" />
        <text x="428" y="46" fontSize="10.5" fontWeight="700" fill="#C2410C">
          설치 전 필수 확인 체크 (벽 배수구 역류 방지)
        </text>
        <text x="428" y="64" fontSize="9.5" fill="#334155">
          • 펌프 미내장 자연배수 모델은 벽 배수구 연결 불가
        </text>
        <text x="428" y="80" fontSize="9.5" fill="#334155">
          • 벽 높이가 높다면 받침대(스탠드) 보강 또는 배수펌프형 선택
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  19. 에어컨 냉매(가스) 소모품 오해 & 3대 누설 지점 도해 (20번 글)      */
/* ------------------------------------------------------------------ */
function RefrigerantLeakMythDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="에어컨 냉매 배관 누설 지점"
      caption="가스가 줄었다면 어딘가 미세하게 새는 부위가 있다는 신호이므로, 누설 부위를 잡지 않고 충전만 반복하면 오일이 말라 컴프레샤가 손상됩니다."
    >
      <svg
        viewBox="0 0 760 250"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          에어컨 폐쇄 냉매 배관에서 냉매 누설이 발생하는 연결 너트, 배관 꺾임, 서비스 밸브 코어 3곳 도해
        </title>

        {/* 상단 사실 배너 */}
        <rect x="16" y="12" width="728" height="44" rx="8" fill="#141A23" />
        <text x="380" y="39" textAnchor="middle" fontSize="12" fontWeight="700" fill="#FFFFFF">
          밀폐 배관이 온전하면 냉매는 자연 소모되지 않습니다 (냉매 부족 = 어딘가 누설 발생)
        </text>

        {/* 배관 연결 흐름도 */}
        <rect x="24" y="76" width="144" height="82" rx="10" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.5" />
        <text x="96" y="114" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1D4ED8">
          실내기
        </text>
        <text x="96" y="134" textAnchor="middle" fontSize="9.5" fill="#475569">
          내부 동관 용접부
        </text>

        <line x1="168" y1="117" x2="592" y2="117" stroke="#64748B" strokeWidth="6" />

        <rect x="592" y="76" width="144" height="82" rx="10" fill="#FFF7ED" stroke="#E8521A" strokeWidth="1.5" />
        <text x="664" y="114" textAnchor="middle" fontSize="12" fontWeight="700" fill="#C2410C">
          실외기
        </text>
        <text x="664" y="134" textAnchor="middle" fontSize="9.5" fill="#475569">
          서비스 밸브 포트
        </text>

        {/* 누설 지점 3곳 핀 */}
        <circle cx="220" cy="117" r="9" fill="#DC2626" />
        <circle cx="380" cy="117" r="9" fill="#DC2626" />
        <circle cx="566" cy="117" r="9" fill="#DC2626" />

        <rect x="16" y="172" width="232" height="66" rx="8" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="132" y="194" textAnchor="middle" fontSize="11" fontWeight="700" fill="#DC2626">
          ① 플레어 너트 나사산 풀림·균열
        </text>
        <text x="132" y="216" textAnchor="middle" fontSize="10" fill="#334155">
          이전·재설치 시 나팔 가공 불량 · 진동 풀림
        </text>

        <rect x="264" y="172" width="232" height="66" rx="8" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="380" y="194" textAnchor="middle" fontSize="11" fontWeight="700" fill="#DC2626">
          ② 동배관 꺾임 · 알루미늄 연결 부식
        </text>
        <text x="380" y="216" textAnchor="middle" fontSize="10" fill="#334155">
          외벽 노출 배관 크랙 또는 저가 혼합배관 산화
        </text>

        <rect x="512" y="172" width="232" height="66" rx="8" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="628" y="194" textAnchor="middle" fontSize="11" fontWeight="700" fill="#DC2626">
          ③ 실외기 서비스 밸브 코어 미세 누설
        </text>
        <text x="628" y="216" textAnchor="middle" fontSize="10" fill="#334155">
          주입구 고무패킹(무시핀) 경화로 조금씩 새어나감
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  20. 공간 환경별 적정 에어컨 평형 보정 공식 도해 (21번 글)             */
/* ------------------------------------------------------------------ */
function AirconPyeongSizingDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="똑같은 '실평수 20평(66㎡)'인데 환경별로 필요한 에어컨 평형 차이"
      caption="바닥 면적만 보고 평형에 딱 맞춰 사면 남향 통유리 카페나 화구 열기가 있는 식당은 한여름 내내 실내가 미지근해집니다."
    >
      <svg
        viewBox="0 0 760 256"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          전용 20평 공간에서 일반 가정 사무실, 남향 통유리 카페, 불 쓰는 식당·높은 천장별 권장 에어컨 평형 막대 도해
        </title>

        <text x="20" y="34" fontSize="12.5" fontWeight="700" fill="#141A23">
          기준 공간: 바닥 실평수 20평 (66㎡) 기준 실제 권장 냉방 평형 비교
        </text>

        {/* Row 1 */}
        <rect x="20" y="54" width="210" height="46" rx="8" fill="#F8FAFC" stroke="#CBD5E1" />
        <text x="34" y="74" fontSize="11" fontWeight="700" fill="#141A23">
          1. 일반 가정 · 사무실 (×1.0)
        </text>
        <text x="34" y="91" fontSize="9.5" fill="#475569">
          천고 2.4m 이하 · 직사광선 적은 공간
        </text>
        <rect x="246" y="64" width="210" height="26" rx="6" fill="#0F766E" />
        <text x="468" y="82" fontSize="11.5" fontWeight="700" fill="#0F766E">
          18 ~ 23평형 (단상 220V 가능)
        </text>

        {/* Row 2 */}
        <rect x="20" y="114" width="210" height="46" rx="8" fill="#EFF6FF" stroke="#93C5FD" />
        <text x="34" y="134" fontSize="11" fontWeight="700" fill="#1D4ED8">
          2. 통유리 카페 · 오픈 문 상가 (×1.4)
        </text>
        <text x="34" y="151" fontSize="9.5" fill="#475569">
          서향·남향 햇빛 · 커피머신 열기 유입
        </text>
        <rect x="246" y="124" width="300" height="26" rx="6" fill="#1D4ED8" />
        <text x="558" y="142" fontSize="11.5" fontWeight="700" fill="#1D4ED8">
          28 ~ 32평형 권장
        </text>

        {/* Row 3 */}
        <rect x="20" y="174" width="210" height="54" rx="8" fill="#FFF4EE" stroke="#FDBA74" />
        <text x="34" y="194" fontSize="11" fontWeight="700" fill="#C2410C">
          3. 고깃집·화구 식당 · 높은 천장 (×1.7)
        </text>
        <text x="34" y="212" fontSize="9.5" fill="#475569">
          천고 3.5m+ 또는 가스불·튀김기 상시 가동
        </text>
        <rect x="246" y="186" width="380" height="26" rx="6" fill="#E8521A" />
        <text x="636" y="204" fontSize="11.5" fontWeight="700" fill="#C2410C">
          36 ~ 40평형 (380V 확인)
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  21. 히트펌프 건조기 vs 히터식 & 콘덴서 막힘 점검 도해 (22번 글)        */
/* ------------------------------------------------------------------ */
function DryerHeatpumpCondenserDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="인버터 히트펌프 건조기 공기 순환 단면도와 하부 콘덴서 보풀 막힘 위치"
      caption="히트펌프 건조기는 열교환기(콘덴서)에서 습기를 물로 응축해 빼낸 뒤 재가열 순환하는 구조라, 하단 커버 안쪽 알루미늄 핀에 보풀이 뭉치면 건조 불량과 냄새가 발생합니다."
    >
      <svg
        viewBox="0 0 760 282"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[560px] h-auto select-none"
      >
        <title id={titleId}>
          히터식 건조기와 인버터 히트펌프 건조기 단면 공기 순환 비교 및 하부 콘덴서 핀 보풀 막힘 위치 도해
        </title>

        {/* 좌측: 히터식 vs 히트펌프식 비교 */}
        <rect x="16" y="14" width="332" height="254" rx="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <text x="32" y="38" fontSize="12" fontWeight="700" fill="#141A23">
          1. 가열·제습 구조 차이 (히터식 vs 히트펌프)
        </text>

        {/* 히터식 상단 */}
        <rect x="30" y="52" width="304" height="86" rx="8" fill="#FFFFFF" stroke="#FCA5A5" />
        <text x="42" y="72" fontSize="10.5" fontWeight="700" fill="#DC2626">
          구형 히터식 (고온 열선 75℃ → 외부 배기)
        </text>
        <rect x="44" y="84" width="76" height="36" rx="4" fill="#FEF2F2" stroke="#DC2626" />
        <text x="82" y="106" textAnchor="middle" fontSize="9" fontWeight="700" fill="#DC2626">
          고온 열선
        </text>
        <path d="M124 102 L152 102" stroke="#DC2626" strokeWidth="2.5" />
        <rect x="156" y="84" width="76" height="36" rx="4" fill="#F8FAFC" stroke="#64748B" />
        <text x="194" y="106" textAnchor="middle" fontSize="9" fontWeight="700" fill="#141A23">
          건조 드럼통
        </text>
        <path d="M236 102 L264 102" stroke="#64748B" strokeWidth="2.5" />
        <text x="298" y="99" textAnchor="middle" fontSize="9" fill="#475569">
          습기 배출
        </text>
        <text x="298" y="114" textAnchor="middle" fontSize="8.5" fill="#DC2626">
          전력 2배·수축
        </text>

        {/* 히트펌프 하단 순환 루프 */}
        <rect x="30" y="150" width="304" height="106" rx="8" fill="#ECFDF5" stroke="#6EE7B7" />
        <text x="42" y="170" fontSize="10.5" fontWeight="700" fill="#065F46">
          인버터 히트펌프식 (저온 55℃ 폐쇄 제습 순환)
        </text>
        <rect x="46" y="182" width="84" height="36" rx="4" fill="#FFFFFF" stroke="#0F766E" />
        <text x="88" y="204" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0F766E">
          드럼 (저온건조)
        </text>
        <path d="M134 196 L170 196" stroke="#0F766E" strokeWidth="2.5" />
        <rect x="174" y="182" width="144" height="36" rx="4" fill="#FFFFFF" stroke="#1D4ED8" />
        <text x="246" y="198" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1D4ED8">
          증발기(응축) → 응축기(재열)
        </text>
        <text x="246" y="212" textAnchor="middle" fontSize="8.5" fill="#475569">
          수분 물통/배수관으로 배출
        </text>
        <text x="182" y="242" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#047857">
          전기세 약 1/2 절감 · 기능성 의류 수축 최소화
        </text>

        {/* 우측: 건조기 전면 하단 점검 단면 */}
        <rect x="364" y="14" width="380" height="254" rx="12" fill="#FFFBF7" stroke="#FDBA74" strokeWidth="1.5" />
        <text x="382" y="38" fontSize="12" fontWeight="700" fill="#C2410C">
          2. 중고 건조기 현장 점검: 하단 콘덴서 커버 개방 단면
        </text>

        {/* 건조기 정면 모식도 */}
        <rect x="384" y="54" width="136" height="196" rx="6" fill="#FFFFFF" stroke="#141A23" strokeWidth="2" />
        <circle cx="452" cy="126" r="44" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2" />
        <text x="452" y="122" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1D4ED8">
          2중 도어
        </text>
        <text x="452" y="136" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1D4ED8">
          보풀 거름망
        </text>

        {/* 좌측 하단 콘덴서 점검 커버 */}
        <rect x="394" y="192" width="66" height="44" rx="4" fill="#FEF2F2" stroke="#DC2626" strokeWidth="2" />
        {/* 핀 라인 */}
        <line x1="404" y1="198" x2="404" y2="230" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="414" y1="198" x2="414" y2="230" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="424" y1="198" x2="424" y2="230" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="434" y1="198" x2="434" y2="230" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="444" y1="198" x2="444" y2="230" stroke="#94A3B8" strokeWidth="1.5" />
        <text x="490" y="218" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#475569">
          배수섬프
        </text>

        {/* 지시선 & 점검 포인트 */}
        <circle cx="452" cy="166" r="4" fill="#1D4ED8" />
        <line x1="456" y1="166" x2="542" y2="90" stroke="#1D4ED8" strokeWidth="1.5" />
        <rect x="542" y="58" width="186" height="58" rx="6" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="554" y="78" fontSize="10" fontWeight="700" fill="#1D4ED8">
          ① 도어 거름망 하부 배수로
        </text>
        <text x="554" y="95" fontSize="9.5" fill="#334155">
          눅눅한 물때·곰팡이 악취 확인
        </text>

        <circle cx="430" cy="214" r="4" fill="#DC2626" />
        <line x1="434" y1="214" x2="542" y2="158" stroke="#DC2626" strokeWidth="1.5" />
        <rect x="542" y="126" width="186" height="62" rx="6" fill="#FFFFFF" stroke="#FCA5A5" />
        <text x="554" y="146" fontSize="10" fontWeight="700" fill="#DC2626">
          ② 콘덴서 알루미늄 핀 막힘
        </text>
        <text x="554" y="163" fontSize="9.5" fill="#334155">
          손전등 비췄을 때 젖은 보풀
        </text>
        <text x="554" y="178" fontSize="9.5" fill="#DC2626">
          부직포처럼 뭉치면 건조 2배 지연
        </text>

        <rect x="542" y="198" width="186" height="52" rx="6" fill="#FFFFFF" stroke="#6EE7B7" />
        <text x="554" y="218" fontSize="10" fontWeight="700" fill="#0F766E">
          ③ 물통·자동세척 펌프 점검
        </text>
        <text x="554" y="236" fontSize="9.5" fill="#334155">
          매장 분해 세척 + 젖은수건 시운전
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  22. 중고 김치냉장고 뚜껑형 vs 스탠드형 & 부식 점검 도해 (23번 글)        */
/* ------------------------------------------------------------------ */
function KimchiFridgeCoolingDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="김치냉장고 뚜껑형(직접냉각) vs 스탠드형(순환냉각)과 중고 치명상 체크 위치"
      caption="김치 국물 염분이 내통 하단 모서리로 스며 알루미늄/동 냉각배관을 부식시키면 냉매 누설로 수리비가 본체 값만큼 나옵니다."
    >
      <svg
        viewBox="0 0 760 250"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          김치냉장고 뚜껑형과 스탠드형 냉각 구조 비교 및 내통 모서리 부식·가스켓 점검 포인트 도해
        </title>

        {/* 좌측: 뚜껑형 */}
        <rect x="16" y="14" width="354" height="222" rx="12" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="1.5" />
        <text x="34" y="42" fontSize="12.5" fontWeight="700" fill="#1D4ED8">
          1. 뚜껑형 (위에서 여는 직접냉각)
        </text>
        <rect x="50" y="64" width="128" height="96" rx="8" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2.5" />
        <text x="114" y="96" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1D4ED8">
          찬 공기 가둠
        </text>
        <text x="114" y="114" textAnchor="middle" fontSize="9.5" fill="#475569">
          5면 내벽 직접 냉각
        </text>
        <text x="114" y="132" textAnchor="middle" fontSize="9.5" fill="#0F766E">
          열어도 냉기 손실 적음
        </text>
        <circle cx="62" cy="148" r="7" fill="#DC2626" />
        <circle cx="166" cy="148" r="7" fill="#DC2626" />

        <text x="196" y="84" fontSize="10.5" fontWeight="700" fill="#141A23">
          특징: 장기 김치 보관·정온 유지 유리
        </text>
        <text x="196" y="106" fontSize="10" fill="#334155">
          - 온도 편차 작고 전력 소모가 적은 편
        </text>
        <text x="196" y="122" fontSize="10" fill="#334155">
          - 다만 주기적인 내벽 성에 제거 필요
        </text>
        <text x="196" y="144" fontSize="10.5" fontWeight="700" fill="#DC2626">
          점검 위치: 내통 바닥 모서리
        </text>
        <text x="196" y="162" fontSize="9.5" fill="#475569">
          김치국물 염분 고여 핀홀 부식(냉매샘)
        </text>
        <rect x="34" y="180" width="318" height="42" rx="8" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="193" y="205" textAnchor="middle" fontSize="10" fontWeight="700" fill="#DC2626">
          붉은 녹 자국 · 바닥 부풀음 · 성에 한쪽 쏠림 시 주의
        </text>

        {/* 우측: 스탠드형 */}
        <rect x="390" y="14" width="354" height="222" rx="12" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.5" />
        <text x="408" y="42" fontSize="12.5" fontWeight="700" fill="#0F766E">
          2. 스탠드형 (앞으로 여는 간냉·멀티형)
        </text>
        <rect x="410" y="64" width="110" height="96" rx="8" fill="#F0FDF4" stroke="#10B981" strokeWidth="2" />
        <line x1="410" y1="98" x2="520" y2="98" stroke="#6EE7B7" strokeWidth="1.5" />
        <line x1="410" y1="130" x2="520" y2="130" stroke="#6EE7B7" strokeWidth="1.5" />
        <text x="465" y="85" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#065F46">
          상칸: 팬 순환
        </text>
        <text x="465" y="118" textAnchor="middle" fontSize="9.5" fill="#065F46">
          중칸: 서랍
        </text>
        <text x="465" y="150" textAnchor="middle" fontSize="9.5" fill="#065F46">
          하칸: 서랍
        </text>

        <text x="536" y="84" fontSize="10.5" fontWeight="700" fill="#141A23">
          특징: 허리 부담 적고 성에 거의 없음
        </text>
        <text x="536" y="106" fontSize="10" fill="#334155">
          - 상·중·하 칸별 냉동/야채/쌀 전환
        </text>
        <text x="536" y="122" fontSize="10" fill="#334155">
          - 공간 면적 작고 수납 동선 편리
        </text>
        <text x="536" y="144" fontSize="10.5" fontWeight="700" fill="#C2410C">
          점검 위치: 서랍 레일 · 고무 패킹
        </text>
        <text x="536" y="162" fontSize="9.5" fill="#475569">
          틈 들뜨면 성에·결로·온도 상승
        </text>
        <rect x="408" y="180" width="318" height="42" rx="8" fill="#FFF7ED" stroke="#FDBA74" />
        <text x="567" y="205" textAnchor="middle" fontSize="10" fontWeight="700" fill="#C2410C">
          서랍 4면 가스켓 밀착 상태 + 각 칸 온도 하강 여부 확인
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  23. 인버터 에어컨 24시간 vs 껐다켜기 전력 곡선 도해 (24번 글)         */
/* ------------------------------------------------------------------ */
function InverterDutyCycleDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="인버터 에어컨을 켰다 껐다 반복할 때 vs 일정 온도로 유지할 때 전력 소모 그래프"
      caption="더워진 실온을 다시 낮추는 첫 30분 구간이 유지 운전 때보다 전기를 3~5배 더 씁니다. 단, 4시간 이상 긴 외출이나 정속형 모델은 끄는 것이 유리합니다."
    >
      <svg
        viewBox="0 0 760 250"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          인버터 에어컨 초기 기동 피크 전력과 유지 운전 전력 비교 및 외출 시간 기준표 도해
        </title>

        {/* 그래프 박스 */}
        <rect x="16" y="14" width="440" height="222" rx="12" fill="#FFFFFF" stroke="#E2E6EC" strokeWidth="1.5" />
        <text x="34" y="38" fontSize="12" fontWeight="700" fill="#141A23">
          시간에 따른 인버터 컴프레샤 소비전력 패턴
        </text>
        {/* 축 */}
        <line x1="54" y1="60" x2="54" y2="196" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="54" y1="196" x2="430" y2="196" stroke="#94A3B8" strokeWidth="1.5" />
        <text x="38" y="72" fontSize="9.5" fill="#64748B">
          높음
        </text>
        <text x="38" y="186" fontSize="9.5" fill="#64748B">
          낮음
        </text>
        <text x="412" y="212" fontSize="9.5" fill="#64748B">
          시간
        </text>

        {/* 곡선 1: 껐다 켰다 (빨간 톱니 피크) */}
        <path
          d="M60 190 L82 68 L130 74 L145 140 L165 192 L205 192 L226 68 L272 74 L288 145 L308 192 L348 192 L370 68 L416 74"
          fill="none"
          stroke="#DC2626"
          strokeWidth="2.5"
          strokeDasharray="6 3"
        />
        {/* 곡선 2: 유지 운전 (초록 완만) */}
        <path
          d="M60 190 L82 72 L130 90 L165 164 L420 168"
          fill="none"
          stroke="#0F766E"
          strokeWidth="3"
        />

        {/* 범례 */}
        <rect x="66" y="206" width="16" height="4" fill="#0F766E" />
        <text x="88" y="212" fontSize="10" fontWeight="700" fill="#0F766E">
          연속 유지 운전 (희망온도 25~26도 도달 후 저전력 순항)
        </text>
        <rect x="66" y="222" width="16" height="4" fill="#DC2626" />
        <text x="88" y="228" fontSize="10" fontWeight="700" fill="#DC2626">
          1~2시간마다 껐다 켜기 (기동 피크 반복으로 전력 누적 상승)
        </text>

        {/* 우측 요약 가이드 */}
        <rect x="472" y="14" width="272" height="222" rx="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <text x="490" y="40" fontSize="12" fontWeight="700" fill="#141A23">
          현실 기준별 BEST 운전법
        </text>
        <rect x="488" y="54" width="240" height="50" rx="8" fill="#ECFDF5" stroke="#6EE7B7" />
        <text x="502" y="74" fontSize="10.5" fontWeight="700" fill="#0F766E">
          외출 2시간 이하 · 인버터형
        </text>
        <text x="502" y="93" fontSize="10" fill="#334155">
          켜두기 (1~2도 올려두면 가장 절약)
        </text>

        <rect x="488" y="114" width="240" height="50" rx="8" fill="#EFF6FF" stroke="#93C5FD" />
        <text x="502" y="134" fontSize="10.5" fontWeight="700" fill="#1D4ED8">
          외출 4시간 이상 / 정속형 구형
        </text>
        <text x="502" y="153" fontSize="10" fill="#334155">
          반드시 전원 끄기 (정속형은 켜둔 채 못 줄임)
        </text>

        <rect x="488" y="174" width="240" height="50" rx="8" fill="#FFF7ED" stroke="#FDBA74" />
        <text x="502" y="194" fontSize="10.5" fontWeight="700" fill="#C2410C">
          제습 vs 냉방 전기세 진실
        </text>
        <text x="502" y="213" fontSize="10" fill="#334155">
          초반엔 냉방 강풍 · 유지 때 자동·제습 유리
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  24. 에어컨 실내기 물 뚝뚝 누수 4대 원인 단면도 (25번 글)             */
/* ------------------------------------------------------------------ */
function AirconDrainLeakDiagram() {
  return (
    <DiagramFigure
      badgeLabel="실사 점검 · 실내기 배수"
      title="에어컨 실내기 배수 단면 실사와 물 떨어짐 4대 원인 위치 구분"
      caption="찬 바람이 정상인데 물만 떨어지면 물받이(②)·배수호스 U자 처짐(③)·드레인 펌프(④) 문제이고, 바람까지 미지근하다가 껐을 때 쏟아지면 에바 결빙 해동(①)입니다."
    >
      <AirconDrainLeakPhotoDiagram />
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  25. 알루미늄 배관 vs 동배관 & 매립배관 재사용 비교 도해 (26번 글)     */
/* ------------------------------------------------------------------ */
function AirconPipeComparisonDiagram() {
  return (
    <DiagramFigure
      title="순수 KS 동배관 vs 백화·크랙 발생한 알루미늄 배관 실물 비교"
      badgeLabel="실사 비교 · 단면·부식"
      caption="순수 동관(01)은 꺾임이 없으면 끝단을 절단해 재확관할 수 있지만, 알루미늄 합금관(02)은 재체결 시 나팔 끝단이 찢어지거나 보온재 안에서 점부식이 진행되기 쉽습니다. 절단 단면(03) 확인 및 매립배관 40kgf/cm² 질소 기밀 검사가 필수입니다."
    >
      <AirconPipeComparisonPhotoDiagram />
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  26. 음료 쇼케이스 결로·자연증발 & 토핑냉장고 체크 도해 (27번 글)     */
/* ------------------------------------------------------------------ */
function ShowcaseCondensationDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="음료 쇼케이스 유리 결로·자연증발 접시 & 토핑냉장고 매립 통풍 단면도"
      caption="복층유리 내부 실링 파손 결로는 도어 교체가 필요하지만, 바깥쪽 결로나 장마철 자연증발 접시 넘침은 환경·수평 조절로 해결됩니다. 카운터 매립 시 좌·우·후면 10cm 통풍구가 필수입니다."
    >
      <svg
        viewBox="0 0 760 282"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[560px] h-auto select-none"
      >
        <title id={titleId}>
          음료 쇼케이스 복층유리 단면 비교, 하부 핫가스 자연증발 접시 단면, 토핑냉장고 매립 평면 통풍 도해
        </title>

        {/* Point 1: 복층유리 단면 */}
        <rect x="16" y="14" width="234" height="254" rx="12" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="1.5" />
        <text x="32" y="38" fontSize="11.5" fontWeight="700" fill="#1D4ED8">
          1. 복층유리(페어글라스) 단면
        </text>
        <rect x="32" y="52" width="202" height="84" rx="8" fill="#EFF6FF" stroke="#93C5FD" />
        {/* 유리 2겹 단면 */}
        <rect x="52" y="64" width="8" height="60" fill="#93C5FD" stroke="#1D4ED8" />
        <rect x="74" y="64" width="8" height="60" fill="#93C5FD" stroke="#1D4ED8" />
        <rect x="60" y="76" width="14" height="34" fill="#DBEAFE" />
        <circle cx="46" cy="88" r="3" fill="#0F766E" />
        <circle cx="67" cy="94" r="3" fill="#DC2626" />
        <text x="96" y="84" fontSize="9.5" fontWeight="700" fill="#0F766E">
          바깥 물방울 → 수건 닦임
        </text>
        <text x="96" y="100" fontSize="9" fill="#475569">
          (습도·도어 열선 OFF)
        </text>
        <text x="96" y="120" fontSize="9.5" fontWeight="700" fill="#DC2626">
          유리 사이 김 → 실링 파손
        </text>

        <text x="32" y="160" fontSize="10" fill="#334155">
          • 겉면 물방울: 실내 습도 높거나
        </text>
        <text x="32" y="176" fontSize="10" fill="#334155">
          전면 히터(열선) 스위치가 꺼진 상태
        </text>
        <text x="32" y="196" fontSize="10" fill="#DC2626">
          • 유리 두 겹 사이 뿌연 김: 진공 실링
        </text>
        <text x="32" y="212" fontSize="10" fill="#DC2626">
          터짐(닦이지 않으면 도어 교체)
        </text>
        <text x="32" y="248" fontSize="10" fontWeight="700" fill="#0F766E">
          점검: 문짝 고무패킹 밀착 함께 확인
        </text>

        {/* Point 2: 하단 자연증발 접시 */}
        <rect x="263" y="14" width="234" height="254" rx="12" fill="#FFFFFF" stroke="#E8521A" strokeWidth="1.5" />
        <text x="279" y="38" fontSize="11.5" fontWeight="700" fill="#C2410C">
          2. 하단 자연증발 접시 단면
        </text>
        <rect x="279" y="52" width="202" height="84" rx="8" fill="#FFF7ED" stroke="#FDBA74" />
        {/* 물받이 접시 + 핫가스 코일 */}
        <path d="M300 94 L306 122 L398 122 L404 94" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2" />
        <path d="M316 112 Q352 104 388 112" fill="none" stroke="#DC2626" strokeWidth="3.5" />
        <line x1="352" y1="62" x2="352" y2="98" stroke="#1D4ED8" strokeWidth="2.5" />
        <text x="412" y="80" fontSize="9" fontWeight="700" fill="#1D4ED8">
          제상수 유입
        </text>
        <text x="412" y="114" fontSize="9" fontWeight="700" fill="#DC2626">
          고열 핫가스관
        </text>

        <text x="279" y="160" fontSize="10" fill="#334155">
          • 별도 배수관 없이 콤프레샤 열기로
        </text>
        <text x="279" y="176" fontSize="10" fill="#334155">
          제상수를 증발시키는 구조가 대부분
        </text>
        <text x="279" y="196" fontSize="10" fill="#334155">
          • 장마철·문 잦은 개폐 시 증발량 초과
        </text>
        <text x="279" y="212" fontSize="10" fill="#334155">
          또는 배수 호스 이탈로 바닥 물고임
        </text>
        <text x="279" y="248" fontSize="10" fontWeight="700" fill="#C2410C">
          대처: 수평 맞춤 · 테이크아웃 배수직결
        </text>

        {/* Point 3: 토핑냉장고 매립 평면 */}
        <rect x="510" y="14" width="234" height="254" rx="12" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.5" />
        <text x="526" y="38" fontSize="11.5" fontWeight="700" fill="#0F766E">
          3. 바 카운터 매립 통풍 평면도
        </text>
        <rect x="526" y="52" width="202" height="84" rx="8" fill="#ECFDF5" stroke="#6EE7B7" />
        {/* 목공 카운터 외벽 */}
        <rect x="546" y="64" width="162" height="60" rx="4" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
        {/* 냉장고 본체 (좌우/후면 여백 표시) */}
        <rect x="564" y="76" width="126" height="48" rx="3" fill="#FFFFFF" stroke="#0F766E" strokeWidth="2" />
        <text x="627" y="102" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0F766E">
          테이블 · 토핑 냉장고
        </text>
        <text x="554" y="98" textAnchor="middle" fontSize="8" fontWeight="700" fill="#DC2626">
          10
        </text>
        <text x="700" y="98" textAnchor="middle" fontSize="8" fontWeight="700" fill="#DC2626">
          10
        </text>
        <text x="627" y="73" textAnchor="middle" fontSize="8" fontWeight="700" fill="#DC2626">
          후면 여유 10cm+
        </text>

        <text x="526" y="160" fontSize="10" fill="#334155">
          • 목공 바 안에 꽉 끼우면 방열 불량으로
        </text>
        <text x="526" y="176" fontSize="10" fill="#334155">
          여름 피크타임 콤프레샤 과열 정지
        </text>
        <text x="526" y="196" fontSize="10" fill="#334155">
          • 바트 뚜껑 열고 방치하면 성에 과다
        </text>
        <text x="526" y="212" fontSize="10" fill="#334155">
          로 연속 가동 부하 누적
        </text>
        <text x="526" y="248" fontSize="10" fontWeight="700" fill="#0F766E">
          확인: 전면 흡배기/측면 배기 위치 구분
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  27. 창·폐업 시 중고 매입가 방어되는 규격 vs 감가 요인 도해 (28번 글)     */
/* ------------------------------------------------------------------ */
function ApplianceResaleValueDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="나중에 되팔 때 제값 받는 표준 규격 도면 vs 감가·매입 불가 유형"
      caption="폐업이나 업종 변경까지 고려한다면 표준 가로 규격(45박스 1100mm, 테이블 1200·1500·1800mm)과 단상 220V 정식 모델을 선택하고, 철거 시 냉매 회수(펌프다운) 후 배관을 분리해야 감가 손실이 줄어듭니다."
    >
      <svg
        viewBox="0 0 760 284"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          창업 가전 재판매 환금성 높은 표준 치수 도면과 매입 감가·불가 사유 비교 도해
        </title>

        {/* 좌측: 표준 규격 · 환금성 최상 */}
        <rect x="16" y="14" width="358" height="256" rx="12" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.5" />
        <rect x="30" y="26" width="194" height="24" rx="12" fill="#ECFDF5" stroke="#A7F3D0" />
        <text x="127" y="42" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#0F766E">
          표준 규격 · 고가 매입 및 빠른 회전
        </text>

        {/* 45박스 표준 치수 블루프린트 */}
        <rect x="32" y="64" width="144" height="104" rx="6" fill="#F8FAFC" stroke="#CBD5E1" />
        <text x="104" y="80" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#141A23">
          45박스 표준 냉장고
        </text>
        <line x1="62" y1="90" x2="146" y2="90" stroke="#0F766E" strokeWidth="1" />
        <text x="104" y="88" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#0F766E">
          W 1100mm
        </text>
        <rect x="62" y="94" width="84" height="58" rx="3" fill="#FFFFFF" stroke="#334155" strokeWidth="1.4" />
        <line x1="104" y1="94" x2="104" y2="152" stroke="#64748B" strokeWidth="1" />
        <rect x="66" y="98" width="34" height="22" rx="1.5" fill="#EFF6FF" stroke="#93C5FD" />
        <rect x="108" y="98" width="34" height="22" rx="1.5" fill="#EFF6FF" stroke="#93C5FD" />
        <rect x="66" y="123" width="34" height="25" rx="1.5" fill="#F1F5F9" stroke="#CBD5E1" />
        <rect x="108" y="123" width="34" height="25" rx="1.5" fill="#F1F5F9" stroke="#CBD5E1" />
        <text x="104" y="163" textAnchor="middle" fontSize="8.5" fill="#475569">
          D 800 x H 1900mm
        </text>

        {/* 테이블 냉장고 표준 모듈 */}
        <rect x="188" y="64" width="170" height="104" rx="6" fill="#F8FAFC" stroke="#CBD5E1" />
        <text x="273" y="80" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#141A23">
          테이블 냉장·냉동 모듈
        </text>
        <rect x="206" y="98" width="134" height="44" rx="3" fill="#FFFFFF" stroke="#334155" strokeWidth="1.4" />
        <line x1="250" y1="98" x2="250" y2="142" stroke="#94A3B8" strokeWidth="1" />
        <line x1="296" y1="98" x2="296" y2="142" stroke="#94A3B8" strokeWidth="1" />
        <rect x="210" y="102" width="36" height="36" rx="2" fill="#ECFDF5" stroke="#6EE7B7" />
        <rect x="254" y="102" width="38" height="36" rx="2" fill="#F1F5F9" stroke="#CBD5E1" />
        <rect x="300" y="102" width="36" height="36" rx="2" fill="#F1F5F9" stroke="#CBD5E1" />
        <text x="273" y="156" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#0F766E">
          폭 1200 / 1500 / 1800mm
        </text>
        <text x="273" y="165" textAnchor="middle" fontSize="8" fill="#64748B">
          깊이 D 700mm 표준
        </text>

        {/* 표준 전기 및 부품 체크 뱃지 */}
        <rect x="32" y="178" width="104" height="36" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
        <text x="84" y="194" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#065F46">
          단상 220V
        </text>
        <text x="84" y="208" textAnchor="middle" fontSize="8.5" fill="#0F766E">
          일반 상가 즉시 설치
        </text>

        <rect x="142" y="178" width="110" height="36" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
        <text x="197" y="194" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#065F46">
          국내 주요 브랜드
        </text>
        <text x="197" y="208" textAnchor="middle" fontSize="8.5" fill="#0F766E">
          부품·기판 수급 원활
        </text>

        <rect x="258" y="178" width="100" height="36" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
        <text x="308" y="194" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#065F46">
          제작 3~5년 내
        </text>
        <text x="308" y="208" textAnchor="middle" fontSize="8.5" fill="#0F766E">
          명판 식별 선명
        </text>

        {/* 잔존가치 방어 게이지 */}
        <text x="32" y="234" fontSize="9.5" fontWeight="700" fill="#141A23">
          중고 환금성(매입 시세 방어)
        </text>
        <rect x="32" y="241" width="326" height="12" rx="6" fill="#E2E8F0" />
        <rect x="32" y="241" width="276" height="12" rx="6" fill="#0F766E" />
        <text x="358" y="234" textAnchor="end" fontSize="9.5" fontWeight="700" fill="#0F766E">
          수요층 두터움 · 감가 최소화
        </text>

        {/* 우측: 감가·불가 유형 */}
        <rect x="386" y="14" width="358" height="256" rx="12" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1.5" />
        <rect x="400" y="26" width="204" height="24" rx="12" fill="#FEF2F2" stroke="#FECACA" />
        <text x="502" y="42" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#DC2626">
          큰 폭 감가 · 매입 거절·폐기 대상
        </text>

        {/* 사례 1: 비표준 특대형 / 직구 50Hz */}
        <rect x="402" y="64" width="326" height="50" rx="8" fill="#FEF2F2" stroke="#FECACA" />
        <rect x="414" y="75" width="38" height="28" rx="4" fill="#FFFFFF" stroke="#DC2626" strokeDasharray="3 2" />
        <text x="433" y="93" textAnchor="middle" fontSize="9" fontWeight="700" fill="#DC2626">
          1400+
        </text>
        <text x="464" y="84" fontSize="10.5" fontWeight="700" fill="#141A23">
          비표준 맞춤 대형 · 해외 직구(50Hz) 기기
        </text>
        <text x="464" y="102" fontSize="9" fill="#475569">
          출입문(800mm) 반출 난항, 국내 전장 부품 수급 불가
        </text>

        {/* 사례 2: 소형매장 3상 380V */}
        <rect x="402" y="122" width="326" height="50" rx="8" fill="#FFF7ED" stroke="#FED7AA" />
        <rect x="414" y="133" width="38" height="28" rx="4" fill="#FFFFFF" stroke="#EA580C" />
        <text x="433" y="151" textAnchor="middle" fontSize="9" fontWeight="700" fill="#C2410C">
          380V
        </text>
        <text x="464" y="142" fontSize="10.5" fontWeight="700" fill="#141A23">
          일반 소형 평형인데 삼상 380V 전용 장비
        </text>
        <text x="464" y="160" fontSize="9" fill="#475569">
          일반 220V 상가에서 승압 공사 없이는 설치 불가
        </text>

        {/* 사례 3: 배관 절단 / 명판 훼손 */}
        <rect x="402" y="180" width="326" height="50" rx="8" fill="#FEF2F2" stroke="#FECACA" />
        <line x1="418" y1="196" x2="438" y2="214" stroke="#DC2626" strokeWidth="2.5" />
        <line x1="438" y1="196" x2="418" y2="214" stroke="#DC2626" strokeWidth="2.5" />
        <text x="464" y="200" fontSize="10.5" fontWeight="700" fill="#141A23">
          펌프다운 없이 배관 절단 · 명판 스티커 훼손
        </text>
        <text x="464" y="218" fontSize="9" fill="#475569">
          냉매 유실·수분 유입 및 제조년월 미확인으로 대폭 감가
        </text>

        <text x="402" y="248" fontSize="9.5" fontWeight="700" fill="#DC2626">
          환금성 급락 · 철거 및 폐기 비용만 발생할 수 있음
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  28. 에너지효율 법적 기준 상향 & 등급 역전 현상 도해 (29번 글)         */
/* ------------------------------------------------------------------ */
function EnergyGradeRevisionDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="에너지소비효율 라벨 실제 읽는 법: 구형 1등급 vs 개정 후 3~4등급 역전 비교"
      caption="효율 등급은 구매 시점이 아니라 제조 당시 법적 기준에 따라 매겨집니다. 기준 개편 이후 출고된 3~4등급 모델이 과거 구형 1등급보다 월간 kWh 소비량이 더 낮은 경우가 흔합니다."
    >
      <svg
        viewBox="0 0 760 286"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          에너지소비효율등급 라벨 구조와 기준 상향에 따른 구형 1등급 대 신형 3~4등급 소비전력 비교 차트
        </title>

        {/* 좌측: 구 기준 라벨 모형 */}
        <rect x="16" y="14" width="212" height="170" rx="10" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
        <rect x="16" y="14" width="212" height="28" rx="10" fill="#475569" />
        <rect x="16" y="32" width="212" height="10" fill="#475569" />
        <text x="122" y="33" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
          구 기준 라벨 (2018년 개편 전)
        </text>

        <path d="M56 98 A66 66 0 0 1 188 98" fill="none" stroke="#E2E8F0" strokeWidth="12" strokeLinecap="round" />
        <path d="M56 98 A66 66 0 0 1 92 44" fill="none" stroke="#16A34A" strokeWidth="12" strokeLinecap="round" />
        <circle cx="122" cy="96" r="22" fill="#0F766E" />
        <text x="122" y="102" textAnchor="middle" fontSize="15" fontWeight="800" fill="#FFFFFF">
          1
        </text>
        <text x="122" y="132" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#475569">
          과거 느슨한 기준 통과
        </text>
        <rect x="30" y="142" width="184" height="32" rx="6" fill="#FEF2F2" stroke="#FECACA" />
        <text x="122" y="156" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#DC2626">
          라벨 월 소비전력: 42 kWh
        </text>
        <text x="122" y="169" textAnchor="middle" fontSize="8.5" fill="#64748B">
          현행 기준 재평가 시 3~4등급 이하
        </text>

        {/* 중앙: 신 기준 라벨 모형 */}
        <rect x="242" y="14" width="212" height="170" rx="10" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.8" />
        <rect x="242" y="14" width="212" height="28" rx="10" fill="#0F766E" />
        <rect x="242" y="32" width="212" height="10" fill="#0F766E" />
        <text x="348" y="33" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
          현행 기준 라벨 (기준 상향 후)
        </text>

        <path d="M282 98 A66 66 0 0 1 414 98" fill="none" stroke="#E2E8F0" strokeWidth="12" strokeLinecap="round" />
        <path d="M282 98 A66 66 0 0 1 384 44" fill="none" stroke="#2563EB" strokeWidth="12" strokeLinecap="round" />
        <circle cx="348" cy="96" r="22" fill="#1D4ED8" />
        <text x="348" y="101" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FFFFFF">
          3~4
        </text>
        <text x="348" y="132" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#0F766E">
          상향된 기준 · 적용일 2021~
        </text>
        <rect x="256" y="142" width="184" height="32" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
        <text x="348" y="156" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#0F766E">
          라벨 월 소비전력: 31 kWh
        </text>
        <text x="348" y="169" textAnchor="middle" fontSize="8.5" fill="#065F46">
          구형 1등급 대비 실제 전력 -26%
        </text>

        {/* 우측: 실 소비전력 수평 바 그래프 */}
        <rect x="468" y="14" width="276" height="170" rx="10" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <text x="484" y="38" fontSize="11" fontWeight="700" fill="#141A23">
          월간 실제 소비전력(kWh) 비교
        </text>
        <text x="484" y="53" fontSize="9" fill="#64748B">
          같은 용량 냉장고 기준 (숫자가 작을수록 절전)
        </text>

        <text x="484" y="78" fontSize="9.5" fontWeight="700" fill="#475569">
          2016년형 구 기준 1등급
        </text>
        <rect x="484" y="85" width="220" height="20" rx="5" fill="#E2E8F0" />
        <rect x="484" y="85" width="200" height="20" rx="5" fill="#DC2626" opacity="0.85" />
        <text x="692" y="99" textAnchor="end" fontSize="10" fontWeight="700" fill="#FFFFFF">
          42 kWh / 월
        </text>

        <text x="484" y="128" fontSize="9.5" fontWeight="700" fill="#0F766E">
          2023년형 현행 기준 3~4등급
        </text>
        <rect x="484" y="135" width="220" height="20" rx="5" fill="#E2E8F0" />
        <rect x="484" y="135" width="146" height="20" rx="5" fill="#0F766E" />
        <text x="622" y="149" textAnchor="end" fontSize="10" fontWeight="700" fill="#FFFFFF">
          31 kWh / 월
        </text>

        <text x="484" y="174" fontSize="9" fontWeight="700" fill="#1D4ED8">
          핵심: 등급 숫자보다 하단 kWh와 적용연도를 확인
        </text>

        {/* 하단: 4·5등급 실사용 성능 우수 조건 */}
        <rect x="16" y="196" width="728" height="76" rx="10" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1.5" />
        <text x="34" y="218" fontSize="11" fontWeight="700" fill="#C2410C">
          고기능·대형 가전에서 4·5등급이 실성능이나 가성비가 더 나은 대표 사례
        </text>
        <text x="34" y="238" fontSize="9.5" fill="#334155">
          • 출력·밝기 제한 없음: TV는 1등급 심사 통과를 위해 출고 밝기를 억지로 낮추는 반면, 고휘도 패널은 4~5등급이어도 화질·명암이 여유로움
        </text>
        <text x="34" y="256" fontSize="9.5" fill="#334155">
          • 편의기능 탑재 + 초기 구매가 절감: 얼음정수기·디스펜서·고풍량 쾌속모드 모델은 3~5등급이라도 기기 가격 차액 회수가 5년 이상 걸리는 경우가 많음
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  29. 대형 1대 단독 설치 vs 중·소형 여러 대 분산 설치 비교 도해 (30번 글) */
/* ------------------------------------------------------------------ */
function AirconSingleVsMultiDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="동일 총용량(예: 40평 기준) 대형 1대 단독 vs 중형 2대 분산 배치 평면 기류 비교"
      caption="트인 직사각 홀은 대형 1대가 설치비·실외기 자리 면에서 유리하지만, ㄱ자 꺾임·칸막이 구조이거나 단상 220V 한계·성수기 무중단 영업이 중요할 때는 20평급 2대 대각선 분산 배치가 효율적입니다."
    >
      <svg
        viewBox="0 0 760 296"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          대형 에어컨 1대 집중 배치 시 기류 사각지대와 중소형 2대 대각선 분산 배치 시 온도 균일화 비교 평면도
        </title>

        {/* 좌측: 대형 1대 단독 배치 */}
        <rect x="16" y="14" width="356" height="268" rx="12" fill="#FFFFFF" stroke="#E2E6EC" strokeWidth="1.5" />
        <rect x="30" y="26" width="186" height="24" rx="12" fill="#FEF2F2" stroke="#FECACA" />
        <text x="123" y="42" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#DC2626">
          CASE A. 대형 40평형 1대 단독
        </text>

        {/* ㄱ자 매장 평면도 (좌측) */}
        <path
          d="M38 64 L348 64 L348 134 L212 134 L212 198 L38 198 Z"
          fill="#F8FAFC"
          stroke="#475569"
          strokeWidth="1.8"
        />
        {/* 실내기 1대 위치 */}
        <rect x="44" y="72" width="24" height="54" rx="4" fill="#141A23" />
        <text x="56" y="102" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FFFFFF">
          40평
        </text>

        {/* 직풍 영역 (과냉) */}
        <path d="M70 80 L195 72 L195 128 L70 116 Z" fill="#DBEAFE" opacity="0.75" />
        <text x="132" y="96" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1D4ED8">
          앞자리 직풍 과냉 (19도)
        </text>
        <text x="132" y="112" textAnchor="middle" fontSize="8.5" fill="#1E40AF">
          바람 도달 한계 약 8~10m
        </text>

        {/* 우측 & 하단 꺾인 구역 (사각지대) */}
        <rect x="218" y="70" width="122" height="58" rx="4" fill="#FEE2E2" opacity="0.85" />
        <text x="279" y="96" textAnchor="middle" fontSize="9" fontWeight="700" fill="#B91C1C">
          안쪽 홀 · 주방 열기
        </text>
        <text x="279" y="112" textAnchor="middle" fontSize="8.5" fill="#DC2626">
          냉기 미도달 (27~28도)
        </text>

        <rect x="76" y="142" width="128" height="48" rx="4" fill="#FFEDD5" opacity="0.85" />
        <text x="140" y="164" textAnchor="middle" fontSize="9" fontWeight="700" fill="#C2410C">
          ㄱ자 모퉁이 · 룸 사각지대
        </text>
        <text x="140" y="180" textAnchor="middle" fontSize="8.5" fill="#9A3412">
          서큘레이터 보조 없으면 더움
        </text>

        {/* 장단점 요약 */}
        <text x="34" y="222" fontSize="9.5" fontWeight="700" fill="#0F766E">
          장점: 배관 타공 1회 · 실외기 1대 · 초기 설치비 절감
        </text>
        <text x="34" y="242" fontSize="9.5" fontWeight="700" fill="#DC2626">
          약점: 40평급+ 단상40A/삼상380V 제약 및 1대 고장 시 전체 마비
        </text>
        <text x="34" y="264" fontSize="9" fill="#475569">
          적합 공간: 30평 이하 장애물 없는 정사각·오픈 직사각 홀
        </text>

        {/* 우측: 중소형 2대 분산 배치 */}
        <rect x="388" y="14" width="356" height="268" rx="12" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.5" />
        <rect x="402" y="26" width="210" height="24" rx="12" fill="#ECFDF5" stroke="#A7F3D0" />
        <text x="507" y="42" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#0F766E">
          CASE B. 중·소형 2대 (예: 23평+18평) 분산
        </text>

        {/* ㄱ자 매장 평면도 (우측) */}
        <path
          d="M410 64 L720 64 L720 134 L584 134 L584 198 L410 198 Z"
          fill="#ECFDF5"
          opacity="0.45"
        />
        <path
          d="M410 64 L720 64 L720 134 L584 134 L584 198 L410 198 Z"
          fill="none"
          stroke="#0F766E"
          strokeWidth="1.8"
        />

        {/* 실내기 1번 (주 홀 좌측) */}
        <rect x="416" y="72" width="22" height="48" rx="4" fill="#0F766E" />
        <text x="427" y="99" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FFFFFF">
          1호
        </text>
        <path d="M442 82 L560 76 L560 120 L442 110 Z" fill="#A7F3D0" opacity="0.65" />

        {/* 실내기 2번 (안쪽/코너 대각선) */}
        <rect x="692" y="72" width="22" height="48" rx="4" fill="#1D4ED8" />
        <text x="703" y="99" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FFFFFF">
          2호
        </text>
        <path d="M688 86 L552 130 L562 188 L452 188 L452 146 Z" fill="#BFDBFE" opacity="0.6" />

        <text x="536" y="102" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#065F46">
          홀 전체 균일 온도 (23~24도)
        </text>
        <text x="506" y="168" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1D4ED8">
          2호기 독립 운전·오전 1대 절전 가능
        </text>

        {/* 장단점 요약 */}
        <text x="406" y="222" fontSize="9.5" fontWeight="700" fill="#0F766E">
          장점: 단상 220V 분배 가능 · 사각지대 해소 · 1대 고장 시 영업 유지
        </text>
        <text x="406" y="242" fontSize="9.5" fontWeight="700" fill="#C2410C">
          부담: 배관·타공 설치비 2회 발생 + 실외기 2대 거치 자리 필요
        </text>
        <text x="406" y="264" fontSize="9" fill="#475569">
          적합 공간: 35평+ 매장, ㄱ자·칸막이·홀+안쪽룸, 휴무 없는 음식점·카페
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  31. 업소용 인덕션·튀김기 일반 콘센트 vs 전용 직결 배선 (31번 글)       */
/* ------------------------------------------------------------------ */
function InductionWiringBreakerDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="일반 16A 벽 콘센트 허용 한계와 3kW+ 가열기기 전용 직결 차단기 비교"
      caption="국내 일반 220V 콘센트는 정격 16A(약 3.5kW)가 한계입니다. 업소용 인덕션·전기튀김기(3.5~6kW)는 4.0~6.0SQ 전선으로 20~40A 단독 차단기에 직결해야 전선 과열을 막습니다."
    >
      <svg
        viewBox="0 0 760 278"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[560px] h-auto select-none"
      >
        <title id={titleId}>
          일반 16A 벽 콘센트 및 멀티탭 과부하 발열 위험과 4.0SQ 단독 누전차단기 직결 구조 비교도
        </title>

        {/* 좌측: 위험 케이스 */}
        <rect x="16" y="14" width="356" height="250" rx="12" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.5" />
        <text x="32" y="38" fontSize="12" fontWeight="700" fill="#B91C1C">
          위험 사례: 일반 16A 콘센트 · 멀티탭 겸용 연결
        </text>

        <rect x="34" y="64" width="90" height="58" rx="6" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1.8" />
        <text x="79" y="88" textAnchor="middle" fontSize="10" fontWeight="700" fill="#141A23">
          벽 콘센트 16A
        </text>
        <text x="79" y="106" textAnchor="middle" fontSize="9.5" fill="#DC2626">
          정격 최대 3.5kW
        </text>

        <line x1="124" y1="93" x2="178" y2="93" stroke="#DC2626" strokeWidth="3.5" strokeDasharray="4 3" />
        <text x="151" y="83" textAnchor="middle" fontSize="9" fontWeight="700" fill="#B91C1C">
          25A+ 과열
        </text>

        <rect x="178" y="54" width="174" height="78" rx="8" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
        <text x="265" y="76" textAnchor="middle" fontSize="10" fontWeight="700" fill="#141A23">
          3.5kW 인덕션 + 2.5kW 온수기
        </text>
        <text x="265" y="95" textAnchor="middle" fontSize="9.5" fill="#DC2626">
          합계 6.0kW (약 27.3A 연속 통전)
        </text>
        <text x="265" y="114" textAnchor="middle" fontSize="9" fill="#475569">
          플러그 접촉부 탄화 · 피복 열변형
        </text>

        <rect x="34" y="150" width="318" height="96" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="48" y="172" fontSize="10.5" fontWeight="700" fill="#B91C1C">
          현장에서 가장 자주 터지는 3가지 사고
        </text>
        <text x="48" y="193" fontSize="9.5" fill="#334155">
          1) 벽 콘센트 내부 구리 단자가 녹아 플러그가 안 빠짐
        </text>
        <text x="48" y="211" fontSize="9.5" fill="#334155">
          2) 장사 피크 시간마다 주방 전체 차단기 셔터 다운
        </text>
        <text x="48" y="229" fontSize="9.5" fill="#334155">
          3) 멀티탭 내부 배선(1.5SQ) 과열로 주방 화재 위험
        </text>

        {/* 우측: 안전 직결 케이스 */}
        <rect x="388" y="14" width="356" height="250" rx="12" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth="1.5" />
        <text x="404" y="38" fontSize="12" fontWeight="700" fill="#047857">
          정석 시공: 분전반 단독 누전차단기 직결
        </text>

        <rect x="406" y="62" width="96" height="62" rx="6" fill="#0F766E" />
        <text x="454" y="87" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
          전용 차단기
        </text>
        <text x="454" y="106" textAnchor="middle" fontSize="9.5" fill="#D1FAE5">
          20~40A 단독 ELCB
        </text>

        <line x1="502" y1="93" x2="572" y2="93" stroke="#0F766E" strokeWidth="4.5" />
        <text x="537" y="83" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#047857">
          4.0~6.0SQ
        </text>

        <rect x="572" y="54" width="154" height="78" rx="8" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.8" />
        <text x="649" y="76" textAnchor="middle" fontSize="10" fontWeight="700" fill="#141A23">
          단자대 직결 결선
        </text>
        <text x="649" y="95" textAnchor="middle" fontSize="9.5" fill="#047857">
          인덕션 5kW · 튀김기 6kW
        </text>
        <text x="649" y="114" textAnchor="middle" fontSize="9" fill="#475569">
          온수기 별도 회선 분리
        </text>

        <rect x="406" y="150" width="320" height="96" rx="8" fill="#FFFFFF" stroke="#A7F3D0" />
        <text x="420" y="172" fontSize="10.5" fontWeight="700" fill="#065F46">
          안전 시공 3대 기준 요약 (단상 220V 기준)
        </text>
        <text x="420" y="193" fontSize="9.5" fill="#334155">
          • 3.5kW 인덕션 · 온수기: 4.0SQ + 20A 단독 차단기
        </text>
        <text x="420" y="211" fontSize="9.5" fill="#334155">
          • 5~6kW 튀김기 · 머신: 4.0~6.0SQ + 30~40A 직결
        </text>
        <text x="420" y="229" fontSize="9.5" fontWeight="700" fill="#0F766E">
          • 구매 전 220V 단상 vs 380V 삼상 명판 대조 필수
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  32. 카페·주방 인테리어 전 급수·정수·드레인 구배 단면도 (32번 글)        */
/* ------------------------------------------------------------------ */
function CafePlumbingDrainCheckDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="카페 카운터 하부 직수 급수 · 정수필터 · 바닥 배수(구배) 정석 배치 단면"
      caption="타일·상판 마감 전에 15mm 직수 밸브 위치와 바닥 50mm PVC 배수관 구배(1/50 내리막)를 잡아야 제빙기 역류와 커피머신 수압 부족을 막습니다."
    >
      <svg
        viewBox="0 0 760 282"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[560px] h-auto select-none"
      >
        <title id={titleId}>
          카페 바 카운터 하부 에스프레소 머신, 정수필터, 언더카운터 제빙기, 테이블냉장고 배수 구배 및 통풍 단면도
        </title>

        {/* 카운터 상판 & 벽 */}
        <rect x="20" y="64" width="720" height="10" rx="2" fill="#334155" />
        <text x="380" y="54" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          카페 바 카운터 상판 (높이 850~900mm) · 하부 설비 배치 단면
        </text>

        {/* 1. 정수필터 & 15mm 직수 */}
        <rect x="30" y="92" width="124" height="114" rx="8" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5" />
        <text x="92" y="114" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1D4ED8">
          ① 직수·정수필터
        </text>
        <rect x="48" y="128" width="28" height="58" rx="4" fill="#DBEAFE" stroke="#1D4ED8" />
        <rect x="86" y="128" width="28" height="58" rx="4" fill="#DBEAFE" stroke="#1D4ED8" />
        <text x="92" y="199" textAnchor="middle" fontSize="8.5" fill="#1E40AF">
          밸브 2분배 · 전면 접근 위치
        </text>

        {/* 2. 에스프레소 머신 드레인 */}
        <rect x="172" y="24" width="146" height="40" rx="6" fill="#141A23" />
        <text x="245" y="49" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
          에스프레소 머신 (상판 위)
        </text>
        <path d="M245 74 L245 216" stroke="#E8521A" strokeWidth="4" />
        <rect x="176" y="92" width="142" height="114" rx="8" fill="#FFF7ED" stroke="#FDBA74" />
        <text x="247" y="114" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#C2410C">
          ② 고온 보일러 배수
        </text>
        <text x="247" y="138" textAnchor="middle" fontSize="9" fill="#334155">
          내열 호스로 바닥 직결
        </text>
        <text x="247" y="156" textAnchor="middle" fontSize="9" fontWeight="700" fill="#DC2626">
          제빙기 드레인과 직결 금지!
        </text>
        <text x="247" y="176" textAnchor="middle" fontSize="8.5" fill="#475569">
          (열기·증기 역류 시 얼음 녹음)
        </text>

        {/* 3. 언더카운터 제빙기 */}
        <rect x="336" y="88" width="196" height="122" rx="8" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.8" />
        <text x="434" y="110" textAnchor="middle" fontSize="11" fontWeight="700" fill="#047857">
          ③ 언더카운터 제빙기
        </text>
        <text x="434" y="132" textAnchor="middle" fontSize="9.5" fill="#334155">
          전면 타공 루버 (열기 배출 필수)
        </text>
        <text x="434" y="150" textAnchor="middle" fontSize="9.5" fill="#334155">
          자연배수 호스 꺾임·U자 처짐 금지
        </text>
        <rect x="352" y="166" width="164" height="32" rx="4" fill="#FFFFFF" stroke="#6EE7B7" />
        <text x="434" y="186" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0F766E">
          다릿발 수평 + 뒷벽 15cm 여유
        </text>

        {/* 4. 테이블 냉장고 */}
        <rect x="550" y="88" width="186" height="122" rx="8" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
        <text x="643" y="110" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          ④ 테이블·토핑 냉장고
        </text>
        <text x="643" y="134" textAnchor="middle" fontSize="9.5" fill="#334155">
          별도 배수 없음 (제상수 증발)
        </text>
        <text x="643" y="154" textAnchor="middle" fontSize="9.5" fill="#334155">
          벽 뒷면 20A 단독 콘센트 확보
        </text>
        <text x="643" y="182" textAnchor="middle" fontSize="9" fontWeight="700" fill="#C2410C">
          카운터 깊이 750~800mm 여유 확인
        </text>

        {/* 바닥 50mm PVC 배수 구배 */}
        <line x1="20" y1="222" x2="740" y2="222" stroke="#475569" strokeWidth="2" />
        <path d="M160 226 L680 250 L680 264 L160 240 Z" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="1.8" />
        <text x="420" y="246" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1E40AF">
          바닥 매립 50mm PVC 메인 배수관: 내리막 구배 1/50 ~ 1/100 유지 → 메인 유트랩 배출
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  33. 업소용 냉장고 수리비 vs 검수 중고 교체 손익분기 (33번 글)            */
/* ------------------------------------------------------------------ */
function CommercialFridgeRepairRoiDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="업소용 45박스 냉장고 고장 비용 구간별 수리 vs 중고 교체 판단 지표"
      caption="팬 모터·센서·가스켓 등 18만원 이하 소모품 수리는 고쳐 쓰는 편이 이득이지만, 7~8년 이상 노후 기기의 40만원대 콤프레샤·누설 중수리는 보증 포함 중고 교체가 유리한 경우가 많습니다."
    >
      <svg
        viewBox="0 0 760 268"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[560px] h-auto select-none"
      >
        <title id={titleId}>
          업소용 냉장고 수리 비용 구간별 계속 수리 권장과 검수 중고 교체 손익분기 비교 차트
        </title>

        {/* 1. 소모품 수리 구간 */}
        <rect x="16" y="18" width="232" height="232" rx="12" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth="1.5" />
        <text x="32" y="44" fontSize="12" fontWeight="700" fill="#047857">
          1. 소모품 · 단순 수리 (수리 이득)
        </text>
        <rect x="32" y="60" width="200" height="28" rx="6" fill="#0F766E" />
        <text x="132" y="79" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#FFFFFF">
          예상 비용: 5 ~ 18만원 선
        </text>
        <text x="32" y="114" fontSize="10" fontWeight="700" fill="#141A23">
          해당 증상 예시:
        </text>
        <text x="32" y="134" fontSize="9.5" fill="#334155">
          • 기계실 응축기 먼지 세척 · 팬 교체
        </text>
        <text x="32" y="152" fontSize="9.5" fill="#334155">
          • 디지털 온도조절기 · 제상 센서 고장
        </text>
        <text x="32" y="170" fontSize="9.5" fill="#334155">
          • 문짝 고무 가스켓 찢어짐 · 힌지 교정
        </text>
        <rect x="32" y="192" width="200" height="42" rx="6" fill="#FFFFFF" stroke="#A7F3D0" />
        <text x="132" y="217" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#047857">
          결론: 즉시 수리 후 계속 사용 권장
        </text>

        {/* 2. 중수리 경계선 */}
        <rect x="264" y="18" width="232" height="232" rx="12" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1.5" />
        <text x="280" y="44" fontSize="12" fontWeight="700" fill="#C2410C">
          2. 콤프레샤 · 매립 누설 (손익분기)
        </text>
        <rect x="280" y="60" width="200" height="28" rx="6" fill="#E8521A" />
        <text x="380" y="79" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#FFFFFF">
          예상 비용: 35 ~ 55만원+
        </text>
        <text x="280" y="114" fontSize="10" fontWeight="700" fill="#141A23">
          반드시 따져볼 3가지 조건:
        </text>
        <text x="280" y="134" fontSize="9.5" fill="#334155">
          • 제조 연식이 7~10년을 넘었는가?
        </text>
        <text x="280" y="152" fontSize="9.5" fill="#334155">
          • 도어 틀 녹·외관 프레임 결로가 있는가?
        </text>
        <text x="280" y="170" fontSize="9.5" fill="#334155">
          • 발포층 내부 냉매 미세 누설인가?
        </text>
        <rect x="280" y="192" width="200" height="42" rx="6" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="380" y="217" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#C2410C">
          2개 이상 해당 시 연쇄 고장 위험 큼
        </text>

        {/* 3. 검수 중고 맞교체 */}
        <rect x="512" y="18" width="232" height="232" rx="12" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
        <text x="528" y="44" fontSize="12" fontWeight="700" fill="#1D4ED8">
          3. 검수 중고 맞교체 (안전 대안)
        </text>
        <rect x="528" y="60" width="200" height="28" rx="6" fill="#1D4ED8" />
        <text x="628" y="79" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#FFFFFF">
          기존 기기 철거 상계 + 보증 출고
        </text>
        <text x="528" y="114" fontSize="10" fontWeight="700" fill="#141A23">
          맞교체 전환 시 장점:
        </text>
        <text x="528" y="134" fontSize="9.5" fill="#334155">
          • 부품 대기 없이 당일~익일 영업 재개
        </text>
        <text x="528" y="152" fontSize="9.5" fill="#334155">
          • 고온기 냉각·제상 히터 전수 검증 완료
        </text>
        <text x="528" y="170" fontSize="9.5" fill="#334155">
          • 폐기 비용 대신 철거·매입으로 비용 절감
        </text>
        <rect x="528" y="192" width="200" height="42" rx="6" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="628" y="217" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1D4ED8">
          {`${STORE.name}: ${STORE_MERCHANT_POLICY.warrantyMajor}`}
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  34. 에어컨 이전설치 비용 급증 4대 현장 변수 (34번 글)                    */
/* ------------------------------------------------------------------ */
function AirconRelocationCostFactorsDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="에어컨 이전설치 시 기본설치비 외 견적을 키우는 4가지 현장 변수"
      caption="중고나 보유 에어컨을 옮길 때는 기본설치(5m 배관) 외에 배관 추가 길이, 외벽 앵글·위험수당, 콘크리트 타공, 아파트 매립배관 질소세척 여부가 총비용을 좌우합니다."
    >
      <svg
        viewBox="0 0 760 270"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[560px] h-auto select-none"
      >
        <title id={titleId}>
          에어컨 이전설치 시 추가 비용이 커지는 4가지 현장 변수 (배관 연장, 앵글 및 위험수당, 코어 타공, 매립배관 질소세척) 도해
        </title>

        {/* 상단 기준선 */}
        <rect x="16" y="14" width="728" height="44" rx="10" fill="#141A23" />
        <text x="380" y="41" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#FFFFFF">
          총 이전설치비 = 기본설치비(철거·운반·기본 5m) + 아래 4대 현장 변수 추가분
        </text>

        {/* 변수 1 */}
        <rect x="16" y="72" width="174" height="182" rx="10" fill="#FFF7ED" stroke="#FDBA74" />
        <circle cx="42" cy="98" r="11" fill="#E8521A" />
        <text x="42" y="102" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
          1
        </text>
        <text x="60" y="102" fontSize="11" fontWeight="700" fill="#C2410C">
          배관 5m 초과 연장
        </text>
        <text x="28" y="130" fontSize="9.5" fill="#334155">
          • 벽 모서리 따라 길면 m당 추가
        </text>
        <text x="28" y="148" fontSize="9.5" fill="#334155">
          • 2in1·천장형은 2회선 발생
        </text>
        <text x="28" y="166" fontSize="9.5" fill="#334155">
          • 기존 알루미늄관 폐기 후 동관
        </text>
        <rect x="26" y="196" width="154" height="44" rx="6" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="103" y="216" textAnchor="middle" fontSize="9" fontWeight="700" fill="#C2410C">
          줄자로 벽 따라 실측 길이 체크
        </text>
        <text x="103" y="231" textAnchor="middle" fontSize="8.5" fill="#475569">
          (장배관 시 냉매 정량 보충)
        </text>

        {/* 변수 2 */}
        <rect x="200" y="72" width="174" height="182" rx="10" fill="#FEF2F2" stroke="#FCA5A5" />
        <circle cx="226" cy="98" r="11" fill="#DC2626" />
        <text x="226" y="102" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
          2
        </text>
        <text x="244" y="102" fontSize="11" fontWeight="700" fill="#B91C1C">
          외벽 앵글 · 고소작업
        </text>
        <text x="212" y="130" fontSize="9.5" fill="#334155">
          • 바닥 공간 없어 난간 앵글 설치
        </text>
        <text x="212" y="148" fontSize="9.5" fill="#334155">
          • 2층+ 외벽 작업 시 위험수당
        </text>
        <text x="212" y="166" fontSize="9.5" fill="#334155">
          • 옥상·외벽 높을 때 스카이차 호출
        </text>
        <rect x="210" y="196" width="154" height="44" rx="6" fill="#FFFFFF" stroke="#FECACA" />
        <text x="287" y="216" textAnchor="middle" fontSize="9" fontWeight="700" fill="#B91C1C">
          기존 앵글 활용 가능 여부 확인
        </text>
        <text x="287" y="231" textAnchor="middle" fontSize="8.5" fill="#475569">
          (실외기실 내부 거치 시 절감)
        </text>

        {/* 변수 3 */}
        <rect x="384" y="72" width="174" height="182" rx="10" fill="#ECFDF5" stroke="#6EE7B7" />
        <circle cx="410" cy="98" r="11" fill="#0F766E" />
        <text x="410" y="102" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
          3
        </text>
        <text x="428" y="102" fontSize="11" fontWeight="700" fill="#047857">
          벽 타공 · 전용 전기
        </text>
        <text x="396" y="130" fontSize="9.5" fill="#334155">
          • 일반 조적 vs 두꺼운 콘크리트
        </text>
        <text x="396" y="148" fontSize="9.5" fill="#334155">
          • 유리샷시 가공·코어 타공 비용
        </text>
        <text x="396" y="166" fontSize="9.5" fill="#334155">
          • 25평+ 단독 차단기 배선 연장
        </text>
        <rect x="394" y="196" width="154" height="44" rx="6" fill="#FFFFFF" stroke="#A7F3D0" />
        <text x="471" y="216" textAnchor="middle" fontSize="9" fontWeight="700" fill="#047857">
          기존 타공 구멍 재활용 여부 체크
        </text>
        <text x="471" y="231" textAnchor="middle" fontSize="8.5" fill="#475569">
          (관리실 타공 허가 미리 확인)
        </text>

        {/* 변수 4 */}
        <rect x="568" y="72" width="176" height="182" rx="10" fill="#EFF6FF" stroke="#93C5FD" />
        <circle cx="594" cy="98" r="11" fill="#1D4ED8" />
        <text x="594" y="102" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
          4
        </text>
        <text x="612" y="102" fontSize="11" fontWeight="700" fill="#1D4ED8">
          매립배관 질소 세척
        </text>
        <text x="580" y="130" fontSize="9.5" fill="#334155">
          • 아파트 매립관 오일·이물 세척
        </text>
        <text x="580" y="148" fontSize="9.5" fill="#334155">
          • 질소 기밀 40kgf/cm² 검사
        </text>
        <text x="580" y="166" fontSize="9.5" fill="#334155">
          • 동배관 확장 용접·커넥터 작업
        </text>
        <rect x="578" y="196" width="156" height="44" rx="6" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="656" y="216" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1D4ED8">
          구형 R-22 매립관 호환 여부 필수
        </text>
        <text x="656" y="231" textAnchor="middle" fontSize="8.5" fill="#475569">
          (미세 누설 시 노출배관 우회)
        </text>
      </svg>
    </DiagramFigure>
  );
}

export function GuideSectionDiagram({ id }: { id: GuideDiagramId }) {
  switch (id) {
    case "aircon-repair-timeline":
      return <AirconRepairTimelineDiagram />;
    case "voltage-220v-380v-breaker":
      return <VoltageBreakerDiagram />;
    case "startup-power-budget":
      return <StartupPowerBudgetDiagram />;
    case "kw-vs-kwh-water-analogy":
      return <KwVsKwhDiagram />;
    case "clearance-ladder-blueprint":
      return <ClearanceBlueprintDiagram />;
    case "used-vs-new-vs-p2p-flow":
      return <UsedVsStoreFlowDiagram />;
    case "buyback-inspection-points":
      return <BuybackInspectionPointsDiagram />;
    case "aircon-cycle-parts":
      return <AirconCyclePartsDiagram />;
    case "outdoor-unit-weatherproof":
      return <OutdoorUnitWeatherproofDiagram />;
    case "pcb-failure-causes":
      return <PcbFailureCausesDiagram />;
    case "ceiling-vs-stand-install":
      return <CeilingVsStandInstallDiagram />;
    case "defrost-cycle-walkway":
      return <DefrostCycleWalkwayDiagram />;
    case "fixed-speed-vs-inverter":
      return <FixedSpeedVsInverterDiagram />;
    case "fridge-freezer-airflow":
      return <FridgeFreezerAirflowDiagram />;
    case "washer-tub-inspection":
      return <WasherTubInspectionDiagram />;
    case "fridge-tilt-oil-return":
      return <FridgeTiltOilReturnDiagram />;
    case "commercial-45box-cooling":
      return <Commercial45BoxCoolingDiagram />;
    case "icemaker-heat-rejection":
      return <IcemakerHeatRejectionDiagram />;
    case "commercial-dishwasher-setup":
      return <CommercialDishwasherSetupDiagram />;
    case "refrigerant-leak-myth":
      return <RefrigerantLeakMythDiagram />;
    case "aircon-pyeong-sizing":
      return <AirconPyeongSizingDiagram />;
    case "dryer-heatpump-condenser":
      return <DryerHeatpumpCondenserDiagram />;
    case "kimchi-fridge-cooling":
      return <KimchiFridgeCoolingDiagram />;
    case "inverter-duty-cycle-curve":
      return <InverterDutyCycleDiagram />;
    case "aircon-drain-leak-causes":
      return <AirconDrainLeakDiagram />;
    case "aircon-pipe-copper-vs-alu":
      return <AirconPipeComparisonDiagram />;
    case "showcase-condensation-drain":
      return <ShowcaseCondensationDiagram />;
    case "appliance-resale-value-factors":
      return <ApplianceResaleValueDiagram />;
    case "energy-grade-revision-curve":
      return <EnergyGradeRevisionDiagram />;
    case "aircon-single-vs-multi":
      return <AirconSingleVsMultiDiagram />;
    case "induction-wiring-breaker":
      return <InductionWiringBreakerDiagram />;
    case "cafe-plumbing-drain-check":
      return <CafePlumbingDrainCheckDiagram />;
    case "commercial-fridge-repair-roi":
      return <CommercialFridgeRepairRoiDiagram />;
    case "aircon-relocation-cost-factors":
      return <AirconRelocationCostFactorsDiagram />;
  }
}
