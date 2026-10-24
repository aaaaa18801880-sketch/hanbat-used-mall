// 파일 경로: components/products/product-structured-description.tsx
"use client";

import React from "react";
import { parseProductDescription } from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";

export interface ProductStructuredDescriptionProps {
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
      <div className={className}>
        <h3 className="text-hb-sm font-bold text-[#0E1A2B] mb-2">상세 설명</h3>
        <p className="text-hb-sm leading-relaxed text-[#646E7E]">
          등록된 상세 설명이 없습니다.
        </p>
      </div>
    );
  }

  const parsed = parseProductDescription(description);

  if (!parsed.hasStructuredSections) {
    return (
      <div className={className}>
        <h3 className="text-hb-sm font-bold text-[#0E1A2B] mb-2">상세 설명</h3>
        <p className="text-hb-sm leading-relaxed text-[#3E4756] whitespace-pre-line">
          {description}
        </p>
      </div>
    );
  }

  const isCompact = variant === "compact";

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {/* 1. 한눈에 보는 제품 정보 (요약) */}
      {parsed.summary.length > 0 && (
        <div className="bg-[#FAF9F7] rounded-lg border border-[#E5E2DC] p-3.5 sm:p-4 text-hb-sm leading-relaxed text-[#2D333F]">
          <h3 className="text-hb-sm font-bold text-[#0E1A2B] mb-2 flex items-center gap-1.5">
            <Icon d={ICON.check} className="h-4 w-4 text-[#D9531E]" />
            <span>한눈에 보는 제품 정보</span>
          </h3>
          {parsed.summary.map((line, i) => (
            <p
              key={i}
              className="mt-1 first:mt-0 leading-relaxed text-[#3E4756]"
            >
              {line}
            </p>
          ))}
        </div>
      )}

      {/* 2. 주요 규격 및 사양 */}
      {parsed.specs.length > 0 && (
        <div
          className={
            isCompact
              ? "rounded-lg border border-[#E5E2DC] bg-white p-3.5"
              : "rounded-lg border border-[#E5E2DC] bg-white p-3.5 sm:p-4"
          }
        >
          <h3 className="text-hb-sm font-bold text-[#0E1A2B] mb-2">
            주요 규격 및 사양
          </h3>
          <dl className="divide-y divide-[#E5E2DC] border-y border-[#E5E2DC] text-hb-sm">
            {parsed.specs.map((s, i) => (
              <div
                key={s.label + i}
                className="py-2 flex justify-between gap-4"
              >
                <dt className="font-medium text-[#646E7E] shrink-0">
                  {s.label}
                </dt>
                <dd className="font-semibold text-[#0E1A2B] text-right">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* 3. 제품 특징 */}
      {parsed.features.length > 0 && (
        <div
          className={
            isCompact
              ? "rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-3.5"
              : "rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-3.5 sm:p-4"
          }
        >
          <h3 className="text-hb-sm font-bold text-[#0E1A2B] mb-2">
            제품 특징
          </h3>
          <ul className="space-y-1.5 text-hb-sm leading-relaxed text-[#3E4756]">
            {parsed.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#D9531E] font-bold">·</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. 점검 및 A/S 안내 */}
      {parsed.inspectionAndAs.length > 0 && (
        <div className="bg-[#FAF9F7] rounded-lg border border-[#E5E2DC] p-3.5 text-hb-sm text-[#3E4756]">
          <h3 className="text-hb-sm font-bold text-[#0E1A2B] mb-2">
            점검 및 A/S 안내
          </h3>
          <ul className="space-y-1.5">
            {parsed.inspectionAndAs.map((as, i) => (
              <li key={i} className="flex items-start gap-2">
                <Icon
                  d={ICON.check}
                  className="h-4 w-4 text-[#15803D] shrink-0 mt-0.5"
                />
                <span>{as}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. 구매 및 설치 전 확인사항 */}
      {parsed.checkPoints.length > 0 && (
        <div className="border-l-2 border-[#D9531E] bg-[#FAF9F7] pl-3.5 pr-3 py-2.5 text-hb-sm text-[#3E4756]">
          <strong className="block font-bold text-[#0E1A2B] mb-1">
            구매 및 설치 전 확인사항
          </strong>
          {parsed.checkPoints.map((c, i) => (
            <p key={i}>· {c}</p>
          ))}
        </div>
      )}

      {/* 6. 상담 안내 */}
      {parsed.consultationGuide.length > 0 && (
        <div className="bg-[#FAF9F7] rounded-lg border border-[#E5E2DC] p-3.5 text-hb-sm text-[#434B59] leading-relaxed">
          <strong className="block font-bold text-[#0E1A2B] mb-1">
            상담 안내
          </strong>
          {parsed.consultationGuide.map((cg, i) => (
            <p key={i} className="flex items-start gap-1.5">
              <Icon
                d={ICON.chat}
                className="w-4 h-4 text-[#D9531E] shrink-0 mt-0.5"
              />
              <span>{cg}</span>
            </p>
          ))}
        </div>
      )}

      {/* 7. 기타 원문 내용 */}
      {parsed.rawRest.length > 0 && (
        <div className="text-hb-sm leading-relaxed text-[#0E1A2B] whitespace-pre-line">
          {parsed.rawRest.join("\n")}
        </div>
      )}
    </div>
  );
}
