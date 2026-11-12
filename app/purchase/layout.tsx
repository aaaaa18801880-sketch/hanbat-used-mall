// 파일 경로: app/purchase/layout.tsx
import type { Metadata } from "next";
import { STORE } from "../../lib/site";

export const metadata: Metadata = {
  title:
    "대전·세종·충청 중고가전 매입 · 식당/카페 폐업 설비 철거 (당일 방문·현금 정산)",
  description:
    "대전(서구·유성구·중구·동구·대덕구)·세종·충청권 가정용 중고가전 매입부터 식당·카페·사무실 폐업 주방집기 및 냉난방기 일괄 철거·매입까지. 사진 3장과 모델명 접수 시 당일 방문 수거 후 즉시 입금해 드립니다.",
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
    title: `중고가전 · 업소용 주방설비 방문 매입 신청 (당일 현금 입금) | ${STORE.name}`,
    description:
      "전면 사진과 모델명만 보내주시면 빠르게 매입 견적을 안내해 드립니다. 약속된 일정에 방문 수거 후 즉시 송금.",
    images: [
      {
        url: `${STORE.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: STORE.name,
      },
    ],
  },
};

export default function PurchaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}