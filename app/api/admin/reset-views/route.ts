// 파일 경로: app/api/admin/reset-views/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { verifyAdminRequest } from "../../../../lib/server-security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // [보안 패치] URL 평문 시크릿 대신 서버 측 정식 관리자 Bearer 토큰 검증 수행
    const adminCheck = await verifyAdminRequest(req);
    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error || "관리자 권한이 필요합니다." },
        { status: adminCheck.status }
      );
    }

    const scope = req.nextUrl.searchParams.get("scope") || "recent";
    const supabase = createServerSupabaseClient(adminCheck.accessToken, true);

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

    try {
      revalidatePath("/gallery");
      revalidatePath("/");
    } catch {
      // ignore revalidate error
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
