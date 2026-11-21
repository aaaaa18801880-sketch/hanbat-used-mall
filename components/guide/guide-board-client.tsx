// 파일 경로: components/guide/guide-board-client.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  INFO_GUIDE_CATEGORY_LIST,
  LEGACY_GUIDE_CATEGORY_ALIASES,
  sortGuidesByPriority,
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
import { ICON, Icon } from "../../lib/icons";
import { hasGuideInteractiveTool } from "../../lib/guides/tool-slugs";

type GuideSortMode = "recommended" | "popular";

const PAGE_SIZE = 12;

const GUIDE_TOOL_LINKS = [
  {
    href: "/guide/aircon-pyeong-sizing-cafe-restaurant",
    label: "평형별 냉방용량",
    description: "매장 면적·층고 기준",
    icon: ICON.ruler,
  },
  {
    href: "/guide/voltage-220v-vs-380v",
    label: "분전함 전압 확인",
    description: "220V / 380V 판별",
    icon: ICON.bolt,
  },
  {
    href: "/guide/ladder-truck-and-clearance",
    label: "출입구 폭·반입",
    description: "문폭·회전 반경",
    icon: ICON.shieldCheck,
  },
] as const;

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

function GuideCard({
  article,
  stat,
  topRank,
  eager = false,
}: {
  article: GuideBoardSummaryItem;
  stat?: GuideStat;
  topRank?: GuideTopRank;
  eager?: boolean;
}) {
  const views = stat?.views ?? 0;
  const helpfulCount = stat?.helpfulCount ?? 0;
  const hasTool = hasGuideInteractiveTool(article.slug);

  return (
    <li className="h-full">
      <Link
        href={`/guide/${article.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2DDD3] bg-white shadow-2xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#141A23] hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23]"
      >
        {/* 16:9 게시글별 고유 실사 메인 이미지 */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#141A23]">
          <Image
            src={article.thumbnailSrc}
            alt={article.thumbnailAlt}
            fill
            priority={eager}
            loading={eager ? "eager" : undefined}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
            quality={85}
            referrerPolicy="no-referrer"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141A23]/65 via-transparent to-transparent"
            aria-hidden="true"
          />

          <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-white/95 px-2 py-0.5 text-hb-xs font-bold text-[#141A23] shadow-2xs">
              {article.category}
            </span>
            {hasTool && (
              <span className="rounded-md bg-[#0F766E] px-2 py-0.5 text-hb-xs font-bold text-white shadow-2xs">
                계산기
              </span>
            )}
            {topRank && (
              <span className="rounded-md bg-[#E8521A] px-2 py-0.5 text-hb-xs font-bold text-white shadow-2xs">
                인기 {topRank}위
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            <h3 className="text-hb-base sm:text-hb-lg font-bold leading-[1.4] tracking-[-0.02em] text-[#141A23] break-keep [text-wrap:balance] transition-colors group-hover:text-[#C84312] line-clamp-2">
              {article.title}
            </h3>

            <p className="mt-2 line-clamp-2 text-hb-xs sm:text-hb-sm leading-[1.6] text-[#475569] break-keep [text-wrap:pretty]">
              {article.summary}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#F1F3F6] pt-3">
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-hb-xs font-semibold text-[#64748B]">
              <span className="font-mono tabular-nums">
                {article.readMinutes}분 읽기
              </span>
              {helpfulCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#C84312] tabular-nums">
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
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-hb-xs font-bold text-[#141A23] transition-colors group-hover:text-[#C84312]">
              <span>읽어보기</span>
              <Icon
                d={ICON.right}
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function FeaturedGuide({
  article,
  stat,
}: {
  article: GuideBoardSummaryItem;
  stat?: GuideStat;
}) {
  const hasTool = hasGuideInteractiveTool(article.slug);

  return (
    <Link
      href={`/guide/${article.slug}`}
      className="group grid grid-cols-1 sm:grid-cols-12 overflow-hidden rounded-2xl border border-[#E2DDD3] bg-white shadow-2xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#141A23] hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23]"
    >
      {/* 좌측 비주얼 썸네일 (5컬럼) */}
      <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[250px] sm:col-span-5 overflow-hidden bg-[#141A23]">
        <Image
          src={article.thumbnailSrc}
          alt={article.thumbnailAlt}
          fill
          priority
          loading="eager"
          sizes="(max-width: 640px) 100vw, 380px"
          quality={85}
          referrerPolicy="no-referrer"
          className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141A23]/85 via-[#141A23]/20 to-transparent"
          aria-hidden="true"
        />

        <div className="absolute top-3.5 left-3.5 z-10 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-[#E8521A] px-2.5 py-1 text-hb-xs font-bold text-white shadow-xs">
            추천 필독
          </span>
          {hasTool && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#141A23]/90 border border-white/20 px-2.5 py-1 text-hb-xs font-bold text-[#5EEAD4] backdrop-blur-md">
              <Icon d={ICON.sparkles} className="h-3 w-3" />
              <span>계산기 포함</span>
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 p-4 text-white">
          <span className="text-hb-xs font-semibold text-white/85">
            {article.category} · {article.readMinutes}분 읽기
          </span>
        </div>
      </div>

      {/* 우측 본문 (7컬럼) */}
      <div className="flex flex-col justify-between p-5 sm:col-span-7 sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-hb-xs text-[#64748B]">
            <span className="rounded-md bg-[#FAF9F6] border border-[#E2DDD3] px-2 py-0.5 font-bold text-[#475569]">
              {article.priorityRole}
            </span>
            <time dateTime={article.updatedAt} className="font-mono tabular-nums">
              {article.updatedAt} 업데이트
            </time>
            {stat && stat.views > 0 && (
              <span className="tabular-nums">
                · 조회 {stat.views.toLocaleString("ko-KR")}
              </span>
            )}
          </div>

          <h2 className="mt-2.5 text-hb-lg sm:text-hb-xl font-bold leading-[1.35] tracking-[-0.025em] text-[#141A23] break-keep [text-wrap:balance] transition-colors group-hover:text-[#C84312]">
            {article.title}
          </h2>

          <p className="mt-2 text-hb-sm leading-[1.68] text-[#475569] line-clamp-3 break-keep [text-wrap:pretty]">
            {article.summary}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#E2DDD3] pt-3.5">
          <span className="inline-flex items-center gap-1.5 text-hb-sm font-bold text-[#141A23] transition-colors group-hover:text-[#C84312]">
            <span>
              {hasTool ? "가이드 읽고 바로 계산하기" : "먼저 읽어보기"}
            </span>
            <Icon
              d={ICON.arrow}
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </span>
        </div>
      </div>
    </Link>
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

  const popularGuideEntries = useMemo(() => {
    const bySlug = new Map(orderedArticles.map((a) => [a.slug, a]));
    const ranked = Object.values(liveStats)
      .map((stat) => ({
        stat,
        score: computeGuidePopularityScore(stat.views, stat.helpfulCount),
      }))
      .filter((entry) => entry.score > 0 && bySlug.has(entry.stat.slug))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.stat.helpfulCount !== a.stat.helpfulCount) {
          return b.stat.helpfulCount - a.stat.helpfulCount;
        }
        return b.stat.views - a.stat.views;
      })
      .slice(0, 5)
      .map((entry, index) => ({
        rank: index + 1,
        article: bySlug.get(entry.stat.slug)!,
      }));

    if (ranked.length >= 5) return ranked;

    const used = new Set(ranked.map((entry) => entry.article.slug));
    const fallback = orderedArticles
      .filter((article) => !used.has(article.slug))
      .slice(0, 5 - ranked.length)
      .map((article, index) => ({
        rank: ranked.length + index + 1,
        article,
      }));

    return [...ranked, ...fallback];
  }, [liveStats, orderedArticles]);

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

  const showFeatured =
    !hasNarrowingFilter &&
    sortMode === "recommended" &&
    safePage === 1 &&
    orderedArticles.length > 0;
  const featuredArticle = showFeatured ? orderedArticles[0] : null;
  const listArticles = featuredArticle
    ? pagedArticles.filter((article) => article.slug !== featuredArticle.slug)
    : pagedArticles;

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
      <p role="status" className="sr-only">
        {statusAnnouncement}
      </p>

      {/* 검색 · 정렬 */}
      <section aria-label="정보 게시판 검색 및 정렬" className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-[560px]">
            <label htmlFor="guide-search" className="sr-only">
              가전 정보 검색
            </label>
            <Icon
              d={ICON.search}
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#475569]"
            />
            <input
              id="guide-search"
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="증상·부품명으로 찾기 (예: 380V, 제상, 사다리차)"
              className="hb-input h-12 pl-12 pr-11 text-hb-base"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#475569] hover:bg-[#F1F5F9] hover:text-[#141A23]"
                aria-label="검색어 지우기"
              >
                <Icon d={ICON.close} className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-hb-sm font-bold text-[#141A23] tabular-nums">
              {hasNarrowingFilter
                ? `검색 결과 ${filteredArticles.length}편`
                : `전체 ${filteredArticles.length}편`}
            </span>
            <div
              role="group"
              aria-label="정렬 방식"
              className="inline-flex items-center gap-1 rounded-xl border border-[#E2E6EC] bg-white p-1"
            >
              <button
                type="button"
                aria-pressed={sortMode === "recommended"}
                onClick={() => handleSortChange("recommended")}
                className={`min-h-[34px] rounded-lg px-3 text-hb-xs font-bold transition-colors ${
                  sortMode === "recommended"
                    ? "bg-[#141A23] text-white"
                    : "text-[#475569] hover:bg-[#F7F8FA] hover:text-[#141A23]"
                }`}
              >
                추천순
              </button>
              <button
                type="button"
                aria-pressed={sortMode === "popular"}
                onClick={() => handleSortChange("popular")}
                className={`min-h-[34px] rounded-lg px-3 text-hb-xs font-bold transition-colors ${
                  sortMode === "popular"
                    ? "bg-[#141A23] text-white"
                    : "text-[#475569] hover:bg-[#F7F8FA] hover:text-[#141A23]"
                }`}
              >
                인기순
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-hb-xs text-[#475569]">
          <span className="font-semibold">추천 검색어</span>
          {["380V", "제상", "사다리차", "매입"].map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => handleSearchChange(query)}
              className="rounded-md border border-[#E2E6EC] bg-white px-2 py-1 font-semibold text-[#475569] transition-colors hover:border-[#141A23] hover:text-[#141A23]"
            >
              {query}
            </button>
          ))}
        </div>
      </section>

      {/* 스티키 주제 분류 */}
      <div className="sticky top-16 z-20 -mx-4 border-y border-[#E2DDD3] bg-[#FAF9F6]/95 px-4 backdrop-blur-md sm:-mx-6 sm:top-[72px] sm:px-6 lg:-mx-8 lg:px-8">
        <div
          role="group"
          aria-label="주제별 분류"
          className="flex flex-nowrap items-center gap-5 overflow-x-auto scrollbar-none sm:gap-7"
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
                className={`relative min-h-[48px] shrink-0 whitespace-nowrap border-b-2 pt-1 text-hb-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] ${
                  isActive
                    ? "border-[#C84312] text-[#141A23]"
                    : "border-transparent text-[#475569] hover:text-[#141A23]"
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
                <strong className="text-[#141A23]">{searchQuery.trim()}</strong>
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

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <div className="min-w-0">
          <section
            id="guide-board-list"
            ref={listTopRef}
            aria-label="정보 글 목록"
            className="scroll-mt-32"
          >
            {featuredArticle && (
              <div className="mb-5">
                <p className="mb-2 text-hb-xs font-bold text-[#C84312]">
                  먼저 읽을 글
                </p>
                <FeaturedGuide
                  article={featuredArticle}
                  stat={liveStats[featuredArticle.slug]}
                />
              </div>
            )}

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-hb-xs text-[#475569]">
              <span>
                {filteredArticles.length}편 중 {rangeStart}–{rangeEnd}번째 글
              </span>
              {totalPages > 1 && (
                <span className="tabular-nums">
                  {safePage} / {totalPages} 페이지
                </span>
              )}
            </div>

            {filteredArticles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#CBD2DC] bg-white px-5 py-14 text-center">
                <p className="text-hb-lg font-bold text-[#141A23]">
                  조건에 맞는 정보 글이 없습니다.
                </p>
                <p className="mt-1.5 text-hb-sm text-[#475569]">
                  검색어나 선택하신 분류를 초기화하면 전체 글을 다시 볼 수 있습니다.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="hb-btn-primary mt-5 h-11 px-5 text-hb-sm"
                >
                  전체 글 보기
                </button>
              </div>
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {listArticles.map((article, idx) => (
                    <GuideCard
                      key={article.slug}
                      article={article}
                      stat={liveStats[article.slug]}
                      topRank={topRankMap[article.slug]}
                      eager={!featuredArticle && idx < 2}
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

          {/* 하단 상담 연결 */}
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#E2E6EC] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="space-y-1">
              <p className="text-hb-xs font-bold text-[#C84312]">
                글로 판단하기 어려운 현장 조건이라면
              </p>
              <h2 className="text-hb-lg font-bold text-[#141A23] [text-wrap:balance]">
                설치 현장·분전함 사진 한 장으로 확인하세요
              </h2>
              <p className="text-hb-sm text-[#475569]">
                모델명이나 매장 사진을 보내주시면 {STORE.name} 담당자가 직접 안내합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <a
                href={telHref(STORE.tel)}
                onClick={() =>
                  trackEvent("click_tel_consult", { location: "guide_board" })
                }
                className="hb-btn-primary min-h-[44px] px-4 text-hb-sm"
              >
                <Icon d={ICON.phone} className="h-4 w-4" />
                <span>전화 상담</span>
              </a>
              <Link
                href="/inquiry?write=1"
                className="hb-btn-accent min-h-[44px] px-4 text-hb-sm"
              >
                <Icon d={ICON.chat} className="h-4 w-4" />
                <span>사진으로 문의</span>
              </Link>
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24" aria-label="게시판 보조 정보">
          <section className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-hb-sm font-bold text-[#141A23]">
                많이 찾는 가이드
              </h2>
              <button
                type="button"
                onClick={() => handleSortChange("popular")}
                className="text-hb-xs font-semibold text-[#475569] underline underline-offset-2 hover:text-[#141A23]"
              >
                인기순 전체
              </button>
            </div>
            <ol className="mt-3 divide-y divide-[#F1F3F6]">
              {popularGuideEntries.map(({ rank, article }) => (
                <li key={article.slug}>
                  <Link
                    href={`/guide/${article.slug}`}
                    className="group flex items-start gap-3 py-2.5"
                  >
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-[#E2DDD3] bg-[#141A23]">
                      <Image
                        src={article.thumbnailSrc}
                        alt={article.thumbnailAlt}
                        fill
                        sizes="64px"
                        quality={80}
                        referrerPolicy="no-referrer"
                        className="object-cover object-center transition-transform duration-200 group-hover:scale-105"
                      />
                      <span className="absolute left-1 top-1 rounded bg-[#141A23]/85 px-1 font-mono text-hb-xs font-bold leading-tight text-white tabular-nums">
                        {rank}
                      </span>
                    </div>
                    <span className="min-w-0">
                      <span className="block line-clamp-2 text-hb-xs sm:text-hb-sm font-bold leading-snug text-[#141A23] transition-colors group-hover:text-[#C84312]">
                        {article.title}
                      </span>
                      <span className="mt-0.5 block text-hb-xs text-[#64748B]">
                        {article.category} · {article.readMinutes}분
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-2xs">
            <h2 className="text-hb-sm font-bold text-[#141A23]">현장 도구</h2>
            <div className="mt-2 divide-y divide-[#F1F3F6]">
              {GUIDE_TOOL_LINKS.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-center gap-3 py-2.5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F7F8FA] text-[#0F766E]">
                    <Icon d={tool.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-hb-sm font-bold text-[#141A23]">
                      {tool.label}
                    </span>
                    <span className="mt-0.5 block text-hb-xs text-[#475569]">
                      {tool.description}
                    </span>
                  </span>
                  <Icon
                    d={ICON.right}
                    className="ml-auto h-3.5 w-3.5 shrink-0 text-[#475569] transition-colors group-hover:text-[#141A23]"
                  />
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-[#141A23] p-5 text-white">
            <h2 className="text-hb-sm font-bold text-white">
              사진 한 장으로 상담
            </h2>
            <p className="mt-2 text-hb-xs leading-relaxed text-white/75">
              모델명 명판이나 설치 현장 사진을 보내주시면 필요한 전압·배관·반입 조건을 함께 확인해 드립니다.
            </p>
            <Link
              href="/inquiry?write=1"
              onClick={() =>
                trackEvent("begin_buy_inquiry", {
                  location: "guide_board_sidebar",
                })
              }
              className="hb-btn-accent mt-4 min-h-[42px] w-full px-3 text-hb-xs font-bold"
            >
              <Icon d={ICON.chat} className="h-3.5 w-3.5" />
              <span>사진으로 문의</span>
            </Link>
            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", {
                  location: "guide_board_sidebar",
                })
              }
              className="mt-2 inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/5 px-3 text-hb-xs font-bold text-white transition-colors hover:bg-white/10"
            >
              <Icon d={ICON.phone} className="h-3.5 w-3.5" />
              <span>{STORE.tel}</span>
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
