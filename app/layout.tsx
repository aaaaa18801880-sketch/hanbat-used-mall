// 파일 경로: app/layout.tsx
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import { STORE } from "../lib/site";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-32CDGHN1F0";

export const metadata: Metadata = {
  metadataBase: new URL(STORE.url),
  applicationName: STORE.name,
  appleWebApp: {
    title: STORE.name,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  title: {
    default: `${STORE.name} | 대전 중고가전·업소용 주방기기 판매·당일매입 (무상A/S 최대 8개월)`,
    template: `%s | ${STORE.name}`,
  },
  description:
    "[실매물 가격공개 · 무상A/S 최대 8개월] 1997년 개업 대전 중촌동 1·2층 직영 쇼룸. 분해 고압 세척을 마친 중고 냉장고·세탁기·에어컨·업소용 45박스 냉장고·제빙기·쇼케이스 판매 및 이사·폐업 당일 현금 방문매입. (세금계산서 100% 발행)",
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
      "SINCE 1997 대전 중구 중촌동 직영 매장. 에어컨·냉난방기 8개월, 일반·업소용 가전 4개월 무상 A/S 보증. 가정용 가전부터 식당·카페 창업 설비 판매 및 당일 현금 방문매입.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${STORE.name} 직영 매장 대표 이미지`,
      },
    ],
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
    ],
    url: STORE.url,
    inLanguage: "ko-KR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${STORE.url}/gallery?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // 2) AI 검색엔진(ChatGPT, Perplexity, Gemini) 및 로컬 비즈니스 지식 그래프용 상세 스키마
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": ["ElectronicsStore", "LocalBusiness"],
    "@id": `${STORE.url}/#localbusiness`,
    name: STORE.name,
    legalName: STORE.legalName,
    description:
      "1997년 개업한 대전·세종·충청권 대표 중고가전 및 업소용 주방기기 직영 매장. 전 제품 분해 고압 세척 및 작동 검수 후 출고하며, 에어컨·냉난방기 8개월, 일반 및 업소용 가전 4개월 무상 A/S 보증과 전자세금계산서 발행을 지원합니다. 가정용 가전 및 식당·카페 폐업 설비 당일 현금 방문 매입을 진행합니다.",
    image: [`${STORE.url}/og-image.jpg`, `${STORE.url}/main-bg2.png`],
    telephone: STORE.tel,
    url: STORE.url,
    foundingDate: String(STORE.since),
    priceRange: "₩₩",
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
      latitude: 36.335503,
      longitude: 127.406981,
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
      "중고 냉장고·양문형냉장고·김치냉장고",
      "중고 세탁기·드럼세탁기·통돌이·건조기",
      "중고 에어컨·벽걸이에어컨·스탠드에어컨·중대형 냉난방기",
      "업소용 45박스 냉장고·테이블냉장고·음료 및 주류 쇼케이스",
      "업소용 제빙기·업소용 식기세척기·스텐 작업대",
      "식당·카페 창업 주방설비 패키지 및 폐업 일괄 정리",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "한밭중고전자 가정용·업소용 취급 품목 카탈로그",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "에어컨 · 냉난방기 (무상 A/S 8개월 보증)",
          url: `${STORE.url}/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0`,
        },
        {
          "@type": "OfferCatalog",
          name: "가정용 냉장고 · 김치냉장고 (무상 A/S 4개월 보증)",
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
    sameAs: [STORE.cafe, STORE.kakaoChannel, STORE.naverMap],
  };

  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-48.png" type="image/png" sizes="48x48" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-icon.png" sizes="180x180" />
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
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd),
          }}
        />
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
      </head>
      <body>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        {children}
      </body>
    </html>
  );
}
