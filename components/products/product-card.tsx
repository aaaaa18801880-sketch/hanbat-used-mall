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
  trackEvent,
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
  const isMajorAppliance =
    normalizedCategory === "냉장고" || normalizedCategory === "세탁기/건조기";

  const warrantyHighlight = isHvac
    ? "에어컨류 계약조건별 최대 8개월"
    : isMajorAppliance
    ? "주요 가전 계약조건별 최대 4개월"
    : "품목 및 계약조건에 따라 협의 적용";

  const items = [
    {
      title: "세척·작동 점검",
      desc:
        isHvac || isMajorAppliance
          ? "입고 후 작동 테스트 및 고압 세척 완료"
          : "입고 후 전문 검수 및 클리닝 점검 완료",
      highlight: null,
    },
    {
      title: "사후 A/S 안내",
      desc: "계약 조건에 따라 보증 기간 차등 적용",
      highlight: warrantyHighlight,
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
      className={`rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] ${className}`}
    >
      <div className="grid grid-cols-1 xs:grid-cols-3 divide-y xs:divide-y-0 xs:divide-x divide-[#E5E2DC]">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col justify-between px-3.5 py-3"
          >
            <div>
              <div className="flex items-center gap-1.5 text-hb-xs sm:text-hb-sm font-bold tracking-[-0.01em] text-[#0E1A2B]">
                <span
                  aria-hidden="true"
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D9531E]/10 text-hb-xs font-extrabold text-[#D9531E]"
                >
                  <Icon d={ICON.check} className="w-3 h-3" />
                </span>
                <span className="truncate">{item.title}</span>
              </div>
              <p className="mt-1 text-hb-xs leading-[1.45] text-[#434B59] break-keep">
                {item.desc}
              </p>
            </div>
            {item.highlight && (
              <span className="mt-1.5 inline-block text-hb-xs font-semibold text-[#D9531E] break-keep">
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
  const priced = hasProductPrice(product.price);
  const priceText = formatProductPrice(product.price, categoryLabel);
  const modelName = extractModelName(product.description, product.title);
  const specCapsules = extractSpecCapsules(
    product.title,
    product.description,
    2
  );

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
      status: product.status,
      conditionGrade: product.condition_grade,
      description: product.description,
      modelName,
      imageUrl: images[0] || null,
      quantity: 1,
    });
    if (res.limitReached) {
      toast.error("견적함에는 최대 8개까지 담을 수 있습니다.");
    } else if (res.added) {
      trackEvent("add_to_quote_basket", {
        category: categoryLabel,
        location: "card",
      });
      toast.success("관심 매물 견적함에 담았습니다.");
    } else {
      toast("견적함에서 제외했습니다.");
    }
  };

  const cardInner = (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl border bg-white transition-all duration-150 ${
        isSelected
          ? "border-[#D9531E] ring-2 ring-[#D9531E]"
          : "border-[#E5E2DC] hover:border-[#0E1A2B] shadow-2xs"
      }`}
    >
      {/* 1. 상품 사진 영역 (배지 최소화로 제품 사진 시인성 극대화) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F7F6F3] border-b border-[#E5E2DC]">
        <SafeImg
          src={images[0]}
          alt={product.title}
          className={`h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02] ${
            sold ? "grayscale opacity-70" : ""
          }`}
        />

        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0E1A2B]/45">
            <span className="rounded bg-[#0E1A2B]/90 px-4 py-1.5 text-hb-xs font-bold tracking-wider text-white">
              판매완료
            </span>
          </div>
        )}

        {!sold && images.length > 1 && (
          <span className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 rounded bg-[#0E1A2B]/75 px-2 py-0.5 text-hb-xs font-semibold text-white tabular-nums">
            +{images.length - 1}장
          </span>
        )}

        {/* 2. 판매 상태 배지 (좌상단 단일 배치) */}
        {isSelectMode ? (
          <div
            className={`absolute left-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded border transition-colors ${
              isSelected
                ? "border-[#D9531E] bg-[#D9531E] text-white"
                : "border-[#858076] bg-white/95 text-transparent"
            }`}
          >
            <Icon d={ICON.check} className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 z-10">
            <ProductStatusBadge
              status={product.status}
              createdAt={product.created_at}
              showNew={false}
            />
          </div>
        )}

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
            className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded border border-red-200 bg-white/95 text-red-600 shadow hover:bg-red-50 transition-colors"
          >
            <Icon d={ICON.close} className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 3~6. 상품명 · 주요 사양/모델명 · 가격 · 견적함 동작 */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 bg-white">
        <div>
          <div className="flex items-center justify-between gap-2 text-hb-xs">
            <span className="font-semibold text-[#646E7E] truncate">
              {categoryLabel}
            </span>
            {modelName ? (
              <span
                className="shrink-0 max-w-[55%] truncate font-mono text-hb-xs text-[#646E7E]"
                title={modelName}
              >
                {modelName}
              </span>
            ) : null}
          </div>

          <h3
            className={`mt-1.5 line-clamp-2 min-h-[2.7rem] sm:min-h-[2.9rem] text-hb-sm sm:text-hb-base font-bold leading-[1.38] tracking-[-0.015em] transition-colors break-keep ${
              sold
                ? "text-[#646E7E]"
                : "text-[#0E1A2B] group-hover:text-[#D9531E]"
            }`}
          >
            {product.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-1 min-h-[1.6rem]">
            {specCapsules.length > 0 ? (
              specCapsules.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2 py-0.5 text-hb-xs font-medium text-[#434B59]"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2 py-0.5 text-hb-xs font-medium text-[#646E7E]">
                세척·점검 완료
              </span>
            )}
          </div>
        </div>

        {/* 5. 가격 & 6. 견적함 동작 */}
        <div className="mt-3.5 pt-3 border-t border-[#F0EDE7] flex items-center justify-between gap-2">
          <div className="min-w-0">
            {sold ? (
              <span className="text-hb-sm sm:text-hb-base font-bold text-[#646E7E]">
                판매완료
              </span>
            ) : priced ? (
              <strong className="block text-hb-base sm:text-hb-lg font-extrabold tracking-tight text-[#0E1A2B] tabular-nums">
                {priceText}
              </strong>
            ) : (
              <strong className="inline-flex items-center gap-1 text-hb-sm font-bold text-[#D9531E]">
                <Icon d={ICON.phone} className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{priceText}</span>
              </strong>
            )}
          </div>

          {!isSelectMode && !sold ? (
            <button
              type="button"
              onClick={handleToggleBasket}
              aria-pressed={inBasket}
              title={inBasket ? "견적함에서 제외" : "관심 매물 견적함에 담기"}
              aria-label={`${product.title} ${
                inBasket ? "견적함에서 제외" : "견적함에 담기"
              }`}
              className={`shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-hb-xs font-bold transition-colors cursor-pointer ${
                inBasket
                  ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                  : "border-[#D7D2C8] bg-[#FAF9F7] text-[#0E1A2B] hover:border-[#0E1A2B] hover:bg-white"
              }`}
            >
              <Icon
                d={inBasket ? ICON.check : ICON.plus}
                className={`h-3 w-3 ${
                  inBasket ? "text-[#FF8A50]" : "text-[#D9531E]"
                }`}
              />
              <span>{inBasket ? "담김" : "견적함"}</span>
            </button>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-hb-xs font-semibold text-[#646E7E] group-hover:text-[#0E1A2B] transition-colors">
              <span>상세</span>
              <Icon d={ICON.right} className="h-3.5 w-3.5" />
            </span>
          )}
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
        className="block h-full w-full cursor-pointer text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B]"
      >
        {cardInner}
      </div>
    );
  }

  return (
    <Link
      href={`/${product.id}`}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B]"
    >
      {cardInner}
    </Link>
  );
}
