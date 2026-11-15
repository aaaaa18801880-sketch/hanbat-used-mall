// 파일 경로: app/api/guides/engagement/route.ts
import { NextResponse } from "next/server";
import { fetchGuideStatsMap } from "../../../../lib/guide-stats";

export const runtime = "nodejs";

export async function GET() {
  const stats = await fetchGuideStatsMap();
  return NextResponse.json(
    { stats },
    {
      headers: {
        "Cache-Control": "public, max-age=10, stale-while-revalidate=30",
      },
    },
  );
}
