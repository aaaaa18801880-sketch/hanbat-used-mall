"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { ICON, Icon } from "../../lib/icons";
import {
  STORE,
  telHref,
  smsHref,
  buildQuoteBasketSmsBody,
  trackEvent,
  removeQuoteBasketItem,
  updateQuoteBasketItemQuantity,
  clearQuoteBasket,
  formatProductPrice,
  isProductSold,
  triggerQuickInquiry,
  type InquiryTypeValue,
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

/* ════════════════════════════════════════════════════════════
   관심 매물 플로팅 견적함 바 (QuoteBasketFloatingBar)
   ════════════════════════════════════════════════════════════ */
export function QuoteBasketFloatingBar() {
  const items = useQuoteBasket();
  const [expanded, setExpanded] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  if (items.length === 0) return null;

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
              <Link
                href="/inquiry?write=1&bundle=1"
                onClick={() => setExpanded(false)}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-hb-xs font-semibold text-white/85 hover:bg-white/15 hover:text-white transition-colors"
              >
                <span>상세 견적서 게시판에서 작성하기</span>
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
                trackEvent("compare_products", { count: items.length });
                setCompareOpen(true);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 h-8 text-hb-xs font-bold text-white hover:bg-white/25 whitespace-nowrap cursor-pointer"
            >
              <Icon d={ICON.columns} className="w-3.5 h-3.5 text-[#FF8A50]" />
              <span>나란히 비교({Math.min(3, items.length)})</span>
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
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   우측 슬림 아이콘 독 (FloatingQuickWing — 1520px+ 퀵 독)
   ════════════════════════════════════════════════════════════ */
export function FloatingQuickWing() {
  const pathname = usePathname();
  const isPurchasePage = Boolean(pathname?.startsWith("/purchase"));
  const basketCount = useQuoteBasket().length;

  const handleInquiryClick = (
    type: InquiryTypeValue = "구매 문의",
    useBundle = false
  ) => {
    const eventName =
      type === "내 물건 팔기"
        ? "begin_buyback_inquiry"
        : type === "대량·업소용 상담"
          ? "begin_bulk_inquiry"
          : "begin_buy_inquiry";
    trackEvent(eventName, {
      category: type,
      use_bundle: useBundle,
      location: "floating_quick_wing",
    });
    triggerQuickInquiry({ type, useBundle });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <aside
      aria-label="빠른 상담 바로가기"
      className="fixed left-[calc(50%+672px)] top-1/2 -translate-y-1/2 z-40 hidden min-[1520px]:flex flex-col items-center select-none"
    >
      <div className="w-[72px] rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#D8D1C5]/90 ring-1 ring-[#141A23]/5 shadow-[0_14px_38px_rgba(20,26,35,0.12)] p-2 flex flex-col items-center gap-1.5">
        <a
          href={telHref(STORE.tel)}
          onClick={() =>
            trackEvent("click_tel_consult", {
              location: "floating_quick_wing_tel",
            })
          }
          title={`대표전화 ${STORE.tel}`}
          className="group w-full py-2 flex flex-col items-center justify-center gap-1.5 rounded-2xl text-[#141A23] hover:bg-[#FFF4EE] hover:text-[#C84312] transition-[background-color,color,transform] duration-150 active:scale-95"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#FADCD0] bg-[#FFF4EE] text-[#C84312] group-hover:bg-[#C84312] group-hover:text-white transition-colors">
            <Icon d={ICON.phone} className="w-5 h-5" />
          </span>
          <span className="text-hb-xs font-bold leading-none">전화</span>
        </a>

        <a
          href={STORE.kakaoChat}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("click_kakao_consult", {
              location: "floating_quick_wing",
            })
          }
          title="카카오톡 상담"
          className="group w-full py-2 flex flex-col items-center justify-center gap-1.5 rounded-2xl text-[#141A23] hover:bg-[#FEFCE8] transition-[background-color,color,transform] duration-150 active:scale-95"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FEE500] text-[#191600] shadow-2xs group-hover:brightness-95 transition">
            <Icon d={ICON.chat} className="w-5 h-5" />
          </span>
          <span className="text-hb-xs font-bold leading-none">카톡</span>
        </a>

        <button
          type="button"
          onClick={() =>
            handleInquiryClick(
              isPurchasePage ? "내 물건 팔기" : "구매 문의",
              !isPurchasePage && basketCount > 0
            )
          }
          title={
            isPurchasePage
              ? "가전 방문 매입 간편 견적"
              : basketCount > 0
              ? `담아둔 매물 ${basketCount}종 묶음 견적 문의`
              : "견적 문의"
          }
          className="group relative w-full py-2 flex flex-col items-center justify-center gap-1.5 rounded-2xl text-[#141A23] hover:bg-[#F2EEE7] transition-[background-color,color,transform] duration-150 active:scale-95 cursor-pointer"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#141A23] text-white group-hover:bg-[#C84312] transition-colors">
            <Icon d={ICON.pen} className="w-4 h-4" />
          </span>
          <span className="text-hb-xs font-bold leading-none">견적</span>
          {basketCount > 0 && (
            <span className="absolute right-1.5 top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C84312] px-1 text-hb-xs font-bold text-white tabular-nums shadow-xs">
              {basketCount}
            </span>
          )}
        </button>

        <div className="w-10 h-[1px] bg-[#E2DDD3] my-0.5" aria-hidden="true" />

        <button
          type="button"
          onClick={scrollToTop}
          title="맨 위로 이동"
          className="w-full py-2 flex flex-col items-center justify-center gap-1 rounded-2xl text-[#64748B] hover:bg-[#F2EEE7] hover:text-[#141A23] transition-[background-color,color,transform] duration-150 active:scale-95 cursor-pointer"
        >
          <Icon d={ICON.up} className="w-4 h-4" />
          <span className="text-hb-xs font-bold leading-none">위로</span>
        </button>
      </div>
    </aside>
  );
}
