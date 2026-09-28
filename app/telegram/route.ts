import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, type, title } = body;

    // Vercel에 등록할 텔레그램 정보
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      console.log("텔레그램 토큰이 아직 세팅되지 않았습니다.");
      return NextResponse.json({ success: true, message: "Skipped" });
    }

    // 텔레그램으로 보낼 메시지 양식
    const message = `🚨 [신규 문의 접수]\n\n- 구분: ${type}\n- 고객명: ${name}\n- 연락처: ${phone}\n- 제목: ${title}\n\n👉 홈페이지 관리자 모드에서 상세 내용을 확인해 주세요.`;

    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const res = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
      }),
    });

    if (!res.ok) {
      throw new Error("텔레그램 발송 실패");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("텔레그램 API 오류:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}