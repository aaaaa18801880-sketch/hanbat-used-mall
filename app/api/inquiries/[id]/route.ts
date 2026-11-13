// 파일 경로: app/api/inquiries/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  extractInquiryImages,
  extractStorageFilesByBucket,
  getInquiryTypeLabel,
  INQUIRY_STATUS,
  maskName,
  STORAGE_BUCKETS,
} from "../../../../lib/site";
import {
  createAnonServerClient,
  createServiceRoleClient,
} from "../../../../lib/supabase";
import {
  checkInquiryPasswordRateLimit,
  getClientIp,
  hashInquiryPasswordAsync,
  recordInquiryPasswordFailure,
  recordInquiryPasswordIpFailure,
  verifyAdminRequest,
  verifyInquiryPasswordWithMeta,
  verifySameOriginRequest,
} from "../../../../lib/server-security";
import { signInquiryImageLists } from "../../../../lib/inquiry-attachments";

export const runtime = "nodejs";

const ALLOWED_STATUS_VALUES = new Set<string>(Object.values(INQUIRY_STATUS));

const SAFE_INQUIRY_SELECT_COLUMNS =
  "id, name, phone, inquiry_type, category, model, condition_grade, region, description, images, image_url, is_notice, status, admin_reply, created_at";

function isValidInquiryId(id: string): boolean {
  const trimmed = id.trim();
  return trimmed.length > 0 && trimmed.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifySameOriginRequest(req)) {
      return NextResponse.json(
        { error: "허용되지 않은 요청 출처입니다." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!isValidInquiryId(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 문의글 식별자입니다." },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const adminCheck = await verifyAdminRequest(req);
    const isAdmin = adminCheck.ok;

    if (!isAdmin) {
      const rate = await checkInquiryPasswordRateLimit(ip, id);
      if (!rate.allowed) {
        return NextResponse.json(
          {
            error: `비밀번호 입력 실패 횟수가 초과되었습니다. ${rate.retryAfterSec}초 후에 다시 시도해 주세요.`,
          },
          { status: 429 }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const inputPassword = String(body.password || "").trim();

    // [SEC-005] 관리자는 본인의 Bearer JWT(Anon Client)로 조회하고, 비관리자 비밀번호 대조 시에만 Service Role 사용
    const supabase = isAdmin
      ? createAnonServerClient(adminCheck.accessToken)
      : createServiceRoleClient();

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
      // [SEC-003] 동기식 scryptSync 폴백을 완전히 제거하고 비동기 verifyInquiryPasswordWithMeta만 사용
      const pwResult = await verifyInquiryPasswordWithMeta(
        inputPassword,
        row.password
      );
      if (!pwResult.valid) {
        await recordInquiryPasswordFailure(id);
        await recordInquiryPasswordIpFailure(ip, id);
        return NextResponse.json(
          { error: "비밀번호가 일치하지 않습니다." },
          { status: 401 }
        );
      }

      // 레거시 평문 비밀번호 감지 시 scrypt 해시로 투명 마이그레이션
      if (pwResult.isLegacyPlaintext) {
        try {
          const upgradedHash = await hashInquiryPasswordAsync(inputPassword);
          await supabase
            .from("purchase_requests")
            .update({ password: upgradedHash })
            .eq("id", id);
        } catch {
          // Non-blocking legacy password upgrade
        }
      }
    }

    const [images] = await signInquiryImageLists(supabase, [
      extractInquiryImages(row),
    ]);

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
    if (!verifySameOriginRequest(req)) {
      return NextResponse.json(
        { error: "허용되지 않은 요청 출처입니다." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!isValidInquiryId(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 문의글 식별자입니다." },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const adminCheck = await verifyAdminRequest(req);
    const isAdmin = adminCheck.ok;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "잘못된 수정 요청입니다." },
        { status: 400 }
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
      const rate = await checkInquiryPasswordRateLimit(ip, id);
      if (!rate.allowed) {
        return NextResponse.json(
          {
            error: `비밀번호 입력 실패 횟수가 초과되었습니다. ${rate.retryAfterSec}초 후에 다시 시도해 주세요.`,
          },
          { status: 429 }
        );
      }
    }

    // [SEC-005] 관리자는 본인 JWT 권한으로, 일반 고객은 비밀번호 검증 후 서버 대리 수정
    const supabase = isAdmin
      ? createAnonServerClient(adminCheck.accessToken)
      : createServiceRoleClient();

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

    const patch: Record<string, unknown> = {};

    if (!isAdmin) {
      if (existing.is_notice) {
        return NextResponse.json(
          { error: "공지사항은 관리자만 수정할 수 있습니다." },
          { status: 403 }
        );
      }
      const inputPassword = String(body.password || "").trim();
      // [SEC-003] 비동기 verifyInquiryPasswordWithMeta 단일 경로 검증
      const pwResult = await verifyInquiryPasswordWithMeta(
        inputPassword,
        existing.password
      );
      if (!pwResult.valid) {
        await recordInquiryPasswordFailure(id);
        await recordInquiryPasswordIpFailure(ip, id);
        return NextResponse.json(
          {
            error: "작성 시 설정한 비밀번호가 일치하지 않아 수정할 수 없습니다.",
          },
          { status: 401 }
        );
      }
      if (pwResult.isLegacyPlaintext) {
        patch.password = await hashInquiryPasswordAsync(inputPassword);
      }
    }

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

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "수정할 항목이 없습니다." },
        { status: 400 }
      );
    }

    // [SEC-001] select("*") 대신 비밀번호 컬럼을 원천 배제한 안전한 컬럼만 조회
    const { data: updatedRow, error: updateError } = await supabase
      .from("purchase_requests")
      .update(patch)
      .eq("id", id)
      .select(SAFE_INQUIRY_SELECT_COLUMNS)
      .maybeSingle();

    if (updateError) {
      console.error("[inquiries PATCH] DB 업데이트 오류:", updateError.message);
      return NextResponse.json(
        { error: "문의글 수정 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 500 }
      );
    }

    if (!updatedRow) {
      return NextResponse.json(
        { error: "해당 글을 수정할 권한이 없거나 글을 찾을 수 없습니다." },
        { status: 403 }
      );
    }

    const isNotice = Boolean(updatedRow.is_notice);
    const updated = {
      id: updatedRow.id,
      name: isAdmin || isNotice ? updatedRow.name : maskName(updatedRow.name),
      phone: isAdmin ? updatedRow.phone : null,
      inquiry_type: updatedRow.inquiry_type,
      category: updatedRow.category,
      model: updatedRow.model || null,
      condition_grade: updatedRow.condition_grade || null,
      region: updatedRow.region || null,
      description: updatedRow.description || "",
      is_notice: isNotice,
      status: updatedRow.status || "접수",
      admin_reply: updatedRow.admin_reply || null,
      created_at: updatedRow.created_at,
    };

    return NextResponse.json({
      success: true,
      previousStatus: existing.status,
      updated,
    });
  } catch {
    return NextResponse.json(
      { error: "문의글 수정 처리 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifySameOriginRequest(req)) {
      return NextResponse.json(
        { error: "허용되지 않은 요청 출처입니다." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!isValidInquiryId(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 문의글 식별자입니다." },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const adminCheck = await verifyAdminRequest(req);
    const isAdmin = adminCheck.ok;

    if (!isAdmin) {
      const rate = await checkInquiryPasswordRateLimit(ip, id);
      if (!rate.allowed) {
        return NextResponse.json(
          {
            error: `비밀번호 입력 실패 횟수가 초과되었습니다. ${rate.retryAfterSec}초 후에 다시 시도해 주세요.`,
          },
          { status: 429 }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const inputPassword = String(body.password || "").trim();

    // [SEC-005] 관리자는 본인 JWT 권한으로, 일반 고객은 비밀번호 검증 후 서버 대리 삭제
    const supabase = isAdmin
      ? createAnonServerClient(adminCheck.accessToken)
      : createServiceRoleClient();

    // images 배열 컬럼과 image_url 레거시 컬럼을 모두 조회하여 첨부파일 누락 없이 삭제
    const { data: existing, error: fetchError } = await supabase
      .from("purchase_requests")
      .select("id, password, is_notice, images, image_url, description")
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
      // [SEC-003] 비동기 verifyInquiryPasswordWithMeta 단일 경로 검증
      const pwResult = await verifyInquiryPasswordWithMeta(
        inputPassword,
        existing.password
      );
      if (!pwResult.valid) {
        await recordInquiryPasswordFailure(id);
        await recordInquiryPasswordIpFailure(ip, id);
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
      console.error("[inquiries DELETE] DB 삭제 오류:", deleteError.message);
      return NextResponse.json(
        { error: "게시글 삭제 중 서버 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 게시글 삭제 성공 시 다른 레코드에서 참조하지 않는 본인 첨부 Storage 이미지만 안전하게 파기
    try {
      const attachedImages = extractInquiryImages(existing);
      if (attachedImages.length > 0) {
        const {
          inquiries: inqFiles,
          productImages: prodFiles,
          attachments: attachmentFiles,
        } = extractStorageFilesByBucket(attachedImages);

        const cleanupClient = isAdmin ? supabase : createServiceRoleClient();
        const { data: otherRows, error: refErr } = await cleanupClient
          .from("purchase_requests")
          .select("images, image_url")
          .neq("id", id)
          .limit(500);

        const referencedPaths = new Set<string>();
        let canVerifyRefs = !refErr;

        if (canVerifyRefs) {
          for (const row of otherRows ?? []) {
            for (const url of extractInquiryImages(row)) {
              const extracted = extractStorageFilesByBucket([url]);
              [
                ...extracted.inquiries,
                ...extracted.productImages,
                ...extracted.attachments,
              ].forEach((p) => referencedPaths.add(p));
            }
          }
        }

        // 관리자 공지/레거시 공용 버킷 삭제 전에는 상품 테이블 참조 여부까지 함께 확인
        if (isAdmin && canVerifyRefs && (inqFiles.length > 0 || prodFiles.length > 0)) {
          const { data: prodRows, error: prodRefErr } = await cleanupClient
            .from("products")
            .select("image_url")
            .limit(500);
          if (prodRefErr) {
            canVerifyRefs = false;
          } else {
            for (const pRow of prodRows ?? []) {
              const raw = typeof pRow.image_url === "string" ? pRow.image_url : "";
              if (!raw) continue;
              const extracted = extractStorageFilesByBucket(raw.split(",").map((s) => s.trim()));
              [...extracted.inquiries, ...extracted.productImages].forEach((p) =>
                referencedPaths.add(p)
              );
            }
          }
        }

        if (canVerifyRefs) {
          const unreferencedAttachments = attachmentFiles.filter(
            (p) => !referencedPaths.has(p) && (isAdmin || p.startsWith("inquiries/"))
          );
          if (unreferencedAttachments.length > 0) {
            await cleanupClient.storage
              .from(STORAGE_BUCKETS.inquiryAttachments)
              .remove(unreferencedAttachments);
          }

          if (isAdmin) {
            const unreferencedInq = inqFiles.filter((p) => !referencedPaths.has(p));
            if (unreferencedInq.length > 0) {
              await cleanupClient.storage
                .from(STORAGE_BUCKETS.inquiries)
                .remove(unreferencedInq);
            }
            const unreferencedProd = prodFiles.filter((p) => !referencedPaths.has(p));
            if (unreferencedProd.length > 0) {
              await cleanupClient.storage
                .from(STORAGE_BUCKETS.legacyProductImages)
                .remove(unreferencedProd);
            }
          }
        }
      }
    } catch (storageErr) {
      console.warn("문의 첨부 이미지 Storage 정리 중 경미한 오류:", storageErr);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "게시글 삭제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
