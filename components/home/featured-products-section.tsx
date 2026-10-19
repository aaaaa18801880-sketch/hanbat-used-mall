"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  formatProductPrice,
  getProductStatusLabel,
  isProductSold,
  normalizeProductCategory,
  normalizeProductStatus,
  PRODUCT_CATEGORIES,
  splitImages,
  STORE,
  telHref,
  trackEvent,
} from "../../lib/site";
import { Icon, ICON, Modal, SafeImg, SectionHeading } from "../../lib/ui";
import {
  ProductCard,
  ProductTrustMicroStrip,
  type ProductItem,
} from "../products/product-card";

const QUICK_FILTER_TABS = ["전체", ...PRODUCT_CATEGORIES] as const;

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
  const [viewOverrides, setViewOverrides] = useState<Record<string, number>>(
    {}
  );

  const filteredProducts = useMemo(() => {
    if (activeCategory === "전체") return products.slice(0, 8);
    return products
      .filter(
        (p) => normalizeProductCategory(p.category) === activeCategory
      )
      .slice(0, 8);
  }, [products, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 전체: products.length };
    for (const p of products) {
      const cat = normalizeProductCategory(p.category);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [products]);

  const openModal = async (item: ProductItem) => {
    const currentViews =
      typeof viewOverrides[item.id] === "number"
        ? viewOverrides[item.id]
        : item.views || 0;

    setSelected({ ...item, views: currentViews });
    setImgIdx(0);
    trackEvent("view_item", {
      category: normalizeProductCategory(item.category),
      status: normalizeProductStatus(item.status),
    });

    try {
      const viewedStr = sessionStorage.getItem("viewed_products") || "[]";
      const viewedList = JSON.parse(viewedStr) as string[];
      if (viewedList.includes(item.id)) return;

      const optimisticViews = currentViews + 1;
      setViewOverrides((prev) => ({ ...prev, [item.id]: optimisticViews }));
      setSelected((prev) =>
        prev && prev.id === item.id ? { ...prev, views: optimisticViews } : prev
      );

      const res = await fetch(`/api/products/${item.id}/view`, {
        method: "POST",
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
                    onClick={() => setActiveCategory(cat)}
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
          </div>
        )}

        {/* 로딩 스켈레톤 상태 */}
        {loading ? (
          <div
            className="mt-8 grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4"
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
          /* 오류 상태 */
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
          /* 빈 상태 */
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
        ) : filteredProducts.length === 0 ? (
          /* 선택 카테고리에 추천 매물이 없을 때 */
          <div className="mt-8 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-8 text-center">
            <p className="text-[15.5px] font-bold text-[#0E1A2B]">
              최근 등록된 8개 추천 매물 중 &lsquo;{activeCategory}&rsquo; 품목이 없습니다.
            </p>
            <p className="mt-1 text-[13.5px] text-[#6B7280]">
              전체 판매 제품 갤러리에서 해당 카테고리의 전체 재고를 확인하시거나 전체 탭으로 돌아가실 수 있습니다.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveCategory("전체")}
                className="hb-btn-outline h-10 px-4 text-[13px]"
              >
                추천 매물 전체 보기
              </button>
              <Link
                href={`/gallery?category=${encodeURIComponent(activeCategory)}`}
                className="hb-btn-primary h-10 px-4 text-[13px]"
              >
                {activeCategory} 전체 매물 보러가기 →
              </Link>
            </div>
          </div>
        ) : (
          /* 정상 상품 그리드 */
          <>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {filteredProducts.map((product) => {
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

            {/* 하단 쇼룸 안내 바 */}
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] px-4 sm:px-5 py-3.5 text-[13px] text-[#4B5260]">
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

      {/* 빠른 상품 상세 미리보기 모달 */}
      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          label={`${selected.title} 상세 정보`}
          panelClassName="max-w-xl"
        >
          <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg border border-[#E4E0D8] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E4E0D8] px-4 sm:px-5 py-3.5 bg-white">
              <div className="flex items-center gap-2">
                <span className="rounded-sm bg-[#F6F5F2] border border-[#E4E0D8] px-2.5 py-1 text-[11.5px] font-bold text-[#4B5260]">
                  {selectedCategory}
                </span>
                <span
                  className={`rounded-sm px-2.5 py-1 text-[11.5px] font-bold text-white ${
                    selectedSold ? "bg-[#6B7280]" : "bg-[#0E1A2B]"
                  }`}
                >
                  {getProductStatusLabel(selected.status)}
                </span>
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
              <div className="relative flex h-[260px] sm:h-[340px] w-full items-center justify-center bg-[#F6F5F2] p-4 border-b border-[#E4E0D8]">
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
                <h3 className="text-[18px] sm:text-[20px] font-bold text-[#0E1A2B] leading-snug">
                  {selected.title}
                </h3>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-3.5 sm:p-4">
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
                      className="text-[13px] font-bold text-[#0E1A2B] underline underline-offset-4 hover:text-[#D9531E]"
                    >
                      개별 상세페이지 이동 →
                    </Link>
                  </div>
                </div>

                <ProductTrustMicroStrip category={selectedCategory} />

                {selected.description && (
                  <div className="rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-4">
                    <span className="block text-[12px] font-bold text-[#6B7280] mb-1.5">
                      제품 규격 및 상세 설명
                    </span>
                    <p className="whitespace-pre-line text-[13.5px] sm:text-[14px] leading-relaxed text-[#1F2530]">
                      {selected.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-[#E4E0D8] bg-white p-3.5 sm:p-4">
              <a
                href={telHref(STORE.tel)}
                className="hb-btn-primary h-11 text-[13.5px]"
              >
                <Icon d={ICON.phone} className="w-4 h-4" /> 전화 문의
              </a>
              <a
                href={STORE.kakaoChat}
                target="_blank"
                rel="noopener noreferrer"
                className="hb-btn-kakao h-11 text-[13.5px]"
              >
                <Icon d={ICON.chat} className="w-4 h-4" /> 카톡 상담
              </a>
              <button
                type="button"
                onClick={() => {
                  const title = selected.title;
                  setSelected(null);
                  onInquireProduct(title);
                }}
                className="hb-btn-outline h-11 text-[13.5px]"
              >
                <Icon d={ICON.pen} className="w-4 h-4" /> 온라인 문의
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

