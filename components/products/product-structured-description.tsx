// 파일 경로: components/products/product-structured-description.tsx
"use client";

import React from "react";
import { parseProductDescription } from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";

interface ProductStructuredDescriptionProps {
  description: string | null | undefined;
  className?: string;
  variant?: "full" | "compact";
}

export function ProductStructuredDescription({
  description,
  className = "",
  variant = "full",
}: ProductStructuredDescriptionProps) {
  if (!description || !description.trim()) {
    return (
      <div
        className={`rounded-2xl bg-[#F7F8FA] border border-[#E2E6EC] p-5 ${className}`.trim()}
      >
        <h3 className="text-hb-base font-bold text-[#141A23] mb-1.5">
          상세 제원 및 검수 소견
        </h3>
        <p className="text-hb-sm leading-relaxed text-[#64748B]">
          등록된 상세 설명이 없습니다. 매장 전화 또는 온라인 문의로 상세 스펙을 확인하실 수 있습니다.
        </p>
      </div>
    );
  }

  const parsed = parseProductDescription(description);

  if (!parsed.hasStructuredSections) {
    return (
      <div
        className={`rounded-2xl bg-[#F7F8FA] border border-[#E2E6EC] p-5 sm:p-6 ${className}`.trim()}
      >
        <h3 className="text-hb-base font-bold text-[#141A23] mb-2.5">
          상세 제원 및 검수 소견
        </h3>
        <p className="text-hb-sm leading-relaxed text-[#334155] whitespace-pre-line">
          {description}
        </p>
      </div>
    );
  }

  const isCompact = variant === "compact";

  return (
    <div
      className={`bg-white ${
        isCompact
          ? "pt-3 space-y-4"
          : "p-5 sm:p-7 rounded-2xl border border-[#E2E6EC] shadow-2xs divide-y divide-[#E2E6EC]"
      } ${className}`.trim()}
    >
      {/* 상단 섹션 타이틀 (full 모드 전용) */}
      {!isCompact && (
        <div className="pb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-hb-lg sm:text-hb-xl font-bold tracking-[-0.02em] text-[#141A23]">
            상세 규격 · 제품 특징 · 검수 소견서
          </h2>
          <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-hb-xs font-bold text-[#334155]">
            직영 매장 입고 실물 기준
          </span>
        </div>
      )}

      {/* 1. 한눈에 보는 제품 정보 (No Card-in-Card 평탄화) */}
      {parsed.summary.length > 0 && (
        <div className={isCompact ? "space-y-1.5" : "py-4 sm:py-5 space-y-2"}>
          <h3 className="text-hb-sm font-bold text-[#141A23] flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FFF4EE] text-[#E8521A]">
              <Icon d={ICON.check} className="h-3.5 w-3.5" />
            </span>
            <span>한눈에 보는 제품 요약</span>
          </h3>
          <div className="space-y-1.5 text-hb-sm leading-relaxed text-[#334155] pl-7">
            {parsed.summary.map((line, i) => (
              <p key={i} className="leading-relaxed text-[#334155]">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 2. 주요 규격 및 사양 (정밀 2열 기술 사양서 표) */}
      {parsed.specs.length > 0 && (
        <div className={isCompact ? "" : "py-4 sm:py-5"}>
          <h3 className="text-hb-sm font-bold text-[#141A23] mb-3">
            주요 규격 및 사양
          </h3>
          <dl
            className={`grid grid-cols-1 ${
              !isCompact && parsed.specs.length > 1
                ? "sm:grid-cols-2 gap-x-6 gap-y-2"
                : "gap-2"
            } text-hb-sm`}
          >
            {parsed.specs.map((s, i) => (
              <div
                key={s.label + i}
                className="py-1.5 border-b border-[#F1F3F6] flex justify-between items-center gap-4"
              >
                <dt className="font-semibold text-[#64748B] shrink-0">
                  {s.label}
                </dt>
                <dd className="font-bold text-[#141A23] text-right break-keep tabular-nums">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* 3 & 4. 제품 특징 + 점검 및 A/S 안내 (No Card-in-Card 리스트) */}
      {(parsed.features.length > 0 || parsed.inspectionAndAs.length > 0) && (
        <div
          className={`${
            isCompact
              ? "space-y-3"
              : "py-4 sm:py-5 grid grid-cols-1 md:grid-cols-2 gap-6"
          }`}
        >
          {parsed.features.length > 0 && (
            <div>
              <h3 className="text-hb-sm font-bold text-[#141A23] mb-2.5">
                제품 핵심 특징
              </h3>
              <ul className="space-y-2 text-hb-sm leading-relaxed text-[#334155]">
                {parsed.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#E8521A] shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.inspectionAndAs.length > 0 && (
            <div>
              <h3 className="text-hb-sm font-bold text-[#141A23] mb-2.5">
                점검 및 보증 안내
              </h3>
              <ul className="space-y-2 text-hb-sm leading-relaxed text-[#334155]">
                {parsed.inspectionAndAs.map((as, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icon
                      d={ICON.check}
                      className="h-4 w-4 text-[#0F766E] shrink-0 mt-0.5"
                    />
                    <span>{as}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 5 & 6. 구매 및 설치 전 확인사항 + 상담 안내 */}
      {(parsed.checkPoints.length > 0 || parsed.consultationGuide.length > 0) && (
        <div className={isCompact ? "space-y-3" : "py-4 sm:py-5 space-y-3"}>
          {parsed.checkPoints.length > 0 && (
            <div className="rounded-xl bg-[#FFF4EE] border border-[#FADCD0] p-4 text-hb-sm text-[#334155]">
              <strong className="block font-bold text-[#E8521A] mb-1">
                구매 및 설치 전 확인사항
              </strong>
              <div className="space-y-1">
                {parsed.checkPoints.map((c, i) => (
                  <p key={i}>· {c}</p>
                ))}
              </div>
            </div>
          )}

          {parsed.consultationGuide.length > 0 && (
            <div className="text-hb-sm text-[#334155] leading-relaxed space-y-1">
              {parsed.consultationGuide.map((cg, i) => (
                <p key={i} className="flex items-start gap-2">
                  <Icon
                    d={ICON.chat}
                    className="w-4 h-4 text-[#E8521A] shrink-0 mt-0.5"
                  />
                  <span>{cg}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. 기타 원문 내용 */}
      {parsed.rawRest.length > 0 && (
        <div
          className={`${
            isCompact ? "" : "py-4"
          } text-hb-sm leading-relaxed text-[#141A23] whitespace-pre-line`}
        >
          {parsed.rawRest.join("\n")}
        </div>
      )}
    </div>
  );
}
