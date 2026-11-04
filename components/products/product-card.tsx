// 파일 경로: components/products/product-card.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
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
      highlight: null,
      icon: "sparkle" as const,
      color: "text-[#0F766E]",
      badge: "bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E]",
    },
    {
      step: "02",
      title: "사후 무상 A/S 보증",
      desc: warrantyHighlight,
      highlight: null,
      icon: "shield" as const,
      color: "text-[#D9531E]",
      badge: "bg-[#FFF5F0] border border-[#FADCD0] text-[#D9531E]",
    },
    {
      step: "03",
      title: "세금계산서·직배송",
      desc: "사업자 계산서 100% 정식 발행 및 충청권 직배송",
      highlight: null,
      icon: "tax" as const,
      color: "text-[#0369A1]",
      badge: "bg-[#F0F9FF] border border-[#BAE6FD] text-[#0369A1]",
    },
  ] as const;

  return (
    <section
      aria-label="한밭중고전자 핵심 거래 보증 안내"
      className={`rounded-2xl bg-[#F2F4F6] p-2 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col justify-between rounded-lg bg-white px-4 py-3.5 shadow-2xs"
          >
            <div>
              <div className="flex items-center gap-2.5 text-hb-xs sm:text-hb-sm font-semibold text-[#191F28]">
                <ModernApplianceIcon
                  name={item.icon}
                  className="w-8 h-8 sm:w-9 sm:h-9 shrink-0"
                />
                <span
                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-hb-xs font-bold ${item.badge}`}
                >
                  {item.step}
                </span>
                <span className="truncate">{item.title}</span>
              </div>
              <p className="mt-1.5 text-hb-xs leading-[1.5] text-[#4E5968] break-keep">
                {item.desc}
              </p>
            </div>
            {item.highlight && (
              <span
                className={`mt-1 inline-block text-hb-xs font-semibold ${item.color} break-keep`}
              >
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

  const cardRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // 부드러운 2.5D 마이크로 틸트 각도 (최대 ±3.5도)
    const rotateX = ((y - centerY) / centerY) * -3.5;
    const rotateY = ((x - centerX) / centerX) * 3.5;

    el.style.setProperty("--mouse-x", `${x}px`);
    el.style.setProperty("--mouse-y", `${y}px`);
    el.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
    el.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mouse-x", "50%");
    el.style.setProperty("--mouse-y", "50%");
  };

  const specSummaryText =
    specCapsules.length > 0
      ? specCapsules.join(" · ")
      : "세척·검수 완료";

  const cardInner = (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? "perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(3px)"
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
        transition: isHovered
          ? "transform 0.08s ease-out"
          : "transform 0.35s ease-out, box-shadow 0.35s ease-out",
        transformStyle: "preserve-3d",
        willChange: isHovered ? "transform" : "auto",
      }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white transition-[transform,box-shadow,background-color] duration-200 ${
        isSelected
          ? "ring-2 ring-[#FF6F0F] bg-[#FFFDFB] shadow-card-hover"
          : "hb-surface-card"
      }`}
    >
      {/* 2.5D 스튜디오 메탈릭 스펙큘러 라이팅 오버레이 (카드 전면 빛 반사) */}
      <div
        className="pointer-events-none absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-soft-light"
        style={{
          background: `radial-gradient(circle 220px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.12) 50%, transparent 80%)`,
        }}
        aria-hidden="true"
      />

      {/* 1. 쿨 화이트 스튜디오 조명 백드롭 & 1:1 정방형 사진 프레임 (세로형 가전 상하단 잘림 방지) */}
      <div className="relative aspect-square w-full overflow-hidden hb-studio-backdrop">
        <SafeImg
          src={images[0]}
          alt={product.title}
          eager={eager}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            sold ? "grayscale opacity-65" : ""
          }`}
        />

        {/* 스튜디오 메탈릭 림 라이트 헤어라인 */}
        <div
          className="pointer-events-none absolute inset-0 z-10 ring-1 ring-inset ring-black/[0.04] group-hover:ring-white/40 transition-all duration-300"
          aria-hidden="true"
        />

        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#191F28]/45 backdrop-blur-[1px]">
            <span className="rounded-full bg-[#191F28]/95 px-4 py-1.5 text-hb-xs font-bold tracking-wider text-white shadow-xs">
              판매완료
            </span>
          </div>
        )}

        {/* 좌상단 판매 상태 배지 & 외관 상태 등급 (애플/토스 프로스티드 글래스 필) */}
        {isSelectMode ? (
          <div
            className={`absolute left-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
              isSelected
                ? "border-[#FF6F0F] bg-[#FF6F0F] text-white"
                : "border-[#D1D6DB] bg-white/95 text-transparent"
            }`}
          >
            <Icon d={ICON.check} className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 flex-wrap">
            <ProductStatusBadge
              status={product.status}
              createdAt={product.created_at}
              showNew={false}
            />
            {product.condition_grade && (
              <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-md px-2.5 py-0.5 text-hb-xs font-semibold text-[#191F28] shadow-xs">
                {product.condition_grade.split(" ")[0]}
              </span>
            )}
          </div>
        )}

        {/* 좌하단 플로팅 글래스 미리보기 / 관리자 빠른 수정 캡슐 */}
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
            className={`absolute bottom-3 left-3 z-20 items-center gap-1 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-hb-xs font-bold text-[#191F28] shadow-xs hover:bg-[#191F28] hover:text-white transition-[background-color,color,transform,opacity] cursor-pointer active:scale-[0.96] ${
              isAdmin
                ? "inline-flex"
                : "hidden sm:inline-flex opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
            }`}
          >
            <Icon
              d={isAdmin ? ICON.pen : ICON.search}
              className="w-3 h-3 text-[#FF6F0F]"
            />
            <span>{isAdmin ? "수정" : "미리보기"}</span>
          </button>
        )}

        {/* 우하단 다중 사진 수량 표시 */}
        {!sold && images.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#191F28]/75 px-2.5 py-0.5 text-hb-xs font-semibold text-white tabular-nums backdrop-blur-md">
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
            className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-xs hover:bg-red-50 transition-colors"
          >
            <Icon d={ICON.close} className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. 당근(SEED) · 카카오 선물하기 · 토스쇼핑 스타일 0.5초 스캔 위계 (내부 구분선 제거) */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 bg-white">
        <div>
          {/* 상단 메타: 소프트 코랄 카테고리 칩 + 모델명 */}
          <div className="flex items-center justify-between gap-2 text-hb-xs">
            <span className="inline-flex items-center rounded-md bg-[#FFF5F0] border border-[#FADCD0] px-2 py-0.5 font-semibold text-[#D9531E] truncate">
              {categoryLabel}
            </span>
            {modelName && (
              <span
                className="shrink-0 max-w-[52%] truncate font-mono text-hb-xs font-medium text-[#8B95A1]"
                title={modelName}
              >
                {modelName}
              </span>
            )}
          </div>

          {/* 상품명 (600 SemiBold로 가격 700 Bold와 선명한 대비 형성) */}
          <h3
            className={`mt-2 line-clamp-2 text-hb-sm sm:text-hb-base font-semibold leading-[1.42] transition-colors break-keep ${
              sold
                ? "text-[#8B95A1]"
                : "text-[#0E1A2B] group-hover:text-[#D9531E]"
            }`}
          >
            {product.title}
          </h3>

          {/* 가격 (당근·카카오 스타일: 제목 바로 아래 700 Bold로 선명하게 강조) */}
          <div className="mt-2 flex items-baseline justify-between gap-2 min-w-0">
            {sold ? (
              <span className="text-hb-sm font-semibold text-[#8B95A1] truncate block">
                판매완료 · 유사매물 문의
              </span>
            ) : priced ? (
              <strong className="block text-hb-lg sm:text-hb-xl font-bold text-[#D9531E] tabular-nums truncate">
                {priceText}
              </strong>
            ) : (
              <strong className="block text-hb-base sm:text-hb-lg font-bold text-[#0E1A2B] truncate">
                <span className="sm:hidden">견적 상담</span>
                <span className="hidden sm:inline">{priceText}</span>
              </strong>
            )}
          </div>
        </div>

        {/* 하단: 핵심 스펙 칩(쿨 시안 배지) + 원터치 견적 담기(600 SemiBold) */}
        <div className="mt-3 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            {specCapsules.length > 0 ? (
              specCapsules.map((cap) => (
                <span
                  key={cap}
                  className="inline-block rounded-lg bg-[#F0F9FF] border border-[#BAE6FD]/80 px-2 py-0.5 text-hb-xs font-bold text-[#0369A1] truncate whitespace-nowrap"
                >
                  {cap}
                </span>
              ))
            ) : (
              <span className="inline-block rounded-lg bg-[#F2F4F6] px-2 py-1 text-hb-xs font-medium text-[#6B7684] truncate">
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
              className={`shrink-0 inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-hb-xs font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                inBasket
                  ? "bg-[#FFF4EE] text-[#F05600] ring-1 ring-[#FF6F0F]/30"
                  : "bg-[#F2F4F6] text-[#191F28] hover:bg-[#191F28] hover:text-white"
              }`}
            >
              <Icon
                d={inBasket ? ICON.check : ICON.plus}
                className={`h-3 w-3 ${
                  inBasket ? "text-[#FF6F0F]" : "currentColor"
                }`}
              />
              <span>{inBasket ? "담김" : "담기"}</span>
            </button>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-hb-xs font-semibold text-[#8B95A1] group-hover:text-[#191F28] transition-colors">
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
        className="block h-full w-full min-w-0 cursor-pointer text-left rounded-2xl sm:rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191F28]"
      >
        {cardInner}
      </div>
    );
  }

  return (
    <Link
      href={`/${product.id}`}
      className="block h-full min-w-0 rounded-2xl sm:rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191F28]"
    >
      {cardInner}
    </Link>
  );
}
