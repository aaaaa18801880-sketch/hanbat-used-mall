// 파일 경로: tests/purchase-wizard.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { PRODUCT_CATEGORIES } from "../lib/site";
import {
  WIZARD_CATEGORY_META,
  WIZARD_QUICK_REGIONS,
  applyQuickRegion,
  getStep1PrimaryCta,
  getStep3Readiness,
  getWizardDisplayStep,
  getWizardProgressPercent,
  getWizardStepCount,
} from "../lib/purchase-wizard";

test("모든 PRODUCT_CATEGORIES 항목에 친절한 메타 라벨과 예시 힌트가 존재한다", () => {
  for (const cat of PRODUCT_CATEGORIES) {
    const meta = WIZARD_CATEGORY_META[cat];
    assert.ok(meta, `누락된 카테고리 메타: ${cat}`);
    assert.ok(meta.label.trim().length > 0);
    assert.ok(meta.hint.trim().length > 0);
  }
});

test("매입 모드에서 사진 첨부 시 2단계 흐름으로 단축되고 진행률이 정확히 계산된다", () => {
  assert.equal(getWizardStepCount(true, 0), 3);
  assert.equal(getWizardProgressPercent(1, true, 0), 33);
  assert.equal(getWizardProgressPercent(2, true, 0), 67);
  assert.equal(getWizardProgressPercent(3, true, 0), 100);

  assert.equal(getWizardStepCount(true, 1), 2);
  assert.equal(getWizardDisplayStep(1, true, 1), 1);
  assert.equal(getWizardDisplayStep(3, true, 1), 2);
  assert.equal(getWizardProgressPercent(1, true, 1), 50);
  assert.equal(getWizardProgressPercent(3, true, 1), 100);

  assert.equal(getWizardStepCount(false, 2), 3);
});

test("Step 1 CTA 라벨과 준비 상태가 선택 품목·사진 여부에 따라 명확히 바뀐다", () => {
  assert.deepEqual(
    getStep1PrimaryCta({ isSell: true, selectedCategoriesCount: 0, selectedFilesCount: 0 }),
    { label: "사진을 올리거나 품목을 골라주세요", ready: false }
  );
  assert.deepEqual(
    getStep1PrimaryCta({ isSell: true, selectedCategoriesCount: 2, selectedFilesCount: 0 }),
    { label: "2개 품목 선택됨 · 다음으로", ready: true }
  );
  assert.deepEqual(
    getStep1PrimaryCta({ isSell: true, selectedCategoriesCount: 0, selectedFilesCount: 1 }),
    { label: "바로 연락처 입력하기", ready: true }
  );
});

test("빠른 지역 선택 칩은 기존 동 주소를 보존하며 구/시 접두사만 깔끔하게 교체한다", () => {
  assert.ok(WIZARD_QUICK_REGIONS.includes("대전 중구"));
  assert.equal(applyQuickRegion("", "대전 서구"), "대전 서구");
  assert.equal(applyQuickRegion("대전 서구", "대전 유성구"), "대전 유성구");
  assert.equal(applyQuickRegion("대전 서구 둔산동", "대전 중구"), "대전 중구 둔산동");
  assert.equal(applyQuickRegion("중촌동", "대전 중구"), "대전 중구 중촌동");
  assert.equal(applyQuickRegion("대전 중구 중촌동", "대전 중구"), "대전 중구 중촌동");
});

test("Step 3 제출 준비 검사가 필수 항목과 비밀번호 조건을 순서대로 안내한다", () => {
  assert.equal(
    getStep3Readiness({ name: "", phone: "", password: "", agreed: false }).ready,
    false
  );
  assert.equal(
    getStep3Readiness({ name: "홍길동", phone: "010-123", password: "", agreed: true }).phoneValid,
    false
  );
  assert.equal(
    getStep3Readiness({ name: "홍길동", phone: "010-1234-5678", password: "12", agreed: true }).ready,
    false
  );
  assert.equal(
    getStep3Readiness({ name: "홍길동", phone: "010-1234-5678", password: "", agreed: false }).ready,
    false
  );
  assert.deepEqual(
    getStep3Readiness({ name: "홍길동", phone: "010-1234-5678", password: "", agreed: true }),
    { ready: true, phoneValid: true, missingHint: null }
  );
});
