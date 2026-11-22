// 파일 경로: lib/server-image-sharp.ts
// 서버 전용 고화질 WebP 최적화 · 회전 · 스마트 크롭(1:1 스튜디오 패딩) · 경량 썸네일 변환 모듈

import sharp from "sharp";
import {
  computeSmartCropPlan,
  rotateNormalizedBox2D,
  type AnalyzedImageCrop,
} from "./image-smart-crop";

/**
 * 수집함 미리보기 및 AI 묶음 분류용 경량 WebP/JPEG 변환 (최대 320px)
 */
export async function createTelegramPreviewImage(
  inputBuffer: Buffer,
  options?: { maxEdge?: number; format?: "webp" | "jpeg"; quality?: number }
): Promise<Buffer> {
  const maxEdge = options?.maxEdge ?? 320;
  const format = options?.format ?? "webp";
  const quality = options?.quality ?? (format === "webp" ? 72 : 76);

  const pipeline = sharp(inputBuffer)
    .rotate()
    .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true });

  if (format === "jpeg") {
    return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
  }
  return pipeline.webp({ quality, effort: 3 }).toBuffer();
}

/**
 * Gemini Vision 제품 스펙·명판 판독용 1080px JPEG 변환 (EXIF 회전 선적용)
 */
export async function createAiVisionJpeg(
  inputBuffer: Buffer,
  maxEdge = 1080
): Promise<{ buffer: Buffer; mimeType: "image/jpeg" }> {
  const buffer = await sharp(inputBuffer)
    .rotate()
    .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 76, mozjpeg: true })
    .toBuffer();

  return { buffer, mimeType: "image/jpeg" };
}

/**
 * 텔레그램 고해상도 원본 사진을:
 * 1) EXIF 정방향 + AI 판정 시계방향 회전
 * 2) AI 바운딩박스 기반 제품/명판 스마트 크롭 (+ 세로형 가전 #F4F3F0 1:1 스튜디오 패딩)
 * 3) 백색 가전 하이라이트 보호형 밝기 보정 (어두운 실내 사진만 부드럽게 밝힘)
 * 4) 최대 1440px 리사이즈 + 고화질 WebP (q=86) 압축
 * 하여 용량을 약 1/15로 줄이면서 육안상 원본 수준의 선명한 결과물을 반환합니다.
 */
export async function processTelegramOriginalToProductWebp(params: {
  inputBuffer: Buffer;
  rotateDegrees?: number;
  crop?: AnalyzedImageCrop | null;
  maxEdge?: number;
}): Promise<{ buffer: Buffer; mimeType: "image/webp"; ext: "webp"; cropped: boolean }> {
  const maxEdge = params.maxEdge ?? 1440;
  const rawDeg = typeof params.rotateDegrees === "number" ? params.rotateDegrees : 0;
  const normalizedDeg = ((Math.round(rawDeg) % 360) + 360) % 360;

  // 1) EXIF 정규화 -> buffer 1차 확보 (AI가 EXIF 적용된 Vision JPEG 기준으로 회전 각도를 산출했으므로 동일 순서 보장)
  const exifFixed = await sharp(params.inputBuffer)
    .rotate()
    .toBuffer();

  // 2) AI 판정 추가 시계방향 회전 적용
  const rotatedRes =
    normalizedDeg !== 0
      ? await sharp(exifFixed).rotate(normalizedDeg).toBuffer({ resolveWithObject: true })
      : await sharp(exifFixed).toBuffer({ resolveWithObject: true });

  let workingBuffer = rotatedRes.data;
  let width = rotatedRes.info.width;
  let height = rotatedRes.info.height;
  let cropped = false;

  // 3) AI 스마트 크롭 및 세로형 가전 1:1 스튜디오 여백 프레이밍
  if (params.crop && params.crop.role !== "other") {
    const rotatedBox = rotateNormalizedBox2D(params.crop.box_2d, normalizedDeg);
    const plan = computeSmartCropPlan({
      imgWidth: width,
      imgHeight: height,
      role: params.crop.role,
      box_2d: rotatedBox,
    });

    if (plan) {
      let cropPipe = sharp(workingBuffer).extract({
        left: plan.sx,
        top: plan.sy,
        width: plan.sw,
        height: plan.sh,
      });

      if (plan.enhanceLegibility) {
        cropPipe = cropPipe.modulate({ brightness: 1.03, saturation: 0.96 });
      }

      if (plan.padBackground) {
        const padLeft = Math.max(0, plan.destX);
        const padTop = Math.max(0, plan.destY);
        const padRight = Math.max(0, plan.canvasWidth - plan.sw - padLeft);
        const padBottom = Math.max(0, plan.canvasHeight - plan.sh - padTop);
        cropPipe = cropPipe.extend({
          top: padTop,
          bottom: padBottom,
          left: padLeft,
          right: padRight,
          background: plan.padBackground,
        });
      }

      const cropOut = await cropPipe.toBuffer({ resolveWithObject: true });
      workingBuffer = cropOut.data;
      width = cropOut.info.width;
      height = cropOut.info.height;
      cropped = true;
    }
  }

  // 4) 백색 가전 하이라이트 보호형 밝기 보정 (전체 휘도 평균 확인 후 어두운 실내 사진만 +12% 보정)
  let tonePipeline = sharp(workingBuffer);
  try {
    const stats = await tonePipeline.stats();
    const channels = stats.channels;
    const meanLum =
      channels.length >= 3
        ? 0.299 * channels[0].mean + 0.587 * channels[1].mean + 0.114 * channels[2].mean
        : channels[0]?.mean ?? 128;

    if (meanLum < 105) {
      tonePipeline = sharp(workingBuffer).modulate({
        brightness: 1.12,
        saturation: 1.04,
      });
    } else if (meanLum < 145) {
      tonePipeline = sharp(workingBuffer).modulate({
        brightness: 1.04,
        saturation: 1.03,
      });
    } else {
      tonePipeline = sharp(workingBuffer);
    }
  } catch {
    tonePipeline = sharp(workingBuffer);
  }

  // 5) 최대 1440px 리사이즈 + 선명한 고화질 WebP (q=86) 인코딩
  const finalBuffer = await tonePipeline
    .resize(maxEdge, maxEdge, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 86, effort: 4 })
    .toBuffer();

  return {
    buffer: finalBuffer,
    mimeType: "image/webp",
    ext: "webp",
    cropped,
  };
}
