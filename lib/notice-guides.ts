// 파일 경로: lib/notice-guides.ts
// 카테고리별 구매 전 필독 안내 · A/S 보증 · 출고 점검 · 매장/직배송 인포그래픽 단일 출처 (SSOT)

import {
  STORE,
  STORE_MERCHANT_POLICY,
  getCategoryWarrantyInfo,
  normalizeProductCategory,
} from "./site";

export type NoticeGuideId =
  | "aircon-set"
  | "commercial-spec"
  | "home-appliance"
  | "warranty-as"
  | "inspection-process"
  | "delivery-showroom";

export interface NoticeGuideHighlight {
  title: string;
  desc: string;
  tone?: "brand" | "default";
}

export interface NoticeGuideItem {
  id: NoticeGuideId;
  badge: string;
  title: string;
  shortTabLabel: string;
  headline: string;
  summary: string;
  inlineText: string;
  imageSrc: string;
  imageAlt: string;
  aspectClass: string;
  modalTitle: string;
  modalSubtitle: string;
  modalFooterNote: string;
  ctaLabel: string;
  highlights: readonly [
    NoticeGuideHighlight,
    NoticeGuideHighlight,
    NoticeGuideHighlight,
  ];
}

const AIRCON_WARRANTY = getCategoryWarrantyInfo("에어컨/냉난방기");
const MAJOR_WARRANTY = getCategoryWarrantyInfo("냉장고");

export const NOTICE_GUIDES: Readonly<Record<NoticeGuideId, NoticeGuideItem>> = {
  "aircon-set": {
    id: "aircon-set",
    badge: "구매 전 확인",
    title: "실내기 + 실외기 세트 구성 안내",
    shortTabLabel: "에어컨 세트 안내",
    headline: "에어컨/냉난방기는 실내기 + 실외기 세트 구성 제품입니다",
    summary:
      "실외기만 별도로 단독 구매하시는 것은 어려우며, 반드시 실내기와 1:1 세트로 판매됩니다.",
    inlineText:
      "에어컨/냉난방기는 실내기+실외기 세트 판매 제품입니다 (실외기 단독 구매 불가)",
    imageSrc: "/images/aircon-set-guide.jpg",
    imageAlt:
      "에어컨/냉난방기 실내기·실외기 1:1 세트 구성 및 실외기 단독 구매 불가 안내문",
    aspectClass: "aspect-[16/10]",
    modalTitle: "에어컨 · 냉난방기 세트 구성 안내",
    modalSubtitle: "실내기 + 실외기 1:1 세트 구성 및 판매 기준 안내",
    modalFooterNote:
      "설치 환경별 배관·전원 견적은 고객센터에서 상세히 상담해 드립니다.",
    ctaLabel: "시공 견적 문의",
    highlights: [
      {
        title: "1:1 세트 구성",
        desc: "실내기와 실외기가 한 조로 구성된 세트 제품으로 판매됩니다.",
      },
      {
        title: "실외기 단독 구매 불가",
        desc: "실외기만 별도로 구매하시는 것은 어려우니 양해 부탁드립니다.",
        tone: "brand",
      },
      {
        title: "사전 시공 상담 지원",
        desc: "배관 거리 및 설치 환경 문의는 고객센터로 언제든 연락주세요.",
      },
    ],
  },
  "commercial-spec": {
    id: "commercial-spec",
    badge: "업소용 설비 필독",
    title: "반입 동선 · 단상/삼상 전원 규격 안내",
    shortTabLabel: "업소용 반입·전원",
    headline: "업소용 냉장고·쇼케이스는 반입 동선과 전원 규격을 먼저 확인하세요",
    summary:
      "매장 출입문 가로폭·계단 크기와 단상 220V / 삼상 380V 전원 규격에 따라 설치 여부가 달라집니다.",
    inlineText:
      "업소용 설비는 출입문 폭과 단상 220V / 삼상 380V 전원 규격을 미리 확인해 주세요",
    imageSrc: "/images/commercial-guide.jpg",
    imageAlt:
      "업소용 설비 구매 전 필독: 출입구·계단 폭 확인, 단상 220V/삼상 380V 전원 확인, 직영 배송·배치 상담 안내문",
    aspectClass: "aspect-[3/2]",
    modalTitle: "업소용 설비 구매 전 반입·전원 안내",
    modalSubtitle: "출입구 가로폭 · 단상/삼상 전원 규격 · 직영 배치 상담",
    modalFooterNote:
      "현장 사진이나 출입구 폭을 알려주시면 반입 가능 여부를 바로 안내해 드립니다.",
    ctaLabel: "반입·견적 문의",
    highlights: [
      {
        title: "출입구·계단 폭 확인",
        desc: "매장 출입문 가로폭, 계단, 엘리베이터 크기를 미리 재어주세요.",
      },
      {
        title: "단상 220V / 삼상 380V",
        desc: "설치할 주방의 전원 규격과 차단기 용량을 꼭 확인해주세요.",
        tone: "brand",
      },
      {
        title: "직영 배송·배치 상담",
        desc: "현장 사진을 보내주시면 반입 가능 여부를 바로 안내해 드립니다.",
      },
    ],
  },
  "home-appliance": {
    id: "home-appliance",
    badge: "대형 가전 필독",
    title: "설치 공간 · 반입 동선 · 동시 수거 안내",
    shortTabLabel: "배송·반입 안내",
    headline: "냉장고·세탁기·건조기는 설치 공간과 반입 동선을 먼저 확인하세요",
    summary:
      "현관문·엘리베이터 폭과 급·배수 위치를 알려주시면 직영 기사가 수평·기본 설치와 기존 가전 수거까지 지원합니다.",
    inlineText:
      "대형 가전은 출입문 폭·2층 이상 계단 여부와 기존 가전 수거 필요 여부를 함께 알려주세요",
    imageSrc: "/images/home-appliance-guide.jpg",
    imageAlt:
      "대형 가전 구매 전 필독: 출입문·계단 폭 확인, 수평·기본 설치 지원, 기존 가전 동시 수거 안내문",
    aspectClass: "aspect-[3/2]",
    modalTitle: "대형 가전 구매 전 설치·반입 안내",
    modalSubtitle: "냉장고 · 세탁기 · 건조기 반입 동선 및 동시 수거 안내",
    modalFooterNote:
      "엘리베이터 없는 층이나 기존 가전 보상매입도 배송 상담 시 함께 안내해 드립니다.",
    ctaLabel: "배송·설치 문의",
    highlights: [
      {
        title: "출입문·계단 폭 확인",
        desc: "현관문, 복도, 엘리베이터 폭과 2층 이상 계단 여부를 미리 알려주세요.",
      },
      {
        title: "수평·기본 설치 지원",
        desc: "직영 기사가 직접 운반해 수평 맞춤과 급·배수 기본 연결을 도와드립니다.",
        tone: "brand",
      },
      {
        title: "기존 가전 동시 수거",
        desc: "배송 당일 사용하시던 구형 가전 동시 수거 및 보상매입 상담이 가능합니다.",
      },
    ],
  },
  "inspection-process": {
    id: "inspection-process",
    badge: "출고 점검 원칙",
    title: "현장 확인 · 고압세척 · 출고 전 재점검",
    shortTabLabel: "출고 점검 원칙",
    headline: "직접 확인하고 세척한 정상 제품만 출고합니다",
    summary:
      "매입 현장 작동 확인부터 내·외부 고압세척, 배송 전 실작동 재점검까지 마친 제품만 전달합니다.",
    inlineText:
      "현장 작동 확인 · 고압세척 · 배송 전 작동 재점검을 거쳐 정상 제품만 출고합니다",
    imageSrc: "/images/inspection-process-guide.jpg",
    imageAlt:
      "한밭중고전자 출고 점검 원칙: 매입 현장 작동·누설 확인, 내·외부 고압세척, 배송 전 작동 재점검 안내문",
    aspectClass: "aspect-[3/2]",
    modalTitle: `${STORE.name} 출고 점검 원칙`,
    modalSubtitle: "현장 작동 확인 · 고압세척 · 배송 전 실작동 재점검",
    modalFooterNote:
      "제품별 외관 상태와 점검 내역은 매장 방문 또는 상담으로 편하게 확인하실 수 있습니다.",
    ctaLabel: "제품 상태 문의",
    highlights: [
      {
        title: "현장 작동·누설 확인",
        desc: "매입 현장에서 전원을 켜고 냉방·작동 상태와 이상 소음을 직접 확인합니다.",
      },
      {
        title: "내·외부 고압세척",
        desc: "필터·선반·도어 패킹·주방 기름때까지 바로 쓰실 수 있게 깔끔히 세척합니다.",
        tone: "brand",
      },
      {
        title: "배송 전 작동 재점검",
        desc: "출고 직전 냉기·급배수·탈수 구동 상태를 한 번 더 확인한 뒤 상차합니다.",
      },
    ],
  },
  "warranty-as": {
    id: "warranty-as",
    badge: "직영 책임 판매 · A/S",
    title: "무상 A/S 보증 · 정식 증빙 안내",
    shortTabLabel: "A/S 보증 안내",
    headline: "구매 후에도 든든하게 무상 A/S 보증을 지원합니다",
    summary: `${AIRCON_WARRANTY.compactLabel}(에어컨) · ${MAJOR_WARRANTY.compactLabel}(주요가전) 및 초기 불량 ${STORE_MERCHANT_POLICY.merchantReturnDays}일 교환·환불과 정식 증빙 발행을 지원합니다.`,
    inlineText: `에어컨 ${AIRCON_WARRANTY.compactLabel} · 주요가전 ${MAJOR_WARRANTY.compactLabel} 및 전자세금계산서·카드 결제 지원`,
    imageSrc: "/images/warranty-as-guide.jpg",
    imageAlt:
      "한밭중고전자 직영 책임 판매 및 A/S 안내: 에어컨 최대 8개월, 주요가전 최대 4개월, 7일 교환 및 정식 증빙 발행",
    aspectClass: "aspect-[3/2]",
    modalTitle: `${STORE.name} 무상 A/S 보증 · 증빙 안내`,
    modalSubtitle: "에어컨 최대 8개월 · 주요가전 최대 4개월 · 7일 교환 안내",
    modalFooterNote: `보증 기준 및 A/S 접수는 대표전화(${STORE.tel})로 바로 안내해 드립니다.`,
    ctaLabel: "보증·A/S 문의",
    highlights: [
      {
        title: "에어컨 최대 8개월",
        desc: "에어컨·냉난방기 정상 사용 중 이상 시 직영 방문 점검·수리를 지원합니다.",
        tone: "brand",
      },
      {
        title: "주요가전 최대 4개월",
        desc: "냉장고·세탁기·건조기 등 주요 가전은 안내 기준에 따라 무상 보증이 적용됩니다.",
      },
      {
        title: `${STORE_MERCHANT_POLICY.merchantReturnDays}일 교환·정식 증빙`,
        desc: `초기 불량 ${STORE_MERCHANT_POLICY.merchantReturnDays}일 교환·환불 안내 및 카드·현금영수증·전자세금계산서를 발행합니다.`,
      },
    ],
  },
  "delivery-showroom": {
    id: "delivery-showroom",
    badge: "직영 매장 · 직배송",
    title: "대전 직영 전시장 · 충청권 직배송 안내",
    shortTabLabel: "매장·직배송",
    headline: "실물 확인부터 당일 직배송까지 한 번에 이용해보세요",
    summary: `${STORE.roadAddress} 직영 전시장 실물 확인과 대전·세종·충청권 직영 기사 배송을 지원합니다.`,
    inlineText: `${STORE.roadAddress} 직영 매장 방문 확인(${STORE.hours}) 및 충청권 직배송 지원`,
    imageSrc: "/images/delivery-showroom-guide.jpg",
    imageAlt:
      "대전 직영 매장 및 충청권 직배송 안내: 대전 중구 대전천서로 691-62 1·2층 직영 전시장, 전용 주차, 월~토 09:00~19:00",
    aspectClass: "aspect-[3/2]",
    modalTitle: "대전 직영 전시장 · 충청권 직배송 안내",
    modalSubtitle: `${STORE.roadAddress} (${STORE.addressNote}) · ${STORE.hours}`,
    modalFooterNote: `${STORE.parking} · 방문 예약 및 배송 일정은 전화로 편하게 조율해 드립니다.`,
    ctaLabel: "방문·배송 문의",
    highlights: [
      {
        title: "대전·세종·충청 직배송",
        desc: "매장 직영 기사가 안전하게 운반하며 일정 조율 시 당일·지정일 배송이 가능합니다.",
        tone: "brand",
      },
      {
        title: "1·2층 직영 전시장",
        desc: `${STORE.addressNote} 직영 매장에서 외관과 작동 상태를 직접 보시고 선택하세요.`,
      },
      {
        title: "전용 주차 · 방문 수령",
        desc: `${STORE.hours} 운영, ${STORE.parking} 및 방문 수령이 가능합니다.`,
      },
    ],
  },
} as const;

export const HOME_NOTICE_GUIDE_IDS: readonly NoticeGuideId[] = [
  "inspection-process",
  "warranty-as",
  "delivery-showroom",
  "aircon-set",
  "commercial-spec",
  "home-appliance",
] as const;

export const HOME_NOTICE_GUIDES: readonly NoticeGuideItem[] =
  HOME_NOTICE_GUIDE_IDS.map((id) => NOTICE_GUIDES[id]);

/**
 * 상품 카테고리에 가장 우선적으로 보여줄 구매 전 필독 안내문 반환
 */
export function getPrimaryNoticeGuideForCategory(
  category?: string | null
): NoticeGuideItem {
  const normalized = normalizeProductCategory(category);
  if (normalized === "에어컨/냉난방기") return NOTICE_GUIDES["aircon-set"];
  if (normalized === "업소용기기") return NOTICE_GUIDES["commercial-spec"];
  if (normalized === "냉장고" || normalized === "세탁기/건조기") {
    return NOTICE_GUIDES["home-appliance"];
  }
  return NOTICE_GUIDES["warranty-as"];
}

/**
 * 상품 상세 카드에서 탭 전환으로 제공할 안내문 목록 (중복 제거, 1번은 해당 품목 맞춤 안내)
 */
export function getProductDetailNoticeTabs(
  category?: string | null
): NoticeGuideItem[] {
  const primary = getPrimaryNoticeGuideForCategory(category);
  const candidates: NoticeGuideId[] = [
    primary.id,
    "inspection-process",
    "warranty-as",
    "delivery-showroom",
  ];
  const uniqueIds: NoticeGuideId[] = [];
  for (const id of candidates) {
    if (!uniqueIds.includes(id)) uniqueIds.push(id);
  }
  return uniqueIds.map((id) => NOTICE_GUIDES[id]);
}

/**
 * 갤러리 카테고리 탭 / 문의 폼 품목 선택 시 상단 배너·인라인 안내로 노출할 품목 전용 안내문
 * ('전체'나 '기타' 선택 시에는 불필요한 배너 노출을 막기 위해 null 반환)
 */
export function getCategoryBannerGuide(
  category?: string | null
): NoticeGuideItem | null {
  const raw = (category ?? "").trim();
  if (!raw || raw === "전체" || raw === "기타") return null;

  const normalized = normalizeProductCategory(raw);
  if (normalized === "에어컨/냉난방기") return NOTICE_GUIDES["aircon-set"];
  if (normalized === "업소용기기") return NOTICE_GUIDES["commercial-spec"];
  if (normalized === "냉장고" || normalized === "세탁기/건조기") {
    return NOTICE_GUIDES["home-appliance"];
  }
  return null;
}
