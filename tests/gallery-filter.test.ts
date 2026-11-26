import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGalleryQueryUrl,
  computeCategoryCounts,
  computeSituationPresetCounts,
  computeStatusFacetCounts,
  computeVoltageFacetCounts,
  extractProductCapacityMetric,
  extractProductManufactureDateValue,
  extractProductVoltage,
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

  const vParsed = parseGalleryQueryParams(
    new URLSearchParams("voltage=380v&sort=capacityDesc")
  );
  assert.deepEqual(vParsed, {
    voltageFilter: "380v",
    sort: "capacityDesc",
  });

  const vSerialized = buildGalleryQueryUrl("https://hanbatmall.com/gallery", {
    activeCategory: "에어컨/냉난방기",
    search: "",
    sort: "yearDesc",
    statusFilter: "selling",
    voltageFilter: "220v",
    priceRange: "all",
    viewMode: "card",
    hasPricedProducts: false,
  });
  assert.equal(
    vSerialized,
    "https://hanbatmall.com/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0&sort=yearDesc&status=selling&voltage=220v"
  );
});

test("extractProductManufactureDateValue, capacity metric, and voltage parse real-world inventory specs accurately", () => {
  assert.equal(
    extractProductManufactureDateValue(
      "삼성 세라믹 전자레인지 23L 블랙 (MS23C3535AK, 2024년 제조)",
      "2024년 4월 제조된 최신 연식 기기"
    ),
    202404
  );
  assert.equal(
    extractProductManufactureDateValue("린나이 가스그릴 (2022년식)", null),
    202200
  );
  assert.equal(
    extractProductManufactureDateValue("캐리어 13평 냉난방기", "2019-06"),
    201906
  );
  assert.equal(
    extractProductManufactureDateValue("업소용 냉장고", "'23년식"),
    202300
  );
  assert.equal(
    extractProductManufactureDateValue("제목에 연식 없음", "일반 설명"),
    null
  );

  assert.deepEqual(
    extractProductCapacityMetric(
      "LG 휘센 40평형 인버터 냉난방기",
      null,
      "에어컨/냉난방기"
    ),
    { value: 40, unit: "평", normalizedScore: 1200 }
  );
  assert.deepEqual(
    extractProductCapacityMetric(
      "삼성 대형 스탠드 냉난방기 23kW",
      null,
      "에어컨/냉난방기"
    ),
    { value: 57.5, unit: "평", normalizedScore: 1725 }
  );
  assert.deepEqual(
    extractProductCapacityMetric("LG 디오스 냉장고 870L", null, "냉장고"),
    { value: 870, unit: "L", normalizedScore: 870 }
  );
  assert.deepEqual(
    extractProductCapacityMetric("카이저 제빙기 110kg", null, "업소용기기"),
    { value: 110, unit: "kg", normalizedScore: 2200 }
  );
  assert.deepEqual(
    extractProductCapacityMetric("스타리온 45박스 냉장냉동고", null, "업소용기기"),
    { value: 45, unit: "박스", normalizedScore: 1170 }
  );
  // 모델코드 ML32AW 내부 숫자를 리터(L)로 오인하지 않아야 함
  assert.equal(
    extractProductCapacityMetric("LG 광파오븐 (ML32AW)", null, "기타"),
    null
  );

  assert.equal(extractProductVoltage("캐리어 8평형 (단상 220V)", null), "220v");
  assert.equal(extractProductVoltage("LG 30평형 (삼상 380V)", null), "380v");
  assert.equal(extractProductVoltage("업소용 냉동기", "3상 380V 전원"), "380v");
  assert.equal(extractProductVoltage("일반 소형 가전", null), null);
});

test("gallery yearDesc/capacityDesc/capacityAsc sort, voltage filter, and facet counts work consistently", () => {
  const richProducts: (FilterableGalleryProduct & { id: string })[] = [
    {
      id: "ac-small",
      title: "캐리어 9평형 벽걸이 냉난방기 (단상 220V)",
      category: "에어컨/냉난방기",
      description: "2022년 1월",
      price: null,
      status: "판매중",
      created_at: "2026-11-10T10:00:00Z",
    },
    {
      id: "ac-large",
      title: "LG 30평형 4way 천장형 냉난방기 (삼상 380V)",
      category: "에어컨/냉난방기",
      description: "2024년 5월",
      price: null,
      status: "판매중",
      created_at: "2026-11-09T10:00:00Z",
    },
    {
      id: "ac-noyear-nocap",
      title: "삼성 인버터 에어컨 (단상 220V)",
      category: "에어컨/냉난방기",
      description: "깔끔한 외관",
      price: null,
      status: "예약중",
      created_at: "2026-11-12T10:00:00Z",
    },
    {
      id: "biz-45box",
      title: "우성 45박스 업소용 4도어 냉장고 (220V)",
      category: "업소용기기",
      description: "2021년 7월",
      price: null,
      status: "판매중",
      created_at: "2026-11-11T10:00:00Z",
    },
    {
      id: "ac-sold-huge",
      title: "LG 63평형 대용량 스탠드 (삼상 380V)",
      category: "에어컨/냉난방기",
      description: "2025년 1월",
      price: null,
      status: "판매완료",
      created_at: "2026-11-15T10:00:00Z",
    },
  ];

  // 1) 최신 제조년월순: 파싱된 최신순 -> 미파싱 -> 판매완료 최하단
  const yearSorted = filterAndSortGalleryProducts(richProducts, {
    activeCategory: "전체",
    statusFilter: "all",
    voltageFilter: "all",
    effectivePriceRange: "all",
    search: "",
    sort: "yearDesc",
  });
  assert.deepEqual(
    yearSorted.map((p) => p.id),
    ["ac-large", "ac-small", "biz-45box", "ac-noyear-nocap", "ac-sold-huge"]
  );

  // 2) 평형/용량 큰순 & 작은순 (미파싱은 오름/내림 모두 하단, 판매완료 최하단)
  const capDesc = filterAndSortGalleryProducts(richProducts, {
    activeCategory: "에어컨/냉난방기",
    statusFilter: "all",
    voltageFilter: "all",
    effectivePriceRange: "all",
    search: "",
    sort: "capacityDesc",
  });
  assert.deepEqual(
    capDesc.map((p) => p.id),
    ["ac-large", "ac-small", "ac-noyear-nocap", "ac-sold-huge"]
  );

  const capAsc = filterAndSortGalleryProducts(richProducts, {
    activeCategory: "에어컨/냉난방기",
    statusFilter: "all",
    voltageFilter: "all",
    effectivePriceRange: "all",
    search: "",
    sort: "capacityAsc",
  });
  assert.deepEqual(
    capAsc.map((p) => p.id),
    ["ac-small", "ac-large", "ac-noyear-nocap", "ac-sold-huge"]
  );

  // 3) 교차 패싯 카운트 확인
  const statusCounts = computeStatusFacetCounts(richProducts, {
    activeCategory: "에어컨/냉난방기",
    voltageFilter: "all",
    effectivePriceRange: "all",
    search: "",
  });
  assert.deepEqual(statusCounts, { all: 4, selling: 2, reserved: 1, sold: 1 });

  const voltageCounts = computeVoltageFacetCounts(richProducts, {
    activeCategory: "전체",
    statusFilter: "all",
    effectivePriceRange: "all",
    search: "",
  });
  assert.deepEqual(voltageCounts, { all: 5, "220v": 3, "380v": 2 });

  const presetCounts = computeSituationPresetCounts(richProducts);
  assert.equal(presetCounts["식당·주방설비"], 1);
  assert.equal(presetCounts["사계절 냉난방"], 2);
});
