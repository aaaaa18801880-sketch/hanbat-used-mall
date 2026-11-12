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
import { ModernApplianceIcon } from "../ui/modern-icons";

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
      step: "01",
      title: "분해 세척·작동 점검",
      desc:
        isHvac || isMajorAppliance
          ? "입고 후 분해 고압세척 및 냉매·누수 시운전 완료"
          : "전문 엔지니어 작동 점검 및 살균 클리닝 완료",
      icon: "sparkle" as const,
      badge: "bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E]",
    },
    {
      step: "02",
      title: "사후 무상 A/S 보증",
      desc: warrantyHighlight,
      icon: "shield" as const,
      badge: "bg-[#FFF4EE] border border-[#FADCD0] text-[#E8521A]",
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
      aria-label="한밭중고전자 핵심 거래 보증 안내"
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
              <p className="mt-1 text-hb-xs leading-relaxed text-[#64748B] break-keep">
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

  const specSummaryText =
    specCapsules.length > 0 ? specCapsules.join(" · ") : "세척·검수 완료";

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-[border-color,box-shadow,transform] duration-200 has-[h3_a:focus-visible]:ring-2 has-[h3_a:focus-visible]:ring-[#141A23] has-[h3_button:focus-visible]:ring-2 has-[h3_button:focus-visible]:ring-[#141A23] ${
        isSelected
          ? "border-[#E8521A] ring-2 ring-[#E8521A] bg-[#FFFDFB] shadow-card"
          : "border-[#E2E6EC] shadow-2xs hover:-translate-y-0.5 hover:border-[#94A3B8] hover:shadow-card"
      }`}
    >
      {/* 1. 1:1 정방형 스튜디오 사진 영역 */}
      <div className="relative aspect-square w-full overflow-hidden hb-studio-backdrop">
        <SafeImg
          src={images[0]}
          alt={product.title}
          eager={eager}
          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
            sold ? "grayscale opacity-65" : ""
          }`}
        />

        <div
          className="pointer-events-none absolute inset-0 z-10 ring-1 ring-inset ring-black/[0.04]"
          aria-hidden="true"
        />

        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#141A23]/45 backdrop-blur-[1px]">
            <span className="rounded-full bg-[#141A23]/95 px-4 py-1.5 text-hb-xs font-bold tracking-wider text-white shadow-xs">
              판매완료
            </span>
          </div>
        )}

        {/* 좌상단 판매 상태 배지 & 외관 등급 */}
        {isSelectMode ? (
          <div
            className={`absolute left-2 top-2 sm:left-3 sm:top-3 z-20 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
              isSelected
                ? "border-[#E8521A] bg-[#E8521A] text-white"
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
              <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur-md px-2.5 py-0.5 text-hb-xs font-bold text-[#141A23] shadow-2xs">
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
              className="w-3 h-3 text-[#E8521A]"
            />
            <span>{isAdmin ? "수정" : "미리보기"}</span>
          </button>
        )}

        {/* 우하단 다중 사진 수량 */}
        {!sold && images.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#141A23]/75 px-2.5 py-0.5 text-hb-xs font-semibold text-white tabular-nums backdrop-blur-md">
            <Icon d={ICON.image} className="w-3 h-3 text-white/80" />+
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
            className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-xs hover:bg-red-50 transition-colors"
          >
            <Icon d={ICON.close} className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. 카드 본문 (제목 2줄 높이 고정으로 행 전체 가격 위치 일직선 정렬) */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-4 bg-white">
        <div>
          <div className="flex items-center justify-between gap-2 text-hb-xs">
            <span className="inline-flex items-center rounded bg-[#F1F3F6] px-2 py-0.5 font-semibold text-[#334155] truncate">
              {categoryLabel}
            </span>
            {modelName && (
              <span
                className="shrink-0 max-w-[52%] truncate font-mono text-hb-xs font-medium text-[#64748B]"
                title={modelName}
              >
                {modelName}
              </span>
            )}
          </div>

          <h3
            className={`mt-2 min-h-[2.8em] line-clamp-2 text-hb-sm sm:text-hb-base font-bold leading-[1.4] transition-colors break-keep ${
              sold
                ? "text-[#64748B]"
                : "text-[#141A23] group-hover:text-[#E8521A]"
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

          <div className="mt-2.5 flex items-baseline justify-between gap-2 min-w-0">
            {sold ? (
              <span className="text-hb-sm font-semibold text-[#64748B] truncate block">
                판매완료 · 유사매물 문의
              </span>
            ) : priced ? (
              <strong className="block text-hb-lg sm:text-hb-xl font-bold text-[#141A23] tabular-nums tracking-tight truncate">
                {priceText}
              </strong>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-hb-xs sm:text-hb-sm font-bold text-[#E8521A] truncate">
                <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#E8521A] shrink-0" />
                <span className="sm:hidden truncate">견적 상담</span>
                <span className="hidden sm:inline truncate">{priceText || "견적 상담 문의"}</span>
              </div>
            )}
            {!sold && (
              <span className="hidden xs:inline-flex items-center gap-1 shrink-0 text-hb-xs font-semibold text-[#0F766E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488]" />
                <span>검수필</span>
              </span>
            )}
          </div>
        </div>

        {/* 하단 스펙 캡슐 & 견적함 담기 버튼 */}
        <div className="mt-3 pt-2.5 border-t border-[#F1F3F6] flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1 min-w-0 overflow-hidden">
            {specCapsules.length > 0 ? (
              specCapsules.map((cap, capIdx) => (
                <span
                  key={cap}
                  className={`rounded-md bg-[#F1F3F6] border border-[#E2E6EC] px-2 py-0.5 text-hb-xs font-bold text-[#141A23] truncate whitespace-nowrap ${
                    capIdx > 0 ? "hidden sm:inline-block" : "inline-block"
                  }`}
                >
                  {cap}
                </span>
              ))
            ) : (
              <span className="inline-block rounded-md bg-[#F1F3F6] border border-[#E2E6EC] px-2 py-0.5 text-hb-xs font-semibold text-[#4E5968] truncate">
                {specSummaryText}
              </span>
            )}
          </div>

          {!isSelectMode && !sold ? (
            <button
              type="button"
              onClick={handleToggleBasket}
              aria-pressed={inBasket}
              title={inBasket ? "견적함에서 제외" : "관심 매물 견적함에 담기"}
              aria-label={`${inBasket ? "담김" : "견적함"} - ${
                product.title
              } ${inBasket ? "견적함에서 제외" : "견적함에 담기"}`}
              className={`relative z-20 shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-hb-xs font-bold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                inBasket
                  ? "bg-[#FFF4EE] text-[#E8521A] ring-1 ring-[#E8521A]/40"
                  : "bg-[#F1F3F6] text-[#141A23] hover:bg-[#141A23] hover:text-white"
              }`}
            >
              <Icon
                d={inBasket ? ICON.check : ICON.plus}
                className={`h-3 w-3 ${
                  inBasket ? "text-[#E8521A]" : "text-current"
                }`}
              />
              <span>{inBasket ? "담김" : "담기"}</span>
            </button>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-hb-xs font-semibold text-[#64748B] group-hover:text-[#141A23] transition-colors">
              <span>상세</span>
              <Icon d={ICON.right} className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
