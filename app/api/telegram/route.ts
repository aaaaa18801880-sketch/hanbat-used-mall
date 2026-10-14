import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "../../../lib/server-security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`telegram_notify:${ip}`, 10, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          sent: false,
          error: "알림 요청 제한을 초과했습니다.",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, sent: false, error: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }

    const name = String(body.name || "").trim().slice(0, 40);
    const phone = String(body.phone || "").trim().slice(0, 20);
    const type = String(body.type || "문의").trim().slice(0, 30);
    const title = String(body.title || "").trim().slice(0, 100);

    if (!name || !title) {
      return NextResponse.json(
        { success: false, sent: false, error: "필수 알림 항목이 누락되었습니다." },
        { status: 400 }
      );
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // 환경변수가 없을 때 실제 발송 성공(success: true)으로 위장하지 않고 명확히 구분
    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json(
        {
          success: false,
          sent: false,
          skipped: true,
          reason: "MISSING_TELEGRAM_ENV",
          message: "텔레그램 환경변수가 설정되지 않아 알림 발송을 건너뛰었습니다.",
        },
        { status: 503 }
      );
    }

    const message = [
      "🚨 [한밭중고전자 신규 문의 접수]",
      "",
      `- 구분: ${type}`,
      `- 고객명: ${name}`,
      phone ? `- 연락처: ${phone}` : null,
      `- 제목: ${title}`,
      "",
      "👉 홈페이지 문의게시판(관리자 모드)에서 상세 내용을 확인해 주세요.",
    ]
      .filter(Boolean)
      .join("\n");

    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const res = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
      }),
    });

    const resultJson = await res.json().catch(() => null);

    if (!res.ok || !resultJson?.ok) {
      return NextResponse.json(
        {
          success: false,
          sent: false,
          error: "텔레그램 서버로 알림을 전송하지 못했습니다.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: true,
    });
  } catch {
    // 서버 콘솔에 고객 이름/전화번호 등 민감 정보를 출력하지 않음
    console.error("텔레그램 알림 발송 중 예외 발생");
    return NextResponse.json(
      {
        success: false,
        sent: false,
        error: "텔레그램 알림 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
