"use client";

import React from "react";
import Link from "next/link";
import {
  extractModelName,
  formatProductPrice,
  hasProductPrice,
  isProductSold,
  normalizeProductCategory,
  splitImages,
} from "../../lib/site";
import { Icon, ICON, SafeImg } from "../../lib/ui";
import { ProductStatusBadge } from "./product-status-badge";

export interface ProductItem {
  id: string;
  title: string;
  category: string | null;
  description?: string | null;
  image_url: string | null;
  price: number | null;
  status: string | null;
  condition_grade?: string | null;
  created_at: string;
  views?: number | null;
}

export function ProductCard({
  product,
  onSelect,
  isSelectMode = false,
  isSelected = false,
  isAdmin = false,
  onDelete,
}: {
  product: ProductItem;
  onSelect?: (product: ProductItem) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}) {
  const images = splitImages(product.image_url);
  const sold = isProductSold(product.status);
  const categoryLabel = normalizeProductCategory(product.category);
  const priced = hasProductPrice(product.price);
  const priceText = formatProductPrice(product.price, categoryLabel);
  const modelName = extractModelName(product.description, product.title);

  const cardInner = (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-md border bg-white transition-all duration-200 ${
        isSelected
          ? "border-[#D9531E] ring-2 ring-[#D9531E] shadow-md"
          : "border-[#E4E0D8] hover:border-[#0E1A2B]/45 hover:shadow-card"
      }`}
    >
      {/* 1. 상품 이미지 영역 (4:5 고정 비율로 CLS 방지 및 세로형 가전 잘림 최소화) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#EFECE6]">
        <SafeImg
          src={images[0]}
          alt={product.title}
          className={`h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
            sold ? "grayscale opacity-70" : ""
          }`}
        />

        {/* 판매완료 오버레이 */}
        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0E1A2B]/45">
            <span className="rounded-sm border border-white/25 bg-[#0E1A2B]/90 px-4 py-1.5 text-[12px] font-bold tracking-[0.18em] text-white">
              판매완료
            </span>
          </div>
        )}

        {/* 좌측 상단: 일괄 선택 체크박스 또는 판매 상태 배지 */}
        {isSelectMode ? (
          <div
            className={`absolute left-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded border transition-all ${
              isSelected
                ? "border-[#D9531E] bg-[#D9531E] text-white shadow-xs scale-105"
                : "border-[#8A8478] bg-white/95 text-transparent"
            }`}
          >
            <Icon d={ICON.check} className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div className="absolute left-3 top-3 z-10">
            <ProductStatusBadge
              status={product.status}
              createdAt={product.created_at}
            />
          </div>
        )}

        {/* 우측 상단: 관리자 단건 삭제 버튼 */}
        {isAdmin && !isSelectMode && onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(product.id);
            }}
            title="상품 삭제"
            aria-label={`${product.title} 삭제`}
            className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-sm border border-red-200 bg-white/95 text-red-600 shadow hover:bg-red-50 transition-colors"
          >
            <Icon d={ICON.close} className="h-4 w-4" />
          </button>
        )}

        {/* 우측 하단: 다중 이미지 장수 표시 */}
        {images.length > 1 && (
          <span className="absolute bottom-2.5 right-2.5 z-10 rounded-sm bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white">
            +{images.length - 1}장
          </span>
        )}
      </div>

      {/* 2. 상품 정보 영역 */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-[12px] font-semibold text-[#8A8478]">
          <span className="truncate">{categoryLabel}</span>
          {typeof product.views === "number" && (
            <span className="shrink-0 text-[11px] text-[#8A8478]">
              조회 {product.views}
            </span>
          )}
        </div>

        {/* 상품명 (최대 2줄 고정으로 카드 높이 균일화) */}
        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-[1.42] text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors sm:text-[16px]">
          {product.title}
        </h3>

        {/* 확인된 모델명 (존재할 때만 노출, 가짜 정보 생성 금지) */}
        {modelName && (
          <p className="mt-1.5 truncate text-[12px] font-medium text-[#6B7280]">
            모델명: <span className="font-mono text-[#4B5260]">{modelName}</span>
          </p>
        )}

        {/* 하단 가격 및 상세 진입점 */}
        <div className="mt-auto pt-3.5 border-t border-[#EEEBE5] flex items-center justify-between gap-2">
          <div className="min-w-0">
            {sold ? (
              <span className="text-[16px] font-bold text-[#8A8478] sm:text-[17px]">
                판매완료
              </span>
            ) : priced ? (
              <span className="text-[17px] font-bold tracking-tight text-[#0E1A2B] sm:text-[19px]">
                {priceText}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#D9531E]">
                <Icon d={ICON.phone} className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{priceText}</span>
              </span>
            )}
          </div>

          <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[#6B7280] group-hover:text-[#0E1A2B]">
            <span className="hidden sm:inline">상세</span>
            <Icon
              d={ICON.right}
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </article>
  );

  if (onSelect) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${product.title} ${isSelectMode ? "선택" : "상세 보기"}`}
        onClick={() => onSelect(product)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(product);
          }
        }}
        className="block h-full w-full cursor-pointer text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B]"
      >
        {cardInner}
      </div>
    );
  }

  return (
    <Link
      href={`/${product.id}`}
      className="block h-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B]"
    >
      {cardInner}
    </Link>
  );
}
