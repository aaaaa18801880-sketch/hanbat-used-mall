// 파일 경로: components/home/home-buyback-strip.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Icon, ICON } from "../../lib/icons";
import {
  STORE,
  telHref,
  trackEvent,
  triggerQuickInquiry,
} from "../../lib/site";

const BUYBACK_SUMMARY_STEPS = [
  {
    num: "01",
    title: "사진 · 모델명 접수",
    desc: "제품 정면과 모델명·제조년월 스티커 사진 2~3장을 카카오톡 또는 간편 폼으로 보내주세요.",
    meta: "가정용 10년 이내 · 업소용 일괄 가능",
  },
  {
    num: "02",
    title: "예상 시세 및 일정 안내",
    desc: "연식과 외관·작동 상태를 확인한 뒤 매입 가능 여부와 직영 차량 방문 일정을 조율합니다.",
    meta: "식당·카페 폐업 및 이전 대량 정리 상담",
  },
  {
    num: "03",
    title: "직영 방문 수거 · 현장 정산",
    desc: "대전·세종·충청권 현장에 직영 기사가 직접 방문해 분리·수거 후 즉시 계좌 입금 또는 현금 정산합니다.",
    meta: "신규 구매 시 보상매입 차감 정산 지원",
  },
] as const;

export function HomeBuybackStrip() {
  return (
    <section
      id="buyback-summary-section"
      aria-labelledby="buyback-summary-heading"
      className="border-y border-white/10 hb-buyback-band py-10 sm:py-12 text-white"
    >
      <div className="hb-container">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span className="inline-block text-hb-xs sm:text-hb-sm font-bold text-[#FFB085]">
              가전 · 업소용 설비 방문 매입 안내
            </span>
            <h2
              id="buyback-summary-heading"
              className="mt-1.5 text-hb-xl sm:text-hb-2xl font-bold tracking-[-0.026em] text-white break-keep [text-wrap:balance]"
            >
              처분할 가전·업소용 집기, 사진 한 장으로 매입부터 철거까지
            </h2>
            <p className="mt-1.5 max-w-2xl text-hb-sm text-white/80 leading-relaxed break-keep [text-wrap:pretty]">
              이사·가전 교체는 물론 식당·카페·사무실 폐업 정리까지 {STORE.name} 직영 차량이 방문해 3단계로 정리해 드립니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/purchase"
              onClick={() =>
                trackEvent("begin_buyback_inquiry", {
                  action: "purchase_page",
                  location: "home_buyback_strip",
                })
              }
              className="hb-btn-accent min-h-[44px] h-11 px-5 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap"
            >
              <span>방문 매입 상세 신청</span>
              <Icon d={ICON.arrow} className="w-3.5 h-3.5" />
            </Link>
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("click_kakao_consult", {
                  action: "kakao_photo_quote",
                  location: "home_buyback_strip",
                })
              }
              className="hb-btn-kakao min-h-[44px] h-11 px-4 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap"
            >
              <Icon d={ICON.chat} className="w-3.5 h-3.5" />
              <span>카톡 사진 1장 견적</span>
            </a>
          </div>
        </div>

        {/* 3단계 클린 아키텍처 헤어라인 절차 그리드 */}
        <ol className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 shadow-card">
          {BUYBACK_SUMMARY_STEPS.map((item) => (
            <li
              key={item.num}
              className="hb-buyback-card flex flex-col justify-between bg-[#15263F] p-5 sm:p-6"
            >
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-hb-sm font-extrabold text-[#FFB085] tabular-nums">
                    {item.num}.
                  </span>
                  <h3 className="text-hb-base sm:text-hb-lg font-bold text-white tracking-tight break-keep">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-2 text-hb-xs sm:text-hb-sm text-white/80 leading-relaxed break-keep [text-wrap:pretty]">
                  {item.desc}
                </p>
              </div>
              <p className="mt-4 pt-3 border-t border-white/15 text-hb-xs font-semibold text-[#93C5FD] break-keep">
                {item.meta}
              </p>
            </li>
          ))}
        </ol>

        {/* 하단 직통 상담 보조 바 (Zero-Pill) */}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between text-hb-xs sm:text-hb-sm text-white/80">
          <p className="break-keep">
            <strong className="font-semibold text-white">매입 대상</strong> · 정상 작동 가정용 가전 및 업소용 냉장고·쇼케이스·제빙기·냉난방기{" "}
            <span className="text-white/25" aria-hidden="true">
              |
            </span>{" "}
            단순 고장 폐기물 대행 제외
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                trackEvent("begin_buyback_inquiry", {
                  action: "quick_sell_modal",
                  location: "home_buyback_strip",
                });
                triggerQuickInquiry({
                  type: "내 물건 팔기",
                });
              }}
              className="inline-flex items-center gap-1 font-bold text-[#FFB085] hover:text-white hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              <Icon d={ICON.camera} className="w-3.5 h-3.5" />
              <span>간편 매입 바로 접수</span>
            </button>
            <a
              href={telHref(STORE.mobile)}
              className="inline-flex items-center gap-1 font-mono font-bold text-white hover:text-[#FFB085] transition-colors tabular-nums whitespace-nowrap"
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#FFB085]" />
              <span>매입 직통 {STORE.mobile}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
