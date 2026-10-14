import type { Metadata } from "next";
import { STORE } from "../../lib/site";

export const metadata: Metadata = {
  title: "중고가전 · 업소용 주방기기 방문 매입 신청",
  description:
    "가정 이사·가전 교체부터 식당·카페 폐업 및 매장 정리까지, 사진과 품목 정보를 남겨주시면 방문 수거 및 현장 즉시 정산을 도와드립니다.",
  alternates: {
    canonical: "/purchase",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${STORE.url}/purchase`,
    siteName: STORE.name,
    title: `중고가전 · 업소용 주방기기 매입 신청 | ${STORE.name}`,
    description:
      "사진 첨부로 간편하게 무료 매입 견적을 신청하세요. 방문 수거 후 현장 즉시 입금해 드립니다.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: STORE.name }],
  },
};

export default function PurchaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}