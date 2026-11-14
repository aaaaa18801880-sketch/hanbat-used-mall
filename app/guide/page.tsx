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
  title: "가전 · 전기 · 설치 정보 게시판 (220V·380V, 사다리차, 창·폐업 가이드)",
  description:
    "신형 에어컨 수리가 오래 걸리는 이유, 단상 220V와 삼상 380V 차이, 식당·카페 창·폐업 서류와 필요 전기 용량(kW), 한전 승압, 사다리차·출입구 실측 기준까지 현장 기사가 알기 쉽게 정리한 정보 게시판입니다.",
  keywords: [
    "220V 380V 차이",
    "대형 에어컨 삼상 전기",
    "식당 창업 전기 용량",
    "한전 승압 증설 비용",
    "사다리차 호출 기준",
    "신형 에어컨 수리 기간",
    "대전 중고가전 정보",
    "한밭중고전자 정보 게시판",
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
      "에어컨 수리·220V/380V 전기·한전 승압·창폐업 서류·사다리차 실측·중고가전 구매 요령까지 소비자에게 꼭 필요한 실전 정보를 모았습니다.",
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
  const operatingYears = new Date().getFullYear() - STORE.since;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `가전 · 전기 · 설치 정보 게시판 | ${STORE.name}`,
        description:
          "대전 한밭중고전자 현장 경험으로 정리한 에어컨 A/S, 220V/380V 전기, 한전 승압, 창·폐업 서류, 사다리차 실측 가이드",
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
              <div className="space-y-2.5">
                <p className="hb-eyebrow">
                  {STORE.since}년 개업 ({operatingYears}년차 현장 실무) · 소비자 가이드
                </p>
                <h1 className="hb-fluid-h1 text-[#141A23]">
                  가전 · 전기 · 설치 정보 게시판
                </h1>
                <p className="max-w-[68ch] text-hb-sm sm:text-hb-base text-[#475569] leading-[1.65] [text-wrap:pretty]">
                  에어컨 수리가 오래 걸리는 이유, 220V와 380V 삼상 전기 차이, 창·폐업 서류와 필요 전력 계산, 한전 승압, 사다리차와 문폭 실측까지 배송·설치 현장에서 직접 겪은 실전 기준을 정리해 드립니다.
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
