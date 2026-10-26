import type { Metadata } from "next";
import { STORE } from "../../lib/site";

export const metadata: Metadata = {
  title: "고객 문의 · 매입 신청 게시판",
  description:
    "중고가전 구매 상담, 내 물건 팔기(방문 매입 견적), 식당·카페 창업 및 폐업 대량 정리 상담을 남겨주시면 빠르게 확인 후 안내해 드립니다.",
  alternates: {
    canonical: `${STORE.url}/inquiry`,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${STORE.url}/inquiry`,
    siteName: STORE.name,
    title: `고객 문의 · 매입 신청 게시판 | ${STORE.name}`,
    description:
      "한밭중고전자 구매 문의 및 무료 방문 매입 견적 상담 게시판입니다.",
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

export default function InquiryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}