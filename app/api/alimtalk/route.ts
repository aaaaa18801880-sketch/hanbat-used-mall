// 파일 경로: app/api/alimtalk/route.ts
import { NextRequest } from "next/server";
import { STORE } from "../../../lib/site";
import {
  verifyAdminRequest,
  checkRateLimit,
  getClientIp,
} from "../../../lib/server-security";
import { notificationJson } from "../../../lib/server-notifications";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const nowIso = new Date().toISOString();

  try {
    // 1. 관리자 전용 API이므로 핸들러 최상단에서 관리자 Bearer 토큰 검증 필수
    const adminCheck = await verifyAdminRequest(req);
    if (!adminCheck.ok) {
      return notificationJson("alimtalk", adminCheck.status, {
        success: false,
        status: "EXTERNAL_ERROR",
        sent: false,
        retryable: false,
        message: adminCheck.error || "관리자 인증이 필요합니다.",
        timestamp: nowIso,
      });
    }

    // 2. IP 기반 요청 빈도 제어 (관리자 유료 발송 채널이므로 DB 장애 시 fail-closed)
    const ip = getClientIp(req);
    const rate = await checkRateLimit(`alimtalk_notify:${ip}`, 12, 60 * 1000, {
      failureMode: "fail-closed",
    });
    if (!rate.allowed) {
      return notificationJson("alimtalk", 429, {
        success: false,
        status: "RETRY_REQUIRED",
        sent: false,
        retryable: true,
        message: `요청 제한을 초과했습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
        timestamp: nowIso,
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return notificationJson("alimtalk", 400, {
        success: false,
        status: "EXTERNAL_ERROR",
        sent: false,
        retryable: false,
        message: "잘못된 요청 본문입니다.",
        timestamp: nowIso,
      });
    }

    const ALIMTALK_API_KEY = process.env.ALIMTALK_API_KEY;
    const ALIMTALK_USER_ID = process.env.ALIMTALK_USER_ID;
    const SENDER_PHONE = STORE.tel.replace(/[^0-9]/g, "");

    if (!ALIMTALK_API_KEY || !ALIMTALK_USER_ID) {
      return notificationJson("alimtalk", 501, {
        success: false,
        skipped: true,
        configured: false,
        senderConfigured: Boolean(SENDER_PHONE),
        reason: "ALIMTALK_NOT_CONFIGURED",
        status: "NOT_CONFIGURED",
        sent: false,
        retryable: false,
        message:
          "알림톡 서비스 API 키(ALIMTALK_API_KEY, ALIMTALK_USER_ID)가 아직 설정되지 않았습니다.",
        timestamp: nowIso,
      });
    }

    return notificationJson("alimtalk", 501, {
      success: false,
      skipped: true,
      configured: false,
      reason: "ALIMTALK_PROVIDER_NOT_IMPLEMENTED",
      status: "NOT_CONFIGURED",
      sent: false,
      retryable: false,
      message: "알림톡 발송 대행사 연동이 아직 완료되지 않았습니다.",
      timestamp: nowIso,
    });
  } catch {
    return notificationJson("alimtalk", 500, {
      success: false,
      status: "RETRY_REQUIRED",
      sent: false,
      retryable: true,
      message: "알림톡 요청 처리 중 서버 오류가 발생했습니다.",
      timestamp: nowIso,
    });
  }
}
