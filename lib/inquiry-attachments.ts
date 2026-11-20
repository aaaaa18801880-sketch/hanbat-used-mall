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

const SAFE_UPLOAD_PATH_RE = /^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,199}$/;
const ALLOWED_IMAGE_EXT_RE = /\.(?:jpe?g|png|webp|heic|heif)$/i;

function extractValidatedBucketPath(
  url: string,
  bucket: string,
  strictAsciiName: boolean
): string | null {
  const base = getPublicStorageBase();
  const prefix = `${base}${bucket}/`;
  if (!base || !url.startsWith(prefix)) return null;

  const rawRest = url.slice(prefix.length);
  if (!rawRest || rawRest.includes("?") || rawRest.includes("#")) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(rawRest);
  } catch {
    return null;
  }

  if (
    !decoded ||
    decoded.length > 200 ||
    decoded.includes("..") ||
    decoded.includes("\\") ||
    decoded.startsWith("/") ||
    /[\u0000-\u001f\u007f]/.test(decoded) ||
    !ALLOWED_IMAGE_EXT_RE.test(decoded)
  ) {
    return null;
  }

  if (strictAsciiName && !SAFE_UPLOAD_PATH_RE.test(decoded)) {
    return null;
  }

  // 비공개 문의 첨부 버킷은 RLS 정책상 inquiries/ 하위 폴더만 허용합니다.
  // 신규 등록(strictAsciiName) 시 폴더 경계를 함께 강제해 타 기능 파일 참조를 차단합니다.
  if (
    strictAsciiName &&
    bucket === STORAGE_BUCKETS.inquiryAttachments &&
    !decoded.startsWith("inquiries/")
  ) {
    return null;
  }

  return decoded;
}

export function isOwnStorageImageUrl(
  url: string,
  options?: { allowPublicBucket?: boolean; strictAsciiName?: boolean }
): boolean {
  const allowPublicBucket = options?.allowPublicBucket ?? true;
  const strictAsciiName = options?.strictAsciiName ?? false;

  if (
    extractValidatedBucketPath(
      url,
      STORAGE_BUCKETS.inquiryAttachments,
      strictAsciiName
    ) !== null
  ) {
    return true;
  }

  if (
    allowPublicBucket &&
    extractValidatedBucketPath(
      url,
      STORAGE_BUCKETS.inquiries,
      strictAsciiName
    ) !== null
  ) {
    return true;
  }

  return false;
}

export function sanitizeInquiryImageUrls(
  values: unknown,
  options?: { allowPublicBucket?: boolean }
): string[] {
  if (!Array.isArray(values)) return [];
  const allowPublicBucket = options?.allowPublicBucket ?? true;
  return values
    .filter(
      (url): url is string =>
        typeof url === "string" &&
        isOwnStorageImageUrl(url, {
          allowPublicBucket,
          strictAsciiName: true,
        })
    )
    .slice(0, MAX_IMAGES_PER_INQUIRY);
}

function getAttachmentPath(url: string): string | null {
  return extractValidatedBucketPath(
    url,
    STORAGE_BUCKETS.inquiryAttachments,
    false
  );
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
