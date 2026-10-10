import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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

[분석 및 작성 가이드]
1. 이미지에서 브랜드명, 모델명(영문/숫자 코드), 총 용량을 정확히 판독하세요.
2. 당신이 보유한 모델 지식과 라벨 정보를 바탕으로 아래 기준에 맞춰 제목과 규격을 작성하세요:
   - 가정용 냉장고: 모델명과 총용량 명시, 확인 가능한 경우 냉장/냉동 분할 및 도어 형태 기재
   - 업소용 냉장고(우성/유니크 등): 박스 규격(25/45/65박스), 올냉장/올냉동/반냉동(1/2) 구분
   - 세탁기/건조기/에어컨: kg 용량 또는 평형수 명시
3. 반드시 아래 JSON 형식으로만 응답하세요:

{
  "category": "냉장고",
  "title": "삼성 비스포크 양문형 846L (RS84T50716C)",
  "specDetails": "총용량 846L, 양문형 푸드쇼케이스, 에너지효율 2등급 (월 29.3kWh)"
}
`;

    // 💡 tools 옵션 없이 순수 3.8 Flash 멀티모달 호출 (무료 쿼터 안정성 확보)
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
    });

    const responseText = response.text || "{}";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("AI 응답을 JSON으로 변환할 수 없습니다.");
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("AI 분석 에러:", error);
    return NextResponse.json(
      { 
        error: "제품 분석 실패", 
        detail: error?.message || String(error) 
      }, 
      { status: 500 }
    );
  }
}