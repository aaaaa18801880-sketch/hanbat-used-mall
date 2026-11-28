import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDefaultQuoteName,
  buildQuoteDocumentSummary,
  buildQuoteShareMessage,
  buildQuotePdfFilename,
} from "../lib/quote-document";
import { STORE, type QuoteBasketItem } from "../lib/site";

const SAMPLE_ITEMS: QuoteBasketItem[] = [
  {
    id: "prod-1",
    title: "캐리어 스탠드 에어컨 18평",
    category: "에어컨/냉난방기",
    price: 54000,
    quantity: 1,
    status: "판매중",
    modelName: "CPV-A181",
  },
  {
    id: "prod-2",
    title: "우성 45박스 업소용 냉장고",
    category: "업소용기기",
    price: null,
    quantity: 2,
    status: "판매중",
    modelName: "CWS-1244DR",
  },
];

test("buildQuoteDocumentSummary aggregates kinds, units, and warranty remarks without price math", () => {
  const summary = buildQuoteDocumentSummary(SAMPLE_ITEMS);
  assert.equal(summary.totalKindCount, 2);
  assert.equal(summary.totalUnits, 3);
  assert.equal(summary.soldItemCount, 0);
  assert.equal(summary.lineItems[0].remark, "최대 8개월 무상보증");
  assert.equal(summary.lineItems[1].remark, "품목별 A/S 보증");
});

test("buildQuoteDocumentSummary flags sold items for similar-stock consultation", () => {
  const mixed: QuoteBasketItem[] = [
    ...SAMPLE_ITEMS,
    {
      id: "prod-4",
      title: "LG 트롬 드럼세탁기",
      category: "세탁기/건조기",
      price: null,
      quantity: 1,
      status: "판매완료",
    },
  ];
  const result = buildQuoteDocumentSummary(mixed);
  assert.equal(result.totalKindCount, 3);
  assert.equal(result.totalUnits, 4);
  assert.equal(result.soldItemCount, 1);
  assert.match(result.lineItems[2].remark, /판매완료/);
});

test("buildDefaultQuoteName summarizes categories concisely", () => {
  assert.equal(
    buildDefaultQuoteName(SAMPLE_ITEMS),
    "에어컨/냉난방기, 업소용기기 구매 견적"
  );
  assert.equal(
    buildDefaultQuoteName([SAMPLE_ITEMS[0]]),
    "에어컨/냉난방기 구매 견적"
  );
  assert.equal(buildDefaultQuoteName([]), "중고가전 구매 견적");
});

test("buildQuoteShareMessage includes recipient, items, quantities, and STORE SSOT without price totals", () => {
  const msg = buildQuoteShareMessage(SAMPLE_ITEMS, {
    recipientName: "대전식당",
    contactName: "홍길동 과장",
    quoteName: "주방·냉방 일괄 견적",
    quoteDate: "2026-11-27",
    validDays: 7,
    deliveryNote: "대전 중구 직배송",
  });

  assert.match(msg, new RegExp(STORE.name));
  assert.match(msg, new RegExp(STORE.tel));
  assert.match(msg, /수신처: 대전식당/);
  assert.match(msg, /담당자\/연락처: 홍길동 과장/);
  assert.match(msg, /총 2종 · 3대/);
  assert.match(msg, /1\. 캐리어 스탠드 에어컨 18평 × 1대/);
  assert.match(msg, /2\. 우성 45박스 업소용 냉장고 × 2대/);
  assert.doesNotMatch(msg, /부가세|공급가액|합계금액/);
});

test("buildQuotePdfFilename sanitizes unsafe path characters", () => {
  assert.equal(
    buildQuotePdfFilename("대전 / 식당*점", "2026-11-27"),
    `${STORE.name}_견적서_대전_식당_점_20261127.pdf`
  );
  assert.equal(
    buildQuotePdfFilename("   ", "2026-11-27"),
    `${STORE.name}_견적서_20261127.pdf`
  );
});
