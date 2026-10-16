// 파일 경로: scripts/verify-predeploy.mjs
// 실행 방법: node scripts/verify-predeploy.mjs

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readFileSafe(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

function runPredeployChecks() {
  console.log("=========================================================");
  console.log("🚀 한밭중고전자 배포 전 최종 정적·보안·SEO 무결성 검증");
  console.log("=========================================================\n");

  let passed = 0;
  let total = 0;

  function check(title, ok, hint = "") {
    total++;
    if (ok) {
      passed++;
      console.log(`✅ [PASS] ${title}`);
    } else {
      console.error(`❌ [FAIL] ${title}${hint ? ` -> \${hint}` : ""}`);
    }
  }

  check(
    "1. 잘못된 경로의 app/api/[id] 폴더가 존재하지 않음",
    !fileExists("app/api/[id]/route.ts"),
    "app/api/[id] 폴더를 삭제하고 app/api/inquiries/[id]/route.ts만 남겨두세요."
  );

  const inqDetailRoute = readFileSafe("app/api/inquiries/[id]/route.ts");
  check(
    "2. 문의 단건 API(app/api/inquiries/[id]/route.ts)에 POST/PATCH/DELETE 핸들러 정상 존재",
    fileExists("app/api/inquiries/[id]/route.ts") &&
      inqDetailRoute.includes("export async function POST") &&
      inqDetailRoute.includes("export async function PATCH") &&
      inqDetailRoute.includes("export async function DELETE"),
    "app/api/inquiries/[id]/route.ts에 목록 코드가 잘못 덮어써지지 않았는지 확인하세요."
  );

  const twConfig = readFileSafe("tailwind.config.js");
  check(
    "3. tailwind.config.js에 ./lib/** 및 ./components/** 스캔 경로 포함",
    twConfig.includes("./lib/") && twConfig.includes("./components/")
  );

  const analyzeProd = readFileSafe("app/api/analyze-product/route.ts");
  const analyzeDeliv = readFileSafe("app/api/analyze-delivery/route.ts");
  check(
    "4. Gemini 상품/배송 분석 API에 gemini-3.8-flash 유지, gemini-2.5-flash 폴백 및 관리자 검증 포함",
    analyzeProd.includes("gemini-3.8-flash") &&
      analyzeProd.includes("gemini-2.5-flash") &&
      analyzeProd.includes("verifyAdminRequest") &&
      analyzeDeliv.includes("gemini-3.8-flash") &&
      analyzeDeliv.includes("gemini-2.5-flash") &&
      !analyzeDeliv.includes("gemini-3.5-flash") &&
      analyzeDeliv.includes("verifyAdminRequest"),
    "analyze-delivery의 폴백 모델명이 gemini-2.5-flash인지 확인하세요."
  );

  check(
    "5. 서브 페이지(/gallery, /inquiry, /purchase, /admin) 레이아웃 메타데이터 분리",
    fileExists("app/gallery/layout.tsx") &&
      fileExists("app/inquiry/layout.tsx") &&
      fileExists("app/purchase/layout.tsx") &&
      fileExists("app/admin/layout.tsx")
  );

  check(
    "6. 404(app/not-found.tsx) 및 오류 복구(app/error.tsx) 페이지 존재 확인",
    fileExists("app/not-found.tsx") && fileExists("app/error.tsx")
  );

  const prodDetailPage = readFileSafe("app/[id]/page.tsx");
  const prodCardComp = readFileSafe("components/products/product-card.tsx");
  check(
    "7. 상품 상세 페이지(app/[id]/page.tsx) 및 상품 카드(components/products/product-card.tsx) 컴포넌트 무결성 확인",
    prodDetailPage.includes("export default async function ProductDetailPage") &&
      prodDetailPage.includes("export async function generateMetadata") &&
      prodCardComp.includes("export function ProductCard"),
    "상품 상세 페이지 또는 ProductCard 컴포넌트가 다른 코드로 덮어써지지 않았는지 확인하세요."
  );

  console.log("\n=========================================================");
  console.log(`검증 완료: ${passed} / ${total} 항목 통과`);
  console.log("=========================================================");

  if (passed < total) {
    process.exit(1);
  }
}

runPredeployChecks();