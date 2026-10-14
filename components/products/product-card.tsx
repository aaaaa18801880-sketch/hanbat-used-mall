"use client";

import React from "react";
import Link from "next/link";
import {
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
}: {
  product: ProductItem;
  onSelect?: (product: ProductItem) => void;
}) {
  const images = splitImages(product.image_url);
  const sold = isProductSold(product.status);
  const categoryLabel = normalizeProductCategory(product.category);
  const priced = hasProductPrice(product.price);
  const priceText = formatProductPrice(product.price, categoryLabel);

  const content = (
    <article className="group flex h-full flex-col overflow-hidden rounded-md border border-[#E4E0D8] bg-white transition-all duration-200 hover:border-[#0E1A2B]/40 hover:shadow-card">
      {/* 상품 사진 영역 (4:5 고정 비율로 레이아웃 이동 방지) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#EFECE6]">
        <SafeImg
          src={images[0]}
          alt={product.title}
          className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
            sold ? "grayscale opacity-75" : ""
          }`}
        />

        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0E1A2B]/45">
            <span className="rounded-sm border border-white/25 bg-[#0E1A2B]/90 px-4 py-1.5 text-[12px] font-bold tracking-[0.18em] text-white">
              판매완료
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3">
          <ProductStatusBadge
            status={product.status}
            createdAt={product.created_at}
          />
        </div>

        {images.length > 1 && (
          <span className="absolute bottom-2.5 right-2.5 rounded-sm bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white">
            +{images.length - 1}장
          </span>
        )}
      </div>

      {/* 상품 정보 영역 */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-[12px] font-semibold text-[#8A8478]">
          <span>{categoryLabel}</span>
          {product.condition_grade && (
            <span className="truncate text-[#4B5260]">
              {product.condition_grade}
            </span>
          )}
        </div>

        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-[1.4] text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors sm:text-[16px]">
          {product.title}
        </h3>

        <div className="mt-auto pt-4 border-t border-[#EEEBE5] flex items-center justify-between gap-2">
          {sold ? (
            <span className="text-[16px] font-bold text-[#8A8478]">
              판매완료
            </span>
          ) : priced ? (
            <span className="text-[18px] font-bold tracking-tight text-[#0E1A2B] sm:text-[19px]">
              {priceText}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#D9531E]">
              <Icon d={ICON.phone} className="w-3.5 h-3.5" />
              <span>{priceText}</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6B7280] group-hover:text-[#0E1A2B]">
            <span>상세보기</span>
            <Icon
              d={ICON.right}
              className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </article>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B] rounded-md"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={`/${product.id}`}
      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B] rounded-md"
    >
      {content}
    </Link>
  );
}
