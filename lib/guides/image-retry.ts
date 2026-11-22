// 파일 경로: lib/guides/image-retry.ts
// 정보 게시판 이미지 로딩 실패(프록시 타임아웃·동시 변환 지연 등) 시 단계별 자동 복구 로직

export const MAX_GUIDE_IMAGE_RETRY_STEP = 2;

export type GuideImageAttemptMode = "optimized" | "direct";

export interface GuideImageAttempt {
  mode: GuideImageAttemptMode;
  quality: number;
}

/**
 * 0단계: Next.js 기본 이미지 최적화(baseQuality)
 * 1단계: 화이트리스트 내 다른 quality로 재시도(브라우저 실패 캐시 우회)
 * 2단계: 동일 로컬 정적 파일 직접 로드(프록시 /_next/image 장애 시 최종 복구)
 */
export function resolveGuideImageAttempt(
  step: number,
  baseQuality: 80 | 85 = 85,
): GuideImageAttempt {
  if (step <= 0) {
    return { mode: "optimized", quality: baseQuality };
  }
  if (step === 1) {
    return {
      mode: "optimized",
      quality: baseQuality === 85 ? 80 : 75,
    };
  }
  return { mode: "direct", quality: baseQuality };
}

export function buildDirectStaticImageUrl(src: string, width: number): string {
  const safeWidth = Number.isFinite(width) && width > 0 ? Math.round(width) : 1280;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}w=${safeWidth}`;
}
