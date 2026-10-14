import { NextRequest, NextResponse } from "next/server";
import {
  extractInquiryImages,
  getInquiryTypeLabel,
  isValidPhone,
  maskName,
  STORE,
} from "../../../lib/site";
import { createServerSupabaseClient } from "../../../lib/supabase";
import {
  checkRateLimit,
  getClientIp,
  hashInquiryPassword,
  verifyAdminRequest,
} from "../../../lib/server-security";

export const runtime = "nodejs";

/**
 * GET /api/inquiries
 * - 일반 사용자: 비밀번호(password), 연락처(phone), 비공개 본문(description), 첨부사진 URL(images), 관리자답변(admin_reply)을 제거한 안전한 공개 목록만 반환
 *   (단, 공지사항 is_notice === true는 본문과 이미지를 공개)
 * - 인증된 관리자(Authorization Bearer 토큰 검증 통과): 관리 목적의 필드 포함 반환 (단, password 원문은 관리자 응답에서도 제외)
 */
export async function GET(req: NextRequest) {
  try {
    const adminCheck = await verifyAdminRequest(req);
    const isAdmin = adminCheck.ok;

    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") || "0");

    const supabase = createServerSupabaseClient(adminCheck.accessToken);
    let query = supabase
  .from("purchase_requests")
  .select("*") // 특정 컬럼 대신 전체 조회로 안전하게 호환
  .order("created_at", { ascending: false });

    if (limitParam > 0 && limitParam <= 50) {
      query = query.limit(limitParam);
    }

    const { data, error } = await query;
    if (error) {
      console.error("문의 목록 조회 오류:", error.message);
      return NextResponse.json(
        { error: "문의 목록을 불러오지 못했습니다." },
        { status: 500 }
      );
    }

    const rows = data ?? [];

    const sanitized = rows.map((row: any) => {
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
          inquiry_type: row.inquiry_type || (row.region ? "내 물건 팔기" : "기타 문의"),
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

      // 비관리자(일반 고객) 공개 목록: 민감 개인정보(phone, password, 비공개 description/images) 원천 제외
      return {
        id: row.id,
        name: isNotice ? row.name || STORE.name : maskName(row.name),
        masked_name: maskName(row.name),
        phone: null,
        inquiry_type: isNotice
          ? "공지사항"
          : getInquiryTypeLabel(row.inquiry_type || (row.region ? "내 물건 팔기" : "기타 문의")),
        category: rawTitle,
        description: isNotice ? row.description || "" : null,
        images: isNotice ? normalizedImages : [],
        has_images: normalizedImages.length > 0,
        is_notice: isNotice,
        status: row.status || (isNotice ? "공지" : "접수"),
        admin_reply: null,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ inquiries: sanitized, isAdmin });
  } catch {
    return NextResponse.json(
      { error: "문의 목록 조회 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inquiries
 * - 신규 문의 또는 공지사항(관리자 전용) 등록
 * - 비밀번호를 scrypt 해시로 암호화하여 저장
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`inquiry_create:${ip}`, 10, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.` },
        { status: 429 }
      );
    }

    const body = await req.json();
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

    const title = String(body.category || body.title || "").trim().slice(0, 120);
    const description = String(body.description || body.content || "").trim().slice(0, 5000);
    const inquiryType = isNotice
      ? "공지사항"
      : String(body.inquiry_type || "내 물건 팔기").trim().slice(0, 40);
    const name = isNotice
      ? String(body.name || STORE.name).trim().slice(0, 40)
      : String(body.name || "").trim().slice(0, 40);
    const phone = isNotice
      ? String(body.phone || STORE.tel).trim().slice(0, 20)
      : String(body.phone || "").trim().slice(0, 20);
    const rawPassword = String(body.password || "").trim();
    const region = String(body.region || "대전/기타").trim().slice(0, 80);
    const model = body.model ? String(body.model).trim().slice(0, 100) : null;
    const conditionGrade = body.condition_grade
      ? String(body.condition_grade).trim().slice(0, 40)
      : null;

    if (!title) {
      return NextResponse.json({ error: "제목을 입력해 주세요." }, { status: 400 });
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
          { error: "유효한 연락처 형식이 아닙니다." },
          { status: 400 }
        );
      }
      if (rawPassword.length < 4 || rawPassword.length > 32) {
        return NextResponse.json(
          { error: "조회용 비밀번호는 4자리 이상 32자리 이하로 입력해 주세요." },
          { status: 400 }
        );
      }
    }

    const images = Array.isArray(body.images)
      ? body.images
          .filter((u: unknown): u is string => typeof u === "string" && /^https?:\/\//i.test(u))
          .slice(0, 5)
      : [];

    const hashedPassword = isNotice
      ? hashInquiryPassword(rawPassword || "0000")
      : hashInquiryPassword(rawPassword);

    const supabase = createServerSupabaseClient(adminAccessToken);
    const insertPayload: Record<string, any> = {
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

    if (model) insertPayload.model = model;
    if (conditionGrade) insertPayload.condition_grade = conditionGrade;

    const { error: insertError } = await supabase
      .from("purchase_requests")
      .insert(insertPayload);

    if (insertError) {
      console.error("문의 저장 오류:", insertError.message);
      return NextResponse.json(
        { error: "문의 등록 중 데이터베이스 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "문의 접수 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}