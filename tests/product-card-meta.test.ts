import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProductCardDisplay,
  extractProductBrand,
  formatCleanCardMeta,
  formatQuoteListProductTitle,
  isEligibleForSelfQuoteList,
  resolveCardWarrantyCategory,
  sanitizeCardModelCode,
  splitWarrantyHighlight,
} from "../lib/product-card-meta";
import { getCategoryWarrantyInfo } from "../lib/site";

test("extractProductBrand detects real appliance & commercial manufacturers and falls back cleanly", () => {
  assert.equal(
    extractProductBrand(
      "캐리어 16평형 인버터 벽걸이 냉난방기 (CSV-Q161AW)",
      "에어컨/냉난방기"
    ),
    "캐리어"
  );
  assert.equal(
    extractProductBrand(
      "LG 휘센 30평형 인버터 스탠드 냉난방기 (PNW1101T9S)",
      "에어컨/냉난방기"
    ),
    "LG전자"
  );
  assert.equal(
    extractProductBrand(
      "삼성 비스포크 그랑데 건조기 AI 19kg",
      "세탁기/건조기"
    ),
    "삼성전자"
  );
  assert.equal(
    extractProductBrand(
      "그랜드우성 30박스 2도어 업소용 올냉동고 710L",
      "업소용기기"
    ),
    "그랜드우성"
  );
  assert.equal(
    extractProductBrand(
      "대신전기산업 6구 업소용 전기 수저소독기 (DSH-406)",
      "업소용기기"
    ),
    "대신전기산업"
  );
  assert.equal(
    extractProductBrand(
      "천마스타 40L 업소용·산업용 건습식 진공청소기 (CM 1000 WD)",
      "기타"
    ),
    "천마스타"
  );
  assert.equal(
    extractProductBrand(
      "삼성 세라믹 전자레인지 23L 블랙 (MS23C3535AK, 2024년 제조)",
      "기타"
    ),
    "삼성전자"
  );
  assert.equal(
    extractProductBrand(
      "DAIRANG 업소용 2구 냉음료 주스 디스펜서 (독립 2구 호퍼 분할)",
      "업소용기기"
    ),
    "DAIRANG"
  );
  assert.equal(
    extractProductBrand(
      "천장형 4way 시스템 에어컨 실내기 (업소·사무실용 천장 카세트형)",
      "에어컨/냉난방기"
    ),
    "에어컨/냉난방기"
  );
});

test("sanitizeCardModelCode filters placeholder phrases and normalizes dual indoor/outdoor codes", () => {
  assert.equal(sanitizeCardModelCode("CSV-Q161AW"), "CSV-Q161AW");
  assert.equal(sanitizeCardModelCode("DSH-406"), "DSH-406");
  assert.equal(sanitizeCardModelCode("CM 1000 WD"), "CM 1000 WD");
  assert.equal(
    sanitizeCardModelCode("KDEW PLUS-50/100 (100L 모델)"),
    "KDEW PLUS-50/100"
  );
  assert.equal(
    sanitizeCardModelCode("CPV-Q1101P0I / CPV-Q1101P0O"),
    "CPV-Q1101P0I"
  );
  assert.equal(
    sanitizeCardModelCode("개별 명판 확인 필요 (25평형 / 30평형)"),
    null
  );
  assert.equal(
    sanitizeCardModelCode("벽걸이 에어컨 (상담 및 평형 지정)"),
    null
  );
});

test("buildProductCardDisplay removes duplicated brand prefix & model parentheses and surfaces crisp specs", () => {
  const carrier = buildProductCardDisplay({
    title:
      "캐리어 16평형 인버터 벽걸이 냉난방기 (냉방 6.5kW / 난방 7.5kW, CSV-Q161AW)",
    categoryLabel: "에어컨/냉난방기",
    modelName: "CSV-Q161AW",
    specCapsules: ["단상 220V", "16평형"],
  });
  assert.equal(carrier.brandLabel, "캐리어");
  assert.equal(carrier.hasBrand, true);
  assert.equal(carrier.displayTitle, "16평형 인버터 벽걸이 냉난방기");
  assert.equal(
    carrier.descriptiveTitle,
    "16평형 인버터 벽걸이 냉난방기 (냉방 6.5kW, 난방 7.5kW)"
  );
  assert.equal(carrier.modelCode, "CSV-Q161AW");
  assert.equal(carrier.specSummary, "냉방 6.5kW · 난방 7.5kW · 단상 220V");
  assert.equal(carrier.subMetaLine, "냉방 6.5kW · 난방 7.5kW · CSV-Q161AW");

  const daeshin = buildProductCardDisplay({
    title: "대신전기산업 6구 업소용 전기 수저소독기 (DSH-406)",
    categoryLabel: "업소용기기",
    modelName: "DSH-406",
    specCapsules: [],
  });
  assert.equal(daeshin.brandLabel, "대신전기산업");
  assert.equal(daeshin.displayTitle, "6구 업소용 전기 수저소독기");
  assert.equal(daeshin.descriptiveTitle, "6구 업소용 전기 수저소독기");
  assert.equal(daeshin.modelCode, "DSH-406");
  assert.equal(daeshin.specSummary, "업소용 주방·냉장설비");
  assert.equal(daeshin.subMetaLine, "DSH-406");

  // 제품 라인명(휘센/디오스)은 유지하고 선두 LG만 깔끔하게 제거
  const lg = buildProductCardDisplay({
    title:
      "LG 휘센 30평형 인버터 스탠드 냉난방기 (냉방 11.0kW / 난방 13.0kW, PNW1101T9S)",
    categoryLabel: "에어컨/냉난방기",
    modelName: "PNW1101T9S / PUW1101T9S",
    specCapsules: ["3상 380V", "30평형"],
  });
  assert.equal(lg.brandLabel, "LG전자");
  assert.equal(lg.displayTitle, "휘센 30평형 인버터 스탠드 냉난방기");
  assert.equal(lg.modelCode, "PNW1101T9S");
  assert.equal(lg.specSummary, "냉방 11.0kW · 난방 13.0kW · 3상 380V");
  assert.equal(lg.subMetaLine, "냉방 11.0kW · 난방 13.0kW · PNW1101T9S");

  const samsung = buildProductCardDisplay({
    title: "삼성 세라믹 전자레인지 23L 블랙 (MS23C3535AK, 2024년 제조)",
    categoryLabel: "기타",
    modelName: "MS23C3535AK",
    specCapsules: ["23L"],
  });
  assert.equal(samsung.brandLabel, "삼성전자");
  assert.equal(samsung.displayTitle, "세라믹 전자레인지 23L 블랙");
  assert.equal(samsung.modelCode, "MS23C3535AK");
  assert.equal(samsung.specSummary, "2024년 제조");
  assert.equal(samsung.subMetaLine, "2024년 제조 · MS23C3535AK");

  const ceiling = buildProductCardDisplay({
    title: "천장형 4way 시스템 에어컨 실내기 (업소·사무실용 천장 카세트형)",
    categoryLabel: "에어컨/냉난방기",
    modelName: "개별 명판 확인 필요 (25평형 / 30평형)",
    specCapsules: ["단상·3상 구비", "30평형"],
  });
  assert.equal(ceiling.brandLabel, "에어컨/냉난방기");
  assert.equal(ceiling.hasBrand, false);
  assert.equal(ceiling.displayTitle, "천장형 4way 시스템 에어컨 실내기");
  assert.equal(ceiling.modelCode, null);
  assert.equal(
    ceiling.specSummary,
    "업소·사무실용 천장 카세트형 · 단상·3상 구비 · 30평형"
  );
  assert.equal(
    ceiling.subMetaLine,
    "업소·사무실용 천장 카세트형 · 단상·3상 구비"
  );
});

test("formatCleanCardMeta retains backward-compatible concise formatting", () => {
  assert.equal(
    formatCleanCardMeta({
      modelName: "CSV-Q161AW",
      specCapsules: ["단상 220V", "16평형"],
    }),
    "CSV-Q161AW · 단상 220V"
  );
  assert.equal(
    formatCleanCardMeta({
      modelName: null,
      specCapsules: [],
    }),
    null
  );
});

test("splitWarrantyHighlight splits SSOT compact warranty labels into accent + label", () => {
  assert.deepEqual(
    splitWarrantyHighlight(getCategoryWarrantyInfo("에어컨/냉난방기").compactLabel),
    { accent: "최대 8개월", label: "무상보증" }
  );
  assert.deepEqual(
    splitWarrantyHighlight(getCategoryWarrantyInfo("냉장고").compactLabel),
    { accent: "최대 4개월", label: "무상보증" }
  );
  assert.deepEqual(
    splitWarrantyHighlight(getCategoryWarrantyInfo("업소용기기").compactLabel),
    { accent: "품목별", label: "A/S 보증" }
  );
  assert.equal(
    resolveCardWarrantyCategory(
      "에어컨/냉난방기",
      "삼성 세라믹 전자레인지 23L 블랙 (MS23C3535AK, 2024년 제조)"
    ),
    "기타"
  );
  assert.equal(
    resolveCardWarrantyCategory(
      "에어컨/냉난방기",
      "LG 디오스 스마트 인버터 광파오븐 32L (ML32AW)"
    ),
    "기타"
  );
  assert.equal(
    resolveCardWarrantyCategory(
      "에어컨/냉난방기",
      "캐리어 16평형 인버터 벽걸이 냉난방기 (CSV-Q161AW)"
    ),
    "에어컨/냉난방기"
  );
});

test("buildProductCardDisplay preserves thousand-separator commas and compound units like kcal/h", () => {
  const aircon = buildProductCardDisplay({
    title:
      "삼성 11평형 트라이앵글 인버터 벽걸이 에어컨 (정격냉방 4,200W, AR11K5170HV)",
    categoryLabel: "에어컨/냉난방기",
    modelName: "AR11K5170HV",
    specCapsules: ["단상 220V", "11평형"],
  });
  assert.equal(
    aircon.descriptiveTitle,
    "11평형 트라이앵글 인버터 벽걸이 에어컨 (정격냉방 4,200W)"
  );
  assert.equal(aircon.modelCode, "AR11K5170HV");

  const soupKettle = buildProductCardDisplay({
    title:
      "지에스케이 업소용 가스 자동점화 회전식 국솥 (도시가스 LNG · 28,000kcal/h, KSNRN-701)",
    categoryLabel: "업소용기기",
    modelName: "KSNRN-701",
    specCapsules: [],
  });
  assert.equal(
    soupKettle.descriptiveTitle,
    "지에스케이 업소용 가스 자동점화 회전식 국솥 (도시가스 LNG · 28,000kcal/h)"
  );
  assert.equal(soupKettle.modelCode, "KSNRN-701");

  const fridge = buildProductCardDisplay({
    title: "우성 45박스 스텐 냉장고 (1,060L, CWS-1264RF)",
    categoryLabel: "업소용기기",
    modelName: "CWS-1264RF",
    specCapsules: ["45박스", "1,060L"],
  });
  assert.equal(fridge.descriptiveTitle, "45박스 스텐 냉장고 (1,060L)");
  assert.equal(fridge.modelCode, "CWS-1264RF");
});

test("formatQuoteListProductTitle strips trailing spec/model parens, preserves brand, and returns clean modelCode", () => {
  assert.deepEqual(
    formatQuoteListProductTitle(
      "삼성 무풍 13평형 인버터 벽걸이 에어컨 (냉방전용 · R-32, AR13B9150HZ)",
      "AR13B9150HZ"
    ),
    {
      shortTitle: "삼성 무풍 13평형 인버터 벽걸이 에어컨",
      modelCode: "AR13B9150HZ",
    }
  );

  assert.deepEqual(
    formatQuoteListProductTitle(
      "LG 9평형 인버터 벽걸이형 냉난방기 (냉방 3.6kW · 난방 4.2kW, SW091BM1W)",
      null
    ),
    {
      shortTitle: "LG 9평형 인버터 벽걸이형 냉난방기",
      modelCode: "SW091BM1W",
    }
  );

  assert.deepEqual(
    formatQuoteListProductTitle(
      "LG 휘센 30평형 원형 천장형 카세트 시스템 에어컨 실내기 (380V, 모델명 확인필요)",
      "원형 실내기 (명판 모델명 확인필요)"
    ),
    {
      shortTitle: "LG 휘센 30평형 원형 천장형 카세트 시스템 에어컨 실내기",
      modelCode: null,
    }
  );

  assert.deepEqual(
    formatQuoteListProductTitle("우성 45박스 스텐 냉장고 (1,060L) (CWS-1264RF)", null),
    {
      shortTitle: "우성 45박스 스텐 냉장고",
      modelCode: "CWS-1264RF",
    }
  );
});

test("isEligibleForSelfQuoteList excludes aircon items without visible pyeong while keeping other categories", () => {
  assert.equal(
    isEligibleForSelfQuoteList({
      title: "삼성 무풍 13평형 인버터 벽걸이 에어컨 (냉방전용 · R-32, AR13B9150HZ)",
      category: "에어컨/냉난방기",
      modelName: "AR13B9150HZ",
    }),
    true
  );
  assert.equal(
    isEligibleForSelfQuoteList({
      title: "LG 휘센 18+6평 투인원 멀티 에어컨 (FQ18V...)",
      category: "에어컨/냉난방기",
    }),
    true
  );
  assert.equal(
    isEligibleForSelfQuoteList({
      title: "삼성 인버터 벽걸이 에어컨 (바이러스닥터 기능, AR-CS111BN)",
      category: "에어컨/냉난방기",
      modelName: "AR-CS111BN",
    }),
    false
  );
  assert.equal(
    isEligibleForSelfQuoteList({
      title: "중고 벽걸이 에어컨 다량 보유 (LG / 삼성 / 캐리어 등 평형별 선별 출고)",
      category: "에어컨/냉난방기",
    }),
    false
  );
  assert.equal(
    isEligibleForSelfQuoteList({
      title: "천장형 4Way 카세트 시스템에어컨 다량 보유 중",
      category: "에어컨/냉난방기",
    }),
    false
  );
  // 냉장고·업소용기기·세탁기 등 타 품목은 평수 없이 그대로 노출
  assert.equal(
    isEligibleForSelfQuoteList({
      title: "우성 45박스 스텐 냉장고 (1,060L, CWS-1264RF)",
      category: "업소용기기",
    }),
    true
  );
  assert.equal(
    isEligibleForSelfQuoteList({
      title: "LG 디오스 오브제컬렉션 양문형 냉장고 832L (S834BW12)",
      category: "냉장고",
    }),
    true
  );
});



