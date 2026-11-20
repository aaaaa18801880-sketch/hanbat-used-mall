import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  REFURBISH_STEPS,
  getAdjacentRefurbishStepId,
  getRefurbishStepById,
} from "../lib/refurbish-process";
import {
  formatInquiryRelativeDate,
  getInquiryTypeTone,
  summarizeInquiryActivity,
} from "../lib/inquiry-feed";
import {
  INFO_GUIDE_ARTICLES,
  sortGuidesByPriority,
  toGuideBoardSummary,
} from "../lib/info-guides";
import { STORE, getCategoryWarrantyInfo } from "../lib/site";

test("REFURBISH_STEPS defines 4 authentic steps with dedicated local photographs", () => {
  assert.equal(REFURBISH_STEPS.length, 4);
  assert.deepEqual(
    REFURBISH_STEPS.map((s) => s.tabLabel),
    [
      "01. 현장 확인·입고",
      "02. 고압세척·위생 정리",
      "03. 배송 전 작동 점검",
      "04. 직배송·설치·A/S",
    ]
  );

  const step1 = getRefurbishStepById("intake");
  assert.ok(step1.headline.includes("현장"));
  assert.equal(step1.imageSrc, "/images/field-intake-check.jpg");

  const step3 = getRefurbishStepById("precheck");
  assert.equal(step3.imageSrc, "/images/precheck-operation.jpg");

  const step4 = getRefurbishStepById("delivery");
  assert.equal(step4.imageSrc, "/images/direct-delivery-install.jpg");

  for (const step of REFURBISH_STEPS) {
    const absPath = path.join(process.cwd(), "public", step.imageSrc);
    assert.ok(
      fs.existsSync(absPath),
      `단계 이미지 파일이 public 아래에 존재해야 합니다: ${step.imageSrc}`
    );
  }

  const combinedText = JSON.stringify(REFURBISH_STEPS);
  assert.equal(
    /완전\s*분해|분해\s*세척|고온\s*스팀|UV|24시간|절연저항|기동\s*전류|PCB|등급\s*판정|계약별 무상보증 협의/.test(
      combinedText
    ),
    false,
    "실제 매장 공정과 다른 과장 문구가 포함되면 안 됩니다."
  );
});

test("REFURBISH_STEPS references SSOT warranty policies and store constants", () => {
  const airconWarranty = getCategoryWarrantyInfo("에어컨/냉난방기");
  const majorWarranty = getCategoryWarrantyInfo("냉장고");

  const deliveryStep = getRefurbishStepById("delivery");
  assert.ok(
    deliveryStep.metrics.some((m) => m.value === airconWarranty.compactLabel)
  );
  assert.ok(
    deliveryStep.metrics.some((m) => m.value === majorWarranty.compactLabel)
  );
  assert.ok(deliveryStep.warrantyScopeLabel.includes(STORE.name));
  assert.ok(deliveryStep.checkItems.some((c) => c.includes(STORE.tel)));
});

test("getAdjacentRefurbishStepId wraps around cleanly at both ends", () => {
  assert.equal(getAdjacentRefurbishStepId("intake", 1), "wash");
  assert.equal(getAdjacentRefurbishStepId("intake", -1), "delivery");
  assert.equal(getAdjacentRefurbishStepId("delivery", 1), "intake");
  assert.equal(getAdjacentRefurbishStepId("delivery", -1), "precheck");
});

test("inquiry-feed helpers compute accurate real activity summary and relative dates", () => {
  const now = new Date("2026-11-20T12:00:00Z").getTime();
  assert.equal(
    formatInquiryRelativeDate("2026-11-20T11:30:00Z", now),
    "방금 전"
  );
  assert.equal(
    formatInquiryRelativeDate("2026-11-20T09:00:00Z", now),
    "3시간 전"
  );
  assert.equal(formatInquiryRelativeDate("2026-11-19T09:00:00Z", now), "어제");
  assert.equal(
    formatInquiryRelativeDate("2026-11-16T09:00:00Z", now),
    "4일 전"
  );
  assert.equal(
    formatInquiryRelativeDate("2026-10-05T09:00:00Z", now),
    "10.05"
  );

  assert.equal(getInquiryTypeTone("내 물건 팔기"), "sell");
  assert.equal(getInquiryTypeTone("구매 문의"), "buy");
  assert.equal(getInquiryTypeTone("대량·업소용 상담"), "bulk");

  const summary = summarizeInquiryActivity([
    {
      id: 1,
      inquiry_type: "내 물건 팔기",
      category: "냉장고",
      name: "이*경",
      status: "답변완료",
      is_notice: false,
    },
    {
      id: 2,
      inquiry_type: "구매 문의",
      category: "에어컨",
      name: "박*현",
      status: "답변완료",
      is_notice: false,
    },
    {
      id: 3,
      inquiry_type: "내 물건 팔기",
      category: "세탁기",
      name: "김*수",
      status: "접수",
      is_notice: false,
    },
    {
      id: 4,
      inquiry_type: "공지사항",
      category: "공지",
      name: "관리자",
      status: "공지",
      is_notice: true,
    },
  ]);

  assert.equal(summary.totalShown, 3);
  assert.equal(summary.answeredCount, 2);
  assert.equal(summary.sellCount, 2);
  assert.equal(summary.buyOrBulkCount, 1);
  assert.equal(summary.answeredRate, 67);
});

test("all 69 guide board summaries resolve to existing local images with 12 unique thumbnails on page 1", () => {
  const summaries = sortGuidesByPriority(INFO_GUIDE_ARTICLES).map(
    toGuideBoardSummary
  );
  assert.equal(summaries.length, 69);

  for (const item of summaries) {
    assert.ok(item.thumbnailSrc.startsWith("/images/guide/"));
    assert.ok(item.readMinutes > 0);
    const absPath = path.join(process.cwd(), "public", item.thumbnailSrc);
    assert.ok(
      fs.existsSync(absPath),
      `정보 게시판 썸네일 파일이 존재해야 합니다: ${item.slug} -> ${item.thumbnailSrc}`
    );
  }

  const page1Thumbs = new Set(summaries.slice(0, 12).map((s) => s.thumbnailSrc));
  assert.equal(
    page1Thumbs.size,
    12,
    "정보 게시판 1페이지(12편)의 모든 썸네일은 서로 다른 이미지여야 합니다."
  );
});
