"use client";

import React from "react";
import {
  getInquiryTypeLabel,
  parseStructuredInquiryDescription,
  STORE,
} from "../../lib/site";

export const INQUIRY_REPLY_TEMPLATES = [
  {
    label: "매입 견적 안내",
    text: `안녕하세요, ${STORE.name}입니다.\n남겨주신 매입 문의와 사진을 확인했습니다. 정확한 수거 일정 및 견적 안내를 위해 기재해주신 연락처로 곧 전화드리겠습니다. 감사합니다.`,
  },
  {
    label: "구매·재고 안내",
    text: `안녕하세요, ${STORE.name}입니다.\n문의하신 제품은 현재 매장 실물 확인 및 배송·설치 상담이 가능합니다. 설치 지역과 여건에 맞춰 담당자가 곧 연락드리겠습니다.`,
  },
  {
    label: "방문 일정 조율",
    text: `안녕하세요, ${STORE.name}입니다.\n요청하신 희망 방문 일정을 확인했습니다. 기사님 배차 스케줄을 확인한 뒤 오늘 중으로 유선 연락드리겠습니다.`,
  },
] as const;

export interface StructuredInquiryCardProps {
  description: string | null | undefined;
  inquiryType?: string | null;
  isAdmin: boolean;
  conditionHeading?: string;
  plainClassName?: string;
}

/**
 * Render structured inquiry specs, customer body, and admin-only AI summary from an inquiry description string.
 */
export function StructuredInquiryCard({
  description,
  inquiryType,
  isAdmin,
  conditionHeading,
  plainClassName = "text-hb-sm text-[#4B5260] whitespace-pre-wrap leading-relaxed",
}: StructuredInquiryCardProps) {
  const parsed = parseStructuredInquiryDescription(description);

  if (!parsed.isStructured) {
    if (!parsed.customerContent) return null;
    return <p className={plainClassName}>{parsed.customerContent}</p>;
  }

  const resolvedHeading =
    conditionHeading ??
    (inquiryType ? `${getInquiryTypeLabel(inquiryType)} 상세 조건` : "접수 상세 조건");

  return (
    <div className="space-y-3 mt-2">
      {(parsed.structuredLines.length > 0 || parsed.bulkItems.length > 0) && (
        <div className="rounded-lg border border-[#E2E6EC] bg-[#F8F9FA] p-3.5 space-y-2.5">
          <div className="text-hb-xs font-extrabold text-[#141A23]">
            {resolvedHeading}
          </div>

          {parsed.structuredLines.length > 0 && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-hb-xs">
              {parsed.structuredLines.map((row, idx) => (
                <div key={row.label + idx} className="flex gap-2">
                  <dt className="font-bold text-[#4B5260] shrink-0">
                    {row.label}:
                  </dt>
                  <dd className="font-semibold text-[#141A23]">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {parsed.bulkItems.length > 0 && (
            <div className="pt-1.5 border-t border-[#E2E6EC]">
              <span className="text-hb-xs font-bold text-[#E8521A] block mb-1">
                요청 장비 및 희망 수량 목록
              </span>
              <ul className="space-y-1 text-hb-xs font-medium text-[#141A23]">
                {parsed.bulkItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="bg-white px-2.5 py-1 rounded border border-[#E2E6EC]"
                  >
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {parsed.customerContent && (
        <div className="rounded bg-[#F9FAFB] p-3.5 text-hb-sm text-[#1F2530] whitespace-pre-wrap leading-relaxed border border-[#E2E6EC]">
          <span className="block text-hb-xs font-bold text-[#6B7280] mb-1">
            고객 작성 본문
          </span>
          {parsed.customerContent}
        </div>
      )}

      {isAdmin &&
        (parsed.aiSummaryLines.length > 0 ||
          parsed.missingAndQuestions.length > 0) && (
          <div className="rounded border border-amber-200 bg-amber-50/70 p-3 text-hb-xs text-amber-950 space-y-1">
            <strong className="block text-amber-900">
              AI 사진 판독 참고 요약
            </strong>
            {parsed.aiSummaryLines.map((line, idx) => (
              <p key={idx}>• {line}</p>
            ))}
            {parsed.missingAndQuestions.map((question, idx) => (
              <p key={idx} className="font-semibold text-[#E8521A]">
                {question}
              </p>
            ))}
          </div>
        )}
    </div>
  );
}
