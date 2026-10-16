// 파일 경로: app/api/products/[id]/view/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../../../../../lib/supabase";
import { checkRateLimit, getClientIp } from "../../../../../lib/server-security";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "상품 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient(undefined, true);
    const { data: product, error: fetchErr } = await supabase
      .from("products")
      .select("id, views")
      .eq("id", id)
      .single();

    if (fetchErr || !product) {
      console.error("[product-view] 상품 조회 실패:", fetchErr?.message);
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const currentViews = Number(product.views) || 0;

    const ip = getClientIp(req);
    const rate = checkRateLimit(`prod_view:${ip}:${id}`, 1, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({
        success: true,
        deduplicated: true,
        views: currentViews,
      });
    }

    const nextViews = currentViews + 1;
    const { error: updateErr } = await supabase
      .from("products")
      .update({ views: nextViews })
      .eq("id", id);

    if (updateErr) {
      console.error(
        "[product-view] 조회수 업데이트 실패 (SUPABASE_SERVICE_ROLE_KEY 및 RLS 확인 필요):",
        updateErr.message
      );
      return NextResponse.json(
        { success: false, error: "조회수 반영 실패" },
        { status: 500 }
      );
    }

    try {
      revalidatePath(`/${id}`);
    } catch {
      // ignore revalidate error
    }

    return NextResponse.json({ success: true, views: nextViews });
  } catch (err) {
    console.error("[product-view] 예외 발생:", err);
    return NextResponse.json(
      { success: false, error: "조회수 처리 중 오류 발생" },
      { status: 500 }
    );
  }
}
