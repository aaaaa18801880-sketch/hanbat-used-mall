// 파일 경로: components/guide/diagrams/home-kitchen-diagrams.tsx
import React, { useId } from "react";
import { STORE, STORE_MERCHANT_POLICY } from "../../../lib/site";
import { DiagramFigure } from "./diagram-shared";
import {
  IcemakerCleaningPhotoDiagram,
  WasherInspectionPhotoDiagram,
} from "../guide-photo-hotspot-diagram";

/* ------------------------------------------------------------------ */
/*  13. 냉장고 냉동실 정상 · 냉장실 미지근 원인 단면 도해 (14번 글)      */
/* ------------------------------------------------------------------ */
export function FridgeFreezerAirflowDiagram() {
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
export function WasherTubInspectionDiagram() {
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
export function FridgeTiltOilReturnDiagram() {
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
export function Commercial45BoxCoolingDiagram() {
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
export function IcemakerHeatRejectionDiagram() {
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
export function CommercialDishwasherSetupDiagram() {
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
/*  21. 히트펌프 건조기 vs 히터식 & 콘덴서 막힘 점검 도해 (22번 글)        */
/* ------------------------------------------------------------------ */
export function DryerHeatpumpCondenserDiagram() {
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
export function KimchiFridgeCoolingDiagram() {
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
/*  26. 음료 쇼케이스 결로·자연증발 & 토핑냉장고 체크 도해 (27번 글)     */
/* ------------------------------------------------------------------ */
export function ShowcaseCondensationDiagram() {
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
/*  33. 업소용 냉장고 수리비 vs 검수 중고 교체 손익분기 (33번 글)            */
/* ------------------------------------------------------------------ */
export function CommercialFridgeRepairRoiDiagram() {
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

/** 38번 글: 업소용 냉장고 기계실 응축기(콘덴서) 먼지·기름때 청소 및 관리 */
export function CommercialCondenserCleaningDiagram() {
  return (
    <DiagramFigure
      title="업소용 냉장고 수명 2배 늘리는 기계실 방열판(응축기) 올바른 청소법"
      caption="주방 기름때와 먼지가 알루미늄 핀을 막으면 콤프레샤가 24시간 과열로 타버립니다. 꽂혀 있던 플러그를 먼저 뽑고, 핀이 꺾이지 않게 '세로 결 방향'으로만 털어내야 합니다."
    >
      <svg
        viewBox="0 0 760 295"
        role="img"
        aria-label="업소용 냉장고 응축기 막힘 시 콤프레샤 과열 과정과 세로 결 방향 청소 방법 및 주기 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="295" rx="14" fill="#F8FAFC" />

        {/* 왼쪽: 방치 시 고장 흐름 */}
        <rect x="16" y="16" width="234" height="263" rx="12" fill="#FFF8F8" stroke="#FCA5A5" />
        <rect x="16" y="16" width="234" height="36" rx="12" fill="#DC2626" />
        <rect x="16" y="40" width="234" height="12" fill="#DC2626" />
        <text x="133" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          1. 먼지·기름때 방치 시 고장 순서
        </text>

        <rect x="30" y="68" width="206" height="38" rx="7" fill="#FFFFFF" stroke="#FECACA" />
        <text x="133" y="91" fontSize="10.5" fontWeight="700" fill="#7F1D1D" textAnchor="middle">
          주방 유증기 + 먼지가 방열판에 떡짐
        </text>
        <text x="133" y="120" fontSize="11" fontWeight="700" fill="#DC2626" textAnchor="middle">
          ↓ 바람길 막혀 열 방출 불가
        </text>
        <rect x="30" y="130" width="206" height="38" rx="7" fill="#FEF2F2" stroke="#F87171" />
        <text x="133" y="153" fontSize="10.5" fontWeight="700" fill="#991B1B" textAnchor="middle">
          콤프레샤 24시간 풀가동 · 전기세 급등
        </text>
        <text x="133" y="182" fontSize="11" fontWeight="700" fill="#DC2626" textAnchor="middle">
          ↓ 과열로 보호기 작동 반복 후 사망
        </text>
        <rect x="30" y="192" width="206" height="72" rx="7" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
        <text x="133" y="216" fontSize="11" fontWeight="800" fill="#DC2626" textAnchor="middle">
          수리비 35~55만 원 또는 식자재 폐기!
        </text>
        <text x="133" y="236" fontSize="9.5" fill="#475569" textAnchor="middle">
          + 찌든 기름먼지 과열 시 스파크·화재 위험
        </text>
        <text x="133" y="253" fontSize="9.5" fill="#475569" textAnchor="middle">
          (수명 10년 갈 냉장고가 3~4년 만에 멈춤)
        </text>

        {/* 가운데: 올바른 청소 vs 금지 행동 */}
        <rect x="263" y="16" width="244" height="263" rx="12" fill="#FFFFFF" stroke="#99F6E4" />
        <rect x="263" y="16" width="244" height="36" rx="12" fill="#0F766E" />
        <rect x="263" y="40" width="244" height="12" fill="#0F766E" />
        <text x="385" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          2. 올바른 청소 요령 (핀 방향 주의)
        </text>

        {/* 세로 결 그림 */}
        <rect x="285" y="68" width="90" height="76" rx="8" fill="#F0FDFA" stroke="#5EEAD4" />
        <line x1="302" y1="78" x2="302" y2="132" stroke="#0F766E" strokeWidth="2" />
        <line x1="316" y1="78" x2="316" y2="132" stroke="#0F766E" strokeWidth="2" />
        <line x1="330" y1="78" x2="330" y2="132" stroke="#0F766E" strokeWidth="2" />
        <line x1="344" y1="78" x2="344" y2="132" stroke="#0F766E" strokeWidth="2" />
        <line x1="358" y1="78" x2="358" y2="132" stroke="#0F766E" strokeWidth="2" />
        <text x="330" y="140" fontSize="9" fontWeight="700" fill="#0F766E" textAnchor="middle">
          ↕ 세로 결로만 쓸기
        </text>

        <text x="386" y="84" fontSize="10" fontWeight="700" fill="#0F172A">
          안전 4단계 순서
        </text>
        <text x="386" y="102" fontSize="9.5" fill="#475569">
          1. 전원 플러그 먼저 뽑기
        </text>
        <text x="386" y="119" fontSize="9.5" fill="#475569">
          2. 기계실 커버 나사 열기
        </text>
        <text x="386" y="136" fontSize="9.5" fill="#475569">
          3. 청소기 + 긴 솔로 세로 털기
        </text>

        <rect x="277" y="158" width="216" height="106" rx="8" fill="#FEF2F2" stroke="#FECACA" />
        <text x="290" y="178" fontSize="10.5" fontWeight="700" fill="#DC2626">
          절대 하면 안 되는 행동 3가지
        </text>
        <text x="290" y="198" fontSize="9.5" fill="#7F1D1D">
          · 물 뿌리기 / 물걸레질 (감전 · 누전 고장)
        </text>
        <text x="290" y="216" fontSize="9.5" fill="#7F1D1D">
          · 가로로 긁기 (얇은 알루미늄 날개 구겨짐)
        </text>
        <text x="290" y="234" fontSize="9.5" fill="#7F1D1D">
          · 뒷벽·옆벽 바짝 붙이기 (최소 10cm 이상 띄우기)
        </text>
        <text x="290" y="252" fontSize="9.5" fill="#0F766E" fontWeight="700">
          · 청소 후 찬바람 회복 안 되면 기사 점검 의뢰
        </text>

        {/* 오른쪽: 업종별 청소 주기 */}
        <rect x="520" y="16" width="224" height="263" rx="12" fill="#EFF6FF" stroke="#93C5FD" />
        <rect x="520" y="16" width="224" height="36" rx="12" fill="#1D4ED8" />
        <rect x="520" y="40" width="224" height="12" fill="#1D4ED8" />
        <text x="632" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          3. 업종별 권장 청소 주기
        </text>

        <rect x="534" y="68" width="196" height="84" rx="8" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="546" y="88" fontSize="10.5" fontWeight="700" fill="#1E40AF">
          고깃집 · 치킨집 · 중식당
        </text>
        <text x="546" y="109" fontSize="13" fontWeight="800" fill="#DC2626">
          월 1회 (심하면 2주 1회)
        </text>
        <text x="546" y="130" fontSize="9.5" fill="#475569">
          기름 입자와 먼지가 금방 떡져
        </text>
        <text x="546" y="144" fontSize="9.5" fill="#475569">
          여름 성수기 전에 콤프가 먼저 사망함
        </text>

        <rect x="534" y="166" width="196" height="98" rx="8" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="546" y="186" fontSize="10.5" fontWeight="700" fill="#1E40AF">
          카페 · 사무실 · 일반 매장
        </text>
        <text x="546" y="207" fontSize="13" fontWeight="800" fill="#0F766E">
          최소 3개월 ~ 6개월 1회
        </text>
        <text x="546" y="228" fontSize="9.5" fill="#475569">
          제빙기 · 쇼케이스 · 테이블냉장고도
        </text>
        <text x="546" y="244" fontSize="9.5" fill="#475569">
          동일한 방열판이 있어 함께 털어줘야 함
        </text>
      </svg>
    </DiagramFigure>
  );
}

/** 41번 글: 일체형 세탁건조기(콤보) vs 직렬 단독(워시타워/상하배치) 비교 */
export function WasherComboVsStackDiagram() {
  return (
    <DiagramFigure
      title="일체형 세탁건조기(AI콤보·워시콤보) vs 직렬 세탁기+건조기(워시타워) 구조와 세척 차이"
      caption="한 통에 세탁·건조가 다 들어간 일체형은 '옮기지 않아도 되는 편리함'이 최고 장점이고, 위아래 두 통이 나뉜 직렬형(워시타워 등)은 '세탁과 건조 동시 가동 · 대용량 회전'에 압도적으로 유리합니다."
    >
      <svg
        viewBox="0 0 760 295"
        role="img"
        aria-label="일체형 세탁건조기 1통 구조와 직렬 세탁기 건조기 2통 구조 및 분해세척 비용 차이 비교 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="295" rx="14" fill="#F8FAFC" />

        {/* 왼쪽: 일체형 콤보 */}
        <rect x="16" y="16" width="356" height="263" rx="12" fill="#FFFFFF" stroke="#CBD5E1" />
        <rect x="16" y="16" width="356" height="36" rx="12" fill="#0F766E" />
        <rect x="16" y="40" width="356" height="12" fill="#0F766E" />
        <text x="194" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          1. 일체형 세탁건조기 (1개의 통에서 연속 처리)
        </text>

        <rect x="38" y="68" width="94" height="106" rx="10" fill="#F0FDFA" stroke="#0F766E" strokeWidth="1.8" />
        <circle cx="85" cy="126" r="28" fill="#FFFFFF" stroke="#0F766E" strokeWidth="3" />
        <text x="85" y="124" fontSize="9.5" fontWeight="700" fill="#0F766E" textAnchor="middle">
          세탁 + 건조
        </text>
        <text x="85" y="138" fontSize="9" fill="#334155" textAnchor="middle">
          1통 공용
        </text>
        <text x="85" y="88" fontSize="9" fontWeight="700" fill="#0F766E" textAnchor="middle">
          높이 낮음
        </text>

        <text x="148" y="84" fontSize="10.5" fontWeight="700" fill="#0F766E">
          장점과 꼭 알 단점
        </text>
        <text x="148" y="103" fontSize="9.5" fill="#334155">
          · 세탁 끝나고 꺼내 옮길 필요 전혀 없음
        </text>
        <text x="148" y="121" fontSize="9.5" fill="#334155">
          · 천장 낮은 세탁실 · 1~2인 가구에 최적
        </text>
        <text x="148" y="139" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 건조 끝날 때까지 다음 빨래 못 돌림
        </text>
        <text x="148" y="157" fontSize="9.5" fill="#DC2626">
          · 세탁(25kg)보다 건조 용량(15kg 내외) 작음
        </text>

        <rect x="30" y="188" width="328" height="76" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
        <text x="44" y="208" fontSize="10.5" fontWeight="700" fill="#0F172A">
          중고 · AS · 수리 시 참고사항
        </text>
        <text x="44" y="227" fontSize="9.5" fill="#475569">
          · 세탁+히트펌프 건조 부품이 한 몸에 있어 고장 시 둘 다 멈춤
        </text>
        <text x="44" y="245" fontSize="9.5" fill="#475569">
          · 무게가 매우 무겁고 사다리차·현관 폭(가로폭+여유 10cm) 필수 점검
        </text>

        {/* 오른쪽: 직렬 단독 (워시타워 등) */}
        <rect x="388" y="16" width="356" height="263" rx="12" fill="#FFFBF7" stroke="#FDBA74" />
        <rect x="388" y="16" width="356" height="36" rx="12" fill="#E8521A" />
        <rect x="388" y="40" width="356" height="12" fill="#E8521A" />
        <text x="566" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          2. 직렬 세탁기+건조기 (워시타워 · 2개 통 분리)
        </text>

        <rect x="410" y="64" width="94" height="54" rx="8" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.5" />
        <circle cx="457" cy="91" r="17" fill="#FFFFFF" stroke="#EA580C" strokeWidth="2.5" />
        <text x="457" y="94" fontSize="8.5" fontWeight="700" fill="#C2410C" textAnchor="middle">
          상단 건조
        </text>
        <rect x="410" y="122" width="94" height="54" rx="8" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.5" />
        <circle cx="457" cy="149" r="17" fill="#FFFFFF" stroke="#EA580C" strokeWidth="2.5" />
        <text x="457" y="152" fontSize="8.5" fontWeight="700" fill="#C2410C" textAnchor="middle">
          하단 세탁
        </text>

        <text x="520" y="84" fontSize="10.5" fontWeight="700" fill="#C2410C">
          장점과 꼭 알 단점
        </text>
        <text x="520" y="103" fontSize="9.5" fill="#334155">
          · 위에서 말리는 동안 아래서 새 빨래 가동
        </text>
        <text x="520" y="121" fontSize="9.5" fill="#334155">
          · 3인 이상 가족 · 이불 빨래에 압도적 유리
        </text>
        <text x="520" y="139" fontSize="9.5" fill="#334155">
          · 1개 고장 나도 나머지 1개는 계속 사용 가능
        </text>
        <text x="520" y="157" fontSize="9.5" fill="#DC2626">
          · 세탁 끝난 젖은 빨래 직접 올려 옮겨야 함
        </text>

        <rect x="402" y="188" width="328" height="76" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="416" y="208" fontSize="10.5" fontWeight="700" fill="#C2410C">
          분해세척 시 놓치기 쉬운 추가비
        </text>
        <text x="416" y="227" fontSize="9.5" fill="#475569">
          · 드럼 분해세척(약 10~20만 원) 외 위쪽 건조기 내림·올림비 별도
        </text>
        <text x="416" y="245" fontSize="9.5" fill="#475569">
          · 워시타워/직렬 여부는 예약 전 고지해야 현장 작업 거부 예방
        </text>
      </svg>
    </DiagramFigure>
  );
}

/** 46번 글: 업소용 가스 주방 vs 전기 인덕션 주방 비교 */
export function GasVsInductionKitchenDiagram() {
  return (
    <DiagramFigure
      title="식당 주방 선택: 도시가스 화구·튀김기 vs 업소용 전기 인덕션·튀김기 비교"
      caption="가스 주방은 불맛과 용기 제한이 없는 대신 여름 주방 열기와 계량기 등급(G4·G6) 확인이 중요하고, 인덕션 주방은 쾌적하고 청소가 쉬운 대신 상가 전기 계약전력(380V 삼상) 여유가 핵심입니다."
    >
      <svg
        viewBox="0 0 760 285"
        role="img"
        aria-label="도시가스 주방 계량기 G4 G6 기준과 업소용 전기 인덕션 주방 삼상 전기 공사비 열기 유지비 비교 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="285" rx="14" fill="#F8FAFC" />

        {/* 왼쪽: 가스 주방 */}
        <rect x="16" y="16" width="356" height="253" rx="12" fill="#FFFBF7" stroke="#FDBA74" />
        <rect x="16" y="16" width="356" height="36" rx="12" fill="#E8521A" />
        <rect x="16" y="40" width="356" height="12" fill="#E8521A" />
        <text x="194" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          도시가스 화구 · 튀김기 (불맛 · 냄비 무제한)
        </text>

        <text x="32" y="76" fontSize="10.5" fontWeight="700" fill="#9A3412">
          사전 확인: 가스 계량기 등급과 총 화력(kcal/h)
        </text>
        <rect x="32" y="88" width="324" height="62" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="44" y="108" fontSize="9.5" fill="#334155">
          · G4 (6등급): 최대 약 6만 kcal/h (소규모 분식 · 일반 2~3구)
        </text>
        <text x="44" y="126" fontSize="9.5" fill="#334155">
          · G6 (10등급): 최대 약 10만 kcal/h (중형 식당 · 화구 다수)
        </text>
        <text x="44" y="143" fontSize="9" fill="#C2410C" fontWeight="700">
          → 용량 넘기면 계량기·배관 증설(승압) 공사 필요!
        </text>

        <rect x="32" y="164" width="324" height="90" rx="8" fill="#FFF7ED" stroke="#FED7AA" />
        <text x="44" y="185" fontSize="10" fontWeight="700" fill="#9A3412">
          장점 vs 단점 요약
        </text>
        <text x="44" y="204" fontSize="9.5" fill="#334155">
          · (+) 직화 불맛 가능, 알루미늄/뚝배기/웍 모든 냄비 사용
        </text>
        <text x="44" y="222" fontSize="9.5" fill="#334155">
          · (+) 이미 큰 가스 배관·계량기 있으면 전기 승압보다 비용 절약
        </text>
        <text x="44" y="240" fontSize="9.5" fill="#DC2626">
          · (-) 여름 주방 매우 덥고 그을음 청소 · 가스경보기/안전검사 필수
        </text>

        {/* 오른쪽: 전기 인덕션 주방 */}
        <rect x="388" y="16" width="356" height="253" rx="12" fill="#EFF6FF" stroke="#93C5FD" />
        <rect x="388" y="16" width="356" height="36" rx="12" fill="#1D4ED8" />
        <rect x="388" y="40" width="356" height="12" fill="#1D4ED8" />
        <text x="566" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          전기 인덕션 · 전기튀김기 (쾌적 · 고효율)
        </text>

        <text x="404" y="76" fontSize="10.5" fontWeight="700" fill="#1E40AF">
          사전 확인: 한전 계약전력과 삼상 380V 차단기
        </text>
        <rect x="404" y="88" width="324" height="62" rx="8" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="416" y="108" fontSize="9.5" fill="#334155">
          · 업소용 1구 3.5~5kW, 2~3구·대형 튀김기 10~15kW 이상 소비
        </text>
        <text x="416" y="126" fontSize="9.5" fill="#334155">
          · 에어컨·냉장고와 합산해 상가 계약전력 여유 확인 필수
        </text>
        <text x="416" y="143" fontSize="9" fill="#1D4ED8" fontWeight="700">
          → 가스 미인입 신축 상가·지하·백화점 입점에 사실상 표준
        </text>

        <rect x="404" y="164" width="324" height="90" rx="8" fill="#FFFFFF" stroke="#BFDBFE" />
        <text x="416" y="185" fontSize="10" fontWeight="700" fill="#1E40AF">
          장점 vs 단점 요약
        </text>
        <text x="416" y="204" fontSize="9.5" fill="#334155">
          · (+) 주변 공기 안 데워 주방 쾌적 + 냉방비 절감 + 청소 쉬움
        </text>
        <text x="416" y="222" fontSize="9.5" fill="#334155">
          · (-) 380V 전용 차단기·배선·한전 kW 증설 비용 들 수 있음
        </text>
        <text x="416" y="240" fontSize="9.5" fill="#DC2626">
          · (-) 자석 붙는 전용 스텐/철 냄비만 가능 · 직화 불맛은 제한적
        </text>
      </svg>
    </DiagramFigure>
  );
}

/** 47번 글(사용자 추가 요청): 가스 구이기·렌지 LPG vs LNG 비교 (압력·노즐·경보기 위치) */
export function LpgVsLngNozzleDetectorDiagram() {
  return (
    <DiagramFigure
      title="업소용 가스 구이기·로스터·렌지 LPG vs LNG(도시가스) 핵심 차이"
      caption="LPG(가스통)는 무거워서 바닥에 깔리고 압력이 세서 노즐 구멍이 작습니다. 반대로 LNG(도시가스)는 가벼워서 천장에 뜨고 압력이 약해 노즐 구멍이 큽니다. 기기를 바꿔 꽂으면 대형 사고가 납니다."
    >
      <svg
        viewBox="0 0 760 305"
        role="img"
        aria-label="LPG 액화석유가스와 LNG 도시가스 압력 2.8kPa 대 2.0kPa, 노즐 구멍 크기, 경보기 바닥 30cm 대 천장 30cm 비교 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="305" rx="14" fill="#F8FAFC" />

        {/* 왼쪽: LPG (가스통) */}
        <rect x="16" y="16" width="356" height="273" rx="12" fill="#FFFBF7" stroke="#FDBA74" />
        <rect x="16" y="16" width="356" height="36" rx="12" fill="#E8521A" />
        <rect x="16" y="40" width="356" height="12" fill="#E8521A" />
        <text x="194" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          LPG (프로판 통 · 벌크 저장조)
        </text>

        {/* 노즐 & 경보기 그림 */}
        <rect x="34" y="66" width="136" height="114" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="102" y="84" fontSize="10" fontWeight="700" fill="#9A3412" textAnchor="middle">
          누출 시 바닥에 깔림!
        </text>
        <text x="102" y="102" fontSize="9.5" fill="#475569" textAnchor="middle">
          공기보다 1.5~2배 무거움
        </text>
        <rect x="46" y="142" width="112" height="24" rx="4" fill="#FEF2F2" stroke="#DC2626" />
        <text x="102" y="158" fontSize="9.5" fontWeight="800" fill="#DC2626" textAnchor="middle">
          경보기: 바닥 30cm 이내
        </text>

        <text x="184" y="84" fontSize="10.5" fontWeight="700" fill="#9A3412">
          기계 세팅 기준
        </text>
        <text x="184" y="104" fontSize="9.5" fill="#334155">
          · 공급 압력: 약 2.8 kPa (높음)
        </text>
        <text x="184" y="122" fontSize="9.5" fill="#334155">
          · 발열량 높아 조금만 나와도 화력 셈
        </text>
        <text x="184" y="140" fontSize="10" fill="#C2410C" fontWeight="800">
          · 노즐(분출구) 구멍: 매우 작음!
        </text>
        <text x="184" y="158" fontSize="9" fill="#64748B">
          (업소 일반 버너 약 1.1~2.3mm)
        </text>

        <rect x="30" y="192" width="328" height="82" rx="8" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="44" y="213" fontSize="10" fontWeight="700" fill="#991B1B">
          LPG용 기기에 LNG(도시가스)를 그대로 꽂으면?
        </text>
        <text x="44" y="232" fontSize="9.5" fill="#7F1D1D">
          · 구멍이 너무 작아 가스가 적게 나오고 화력이 아주 약해짐
        </text>
        <text x="44" y="250" fontSize="9.5" fill="#7F1D1D">
          · 불꽃이 자주 꺼지거나 미연소 가스가 샐 위험 증가
        </text>

        {/* 오른쪽: LNG (도시가스) */}
        <rect x="388" y="16" width="356" height="273" rx="12" fill="#EFF6FF" stroke="#93C5FD" />
        <rect x="388" y="16" width="356" height="36" rx="12" fill="#1D4ED8" />
        <rect x="388" y="40" width="356" height="12" fill="#1D4ED8" />
        <text x="566" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          LNG (배관으로 들어오는 도시가스)
        </text>

        <rect x="406" y="66" width="136" height="114" rx="8" fill="#FFFFFF" stroke="#BFDBFE" />
        <rect x="418" y="76" width="112" height="24" rx="4" fill="#DBEAFE" stroke="#1D4ED8" />
        <text x="474" y="92" fontSize="9.5" fontWeight="800" fill="#1E40AF" textAnchor="middle">
          경보기: 천장 30cm 이내
        </text>
        <text x="474" y="138" fontSize="10" fontWeight="700" fill="#1E40AF" textAnchor="middle">
          누출 시 천장으로 뜸!
        </text>
        <text x="474" y="156" fontSize="9.5" fill="#475569" textAnchor="middle">
          공기보다 가벼움(비중 0.55)
        </text>

        <text x="556" y="84" fontSize="10.5" fontWeight="700" fill="#1E40AF">
          기계 세팅 기준
        </text>
        <text x="556" y="104" fontSize="9.5" fill="#334155">
          · 공급 압력: 약 2.0 kPa (상대적 약함)
        </text>
        <text x="556" y="122" fontSize="9.5" fill="#334155">
          · 체적 열량 낮아 많이 통과시켜야 함
        </text>
        <text x="556" y="140" fontSize="10" fill="#1D4ED8" fontWeight="800">
          · 노즐(분출구) 구멍: 상대적으로 큼!
        </text>
        <text x="556" y="158" fontSize="9" fill="#64748B">
          (업소 일반 버너 약 2.3~3.4mm+)
        </text>

        <rect x="402" y="192" width="328" height="82" rx="8" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="416" y="213" fontSize="10" fontWeight="700" fill="#991B1B">
          LNG용 기기에 LPG(가스통)를 그대로 꽂으면? (매우 위험!)
        </text>
        <text x="416" y="232" fontSize="9.5" fill="#7F1D1D">
          · 큰 구멍에 높은 압력+고열량 LPG가 폭주 → 긴 붉은 불꽃·그을음
        </text>
        <text x="416" y="250" fontSize="9.5" fill="#7F1D1D" fontWeight="700">
          · 불완전 연소 일산화탄소 중독 · 과열 화재로 이어짐 (임의 개조 불법)
        </text>
      </svg>
    </DiagramFigure>
  );
}

/** 48번 글: 한파 시 제빙기·온수기·식기세척기 동파 예방(퇴수·보온·해동) */
export function WinterKitchenFreezeCareDiagram() {
  return (
    <DiagramFigure
      title="영하 한파 매장 마감 전 3가지 기기 동파 예방(퇴수 · 보온) 및 안전 해동"
      caption="추운 날 밤 난방을 끄는 매장은 제빙기·온수기·식기세척기 내부 고인 물을 빼두지 않으면 물통이나 밸브가 얼어 터집니다. 얼었을 때 끓는 물이나 토치를 대면 부품이 녹아 영구 손상됩니다."
    >
      <svg
        viewBox="0 0 760 285"
        role="img"
        aria-label="제빙기, 온수기, 식기세척기 겨울철 퇴수 위치와 보온 및 미온수 해동 수칙 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="285" rx="14" fill="#F8FAFC" />

        {/* 1. 제빙기 */}
        <rect x="16" y="16" width="234" height="178" rx="12" fill="#EFF6FF" stroke="#93C5FD" />
        <rect x="16" y="16" width="234" height="34" rx="12" fill="#0369A1" />
        <rect x="16" y="38" width="234" height="12" fill="#0369A1" />
        <text x="133" y="37" fontSize="11.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          1. 업소용 제빙기
        </text>
        <text x="28" y="72" fontSize="9.5" fill="#0F172A" fontWeight="700">
          · 전원 뽑고 수도(직수) 밸브 잠그기
        </text>
        <text x="28" y="92" fontSize="9.5" fill="#334155">
          · 내부 물통·드레인 마개 열어 잔수 빼기
        </text>
        <text x="28" y="112" fontSize="9.5" fill="#334155">
          · 뒤쪽 입수 호스 찬바람 보온재 감싸기
        </text>
        <text x="28" y="142" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 급수 밸브 얼어 터지면 다음 날 누수!
        </text>
        <text x="28" y="162" fontSize="9" fill="#475569">
          (휴무 전 얼음저장고 물기도 미리 제거)
        </text>

        {/* 2. 온수기 */}
        <rect x="263" y="16" width="234" height="178" rx="12" fill="#FFFBF7" stroke="#FDBA74" />
        <rect x="263" y="16" width="234" height="34" rx="12" fill="#D97706" />
        <rect x="263" y="38" width="234" height="12" fill="#D97706" />
        <text x="380" y="37" fontSize="11.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          2. 업소용 온수기
        </text>
        <text x="275" y="72" fontSize="9.5" fill="#0F172A" fontWeight="700">
          · 전원 끄고 물 식힌 뒤(화상 주의!)
        </text>
        <text x="275" y="92" fontSize="9.5" fill="#334155">
          · 입수 밸브 잠그고 하단 퇴수밸브 열기
        </text>
        <text x="275" y="112" fontSize="9.5" fill="#334155">
          · 추출 레버도 열어 물탱크 완전히 비우기
        </text>
        <text x="275" y="142" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 물 탱크 얼면 용접부 터져 수리 불가!
        </text>
        <text x="275" y="162" fontSize="9" fill="#475569">
          (직수 파이프 벽면 보온 튜브 시공 필수)
        </text>

        {/* 3. 식기세척기 */}
        <rect x="510" y="16" width="234" height="178" rx="12" fill="#F0FDFA" stroke="#5EEAD4" />
        <rect x="510" y="16" width="234" height="34" rx="12" fill="#0F766E" />
        <rect x="510" y="38" width="234" height="12" fill="#0F766E" />
        <text x="627" y="37" fontSize="11.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          3. 업소용 식기세척기
        </text>
        <text x="522" y="72" fontSize="9.5" fill="#0F172A" fontWeight="700">
          · 차단기·전원 내리고 배수 마개 뽑기
        </text>
        <text x="522" y="92" fontSize="9.5" fill="#334155">
          · 급수 앵글밸브 잠그고 호스 물 빼기
        </text>
        <text x="522" y="112" fontSize="9.5" fill="#334155">
          · 도어 살짝 열어 내부 습기·고착 예방
        </text>
        <text x="522" y="142" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 물 없이 억지로 켜면 세척 펌프 소손!
        </text>
        <text x="522" y="162" fontSize="9" fill="#475569">
          (급수·세제 호스 찬바람 틈 단열재 보강)
        </text>

        {/* 하단 공통 안전 해동 배너 */}
        <rect x="16" y="206" width="728" height="64" rx="10" fill="#FEF2F2" stroke="#FCA5A5" />
        <text x="380" y="229" fontSize="11" fontWeight="800" fill="#991B1B" textAnchor="middle">
          이미 얼었을 때 해동 공식: 전원 끄기 → 미지근한 물수건 · 헤어드라이어 약풍(거리 띄움)만 사용
        </text>
        <text x="380" y="250" fontSize="10" fontWeight="700" fill="#DC2626" textAnchor="middle">
          절대 금지: 팔팔 끓는 물 붓기 · 휴대용 토치(화기) 갖다 대기 → 배관 터짐 및 대형 화재 유발!
        </text>
      </svg>
    </DiagramFigure>
  );
}

/** 49번 글: 김치냉장고·냉동고 칼·송곳 성에 제거 위험 vs 안전 해동 */
export function FreezerDefrostPipeRiskDiagram() {
  return (
    <DiagramFigure
      title="냉동고·김치냉장고 칼로 성에 긁다 폐기되는 구조와 안전한 제상 순서"
      caption="뚜껑형 김치냉장고와 직냉식 업소용 냉동고는 내벽 바로 뒤에 얇은 냉매 배관이 지나갑니다. 날카로운 칼·송곳으로 성에를 찍는 순간 가스 구멍이 뚫려 수리가 불가능할 수 있습니다."
    >
      <svg
        viewBox="0 0 760 275"
        role="img"
        aria-label="내벽 바로 뒤 알루미늄 냉매 배관 찔림 파손 구조와 전원 차단 후 자연 해동 순서 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="275" rx="14" fill="#F8FAFC" />

        {/* 왼쪽: 위험 단면 */}
        <rect x="16" y="16" width="356" height="243" rx="12" fill="#FFF8F8" stroke="#FCA5A5" />
        <rect x="16" y="16" width="356" height="36" rx="12" fill="#DC2626" />
        <rect x="16" y="40" width="356" height="12" fill="#DC2626" />
        <text x="194" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          절대 금지: 칼 · 송곳 · 쇠주걱으로 얼음 찍기
        </text>

        <rect x="40" y="68" width="134" height="114" rx="8" fill="#FFFFFF" stroke="#E2E8F0" />
        {/* 내벽 단면 */}
        <rect x="48" y="76" width="22" height="98" fill="#BAE6FD" />
        <text x="59" y="128" fontSize="8.5" fontWeight="700" fill="#0369A1" textAnchor="middle">
          성에
        </text>
        <rect x="70" y="76" width="8" height="98" fill="#94A3B8" />
        <circle cx="84" cy="124" r="6" fill="#0F766E" />
        <rect x="78" y="76" width="14" height="98" fill="none" stroke="#64748B" />
        <line x1="116" y1="124" x2="78" y2="124" stroke="#DC2626" strokeWidth="3" />
        <text x="130" y="114" fontSize="9.5" fontWeight="800" fill="#DC2626">
          칼날 관통!
        </text>
        <text x="130" y="142" fontSize="8.5" fill="#991B1B">
          냉매 가스 누설
        </text>

        <text x="188" y="84" fontSize="10.5" fontWeight="700" fill="#991B1B">
          왜 못 고치는 경우가 많을까?
        </text>
        <text x="188" y="103" fontSize="9.5" fill="#475569">
          · 내벽 판 바로 뒤에 알루미늄 관 밀착
        </text>
        <text x="188" y="121" fontSize="9.5" fill="#475569">
          · 미세 구멍으로 냉매 가스 100% 유실
        </text>
        <text x="188" y="139" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 단열재(우레탄폼) 속에 매립돼
        </text>
        <text x="188" y="157" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 구멍 찾기도 어렵고 용접 불가능 다수
        </text>

        <rect x="30" y="196" width="328" height="50" rx="8" fill="#FFFFFF" stroke="#FECACA" />
        <text x="194" y="218" fontSize="10" fontWeight="700" fill="#991B1B" textAnchor="middle">
          구멍 난 채 계속 켜 두면 수분·기름 섞여 콤프레샤까지 타버림
        </text>
        <text x="194" y="235" fontSize="9.5" fill="#475569" textAnchor="middle">
          → 멀쩡하던 수십만~백만 원대 제품이 순식간에 폐기 판정!
        </text>

        {/* 오른쪽: 안전한 정석 제상 */}
        <rect x="388" y="16" width="356" height="243" rx="12" fill="#F0FDFA" stroke="#5EEAD4" />
        <rect x="388" y="16" width="356" height="36" rx="12" fill="#0F766E" />
        <rect x="388" y="40" width="356" height="12" fill="#0F766E" />
        <text x="566" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          제조사 공식 안전 제상(성에 제거) 4단계
        </text>

        <rect x="406" y="68" width="320" height="36" rx="7" fill="#FFFFFF" stroke="#99F6E4" />
        <text x="418" y="90" fontSize="10" fontWeight="700" fill="#0F766E">
          1단계. 음식 비우고 전원 코드(또는 해당 칸 전원) 끄기
        </text>

        <rect x="406" y="112" width="320" height="36" rx="7" fill="#FFFFFF" stroke="#99F6E4" />
        <text x="418" y="134" fontSize="10" fontWeight="700" fill="#0F766E">
          2단계. 문 활짝 열어 자연 해동 (+ 따뜻한 물 그릇 안에 두기)
        </text>

        <rect x="406" y="156" width="320" height="36" rx="7" fill="#FFFFFF" stroke="#99F6E4" />
        <text x="418" y="178" fontSize="10" fontWeight="700" fill="#0F766E">
          3단계. 얼음이 저절로 들뜨면 부드러운 플라스틱 주걱으로 걷기
        </text>

        <rect x="406" y="200" width="320" height="44" rx="7" fill="#CCFBF1" stroke="#0F766E" />
        <text x="418" y="220" fontSize="10" fontWeight="700" fill="#134E4A">
          4단계. 마른 수건으로 물기 완전 건조 후 전원 재투입
        </text>
        <text x="418" y="236" fontSize="9" fill="#0F766E">
          (물기 남아 있으면 전원 켠 지 며칠 만에 성에가 다시 두껍게 생김)
        </text>
      </svg>
    </DiagramFigure>
  );
}

/** 50번 글: 냉장고 키친핏 vs 프리스탠딩 깊이·방열 여유·문열림 각도 */
export function KitchenfitVsFreestandingDiagram() {
  return (
    <DiagramFigure
      title="2·4도어 냉장고 [키친핏 vs 프리스탠딩] 깊이 · 방열 여유 · 문 열림 간섭 비교"
      caption="키친핏은 싱크대 라인(깊이 700mm)에 딱 들어가는 대신 용량이 조금 작고 좌우·상단 방열 여유가 필수이며, 프리스탠딩은 대용량이지만 장 앞으로 10~20cm 튀어나오고 문이 벽에 닿을 수 있습니다."
    >
      <svg
        viewBox="0 0 760 285"
        role="img"
        aria-label="키친핏 깊이 700mm와 프리스탠딩 깊이 800~900mm, 측면 방열 12~29mm, 문 90도 열림 각도 간섭 비교 도해"
        className="w-full h-auto"
      >
        <rect x="0" y="0" width="760" height="285" rx="14" fill="#F8FAFC" />

        {/* 왼쪽: 키친핏 */}
        <rect x="16" y="16" width="356" height="253" rx="12" fill="#FFFFFF" stroke="#5EEAD4" />
        <rect x="16" y="16" width="356" height="36" rx="12" fill="#0F766E" />
        <rect x="16" y="40" width="356" height="12" fill="#0F766E" />
        <text x="194" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          키친핏 (빌트인형 · 깊이 약 700mm 기준)
        </text>

        <rect x="44" y="70" width="130" height="66" rx="6" fill="#E2E8F0" stroke="#64748B" />
        <rect x="56" y="76" width="106" height="58" rx="4" fill="#F0FDFA" stroke="#0F766E" strokeWidth="1.5" />
        <text x="109" y="103" fontSize="10" fontWeight="800" fill="#0F766E" textAnchor="middle">
          가구장 앞면 딱 일치
        </text>
        <text x="109" y="120" fontSize="8.5" fill="#475569" textAnchor="middle">
          튀어나옴 없음 (약 600L대)
        </text>

        <text x="188" y="84" fontSize="10" fontWeight="700" fill="#0F766E">
          제조사 공식 여유 공간 기준
        </text>
        <text x="188" y="103" fontSize="9.5" fill="#334155">
          · 가구장 깊이: 최소 700~720mm 이상
        </text>
        <text x="188" y="120" fontSize="9.5" fill="#334155">
          · 좌우 여백: 삼성 12mm+ / LG 23~29mm+
        </text>
        <text x="188" y="137" fontSize="9.5" fill="#334155">
          · 높이 여백: 장 내경 1,900mm+ 권장
        </text>

        <rect x="30" y="156" width="328" height="98" rx="8" fill="#F0FDFA" stroke="#99F6E4" />
        <text x="44" y="177" fontSize="10" fontWeight="700" fill="#0F766E">
          방열 부족·콘센트 돌출 시 생기는 문제
        </text>
        <text x="44" y="196" fontSize="9.5" fill="#334155">
          · 사방 여유 공간 없이 끼워 넣으면 열이 갇혀 소음·전기세·고장 급증
        </text>
        <text x="44" y="214" fontSize="9.5" fill="#334155">
          · 정중앙 뒷면 콘센트 플러그가 꽂히면 냉장고가 앞으로 3~5cm 밀려남
        </text>
        <text x="44" y="232" fontSize="9.5" fill="#0F766E" fontWeight="700">
          · 김치냉장고 나란히 페어 설치 시 연결 키트 규격·좌우 합산 폭 확인!
        </text>

        {/* 오른쪽: 프리스탠딩 */}
        <rect x="388" y="16" width="356" height="253" rx="12" fill="#FFFBF7" stroke="#FDBA74" />
        <rect x="388" y="16" width="356" height="36" rx="12" fill="#E8521A" />
        <rect x="388" y="40" width="356" height="12" fill="#E8521A" />
        <text x="566" y="39" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          프리스탠딩 (대용량 · 깊이 약 800~900mm+)
        </text>

        <rect x="416" y="70" width="130" height="54" rx="6" fill="#E2E8F0" stroke="#64748B" />
        <rect x="428" y="76" width="106" height="68" rx="4" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.5" />
        <text x="481" y="106" fontSize="10" fontWeight="800" fill="#C2410C" textAnchor="middle">
          앞으로 10~20cm 돌출
        </text>
        <text x="481" y="128" fontSize="8.5" fill="#475569" textAnchor="middle">
          대신 용량 큼 (800~900L+)
        </text>

        <text x="560" y="84" fontSize="10" fontWeight="700" fill="#C2410C">
          가장 흔한 문 열림 실수
        </text>
        <text x="560" y="103" fontSize="9.5" fill="#334155">
          · 제품 본체 가로(910mm)만 보고 삼
        </text>
        <text x="560" y="120" fontSize="9.5" fill="#DC2626" fontWeight="700">
          · 문짝 두께 때문에 90도 열면 가로 더 필요!
        </text>
        <text x="560" y="137" fontSize="9.5" fill="#334155">
          · 옆 벽에 막혀 야채서랍 안 빠지는 사고 빈발
        </text>

        <rect x="402" y="156" width="328" height="98" rx="8" fill="#FFFFFF" stroke="#FED7AA" />
        <text x="416" y="177" fontSize="10" fontWeight="700" fill="#C2410C">
          중고 냉장고 구매 · 이사 전 줄자 3종 체크
        </text>
        <text x="416" y="196" fontSize="9.5" fill="#334155">
          1. 장 깊이 확인: 키친핏은 700mm 장, 프리스탠딩은 통로 좁아 보임 감안
        </text>
        <text x="416" y="214" fontSize="9.5" fill="#334155">
          2. 서랍 빠지는 각도(최소 90도+) 위해 양옆 벽·싱크대 측판 간섭 확인
        </text>
        <text x="416" y="232" fontSize="9.5" fill="#334155">
          3. 문 열림까지 여유 가로 약 1,100mm 안팎인지 + 뒷면 방열 5cm 확인
        </text>
      </svg>
    </DiagramFigure>
  );
}
