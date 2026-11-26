// 파일 경로: app/layout.tsx
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import { STORE, getCategoryWarrantyInfo } from "../lib/site";
import { serializeJsonLd } from "../lib/json-ld";
import {
  buildWebsiteJsonLd,
  buildOrganizationJsonLd,
  buildLocalBusinessJsonLd,
} from "../lib/seo-schema";
import { buildThemeInitInlineScript } from "../lib/site-theme";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-32CDGHN1F0";
const AIRCON_WARRANTY = getCategoryWarrantyInfo("에어컨/냉난방기");
const MAJOR_WARRANTY = getCategoryWarrantyInfo("냉장고");

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
    `[실매물 가격 문의 · 에어컨 ${AIRCON_WARRANTY.compactLabel}] ${STORE.since}년 개업 대전 중촌동 1·2층 직영 쇼룸. 고압세척과 배송 전 작동 점검을 마친 중고 냉장고·세탁기·에어컨·업소용 45박스 냉장고·제빙기·쇼케이스 판매 및 이사·폐업 당일 현금 방문매입. (세금계산서 100% 발행)`,
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
      "application/rss+xml": "/feed.xml",
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: STORE.url,
    siteName: STORE.name,
    title: `${STORE.name} | 대전 중고가전·업소용 주방설비 직영 매장 (${AIRCON_WARRANTY.compactLabel})`,
    description:
      `SINCE ${STORE.since} 대전 중구 중촌동 직영 매장. 고압세척·배송 전 작동 점검 완료 실매물, 에어컨 ${AIRCON_WARRANTY.compactLabel} · 주요가전 ${MAJOR_WARRANTY.compactLabel}. 가정용 가전부터 식당·카페 창업 설비 판매 및 당일 현금 방문매입.`,
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
    title: `${STORE.name} | 대전 중고가전·업소용 주방설비 직영 매장 (${AIRCON_WARRANTY.compactLabel})`,
    description:
      `SINCE ${STORE.since} 대전 중구 중촌동 직영 매장. 고압세척·배송 전 작동 점검 완료 실매물, 에어컨 ${AIRCON_WARRANTY.compactLabel} · 주요가전 ${MAJOR_WARRANTY.compactLabel}. 가정용 가전부터 식당·카페 창업 설비 판매 및 당일 현금 방문매입.`,
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
  const websiteJsonLd = buildWebsiteJsonLd();
  const organizationJsonLd = buildOrganizationJsonLd();
  const localBusinessJsonLd = buildLocalBusinessJsonLd();

  return (
    <html lang="ko" data-hb-theme="clean" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: buildThemeInitInlineScript() }}
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
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prefetch: [
                {
                  source: "list",
                  urls: ["/", "/gallery", "/purchase", "/guide"],
                  eagerness: "moderate",
                },
              ],
            }),
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
