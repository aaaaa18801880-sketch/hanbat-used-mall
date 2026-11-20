// 파일 경로: components/products/v2-visual-inspection-viewer.tsx
import React from "react";
import {
  getCategoryWarrantyInfo,
  normalizeProductCategory,
  STORE,
} from "../../lib/site";
import {
  getBuyerConcernItems,
  INSPECTION_SUMMARY_SUBTITLE,
} from "../../lib/product-inspection";
import { Icon, ICON } from "../../lib/icons";
import { TrackedLink } from "../ui/tracked-link";

const TONE_BADGE_STYLE = {
  cyan: "bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]",
  teal: "bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]",
  orange: "bg-[#FFF4EE] text-[#C84312] border-[#FADCD0]",
} as const;

export function V2VisualInspectionViewer({
  category,
  conditionGrade,
}: {
  category?: string | null;
  conditionGrade?: string | null;
}) {
  const catLabel = normalizeProductCategory(category);
  const items = getBuyerConcernItems(catLabel);
  const displayGrade = conditionGrade || "A급 (점검완료)";
  const warrantyText = getCategoryWarrantyInfo(catLabel).compactLabel;

  return (
    <div className="hb-surface-card flex h-full flex-col justify-between overflow-hidden border-[#E2DDD3]">
      {/* 상단 헤더 */}
      <div className="border-b border-[#E2DDD3] bg-[#FAF9F6] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-hb-xs">
          <span className="font-bold text-[#0F766E]">
            출고 전 점검 안내 · {catLabel}
          </span>
          <span className="font-bold text-[#C84312] tabular-nums">
            {displayGrade} · {warrantyText}
          </span>
        </div>

        <h3 className="mt-2.5 text-hb-lg sm:text-hb-xl font-bold text-[#141A23] tracking-tight">
          중고 구매 전 가장 걱정되는 4가지, 이렇게 해결합니다
        </h3>
        <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#475569]">
          {INSPECTION_SUMMARY_SUBTITLE}
        </p>
      </div>

      {/* 본문 2×2 에디토리얼 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E2DDD3] flex-1">
        {[items.slice(0, 2), items.slice(2, 4)].map((colItems, colIdx) => (
          <div key={colIdx} className="divide-y divide-[#E2DDD3]">
            {colItems.map((item) => (
              <div key={item.no} className="p-5 sm:p-6 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-hb-xs font-bold text-[#64748B] tabular-nums">
                    점검 {item.no}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-hb-xs font-bold whitespace-nowrap ${
                      TONE_BADGE_STYLE[item.tone]
                    }`}
                  >
                    <Icon d={ICON.check} className="w-3 h-3 shrink-0" />
                    <span>{item.badge}</span>
                  </span>
                </div>
                <p className="text-hb-xs font-bold text-[#C84312] leading-snug break-keep">
                  Q. {item.question}
                </p>
                <h4 className="text-hb-sm sm:text-hb-base font-bold text-[#141A23] leading-snug break-keep">
                  {item.answerTitle}
                </h4>
                <p className="text-hb-xs sm:text-hb-sm leading-[1.65] text-[#475569] break-keep pt-0.5">
                  {item.desc}
                </p>
                <div className="pt-2 border-t border-dashed border-[#E2DDD3]">
                  <TrackedLink
                    href={`/guide/${item.guide.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    eventName="click_guide_tool_action"
                    eventParams={{
                      slug: item.guide.slug,
                      source: "v2_visual_inspection",
                    }}
                    className="group inline-flex items-center gap-1.5 text-hb-xs font-bold text-[#0F766E] hover:text-[#C84312] transition-colors"
                  >
                    <span>{item.guide.label}</span>
                    <Icon
                      d={ICON.external}
                      className="w-3 h-3 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                    />
                  </TrackedLink>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 하단 푸터 스트립 */}
      <div className="border-t border-[#E2DDD3] bg-[#FAF9F6] px-5 py-3.5 text-hb-xs text-[#475569] flex items-center gap-2">
        <Icon d={ICON.pin} className="w-4 h-4 text-[#0F766E] shrink-0" />
        <span className="break-keep">
          <strong>{STORE.jibunAddress} 1·2층 직영 쇼룸 상시 개방:</strong> 매장에 방문하시면 구매 전 직접 전원을 켜고 냉기·작동 상태를 확인하실 수 있습니다.
        </span>
      </div>
    </div>
  );
}
