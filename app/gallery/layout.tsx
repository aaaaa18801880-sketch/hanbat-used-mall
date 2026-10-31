// 파일 경로: app/gallery/layout.tsx
import type { Metadata } from "next";
import { STORE } from "../../lib/site";
import { supabase } from "../../lib/supabase";
import { GalleryInitialDataProvider } from "../../components/gallery/gallery-initial-data";
import type { ProductItem } from "../../components/products/product-card";

export const revalidate = 300;

export const metadata: Metadata = {
  title:
    "실시간 판매 제품 갤러리 (가격 문의 · 무상A/S 최대 8개월) — 중고가전·업소용 주방기기",
  description:
    "[분해 세척 · 작동 점검 완료 실매물] 대전 한밭중고전자 직영 매장에서 판매 중인 에어컨·냉난방기(최대 8개월), 냉장고, 세탁기(최대 4개월), TV 및 업소용 설비 등 계약 조건별 보증 실시간 재고를 확인하고 가격은 전화·카톡으로 문의하세요.",
  alternates: {
    canonical: `${STORE.url}/gallery`,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${STORE.url}/gallery`,
    siteName: STORE.name,
    title: `실시간 판매 제품 갤러리 (무상A/S 보증 · 실매물 가격 문의) | ${STORE.name}`,
    description:
      "가정용 중고가전부터 식당·카페 업소용 설비까지 분해 세척·검수 완료 실매물 갤러리. 전자세금계산서 100% 발행.",
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

export default async function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = await supabase
    .from("products")
    .select("*")
    .neq("category", "배송인증")
    .order("created_at", { ascending: false })
    .limit(400);

  return (
    <GalleryInitialDataProvider products={(data ?? []) as ProductItem[]}>
      {children}
    </GalleryInitialDataProvider>
  );
}