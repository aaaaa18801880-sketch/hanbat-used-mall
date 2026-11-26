// 파일 경로: components/home/home-intent-router.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Icon, ICON } from "../../lib/icons";
import {
  STORE,
  getCategoryWarrantyInfo,
  telHref,
  trackEvent,
  triggerQuickInquiry,
} from "../../lib/site";

const BUYBACK_STEPS = [
  { num: "01", title: "사진·모델명 접수", desc: "정면·명판 사진 2~3장 전송" },
  { num: "02", title: "예상 시세·일정 안내", desc: "연식·상태 확인 후 방문 배차" },
  { num: "03", title: "직영 수거·현장 정산", desc: "분리·수거 후 즉시 계좌 입금" },
] as const;

export function HomeIntentRouter({
  sellingCount,
  bizCount,
}: {
  sellingCount: number;
  bizCount: number;
}) {
  const airconWarranty = getCategoryWarrantyInfo("에어컨/냉난방기").compactLabel;
  const majorWarranty = getCategoryWarrantyInfo("냉장고").compactLabel;

  return (
    <section
      id="buyback-summary-section"
      aria-labelledby="intent-router-heading"
      className="border-b border-[#E2DDD3] bg-[#FAF9F6] py-5 sm:py-7"
    >
      <div className="hb-container">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between mb-3.5">
          <h2
            id="intent-router-heading"
            className="text-hb-base sm:text-hb-lg font-bold tracking-tight text-[#141A23] break-keep"
          >
            방문 목적에 맞게 바로 시작하세요
          </h2>
          <p className="text-hb-xs text-[#64748B] break-keep">
            가전·폐업 설비 매입부터 실매물 구매, 업소 창업 세트 상담까지 바로 이동합니다.
          </p>
        </div>

        {/* 3열 목적 분기 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-stretch">
          {/* 1. 안 쓰는 가전 팔러 왔어요 (매입 최우선 강조 카드) */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#141A23] bg-[#141A23] p-5 text-white shadow-card">
            <div>
              <span className="block font-mono text-hb-xs font-bold text-[#FFB085]">
                가정용 · 업소용 최다 문의
              </span>
              <h3 className="mt-1 text-hb-lg font-bold tracking-tight text-white break-keep">
                안 쓰는 가전 팔러 왔어요
              </h3>
              <p className="mt-1.5 text-hb-xs sm:text-hb-sm text-white/80 leading-relaxed break-keep">
                제조 10년 이내 가정용 가전 및 식당·카페 폐업 집기 직영 수거·현장 정산
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/15 space-y-2.5">
              <Link
                href="/purchase#purchase-form"
                onClick={() =>
                  trackEvent("begin_buyback_inquiry", {
                    action: "purchase_page",
                    location: "home_intent_router",
                  })
                }
                className="hb-btn-accent w-full min-h-[44px] h-11 px-4 text-hb-xs sm:text-hb-sm font-bold justify-between"
              >
                <span>30초 매입 견적 신청</span>
                <Icon d={ICON.arrow} className="w-4 h-4 shrink-0" />
              </Link>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-hb-xs text-white/80">
                <button
                  type="button"
                  onClick={() => {
                    trackEvent("begin_buyback_inquiry", {
                      action: "quick_sell_modal",
                      location: "home_intent_router",
                    });
                    triggerQuickInquiry({ type: "내 물건 팔기" });
                  }}
                  className="font-semibold text-[#FFB085] hover:text-white hover:underline underline-offset-4 cursor-pointer"
                >
                  간편 매입 접수
                </button>
                <span className="text-white/30" aria-hidden="true">
                  ·
                </span>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent("click_kakao_consult", {
                      action: "kakao_photo_quote",
                      location: "home_intent_router",
                    })
                  }
                  className="font-semibold text-white/85 hover:text-[#FEE500] hover:underline underline-offset-4"
                >
                  카톡 사진 견적
                </a>
              </div>
            </div>
          </div>

          {/* 2. 가전 · 설비 사러 왔어요 (실매물 구매) */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#E2DDD3] bg-white p-5 text-[#141A23] shadow-2xs">
            <div>
              <span className="block font-mono text-hb-xs font-bold text-[#0F766E] tabular-nums">
                전시장 실물{sellingCount > 0 ? ` · ${sellingCount}대 판매중` : ""}
              </span>
              <h3 className="mt-1 text-hb-lg font-bold tracking-tight text-[#141A23] break-keep">
                가전 · 설비 사러 왔어요
              </h3>
              <p className="mt-1.5 text-hb-xs sm:text-hb-sm text-[#475569] leading-relaxed break-keep">
                고압세척·작동 점검 후 에어컨 {airconWarranty} · 주요가전 {majorWarranty}
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-[#E2DDD3] space-y-2.5">
              <Link
                href="/gallery"
                onClick={() =>
                  trackEvent("begin_buy_inquiry", {
                    action: "gallery_cta",
                    location: "home_intent_router",
                  })
                }
                className="hb-btn-primary w-full min-h-[44px] h-11 px-4 text-hb-xs sm:text-hb-sm font-bold justify-between"
              >
                <span>실매물 갤러리 보기</span>
                <Icon d={ICON.arrow} className="w-4 h-4 text-[#FFB085] shrink-0" />
              </Link>

              <div className="flex items-center text-hb-xs">
                <a
                  href="#category-section"
                  className="font-semibold text-[#334155] hover:text-[#C84312] hover:underline underline-offset-4"
                >
                  아래에서 품목별 바로 보기
                </a>
              </div>
            </div>
          </div>

          {/* 3. 업소 · 창업 세트 문의 */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#E2DDD3] bg-white p-5 text-[#141A23] shadow-2xs">
            <div>
              <span className="block font-mono text-hb-xs font-bold text-[#C84312] tabular-nums">
                식당 · 카페 · 사무실{bizCount > 0 ? ` · 업소용 ${bizCount}대` : ""}
              </span>
              <h3 className="mt-1 text-hb-lg font-bold tracking-tight text-[#141A23] break-keep">
                업소 · 창업 세트 문의
              </h3>
              <p className="mt-1.5 text-hb-xs sm:text-hb-sm text-[#475569] leading-relaxed break-keep">
                업소용 냉장고·쇼케이스·제빙기·냉난방기 일괄 구성 및 전자세금계산서 발행
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-[#E2DDD3] space-y-2.5">
              <Link
                href="/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0"
                onClick={() =>
                  trackEvent("begin_bulk_inquiry", {
                    action: "biz_set_gallery",
                    location: "home_intent_router",
                  })
                }
                className="hb-btn-outline w-full min-h-[44px] h-11 px-4 text-hb-xs sm:text-hb-sm font-bold justify-between bg-white"
              >
                <span>업소용 설비 보기</span>
                <Icon d={ICON.arrow} className="w-4 h-4 text-[#C84312] shrink-0" />
              </Link>

              <div className="flex items-center text-hb-xs">
                <button
                  type="button"
                  onClick={() => {
                    trackEvent("begin_buy_inquiry", {
                      action: "biz_set_modal",
                      location: "home_intent_router",
                    });
                    triggerQuickInquiry({ type: "대량·업소용 상담" });
                  }}
                  className="font-semibold text-[#C84312] hover:text-[#141A23] hover:underline underline-offset-4 cursor-pointer"
                >
                  창업 세트 1:1 상담
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 1줄 매입 3단계 헤어라인 스트립 */}
        <div className="mt-4 border-t border-[#E2DDD3] pt-3.5 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between text-hb-xs">
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-5 flex-1">
            {BUYBACK_STEPS.map((step) => (
              <li key={step.num} className="flex items-baseline gap-1.5 min-w-0">
                <span className="font-mono font-bold text-[#C84312] tabular-nums shrink-0">
                  {step.num}.
                </span>
                <span className="font-bold text-[#141A23] shrink-0">
                  {step.title}
                </span>
                <span className="text-[#64748B] truncate">— {step.desc}</span>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 shrink-0 text-[#475569]">
            <span>단순 고장 폐기물 제외</span>
            <span className="text-[#CFC7BA]" aria-hidden="true">
              |
            </span>
            <a
              href={telHref(STORE.mobile)}
              className="inline-flex items-center gap-1 font-mono font-bold text-[#141A23] hover:text-[#C84312] tabular-nums whitespace-nowrap"
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#C84312]" />
              <span>매입 직통 {STORE.mobile}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
