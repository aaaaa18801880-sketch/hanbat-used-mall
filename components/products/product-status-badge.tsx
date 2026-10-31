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
        className={`inline-block rounded px-2.5 py-0.5 text-hb-xs font-bold tracking-wide text-white shadow-2xs ${
          sold
            ? "bg-[#646E7E]"
            : reserved
            ? "bg-[#B45309]"
            : "bg-[#0E1A2B]"
        }`}
      >
        {label}
      </span>
      {isFresh && (
        <span className="inline-block rounded bg-[#B5431A] px-2 py-0.5 text-hb-xs font-bold tracking-wide text-white shadow-2xs">
          NEW
        </span>
      )}
    </div>
  );
}
