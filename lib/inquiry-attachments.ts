// 파일 경로: lib/inquiry-attachments.ts
// 고객 첨부 사진(비공개 버킷)의 서명 URL 발급과 문의 사진 URL 검증을 담당하는 서버 전용 헬퍼입니다.
import type { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKETS } from "./site";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const MAX_IMAGES_PER_INQUIRY = 5;

function getPublicStorageBase(): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
  return base ? `${base}/storage/v1/object/public/` : "";
}

/**
 * Storage 객체 경로 검증 (Path Traversal 및 비정상 경로 차단)
 * - 신규 표준 경로(inquiries/inq_...)와 기존 마이그레이션 경로(inq_...)를 모두 안전하게 허용합니다.
 */
export function isValidStorageObjectPath(objectPath: string): boolean {
  if (!objectPath || objectPath.length > 160) return false;
  if (
    objectPath.includes("..") ||
    objectPath.includes("//") ||
    objectPath.includes("\\") ||
    objectPath.startsWith("/")
  ) {
    return false;
  }
  return /^(?:inquiries\/)?[a-zA-Z0-9._-]+\.(?:jpg|jpeg|png|webp|heic|heif)$/i.test(
    objectPath
  );
}

export function isOwnStorageImageUrl(
  url: string,
  options?: { allowPublicBucket?: boolean }
): boolean {
  const base = getPublicStorageBase();
  if (!base || !url.startsWith(base)) return false;
  const rest = url.slice(base.length);
  const allowPublicBucket = options?.allowPublicBucket ?? true;

  const buckets = allowPublicBucket
    ? [STORAGE_BUCKETS.inquiries, STORAGE_BUCKETS.inquiryAttachments]
    : [STORAGE_BUCKETS.inquiryAttachments];

  for (const bucket of buckets) {
    const prefix = `${bucket}/`;
    if (rest.startsWith(prefix)) {
      const rawPath = rest.slice(prefix.length).split(/[?#]/)[0];
      try {
        const decoded = decodeURIComponent(rawPath);
        if (!isValidStorageObjectPath(decoded)) return false;
        // 일반 고객 문의 첨부 등록 시에는 비공개 버킷 표준 폴더(inquiries/) 경로만 허용합니다.
        if (!allowPublicBucket && !decoded.startsWith("inquiries/")) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    }
  }
  return false;
}

export function sanitizeInquiryImageUrls(
  values: unknown,
  options?: { allowPublicBucket?: boolean }
): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter(
      (url): url is string =>
        typeof url === "string" && isOwnStorageImageUrl(url, options)
    )
    .slice(0, MAX_IMAGES_PER_INQUIRY);
}

export function getAttachmentPath(url: string): string | null {
  const base = getPublicStorageBase();
  const prefix = `${base}${STORAGE_BUCKETS.inquiryAttachments}/`;
  if (!base || !url.startsWith(prefix)) return null;
  const encoded = url.slice(prefix.length).split(/[?#]/)[0];
  if (!encoded) return null;
  try {
    const decoded = decodeURIComponent(encoded);
    return isValidStorageObjectPath(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export async function signInquiryImageLists(
  client: SupabaseClient,
  imageLists: string[][]
): Promise<string[][]> {
  const paths = new Set<string>();
  for (const list of imageLists) {
    for (const url of list) {
      const path = getAttachmentPath(url);
      if (path) paths.add(path);
    }
  }

  const signedByPath = new Map<string, string>();
  if (paths.size > 0) {
    const { data, error } = await client.storage
      .from(STORAGE_BUCKETS.inquiryAttachments)
      .createSignedUrls(Array.from(paths), SIGNED_URL_TTL_SECONDS);
    if (error) {
      console.warn("[inquiry-attachments] 서명 URL 발급 실패:", error.message);
    }
    for (const item of data ?? []) {
      if (item.path && item.signedUrl && !item.error) {
        signedByPath.set(item.path, item.signedUrl);
      }
    }
  }

  return imageLists.map((list) =>
    list.flatMap((url) => {
      const path = getAttachmentPath(url);
      if (path) {
        const signedUrl = signedByPath.get(path);
        return signedUrl ? [signedUrl] : [];
      }
      return isOwnStorageImageUrl(url) ? [url] : [];
    })
  );
}
