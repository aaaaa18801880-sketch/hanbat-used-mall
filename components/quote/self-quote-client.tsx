// 파일 경로: components/quote/self-quote-client.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { Icon, ICON } from "../../lib/icons";
import {
  MAX_QUOTE_BASKET_ITEMS,
  PRODUCT_CATEGORIES,
  STORE,
  clearQuoteBasket,
  isProductSold,
  normalizeProductCategory,
  removeQuoteBasketItem,
  smsHref,
  splitImages,
  toggleQuoteBasketItem,
  trackEvent,
  updateQuoteBasketItemQuantity,
  type ProductCardSummaryItem,
  type QuoteBasketItem,
} from "../../lib/site";
import {
  buildQuoteDocumentSummary,
  buildQuoteShareMessage,
  formatQuoteDateKst,
} from "../../lib/quote-document";
import { SafeImg, useQuoteBasket } from "../layout/ui-primitives";

const QuoteDocumentModal = dynamic(
  () =>
    import("./quote-document-modal").then((m) => m.QuoteDocumentModal),
  { ssr: false }
);

const CATEGORY_SHORT_LABELS: Record<string, string> = {
  "에어컨/냉난방기": "에어컨·냉난방",
  냉장고: "냉장고",
  "세탁기/건조기": "세탁·건조",
  업소용기기: "업소용기기",
  기타: "기타가전",
};

async function copyQuoteTextSafe(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }
  if (typeof document === "undefined") return false;
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

export function SelfQuoteClient({
  initialProducts,
}: {
  initialProducts: ProductCardSummaryItem[];
}) {
  const basketItems = useQuoteBasket();
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [docOpen, setDocOpen] = useState(false);

  const basketMap = useMemo(() => {
    const map = new Map<string, QuoteBasketItem>();
    for (const item of basketItems) {
      map.set(item.id, item);
    }
    return map;
  }, [basketItems]);

  const categoryTabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of initialProducts) {
      const cat = normalizeProductCategory(p.category);
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }

    return [
      { key: "전체", label: "전체", count: initialProducts.length },
      ...PRODUCT_CATEGORIES.map((cat) => ({
        key: cat,
        label: CATEGORY_SHORT_LABELS[cat] ?? cat,
        count: counts.get(cat) || 0,
      })),
    ];
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialProducts.filter((product) => {
      if (selectedCategory !== "전체") {
        if (normalizeProductCategory(product.category) !== selectedCategory) {
          return false;
        }
      }
      if (!q) return true;
      const haystack = [
        product.title,
        product.model_name || "",
        normalizeProductCategory(product.category),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [initialProducts, selectedCategory, searchQuery]);

  const summary = useMemo(
    () => buildQuoteDocumentSummary(basketItems),
    [basketItems]
  );

  const quoteDate = useMemo(() => formatQuoteDateKst(), []);
  const quickShareMessage = useMemo(
    () =>
      buildQuoteShareMessage(basketItems, {
        recipientName: "",
        contactName: "",
        quoteName: summary.defaultQuoteName,
        quoteDate,
        validDays: 7,
        deliveryNote: "직영 배송·설치 협의",
      }),
    [basketItems, summary.defaultQuoteName, quoteDate]
  );

  const handleAddProduct = (product: ProductCardSummaryItem) => {
    const existing = basketMap.get(product.id);
    if (existing) {
      const nextQty = (existing.quantity || 1) + 1;
      updateQuoteBasketItemQuantity(product.id, nextQty);
      toast.success(`수량을 ${nextQty}대로 늘렸습니다.`);
      return;
    }

    const firstImg = splitImages(product.image_url)[0] || null;
    const res = toggleQuoteBasketItem({
      id: product.id,
      title: product.title,
      category: normalizeProductCategory(product.category),
      price: product.price,
      quantity: 1,
      status: product.status,
      conditionGrade: product.condition_grade ?? null,
      modelName: product.model_name ?? null,
      specCapsules: product.spec_capsules ?? null,
      widthMm: product.width_mm ?? null,
      imageUrl: firstImg,
    });

    if (res.limitReached) {
      toast.error(
        `견적함에는 최대 ${MAX_QUOTE_BASKET_ITEMS}종까지 담을 수 있습니다.`
      );
      return;
    }

    trackEvent("add_to_quote_basket", {
      category: normalizeProductCategory(product.category),
      location: "self_quote_page",
    });
    toast.success("견적 제품에 담았습니다.");
  };

  const handleDirectKakaoClick = () => {
    trackEvent("click_quote_document_kakao", {
      count: basketItems.length,
      location: "self_quote_panel",
    });
    void copyQuoteTextSafe(quickShareMessage).then((copied) => {
      if (copied) {
        toast.success(
          "견적 목록이 복사되었습니다! 카카오톡 창에 붙여넣기(Ctrl+V)해 보내주세요.",
          { duration: 4200 }
        );
      }
    });
  };

  const handleDirectSmsClick = () => {
    trackEvent("click_quote_document_sms", {
      count: basketItems.length,
      location: "self_quote_panel",
    });
    void copyQuoteTextSafe(quickShareMessage).then((copied) => {
      if (copied) {
        toast.success(
          "문자 발송을 연결합니다. 견적 내용도 함께 복사해 두었습니다.",
          { duration: 3500 }
        );
      }
    });
  };

  return (
    <>
      <section className="bg-white pt-10 pb-16 sm:pt-14 sm:pb-24">
        <div className="hb-container max-w-[1320px]">
          {/* 미니멀 센터 타이틀 */}
          <div className="text-center mb-10 sm:mb-14">
            <h1 className="text-hb-2xl sm:text-hb-3xl font-extrabold tracking-tight text-[#141A23]">
              셀프견적
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 lg:items-start">
            {/* 좌측 7컬럼: 제품 선택 */}
            <div className="lg:col-span-7">
              <div className="flex items-baseline justify-between gap-2 mb-4">
                <h2 className="text-hb-lg sm:text-hb-xl font-bold tracking-tight text-[#141A23]">
                  제품선택
                </h2>
                <span className="text-hb-xs sm:text-hb-sm text-[#737373] tabular-nums">
                  {filteredProducts.length}건
                </span>
              </div>

              {/* 대형 소분류(품목) 탭 */}
              <div
                role="tablist"
                aria-label="제품 품목 필터"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-l border-[#E2E2E2]"
              >
                {categoryTabs.map((tab) => {
                  const active = selectedCategory === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedCategory(tab.key)}
                      className={`relative min-h-[58px] sm:min-h-[64px] px-2.5 py-3 border-r border-b text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        active
                          ? "z-10 bg-white text-[#141A23] font-bold border-[#141A23] shadow-[inset_0_0_0_1px_#141A23]"
                          : "bg-[#F7F7F7] text-[#666666] font-medium border-[#E2E2E2] hover:bg-[#EFEFEF] hover:text-[#141A23]"
                      }`}
                    >
                      <span className="text-hb-sm sm:text-hb-base leading-tight whitespace-nowrap">
                        {tab.label}
                      </span>
                      <span
                        className={`text-hb-xs tabular-nums ${
                          active ? "text-[#141A23]" : "text-[#8A8A8A]"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 미니멀 검색 입력줄 */}
              <div className="relative border-b border-[#E5E5E5] mt-2">
                <Icon
                  d={ICON.search}
                  className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제품명 검색 (예: 45박스, 벽걸이, 삼성)"
                  aria-label="셀프견적 매물 검색"
                  className="w-full h-12 bg-transparent pl-8 pr-8 text-hb-sm text-[#141A23] placeholder:text-[#9A9A9A] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="검색어 지우기"
                    className="absolute right-1 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center text-[#737373] hover:text-[#141A23] cursor-pointer"
                  >
                    <Icon d={ICON.close} className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 제품 리스트: 썸네일 + 제품명 + 직각 '+' 버튼만 간결하게 */}
              <div className="max-h-[600px] overflow-y-auto divide-y divide-[#ECECEC] border-b border-[#ECECEC]">
                {filteredProducts.length === 0 ? (
                  <div className="px-4 py-20 text-center">
                    <p className="text-hb-base font-semibold text-[#141A23]">
                      조건에 맞는 제품이 없습니다.
                    </p>
                    {(searchQuery || selectedCategory !== "전체") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("전체");
                        }}
                        className="mt-3 text-hb-sm font-semibold text-[#C84312] hover:underline cursor-pointer"
                      >
                        전체 목록 보기
                      </button>
                    )}
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const inBasket = basketMap.get(product.id);
                    const firstImg = splitImages(product.image_url)[0] || null;

                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-5 py-5 pr-3 pl-1 hover:bg-[#FAFAFA] transition-colors"
                      >
                        <Link
                          href={`/${product.id}`}
                          className="h-[80px] w-[80px] sm:h-[88px] sm:w-[88px] shrink-0 overflow-hidden bg-[#F5F5F5]"
                        >
                          <SafeImg
                            src={firstImg}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        </Link>

                        <Link
                          href={`/${product.id}`}
                          className="min-w-0 flex-1 text-hb-sm sm:text-hb-base font-semibold text-[#141A23] leading-snug hover:text-[#C84312] transition-colors line-clamp-2 break-keep"
                        >
                          {product.title}
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleAddProduct(product)}
                          aria-label={
                            inBasket
                              ? `${product.title} 수량 추가 (현재 ${inBasket.quantity || 1}대)`
                              : `${product.title} 견적에 담기`
                          }
                          className={`grid h-10 w-10 shrink-0 place-items-center border transition-colors cursor-pointer ${
                            inBasket
                              ? "border-[#141A23] bg-[#141A23] text-white hover:bg-[#2C3442]"
                              : "border-[#CCCCCC] bg-white text-[#141A23] hover:border-[#141A23]"
                          }`}
                        >
                          {inBasket ? (
                            <span className="font-mono text-hb-xs font-bold tabular-nums">
                              +{inBasket.quantity || 1}
                            </span>
                          ) : (
                            <Icon d={ICON.plus} className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 우측 5컬럼: 견적 제품 + 요약 박스 (금액 계산 없음) */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="flex items-baseline justify-between gap-2 mb-4">
                <h2 className="text-hb-lg sm:text-hb-xl font-bold tracking-tight text-[#141A23]">
                  견적제품
                </h2>
                {basketItems.length > 0 && (
                  <span className="text-hb-xs sm:text-hb-sm text-[#737373] tabular-nums">
                    {summary.totalKindCount}종 · {summary.totalUnits}대
                  </span>
                )}
              </div>

              {/* 담긴 제품 리스트 박스 */}
              <div className="border border-[#E2E2E2] bg-white min-h-[260px] flex flex-col">
                {basketItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
                    <p className="text-hb-base font-semibold text-[#141A23]">
                      선택된 제품이 없습니다
                    </p>
                    <p className="mt-1.5 text-hb-sm text-[#8A8A8A] break-keep">
                      왼쪽 목록에서 + 버튼을 눌러 견적할 제품을 담아주세요.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#ECECEC] max-h-[380px] overflow-y-auto px-5">
                    {basketItems.map((item) => {
                      const qty = item.quantity || 1;
                      const sold = isProductSold(item.status);
                      return (
                        <li
                          key={item.id}
                          className="flex items-start gap-4 py-5"
                        >
                          <div className="h-[72px] w-[72px] shrink-0 overflow-hidden bg-[#F5F5F5]">
                            <SafeImg
                              src={item.imageUrl}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1 flex flex-col justify-between min-h-[72px]">
                            <div className="flex items-start justify-between gap-3">
                              <Link
                                href={`/${item.id}`}
                                className="text-hb-sm sm:text-hb-base font-semibold text-[#141A23] leading-snug hover:text-[#C84312] line-clamp-2 break-keep"
                              >
                                {sold && (
                                  <span className="mr-1.5 text-hb-xs font-bold text-[#737373]">
                                    [판매완료]
                                  </span>
                                )}
                                {item.title}
                              </Link>
                              <button
                                type="button"
                                onClick={() => removeQuoteBasketItem(item.id)}
                                aria-label={`${item.title} 삭제`}
                                className="grid h-6 w-6 shrink-0 place-items-center text-[#737373] hover:text-[#141A23] cursor-pointer"
                              >
                                <Icon d={ICON.close} className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="mt-3 flex justify-end">
                              {/* 직각 미니멀 수량 스테퍼 */}
                              <div className="inline-flex items-center border border-[#D8D8D8] bg-white">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuoteBasketItemQuantity(
                                      item.id,
                                      qty - 1
                                    )
                                  }
                                  disabled={qty <= 1}
                                  aria-label={`${item.title} 수량 감소`}
                                  className="grid h-8 w-8 place-items-center text-hb-sm text-[#141A23] hover:bg-[#F5F5F5] disabled:opacity-30 cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="min-w-[34px] text-center font-mono text-hb-sm font-semibold text-[#141A23] tabular-nums">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuoteBasketItemQuantity(
                                      item.id,
                                      qty + 1
                                    )
                                  }
                                  aria-label={`${item.title} 수량 증가`}
                                  className="grid h-8 w-8 place-items-center text-hb-sm text-[#141A23] hover:bg-[#F5F5F5] cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* 하단 요약 + 실행 박스 (직각 블랙 프레임, 금액 계산 없음) */}
              <div className="mt-5 border border-[#141A23] bg-white p-6 sm:p-7">
                <dl className="space-y-3 text-hb-sm sm:text-hb-base">
                  <div className="flex items-center justify-between">
                    <dt className="text-[#525252]">총 견적품목</dt>
                    <dd className="font-mono font-bold text-[#141A23] tabular-nums">
                      {summary.totalKindCount}종
                    </dd>
                  </div>

                  <div className="pt-3 border-t border-[#ECECEC] flex items-baseline justify-between">
                    <dt className="font-bold text-[#141A23]">총 견적수량</dt>
                    <dd className="font-mono text-hb-xl sm:text-hb-2xl font-extrabold text-[#C84312] tabular-nums">
                      {summary.totalUnits}대
                    </dd>
                  </div>
                </dl>

                {/* 메인 CTA 행: 견적서 작성 + 초기화 */}
                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={basketItems.length === 0}
                    onClick={() => {
                      trackEvent("open_quote_document", {
                        count: basketItems.length,
                        location: "self_quote_page",
                      });
                      setDocOpen(true);
                    }}
                    className="flex-1 min-h-[48px] rounded-full bg-[#C84312] px-6 text-hb-base font-bold text-white hover:bg-[#AD370D] transition-colors cursor-pointer disabled:bg-[#D4D4D4] disabled:text-white disabled:cursor-not-allowed"
                  >
                    견적서 작성
                  </button>

                  <button
                    type="button"
                    disabled={basketItems.length === 0}
                    onClick={() => {
                      clearQuoteBasket();
                      toast.success("견적 제품을 초기화했습니다.");
                    }}
                    className="min-h-[48px] rounded-full bg-[#9CA3AF] px-7 text-hb-sm font-bold text-white hover:bg-[#737373] transition-colors cursor-pointer disabled:bg-[#E5E5E5] disabled:text-[#A3A3A3] disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    초기화
                  </button>
                </div>

                {/* 보조 즉시 전송: 카톡 발송 · 문자 발송 */}
                <div className="mt-4 pt-4 border-t border-[#ECECEC] grid grid-cols-2 gap-2.5">
                  <a
                    href={STORE.kakaoChat}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDirectKakaoClick}
                    aria-disabled={basketItems.length === 0}
                    className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 border border-[#D8D8D8] bg-white px-3 text-hb-sm font-semibold text-[#141A23] hover:border-[#141A23] transition-colors whitespace-nowrap ${
                      basketItems.length === 0
                        ? "pointer-events-none opacity-40"
                        : ""
                    }`}
                  >
                    <Icon
                      d={ICON.chat}
                      className="w-4 h-4 shrink-0 text-[#B45309]"
                    />
                    <span>카톡 발송</span>
                  </a>

                  <a
                    href={smsHref(STORE.mobile, quickShareMessage)}
                    onClick={handleDirectSmsClick}
                    aria-disabled={basketItems.length === 0}
                    className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 border border-[#D8D8D8] bg-white px-3 text-hb-sm font-semibold text-[#141A23] hover:border-[#141A23] transition-colors whitespace-nowrap ${
                      basketItems.length === 0
                        ? "pointer-events-none opacity-40"
                        : ""
                    }`}
                  >
                    <Icon
                      d={ICON.phone}
                      className="w-4 h-4 shrink-0 text-[#C84312]"
                    />
                    <span>문자 발송</span>
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {docOpen && (
        <QuoteDocumentModal
          open={docOpen}
          onClose={() => setDocOpen(false)}
          items={basketItems}
        />
      )}
    </>
  );
}
