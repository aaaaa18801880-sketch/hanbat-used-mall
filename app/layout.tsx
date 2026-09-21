import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "한밭중고전자 | 대전·충청 중고가전 매입 및 판매 전문",
  description: "30년 전통 대전 최대 규모 중고가전 매장. 중고 냉장고, 세탁기, 에어컨, 냉난방기, 업소용 주방기기 최고가 매입 및 최저가 판매. 방문 수거 및 무료 견적 상담.",
  keywords: [
    "한밭중고전자",
    "대전중고가전",
    "대전중고냉장고",
    "대전중고에어컨",
    "대전중고세탁기",
    "중고가전매입",
    "중고가전판매",
    "업소용냉장고",
    "식당폐업철거",
    "대전가전매입"
  ],
  authors: [{ name: "한밭중고전자" }],
  creator: "한밭중고전자",
  publisher: "한밭중고전자",
  formatDetection: {
    telephone: true,
    address: true,
  },
  metadataBase: new URL("https://hanbatmall.com"),
  alternates: {
    canonical: "https://hanbatmall.com",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://hanbatmall.com",
    siteName: "한밭중고전자",
    title: "한밭중고전자 | 대전·충청 중고가전 매입 및 판매 전문",
    description: "새것 같은 중고가전 최저가 판매 & 안 쓰는 가전 최고가 매입. 대전 중구 중촌동 30년 전통 오프라인 매장.",
    images: [
      {
        url: "/main-bg.png",
        width: 1200,
        height: 630,
        alt: "한밭중고전자 매장 전경",
      },
    ],
  },
  other: {
    // 네이버 서치어드바이저 소유확인 인증 키 적용 완료
    "naver-site-verification": "18fc4bff1ce2a4a8965886616fecc19b2da42ae7",
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
      <body>{children}</body>
    </html>
  );
}