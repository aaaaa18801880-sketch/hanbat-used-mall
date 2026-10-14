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

  // 1. 잘못된 위치의 레거시 API 폴더(app/api/[id]) 제거 확인
  check(
    "1. 잘못된 경로의 app/api/[id] 폴더가 존재하지 않음",
    !fileExists("app/api/[id]/route.ts"),
    "app/api/[id] 폴더를 삭제하고 app/api/inquiries/[id]/route.ts만 남겨두세요."
  );

  // 2. 올바른 문의 상세 API 경로 확인
  check(
    "2. 올바른 문의 단건 API(app/api/inquiries/[id]/route.ts) 존재 확인",
    fileExists("app/api/inquiries/[id]/route.ts")
  );

  // 3. tailwind.config.js에 ./lib/** 및 ./components/** 포함 확인
  const twConfig = readFileSafe("tailwind.config.js");
  check(
    "3. tailwind.config.js에 ./lib/** 및 ./components/** 스캔 경로 포함",
    twConfig.includes("./lib/") && twConfig.includes("./components/")
  );

  // 4. Gemini 모델 ID("gemini-3.8-flash") 보존 여부 확인
  const analyzeProd = readFileSafe("app/api/analyze-product/route.ts");
  const analyzeDeliv = readFileSafe("app/api/analyze-delivery/route.ts");
  check(
    "4. Gemini 상품/배송 분석 API에 gemini-3.8-flash 모델 ID 유지 및 관리자 검증 포함",
    analyzeProd.includes("gemini-3.8-flash") &&
      analyzeProd.includes("verifyAdminRequest") &&
      analyzeDeliv.includes("gemini-3.8-flash") &&
      analyzeDeliv.includes("verifyAdminRequest")
  );

  // 5. 서브 페이지별 Canonical 메타데이터 레이아웃 확인
  check(
    "5. 서브 페이지(/gallery, /inquiry, /purchase, /admin) 레이아웃 메타데이터 분리",
    fileExists("app/gallery/layout.tsx") &&
      fileExists("app/inquiry/layout.tsx") &&
      fileExists("app/purchase/layout.tsx") &&
      fileExists("app/admin/layout.tsx")
  );

  // 6. 404 및 전역 에러 복구 페이지 확인
  check(
    "6. 404(app/not-found.tsx) 및 오류 복구(app/error.tsx) 페이지 존재 확인",
    fileExists("app/not-found.tsx") && fileExists("app/error.tsx")
  );

  console.log("\n=========================================================");
  console.log(`검증 완료: ${passed} / ${total} 항목 통과`);
  console.log("=========================================================");
}

runPredeployChecks();
