import { NextRequest, NextResponse } from "next/server";
import { STORE } from "../../../lib/site";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, sent: false, error: "잘못된 요청 본문입니다." },
        { status: 400 }
      );
    }

    const ALIMTALK_API_KEY = process.env.ALIMTALK_API_KEY;
    const ALIMTALK_USER_ID = process.env.ALIMTALK_USER_ID;
    const SENDER_PHONE = STORE.tel.replace(/[^0-9]/g, "");

    // API 키가 없거나 대행사 연동이 완료되지 않은 경우 성공(success: true)으로 오인되지 않게 반환
    if (!ALIMTALK_API_KEY || !ALIMTALK_USER_ID) {
      return NextResponse.json(
        {
          success: false,
          sent: false,
          skipped: true,
          configured: false,
          senderConfigured: Boolean(SENDER_PHONE),
          reason: "ALIMTALK_NOT_CONFIGURED",
          message: "알림톡 API 환경변수가 설정되지 않아 발송되지 않았습니다.",
        },
        { status: 501 }
      );
    }

    // 대행사 실연동 코드가 아직 구현되지 않은 상태임을 정직하게 반환
    return NextResponse.json(
      {
        success: false,
        sent: false,
        skipped: true,
        configured: false,
        reason: "ALIMTALK_PROVIDER_NOT_IMPLEMENTED",
        message: "알림톡 발송 대행사 연동 모듈이 아직 연결되지 않았습니다.",
      },
      { status: 501 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        sent: false,
        error: "알림톡 요청 처리 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}