// 파일 경로: components/home/showroom-trust-showcase.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  REFURBISH_STEPS,
  type RefurbishStepId,
} from "../../lib/refurbish-process";
import {
  STORE,
  getCategoryWarrantyInfo,
  telHref,
  trackEvent,
  triggerQuickInquiry,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/icons";

const AIRCON_WARRANTY = getCategoryWarrantyInfo("에어컨/냉난방기");
const MAJOR_WARRANTY = getCategoryWarrantyInfo("냉장고");
const AIRCON_WARRANTY_TERM = AIRCON_WARRANTY.compactLabel.replace(" 무상보증", "");
const MAJOR_WARRANTY_TERM = MAJOR_WARRANTY.compactLabel.replace(" 무상보증", "");

const CONCISE_STEP_COPY: Record<
  RefurbishStepId,
  { desc: string; highlight: string }
> = {
  intake: {
    desc: "매입 현장에서 전원을 직접 켜고 작동·냉방 상태와 가스 누설 여부를 확인한 정상 제품만 들여옵니다.",
    highlight: "고장·이상 제품 입고 제외",
  },
  wash: {
    desc: "에어컨 필터·열교환기, 냉장고 선반·패킹, 세탁기 내부와 업소용 기름때까지 고압세척으로 정리합니다.",
    highlight: "설치 후 바로 사용하는 위생 상태",
  },
  precheck: {
    desc: "출고 직전 전원을 연결해 냉기 도달, 급배수·탈수, 냉방 구동 상태를 한 번 더 점검합니다.",
    highlight: "배송 전 실작동 이중 확인",
  },
  delivery: {
    desc: "매장 직영 기사가 직접 운반해 수평·기본 설치까지 마무리하고, 사용 중 문제 시 방문 A/S를 지원합니다.",
    highlight: `에어컨 ${AIRCON_WARRANTY_TERM} · 가전 ${MAJOR_WARRANTY_TERM} 보증`,
  },
};

export function ShowroomTrustShowcase({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const processGrid = (
    <div className="space-y-5">
      {/* 4단계 한눈에 보기 카드 그리드 (탭 전환 없이 스크롤로 바로 파악) */}
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {REFURBISH_STEPS.map((step, index) => {
          const copy = CONCISE_STEP_COPY[step.id];
          return (
            <li
              key={step.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-hb-border bg-white shadow-2xs"
            >
              {/* 상단 실물 사진 (사진 위 텍스트·배지 오버레이 제거) */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-hb-warm">
                <Image
                  src={step.imageSrc}
                  alt={step.imageAlt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  quality={85}
                  referrerPolicy="no-referrer"
                  className="object-cover object-center"
                />
              </div>

              {/* 하단 핵심 설명 (단계 + 제목 + 2줄 설명 + 1줄 기준) */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <span className="inline-block text-hb-xs font-bold text-hb-brand-text">
                    {index + 1}단계
                  </span>
                  <h3 className="mt-1 text-hb-base sm:text-hb-lg font-bold text-[#141A23] tracking-tight leading-snug break-keep">
                    {step.shortTitle}
                  </h3>
                  <p className="mt-2 text-hb-sm text-[#4B5563] leading-relaxed break-keep [text-wrap:pretty]">
                    {copy.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#EFEAE1] flex items-center gap-1.5 text-hb-xs font-semibold text-[#0F766E]">
                  <Icon
                    d={ICON.check}
                    className="w-3.5 h-3.5 shrink-0 text-[#0F766E]"
                  />
                  <span className="break-keep">{copy.highlight}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* 하단 1줄 안심 기준 및 빠른 행동 바 */}
      <div className="flex flex-col gap-3 rounded-2xl border border-hb-border bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-hb-xs sm:text-hb-sm text-[#334155]">
          <span className="inline-flex items-center gap-1.5 font-bold text-[#141A23]">
            <Icon
              d={ICON.shieldCheck}
              className="w-4 h-4 shrink-0 text-[#0F766E]"
            />
            <span>직영 기사 방문 A/S 보증</span>
          </span>
          <span className="text-[#CFC7BA]" aria-hidden="true">
            ·
          </span>
          <span>카드·현금영수증·전자세금계산서 발행</span>
          <span className="hidden md:inline text-[#CFC7BA]" aria-hidden="true">
            ·
          </span>
          <a
            href={telHref(STORE.tel)}
            className="font-mono font-bold text-[#141A23] hover:text-[#C84312] transition-colors tabular-nums"
          >
            직영 문의 {STORE.tel}
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              trackEvent("begin_buy_inquiry", {
                step: "process_overview",
                location: "home_showroom_trust_showcase",
              });
              triggerQuickInquiry({
                type: "구매 문의",
                productTitle: "[점검·보증 문의] 출고·A/S 기준 확인",
              });
            }}
            className="hb-btn-outline min-h-[38px] h-9 px-3.5 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap cursor-pointer"
          >
            <span>보증·재고 상담</span>
          </button>
          <Link
            href="/gallery"
            onClick={() =>
              trackEvent("click_guide_tool_action", {
                step: "gallery_cta",
                location: "home_showroom_trust_showcase",
              })
            }
            className="hb-btn-primary min-h-[38px] h-9 px-4 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap"
          >
            <span>실매물 보기</span>
            <Icon d={ICON.arrow} className="w-3.5 h-3.5 text-[#FF8A50]" />
          </Link>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return processGrid;
  }

  return (
    <section
      id="refurbish-process-section"
      aria-labelledby="refurbish-process-heading"
      className="border-y border-hb-border hb-theme-band py-12 sm:py-16"
    >
      <div className="hb-container">
        <div className="max-w-2xl mb-6 sm:mb-8">
          <h2
            id="refurbish-process-heading"
            className="text-hb-xl sm:text-hb-2xl font-bold tracking-[-0.026em] text-hb-text-primary break-keep [text-wrap:balance]"
          >
            매입부터 배송·A/S까지, 4단계로 준비합니다
          </h2>
          <p className="mt-2 text-hb-sm sm:text-hb-base text-hb-text-muted leading-relaxed break-keep [text-wrap:pretty]">
            직접 확인한 정상 제품만 들여와 고압세척과 배송 전 작동 점검을 마친 뒤 직영 기사가 설치·보증합니다.
          </p>
        </div>

        {processGrid}
      </div>
    </section>
  );
}
