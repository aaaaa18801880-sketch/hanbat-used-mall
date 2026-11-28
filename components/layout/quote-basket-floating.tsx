"use client";

import React, { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { ICON, Icon } from "../../lib/icons";
import {
  STORE,
  smsHref,
  buildQuoteBasketSmsBody,
  trackEvent,
  removeQuoteBasketItem,
  updateQuoteBasketItemQuantity,
  clearQuoteBasket,
  formatProductPrice,
  isProductSold,
} from "../../lib/site";
import {
  SafeImg,
  useQuoteBasket,
  copyQuoteAndOpenKakao,
} from "./ui-primitives";

const ProductCompareModal = dynamic(
  () =>
    import("../products/product-compare-modal").then(
      (m) => m.ProductCompareModal
    ),
  { ssr: false }
);

const QuoteDocumentModal = dynamic(
  () =>
    import("../quote/quote-document-modal").then(
      (m) => m.QuoteDocumentModal
    ),
  { ssr: false }
);

/* ════════════════════════════════════════════════════════════
   관심 매물 플로팅 견적함 바 (QuoteBasketFloatingBar)
   ════════════════════════════════════════════════════════════ */
export function QuoteBasketFloatingBar() {
  const pathname = usePathname();
  const items = useQuoteBasket();
  const [expanded, setExpanded] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [quoteDocOpen, setQuoteDocOpen] = useState(false);

  if (items.length === 0 || pathname === "/quote") return null;

  const totalUnits = items.reduce(
    (acc, it) => acc + (it.quantity && it.quantity > 0 ? it.quantity : 1),
    0
  );

  return (
    <>
      <aside
        aria-label="셀프견적함 빠른 이동 및 취소"
        className={`fixed bottom-[calc(74px+env(safe-area-inset-bottom))] lg:bottom-6 left-2.5 right-2.5 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 hb-glass-dark text-white shadow-floating transition-[max-width,background-color,box-shadow] duration-200 ${
          expanded
            ? "sm:w-[calc(100vw-32px)] sm:max-w-[560px] rounded-2xl"
            : "sm:w-auto sm:max-w-[calc(100vw-48px)] rounded-2xl sm:rounded-full"
        }`}
      >
        {expanded && (
          <div className="border-b border-white/15 p-4 max-h-[340px] overflow-y-auto space-y-2.5 bg-[#141A23] rounded-t-2xl">
            <div className="flex items-center justify-between gap-2 pb-1">
              <span className="text-hb-xs sm:text-hb-sm font-bold text-white">
                셀프견적에 담은 제품{" "}
                <span className="font-mono text-[#FF8A50] tabular-nums">
                  {items.length}종 · {totalUnits}대
                </span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    clearQuoteBasket();
                    setExpanded(false);
                    toast("담은 제품을 모두 취소했습니다.");
                  }}
                  className="text-hb-xs font-semibold text-white/75 hover:text-[#FF8A50] underline underline-offset-4 cursor-pointer"
                >
                  전체 취소
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  aria-label="견적함 목록 닫기"
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white cursor-pointer"
                >
                  <Icon d={ICON.close} className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const qty = item.quantity || 1;
                const sold = isProductSold(item.status);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2.5 rounded-xl bg-white/5 px-3 py-2 text-hb-xs border border-white/10"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/15 bg-white">
                      <SafeImg
                        src={item.imageUrl}
                        alt={item.title}
                        className={`h-full w-full object-cover ${
                          sold ? "grayscale opacity-65" : ""
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/${item.id}`}
                        className="block truncate font-semibold text-white hover:text-[#FF8A50]"
                      >
                        {item.title}
                      </Link>
                      <span className="block text-hb-xs text-white/70 tabular-nums">
                        {sold
                          ? "유사매물 재고문의"
                          : formatProductPrice(item.price, item.category)}
                      </span>
                    </div>

                    {/* 수량 조절 */}
                    <div className="flex items-center rounded-md border border-white/20 bg-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuoteBasketItemQuantity(item.id, qty - 1)
                        }
                        aria-label={`${item.title} 수량 감소`}
                        className="px-2 py-1 text-hb-xs font-bold text-white hover:bg-white/20 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-1.5 text-hb-xs font-bold tabular-nums">
                        {qty}대
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuoteBasketItemQuantity(item.id, qty + 1)
                        }
                        aria-label={`${item.title} 수량 증가`}
                        className="px-2 py-1 text-hb-xs font-bold text-white hover:bg-white/20 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* 직관적인 개별 취소 버튼 */}
                    <button
                      type="button"
                      onClick={() => {
                        removeQuoteBasketItem(item.id);
                        toast("견적함에서 취소했습니다.");
                      }}
                      aria-label={`${item.title} 견적 담기 취소`}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2.5 text-hb-xs font-semibold text-white/90 hover:border-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                    >
                      <Icon d={ICON.close} className="w-3 h-3" />
                      <span>취소</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 확장 서랍 하단: 셀프견적 최종 이동 + 보조 상담 */}
            <div className="pt-2.5 border-t border-white/10 space-y-2">
              <Link
                href="/quote"
                onClick={() => setExpanded(false)}
                className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-[#C84312] px-4 text-hb-sm font-bold text-white hover:bg-[#E8521A] transition-colors"
              >
                <Icon d={ICON.fileText} className="w-4 h-4" />
                <span>셀프견적으로 이동하여 견적서 작성 ({items.length}종)</span>
                <Icon d={ICON.right} className="w-4 h-4" />
              </Link>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    trackEvent("open_quote_document", {
                      count: items.length,
                      location: "quote_basket_drawer",
                    });
                    setExpanded(false);
                    setQuoteDocOpen(true);
                  }}
                  className="flex items-center justify-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-2 text-hb-xs font-semibold text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <span>PDF 바로보기</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent("compare_products", {
                      count: items.length,
                      location: "quote_basket_drawer",
                    });
                    setExpanded(false);
                    setCompareOpen(true);
                  }}
                  className="flex items-center justify-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-2 text-hb-xs font-semibold text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <span>스펙 비교({Math.min(3, items.length)})</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void copyQuoteAndOpenKakao(
                      items,
                      "click_quote_basket_kakao",
                      "견적함 목록이 복사되었습니다! 카카오톡 상담창에 붙여넣기(Ctrl+V) 해주세요.",
                      4000
                    )
                  }
                  className="flex items-center justify-center gap-1 rounded-lg bg-[#FEE500] px-2.5 py-2 text-hb-xs font-bold text-[#191600] hover:bg-[#F2D900] transition-colors cursor-pointer"
                >
                  <Icon d={ICON.chat} className="w-3.5 h-3.5" />
                  <span>카톡 상담</span>
                </button>
                <a
                  href={smsHref(STORE.mobile, buildQuoteBasketSmsBody(items))}
                  onClick={() => {
                    trackEvent("click_quote_basket_sms", { count: items.length });
                  }}
                  className="flex items-center justify-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-2 text-hb-xs font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  <span>문자 전송</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 하단 상시 도크 바 */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2">
          {/* 모바일(<sm): 좌측 목록/취소 토글 + 우측 셀프견적 이동 CTA */}
          <div className="flex sm:hidden w-full items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="flex min-h-[38px] min-w-0 flex-1 items-center gap-2 text-left text-hb-xs font-bold text-white cursor-pointer"
            >
              <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#C84312] px-1.5 font-mono text-hb-xs font-extrabold text-white tabular-nums">
                {items.length}
              </span>
              <span className="truncate">
                견적함 · {expanded ? "접기" : "목록·취소"}
              </span>
              <Icon
                d={expanded ? ICON.down : ICON.up}
                className="w-3.5 h-3.5 text-white/75 shrink-0"
              />
            </button>
            <Link
              href="/quote"
              onClick={() => setExpanded(false)}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-[#C84312] px-3.5 text-hb-xs font-bold text-white hover:bg-[#E8521A] whitespace-nowrap"
            >
              <span>셀프견적 이동</span>
              <Icon d={ICON.right} className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 태블릿/데스크톱(sm+): 담은 수량 + 인라인 즉시 취소 칩 + 셀프견적 이동 메인 CTA */}
          <div className="hidden sm:flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-2 text-left text-hb-sm font-bold text-white hover:text-[#FF8A50] transition-colors shrink-0 cursor-pointer"
            >
              <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#C84312] px-1.5 font-mono text-hb-xs font-extrabold text-white tabular-nums">
                {items.length}
              </span>
              <span className="whitespace-nowrap">
                셀프견적함{" "}
                <span className="text-hb-xs font-medium text-white/75">
                  ({totalUnits}대)
                </span>
              </span>
              <Icon
                d={expanded ? ICON.down : ICON.up}
                className="w-3.5 h-3.5 text-white/75"
              />
            </button>

            {/* 데스크톱(lg+): 서랍을 열지 않고도 1클릭 즉시 취소가 가능한 인라인 상품 칩 */}
            {!expanded && (
              <div className="hidden lg:flex items-center gap-1.5 min-w-0">
                {items.slice(0, 2).map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex max-w-[170px] items-center gap-1 rounded-full border border-white/15 bg-white/10 pl-2.5 pr-1.5 py-1 text-hb-xs text-white/90"
                  >
                    <span className="truncate">{item.title}</span>
                    <button
                      type="button"
                      onClick={() => {
                        removeQuoteBasketItem(item.id);
                        toast("견적함에서 취소했습니다.");
                      }}
                      aria-label={`${item.title} 즉시 취소`}
                      title="이 제품 담기 취소"
                      className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white/15 text-white hover:bg-red-500 transition-colors cursor-pointer"
                    >
                      <Icon d={ICON.close} className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {items.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="rounded-full bg-white/10 px-2 py-1 font-mono text-hb-xs font-bold text-white/80 hover:bg-white/20 cursor-pointer whitespace-nowrap"
                  >
                    +{items.length - 2}건
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                clearQuoteBasket();
                setExpanded(false);
                toast("담은 제품을 모두 취소했습니다.");
              }}
              className="inline-flex h-8 items-center rounded-full border border-white/20 px-3 text-hb-xs font-semibold text-white/80 hover:border-white/40 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              전체 취소
            </button>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 text-hb-xs font-semibold text-white hover:bg-white/20 transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>{expanded ? "목록 접기" : "목록 · 비교"}</span>
            </button>
            <Link
              href="/quote"
              onClick={() => setExpanded(false)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#C84312] px-4 text-hb-xs sm:text-hb-sm font-bold text-white hover:bg-[#E8521A] transition-colors whitespace-nowrap shadow-sm"
            >
              <Icon d={ICON.fileText} className="w-3.5 h-3.5" />
              <span>셀프견적으로 이동</span>
              <Icon d={ICON.right} className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {compareOpen && (
        <ProductCompareModal
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          items={items}
        />
      )}

      {quoteDocOpen && (
        <QuoteDocumentModal
          open={quoteDocOpen}
          onClose={() => setQuoteDocOpen(false)}
          items={items}
        />
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   우측 하단 미니멀 플로팅 (FloatingQuickWing — 카톡 + 맨위로 2버튼)
   ════════════════════════════════════════════════════════════ */
const getScrollThresholdServerSnapshot = () => false;
const getScrollThresholdSnapshot = () =>
  typeof window !== "undefined" && window.scrollY > 220;

export function FloatingQuickWing() {
  const containerRef = useRef<HTMLElement | null>(null);

  const subscribeScroll = (onStoreChange: () => void) => {
    if (typeof window === "undefined") return () => {};
    let wasScrolled = getScrollThresholdSnapshot();
    const onScroll = () => {
      const next = getScrollThresholdSnapshot();
      if (wasScrolled && !next && containerRef.current?.contains(document.activeElement)) {
        document.getElementById("main-content")?.focus();
      }
      if (next !== wasScrolled) {
        wasScrolled = next;
        onStoreChange();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  };

  const isScrolled = useSyncExternalStore(
    subscribeScroll,
    getScrollThresholdSnapshot,
    getScrollThresholdServerSnapshot
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <aside
      ref={containerRef}
      aria-label="빠른 상담 및 상단 이동"
      aria-hidden={!isScrolled}
      inert={!isScrolled}
      className={`fixed bottom-6 right-5 z-40 hidden lg:flex flex-col items-center gap-2.5 select-none transition-[opacity,transform] duration-200 ${
        isScrolled
          ? "opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-3"
      }`}
    >
      <a
        href={STORE.kakaoChat}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent("click_kakao_consult", {
            location: "floating_quick_wing",
          })
        }
        title="카카오톡 1:1 상담"
        aria-label="카카오톡 1:1 상담"
        className="grid h-12 w-12 place-items-center rounded-full bg-[#FEE500] text-[#191600] shadow-floating border border-[#E5CD00]/60 hover:scale-105 active:scale-95 transition-[transform,filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] focus-visible:ring-offset-2 [touch-action:manipulation]"
      >
        <Icon d={ICON.chat} className="w-5 h-5" />
      </a>

      <button
        type="button"
        onClick={scrollToTop}
        title="맨 위로 이동"
        aria-label="맨 위로 이동"
        className="grid h-11 w-11 place-items-center rounded-full border border-[#D8D1C5] bg-white/95 text-[#141A23] backdrop-blur-md shadow-card hover:border-[#141A23] hover:bg-white hover:scale-105 active:scale-95 transition-[transform,border-color,background-color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] focus-visible:ring-offset-2 [touch-action:manipulation]"
      >
        <Icon d={ICON.up} className="w-4 h-4" />
      </button>
    </aside>
  );
}
