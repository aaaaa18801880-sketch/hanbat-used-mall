// 파일 경로: app/api/admin/fix-tv-categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

const MAINT_KEY = "hanbat_maint_fix_tv_20261021";

export async function POST(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (key !== MAINT_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient(undefined, true);

    // 제목에 TV가 포함된 모든 매물의 카테고리를 '기타'로 정상화
    const { data: updated, error } = await supabase
      .from("products")
      .update({ category: "기타" })
      .ilike("title", "%TV%")
      .select("id, title, category");

    if (error) {
      console.error("[fix-tv-categories] DB 업데이트 실패:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      revalidatePath("/gallery");
      revalidatePath("/");
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      updatedCount: updated?.length || 0,
      items: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
