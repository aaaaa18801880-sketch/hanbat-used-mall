// 파일 경로: app/api/inquiries/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  extractInquiryImages,
  getInquiryTypeLabel,
  isValidPhone,
  maskName,
  maskPhone,
  STORE,
} from "../../../lib/site";
import { createServerSupabaseClient } from "../../../lib/supabase";
import {
  checkNotificationIdempotency,
  checkRateLimit,
  getClientIp,
  hashInquiryPassword,
  verifyAdminRequest,
} from "../../../lib/server-security";

export const runtime = "nodejs";

/**
 * 신규 문의 DB 저장 직후 서버에서 직접 텔레그램 알림을 발송하는 내부 헬퍼
 * - 클라이언트가 창을 즉시 닫아도 알림이 유실되지 않도록 보장합니다.
 * - checkNotificationIdempotency를 공유하므로 클라이언트 측 후속 호출과 중복 발송되지 않습니다.
 */
async function dispatchTelegramOnInquiryCreate(params: {
  inquiryId: string | number | null;
  name: string;
  phone: string;
  type: string;
  title: string;
}): Promise<boolean> {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!BOT_TOKEN || !CHAT_ID) return false;

  const idStr = params.inquiryId ? String(params.inquiryId).trim() : "";
  const dedupKey = idStr || `${params.type}:${params.name}:${params.title}`;
  const { isDuplicate } = checkNotificationIdempotency(
    dedupKey,
    3 * 60 * 1000,
    false
  );
  if (isDuplicate) return true;

  const maskedPhone = params.phone ? maskPhone(params.phone) : "미입력";
  const message = [
    "🚨 [한밭중고전자 신규 접수 알림]",
    "",
    `• 구분: ${params.type}`,
    `• 접수자: ${params.name} (${maskedPhone})`,
    `• 제목: ${params.title}`,
    idStr ? `• 접수번호: #${idStr.slice(0, 8)}` : null,
    "",
    "🔒 개인정보 보호를 위해 전체 연락처와 첨부 사진은 홈페이지 관리자 대시보드(/admin)에서 확인해 주세요.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
        }),
        signal: AbortSignal.timeout(4000),
      }
    );
    return res.ok;
  } catch (err) {
    console.warn(
      "[inquiries POST] 서버 측 텔레그램 즉시 알림 실패(클라이언트 폴백 대기):",
      err
    );
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await verifyAdminRequest(req);
    const isAdmin = adminCheck.ok;

    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") || "0");
    const effectiveLimit =
      limitParam > 0 && limitParam <= 300 ? limitParam : 200;

    const supabase = createServerSupabaseClient(adminCheck.accessToken);
    const { data, error } = await supabase
      .from("purchase_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(effectiveLimit);

    if (error) {
      console.error("문의 목록 조회 오류:", error.message);
      return NextResponse.json(
        { error: "문의 목록을 불러오지 못했습니다." },
        { status: 500 }
      );
    }

    const rows = data ?? [];

    const sanitized = rows.map(
      (row: {
        id: number | string;
        name?: string | null;
        phone?: string | null;
        inquiry_type?: string | null;
        category?: string | null;
        model?: string | null;
        condition_grade?: string | null;
        region?: string | null;
        description?: string | null;
        images?: unknown;
        image_url?: unknown;
        is_notice?: boolean | null;
        status?: string | null;
        admin_reply?: string | null;
        created_at?: string | null;
      }) => {
        const normalizedImages = extractInquiryImages(row);
        const isNotice = Boolean(row.is_notice);
        const rawTitle =
          row.category ||
          (row.model ? `${row.model} 매입 문의` : "문의드립니다.");

        if (isAdmin) {
          return {
            id: row.id,
            name: row.name || "고객",
            masked_name: maskName(row.name),
            phone: row.phone || "",
            inquiry_type:
              row.inquiry_type || (row.region ? "내 물건 팔기" : "기타 문의"),
            category: rawTitle,
            model: row.model || null,
            condition_grade: row.condition_grade || null,
            region: row.region || null,
            description: row.description || "",
            images: normalizedImages,
            has_images: normalizedImages.length > 0,
            is_notice: isNotice,
            status: row.status || "접수",
            admin_reply: row.admin_reply || null,
            created_at: row.created_at,
          };
        }

        return {
          id: row.id,
          name: isNotice ? row.name || STORE.name : maskName(row.name),
          masked_name: maskName(row.name),
          phone: null,
          inquiry_type: isNotice
            ? "공지사항"
            : getInquiryTypeLabel(
                row.inquiry_type || (row.region ? "내 물건 팔기" : "기타 문의")
              ),
          category: rawTitle,
          description: isNotice ? row.description || "" : null,
          images: isNotice ? normalizedImages : [],
          has_images: normalizedImages.length > 0,
          is_notice: isNotice,
          status: row.status || (isNotice ? "공지" : "접수"),
          admin_reply: null,
          created_at: row.created_at,
        };
      }
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
    const ip = getClientIp(req);
    const rate = checkRateLimit(`inquiry_create:${ip}`, 10, 60 * 1000);
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

    const images = Array.isArray(body.images)
      ? body.images
          .filter(
            (u: unknown): u is string =>
              typeof u === "string" && /^https?:\/\//i.test(u)
          )
          .slice(0, 5)
      : [];

    const hashedPassword = isNotice
      ? hashInquiryPassword(rawPassword || "0000")
      : hashInquiryPassword(rawPassword);

    const supabase = createServerSupabaseClient(adminAccessToken);
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
      telegramNotified = await dispatchTelegramOnInquiryCreate({
        inquiryId: createdId,
        name,
        phone,
        type: getInquiryTypeLabel(inquiryType),
        title,
      });
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
