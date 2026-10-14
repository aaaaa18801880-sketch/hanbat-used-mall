import { MetadataRoute } from "next";
import { supabase } from "../lib/supabase";
import { STORE } from "../lib/site";

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
      .select("id, created_at, category")
      .neq("category", "배송인증")
      .order("created_at", { ascending: false })
      .limit(200);

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${baseUrl}/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
