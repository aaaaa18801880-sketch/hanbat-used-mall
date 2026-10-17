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
      className={`rounded-lg border border-[#E6E3DC] bg-[#FAF9F7] ${className}`}
    >
      <div className="grid grid-cols-1 xs:grid-cols-3 divide-y xs:divide-y-0 xs:divide-x divide-[#E6E3DC]">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col justify-between px-3.5 py-3"
          >
            <div>
              <div className="flex items-center gap-1.5 text-[12.5px] sm:text-[13px] font-bold tracking-[-0.01em] text-[#0E1A2B]">
                <span
                  aria-hidden="true"
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D9531E]/12 text-[10px] font-extrabold text-[#D9531E]"
                >
                  ✓
                </span>
                <span className="truncate">{item.title}</span>
              </div>
              <p className="mt-1 text-[12px] leading-[1.45] text-[#434B59] break-keep">
                {item.desc}
              </p>
            </div>
            {item.highlight && (
              <span className="mt-1.5 inline-block text-[11px] font-semibold text-[#D9531E] break-keep">
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
      className={`group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white transition-all duration-200 ${
        isSelected
          ? "border-[#D9531E] ring-2 ring-[#D9531E] shadow-md"
          : "border-[#E6E3DC] hover:border-[#0E1A2B]/40 hover:shadow-card-hover hover:-translate-y-0.5"
      }`}
    >
      {/* 1. 상품 사진 영역 — [Ui-Layouts: Hover Cards 차용] 호버 시 줌인 & 하단 슬라이드업 상세 미리보기 바 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F2ED] border-b border-[#E6E3DC]">
        <SafeImg
          src={images[0]}
          alt={product.title}
          className={`h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.045] ${
            sold ? "grayscale opacity-70" : ""
          }`}
        />

        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0E1A2B]/45">
            <span className="rounded bg-[#0E1A2B]/90 px-4 py-1.5 text-[12.5px] font-bold tracking-wider text-white">
              판매완료
            </span>
          </div>
        )}

        {/* 호버 시 하단에서 부드럽게 올라오는 인터랙티브 오버레이 바 */}
        {!sold && !isSelectMode && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-gradient-to-t from-[#0E1A2B]/80 via-[#0E1A2B]/40 to-transparent px-3 pb-2.5 pt-7 opacity-0 translate-y-1.5 transition-all duration-250 ease-out group-hover:opacity-100 group-hover:translate-y-0"
          >
            <span className="inline-flex items-center gap-1 rounded bg-white/95 px-2 py-0.5 text-[11px] font-extrabold text-[#0E1A2B] shadow-2xs">
              {images.length > 1 ? `📷 실사진 ${images.length}장` : "✓ 분해세척·점검완료"}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[#D9531E] px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-2xs">
              상세 스펙 보기 →
            </span>
          </div>
        )}

        {isSelectMode ? (
          <div
            className={`absolute left-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded border transition-all ${
              isSelected
                ? "border-[#D9531E] bg-[#D9531E] text-white shadow-xs scale-105"
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
            className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded border border-red-200 bg-white/95 text-red-600 shadow hover:bg-red-50 transition-colors"
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
              className={`absolute right-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-bold shadow-2xs transition-all active:scale-95 ${
                inBasket
                  ? "border-[#D9531E] bg-[#D9531E] text-white"
                  : "border-[#D7D2C8] bg-white/95 text-[#0E1A2B] hover:border-[#0E1A2B]"
              }`}
            >
              <Icon d={inBasket ? ICON.check : ICON.plus} className="h-3 w-3" />
              <span>{inBasket ? "담김" : "견적함"}</span>
            </button>
          )
        )}
      </div>

      {/* 2. 상품 정보 영역 — 카테고리 · 제목 · 규격 · 가격의 명확한 타이포 위계 */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2 text-[12px] font-semibold text-[#667085]">
          <span className="truncate">{categoryLabel}</span>
          {typeof product.views === "number" && product.views > 0 ? (
            <span className="shrink-0 text-[11.5px] text-[#858076] tabular-nums">
              조회 {product.views}
            </span>
          ) : null}
        </div>

        <h3 className="mt-1.5 line-clamp-2 min-h-[2.7rem] sm:min-h-[2.9rem] text-[14.5px] sm:text-[16px] font-bold leading-[1.38] text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors break-keep">
          {product.title}
        </h3>

        {(specCapsules.length > 0 || modelName) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {specCapsules.map((tag) => (
              <span
                key={tag}
                className="rounded bg-[#F7F6F3] px-2 py-0.5 text-[11.5px] font-semibold text-[#434B59]"
              >
                {tag}
              </span>
            ))}
            {modelName && specCapsules.length < 2 && (
              <span className="truncate rounded bg-[#F7F6F3] px-2 py-0.5 font-mono text-[11px] font-medium text-[#667085]">
                {modelName}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3.5">
          <div className="pt-2.5 border-t border-[#E6E3DC] flex items-center justify-between gap-2">
            <div className="min-w-0">
              {sold ? (
                <span className="text-[15px] sm:text-[17px] font-bold text-[#858076]">
                  판매완료
                </span>
              ) : priced ? (
                <span className="text-[16px] xs:text-[17.5px] sm:text-[19px] font-extrabold tracking-tight text-[#0E1A2B] tabular-nums">
                  {priceText}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[13px] sm:text-[13.5px] font-bold text-[#D9531E]">
                  <Icon d={ICON.phone} className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{priceText}</span>
                </span>
              )}
            </div>

            <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-bold text-[#434B59] group-hover:text-[#D9531E] transition-colors">
              <span className="hidden sm:inline">보기</span>
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
        className="block h-full w-full cursor-pointer text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B]"
      >
        {cardInner}
      </div>
    );
  }

  return (
    <Link
      href={`/${product.id}`}
      className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B]"
    >
      {cardInner}
    </Link>
  );
}