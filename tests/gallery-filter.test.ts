import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGalleryQueryUrl,
  computeCategoryCounts,
  filterAndSortGalleryProducts,
  parseGalleryQueryParams,
  type FilterableGalleryProduct,
} from "../lib/gallery-filter";

const SAMPLE_PRODUCTS: (FilterableGalleryProduct & { id: string })[] = [
  {
    id: "p1",
    title: "캐리어 16평형 인버터 벽걸이 냉난방기 (CSV-Q161AW)",
    category: "에어컨/냉난방기",
    description: "• 모델명: CSV-Q161AW\n• 냉방 6.5kW",
    price: 650000,
    status: "판매중",
    views: 42,
    created_at: "2026-11-18T10:00:00Z",
  },
  {
    id: "p2",
    title: "삼성 비스포크 4도어 냉장고 875L",
    category: "냉장고",
    description: "• 모델명: RF85B9121AP",
    price: 1200000,
    status: "예약중",
    views: 95,
    created_at: "2026-11-19T10:00:00Z",
  },
  {
    id: "p3",
    title: "스타리온 45박스 업소용 냉장냉동고 (SR-C45BI)",
    category: "업소용기기",
    description: "• 모델명: SR-C45BI",
    price: null,
    status: "판매중",
    views: 15,
    created_at: "2026-11-20T10:00:00Z",
  },
  {
    id: "p4",
    title: "LG 휘센 스탠드 에어컨 18평형",
    category: "에어컨/냉난방기",
    description: "• 모델명: FQ18VAKWU2",
    price: 250000,
    status: "판매완료",
    views: 300,
    created_at: "2026-11-20T12:00:00Z",
  },
];

test("computeCategoryCounts aggregates normalized categories including 전체", () => {
  const counts = computeCategoryCounts(SAMPLE_PRODUCTS);
  assert.equal(counts["전체"], 4);
  assert.equal(counts["에어컨/냉난방기"], 2);
  assert.equal(counts["냉장고"], 1);
  assert.equal(counts["업소용기기"], 1);
});

test("filterAndSortGalleryProducts keeps sold items last and supports category, status, price, search, and sort", () => {
  const latest = filterAndSortGalleryProducts(SAMPLE_PRODUCTS, {
    activeCategory: "전체",
    statusFilter: "all",
    effectivePriceRange: "all",
    search: "",
    sort: "latest",
  });
  assert.deepEqual(
    latest.map((p) => p.id),
    ["p3", "p2", "p1", "p4"]
  );

  const byViews = filterAndSortGalleryProducts(SAMPLE_PRODUCTS, {
    activeCategory: "전체",
    statusFilter: "all",
    effectivePriceRange: "all",
    search: "",
    sort: "views",
  });
  assert.deepEqual(
    byViews.map((p) => p.id),
    ["p2", "p1", "p3", "p4"]
  );

  const priceAsc = filterAndSortGalleryProducts(SAMPLE_PRODUCTS, {
    activeCategory: "전체",
    statusFilter: "selling",
    effectivePriceRange: "all",
    search: "",
    sort: "priceAsc",
  });
  assert.deepEqual(
    priceAsc.map((p) => p.id),
    ["p1", "p3"]
  );

  const midPrice = filterAndSortGalleryProducts(SAMPLE_PRODUCTS, {
    activeCategory: "전체",
    statusFilter: "all",
    effectivePriceRange: "30to70",
    search: "",
    sort: "latest",
  });
  assert.deepEqual(
    midPrice.map((p) => p.id),
    ["p1"]
  );

  const byModelSearch = filterAndSortGalleryProducts(SAMPLE_PRODUCTS, {
    activeCategory: "전체",
    statusFilter: "all",
    effectivePriceRange: "all",
    search: "SR-C45BI",
    sort: "latest",
  });
  assert.deepEqual(
    byModelSearch.map((p) => p.id),
    ["p3"]
  );
});

test("parseGalleryQueryParams and buildGalleryQueryUrl preserve valid parameters and strip defaults", () => {
  const parsed = parseGalleryQueryParams(
    new URLSearchParams(
      "category=업소용기기&q=45박스&sort=views&status=selling&price=30to70&view=table"
    )
  );
  assert.deepEqual(parsed, {
    activeCategory: "업소용기기",
    search: "45박스",
    sort: "views",
    statusFilter: "selling",
    priceRange: "30to70",
    viewMode: "table",
  });

  const invalidParsed = parseGalleryQueryParams(
    new URLSearchParams("sort=bogus&status=unknown&price=free&view=grid")
  );
  assert.deepEqual(invalidParsed, {});

  const serialized = buildGalleryQueryUrl("https://hanbatmall.com/gallery?q=old", {
    activeCategory: "전체",
    search: "캐리어",
    sort: "latest",
    statusFilter: "all",
    priceRange: "30to70",
    viewMode: "card",
    hasPricedProducts: false,
  });
  assert.equal(
    serialized,
    "https://hanbatmall.com/gallery?q=%EC%BA%90%EB%A6%AC%EC%96%B4"
  );
});
