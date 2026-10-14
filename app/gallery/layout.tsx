import type { Metadata } from "next";
import { STORE } from "../../lib/site";

export const metadata: Metadata = {
  // ... 기존 내용 유지
  title: "판매 제품 갤러리 — 중고가전·업소용 주방기기 실매물",
  description:
    "한밭중고전자에서 직접 세척·검수를 마친 에어컨, 냉난방기, 냉장고, 세탁기, 건조기, 업소용 냉장고·제빙기·쇼케이스 실매물 재고를 확인하세요.",
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${STORE.url}/gallery`,
    siteName: STORE.name,
    title: `판매 제품 갤러리 | ${STORE.name}`,
    description:
      "가정용 중고가전부터 식당·카페 업소용 설비까지 세척·검수 완료 실매물 갤러리.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: STORE.name }],
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}