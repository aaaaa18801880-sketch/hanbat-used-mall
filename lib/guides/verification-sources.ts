// 파일 경로: lib/guides/verification-sources.ts
import type { InfoGuideVerification } from "./types";

const VERIFIED_DATE = "2026-11-15";

const URLS = {
  LAW: "https://www.law.go.kr",
  KATS: "https://standard.go.kr",
  KEA: "https://www.energy.or.kr",
  KEA_EEP: "https://eep.energy.or.kr",
  KESCO: "https://www.kesco.or.kr",
  KEPCO: "https://cyber.kepco.co.kr",
  KCA: "https://www.kca.go.kr",
  FTC: "https://www.ftc.go.kr",
  NTS: "https://www.nts.go.kr",
  SAREK: "https://www.sarek.or.kr",
  ASHRAE: "https://www.ashrae.org",
  NFA: "https://www.nfa.go.kr",
  ECYCLE: "https://www.15990903.or.kr",
  KGS: "https://www.kgs.or.kr",
  SAMSUNG: "https://www.samsung.com/sec/support/",
  LG: "https://www.lge.co.kr/support",
} as const;

export const GUIDE_GOVERNANCE_DISCLAIMER =
  "본 게시물은 공개된 정부·공공기관 기준, 국가표준, 제조사 기술자료 및 학술 자료를 확인한 뒤 한밭중고전자 현장 점검 경험을 더해 소비자 이해를 돕기 위해 작성되었습니다. 제품 사양, 연식, 건물 전기·배관 여건에 따라 실제 적용 기준은 달라질 수 있으므로, 중요한 안전·설치·법률 판단 전에는 해당 제조사 공식 설명서와 관계 기관의 최신 기준을 함께 확인해 주세요. (안내: 본 게시판은 한밭중고전자 직영 매장에서 운영하며, 글에 소개된 점검 기준과 연계된 자사 매물 안내가 포함될 수 있습니다.)";

export const GUIDE_VERIFICATION_BY_SLUG: Record<string, InfoGuideVerification> = {
  "new-aircon-repair-delay": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "공정거래위원회",
        title: "소비자분쟁해결기준 (가전제품 품질보증기간 및 부품보유기간)",
        url: URLS.FTC,
        date: "현행 고시 기준",
        usedFor: "에어컨 품질보증 및 핵심 부품 보유·공급 의무 기간 기준 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "시스템·인버터 에어컨 서비스 접수 및 부품 수급 안내",
        url: URLS.SAMSUNG,
        date: "공식 지원 기준",
        usedFor: "인버터 기판(PCB) 모델별 전용화 및 여름철 성수기 방문 지연 구조 확인",
      },
    ],
    fieldNote:
      "보증·부품 기준은 공정거래위원회 고시에 근거하며, 성수기 3~4주 대기 사례는 매장 수리·대체 접수 현장 경험입니다.",
  },
  "voltage-220v-vs-380v": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "산업통상자원부 · 대한전기협회",
        title: "한국전기설비규정(KEC) 저압 전로 및 단상·삼상 공급 방식",
        url: URLS.LAW,
        date: "현행 규정",
        usedFor: "단상 220V(2선식)와 삼상 380V(3상 4선식) 배선·접지·차단기 기준 확인",
      },
      {
        org: "한국전기안전공사(KESCO)",
        title: "업소용 냉난방기 전용 차단기 및 누전차단기 안전 수칙",
        url: URLS.KESCO,
        date: "공식 안전 안내",
        usedFor: "대용량 부하 연결 시 전선 발열 및 차단기 안전 용량 확보 원칙",
      },
    ],
    fieldNote:
      "전압·배선 규격은 KEC 및 KESCO 기준이며, 30평형 이상 대형 기종의 분전반 현장 점검 사례는 실무 경험입니다.",
  },
  "startup-closure-docs-and-power": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "국가법령정보센터 · 국세청",
        title: "식품위생법 시행규칙(영업신고) 및 부가가치세법(세금계산서 · 폐업신고)",
        url: URLS.NTS,
        date: "현행 법령",
        usedFor: "영업신고 → 사업자등록 순서, 매입세액 공제 요건, 폐업 신고 절차 확인",
      },
      {
        org: "한국전력공사(KEPCO)",
        title: "상가 일반용 계약전력 산정 및 동시 사용률 안내",
        url: URLS.KEPCO,
        date: "공식 약관 기준",
        usedFor: "주방 가열기기·냉난방기 합산 시 계약전력 여유 확보 기준 확인",
      },
    ],
    fieldNote:
      "인허가·세무 절차는 국세청·관계 법령 기준이며, 주방 기기 동시 가동률 70~80% 산정은 상업 현장 실측 경험입니다.",
  },
  "electricity-bill-capacity-and-kepco": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "한국전력공사(KEPCO)",
        title: "전기공급약관 및 전기요금표 (주택용 누진제 vs 일반용 계약전력 기본요금)",
        url: URLS.KEPCO,
        date: "현행 요금표",
        usedFor: "계약전력(kW) 기본요금과 전력량(kWh) 요금 구조 및 승압 절차 확인",
      },
      {
        org: "한국전기안전공사(KESCO)",
        title: "전기설비 증설 사용전점검 안내",
        url: URLS.KESCO,
        date: "공식 점검 기준",
        usedFor: "계약전력 증설·삼상 변경 시 내선공사 및 안전점검 절차 확인",
      },
    ],
    fieldNote:
      "요금 구조·약관은 한전 공시 기준이며, 공사 기간(2~4주) 및 임대차 계약 전 체크 요령은 현장 상담 경험입니다.",
  },
  "ladder-truck-and-clearance": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "일반 정보 (권장 재검토 12개월)",
    primarySources: [
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "대형 냉장고 · 세탁기 설치 공간 및 출입구 통과 치수 안내",
        url: URLS.LG,
        date: "공식 설치 가이드",
        usedFor: "도어 탈거 시 통과 가능 폭, 좌우·후면 최소 방열 여유 공간 기준 확인",
      },
      {
        org: "한국소비자원",
        title: "대형 가전제품 배송·설치 시 사다리차 및 추가 비용 유의사항",
        url: URLS.KCA,
        date: "소비자 안내",
        usedFor: "현장 반입 불가로 인한 반송·사다리차 비용 사전 안내 필요성 확인",
      },
    ],
    fieldNote:
      "제품 외형·여유 치수는 제조사 매뉴얼 기준이며, 업소용 45박스(85cm) 및 꺾인 복도 판단 기준은 매장 직영 배송 경험입니다.",
  },
  "why-used-over-new-and-store-over-p2p": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "일반 정보 (권장 재검토 12개월)",
    primarySources: [
      {
        org: "공정거래위원회 · 한국소비자원",
        title: "개인 간 직거래 분쟁 유의사항 및 사업자 품질보증 책임 기준",
        url: URLS.KCA,
        date: "소비자 가이드",
        usedFor: "개인 직거래 환불·수리 공백 위험과 사업자 보증·세금계산서 증빙 차이 확인",
      },
      {
        org: "국세청",
        title: "사업자 중고 설비 매입 시 전자세금계산서 · 적격증빙 안내",
        url: URLS.NTS,
        date: "현행 세무 안내",
        usedFor: "창업 시 사업자 증빙 수취를 통한 비용 처리 기준 확인",
      },
    ],
    fieldNote:
      "제도·증빙 차이는 소비자원·국세청 기준이며, 초기 시설비 절감폭(40~60%)과 자사 보증(에어컨 최대 8개월·주요 가전 최대 4개월)은 매장 운영 기준입니다.",
  },
  "appliance-buyback-no-deduction-guide": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "일반 정보 (권장 재검토 12개월)",
    primarySources: [
      {
        org: "환경부 · 한국폐가전제품자원순환센터",
        title: "대형 폐가전 배출 및 지자체 폐기물 수수료 기준",
        url: URLS.LAW,
        date: "공식 안내",
        usedFor: "노후·고장 가전의 무상/유상 배출 비교 기준 확인",
      },
      {
        org: "한국소비자원",
        title: "중고 가전제품 방문 매입 시 사전 견적·감가 분쟁 예방 안내",
        url: URLS.KCA,
        date: "소비자 안내",
        usedFor: "사진·명판·층수 사전 고지를 통한 현장 감가 분쟁 예방 원칙 확인",
      },
    ],
    fieldNote:
      "폐기 제도·분쟁 예방 원칙은 관계 기관 안내 기준이며, 10년 이내 연식·부속품 상태별 매입 단가 기준은 매장 실무 기준입니다.",
  },
  "aircon-how-it-works-and-parts": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "국가기술표준원",
        title: "KS C 9306 에어컨디셔너 구조 및 냉방 사이클 표준 용어",
        url: URLS.KATS,
        date: "국가표준",
        usedFor: "압축기·응축기·팽창기구·증발기 4대 핵심 부품 작동 원리 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "에어컨 설치 시 진공 작업 및 필터·실외기 관리 공식 매뉴얼",
        url: URLS.SAMSUNG,
        date: "공식 기술자료",
        usedFor: "배관 내 수분·공기 제거(진공 작업) 누락과 통풍 차단에 따른 고장 원인 확인",
      },
    ],
    fieldNote:
      "냉매 순환 원리는 표준·제조사 자료 기준이며, 현장 고장의 상당수가 시공·관리 환경에서 시작된다는 비중 안내는 정비 경험입니다.",
  },
  "why-outdoor-unit-survives-rain-and-shock": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "에어컨 실외기 옥외 설치 및 방수·우천 시 운전 안내",
        url: URLS.LG,
        date: "공식 설명서",
        usedFor: "실외기 우천 가동 가능 설계(상부 기판 분리·배수 홀) 및 덮개 사용 주의 확인",
      },
      {
        org: "국가기술표준원",
        title: "KS C 9306 및 전기용품 안전기준 (실외기 외함 방수 보호등급)",
        url: URLS.KATS,
        date: "국가표준",
        usedFor: "옥외 기기의 비·눈 노출 내성 및 침수·고압수 직사 금지 기준 확인",
      },
    ],
    fieldNote:
      "방수·설치 기준은 제조사 설명서와 KS 기준이며, 장마철 침수 및 루버창 밀폐 과열 사례는 현장 수리 경험입니다.",
  },
  "what-is-pcb-and-why-it-fails": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "삼성전자 · LG전자 서비스 가이드",
        title: "인버터 실외기 제어기판(PCB) 고장 코드 및 보호 기능 안내",
        url: URLS.SAMSUNG,
        date: "공식 기술자료",
        usedFor: "실내외기 통신·압축기 제어 원리 및 과열·서지 차단 보호 로직 확인",
      },
      {
        org: "한국전기안전공사(KESCO)",
        title: "낙뢰·정전 복전 시 전자기판 서지 피해 및 누전 예방 수칙",
        url: URLS.KESCO,
        date: "공식 안전 안내",
        usedFor: "낙뢰·전압 변동 시 차단기 관리 및 감전·합선 위험 안내",
      },
    ],
    fieldNote:
      "기판 보호 구조·안전 수칙은 제조사 및 KESCO 기준이며, 실외기실 열 축적과 벌레 유입 합선 빈도는 분해 점검 현장 사례입니다.",
  },
  "why-ceiling-aircon-install-costs-more": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "삼성전자 · LG전자 상업용 설치 매뉴얼",
        title: "천장형 카세트 4Way 실내기 행거 볼트 · 드레인 펌프 시공 기준",
        url: URLS.LG,
        date: "공식 시공 지침",
        usedFor: "슬라브 매달기, 배수 펌프·구배 시공, 인테리어 2회 방문 공정 구조 확인",
      },
      {
        org: "한국소비자원",
        title: "시스템·스탠드 에어컨 설치비 추가 요금 사전 안내 가이드",
        url: URLS.KCA,
        date: "소비자 안내",
        usedFor: "기본설치 외 타공·배관·고소 작업비 구분 및 사전 견적 확인 원칙",
      },
    ],
    fieldNote:
      "시공 공정·배관 규격은 제조사 매뉴얼 기준이며, 스탠드형 대비 작업 시간과 자재 차이는 현장 시공 사례입니다.",
  },
  "why-no-outdoor-unit-on-walkway-defrost": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "국가법령정보센터(국토교통부)",
        title: "건축물의 설비기준 등에 관한 규칙 제23조 (냉방·배기설비 배기구 설치 기준)",
        url: URLS.LAW,
        date: "현행 법령",
        usedFor: "도로·보행로 인접 배기구는 지면 2m 이상 높이 또는 보행자 비직사 규정 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "히트펌프 냉난방기 겨울철 '제상 운전' 시 수증기 및 응축수 안내",
        url: URLS.SAMSUNG,
        date: "공식 설명서",
        usedFor: "성에 제거(제상) 시 배수 발생 및 흰 수증기 정상 현상 확인",
      },
    ],
    fieldNote:
      "2m 배기 높이 규정과 제상 원리는 현행 법령 및 제조사 안내 기준이며, 보도 빙판 민원·오인 신고 사례는 현장 실무 경험입니다.",
  },
  "fixed-speed-vs-inverter-aircon": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "한국에너지공단",
        title: "에어컨 정속형 · 인버터 가변출력 운전 및 효율등급 시험 기준",
        url: URLS.KEA_EEP,
        date: "공식 효율 안내",
        usedFor: "압축기 속도 가변(인버터)과 고정속(정속형)의 운전·소비전력 차이 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "인버터 에어컨 절전 운전 조건 및 모델별 수리 구조 안내",
        url: URLS.LG,
        date: "공식 설명서",
        usedFor: "장시간 연속 사용 환경에서 인버터 절전 효과가 커지는 운전 특성 확인",
      },
    ],
    fieldNote:
      "작동 원리·효율 차이는 에너지공단 및 제조사 자료 기준이며, 중고 시장 내 수리 난이도·부품비 비교는 매장 정비 경험입니다.",
  },
  "fridge-warm-not-cooling-defrost": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "냉동실은 정상이지만 냉장실만 약할 때 자가점검 · 성에 제거 가이드",
        url: URLS.SAMSUNG,
        date: "공식 점검 안내",
        usedFor: "냉동실 1개 냉각기에서 팬·댐퍼로 냉장실에 냉기를 보내는 순환 구조 확인",
      },
      {
        org: "한국소비자원",
        title: "가정용 냉장고 도어 패킹 관리 및 온도 이상 시 점검 주의사항",
        url: URLS.KCA,
        date: "소비자 안내",
        usedFor: "문 고무 패킹 들뜸에 따른 성에 누적 및 식중독 예방 온도 확인",
      },
    ],
    fieldNote:
      "냉기 순환 및 성에 제거 원리는 제조사 매뉴얼 기준이며, 24~48시간 자연 해동 후 재발 패턴은 매장 수리 실측 경험입니다.",
  },
  "top-load-vs-front-load-washer-used-tips": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "일반 정보 (권장 재검토 12개월)",
    primarySources: [
      {
        org: "한국소비자원",
        title: "전자동(통돌이) vs 드럼세탁기 물 사용량 · 세탁 특성 비교 정보",
        url: URLS.KCA,
        date: "소비자 비교정보",
        usedFor: "세탁 방식별 물 사용량, 옷감 손상, 대량 세탁 장단점 비교 기준 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "세탁기 수평 조절 · 댐퍼 진동 · 배수 필터 및 통살균 점검 안내",
        url: URLS.LG,
        date: "공식 사용설명서",
        usedFor: "세탁조 흔들림, 도어 고무 패킹, 배수 펌프 필터 점검 항목 확인",
      },
    ],
    fieldNote:
      "방식별 특성은 소비자원·제조사 자료 기준이며, 중고 매입·검수 시 스파이더·댐퍼 확인 요령은 매장 세척·수리 경험입니다.",
  },
  "why-never-lay-fridge-flat-moving": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "냉장고 이사·이동 시 눕힘 금지 및 설치 후 전원 연결 대기 시간 안내",
        url: URLS.SAMSUNG,
        date: "공식 사용설명서",
        usedFor: "수직 운반 원칙 및 기울여 이동한 뒤 오일 안정화를 위한 전원 대기 기준 확인",
      },
      {
        org: "한국소비자원",
        title: "이사·자가 운반 중 냉장고 컴프레셔·배관 손상 예방 주의사항",
        url: URLS.KCA,
        date: "소비자 가이드",
        usedFor: "운반 각도에 따른 냉동유 역류 및 뒷면 배관 눌림 위험 확인",
      },
    ],
    fieldNote:
      "수직 운반 및 대기 원칙은 제조사 매뉴얼 기준이며, 기울기별 1~2시간 / 3~4시간 / 12~24시간 대기 구분은 현장 배송·수리 경험입니다.",
  },
  "commercial-45box-direct-vs-fan-cooling": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "국내 주요 업소용 냉장고 제조사(라셀르 · 우성 · 유니크 등)",
        title: "업소용 45박스 직냉식 · 간냉식 사용설명서 및 기계실 청소 주기 안내",
        url: URLS.KATS,
        date: "제품 매뉴얼 기준",
        usedFor: "직냉식/간냉식 냉각 구조 차이 및 상·하단 기계실 방열판 먼지 청소 기준 확인",
      },
      {
        org: "한국에너지공단 · 식품의약품안전처",
        title: "영업용 냉장·냉동설비 적정 보관 온도(냉장 0~5℃ / 냉동 -18℃ 이하) 및 관리 지침",
        url: URLS.KEA,
        date: "공식 관리 기준",
        usedFor: "음식점 식재료 안전 보관 온도 및 문 개폐에 따른 효율 저하 기준 확인",
      },
    ],
    fieldNote:
      "냉각 방식·보관 온도 기준은 제조사 설명서·관계 기관 지침이며, 주방 기름먼지 막힘 고장 사례는 매장 AS 경험입니다.",
  },
  "commercial-icemaker-not-freezing-causes": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "국내외 업소용 제빙기 제조사(브레마 · 호시자키 · 카이저 등)",
        title: "제빙기 급수 수압 · 방열 간격 · 정수 필터 및 만빙 센서 점검 매뉴얼",
        url: URLS.KCA,
        date: "제조사 매뉴얼 기준",
        usedFor: "얼음 두께 저하(수압·필터·응축기 막힘) 및 작동 정지(만빙 센서) 원인 확인",
      },
      {
        org: "식품의약품안전처",
        title: "식용 얼음 위생 및 제빙기 필터·저빙고 세척 관리 안내",
        url: URLS.LAW,
        date: "공식 위생 안내",
        usedFor: "정수 필터 교체 및 내부 물집·배수 위생 관리 주기 확인",
      },
    ],
    fieldNote:
      "급수·센서·위생 기준은 제조사 설명서·식약처 지침이며, 주 1회 먼지망 세척 및 6개월 필터 교체 기준은 카페 납품 현장 경험입니다.",
  },
  "commercial-dishwasher-3-essentials": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "식품의약품안전처 · 국가법령정보센터",
        title: "식품위생법 및 식기류 살균 소독(고온 헹굼) 위생 관리 기준",
        url: URLS.LAW,
        date: "공식 위생 기준",
        usedFor: "업소용 식기세척기 세척·고온 헹굼 온도 확보 필요성 확인",
      },
      {
        org: "한국전기안전공사(KESCO) · 국내 세척기 제조사",
        title: "3~4kW 이상 가열기기 전용 차단기 및 자연배수·펌프 내장형 설치 설명서",
        url: URLS.KESCO,
        date: "공식 설치 기준",
        usedFor: "20~30A 전용 차단기 직결, 외부 온수기 연결, 배수구 높이 조건 확인",
      },
    ],
    fieldNote:
      "전기 안전과 위생 기준은 KESCO·관계 지침 기준이며, 식당 현장 설치 전 체크 순서는 매장 납품 경험입니다.",
  },
  "aircon-refrigerant-annual-recharge-myth": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "에어컨 냉매(가스) 보충 주기 안내 — 밀폐 순환 구조 및 누설 시 조치",
        url: URLS.SAMSUNG,
        date: "공식 FAQ",
        usedFor: "정상 밀폐 배관에서는 냉매가 소모되지 않으며 부족 시 누설 점검이 우선임 확인",
      },
      {
        org: "국가법령정보센터 · 환경부",
        title: "대기환경보전법 및 고압가스 안전관리 관련 냉매 회수·누출 관리 안내",
        url: URLS.LAW,
        date: "현행 법령",
        usedFor: "냉매 무단 대기 방출 방지 및 안전한 누설 수리·회수 원칙 확인",
      },
    ],
    fieldNote:
      "밀폐 순환·법적 관리 원칙은 제조사 FAQ와 환경 법령 기준이며, 주요 3대 누설 부위(연결 나사·용접부·코일)는 수리 현장 사례입니다.",
  },
  "aircon-pyeong-sizing-cafe-restaurant": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "학술연구 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "대한설비공학회 (홍왕석·김영일·정광섭, 서울과학기술대학교)",
        title: "상업용 식당 공조시스템의 급기 및 배기 풍량에 따른 냉방에너지 특성 연구 (2012 동계학술발표회 논문집, pp.215~220)",
        url: URLS.SAREK,
        date: "2012년 발표",
        usedFor: "식당 주방·홀 후드 배기에 따라 유입되는 바깥 더운 공기가 전체 냉방 부하를 크게 좌우하는 원리 확인",
      },
      {
        org: "미국공조냉동공학회 (ASHRAE)",
        title: "ASHRAE Standard 154 · Handbook Fundamentals Ch.18 / HVAC Applications Ch.34",
        url: URLS.ASHRAE,
        date: "국제 공조 표준",
        usedFor: "직화 구이기(숯불·로스터) 열량의 20~35%가 후드에 안 잡히고 실내 복사열로 축적되는 수치 및 배기 외기부하 기준 확인",
      },
      {
        org: "국가기술표준원 · 한국에너지공단",
        title: "KS C 9306(에어컨디셔너 1평 ≒ 약 400W) 및 열사용시설기준 상업·판매시설 단위냉방부하",
        url: URLS.KEA,
        date: "국가표준 · 공식 기준",
        usedFor: "표기 평형의 표준 실내(27℃)·실외(35℃) 전제와 상업 공간 기본 냉방부하 차이(179.1~225.6 W/㎡) 확인",
      },
      {
        org: "삼성(DVM Pro) · LG(LATS) B2B 설계 기준 및 외식 설비·닥트 실측",
        title: "상업공간 업종별 부하 기준(고깃집 180~230+ W/㎡) · 로스터(1구 약 3,000kcal/h) · 테이블 닥트(350~600 CMH) 설계 기준",
        url: URLS.LG,
        date: "설계 · 실측 기준",
        usedFor: "일반 식당(1.8~2.2배)과 달리 숯불·닥트 고깃집은 실평수의 3~4배(20평 기준 60~80평형 · 2대 분산)가 필요한 이유 교차 확인",
      },
    ],
    fieldNote:
      "열역학·부하 수치는 논문·ASHRAE·KS·제조사 설계 기준에 근거하며, 소비자 가독성을 위해 본문은 쉬운 일상어로 풀어 적고 상세 출처·분산 배치·유증기 배수 요령을 구분 표기했습니다.",
  },
  "heat-pump-vs-heater-dryer-used-tips": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "한국에너지공단 · 한국소비자원",
        title: "의류건조기 히트펌프식 vs 히터식 소비전력 및 건조 온도 비교",
        url: URLS.KEA_EEP,
        date: "소비자 비교정보",
        usedFor: "저온 제습 순환(히트펌프)의 전기요금 절감 및 옷감 수축 저감 특성 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "인버터 히트펌프 건조기 열교환기(콘덴서) 청소 및 배수 펌프 점검 안내",
        url: URLS.SAMSUNG,
        date: "공식 사용설명서",
        usedFor: "콘덴서 보풀 누적에 따른 건조 시간 증가·냄새 및 배수 찌꺼기 점검법 확인",
      },
    ],
    fieldNote:
      "전력·구조 차이는 에너지공단·소비자원 자료 기준이며, 중고 분해세척 필요 여부 판단은 매장 정비 경험입니다.",
  },
  "kimchi-fridge-lid-vs-stand-used-tips": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "일반 정보 (권장 재검토 12개월)",
    primarySources: [
      {
        org: "한국소비자원",
        title: "김치냉장고 뚜껑형 vs 스탠드형 냉기 보존 · 보관 특성 비교",
        url: URLS.KCA,
        date: "소비자 비교정보",
        usedFor: "상부 개폐 방식(뚜껑형)의 냉기 보존성과 스탠드형 칸별 전환 장점 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "김치냉장고 내통 김치국물 부식 예방 및 도어 패킹 관리 안내",
        url: URLS.LG,
        date: "공식 설명서",
        usedFor: "염분 누출 시 내통 냉각배관 부식 위험 및 서랍 레일·패킹 관리 기준 확인",
      },
    ],
    fieldNote:
      "제품 구조·사용 주의는 소비자원·제조사 설명서 기준이며, 중고 거래 시 내통 미세 누설·패킹 감별 요령은 매장 검수 경험입니다.",
  },
  "inverter-aircon-24h-on-vs-off-electricity": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "한국에너지공단 · 한국소비자원",
        title: "여름철 인버터 에어컨 vs 정속형 에어컨 운전 방식별 소비전력 비교 시험",
        url: URLS.KEA,
        date: "공식 시험 안내",
        usedFor: "인버터 기종의 짧은 외출(1~2시간) 유지 운전 vs 장시간 외출 전원 끄기 기준 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "에어컨 제습 모드와 냉방 모드의 작동 원리 및 전력 소모 차이",
        url: URLS.SAMSUNG,
        date: "공식 FAQ",
        usedFor: "제습 모드도 실외기가 가동되며 희망온도 도달 시 냉방과 절전 효과가 유사·역전될 수 있음 확인",
      },
    ],
    fieldNote:
      "전력 시험 원리는 에너지공단·제조사 FAQ 기준이며, 매장·가정 영업시간별 체감 요금 팁은 고객 상담 경험입니다.",
  },
  "aircon-indoor-water-leak-causes": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "에어컨 실내기 물 떨어짐 자가점검 (드레인 막힘 · 배수호스 U자 · 필터 결빙)",
        url: URLS.LG,
        date: "공식 점검 가이드",
        usedFor: "찬 바람 유무로 배수 문제와 냉각핀 얼음 녹음을 구분하는 방법과 호스 정리 원칙 확인",
      },
      {
        org: "대형 상업용 에어컨 시공 매뉴얼",
        title: "응축수 자연배수 기울기(1/100~1/50) 및 천장형 드레인 펌프 양정 기준",
        url: URLS.KATS,
        date: "시공 표준 기준",
        usedFor: "물 고임·역류 방지를 위한 내리막 경사와 배수 펌프 점검 요령 확인",
      },
    ],
    fieldNote:
      "응축수 배출 원리와 점검 절차는 제조사 가이드 기준이며, 4대 증상 분류와 응급 처치는 매장 수리 출동 경험입니다.",
  },
  "aircon-pipe-reuse-aluminum-vs-copper": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "국가기술표준원 · 한국소비자원",
        title: "KS 에어컨 냉매 동배관 규격 및 알루미늄 배관 재사용 피해 예방 안내",
        url: URLS.KCA,
        date: "소비자 피해주의",
        usedFor: "신냉매(R-410A/R-32) 고압 조건에서 알루미늄 배관 재사용 시 균열 누설 위험 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "아파트 매립배관 설치 전 질소 세척 및 기밀(누설) 검사 안내",
        url: URLS.SAMSUNG,
        date: "공식 설치 지침",
        usedFor: "구형 냉매(R-22) 잔류 오일 제거를 위한 질소 세척 및 압력 검사 절차 확인",
      },
    ],
    fieldNote:
      "자재 특성·매립배관 절차는 소비자원 및 제조사 지침 기준이며, 이중 재시공 사례는 이전설치 현장 실무 경험입니다.",
  },
  "commercial-showcase-and-topping-fridge": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "업소용 냉장·쇼케이스 제조사(라셀르 · 캐리어 · 한성쇼케이스 등)",
        title: "음료 쇼케이스 복층유리 · 열선 결로 제거 및 자연증발 물받이 관리 매뉴얼",
        url: URLS.KATS,
        date: "제품 설명서 기준",
        usedFor: "유리 내부 김서림(실링 손상)과 외부 물방울(열선·습도) 구분 및 물받이 관리법 확인",
      },
      {
        org: "한국에너지공단",
        title: "상업용 냉장쇼케이스 방열 통풍 공간 확보 및 하절기 과부하 예방 안내",
        url: URLS.KEA,
        date: "공식 효율 안내",
        usedFor: "카운터 매립 시 통풍구 부족에 따른 컴프레샤 과열 정지 예방 원칙 확인",
      },
    ],
    fieldNote:
      "구조·방열 원리는 제조사 설명서·에너지공단 안내 기준이며, 카운터 맞춤 타공 조언은 카페·음식점 납품 경험입니다.",
  },
  "resale-value-commercial-appliances": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "일반 정보 (권장 재검토 12개월)",
    primarySources: [
      {
        org: "한국소비자원 · 공정거래위원회",
        title: "해외 직구 가전(50Hz/부품 수급) 주의사항 및 감가·유지보수 유의점",
        url: URLS.KCA,
        date: "소비자 안내",
        usedFor: "국내 전원(60Hz)·AS 망 미비 제품 구매 시 수리 및 재처분 불리함 확인",
      },
      {
        org: "한국전기안전공사(KESCO)",
        title: "국내 상업용 표준 전원(단상 220V/60Hz vs 삼상 380V) 호환 안내",
        url: URLS.KESCO,
        date: "전기 기준",
        usedFor: "표준 전원 기종의 범용성과 380V 소형 기기의 설치 제약 확인",
      },
    ],
    fieldNote:
      "전원·직구 유의사항은 소비자원·KESCO 기준이며, 1260mm 45박스 등 품목별 중고 매입 시세 방어 기준은 매장 거래 경험입니다.",
  },
  "energy-efficiency-rating-myth-and-kwh": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "산업통상자원부 · 한국에너지공단",
        title: "효율관리기자재 운용규정 및 에너지소비효율등급 개편·라벨 읽는 법",
        url: URLS.KEA_EEP,
        date: "현행 고시 기준",
        usedFor: "등급 기준 주기적 상향에 따른 신·구 제품 간 역전 현상 및 kWh 지표 비교 원리 확인",
      },
      {
        org: "한국소비자원",
        title: "가전제품 에너지등급 라벨 '월간/연간 소비전력량(kWh)' 확인 가이드",
        url: URLS.KCA,
        date: "소비자 안내",
        usedFor: "등급 숫자 대신 라벨 하단 kWh 수치와 제조년월을 함께 비교하는 기준 확인",
      },
    ],
    fieldNote:
      "등급 개편 규정과 라벨 해석은 산업부·에너지공단·소비자원 기준이며, 제품 가격차 대비 회수 기간 계산 예시는 실무 상담 경험입니다.",
  },
  "aircon-single-large-vs-multi-split": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "삼성전자 · LG전자 상업용 시스템 가이드",
        title: "실내기 기류 도달 거리 · 1대 대형 vs 다대수 분산 배치 시공 기준",
        url: URLS.LG,
        date: "공식 설계 기준",
        usedFor: "유효 기류 도달 거리(약 7~10m)와 ㄱ자·칸막이 공간 분산 배치 필요성 확인",
      },
      {
        org: "한국전기안전공사(KESCO)",
        title: "40평형급 이상 대용량 부하의 단상 220V 한계 및 회선 분배·삼상 기준",
        url: URLS.KESCO,
        date: "공식 전기 안내",
        usedFor: "대형 1대 단독 시 차단기 부담과 2대 분배 시 배선 조건 비교 확인",
      },
    ],
    fieldNote:
      "기류 도달·전기 규격은 제조사 및 KESCO 기준이며, 성수기 1대 고장 대비 이중화와 중고 환금성 비교는 매장 실무 경험입니다.",
  },
  "commercial-induction-plug-vs-breaker": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "국가기술표준원 · 대한전기협회",
        title: "KS C 8305 배선용 꽂음 접속기(가정용 16A/250V 콘센트 정격) 및 KEC 전선 허용전류",
        url: URLS.KATS,
        date: "국가표준 · 현행 KEC",
        usedFor: "표준 벽체 콘센트·멀티탭 16A(약 3.5kW) 정격 한계 및 4.0SQ/6.0SQ 전선 굵기 기준 확인",
      },
      {
        org: "한국전기안전공사(KESCO)",
        title: "상업용 고전력 가열기기 멀티탭 문어발 사용 금지 및 단독 차단기 직결 수칙",
        url: URLS.KESCO,
        date: "공식 화재 예방 수칙",
        usedFor: "연속 고부하 시 플러그 과열·피복 용융 화재 예방 및 20~40A 직결 원칙 확인",
      },
    ],
    fieldNote:
      "전류·배선 규격·화재 예방 기준은 KS C 8305 및 KEC/KESCO 공식 기준이며, 기기별 현장 배선 사례는 납품 시공 경험입니다.",
  },
  "cafe-plumbing-drain-checklist": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "상업용 주방설비 · 제빙기·커피머신 제조사 가이드",
        title: "급수 직수 밸브 · 정수 필터 분기 · 자연배수 구배(1/50~1/100) 설치 기준",
        url: URLS.KATS,
        date: "공식 설치 기준",
        usedFor: "카운터 하부 배수 역류 방지 기울기와 뒷면 통풍 15cm 확보 원칙 확인",
      },
      {
        org: "식품의약품안전처",
        title: "카페·휴게음식점 정수 필터 및 급·배수 위생 설비 기준",
        url: URLS.LAW,
        date: "공식 위생 기준",
        usedFor: "정수 라인 관리 및 바닥 배수 위생 분리 기준 확인",
      },
    ],
    fieldNote:
      "설치·위생 규격은 제조사 설명서·관계 기준이며, 인테리어 마감 전 5대 체크 순서는 다수 카페 일괄 납품 경험입니다.",
  },
  "commercial-fridge-repair-vs-replace": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "공정거래위원회",
        title: "소비자분쟁해결기준 (내용연수·부품보유기간 및 수리·교체 기준 참고)",
        url: URLS.FTC,
        date: "현행 고시 기준",
        usedFor: "가전·냉장기기 권장 사용 연수와 부품 수급 한계 판단 기준 확인",
      },
      {
        org: "주요 업소용 냉장고 제조사 서비스 기준",
        title: "소모품(팬모터·센서·패킹) 교체 vs 핵심부(콤프레샤·배관 누설) 수리 안내",
        url: URLS.SAMSUNG,
        date: "공식 서비스 안내",
        usedFor: "주변 부품 수리 범위와 중수리(압축기 소손) 시 잔여 수명 리스크 확인",
      },
    ],
    fieldNote:
      "기준 연수·부품 구조는 공정위 고시·서비스 기준이며, 수리 견적(5~18만원 vs 35~55만원) 손익분기 판단은 매장 AS·교체 경험입니다.",
  },
  "aircon-relocation-cost-variables": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "한국소비자원",
        title: "에어컨 이전설치 추가 비용(배관 연장 · 앵글 · 타공) 소비자 피해 예방 안내",
        url: URLS.KCA,
        date: "소비자 가이드",
        usedFor: "기본설치 외 현장 추가 항목 사전 고지 및 견적 분쟁 예방 기준 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "에어컨 이전설치 표준 항목 (기본 배관 5m, 매립배관 세척, 진공 작업 안내)",
        url: URLS.LG,
        date: "공식 설치 기준",
        usedFor: "기본 설치 포함 범위와 5m 초과 연장·질소세척 추가 작업 원인 확인",
      },
    ],
    fieldNote:
      "표준 공정·분쟁 예방 기준은 소비자원·제조사 안내 기준이며, 재설치 vs 교체 판단 사례와 사전 사진 3장 공식은 매장 상담 경험입니다.",
  },
  "neutral-wire-risk-and-licensed-electrician": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "국가법령정보센터",
        title: "「전기공사업법」 제3조(전기공사의 제한 등) · 시행령 제5조(경미한 전기공사) · 제41조의2(벌칙)",
        url: URLS.LAW,
        date: "현행 법령 기준",
        usedFor: "단순 1:1 수선 외 분전반·차단기·회로 증설의 등록 전기공사업자 시공 의무 및 3년 이하 징역·3천만원 이하 벌금 처벌 기준 확인",
      },
      {
        org: "산업통상자원부 · 대한전기협회 (KEC)",
        title: "한국전기설비규정(KEC) 도체 식별 색상(갈·흑·회·청·녹황) 및 다선식 전로·개폐 순서 안전 기준",
        url: URLS.KATS,
        date: "국가 기술기준",
        usedFor: "구형 건물(청색=L3/T상)과 현행 KEC(청색=중성선 N) 색상 반전에 따른 오결선 위험 및 선입후절·실측 필수 근거 확인",
      },
      {
        org: "한국전기안전공사 (KESCO · 1889)",
        title: "중성선(N선) 단선·접촉불량에 따른 이상 과전압 피해 및 전기화재 예방 안내",
        url: URLS.KESCO,
        date: "공공 안전 안내",
        usedFor: "N선 단선 시 220V 가전 직렬 연결에 따른 과전압 소손 원리, 일반 차단기 미동작 가능성, 이상 징후 시 전원 차단 및 1889 신고 절차 확인",
      },
    ],
    fieldNote:
      "법령 처벌·경미공사 범위·색상 기준·과전압 원리는 국가법령정보센터·KEC·한국전기안전공사 공식 기준이며, 상가 분전함 오결선 및 냉장고·포스기 연쇄 고장 사례는 매장 현장 경험입니다. 안전 수칙상 자가 분전함 배선 조작 안내는 제공하지 않습니다.",
  },
  "elb-vs-mccb-breaker-trip-check": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "한국전기안전공사 (KESCO · 1889)",
        title: "누전차단기 동작 원리(정격감도전류 30mA 이하 · 0.03초 이내) 및 장마철 전기안전 점검 요령",
        url: URLS.KESCO,
        date: "공공 안전 기준",
        usedFor: "인체감전보호용 누전차단기(ELB)와 배선용차단기(MCCB) 역할 차이, 월 1회 TEST 버튼 점검, 장마철 차단기 반복 트립 시 플러그 분리 점검 절차 확인",
      },
      {
        org: "국가기술표준원 · 산업통상자원부",
        title: "한국산업표준(KS) 저압 차단기 규격 및 KEC 옥내 배선·물기 구역 누전차단기 설치 기준",
        url: URLS.KATS,
        date: "국가 표준 기준",
        usedFor: "습기 구역 누전차단기 필수 적용 및 고장 차단기 즉시 교체 필요성 확인",
      },
    ],
    fieldNote:
      "차단기 동작 스펙·점검 방법은 전기안전공사 및 KS 기준이며, 식당·카페 주방 기기별 누전 가려내기 순서와 테이프 고정 금지 사례는 매장 현장 경험입니다.",
  },
  "oled-vs-qled-led-used-tv-guide": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "공정거래위원회 · 한국소비자원",
        title: "소비자분쟁해결기준 (TV 패널 2년 · 일반 부품 1년 보증) 및 TV 디스플레이 품질·수리 분쟁 예방 안내",
        url: URLS.FTC,
        date: "현행 고시 · 소비자 안내",
        usedFor: "TV 패널 보증기간 및 중고 구매 전 대기업 부품 수급·수리비 리스크 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "OLED 패널 픽셀 리프레시(잔상 방지 보정) 및 QLED·LED TV 통풍·백라이트 수명 관리 안내",
        url: URLS.LG,
        date: "공식 사용설명서",
        usedFor: "OLED 자발광 번인 특성, 리모컨 OFF 후 전원 차단 금지 이유, LCD 백라이트 열관리 방법 확인",
      },
    ],
    fieldNote:
      "보증기간과 패널 관리 방식은 공정위·제조사 공식 안내에 근거하며, 단색 화면 테스트를 통한 번인·백라이트 멍 현장 판별법은 매장 직검수 기준입니다.",
  },
  "commercial-fridge-condenser-cleaning": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "주요 업소용 냉장고 제조사 · 삼성전자서비스",
        title: "업소용 냉장고·쇼케이스 기계실 응축기(콘덴서) 정기 청소 주기 및 세로 결 방향 브러시 청소 지침",
        url: URLS.SAMSUNG,
        date: "공식 유지관리 안내",
        usedFor: "일반 매장 3~6개월 · 기름 업종 월 1회(2주~1개월) 청소 주기, 방열 공간 10cm 이상 확보, 물청소 금지 및 핀 꺾임 주의사항 확인",
      },
      {
        org: "한국전기안전공사 (KESCO · 1889)",
        title: "주방 냉장·냉동설비 기계실 먼지 누적에 따른 과열 및 트래킹 전기화재 예방",
        url: URLS.KESCO,
        date: "공공 안전 안내",
        usedFor: "기계실 먼지·유증기 축적 시 압축기 과열과 전기 스파크 화재 위험성 확인",
      },
    ],
    fieldNote:
      "청소 주기와 안전 수칙은 제조사·전기안전공사 자료 기준이며, 고깃집·치킨집 여름 전 콤프레샤 사망 사례는 매장 수리·교체 현장 경험입니다.",
  },
  "outdoor-unit-louver-ventilation-fire": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "소방청 · 행정안전부",
        title: "여름철 에어컨 실외기 화재 예방 안전수칙 (루버창 개방 · 10cm 이격 · 가연물 제거 · 단독 콘센트)",
        url: URLS.NFA,
        date: "공식 안전 수칙",
        usedFor: "6~8월 에어컨 화재 집중 통계, 실내 실외기실 환기창 개방 의무화 수준의 중요성, 멀티탭 금지 및 주변 정리 기준 확인",
      },
      {
        org: "한국소비자원 · 삼성·LG 고객지원",
        title: "실외기실 열기 정체에 따른 고압 차단 에러(냉방 중지) 및 소비전력 증가 예방 안내",
        url: URLS.KCA,
        date: "소비자 안전주의보",
        usedFor: "루버창 닫힘 시 열풍 재흡입에 따른 냉방 불량·전기료 상승·고압 보호 정지 원리 확인",
      },
    ],
    fieldNote:
      "화재 예방 수칙과 고압 차단 원리는 소방청·소비자원 공식 자료 기준이며, 전동 자동 루버창 고착 점검 팁은 현장 설치 경험입니다.",
  },
  "aircon-removal-pump-down-piping": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "삼성전자서비스 · LG전자서비스",
        title: "에어컨 철거·이전설치 시 냉매 회수(펌프다운) 및 배관 끝단 밀폐 안내",
        url: URLS.SAMSUNG,
        date: "공식 서비스 기준",
        usedFor: "펌프다운 미실시 및 배관 습기·이물질 유입 시 냉동오일 변질·압축기 소손 → 시공 과실 유상 판정 기준 확인",
      },
      {
        org: "한국소비자원",
        title: "에어컨 이전설치 · 철거 과실 피해구제 절차 및 서비스센터 원인 소견서 활용 안내",
        url: URLS.KCA,
        date: "소비자 피해구제 안내",
        usedFor: "철거·설치 업체 간 책임 회피 분쟁 시 공식 서비스 점검 소견서 확보 및 피해구제 신청 절차 확인",
      },
    ],
    fieldNote:
      "시공 과실 판정과 분쟁 구제 절차는 제조사·한국소비자원 기준이며, 철거 전 정상 작동 영상 촬영 및 매입 연계 방식은 매장 실무 기준입니다.",
  },
  "wash-tower-all-in-one-vs-separate-cleaning": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "일체형 세탁건조기(콤보) vs 직렬 설치(워시타워) 용량·배치 및 케어 서비스 안내",
        url: URLS.LG,
        date: "공식 제품·서비스 안내",
        usedFor: "일체형 동시 운전 불가·건조 용량 차이, 직렬 설치 세탁기 정비 시 상단 건조기 내림·올림 작업 조건 확인",
      },
      {
        org: "한국소비자원",
        title: "드럼세탁기 · 의류건조기 세탁조 위생 관리 및 분해세척 주의사항 안내",
        url: URLS.KCA,
        date: "소비자 비교정보",
        usedFor: "세탁기 분해세척(통돌이/드럼 구조 차이)과 건조기 내부 분해 한계, 노후 제품 파손 유의점 확인",
      },
    ],
    fieldNote:
      "제품 구조·용량 조건은 제조사·소비자원 자료에 기반하며, 분해세척 시세(통돌이 7~14만원/드럼 10~20만원)와 건조기 상단 내림비 주의사항은 현장 세척·설치 사례입니다.",
  },
  "free-waste-pickup-15990903-vs-used-buyback": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "일반 정보 (권장 재검토 12개월)",
    primarySources: [
      {
        org: "환경부 · E순환거버넌스",
        title: "폐가전제품 무상방문수거(1599-0903) 대상 품목 · 소형 5개 기준 · 원형 훼손 제외 안내",
        url: URLS.ECYCLE,
        date: "공식 운영 기준",
        usedFor: "대형 1대/소형 5개 수거 조건, 에어컨·벽걸이 TV 사전 철거 필수, 원형 훼손(부품 탈착)·안마의자·전기장판·대형 냉동창고 수거 제외 기준 확인",
      },
      {
        org: "국가법령정보센터",
        title: "「전기·전자제품 및 자동차의 자원순환에 관한 법률」 및 지자체 대형폐기물 배출 기준",
        url: URLS.LAW,
        date: "현행 법령 기준",
        usedFor: "무상회수 대상 외 품목의 지자체 폐기물 수수료 부과 및 적법 배출 원칙 확인",
      },
    ],
    fieldNote:
      "무상수거 품목 및 제외 기준은 E순환거버넌스(1599-0903) 공식 운영 기준이며, 폐업 시 매입 → 무상수거 → 원상복구 3단계 비용 절감 순서는 매장 철거·매입 현장 경험입니다.",
  },
  "store-takeover-appliances-power-checklist": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "한국전력공사 (KEPCO) · 국가법령정보센터",
        title: "상가 계약전력 증설(승압) 및 상가건물 임대차 원상회복 의무 기준",
        url: URLS.KEPCO,
        date: "공식 약관 · 법령 기준",
        usedFor: "기존 점포 계약전력 부족 시 한전 시설부담금·건물주 동의 필요성 및 원상복구 범위 특약 중요성 확인",
      },
      {
        org: "한국가스안전공사 (KGS) · 한국전기안전공사 (KESCO)",
        title: "음식점 가스 계량기 등급(G4·G6) 용량 및 상가 분전반·냉매(R-22) 노후설비 안전 점검",
        url: URLS.KGS,
        date: "공식 안전 기준",
        usedFor: "점포 인수 전 가스·전기·에어컨 연식 확인 항목 및 고장 설비 사전 선별 필요성 확인",
      },
    ],
    fieldNote:
      "전기·가스·임대차 기준은 한전·가스안전공사 공식 기준에 근거하며, 인수 후 R-22 에어컨·고장 냉장고 철거비 부담 사례는 매장 현업 상담 경험입니다.",
  },
  "winter-heating-heatpump-vs-electric-heater": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "한국에너지공단 (KEA)",
        title: "공기열 히트펌프 냉난방기 효율등급 · 난방정격·난방저온·난방제상 COP 인증 기준",
        url: URLS.KEA,
        date: "공식 효율제도 기준",
        usedFor: "전기히터(COP 1.0) 대비 히트펌프 냉난방기(COP 2.5~4.0+) 열효율 차이 및 영하 기온에서의 COP 저하·제상 손실 원리 확인",
      },
      {
        org: "삼성전자 · LG전자 B2B 고객지원",
        title: "인버터 냉난방기 동절기 제상 운전(성에 제거) 안내 및 한랭지 난방 운전 가이드",
        url: URLS.SAMSUNG,
        date: "공식 기술 안내",
        usedFor: "제상 중 실내 온풍 일시 정지 현상의 정상 작동 여부 및 상가 보조 난방 조합 기준 확인",
      },
    ],
    fieldNote:
      "COP 효율 수치와 저온·제상 특성은 에너지공단 및 제조사 공식 기준이며, 출입문 한기 보조 히터 조합은 매장 설치 경험입니다.",
  },
  "aircon-2in1-vs-two-singles-home": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "멀티형(2in1) 에어컨 vs 단품 에어컨 설치 배관 규격 및 실내외기 호환 안내",
        url: URLS.LG,
        date: "공식 제품·설치 기준",
        usedFor: "실외기 1대 공동 연결 구조, 실내외기 세트 호환 제약, 거실-안방 배관 연장 변수 확인",
      },
      {
        org: "한국소비자원",
        title: "에어컨 이전설치 · 배관 연장 추가비용 소비자 피해 예방 가이드",
        url: URLS.KCA,
        date: "소비자 안내",
        usedFor: "이사 재설치 시 2in1 배관 연장비와 단품 2대 실외기 작업비 발생 구조 비교 확인",
      },
    ],
    fieldNote:
      "호환·배관 규격은 제조사·소비자원 자료 기준이며, 실외기 고장 시 동시 정지 불편 및 중고 세트 매입 기준은 매장 현장 사례입니다.",
  },
  "commercial-gas-vs-induction-kitchen-setup": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "한국가스안전공사 (KGS) · 지역 도시가스 공급규정",
        title: "음식점 가스 계량기 등급별 허용 소비량(G4 약 6만 kcal/h, G6 약 10만 kcal/h) 및 승압 기준",
        url: URLS.KGS,
        date: "공식 기술기준",
        usedFor: "주방 가스 기기 총소비열량 초과 시 계량기 교체·배관 승압 공사 필요성 확인",
      },
      {
        org: "한국전력공사 (KEPCO) · 한밭중고전자 설비 기준",
        title: "업소용 전기 인덕션·튀김기 상가 계약전력 증설 및 380V 전용 차단기 조건",
        url: URLS.KEPCO,
        date: "공급약관 · 현장 기준",
        usedFor: "인덕션 주방의 여름 복사열·냉방비 저감 효과 대비 초기 전기 승압 조건 확인",
      },
    ],
    fieldNote:
      "계량기 등급별 열량은 KGS 기준이며, 주방 열기·자성 용기·혼합 설계(가스 화덕+전기 보조)는 외식 창업 현장 사례입니다.",
  },
  "commercial-gas-grill-lpg-vs-lng-nozzle": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "한국가스안전공사 (KGS) · 국가법령정보센터",
        title: "「액화석유가스의 안전관리 및 사업법」 · 「도시가스사업법」 · KGS 코드(연소기 압력·노즐·가스누설경보기 위치)",
        url: URLS.KGS,
        date: "현행 법령 · KGS 코드",
        usedFor: "LPG(2.8kPa · 공기 대비 무거움 · 바닥 30cm 경보기 · 작은 노즐) vs LNG(2.0kPa · 가벼움 · 천장 30cm 경보기 · 큰 노즐) 기준 및 무자격 노즐 개조 금지 확인",
      },
      {
        org: "소방청 · 가스기기 제조사 안전 안내",
        title: "가스 종류 오연결 및 불완전연소에 따른 황색 불꽃·일산화탄소 중독·화재 예방 안내",
        url: URLS.NFA,
        date: "공식 안전 기준",
        usedFor: "LNG용 기기에 LPG 연결 시 과대 불꽃·그을음·일산화탄소 중독 위험 및 등록 가스시공업체 전환 의무 확인",
      },
    ],
    fieldNote:
      "압력·비중·경보기 높이·법적 제한은 KGS 및 법령 기준이며, 중고 고깃집 로스터·간텍기 가스 오연결 사고 사례는 매장 검수·출고 현장 경험입니다. 임의 노즐 개조 안내는 금지됩니다.",
  },
  "winter-freeze-icemaker-dishwasher-heater": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "소방청 · 지방자치단체 겨울철 동파 예방 안전수칙",
        title: "한파 대비 수도 배관 보온 · 야간 물 틀기 및 토치·열기구 직접 해동 화재 예방 안내",
        url: URLS.NFA,
        date: "공식 안전 안내",
        usedFor: "배관 보온재 사용 원칙과 토치·화기 해동 시 배관 파열·화재 위험 경고 확인",
      },
      {
        org: "주요 업소용 제빙기·온수기·식기세척기 제조사 매뉴얼",
        title: "동절기 휴무·영업 마감 시 급수 잠금 및 내부 물탱크 퇴수(드레인) · 미온수 해동 지침",
        url: URLS.SAMSUNG,
        date: "공식 사용설명서",
        usedFor: "제빙기·온수기(식힌 후 퇴수)·세척기 잔수 제거 절차 및 끓는 물 사용 금지 기준 확인",
      },
    ],
    fieldNote:
      "화기 해동 금지 및 퇴수 절차는 소방청·제조사 매뉴얼 기준이며, 솔레노이드 밸브·물탱크 파손 사례는 매장 겨울철 수리·교체 경험입니다.",
  },
  "freezer-defrost-knife-puncture-risk": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "삼성전자서비스 · LG전자서비스",
        title: "김치냉장고(뚜껑형) · 직냉식 냉동고 안전한 성에 제거(자연 해동 · 플라스틱 주걱) 및 날카로운 도구 금지 안내",
        url: URLS.LG,
        date: "공식 고객지원 가이드",
        usedFor: "내벽 뒤 매립 냉매관 손상 위험, 전원 차단 후 자연 해동·따뜻한 물 그릇 활용 및 완전 건조 절차 확인",
      },
      {
        org: "한국소비자원 · 가전 수리 실무",
        title: "냉매 배관 파손(사용자 과실) 및 단열재 매립형 수리 한계 사례",
        url: URLS.KCA,
        date: "소비자 안내",
        usedFor: "내벽 알루미늄 관 관통 시 가스 누출 및 수리 불가·고비용 교체 판정 구조 확인",
      },
    ],
    fieldNote:
      "안전 제상 순서는 삼성·LG 공식 고객지원 기준이며, 칼·송곳 자국으로 폐기 입고되는 사례는 매장 매입 검수 현장 경험입니다.",
  },
  "fridge-kitchen-fit-vs-freestanding-clearance": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "삼성전자 · LG전자 공식 설치 가이드",
        title: "키친핏(빌트인 700mm) vs 프리스탠딩 깊이 · 측면/상후면 방열 여유 · 도어 90도+ 개방 폭 안내",
        url: URLS.SAMSUNG,
        date: "공식 설치 규격서",
        usedFor: "700~720mm 가구장 깊이, 좌우 최소 12~29mm+ 이격, 높이 1,900mm+, 콘센트 돌출 및 문 열림 간섭 폭 확인",
      },
      {
        org: "한국소비자원",
        title: "대형 가전 설치 공간 미확보(출입구 · 문 열림 간섭) 구매 전 점검 안내",
        url: URLS.KCA,
        date: "소비자 가이드",
        usedFor: "제품 외관 가로폭 외 실제 문짝 열림 반경과 가구장 간섭 사전 실측 필요성 확인",
      },
    ],
    fieldNote:
      "깊이·측면 여유 공간 수치는 삼성·LG 공식 설치 가이드 기준이며, 콘센트 중앙 돌출 및 페어 설치 실수 사례는 매장 배송 경험입니다.",
  },
  "cable-reel-power-strip-tracking-fire": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "소방청 · 시도 소방본부",
        title: "감긴 전선릴 과부하 발열 재연 실험(수 분 내 100~180℃ 상승) 및 멀티탭 허용전류 안전수칙",
        url: URLS.NFA,
        date: "공식 실험 · 안전자료",
        usedFor: "릴선 감은 채 고전력 사용 시 열 축적 용융 화재, 16A(권장 연속 80% ≒ 2,800W 이하) 및 고전력 벽 콘센트 직결 원칙 확인",
      },
      {
        org: "한국전기안전공사 (KESCO · 1889)",
        title: "콘센트 · 플러그 먼지 및 습기에 의한 트래킹(Tracking) 전기화재 예방 안내",
        url: URLS.KESCO,
        date: "공공 안전 안내",
        usedFor: "가전 뒷면 먼지·습기로 인한 미세 방전·탄화 화재 원리 및 주기적 플러그 먼지 제거 요령 확인",
      },
    ],
    fieldNote:
      "권선 발열 실험과 16A 기준, 트래킹 예방 수칙은 소방청 및 전기안전공사 공식 자료에 기반하며, 주방·냉장고 뒤 콘센트 사고 사례는 매장 현장 점검 경험입니다.",
  },
  "compressor-appliance-clearance-heat-dissipation": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "한국에너지공단 · 한국소비자원",
        title: "냉장고 벽면 이격거리(뒷면 10cm 이상) 에너지 절약 가이드 및 주위 온도별 소비전력 비교 시험",
        url: URLS.KEA,
        date: "공식 에너지·시험 자료",
        usedFor: "냉장고 뒷면 10cm·옆면 5cm 이격 권장 기준과 주위 온도·방열 불량에 따른 소비전력 최대 2배 안팎 상승 원리 확인",
      },
      {
        org: "삼성전자 · LG전자 · 업소용 제빙기 공식 설치 가이드",
        title: "가정용 냉장고(상·하·좌·우 여백), 업소용 제빙기·냉장고(10~20cm 통풍) 및 운반 후 오일 안정화 설치 기준",
        url: URLS.SAMSUNG,
        date: "제조사 공식 매뉴얼",
        usedFor: "방열 불량 시 응축압력 상승·OLP 과부하 차단·열풍 재흡입(단락 순환)·결로·공명 소음 및 제품별 최소 이격 수치 확인",
      },
    ],
    fieldNote:
      "이격거리 수치와 소비전력 변화는 한국에너지공단·한국소비자원·제조사 매뉴얼에 기반하며, 장 딱 맞춤 설치 후 여름 과열 반품 및 진동 소음 AS 사례는 현장 경험입니다.",
  },
  "used-appliance-nameplate-lifespan-guide": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "일반 정보 (권장 재검토 12개월)",
    primarySources: [
      {
        org: "공정거래위원회 · 국가법령정보센터",
        title: "소비자분쟁해결기준 (가전제품 품질보증기간 및 품목별 부품 보유기간 — 냉장고 9년·에어컨 8년·세탁기 7년)",
        url: URLS.FTC,
        date: "현행 고시 기준",
        usedFor: "완제품 보증기간, 제조일자(제조연월만 표기 시 말일) 기준 부품 보유기간 기산점, 부품 미보유 시 감가상각 환급 기준 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "가전제품(냉장고·세탁기·에어컨) 제품 정보 명판 부착 위치 및 모델명·제조년월 확인 안내",
        url: URLS.SAMSUNG,
        date: "공식 고객안내",
        usedFor: "에너지라벨 고시일과 실제 명판 제조년월 구분, 품목별 명판 스티커 위치, 핵심부품 보증 범위 조건 확인",
      },
    ],
    fieldNote:
      "품목별 부품 보유기간·기산점 기준은 공정위 소비자분쟁해결기준 공식 고시에 따르며, 실내·외기 혼합 연식 대조와 명판 기반 매입 상담은 매장 실무 경험입니다.",
  },
  "aircon-refrigerant-r22-r410a-r32-guide": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "국가법령정보센터 · 환경부",
        title: "오존층 보호를 위한 특정물질의 제조규제 등에 관한 법률 및 키갈리 개정서 HFC 단계적 감축 안내",
        url: URLS.LAW,
        date: "현행 법령 기준",
        usedFor: "R-22(HCFC) 생산·수입 전면 금지 및 R-410A(GWP 2,088) 단계 감축, 저GWP(R-32 GWP 675) 전환 배경 확인",
      },
      {
        org: "국가기술표준원 · 냉동공조 안전기준",
        title: "R-32 약가연성(A2L) 냉매 에어컨 안전기준 및 혼합 충전·용접 화기 주의사항",
        url: URLS.KATS,
        date: "공식 안전 기준",
        usedFor: "R-32의 A2L 약가연성 등급 특성, 타 냉매(R-410A 등) 혼합 금지, R-410A 50:50 혼합 냉매의 진공 후 액상 정량 충전 원리 확인",
      },
    ],
    fieldNote:
      "냉매별 ODP·GWP와 규제 및 A2L 안전 등급은 관계 법령·표준에 기반하며, R-22 단종 모델의 중고 수리 한계 사례는 매장 현장 점검 경험입니다.",
  },
  "commercial-fryer-gas-vs-electric-k-class": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "소방청 · 국가법령정보센터",
        title: "소화기구 및 자동소화장치의 화재안전성능기준(NFTC 101) — 음식점 주방 K급 소화기 의무 설치 기준",
        url: URLS.NFA,
        date: "현행 화재안전성능기준",
        usedFor: "식용유 발화점(약 288~385℃) 및 물 분사 시 폭발 위험, 일반 분말소화기 재발화 특성, 주방 25㎡ 미만/이상 K급 소화기 의무 비치 기준 확인",
      },
      {
        org: "한국가스안전공사 · 한국전기안전공사",
        title: "업소용 가스 및 전기 조리기구 안전 사용·전용 차단기 배선 안내",
        url: URLS.KESCO,
        date: "공공 안전 안내",
        usedFor: "대형 전기 튀김기 고전력(5~10kW+) 전용선 원칙 및 가스 튀김기 LPG/LNG 사양·유조 누유 점검 수칙 확인",
      },
    ],
    fieldNote:
      "K급 소화기 의무 수량과 식용유 화재 원리는 소방청 NFTC 101 및 공식 안전자료 기준이며, 유조 용접부·과열센서 중고 검수 체크는 매장 현장 경험입니다.",
  },
  "kitchen-hood-duct-sirocco-vs-inline-fan": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "소방청 · 다중이용업소 안전관리 기준",
        title: "음식점 주방 후드·덕트(0.5mm 이상 불연 강판) 기름때(그리스) 화재 예방 및 청소 안내",
        url: URLS.NFA,
        date: "공공 화재예방 자료",
        usedFor: "덕트 내 기름 찌꺼기 착화 온도(약 190~230℃), 그리스필터(유지분리 필터) 상시 장착 및 불연 강판 덕트·정기 청소 기준 확인",
      },
      {
        org: "대한설비공학회 · 주방 공조·환기 실무 기준",
        title: "상업용 주방 배기팬(시로코팬 vs 인라인팬) 정압·덕트 길이 선정 및 급기(Make-up Air) 균형 원칙",
        url: URLS.SAREK,
        date: "설비 기술 기준",
        usedFor: "긴 꺾인 배관의 정압 확보(시로코팬)와 좁은 직관(인라인팬) 차이, 급기 부족에 따른 배기 역류 및 냉방 효율 저하 상관관계 확인",
      },
    ],
    fieldNote:
      "덕트 불연재료·기름때 화재 예방 수칙은 소방청 자료 기준이며, 후드 막힘으로 인한 홀 열기 누적·에어컨 효율 저하 현상은 업소 현장 진단 사례입니다.",
  },
  "commercial-icemaker-air-vs-water-cooled": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "기술·성능 정보 (권장 재검토 6개월)",
    primarySources: [
      {
        org: "제빙기 · 상업용 냉동기 제조사 매뉴얼",
        title: "공랭식 vs 수랭식 업소용 제빙기 냉각 원리 · 주변 온도(35~40℃+) 영향 및 급배수 설치 기준",
        url: URLS.KCA,
        date: "제조사 표준 매뉴얼",
        usedFor: "공랭식 주변 온도 영향·무냉각수 장점 및 통풍 10~20cm 요구, 수랭식 여름 일정 생산량·저소음·냉각수 지속 배수에 따른 수도요금 증가 특성 확인",
      },
      {
        org: "한국에너지공단 · 업소용 냉동기 관리 수칙",
        title: "응축기 방열 조건이 냉동기 제빙 효율·전력 소모에 미치는 영향",
        url: URLS.KEA,
        date: "공식 에너지 안내",
        usedFor: "밀폐 카운터·화기 인접 배치 시 공랭식 효율 급락 및 응축기 청소 주기 관리 기준 확인",
      },
    ],
    fieldNote:
      "냉각 방식별 구조와 장단점은 제빙기 제조사 공식 매뉴얼에 기반하며, 카페·바 매장별 수도세·배수 환경에 따른 추천 기준은 매장 납품 실무 경험입니다.",
  },
  "cooling-only-vs-heat-pump-nameplate": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "일반 정보 (권장 재검토 12개월)",
    primarySources: [
      {
        org: "삼성전자서비스 · LG전자 고객지원",
        title: "냉방전용 에어컨 vs 히트펌프 냉난방기 명판(냉방·난방능력) 확인 및 겨울철 작동 기준",
        url: URLS.LG,
        date: "공식 고객안내",
        usedFor: "실내·외기 명판상 정격 냉방능력/난방능력 표기 구분, 공용 리모컨 난방 아이콘 혼동 사례, 냉방전용 영하 가동 비권장 안내 확인",
      },
      {
        org: "한국냉동공조산업 관련 기술 안내",
        title: "히트펌프 사방밸브(4-Way Valve) 냉매 전환 및 겨울철 제상 운전 메커니즘",
        url: URLS.SAREK,
        date: "공조 기술자료",
        usedFor: "사방밸브 유무에 따른 냉난방 가능 여부 및 제상 운전·드레인 배수 차이 확인",
      },
    ],
    fieldNote:
      "명판 판별법과 사방밸브 작동 기준은 삼성·LG 공식 안내 기반이며, 출고 시운전 시 난방 전환까지 검증하는 절차는 매장 검수 기준입니다.",
  },
  "commercial-water-heater-instant-vs-storage": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "전기온수기 제조사 설치 매뉴얼 · 한국전기안전공사",
        title: "저장식(저탕식) vs 순간 전기온수기 정격 소비전력(1.5~3kW vs 3.5~5kW+) 및 전용 누전차단기 설치 기준",
        url: URLS.KESCO,
        date: "공식 설치·안전 기준",
        usedFor: "순간온수기 고순시전력 차단기 트립·동절기 수온 저하 특성과 저장식 온수기 용량별 전류·전용 접지 회선 필요성 확인",
      },
      {
        org: "한국소비자원 · 온수기 안전관리 안내",
        title: "저장식 전기온수기 감압밸브·과압안전밸브 의무 장착 및 마그네슘 양극봉(1~2년) 정기 교체 안내",
        url: URLS.KCA,
        date: "소비자 안전 안내",
        usedFor: "감압밸브·안전밸브 누락 시 탱크 파열·누수 위험 및 마그네슘 양극봉 부식 방지 역할, 빈 탱크 공회전 금지 수칙 확인",
      },
    ],
    fieldNote:
      "안전 부속(감압·안전밸브·양극봉)과 전력 기준은 제조사 설치 설명서 및 안전공사 기준이며, 카페 30L·식당 50~100L 현장 선택 조언은 납품 경험입니다.",
  },
  "fridge-washer-gasket-mold-cleaning-safety": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "한국소비자원 · 생활화학제품 안전주의보",
        title: "염소계 표백제(락스)와 산성 세제(구연산·식초) 혼합 사용 시 유독 염소가스 발생 주의 안내",
        url: URLS.KCA,
        date: "소비자 안전주의보",
        usedFor: "락스+산성 세제 혼용 시 염소가스 중독 위험 및 단일 세제 환기 후 물 헹굼 원칙 확인",
      },
      {
        org: "삼성전자 · LG전자 고객지원",
        title: "냉장고 도어 고무패킹(가스켓) 밀착 자가 점검(지폐·불빛 테스트) 및 드럼세탁기 패킹 건조 관리",
        url: URLS.LG,
        date: "공식 관리 안내",
        usedFor: "문 틈 냉기 누설에 따른 성에·전력 증가 원리, 지폐/손전등 밀착 점검법, 미지근한 중성세제 세척 및 패킹 단품 교체 안내 확인",
      },
    ],
    fieldNote:
      "세제 혼합 금지 안전 수칙과 지폐/불빛 테스트는 소비자원·제조사 공식 가이드 기반이며, 수평 재조정으로 문 들뜸을 잡는 방법은 매장 출고·AS 경험입니다.",
  },
  "villa-old-house-drilling-angle-3kw": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "국가법령정보센터 · 국토교통부",
        title: "공동주택관리법 시행령 및 주택건설기준(실외기 설치 공간 마련 공동주택의 외벽 돌출 설치 제한)",
        url: URLS.LAW,
        date: "현행 법령 기준",
        usedFor: "실외기실 구비 공동주택의 외벽·난간 돌출 거치 제한 규약 및 드라이비트 외벽 앵커 고정 주의 필요성 확인",
      },
      {
        org: "한국전력공사 (KEPCO)",
        title: "주택용 저압 기본 계약전력(3kW) 사용 한계 및 고전력 가전 동시 사용 차단 주의 안내",
        url: URLS.KEPCO,
        date: "공공 전기 공급 약관",
        usedFor: "일반 주택·원룸 기본 3kW 계약전력 한계와 에어컨·인덕션·건조기·온수기 동시 가동 시 차단기 트립 원인 확인",
      },
    ],
    fieldNote:
      "외벽 앵글 규약과 주택 3kW 전력 조건은 관련 법령·한전 안내에 기반하며, 전세 벽 타공 임대인 사전 동의 및 사다리차 동선 확인은 현장 배송 경험입니다.",
  },
  "store-lease-restoration-removal-dispute": {
    verifiedAt: VERIFIED_DATE,
    contentTypes: ["공식자료 기반", "현장사례 기반"],
    riskLevel: "안전·법률 정보 (권장 재검토 3개월)",
    primarySources: [
      {
        org: "국가법령정보센터 · 법제처",
        title: "민법 제615조 및 제654조 (차용물·임대차 목적물 원상회복 의무 기준)",
        url: URLS.LAW,
        date: "현행 민법 기준",
        usedFor: "임대차 종료 시 임대 당시 상태 반환 원칙 및 통상적 사용에 따른 자연 노후 제외 법리 확인",
      },
      {
        org: "대법원 판례 요지 (90다카12035 · 2017다268142)",
        title: "전 임차인 시설 인수 시 특약 유무 및 포괄 양수도에 따른 원상회복 범위 판단 기준",
        url: URLS.LAW,
        date: "대법원 공개 판결",
        usedFor: "별도 특약 부재 시 본인 개조·설치분만 복구 원칙(90다카12035) vs 포괄 양수·공실 반환 특약 시 전 임차인 시설 철거 의무 인정 사례(2017다268142) 확인",
      },
    ],
    fieldNote:
      "법령·판례 요지는 일반적인 정보 제공 목적이며 개별 분쟁은 법률 전문가 확인이 필요합니다. 천장형·승압 설비의 철거 전 매입 분리 및 임대인 서면 합의 요령은 창·폐업 매장 경험입니다.",
  },
};

export function getGuideVerification(slug: string): InfoGuideVerification | undefined {
  return GUIDE_VERIFICATION_BY_SLUG[slug];
}
