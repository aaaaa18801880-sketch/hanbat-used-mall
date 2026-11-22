// 파일 경로: app/api/admin/telegram-inbox/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAnonServerClient } from "../../../../lib/supabase";
import { verifyAdminRequest } from "../../../../lib/server-security";
import { getTelegramIngestEnvStatus } from "../../../../lib/telegram-server";
import {
  detectOldSoldProductCleanupTargets,
  sortTelegramPhotosChronologically,
  type TelegramInboxPhoto,
} from "../../../../lib/telegram-inbox";

export const runtime = "nodejs";

/**
 * 관리자 텔레그램 사진 수집함 조회 (대기중인 사진 + 환경상태 + 90일+ 정리 대상 요약)
 */
export async function GET(req: NextRequest) {
  const adminCheck = await verifyAdminRequest(req);
  if (!adminCheck.ok) {
    return NextResponse.json(
      { error: adminCheck.error || "관리자 권한이 필요합니다." },
      { status: adminCheck.status }
    );
  }

  try {
    const supabase = createAnonServerClient(adminCheck.accessToken);
    const [inboxRes, soldRes] = await Promise.all([
      supabase
        .from("telegram_inbox_photos")
        .select("*")
        .eq("status", "pending")
        .order("taken_at", { ascending: true })
        .order("message_id", { ascending: true })
        .limit(300),
      supabase
        .from("products")
        .select("id, title, category, status, image_url, created_at")
        .eq("status", "판매완료")
        .neq("category", "배송인증")
        .limit(500),
    ]);

    if (inboxRes.error) {
      const tableMissing =
        /does not exist|relation.*telegram_inbox_photos/i.test(
          inboxRes.error.message
        );
      return NextResponse.json(
        {
          photos: [],
          envStatus: getTelegramIngestEnvStatus(),
          cleanupSummary: { productCount: 0, photoCount: 0 },
          migrationRequired: tableMissing,
          error: tableMissing
            ? "Supabase에 telegram_inbox_photos 테이블이 아직 생성되지 않았습니다. 제공된 SQL 마이그레이션을 먼저 실행해 주세요."
            : inboxRes.error.message,
        },
        { status: tableMissing ? 200 : 500 }
      );
    }

    const photos = sortTelegramPhotosChronologically(
      (inboxRes.data ?? []) as TelegramInboxPhoto[]
    );

    const cleanupTargets = soldRes.error
      ? []
      : detectOldSoldProductCleanupTargets(soldRes.data ?? [], {
          minAgeDays: 90,
        });

    const removablePhotoCount = cleanupTargets.reduce(
      (sum, t) => sum + t.removableUrls.length,
      0
    );

    return NextResponse.json({
      photos,
      envStatus: getTelegramIngestEnvStatus(),
      cleanupSummary: {
        productCount: cleanupTargets.length,
        photoCount: removablePhotoCount,
      },
      migrationRequired: false,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "수집함 데이터를 불러오지 못했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * 묶음 분할/합치기/정렬 순서 일괄 반영
 */
export async function PATCH(req: NextRequest) {
  const adminCheck = await verifyAdminRequest(req);
  if (!adminCheck.ok) {
    return NextResponse.json(
      { error: adminCheck.error || "관리자 권한이 필요합니다." },
      { status: adminCheck.status }
    );
  }

  let body: { updates?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const updates = Array.isArray(body.updates) ? body.updates : [];
  if (updates.length === 0 || updates.length > 350) {
    return NextResponse.json(
      { error: "유효한 묶음 변경 내역이 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const supabase = createAnonServerClient(adminCheck.accessToken);
    for (const rawItem of updates) {
      if (!rawItem || typeof rawItem !== "object") continue;
      const item = rawItem as {
        id?: unknown;
        group_key?: unknown;
        sort_order?: unknown;
      };
      const id = typeof item.id === "string" ? item.id.trim() : "";
      const groupKey =
        typeof item.group_key === "string" ? item.group_key.trim().slice(0, 80) : "";
      const sortOrder =
        typeof item.sort_order === "number" && Number.isFinite(item.sort_order)
          ? Math.round(item.sort_order)
          : 0;
      if (!id || !groupKey) continue;

      const { error } = await supabase
        .from("telegram_inbox_photos")
        .update({ group_key: groupKey, sort_order: sortOrder })
        .eq("id", id)
        .eq("status", "pending");

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ ok: true, updated: updates.length });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "묶음 변경 저장에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * 불필요한 사진 제외(discarded) 처리
 */
export async function DELETE(req: NextRequest) {
  const adminCheck = await verifyAdminRequest(req);
  if (!adminCheck.ok) {
    return NextResponse.json(
      { error: adminCheck.error || "관리자 권한이 필요합니다." },
      { status: adminCheck.status }
    );
  }

  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean)
        .slice(0, 100)
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "제외할 사진 ID가 없습니다." }, { status: 400 });
  }

  try {
    const supabase = createAnonServerClient(adminCheck.accessToken);
    const { error } = await supabase
      .from("telegram_inbox_photos")
      .update({ status: "discarded" })
      .in("id", ids)
      .eq("status", "pending");

    if (error) throw error;
    return NextResponse.json({ ok: true, discardedCount: ids.length });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "사진 제외 처리에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
