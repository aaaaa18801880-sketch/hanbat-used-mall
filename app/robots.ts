import { MetadataRoute } from "next";
import { STORE } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${STORE.url}/sitemap.xml`,
  };
}
