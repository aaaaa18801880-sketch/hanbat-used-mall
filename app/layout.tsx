import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🔎 네이버 및 구글 검색엔진 최적화 (SEO) 설정
export const metadata: Metadata = {
  title: "한밭중고전자 - 대전 중고가전 매입 및 판매 전문 (SINCE 1997)",
  description: "대전 중구 중촌동 위치. 냉장고, 세탁기, TV, 에어컨, 업소용 주방기기 고가 매입 및 합리적 판매. 전국 배송 가능.",
  keywords: ["대전 중고가전", "대전 중고냉장고", "대전 중고세탁기", "중고 업소용 장비", "한밭중고전자"],
  authors: [{ name: "한밭중고전자" }],
  openGraph: {
    title: "한밭중고전자 - 대전 중고가전 전문 쇼룸",
    description: "SINCE 1997, 믿을 수 있는 대전 중고 가전·전자제품 매입/판매 전문점",
    url: "https://hanbatmall.com",
    siteName: "한밭중고전자",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 지역 비즈니스 구조화 데이터 (Google/Naver Local Business SEO) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "한밭중고전자",
              "image": "https://hanbatmall.com/store.jpg",
              "@id": "https://hanbatmall.com",
              "url": "https://hanbatmall.com",
              "telephone": "042-523-9179",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "중촌동 144",
                "addressLocality": "대전광역시 중구",
                "addressRegion": "대전",
                "postalCode": "35048",
                "addressCountry": "KR"
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ],
                "opens": "09:00",
                "closes": "20:00"
              },
              "sameAs": [
                "https://cafe.naver.com/hanbatmall"
              ]
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}