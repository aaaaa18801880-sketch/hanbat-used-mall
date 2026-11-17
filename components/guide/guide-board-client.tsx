// 파일 경로: components/guide/guide-board-client.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  INFO_GUIDE_CATEGORY_LIST,
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

const PAGE_SIZE = 16;
const ABOVE_FOLD_CARD_COUNT = 8;

const CATEGORY_BADGE_CLASS_MAP: Record<InfoGuideCategory, string> = {
  "에어컨 · A/S": "bg-[#F8FAFC] text-[#B45309] border-[#E2E8F0]",
  "에어컨 · 원리/설치": "bg-[#F8FAFC] text-[#1D4ED8] border-[#E2E8F0]",
  "냉장고 · 세탁기": "bg-[#F8FAFC] text-[#0369A1] border-[#E2E8F0]",
  "업소용 주방설비": "bg-[#F8FAFC] text-[#C2410C] border-[#E2E8F0]",
  "전기 · 220V/380V": "bg-[#F8FAFC] text-[#4F46E5] border-[#E2E8F0]",
  "창업 · 폐업": "bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]",
  "배송 · 사다리차": "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]",
  "중고 구매 팁": "bg-[#F8FAFC] text-[#047857] border-[#E2E8F0]",
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
  return "전체";
}

function parseInitialSort(raw: string | null): GuideSortMode {
  return raw === "popular" ? "popular" : "recommended";
}

function parseInitialPage(raw: string | null): number {
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

function GuideAssetChips({
  article,
}: {
  article: GuideBoardSummaryItem;
}) {
  const hasTool = hasGuideInteractiveTool(article.slug);
  const { hasTable, hasDiagram } = article;

  if (!hasTool && !hasTable && !hasDiagram) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {hasTool && (
        <span className="inline-flex items-center rounded bg-[#EFF6FF] px-1.5 py-0.5 text-hb-xs font-semibold text-[#1D4ED8]">
          계산기
        </span>
      )}
      {hasTable && (
        <span className="inline-flex items-center rounded bg-[#F1F5F9] px-1.5 py-0.5 text-hb-xs font-medium text-[#475569]">
          비교표
        </span>
      )}
      {hasDiagram && (
        <span className="inline-flex items-center rounded bg-[#F1F5F9] px-1.5 py-0.5 text-hb-xs font-medium text-[#475569]">
          도해
        </span>
      )}
    </div>
  );
}

function GuideCard({
  article,
  stat,
  topRank,
  deferRender,
}: {
  article: GuideBoardSummaryItem;
  stat?: GuideStat;
  topRank?: GuideTopRank;
  deferRender: boolean;
}) {
  const categoryBadgeClass = CATEGORY_BADGE_CLASS_MAP[article.category];
  const views = stat?.views ?? 0;
  const helpfulCount = stat?.helpfulCount ?? 0;

  return (
    <li className={deferRender ? "hb-guide-deferred-card" : undefined}>
      <Link
        href={`/guide/${article.slug}`}
        className="group flex h-full flex-col justify-between rounded-xl border border-[#E2E6EC] bg-white p-4 transition-colors hover:border-[#E8521A]/70 hover:bg-[#FFFCFA]"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-hb-xs font-semibold ${categoryBadgeClass}`}
              >
                {article.category}
              </span>
              {topRank && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-hb-xs font-bold ${
                    topRank === 1
                      ? "bg-[#E8521A] text-white"
                      : "border border-[#FDBA74] bg-[#FFF3EC] text-[#C2410C]"
                  }`}
                >
                  인기 TOP {topRank}
                </span>
              )}
            </div>
            <span className="shrink-0 text-hb-xs tabular-nums text-[#64748B]">
              {article.readMinutes}분
            </span>
          </div>

          <h3 className="mt-2.5 line-clamp-2 text-hb-sm sm:text-hb-base font-bold leading-snug text-[#141A23] transition-colors group-hover:text-[#E8521A]">
            {article.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-hb-xs sm:text-hb-sm leading-relaxed text-[#475569]">
            {article.summary}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9] pt-2.5">
          <GuideAssetChips article={article} />
          <div className="ml-auto flex items-center gap-2.5 text-hb-xs tabular-nums text-[#64748B]">
            <span className="inline-flex items-center gap-1" title="조회수">
              <Icon d={ICON.eye} className="h-3.5 w-3.5 text-[#94A3B8]" />
              {views.toLocaleString("ko-KR")}
            </span>
            <span
              className={`inline-flex items-center gap-1 ${
                helpfulCount > 0 ? "font-semibold text-[#C2410C]" : ""
              }`}
              title="도움됐어요"
            >
              <Icon
                d={ICON.thumbUp}
                className={`h-3.5 w-3.5 ${
                  helpfulCount > 0 ? "text-[#E8521A]" : "text-[#94A3B8]"
                }`}
              />
              {helpfulCount.toLocaleString("ko-KR")}
            </span>
          </div>
        </div>
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
      className="mt-5 flex flex-wrap items-center justify-center gap-1.5 border-t border-[#F1F5F9] pt-5"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="이전 페이지"
        className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[#E2E6EC] bg-white px-3 py-1.5 text-hb-xs sm:text-hb-sm font-semibold text-[#334155] transition-colors hover:border-[#CBD5E1] hover:text-[#141A23] disabled:cursor-not-allowed disabled:opacity-40"
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
            aria-label={`${page}페이지`}
            className={`inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border px-2.5 py-1.5 text-hb-xs sm:text-hb-sm font-bold tabular-nums transition-colors ${
              isCurrent
                ? "border-[#141A23] bg-[#141A23] text-white"
                : "border-[#E2E6EC] bg-white text-[#475569] hover:border-[#CBD5E1] hover:text-[#141A23]"
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="다음 페이지"
        className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[#E2E6EC] bg-white px-3 py-1.5 text-hb-xs sm:text-hb-sm font-semibold text-[#334155] transition-colors hover:border-[#CBD5E1] hover:text-[#141A23] disabled:cursor-not-allowed disabled:opacity-40"
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

  // 내부 우선순위 기준으로 정렬된 전체 글 (매입·구매·설치 글이 자연스럽게 앞쪽에 배치됨)
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
    <div className="space-y-5">
      {/* 1. 검색 · 정렬 · 품목 분류 바 */}
      <section
        aria-label="정보 게시판 검색 및 분류"
        className="rounded-2xl border border-[#E2E6EC] bg-white p-4 sm:p-5 shadow-2xs"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-hb-sm font-bold text-[#141A23] tabular-nums">
              {hasNarrowingFilter
                ? `검색 결과 ${filteredArticles.length}편`
                : `전체 ${filteredArticles.length}편`}
            </span>

            <div
              role="group"
              aria-label="정렬 방식"
              className="inline-flex rounded-lg border border-[#E2E6EC] bg-[#F8FAFC] p-0.5"
            >
              <button
                type="button"
                aria-pressed={sortMode === "recommended"}
                onClick={() => handleSortChange("recommended")}
                className={`rounded-md px-2.5 py-1 text-hb-xs font-bold transition-colors ${
                  sortMode === "recommended"
                    ? "bg-white text-[#141A23] shadow-2xs"
                    : "text-[#64748B] hover:text-[#141A23]"
                }`}
              >
                추천순
              </button>
              <button
                type="button"
                aria-pressed={sortMode === "popular"}
                onClick={() => handleSortChange("popular")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-hb-xs font-bold transition-colors ${
                  sortMode === "popular"
                    ? "bg-[#FFF3EC] text-[#C2410C] shadow-2xs"
                    : "text-[#64748B] hover:text-[#141A23]"
                }`}
              >
                <Icon d={ICON.trendingUp} className="h-3.5 w-3.5" />
                인기순
              </button>
            </div>
          </div>

          <div className="w-full sm:w-72 md:w-80">
            <label htmlFor="guide-search" className="sr-only">
              가전 정보 검색
            </label>
            <div className="relative">
              <Icon
                d={ICON.search}
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
              />
              <input
                id="guide-search"
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="제목·증상 검색 (예: 매입, 평수, 220V)"
                className="hb-input py-2 pl-9 pr-9 text-hb-sm"
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

        {/* 품목·주제별 분류 칩 */}
        <div className="mt-3.5 border-t border-[#F1F5F9] pt-3">
          <div
            role="group"
            aria-label="가전 품목 및 주제별 분류"
            className="hb-hscroll-fade flex flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 pr-6"
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
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-hb-xs font-semibold transition-colors ${
                    isActive
                      ? "border-[#E8521A] bg-[#FFF5F0] text-[#C2410C]"
                      : "border-[#E2E6EC] bg-[#F8FAFC] text-[#475569] hover:bg-white hover:text-[#141A23]"
                  }`}
                >
                  <span>{category}</span>
                  <span className="ml-1 opacity-75 tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {(hasNarrowingFilter || sortMode !== "recommended") && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F8FAFC] px-3.5 py-2 text-hb-xs text-[#475569]">
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
              className="font-semibold text-[#C2410C] hover:underline"
            >
              전체 보기
            </button>
          </div>
        )}
      </section>

      <p role="status" className="sr-only">
        {statusAnnouncement}
      </p>

      {/* 2. 실시간 인기 TOP 3 (조회수·도움됐어요 집계가 있을 때만 노출) */}
      {topGuideEntries.length > 0 &&
        !hasNarrowingFilter &&
        sortMode === "recommended" &&
        safePage === 1 && (
          <section
            aria-labelledby="guide-top3-heading"
            className="rounded-2xl border border-[#E2E6EC] bg-white p-4 shadow-2xs"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2
                id="guide-top3-heading"
                className="flex items-center gap-1.5 text-hb-sm sm:text-hb-base font-extrabold text-[#141A23]"
              >
                <Icon d={ICON.trendingUp} className="h-4 w-4 text-[#E8521A]" />
                <span>많이 본 글 TOP {topGuideEntries.length}</span>
              </h2>
              <button
                type="button"
                onClick={() => handleSortChange("popular")}
                className="text-hb-xs font-semibold text-[#C2410C] hover:underline"
              >
                인기순으로 보기
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {topGuideEntries.map(({ rank, article, stat }) => (
                <Link
                  key={article.slug}
                  href={`/guide/${article.slug}`}
                  className="group flex flex-col justify-between rounded-xl border border-[#E2E6EC] bg-[#F8FAFC]/60 p-3 transition-colors hover:border-[#E8521A]/70 hover:bg-white"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-hb-xs font-bold ${
                          rank === 1
                            ? "bg-[#E8521A] text-white"
                            : "border border-[#FDBA74] bg-[#FFF3EC] text-[#C2410C]"
                        }`}
                      >
                        인기 TOP {rank}
                      </span>
                      <span className="text-hb-xs text-[#64748B]">
                        {article.category}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-hb-xs sm:text-hb-sm font-bold text-[#141A23] transition-colors group-hover:text-[#E8521A]">
                      {article.title}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-hb-xs tabular-nums text-[#64748B]">
                    <span className="inline-flex items-center gap-1">
                      <Icon d={ICON.eye} className="h-3.5 w-3.5 text-[#94A3B8]" />
                      {stat.views.toLocaleString("ko-KR")}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#C2410C]">
                      <Icon
                        d={ICON.thumbUp}
                        className="h-3.5 w-3.5 text-[#E8521A]"
                      />
                      {stat.helpfulCount.toLocaleString("ko-KR")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      {/* 3. 통합 정보 글 목록 + 페이지네이션 */}
      <section
        id="guide-board-list"
        ref={listTopRef}
        aria-label="정보 글 목록"
        className="scroll-mt-24 rounded-2xl border border-[#E2E6EC] bg-white p-4 sm:p-5 shadow-2xs"
      >
        {filteredArticles.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-hb-base font-bold text-[#141A23]">
              조건에 맞는 정보 글이 없습니다.
            </p>
            <p className="mt-1.5 text-hb-sm text-[#475569]">
              검색어나 선택하신 분류를 초기화하면 전체 글을 다시 볼 수 있습니다.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#141A23] px-4 py-2 text-hb-sm font-bold text-white hover:bg-[#1E293B]"
            >
              전체 글 보기
            </button>
          </div>
        ) : (
          <>
            {totalPages > 1 && (
              <div className="mb-3.5 flex items-center justify-between text-hb-xs text-[#64748B] tabular-nums">
                <span>
                  {filteredArticles.length}편 중 {rangeStart}–{rangeEnd}번째 글
                </span>
                <span>
                  {safePage} / {totalPages} 페이지
                </span>
              </div>
            )}

            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {pagedArticles.map((article, idx) => (
                <GuideCard
                  key={article.slug}
                  article={article}
                  stat={liveStats[article.slug]}
                  topRank={topRankMap[article.slug]}
                  deferRender={idx >= ABOVE_FOLD_CARD_COUNT}
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

      {/* 4. 하단 상담 안내 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#E2E6EC] bg-[#F8FAFC] p-5 sm:p-6">
        <div>
          <p className="text-hb-xs font-bold tracking-wider text-[#E8521A]">
            찾는 내용이 없거나 현장 확인이 필요할 때
          </p>
          <h2 className="mt-1 text-hb-base sm:text-hb-lg font-extrabold text-[#141A23]">
            설치 환경·매입 견적은 사진 한 장으로도 바로 상담 가능합니다
          </h2>
          <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#475569]">
            제품 모델명·배전반(차단기) 또는 매장 사진을 보내주시면{" "}
            {STORE.name} 담당자가 직접 안내해 드립니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href={telHref(STORE.tel)}
            onClick={() =>
              trackEvent("click_tel_consult", { location: "guide_board" })
            }
            className="hb-btn-primary text-hb-sm"
          >
            <Icon d={ICON.phone} className="w-4 h-4" />
            <span>전화 {STORE.tel}</span>
          </a>
          <Link href="/purchase" className="hb-btn-outline text-hb-sm">
            매입 견적 신청
          </Link>
        </div>
      </div>
    </div>
  );
}
