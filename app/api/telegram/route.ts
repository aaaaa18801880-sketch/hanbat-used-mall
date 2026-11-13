// 파일 경로: app/api/telegram/route.ts
import { NextRequest } from "next/server";
import { getInquiryTypeLabel } from "../../../lib/site";
import {
  createAnonServerClient,
  createServiceRoleClient,
} from "../../../lib/supabase";
import {
  checkNotificationIdempotency,
  checkRateLimit,
  getClientIp,
  markNotificationFailed,
  markNotificationSent,
  verifyAdminRequest,
} from "../../../lib/server-security";
import {
  notificationJson,
  postTelegramInquiryMessage,
  TELEGRAM_DEDUP_WINDOW_MS,
} from "../../../lib/server-notifications";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const nowIso = new Date().toISOString();

  try {
    const ip = getClientIp(req);
    const rate = await checkRateLimit(`telegram_notify:${ip}`, 12, 60 * 1000, {
      failureMode: "fail-open",
    });
    if (!rate.allowed) {
      return notificationJson("telegram", 429, {
        success: false,
        status: "RETRY_REQUIRED",
        sent: false,
        retryable: true,
        message: `알림 요청 제한을 초과했습니다. ${rate.retryAfterSec}초 후 재시도해 주세요.`,
        timestamp: nowIso,
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return notificationJson("telegram", 400, {
        success: false,
        status: "EXTERNAL_ERROR",
        sent: false,
        retryable: false,
        message: "잘못된 알림 요청 형식입니다.",
        timestamp: nowIso,
      });
    }

    const inquiryId = String(body.inquiryId || "").trim().slice(0, 64);
    const forceRetry = Boolean(body.forceRetry);

    let adminAccessToken: string | undefined;
    if (forceRetry) {
      const adminCheck = await verifyAdminRequest(req);
      if (!adminCheck.ok) {
        return notificationJson("telegram", adminCheck.status, {
          success: false,
          status: "EXTERNAL_ERROR",
          sent: false,
          retryable: false,
          message: adminCheck.error || "수동 재발송은 관리자 인증이 필요합니다.",
          timestamp: nowIso,
        });
      }
      adminAccessToken = adminCheck.accessToken;
    } else if (!inquiryId) {
      // forceRetry가 없는 일반 호출은 반드시 유효한 inquiryId가 있어야 함 (외부 스팸 알림 차단)
      return notificationJson("telegram", 400, {
        success: false,
        status: "EXTERNAL_ERROR",
        sent: false,
        retryable: false,
        message: "유효한 접수 번호(inquiryId)가 필요합니다.",
        timestamp: nowIso,
      });
    }

    // [SEC-005] 관리자 수동 재발송 시에는 관리자 JWT(Anon Client)를, 일반 고객 폴백 대조 시에만 Service Role 사용
    const supabase = adminAccessToken
      ? createAnonServerClient(adminAccessToken)
      : createServiceRoleClient();
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
        return notificationJson("telegram", 404, {
          success: false,
          status: "EXTERNAL_ERROR",
          sent: false,
          retryable: false,
          message: "존재하지 않는 접수 번호입니다.",
          timestamp: nowIso,
        });
      }

      dbInquiry = data;

      // 공지사항은 알림 대상 제외
      if (dbInquiry.is_notice) {
        return notificationJson("telegram", 400, {
          success: false,
          status: "EXTERNAL_ERROR",
          sent: false,
          retryable: false,
          message: "공지사항은 알림 발송 대상이 아닙니다.",
          timestamp: nowIso,
        });
      }

      // 일반 호출(!forceRetry)인 경우 최근 10분 이내에 생성된 문의인지 검증
      if (!forceRetry && dbInquiry.created_at) {
        const createdAtMs = new Date(dbInquiry.created_at).getTime();
        const tenMinutesAgoMs = Date.now() - 10 * 60 * 1000;
        if (!isNaN(createdAtMs) && createdAtMs < tenMinutesAgoMs) {
          return notificationJson("telegram", 400, {
            success: false,
            status: "EXTERNAL_ERROR",
            sent: false,
            retryable: false,
            message: "접수 후 10분이 지난 문의는 일반 알림을 재요청할 수 없습니다.",
            timestamp: nowIso,
          });
        }
      }
    }

    // 알림 메시지 본문은 클라이언트 전달값이 아닌 DB에 저장된 실제 레코드(dbInquiry)를 100% 우선 사용
    const name = String(dbInquiry?.name || body.name || "").trim().slice(0, 40);
    const phone = String(dbInquiry?.phone || body.phone || "").trim().slice(0, 20);
    const type = getInquiryTypeLabel(dbInquiry?.inquiry_type || body.type || "문의");
    const title = String(dbInquiry?.category || body.title || "").trim().slice(0, 100);

    if (!name || !title) {
      return notificationJson("telegram", 400, {
        success: false,
        status: "EXTERNAL_ERROR",
        sent: false,
        retryable: false,
        message: "필수 알림 항목(고객명, 제목)이 누락되었습니다.",
        timestamp: nowIso,
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) {
      return notificationJson("telegram", 503, {
        success: false,
        skipped: true,
        reason: "MISSING_TELEGRAM_ENV",
        status: "NOT_CONFIGURED",
        sent: false,
        retryable: true,
        message:
          "텔레그램 환경변수(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)가 설정되지 않았습니다.",
        timestamp: nowIso,
      });
    }

    const dedupKey = inquiryId || `${type}:${name}:${title}`;
    const { isDuplicate } = await checkNotificationIdempotency(
      dedupKey,
      TELEGRAM_DEDUP_WINDOW_MS,
      forceRetry
    );
    if (isDuplicate) {
      return notificationJson("telegram", 200, {
        success: true,
        status: "SUCCESS",
        sent: true,
        retryable: false,
        deduplicated: true,
        message: "이미 동일한 문의 알림이 발송되어 중복 전송을 건너뛰었습니다.",
        timestamp: nowIso,
      });
    }

    const result = await postTelegramInquiryMessage({
      botToken,
      chatId,
      inquiryId,
      name,
      phone,
      type,
      title,
      timeoutMs: 5000,
    });

    if (result.outcome === "http_error") {
      await markNotificationFailed(dedupKey, "telegram_api_error");
      return notificationJson("telegram", 502, {
        success: false,
        status: "EXTERNAL_ERROR",
        sent: false,
        retryable: true,
        message:
          "텔레그램 서버 응답 오류로 발송에 실패했습니다. 관리자 대시보드에서 재시도할 수 있습니다.",
        timestamp: nowIso,
      });
    }

    if (result.outcome === "exception") {
      await markNotificationFailed(dedupKey, result.error);
      console.error("텔레그램 알림 발송 중 예외 또는 타임아웃 발생");
      return notificationJson("telegram", 500, {
        success: false,
        status: "RETRY_REQUIRED",
        sent: false,
        retryable: true,
        message: "네트워크 지연 또는 타임아웃으로 알림 발송 재시도가 필요합니다.",
        timestamp: nowIso,
      });
    }

    await markNotificationSent(dedupKey, TELEGRAM_DEDUP_WINDOW_MS);

    return notificationJson("telegram", 200, {
      success: true,
      status: "SUCCESS",
      sent: true,
      retryable: false,
      message: "텔레그램 알림이 정상 발송되었습니다.",
      timestamp: nowIso,
    });
  } catch {
    console.error("텔레그램 알림 발송 중 예외 또는 타임아웃 발생");
    return notificationJson("telegram", 500, {
      success: false,
      status: "RETRY_REQUIRED",
      sent: false,
      retryable: true,
      message: "네트워크 지연 또는 타임아웃으로 알림 발송 재시도가 필요합니다.",
      timestamp: nowIso,
    });
  }
}
