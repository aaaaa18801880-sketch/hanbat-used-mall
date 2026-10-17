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
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  title: {
    default: `${STORE.name} | 대전 중고가전·업소용 주방기기 매입·판매 전문`,
    template: `%s | ${STORE.name}`,
  },
  description:
    "대전·충청 중고가전 및 업소용 주방기기 판매·매입 전문. 냉장고, 세탁기, 에어컨, 냉난방기, 업소용 45박스 냉장고, 제빙기, 쇼케이스 실매물 확인 및 방문 수거·설치 상담. (대전 중구 대전천서로 691-62 1, 2층, 중촌동 144, SINCE 1997)",
  keywords: [
    "대전 중고가전",
    "대전 중고가전 매입",
    "대전 업소용 냉장고",
    "대전 중고에어컨",
    "대전 중고세탁기",
    "대전 업소용 주방기기",
    "한밭중고전자",
    "중촌동 중고가전",
    "대전천서로 중고가전",
  ],
  authors: [{ name: STORE.name }],
  creator: STORE.name,
  publisher: STORE.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: STORE.url,
    siteName: STORE.name,
    title: `${STORE.name} | 대전 중고가전·업소용 주방기기 매입·판매`,
    description:
      "SINCE 1997 대전 중구 대전천서로 691-62(중촌동 144) 오프라인 직영 매장 운영. 가정용 중고가전부터 식당·카페 업소용 냉장·주방설비까지 판매 및 방문 매입 상담.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${STORE.name} 대표 이미지`,
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
  // 구글 공식 'Site Name(사이트 이름)' 표준 구조화 데이터
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: STORE.name,
    alternateName: ["한밭몰", "hanbatmall.com", "hanbatmall", "대전한밭중고전자"],
    url: STORE.url,
    inLanguage: "ko-KR",
  };

  // 구글 로컬 비즈니스 & 지도 매핑용 구조화 데이터
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${STORE.url}/#localbusiness`,
    name: STORE.name,
    image: `${STORE.url}/og-image.jpg`,
    telephone: STORE.tel,
    url: STORE.url,
    foundingDate: String(STORE.since),
    priceRange: "₩₩",
    address: {
      "@type": "PostalAddress",
      streetAddress: STORE.address,
      addressLocality: "대전광역시",
      addressRegion: "중구",
      postalCode: "34800",
      addressCountry: "KR",
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
    sameAs: [STORE.cafe, STORE.kakaoChannel],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
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
