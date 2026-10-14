import React from "react";
import {
  getProductStatusLabel,
  isProductReserved,
  isProductSold,
} from "../../lib/site";

export function ProductStatusBadge({
  status,
  createdAt,
  showNew = true,
}: {
  status?: string | null;
  createdAt?: string | null;
  showNew?: boolean;
}) {
  const sold = isProductSold(status);
  const reserved = isProductReserved(status);
  const label = getProductStatusLabel(status);

  const isFresh =
    showNew &&
    !sold &&
    createdAt &&
    Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block rounded-sm px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-2xs ${
          sold
            ? "bg-[#6B7280]"
            : reserved
            ? "bg-[#B45309]"
            : "bg-[#0E1A2B]"
        }`}
      >
        {label}
      </span>
      {isFresh && (
        <span className="inline-block rounded-sm bg-[#D9531E] px-2 py-1 text-[11px] font-bold tracking-wide text-white shadow-2xs">
          NEW
        </span>
      )}
    </div>
  );
}