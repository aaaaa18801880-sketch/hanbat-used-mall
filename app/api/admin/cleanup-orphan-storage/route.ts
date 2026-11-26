// 파일 경로: app/api/admin/cleanup-orphan-storage/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "../../../../lib/supabase";
import {
  checkRateLimit,
  getClientIp,
  verifyAdminRequest,
} from "../../../../lib/server-security";
import {
  collectReferencedStoragePathsByBucket,
  detectOrphanStorageObjects,
  ORPHAN_CLEANUP_BUCKETS,
  type OrphanCleanupBucket,
  type StorageListedObject,
} from "../../../../lib/storage-orphan";

export const runtime = "nodejs";

const DB_PAGE_SIZE = 1000;
const DB_MAX_PAGES = 20;
const STORAGE_PAGE_SIZE = 500;
const STORAGE_MAX_OBJECTS_PER_BUCKET = 5000;
const STORAGE_MAX_DEPTH = 2;
const REMOVE_BATCH_SIZE = 50;

async function fetchAllProductImageUrls(
  supabase: SupabaseClient
): Promise<{ urls: string[]; truncated: boolean }> {
  const urls: string[] = [];
  let truncated = false;
  for (let page = 0; page < DB_MAX_PAGES; page++) {
    const from = page * DB_PAGE_SIZE;
    const to = from + DB_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("products")
      .select("id, image_url")
      .order("id", { ascending: true })
      .range(from, to);
    if (error) {
      throw new Error(`products 참조 목록 조회 실패: ${error.message}`);
    }
    const rows = data ?? [];
    for (const row of rows) {
      if (typeof row.image_url === "string" && row.image_url.trim()) {
        urls.push(row.image_url);
      }
    }
    if (rows.length < DB_PAGE_SIZE) break;
    if (page === DB_MAX_PAGES - 1) {
      truncated = true;
    }
  }
  return { urls, truncated };
}

async function fetchAllInquiryImageRows(
  supabase: SupabaseClient
): Promise<{
  rows: Array<{ images?: unknown; image_url?: unknown }>;
  truncated: boolean;
}> {
  const result: Array<{ images?: unknown; image_url?: unknown }> = [];
  let truncated = false;
  for (let page = 0; page < DB_MAX_PAGES; page++) {
    const from = page * DB_PAGE_SIZE;
    const to = from + DB_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("purchase_requests")
      .select("id, images, image_url")
      .order("id", { ascending: true })
      .range(from, to);
    if (error) {
      throw new Error(`purchase_requests 참조 목록 조회 실패: ${error.message}`);
    }
    const rows = data ?? [];
    for (const row of rows) {
      result.push({
        images: (row as { images?: unknown }).images,
        image_url: (row as { image_url?: unknown }).image_url,
      });
    }
    if (rows.length < DB_PAGE_SIZE) break;
    if (page === DB_MAX_PAGES - 1) {
      truncated = true;
    }
  }
  return { rows: result, truncated };
}

async function listBucketObjectsRecursive(
  supabase: SupabaseClient,
  bucket: OrphanCleanupBucket,
  prefix = "",
  depth = 0,
  acc: StorageListedObject[] = []
): Promise<StorageListedObject[]> {
  if (depth > STORAGE_MAX_DEPTH || acc.length >= STORAGE_MAX_OBJECTS_PER_BUCKET) {
    return acc;
  }

  let offset = 0;
  while (acc.length < STORAGE_MAX_OBJECTS_PER_BUCKET) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: STORAGE_PAGE_SIZE,
      offset,
      sortBy: { column: "created_at", order: "asc" },
    });

    if (error) {
      // 아직 생성되지 않은 선택 버킷(예: 레거시 product-images)은 조용히 건너뜀
      if (/not found|does not exist/i.test(error.message)) {
        return acc;
      }
      throw new Error(`Storage(${bucket}) 목록 조회 실패: ${error.message}`);
    }

    const entries = data ?? [];
    if (entries.length === 0) break;

    for (const entry of entries) {
      if (acc.length >= STORAGE_MAX_OBJECTS_PER_BUCKET) break;
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const isFolder = entry.id === null && !entry.metadata;
      if (isFolder) {
        if (depth < STORAGE_MAX_DEPTH) {
          await listBucketObjectsRecursive(supabase, bucket, fullPath, depth + 1, acc);
        }
        continue;
      }

      const rawSize =
        entry.metadata && typeof entry.metadata.size === "number"
          ? entry.metadata.size
          : 0;
      acc.push({
        bucket,
        path: fullPath,
        sizeBytes: rawSize,
        createdAt: entry.created_at ?? null,
        updatedAt: entry.updated_at ?? null,
      });
    }

    if (entries.length < STORAGE_PAGE_SIZE) break;
    offset += STORAGE_PAGE_SIZE;
  }

  return acc;
}

/**
 * DB(products, purchase_requests)에 더 이상 참조되지 않는 고아 Storage 파일 점검 및 안전 정리 API
 * - 기본값은 항상 dryRun=true(미리보기)이며, 실제 삭제는 dryRun=false AND confirmDelete=true가 모두 필요합니다.
 * - 업로드 직후 DB 반영 전인 파일을 보호하기 위해 최근 24시간(기본) 이내 파일은 삭제 대상에서 제외합니다.
 */
export async function POST(req: NextRequest) {
  const adminCheck = await verifyAdminRequest(req);
  if (!adminCheck.ok) {
    return NextResponse.json(
      { error: adminCheck.error || "관리자 권한이 필요합니다." },
      { status: adminCheck.status }
    );
  }

  let body: {
    dryRun?: unknown;
    confirmDelete?: unknown;
    minAgeHours?: unknown;
    maxDelete?: unknown;
  } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const dryRun = body.dryRun !== false || body.confirmDelete !== true;
  const minAgeHours =
    typeof body.minAgeHours === "number" && Number.isFinite(body.minAgeHours)
      ? Math.max(1, Math.min(24 * 90, Math.round(body.minAgeHours)))
      : 24;
  const maxDelete =
    typeof body.maxDelete === "number" && Number.isFinite(body.maxDelete)
      ? Math.max(1, Math.min(200, Math.round(body.maxDelete)))
      : 100;

  const rate = await checkRateLimit(
    `admin_cleanup_orphan:${adminCheck.email || getClientIp(req)}`,
    6,
    60 * 1000,
    { failureMode: dryRun ? "fail-open" : "fail-closed" }
  );
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `스토리지 점검 요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
      },
      { status: 429 }
    );
  }

  try {
    // 관리자 인증이 완료된 뒤, 비공개 문의 첨부 포함 전체 DB 참조를 누락 없이 대조하기 위해 Service Role 사용
    const supabase = createServiceRoleClient();

    const [productRefResult, inquiryRefResult] = await Promise.all([
      fetchAllProductImageUrls(supabase),
      fetchAllInquiryImageRows(supabase),
    ]);
    const truncated =
      productRefResult.truncated || inquiryRefResult.truncated;

    if (!dryRun && truncated) {
      return NextResponse.json(
        {
          ok: false,
          truncated: true,
          error:
            "DB 참조 목록이 조회 상한(20,000행)에 도달해 누락 참조 보호(Fail-Closed)를 위해 실제 삭제를 중단했습니다.",
        },
        { status: 409 }
      );
    }

    const referencedByBucket = collectReferencedStoragePathsByBucket({
      productImageUrls: productRefResult.urls,
      inquiryRows: inquiryRefResult.rows,
    });

    const listedArrays = await Promise.all(
      ORPHAN_CLEANUP_BUCKETS.map((bucket) =>
        listBucketObjectsRecursive(supabase, bucket)
      )
    );
    const allListed = listedArrays.flat();

    const detection = detectOrphanStorageObjects(allListed, referencedByBucket, {
      minAgeHours,
    });

    if (dryRun || detection.orphans.length === 0) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        truncated,
        minAgeHours,
        scannedCount: allListed.length,
        orphanCount: detection.orphans.length,
        totalBytes: detection.totalBytes,
        skippedTooNewCount: detection.skippedTooNewCount,
        byBucket: detection.byBucket,
        samplePaths: detection.orphans.slice(0, 8).map((o) => ({
          bucket: o.bucket,
          path: o.path,
          sizeBytes: o.sizeBytes,
          ageHours: o.ageHours,
        })),
      });
    }

    const targetsToDelete = detection.orphans.slice(0, maxDelete);
    const groupedPaths: Record<OrphanCleanupBucket, string[]> = {
      inquiries: [],
      "product-images": [],
      "inquiry-attachments": [],
    };
    const sizeByKey = new Map<string, number>();

    for (const item of targetsToDelete) {
      groupedPaths[item.bucket].push(item.path);
      sizeByKey.set(`${item.bucket}:${item.path}`, item.sizeBytes);
    }

    let deletedCount = 0;
    let freedBytes = 0;

    for (const bucket of ORPHAN_CLEANUP_BUCKETS) {
      const paths = groupedPaths[bucket];
      for (let i = 0; i < paths.length; i += REMOVE_BATCH_SIZE) {
        const chunk = paths.slice(i, i + REMOVE_BATCH_SIZE);
        const { data: removed, error: remErr } = await supabase.storage
          .from(bucket)
          .remove(chunk);
        if (remErr) {
          throw new Error(`Storage(${bucket}) 삭제 실패: ${remErr.message}`);
        }
        const removedItems = removed ?? [];
        for (const rm of removedItems) {
          deletedCount += 1;
          freedBytes += sizeByKey.get(`${bucket}:${rm.name}`) ?? 0;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      dryRun: false,
      minAgeHours,
      scannedCount: allListed.length,
      deletedCount,
      freedBytes,
      remainingCount: Math.max(0, detection.orphans.length - deletedCount),
    });
  } catch (err: unknown) {
    console.error(
      "[cleanup-orphan-storage] error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "고아 Storage 파일 점검 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
