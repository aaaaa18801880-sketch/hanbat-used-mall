import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  collectReferencedStoragePathsByBucket,
  detectOrphanStorageObjects,
  formatBytesCompact,
  normalizeStorageObjectPath,
} from "../lib/storage-orphan";

describe("lib/storage-orphan 고아 Storage 파일 안전 판별", () => {
  it("상품·문의 DB에 참조된 모든 버킷 경로(public/signed/URL인코딩 포함)를 정확히 보호한다", () => {
    const refs = collectReferencedStoragePathsByBucket({
      productImageUrls: [
        "https://abc.supabase.co/storage/v1/object/public/inquiries/prod_1.webp,https://abc.supabase.co/storage/v1/object/public/product-images/legacy%20photo.jpg",
        "https://abc.supabase.co/storage/v1/object/public/inquiries/sub/item_2.jpg?t=123",
      ],
      inquiryRows: [
        {
          images: [
            "https://abc.supabase.co/storage/v1/object/public/inquiry-attachments/inquiries/inq_1.jpg",
          ],
        },
        {
          image_url:
            "https://abc.supabase.co/storage/v1/object/sign/inquiry-attachments/inquiries/inq_2.webp?token=xyz",
        },
      ],
    });

    assert.equal(refs.inquiries.has("prod_1.webp"), true);
    assert.equal(refs.inquiries.has("sub/item_2.jpg"), true);
    assert.equal(refs["product-images"].has("legacy photo.jpg"), true);
    assert.equal(refs["inquiry-attachments"].has("inquiries/inq_1.jpg"), true);
    assert.equal(refs["inquiry-attachments"].has("inquiries/inq_2.webp"), true);
  });

  it("최근 24시간 이내 파일, 타임스탬프 누락 파일, 시스템 플레이스홀더는 절대 삭제 대상으로 잡지 않는다", () => {
    const nowMs = Date.parse("2026-11-23T12:00:00.000Z");
    const refs = collectReferencedStoragePathsByBucket({
      productImageUrls: [
        "https://abc.supabase.co/storage/v1/object/public/inquiries/active.webp",
      ],
      inquiryRows: [],
    });

    const result = detectOrphanStorageObjects(
      [
        {
          bucket: "inquiries",
          path: "active.webp",
          sizeBytes: 120_000,
          createdAt: "2026-11-01T00:00:00.000Z",
        },
        {
          bucket: "inquiries",
          path: "in_flight_recent.webp",
          sizeBytes: 200_000,
          createdAt: "2026-11-23T06:00:00.000Z", // 6시간 전 (보호)
        },
        {
          bucket: "inquiries",
          path: "missing_timestamp.webp",
          sizeBytes: 90_000,
          createdAt: null, // 타임스탬프 없음 (보호)
        },
        {
          bucket: "inquiry-attachments",
          path: "inquiries/.emptyFolderPlaceholder",
          sizeBytes: 0,
          createdAt: "2026-01-01T00:00:00.000Z", // 시스템 파일 (보호)
        },
        {
          bucket: "inquiries",
          path: "orphan_old_1.jpg",
          sizeBytes: 512_000,
          createdAt: "2026-11-10T00:00:00.000Z",
        },
        {
          bucket: "product-images",
          path: "orphan_older_2.jpg",
          sizeBytes: 1_024_000,
          createdAt: "2026-10-01T00:00:00.000Z",
        },
      ],
      refs,
      { minAgeHours: 24, nowMs }
    );

    assert.equal(result.orphans.length, 2);
    assert.equal(result.orphans[0].path, "orphan_older_2.jpg"); // 가장 오래된 파일 우선
    assert.equal(result.orphans[1].path, "orphan_old_1.jpg");
    assert.equal(result.totalBytes, 1_536_000);
    assert.equal(result.skippedTooNewCount, 2);
    assert.equal(result.skippedSystemCount, 1);
    assert.equal(result.byBucket.inquiries.count, 1);
    assert.equal(result.byBucket["product-images"].count, 1);
  });

  it("위험한 경로 조작 패턴을 차단하고 용량 포맷을 정확히 반환한다", () => {
    assert.equal(normalizeStorageObjectPath("../secret.jpg"), null);
    assert.equal(normalizeStorageObjectPath("a//b.jpg"), null);
    assert.equal(normalizeStorageObjectPath("/inquiries/ok.webp"), "inquiries/ok.webp");
    assert.equal(formatBytesCompact(512), "512 B");
    assert.equal(formatBytesCompact(2048), "2.0 KB");
    assert.equal(formatBytesCompact(2 * 1024 * 1024), "2.00 MB");
  });
});
