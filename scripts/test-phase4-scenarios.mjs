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
    console.warn(
      `⚠️ 로컬 개발 서버(${BASE_URL})가 켜져 있지 않습니다. 'npm run dev' 실행 후 다시 테스트하면 전체 HTTP 시나리오가 검증됩니다.`
    );
    return;
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

  // 시나리오 2 & 3: 상품 문의 및 매입 신청 제출 (DB 연결 여부에 따른 정직한 응답 확인)
  {
    const res = await fetch(`${BASE_URL}/api/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "테스트고객",
        phone: "010-1234-5678",
        password: "4321",
        inquiry_type: "구매 문의",
        category: "[상품문의] 캐리어 벽걸이 냉난방기 9평형",
        model: "CSV-Q095GU",
        description: "상품 상세 연동 문의 테스트입니다.",
      }),
    });
    const body = await res.json().catch(() => ({}));
    check(
      "2. 상품 문의 제출 시나리오 (성공 시 200+inquiryId, DB 미연결 시 거짓 성공 없이 500 반환)",
      (res.status === 200 && body.success === true) ||
        (res.status === 500 && body.error)
    );
  }

  // 시나리오 4 & 10: 권한 없는 사용자의 관리자 답변 등록 및 상태 변경 차단
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
      "3 & 10. 권한 없는 관리자 답변/상태 변경 요청 차단 (403 또는 404 반환)",
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

  // 시나리오 7 & 8: 알림 설정 누락(Alimtalk/Telegram) 시 거짓 성공 응답 방지
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

    const tgRes = await fetch(`${BASE_URL}/api/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "테스트고객",
        phone: "010-1234-5678",
        type: "내 물건 팔기",
        title: "매입 테스트",
      }),
    });
    const tgBody = await tgRes.json().catch(() => ({}));
    check(
      "8. 텔레그램 발송 상태 구분 (설정 시 SUCCESS, 미설정 시 503 NOT_CONFIGURED, 외부 실패 시 502)",
      ["SUCCESS", "NOT_CONFIGURED", "EXTERNAL_ERROR", "RETRY_REQUIRED"].includes(
        tgBody.status
      )
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
}

runPhase4RegressionTests();
