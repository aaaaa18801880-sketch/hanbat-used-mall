import { NextRequest, NextResponse } from "next/server";
import {
  extractInquiryImages,
  getInquiryTypeLabel,
  INQUIRY_STATUS,
  maskName,
} from "../../../../lib/site";
import { createServerSupabaseClient } from "../../../../lib/supabase";
import {
  checkRateLimit,
  getClientIp,
  verifyAdminRequest,
  verifyInquiryPassword,
} from "../../../../lib/server-security";

export const runtime = "nodejs";

const ALLOWED_STATUS_VALUES = new Set<string>(Object.values(INQUIRY_STATUS));

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ip = getClientIp(req);

    const rate = checkRateLimit(`pw_verify:${ip}:${id}`, 5, 5 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `비밀번호 입력 실패 횟수가 초과되었습니다. ${rate.retryAfterSec}초 후에 다시 시도해 주세요.`,
        },
        { status: 429 }
      );
    }

    const adminCheck = await verifyAdminRequest(req);
    const isAdmin = adminCheck.ok;

    const body = await req.json().catch(() => ({}));
    const inputPassword = String(body.password || "").trim();

    const supabase = createServerSupabaseClient(adminCheck.accessToken);
    const { data: row, error } = await supabase
      .from("purchase_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !row) {
      return NextResponse.json(
        { error: "해당 문의글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const isNotice = Boolean(row.is_notice);

    if (!isNotice && !isAdmin) {
      const matched = verifyInquiryPassword(inputPassword, row.password);
      if (!matched) {
        return NextResponse.json(
          { error: "비밀번호가 일치하지 않습니다." },
          { status: 401 }
        );
      }
    }

    const images = extractInquiryImages(row);

    return NextResponse.json({
      inquiry: {
        id: row.id,
        name: isAdmin || isNotice ? row.name : maskName(row.name),
        phone: isAdmin ? row.phone : null,
        inquiry_type: isNotice
          ? "공지사항"
          : getInquiryTypeLabel(
              row.inquiry_type || (row.region ? "내 물건 팔기" : "기타 문의")
            ),
        category: row.category || "문의 내용",
        model: row.model || null,
        condition_grade: row.condition_grade || null,
        region: row.region || null,
        description: row.description || "",
        images,
        is_notice: isNotice,
        status: row.status || "접수",
        admin_reply: row.admin_reply || null,
        created_at: row.created_at,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "문의글 열람 처리 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminCheck = await verifyAdminRequest(req);
    const isAdmin = adminCheck.ok;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "잘못된 수정 요청입니다." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient(adminCheck.accessToken);

    const { data: existing, error: fetchError } = await supabase
      .from("purchase_requests")
      .select("id, password, is_notice, status")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "수정할 문의글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const isStatusOrReplyUpdate =
      typeof body.admin_reply === "string" || typeof body.status === "string";

    if (isStatusOrReplyUpdate && !isAdmin) {
      return NextResponse.json(
        { error: "답변 등록 및 진행 상태 변경은 관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    if (!isAdmin) {
      if (existing.is_notice) {
        return NextResponse.json(
          { error: "공지사항은 관리자만 수정할 수 있습니다." },
          { status: 403 }
        );
      }
      const inputPassword = String(body.password || "").trim();
      if (!verifyInquiryPassword(inputPassword, existing.password)) {
        return NextResponse.json(
          {
            error: "작성 시 설정한 비밀번호가 일치하지 않아 수정할 수 없습니다.",
          },
          { status: 401 }
        );
      }
    }

    const patch: Record<string, any> = {};
    if (typeof body.category === "string") {
      patch.category = body.category.trim().slice(0, 120);
    }
    if (typeof body.description === "string") {
      patch.description = body.description.trim().slice(0, 5000);
    }
    if (typeof body.inquiry_type === "string") {
      patch.inquiry_type = existing.is_notice
        ? "공지사항"
        : body.inquiry_type.trim().slice(0, 40);
    }
    if (isAdmin && typeof body.admin_reply === "string") {
      patch.admin_reply = body.admin_reply.trim().slice(0, 5000);
    }
    if (isAdmin && typeof body.status === "string") {
      const nextStatus = body.status.trim();
      if (!ALLOWED_STATUS_VALUES.has(nextStatus)) {
        return NextResponse.json(
          { error: `허용되지 않는 진행 상태값입니다: ${nextStatus}` },
          { status: 400 }
        );
      }
      patch.status = nextStatus;
    }

    // DB 업데이트 실행
    const { data: updated, error: updateError } = await supabase
      .from("purchase_requests")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error("DB 업데이트 에러 상세:", updateError);
      return NextResponse.json(
        { error: `DB 업데이트 실패: ${updateError.message}` },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json(
        { error: "해당 글을 수정할 권한(RLS)이 없거나 글을 찾을 수 없습니다." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      previousStatus: existing.status,
      updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `서버 오류: ${err.message || "알 수 없는 오류"}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminCheck = await verifyAdminRequest(req);
    const isAdmin = adminCheck.ok;

    const body = await req.json().catch(() => ({}));
    const inputPassword = String(body.password || "").trim();

    const supabase = createServerSupabaseClient(adminCheck.accessToken);
    const { data: existing, error: fetchError } = await supabase
      .from("purchase_requests")
      .select("id, password, is_notice")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "삭제할 게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!isAdmin) {
      if (existing.is_notice) {
        return NextResponse.json(
          { error: "공지사항은 관리자만 삭제할 수 있습니다." },
          { status: 403 }
        );
      }
      if (!verifyInquiryPassword(inputPassword, existing.password)) {
        return NextResponse.json(
          { error: "비밀번호가 일치하지 않아 삭제할 수 없습니다." },
          { status: 401 }
        );
      }
    }

    const { error: deleteError } = await supabase
      .from("purchase_requests")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: `게시글 삭제 실패: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "게시글 삭제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}