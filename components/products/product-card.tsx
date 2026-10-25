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
          ? "입고 후 작동 테스트 및 고압 세척 완료"
          : "입고 후 전문 검수 및 클리닝 점검 완료",
      highlight: null,
      icon: "sparkle" as const,
      color: "text-[#0D9488]",
      badge: "bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]",
    },
    {
      step: "02",
      title: "사후 무상 A/S 보증",
      desc: "계약 조건에 따라 보증 기간 차등 적용",
      highlight: warrantyHighlight,
      icon: "shield" as const,
      color: "text-[#D9531E]",
      badge: "bg-[#FFF5F0] text-[#D9531E] border-[#FADCD0]",
    },
    {
      step: "03",
      title: "세금계산서·직배송",
      desc: "사업자 부가세 증빙 및 직영 배송·설치 지원",
      highlight: null,
      icon: "tax" as const,
      color: "text-[#0284C7]",
      badge: "bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]",
    },
  ] as const;

  return (
    <section
      aria-label="한밭중고전자 핵심 거래 보증 안내"
      className={`border-y border-[#E5E2DC] bg-[#FAF9F7] ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E2DC]">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col justify-between px-4 py-3.5"
          >
            <div>
              <div className="flex items-center gap-2.5 text-hb-xs sm:text-hb-sm font-bold tracking-[-0.01em] text-[#0E1A2B]">
                <ModernApplianceIcon name={item.icon} className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
                <span className={`font-mono text-hb-xs font-extrabold ${item.color}`}>
                  {item.step}
                </span>
                <span className="truncate">{item.title}</span>
              </div>
              <p className="mt-1.5 text-hb-xs leading-[1.45] text-[#434B59] break-keep">
                {item.desc}
              </p>
            </div>
            {item.highlight && (
              <span className={`mt-1 inline-block text-hb-xs font-semibold ${item.color} break-keep`}>
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
    3
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
    specCapsules.length > 0
      ? specCapsules.join(" · ")
      : "분해 세척 · 작동 검수 완료";

  const cardInner = (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-[#D9531E] bg-[#FFFDFB] shadow-card-hover"
          : "hb-surface-card hover:border-[#0E1A2B]/40 hover:shadow-card-hover"
      }`}
    >
      {/* 1. 시원시원한 대형 풀블리드 사진 (스튜디오 조명 백드롭 적용) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden hb-studio-backdrop">
        <SafeImg
          src={images[0]}
          alt={product.title}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            sold ? "grayscale opacity-65" : ""
          }`}
        />

        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0E1A2B]/45">
            <span className="rounded bg-[#0E1A2B]/95 px-3.5 py-1.5 text-hb-xs font-bold tracking-widest text-white">
              판매완료
            </span>
          </div>
        )}

        {/* 좌상단 판매 상태 배지 */}
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
          <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1">
            <ProductStatusBadge
              status={product.status}
              createdAt={product.created_at}
              showNew={false}
            />
          </div>
        )}

        {/* 우하단 다중 사진 수량 표시 */}
        {!sold && images.length > 1 && (
          <span className="pointer-events-none absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded bg-[#0E1A2B]/75 px-2 py-0.5 text-hb-xs font-semibold text-white tabular-nums backdrop-blur-xs">
            <Icon d={ICON.image} className="w-3 h-3 text-white/80" />
            +{images.length - 1}
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
            className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded border border-red-200 bg-white/95 text-red-600 shadow hover:bg-red-50 transition-colors"
          >
            <Icon d={ICON.close} className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. 쇼룸 에디토리얼 정보 영역 (불필요한 중첩 박스 제거 · 가격과 제품명 중심) */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 bg-white border-t border-[#ECE9E2]">
        <div>
          {/* 상단 메타: 카테고리 + 모델명 */}
          <div className="flex items-center justify-between gap-2 text-hb-xs">
            <span className="font-bold text-[#D9531E] truncate">
              {categoryLabel}
            </span>
            {modelName ? (
              <span
                className="shrink-0 max-w-[55%] truncate font-mono text-hb-xs text-[#646E7E]"
                title={modelName}
              >
                {modelName}
              </span>
            ) : product.condition_grade ? (
              <span className="shrink-0 font-semibold text-[#646E7E]">
                {product.condition_grade}
              </span>
            ) : null}
          </div>

          {/* 상품명 (2줄 말줄임 + 하단 글자 잘림 방지 여유고 및 그리드 정렬용 최소 높이) */}
          <h3
            className={`mt-1 line-clamp-2 min-h-[2.85rem] sm:min-h-[3.25rem] text-hb-sm sm:text-hb-base font-bold leading-[1.4] tracking-[-0.015em] transition-colors break-keep pb-0.5 ${
              sold
                ? "text-[#646E7E]"
                : "text-[#0E1A2B] group-hover:text-[#D9531E]"
            }`}
          >
            {product.title}
          </h3>

          {/* 사양 요약 (모바일/데스크톱 마이크로 스펙 칩) */}
          {specCapsules.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1 overflow-hidden">
              {specCapsules.map((cap) => (
                <span
                  key={cap}
                  className="inline-block rounded bg-[#F4F2ED] px-1.5 py-0.5 text-hb-xs font-medium text-[#434B59] truncate max-w-full"
                >
                  {cap}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 truncate text-hb-xs font-medium text-[#646E7E]">
              {specSummaryText}
            </p>
          )}
        </div>

        {/* 하단: 가격 강조 + 견적함 액션 */}
        <div className="mt-3 pt-2.5 border-t border-[#F2EFE9] flex items-center justify-between gap-1.5 min-w-0">
          <div className="min-w-0 flex-1">
            {sold ? (
              <span className="text-hb-sm font-bold text-[#646E7E]">
                판매완료 · 유사재고 문의
              </span>
            ) : priced ? (
              <strong className="block text-hb-base sm:text-hb-lg font-extrabold tracking-tight text-[#0E1A2B] tabular-nums truncate">
                {priceText}
              </strong>
            ) : (
              <strong className="block text-hb-sm sm:text-hb-base font-extrabold text-[#0E1A2B] truncate">
                {priceText}
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
              className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-hb-xs font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                inBasket
                  ? "bg-[#0E1A2B] text-white"
                  : "bg-[#F4F3EF] text-[#0E1A2B] hover:bg-[#0E1A2B] hover:text-white"
              }`}
            >
              <Icon
                d={inBasket ? ICON.check : ICON.plus}
                className={`h-3 w-3 ${
                  inBasket ? "text-[#FF8A50]" : "currentColor"
                }`}
              />
              <span>{inBasket ? "담김" : "견적함"}</span>
            </button>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-hb-xs font-semibold text-[#646E7E] group-hover:text-[#0E1A2B] transition-colors">
              <span>보기</span>
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
        className="block h-full w-full min-w-0 cursor-pointer text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B]"
      >
        {cardInner}
      </div>
    );
  }

  return (
    <Link
      href={`/${product.id}`}
      className="block h-full min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B]"
    >
      {cardInner}
    </Link>
  );
}
