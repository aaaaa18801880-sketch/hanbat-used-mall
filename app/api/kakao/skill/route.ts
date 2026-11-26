// 파일 경로: app/api/kakao/skill/route.ts
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { PRODUCT_STATUS, STORE } from "../../../../lib/site";
import { checkRateLimit, getClientIp } from "../../../../lib/server-security";
import {
  buildKakaoSkillErrorResponse,
  buildKakaoSkillSearchResponse,
  extractUtteranceFromKakaoPayload,
  type KakaoProductRecord,
  type KakaoSkillRequestPayload,
} from "../../../../lib/kakao-skill";

export const runtime = "nodejs";

function verifyOptionalSkillSecret(req: NextRequest): boolean {
  const expectedSecret = (process.env.KAKAO_SKILL_SECRET || "").trim();
  if (!expectedSecret) return true;

  const headerSecret = (req.headers.get("x-kakao-skill-secret") || "").trim();
  const querySecret = (req.nextUrl.searchParams.get("secret") || "").trim();
  const provided = headerSecret || querySecret;
  if (!provided) return false;

  const a = crypto.createHash("sha256").update(provided, "utf8").digest();
  const b = crypto.createHash("sha256").update(expectedSecret, "utf8").digest();
  return crypto.timingSafeEqual(a, b);
}

const ALLOWED_SITE_HOSTS = new Set(["hanbatmall.com", "www.hanbatmall.com"]);

function resolveSiteOrigin(req: NextRequest): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (configured.startsWith("https://")) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through to validated host check
    }
  }
  const rawHost = (
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    ""
  )
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (rawHost && ALLOWED_SITE_HOSTS.has(rawHost)) {
    return `https://${rawHost}`;
  }
  return STORE.url;
}

/**
 * 카카오톡 채널(카카오 i 오픈빌더) DB 직접 조회형 스킬 엔드포인트
 * - LLM 호출 없이 Supabase products 실매물만 직접 검색하여 0.2초 내외로 carousel 카드를 반환합니다.
 */
export async function POST(req: NextRequest) {
  const siteOrigin = resolveSiteOrigin(req);

  if (!verifyOptionalSkillSecret(req)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const ip = getClientIp(req);
    const rate = await checkRateLimit(`kakao_skill:${ip}`, 180, 60 * 1000, {
      failureMode: "fail-open",
    });
    if (!rate.allowed) {
      return NextResponse.json(buildKakaoSkillErrorResponse(siteOrigin), {
        status: 200,
      });
    }

    const payload = (await req
      .json()
      .catch(() => null)) as KakaoSkillRequestPayload | null;
    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid Kakao skill request payload" },
        { status: 400 }
      );
    }

    const rawQuery = extractUtteranceFromKakaoPayload(payload);

    const { data, error } = await supabase
      .from("products")
      .select("id, title, category, description, image_url, price, status, created_at")
      .neq("category", "배송인증")
      .neq("status", PRODUCT_STATUS.PENDING_REVIEW)
      .neq("status", PRODUCT_STATUS.SOLD)
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) {
      console.error("[kakao/skill] products query error:", error.message);
      return NextResponse.json(buildKakaoSkillErrorResponse(siteOrigin), {
        status: 200,
      });
    }

    const responseBody = buildKakaoSkillSearchResponse({
      products: (data ?? []) as KakaoProductRecord[],
      rawQuery,
      siteOrigin,
    });

    return NextResponse.json(responseBody, { status: 200 });
  } catch (err: unknown) {
    console.error(
      "[kakao/skill] unexpected error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json(buildKakaoSkillErrorResponse(siteOrigin), {
      status: 200,
    });
  }
}
