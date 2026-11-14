// 파일 경로: components/guide/diagrams/diagram-shared.tsx
import React from "react";
import { ICON, Icon } from "../../../lib/ui";

export function DiagramFigure({
  title,
  caption,
  badgeLabel = "기술 도해 · 단면/계통도",
  children,
}: {
  title: string;
  caption: string;
  badgeLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="my-5 rounded-2xl border border-[#E2E6EC] bg-[#F8FAFC] p-3.5 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-hb-xs sm:text-hb-sm font-bold text-[#141A23] flex items-center gap-1.5">
          <Icon d={ICON.layers} className="w-4 h-4 text-[#E8521A] shrink-0" />
          <span>{title}</span>
        </p>
        <span className="inline-flex items-center rounded-md border border-[#E2E6EC] bg-white px-2 py-0.5 text-hb-xs font-semibold text-[#475569] shrink-0">
          {badgeLabel}
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#CBD5E1] bg-white p-2 sm:p-3 shadow-2xs">
        {children}
      </div>
      <figcaption className="mt-2.5 text-hb-xs text-[#475569] leading-[1.6] [text-wrap:pretty]">
        {caption}
      </figcaption>
    </figure>
  );
}
