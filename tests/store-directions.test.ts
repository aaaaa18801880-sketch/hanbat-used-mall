import test from "node:test";
import assert from "node:assert/strict";
import { STORE, STORE_NAVIGATION } from "../lib/site";
import {
  STORE_DIRECTION_ROUTES,
  STORE_DIRECTION_LANDMARKS,
  getStoreDirectionRoute,
  buildStoreDirectionsShareText,
} from "../lib/store-directions";

test("STORE_DIRECTION_ROUTES provides overview plus 3 regional approach routes with step-by-step guidance", () => {
  assert.equal(STORE_DIRECTION_ROUTES.length, 4);
  const ids = STORE_DIRECTION_ROUTES.map((r) => r.id);
  assert.deepEqual(ids, ["all", "west", "east", "north"]);

  for (const route of STORE_DIRECTION_ROUTES) {
    assert.ok(route.shortLabel.length > 0);
    assert.ok(route.summary.includes("중촌고가도로"));
    assert.ok(route.steps.length >= 3);
  }
});

test("getStoreDirectionRoute resolves valid IDs and safely falls back to overview", () => {
  assert.equal(getStoreDirectionRoute("west").id, "west");
  assert.equal(getStoreDirectionRoute("east").id, "east");
  assert.equal(getStoreDirectionRoute("north").id, "north");
  assert.equal(getStoreDirectionRoute("unknown").id, "all");
  assert.equal(getStoreDirectionRoute(null).id, "all");
});

test("buildStoreDirectionsShareText uses SSOT store address, phone, and Naver Map link", () => {
  const shareText = buildStoreDirectionsShareText();
  assert.ok(shareText.includes(STORE.name));
  assert.ok(shareText.includes(STORE.roadAddress));
  assert.ok(shareText.includes(STORE.jibunAddress));
  assert.ok(shareText.includes(STORE.tel));
  assert.ok(shareText.includes(STORE_NAVIGATION.naverMap));
  assert.equal(STORE_DIRECTION_LANDMARKS.length, 3);
});
