// 파일 경로: lib/image-smart-crop.ts
// Gemini Vision 바운딩 박스([ymin, xmin, ymax, xmax], 0~1000 정규화) 기반
// 제품 본체·명판 스티커 안전 자동 크롭 및 1:1 갤러리 비율 보호 순수 로직 + Canvas 렌더러

export type ImageCropRole = "product" | "nameplate" | "other";

/** Gemini Vision 표준 정규화 바운딩 박스 [ymin, xmin, ymax, xmax] (0..1000) */
export type NormalizedBox2D = [number, number, number, number];

export interface AnalyzedImageCrop {
  /** 1-based 이미지 인덱스 (업로드 순서 기준) */
  index: number;
  role: ImageCropRole;
  box_2d: NormalizedBox2D;
}

export interface SmartCropPlan {
  role: "product" | "nameplate";
  /** 원본 이미지 내 잘라낼 사각형 (px) */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** 최종 출력 캔버스 크기 (px) */
  canvasWidth: number;
  canvasHeight: number;
  /** 캔버스 내 크롭 이미지 배치 좌표 (px) */
  destX: number;
  destY: number;
  destW: number;
  destH: number;
  /** 세로형·초광폭 가전의 1:1 갤러리 카드 잘림 방지용 여백 배경색 (없으면 null) */
  padBackground: string | null;
  /** 명판 텍스트 가독성 보조 필터 적용 여부 */
  enhanceLegibility: boolean;
}

/** 업로드 썸네일별 원본 보존 및 원클릭 토글 상태 */
export interface PhotoCropState {
  role: "product" | "nameplate";
  /** true: 자동 크롭본 적용 중, false: 원본으로 복구됨 */
  active: boolean;
  croppedFile: File;
  originalFile: File;
  paddedSquare: boolean;
}

export const STUDIO_PAD_BACKGROUND = "#F4F3F0";

const PRODUCT_PADDING_RATIO = 0.12;
const NAMEPLATE_PADDING_RATIO = 0.08;
const PRODUCT_MAX_SKIP_AREA_RATIO = 0.82;
const NAMEPLATE_MAX_SKIP_AREA_RATIO = 0.86;
const PRODUCT_MIN_AREA_RATIO = 0.08;
const NAMEPLATE_MIN_AREA_RATIO = 0.03;
const PRODUCT_MIN_LONG_EDGE_PX = 480;
const PRODUCT_MIN_SHORT_EDGE_PX = 320;
const NAMEPLATE_MIN_LONG_EDGE_PX = 280;
const TALL_PRODUCT_ASPECT_THRESHOLD = 0.72;
const WIDE_PRODUCT_ASPECT_THRESHOLD = 1.45;
const STUDIO_SQUARE_FILL_RATIO = 0.92;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isValidRole(value: unknown): value is ImageCropRole {
  return value === "product" || value === "nameplate" || value === "other";
}

/**
 * AI 응답 JSON에서 imageCrops 배열을 안전하게 파싱·정규화합니다.
 */
export function parseAnalyzedImageCrops(raw: unknown): AnalyzedImageCrop[] {
  if (!Array.isArray(raw)) return [];

  const result: AnalyzedImageCrop[] = [];
  const seenIndices = new Set<number>();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const index = typeof obj.index === "number" ? Math.round(obj.index) : 0;
    if (index < 1 || seenIndices.has(index)) continue;

    const rawRole = typeof obj.role === "string" ? obj.role.trim().toLowerCase() : "";
    const role: ImageCropRole = isValidRole(rawRole) ? rawRole : "other";

    const rawBox = obj.box_2d;
    if (!Array.isArray(rawBox) || rawBox.length !== 4) continue;

    const nums = rawBox.map((n) => (typeof n === "number" ? n : Number(n)));
    if (nums.some((n) => !Number.isFinite(n))) continue;

    const ymin = clamp(Math.round(nums[0]), 0, 1000);
    const xmin = clamp(Math.round(nums[1]), 0, 1000);
    const ymax = clamp(Math.round(nums[2]), 0, 1000);
    const xmax = clamp(Math.round(nums[3]), 0, 1000);

    if (ymax <= ymin || xmax <= xmin) continue;

    seenIndices.add(index);
    result.push({
      index,
      role,
      box_2d: [ymin, xmin, ymax, xmax],
    });
  }

  return result;
}

/**
 * 이미지가 시계방향으로 회전(0/90/180/270도)된 경우,
 * 회전 전 원본 이미지 기준의 정규화 box_2d([ymin, xmin, ymax, xmax])를
 * 회전 후 좌표계로 정확히 변환합니다.
 */
export function rotateNormalizedBox2D(
  box: NormalizedBox2D,
  clockwiseDegrees: number
): NormalizedBox2D {
  const deg = ((Math.round(clockwiseDegrees) % 360) + 360) % 360;
  const [ymin, xmin, ymax, xmax] = box;

  if (deg === 90) {
    // (y, x) -> (x, 1000 - y)
    return [xmin, 1000 - ymax, xmax, 1000 - ymin];
  }
  if (deg === 180) {
    // (y, x) -> (1000 - y, 1000 - x)
    return [1000 - ymax, 1000 - xmax, 1000 - ymin, 1000 - xmin];
  }
  if (deg === 270) {
    // (y, x) -> (1000 - x, y)
    return [1000 - xmax, ymin, 1000 - xmin, ymax];
  }
  return [ymin, xmin, ymax, xmax];
}

/**
 * 원본 이미지 해상도와 AI가 감지한 영역 좌표를 바탕으로
 * 안전 가드레일(이미 꽉 찬 사진 스킵, 저화질 확대 방지, 세로형 가전 1:1 비율 보호)이
 * 적용된 크롭 계획을 계산합니다. 크롭이 불필요하거나 부적합하면 null을 반환합니다.
 */
export function computeSmartCropPlan(params: {
  imgWidth: number;
  imgHeight: number;
  role: ImageCropRole;
  box_2d: NormalizedBox2D;
}): SmartCropPlan | null {
  const { imgWidth, imgHeight, role, box_2d } = params;
  if (role === "other") return null;
  if (
    !Number.isFinite(imgWidth) ||
    !Number.isFinite(imgHeight) ||
    imgWidth <= 0 ||
    imgHeight <= 0
  ) {
    return null;
  }

  const [ymin, xmin, ymax, xmax] = box_2d;
  if (ymax <= ymin || xmax <= xmin) return null;

  const rawWFrac = (xmax - xmin) / 1000;
  const rawHFrac = (ymax - ymin) / 1000;
  const areaRatio = rawWFrac * rawHFrac;

  if (role === "product") {
    if (areaRatio >= PRODUCT_MAX_SKIP_AREA_RATIO || areaRatio < PRODUCT_MIN_AREA_RATIO) {
      return null;
    }
  } else {
    if (
      areaRatio >= NAMEPLATE_MAX_SKIP_AREA_RATIO ||
      areaRatio < NAMEPLATE_MIN_AREA_RATIO
    ) {
      return null;
    }
  }

  const rawLeft = (xmin / 1000) * imgWidth;
  const rawTop = (ymin / 1000) * imgHeight;
  const rawW = rawWFrac * imgWidth;
  const rawH = rawHFrac * imgHeight;

  const padRatio =
    role === "nameplate" ? NAMEPLATE_PADDING_RATIO : PRODUCT_PADDING_RATIO;
  const padX = rawW * padRatio;
  const padY = rawH * padRatio;

  const sx = Math.round(clamp(rawLeft - padX, 0, imgWidth - 1));
  const sy = Math.round(clamp(rawTop - padY, 0, imgHeight - 1));
  const right = Math.round(clamp(rawLeft + rawW + padX, sx + 1, imgWidth));
  const bottom = Math.round(clamp(rawTop + rawH + padY, sy + 1, imgHeight));

  const sw = right - sx;
  const sh = bottom - sy;

  // 크롭 결과가 원본과 사실상 동일하면(92% 이상) 불필요한 재인코딩 생략
  if ((sw * sh) / (imgWidth * imgHeight) >= 0.92) {
    return null;
  }

  // 저화질 확대 방지 가드
  const longEdge = Math.max(sw, sh);
  const shortEdge = Math.min(sw, sh);
  if (role === "nameplate") {
    if (longEdge < NAMEPLATE_MIN_LONG_EDGE_PX) return null;
    return {
      role: "nameplate",
      sx,
      sy,
      sw,
      sh,
      canvasWidth: sw,
      canvasHeight: sh,
      destX: 0,
      destY: 0,
      destW: sw,
      destH: sh,
      padBackground: null,
      enhanceLegibility: true,
    };
  }

  if (longEdge < PRODUCT_MIN_LONG_EDGE_PX && shortEdge < PRODUCT_MIN_SHORT_EDGE_PX) {
    return null;
  }

  // 세로형 냉장고·쇼케이스·스탠드 에어컨 또는 초광폭 테이블 냉장고의
  // 1:1 갤러리 카드 잘림을 방지하기 위해 정사각 스튜디오 여백 프레이밍 적용
  const aspect = sw / sh;
  const needsStudioSquarePad =
    aspect < TALL_PRODUCT_ASPECT_THRESHOLD ||
    aspect > WIDE_PRODUCT_ASPECT_THRESHOLD;

  if (needsStudioSquarePad) {
    const side = Math.round(longEdge / STUDIO_SQUARE_FILL_RATIO);
    const destX = Math.round((side - sw) / 2);
    const destY = Math.round((side - sh) / 2);
    return {
      role: "product",
      sx,
      sy,
      sw,
      sh,
      canvasWidth: side,
      canvasHeight: side,
      destX,
      destY,
      destW: sw,
      destH: sh,
      padBackground: STUDIO_PAD_BACKGROUND,
      enhanceLegibility: false,
    };
  }

  return {
    role: "product",
    sx,
    sy,
    sw,
    sh,
    canvasWidth: sw,
    canvasHeight: sh,
    destX: 0,
    destY: 0,
    destW: sw,
    destH: sh,
    padBackground: null,
    enhanceLegibility: false,
  };
}

/** 자동 크롭 적용 결과 사용자 안내 토스트 메시지 생성 */
export function formatSmartCropToastSummary(
  appliedRoles: ReadonlyArray<"product" | "nameplate">
): string | null {
  if (appliedRoles.length === 0) return null;
  const productCount = appliedRoles.filter((r) => r === "product").length;
  const nameplateCount = appliedRoles.filter((r) => r === "nameplate").length;
  const parts: string[] = [];
  if (productCount > 0) parts.push(`제품 ${productCount}장`);
  if (nameplateCount > 0) parts.push(`명판 ${nameplateCount}장`);
  return `AI 자동 프레이밍 적용 (${parts.join(" · ")}) — 썸네일에서 언제든 원본 복구 가능`;
}

function loadBrowserImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * 브라우저 환경에서 SmartCropPlan에 따라 이미지 File을 크롭(필요 시 1:1 스튜디오 패딩·명판 선명화)하여
 * 새 JPEG File로 반환합니다.
 */
export async function applySmartCropToImageFile(
  file: File,
  crop: AnalyzedImageCrop,
  appliedRotationDeg = 0
): Promise<{ file: File; plan: SmartCropPlan } | null> {
  if (typeof window === "undefined") return null;

  const img = await loadBrowserImage(file);
  const rotatedBox = rotateNormalizedBox2D(crop.box_2d, appliedRotationDeg);
  const plan = computeSmartCropPlan({
    imgWidth: img.naturalWidth || img.width,
    imgHeight: img.naturalHeight || img.height,
    role: crop.role,
    box_2d: rotatedBox,
  });

  if (!plan) return null;

  const canvas = document.createElement("canvas");
  canvas.width = plan.canvasWidth;
  canvas.height = plan.canvasHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (plan.padBackground) {
    ctx.fillStyle = plan.padBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (plan.enhanceLegibility) {
    // 명판 텍스트 가독성 향상 (과도한 왜곡 없이 깔끔한 대비 보정)
    ctx.filter = "brightness(1.03) contrast(1.12) saturate(0.96)";
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    plan.sx,
    plan.sy,
    plan.sw,
    plan.sh,
    plan.destX,
    plan.destY,
    plan.destW,
    plan.destH
  );

  const croppedFile = await new Promise<File | null>((resolve) => {
    canvas.toBlob(
      (blob) => {
        canvas.width = 0;
        canvas.height = 0;
        if (!blob) {
          resolve(null);
          return;
        }
        const suffix = plan.role === "nameplate" ? "_nameplate" : "_framed";
        const cleanName = file.name.replace(/\.[^/.]+$/, "") + `${suffix}.jpg`;
        resolve(
          new File([blob], cleanName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          })
        );
      },
      "image/jpeg",
      0.93
    );
  });

  if (!croppedFile) return null;
  return { file: croppedFile, plan };
}
