// 파일 경로: components/home/home-guide-showcase.tsx
"use client";

import React from "react";
import Link from "next/link";
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

  const compactGuides = guides.slice(0, 3);

  return (
    <section
      id="home-guide-section"
      aria-labelledby="home-guide-heading"
      className="hb-section-deferred-compact border-b border-[#E2DDD3] bg-[#FAF9F6] py-10 sm:py-14"
    >
      <div className="hb-container">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="hb-eyebrow">
              가전 · 전기 · 설치 현장 백과 ({totalCount}편)
            </span>
            <h2
              id="home-guide-heading"
              className="mt-1 text-hb-xl sm:text-hb-2xl font-bold tracking-[-0.026em] text-[#141A23] break-keep [text-wrap:balance]"
            >
              구매·창업 전 꼭 확인하는 실전 가이드
            </h2>
          </div>

          <Link
            href="/guide"
            onClick={() =>
              trackEvent("click_guide_tool_action", {
                location: "home_guide_showcase_all",
              })
            }
            className="hb-btn-primary min-h-[44px] h-11 px-4 text-hb-xs sm:text-hb-sm font-bold shrink-0 self-start sm:self-auto whitespace-nowrap"
          >
            <span>정보 게시판 전체 보기 ({totalCount}편)</span>
            <Icon d={ICON.arrow} className="h-4 w-4 text-[#FF8A50]" />
          </Link>
        </div>

        {/* 5대 주제 빠른 탐색 가로 레일 */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto scrollbar-none sm:flex-wrap pb-0.5">
          {QUICK_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/guide?category=${encodeURIComponent(category)}`}
              className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-xl border border-[#E2DDD3] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#334155] hover:border-[#141A23] hover:bg-[#141A23] hover:text-white transition-colors whitespace-nowrap"
            >
              <span>{category}</span>
              <Icon d={ICON.right} className="h-3 w-3 opacity-70" />
            </Link>
          ))}
        </div>

        {/* 3열 텍스트 우선 컴팩트 요약 카드 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {compactGuides.map((article) => (
            <Link
              key={article.slug}
              href={`/guide/${article.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-[#E2DDD3] bg-white p-4 sm:p-5 shadow-2xs hover:border-[#141A23] hover:shadow-card transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5"
            >
              <div>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-hb-xs font-semibold text-[#64748B]">
                  <span className="text-[#C84312] font-bold">{article.category}</span>
                  {article.hasTool && (
                    <>
                      <span className="text-[#CFC7BA]" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-bold text-[#0F766E]">
                        계산기 포함
                      </span>
                    </>
                  )}
                </div>
                <h3 className="mt-1.5 text-hb-base font-bold text-[#141A23] group-hover:text-[#C84312] transition-colors leading-snug line-clamp-2 break-keep">
                  {article.title}
                </h3>
                <p className="mt-1.5 text-hb-xs text-[#475569] leading-relaxed line-clamp-2 break-keep">
                  {article.summary}
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-[#E2DDD3] flex items-center justify-between text-hb-xs">
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
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
