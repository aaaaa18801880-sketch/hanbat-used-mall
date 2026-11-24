// 파일 경로: components/admin/admin-product-list.tsx
"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  ADMIN_PRODUCT_STATUS_LIST,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS,
  formatProductPrice,
  generatePromoPostText,
  getDaysSinceCreated,
  normalizeProductCategory,
  normalizeProductStatus,
  splitImages,
} from "../../lib/site";
import { ICON, Icon, SafeImg } from "../../lib/ui";
import { parseProductPriceInput } from "../../lib/product-ops";
import type { ProductCategoryMismatch } from "../../lib/product-category-audit";
import type { AdminProductRow } from "./admin-types";

interface AdminProductListProps {
  products: AdminProductRow[];
  prodCategoryFilter: string;
  setProdCategoryFilter: (value: string) => void;
  prodStatusFilter: string;
  setProdStatusFilter: (value: string) => void;
  prodKeyword: string;
  setProdKeyword: (value: string) => void;
  pendingReviewProducts: number;
  staleSellingProducts: number;
  categoryMismatches: ProductCategoryMismatch[];
  cleanupSummary?: { productCount: number; photoCount: number };
  busyActionId: string | null;
  onFixCategoryMismatches: (targets: readonly ProductCategoryMismatch[]) => void;
  onStatusChange: (productId: string, nextStatus: string) => void;
  onPublishPendingProduct: (productId: string, price: string) => Promise<void> | void;
  onBulkPublishPendingProducts?: (
    items: ReadonlyArray<{ id: string; price: string }>
  ) => Promise<boolean | void> | boolean | void;
  onRunSoldCleanup?: () => Promise<void> | void;
  onStartEdit: (product: AdminProductRow) => void;
  onOpenSmartCrop: (product: AdminProductRow) => void;
  onRotateProductImage?: (
    product: AdminProductRow,
    imageIndex: number
  ) => Promise<void> | void;
  onDeleteProduct: (product: AdminProductRow) => void;
}

/** 관리자 대시보드 재고 상품 목록, 검수대기 공개, 카테고리 오분류 보정 및 장기재고·스토리지 점검 패널 */
export function AdminProductList({
  products,
  prodCategoryFilter,
  setProdCategoryFilter,
  prodStatusFilter,
  setProdStatusFilter,
  prodKeyword,
  setProdKeyword,
  pendingReviewProducts,
  staleSellingProducts,
  categoryMismatches,
  cleanupSummary,
  busyActionId,
  onFixCategoryMismatches,
  onStatusChange,
  onPublishPendingProduct,
  onBulkPublishPendingProducts,
  onRunSoldCleanup,
  onStartEdit,
  onOpenSmartCrop,
  onRotateProductImage,
  onDeleteProduct,
}: AdminProductListProps) {
  const [pendingPriceDrafts, setPendingPriceDrafts] = useState<
    Record<string, string>
  >({});
  const [deselectedPendingIds, setDeselectedPendingIds] = useState<Set<string>>(
    () => new Set()
  );

  const visiblePendingProducts = products.filter(
    (p) => normalizeProductStatus(p.status) === PRODUCT_STATUS.PENDING_REVIEW
  );
  const selectedPendingProducts = visiblePendingProducts.filter(
    (p) => !deselectedPendingIds.has(p.id)
  );
  const allVisiblePendingSelected =
    visiblePendingProducts.length > 0 &&
    selectedPendingProducts.length === visiblePendingProducts.length;
  const isBulkPublishing = busyActionId === "prod-bulk-publish";

  const getPendingDraftPrice = (product: AdminProductRow): string =>
    pendingPriceDrafts[product.id] ??
    (typeof product.price === "number" && product.price > 0
      ? String(product.price)
      : "");

  const togglePendingSelection = (productId: string) => {
    setDeselectedPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleToggleAllVisiblePending = () => {
    setDeselectedPendingIds((prev) => {
      const next = new Set(prev);
      if (allVisiblePendingSelected) {
        for (const p of visiblePendingProducts) {
          next.add(p.id);
        }
      } else {
        for (const p of visiblePendingProducts) {
          next.delete(p.id);
        }
      }
      return next;
    });
  };

  const handleTriggerBulkPublish = async () => {
    if (
      !onBulkPublishPendingProducts ||
      isBulkPublishing ||
      Boolean(busyActionId) ||
      selectedPendingProducts.length === 0
    ) {
      return;
    }

    const payload: Array<{ id: string; price: string }> = [];
    let pricedCount = 0;
    let inquiryCount = 0;

    for (const prod of selectedPendingProducts) {
      const rawPrice = getPendingDraftPrice(prod);
      const parsed = parseProductPriceInput(rawPrice);
      if (parsed === null) {
        toast.error(
          `'${prod.title}'의 판매가 형식이 올바르지 않습니다. 숫자만 입력하거나 비워 주세요.`
        );
        return;
      }
      if (parsed > 0) pricedCount += 1;
      else inquiryCount += 1;
      payload.push({ id: prod.id, price: rawPrice });
    }

    const confirmed = confirm(
      `선택한 검수대기 상품 ${payload.length}건을 한 번에 [판매중]으로 공개할까요?\n\n` +
        `- 판매가 입력됨: ${pricedCount}건\n` +
        `- 가격 미입력(가격 문의로 공개): ${inquiryCount}건\n` +
        `- 추가 AI(Gemini) API 호출: 0회 (비용 0원)`
    );
    if (!confirmed) return;

    const ok = await onBulkPublishPendingProducts(payload);
    if (ok !== false) {
      setPendingPriceDrafts((prev) => {
        const next = { ...prev };
        for (const item of payload) {
          delete next[item.id];
        }
        return next;
      });
    }
  };

  return (
    <section className="rounded-xl border border-[#E2E6EC] bg-white p-5 sm:p-6 lg:col-span-7 space-y-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E6EC] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-hb-lg font-bold text-[#141A23]">
            재고 목록 ({products.length}건)
          </h2>
          {products.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenSmartCrop(products[0])}
              className="h-8 rounded-lg border border-[#F5CEBE] bg-[#FFF4EE] px-2.5 text-hb-xs font-bold text-[#C84312] hover:bg-[#C84312] hover:text-white transition-colors cursor-pointer"
              title="현재 필터링된 기존 매물 사진을 1건씩 Before/After 확인하며 AI 스마트 크롭 보정"
            >
              사진 일괄 크롭 검수
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="재고 카테고리 필터"
            value={prodCategoryFilter}
            onChange={(e) => setProdCategoryFilter(e.target.value)}
            className="h-9 rounded border border-[#E2E6EC] px-2 text-hb-xs"
          >
            <option value="전체">전체 카테고리</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            aria-label="재고 판매 상태 필터"
            value={prodStatusFilter}
            onChange={(e) => setProdStatusFilter(e.target.value)}
            className="h-9 rounded border border-[#E2E6EC] px-2 text-hb-xs"
          >
            <option value="전체">전체 상태</option>
            {ADMIN_PRODUCT_STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="stale30">
              30일+ 장기 판매중 점검 ({staleSellingProducts}건)
            </option>
          </select>
          <input
            type="search"
            aria-label="상품명·사양 검색"
            value={prodKeyword}
            onChange={(e) => setProdKeyword(e.target.value)}
            placeholder="상품명·사양 검색"
            className="h-9 rounded border border-[#E2E6EC] px-2.5 text-hb-xs"
          />
        </div>
      </div>

      {categoryMismatches.length > 0 && (
        <div className="rounded-xl border border-[#F5CEBE] bg-[#FFF4EE] p-3.5 text-hb-xs text-[#141A23] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold text-[#C84312]">
                카테고리 오분류 의심 매물 {categoryMismatches.length}건이 감지되었습니다.
              </p>
              <p className="mt-0.5 text-[#5C6673]">
                잘못 분류된 매물은 품목 필터와 무상보증 안내가 어긋날 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              disabled={busyActionId === "prod-category-fix"}
              onClick={() => onFixCategoryMismatches(categoryMismatches)}
              className="rounded-lg bg-[#C84312] px-3 py-1.5 text-hb-xs font-bold text-white hover:bg-[#A8360D] disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
            >
              {busyActionId === "prod-category-fix"
                ? "일괄 보정 중..."
                : `오분류 ${categoryMismatches.length}건 일괄 보정`}
            </button>
          </div>

          <ul className="divide-y divide-[#F5CEBE]/70 rounded-lg border border-[#F5CEBE]/80 bg-white">
            {categoryMismatches.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#141A23]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[#5C6673]">
                    현재{" "}
                    <strong className="text-[#C84312]">
                      {item.currentCategory}
                    </strong>{" "}
                    → 추천{" "}
                    <strong className="text-[#141A23]">
                      {item.suggestedCategory}
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyActionId === "prod-category-fix"}
                  onClick={() => onFixCategoryMismatches([item])}
                  className="rounded-md border border-[#E2DDD3] bg-[#FAF9F6] px-2.5 py-1 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                >
                  바로 보정
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingReviewProducts > 0 &&
        prodStatusFilter !== PRODUCT_STATUS.PENDING_REVIEW && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3.5 py-2.5 text-hb-xs text-sky-950">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sky-900">
                가격 확인 후 공개 대기 중인 [검수대기(비공개)] 매물이{" "}
                {pendingReviewProducts}건 있습니다.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setProdStatusFilter(PRODUCT_STATUS.PENDING_REVIEW)}
              className="rounded bg-sky-700 px-2.5 py-1 text-hb-xs font-bold text-white hover:bg-sky-800 transition-colors shrink-0 cursor-pointer"
            >
              검수대기 ({pendingReviewProducts}건) 모아보기
            </button>
          </div>
        )}

      {prodStatusFilter === PRODUCT_STATUS.PENDING_REVIEW && (
        <div className="space-y-2.5 rounded-lg border border-sky-400 bg-sky-100/90 px-3.5 py-2.5 text-hb-xs text-sky-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold">
              검수대기(비공개) 검수 모드 ({products.length}건 표시 중 · 고객 페이지 비노출)
            </span>
            <button
              type="button"
              onClick={() => setProdStatusFilter("전체")}
              className="text-hb-xs font-bold text-sky-900 underline hover:text-black cursor-pointer"
            >
              전체 상태 보기
            </button>
          </div>

          {visiblePendingProducts.length > 0 && onBulkPublishPendingProducts && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sky-300/80 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 font-bold text-sky-950 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allVisiblePendingSelected}
                    disabled={isBulkPublishing}
                    onChange={handleToggleAllVisiblePending}
                    className="h-4 w-4 rounded border-sky-500 accent-[#141A23] cursor-pointer"
                  />
                  <span>
                    {allVisiblePendingSelected
                      ? "현재 목록 전체 해제"
                      : `현재 목록 전체 선택 (${visiblePendingProducts.length}건)`}
                  </span>
                </label>
                <span className="text-sky-900 tabular-nums">
                  선택{" "}
                  <strong>{selectedPendingProducts.length}</strong> /{" "}
                  {visiblePendingProducts.length}건 · 가격 미입력 건은 &apos;가격 문의&apos;로 공개
                </span>
              </div>

              <button
                type="button"
                disabled={
                  isBulkPublishing ||
                  Boolean(busyActionId) ||
                  selectedPendingProducts.length === 0
                }
                onClick={() => void handleTriggerBulkPublish()}
                className="h-8 rounded-lg bg-[#141A23] px-3 text-hb-xs font-bold text-white hover:bg-[#E8521A] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
              >
                {isBulkPublishing
                  ? "일괄 공개 중..."
                  : `선택 ${selectedPendingProducts.length}건 일괄 판매중 공개 (AI 0원)`}
              </button>
            </div>
          )}
        </div>
      )}

      {staleSellingProducts > 0 && prodStatusFilter !== "stale30" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-hb-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-800">
              30일 이상 등록된 장기 판매 중 매물이 {staleSellingProducts}건 있습니다.
            </span>
            <span className="text-amber-700 hidden sm:inline">
              가격 인하 또는 당근마켓/블로그 홍보를 권장합니다.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setProdStatusFilter("stale30")}
            className="rounded bg-amber-700 px-2.5 py-1 text-hb-xs font-bold text-white hover:bg-amber-800 transition-colors shrink-0"
          >
            장기 재고 모아보기
          </button>
        </div>
      )}

      {prodStatusFilter === "stale30" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-400 bg-amber-100 px-3.5 py-2 text-hb-xs text-amber-900">
          <span className="font-bold">
            30일+ 장기 판매 중 점검 모드 ({products.length}건 표시 중)
          </span>
          <button
            type="button"
            onClick={() => setProdStatusFilter("전체")}
            className="text-hb-xs font-bold text-amber-900 underline hover:text-black"
          >
            전체 상태 보기
          </button>
        </div>
      )}

      {cleanupSummary && cleanupSummary.photoCount > 0 && onRunSoldCleanup && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E2E6EC] bg-[#F9FAFB] px-3.5 py-2 text-hb-xs text-[#141A23]">
          <span>
            판매완료 90일+ 경과 {cleanupSummary.productCount}건에서 보조사진{" "}
            <strong className="text-[#E8521A] tabular-nums">
              {cleanupSummary.photoCount}장
            </strong>{" "}
            정리 가능 (대표 사진 보존)
          </span>
          <button
            type="button"
            disabled={busyActionId === "sold-photo-cleanup"}
            onClick={() => onRunSoldCleanup()}
            className="rounded border border-[#141A23] bg-white px-2.5 py-1 text-hb-xs font-bold text-[#141A23] hover:bg-[#141A23] hover:text-white disabled:opacity-40 cursor-pointer"
          >
            {busyActionId === "sold-photo-cleanup"
              ? "정리 중..."
              : `보조사진 정리 (${cleanupSummary.photoCount}장)`}
          </button>
        </div>
      )}

      <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
        {products.map((product) => {
          const imgs = splitImages(product.image_url);
          const catLabel = normalizeProductCategory(product.category);
          const statValue = normalizeProductStatus(product.status);
          const isPending = statValue === PRODUCT_STATUS.PENDING_REVIEW;
          const isPendingSelected = isPending && !deselectedPendingIds.has(product.id);
          const priceInputId = `pending-price-${product.id}`;
          const draftPrice = getPendingDraftPrice(product);

          return (
            <div
              key={product.id}
              className={`rounded-lg border p-3 transition-colors space-y-2.5 ${
                isPending
                  ? isPendingSelected
                    ? "border-sky-400 bg-sky-50/50 hover:border-sky-600"
                    : "border-[#CBD2DC] bg-[#F9FAFB] opacity-80"
                  : "border-[#E2E6EC] hover:border-[#141A23]/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {isPending &&
                    prodStatusFilter === PRODUCT_STATUS.PENDING_REVIEW &&
                    onBulkPublishPendingProducts && (
                      <input
                        type="checkbox"
                        checked={isPendingSelected}
                        disabled={isBulkPublishing}
                        onChange={() => togglePendingSelection(product.id)}
                        aria-label={`${product.title} 일괄 공개 선택`}
                        className="h-4 w-4 shrink-0 rounded border-sky-500 accent-[#141A23] cursor-pointer"
                      />
                    )}
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-[#F9FAFB] border border-[#E2E6EC]">
                    <SafeImg
                      src={imgs[0]}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-hb-xs font-bold text-[#6B7280]">
                        {catLabel} · 조회 {product.views || 0}
                      </span>
                      {isPending && (
                        <span className="rounded bg-sky-100 border border-sky-300 px-1.5 py-0.5 text-hb-xs font-bold text-sky-900">
                          검수대기 · 비공개
                        </span>
                      )}
                      {statValue === "판매중" &&
                        getDaysSinceCreated(product.created_at) >= 30 && (
                          <span className="rounded bg-amber-50 border border-amber-300 px-1.5 py-0.5 text-hb-xs font-bold text-amber-800">
                            등록 +{getDaysSinceCreated(product.created_at)}일 · 재고점검 권장
                          </span>
                        )}
                    </div>
                    <h3 className="truncate text-hb-sm font-bold text-[#141A23]">
                      {product.title}
                    </h3>
                    <p className="text-hb-sm font-bold text-[#E8521A]">
                      {formatProductPrice(product.price, catLabel)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          generatePromoPostText(product)
                        );
                        toast.success(
                          "당근마켓·네이버카페·블로그 홍보글이 복사되었습니다!"
                        );
                      } catch {
                        toast.error("복사에 실패했습니다.");
                      }
                    }}
                    className="h-9 rounded border border-[#FADCD0] bg-[#FFF4EE] px-2.5 text-hb-xs font-bold text-[#E8521A] hover:bg-[#E8521A] hover:text-white transition-colors"
                    title="당근마켓·네이버카페·블로그 업로드용 홍보 원고 복사"
                  >
                    홍보글 복사
                  </button>
                  <select
                    aria-label={`${product.title} 판매 상태 선택`}
                    value={statValue}
                    disabled={busyActionId === `prod-status-${product.id}`}
                    onChange={(e) => onStatusChange(product.id, e.target.value)}
                    className="h-9 rounded border border-[#E2E6EC] bg-white px-2 text-hb-xs font-bold text-[#141A23]"
                  >
                    {ADMIN_PRODUCT_STATUS_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onOpenSmartCrop(product)}
                    className="h-9 rounded border border-[#CBD2DC] bg-white px-2.5 text-hb-xs font-bold text-[#0F766E] hover:border-[#0F766E] hover:bg-[#F0FDFA] transition-colors cursor-pointer"
                    title="기존 등록 사진을 AI로 제품·명판 영역만 깔끔하게 보정"
                  >
                    스마트 크롭
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartEdit(product)}
                    className="h-9 rounded border border-[#E2E6EC] bg-[#F9FAFB] px-3 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23]"
                  >
                    편집
                  </button>
                  <button
                    type="button"
                    disabled={busyActionId === `prod-del-${product.id}`}
                    onClick={() => onDeleteProduct(product)}
                    className="h-9 rounded border border-red-200 bg-red-50 px-3 text-hb-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    삭제
                  </button>
                </div>
              </div>

              {isPending && (
                <div className="space-y-2 rounded-md border border-sky-200 bg-white p-2.5">
                  {imgs.length > 0 && onRotateProductImage && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-hb-xs text-[#5C6673]">
                        <span className="font-bold text-[#141A23]">
                          등록 사진 방향 검수 ({imgs.length}장)
                        </span>
                        <span>돌아간 사진은 버튼 1번으로 90° 회전</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {imgs.map((imgUrl, imgIdx) => {
                          const rotatingThis =
                            busyActionId === `prod-rotate-${product.id}-${imgIdx}`;
                          return (
                            <div
                              key={`${product.id}-pending-img-${imgIdx}`}
                              className="relative h-20 w-20 overflow-hidden rounded-md border border-[#E2E6EC] bg-[#F4F3F0]"
                            >
                              <SafeImg
                                src={imgUrl}
                                alt={`${product.title} 사진 ${imgIdx + 1}`}
                                className="h-full w-full object-cover"
                              />
                              <span className="absolute left-1 top-1 rounded bg-[#141A23]/80 px-1 py-0.5 text-hb-xs font-bold text-white tabular-nums leading-none">
                                {imgIdx === 0 ? "대표" : `#${imgIdx + 1}`}
                              </span>
                              <button
                                type="button"
                                disabled={Boolean(busyActionId)}
                                onClick={() => onRotateProductImage(product, imgIdx)}
                                title="시계방향 90도 회전 저장 (브라우저 처리 · 서버 CPU 0)"
                                aria-label={`${product.title} ${imgIdx + 1}번 사진 시계방향 90도 회전`}
                                className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded bg-[#141A23]/85 px-1.5 py-0.5 text-hb-xs font-bold text-white hover:bg-[#E8521A] disabled:opacity-40 transition-colors cursor-pointer"
                              >
                                <Icon d={ICON.rotate} className="w-3 h-3" />
                                <span>{rotatingThis ? "..." : "90°"}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor={priceInputId}
                      className="text-hb-xs font-bold text-[#141A23] whitespace-nowrap"
                    >
                      판매가(원)
                    </label>
                    <input
                      id={priceInputId}
                      type="text"
                      inputMode="numeric"
                      value={draftPrice}
                      onChange={(e) =>
                        setPendingPriceDrafts((prev) => ({
                          ...prev,
                          [product.id]: e.target.value,
                        }))
                      }
                      placeholder="예: 450000 (비우면 가격 문의)"
                      className="h-8 flex-1 min-w-[160px] rounded border border-[#CBD2DC] px-2.5 text-hb-xs text-[#141A23]"
                    />
                    <button
                      type="button"
                      disabled={busyActionId === `prod-publish-${product.id}`}
                      onClick={() => onPublishPendingProduct(product.id, draftPrice)}
                      className="h-8 rounded bg-[#141A23] px-3 text-hb-xs font-bold text-white hover:bg-[#E8521A] disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {busyActionId === `prod-publish-${product.id}`
                        ? "공개 중..."
                        : "판매중 공개"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
