"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ICON, Icon } from "../../lib/icons";
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_OPTIONS,
  applyThemePreference,
  getSeasonKoreanName,
  getThemeMeta,
  readStoredThemePreference,
  resolveActiveTheme,
  subscribeThemeChange,
  type ThemePreference,
} from "../../lib/site-theme";

const getServerThemeSnapshot = (): ThemePreference => DEFAULT_THEME_PREFERENCE;

export function ThemeSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const preference = useSyncExternalStore(
    subscribeThemeChange,
    readStoredThemePreference,
    getServerThemeSnapshot
  );
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const currentMeta = getThemeMeta(preference);
  const activeResolved = resolveActiveTheme(preference);
  const activeResolvedMeta = getThemeMeta(activeResolved);
  const currentMonth = new Date().getMonth() + 1;
  const seasonLabel = getSeasonKoreanName(currentMonth);

  const handleSelect = (next: ThemePreference) => {
    applyThemePreference(next);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`홈페이지 색감 테마 변경 (현재: ${currentMeta.label})`}
        title="홈페이지 색감 테마 변경"
        className={`inline-flex items-center gap-1.5 rounded-xl border border-hb-border bg-hb-surface text-hb-text-primary hover:border-hb-border-strong hover:bg-hb-surface-muted active:scale-[0.97] transition-[background-color,border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hb-navy cursor-pointer ${
          compact ? "h-9 px-2.5 text-hb-xs" : "h-10 px-3 text-hb-xs font-bold"
        }`}
      >
        <span
          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-black/15 shrink-0"
          style={{ backgroundColor: activeResolvedMeta.swatchBg }}
          aria-hidden="true"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: activeResolvedMeta.swatchAccent }}
          />
        </span>
        <span className="hidden xl:inline whitespace-nowrap">
          {currentMeta.shortLabel}
        </span>
        <Icon
          d={ICON.down}
          className={`w-3.5 h-3.5 text-hb-text-muted transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="홈페이지 색감 테마 선택"
          className="absolute right-0 top-[calc(100%+8px)] z-[60] w-72 rounded-2xl border border-hb-border-strong bg-white p-2 shadow-floating text-left"
        >
          <div className="px-2.5 pt-1.5 pb-2 border-b border-hb-border">
            <p className="text-hb-xs font-bold text-hb-text-primary">
              홈페이지 색감 모드
            </p>
            <p className="mt-0.5 text-hb-xs text-hb-text-muted">
              고정 색감 없이 사진·계절에 맞춰 전환됩니다
            </p>
          </div>

          <div className="mt-1.5 space-y-1">
            {THEME_OPTIONS.map((option) => {
              const isSelected = preference === option.id;
              const autoBadge =
                option.id === "auto" ? `현재 ${seasonLabel}` : null;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => handleSelect(option.id)}
                  className={`w-full flex items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-hb-warm text-hb-text-primary"
                      : "text-hb-text-secondary hover:bg-hb-surface-muted"
                  }`}
                >
                  <span
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black/15"
                    style={{ backgroundColor: option.swatchBg }}
                    aria-hidden="true"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: option.swatchAccent }}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-hb-xs font-bold text-hb-text-primary">
                        {option.label}
                      </span>
                      {autoBadge && (
                        <span className="rounded bg-hb-surface-muted border border-hb-border px-1.5 py-0.5 text-hb-xs font-semibold text-hb-text-muted">
                          {autoBadge}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-hb-xs text-hb-text-muted leading-snug break-keep">
                      {option.description}
                    </span>
                  </span>

                  {isSelected && (
                    <Icon
                      d={ICON.check}
                      className="w-4 h-4 shrink-0 mt-0.5 text-hb-text-primary"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
