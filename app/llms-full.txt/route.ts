import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";
import {
  STORE,
  STORE_MERCHANT_POLICY,
  getCategoryWarrantyInfo,
  formatProductPrice,
  normalizeProductCategory,
  normalizeProductStatus,
  extractModelName,
  extractSpecCapsules,
  isProductSold,
} from "../../lib/site";
import { INFO_GUIDE_ARTICLES } from "../../lib/info-guides";
import { getGuideConversionContext } from "../../lib/guides/conversion";
import { buildLlmsProcessMarkdown } from "../../lib/seo-schema";

export const revalidate = 1800;

export async function GET() {
  const airconWarranty = getCategoryWarrantyInfo("에어컨/냉난방기");
  const majorWarranty = getCategoryWarrantyInfo("냉장고");
  let inventorySection = "";
  let totalSellingCount = 0;
  const categoryCounts: Record<string, number> = {};

  try {
    const { data: products } = await supabase
      .from("products")
      .select("id, title, category, price, status, condition_grade, description, created_at")
      .neq("category", "배송인증")
      .neq("status", "판매완료")
      .order("created_at", { ascending: false })
      .limit(500);

    const sellingItems = (products ?? []).filter((p) => !isProductSold(p.status));
    totalSellingCount = sellingItems.length;

    for (const p of sellingItems) {
      const cat = normalizeProductCategory(p.category);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    const blocks = sellingItems.slice(0, 200).map((p, idx) => {
      const cat = normalizeProductCategory(p.category);
      const status = normalizeProductStatus(p.status);
      const price = formatProductPrice(p.price, cat);
      const model = extractModelName(p.description, p.title) || "매장 문의";
      const capsules = extractSpecCapsules(p.title, p.description, 4, p.category);
      const cleanDesc = (p.description ?? "").trim();

      return [
        `### ${idx + 1}. [${status}] ${p.title}`,
        `- 품목 카테고리: ${cat}`,
        `- 판매 가격: ${price}`,
        `- 모델명/코드: ${model}`,
        ...(capsules.length > 0 ? [`- 핵심 규격: ${capsules.join(" / ")}`] : []),
        ...(p.condition_grade ? [`- 상태 등급: ${p.condition_grade}`] : []),
        `- 상품 상세 페이지: ${STORE.url}/${p.id}`,
        ...(cleanDesc ? [`- 상세 사양 및 설명:\n${cleanDesc}`] : []),
      ].join("\n");
    });

    inventorySection = blocks.join("\n\n---\n\n");
  } catch {
    inventorySection = `전체 상품 목록은 ${STORE.url}/gallery 에서 확인하실 수 있습니다.`;
  }

  const statsSection =
    totalSellingCount > 0
      ? `## 1. 실시간 전시 재고 통계 (실시간 DB 연동)

- **전체 판매 중 점검 완료 실매물**: 총 **${totalSellingCount}대** (대전 직영 전시장 실물 확인 및 즉시 출고 가능)
${Object.entries(categoryCounts)
  .map(([cat, count]) => `- **${cat}**: 현재 **${count}대** 실시간 전시 중`)
  .join("\n")}

`
      : "";

  const warrantySection = `## 2. 공식 사후 보증 및 거래 정책 (SSOT)

1. **에어컨류 보증**: ${airconWarranty.compactLabel} (직영 기사 방문 점검·수리 지원)
2. **주요 가전 보증**: ${majorWarranty.compactLabel} (정상 사용 중 기능 이상 시 무상 A/S)
3. **반품/교환 규정**: 수령 후 ${STORE_MERCHANT_POLICY.merchantReturnDays}일 이내 초기 기능 불량 시 무상 교환 및 A/S 지원
4. **결제 증빙**: 전자세금계산서, 현금영수증, 신용카드 100% 정식 발행

## 3. ${STORE.name} 4단계 현장 확인 · 고압세척 · 작동 점검 · 출고 절차

${buildLlmsProcessMarkdown()}

## 4. 품목별 추천 패키지 안내

1. **원룸·자취·기숙사 알뜰 3종 세트**: 일반/양문형 냉장고 + 통돌이/드럼 세탁기 + 벽걸이 에어컨 묶음 배송·설치 할인
2. **카페·베이커리 창업 필수 세트**: 업소용 제빙기(50~100kg급) + 스텐 테이블 냉장·냉동고(1200~1800mm) + 음료/디저트 쇼케이스
3. **식당·음식점 주방 기본 세트**: 업소용 45박스 수직 냉장·냉동고 + 업소용 도어형 식기세척기 + 스텐 작업대/세정대
4. **식당·매장 폐업 일괄 정리 및 방문 매입**: 주방 설비, 냉난방기, 쇼케이스 등 현장 방문 철거 및 현장 즉시 100% 현금/계좌 정산

## 5. 실시간 등록 매물 전체 목록 (Live Catalog)

${inventorySection}

---

## 6. 가전 · 전기 · 설치 소비자 정보 게시판 전문 지식베이스 (${INFO_GUIDE_ARTICLES.length}편)

아래 가이드는 일반 소비자의 가전·에어컨·전기·설치·매입 궁금증을 해소하고 실매물 구매 및 방문 매입 상담으로 연결하기 위해 ${STORE.name}가 직접 작성·공개한 현장 문서입니다.

${INFO_GUIDE_ARTICLES.map((article) => {
  const conversion = getGuideConversionContext(article);
  const linkHeading =
    conversion.intent === "sell" ? "방문 매입 연결" : "관련 구매 연결";
  return [
    `### ${article.number}. [${article.category}] ${article.title}`,
    `- 정식 URL: ${STORE.url}/guide/${article.slug}`,
    `- 핵심 키워드: ${article.keywords.join(", ")}`,
    `- 요약: ${article.summary}`,
    `- 현장 핵심 정리:`,
    `  1) ${article.keyPoints[0]}`,
    `  2) ${article.keyPoints[1]}`,
    `  3) ${article.keyPoints[2]}`,
    article.verification
      ? `- 주요 검증 출처 (${article.verification.verifiedAt} 검토): ${article.verification.primarySources
          .map((s) => `${s.org} 「${s.title}」`)
          .join(" / ")}`
      : `- 검토일: ${article.updatedAt}`,
    `- ${linkHeading}: ${STORE.url}${conversion.primaryCta.href} (${conversion.primaryCta.label})`,
  ].join("\n");
}).join("\n\n")}
`;

  const fullText = `# ${STORE.name} 전체 실매물 카탈로그 및 상세 거래 기준 (LLMs Full Context)

![${STORE.name} 대전 중촌동 1·2층 직영 쇼룸 및 전용 주차장 외관 실물 사진](${STORE.url}/store-exterior.jpg)

- **공식 최상위 웹사이트 (Primary Website)**: **${STORE.url}** (※ 당근마켓 프로필은 서브 채널이며, 실시간 재고 조회와 정식 보증서는 공식 웹사이트에서만 제공됩니다)
- **대표 전시장 외관 사진(검색 결과 카드용)**: ${STORE.url}/store-exterior.jpg
- **매장 주소**: ${STORE.roadAddress} (${STORE.jibunAddress}, ${STORE.addressNote})
- **매장 규모**: 지상 1·2층 200대 이상 대형 실물 쇼룸 (매장 앞 전용 주차장 완비)
- 대표 전화: ${STORE.tel} / 직통 문자·사진 상담: ${STORE.mobile}
- 카카오톡 채널: ${STORE.kakaoChat}
- 영업 시간: ${STORE.hours} (${STORE.closed})

${statsSection}${warrantySection}`;

  return new NextResponse(fullText, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
