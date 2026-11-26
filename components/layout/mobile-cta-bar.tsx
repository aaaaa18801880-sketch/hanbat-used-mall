"use client";

import React from "react";
import Link from "next/link";
import { ICON, Icon } from "../../lib/icons";
import {
  STORE,
  telHref,
  smsHref,
  buildProductInquirySmsBody,
  trackEvent,
  isProductSold,
  triggerQuickInquiry,
  type InquiryTypeValue,
} from "../../lib/site";
import { copyTextAndOpenKakao } from "./ui-primitives";

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
  inquiryHref?: string;
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
  if (productContext) {
    const sold = isProductSold(productContext.status);
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
        <div className="grid h-[64px] grid-cols-[1fr_1fr_1fr_1.45fr] gap-1.5 px-2.5 py-2">
          <a
            href={telHref(STORE.tel)}
            onClick={() =>
              trackEvent("click_tel_consult", {
                location: "product_mobile_bar",
              })
            }
            className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-[#E2DDD3] bg-white px-2 text-hb-xs font-bold text-[#141A23] active:scale-[0.96] transition-[background-color,transform] duration-150 whitespace-nowrap"
          >
            <Icon d={ICON.phone} className="h-3.5 w-3.5 text-[#C84312] shrink-0" />
            <span>전화</span>
          </a>
          <button
            type="button"
            onClick={() =>
              void copyTextAndOpenKakao(
                productSmsBody,
                "click_kakao_consult",
                {
                  location: "product_mobile_bar",
                  product_id: productContext.id,
                }
              )
            }
            className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-[#FEE500] px-2 text-hb-xs font-bold text-[#191600] active:scale-[0.96] active:bg-[#F2D900] transition-[background-color,transform] duration-150 whitespace-nowrap cursor-pointer"
          >
            <Icon d={ICON.chat} className="h-3.5 w-3.5 shrink-0" />
            <span>카톡</span>
          </button>
          <a
            href={smsHref(STORE.mobile, productSmsBody)}
            onClick={() =>
              trackEvent("click_sms_consult", {
                location: "product_mobile_bar",
              })
            }
            className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-[#E2DDD3] bg-white px-2 text-hb-xs font-bold text-[#141A23] active:scale-[0.96] transition-[border-color,background-color,transform] duration-150 whitespace-nowrap"
          >
            <Icon d={ICON.chat} className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
            <span>문자</span>
          </a>
          <button
            type="button"
            onClick={() => {
              trackEvent("begin_buy_inquiry", {
                location: "product_mobile_bar",
                product_id: productContext.id,
              });
              triggerQuickInquiry({
                type:
                  productContext.category === "업소용기기"
                    ? "대량·업소용 상담"
                    : "구매 문의",
                productId: productContext.id,
                productTitle: productContext.title,
                modelName: productContext.modelName || undefined,
                category: productContext.category,
              });
            }}
            className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-[#C84312] hover:bg-[#AE380D] px-2.5 text-hb-xs font-bold text-white whitespace-nowrap active:scale-[0.96] transition-[background-color,transform] duration-150 cursor-pointer shadow-xs"
          >
            <Icon d={ICON.pen} className="h-3.5 w-3.5 shrink-0" />
            <span>{sold ? "유사매물 문의" : "이 매물 문의"}</span>
          </button>
        </div>
      </div>
    );
  }

  const resolvedPrimaryLabel = primaryActionLabel || "견적·매입문의";
  const primaryBtnClass = accentPrimary
    ? "flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#C84312] hover:bg-[#AE380D] text-hb-xs font-bold text-white transition-[transform,background-color] duration-150 active:scale-[0.96] whitespace-nowrap cursor-pointer shadow-xs"
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
          <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#C84312] shrink-0" />
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
