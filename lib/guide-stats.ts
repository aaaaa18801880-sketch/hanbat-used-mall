// 파일 경로: lib/guide-stats.ts
export interface GuideStat {
  slug: string;
  views: number;
  helpfulCount: number;
}

export type GuideStatsMap = Record<string, GuideStat>;
export type GuideTopRank = 1 | 2 | 3;

const HELPFUL_WEIGHT = 5;

export function computeGuidePopularityScore(
  views: number,
  helpfulCount: number,
): number {
  const safeViews = Number.isFinite(views) ? Math.max(0, Math.floor(views)) : 0;
  const safeHelpful = Number.isFinite(helpfulCount)
    ? Math.max(0, Math.floor(helpfulCount))
    : 0;
  return safeViews + safeHelpful * HELPFUL_WEIGHT;
}

export function computeTopGuideRanks(
  statsMap: GuideStatsMap,
  limit = 3,
): Record<string, GuideTopRank> {
  const cappedLimit = Math.max(0, Math.min(3, Math.floor(limit)));
  if (cappedLimit === 0) return {};

  const ranked = Object.values(statsMap)
    .map((stat) => ({
      ...stat,
      score: computeGuidePopularityScore(stat.views, stat.helpfulCount),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.helpfulCount !== a.helpfulCount) {
        return b.helpfulCount - a.helpfulCount;
      }
      if (b.views !== a.views) return b.views - a.views;
      return a.slug.localeCompare(b.slug);
    })
    .slice(0, cappedLimit);

  const result: Record<string, GuideTopRank> = {};
  ranked.forEach((entry, index) => {
    const rank = (index + 1) as GuideTopRank;
    result[entry.slug] = rank;
  });
  return result;
}

export function isMissingGuideStatsTableError(
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const msg = (error.message || "").toLowerCase();
  return msg.includes("guide_stats") && (msg.includes("does not exist") || msg.includes("schema cache"));
}

function hasSupabasePublicEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function fetchGuideStatsMap(): Promise<GuideStatsMap> {
  if (!hasSupabasePublicEnv()) return {};
  try {
    const { createAnonServerClient } = await import("./supabase");
    const client = createAnonServerClient();
    const { data, error } = await client
      .from("guide_stats")
      .select("slug, views, helpful_count")
      .limit(200);

    if (error || !data) {
      if (error && !isMissingGuideStatsTableError(error)) {
        console.warn("[guide-stats] 목록 통계 조회 건너뜀:", error.message);
      }
      return {};
    }

    const map: GuideStatsMap = {};
    for (const row of data) {
      if (typeof row.slug !== "string" || !row.slug) continue;
      map[row.slug] = {
        slug: row.slug,
        views: Math.max(0, Number(row.views) || 0),
        helpfulCount: Math.max(0, Number(row.helpful_count) || 0),
      };
    }
    return map;
  } catch {
    return {};
  }
}

export async function fetchGuideStatsBySlug(slug: string): Promise<GuideStat> {
  const empty: GuideStat = { slug, views: 0, helpfulCount: 0 };
  if (!hasSupabasePublicEnv()) return empty;
  try {
    const { createAnonServerClient } = await import("./supabase");
    const client = createAnonServerClient();
    const { data, error } = await client
      .from("guide_stats")
      .select("slug, views, helpful_count")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      if (error && !isMissingGuideStatsTableError(error)) {
        console.warn("[guide-stats] 단건 통계 조회 건너뜀:", error.message);
      }
      return empty;
    }

    return {
      slug,
      views: Math.max(0, Number(data.views) || 0),
      helpfulCount: Math.max(0, Number(data.helpful_count) || 0),
    };
  } catch {
    return empty;
  }
}
