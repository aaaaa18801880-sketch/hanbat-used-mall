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
      <div
        className={`rounded-2xl bg-[#F9FAFB] border border-[#E5E8EB] p-5 ${className}`.trim()}
      >
        <h3 className="text-hb-base font-bold text-[#191F28] mb-1.5">
          상세 제원 및 검수 소견
        </h3>
        <p className="text-hb-sm leading-relaxed text-[#6B7684]">
          등록된 상세 설명이 없습니다. 매장 전화 또는 온라인 문의로 상세 스펙을 확인하실 수 있습니다.
        </p>
      </div>
    );
  }

  const parsed = parseProductDescription(description);

  if (!parsed.hasStructuredSections) {
    return (
      <div
        className={`rounded-2xl bg-[#F9FAFB] border border-[#E5E8EB] p-5 sm:p-6 ${className}`.trim()}
      >
        <h3 className="text-hb-base font-bold text-[#191F28] mb-2.5">
          상세 제원 및 검수 소견
        </h3>
        <p className="text-hb-sm leading-relaxed text-[#4E5968] whitespace-pre-line">
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
          : "p-5 sm:p-8 rounded-3xl border border-[#E5E8EB] shadow-card space-y-6"
      } ${className}`.trim()}
    >
      {/* 상단 섹션 타이틀 (full 모드 전용) */}
      {!isCompact && (
        <div className="pb-4 border-b border-[#F2F4F6] flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="hb-eyebrow">SHOWROOM SPECIFICATION</span>
            <h2 className="mt-1.5 text-hb-lg sm:text-hb-xl font-bold tracking-[-0.02em] text-[#191F28]">
              상세 규격 · 제품 특징 · 검수 소견서
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8FAF0] px-3 py-1 text-hb-xs font-bold text-[#00A85D]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00C471]" />
            직영 매장 입고 실물 기준
          </span>
        </div>
      )}

      {/* 1. 한눈에 보는 제품 정보 (토스/애플 소프트 요약 카드) */}
      {parsed.summary.length > 0 && (
        <div
          className={
            isCompact
              ? "rounded-2xl bg-[#F9FAFB] p-4"
              : "rounded-2xl bg-[#F9FAFB] border border-[#E5E8EB]/80 p-4 sm:p-5"
          }
        >
          <h3 className="text-hb-sm font-bold text-[#191F28] mb-2 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FFF4EE] text-[#FF6F0F]">
              <Icon d={ICON.check} className="h-3.5 w-3.5" />
            </span>
            <span>한눈에 보는 제품 요약</span>
          </h3>
          <div className="space-y-1.5 text-hb-sm leading-relaxed text-[#4E5968]">
            {parsed.summary.map((line, i) => (
              <p key={i} className="leading-relaxed text-[#4E5968]">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 2. 주요 규격 및 사양 (토스 TDS 2열 벤토 스펙 타일) */}
      {parsed.specs.length > 0 && (
        <div>
          <h3 className="text-hb-sm font-bold text-[#191F28] mb-3">
            주요 규격 및 사양
          </h3>
          <dl
            className={`grid grid-cols-1 ${
              !isCompact && parsed.specs.length > 1
                ? "sm:grid-cols-2 gap-2.5"
                : "gap-2"
            } text-hb-sm`}
          >
            {parsed.specs.map((s, i) => (
              <div
                key={s.label + i}
                className="rounded-xl bg-[#F2F4F6]/80 px-4 py-3 flex justify-between items-center gap-4"
              >
                <dt className="font-semibold text-[#6B7684] shrink-0">
                  {s.label}
                </dt>
                <dd className="font-bold text-[#191F28] text-right break-keep">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* 3 & 4. 제품 특징 + 점검 및 A/S 안내 (듀얼 소프트 서피스 카드) */}
      {(parsed.features.length > 0 || parsed.inspectionAndAs.length > 0) && (
        <div
          className={`${
            isCompact
              ? "space-y-3"
              : "grid grid-cols-1 md:grid-cols-2 gap-4"
          }`}
        >
          {parsed.features.length > 0 && (
            <div className="rounded-2xl bg-[#F9FAFB] border border-[#E5E8EB]/70 p-4 sm:p-5">
              <h3 className="text-hb-sm font-bold text-[#191F28] mb-2.5">
                제품 핵심 특징
              </h3>
              <ul className="space-y-2 text-hb-sm leading-relaxed text-[#4E5968]">
                {parsed.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#FF6F0F] shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.inspectionAndAs.length > 0 && (
            <div className="rounded-2xl bg-[#E8FAF0]/50 border border-[#00C471]/20 p-4 sm:p-5">
              <h3 className="text-hb-sm font-bold text-[#191F28] mb-2.5">
                점검 및 보증 안내
              </h3>
              <ul className="space-y-2 text-hb-sm leading-relaxed text-[#4E5968]">
                {parsed.inspectionAndAs.map((as, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icon
                      d={ICON.check}
                      className="h-4 w-4 text-[#00A85D] shrink-0 mt-0.5"
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
        <div className="space-y-3">
          {parsed.checkPoints.length > 0 && (
            <div className="rounded-2xl bg-[#FFF4EE]/75 border border-[#FF6F0F]/20 px-4 py-3.5 text-hb-sm text-[#4E5968]">
              <strong className="block font-bold text-[#F05600] mb-1">
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
            <div className="rounded-2xl bg-[#F2F4F6]/70 px-4 py-3 text-hb-sm text-[#4E5968] leading-relaxed space-y-1">
              {parsed.consultationGuide.map((cg, i) => (
                <p key={i} className="flex items-start gap-2">
                  <Icon
                    d={ICON.chat}
                    className="w-4 h-4 text-[#FF6F0F] shrink-0 mt-0.5"
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
            isCompact ? "" : "pt-2"
          } text-hb-sm leading-relaxed text-[#191F28] whitespace-pre-line`}
        >
          {parsed.rawRest.join("\n")}
        </div>
      )}
    </div>
  );
}
