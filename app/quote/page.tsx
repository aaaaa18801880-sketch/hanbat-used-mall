// 파일 경로: app/quote/page.tsx
import type { Metadata } from "next";
import { supabase } from "../../lib/supabase";
import {
  PRODUCT_STATUS,
  STORE,
  isProductPendingReview,
  isProductSold,
  toProductCardSummary,
  type ProductCardSummaryItem,
  type ProductCardSummarySource,
} from "../../lib/site";
import { serializeJsonLd } from "../../lib/json-ld";
import { buildBreadcrumbJsonLd } from "../../lib/seo-schema";
import { SiteHeader, SiteFooter, MobileCtaBar } from "../../lib/ui";
import { SelfQuoteClient } from "../../components/quote/self-quote-client";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "온라인 셀프견적 · PDF 견적서 발급",
  description: `대전 ${STORE.name} 판매 중인 가정용·업소용 실매물을 직접 담아 온라인 견적서를 즉시 확인하고 PDF 다운로드·인쇄·카카오톡·문자로 간편하게 전송하세요.`,
  alternates: {
    canonical: `${STORE.url}/quote`,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${STORE.url}/quote`,
    siteName: STORE.name,
    title: `온라인 셀프견적 · PDF 견적서 발급 | ${STORE.name}`,
    description:
      "원하는 중고가전·업소용 주방기기를 담아 견적서 PDF 다운로드 및 카카오톡·문자 전송까지 한 번에 진행하세요.",
    images: [
      {
        url: `${STORE.url}/store-exterior.jpg`,
        width: 1024,
        height: 576,
        alt: `${STORE.name} 온라인 셀프견적`,
      },
    ],
  },
};

export default async function QuotePage() {
  let initialProducts: ProductCardSummaryItem[] = [];

  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, title, category, description, image_url, price, status, condition_grade, views, created_at"
      )
      .neq("category", "배송인증")
      .neq("status", PRODUCT_STATUS.PENDING_REVIEW)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      console.error("[quote/page] SSR 상품 조회 실패:", error.message);
    } else {
      initialProducts = ((data ?? []) as ProductCardSummarySource[])
        .filter(
          (p) => !isProductPendingReview(p.status) && !isProductSold(p.status)
        )
        .map(toProductCardSummary);
    }
  } catch (err) {
    console.error("[quote/page] SSR 상품 조회 예외:", err);
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "셀프견적", path: "/quote" },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-hb-text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <SelfQuoteClient initialProducts={initialProducts} />
      </main>
      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
