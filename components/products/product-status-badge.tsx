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
            ? "bg-[#FF6F0F]/95 text-white"
            : "bg-[#191F28]/90 text-white"
        }`}
      >
        {!sold && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              reserved ? "bg-white animate-pulse" : "bg-[#00C471]"
            }`}
          />
        )}
        <span>{label}</span>
      </span>
      {isFresh && (
        <span className="inline-flex items-center rounded-full bg-[#FFF4EE] border border-[#FF6F0F]/30 px-2 py-0.5 text-hb-xs font-bold text-[#F05600] shadow-2xs">
          NEW
        </span>
      )}
    </div>
  );
}
