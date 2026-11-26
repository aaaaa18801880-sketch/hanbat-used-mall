"use client";

import React from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  extractModelName,
  extractSpecCapsules,
  extractWidthMmFromText,
  formatProductPrice,
  getCategoryWarrantyInfo,
  hasProductPrice,
  isProductSold,
  normalizeProductCategory,
  splitImages,
  toggleQuoteBasketItem,
  trackEvent,
} from "../../lib/site";
import { Icon, ICON, SafeImg, useQuoteBasket } from "../../lib/ui";
import { ProductStatusBadge } from "./product-status-badge";
import type { ProductItem } from "./product-card";

interface GallerySpecTableProps {
  products: ProductItem[];
  isSelectMode?: boolean;
  selectedIds?: Set<string>;
  isAdmin?: boolean;
  onProductClick?: (product: ProductItem) => void;
  onQuickView?: (product: ProductItem) => void;
}

/**
 * 갤러리 스펙 비교 테이블 뷰
 * - 업소용 설비·다량 구매 고객이 규격(가로폭/용량/전압)·모델명·A/S·가격을
 *   한눈에 비교하고 바로 견적함(스플릿 비교)에 담을 수 있는 표 형식 뷰입니다.
 */
export function GallerySpecTable({
  products,
  isSelectMode = false,
  selectedIds,
  isAdmin = false,
  onProductClick,
  onQuickView,
}: GallerySpecTableProps) {
  const basketItems = useQuoteBasket();
  const basketIdSet = new Set(basketItems.map((item) => item.id));

  const handleToggleBasket = (e: React.MouseEvent, product: ProductItem) => {
    e.stopPropagation();
    e.preventDefault();
    const images = splitImages(product.image_url);
    const categoryLabel = normalizeProductCategory(product.category);
    const modelName =
      product.model_name !== undefined
        ? product.model_name
        : extractModelName(product.description, product.title);

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
        location: "spec_table",
      });
      toast.success("스플릿 비교 · 견적함에 담았습니다.");
    } else {
      toast("견적함에서 제외했습니다.");
    }
  };

  return (
    <div
      tabIndex={0}
      role="region"
      aria-labelledby="gallery-spec-table-caption"
      className="hb-spec-table-wrap rounded-xl border border-[#CFC7BA] bg-white shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23]"
    >
      <table className="hb-spec-table text-left text-hb-xs sm:text-hb-sm">
        <caption id="gallery-spec-table-caption" className="sr-only">
          판매 매물 모델명, 핵심 규격, 보증 조건 및 가격 일람표
        </caption>
        <thead>
          <tr className="border-b border-[#CFC7BA] bg-[#FAF9F6] text-hb-xs font-bold text-[#334155]">
            <th scope="col" className="py-3 pl-4 pr-3 min-w-[260px]">
              매물명 / 분류
            </th>
            <th scope="col" className="px-3 py-3 whitespace-nowrap">
              모델명
            </th>
            <th scope="col" className="px-3 py-3 min-w-[190px]">
              핵심 규격 · 가로폭
            </th>
            <th scope="col" className="px-3 py-3 whitespace-nowrap">
              무상 A/S · 등급
            </th>
            <th
              scope="col"
              className="py-3 pl-3 pr-4 text-right whitespace-nowrap"
            >
              가격 · 비교 담기
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2DDD3]">
          {products.map((product) => {
            const images = splitImages(product.image_url);
            const sold = isProductSold(product.status);
            const categoryLabel = normalizeProductCategory(product.category);
            const priced = hasProductPrice(product.price);
            const priceText = formatProductPrice(product.price, categoryLabel);
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
            const widthMm = extractWidthMmFromText(
              `${product.title || ""}\n${product.description || ""}`
            );
            const warrantyText = getCategoryWarrantyInfo(categoryLabel).shortLabel;
            const inBasket = basketIdSet.has(product.id);
            const isSelected = Boolean(selectedIds?.has(product.id));

            return (
              <tr
                key={product.id}
                onClick={() => {
                  if (isSelectMode && onProductClick) {
                    onProductClick(product);
                  }
                }}
                className={`transition-colors ${
                  isSelected
                    ? "bg-[#FFF4EE]"
                    : sold
                    ? "bg-[#FAF9F6]"
                    : "hover:bg-[#FAF9F6]"
                } ${isSelectMode ? "cursor-pointer" : ""}`}
              >
                <th
                  scope="row"
                  className="py-3 pl-4 pr-3 font-normal text-left align-middle"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isSelectMode && (
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          isSelected
                            ? "border-[#C84312] bg-[#C84312] text-white"
                            : "border-[#CFC7BA] bg-white text-transparent"
                        }`}
                      >
                        <Icon d={ICON.check} className="h-3.5 w-3.5" />
                      </span>
                    )}

                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#E2DDD3] bg-[#FAF9F6]">
                      <SafeImg
                        src={images[0]}
                        alt={product.title}
                        className={`h-full w-full object-cover ${
                          sold ? "grayscale opacity-65" : ""
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-hb-xs font-bold text-[#475569]">
                          {categoryLabel}
                        </span>
                        <ProductStatusBadge
                          status={product.status}
                          createdAt={product.created_at}
                          showNew={false}
                        />
                      </div>
                      {isSelectMode && onProductClick ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProductClick(product);
                          }}
                          className="text-left font-bold text-hb-sm text-[#141A23] hover:text-[#C84312] line-clamp-2 break-keep"
                        >
                          {product.title}
                        </button>
                      ) : (
                        <Link
                          href={`/${product.id}`}
                          className="block font-bold text-hb-sm text-[#141A23] hover:text-[#C84312] line-clamp-2 break-keep"
                        >
                          {product.title}
                        </Link>
                      )}
                    </div>
                  </div>
                </th>

                <td
                  data-label="모델명"
                  className="px-3 py-3 font-mono text-hb-xs align-middle whitespace-nowrap"
                >
                  {modelName ? (
                    <span className="rounded bg-[#F1F3F6] px-2 py-0.5 font-bold text-[#141A23]">
                      {modelName}
                    </span>
                  ) : (
                    <span className="text-[#526071]">매장 문의</span>
                  )}
                </td>

                <td
                  data-label="핵심 규격 · 가로폭"
                  className="px-3 py-3 align-middle"
                >
                  <div className="flex flex-wrap items-center justify-end sm:justify-start gap-1">
                    {widthMm && (
                      <span className="inline-flex items-center rounded border border-[#FED7AA] bg-[#FFF4EE] px-2 py-0.5 font-mono text-hb-xs font-bold text-[#C84312] tabular-nums">
                        가로 {widthMm.toLocaleString()}mm
                      </span>
                    )}
                    {specCapsules.length > 0 ? (
                      specCapsules.map((cap) => (
                        <span
                          key={cap}
                          className="inline-flex items-center rounded border border-[#E2DDD3] bg-[#FAF9F6] px-2 py-0.5 text-hb-xs font-semibold text-[#334155] tabular-nums"
                        >
                          {cap}
                        </span>
                      ))
                    ) : !widthMm ? (
                      <span className="text-hb-xs text-[#526071]">
                        세척 · 작동 점검 완료
                      </span>
                    ) : null}
                  </div>
                </td>

                <td
                  data-label="무상 A/S · 등급"
                  className="px-3 py-3 align-middle whitespace-nowrap"
                >
                  <div className="text-right sm:text-left">
                    <span className="block text-hb-xs font-bold text-[#141A23]">
                      {warrantyText}
                    </span>
                    <span className="text-hb-xs text-[#475569]">
                      {product.condition_grade
                        ? product.condition_grade.split(" ")[0]
                        : "작동 점검"}
                    </span>
                  </div>
                </td>

                <td
                  data-label="가격 · 비교 담기"
                  className="py-3 pl-3 pr-4 align-middle whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-2">
                    <div className="text-right mr-1">
                      {sold ? (
                        <span className="text-hb-xs font-bold text-[#526071]">
                          판매완료
                        </span>
                      ) : priced ? (
                        <strong className="font-mono text-hb-sm sm:text-hb-base font-extrabold text-[#141A23] tabular-nums">
                          {priceText}
                        </strong>
                      ) : (
                        <span className="text-hb-xs sm:text-hb-sm font-bold text-[#C84312]">
                          {priceText || "견적 상담"}
                        </span>
                      )}
                    </div>

                    {!isSelectMode && onQuickView && (
                      <button
                        type="button"
                        onClick={() => onQuickView(product)}
                        aria-label={`${product.title} ${isAdmin ? "수정" : "미리보기"}`}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[#E2DDD3] bg-white px-2.5 text-hb-xs font-bold text-[#334155] hover:border-[#141A23] hover:text-[#141A23] transition-colors cursor-pointer"
                      >
                        <Icon
                          d={isAdmin ? ICON.pen : ICON.search}
                          className="w-3.5 h-3.5 text-[#526071]"
                        />
                        <span className="hidden xl:inline">
                          {isAdmin ? "수정" : "미리보기"}
                        </span>
                      </button>
                    )}

                    {!isSelectMode && !sold && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleBasket(e, product)}
                        aria-pressed={inBasket}
                        aria-label={`${inBasket ? "담김" : "비교"} - ${product.title} ${
                          inBasket ? "비교함 제외" : "스플릿 비교 담기"
                        }`}
                        className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg border px-2.5 text-hb-xs font-bold transition-colors cursor-pointer ${
                          inBasket
                            ? "border-[#C84312] bg-[#FFF4EE] text-[#C84312]"
                            : "border-[#CFC7BA] bg-[#FAF9F6] text-[#141A23] hover:bg-[#141A23] hover:text-white hover:border-[#141A23]"
                        }`}
                      >
                        <Icon
                          d={inBasket ? ICON.check : ICON.plus}
                          className="w-3.5 h-3.5"
                        />
                        <span>{inBasket ? "담김" : "비교"}</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
