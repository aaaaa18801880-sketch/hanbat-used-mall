// 파일 경로: components/products/product-detail-gallery.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Icon,
  ICON,
  Modal,
  SafeImg,
  copyTextAndOpenKakao,
  useQuoteBasket,
} from "../../lib/ui";
import { ShowroomVisitModal } from "../showroom/showroom-visit-modal";
import { getOptionalAdminAuthHeaders } from "../../lib/admin-auth";
import { useIsAdminSession } from "../../lib/use-admin-session";
import {
  addRecentViewedProduct,
  buildProductInquirySmsBody,
  canUseNextImageUrl,
  generatePromoPostText,
  isProductSold,
  MAX_QUOTE_BASKET_ITEMS,
  smsHref,
  STORE,
  telHref,
  toggleQuoteBasketItem,
  trackEvent,
  triggerQuickInquiry,
  type QuoteBasketItem,
} from "../../lib/site";

export function ProductDetailGallery({
  id,
  title,
  category,
  price,
  modelName,
  conditionGrade,
  images,
  status,
}: {
  id?: string;
  title: string;
  category?: string;
  price?: number | null;
  modelName?: string | null;
  conditionGrade?: string | null;
  images: string[];
  status: string | null;
  createdAt?: string | null;
}) {
  const displayImages = images.length > 0 ? images : [""];
  const [idx, setIdx] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Record<string, true>>({});
  const sold = isProductSold(status);
  const markFailedUrl = useCallback((url: string) => {
    setFailedUrls((prev) => (prev[url] ? prev : { ...prev, [url]: true }));
  }, []);

  useEffect(() => {
    if (!id) return;
    trackEvent("view_item", {
      id: String(id),
      category: category || "기타",
      model: modelName || undefined,
      price: price ?? undefined,
    });
    addRecentViewedProduct({
      id,
      title,
      category: category || "기타",
      price: price ?? null,
      status,
      conditionGrade: conditionGrade ?? null,
      modelName: modelName ?? null,
      imageUrl: images[0] || null,
    });

    // 상세 페이지 직접 유입 및 조회수 집계 (sessionStorage "viewed_products" JSON 배열 기준 1회 집계)
    try {
        const raw = sessionStorage.getItem("viewed_products");
        const list: string[] = raw ? JSON.parse(raw) : [];
        if (!list.includes(String(id))) {
          getOptionalAdminAuthHeaders().then((authHeaders) => {
            fetch(`/api/products/${id}/view`, {
              method: "POST",
              headers: authHeaders,
            })
              .then((res) => {
                if (res.ok) {
                  try {
                    const currentRaw = sessionStorage.getItem("viewed_products");
                    const currentList: string[] = currentRaw
                      ? JSON.parse(currentRaw)
                      : [];
                    if (!currentList.includes(String(id))) {
                      currentList.push(String(id));
                      sessionStorage.setItem(
                        "viewed_products",
                        JSON.stringify(currentList)
                      );
                    }
                  } catch {}
                }
              })
              .catch(() => {
                // 조회수 집계 비동기 실패는 조용히 무시
              });
          });
        }
      } catch {}
  }, [id, title, category, price, status, conditionGrade, modelName, images]);

  const go = useCallback(
    (d: number) => {
      if (displayImages.length < 2) return;
      setIdx((i) => (i + d + displayImages.length) % displayImages.length);
    },
    [displayImages.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (displayImages.length < 2) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [displayImages.length, go]);

  return (
    <>
      <div className="flex flex-col rounded-2xl overflow-hidden border border-[#E5E3DC] bg-white">
        {/* 메인 프리뷰 영역: 스튜디오 뷰 */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] hb-studio-backdrop flex items-center justify-center p-2 sm:p-4 overflow-hidden group select-none">
          <div
            className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/[0.04] pointer-events-none select-none"
            aria-hidden="true"
          />

          <div className="relative z-0 w-full h-full">
            {canUseNextImageUrl(displayImages[idx]) &&
            !failedUrls[displayImages[idx]] ? (
              <Image
                key={displayImages[idx]}
                src={displayImages[idx]}
                alt={`${title} - 사진 ${idx + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority={idx === 0}
                loading={idx === 0 ? "eager" : undefined}
                quality={85}
                onError={() => markFailedUrl(displayImages[idx])}
                className={`object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.02] ${
                  sold ? "grayscale opacity-75" : ""
                }`}
              />
            ) : (
              <SafeImg
                key={displayImages[idx]}
                src={displayImages[idx]}
                alt={`${title} - 사진 ${idx + 1}`}
                eager
                className={`w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.02] ${
                  sold ? "grayscale opacity-75" : ""
                }`}
              />
            )}
          </div>

          {displayImages[idx] && (
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              aria-label="상품 사진 크게 보기"
              aria-haspopup="dialog"
              title="클릭하여 원본 비율 전체화면으로 확대"
              className="absolute inset-0 z-10 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C84312]"
            >
              <span className="sr-only">상품 사진 크게 보기</span>
            </button>
          )}

          {status === "예약중" && (
            <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
              <span className="inline-flex items-center rounded-md bg-[#C84312] px-2.5 py-1 text-hb-xs font-bold text-white">
                예약중
              </span>
            </div>
          )}

          {sold && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#141A23]/55 pointer-events-none">
              <span className="px-5 py-2 rounded-lg bg-[#141A23]/90 text-white text-hb-sm font-bold tracking-[0.15em] border border-white/20">
                판매완료
              </span>
            </div>
          )}

          {displayImages[idx] && (
            <div className="absolute top-3.5 right-3.5 z-20 bg-white/90 backdrop-blur-sm border border-[#E5E3DC] text-[#141A23] text-hb-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 pointer-events-none">
              <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#C84312]" />
              <span>크게 보기</span>
            </div>
          )}

          {/* 우하단 사진 순서 표시 */}
          {displayImages.length > 0 && (
            <div className="absolute bottom-3.5 right-3.5 z-20 rounded-md bg-[#141A23]/75 backdrop-blur-sm px-2.5 py-1 text-hb-xs font-semibold text-white tabular-nums pointer-events-none">
              {idx + 1} / {displayImages.length}
            </div>
          )}

          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="이전 사진"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-[#141A23] shadow-sm border border-[#E5E3DC] flex items-center justify-center hover:bg-white transition-colors z-30"
              >
                <Icon d={ICON.left} className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="다음 사진"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-[#141A23] shadow-sm border border-[#E5E3DC] flex items-center justify-center hover:bg-white transition-colors z-30"
              >
                <Icon d={ICON.right} className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* 썸네일 스트립 */}
        {displayImages.length > 1 && (
          <div className="flex gap-2.5 p-3.5 sm:px-5 bg-white border-t border-[#EAE8E2] overflow-x-auto">
            {displayImages.map((img, i) => (
              <button
                key={img + i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`${i + 1}번 사진 선택`}
                className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-[#EFECE4] border transition-[border-color,box-shadow,transform] ${
                  i === idx
                    ? "border-[#C84312] ring-2 ring-[#C84312]/35"
                    : "border-[#E2DDD3] opacity-65 hover:opacity-100"
                }`}
              >
                <span className="absolute top-1 left-1 z-10 rounded bg-[#141A23]/75 px-1.5 py-0.5 text-hb-xs font-mono font-bold text-white tabular-nums leading-none pointer-events-none">
                  {i + 1}
                </span>
                {canUseNextImageUrl(img) && !failedUrls[img] ? (
                  <Image
                    src={img}
                    alt=""
                    width={64}
                    height={64}
                    sizes="64px"
                    quality={70}
                    onError={() => markFailedUrl(img)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <SafeImg
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 전체화면 확대 라이트박스 (Top-Layer Dialog) */}
      <Modal
        open={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        variant="lightbox"
        label="상품 사진 전체화면 확대"
        panelClassName="max-w-5xl w-full rounded-none overflow-visible"
      >
        <div
          onClick={() => setIsZoomOpen(false)}
          className="relative flex flex-col items-center justify-center p-2 sm:p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mb-3 flex w-full items-center justify-between text-white"
          >
            <span className="text-hb-sm font-semibold bg-white/15 px-3.5 py-1 rounded-full tabular-nums">
              {idx + 1} / {displayImages.length}
            </span>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              aria-label="확대 창 닫기"
              autoFocus
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Icon d={ICON.close} className="w-6 h-6" />
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-full max-h-[80vh] flex items-center justify-center"
          >
            <SafeImg
              src={displayImages[idx]}
              alt={title}
              eager
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded"
            />
          </div>

          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="이전 사진"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center z-20"
              >
                <Icon d={ICON.left} className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="다음 사진"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center z-20"
              >
                <Icon d={ICON.right} className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

/**
 * 상품 상세 링크 복사 버튼 (카톡/문자 공유용)
 */
export function CopyProductLinkButton({
  productTitle,
}: {
  productTitle: string;
}) {
  const handleCopy = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("상품 페이지 주소가 복사되었습니다.");
    } catch {
      toast.error("주소 복사에 실패했습니다.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2DDD3] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#334155] hover:border-[#141A23] hover:text-[#141A23] transition-[border-color,color,transform] active:scale-[0.96] shadow-2xs"
      title={`${productTitle} 링크 복사`}
    >
      <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#C84312]" />
      <span>상품 링크 복사</span>
    </button>
  );
}

export function QuoteBasketButton({
  item,
  className = "",
  compact = false,
}: {
  item: QuoteBasketItem;
  className?: string;
  compact?: boolean;
}) {
  const inBasket = useQuoteBasket().some((x) => x.id === item.id);

  const handleToggle = () => {
    const res = toggleQuoteBasketItem(item);
    if (res.limitReached) {
      toast.error(
        `견적함에는 최대 ${MAX_QUOTE_BASKET_ITEMS}개까지 담을 수 있습니다.`
      );
      return;
    }
    if (res.added) {
      trackEvent("add_to_quote_basket", {
        category: item.category,
        location: "detail",
      });
      toast.success("관심 매물 견적함에 담았습니다.");
    } else {
      toast("견적함에서 제외했습니다.");
    }
  };

  const defaultClasses = `inline-flex items-center justify-center gap-1.5 rounded-lg border px-4 h-10 text-hb-xs sm:text-hb-sm font-bold transition-[background-color,border-color,color,transform] active:scale-[0.96] w-full ${
    inBasket
      ? "border-[#C84312] bg-[#FFF4EE] text-[#C84312]"
      : "border-[#D8D1C5] bg-[#FAF9F6] text-[#141A23] hover:border-[#141A23]"
  }`;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={inBasket}
      className={className || defaultClasses}
    >
      <Icon
        d={inBasket ? ICON.check : ICON.plus}
        className={`w-4 h-4 shrink-0 ${
          inBasket ? "text-[#C84312]" : "text-[#141A23]"
        }`}
      />
      <span className="truncate">
        {compact
          ? inBasket
            ? "견적함 담김"
            : "견적함 담기"
          : inBasket
          ? "관심 매물 견적함에 담김 (클릭 시 제외)"
          : "관심 매물 견적함에 담기 (복수 비교·묶음 문의)"}
      </span>
    </button>
  );
}

/**
 * [신규 기능] 네이버 블로그 / 당근마켓 / 중고나라 홍보글 원클릭 복사 버튼
 * - useIsAdminSession 내부의 isAuthorizedAdminUser 검증을 통과한 관리자에게만 노출됩니다.
 */
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
  const isAdmin = useIsAdminSession();

  if (!isAdmin) return null;

  const handleCopyPromo = async () => {
    try {
      const text = generatePromoPostText(product);
      await navigator.clipboard.writeText(text);
      toast.success(
        "블로그·당근마켓용 홍보글 양식이 복사되었습니다. 그대로 붙여넣기(Ctrl+V) 하세요!"
      );
    } catch {
      toast.error("홍보글 복사에 실패했습니다.");
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <Link
        href={`/admin?search=${encodeURIComponent(product.id)}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2DDD3] bg-[#FAF9F6] px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-white transition-[border-color,background-color,color,transform] active:scale-[0.96] shadow-2xs"
        title="관리자 페이지에서 이 상품 정보 수정하기"
      >
        <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#141A23]" />
        <span>상품 수정 (관리자)</span>
      </Link>
      <button
        type="button"
        onClick={handleCopyPromo}
        className={
          className ||
          "inline-flex items-center gap-1.5 rounded-lg border border-[#E2DDD3] bg-[#FAF9F6] px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-white transition-[border-color,background-color,color,transform] active:scale-[0.96] shadow-2xs"
        }
        title="네이버 블로그·당근마켓·카페 게시글 양식으로 상품 요약 복사 (관리자 전용)"
      >
        <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#C84312]" />
        <span>홍보글 양식 복사 (관리자)</span>
      </button>
    </div>
  );
}

/**
 * [인터랙티브 시너지 컴포넌트]
 * 상품 상세 우측의 설치 환경 체크리스트를 고객이 직접 클릭해 선택하면,
 * 온라인 문의 / 문자(SMS) / 견적함에 해당 현장 조건이 자동으로 첨부됩니다.
 */
export function InteractiveChecklistAndCta({
  product,
  categoryLabel,
  sold,
  modelName,
  firstImageUrl,
}: {
  product: {
    id: string;
    title: string;
    price: number | null;
    status: string | null;
    condition_grade?: string | null;
    description?: string | null;
  };
  categoryLabel: string;
  sold: boolean;
  modelName: string | null;
  firstImageUrl: string | null;
}) {
  const smsBody = buildProductInquirySmsBody({
    id: product.id,
    title: product.title,
    category: categoryLabel,
    price: product.price,
    status: product.status,
    modelName,
  });

  const galleryCategoryHref = `/gallery?category=${encodeURIComponent(categoryLabel)}`;
  const [visitModalOpen, setVisitModalOpen] = useState(false);

  const handleOpenQuickInquiry = () => {
    trackEvent("begin_buy_inquiry", {
      location: "product_detail_cta",
      product_id: product.id,
    });
    triggerQuickInquiry({
      type: categoryLabel === "업소용기기" ? "대량·업소용 상담" : "구매 문의",
      productId: product.id,
      productTitle: product.title,
      modelName: modelName || undefined,
      category: categoryLabel,
    });
  };

  const handleScrollToSpatialCheck = () => {
    const section = document.getElementById("spatial-check-section");
    if (!section) return;
    const details = section.querySelector("details");
    if (details && !details.open) {
      details.open = true;
    }
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mt-5 space-y-2.5">
      {sold && (
        <div className="rounded-xl border border-[#FADCD0] bg-[#FFF4EE] p-3 text-hb-xs text-[#C84312] font-semibold leading-snug flex items-center gap-2">
          <Icon d={ICON.bell} className="w-4 h-4 shrink-0 text-[#C84312]" />
          <span>
            이 매물은 판매 완료되었으나 직영 매장에{" "}
            <strong className="underline">동일·유사 스펙 대기 매물</strong>이 있습니다.
          </span>
        </div>
      )}

      {/* 1순위: 직영 매장 전화 문의 버튼 */}
      <a
        href={telHref(STORE.tel)}
        aria-label={`${STORE.name} 직영 매장 전화 문의 연결 (${STORE.tel})`}
        className="w-full h-14 rounded-xl bg-[#141A23] hover:bg-[#1E2736] text-white flex items-center justify-between px-4 sm:px-5 transition-[background-color,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] focus-visible:ring-offset-2 group cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#C84312] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Icon d={ICON.phone} className="w-5 h-5 text-white" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-hb-base font-bold leading-tight text-white flex items-center gap-1.5 truncate">
              <span>{sold ? "유사 매물 전화 문의" : "전화 바로 문의하기"}</span>
              <span className="text-hb-xs font-bold text-[#FF8A50] tabular-nums">
                ({STORE.tel})
              </span>
            </div>
            <p className="text-hb-xs text-white/80 font-medium leading-none mt-1 truncate">
              재고 확인 · 방문 및 배송 상담
            </p>
          </div>
        </div>
        <Icon
          d={ICON.arrow}
          className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform shrink-0 ml-2"
        />
      </a>

      {/* 2순위: 카카오톡 1:1 상담 버튼 (상품 정보 클립보드 자동 복사 후 이동) */}
      <button
        type="button"
        onClick={() =>
          void copyTextAndOpenKakao(smsBody, "click_kakao_consult", {
            location: "product_detail_cta",
            product_id: product.id,
          })
        }
        aria-label={`${STORE.name} 카카오톡 1:1 상담창 열기 (상품 정보 자동 복사)`}
        className="w-full h-14 rounded-xl bg-[#FEE500] hover:bg-[#F2D900] text-[#191600] flex items-center justify-between px-4 sm:px-5 transition-[background-color,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] focus-visible:ring-offset-2 group cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-black/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Icon d={ICON.chat} className="w-5 h-5 text-[#191600]" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-hb-base font-bold leading-tight text-[#191600] truncate">
              {sold ? "카톡으로 유사 매물 찾기" : "카카오톡 1:1 상담하기"}
            </div>
            <p className="text-hb-xs text-[#191600]/80 font-medium leading-none mt-1 truncate">
              상품명·링크 자동 복사 → 카톡방 바로 붙여넣기
            </p>
          </div>
        </div>
        <Icon
          d={ICON.right}
          className="w-5 h-5 text-[#191600]/60 group-hover:translate-x-1 transition-transform shrink-0 ml-2"
        />
      </button>

      {/* 3순위: 무중첩 보조 유틸리티 액션 행 + 공간·전원 체크 + 매장 방문 길찾기 */}
      <div className="pt-3 border-t border-[#E2DDD3] space-y-2.5">
        <div className={`grid gap-2 ${sold ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
          <button
            type="button"
            onClick={handleOpenQuickInquiry}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] hover:border-[#141A23] hover:bg-[#141A23] text-[#141A23] hover:text-white h-10 px-2.5 text-hb-xs font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] cursor-pointer"
          >
            <Icon d={ICON.pen} className="h-3.5 w-3.5 text-[#0284C7] shrink-0" />
            <span className="truncate">{sold ? "유사매물 문의" : "온라인 견적"}</span>
          </button>

          <a
            href={smsHref(STORE.mobile, smsBody)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] hover:border-[#141A23] hover:bg-[#141A23] text-[#141A23] hover:text-white h-10 px-2.5 text-hb-xs font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]"
          >
            <Icon d={ICON.chat} className="h-3.5 w-3.5 text-[#C84312] shrink-0" />
            <span className="truncate">문자 문의</span>
          </a>

          <QuoteBasketButton
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] hover:border-[#141A23] hover:bg-[#141A23] text-[#141A23] hover:text-white h-10 px-2.5 text-hb-xs font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] cursor-pointer"
            compact
            item={{
              id: String(product.id),
              title: product.title,
              category: categoryLabel,
              price: product.price,
              status: product.status,
              conditionGrade: product.condition_grade,
              description: product.description || "",
              modelName,
              imageUrl: firstImageUrl,
              quantity: 1,
            }}
          />

          {sold && (
            <Link
              href={galleryCategoryHref}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#C84312]/40 bg-[#FFF4EE] hover:bg-[#C84312] text-[#C84312] hover:text-white h-10 px-2.5 text-hb-xs font-bold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]"
            >
              <Icon d={ICON.grid} className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">유사 매물 찾기</span>
            </Link>
          )}
        </div>

        {/* 우리 집 문폭·전기 10초 체크 빠른 이동 */}
        <button
          type="button"
          onClick={handleScrollToSpatialCheck}
          className="w-full pt-2.5 border-t border-[#E2DDD3] text-[#0F766E] hover:text-[#141A23] flex items-center justify-between gap-2 transition-colors text-hb-xs font-semibold cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <Icon d={ICON.ruler} className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">우리 집 문폭·전기(220V/380V) 10초 체크</span>
          </span>
          <span className="font-bold shrink-0">바로 확인 ↓</span>
        </button>

        {/* 4순위: 직영 매장 방문 확인 · 길찾기 */}
        <button
          type="button"
          onClick={() => {
            trackEvent("open_showroom_modal", {
              productId: String(product.id),
              category: categoryLabel,
            });
            setVisitModalOpen(true);
          }}
          className="w-full pt-2.5 border-t border-[#E2DDD3] text-[#334155] hover:text-[#141A23] flex items-center justify-between gap-2 transition-colors text-hb-xs cursor-pointer"
        >
          <div className="flex items-center gap-1.5 min-w-0 font-medium">
            <Icon d={ICON.pin} className="w-3.5 h-3.5 text-[#C84312] shrink-0" />
            <span className="truncate">{STORE.jibunAddress} 직영 매장 방문 · 길찾기</span>
          </div>
          <span className="text-hb-xs font-bold text-[#C84312] shrink-0">
            예약 · 길찾기 →
          </span>
        </button>
      </div>

      {visitModalOpen && (
        <ShowroomVisitModal
          open={visitModalOpen}
          onClose={() => setVisitModalOpen(false)}
          product={{
            id: String(product.id),
            title: product.title,
            category: categoryLabel,
            price: product.price,
            modelName,
            imageUrl: firstImageUrl,
          }}
        />
      )}
    </div>
  );
}
