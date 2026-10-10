import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다. Netlify에서 재배포(Clear cache and deploy)를 실행해 주세요." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "이미지 파일이 전송되지 않았습니다." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
당신은 중고 가전 및 식당/업소용 주방기기 전문 매니저입니다.
첨부된 제품 사진 또는 에너지효율/스펙 라벨 스티커 이미지를 분석해 주세요.

[요구사항]
1. 이미지에 표시된 브랜드, 모델명(영문/숫자 코드), 용량을 판독하세요.
2. 당신이 알고 있는 해당 모델의 공식 제원을 토대로 다음 사항을 명시하세요:
   - 가정용 냉장고: 냉장실/냉동실 각각 리터(L) 분할, 도어 형태 (예: 양문형, 4도어 등)
   - 업소용 냉장고: 박스 규격(25/45/65박스), 올냉장/올냉동/반냉동(1/2) 구분
   - 세탁기/건조기/에어컨: kg 용량 및 평형수
3. 반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 금지):

{
  "category": "냉장고",
  "title": "삼성 비스포크 양문형 846L (RS84T50716C)",
  "specDetails": "냉장 526L / 냉동 320L, 푸드쇼케이스, 디지털 인버터, 2등급"
}
`;

    let responseText = "";

    try {
      // 1차 시도: 구글 검색 도구와 함께 호출
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
      responseText = response.text || "";
    } catch (toolError) {
      console.warn("구글 검색 툴 호출 실패, 표준 멀티모달로 재시도:", toolError);
      // 2차 시도: 일반 멀티모달 분석
      const fallbackResponse = await ai.models.generateContent({
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
      });
      responseText = fallbackResponse.text || "";
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI가 JSON 형식으로 응답하지 않았습니다: " + responseText.slice(0, 100));
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("AI 분석 상세 오류:", error);
    return NextResponse.json(
      { 
        error: error?.message || "제품 분석 중 오류가 발생했습니다." 
      }, 
      { status: 500 }
    );
  }
}