import test from "node:test";
import assert from "node:assert/strict";
import {
  parseProductPriceInput,
  buildProductDescriptionWithModel,
  buildProductMutationPayload,
} from "../lib/product-ops";
import {
  inferCategoryFromTitle,
  detectProductCategoryMismatch,
  auditProductCategories,
  resolveAnalyzedProductCategory,
} from "../lib/product-category-audit";

test("parseProductPriceInput normalizes formatted prices and rejects negative values", () => {
  assert.equal(parseProductPriceInput(""), 0);
  assert.equal(parseProductPriceInput(null), 0);
  assert.equal(parseProductPriceInput("350,000원"), 350000);
  assert.equal(parseProductPriceInput(120000), 120000);
  assert.equal(parseProductPriceInput(-100), null);
  assert.equal(parseProductPriceInput("-5000"), null);
  assert.equal(parseProductPriceInput(Number.NaN), null);
});

test("buildProductDescriptionWithModel prepends model line only once", () => {
  assert.equal(
    buildProductDescriptionWithModel("고압세척 완료", "CSV-Q161AW"),
    "• 모델명: CSV-Q161AW\n고압세척 완료"
  );
  assert.equal(
    buildProductDescriptionWithModel("• 모델명: CSV-Q161AW\n상세", "CSV-Q161AW"),
    "• 모델명: CSV-Q161AW\n상세"
  );
  assert.equal(
    buildProductDescriptionWithModel("", "ML32AW"),
    "• 모델명: ML32AW"
  );
});

test("buildProductMutationPayload normalizes category, status, price, and images", () => {
  const payload = buildProductMutationPayload({
    title: "  삼성 세라믹 전자레인지 23L  ",
    category: "기타",
    status: "판매중",
    price: "75,000",
    conditionGrade: "A급 (사용감 적음)",
    description: "내부 세라믹 코팅 상태 양호",
    modelName: "MS23C3535AK",
    imageUrls: [" https://example.com/a.jpg ", ""],
  });

  assert.equal(payload.title, "삼성 세라믹 전자레인지 23L");
  assert.equal(payload.category, "기타");
  assert.equal(payload.status, "판매중");
  assert.equal(payload.price, 75000);
  assert.equal(payload.image_url, "https://example.com/a.jpg");
  assert.ok(payload.description.includes("• 모델명: MS23C3535AK"));

  assert.throws(() =>
    buildProductMutationPayload({
      title: "   ",
      category: "기타",
      status: "판매중",
      price: 0,
      imageUrls: ["https://example.com/a.jpg"],
    })
  );
  assert.throws(() =>
    buildProductMutationPayload({
      title: "테스트 상품",
      category: "기타",
      status: "판매중",
      price: 0,
      imageUrls: [],
    })
  );
});

test("auditProductCategories catches real DB misclassifications with zero false positives on valid inventory", () => {
  const sampleInventory = [
    // 실제 오분류 4건
    {
      id: "64b41957-474e-47cb-8a3a-d54a0a00cb0e",
      category: "에어컨/냉난방기",
      title: "삼성 세라믹 전자레인지 23L 블랙 (MS23C3535AK, 2024년 제조)",
    },
    {
      id: "69386dbc-1ac1-4894-9344-2138c453da7e",
      category: "에어컨/냉난방기",
      title: "LG 디오스 스마트 인버터 광파오븐 32L (ML32AW)",
    },
    {
      id: "8001358a-85e0-490d-acae-a3c8536a6d0f",
      category: "세탁기/건조기",
      title: "전자레인지, 전기밥솥",
    },
    {
      id: "chair-001",
      category: "기타",
      title: "업소용 식당·카페 원목 및 철제 의자 다량",
    },
    // 정상 분류 매물 (오탐 없어야 함)
    {
      id: "ok-aircon",
      category: "에어컨/냉난방기",
      title: "LG 휘센 18평형 상업용 인버터 스탠드 냉난방기 (PNW0723R2SF)",
    },
    {
      id: "ok-mini-showcase",
      category: "냉장고",
      title: "쿠잉 미니 쇼케이스 냉장고 50L 다량보유중",
    },
    {
      id: "ok-dishwasher",
      category: "업소용기기",
      title: "동양셰프 미라클 업소용 도어타입 식기세척기 4kW (DY-1001S)",
    },
    {
      id: "ok-vacuum",
      category: "기타",
      title: "천마스타 40L 업소용·산업용 건습식 진공청소기 (CM 1000 WD)",
    },
    {
      id: "ok-fridge",
      category: "냉장고",
      title: "창홍 1도어 소형 미니 냉장고 92L (ORD-092AMB)",
    },
  ];

  const mismatches = auditProductCategories(sampleInventory);
  assert.equal(mismatches.length, 4);
  assert.deepEqual(
    mismatches.map((m) => [m.id, m.suggestedCategory]),
    [
      ["64b41957-474e-47cb-8a3a-d54a0a00cb0e", "기타"],
      ["69386dbc-1ac1-4894-9344-2138c453da7e", "기타"],
      ["8001358a-85e0-490d-acae-a3c8536a6d0f", "기타"],
      ["chair-001", "업소용기기"],
    ]
  );
});

test("resolveAnalyzedProductCategory never lets default aircon form hint overwrite AI '기타' classification", () => {
  // 기존 버그 재현: 업로드 폼 초기값('에어컨/냉난방기')이 AI 판독 결과('기타')를 덮어쓰던 문제
  assert.equal(
    resolveAnalyzedProductCategory({
      aiCategory: "기타",
      title: "삼성 세라믹 전자레인지 23L 블랙 (MS23C3535AK)",
      categoryHint: "에어컨/냉난방기",
    }),
    "기타"
  );

  // AI가 오분류했더라도 제목이 명확히 광파오븐이면 '기타'로 자동 보정
  assert.equal(
    resolveAnalyzedProductCategory({
      aiCategory: "에어컨/냉난방기",
      title: "LG 디오스 스마트 인버터 광파오븐 32L (ML32AW)",
      categoryHint: "에어컨/냉난방기",
    }),
    "기타"
  );

  // AI 카테고리가 비어 있으면 제목 추론이 폼 기본값보다 우선
  assert.equal(
    resolveAnalyzedProductCategory({
      aiCategory: "",
      title: "우성 45박스 업소용 4도어 직냉식 냉장냉동고",
      categoryHint: "에어컨/냉난방기",
    }),
    "업소용기기"
  );

  // 제목으로 특정 불가능하고 AI도 비어 있을 때만 힌트 유지
  assert.equal(
    resolveAnalyzedProductCategory({
      aiCategory: "",
      title: "신규 입고 중고 기기",
      categoryHint: "냉장고",
    }),
    "냉장고"
  );

  assert.equal(
    inferCategoryFromTitle("캐리어 16평형 인버터 벽걸이 냉난방기"),
    "에어컨/냉난방기"
  );
  assert.equal(
    detectProductCategoryMismatch({
      id: "x",
      title: "LG 휘센 벽걸이 에어컨",
      category: "에어컨/냉난방기",
    }),
    null
  );
});

test("mergeReplacedProductImageUrls preserves original photo order and isolates removed storage URLs", async () => {
  const { mergeReplacedProductImageUrls } = await import("../lib/product-ops");
  const original = [
    "https://cdn.example.com/1.jpg",
    "https://cdn.example.com/2.jpg",
    "https://cdn.example.com/3.jpg",
  ];

  // 1) 부분 교체 시 순서 100% 보존 + 교체된 URL만 제거 목록에 포함
  const partial = mergeReplacedProductImageUrls(original, [
    { index: 1, nextUrl: "https://cdn.example.com/2_cropped.jpg" },
  ]);
  assert.deepEqual(partial.nextUrls, [
    "https://cdn.example.com/1.jpg",
    "https://cdn.example.com/2_cropped.jpg",
    "https://cdn.example.com/3.jpg",
  ]);
  assert.deepEqual(partial.removedOldUrls, ["https://cdn.example.com/2.jpg"]);

  // 2) 범위 밖 인덱스·빈 URL·동일 URL은 안전하게 무시
  const guarded = mergeReplacedProductImageUrls(original, [
    { index: -1, nextUrl: "https://cdn.example.com/x.jpg" },
    { index: 99, nextUrl: "https://cdn.example.com/y.jpg" },
    { index: 0, nextUrl: "   " },
    { index: 2, nextUrl: "https://cdn.example.com/3.jpg" },
  ]);
  assert.deepEqual(guarded.nextUrls, original);
  assert.deepEqual(guarded.removedOldUrls, []);

  // 3) 중복 참조된 URL이 다른 슬롯에 남아 있으면 제거하지 않음
  const sharedOriginal = [
    "https://cdn.example.com/shared.jpg",
    "https://cdn.example.com/shared.jpg",
  ];
  const sharedPartial = mergeReplacedProductImageUrls(sharedOriginal, [
    { index: 0, nextUrl: "https://cdn.example.com/cropped.jpg" },
  ]);
  assert.deepEqual(sharedPartial.nextUrls, [
    "https://cdn.example.com/cropped.jpg",
    "https://cdn.example.com/shared.jpg",
  ]);
  assert.deepEqual(sharedPartial.removedOldUrls, []);
});

test("planBulkPendingPublish groups identical prices into minimal IN batches and rejects invalid prices", async () => {
  const { planBulkPendingPublish } = await import("../lib/product-ops");

  // 1) 101건(가격 미입력 98건 + 동일 가격 2건 + 개별 가격 1건)을 최소 배치(3회)로 압축
  const items = [
    ...Array.from({ length: 98 }, (_, idx) => ({
      id: `p-${idx + 1}`,
      price: "",
    })),
    { id: "p-99", price: "350,000원" },
    { id: "p-100", price: "350000" },
    { id: "p-101", price: "480,000" },
  ];

  const plan = planBulkPendingPublish(items);
  assert.equal(plan.orderedItems.length, 101);
  assert.equal(plan.pricedCount, 3);
  assert.equal(plan.inquiryPriceCount, 98);
  assert.equal(plan.priceBatches.length, 3);

  const zeroBatch = plan.priceBatches.find((b) => b.price === 0);
  const midBatch = plan.priceBatches.find((b) => b.price === 350000);
  const highBatch = plan.priceBatches.find((b) => b.price === 480000);
  assert.equal(zeroBatch?.ids.length, 98);
  assert.deepEqual(midBatch?.ids, ["p-99", "p-100"]);
  assert.deepEqual(highBatch?.ids, ["p-101"]);

  // 2) 200건 초과 동일 가격 항목은 200건 청크로 안전 분할 + 중복 ID는 마지막 값으로 통합
  const largeItems = [
    ...Array.from({ length: 205 }, (_, idx) => ({
      id: `bulk-${idx + 1}`,
      price: 0,
    })),
    { id: "bulk-1", price: "120000" },
  ];
  const largePlan = planBulkPendingPublish(largeItems);
  assert.equal(largePlan.orderedItems.length, 205);
  assert.equal(largePlan.pricedCount, 1);
  assert.equal(largePlan.inquiryPriceCount, 204);
  const zeroChunks = largePlan.priceBatches.filter((b) => b.price === 0);
  assert.deepEqual(
    zeroChunks.map((c) => c.ids.length),
    [200, 4]
  );

  // 3) 음수 등 잘못된 가격이 섞이면 DB 호출 전에 즉시 차단
  assert.throws(() =>
    planBulkPendingPublish([
      { id: "ok-1", price: "100000" },
      { id: "bad-1", price: "-5000" },
    ])
  );
});

