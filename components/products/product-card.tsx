// 파일 경로: components/products/product-card.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  extractModelName,
  extractSpecCapsules,
  formatProductPrice,
  getQuoteBasket,
  hasProductPrice,
  isProductSold,
  normalizeProductCategory,
  QUOTE_BASKET_EVENT,
  splitImages,
  toggleQuoteBasketItem,
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

export function ProductTrustMicroStrip({
  category,
  className = "",
}: {
  category?: string | null;
  className?: string;
}) {
  const normalizedCategory = normalizeProductCategory(category);
  const isHvac = normalizedCategory === "에어컨/냉난방기";

  const items = [
    {
      title: "세척·작동 점검",
      desc: "입고 후 작동 테스트 및 고압 세척 완료",
      highlight: null,
    },
    {
      title: "무상 A/S 보증",
      desc: "에어컨·냉난방기 8개월 / 그 외 가전 4개월",
      highlight: isHvac
        ? "해당 품목 8개월 보증 (계약조건 기준)"
        : "해당 품목 4개월 보증 (계약조건 기준)",
    },
    {
      title: "세금계산서 발행",
      desc: "사업자 고객을 위한 합법 부가세 증빙 지원",
      highlight: null,
    },
  ] as const;

  return (
    <section
      aria-label="한밭중고전자 핵심 거래 보증 안내"
      className={`rounded-md border border-[#E4E0D8] bg-[#FAF9F7] ${className}`}
    >
      <div className="grid grid-cols-3 divide-x divide-[#E4E0D8]">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col justify-between px-2.5 py-2.5 sm:px-3.5 sm:py-3"
          >
            <div>
              <div className="flex items-center gap-1 text-[11.5px] sm:text-[12.5px] font-bold tracking-[-0.01em] text-[#0E1A2B]">
                <span
                  aria-hidden="true"
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D9531E]/12 text-[10px] font-extrabold text-[#D9531E]"
                >
                  ✓
                </span>
                <span className="truncate">{item.title}</span>
              </div>
              <p className="mt-1 text-[10.5px] sm:text-[11.5px] leading-[1.4] text-[#4B5260] break-keep">
                {item.desc}
              </p>
            </div>
            {item.highlight && (
              <span className="mt-1.5 inline-block text-[10px] font-semibold text-[#D9531E] break-keep">
                · {item.highlight}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
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
  const isHvac = categoryLabel === "에어컨/냉난방기";
  const priced = hasProductPrice(product.price);
  const priceText = formatProductPrice(product.price, categoryLabel);
  const modelName = extractModelName(product.description, product.title);
  const specCapsules = extractSpecCapsules(product.title, product.description, 3);

  const [inBasket, setInBasket] = useState(false);

  useEffect(() => {
    const sync = () => {
      setInBasket(getQuoteBasket().some((x) => x.id === product.id));
    };
    sync();
    window.addEventListener(QUOTE_BASKET_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(QUOTE_BASKET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [product.id]);

  const handleToggleBasket = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const res = toggleQuoteBasketItem({
      id: product.id,
      title: product.title,
      category: categoryLabel,
      price: product.price,
      modelName,
      imageUrl: images[0] || null,
    });
    if (res.limitReached) {
      toast.error("견적함에는 최대 8개까지 담을 수 있습니다.");
    } else if (res.added) {
      toast.success("관심 매물 견적함에 담았습니다.");
    } else {
      toast("견적함에서 제외했습니다.");
    }
  };

  const cardInner = (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-md border bg-white transition-all duration-200 ${
        isSelected
          ? "border-[#D9531E] ring-2 ring-[#D9531E] shadow-md"
          : "border-[#E4E0D8] hover:border-[#0E1A2B]/45 hover:shadow-card"
      }`}
    >
      {/* 1. 상품 이미지 영역 (4:5 고정 비율) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#EFECE6] border-b border-[#EEEBE5]">
        <SafeImg
          src={images[0]}
          alt={product.title}
          className={`h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
            sold ? "grayscale opacity-70" : ""
          }`}
        />

        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0E1A2B]/45">
            <span className="rounded-sm border border-white/25 bg-[#0E1A2B]/90 px-4 py-1.5 text-[12px] font-bold tracking-[0.18em] text-white">
              판매완료
            </span>
          </div>
        )}

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

        {isAdmin && !isSelectMode && onDelete ? (
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
        ) : (
          !isSelectMode &&
          !sold && (
            <button
              type="button"
              onClick={handleToggleBasket}
              aria-pressed={inBasket}
              title={inBasket ? "견적함에서 제외" : "관심 매물 견적함에 담기"}
              aria-label={`${product.title} ${inBasket ? "견적함에서 제외" : "견적함에 담기"}`}
              className={`absolute right-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[11px] font-bold shadow-2xs transition-colors ${
                inBasket
                  ? "border-[#D9531E] bg-[#D9531E] text-white"
                  : "border-[#DDD9D1] bg-white/95 text-[#0E1A2B] hover:border-[#0E1A2B]"
              }`}
            >
              <Icon d={inBasket ? ICON.check : ICON.plus} className="h-3 w-3" />
              <span>{inBasket ? "담김" : "견적함"}</span>
            </button>
          )
        )}

        {images.length > 1 && (
          <span className="absolute bottom-2.5 right-2.5 z-10 rounded-sm bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white">
            +{images.length - 1}장
          </span>
        )}
      </div>

      {/* 2. 상품 정보 영역 (상품명 길이와 무관하게 하단 가격 줄 정렬 유지) */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2 text-[11.5px] font-semibold text-[#8A8478]">
          <span className="truncate">{categoryLabel}</span>
          {typeof product.views === "number" && (
            <span className="shrink-0 text-[11px] text-[#8A8478]">
              조회 {product.views}
            </span>
          )}
        </div>

        <h3 className="mt-1.5 line-clamp-2 min-h-[2.75rem] text-[14.5px] font-bold leading-[1.4] text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors sm:text-[15.5px]">
          {product.title}
        </h3>

        {specCapsules.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {specCapsules.map((tag) => (
              <span
                key={tag}
                className="rounded-sm bg-[#F6F5F2] border border-[#E4E0D8] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#4B5260]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {modelName && (
          <p className="mt-1 truncate text-[12px] font-medium text-[#6B7280]">
            모델명: <span className="font-mono text-[#4B5260]">{modelName}</span>
          </p>
        )}

        {/* 컴팩트 핵심 가치 인증 배지 (세척검수 · 무상A/S보증) */}
        <div className="mt-auto pt-2.5">
          <div className="mb-2 flex items-center gap-1.5 rounded-sm border border-[#E4E0D8] bg-[#FAF9F7] px-2 py-1 text-[10.5px] font-semibold text-[#4B5260]">
            <span className="font-extrabold text-[#D9531E]" aria-hidden="true">
              ✓
            </span>
            <span className="truncate">
              세척검수 · A/S {isHvac ? "8개월" : "4개월"} 보증
            </span>
          </div>

          <div className="pt-2.5 border-t border-[#EEEBE5] flex items-center justify-between gap-2">
            <div className="min-w-0">
              {sold ? (
                <span className="text-[15.5px] font-bold text-[#8A8478] sm:text-[16.5px]">
                  판매완료
                </span>
              ) : priced ? (
                <span className="text-[16.5px] font-bold tracking-tight text-[#0E1A2B] sm:text-[18px]">
                  {priceText}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#D9531E]">
                  <Icon d={ICON.phone} className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{priceText}</span>
                </span>
              )}
            </div>

            <span className="inline-flex shrink-0 items-center gap-0.5 text-[11.5px] font-semibold text-[#6B7280] group-hover:text-[#0E1A2B]">
              <span className="hidden sm:inline">상세</span>
              <Icon
                d={ICON.right}
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
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