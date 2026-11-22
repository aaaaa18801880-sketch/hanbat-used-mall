// 파일 경로: tests/telegram-inbox.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInboxGroups,
  canCommitInboxGroup,
  detectOldSoldProductCleanupTargets,
  mergeInboxGroupWithPrevious,
  normalizeAiGroupingResult,
  orderCommitItemsWithPrimaryExterior,
  pairInboxPhotosByFixedSize,
  parseTelegramWebhookUpdate,
  partitionIndicesForProductSize,
  removePhotoFromInboxGroups,
  sortTelegramPhotosChronologically,
  splitInboxGroupBeforePhoto,
  type TelegramInboxPhoto,
} from "../lib/telegram-inbox";
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
});
