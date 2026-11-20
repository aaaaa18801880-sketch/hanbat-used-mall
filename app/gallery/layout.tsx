// 파일 경로: app/gallery/layout.tsx
import type { Metadata } from "next";
import { STORE, getCategoryWarrantyInfo } from "../../lib/site";
import { supabase } from "../../lib/supabase";
import { serializeJsonLd } from "../../lib/json-ld";
import { buildBreadcrumbJsonLd } from "../../lib/seo-schema";
import { GalleryInitialDataProvider } from "../../components/gallery/gallery-initial-data";
import type { ProductItem } from "../../components/products/product-card";

export const revalidate = 300;

const AIRCON_WARRANTY = getCategoryWarrantyInfo("에어컨/냉난방기");
const MAJOR_WARRANTY = getCategoryWarrantyInfo("냉장고");

export const metadata: Metadata = {
  title:
    `실시간 판매 제품 갤러리 (가격 문의 · 에어컨 ${AIRCON_WARRANTY.compactLabel}) — 중고가전·업소용 주방기기`,
  description:
    `[고압세척 · 배송 전 작동 점검 완료 실매물] 대전 ${STORE.name} 직영 매장에서 판매 중인 에어컨·냉난방기(${AIRCON_WARRANTY.compactLabel}), 냉장고, 세탁기(${MAJOR_WARRANTY.compactLabel}), TV 및 업소용 설비 실시간 재고를 확인하고 가격은 전화·카톡으로 문의하세요.`,
  alternates: {
    canonical: `${STORE.url}/gallery`,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${STORE.url}/gallery`,
    siteName: STORE.name,
    title: `실시간 판매 제품 갤러리 (${AIRCON_WARRANTY.compactLabel} · 실매물 가격 문의) | ${STORE.name}`,
    description:
      "가정용 중고가전부터 식당·카페 업소용 설비까지 고압세척·작동 점검 완료 실매물 갤러리. 전자세금계산서 100% 발행.",
    images: [
      {
        url: `${STORE.url}/store-exterior.jpg`,
        width: 1024,
        height: 576,
        alt: `${STORE.name} 실매물 전시장`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `실시간 판매 제품 갤러리 | ${STORE.name}`,
    description:
      "고압세척·배송 전 작동 점검 완료 가정용·업소용 실매물 갤러리.",
    images: [`${STORE.url}/store-exterior.jpg`],
  },
};

export default async function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialProducts: ProductItem[] | null = null;

  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, title, category, description, image_url, price, status, condition_grade, views, created_at"
      )
      .neq("category", "배송인증")
      .order("created_at", { ascending: false })
      .limit(400);

    if (error) {
      console.error("[gallery/layout] SSR 상품 조회 실패:", error.message);
    } else {
      initialProducts = (data ?? []) as ProductItem[];
    }
  } catch (err) {
    console.error("[gallery/layout] SSR 상품 조회 예외:", err);
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "판매 제품 갤러리", path: "/gallery" },
  ]);

  return (
    <GalleryInitialDataProvider products={initialProducts}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      {children}
    </GalleryInitialDataProvider>
  );
}