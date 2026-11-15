// 파일 경로: tests/site-domain.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  STORE,
  STORE_MERCHANT_POLICY,
  formatPhone,
  isValidPhone,
  maskName,
  maskPhone,
  formatProductPrice,
  extractModelName,
  extractWidthMmFromText,
  extractSpecCapsules,
  matchesSearchQuery,
  sanitizeOldManufactureYear,
  normalizeProductCategory,
  getCategoryWarrantyInfo,
  formatStructuredInquiryDescription,
  parseStructuredInquiryDescription,
} from "../lib/site";
import {
  INFO_GUIDE_ARTICLES,
  getInfoGuideBySlug,
  getGuideCommerceBridge,
} from "../lib/info-guides";
import {
  SLUG_TO_GUIDE_TOOL,
  hasGuideInteractiveTool,
} from "../lib/guides/tool-slugs";

describe("lib/site 도메인 파서·검증·SSOT 테스트", () => {
  it("STORE 상수 및 보증 정책 SSOT 정합성을 유지한다", () => {
    assert.equal(STORE.name, "한밭중고전자");
    assert.equal(STORE.tel, "042-523-8179");
    assert.equal(STORE.mobile, "010-6631-8179");
    assert.match(STORE_MERCHANT_POLICY.warrantyAircon, /8개월/);
    assert.match(STORE_MERCHANT_POLICY.warrantyMajor, /4개월/);

    const airconWarranty = getCategoryWarrantyInfo("에어컨/냉난방기");
    assert.match(airconWarranty.shortLabel, /8개월/);
    const fridgeWarranty = getCategoryWarrantyInfo("냉장고");
    assert.match(fridgeWarranty.shortLabel, /4개월/);
  });

  it("전화번호 포맷팅·검증·마스킹이 정상 동작한다", () => {
    assert.equal(formatPhone("01066318179"), "010-6631-8179");
    assert.equal(formatPhone("0425238179"), "042-523-8179");
    assert.equal(isValidPhone("010-6631-8179"), true);
    assert.equal(isValidPhone("042-523-8179"), true);
    assert.equal(isValidPhone("123-45"), false);

    assert.equal(maskName("김철수"), "김*수");
    assert.equal(maskName("홍길동이"), "홍**이");
    assert.equal(maskPhone("010-6631-8179"), "010-****-8179");
  });

  it("모델명·가로폭·스펙 캡슐·가격 포맷팅을 정확히 추출한다", () => {
    const title = "삼성 양문형 냉장고 RS84T5071B4 846L 1등급";
    const desc = "사이즈 가로 912mm 깊이 930mm 상태 양호";

    assert.equal(extractModelName(desc, title), "RS84T5071B4");
    assert.equal(extractWidthMmFromText(`${title} ${desc}`), 912);
    assert.equal(formatProductPrice(450000, "냉장고"), "450,000원");
    assert.equal(formatProductPrice(null, "냉장고"), "배송·설치 맞춤 견적");

    const capsules = extractSpecCapsules(title, desc, 4, "냉장고");
    assert.ok(capsules.includes("846L"));
    assert.ok(capsules.includes("1등급"));
    assert.ok(capsules.includes("양문형"));

    const tableCapsules = extractSpecCapsules(
      "라셀르 업소용 테이블냉장고 1500mm",
      "카페 주방용",
      4,
      "업소용기기"
    );
    assert.ok(tableCapsules.includes("폭 1500mm"));
  });

  it("다중 토큰 검색 매칭과 과도한 구연식 치환을 수행한다", () => {
    assert.equal(normalizeProductCategory("냉난방기"), "에어컨/냉난방기");
    assert.equal(
      matchesSearchQuery("삼성 인버터", "삼성 투인원 인버터 에어컨", "무풍"),
      true
    );
    assert.equal(
      matchesSearchQuery("LG 스탠드", "삼성 45박스 간냉식 냉동고"),
      false
    );

    const sanitized = sanitizeOldManufactureYear({
      title: "2018년식 삼성 냉장고",
      specDetails: "제조년월: 2018년 3월",
      photoObserved: ["제조일자: 2019년 확인"],
    });
    assert.equal(sanitized.title?.includes("2018년식"), false);
    assert.equal(sanitized.specDetails?.includes("2018년"), false);
  });

  it("구조화 문의 설명 포맷·파싱 라운드트립이 일치한다", () => {
    const formatted = formatStructuredInquiryDescription({
      inquiryType: "대량·업소용 상담",
      customerContent: "설치 일정 조율 희망합니다.",
      applianceCategory: "업소용기기",
      modelNumber: "AP140ANPDHH1",
      region: "대전 유성구",
      businessType: "카페 창업",
      bulkItems: [{ category: "스탠드 에어컨", requestedQuantity: "2대" }],
    });

    const parsed = parseStructuredInquiryDescription(formatted);
    assert.equal(parsed.isStructured, true);
    assert.equal(parsed.customerContent, "설치 일정 조율 희망합니다.");
    assert.ok(
      parsed.structuredLines.some((line) => line.value.includes("대전 유성구"))
    );
    assert.ok(
      parsed.bulkItems.some((line) => line.includes("스탠드 에어컨"))
    );
  });
});

describe("정보 가이드 데이터 및 계산기 브릿지 무결성 테스트", () => {
  it("62개 가이드의 번호와 slug가 모두 고유하고 순차적이다", () => {
    assert.equal(INFO_GUIDE_ARTICLES.length, 62);

    const numbers = new Set<number>();
    const slugs = new Set<string>();
    for (const article of INFO_GUIDE_ARTICLES) {
      assert.equal(numbers.has(article.number), false);
      assert.equal(slugs.has(article.slug), false);
      numbers.add(article.number);
      slugs.add(article.slug);

      const bridge = getGuideCommerceBridge(article);
      assert.ok(bridge.galleryHref.startsWith("/gallery"));

      assert.ok(
        article.verification,
        `누락된 검증·출처 메타데이터: #${article.number} ${article.slug}`
      );
      assert.ok(article.verification.verifiedAt.length >= 10);
      assert.ok(article.verification.contentTypes.length >= 1);
      assert.ok(
        article.verification.primarySources.length >= 2,
        `출처 2건 미만: #${article.number} ${article.slug}`
      );
      assert.ok(article.verification.fieldNote.length > 10);

      const headlineText = [article.title, article.summary, ...article.keyPoints].join(" ");
      assert.equal(
        /동계학술|복사열 분율|보충공기\(MUA\)|현열·잠열|임피던스 분압|중성점 전위 이동|100% 떨어/.test(
          headlineText
        ),
        false,
        `소비자 가독성 위배 문구 발견: #${article.number} ${article.slug}`
      );
    }

    for (const slug of Object.keys(SLUG_TO_GUIDE_TOOL)) {
      assert.ok(getInfoGuideBySlug(slug), `누락된 계산기 slug: ${slug}`);
      assert.equal(hasGuideInteractiveTool(slug), true);
    }
    assert.equal(hasGuideInteractiveTool("non-existent-slug"), false);
  });
});
