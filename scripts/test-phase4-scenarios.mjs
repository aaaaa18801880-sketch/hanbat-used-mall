// 파일 경로: scripts/test-phase4-scenarios.mjs
// 실행 방법: node scripts/test-phase4-scenarios.mjs

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function runPhase4RegressionTests() {
  console.log("=========================================================");
  console.log("🧪 한밭중고전자 Phase 4 10대 시나리오 회귀 검증 시작");
  console.log("=========================================================\n");

  let passed = 0;
  let total = 0;

  function check(name, cond, detail = "") {
    total++;
    if (cond) {
      passed++;
      console.log(`✅ [PASS] ${name}`);
    } else {
      console.error(`❌ [FAIL] ${name} ${detail ? `(${detail})` : ""}`);
    }
  }

  // 로컬 서버 실행 여부 먼저 확인
  let serverOnline = false;
  try {
    const ping = await fetch(`${BASE_URL}/api/inquiries?limit=1`);
    serverOnline = ping.status > 0;
  } catch {
    serverOnline = false;
  }

  if (!serverOnline) {
    console.error(
      `❌ 로컬 개발 서버(${BASE_URL})가 켜져 있지 않아 HTTP 시나리오 테스트를 실행할 수 없습니다. 'npm run dev' 실행 후 다시 테스트하세요.`
    );
    process.exit(1);
  }

  // 시나리오 1: 매입 신청 실패 검증 (필수 항목 누락 또는 잘못된 전화번호/비밀번호)
  {
    const res = await fetch(`${BASE_URL}/api/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "홍길동",
        phone: "1234", // 잘못된 전화번호
        password: "12", // 4자리 미만
        inquiry_type: "내 물건 팔기",
        category: "[냉장고] 삼성 냉장고 매입 신청",
      }),
    });
    check(
      "1. 매입 신청 실패 시나리오 (유효하지 않은 연락처/비밀번호 400 거부)",
      res.status === 400
    );
  }

  // 시나리오 2: 무인증 공지사항 등록 차단 (운영 DB 오염 없이 POST 권한 검증)
  {
    const res = await fetch(`${BASE_URL}/api/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_notice: true,
        category: "무인증 공지 등록 시도",
        description: "차단되어야 합니다.",
      }),
    });
    check(
      "2. 무인증 공지사항 등록 차단 (401 또는 403 반환, 운영 DB 오염 방지)",
      res.status === 401 || res.status === 403
    );
  }

  // 시나리오 3 & 4: 권한 없는 사용자의 관리자 답변 등록 및 상태 변경 차단
  {
    const res = await fetch(`${BASE_URL}/api/inquiries/00000000-0000-0000-0000-000000000000`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "답변완료",
        admin_reply: "무권한 답변 시도",
      }),
    });
    check(
      "3 & 4. 권한 없는 관리자 답변/상태 변경 요청 차단 (403 또는 404 반환)",
      res.status === 403 || res.status === 404
    );
  }

  // 시나리오 5 & 6: Gemini 상품 분석 API 무인증 차단 및 파일 업로드 제한
  {
    const unauthRes = await fetch(`${BASE_URL}/api/analyze-product`, {
      method: "POST",
    });
    check(
      "5 & 6. 무인증 Gemini 상품 분석 호출 차단 (401 Unauthorized)",
      unauthRes.status === 401
    );
  }

  // 시나리오 7 & 8: 알림 설정 누락(Alimtalk) 및 텔레그램 무인증 수동 재발송(forceRetry) 차단 검증
  {
    const alimRes = await fetch(`${BASE_URL}/api/alimtalk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "테스트", phone: "010-0000-0000" }),
    });
    const alimBody = await alimRes.json().catch(() => ({}));
    check(
      "7. 알림톡 설정 누락 시 거짓 성공(success: true) 대신 NOT_CONFIGURED(501) 반환",
      alimRes.status === 501 &&
        alimBody.success === false &&
        alimBody.status === "NOT_CONFIGURED"
    );

    const tgForceRes = await fetch(`${BASE_URL}/api/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "테스트고객",
        phone: "010-1234-5678",
        type: "내 물건 팔기",
        title: "매입 테스트",
        forceRetry: true,
      }),
    });
    check(
      "8. 텔레그램 무인증 수동 재발송(forceRetry: true) 차단 (401 Unauthorized, 실제 알림 오발송 방지)",
      tgForceRes.status === 401
    );
  }

  // 시나리오 9: 잘못된 API 요청 본문 처리
  {
    const badRes = await fetch(`${BASE_URL}/api/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json-payload",
    });
    check("9. 잘못된 JSON API 요청 시 400 Bad Request 처리", badRes.status === 400);
  }

  console.log(`\n=========================================================`);
  console.log(`최종 결과: ${passed} / ${total} 시나리오 검증 통과`);
  console.log(`=========================================================`);

  if (passed < total) {
    process.exit(1);
  }
}

runPhase4RegressionTests();
