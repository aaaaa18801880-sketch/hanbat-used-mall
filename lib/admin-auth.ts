"use client";

const ADMIN_AUTH_EVENT = "hb:admin-auth-changed";

/**
 * 현재 브라우저에 Supabase Auth 세션 토큰이 저장되어 있는지 동기적으로 확인합니다.
 * - 일반 방문자(99.9%)는 토큰이 없으므로 @supabase/supabase-js 청크(약 239KB)를 초기 로드하지 않습니다.
 */
export function hasSupabaseSessionToken(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("sb-") && key.includes("-auth-token")) {
        const value = window.localStorage.getItem(key);
        if (value && value !== "null" && value !== "{}") {
          return true;
        }
      }
    }
  } catch {
    // 스토리지 접근 제한 환경 무시
  }
  return false;
}

export function notifyAdminAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
}

export function subscribeAdminAuthSignal(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === null ||
      (e.key.startsWith("sb-") && e.key.includes("-auth-token"))
    ) {
      callback();
    }
  };
  window.addEventListener(ADMIN_AUTH_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(ADMIN_AUTH_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export async function getOptionalAdminAuthHeaders(): Promise<
  Record<string, string>
> {
  if (!hasSupabaseSessionToken()) return {};
  const { getAdminAuthHeaders } = await import("./supabase");
  return getAdminAuthHeaders();
}
