"use client";

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import toast from "react-hot-toast";
import { ICON, Icon } from "../../lib/icons";
import {
  STORE,
  buildQuoteBasketSmsBody,
  trackEvent,
  getQuoteBasket,
  EMPTY_QUOTE_BASKET,
  subscribeQuoteBasket,
  type AnalyticsEventName,
  type QuoteBasketItem,
} from "../../lib/site";

const getServerQuoteBasketSnapshot = () => EMPTY_QUOTE_BASKET;

export function useQuoteBasket(): QuoteBasketItem[] {
  return useSyncExternalStore(
    subscribeQuoteBasket,
    getQuoteBasket,
    getServerQuoteBasketSnapshot
  );
}

export async function copyTextAndOpenKakao(
  text: string,
  eventName: AnalyticsEventName,
  eventParams?: Record<string, string | number | boolean | null | undefined>,
  toastMessage = "상품 정보가 복사되었습니다! 카톡 대화창에 붙여넣기(Ctrl+V) 해주세요.",
  duration = 4000
): Promise<void> {
  trackEvent(eventName, eventParams);
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(toastMessage, { duration });
    } catch {
      toast("카카오톡 1:1 상담창을 엽니다.");
    }
  }
  window.open(STORE.kakaoChat, "_blank", "noopener,noreferrer");
}

export async function copyQuoteAndOpenKakao(
  items: QuoteBasketItem[],
  eventName: "click_quote_basket_kakao" | "click_quote_compare_kakao",
  toastMessage: string,
  duration = 4000
): Promise<void> {
  await copyTextAndOpenKakao(
    buildQuoteBasketSmsBody(items),
    eventName,
    { count: items.length },
    toastMessage,
    duration
  );
}

/* ════════════════════════════════════════════════════════════
   1. 브랜드 로고 시스템
   ════════════════════════════════════════════════════════════ */

export function HanbatBrandLogo({
  dark = false,
  size = "default",
}: {
  dark?: boolean;
  size?: "default" | "compact";
}) {
  const primaryInk = dark ? "#FFFFFF" : "#141A23";
  const accentFill = dark ? "#FF8A50" : "#E8521A";

  return (
    <span className="inline-flex items-center gap-2 sm:gap-2.5 select-none">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={
          size === "compact"
            ? "h-7 w-7 shrink-0"
            : "h-8 w-8 sm:h-9 sm:w-9 shrink-0"
        }
      >
        {/* 모듈러 가전 코어 H 심볼 */}
        <rect x="5" y="5" width="9.5" height="30" rx="4.75" fill={primaryInk} />
        <rect x="10" y="17.5" width="20.25" height="8.5" fill={primaryInk} />
        <rect x="25.5" y="17.5" width="9.5" height="17.5" rx="4.75" fill={primaryInk} />
        <rect x="25.5" y="5" width="9.5" height="9.5" rx="4.75" fill={accentFill} />
      </svg>
      <span className="flex flex-col justify-center">
        <span
          className={`font-extrabold tracking-[-0.04em] leading-none transition-colors duration-200 ${
            size === "compact"
              ? "text-hb-lg"
              : "text-hb-lg sm:text-hb-xl"
          } ${dark ? "text-white" : "text-[#141A23]"}`}
        >
          {STORE.name}
        </span>
      </span>
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   2. 안전 이미지 컴포넌트 (SafeImg)
   ════════════════════════════════════════════════════════════ */
export function SafeImg({
  src,
  alt = "",
  className = "",
  eager = false,
  priority,
  ...props
}: Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "className" | "fetchPriority"
> & {
  src?: string | null;
  alt?: string;
  className?: string;
  eager?: boolean;
  priority?: "high" | "low";
}) {
  const [failedSrc, setFailedSrc] = useState<string | null | undefined>(
    undefined
  );
  const error = Boolean(src && failedSrc === src);

  if (!src || error) {
    return (
      <div
        role="img"
        aria-label={alt || "상품 이미지 준비 중"}
        className={`flex flex-col items-center justify-center gap-1 bg-[#F1F3F6] text-[#64748B] text-hb-xs font-medium select-none ${className}`}
      >
        <Icon d={ICON.image} className="w-5 h-5 text-[#94A3B8]/70" />
        <span>이미지 준비 중</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={priority}
      decoding={eager ? "sync" : "async"}
      onError={() => setFailedSrc(src)}
      className={className}
      {...props}
    />
  );
}

/* ════════════════════════════════════════════════════════════
   3. 공통 섹션 헤더 (SectionHeading)
   ════════════════════════════════════════════════════════════ */
export function SectionHeading({
  eyebrow,
  title,
  desc,
  action,
  dark = false,
  className = "",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  desc?: React.ReactNode;
  action?: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`${
        action
          ? "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          : ""
      } ${className}`}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p
            className={`mb-1.5 text-hb-xs sm:text-hb-sm font-bold tracking-[-0.01em] ${
              dark ? "text-[#FF8A50]" : "text-[#C84312]"
            }`}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={`text-hb-xl sm:text-hb-2xl font-bold leading-[1.26] tracking-[-0.025em] break-keep [text-wrap:balance] ${
            dark ? "text-white" : "text-[#141A23]"
          }`}
        >
          {title}
        </h2>
        {desc && (
          <p
            className={`mt-2 max-w-2xl text-hb-sm sm:text-hb-base leading-[1.65] break-keep [text-wrap:pretty] ${
              dark ? "text-white/75" : "text-[#475569]"
            }`}
          >
            {desc}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   4. 접근성 강화 모달 컴포넌트 (Native Top-Layer <dialog>)
   ════════════════════════════════════════════════════════════ */
let cachedDisplayTransitionSupport: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (cachedDisplayTransitionSupport !== undefined) {
    return cachedDisplayTransitionSupport;
  }
  if (
    typeof window === "undefined" ||
    !window.CSS?.supports?.("transition-behavior", "allow-discrete") ||
    !document.body
  ) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText =
    "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = "none";
  cachedDisplayTransitionSupport = getComputedStyle(probe).display === "block";
  probe.remove();
  return cachedDisplayTransitionSupport;
}

function supportsTopLayerExit(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
      window.CSS?.supports?.("overlay", "auto") &&
      canTransitionDisplay()
  );
}

async function waitForTopLayerAnimations(el: HTMLDialogElement) {
  const animations =
    typeof el.getAnimations === "function"
      ? el.getAnimations({ subtree: true })
      : [];
  if (animations.length === 0) return;

  const allFinished = Promise.allSettled(animations.map((a) => a.finished));
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    const signal = AbortSignal.timeout(400);
    await Promise.race([
      allFinished,
      new Promise<void>((resolve) => {
        if (signal.aborted) {
          resolve();
          return;
        }
        signal.addEventListener("abort", () => resolve(), { once: true });
      }),
    ]);
    return;
  }
  await allFinished;
}

export async function closeTopLayerElement(el: HTMLDialogElement) {
  if (!el.open) return;

  if (!supportsTopLayerExit()) {
    el.setAttribute("data-closing", "");
    await waitForTopLayerAnimations(el);
    el.removeAttribute("data-closing");
    if (el.open) el.close();
    return;
  }

  el.close();
  await waitForTopLayerAnimations(el);
}

export function isOutsideDialogBounds(
  clientX: number,
  clientY: number,
  dialog: HTMLDialogElement
): boolean {
  const rect = dialog.getBoundingClientRect();
  return (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  );
}

export function Modal({
  children,
  onClose,
  label = "대화상자",
  panelClassName = "",
  variant = "default",
  sheet = false,
  open = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label?: string;
  panelClassName?: string;
  variant?: "default" | "lightbox";
  sheet?: boolean;
  open?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);
  const isDismissingRef = useRef(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const [closing, setClosing] = useState(false);
  const [dismissedFromDialog, setDismissedFromDialog] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open && dismissedFromDialog) {
      setClosing(false);
      setDismissedFromDialog(false);
    } else {
      setClosing(!open);
      if (open) setDismissedFromDialog(false);
    }
  }

  const dismissWithAnimation = useCallback(async () => {
    const dialog = dialogRef.current;
    if (!dialog || isDismissingRef.current) return;
    isDismissingRef.current = true;
    setClosing(true);
    try {
      await closeTopLayerElement(dialog);
    } finally {
      isDismissingRef.current = false;
      setClosing(false);
    }
    setDismissedFromDialog(true);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      isDismissingRef.current = false;
      dialog.removeAttribute("data-closing");
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          // Ignore invalid dialog state during teardown
        }
      }
      return;
    }

    if (!isDismissingRef.current) {
      let active = true;
      void closeTopLayerElement(dialog).finally(() => {
        if (active) setClosing(false);
      });
      return () => {
        active = false;
      };
    }
  }, [open]);

  const handleDialogPointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    if (!open || !closeOnOverlayClick) return;
    if (typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype) {
      return;
    }
    pressedOutsideRef.current = isOutsideDialogBounds(
      e.clientX,
      e.clientY,
      e.currentTarget
    );
  };

  const handleDialogPointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    if (!open || !closeOnOverlayClick) {
      pressedOutsideRef.current = false;
      return;
    }
    if (typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype) {
      pressedOutsideRef.current = false;
      return;
    }
    if (
      pressedOutsideRef.current &&
      isOutsideDialogBounds(e.clientX, e.clientY, e.currentTarget)
    ) {
      pressedOutsideRef.current = false;
      void dismissWithAnimation();
      return;
    }
    pressedOutsideRef.current = false;
  };

  const closedByValue =
    closeOnOverlayClick && closeOnEsc
      ? "any"
      : closeOnEsc
      ? "closerequest"
      : "none";

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      {...({ closedby: closedByValue } as Record<string, string>)}
      data-variant={variant === "lightbox" ? "lightbox" : undefined}
      onPointerDown={handleDialogPointerDown}
      onPointerUp={handleDialogPointerUp}
      onCancel={(e) => {
        e.preventDefault();
        if (!closeOnEsc) return;
        void dismissWithAnimation();
      }}
      onClose={() => {
        if (!isDismissingRef.current && open) {
          onClose();
        }
      }}
      className={`hb-dialog m-auto w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain bg-transparent p-0 border-0 rounded-2xl focus:outline-none ${
        sheet ? "hb-dialog-sheet" : ""
      } ${panelClassName}`}
    >
      {open || closing ? children : null}
    </dialog>
  );
}
