// 파일 경로: app/gallery/layout.tsx
import type { Metadata } from "next";
import { STORE } from "../../lib/site";

export const metadata: Metadata = {
  title:
    "실시간 판매 제품 갤러리 (가격공개 · 무상A/S 최대 8개월) — 중고가전·업소용 주방기기",
  description:
    "[분해 고압 살균세척 · 시운전 완료 실매물] 대전 한밭중고전자 직영 매장에서 판매 중인 에어컨·냉난방기(8개월 보증), 냉장고, 세탁기, 업소용 45박스 냉장고·제빙기·쇼케이스(4개월 보증) 실시간 재고와 가격을 확인하세요.",
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${STORE.url}/gallery`,
    siteName: STORE.name,
    title: `실시간 판매 제품 갤러리 (무상A/S 보증 · 실매물 가격공개) | ${STORE.name}`,
    description:
      "가정용 중고가전부터 식당·카페 업소용 설비까지 분해 세척·검수 완료 실매물 갤러리. 전자세금계산서 100% 발행.",
    images: [
      { url: "/og-image.jpg", width: 1200, height: 630, alt: STORE.name },
    ],
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}