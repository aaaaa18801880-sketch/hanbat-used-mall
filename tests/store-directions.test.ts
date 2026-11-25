import test from "node:test";
import assert from "node:assert/strict";
import { STORE, STORE_NAVIGATION } from "../lib/site";
import {
  STORE_DIRECTION_ROUTES,
  STORE_DIRECTION_LANDMARKS,
  STORE_DIRECTION_PHOTO_STEPS,
  getStoreDirectionRoute,
  buildStoreDirectionsShareText,
} from "../lib/store-directions";

test("STORE_DIRECTION_ROUTES provides overview plus north/south 대전천서로 alley approach routes", () => {
  assert.equal(STORE_DIRECTION_ROUTES.length, 3);
  const ids = STORE_DIRECTION_ROUTES.map((r) => r.id);
  assert.deepEqual(ids, ["all", "north", "south"]);

  for (const route of STORE_DIRECTION_ROUTES) {
    assert.ok(route.shortLabel.length > 0);
    assert.ok(route.summary.includes("주공하나마트"));
    assert.ok(route.summary.includes("골목"));
    assert.ok(route.steps.length >= 3);
  }
});

test("getStoreDirectionRoute resolves valid IDs and safely falls back to overview", () => {
  assert.equal(getStoreDirectionRoute("north").id, "north");
  assert.equal(getStoreDirectionRoute("south").id, "south");
  assert.equal(getStoreDirectionRoute("unknown").id, "all");
  assert.equal(getStoreDirectionRoute(null).id, "all");
});

test("buildStoreDirectionsShareText uses SSOT store address, alley tip, phone, and Naver Map link", () => {
  const shareText = buildStoreDirectionsShareText();
  assert.ok(shareText.includes(STORE.name));
  assert.ok(shareText.includes(STORE.roadAddress));
  assert.ok(shareText.includes(STORE.jibunAddress));
  assert.ok(shareText.includes("주공하나마트"));
  assert.ok(shareText.includes("중촌고가교"));
  assert.ok(shareText.includes(STORE.tel));
  assert.ok(shareText.includes(STORE_NAVIGATION.naverMap));
  assert.equal(STORE_DIRECTION_LANDMARKS.length, 3);
});

test("STORE_DIRECTION_PHOTO_STEPS provides 3 ordered real alley photos under /images/directions/", () => {
  assert.equal(STORE_DIRECTION_PHOTO_STEPS.length, 3);
  assert.deepEqual(
    STORE_DIRECTION_PHOTO_STEPS.map((s) => s.stepNumber),
    ["01", "02", "03"]
  );
  for (const step of STORE_DIRECTION_PHOTO_STEPS) {
    assert.ok(step.imageSrc.startsWith("/images/directions/"));
    assert.ok(step.title.length > 0);
    assert.ok(step.shortCaption.length > 0);
    assert.ok(step.detailCaption.length > 0);
    assert.ok(step.imageAlt.length > 0);
  }
});
