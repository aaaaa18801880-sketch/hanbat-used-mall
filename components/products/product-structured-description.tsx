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
      <div className={`border-t-2 border-[#0E1A2B] pt-5 ${className}`.trim()}>
        <h3 className="text-hb-base font-bold text-[#0E1A2B] mb-2">
          상세 제원 및 검수 소견
        </h3>
        <p className="text-hb-sm leading-relaxed text-[#646E7E]">
          등록된 상세 설명이 없습니다. 매장 전화 또는 온라인 문의로 상세 스펙을 확인하실 수 있습니다.
        </p>
      </div>
    );
  }

  const parsed = parseProductDescription(description);

  if (!parsed.hasStructuredSections) {
    return (
      <div className={`border-t-2 border-[#0E1A2B] pt-5 ${className}`.trim()}>
        <h3 className="text-hb-base font-bold text-[#0E1A2B] mb-2.5">
          상세 제원 및 검수 소견
        </h3>
        <p className="text-hb-sm leading-relaxed text-[#3E4756] whitespace-pre-line">
          {description}
        </p>
      </div>
    );
  }

  const isCompact = variant === "compact";

  return (
    <div
      className={`border-t-2 border-[#0E1A2B] bg-white ${
        isCompact ? "pt-4 space-y-4" : "p-5 sm:p-7 rounded-b-xl border-x border-b border-[#E5E2DC] divide-y divide-[#E5E2DC]"
      } ${className}`.trim()}
    >
      {/* 상단 섹션 타이틀 (full 모드 전용) */}
      {!isCompact && (
        <div className="pb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="hb-eyebrow">SHOWROOM SPECIFICATION</span>
            <h2 className="mt-1 text-hb-lg sm:text-hb-xl font-bold text-[#0E1A2B]">
              상세 규격 · 제품 특징 · 검수 소견서
            </h2>
          </div>
          <span className="text-hb-xs font-semibold text-[#646E7E]">
            직영 매장 입고 실물 기준
          </span>
        </div>
      )}

      {/* 1. 한눈에 보는 제품 정보 (요약) */}
      {parsed.summary.length > 0 && (
        <div className={isCompact ? "" : "py-4"}>
          <h3 className="text-hb-sm font-bold text-[#0E1A2B] mb-2 flex items-center gap-1.5">
            <Icon d={ICON.check} className="h-4 w-4 text-[#D9531E]" />
            <span>한눈에 보는 제품 요약</span>
          </h3>
          <div className="space-y-1 text-hb-sm leading-relaxed text-[#2D333F]">
            {parsed.summary.map((line, i) => (
              <p key={i} className="leading-relaxed text-[#3E4756]">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 2. 주요 규격 및 사양 (2열 아키텍처 스펙 테이블) */}
      {parsed.specs.length > 0 && (
        <div className={isCompact ? "" : "py-4"}>
          <h3 className="text-hb-sm font-bold text-[#0E1A2B] mb-2.5">
            주요 규격 및 사양
          </h3>
          <dl
            className={`grid grid-cols-1 ${
              !isCompact && parsed.specs.length > 2 ? "sm:grid-cols-2 sm:gap-x-8" : ""
            } border-t border-[#E5E2DC] text-hb-sm`}
          >
            {parsed.specs.map((s, i) => (
              <div
                key={s.label + i}
                className="py-2.5 border-b border-[#E5E2DC] flex justify-between items-baseline gap-4"
              >
                <dt className="font-semibold text-[#646E7E] shrink-0">
                  {s.label}
                </dt>
                <dd className="font-bold text-[#0E1A2B] text-right break-keep">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* 3 & 4. 제품 특징 + 점검 및 A/S 안내 (2열 병렬 또는 순차 배치) */}
      {(parsed.features.length > 0 || parsed.inspectionAndAs.length > 0) && (
        <div
          className={`${
            isCompact
              ? "space-y-4"
              : "py-4 grid grid-cols-1 md:grid-cols-2 gap-6"
          }`}
        >
          {parsed.features.length > 0 && (
            <div>
              <h3 className="text-hb-sm font-bold text-[#0E1A2B] mb-2">
                제품 핵심 특징
              </h3>
              <ul className="space-y-1.5 text-hb-sm leading-relaxed text-[#3E4756]">
                {parsed.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#D9531E] font-extrabold">·</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.inspectionAndAs.length > 0 && (
            <div>
              <h3 className="text-hb-sm font-bold text-[#0E1A2B] mb-2">
                점검 및 보증 안내
              </h3>
              <ul className="space-y-1.5 text-hb-sm leading-relaxed text-[#3E4756]">
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
        </div>
      )}

      {/* 5 & 6. 구매 및 설치 전 확인사항 + 상담 안내 */}
      {(parsed.checkPoints.length > 0 || parsed.consultationGuide.length > 0) && (
        <div className={isCompact ? "space-y-3" : "pt-4 space-y-3"}>
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

          {parsed.consultationGuide.length > 0 && (
            <div className="text-hb-sm text-[#434B59] leading-relaxed space-y-1">
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
        </div>
      )}

      {/* 7. 기타 원문 내용 */}
      {parsed.rawRest.length > 0 && (
        <div className={`${isCompact ? "" : "pt-4"} text-hb-sm leading-relaxed text-[#0E1A2B] whitespace-pre-line`}>
          {parsed.rawRest.join("\n")}
        </div>
      )}
    </div>
  );
}
