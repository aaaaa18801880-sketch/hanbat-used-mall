"use client";

import React from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ICON, Icon } from "../../lib/icons";
import {
  STORE,
  telHref,
  smsHref,
  buildProductInquirySmsBody,
  trackEvent,
  toggleQuoteBasketItem,
  formatProductPrice,
  isProductSold,
  triggerQuickInquiry,
  type InquiryTypeValue,
} from "../../lib/site";
import { useQuoteBasket } from "./ui-primitives";

export interface MobileProductCtaContext {
  id: string;
  title: string;
  category: string;
  price: number | null;
  status?: string | null;
  conditionGrade?: string | null;
  description?: string | null;
  modelName?: string | null;
  imageUrl?: string | null;
  inquiryHref: string;
}

export function MobileCtaBar({
  onInquiryClick,
  inquiryScrollTargetId,
  inquiryFallbackType = "구매 문의",
  productContext,
  primaryActionLabel,
  primaryActionHref,
  kakaoLabel = "카톡상담",
  phoneLabel = "전화상담",
  accentPrimary = false,
}: {
  onInquiryClick?: () => void;
  inquiryScrollTargetId?: string;
  inquiryFallbackType?: InquiryTypeValue;
  productContext?: MobileProductCtaContext;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  kakaoLabel?: string;
  phoneLabel?: string;
  accentPrimary?: boolean;
}) {
  const basketItems = useQuoteBasket();
  const inBasket = productContext
    ? basketItems.some((x) => x.id === productContext.id)
    : false;

  if (productContext) {
    const sold = isProductSold(productContext.status);
    const priceLabel = sold
      ? "판매완료"
      : formatProductPrice(productContext.price, productContext.category);
    const productSmsBody = buildProductInquirySmsBody({
      id: productContext.id,
      title: productContext.title,
      category: productContext.category,
      price: productContext.price,
      status: productContext.status,
      modelName: productContext.modelName,
    });

    return (
      <div
        role="region"
        aria-label="상품 상세 모바일 구매·문의 바"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E2DDD3] bg-[#FAF9F6]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgba(20,26,35,0.10)] lg:hidden"
      >
        <div className="flex h-[64px] items-center justify-between gap-2 px-3">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            {!sold && (
              <button
                type="button"
                onClick={() => {
                  const res = toggleQuoteBasketItem({
                    id: productContext.id,
                    title: productContext.title,
                    category: productContext.category,
                    price: productContext.price,
                    status: productContext.status,
                    conditionGrade: productContext.conditionGrade,
                    description: productContext.description,
                    modelName: productContext.modelName,
                    imageUrl: productContext.imageUrl,
                    quantity: 1,
                  });
                  if (res.limitReached) {
                    toast.error("견적함에는 최대 8개까지 담을 수 있습니다.");
                  } else if (res.added) {
                    toast.success("견적함에 상품을 담았습니다.");
                  } else {
                    toast("견적함에서 제외했습니다.");
                  }
                }}
                aria-pressed={inBasket}
                className={`flex h-11 shrink-0 items-center gap-1 rounded-xl border px-2.5 text-hb-xs font-bold transition-[background-color,border-color,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                  inBasket
                    ? "border-[#141A23] bg-[#141A23] text-white"
                    : "border-[#E2DDD3] bg-white text-[#141A23]"
                }`}
              >
                <Icon
                  d={inBasket ? ICON.check : ICON.plus}
                  className={`h-3.5 w-3.5 ${
                    inBasket ? "text-[#FF8A50]" : "text-[#E8521A]"
                  }`}
                />
                <span>{inBasket ? "담김" : "견적함"}</span>
              </button>
            )}
            <div className="min-w-0 flex-1">
              <span className="block truncate text-hb-xs font-semibold text-[#5C6673]">
                {productContext.category}
              </span>
              <strong
                className={`block truncate text-hb-sm font-bold leading-tight tabular-nums ${
                  sold ? "text-[#5C6673]" : "text-[#141A23]"
                }`}
              >
                {priceLabel}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", {
                  location: "product_mobile_bar",
                })
              }
              aria-label="전화 상담"
              className="grid h-11 w-11 place-items-center rounded-xl border border-[#E2DDD3] bg-white text-[#141A23] active:scale-[0.96] transition-[background-color,transform] duration-150"
            >
              <Icon d={ICON.phone} className="h-4 w-4 text-[#E8521A]" />
            </a>
            <a
              href={smsHref(STORE.mobile, productSmsBody)}
              onClick={() =>
                trackEvent("click_sms_consult", {
                  location: "product_mobile_bar",
                })
              }
              aria-label="문자 문의"
              className="hidden sm:inline-flex h-11 items-center justify-center rounded-xl border border-[#E2DDD3] bg-white px-3 text-hb-xs font-bold text-[#141A23] active:scale-[0.96] transition-[border-color,transform] duration-150"
            >
              <span>문자</span>
            </a>
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("click_kakao_consult", {
                  location: "product_mobile_bar",
                })
              }
              aria-label="카카오톡 문의"
              className="grid h-11 w-11 place-items-center rounded-xl bg-[#FEE500] text-[#191600] active:scale-[0.96] transition-transform duration-150"
            >
              <Icon d={ICON.chat} className="h-4 w-4" />
            </a>
            <Link
              href={productContext.inquiryHref}
              className="hb-btn-accent h-11 px-3.5 text-hb-xs whitespace-nowrap rounded-xl active:scale-[0.96] transition-transform duration-150"
            >
              <span>이 매물 문의</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const resolvedPrimaryLabel = primaryActionLabel || "견적·매입문의";
  const primaryBtnClass = accentPrimary
    ? "flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#E8521A] text-hb-xs font-bold text-white transition-[transform,background-color] duration-150 active:scale-[0.96] active:bg-[#C84312] whitespace-nowrap cursor-pointer shadow-xs"
    : "flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#141A23] text-hb-xs font-bold text-white transition-[transform,background-color] duration-150 active:scale-[0.96] active:bg-[#1E2736] whitespace-nowrap cursor-pointer";

  return (
    <div
      role="region"
      aria-label="모바일 빠른 상담 바"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E2DDD3] bg-[#FAF9F6]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgba(20,26,35,0.08)] lg:hidden"
    >
      <div className="grid h-[64px] grid-cols-3 gap-2 px-3 py-2">
        <a
          href={telHref(STORE.tel)}
          onClick={() =>
            trackEvent("click_tel_consult", { location: "mobile_cta_bar" })
          }
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-white text-hb-xs font-bold text-[#141A23] transition-[transform,background-color] duration-150 active:scale-[0.96] active:bg-[#F3EFE8] whitespace-nowrap"
        >
          <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#E8521A] shrink-0" />
          <span>{phoneLabel}</span>
        </a>
        <a
          href={STORE.kakaoChat}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("click_kakao_consult", { location: "mobile_cta_bar" })
          }
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#FEE500] text-hb-xs font-bold text-[#191600] transition-[transform,background-color] duration-150 active:scale-[0.96] active:bg-[#F2D900] whitespace-nowrap"
        >
          <Icon d={ICON.chat} className="w-3.5 h-3.5 shrink-0" />
          <span>{kakaoLabel}</span>
        </a>
        {primaryActionHref ? (
          primaryActionHref.startsWith("#") ? (
            <button
              type="button"
              onClick={() => {
                trackEvent("begin_buy_inquiry", {
                  location: "mobile_cta_bar",
                  target: primaryActionHref,
                });
                const target = document.getElementById(primaryActionHref.slice(1));
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className={primaryBtnClass}
            >
              <Icon
                d={ICON.arrow}
                className={`w-3.5 h-3.5 shrink-0 ${
                  accentPrimary ? "text-white" : "text-[#FF8A50]"
                }`}
              />
              <span>{resolvedPrimaryLabel}</span>
            </button>
          ) : (
            <Link
              href={primaryActionHref}
              onClick={() =>
                trackEvent("begin_buy_inquiry", {
                  location: "mobile_cta_bar",
                  target: primaryActionHref,
                })
              }
              className={primaryBtnClass}
            >
              <Icon
                d={ICON.arrow}
                className={`w-3.5 h-3.5 shrink-0 ${
                  accentPrimary ? "text-white" : "text-[#FF8A50]"
                }`}
              />
              <span>{resolvedPrimaryLabel}</span>
            </Link>
          )
        ) : (
          <button
            type="button"
            onClick={() => {
              trackEvent("begin_buy_inquiry", {
                location: "mobile_cta_bar",
              });
              if (onInquiryClick) {
                onInquiryClick();
              } else if (inquiryScrollTargetId) {
                const target = document.getElementById(inquiryScrollTargetId);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  triggerQuickInquiry({ type: inquiryFallbackType });
                }
              } else {
                triggerQuickInquiry({ type: inquiryFallbackType });
              }
            }}
            className={primaryBtnClass}
          >
            <Icon
              d={ICON.pen}
              className={`w-3.5 h-3.5 shrink-0 ${
                accentPrimary ? "text-white" : "text-[#FF8A50]"
              }`}
            />
            <span>{resolvedPrimaryLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
