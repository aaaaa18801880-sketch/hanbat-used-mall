// 파일 경로: lib/site/browser-image.ts
// 브라우저 이미지 파일 검증, 압축, 캔버스 회전·톤 보정 및 Blob URL 정리 유틸리티

export function splitImages(value?: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((x): x is string => typeof x === "string" && x.trim() !== "")
      .map((s) => s.trim());
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

export function extractInquiryImages(row: {
  images?: unknown;
  image_url?: unknown;
}): string[] {
  const fromArray = splitImages(row.images);
  if (fromArray.length > 0) return fromArray;
  return splitImages(row.image_url);
}

export const MAX_PHOTOS = 3;
export const MAX_REVIEW_PHOTOS = 5;
export const MAX_FILE_MB = 15;

export function validateImageFiles(
  files: File[],
  maxCount = MAX_PHOTOS
): { ok: File[]; error?: string } {
  const ok: File[] = [];
  let error: string | undefined;
  for (const f of files) {
    if (!f.type.startsWith("image/")) {
      error = "이미지 파일만 첨부할 수 있습니다.";
      continue;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      error = `사진 한 장당 ${MAX_FILE_MB}MB 이하만 첨부할 수 있습니다.`;
      continue;
    }
    ok.push(f);
  }
  if (ok.length > maxCount) {
    error = `사진은 최대 ${maxCount}장까지 첨부할 수 있습니다.`;
    return { ok: ok.slice(0, maxCount), error };
  }
  return { ok, error };
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.onload = (event) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
      img.onload = () => resolve(img);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.78,
  mimeType: "image/jpeg" | "image/webp" = "image/jpeg"
): Promise<Blob> {
  const img = await loadImageFromFile(file);
  let { width, height } = img;
  if (width > height) {
    if (width > maxDim) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    }
  } else if (height > maxDim) {
    width = Math.round((width * maxDim) / height);
    height = maxDim;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    const finish = (blob: Blob | null) => {
      canvas.width = 0;
      canvas.height = 0;
      if (blob) resolve(blob);
      else reject(new Error("이미지 압축에 실패했습니다."));
    };
    canvas.toBlob(
      (blob) => {
        if (blob && (mimeType === "image/jpeg" || blob.type === mimeType)) {
          finish(blob);
          return;
        }
        canvas.toBlob(finish, "image/jpeg", quality);
      },
      mimeType,
      quality
    );
  });
}

interface ImageEnhanceOptions {
  degrees?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  quality?: number;
  adaptiveHighlightGuard?: boolean;
}

/**
 * 상품 사진 업로드 시 기본 자동 적용되는 '쇼룸 스튜디오 톤' 프리셋 (SSOT)
 * - 백색 가전·야외 촬영 시 하이라이트 날림(과노출)을 막기 위해 adaptiveHighlightGuard 활성화
 */
export const PRODUCT_IMAGE_TONE_PRESET = {
  brightness: 1.06,
  contrast: 1.04,
  saturate: 1.04,
  quality: 0.93,
  adaptiveHighlightGuard: true,
} as const satisfies ImageEnhanceOptions;

/**
 * 기본 톤업 위에 한 단계 더 밝게 보정하는 2차 톤업 프리셋 (원터치 스파클 버튼)
 */
export const PRODUCT_IMAGE_TONE_EXTRA = {
  brightness: 1.12,
  contrast: 1.04,
  saturate: 1.02,
  quality: 0.93,
} as const satisfies ImageEnhanceOptions;

/**
 * 이미지 File을 캔버스를 통해 회전 및 스튜디오 광도·대비·선명화 필터를 적용하여 고화질 JPEG File로 변환
 */
export async function enhanceImageFile(
  file: File,
  options: ImageEnhanceOptions = {}
): Promise<File> {
  const {
    degrees = 0,
    brightness = 1.0,
    contrast = 1.0,
    saturate = 1.0,
    quality = 0.92,
    adaptiveHighlightGuard = false,
  } = options;

  const normalizedDeg = ((degrees % 360) + 360) % 360;
  const needsRotate = normalizedDeg !== 0;
  const needsFilter = brightness !== 1.0 || contrast !== 1.0 || saturate !== 1.0;
  if (!needsRotate && !needsFilter) return file;

  const img = await loadImageFromFile(file);
  let resolvedBrightness = brightness;
  let resolvedContrast = contrast;
  let resolvedSaturate = saturate;

  if (adaptiveHighlightGuard && needsFilter) {
    try {
      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = 48;
      sampleCanvas.height = 48;
      const sampleCtx = sampleCanvas.getContext("2d");
      if (sampleCtx) {
        sampleCtx.drawImage(img, 0, 0, 48, 48);
        const { data } = sampleCtx.getImageData(0, 0, 48, 48);
        let sumLum = 0;
        let brightCount = 0;
        const pixelCount = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          sumLum += lum;
          if (lum >= 220) brightCount++;
        }
        const avgLum = sumLum / pixelCount;
        const brightRatio = brightCount / pixelCount;
        if (avgLum >= 155 || brightRatio >= 0.22) {
          // 이미 밝거나 흰색 가전 비중이 높은 사진: 밝기 증폭을 중단해 하이라이트 날림 방지
          resolvedBrightness = 1.0;
          resolvedContrast = Math.min(contrast, 1.03);
          resolvedSaturate = Math.min(saturate, 1.02);
        } else if (avgLum < 105) {
          // 실내·어두운 창고 사진만 부드럽게 밝기 보정
          resolvedBrightness = Math.max(brightness, 1.14);
        }
      }
      sampleCanvas.width = 0;
      sampleCanvas.height = 0;
    } catch {
      // 샘플링 실패 시 기본 프리셋 유지
    }
  }

  const isSwap = normalizedDeg === 90 || normalizedDeg === 270;
  const canvas = document.createElement("canvas");
  canvas.width = isSwap ? img.height : img.width;
  canvas.height = isSwap ? img.width : img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  if (
    resolvedBrightness !== 1.0 ||
    resolvedContrast !== 1.0 ||
    resolvedSaturate !== 1.0
  ) {
    ctx.filter = `brightness(${resolvedBrightness}) contrast(${resolvedContrast}) saturate(${resolvedSaturate})`;
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  if (needsRotate) {
    ctx.rotate((normalizedDeg * Math.PI) / 180);
  }
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        canvas.width = 0;
        canvas.height = 0;
        if (!blob) {
          resolve(file);
          return;
        }
        const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
        resolve(
          new File([blob], cleanName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          })
        );
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * [메모리 누수 원천 차단]
 * 임시 생성된 Blob/Object URL을 안전하게 해제하여 브라우저 메모리 점유 누적 방지
 */
export function revokeObjectUrls(
  urls?: Array<string | null | undefined> | null
): void {
  if (typeof window === "undefined" || !window.URL || !urls) return;
  for (const u of urls) {
    if (u && typeof u === "string" && u.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(u);
      } catch {
        // ignore
      }
    }
  }
}
