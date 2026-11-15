// 파일 경로: app/api/guides/[slug]/engagement/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getInfoGuideBySlug } from "../../../../../lib/info-guides";
import {
  fetchGuideStatsBySlug,
  isMissingGuideStatsTableError,
} from "../../../../../lib/guide-stats";
import {
  createAnonServerClient,
  createServiceRoleClient,
  isAuthorizedAdminUser,
} from "../../../../../lib/supabase";
import {
  checkRateLimit,
  getClientIp,
  verifySameOriginRequest,
} from "../../../../../lib/server-security";

export const runtime = "nodejs";

interface RpcEngagementRow {
  guide_slug?: string;
  view_count?: number;
  helpful_total?: number;
}

function isValidGuideSlugFormat(slug: string): boolean {
  return slug.length > 0 && slug.length <= 120 && /^[a-z0-9-]+$/.test(slug);
}

function isMissingMigrationError(
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (!error) return false;
  if (isMissingGuideStatsTableError(error)) return true;
  if (error.code === "PGRST202" || error.code === "42883") return true;
  const msg = (error.message || "").toLowerCase();
  return msg.includes("increment_guide_metric");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!isValidGuideSlugFormat(slug) || !getInfoGuideBySlug(slug)) {
    return NextResponse.json(
      { error: "가이드 글을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const stat = await fetchGuideStatsBySlug(slug);
  return NextResponse.json(stat, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    if (!verifySameOriginRequest(req)) {
      return NextResponse.json(
        { error: "허용되지 않은 요청 출처입니다." },
        { status: 403 },
      );
    }

    const { slug } = await params;
    if (!isValidGuideSlugFormat(slug) || !getInfoGuideBySlug(slug)) {
      return NextResponse.json(
        { error: "유효한 가이드 글이 아닙니다." },
        { status: 404 },
      );
    }

    let payload: { action?: unknown; delta?: unknown } = {};
    try {
      payload = (await req.json()) as { action?: unknown; delta?: unknown };
    } catch {
      payload = {};
    }

    const action =
      payload.action === "helpful"
        ? "helpful"
        : payload.action === "view"
          ? "view"
          : null;

    if (!action) {
      return NextResponse.json(
        { error: "action은 view 또는 helpful이어야 합니다." },
        { status: 400 },
      );
    }

    const delta =
      action === "helpful" && payload.delta === -1
        ? -1
        : 1;

    if (action === "view") {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        if (token && token.length <= 4096) {
          try {
            const authClient = createAnonServerClient(token);
            const { data: userData } = await authClient.auth.getUser(token);
            if (isAuthorizedAdminUser(userData?.user)) {
              const current = await fetchGuideStatsBySlug(slug);
              return NextResponse.json({
                success: true,
                skipped: "admin",
                ...current,
              });
            }
          } catch {
            // 관리자 토큰 확인 실패 시 일반 조회 흐름 진행
          }
        }
      }
    }

    const ip = getClientIp(req);
    const rateKey =
      action === "view"
        ? `guide_view:${ip}:${slug}`
        : `guide_helpful:${ip}:${slug}`;
    const maxAttempts = action === "view" ? 1 : 6;
    const rate = await checkRateLimit(rateKey, maxAttempts, 10 * 60 * 1000, {
      failureMode: "fail-open",
    });

    if (!rate.allowed) {
      if (action === "view") {
        const current = await fetchGuideStatsBySlug(slug);
        return NextResponse.json({
          success: true,
          deduplicated: true,
          ...current,
        });
      }
      return NextResponse.json(
        {
          success: false,
          error: "짧은 시간에 여러 번 누르셨습니다. 잠시 후 다시 시도해 주세요.",
        },
        { status: 429 },
      );
    }

    const serviceClient = createServiceRoleClient();
    const { data: rpcData, error: rpcErr } = await serviceClient.rpc(
      "increment_guide_metric",
      {
        p_slug: slug,
        p_metric: action,
        p_delta: action === "helpful" ? delta : 1,
      },
    );

    if (rpcErr) {
      if (isMissingMigrationError(rpcErr)) {
        return NextResponse.json(
          {
            success: false,
            pendingMigration: true,
            error: "가이드 통계 테이블이 아직 생성되지 않았습니다.",
          },
          { status: 503 },
        );
      }
      console.error("[guide-engagement] RPC 실패:", rpcErr.message);
      return NextResponse.json(
        { success: false, error: "통계 반영 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }

    const row: RpcEngagementRow | undefined = Array.isArray(rpcData)
      ? (rpcData[0] as RpcEngagementRow | undefined)
      : (rpcData as RpcEngagementRow | undefined);

    const views = Math.max(0, Number(row?.view_count) || 0);
    const helpfulCount = Math.max(0, Number(row?.helpful_total) || 0);

    if (action === "helpful" || views <= 1 || views % 5 === 0) {
      try {
        revalidatePath("/guide");
        revalidatePath(`/guide/${slug}`);
      } catch {
        // ignore revalidate error
      }
    }

    return NextResponse.json({
      success: true,
      slug,
      views,
      helpfulCount,
    });
  } catch (err) {
    console.error("[guide-engagement] 예외 발생:", err);
    return NextResponse.json(
      { success: false, error: "요청 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
