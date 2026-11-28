"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  canUseNextImageUrl,
  extractModelName,
  extractSpecCapsules,
  extractWidthMmFromText,
  formatProductPrice,
  getCategoryWarrantyInfo,
  hasProductPrice,
  isProductSold,
  MAX_QUOTE_BASKET_ITEMS,
  normalizeProductCategory,
  splitImages,
  STORE,
  toggleQuoteBasketItem,
  trackEvent,
} from "../../lib/site";
import {
  buildProductCardDisplay,
  resolveCardWarrantyCategory,
  splitWarrantyHighlight,
} from "../../lib/product-card-meta";
import { Icon, ICON, SafeImg, useQuoteBasket } from "../../lib/ui";

export interface ProductItem {
  id: string;
  title: string;
  category: string | null;
  description?: string | null;
  model_name?: string | null;
  spec_capsules?: string[] | null;
  width_mm?: number | null;
  commercial_hint?: "showcase" | "bizFridge" | "kitchen" | null;
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
  const warrantyHighlight =
    getCategoryWarrantyInfo(normalizedCategory).detailLabel;

  const items = [
    {
      step: "01.",
      title: "고압세척·작동 점검",
      desc:
        isHvac || isMajorAppliance
          ? "입고 확인, 고압세척 및 배송 전 작동 점검 완료"
          : "입고 확인, 내·외부 세척 및 배송 전 작동 점검 완료",
      accent: "text-[#0F766E]",
    },
    {
      step: "02.",
      title: "사후 무상 A/S 보증",
      desc: warrantyHighlight,
      accent: "text-[#C84312]",
    },
    {
      step: "03.",
      title: "세금계산서·직배송",
      desc: "사업자 계산서 100% 정식 발행 및 충청권 직배송",
      accent: "text-[#141A23]",
    },
  ] as const;

  return (
    <section
      aria-label={`${STORE.name} 핵심 거래 보증 안내`}
      className={`border-y border-[#EAE8E2] ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE8E2]">
        {items.map((item) => (
          <div
            key={item.title}
            className="py-3 sm:py-3.5 sm:px-3.5 first:sm:pl-0 last:sm:pr-0"
          >
            <div className="flex items-baseline gap-1.5 text-hb-xs sm:text-hb-sm font-bold text-[#141A23]">
              <span
                className={`font-mono text-hb-xs font-bold tabular-nums ${item.accent}`}
              >
                {item.step}
              </span>
              <span className="truncate">{item.title}</span>
            </div>
            <p className="mt-1 text-hb-xs leading-relaxed text-[#64748B] break-keep">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProductCard({
  product,
  onSelect,
  onQuickView,
  isSelectMode = false,
  isSelected = false,
  isAdmin = false,
  onDelete,
  eager = false,
}: {
  product: ProductItem;
  onSelect?: (product: ProductItem) => void;
  onQuickView?: (product: ProductItem) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  eager?: boolean;
}) {
  const images = splitImages(product.image_url);
  const primaryImage = images[0];
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const canUseNextImage =
    canUseNextImageUrl(primaryImage) && failedSrc !== primaryImage;
  const sold = isProductSold(product.status);
  const categoryLabel = normalizeProductCategory(product.category);
  const modelName =
    product.model_name !== undefined
      ? product.model_name
      : extractModelName(product.description, product.title);
  const specCapsules =
    product.spec_capsules && product.spec_capsules.length > 0
      ? product.spec_capsules.slice(0, 3)
      : extractSpecCapsules(
          product.title,
          product.description,
          3,
          product.category
        );

  const { brandLabel, hasBrand, descriptiveTitle, modelCode, specSummary } =
    buildProductCardDisplay({
      title: product.title,
      categoryLabel,
      modelName,
      specCapsules,
    });
  const warrantyCategory = resolveCardWarrantyCategory(
    categoryLabel,
    product.title
  );
  const warrantyHighlight = splitWarrantyHighlight(
    getCategoryWarrantyInfo(warrantyCategory).compactLabel
  );

  const inBasket = useQuoteBasket().some((x) => x.id === product.id);

  const handleToggleBasket = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const resolvedWidthMm =
      product.width_mm !== undefined
        ? product.width_mm
        : extractWidthMmFromText(
            `${product.title || ""}\n${product.description || ""}`
          );
    const res = toggleQuoteBasketItem({
      id: product.id,
      title: product.title,
      category: categoryLabel,
      price: product.price,
      status: product.status,
      conditionGrade: product.condition_grade,
      description: product.description,
      modelName,
      specCapsules,
      widthMm: resolvedWidthMm,
      imageUrl: images[0] || null,
      quantity: 1,
    });
    if (res.limitReached) {
      toast.error(
        `견적함에는 최대 ${MAX_QUOTE_BASKET_ITEMS}개까지 담을 수 있습니다.`
      );
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

  return (
    <article
      className={`group relative flex flex-col min-w-0 hb-product-card bg-white transition-colors duration-200 has-[h3_a:focus-visible]:ring-2 has-[h3_a:focus-visible]:ring-[#141A23] has-[h3_a:focus-visible]:ring-offset-4 has-[h3_button:focus-visible]:ring-2 has-[h3_button:focus-visible]:ring-[#141A23] has-[h3_button:focus-visible]:ring-offset-4 ${
        isSelected ? "ring-2 ring-[#C84312] ring-offset-4 rounded-sm" : ""
      }`}
    >
      {/* 1. 프레임리스 에디토리얼 4:5 갤러리 포토 캔버스 (흰 여백 자동 크롭 + 자연 융화) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[4px] bg-[#F6F6F3]">
        {canUseNextImage && primaryImage ? (
          <Image
            key={primaryImage}
            src={primaryImage}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 310px"
            priority={eager}
            loading={eager ? "eager" : undefined}
            quality={80}
            referrerPolicy="no-referrer"
            onError={() => setFailedSrc(primaryImage)}
            className={`object-cover mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.04] ${
              sold ? "grayscale opacity-55" : ""
            }`}
          />
        ) : (
          <SafeImg
            src={primaryImage}
            alt={product.title}
            eager={eager}
            className={`h-full w-full object-cover mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.04] ${
              sold ? "grayscale opacity-55" : ""
            }`}
          />
        )}

        {/* 은은한 갤러리 프레임 경계 */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[4px] ring-1 ring-inset ring-black/5"
          aria-hidden="true"
        />

        {sold && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#141A23]/40 backdrop-blur-[1px]">
            <span className="hb-trim rounded-sm bg-[#141A23]/95 px-3 py-1.5 text-hb-xs font-bold tracking-[0.04em] text-white">
              판매완료
            </span>
          </div>
        )}

        {!isSelectMode && !sold && (
          <button
            type="button"
            onClick={handleToggleBasket}
            aria-pressed={inBasket}
            title={
              inBasket
                ? "비교·견적함에서 제외"
                : "관심 매물 비교·견적함에 담기"
            }
            aria-label={`${inBasket ? "담김" : "비교"} - ${
              product.title
            } ${inBasket ? "비교함 제외" : "비교·견적함에 담기"}`}
            className={`absolute bottom-2.5 right-2.5 z-20 inline-flex h-8 items-center gap-1 rounded-[4px] border px-2.5 text-hb-xs font-semibold transition-[opacity,background-color,border-color,color,transform] duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] ${
              inBasket
                ? "border-[#141A23] bg-[#141A23] text-white opacity-100"
                : "border-black/10 bg-white/90 text-[#141A23] backdrop-blur-sm opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 hover:bg-[#141A23] hover:text-white hover:border-[#141A23]"
            }`}
          >
            <Icon
              d={inBasket ? ICON.check : ICON.plus}
              className="h-3.5 w-3.5 shrink-0"
            />
            <span>{inBasket ? "담김" : "비교"}</span>
          </button>
        )}

        {isSelectMode && (
          <div
            className={`absolute left-2.5 top-2.5 z-20 flex h-6 w-6 items-center justify-center rounded-sm border transition-colors ${
              isSelected
                ? "border-[#C84312] bg-[#C84312] text-white"
                : "border-[#CFC7BA] bg-white/95 text-transparent"
            }`}
          >
            <Icon d={ICON.check} className="h-3.5 w-3.5" />
          </div>
        )}

        {isAdmin && !isSelectMode && onQuickView && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            title="관리자 수정"
            aria-label={`${product.title} 수정`}
            className="absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-sm bg-white/95 backdrop-blur-md px-2 py-1 text-hb-xs font-bold text-[#141A23] shadow-2xs hover:bg-[#141A23] hover:text-white transition-colors cursor-pointer"
          >
            <Icon d={ICON.pen} className="w-3 h-3 text-[#C84312]" />
            <span>수정</span>
          </button>
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
            className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-sm bg-white/95 text-red-700 shadow-2xs hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Icon d={ICON.close} className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. 코오롱몰·에디토리얼 스타일 제품 정보 타이포그래피 블록 */}
      <div className="flex flex-1 flex-col justify-between pt-3.5 min-w-0">
        <div className="min-w-0">
          {/* 상단 메타: 제조사 + 모델명 */}
          <div className="flex items-center justify-between gap-2 text-hb-xs">
            <span
              className={`truncate font-bold tracking-[-0.01em] ${
                hasBrand ? "text-[#141A23]" : "text-[#526071]"
              }`}
            >
              {brandLabel}
            </span>
            {modelCode && (
              <span className="truncate font-mono text-hb-xs text-[#8B95A1] tabular-nums">
                {modelCode}
              </span>
            )}
          </div>

          {/* 제품명 (깔끔한 2줄, 절제된 웨이트) */}
          <h3
            className={`mt-1 line-clamp-2 text-hb-sm sm:text-hb-base font-medium leading-[1.45] tracking-[-0.015em] transition-colors break-keep ${
              sold
                ? "text-[#8B95A1]"
                : "text-[#222933] group-hover:text-[#141A23] group-hover:underline underline-offset-4 decoration-[#141A23]/40"
            }`}
          >
            {onSelect ? (
              <button
                type="button"
                aria-label={`${product.title} ${
                  isSelectMode ? "선택" : "상세 보기"
                }`}
                onClick={() => onSelect(product)}
                className="text-left focus-visible:outline-none after:absolute after:inset-0 after:z-10 cursor-pointer"
              >
                {descriptiveTitle}
              </button>
            ) : (
              <Link
                href={`/${product.id}`}
                className="focus-visible:outline-none after:absolute after:inset-0 after:z-10"
              >
                {descriptiveTitle}
              </Link>
            )}
          </h3>

          {/* 핵심 규격 요약 1줄 */}
          {specSummary && (
            <p className="mt-1 truncate text-hb-xs text-[#7B8492]">
              {specSummary}
            </p>
          )}
        </div>

        {/* 하단 가격 · 보증 영역 (절제된 딥 잉크 대비) */}
        <div className="mt-3 pt-2.5 border-t border-[#F0EFEA] flex items-baseline justify-between gap-2 min-w-0">
          {sold ? (
            <>
              <span className="text-hb-sm font-bold text-[#8B95A1]">
                판매완료
              </span>
              <span className="truncate text-hb-xs text-[#94A3B8]">
                유사매물 문의
              </span>
            </>
          ) : (
            <>
              {hasProductPrice(product.price) ? (
                <span className="text-hb-base sm:text-hb-lg font-extrabold text-[#141A23] tabular-nums whitespace-nowrap tracking-[-0.02em]">
                  {formatProductPrice(product.price, categoryLabel)}
                </span>
              ) : (
                <span className="text-hb-sm sm:text-hb-base font-extrabold text-[#141A23] whitespace-nowrap tracking-[-0.02em]">
                  가격 상담
                </span>
              )}
              <span className="truncate text-hb-xs font-semibold text-[#0F766E] tabular-nums">
                {warrantyHighlight.accent} {warrantyHighlight.label}
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
