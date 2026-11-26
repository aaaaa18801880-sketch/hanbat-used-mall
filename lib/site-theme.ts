// 파일 경로: lib/site-theme.ts

export type ResolvedThemeId =
  | "clean"
  | "summer"
  | "spring-autumn"
  | "winter";

export type ThemePreference = "auto" | ResolvedThemeId;

export interface ThemeOptionMeta {
  id: ThemePreference;
  label: string;
  shortLabel: string;
  description: string;
  swatchBg: string;
  swatchAccent: string;
}

export const THEME_STORAGE_KEY = "hb_site_theme_pref_v1";
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "clean";

export const THEME_OPTIONS: readonly ThemeOptionMeta[] = [
  {
    id: "clean",
    label: "클린 화이트",
    shortLabel: "화이트",
    description: "색을 비운 순백·차콜 캔버스 (실물 사진 중심)",
    swatchBg: "#FFFFFF",
    swatchAccent: "#111827",
  },
  {
    id: "auto",
    label: "계절 자동",
    shortLabel: "계절자동",
    description: "여름(에어컨)·봄가을(이사)·겨울(난방) 자동 전환",
    swatchBg: "#F3F8FC",
    swatchAccent: "#1F6F5B",
  },
  {
    id: "summer",
    label: "여름 · 아이스 쿨",
    shortLabel: "쿨블루",
    description: "에어컨 성수기에 어울리는 시원한 아쿠아 톤",
    swatchBg: "#F2F8FD",
    swatchAccent: "#0369A1",
  },
  {
    id: "spring-autumn",
    label: "봄·가을 · 세이지",
    shortLabel: "세이지",
    description: "이사·입주·창업철에 차분한 세이지 뉴트럴",
    swatchBg: "#F4F7F5",
    swatchAccent: "#1F6F5B",
  },
  {
    id: "winter",
    label: "겨울 · 웜 아이보리",
    shortLabel: "웜아이보리",
    description: "난방·건조기 시즌의 포근한 아이보리·테라코타",
    swatchBg: "#FAF6F0",
    swatchAccent: "#B84A1C",
  },
] as const;

const VALID_PREFERENCES: ReadonlySet<string> = new Set<ThemePreference>([
  "auto",
  "clean",
  "summer",
  "spring-autumn",
  "winter",
]);

export function isValidThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && VALID_PREFERENCES.has(value);
}

/**
 * 월(1~12)을 기준으로 한밭중고전자 시즌 테마를 반환합니다.
 * - 6~8월: 여름(에어컨 성수기) -> summer
 * - 12~2월: 겨울(난방·건조기 시즌) -> winter
 * - 3~5월, 9~11월: 봄·가을(이사·창업철) -> spring-autumn
 */
export function resolveSeasonThemeByMonth(month1To12: number): ResolvedThemeId {
  const m = Math.trunc(month1To12);
  if (m >= 6 && m <= 8) return "summer";
  if (m === 12 || m === 1 || m === 2) return "winter";
  return "spring-autumn";
}

export function getSeasonKoreanName(month1To12: number): string {
  const m = Math.trunc(month1To12);
  if (m >= 6 && m <= 8) return "여름";
  if (m === 12 || m === 1 || m === 2) return "겨울";
  if (m >= 3 && m <= 5) return "봄";
  return "가을";
}

export function resolveActiveTheme(
  preference: ThemePreference,
  now: Date = new Date()
): ResolvedThemeId {
  if (preference === "auto") {
    return resolveSeasonThemeByMonth(now.getMonth() + 1);
  }
  return preference;
}

export function getThemeMeta(id: ThemePreference): ThemeOptionMeta {
  return THEME_OPTIONS.find((item) => item.id === id) ?? THEME_OPTIONS[0];
}

export function readStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return DEFAULT_THEME_PREFERENCE;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidThemePreference(raw)) return raw;
  } catch {
    // Ignore storage access errors in restricted iframes
  }
  return DEFAULT_THEME_PREFERENCE;
}

export const THEME_CHANGE_EVENT = "hb-theme-change";

export function subscribeThemeChange(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key === THEME_STORAGE_KEY) listener();
  };
  window.addEventListener(THEME_CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function applyThemePreference(
  preference: ThemePreference,
  now: Date = new Date()
): ResolvedThemeId {
  const safePref = isValidThemePreference(preference)
    ? preference
    : DEFAULT_THEME_PREFERENCE;
  const resolved = resolveActiveTheme(safePref, now);

  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-hb-theme", resolved);
    document.documentElement.setAttribute("data-hb-theme-pref", safePref);
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, safePref);
    } catch {
      // Ignore storage write errors
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }
  return resolved;
}

/**
 * 첫 페인트 전 테마 깜빡임(FOUC)을 방지하는 경량 인라인 초기화 스크립트 문자열.
 */
export function buildThemeInitInlineScript(): string {
  return `
    (function(){
      try {
        var key = '${THEME_STORAGE_KEY}';
        var raw = window.localStorage.getItem(key) || '${DEFAULT_THEME_PREFERENCE}';
        var valid = { auto: 1, clean: 1, summer: 1, 'spring-autumn': 1, winter: 1 };
        var pref = valid[raw] ? raw : '${DEFAULT_THEME_PREFERENCE}';
        var resolved = pref;
        if (pref === 'auto') {
          var m = new Date().getMonth() + 1;
          resolved = (m >= 6 && m <= 8) ? 'summer' : (m === 12 || m === 1 || m === 2) ? 'winter' : 'spring-autumn';
        }
        document.documentElement.setAttribute('data-hb-theme', resolved);
        document.documentElement.setAttribute('data-hb-theme-pref', pref);
      } catch (e) {
        document.documentElement.setAttribute('data-hb-theme', '${DEFAULT_THEME_PREFERENCE}');
      }
    })();
  `.trim();
}
