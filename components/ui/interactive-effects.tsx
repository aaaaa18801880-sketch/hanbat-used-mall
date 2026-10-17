// 파일 경로: components/ui/interactive-effects.tsx
"use client";

import React from "react";
import { STORE, telHref, smsHref } from "../../lib/site";

/**
 * 1. Clean Surface Card Wrapper (기존 SpotlightCard 호환 래퍼 — 과장된 광원 효과 제거)
 */
export function SpotlightCard({
  children,
  className = "",
  as: Component = "div",
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  as?: "div" | "li" | "article";
}) {
  return (
    <Component
      className={`relative flex flex-col justify-between transition-colors duration-150 ${className}`}
    >
      {children}
    </Component>
  );
}

/**
 * 2. Static Hero Headline Wrapper (기존 InteractiveHeroHeadline 호환 래퍼 — 마우스 반응형 글자 변형 제거)
 */
export function InteractiveHeroHeadline({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return <span className={className}>{text}</span>;
}

/**
 * 3. 4단계 상담 · 매입 · 출고 절차 안내 (기존 AnimatedBeamFlow 대체 — 정직한 단계형 안내)
 */
const PROCESS_STEPS = [
  {
    step: "STEP 01",
    title: "사진 · 정보 접수",
    desc: "품목·모델명·외관 사진이나 필요 수량을 온라인 폼, 카톡, 문자로 남겨주세요.",
  },
  {
    step: "STEP 02",
    title: "상태 · 견적 확인",
    desc: "담당 기사가 연식·상태·현장 여건을 확인하여 합리적인 견적과 재고를 안내합니다.",
  },
  {
    step: "STEP 03",
    title: "방문 일정 조율",
    desc: "고객님이 원하시는 날짜와 시간에 맞춰 방문 수거 또는 배송·설치 일정을 확정합니다.",
  },
  {
    step: "STEP 04",
    title: "현장 수거 · 정산 / 설치",
    desc: "매입 시 현장에서 분리·운반 후 즉시 송금하며, 구매 시 설치·시운전까지 마무리합니다.",
  },
] as const;

export function AnimatedBeamFlow({
  onSelectInquiry,
}: {
  onSelectInquiry?: (type: string) => void;
}) {
  return (
    <div className="mb-10 rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-[#E5E2DC]">
        <div>
          <span className="text-[12px] font-bold text-[#D9531E]">
            진행 절차 안내
          </span>
          <h3 className="mt-0.5 text-[17px] sm:text-[18.5px] font-bold text-[#0E1A2B] tracking-[-0.02em]">
            상담 및 방문 매입 · 납품 진행 4단계
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={telHref(STORE.tel)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CFCAC0] bg-[#FAF9F7] px-3 py-1.5 text-[12.5px] font-semibold text-[#0E1A2B] hover:border-[#0E1A2B] tabular-nums transition-colors"
          >
            <span>대표전화 {STORE.tel}</span>
          </a>
          <a
            href={smsHref(
              STORE.mobile,
              "[한밭중고전자 문자상담] 제품 사진/품목을 첨부하여 문의합니다."
            )}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CFCAC0] bg-[#FAF9F7] px-3 py-1.5 text-[12.5px] font-semibold text-[#0E1A2B] hover:border-[#0E1A2B] tabular-nums transition-colors"
          >
            <span>문자 접수 {STORE.mobile}</span>
          </a>
          {onSelectInquiry && (
            <button
              type="button"
              onClick={() => onSelectInquiry("내 물건 팔기")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0E1A2B] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#182942] transition-colors"
            >
              <span>아래 양식으로 바로 접수 ↓</span>
            </button>
          )}
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {PROCESS_STEPS.map((item, idx) => (
          <li
            key={item.step}
            className="relative flex flex-col justify-between rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold tracking-wider text-[#D9531E] tabular-nums">
                  {item.step}
                </span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#E5E2DC] text-[12px] font-bold text-[#0E1A2B] tabular-nums">
                  {idx + 1}
                </span>
              </div>
              <h4 className="mt-2 text-[15.5px] font-bold text-[#0E1A2B] tracking-[-0.015em]">
                {item.title}
              </h4>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-[#3E4756] break-keep">
                {item.desc}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
