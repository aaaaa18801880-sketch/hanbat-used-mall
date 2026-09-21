import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"], // 관리자 페이지는 검색 노출 제외
    },
    sitemap: "https://hanbatmall.com/sitemap.xml",
  };
}