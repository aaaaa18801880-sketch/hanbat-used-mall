// 파일 경로: lib/server-image-sharp.ts
// 서버 전용 고화질 WebP 최적화 · 단일 패스 회전/스마트 크롭(1:1 스튜디오 패딩) · 경량 썸네일 변환 모듈

import sharp from "sharp";
import {
  computeSmartCropPlan,
  rotateNormalizedBox2D,
  type AnalyzedImageCrop,
  type SmartCropPlan,
} from "./image-smart-crop";
import {
  normalizeQuarterTurnDegrees,
  type QuarterTurnDegrees,
} from "./telegram-inbox";

/**
 * EXIF orientation(5~8은 가로/세로 축 전환)과 추가 시계방향 회전(90/270)을 반영해
 * 픽셀 디코딩 없이 최종 정방향 이미지 해상도를 계산합니다.
 */
export function computeOrientedDimensions(params: {
  width: number;
  height: number;
  exifOrientation?: number | null;
  extraRotateDegrees?: number;
}): { width: number; height: number } {
  const { width, height, exifOrientation, extraRotateDegrees = 0 } = params;
  const exifSwaps =
    exifOrientation === 5 ||
    exifOrientation === 6 ||
    exifOrientation === 7 ||
    exifOrientation === 8;

  let w = exifSwaps ? height : width;
  let h = exifSwaps ? width : height;

  const deg = normalizeQuarterTurnDegrees(extraRotateDegrees);
  if (deg === 90 || deg === 270) {
    const tmp = w;
    w = h;
    h = tmp;
  }

  return { width: w, height: h };
}

/**
 * Sharp 단일 파이프라인(extract -> resize -> extend)이 최종 maxEdge를 정확히 만족하도록
 * 크롭 대상 리사이즈 크기와 축소 비율이 반영된 여백(px)을 계산합니다.
 */
export function computeScaledCropAndPad(
  plan: SmartCropPlan,
  maxEdge: number
): {
  targetW: number;
  targetH: number;
  padTop: number;
  padBottom: number;
  padLeft: number;
  padRight: number;
} {
  const canvasLong = Math.max(plan.canvasWidth, plan.canvasHeight);
  const scale = canvasLong > maxEdge ? maxEdge / canvasLong : 1;

  const targetW = Math.max(1, Math.round(plan.sw * scale));
  const targetH = Math.max(1, Math.round(plan.sh * scale));

  if (!plan.padBackground) {
    return {
      targetW,
      targetH,
      padTop: 0,
      padBottom: 0,
      padLeft: 0,
      padRight: 0,
    };
  }

  const targetCanvasW = Math.max(targetW, Math.round(plan.canvasWidth * scale));
  const targetCanvasH = Math.max(targetH, Math.round(plan.canvasHeight * scale));
  const padLeft = Math.floor((targetCanvasW - targetW) / 2);
  const padRight = Math.max(0, targetCanvasW - targetW - padLeft);
  const padTop = Math.floor((targetCanvasH - targetH) / 2);
  const padBottom = Math.max(0, targetCanvasH - targetH - padTop);

  return {
    targetW,
    targetH,
    padTop,
    padBottom,
    padLeft,
    padRight,
  };
}

/**
 * 저해상도 버퍼(예: 이미 생성된 1080px Vision JPEG)의 평균 휘도(0~255)를 빠르게 산출합니다.
 * - 12MP 원본을 다시 디코딩하지 않고 밝기 보정 여부를 결정하기 위해 사용합니다.
 */
export async function computeBufferMeanLuminance(
  imageBuffer: Buffer
): Promise<number> {
  try {
    const stats = await sharp(imageBuffer).stats();
    const channels = stats.channels;
    if (channels.length >= 3) {
      return (
        0.299 * channels[0].mean +
        0.587 * channels[1].mean +
        0.114 * channels[2].mean
      );
    }
    return channels[0]?.mean ?? 128;
  } catch {
    return 128;
  }
}

/**
 * EXIF 자동 정방향 + 선택적 시계방향 회전이 적용된 Sharp 파이프라인을 생성합니다.
 */
function createOrientedSharp(
  inputBuffer: Buffer,
  rotateDegrees: QuarterTurnDegrees
): ReturnType<typeof sharp> {
  const pipe = sharp(inputBuffer, { failOn: "none" }).autoOrient();
  return rotateDegrees !== 0 ? pipe.rotate(rotateDegrees) : pipe;
}

/**
 * 수집함 미리보기 및 AI 묶음 분류용 경량 WebP/JPEG 변환 (최대 320px)
 * - 서버 CPU 소모를 줄이기 위해 effort=1 / 기본 JPEG 인코더를 사용합니다.
 */
export async function createTelegramPreviewImage(
  inputBuffer: Buffer,
  options?: { maxEdge?: number; format?: "webp" | "jpeg"; quality?: number }
): Promise<Buffer> {
  const maxEdge = options?.maxEdge ?? 320;
  const format = options?.format ?? "webp";
  const quality = options?.quality ?? (format === "webp" ? 68 : 74);

  const pipeline = sharp(inputBuffer, { failOn: "none" })
    .autoOrient()
    .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true });

  if (format === "jpeg") {
    return pipeline.jpeg({ quality }).toBuffer();
  }
  return pipeline.webp({ quality, effort: 1 }).toBuffer();
}

/**
 * Gemini Vision 제품 스펙·명판 판독용 1080px JPEG 변환
 * - EXIF 정규화 및 수집함 수동 회전(manualRotateDegrees)을 선적용해 뒤집힌 명판도 정방향으로 AI에 전달합니다.
 * - 동시에 1080px 버퍼 기준 평균 휘도(meanLum)를 계산해 최종 WebP 단계의 중복 디코딩을 제거합니다.
 */
export async function createAiVisionJpeg(
  inputBuffer: Buffer,
  maxEdge = 1080,
  manualRotateDegrees = 0
): Promise<{ buffer: Buffer; mimeType: "image/jpeg"; meanLum: number }> {
  const deg = normalizeQuarterTurnDegrees(manualRotateDegrees);
  const buffer = await createOrientedSharp(inputBuffer, deg)
    .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 76 })
    .toBuffer();

  const meanLum = await computeBufferMeanLuminance(buffer);
  return { buffer, mimeType: "image/jpeg", meanLum };
}

/**
 * 텔레그램 고해상도 원본 사진을 단일 libvips 파이프라인으로 처리합니다:
 * 1) 메타데이터 기반 정방향 해상도 산출 (픽셀 디코딩 없음)
 * 2) EXIF 정방향 + 수동/AI 회전 + 스마트 크롭(extract) + 1440px 리사이즈 + 1:1 스튜디오 패딩(extend)
 * 3) 백색 가전 하이라이트 보호형 밝기 보정 (사전 산출 meanLum 재사용)
 * 4) 고화질 WebP(q=84, effort=2) 1회 최종 인코딩
 */
export async function processTelegramOriginalToProductWebp(params: {
  inputBuffer: Buffer;
  /** 원본(EXIF 정규화 이후) 기준 최종 시계방향 회전 각도 (수동 + AI 합산) */
  rotateDegrees?: number;
  /** Gemini가 본 이미지 기준으로 추가 회전된 각도 (box_2d 좌표 변환용, 미지정 시 rotateDegrees 사용) */
  boxRotateDegrees?: number;
  crop?: AnalyzedImageCrop | null;
  maxEdge?: number;
  /** createAiVisionJpeg에서 미리 구한 평균 휘도(0~255) — 원본 재디코딩 방지 */
  precomputedMeanLum?: number;
}): Promise<{ buffer: Buffer; mimeType: "image/webp"; ext: "webp"; cropped: boolean }> {
  const maxEdge = params.maxEdge ?? 1440;
  const totalDeg = normalizeQuarterTurnDegrees(params.rotateDegrees);
  const boxDeg = normalizeQuarterTurnDegrees(
    params.boxRotateDegrees !== undefined ? params.boxRotateDegrees : totalDeg
  );

  // 1) 헤더 메타데이터만 읽어 회전 후 해상도 산출 (~1ms, 픽셀 디코딩 없음)
  let plan: SmartCropPlan | null = null;
  if (params.crop && params.crop.role !== "other") {
    try {
      const meta = await sharp(params.inputBuffer, { failOn: "none" }).metadata();
      if (meta.width && meta.height) {
        const oriented = computeOrientedDimensions({
          width: meta.width,
          height: meta.height,
          exifOrientation: meta.orientation,
          extraRotateDegrees: totalDeg,
        });
        const rotatedBox = rotateNormalizedBox2D(params.crop.box_2d, boxDeg);
        plan = computeSmartCropPlan({
          imgWidth: oriented.width,
          imgHeight: oriented.height,
          role: params.crop.role,
          box_2d: rotatedBox,
        });
      }
    } catch {
      plan = null;
    }
  }

  // 2) 밝기 보정 계수 결정 (precomputedMeanLum이 있으면 추가 디코딩 0회)
  const meanLum =
    typeof params.precomputedMeanLum === "number" &&
    Number.isFinite(params.precomputedMeanLum)
      ? params.precomputedMeanLum
      : await computeBufferMeanLuminance(
          await createTelegramPreviewImage(params.inputBuffer, {
            maxEdge: 160,
            format: "jpeg",
            quality: 60,
          })
        );

  let brightness = 1;
  let saturation = 1;
  if (meanLum < 105) {
    brightness = 1.12;
    saturation = 1.04;
  } else if (meanLum < 145) {
    brightness = 1.04;
    saturation = 1.03;
  }
  if (plan?.enhanceLegibility) {
    brightness = Math.min(1.15, Number((brightness * 1.03).toFixed(3)));
    saturation = Number((saturation * 0.96).toFixed(3));
  }

  // 3) 단일 libvips 파이프라인 실행 (중간 JPEG/PNG 버퍼 왕복 제거 -> CPU·RAM 약 75% 절감)
  const runPipeline = async (activePlan: SmartCropPlan | null): Promise<Buffer> => {
    let pipe = createOrientedSharp(params.inputBuffer, totalDeg);

    if (activePlan) {
      const scaled = computeScaledCropAndPad(activePlan, maxEdge);
      pipe = pipe
        .extract({
          left: activePlan.sx,
          top: activePlan.sy,
          width: activePlan.sw,
          height: activePlan.sh,
        })
        .resize(scaled.targetW, scaled.targetH, { fit: "fill" });

      if (brightness !== 1 || saturation !== 1) {
        pipe = pipe.modulate({ brightness, saturation });
      }

      if (
        activePlan.padBackground &&
        (scaled.padTop > 0 ||
          scaled.padBottom > 0 ||
          scaled.padLeft > 0 ||
          scaled.padRight > 0)
      ) {
        pipe = pipe.extend({
          top: scaled.padTop,
          bottom: scaled.padBottom,
          left: scaled.padLeft,
          right: scaled.padRight,
          background: activePlan.padBackground,
        });
      }
    } else {
      pipe = pipe.resize(maxEdge, maxEdge, {
        fit: "inside",
        withoutEnlargement: true,
      });
      if (brightness !== 1 || saturation !== 1) {
        pipe = pipe.modulate({ brightness, saturation });
      }
    }

    return pipe.webp({ quality: 84, effort: 2 }).toBuffer();
  };

  let finalBuffer: Buffer;
  let cropped = Boolean(plan);
  try {
    finalBuffer = await runPipeline(plan);
  } catch {
    // 비표준 EXIF 헤더 등으로 extract 경계가 어긋날 경우 원본 전체 단일 패스로 안전 폴백
    cropped = false;
    finalBuffer = await runPipeline(null);
  }

  return {
    buffer: finalBuffer,
    mimeType: "image/webp",
    ext: "webp",
    cropped,
  };
}
