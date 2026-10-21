// 파일 경로: components/products/product-detail-gallery.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Icon, ICON, SafeImg } from "../../lib/ui";
import { ProductStatusBadge } from "./product-status-badge";
import {
  generatePromoPostText,
  getQuoteBasket,
  isProductSold,
  QUOTE_BASKET_EVENT,
  toggleQuoteBasketItem,
  type QuoteBasketItem,
} from "../../lib/site";
import {
  supabase,
  isAuthorizedAdminUser,
  getAdminAuthHeaders,
} from "../../lib/supabase";

export function ProductDetailGallery({
  id,
  title,
  images,
  status,
  createdAt,
}: {
  id?: string;
  title: string;
  images: string[];
  status: string | null;
  createdAt?: string | null;
}) {
  const displayImages = images.length > 0 ? images : [""];
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const sold = isProductSold(status);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        // 관리자 로그인 상태에서는 본인 검수/수정 접속이므로 조회수를 카운트하지 않음
        const { data: authData } = await supabase.auth.getSession();
        if (cancelled) return;
        if (isAuthorizedAdminUser(authData.session?.user)) return;

        const viewedStr = sessionStorage.getItem("viewed_products") || "[]";
        const viewedList = JSON.parse(viewedStr) as string[];
        if (viewedList.includes(id)) return;

        const authHeaders = await getAdminAuthHeaders();
        const res = await fetch(`/api/products/${id}/view`, {
          method: "POST",
          headers: authHeaders,
        });
        if (!res.ok || cancelled) return;

        const nextStr = sessionStorage.getItem("viewed_products") || "[]";
        const nextList = JSON.parse(nextStr) as string[];
        if (!nextList.includes(id)) {
          nextList.push(id);
          sessionStorage.setItem("viewed_products", JSON.stringify(nextList));
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
      className="hb-btn-outline h-9 px-3 text-[12.5px]"
      aria-label={`${productTitle} 링크 복사`}
    >
      <span>링크 복사</span>
    </button>
  );
}

export function CopyPromoPostButton({
  product,
  className = "",
}: {
  product: {
    id: string;
    title: string;
    category?: string | null;
    price?: number | null;
    status?: string | null;
    condition_grade?: string | null;
    description?: string | null;
  };
  className?: string;
}) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!cancelled && isAuthorizedAdminUser(data.session?.user)) {
          setIsAdmin(true);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}/${product.id}`
          : "";
      await navigator.clipboard.writeText(url);
      toast.success("상품 링크가 복사되었습니다.");
    } catch {
      toast.error("링크 복사에 실패했습니다.");
    }
  };

  const handleCopyPromo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const text = generatePromoPostText(product);
      await navigator.clipboard.writeText(text);
      toast.success("당근마켓·네이버카페·블로그 홍보 원고가 복사되었습니다!");
    } catch {
      toast.error("홍보 원고 복사에 실패했습니다.");
    }
  };

  if (!isAdmin) {
    return (
      <button
        type="button"
        onClick={handleCopyLink}
        className={
          className ||
          "inline-flex items-center gap-1.5 rounded-md border border-[#DDD9D1] bg-[#FAF9F7] px-3 h-9 text-[12.5px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B] transition-colors"
        }
        title="상품 링크 복사"
        aria-label={`${product.title} 링크 복사`}
      >
        <Icon d={ICON.share} className="w-3.5 h-3.5 text-[#0E1A2B]" />
        <span>🔗 상품 링크 복사</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopyPromo}
      className={
        className ||
        "inline-flex items-center gap-1.5 rounded-md border border-[#DDD9D1] bg-[#FAF9F7] px-3 h-9 text-[12.5px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B] transition-colors"
      }
      title="당근마켓·네이버카페·블로그 업로드용 홍보 문구 복사 (관리자)"
    >
      <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#D9531E]" />
      <span>📋 홍보글 복사</span>
    </button>
  );
}

export function QuoteBasketButton({
  item,
  className = "",
}: {
  item: QuoteBasketItem;
  className?: string;
}) {
  const [inBasket, setInBasket] = useState(false);

  useEffect(() => {
    const sync = () => {
      setInBasket(getQuoteBasket().some((x) => x.id === item.id));
    };
    sync();
    window.addEventListener(QUOTE_BASKET_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(QUOTE_BASKET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [item.id]);

  const handleToggle = () => {
    const res = toggleQuoteBasketItem(item);
    if (res.limitReached) {
      toast.error("견적함에는 최대 8개까지 담을 수 있습니다.");
    } else if (res.added) {
      toast.success("관심 매물 견적함에 담았습니다.");
    } else {
      toast("견적함에서 제외했습니다.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={inBasket}
      className={
        className ||
        `inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-md border text-[13.5px] font-bold transition-colors ${
          inBasket
            ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E]"
            : "border-[#DDD9D1] bg-[#FAF9F7] text-[#0E1A2B] hover:border-[#0E1A2B]"
        }`
      }
    >
      <Icon
        d={inBasket ? ICON.check : ICON.plus}
        className="w-4 h-4 text-[#D9531E]"
      />
      <span>
        {inBasket
          ? "견적함에 담김 (우측 하단에서 묶음 문의 가능)"
          : "관심 매물 견적함에 담기 (복수 품목 묶음 문의)"}
      </span>
    </button>
  );
}
