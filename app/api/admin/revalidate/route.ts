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
    const rawId = body.id || req.nextUrl.searchParams.get("id");
    const id =
      typeof rawId === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(rawId.trim())
        ? rawId.trim()
        : null;

    try {
      revalidatePath("/");
      revalidatePath("/gallery");
      revalidatePath("/guide");
      revalidatePath("/feed.xml");
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
        "/guide",
        "/feed.xml",
        "/sitemap.xml",
        "/llms.txt",
        "/llms-full.txt",
        id ? `/${id}` : null,
      ].filter(Boolean),
    });
  } catch (err: unknown) {
    console.error("[revalidate] 요청 처리 실패:", err);
    return NextResponse.json(
      { error: "캐시 재검증 처리 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
