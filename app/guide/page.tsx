// 파일 경로: app/guide/page.tsx
import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { STORE } from "../../lib/site";
import { INFO_GUIDE_ARTICLES } from "../../lib/info-guides";
import { serializeJsonLd } from "../../lib/json-ld";
import {
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
  Icon,
  ICON,
} from "../../lib/ui";
import { GuideBoardClient } from "../../components/guide/guide-board-client";

export const metadata: Metadata = {
  title: "가전 · 전기 · 설치 정보 게시판",
  description:
    "에어컨 설치·고장 원인, 220V·380V 전기 구분, 창·폐업 준비와 사다리차·가전 관리 기준을 매장 현장 경험으로 정리한 게시판입니다.",
  keywords: [
    "한밭중고전자 정보 게시판",
    "에어컨 설치 고장 정보",
    "220V 380V 차이",
    "사다리차 출입구 실측",
    "업소용 냉장고 제빙기 관리",
  ],
  alternates: {
    canonical: `${STORE.url}/guide`,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${STORE.url}/guide`,
    siteName: STORE.name,
    title: `가전 · 전기 · 설치 정보 게시판 | ${STORE.name}`,
    description:
      "에어컨·냉장고·세탁기·업소용 주방설비를 들이거나 수리하기 전 확인해 두면 좋은 현장 기준을 모았습니다.",
    images: [
      {
        url: `${STORE.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${STORE.name} 가전·전기 정보 게시판`,
      },
    ],
  },
};

function GuideBoardStaticFallback() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white shadow-2xs">
      <ul className="divide-y divide-[#E2E6EC]">
        {INFO_GUIDE_ARTICLES.map((article) => (
          <li key={article.slug} className="px-4 py-4 sm:px-5">
            <Link
              href={`/guide/${article.slug}`}
              className="block hover:text-[#E8521A]"
            >
              <span className="text-hb-xs font-bold text-[#64748B]">
                [{article.category}]
              </span>
              <h3 className="mt-1 text-hb-base font-bold text-[#141A23]">
                {article.title}
              </h3>
              <p className="mt-1 text-hb-sm text-[#475569]">{article.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function GuideBoardPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `가전 · 전기 · 설치 정보 게시판 | ${STORE.name}`,
        description:
          "대전 한밭중고전자 매장에서 직접 설치·점검하며 정리한 에어컨 A/S, 전기 용량, 사다리차, 가전 관리 안내",
        url: `${STORE.url}/guide`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: INFO_GUIDE_ARTICLES.length,
          itemListElement: INFO_GUIDE_ARTICLES.map((article, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: article.title,
            url: `${STORE.url}/guide/${article.slug}`,
          })),
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

        {/* 상단 헤더 밴드 */}
        <section className="border-b border-[#E2E6EC] bg-white">
          <div className="hb-container py-7 sm:py-10">
            <nav
              aria-label="페이지 경로"
              className="flex items-center gap-1.5 text-hb-xs font-medium text-[#64748B] mb-3"
            >
              <Link href="/" className="hover:text-[#141A23] transition-colors">
                홈
              </Link>
              <Icon d={ICON.right} className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="font-bold text-[#141A23]" aria-current="page">
                정보 게시판
              </span>
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="hb-eyebrow">{STORE.name} 현장 메모</p>
                <h1 className="hb-fluid-h1 text-[#141A23]">
                  가전 · 전기 · 설치 정보 게시판
                </h1>
                <p className="max-w-[64ch] text-hb-sm sm:text-hb-base text-[#475569] leading-[1.65] [text-wrap:pretty]">
                  매장에서 직접 설치하고 수리하며 손님들이 가장 자주 물어보는 내용들을 모았습니다. 구매나 설치 전에 전기·공간 조건을 가늠할 때 참고해 보세요.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href="/gallery"
                  className="hb-btn-outline min-h-[42px] px-4 py-2 text-hb-xs sm:text-hb-sm"
                >
                  <span>판매 제품 보기</span>
                </Link>
                <Link
                  href="/inquiry?write=1"
                  className="hb-btn-primary min-h-[42px] px-4 py-2 text-hb-xs sm:text-hb-sm"
                >
                  <span>직접 문의하기</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 게시판 본문 */}
        <div className="hb-container pt-6 sm:pt-8">
          <Suspense fallback={<GuideBoardStaticFallback />}>
            <GuideBoardClient articles={INFO_GUIDE_ARTICLES} />
          </Suspense>
        </div>
      </main>

      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
