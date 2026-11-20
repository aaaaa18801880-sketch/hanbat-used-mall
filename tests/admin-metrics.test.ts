// 파일 경로: tests/admin-metrics.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  computeAdminMetrics,
  filterAdminInquiries,
  filterAdminProducts,
} from "../lib/admin-metrics";
import type {
  AdminDeliveryRow,
  AdminInquiryRow,
  AdminProductRow,
} from "../components/admin/admin-types";

const daysAgoIso = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const SAMPLE_INQUIRIES: AdminInquiryRow[] = [
  {
    id: "inq-1",
    name: "홍길동",
    phone: "010-1111-2222",
    inquiry_type: "내 물건 팔기",
    category: "벽걸이 에어컨 매입 문의",
    status: "접수",
    created_at: daysAgoIso(1),
  },
  {
    id: "inq-2",
    name: "김철수",
    phone: "010-3333-4444",
    inquiry_type: "구매 문의",
    category: "업소용 냉동고 가격 문의",
    status: "답변완료",
    created_at: daysAgoIso(0),
  },
  {
    id: "inq-3",
    name: "운영자",
    phone: "",
    inquiry_type: "공지",
    category: "휴무 안내 공지",
    is_notice: true,
    status: "공지",
    created_at: daysAgoIso(5),
  },
];

const SAMPLE_PRODUCTS: AdminProductRow[] = [
  {
    id: "p-1",
    title: "캐리어 인버터 냉난방기 16평형",
    category: "에어컨/냉난방기",
    status: "판매중",
    description: "[모델명: CSV-Q161AW] 점검 완료",
    created_at: daysAgoIso(45),
  },
  {
    id: "p-2",
    title: "LG 통돌이 세탁기 15kg",
    category: "세탁기/건조기",
    status: "예약중",
    description: "세척 완료",
    created_at: daysAgoIso(5),
  },
  {
    id: "p-3",
    title: "업소용 테이블 냉장고 1200",
    category: "업소용기기",
    status: "판매완료",
    description: "납품 완료",
    created_at: daysAgoIso(60),
  },
];

const SAMPLE_DELIVERIES: AdminDeliveryRow[] = [
  { id: "d-1", title: "대전 둔산동 식당 납품", created_at: daysAgoIso(3) },
];

test("computeAdminMetrics aggregates inquiry priorities, buyback, stock, and 30+ stale products", () => {
  const m = computeAdminMetrics(
    SAMPLE_INQUIRIES,
    SAMPLE_PRODUCTS,
    SAMPLE_DELIVERIES
  );
  assert.equal(m.totalInquiries, 2); // excludes notice
  assert.equal(m.priorityCount, 1);
  assert.equal(m.buybackCount, 1);
  assert.equal(m.totalProducts, 3);
  assert.equal(m.sellingProducts, 1);
  assert.equal(m.reservedProducts, 1);
  assert.equal(m.soldProducts, 1);
  assert.equal(m.staleSellingProducts, 1); // p-1 is selling & 45 days old; p-3 is sold
  assert.equal(m.deliveryCount, 1);
});

test("filterAdminInquiries prioritizes pending inquiries and handles notice/keyword filters", () => {
  const allRegular = filterAdminInquiries(SAMPLE_INQUIRIES, {
    statusFilter: "전체",
    typeFilter: "전체",
    keyword: "",
  });
  assert.deepEqual(
    allRegular.map((r) => r.id),
    ["inq-1", "inq-2"] // priority '접수' comes before newer '답변완료'
  );

  const notices = filterAdminInquiries(SAMPLE_INQUIRIES, {
    statusFilter: "notice",
    typeFilter: "전체",
    keyword: "",
  });
  assert.deepEqual(
    notices.map((r) => r.id),
    ["inq-3"]
  );

  const keywordHit = filterAdminInquiries(SAMPLE_INQUIRIES, {
    statusFilter: "전체",
    typeFilter: "구매 문의",
    keyword: "냉동고",
  });
  assert.deepEqual(
    keywordHit.map((r) => r.id),
    ["inq-2"]
  );
});

test("filterAdminProducts supports stale30 mode, category normalization, and model search", () => {
  const stale = filterAdminProducts(SAMPLE_PRODUCTS, {
    categoryFilter: "전체",
    statusFilter: "stale30",
    keyword: "",
  });
  assert.deepEqual(
    stale.map((p) => p.id),
    ["p-1"]
  );

  const byModel = filterAdminProducts(SAMPLE_PRODUCTS, {
    categoryFilter: "에어컨/냉난방기",
    statusFilter: "판매중",
    keyword: "CSV-Q161AW",
  });
  assert.deepEqual(
    byModel.map((p) => p.id),
    ["p-1"]
  );
});
