// 파일 경로: app/guide/[slug]/page.tsx
import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STORE, telHref } from "../../../lib/site";
import { serializeJsonLd } from "../../../lib/json-ld";
import {
  INFO_GUIDE_ARTICLES,
  getAdjacentInfoGuides,
  getInfoGuideBySlug,
  getRelatedInfoGuides,
} from "../../../lib/info-guides";
import {
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
  Icon,
  ICON,
} from "../../../lib/ui";

export function generateStaticParams() {
  return INFO_GUIDE_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getInfoGuideBySlug(slug);

  if (!article) {
    return {
      title: "게시글을 찾을 수 없습니다",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `${STORE.url}/guide/${article.slug}`;

  return {
    title: `${article.title} — ${article.category}`,
    description: article.summary,
    keywords: [...article.keywords, STORE.name, "가전 정보 게시판"],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      locale: "ko_KR",
      url: canonicalUrl,
      siteName: STORE.name,
      title: `${article.title} | ${STORE.name}`,
      description: article.summary,
      publishedTime: article.updatedAt,
      modifiedTime: article.updatedAt,
      images: [
        {
          url: `${STORE.url}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getInfoGuideBySlug(slug);

  if (!article) {
    notFound();
  }

  const { prev, next } = getAdjacentInfoGuides(article.slug);
  const relatedArticles = getRelatedInfoGuides(article, 3);
  const canonicalUrl = `${STORE.url}/guide/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.summary,
        datePublished: article.updatedAt,
        dateModified: article.updatedAt,
        articleSection: article.category,
        inLanguage: "ko-KR",
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonicalUrl,
        },
        author: {
          "@type": "Organization",
          name: STORE.name,
          url: STORE.url,
        },
        publisher: {
          "@type": "Organization",
          name: STORE.name,
          url: STORE.url,
          logo: {
            "@type": "ImageObject",
            url: `${STORE.url}/icon-512.png`,
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "홈",
            item: STORE.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "정보 게시판",
            item: `${STORE.url}/guide`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA]">
      <SiteHeader />

      <main id="main-content" className="flex-1 pb-24 lg:pb-14">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />

        {/* 상단 아티클 헤더 */}
        <header className="border-b border-[#E2E6EC] bg-white">
          <div className="hb-container py-6 sm:py-9">
            <nav
              aria-label="페이지 경로"
              className="flex flex-wrap items-center gap-1.5 text-hb-xs font-medium text-[#64748B] mb-4"
            >
              <Link href="/" className="hover:text-[#141A23] transition-colors">
                홈
              </Link>
              <Icon d={ICON.right} className="w-3.5 h-3.5 text-[#94A3B8]" />
              <Link
                href="/guide"
                className="hover:text-[#141A23] transition-colors"
              >
                정보 게시판
              </Link>
              <Icon d={ICON.right} className="w-3.5 h-3.5 text-[#94A3B8]" />
              <Link
                href={`/guide?category=${encodeURIComponent(article.category)}`}
                className="font-bold text-[#E8521A] hover:underline underline-offset-2"
              >
                {article.category}
              </Link>
            </nav>

            <div className="max-w-[72ch]">
              <div className="flex flex-wrap items-center gap-2.5 mb-3 text-hb-xs font-semibold text-[#64748B]">
                <span className="hb-trim inline-flex items-center rounded-md border border-[#E2E6EC] bg-[#F7F8FA] px-2.5 py-1 font-bold text-[#141A23]">
                  {article.category}
                </span>
                <span className="font-mono tabular-nums">
                  No.{String(article.number).padStart(2, "0")}
                </span>
                <span>·</span>
                <span className="tabular-nums">{article.readMinutes}분 읽기</span>
                <span>·</span>
                <time dateTime={article.updatedAt} className="tabular-nums">
                  기준일 {article.updatedAt}
                </time>
              </div>

              <h1 className="hb-fluid-h1 text-[#141A23]">{article.title}</h1>

              <p className="mt-3.5 max-w-[68ch] text-hb-base sm:text-hb-lg text-[#334155] leading-[1.65] [text-wrap:pretty]">
                {article.summary}
              </p>
            </div>
          </div>
        </header>

        {/* 본문 + 사이드바 그리드 */}
        <div className="hb-container pt-6 sm:pt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8 items-start">
          {/* 왼쪽 본문 컬럼 */}
          <article className="rounded-2xl border border-[#E2E6EC] bg-white p-5 sm:p-8 shadow-2xs space-y-8">
            {/* 현장 핵심 3줄 요약 박스 */}
            <section
              aria-label="현장 핵심 정리"
              className="rounded-xl border border-[#FADCD0] bg-[#FFF4EE] p-4 sm:p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon
                  d={ICON.shieldCheck}
                  className="w-4 h-4 text-[#E8521A] shrink-0"
                />
                <h2 className="text-hb-sm sm:text-hb-base font-bold text-[#141A23] [text-wrap:balance]">
                  바쁘신 분들을 위한 현장 핵심 3줄 정리
                </h2>
              </div>
              <ol className="space-y-2 text-hb-sm text-[#1E293B] leading-[1.6]">
                {article.keyPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 [text-wrap:pretty]"
                  >
                    <span className="font-mono text-hb-xs font-bold text-[#E8521A] pt-0.5 shrink-0 tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ol>
            </section>

            {/* 본문 섹션들 */}
            <div className="space-y-8">
              {article.sections.map((section) => (
                <section
                  key={section.heading}
                  className="space-y-4 pt-2 border-t border-[#F1F3F6] first:border-t-0 first:pt-0"
                >
                  <h2 className="text-hb-lg sm:text-hb-xl font-bold text-[#141A23] leading-snug break-keep [text-wrap:balance]">
                    {section.heading}
                  </h2>

                  <div className="space-y-3.5 max-w-[68ch] text-hb-base text-[#334155] leading-[1.72]">
                    {section.paragraphs.map((p, idx) => (
                      <p key={idx} className="[text-wrap:pretty]">
                        {p}
                      </p>
                    ))}
                  </div>

                  {section.table && (
                    <div className="overflow-x-auto rounded-xl border border-[#E2E6EC]">
                      <table className="w-full min-w-[540px] border-collapse text-left text-hb-xs sm:text-hb-sm">
                        <caption className="bg-[#F7F8FA] px-4 py-2.5 text-left text-hb-xs font-bold text-[#475569] border-b border-[#E2E6EC]">
                          {section.table.caption}
                        </caption>
                        <thead>
                          <tr className="bg-[#F7F8FA] border-b border-[#E2E6EC]">
                            {section.table.headers.map((header) => (
                              <th
                                key={header}
                                scope="col"
                                className="px-4 py-3 font-bold text-[#141A23] [text-wrap:balance]"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E6EC] bg-white">
                          {section.table.rows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:bg-[#F7F8FA]/60 transition-colors"
                            >
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`px-4 py-3 align-top leading-[1.6] break-keep ${
                                    cIdx === 0
                                      ? "font-bold text-[#141A23] whitespace-nowrap"
                                      : "text-[#334155]"
                                  }`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="space-y-2.5 max-w-[68ch] text-hb-sm sm:text-hb-base text-[#334155] leading-[1.68]">
                      {section.bullets.map((bullet, bIdx) => (
                        <li
                          key={bIdx}
                          className="flex items-start gap-2.5 [text-wrap:pretty]"
                        >
                          <Icon
                            d={ICON.check}
                            className="w-4 h-4 text-[#E8521A] shrink-0 mt-1"
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.tip && (
                    <div className="rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] p-4 sm:p-5 space-y-2.5">
                      <p className="flex items-center gap-2 text-hb-sm sm:text-hb-base font-bold text-[#141A23]">
                        <Icon
                          d={ICON.bolt}
                          className="w-4 h-4 text-[#E8521A] shrink-0"
                        />
                        <span>{section.tip.title}</span>
                      </p>
                      <ul className="space-y-2 text-hb-sm text-[#334155] leading-[1.65]">
                        {section.tip.items.map((item, tIdx) => (
                          <li
                            key={tIdx}
                            className="flex items-start gap-2 [text-wrap:pretty]"
                          >
                            <span className="font-mono text-hb-xs font-bold text-[#64748B] pt-0.5 shrink-0">
                              •
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* 하단 맞춤 행동 유도 */}
            <div className="pt-6 border-t border-[#E2E6EC] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {article.ctas.map((cta) => (
                  <Link
                    key={cta.href + cta.label}
                    href={cta.href}
                    className={`min-h-[44px] px-4 py-2.5 text-hb-sm ${
                      cta.variant === "accent"
                        ? "hb-btn-accent"
                        : cta.variant === "outline"
                        ? "hb-btn-outline"
                        : "hb-btn-primary"
                    }`}
                  >
                    <span>{cta.label}</span>
                    <Icon d={ICON.arrow} className="w-4 h-4" />
                  </Link>
                ))}
              </div>

              <Link
                href="/guide"
                className="inline-flex items-center gap-1.5 text-hb-sm font-bold text-[#475569] hover:text-[#141A23] underline underline-offset-4 py-2"
              >
                <Icon d={ICON.left} className="w-4 h-4" />
                <span>정보 게시판 목록으로</span>
              </Link>
            </div>

            {/* 이전 글 / 다음 글 */}
            {(prev || next) && (
              <nav
                aria-label="이전 글 및 다음 글"
                className="pt-5 border-t border-[#E2E6EC] grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {prev ? (
                  <Link
                    href={`/guide/${prev.slug}`}
                    className="group rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] p-4 hover:border-[#141A23] transition-colors"
                  >
                    <p className="text-hb-xs font-bold text-[#64748B] flex items-center gap-1">
                      <Icon d={ICON.left} className="w-3.5 h-3.5" />
                      <span>이전 글</span>
                    </p>
                    <p className="mt-1 text-hb-sm font-bold text-[#141A23] group-hover:text-[#E8521A] line-clamp-1">
                      {prev.title}
                    </p>
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {next && (
                  <Link
                    href={`/guide/${next.slug}`}
                    className="group rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] p-4 hover:border-[#141A23] transition-colors sm:text-right"
                  >
                    <p className="text-hb-xs font-bold text-[#64748B] flex items-center sm:justify-end gap-1">
                      <span>다음 글</span>
                      <Icon d={ICON.right} className="w-3.5 h-3.5" />
                    </p>
                    <p className="mt-1 text-hb-sm font-bold text-[#141A23] group-hover:text-[#E8521A] line-clamp-1">
                      {next.title}
                    </p>
                  </Link>
                )}
              </nav>
            )}
          </article>

          {/* 오른쪽 사이드바: 현장 상담 + 연관 글 */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-[#263040] bg-[#141A23] p-5 text-white space-y-3.5">
              <p className="text-hb-xs font-bold text-[#FF8A50]">
                {STORE.name} 현장 상담
              </p>
              <h2 className="text-hb-base sm:text-hb-lg font-bold leading-snug [text-wrap:balance]">
                전기·설치 공간이 헷갈리면 사진 한 장으로 바로 확인하세요
              </h2>
              <p className="text-hb-xs sm:text-hb-sm text-white/75 leading-[1.6] [text-wrap:pretty]">
                분전함, 현관문, 설치할 위치 사진을 보내주시면 기사님이 220V/380V 여부와 반입 가능 여부를 바로 안내해 드립니다.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={telHref(STORE.tel)}
                  className="hb-btn bg-white text-[#141A23] hover:bg-[#F1F3F6] min-h-[42px] px-4 py-2 text-hb-sm tabular-nums"
                >
                  <Icon d={ICON.phone} className="w-4 h-4 text-[#E8521A]" />
                  <span>전화 상담 {STORE.tel}</span>
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao min-h-[42px] px-4 py-2 text-hb-sm"
                >
                  <Icon d={ICON.chat} className="w-4 h-4" />
                  <span>카카오톡 사진 상담</span>
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E2E6EC] bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-hb-sm font-bold text-[#141A23]">
                  함께 읽으면 좋은 정보
                </h2>
                <Link
                  href="/guide"
                  className="text-hb-xs font-bold text-[#E8521A] hover:underline underline-offset-2"
                >
                  전체 보기
                </Link>
              </div>
              <ul className="divide-y divide-[#E2E6EC]">
                {relatedArticles.map((item) => (
                  <li key={item.slug} className="py-2.5 first:pt-0 last:pb-0">
                    <Link
                      href={`/guide/${item.slug}`}
                      className="group block space-y-1"
                    >
                      <span className="text-hb-xs font-semibold text-[#64748B]">
                        {item.category}
                      </span>
                      <p className="text-hb-sm font-bold text-[#141A23] group-hover:text-[#E8521A] transition-colors leading-snug break-keep">
                        {item.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
