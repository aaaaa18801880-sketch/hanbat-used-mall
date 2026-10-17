// 파일 경로: app/sitemap.ts
import { MetadataRoute } from "next";
import { supabase } from "../lib/supabase";
import { STORE, isProductSold } from "../lib/site";

export const revalidate = 3600; // 1시간마다 sitemap.xml 자동 갱신

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = STORE.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/purchase`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/inquiry`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    const { data: products } = await supabase
      .from("products")
      .select("id, created_at, category, status")
      .neq("category", "배송인증")
      .order("created_at", { ascending: false })
      .limit(200);

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${baseUrl}/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: isProductSold(p.status) ? 0.5 : 0.8,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}