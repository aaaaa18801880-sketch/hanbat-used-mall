"use client";

import React, { useSyncExternalStore } from "react";
import {
  getKstDateKey,
  getProductStatusLabel,
  isProductReserved,
  isProductSold,
  isWithinKstDays,
} from "../../lib/site";

const emptySubscribe = () => () => {};

function getClientKstTodayKey(): string {
  return getKstDateKey(new Date());
}

function getServerKstTodayKey(): string {
  return "";
}

export function isNewArrivalProduct(
  createdAt?: string | null,
  referenceKstDateKey?: string,
  days = 7
): boolean {
  const refKey = referenceKstDateKey || getKstDateKey(new Date());
  return isWithinKstDays(createdAt, refKey, days);
}

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

  const todayKstKey = useSyncExternalStore(
    emptySubscribe,
    getClientKstTodayKey,
    getServerKstTodayKey
  );

  const isFresh =
    showNew &&
    !sold &&
    Boolean(todayKstKey) &&
    isNewArrivalProduct(createdAt, todayKstKey, 7);

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-hb-xs font-semibold backdrop-blur-md shadow-xs ${
          sold
            ? "bg-[#334155]/90 text-white"
            : reserved
            ? "bg-[#C84312]/95 text-white"
            : "bg-[#141A23]/90 text-white"
        }`}
      >
        {!sold && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              reserved ? "bg-white" : "bg-[#0D9488]"
            }`}
          />
        )}
        <span>{label}</span>
      </span>
      {isFresh && (
        <span className="inline-flex items-center rounded-full bg-[#FFF4EE] border border-[#C84312]/30 px-2 py-0.5 text-hb-xs font-bold text-[#C84312] shadow-2xs">
          신규입고
        </span>
      )}
    </div>
  );
}
