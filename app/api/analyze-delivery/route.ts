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
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  try {
    // 1. 서버 측 관리자 인증·권한 검증
    const adminCheck = await verifyAdminRequest(req);
    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error || "관리자 권한이 필요합니다." },
        { status: adminCheck.status }
      );
    }

    // 2. 요청 제한 (분당 10회)
    const ip = getClientIp(req);
    const rate = checkRateLimit(`analyze_delivery:${adminCheck.email || ip}`, 10, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.` },
        { status: 429 }
      );
    }

    // 3. API 키 확인
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          skipped: true,
          error: "서버에 GEMINI_API_KEY가 설정되어 있지 않아 분석을 수행할 수 없습니다.",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const multipleFiles = formData.getAll("files");
    const entries = multipleFiles.length ? multipleFiles : formData.getAll("file");
    const files = entries.filter((item): item is File => item instanceof File);

    // 4. 파일 개수, 크기, 시그니처(매직바이트) 검증
    const fileValidation = await validateServerImageFiles(files, {
      maxFiles: MAX_FILES,
      maxFileSizeBytes: MAX_FILE_SIZE,
    });

    if (!fileValidation.ok || !fileValidation.validated) {
      return NextResponse.json(
        { error: fileValidation.error || "배송/설치 사진을 올바르게 첨부해 주세요." },
        { status: 400 }
      );
    }

    const prompt = `
당신은 대전 중고가전/업소용 주방기기 전문 매장 '한밭중고전자'의 배송·설치 후기 등록 보조자입니다.
첨부된 현장 사진(배송, 운반, 안착, 설치 완료 사진)을 분석하여 고객들에게 신뢰를 줄 수 있는 자연스러운 [배송·설치 인증 제목]을 1문장(20~40자 내외)으로 작성하세요.

[분석 및 제목 작성 지침]
- 사진 속 '설치 장소/업종'과 '제품 유형'을 파악하여 신뢰감 있게 작성
- 예시:
  * "식당 주방 업소용 45박스 냉장냉동고 배송 및 안착 완료"
  * "카페 카이저 110kg 제빙기 급·배수 라인 연결 설치"
  * "가정집 LG 디오스 양문형 냉장고 안전 운반 및 수평 설치"
  * "세탁실 삼성 그랑데 세탁기·건조기 직렬 설치 완료"
  * "사무실 천장형 4Way 시스템에어컨 실내기 깔끔 배송"
- 지역명이 사진에서 확인되지 않으면 특정 지역명을 단정하지 말고, 장소의 특성(식당, 카페, 가정집 등)과 기기명 위주로 정갈하게 작성

반드시 다른 부연설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "title": "식당 주방 업소용 45박스 냉장고 배송 및 수평 설치 완료"
}
`;

    const imageParts = fileValidation.validated.map((item) => ({
      inlineData: {
        mimeType: item.mimeType,
        data: item.base64,
      },
    }));

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, ...imageParts],
        },
      ],
      config: { responseMimeType: "application/json" },
    });

    const responseText = response.text?.trim() || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let parsedTitle = "배송 및 설치 완료";

    if (jsonMatch) {
      try {
        const raw = JSON.parse(jsonMatch[0]);
        if (raw.title && typeof raw.title === "string") {
          parsedTitle = raw.title.trim();
        }
      } catch {
        console.warn("배송 사진 제목 JSON 파싱 보정");
      }
    }

    return NextResponse.json({ title: parsedTitle });
  } catch (error: unknown) {
    console.error(
      "배송 사진 분석 에러:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "배송 사진 분석에 실패했습니다. 직접 제목을 입력해 주세요." },
      { status: 500 }
    );
  }
}