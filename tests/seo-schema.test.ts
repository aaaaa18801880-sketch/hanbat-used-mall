import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBreadcrumbJsonLd,
  buildBuybackServiceJsonLd,
  buildHomeFaqJsonLd,
  buildLlmsProcessMarkdown,
  HOME_SCHEMA_FAQS,
} from "../lib/seo-schema";
import { STORE } from "../lib/site";

const BANNED_CLAIMS =
  /완전\s*분해|분해\s*세척|분해세척|120bar|24시간|고온\s*스팀|스팀\s*살균|UV|메거|절연\s*저항|시운전|계약조건별|계약\s*조건별/;

test("buildHomeFaqJsonLd returns valid FAQPage schema with SSOT facts and zero banned claims", () => {
  const faq = buildHomeFaqJsonLd();
  assert.equal(faq["@type"], "FAQPage");
  assert.equal(faq.mainEntity.length, HOME_SCHEMA_FAQS.length);
  assert.ok(faq.mainEntity.length >= 4);

  const serialized = JSON.stringify(faq);
  assert.ok(serialized.includes(STORE.name));
  assert.ok(serialized.includes("최대 8개월 무상보증"));
  assert.ok(serialized.includes("최대 4개월 무상보증"));
  assert.equal(BANNED_CLAIMS.test(serialized), false);
});

test("buildBreadcrumbJsonLd formats absolute URLs and sequential positions", () => {
  const bc = buildBreadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "방문 매입", path: "/purchase" },
  ]);

  assert.equal(bc["@type"], "BreadcrumbList");
  assert.equal(bc.itemListElement.length, 2);
  assert.equal(bc.itemListElement[0].position, 1);
  assert.equal(bc.itemListElement[0].item, `${STORE.url}/`);
  assert.equal(bc.itemListElement[1].position, 2);
  assert.equal(bc.itemListElement[1].item, `${STORE.url}/purchase`);
});

test("buildBuybackServiceJsonLd references STORE localbusiness and buyback artwork", () => {
  const service = buildBuybackServiceJsonLd();
  assert.equal(service["@type"], "Service");
  assert.equal(service.url, `${STORE.url}/purchase`);
  assert.equal(service.provider.telephone, STORE.tel);
  assert.equal(service.image, `${STORE.url}/images/guide/buyback-appraisal.jpg`);
  assert.equal(BANNED_CLAIMS.test(JSON.stringify(service)), false);
});

test("buildLlmsProcessMarkdown exposes authentic 4-step workflow without AI slop", () => {
  const md = buildLlmsProcessMarkdown();
  assert.ok(md.includes("1. **현장 확인·입고"));
  assert.ok(md.includes("2. **고압세척·위생 정리"));
  assert.ok(md.includes("3. **배송 전 작동 점검"));
  assert.ok(md.includes("4. **직배송·설치·A/S"));
  assert.equal(BANNED_CLAIMS.test(md), false);
});
