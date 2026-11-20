// 파일 경로: app/page.tsx
import { supabase } from "../lib/supabase";
import { isProductSold, toProductCardSummary } from "../lib/site";
import { INFO_GUIDE_ARTICLES, sortGuidesByPriority } from "../lib/info-guides";
import { hasGuideInteractiveTool } from "../lib/guides/tool-slugs";
import {
  fetchInitialPublicInquiries,
  fetchPublicInquiryTotalCount,
} from "../lib/server-inquiries";
import Home, {
  type GuidePreviewSummary,
  type Review,
} from "../components/home/home-page-client";
import type { ProductItem } from "../components/products/product-card";

export const revalidate = 300;

export default async function Page() {
  const sortedGuides = sortGuidesByPriority(INFO_GUIDE_ARTICLES);
  const visualGuides = sortedGuides.filter((a) => Boolean(a.heroImage?.src));
  const pickedGuides =
    visualGuides.length >= 5
      ? visualGuides.slice(0, 5)
      : sortedGuides.slice(0, 5);

  const latestGuides: GuidePreviewSummary[] = pickedGuides.map((article) => ({
    slug: article.slug,
    category: article.category,
    title: article.title,
    summary: article.summary,
    readMinutes: article.readMinutes,
    priorityRole: article.priorityRole,
    heroImageSrc: article.heroImage?.src ?? null,
    heroImageAlt: article.heroImage?.alt ?? article.title,
    hasTool: hasGuideInteractiveTool(article.slug),
  }));
  const guideTotalCount = INFO_GUIDE_ARTICLES.length;

  const [productsResult, reviewsResult, recentResult, totalInquiryCount] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, title, category, description, image_url, price, status, condition_grade, views, created_at"
        )
        .neq("category", "배송인증")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("products")
        .select("id, title, image_url, created_at")
        .eq("category", "배송인증")
        .order("created_at", { ascending: false })
        .limit(24),
      fetchInitialPublicInquiries(24),
      fetchPublicInquiryTotalCount(),
    ]);

  let initialProducts: ProductItem[] | null = null;
  if (!productsResult.error) {
    const rows = (productsResult.data ?? []) as ProductItem[];
    rows.sort((a, b) => {
      const soldA = isProductSold(a.status) ? 1 : 0;
      const soldB = isProductSold(b.status) ? 1 : 0;
      return soldA - soldB;
    });
    initialProducts = rows.map(toProductCardSummary);
  }

  const initialReviews: Review[] | null = reviewsResult.error
    ? null
    : ((reviewsResult.data ?? []) as Review[]);

  const initialRecent = recentResult.loaded
    ? recentResult.inquiries.filter((r) => !r.is_notice).slice(0, 12)
    : process.env.SUPABASE_SERVICE_ROLE_KEY
    ? null
    : [];

  return (
    <Home
      initialProducts={initialProducts}
      initialReviews={initialReviews}
      initialRecent={initialRecent}
      totalInquiryCount={totalInquiryCount}
      guideTotalCount={guideTotalCount}
      latestGuides={latestGuides}
    />
  );
}
