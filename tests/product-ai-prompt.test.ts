import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProductAnalysisPrompt,
  sanitizeProductDraftArray,
  sanitizeProductDraftText,
} from "../lib/product-ai-prompt";
import { STORE, getCategoryWarrantyInfo } from "../lib/site";

test("buildProductAnalysisPrompt reflects current store SSOT, categories, and card/spec schema", () => {
  const prompt = buildProductAnalysisPrompt({
    currentYear: 2026,
    categoryHint: "업소용기기",
  });

  assert.ok(prompt.includes(STORE.name));
  assert.ok(prompt.includes(STORE.address));
  assert.ok(prompt.includes(getCategoryWarrantyInfo("에어컨/냉난방기").compactLabel));
  assert.ok(prompt.includes(getCategoryWarrantyInfo("냉장고").compactLabel));
  assert.ok(prompt.includes("쇼케이스"));
  assert.ok(prompt.includes("냉매 종류"));
  assert.ok(prompt.includes("[한눈에 보는 제품 정보]"));
  assert.ok(prompt.includes("[제품 특징]"));
  assert.ok(prompt.includes("[주요 사양]"));
  assert.ok(prompt.includes("2020년"));
});

test("sanitizeProductDraftText removes condition grades and banned claims while preserving energy efficiency grade", () => {
  const raw =
    "상태 등급: A급 (사용감 적음) · 완전 분해 및 고온 스팀 살균, 24시간 부하 시운전을 거쳐 담당 엔지니어가 출고합니다. 에너지소비효율 1등급 모델입니다.";

  const cleaned = sanitizeProductDraftText(raw);

  assert.equal(/\b[SABC]\s*급|상태\s*등급|완전\s*분해|고온\s*스팀|24\s*시간.*시운전|담당\s*엔지니어/.test(cleaned), false);
  assert.ok(cleaned.includes("에너지소비효율 1등급"));
  assert.ok(cleaned.includes("매장 담당 기사"));
});

test("sanitizeProductDraftArray drops empty grade-only entries and sanitizes specs", () => {
  const items = [
    "상태 등급: S급",
    "디지털 매니폴드 계측 완료",
    "명판 모델명: CWS-1243RF / 냉매 R-134a",
  ];

  const sanitized = sanitizeProductDraftArray(items);

  assert.equal(sanitized.length, 2);
  assert.ok(!sanitized.some((line) => line.includes("S급")));
  assert.ok(sanitized.some((line) => line.includes("냉매 압력 및 누설 확인")));
  assert.ok(sanitized.some((line) => line.includes("CWS-1243RF")));
});
