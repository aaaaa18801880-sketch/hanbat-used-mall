import { MetadataRoute } from "next";
import { STORE } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/gallery", "/purchase", "/inquiry", "/llms.txt", "/llms-full.txt"],
        disallow: ["/admin", "/api/"],
      },
      {
        // OpenAI ChatGPT Search / Perplexity / Claude / Google AI / Apple Intelligence / Amazon / Naver / Bing 명시적 허용
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "GPTBot",
          "PerplexityBot",
          "ClaudeBot",
          "Claude-Web",
          "Google-Extended",
          "Googlebot",
          "Applebot",
          "Applebot-Extended",
          "Amazonbot",
          "cohere-ai",
          "Bingbot",
          "Yeti",
        ],
        allow: ["/", "/gallery", "/purchase", "/inquiry", "/llms.txt", "/llms-full.txt"],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${STORE.url}/sitemap.xml`,
    host: STORE.url,
  };
}
