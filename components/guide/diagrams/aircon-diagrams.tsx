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

/** 39번 글: 실외기실 루버창 닫힘 시 열기 정체(고압 차단 · 화재) 비교 도해 */
export function OutdoorLouverAirflowDiagram() {
  return (
    <DiagramFigure
      title="에어컨 실외기실 루버창(갤러리창) 닫고 켜면 생기는 '열기 갇힘 · 고압 차단 · 화재'"
      caption="루버창이 닫혀 있으면 실외기가 뿜은 뜨거운 바람이 밖으로 못 나가고 다시 실외기로 빨려 들어갑니다. 냉방은 안 되고 전기세만 급등하며 심하면 과열 화재로 이어집니다."
    >
      <svg
        viewBox="0 0 760 285"
        role="img"
        aria-label="실외기실 루버창 닫힘 시 열기 갇힘과 루버창 개방 시 정상 열 방출 비교 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="285" rx="14" fill="#F8FAFC" />

        {/* 왼쪽: 위험 (루버창 닫힘) */}
        <rect x="16" y="16" width="356" height="253" rx="12" fill="#FFF8F8" stroke="#FCA5A5" />
        <rect x="16" y="16" width="356" height="36" rx="12" fill="#DC2626" />
        <rect x="16" y="40" width="356" height="12" fill="#DC2626" />
        <text x="194" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          위험: 루버창 닫힘 / 박스·짐 적재 (열기 정체)
        </text>

        {/* 닫힌 루버 + 실외기 */}
        <rect x="38" y="68" width="134" height="106" rx="8" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" />
        <rect x="46" y="76" width="16" height="90" rx="2" fill="#991B1B" />
        <text x="54" y="124" fontSize="8.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          닫힘
        </text>
        <rect x="88" y="96" width="72" height="58" rx="6" fill="#FFFFFF" stroke="#64748B" strokeWidth="1.5" />
        <circle cx="116" cy="125" r="16" fill="#F1F5F9" stroke="#DC2626" strokeWidth="2" />
        <text x="108" y="88" fontSize="9.5" fontWeight="800" fill="#DC2626" textAnchor="middle">
          열풍 반사!
        </text>
        <path d="M 90 112 Q 70 118 86 138" fill="none" stroke="#DC2626" strokeWidth="2.5" />

        <text x="186" y="84" fontSize="10.5" fontWeight="700" fill="#991B1B">
          실외기실에서 벌어지는 현상
        </text>
        <text x="186" y="103" fontSize="9.5" fill="#475569">
          · 뜨거운 바람이 닫힌 창에 부딪혀 되돌아옴
        </text>
        <text x="186" y="121" fontSize="9.5" fill="#475569">
          · 실외기실 온도 50℃ 이상 급상승
        </text>
        <text x="186" y="139" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 압력 과상승 → 고압 에러(냉방 멈춤)
        </text>
        <text x="186" y="157" fontSize="9.5" fill="#DC2626">
          · 전선 피복 노후 + 먼지 만나면 화재 위험
        </text>

        <rect x="30" y="186" width="328" height="70" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="44" y="206" fontSize="10.5" fontWeight="700" fill="#991B1B">
          여름마다 반복되는 대표 실수
        </text>
        <text x="44" y="224" fontSize="9.5" fill="#475569">
          · 비 온 뒤 닫아둔 루버창을 까먹고 그대로 에어컨 ON
        </text>
        <text x="44" y="241" fontSize="9.5" fill="#475569">
          · 실외기 앞에 종이상자 · 세제통 · 빨래 건조대 가로막음
        </text>

        {/* 오른쪽: 정상 (루버창 활짝 개방) */}
        <rect x="388" y="16" width="356" height="253" rx="12" fill="#F0FDFA" stroke="#5EEAD4" />
        <rect x="388" y="16" width="356" height="36" rx="12" fill="#0F766E" />
        <rect x="388" y="40" width="356" height="12" fill="#0F766E" />
        <text x="566" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          안전: 루버창 수평 개방 + 뒤쪽 10cm+ 여유 (정상)
        </text>

        <rect x="410" y="68" width="134" height="106" rx="8" fill="#CCFBF1" stroke="#0F766E" strokeWidth="1.5" />
        <line x1="418" y1="84" x2="432" y2="84" stroke="#0F766E" strokeWidth="3" />
        <line x1="418" y1="104" x2="432" y2="104" stroke="#0F766E" strokeWidth="3" />
        <line x1="418" y1="124" x2="432" y2="124" stroke="#0F766E" strokeWidth="3" />
        <line x1="418" y1="144" x2="432" y2="144" stroke="#0F766E" strokeWidth="3" />
        <rect x="460" y="96" width="72" height="58" rx="6" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.5" />
        <circle cx="488" cy="125" r="16" fill="#F0FDFA" stroke="#0F766E" strokeWidth="2" />
        <line x1="464" y1="125" x2="404" y2="125" stroke="#0F766E" strokeWidth="3" />
        <text x="448" y="84" fontSize="9.5" fontWeight="800" fill="#0F766E" textAnchor="middle">
          열기 외부 배출 →
        </text>

        <text x="558" y="84" fontSize="10.5" fontWeight="700" fill="#0F766E">
          실외기 안전 · 절전 효과
        </text>
        <text x="558" y="103" fontSize="9.5" fill="#334155">
          · 날개를 90도 수평으로 활짝 열기
        </text>
        <text x="558" y="121" fontSize="9.5" fill="#334155">
          · 열기가 바로 빠져 전기 소비 크게 절감
        </text>
        <text x="558" y="139" fontSize="9.5" fill="#0F766E" fontWeight="700">
          · 찬바람 빨라지고 콤프레샤 과열 방지
        </text>
        <text x="558" y="157" fontSize="9.5" fill="#334155">
          · 벽과 뒷면 최소 10cm 이상 간격 유지
        </text>

        <rect x="402" y="186" width="328" height="70" rx="8" fill="#FFFFFF" stroke="#99F6E4" />
        <text x="416" y="206" fontSize="10.5" fontWeight="700" fill="#0F766E">
          소방청 · 소비자원 권장 필수 체크 3가지
        </text>
        <text x="416" y="224" fontSize="9.5" fill="#334155">
          1. 가동 전 루버창 개방 확인(자동 전동 루버창도 모터 동작 확인)
        </text>
        <text x="416" y="241" fontSize="9.5" fill="#334155">
          2. 멀티탭 대신 에어컨 전용 단독 콘센트 사용 · 주변 박스 치우기
        </text>
      </svg>
    </DiagramFigure>
  );
}

/** 40번 글: 에어컨 철거 시 냉매 회수(펌프다운)와 배관 밀폐 테이핑 */
export function AirconPumpdownTapingDiagram() {
  return (
    <DiagramFigure
      title="이사 · 중고 판매 에어컨 철거의 생명줄: '펌프다운(냉매 회수)'과 '배관 테이핑'"
      caption="배관을 막 잘라 가스를 날리거나 구멍을 열어두면 빗물·습기가 들어가 재설치 후 가장 비싼 핵심 부품(콤프레샤)이 망가집니다."
    >
      <svg
        viewBox="0 0 760 285"
        role="img"
        aria-label="에어컨 올바른 철거(펌프다운 냉매 회수 및 배관 밀폐 테이핑)와 잘못된 철거(가스 유실 및 습기 유입 고장) 비교 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="285" rx="14" fill="#F8FAFC" />

        {/* 왼쪽: 정석 철거 */}
        <rect x="16" y="16" width="356" height="253" rx="12" fill="#F0FDFA" stroke="#5EEAD4" />
        <rect x="16" y="16" width="356" height="36" rx="12" fill="#0F766E" />
        <rect x="16" y="40" width="356" height="12" fill="#0F766E" />
        <text x="194" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          정석 철거: 펌프다운 + 끝단 3중 밀폐 테이핑
        </text>

        <rect x="32" y="68" width="152" height="58" rx="8" fill="#FFFFFF" stroke="#5EEAD4" />
        <text x="108" y="88" fontSize="10.5" fontWeight="700" fill="#0F766E" textAnchor="middle">
          1. 냉방 운전 중 냉매 회수
        </text>
        <text x="108" y="106" fontSize="9.5" fill="#475569" textAnchor="middle">
          가스를 실외기 안에 전부 모아
        </text>
        <text x="108" y="119" fontSize="9.5" fill="#475569" textAnchor="middle">
          서비스 밸브를 꽉 잠금
        </text>

        <rect x="200" y="68" width="156" height="58" rx="8" fill="#FFFFFF" stroke="#5EEAD4" />
        <text x="278" y="88" fontSize="10.5" fontWeight="700" fill="#0F766E" textAnchor="middle">
          2. 배관 끝·실외기 밸브 밀폐
        </text>
        <text x="278" y="106" fontSize="9.5" fill="#475569" textAnchor="middle">
          배관 절단면·너트 구멍에
        </text>
        <text x="278" y="119" fontSize="9.5" fill="#475569" textAnchor="middle">
          비닐+절연테이프로 공기도 차단
        </text>

        <rect x="32" y="140" width="324" height="114" rx="8" fill="#FFFFFF" stroke="#99F6E4" />
        <text x="46" y="162" fontSize="10.5" fontWeight="700" fill="#0F766E">
          정석 철거를 지켜야 하는 이유
        </text>
        <text x="46" y="182" fontSize="9.5" fill="#334155">
          · 재설치 때 가스 완충비(8~15만 원)를 크게 아낄 수 있음
        </text>
        <text x="46" y="200" fontSize="9.5" fill="#334155">
          · 동배관이 꺾이지 않으면(재사용 가능 시) 배관비도 절약
        </text>
        <text x="46" y="218" fontSize="9.5" fill="#334155">
          · 중고 매입 업체도 정상 작동 + 냉매 보존 제품은 감가 없음
        </text>
        <text x="46" y="236" fontSize="9.5" fill="#0F766E" fontWeight="700">
          · 실내기·실외기 연결 전선과 리모컨 함께 챙겨 보관
        </text>

        {/* 오른쪽: 잘못된 철거 */}
        <rect x="388" y="16" width="356" height="253" rx="12" fill="#FFF8F8" stroke="#FCA5A5" />
        <rect x="388" y="16" width="356" height="36" rx="12" fill="#DC2626" />
        <rect x="388" y="40" width="356" height="12" fill="#DC2626" />
        <text x="566" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          잘못된 철거: 배관 막 자르기 + 열린 채 방치
        </text>

        <rect x="404" y="68" width="152" height="58" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="480" y="88" fontSize="10.5" fontWeight="700" fill="#DC2626" textAnchor="middle">
          1. 밸브 안 잠그고 배관 절단
        </text>
        <text x="480" y="106" fontSize="9.5" fill="#475569" textAnchor="middle">
          가스가 대기 중으로 다 빠지고
        </text>
        <text x="480" y="119" fontSize="9.5" fill="#475569" textAnchor="middle">
          실외기 오일까지 뿜어져 손실
        </text>

        <rect x="572" y="68" width="156" height="58" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="650" y="88" fontSize="10.5" fontWeight="700" fill="#DC2626" textAnchor="middle">
          2. 배관 입구 열려 습기 유입
        </text>
        <text x="650" y="106" fontSize="9.5" fill="#475569" textAnchor="middle">
          이사 차·베란다 보관 중에
        </text>
        <text x="650" y="119" fontSize="9.5" fill="#475569" textAnchor="middle">
          빗물·공기 수분·먼지가 침투
        </text>

        <rect x="404" y="140" width="324" height="114" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="418" y="162" fontSize="10.5" fontWeight="700" fill="#991B1B">
          재설치 후 발생하는 최악의 결과
        </text>
        <text x="418" y="182" fontSize="9.5" fill="#7F1D1D">
          · 들어간 수분이 냉동오일을 변질시켜 콤프레샤 사망 유발
        </text>
        <text x="418" y="200" fontSize="9.5" fill="#7F1D1D">
          · 제조사 AS 점검 시 시공·철거 과실로 유상 수리 판정!
        </text>
        <text x="418" y="218" fontSize="9.5" fill="#7F1D1D">
          · 이사업체 ↔ 설치업체 책임 떠넘기기 분쟁 빈발
        </text>
        <text x="418" y="236" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 철거 전 반드시 작동 여부 사진·영상 남기고 전문 철거 의뢰
        </text>
      </svg>
    </DiagramFigure>
  );
}

/** 44번 글: 겨울 난방 히트펌프 냉난방기 vs 전기히터(온풍기) COP·한파 성능 비교 */
export function HeatingHeatpumpVsHeaterDiagram() {
  return (
    <DiagramFigure
      title="겨울 매장 난방 효율 비교: 인버터 냉난방기(COP 2.5~4) vs 전기온풍기(COP 1.0)"
      caption="전기히터는 전기 1만큼 열 1만 만들지만, 냉난방기는 바깥 공기 열을 끌어와 전기 1로 열 2.5~4배를 내어 난방비가 크게 절감됩니다. 다만 영하 10℃ 이하에서는 효율이 낮아지고 성에 제거(제상) 구간이 생깁니다."
    >
      <svg
        viewBox="0 0 760 285"
        role="img"
        aria-label="전기온풍기 COP 1.0과 인버터 냉난방기 히트펌프 COP 2.5~4.0 효율 및 영하 한파 제상 비교 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="285" rx="14" fill="#F8FAFC" />

        {/* 왼쪽: 전기히터 / 온풍기 */}
        <rect x="16" y="16" width="356" height="253" rx="12" fill="#FFF8F8" stroke="#FCA5A5" />
        <rect x="16" y="16" width="356" height="36" rx="12" fill="#DC2626" />
        <rect x="16" y="40" width="356" height="12" fill="#DC2626" />
        <text x="194" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          전기온풍기 · 히터 (저항열 방식 · COP 1.0)
        </text>

        <rect x="34" y="68" width="144" height="66" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="106" y="92" fontSize="11" fontWeight="800" fill="#1E293B" textAnchor="middle">
          전기 1 kWh 투입
        </text>
        <text x="106" y="116" fontSize="12" fontWeight="800" fill="#DC2626" textAnchor="middle">
          → 열 1.0 kWh
        </text>

        <text x="192" y="84" fontSize="10.5" fontWeight="700" fill="#991B1B">
          현실적인 장단점
        </text>
        <text x="192" y="103" fontSize="9.5" fill="#475569">
          · 켜자마자 바로 뜨거움 (영하 영향 없음)
        </text>
        <text x="192" y="121" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 전기 먹는 하마: 상시 난방비 2.5~3배+
        </text>
        <text x="192" y="139" fontSize="9.5" fill="#DC2626">
          · 3~5kW씩 먹어 차단기·계약전력 초과 빈발
        </text>

        <rect x="30" y="156" width="328" height="98" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="44" y="178" fontSize="10.5" fontWeight="700" fill="#991B1B">
          추천 사용처 (보조용으로만 적합)
        </text>
        <text x="44" y="198" fontSize="9.5" fill="#334155">
          · 카운터 발밑, 화장실, 출입문 옆 등 좁은 구역 단시간 보조
        </text>
        <text x="44" y="216" fontSize="9.5" fill="#334155">
          · 20~50평 홀 전체를 온풍기 2~3대로 데우면 요금·전력 폭탄
        </text>
        <text x="44" y="234" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 전선 얇은 콘센트·멀티탭에 꽂으면 과열 화재 위험 큼
        </text>

        {/* 오른쪽: 인버터 냉난방기 */}
        <rect x="388" y="16" width="356" height="253" rx="12" fill="#F0FDFA" stroke="#5EEAD4" />
        <rect x="388" y="16" width="356" height="36" rx="12" fill="#0F766E" />
        <rect x="388" y="40" width="356" height="12" fill="#0F766E" />
        <text x="566" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          인버터 냉난방기 (히트펌프 · COP 평균 2.5~4.0)
        </text>

        <rect x="406" y="68" width="144" height="66" rx="8" fill="#FFFFFF" stroke="#5EEAD4" />
        <text x="478" y="92" fontSize="11" fontWeight="800" fill="#1E293B" textAnchor="middle">
          전기 1 kWh 투입
        </text>
        <text x="478" y="116" fontSize="12" fontWeight="800" fill="#0F766E" textAnchor="middle">
          → 열 2.5~4.0 kWh
        </text>

        <text x="564" y="84" fontSize="10.5" fontWeight="700" fill="#0F766E">
          현실적인 장단점
        </text>
        <text x="564" y="103" fontSize="9.5" fill="#334155">
          · 같은 난방 시 전기요금 약 1/3 수준 절감
        </text>
        <text x="564" y="121" fontSize="9.5" fill="#334155">
          · 여름 냉방 + 겨울 난방 1대로 겸용
        </text>
        <text x="564" y="139" fontSize="9.5" fill="#C2410C" fontWeight="700">
          · 영하 10℃ 이하 시 효율 하락·제상 멈춤
        </text>

        <rect x="402" y="156" width="328" height="98" rx="8" fill="#FFFFFF" stroke="#99F6E4" />
        <text x="416" y="178" fontSize="10.5" fontWeight="700" fill="#0F766E">
          실전 매장 운용 팁 (한파·제상 대비)
        </text>
        <text x="416" y="198" fontSize="9.5" fill="#334155">
          · 겨울 주력 난방은 냉난방기, 출입문 앞 한기만 보조 히터 조합
        </text>
        <text x="416" y="216" fontSize="9.5" fill="#334155">
          · 제상 중 10분 안팎 온풍 멈춤은 고장이 아니라 정상 성에 제거 과정
        </text>
        <text x="416" y="234" fontSize="9.5" fill="#0F766E" fontWeight="700">
          · 추운 지역·외풍 매장은 한랭지 인버터 모델 + 충분한 평형 권장
        </text>
      </svg>
    </DiagramFigure>
  );
}

/** 45번 글: 가정용 2in1(멀티형) 에어컨 vs 단품 2대 비교 */
export function Aircon2in1VsSinglesDiagram() {
  return (
    <DiagramFigure
      title="가정용 2in1(멀티형) 에어컨 vs 단품 2대(스탠드 + 벽걸이 각각) 비교"
      caption="아파트 실외기실이 1칸뿐이면 2in1이 정답이지만, 실외기 1대가 고장 나면 거실·안방이 동시에 멈추고 이사 갈 때 한 대만 떼어 팔기 어렵다는 점도 미리 알아두어야 합니다."
    >
      <svg
        viewBox="0 0 760 285"
        role="img"
        aria-label="실외기 1대 2in1 멀티형 에어컨과 실외기 2대 단품 2대 에어컨 장단점 및 고장 이사 비교 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="285" rx="14" fill="#F8FAFC" />

        {/* 왼쪽: 2in1 멀티형 */}
        <rect x="16" y="16" width="356" height="253" rx="12" fill="#FFFBF7" stroke="#FDBA74" />
        <rect x="16" y="16" width="356" height="36" rx="12" fill="#E8521A" />
        <rect x="16" y="40" width="356" height="12" fill="#E8521A" />
        <text x="194" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          1. 2in1 멀티형 (스탠드 + 벽걸이 + 실외기 1대)
        </text>

        <rect x="44" y="68" width="54" height="66" rx="6" fill="#FFFFFF" stroke="#EA580C" strokeWidth="1.5" />
        <text x="71" y="105" fontSize="9.5" fontWeight="700" fill="#9A3412" textAnchor="middle">
          스탠드
        </text>
        <rect x="114" y="68" width="66" height="34" rx="6" fill="#FFFFFF" stroke="#EA580C" strokeWidth="1.5" />
        <text x="147" y="89" fontSize="9.5" fontWeight="700" fill="#9A3412" textAnchor="middle">
          벽걸이
        </text>
        <rect x="78" y="144" width="84" height="34" rx="6" fill="#FFF7ED" stroke="#E8521A" strokeWidth="2" />
        <text x="120" y="165" fontSize="10" fontWeight="800" fill="#C2410C" textAnchor="middle">
          실외기 1대
        </text>
        <line x1="71" y1="134" x2="104" y2="144" stroke="#64748B" strokeWidth="2" />
        <line x1="147" y1="102" x2="136" y2="144" stroke="#64748B" strokeWidth="2" />

        <text x="196" y="84" fontSize="10.5" fontWeight="700" fill="#9A3412">
          장점 (신축 아파트 표준)
        </text>
        <text x="196" y="103" fontSize="9.5" fill="#334155">
          · 좁은 실외기실 1칸에 깔끔하게 들어감
        </text>
        <text x="196" y="121" fontSize="9.5" fill="#334155">
          · 초기 구매가·중고 판매 수요 매우 높음
        </text>
        <text x="196" y="143" fontSize="10.5" fontWeight="700" fill="#DC2626">
          단점 (구매·이사 전 주의)
        </text>
        <text x="196" y="162" fontSize="9.5" fill="#DC2626">
          · 실외기 1대 고장 시 두 대 다 멈춤!
        </text>

        <rect x="30" y="190" width="328" height="66" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="44" y="210" fontSize="9.5" fontWeight="700" fill="#9A3412">
          · 거실↔안방 배관 길면 추가 배관비 상승 · 1대만 따로 떼기 불가
        </text>
        <text x="44" y="230" fontSize="9.5" fill="#475569">
          · 이사 갈 집 안방에 이미 벽걸이만 있어도 스탠드만 따로 연결 어렵거나
        </text>
        <text x="44" y="246" fontSize="9.5" fill="#475569">
          실외기 용량 확인 필요 (중고 매입도 세트 온전해야 제값 인정)
        </text>

        {/* 오른쪽: 단품 2대 */}
        <rect x="388" y="16" width="356" height="253" rx="12" fill="#EFF6FF" stroke="#93C5FD" />
        <rect x="388" y="16" width="356" height="36" rx="12" fill="#1D4ED8" />
        <rect x="388" y="40" width="356" height="12" fill="#1D4ED8" />
        <text x="566" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          2. 단품 에어컨 2대 (각각 독립 실외기 2대)
        </text>

        <rect x="412" y="68" width="54" height="66" rx="6" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="1.5" />
        <text x="439" y="105" fontSize="9.5" fontWeight="700" fill="#1E40AF" textAnchor="middle">
          스탠드
        </text>
        <rect x="488" y="68" width="60" height="34" rx="6" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="1.5" />
        <text x="518" y="89" fontSize="9.5" fontWeight="700" fill="#1E40AF" textAnchor="middle">
          벽걸이
        </text>
        <rect x="410" y="144" width="58" height="34" rx="6" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="1.5" />
        <text x="439" y="165" fontSize="9" fontWeight="800" fill="#1E3A8A" textAnchor="middle">
          실외기 A
        </text>
        <rect x="488" y="144" width="60" height="34" rx="6" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="1.5" />
        <text x="518" y="165" fontSize="9" fontWeight="800" fill="#1E3A8A" textAnchor="middle">
          실외기 B
        </text>

        <text x="566" y="84" fontSize="10.5" fontWeight="700" fill="#1E40AF">
          장점 (독립성 · 고장 분산)
        </text>
        <text x="566" y="103" fontSize="9.5" fill="#334155">
          · 1대 고장 나도 다른 방 에어컨은 작동!
        </text>
        <text x="566" y="121" fontSize="9.5" fill="#334155">
          · 방 거리 멀어도 각각 외벽에 가깝게 설치
        </text>
        <text x="566" y="143" fontSize="10.5" fontWeight="700" fill="#DC2626">
          단점 (설치비 · 공간)
        </text>
        <text x="566" y="162" fontSize="9.5" fill="#DC2626">
          · 실외기 2대 둘 공간 없으면 설치 불가
        </text>

        <rect x="402" y="190" width="328" height="66" rx="8" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="416" y="210" fontSize="9.5" fontWeight="700" fill="#1E40AF">
          · 이사 갈 때 실외기 작업비 · 앵글비가 2대분으로 청구됨
        </text>
        <text x="416" y="230" fontSize="9.5" fill="#475569">
          · 대신 안방 벽걸이만 자녀 방으로 주거나 단품 1대만 따로 팔기
        </text>
        <text x="416" y="246" fontSize="9.5" fill="#475569">
          매우 자유로워 구축 주택 · 투룸 · 거실/방 먼 구조에 유리
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  20. R-22 vs R-410A vs R-32 냉매 세대교체 비교 도해 (54번 글)         */
/* ------------------------------------------------------------------ */
export function RefrigerantTypesComparisonDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="에어컨 냉매 3세대 비교: R-22(구형) vs R-410A vs R-32(차세대)"
      caption="오존층보호법 규제에 따라 구형 R-22는 생산·수입이 전면 금지되어 수급·충전비가 비싸고, 최신 R-32는 효율이 높지만 약가연성(A2L)이라 화기 주의가 필요합니다."
    >
      <svg
        viewBox="0 0 760 278"
        className="w-full h-auto"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          R-22, R-410A, R-32 에어컨 냉매 환경규제·특성·중고 구매 주의사항 비교
        </title>

        {/* 1열: R-22 */}
        <rect x="16" y="16" width="234" height="246" rx="12" fill="#FEF2F2" stroke="#FCA5A5" />
        <rect x="16" y="16" width="234" height="36" rx="12" fill="#DC2626" />
        <rect x="16" y="40" width="234" height="12" fill="#DC2626" />
        <text x="133" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          1세대: R-22 (프레온)
        </text>
        <rect x="28" y="64" width="210" height="58" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="40" y="84" fontSize="10" fontWeight="700" fill="#991B1B">
          생산·수입 전면 금지
        </text>
        <text x="40" y="102" fontSize="9" fill="#334155">
          · 오존층 파괴(ODP&gt;0) 규제 대상
        </text>
        <text x="40" y="116" fontSize="9" fill="#334155">
          · 지구온난화지수(GWP) 약 1,810
        </text>
        <text x="30" y="144" fontSize="9.5" fill="#DC2626" fontWeight="700">
          중고 구매·이전설치 주의점
        </text>
        <text x="30" y="162" fontSize="9" fill="#334155">
          · 잔여 재고만 유통돼 충전 비용 폭등
        </text>
        <text x="30" y="179" fontSize="9" fill="#334155">
          · 단종 연식 많아 부품 수리 불가 잦음
        </text>
        <text x="30" y="196" fontSize="9" fill="#334155">
          · 비가연성(A1)이나 구형 배관·압력 다름
        </text>
        <rect x="28" y="214" width="210" height="36" rx="6" fill="#FEE2E2" />
        <text x="133" y="236" fontSize="9.5" fontWeight="700" fill="#991B1B" textAnchor="middle">
          중고는 초단기 저가용 외 비추천
        </text>

        {/* 2열: R-410A */}
        <rect x="263" y="16" width="234" height="246" rx="12" fill="#EFF6FF" stroke="#93C5FD" />
        <rect x="263" y="16" width="234" height="36" rx="12" fill="#1D4ED8" />
        <rect x="263" y="40" width="234" height="12" fill="#1D4ED8" />
        <text x="380" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          2세대: R-410A (혼합 냉매)
        </text>
        <rect x="275" y="64" width="210" height="58" rx="8" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="287" y="84" fontSize="10" fontWeight="700" fill="#1E40AF">
          현재 중고 시장 주류 냉매
        </text>
        <text x="287" y="102" fontSize="9" fill="#334155">
          · 오존층 미파괴(ODP 0) / 비가연성(A1)
        </text>
        <text x="287" y="116" fontSize="9" fill="#334155">
          · GWP 2,088로 키갈리 의정서 감축 중
        </text>
        <text x="277" y="144" fontSize="9.5" fill="#1E40AF" fontWeight="700">
          현장 취급 · 수리 특징
        </text>
        <text x="277" y="162" fontSize="9" fill="#334155">
          · 50:50 혼합이라 부분 누설 시 전부 회수
        </text>
        <text x="277" y="179" fontSize="9" fill="#334155">
          · 진공 후 액상 정량 충전해야 효율 정상
        </text>
        <text x="277" y="196" fontSize="9" fill="#334155">
          · 부품·충전 인프라 가장 풍부해 가성비 우수
        </text>
        <rect x="275" y="214" width="210" height="36" rx="6" fill="#DBEAFE" />
        <text x="380" y="236" fontSize="9.5" fontWeight="700" fill="#1E40AF" textAnchor="middle">
          중고 매물 기준 5~8년 내외 주력군
        </text>

        {/* 3열: R-32 */}
        <rect x="510" y="16" width="234" height="246" rx="12" fill="#F0FDFA" stroke="#5EEAD4" />
        <rect x="510" y="16" width="234" height="36" rx="12" fill="#0F766E" />
        <rect x="510" y="40" width="234" height="12" fill="#0F766E" />
        <text x="627" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          3세대: R-32 (신형 단일 냉매)
        </text>
        <rect x="522" y="64" width="210" height="58" rx="8" fill="#FFFFFF" stroke="#99F6E4" />
        <text x="534" y="84" fontSize="10" fontWeight="700" fill="#0F766E">
          고효율 · 저온난화(GWP 675)
        </text>
        <text x="534" y="102" fontSize="9" fill="#334155">
          · GWP가 R-410A의 약 3분의 1 수준
        </text>
        <text x="534" y="116" fontSize="9" fill="#334155">
          · 냉매량 약 20% 줄어도 냉난방 효율↑
        </text>
        <text x="524" y="144" fontSize="9.5" fill="#C2410C" fontWeight="700">
          약가연성(A2L) 필수 수칙
        </text>
        <text x="524" y="162" fontSize="9" fill="#334155">
          · 배관 용접·회수 중 화기·스파크 엄금
        </text>
        <text x="524" y="179" fontSize="9" fill="#334155">
          · 다른 냉매(R-410A 등)와 절대 혼합 금지
        </text>
        <text x="524" y="196" fontSize="9" fill="#334155">
          · 좁은 밀폐실 설치 시 환기·충전량 엄수
        </text>
        <rect x="522" y="214" width="210" height="36" rx="6" fill="#CCFBF1" />
        <text x="627" y="236" fontSize="9.5" fontWeight="700" fill="#0F766E" textAnchor="middle">
          최근 1~4년식 고효율 신형 매물 중심
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  21. 냉방전용 vs 냉난방기 명판 · 사방밸브 구분 도해 (58번 글)         */
/* ------------------------------------------------------------------ */
export function CoolingVsHeatpumpNameplateDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="외관만 보고 속기 쉬운 냉방전용 에어컨 vs 냉난방기(히트펌프) 판별법"
      caption="리모컨에 난방 버튼이 보이더라도 실내기·실외기 명판에 정격 난방능력(W/kW)과 실외기 사방밸브가 있어야 실제로 따뜻한 바람이 나옵니다."
    >
      <svg
        viewBox="0 0 760 264"
        className="w-full h-auto"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          명판 스펙과 사방밸브 유무로 구분하는 냉방전용 vs 냉난방기 구조 비교
        </title>

        {/* 왼쪽: 냉방전용 */}
        <rect x="16" y="16" width="356" height="232" rx="12" fill="#F8FAFC" stroke="#CBD5E1" />
        <rect x="16" y="16" width="356" height="36" rx="12" fill="#334155" />
        <rect x="16" y="40" width="356" height="12" fill="#334155" />
        <text x="194" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          냉방전용 에어컨 (여름 전용)
        </text>
        <rect x="32" y="64" width="324" height="74" rx="8" fill="#FFFFFF" stroke="#E2E8F0" />
        <text x="46" y="83" fontSize="10" fontWeight="700" fill="#0F172A">
          실내기·실외기 제품 명판(스티커) 표기
        </text>
        <text x="46" y="102" fontSize="9.5" fill="#1D4ED8" fontWeight="700">
          · 정격 냉방능력: 8,300 W (만 기재됨)
        </text>
        <text x="46" y="120" fontSize="9.5" fill="#94A3B8">
          · 난방능력 · 난방 소비전력 항목 없음
        </text>

        <text x="34" y="160" fontSize="10" fontWeight="700" fill="#DC2626">
          현장 착각 주의사항
        </text>
        <text x="34" y="179" fontSize="9.5" fill="#334155">
          · 냉매 방향 바꾸는 사방밸브가 아예 없는 단방향 구조
        </text>
        <text x="34" y="197" fontSize="9.5" fill="#334155">
          · 공용 리모컨에 난방 아이콘이 떠도 온풍 절대 불가
        </text>
        <text x="34" y="215" fontSize="9.5" fill="#DC2626">
          · 영하 한겨울엔 압축기 보호를 위해 가동 자체가 막히거나
        </text>
        <text x="34" y="231" fontSize="9.5" fill="#DC2626">
          고장 원인이 될 수 있어 겨울 사용 권장되지 않음
        </text>

        {/* 오른쪽: 냉난방기 */}
        <rect x="388" y="16" width="356" height="232" rx="12" fill="#FFFBF7" stroke="#FDBA74" />
        <rect x="388" y="16" width="356" height="36" rx="12" fill="#E8521A" />
        <rect x="388" y="40" width="356" height="12" fill="#E8521A" />
        <text x="566" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          냉난방기 히트펌프 (사계절 겸용)
        </text>
        <rect x="404" y="64" width="324" height="74" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="418" y="83" fontSize="10" fontWeight="700" fill="#C2410C">
          실내기·실외기 제품 명판(스티커) 표기
        </text>
        <text x="418" y="102" fontSize="9.5" fill="#1D4ED8" fontWeight="700">
          · 정격 냉방능력: 8,300 W
        </text>
        <text x="418" y="120" fontSize="9.5" fill="#E8521A" fontWeight="700">
          · 정격 난방능력: 9,000 W (나란히 명시!)
        </text>

        <text x="406" y="160" fontSize="10" fontWeight="700" fill="#0F766E">
          구조 차이 &amp; 중고 살 때 체크
        </text>
        <text x="406" y="179" fontSize="9.5" fill="#334155">
          · 실외기 내부 사방밸브(4-Way)가 냉매 흐름을 반전시킴
        </text>
        <text x="406" y="197" fontSize="9.5" fill="#334155">
          · 겨울 실외기 성에 녹이는 제상 기능과 드레인 배수 고려
        </text>
        <text x="406" y="215" fontSize="9.5" fill="#0F766E" fontWeight="700">
          · 냉난방기는 소비전력이 더 높아 매장 계약전력 사전 확인 필수
        </text>
        <text x="406" y="231" fontSize="9.5" fill="#475569">
          (구매 전 측면 스티커 사진 1장만 찍으면 즉시 판별 가능)
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  22. 빌라·구옥·원룸 설치 전 3대 제약 체크 도해 (61번 글)             */
/* ------------------------------------------------------------------ */
export function VillaInstallConstraintsDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="아파트와 다른 빌라 · 구옥 · 원룸 에어컨·가전 설치 전 3대 현장 제약"
      caption="빌라·구축 주택은 매립 배관 대신 외벽 타공·앵글·주택용 3kW 계약전력 한계 때문에 배송 당일 설치를 못 하고 돌아가는 경우가 많습니다."
    >
      <svg
        viewBox="0 0 760 264"
        className="w-full h-auto"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          타공 불가·외벽 앵글 금지 조례·주택용 3kW 차단기 한계 3대 체크포인트
        </title>

        {/* 카드 1: 타공 */}
        <rect x="16" y="18" width="232" height="228" rx="12" fill="#FFFBF7" stroke="#FDBA74" />
        <rect x="16" y="18" width="232" height="36" rx="12" fill="#E8521A" />
        <rect x="16" y="42" width="232" height="12" fill="#E8521A" />
        <text x="132" y="41" fontSize="11.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          1. 벽 타공(구멍) 가능 여부
        </text>
        <text x="30" y="76" fontSize="10" fontWeight="700" fill="#9A3412">
          집주인 동의 &amp; 내력벽 주의
        </text>
        <text x="30" y="96" fontSize="9" fill="#334155">
          · 전세·월세는 임대인 동의 없이
        </text>
        <text x="30" y="112" fontSize="9" fill="#334155">
          신규 타공 시 원상복구 분쟁 발생
        </text>
        <text x="30" y="134" fontSize="9" fill="#334155">
          · 방화문·내력벽·난방배관 지나는
        </text>
        <text x="30" y="150" fontSize="9" fill="#334155">
          구간은 코어 타공 자체가 불가능
        </text>
        <rect x="28" y="174" width="208" height="58" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="40" y="194" fontSize="9" fontWeight="700" fill="#C2410C">
          현장 해결 팁
        </text>
        <text x="40" y="211" fontSize="8.8" fill="#475569">
          기존 구멍·창문형 키트 활용 여부 확인
        </text>
        <text x="40" y="225" fontSize="8.8" fill="#475569">
          특수 코어 천공 시 별도 추가비 발생
        </text>

        {/* 카드 2: 실외기 앵글 */}
        <rect x="264" y="18" width="232" height="228" rx="12" fill="#EFF6FF" stroke="#93C5FD" />
        <rect x="264" y="18" width="232" height="36" rx="12" fill="#1D4ED8" />
        <rect x="264" y="42" width="232" height="12" fill="#1D4ED8" />
        <text x="380" y="41" fontSize="11.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          2. 실외기 외부 앵글·난간 제한
        </text>
        <text x="278" y="76" fontSize="10" fontWeight="700" fill="#1E40AF">
          지자체 · 관리규약 돌출 금지
        </text>
        <text x="278" y="96" fontSize="9" fill="#334155">
          · 공동주택관리법상 실외기실이
        </text>
        <text x="278" y="112" fontSize="9" fill="#334155">
          있으면 외벽·난간 거치 원칙 금지
        </text>
        <text x="278" y="134" fontSize="9" fill="#334155">
          · 빌라 외벽 드라이비트 단열재는
        </text>
        <text x="278" y="150" fontSize="9" fill="#334155">
          앵커 볼트 고정이 약해 추락 위험
        </text>
        <rect x="276" y="174" width="208" height="58" rx="8" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="288" y="194" fontSize="9" fontWeight="700" fill="#1E40AF">
          설치 전 확인할 점
        </text>
        <text x="288" y="211" fontSize="8.8" fill="#475569">
          베란다 바닥 거치 · 옥상/지상 자리 확인
        </text>
        <text x="288" y="225" fontSize="8.8" fill="#475569">
          사다리차·위험수당 여부 사전 고지 필수
        </text>

        {/* 카드 3: 3kW 계약전력 */}
        <rect x="512" y="18" width="232" height="228" rx="12" fill="#FEF2F2" stroke="#FCA5A5" />
        <rect x="512" y="18" width="232" height="36" rx="12" fill="#DC2626" />
        <rect x="512" y="42" width="232" height="12" fill="#DC2626" />
        <text x="628" y="41" fontSize="11.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          3. 구옥 주택용 3kW 전기 한계
        </text>
        <text x="526" y="76" fontSize="10" fontWeight="700" fill="#991B1B">
          에어컨 + 인덕션 동시 차단
        </text>
        <text x="526" y="96" fontSize="9" fill="#334155">
          · 일반 주택·원룸 기본 계약전력은
        </text>
        <text x="526" y="112" fontSize="9" fill="#334155">
          대부분 3kW 기준(오래된 배선)
        </text>
        <text x="526" y="134" fontSize="9" fill="#334155">
          · 스탠드 에어컨 + 3구 인덕션 +
        </text>
        <text x="526" y="150" fontSize="9" fill="#334155">
          건조기 동시 켜면 차단기 바로 트립
        </text>
        <rect x="524" y="174" width="208" height="58" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="536" y="194" fontSize="9" fontWeight="700" fill="#991B1B">
          예방 체크
        </text>
        <text x="536" y="211" fontSize="8.8" fill="#475569">
          분전함 메인 차단기 A(암페어) 용량 확인
        </text>
        <text x="536" y="225" fontSize="8.8" fill="#475569">
          에어컨·건조기 순차 사용 또는 전용 회선 분리
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  63. 동배관 살두께(0.8T KS 정품 vs 얇은 박육관) 하자 비교 도해          */
/* ------------------------------------------------------------------ */
export function ThinVsStandardCopperPipeDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="KS 정품 후육 동관(0.8T~) vs 저가 얇은 동관(박육관) 단면 · 하자 비교"
      caption="겉 지름(외경)은 같아 보여도 관 벽 두께('T')가 얇은 관은 구부릴 때 납작하게 꺾이거나 고압 냉매(R-410A·R-32) 플레어 이음부에서 미세 균열·누설이 생기기 쉽습니다."
    >
      <svg
        viewBox="0 0 760 270"
        className="w-full min-w-[560px] h-auto block font-sans"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          KS 표준 두께 동배관과 저가 얇은 동배관 단면 두께·꺾임·플레어 누설 비교 도해
        </title>

        {/* 좌측: KS 표준 정품 동배관 */}
        <rect x="16" y="14" width="354" height="242" rx="12" fill="#F0FDFA" stroke="#5EEAD4" />
        <rect x="16" y="14" width="354" height="36" rx="12" fill="#0F766E" />
        <rect x="16" y="38" width="354" height="12" fill="#0F766E" />
        <text x="193" y="37" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          KS 정품 후육 동관 (0.8mm ~ 1.0mm급)
        </text>

        {/* 단면 링 (두꺼운 벽) */}
        <circle cx="96" cy="116" r="38" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
        <circle cx="96" cy="116" r="24" fill="#FFFFFF" stroke="#92400E" strokeWidth="1" />
        <text x="96" y="114" fontSize="9.5" fontWeight="700" fill="#0F766E" textAnchor="middle">
          두꺼운
        </text>
        <text x="96" y="126" fontSize="9.5" fontWeight="700" fill="#0F766E" textAnchor="middle">
          살두께
        </text>

        {/* 우측 설명 텍스트 */}
        <text x="152" y="84" fontSize="11" fontWeight="700" fill="#134E4A">
          고압 인버터(R-410A·R-32) 버팀
        </text>
        <text x="152" y="104" fontSize="9.5" fill="#334155">
          · 벤딩 시 안쪽 지름이 둥글게 유지
        </text>
        <text x="152" y="122" fontSize="9.5" fill="#334155">
          · 플레어 나팔 끝단 두께 충분 → 밀착
        </text>
        <text x="152" y="140" fontSize="9.5" fill="#334155">
          · 진동·수축에도 장기 기밀 유지 유리
        </text>

        {/* 하단 요약 카드 */}
        <rect x="30" y="172" width="326" height="70" rx="8" fill="#FFFFFF" stroke="#99F6E4" />
        <text x="44" y="192" fontSize="10" fontWeight="700" fill="#0F766E">
          정품 시공 기준 예시 (구경별 살두께)
        </text>
        <text x="44" y="210" fontSize="9.2" fill="#334155">
          {`· 1/4"(6.35mm) ~ 1/2"(12.7mm) : 0.8mm(0.8T) 이상 권장`}
        </text>
        <text x="44" y="227" fontSize="9.2" fill="#334155">
          {`· 5/8"(15.88mm) 대구경 관 : 1.0mm(1.0T) 이상 권장`}
        </text>

        {/* 우측: 얇은 박육 동배관 */}
        <rect x="390" y="14" width="354" height="242" rx="12" fill="#FEF2F2" stroke="#FCA5A5" />
        <rect x="390" y="14" width="354" height="36" rx="12" fill="#B91C1C" />
        <rect x="390" y="38" width="354" height="12" fill="#B91C1C" />
        <text x="567" y="37" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          저가 얇은 동관 (0.5~0.6mm대 · 비규격)
        </text>

        {/* 단면 링 (얇은 벽 + 찌그러짐) */}
        <ellipse cx="470" cy="116" rx="40" ry="26" fill="#F59E0B" stroke="#991B1B" strokeWidth="1.5" />
        <ellipse cx="470" cy="116" rx="35" ry="21" fill="#FFFFFF" stroke="#991B1B" strokeWidth="1" />
        <text x="470" y="114" fontSize="9.5" fontWeight="700" fill="#B91C1C" textAnchor="middle">
          납작 꺾임
        </text>
        <text x="470" y="126" fontSize="8.8" fontWeight="700" fill="#B91C1C" textAnchor="middle">
          (단면 축소)
        </text>

        {/* 우측 하자 설명 */}
        <text x="526" y="84" fontSize="11" fontWeight="700" fill="#991B1B">
          겉보기 구리색 · 실제 4대 하자 빈발
        </text>
        <text x="526" y="104" fontSize="9.5" fill="#334155">
          · 코너 구부릴 때 호스처럼 납작 꺾임
        </text>
        <text x="526" y="122" fontSize="9.5" fill="#334155">
          · 나팔(플레어) 가공 시 끝단 찢어짐
        </text>
        <text x="526" y="140" fontSize="9.5" fill="#334155">
          · 1~2년 내 미세 누설 → 재충전 반복
        </text>

        {/* 하단 경고 카드 */}
        <rect x="404" y="172" width="326" height="70" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="418" y="192" fontSize="10" fontWeight="700" fill="#B91C1C">
          소비자가 가장 많이 속는 포인트
        </text>
        <text x="418" y="210" fontSize="9.2" fill="#475569">
          · 보온재가 씌워져 있으면 겉에서 동관 두께를 볼 수 없음
        </text>
        <text x="418" y="227" fontSize="9.2" fill="#475569">
          · 철거·이전 시 끝단이 바스러져 배관 전량 교체비 이중 부담
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  64. 에어컨 배관 길이(최소 2~3m · 기본 5~7m · 장배관) 구간별 도해     */
/* ------------------------------------------------------------------ */
export function AirconPipeLengthProfileDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="실내기~실외기 배관 길이 구간별 냉매·진동·성능 영향"
      caption="배관은 너무 짧아도(2m 미만 직결) 진동·맥동 소음과 순환 불안정이 생기고, 기본 충전 길이(통상 5~7.5m)를 넘기면 연장 미터만큼 정밀 냉매 보충이 필요합니다."
    >
      <svg
        viewBox="0 0 760 255"
        className="w-full min-w-[560px] h-auto block font-sans"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          에어컨 배관 길이 구간별 최소 길이, 표준 길이, 연장 추가 충전 비교 도해
        </title>

        {/* 구간 1: 너무 짧은 구간 */}
        <rect x="16" y="16" width="228" height="222" rx="12" fill="#FFF7ED" stroke="#FDBA74" />
        <rect x="16" y="16" width="228" height="34" rx="12" fill="#EA580C" />
        <rect x="16" y="38" width="228" height="12" fill="#EA580C" />
        <text x="130" y="38" fontSize="11.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          1. 너무 짧은 직결 (약 2m 미만)
        </text>
        <text x="30" y="74" fontSize="10" fontWeight="700" fill="#9A3412">
          짧다고 무조건 좋은 게 아님
        </text>
        <text x="30" y="94" fontSize="9.2" fill="#334155">
          · 실외기 압축기 진동·웅~ 소음이
        </text>
        <text x="30" y="110" fontSize="9.2" fill="#334155">
          배관 타고 실내기 벽으로 직전달
        </text>
        <text x="30" y="132" fontSize="9.2" fill="#334155">
          · 배관 길이가 지나치게 짧으면
        </text>
        <text x="30" y="148" fontSize="9.2" fill="#334155">
          냉매 맥동·압축기 액백(액압축) 위험
        </text>
        <rect x="28" y="172" width="204" height="54" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="40" y="192" fontSize="9" fontWeight="700" fill="#C2410C">
          현장 해결 기준
        </text>
        <text x="40" y="210" fontSize="8.8" fill="#475569">
          실외기 뒤편 1바퀴 루프(감기)로
        </text>
        <text x="40" y="222" fontSize="8.8" fill="#475569">
          제조사 권장 최소 길이(보통 2~3m+) 확보
        </text>

        {/* 구간 2: 표준 기본 구간 */}
        <rect x="266" y="16" width="228" height="222" rx="12" fill="#F0FDFA" stroke="#5EEAD4" />
        <rect x="266" y="16" width="228" height="34" rx="12" fill="#0F766E" />
        <rect x="266" y="38" width="228" height="12" fill="#0F766E" />
        <text x="380" y="38" fontSize="11.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          2. 표준 기본 구간 (통상 3~7.5m)
        </text>
        <text x="280" y="74" fontSize="10" fontWeight="700" fill="#134E4A">
          공장 기본 냉매로 최적 운전
        </text>
        <text x="280" y="94" fontSize="9.2" fill="#334155">
          · 신형·검수 실외기에 미리 들어있는
        </text>
        <text x="280" y="110" fontSize="9.2" fill="#334155">
          기본 냉매량으로 추가 보충 불필요
        </text>
        <text x="280" y="132" fontSize="9.2" fill="#334155">
          {`· 설치 견적서 '기본 배관(보통 5m)'`}
        </text>
        <text x="280" y="148" fontSize="9.2" fill="#334155">
          범위에 들어가 비용이 가장 경제적
        </text>
        <rect x="278" y="172" width="204" height="54" rx="8" fill="#FFFFFF" stroke="#99F6E4" />
        <text x="290" y="192" fontSize="9" fontWeight="700" fill="#0F766E">
          실측 팁 (줄자 측정)
        </text>
        <text x="290" y="210" fontSize="8.8" fill="#475569">
          직선 대각선 대신 벽 모서리·타공 따라
        </text>
        <text x="290" y="222" fontSize="8.8" fill="#475569">
          실제 배관 경로를 재고 0.5~1m 여유 가산
        </text>

        {/* 구간 3: 장배관 연장·고저차 구간 */}
        <rect x="516" y="16" width="228" height="222" rx="12" fill="#EFF6FF" stroke="#93C5FD" />
        <rect x="516" y="16" width="228" height="34" rx="12" fill="#1D4ED8" />
        <rect x="516" y="38" width="228" height="12" fill="#1D4ED8" />
        <text x="630" y="38" fontSize="11.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          3. 장배관·고저차 구간 (8~20m+)
        </text>
        <text x="530" y="74" fontSize="10" fontWeight="700" fill="#1E40AF">
          냉매 추가 + 오일 회수 관리 필수
        </text>
        <text x="530" y="94" fontSize="9.2" fill="#334155">
          · 기본 길이 초과 m당 규정량(g)을
        </text>
        <text x="530" y="110" fontSize="9.2" fill="#334155">
          전자저울로 정확히 계량 추가해야 함
        </text>
        <text x="530" y="132" fontSize="9.2" fill="#334155">
          · 미충전 시 냉방 저하·압축기 과열,
        </text>
        <text x="530" y="148" fontSize="9.2" fill="#334155">
          과충전 시 고압 차단·소비전력 상승
        </text>
        <rect x="528" y="172" width="204" height="54" rx="8" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="540" y="192" fontSize="9" fontWeight="700" fill="#1D4ED8">
          옥상·층간 고저차 주의
        </text>
        <text x="540" y="210" fontSize="8.8" fill="#475569">
          실내기·실외기 높이차가 크면 오일트랩
        </text>
        <text x="540" y="222" fontSize="8.8" fill="#475569">
          설치 및 모델 최대 허용 길이 사전 확인 필수
        </text>
      </svg>
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ */
/*  65. 보온재 개별 보온 vs 합보온·두께·결로 예방 비교 도해               */
/* ------------------------------------------------------------------ */
export function PipeInsulationThicknessDiagram() {
  const titleId = useId();
  return (
    <DiagramFigure
      title="에어컨 배관 '개별 보온 + 적정 두께 마감' vs '부실 합보온·결로' 단면 비교"
      caption="가는 액관과 굵은 가스관을 따로 감싸지 않고 얇은 보온재 하나로 묶거나 연결부 테이핑이 벌어지면 여름철 결로 물방울이 벽지와 천장으로 스며듭니다."
    >
      <svg
        viewBox="0 0 760 250"
        className="w-full min-w-[560px] h-auto block font-sans"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          개별 보온과 합보온 비교 및 보온재 두께 부족·자외선 노출 결로 발생 도해
        </title>

        {/* 좌측: 정석 개별 보온 */}
        <rect x="16" y="14" width="354" height="222" rx="12" fill="#F0FDFA" stroke="#5EEAD4" />
        <rect x="16" y="14" width="354" height="34" rx="12" fill="#0F766E" />
        <rect x="16" y="36" width="354" height="12" fill="#0F766E" />
        <text x="193" y="36" fontSize="11.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          정석 시공: 액관·가스관 개별 보온 + 밀착 테이핑
        </text>

        {/* 2개 분리 보온 단면 */}
        <circle cx="88" cy="108" r="24" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
        <circle cx="88" cy="108" r="9" fill="#D97706" stroke="#92400E" />
        <circle cx="152" cy="108" r="30" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
        <circle cx="152" cy="108" r="13" fill="#D97706" stroke="#92400E" />
        <text x="88" y="150" fontSize="8.8" fontWeight="700" fill="#134E4A" textAnchor="middle">
          가는 액관
        </text>
        <text x="152" y="150" fontSize="8.8" fontWeight="700" fill="#134E4A" textAnchor="middle">
          굵은 가스관
        </text>

        <text x="200" y="84" fontSize="10" fontWeight="700" fill="#134E4A">
          열교환 손실 · 결로 원천 차단
        </text>
        <text x="200" y="103" fontSize="9" fill="#334155">
          · 관마다 6~9mm+ 발포 보온재 분리
        </text>
        <text x="200" y="120" fontSize="9" fill="#334155">
          · 타공 벽체·조인트 이음새 빈틈없이 마감
        </text>
        <text x="200" y="137" fontSize="9" fill="#334155">
          · 실외 노출부는 UV·아연테이프/덕트 보호
        </text>

        <rect x="28" y="168" width="330" height="54" rx="8" fill="#FFFFFF" stroke="#99F6E4" />
        <text x="42" y="188" fontSize="9.2" fontWeight="700" fill="#0F766E">
          특히 꼭 지켜야 하는 현장
        </text>
        <text x="42" y="206" fontSize="8.8" fill="#475569">
          천장 매립배관(난연 보온재 권장), 습한 지하/상가, 냉난방 겸용기
        </text>

        {/* 우측: 부실 합보온 · 결로 하자 */}
        <rect x="390" y="14" width="354" height="222" rx="12" fill="#FEF2F2" stroke="#FCA5A5" />
        <rect x="390" y="14" width="354" height="34" rx="12" fill="#DC2626" />
        <rect x="390" y="36" width="354" height="12" fill="#DC2626" />
        <text x="567" y="36" fontSize="11.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          불량 시공: 얇은 합보온 · 틈새 노출 → 결로 누수
        </text>

        {/* 1개 합보온 단면 + 물방울 */}
        <ellipse cx="478" cy="108" rx="46" ry="26" fill="#CBD5E1" stroke="#991B1B" strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="460" cy="108" r="8" fill="#D97706" />
        <circle cx="494" cy="108" r="12" fill="#D97706" />
        <path d="M478 136 C473 144 483 144 478 136 Z" fill="#2563EB" />
        <circle cx="478" cy="147" r="4" fill="#2563EB" />
        <text x="478" y="162" fontSize="8.8" fontWeight="700" fill="#991B1B" textAnchor="middle">
          두 관 맞닿아 결로 물방울
        </text>

        <text x="542" y="84" fontSize="10" fontWeight="700" fill="#991B1B">
          벽지 젖음 · 천장 곰팡이 주범
        </text>
        <text x="542" y="103" fontSize="9" fill="#334155">
          · 고온·저온 관이 한 구멍서 서로 간섭
        </text>
        <text x="542" y="120" fontSize="9" fill="#334155">
          · 얇은 저가 보온재 표면 온도 하강 → 결로
        </text>
        <text x="542" y="137" fontSize="9" fill="#334155">
          · 일반 비닐테이프 1~2년 뒤 햇빛에 바스라짐
        </text>

        <rect x="402" y="168" width="330" height="54" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="416" y="188" fontSize="9.2" fontWeight="700" fill="#B91C1C">
          실내기 물떨어짐과 헷갈리기 쉬움
        </text>
        <text x="416" y="206" fontSize="8.8" fill="#475569">
          장마철 벽 타공 주위 벽지·몰딩이 젖는다면 보온재 끊김부터 확인
        </text>
      </svg>
    </DiagramFigure>
  );
}
