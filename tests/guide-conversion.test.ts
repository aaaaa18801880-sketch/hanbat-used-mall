import test from "node:test";
import assert from "node:assert/strict";
import { INFO_GUIDE_ARTICLES, getInfoGuideBySlug } from "../lib/info-guides";
import { getGuideConversionContext } from "../lib/guides/conversion";
import { resolveGuideThumbnail } from "../lib/guides/thumbnails";
import { getCategoryWarrantyInfo } from "../lib/site";

test("getGuideConversionContext routes buyback/closure guides to /purchase#purchase-form", () => {
  const buybackGuide = getInfoGuideBySlug("appliance-buyback-no-deduction-guide");
  assert.ok(buybackGuide, "buyback guide must exist");

  const ctx = getGuideConversionContext(buybackGuide);
  assert.equal(ctx.intent, "sell");
  assert.equal(ctx.primaryCta.href, "/purchase#purchase-form");
  assert.equal(ctx.mobilePrimaryHref, "/purchase#purchase-form");
  assert.equal(ctx.mobilePrimaryLabel, "매입 신청");
});

test("getGuideConversionContext attaches SSOT aircon warranty to aircon guides", () => {
  const airconGuide = getInfoGuideBySlug("aircon-pyeong-sizing-cafe-restaurant");
  assert.ok(airconGuide, "aircon guide must exist");

  const ctx = getGuideConversionContext(airconGuide);
  assert.equal(ctx.intent, "buy");
  assert.equal(ctx.primaryCategory, "에어컨/냉난방기");
  assert.ok(ctx.bottomDescription.includes(getCategoryWarrantyInfo("에어컨/냉난방기").compactLabel));
  assert.equal(ctx.mobilePrimaryHref, "#guide-recommended-products");
});

test("all 65 guide articles produce valid conversion contexts and local thumbnails without AI slop", () => {
  assert.equal(INFO_GUIDE_ARTICLES.length, 65);
  const banned = /분해세척|분해 세척|24시간|부하 시운전|UV|고온스팀/;

  for (const article of INFO_GUIDE_ARTICLES) {
    const ctx = getGuideConversionContext(article);
    const thumb = resolveGuideThumbnail(article);

    assert.ok(ctx.eyebrow.length > 0, `eyebrow missing for ${article.slug}`);
    assert.ok(ctx.primaryCta.href.startsWith("/"), `invalid primaryCta href for ${article.slug}`);
    assert.ok(ctx.secondaryCta.href.startsWith("/"), `invalid secondaryCta href for ${article.slug}`);
    assert.ok(thumb.src.startsWith("/images/guide/"), `invalid thumbnail for ${article.slug}`);
    assert.doesNotMatch(ctx.bottomDescription, banned, `banned wording in ${article.slug}`);
    assert.doesNotMatch(ctx.sidebarDesc, banned, `banned wording in sidebarDesc for ${article.slug}`);
  }
});
