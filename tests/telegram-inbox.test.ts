// 파일 경로: tests/telegram-inbox.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInboxGroups,
  canCommitInboxGroup,
  chunkTelegramItems,
  detectOldSoldProductCleanupTargets,
  filterActiveRoomPendingPhotos,
  isGroupOrderCustomized,
  mergeInboxGroupWithPrevious,
  normalizeAiGroupingResult,
  normalizeQuarterTurnDegrees,
  orderCommitInboxPhotos,
  orderCommitItemsWithPrimaryExterior,
  pairInboxPhotosByFixedSize,
  parseTelegramWebhookUpdate,
  partitionIndicesForProductSize,
  removePhotoFromInboxGroups,
  removePhotosFromInboxGroups,
  rePairInboxFromPhoto,
  resolvePhotoCommitRotations,
  sanitizeManualRotationMap,
  sortTelegramPhotosChronologically,
  splitInboxGroupBeforePhoto,
  stepQuarterTurnDegrees,
  swapInboxGroupPhotos,
  type TelegramInboxPhoto,
} from "../lib/telegram-inbox";
import sharp from "sharp";
import {
  computeOrientedDimensions,
  computeScaledCropAndPad,
  createAiVisionJpeg,
  processTelegramOriginalToProductWebp,
} from "../lib/server-image-sharp";
import {
  computeCategoryCounts,
  filterAndSortGalleryProducts,
} from "../lib/gallery-filter";
import {
  computeAdminMetrics,
  filterAdminProducts,
} from "../lib/admin-metrics";
import {
  isProductPendingReview,
  normalizeProductStatus,
  PRODUCT_STATUS,
} from "../lib/site";

function makePhoto(
  id: string,
  overrides: Partial<TelegramInboxPhoto> = {}
): TelegramInboxPhoto {
  return {
    id,
    telegram_update_id: 100,
    chat_id: "-1001234567890",
    message_id: Number(id.replace(/\D/g, "")) || 1,
    media_group_id: null,
    file_id: `file_${id}`,
    file_unique_id: `uniq_${id}`,
    thumb_file_id: `thumb_${id}`,
    source_kind: "photo",
    mime_type: "image/jpeg",
    file_size: 102400,
    width: 1440,
    height: 1080,
    group_key: null,
    sort_order: 0,
    status: "pending",
    committed_product_id: null,
    ai_note: null,
    taken_at: "2026-11-22T01:00:00.000Z",
    created_at: "2026-11-22T01:00:01.000Z",
    ...overrides,
  };
}

test("parseTelegramWebhookUpdate extracts highest-res photo, 320px thumb, and image documents while rejecting wrong chats", () => {
  const expectedChat = "-100999888777";

  const photoUpdate = {
    update_id: 5001,
    message: {
      message_id: 12,
      media_group_id: "album_abc",
      date: 1795260000,
      chat: { id: -100999888777 },
      photo: [
        { file_id: "f_90", file_unique_id: "u_90", width: 90, height: 68 },
        { file_id: "f_320", file_unique_id: "u_320", width: 320, height: 240 },
        { file_id: "f_800", file_unique_id: "u_800", width: 800, height: 600 },
        { file_id: "f_1280", file_unique_id: "u_1280", width: 1280, height: 960, file_size: 210000 },
      ],
    },
  };

  const photoRes = parseTelegramWebhookUpdate(photoUpdate, expectedChat);
  assert.equal(photoRes.matched, true);
  if (photoRes.matched) {
    assert.equal(photoRes.photo.fileId, "f_1280");
    assert.equal(photoRes.photo.thumbFileId, "f_320");
    assert.equal(photoRes.photo.sourceKind, "photo");
    assert.equal(photoRes.photo.mediaGroupId, "album_abc");
  }

  const docUpdate = {
    update_id: 5002,
    message: {
      message_id: 13,
      date: 1795260005,
      chat: { id: -100999888777 },
      document: {
        file_id: "doc_raw_1",
        file_unique_id: "doc_uniq_1",
        file_name: "IMG_1022.HEIC",
        mime_type: "application/octet-stream",
        file_size: 3500000,
        thumbnail: { file_id: "doc_thumb_1", width: 320, height: 240 },
      },
    },
  };

  const docRes = parseTelegramWebhookUpdate(docUpdate, expectedChat);
  assert.equal(docRes.matched, true);
  if (docRes.matched) {
    assert.equal(docRes.photo.fileId, "doc_raw_1");
    assert.equal(docRes.photo.thumbFileId, "doc_thumb_1");
    assert.equal(docRes.photo.sourceKind, "document");
  }

  const mismatchRes = parseTelegramWebhookUpdate(
    {
      update_id: 5003,
      message: { message_id: 1, date: 1795260010, chat: { id: -100111 }, photo: [] },
    },
    expectedChat
  );
  assert.deepEqual(mismatchRes, { matched: false, reason: "chat_mismatch" });

  const textRes = parseTelegramWebhookUpdate(
    {
      update_id: 5004,
      message: { message_id: 2, date: 1795260011, chat: { id: -100999888777 }, text: "hello" },
    },
    expectedChat
  );
  assert.deepEqual(textRes, { matched: false, reason: "not_image" });
});

test("splitInboxGroupBeforePhoto, mergeInboxGroupWithPrevious, and removePhotoFromInboxGroups keep group integrity", () => {
  const photos = sortTelegramPhotosChronologically([
    makePhoto("p3", { message_id: 3, taken_at: "2026-11-22T01:02:00.000Z" }),
    makePhoto("p1", { message_id: 1, taken_at: "2026-11-22T01:00:00.000Z" }),
    makePhoto("p2", { message_id: 2, taken_at: "2026-11-22T01:01:00.000Z" }),
    makePhoto("p4", { message_id: 4, taken_at: "2026-11-22T01:02:30.000Z" }),
  ]);

  const initialGroups = buildInboxGroups(photos);
  assert.equal(initialGroups.length, 1);
  assert.deepEqual(
    initialGroups[0].photos.map((p) => p.id),
    ["p1", "p2", "p3", "p4"]
  );

  // 첫 번째 사진 앞에서 나누기는 no-op
  const noopSplit = splitInboxGroupBeforePhoto(initialGroups, "p1", "111");
  assert.equal(noopSplit.changed, false);

  // p3 앞에서 나누면 [p1, p2], [p3, p4]로 분리
  const splitRes = splitInboxGroupBeforePhoto(initialGroups, "p3", "222");
  assert.equal(splitRes.changed, true);
  assert.equal(splitRes.groups.length, 2);
  assert.deepEqual(
    splitRes.groups.map((g) => g.photos.map((p) => p.id)),
    [
      ["p1", "p2"],
      ["p3", "p4"],
    ]
  );
  assert.deepEqual(
    splitRes.updates.map((u) => u.sort_order),
    [1, 2, 3, 4]
  );

  // 합치기
  const merged = mergeInboxGroupWithPrevious(splitRes.groups, 1);
  assert.equal(merged.changed, true);
  assert.equal(merged.groups.length, 1);
  assert.deepEqual(
    merged.groups[0].photos.map((p) => p.id),
    ["p1", "p2", "p3", "p4"]
  );

  // 제외(삭제) 시 빈 그룹 정리 확인
  const afterRemove1 = removePhotoFromInboxGroups(splitRes.groups, "p3");
  const afterRemove2 = removePhotoFromInboxGroups(afterRemove1, "p4");
  assert.equal(afterRemove2.length, 1);
  assert.deepEqual(
    afterRemove2[0].photos.map((p) => p.id),
    ["p1", "p2"]
  );
});

test("normalizeAiGroupingResult prevents dropped/duplicated indices and attaches AI bad-photo notes", () => {
  const ordered = [
    makePhoto("a1", { message_id: 1, taken_at: "2026-11-22T02:00:00.000Z" }),
    makePhoto("a2", { message_id: 2, taken_at: "2026-11-22T02:00:10.000Z" }),
    makePhoto("a3", { message_id: 3, taken_at: "2026-11-22T02:01:00.000Z" }),
    makePhoto("a4", { message_id: 4, taken_at: "2026-11-22T02:01:10.000Z" }),
  ];

  const normalized = normalizeAiGroupingResult({
    orderedPhotos: ordered,
    // a3는 duplicate, a4는 AI 응답에서 누락된 케이스
    rawGroups: [
      [1, 2],
      { indices: [2, 3] },
    ],
    rawBadPhotos: [{ index: 2, reason: "바닥만 찍힌 사진" }],
    batchSeed: "seed01",
  });

  assert.equal(normalized.updates.length, 4);
  assert.deepEqual(
    normalized.updates.map((u) => u.id),
    ["a1", "a2", "a3", "a4"]
  );
  assert.equal(normalized.badNotesById.a2, "바닥만 찍힌 사진");
  assert.equal(normalized.groupCount, 3);
});

test("detectOldSoldProductCleanupTargets preserves primary image and skips recent or non-sold items", () => {
  const now = new Date("2026-11-22T00:00:00.000Z").getTime();
  const targets = detectOldSoldProductCleanupTargets(
    [
      {
        id: "old-multi",
        title: "90일 지난 냉장고",
        category: "냉장고",
        status: "판매완료",
        image_url:
          "https://cdn.example/1.webp,https://cdn.example/2.webp,https://cdn.example/3.webp",
        created_at: "2026-06-01T00:00:00.000Z",
      },
      {
        id: "old-single",
        title: "사진 1장만 있는 판매완료",
        category: "냉장고",
        status: "판매완료",
        image_url: "https://cdn.example/only.webp",
        created_at: "2026-05-01T00:00:00.000Z",
      },
      {
        id: "recent-sold",
        title: "최근 판매완료",
        category: "세탁기/건조기",
        status: "판매완료",
        image_url: "https://cdn.example/a.webp,https://cdn.example/b.webp",
        created_at: "2026-11-01T00:00:00.000Z",
      },
      {
        id: "old-delivery",
        title: "배송인증 사례",
        category: "배송인증",
        status: "판매완료",
        image_url: "https://cdn.example/d1.webp,https://cdn.example/d2.webp",
        created_at: "2026-04-01T00:00:00.000Z",
      },
      {
        id: "old-selling",
        title: "아직 판매중",
        category: "냉장고",
        status: "판매중",
        image_url: "https://cdn.example/s1.webp,https://cdn.example/s2.webp",
        created_at: "2026-04-01T00:00:00.000Z",
      },
    ],
    { minAgeDays: 90, nowMs: now }
  );

  assert.equal(targets.length, 1);
  assert.equal(targets[0].productId, "old-multi");
  assert.equal(targets[0].primaryImageUrl, "https://cdn.example/1.webp");
  assert.deepEqual(targets[0].removableUrls, [
    "https://cdn.example/2.webp",
    "https://cdn.example/3.webp",
  ]);
});

test("pending review status (검수대기) is counted in admin metrics and completely excluded from customer gallery", () => {
  assert.equal(isProductPendingReview(PRODUCT_STATUS.PENDING_REVIEW), true);
  assert.equal(normalizeProductStatus("pending_review"), "검수대기");
  assert.equal(normalizeProductStatus("검수대기"), "검수대기");

  const products = [
    {
      id: "pub-1",
      title: "캐리어 인버터 냉난방기",
      price: 550000,
      category: "에어컨/냉난방기",
      status: "판매중",
      created_at: "2026-11-20T00:00:00.000Z",
    },
    {
      id: "draft-1",
      title: "비공개 검수대기 냉장고",
      price: 0,
      category: "냉장고",
      status: "검수대기",
      created_at: "2026-11-22T00:00:00.000Z",
    },
  ];

  const counts = computeCategoryCounts(products);
  assert.equal(counts.전체, 1);
  assert.equal(counts["냉장고"] ?? 0, 0);

  const visible = filterAndSortGalleryProducts(products, {
    activeCategory: "전체",
    statusFilter: "all",
    effectivePriceRange: "all",
    search: "",
    sort: "latest",
  });
  assert.deepEqual(
    visible.map((p) => p.id),
    ["pub-1"]
  );

  const metrics = computeAdminMetrics([], products, []);
  assert.equal(metrics.pendingReviewProducts, 1);
  assert.equal(metrics.sellingProducts, 1);
  assert.equal(metrics.totalProducts, 2);

  const adminPending = filterAdminProducts(products, {
    categoryFilter: "전체",
    statusFilter: PRODUCT_STATUS.PENDING_REVIEW,
    keyword: "",
  });
  assert.deepEqual(
    adminPending.map((p) => p.id),
    ["draft-1"]
  );
});

test("2-photo default partitioning, 3-photo commit guard, and exterior primary ordering protect multi-product batches", () => {
  assert.deepEqual(partitionIndicesForProductSize([1, 2]), [[1, 2]]);
  assert.deepEqual(partitionIndicesForProductSize([1, 2, 3]), [[1, 2, 3]]);
  assert.deepEqual(partitionIndicesForProductSize([1, 2, 3, 4]), [
    [1, 2],
    [3, 4],
  ]);
  assert.deepEqual(partitionIndicesForProductSize([1, 2, 3, 4, 5]), [
    [1, 2],
    [3, 4, 5],
  ]);

  const oversizedPhotos = [1, 2, 3, 4, 5, 6].map((n) =>
    makePhoto(`o${n}`, { message_id: n })
  );
  const aiRes = normalizeAiGroupingResult({
    orderedPhotos: oversizedPhotos,
    rawGroups: [[1, 2, 3, 4], [5, 6]],
    rawBadPhotos: [],
    batchSeed: "pair",
  });
  assert.equal(aiRes.groupCount, 3);
  assert.deepEqual(aiRes.lastGroupPhotoIds, ["o5", "o6"]);

  assert.equal(
    canCommitInboxGroup({
      groupKey: "g2",
      photos: oversizedPhotos.slice(0, 2),
      takenFrom: "",
      takenTo: "",
    }).allowed,
    true
  );
  assert.deepEqual(
    canCommitInboxGroup({
      groupKey: "g4",
      photos: oversizedPhotos.slice(0, 4),
      takenFrom: "",
      takenTo: "",
    }),
    { allowed: false, reason: "too_many_photos" }
  );

  const ordered = orderCommitItemsWithPrimaryExterior([
    { id: "label-first", role: "nameplate" as const },
    { id: "exterior-second", role: "product" as const },
  ]);
  assert.deepEqual(
    ordered.map((x) => x.id),
    ["exterior-second", "label-first"]
  );

  // 최소 diff changedUpdates 및 비용 0원 2장씩 즉시 묶기 검증
  const grouped4 = [1, 2, 3, 4].map((n) =>
    makePhoto(`d${n}`, {
      message_id: n,
      group_key: n <= 2 ? "g1" : "g2",
    })
  );
  const built = buildInboxGroups(grouped4);
  const mergedMinimal = mergeInboxGroupWithPrevious(built, 1);
  assert.deepEqual(mergedMinimal.changedUpdates, [
    { id: "d3", group_key: "g1" },
    { id: "d4", group_key: "g1" },
  ]);

  const fivePhotos = [1, 2, 3, 4, 5].map((n) =>
    makePhoto(`f${n}`, { message_id: n })
  );
  const fixedPairs = pairInboxPhotosByFixedSize(fivePhotos, 2, "fix");
  assert.equal(fixedPairs.groupCount, 3);
  assert.deepEqual(
    fixedPairs.updates.map((u) => u.group_key),
    ["pair_fix_1", "pair_fix_1", "pair_fix_2", "pair_fix_2", "pair_fix_3"]
  );

  // 도미노 밀림 1클릭 복구(rePairInboxFromPhoto) 검증:
  // #1: [p1, p2, p3], #2: [p4, p5], #3: [p6, p7] -> p3부터 2장씩 재정렬 시
  // #1: [p1, p2] (유지), #2: [p3, p4], #3: [p5, p6], #4: [p7]
  const shifted = buildInboxGroups([
    makePhoto("p1", { message_id: 1, group_key: "g1" }),
    makePhoto("p2", { message_id: 2, group_key: "g1" }),
    makePhoto("p3", { message_id: 3, group_key: "g1" }),
    makePhoto("p4", { message_id: 4, group_key: "g2" }),
    makePhoto("p5", { message_id: 5, group_key: "g2" }),
    makePhoto("p6", { message_id: 6, group_key: "g3" }),
    makePhoto("p7", { message_id: 7, group_key: "g3" }),
  ]);
  const repaired = rePairInboxFromPhoto(shifted, "p3", 2, "rep");
  assert.equal(repaired.changed, true);
  assert.deepEqual(
    repaired.groups.map((g) => g.photos.map((p) => p.id)),
    [["p1", "p2"], ["p3", "p4"], ["p5", "p6"], ["p7"]]
  );
  assert.deepEqual(
    repaired.changedUpdates.map((u) => u.id),
    ["p3", "p4", "p5", "p6", "p7"]
  );
});

test("manual quarter-turn rotation helpers sanitize inputs and override AI rotation without double-flipping", () => {
  assert.equal(normalizeQuarterTurnDegrees(0), 0);
  assert.equal(normalizeQuarterTurnDegrees(90), 90);
  assert.equal(normalizeQuarterTurnDegrees(-90), 270);
  assert.equal(normalizeQuarterTurnDegrees(450), 90);
  assert.equal(normalizeQuarterTurnDegrees("180"), 180);
  assert.equal(normalizeQuarterTurnDegrees(Number.NaN), 0);

  assert.equal(stepQuarterTurnDegrees(0, 90), 90);
  assert.equal(stepQuarterTurnDegrees(270, 90), 0);
  assert.equal(stepQuarterTurnDegrees(0, -90), 270);

  assert.deepEqual(
    sanitizeManualRotationMap(
      { p1: 90, p2: 0, p3: -90, evil: 180 },
      ["p1", "p2", "p3"]
    ),
    { p1: 90, p3: 270 }
  );

  // 수동 회전이 지정되면 AI 판독 전에 선적용(preAiDeg)하고 AI 추가 회전은 무시(postAiDeg=0)
  assert.deepEqual(
    resolvePhotoCommitRotations({ manualDeg: 180, aiDeg: 90 }),
    { preAiDeg: 180, postAiDeg: 0, totalDeg: 180 }
  );

  // 수동 회전이 0도이면 AI 판정 회전만 사후 적용
  assert.deepEqual(
    resolvePhotoCommitRotations({ manualDeg: 0, aiDeg: 270 }),
    { preAiDeg: 0, postAiDeg: 270, totalDeg: 270 }
  );
});

test("single-pass Sharp pipeline preserves EXIF + manual rotation, smart crop box alignment, and studio square padding", async () => {
  assert.deepEqual(
    computeOrientedDimensions({
      width: 4000,
      height: 2000,
      exifOrientation: 6,
      extraRotateDegrees: 0,
    }),
    { width: 2000, height: 4000 }
  );
  assert.deepEqual(
    computeOrientedDimensions({
      width: 4000,
      height: 2000,
      exifOrientation: 6,
      extraRotateDegrees: 90,
    }),
    { width: 4000, height: 2000 }
  );

  const scaledPad = computeScaledCropAndPad(
    {
      role: "product",
      sx: 100,
      sy: 50,
      sw: 1000,
      sh: 2000,
      canvasWidth: 2174,
      canvasHeight: 2174,
      destX: 587,
      destY: 87,
      destW: 1000,
      destH: 2000,
      padBackground: "#F4F3F0",
      enhanceLegibility: false,
    },
    1440
  );
  assert.equal(scaledPad.targetW + scaledPad.padLeft + scaledPad.padRight, 1440);
  assert.equal(scaledPad.targetH + scaledPad.padTop + scaledPad.padBottom, 1440);

  // 1600x800 가로 이미지(왼쪽 빨강, 오른쪽 파랑)에 EXIF 6(90도 CW -> 세로 800x1600, 위 빨강/아래 파랑) 부여
  const leftRed = await sharp({
    create: { width: 800, height: 800, channels: 3, background: { r: 220, g: 30, b: 30 } },
  })
    .png()
    .toBuffer();
  const exifVertical = await sharp({
    create: { width: 1600, height: 800, channels: 3, background: { r: 30, g: 30, b: 220 } },
  })
    .composite([{ input: leftRed, left: 0, top: 0 }])
    .withMetadata({ orientation: 6 })
    .jpeg({ quality: 92 })
    .toBuffer();

  // 사용자가 수집함에서 180도 수동 회전한 경우 -> Vision JPEG는 위 파랑/아래 빨강으로 정방향 전송되어야 함
  const vision = await createAiVisionJpeg(exifVertical, 1080, 180);
  const visionMeta = await sharp(vision.buffer).metadata();
  assert.equal(visionMeta.width, 540);
  assert.equal(visionMeta.height, 1080);
  assert.ok(vision.meanLum > 0 && vision.meanLum < 255);

  const visionRaw = await sharp(vision.buffer).raw().toBuffer({ resolveWithObject: true });
  const topMidIdx = (200 * visionRaw.info.width + Math.floor(visionRaw.info.width / 2)) * 3;
  // 위쪽이 파랑(B > R)인지 검증
  assert.ok(
    visionRaw.data[topMidIdx + 2] > visionRaw.data[topMidIdx] + 100,
    "180도 수동 회전이 Vision JPEG에 선적용되어 상단이 파랑이어야 함"
  );

  // 최종 WebP 단일 패스 변환 (수동 회전 180도, AI 추가 회전 0도 -> boxRotateDegrees=0)
  const webpRes = await processTelegramOriginalToProductWebp({
    inputBuffer: exifVertical,
    rotateDegrees: 180,
    boxRotateDegrees: 0,
    precomputedMeanLum: vision.meanLum,
    crop: {
      index: 1,
      role: "product",
      box_2d: [100, 150, 900, 850],
    },
    maxEdge: 1440,
  });

  assert.equal(webpRes.mimeType, "image/webp");
  assert.equal(webpRes.cropped, true);
  const outMeta = await sharp(webpRes.buffer).metadata();
  assert.ok((outMeta.width ?? 0) <= 1440 && (outMeta.height ?? 0) <= 1440);
  assert.equal(outMeta.width, outMeta.height, "세로형 제품 크롭은 1:1 스튜디오 정사각 패딩 적용");
});

test("filterActiveRoomPendingPhotos keeps only pending photos in target room and chunks large updates", () => {
  const mixed = [
    makePhoto("room-ok-2", { chat_id: "-1004315003815", message_id: 20, status: "pending" }),
    makePhoto("room-ok-1", { chat_id: "-1004315003815", message_id: 10, status: "pending" }),
    makePhoto("room-discarded", { chat_id: "-1004315003815", message_id: 15, status: "discarded" }),
    makePhoto("room-committed", { chat_id: "-1004315003815", message_id: 16, status: "committed" }),
    makePhoto("other-room", { chat_id: "-1009999999999", message_id: 5, status: "pending" }),
  ];

  const active = filterActiveRoomPendingPhotos(mixed, "-1004315003815");
  assert.deepEqual(
    active.map((p) => p.id),
    ["room-ok-1", "room-ok-2"]
  );

  const ids = Array.from({ length: 423 }, (_, i) => `id-${i}`);
  const chunks = chunkTelegramItems(ids, 250);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].length, 250);
  assert.equal(chunks[1].length, 173);
});

test("swapInboxGroupPhotos swaps photos persistently across reloads and protects manual commit order", () => {
  const initialPhotos = [
    makePhoto("label-first", {
      message_id: 100,
      sort_order: 100,
      group_key: "g47",
      taken_at: "2026-11-22T12:22:01.000Z",
    }),
    makePhoto("exterior-second", {
      message_id: 101,
      sort_order: 101,
      group_key: "g47",
      taken_at: "2026-11-22T12:22:02.000Z",
    }),
    makePhoto("next-prod", {
      message_id: 102,
      sort_order: 102,
      group_key: "g48",
      taken_at: "2026-11-22T12:22:03.000Z",
    }),
  ];

  const groups = buildInboxGroups(initialPhotos);
  assert.deepEqual(
    groups[0].photos.map((p) => p.id),
    ["label-first", "exterior-second"]
  );
  assert.equal(isGroupOrderCustomized(groups[0].photos), false);

  const swapped = swapInboxGroupPhotos(groups, "g47", 0, 1);
  assert.equal(swapped.changed, true);
  assert.deepEqual(
    swapped.groups[0].photos.map((p) => p.id),
    ["exterior-second", "label-first"]
  );
  assert.equal(isGroupOrderCustomized(swapped.groups[0].photos), true);

  // DB 재조회 시뮬레이션: buildInboxGroups가 묶음 경계와 교환된 sort_order 순서를 모두 보존해야 함
  const reloadedGroups = buildInboxGroups(swapped.photos);
  assert.equal(reloadedGroups.length, 2);
  assert.deepEqual(
    reloadedGroups[0].photos.map((p) => p.id),
    ["exterior-second", "label-first"]
  );
  assert.deepEqual(
    reloadedGroups[1].photos.map((p) => p.id),
    ["next-prod"]
  );

  // 커밋 API 정렬: 역순으로 내려온 DB 행에서도 requestedIds + sort_order 기준 유지
  const commitOrdered = orderCommitInboxPhotos(
    [initialPhotos[0], swapped.photos[0]],
    ["exterior-second", "label-first"]
  );
  assert.deepEqual(
    commitOrdered.map((p) => p.id),
    ["exterior-second", "label-first"]
  );

  // AI 배치 경계 간 sort_order 충돌(17,18 + 1,2) 병합 시에도 앞뒤 순서 보존
  const batchBoundaryGroups = buildInboxGroups([
    makePhoto("b1", { message_id: 1, sort_order: 17, group_key: "ai_1" }),
    makePhoto("b2", { message_id: 2, sort_order: 18, group_key: "ai_1" }),
    makePhoto("b3", { message_id: 3, sort_order: 1, group_key: "ai_2" }),
    makePhoto("b4", { message_id: 4, sort_order: 2, group_key: "ai_2" }),
  ]);
  const mergedAcrossBatches = mergeInboxGroupWithPrevious(batchBoundaryGroups, 1);
  assert.equal(mergedAcrossBatches.changed, true);
  assert.deepEqual(
    mergedAcrossBatches.groups[0].photos.map((p) => p.id),
    ["b1", "b2", "b3", "b4"]
  );

  // 선택 묶음 다건 제외 (O(N) 단일 패스) 검증
  const multiGroups = buildInboxGroups([
    makePhoto("m1", { message_id: 1, group_key: "g1" }),
    makePhoto("m2", { message_id: 2, group_key: "g1" }),
    makePhoto("m3", { message_id: 3, group_key: "g2" }),
    makePhoto("m4", { message_id: 4, group_key: "g2" }),
    makePhoto("m5", { message_id: 5, group_key: "g3" }),
  ]);
  const afterBulkDiscard = removePhotosFromInboxGroups(multiGroups, [
    "m1",
    "m2",
    "m4",
  ]);
  assert.deepEqual(
    afterBulkDiscard.map((g) => g.photos.map((p) => p.id)),
    [["m3"], ["m5"]]
  );
});
