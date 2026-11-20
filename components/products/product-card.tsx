"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  canUseNextImageUrl,
  extractModelName,
  extractSpecCapsules,
  getCategoryWarrantyInfo,
  isProductSold,
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
  const warrantyHighlight =
    getCategoryWarrantyInfo(normalizedCategory).detailLabel;

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
      className={`rounded-2xl border border-[#E2DDD3] bg-white overflow-hidden shadow-2xs ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E2DDD3]">
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

  const { brandLabel, hasBrand, descriptiveTitle, modelCode } =
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
  const deliveryMetaLine = modelCode
    ? `대전·충청 직배송 · ${modelCode}`
    : "대전·충청 직배송";

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

  return (
    <article
      className={`group relative flex flex-col min-w-0 hb-product-card rounded-lg has-[h3_a:focus-visible]:ring-2 has-[h3_a:focus-visible]:ring-[#141A23] has-[h3_a:focus-visible]:ring-offset-4 has-[h3_button:focus-visible]:ring-2 has-[h3_button:focus-visible]:ring-[#141A23] has-[h3_button:focus-visible]:ring-offset-4 ${
        isSelected ? "ring-2 ring-[#C84312] ring-offset-4" : ""
      }`}
    >
      {/* 1. 정방형 1:1 보더리스 썸네일 (미니멀 라운드 + 우측 하단 찜/비교 아이콘) */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#F5F5F3] ring-1 ring-inset ring-black/[0.05]">
        {canUseNextImage && primaryImage ? (
          <Image
            key={primaryImage}
            src={primaryImage}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            priority={eager}
            loading={eager ? "eager" : undefined}
            quality={80}
            referrerPolicy="no-referrer"
            onError={() => setFailedSrc(primaryImage)}
            className={`object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] ${
              sold ? "grayscale opacity-60" : ""
            }`}
          />
        ) : (
          <SafeImg
            src={primaryImage}
            alt={product.title}
            eager={eager}
            className={`h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] ${
              sold ? "grayscale opacity-60" : ""
            }`}
          />
        )}

        {/* 판매완료 매물만 최소한의 상태로 안내 */}
        {sold && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#141A23]/45 backdrop-blur-[1px]">
            <span className="hb-trim rounded-full bg-[#141A23]/95 px-3 py-1 text-hb-xs font-bold tracking-wide text-white">
              판매완료
            </span>
          </div>
        )}

        {/* 우측 하단 미니멀 찜/비교 담기 하트 아이콘 (배경 원 없이 선명한 아이콘만 배치) */}
        {!isSelectMode && !sold && (
          <button
            type="button"
            onClick={handleToggleBasket}
            aria-pressed={inBasket}
            title={inBasket ? "비교·견적함에서 제외" : "관심 매물 비교·견적함에 담기"}
            aria-label={`${inBasket ? "담김" : "비교 담기"} - ${
              product.title
            } ${inBasket ? "견적함에서 제외" : "견적함에 담기"}`}
            className="absolute bottom-1.5 right-1.5 z-20 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-[#141A23]"
          >
            <Icon
              d={ICON.heart}
              strokeWidth={1.7}
              fill={inBasket ? "#E8521A" : "rgba(255, 255, 255, 0.88)"}
              stroke={inBasket ? "#E8521A" : "rgba(30, 35, 42, 0.42)"}
              className="h-[22px] w-[22px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.22)] transition-colors duration-150"
            />
          </button>
        )}

        {/* 관리자 일괄 선택 체크박스 */}
        {isSelectMode && (
          <div
            className={`absolute left-2.5 top-2.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
              isSelected
                ? "border-[#C84312] bg-[#C84312] text-white"
                : "border-[#CBD2DC] bg-white/95 text-transparent"
            }`}
          >
            <Icon d={ICON.check} className="h-3.5 w-3.5" />
          </div>
        )}

        {/* 관리자 전용 수정/삭제 컨트롤 (일반 고객 화면 비노출) */}
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
            className="absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-md bg-white/95 backdrop-blur-md px-2 py-1 text-hb-xs font-bold text-[#141A23] shadow-2xs hover:bg-[#141A23] hover:text-white transition-colors cursor-pointer"
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
            className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-red-700 shadow-2xs hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Icon d={ICON.close} className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. 보더리스 에디토리얼 타이포그래피 블록 (브랜드 16px Bold → 제품명 15px Regular 2줄 → 보증 13.5px Semibold → 직배송 12.5px 메타) */}
      <div className="pt-2.5 min-w-0">
        {/* 1행: 제조사명(회사명) — 상단 시각 앵커 (가장 크고 선명한 Bold) */}
        <p
          className={`truncate hb-card-brand ${
            hasBrand
              ? "font-bold text-[#141A23]"
              : "font-bold text-[#3B4554]"
          }`}
        >
          {brandLabel}
        </p>

        {/* 2행: 중복 제조사명·모델코드는 걷어내고 용도·규격은 명확히 살린 2줄 제품명 */}
        <h3
          className={`mt-0.5 line-clamp-2 hb-card-title font-normal transition-colors break-keep ${
            sold
              ? "text-[#8B95A1]"
              : "text-[#2B323B] group-hover:text-[#141A23]"
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

        {/* 3행: 품목별 무상보증 안내 — 제목보다 작고 차분한 보조 강조 (본말전도 방지) */}
        {sold ? (
          <p className="mt-1 hb-card-warranty font-semibold text-[#8B95A1]">
            판매완료
          </p>
        ) : (
          <p className="mt-1 flex items-baseline gap-1.5 truncate hb-card-warranty tabular-nums">
            <span className="font-bold text-[#C84312]">
              {warrantyHighlight.accent}
            </span>
            <span className="font-semibold text-[#334155]">
              {warrantyHighlight.label}
            </span>
          </p>
        )}

        {/* 4행: 미세 트럭 아이콘 + 직배송·모델코드 1줄 메타 */}
        <p
          className="mt-0.5 flex items-center gap-1 min-w-0 hb-card-meta font-normal text-[#76808C] tabular-nums"
          title={sold ? "유사매물 문의 가능" : deliveryMetaLine}
        >
          {sold ? (
            <span className="truncate">유사매물 재고 문의 가능</span>
          ) : (
            <>
              <Icon
                d={ICON.truck}
                strokeWidth={1.6}
                className="h-3.5 w-3.5 shrink-0 text-[#8B95A1]"
              />
              <span className="truncate">{deliveryMetaLine}</span>
            </>
          )}
        </p>
      </div>
    </article>
  );
}
