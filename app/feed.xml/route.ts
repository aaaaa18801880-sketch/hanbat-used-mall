// 파일 경로: app/feed.xml/route.ts
import { NextResponse } from "next/server";
import { STORE } from "../../lib/site";
import { INFO_GUIDE_ARTICLES } from "../../lib/info-guides";
import { resolveGuideThumbnail } from "../../lib/guides/thumbnails";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function resolveEnclosureMimeType(src: string): string {
  if (src.endsWith(".png")) return "image/png";
  if (src.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function GET() {
  const buildDate = new Date().toUTCString();

  const sortedArticles = [...INFO_GUIDE_ARTICLES].sort((a, b) => {
    const dateDiff = b.updatedAt.localeCompare(a.updatedAt);
    return dateDiff !== 0 ? dateDiff : b.number - a.number;
  });

  const itemsXml = sortedArticles.map((article) => {
    const link = `${STORE.url}/guide/${article.slug}`;
    const pubDate = new Date(`${article.updatedAt}T09:00:00+09:00`).toUTCString();
    const fullDesc = `${article.summary} [핵심 정리] 1) ${article.keyPoints[0]} 2) ${article.keyPoints[1]} 3) ${article.keyPoints[2]}`;
    const thumb = resolveGuideThumbnail(article);
    const imageTag = `<enclosure url="${escapeXml(`${STORE.url}${thumb.src}`)}" type="${resolveEnclosureMimeType(thumb.src)}" />`;

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
      `${STORE.since}년 개업 ${STORE.name} 현장 전문가가 정리한 총 ${INFO_GUIDE_ARTICLES.length}편 가전·에어컨 원리·실외기 PCB·220V/380V 전기·창폐업 서류·배관·에너지 효율 실전 가이드`
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
