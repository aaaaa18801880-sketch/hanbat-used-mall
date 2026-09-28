import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import "./globals.css";

// 💡 발급받은 구글 애널리틱스 측정 ID 적용 완료
const GA_MEASUREMENT_ID = "G-32CDGHN1F0";

export const metadata: Metadata = {
  title: "한밭중고전자에 오신 것을 환영합니다",
  description: "대전 한밭중고전자. 중고 냉장고, 세탁기, 에어컨, 업소용 주방가전 최고가 매입 및 최저가 판매. 무료 견적 042-523-8179",
  keywords: [
    "한밭중고전자",
    "대전중고가전",
    "대전중고냉장고",
    "대전중고에어컨",
    "대전중고세탁기",
    "중고가전매입",
    "중고가전판매",
    "업소용냉장고",
    "식당폐업견적"
  ],
  authors: [{ name: "한밭중고전자" }],
  creator: "한밭중고전자",
  publisher: "한밭중고전자",
  metadataBase: new URL("https://hanbatmall.com"),
  alternates: {
    canonical: "https://hanbatmall.com",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://hanbatmall.com",
    siteName: "한밭중고전자",
    title: "한밭중고전자에 오신 것을 환영합니다",
    description: "대전 한밭중고전자. 중고 냉장고, 세탁기, 에어컨, 업소용 주방가전 최고가 매입 및 최저가 판매. 무료 견적 042-523-8179",
    images: [
      {
        url: "/main-bg.png",
        width: 1200,
        height: 630,
        alt: "한밭중고전자",
      },
    ],
  },
  verification: {
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "한밭중고전자",
    "image": "https://hanbatmall.com/main-bg.png",
    "telephone": "042-523-8179",
    "url": "https://hanbatmall.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "대전광역시 중구 중촌동 144",
      "addressLocality": "대전광역시",
      "addressRegion": "중구",
      "postalCode": "34800",
      "addressCountry": "KR"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:00",
        "closes": "19:00"
      }
    ],
    "priceRange": "₩₩"
  };

  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* 구글 애널리틱스 스크립트 로드 */}
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
                page_path: window.location.pathname,
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