import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "환경변수 오류: GEMINI_API_KEY가 서버에 등록되지 않았습니다." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "이미지 파일이 전달되지 않았습니다." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
당신은 중고 가전 및 업소용 주방기기 전문 매니저입니다.
첨부된 제품 사진 또는 스펙/에너지효율 라벨 이미지를 분석해 주세요.

[요구사항]
1. 브랜드명, 모델명, 용량 등을 파악하세요.
2. 업소용의 경우 올냉장/올냉동/반냉동 구분, 박스 수(25/45/65 등)를 명시하세요.
3. 가정용의 경우 냉장/냉동 리터 구분을 명시하세요.

반드시 아래 JSON 포맷으로만 응답하세요:
{
  "category": "냉장고",
  "title": "삼성 비스포크 양문형 846L (RS84T50716C)",
  "specDetails": "냉장 526L / 냉동 320L, 푸드쇼케이스, 2등급"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image,
                mimeType: file.type || "image/jpeg",
              },
            },
          ],
        },
      ],
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = response.text || "{}";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : "{}";
    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("AI 분석 상세 에러:", error);
    // 💡 에러 원인을 클라이언트에 그대로 전달하여 즉시 확인 가능하게 함
    return NextResponse.json(
      { 
        error: "제품 분석 실패", 
        detail: error?.message || String(error) 
      }, 
      { status: 500 }
    );
  }
}