// 파일 경로: lib/product-ops.ts
import { supabase } from "./supabase";
import {
  compressImage,
  extractStorageFilesByBucket,
  STORAGE_BUCKETS,
} from "./site";

/**
 * Storage에 저장된 상품 이미지 파일 목록을 파싱하여 버킷별로 안전하게 파일 삭제
 */
export async function removeProductImagesFromStorage(
  imageUrls: string[]
): Promise<{ deleted: string[]; errors: string[] }> {
  const { inquiries, productImages } = extractStorageFilesByBucket(imageUrls);
  const deleted: string[] = [];
  const errors: string[] = [];

  if (inquiries.length > 0) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.inquiries)
      .remove(inquiries);
    if (error) {
      console.warn("Storage(inquiries) 이미지 삭제 실패:", error.message);
      errors.push(error.message);
    } else if (data) {
      deleted.push(...data.map((d) => d.name));
    }
  }

  if (productImages.length > 0) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.legacyProductImages)
      .remove(productImages);
    if (error) {
      console.warn("Storage(product-images) 이미지 삭제 실패:", error.message);
      errors.push(error.message);
    } else if (data) {
      deleted.push(...data.map((d) => d.name));
    }
  }

  return { deleted, errors };
}

/**
 * 기존 코드베이스와의 호환성을 위한 removeStorageImagesSafe 별칭
 */
export const removeStorageImagesSafe = removeProductImagesFromStorage;

/**
 * 단일 이미지 파일을 최적화 압축 후 Supabase Storage에 업로드하고 public URL을 반환하는 공통 헬퍼
 */
export async function compressAndUploadProductImage(
  file: File,
  options?: {
    maxWidth?: number;
    quality?: number;
    bucket?: string;
    prefix?: string;
  }
): Promise<string> {
  const maxWidth = options?.maxWidth ?? 1600;
  const quality = options?.quality ?? 0.82;
  const bucket = options?.bucket ?? STORAGE_BUCKETS.inquiries;
  const prefix = options?.prefix ?? "product";

  const blob = await compressImage(file, maxWidth, quality);
  const fileName = `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}.jpg`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, { contentType: "image/jpeg" });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * 복수의 이미지 파일을 순차적으로 압축/업로드하여 생성된 public URL 배열 반환
 */
export async function compressAndUploadProductImages(
  files: File[],
  options?: {
    maxWidth?: number;
    quality?: number;
    bucket?: string;
    prefix?: string;
  }
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await compressAndUploadProductImage(file, options);
    urls.push(url);
  }
  return urls;
}
