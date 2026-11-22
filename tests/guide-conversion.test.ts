import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { INFO_GUIDE_ARTICLES, getInfoGuideBySlug } from "../lib/info-guides";
import { getGuideConversionContext } from "../lib/guides/conversion";
import { resolveGuideThumbnail } from "../lib/guides/thumbnails";
import {
  MAX_GUIDE_IMAGE_RETRY_STEP,
  buildDirectStaticImageUrl,
  resolveGuideImageAttempt,
} from "../lib/guides/image-retry";
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

test("all 69 guide articles have unique existing photorealistic main images without AI slop", () => {
  assert.equal(INFO_GUIDE_ARTICLES.length, 69);
  const banned = /분해세척|분해 세척|24시간|부하 시운전|UV|고온스팀/;
  const seenSrcs = new Set<string>();

  for (const article of INFO_GUIDE_ARTICLES) {
    const ctx = getGuideConversionContext(article);
    const thumb = resolveGuideThumbnail(article);

    assert.ok(ctx.eyebrow.length > 0, `eyebrow missing for ${article.slug}`);
    assert.ok(ctx.primaryCta.href.startsWith("/"), `invalid primaryCta href for ${article.slug}`);
    assert.ok(ctx.secondaryCta.href.startsWith("/"), `invalid secondaryCta href for ${article.slug}`);
    assert.equal(
      thumb.src,
      `/images/guide/photos/${article.slug}.jpg`,
      `expected unique photo path for ${article.slug}`
    );
    assert.ok(!seenSrcs.has(thumb.src), `duplicate thumbnail ${thumb.src} on ${article.slug}`);
    seenSrcs.add(thumb.src);

    const diskPath = path.join(process.cwd(), "public", thumb.src.replace(/^\//, ""));
    assert.ok(fs.existsSync(diskPath), `missing guide photo on disk: ${diskPath}`);
    const stat = fs.statSync(diskPath);
    assert.ok(stat.size > 10_000, `guide photo too small (${stat.size}B): ${diskPath}`);

    assert.ok(!thumb.alt.includes("일러스트"), `outdated illustration alt on ${article.slug}`);
    assert.doesNotMatch(ctx.bottomDescription, banned, `banned wording in ${article.slug}`);
    assert.doesNotMatch(ctx.sidebarDesc, banned, `banned wording in sidebarDesc for ${article.slug}`);
  }

  assert.equal(seenSrcs.size, 69, "all 69 articles must have distinct main images");
});

test("guide image retry ladder escalates from Next.js optimizer retry to direct static recovery", () => {
  assert.deepEqual(resolveGuideImageAttempt(0, 85), { mode: "optimized", quality: 85 });
  assert.deepEqual(resolveGuideImageAttempt(1, 85), { mode: "optimized", quality: 80 });
  assert.deepEqual(resolveGuideImageAttempt(MAX_GUIDE_IMAGE_RETRY_STEP, 85), {
    mode: "direct",
    quality: 85,
  });
  assert.deepEqual(resolveGuideImageAttempt(1, 80), { mode: "optimized", quality: 75 });
  assert.equal(
    buildDirectStaticImageUrl("/images/guide/photos/voltage-220v-vs-380v.jpg", 828),
    "/images/guide/photos/voltage-220v-vs-380v.jpg?w=828",
  );
});
