import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "이미지가 없습니다." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    const prompt = `
당신은 중고 가전 및 업소용 주방기기 전문 감정 매니저입니다.
첨부된 제품 사진 또는 스펙/에너지효율 라벨 이미지를 분석해 주세요.

[분석 및 검색 절차]
1. 이미지에서 브랜드명, 모델명(영문/숫자 코드), 총 용량을 정확히 판독하세요.
2. 판독한 모델명으로 실시간 구글 검색을 수행하여 공식 스펙(용량 분할, 도어 형태, 기능)을 확인하세요.
3. 제품 유형에 따라 다음 규칙을 적용하여 제목과 상세 설명을 구성하세요:

  A. 가정용 냉장고/김치냉장고:
     - 냉장실과 냉동실의 각각 리터(L) 용량을 반드시 찾아 기재
     - 도어 형태(양문형, 4도어, 일반 2도어 등) 명시
     - 예시: "삼성 비스포크 양문형 846L (냉장 526L / 냉동 320L) - RS84T50716C"

  B. 업소용 냉장고/냉동고 (우성, 유니크, 라셀르 등):
     - 박스 규격 구분 (예: 25박스, 30박스, 45박스, 65박스, 테이블형 등)
     - 냉장/냉동 방식 필수 명시 (예: 올냉장, 올냉동, 반냉동[상냉동 하냉장 / 1/2], 1/4 냉동 등)
     - 냉각 방식 명시 (직냉식 / 간냉식)
     - 예시: "우성 45박스 업소용 냉장고 (기존 1/2 반냉동 / 직냉식) - WS-1260RF"

  C. 기타 가전(세탁기, 건조기, 에어컨 등):
     - 세탁/건조 용량(kg), 에어컨 평형수, 스탠드/벽걸이/2in1 구분 명시

[응답 포맷]
반드시 다른 설명 없이 아래 JSON 포맷으로만 출력하세요:
{
  "category": "냉장고 | 김치냉장고 | 세탁기/건조기 | 에어컨/냉난방기 | TV/영상가전 | 업소용 주방기기 | 기타 가전 중 택1",
  "title": "손님이 한눈에 알아볼 수 있는 정돈된 판매 상품명",
  "specDetails": "냉장/냉동 리터 구분, 컴프레서 방식, 소비전력 등 검색된 핵심 스펙 요약"
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
    
    // JSON 파싱 (코드블록 마크다운이 붙어있을 경우 제거)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : "{}";
    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("제품 분석 에러:", error);
    return NextResponse.json({ error: "제품 분석 실패" }, { status: 500 });
  }
}