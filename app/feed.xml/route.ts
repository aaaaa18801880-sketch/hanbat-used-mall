// 파일 경로: app/feed.xml/route.ts
import { NextResponse } from "next/server";
import { STORE } from "../../lib/site";
import { INFO_GUIDE_ARTICLES } from "../../lib/info-guides";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const buildDate = new Date().toUTCString();

  const itemsXml = INFO_GUIDE_ARTICLES.map((article) => {
    const link = `${STORE.url}/guide/${article.slug}`;
    const pubDate = new Date(`${article.updatedAt}T09:00:00+09:00`).toUTCString();
    const fullDesc = `${article.summary} [핵심 정리] 1) ${article.keyPoints[0]} 2) ${article.keyPoints[1]} 3) ${article.keyPoints[2]}`;
    const imageTag = article.heroImage
      ? `<enclosure url="${escapeXml(`${STORE.url}${article.heroImage.src}`)}" type="image/jpeg" length="0" />`
      : "";

    return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <category>${escapeXml(article.category)}</category>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(fullDesc)}</description>
      ${imageTag}
    </item>`;
  }).join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${STORE.name} 가전 · 전기 · 설치 정보 게시판`)}</title>
    <link>${escapeXml(`${STORE.url}/guide`)}</link>
    <atom:link href="${escapeXml(`${STORE.url}/feed.xml`)}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(
      `${STORE.since}년 개업 ${STORE.name} 현장 전문가가 정리한 에어컨 원리·PCB·제상기능·220V/380V 전기·창폐업 서류·사다리차 실측 가이드`
    )}</description>
    <language>ko-KR</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
