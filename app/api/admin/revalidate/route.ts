// 파일 경로: app/api/admin/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminRequest } from "../../../../lib/server-security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await verifyAdminRequest(req);
    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error || "관리자 권한이 필요합니다." },
        { status: adminCheck.status }
      );
    }

    const body = await req.json().catch(() => ({}));
    const id = body.id || req.nextUrl.searchParams.get("id");

    try {
      revalidatePath("/");
      revalidatePath("/gallery");
      revalidatePath("/sitemap.xml");
      revalidatePath("/llms.txt");
      revalidatePath("/llms-full.txt");
      if (id) {
        revalidatePath(`/${id}`);
      }
    } catch (e) {
      console.error("[revalidate] 캐시 재검증 실패:", e);
    }

    return NextResponse.json({
      success: true,
      revalidated: [
        "/",
        "/gallery",
        "/sitemap.xml",
        "/llms.txt",
        "/llms-full.txt",
        id ? `/${id}` : null,
      ].filter(Boolean),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "캐시 재검증 중 오류 발생" },
      { status: 500 }
    );
  }
}
