// 파일 경로: app/api/inquiries/upload-url/route.ts
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { STORAGE_BUCKETS } from "../../../../lib/site";
import { createServiceRoleClient } from "../../../../lib/supabase";
import {
  checkRateLimit,
  getClientIp,
  validateInquiryUploadSlotRequest,
  verifySameOriginRequest,
} from "../../../../lib/server-security";

export const runtime = "nodejs";

/**
 * 고객 문의 첨부 사진 전용 서명 업로드 URL 발급 API (익명 직접 Storage 업로드 차단)
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifySameOriginRequest(req, { requireOriginHeader: true })) {
      return NextResponse.json(
        { error: "허용되지 않은 요청 출처입니다." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rate = await checkRateLimit(`inquiry_upload:${ip}`, 15, 60 * 1000, {
      failureMode: "fail-closed",
    });
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `사진 업로드 요청이 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSec) },
        }
      );
    }

    const body = (await req.json().catch(() => null)) as {
      files?: unknown;
    } | null;
    const validation = validateInquiryUploadSlotRequest(body?.files);
    if (!validation.ok || !validation.slots) {
      return NextResponse.json(
        { error: validation.error || "유효한 사진 정보가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const batchTs = Date.now();
    const uploads = await Promise.all(
      validation.slots.map(async (slot, idx) => {
        const rand = crypto.randomBytes(6).toString("hex");
        const path = `inquiries/inq_${batchTs}_${idx + 1}_${rand}.${slot.ext}`;
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKETS.inquiryAttachments)
          .createSignedUploadUrl(path);
        if (error || !data?.token || !data?.signedUrl) {
          throw new Error(
            error?.message || "서명 업로드 URL 생성에 실패했습니다."
          );
        }
        const { data: pubData } = supabase.storage
          .from(STORAGE_BUCKETS.inquiryAttachments)
          .getPublicUrl(path);

        return {
          path,
          token: data.token,
          signedUrl: data.signedUrl,
          publicUrl: pubData.publicUrl,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        uploads,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (err: unknown) {
    console.error(
      "[inquiries/upload-url] 서명 URL 발급 오류:",
      err instanceof Error ? err.message : "unknown_error"
    );
    return NextResponse.json(
      {
        error:
          "첨부 사진 업로드 준비 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}
