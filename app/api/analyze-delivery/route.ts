// app/api/analyze-delivery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const MAX_FILES = 2;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const multipleFiles = formData.getAll("files");
    const entries = multipleFiles.length ? multipleFiles : formData.getAll("file");

    const files = entries.filter((item): item is File => item instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "배송/설치 사진을 첨부해 주세요." },
        { status: 400 }
      );
    }

    const prompt = `
당신은 대전 중고가전/업소용 주방기기 전문 매장 '한밭중고전자'의 배송·설치 후기 등록 보조자입니다.
첨부된 현장 사진(배송, 운반, 안착, 설치 완료 사진)을 분석하여 고객들에게 신뢰를 줄 수 있는 자연스러운 [배송·설치 인증 제목]을 1문장(25~45자 내외)으로 작성하세요.

[분석 및 제목 작성 지침]
1. 사진 속 '장소/업종'과 '제품 유형'을 파악하세요:
   - 식당/주방 현장: "식당 주방 업소용 45박스 냉장냉동고 배송 및 안착 완료"
   - 카페/음료 매장: "카페 카이저 110kg 제빙기 급·배수 라인 연결 설치"
   - 가정집/아파트: "가정집 LG 디오스 양문형 냉장고 안전 운반 및 수평 설치"
   - 세탁실/다용도실: "다용도실 삼성 그랑데 세탁기·건조기 직렬 설치 완료"
   - 에어컨/냉난방기: "사무실 천장형 4Way 시스템에어컨 실내기 깔끔 배송"
2. 지역명(대전, 유성, 세종 등)은 사진에서 확인되지 않으면 임의로 단정하지 말고, 장소의 특성(식당, 카페, 베이커리, 가정집, 원룸, 사무실 등)과 기기명 위주로 신뢰감 있게 작성하세요.
3. 과장되지 않고 현장감이 느껴지는 정갈한 어조로 작성하세요.

반드시 다른 부연설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "title": "식당 주방 업소용 45박스 냉장고 배송 및 수평 설치 완료"
}
`;

    const imageParts = await Promise.all(
      files.slice(0, MAX_FILES).map(async (file) => ({
        inlineData: {
          mimeType: file.type || "image/jpeg",
          data: Buffer.from(await file.arrayBuffer()).toString("base64"),
        },
      }))
    );

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
      } catch (e) {
        console.warn("JSON 파싱 보정 시도:", e);
      }
    }

    return NextResponse.json({ title: parsedTitle });
  } catch (error: unknown) {
    console.error("배송 사진 분석 에러:", error);
    return NextResponse.json(
      {
        error: "배송 사진 분석에 실패했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}