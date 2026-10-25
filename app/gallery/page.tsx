"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  smsHref,
  splitImages,
  compressImage,
  rotateImageFile,
  sanitizeOldManufactureYear,
  validateImageFiles,
  MAX_PHOTOS,
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITION_GRADES,
  PRODUCT_STATUS,
  isProductSold,
  isProductReserved,
  normalizeProductStatus,
  normalizeProductCategory,
  hasProductPrice,
  formatProductPrice,
  extractModelName,
  extractSpecCapsules,
  trackEvent,
  addRecentViewedProduct,
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
import {
  CopyPromoPostButton,
  QuoteBasketButton,
} from "../../components/products/product-detail-gallery";
import { RecentViewedStrip } from "../../components/products/product-compare-modal";
import { AirconSetGuideBanner } from "../../components/products/aircon-set-guide-banner";
import { ProductStructuredDescription } from "../../components/products/product-structured-description";
import {
  removeProductImagesFromStorage,
  compressAndUploadProductImages,
} from "../../lib/product-ops";

type PriceRangeOption = "all" | "under30" | "30to70" | "70to150" | "over150";

const PRICE_RANGE_OPTIONS: ReadonlyArray<{
  value: PriceRangeOption;
  label: string;
  min?: number;
  max?: number;
}> = [
  { value: "all", label: "전체 가격대" },
  { value: "under30", label: "30만원 이하", max: 300000 },
  { value: "30to70", label: "30만 ~ 70만원", min: 300000, max: 700000 },
  { value: "70to150", label: "70만 ~ 150만원", min: 700000, max: 1500000 },
  { value: "over150", label: "150만원 이상", min: 1500000 },
] as const;

const SITUATION_PRESETS = [
  {
    label: "원룸·자취필수",
    category: "냉장고",
    keyword: "",
    desc: "원룸·오피스텔 입주용 가전",
  },
  {
    label: "카페·디저트창업",
    category: "업소용기기",
    keyword: "쇼케이스",
    desc: "제빙기·테이블냉장·쇼케이스",
  },
  {
    label: "식당·주방설비",
    category: "업소용기기",
    keyword: "45박스",
    desc: "45박스·식기세척기·작업대",
  },
  {
    label: "사계절 냉난방",
    category: "에어컨/냉난방기",
    keyword: "냉난방",
    desc: "상가·사무실·가정용 냉난방기",
  },
] as const;



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

// removeProductImagesFromStorage imported from lib/product-ops

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
  const [editGrade, setEditGrade] = useState<string>(
    product.condition_grade || PRODUCT_CONDITION_GRADES[1]
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
  const specCapsules = extractSpecCapsules(
    product.title,
    product.description,
    4
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

  const rotateNewEditFile = async (i: number, degrees = 90) => {
    const file = editNewFiles[i];
    if (!file) return;
    try {
      const rotated = await rotateImageFile(file, degrees);
      setEditNewFiles((prev) => {
        const next = [...prev];
        next[i] = rotated;
        return next;
      });
      setEditNewPreviews((prev) => {
        const next = [...prev];
        if (next[i]) URL.revokeObjectURL(next[i]);
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

    const numericPrice = editPrice
      ? Number(editPrice.replace(/[^0-9]/g, ""))
      : 0;
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      toast.error("유효한 판매 가격을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const newlyUploadedUrls = await compressAndUploadProductImages(editNewFiles);

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
          condition_grade: editGrade || null,
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
        condition_grade: editGrade || null,
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
    setEditGrade(product.condition_grade || PRODUCT_CONDITION_GRADES[1]);
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
        closeOnOverlayClick={!isEditing}
        closeOnEsc={!isEditing}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-[#E5E2DC] flex flex-col overflow-hidden max-h-[90vh] w-full">
          {/* 모달 상단 헤더 */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E2DC] bg-white sticky top-0 z-20">
            <div className="flex flex-wrap items-center gap-1.5">
              {!isEditing ? (
                <>
                  <span className="text-hb-xs font-bold text-[#4B5260] bg-[#FAF9F7] border border-[#E5E2DC] px-2.5 py-1 rounded-lg">
                    {categoryLabel}
                  </span>
                  <ProductStatusBadge
                    status={product.status}
                    createdAt={product.created_at}
                  />
                  {product.condition_grade && (
                    <span className="rounded-lg border border-[#FADCD0] bg-[#FFF5F0] px-2 py-0.5 text-hb-xs font-bold text-[#D9531E]">
                      {product.condition_grade}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-hb-xs font-bold text-[#D9531E] bg-[#FFF5F0] border border-[#FADCD0] px-2.5 py-1 rounded-lg">
                  상품 정보 및 사진 편집 모드
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {!isEditing && (
                <CopyPromoPostButton
                  product={product}
                  className="hidden sm:inline-flex items-center gap-1 rounded border border-[#DDD9D1] bg-[#FAF9F7] px-2.5 py-1.5 text-hb-xs font-bold text-[#0E1A2B] hover:border-[#0E1A2B]"
                />
              )}
              {isAdmin && !isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#0E1A2B] bg-[#F6F5F2] hover:bg-[#EFECE6] border border-[#DDD9D1] px-2.5 py-1.5 rounded transition-colors"
                  >
                    <EditIcon /> 수정
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
                  className="relative w-full h-[300px] sm:h-[370px] bg-[#FAF9F7] border-b border-[#E5E2DC] flex items-center justify-center p-3 overflow-hidden cursor-zoom-in group select-none"
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
                      <span className="px-5 py-2 rounded-sm bg-[#0E1A2B]/90 text-white text-hb-sm font-bold tracking-[0.2em] border border-white/20">
                        판매완료
                      </span>
                    </div>
                  )}

                  {displayImages[0] && (                    <div className="absolute top-3 right-3 bg-black/65 text-white text-hb-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none">
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
                      <span className="absolute bottom-3 right-3 bg-black/75 text-white text-hb-xs font-semibold px-2.5 py-1 rounded-full z-10 pointer-events-none">
                        {idx + 1} / {displayImages.length}
                      </span>
                    </>
                  )}
                </div>

                {displayImages.length > 1 && (
                  <div className="flex gap-2 p-3 bg-[#FAF9F7] border-b border-[#E5E2DC] overflow-x-auto">
                    {displayImages.map((img, i) => (
                      <button
                        key={img + i}
                        type="button"
                        onClick={() => setIdx(i)}
                        aria-label={`${i + 1}번 사진 보기`}
                        className={`relative w-14 h-14 shrink-0 rounded overflow-hidden bg-white border transition-all ${
                          i === idx
                            ? "border-[#D9531E] ring-2 ring-[#D9531E]/40"
                            : "border-[#E5E2DC] opacity-60 hover:opacity-100"
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
                      <span className="text-hb-xs font-semibold text-[#D9531E]">
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
                              <span className="absolute left-1.5 top-1.5 rounded-sm bg-[#D9531E] px-1.5 py-0.5 text-hb-xs font-bold text-white">
                                대표
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => makePrimaryExistingImage(i)}
                                className="absolute left-1.5 top-1.5 rounded-sm bg-[#0E1A2B]/85 px-1.5 py-0.5 text-hb-xs font-bold text-white hover:bg-[#D9531E]"
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
                          <div className="grid grid-cols-2 divide-x divide-[#E4E0D8] border-t border-[#E4E0D8] bg-white text-hb-xs font-bold text-[#4B5260]">
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
                          <span className="absolute left-1.5 top-1.5 rounded-sm bg-[#0E1A2B] px-1.5 py-0.5 text-hb-xs font-bold text-white">
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
                            className="absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white hover:bg-[#D9531E] shadow-sm transition-colors"
                          >
                            <Icon d={ICON.rotate} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {editExistingImages.length + editNewFiles.length <
                        MAX_PHOTOS && (
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-[#CFCAC0] bg-[#FAF9F7] text-hb-xs font-semibold text-[#6B7280] hover:border-[#0E1A2B] hover:text-[#0E1A2B]">
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="hb-label">카테고리</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="hb-input mt-1 text-hb-sm font-semibold"
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
                        className="hb-input mt-1 text-hb-sm font-semibold"
                      >
                        <option value={PRODUCT_STATUS.SELLING}>판매중</option>
                        <option value={PRODUCT_STATUS.RESERVED}>예약중</option>
                        <option value={PRODUCT_STATUS.SOLD}>판매완료</option>
                      </select>
                    </div>
                    <div>
                      <label className="hb-label">상태 등급</label>
                      <select
                        value={editGrade}
                        onChange={(e) => setEditGrade(e.target.value)}
                        className="hb-input mt-1 text-hb-sm font-semibold"
                      >
                        {PRODUCT_CONDITION_GRADES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
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
                      className="hb-input mt-1 font-mono text-hb-sm leading-relaxed resize-y"
                      placeholder="특징 및 사양 내용을 수정하세요"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-hb-xl font-bold text-[#0E1A2B] leading-snug tracking-tight">
                      {product.title}
                    </h2>
                    {specCapsules.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {specCapsules.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2 py-0.5 text-hb-xs font-semibold text-[#3E4756]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {modelName && (
                      <p className="mt-1.5 text-hb-sm font-semibold text-[#4B5260]">
                        모델명:{" "}
                        <span className="font-mono text-[#0E1A2B]">
                          {modelName}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF9F7] p-4 rounded-xl border border-[#E5E2DC]">
                    <div>
                      <span className="text-hb-xs font-semibold text-[#6B7280] block mb-0.5">
                        판매 가격
                      </span>
                      {sold ? (
                        <p className="text-hb-2xl font-bold text-[#8A8478]">
                          판매완료
                        </p>
                      ) : hasProductPrice(product.price) ? (
                        <p className="text-hb-2xl font-bold tracking-tight text-[#D9531E] tabular-nums">
                          {formatProductPrice(product.price, categoryLabel)}
                        </p>
                      ) : (
                        <a
                          href={telHref(STORE.tel)}
                          className="inline-flex items-center gap-2 text-hb-xl font-bold text-[#D9531E] hover:text-[#BF4715]"
                        >
                          <span className="underline underline-offset-4">
                            {formatProductPrice(product.price, categoryLabel)}
                          </span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-hb-xs font-semibold text-[#6B7280] tabular-nums">
                        조회 <strong className="text-[#0E1A2B]">{product.views || 0}</strong>회
                      </span>
                      <Link
                        href={`/${product.id}`}
                        className="rounded border border-[#DDD9D1] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#0E1A2B] hover:border-[#0E1A2B]"
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

                  {/* 구조화된 제품 사양 및 상태 설명 (통합 구조화 컴포넌트) */}
                  {product.description && (
                    <ProductStructuredDescription description={product.description} />
                  )}

                  <ul className="text-hb-sm text-[#4B5260] space-y-1.5 bg-[#FAF9F7] rounded-xl p-4 border border-[#E5E2DC]">
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

          {/* 모달 하단 액션 바 (전화 / 문자 / 카톡 / 온라인 문의) */}
          <div className="p-4 border-t border-[#E4E0D8] bg-white shrink-0">
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
                      ? `[한밭중고전자 유사매물문의] 판매완료된 '${product.title}'${
                          modelName ? ` (${modelName})` : ""
                        }와 비슷한 스펙의 현재 재고 문의드립니다.`
                      : `[한밭중고전자 상품문의] ${product.title}${
                          modelName ? ` (${modelName})` : ""
                        } 재고 및 배송·설치 견적 문의드립니다.`
                  )}
                  className="hb-btn-outline h-11 text-hb-sm"
                >
                  <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#D9531E]" />
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
                  <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#D9531E]" />
                  <span>{sold ? "유사매물 문의" : "온라인 문의"}</span>
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
            <span className="text-hb-sm font-semibold bg-white/15 px-3 py-1 rounded-full">
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
  const [priceRange, setPriceRange] = useState<PriceRangeOption>("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
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
  const [productGrade, setProductGrade] = useState<string>(
    PRODUCT_CONDITION_GRADES[1]
  );
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /* AI 판독 결과 구분 상태 (기본값 true: 모델명 기반 공식 사양 정밀 검색 자동 활성화) */
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
        .order("created_at", { ascending: false })
        .limit(400);
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

        const priceParam = params.get("price") as PriceRangeOption | null;
        if (
          priceParam &&
          ["all", "under30", "30to70", "70to150", "over150"].includes(priceParam)
        ) {
          setPriceRange(priceParam);
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

    if (priceRange !== "all") {
      url.searchParams.set("price", priceRange);
    } else {
      url.searchParams.delete("price");
    }

    window.history.replaceState(null, "", url.toString());
  }, [activeCategory, search, sort, statusFilter, priceRange]);

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

      if (priceRange !== "all") {
        if (!hasProductPrice(p.price)) return false;
        const priceVal = Number(p.price);
        if (priceRange === "under30" && priceVal > 300000) return false;
        if (
          priceRange === "30to70" &&
          (priceVal < 300000 || priceVal > 700000)
        )
          return false;
        if (
          priceRange === "70to150" &&
          (priceVal < 700000 || priceVal > 1500000)
        )
          return false;
        if (priceRange === "over150" && priceVal < 1500000) return false;
      }

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
  }, [products, activeCategory, statusFilter, priceRange, search, sort]);

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, visibleLimit),
    [filteredProducts, visibleLimit]
  );

  const resetFilters = () => {
    setActiveCategory("전체");
    setSearch("");
    setStatusFilter("all");
    setPriceRange("all");
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
    const prodImages = splitImages(product.image_url);
    addRecentViewedProduct({
      id: product.id,
      title: product.title,
      category: product.category || "기타",
      price: product.price ?? null,
      status: product.status,
      conditionGrade: product.condition_grade ?? null,
      modelName: extractModelName(product.description, product.title) ?? null,
      imageUrl: prodImages[0] || null,
    });
    trackEvent("view_item", {
      category: normalizeProductCategory(product.category),
      status: normalizeProductStatus(product.status),
    });

    // 관리자 로그인 상태에서는 본인 검수/수정 클릭이므로 조회수를 올리지 않음
    if (isAdmin) return;

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

      const authHeaders = await getAdminAuthHeaders();
      const res = await fetch(`/api/products/${product.id}/view`, {
        headers: authHeaders,
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
  const userManuallyRotatedRef = useRef<Set<number>>(new Set());

  const resetUploadForm = () => {
    productPreviews.forEach((u) => URL.revokeObjectURL(u));
    userManuallyRotatedRef.current.clear();
    setProductTitle("");
    setProductModel("");
    setProductDescription("");
    setProductPrice("");
    setProductCategory(PRODUCT_CATEGORIES[0]);
    setProductGrade(PRODUCT_CONDITION_GRADES[1]);
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

  const handleCloseUploadModal = () => {
    if (uploadingProduct || isAnalyzing) {
      if (
        !confirm(
          "상품 등록 또는 AI 분석이 진행 중입니다. 작업을 중단하고 창을 닫으시겠습니까?"
        )
      ) {
        return;
      }
    } else {
      const hasData =
        productFiles.length > 0 ||
        productPreviews.length > 0 ||
        productTitle.trim().length > 0 ||
        productPrice.trim().length > 0 ||
        productDescription.trim().length > 0 ||
        productModel.trim().length > 0;

      if (hasData) {
        if (
          !confirm(
            "작성 중인 상품 정보 및 사진이 있습니다. 등록을 취소하고 창을 닫으시겠습니까?\n(창을 닫으면 작성한 내용이 모두 사라집니다.)"
          )
        ) {
          return;
        }
      }
    }

    setIsUploadModalOpen(false);
    resetUploadForm();
  };

  const analyzeImageWithAI = async (filesToAnalyze: File[]) => {
    if (filesToAnalyze.length === 0) return;
    setIsAnalyzing(true);
    const toastId = toast.loading(
      searchSpecs
        ? "AI가 사진을 판독하고 인터넷 제원을 정밀 검색 중입니다..."
        : "AI가 사진 속 모델명과 외관을 초고속 분석 중입니다..."
    );

    try {
      const formData = new FormData();
      formData.append("category", productCategory);
      formData.append("searchSpecs", searchSpecs ? "true" : "false");

      for (const file of filesToAnalyze.slice(0, MAX_PHOTOS)) {
        const compressedBlob = await compressImage(file, 1080, 0.72);
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

      // 5년 이상 지난 제품(2026년 기준 2020년 및 그 이전)의 제조년월/연식 표기 자동 제외
      const cleanData = sanitizeOldManufactureYear(data);

      if (
        cleanData.category &&
        (PRODUCT_CATEGORIES as readonly string[]).includes(cleanData.category)
      ) {
        setProductCategory(cleanData.category);
      }
      if (cleanData.title) setProductTitle(cleanData.title);
      if (cleanData.modelNumber) setProductModel(cleanData.modelNumber);
      if (cleanData.specDetails) setProductDescription(cleanData.specDetails);

      setPhotoObserved(
        Array.isArray(cleanData.photoObserved) ? cleanData.photoObserved : []
      );
      setSearchDerivedSpecs(
        Array.isArray(cleanData.searchDerivedSpecs)
          ? cleanData.searchDerivedSpecs
          : []
      );
      setReviewWarnings(
        Array.isArray(cleanData.needsReview) ? cleanData.needsReview : []
      );
      setFoundSources(Array.isArray(cleanData.sourceUrls) ? cleanData.sourceUrls : []);

      // AI가 감지한 옆으로 누운 사진 자동 정방향 회전
      if (Array.isArray(data.imageRotations) && data.imageRotations.length > 0) {
        const rotationsToApply = data.imageRotations.filter(
          (r: { index?: unknown; rotate?: unknown }) => {
            const idx = typeof r.index === "number" ? r.index - 1 : -1;
            const deg = typeof r.rotate === "number" ? r.rotate : 0;
            return (
              idx >= 0 &&
              idx < filesToAnalyze.length &&
              deg > 0 &&
              deg < 360 &&
              !userManuallyRotatedRef.current.has(idx)
            );
          }
        );

        if (rotationsToApply.length > 0) {
          try {
            for (const r of rotationsToApply) {
              const idx = (r.index as number) - 1;
              await rotateUploadFile(idx, r.rotate as number, true);
            }
            toast.success(
              "AI가 옆으로 누운 사진을 감지하여 정방향으로 자동 회전했습니다.",
              {
                duration: 4000,
              }
            );
          } catch (rotateErr) {
            console.warn("AI 자동 회전 적용 중 오류:", rotateErr);
          }
        }
      }

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
    userManuallyRotatedRef.current.clear();
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

  const rotateUploadFile = async (
    index: number,
    degrees = 90,
    isAuto = false
  ) => {
    let targetFile: File | null = null;
    setProductFiles((prev) => {
      targetFile = prev[index] || null;
      return prev;
    });

    if (!targetFile) return;

    try {
      const rotated = await rotateImageFile(targetFile, degrees);
      setProductFiles((prev) => {
        const next = [...prev];
        if (index < next.length) next[index] = rotated;
        return next;
      });

      setProductPreviews((prev) => {
        const next = [...prev];
        if (index < next.length) {
          if (next[index]) URL.revokeObjectURL(next[index]);
          next[index] = URL.createObjectURL(rotated);
        }
        return next;
      });

      if (!isAuto) {
        userManuallyRotatedRef.current.add(index);
        toast.success(`${index + 1}번 사진이 90° 회전되었습니다.`);
      }
    } catch (err) {
      console.error("사진 회전 오류:", err);
      if (!isAuto) toast.error("사진 회전에 실패했습니다.");
    }
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
      const uploadedUrls = await compressAndUploadProductImages(productFiles);

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
        condition_grade: productGrade || null,
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
    <div className="min-h-screen bg-[#FAF9F7] text-[#0E1A2B] font-sans flex flex-col">
      <SiteHeader>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="hb-btn-primary h-10 sm:h-11 px-3.5 sm:px-4 text-hb-sm whitespace-nowrap"
            >
              <Icon d={ICON.plus} className="w-3.5 h-3.5" /> 상품 등록
            </button>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="hidden sm:inline-flex items-center rounded-lg border border-[#D8D3C8] bg-[#FAF9F7] px-3 h-10 sm:h-11 text-hb-xs font-semibold text-[#3E4856] hover:text-[#0E1A2B]"
            >
              관리자 OFF
            </button>
          </div>
        )}
      </SiteHeader>

      {/* 상단 쇼룸 컴팩트 다크 네이비 헤더 (타이틀 + 실시간 재고 지표 + 통합 검색바) */}
      <section className="bg-[#0E1A2B] text-white border-b border-[#1E2F47]">
        <div className="hb-container py-5 sm:py-7">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-hb-xs font-bold text-[#FF8A50]">
                <span>LIVE SHOWROOM CATALOG</span>
                <span className="text-white/30">·</span>
                <span className="text-white/80">
                  대전 중촌동 1·2층 직영 매장 실매물
                </span>
                {!isLoading && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-hb-xs font-extrabold text-white tabular-nums">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF8A50]" />
                    구매 가능 {sellingCount}건
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <h1 className="text-hb-xl sm:text-hb-2xl font-extrabold text-white tracking-tight">
                  판매 제품 갤러리
                </h1>
                <p className="hidden sm:inline text-hb-xs sm:text-hb-sm text-white/70">
                  분해 세척과 작동 검수를 마친 실매물입니다. 온라인 미등록 재고는 전화·카톡으로 문의해 주세요.
                </p>
              </div>
            </div>

            {/* 통합 검색창 + 모바일 상세필터 토글 */}
            <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
              <div className="relative flex-1 lg:w-80">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#646E7E] pointer-events-none">
                  <Icon d={ICON.search} className="w-4 h-4" />
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisibleLimit(PAGE_STEP);
                  }}
                  placeholder="제품명·모델명·규격 검색 (예: 45박스, 스탠드)"
                  aria-label="제품명 또는 모델명 검색"
                  className="w-full h-10 pl-9 pr-8 rounded-lg border border-white/20 bg-white text-hb-xs sm:text-hb-sm font-medium text-[#0E1A2B] placeholder:text-[#8A8478] focus:border-[#FF8A50] focus:outline-none"
                />
                {search.trim() !== "" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setVisibleLimit(PAGE_STEP);
                    }}
                    aria-label="검색어 지우기"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#646E7E] hover:text-[#0E1A2B] p-0.5"
                  >
                    <Icon d={ICON.close} className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobileFilterOpen((v) => !v)}
                aria-expanded={mobileFilterOpen}
                className={`lg:hidden h-10 px-3 inline-flex items-center gap-1.5 rounded-lg border text-hb-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  mobileFilterOpen ||
                  statusFilter !== "all" ||
                  priceRange !== "all" ||
                  sort !== "latest"
                    ? "border-[#FF8A50] bg-[#D9531E] text-white"
                    : "border-white/25 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <span>필터·프리셋</span>
                <Icon
                  d={ICON.down}
                  className={`w-3.5 h-3.5 transition-transform ${
                    mobileFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 스티키 카테고리 및 필터 컨트롤 바 (리퀴드 글래스 단일 행 중심) */}
      <div className="sticky top-16 sm:top-[72px] z-30 hb-glass">
        <div className="hb-container py-2 sm:py-2.5 flex flex-col gap-2">
          {/* 1행: 좌측 품목 탭 + 우측 데스크톱 인라인 필터 */}
          <div className="flex items-center justify-between gap-3">
            <div
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pr-2"
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
                    className={`h-9 px-3 inline-flex items-center rounded-md text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                      active
                        ? "bg-[#0E1A2B] text-white"
                        : "bg-[#F4F3EF] text-[#3E4856] hover:bg-[#E8E5DE] hover:text-[#0E1A2B]"
                    }`}
                  >
                    {cat}
                    <span
                      className={`ml-1.5 text-hb-xs tabular-nums ${
                        active ? "text-[#FF8A50]" : "text-[#667085]"
                      }`}
                    >
                      {categoryCounts[cat] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 데스크톱 우측 인라인 필터 */}
            <div className="hidden lg:flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter(statusFilter === "selling" ? "all" : "selling");
                  setVisibleLimit(PAGE_STEP);
                }}
                className={`h-9 px-3 rounded-md text-hb-xs font-bold border transition-colors cursor-pointer ${
                  statusFilter === "selling"
                    ? "bg-[#0E1A2B] text-white border-[#0E1A2B]"
                    : "bg-white text-[#3E4856] border-[#D8D3C8] hover:border-[#0E1A2B] hover:text-[#0E1A2B]"
                }`}
              >
                판매중만
              </button>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setVisibleLimit(PAGE_STEP);
                }}
                aria-label="판매 상태 필터"
                className="h-9 px-2.5 rounded-md border border-[#D8D3C8] bg-white text-hb-xs font-bold text-[#0E1A2B] focus:border-[#0E1A2B] focus:outline-none"
              >
                <option value="all">전체 상태</option>
                <option value="selling">판매중만</option>
                <option value="reserved">예약중</option>
                <option value="sold">판매완료</option>
              </select>

              <select
                value={priceRange}
                onChange={(e) => {
                  const nextPrice = e.target.value as PriceRangeOption;
                  setPriceRange(nextPrice);
                  setVisibleLimit(PAGE_STEP);
                  trackEvent("filter_gallery", {
                    category: activeCategory,
                    price_range: nextPrice,
                  });
                }}
                aria-label="가격대 범위 필터"
                className={`h-9 px-2.5 rounded-md border text-hb-xs font-bold focus:border-[#0E1A2B] focus:outline-none ${
                  priceRange !== "all"
                    ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E]"
                    : "border-[#D8D3C8] bg-white text-[#0E1A2B]"
                }`}
              >
                {PRICE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                aria-label="정렬 기준"
                className="h-9 px-2.5 rounded-md border border-[#D8D3C8] bg-white text-hb-xs font-bold text-[#0E1A2B] focus:border-[#0E1A2B] focus:outline-none"
              >
                <option value="latest">최신 등록순</option>
                <option value="views">조회 많은순</option>
                <option value="priceAsc">낮은 가격순</option>
                <option value="priceDesc">높은 가격순</option>
              </select>
            </div>
          </div>

          {/* 확장 행: 상황별 프리셋 4종 + 모바일 필터 3종 (토글 열림 시 노출) */}
          {mobileFilterOpen && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pt-2 border-t border-[#ECE9E2]">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-hb-xs">
                <span className="shrink-0 font-bold text-[#646E7E] mr-1">
                  상황별 프리셋:
                </span>
                {SITUATION_PRESETS.map((preset) => {
                  const active =
                    activeCategory === preset.category &&
                    (!preset.keyword || search === preset.keyword);
                  const presetIcon =
                    preset.label === "원룸·자취필수"
                      ? ICON.building
                      : preset.label === "카페·디저트창업"
                      ? ICON.sparkles
                      : preset.label === "식당·주방설비"
                      ? ICON.layers
                      : ICON.snowflake;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setActiveCategory(preset.category);
                        setSearch(preset.keyword);
                        setVisibleLimit(PAGE_STEP);
                        trackEvent("click_situation_preset", {
                          preset: preset.label,
                          category: preset.category,
                          keyword: preset.keyword,
                        });
                      }}
                      className={`h-8 inline-flex items-center gap-1.5 rounded-full px-3 font-semibold transition-colors border shrink-0 cursor-pointer ${
                        active
                          ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E] font-bold"
                          : "border-[#E5E2DC] bg-[#FAF9F7] text-[#3E4756] hover:border-[#0E1A2B]"
                      }`}
                      title={preset.desc}
                    >
                      <Icon d={presetIcon} className="w-3.5 h-3.5" />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 lg:hidden gap-1.5">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setVisibleLimit(PAGE_STEP);
                  }}
                  aria-label="모바일 판매 상태 필터"
                  className="h-8 px-2 rounded border border-[#D8D3C8] bg-white text-hb-xs font-bold text-[#0E1A2B]"
                >
                  <option value="all">전체 상태</option>
                  <option value="selling">판매중만</option>
                  <option value="reserved">예약중</option>
                  <option value="sold">판매완료</option>
                </select>

                <select
                  value={priceRange}
                  onChange={(e) => {
                    const nextPrice = e.target.value as PriceRangeOption;
                    setPriceRange(nextPrice);
                    setVisibleLimit(PAGE_STEP);
                  }}
                  aria-label="모바일 가격대 필터"
                  className="h-8 px-2 rounded border border-[#D8D3C8] bg-white text-hb-xs font-bold text-[#0E1A2B]"
                >
                  {PRICE_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  aria-label="모바일 정렬 기준"
                  className="h-8 px-2 rounded border border-[#D8D3C8] bg-white text-hb-xs font-bold text-[#0E1A2B]"
                >
                  <option value="latest">최신 등록순</option>
                  <option value="views">조회 많은순</option>
                  <option value="priceAsc">낮은 가격순</option>
                  <option value="priceDesc">높은 가격순</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메인 상품 그리드 */}
      <main className="hb-container py-5 sm:py-8 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#ECE9E2]">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-hb-xs sm:text-hb-sm text-[#3E4856]">
              {isLoading ? (
                "상품 목록을 불러오는 중..."
              ) : (
                <>
                  전시 매물{" "}
                  <strong className="text-[#0E1A2B] font-extrabold tabular-nums">
                    {filteredProducts.length}
                  </strong>
                  건
                </>
              )}
            </p>
            {/* 데스크톱 빠른 프리셋 링크 */}
            <div className="hidden md:flex items-center gap-1.5 ml-2 pl-2 border-l border-[#E5E2DC]">
              {SITUATION_PRESETS.map((preset) => {
                const active =
                  activeCategory === preset.category &&
                  (!preset.keyword || search === preset.keyword);
                const presetIcon =
                  preset.label === "원룸·자취필수"
                    ? ICON.building
                    : preset.label === "카페·디저트창업"
                    ? ICON.sparkles
                    : preset.label === "식당·주방설비"
                    ? ICON.layers
                    : ICON.snowflake;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setActiveCategory(preset.category);
                      setSearch(preset.keyword);
                      setVisibleLimit(PAGE_STEP);
                    }}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-hb-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? "bg-[#D9531E] text-white"
                        : "text-[#646E7E] hover:bg-[#F4F3EF] hover:text-[#0E1A2B]"
                    }`}
                  >
                    <Icon d={presetIcon} className="w-3 h-3" />
                    <span>#{preset.label}</span>
                  </button>
                );
              })}
            </div>
            {(activeCategory !== "전체" ||
              search.trim() !== "" ||
              statusFilter !== "all" ||
              priceRange !== "all" ||
              sort !== "latest") && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-hb-xs font-bold text-[#D9531E] underline underline-offset-4 hover:text-[#BF4715] ml-1"
              >
                초기화
              </button>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  setSelectedIds(new Set());
                }}
                className={`px-3 py-1 rounded text-hb-xs font-bold border transition-colors flex items-center gap-1.5 ${
                  isSelectMode
                    ? "bg-[#D9531E] text-white border-[#D9531E]"
                    : "bg-white text-[#0E1A2B] border-[#D8D3C8] hover:bg-[#FAF9F7]"
                }`}
              >
                <Icon d={ICON.check} className="w-3.5 h-3.5" />
                {isSelectMode ? "선택 종료" : "일괄 관리"}
              </button>
            </div>
          )}
        </div>

        {activeCategory === "에어컨/냉난방기" && (
          <AirconSetGuideBanner variant="banner" className="mb-6" />
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={`sk-${idx}`}
                className="bg-white rounded-xl overflow-hidden border border-[#E6E3DC] animate-pulse"
              >
                <div className="aspect-[4/3] bg-[#EFECE6]" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-[#EFECE6] rounded w-1/3" />
                  <div className="h-5 bg-[#EFECE6] rounded w-4/5" />
                  <div className="h-6 bg-[#EFECE6] rounded w-1/2 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="py-16 px-6 text-center bg-white rounded-xl border border-[#E6E3DC]">
            <p className="text-[#0E1A2B] text-hb-lg font-bold">
              상품 목록을 불러오지 못했습니다.
            </p>
            <p className="mt-1 text-hb-sm text-[#667085]">
              네트워크 연결을 확인하신 후 다시 시도해 주세요.
            </p>
            <button
              type="button"
              onClick={fetchProducts}
              className="hb-btn-primary mt-5 h-10 px-5 text-hb-sm"
            >
              다시 불러오기
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white rounded-xl border border-[#E6E3DC] shadow-2xs">
            <p className="text-[#0E1A2B] text-hb-lg font-extrabold">
              {search.trim()
                ? `'${search.trim()}' 검색 조건에 맞는 등록 매물이 없습니다.`
                : "선택하신 필터 조건에 맞는 상품이 없습니다."}
            </p>
            <p className="mt-1.5 text-[#667085] text-hb-sm max-w-lg mx-auto break-keep">
              중촌동 직영 매장에는 온라인에 미처 올리지 못한 대기 매물이 많습니다. 찾으시는 품목을 바로 문의해 주시면 창고 재고를 즉시 확인해 드립니다.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={resetFilters}
                className="hb-btn-outline h-11 px-5 text-hb-sm"
              >
                전체 필터 초기화
              </button>
              <Link
                href={`/inquiry?write=1&type=${encodeURIComponent(
                  activeCategory === "업소용기기" ? "대량·업소용 상담" : "구매 문의"
                )}&title=${encodeURIComponent(
                  `[미등록 재고문의] ${
                    search.trim() || activeCategory
                  } 매물 재고 확인 부탁드립니다`
                )}`}
                className="hb-btn-accent h-11 px-5 text-hb-sm"
              >
                <Icon d={ICON.pen} className="w-4 h-4" />
                <span>
                  &lsquo;{search.trim() || activeCategory}&rsquo; 매장 미등록 재고 문의
                </span>
              </Link>
              <a
                href={smsHref(
                  STORE.mobile,
                  `[한밭중고전자 미등록재고문의] 홈페이지에서 '${
                    search.trim() || activeCategory
                  }' 검색 후 문의드립니다. 매장 보유 재고와 사진 확인 가능할까요?`
                )}
                className="hb-btn-primary h-11 px-5 text-hb-sm"
              >
                <Icon d={ICON.chat} className="w-4 h-4 text-[#FF8A50]" />
                <span>문자로 실물사진 요청</span>
              </a>
              <a
                href={STORE.kakaoChat}
                target="_blank"
                rel="noopener noreferrer"
                className="hb-btn-kakao h-11 px-5 text-hb-sm"
              >
                <Icon d={ICON.chat} className="w-4 h-4" /> 카톡으로 재고 문의
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={isSelectMode ? handleProductClick : undefined}
                  onQuickView={handleProductClick}
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
                  className="hb-btn-outline h-12 px-8 text-hb-sm"
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

        {/* 미등록 매장 재고 및 맞춤 사양 문의 배너 */}
        <div className="mt-12 rounded-xl border border-[#E6E3DC] bg-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
          <div>
            <span className="hb-eyebrow">미등록 매장 재고 문의</span>
            <h2 className="mt-1.5 text-hb-lg font-extrabold text-[#0E1A2B]">
              찾으시는 모델이나 용량·수량이 목록에 없으신가요?
            </h2>
            <p className="mt-1 text-hb-sm text-[#3E4856] leading-relaxed break-keep">
              중촌동 매장에는 세척·점검을 마치고 아직 홈페이지에 업로드되지 않은 가전과 업소용 주방설비가 상시 대기 중입니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={telHref(STORE.tel)}
              className="hb-btn-accent h-11 px-4 text-hb-sm"
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5" />
              <span>전화 재고 문의 ({STORE.tel})</span>
            </a>
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              className="hb-btn-kakao h-11 px-4 text-hb-sm"
            >
              <Icon d={ICON.chat} className="w-3.5 h-3.5" />
              <span>카톡 실물사진 요청</span>
            </a>
          </div>
        </div>

        {/* [기능 4] 비로그인 최근 본 매물 스트립 */}
        <RecentViewedStrip className="mt-10" />
      </main>

      {/* 관리자 일괄 선택 플로팅 작업 바 */}
      {isSelectMode && (
        <div className="fixed bottom-16 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 bg-[#0E1A2B]/95 text-white px-4 sm:px-6 py-3.5 rounded-xl shadow-2xl border border-white/15 max-w-[95vw] overflow-x-auto">
          <span className="text-hb-sm font-bold whitespace-nowrap">
            <strong className="text-[#FEE500]">{selectedIds.size}</strong>개 선택됨
          </span>

          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-hb-xs font-semibold text-white/90 px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 whitespace-nowrap"
          >
            {selectedIds.size === filteredProducts.length
              ? "선택 해제"
              : "전체 선택"}
          </button>

          <button
            type="button"
            disabled={selectedIds.size === 0 || isBulkLoading}
            onClick={() => handleBulkStatusChange("판매중")}
            className="text-hb-xs font-bold text-white px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 whitespace-nowrap"
          >
            판매중 변경
          </button>

          <button
            type="button"
            disabled={selectedIds.size === 0 || isBulkLoading}
            onClick={() => handleBulkStatusChange("예약중")}
            className="text-hb-xs font-bold text-white px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-40 whitespace-nowrap"
          >
            예약중 변경
          </button>

          <button
            type="button"
            disabled={selectedIds.size === 0 || isBulkLoading}
            onClick={() => handleBulkStatusChange("판매완료")}
            className="text-hb-xs font-bold text-white px-3 py-1.5 rounded bg-[#4B5260] hover:bg-[#606877] disabled:opacity-40 whitespace-nowrap"
          >
            판매완료 처리
          </button>

          <button
            type="button"
            disabled={selectedIds.size === 0 || isBulkLoading}
            onClick={handleBulkDelete}
            className="text-hb-xs font-bold text-white px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-40 whitespace-nowrap"
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
          onClose={handleCloseUploadModal}
          closeOnOverlayClick={false}
          closeOnEsc={false}
          label="판매 상품 등록"
          panelClassName="max-w-lg"
        >
          <div className="bg-white w-full max-h-[92vh] flex flex-col rounded-lg shadow-2xl border border-[#E4E0D8] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E0D8] bg-white shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <h2 className="text-hb-lg font-bold text-[#0E1A2B]">
                  판매 상품 등록
                </h2>
                {isAnalyzing && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-hb-xs font-bold bg-[#FFF5F0] text-[#D9531E] border border-[#FADCD0] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D9531E] animate-ping" />
                    AI 작성 중
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleCloseUploadModal}
                className="grid h-8 w-8 place-items-center text-[#6B7280] hover:text-[#0E1A2B]"
                aria-label="닫기"
              >
                <Icon d={ICON.close} className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleProductSubmit}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* 스크롤 가능한 본문 영역 */}
              <div className="overflow-y-auto flex-1 p-6 space-y-5 text-hb-sm">
              {/* 1. 사진 업로드 및 순서 변경 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="hb-label">
                    상품 사진 첨부 (최대 {MAX_PHOTOS}장) *
                  </label>
                  <span className="text-hb-xs font-bold text-[#D9531E]">
                    1번 사진이 대표 이미지로 노출됩니다
                  </span>
                </div>

                <div className="mb-2.5 flex items-center justify-between gap-2 p-2.5 bg-[#FAF9F7] rounded border border-[#E4E0D8]">
                  <label className="flex items-center gap-2 text-hb-xs font-semibold text-[#0E1A2B] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={searchSpecs}
                      onChange={(e) => setSearchSpecs(e.target.checked)}
                      className="w-4 h-4 accent-[#0E1A2B]"
                    />
                    <span>인터넷 공식 제원 정밀 검색 (기본 활성화)</span>
                  </label>
                  {productFiles.length > 0 && (
                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => analyzeImageWithAI(productFiles)}
                      className="text-hb-xs font-bold text-[#D9531E] underline underline-offset-2 disabled:opacity-50"
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
                  className="w-full text-hb-xs text-[#4B5260] file:mr-3 file:py-2 file:px-3.5 file:rounded file:border-0 file:text-hb-xs file:font-bold file:bg-[#0E1A2B] file:text-white hover:file:bg-[#1C2D47] cursor-pointer disabled:opacity-50"
                />

                {isAnalyzing && (
                  <div className="mt-2.5 flex items-center gap-2 p-3 bg-[#FFF5F0] border border-[#FADCD0] rounded text-[#D9531E] text-hb-xs font-semibold animate-pulse">
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
                            <span className="absolute top-1.5 left-1.5 bg-[#D9531E] text-white text-hb-xs font-bold px-1.5 py-0.5 rounded-sm">
                              대표
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => makePrimaryUploadFile(index)}
                              className="absolute top-1.5 left-1.5 bg-[#0E1A2B]/85 text-white text-hb-xs font-bold px-1.5 py-0.5 rounded-sm hover:bg-[#D9531E]"
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
                          {/* 이미지 우하단 퀵 90도 회전 버튼 */}
                          <button
                            type="button"
                            onClick={() => rotateUploadFile(index, 90)}
                            title="시계방향 90도 회전"
                            aria-label="시계방향 90도 회전"
                            className="absolute bottom-1.5 right-1.5 bg-black/75 hover:bg-[#D9531E] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md transition-colors"
                          >
                            <Icon d={ICON.rotate} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="border-t border-[#E4E0D8] bg-white text-hb-xs font-bold text-[#4B5260]">
                          <button
                            type="button"
                            onClick={() => rotateUploadFile(index, 90)}
                            className="w-full py-1.5 flex items-center justify-center gap-1.5 text-[#0E1A2B] hover:text-[#D9531E] hover:bg-[#FFF5F0] border-b border-[#E4E0D8] transition-colors"
                            title="사진을 시계 방향으로 90도 회전합니다"
                          >
                            <Icon d={ICON.rotate} className="w-3.5 h-3.5 text-[#D9531E]" />
                            <span>90° 회전</span>
                          </button>
                          <div className="grid grid-cols-2 divide-x divide-[#E4E0D8]">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. AI 분석 결과 구분 리포트 (사진 판독 vs 검색 사양 vs 검토 경고) */}
              {(photoObserved.length > 0 ||
                searchDerivedSpecs.length > 0 ||
                reviewWarnings.length > 0) && (
                <div className="space-y-2.5 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-3.5 text-hb-xs">
                  {photoObserved.length > 0 && (
                    <div>
                      <p className="font-bold text-[#0E1A2B]">
                        사진에서 직접 판독된 정보
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
                          인터넷 검색으로 보충된 참고 사양
                        </p>
                        <button
                          type="button"
                          onClick={appendSearchSpecsToDescription}
                          className="text-hb-xs font-bold text-[#D9531E] underline"
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
                        담당자 육안 확인이 필요한 항목
                      </p>
                      <ul className="mt-1 list-disc pl-4 text-amber-800 space-y-0.5">
                        {reviewWarnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {foundSources.length > 0 && (
                    <div className="pt-1 text-hb-xs text-[#6B7280]">
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

              {/* 3. 카테고리 · 판매 상태 · 상태 등급 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="hb-label">표준 카테고리 *</label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="hb-input mt-1 font-semibold text-hb-sm"
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
                    className="hb-input mt-1 font-semibold text-hb-sm"
                  >
                    <option value={PRODUCT_STATUS.SELLING}>판매중</option>
                    <option value={PRODUCT_STATUS.RESERVED}>예약중</option>
                    <option value={PRODUCT_STATUS.SOLD}>판매완료</option>
                  </select>
                </div>
                <div>
                  <label className="hb-label">상태 등급</label>
                  <select
                    value={productGrade}
                    onChange={(e) => setProductGrade(e.target.value)}
                    className="hb-input mt-1 font-semibold text-hb-sm"
                  >
                    {PRODUCT_CONDITION_GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
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
                    className="hb-input mt-1 font-mono text-hb-sm"
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
                  className="hb-input mt-1 font-mono text-hb-sm leading-relaxed resize-y"
                  placeholder="[한눈에 보는 제품 정보], [제품 특징], [주요 사양] 핵심 3개 항목 위주로 초안이 자동 입력됩니다."
                />
              </div>
            </div>
            {/* 스크롤 본문 끝 */}

              {/* 하단 고정 액션 바: 스크롤 없이 즉시 클릭 가능 */}
              <div className="p-4 sm:px-6 border-t border-[#E4E0D8] bg-[#FAF9F7] shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-10">
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseUploadModal}
                    className="hb-btn-outline w-1/3 sm:w-1/4 h-12 text-hb-sm"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingProduct || isAnalyzing}
                    className="hb-btn-primary flex-1 h-12 text-hb-sm font-bold flex items-center justify-center gap-2"
                  >
                    {uploadingProduct ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>등록 중...</span>
                      </>
                    ) : isAnalyzing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>AI 분석 중...</span>
                      </>
                    ) : (
                      <>
                        <Icon d={ICON.check} className="w-4 h-4 text-white" />
                        <span>상품 등록 완료</span>
                      </>
                    )}
                  </button>
                </div>
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
              <h2 className="text-hb-lg font-bold text-[#0E1A2B]">
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
              className="hb-btn-primary mt-6 h-12 w-full text-hb-base"
            >
              {isLoggingIn ? "인증 확인 중…" : "로그인"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}