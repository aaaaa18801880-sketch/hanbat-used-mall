// 파일 경로: components/admin/admin-product-list.tsx
"use client";

import React from "react";
import toast from "react-hot-toast";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS_LIST,
  formatProductPrice,
  generatePromoPostText,
  getDaysSinceCreated,
  normalizeProductCategory,
  normalizeProductStatus,
  splitImages,
} from "../../lib/site";
import { SafeImg } from "../../lib/ui";
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
  staleSellingProducts: number;
  categoryMismatches: ProductCategoryMismatch[];
  busyActionId: string | null;
  onFixCategoryMismatches: (targets: readonly ProductCategoryMismatch[]) => void;
  onStatusChange: (productId: string, nextStatus: string) => void;
  onStartEdit: (product: AdminProductRow) => void;
  onOpenSmartCrop: (product: AdminProductRow) => void;
  onDeleteProduct: (product: AdminProductRow) => void;
}

/** 관리자 대시보드 재고 상품 목록, 카테고리 오분류 일괄 보정 및 장기재고 점검 패널 */
export function AdminProductList({
  products,
  prodCategoryFilter,
  setProdCategoryFilter,
  prodStatusFilter,
  setProdStatusFilter,
  prodKeyword,
  setProdKeyword,
  staleSellingProducts,
  categoryMismatches,
  busyActionId,
  onFixCategoryMismatches,
  onStatusChange,
  onStartEdit,
  onOpenSmartCrop,
  onDeleteProduct,
}: AdminProductListProps) {
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
            {PRODUCT_STATUS_LIST.map((s) => (
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

      <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
        {products.map((product) => {
          const imgs = splitImages(product.image_url);
          const catLabel = normalizeProductCategory(product.category);
          const statValue = normalizeProductStatus(product.status);

          return (
            <div
              key={product.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#E2E6EC] p-3 hover:border-[#141A23]/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
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
                  {PRODUCT_STATUS_LIST.map((s) => (
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
          );
        })}
      </div>
    </section>
  );
}
