// 파일 경로: app/api/inquiries/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  extractInquiryImages,
  getInquiryTypeLabel,
  isValidPhone,
  STORE,
} from "../../../lib/site";
import {
  createAnonServerClient,
  createServiceRoleClient,
} from "../../../lib/supabase";
import {
  checkNotificationIdempotency,
  checkRateLimit,
  getClientIp,
  hashInquiryPasswordAsync,
  markNotificationFailed,
  markNotificationSent,
  verifyAdminRequest,
  verifySameOriginRequest,
} from "../../../lib/server-security";
import {
  sanitizeInquiryImageUrls,
  signInquiryImageLists,
} from "../../../lib/inquiry-attachments";
import {
  postTelegramInquiryMessage,
  TELEGRAM_DEDUP_WINDOW_MS,
} from "../../../lib/server-notifications";
import {
  SAFE_INQUIRY_SELECT_COLUMNS,
  toInquiryListItem,
  type RawInquiryRow,
} from "../../../lib/server-inquiries";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await verifyAdminRequest(req);
    const isAdmin = adminCheck.ok;

    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") || "0");
    const effectiveLimit =
      limitParam > 0 && limitParam <= 300 ? limitParam : 200;

    // [SEC-005] 관리자는 본인 JWT(Anon Client)로 조회하고, 비관리자 공개 게시판 마스킹 목록은 서버 전용 클라이언트로 조회
    const supabase = isAdmin
      ? createAnonServerClient(adminCheck.accessToken)
      : createServiceRoleClient();
    const { data, error } = await supabase
      .from("purchase_requests")
      .select(SAFE_INQUIRY_SELECT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(effectiveLimit);

    if (error) {
      console.error("문의 목록 조회 오류:", error.message);
      return NextResponse.json(
        { error: "문의 목록을 불러오지 못했습니다." },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as RawInquiryRow[];
    const rawImageLists = rows.map((row) => extractInquiryImages(row));
    const signTargetLists = rows.map((row, idx) =>
      isAdmin || Boolean(row.is_notice) ? rawImageLists[idx] : []
    );
    const imageLists = await signInquiryImageLists(supabase, signTargetLists);

    const sanitized = rows.map((row, index) =>
      toInquiryListItem(row, {
        isAdmin,
        images: imageLists[index],
        hasImages: rawImageLists[index].length > 0,
      })
    );

    return NextResponse.json({ inquiries: sanitized, isAdmin });
  } catch {
    return NextResponse.json(
      { error: "문의 목록 조회 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifySameOriginRequest(req)) {
      return NextResponse.json(
        { error: "허용되지 않은 요청 출처입니다." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rate = await checkRateLimit(`inquiry_create:${ip}`, 10, 60 * 1000, {
      failureMode: "fail-open",
    });
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "요청 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const isNotice = Boolean(body.is_notice);

    let adminAccessToken: string | undefined;
    if (isNotice) {
      const adminCheck = await verifyAdminRequest(req);
      if (!adminCheck.ok) {
        return NextResponse.json(
          { error: "공지사항 등록은 관리자 권한이 필요합니다." },
          { status: adminCheck.status }
        );
      }
      adminAccessToken = adminCheck.accessToken;
    }

    const title = String(body.category || body.title || "")
      .trim()
      .slice(0, 120);
    const description = String(body.description || body.content || "")
      .trim()
      .slice(0, 5000);
    const inquiryType = isNotice
      ? "공지사항"
      : String(body.inquiry_type || "내 물건 팔기")
          .trim()
          .slice(0, 40);
    const name = isNotice
      ? String(body.name || STORE.name)
          .trim()
          .slice(0, 40)
      : String(body.name || "")
          .trim()
          .slice(0, 40);
    const phone = isNotice
      ? String(body.phone || STORE.tel)
          .trim()
          .slice(0, 20)
      : String(body.phone || "")
          .trim()
          .slice(0, 20);
    const rawPassword = String(body.password || "").trim();
    const region = String(body.region || "대전/기타")
      .trim()
      .slice(0, 80);
    const model = body.model ? String(body.model).trim().slice(0, 100) : null;
    const conditionGrade = body.condition_grade
      ? String(body.condition_grade).trim().slice(0, 40)
      : null;

    if (!title) {
      return NextResponse.json(
        { error: "문의하실 제목 또는 품목을 입력해 주세요." },
        { status: 400 }
      );
    }

    if (!isNotice) {
      if (!name || !phone || !rawPassword) {
        return NextResponse.json(
          { error: "성함, 연락처, 조회용 비밀번호를 모두 입력해 주세요." },
          { status: 400 }
        );
      }
      if (!isValidPhone(phone)) {
        return NextResponse.json(
          { error: "연락처 형식이 올바르지 않습니다. (예: 010-0000-0000)" },
          { status: 400 }
        );
      }
      if (rawPassword.length < 4 || rawPassword.length > 32) {
        return NextResponse.json(
          {
            error:
              "조회용 비밀번호는 4자리 이상 32자리 이하로 입력해 주세요.",
          },
          { status: 400 }
        );
      }
    }

    // 일반 고객 문의는 비공개 첨부 버킷(inquiry-attachments/inquiries/...)만 허용하여 공용 버킷 참조 조작을 차단합니다.
    const images = sanitizeInquiryImageUrls(body.images, {
      allowPublicBucket: isNotice,
    });

    const hashedPassword = isNotice
      ? await hashInquiryPasswordAsync(rawPassword || "0000")
      : await hashInquiryPasswordAsync(rawPassword);

    // [SEC-005] 관리자 공지 등록은 관리자 JWT(Anon Client)로, 일반 고객 문의 등록(RETURNING id 포함)은 서버 전용 클라이언트로 수행
    const supabase = isNotice
      ? createAnonServerClient(adminAccessToken)
      : createServiceRoleClient();
    const basePayload: Record<string, unknown> = {
      name,
      phone,
      password: hashedPassword,
      inquiry_type: inquiryType,
      category: title,
      region,
      description,
      images,
      is_notice: isNotice,
      status: isNotice ? "공지" : "접수",
    };

    const extendedPayload: Record<string, unknown> = { ...basePayload };
    if (model) extendedPayload.model = model;
    if (conditionGrade) extendedPayload.condition_grade = conditionGrade;

    let { data: insertedRows, error: insertError } = await supabase
      .from("purchase_requests")
      .insert(extendedPayload)
      .select("id, created_at");

    // DB에 model 또는 condition_grade 컬럼이 아직 없을 경우 기본 컬럼으로 즉시 폴백 재시도
    if (insertError && (model || conditionGrade)) {
      const retry = await supabase
        .from("purchase_requests")
        .insert(basePayload)
        .select("id, created_at");
      insertedRows = retry.data;
      insertError = retry.error;
    }

    if (insertError) {
      console.error("문의 저장 DB 오류:", insertError.message);
      return NextResponse.json(
        {
          error:
            "문의 접수 저장에 실패했습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요.",
        },
        { status: 500 }
      );
    }

    const createdId = insertedRows?.[0]?.id ?? null;

    // 일반 고객 문의인 경우 서버에서 즉시 텔레그램 알림 발송 (창 닫힘으로 인한 알림 유실 방지)
    let telegramNotified = false;
    if (!isNotice) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      const displayType = getInquiryTypeLabel(inquiryType);
      const dedupKey = createdId
        ? String(createdId).trim()
        : `${displayType}:${name}:${title}`;

      if (botToken && chatId) {
        const { isDuplicate } = await checkNotificationIdempotency(
          dedupKey,
          TELEGRAM_DEDUP_WINDOW_MS
        );
        if (isDuplicate) {
          telegramNotified = true;
        } else {
          const telegramRes = await postTelegramInquiryMessage({
            botToken,
            chatId,
            inquiryId: createdId,
            name,
            phone,
            type: displayType,
            title,
            timeoutMs: 4000,
          });
          if (telegramRes.outcome === "sent") {
            await markNotificationSent(dedupKey, TELEGRAM_DEDUP_WINDOW_MS);
            telegramNotified = true;
          } else {
            const failReason =
              telegramRes.outcome === "exception"
                ? telegramRes.error
                : "telegram_api_error";
            await markNotificationFailed(dedupKey, failReason);
            if (telegramRes.outcome === "exception") {
              console.warn(
                "[inquiries POST] 서버 측 텔레그램 즉시 알림 실패(클라이언트 폴백 대기):",
                failReason
              );
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      inquiryId: createdId,
      telegramNotified,
      createdAt: insertedRows?.[0]?.created_at ?? new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "문의 접수 처리 중 일시적인 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
