"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  canUseNextImageUrl,
  extractModelName,
  extractSpecCapsules,
  formatProductPrice,
  getCategoryWarrantyInfo,
  hasProductPrice,
  isProductSold,
  normalizeProductCategory,
  splitImages,
  STORE,
  toggleQuoteBasketItem,
  trackEvent,
  triggerQuickInquiry,
} from "../../lib/site";
import { Icon, ICON, SafeImg, useQuoteBasket } from "../../lib/ui";
import { ProductStatusBadge } from "./product-status-badge";
import { ModernApplianceIcon } from "../ui/modern-icons";

export interface ProductItem {
  id: string;
  title: string;
  category: string | null;
  description?: string | null;
  model_name?: string | null;
  spec_capsules?: string[] | null;
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
  const warrantyHighlight = getCategoryWarrantyInfo(normalizedCategory).detailLabel;

  const items = [
    {
      step: "01",
      title: "고압세척·작동 점검",
      desc:
        isHvac || isMajorAppliance
          ? "입고 확인, 고압세척 및 배송 전 작동 점검 완료"
          : "입고 확인, 내·외부 세척 및 배송 전 작동 점검 완료",
      icon: "sparkle" as const,
      badge: "bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E]",
    },
    {
      step: "02",
      title: "사후 무상 A/S 보증",
      desc: warrantyHighlight,
      icon: "shield" as const,
      badge: "bg-[#FFF4EE] border border-[#FADCD0] text-[#C84312]",
    },
    {
      step: "03",
      title: "세금계산서·직배송",
      desc: "사업자 계산서 100% 정식 발행 및 충청권 직배송",
      icon: "tax" as const,
      badge: "bg-[#F0F9FF] border border-[#BAE6FD] text-[#0369A1]",
    },
  ] as const;

  return (
    <section
      aria-label={`${STORE.name} 핵심 거래 보증 안내`}
      className={`rounded-2xl border border-[#E2E6EC] bg-white overflow-hidden shadow-2xs ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E6EC]">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3 p-4">
            <ModernApplianceIcon
              name={item.icon}
              className="w-8 h-8 shrink-0 mt-0.5"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-hb-sm font-bold text-[#141A23]">
                <span
                  className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-hb-xs font-bold ${item.badge}`}
                >
                  {item.step}
                </span>
                <span className="truncate">{item.title}</span>
              </div>
              <p className="mt-1 text-hb-xs leading-relaxed text-[#475569] break-keep">
                {item.desc}
              </p>
            </div>
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
  const warrantyInfo = getCategoryWarrantyInfo(categoryLabel);
  const priced = hasProductPrice(product.price);
  const priceText = formatProductPrice(product.price, categoryLabel);
  const modelName =
    product.model_name !== undefined
      ? product.model_name
      : extractModelName(product.description, product.title);
  const specCapsules =
    product.spec_capsules && product.spec_capsules.length > 0
      ? product.spec_capsules.slice(0, 2)
      : extractSpecCapsules(
          product.title,
          product.description,
          2,
          product.category
        );

  const inBasket = useQuoteBasket().some((x) => x.id === product.id);

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

  const handleQuickQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    trackEvent("begin_buy_inquiry", {
      category: categoryLabel,
      location: "card_quick_quote",
    });
    triggerQuickInquiry({
      type: "구매 문의",
      productTitle: modelName
        ? `${product.title} (${modelName})`
        : product.title,
    });
  };

  const specSummaryText =
    specCapsules.length > 0 ? specCapsules.join(" · ") : "고압세척·작동점검 완료";

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white hb-product-card transition-[border-color,box-shadow,transform] duration-200 has-[h3_a:focus-visible]:ring-2 has-[h3_a:focus-visible]:ring-[#141A23] has-[h3_button:focus-visible]:ring-2 has-[h3_button:focus-visible]:ring-[#141A23] ${
        isSelected
          ? "border-[#C84312] ring-2 ring-[#C84312] bg-[#FFFDFB]"
          : "border-[#E2E6EC] hover:-translate-y-0.5 hover:border-[#94A3B8]"
      }`}
    >
      {/* 1. 1:1 정방형 스튜디오 사진 영역 */}
      <div className="relative aspect-square w-full overflow-hidden hb-studio-backdrop">
        {canUseNextImage && primaryImage ? (
          <Image
            key={primaryImage}
            src={primaryImage}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={eager}
            loading={eager ? "eager" : undefined}
            quality={80}
            referrerPolicy="no-referrer"
            onError={() => setFailedSrc(primaryImage)}
            className={`object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
              sold ? "grayscale opacity-65" : ""
            }`}
          />
        ) : (
          <SafeImg
            src={primaryImage}
            alt={product.title}
            eager={eager}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
              sold ? "grayscale opacity-65" : ""
            }`}
          />
        )}

        <div
          className="pointer-events-none absolute inset-0 z-10 ring-1 ring-inset ring-black/[0.04]"
          aria-hidden="true"
        />

        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#141A23]/45 backdrop-blur-[1px]">
            <span className="hb-trim rounded-full bg-[#141A23]/95 px-4 py-1.5 text-hb-xs font-bold tracking-wider text-white shadow-xs">
              판매완료
            </span>
          </div>
        )}

        {/* 좌상단 판매 상태 배지 & 외관 등급 */}
        {isSelectMode ? (
          <div
            className={`absolute left-2 top-2 sm:left-3 sm:top-3 z-20 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
              isSelected
                ? "border-[#C84312] bg-[#C84312] text-white"
                : "border-[#CBD2DC] bg-white/95 text-transparent"
            }`}
          >
            <Icon d={ICON.check} className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div className="absolute left-2 top-2 sm:left-3 sm:top-3 z-10 flex items-center gap-1.5 flex-wrap">
            <ProductStatusBadge
              status={product.status}
              createdAt={product.created_at}
              showNew={false}
            />
            {product.condition_grade && (
              <span className="hb-trim inline-flex items-center rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-hb-xs font-bold text-[#141A23] shadow-2xs">
                {product.condition_grade.split(" ")[0]}
              </span>
            )}
          </div>
        )}

        {/* 좌하단 빠른 미리보기 / 관리자 수정 버튼 */}
        {!isSelectMode && onQuickView && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            title={isAdmin ? "관리자 수정" : "상품 미리보기"}
            aria-label={`${product.title} ${isAdmin ? "수정" : "미리보기"}`}
            className={`absolute bottom-3 left-3 z-20 items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-hb-xs font-bold text-[#141A23] shadow-xs hover:bg-[#141A23] hover:text-white transition-[background-color,color,transform,opacity] cursor-pointer active:scale-[0.96] ${
              isAdmin
                ? "inline-flex"
                : "hidden sm:inline-flex opacity-0 group-hover:opacity-100 focus:opacity-100 duration-200"
            }`}
          >
            <Icon
              d={isAdmin ? ICON.pen : ICON.search}
              className="w-3 h-3 text-[#C84312]"
            />
            <span>{isAdmin ? "수정" : "미리보기"}</span>
          </button>
        )}

        {/* 우하단 다중 사진 수량 */}
        {!sold && images.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#141A23]/80 px-2.5 py-0.5 text-hb-xs font-semibold text-white tabular-nums backdrop-blur-md">
            <Icon d={ICON.image} className="w-3 h-3 text-white/85" />+
            {images.length - 1}
          </span>
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
            className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-red-700 shadow-xs hover:bg-red-50 transition-colors"
          >
            <Icon d={ICON.close} className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. 카드 본문 (WCAG AA 타이포그래피 위계 + 검수·보증 신뢰 바 + 비교·견적 동선) */}
      <div className="flex flex-1 flex-col justify-between p-3 hb-card-body bg-white">
        <div>
          {/* 메타 행: 카테고리 + 모델명 */}
          <div className="flex items-center justify-between gap-2 text-hb-xs text-[#475569]">
            <span className="font-semibold truncate">{categoryLabel}</span>
            {modelName && (
              <span
                className="shrink-0 max-w-[52%] truncate font-mono text-hb-xs font-semibold text-[#475569] tabular-nums"
                title={modelName}
              >
                {modelName}
              </span>
            )}
          </div>

          {/* 상품명 (2줄 고정 높이로 카드 행 가격선 일직선 정렬) */}
          <h3
            className={`mt-1.5 min-h-[2.8em] line-clamp-2 hb-card-title text-hb-sm font-bold leading-[1.4] transition-colors break-keep ${
              sold
                ? "text-[#475569]"
                : "text-[#141A23] group-hover:text-[#C84312]"
            }`}
          >
            {onSelect ? (
              <button
                type="button"
                aria-label={`${product.title} ${isSelectMode ? "선택" : "상세 보기"}`}
                onClick={() => onSelect(product)}
                className="text-left focus-visible:outline-none after:absolute after:inset-0 after:z-10 cursor-pointer"
              >
                {product.title}
              </button>
            ) : (
              <Link
                href={`/${product.id}`}
                className="focus-visible:outline-none after:absolute after:inset-0 after:z-10"
              >
                {product.title}
              </Link>
            )}
          </h3>

          {/* 가격 또는 맞춤 견적 행 */}
          <div className="mt-2 flex items-baseline justify-between gap-2 min-w-0">
            {sold ? (
              <span className="text-hb-sm font-semibold text-[#475569] truncate block">
                판매완료 · 유사매물 문의
              </span>
            ) : priced ? (
              <strong className="block hb-card-price text-hb-lg font-extrabold text-[#141A23] font-mono tabular-nums tracking-tight truncate">
                {priceText}
              </strong>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-hb-xs sm:text-hb-sm font-bold text-[#C84312] truncate">
                <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#C84312] shrink-0" />
                <span className="sm:hidden truncate">견적 상담</span>
                <span className="hidden sm:inline truncate">
                  {priceText || "견적 상담 문의"}
                </span>
              </div>
            )}
          </div>

          {/* 검수 완료 상태 & 무상 보증 요약 라인 (WCAG AA #0F766E / #334155) */}
          {!sold && (
            <div className="mt-2 flex items-center gap-1.5 text-hb-xs text-[#0F766E] min-w-0">
              <Icon d={ICON.shieldCheck} className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold shrink-0">작동점검</span>
              <span className="text-[#94A3B8]" aria-hidden="true">
                ·
              </span>
              <span className="font-semibold text-[#334155] truncate tabular-nums">
                {warrantyInfo.compactLabel}
              </span>
            </div>
          )}
        </div>

        {/* 하단 핵심 스펙(tabular-nums) + 비교·담기 / 빠른 견적 진입 동선 */}
        <div className="mt-3 pt-2.5 border-t border-[#E2E6EC] space-y-2 min-w-0">
          <p className="min-w-0 truncate font-mono text-hb-xs font-semibold text-[#334155] tabular-nums">
            {specSummaryText}
          </p>

          {!isSelectMode && !sold ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={handleToggleBasket}
                aria-pressed={inBasket}
                title={inBasket ? "비교·견적함에서 제외" : "비교·견적함에 담기"}
                aria-label={`${inBasket ? "담김" : "비교·담기"} - ${
                  product.title
                } ${inBasket ? "견적함에서 제외" : "견적함에 담기"}`}
                className={`hb-trim relative z-20 flex-1 min-h-[34px] inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-hb-xs font-bold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] cursor-pointer whitespace-nowrap ${
                  inBasket
                    ? "bg-[#FFF4EE] text-[#C84312] border border-[#C84312]/40"
                    : "bg-[#F7F8FA] text-[#141A23] border border-[#CBD2DC] hover:bg-[#141A23] hover:border-[#141A23] hover:text-white"
                }`}
              >
                <Icon
                  d={inBasket ? ICON.check : ICON.columns}
                  className={`h-3 w-3 shrink-0 ${
                    inBasket ? "text-[#C84312]" : "text-current"
                  }`}
                />
                <span>{inBasket ? "담김" : "비교·담기"}</span>
              </button>

              <button
                type="button"
                onClick={handleQuickQuote}
                title={`${product.title} 빠른 견적 문의`}
                aria-label={`${product.title} 빠른 견적 문의`}
                className="hb-trim relative z-20 hidden sm:inline-flex min-h-[34px] shrink-0 items-center justify-center gap-1 rounded-lg border border-[#E2E6EC] bg-white px-2.5 py-1.5 text-hb-xs font-bold text-[#334155] hover:border-[#C84312] hover:bg-[#FFF4EE] hover:text-[#C84312] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] transition-[background-color,color,border-color,transform] duration-150 cursor-pointer whitespace-nowrap"
              >
                <Icon d={ICON.chat} className="h-3 w-3 shrink-0" />
                <span>견적</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <span className="inline-flex shrink-0 items-center gap-0.5 text-hb-xs font-bold text-[#475569] group-hover:text-[#141A23] transition-colors">
                <span>상세 보기</span>
                <Icon d={ICON.right} className="h-3.5 w-3.5" />
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
