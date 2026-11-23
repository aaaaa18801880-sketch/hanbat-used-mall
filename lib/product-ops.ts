// 파일 경로: lib/product-ops.ts
// 상품·배송사례 이미지 스토리지 처리 및 Supabase CRUD 단일 진입점(SSOT)
import { supabase, revalidateAdminCache } from "./supabase";
import {
  compressImage,
  enhanceImageFile,
  extractStorageFilesByBucket,
  normalizeProductCategory,
  normalizeProductStatus,
  splitImages,
  STORAGE_BUCKETS,
  type ProductCategoryValue,
} from "./site";

type ProductCategory = ProductCategoryValue;
type ProductStatus = ReturnType<typeof normalizeProductStatus>;

/* ════════════════════════════════════════════════════════════
   1. 순수 페이로드 빌더 및 입력 검증 헬퍼
   ════════════════════════════════════════════════════════════ */

/**
 * 가격 입력 문자열/숫자를 정수로 정규화합니다.
 * - 빈 문자열/null/undefined는 0("가격 문의")으로 처리합니다.
 * - 음수 또는 유효하지 않은 숫자는 null을 반환합니다.
 */
export function parseProductPriceInput(
  raw: string | number | null | undefined
): number | null {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) return null;
    return Math.round(raw);
  }
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  if (trimmed.startsWith("-")) return null;
  const digits = trimmed.replace(/[^0-9]/g, "");
  if (!digits) return 0;
  const parsed = Number(digits);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

/**
 * 모델명이 입력되었으나 설명 본문에 아직 포함되지 않은 경우 선두에 모델명 라인을 부착합니다.
 */
export function buildProductDescriptionWithModel(
  description: string | null | undefined,
  modelName?: string | null
): string {
  const cleanDesc = (description || "").trim();
  const cleanModel = (modelName || "").trim();
  if (cleanModel && !cleanDesc.includes("모델명")) {
    return cleanDesc ? `• 모델명: ${cleanModel}\n${cleanDesc}` : `• 모델명: ${cleanModel}`;
  }
  return cleanDesc;
}

export interface ProductMutationPayloadInput {
  title: string;
  category: string;
  status: string;
  price: string | number | null | undefined;
  conditionGrade?: string | null;
  description?: string | null;
  modelName?: string | null;
  imageUrls: readonly string[];
}

export interface ProductMutationPayload {
  title: string;
  category: ProductCategory;
  status: ProductStatus;
  price: number;
  condition_grade: string | null;
  description: string;
  image_url: string;
}

/**
 * 상품 등록/수정용 표준 Supabase 컬럼 페이로드를 생성합니다.
 */
export function buildProductMutationPayload(
  input: ProductMutationPayloadInput
): ProductMutationPayload {
  const title = input.title.trim();
  if (!title) {
    throw new Error("제품명을 입력해 주세요.");
  }

  const imageUrls = input.imageUrls.map((u) => u.trim()).filter(Boolean);
  if (imageUrls.length === 0) {
    throw new Error("최소 1장의 상품 사진을 등록해 주세요.");
  }

  const price = parseProductPriceInput(input.price);
  if (price === null) {
    throw new Error("유효한 판매 가격을 입력해 주세요.");
  }

  return {
    title,
    category: normalizeProductCategory(input.category),
    status: normalizeProductStatus(input.status),
    price,
    condition_grade: input.conditionGrade?.trim() || null,
    description: buildProductDescriptionWithModel(
      input.description,
      input.modelName
    ),
    image_url: imageUrls.join(","),
  };
}

/* ════════════════════════════════════════════════════════════
   2. Supabase Storage 이미지 업로드 및 안전 삭제
   ════════════════════════════════════════════════════════════ */

/**
 * Storage에 저장된 상품 이미지 파일 목록을 파싱하여 버킷별로 안전하게 파일 삭제
 */
export async function removeProductImagesFromStorage(
  imageUrls: string[]
): Promise<{ deleted: string[]; errors: string[] }> {
  const { inquiries, productImages, attachments } =
    extractStorageFilesByBucket(imageUrls);
  const deleted: string[] = [];
  const errors: string[] = [];

  const bucketsToClean: Array<[string, string[]]> = [
    [STORAGE_BUCKETS.inquiries, inquiries],
    [STORAGE_BUCKETS.legacyProductImages, productImages],
    [STORAGE_BUCKETS.inquiryAttachments, attachments],
  ];

  for (const [bucket, paths] of bucketsToClean) {
    if (paths.length === 0) continue;
    const { data, error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      console.warn(`Storage(${bucket}) 이미지 삭제 실패:`, error.message);
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
async function compressAndUploadProductImage(
  file: File,
  options?: {
    maxWidth?: number;
    quality?: number;
    bucket?: string;
    prefix?: string;
    format?: "jpeg" | "webp";
  }
): Promise<string> {
  const maxWidth = options?.maxWidth ?? 1600;
  const quality = options?.quality ?? 0.82;
  const bucket = options?.bucket ?? STORAGE_BUCKETS.inquiries;
  const prefix = options?.prefix ?? "product";
  const targetMime = options?.format === "webp" ? "image/webp" : "image/jpeg";

  const blob = await compressImage(file, maxWidth, quality, targetMime);
  const actualMime =
    blob.type === "image/webp" ? "image/webp" : "image/jpeg";
  const ext = actualMime === "image/webp" ? "webp" : "jpg";
  const baseFileName = `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  // [SEC-002] 고객 첨부 버킷(inquiry-attachments)은 RLS 폴더 정책(inquiries/*)과 일치하도록 경로 보장
  const fileName =
    bucket === STORAGE_BUCKETS.inquiryAttachments &&
    !baseFileName.startsWith("inquiries/")
      ? `inquiries/${baseFileName}`
      : baseFileName;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, { contentType: actualMime });

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
    format?: "jpeg" | "webp";
  }
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await compressAndUploadProductImage(file, options);
    urls.push(url);
  }
  return urls;
}

/* ════════════════════════════════════════════════════════════
   3. 상품 및 배송·설치 사례 통합 CRUD 서비스 (RLS 검증 + 캐시 무효화 포함)
   ════════════════════════════════════════════════════════════ */

export interface CreateProductInput {
  title: string;
  category: string;
  status: string;
  price: string | number | null | undefined;
  conditionGrade?: string | null;
  description?: string | null;
  modelName?: string | null;
  files: File[];
}

export async function createProductRecord(
  input: CreateProductInput
): Promise<ProductMutationPayload> {
  if (!input.title.trim()) {
    throw new Error("제품명을 입력해 주세요.");
  }
  if (input.files.length === 0) {
    throw new Error("최소 1장의 상품 사진을 첨부해 주세요.");
  }
  if (parseProductPriceInput(input.price) === null) {
    throw new Error("유효한 판매 가격을 입력해 주세요.");
  }

  const uploadedUrls = await compressAndUploadProductImages(input.files);
  const payload = buildProductMutationPayload({
    ...input,
    imageUrls: uploadedUrls,
  });

  const { error } = await supabase.from("products").insert({
    ...payload,
    views: 0,
  });

  if (error) {
    await removeProductImagesFromStorage(uploadedUrls).catch(() => {});
    throw error;
  }

  void revalidateAdminCache();
  return payload;
}

export interface UpdateProductInput {
  id: string;
  title: string;
  category: string;
  status: string;
  price: string | number | null | undefined;
  conditionGrade?: string | null;
  description?: string | null;
  modelName?: string | null;
  existingImages: string[];
  originalImages?: string[];
  newFiles?: File[];
}

export async function updateProductRecord(
  input: UpdateProductInput
): Promise<ProductMutationPayload> {
  if (!input.title.trim()) {
    throw new Error("제품명을 입력해 주세요.");
  }
  const newFiles = input.newFiles || [];
  if (input.existingImages.length + newFiles.length === 0) {
    throw new Error("최소 1장의 상품 사진이 필요합니다.");
  }
  if (parseProductPriceInput(input.price) === null) {
    throw new Error("유효한 판매 가격을 입력해 주세요.");
  }

  const newlyUploadedUrls =
    newFiles.length > 0 ? await compressAndUploadProductImages(newFiles) : [];
  const mergedImages = [...input.existingImages, ...newlyUploadedUrls];

  const payload = buildProductMutationPayload({
    ...input,
    imageUrls: mergedImages,
  });

  const { data: updatedRows, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", input.id)
    .select("id");

  if (error) {
    if (newlyUploadedUrls.length > 0) {
      await removeProductImagesFromStorage(newlyUploadedUrls).catch(() => {});
    }
    throw error;
  }

  if (!updatedRows || updatedRows.length === 0) {
    if (newlyUploadedUrls.length > 0) {
      await removeProductImagesFromStorage(newlyUploadedUrls).catch(() => {});
    }
    throw new Error(
      "데이터베이스 수정 권한(RLS)이 없거나 대상 상품을 찾을 수 없습니다."
    );
  }

  const originalUrls = input.originalImages || [];
  const removedUrls = originalUrls.filter(
    (u) => !input.existingImages.includes(u)
  );
  if (removedUrls.length > 0) {
    await removeProductImagesFromStorage(removedUrls).catch(() => {});
  }

  void revalidateAdminCache(input.id);
  return payload;
}

export interface ProductImageIndexReplacement {
  index: number;
  nextUrl: string;
}

/**
 * 기존 상품 사진 URL 배열에서 특정 인덱스만 새 URL로 치환하면서
 * 원래 사진 순서를 100% 보존하고 실제로 교체된 기존 URL만 안전하게 분리합니다.
 */
export function mergeReplacedProductImageUrls(
  originalUrls: readonly string[],
  replacements: readonly ProductImageIndexReplacement[]
): { nextUrls: string[]; removedOldUrls: string[] } {
  const nextUrls = [...originalUrls];
  const candidateRemoved = new Set<string>();

  for (const rep of replacements) {
    if (
      !Number.isInteger(rep.index) ||
      rep.index < 0 ||
      rep.index >= nextUrls.length
    ) {
      continue;
    }
    const cleanNext = rep.nextUrl.trim();
    if (!cleanNext) continue;

    const prevUrl = nextUrls[rep.index];
    if (prevUrl !== cleanNext) {
      if (prevUrl) candidateRemoved.add(prevUrl);
      nextUrls[rep.index] = cleanNext;
    }
  }

  const remainingSet = new Set(nextUrls);
  const removedOldUrls = Array.from(candidateRemoved).filter(
    (url) => !remainingSet.has(url)
  );

  return { nextUrls, removedOldUrls };
}

export async function replaceProductImagesRecord(input: {
  id: string;
  originalUrls: readonly string[];
  replacements: ReadonlyArray<{ index: number; file: File }>;
  uploadOptions?: {
    maxWidth?: number;
    quality?: number;
    prefix?: string;
    format?: "jpeg" | "webp";
  };
}): Promise<{ imageUrl: string; nextUrls: string[]; replacedCount: number }> {
  const validReplacements = input.replacements.filter(
    (r) =>
      Number.isInteger(r.index) &&
      r.index >= 0 &&
      r.index < input.originalUrls.length
  );

  if (validReplacements.length === 0) {
    return {
      imageUrl: input.originalUrls.join(","),
      nextUrls: [...input.originalUrls],
      replacedCount: 0,
    };
  }

  const uploadedUrls = await compressAndUploadProductImages(
    validReplacements.map((r) => r.file),
    input.uploadOptions
  );

  const mappedReplacements: ProductImageIndexReplacement[] =
    validReplacements.map((r, i) => ({
      index: r.index,
      nextUrl: uploadedUrls[i] || "",
    }));

  const { nextUrls, removedOldUrls } = mergeReplacedProductImageUrls(
    input.originalUrls,
    mappedReplacements
  );
  const nextImageUrl = nextUrls.join(",");

  const { data: updatedRows, error } = await supabase
    .from("products")
    .update({ image_url: nextImageUrl })
    .eq("id", input.id)
    .select("id");

  if (error) {
    await removeProductImagesFromStorage(uploadedUrls).catch(() => {});
    throw error;
  }

  if (!updatedRows || updatedRows.length === 0) {
    await removeProductImagesFromStorage(uploadedUrls).catch(() => {});
    throw new Error(
      "이미지 수정 권한(RLS)이 없거나 대상 상품을 찾을 수 없습니다."
    );
  }

  if (removedOldUrls.length > 0) {
    await removeProductImagesFromStorage(removedOldUrls).catch(() => {});
  }

  void revalidateAdminCache(input.id, "media");
  return {
    imageUrl: nextImageUrl,
    nextUrls,
    replacedCount: validReplacements.length,
  };
}

/**
 * 이미 Supabase Storage에 저장된 상품 사진 1장을 관리자 브라우저 캔버스에서 90도 회전한 뒤
 * WebP로 재업로드·DB 교체·기존 파일 정리까지 원자적으로 처리합니다 (Vercel 서버 CPU 소모 0).
 */
export async function rotateExistingProductImageRecord(input: {
  id: string;
  originalUrls: readonly string[];
  imageIndex: number;
  degrees?: 90 | 180 | 270;
}): Promise<{ imageUrl: string; nextUrls: string[] }> {
  const { id, originalUrls, imageIndex, degrees = 90 } = input;
  const targetUrl = originalUrls[imageIndex];
  if (!targetUrl) {
    throw new Error("회전할 상품 사진을 찾을 수 없습니다.");
  }

  const res = await fetch(targetUrl, { mode: "cors", cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`기존 사진을 불러오지 못했습니다 (HTTP ${res.status}).`);
  }

  const rawBlob = await res.blob();
  const rawFile = new File([rawBlob], `product_${imageIndex + 1}.webp`, {
    type: rawBlob.type || "image/webp",
  });

  const rotatedFile = await enhanceImageFile(rawFile, {
    degrees,
    quality: 0.94,
  });

  const replaced = await replaceProductImagesRecord({
    id,
    originalUrls,
    replacements: [{ index: imageIndex, file: rotatedFile }],
    uploadOptions: {
      maxWidth: 1440,
      quality: 0.86,
      prefix: "product_rot",
      format: "webp",
    },
  });

  return {
    imageUrl: replaced.imageUrl,
    nextUrls: replaced.nextUrls,
  };
}

export async function updateProductStatus(
  id: string,
  nextStatus: string
): Promise<ProductStatus> {
  const normalized = normalizeProductStatus(nextStatus);
  const { data: updatedRows, error } = await supabase
    .from("products")
    .update({ status: normalized })
    .eq("id", id)
    .select("id");

  if (error) throw error;
  if (!updatedRows || updatedRows.length === 0) {
    throw new Error("상태 변경 권한(RLS)이 없거나 대상 상품을 찾을 수 없습니다.");
  }

  void revalidateAdminCache(id);
  return normalized;
}

export async function publishPendingProductRecord(input: {
  id: string;
  price: string | number | null | undefined;
  status?: string;
}): Promise<{ price: number; status: ProductStatus }> {
  const parsedPrice = parseProductPriceInput(input.price);
  if (parsedPrice === null) {
    throw new Error("유효한 판매가(원)를 입력해 주세요. 비우면 '가격 문의'로 저장됩니다.");
  }

  const normalized = normalizeProductStatus(input.status || "판매중");
  const { data: updatedRows, error } = await supabase
    .from("products")
    .update({ price: parsedPrice, status: normalized })
    .eq("id", input.id)
    .select("id");

  if (error) throw error;
  if (!updatedRows || updatedRows.length === 0) {
    throw new Error("상품 공개 권한(RLS)이 없거나 대상 상품을 찾을 수 없습니다.");
  }

  void revalidateAdminCache(input.id);
  return { price: parsedPrice, status: normalized };
}

export async function bulkUpdateProductStatus(
  ids: string[],
  nextStatus: string
): Promise<{ status: ProductStatus; updatedCount: number }> {
  const normalized = normalizeProductStatus(nextStatus);
  const { data: updatedRows, error } = await supabase
    .from("products")
    .update({ status: normalized })
    .in("id", ids)
    .select("id");

  if (error) throw error;
  if (!updatedRows || updatedRows.length === 0) {
    throw new Error("상태 변경 권한(RLS)이 없거나 반영되지 않았습니다.");
  }

  void revalidateAdminCache();
  return { status: normalized, updatedCount: updatedRows.length };
}

export async function bulkUpdateProductCategories(
  updates: ReadonlyArray<{ id: string; category: ProductCategory }>
): Promise<{ updatedIds: string[] }> {
  const updatedIds: string[] = [];

  for (const item of updates) {
    const normalizedCategory = normalizeProductCategory(item.category);
    const { data: updatedRows, error } = await supabase
      .from("products")
      .update({ category: normalizedCategory })
      .eq("id", item.id)
      .select("id");

    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error(
        "카테고리 수정 권한(RLS)이 없거나 대상 상품을 찾을 수 없습니다."
      );
    }
    updatedIds.push(item.id);
  }

  if (updatedIds.length > 0) {
    void revalidateAdminCache();
  }
  return { updatedIds };
}

export async function deleteProductRecord(
  id: string,
  imageUrl?: string | null
): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;

  const imgs = splitImages(imageUrl);
  if (imgs.length > 0) {
    await removeProductImagesFromStorage(imgs).catch(() => {});
  }

  void revalidateAdminCache(id);
}

export async function bulkDeleteProductRecords(
  items: ReadonlyArray<{ id: string; image_url?: string | null }>
): Promise<void> {
  const ids = items.map((it) => it.id);
  if (ids.length === 0) return;

  const allImageUrls = items.flatMap((it) => splitImages(it.image_url));
  const { error } = await supabase.from("products").delete().in("id", ids);
  if (error) throw error;

  if (allImageUrls.length > 0) {
    await removeProductImagesFromStorage(allImageUrls).catch(() => {});
  }

  void revalidateAdminCache();
}

export async function createDeliveryCaseRecord({
  title,
  files,
}: {
  title: string;
  files: File[];
}): Promise<void> {
  const cleanTitle = title.trim();
  if (!cleanTitle || files.length === 0) {
    throw new Error("사례 제목과 최소 1장의 현장 사진을 입력해 주세요.");
  }

  const urls = await compressAndUploadProductImages(files, {
    maxWidth: 1600,
    quality: 0.82,
    bucket: STORAGE_BUCKETS.inquiries,
    prefix: "delivery",
  });

  const { error } = await supabase.from("products").insert({
    title: cleanTitle,
    category: "배송인증",
    image_url: urls.join(","),
    price: 0,
    status: "판매중",
  });

  if (error) {
    await removeProductImagesFromStorage(urls).catch(() => {});
    throw error;
  }

  void revalidateAdminCache(undefined, "media");
}

export async function deleteDeliveryCaseRecord(
  id: string | number,
  imageUrl?: string | null
): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;

  const imgs = splitImages(imageUrl);
  if (imgs.length > 0) {
    await removeProductImagesFromStorage(imgs).catch(() => {});
  }

  void revalidateAdminCache(undefined, "media");
}
