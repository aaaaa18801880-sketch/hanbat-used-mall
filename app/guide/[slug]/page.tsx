// 파일 경로: app/guide/[slug]/page.tsx
import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  STORE,
  isProductSold,
  normalizeProductCategory,
  telHref,
} from "../../../lib/site";
import { serializeJsonLd } from "../../../lib/json-ld";
import {
  INFO_GUIDE_ARTICLES,
  getAdjacentInfoGuides,
  getGuideCommerceBridge,
  getGuideSearchFaqs,
  getInfoGuideBySlug,
  getRecommendedProductCategories,
  getRelatedInfoGuides,
} from "../../../lib/info-guides";
import {
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
  SafeImg,
  Icon,
  ICON,
} from "../../../lib/ui";
import {
  ProductCard,
  type ProductItem,
} from "../../../components/products/product-card";
import { GuideSectionDiagram } from "../../../components/guide/guide-diagrams";

export const revalidate = 1800; // 30분 ISR로 실시간 추천 매물 최신 유지

async function fetchGuideRecommendedProducts(
  categories: readonly string[],
  limit = 4
): Promise<{ items: ProductItem[]; primaryCategoryCount: number }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, title, category, description, image_url, price, status, condition_grade, views, created_at"
      )
      .neq("category", "배송인증")
      .order("created_at", { ascending: false })
      .limit(120);

    if (error || !data) {
      return { items: [], primaryCategoryCount: 0 };
    }

    const activeItems = (data as ProductItem[]).filter(
      (item) => !isProductSold(item.status)
    );
    const primaryCat = categories[0];
    const primaryCategoryCount = activeItems.filter(
      (item) => normalizeProductCategory(item.category) === primaryCat
    ).length;

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

    return {
      items: picked,
      primaryCategoryCount,
    };
  } catch {
    return { items: [], primaryCategoryCount: 0 };
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
  const searchFaqs = getGuideSearchFaqs(article);
  const { items: recommendedProducts, primaryCategoryCount } =
    await fetchGuideRecommendedProducts(recommendedCategories, 4);
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
        "@type": "FAQPage",
        mainEntity: searchFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
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
            {article.heroImage && (
              <figure className="rounded-xl border border-[#E2E6EC] bg-[#F8FAFC] overflow-hidden">
                <SafeImg
                  src={article.heroImage.src}
                  alt={article.heroImage.alt}
                  width={1376}
                  height={768}
                  eager
                  priority="high"
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

            {/* 본문 목차 (빠른 이동 + 검색 스니펫 앵커) & 실매물 연결 띠 */}
            <div className="space-y-3">
              <nav
                aria-label="본문 목차 바로가기"
                className="rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] px-4 py-3"
              >
                <p className="text-hb-xs font-bold text-[#64748B] mb-2">
                  이 글의 목차
                </p>
                <ol className="flex flex-wrap gap-2">
                  {article.sections.map((section, idx) => (
                    <li key={section.heading}>
                      <a
                        href={`#section-${idx + 1}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E6EC] bg-white px-2.5 py-1.5 text-hb-xs font-semibold text-[#141A23] hover:border-[#E8521A] hover:text-[#E8521A] transition-colors"
                      >
                        <span className="font-mono text-[#E8521A] tabular-nums">
                          {idx + 1}.
                        </span>
                        <span className="line-clamp-1">{section.heading}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              {primaryCategoryCount > 0 && (
                <div className="rounded-xl border border-[#CCFBF1] bg-[#F0FDFA] px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
                  <p className="text-hb-xs sm:text-hb-sm text-[#134E4A] font-medium">
                    현재 {STORE.name} 전시장에{" "}
                    <strong className="font-bold text-[#0F766E]">
                      검수·세척 완료된 {bridge.primaryCategory} {primaryCategoryCount}대
                    </strong>
                    가 바로 출고 대기 중입니다.
                  </p>
                  <a
                    href="#guide-recommended-products"
                    className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#0F766E] hover:underline underline-offset-4 shrink-0"
                  >
                    <span>아래 추천 매물 바로 보기</span>
                    <Icon d={ICON.arrow} className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* 본문 섹션들 */}
            <div className="space-y-8">
              {article.sections.map((section, sectionIdx) => {
                const tableCaptionId = `guide-table-${article.slug}-${sectionIdx}`;
                return (
                <section
                  id={`section-${sectionIdx + 1}`}
                  key={section.heading}
                  className="scroll-mt-24 space-y-4 pt-2 border-t border-[#F1F3F6] first:border-t-0 first:pt-0"
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

                  {section.diagram && (
                    <GuideSectionDiagram id={section.diagram} />
                  )}

                  {section.table && (
                    <div
                      tabIndex={0}
                      role="region"
                      aria-labelledby={tableCaptionId}
                      className="overflow-x-auto rounded-xl border border-[#E2E6EC] focus-visible:outline-2 focus-visible:outline-[#E8521A]"
                    >
                      <table className="w-full min-w-[540px] border-collapse text-left text-hb-xs sm:text-hb-sm">
                        <caption
                          id={tableCaptionId}
                          className="bg-[#F7F8FA] px-4 py-2.5 text-left text-hb-xs font-bold text-[#475569] border-b border-[#E2E6EC]"
                        >
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
                );
              })}
            </div>

            {/* 구글·AI 검색 문답 일치용 핵심 Q&A */}
            <section
              aria-label="한눈에 보는 핵심 질의응답"
              className="pt-6 border-t border-[#E2E6EC] space-y-3.5"
            >
              <h2 className="text-hb-base sm:text-hb-lg font-bold text-[#141A23]">
                이 주제와 관련해 소비자들이 자주 묻는 핵심 질문
              </h2>
              <dl className="space-y-2.5">
                {searchFaqs.map((faq) => (
                  <div
                    key={faq.q}
                    className="rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] p-4"
                  >
                    <dt className="flex items-start gap-2 text-hb-sm sm:text-hb-base font-bold text-[#141A23] break-keep">
                      <span className="text-[#E8521A] font-bold shrink-0">
                        Q.
                      </span>
                      <span>{faq.q}</span>
                    </dt>
                    <dd className="mt-1.5 pl-5 text-hb-xs sm:text-hb-sm text-[#334155] leading-[1.65] [text-wrap:pretty]">
                      {faq.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

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
                <Link
                  href={bridge.galleryHref}
                  className="hb-btn bg-[#E8521A] text-white hover:bg-[#D14410] min-h-[42px] px-4 py-2 text-hb-sm"
                >
                  <Icon d={ICON.bag} className="w-4 h-4" />
                  <span>{bridge.primaryCategory} 실매물 보기</span>
                </Link>
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

        {/* 글 읽은 소비자 → 실매물 구매 전환 섹션 */}
        <section
          id="guide-recommended-products"
          aria-label="이 글과 관련된 검수 완료 실매물"
          className="hb-container mt-8 sm:mt-10 scroll-mt-24"
        >
          <div className="rounded-2xl border border-[#E2E6EC] bg-white p-5 sm:p-7 shadow-2xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#E2E6EC]">
              <div className="space-y-2">
                <p className="hb-eyebrow">검증된 실매물 · 바로 구매 연결</p>
                <h2 className="text-hb-xl sm:text-hb-2xl font-bold text-[#141A23] leading-snug [text-wrap:balance]">
                  {bridge.heading}
                </h2>
                <p className="max-w-[68ch] text-hb-sm text-[#475569] leading-[1.65] [text-wrap:pretty]">
                  {bridge.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href={bridge.galleryHref}
                  className="hb-btn-primary min-h-[42px] px-4 py-2 text-hb-xs sm:text-hb-sm"
                >
                  <span>{bridge.galleryLabel}</span>
                  <Icon d={ICON.arrow} className="w-4 h-4 text-[#FF8A50]" />
                </Link>
                <Link
                  href="/inquiry?write=1&type=buy"
                  className="hb-btn-outline min-h-[42px] px-4 py-2 text-hb-xs sm:text-hb-sm"
                >
                  <span>맞춤 매물 · 타지역 배송 문의</span>
                </Link>
              </div>
            </div>

            {/* 구매 신뢰 4대 포인트 */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-hb-xs text-[#334155]">
              <li className="rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] px-3.5 py-2.5 font-semibold flex items-center gap-2">
                <Icon d={ICON.check} className="w-4 h-4 text-[#0F766E] shrink-0" />
                <span>120bar 분해 세척 · 24시간 시운전</span>
              </li>
              <li className="rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] px-3.5 py-2.5 font-semibold flex items-center gap-2">
                <Icon d={ICON.shieldCheck} className="w-4 h-4 text-[#E8521A] shrink-0" />
                <span>에어컨 8개월 · 일반 4개월 무상 A/S</span>
              </li>
              <li className="rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] px-3.5 py-2.5 font-semibold flex items-center gap-2">
                <Icon d={ICON.pin} className="w-4 h-4 text-[#1D4ED8] shrink-0" />
                <span>충청권 직영 설치 · 전국 화물 상담</span>
              </li>
              <li className="rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] px-3.5 py-2.5 font-semibold flex items-center gap-2">
                <Icon d={ICON.sparkles} className="w-4 h-4 text-[#141A23] shrink-0" />
                <span>전자세금계산서 · 카드 · 보상판매</span>
              </li>
            </ul>

            {recommendedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                {recommendedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-hb-sm text-[#334155]">
                  전시장 실시간 재고를 불러오거나 바로 상담을 원하시면 전체 매물 갤러리에서 최신 입고 제품을 확인하실 수 있습니다.
                </p>
                <Link
                  href={bridge.galleryHref}
                  className="hb-btn-primary min-h-[42px] px-4 py-2 text-hb-sm shrink-0"
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
