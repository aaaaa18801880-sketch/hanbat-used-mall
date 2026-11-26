// 파일 경로: app/api/admin/cleanup-sold-photos/route.ts
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createAnonServerClient } from "../../../../lib/supabase";
import {
  extractStorageFilesByBucket,
  STORAGE_BUCKETS,
} from "../../../../lib/site";
import {
  checkRateLimit,
  getClientIp,
  verifyAdminRequest,
} from "../../../../lib/server-security";
import { detectOldSoldProductCleanupTargets } from "../../../../lib/telegram-inbox";

export const runtime = "nodejs";

/**
 * 판매완료 후 90일+ 경과한 매물의 2번 이후 보조사진을 Storage에서 정리해 무료 1GB 한도를 절약합니다.
 * - 1번 대표 사진은 보존하여 판매 이력 및 SEO 썸네일이 깨지지 않습니다.
 */
export async function POST(req: NextRequest) {
  const adminCheck = await verifyAdminRequest(req);
  if (!adminCheck.ok) {
    return NextResponse.json(
      { error: adminCheck.error || "관리자 권한이 필요합니다." },
      { status: adminCheck.status }
    );
  }

  const rate = await checkRateLimit(
    `admin_cleanup_sold:${adminCheck.email || getClientIp(req)}`,
    10,
    60 * 1000,
    { failureMode: "fail-open" }
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `사진 정리 요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.` },
      { status: 429 }
    );
  }

  let body: { dryRun?: unknown; minAgeDays?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const dryRun = body.dryRun === true;
  const minAgeDays =
    typeof body.minAgeDays === "number" &&
    Number.isFinite(body.minAgeDays) &&
    body.minAgeDays >= 30
      ? Math.min(365, Math.round(body.minAgeDays))
      : 90;

  try {
    const supabase = createAnonServerClient(adminCheck.accessToken);
    const cutoffIso = new Date(
      Date.now() - minAgeDays * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data, error } = await supabase
      .from("products")
      .select("id, title, category, status, image_url, created_at")
      .eq("status", "판매완료")
      .neq("category", "배송인증")
      .lt("created_at", cutoffIso)
      .order("created_at", { ascending: true })
      .limit(500);

    if (error) throw error;

    const targets = detectOldSoldProductCleanupTargets(data ?? [], {
      minAgeDays,
    });

    const totalRemovablePhotos = targets.reduce(
      (sum, t) => sum + t.removableUrls.length,
      0
    );

    if (dryRun || targets.length === 0) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        minAgeDays,
        targetCount: targets.length,
        removablePhotoCount: totalRemovablePhotos,
        previewTitles: targets.slice(0, 8).map((t) => t.title),
      });
    }

    let cleanedProductCount = 0;
    let deletedFileCount = 0;
    const cleanedProductIds: string[] = [];

    for (const target of targets) {
      const { error: updErr } = await supabase
        .from("products")
        .update({ image_url: target.primaryImageUrl })
        .eq("id", target.productId);

      if (updErr) continue;
      cleanedProductCount++;
      cleanedProductIds.push(target.productId);

      const { inquiries, productImages, attachments } =
        extractStorageFilesByBucket(target.removableUrls);

      const bucketBatches: Array<[string, string[]]> = [
        [STORAGE_BUCKETS.inquiries, inquiries],
        [STORAGE_BUCKETS.legacyProductImages, productImages],
        [STORAGE_BUCKETS.inquiryAttachments, attachments],
      ];

      for (const [bucket, paths] of bucketBatches) {
        if (paths.length === 0) continue;
        const { data: delData } = await supabase.storage
          .from(bucket)
          .remove(paths);
        if (delData) deletedFileCount += delData.length;
      }
    }

    if (cleanedProductIds.length > 0) {
      for (const productId of cleanedProductIds) {
        revalidatePath(`/${productId}`);
      }
      revalidatePath("/gallery");
      revalidatePath("/");
    }

    return NextResponse.json({
      ok: true,
      dryRun: false,
      minAgeDays,
      targetCount: targets.length,
      cleanedProductCount,
      deletedFileCount,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "오래된 판매완료 보조사진 정리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
