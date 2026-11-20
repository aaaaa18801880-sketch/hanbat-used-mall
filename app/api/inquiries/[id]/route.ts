// 파일 경로: app/api/inquiries/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  extractInquiryImages,
  extractStorageFilesByBucket,
  INQUIRY_STATUS,
  INQUIRY_TYPES,
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
  verifyAdminRequest,
  verifyInquiryPasswordWithMeta,
  verifySameOriginRequest,
} from "../../../../lib/server-security";
import { signInquiryImageLists } from "../../../../lib/inquiry-attachments";
import {
  SAFE_INQUIRY_SELECT_COLUMNS,
  toInquiryDetailItem,
  type RawInquiryRow,
} from "../../../../lib/server-inquiries";

export const runtime = "nodejs";

function isValidInquiryId(id: string): boolean {
  const trimmed = id.trim();
  return trimmed.length > 0 && trimmed.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

function isSafeFilterFileName(filePath: string): boolean {
  return (
    filePath.length > 0 &&
    filePath.length <= 200 &&
    /^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,199}$/.test(filePath) &&
    !filePath.includes("..")
  );
}

async function filterUnreferencedStorageFiles(
  supabase: ReturnType<typeof createServiceRoleClient>,
  candidatePaths: string[],
  attachedUrls: string[],
  excludeInquiryId: string
): Promise<string[]> {
  const safePaths = Array.from(
    new Set(candidatePaths.filter((p) => isSafeFilterFileName(p)))
  ).slice(0, 5);
  if (safePaths.length === 0) return [];

  // 1순위: PostgreSQL RPC(get_referenced_storage_paths)로 1~5개 파일명만 DB 내부 EXISTS 단건 조회
  try {
    const { data: rpcReferenced, error: rpcErr } = await supabase.rpc(
      "get_referenced_storage_paths",
      {
        p_paths: safePaths,
        p_exclude_inquiry_id: excludeInquiryId,
      }
    );
    if (!rpcErr && Array.isArray(rpcReferenced)) {
      const referencedSet = new Set(
        rpcReferenced.map((item: unknown) => String(item))
      );
      return safePaths.filter((p) => !referencedSet.has(p));
    }
  } catch {
    // RPC 미배포 환경에서는 아래 제한적 조건 조회 폴백 사용
  }

  // 2순위 폴백: 40,000행 풀스캔 없이 대상 파일명 1~5개에 대해서만 .or(...) 조건 조회
  const orImageUrlFilter = safePaths
    .map((p) => `image_url.ilike.*${p}*`)
    .join(",");

  const [prodRes, inqUrlRes, inqArrRes] = await Promise.all([
    supabase
      .from("products")
      .select("image_url")
      .or(orImageUrlFilter)
      .limit(20),
    supabase
      .from("purchase_requests")
      .select("image_url")
      .neq("id", excludeInquiryId)
      .or(orImageUrlFilter)
      .limit(20),
    attachedUrls.length > 0
      ? supabase
          .from("purchase_requests")
          .select("images")
          .neq("id", excludeInquiryId)
          .overlaps("images", attachedUrls.slice(0, 5))
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // 참조 확인 쿼리가 실패한 경우 다른 레코드의 공용 파일 오삭제를 막기 위해 보수적으로 중단
  if (prodRes.error || inqUrlRes.error) {
    console.warn(
      "[inquiries DELETE] 첨부 참조 확인 실패로 Storage 삭제 생략:",
      prodRes.error?.message || inqUrlRes.error?.message
    );
    return [];
  }

  const haystacks: string[] = [];
  for (const row of prodRes.data ?? []) {
    if (typeof row.image_url === "string") haystacks.push(row.image_url);
  }
  for (const row of inqUrlRes.data ?? []) {
    if (typeof row.image_url === "string") haystacks.push(row.image_url);
  }
  if (!inqArrRes.error) {
    for (const row of inqArrRes.data ?? []) {
      if (Array.isArray(row.images)) {
        for (const u of row.images) {
          if (typeof u === "string") haystacks.push(u);
        }
      }
    }
  }

  return safePaths.filter(
    (filePath) => !haystacks.some((refText) => refText.includes(filePath))
  );
}

const ALLOWED_STATUS_VALUES = new Set<string>(Object.values(INQUIRY_STATUS));

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

    // [SEC-001] select("*") 대신 명시적 컬럼 조회 (관리자 열람 시에는 password 컬럼도 조회하지 않음)
    const selectColumns = isAdmin
      ? SAFE_INQUIRY_SELECT_COLUMNS
      : `${SAFE_INQUIRY_SELECT_COLUMNS}, password`;

    const { data: row, error } = await supabase
      .from("purchase_requests")
      .select(selectColumns)
      .eq("id", id)
      .single();

    if (error || !row) {
      return NextResponse.json(
        { error: "해당 문의글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const inquiryRow = row as unknown as RawInquiryRow & {
      password?: string | null;
    };
    const isNotice = Boolean(inquiryRow.is_notice);

    if (!isNotice && !isAdmin) {
      // [SEC-003] 동기식 scryptSync 폴백을 완전히 제거하고 비동기 verifyInquiryPasswordWithMeta만 사용
      const pwResult = await verifyInquiryPasswordWithMeta(
        inputPassword,
        inquiryRow.password
      );
      if (!pwResult.valid) {
        await recordInquiryPasswordFailure(id);
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
      extractInquiryImages(inquiryRow),
    ]);

    return NextResponse.json(
      {
        inquiry: toInquiryDetailItem(inquiryRow, { isAdmin, images }),
      },
      {
        headers: {
          "Cache-Control": "no-store, private",
          Vary: "Authorization",
        },
      }
    );
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
      if (existing.is_notice) {
        patch.inquiry_type = "공지사항";
      } else {
        const nextType = body.inquiry_type.trim().slice(0, 40);
        if (!(INQUIRY_TYPES as readonly string[]).includes(nextType)) {
          return NextResponse.json(
            { error: "허용되지 않는 문의 유형입니다." },
            { status: 400 }
          );
        }
        patch.inquiry_type = nextType;
      }
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

    const updated = toInquiryDetailItem(updatedRow, {
      isAdmin,
      preserveRawType: true,
    });

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
        return NextResponse.json(
          { error: "비밀번호가 일치하지 않아 삭제할 수 없습니다." },
          { status: 401 }
        );
      }
    }

    const { data: deletedRow, error: deleteError } = await supabase
      .from("purchase_requests")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      console.error("[inquiries DELETE] DB 삭제 오류:", deleteError.message);
      return NextResponse.json(
        { error: "게시글 삭제 중 서버 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!deletedRow) {
      return NextResponse.json(
        { error: "해당 게시글을 삭제할 권한이 없거나 이미 삭제되었습니다." },
        { status: !isAdmin && !process.env.SUPABASE_SERVICE_ROLE_KEY ? 403 : 404 }
      );
    }

    // 게시글 삭제 확정 후 연결된 Storage 첨부파일만 조건 조회하여 안전 파기
    try {
      const attachedImages = extractInquiryImages(existing);
      if (attachedImages.length > 0) {
        const {
          inquiries: inqFiles,
          productImages: prodFiles,
          attachments: attachmentFiles,
        } = extractStorageFilesByBucket(attachedImages);

        const cleanupClient = createServiceRoleClient();

        const safeAttachmentFiles = await filterUnreferencedStorageFiles(
          cleanupClient,
          attachmentFiles,
          attachedImages,
          id
        );
        if (safeAttachmentFiles.length > 0) {
          await cleanupClient.storage
            .from(STORAGE_BUCKETS.inquiryAttachments)
            .remove(safeAttachmentFiles);
        }

        // 공개 버킷(inquiries / product-images)은 공지사항이거나 관리자 삭제 시에만 미참조 검증 후 삭제
        if (isAdmin || Boolean(existing.is_notice)) {
          const safeInqFiles = await filterUnreferencedStorageFiles(
            cleanupClient,
            inqFiles,
            attachedImages,
            id
          );
          if (safeInqFiles.length > 0) {
            await cleanupClient.storage
              .from(STORAGE_BUCKETS.inquiries)
              .remove(safeInqFiles);
          }

          const safeProdFiles = await filterUnreferencedStorageFiles(
            cleanupClient,
            prodFiles,
            attachedImages,
            id
          );
          if (safeProdFiles.length > 0) {
            await cleanupClient.storage
              .from(STORAGE_BUCKETS.legacyProductImages)
              .remove(safeProdFiles);
          }
        }
      }
    } catch (storageErr) {
      console.warn("문의 첨부 이미지 Storage 정리 중 경미한 오류:", storageErr);
    }

    return NextResponse.json({ success: true, deletedId: deletedRow.id });
  } catch {
    return NextResponse.json(
      { error: "게시글 삭제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
