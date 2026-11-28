import test from "node:test";
import assert from "node:assert/strict";
import {
  HERO_BANNER_SLIDES,
  getWrappedBannerIndex,
} from "../lib/hero-banners";

test("기획전 히어로 배너는 6개 슬라이드로 구성되며 필수 필드와 헤더 톤이 채워져 있다", () => {
  assert.equal(HERO_BANNER_SLIDES.length, 6);
  for (const slide of HERO_BANNER_SLIDES) {
    assert.ok(slide.id.length > 0);
    assert.ok(slide.headlineTop.length > 0);
    assert.ok(slide.headlineBottom.length > 0);
    assert.ok(slide.ctaLabel.length > 0);
    assert.ok(slide.imageSrc.startsWith("/"));
    assert.ok(slide.headerTone === "light" || slide.headerTone === "dark");
  }
});

test("getWrappedBannerIndex는 앞/뒤 순환 이동을 정확히 계산한다", () => {
  assert.equal(getWrappedBannerIndex(0, 1, 6), 1);
  assert.equal(getWrappedBannerIndex(5, 1, 6), 0);
  assert.equal(getWrappedBannerIndex(0, -1, 6), 5);
  assert.equal(getWrappedBannerIndex(2, -2, 6), 0);
  assert.equal(getWrappedBannerIndex(0, 1, 0), 0);
});
