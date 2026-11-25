// 파일 경로: lib/notice-guides.ts
// 품목별 구매 전 필수 확인 안내문 단일 출처 (에어컨 · 업소용기기 · 냉장고/세탁기 전용)

import { normalizeProductCategory } from "./site";

export type NoticeGuideId = "aircon-set" | "commercial-spec" | "home-appliance";

export interface NoticeGuideHighlight {
  title: string;
  desc: string;
  tone?: "brand" | "default";
}

export interface NoticeGuideItem {
  id: NoticeGuideId;
  kicker: string;
  title: string;
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

export const NOTICE_GUIDES: Readonly<Record<NoticeGuideId, NoticeGuideItem>> = {
  "aircon-set": {
    id: "aircon-set",
    kicker: "구매 전 확인",
    title: "실내기 + 실외기 세트 구성 안내",
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
    kicker: "업소용 설비 필독",
    title: "반입 동선 · 단상/삼상 전원 규격 안내",
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
    kicker: "대형 가전 필독",
    title: "설치 공간 · 반입 동선 · 동시 수거 안내",
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
} as const;

/**
 * 품목 전용 안내문이 필요한 카테고리(에어컨/업소용/냉장고/세탁기)에만 해당 안내문을 반환합니다.
 * '전체'나 '기타'처럼 별도 반입·시공 제약 안내가 불필요한 경우에는 null을 반환합니다.
 */
export function getCategoryNoticeGuide(
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
