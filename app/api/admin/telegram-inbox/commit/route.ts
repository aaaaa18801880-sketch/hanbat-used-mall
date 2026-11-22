// 파일 경로: app/api/admin/telegram-inbox/commit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAnonServerClient } from "../../../../../lib/supabase";
import {
  extractStorageFilesByBucket,
  PRODUCT_STATUS,
  sanitizeOldManufactureYear,
  STORAGE_BUCKETS,
} from "../../../../../lib/site";
import { buildProductMutationPayload } from "../../../../../lib/product-ops";
import { resolveAnalyzedProductCategory } from "../../../../../lib/product-category-audit";
import { parseAnalyzedImageCrops } from "../../../../../lib/image-smart-crop";
import {
  buildProductAnalysisPrompt,
  sanitizeProductDraftArray,
  sanitizeProductDraftText,
} from "../../../../../lib/product-ai-prompt";
import {
  checkRateLimit,
  getClientIp,
  verifyAdminRequest,
} from "../../../../../lib/server-security";
import {
  generateGeminiWithFallback,
  parseGeminiJsonObject,
  type GeminiInlineImagePart,
} from "../../../../../lib/server-gemini";
import {
  fetchTelegramFileBuffer,
  getTelegramBotToken,
} from "../../../../../lib/telegram-server";
import {
  createAiVisionJpeg,
  processTelegramOriginalToProductWebp,
} from "../../../../../lib/server-image-sharp";
import {
  orderCommitItemsWithPrimaryExterior,
  resolvePhotoCommitRotations,
  sanitizeManualRotationMap,
  sortTelegramPhotosChronologically,
  TELEGRAM_MAX_PHOTOS_PER_PRODUCT,
  type TelegramInboxPhoto,
} from "../../../../../lib/telegram-inbox";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_COMMIT_PHOTOS = TELEGRAM_MAX_PHOTOS_PER_PRODUCT;
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_GEMINI_MODEL = "gemini-3.5-flash-lite";

/**
 * 단일 제품 묶음(1~3장)을 순차 커밋 처리:
 * 1) 텔레그램 고해상도 원본 병렬 다운로드
 * 2) 수집함 수동 회전 선적용 -> AI 제목·카테고리·모델명·스펙·회전·스마트크롭 좌표 판독
 * 3) 단일 패스 Sharp 고화질 WebP(1440px) 병렬 변환 + Supabase Storage 병렬 업로드
 * 4) products [검수대기] 비공개 저장 -> 수집함 committed 마킹
 */
export async function POST(req: NextRequest) {
  const adminCheck = await verifyAdminRequest(req);
  if (!adminCheck.ok) {
    return NextResponse.json(
      { error: adminCheck.error || "관리자 권한이 필요합니다." },
      { status: adminCheck.status }
    );
  }

  const rate = await checkRateLimit(
    `tg_commit:${adminCheck.email || getClientIp(req)}`,
    30,
    60 * 1000,
    { failureMode: "fail-closed" }
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.` },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const botToken = getTelegramBotToken();
  if (!apiKey || !botToken) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY 또는 TELEGRAM_BOT_TOKEN 설정이 필요합니다." },
      { status: 503 }
    );
  }

  let body: {
    photoIds?: unknown;
    categoryHint?: unknown;
    manualRotations?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const rawPhotoIds = Array.isArray(body.photoIds)
    ? body.photoIds
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean)
    : [];

  if (rawPhotoIds.length === 0) {
    return NextResponse.json(
      { error: "등록할 제품 묶음 사진 ID가 필요합니다." },
      { status: 400 }
    );
  }

  if (rawPhotoIds.length > MAX_COMMIT_PHOTOS) {
    return NextResponse.json(
      {
        error: `한 상품당 최대 ${MAX_COMMIT_PHOTOS}장까지만 등록할 수 있습니다 (현재 ${rawPhotoIds.length}장). [여기서 나누기]로 2~3장씩 분리해 주세요.`,
      },
      { status: 400 }
    );
  }

  const photoIds = rawPhotoIds;
  const manualRotationMap = sanitizeManualRotationMap(
    body.manualRotations,
    photoIds
  );

  const categoryHint =
    typeof body.categoryHint === "string"
      ? body.categoryHint.trim().slice(0, 60)
      : "";

  const supabase = createAnonServerClient(adminCheck.accessToken);
  const uploadedUrls: string[] = [];

  try {
    const { data, error } = await supabase
      .from("telegram_inbox_photos")
      .select("*")
      .in("id", photoIds)
      .eq("status", "pending");

    if (error) throw error;

    const ordered = sortTelegramPhotosChronologically(
      (data ?? []) as TelegramInboxPhoto[]
    );
    if (ordered.length === 0) {
      return NextResponse.json(
        { error: "이미 등록되었거나 존재하지 않는 사진 묶음입니다." },
        { status: 404 }
      );
    }

    // 1) 텔레그램 원본 병렬 다운로드
    const downloadedOriginals = await Promise.all(
      ordered.map((p) =>
        fetchTelegramFileBuffer({
          botToken,
          fileId: p.file_id,
          timeoutMs: 12000,
        })
      )
    );

    // 2) AI 판독용 1080px JPEG 병렬 생성 (수동 회전 선적용 + 평균 휘도 동시 산출)
    const aiTargetCount = Math.min(downloadedOriginals.length, 3);
    const visionPrepared = await Promise.all(
      downloadedOriginals.slice(0, aiTargetCount).map(async (item, idx) => {
        const manualDeg = manualRotationMap[ordered[idx].id] ?? 0;
        return createAiVisionJpeg(item.buffer, 1080, manualDeg);
      })
    );

    const imageParts: GeminiInlineImagePart[] = visionPrepared.map((vision) => ({
      inlineData: {
        mimeType: vision.mimeType,
        data: vision.buffer.toString("base64"),
      },
    }));

    const currentYear = new Date().getFullYear();
    const prompt = buildProductAnalysisPrompt({
      currentYear,
      categoryHint,
    });

    const { text: aiText, modelUsed } = await generateGeminiWithFallback({
      apiKey,
      defaultModel: DEFAULT_GEMINI_MODEL,
      fallbackModel: FALLBACK_GEMINI_MODEL,
      prompt,
      imageParts,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
      timeoutMs: 25000,
    });

    const { parsed } = parseGeminiJsonObject(aiText);
    const rawParsed = parsed ?? {};

    const aiCategory =
      typeof rawParsed.category === "string" ? rawParsed.category.trim() : "";
    const rawTitle =
      typeof rawParsed.title === "string" ? rawParsed.title.trim() : "";
    const finalCategory = resolveAnalyzedProductCategory({
      aiCategory,
      title: rawTitle,
      categoryHint,
    });

    let modelNumber = rawParsed.modelNumber
      ? String(rawParsed.modelNumber).trim()
      : "";
    if (modelNumber === "미확인") modelNumber = "";

    const baseTitle =
      rawTitle ||
      (modelNumber
        ? `${finalCategory} (${modelNumber})`
        : "중고 가전 실매물 (검수필요)");

    const rawSpecDetails =
      typeof rawParsed.specDetails === "string"
        ? rawParsed.specDetails.trim()
        : "";

    const yearCleaned = sanitizeOldManufactureYear(
      {
        category: finalCategory,
        title: sanitizeProductDraftText(baseTitle) || baseTitle,
        specDetails: sanitizeProductDraftText(rawSpecDetails),
        modelNumber,
        photoObserved: sanitizeProductDraftArray(
          Array.isArray(rawParsed.photoObserved)
            ? rawParsed.photoObserved.map(String)
            : []
        ),
        searchDerivedSpecs: sanitizeProductDraftArray(
          Array.isArray(rawParsed.searchDerivedSpecs)
            ? rawParsed.searchDerivedSpecs.map(String)
            : []
        ),
        needsReview: [],
      },
      currentYear
    );

    const parsedCrops = parseAnalyzedImageCrops(rawParsed.imageCrops);
    const cropByIndex = new Map(parsedCrops.map((c) => [c.index - 1, c]));

    const aiRotationByIndex = new Map<number, number>();
    if (Array.isArray(rawParsed.imageRotations)) {
      for (const r of rawParsed.imageRotations as Array<{
        index?: unknown;
        rotate?: unknown;
      }>) {
        const idx = typeof r.index === "number" ? r.index - 1 : -1;
        const deg = typeof r.rotate === "number" ? r.rotate : 0;
        if (idx >= 0 && [90, 180, 270].includes(deg)) {
          aiRotationByIndex.set(idx, deg);
        }
      }
    }

    // 3) 제품 외관 사진이 대표 1번(0번 인덱스)에 오도록 정렬 후 단일 패스 WebP 1440px 병렬 변환 및 업로드
    const preparedOriginals = downloadedOriginals.map((orig, i) => {
      const crop = cropByIndex.get(i) ?? null;
      const rot = resolvePhotoCommitRotations({
        manualDeg: manualRotationMap[ordered[i].id] ?? 0,
        aiDeg: aiRotationByIndex.get(i) ?? 0,
      });
      return {
        original: orig,
        rotateDegrees: rot.totalDeg,
        boxRotateDegrees: rot.postAiDeg,
        precomputedMeanLum: visionPrepared[i]?.meanLum,
        crop,
        role: (crop?.role ?? "other") as "product" | "nameplate" | "other",
      };
    });

    const orderedPrepared =
      orderCommitItemsWithPrimaryExterior(preparedOriginals);

    const batchTs = Date.now();
    const orderedPublicUrls = new Array<string>(orderedPrepared.length);

    await Promise.all(
      orderedPrepared.map(async (item, i) => {
        const processed = await processTelegramOriginalToProductWebp({
          inputBuffer: item.original.buffer,
          rotateDegrees: item.rotateDegrees,
          boxRotateDegrees: item.boxRotateDegrees,
          precomputedMeanLum: item.precomputedMeanLum,
          crop: item.crop,
          maxEdge: 1440,
        });

        const fileName = `product_tg_${batchTs}_${i + 1}_${Math.random()
          .toString(36)
          .slice(2, 7)}.webp`;

        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .upload(fileName, processed.buffer, {
            contentType: "image/webp",
          });

        if (upErr) throw upErr;

        const { data: pubUrlData } = supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .getPublicUrl(fileName);
        uploadedUrls.push(pubUrlData.publicUrl);
        orderedPublicUrls[i] = pubUrlData.publicUrl;
      })
    );

    uploadedUrls.length = 0;
    uploadedUrls.push(...orderedPublicUrls);

    // 4) products 테이블에 '검수대기'(비공개) 상태로 등록
    const productPayload = buildProductMutationPayload({
      title: yearCleaned.title || baseTitle,
      category: yearCleaned.category || finalCategory,
      status: PRODUCT_STATUS.PENDING_REVIEW,
      price: 0,
      conditionGrade: null,
      description: yearCleaned.specDetails || rawSpecDetails,
      modelName: modelNumber || null,
      imageUrls: uploadedUrls,
    });

    const { data: insertedProd, error: insertErr } = await supabase
      .from("products")
      .insert({
        ...productPayload,
        views: 0,
      })
      .select("id, title, category, status, image_url, price, created_at")
      .single();

    if (insertErr || !insertedProd) {
      throw insertErr || new Error("상품 DB 저장에 실패했습니다.");
    }

    // 5) 수집함 사진 상태를 committed로 전환
    const committedIds = ordered.map((p) => p.id);
    const { error: markErr } = await supabase
      .from("telegram_inbox_photos")
      .update({
        status: "committed",
        committed_product_id: insertedProd.id,
      })
      .in("id", committedIds);

    if (markErr) {
      console.error("[telegram-inbox/commit] 상태 업데이트 경고:", markErr.message);
    }

    return NextResponse.json({
      ok: true,
      modelUsed,
      product: insertedProd,
      committedPhotoIds: committedIds,
    });
  } catch (err: unknown) {
    // 업로드된 Storage 파일이 있다면 고아 파일 롤백 정리
    if (uploadedUrls.length > 0) {
      try {
        const { inquiries } = extractStorageFilesByBucket(uploadedUrls);
        if (inquiries.length > 0) {
          await supabase.storage.from(STORAGE_BUCKETS.inquiries).remove(inquiries);
        }
      } catch {
        // ignore rollback failure
      }
    }

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "상품 일괄 등록 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
