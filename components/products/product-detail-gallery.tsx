// 파일 경로: components/products/product-detail-gallery.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Icon, ICON, SafeImg } from "../../lib/ui";
import { ProductStatusBadge } from "./product-status-badge";
import {
  STORE,
  telHref,
  smsHref,
  addRecentViewedProduct,
  generatePromoPostText,
  getQuoteBasket,
  isProductSold,
  QUOTE_BASKET_EVENT,
  toggleQuoteBasketItem,
  trackEvent,
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
  category?: string | null;
  price?: number | null;
  modelName?: string | null;
  conditionGrade?: string | null;
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

    // 1. 비로그인 최근 본 매물에 자동 저장 (localStorage)
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

    // 2. 조회수 증가 API 호출 (관리자 제외)
    let cancelled = false;
    (async () => {
      try {
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
  }, [id, title, category, price, status, conditionGrade, modelName, images]);

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
      <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#646E7E]" />
      <span>상품 링크 복사</span>
    </button>
  );
}

/**
 * 관리자 전용 홍보글 복사 버튼 (일반 방문자 화면에서는 숨겨 시각적 복잡도를 줄임)
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
  }, []);

  if (!isAdmin) return null;

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

  return (
    <button
      type="button"
      onClick={handleCopyPromo}
      className={
        className ||
        "inline-flex items-center gap-1.5 rounded-md border border-[#FADCD0] bg-[#FFF5F0] px-3 h-9 text-[12px] font-bold text-[#D9531E] hover:bg-[#D9531E] hover:text-white transition-colors"
      }
      title="관리자 전용: 당근마켓·네이버카페·블로그 업로드용 홍보 문구 복사"
    >
      <Icon d={ICON.copy} className="w-3.5 h-3.5" />
      <span>[관리자] 홍보글 복사</span>
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
      trackEvent("add_to_quote_basket", {
        category: item.category,
        location: "product_detail",
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
          ? "견적함에 담김 (하단 바에서 수량 조절 · 매물 비교 가능)"
          : "관심 매물 견적함에 담기 (수량 선택 · 비교 · 묶음 문의)"}
      </span>
    </button>
  );
}

export interface ChecklistRowItem {
  label: string;
  desc: string;
}

export interface CategoryChecklistConfig {
  badge: string;
  title: string;
  isB2B: boolean;
  rows: ReadonlyArray<ChecklistRowItem>;
}

const QUICK_ENV_OPTIONS_BY_CATEGORY: Record<
  string,
  ReadonlyArray<{ group: string; options: readonly string[] }>
> = {
  업소용기기: [
    {
      group: "전원규격",
      options: ["단상 220V", "삼상 380V", "전원규격 모름(상담필요)"],
    },
    {
      group: "반입환경",
      options: ["1층 매장", "엘리베이터 있음", "계단운반/문폭 확인필요"],
    },
    {
      group: "추가요청",
      options: ["전자세금계산서 발행", "기존 기기 철거·매입 희망", "세트 묶음할인 문의"],
    },
  ],
  "에어컨/냉난방기": [
    {
      group: "전원/공간",
      options: ["단상 220V", "삼상 380V", "상가·사무실", "가정집"],
    },
    {
      group: "실외기위치",
      options: ["1층/베란다 바닥", "외벽 앵글 거치", "옥상/장배관 상담"],
    },
    {
      group: "타공/철거",
      options: ["배관 구멍 있음", "벽체 타공 필요", "기존 에어컨 철거 희망"],
    },
  ],
  default: [
    {
      group: "운반층수",
      options: ["1층 / 엘리베이터 있음", "2층 이상 계단", "사다리차 여부 상담"],
    },
    {
      group: "설치환경",
      options: ["일반 수평설치", "현관·방문 폭 좁음(치수확인)"],
    },
    {
      group: "기존가전",
      options: ["기존 가전 보상매입 희망", "폐가전 동시수거 희망", "수거 없음"],
    },
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
  checklistConfig: CategoryChecklistConfig;
}) {
  const [selectedEnvTags, setSelectedEnvTags] = useState<string[]>([]);

  const optionGroups =
    QUICK_ENV_OPTIONS_BY_CATEGORY[categoryLabel] ||
    QUICK_ENV_OPTIONS_BY_CATEGORY.default;

  const toggleEnvTag = (tag: string) => {
    setSelectedEnvTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const envSummaryText =
    selectedEnvTags.length > 0 ? selectedEnvTags.join(" / ") : "";

  // 온라인 문의 URL 동적 생성 (선택한 설치 환경이 envNote 파라미터로 자동 전달됨)
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
  if (envSummaryText) {
    inquiryParams.set("envNote", envSummaryText);
  }
  const dynamicInquiryHref = `/inquiry?${inquiryParams.toString()}`;

  // 문자(SMS) 본문 동적 생성
  const dynamicSmsBody = sold
    ? `[한밭중고전자 유사매물문의] [${categoryLabel}] 판매완료된 '${product.title}'${
        modelName ? ` (${modelName})` : ""
      }와 비슷한 스펙의 현재 재고 문의드립니다.${
        envSummaryText ? `\n• 현장조건: ${envSummaryText}` : ""
      }`
    : `[한밭중고전자 상품문의] [${categoryLabel}] ${product.title}${
        modelName ? ` (${modelName})` : ""
      } 재고 및 배송·설치 견적 문의드립니다.${
        envSummaryText ? `\n• 선택 현장조건: ${envSummaryText}` : ""
      }`;

  return (
    <div className="mt-6 pt-5 border-t border-[#E5E2DC] space-y-4">
      {/* 1. 카테고리별 설치 환경 체크리스트 + 원클릭 조건 선택 칩 */}
      <div
        aria-label={checklistConfig.title}
        className={`overflow-hidden rounded-lg border ${
          checklistConfig.isB2B
            ? "border-[#0E1A2B]/20 bg-[#F8FAFC]"
            : "border-[#E5E2DC] bg-[#FAF9F7]"
        }`}
      >
        <div
          className={`flex items-center justify-between px-3.5 py-2.5 text-[12px] font-bold ${
            checklistConfig.isB2B
              ? "bg-[#0E1A2B] text-white"
              : "bg-[#EFECE6] text-[#0E1A2B]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Icon
              d={ICON.check}
              className={`h-3.5 w-3.5 ${
                checklistConfig.isB2B ? "text-[#FF8A50]" : "text-[#D9531E]"
              }`}
            />
            <span>{checklistConfig.title}</span>
          </span>
          <span
            className={`text-[10px] tracking-wider uppercase ${
              checklistConfig.isB2B ? "text-white/70" : "text-[#646E7E]"
            }`}
          >
            {checklistConfig.badge}
          </span>
        </div>

        <dl className="divide-y divide-[#E5E2DC] text-[12.5px]">
          {checklistConfig.rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[78px_1fr] gap-2.5 px-3.5 py-2 items-start"
            >
              <dt className="font-bold text-[#0E1A2B]">{row.label}</dt>
              <dd className="text-[#3E4756] leading-snug">{row.desc}</dd>
            </div>
          ))}
        </dl>

        {/* 인터랙티브 현장 조건 원클릭 선택 영역 */}
        <div className="border-t border-[#E5E2DC] bg-white p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-extrabold text-[#0E1A2B]">
              👆 내 설치 조건 터치 선택{" "}
              <span className="font-normal text-[#646E7E]">
                (선택 시 아래 문자·온라인 문의에 자동 첨부)
              </span>
            </span>
            {selectedEnvTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedEnvTags([])}
                className="text-[11px] font-semibold text-[#D9531E] hover:underline shrink-0"
              >
                선택 초기화
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {optionGroups.map((grp) => (
              <div key={grp.group} className="flex flex-wrap items-center gap-1">
                <span className="w-[58px] shrink-0 text-[11px] font-bold text-[#646E7E]">
                  • {grp.group}
                </span>
                {grp.options.map((opt) => {
                  const active = selectedEnvTags.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleEnvTag(opt)}
                      aria-pressed={active}
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold border transition-colors ${
                        active
                          ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E] font-bold"
                          : "border-[#E5E2DC] bg-[#FAF9F7] text-[#3E4756] hover:border-[#0E1A2B]"
                      }`}
                    >
                      {active ? `✓ ${opt}` : opt}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {selectedEnvTags.length > 0 && (
            <p className="rounded bg-[#FFF5F0] border border-[#FADCD0] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#B5431A]">
              ✓ 선택된 현장 조건: <strong>{envSummaryText}</strong>
            </p>
          )}
        </div>
      </div>

      {/* 2. 상담 및 견적함 액션 버튼 그룹 */}
      <div className="space-y-2.5">
        {sold ? (
          <div className="rounded-lg border border-[#FADCD0] bg-[#FFF5F0] p-3.5 text-[13px] text-[#3E4756]">
            <strong className="block font-bold text-[#D9531E] mb-0.5">
              💡 본 상품은 판매가 완료되었습니다.
            </strong>
            <p className="leading-snug break-keep">
              중촌동 직영 매장에는 온라인에 미처 등록하지 못한{" "}
              <strong className="text-[#0E1A2B]">
                동일·유사 규격({categoryLabel}) 매물
              </strong>
              이 상시 준비되어 있습니다. 아래 버튼으로 편하게 재고를 문의해 주세요.
            </p>
          </div>
        ) : (
          <QuoteBasketButton
            item={{
              id: String(product.id),
              title: product.title,
              category: categoryLabel,
              price: product.price,
              status: product.status,
              conditionGrade: product.condition_grade,
              description: product.description,
              modelName,
              imageUrl: firstImageUrl,
            }}
          />
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={telHref(STORE.tel)}
            onClick={() =>
              trackEvent("click_tel_consult", { location: "product_detail" })
            }
            className="hb-btn-primary h-11 text-[14px]"
          >
            <Icon d={ICON.phone} className="h-4 w-4 text-[#FF8A50]" />
            <span>{sold ? "유사매물 전화문의" : "전화 상담"}</span>
          </a>
          <a
            href={STORE.kakaoChat}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("click_kakao_consult", { location: "product_detail" })
            }
            className="hb-btn-kakao h-11 text-[14px]"
          >
            <Icon d={ICON.chat} className="h-4 w-4" />
            <span>카카오톡 문의</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <a
            href={smsHref(STORE.mobile, dynamicSmsBody)}
            onClick={() =>
              trackEvent("click_sms_consult", { location: "product_detail" })
            }
            className="hb-btn-outline h-10 text-[13px]"
          >
            <Icon d={ICON.chat} className="h-3.5 w-3.5 text-[#D9531E]" />
            <span>
              문자({STORE.mobile}) 문의
              {selectedEnvTags.length > 0 ? ` (조건 ${selectedEnvTags.length}건 포함)` : ""}
            </span>
          </a>
          <Link
            href={dynamicInquiryHref}
            className="hb-btn-outline h-10 text-[13px]"
          >
            <Icon d={ICON.pen} className="h-3.5 w-3.5 text-[#D9531E]" />
            <span>
              {sold ? "동일·유사 모델 재고 문의" : "온라인 문의 남기기"}
              {selectedEnvTags.length > 0 ? ` (+조건첨부)` : ""}
            </span>
          </Link>
        </div>

        <p className="pt-1 text-center text-[12px] text-[#646E7E] tabular-nums">
          매장 대표전화 <strong className="text-[#0E1A2B]">{STORE.tel}</strong> · 직통{" "}
          <strong className="text-[#0E1A2B]">{STORE.mobile}</strong>
        </p>
      </div>
    </div>
  );
}
