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

export function isOwnStorageImageUrl(url: string): boolean {
  const base = getPublicStorageBase();
  if (!base || !url.startsWith(base)) return false;
  const rest = url.slice(base.length);
  return (
    rest.startsWith(`${STORAGE_BUCKETS.inquiries}/`) ||
    rest.startsWith(`${STORAGE_BUCKETS.inquiryAttachments}/`)
  );
}

export function sanitizeInquiryImageUrls(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter(
      (url): url is string => typeof url === "string" && isOwnStorageImageUrl(url)
    )
    .slice(0, MAX_IMAGES_PER_INQUIRY);
}

function getAttachmentPath(url: string): string | null {
  const base = getPublicStorageBase();
  const prefix = `${base}${STORAGE_BUCKETS.inquiryAttachments}/`;
  if (!base || !url.startsWith(prefix)) return null;
  const encoded = url.slice(prefix.length).split(/[?#]/)[0];
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
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
