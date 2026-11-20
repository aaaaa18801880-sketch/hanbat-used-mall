// 파일 경로: app/guide/[slug]/page.tsx
import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  STORE,
  isProductSold,
  normalizeProductCategory,
  telHref,
  toProductCardSummary,
} from "../../../lib/site";
import { serializeJsonLd } from "../../../lib/json-ld";
import {
  GUIDE_GOVERNANCE_DISCLAIMER,
  INFO_GUIDE_ARTICLES,
  getAdjacentInfoGuides,
  getGuideCommerceBridge,
  getInfoGuideBySlug,
  getRecommendedProductCategories,
  getRelatedInfoGuides,
} from "../../../lib/info-guides";
import {
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
} from "../../../lib/ui";
import { Icon, ICON } from "../../../lib/icons";
import {
  ProductCard,
  type ProductItem,
} from "../../../components/products/product-card";
import { GuideSectionDiagram } from "../../../components/guide/guide-diagrams";
import dynamic from "next/dynamic";
import { hasGuideInteractiveTool } from "../../../lib/guides/tool-slugs";

const GuideInteractiveTool = dynamic(() =>
  import("../../../components/guide/guide-interactive-tools").then(
    (m) => m.GuideInteractiveTool
  )
);
import {
  GuideEngagementHeaderMeta,
  GuideEngagementPanel,
} from "../../../components/guide/guide-engagement-panel";
import {
  computeTopGuideRanks,
  fetchGuideStatsMap,
} from "../../../lib/guide-stats";

export const revalidate = 1800; // 30분 ISR로 실시간 추천 매물 최신 유지

async function fetchGuideRecommendedProducts(
  categories: readonly string[],
  limit = 4
): Promise<ProductItem[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, title, category, description, image_url, price, status, condition_grade, views, created_at"
      )
      .neq("category", "배송인증")
      .neq("status", "판매완료")
      .order("created_at", { ascending: false })
      .limit(24);

    if (error || !data) {
      return [];
    }

    const activeItems = (data as ProductItem[]).filter(
      (item) => !isProductSold(item.status)
    );

    const picked: ProductItem[] = [];
    const pickedIds = new Set<string>();

    for (const targetCat of categories) {
      for (const item of activeItems) {
        if (picked.length >= limit) break;
        if (
          !pickedIds.has(item.id) &&
          normalizeProductCategory(item.category) === targetCat
        ) {
          picked.push(item);
          pickedIds.add(item.id);
        }
      }
    }

    for (const item of activeItems) {
      if (picked.length >= limit) break;
      if (!pickedIds.has(item.id)) {
        picked.push(item);
        pickedIds.add(item.id);
      }
    }

    return picked.map(toProductCardSummary);
  } catch {
    return [];
  }
}

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
        article.heroImage
          ? {
              url: `${STORE.url}${article.heroImage.src}`,
              width: 1376,
              height: 768,
              alt: article.heroImage.alt,
            }
          : {
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
  const recommendedCategories = getRecommendedProductCategories(article);
  const bridge = getGuideCommerceBridge(article);
  const [recommendedProducts, statsMap] = await Promise.all([
    fetchGuideRecommendedProducts(recommendedCategories, 4),
    fetchGuideStatsMap(),
  ]);
  const guideStat = statsMap[article.slug] ?? {
    slug: article.slug,
    views: 0,
    helpfulCount: 0,
  };
  const topRanks = computeTopGuideRanks(statsMap, 3);
  const articleTopRank = topRanks[article.slug];
  const canonicalUrl = `${STORE.url}/guide/${article.slug}`;
  const articleImageUrl = article.heroImage
    ? `${STORE.url}${article.heroImage.src}`
    : `${STORE.url}/og-image.jpg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.summary,
        keywords: article.keywords.join(", "),
        image: [articleImageUrl],
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
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />

      <main id="main-content" className="flex-1 pb-24 lg:pb-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />

        {/* 상단 아티클 헤더 (에디토리얼 리딩 폭 맞춤) */}
        <header className="border-b border-[#E2E6EC] bg-[#FAFBFD]">
          <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
            <nav
              aria-label="페이지 경로"
              className="flex flex-wrap items-center gap-1.5 text-hb-xs font-medium text-[#64748B] mb-5"
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
                className="font-bold text-[#C84312] hover:underline underline-offset-2"
              >
                {article.category}
              </Link>
            </nav>

            <div className="max-w-[68ch]">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-hb-xs font-semibold text-[#64748B]">
                <span className="font-bold text-[#141A23]">
                  {article.category}
                </span>
                <time dateTime={article.updatedAt} className="tabular-nums">
                  {article.updatedAt}
                </time>
                <GuideEngagementHeaderMeta
                  slug={article.slug}
                  initialStat={guideStat}
                  topRank={articleTopRank}
                />
              </div>

              <h1 className="hb-fluid-h1 text-[#141A23]">{article.title}</h1>

              <p className="mt-4 max-w-[64ch] text-hb-base sm:text-hb-lg text-[#334155] leading-[1.72] [text-wrap:pretty]">
                {article.summary}
              </p>
            </div>
          </div>
        </header>

        {/* 본문(66ch 리딩 컬럼) + 우측 보조 레일 */}
        <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-10 lg:gap-12 items-start">
          {/* 왼쪽 본문 컬럼 (중첩 카드 액자 없이 흰 배경 위 정갈한 타이포그래피) */}
          <article className="min-w-0 max-w-[68ch] space-y-9">
            {article.heroImage && (
              <figure className="rounded-xl border border-[#E2E6EC] bg-[#FAFBFD] overflow-hidden">
                <Image
                  src={article.heroImage.src}
                  alt={article.heroImage.alt}
                  width={1376}
                  height={768}
                  sizes="(max-width: 1024px) 100vw, 760px"
                  priority
                  className="w-full aspect-video object-cover block"
                />
                <figcaption className="px-4 py-2.5 text-hb-xs text-[#475569] border-t border-[#E2E6EC] flex flex-wrap items-center justify-between gap-2 leading-relaxed">
                  <span>{article.heroImage.caption}</span>
                  <span className="text-[#64748B] font-semibold shrink-0">
                    ※ 이해를 돕기 위한 예시 이미지입니다.
                  </span>
                </figcaption>
              </figure>
            )}

            {/* 핵심 기준 3가지 (좌측 포인트 선 인용 스타일) */}
            {article.keyPoints.length > 0 && (
              <div className="border-l-4 border-[#E8521A] bg-[#FAFBFD] pl-4 sm:pl-6 pr-4 py-4 space-y-2.5">
                <p className="text-hb-xs font-bold text-[#C84312]">
                  핵심 요약 3가지
                </p>
                <ol className="space-y-2.5 text-hb-sm sm:text-hb-base text-[#141A23] leading-[1.68]">
                  {article.keyPoints.map((point, kpIdx) => (
                    <li key={kpIdx} className="flex items-start gap-2.5">
                      <span className="font-bold text-[#C84312] tabular-nums shrink-0">
                        {kpIdx + 1}.
                      </span>
                      <span className="font-medium break-keep [text-wrap:pretty]">
                        {point}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* 본문 목차 (알약 칩 대신 간결한 앵커 목록) */}
            {article.sections.length > 2 && (
              <nav
                aria-label="본문 목차"
                className="border-y border-[#E2E6EC] py-4 space-y-2"
              >
                <p className="text-hb-xs font-bold text-[#64748B]">
                  이 글의 순서
                </p>
                <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                  {article.sections.map((section, idx) => (
                    <li key={section.heading}>
                      <a
                        href={`#section-${idx + 1}`}
                        className="group inline-flex items-baseline gap-2 text-hb-sm font-semibold text-[#334155] hover:text-[#C84312] transition-colors py-0.5"
                      >
                        <span className="text-hb-xs font-bold text-[#526071] group-hover:text-[#C84312] tabular-nums shrink-0">
                          {idx + 1}.
                        </span>
                        <span className="line-clamp-1">{section.heading}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* 본문 섹션들 */}
            <div className="space-y-10 sm:space-y-12">
              {article.sections.map((section, sectionIdx) => {
                const tableCaptionId = `guide-table-${article.slug}-${sectionIdx}`;
                return (
                <React.Fragment key={section.heading}>
                <section
                  id={`section-${sectionIdx + 1}`}
                  className="scroll-mt-24 space-y-4 pt-8 border-t border-[#E2E6EC] first:border-t-0 first:pt-0"
                >
                  <h2 className="text-hb-xl sm:text-hb-2xl font-bold text-[#141A23] leading-[1.35] tracking-[-0.02em] break-keep [text-wrap:balance]">
                    {section.heading}
                  </h2>

                  <div className="space-y-4 max-w-[64ch] text-hb-base sm:text-hb-lg text-[#1E293B] leading-[1.82]">
                    {section.paragraphs.map((p, idx) => (
                      <p key={idx} className="[text-wrap:pretty]">
                        {p}
                      </p>
                    ))}
                  </div>

                  {section.diagram && (
                    <GuideSectionDiagram id={section.diagram} />
                  )}

                  {section.table && (
                    <div
                      tabIndex={0}
                      role="region"
                      aria-labelledby={tableCaptionId}
                      className="my-5 overflow-x-auto border-y border-[#CBD5E1] focus-visible:outline-2 focus-visible:outline-[#141A23]"
                    >
                      <table className="w-full min-w-[440px] border-collapse text-left text-hb-xs sm:text-hb-sm">
                        <caption
                          id={tableCaptionId}
                          className="bg-[#FAFBFD] px-3.5 py-2.5 text-left text-hb-xs font-bold text-[#475569] border-b border-[#E2E6EC]"
                        >
                          {section.table.caption}
                        </caption>
                        <thead>
                          <tr className="bg-[#FAFBFD] border-b border-[#CBD5E1]">
                            {section.table.headers.map((header) => (
                              <th
                                key={header}
                                scope="col"
                                className="px-3.5 py-3 font-bold text-[#141A23] [text-wrap:balance]"
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
                              className="hover:bg-[#FAFBFD] transition-colors"
                            >
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`px-3.5 py-3.5 align-top leading-[1.62] break-keep ${
                                    cIdx === 0
                                      ? "font-bold text-[#141A23] min-w-[110px]"
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
                    <ul className="space-y-3 max-w-[64ch] text-hb-base text-[#334155] leading-[1.75]">
                      {section.bullets.map((bullet, bIdx) => (
                        <li
                          key={bIdx}
                          className="flex items-start gap-2.5 [text-wrap:pretty]"
                        >
                          <Icon
                            d={ICON.check}
                            className="w-4 h-4 text-[#C84312] shrink-0 mt-1.5"
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.tip && (
                    <div className="border-l-4 border-[#141A23] bg-[#FAFBFD] pl-4 sm:pl-5 pr-4 py-4 space-y-2.5">
                      <p className="text-hb-sm sm:text-hb-base font-bold text-[#141A23]">
                        {section.tip.title}
                      </p>
                      <ul className="space-y-2 text-hb-sm sm:text-hb-base text-[#334155] leading-[1.7]">
                        {section.tip.items.map((item, tIdx) => (
                          <li
                            key={tIdx}
                            className="flex items-start gap-2 [text-wrap:pretty]"
                          >
                            <span className="font-bold text-[#64748B] shrink-0">
                              ·
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
                {sectionIdx === 0 && hasGuideInteractiveTool(article.slug) && (
                  <GuideInteractiveTool slug={article.slug} />
                )}
                </React.Fragment>
                );
              })}
            </div>

            {/* 조회수 및 도움됐어요 피드백 */}
            <GuideEngagementPanel slug={article.slug} initialStat={guideStat} />

            {/* 하단 맞춤 행동 유도 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
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

            {/* 하단 참고 출처 및 정보 검증 안내 (접힘형 세부 안내로 본문 끝 시선 피로 완화) */}
            {article.verification && (
              <details className="rounded-xl border border-[#E2E6EC] bg-[#FAFBFD] px-4 py-3.5 text-hb-xs text-[#475569]">
                <summary className="cursor-pointer font-semibold text-[#334155] select-none flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon
                      d={ICON.shieldCheck}
                      className="w-4 h-4 text-[#0F766E] shrink-0"
                    />
                    <span>참고 기준 및 출처 확인 ({article.verification.verifiedAt})</span>
                  </span>
                  <span className="text-[#64748B] font-normal">
                    {article.verification.riskLevel} · 자세히 보기
                  </span>
                </summary>
                <div className="mt-3 pt-3 border-t border-[#E2E6EC] space-y-3">
                  <ul className="space-y-2.5">
                    {article.verification.primarySources.map((src, sIdx) => (
                      <li key={sIdx} className="space-y-0.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-[#141A23]">
                            {src.org}
                            {src.date ? ` (${src.date})` : ""}
                          </span>
                          {src.url && (
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#1D4ED8] hover:underline shrink-0"
                            >
                              <span>공식 사이트</span>
                              <Icon d={ICON.external} className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="font-medium text-[#334155]">
                          {src.title}
                        </p>
                        <p className="text-[#64748B]">활용: {src.usedFor}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-[#E2E6EC] pt-2.5 space-y-1 leading-[1.6]">
                    <p>
                      <strong className="text-[#141A23]">기준 · 현장 구분:</strong>{" "}
                      {article.verification.fieldNote}
                    </p>
                    <p className="text-[#64748B]">{GUIDE_GOVERNANCE_DISCLAIMER}</p>
                  </div>
                </div>
              </details>
            )}

            {/* 이전 글 / 다음 글 */}
            {(prev || next) && (
              <nav
                aria-label="이전 글 및 다음 글"
                className="pt-6 border-t border-[#E2E6EC] grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {prev ? (
                  <Link
                    href={`/guide/${prev.slug}`}
                    className="group rounded-xl border border-[#E2E6EC] bg-[#FAFBFD] p-4 hover:border-[#141A23] transition-colors"
                  >
                    <p className="text-hb-xs font-bold text-[#64748B] flex items-center gap-1">
                      <Icon d={ICON.left} className="w-3.5 h-3.5" />
                      <span>이전 글</span>
                    </p>
                    <p className="mt-1 text-hb-sm font-bold text-[#141A23] group-hover:text-[#C84312] line-clamp-1">
                      {prev.title}
                    </p>
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {next && (
                  <Link
                    href={`/guide/${next.slug}`}
                    className="group rounded-xl border border-[#E2E6EC] bg-[#FAFBFD] p-4 hover:border-[#141A23] transition-colors sm:text-right"
                  >
                    <p className="text-hb-xs font-bold text-[#64748B] flex items-center sm:justify-end gap-1">
                      <span>다음 글</span>
                      <Icon d={ICON.right} className="w-3.5 h-3.5" />
                    </p>
                    <p className="mt-1 text-hb-sm font-bold text-[#141A23] group-hover:text-[#C84312] line-clamp-1">
                      {next.title}
                    </p>
                  </Link>
                )}
              </nav>
            )}
          </article>

          {/* 오른쪽 사이드바: 매장 문의 + 연관 글 */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-xl border border-[#263040] bg-[#141A23] p-5 text-white space-y-3">
              <p className="text-hb-xs font-bold text-[#FF8A50]">
                {STORE.name} 설치·구매 문의
              </p>
              <h2 className="text-hb-base sm:text-hb-lg font-bold leading-snug [text-wrap:balance]">
                분전함·출입구 사진으로 설치 여부 확인하기
              </h2>
              <p className="text-hb-xs sm:text-hb-sm text-white/75 leading-[1.6] [text-wrap:pretty]">
                현장 사진이나 궁금한 증상을 남겨주시면 맞는 제품과 설치 가능 여부를 먼저 확인해 드립니다.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href={bridge.galleryHref}
                  className="hb-btn-accent min-h-[42px] px-4 py-2 text-hb-sm"
                >
                  <Icon d={ICON.bag} className="w-4 h-4" />
                  <span>{bridge.primaryCategory} 매물 보기</span>
                </Link>
                <a
                  href={telHref(STORE.tel)}
                  className="hb-btn bg-white text-[#141A23] hover:bg-[#F1F3F6] min-h-[42px] px-4 py-2 text-hb-sm tabular-nums"
                >
                  <Icon d={ICON.phone} className="w-4 h-4 text-[#E8521A]" />
                  <span>{STORE.tel}</span>
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao min-h-[42px] px-4 py-2 text-hb-sm"
                >
                  <Icon d={ICON.chat} className="w-4 h-4" />
                  <span>카카오톡 문의</span>
                </a>
              </div>
            </div>

            <div className="border-t border-[#E2E6EC] pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-hb-sm font-bold text-[#141A23]">
                  함께 보면 좋은 글
                </h2>
                <Link
                  href="/guide"
                  className="text-hb-xs font-bold text-[#C84312] hover:underline underline-offset-2"
                >
                  정보 글 전체 보기
                </Link>
              </div>
              <ul className="divide-y divide-[#E2E6EC]">
                {relatedArticles.map((item) => (
                  <li key={item.slug} className="py-3 first:pt-1 last:pb-0">
                    <Link
                      href={`/guide/${item.slug}`}
                      className="group block space-y-1"
                    >
                      <span className="text-hb-xs font-semibold text-[#64748B]">
                        {item.category}
                      </span>
                      <p className="text-hb-sm font-bold text-[#141A23] group-hover:text-[#C84312] transition-colors leading-snug break-keep">
                        {item.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* 관련 매물 섹션 */}
        <section
          id="guide-recommended-products"
          aria-label="관련 매물"
          className="mx-auto w-full max-w-[1080px] px-4 sm:px-6 lg:px-8 mt-12 scroll-mt-24"
        >
          <div className="border-t border-[#E2E6EC] pt-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <h2 className="text-hb-xl sm:text-hb-2xl font-bold text-[#141A23] leading-snug [text-wrap:balance]">
                  {bridge.heading}
                </h2>
                <p className="max-w-[64ch] text-hb-sm sm:text-hb-base text-[#475569] leading-[1.65] [text-wrap:pretty]">
                  {bridge.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href={bridge.galleryHref}
                  className="hb-btn-primary min-h-[40px] px-4 py-2 text-hb-xs sm:text-hb-sm"
                >
                  <span>{bridge.galleryLabel}</span>
                  <Icon d={ICON.arrow} className="w-4 h-4 text-[#FF8A50]" />
                </Link>
                <Link
                  href="/inquiry?write=1&type=buy"
                  className="hb-btn-outline min-h-[40px] px-4 py-2 text-hb-xs sm:text-hb-sm"
                >
                  <span>직접 문의하기</span>
                </Link>
              </div>
            </div>

            {recommendedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                {recommendedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E2E6EC] bg-[#FAFBFD] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-hb-sm text-[#334155]">
                  전시장 실시간 재고는 전체 매물 갤러리에서 확인하실 수 있습니다.
                </p>
                <Link
                  href={bridge.galleryHref}
                  className="hb-btn-primary min-h-[40px] px-4 py-2 text-hb-sm shrink-0"
                >
                  <span>전체 매물 보러가기</span>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
