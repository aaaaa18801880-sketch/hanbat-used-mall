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
  type InfoGuidePriorityRole,
  type PrioritizedInfoGuideArticle,
} from "../../lib/info-guides";
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

type PriorityViewTab = "prioritized" | "tier1" | "tier2";
type PriorityRoleFilter = "전체" | InfoGuidePriorityRole;
type GuideSortMode = "priority" | "popular";

const TIER1_INITIAL_VISIBLE = 8;
const TIER1_LOAD_STEP = 14;

const PRIORITY_VIEW_TABS: readonly {
  id: PriorityViewTab;
  label: string;
  shortDesc: string;
}[] = [
  {
    id: "prioritized",
    label: "매입·판매 우선 보기",
    shortDesc: "매입·구매 핵심 먼저 보고, 관리 상식은 접어둡니다",
  },
  {
    id: "tier1",
    label: "1순위 · 매입·판매 핵심",
    shortDesc: "매입·처분, 중고 구매 비교, 설치·계약 필수 체크",
  },
  {
    id: "tier2",
    label: "2순위 · 관리·고장·안전",
    shortDesc: "고장 자가점검, 청소·동파 예방, 전기·법규 상식",
  },
];

const TIER1_ROLE_FILTERS: readonly PriorityRoleFilter[] = [
  "전체",
  "매입·처분",
  "구매·선택",
  "설치·계약",
];

const TIER2_ROLE_FILTERS: readonly PriorityRoleFilter[] = [
  "전체",
  "고장·점검",
  "안전·관리",
];

const ROLE_BADGE_CLASS_MAP: Record<InfoGuidePriorityRole, string> = {
  "매입·처분": "bg-[#FFF3EC] text-[#C2410C] border-[#FDBA74]",
  "구매·선택": "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
  "설치·계약": "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
  "고장·점검": "bg-[#FEFCE8] text-[#A16207] border-[#FDE047]",
  "안전·관리": "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]",
};

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

function parseInitialView(raw: string | null): PriorityViewTab {
  if (raw === "tier1" || raw === "tier2" || raw === "prioritized") {
    return raw;
  }
  return "prioritized";
}

function GuideAssetBadges({
  article,
}: {
  article: PrioritizedInfoGuideArticle;
}) {
  const hasDiagram = Boolean(article.heroImage);
  const hasTable = article.sections.some((section) => Boolean(section.table));
  const hasTool = hasGuideInteractiveTool(article.slug);

  if (!hasDiagram && !hasTable && !hasTool) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {hasDiagram && (
        <span className="inline-flex items-center rounded bg-[#F1F5F9] px-1.5 py-0.5 text-hb-xs font-medium text-[#475569]">
          도해
        </span>
      )}
      {hasTable && (
        <span className="inline-flex items-center rounded bg-[#F1F5F9] px-1.5 py-0.5 text-hb-xs font-medium text-[#475569]">
          비교표
        </span>
      )}
      {hasTool && (
        <span className="inline-flex items-center rounded bg-[#EFF6FF] px-1.5 py-0.5 text-hb-xs font-semibold text-[#1D4ED8]">
          계산기
        </span>
      )}
    </div>
  );
}

function GuideCompactCard({
  article,
  stat,
  topRank,
  deferRender = false,
  isTopPriority = false,
}: {
  article: PrioritizedInfoGuideArticle;
  stat?: GuideStat;
  topRank?: GuideTopRank;
  deferRender?: boolean;
  isTopPriority?: boolean;
}) {
  const roleBadgeClass = ROLE_BADGE_CLASS_MAP[article.priorityRole];
  const categoryBadgeClass = CATEGORY_BADGE_CLASS_MAP[article.category];
  const views = stat?.views ?? 0;
  const helpfulCount = stat?.helpfulCount ?? 0;

  return (
    <li className={deferRender ? "hb-guide-deferred-card" : undefined}>
      <Link
        href={`/guide/${article.slug}`}
        className={`group flex h-full flex-col justify-between rounded-xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#E8521A]/60 hover:shadow-sm ${
          topRank === 1
            ? "border-[#E8521A]/50 bg-linear-to-b from-[#FFF9F4] to-white"
            : isTopPriority || topRank
              ? "border-[#FED7AA] bg-linear-to-b from-[#FFFDF9] to-white"
              : "border-[#E2E6EC]"
        }`}
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-hb-xs font-semibold tabular-nums text-[#64748B]">
                #{String(article.number).padStart(2, "0")}
              </span>
              {topRank && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-hb-xs font-extrabold ${
                    topRank === 1
                      ? "bg-[#E8521A] text-white"
                      : "border border-[#FDBA74] bg-[#FFF3EC] text-[#C2410C]"
                  }`}
                >
                  <Icon d={ICON.trendingUp} className="h-3 w-3" />
                  인기 TOP {topRank}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-hb-xs font-bold ${roleBadgeClass}`}
              >
                {article.priorityRole}
              </span>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-hb-xs font-medium ${categoryBadgeClass}`}
              >
                {article.category}
              </span>
            </div>
            <span className="text-hb-xs tabular-nums text-[#64748B]">
              {article.readMinutes}분
            </span>
          </div>

          <h3 className="mt-2.5 line-clamp-2 text-hb-sm sm:text-hb-base font-bold leading-snug text-[#141A23] group-hover:text-[#E8521A] transition-colors">
            {article.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-hb-xs sm:text-hb-sm leading-relaxed text-[#475569]">
            {article.summary}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9] pt-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <GuideAssetBadges article={article} />
            <div className="flex items-center gap-2 text-hb-xs tabular-nums text-[#64748B]">
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
          <span className="ml-auto inline-flex items-center gap-1 text-hb-xs font-semibold text-[#64748B] group-hover:text-[#E8521A] transition-colors">
            읽기
            <Icon
              d={ICON.right}
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </li>
  );
}

export function GuideBoardClient({
  articles,
  initialStats = {},
}: {
  articles: readonly PrioritizedInfoGuideArticle[];
  initialStats?: GuideStatsMap;
}) {
  const searchParams = useSearchParams();
  const [liveStats, setLiveStats] = useState<GuideStatsMap>(initialStats);
  const [sortMode, setSortMode] = useState<GuideSortMode>("priority");
  const [activeView, setActiveView] = useState<PriorityViewTab>(() =>
    parseInitialView(searchParams.get("view")),
  );
  const [selectedRole, setSelectedRole] =
    useState<PriorityRoleFilter>("전체");
  const [selectedCategory, setSelectedCategory] =
    useState<InfoGuideFilterCategory>(() =>
      parseInitialCategory(searchParams.get("category")),
    );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q")?.trim() ?? "",
  );
  const [tier1Limit, setTier1Limit] = useState(TIER1_INITIAL_VISIBLE);
  const [isTier2ManualOpen, setIsTier2ManualOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const tabRefs = useRef<Record<PriorityViewTab, HTMLButtonElement | null>>({
    prioritized: null,
    tier1: null,
    tier2: null,
  });

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 420);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    const refreshStats = async () => {
      try {
        const res = await fetch("/api/guides/engagement", {
          cache: "no-store",
        });
        if (!res.ok || !mounted) return;
        const data = (await res.json()) as { stats?: GuideStatsMap };
        if (data.stats && mounted) {
          setLiveStats(data.stats);
        }
      } catch {
        // 통계 새로고침 실패 시 서버 초기값 유지
      }
    };

    void refreshStats();
    window.addEventListener("focus", refreshStats);
    return () => {
      mounted = false;
      window.removeEventListener("focus", refreshStats);
    };
  }, []);

  const topRankMap = useMemo(
    () => computeTopGuideRanks(liveStats, 3),
    [liveStats],
  );

  const prioritizedArticles = useMemo(
    () => sortGuidesByPriority(articles),
    [articles],
  );

  const tier1All = useMemo(
    () => prioritizedArticles.filter((a) => a.priorityTier === 1),
    [prioritizedArticles],
  );
  const tier2All = useMemo(
    () => prioritizedArticles.filter((a) => a.priorityTier === 2),
    [prioritizedArticles],
  );

  const categoryCounts = useMemo(() => {
    const basePool =
      activeView === "tier1"
        ? tier1All
        : activeView === "tier2"
          ? tier2All
          : prioritizedArticles;
    const counts = Object.fromEntries(
      INFO_GUIDE_CATEGORY_LIST.map((category) => [category, 0]),
    ) as Record<InfoGuideFilterCategory, number>;
    counts["전체"] = basePool.length;
    for (const item of basePool) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [activeView, prioritizedArticles, tier1All, tier2All]);

  const roleCounts = useMemo(() => {
    const counts: Record<PriorityRoleFilter, number> = {
      전체:
        activeView === "tier2"
          ? tier2All.length
          : activeView === "tier1"
            ? tier1All.length
            : prioritizedArticles.length,
      "매입·처분": 0,
      "구매·선택": 0,
      "설치·계약": 0,
      "고장·점검": 0,
      "안전·관리": 0,
    };
    const pool =
      activeView === "tier2"
        ? tier2All
        : activeView === "tier1"
          ? tier1All
          : prioritizedArticles;
    for (const item of pool) {
      counts[item.priorityRole] += 1;
    }
    return counts;
  }, [activeView, prioritizedArticles, tier1All, tier2All]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasNarrowingFilter =
    normalizedQuery.length > 0 ||
    selectedCategory !== "전체" ||
    selectedRole !== "전체";

  const topGuideEntries = useMemo(() => {
    const bySlug = new Map(prioritizedArticles.map((a) => [a.slug, a]));
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
          article: PrioritizedInfoGuideArticle;
          stat: GuideStat;
        } => entry !== null,
      );
  }, [prioritizedArticles, topRankMap, liveStats]);

  const filteredMatches = useMemo(() => {
    const matches = prioritizedArticles.filter((article) => {
      if (
        selectedCategory !== "전체" &&
        article.category !== selectedCategory
      ) {
        return false;
      }
      if (selectedRole !== "전체" && article.priorityRole !== selectedRole) {
        return false;
      }
      if (!normalizedQuery) return true;
      const haystack = `${article.title} ${article.summary} ${article.category} ${article.priorityRole} ${article.keywords.join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    if (sortMode === "priority") {
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
    prioritizedArticles,
    selectedCategory,
    selectedRole,
    normalizedQuery,
    sortMode,
    liveStats,
  ]);

  const filteredTier1 = useMemo(
    () => filteredMatches.filter((a) => a.priorityTier === 1),
    [filteredMatches],
  );
  const filteredTier2 = useMemo(
    () => filteredMatches.filter((a) => a.priorityTier === 2),
    [filteredMatches],
  );

  const visibleTier1 = useMemo(() => {
    if (activeView === "tier1" || hasNarrowingFilter) {
      return filteredTier1;
    }
    return filteredTier1.slice(0, tier1Limit);
  }, [activeView, hasNarrowingFilter, filteredTier1, tier1Limit]);

  const remainingTier1Count = Math.max(
    0,
    filteredTier1.length - visibleTier1.length,
  );

  const effectiveTier2Open =
    isTier2ManualOpen || (hasNarrowingFilter && filteredTier2.length > 0);

  const syncUrlParams = (
    nextView: PriorityViewTab,
    nextCategory: InfoGuideFilterCategory,
    nextQuery: string,
  ) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (nextView === "prioritized") url.searchParams.delete("view");
    else url.searchParams.set("view", nextView);

    if (nextCategory === "전체") url.searchParams.delete("category");
    else url.searchParams.set("category", nextCategory);

    if (nextQuery.trim()) url.searchParams.set("q", nextQuery.trim());
    else url.searchParams.delete("q");

    window.history.replaceState(null, "", url.toString());
  };

  const handleViewChange = (
    nextView: PriorityViewTab,
    buttonEl?: HTMLButtonElement | null,
  ) => {
    setActiveView(nextView);
    if (nextView === "tier1" && (selectedRole === "고장·점검" || selectedRole === "안전·관리")) {
      setSelectedRole("전체");
    }
    if (
      nextView === "tier2" &&
      (selectedRole === "매입·처분" ||
        selectedRole === "구매·선택" ||
        selectedRole === "설치·계약")
    ) {
      setSelectedRole("전체");
    }
    if (nextView === "prioritized") {
      setTier1Limit(TIER1_INITIAL_VISIBLE);
    }
    buttonEl?.scrollIntoView({ block: "nearest", inline: "nearest" });
    syncUrlParams(nextView, selectedCategory, searchQuery);
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let targetIndex: number | null = null;
    if (event.key === "ArrowRight") {
      targetIndex = (currentIndex + 1) % PRIORITY_VIEW_TABS.length;
    } else if (event.key === "ArrowLeft") {
      targetIndex =
        (currentIndex - 1 + PRIORITY_VIEW_TABS.length) %
        PRIORITY_VIEW_TABS.length;
    } else if (event.key === "Home") {
      targetIndex = 0;
    } else if (event.key === "End") {
      targetIndex = PRIORITY_VIEW_TABS.length - 1;
    }
    if (targetIndex === null) return;
    event.preventDefault();
    const targetTab = PRIORITY_VIEW_TABS[targetIndex];
    const targetButton = tabRefs.current[targetTab.id];
    handleViewChange(targetTab.id, targetButton);
    targetButton?.focus();
  };

  const handleCategoryChange = (
    cat: InfoGuideFilterCategory,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setSelectedCategory(cat);
    event?.currentTarget.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
    syncUrlParams(activeView, cat, searchQuery);
  };

  const handleRoleFilterChange = (role: PriorityRoleFilter) => {
    setSelectedRole(role);
    if (
      activeView === "prioritized" &&
      (role === "고장·점검" || role === "안전·관리")
    ) {
      setIsTier2ManualOpen(true);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    syncUrlParams(activeView, selectedCategory, value);
  };

  const resetAllFilters = () => {
    setActiveView("prioritized");
    setSortMode("priority");
    setSelectedRole("전체");
    setSelectedCategory("전체");
    setSearchQuery("");
    setTier1Limit(TIER1_INITIAL_VISIBLE);
    setIsTier2ManualOpen(false);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/guide");
    }
  };

  const activeRoleOptions =
    activeView === "tier2" ? TIER2_ROLE_FILTERS : TIER1_ROLE_FILTERS;

  const activeTotalDisplayed =
    activeView === "tier1"
      ? filteredTier1.length
      : activeView === "tier2"
        ? filteredTier2.length
        : filteredMatches.length;

  return (
    <div className="space-y-6">
      {/* 1. 우선순위 탭 + 목적 필터 + 주제 카테고리 + 검색 제어판 */}
      <section
        aria-label="정보 게시판 필터 및 검색"
        className="rounded-2xl border border-[#E2E6EC] bg-white shadow-2xs"
      >
        {/* 우선순위 탭 (단일 행 유지 + 밑줄 형태 인디케이터로 색각 의존 제거) */}
        <div
          role="tablist"
          aria-label="가이드 우선순위 보기 선택"
          className="flex flex-nowrap items-stretch gap-1 overflow-x-auto scrollbar-none border-b border-[#E2E6EC] px-3 sm:px-5"
        >
          {PRIORITY_VIEW_TABS.map((tab, index) => {
            const isSelected = activeView === tab.id;
            const count =
              tab.id === "tier1"
                ? tier1All.length
                : tab.id === "tier2"
                  ? tier2All.length
                  : prioritizedArticles.length;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                id={`guide-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="guide-board-tabpanel"
                tabIndex={isSelected ? 0 : -1}
                onClick={(e) => handleViewChange(tab.id, e.currentTarget)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`hb-tab-indicator shrink-0 whitespace-nowrap px-3.5 py-3.5 text-hb-sm font-bold transition-colors ${
                  isSelected
                    ? "text-[#141A23]"
                    : "text-[#64748B] hover:text-[#141A23]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-hb-xs font-semibold tabular-nums ${
                    isSelected
                      ? "bg-[#FFF3EC] text-[#C2410C]"
                      : "bg-[#F1F5F9] text-[#64748B]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 목적 필터 + 검색 + 품목별 칩 */}
        <div className="space-y-3.5 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* 목적(역할) 빠른 필터 */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-hb-xs font-bold text-[#64748B]">
                목적별:
              </span>
              {activeRoleOptions.map((role) => {
                const isActive = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleRoleFilterChange(role)}
                    className={`rounded-lg border px-2.5 py-1 text-hb-xs font-semibold transition-colors ${
                      isActive
                        ? "border-[#141A23] bg-[#141A23] text-white"
                        : "border-[#E2E6EC] bg-[#F8FAFC] text-[#475569] hover:border-[#CBD5E1] hover:bg-white"
                    }`}
                  >
                    {role}
                    <span className="ml-1 opacity-75 tabular-nums">
                      {roleCounts[role]}
                    </span>
                  </button>
                );
              })}
              {activeView === "prioritized" && sortMode === "priority" && (
                <button
                  type="button"
                  onClick={() => setIsTier2ManualOpen((prev) => !prev)}
                  className="ml-1 inline-flex items-center gap-1 rounded-lg border border-[#E2E6EC] bg-white px-2.5 py-1 text-hb-xs font-semibold text-[#475569] hover:border-[#CBD5E1] hover:text-[#141A23]"
                >
                  <Icon
                    d={effectiveTier2Open ? ICON.up : ICON.down}
                    className="h-3.5 w-3.5"
                  />
                  {effectiveTier2Open ? "2순위 접기" : "2순위 펼치기"}
                </button>
              )}
            </div>

            {/* 정렬 전환 + 실시간 검색창 */}
            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
              <div
                role="group"
                aria-label="가이드 정렬 방식"
                className="inline-flex rounded-lg border border-[#E2E6EC] bg-[#F8FAFC] p-0.5 shrink-0"
              >
                <button
                  type="button"
                  aria-pressed={sortMode === "priority"}
                  onClick={() => setSortMode("priority")}
                  className={`rounded-md px-2.5 py-1 text-hb-xs font-bold transition-colors ${
                    sortMode === "priority"
                      ? "bg-white text-[#141A23] shadow-2xs"
                      : "text-[#64748B] hover:text-[#141A23]"
                  }`}
                >
                  추천 우선순
                </button>
                <button
                  type="button"
                  aria-pressed={sortMode === "popular"}
                  onClick={() => setSortMode("popular")}
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

              <div className="flex flex-1 items-center gap-2 lg:w-72">
                <label htmlFor="guide-search" className="sr-only">
                  가전 정보 검색
                </label>
                <div className="relative flex-1">
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
                    className="hb-input pl-9 pr-9 py-2 text-hb-sm"
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
          </div>

          {/* 품목·주제별 단일 행 가로 스크롤 필터 */}
          <div className="relative">
            <div
              role="group"
              aria-label="가전 품목 및 주제별 분류"
              className="hb-hscroll-fade flex flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 pr-6"
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
                    className={`hb-tab-indicator shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-hb-xs font-semibold transition-colors ${
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

          {/* 활성 필터 요약 바 */}
          {(hasNarrowingFilter ||
            activeView !== "prioritized" ||
            sortMode !== "priority") && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F8FAFC] px-3.5 py-2 text-hb-xs text-[#475569]">
              <span>
                현재 조건{" "}
                <strong className="font-bold text-[#141A23] tabular-nums">
                  {activeTotalDisplayed}편
                </strong>{" "}
                표시 중
                {sortMode === "popular" && " · 조회수·도움됐어요 합산 인기순"}
                {normalizedQuery && (
                  <>
                    {" "}
                    · 검색어{" "}
                    <strong className="text-[#C2410C]">
                      &ldquo;{searchQuery.trim()}&rdquo;
                    </strong>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={resetAllFilters}
                className="font-semibold text-[#C2410C] hover:underline"
              >
                초기 우선순위 보기로 돌아가기
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. 탭 패널 콘텐츠 영역 */}
      <div
        id="guide-board-tabpanel"
        role="tabpanel"
        aria-labelledby={`guide-tab-${activeView}`}
        className="space-y-6"
      >
        {activeTotalDisplayed === 0 ? (
          <div className="rounded-2xl border border-[#E2E6EC] bg-white px-6 py-12 text-center shadow-2xs">
            <p className="text-hb-base font-bold text-[#141A23]">
              조건에 맞는 정보 글이 없습니다.
            </p>
            <p className="mt-1.5 text-hb-sm text-[#475569]">
              검색어나 품목·목적 필터를 초기화하면 매입·판매 핵심 글부터 다시 볼 수 있습니다.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#141A23] px-4 py-2 text-hb-sm font-bold text-white hover:bg-[#1E293B]"
            >
              전체 우선순위 보기
            </button>
          </div>
        ) : sortMode === "popular" ? (
          <section
            aria-labelledby="popular-board-heading"
            className="rounded-2xl border border-[#E2E6EC] bg-white p-4 sm:p-5 shadow-2xs"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3.5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E8521A] px-2.5 py-0.5 text-hb-xs font-bold text-white">
                    <Icon d={ICON.trendingUp} className="h-3.5 w-3.5" />
                    실시간 인기순
                  </span>
                  <h2
                    id="popular-board-heading"
                    className="text-hb-base sm:text-hb-lg font-extrabold text-[#141A23]"
                  >
                    방문자가 많이 보고 도움된 글 순서
                  </h2>
                </div>
                <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#475569]">
                  조회수와 도움됐어요 클릭이 반영된 인기순으로 전체 글을 보여드립니다.
                </p>
              </div>
              <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-hb-xs font-bold tabular-nums text-[#334155]">
                총{" "}
                {activeView === "tier1"
                  ? filteredTier1.length
                  : activeView === "tier2"
                    ? filteredTier2.length
                    : filteredMatches.length}
                편
              </span>
            </div>

            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(activeView === "tier1"
                ? filteredTier1
                : activeView === "tier2"
                  ? filteredTier2
                  : filteredMatches
              ).map((article, idx) => (
                <GuideCompactCard
                  key={article.slug}
                  article={article}
                  stat={liveStats[article.slug]}
                  topRank={topRankMap[article.slug]}
                  deferRender={idx >= TIER1_INITIAL_VISIBLE}
                  isTopPriority={Boolean(topRankMap[article.slug])}
                />
              ))}
            </ul>
          </section>
        ) : (
          <>
            {/* 실시간 인기 TOP 3 컴팩트 스트립 */}
            {topGuideEntries.length > 0 &&
              activeView === "prioritized" &&
              !hasNarrowingFilter && (
                <section
                  aria-labelledby="guide-top3-heading"
                  className="rounded-2xl border border-[#FDBA74]/70 bg-linear-to-r from-[#FFF8F3] via-white to-[#FFF8F3] p-4 shadow-2xs"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2
                      id="guide-top3-heading"
                      className="flex items-center gap-1.5 text-hb-sm sm:text-hb-base font-extrabold text-[#141A23]"
                    >
                      <Icon
                        d={ICON.trendingUp}
                        className="h-4 w-4 text-[#E8521A]"
                      />
                      <span>지금 가장 많이 보는 인기 TOP {topGuideEntries.length}</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSortMode("popular")}
                      className="text-hb-xs font-bold text-[#C2410C] hover:underline"
                    >
                      인기순 전체 보기
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                    {topGuideEntries.map(({ rank, article, stat }) => (
                      <Link
                        key={article.slug}
                        href={`/guide/${article.slug}`}
                        className="group flex flex-col justify-between rounded-xl border border-[#FED7AA] bg-white p-3 transition-all hover:border-[#E8521A] hover:shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-hb-xs font-extrabold ${
                                rank === 1
                                  ? "bg-[#E8521A] text-white"
                                  : "bg-[#FFF3EC] text-[#C2410C]"
                              }`}
                            >
                              인기 TOP {rank}
                            </span>
                            <span className="font-mono text-hb-xs text-[#64748B] tabular-nums">
                              #{String(article.number).padStart(2, "0")}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-hb-xs sm:text-hb-sm font-bold text-[#141A23] group-hover:text-[#E8521A] transition-colors">
                            {article.title}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-hb-xs tabular-nums text-[#64748B]">
                          <span className="inline-flex items-center gap-1">
                            <Icon d={ICON.eye} className="h-3.5 w-3.5 text-[#94A3B8]" />
                            {stat.views.toLocaleString("ko-KR")}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-[#C2410C]">
                            <Icon d={ICON.thumbUp} className="h-3.5 w-3.5 text-[#E8521A]" />
                            {stat.helpfulCount.toLocaleString("ko-KR")}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

            {/* 제1순위 섹션: 매입·판매·설치계약 핵심 */}
            {activeView !== "tier2" && filteredTier1.length > 0 && (
              <section
                aria-labelledby="tier1-heading"
                className="rounded-2xl border border-[#FED7AA] bg-white p-4 sm:p-5 shadow-2xs"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E8521A] px-2.5 py-0.5 text-hb-xs font-bold text-white">
                        <Icon d={ICON.sparkles} className="h-3.5 w-3.5" />
                        제1순위
                      </span>
                      <h2
                        id="tier1-heading"
                        className="text-hb-base sm:text-hb-lg font-extrabold text-[#141A23]"
                      >
                        매입 · 구매 · 계약 직전 꼭 보는 핵심 가이드
                      </h2>
                    </div>
                    <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#475569]">
                      고장·감가 없는 매입 준비, 매장 평수·기종 비교, 설치 전 전기·공간 확인에 바로 도움이 되는 글부터 배치했습니다.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#FFF3EC] px-3 py-1 text-hb-xs font-bold tabular-nums text-[#C2410C]">
                    총 {filteredTier1.length}편
                    {visibleTier1.length < filteredTier1.length &&
                      ` 중 상위 ${visibleTier1.length}편 표시`}
                  </span>
                </div>

                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {visibleTier1.map((article, idx) => (
                    <GuideCompactCard
                      key={article.slug}
                      article={article}
                      stat={liveStats[article.slug]}
                      topRank={topRankMap[article.slug]}
                      deferRender={idx >= TIER1_INITIAL_VISIBLE}
                      isTopPriority={idx < 4 && !hasNarrowingFilter}
                    />
                  ))}
                </ul>

                {remainingTier1Count > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 border-t border-[#F1F5F9] pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        setTier1Limit((prev) => prev + TIER1_LOAD_STEP)
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-hb-sm font-bold text-[#141A23] hover:border-[#E8521A] hover:text-[#E8521A] transition-colors"
                    >
                      1순위 {Math.min(TIER1_LOAD_STEP, remainingTier1Count)}편 더 보기
                      <span className="text-hb-xs font-semibold text-[#64748B] tabular-nums">
                        ({remainingTier1Count}편 남음)
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTier1Limit(filteredTier1.length)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFF3EC] px-4 py-2 text-hb-sm font-bold text-[#C2410C] hover:bg-[#FFE5D5] transition-colors"
                    >
                      1순위 전체 {filteredTier1.length}편 펼치기
                    </button>
                  </div>
                )}

                {activeView === "prioritized" &&
                  !hasNarrowingFilter &&
                  filteredTier1.length > TIER1_INITIAL_VISIBLE &&
                  remainingTier1Count === 0 && (
                    <div className="mt-4 flex justify-center border-t border-[#F1F5F9] pt-4">
                      <button
                        type="button"
                        onClick={() => setTier1Limit(TIER1_INITIAL_VISIBLE)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E6EC] bg-[#F8FAFC] px-4 py-2 text-hb-xs font-bold text-[#475569] hover:bg-white hover:text-[#141A23]"
                      >
                        <Icon d={ICON.up} className="h-3.5 w-3.5" />
                        상위 {TIER1_INITIAL_VISIBLE}편만 간결하게 접기
                      </button>
                    </div>
                  )}
              </section>
            )}

            {/* 제2순위 섹션: 사용 관리 · 고장 진단 · 안전·법규 상식 */}
            {activeView !== "tier1" && filteredTier2.length > 0 && (
              activeView === "tier2" ? (
                <section
                  aria-labelledby="tier2-heading"
                  className="rounded-2xl border border-[#E2E6EC] bg-white p-4 sm:p-5 shadow-2xs"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-[#334155] px-2.5 py-0.5 text-hb-xs font-bold text-white">
                          제2순위
                        </span>
                        <h2
                          id="tier2-heading"
                          className="text-hb-base sm:text-hb-lg font-extrabold text-[#141A23]"
                        >
                          고장 자가진단 · 일상 관리 · 안전 상식
                        </h2>
                      </div>
                      <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#475569]">
                        사용 중 증상 점검, 성에·청소·동파 예방법, 화재·전기·법규 상식을 모았습니다.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-hb-xs font-bold tabular-nums text-[#334155]">
                      총 {filteredTier2.length}편
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {filteredTier2.map((article, idx) => (
                      <GuideCompactCard
                        key={article.slug}
                        article={article}
                        stat={liveStats[article.slug]}
                        topRank={topRankMap[article.slug]}
                        deferRender={idx >= TIER1_INITIAL_VISIBLE}
                      />
                    ))}
                  </ul>
                </section>
              ) : (
                <details
                  open={effectiveTier2Open}
                  onToggle={(e) => setIsTier2ManualOpen(e.currentTarget.open)}
                  className="group overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white shadow-2xs"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-5 [&::-webkit-details-marker]:hidden hover:bg-[#F8FAFC] transition-colors">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-[#334155] px-2.5 py-0.5 text-hb-xs font-bold text-white">
                          제2순위
                        </span>
                        <h2 className="text-hb-sm sm:text-hb-base font-extrabold text-[#141A23]">
                          고장 진단 · 일상 관리 · 안전·법규 상식 ({filteredTier2.length}편)
                        </h2>
                      </div>
                      <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#475569]">
                        사용 중 약냉·누수 점검, 방열 이격거리, 동파·트래킹 화재 예방 등 유지관리 상식은 필요할 때 펼쳐보세요.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden sm:inline-flex items-center rounded-lg border border-[#E2E6EC] bg-[#F8FAFC] px-2.5 py-1 text-hb-xs font-bold text-[#334155]">
                        {effectiveTier2Open
                          ? "접기"
                          : `펼쳐서 ${filteredTier2.length}편 보기`}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E2E6EC] bg-white text-[#475569] transition-transform duration-150 group-open:rotate-180">
                        <Icon d={ICON.down} className="h-4 w-4" />
                      </span>
                    </div>
                  </summary>

                  <div className="border-t border-[#E2E6EC] bg-[#F8FAFC]/60 p-4 sm:p-5">
                    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {filteredTier2.map((article) => (
                        <GuideCompactCard
                          key={article.slug}
                          article={article}
                          stat={liveStats[article.slug]}
                          topRank={topRankMap[article.slug]}
                          deferRender
                        />
                      ))}
                    </ul>
                  </div>
                </details>
              )
            )}
          </>
        )}
      </div>

      {/* 3. 하단 상담 안내 박스 */}
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
          <Link href="/buyback" className="hb-btn-outline text-hb-sm">
            매입 견적 신청
          </Link>
        </div>
      </div>

      {/* 4. 스크롤 맨 위로 플로팅 버튼 */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="페이지 맨 위로 이동"
          className="fixed bottom-24 right-4 z-30 inline-flex items-center gap-1.5 rounded-full border border-[#CBD5E1] bg-white/95 px-3.5 py-2 text-hb-xs font-bold text-[#141A23] shadow-md backdrop-blur-xs transition-all hover:border-[#E8521A] hover:text-[#E8521A] lg:bottom-8 lg:right-8"
        >
          <Icon d={ICON.up} className="h-4 w-4" />
          <span>맨 위로</span>
        </button>
      )}
    </div>
  );
}
