// 파일 경로: components/products/product-detail-gallery.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Icon, ICON, SafeImg } from "../../lib/ui";
import { ProductStatusBadge } from "./product-status-badge";
import { ShowroomVisitModal } from "../showroom/showroom-visit-modal";
import { getAdminAuthHeaders, isAuthorizedAdminUser, supabase } from "../../lib/supabase";
import {
  addRecentViewedProduct,
  buildProductInquirySmsBody,
  generatePromoPostText,
  getQuoteBasket,
  isProductSold,
  QUOTE_BASKET_EVENT,
  smsHref,
  STORE,
  telHref,
  toggleQuoteBasketItem,
  trackEvent,
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
  createdAt,
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
  const sold = isProductSold(status);

  useEffect(() => {
    if (!id) return;
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
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem("viewed_products");
        const list: string[] = raw ? JSON.parse(raw) : [];
        if (!list.includes(String(id))) {
          getAdminAuthHeaders().then((authHeaders) => {
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
    }
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
      if (e.key === "Escape" && isZoomOpen) {
        setIsZoomOpen(false);
        return;
      }
      if (displayImages.length < 2) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [displayImages.length, go, isZoomOpen]);

  return (
    <>
      <div className="flex flex-col rounded-3xl overflow-hidden border border-[#E2E6EC] bg-white shadow-card">
        {/* 메인 프리뷰 영역: 애플 스토어식 풀블리드 스튜디오 뷰 (상단 영문 바 제거) */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] hb-studio-backdrop flex items-center justify-center p-2 sm:p-4 overflow-hidden group select-none">
          <SafeImg
            key={displayImages[idx]}
            src={displayImages[idx]}
            alt={`${title} - 사진 ${idx + 1}`}
            eager
            className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02] ${
              sold ? "grayscale opacity-75" : ""
            }`}
          />

          {displayImages[0] && (
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              aria-label="상품 사진 크게 보기"
              aria-haspopup="dialog"
              title="클릭하여 원본 비율 전체화면으로 확대"
              className="absolute inset-0 z-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8521A]"
            >
              <span className="sr-only">상품 사진 크게 보기</span>
            </button>
          )}

          <div className="absolute top-4 left-4 z-10">
            <ProductStatusBadge status={status} createdAt={createdAt} />
          </div>

          {sold && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#141A23]/55">
              <span className="px-5 py-2 rounded-full bg-[#141A23]/90 text-white text-hb-sm font-bold tracking-[0.15em] border border-white/20">
                판매완료
              </span>
            </div>
          )}

          {displayImages[0] && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-[#141A23] shadow-xs text-hb-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
              <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#E8521A]" />
              <span>크게 보기</span>
            </div>
          )}

          {/* 우하단 애플/당근 스타일 반투명 사진 순서 캡슐 */}
          {displayImages.length > 0 && (
            <div className="absolute bottom-3.5 right-4 z-10 rounded-full bg-[#141A23]/75 backdrop-blur-md px-3 py-1 text-hb-xs font-bold text-white tabular-nums pointer-events-none">
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
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-[#141A23] shadow-md flex items-center justify-center hover:bg-white transition-colors z-10"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-[#141A23] shadow-md flex items-center justify-center hover:bg-white transition-colors z-10"
              >
                <Icon d={ICON.right} className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* 썸네일 스트립 */}
        {displayImages.length > 1 && (
          <div className="flex gap-2.5 p-3.5 sm:px-5 bg-white border-t border-[#F1F3F6] overflow-x-auto">
            {displayImages.map((img, i) => (
              <button
                key={img + i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`${i + 1}번 사진 선택`}
                className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-[#F1F3F6] border transition-[border-color,box-shadow,transform] ${
                  i === idx
                    ? "border-[#E8521A] ring-2 ring-[#E8521A]/35"
                    : "border-[#E2E6EC] opacity-65 hover:opacity-100"
                }`}
              >
                <SafeImg
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 전체화면 확대 라이트박스 */}
      {isZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="상품 사진 전체화면 확대"
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-[90] bg-black/95 flex flex-col items-center justify-center p-4 select-none"
        >
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20">
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
            className="relative max-w-full max-h-[82vh] flex items-center justify-center"
          >
            <SafeImg
              src={displayImages[idx]}
              alt={title}
              eager
              className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded"
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
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center z-20"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center z-20"
              >
                <Icon d={ICON.right} className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}
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
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E6EC] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#334155] hover:border-[#141A23] hover:text-[#141A23] transition-[border-color,color,transform] active:scale-[0.96] shadow-2xs"
      title={`${productTitle} 링크 복사`}
    >
      <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#E8521A]" />
      <span>상품 링크 복사</span>
    </button>
  );
}

/**
 * [신규 기능] 상품 상세 페이지에서 견적함에 담기/빼기 토글 버튼
 */
export function QuoteBasketButton({
  item,
  className = "",
  compact = false,
}: {
  item: QuoteBasketItem;
  className?: string;
  compact?: boolean;
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
      ? "border-[#E8521A] bg-[#FFF4EE] text-[#E8521A]"
      : "border-[#CBD2DC] bg-[#F7F8FA] text-[#141A23] hover:border-[#141A23]"
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
          inBasket ? "text-[#E8521A]" : "text-[#141A23]"
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) =>
        setIsAdmin(isAuthorizedAdminUser(data.session?.user))
      );
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setIsAdmin(isAuthorizedAdminUser(session?.user))
    );
    return () => sub.subscription.unsubscribe();
  }, []);

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
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E6EC] bg-[#F7F8FA] px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-white transition-[border-color,background-color,color,transform] active:scale-[0.96] shadow-2xs"
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
          "inline-flex items-center gap-1.5 rounded-lg border border-[#E2E6EC] bg-[#F7F8FA] px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-white transition-[border-color,background-color,color,transform] active:scale-[0.96] shadow-2xs"
        }
        title="네이버 블로그·당근마켓·카페 게시글 양식으로 상품 요약 복사 (관리자 전용)"
      >
        <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#E8521A]" />
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
export const QUICK_ENV_CHIPS_BY_CATEGORY: Record<string, readonly string[]> = {
  업소용기기: [
    "단상 220V",
    "삼상 380V",
    "1층 매장",
    "계단·턱 있음",
    "기존 설비 철거·매입 희망",
    "세금계산서 발행 요청",
  ],
  "에어컨/냉난방기": [
    "단상 220V",
    "삼상 380V",
    "실외기 1층/베란다",
    "외벽 앵글 필요",
    "배관 5m 이내",
    "배관 10m 이상",
  ],
  default: [
    "엘리베이터 있음",
    "계단 운반(2층 이상)",
    "기존 가전 보상매입/수거 희망",
    "문폭 80cm 이상 여유",
  ],
};

export function InteractiveChecklistAndCta({
  product,
  categoryLabel,
  sold,
  modelName,
  firstImageUrl,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checklistConfig,
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
  checklistConfig?: {
    badge: string;
    title: string;
    isB2B: boolean;
    rows: ReadonlyArray<{ label: string; desc: string }>;
  };
}) {
  const inquiryParams = new URLSearchParams({
    write: "1",
    type: categoryLabel === "업소용기기" ? "대량·업소용 상담" : "구매 문의",
    productId: String(product.id),
    title: sold
      ? `[유사매물 재고문의] [${categoryLabel}] ${product.title}`
      : `[상품문의] [${categoryLabel}] ${product.title}`,
    category: categoryLabel,
  });
  if (modelName) {
    inquiryParams.set("model", modelName);
  }
  const inquiryHref = `/inquiry?${inquiryParams.toString()}`;

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

  return (
    <div className="mt-5 pt-4 border-t border-[#E2E6EC] space-y-3">
      {sold && (
        <div className="rounded-xl border border-[#FADCD0] bg-[#FFF4EE] p-3 text-hb-xs text-[#E8521A] font-semibold leading-snug flex items-center gap-2">
          <Icon d={ICON.bell} className="w-4 h-4 shrink-0 text-[#E8521A]" />
          <span>
            이 매물은 판매 완료되었으나 직영 매장에{" "}
            <strong className="underline">동일·유사 스펙 대기 매물</strong>이 있습니다.
          </span>
        </div>
      )}

      {/* 1순위: 직영 매장 전화 문의 버튼 (h-14, WCAG AA 고대비 다크 네이비 + 오렌지 포인트) */}
      <a
        href={telHref(STORE.tel)}
        aria-label={`${STORE.name} 직영 매장 전화 문의 연결 (${STORE.tel})`}
        className="w-full h-14 rounded-2xl bg-[#141A23] hover:bg-[#1E2736] text-white shadow-card flex items-center justify-between px-4 sm:px-5 transition-[background-color,transform,box-shadow] duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] focus-visible:ring-offset-2 group cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#E8521A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Icon d={ICON.phone} className="w-5 h-5 text-white" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-hb-base font-bold leading-tight text-white flex items-center gap-1.5 truncate">
              <span>{sold ? "유사 매물 전화 문의" : "전화 바로 문의하기"}</span>
              <span className="text-hb-xs font-bold text-[#FF8A50] tabular-nums">
                ({STORE.tel})
              </span>
            </div>
            <p className="text-hb-xs text-white/85 font-medium leading-none mt-1 truncate">
              실시간 재고 확인 · 빠른 방문/배송 상담 (터치 즉시 연결)
            </p>
          </div>
        </div>
        <Icon
          d={ICON.arrow}
          className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform shrink-0 ml-2"
        />
      </a>

      {/* 2순위: 카카오톡 1:1 상담 버튼 (h-14) */}
      <a
        href={STORE.kakaoChat}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${STORE.name} 카카오톡 1:1 실시간 상담창 열기 (새 창)`}
        className="w-full h-14 rounded-2xl bg-[#FEE500] hover:bg-[#F2D900] text-[#191600] shadow-2xs flex items-center justify-between px-4 sm:px-5 transition-[background-color,transform,box-shadow] duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] focus-visible:ring-offset-2 group cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Icon d={ICON.chat} className="w-5 h-5 text-[#191600]" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-hb-base font-bold leading-tight text-[#191600] truncate">
              {sold ? "카톡으로 유사 매물 찾기" : "카카오톡 1:1 상담하기"}
            </div>
            <p className="text-hb-xs text-[#191600]/80 font-medium leading-none mt-1 truncate">
              실물 사진 전송 · 견적서 파일 즉시 수신
            </p>
          </div>
        </div>
        <Icon
          d={ICON.right}
          className="w-5 h-5 text-[#191600]/60 group-hover:translate-x-1 transition-transform shrink-0 ml-2"
        />
      </a>

      {/* 3순위: 토스 TDS 스타일 원카드 소프트 액션 독 (동심원 곡률 R_inner(8px) = R_outer(16px) - Padding(8px)) */}
      <div className="rounded-2xl bg-[#F1F3F6] p-2 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <a
            href={smsHref(STORE.mobile, smsBody)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-[#141A23] text-[#141A23] hover:text-white h-10 px-2.5 text-hb-xs font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.96] shadow-2xs"
          >
            <Icon d={ICON.chat} className="h-3.5 w-3.5 text-[#E8521A] shrink-0" />
            <span className="truncate">문자 문의</span>
          </a>

          <Link
            href={inquiryHref}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-[#141A23] text-[#141A23] hover:text-white h-10 px-2.5 text-hb-xs font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.96] shadow-2xs"
          >
            <Icon d={ICON.pen} className="h-3.5 w-3.5 text-[#0284C7] shrink-0" />
            <span className="truncate">온라인 견적</span>
          </Link>

          <QuoteBasketButton
            className="flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-[#141A23] text-[#141A23] hover:text-white h-10 px-2.5 text-hb-xs font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.96] shadow-2xs cursor-pointer"
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

          <Link
            href={galleryCategoryHref}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-[#141A23] text-[#141A23] hover:text-white h-10 px-2.5 text-hb-xs font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.96] shadow-2xs"
          >
            <Icon d={ICON.grid} className="h-3.5 w-3.5 text-[#0D9488] shrink-0" />
            <span className="truncate">유사 매물</span>
          </Link>
        </div>

        {/* 4순위: [EVO-015] 직영 매장 방문 실물 확인 & 1초 내비 길찾기 (독 하단 소프트 바) */}
        <button
          type="button"
          onClick={() => {
            trackEvent("open_showroom_modal", {
              productId: String(product.id),
              category: categoryLabel,
            });
            setVisitModalOpen(true);
          }}
          className="w-full h-10 rounded-lg bg-white/85 hover:bg-white text-[#141A23] flex items-center justify-between px-3.5 transition-[background-color,color,transform] duration-150 active:scale-[0.96] font-bold text-hb-xs cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Icon d={ICON.pin} className="w-3.5 h-3.5 text-[#E8521A] shrink-0" />
            <span className="truncate">대전 중촌동 직영 매장 실물 확인 · 1초 길찾기</span>
          </div>
          <span className="text-hb-xs font-bold text-[#E8521A] shrink-0 ml-1">
            실물 찜 →
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
