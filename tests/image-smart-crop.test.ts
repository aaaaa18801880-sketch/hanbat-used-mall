// 파일 경로: tests/image-smart-crop.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  STUDIO_PAD_BACKGROUND,
  computeSmartCropPlan,
  formatSmartCropToastSummary,
  parseAnalyzedImageCrops,
  rotateNormalizedBox2D,
} from "../lib/image-smart-crop";

test("parseAnalyzedImageCrops validates coordinates, clamps bounds, and drops degenerate entries", () => {
  const parsed = parseAnalyzedImageCrops([
    { index: 1, role: "product", box_2d: [80, 190, 930, 740] },
    { index: 2, role: "nameplate", box_2d: [220, 160, 620, 810] },
    { index: 2, role: "other", box_2d: [0, 0, 1000, 1000] }, // duplicate index skipped
    { index: 3, role: "product", box_2d: [500, 500, 400, 600] }, // inverted ymin > ymax skipped
    { index: 0, role: "product", box_2d: [100, 100, 500, 500] }, // invalid 0-based index skipped
    { index: 4, role: "unknown", box_2d: [-10, 50, 1050, 950] }, // unknown role -> other, clamped
  ]);

  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed[0], {
    index: 1,
    role: "product",
    box_2d: [80, 190, 930, 740],
  });
  assert.deepEqual(parsed[1], {
    index: 2,
    role: "nameplate",
    box_2d: [220, 160, 620, 810],
  });
  assert.deepEqual(parsed[2], {
    index: 4,
    role: "other",
    box_2d: [0, 50, 1000, 950],
  });
});

test("rotateNormalizedBox2D transforms box_2d accurately for 0/90/180/270 degrees and returns to identity after 4x90", () => {
  const orig: [number, number, number, number] = [100, 200, 400, 700];
  assert.deepEqual(rotateNormalizedBox2D(orig, 0), orig);
  assert.deepEqual(rotateNormalizedBox2D(orig, 90), [200, 600, 700, 900]);
  assert.deepEqual(rotateNormalizedBox2D(orig, 180), [600, 300, 900, 800]);
  assert.deepEqual(rotateNormalizedBox2D(orig, 270), [300, 100, 800, 400]);

  let current = orig;
  for (let i = 0; i < 4; i++) {
    current = rotateNormalizedBox2D(current, 90);
  }
  assert.deepEqual(current, orig);
});

test("computeSmartCropPlan applies 1:1 studio matte padding for tall vertical appliances (prevents square card clipping)", () => {
  // Tall vertical freezer showcase (like 1080x1440 photo, narrow vertical subject)
  const plan = computeSmartCropPlan({
    imgWidth: 1080,
    imgHeight: 1440,
    role: "product",
    box_2d: [120, 240, 880, 680],
  });

  assert.ok(plan);
  assert.equal(plan.role, "product");
  assert.equal(plan.padBackground, STUDIO_PAD_BACKGROUND);
  assert.equal(plan.canvasWidth, plan.canvasHeight); // 1:1 square protected canvas
  assert.ok(plan.destX > 0, "tall product should be horizontally centered with studio side margins");
  assert.equal(plan.enhanceLegibility, false);
});

test("computeSmartCropPlan crops nameplate tightly with legibility boost and no square padding", () => {
  // Angled KC nameplate sticker occupying middle ~30% of 1080x1440 photo
  const plan = computeSmartCropPlan({
    imgWidth: 1080,
    imgHeight: 1440,
    role: "nameplate",
    box_2d: [220, 170, 600, 840],
  });

  assert.ok(plan);
  assert.equal(plan.role, "nameplate");
  assert.equal(plan.padBackground, null);
  assert.equal(plan.enhanceLegibility, true);
  assert.equal(plan.canvasWidth, plan.sw);
  assert.equal(plan.canvasHeight, plan.sh);
  assert.ok(plan.sw < 1080 && plan.sh < 1440);
});

test("computeSmartCropPlan returns tight unpadded crop for balanced aspect ratio products", () => {
  const plan = computeSmartCropPlan({
    imgWidth: 1200,
    imgHeight: 1200,
    role: "product",
    box_2d: [200, 180, 800, 820],
  });

  assert.ok(plan);
  assert.equal(plan.padBackground, null);
  assert.equal(plan.canvasWidth, plan.sw);
  assert.equal(plan.canvasHeight, plan.sh);
});

test("computeSmartCropPlan skips already-tight, tiny/low-res, or multi-item ('other') photos", () => {
  // Already tight (>82% area)
  assert.equal(
    computeSmartCropPlan({
      imgWidth: 1200,
      imgHeight: 1200,
      role: "product",
      box_2d: [30, 30, 960, 960],
    }),
    null
  );

  // Tiny nameplate (<280px long edge)
  assert.equal(
    computeSmartCropPlan({
      imgWidth: 600,
      imgHeight: 600,
      role: "nameplate",
      box_2d: [400, 400, 600, 600],
    }),
    null
  );

  // Ambiguous multi-item pile
  assert.equal(
    computeSmartCropPlan({
      imgWidth: 1200,
      imgHeight: 1200,
      role: "other",
      box_2d: [100, 100, 700, 700],
    }),
    null
  );
});

test("formatSmartCropToastSummary builds accurate Korean summary messages", () => {
  assert.equal(formatSmartCropToastSummary([]), null);
  assert.equal(
    formatSmartCropToastSummary(["product", "nameplate"]),
    "AI 자동 프레이밍 적용 (제품 1장 · 명판 1장) — 썸네일에서 언제든 원본 복구 가능"
  );
  assert.equal(
    formatSmartCropToastSummary(["nameplate"]),
    "AI 자동 프레이밍 적용 (명판 1장) — 썸네일에서 언제든 원본 복구 가능"
  );
});
