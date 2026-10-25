// 파일 경로: components/products/product-detail-gallery.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Icon, ICON, SafeImg } from "../../lib/ui";
import { ProductStatusBadge } from "./product-status-badge";
import { getAdminAuthHeaders, isAuthorizedAdminUser, supabase } from "../../lib/supabase";
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
      <div className="flex flex-col rounded-xl overflow-hidden border border-[#E5E2DC] bg-white shadow-card">
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

        {/* 메인 프리뷰 영역: 시원시원한 대형 뷰 (스튜디오 백드롭 적용) */}
        <div
          onClick={() => displayImages[0] && setIsZoomOpen(true)}
          className="relative w-full aspect-[4/3] sm:aspect-[16/11] hb-studio-backdrop flex items-center justify-center p-1 sm:p-2 overflow-hidden cursor-zoom-in group select-none"
          title="클릭하여 원본 비율 전체화면으로 확대"
        >
          <SafeImg
            key={displayImages[idx]}
            src={displayImages[idx]}
            alt={`${title} - 사진 ${idx + 1}`}
            eager
            className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02] ${
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
                className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-[#F5F4F0] border transition-all ${
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
    <div className="inline-flex items-center gap-1.5">
      <Link
        href={`/admin?search=${encodeURIComponent(product.id)}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8D3C8] bg-[#FAF9F7] px-3 py-1.5 text-hb-xs font-bold text-[#0E1A2B] hover:border-[#0E1A2B] hover:bg-white transition-colors shadow-2xs"
        title="관리자 페이지에서 이 상품 정보 수정하기"
      >
        <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#0E1A2B]" />
        <span>상품 수정 (관리자)</span>
      </Link>
      <button
        type="button"
        onClick={handleCopyPromo}
        className={
          className ||
          "inline-flex items-center gap-1.5 rounded-lg border border-[#D8D3C8] bg-[#FAF9F7] px-3 py-1.5 text-hb-xs font-bold text-[#0E1A2B] hover:border-[#0E1A2B] hover:bg-white transition-colors shadow-2xs"
        }
        title="네이버 블로그·당근마켓·카페 게시글 양식으로 상품 요약 복사 (관리자 전용)"
      >
        <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#D9531E]" />
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
  const [showChecklist, setShowChecklist] = useState(false);
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
    <div className="mt-4 pt-4 border-t border-[#E5E2DC] space-y-3.5">
      {/* 1. 설치 환경 체크리스트 및 조건 선택 (슬림 접이식 컴팩트 독) */}
      <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon d={ICON.check} className="w-4 h-4 text-[#D9531E] shrink-0" />
            <span className="text-hb-xs font-bold text-[#0E1A2B] truncate">
              {checklistConfig.title}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-hb-xs font-bold shrink-0 ${
                checklistConfig.isB2B
                  ? "bg-[#0E1A2B] text-white"
                  : "bg-[#D9531E]/10 text-[#D9531E]"
              }`}
            >
              {checklistConfig.badge}
            </span>
            {selectedChips.length > 0 && (
              <span className="rounded bg-[#0E1A2B] px-1.5 py-0.5 text-hb-xs font-bold text-white shrink-0">
                {selectedChips.length}개 선택
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowChecklist((v) => !v)}
            className="text-hb-xs font-bold text-[#646E7E] hover:text-[#0E1A2B] underline shrink-0 cursor-pointer"
          >
            {showChecklist ? "옵션 닫기 ▴" : "설치조건 선택 ▾"}
          </button>
        </div>

        {showChecklist && (
          <div className="mt-2.5 pt-2 border-t border-[#E5E2DC] space-y-2.5">
            <dl className="grid grid-cols-1 gap-1 text-hb-xs bg-white border-l-2 border-[#0E1A2B] p-2 rounded">
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
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-hb-xs font-bold text-[#3E4756]">
                  내 설치 조건 선택 (선택 시 문의에 자동 첨부)
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
                      className={`rounded-md px-2 py-0.5 text-hb-xs font-semibold transition-colors border cursor-pointer ${
                        active
                          ? "bg-[#0E1A2B] text-white border-[#0E1A2B]"
                          : "bg-white text-[#3E4756] border-[#D8D3C8] hover:border-[#0E1A2B]"
                      }`}
                    >
                      {active ? `✓ ${chip}` : `+ ${chip}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. 대형 2-Track 원터치 빅 버튼 (누구나 0.5초 만에 누를 수 있는 초직관 설계) */}
      <div className="space-y-2.5">
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

        {/* 1순위: 특대형 전화 바로 문의 버튼 */}
        <a
          href={telHref(STORE.tel)}
          className="w-full h-14 rounded-xl bg-[#D9531E] hover:bg-[#C04615] text-white shadow-card flex items-center justify-between px-4 transition-all duration-200 active:scale-[0.99] group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Icon d={ICON.phone} className="w-5 h-5 text-white" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-hb-base font-extrabold leading-tight text-white flex items-center gap-1.5 truncate">
                <span>{sold ? "유사 매물 전화 문의" : "전화 바로 문의하기"}</span>
                <span className="text-hb-xs font-semibold text-[#FFD2C0]">
                  ({STORE.tel})
                </span>
              </div>
              <p className="text-hb-xs text-white/80 font-medium leading-none mt-1 truncate">
                실시간 재고 확인 · 배송·설치 일정 즉시 상담
              </p>
            </div>
          </div>
          <Icon
            d={ICON.arrow}
            className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2"
          />
        </a>

        {/* 2순위: 특대형 카카오톡 1:1 상담 버튼 */}
        <a
          href={STORE.kakaoChat}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-14 rounded-xl bg-[#FEE500] hover:bg-[#F2D900] text-[#191600] shadow-2xs flex items-center justify-between px-4 transition-all duration-200 active:scale-[0.99] group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Icon d={ICON.chat} className="w-5 h-5 text-[#191600]" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-hb-base font-extrabold leading-tight text-[#191600] truncate">
                {sold ? "카톡으로 유사 매물 찾기" : "카카오톡 1:1 상담하기"}
              </div>
              <p className="text-hb-xs text-[#191600]/75 font-medium leading-none mt-1 truncate">
                실물 사진 전송 · 견적서 파일 즉시 수신
              </p>
            </div>
          </div>
          <Icon
            d={ICON.right}
            className="w-4 h-4 text-[#191600]/50 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2"
          />
        </a>

        {/* 3순위: 보조 문의 동선 (문자 / 온라인 견적서) */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <a
            href={smsHref(STORE.mobile, smsBody)}
            className="hb-btn-outline h-10 px-3 text-hb-xs justify-center font-bold"
          >
            <Icon d={ICON.chat} className="h-3.5 w-3.5 text-[#D9531E] shrink-0" />
            <span className="truncate">
              {sold
                ? "유사 매물 문자"
                : selectedChips.length > 0
                ? `조건 문자 (${selectedChips.length})`
                : "문자 바로 문의"}
            </span>
          </a>

          <Link
            href={inquiryHref}
            className="hb-btn-primary h-10 px-3 text-hb-xs justify-center font-bold"
          >
            <Icon d={ICON.pen} className="h-3.5 w-3.5 text-[#FF8A50] shrink-0" />
            <span className="truncate">
              {sold
                ? "유사 재고 문의"
                : selectedChips.length > 0
                ? `조건 견적 (${selectedChips.length})`
                : "온라인 견적서 작성"}
            </span>
          </Link>
        </div>

        {/* 4순위: 관심 매물 견적함 토글 버튼 */}
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
