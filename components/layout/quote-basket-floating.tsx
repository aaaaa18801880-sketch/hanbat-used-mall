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
  triggerQuickInquiry,
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
        aria-label="관심 매물 견적함"
        className={`fixed bottom-[calc(74px+env(safe-area-inset-bottom))] lg:bottom-6 left-2.5 sm:left-6 z-40 hb-glass-dark text-white shadow-floating transition-[width,background-color,box-shadow,transform] duration-200 ${
          expanded
            ? "w-[calc(100vw-20px)] max-w-[400px] rounded-2xl"
            : "w-auto max-w-[94vw] rounded-full"
        }`}
      >
        {expanded && (
          <div className="border-b border-white/15 p-3.5 max-h-[260px] overflow-y-auto space-y-2 bg-[#141A23] rounded-t-2xl">
            <div className="flex items-center justify-between text-hb-xs text-white/75 pb-1">
              <span className="font-semibold">
                담아둔 관심 매물 ({items.length}종 · 총 {totalUnits}대)
              </span>
              <button
                type="button"
                onClick={() => {
                  clearQuoteBasket();
                  toast.success("견적함을 비웠습니다.");
                }}
                className="text-hb-xs font-semibold text-[#FF8A50] hover:underline"
              >
                전체 비우기
              </button>
            </div>
            {items.map((item) => {
              const qty = item.quantity || 1;
              const sold = isProductSold(item.status);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2.5 py-2 text-hb-xs border border-white/10"
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/15 bg-white">
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
                      {sold && (
                        <span className="mr-1 rounded bg-white/20 px-1 py-0.5 text-hb-xs">
                          판매완료
                        </span>
                      )}
                      {item.title}
                    </Link>
                    <span className="block text-hb-xs text-white/70 tabular-nums">
                      {sold
                        ? "유사매물 재고문의"
                        : formatProductPrice(item.price, item.category)}
                    </span>
                  </div>

                  {/* 수량 조절 버튼 */}
                  <div className="flex items-center rounded border border-white/20 bg-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuoteBasketItemQuantity(item.id, qty - 1)
                      }
                      aria-label={`${item.title} 수량 감소`}
                      className="px-2 py-0.5 text-hb-xs font-bold text-white hover:bg-white/20"
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
                      className="px-2 py-0.5 text-hb-xs font-bold text-white hover:bg-white/20"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeQuoteBasketItem(item.id)}
                    aria-label={`${item.title} 견적함에서 제거`}
                    className="relative grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-red-600 hover:text-white before:absolute before:-inset-2 before:content-['']"
                  >
                    <Icon d={ICON.close} className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* 묶음 견적 즉시 상담 액션 바 */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="grid grid-cols-2 gap-2">
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
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/15 px-2.5 py-2 text-hb-xs font-bold text-white hover:bg-white/25 transition-colors cursor-pointer"
                >
                  <Icon
                    d={ICON.columns}
                    className="w-3.5 h-3.5 text-[#FF8A50]"
                  />
                  <span>나란히 비교({Math.min(3, items.length)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent("begin_buy_inquiry", {
                      use_bundle: true,
                      count: items.length,
                      location: "quote_basket_drawer",
                    });
                    setExpanded(false);
                    triggerQuickInquiry({
                      type: "구매 문의",
                      useBundle: true,
                    });
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-[#C84312] px-2.5 py-2 text-hb-xs font-bold text-white hover:bg-[#E8521A] transition-colors cursor-pointer"
                >
                  <span>한 번에 문의</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={smsHref(STORE.mobile, buildQuoteBasketSmsBody(items))}
                  onClick={() => {
                    trackEvent("click_quote_basket_sms", { count: items.length });
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-2 text-hb-xs font-bold text-white hover:bg-white/20 transition-colors"
                >
                  <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#FF8A50]" />
                  <span>문자 묶음 전송</span>
                </a>
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
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-[#FEE500] px-2.5 py-2 text-hb-xs font-bold text-[#191600] hover:bg-[#F2D900] transition-colors cursor-pointer"
                >
                  <Icon d={ICON.chat} className="w-3.5 h-3.5" />
                  <span>카톡 묶음 상담</span>
                </button>
              </div>
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
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/15 px-2.5 py-2 text-hb-xs font-bold text-white hover:bg-white/25 transition-colors cursor-pointer"
              >
                <Icon d={ICON.fileText} className="w-3.5 h-3.5 text-[#FF8A50]" />
                <span>온라인 견적서 보기 · PDF 저장</span>
              </button>
              <Link
                href="/quote"
                onClick={() => setExpanded(false)}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-hb-xs font-semibold text-white/85 hover:bg-white/15 hover:text-white transition-colors"
              >
                <span>셀프견적 페이지에서 품목 추가·편집</span>
                <Icon d={ICON.right} className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 px-3 py-1.5">
          {/* 모바일(<sm): 1개 컴팩트 트리거만 표시해 하단 2중 바 혼잡 방지 */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex sm:hidden min-h-[40px] w-full items-center justify-between gap-2 text-left text-hb-xs font-bold text-white hover:text-[#FF8A50] cursor-pointer"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#C84312] px-1.5 text-hb-xs font-bold text-white tabular-nums">
                {items.length}
              </span>
              <span className="truncate">
                견적함 {totalUnits}대 · {expanded ? "접기" : "비교/문의 열기"}
              </span>
            </span>
            <Icon
              d={expanded ? ICON.down : ICON.up}
              className="w-4 h-4 text-[#FF8A50] shrink-0"
            />
          </button>

          {/* 태블릿/데스크톱(sm+): 기존 인라인 요약 + 빠른 비교/카톡/문의 */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="hidden sm:flex min-w-0 items-center gap-2 text-left text-hb-sm font-semibold text-white hover:text-[#FF8A50] cursor-pointer"
          >
            {!expanded && (
              <div className="flex items-center -space-x-1.5 shrink-0" aria-hidden="true">
                {items.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className="h-6 w-6 overflow-hidden rounded-md border border-[#141A23] bg-white ring-1 ring-white/25"
                  >
                    <SafeImg
                      src={item.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                ))}
              </div>
            )}
            <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#C84312] px-1.5 text-hb-xs font-bold text-white tabular-nums">
              {items.length}
            </span>
            <span className="truncate">
              견적함 {totalUnits}대{" "}
              <span className="text-hb-xs font-normal text-white/75">
                {expanded ? "접기" : "목록 · 수량"}
              </span>
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                trackEvent("open_quote_document", {
                  count: items.length,
                  location: "quote_basket_floating_bar",
                });
                setExpanded(false);
                setQuoteDocOpen(true);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 h-8 text-hb-xs font-bold text-white hover:bg-white/25 whitespace-nowrap cursor-pointer"
            >
              <Icon d={ICON.fileText} className="w-3.5 h-3.5 text-[#FF8A50]" />
              <span>견적서·PDF</span>
            </button>
            <button
              type="button"
              onClick={() => {
                trackEvent("compare_products", { count: items.length });
                setCompareOpen(true);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-3 h-8 text-hb-xs font-bold text-white hover:bg-white/20 whitespace-nowrap cursor-pointer"
            >
              <Icon d={ICON.columns} className="w-3.5 h-3.5 text-[#FF8A50]" />
              <span>비교({Math.min(3, items.length)})</span>
            </button>
            <a
              href={smsHref(STORE.mobile, buildQuoteBasketSmsBody(items))}
              onClick={() => {
                trackEvent("click_quote_basket_sms", { count: items.length });
              }}
              aria-label="문자전송 - 문자로 묶음 견적 문의"
              className="hidden md:inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-2.5 h-8 text-hb-xs font-semibold text-white hover:bg-white/20 whitespace-nowrap"
            >
              <span>문자전송</span>
            </a>
            <button
              type="button"
              onClick={() =>
                void copyQuoteAndOpenKakao(
                  items,
                  "click_quote_basket_kakao",
                  "견적함 목록이 복사되었습니다! 카톡 대화창에 붙여넣기 해주세요.",
                  3500
                )
              }
              aria-label="카카오톡으로 묶음 견적 문의"
              className="grid h-8 w-8 place-items-center rounded-full bg-[#FEE500] text-[#191600] hover:bg-[#F2D900] shrink-0 cursor-pointer"
            >
              <Icon d={ICON.chat} className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                trackEvent("begin_buy_inquiry", {
                  use_bundle: true,
                  count: items.length,
                  location: "quote_basket_floating_bar",
                });
                setExpanded(false);
                triggerQuickInquiry({
                  type: "구매 문의",
                  useBundle: true,
                });
              }}
              className="hb-btn-accent h-8 px-3 text-hb-xs rounded-full shrink-0 whitespace-nowrap cursor-pointer"
            >
              <span>한 번에 문의</span>
            </button>
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
