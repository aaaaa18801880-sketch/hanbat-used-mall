// 파일 경로: components/products/product-detail-gallery.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Icon, ICON, SafeImg } from "../../lib/ui";
import { ProductStatusBadge } from "./product-status-badge";
import { isAuthorizedAdminUser, supabase } from "../../lib/supabase";
import {
  addRecentViewedProduct,
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
      <div className="flex flex-col rounded-xl overflow-hidden border border-[#E5E2DC] bg-[#F3F1EC] shadow-card">
        {/* 상단 쇼룸 이미지 뷰어 바 */}
        <div className="bg-[#0E1A2B] text-white px-4 py-2.5 flex items-center justify-between gap-2 text-hb-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#D9531E]" />
            <span className="font-bold tracking-wider uppercase text-white/90">
              SHOWROOM STUDIO PHOTO
            </span>
          </div>
          <span className="text-white/75 font-medium tabular-nums">
            실물 촬영 사진 ({idx + 1} / {displayImages.length})
          </span>
        </div>

        {/* 메인 프리뷰 영역 */}
        <div
          onClick={() => displayImages[0] && setIsZoomOpen(true)}
          className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-[#F3F1EC] flex items-center justify-center p-4 sm:p-6 overflow-hidden cursor-zoom-in group select-none"
          title="클릭하여 원본 비율 전체화면으로 확대"
        >
          <SafeImg
            key={displayImages[idx]}
            src={displayImages[idx]}
            alt={`${title} - 사진 ${idx + 1}`}
            eager
            className={`max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02] drop-shadow-sm ${
              sold ? "grayscale opacity-75" : ""
            }`}
          />

          <div className="absolute top-3.5 left-3.5 z-10">
            <ProductStatusBadge status={status} createdAt={createdAt} />
          </div>

          {sold && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0E1A2B]/45">
              <span className="px-5 py-2 rounded bg-[#0E1A2B]/90 text-white text-hb-sm font-bold tracking-[0.2em] border border-white/20">
                판매완료
              </span>
            </div>
          )}

          {displayImages[0] && (
            <div className="absolute top-3.5 right-3.5 bg-[#0E1A2B]/75 text-white text-hb-xs font-semibold px-3 py-1 rounded-md flex items-center gap-1.5 pointer-events-none">
              <Icon d={ICON.search} className="w-3.5 h-3.5" />
              <span>원본 확대</span>
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
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-[#0E1A2B] shadow-md flex items-center justify-center hover:bg-white transition-colors z-10"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-[#0E1A2B] shadow-md flex items-center justify-center hover:bg-white transition-colors z-10"
              >
                <Icon d={ICON.right} className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* 썸네일 스트립 */}
        {displayImages.length > 1 && (
          <div className="flex gap-2.5 p-3 sm:px-5 bg-white border-t border-[#E5E2DC] overflow-x-auto">
            {displayImages.map((img, i) => (
              <button
                key={img + i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`${i + 1}번 사진 선택`}
                className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-[#F3F1EC] border transition-all ${
                  i === idx
                    ? "border-[#D9531E] ring-2 ring-[#D9531E]/35"
                    : "border-[#E5E2DC] opacity-65 hover:opacity-100"
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
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white"
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
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8D3C8] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#3E4856] hover:border-[#0E1A2B] hover:text-[#0E1A2B] transition-colors shadow-2xs"
      title={`${productTitle} 링크 복사`}
    >
      <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#D9531E]" />
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

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={inBasket}
      className={
        className ||
        `inline-flex items-center justify-center gap-1.5 rounded-lg border px-4 h-10 text-hb-xs sm:text-hb-sm font-bold transition-colors w-full ${
          inBasket
            ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E]"
            : "border-[#CFCAC0] bg-[#FAF9F7] text-[#0E1A2B] hover:border-[#0E1A2B]"
        }`
      }
    >
      <Icon
        d={inBasket ? ICON.check : ICON.plus}
        className={`w-4 h-4 ${
          inBasket ? "text-[#D9531E]" : "text-[#0E1A2B]"
        }`}
      />
      <span>
        {inBasket
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
    <button
      type="button"
      onClick={handleCopyPromo}
      className={
        className ||
        "inline-flex items-center gap-1.5 rounded-lg border border-[#D8D3C8] bg-[#FAF9F7] px-3 py-1.5 text-hb-xs font-bold text-[#0E1A2B] hover:border-[#0E1A2B] hover:bg-white transition-colors shadow-2xs"
      }
      title="네이버 블로그·당근마켓·카페 게시글 양식으로 상품 요약 복사 (관리자 전용)"
    >
      <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#D9531E]" />
      <span>홍보글 양식 복사 (관리자)</span>
    </button>
  );
}

/**
 * [인터랙티브 시너지 컴포넌트]
 * 상품 상세 우측의 설치 환경 체크리스트를 고객이 직접 클릭해 선택하면,
 * 온라인 문의 / 문자(SMS) / 견적함에 해당 현장 조건이 자동으로 첨부됩니다.
 */
const QUICK_ENV_CHIPS_BY_CATEGORY: Record<string, readonly string[]> = {
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
  checklistConfig: {
    badge: string;
    title: string;
    isB2B: boolean;
    rows: ReadonlyArray<{ label: string; desc: string }>;
  };
}) {
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const chips =
    QUICK_ENV_CHIPS_BY_CATEGORY[categoryLabel] ||
    QUICK_ENV_CHIPS_BY_CATEGORY.default;

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const envSummary =
    selectedChips.length > 0 ? selectedChips.join(", ") : "";

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
  if (envSummary) {
    inquiryParams.set("envNote", envSummary);
  }
  const inquiryHref = `/inquiry?${inquiryParams.toString()}`;

  const smsBody = sold
    ? `[한밭중고전자 유사매물문의] 판매완료된 '${product.title}'${
        modelName ? ` (${modelName})` : ""
      }${
        envSummary ? ` / 현장조건: ${envSummary}` : ""
      }와 비슷한 스펙의 현재 구매 가능한 재고가 있는지 문의드립니다.`
    : `[한밭중고전자 상품문의] [${categoryLabel}] ${product.title}${
        modelName ? ` (${modelName})` : ""
      }${
        envSummary ? ` / 현장조건: ${envSummary}` : ""
      } 재고 및 배송·설치 견적 문의드립니다.`;

  return (
    <div className="mt-4 pt-4 border-t border-[#E5E2DC] space-y-4">
      {/* 1. 인터랙티브 설치 환경 체크 및 터치 칩 */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <strong className="font-bold text-[#0E1A2B] text-hb-xs sm:text-hb-sm flex items-center gap-1.5">
            <Icon d={ICON.check} className="w-4 h-4 text-[#D9531E]" />
            <span>{checklistConfig.title}</span>
          </strong>
          <span
            className={`rounded px-2 py-0.5 text-hb-xs font-bold ${
              checklistConfig.isB2B
                ? "bg-[#0E1A2B] text-white"
                : "bg-[#D9531E]/10 text-[#D9531E]"
            }`}
          >
            {checklistConfig.badge}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-1 text-hb-xs bg-[#FAF9F7] border-l-2 border-[#0E1A2B] pl-3 py-2">
          {checklistConfig.rows.map((row) => (
            <div key={row.label} className="flex items-start gap-2">
              <dt className="w-[74px] shrink-0 font-bold text-[#0E1A2B]">
                · {row.label}
              </dt>
              <dd className="text-[#3E4756] leading-snug break-keep">
                {row.desc}
              </dd>
            </div>
          ))}
        </dl>

        {/* 터치형 현장 조건 선택 칩 */}
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-hb-xs font-bold text-[#3E4756]">
              내 설치 조건 선택 (선택 시 문의 내용에 자동 첨부)
            </span>
            {selectedChips.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedChips([])}
                className="text-hb-xs font-semibold text-[#646E7E] underline"
              >
                선택 해제
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => {
              const active = selectedChips.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  aria-pressed={active}
                  className={`rounded-md px-2.5 py-1 text-hb-xs font-semibold transition-colors border cursor-pointer ${
                    active
                      ? "bg-[#0E1A2B] text-white border-[#0E1A2B]"
                      : "bg-[#FAF9F7] text-[#3E4756] border-[#D8D3C8] hover:border-[#0E1A2B]"
                  }`}
                >
                  {active ? `✓ ${chip}` : `+ ${chip}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. 다채널 즉시 상담 동선 (첫 화면에 바로 노출) */}
      <div className="pt-2 border-t border-[#E5E2DC] space-y-2">
        {sold && (
          <div className="rounded-lg border border-[#FADCD0] bg-[#FFF5F0] px-3 py-2 text-hb-xs text-[#B5431A] font-semibold leading-snug flex items-start gap-1.5">
            <Icon d={ICON.bell} className="w-4 h-4 shrink-0 mt-0.5 text-[#D9531E]" />
            <span>
              이 매물은 판매 완료되었으나 직영 매장에{" "}
              <strong className="underline">동일·유사 스펙 대기 매물</strong>이
              있을 수 있습니다.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <a
            href={telHref(STORE.tel)}
            className="hb-btn-accent h-11 px-4 text-hb-sm"
          >
            <Icon d={ICON.phone} className="h-4 w-4" />
            <span>
              {sold
                ? `유사 매물 전화 (${STORE.tel})`
                : `전화로 바로 문의 (${STORE.tel})`}
            </span>
          </a>

          <a
            href={STORE.kakaoChat}
            target="_blank"
            rel="noopener noreferrer"
            className="hb-btn-kakao h-11 px-4 text-hb-sm"
          >
            <Icon d={ICON.chat} className="h-4 w-4" />
            <span>{sold ? "카톡으로 유사 매물 찾기" : "카카오톡 상담"}</span>
          </a>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={smsHref(STORE.mobile, smsBody)}
            className="hb-btn-outline h-10 px-3 text-hb-xs"
          >
            <Icon d={ICON.chat} className="h-3.5 w-3.5 text-[#D9531E]" />
            <span>
              {sold
                ? "유사 매물 문자 요청"
                : selectedChips.length > 0
                ? `조건 포함 문자 (${selectedChips.length})`
                : `문자 문의 (${STORE.mobile})`}
            </span>
          </a>

          <Link
            href={inquiryHref}
            className="hb-btn-primary h-10 px-3 text-hb-xs"
          >
            <Icon d={ICON.pen} className="h-3.5 w-3.5 text-[#FF8A50]" />
            <span>
              {sold
                ? "유사 매물 입고·재고 문의"
                : selectedChips.length > 0
                ? `선택 조건(${selectedChips.length}) 온라인 문의`
                : "이 상품으로 온라인 문의"}
            </span>
          </Link>
        </div>

        <QuoteBasketButton
          item={{
            id: String(product.id),
            title: product.title,
            category: categoryLabel,
            price: product.price,
            status: product.status,
            conditionGrade: product.condition_grade,
            description: envSummary
              ? `${product.description || ""}\n[현장조건: ${envSummary}]`
              : product.description,
            modelName,
            imageUrl: firstImageUrl,
            quantity: 1,
          }}
        />
      </div>
    </div>
  );
}
