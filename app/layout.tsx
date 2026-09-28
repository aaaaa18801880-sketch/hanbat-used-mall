import type { Metadata } from "next";
// ✅ 토스트 UI 라이브러리 불러오기
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "한밭중고전자에 오신 것을 환영합니다",
  description: "대전 중구 중촌동 144 위치. 중고 냉장고, 세탁기, 에어컨, 업소용 주방가전 전문. 최고가 당일 매입 및 최저가 판매. 무료 견적 및 방문 상담 042-523-8179.",
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
    description: "대전 중구 중촌동 144 위치. 중고 냉장고, 세탁기, 에어컨, 업소용 주방가전 전문. 무료 견적 및 방문 상담 042-523-8179.",
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
      </head>
      <body>
        {/* ✅ 토스트 팝업이 뜰 수 있도록 바디 최상단에 배치 */}
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        {children}
      </body>
    </html>
  );
}