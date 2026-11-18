// 파일 경로: components/guide/guide-board-client.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  INFO_GUIDE_CATEGORY_LIST,
  LEGACY_GUIDE_CATEGORY_ALIASES,
  sortGuidesByPriority,
  type InfoGuideCategory,
  type InfoGuideFilterCategory,
  type GuideBoardSummaryItem,
} from "../../lib/guides/meta";
import {
  computeGuidePopularityScore,
  computeTopGuideRanks,
  type GuideStat,
  type GuideStatsMap,
  type GuideTopRank,
} from "../../lib/guide-stats";
import { STORE, telHref, trackEvent } from "../../lib/site";
import { ICON, Icon } from "../../lib/ui";
import { hasGuideInteractiveTool } from "../../lib/guides/tool-slugs";

type GuideSortMode = "recommended" | "popular";

const PAGE_SIZE = 12;

const CATEGORY_TEXT_CLASS_MAP: Record<InfoGuideCategory, string> = {
  "에어컨 · 냉난방": "text-[#1D4ED8]",
  "냉장고 · 세탁기": "text-[#0369A1]",
  "업소용 주방설비": "text-[#C84312]",
  "전기 · 시공 · 반입": "text-[#4338CA]",
  "구매 · 매입 · 창업": "text-[#0F766E]",
};

function parseInitialCategory(raw: string | null): InfoGuideFilterCategory {
  if (!raw) return "전체";
  if (
    INFO_GUIDE_CATEGORY_LIST.includes(
      raw as (typeof INFO_GUIDE_CATEGORY_LIST)[number],
    )
  ) {
    return raw as InfoGuideFilterCategory;
  }
  return LEGACY_GUIDE_CATEGORY_ALIASES[raw] ?? "전체";
}

function parseInitialSort(raw: string | null): GuideSortMode {
  return raw === "popular" ? "popular" : "recommended";
}

function parseInitialPage(raw: string | null): number {
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

function GuideRow({
  article,
  stat,
  topRank,
}: {
  article: GuideBoardSummaryItem;
  stat?: GuideStat;
  topRank?: GuideTopRank;
}) {
  const categoryTextClass = CATEGORY_TEXT_CLASS_MAP[article.category];
  const hasTool = hasGuideInteractiveTool(article.slug);
  const views = stat?.views ?? 0;
  const helpfulCount = stat?.helpfulCount ?? 0;

  return (
    <li>
      <Link
        href={`/guide/${article.slug}`}
        className="group flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 py-5 sm:py-6 px-1 -mx-1 rounded-xl transition-colors hover:bg-[#FAFBFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23]"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* 1줄 메타 라인: 알약 배지·빈 카운터(0) 없이 텍스트 구분으로 정돈 */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-hb-xs font-semibold text-[#64748B]">
            <span className={`font-bold ${categoryTextClass}`}>
              {article.category}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">약 {article.readMinutes}분</span>
            {hasTool && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#334155]">현장 계산기</span>
              </>
            )}
            {topRank && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-[#C84312]">
                  인기 {topRank}위
                </span>
              </>
            )}
            {helpfulCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums text-[#C84312]">
                  도움됨 {helpfulCount.toLocaleString("ko-KR")}
                </span>
              </>
            )}
            {views > 0 && helpfulCount === 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  조회 {views.toLocaleString("ko-KR")}
                </span>
              </>
            )}
          </div>

          {/* 2줄 제목: 크고 명료한 에디토리얼 헤드라인 */}
          <h3 className="text-hb-lg sm:text-hb-xl font-bold text-[#141A23] leading-[1.38] tracking-[-0.02em] break-keep [text-wrap:balance] transition-colors group-hover:text-[#C84312]">
            {article.title}
          </h3>

          {/* 3줄 요약: 65ch 최적 줄길이 + 넉넉한 행간 */}
          <p className="max-w-[65ch] text-hb-sm sm:text-hb-base text-[#475569] leading-[1.68] [text-wrap:pretty]">
            {article.summary}
          </p>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 pt-7 text-hb-xs font-bold text-[#64748B] shrink-0 transition-colors group-hover:text-[#C84312]">
          <span>읽어보기</span>
          <Icon
            d={ICON.right}
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </Link>
    </li>
  );
}

function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="정보 게시판 페이지 이동"
      className="pt-8 flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="이전 페이지"
        className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-[#E2E6EC] bg-white px-3.5 py-2 text-hb-xs sm:text-hb-sm font-semibold text-[#334155] transition-colors hover:border-[#141A23] hover:text-[#141A23] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon d={ICON.left} className="h-3.5 w-3.5" />
        <span>이전</span>
      </button>

      {pages.map((page) => {
        const isCurrent = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={isCurrent ? "page" : undefined}
            className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border px-2.5 py-2 text-hb-xs sm:text-hb-sm font-bold tabular-nums transition-colors ${
              isCurrent
                ? "border-[#141A23] bg-[#141A23] text-white"
                : "border-[#E2E6EC] bg-white text-[#475569] hover:border-[#141A23] hover:text-[#141A23]"
            }`}
          >
            {page}
            <span className="sr-only"> 페이지</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="다음 페이지"
        className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-[#E2E6EC] bg-white px-3.5 py-2 text-hb-xs sm:text-hb-sm font-semibold text-[#334155] transition-colors hover:border-[#141A23] hover:text-[#141A23] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span>다음</span>
        <Icon d={ICON.right} className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
}

export function GuideBoardClient({
  articles,
  initialStats = {},
}: {
  articles: readonly GuideBoardSummaryItem[];
  initialStats?: GuideStatsMap;
}) {
  const searchParams = useSearchParams();
  const [liveStats, setLiveStats] = useState<GuideStatsMap>(initialStats);
  const [sortMode, setSortMode] = useState<GuideSortMode>(() =>
    parseInitialSort(searchParams.get("sort")),
  );
  const [selectedCategory, setSelectedCategory] =
    useState<InfoGuideFilterCategory>(() =>
      parseInitialCategory(searchParams.get("category")),
    );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q")?.trim() ?? "",
  );
  const [currentPage, setCurrentPage] = useState(() =>
    parseInitialPage(searchParams.get("page")),
  );

  const listTopRef = useRef<HTMLElement | null>(null);
  const lastRefreshAtRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    const hasInitialStats = Object.keys(initialStats).length > 0;
    if (hasInitialStats && lastRefreshAtRef.current === 0) {
      lastRefreshAtRef.current = Date.now();
    }

    const refreshStats = async () => {
      const now = Date.now();
      if (now - lastRefreshAtRef.current < 15000) return;
      lastRefreshAtRef.current = now;
      try {
        const res = await fetch("/api/guides/engagement");
        if (!res.ok || !mounted) return;
        const data = (await res.json()) as { stats?: GuideStatsMap };
        if (data.stats && mounted) {
          setLiveStats(data.stats);
        }
      } catch {
        // 통계 새로고침 실패 시 서버 초기값 유지
      }
    };

    if (!hasInitialStats) {
      void refreshStats();
    }
    window.addEventListener("focus", refreshStats);
    return () => {
      mounted = false;
      window.removeEventListener("focus", refreshStats);
    };
  }, [initialStats]);

  const topRankMap = useMemo(
    () => computeTopGuideRanks(liveStats, 3),
    [liveStats],
  );

  const orderedArticles = useMemo(
    () => sortGuidesByPriority(articles),
    [articles],
  );

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(
      INFO_GUIDE_CATEGORY_LIST.map((category) => [category, 0]),
    ) as Record<InfoGuideFilterCategory, number>;
    counts["전체"] = orderedArticles.length;
    for (const item of orderedArticles) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [orderedArticles]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasNarrowingFilter =
    normalizedQuery.length > 0 || selectedCategory !== "전체";

  const topGuideEntries = useMemo(() => {
    const bySlug = new Map(orderedArticles.map((a) => [a.slug, a]));
    return (Object.entries(topRankMap) as [string, GuideTopRank][])
      .sort((a, b) => a[1] - b[1])
      .map(([slug, rank]) => {
        const article = bySlug.get(slug);
        if (!article) return null;
        return {
          rank,
          article,
          stat: liveStats[slug] ?? { slug, views: 0, helpfulCount: 0 },
        };
      })
      .filter(
        (
          entry,
        ): entry is {
          rank: GuideTopRank;
          article: GuideBoardSummaryItem;
          stat: GuideStat;
        } => entry !== null,
      );
  }, [orderedArticles, topRankMap, liveStats]);

  const filteredArticles = useMemo(() => {
    const matches = orderedArticles.filter((article) => {
      if (
        selectedCategory !== "전체" &&
        article.category !== selectedCategory
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      const haystack = `${article.title} ${article.summary} ${article.category} ${article.keywords.join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    if (sortMode === "recommended") {
      return matches;
    }

    return [...matches].sort((a, b) => {
      const statA = liveStats[a.slug];
      const statB = liveStats[b.slug];
      const scoreA = statA
        ? computeGuidePopularityScore(statA.views, statA.helpfulCount)
        : 0;
      const scoreB = statB
        ? computeGuidePopularityScore(statB.views, statB.helpfulCount)
        : 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const helpfulDiff = (statB?.helpfulCount ?? 0) - (statA?.helpfulCount ?? 0);
      if (helpfulDiff !== 0) return helpfulDiff;
      const viewsDiff = (statB?.views ?? 0) - (statA?.views ?? 0);
      if (viewsDiff !== 0) return viewsDiff;
      if (a.priorityTier !== b.priorityTier) {
        return a.priorityTier - b.priorityTier;
      }
      return a.priorityRank - b.priorityRank;
    });
  }, [
    orderedArticles,
    selectedCategory,
    normalizedQuery,
    sortMode,
    liveStats,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const pagedArticles = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return filteredArticles.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredArticles, safePage]);

  const rangeStart = filteredArticles.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(filteredArticles.length, safePage * PAGE_SIZE);

  const syncUrlParams = (
    nextCategory: InfoGuideFilterCategory,
    nextQuery: string,
    nextSort: GuideSortMode,
    nextPage: number,
  ) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("view");

    if (nextCategory === "전체") url.searchParams.delete("category");
    else url.searchParams.set("category", nextCategory);

    if (nextQuery.trim()) url.searchParams.set("q", nextQuery.trim());
    else url.searchParams.delete("q");

    if (nextSort === "recommended") url.searchParams.delete("sort");
    else url.searchParams.set("sort", nextSort);

    if (nextPage <= 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(nextPage));

    window.history.replaceState(null, "", url.toString());
  };

  const handleCategoryChange = (
    category: InfoGuideFilterCategory,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    event?.currentTarget.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
    syncUrlParams(category, searchQuery, sortMode, 1);
  };

  const handleSortChange = (nextSort: GuideSortMode) => {
    setSortMode(nextSort);
    setCurrentPage(1);
    syncUrlParams(selectedCategory, searchQuery, nextSort, 1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    syncUrlParams(selectedCategory, value, sortMode, 1);
  };

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, nextPage));
    if (clamped === safePage) return;
    setCurrentPage(clamped);
    syncUrlParams(selectedCategory, searchQuery, sortMode, clamped);

    const listEl = listTopRef.current;
    if (listEl) {
      const rect = listEl.getBoundingClientRect();
      if (rect.top < 84) {
        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        listEl.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "start",
        });
      }
    }
  };

  const resetAllFilters = () => {
    setSortMode("recommended");
    setSelectedCategory("전체");
    setSearchQuery("");
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/guide");
    }
  };

  const statusAnnouncement =
    filteredArticles.length === 0
      ? "조건에 맞는 정보 글이 없습니다."
      : `${sortMode === "popular" ? "인기순" : "추천순"}, 총 ${filteredArticles.length}편 중 ${rangeStart}부터 ${rangeEnd}번째 글 표시 중`;

  return (
    <div className="space-y-8">
      {/* 1. 간소화된 분류 밑줄 탭 + 검색·정렬 컨트롤 (중첩 카드·알약 배지 제거) */}
      <section aria-label="정보 게시판 검색 및 분류" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="text-hb-sm font-bold text-[#141A23] tabular-nums">
              {hasNarrowingFilter
                ? `검색 결과 ${filteredArticles.length}편`
                : `전체 ${filteredArticles.length}편`}
            </span>

            <div
              role="group"
              aria-label="정렬 방식"
              className="inline-flex items-center gap-1 rounded-lg bg-[#F1F5F9] p-1"
            >
              <button
                type="button"
                aria-pressed={sortMode === "recommended"}
                onClick={() => handleSortChange("recommended")}
                className={`rounded-md px-2.5 py-1 text-hb-xs font-bold transition-colors ${
                  sortMode === "recommended"
                    ? "bg-white text-[#141A23] shadow-2xs"
                    : "text-[#475569] hover:text-[#141A23]"
                }`}
              >
                추천순
              </button>
              <button
                type="button"
                aria-pressed={sortMode === "popular"}
                onClick={() => handleSortChange("popular")}
                className={`rounded-md px-2.5 py-1 text-hb-xs font-bold transition-colors ${
                  sortMode === "popular"
                    ? "bg-white text-[#C84312] shadow-2xs"
                    : "text-[#475569] hover:text-[#141A23]"
                }`}
              >
                인기순
              </button>
            </div>
          </div>

          <div className="w-full sm:w-80">
            <label htmlFor="guide-search" className="sr-only">
              가전 정보 검색
            </label>
            <div className="relative">
              <Icon
                d={ICON.search}
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
              />
              <input
                id="guide-search"
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="제목·증상 검색 (예: 동배관, 매입, 220V)"
                className="hb-input h-10 pl-10 pr-9 text-hb-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#141A23]"
                  aria-label="검색어 지우기"
                >
                  <Icon d={ICON.close} className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 5개 핵심 소분류 + 전체: 밑줄 인디케이터 탭 바 */}
        <div
          role="group"
          aria-label="주제별 분류"
          className="hb-hscroll-fade flex flex-nowrap items-center gap-5 sm:gap-7 overflow-x-auto scrollbar-none border-b border-[#E2E6EC] pr-6"
        >
          {INFO_GUIDE_CATEGORY_LIST.map((category) => {
            const isActive = selectedCategory === category;
            const count = categoryCounts[category] ?? 0;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={isActive}
                onClick={(e) => handleCategoryChange(category, e)}
                className={`relative shrink-0 whitespace-nowrap pb-3 pt-1 text-hb-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:border-b-2 ${
                  isActive
                    ? "text-[#141A23] after:border-[#C84312]"
                    : "text-[#475569] hover:text-[#141A23] after:border-transparent"
                }`}
              >
                <span>{category}</span>
                <span
                  className={`ml-1.5 text-hb-xs tabular-nums ${
                    isActive ? "text-[#C84312]" : "text-[#526071]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {(hasNarrowingFilter || sortMode !== "recommended") && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-hb-xs text-[#475569]">
            <span>
              <strong className="font-bold text-[#141A23] tabular-nums">
                {filteredArticles.length}편
              </strong>
              {sortMode === "popular" && " · 인기순 정렬"}
              {selectedCategory !== "전체" && ` · ${selectedCategory}`}
              {normalizedQuery && (
                <>
                  {" "}
                  · &ldquo;
                  <strong className="text-[#141A23]">
                    {searchQuery.trim()}
                  </strong>
                  &rdquo;
                </>
              )}
            </span>
            <button
              type="button"
              onClick={resetAllFilters}
              className="font-semibold text-[#C84312] hover:underline"
            >
              필터 초기화
            </button>
          </div>
        )}
      </section>

      <p role="status" className="sr-only">
        {statusAnnouncement}
      </p>

      {/* 2. 많이 본 글 TOP 3 (카드 속 카드 없이 번호 에디토리얼 스트립으로 노출) */}
      {topGuideEntries.length > 0 &&
        !hasNarrowingFilter &&
        sortMode === "recommended" &&
        safePage === 1 && (
          <section
            aria-labelledby="guide-top3-heading"
            className="border-l-4 border-[#E8521A] bg-[#FAFBFD] px-4 sm:px-6 py-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="guide-top3-heading"
                className="text-hb-xs sm:text-hb-sm font-bold text-[#C84312]"
              >
                지금 많이 찾는 현장 가이드 TOP {topGuideEntries.length}
              </h2>
              <button
                type="button"
                onClick={() => handleSortChange("popular")}
                className="text-hb-xs font-semibold text-[#475569] hover:text-[#141A23] underline underline-offset-2"
              >
                인기순 전체 보기
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:divide-x md:divide-[#E2E6EC]">
              {topGuideEntries.map(({ rank, article }) => (
                <Link
                  key={article.slug}
                  href={`/guide/${article.slug}`}
                  className="group block md:first:pl-0 md:pl-4 space-y-1"
                >
                  <p className="text-hb-xs font-bold text-[#64748B] tabular-nums">
                    0{rank} · {article.category}
                  </p>
                  <p className="text-hb-sm sm:text-hb-base font-bold text-[#141A23] leading-snug break-keep group-hover:text-[#C84312] transition-colors">
                    {article.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

      {/* 3. 에디토리얼 글 목록 (1컬럼 헤어라인 피드 · 페이지당 12편) */}
      <section
        id="guide-board-list"
        ref={listTopRef}
        aria-label="정보 글 목록"
        className="scroll-mt-24"
      >
        {filteredArticles.length === 0 ? (
          <div className="border-y border-[#E2E6EC] py-14 text-center space-y-3">
            <p className="text-hb-lg font-bold text-[#141A23]">
              조건에 맞는 정보 글이 없습니다.
            </p>
            <p className="text-hb-sm text-[#475569]">
              검색어나 선택하신 분류를 초기화하면 전체 글을 다시 볼 수 있습니다.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-2 hb-btn-primary px-5 py-2.5 text-hb-sm"
            >
              전체 글 보기
            </button>
          </div>
        ) : (
          <>
            {totalPages > 1 && (
              <div className="mb-2 flex items-center justify-between text-hb-xs text-[#64748B] tabular-nums">
                <span>
                  {filteredArticles.length}편 중 {rangeStart}–{rangeEnd}번째 글
                </span>
                <span>
                  {safePage} / {totalPages} 페이지
                </span>
              </div>
            )}

            <ul className="divide-y divide-[#E2E6EC] border-t border-b border-[#E2E6EC]">
              {pagedArticles.map((article) => (
                <GuideRow
                  key={article.slug}
                  article={article}
                  stat={liveStats[article.slug]}
                  topRank={topRankMap[article.slug]}
                />
              ))}
            </ul>

            <PaginationBar
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>

      {/* 4. 하단 상담 연결 밴드 */}
      <div className="border-t border-[#E2E6EC] pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-hb-xs font-bold text-[#C84312]">
            글로 판단하기 어려운 현장 조건이라면
          </p>
          <h2 className="text-hb-lg font-bold text-[#141A23] [text-wrap:balance]">
            설치 현장·분전함 사진 한 장으로 바로 확인해 드립니다
          </h2>
          <p className="text-hb-sm text-[#475569]">
            제품 모델명이나 매장 사진을 보내주시면 {STORE.name} 담당자가 직접 안내합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href={telHref(STORE.tel)}
            onClick={() =>
              trackEvent("click_tel_consult", { location: "guide_board" })
            }
            className="hb-btn-primary px-4 py-2.5 text-hb-sm"
          >
            <Icon d={ICON.phone} className="w-4 h-4" />
            <span>전화 {STORE.tel}</span>
          </a>
          <Link href="/purchase" className="hb-btn-outline px-4 py-2.5 text-hb-sm">
            매입 견적 신청
          </Link>
        </div>
      </div>
    </div>
  );
}
