// 파일 경로: components/admin/telegram-inbox-media.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { getAdminAuthHeaders } from "../../lib/supabase";
import { ICON, Icon } from "../../lib/icons";
import {
  TELEGRAM_MAX_PHOTOS_PER_PRODUCT,
  type QuarterTurnDegrees,
  type TelegramInboxPhoto,
} from "../../lib/telegram-inbox";

/** 동시에 너무 많은 텔레그램 프록시 요청이 몰리지 않도록 최대 8개 동시 로드로 병렬화 */
function createConcurrencyLimiter(limit: number) {
  let active = 0;
  const waiters: Array<() => void> = [];

  return async function runLimited<T>(task: () => Promise<T>): Promise<T> {
    if (active >= limit) {
      await new Promise<void>((resolve) => waiters.push(resolve));
    }
    active++;
    try {
      return await task();
    } finally {
      active--;
      const next = waiters.shift();
      if (next) next();
    }
  };
}

const enqueueThumbLoad = createConcurrencyLimiter(8);

/* ───── 브라우저 영구 썸네일 캐시 (IndexedDB · 24시간 TTL) ───── */
const IDB_NAME = "hanbat_tg_thumb_cache_v1";
const IDB_STORE = "thumbs";
const IDB_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedThumbRecord {
  id: string;
  dataUrl: string;
  savedAt: number;
}

function openThumbDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readCachedThumbsFromIdb(
  dbPromise: Promise<IDBDatabase | null>,
  ids: readonly string[]
): Promise<Record<string, string>> {
  const db = await dbPromise;
  if (!db || ids.length === 0) return {};

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const now = Date.now();
      const found: Record<string, string> = {};
      let pending = ids.length;

      for (const id of ids) {
        const req = store.get(id);
        req.onsuccess = () => {
          const rec = req.result as CachedThumbRecord | undefined;
          if (
            rec &&
            typeof rec.dataUrl === "string" &&
            now - rec.savedAt < IDB_TTL_MS
          ) {
            found[id] = rec.dataUrl;
          }
          pending--;
          if (pending === 0) resolve(found);
        };
        req.onerror = () => {
          pending--;
          if (pending === 0) resolve(found);
        };
      }
    } catch {
      resolve({});
    }
  });
}

async function writeCachedThumbsToIdb(
  dbPromise: Promise<IDBDatabase | null>,
  entries: ReadonlyArray<{ id: string; dataUrl: string }>
): Promise<void> {
  const db = await dbPromise;
  if (!db || entries.length === 0) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const now = Date.now();
      for (const item of entries) {
        if (!item.dataUrl.startsWith("data:")) continue;
        store.put({
          id: item.id,
          dataUrl: item.dataUrl,
          savedAt: now,
        } satisfies CachedThumbRecord);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function deleteCachedThumbFromIdb(
  dbPromise: Promise<IDBDatabase | null>,
  id: string
): Promise<void> {
  const db = await dbPromise;
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export interface TelegramThumbStore {
  getUrl: (photoId: string) => string | undefined;
  hasFailed: (photoId: string) => boolean;
  setUrl: (photoId: string, url: string) => void;
  revoke: (photoId: string) => void;
  revokeAll: () => void;
  revive: () => void;
  prefetchIds: (photoIds: readonly string[]) => Promise<void>;
  subscribe: (listener: () => void) => () => void;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

function revokeIfBlob(url?: string | null) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function getRotationTailwindClass(deg: QuarterTurnDegrees): string {
  if (deg === 90) return "rotate-90";
  if (deg === 180) return "rotate-180";
  if (deg === 270) return "-rotate-90";
  return "";
}

/**
 * 수집함 썸네일 저장소 (메모리 + 브라우저 IndexedDB 24시간 영구 캐시)
 * - 새로고침·탭 재방문 시 이미 받은 썸네일은 Vercel/Telegram 호출 0회로 즉시 복원합니다.
 * - 미캐시 항목만 20장씩 배치 프록시(/thumbs)로 요청해 서버리스 호출을 최소화합니다.
 */
export function createTelegramThumbStore(): TelegramThumbStore {
  const urlMap = new Map<string, string>();
  const pendingSet = new Set<string>();
  const failedSet = new Set<string>();
  const listeners = new Set<() => void>();
  const dbPromise = openThumbDb();
  let cachedHeaders: Record<string, string> | null = null;
  let headersExpiresAt = 0;
  let inflightHeaders: Promise<Record<string, string>> | null = null;
  let disposed = false;

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const getAuthHeadersCached = async (): Promise<Record<string, string>> => {
    const now = Date.now();
    if (cachedHeaders && now < headersExpiresAt) {
      return cachedHeaders;
    }
    if (!inflightHeaders) {
      inflightHeaders = getAdminAuthHeaders()
        .then((h) => {
          cachedHeaders = h;
          headersExpiresAt = Date.now() + 25_000;
          return h;
        })
        .finally(() => {
          inflightHeaders = null;
        });
    }
    return inflightHeaders;
  };

  return {
    getUrl: (photoId) => urlMap.get(photoId),
    hasFailed: (photoId) => failedSet.has(photoId),
    setUrl: (photoId, nextUrl) => {
      if (disposed) {
        revokeIfBlob(nextUrl);
        return;
      }
      const prev = urlMap.get(photoId);
      if (prev && prev !== nextUrl) {
        revokeIfBlob(prev);
      }
      failedSet.delete(photoId);
      urlMap.set(photoId, nextUrl);
      if (nextUrl.startsWith("data:")) {
        void writeCachedThumbsToIdb(dbPromise, [{ id: photoId, dataUrl: nextUrl }]);
      }
      notify();
    },
    revoke: (photoId) => {
      const prev = urlMap.get(photoId);
      if (prev) {
        revokeIfBlob(prev);
        urlMap.delete(photoId);
      }
      failedSet.delete(photoId);
      void deleteCachedThumbFromIdb(dbPromise, photoId);
    },
    revokeAll: () => {
      disposed = true;
      for (const url of urlMap.values()) {
        revokeIfBlob(url);
      }
      urlMap.clear();
      pendingSet.clear();
      failedSet.clear();
      listeners.clear();
    },
    revive: () => {
      disposed = false;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getAuthHeaders: getAuthHeadersCached,
    prefetchIds: async (photoIds) => {
      const candidates = photoIds.filter(
        (id) => !urlMap.has(id) && !pendingSet.has(id) && !failedSet.has(id)
      );
      if (candidates.length === 0 || disposed) return;

      for (const id of candidates) {
        pendingSet.add(id);
      }

      try {
        // 1) 브라우저 IndexedDB에서 이미 받아둔 썸네일을 먼저 즉시 복원 (서버 호출 0회)
        const idbHits = await readCachedThumbsFromIdb(dbPromise, candidates);
        if (disposed) return;

        let hydratedCount = 0;
        const misses: string[] = [];
        for (const id of candidates) {
          const cachedUrl = idbHits[id];
          if (cachedUrl) {
            urlMap.set(id, cachedUrl);
            pendingSet.delete(id);
            hydratedCount++;
          } else {
            misses.push(id);
          }
        }
        if (hydratedCount > 0) {
          notify();
        }

        if (misses.length === 0 || disposed) return;

        // 2) 미캐시 사진만 20장 단위 배치로 서버 요청
        const headers = await getAuthHeadersCached();
        const chunks: string[][] = [];
        for (let i = 0; i < misses.length; i += 20) {
          chunks.push(misses.slice(i, i + 20));
        }

        await Promise.all(
          chunks.map(async (chunk) => {
            if (disposed) return;
            try {
              const res = await fetch("/api/admin/telegram-inbox/thumbs", {
                method: "POST",
                headers: {
                  ...headers,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ ids: chunk }),
              });
              const json = (await res.json().catch(() => ({}))) as {
                thumbs?: Record<string, string>;
              };

              if (!res.ok || !json.thumbs) {
                for (const id of chunk) failedSet.add(id);
                return;
              }

              const toPersist: Array<{ id: string; dataUrl: string }> = [];
              for (const id of chunk) {
                const dataUrl = json.thumbs[id];
                if (dataUrl) {
                  urlMap.set(id, dataUrl);
                  failedSet.delete(id);
                  toPersist.push({ id, dataUrl });
                } else {
                  failedSet.add(id);
                }
              }

              if (toPersist.length > 0) {
                void writeCachedThumbsToIdb(dbPromise, toPersist);
              }
            } catch {
              for (const id of chunk) failedSet.add(id);
            } finally {
              for (const id of chunk) pendingSet.delete(id);
              if (!disposed) notify();
            }
          })
        );
      } finally {
        for (const id of candidates) {
          pendingSet.delete(id);
        }
      }
    },
  };
}

function formatPhotoTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface TelegramThumbTileProps {
  photo: TelegramInboxPhoto;
  indexInGroup: number;
  disabled: boolean;
  rotationDeg: QuarterTurnDegrees;
  thumbStore: TelegramThumbStore;
  onInspectFull: (photo: TelegramInboxPhoto) => void;
  onRotatePhoto: (photoId: string, delta: 90 | -90) => void;
  onSplitBefore: (photoId: string) => void;
  onRePairFromPhoto: (photoId: string) => void;
  onDiscard: (photoId: string) => void;
}

/**
 * 텔레그램 수집함 개별 사진 타일
 * - 배치 프록시(/thumbs) + 브라우저 IndexedDB 캐시를 즉시 표시하고,
 *   원클릭 90도 수동 회전으로 뒤집힌 명판/외관 사진을 등록 전에 바로 교정할 수 있습니다.
 */
export function TelegramThumbTile({
  photo,
  indexInGroup,
  disabled,
  rotationDeg,
  thumbStore,
  onInspectFull,
  onRotatePhoto,
  onSplitBefore,
  onRePairFromPhoto,
  onDiscard,
}: TelegramThumbTileProps) {
  const [, setStoreTick] = useState(0);
  const [manualFailed, setManualFailed] = useState(false);
  const [reloadSeq, setReloadSeq] = useState(0);

  useEffect(() => {
    return thumbStore.subscribe(() => {
      setStoreTick((t) => t + 1);
    });
  }, [thumbStore]);

  useEffect(() => {
    if (reloadSeq === 0) return;
    let cancelled = false;
    const controller = new AbortController();

    void enqueueThumbLoad(async () => {
      if (cancelled) return;
      const headers = await thumbStore.getAuthHeaders();
      const res = await fetch(
        `/api/admin/telegram-inbox/image?id=${encodeURIComponent(photo.id)}&variant=thumb`,
        { headers, signal: controller.signal }
      );
      if (!res.ok) {
        throw new Error(`미리보기 로드 실패 (${res.status})`);
      }
      const blob = await res.blob();
      if (cancelled) return;

      const nextUrl = URL.createObjectURL(blob);
      thumbStore.setUrl(photo.id, nextUrl);
      setManualFailed(false);
    }).catch(() => {
      if (!cancelled) {
        setManualFailed(true);
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [photo.id, reloadSeq, thumbStore]);

  const thumbUrl = thumbStore.getUrl(photo.id) ?? null;
  const loadFailed = manualFailed || (!thumbUrl && thumbStore.hasFailed(photo.id));
  const isOverLimit = indexInGroup >= TELEGRAM_MAX_PHOTOS_PER_PRODUCT;
  const rotateClass = getRotationTailwindClass(rotationDeg);

  return (
    <div
      className={`rounded-lg border p-2 flex flex-col gap-1.5 bg-white transition-colors ${
        photo.ai_note
          ? "border-red-300 bg-red-50/40"
          : isOverLimit
          ? "border-amber-300 bg-amber-50/30"
          : rotationDeg !== 0
          ? "border-[#E8521A]/60 bg-[#FFF9F6]"
          : "border-[#E2E6EC]"
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#F4F3F0] border border-[#E2E6EC]">
        {thumbUrl ? (
          <button
            type="button"
            onClick={() => onInspectFull(photo)}
            aria-label={`${indexInGroup + 1}번 사진 크게 보기`}
            className="block h-full w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-[#141A23]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl}
              alt={`수집 사진 ${indexInGroup + 1}`}
              className={`h-full w-full object-cover transition-transform duration-150 ${rotateClass}`}
              decoding="async"
            />
          </button>
        ) : loadFailed ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2 text-center">
            <span className="text-hb-xs font-semibold text-[#6B7280]">
              불러오기 실패
            </span>
            <button
              type="button"
              onClick={() => {
                setManualFailed(false);
                setReloadSeq((n) => n + 1);
              }}
              className="rounded border border-[#D1D5DB] bg-white px-2 py-1 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23]"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#9CA3AF]">
            <Icon d={ICON.image} className="w-6 h-6 animate-pulse" />
          </div>
        )}

        <span className="absolute left-1.5 top-1.5 rounded bg-[#141A23]/80 px-1.5 py-0.5 text-hb-xs font-bold text-white tabular-nums">
          #{indexInGroup + 1}
        </span>

        {photo.source_kind === "document" && (
          <span className="absolute right-1.5 top-1.5 rounded bg-[#0F766E]/90 px-1.5 py-0.5 text-hb-xs font-bold text-white">
            원본
          </span>
        )}

        {rotationDeg !== 0 && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-[#E8521A] px-1.5 py-0.5 text-hb-xs font-bold text-white tabular-nums shadow-xs">
            {rotationDeg}°
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-1 text-hb-xs text-[#6B7280]">
        <span className="tabular-nums font-medium">
          {formatPhotoTime(photo.taken_at)}
        </span>
        {isOverLimit && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800">
            3장 초과 분리 필요
          </span>
        )}
      </div>

      {photo.ai_note && (
        <p className="rounded border border-red-200 bg-red-50 px-2 py-1 text-hb-xs font-bold text-red-700 leading-snug">
          {photo.ai_note}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRotatePhoto(photo.id, 90)}
          title="시계방향으로 90도 회전합니다 (등록 시 AI보다 수동 회전이 우선 적용됩니다)"
          aria-label={`${indexInGroup + 1}번 사진 시계방향 90도 회전`}
          className={`inline-flex items-center justify-center gap-1 rounded border px-1.5 py-1 text-hb-xs font-bold disabled:opacity-40 cursor-pointer whitespace-nowrap transition-colors ${
            rotationDeg !== 0
              ? "border-[#E8521A] bg-[#FFF4EE] text-[#C84312] hover:bg-[#E8521A] hover:text-white"
              : "border-[#CBD2DC] bg-[#F9FAFB] text-[#141A23] hover:border-[#141A23] hover:bg-white"
          }`}
        >
          <Icon d={ICON.rotate} className="w-3 h-3" />
          <span>{rotationDeg !== 0 ? `${rotationDeg}°` : "회전"}</span>
        </button>

        {indexInGroup > 0 && (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSplitBefore(photo.id)}
              title="이 사진만 새 묶음으로 분리합니다"
              className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-[#CBD2DC] bg-[#F9FAFB] px-1.5 py-1 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-white disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              <Icon d={ICON.scissors} className="w-3 h-3" />
              <span>나누기</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRePairFromPhoto(photo.id)}
              title="이 사진부터 끝까지 뒤의 모든 사진을 2장씩 일괄 재정렬합니다"
              className="inline-flex items-center justify-center gap-1 rounded border border-sky-300 bg-sky-50 px-1.5 py-1 text-hb-xs font-bold text-sky-900 hover:bg-sky-600 hover:text-white disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              <Icon d={ICON.bolt} className="w-3 h-3" />
              <span>뒤 2장씩</span>
            </button>
          </>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDiscard(photo.id)}
          title="불필요한 사진 또는 흔들림 컷을 수집함에서 제외합니다"
          className="inline-flex items-center justify-center gap-1 rounded border border-red-200 bg-red-50 px-1.5 py-1 text-hb-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-40 cursor-pointer whitespace-nowrap"
        >
          <Icon d={ICON.trash} className="w-3 h-3" />
          <span>제외</span>
        </button>
      </div>
    </div>
  );
}

interface TelegramFullPreviewModalProps {
  photo: TelegramInboxPhoto | null;
  rotationDeg: QuarterTurnDegrees;
  onRotatePhoto: (photoId: string, delta: 90 | -90) => void;
  onResetRotation: (photoId: string) => void;
  onClose: () => void;
}

/** 1200px 고해상도 미리보기 모달 (회전 교정 + Blob URL 안전 로드 & 해제) */
export function TelegramFullPreviewModal({
  photo,
  rotationDeg,
  onRotatePhoto,
  onResetRotation,
  onClose,
}: TelegramFullPreviewModalProps) {
  if (!photo) return null;
  return (
    <TelegramFullPreviewContent
      key={photo.id}
      photo={photo}
      rotationDeg={rotationDeg}
      onRotatePhoto={onRotatePhoto}
      onResetRotation={onResetRotation}
      onClose={onClose}
    />
  );
}

function TelegramFullPreviewContent({
  photo,
  rotationDeg,
  onRotatePhoto,
  onResetRotation,
  onClose,
}: {
  photo: TelegramInboxPhoto;
  rotationDeg: QuarterTurnDegrees;
  onRotatePhoto: (photoId: string, delta: 90 | -90) => void;
  onResetRotation: (photoId: string) => void;
  onClose: () => void;
}) {
  const fullUrlRef = useRef<string | null>(null);
  const [fullUrl, setFullUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      try {
        const headers = await getAdminAuthHeaders();
        const res = await fetch(
          `/api/admin/telegram-inbox/image?id=${encodeURIComponent(photo.id)}&variant=full`,
          { headers, signal: controller.signal }
        );
        if (!res.ok) throw new Error(`원본 미리보기를 불러오지 못했습니다 (${res.status}).`);
        const blob = await res.blob();
        if (cancelled) return;
        const nextUrl = URL.createObjectURL(blob);
        if (fullUrlRef.current) {
          URL.revokeObjectURL(fullUrlRef.current);
        }
        fullUrlRef.current = nextUrl;
        setFullUrl(nextUrl);
      } catch (err: unknown) {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : "미리보기 로드 중 오류가 발생했습니다."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [photo.id]);

  useEffect(() => {
    return () => {
      if (fullUrlRef.current) {
        URL.revokeObjectURL(fullUrlRef.current);
        fullUrlRef.current = null;
      }
    };
  }, []);

  const rotateClass = getRotationTailwindClass(rotationDeg);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="수집함 사진 크게 보기"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-3xl w-full rounded-xl bg-white p-4 shadow-2xl space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E6EC] pb-2">
          <div className="text-hb-sm font-bold text-[#141A23]">
            촬영 시각 {new Date(photo.taken_at).toLocaleString("ko-KR")} (
            {photo.source_kind === "document" ? "원본 파일" : "고화질 사진"})
            {rotationDeg !== 0 && (
              <span className="ml-2 rounded bg-[#FFF4EE] px-2 py-0.5 text-hb-xs font-bold text-[#C84312] tabular-nums">
                수동 회전 {rotationDeg}°
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onRotatePhoto(photo.id, -90)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#CBD2DC] bg-[#F9FAFB] px-2.5 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-white cursor-pointer"
            >
              <Icon d={ICON.rotate} className="w-3.5 h-3.5 -scale-x-100" />
              <span>왼쪽 90°</span>
            </button>
            <button
              type="button"
              onClick={() => onRotatePhoto(photo.id, 90)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#141A23] bg-[#141A23] px-2.5 py-1.5 text-hb-xs font-bold text-white hover:bg-[#374151] cursor-pointer"
            >
              <Icon d={ICON.rotate} className="w-3.5 h-3.5" />
              <span>오른쪽 90°</span>
            </button>
            {rotationDeg !== 0 && (
              <button
                type="button"
                onClick={() => onResetRotation(photo.id)}
                className="rounded-lg border border-[#FADCD0] bg-[#FFF4EE] px-2.5 py-1.5 text-hb-xs font-bold text-[#C84312] hover:bg-[#E8521A] hover:text-white cursor-pointer"
              >
                초기화
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="미리보기 닫기"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E6EC] text-[#141A23] hover:bg-[#F3F4F6] cursor-pointer"
            >
              <Icon d={ICON.close} className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex min-h-[280px] h-[68vh] items-center justify-center overflow-hidden rounded-lg bg-[#F4F3F0] p-4">
          {loading ? (
            <span className="text-hb-sm font-semibold text-[#6B7280]">
              텔레그램 고화질 이미지를 불러오는 중입니다...
            </span>
          ) : errorMsg ? (
            <span className="text-hb-sm font-semibold text-red-600">{errorMsg}</span>
          ) : fullUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={fullUrl}
              alt="텔레그램 수집 사진 확대 미리보기"
              className={`max-h-[54vh] max-w-[54vh] object-contain transition-transform duration-150 ${rotateClass}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
