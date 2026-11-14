// 파일 경로: components/guide/guide-diagrams.tsx
import React, { useId } from "react";
import { STORE } from "../../lib/site";
import { ICON, Icon } from "../../lib/ui";

export type GuideDiagramId =
  | "aircon-repair-timeline"
  | "voltage-220v-380v-breaker"
  | "startup-power-budget"
  | "kw-vs-kwh-water-analogy"
  | "clearance-ladder-blueprint"
  | "used-vs-new-vs-p2p-flow"
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
  | "aircon-pyeong-sizing";

function DiagramFigure({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="my-5 rounded-2xl border border-[#E2E6EC] bg-[#F8FAFC] p-3.5 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-hb-xs sm:text-hb-sm font-bold text-[#141A23] flex items-center gap-1.5">
          <Icon d={ICON.layers} className="w-4 h-4 text-[#E8521A] shrink-0" />
          <span>{title}</span>
        </p>
        <span className="text-hb-xs font-semibold text-[#64748B] shrink-0">
          현장 도해
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#E2E6EC] bg-white p-2 sm:p-3">
        {children}
      </div>
      <figcaption className="mt-2.5 text-hb-xs text-[#475569] leading-[1.55] [text-wrap:pretty]">
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
          {STORE.name} 검증 연식 · 직영 A/S 체계
        </text>
        <text x="406" y="206" fontSize="11" fill="#334155">
          부품 수급 흔한 주력 모델 + 출고 전 실부하·질소압력 테스트
        </text>
        <text x="406" y="224" fontSize="11" fill="#334155">
          • 기본 성능 위주의 검증된 구조로 잔고장 리스크 축소
        </text>
        <text x="406" y="242" fontSize="11" fill="#0F766E" fontWeight="600">
          • 계약조건별 최대 8개월 무상 A/S (매장 기사 직접 대응)
        </text>
      </svg>
    </DiagramFigure>
  );
}

function VoltageBreakerDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="분전함(두꺼비집) 열었을 때 10초 자가 판별 도해 — 단상 220V vs 삼상 380V"
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
      title="수도관으로 이해하는 계약전력(kW) vs 월 사용량(kWh) 차이"
      caption="계약전력(kW)은 동시에 켤 수 있는 최대 크기이고, 사용량(kWh)은 한 달 동안 누적해서 돌린 총량을 뜻합니다."
    >
      <svg
        viewBox="0 0 760 220"
        className="w-full min-w-[540px] h-auto block font-sans"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          계약전력 kW와 전력량 kWh의 개념 차이를 수도관과 물탱크에 비유한 도해
        </title>

        {/* kW 수도관 카드 */}
        <rect x="16" y="16" width="352" height="188" rx="12" fill="#F8FAFC" stroke="#CBD2DC" />
        <text x="34" y="42" fontSize="14" fontWeight="700" fill="#E8521A">
          kW (킬로와트) = 수도관 굵기 · 그릇 크기
        </text>
        {/* 두꺼운 파이프 vs 얇은 파이프 */}
        <rect x="34" y="62" width="120" height="16" rx="4" fill="#94A3B8" />
        <text x="166" y="75" fontSize="11" fontWeight="700" fill="#334155">
          5kW 관 (가정 · 소형 점포)
        </text>
        <rect x="34" y="88" width="120" height="32" rx="6" fill="#141A23" />
        <text x="166" y="109" fontSize="11" fontWeight="700" fill="#141A23">
          15kW 관 (중대형 식당·카페)
        </text>
        <text x="34" y="150" fontSize="11" fill="#334155">
          • 기계들을 한꺼번에 켰을 때 버티는 순간 한계치
        </text>
        <text x="34" y="170" fontSize="11" fill="#334155">
          • 상가 일반용은 계약한 kW 수만큼 매달 기본요금 부과
        </text>
        <text x="34" y="188" fontSize="11" fontWeight="600" fill="#B91C1C">
          • 부족하면 한전 증설(승압) 공사 필요
        </text>

        {/* kWh 물탱크 카드 */}
        <rect x="392" y="16" width="352" height="188" rx="12" fill="#F0FDFA" stroke="#99F6E4" />
        <text x="410" y="42" fontSize="14" fontWeight="700" fill="#0F766E">
          kWh (킬로와트시) = 한 달간 받아 쓴 물 총량
        </text>

        <rect x="410" y="60" width="94" height="68" rx="8" fill="#FFFFFF" stroke="#0F766E" strokeWidth="2" />
        <rect x="414" y="88" width="86" height="36" rx="4" fill="#CCFBF1" />
        <text x="457" y="110" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0F766E">
          kW × 시간
        </text>
        <text x="518" y="82" fontSize="12" fontWeight="700" fill="#141A23">
          예: 2kW 기기를 3시간 켜면
        </text>
        <text x="518" y="102" fontSize="12" fontWeight="700" fill="#0F766E">
          → 2 × 3 = 6kWh 사용
        </text>

        <text x="410" y="150" fontSize="11" fill="#334155">
          • 계량기에 누적되는 한 달 전기 사용량
        </text>
        <text x="410" y="170" fontSize="11" fill="#334155">
          • 가정용(주택용)은 많이 쓸수록 단가가 뛰는 누진제 적용
        </text>
        <text x="410" y="188" fontSize="11" fontWeight="600" fill="#0F766E">
          • 상가 일반용은 누진제 대신 계절별 단일 단가 적용
        </text>
      </svg>
    </DiagramFigure>
  );
}

function ClearanceBlueprintDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="위에서 내려다본 현관 통과 폭 & 냉장고 문짝 분리 · 45박스 반입 평면도"
      caption="제품 놓을 자리(가로 95cm)만 보고 주문하면 현관 중문·복도 90도 코너에서 걸립니다. 문틀 안쪽 실제 폭과 회전 공간을 꼭 재야 합니다."
    >
      <svg
        viewBox="0 0 760 270"
        className="w-full min-w-[540px] h-auto block font-sans"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          가정용 양문형 냉장고 도어 분리 통과 폭과 업소용 45박스 일체형 냉장고 평면 치수 도해
        </title>

        {/* 왼쪽: 가정용 양문형 / 중문 & 90도 복도 */}
        <rect x="16" y="14" width="352" height="242" rx="12" fill="#F8FAFC" stroke="#CBD2DC" />
        <text x="32" y="38" fontSize="13" fontWeight="700" fill="#141A23">
          1. 가정용 양문형·4도어 (문짝 분리 효과)
        </text>

        {/* 벽면 & 좁은 문틀 78cm */}
        <rect x="34" y="64" width="120" height="12" fill="#334155" />
        <rect x="234" y="64" width="116" height="12" fill="#334155" />
        <line x1="154" y1="54" x2="234" y2="54" stroke="#E8521A" strokeWidth="2" />
        <text x="194" y="49" textAnchor="middle" fontSize="11" fontWeight="700" fill="#E8521A">
          문 유효폭 약 78cm
        </text>

        {/* 냉장고 본체 vs 문짝 분리 */}
        <rect x="140" y="92" width="108" height="62" rx="6" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2" />
        <text x="194" y="120" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1E40AF">
          본체 깊이 72~76cm
        </text>
        <text x="194" y="138" textAnchor="middle" fontSize="10" fill="#1E40AF">
          (도어 분리 시 통과)
        </text>

        {/* 점선: 문짝 부착 시 88~92cm */}
        <rect x="140" y="154" width="108" height="16" rx="3" fill="#FEE2E2" stroke="#DC2626" strokeDasharray="3 3" />
        <text x="194" y="185" textAnchor="middle" fontSize="11" fontWeight="700" fill="#B91C1C">
          문짝 포함 시 깊이 88~92cm (걸림)
        </text>

        <rect x="32" y="198" width="320" height="46" rx="8" fill="#FFFFFF" stroke="#E2E6EC" />
        <text x="44" y="217" fontSize="11" fill="#334155">
          • 문손잡이·경첩 제외한 문틀 안쪽 알짜 폭 확인 필수
        </text>
        <text x="44" y="235" fontSize="11" fontWeight="600" fill="#141A23">
          • 90도 꺾이는 복도는 대각선 회전을 위해 85cm 이상 권장
        </text>

        {/* 오른쪽: 업소용 45박스 일체형 */}
        <rect x="392" y="14" width="352" height="242" rx="12" fill="#FFFBF7" stroke="#FDBA74" />
        <text x="408" y="38" fontSize="13" fontWeight="700" fill="#C2410C">
          2. 업소용 45박스 (일체형 바디 · 분해 불가)
        </text>

        {/* 45박스 스텐 몸체 1260 x 800 */}
        <rect x="448" y="70" width="210" height="92" rx="6" fill="#E2E8F0" stroke="#475569" strokeWidth="2" />
        <text x="553" y="106" textAnchor="middle" fontSize="12" fontWeight="700" fill="#141A23">
          가로 약 1,260mm × 깊이 800mm+
        </text>
        <text x="553" y="126" textAnchor="middle" fontSize="11" fontWeight="700" fill="#B91C1C">
          통짜 철제 프레임 (깊이 축소 불가!)
        </text>
        <text x="553" y="146" textAnchor="middle" fontSize="11" fill="#334155">
          주방 출입구 순수 통과 폭 최소 85cm+ 필수
        </text>

        <rect x="408" y="178" width="320" height="66" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="420" y="197" fontSize="11" fontWeight="700" fill="#141A23">
          사다리차 호출 판정 기준
        </text>
        <text x="420" y="216" fontSize="11" fill="#475569">
          1) 엘리베이터 깊이·문폭 미달 / 2층 이상 좁은 계단 참
        </text>
        <text x="420" y="234" fontSize="11" fill="#475569">
          2) 홀 바닥·유리문 손상 막으려 2층 창문 직접 반입 시
        </text>
      </svg>
    </DiagramFigure>
  );
}

function UsedVsStoreFlowDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="개인 간 직거래 vs 직영 전문 매장 구매 과정 및 사후 책임 비교 흐름"
      caption="중고가전은 기계 값뿐 아니라 운반·설치·내부 위생·고장 시 A/S 부담까지 전 과정을 함께 비교해야 실제 손익을 정확히 알 수 있습니다."
    >
      <svg
        viewBox="0 0 760 220"
        className="w-full min-w-[540px] h-auto block font-sans"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          개인 간 직거래와 직영 전문 매장의 배송 설치 및 A/S 보증 흐름 비교 도해
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
          숨은 누설·냄새 위험
        </text>

        <path d="M563 63 L579 63" stroke="#CBD2DC" strokeWidth="2" />

        <rect x="583" y="34" width="161" height="58" rx="8" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="663" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="#B91C1C">
          4. 고장 시 보증 공백
        </text>
        <text x="663" y="75" textAnchor="middle" fontSize="10" fill="#B91C1C">
          수리비 본인 전액 부담
        </text>

        {/* 하단: 직영 매장 */}
        <text x="16" y="122" fontSize="12" fontWeight="700" fill="#141A23">
          {STORE.name} 직영 매장 (원스톱 책임 보증 흐름)
        </text>
        <rect x="16" y="132" width="164" height="68" rx="8" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <text x="98" y="156" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          1. 정식 결제 · 세무 증빙
        </text>
        <text x="98" y="176" textAnchor="middle" fontSize="10" fill="#475569">
          카드 · 전자세금계산서
        </text>

        <path d="M185 166 L201 166" stroke="#E8521A" strokeWidth="2" />

        <rect x="205" y="132" width="164" height="68" rx="8" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <text x="287" y="156" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          2. 분해 세척 · 시운전
        </text>
        <text x="287" y="176" textAnchor="middle" fontSize="10" fill="#475569">
          고장 여부 사전 검수 완료
        </text>

        <path d="M374 166 L390 166" stroke="#E8521A" strokeWidth="2" />

        <rect x="394" y="132" width="164" height="68" rx="8" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <text x="476" y="156" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          3. 직영 기사 운반·설치
        </text>
        <text x="476" y="176" textAnchor="middle" fontSize="10" fill="#475569">
          수평 · 배관 마무리 지원
        </text>

        <path d="M563 166 L579 166" stroke="#E8521A" strokeWidth="2" />

        <rect x="583" y="132" width="161" height="68" rx="8" fill="#FFF4EE" stroke="#E8521A" strokeWidth="1.5" />
        <text x="663" y="156" textAnchor="middle" fontSize="11" fontWeight="700" fill="#C2410C">
          4. 무상 A/S 책임 보증
        </text>
        <text x="663" y="176" textAnchor="middle" fontSize="10" fill="#C2410C">
          에어컨 8개월 / 일반 4개월
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
  const titleId = useId();
  return (
    <DiagramFigure
      title="에어컨 실외기 내부 방수·방진 설계 vs 실제 고장 예외"
      caption="비·바람은 상판 구조와 바닥 배수 구멍, 상부 밀폐 코팅 기판으로 막아내지만, 고압 세척·바닥 침수·실외기실 열기 축적에는 취약합니다."
    >
      <svg
        viewBox="0 0 760 272"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          실외기 내부 단면 방수 코팅, 상단 PCB 위치, 하단 물빠짐 홀, 방진 고무와 주의 예외 사항 도해
        </title>

        {/* 빗방울 표현 */}
        <text x="240" y="22" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1D4ED8">
          자연 비·눈 (상판 겹침 구조로 빗물 차단 및 하단 배수)
        </text>
        <path d="M90 26 L84 36 M160 26 L154 36 M230 26 L224 36 M310 26 L304 36 M390 26 L384 36" stroke="#60A5FA" strokeWidth="2" />

        {/* 실외기 외함 */}
        <rect x="28" y="42" width="424" height="202" rx="10" fill="#F8FAFC" stroke="#141A23" strokeWidth="2" />
        {/* 상단 방수 덮개 */}
        <rect x="24" y="38" width="432" height="18" rx="4" fill="#1E293B" />
        <text x="240" y="51" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
          아연도금 강판 · 분체 도장 방수 상판 (직접 낙수 유입 차단)
        </text>

        {/* 좌측 열교환기 & 팬 영역 */}
        <rect x="44" y="68" width="220" height="148" rx="8" fill="#EFF6FF" stroke="#93C5FD" />
        <circle cx="154" cy="134" r="48" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2" />
        <circle cx="154" cy="134" r="10" fill="#1E293B" />
        <path d="M154 90 Q176 112 154 134 Q132 112 154 90 M154 178 Q176 156 154 134 Q132 156 154 178 M110 134 Q132 112 154 134 Q132 156 110 134 M198 134 Q176 112 154 134 Q176 156 198 134" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="1" />
        <text x="154" y="202" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1D4ED8">
          방열 알루미늄 핀 + 밀폐 팬모터
        </text>

        {/* 우측 상단 PCB 구획 */}
        <rect x="278" y="68" width="158" height="72" rx="8" fill="#FFF4EE" stroke="#E8521A" strokeWidth="1.5" />
        <text x="357" y="88" textAnchor="middle" fontSize="11" fontWeight="700" fill="#C2410C">
          상부 밀폐 PCB · 단자함
        </text>
        <text x="357" y="106" textAnchor="middle" fontSize="9.5" fill="#475569">
          가장 높은 곳에 거꾸로 수직 배치
        </text>
        <text x="357" y="122" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#0F766E">
          실리콘 방습 코팅 적용
        </text>

        {/* 우측 하단 컴프레서 + 방진고무 */}
        <rect x="292" y="150" width="130" height="58" rx="10" fill="#FFFFFF" stroke="#141A23" strokeWidth="1.5" />
        <text x="357" y="174" textAnchor="middle" fontSize="11" fontWeight="700" fill="#141A23">
          완전 밀폐 압축기
        </text>
        <text x="357" y="192" textAnchor="middle" fontSize="9.5" fill="#475569">
          철제 용접 쉘 (내부 수분 차단)
        </text>
        {/* 방진고무 */}
        <rect x="308" y="208" width="24" height="10" rx="2" fill="#475569" />
        <rect x="382" y="208" width="24" height="10" rx="2" fill="#475569" />
        <text x="357" y="232" textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155">
          하부 방진 고무 (충격·진동 흡수)
        </text>

        {/* 하단 물빠짐 홀 */}
        <path d="M84 244 L84 260 M154 244 L154 260 M224 244 L224 260" stroke="#3B82F6" strokeWidth="2" strokeDasharray="3 3" />
        <text x="154" y="266" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1D4ED8">
          바닥 배수 홀로 빗물 즉시 배출
        </text>

        {/* 우측: 실제 고장이 나는 3가지 예외 */}
        <rect x="472" y="38" width="272" height="206" rx="10" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="488" y="60" fontSize="12" fontWeight="700" fill="#DC2626">
          실외기 고장을 부르는 3대 예외 상황
        </text>

        <rect x="488" y="72" width="240" height="48" rx="7" fill="#FFFFFF" stroke="#FECACA" />
        <text x="500" y="92" fontSize="10.5" fontWeight="700" fill="#141A23">
          1. 위·전면에서 고압 호스 물 직분사
        </text>
        <text x="500" y="109" fontSize="9.5" fill="#475569">
          틈새 역류로 상단 PCB·팬 베어링 침수 위험
        </text>

        <rect x="488" y="128" width="240" height="48" rx="7" fill="#FFFFFF" stroke="#FECACA" />
        <text x="500" y="148" fontSize="10.5" fontWeight="700" fill="#141A23">
          2. 폭우 시 바닥 수위 상승 · 침수
        </text>
        <text x="500" y="165" fontSize="9.5" fill="#475569">
          반지하·저지대 바닥 거치 시 모터·단자 수몰
        </text>

        <rect x="488" y="184" width="240" height="48" rx="7" fill="#FFFFFF" stroke="#FECACA" />
        <text x="500" y="204" fontSize="10.5" fontWeight="700" fill="#141A23">
          3. 밀폐된 실외기실 열기 축적 (루버 닫힘)
        </text>
        <text x="500" y="221" fontSize="9.5" fill="#475569">
          열풍 순환 안 돼 내부 70도+ 과열 차단
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  9. PCB 역할 및 4대 고장 원인 도해 (10번 글)                          */
/* ------------------------------------------------------------------ */
function PcbFailureCausesDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="에어컨의 두뇌 PCB 역할과 현장에서 가장 흔한 고장 원인 4가지"
      caption="인버터 에어컨은 고집적 회로(PCB)가 전압과 냉매 흐름을 초 단위로 제어하기 때문에 전기 충격·열기·습기·벌레 유입에 특히 민감합니다."
    >
      <svg
        viewBox="0 0 760 250"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          에어컨 메인보드 PCB의 역할과 서지, 고온 과열, 결로 습기, 벌레 합선 4가지 고장 원인
        </title>

        {/* 상단 중앙 PCB 코어 */}
        <rect x="190" y="14" width="380" height="58" rx="10" fill="#141A23" />
        <text x="380" y="38" textAnchor="middle" fontSize="13" fontWeight="700" fill="#FFFFFF">
          PCB (인쇄회로기판 · 에어컨 두뇌 및 전력 변환 제어)
        </text>
        <text x="380" y="58" textAnchor="middle" fontSize="10.5" fill="#CBD5E1">
          온도센서 판독 · 실내외 통신 · IPM 파워모듈(압축기 가변 회전) 구동
        </text>

        {/* 연결선 */}
        <path d="M100 106 L100 84 L380 84 L380 72" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
        <path d="M286 106 L286 84" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
        <path d="M474 106 L474 84" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
        <path d="M660 106 L660 84 L380 84" fill="none" stroke="#94A3B8" strokeWidth="1.5" />

        {/* 원인 1 */}
        <rect x="16" y="106" width="168" height="128" rx="10" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.5" />
        <text x="100" y="128" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#DC2626">
          1. 전력 서지 · 과전류
        </text>
        <text x="100" y="150" textAnchor="middle" fontSize="10" fill="#334155">
          낙뢰·정전 후 복전 충격
        </text>
        <text x="100" y="168" textAnchor="middle" fontSize="10" fill="#334155">
          불안정한 건물 분전함 전압
        </text>
        <rect x="28" y="186" width="144" height="36" rx="6" fill="#FFFFFF" stroke="#FECACA" />
        <text x="100" y="208" textAnchor="middle" fontSize="10" fontWeight="700" fill="#DC2626">
          IPM 모듈 소손 · 전원 무응답
        </text>

        {/* 원인 2 */}
        <rect x="202" y="106" width="168" height="128" rx="10" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1.5" />
        <text x="286" y="128" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#C2410C">
          2. 고온 · 통풍 불량
        </text>
        <text x="286" y="150" textAnchor="middle" fontSize="10" fill="#334155">
          실외기실 루버창 닫고 가동
        </text>
        <text x="286" y="168" textAnchor="middle" fontSize="10" fill="#334155">
          기판 주변 70도 이상 과열
        </text>
        <rect x="214" y="186" width="144" height="36" rx="6" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="286" y="208" textAnchor="middle" fontSize="10" fontWeight="700" fill="#C2410C">
          콘덴서 부풀음 · 납땜 들뜸
        </text>

        {/* 원인 3 */}
        <rect x="388" y="106" width="168" height="128" rx="10" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
        <text x="472" y="128" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#1D4ED8">
          3. 습기 · 결로 부식
        </text>
        <text x="472" y="150" textAnchor="middle" fontSize="10" fill="#334155">
          배관 결로수·세척 시 물 튐
        </text>
        <text x="472" y="168" textAnchor="middle" fontSize="10" fill="#334155">
          장마철 다습 환경 장기 방치
        </text>
        <rect x="400" y="186" width="144" height="36" rx="6" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="472" y="208" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1D4ED8">
          동박 패턴 부식 · 통신 에러
        </text>

        {/* 원인 4 */}
        <rect x="574" y="106" width="170" height="128" rx="10" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <text x="659" y="128" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#141A23">
          4. 개미 · 벌레 유입 쇼트
        </text>
        <text x="659" y="150" textAnchor="middle" fontSize="10" fill="#334155">
          보드 발열·정전기 찾아 침투
        </text>
        <text x="659" y="168" textAnchor="middle" fontSize="10" fill="#334155">
          전원 핀 사이 몸체가 닿음
        </text>
        <rect x="586" y="186" width="146" height="36" rx="6" fill="#FFFFFF" stroke="#E2E6EC" />
        <text x="659" y="208" textAnchor="middle" fontSize="10" fontWeight="700" fill="#141A23">
          트래킹 합선 · 보드 검게 탐
        </text>
      </svg>
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
  const titleId = useId();
  return (
    <DiagramFigure
      title="세탁기 겉만 닦은 직거래에서 안 보이는 3곳 vs 120bar 분해 검수"
      caption="세탁기는 겉면이 깨끗해도 세탁조 바깥 곰팡이·하부 스파이더 베어링·배수 펌프 상태를 열어보지 않으면 알 수 없습니다."
    >
      <svg
        viewBox="0 0 760 258"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          중고 세탁기 직거래 시 숨은 고장 포인트 3가지와 전문 분해 세척 비교
        </title>

        <rect x="16" y="14" width="350" height="230" rx="12" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.5" />
        <text x="34" y="38" fontSize="12.5" fontWeight="700" fill="#DC2626">
          개인 직거래 · 단순 청소 제품 (숨은 리스크)
        </text>

        <rect x="34" y="54" width="314" height="52" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="48" y="75" fontSize="11" fontWeight="700" fill="#141A23">
          1. 세탁조 바깥통 검은 물때 · 곰팡이
        </text>
        <text x="48" y="95" fontSize="10" fill="#475569">
          통 안쪽만 닦아 안 보이지만 빨래 후 검은 가루·악취 발생
        </text>

        <rect x="34" y="114" width="314" height="52" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="48" y="135" fontSize="11" fontWeight="700" fill="#141A23">
          2. 하부 스파이더 · 베어링 부식
        </text>
        <text x="48" y="155" fontSize="10" fill="#475569">
          물 채운 탈수 테스트 없이 구매 시 헬리콥터 굉음 발생
        </text>

        <rect x="34" y="174" width="314" height="54" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="48" y="195" fontSize="11" fontWeight="700" fill="#141A23">
          3. 배수펌프 찌꺼기 막힘 · 쇼바 노후
        </text>
        <text x="48" y="215" fontSize="10" fill="#475569">
          동전·섬유 찌꺼기 낌 및 탈수 시 세탁기 전체 흔들림·에러
        </text>

        <rect x="394" y="14" width="350" height="230" rx="12" fill="#F0FDFA" stroke="#5EEAD4" strokeWidth="1.5" />
        <text x="412" y="38" fontSize="12.5" fontWeight="700" fill="#0F766E">
          {STORE.name} 120bar 분해 세척 · 실부하 검수
        </text>

        <rect x="412" y="54" width="314" height="52" rx="8" fill="#FFFFFF" stroke="#CCFBF1" />
        <text x="426" y="75" fontSize="11" fontWeight="700" fill="#0F766E">
          1. 내조·외조 완전 탈거 120bar 고압 살균
        </text>
        <text x="426" y="95" fontSize="10" fill="#334155">
          스파이더 날개·세제 투입구까지 완전 분해 세척 완료
        </text>

        <rect x="412" y="114" width="314" height="52" rx="8" fill="#FFFFFF" stroke="#CCFBF1" />
        <text x="426" y="135" fontSize="11" fontWeight="700" fill="#0F766E">
          2. 고속 탈수 진동 · 배수 펌프 실부하 통과
        </text>
        <text x="426" y="155" fontSize="10" fill="#334155">
          베어링 소음 및 급수·배수 밸브 누수 여부 연속 테스트
        </text>

        <rect x="412" y="174" width="314" height="54" rx="8" fill="#FFF4EE" stroke="#FDBA74" />
        <text x="426" y="195" fontSize="11" fontWeight="700" fill="#C2410C">
          3. 기사 수평 설치 + 최대 4개월 무상 A/S
        </text>
        <text x="426" y="215" fontSize="10" fill="#334155">
          설치 당일 수평·배수 확인 및 계약 조건별 보증 지원
        </text>
      </svg>
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
      title="업소용 45박스 냉장·냉동고 직냉식 vs 간냉식 비교 & 주방 열기 주의"
      caption="식자재 수분 보존이 중요한 육류·신선재료는 직냉식, 문 여닫음이 잦은 홀·음료·급속냉각은 간냉식이 유리하며 화구와는 반드시 거리를 둬야 합니다."
    >
      <svg
        viewBox="0 0 760 272"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          업소용 45박스 직냉식과 간냉식의 냉각 원리 비교 및 주방 화구 이격 안내 도해
        </title>

        {/* 직냉식 */}
        <rect x="16" y="14" width="350" height="174" rx="12" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
        <text x="34" y="38" fontSize="12.5" fontWeight="700" fill="#1D4ED8">
          직냉식 (벽면 파이프 자연 대류 냉각)
        </text>
        <text x="34" y="64" fontSize="10.5" fill="#141A23">
          • 원리: 내벽 속 냉매관이 직접 차가워져 조용히 식힘
        </text>
        <text x="34" y="86" fontSize="10.5" fontWeight="700" fill="#0F766E">
          • 장점: 바람이 안 불어 고기·야채 수분이 덜 마름 / 구조 단순
        </text>
        <text x="34" y="108" fontSize="10.5" fill="#DC2626">
          • 주의: 냉동 칸 벽면에 성에가 생겨 주기적으로 긁어줘야 함
        </text>
        <text x="34" y="132" fontSize="10.5" fill="#334155">
          • 주의: 아날로그 다이얼 눈금(강/약) 높이면 냉장실 식자재 어는 경우
        </text>
        <rect x="34" y="146" width="314" height="30" rx="6" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="191" y="165" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1D4ED8">
          추천 업종: 정육점 · 한식 반찬 보관 · 소음 민감 조용한 주방
        </text>

        {/* 간냉식 */}
        <rect x="394" y="14" width="350" height="174" rx="12" fill="#FFF4EE" stroke="#FDBA74" strokeWidth="1.5" />
        <text x="412" y="38" fontSize="12.5" fontWeight="700" fill="#C2410C">
          간냉식 (내부 송풍 팬 강제 냉기 순환)
        </text>
        <text x="412" y="64" fontSize="10.5" fill="#141A23">
          • 원리: 숨은 냉각기 + 팬으로 칸마다 찬바람을 강하게 뿜음
        </text>
        <text x="412" y="86" fontSize="10.5" fontWeight="700" fill="#0F766E">
          • 장점: 자동 제상으로 성에 안 낌 / 문 자주 열어도 온도 회복 빠름
        </text>
        <text x="412" y="108" fontSize="10.5" fill="#DC2626">
          • 주의: 냉기 팬 앞을 박스·비닐로 막으면 냉각 순환 차단됨
        </text>
        <text x="412" y="132" fontSize="10.5" fill="#334155">
          • 주의: 마르는 식자재는 반드시 밀폐 용기/랩 보관 필요
        </text>
        <rect x="412" y="146" width="314" height="30" rx="6" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="569" y="165" textAnchor="middle" fontSize="10" fontWeight="700" fill="#C2410C">
          추천 업종: 바쁜 식당 메인 주방 · 카페 · 술집 급속 냉각
        </text>

        {/* 하단 공통 주방 배치 */}
        <rect x="16" y="198" width="728" height="60" rx="10" fill="#141A23" />
        <text x="380" y="222" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#FF8A50">
          직냉식·간냉식 공통 고장 예방 수칙
        </text>
        <text x="380" y="244" textAnchor="middle" fontSize="10.5" fill="#FFFFFF">
          1) 화구(가스불·튀김기)에서 50cm 이상 이격 2) 상부·하부 기계실 앞 가림막 금지 3) 하단 응축기 먼지망 월 1회 청소
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  17. 제빙기 얼음 안 얼 때 4대 원인 도해 (18번 글)                      */
/* ------------------------------------------------------------------ */
function IcemakerHeatRejectionDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="업소용 제빙기 얼음이 안 얼거나 얇게 나올 때 현장 점검 4포인트"
      caption="제빙기 불량의 절반 이상은 냉동 고장이 아니라 더운 주방 온도·벽 밀착 방열 불량·먼지망 막힘·정수필터 수압 저하 때문입니다."
    >
      <svg
        viewBox="0 0 760 250"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          업소용 제빙기 제빙 불량 원인 4가지(방열 통풍, 응축기 먼지, 수온·수압, 펌프·커튼 스케일) 도해
        </title>

        <rect x="16" y="16" width="170" height="218" rx="10" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="101" y="42" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#DC2626">
          1. 주변 고온 · 밀착
        </text>
        <text x="101" y="68" textAnchor="middle" fontSize="10" fill="#334155">
          상온 32℃ 초과 주방이나
        </text>
        <text x="101" y="86" textAnchor="middle" fontSize="10" fill="#334155">
          싱크대·벽에 바짝 붙인
        </text>
        <text x="101" y="104" textAnchor="middle" fontSize="10" fill="#334155">
          공랭식 열 방출 막힘
        </text>
        <rect x="28" y="132" width="146" height="84" rx="6" fill="#FFFFFF" stroke="#FECACA" />
        <text x="101" y="162" textAnchor="middle" fontSize="10" fontWeight="700" fill="#DC2626">
          최소 15~20cm 통풍 확보
        </text>
        <text x="101" y="186" textAnchor="middle" fontSize="9.5" fill="#475569">
          (밀폐 카운터 내 매립 시
        </text>
        <text x="101" y="202" textAnchor="middle" fontSize="9.5" fill="#475569">
          전면 흡배기형·수랭식 필수)
        </text>

        <rect x="200" y="16" width="170" height="218" rx="10" fill="#FFF7ED" stroke="#FDBA74" />
        <text x="285" y="42" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#C2410C">
          2. 콘덴서 먼지 뭉침
        </text>
        <text x="285" y="68" textAnchor="middle" fontSize="10" fill="#334155">
          카페 바닥 원두 가루·기름때가
        </text>
        <text x="285" y="86" textAnchor="middle" fontSize="10" fill="#334155">
          하부 촘촘한 냉각 핀에
        </text>
        <text x="285" y="104" textAnchor="middle" fontSize="10" fill="#334155">
          부직포처럼 두껍게 막힘
        </text>
        <rect x="212" y="132" width="146" height="84" rx="6" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="285" y="162" textAnchor="middle" fontSize="10" fontWeight="700" fill="#C2410C">
          제빙 시간 2배 지연
        </text>
        <text x="285" y="186" textAnchor="middle" fontSize="9.5" fill="#475569">
          월 1~2회 브러시/청소기 청소
        </text>
        <text x="285" y="202" textAnchor="middle" fontSize="9.5" fill="#475569">
          만으로 정상 복구 다수
        </text>

        <rect x="384" y="16" width="170" height="218" rx="10" fill="#EFF6FF" stroke="#93C5FD" />
        <text x="469" y="42" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#1D4ED8">
          3. 필터 막힘 · 뜨거운 물
        </text>
        <text x="469" y="68" textAnchor="middle" fontSize="10" fill="#334155">
          정수기 필터 교체 시기 지나
        </text>
        <text x="469" y="86" textAnchor="middle" fontSize="10" fill="#334155">
          수압 급감 또는 여름철
        </text>
        <text x="469" y="104" textAnchor="middle" fontSize="10" fill="#334155">
          급수 온도 상승으로 미결빙
        </text>
        <rect x="396" y="132" width="146" height="84" rx="6" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="469" y="162" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1D4ED8">
          얇고 구멍 뚫린 얼음
        </text>
        <text x="469" y="186" textAnchor="middle" fontSize="9.5" fill="#475569">
          정수 필터 주기적 교체 및
        </text>
        <text x="469" y="202" textAnchor="middle" fontSize="9.5" fill="#475569">
          급수 밸브 개방 상태 확인
        </text>

        <rect x="568" y="16" width="176" height="218" rx="10" fill="#F0FDFA" stroke="#5EEAD4" />
        <text x="656" y="42" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#0F766E">
          4. 스케일 · 센서 오작동
        </text>
        <text x="656" y="68" textAnchor="middle" fontSize="10" fill="#334155">
          수조 물때로 워터펌프 막힘,
        </text>
        <text x="656" y="86" textAnchor="middle" fontSize="10" fill="#334155">
          만빙 감지 커튼 스위치에
        </text>
        <text x="656" y="104" textAnchor="middle" fontSize="10" fill="#334155">
          얼음 걸림 시 작동 정지
        </text>
        <rect x="580" y="132" width="152" height="84" rx="6" fill="#FFFFFF" stroke="#CCFBF1" />
        <text x="656" y="162" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0F766E">
          정기 살균 및 스케일 제거
        </text>
        <text x="656" y="186" textAnchor="middle" fontSize="9.5" fill="#475569">
          매장 출고 전 고압 스팀과
        </text>
        <text x="656" y="202" textAnchor="middle" fontSize="9.5" fill="#475569">
          연속 제빙 테스트 완료
        </text>
      </svg>
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
      title="업소용 도어형 식기세척기 설치 전 필수 3대 인프라 (온수·전기·배수)"
      caption="식기세척기는 본체만 사오면 안 돌아갑니다. 60℃ 이상 온수기, 3~5kW 전용 전원, 본체보다 낮은 바닥 배수구가 세트로 갖춰져야 정상 작동합니다."
    >
      <svg
        viewBox="0 0 760 254"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          업소용 식기세척기와 전용 전기 온수기, 전용 차단기 배선, 자연배수 바닥 높이 연결 조건 도해
        </title>

        {/* 중앙 식기세척기 본체 */}
        <rect x="290" y="34" width="180" height="170" rx="12" fill="#141A23" />
        <text x="380" y="72" textAnchor="middle" fontSize="13" fontWeight="700" fill="#FFFFFF">
          업소용 도어형
        </text>
        <text x="380" y="94" textAnchor="middle" fontSize="13" fontWeight="700" fill="#FFFFFF">
          식기세척기
        </text>
        <rect x="308" y="114" width="144" height="70" rx="8" fill="#1E293B" stroke="#475569" />
        <text x="380" y="140" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#FF8A50">
          헹굼 80℃+ 살균 고압
        </text>
        <text x="380" y="160" textAnchor="middle" fontSize="10" fill="#CBD5E1">
          소비전력 약 3.5~5.5kW
        </text>

        {/* 1. 온수기 */}
        <rect x="16" y="20" width="234" height="96" rx="10" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
        <text x="32" y="44" fontSize="11.5" fontWeight="700" fill="#1D4ED8">
          1. 전용 온수기 (50~80L 권장)
        </text>
        <text x="32" y="66" fontSize="10" fill="#334155">
          찬물만 넣으면 세척기 내부 히터가
        </text>
        <text x="32" y="84" fontSize="10" fill="#334155">
          계속 데우느라 대기 길어지고 기름 안 씻김
        </text>
        <text x="32" y="102" fontSize="9.5" fontWeight="700" fill="#1D4ED8">
          (수압 약한 매장은 가압펌프 추가 필요)
        </text>
        <path d="M250 68 L286 68" stroke="#1D4ED8" strokeWidth="2.5" />

        {/* 2. 전용 전기 */}
        <rect x="16" y="134" width="234" height="98" rx="10" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1.5" />
        <text x="32" y="158" fontSize="11.5" fontWeight="700" fill="#C2410C">
          2. 전용 차단기 직결 전기 (220V/380V)
        </text>
        <text x="32" y="180" fontSize="10" fill="#334155">
          일반 콘센트·멀티탭 꽂으면 차단기 트립
        </text>
        <text x="32" y="198" fontSize="10" fill="#334155">
          매물 명판의 단상(220V)·삼상(380V)과
        </text>
        <text x="32" y="216" fontSize="10" fontWeight="700" fill="#C2410C">
          차단기 30~40A 전선 굵기 사전 확인
        </text>
        <path d="M250 180 L286 180" stroke="#E8521A" strokeWidth="2.5" />

        {/* 3. 배수 & 세제 */}
        <rect x="510" y="20" width="234" height="96" rx="10" fill="#F0FDFA" stroke="#5EEAD4" strokeWidth="1.5" />
        <text x="526" y="44" fontSize="11.5" fontWeight="700" fill="#0F766E">
          3. 바닥 배수구 높이 (자연배수 확인)
        </text>
        <text x="526" y="66" fontSize="10" fill="#334155">
          펌프 내장형이 아닌 자연배수 방식은
        </text>
        <text x="526" y="84" fontSize="10" fill="#334155">
          세척기 배수 출구보다 주방 바닥 배수구가
        </text>
        <text x="526" y="102" fontSize="10" fontWeight="700" fill="#0F766E">
          더 낮아야 물이 역류하지 않습니다
        </text>
        <path d="M474 68 L506 68" stroke="#0F766E" strokeWidth="2.5" />

        {/* 4. 세제/린스 공급 */}
        <rect x="510" y="134" width="234" height="98" rx="10" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <text x="526" y="158" fontSize="11.5" fontWeight="700" fill="#141A23">
          4. 세제·린스 자동 공급기 호스 점검
        </text>
        <text x="526" y="180" fontSize="10" fill="#334155">
          전용 액체 세제·린스 공급기 호스
        </text>
        <text x="526" y="198" fontSize="10" fill="#334155">
          연결 및 랙 크기(500×500)와
        </text>
        <text x="526" y="216" fontSize="10" fill="#475569">
          앞/뒤 싱크대 작업 동선 확인 필수
        </text>
        <path d="M474 180 L506 180" stroke="#64748B" strokeWidth="2.5" />
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
      title="에어컨 냉매(가스)는 소모품이 아닙니다 — 실제 누설이 생기는 3대 지점"
      caption="에어컨 가스가 줄었다면 100% 어딘가 미세하게 새는 구멍이 있는 것이므로 단순 보충만 반복하면 오일이 말라 콤프레샤가 타버립니다."
    >
      <svg
        viewBox="0 0 760 250"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[600px] h-auto select-none"
      >
        <title id={titleId}>
          에어컨 폐쇄 냉매 배관에서 실제 냉매 누설이 발생하는 연결 너트, 배관 꺾임, 서비스 밸브 코어 3곳 도해
        </title>

        {/* 상단 사실 배너 */}
        <rect x="16" y="12" width="728" height="44" rx="8" fill="#141A23" />
        <text x="380" y="39" textAnchor="middle" fontSize="12" fontWeight="700" fill="#FFFFFF">
          정상 밀폐 배관에서는 10년이 지나도 냉매 가스가 자연 소모되지 않습니다 (부족 = 100% 누설)
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
  }
}
