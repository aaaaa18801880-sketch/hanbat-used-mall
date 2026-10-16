import { NextRequest, NextResponse } from "next/server";
import {
  NOTIFICATION_STATUS,
  STORE,
  type NotificationDispatchResult,
} from "../../../lib/site";
import {
  checkRateLimit,
  getClientIp,
  verifyAdminRequest,
} from "../../../lib/server-security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const nowIso = new Date().toISOString();

  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`alimtalk_notify:${ip}`, 12, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          channel: "alimtalk",
          status: "RETRY_REQUIRED",
          statusLabel: NOTIFICATION_STATUS.RETRY_REQUIRED,
          sent: false,
          retryable: true,
          message: `요청 제한을 초과했습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
          timestamp: nowIso,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          channel: "alimtalk",
          status: "EXTERNAL_ERROR",
          statusLabel: NOTIFICATION_STATUS.EXTERNAL_ERROR,
          sent: false,
          retryable: false,
          message: "잘못된 요청 본문입니다.",
          timestamp: nowIso,
        },
        { status: 400 }
      );
    }

    if (body.forceRetry) {
      const adminCheck = await verifyAdminRequest(req);
      if (!adminCheck.ok) {
        return NextResponse.json(
          {
            success: false,
            channel: "alimtalk",
            status: "EXTERNAL_ERROR",
            statusLabel: NOTIFICATION_STATUS.EXTERNAL_ERROR,
            sent: false,
            retryable: false,
            message: adminCheck.error || "관리자 인증이 필요합니다.",
            timestamp: nowIso,
          },
          { status: adminCheck.status }
        );
      }
    }

    const ALIMTALK_API_KEY = process.env.ALIMTALK_API_KEY;
    const ALIMTALK_USER_ID = process.env.ALIMTALK_USER_ID;
    const SENDER_PHONE = STORE.tel.replace(/[^0-9]/g, "");

    if (!ALIMTALK_API_KEY || !ALIMTALK_USER_ID) {
      const notConfigured: NotificationDispatchResult = {
        channel: "alimtalk",
        status: "NOT_CONFIGURED",
        statusLabel: NOTIFICATION_STATUS.NOT_CONFIGURED,
        sent: false,
        retryable: false,
        message:
          "알림톡 서비스 API 키(ALIMTALK_API_KEY, ALIMTALK_USER_ID)가 아직 설정되지 않았습니다.",
        timestamp: nowIso,
      };
      return NextResponse.json(
        {
          success: false,
          skipped: true,
          configured: false,
          senderConfigured: Boolean(SENDER_PHONE),
          reason: "ALIMTALK_NOT_CONFIGURED",
          ...notConfigured,
        },
        { status: 501 }
      );
    }

    const providerNotLinked: NotificationDispatchResult = {
      channel: "alimtalk",
      status: "NOT_CONFIGURED",
      statusLabel: NOTIFICATION_STATUS.NOT_CONFIGURED,
      sent: false,
      retryable: false,
      message: "알림톡 발송 대행사 연동이 아직 완료되지 않았습니다.",
      timestamp: nowIso,
    };

    return NextResponse.json(
      {
        success: false,
        skipped: true,
        configured: false,
        reason: "ALIMTALK_PROVIDER_NOT_IMPLEMENTED",
        ...providerNotLinked,
      },
      { status: 501 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        channel: "alimtalk",
        status: "RETRY_REQUIRED",
        statusLabel: NOTIFICATION_STATUS.RETRY_REQUIRED,
        sent: false,
        retryable: true,
        message: "알림톡 요청 처리 중 서버 오류가 발생했습니다.",
        timestamp: nowIso,
      },
      { status: 500 }
    );
  }
}
