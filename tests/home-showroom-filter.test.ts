import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHomeGallerySearchHref,
  filterHomeShowroomProducts,
  HOME_QUICK_SEARCH_KEYWORDS,
  type HomeShowroomProductLike,
} from "../lib/home-showroom-filter";
import { SHOWROOM_CATEGORIES } from "../lib/showroom-categories";

const SAMPLE_PRODUCTS: HomeShowroomProductLike[] = [
  {
    id: 1,
    title: "삼성 11평형 트라이앵글 인버터 벽걸이 에어컨 (정격냉방 4,200W)",
    category: "에어컨/냉난방기",
    description: "단상 220V 실내외기 세트",
    status: "판매중",
  },
  {
    id: 2,
    title: "우성 45박스 업소용 냉동1칸 냉장3칸 냉장고",
    category: "업소용기기",
    description: "가로 1260mm 올스텐 식당용",
    status: "판매중",
  },
  {
    id: 3,
    title: "LG 트롬 21kg 드럼세탁기",
    category: "세탁기/건조기",
    description: "고압세척 완료",
    status: "판매중",
  },
  {
    id: 4,
    title: "이미 판매된 45박스 냉장고",
    category: "업소용기기",
    description: "테스트용 판매완료 상품",
    status: "판매완료",
  },
];

test("filterHomeShowroomProducts excludes sold items and supports multi-token search", () => {
  const all = filterHomeShowroomProducts(SAMPLE_PRODUCTS, {});
  assert.equal(all.length, 3);

  const aircon = filterHomeShowroomProducts(SAMPLE_PRODUCTS, {
    searchQuery: "벽걸이 에어컨",
  });
  assert.deepEqual(
    aircon.map((p) => p.id),
    [1]
  );

  const biz45 = filterHomeShowroomProducts(SAMPLE_PRODUCTS, {
    searchQuery: "45박스 1260mm",
  });
  assert.deepEqual(
    biz45.map((p) => p.id),
    [2]
  );

  const washerCategory = SHOWROOM_CATEGORIES.find((c) => c.key === "washer");
  const combinedMismatch = filterHomeShowroomProducts(SAMPLE_PRODUCTS, {
    selectedCategory: washerCategory,
    searchQuery: "45박스",
  });
  assert.equal(combinedMismatch.length, 0);
});

test("buildHomeGallerySearchHref preserves category, q, and table view params cleanly", () => {
  assert.equal(
    buildHomeGallerySearchHref({
      baseHref: "/gallery",
      searchQuery: "45박스",
    }),
    "/gallery?q=45%EB%B0%95%EC%8A%A4"
  );

  assert.equal(
    buildHomeGallerySearchHref({
      baseHref: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
      searchQuery: "  제빙기 ",
      view: "table",
    }),
    "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EC%A0%9C%EB%B9%99%EA%B8%B0&view=table"
  );

  assert.equal(
    buildHomeGallerySearchHref({
      baseHref: "/gallery",
      searchQuery: "   ",
      view: "card",
    }),
    "/gallery"
  );

  assert.ok(HOME_QUICK_SEARCH_KEYWORDS.length >= 4);
});
