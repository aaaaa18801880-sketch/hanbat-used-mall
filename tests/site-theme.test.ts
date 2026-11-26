import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_OPTIONS,
  getSeasonKoreanName,
  isValidThemePreference,
  resolveActiveTheme,
  resolveSeasonThemeByMonth,
} from "../lib/site-theme";

test("기본 테마는 무채색 클린 화이트(clean)로 설정된다", () => {
  assert.equal(DEFAULT_THEME_PREFERENCE, "clean");
  assert.equal(THEME_OPTIONS[0].id, "clean");
});

test("계절 자동 테마는 12개월 모두 올바른 시즌 팔레트로 매핑된다", () => {
  // 겨울 (12, 1, 2월)
  assert.equal(resolveSeasonThemeByMonth(12), "winter");
  assert.equal(resolveSeasonThemeByMonth(1), "winter");
  assert.equal(resolveSeasonThemeByMonth(2), "winter");

  // 봄 (3, 4, 5월)
  assert.equal(resolveSeasonThemeByMonth(3), "spring-autumn");
  assert.equal(resolveSeasonThemeByMonth(4), "spring-autumn");
  assert.equal(resolveSeasonThemeByMonth(5), "spring-autumn");

  // 여름 (6, 7, 8월)
  assert.equal(resolveSeasonThemeByMonth(6), "summer");
  assert.equal(resolveSeasonThemeByMonth(7), "summer");
  assert.equal(resolveSeasonThemeByMonth(8), "summer");

  // 가을 (9, 10, 11월)
  assert.equal(resolveSeasonThemeByMonth(9), "spring-autumn");
  assert.equal(resolveSeasonThemeByMonth(10), "spring-autumn");
  assert.equal(resolveSeasonThemeByMonth(11), "spring-autumn");
});

test("resolveActiveTheme는 auto일 때 날짜 기준으로, 지정 프리셋일 때 해당 프리셋을 그대로 반환한다", () => {
  assert.equal(resolveActiveTheme("auto", new Date(2026, 6, 15)), "summer"); // 7월
  assert.equal(resolveActiveTheme("auto", new Date(2026, 0, 10)), "winter"); // 1월
  assert.equal(resolveActiveTheme("auto", new Date(2026, 9, 20)), "spring-autumn"); // 10월

  assert.equal(resolveActiveTheme("clean", new Date(2026, 6, 15)), "clean");
  assert.equal(resolveActiveTheme("winter", new Date(2026, 6, 15)), "winter");
});

test("isValidThemePreference는 허용된 값만 통과시키고 계절명 헬퍼가 정확하다", () => {
  assert.equal(isValidThemePreference("clean"), true);
  assert.equal(isValidThemePreference("auto"), true);
  assert.equal(isValidThemePreference("summer"), true);
  assert.equal(isValidThemePreference("spring-autumn"), true);
  assert.equal(isValidThemePreference("winter"), true);
  assert.equal(isValidThemePreference("neon-pink"), false);
  assert.equal(isValidThemePreference(null), false);

  assert.equal(getSeasonKoreanName(4), "봄");
  assert.equal(getSeasonKoreanName(7), "여름");
  assert.equal(getSeasonKoreanName(10), "가을");
  assert.equal(getSeasonKoreanName(1), "겨울");
});
