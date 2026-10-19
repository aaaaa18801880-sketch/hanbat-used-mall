import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";
import {
  STORE,
  formatProductPrice,
  normalizeProductCategory,
  getProductStatusLabel,
  extractModelName,
  extractSpecCapsules,
} from "../../lib/site";

export const revalidate = 1800;

export async function GET() {
  let inventorySection = "";

  try {
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .neq("category", "배송인증")
      .order("created_at", { ascending: false })
      .limit(120);

    const blocks = (products ?? []).map((p, idx) => {
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

  const fullText = `# ${STORE.name} 전체 실매물 카탈로그 및 상세 거래 기준 (LLMs Full Context)

- 공식 사이트: ${STORE.url}
- 매장 주소: ${STORE.roadAddress} (${STORE.jibunAddress}, ${STORE.addressNote})
- 대표 전화: ${STORE.tel} / 직통 문자·사진 상담: ${STORE.mobile}
- 카카오톡 채널: ${STORE.kakaoChat}
- 영업 시간: ${STORE.hours} (${STORE.closed})

## 품목별 추천 패키지 안내

1. **원룸·자취·기숙사 알뜰 3종 세트**: 일반/양문형 냉장고 + 통돌이/드럼 세탁기 + 벽걸이 에어컨 묶음 배송·설치 할인
2. **카페·베이커리 창업 필수 세트**: 업소용 제빙기(50~100kg급) + 스텐 테이블 냉장·냉동고(1200~1800mm) + 음료/디저트 쇼케이스
3. **식당·음식점 주방 기본 세트**: 업소용 45박스 수직 냉장·냉동고 + 업소용 도어형 식기세척기 + 스텐 작업대/세정대
4. **식당·매장 폐업 일괄 정리 및 방문 매입**: 주방 설비, 냉난방기, 쇼케이스 등 현장 방문 철거 및 당일 100% 현금 입금

## 실시간 등록 매물 전체 목록

${inventorySection}
`;

  return new NextResponse(fullText, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
