// 파일 경로: components/home/featured-products-section.tsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  addRecentViewedProduct,
  extractModelName,
  extractSpecCapsules,
  formatProductPrice,
  getProductStatusLabel,
  isProductSold,
  normalizeProductCategory,
  normalizeProductStatus,
  PRODUCT_CATEGORIES,
  smsHref,
  splitImages,
  STORE,
  telHref,
  trackEvent,
} from "../../lib/site";
import {
  supabase,
  isAuthorizedAdminUser,
  getAdminAuthHeaders,
} from "../../lib/supabase";
import { Icon, ICON, Modal, SafeImg, SectionHeading } from "../../lib/ui";
import {
  ProductCard,
  ProductTrustMicroStrip,
  type ProductItem,
} from "../products/product-card";
import { QuoteBasketButton } from "../products/product-detail-gallery";
import { ProductStructuredDescription } from "../products/product-structured-description";

const QUICK_FILTER_TABS = ["전체", ...PRODUCT_CATEGORIES] as const;

const INITIAL_VISIBLE_COUNT = 16;
const PAGE_INCREMENT = 16;

export function FeaturedProductsSection({
  products,
  loading,
  error,
  onRetry,
  onInquireProduct,
}: {
  products: ProductItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onInquireProduct: (productTitle: string) => void;
}) {
  const [selected, setSelected] = useState<ProductItem | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>("전체");
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);
  const [viewOverrides, setViewOverrides] = useState<Record<string, number>>(
    {}
  );

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const allFilteredProducts = useMemo(() => {
    if (activeCategory === "전체") return products;
    return products.filter(
      (p) => normalizeProductCategory(p.category) === activeCategory
    );
  }, [products, activeCategory]);

  const displayedProducts = useMemo(() => {
    return allFilteredProducts.slice(0, visibleCount);
  }, [allFilteredProducts, visibleCount]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 전체: products.length };
    for (const p of products) {
      const cat = normalizeProductCategory(p.category);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [products]);

  const hasMore = displayedProducts.length < allFilteredProducts.length;
  const remainingCount = allFilteredProducts.length - displayedProducts.length;

  const openModal = async (item: ProductItem) => {
    const currentViews =
      typeof viewOverrides[item.id] === "number"
        ? viewOverrides[item.id]
        : item.views || 0;

    setSelected({ ...item, views: currentViews });
    setImgIdx(0);
    const imgs = splitImages(item.image_url);
    addRecentViewedProduct({
      id: String(item.id),
      title: item.title,
      category: item.category || "기타",
      price: item.price ?? null,
      status: item.status,
      conditionGrade: item.condition_grade ?? null,
      modelName: extractModelName(item.description, item.title) ?? null,
      imageUrl: imgs[0] || null,
    });
    trackEvent("view_item", {
      category: normalizeProductCategory(item.category),
      status: normalizeProductStatus(item.status),
    });

    try {
      const { data: authData } = await supabase.auth.getSession();
      if (isAuthorizedAdminUser(authData.session?.user)) return;

      const viewedStr = sessionStorage.getItem("viewed_products") || "[]";
      const viewedList = JSON.parse(viewedStr) as string[];
      if (viewedList.includes(item.id)) return;

      const optimisticViews = currentViews + 1;
      setViewOverrides((prev) => ({ ...prev, [item.id]: optimisticViews }));
      setSelected((prev) =>
        prev && prev.id === item.id ? { ...prev, views: optimisticViews } : prev
      );

      const authHeaders = await getAdminAuthHeaders();
      const res = await fetch(`/api/products/${item.id}/view`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) {
        setViewOverrides((prev) => ({ ...prev, [item.id]: currentViews }));
        setSelected((prev) =>
          prev && prev.id === item.id ? { ...prev, views: currentViews } : prev
        );
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        views?: number;
      } | null;
      const confirmedViews =
        data && typeof data.views === "number" ? data.views : optimisticViews;

      setViewOverrides((prev) => ({ ...prev, [item.id]: confirmedViews }));
      setSelected((prev) =>
        prev && prev.id === item.id
          ? { ...prev, views: confirmedViews }
          : prev
      );

      const nextStr = sessionStorage.getItem("viewed_products") || "[]";
      const nextList = JSON.parse(nextStr) as string[];
      if (!nextList.includes(item.id)) {
        nextList.push(item.id);
        sessionStorage.setItem("viewed_products", JSON.stringify(nextList));
      }
    } catch {
      setViewOverrides((prev) => ({ ...prev, [item.id]: currentViews }));
    }
  };

  const selectedImages = selected ? splitImages(selected.image_url) : [];
  const selectedSold = selected ? isProductSold(selected.status) : false;
  const selectedCategory = selected
    ? normalizeProductCategory(selected.category)
    : "기타";
  const selectedModelName = selected
    ? extractModelName(selected.description, selected.title)
    : null;
  const selectedCapsules = selected
    ? extractSpecCapsules(selected.title, selected.description, 4)
    : [];

  return (
    <section
      id="featured-products-section"
      aria-labelledby="featured-heading"
      className="border-b border-[#E5E2DC] bg-white py-14 sm:py-20 lg:py-24"
    >
      <div className="hb-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            title={<span id="featured-heading">매장 검수 완료 · 추천 판매 제품</span>}
            desc={
              <>
                대전 중촌동 직영 매장에서 분해 세척과 작동 점검을 마친 실매물입니다.
                <br className="hidden sm:inline" /> 제품을 클릭하면 상세 사진과 규격·보증 조건을 확인하실 수 있습니다.
              </>
            }
          />

          <Link
            href="/gallery"
            className="hb-btn-outline h-11 px-5 text-[14px] shrink-0 self-start sm:self-end"
          >
            <span>전체 판매 제품 보기</span>
            <Icon d={ICON.arrow} className="w-4 h-4 text-[#D9531E]" />
          </Link>
        </div>

        {/* 품목별 빠른 필터 바 */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-6 sm:mt-8 flex items-center justify-between gap-3 border-b border-[#E5E2DC] pb-3.5">
            <div
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
              role="tablist"
              aria-label="추천 매물 품목 필터"
            >
              {QUICK_FILTER_TABS.map((cat) => {
                const active = activeCategory === cat;
                const count = categoryCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleCategoryChange(cat)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] sm:text-[13.5px] font-semibold whitespace-nowrap border transition-colors ${
                      active
                        ? "bg-[#0E1A2B] text-white border-[#0E1A2B] font-bold"
                        : "bg-[#FAF9F7] text-[#3E4756] border-[#E5E2DC] hover:border-[#0E1A2B] hover:text-[#0E1A2B]"
                    }`}
                  >
                    <span>{cat}</span>
                    {count > 0 && (
                      <span
                        className={`text-[11.5px] tabular-nums ${
                          active ? "text-[#FF8A50]" : "text-[#858076]"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 상황별 맞춤 프리셋 칩 (갤러리 직통 링크) */}
            <div className="hidden lg:flex items-center gap-1.5 shrink-0 text-[12px]">
              <span className="shrink-0 text-[11px] font-bold text-[#8A8478]">
                맞춤 프리셋:
              </span>
              <Link
                href="/gallery?category=냉장고"
                className="inline-flex items-center h-8 rounded-full border border-[#E5E2DC] bg-[#FAF9F7] px-3 text-[11.5px] font-semibold text-[#3E4756] hover:border-[#D9531E] hover:text-[#D9531E] whitespace-nowrap transition-colors"
              >
                🏠 원룸·자취
              </Link>
              <Link
                href={`/gallery?category=${encodeURIComponent("업소용기기")}&q=${encodeURIComponent("쇼케이스")}`}
                className="inline-flex items-center h-8 rounded-full border border-[#E5E2DC] bg-[#FAF9F7] px-3 text-[11.5px] font-semibold text-[#3E4756] hover:border-[#D9531E] hover:text-[#D9531E] whitespace-nowrap transition-colors"
              >
                ☕ 카페창업
              </Link>
              <Link
                href={`/gallery?category=${encodeURIComponent("업소용기기")}&q=${encodeURIComponent("45박스")}`}
                className="inline-flex items-center h-8 rounded-full border border-[#E5E2DC] bg-[#FAF9F7] px-3 text-[11.5px] font-semibold text-[#3E4756] hover:border-[#D9531E] hover:text-[#D9531E] whitespace-nowrap transition-colors"
              >
                🍖 식당주방
              </Link>
              <Link
                href={`/gallery?category=${encodeURIComponent("에어컨/냉난방기")}&q=${encodeURIComponent("냉난방")}`}
                className="inline-flex items-center h-8 rounded-full border border-[#E5E2DC] bg-[#FAF9F7] px-3 text-[11.5px] font-semibold text-[#3E4756] hover:border-[#D9531E] hover:text-[#D9531E] whitespace-nowrap transition-colors"
              >
                ❄️ 냉난방기
              </Link>
            </div>
          </div>
        )}

        {/* 로딩 스켈레톤 상태 */}
        {loading ? (
          <div
            className="mt-8 grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4 items-stretch"
            aria-hidden="true"
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-lg border border-[#E6E3DC] bg-white animate-pulse"
              >
                <div className="aspect-[4/3] bg-[#F0EDE7]" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-1/3 rounded bg-[#F0EDE7]" />
                  <div className="h-5 w-4/5 rounded bg-[#F0EDE7]" />
                  <div className="h-6 w-1/2 rounded bg-[#F0EDE7] pt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-8 sm:p-10 text-center">
            <p className="text-[16px] font-bold text-[#0E1A2B]">
              실시간 상품 목록을 불러오지 못했습니다.
            </p>
            <p className="mt-1.5 text-[14px] text-[#6B7280]">
              네트워크 상태를 확인하시거나 잠시 후 다시 시도해 주세요.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="hb-btn-primary mt-5 h-10 px-5 text-[13.5px]"
            >
              다시 불러오기
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-8 flex flex-col items-start justify-between gap-6 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-6 sm:p-8 sm:flex-row sm:items-center">
            <div>
              <p className="text-[17px] font-bold text-[#0E1A2B]">
                신규 입고 상품을 검수 및 사진 등록 중입니다.
              </p>
              <p className="mt-1 text-[14px] text-[#4B5260]">
                매장에는 온라인에 미처 올리지 못한 가전과 주방설비가 상시 준비되어 있습니다. 찾으시는 품목을 말씀해 주시면 즉시 재고를 확인해 드립니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <a
                href={telHref(STORE.tel)}
                className="hb-btn-primary h-11 px-5 text-[14px]"
              >
                <Icon d={ICON.phone} className="w-4 h-4" /> 전화로 재고 확인
              </a>
              <a
                href={STORE.kakaoChat}
                target="_blank"
                rel="noopener noreferrer"
                className="hb-btn-kakao h-11 px-5 text-[14px]"
              >
                <Icon d={ICON.chat} className="w-4 h-4" /> 카톡 문의
              </a>
            </div>
          </div>
        ) : allFilteredProducts.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-8 text-center">
            <p className="text-[15.5px] font-bold text-[#0E1A2B]">
              현재 등록된 &lsquo;{activeCategory}&rsquo; 실매물이 없습니다.
            </p>
            <p className="mt-1 text-[13.5px] text-[#6B7280]">
              오프라인 매장에 검수 중인 미등록 입고분이 상시 대기 중입니다. 찾으시는 모델을 말씀해 주시면 즉시 확인해 드립니다.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={() => handleCategoryChange("전체")}
                className="hb-btn-outline h-10 px-4 text-[13px]"
              >
                전체 실매물 보기
              </button>
              <Link
                href="/gallery"
                className="hb-btn-primary h-10 px-4 text-[13px]"
              >
                전체 판매 제품 갤러리로 이동 →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 items-stretch">
              {displayedProducts.map((product) => {
                const effectiveProduct =
                  typeof viewOverrides[product.id] === "number"
                    ? { ...product, views: viewOverrides[product.id] }
                    : product;
                return (
                  <ProductCard
                    key={product.id}
                    product={effectiveProduct}
                    onSelect={openModal}
                  />
                );
              })}
            </div>

            {/* 실매물 더보기 / 전체 펼치기 컨트롤 */}
            {hasMore ? (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_INCREMENT)}
                  className="hb-btn-primary h-12 px-6 text-[14.5px] font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2"
                >
                  <Icon d={ICON.refresh} className="w-4 h-4" />
                  <span>실매물 더보기 (+{Math.min(remainingCount, PAGE_INCREMENT)}개)</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-white">
                    {displayedProducts.length} / {allFilteredProducts.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleCount(allFilteredProducts.length)}
                  className="hb-btn-outline h-12 px-5 text-[13.5px] font-semibold"
                >
                  <span>
                    {activeCategory === "전체"
                      ? `전체 ${allFilteredProducts.length}개 매물 한 번에 보기`
                      : `${activeCategory} ${allFilteredProducts.length}개 전체 펼치기`}
                  </span>
                </button>
              </div>
            ) : allFilteredProducts.length > INITIAL_VISIBLE_COUNT ? (
              <div className="mt-6 text-center">
                <p className="text-[13px] text-[#6B7280]">
                  ✓ {activeCategory === "전체" ? "등록된 전체 실매물" : `${activeCategory} 실매물`}{" "}
                  <strong className="text-[#0E1A2B]">{allFilteredProducts.length}개</strong>를 모두 표시했습니다.
                </p>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] px-4 sm:px-5 py-3.5 text-[13px] text-[#4B5260] shadow-2xs">
              <p className="break-keep">
                <strong className="text-[#0E1A2B]">
                  💡 찾으시는 모델이나 규격이 목록에 없나요?
                </strong>{" "}
                오프라인 매장 창고에 미등록 입고분이 상시 대기 중입니다.
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/gallery"
                  className="font-bold text-[#0E1A2B] hover:text-[#D9531E] underline underline-offset-4"
                >
                  전체 매물 더보기
                </Link>
                <span className="text-[#DDD9D1]" aria-hidden="true">
                  |
                </span>
                <a
                  href="#inquiry-form"
                  className="font-bold text-[#D9531E] hover:underline underline-offset-4"
                >
                  원하는 조건 재고 문의 →
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 빠른 상품 상세 미리보기 모달 (구조화 사양 파서 + 견적함 + 문자 문의 통합) */}
      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          label={`${selected.title} 상세 정보`}
          panelClassName="max-w-xl"
        >
          <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-[#E5E2DC] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E2DC] px-4 sm:px-5 py-3.5 bg-white">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-lg bg-[#FAF9F7] border border-[#E5E2DC] px-2.5 py-1 text-[11.5px] font-bold text-[#4B5260]">
                  {selectedCategory}
                </span>
                <span
                  className={`rounded-lg px-2.5 py-1 text-[11.5px] font-bold text-white ${
                    selectedSold ? "bg-[#6B7280]" : "bg-[#0E1A2B]"
                  }`}
                >
                  {getProductStatusLabel(selected.status)}
                </span>
                {selected.condition_grade && (
                  <span className="rounded-lg border border-[#FADCD0] bg-[#FFF5F0] px-2 py-0.5 text-[11px] font-bold text-[#D9531E]">
                    {selected.condition_grade}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="닫기"
                className="grid h-8 w-8 place-items-center rounded text-[#6B7280] hover:bg-[#FAF9F7] hover:text-[#0E1A2B]"
              >
                <Icon d={ICON.close} className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="relative flex h-[260px] sm:h-[340px] w-full items-center justify-center bg-[#FAF9F7] p-4 border-b border-[#E5E2DC]">
                <SafeImg
                  src={selectedImages[imgIdx]}
                  alt={selected.title}
                  eager
                  className="max-h-full max-w-full object-contain"
                />
                {selectedImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setImgIdx(
                          (i) =>
                            (i - 1 + selectedImages.length) %
                            selectedImages.length
                        )
                      }
                      aria-label="이전 사진"
                      className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#0E1A2B] shadow"
                    >
                      <Icon d={ICON.left} className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setImgIdx((i) => (i + 1) % selectedImages.length)
                      }
                      aria-label="다음 사진"
                      className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#0E1A2B] shadow"
                    >
                      <Icon d={ICON.right} className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {selectedImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto border-b border-[#E4E0D8] bg-[#FAF9F7] px-4 sm:px-5 py-2.5">
                  {selectedImages.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setImgIdx(i)}
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded border-2 ${
                        imgIdx === i
                          ? "border-[#D9531E]"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <SafeImg
                        src={src}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <h3 className="text-[18px] sm:text-[20px] font-bold text-[#0E1A2B] leading-snug">
                    {selected.title}
                  </h3>
                  {selectedCapsules.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedCapsules.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2 py-0.5 text-[11.5px] font-semibold text-[#3E4756]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {selectedModelName && (
                    <p className="mt-1.5 text-[12.5px] font-semibold text-[#4B5260]">
                      모델명:{" "}
                      <span className="font-mono text-[#0E1A2B]">
                        {selectedModelName}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-3.5 sm:p-4">
                  <div>
                    <span className="block text-[11.5px] font-semibold text-[#6B7280]">
                      판매 가격
                    </span>
                    <strong className="mt-0.5 block text-[20px] sm:text-[22px] font-bold text-[#D9531E] tabular-nums">
                      {selectedSold
                        ? "판매완료"
                        : formatProductPrice(selected.price, selectedCategory)}
                    </strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12.5px] font-semibold text-[#6B7280] tabular-nums">
                      조회{" "}
                      <strong className="text-[#0E1A2B]">
                        {selected.views || 0}
                      </strong>
                      회
                    </span>
                    <Link
                      href={`/${selected.id}`}
                      className="rounded border border-[#DDD9D1] bg-white px-3 py-1.5 text-[12px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B]"
                    >
                      개별 상세페이지 →
                    </Link>
                  </div>
                </div>

                {!selectedSold && (
                  <QuoteBasketButton
                    item={{
                      id: selected.id,
                      title: selected.title,
                      category: selectedCategory,
                      price: selected.price,
                      status: selected.status,
                      conditionGrade: selected.condition_grade,
                      description: selected.description,
                      modelName: selectedModelName,
                      imageUrl: selectedImages[0] || null,
                      quantity: 1,
                    }}
                  />
                )}

                <ProductTrustMicroStrip category={selectedCategory} />

                {/* 구조화된 제품 사양 및 설명 (통합 구조화 컴포넌트) */}
                {selected.description && (
                  <ProductStructuredDescription
                    description={selected.description}
                    variant="compact"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-[#E5E2DC] bg-white p-3.5 sm:p-4">
              <a
                href={telHref(STORE.tel)}
                className="hb-btn-primary h-11 text-[13px]"
              >
                <Icon d={ICON.phone} className="w-4 h-4 text-[#FF8A50]" />
                <span>전화 문의</span>
              </a>
              <a
                href={smsHref(
                  STORE.mobile,
                  isProductSold(selected.status)
                    ? `[한밭중고전자 유사매물문의] 판매완료된 '${selected.title}'${
                        selectedModelName ? ` (${selectedModelName})` : ""
                      }와 비슷한 스펙의 현재 재고 문의드립니다.`
                    : `[한밭중고전자 상품문의] ${selected.title}${
                        selectedModelName ? ` (${selectedModelName})` : ""
                      } 재고 및 견적 문의드립니다.`
                )}
                className="hb-btn-outline h-11 text-[13px]"
              >
                <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#D9531E]" />
                <span>문자 문의</span>
              </a>
              <a
                href={STORE.kakaoChat}
                target="_blank"
                rel="noopener noreferrer"
                className="hb-btn-kakao h-11 text-[13px]"
              >
                <Icon d={ICON.chat} className="w-4 h-4" />
                <span>카톡 상담</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  const inquiryTitle = selectedSold
                    ? `[유사매물 재고문의] ${selected.title}`
                    : `[상품문의] ${selected.title}`;
                  setSelected(null);
                  onInquireProduct(inquiryTitle);
                }}
                className="hb-btn-outline h-11 text-[13px]"
              >
                <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#D9531E]" />
                <span>{selectedSold ? "유사매물 문의" : "온라인 문의"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
