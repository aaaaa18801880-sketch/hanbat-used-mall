// 파일 경로: app/api/products/[id]/view/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  createAnonServerClient,
  createServiceRoleClient,
  isAuthorizedAdminUser,
} from "../../../../../lib/supabase";
import { checkRateLimit, getClientIp } from "../../../../../lib/server-security";

export const runtime = "nodejs";

function isValidProductId(id: string): boolean {
  const trimmed = id.trim();
  return trimmed.length > 0 && trimmed.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !isValidProductId(id)) {
      return NextResponse.json(
        { error: "유효한 상품 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 관리자 토큰(Authorization: Bearer ...) 검증: 관리자 접속 시 DB 업데이트 없이 즉시 스킵
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (token && token.length <= 4096) {
        const authClient = createAnonServerClient(token);
        const { data: userData } = await authClient.auth.getUser(token);
        if (isAuthorizedAdminUser(userData?.user)) {
          return NextResponse.json({
            success: true,
            skipped: "admin",
          });
        }
      }
    }

    // DB 조회 이전에 IP + 상품 ID 기반 중복 조회 제한 선행 확인 (불필요한 DB Read 차단)
    const ip = getClientIp(req);
    const rate = await checkRateLimit(`prod_view:${ip}:${id}`, 1, 10 * 60 * 1000, {
      failureMode: "fail-open",
    });

    // [SEC-005] 상품 기본 조회는 공개 권한(Anon Client)으로 수행하고, 실제 조회수 증가 쓰기만 Service Role 사용
    const anonClient = createAnonServerClient();
    const { data: product, error: fetchErr } = await anonClient
      .from("products")
      .select("id, views")
      .eq("id", id)
      .single();

    if (fetchErr || !product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const currentViews = Number(product.views) || 0;

    if (!rate.allowed) {
      return NextResponse.json({
        success: true,
        deduplicated: true,
        views: currentViews,
      });
    }

    let nextViews = currentViews + 1;
    const serviceClient = createServiceRoleClient();

    // 1순위: PostgreSQL 원자적(Atomic) 증가 RPC 호출 시도 (Race Condition 방지)
    const { data: rpcViews, error: rpcErr } = await serviceClient.rpc(
      "increment_product_views",
      { target_id: id }
    );

    if (!rpcErr && typeof rpcViews === "number") {
      nextViews = rpcViews;
    } else {
      // 2순위: RPC 미설치 환경 호환을 위한 안전한 폴백 업데이트
      const { error: updateErr } = await serviceClient
        .from("products")
        .update({ views: nextViews })
        .eq("id", id);

      if (updateErr) {
        console.error("[product-view] 조회수 업데이트 실패:", updateErr.message);
        return NextResponse.json(
          { success: false, error: "조회수 반영 실패" },
          { status: 500 }
        );
      }
    }

    // 매 조회마다 ISR 캐시를 파기하지 않고 최초 조회 또는 5회 단위로만 선택적 갱신 (서버 부하 절감)
    if (nextViews <= 1 || nextViews % 5 === 0) {
      try {
        revalidatePath(`/${id}`);
      } catch {
        // ignore revalidate error
      }
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
