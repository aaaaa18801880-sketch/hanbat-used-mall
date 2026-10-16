// 파일 경로: app/api/analyze-delivery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  checkRateLimit,
  getClientIp,
  validateServerImageFiles,
  verifyAdminRequest,
} from "../../../lib/server-security";

export const runtime = "nodejs";

const MAX_FILES = 2;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_GEMINI_MODEL = "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await verifyAdminRequest(req);
    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error || "관리자 권한이 필요합니다." },
        { status: adminCheck.status }
      );
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(
      `analyze_delivery:${adminCheck.email || ip}`,
      10,
      60 * 1000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          skipped: true,
          error:
            "서버에 GEMINI_API_KEY가 설정되어 있지 않아 분석을 수행할 수 없습니다.",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const multipleFiles = formData.getAll("files");
    const entries = multipleFiles.length
      ? multipleFiles
      : formData.getAll("file");
    const files = entries.filter((item): item is File => item instanceof File);

    const fileValidation = await validateServerImageFiles(files, {
      maxFiles: MAX_FILES,
      maxFileSizeBytes: MAX_FILE_SIZE,
    });

    if (!fileValidation.ok || !fileValidation.validated) {
      return NextResponse.json(
        {
          error:
            fileValidation.error || "배송/설치 사진을 올바르게 첨부해 주세요.",
        },
        { status: 400 }
      );
    }

    const prompt = `
당신은 대전 중고가전/업소용 주방기기 전문 매장 '한밭중고전자'의 배송·설치 사례 등록 보조자입니다.
첨부된 현장 사진에서 실제로 확인할 수 있는 '제품 유형'과 '설치/운반 상황'에만 근거하여 [배송·설치 사례 제목 초안]을 1문장(18~38자 내외)으로 작성하세요.

[절대 준수 지침 - 임의 창작 금지]
1. 사진만으로 알 수 없는 정확한 지역명(예: 대전 둔산동, 세종시 등), 고객 실명/상호명, 정확한 제품 모델명, 최종 설치 완료 여부를 임의로 단정하거나 지어내지 마세요.
2. 사진이 운반 중이면 '운반/반입 현장', 자리 배치 상태면 '배송 및 현장 배치'처럼 사진에서 보이는 사실 수준으로만 서술하세요.
3. 사진에서 직접 확인한 요소("observedElements")와 관리자가 게시 전에 확인·보충하면 좋은 항목("needsReview")을 함께 반환하세요.

반드시 다른 부연설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "title": "업소용 45박스 수직 냉장고 주방 현장 반입 및 배치",
  "observedElements": ["업소용 4도어 수직 냉장고", "상업용 주방 타일 바닥 배치 상태"],
  "needsReview": ["배송 지역명이나 구체적인 업종을 표기하려면 제목을 수정해 주세요."]
}
`;

    const imageParts = fileValidation.validated.map((item) => ({
      inlineData: {
        mimeType: item.mimeType,
        data: item.base64,
      },
    }));

    const ai = new GoogleGenAI({ apiKey });
    let modelUsed = DEFAULT_GEMINI_MODEL;
    let response;

    try {
      response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }, ...imageParts],
          },
        ],
        config: { responseMimeType: "application/json" },
      });
    } catch (modelErr: unknown) {
      const msg =
        modelErr instanceof Error
          ? modelErr.message
          : String(modelErr || "");
      if (
        DEFAULT_GEMINI_MODEL !== FALLBACK_GEMINI_MODEL &&
        (msg.includes("404") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("not supported"))
      ) {
        modelUsed = FALLBACK_GEMINI_MODEL;
        response = await ai.models.generateContent({
          model: FALLBACK_GEMINI_MODEL,
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }, ...imageParts],
            },
          ],
          config: { responseMimeType: "application/json" },
        });
      } else {
        throw modelErr;
      }
    }

    const responseText = response.text?.trim() || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let parsedTitle = "중고가전 현장 배송 및 배치 사례";
    let observedElements: string[] = [];
    let needsReview: string[] = [
      "AI가 작성한 제목 초안입니다. 실제 배송 지역이나 제품명을 확인 후 게시해 주세요.",
    ];

    if (jsonMatch) {
      try {
        const raw = JSON.parse(jsonMatch[0]);
        if (raw.title && typeof raw.title === "string") {
          parsedTitle = raw.title.trim();
        }
        if (Array.isArray(raw.observedElements)) {
          observedElements = raw.observedElements
            .map((x: unknown) => String(x).trim())
            .filter(Boolean);
        }
        if (Array.isArray(raw.needsReview) && raw.needsReview.length > 0) {
          needsReview = raw.needsReview
            .map((x: unknown) => String(x).trim())
            .filter(Boolean);
        }
      } catch {
        console.warn("배송 사진 제목 JSON 파싱 보정");
      }
    }

    return NextResponse.json({
      isDraft: true,
      modelUsed,
      title: parsedTitle,
      observedElements,
      needsReview,
    });
  } catch (error: unknown) {
    console.error(
      "배송 사진 분석 에러:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      {
        error: "배송 사진 분석에 실패했습니다. 직접 제목을 입력해 주세요.",
      },
      { status: 500 }
    );
  }
}