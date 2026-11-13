// 파일 경로: app/layout.tsx
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import { STORE, STORE_MERCHANT_POLICY } from "../lib/site";
import { serializeJsonLd } from "../lib/json-ld";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-32CDGHN1F0";

export const metadata: Metadata = {
  metadataBase: new URL(STORE.url),
  applicationName: STORE.name,
  referrer: "strict-origin-when-cross-origin",
  appleWebApp: {
    title: STORE.name,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  title: {
    default: `${STORE.name} | 대전 중고가전·업소용 주방기기 판매·당일매입 (무상A/S 최대 8개월)`,
    template: `%s | ${STORE.name}`,
  },
  description:
    "[실매물 가격 문의 · 무상A/S 최대 8개월] 1997년 개업 대전 중촌동 1·2층 직영 쇼룸. 분해 고압 세척을 마친 중고 냉장고·세탁기·에어컨·업소용 45박스 냉장고·제빙기·쇼케이스 판매 및 이사·폐업 당일 현금 방문매입. (세금계산서 100% 발행)",
  keywords: [
    "대전 중고가전",
    "대전 중고가전 매입",
    "대전 중고가전 추천",
    "대전 업소용 냉장고",
    "대전 중고에어컨",
    "대전 중고세탁기",
    "대전 중고냉장고",
    "대전 업소용 주방기기",
    "대전 식당폐업 매입",
    "세종 중고가전",
    "한밭중고전자",
    "중촌동 중고가전",
  ],
  authors: [{ name: STORE.name }],
  creator: STORE.name,
  publisher: STORE.name,
  alternates: {
    canonical: "/",
    types: {
      "text/plain": "/llms.txt",
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: STORE.url,
    siteName: STORE.name,
    title: `${STORE.name} | 분해세척 실매물 중고가전·업소용 주방설비 (무상A/S 보증)`,
    description:
      "SINCE 1997 대전 중구 중촌동 직영 매장. 에어컨·냉난방기 최대 8개월, 일반·업소용 가전 최대 4개월 계약 조건별 무상 A/S 보증. 가정용 가전부터 식당·카페 창업 설비 판매 및 당일 현금 방문매입.",
    images: [
      {
        url: "/store-exterior.jpg",
        width: 1024,
        height: 576,
        alt: `${STORE.name} 대전 중촌동 1·2층 대형 직영 쇼룸 및 전용 주차장 실물 외관 전경`,
        type: "image/jpeg",
      },
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${STORE.name} 대전 중촌동 직영 전시장 대표 썸네일`,
        type: "image/jpeg",
      },
      {
        url: "/main-bg2.png",
        width: 1600,
        height: 900,
        alt: `${STORE.name} 대전 직영 매장 오프라인 전경`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${STORE.name} | 분해세척 실매물 중고가전·업소용 주방설비 (무상A/S 보증)`,
    description:
      "SINCE 1997 대전 중구 중촌동 직영 매장. 에어컨·냉난방기 최대 8개월, 일반·업소용 가전 최대 4개월 계약 조건별 무상 A/S 보증. 가정용 가전부터 식당·카페 창업 설비 판매 및 당일 현금 방문매입.",
    images: ["/store-exterior.jpg", "/og-image.jpg"],
  },
  verification: {
    google: "5Q8KVRdeLBQYI9x7EUnX4dQ1N6rmRqD3D4IydPLDbKU",
    other: {
      "naver-site-verification": "28b921dfd15b72fe192b25063353615683ea4864",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) 구글 공식 'Site Name(사이트 이름)' 표준 구조화 데이터
  const websiteJsonLd = {
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

  // 2) 공식 Organization & Brand 로고 구조화 데이터 (구글 검색 로고 및 지식패널용)
  const organizationJsonLd = {
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

  // 3) AI 검색엔진(ChatGPT, Perplexity, Gemini) 및 로컬 비즈니스 지식 그래프용 상세 스키마
  const localBusinessJsonLd = {
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
    slogan: "대전·세종·충청 1등 분해세척 중고가전 & 업소용 주방설비 직영 전시장",
    description:
      "1997년 개업한 대전·세종·충청권 대표 중고가전 및 업소용 주방기기 직영 매장. 전 제품 분해 고압 세척 및 24시간 시운전 검수 후 출고하며, 품목 및 계약 조건에 따라 에어컨·냉난방기 최대 8개월, 일반 및 업소용 가전 최대 4개월 무상 A/S 보증과 전자세금계산서 100% 발행을 지원합니다. 가정용 가전 및 식당·카페 폐업 설비 당일 현금 방문 매입을 진행합니다.",
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
      postalCode: "34809",
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
      "개인 직거래(당근마켓) 대비 분해 고압 세척 및 사후 보증",
    ],
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: STORE_MERCHANT_POLICY.applicableCountry,
      returnPolicyCategory: STORE_MERCHANT_POLICY.returnPolicyCategory,
      merchantReturnDays: STORE_MERCHANT_POLICY.merchantReturnDays,
      returnMethod: STORE_MERCHANT_POLICY.returnMethod,
      returnFees: STORE_MERCHANT_POLICY.returnFees,
    },
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
          name: "에어컨 · 냉난방기 (계약 조건별 최대 8개월 보증)",
          url: `${STORE.url}/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0`,
        },
        {
          "@type": "OfferCatalog",
          name: "가정용 냉장고 · 김치냉장고 (계약 조건별 최대 4개월 보증)",
          url: `${STORE.url}/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0`,
        },
        {
          "@type": "OfferCatalog",
          name: "세탁기 · 의류건조기 (분해 고압 살균 세척 완료)",
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

  return (
    <html lang="ko">
      <head>
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title={`${STORE.name} AI Search & LLM Guide`}
        />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms-full.txt"
          title={`${STORE.name} Full Inventory Feed for AI`}
        />
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          integrity="sha384-GIdEBaqGN9mNkDkMkzMHW8EKUqtpPIe/sLj1X7DIrnc9uPtLROJgmuDlh+3rBw0j"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(localBusinessJsonLd),
          }}
        />
      </head>
      <body>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        {children}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                send_page_view: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
