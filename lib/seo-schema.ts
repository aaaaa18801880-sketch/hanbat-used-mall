// 파일 경로: lib/seo-schema.ts
// SEO · AI 검색(GEO) · Schema.org JSON-LD 단일 출처 빌더 (SSOT)

import { STORE, getCategoryWarrantyInfo } from "./site";
import { REFURBISH_STEPS } from "./refurbish-process";

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

export interface HomeFaqEntry {
  question: string;
  answer: string;
}

const AIRCON_WARRANTY = getCategoryWarrantyInfo("에어컨/냉난방기");
const MAJOR_WARRANTY = getCategoryWarrantyInfo("냉장고");

/**
 * 메인 페이지 FAQPage JSON-LD 및 AI 검색 인용용 핵심 Q&A (실제 매장 운영 기준 SSOT)
 */
export const HOME_SCHEMA_FAQS: readonly HomeFaqEntry[] = [
  {
    question: `${STORE.name} 중고가전 무상 A/S 보증 기간은 얼마인가요?`,
    answer: `에어컨·냉난방기는 ${AIRCON_WARRANTY.compactLabel}, 냉장고·세탁기·업소용 냉장고 등 주요 가전은 ${MAJOR_WARRANTY.compactLabel} 기준을 적용하며, 정상 사용 중 이상 발생 시 직영 기사가 방문 점검·수리를 지원합니다.`,
  },
  {
    question: "중고가전 구매 전 매장에서 세척과 작동 확인을 거쳐 출고하나요?",
    answer:
      "네. 매입 현장에서 전원과 작동 상태(에어컨은 냉방·가스 누설 여부)를 먼저 확인해 정상 제품만 입고하며, 내·외부 고압세척과 배송 전 전원 연결 작동 점검을 마친 뒤 출고합니다.",
  },
  {
    question: "대전 외에 세종·청주·천안 등 충청권 배송 및 설치도 가능한가요?",
    answer: `네. ${STORE.roadAddress} 직영 매장에서 대전 전 지역은 물론 세종·청주·천안·공주·계룡·논산 등 충청권 직영 기사 배송·설치를 지원하며, 품목에 따라 전국 배송 상담도 가능합니다.`,
  },
  {
    question: "이사 가전이나 식당·카페 폐업 주방설비 방문 매입은 어떻게 신청하나요?",
    answer: `처분할 제품의 정면 사진과 제조년월이 적힌 명판 스티커 사진을 홈페이지 방문 매입 페이지(${STORE.url}/purchase)나 카카오톡·전화(${STORE.mobile})로 보내주시면 사전 시세를 안내하고 방문 수거 후 현장에서 즉시 정산해 드립니다.`,
  },
  {
    question: "사업자 전자세금계산서 발행과 카드 결제가 가능한가요?",
    answer:
      "네. 가정용·업소용 모두 신용카드 결제, 계좌이체, 현금영수증 및 사업자 전자세금계산서 정식 발행을 지원합니다.",
  },
] as const;

export function buildHomeFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${STORE.url}/#faq`,
    mainEntity: HOME_SCHEMA_FAQS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(items: readonly BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path.startsWith("http")
        ? item.path
        : `${STORE.url}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

export function buildBuybackServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${STORE.url}/purchase#service`,
    name: `${STORE.name} 중고가전 · 식당/카페 폐업 설비 방문 매입`,
    serviceType: "중고가전 방문 매입 및 업소용 주방설비 철거·매입",
    description:
      "대전·세종·충청권 가정용 냉장고·세탁기·에어컨 매입부터 식당·카페 폐업 주방설비 일괄 철거·매입까지 직영 차량 방문 수거 후 현장 즉시 현금/계좌 정산합니다.",
    url: `${STORE.url}/purchase`,
    image: `${STORE.url}/images/guide/buyback-appraisal.jpg`,
    provider: {
      "@type": "LocalBusiness",
      "@id": `${STORE.url}/#localbusiness`,
      name: STORE.name,
      telephone: STORE.tel,
      url: STORE.url,
    },
    areaServed: [
      { "@type": "City", name: "대전광역시" },
      { "@type": "City", name: "세종특별자치시" },
      { "@type": "City", name: "청주시" },
      { "@type": "City", name: "천안시" },
      { "@type": "City", name: "공주시" },
      { "@type": "City", name: "계룡시" },
      { "@type": "City", name: "논산시" },
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
      description: "사진 기반 사전 매입 견적 무료 상담 · 방문 수거 후 현장 즉시 정산",
    },
  };
}

/**
 * llms.txt / llms-full.txt용 실제 4단계 현장확인·세척·작동점검·출고 절차 마크다운 (SSOT)
 */
export function buildLlmsProcessMarkdown(): string {
  return REFURBISH_STEPS.map(
    (step) =>
      `${Number(step.stepNumber)}. **${step.shortTitle} (${step.roleLabel})**: ${step.summary}`
  ).join("\n");
}

/**
 * 루트 레이아웃용 구글 공식 Site Name(WebSite) 구조화 데이터
 */
export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${STORE.url}/#website`,
    name: STORE.name,
    alternateName: [
      "한밭몰",
      "hanbatmall.com",
      "hanbatmall",
      "대전한밭중고전자",
      "한밭중고가전",
      "대전중고가전매입판매",
    ],
    url: STORE.url,
    inLanguage: "ko-KR",
    image: `${STORE.url}/og-image.jpg`,
    thumbnailUrl: `${STORE.url}/icon-512.png`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${STORE.url}/gallery?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * 루트 레이아웃용 공식 Organization & Brand 로고 구조화 데이터
 */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${STORE.url}/#organization`,
    name: STORE.name,
    legalName: STORE.legalName,
    alternateName: ["한밭몰", "대전중고가전매입판매", "hanbatmall"],
    url: STORE.url,
    logo: {
      "@type": "ImageObject",
      url: `${STORE.url}/icon-512.png`,
      width: 512,
      height: 512,
      caption: `${STORE.name} 공식 로고`,
    },
    image: `${STORE.url}/store-exterior.jpg`,
    telephone: STORE.tel,
    sameAs: [
      STORE.cafe,
      STORE.kakaoChannel,
      STORE.naverMap,
      STORE.daangnLocalProfile,
    ],
  };
}

/**
 * 루트 레이아웃용 AI 검색엔진 및 로컬 비즈니스 지식 그래프 상세 스키마
 */
export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["ElectronicsStore", "HomeGoodsStore", "LocalBusiness"],
    "@id": `${STORE.url}/#localbusiness`,
    name: STORE.name,
    legalName: STORE.legalName,
    alternateName: ["한밭몰", "대전중고가전매입판매", "hanbatmall"],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${STORE.url}/`,
      url: `${STORE.url}/`,
    },
    slogan: "대전·세종·충청 직영 중고가전 & 업소용 주방설비 전시장",
    description: `${STORE.since}년 개업한 대전·세종·충청권 대표 중고가전 및 업소용 주방기기 직영 매장. 매입 현장에서 작동·가스 상태를 먼저 확인하고 고압세척과 배송 전 작동 점검을 마친 뒤 출고하며, 에어컨·냉난방기 ${AIRCON_WARRANTY.compactLabel}, 주요 가전 ${MAJOR_WARRANTY.compactLabel}과 전자세금계산서 100% 발행을 지원합니다. 가정용 가전 및 식당·카페 폐업 설비 방문 매입을 진행합니다.`,
    image: [
      `${STORE.url}/store-exterior.jpg`,
      `${STORE.url}/og-image.jpg`,
      `${STORE.url}/main-bg2.png`,
    ],
    photo: {
      "@type": "ImageObject",
      url: `${STORE.url}/store-exterior.jpg`,
      caption: `${STORE.name} ${STORE.jibunAddress} 1·2층 직영 대형 전시장 실물 외관 및 전용 주차장 전경`,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${STORE.url}/store-exterior.jpg`,
      caption: `${STORE.name} 대전 본점 직영 쇼룸 실물 외관`,
    },
    logo: `${STORE.url}/icon-512.png`,
    telephone: STORE.tel,
    url: STORE.url,
    foundingDate: String(STORE.since),
    priceRange: "₩~₩₩₩",
    paymentAccepted: "현금, 계좌이체, 신용카드, 전자세금계산서, 현금영수증",
    currenciesAccepted: "KRW",
    address: {
      "@type": "PostalAddress",
      streetAddress: STORE.roadAddress,
      addressLocality: "대전광역시 중구",
      addressRegion: "대전광역시",
      postalCode: "34802",
      addressCountry: "KR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: STORE.geo.lat,
      longitude: STORE.geo.lng,
    },
    areaServed: [
      { "@type": "City", name: "대전광역시" },
      { "@type": "AdministrativeArea", name: "대전 중구" },
      { "@type": "AdministrativeArea", name: "대전 서구" },
      { "@type": "AdministrativeArea", name: "대전 유성구" },
      { "@type": "AdministrativeArea", name: "대전 동구" },
      { "@type": "AdministrativeArea", name: "대전 대덕구" },
      { "@type": "City", name: "세종특별자치시" },
      { "@type": "City", name: "청주시" },
      { "@type": "City", name: "천안시" },
      { "@type": "City", name: "공주시" },
      { "@type": "City", name: "계룡시" },
      { "@type": "City", name: "논산시" },
      { "@type": "Country", name: "대한민국" },
    ],
    knowsAbout: [
      "대전 중고가전 판매 및 방문 매입",
      "대전 중고가전 추천 및 실매물 전시장",
      "중고 냉장고·양문형냉장고·김치냉장고",
      "중고 세탁기·드럼세탁기·통돌이·건조기",
      "중고 에어컨·벽걸이에어컨·스탠드에어컨·중대형 냉난방기",
      "업소용 45박스 냉장고·테이블냉장고·음료 및 주류 쇼케이스",
      "업소용 제빙기·업소용 식기세척기·스텐 작업대",
      "식당·카페 창업 주방설비 패키지 및 폐업 일괄 정리",
      "원룸·자취방 입주 알뜰 가전 3종 패키지",
      "개인 직거래(당근마켓) 대비 고압세척·작동 점검 및 직영 사후 보증",
    ],
    amenityFeature: [
      {
        "@type": "LocationFeatureSpecification",
        name: "무료 전용 주차장 (승용차 및 대형 화물차 주차 가능)",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "1·2층 실물 대형 전시 쇼룸 (200대 이상 실매물 전시)",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "대전·세종·충청 전문 기사 직배송 및 수평·배관 원스톱 설치",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "새 중고가전 구매 시 기존 가전 보상판매 및 동시 수거",
        value: true,
      },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${STORE.name} 가정용·업소용 취급 품목 카탈로그`,
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: `에어컨 · 냉난방기 (${AIRCON_WARRANTY.compactLabel})`,
          url: `${STORE.url}/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0`,
        },
        {
          "@type": "OfferCatalog",
          name: `가정용 냉장고 · 김치냉장고 (${MAJOR_WARRANTY.compactLabel})`,
          url: `${STORE.url}/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0`,
        },
        {
          "@type": "OfferCatalog",
          name: `세탁기 · 의류건조기 (고압세척·작동 점검 완료 · ${MAJOR_WARRANTY.compactLabel})`,
          url: `${STORE.url}/gallery?category=%EC%84%B8%ED%83%81%EA%B8%B0%2F%EA%B1%B4%EC%A1%B0%EA%B8%B0`,
        },
        {
          "@type": "OfferCatalog",
          name: "업소용 냉장고 · 쇼케이스 · 제빙기 · 주방설비",
          url: `${STORE.url}/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0`,
        },
      ],
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "09:00",
        closes: "19:00",
      },
    ],
    sameAs: [
      STORE.cafe,
      STORE.kakaoChannel,
      STORE.naverMap,
      STORE.daangnLocalProfile,
    ],
  };
}

