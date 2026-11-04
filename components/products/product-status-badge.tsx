import React from "react";
import {
  getProductStatusLabel,
  isProductReserved,
  isProductSold,
  isRecentlyCreated,
} from "../../lib/site";

export function ProductStatusBadge({
  status,
  createdAt,
  showNew = true,
  className = "",
}: {
  status?: string | null;
  createdAt?: string | null;
  showNew?: boolean;
  className?: string;
}) {
  const sold = isProductSold(status);
  const reserved = isProductReserved(status);
  const label = getProductStatusLabel(status);

  const isFresh = showNew && !sold && isRecentlyCreated(createdAt, 7);

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-hb-xs font-semibold backdrop-blur-md shadow-xs ${
          sold
            ? "bg-[#4E5968]/90 text-white"
            : reserved
            ? "bg-[#E8521A]/95 text-white"
            : "bg-[#141A23]/90 text-white"
        }`}
      >
        {!sold && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              reserved ? "bg-white" : "bg-[#00C471]"
            }`}
          />
        )}
        <span>{label}</span>
      </span>
      {isFresh && (
        <span className="inline-flex items-center rounded-full bg-[#FFF4EE] border border-[#E8521A]/30 px-2 py-0.5 text-hb-xs font-bold text-[#E8521A] shadow-2xs">
          NEW
        </span>
      )}
    </div>
  );
}
