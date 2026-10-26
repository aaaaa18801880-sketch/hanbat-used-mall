// 파일 경로: app/purchase/layout.tsx
import type { Metadata } from "next";
import { STORE } from "../../lib/site";

export const metadata: Metadata = {
  title:
    "중고가전 · 식당/카페 폐업설비 방문 매입 신청 (수거 당일 100% 현금정산)",
  description:
    "[사진 전송 간편 견적 · 현장 즉시 입금] 가정 이사·원룸 퇴실 가전 처분부터 식당·카페·사무실 폐업 주방기기 및 냉난방기 일괄 철거·매입까지, 대전·세종·충청권 직접 방문 수거 후 당일 현금으로 정산해 드립니다.",
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