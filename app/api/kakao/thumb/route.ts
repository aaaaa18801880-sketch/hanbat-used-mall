// 파일 경로: app/api/kakao/thumb/route.ts
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { PRODUCT_STATUS, splitImages } from "../../../../lib/site";
import { checkRateLimit, getClientIp } from "../../../../lib/server-security";

export const runtime = "nodejs";

const VALID_PRODUCT_ID_REGEX =
  /^(?:[1-9][0-9]{0,15}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

function getAllowedSupabaseHost(): string | null {
  try {
    const parsed = new URL((process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim());
    return parsed.protocol === "https:" ? parsed.hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

function parseValidatedStorageImageUrl(rawUrl: string): URL | null {
  const allowedHost = getAllowedSupabaseHost();
  if (!allowedHost) return null;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return null;
    if (parsed.hostname.toLowerCase() !== allowedHost) return null;
    if (!parsed.pathname.startsWith("/storage/v1/object/public/")) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function serveFallbackOgJpeg(): Promise<NextResponse> {
  const fallbackPath = path.join(process.cwd(), "public", "og-image.jpg");
  const buffer = await fs.readFile(fallbackPath);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

/**
 * 카카오톡 챗봇 썸네일 전용 경량 JPEG 변환 프록시
 * - Supabase Storage 내 검증된 상품 대표 사진만 ID로 조회·변환하여 SSRF를 원천 차단합니다.
 */
export async function GET(req: NextRequest) {
  const rate = await checkRateLimit(
    `kakao_thumb:${getClientIp(req)}`,
    60,
    60 * 1000,
    { failureMode: "fail-open" }
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many thumbnail requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      }
    );
  }

  const productId = (req.nextUrl.searchParams.get("id") || "").trim();
  if (!VALID_PRODUCT_ID_REGEX.test(productId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const hasExtraQueryParams = Array.from(
    req.nextUrl.searchParams.keys()
  ).some((key) => key !== "id");
  if (hasExtraQueryParams) {
    const canonicalUrl = new URL(req.nextUrl.pathname, req.url);
    canonicalUrl.searchParams.set("id", productId);
    return NextResponse.redirect(canonicalUrl, 308);
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, image_url, status")
      .eq("id", productId)
      .neq("category", "배송인증")
      .neq("status", PRODUCT_STATUS.PENDING_REVIEW)
      .maybeSingle();

    if (error || !data) {
      return serveFallbackOgJpeg();
    }

    const primaryUrl = splitImages(
      (data as { image_url?: string | null }).image_url
    )[0];
    if (!primaryUrl) {
      return serveFallbackOgJpeg();
    }

    const validatedUrl = parseValidatedStorageImageUrl(primaryUrl);
    if (!validatedUrl) {
      return serveFallbackOgJpeg();
    }

    const imgRes = await fetch(validatedUrl.toString(), {
      redirect: "error",
      signal: AbortSignal.timeout(4000),
    });
    if (!imgRes.ok) {
      return serveFallbackOgJpeg();
    }

    const sourceBuffer = Buffer.from(await imgRes.arrayBuffer());
    const jpegBuffer = await sharp(sourceBuffer, { failOn: "none" })
      .rotate()
      .resize(800, 800, {
        fit: "cover",
        position: "attention",
      })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();

    return new NextResponse(new Uint8Array(jpegBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return serveFallbackOgJpeg();
  }
}
