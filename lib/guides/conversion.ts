import {
  STORE,
  getCategoryWarrantyInfo,
  type ProductCategoryValue,
} from "../site";
import {
  getGuideCommerceBridge,
  type InfoGuideArticle,
} from "../info-guides";

export type GuideConversionIntent = "sell" | "buy";

export interface GuideConversionContext {
  intent: GuideConversionIntent;
  primaryCategory: ProductCategoryValue;
  eyebrow: string;
  sidebarTitle: string;
  sidebarDesc: string;
  bottomHeading: string;
  bottomDescription: string;
  warrantyNote: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  mobilePrimaryLabel: string;
  mobilePrimaryHref: string;
  mobileKakaoLabel: string;
  kakaoTip: string;
}

const SELL_INTENT_SLUGS = new Set<string>([
  "appliance-buyback-no-deduction-guide",
  "free-waste-pickup-15990903-vs-used-buyback",
  "resale-value-commercial-appliances",
  "store-lease-restoration-removal-dispute",
  "aircon-removal-pump-down-piping",
]);

/**
 * 65편 정보 게시판 글의 주제·의도(방문 매입 vs 실매물 구매·설치)를 판별해
 * 사이드바, 하단 전환 브릿지, 모바일 하단 고정 바의 맞춤 CTA를 산출합니다.
 */
export function getGuideConversionContext(
  article: InfoGuideArticle
): GuideConversionContext {
  const bridge = getGuideCommerceBridge(article);
  const warranty = getCategoryWarrantyInfo(bridge.primaryCategory);

  const isSellIntent =
    SELL_INTENT_SLUGS.has(article.slug) ||
    (article.category === "구매 · 매입 · 창업" &&
      /매입|철거|폐업|처분|감가/.test(article.title));

  if (isSellIntent) {
    return {
      intent: "sell",
      primaryCategory: bridge.primaryCategory,
      eyebrow: "방문 매입 · 현장 즉시 정산",
      sidebarTitle: "정면·명판 사진 2장으로 매입 견적 확인",
      sidebarDesc:
        "이사·폐업 가전과 업소용 주방설비를 대전·세종·충청 직영 차량이 방문 수거하고 현장에서 바로 정산해 드립니다.",
      bottomHeading: "처분할 가전·업소용 설비, 사진 한 장으로 바로 견적 받기",
      bottomDescription: `${STORE.name}는 가정용 냉장고·세탁기·에어컨부터 식당·카페 폐업 설비 일괄 철거·매입까지 직접 진행합니다. 정면 사진과 제조년월 명판 사진을 보내주시면 감가 없는 사전 시세를 안내해 드립니다.`,
      warrantyNote: "직영 기사 방문 수거 · 현장 즉시 계좌입금/현금 정산",
      primaryCta: {
        label: "방문 매입 견적 신청",
        href: "/purchase#purchase-form",
      },
      secondaryCta: {
        label: "판매 중인 실매물 보기",
        href: bridge.galleryHref,
      },
      mobilePrimaryLabel: "매입 신청",
      mobilePrimaryHref: "/purchase#purchase-form",
      mobileKakaoLabel: "카톡 사진전송",
      kakaoTip: "정면·명판 사진 2장과 지역(동)·엘리베이터 유무를 보내주시면 빠릅니다.",
    };
  }

  if (bridge.primaryCategory === "에어컨/냉난방기") {
    return {
      intent: "buy",
      primaryCategory: bridge.primaryCategory,
      eyebrow: `에어컨 · 냉난방기 · ${warranty.compactLabel}`,
      sidebarTitle: "공간 평수·전기 확인 후 맞는 에어컨 추천",
      sidebarDesc:
        "현장 사진이나 매장 평수를 알려주시면 고압세척과 작동 점검을 마친 실매물과 설치 가능 여부를 함께 안내합니다.",
      bottomHeading: bridge.heading,
      bottomDescription: `고압세척과 배송 전 작동 점검을 마친 에어컨·냉난방기 매물입니다. ${warranty.compactLabel} 기준으로 출고하며 대전·세종·충청 직영 설치를 지원합니다.`,
      warrantyNote: `${warranty.compactLabel} · ${warranty.detailLabel}`,
      primaryCta: {
        label: bridge.galleryLabel,
        href: bridge.galleryHref,
      },
      secondaryCta: {
        label: "현장 사진으로 설치 문의",
        href: "/inquiry?write=1&type=buy",
      },
      mobilePrimaryLabel: "에어컨 매물",
      mobilePrimaryHref: "#guide-recommended-products",
      mobileKakaoLabel: "카톡상담",
      kakaoTip: "설치 공간 평수·층고나 분전함 사진을 보내주시면 맞는 평형을 안내합니다.",
    };
  }

  if (bridge.primaryCategory === "업소용기기") {
    return {
      intent: "buy",
      primaryCategory: bridge.primaryCategory,
      eyebrow: `업소용 주방·냉장 설비 · ${warranty.compactLabel}`,
      sidebarTitle: "창업·교체 설비 일괄 견적 및 세금계산서",
      sidebarDesc:
        "45박스·테이블냉장고·쇼케이스·제빙기까지 전시장 실물 확인과 사업자 전자세금계산서 발행을 지원합니다.",
      bottomHeading: bridge.heading,
      bottomDescription: `전력·배수·출입구 조건을 확인해 바로 투입할 수 있는 업소용 실매물입니다. ${warranty.compactLabel} 기준으로 출고하며 다품목 세트 견적도 상담 가능합니다.`,
      warrantyNote: `${warranty.compactLabel} · 전자세금계산서 발행`,
      primaryCta: {
        label: bridge.galleryLabel,
        href: bridge.galleryHref,
      },
      secondaryCta: {
        label: "업소용 일괄 견적 문의",
        href: "/inquiry?write=1&type=bulk",
      },
      mobilePrimaryLabel: "업소용 매물",
      mobilePrimaryHref: "#guide-recommended-products",
      mobileKakaoLabel: "카톡상담",
      kakaoTip: "필요 품목과 주방 출입구·분전함 사진을 보내주시면 빠르게 안내합니다.",
    };
  }

  if (bridge.primaryCategory === "냉장고") {
    return {
      intent: "buy",
      primaryCategory: bridge.primaryCategory,
      eyebrow: `냉장고 · 김치냉장고 · ${warranty.compactLabel}`,
      sidebarTitle: "출입구 폭 확인 후 당일·지정일 직배송",
      sidebarDesc:
        "고압세척과 배송 전 냉기 작동 점검을 마친 냉장고·김치냉장고 실매물을 전시장에서 직접 확인하실 수 있습니다.",
      bottomHeading: bridge.heading,
      bottomDescription: `고압세척과 출고 전 냉장·냉동 작동 점검을 마친 실매물입니다. ${warranty.compactLabel} 기준이 적용되며 문폭·반입 동선도 함께 확인해 드립니다.`,
      warrantyNote: `${warranty.compactLabel} · ${warranty.detailLabel}`,
      primaryCta: {
        label: bridge.galleryLabel,
        href: bridge.galleryHref,
      },
      secondaryCta: {
        label: "맞춤 냉장고 재고 문의",
        href: "/inquiry?write=1&type=buy",
      },
      mobilePrimaryLabel: "냉장고 매물",
      mobilePrimaryHref: "#guide-recommended-products",
      mobileKakaoLabel: "카톡상담",
      kakaoTip: "원하시는 용량·예산과 설치 자리 가로폭을 알려주시면 맞는 매물을 찾아드립니다.",
    };
  }

  if (bridge.primaryCategory === "세탁기/건조기") {
    return {
      intent: "buy",
      primaryCategory: bridge.primaryCategory,
      eyebrow: `세탁기 · 건조기 · ${warranty.compactLabel}`,
      sidebarTitle: "급배수·탈수 점검 완료 세탁기·건조기",
      sidebarDesc:
        "세척과 배송 전 급배수·탈수 작동 점검을 마친 매물을 직영 기사가 수평 맞춰 설치해 드립니다.",
      bottomHeading: bridge.heading,
      bottomDescription: `세척과 출고 전 급배수·탈수 작동 점검을 마친 세탁기·건조기 실매물입니다. ${warranty.compactLabel} 기준으로 직영 기사가 설치합니다.`,
      warrantyNote: `${warranty.compactLabel} · ${warranty.detailLabel}`,
      primaryCta: {
        label: bridge.galleryLabel,
        href: bridge.galleryHref,
      },
      secondaryCta: {
        label: "세탁기·건조기 재고 문의",
        href: "/inquiry?write=1&type=buy",
      },
      mobilePrimaryLabel: "세탁기 매물",
      mobilePrimaryHref: "#guide-recommended-products",
      mobileKakaoLabel: "카톡상담",
      kakaoTip: "원하시는 용량(통돌이/드럼)과 베란다 입구 폭을 알려주시면 빠릅니다.",
    };
  }

  return {
    intent: "buy",
    primaryCategory: bridge.primaryCategory,
    eyebrow: `${STORE.name} 직영 검수 · ${warranty.compactLabel}`,
    sidebarTitle: "분전함·출입구 사진으로 설치 여부 확인",
    sidebarDesc:
      "현장 사진이나 찾으시는 품목을 남겨주시면 맞는 실매물과 설치 가능 여부를 먼저 확인해 드립니다.",
    bottomHeading: bridge.heading,
    bottomDescription: `${STORE.name}에서 고압세척과 배송 전 작동 점검을 마친 실매물입니다. ${warranty.compactLabel} 기준을 적용합니다.`,
    warrantyNote: `${warranty.compactLabel} · ${warranty.detailLabel}`,
    primaryCta: {
      label: bridge.galleryLabel,
      href: bridge.galleryHref,
    },
    secondaryCta: {
      label: "직접 문의하기",
      href: "/inquiry?write=1&type=buy",
    },
    mobilePrimaryLabel: "관련 매물",
    mobilePrimaryHref: "#guide-recommended-products",
    mobileKakaoLabel: "카톡상담",
    kakaoTip: "현장 사진이나 찾으시는 가전 종류를 남겨주시면 빠르게 확인해 드립니다.",
  };
}
