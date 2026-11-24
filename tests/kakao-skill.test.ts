import test from "node:test";
import assert from "node:assert/strict";
import {
  buildKakaoSkillSearchResponse,
  parseKakaoSearchQuery,
  resolveKakaoThumbnailUrl,
  searchKakaoCatalogProducts,
  type KakaoProductRecord,
} from "../lib/kakao-skill";
import { STORE } from "../lib/site";

const SAMPLE_KAKAO_PRODUCTS: KakaoProductRecord[] = [
  {
    id: 101,
    title: "라셀르 테이블냉장고 1200 (가로 1200mm)",
    category: "업소용기기",
    description: "업소용 올스텐 1200 테이블냉장고 정상 작동 점검 완료",
    image_url:
      "https://example.supabase.co/storage/v1/object/public/inquiries/fridge_101.webp",
    price: 480000,
    status: "판매중",
  },
  {
    id: 102,
    title: "삼성 무풍 벽걸이 에어컨 11평형 (단상 220V)",
    category: "에어컨/냉난방기",
    description: "• 모델명: AR11T9170HZT\n실내기+실외기 세트",
    image_url:
      "https://example.supabase.co/storage/v1/object/public/inquiries/ac_102.jpg",
    price: 420000,
    status: "판매중",
  },
  {
    id: 103,
    title: "우성 45박스 냉동1 냉장3 업소용 냉장고",
    category: "업소용기기",
    description: "가로 1260mm 올스텐 업소용 냉장고",
    image_url: null,
    price: 0,
    status: "예약중",
  },
  {
    id: 104,
    title: "비공개 검수중 냉장고 1200",
    category: "업소용기기",
    description: "검수대기 테스트",
    image_url: null,
    price: 300000,
    status: "검수대기",
  },
  {
    id: 105,
    title: "판매완료 에어컨 18평",
    category: "에어컨/냉난방기",
    description: "판매완료 상품",
    image_url: null,
    price: 500000,
    status: "판매완료",
  },
];

test("parseKakaoSearchQuery extracts natural Korean keywords and width numbers cleanly", () => {
  const q1 = parseKakaoSearchQuery("냉장고 1200짜리 있어요?");
  assert.deepEqual(q1.tokens, ["냉장고", "1200"]);
  assert.equal(q1.requestedWidthMm, 1200);

  const q2 = parseKakaoSearchQuery("중고 에어컨 추천");
  assert.deepEqual(q2.tokens, ["에어컨"]);
  assert.equal(q2.requestedWidthMm, null);

  const q3 = parseKakaoSearchQuery("벽걸이 에어컨 있나요?");
  assert.deepEqual(q3.tokens, ["벽걸이", "에어컨"]);

  const q4 = parseKakaoSearchQuery("업소용 냉장고 가로1200");
  assert.deepEqual(q4.tokens, ["업소용", "냉장고", "1200"]);
  assert.equal(q4.requestedWidthMm, 1200);
});

test("searchKakaoCatalogProducts excludes pending/sold items and prioritizes exact then near-width fallback", () => {
  const resExact = searchKakaoCatalogProducts(
    SAMPLE_KAKAO_PRODUCTS,
    "냉장고 1200짜리 있어요?"
  );
  assert.equal(resExact.matchType, "exact");
  assert.equal(resExact.items.length, 1);
  assert.equal(resExact.items[0].id, 101);

  const resFallbackWidth = searchKakaoCatalogProducts(
    SAMPLE_KAKAO_PRODUCTS,
    "냉장고 1250짜리 있나요?"
  );
  assert.equal(resFallbackWidth.matchType, "fallback");
  assert.ok(resFallbackWidth.items.some((p) => p.id === 101 || p.id === 103));
  assert.ok(!resFallbackWidth.items.some((p) => p.id === 104 || p.id === 105));
});

test("resolveKakaoThumbnailUrl preserves JPG/PNG, converts WebP via thumb proxy, and falls back to og-image.jpg", () => {
  assert.equal(
    resolveKakaoThumbnailUrl(SAMPLE_KAKAO_PRODUCTS[0], "https://hanbatmall.com"),
    "https://hanbatmall.com/api/kakao/thumb?id=101"
  );
  assert.equal(
    resolveKakaoThumbnailUrl(SAMPLE_KAKAO_PRODUCTS[1], "https://hanbatmall.com"),
    "https://example.supabase.co/storage/v1/object/public/inquiries/ac_102.jpg"
  );
  assert.equal(
    resolveKakaoThumbnailUrl(SAMPLE_KAKAO_PRODUCTS[2], "https://hanbatmall.com"),
    "https://hanbatmall.com/og-image.jpg"
  );
});

test("buildKakaoSkillSearchResponse formats valid Kakao v2.0 carousel with webLink and phone buttons", () => {
  const res = buildKakaoSkillSearchResponse({
    products: SAMPLE_KAKAO_PRODUCTS,
    rawQuery: "중고 에어컨 추천",
    siteOrigin: "https://hanbatmall.com",
  });

  assert.equal(res.version, "2.0");
  assert.equal(res.template.outputs.length, 2);
  const carouselOut = res.template.outputs[1];
  assert.ok("carousel" in carouselOut);
  assert.equal(carouselOut.carousel.type, "basicCard");
  assert.equal(carouselOut.carousel.items.length, 1);

  const card = carouselOut.carousel.items[0];
  assert.ok(card.title.length <= 45);
  assert.ok(card.description.includes("420,000원"));
  assert.equal(card.thumbnail.fixedRatio, true);
  assert.deepEqual(card.buttons, [
    {
      action: "webLink",
      label: "상세보기",
      webLinkUrl: "https://hanbatmall.com/102",
    },
    {
      action: "phone",
      label: "전화문의",
      phoneNumber: STORE.tel,
    },
  ]);

  const emptyRes = buildKakaoSkillSearchResponse({
    products: SAMPLE_KAKAO_PRODUCTS,
    rawQuery: "업소용 튀김기 있나요",
    siteOrigin: "https://hanbatmall.com",
  });
  assert.equal(emptyRes.template.outputs.length, 1);
  assert.ok("basicCard" in emptyRes.template.outputs[0]);
});
