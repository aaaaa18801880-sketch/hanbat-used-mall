// 파일 경로: components/home/showroom-trust-showcase.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  REFURBISH_STEPS,
  getAdjacentRefurbishStepId,
  getRefurbishStepById,
  type RefurbishMetric,
  type RefurbishStepId,
} from "../../lib/refurbish-process";
import {
  STORE,
  telHref,
  trackEvent,
  triggerQuickInquiry,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/icons";
import { HomeNoticeGuidesStrip } from "../products/notice-guide-banner";

function getMetricValueToneClass(tone?: RefurbishMetric["tone"]): string {
  switch (tone) {
    case "brand":
      return "text-[#C84312]";
    case "teal":
      return "text-[#0F766E]";
    case "cyan":
      return "text-[#0369A1]";
    default:
      return "text-[#141A23]";
  }
}

export function ShowroomTrustShowcase() {
  const [activeId, setActiveId] = useState<RefurbishStepId>(
    REFURBISH_STEPS[0].id
  );

  const activeStep = getRefurbishStepById(activeId);
  const activeIndex = REFURBISH_STEPS.findIndex((s) => s.id === activeStep.id);

  const selectStep = (nextId: RefurbishStepId) => {
    setActiveId(nextId);
    trackEvent("click_guide_tool_action", {
      step: nextId,
      location: "home_showroom_trust_showcase",
    });
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = getAdjacentRefurbishStepId(activeId, 1);
      selectStep(next);
      document.getElementById(`refurbish-tab-${next}`)?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = getAdjacentRefurbishStepId(activeId, -1);
      selectStep(prev);
      document.getElementById(`refurbish-tab-${prev}`)?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      const first = REFURBISH_STEPS[0].id;
      selectStep(first);
      document.getElementById(`refurbish-tab-${first}`)?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const last = REFURBISH_STEPS[REFURBISH_STEPS.length - 1].id;
      selectStep(last);
      document.getElementById(`refurbish-tab-${last}`)?.focus();
    }
  };

  return (
    <section
      id="refurbish-process-section"
      aria-labelledby="refurbish-process-heading"
      className="border-y border-[#E2DDD3] bg-[#FAF9F6] py-7 sm:py-9"
    >
      <div className="hb-container">
        {/* 상단 헤더: 섹션 타이틀 + 현재 단계 카운터 및 좌우 이동 컨트롤 */}
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between mb-4 sm:mb-5">
          <div className="min-w-0">
            <span className="hb-eyebrow">
              {STORE.name} 현장 확인 · 세척 · 출고 절차 안내
            </span>
            <h2
              id="refurbish-process-heading"
              className="mt-1.5 text-hb-xl sm:text-hb-2xl font-bold tracking-[-0.026em] text-[#141A23] break-keep [text-wrap:balance]"
            >
              매입 현장 확인부터 고압세척·배송 전 작동 점검까지, 4단계로 준비합니다
            </h2>
            <p className="mt-1.5 max-w-2xl text-hb-sm text-[#475569] leading-relaxed break-keep [text-wrap:pretty]">
              매입 현장에서 직접 작동 상태를 확인해 정상 제품만 들여오고, 고압세척과 배송 전 작동 점검을 거쳐 직영 기사가 설치·보증합니다.
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <div className="text-left sm:text-right">
              <span className="block text-hb-xs font-semibold text-[#475569]">
                현재 확인 중인 단계
              </span>
              <strong className="font-mono text-hb-sm font-bold text-[#141A23] tabular-nums">
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(REFURBISH_STEPS.length).padStart(2, "0")} ·{" "}
                {activeStep.shortTitle}
              </strong>
            </div>

            <div className="inline-flex items-center overflow-hidden rounded-xl border border-[#CBD2DC] bg-white shadow-2xs">
              <button
                type="button"
                onClick={() =>
                  selectStep(getAdjacentRefurbishStepId(activeId, -1))
                }
                aria-label="이전 단계 보기"
                className="grid h-10 w-10 place-items-center text-[#141A23] hover:bg-[#F7F8FA] active:bg-[#F1F3F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#141A23] transition-colors cursor-pointer"
              >
                <Icon d={ICON.left} className="w-4 h-4" />
              </button>
              <span
                className="h-5 w-px bg-[#E2DDD3]"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() =>
                  selectStep(getAdjacentRefurbishStepId(activeId, 1))
                }
                aria-label="다음 단계 보기"
                className="grid h-10 w-10 place-items-center text-[#141A23] hover:bg-[#F7F8FA] active:bg-[#F1F3F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#141A23] transition-colors cursor-pointer"
              >
                <Icon d={ICON.right} className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 스위스 벤토 1px 헤어라인 프레임 (gap-px bg-[#E2DDD3]) */}
        <div className="overflow-hidden rounded-2xl border border-[#E2DDD3] bg-[#E2DDD3] shadow-2xs">
          {/* 1) 4단계 인터랙티브 탭 바 */}
          <div
            role="tablist"
            aria-label="입고·세척·작동점검·직배송 4단계 선택"
            onKeyDown={handleTabKeyDown}
            className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#E2DDD3]"
          >
            {REFURBISH_STEPS.map((step) => {
              const isSelected = step.id === activeStep.id;
              return (
                <button
                  key={step.id}
                  id={`refurbish-tab-${step.id}`}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  aria-controls={`refurbish-panel-${step.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => selectStep(step.id)}
                  className={`group relative flex min-h-[60px] flex-col justify-between px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#141A23] cursor-pointer ${
                    isSelected
                      ? "bg-[#141A23] text-white"
                      : "bg-white text-[#334155] hover:bg-[#FAF9F6] hover:text-[#141A23]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span
                      className={`font-mono text-hb-xs font-bold tabular-nums leading-none ${
                        isSelected
                          ? "text-[#FF8A50]"
                          : "text-[#C84312] group-hover:text-[#141A23]"
                      }`}
                    >
                      {step.stepNumber}
                    </span>
                    <Icon
                      d={isSelected ? ICON.check : ICON.right}
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                        isSelected
                          ? "text-[#5EEAD4]"
                          : "text-[#94A3B8] group-hover:text-[#141A23] group-hover:translate-x-0.5"
                      }`}
                    />
                  </div>
                  <span
                    className={`mt-1.5 block text-hb-xs sm:text-hb-sm font-bold tracking-tight truncate ${
                      isSelected ? "text-white" : "text-[#141A23]"
                    }`}
                  >
                    {step.shortTitle}
                  </span>

                  <span
                    className={`absolute inset-x-0 bottom-0 h-1 bg-[#E8521A] transition-opacity duration-150 ${
                      isSelected ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          {/* 2) 선택된 단계의 스위스 벤토 상세 패널 */}
          <div
            id={`refurbish-panel-${activeStep.id}`}
            role="tabpanel"
            aria-labelledby={`refurbish-tab-${activeStep.id}`}
            className="mt-px grid grid-cols-1 lg:grid-cols-12 gap-px bg-[#E2DDD3]"
          >
            {/* 좌측 5열: 실물 현장 사진 + 핵심 원칙 요약 */}
            <div className="lg:col-span-5 flex flex-col bg-white">
              <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[260px] lg:flex-1 w-full overflow-hidden bg-[#EFECE4]">
                {REFURBISH_STEPS.map((step) => {
                  const isActiveImage = step.id === activeStep.id;
                  return (
                    <Image
                      key={step.id}
                      src={step.imageSrc}
                      alt={step.imageAlt}
                      fill
                      loading="eager"
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      quality={85}
                      referrerPolicy="no-referrer"
                      aria-hidden={!isActiveImage}
                      className={`object-cover object-center transition-opacity duration-200 ${
                        isActiveImage
                          ? "opacity-100"
                          : "pointer-events-none opacity-0"
                      }`}
                    />
                  );
                })}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141A23]/90 via-[#141A23]/30 to-transparent"
                  aria-hidden="true"
                />

                {/* 좌상단 단계 인덱스 */}
                <div className="absolute top-3.5 left-3.5 z-10 inline-flex items-center gap-2 rounded-lg bg-[#141A23]/90 px-3 py-1.5 backdrop-blur-md border border-white/15">
                  <span className="font-mono text-hb-xs font-bold text-[#FF8A50] tabular-nums">
                    STEP {activeStep.stepNumber}
                  </span>
                  <span className="h-3 w-px bg-white/25" aria-hidden="true" />
                  <span className="text-hb-xs font-semibold text-white">
                    {activeStep.roleLabel}
                  </span>
                </div>

                {/* 하단 실물 캡션 & 중점 확인 항목 */}
                <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 text-white">
                  <p className="text-hb-xs font-semibold text-[#5EEAD4]">
                    중점 확인 · {activeStep.focusTag}
                  </p>
                  <p className="mt-1 text-hb-sm font-bold leading-snug text-white break-keep">
                    {activeStep.imageCaption}
                  </p>
                </div>
              </div>

              {/* 매장 출고 기준 스트립 */}
              <div className="border-t border-[#E2DDD3] bg-[#FAF9F6] px-4 py-3.5 sm:px-5 sm:py-4">
                <div className="flex items-start gap-2.5">
                  <Icon
                    d={ICON.shieldCheck}
                    className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5"
                  />
                  <div className="min-w-0">
                    <span className="block text-hb-xs font-bold text-[#0F766E]">
                      {activeStep.warrantyScopeLabel}
                    </span>
                    <p className="mt-0.5 text-hb-xs text-[#334155] leading-relaxed break-keep">
                      {activeStep.warrantyScopeDetail}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 7열: 단계 헤드라인 + 3열 핵심 확인 요약 + 체크리스트 + 액션 바 */}
            <div className="lg:col-span-7 grid grid-cols-1 gap-px bg-[#E2DDD3]">
              {/* 상단 단계 요약 셀 */}
              <div className="bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-hb-xs font-semibold text-[#475569]">
                  <span className="font-mono font-bold text-[#C84312] tabular-nums">
                    {activeStep.tabLabel}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{STORE.name} 현장 기준</span>
                </div>
                <h3 className="mt-2 text-hb-lg sm:text-hb-xl font-bold text-[#141A23] tracking-tight leading-snug break-keep [text-wrap:balance]">
                  {activeStep.headline}
                </h3>
                <p className="mt-2 text-hb-sm text-[#475569] leading-relaxed break-keep [text-wrap:pretty]">
                  {activeStep.summary}
                </p>
              </div>

              {/* 중단 3열 핵심 요약 셀 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#E2DDD3]">
                {activeStep.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex flex-col justify-between bg-[#FAF9F6] px-4 py-3.5 sm:px-5 sm:py-4"
                  >
                    <span className="text-hb-xs font-semibold text-[#475569]">
                      {metric.label}
                    </span>
                    <strong
                      className={`mt-1.5 block text-hb-base sm:text-hb-lg font-extrabold tracking-tight tabular-nums ${getMetricValueToneClass(
                        metric.tone
                      )}`}
                    >
                      {metric.value}
                    </strong>
                    <span className="mt-1 block text-hb-xs text-[#475569] leading-snug break-keep">
                      {metric.note}
                    </span>
                  </div>
                ))}
              </div>

              {/* 하단 실제 점검 항목 & 빠른 행동 셀 */}
              <div className="bg-white p-5 sm:p-6 flex flex-col justify-between gap-4">
                <div>
                  <span className="block text-hb-xs font-bold text-[#141A23] mb-2.5">
                    이 단계에서 확인하는 내용
                  </span>
                  <ul className="space-y-2">
                    {activeStep.checkItems.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-hb-xs sm:text-hb-sm text-[#334155] leading-relaxed break-keep"
                      >
                        <Icon
                          d={ICON.check}
                          className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3.5 border-t border-[#E2DDD3] flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={activeStep.targetCategoryHref}
                      className="hb-btn-primary min-h-[40px] h-10 px-4 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap"
                    >
                      <span>{activeStep.targetCategoryCta}</span>
                      <Icon d={ICON.arrow} className="w-3.5 h-3.5 text-[#FF8A50]" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        trackEvent("begin_buy_inquiry", {
                          step: activeStep.id,
                          location: "home_showroom_trust_showcase",
                        });
                        triggerQuickInquiry({
                          type: "구매 문의",
                          productTitle: `[점검·보증 문의] ${activeStep.tabLabel}`,
                        });
                      }}
                      className="hb-btn-outline min-h-[40px] h-10 px-3.5 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap cursor-pointer"
                    >
                      <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#C84312]" />
                      <span>재고·보증 상담</span>
                    </button>
                  </div>

                  <a
                    href={telHref(STORE.tel)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 text-hb-xs sm:text-hb-sm font-bold text-[#141A23] hover:text-[#C84312] transition-colors font-mono tabular-nums whitespace-nowrap"
                  >
                    <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#C84312]" />
                    <span>직영 문의 {STORE.tel}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 한눈에 보는 공식 구매·배송·A/S 안내문 6종 비주얼 보드 */}
        <HomeNoticeGuidesStrip />
      </div>
    </section>
  );
}
