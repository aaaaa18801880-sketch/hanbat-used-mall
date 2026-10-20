// 파일 경로: app/api/admin/reset-views/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

const RESET_SECRET = "hanbat_view_reset_20261020_k9x2";

export async function POST(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (key !== RESET_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scope = req.nextUrl.searchParams.get("scope") || "recent";
    const supabase = createServerSupabaseClient(undefined, true);

    let query = supabase.from("products").update({ views: 0 }).gt("views", 0);

    // scope=recent: 2026-10-19 이후 등록된 신규 상품 대상 (관리자 테스트 클릭 리셋)
    if (scope === "recent") {
      query = query.gte("created_at", "2026-10-19T00:00:00.000Z");
    }

    const { data, error } = await query.select("id, title, views");

    if (error) {
      console.error("[reset-views] DB 업데이트 실패:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 캐시 무효화
    try {
      revalidatePath("/gallery");
      revalidatePath("/");
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      scope,
      resetCount: data?.length || 0,
      items: data,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
