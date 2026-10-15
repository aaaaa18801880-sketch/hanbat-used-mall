// 파일 경로: app/api/products/[id]/view/route.ts
import { NextRequest, NextResponse } from "next/server";
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
      return NextResponse.json({ error: "상품 ID가 필요합니다." }, { status: 400 });
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`prod_view:${ip}:${id}`, 1, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ success: true, deduplicated: true });
    }

    const supabase = createServerSupabaseClient(undefined, true);
    const { data: product, error: fetchErr } = await supabase
      .from("products")
      .select("id, views")
      .eq("id", id)
      .single();

    if (fetchErr || !product) {
      return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
    }

    const nextViews = (Number(product.views) || 0) + 1;
    const { error: updateErr } = await supabase
      .from("products")
      .update({ views: nextViews })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: "조회수 반영 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, views: nextViews });
  } catch {
    return NextResponse.json(
      { success: false, error: "조회수 처리 중 오류 발생" },
      { status: 500 }
    );
  }
}
