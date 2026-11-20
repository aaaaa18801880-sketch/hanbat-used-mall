// 파일 경로: app/purchase/layout.tsx
import type { Metadata } from "next";
import { STORE } from "../../lib/site";
import { serializeJsonLd } from "../../lib/json-ld";
import {
  buildBreadcrumbJsonLd,
  buildBuybackServiceJsonLd,
} from "../../lib/seo-schema";

export const metadata: Metadata = {
  title:
    "대전·세종·충청 중고가전 매입 · 식당/카페 폐업 설비 철거 (당일 방문·현금 정산)",
  description:
    "대전(서구·유성구·중구·동구·대덕구)·세종·충청권 가정용 중고가전 매입부터 식당·카페·사무실 폐업 주방집기 및 냉난방기 일괄 철거·매입까지. 정면·명판 사진 접수 시 사전 시세 안내 후 방문 수거·현장 즉시 정산해 드립니다.",
  keywords: [
    "대전 중고가전 매입",
    "세종 중고가전 매입",
    "대전 식당 폐업 정리",
    "대전 업소용 냉장고 매입",
    "중고 에어컨 매입 철거",
    "한밭중고전자 매입",
  ],
  alternates: {
    canonical: `${STORE.url}/purchase`,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${STORE.url}/purchase`,
    siteName: STORE.name,
    title: `중고가전 · 업소용 주방설비 방문 매입 신청 (현장 즉시 정산) | ${STORE.name}`,
    description:
      "정면 사진과 제조년월 명판 사진만 보내주시면 감가 없는 사전 매입 시세를 안내해 드립니다. 약속된 일정에 방문 수거 후 즉시 송금.",
    images: [
      {
        url: `${STORE.url}/images/guide/buyback-appraisal.jpg`,
        width: 1200,
        height: 675,
        alt: `${STORE.name} 중고가전·폐업 설비 현장 방문 매입`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `중고가전 · 폐업 설비 방문 매입 신청 | ${STORE.name}`,
    description:
      "정면·명판 사진 2장으로 사전 시세 확인 후 대전·세종·충청 직영 방문 수거·현장 즉시 정산.",
    images: [`${STORE.url}/images/guide/buyback-appraisal.jpg`],
  },
};

export default function PurchaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "가전 방문 매입", path: "/purchase" },
  ]);
  const serviceJsonLd = buildBuybackServiceJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(serviceJsonLd) }}
      />
      {children}
    </>
  );
}