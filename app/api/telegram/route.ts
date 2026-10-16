// 파일 경로: app/api/telegram/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getInquiryTypeLabel,
  maskPhone,
  NOTIFICATION_STATUS,
  type NotificationDispatchResult,
} from "../../../lib/site";
import { createServerSupabaseClient } from "../../../lib/supabase";
import {
  checkNotificationIdempotency,
  checkRateLimit,
  getClientIp,
  verifyAdminRequest,
} from "../../../lib/server-security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const nowIso = new Date().toISOString();

  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`telegram_notify:${ip}`, 12, 60 * 1000);
    if (!rate.allowed) {
      const rateResult: NotificationDispatchResult = {
        channel: "telegram",
        status: "RETRY_REQUIRED",
        statusLabel: NOTIFICATION_STATUS.RETRY_REQUIRED,
        sent: false,
        retryable: true,
        message: `알림 요청 제한을 초과했습니다. ${rate.retryAfterSec}초 후 재시도해 주세요.`,
        timestamp: nowIso,
      };
      return NextResponse.json(
        { success: false, ...rateResult },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          channel: "telegram",
          status: "EXTERNAL_ERROR",
          statusLabel: NOTIFICATION_STATUS.EXTERNAL_ERROR,
          sent: false,
          retryable: false,
          message: "잘못된 알림 요청 형식입니다.",
          timestamp: nowIso,
        },
        { status: 400 }
      );
    }

    const inquiryId = String(body.inquiryId || "").trim().slice(0, 64);
    let name = String(body.name || "").trim().slice(0, 40);
    let phone = String(body.phone || "").trim().slice(0, 20);
    let type = String(body.type || "문의").trim().slice(0, 30);
    let title = String(body.title || "").trim().slice(0, 100);
    const forceRetry = Boolean(body.forceRetry);

    let adminAccessToken: string | undefined;
    if (forceRetry) {
      const adminCheck = await verifyAdminRequest(req);
      if (!adminCheck.ok) {
        return NextResponse.json(
          {
            success: false,
            channel: "telegram",
            status: "EXTERNAL_ERROR",
            statusLabel: NOTIFICATION_STATUS.EXTERNAL_ERROR,
            sent: false,
            retryable: false,
            message: adminCheck.error || "수동 재발송은 관리자 인증이 필요합니다.",
            timestamp: nowIso,
          },
          { status: adminCheck.status }
        );
      }
      adminAccessToken = adminCheck.accessToken;
    }

    // inquiryId가 전달된 경우 DB에 실제 저장된 문의 데이터와 대조하여 클라이언트 변조 방지
    if (inquiryId) {
      const supabase = createServerSupabaseClient(adminAccessToken, true);
      const { data: dbInquiry, error: dbErr } = await supabase
        .from("purchase_requests")
        .select("id, name, phone, inquiry_type, category, is_notice")
        .eq("id", inquiryId)
        .maybeSingle();

      if (!dbErr && !dbInquiry) {
        return NextResponse.json(
          {
            success: false,
            channel: "telegram",
            status: "EXTERNAL_ERROR",
            statusLabel: NOTIFICATION_STATUS.EXTERNAL_ERROR,
            sent: false,
            retryable: false,
            message: "존재하지 않는 접수 번호입니다.",
            timestamp: nowIso,
          },
          { status: 404 }
        );
      }

      if (dbInquiry) {
        name = String(dbInquiry.name || name || "고객").trim().slice(0, 40);
        phone = String(dbInquiry.phone || phone || "").trim().slice(0, 20);
        type = getInquiryTypeLabel(dbInquiry.inquiry_type || type);
        title = String(dbInquiry.category || title || "문의 접수")
          .trim()
          .slice(0, 100);
      }
    }

    if (!name || !title) {
      return NextResponse.json(
        {
          success: false,
          channel: "telegram",
          status: "EXTERNAL_ERROR",
          statusLabel: NOTIFICATION_STATUS.EXTERNAL_ERROR,
          sent: false,
          retryable: false,
          message: "필수 알림 항목(고객명, 제목)이 누락되었습니다.",
          timestamp: nowIso,
        },
        { status: 400 }
      );
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      const notConfiguredResult: NotificationDispatchResult = {
        channel: "telegram",
        status: "NOT_CONFIGURED",
        statusLabel: NOTIFICATION_STATUS.NOT_CONFIGURED,
        sent: false,
        retryable: true,
        message:
          "텔레그램 환경변수(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)가 설정되지 않았습니다.",
        timestamp: nowIso,
      };
      return NextResponse.json(
        {
          success: false,
          skipped: true,
          reason: "MISSING_TELEGRAM_ENV",
          ...notConfiguredResult,
        },
        { status: 503 }
      );
    }

    const dedupKey = inquiryId || `${type}:${name}:${title}`;
    const { isDuplicate } = checkNotificationIdempotency(
      dedupKey,
      3 * 60 * 1000,
      forceRetry
    );

    if (isDuplicate) {
      const dedupResult: NotificationDispatchResult = {
        channel: "telegram",
        status: "SUCCESS",
        statusLabel: NOTIFICATION_STATUS.SUCCESS,
        sent: true,
        retryable: false,
        deduplicated: true,
        message: "이미 동일한 문의 알림이 발송되어 중복 전송을 건너뛰었습니다.",
        timestamp: nowIso,
      };
      return NextResponse.json({ success: true, ...dedupResult });
    }

    const maskedPhone = phone ? maskPhone(phone) : "미입력";
    const message = [
      "🚨 [한밭중고전자 신규 접수 알림]",
      "",
      `• 구분: ${type}`,
      `• 접수자: ${name} (${maskedPhone})`,
      `• 제목: ${title}`,
      inquiryId ? `• 접수번호: #${inquiryId.slice(0, 8)}` : null,
      "",
      "🔒 개인정보 보호를 위해 전체 연락처와 첨부 사진은 홈페이지 관리자 대시보드(/admin)에서 확인해 주세요.",
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
      signal: AbortSignal.timeout(5000),
    });

    const resultJson = await res.json().catch(() => null);

    if (!res.ok || !resultJson?.ok) {
      const errorResult: NotificationDispatchResult = {
        channel: "telegram",
        status: "EXTERNAL_ERROR",
        statusLabel: NOTIFICATION_STATUS.EXTERNAL_ERROR,
        sent: false,
        retryable: true,
        message:
          "텔레그램 서버 응답 오류로 발송에 실패했습니다. 관리자 대시보드에서 재시도할 수 있습니다.",
        timestamp: nowIso,
      };
      return NextResponse.json(
        { success: false, ...errorResult },
        { status: 502 }
      );
    }

    const okResult: NotificationDispatchResult = {
      channel: "telegram",
      status: "SUCCESS",
      statusLabel: NOTIFICATION_STATUS.SUCCESS,
      sent: true,
      retryable: false,
      message: "텔레그램 알림이 정상 발송되었습니다.",
      timestamp: nowIso,
    };

    return NextResponse.json({
      success: true,
      ...okResult,
    });
  } catch {
    console.error("텔레그램 알림 발송 중 예외 또는 타임아웃 발생");
    const retryResult: NotificationDispatchResult = {
      channel: "telegram",
      status: "RETRY_REQUIRED",
      statusLabel: NOTIFICATION_STATUS.RETRY_REQUIRED,
      sent: false,
      retryable: true,
      message: "네트워크 지연 또는 타임아웃으로 알림 발송 재시도가 필요합니다.",
      timestamp: nowIso,
    };
    return NextResponse.json(
      { success: false, ...retryResult },
      { status: 500 }
    );
  }
}
