// 파일 경로: lib/storage-orphan.ts
// Supabase Storage 무료 1GB 한도 보호를 위한 DB 미연결(고아) 파일 안전 판별 순수 로직

import {
  extractInquiryImages,
  extractStorageFilesByBucket,
  splitImages,
  STORAGE_BUCKETS,
} from "./site";

export const ORPHAN_CLEANUP_BUCKETS = [
  STORAGE_BUCKETS.inquiries,
  STORAGE_BUCKETS.legacyProductImages,
  STORAGE_BUCKETS.inquiryAttachments,
] as const;

export type OrphanCleanupBucket = (typeof ORPHAN_CLEANUP_BUCKETS)[number];

export interface StorageListedObject {
  bucket: OrphanCleanupBucket;
  path: string;
  sizeBytes: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface OrphanDetectionItem extends StorageListedObject {
  ageHours: number;
}

export interface OrphanDetectionResult {
  orphans: OrphanDetectionItem[];
  totalBytes: number;
  skippedTooNewCount: number;
  skippedSystemCount: number;
  byBucket: Record<OrphanCleanupBucket, { count: number; bytes: number }>;
}

export function normalizeStorageObjectPath(rawPath: string): string | null {
  const cleaned = rawPath.trim().replace(/^\/+|\/+$/g, "");
  if (
    !cleaned ||
    cleaned.length > 240 ||
    cleaned.includes("..") ||
    cleaned.includes("\\") ||
    cleaned.includes("//") ||
    /[\u0000-\u001f\u007f]/.test(cleaned)
  ) {
    return null;
  }
  return cleaned;
}

export function isSystemOrPlaceholderObject(objectPath: string): boolean {
  const baseName = objectPath.split("/").pop() || "";
  if (!baseName) return true;
  if (baseName.startsWith(".")) return true;
  if (baseName === ".emptyFolderPlaceholder") return true;
  return false;
}

function addSignedOrPublicBucketPath(
  url: string,
  sets: Record<OrphanCleanupBucket, Set<string>>
): void {
  const trimmed = url.trim();
  if (!trimmed) return;

  // public URL 뿐만 아니라 혹시 저장된 signed/authenticated 경로도 방어적으로 추출
  const match = trimmed.match(
    /\/storage\/v1\/object\/(?:public|sign|authenticated)\/(inquiries|product-images|inquiry-attachments)\/([^?#]+)/
  );
  if (match && match[1] && match[2]) {
    try {
      const normalized = normalizeStorageObjectPath(decodeURIComponent(match[2]));
      if (normalized) {
        sets[match[1] as OrphanCleanupBucket].add(normalized);
      }
    } catch {
      const normalized = normalizeStorageObjectPath(match[2]);
      if (normalized) {
        sets[match[1] as OrphanCleanupBucket].add(normalized);
      }
    }
  }
}

export function collectReferencedStoragePathsByBucket(input: {
  productImageUrls: ReadonlyArray<string | null | undefined>;
  inquiryRows: ReadonlyArray<{ images?: unknown; image_url?: unknown }>;
}): Record<OrphanCleanupBucket, Set<string>> {
  const sets: Record<OrphanCleanupBucket, Set<string>> = {
    [STORAGE_BUCKETS.inquiries]: new Set<string>(),
    [STORAGE_BUCKETS.legacyProductImages]: new Set<string>(),
    [STORAGE_BUCKETS.inquiryAttachments]: new Set<string>(),
  };

  const allUrls: string[] = [];
  for (const raw of input.productImageUrls) {
    for (const url of splitImages(raw)) {
      allUrls.push(url);
    }
  }
  for (const row of input.inquiryRows) {
    for (const url of extractInquiryImages(row)) {
      allUrls.push(url);
    }
  }

  const extracted = extractStorageFilesByBucket(allUrls);
  for (const p of extracted.inquiries) {
    const n = normalizeStorageObjectPath(p);
    if (n) sets[STORAGE_BUCKETS.inquiries].add(n);
  }
  for (const p of extracted.productImages) {
    const n = normalizeStorageObjectPath(p);
    if (n) sets[STORAGE_BUCKETS.legacyProductImages].add(n);
  }
  for (const p of extracted.attachments) {
    const n = normalizeStorageObjectPath(p);
    if (n) sets[STORAGE_BUCKETS.inquiryAttachments].add(n);
  }

  for (const url of allUrls) {
    addSignedOrPublicBucketPath(url, sets);
  }

  return sets;
}

export function detectOrphanStorageObjects(
  objects: ReadonlyArray<StorageListedObject>,
  referencedByBucket: Record<OrphanCleanupBucket, ReadonlySet<string>>,
  options?: { minAgeHours?: number; nowMs?: number }
): OrphanDetectionResult {
  const minAgeHours = Math.max(1, Math.min(24 * 90, options?.minAgeHours ?? 24));
  const nowMs = options?.nowMs ?? Date.now();
  const cutoffMs = nowMs - minAgeHours * 60 * 60 * 1000;

  const orphans: OrphanDetectionItem[] = [];
  let totalBytes = 0;
  let skippedTooNewCount = 0;
  let skippedSystemCount = 0;

  const byBucket: Record<OrphanCleanupBucket, { count: number; bytes: number }> = {
    [STORAGE_BUCKETS.inquiries]: { count: 0, bytes: 0 },
    [STORAGE_BUCKETS.legacyProductImages]: { count: 0, bytes: 0 },
    [STORAGE_BUCKETS.inquiryAttachments]: { count: 0, bytes: 0 },
  };

  for (const obj of objects) {
    const normalizedPath = normalizeStorageObjectPath(obj.path);
    if (!normalizedPath || isSystemOrPlaceholderObject(normalizedPath)) {
      skippedSystemCount++;
      continue;
    }

    const refSet = referencedByBucket[obj.bucket];
    if (refSet?.has(normalizedPath)) {
      continue;
    }

    // 타임스탬프가 없거나 파싱 불가한 경우 안전 우선(삭제 제외)
    const tsRaw = obj.updatedAt || obj.createdAt;
    const tsMs = tsRaw ? Date.parse(tsRaw) : Number.NaN;
    if (!Number.isFinite(tsMs) || tsMs > cutoffMs) {
      skippedTooNewCount++;
      continue;
    }

    const sizeBytes =
      typeof obj.sizeBytes === "number" && Number.isFinite(obj.sizeBytes) && obj.sizeBytes > 0
        ? Math.floor(obj.sizeBytes)
        : 0;
    const ageHours = Math.max(0, Math.floor((nowMs - tsMs) / (60 * 60 * 1000)));

    orphans.push({
      bucket: obj.bucket,
      path: normalizedPath,
      sizeBytes,
      createdAt: obj.createdAt ?? null,
      updatedAt: obj.updatedAt ?? null,
      ageHours,
    });
    totalBytes += sizeBytes;
    byBucket[obj.bucket].count += 1;
    byBucket[obj.bucket].bytes += sizeBytes;
  }

  // 오래된 파일부터 안전하게 우선 정리
  orphans.sort((a, b) => b.ageHours - a.ageHours || b.sizeBytes - a.sizeBytes);

  return {
    orphans,
    totalBytes,
    skippedTooNewCount,
    skippedSystemCount,
    byBucket,
  };
}

export function formatBytesCompact(bytes: number): string {
  const safe = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  if (safe < 1024) return `${Math.round(safe)} B`;
  if (safe < 1024 * 1024) return `${(safe / 1024).toFixed(1)} KB`;
  return `${(safe / (1024 * 1024)).toFixed(2)} MB`;
}
