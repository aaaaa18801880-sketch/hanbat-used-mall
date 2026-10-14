"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Icon, ICON, SafeImg } from "../../lib/ui";
import { ProductStatusBadge } from "./product-status-badge";
import { isProductSold } from "../../lib/site";

export function ProductDetailGallery({
  title,
  images,
  status,
  createdAt,
}: {
  title: string;
  images: string[];
  status: string | null;
  createdAt?: string | null;
}) {
  const displayImages = images.length > 0 ? images : [""];
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const sold = isProductSold(status);

  const moveSlide = useCallback(
    (delta: number) => {
      if (displayImages.length < 2) return;
      setActiveIndex(
        (prev) => (prev + delta + displayImages.length) % displayImages.length
      );
    },
    [displayImages.length]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && zoomOpen) {
        setZoomOpen(false);
        return;
      }
      if (displayImages.length < 2) return;
      if (e.key === "ArrowLeft") moveSlide(-1);
      if (e.key === "ArrowRight") moveSlide(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayImages.length, moveSlide, zoomOpen]);

  useEffect(() => {
    if (!zoomOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [zoomOpen]);

  return (
    <div className="flex flex-col bg-[#FAF9F7]">
      {/* 메인 이미지 뷰포트 (고정 비율로 로딩 중 레이아웃 이동 방지) */}
      <div
        onClick={() => displayImages[0] && setZoomOpen(true)}
        className={`relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-[#EFECE6] flex items-center justify-center p-3 sm:p-5 select-none ${
          displayImages[0] ? "cursor-zoom-in group" : ""
        }`}
        title={displayImages[0] ? "클릭하여 전체화면으로 확대" : undefined}
      >
        <SafeImg
          key={displayImages[activeIndex]}
          src={displayImages[activeIndex]}
          alt={`${title} 사진 ${activeIndex + 1}`}
          eager
          className={`max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02] ${
            sold ? "grayscale opacity-75" : ""
          }`}
        />

        {sold && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0E1A2B]/45">
            <span className="rounded-sm border border-white/25 bg-[#0E1A2B]/90 px-5 py-2 text-[14px] font-bold tracking-[0.2em] text-white">
              판매완료
            </span>
          </div>
        )}

        <div className="absolute left-4 top-4 z-10">
          <ProductStatusBadge status={status} createdAt={createdAt} />
        </div>

        {displayImages[0] && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomOpen(true);
            }}
            className="absolute right-3.5 top-3.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-black/80 transition-colors"
            aria-label="사진 전체화면 확대"
          >
            <Icon d={ICON.search} className="h-3.5 w-3.5" />
            <span>사진 확대</span>
          </button>
        )}

        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                moveSlide(-1);
              }}
              aria-label="이전 상품 사진"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#0E1A2B] shadow-md hover:bg-white transition"
            >
              <Icon d={ICON.left} className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                moveSlide(1);
              }}
              aria-label="다음 상품 사진"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#0E1A2B] shadow-md hover:bg-white transition"
            >
              <Icon d={ICON.right} className="h-5 w-5" />
            </button>
            <span className="pointer-events-none absolute bottom-3 right-3.5 z-10 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white">
              {activeIndex + 1} / {displayImages.length}
            </span>
          </>
        )}
      </div>

      {/* 하단 썸네일 리스트 */}
      {displayImages.length > 1 && (
        <div
          className="flex gap-2.5 overflow-x-auto border-t border-[#E4E0D8] bg-white p-3.5"
          role="tablist"
          aria-label="상품 추가 사진 목록"
        >
          {displayImages.map((imgUrl, idx) => (
            <button
              key={imgUrl + idx}
              type="button"
              role="tab"
              aria-selected={activeIndex === idx}
              aria-label={`${idx + 1}번 사진 선택`}
              onClick={() => setActiveIndex(idx)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border bg-[#F6F5F2] transition-all ${
                activeIndex === idx
                  ? "border-[#D9531E] ring-2 ring-[#D9531E]/35 opacity-100"
                  : "border-[#E4E0D8] opacity-65 hover:opacity-100"
              }`}
            >
              <SafeImg
                src={imgUrl}
                alt={`${title} 썸네일 ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* 전체화면 확대 라이트박스 (모바일 및 데스크톱 대응) */}
      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} 사진 확대 보기`}
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/95 p-3 sm:p-6 select-none"
        >
          <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between text-white">
            <span className="rounded-full bg-white/15 px-3.5 py-1 text-[13px] font-semibold">
              {activeIndex + 1} / {displayImages.length}
            </span>
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              aria-label="확대 창 닫기"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30 transition"
            >
              <Icon d={ICON.close} className="h-6 w-6" />
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[84vh] max-w-full items-center justify-center"
          >
            <SafeImg
              src={displayImages[activeIndex]}
              alt={`${title} 확대 사진 ${activeIndex + 1}`}
              eager
              className="max-h-[82vh] max-w-full w-auto h-auto object-contain rounded"
            />
          </div>

          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveSlide(-1);
                }}
                aria-label="이전 사진"
                className="absolute left-3 sm:left-6 top-1/2 z-20 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/20 text-white hover:bg-white/35 transition"
              >
                <Icon d={ICON.left} className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveSlide(1);
                }}
                aria-label="다음 사진"
                className="absolute right-3 sm:right-6 top-1/2 z-20 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/20 text-white hover:bg-white/35 transition"
              >
                <Icon d={ICON.right} className="h-6 w-6" />
              </button>
            </>
          )}

          <p className="mt-3 text-[12px] text-white/60">
            화면을 누르거나 ESC 키를 누르면 닫힙니다.
          </p>
        </div>
      )}
    </div>
  );
}

export function CopyProductLinkButton({
  productTitle,
}: {
  productTitle: string;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("상품 페이지 주소가 복사되었습니다.");
    } catch {
      toast.error("주소 복사에 실패했습니다.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="hb-btn-outline h-10 px-3.5 text-[13px]"
      aria-label={`${productTitle} 링크 복사`}
    >
      <span>링크 복사</span>
    </button>
  );
}