import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NOTICE_GUIDES, getCategoryNoticeGuide } from "../lib/notice-guides";

const BANNED_CLAIM_REGEX =
  /완전\s*분해|120bar|고온\s*스팀|스팀\s*살균|UV\s*살균|메거|절연\s*저항|24시간\s*(?:부하|실부하|연속)\s*시운전|실부하\s*시운전|연속\s*시운전|분해\s*고압\s*살균|디지털\s*매니폴드|담당\s*엔지니어|전문\s*엔지니어|계약조건별/;

test("all 3 category-specific notice guide images exist on disk under public/ and have non-trivial size", () => {
  const guides = Object.values(NOTICE_GUIDES);
  assert.equal(guides.length, 3);

  for (const guide of guides) {
    assert.ok(guide.imageSrc.startsWith("/images/"));
    const absPath = path.join(process.cwd(), "public", guide.imageSrc.slice(1));
    assert.ok(fs.existsSync(absPath), `Missing image asset: ${guide.imageSrc}`);
    const stat = fs.statSync(absPath);
    assert.ok(stat.size > 20_000, `Image unexpectedly small: ${guide.imageSrc}`);
  }
});

test("getCategoryNoticeGuide maps only specialized categories and omits generic/all views", () => {
  assert.equal(getCategoryNoticeGuide("전체"), null);
  assert.equal(getCategoryNoticeGuide("기타"), null);
  assert.equal(getCategoryNoticeGuide(""), null);
  assert.equal(getCategoryNoticeGuide(null), null);
  assert.equal(getCategoryNoticeGuide("에어컨/냉난방기")?.id, "aircon-set");
  assert.equal(getCategoryNoticeGuide("업소용기기")?.id, "commercial-spec");
  assert.equal(getCategoryNoticeGuide("냉장고")?.id, "home-appliance");
  assert.equal(getCategoryNoticeGuide("세탁기/건조기")?.id, "home-appliance");
});

test("notice guide copy contains zero banned anti-slop claims", () => {
  const allCopy = Object.values(NOTICE_GUIDES)
    .flatMap((g) => [
      g.kicker,
      g.title,
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
});
