"use client";

// 파일 경로: components/gallery/product-detail-modal.tsx
// 갤러리 상품 상세 보기 · 사진 확대 라이트박스 · 관리자 단건 수정 모달 (지연 로딩 전용)

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  STORE,
  telHref,
  smsHref,
  splitImages,
  enhanceImageFile,
  PRODUCT_IMAGE_TONE_PRESET,
  revokeObjectUrls,
  validateImageFiles,
  MAX_PHOTOS,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS,
  isProductSold,
  normalizeProductStatus,
  normalizeProductCategory,
  hasProductPrice,
  formatProductPrice,
  extractModelName,
  extractSpecCapsules,
} from "../../lib/site";
import { Icon, ICON, SafeImg, Modal } from "../../lib/ui";
import {
  ProductTrustMicroStrip,
  type ProductItem,
} from "../products/product-card";
import { ProductStatusBadge } from "../products/product-status-badge";
import {
  CopyPromoPostButton,
  QuoteBasketButton,
} from "../products/product-detail-gallery";
import { AirconSetGuideBanner } from "../products/aircon-set-guide-banner";
import { ProductStructuredDescription } from "../products/product-structured-description";

export function ProductDetailModal({
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
  const [editGrade, setEditGrade] = useState<string>(
    product.condition_grade || ""
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
      if (isEditing || displayImages.length < 2) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [displayImages.length, go, isEditing]);

  const currentStatus = isEditing ? editStatus : product.status;
  const sold = isProductSold(currentStatus);
  const categoryLabel = normalizeProductCategory(product.category);
  const modelName = extractModelName(product.description, product.title);
  const specCapsules = extractSpecCapsules(
    product.title,
    product.description,
    4,
    product.category
  );

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

  const handleAddEditFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const toned = await Promise.all(
      ok.map(async (f) => {
        try {
          return await enhanceImageFile(f, PRODUCT_IMAGE_TONE_PRESET);
        } catch {
          return f;
        }
      })
    );

    setEditNewFiles((prev) => [...prev, ...toned]);
    setEditNewPreviews((prev) => [
      ...prev,
      ...toned.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeNewEditFile = (targetIdx: number) => {
    revokeObjectUrls([editNewPreviews[targetIdx]]);
    setEditNewFiles((prev) => prev.filter((_, i) => i !== targetIdx));
    setEditNewPreviews((prev) => prev.filter((_, i) => i !== targetIdx));
  };

  const rotateNewEditFile = async (i: number, degrees = 90) => {
    const file = editNewFiles[i];
    if (!file) return;
    try {
      const rotated = await enhanceImageFile(file, { degrees });
      setEditNewFiles((prev) => {
        const next = [...prev];
        next[i] = rotated;
        return next;
      });
      setEditNewPreviews((prev) => {
        const next = [...prev];
        if (next[i]) revokeObjectUrls([next[i]]);
        next[i] = URL.createObjectURL(rotated);
        return next;
      });
      toast.success("사진이 90° 회전되었습니다.");
    } catch {
      toast.error("사진 회전에 실패했습니다.");
    }
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

    setIsSaving(true);
    try {
      const { updateProductRecord } = await import("../../lib/product-ops");
      const saved = await updateProductRecord({
        id: product.id,
        title: editTitle,
        category: editCategory,
        status: editStatus,
        price: editPrice,
        conditionGrade: editGrade,
        description: editDescription,
        existingImages: editExistingImages,
        originalImages: images,
        newFiles: editNewFiles,
      });

      revokeObjectUrls(editNewPreviews);
      setEditNewFiles([]);
      setEditNewPreviews([]);

      const updated: ProductItem = {
        ...product,
        title: saved.title,
        category: saved.category,
        price: saved.price,
        condition_grade: saved.condition_grade,
        status: saved.status,
        description: saved.description,
        image_url: saved.image_url,
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
    revokeObjectUrls(editNewPreviews);
    setEditNewFiles([]);
    setEditNewPreviews([]);
    setEditExistingImages(images);
    setEditTitle(product.title);
    setEditCategory(normalizeProductCategory(product.category));
    setEditPrice(
      product.price && product.price > 0 ? String(product.price) : ""
    );
    setEditGrade(product.condition_grade || "");
    setEditStatus(normalizeProductStatus(product.status));
    setEditDescription(product.description || "");
    setIsEditing(false);
  };

  const handleCloseDetail = () => {
    if (isEditing) {
      const hasChanges =
        editTitle.trim() !== product.title ||
        editPrice.trim() !==
          (product.price && product.price > 0 ? String(product.price) : "") ||
        editDescription.trim() !== (product.description || "") ||
        editNewFiles.length > 0;

      if (hasChanges) {
        if (
          !confirm(
            "수정 중인 상품 정보가 저장되지 않았습니다. 수정을 취소하고 창을 닫으시겠습니까?"
          )
        ) {
          return;
        }
      }
      handleCancelEdit();
    }
    onClose();
  };

  const inquiryParams = new URLSearchParams({
    write: "1",
    type: categoryLabel === "업소용기기" ? "대량·업소용 상담" : "구매 문의",
    productId: String(product.id),
    title: sold
      ? `[유사매물 재고문의] ${product.title}`
      : `[상품문의] ${product.title}`,
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
        onClose={handleCloseDetail}
        label={`${product.title} 상세 정보`}
        panelClassName="max-w-xl"
        closeOnOverlayClick={!isEditing && !isZoomOpen}
        closeOnEsc={!isEditing && !isZoomOpen}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-[#E2DDD3] flex flex-col overflow-hidden max-h-[90vh] w-full">
          {/* 모달 상단 헤더 */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2DDD3] bg-white sticky top-0 z-20">
            <div className="flex flex-wrap items-center gap-1.5">
              {!isEditing ? (
                <>
                  <span className="text-hb-xs font-bold text-[#334155] bg-[#FAF9F6] border border-[#E2DDD3] px-2.5 py-1 rounded-lg">
                    {categoryLabel}
                  </span>
                  <ProductStatusBadge
                    status={product.status}
                    createdAt={product.created_at}
                  />
                  {product.condition_grade && (
                    <span className="rounded-lg border border-[#FADCD0] bg-[#FFF4EE] px-2 py-0.5 text-hb-xs font-bold text-[#C84312]">
                      {product.condition_grade}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-hb-xs font-bold text-[#C84312] bg-[#FFF4EE] border border-[#FADCD0] px-2.5 py-1 rounded-lg">
                  상품 정보 및 사진 편집 모드
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {!isEditing && (
                <CopyPromoPostButton
                  product={product}
                  className="hidden sm:inline-flex items-center gap-1 rounded border border-[#E2DDD3] bg-[#FAF9F6] px-2.5 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23]"
                />
              )}
              {isAdmin && !isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#141A23] bg-[#F5F3EE] hover:bg-[#ECE8DF] border border-[#E2DDD3] px-2.5 py-1.5 rounded transition-colors"
                  >
                    <Icon d={ICON.pen} className="w-3.5 h-3.5" /> 수정
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(product.id)}
                    className="inline-flex items-center gap-1 text-hb-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded transition-colors"
                  >
                    삭제
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleCloseDetail}
                aria-label="닫기"
                className="text-[#64748B] hover:text-[#141A23] transition-colors p-1"
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
                  onClick={() => displayImages[idx] && setIsZoomOpen(true)}
                  className="relative w-full h-[300px] sm:h-[370px] bg-[#FAF9F6] border-b border-[#E2DDD3] flex items-center justify-center p-3 overflow-hidden cursor-zoom-in group select-none"
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
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#141A23]/45 pointer-events-none">
                      <span className="px-5 py-2 rounded-sm bg-[#141A23]/90 text-white text-hb-sm font-bold tracking-[0.2em] border border-white/20">
                        판매완료
                      </span>
                    </div>
                  )}

                  {displayImages[idx] && (
                    <div className="absolute top-3 right-3 z-10 bg-black/65 text-white text-hb-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none">
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
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 text-[#141A23] shadow-md flex items-center justify-center hover:bg-white z-10"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 text-[#141A23] shadow-md flex items-center justify-center hover:bg-white z-10"
                      >
                        <Icon d={ICON.right} className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-3 right-3 bg-black/75 text-white text-hb-xs font-semibold px-2.5 py-1 rounded-full z-10 pointer-events-none">
                        {idx + 1} / {displayImages.length}
                      </span>
                    </>
                  )}
                </div>

                {displayImages.length > 1 && (
                  <div className="flex gap-2 p-3 bg-[#FAF9F6] border-b border-[#E2DDD3] overflow-x-auto">
                    {displayImages.map((img, i) => (
                      <button
                        key={img + i}
                        type="button"
                        onClick={() => setIdx(i)}
                        aria-label={`${i + 1}번 사진 보기`}
                        className={`relative w-14 h-14 shrink-0 rounded overflow-hidden bg-white border transition-[border-color,opacity] duration-150 ${
                          i === idx
                            ? "border-[#C84312] ring-2 ring-[#C84312]/30"
                            : "border-[#E2DDD3] opacity-60 hover:opacity-100"
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
                        등록된 사진 관리 (
                        {editExistingImages.length + editNewFiles.length}/
                        {MAX_PHOTOS}장)
                      </span>
                      <span className="text-hb-xs font-semibold text-[#C84312]">
                        맨 앞(1번) 사진이 대표 이미지입니다
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {editExistingImages.map((imgUrl, i) => (
                        <div
                          key={imgUrl + i}
                          className="relative flex flex-col overflow-hidden rounded border border-[#E2DDD3] bg-[#FAF9F6]"
                        >
                          <div className="relative aspect-square w-full bg-[#F5F3EE]">
                            <SafeImg
                              src={imgUrl}
                              alt={`기존 사진 ${i + 1}`}
                              className="h-full w-full object-cover"
                            />
                            {i === 0 ? (
                              <span className="absolute left-1.5 top-1.5 rounded-sm bg-[#C84312] px-1.5 py-0.5 text-hb-xs font-bold text-white">
                                대표
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => makePrimaryExistingImage(i)}
                                className="absolute left-1.5 top-1.5 rounded-sm bg-[#141A23]/85 px-1.5 py-0.5 text-hb-xs font-bold text-white hover:bg-[#C84312]"
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
                          <div className="grid grid-cols-2 divide-x divide-[#E2DDD3] border-t border-[#E2DDD3] bg-white text-hb-xs font-bold text-[#334155]">
                            <button
                              type="button"
                              disabled={i === 0}
                              onClick={() => moveExistingImage(i, i - 1)}
                              className="py-1 hover:bg-[#F5F3EE] disabled:opacity-30"
                            >
                              ← 앞으로
                            </button>
                            <button
                              type="button"
                              disabled={i === editExistingImages.length - 1}
                              onClick={() => moveExistingImage(i, i + 1)}
                              className="py-1 hover:bg-[#F5F3EE] disabled:opacity-30"
                            >
                              뒤로 →
                            </button>
                          </div>
                        </div>
                      ))}

                      {editNewPreviews.map((preview, i) => (
                        <div
                          key={preview}
                          className="relative aspect-square overflow-hidden rounded border border-[#C84312] bg-[#F5F3EE]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preview}
                            alt={`추가 사진 ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute left-1.5 top-1.5 rounded-sm bg-[#141A23] px-1.5 py-0.5 text-hb-xs font-bold text-white">
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
                          <button
                            type="button"
                            onClick={() => rotateNewEditFile(i, 90)}
                            title="시계방향 90도 회전"
                            aria-label="시계방향 90도 회전"
                            className="absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white hover:bg-[#C84312] shadow-sm transition-colors"
                          >
                            <Icon d={ICON.rotate} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {editExistingImages.length + editNewFiles.length <
                        MAX_PHOTOS && (
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-[#CFC8BA] bg-[#FAF9F6] text-hb-xs font-semibold text-[#64748B] hover:border-[#141A23] hover:text-[#141A23]">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="detail-edit-category" className="hb-label">
                        카테고리
                      </label>
                      <select
                        id="detail-edit-category"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="hb-input mt-1 text-hb-base sm:text-hb-sm font-semibold"
                      >
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="detail-edit-status" className="hb-label">
                        판매 상태
                      </label>
                      <select
                        id="detail-edit-status"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="hb-input mt-1 text-hb-base sm:text-hb-sm font-semibold"
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
                      className="hb-input mt-1 font-mono text-hb-base sm:text-hb-sm leading-relaxed resize-y"
                      placeholder="특징 및 사양 내용을 수정하세요"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-hb-xl font-bold text-[#141A23] leading-snug tracking-tight">
                      {product.title}
                    </h2>
                    {specCapsules.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {specCapsules.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-[#FAF9F6] border border-[#E2DDD3] px-2 py-0.5 text-hb-xs font-semibold text-[#334155]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {modelName && (
                      <p className="mt-1.5 text-hb-sm font-semibold text-[#334155]">
                        모델명:{" "}
                        <span className="font-mono text-[#141A23]">
                          {modelName}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF9F6] p-4 rounded-xl border border-[#E2DDD3]">
                    <div>
                      <span className="text-hb-xs font-semibold text-[#64748B] block mb-0.5">
                        판매 가격
                      </span>
                      {sold ? (
                        <p className="text-hb-2xl font-bold text-[#94A3B8]">
                          판매완료
                        </p>
                      ) : hasProductPrice(product.price) ? (
                        <p className="text-hb-2xl font-bold tracking-tight text-[#C84312] tabular-nums">
                          {formatProductPrice(product.price, categoryLabel)}
                        </p>
                      ) : (
                        <a
                          href={telHref(STORE.tel)}
                          className="inline-flex items-center gap-2 text-hb-xl font-bold text-[#C84312] hover:text-[#A9370D]"
                        >
                          <span className="underline underline-offset-4">
                            {formatProductPrice(product.price, categoryLabel)}
                          </span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-hb-xs font-semibold text-[#64748B] tabular-nums">
                        조회{" "}
                        <strong className="text-[#141A23]">
                          {product.views || 0}
                        </strong>
                        회
                      </span>
                      <Link
                        href={`/${product.id}`}
                        className="rounded border border-[#E2DDD3] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23]"
                      >
                        개별 상세페이지 →
                      </Link>
                    </div>
                  </div>

                  {!sold && (
                    <QuoteBasketButton
                      item={{
                        id: product.id,
                        title: product.title,
                        category: categoryLabel,
                        price: product.price,
                        status: product.status,
                        conditionGrade: product.condition_grade,
                        description: product.description,
                        modelName,
                        imageUrl: images[0] || null,
                        quantity: 1,
                      }}
                    />
                  )}

                  {/* 핵심 가치 아이콘 바 (Trust Micro-strip) */}
                  <ProductTrustMicroStrip category={categoryLabel} />

                  {categoryLabel === "에어컨/냉난방기" && (
                    <AirconSetGuideBanner variant="card" className="mt-4" />
                  )}

                  {/* 구조화된 제품 사양 및 상태 설명 */}
                  {product.description && (
                    <ProductStructuredDescription
                      description={product.description}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* 모달 하단 액션 바 (전화 / 문자 / 카톡 / 온라인 문의) */}
          <div className="p-4 border-t border-[#E2DDD3] bg-white shrink-0">
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="hb-btn-outline h-11 text-hb-sm"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="hb-btn-primary h-11 text-hb-sm"
                >
                  {isSaving ? "저장 중..." : "변경사항 저장"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <a
                  href={telHref(STORE.tel)}
                  className="hb-btn-primary h-11 text-hb-sm"
                >
                  <Icon d={ICON.phone} className="w-4 h-4 text-[#FF8A50]" />
                  <span>전화 문의</span>
                </a>
                <a
                  href={smsHref(
                    STORE.mobile,
                    sold
                      ? `[${STORE.name} 유사매물문의] 판매완료된 '${product.title}'${
                          modelName ? ` (${modelName})` : ""
                        }와 비슷한 스펙의 현재 재고 문의드립니다.`
                      : `[${STORE.name} 상품문의] ${product.title}${
                          modelName ? ` (${modelName})` : ""
                        } 재고 및 배송·설치 견적 문의드립니다.`
                  )}
                  className="hb-btn-outline h-11 text-hb-sm"
                >
                  <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#C84312]" />
                  <span>문자 문의</span>
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-11 text-hb-sm"
                >
                  <Icon d={ICON.chat} className="w-4 h-4" />
                  <span>카톡 상담</span>
                </a>
                <Link
                  href={inquiryHref}
                  className="hb-btn-outline h-11 text-hb-sm"
                >
                  <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#C84312]" />
                  <span>{sold ? "유사매물 문의" : "온라인 문의"}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 전체화면 확대 라이트박스 (Top-Layer Dialog) */}
      <Modal
        open={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        variant="lightbox"
        label="사진 전체화면 확대 보기"
        panelClassName="max-w-5xl w-full rounded-none overflow-visible"
      >
        <div
          onClick={() => setIsZoomOpen(false)}
          className="relative flex flex-col items-center justify-center p-2 sm:p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mb-3 flex w-full items-center justify-between text-white"
          >
            <span className="text-hb-sm font-semibold bg-white/15 px-3 py-1 rounded-full tabular-nums">
              {idx + 1} / {displayImages.length}
            </span>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="닫기"
              autoFocus
            >
              <Icon d={ICON.close} className="w-6 h-6" />
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-full max-h-[80vh] flex items-center justify-center"
          >
            <SafeImg
              src={displayImages[idx]}
              alt={product.title}
              eager
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded"
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
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center z-20"
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
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center z-20"
                aria-label="다음 사진"
              >
                <Icon d={ICON.right} className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
