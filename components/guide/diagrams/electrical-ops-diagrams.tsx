// 파일 경로: components/guide/diagrams/electrical-ops-diagrams.tsx
import React, { useId } from "react";
import { STORE, STORE_MERCHANT_POLICY } from "../../../lib/site";
import { DiagramFigure } from "./diagram-shared";
import {
  ClearanceMeasurePhotoDiagram,
} from "../guide-photo-hotspot-diagram";

export function VoltageBreakerDiagram() {
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

        {/* 전선 4가닥 (R/L1, S/L2, T/L3, N) + 접지: 라벨이 상단 주황 바·전선과 겹치지 않게 위쪽 여백 확보 */}
        <text x="472" y="69" fontSize="11" fontWeight="700" fill="#141A23" textAnchor="middle">
          R
        </text>
        <text x="512" y="69" fontSize="11" fontWeight="700" fill="#DC2626" textAnchor="middle">
          S
        </text>
        <text x="552" y="69" fontSize="11" fontWeight="700" fill="#2563EB" textAnchor="middle">
          T
        </text>
        <text x="592" y="69" fontSize="11" fontWeight="700" fill="#475569" textAnchor="middle">
          N
        </text>
        <text x="658" y="69" fontSize="10" fontWeight="600" fill="#15803D">
          접지
        </text>

        <line x1="472" y1="76" x2="472" y2="108" stroke="#141A23" strokeWidth="6" strokeLinecap="round" />
        <line x1="512" y1="76" x2="512" y2="108" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" />
        <line x1="552" y1="76" x2="552" y2="108" stroke="#2563EB" strokeWidth="6" strokeLinecap="round" />
        <line x1="592" y1="76" x2="592" y2="108" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" />
        <line x1="650" y1="62" x2="650" y2="192" stroke="#16A34A" strokeWidth="3" strokeDasharray="4 3" />

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

export function StartupPowerBudgetDiagram() {
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

export function KwVsKwhDiagram() {
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

export function ClearanceBlueprintDiagram() {
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

export function UsedVsStoreFlowDiagram() {
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
export function BuybackInspectionPointsDiagram() {
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
/*  27. 창·폐업 시 중고 매입가 방어되는 규격 vs 감가 요인 도해 (28번 글)     */
/* ------------------------------------------------------------------ */
export function ApplianceResaleValueDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="나중에 되팔 때 제값 받는 표준 규격 도면 vs 감가·매입 불가 유형"
      caption="폐업이나 업종 변경까지 고려한다면 표준 가로 규격(45박스 1260mm, 테이블 1200·1500·1800mm)과 단상 220V 정식 모델을 선택하고, 철거 시 냉매 회수(펌프다운) 후 배관을 분리해야 감가 손실이 줄어듭니다."
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
          W 1260mm
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
export function EnergyGradeRevisionDiagram() {
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
/*  31. 업소용 인덕션·튀김기 일반 콘센트 vs 전용 직결 배선 (31번 글)       */
/* ------------------------------------------------------------------ */
export function InductionWiringBreakerDiagram() {
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
export function CafePlumbingDrainCheckDiagram() {
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

/** 35번 글: N선(중성선) 오결선·단선 시 과전압 사고 구조 */
export function NeutralWireDangerDiagram() {
  return (
    <DiagramFigure
      title="N선(중성선)이 잘못 물리거나 끊어지면 생기는 220V → 380V 과전압 사고"
      caption="상가에서 가장 흔한 사고는 ① 색깔만 보고 N선 자리에 다른 상선을 물린 오결선과 ② 나사 풀림·단선으로 220V 가전끼리 직렬로 엮여 한쪽에 380V 가까운 전기가 몰리는 현상입니다."
    >
      <svg
        viewBox="0 0 760 315"
        role="img"
        aria-label="정상 220V N선 연결, N선과 상선 오결선 시 380V 직격, N선 단선 시 가전 연쇄 과전압 비교 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="315" rx="14" fill="#F8FAFC" />

        {/* 1. 정상 결선 */}
        <rect x="14" y="14" width="234" height="286" rx="12" fill="#FFFFFF" stroke="#99F6E4" />
        <rect x="14" y="14" width="234" height="38" rx="12" fill="#0F766E" />
        <rect x="14" y="40" width="234" height="12" fill="#0F766E" />
        <text x="131" y="38" fontSize="12.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          1. 정상 연결 (0V 기준 안정)
        </text>

        <line x1="76" y1="68" x2="76" y2="112" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
        <line x1="186" y1="68" x2="186" y2="112" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
        <text x="76" y="128" fontSize="10.5" fontWeight="700" fill="#1E293B" textAnchor="middle">
          상선 1가닥
        </text>
        <text x="186" y="128" fontSize="10.5" fontWeight="700" fill="#2563EB" textAnchor="middle">
          N선 (0V 귀환길)
        </text>

        <rect x="44" y="144" width="174" height="44" rx="9" fill="#F0FDFA" stroke="#5EEAD4" />
        <text x="131" y="164" fontSize="13" fontWeight="800" fill="#0F766E" textAnchor="middle">
          220V 정상 공급
        </text>
        <text x="131" y="180" fontSize="10" fontWeight="600" fill="#334155" textAnchor="middle">
          전기가 일하고 N선으로 안전 복귀
        </text>

        <rect x="28" y="204" width="206" height="80" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
        <text x="40" y="225" fontSize="10.5" fontWeight="700" fill="#0F172A">
          핵심 상태
        </text>
        <text x="40" y="244" fontSize="10" fill="#475569">
          · N선이 전압 기준(0V)을 꽉 잡아줌
        </text>
        <text x="40" y="261" fontSize="10" fill="#475569">
          · 콘센트마다 220V 내외 안정 유지
        </text>
        <text x="40" y="278" fontSize="10" fill="#0F766E" fontWeight="700">
          · 냉장고·포스기·TV 안전 가동
        </text>

        {/* 2. 오결선: N선 자리에 다른 상선 */}
        <rect x="263" y="14" width="234" height="286" rx="12" fill="#FFFBF5" stroke="#FCD34D" />
        <rect x="263" y="14" width="234" height="38" rx="12" fill="#D97706" />
        <rect x="263" y="40" width="234" height="12" fill="#D97706" />
        <text x="380" y="38" fontSize="12.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          2. N선·상선 바꿔 연결 (오결선)
        </text>

        <line x1="325" y1="68" x2="325" y2="112" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
        <line x1="435" y1="68" x2="435" y2="112" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
        <text x="325" y="128" fontSize="10.5" fontWeight="700" fill="#1E293B" textAnchor="middle">
          L1 상선 (전기)
        </text>
        <text x="435" y="128" fontSize="10.5" fontWeight="700" fill="#DC2626" textAnchor="middle">
          N선 대신 L3 상선
        </text>

        <rect x="293" y="144" width="174" height="44" rx="9" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="380" y="164" fontSize="13" fontWeight="800" fill="#DC2626" textAnchor="middle">
          380V 그대로 직격!
        </text>
        <text x="380" y="180" fontSize="10" fontWeight="600" fill="#991B1B" textAnchor="middle">
          220V 콘센트에 1.7배 높은 전압
        </text>

        <rect x="277" y="204" width="206" height="80" rx="8" fill="#FFFFFF" stroke="#FDE68A" />
        <text x="289" y="225" fontSize="10.5" fontWeight="700" fill="#92400E">
          왜 자주 생길까?
        </text>
        <text x="289" y="244" fontSize="10" fill="#475569">
          · 구형 건물은 파란선이 380V 상선
        </text>
        <text x="289" y="261" fontSize="10" fill="#475569">
          · 새 규격(KEC)은 파란선이 N선
        </text>
        <text x="289" y="278" fontSize="10" fill="#DC2626" fontWeight="700">
          · 측정 없이 색만 보고 연결 시 즉시 파손
        </text>

        {/* 3. N선 단선 / 접촉불량 */}
        <rect x="512" y="14" width="234" height="286" rx="12" fill="#FFF8F8" stroke="#FCA5A5" />
        <rect x="512" y="14" width="234" height="38" rx="12" fill="#DC2626" />
        <rect x="512" y="40" width="234" height="12" fill="#DC2626" />
        <text x="629" y="38" fontSize="12.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          3. N선 끊어짐·접촉불량 (단선)
        </text>

        <line x1="564" y1="74" x2="594" y2="74" stroke="#2563EB" strokeWidth="4" />
        <circle cx="629" cy="74" r="12" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
        <text x="629" y="78" fontSize="10.5" fontWeight="800" fill="#DC2626" textAnchor="middle">
          끊김
        </text>
        <line x1="664" y1="74" x2="694" y2="74" stroke="#2563EB" strokeWidth="4" />
        <text x="629" y="102" fontSize="10" fontWeight="700" fill="#991B1B" textAnchor="middle">
          0V 돌아가는 길이 막힘 (나사 풀림 등)
        </text>

        <rect x="530" y="114" width="92" height="58" rx="8" fill="#EFF6FF" stroke="#93C5FD" />
        <text x="576" y="133" fontSize="10.5" fontWeight="700" fill="#1E3A8A" textAnchor="middle">
          큰 기계(냉동고)
        </text>
        <text x="576" y="150" fontSize="11.5" fontWeight="800" fill="#1D4ED8" textAnchor="middle">
          약 90~130V
        </text>
        <text x="576" y="164" fontSize="9.5" fill="#475569" textAnchor="middle">
          전압이 약해짐
        </text>

        <text x="629" y="147" fontSize="12" fontWeight="800" fill="#DC2626" textAnchor="middle">
          ↔
        </text>

        <rect x="636" y="114" width="92" height="58" rx="8" fill="#FEF2F2" stroke="#EF4444" strokeWidth="1.5" />
        <text x="682" y="133" fontSize="10.5" fontWeight="700" fill="#991B1B" textAnchor="middle">
          작은 기기(기판)
        </text>
        <text x="682" y="150" fontSize="11.5" fontWeight="800" fill="#DC2626" textAnchor="middle">
          ~380V 쏠림!
        </text>
        <text x="682" y="164" fontSize="9.5" fill="#991B1B" textAnchor="middle">
          과전압으로 타버림
        </text>

        <rect x="526" y="186" width="206" height="98" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="538" y="206" fontSize="10.5" fontWeight="700" fill="#991B1B">
          가장 무서운 이유
        </text>
        <text x="538" y="224" fontSize="10" fill="#475569">
          · 서로 다른 220V 가전이 직렬로 묶임
        </text>
        <text x="538" y="241" fontSize="10" fill="#475569">
          · 조명·포스기·냉장고 기판 연쇄 소손
        </text>
        <text x="538" y="258" fontSize="10" fill="#475569">
          · 일반 차단기가 바로 안 떨어질 수 있음
        </text>
        <text x="538" y="275" fontSize="10" fill="#DC2626" fontWeight="700">
          · 조명 번쩍·탄 냄새 시 즉시 차단 필요
        </text>
      </svg>
    </DiagramFigure>
  );
}

/** 36번 글: 누전차단기(ELB) vs 배선용차단기(MCCB) 비교 및 트립 원인 찾기 */
export function ElbVsMccbTripDiagram() {
  return (
    <DiagramFigure
      title="배선용차단기(MCCB) vs 누전차단기(ELB) 구분과 차단 시 원인 찾는 3단계"
      caption="시험(TEST) 버튼 유무로 차단기 역할을 구분할 수 있으며, 장마철 차단기가 반복해서 내려갈 때는 '모든 플러그 뽑기 → 1개씩 꽂기'로 고장 가전과 벽 속 배선 누전을 바로 가려낼 수 있습니다."
    >
      <svg
        viewBox="0 0 760 305"
        role="img"
        aria-label="배선용차단기 MCCB와 누전차단기 ELB 외형 및 기능 비교, 차단 시 3단계 점검 순서 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="305" rx="14" fill="#F8FAFC" />

        {/* 왼쪽: MCCB */}
        <rect x="16" y="16" width="228" height="273" rx="12" fill="#FFFFFF" stroke="#CBD5E1" />
        <rect x="16" y="16" width="228" height="36" rx="12" fill="#1E293B" />
        <rect x="16" y="40" width="228" height="12" fill="#1E293B" />
        <text x="130" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          배선용차단기 (MCCB)
        </text>

        <rect x="86" y="68" width="88" height="70" rx="8" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.5" />
        <rect x="108" y="88" width="44" height="20" rx="4" fill="#0F172A" />
        <text x="130" y="102" fontSize="10" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          ON / OFF
        </text>
        <text x="130" y="128" fontSize="9.5" fontWeight="600" fill="#475569" textAnchor="middle">
          시험 버튼 없음
        </text>

        <text x="30" y="164" fontSize="11" fontWeight="700" fill="#0F172A">
          주요 역할: 전선·기계 과부하 보호
        </text>
        <text x="30" y="186" fontSize="10" fill="#475569">
          · 전기 너무 많이 쓸 때(과전류) 차단
        </text>
        <text x="30" y="205" fontSize="10" fill="#475569">
          · 합선(쇼트) 시 전선 화재 예방
        </text>
        <text x="30" y="224" fontSize="10" fill="#DC2626" fontWeight="700">
          · 단, 미세 누전·감전은 못 막음
        </text>
        <rect x="28" y="242" width="204" height="34" rx="7" fill="#F8FAFC" stroke="#E2E8F0" />
        <text x="130" y="263" fontSize="10" fontWeight="700" fill="#334155" textAnchor="middle">
          주로 메인 차단기 · 3상 동력에 사용
        </text>

        {/* 가운데: ELB */}
        <rect x="258" y="16" width="228" height="273" rx="12" fill="#FFFBF7" stroke="#FDBA74" />
        <rect x="258" y="16" width="228" height="36" rx="12" fill="#E8521A" />
        <rect x="258" y="40" width="228" height="12" fill="#E8521A" />
        <text x="372" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          누전차단기 (ELB)
        </text>

        <rect x="324" y="68" width="96" height="70" rx="8" fill="#FFF7ED" stroke="#FB923C" strokeWidth="1.5" />
        <rect x="342" y="80" width="44" height="18" rx="4" fill="#0F172A" />
        <text x="364" y="93" fontSize="9.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          ON/OFF
        </text>
        <rect x="394" y="80" width="20" height="18" rx="4" fill="#DC2626" />
        <text x="404" y="93" fontSize="8.5" fontWeight="800" fill="#FFFFFF" textAnchor="middle">
          T
        </text>
        <text x="372" y="128" fontSize="9.5" fontWeight="700" fill="#C2410C" textAnchor="middle">
          빨간/주황 TEST(시험) 버튼 있음!
        </text>

        <text x="272" y="164" fontSize="11" fontWeight="700" fill="#9A3412">
          주요 역할: 사람 감전·누전 차단
        </text>
        <text x="272" y="186" fontSize="10" fill="#475569">
          · 30mA 이상 새면 0.03초 내 차단
        </text>
        <text x="272" y="205" fontSize="10" fill="#475569">
          · 물기 많은 주방·콘센트 회로 필수
        </text>
        <text x="272" y="224" fontSize="10" fill="#0F766E" fontWeight="700">
          · 한 달 1번 TEST 눌러 꺼지는지 점검
        </text>
        <rect x="270" y="242" width="204" height="34" rx="7" fill="#FFF7ED" stroke="#FED7AA" />
        <text x="372" y="263" fontSize="10" fontWeight="700" fill="#C2410C" textAnchor="middle">
          안 내려가면 고장 → 즉시 교체 대상
        </text>

        {/* 오른쪽: 3단계 찾기 */}
        <rect x="500" y="16" width="244" height="273" rx="12" fill="#F0F9FF" stroke="#BAE6FD" />
        <rect x="500" y="16" width="244" height="36" rx="12" fill="#0369A1" />
        <rect x="500" y="40" width="244" height="12" fill="#0369A1" />
        <text x="622" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          비 온 날 자꾸 꺼질 때 원인 찾기
        </text>

        <rect x="514" y="66" width="216" height="58" rx="8" fill="#FFFFFF" stroke="#BAE6FD" />
        <text x="526" y="85" fontSize="10.5" fontWeight="700" fill="#0369A1">
          1단계. 해당 구역 플러그 모두 뽑기
        </text>
        <text x="526" y="102" fontSize="9.5" fill="#475569">
          모두 뺀 상태에서 차단기만 다시 올림
        </text>
        <text x="526" y="116" fontSize="9.5" fill="#DC2626" fontWeight="700">
          → 이때 또 떨어지면 벽·간판 배선 누전!
        </text>

        <rect x="514" y="136" width="216" height="58" rx="8" fill="#FFFFFF" stroke="#BAE6FD" />
        <text x="526" y="155" fontSize="10.5" fontWeight="700" fill="#0369A1">
          2단계. 가전 1개씩 시간 두고 꽂기
        </text>
        <text x="526" y="172" fontSize="9.5" fill="#475569">
          냉장고·에어컨·온수기 순으로 1대씩 연결
        </text>
        <text x="526" y="186" fontSize="9.5" fill="#0F766E" fontWeight="700">
          → 꽂자마자 떨어지는 기기가 고장 범인
        </text>

        <rect x="514" y="206" width="216" height="70" rx="8" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="526" y="226" fontSize="10.5" fontWeight="700" fill="#991B1B">
          3단계. 절대 억지로 테이프 고정 금지!
        </text>
        <text x="526" y="244" fontSize="9.5" fill="#7F1D1D">
          · 차단기는 불·감전 막으려고 떨어짐
        </text>
        <text x="526" y="261" fontSize="9.5" fill="#7F1D1D" fontWeight="700">
          · 1889(전기안전공사)·전기기사 점검 필수
        </text>
      </svg>
    </DiagramFigure>
  );
}

/** 37번 글: TV 패널별(OLED vs QLED/LED) 수명·고장 패턴과 중고 직검수 */
export function TvPanelBurninBacklightDiagram() {
  return (
    <DiagramFigure
      title="OLED vs QLED·LED TV 패널 구조 차이와 중고 매장 직검수 포인트"
      caption="스스로 빛을 내는 OLED는 '고정 로고·자막 잔상(번인)'을 흰/단색 화면으로 꼭 봐야 하고, 뒤에 등이 들어가는 QLED·LED는 '파란·보라색 화면 멍(백라이트 열화)' 여부를 먼저 확인해야 합니다."
    >
      <svg
        viewBox="0 0 760 295"
        role="img"
        aria-label="OLED 자발광 번인 점검과 QLED LED 백라이트 수명·화면 멍 점검 포인트 비교 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="295" rx="14" fill="#F8FAFC" />

        {/* 왼쪽: OLED */}
        <rect x="16" y="16" width="356" height="263" rx="12" fill="#FFFFFF" stroke="#CBD5E1" />
        <rect x="16" y="16" width="356" height="36" rx="12" fill="#0F172A" />
        <rect x="16" y="40" width="356" height="12" fill="#0F172A" />
        <text x="194" y="39" fontSize="12.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          OLED TV (화소 스스로 빛냄 · 압도적 명암비)
        </text>

        <rect x="36" y="66" width="150" height="90" rx="8" fill="#FEE2E2" stroke="#F87171" strokeWidth="1.5" />
        <rect x="44" y="74" width="44" height="16" rx="3" fill="#EF4444" opacity="0.45" />
        <text x="66" y="85" fontSize="8.5" fontWeight="700" fill="#991B1B" textAnchor="middle">
          방송사 로고
        </text>
        <rect x="44" y="128" width="134" height="18" rx="3" fill="#EF4444" opacity="0.35" />
        <text x="111" y="140" fontSize="8.5" fontWeight="700" fill="#991B1B" textAnchor="middle">
          뉴스 하단 자막 얼룩(번인)
        </text>
        <text x="111" y="110" fontSize="10" fontWeight="700" fill="#7F1D1D" textAnchor="middle">
          단색 빨강/노랑/회색 화면 띄우기
        </text>

        <text x="200" y="84" fontSize="10.5" fontWeight="700" fill="#0F172A">
          주요 수명 · 고장 원인
        </text>
        <text x="200" y="103" fontSize="9.5" fill="#475569">
          · 소자 수명 약 3만~6만 시간
        </text>
        <text x="200" y="120" fontSize="9.5" fill="#475569">
          · 뉴스/게임 고정 화면 오래 켜면
        </text>
        <text x="200" y="137" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 영구 잔상(번인) 흔적 남을 수 있음
        </text>
        <text x="200" y="154" fontSize="9.5" fill="#475569">
          · 전원 켠 뒤 멀티탭 바로 끄면 손상
        </text>

        <rect x="32" y="174" width="324" height="90" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
        <text x="46" y="196" fontSize="10.5" fontWeight="700" fill="#0F766E">
          중고 구매 시 꼭 확인할 3가지
        </text>
        <text x="46" y="216" fontSize="10" fill="#334155">
          1. 유튜브 [OLED 번인 테스트(단색 화면)]로 자막·로고 잔상 확인
        </text>
        <text x="46" y="234" fontSize="10" fill="#334155">
          2. 매장 전시품·업소 뉴스 종일 틀던 매물은 가급적 피하기
        </text>
        <text x="46" y="252" fontSize="10" fill="#334155">
          3. 리모컨 OFF 후 픽셀 리프레시 끝나기 전 코드 뽑지 않기
        </text>

        {/* 오른쪽: QLED / LED */}
        <rect x="388" y="16" width="356" height="263" rx="12" fill="#FFFBF7" stroke="#FDBA74" />
        <rect x="388" y="16" width="356" height="36" rx="12" fill="#E8521A" />
        <rect x="388" y="40" width="356" height="12" fill="#E8521A" />
        <text x="566" y="39" fontSize="12.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          QLED · LED TV (뒷면 LED 등 + LCD · 번인 걱정 적음)
        </text>

        <rect x="408" y="66" width="150" height="90" rx="8" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
        <circle cx="445" cy="96" r="14" fill="#6366F1" opacity="0.35" />
        <circle cx="515" cy="126" r="16" fill="#1E293B" opacity="0.28" />
        <text x="483" y="109" fontSize="10" fontWeight="700" fill="#1E3A8A" textAnchor="middle">
          흰 화면 띄워 확인!
        </text>
        <text x="483" y="148" fontSize="8.5" fontWeight="700" fill="#4338CA" textAnchor="middle">
          푸른 멍·어두운 줄 = 백라이트 노후
        </text>

        <text x="572" y="84" fontSize="10.5" fontWeight="700" fill="#9A3412">
          주요 수명 · 고장 원인
        </text>
        <text x="572" y="103" fontSize="9.5" fill="#475569">
          · 소자 수명 약 3만~6만+ 시간
        </text>
        <text x="572" y="120" fontSize="9.5" fill="#475569">
          · 번인은 거의 없으나 오래 쓰면
        </text>
        <text x="572" y="137" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 뒤쪽 LED 등 꺼짐(한쪽 어두워짐)
        </text>
        <text x="572" y="154" fontSize="9.5" fill="#475569">
          · 벽 밀착 설치 시 열기로 수명 단축
        </text>

        <rect x="404" y="174" width="324" height="90" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="418" y="196" fontSize="10.5" fontWeight="700" fill="#C2410C">
          중고 구매 시 꼭 확인할 3가지
        </text>
        <text x="418" y="216" fontSize="10" fill="#334155">
          1. 흰색 바탕에서 화면 한쪽이 어둡거나 파랗·보랏빛(백라이트 멍) 없는지 확인
        </text>
        <text x="418" y="234" fontSize="10" fill="#334155">
          2. HDMI 포트 1~3번·와이파이·리모컨 수신이 모두 정상인지 점검
        </text>
        <text x="418" y="252" fontSize="10" fill="#334155">
          3. 설치 후 백라이트 밝기를 70~80 수준으로 낮추고 뒤 통풍구 여유 두기
        </text>
      </svg>
    </DiagramFigure>
  );
}

/** 42번 글: 돈 받고 파는 매입 가전 vs 무료 폐가전 방문수거(1599-0903) 구분 */
export function WastePickupVsBuybackDiagram() {
  return (
    <DiagramFigure
      title="폐업·이사 가전 처분 기준: 돈 받고 매입 vs 무상방문수거(1599-0903) vs 유료 폐기"
      caption="작동이 정상이고 최근 연식이면 매입으로 돈을 받을 수 있고, 고장·노후 가전도 형태만 온전하면 정부·E순환거버넌스(1599-0903)가 무료로 가져갑니다."
    >
      <svg
        viewBox="0 0 760 285"
        role="img"
        aria-label="유상 매입 가전 기준, 1599-0903 폐가전 무상방문수거 기준, 원형 훼손 유료 폐기 비교 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="285" rx="14" fill="#F8FAFC" />

        {/* 1. 전문 매장 매입 */}
        <rect x="16" y="16" width="234" height="253" rx="12" fill="#F0FDFA" stroke="#5EEAD4" />
        <rect x="16" y="16" width="234" height="36" rx="12" fill="#0F766E" />
        <rect x="16" y="40" width="234" height="12" fill="#0F766E" />
        <text x="133" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          1. 돈 받고 팔기 (전문 매장 매입)
        </text>

        <text x="32" y="76" fontSize="10.5" fontWeight="700" fill="#0F766E">
          이 조건이면 먼저 매입 견적!
        </text>
        <text x="32" y="98" fontSize="10" fill="#334155">
          · 정상 작동하고 외관 큰 파손 없음
        </text>
        <text x="32" y="118" fontSize="10" fill="#334155">
          · 가정용: 보통 제조 7~8년 이내
        </text>
        <text x="32" y="138" fontSize="10" fill="#334155">
          · 업소용(냉장고·제빙기·에어컨):
        </text>
        <text x="42" y="155" fontSize="10" fill="#0F766E" fontWeight="700">
          철거비 제외하고도 현금 정산 가능!
        </text>
        <rect x="28" y="176" width="210" height="78" rx="8" fill="#FFFFFF" stroke="#99F6E4" />
        <text x="40" y="196" fontSize="10" fontWeight="700" fill="#0F172A">
          꿀팁: 철거 전 사진 3장 먼저 찍기
        </text>
        <text x="40" y="214" fontSize="9.5" fill="#475569">
          에어컨·업소 기기는 떼기 전에 작동 상태로
        </text>
        <text x="40" y="230" fontSize="9.5" fill="#475569">
          명판·전체 사진 찍어야 제값 받습니다.
        </text>

        {/* 2. 무상방문수거 1599-0903 */}
        <rect x="263" y="16" width="234" height="253" rx="12" fill="#EFF6FF" stroke="#93C5FD" />
        <rect x="263" y="16" width="234" height="36" rx="12" fill="#1D4ED8" />
        <rect x="263" y="40" width="234" height="12" fill="#1D4ED8" />
        <text x="380" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          2. 무료 버리기 (1599-0903)
        </text>

        <text x="279" y="76" fontSize="10.5" fontWeight="700" fill="#1E40AF">
          고장 나도 형태 온전하면 0원 수거
        </text>
        <text x="279" y="98" fontSize="10" fill="#334155">
          · 대형가전(냉장·세탁·TV·에어컨) 1대부터
        </text>
        <text x="279" y="118" fontSize="10" fill="#334155">
          · 소형가전(밥솥·선풍기 등) 5개 이상부터
        </text>
        <text x="279" y="138" fontSize="10" fill="#334155">
          · 대형가전 1대 낼 때 소형 5개 미만 합배출
        </text>
        <rect x="275" y="176" width="210" height="78" rx="8" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="287" y="196" fontSize="10" fontWeight="700" fill="#DC2626">
          주의: 벽걸이 TV·에어컨 미철거 시 불가!
        </text>
        <text x="287" y="214" fontSize="9.5" fill="#475569">
          벽에서 분리된 상태여야 수거 기사님이
        </text>
        <text x="287" y="230" fontSize="9.5" fill="#475569">
          가져갑니다. (모두비움 앱/1599-0903)
        </text>

        {/* 3. 제외 및 유료 폐기 */}
        <rect x="510" y="16" width="234" height="253" rx="12" fill="#FFF8F8" stroke="#FCA5A5" />
        <rect x="510" y="16" width="234" height="36" rx="12" fill="#DC2626" />
        <rect x="510" y="40" width="234" height="12" fill="#DC2626" />
        <text x="627" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          3. 무상수거 제외 (스티커/업체)
        </text>

        <text x="526" y="76" fontSize="10.5" fontWeight="700" fill="#991B1B">
          아래 품목은 무상수거가 거절됩니다
        </text>
        <text x="526" y="98" fontSize="10" fill="#334155">
          · 원형 훼손(콤프·모터 빼고 부서진 것)
        </text>
        <text x="526" y="118" fontSize="10" fill="#334155">
          · 안마의자 · 전기장판 · 옥매트 · 가구
        </text>
        <text x="526" y="138" fontSize="10" fill="#334155">
          · 맞춤 빌트인 · 대형 냉동창고 설비
        </text>
        <rect x="522" y="176" width="210" height="78" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="534" y="196" fontSize="10" fontWeight="700" fill="#991B1B">
          폐업 시 처리 순서 (돈 아끼는 법)
        </text>
        <text x="534" y="214" fontSize="9.5" fill="#475569">
          ① 매입(먼저 돈 받고 비우기) → ② 무상수거
        </text>
        <text x="534" y="230" fontSize="9.5" fill="#475569">
          (0원) → ③ 인테리어 원상복구 철거 업체
        </text>
      </svg>
    </DiagramFigure>
  );
}
