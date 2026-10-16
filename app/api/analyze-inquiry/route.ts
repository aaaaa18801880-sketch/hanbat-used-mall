// 파일 경로: app/api/analyze-inquiry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITION_GRADES,
  normalizeProductCategory,
} from "../../../lib/site";
import {
  checkRateLimit,
  getClientIp,
  validateServerImageFiles,
} from "../../../lib/server-security";

export const runtime = "nodejs";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_GEMINI_MODEL = "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`analyze_inquiry:${ip}`, 8, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `AI 분석 요청이 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "현재 AI 자동 분석 기능을 사용할 수 없습니다. 아래 입력란에 직접 적어주세요.",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const entries = formData.getAll("files");
    const files = entries.filter((item): item is File => item instanceof File);

    const fileValidation = await validateServerImageFiles(files, {
      maxFiles: MAX_FILES,
      maxFileSizeBytes: MAX_FILE_SIZE,
    });

    if (!fileValidation.ok || !fileValidation.validated) {
      return NextResponse.json(
        { error: fileValidation.error || "유효한 사진 파일을 첨부해 주세요." },
        { status: 400 }
      );
    }

    const rawType = String(formData.get("inquiryType") || "내 물건 팔기").trim();

    const prompt = `
당신은 대전 중고가전·업소용 주방기기 전문 매장 '한밭중고전자'의 고객 상담/매입 자동 입력 AI입니다.
고객이 첨부한 ${fileValidation.validated.length}장의 사진(제품 정면, 모델명 스티커/명판, 설치 공간 등)을 한 번에 종합 분석하여 고객이 문의 폼을 일일이 타이핑하지 않아도 되도록 초안을 작성하세요.
현재 고객이 선택한 상담 유형: "${rawType}"

[절대 준수 원칙]
1. 사진 속 명판(라벨)에서 모델명이나 제조년월, 용량이 읽히면 정확히 추출하고, 사진에서 보이지 않는 정보는 절대 추측해서 지어내지 마세요.
2. "applianceCategory"는 반드시 다음 5개 중 하나로만 분류하세요:
   - "에어컨/냉난방기"
   - "냉장고"
   - "세탁기/건조기"
   - "업소용기기"
   - "기타"
3. "conditionGrade"는 다음 4개 중 하나로 분류하세요:
   - "S급 (새상품급)"
   - "A급 (사용감 적음)"
   - "B급 (보통)"
   - "C급 (노후/점검필요)"
4. "descriptionDraft"는 고객 입장에서 작성하는 3~4줄 분량의 간결한 문의 본문입니다. 사진에서 확인된 제품 정보(종류, 형태, 확인된 모델명/사양)를 첫 줄에 적고, 수거/설치 희망 일정이나 엘리베이터 유무만 추가로 적으면 되도록 안내 문구를 구성하세요.

반드시 다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{
  "applianceCategory": "냉장고",
  "title": "삼성 양문형 냉장고 방문 매입 견적 문의",
  "modelNumber": "RS84T5071SL",
  "conditionGrade": "A급 (사용감 적음)",
  "descriptionDraft": "• 사진 판독 품목: 삼성 양문형 냉장고 (모델명: RS84T5071SL)\\n• 작동 및 외관 상태: 정상 작동하며 외관 양호함\\n• 희망 방문일 및 층수(엘리베이터 유무): ",
  "summaryNote": "첨부 사진에서 제품 외관과 모델명 라벨을 확인하여 자동 입력했습니다."
}
`;

    const imageParts = fileValidation.validated.map((item) => ({
      inlineData: {
        mimeType: item.mimeType,
        data: item.base64,
      },
    }));

    const ai = new GoogleGenAI({ apiKey });
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
        modelErr instanceof Error ? modelErr.message : String(modelErr || "");
      if (
        DEFAULT_GEMINI_MODEL !== FALLBACK_GEMINI_MODEL &&
        (msg.includes("404") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("not supported"))
      ) {
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
    let raw: Record<string, unknown> = {};

    if (jsonMatch) {
      try {
        raw = JSON.parse(jsonMatch[0]);
      } catch {
        // fallback below
      }
    }

    const categoryCandidate =
      typeof raw.applianceCategory === "string"
        ? raw.applianceCategory.trim()
        : "";
    const applianceCategory = (
      PRODUCT_CATEGORIES as readonly string[]
    ).includes(categoryCandidate)
      ? categoryCandidate
      : normalizeProductCategory(categoryCandidate);

    const gradeCandidate =
      typeof raw.conditionGrade === "string" ? raw.conditionGrade.trim() : "";
    const conditionGrade = (
      PRODUCT_CONDITION_GRADES as readonly string[]
    ).includes(gradeCandidate)
      ? gradeCandidate
      : PRODUCT_CONDITION_GRADES[1];

    const modelNumber =
      typeof raw.modelNumber === "string" &&
      raw.modelNumber.trim() !== "미확인" &&
      raw.modelNumber.trim() !== "없음"
        ? raw.modelNumber.trim().slice(0, 60)
        : "";

    const title =
      typeof raw.title === "string" && raw.title.trim()
        ? raw.title.trim().slice(0, 80)
        : `${applianceCategory} ${rawType} 신청합니다`;

    const descriptionDraft =
      typeof raw.descriptionDraft === "string" && raw.descriptionDraft.trim()
        ? raw.descriptionDraft.trim().slice(0, 1500)
        : `• 문의 품목: ${applianceCategory}${modelNumber ? ` (${modelNumber})` : ""}\n• 희망 지역 및 층수(엘리베이터 유무): \n• 상세 문의 내용: `;

    const summaryNote =
      typeof raw.summaryNote === "string" && raw.summaryNote.trim()
        ? raw.summaryNote.trim()
        : `사진 ${fileValidation.validated.length}장을 분석하여 품목과 내용을 자동 작성했습니다.`;

    return NextResponse.json({
      success: true,
      applianceCategory,
      title,
      modelNumber,
      conditionGrade,
      descriptionDraft,
      summaryNote,
    });
  } catch (err: unknown) {
    console.error(
      "문의 사진 AI 분석 오류:",
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.json(
      {
        error:
          "사진 분석 중 일시적인 오류가 발생했습니다. 아래 입력란에 직접 적어주시면 빠르게 확인하겠습니다.",
      },
      { status: 500 }
    );
  }
}
