"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  supabase,
  isAuthorizedAdminUser,
  getAdminAuthHeaders,
} from "../../lib/supabase";
import {
  STORE,
  telHref,
  splitImages,
  compressImage,
  validateImageFiles,
  MAX_PHOTOS,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS,
  STORAGE_BUCKETS,
  isProductSold,
  isProductReserved,
  normalizeProductStatus,
  normalizeProductCategory,
  hasProductPrice,
  formatProductPrice,
  extractModelName,
  extractStorageFilesByBucket,
  trackEvent,
} from "../../lib/site";

import {
  Icon,
  ICON,
  SafeImg,
  Modal,
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
} from "../../lib/ui";
import {
  ProductCard,
  ProductTrustMicroStrip,
  type ProductItem,
} from "../../components/products/product-card";
import { ProductStatusBadge } from "../../components/products/product-status-badge";

type SortOption = "latest" | "views" | "priceAsc" | "priceDesc";
type StatusFilter = "all" | "selling" | "reserved" | "sold";

const CATEGORIES_WITH_ALL = ["전체", ...PRODUCT_CATEGORIES] as const;
const PAGE_STEP = 24;

const EditIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3.5 h-3.5"
    aria-hidden="true"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

/** Storage에 저장된 상품 이미지 파일 정리 (오류 무시 금지) */
async function removeProductImagesFromStorage(imageUrls: string[]) {
  const { inquiries, productImages } = extractStorageFilesByBucket(imageUrls);

  if (inquiries.length > 0) {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.inquiries)
      .remove(inquiries);
    if (error) {
      console.warn("Storage(inquiries) 이미지 삭제 경고:", error.message);
      toast.error(
        "상품 레코드는 삭제되었으나 일부 이미지 파일 정리에 실패했습니다."
      );
    }
  }

  if (productImages.length > 0) {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.legacyProductImages)
      .remove(productImages);
    if (error) {
      console.warn("Storage(product-images) 이미지 삭제 경고:", error.message);
    }
  }
}

/* ════════════════════════════════════════════════════════════
   상세 보기 및 관리자 단건 수정 모달 (사진 순서 변경·추가·삭제 지원)
   ════════════════════════════════════════════════════════════ */
function ProductDetailModal({
  product,
  isAdmin,
  onClose,
  onProductUpdated,
  onDeleteProduct,
}: {
  product: ProductItem;
  isAdmin: boolean;
  onClose: () => void;
  onProductUpdated: (updated: ProductItem) => void;
  onDeleteProduct: (id: string) => void;
}) {
  const images = splitImages(product.image_url);
  const displayImages = images.length > 0 ? images : [""];
  const [idx, setIdx] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(product.title);
  const [editCategory, setEditCategory] = useState<string>(
    normalizeProductCategory(product.category)
  );
  const [editPrice, setEditPrice] = useState(
    product.price && product.price > 0 ? String(product.price) : ""
  );
  const [editStatus, setEditStatus] = useState<string>(
    normalizeProductStatus(product.status)
  );
  const [editDescription, setEditDescription] = useState(
    product.description || ""
  );
  const [editExistingImages, setEditExistingImages] = useState<string[]>(images);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [editNewPreviews, setEditNewPreviews] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const go = useCallback(
    (d: number) => {
      if (displayImages.length < 2) return;
      setIdx((i) => (i + d + displayImages.length) % displayImages.length);
    },
    [displayImages.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isZoomOpen) {
        e.stopPropagation();
        setIsZoomOpen(false);
        return;
      }
      if (isEditing || displayImages.length < 2) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [displayImages.length, go, isEditing, isZoomOpen]);

  const currentStatus = isEditing ? editStatus : product.status;
  const sold = isProductSold(currentStatus);
  const categoryLabel = normalizeProductCategory(product.category);
  const modelName = extractModelName(product.description, product.title);

  const moveExistingImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= editExistingImages.length) return;
    setEditExistingImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const makePrimaryExistingImage = (targetIdx: number) => {
    if (targetIdx <= 0 || targetIdx >= editExistingImages.length) return;
    setEditExistingImages((prev) => {
      const next = [...prev];
      const [picked] = next.splice(targetIdx, 1);
      return [picked, ...next];
    });
  };

  const removeExistingImage = (targetIdx: number) => {
    setEditExistingImages((prev) => prev.filter((_, i) => i !== targetIdx));
  };

  const handleAddEditFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files);
    e.target.value = "";
    const remainingSlots =
      MAX_PHOTOS - (editExistingImages.length + editNewFiles.length);
    if (remainingSlots <= 0) {
      toast.error(`사진은 최대 ${MAX_PHOTOS}장까지 등록할 수 있습니다.`);
      return;
    }
    const { ok, error } = validateImageFiles(picked, remainingSlots);
    if (error) toast.error(error);
    if (ok.length === 0) return;

    setEditNewFiles((prev) => [...prev, ...ok]);
    setEditNewPreviews((prev) => [
      ...prev,
      ...ok.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeNewEditFile = (targetIdx: number) => {
    URL.revokeObjectURL(editNewPreviews[targetIdx]);
    setEditNewFiles((prev) => prev.filter((_, i) => i !== targetIdx));
    setEditNewPreviews((prev) => prev.filter((_, i) => i !== targetIdx));
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error("제품명을 입력해 주세요.");
      return;
    }
    if (editExistingImages.length + editNewFiles.length === 0) {
      toast.error("최소 1장의 상품 사진이 필요합니다.");
      return;
    }

    const numericPrice = editPrice
      ? Number(editPrice.replace(/[^0-9]/g, ""))
      : 0;
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      toast.error("유효한 판매 가격을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const newlyUploadedUrls: string[] = [];
      for (const file of editNewFiles) {
        const blob = await compressImage(file);
        const fileName = `product_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .upload(fileName, blob, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        newlyUploadedUrls.push(
          supabase.storage
            .from(STORAGE_BUCKETS.inquiries)
            .getPublicUrl(fileName).data.publicUrl
        );
      }

      const finalImages = [...editExistingImages, ...newlyUploadedUrls];
      const finalImageUrl = finalImages.join(",");
      const normalizedCat = normalizeProductCategory(editCategory);
      const normalizedStat = normalizeProductStatus(editStatus);

      const { data: updatedRows, error } = await supabase
        .from("products")
        .update({
          title: editTitle.trim(),
          category: normalizedCat,
          price: numericPrice,
          status: normalizedStat,
          description: editDescription.trim(),
          image_url: finalImageUrl,
        })
        .eq("id", product.id)
        .select();

      if (error) throw error;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error(
          "데이터베이스 수정 권한(RLS)이 없거나 대상 상품을 찾을 수 없습니다."
        );
      }

      // 기존 사진 중 제거된 파일이 있다면 Storage에서도 정리
      const removedUrls = images.filter((u) => !editExistingImages.includes(u));
      if (removedUrls.length > 0) {
        await removeProductImagesFromStorage(removedUrls);
      }

      editNewPreviews.forEach((u) => URL.revokeObjectURL(u));
      setEditNewFiles([]);
      setEditNewPreviews([]);

      const updated: ProductItem = {
        ...product,
        title: editTitle.trim(),
        category: normalizedCat,
        price: numericPrice,
        status: normalizedStat,
        description: editDescription.trim(),
        image_url: finalImageUrl,
      };

      onProductUpdated(updated);
      setIdx(0);
      setIsEditing(false);
      toast.success("상품 정보가 저장되었습니다.");
    } catch (err: unknown) {
      toast.error(
        "저장 실패: " +
          (err instanceof Error ? err.message : "오류가 발생했습니다.")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    editNewPreviews.forEach((u) => URL.revokeObjectURL(u));
    setEditNewFiles([]);
    setEditNewPreviews([]);
    setEditExistingImages(images);
    setEditTitle(product.title);
    setEditCategory(normalizeProductCategory(product.category));
    setEditPrice(
      product.price && product.price > 0 ? String(product.price) : ""
    );
    setEditStatus(normalizeProductStatus(product.status));
    setEditDescription(product.description || "");
    setIsEditing(false);
  };

    const inquiryParams = new URLSearchParams({
    write: "1",
    type: "구매 문의",
    productId: String(product.id),
    title: `[상품문의] ${product.title}`,
    category: categoryLabel,
  });
  if (modelName) {
    inquiryParams.set("model", modelName);
  }
  const inquiryHref = `/inquiry?${inquiryParams.toString()}`;

  return (
    <>
      <Modal
        open={true}
        onClose={onClose}
        label={`${product.title} 상세 정보`}
        panelClassName="max-w-xl"
      >
        <div className="bg-white rounded-lg shadow-2xl border border-[#E4E0D8] flex flex-col overflow-hidden max-h-[90vh] w-full">
          {/* 모달 상단 헤더 */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E4E0D8] bg-white sticky top-0 z-20">
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <span className="text-[12px] font-bold text-[#4B5260] bg-[#F6F5F2] border border-[#E4E0D8] px-2.5 py-1 rounded-sm">
                    {categoryLabel}
                  </span>
                  <ProductStatusBadge
                    status={product.status}
                    createdAt={product.created_at}
                  />
                </>
              ) : (
                <span className="text-[12px] font-bold text-[#D9531E] bg-[#FFF5F0] border border-[#FADCD0] px-2.5 py-1 rounded-sm">
                  상품 정보 및 사진 편집 모드
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && !isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 text-[12px] font-bold text-[#0E1A2B] bg-[#F6F5F2] hover:bg-[#EFECE6] border border-[#DDD9D1] px-2.5 py-1.5 rounded transition-colors"
                  >
                    <EditIcon /> 수정
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(product.id)}
                    className="inline-flex items-center gap-1 text-[12px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded transition-colors"
                  >
                    삭제
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="text-[#6B7280] hover:text-[#0E1A2B] transition-colors p-1"
              >
                <Icon d={ICON.close} className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 모달 본문 */}
          <div className="overflow-y-auto flex-1">
            {!isEditing && (
              <>
                <div
                  onClick={() => displayImages[0] && setIsZoomOpen(true)}
                  className="relative w-full h-[300px] sm:h-[370px] bg-[#F6F5F2] border-b border-[#E4E0D8] flex items-center justify-center p-3 overflow-hidden cursor-zoom-in group select-none"
                  title="클릭하여 전체화면으로 확대"
                >
                  <SafeImg
                    key={displayImages[idx]}
                    src={displayImages[idx]}
                    alt={product.title}
                    eager
                    className={`max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02] ${
                      sold ? "grayscale opacity-75" : ""
                    }`}
                  />

                  {sold && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0E1A2B]/45">
                      <span className="px-5 py-2 rounded-sm bg-[#0E1A2B]/90 text-white text-[14px] font-bold tracking-[0.2em] border border-white/20">
                        판매완료
                      </span>
                    </div>
                  )}

                  {displayImages[0] && (
                    <div className="absolute top-3 right-3 bg-black/65 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none">
                      <Icon d={ICON.search} className="w-3.5 h-3.5" />
                      <span>클릭하여 확대</span>
                    </div>
                  )}

                  {displayImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          go(-1);
                        }}
                        aria-label="이전 사진"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 text-[#0E1A2B] shadow-md flex items-center justify-center hover:bg-white z-10"
                      >
                        <Icon d={ICON.left} className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          go(1);
                        }}
                        aria-label="다음 사진"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 text-[#0E1A2B] shadow-md flex items-center justify-center hover:bg-white z-10"
                      >
                        <Icon d={ICON.right} className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-3 right-3 bg-black/75 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full z-10 pointer-events-none">
                        {idx + 1} / {displayImages.length}
                      </span>
                    </>
                  )}
                </div>

                {displayImages.length > 1 && (
                  <div className="flex gap-2 p-3 bg-[#FAF9F7] border-b border-[#E4E0D8] overflow-x-auto">
                    {displayImages.map((img, i) => (
                      <button
                        key={img + i}
                        type="button"
                        onClick={() => setIdx(i)}
                        aria-label={`${i + 1}번 사진 보기`}
                        className={`relative w-14 h-14 shrink-0 rounded overflow-hidden bg-white border transition-all ${
                          i === idx
                            ? "border-[#D9531E] ring-2 ring-[#D9531E]/40"
                            : "border-[#E4E0D8] opacity-60 hover:opacity-100"
                        }`}
                      >
                        <SafeImg
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="p-5 sm:p-6 space-y-5">
              {isEditing ? (
                <div className="space-y-4">
                  {/* 사진 순서 변경 및 대표 이미지 지정 UI */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="hb-label">
                        등록된 사진 관리 ({editExistingImages.length + editNewFiles.length}/{MAX_PHOTOS}장)
                      </span>
                      <span className="text-[11px] font-semibold text-[#D9531E]">
                        맨 앞(1번) 사진이 대표 이미지입니다
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {editExistingImages.map((imgUrl, i) => (
                        <div
                          key={imgUrl + i}
                          className="relative flex flex-col overflow-hidden rounded border border-[#DDD9D1] bg-[#FAF9F7]"
                        >
                          <div className="relative aspect-square w-full bg-[#EFECE6]">
                            <SafeImg
                              src={imgUrl}
                              alt={`기존 사진 ${i + 1}`}
                              className="h-full w-full object-cover"
                            />
                            {i === 0 ? (
                              <span className="absolute left-1.5 top-1.5 rounded-sm bg-[#D9531E] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                대표
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => makePrimaryExistingImage(i)}
                                className="absolute left-1.5 top-1.5 rounded-sm bg-[#0E1A2B]/85 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-[#D9531E]"
                              >
                                대표 지정
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeExistingImage(i)}
                              aria-label="사진 삭제"
                              className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600"
                            >
                              <Icon d={ICON.close} className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-[#E4E0D8] border-t border-[#E4E0D8] bg-white text-[11px] font-bold text-[#4B5260]">
                            <button
                              type="button"
                              disabled={i === 0}
                              onClick={() => moveExistingImage(i, i - 1)}
                              className="py-1 hover:bg-[#F6F5F2] disabled:opacity-30"
                            >
                              ← 앞으로
                            </button>
                            <button
                              type="button"
                              disabled={i === editExistingImages.length - 1}
                              onClick={() => moveExistingImage(i, i + 1)}
                              className="py-1 hover:bg-[#F6F5F2] disabled:opacity-30"
                            >
                              뒤로 →
                            </button>
                          </div>
                        </div>
                      ))}

                      {editNewPreviews.map((preview, i) => (
                        <div
                          key={preview}
                          className="relative aspect-square overflow-hidden rounded border border-[#D9531E] bg-[#EFECE6]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preview}
                            alt={`추가 사진 ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute left-1.5 top-1.5 rounded-sm bg-[#0E1A2B] px-1.5 py-0.5 text-[10px] font-bold text-white">
                            신규 추가
                          </span>
                          <button
                            type="button"
                            onClick={() => removeNewEditFile(i)}
                            aria-label="추가 사진 삭제"
                            className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600"
                          >
                            <Icon d={ICON.close} className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {editExistingImages.length + editNewFiles.length <
                        MAX_PHOTOS && (
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-[#CFCAC0] bg-[#FAF9F7] text-[11px] font-semibold text-[#6B7280] hover:border-[#0E1A2B] hover:text-[#0E1A2B]">
                          <Icon d={ICON.plus} className="h-5 w-5" />
                          <span>사진 추가</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleAddEditFiles}
                            className="sr-only"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="hb-label">카테고리</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="hb-input mt-1 text-[14px] font-semibold"
                      >
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="hb-label">판매 상태</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="hb-input mt-1 text-[14px] font-semibold"
                      >
                        <option value={PRODUCT_STATUS.SELLING}>판매중</option>
                        <option value={PRODUCT_STATUS.RESERVED}>예약중</option>
                        <option value={PRODUCT_STATUS.SOLD}>판매완료</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="hb-label">제품명 *</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="hb-input mt-1"
                      placeholder="제품명을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="hb-label">판매 가격 (원)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        editPrice ? Number(editPrice).toLocaleString() : ""
                      }
                      onChange={(e) =>
                        setEditPrice(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      className="hb-input mt-1"
                      placeholder="비워두면 카테고리별 맞춤 상담 문구로 표시됩니다"
                    />
                  </div>

                  <div>
                    <label className="hb-label">제품 규격 및 상세 설명</label>
                    <textarea
                      rows={8}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="hb-input mt-1 font-mono text-[13.5px] leading-relaxed resize-y"
                      placeholder="특징 및 사양 내용을 수정하세요"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-[20px] sm:text-[22px] font-bold text-[#0E1A2B] leading-snug tracking-tight">
                      {product.title}
                    </h2>
                    {modelName && (
                      <p className="mt-1.5 text-[13px] font-semibold text-[#4B5260]">
                        모델명:{" "}
                        <span className="font-mono text-[#0E1A2B]">
                          {modelName}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF9F7] p-4 rounded-md border border-[#E4E0D8]">
                    <div>
                      <span className="text-[11px] font-semibold text-[#6B7280] block mb-0.5">
                        판매 가격
                      </span>
                      {sold ? (
                        <p className="text-[24px] font-bold text-[#8A8478]">
                          판매완료
                        </p>
                      ) : hasProductPrice(product.price) ? (
                        <p className="text-[24px] sm:text-[26px] font-bold tracking-tight text-[#D9531E]">
                          {formatProductPrice(product.price, categoryLabel)}
                        </p>
                      ) : (
                        <a
                          href={telHref(STORE.tel)}
                          className="inline-flex items-center gap-2 text-[20px] sm:text-[22px] font-bold text-[#D9531E] hover:text-[#BF4715]"
                        >
                          <span className="underline underline-offset-4">
                            {formatProductPrice(product.price, categoryLabel)}
                          </span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[12.5px] font-semibold text-[#6B7280]">
                        조회 <strong className="text-[#0E1A2B]">{product.views || 0}</strong>회
                      </span>
                      <Link
                        href={`/${product.id}`}
                        className="rounded border border-[#DDD9D1] bg-white px-3 py-1.5 text-[12px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B]"
                      >
                        개별 상세페이지 →
                      </Link>
                    </div>
                  </div>

                  {/* 핵심 가치 아이콘 바 (Trust Micro-strip) */}
                  <ProductTrustMicroStrip category={categoryLabel} />

                  {product.description && (
                    <div className="p-4 rounded-md bg-[#FAF9F7] border border-[#E4E0D8]">
                      <span className="text-[12px] font-bold text-[#6B7280] block mb-1.5">
                        제품 규격 및 상세 설명
                      </span>
                      <p className="text-[14px] text-[#1F2530] whitespace-pre-wrap leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}

                  <ul className="text-[13px] text-[#4B5260] space-y-1.5 bg-[#FAF9F7] rounded-md p-4 border border-[#E4E0D8]">
                    <li className="flex items-start gap-2">
                      <Icon
                        d={ICON.check}
                        className="w-4 h-4 text-[#D9531E] mt-0.5 shrink-0"
                      />
                      <span>세척·작동 점검을 마친 실매물이며 매장에서 직접 확인 가능합니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon
                        d={ICON.check}
                        className="w-4 h-4 text-[#D9531E] mt-0.5 shrink-0"
                      />
                      <span>세금계산서 발행 및 지역·환경별 배송·설치 상담을 지원합니다.</span>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* 모달 하단 액션 바 */}
          <div className="p-4 border-t border-[#E4E0D8] bg-white shrink-0">
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="hb-btn-outline h-11 text-[14px]"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="hb-btn-primary h-11 text-[14px]"
                >
                  {isSaving ? "저장 중..." : "변경사항 저장"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <a
                  href={telHref(STORE.tel)}
                  className="hb-btn-primary h-11 text-[13.5px]"
                >
                  <Icon d={ICON.phone} className="w-4 h-4 text-[#D9531E]" /> 전화 문의
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-11 text-[13.5px]"
                >
                  <Icon d={ICON.chat} className="w-4 h-4" /> 카톡 상담
                </a>
                <Link
                  href={inquiryHref}
                  className="hb-btn-outline h-11 text-[13.5px]"
                >
                  <Icon d={ICON.pen} className="w-4 h-4 text-[#D9531E]" /> 온라인 문의
                </Link>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 전체화면 확대 라이트박스 */}
      {isZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="사진 전체화면 확대 보기"
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-[90] bg-black/95 flex flex-col items-center justify-center p-4 select-none"
        >
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20">
            <span className="text-[13px] font-semibold bg-white/15 px-3 py-1 rounded-full">
              {idx + 1} / {displayImages.length}
            </span>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white"
              aria-label="닫기"
            >
              <Icon d={ICON.close} className="w-6 h-6" />
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-full max-h-[82vh] flex items-center justify-center"
          >
            <SafeImg
              src={displayImages[idx]}
              alt={product.title}
              eager
              className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded"
            />
          </div>

          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center z-20"
                aria-label="이전 사진"
              >
                <Icon d={ICON.left} className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center z-20"
                aria-label="다음 사진"
              >
                <Icon d={ICON.right} className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   메인 갤러리 페이지 컴포넌트
   ════════════════════════════════════════════════════════════ */
export default function GalleryPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  /* 검색·필터·정렬·페이지네이션 상태 */
  const [activeCategory, setActiveCategory] = useState<string>("전체");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("latest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_STEP);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(
    null
  );

  /* 일괄 선택 관리 상태 */
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  /* 관리자 로그인 모달 */
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  /* 관리자 상품 등록 모달 상태 */
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [productTitle, setProductTitle] = useState("");
  const [productModel, setProductModel] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState<string>(
    PRODUCT_CATEGORIES[0]
  );
  const [productPrice, setProductPrice] = useState("");
  const [productStatus, setProductStatus] = useState<string>(
    PRODUCT_STATUS.SELLING
  );
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /* AI 판독 결과 구분 상태 */
  const [searchSpecs, setSearchSpecs] = useState(true);
  const [photoObserved, setPhotoObserved] = useState<string[]>([]);
  const [searchDerivedSpecs, setSearchDerivedSpecs] = useState<string[]>([]);
  const [reviewWarnings, setReviewWarnings] = useState<string[]>([]);
  const [foundSources, setFoundSources] = useState<string[]>([]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .neq("category", "배송인증")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProducts((data ?? []) as ProductItem[]);
    } catch (err) {
      console.error("제품 목록 조회 실패:", err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* 초기 URL 쿼리 파싱 및 세션 감시 */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      queueMicrotask(() => {
        const catParam = params.get("category");
        if (catParam) {
          const normalized =
            catParam === "전체" ? "전체" : normalizeProductCategory(catParam);
          if ((CATEGORIES_WITH_ALL as readonly string[]).includes(normalized)) {
            setActiveCategory(normalized);
          }
        }
        const qParam = params.get("q");
        if (qParam) setSearch(qParam);

        const sortParam = params.get("sort") as SortOption | null;
        if (
          sortParam &&
          ["latest", "views", "priceAsc", "priceDesc"].includes(sortParam)
        ) {
          setSort(sortParam);
        }

        const statusParam = params.get("status") as StatusFilter | null;
        if (
          statusParam &&
          ["all", "selling", "reserved", "sold"].includes(statusParam)
        ) {
          setStatusFilter(statusParam);
        }
      });
    }

    supabase.auth
      .getSession()
      .then(({ data }) =>
        setIsAdmin(isAuthorizedAdminUser(data.session?.user))
      );

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const authorized = isAuthorizedAdminUser(session?.user);
        setIsAdmin(authorized);
        if (!authorized) {
          setIsSelectMode(false);
          setSelectedIds(new Set());
        }
      }
    );

    queueMicrotask(() => {
      void fetchProducts();
    });
    return () => authListener.subscription.unsubscribe();
  }, [fetchProducts]);

  /* 필터 상태 변경 시 URL 쿼리 파라미터 동기화 (새로고침 시 유지) */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);

    if (activeCategory && activeCategory !== "전체") {
      url.searchParams.set("category", activeCategory);
    } else {
      url.searchParams.delete("category");
    }

    if (search.trim()) {
      url.searchParams.set("q", search.trim());
    } else {
      url.searchParams.delete("q");
    }

    if (sort !== "latest") {
      url.searchParams.set("sort", sort);
    } else {
      url.searchParams.delete("sort");
    }

    if (statusFilter !== "all") {
      url.searchParams.set("status", statusFilter);
    } else {
      url.searchParams.delete("status");
    }

    window.history.replaceState(null, "", url.toString());
  }, [activeCategory, search, sort, statusFilter]);

  /* 카테고리별 개수 및 상태별 개수 계산 */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 전체: products.length };
    products.forEach((p) => {
      const key = normalizeProductCategory(p.category);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [products]);

  const sellingCount = useMemo(
    () => products.filter((p) => !isProductSold(p.status)).length,
    [products]
  );

  /* 필터링 및 정렬된 상품 목록 (제품명 + 모델명 통합 검색) */
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = products.filter((p) => {
      const cat = normalizeProductCategory(p.category);
      if (activeCategory !== "전체" && cat !== activeCategory) return false;

      const sold = isProductSold(p.status);
      const reserved = isProductReserved(p.status);
      if (statusFilter === "selling" && (sold || reserved)) return false;
      if (statusFilter === "reserved" && !reserved) return false;
      if (statusFilter === "sold" && !sold) return false;

      if (q) {
        const titleText = (p.title || "").toLowerCase();
        const modelText = (
          extractModelName(p.description, p.title) || ""
        ).toLowerCase();
        const descText = (p.description || "").toLowerCase();
        if (
          !titleText.includes(q) &&
          !modelText.includes(q) &&
          !descText.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });

    const MAX = Number.MAX_SAFE_INTEGER;
    return [...list].sort((a, b) => {
      const soldA = isProductSold(a.status) ? 1 : 0;
      const soldB = isProductSold(b.status) ? 1 : 0;
      if (soldA !== soldB) return soldA - soldB;

      if (sort === "priceAsc") {
        return (
          (hasProductPrice(a.price) ? a.price! : MAX) -
          (hasProductPrice(b.price) ? b.price! : MAX)
        );
      }
      if (sort === "priceDesc") {
        return (b.price || 0) - (a.price || 0);
      }
      if (sort === "views") {
        return (b.views || 0) - (a.views || 0);
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [products, activeCategory, statusFilter, search, sort]);

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, visibleLimit),
    [filteredProducts, visibleLimit]
  );

  const resetFilters = () => {
    setActiveCategory("전체");
    setSearch("");
    setStatusFilter("all");
    setSort("latest");
    setVisibleLimit(PAGE_STEP);
  };

  /* 카드 클릭 시 상세 모달 오픈 및 조회수 증가 (DB 실패 시 정확히 롤백) */
  const handleProductClick = async (product: ProductItem) => {
    if (isSelectMode) {
      toggleSelectProduct(product.id);
      return;
    }

    setSelectedProduct(product);
    trackEvent("view_item", {
      category: normalizeProductCategory(product.category),
      status: normalizeProductStatus(product.status),
    });

    const prevViews = product.views || 0;
    try {
      const viewedStr = sessionStorage.getItem("viewed_products") || "[]";
      const viewedList = JSON.parse(viewedStr) as string[];
      if (viewedList.includes(product.id)) return;

      const newViews = prevViews + 1;
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, views: newViews } : p))
      );
      setSelectedProduct((prev) =>
        prev && prev.id === product.id ? { ...prev, views: newViews } : prev
      );

      const res = await fetch(`/api/products/${product.id}/view`, {
        method: "POST",
      });
      if (!res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, views: prevViews } : p
          )
        );
        setSelectedProduct((prev) =>
          prev && prev.id === product.id ? { ...prev, views: prevViews } : prev
        );
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        views?: number;
      } | null;
      const confirmedViews =
        data && typeof data.views === "number" ? data.views : newViews;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, views: confirmedViews } : p
        )
      );
      setSelectedProduct((prev) =>
        prev && prev.id === product.id
          ? { ...prev, views: confirmedViews }
          : prev
      );

      const nextStr = sessionStorage.getItem("viewed_products") || "[]";
      const nextList = JSON.parse(nextStr) as string[];
      if (!nextList.includes(product.id)) {
        nextList.push(product.id);
        sessionStorage.setItem("viewed_products", JSON.stringify(nextList));
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, views: prevViews } : p))
      );
    }
  };


  const handleProductUpdated = (updated: ProductItem) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setSelectedProduct(updated);
  };

  /* ───── 일괄 선택 및 상태 변경/삭제 (DB 성공 후에만 반영) ───── */
  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleBulkStatusChange = async (
    targetStatus: "판매중" | "예약중" | "판매완료"
  ) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setIsBulkLoading(true);
    const toastId = toast.loading(
      `${ids.length}개 상품 상태를 '${targetStatus}'(으)로 변경 중...`
    );

    try {
      const { data: updatedRows, error } = await supabase
        .from("products")
        .update({ status: targetStatus })
        .in("id", ids)
        .select("id");

      if (error) throw error;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("상태 변경 권한(RLS)이 없거나 반영되지 않았습니다.");
      }

      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.has(p.id) ? { ...p, status: targetStatus } : p
        )
      );
      toast.success(
        `${updatedRows.length}개 상품이 '${targetStatus}' 처리되었습니다.`,
        { id: toastId }
      );
      setSelectedIds(new Set());
    } catch (err: unknown) {
      toast.error(
        "상태 변경 실패: " +
          (err instanceof Error ? err.message : "알 수 없는 오류"),
        { id: toastId }
      );
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (
      !confirm(
        `선택한 ${ids.length}개의 상품을 영구 삭제하시겠습니까? (복구할 수 없습니다)`
      )
    )
      return;

    setIsBulkLoading(true);
    const toastId = toast.loading(`${ids.length}개 상품 삭제 중...`);

    try {
      const targetProducts = products.filter((p) => selectedIds.has(p.id));
      const allImageUrls = targetProducts.flatMap((p) =>
        splitImages(p.image_url)
      );

      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;

      if (allImageUrls.length > 0) {
        await removeProductImagesFromStorage(allImageUrls);
      }

      setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      toast.success(`${ids.length}개 상품이 삭제되었습니다.`, { id: toastId });
      setSelectedIds(new Set());
    } catch (err: unknown) {
      toast.error(
        "삭제 실패: " +
          (err instanceof Error ? err.message : "알 수 없는 오류"),
        { id: toastId }
      );
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (
      !confirm(
        `'${target?.title || "이 상품"}'을(를) 영구 삭제하시겠습니까?`
      )
    )
      return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;

      if (target?.image_url) {
        await removeProductImagesFromStorage(splitImages(target.image_url));
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
      }
      toast.success("상품이 삭제되었습니다.");
    } catch (error: unknown) {
      toast.error(
        "삭제 실패: " +
          (error instanceof Error ? error.message : "알 수 없는 오류")
      );
    }
  };

  /* ───── 관리자 인증 ───── */
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });
      if (error) throw error;
      if (!isAuthorizedAdminUser(data.user)) {
        await supabase.auth.signOut();
        toast.error("관리자 권한이 허용되지 않은 계정입니다.");
        return;
      }
      toast.success("관리자로 로그인했습니다.");
      setIsAdminAuthModalOpen(false);
      setAdminEmail("");
      setAdminPassword("");
    } catch {
      toast.error("로그인 실패: 이메일이나 비밀번호를 확인해 주세요.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    if (confirm("관리자 모드를 종료하시겠습니까?")) {
      await supabase.auth.signOut();
      setIsSelectMode(false);
      setSelectedIds(new Set());
      toast.success("관리자 모드가 종료되었습니다.");
    }
  };

  /* ───── 관리자 신규 상품 등록 및 사진 순서·AI 분석 ───── */
  const resetUploadForm = () => {
    productPreviews.forEach((u) => URL.revokeObjectURL(u));
    setProductTitle("");
    setProductModel("");
    setProductDescription("");
    setProductPrice("");
    setProductStatus(PRODUCT_STATUS.SELLING);
    setProductFiles([]);
    setProductPreviews([]);
    setPhotoObserved([]);
    setSearchDerivedSpecs([]);
    setReviewWarnings([]);
    setFoundSources([]);
    setSearchSpecs(true);
    setIsAnalyzing(false);
  };

  const analyzeImageWithAI = async (filesToAnalyze: File[]) => {
    if (filesToAnalyze.length === 0) return;
    setIsAnalyzing(true);
    const toastId = toast.loading(
      searchSpecs
        ? "AI가 사진을 판독하고 공식 제원을 검색 중입니다..."
        : "AI가 사진 속 모델명과 외관을 판독 중입니다..."
    );

    try {
      const formData = new FormData();
      formData.append("category", productCategory);
      formData.append("searchSpecs", searchSpecs ? "true" : "false");

      for (const file of filesToAnalyze.slice(0, MAX_PHOTOS)) {
        const compressedBlob = await compressImage(file);
        const optimizedFile = new File([compressedBlob], file.name, {
          type: "image/jpeg",
        });
        formData.append("files", optimizedFile);
      }

      const authHeaders = await getAdminAuthHeaders();
      const res = await fetch("/api/analyze-product", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "분석 요청에 실패했습니다.");
      }

      if (
        data.category &&
        (PRODUCT_CATEGORIES as readonly string[]).includes(data.category)
      ) {
        setProductCategory(data.category);
      }
      if (data.title) setProductTitle(data.title);
      if (data.modelNumber) setProductModel(data.modelNumber);
      if (data.specDetails) setProductDescription(data.specDetails);

      setPhotoObserved(
        Array.isArray(data.photoObserved) ? data.photoObserved : []
      );
      setSearchDerivedSpecs(
        Array.isArray(data.searchDerivedSpecs) ? data.searchDerivedSpecs : []
      );
      setReviewWarnings(
        Array.isArray(data.needsReview) ? data.needsReview : []
      );
      setFoundSources(Array.isArray(data.sourceUrls) ? data.sourceUrls : []);

      toast.success(
        "AI 초안이 작성되었습니다. 검토 필요 항목을 확인해 주세요.",
        { id: toastId }
      );
    } catch (error: unknown) {
      console.error("AI 분석 오류:", error);
      toast.error(
        (error instanceof Error && error.message) ||
          "자동 분석에 실패했습니다. 직접 입력해 주세요.",
        { id: toastId }
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    e.target.value = "";
    const remaining = MAX_PHOTOS - productFiles.length;
    if (remaining <= 0) {
      toast.error(`사진은 최대 ${MAX_PHOTOS}장까지 등록 가능합니다.`);
      return;
    }

    const { ok, error } = validateImageFiles(files, remaining);
    if (error) toast.error(error);
    if (ok.length === 0) return;

    const updatedFiles = [...productFiles, ...ok];
    setProductFiles(updatedFiles);
    setProductPreviews((prev) => [
      ...prev,
      ...ok.map((f) => URL.createObjectURL(f)),
    ]);

    if (productFiles.length === 0 && ok.length > 0) {
      analyzeImageWithAI(ok);
    }
  };

  const handleRemoveUploadFile = (index: number) => {
    URL.revokeObjectURL(productPreviews[index]);
    setProductFiles((prev) => prev.filter((_, i) => i !== index));
    setProductPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const moveUploadFile = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= productFiles.length) return;
    setProductFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setProductPreviews((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const makePrimaryUploadFile = (targetIdx: number) => {
    if (targetIdx <= 0 || targetIdx >= productFiles.length) return;
    setProductFiles((prev) => {
      const next = [...prev];
      const [picked] = next.splice(targetIdx, 1);
      return [picked, ...next];
    });
    setProductPreviews((prev) => {
      const next = [...prev];
      const [picked] = next.splice(targetIdx, 1);
      return [picked, ...next];
    });
  };

  const appendSearchSpecsToDescription = () => {
    if (searchDerivedSpecs.length === 0) return;
    const block = searchDerivedSpecs.map((s) => `• ${s}`).join("\n");
    setProductDescription((prev) =>
      prev.trim() ? `${prev.trim()}\n\n[검색 참조 사양]\n${block}` : block
    );
    toast.success("검색 참조 사양이 설명란에 추가되었습니다.");
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle.trim()) {
      toast.error("제품명을 입력해 주세요.");
      return;
    }
    if (productFiles.length === 0) {
      toast.error("최소 1장의 상품 사진을 첨부해 주세요.");
      return;
    }

    const parsedPrice = productPrice
      ? Number(productPrice.replace(/[^0-9]/g, ""))
      : 0;
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error("유효한 판매 가격을 입력해 주세요.");
      return;
    }

    setUploadingProduct(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of productFiles) {
        const blob = await compressImage(file);
        const fileName = `product_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .upload(fileName, blob, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        uploadedUrls.push(
          supabase.storage
            .from(STORAGE_BUCKETS.inquiries)
            .getPublicUrl(fileName).data.publicUrl
        );
      }

      let finalDesc = productDescription.trim();
      if (productModel.trim() && !finalDesc.includes("모델명")) {
        finalDesc = `• 모델명: ${productModel.trim()}\n` + finalDesc;
      }

      const { error } = await supabase.from("products").insert({
        title: productTitle.trim(),
        category: normalizeProductCategory(productCategory),
        description: finalDesc,
        image_url: uploadedUrls.join(","),
        price: parsedPrice,
        status: normalizeProductStatus(productStatus),
        views: 0,
      });

      if (error) throw error;

      toast.success("새 상품이 등록되었습니다.");
      setIsUploadModalOpen(false);
      resetUploadForm();
      await fetchProducts();
    } catch (error: unknown) {
      toast.error(
        "등록 실패: " +
          (error instanceof Error ? error.message : "알 수 없는 오류")
      );
    } finally {
      setUploadingProduct(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#1F2530] font-sans flex flex-col">
      <SiteHeader>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="hb-btn-primary h-10 px-3.5 text-[13px] whitespace-nowrap"
            >
              <Icon d={ICON.plus} className="w-3.5 h-3.5" /> 상품 등록
            </button>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="hidden sm:inline-flex items-center rounded-md border border-[#DDD9D1] bg-[#FAF9F7] px-2.5 h-10 text-[12px] font-semibold text-[#4B5260] hover:text-[#0E1A2B]"
            >
              관리자 OFF
            </button>
          </div>
        )}
      </SiteHeader>

      {/* 상단 쇼룸 헤더 */}
      <section className="bg-white border-b border-[#E4E0D8]">
        <div className="hb-container py-10 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="hb-eyebrow">Showroom Inventory</p>
              <h1 className="mt-2 text-[28px] sm:text-[36px] font-bold text-[#0E1A2B] tracking-[-0.02em]">
                판매 제품 갤러리
              </h1>
              <p className="mt-2 text-[15px] text-[#4B5260] leading-relaxed max-w-2xl break-keep">
                매장에서 직접 세척과 작동 검수를 마친 실매물입니다. 제품명이나 모델명으로 검색하실 수 있으며, 온라인에 아직 등록되지 않은 재고는 전화나 카톡으로 문의해 주세요.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!isLoading && (
                <span className="px-3 py-1.5 rounded-sm bg-[#0E1A2B] text-white text-[12.5px] font-bold">
                  현재 구매 가능 {sellingCount}건
                </span>
              )}
              <span className="px-3 py-1.5 rounded-sm border border-[#E4E0D8] bg-[#FAF9F7] text-[#4B5260] text-[12.5px] font-semibold">
                실매물 검수 완료
              </span>
              <span className="px-3 py-1.5 rounded-sm border border-[#E4E0D8] bg-[#FAF9F7] text-[#4B5260] text-[12.5px] font-semibold">
                세금계산서 발행
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 스티키 검색 및 카테고리 필터 바 (SiteHeader 높이에 맞춘 top-[76px] sm:top-[84px]) */}
      <div className="sticky top-[76px] sm:top-[84px] z-30 bg-white/95 backdrop-blur-md border-b border-[#E4E0D8] shadow-2xs">
        <div className="hb-container py-2 sm:py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-3">
          {/* 카테고리 탭 */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 sm:pb-1 lg:pb-0"
            role="tablist"
            aria-label="상품 카테고리 필터"
          >
            {CATEGORIES_WITH_ALL.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveCategory(cat);
                    setVisibleLimit(PAGE_STEP);
                  }}
                  className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded text-[12.5px] sm:text-[13.5px] font-semibold whitespace-nowrap transition-colors border shrink-0 ${
                    active
                      ? "bg-[#0E1A2B] text-white border-[#0E1A2B]"
                      : "bg-white text-[#4B5260] border-[#DDD9D1] hover:bg-[#F6F5F2]"
                  }`}
                >
                  {cat}
                  <span
                    className={`ml-1 sm:ml-1.5 text-[11px] sm:text-[12px] ${
                      active ? "text-white/70" : "text-[#8A8478]"
                    }`}
                  >
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 검색창 + 판매 상태 필터 + 정렬 (모바일 1줄 인라인 슬림 압축 / 데스크톱 sm 이상 기존 동일) */}
          <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
            <div className="relative flex-1 min-w-0 sm:w-64">
              <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#8A8478]">
                <Icon d={ICON.search} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleLimit(PAGE_STEP);
                }}
                placeholder="제품명·모델명 검색"
                aria-label="제품명 또는 모델명 검색"
                className="w-full h-8 sm:h-10 pl-8 sm:pl-9 pr-2.5 sm:pr-3 rounded border border-[#DDD9D1] bg-white text-[12.5px] sm:text-[13.5px] text-[#0E1A2B] placeholder:text-[#8A8478] focus:border-[#0E1A2B] focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setVisibleLimit(PAGE_STEP);
              }}
              aria-label="판매 상태 필터"
              className="h-8 sm:h-10 px-2 sm:px-3 rounded border border-[#DDD9D1] bg-white text-[12px] sm:text-[13.5px] font-semibold text-[#4B5260] shrink-0 focus:border-[#0E1A2B] focus:outline-none"
            >
              <option value="all">전체 상태</option>
              <option value="selling">판매중만</option>
              <option value="reserved">예약중</option>
              <option value="sold">판매완료</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              aria-label="정렬 기준"
              className="h-8 sm:h-10 px-2 sm:px-3 rounded border border-[#DDD9D1] bg-white text-[12px] sm:text-[13.5px] font-semibold text-[#4B5260] shrink-0 focus:border-[#0E1A2B] focus:outline-none"
            >
              <option value="latest">최신 등록순</option>
              <option value="views">조회 많은순</option>
              <option value="priceAsc">낮은 가격순</option>
              <option value="priceDesc">높은 가격순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 메인 상품 그리드 */}
      <main className="hb-container py-8 sm:py-10 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <p className="text-[13.5px] text-[#6B7280]">
              {isLoading ? (
                "상품 목록을 불러오는 중..."
              ) : (
                <>
                  검색 결과{" "}
                  <strong className="text-[#0E1A2B]">
                    {filteredProducts.length}
                  </strong>
                  건
                </>
              )}
            </p>
            {(activeCategory !== "전체" ||
              search.trim() !== "" ||
              statusFilter !== "all" ||
              sort !== "latest") && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[12.5px] font-bold text-[#D9531E] underline underline-offset-4 hover:text-[#BF4715]"
              >
                필터 초기화
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[13px] font-bold text-[#4B5260] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilter === "selling"}
                onChange={(e) =>
                  setStatusFilter(e.target.checked ? "selling" : "all")
                }
                className="w-4 h-4 accent-[#0E1A2B]"
              />
              판매중만 보기
            </label>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  setSelectedIds(new Set());
                }}
                className={`px-3 py-1.5 rounded text-[12.5px] font-bold border transition-colors flex items-center gap-1.5 ${
                  isSelectMode
                    ? "bg-[#D9531E] text-white border-[#D9531E]"
                    : "bg-white text-[#0E1A2B] border-[#DDD9D1] hover:bg-[#F6F5F2]"
                }`}
              >
                <Icon d={ICON.check} className="w-3.5 h-3.5" />
                {isSelectMode ? "선택 모드 종료" : "선택 일괄 관리"}
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={`sk-${idx}`}
                className="bg-white rounded-md overflow-hidden border border-[#E4E0D8] animate-pulse"
              >
                <div className="aspect-[4/5] bg-[#EFECE6]" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-[#EFECE6] rounded w-1/3" />
                  <div className="h-5 bg-[#EFECE6] rounded w-4/5" />
                  <div className="h-6 bg-[#EFECE6] rounded w-1/2 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="py-16 px-6 text-center bg-white rounded-md border border-[#E4E0D8]">
            <p className="text-[#0E1A2B] text-[17px] font-bold">
              상품 목록을 불러오지 못했습니다.
            </p>
            <p className="mt-1 text-[14px] text-[#6B7280]">
              네트워크 연결을 확인하신 후 다시 시도해 주세요.
            </p>
            <button
              type="button"
              onClick={fetchProducts}
              className="hb-btn-primary mt-5 h-10 px-5 text-[13.5px]"
            >
              다시 불러오기
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 px-6 text-center bg-white rounded-md border border-[#E4E0D8]">
            <p className="text-[#0E1A2B] text-[18px] font-bold">
              조건에 맞는 상품이 없습니다.
            </p>
            <p className="mt-1.5 text-[#6B7280] text-[14px]">
              검색어나 필터를 초기화하시거나, 찾으시는 모델명을 전화·카톡으로 문의해 주세요.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={resetFilters}
                className="hb-btn-outline h-11 px-5 text-[14px]"
              >
                전체 필터 초기화
              </button>
              <a
                href={STORE.kakaoChat}
                target="_blank"
                rel="noopener noreferrer"
                className="hb-btn-kakao h-11 px-5 text-[14px]"
              >
                <Icon d={ICON.chat} className="w-4 h-4" /> 카톡으로 재고 문의
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleProductClick}
                  isSelectMode={isSelectMode}
                  isSelected={selectedIds.has(product.id)}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>

            {filteredProducts.length > visibleLimit && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + PAGE_STEP)}
                  className="hb-btn-outline h-12 px-8 text-[14px]"
                >
                  <span>
                    상품 더 보기 ({filteredProducts.length - visibleLimit}건 남음)
                  </span>
                  <Icon d={ICON.down} className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 관리자 일괄 선택 플로팅 작업 바 */}
      {isSelectMode && (
        <div className="fixed bottom-16 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 bg-[#0E1A2B]/95 text-white px-4 sm:px-6 py-3.5 rounded-xl shadow-2xl border border-white/15 max-w-[95vw] overflow-x-auto">
          <span className="text-[13px] font-bold whitespace-nowrap">
            <strong className="text-[#FEE500]">{selectedIds.size}</strong>개 선택됨
          </span>

          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-[12px] font-semibold text-white/90 px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 whitespace-nowrap"
          >
            {selectedIds.size === filteredProducts.length
              ? "선택 해제"
              : "전체 선택"}
          </button>

          <button
            type="button"
            disabled={selectedIds.size === 0 || isBulkLoading}
            onClick={() => handleBulkStatusChange("판매중")}
            className="text-[12px] font-bold text-white px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 whitespace-nowrap"
          >
            판매중 변경
          </button>

          <button
            type="button"
            disabled={selectedIds.size === 0 || isBulkLoading}
            onClick={() => handleBulkStatusChange("예약중")}
            className="text-[12px] font-bold text-white px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-40 whitespace-nowrap"
          >
            예약중 변경
          </button>

          <button
            type="button"
            disabled={selectedIds.size === 0 || isBulkLoading}
            onClick={() => handleBulkStatusChange("판매완료")}
            className="text-[12px] font-bold text-white px-3 py-1.5 rounded bg-[#4B5260] hover:bg-[#606877] disabled:opacity-40 whitespace-nowrap"
          >
            판매완료 처리
          </button>

          <button
            type="button"
            disabled={selectedIds.size === 0 || isBulkLoading}
            onClick={handleBulkDelete}
            className="text-[12px] font-bold text-white px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-40 whitespace-nowrap"
          >
            선택 삭제
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSelectMode(false);
              setSelectedIds(new Set());
            }}
            className="text-white/70 hover:text-white p-1"
            aria-label="선택 모드 닫기"
          >
            <Icon d={ICON.close} className="w-4 h-4" />
          </button>
        </div>
      )}

      <SiteFooter
        isAdmin={isAdmin}
        onAdminClick={() =>
          isAdmin ? handleAdminLogout() : setIsAdminAuthModalOpen(true)
        }
      />
      <MobileCtaBar />

      {/* 상세 보기 및 단건 수정 모달 */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isAdmin={isAdmin}
          onClose={() => setSelectedProduct(null)}
          onProductUpdated={handleProductUpdated}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {/* 관리자 신규 상품 등록 모달 (사진 순서 변경 + AI 판독/검색 구분 검토) */}
      {isUploadModalOpen && (
        <Modal
          open={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            resetUploadForm();
          }}
          label="판매 상품 등록"
          panelClassName="max-w-lg"
        >
          <div className="bg-white w-full max-h-[92vh] overflow-y-auto rounded-lg shadow-2xl border border-[#E4E0D8]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E0D8] sticky top-0 bg-white z-10">
              <h2 className="text-[18px] font-bold text-[#0E1A2B]">
                판매 상품 등록
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  resetUploadForm();
                }}
                className="grid h-8 w-8 place-items-center text-[#6B7280] hover:text-[#0E1A2B]"
                aria-label="닫기"
              >
                <Icon d={ICON.close} className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleProductSubmit}
              className="p-6 space-y-5 text-[14px]"
            >
              {/* 1. 사진 업로드 및 순서 변경 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="hb-label">
                    상품 사진 첨부 (최대 {MAX_PHOTOS}장) *
                  </label>
                  <span className="text-[11px] font-bold text-[#D9531E]">
                    1번 사진이 대표 이미지로 노출됩니다
                  </span>
                </div>

                <div className="mb-2.5 flex items-center justify-between gap-2 p-2.5 bg-[#FAF9F7] rounded border border-[#E4E0D8]">
                  <label className="flex items-center gap-2 text-[12.5px] font-semibold text-[#0E1A2B] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={searchSpecs}
                      onChange={(e) => setSearchSpecs(e.target.checked)}
                      className="w-4 h-4 accent-[#0E1A2B]"
                    />
                    <span>모델명 기반 인터넷 공식 사양 검색 활용</span>
                  </label>
                  {productFiles.length > 0 && (
                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => analyzeImageWithAI(productFiles)}
                      className="text-[12px] font-bold text-[#D9531E] underline underline-offset-2 disabled:opacity-50"
                    >
                      AI 재분석
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={productFiles.length >= MAX_PHOTOS || isAnalyzing}
                  className="w-full text-[12px] text-[#4B5260] file:mr-3 file:py-2 file:px-3.5 file:rounded file:border-0 file:text-[12px] file:font-bold file:bg-[#0E1A2B] file:text-white hover:file:bg-[#1C2D47] cursor-pointer disabled:opacity-50"
                />

                {isAnalyzing && (
                  <div className="mt-2.5 flex items-center gap-2 p-3 bg-[#FFF5F0] border border-[#FADCD0] rounded text-[#D9531E] text-[12.5px] font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#D9531E] animate-ping" />
                    AI가 사진 속 명판과 제품 사양을 분석하고 있습니다...
                  </div>
                )}

                {productPreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2.5">
                    {productPreviews.map((preview, index) => (
                      <div
                        key={preview}
                        className="flex flex-col overflow-hidden rounded border border-[#DDD9D1] bg-[#FAF9F7]"
                      >
                        <div className="relative aspect-square bg-[#EFECE6]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preview}
                            alt={`업로드 미리보기 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 0 ? (
                            <span className="absolute top-1.5 left-1.5 bg-[#D9531E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                              대표
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => makePrimaryUploadFile(index)}
                              className="absolute top-1.5 left-1.5 bg-[#0E1A2B]/85 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm hover:bg-[#D9531E]"
                            >
                              대표 지정
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadFile(index)}
                            aria-label="사진 삭제"
                            className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                          >
                            <Icon d={ICON.close} className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-[#E4E0D8] border-t border-[#E4E0D8] bg-white text-[11px] font-bold text-[#4B5260]">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveUploadFile(index, index - 1)}
                            className="py-1 hover:bg-[#F6F5F2] disabled:opacity-30"
                          >
                            ← 앞으로
                          </button>
                          <button
                            type="button"
                            disabled={index === productPreviews.length - 1}
                            onClick={() => moveUploadFile(index, index + 1)}
                            className="py-1 hover:bg-[#F6F5F2] disabled:opacity-30"
                          >
                            뒤로 →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. AI 분석 결과 구분 리포트 (사진 판독 vs 검색 사양 vs 검토 경고) */}
              {(photoObserved.length > 0 ||
                searchDerivedSpecs.length > 0 ||
                reviewWarnings.length > 0) && (
                <div className="space-y-2.5 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-3.5 text-[12.5px]">
                  {photoObserved.length > 0 && (
                    <div>
                      <p className="font-bold text-[#0E1A2B]">
                        📷 사진에서 직접 판독된 정보
                      </p>
                      <ul className="mt-1 list-disc pl-4 text-[#4B5260] space-y-0.5">
                        {photoObserved.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {searchDerivedSpecs.length > 0 && (
                    <div className="pt-2 border-t border-[#E4E0D8]">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#0E1A2B]">
                          🌐 인터넷 검색으로 보충된 참고 사양
                        </p>
                        <button
                          type="button"
                          onClick={appendSearchSpecsToDescription}
                          className="text-[11px] font-bold text-[#D9531E] underline"
                        >
                          + 설명란에 반영
                        </button>
                      </div>
                      <ul className="mt-1 list-disc pl-4 text-[#4B5260] space-y-0.5">
                        {searchDerivedSpecs.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reviewWarnings.length > 0 && (
                    <div className="rounded border border-amber-300 bg-amber-50 p-2.5 text-amber-950">
                      <p className="font-bold text-amber-900">
                        ⚠️ 담당자 육안 확인이 필요한 항목
                      </p>
                      <ul className="mt-1 list-disc pl-4 text-amber-800 space-y-0.5">
                        {reviewWarnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {foundSources.length > 0 && (
                    <div className="pt-1 text-[11.5px] text-[#6B7280]">
                      <span className="font-semibold">참조 출처: </span>
                      {foundSources.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-2 text-blue-700 underline break-all"
                        >
                          [출처 {i + 1}]
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. 카테고리 및 판매 상태 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hb-label">표준 카테고리 *</label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="hb-input mt-1 font-semibold"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="hb-label">판매 상태</label>
                  <select
                    value={productStatus}
                    onChange={(e) => setProductStatus(e.target.value)}
                    className="hb-input mt-1 font-semibold"
                  >
                    <option value={PRODUCT_STATUS.SELLING}>판매중</option>
                    <option value={PRODUCT_STATUS.RESERVED}>예약중</option>
                    <option value={PRODUCT_STATUS.SOLD}>판매완료</option>
                  </select>
                </div>
              </div>

              {/* 4. 제품명 및 모델명 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="hb-label">제품명 / 타이틀 *</label>
                  <input
                    type="text"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    required
                    className="hb-input mt-1"
                    placeholder="예: 삼성 비스포크 양문형 냉장고 846L"
                  />
                </div>
                <div>
                  <label className="hb-label">모델명 (확인 시)</label>
                  <input
                    type="text"
                    value={productModel}
                    onChange={(e) => setProductModel(e.target.value)}
                    className="hb-input mt-1 font-mono text-[13px]"
                    placeholder="예: RF85B9111AP"
                  />
                </div>
              </div>

              {/* 5. 판매 가격 */}
              <div>
                <label className="hb-label">
                  판매 가격 (원){" "}
                  <span className="font-normal text-[#6B7280]">
                    — 비워두면 맞춤 견적 상담 문구로 표시됩니다
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    productPrice ? Number(productPrice).toLocaleString() : ""
                  }
                  onChange={(e) =>
                    setProductPrice(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="hb-input mt-1"
                  placeholder="예: 450,000"
                />
              </div>

              {/* 6. 상세 설명 */}
              <div>
                <label className="hb-label">상세 설명 및 확인된 사양</label>
                <textarea
                  rows={6}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  className="hb-input mt-1 font-mono text-[13px] leading-relaxed resize-y"
                  placeholder="[핵심 특징], [주요 사양], [설치 전 체크] 내용이 표시됩니다."
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-[#E4E0D8]">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    resetUploadForm();
                  }}
                  className="hb-btn-outline w-1/2 h-12 text-[14px]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={uploadingProduct || isAnalyzing}
                  className="hb-btn-primary w-1/2 h-12 text-[14px]"
                >
                  {uploadingProduct ? "등록 중..." : "상품 등록 완료"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* 관리자 로그인 모달 */}
      {isAdminAuthModalOpen && (
        <Modal
          open={isAdminAuthModalOpen}
          onClose={() => setIsAdminAuthModalOpen(false)}
          label="관리자 로그인"
          panelClassName="max-w-sm"
        >
          <form
            onSubmit={handleAdminAuth}
            className="w-full rounded-lg bg-white p-6 sm:p-8 shadow-2xl border border-[#E4E0D8]"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-[#0E1A2B]">
                관리자 로그인
              </h2>
              <button
                type="button"
                onClick={() => setIsAdminAuthModalOpen(false)}
                className="grid h-8 w-8 place-items-center text-[#6B7280] hover:text-[#0E1A2B]"
                aria-label="닫기"
              >
                <Icon d={ICON.close} className="h-5 w-5" />
              </button>
            </div>
            <label className="hb-label" htmlFor="admin-email">
              관리자 이메일
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="hb-input mt-1.5 mb-4"
            />
            <label className="hb-label" htmlFor="admin-pw">
              비밀번호
            </label>
            <input
              id="admin-pw"
              type="password"
              autoComplete="current-password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="hb-input mt-1.5"
            />
            <button
              type="submit"
              disabled={isLoggingIn}
              className="hb-btn-primary mt-6 h-12 w-full text-[15px]"
            >
              {isLoggingIn ? "인증 확인 중…" : "로그인"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}