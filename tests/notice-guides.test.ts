import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  HOME_NOTICE_GUIDES,
  NOTICE_GUIDES,
  getCategoryBannerGuide,
  getPrimaryNoticeGuideForCategory,
  getProductDetailNoticeTabs,
} from "../lib/notice-guides";
import { STORE } from "../lib/site";

const BANNED_CLAIM_REGEX =
  /완전\s*분해|120bar|고온\s*스팀|스팀\s*살균|UV\s*살균|메거|절연\s*저항|24시간\s*(?:부하|실부하|연속)\s*시운전|실부하\s*시운전|연속\s*시운전|분해\s*고압\s*살균|디지털\s*매니폴드|담당\s*엔지니어|전문\s*엔지니어|계약조건별/;

test("all 6 notice guide images exist on disk under public/ and have non-trivial size", () => {
  const guides = Object.values(NOTICE_GUIDES);
  assert.equal(guides.length, 6);
  assert.equal(HOME_NOTICE_GUIDES.length, 6);

  for (const guide of guides) {
    assert.ok(guide.imageSrc.startsWith("/images/"));
    const absPath = path.join(process.cwd(), "public", guide.imageSrc.slice(1));
    assert.ok(fs.existsSync(absPath), `Missing image asset: ${guide.imageSrc}`);
    const stat = fs.statSync(absPath);
    assert.ok(stat.size > 20_000, `Image unexpectedly small: ${guide.imageSrc}`);
  }
});

test("category resolver maps every product category to the exact matching notice guide", () => {
  assert.equal(getPrimaryNoticeGuideForCategory("에어컨/냉난방기").id, "aircon-set");
  assert.equal(getPrimaryNoticeGuideForCategory("업소용기기").id, "commercial-spec");
  assert.equal(getPrimaryNoticeGuideForCategory("냉장고").id, "home-appliance");
  assert.equal(getPrimaryNoticeGuideForCategory("세탁기/건조기").id, "home-appliance");
  assert.equal(getPrimaryNoticeGuideForCategory("기타").id, "warranty-as");
  assert.equal(getPrimaryNoticeGuideForCategory(null).id, "warranty-as");
});

test("getProductDetailNoticeTabs deduplicates tabs and starts with category primary guide", () => {
  const airconTabs = getProductDetailNoticeTabs("에어컨/냉난방기").map((g) => g.id);
  assert.deepEqual(airconTabs, [
    "aircon-set",
    "inspection-process",
    "warranty-as",
    "delivery-showroom",
  ]);

  const commercialTabs = getProductDetailNoticeTabs("업소용기기").map((g) => g.id);
  assert.deepEqual(commercialTabs, [
    "commercial-spec",
    "inspection-process",
    "warranty-as",
    "delivery-showroom",
  ]);

  const miscTabs = getProductDetailNoticeTabs("기타").map((g) => g.id);
  assert.deepEqual(miscTabs, [
    "warranty-as",
    "inspection-process",
    "delivery-showroom",
  ]);
});

test("getCategoryBannerGuide shows targeted banners only for specialized appliance categories", () => {
  assert.equal(getCategoryBannerGuide("전체"), null);
  assert.equal(getCategoryBannerGuide("기타"), null);
  assert.equal(getCategoryBannerGuide(""), null);
  assert.equal(getCategoryBannerGuide("에어컨/냉난방기")?.id, "aircon-set");
  assert.equal(getCategoryBannerGuide("업소용기기")?.id, "commercial-spec");
  assert.equal(getCategoryBannerGuide("냉장고")?.id, "home-appliance");
  assert.equal(getCategoryBannerGuide("세탁기/건조기")?.id, "home-appliance");
});

test("notice guide copy adheres to SSOT store facts and contains zero banned anti-slop claims", () => {
  const allCopy = Object.values(NOTICE_GUIDES)
    .flatMap((g) => [
      g.badge,
      g.title,
      g.shortTabLabel,
      g.headline,
      g.summary,
      g.inlineText,
      g.imageAlt,
      g.modalTitle,
      g.modalSubtitle,
      g.modalFooterNote,
      ...g.highlights.flatMap((h) => [h.title, h.desc]),
    ])
    .join("\n");

  assert.equal(BANNED_CLAIM_REGEX.test(allCopy), false);
  assert.ok(NOTICE_GUIDES["delivery-showroom"].summary.includes(STORE.roadAddress));
  assert.ok(NOTICE_GUIDES["warranty-as"].modalFooterNote.includes(STORE.tel));
});
