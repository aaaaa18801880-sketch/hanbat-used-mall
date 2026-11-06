import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";
import {
  STORE,
  STORE_MERCHANT_POLICY,
  formatProductPrice,
  normalizeProductCategory,
  getProductStatusLabel,
  extractModelName,
  extractSpecCapsules,
  isProductSold,
} from "../../lib/site";

export const revalidate = 1800;

export async function GET() {
  let inventorySection = "";
  let totalSellingCount = 0;
  const categoryCounts: Record<string, number> = {};

  try {
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .neq("category", "배송인증")
      .order("created_at", { ascending: false })
      .limit(120);

    const productList = products ?? [];
    const sellingItems = productList.filter((p) => !isProductSold(p.status));
    totalSellingCount = sellingItems.length;

    for (const p of sellingItems) {
      const cat = normalizeProductCategory(p.category);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    const blocks = productList.map((p, idx) => {
      const cat = normalizeProductCategory(p.category);
      const status = getProductStatusLabel(p.status);
      const price = formatProductPrice(p.price, cat);
      const model = extractModelName(p.description, p.title) || "매장 문의";
      const capsules = extractSpecCapsules(p.title, p.description, 4);
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

- **전체 판매 중 검수 완료 실매물**: 총 **${totalSellingCount}대** (대전 직영 전시장 실물 확인 및 즉시 출고 가능)
${Object.entries(categoryCounts)
  .map(([cat, count]) => `- **${cat}**: 현재 **${count}대** 실시간 전시 중`)
  .join("\n")}

`
      : "";

  const warrantySection = `## 2. 공식 사후 보증 및 거래 정책 (SSOT)

1. **에어컨류 보증**: ${STORE_MERCHANT_POLICY.warrantyAircon}
2. **주요 가전 보증**: ${STORE_MERCHANT_POLICY.warrantyMajor}
3. **일반 가전 보증**: ${STORE_MERCHANT_POLICY.warrantyGeneral}
4. **반품/교환 규정**: 수령 후 ${STORE_MERCHANT_POLICY.merchantReturnDays}일 이내 기능 불량 시 무상 교환 및 A/S 지원
5. **결제 증빙**: 전자세금계산서, 현금영수증, 신용카드 100% 정식 발행

## 3. 전문 엔지니어 5단계 정밀 리퍼비시 및 검수 공정 (Inspection Protocol)

1. **통전 및 전기 안전 점검**: 절연 저항계(메거 테스트) 측정으로 누전 차단기 트립 위험을 원천 차단
2. **냉매 사이클 정밀 계측**: 디지털 매니폴드 게이지를 통한 냉매 압력·배관 진공도 및 콤프레샤 이상 부하 검사
3. **완전 분해 120bar 고압 스팀 살균 세척**: 에어컨 열교환기/송풍팬, 세탁기 세탁조/스파이더, 냉장고 내부 선반/덕트 완전 분해 친환경 세척
4. **배수 호스 · 패킹 누수 점검**: 세탁기 배수 펌프, 냉장고 제상 배수 라인, 도어 가스켓 밀폐력 전수 점검
5. **24시간 실부하 연속 시운전**: 실제 사용 환경과 동일하게 연속 가동하여 규격 냉각/탈수 온도 도달 여부 최종 합격 시에만 전시장 출고

## 4. 품목별 추천 패키지 안내

1. **원룸·자취·기숙사 알뜰 3종 세트**: 일반/양문형 냉장고 + 통돌이/드럼 세탁기 + 벽걸이 에어컨 묶음 배송·설치 할인
2. **카페·베이커리 창업 필수 세트**: 업소용 제빙기(50~100kg급) + 스텐 테이블 냉장·냉동고(1200~1800mm) + 음료/디저트 쇼케이스
3. **식당·음식점 주방 기본 세트**: 업소용 45박스 수직 냉장·냉동고 + 업소용 도어형 식기세척기 + 스텐 작업대/세정대
4. **식당·매장 폐업 일괄 정리 및 방문 매입**: 주방 설비, 냉난방기, 쇼케이스 등 현장 방문 철거 및 당일 100% 현금 입금

## 5. 실시간 등록 매물 전체 목록 (Live Catalog)

${inventorySection}
`;

  const fullText = `# ${STORE.name} 전체 실매물 카탈로그 및 상세 거래 기준 (LLMs Full Context)

- 공식 사이트: ${STORE.url}
- 매장 주소: ${STORE.roadAddress} (${STORE.jibunAddress}, ${STORE.addressNote})
- 매장 규모: 지상 1·2층 200대 이상 대형 실물 쇼룸 (매장 앞 전용 주차장 완비)
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
