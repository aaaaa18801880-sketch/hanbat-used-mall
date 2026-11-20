// 파일 경로: components/products/detail-collapsible-section.tsx
import React from "react";
import { Icon, ICON } from "../../lib/icons";

export function DetailCollapsibleSection({
  id,
  ariaLabel,
  badge,
  title,
  subtitle,
  defaultOpen = false,
  className = "",
  children,
}: {
  id?: string;
  ariaLabel?: string;
  badge?: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-label={ariaLabel || title} className={className}>
      <details
        open={defaultOpen}
        className="group overflow-hidden rounded-2xl border border-[#E2DDD3] bg-white shadow-2xs"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 transition-colors hover:bg-[#FAF9F6] [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {badge && (
                <span className="inline-flex items-center rounded-md border border-[#E2DDD3] bg-[#FAF9F6] px-2 py-0.5 text-hb-xs font-bold text-[#C84312]">
                  {badge}
                </span>
              )}
              <h2 className="text-hb-base sm:text-hb-lg font-bold text-[#141A23] break-keep">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="mt-1 text-hb-xs text-[#64748B] break-keep">
                {subtitle}
              </p>
            )}
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] px-3 py-1.5 text-hb-xs font-bold text-[#141A23] group-hover:border-[#141A23]/40">
            <span className="group-open:hidden">펼쳐보기</span>
            <span className="hidden group-open:inline">접기</span>
            <Icon
              d={ICON.down}
              className="h-3.5 w-3.5 text-[#C84312] transition-transform duration-200 group-open:rotate-180"
            />
          </span>
        </summary>

        <div className="border-t border-[#E2DDD3] bg-[#FAF9F6]/60 p-4 sm:p-6">
          {children}
        </div>
      </details>
    </section>
  );
}
