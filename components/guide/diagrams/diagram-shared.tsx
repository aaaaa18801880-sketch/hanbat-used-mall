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
    <figure className="my-6 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-hb-xs sm:text-hb-sm font-bold text-[#141A23] flex items-center gap-1.5">
          <Icon d={ICON.layers} className="w-4 h-4 text-[#C84312] shrink-0" />
          <span>{title}</span>
        </p>
        <span className="text-hb-xs font-medium text-[#64748B] shrink-0">
          {badgeLabel}
        </span>
      </div>
      <div
        tabIndex={0}
        role="region"
        aria-label={`${title} 가로 스크롤 도해`}
        className="overflow-x-auto rounded-xl border border-[#CBD5E1] bg-white p-2 sm:p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23]"
      >
        {children}
      </div>
      <figcaption className="text-hb-xs sm:text-hb-sm text-[#475569] leading-[1.65] [text-wrap:pretty]">
        {caption}
      </figcaption>
    </figure>
  );
}
