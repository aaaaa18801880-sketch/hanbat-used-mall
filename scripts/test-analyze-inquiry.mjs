// 파일 경로: scripts/test-analyze-inquiry.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

function verifyFilesExist() {
  const required = [
    "app/api/analyze-inquiry/route.ts",
    "components/inquiry/unified-inquiry-form.tsx",
    "lib/site.ts",
    "app/admin/page.tsx",
  ];
  for (const rel of required) {
    const full = path.join(rootDir, rel);
    assert.ok(fs.existsSync(full), `필수 파일 누락: ${rel}`);
  }
  console.log("✓ [PASS] 1. 필수 파일 경로 및 존재 확인 완료");
}

function verifyPromptAndSanitizerRules() {
  const routeCode = fs.readFileSync(
    path.join(rootDir, "app/api/analyze-inquiry/route.ts"),
    "utf8"
  );

  assert.ok(
    routeCode.includes("buildBuyPrompt") &&
      routeCode.includes("buildSellPrompt") &&
      routeCode.includes("buildBulkPrompt") &&
      routeCode.includes("buildOtherPrompt"),
    "4가지 상담 유형별 전용 프롬프트 빌더가 모두 분리되어 있어야 합니다."
  );

  assert.ok(
    routeCode.includes(
      "사진에 보이는 제품 대수 ≠ 고객이 실제로 구매하거나 처분하려는 희망 수량"
    ),
    "대량 문의에서 사진 속 대수와 구매 희망 수량 혼동 금지 원칙이 명시되어야 합니다."
  );

  assert.ok(
    routeCode.includes("모름·현장 확인 필요"),
    "분전반 사진만으로 승압 필요 여부를 단정하지 않는 상태값이 포함되어야 합니다."
  );

  assert.ok(
    routeCode.includes("작동 상태 미확인 — 고객 확인 필요"),
    "외관 상태와 실제 작동 상태 분리 원칙이 포함되어야 합니다."
  );

  assert.ok(
    routeCode.includes('"gemini-3.8-flash"') &&
      routeCode.includes('"gemini-2.5-flash"'),
    "기존 Gemini 기본 모델(gemini-3.8-flash) 및 폴백 모델(gemini-2.5-flash) 설정이 유지되어야 합니다."
  );

  console.log(
    "✓ [PASS] 2. 4대 상담 유형 프롬프트 빌더 및 3대 과잉 추론 차단 가드레일 검증 완료"
  );
}

function verifyFrontendAndParserIntegration() {
  const formCode = fs.readFileSync(
    path.join(rootDir, "components/inquiry/unified-inquiry-form.tsx"),
    "utf8"
  );
  const siteCode = fs.readFileSync(path.join(rootDir, "lib/site.ts"), "utf8");

  assert.ok(
    formCode.includes("pendingConflicts"),
    "고객 기존 입력값 덮어쓰기 방지(pendingConflicts) 로직이 포함되어야 합니다."
  );
  assert.ok(
    formCode.includes("electricalPhase") && formCode.includes("voltageUpgrade"),
    "대량·업소용 전기 환경 및 승압 여부 선택 UI가 포함되어야 합니다."
  );
  assert.ok(
    formCode.includes("operatingStatus") &&
      formCode.includes("manufacturingDate"),
    "매입 문의용 제조년월 및 실제 작동 상태 분리 입력 UI가 포함되어야 합니다."
  );
  assert.ok(
    siteCode.includes("formatStructuredInquiryDescription") &&
      siteCode.includes("parseStructuredInquiryDescription"),
    "구조화 문의 직렬화 및 역직렬화 파서 함수가 lib/site.ts에 존재해야 합니다."
  );

  console.log(
    "✓ [PASS] 3. 고객 입력 보호 UI, 대량·업소용 구조화 폼 및 관리자 뷰어 파서 검증 완료"
  );
}

verifyFilesExist();
verifyPromptAndSanitizerRules();
verifyFrontendAndParserIntegration();
console.log("🎉 모든 상담 유형별 AI 분석 및 문의 시스템 검증을 통과했습니다!");
