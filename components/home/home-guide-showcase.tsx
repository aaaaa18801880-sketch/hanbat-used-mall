// 파일 경로: components/home/home-guide-showcase.tsx
"use client";

import React from "react";
import Link from "next/link";
import { GuideThumbnailImage } from "../guide/guide-thumbnail-image";
import { Icon, ICON } from "../../lib/icons";
import { INFO_GUIDE_CATEGORY_LIST } from "../../lib/guides/types";
import { trackEvent } from "../../lib/site";

export interface HomeGuidePreviewItem {
  slug: string;
  category: string;
  title: string;
  summary: string;
  readMinutes: number;
  priorityRole?: string;
  heroImageSrc?: string | null;
  heroImageAlt?: string;
  hasTool?: boolean;
}

const QUICK_CATEGORIES = INFO_GUIDE_CATEGORY_LIST.filter((c) => c !== "전체");

export function HomeGuideShowcase({
  guides,
  totalCount,
}: {
  guides: HomeGuidePreviewItem[];
  totalCount: number;
}) {
  if (!guides || guides.length === 0) return null;

  const [featured, ...rest] = guides;
  const secondaryCards = rest.slice(0, 4);

  return (
    <section
      id="home-guide-section"
      aria-labelledby="home-guide-heading"
      className="border-b border-[#E2DDD3] bg-[#FAF9F6] py-7 sm:py-9"
    >
      <div className="hb-container">
        {/* 상단 에디토리얼 헤더 */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span className="hb-eyebrow">
              가전 · 전기 · 설치 현장 백과 ({totalCount}편)
            </span>
            <h2
              id="home-guide-heading"
              className="mt-1.5 text-hb-xl sm:text-hb-2xl font-bold tracking-[-0.026em] text-[#141A23] break-keep [text-wrap:balance]"
            >
              모르고 진행하면 손해 보는 설치·전기·고장 실전 가이드
            </h2>
            <p className="mt-1.5 max-w-2xl text-hb-sm text-[#475569] leading-relaxed break-keep [text-wrap:pretty]">
              사다리차·문폭 실측 기준, 220V/380V 매장 전기 계산법, 에너지 등급 오해까지 구매·창업 전 꼭 필요한 현장 정보를 모았습니다.
            </p>
          </div>

          <Link
            href="/guide"
            onClick={() =>
              trackEvent("click_guide_tool_action", {
                location: "home_guide_showcase_all",
              })
            }
            className="hb-btn-primary min-h-[44px] h-11 px-5 text-hb-sm font-bold shrink-0 self-start lg:self-auto whitespace-nowrap"
          >
            <span>정보 게시판 전체 보기 ({totalCount}편)</span>
            <Icon d={ICON.arrow} className="h-4 w-4 text-[#FF8A50]" />
          </Link>
        </div>

        {/* 5대 주제 빠른 탐색 바 */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {QUICK_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/guide?category=${encodeURIComponent(category)}`}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-white px-3.5 py-1.5 text-hb-xs font-bold text-[#334155] hover:border-[#141A23] hover:bg-[#141A23] hover:text-white transition-colors"
            >
              <span>{category}</span>
              <Icon d={ICON.right} className="h-3 w-3 opacity-70" />
            </Link>
          ))}
        </div>

        {/* 비대칭 에디토리얼 12열 벤토 그리드 (좌 5열 대표 가이드 + 우 7열 2×2 비주얼 카드) */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* 좌측 대표 가이드 카드 */}
          <Link
            href={`/guide/${featured.slug}`}
            className="group lg:col-span-5 flex flex-col overflow-hidden rounded-2xl border border-[#E2DDD3] bg-white shadow-2xs hover:border-[#141A23] hover:shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFECE4]">
              {featured.heroImageSrc && (
                <GuideThumbnailImage
                  src={featured.heroImageSrc}
                  alt={featured.heroImageAlt || featured.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  baseQuality={85}
                  className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
                />
              )}
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141A23]/85 via-[#141A23]/25 to-transparent"
                aria-hidden="true"
              />

              <div className="absolute top-3.5 left-3.5 z-10 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-[#E8521A] px-2.5 py-1 text-hb-xs font-bold text-white shadow-xs">
                  추천 필독
                </span>
                {featured.hasTool && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#141A23]/90 border border-white/20 px-2.5 py-1 text-hb-xs font-bold text-[#5EEAD4] backdrop-blur-md">
                    <Icon d={ICON.sparkles} className="h-3 w-3" />
                    <span>계산기 포함</span>
                  </span>
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 text-white">
                <span className="text-hb-xs font-semibold text-white/80">
                  {featured.category} · {featured.readMinutes}분 읽기
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
              <div>
                <h3 className="text-hb-lg sm:text-hb-xl font-bold text-[#141A23] group-hover:text-[#C84312] transition-colors leading-snug break-keep [text-wrap:balance]">
                  {featured.title}
                </h3>
                <p className="mt-2.5 text-hb-sm text-[#475569] leading-relaxed line-clamp-3 break-keep">
                  {featured.summary}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#E2DDD3] flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-hb-sm font-bold text-[#141A23] group-hover:text-[#C84312] transition-colors">
                  <span>
                    {featured.hasTool
                      ? "가이드 읽고 바로 계산하기"
                      : "자세히 읽어보기"}
                  </span>
                  <Icon
                    d={ICON.arrow}
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
                {featured.priorityRole && (
                  <span className="text-hb-xs font-semibold text-[#64748B]">
                    {featured.priorityRole}
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* 우측 2×2 비주얼 카드 그리드 */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {secondaryCards.map((article) => (
              <Link
                key={article.slug}
                href={`/guide/${article.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2DDD3] bg-white shadow-2xs hover:border-[#141A23] hover:shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#EFECE4]">
                  {article.heroImageSrc && (
                    <GuideThumbnailImage
                      src={article.heroImageSrc}
                      alt={article.heroImageAlt || article.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 28vw"
                      baseQuality={80}
                      className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-hb-xs font-semibold text-[#64748B]">
                      <span>{article.category}</span>
                      {article.hasTool && (
                        <>
                          <span className="text-[#CBD2DC]" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-bold text-[#0F766E]">
                            계산기 포함
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-1 text-hb-sm sm:text-hb-base font-bold text-[#141A23] group-hover:text-[#C84312] transition-colors leading-snug line-clamp-2 break-keep">
                      {article.title}
                    </h3>
                    <p className="mt-1 text-hb-xs text-[#475569] leading-relaxed line-clamp-2 break-keep">
                      {article.summary}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#E2DDD3] flex items-center justify-between text-hb-xs">
                    <span className="font-mono font-semibold text-[#64748B] tabular-nums">
                      {article.readMinutes}분 읽기
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#141A23] group-hover:text-[#C84312] transition-colors">
                      <span>읽어보기</span>
                      <Icon
                        d={ICON.right}
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
