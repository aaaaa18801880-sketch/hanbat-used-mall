// 파일 경로: components/admin/telegram-inbox-media.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { getAdminAuthHeaders } from "../../lib/supabase";
import { ICON, Icon } from "../../lib/icons";
import {
  TELEGRAM_MAX_PHOTOS_PER_PRODUCT,
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

export interface TelegramThumbStore {
  getUrl: (photoId: string) => string | undefined;
  setUrl: (photoId: string, url: string) => void;
  revoke: (photoId: string) => void;
  revokeAll: () => void;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

/**
 * 수집함 탭 수명 동안 썸네일 Blob URL과 인증 헤더를 메모리 캐시로 유지합니다.
 * - 묶음 분할/합치기/페이지 이동으로 카드가 재마운트되어도 이미 받아둔 썸네일을 재다운로드하지 않습니다.
 */
export function createTelegramThumbStore(): TelegramThumbStore {
  const urlMap = new Map<string, string>();
  let cachedHeaders: Record<string, string> | null = null;
  let headersExpiresAt = 0;
  let inflightHeaders: Promise<Record<string, string>> | null = null;
  let disposed = false;

  return {
    getUrl: (photoId) => urlMap.get(photoId),
    setUrl: (photoId, nextUrl) => {
      if (disposed) {
        URL.revokeObjectURL(nextUrl);
        return;
      }
      const prev = urlMap.get(photoId);
      if (prev && prev !== nextUrl) {
        URL.revokeObjectURL(prev);
      }
      urlMap.set(photoId, nextUrl);
    },
    revoke: (photoId) => {
      const prev = urlMap.get(photoId);
      if (prev) {
        URL.revokeObjectURL(prev);
        urlMap.delete(photoId);
      }
    },
    revokeAll: () => {
      disposed = true;
      for (const url of urlMap.values()) {
        URL.revokeObjectURL(url);
      }
      urlMap.clear();
    },
    getAuthHeaders: async () => {
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
  thumbStore: TelegramThumbStore;
  onInspectFull: (photo: TelegramInboxPhoto) => void;
  onSplitBefore: (photoId: string) => void;
  onDiscard: (photoId: string) => void;
}

/**
 * 텔레그램 수집함 개별 사진 타일
 * - /_next/image를 거치지 않고 관리자 Bearer 인증 프록시(320px 썸네일)에서 Blob URL만 지연 로드·캐시합니다.
 */
export function TelegramThumbTile({
  photo,
  indexInGroup,
  disabled,
  thumbStore,
  onInspectFull,
  onSplitBefore,
  onDiscard,
}: TelegramThumbTileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(
    () => thumbStore.getUrl(photo.id) ?? null
  );
  const [inView, setInView] = useState(() =>
    Boolean(thumbStore.getUrl(photo.id))
  );
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadSeq, setReloadSeq] = useState(0);

  useEffect(() => {
    if (inView || thumbUrl) return;
    const node = containerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      let active = true;
      void Promise.resolve().then(() => {
        if (active) setInView(true);
      });
      return () => {
        active = false;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, thumbUrl]);

  useEffect(() => {
    if (!inView || thumbUrl) return;
    let cancelled = false;
    const controller = new AbortController();

    void enqueueThumbLoad(async () => {
      if (cancelled) return;
      const existing = thumbStore.getUrl(photo.id);
      if (existing) {
        setThumbUrl(existing);
        return;
      }

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
      setThumbUrl(nextUrl);
      setLoadFailed(false);
    }).catch(() => {
      if (!cancelled) {
        setLoadFailed(true);
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [inView, photo.id, reloadSeq, thumbStore, thumbUrl]);

  const isOverLimit = indexInGroup >= TELEGRAM_MAX_PHOTOS_PER_PRODUCT;

  return (
    <div
      ref={containerRef}
      className={`rounded-lg border p-2 flex flex-col gap-2 bg-white transition-colors ${
        photo.ai_note
          ? "border-red-300 bg-red-50/40"
          : isOverLimit
          ? "border-amber-300 bg-amber-50/30"
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
              className="h-full w-full object-cover"
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
                setLoadFailed(false);
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

      <div className="mt-auto flex flex-wrap gap-1.5">
        {indexInGroup > 0 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSplitBefore(photo.id)}
            title="이 사진부터 다음 제품 묶음으로 분리합니다"
            className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-[#CBD2DC] bg-[#F9FAFB] px-2 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-white disabled:opacity-40 cursor-pointer"
          >
            <Icon d={ICON.scissors} className="w-3.5 h-3.5" />
            <span>여기서 나누기</span>
          </button>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDiscard(photo.id)}
          title="불필요한 사진 또는 흔들림 컷을 수집함에서 제외합니다"
          className="inline-flex items-center justify-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1.5 text-hb-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-40 cursor-pointer"
        >
          <Icon d={ICON.trash} className="w-3.5 h-3.5" />
          <span>제외</span>
        </button>
      </div>
    </div>
  );
}

interface TelegramFullPreviewModalProps {
  photo: TelegramInboxPhoto | null;
  onClose: () => void;
}

/** 1200px 고해상도 미리보기 모달 (Blob URL 안전 로드 & 해제) */
export function TelegramFullPreviewModal({
  photo,
  onClose,
}: TelegramFullPreviewModalProps) {
  if (!photo) return null;
  return (
    <TelegramFullPreviewContent key={photo.id} photo={photo} onClose={onClose} />
  );
}

function TelegramFullPreviewContent({
  photo,
  onClose,
}: {
  photo: TelegramInboxPhoto;
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
        <div className="flex items-center justify-between gap-2 border-b border-[#E2E6EC] pb-2">
          <div className="text-hb-sm font-bold text-[#141A23]">
            촬영 시각 {new Date(photo.taken_at).toLocaleString("ko-KR")} (
            {photo.source_kind === "document" ? "원본 파일" : "고화질 사진"})
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="미리보기 닫기"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E6EC] text-[#141A23] hover:bg-[#F3F4F6] cursor-pointer"
          >
            <Icon d={ICON.close} className="w-4 h-4" />
          </button>
        </div>

        <div className="flex min-h-[280px] max-h-[72vh] items-center justify-center overflow-hidden rounded-lg bg-[#F4F3F0]">
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
              className="max-h-[70vh] w-auto object-contain"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
