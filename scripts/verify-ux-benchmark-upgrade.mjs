// 파일 경로: scripts/verify-ux-benchmark-upgrade.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

function read(relPath) {
  const full = path.join(rootDir, relPath);
  assert.ok(fs.existsSync(full), `필수 파일 누락: ${relPath}`);
  return fs.readFileSync(full, "utf8");
}

function runVerification() {
  const siteCode = read("lib/site.ts");
  assert.ok(
    siteCode.includes("updateQuoteBasketItemQuantity") &&
      siteCode.includes("addRecentViewedProduct") &&
      siteCode.includes("getCategoryFaqs") &&
      siteCode.includes("getDaysSinceCreated"),
    "lib/site.ts에 수량 변경, 최근 본 상품, 카테고리별 FAQ, 재고 경과일 헬퍼가 모두 포함되어야 합니다."
  );
  console.log("✓ [PASS] 1. lib/site.ts 견적함 수량·최근 본 매물·FAQ·재고 경과일 헬퍼 확인");

  const compareCode = read("components/products/product-compare-modal.tsx");
  assert.ok(
    compareCode.includes("ProductCompareModal") &&
      compareCode.includes("RecentViewedStrip") &&
      compareCode.includes("extractWidthMmFromItem") &&
      compareCode.includes("설치 공간 가로폭 참고"),
    "ProductCompareModal에 가로폭 자동 합산 안내 배너 및 RecentViewedStrip이 포함되어야 합니다."
  );
  console.log("✓ [PASS] 2. 매물 비교 모달(가로폭 자동 합산 가이드) 및 최근 본 매물 스트립 확인");

  const galleryCode = read("app/gallery/page.tsx");
  assert.ok(
    galleryCode.includes("PRICE_RANGE_OPTIONS") &&
      galleryCode.includes("SITUATION_PRESETS") &&
      galleryCode.includes("RecentViewedStrip") &&
      galleryCode.includes("addRecentViewedProduct") &&
      galleryCode.includes("미등록 재고"),
    "app/gallery/page.tsx에 가격대 필터, 상황별 프리셋 4종, 최근 본 매물, 0건 검색어 미등록 재고 문의가 포함되어야 합니다."
  );
  console.log("✓ [PASS] 3. 갤러리 상황별 프리셋·가격필터·최근 본 매물·0건 미등록 재고 구제 연동 확인");

  const detailCode = read("app/[id]/page.tsx");
  assert.ok(
    detailCode.includes("getCategoryFaqs") &&
      detailCode.includes("RecentViewedStrip") &&
      detailCode.includes("외관 · 상태 등급") &&
      detailCode.includes("InteractiveChecklistAndCta"),
    "app/[id]/page.tsx에 품목별 FAQ, 최근 본 매물, 외관·상태 등급 및 InteractiveChecklistAndCta가 연결되어야 합니다."
  );
  console.log("✓ [PASS] 4. 상품 상세 페이지 인터랙티브 설치 환경 체크리스트 및 상태 등급 표시 확인");

  const adminCode = read("app/admin/page.tsx");
  assert.ok(
    adminCode.includes("staleSellingProducts") &&
      adminCode.includes("stale30") &&
      adminCode.includes('value="stale30"') &&
      !adminCode.includes("const removeStorageImagesSafe = async"),
    "app/admin/page.tsx에 staleSellingProducts 지표 계산과 stale30 옵션 연계, 중복 removeStorageImagesSafe 제거가 적용되어야 합니다."
  );
  console.log("✓ [PASS] 5. 관리자 대시보드 장기 판매중 재고 점검(30일+) 건수 지표 및 옵션 연계 확인");

  const pageCode = read("app/page.tsx");
  assert.ok(
    pageCode.includes("설치사례 참고문의") &&
      pageCode.includes("판매 중인 실매물 보기"),
    "app/page.tsx 라이트박스에 실매물 갤러리 및 설치 사례 견적 문의 브릿지가 연결되어야 합니다."
  );
  console.log("✓ [PASS] 6. 메인 배송·설치 현장 라이트박스 ↔ 실매물 갤러리 & 맞춤 견적 브릿지 확인");

  const formCode = read("components/inquiry/unified-inquiry-form.tsx");
  assert.ok(
    formCode.includes("envNote") &&
      formCode.includes("고객 선택 현장·설치 조건"),
    "unified-inquiry-form.tsx에 envNote 수신 및 설치 조건 자동 프리필이 포함되어야 합니다."
  );
  console.log("✓ [PASS] 7. 온라인 문의 폼(unified-inquiry-form) 고객 선택 현장 조건 자동 프리필 확인");

  console.log("🎉 모든 UX 벤치마킹 기능 고도화 정적 검증을 통과했습니다!");
}

runVerification();
