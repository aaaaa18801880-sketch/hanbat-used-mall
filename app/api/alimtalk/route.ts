import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, type, title } = body;

    // 대행사(알리고 등)에서 발급받을 API 키 (아직 없으므로 환경변수로 비워둡니다)
    const ALIMTALK_API_KEY = process.env.ALIMTALK_API_KEY;
    const ALIMTALK_USER_ID = process.env.ALIMTALK_USER_ID;
    const SENDER_PHONE = "0425238179"; // 한밭중고전자 발신번호

    // API 키가 없으면 실제 발송은 건너뜀 (에러 방지)
    if (!ALIMTALK_API_KEY) {
      console.log("알림톡 발송 스킵 (API 키가 세팅되지 않았습니다):", name, phone);
      return NextResponse.json({ success: true, message: "Skipped" });
    }

    /* 
      💡 추후 대행사 가입 완료 후, 
      이곳에 대행사의 알림톡 전송 코드를 넣게 됩니다.
      (예: 알리고(Aligo) API 호출 코드)
    */

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("알림톡 발송 오류:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}