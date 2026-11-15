// 파일 경로: components/guide/guide-engagement-panel.tsx
"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import type { GuideStat, GuideTopRank } from "../../lib/guide-stats";
import { getAdminAuthHeaders } from "../../lib/supabase";
import { ICON, Icon } from "../../lib/ui";

const HELPFUL_STORAGE_KEY = "hb_guide_helpful_slugs_v1";
const GUIDE_STAT_EVENT = "hb-guide-stat-sync";
const helpfulListeners = new Set<() => void>();

interface GuideStatEventDetail {
  slug: string;
  views: number;
  helpfulCount: number;
}

function readHelpfulSlugs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(HELPFUL_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === "string"));
  } catch {
    return new Set();
  }
}

function writeHelpfulSlugs(slugs: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      HELPFUL_STORAGE_KEY,
      JSON.stringify(Array.from(slugs)),
    );
  } catch {
    // Safari private mode 등 스토리지 제한 환경 무시
  }
  helpfulListeners.forEach((listener) => listener());
}

function subscribeHelpfulStorage(callback: () => void): () => void {
  helpfulListeners.add(callback);
  if (typeof window === "undefined") {
    return () => helpfulListeners.delete(callback);
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === HELPFUL_STORAGE_KEY) {
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    helpfulListeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function emitStatSync(detail: GuideStatEventDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<GuideStatEventDetail>(GUIDE_STAT_EVENT, { detail }),
  );
}

export function GuideEngagementHeaderMeta({
  slug,
  initialStat,
  topRank,
}: {
  slug: string;
  initialStat: GuideStat;
  topRank?: GuideTopRank;
}) {
  const [stat, setStat] = useState<GuideStat>(initialStat);

  useEffect(() => {
    const onSync = (event: Event) => {
      const custom = event as CustomEvent<GuideStatEventDetail>;
      if (custom.detail?.slug !== slug) return;
      setStat({
        slug,
        views: custom.detail.views,
        helpfulCount: custom.detail.helpfulCount,
      });
    };
    window.addEventListener(GUIDE_STAT_EVENT, onSync);
    return () => window.removeEventListener(GUIDE_STAT_EVENT, onSync);
  }, [slug]);

  return (
    <div className="flex flex-wrap items-center gap-2 text-hb-xs text-[#64748B]">
      {topRank && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF3EC] border border-[#FDBA74] px-2.5 py-0.5 font-bold text-[#C2410C]">
          <Icon d={ICON.trendingUp} className="w-3.5 h-3.5" />
          <span>인기 TOP {topRank}</span>
        </span>
      )}
      <span className="inline-flex items-center gap-1 tabular-nums font-medium">
        <Icon d={ICON.eye} className="w-3.5 h-3.5 text-[#94A3B8]" />
        <span>조회 {stat.views.toLocaleString("ko-KR")}</span>
      </span>
      <span className="inline-flex items-center gap-1 tabular-nums font-medium">
        <Icon d={ICON.thumbUp} className="w-3.5 h-3.5 text-[#94A3B8]" />
        <span>도움됐어요 {stat.helpfulCount.toLocaleString("ko-KR")}</span>
      </span>
    </div>
  );
}

export function GuideEngagementPanel({
  slug,
  initialStat,
}: {
  slug: string;
  initialStat: GuideStat;
}) {
  const [stat, setStat] = useState<GuideStat>(initialStat);
  const hasVoted = useSyncExternalStore(
    subscribeHelpfulStorage,
    () => readHelpfulSlugs().has(slug),
    () => false,
  );
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function trackGuideView() {
      let alreadyViewed = false;
      try {
        alreadyViewed =
          window.sessionStorage.getItem(`hb_guide_viewed:${slug}`) === "1";
      } catch {
        alreadyViewed = false;
      }

      if (alreadyViewed) {
        try {
          const res = await fetch(`/api/guides/${encodeURIComponent(slug)}/engagement`, {
            cache: "no-store",
          });
          if (!res.ok || !active) return;
          const fresh = (await res.json()) as Partial<GuideStat>;
          if (
            typeof fresh.views === "number" &&
            typeof fresh.helpfulCount === "number"
          ) {
            const next = {
              slug,
              views: fresh.views,
              helpfulCount: fresh.helpfulCount,
            };
            setStat(next);
            emitStatSync(next);
          }
        } catch {
          // ignore silent refresh failure
        }
        return;
      }

      try {
        const authHeaders = await getAdminAuthHeaders();
        const res = await fetch(
          `/api/guides/${encodeURIComponent(slug)}/engagement`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({ action: "view" }),
          },
        );
        if (!active || !res.ok) return;
        const data = (await res.json()) as {
          success?: boolean;
          views?: number;
          helpfulCount?: number;
        };
        if (data.success) {
          try {
            window.sessionStorage.setItem(`hb_guide_viewed:${slug}`, "1");
          } catch {
            // ignore storage limit
          }
          if (
            typeof data.views === "number" &&
            typeof data.helpfulCount === "number"
          ) {
            const next = {
              slug,
              views: data.views,
              helpfulCount: data.helpfulCount,
            };
            setStat(next);
            emitStatSync(next);
          }
        }
      } catch {
        // 조회수 기록 실패 시 UI 영향 없음
      }
    }

    void trackGuideView();

    return () => {
      active = false;
    };
  }, [slug]);

  const handleToggleHelpful = async () => {
    if (submitting) return;

    const nextVoted = !hasVoted;
    const delta: 1 | -1 = nextVoted ? 1 : -1;
    const prevStat = stat;
    const optimisticCount = Math.max(0, stat.helpfulCount + delta);

    const rollbackHelpful = () => {
      setStat(prevStat);
      emitStatSync(prevStat);
      const rollbackSet = readHelpfulSlugs();
      if (!nextVoted) rollbackSet.add(slug);
      else rollbackSet.delete(slug);
      writeHelpfulSlugs(rollbackSet);
    };

    setSubmitting(true);
    setFeedbackMessage(null);
    const optimisticStat = { ...stat, helpfulCount: optimisticCount };
    setStat(optimisticStat);
    emitStatSync(optimisticStat);

    const savedSet = readHelpfulSlugs();
    if (nextVoted) savedSet.add(slug);
    else savedSet.delete(slug);
    writeHelpfulSlugs(savedSet);

    try {
      const res = await fetch(
        `/api/guides/${encodeURIComponent(slug)}/engagement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "helpful", delta }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        views?: number;
        helpfulCount?: number;
        pendingMigration?: boolean;
        error?: string;
      };

      if (!res.ok || !data.success) {
        rollbackHelpful();
        setFeedbackMessage(
          data.pendingMigration
            ? "DB 통계 테이블 연결 준비 중입니다."
            : data.error || "잠시 후 다시 시도해 주세요.",
        );
        return;
      }

      if (
        typeof data.views === "number" &&
        typeof data.helpfulCount === "number"
      ) {
        const synced = {
          slug,
          views: data.views,
          helpfulCount: data.helpfulCount,
        };
        setStat(synced);
        emitStatSync(synced);
      }

      if (nextVoted) {
        setFeedbackMessage("소중한 의견 감사합니다. 필요한 상담은 바로 문의해 주세요.");
      }
    } catch {
      rollbackHelpful();
      setFeedbackMessage("네트워크 연결을 확인한 뒤 다시 눌러주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-label="가이드 유용성 평가 및 조회수"
      className="rounded-xl border border-[#E2E6EC] bg-[#F8FAFC] p-4 sm:p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-hb-sm sm:text-hb-base font-bold text-[#141A23]">
            이 안내 글이 도움이 되셨나요?
          </h2>
          <p className="text-hb-xs text-[#64748B] flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Icon d={ICON.eye} className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>누적 조회 {stat.views.toLocaleString("ko-KR")}회</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              도움됐어요 {stat.helpfulCount.toLocaleString("ko-KR")}명
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleHelpful}
          disabled={submitting}
          aria-pressed={hasVoted}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-hb-sm font-bold transition-all min-h-[44px] shrink-0 disabled:opacity-60 ${
            hasVoted
              ? "border-[#E8521A] bg-[#FFF3EC] text-[#C2410C] shadow-2xs"
              : "border-[#CBD5E1] bg-white text-[#141A23] hover:border-[#E8521A] hover:text-[#E8521A]"
          }`}
        >
          <Icon d={ICON.thumbUp} className="w-4 h-4" />
          <span>{hasVoted ? "도움됐어요 완료" : "이 글이 도움됐어요"}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-hb-xs font-extrabold tabular-nums ${
              hasVoted
                ? "bg-[#E8521A] text-white"
                : "bg-[#F1F5F9] text-[#475569]"
            }`}
          >
            {stat.helpfulCount.toLocaleString("ko-KR")}
          </span>
        </button>
      </div>

      {feedbackMessage && (
        <p
          role="status"
          aria-live="polite"
          className="mt-2.5 text-hb-xs font-medium text-[#475569]"
        >
          {feedbackMessage}
        </p>
      )}
    </section>
  );
}
