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
};

export function getGuideVerification(slug: string): InfoGuideVerification | undefined {
  return GUIDE_VERIFICATION_BY_SLUG[slug];
}
