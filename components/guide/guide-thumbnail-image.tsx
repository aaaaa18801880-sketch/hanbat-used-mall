// 파일 경로: components/guide/guide-thumbnail-image.tsx
"use client";

import React, { useCallback, useRef, useState } from "react";
import Image, { type ImageLoader } from "next/image";
import {
  MAX_GUIDE_IMAGE_RETRY_STEP,
  buildDirectStaticImageUrl,
  resolveGuideImageAttempt,
} from "../../lib/guides/image-retry";

const directStaticLoader: ImageLoader = ({ src, width }) =>
  buildDirectStaticImageUrl(src, width);

export interface GuideThumbnailImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  baseQuality?: 80 | 85;
  priority?: boolean;
  loading?: "eager" | "lazy";
  fill?: boolean;
  width?: number;
  height?: number;
}

/**
 * Next.js `<Image>` 최적화를 기본 사용하면서,
 * 일시적 `/_next/image` 프록시 지연·동시 요청 탈락 또는 SSR 하이드레이션 이전 오류 발생 시
 * 자동으로 재시도 → 정적 파일 직접 로드로 복구해 깨진 이미지 아이콘 노출을 차단합니다.
 */
export function GuideThumbnailImage({
  src,
  alt,
  sizes,
  className,
  baseQuality = 85,
  priority = false,
  loading,
  fill = false,
  width,
  height,
}: GuideThumbnailImageProps) {
  const [retryState, setRetryState] = useState<{ src: string; step: number }>({
    src,
    step: 0,
  });
  const checkedNodeRef = useRef<HTMLImageElement | null>(null);

  const currentStep = retryState.src === src ? retryState.step : 0;
  const attempt = resolveGuideImageAttempt(currentStep, baseQuality);

  const advanceRetry = useCallback(() => {
    setRetryState((prev) => {
      const prevStep = prev.src === src ? prev.step : 0;
      if (prevStep >= MAX_GUIDE_IMAGE_RETRY_STEP) {
        return prev;
      }
      return { src, step: prevStep + 1 };
    });
  }, [src]);

  // SSR HTML 단계(하이드레이션 이전)에 이미 깨진 상태로 완료된 <img>를 마운트 즉시 감지·복구
  const handleImgRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node || checkedNodeRef.current === node) return;
      checkedNodeRef.current = node;
      if (
        node.complete &&
        node.naturalWidth === 0 &&
        currentStep < MAX_GUIDE_IMAGE_RETRY_STEP
      ) {
        advanceRetry();
      }
    },
    [advanceRetry, currentStep],
  );

  const sharedProps = {
    src,
    sizes,
    quality: attempt.quality,
    priority,
    loading,
    referrerPolicy: "no-referrer" as const,
    className,
    onError: advanceRetry,
    ref: handleImgRef,
    ...(attempt.mode === "direct" ? { loader: directStaticLoader } : {}),
  };

  if (fill) {
    return <Image key={`${src}-${currentStep}`} alt={alt} {...sharedProps} fill />;
  }

  return (
    <Image
      key={`${src}-${currentStep}`}
      alt={alt}
      {...sharedProps}
      width={width ?? 1280}
      height={height ?? 720}
    />
  );
}
