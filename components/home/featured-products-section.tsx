"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  formatProductPrice,
  getProductStatusLabel,
  isProductSold,
  normalizeProductCategory,
  splitImages,
  STORE,
  telHref,
} from "../../lib/site";
import { Icon, ICON, Modal, SafeImg, SectionHeading } from "../../lib/ui";
import { ProductCard, type ProductItem } from "../products/product-card";

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

  const openModal = (item: ProductItem) => {
    setSelected(item);
    setImgIdx(0);
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
      className="border-b border-[#E4E0D8] bg-white py-16 sm:py-20 lg:py-24"
    >
      <div className="hb-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Showroom Inventory"
            title={<span id="featured-heading">현재 판매 중인 추천 매물</span>}
            desc="매장에서 검수와 세척을 마치고 실제 판매 중인 제품입니다. 카드를 누르면 상세 규격을 바로 확인할 수 있습니다."
          />

          <Link
            href="/gallery"
            className="hb-btn-outline h-11 px-5 text-[14px] shrink-0 self-start sm:self-end"
          >
            <span>전체 판매 제품 보기</span>
            <Icon d={ICON.arrow} className="w-4 h-4" />
          </Link>
        </div>

        {/* 로딩 스켈레톤 상태 */}
        {loading ? (
          <div
            className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
            aria-hidden="true"
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-md border border-[#E4E0D8] bg-white animate-pulse"
              >
                <div className="aspect-[4/5] bg-[#EFECE6]" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-1/3 rounded bg-[#EFECE6]" />
                  <div className="h-5 w-4/5 rounded bg-[#EFECE6]" />
                  <div className="h-6 w-1/2 rounded bg-[#EFECE6] pt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* 오류 상태 */
          <div className="mt-10 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-10 text-center">
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
          /* 빈 상태 (가짜 샘플 상품을 노출하지 않음) */
          <div className="mt-10 flex flex-col items-start justify-between gap-6 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-8 sm:flex-row sm:items-center">
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
        ) : (
          /* 정상 상품 그리드 */
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={openModal}
              />
            ))}
          </div>
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
            <div className="flex items-center justify-between border-b border-[#E4E0D8] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="rounded-sm bg-[#F6F5F2] border border-[#E4E0D8] px-2.5 py-1 text-[12px] font-bold text-[#4B5260]">
                  {selectedCategory}
                </span>
                <span
                  className={`rounded-sm px-2.5 py-1 text-[12px] font-bold text-white ${
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
                className="grid h-8 w-8 place-items-center rounded text-[#6B7280] hover:text-[#0E1A2B]"
              >
                <Icon d={ICON.close} className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="relative flex h-[300px] sm:h-[360px] w-full items-center justify-center bg-[#F6F5F2] p-4 border-b border-[#E4E0D8]">
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

              <div className="p-5 sm:p-6 space-y-4">
                <h3 className="text-[20px] font-bold text-[#0E1A2B] leading-snug">
                  {selected.title}
                </h3>

                <div className="flex items-center justify-between rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-4">
                  <div>
                    <span className="block text-[12px] font-semibold text-[#6B7280]">
                      판매 가격
                    </span>
                    <strong className="mt-0.5 block text-[22px] font-bold text-[#D9531E]">
                      {selectedSold
                        ? "판매완료"
                        : formatProductPrice(selected.price, selectedCategory)}
                    </strong>
                  </div>
                  <Link
                    href={`/${selected.id}`}
                    className="text-[13px] font-bold text-[#0E1A2B] underline underline-offset-4 hover:text-[#D9531E]"
                  >
                    개별 상세페이지 이동 →
                  </Link>
                </div>

                {selected.description && (
                  <div className="rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-4">
                    <span className="block text-[12px] font-bold text-[#6B7280] mb-1.5">
                      제품 규격 및 상세 설명
                    </span>
                    <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#1F2530]">
                      {selected.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-[#E4E0D8] bg-white p-4">
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
