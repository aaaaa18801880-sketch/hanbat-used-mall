// 파일 경로: app/api/admin/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  checkRateLimit,
  getClientIp,
  verifyAdminRequest,
} from "../../../../lib/server-security";

export const runtime = "nodejs";

type RevalidateScope = "product" | "media" | "all";

function parseRevalidateScope(raw: unknown): RevalidateScope {
  if (raw === "media" || raw === "all" || raw === "product") {
    return raw;
  }
  return "product";
}

function resolveRevalidatePaths(
  scope: RevalidateScope,
  id: string | null
): string[] {
  const paths: string[] = ["/", "/gallery"];
  if (scope === "product" || scope === "all") {
    paths.push("/feed.xml", "/sitemap.xml", "/llms.txt", "/llms-full.txt");
  }
  if (scope === "all") {
    paths.push("/guide");
  }
  if (id) {
    paths.push(`/${id}`);
  }
  return paths;
}

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await verifyAdminRequest(req);
    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error || "관리자 권한이 필요합니다." },
        { status: adminCheck.status }
      );
    }

    const rate = await checkRateLimit(
      `admin_revalidate:${adminCheck.email || getClientIp(req)}`,
      40,
      60 * 1000,
      { failureMode: "fail-open" }
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `캐시 재검증 요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawId = body.id || req.nextUrl.searchParams.get("id");
    const id =
      typeof rawId === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(rawId.trim())
        ? rawId.trim()
        : null;
    const scope = parseRevalidateScope(
      body.scope || req.nextUrl.searchParams.get("scope")
    );
    const paths = resolveRevalidatePaths(scope, id);

    try {
      for (const targetPath of paths) {
        revalidatePath(targetPath);
      }
    } catch (e) {
      console.error("[revalidate] 캐시 재검증 실패:", e);
    }

    return NextResponse.json({
      success: true,
      scope,
      revalidated: paths,
    });
  } catch (err: unknown) {
    console.error("[revalidate] 요청 처리 실패:", err);
    return NextResponse.json(
      { error: "캐시 재검증 처리 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
