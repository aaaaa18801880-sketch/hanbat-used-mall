import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  SHOWROOM_CATEGORIES,
  RAIL_DRAG_THRESHOLD_PX,
  computeRailDragScroll,
  filterShowroomCategoriesByGroup,
  getShowroomCategoryWarrantyLabel,
  matchesShowroomCategory,
} from "../lib/showroom-categories";

const ROOT = process.cwd();

test("SHOWROOM_CATEGORIES defines 8 unique studio categories with existing local assets and zero AI slop", () => {
  assert.equal(SHOWROOM_CATEGORIES.length, 8);
  const seenKeys = new Set<string>();
  const banned = /완전 분해|고온 스팀|UV 살균|24시간|부하 시운전|연속 시운전|디지털 매니폴드|엔지니어/;

  for (const item of SHOWROOM_CATEGORIES) {
    assert.ok(!seenKeys.has(item.key), `duplicate showroom key: ${item.key}`);
    seenKeys.add(item.key);

    assert.ok(item.tagline.trim().length >= 8, `tagline missing for ${item.key}`);
    assert.ok(item.imageSrc.startsWith("/images/showroom/"), `unexpected imageSrc: ${item.imageSrc}`);
    const absImage = path.join(ROOT, "public", item.imageSrc.replace(/^\//, ""));
    assert.ok(fs.existsSync(absImage), `missing showroom studio asset: ${absImage}`);

    const combined = `${item.label} ${item.subLabel} ${item.tagline} ${item.specPoint}`;
    assert.ok(!banned.test(combined), `AI slop phrase found in ${item.key}: ${combined}`);
  }
});

test("filterShowroomCategoriesByGroup cleanly partitions home (4) and biz (3) categories", () => {
  assert.equal(filterShowroomCategoriesByGroup("all").length, 8);
  const home = filterShowroomCategoriesByGroup("home");
  const biz = filterShowroomCategoriesByGroup("biz");
  assert.equal(home.length, 4);
  assert.equal(biz.length, 3);
  assert.ok(home.every((c) => c.group === "home"));
  assert.ok(biz.every((c) => c.group === "biz"));
});

test("matchesShowroomCategory partitions commercial items mutually exclusively and warranty labels reflect SSOT", () => {
  const sampleCommercial = [
    { category: "업소용기기", title: "우성 45박스 스텐 냉장고" },
    { category: "업소용기기", title: "캐리어 음료 쇼케이스 400L" },
    { category: "업소용기기", title: "호시자키 큐브 제빙기 50kg" },
  ];

  const bizCats = filterShowroomCategoriesByGroup("biz");
  for (const product of sampleCommercial) {
    const matched = bizCats.filter((cat) => matchesShowroomCategory(product, cat));
    assert.equal(matched.length, 1, `expected exact 1 commercial bucket for ${product.title}`);
  }

  const aircon = SHOWROOM_CATEGORIES.find((c) => c.key === "aircon")!;
  const fridge = SHOWROOM_CATEGORIES.find((c) => c.key === "fridge")!;
  assert.match(getShowroomCategoryWarrantyLabel(aircon), /8개월/);
  assert.match(getShowroomCategoryWarrantyLabel(fridge), /4개월/);
});

test("computeRailDragScroll ignores micro jitter and scrolls cleanly on left/right drag with clamping", () => {
  const jitter = computeRailDragScroll({
    startX: 500,
    currentX: 500 - (RAIL_DRAG_THRESHOLD_PX - 1),
    startScrollLeft: 0,
    maxScrollLeft: 600,
  });
  assert.equal(jitter.isDragging, false);
  assert.equal(jitter.nextScrollLeft, 0);

  const dragLeft = computeRailDragScroll({
    startX: 600,
    currentX: 400,
    startScrollLeft: 0,
    maxScrollLeft: 600,
    multiplier: 1,
  });
  assert.equal(dragLeft.isDragging, true);
  assert.equal(dragLeft.nextScrollLeft, 200);

  const dragRight = computeRailDragScroll({
    startX: 400,
    currentX: 550,
    startScrollLeft: 300,
    maxScrollLeft: 600,
    multiplier: 1,
  });
  assert.equal(dragRight.isDragging, true);
  assert.equal(dragRight.nextScrollLeft, 150);

  const clampedRight = computeRailDragScroll({
    startX: 600,
    currentX: 0,
    startScrollLeft: 400,
    maxScrollLeft: 500,
    multiplier: 1.15,
  });
  assert.equal(clampedRight.nextScrollLeft, 500);

  const clampedLeft = computeRailDragScroll({
    startX: 100,
    currentX: 500,
    startScrollLeft: 50,
    maxScrollLeft: 500,
  });
  assert.equal(clampedLeft.nextScrollLeft, 0);
});
