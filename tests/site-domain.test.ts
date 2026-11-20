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
  toProductCardSummary,
  mightHaveRefrigeratorDiagram,
  canUseNextImageUrl,
} from "../lib/site";
import {
  INFO_GUIDE_ARTICLES,
  INFO_GUIDE_CATEGORY_LIST,
  getInfoGuideBySlug,
  getGuideCommerceBridge,
  sortGuidesByPriority,
  toGuideBoardSummary,
} from "../lib/info-guides";
import { LEGACY_GUIDE_CATEGORY_ALIASES } from "../lib/guides/meta";
import {
  SLUG_TO_GUIDE_TOOL,
  hasGuideInteractiveTool,
} from "../lib/guides/tool-slugs";
import {
  computeGuidePopularityScore,
  computeTopGuideRanks,
} from "../lib/guide-stats";

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
  it("69개 가이드의 번호와 slug가 모두 고유하고 순차적이다", () => {
    assert.equal(INFO_GUIDE_ARTICLES.length, 69);
    assert.equal(INFO_GUIDE_CATEGORY_LIST.length, 6);
    const activeCategories = new Set<string>(
      INFO_GUIDE_CATEGORY_LIST.filter((c) => c !== "전체")
    );
    for (const mapped of Object.values(LEGACY_GUIDE_CATEGORY_ALIASES)) {
      assert.ok(activeCategories.has(mapped));
    }

    const numbers = new Set<number>();
    const slugs = new Set<string>();
    for (const article of INFO_GUIDE_ARTICLES) {
      assert.ok(
        activeCategories.has(article.category),
        `미정의 소분류 사용: ${article.slug} (${article.category})`
      );
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

  it("전체 가이드가 1순위(매입·판매·계약)와 2순위(관리·고장·안전)로 누락 없이 분류·정렬된다", () => {
    const tier1Roles = new Set(["매입·처분", "구매·선택", "설치·계약"]);
    const tier2Roles = new Set(["고장·점검", "안전·관리"]);
    const tier1Ranks = new Set<number>();

    let tier1Count = 0;
    let tier2Count = 0;

    for (const article of INFO_GUIDE_ARTICLES) {
      assert.ok(article.priorityTier === 1 || article.priorityTier === 2);
      assert.ok(article.priorityRank > 0);
      if (article.priorityTier === 1) {
        tier1Count += 1;
        assert.ok(
          tier1Roles.has(article.priorityRole),
          `1순위 역할 오류: ${article.slug} (${article.priorityRole})`,
        );
        assert.equal(
          tier1Ranks.has(article.priorityRank),
          false,
          `1순위 rank 중복: ${article.priorityRank}`,
        );
        tier1Ranks.add(article.priorityRank);
      } else {
        tier2Count += 1;
        assert.ok(
          tier2Roles.has(article.priorityRole),
          `2순위 역할 오류: ${article.slug} (${article.priorityRole})`,
        );
      }
    }

    assert.equal(tier1Count, 34);
    assert.equal(tier2Count, 35);
    assert.equal(tier1Count + tier2Count, INFO_GUIDE_ARTICLES.length);

    const sorted = sortGuidesByPriority(INFO_GUIDE_ARTICLES);
    assert.equal(sorted.length, INFO_GUIDE_ARTICLES.length);

    let seenTier2 = false;
    for (const article of sorted) {
      if (article.priorityTier === 2) seenTier2 = true;
      if (article.priorityTier === 1) {
        assert.equal(
          seenTier2,
          false,
          `2순위 뒤에 1순위 노출: ${article.slug}`,
        );
      }
    }

    assert.equal(sorted[0]?.slug, "appliance-buyback-no-deduction-guide");
    assert.equal(sorted[1]?.slug, "why-used-over-new-and-store-over-p2p");
  });

  it("가이드 조회수 및 도움됐어요 가중치와 인기 TOP 3 산출이 정확하다", () => {
    assert.equal(computeGuidePopularityScore(10, 2), 20);
    assert.equal(computeGuidePopularityScore(-3, -1), 0);

    const zeroRanks = computeTopGuideRanks({
      a: { slug: "a", views: 0, helpfulCount: 0 },
      b: { slug: "b", views: 0, helpfulCount: 0 },
    });
    assert.deepEqual(zeroRanks, {});

    const ranks = computeTopGuideRanks({
      "alpha-guide": { slug: "alpha-guide", views: 5, helpfulCount: 1 }, // score 10
      "beta-guide": { slug: "beta-guide", views: 20, helpfulCount: 0 }, // score 20
      "gamma-guide": { slug: "gamma-guide", views: 3, helpfulCount: 4 }, // score 23 -> #1
      "delta-guide": { slug: "delta-guide", views: 10, helpfulCount: 2 }, // score 20, helpful 2 > beta helpful 0 -> #2
      "zero-guide": { slug: "zero-guide", views: 0, helpfulCount: 0 },
    });

    assert.equal(ranks["gamma-guide"], 1);
    assert.equal(ranks["delta-guide"], 2);
    assert.equal(ranks["beta-guide"], 3);
    assert.equal(ranks["alpha-guide"], undefined);
    assert.equal(ranks["zero-guide"], undefined);
  });

  it("목록 요약 DTO 및 이미지·도어구조도 조건 분기 헬퍼가 정확히 동작한다", () => {
    const rawProduct = {
      id: "prod-1",
      title: "라셀르 45박스 간냉식 업소용 냉장고 1140L",
      category: "업소용기기",
      description:
        "• 모델명: LS-1140R\n• 용량: 1140L\n• 가로폭: 1260mm\n매우 긴 상세 검수 소견 원문",
      image_url: "https://example.supabase.co/storage/v1/object/public/products/a.jpg",
      price: 950000,
      status: "판매중",
      condition_grade: "S급",
      created_at: "2026-10-01T00:00:00Z",
      views: 12,
    };

    const summary = toProductCardSummary(rawProduct);
    assert.equal("description" in summary, false);
    assert.equal(summary.model_name, "LS-1140R");
    assert.equal(summary.commercial_hint, "bizFridge");
    assert.ok(Array.isArray(summary.spec_capsules) && summary.spec_capsules.length > 0);

    assert.equal(
      mightHaveRefrigeratorDiagram(rawProduct.title, rawProduct.description, rawProduct.category),
      true
    );
    assert.equal(
      mightHaveRefrigeratorDiagram("린나이 4구 가스레인지", "도시가스 LNG", "업소용기기"),
      false
    );
    assert.equal(
      mightHaveRefrigeratorDiagram("LG 트롬 드럼세탁기 21kg", "", "세탁기/건조기"),
      false
    );

    assert.equal(canUseNextImageUrl("/store-exterior.jpg"), true);
    assert.equal(
      canUseNextImageUrl("https://abc123.supabase.co/storage/v1/object/public/products/1.webp"),
      true
    );
    assert.equal(canUseNextImageUrl("http://insecure.example.com/1.jpg"), false);
    assert.equal(canUseNextImageUrl(""), false);

    const firstGuide = INFO_GUIDE_ARTICLES[0];
    const boardSummary = toGuideBoardSummary(firstGuide);
    assert.equal(boardSummary.slug, firstGuide.slug);
    assert.equal("sections" in boardSummary, false);
    assert.equal("checklist" in boardSummary, false);
    assert.equal(typeof boardSummary.hasTable, "boolean");
    assert.equal(typeof boardSummary.hasDiagram, "boolean");
  });
});
