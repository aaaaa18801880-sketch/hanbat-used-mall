// 파일 경로: components/guide/diagrams/aircon-diagrams.tsx
import React, { useId } from "react";
import { DiagramFigure } from "./diagram-shared";
import {
  AirconDrainLeakPhotoDiagram,
  AirconPipeComparisonPhotoDiagram,
  OutdoorUnitWeatherproofPhotoDiagram,
  PcbPhotoFailureDiagram,
} from "../guide-photo-hotspot-diagram";

export function AirconRepairTimelineDiagram() {
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

/* ------------------------------------------------------------------ */
/*  7. 에어컨 냉매 순환 4대 부품과 고장 연결 도해 (8번 글)                */
/* ------------------------------------------------------------------ */
export function AirconCyclePartsDiagram() {
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
export function OutdoorUnitWeatherproofDiagram() {
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
export function PcbFailureCausesDiagram() {
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
export function CeilingVsStandInstallDiagram() {
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
export function DefrostCycleWalkwayDiagram() {
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
export function FixedSpeedVsInverterDiagram() {
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
/*  19. 에어컨 냉매(가스) 소모품 오해 & 3대 누설 지점 도해 (20번 글)      */
/* ------------------------------------------------------------------ */
export function RefrigerantLeakMythDiagram() {
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
export function AirconPyeongSizingDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="똑같은 '실평수 20평(66㎡)'인데 환경별로 필요한 에어컨 평형 차이"
      caption="바닥 면적만 보고 평형에 딱 맞춰 사면 통유리 카페는 물론, 불판 열기·환기통 냉기 유실이 겹치는 고깃집(실평수의 3~4배 필요)은 한여름 내내 실내가 식지 않습니다."
    >
      <svg
        viewBox="0 0 760 326"
        role="img"
        aria-labelledby={titleId}
        className="w-full min-w-[620px] h-auto select-none"
      >
        <title id={titleId}>
          실평수 20평 공간에서 일반 가정 사무실(1배), 통유리 카페(1.5배), 일반 음식점(2배), 숯불·닥트 고깃집(3~4배)별 권장 에어컨 평형 비례 비교 도해
        </title>

        <text x="20" y="32" fontSize="12.5" fontWeight="700" fill="#141A23">
          기준 공간: 바닥 실평수 20평 (66㎡) 기준 업종별 권장 에어컨 평형 비교
        </text>

        {/* 기준 눈금선 (1.0x = 70px 비례) */}
        <line x1="258" y1="48" x2="258" y2="292" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="398" y1="48" x2="398" y2="292" stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
        <line x1="468" y1="48" x2="468" y2="292" stroke="#FDBA74" strokeDasharray="3 3" strokeWidth="1" />
        <line x1="538" y1="48" x2="538" y2="292" stroke="#FECACA" strokeDasharray="3 3" strokeWidth="1" />

        {/* Row 1: 1.0x */}
        <rect x="20" y="54" width="226" height="48" rx="8" fill="#F8FAFC" stroke="#CBD5E1" />
        <text x="32" y="74" fontSize="11" fontWeight="700" fill="#141A23">
          1. 일반 가정 · 사무실 (×1.0)
        </text>
        <text x="32" y="91" fontSize="9.5" fill="#475569">
          천고 2.4m 이하 · 햇빛·불 안 쓰는 실내
        </text>
        <rect x="258" y="65" width="70" height="26" rx="5" fill="#0F766E" />
        <text x="338" y="83" fontSize="11" fontWeight="700" fill="#0F766E">
          18 ~ 23평형 (단상 220V 가능)
        </text>

        {/* Row 2: 1.5x */}
        <rect x="20" y="114" width="226" height="48" rx="8" fill="#EFF6FF" stroke="#93C5FD" />
        <text x="32" y="134" fontSize="11" fontWeight="700" fill="#1D4ED8">
          2. 통유리 카페 · 오픈 문 (×1.5)
        </text>
        <text x="32" y="151" fontSize="9.5" fill="#475569">
          통유리 햇빛 + 커피머신·제빙기 열기
        </text>
        <rect x="258" y="125" width="105" height="26" rx="5" fill="#1D4ED8" />
        <text x="373" y="143" fontSize="11" fontWeight="700" fill="#1D4ED8">
          28 ~ 32평형 권장 (단상 30A)
        </text>

        {/* Row 3: 2.0x */}
        <rect x="20" y="174" width="226" height="48" rx="8" fill="#FEFCE8" stroke="#FDE047" />
        <text x="32" y="194" fontSize="11" fontWeight="700" fill="#A16207">
          3. 일반 음식점 · 비직화 (×2.0)
        </text>
        <text x="32" y="211" fontSize="9.5" fill="#475569">
          조리 열기 + 손님 출입 많은 홀
        </text>
        <rect x="258" y="185" width="140" height="26" rx="5" fill="#CA8A04" />
        <text x="408" y="203" fontSize="11" fontWeight="700" fill="#A16207">
          36 ~ 45평형 (40평 경계 · 2대 검토)
        </text>

        {/* Row 4: 3.0x ~ 4.0x */}
        <rect x="20" y="234" width="226" height="54" rx="8" fill="#FFF4EE" stroke="#FB923C" strokeWidth="1.5" />
        <text x="32" y="254" fontSize="11" fontWeight="700" fill="#C2410C">
          4. 숯불·직화 고깃집+닥트 (×3~4)
        </text>
        <text x="32" y="272" fontSize="9.5" fill="#475569">
          불판 열기 + 환기통으로 찬 공기 배출
        </text>
        {/* 3.0x 기본(210px) + 4.0x 여유구간(70px) */}
        <rect x="258" y="247" width="280" height="28" rx="5" fill="#FDBA74" />
        <rect x="258" y="247" width="210" height="28" rx="5" fill="#C2410C" />
        <text x="363" y="265" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#FFFFFF">
          ×3배(60평형)
        </text>
        <text x="503" y="265" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#9A3412">
          ~×4배
        </text>
        <text x="548" y="258" fontSize="11" fontWeight="800" fill="#C2410C">
          60 ~ 80평형급
        </text>
        <text x="548" y="274" fontSize="9.5" fontWeight="600" fill="#475569">
          (30~40평×2대 · 380V 확인)
        </text>

        {/* 눈금 범례 */}
        <text x="258" y="310" fontSize="9.5" fill="#64748B">0</text>
        <text x="398" y="310" textAnchor="middle" fontSize="9.5" fill="#64748B">40평 (×2)</text>
        <text x="468" y="310" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#C2410C">60평 (×3)</text>
        <text x="538" y="310" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#B91C1C">80평 (×4)</text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  23. 인버터 에어컨 24시간 vs 껐다켜기 전력 곡선 도해 (24번 글)         */
/* ------------------------------------------------------------------ */
export function InverterDutyCycleDiagram() {
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
export function AirconDrainLeakDiagram() {
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
export function AirconPipeComparisonDiagram() {
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
/*  29. 대형 1대 단독 설치 vs 중·소형 여러 대 분산 설치 비교 도해 (30번 글) */
/* ------------------------------------------------------------------ */
export function AirconSingleVsMultiDiagram() {
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
/*  34. 에어컨 이전설치 비용 급증 4대 현장 변수 (34번 글)                    */
/* ------------------------------------------------------------------ */
export function AirconRelocationCostFactorsDiagram() {
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
