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
    } else {
      // forceRetry가 없는 일반 호출은 반드시 유효한 inquiryId가 있어야 함 (외부 스팸 알림 차단)
      if (!inquiryId) {
        return NextResponse.json(
          {
            success: false,
            channel: "telegram",
            status: "EXTERNAL_ERROR",
            statusLabel: NOTIFICATION_STATUS.EXTERNAL_ERROR,
            sent: false,
            retryable: false,
            message: "유효한 접수 번호(inquiryId)가 필요합니다.",
            timestamp: nowIso,
          },
          { status: 400 }
        );
      }
    }

    // inquiryId 기반으로 실제 DB 레코드 조회 (클라이언트 변조 및 허위 알림 방지)
    const supabase = createServerSupabaseClient(adminAccessToken, true);
    let dbInquiry: {
      id: string;
      name?: string | null;
      phone?: string | null;
      inquiry_type?: string | null;
      category?: string | null;
      is_notice?: boolean | null;
      created_at?: string | null;
    } | null = null;

    if (inquiryId) {
      const { data, error: dbErr } = await supabase
        .from("purchase_requests")
        .select("id, name, phone, inquiry_type, category, is_notice, created_at")
        .eq("id", inquiryId)
        .maybeSingle();

      if (dbErr || !data) {
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

      dbInquiry = data;

      // 공지사항은 알림 대상 제외
      if (dbInquiry.is_notice) {
        return NextResponse.json(
          {
            success: false,
            channel: "telegram",
            status: "EXTERNAL_ERROR",
            statusLabel: NOTIFICATION_STATUS.EXTERNAL_ERROR,
            sent: false,
            retryable: false,
            message: "공지사항은 알림 발송 대상이 아닙니다.",
            timestamp: nowIso,
          },
          { status: 400 }
        );
      }

      // 일반 호출(!forceRetry)인 경우 최근 10분 이내에 생성된 문의인지 검증
      if (!forceRetry && dbInquiry.created_at) {
        const createdAtMs = new Date(dbInquiry.created_at).getTime();
        const tenMinutesAgoMs = Date.now() - 10 * 60 * 1000;
        if (!isNaN(createdAtMs) && createdAtMs < tenMinutesAgoMs) {
          return NextResponse.json(
            {
              success: false,
              channel: "telegram",
              status: "EXTERNAL_ERROR",
              statusLabel: NOTIFICATION_STATUS.EXTERNAL_ERROR,
              sent: false,
              retryable: false,
              message: "접수 후 10분이 지난 문의는 일반 알림을 재요청할 수 없습니다.",
              timestamp: nowIso,
            },
            { status: 400 }
          );
        }
      }
    }

    // 알림 메시지 본문은 클라이언트 전달값이 아닌 DB에 저장된 실제 레코드(dbInquiry)를 100% 우선 사용
    const name = String(dbInquiry?.name || body.name || "").trim().slice(0, 40);
    const phone = String(dbInquiry?.phone || body.phone || "").trim().slice(0, 20);
    const type = getInquiryTypeLabel(dbInquiry?.inquiry_type || body.type || "문의");
    const title = String(dbInquiry?.category || body.title || "").trim().slice(0, 100);

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
