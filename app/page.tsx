// 파일 경로: app/page.tsx
import { supabase } from "../lib/supabase";
import { isProductSold } from "../lib/site";
import Home, { type Review } from "../components/home/home-page-client";
import type { ProductItem } from "../components/products/product-card";

export const revalidate = 300;

export default async function Page() {
  const [productsResult, reviewsResult] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .neq("category", "배송인증")
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("products")
      .select("id, title, image_url, created_at")
      .eq("category", "배송인증")
      .order("created_at", { ascending: false })
      .limit(24),
  ]);

  let initialProducts: ProductItem[] | null = null;
  if (!productsResult.error) {
    const rows = (productsResult.data ?? []) as ProductItem[];
    rows.sort((a, b) => {
      const soldA = isProductSold(a.status) ? 1 : 0;
      const soldB = isProductSold(b.status) ? 1 : 0;
      return soldA - soldB;
    });
    initialProducts = rows;
  }

  const initialReviews: Review[] | null = reviewsResult.error
    ? null
    : ((reviewsResult.data ?? []) as Review[]);

  return (
    <Home initialProducts={initialProducts} initialReviews={initialReviews} />
  );
}
