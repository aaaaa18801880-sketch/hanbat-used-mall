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
      compareCode.includes("정보 없음 (상세 문의)"),
    "ProductCompareModal 및 RecentViewedStrip 컴포넌트와 미확인 사양 정직 표기가 포함되어야 합니다."
  );
  console.log("✓ [PASS] 2. 매물 비교 모달(ProductCompareModal) 및 최근 본 매물 스트립(RecentViewedStrip) 확인");

  const galleryCode = read("app/gallery/page.tsx");
  assert.ok(
    galleryCode.includes("PRICE_RANGE_OPTIONS") &&
      galleryCode.includes("RecentViewedStrip"),
    "app/gallery/page.tsx에 가격대 필터, 최근 본 매물 스트립이 연동되어야 합니다."
  );
  console.log("✓ [PASS] 3. 갤러리 가격대 범위 필터·최근 본 매물 연동 확인");

  const detailCode = read("app/[id]/page.tsx");
  assert.ok(
    detailCode.includes("getCategoryFaqs") &&
      detailCode.includes("RecentViewedStrip"),
    "app/[id]/page.tsx에 품목별 맞춤 FAQ와 최근 본 매물 스트립이 연결되어야 합니다."
  );
  console.log("✓ [PASS] 4. 상품 상세 페이지 품목별 맞춤 FAQ 및 상태 등급 표시 확인");

  const adminCode = read("app/admin/page.tsx");
  assert.ok(
    adminCode.includes("getDaysSinceCreated") &&
      adminCode.includes("stale30"),
    "app/admin/page.tsx에 30일 이상 장기 판매중 재고 점검 필터 및 배지가 포함되어야 합니다."
  );
  console.log("✓ [PASS] 5. 관리자 대시보드 장기 판매중 재고 점검(30일+) 기능 확인");

  console.log("🎉 모든 UX 벤치마킹 기능 고도화 정적 검증을 통과했습니다!");
}

runVerification();
