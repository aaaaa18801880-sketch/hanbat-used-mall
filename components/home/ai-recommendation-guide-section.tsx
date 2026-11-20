// 파일 경로: components/home/ai-recommendation-guide-section.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  getCategoryWarrantyInfo,
  STORE,
  telHref,
  trackEvent,
  triggerQuickInquiry,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/icons";

const AIRCON_WARRANTY = getCategoryWarrantyInfo("에어컨/냉난방기");
const MAJOR_WARRANTY = getCategoryWarrantyInfo("냉장고");

const COMPARISON_ROWS = [
  {
    criteria: "고장 시 사후 A/S",
    personal: "개인 거래 특성상 구매 후 고장 시 수리비 전액 본인 부담",
    hanbat: `에어컨 ${AIRCON_WARRANTY.compactLabel} · 주요가전 ${MAJOR_WARRANTY.compactLabel} 지원`,
    highlight: true,
  },
  {
    criteria: "세척 · 작동 점검",
    personal: "겉면 위주 청소, 가스 누설이나 내부 작동 상태 확인 어려움",
    hanbat: "현장 작동 확인 · 고압세척 정리 · 배송 전 작동 점검 후 출고",
    highlight: false,
  },
  {
    criteria: "운반 · 수평 · 설치",
    personal: "용달 차량 별도 섭외 및 무거운 가전 운반·설치 직접 해결",
    hanbat: "매장 직영 기사 직접 운반 및 수평·급배수 기본 설치 지원",
    highlight: false,
  },
  {
    criteria: "결제 수단 · 증빙",
    personal: "계좌이체 위주, 사업자 비용처리 증빙 발행 불가",
    hanbat: "신용카드 · 현금영수증 · 사업자 전자세금계산서 정식 발행",
    highlight: false,
  },
  {
    criteria: "기존 가전 처분",
    personal: "폐기물 스티커 구매 후 별도 배출하거나 따로 처분 필요",
    hanbat: "배송 당일 기존 가전 동시 수거 및 보상매입 차감 정산 가능",
    highlight: false,
  },
] as const;

export function AiRecommendationGuideSection({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const comparisonBoard = (
    <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-stretch">
      {/* 중앙 VS 배지 (데스크톱 시각 앵커) */}
      <div
        aria-hidden="true"
        className="hidden lg:grid absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 h-11 w-11 place-items-center rounded-full border-2 border-[#E2DDD3] bg-white font-mono text-hb-xs font-extrabold text-[#141A23] shadow-sm"
      >
        VS
      </div>

      {/* 좌측 카드: 일반 개인 직거래 (중립·객관적 톤) */}
      <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E2E6EC] bg-[#F7F8FA]">
        <div>
          <div className="border-b border-[#E2E6EC] bg-[#EEF1F5] px-5 py-4 sm:px-6">
            <span className="inline-block rounded-md bg-white/80 border border-[#CBD2DC] px-2 py-0.5 text-hb-xs font-bold text-[#475569]">
              일반 중고거래 앱 · 개인 간 거래
            </span>
            <h3 className="mt-2 text-hb-lg font-bold text-[#334155] tracking-tight">
              개인 직거래 시 자주 생기는 부담
            </h3>
            <p className="mt-0.5 text-hb-xs text-[#64748B]">
              초기 가격은 저렴해 보여도 운반·설치·고장 리스크를 직접 감당해야 합니다.
            </p>
          </div>

          <ul className="divide-y divide-[#E2E6EC] px-5 sm:px-6">
            {COMPARISON_ROWS.map((row) => (
              <li key={row.criteria} className="py-2.5 sm:py-3">
                <span className="block text-hb-xs font-bold text-[#64748B]">
                  {row.criteria}
                </span>
                <div className="mt-1 flex items-start gap-2 text-hb-xs sm:text-hb-sm text-[#475569] leading-relaxed break-keep">
                  <Icon
                    d={ICON.close}
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#94A3B8]"
                  />
                  <span>{row.personal}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-[#E2E6EC] bg-[#F1F3F6]/70 px-5 py-3.5 sm:px-6">
          <p className="text-hb-xs font-medium text-[#64748B]">
            소형 단품이나 직접 차량 운반이 가능한 경우에만 유리할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 우측 카드: 한밭중고전자 직영 매장 (시각적 앵커링 강조 카드) */}
      <div className="flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-[#141A23] bg-white shadow-card">
        <div>
          <div className="border-b border-[#263040] bg-[#141A23] px-5 py-4 sm:px-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8521A] px-2.5 py-0.5 text-hb-xs font-bold text-white">
                <Icon d={ICON.shieldCheck} className="h-3.5 w-3.5" />
                <span>직영 책임 판매 · SINCE {STORE.since}</span>
              </span>
              <span className="font-mono text-hb-xs font-semibold text-[#5EEAD4] tabular-nums">
                {STORE.jibunAddress} 쇼룸
              </span>
            </div>
            <h3 className="mt-2 text-hb-lg sm:text-hb-xl font-bold text-white tracking-tight">
              {STORE.name} 직영 매장이 편한 이유
            </h3>
            <p className="mt-0.5 text-hb-xs text-white/75">
              세척·작동 점검부터 직영 배송·설치·사후 A/S까지 한 번에 해결합니다.
            </p>
          </div>

          <ul className="divide-y divide-[#E2DDD3] px-5 sm:px-6">
            {COMPARISON_ROWS.map((row) => (
              <li
                key={row.criteria}
                className={`py-2.5 sm:py-3 ${
                  row.highlight ? "-mx-5 px-5 sm:-mx-6 sm:px-6 bg-[#FFF9F5]" : ""
                }`}
              >
                <span className="block text-hb-xs font-bold text-[#C84312]">
                  {row.criteria}
                </span>
                <div className="mt-1 flex items-start gap-2 text-hb-xs sm:text-hb-sm font-semibold text-[#141A23] leading-relaxed break-keep">
                  <Icon
                    d={ICON.check}
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]"
                  />
                  <span>{row.hanbat}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 카드 하단 즉시 전환 액션 바 */}
        <div className="border-t border-[#E2DDD3] bg-[#FAF9F6] px-5 py-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/gallery"
              className="hb-btn-primary min-h-[40px] h-10 px-4 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap"
            >
              <span>전시 실매물 보기</span>
              <Icon d={ICON.arrow} className="h-3.5 w-3.5 text-[#FF8A50]" />
            </Link>
            <button
              type="button"
              onClick={() => {
                trackEvent("begin_buy_inquiry", {
                  location: "home_vs_comparison_card",
                });
                triggerQuickInquiry({ type: "구매 문의" });
              }}
              className="hb-btn-outline min-h-[40px] h-10 px-3.5 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap cursor-pointer"
            >
              <Icon d={ICON.chat} className="h-3.5 w-3.5 text-[#C84312]" />
              <span>1:1 간편 문의</span>
            </button>
          </div>

          <a
            href={telHref(STORE.tel)}
            className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#141A23] hover:text-[#C84312] font-mono tabular-nums whitespace-nowrap"
          >
            <Icon d={ICON.phone} className="h-3.5 w-3.5 text-[#C84312]" />
            <span>{STORE.tel}</span>
          </a>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return comparisonBoard;
  }

  return (
    <section
      id="buying-guide-section"
      aria-labelledby="buying-guide-title"
      className="border-b border-[#E2E6EC] bg-white py-7 sm:py-9"
    >
      <div className="hb-container">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-5">
          <div>
            <span className="hb-eyebrow">구매 전 안심 비교</span>
            <h2
              id="buying-guide-title"
              className="mt-1.5 text-hb-xl sm:text-hb-2xl font-bold tracking-[-0.026em] text-[#141A23] break-keep [text-wrap:balance]"
            >
              개인 직거래 vs {STORE.name} 직영 매장
            </h2>
            <p className="mt-1.5 text-hb-sm text-[#475569] break-keep">
              가격표에 보이지 않는 세척·작동 점검, 운반·설치, 무상 A/S 보증 차이를 한눈에 비교해 보세요.
            </p>
          </div>
        </div>

        {comparisonBoard}
      </div>
    </section>
  );
}
