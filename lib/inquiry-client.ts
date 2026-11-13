import {
  compressImage,
  MAX_PHOTOS,
  type AnalyzeInquiryResponse,
  type InquiryTypeValue,
} from "./site";

export interface InquiryPhotoGuide {
  subtitle: string;
  image: string;
  tip: string;
  steps: readonly { step: string; title: string; desc: string }[];
}

export const INQUIRY_PHOTO_GUIDES: Record<InquiryTypeValue, InquiryPhotoGuide> =
  {
    "내 물건 팔기": {
      subtitle: "KC인증 라벨 및 제조년월 확인 필수",
      image: "/images/ai-photo-guide.png",
      tip: "팁: 제조년월과 모델명이 표기된 명판 스티커를 선명하게 찍어주시면 방문 전 예상 매입가 범위를 보다 정확히 안내해 드립니다.",
      steps: [
        {
          step: "01",
          title: "정면 전체 샷",
          desc: "제품 외관과 도어 형태가 한눈에 보이게 촬영",
        },
        {
          step: "02",
          title: "모델명·제조년월 명판",
          desc: "에너지효율등급 또는 정격 라벨 스티커 근접 촬영",
        },
        {
          step: "03",
          title: "특이사항·반출 동선",
          desc: "흠집 부위나 계단·출입문 등 참고 사진",
        },
      ],
    },
    "구매 문의": {
      subtitle: "희망 제품 및 설치 공간 확인 권장",
      image: "/images/photo-guide-buy.jpg",
      tip: "팁: 들어갈 자리 사진이나 기존 가전 사진을 올려주시면 규격 적합 여부 및 사다리차 필요 여부를 사전에 안내해 드립니다.",
      steps: [
        {
          step: "01",
          title: "희망 제품 또는 설치 공간",
          desc: "찾으시는 제품 사진이나 들어갈 자리 전경 촬영",
        },
        {
          step: "02",
          title: "전원 · 급배수 · 배관",
          desc: "콘센트(단상/삼상) 또는 배관 타공 위치",
        },
        {
          step: "03",
          title: "반입 동선 참고 사진",
          desc: "출입구 폭이나 계단·엘리베이터 등 참고 사진",
        },
      ],
    },
    "대량·업소용 상담": {
      subtitle: "주방 공간 및 분전반 사진 권장",
      image: "/images/photo-guide-bulk.jpg",
      tip: "팁: 분전반(차단기)과 주방 전경 사진을 함께 보내주시면 현장 방문 전 매장 여건에 맞는 견적과 동선을 안내해 드립니다.",
      steps: [
        {
          step: "01",
          title: "도입/처분 장비 또는 도면",
          desc: "필요한 업소용 설비 참고 사진 또는 기존 장비 사진",
        },
        {
          step: "02",
          title: "매장 분전반 · 전원 환경",
          desc: "단상(220V)/삼상(380V) 차단기 용량이나 콘센트 위치",
        },
        {
          step: "03",
          title: "주방 공간 · 반입 동선",
          desc: "설치할 주방 자리와 급배수·출입구 전경",
        },
      ],
    },
    "기타 문의": {
      subtitle: "문의 부위 및 현장 확인 사진",
      image: "/images/ai-photo-guide.png",
      tip: "팁: 현장 사진이나 제품 상태 사진을 첨부해 주시면 담당자가 빠르게 파악하여 정확히 안내해 드립니다.",
      steps: [
        {
          step: "01",
          title: "제품 및 현장 사진",
          desc: "확인이 필요한 제품 외관 및 증상 부위",
        },
        {
          step: "02",
          title: "모델명 라벨",
          desc: "제품 측면/후면의 모델명 표기 스티커",
        },
        {
          step: "03",
          title: "기타 참고 자료",
          desc: "배송지 환경 또는 참고 서류 사진",
        },
      ],
    },
  };

export interface AnalyzeInquiryPhotosParams {
  files: File[];
  inquiryType: InquiryTypeValue;
  userTitle?: string;
  userModel?: string;
  userRegion?: string;
  userDescription?: string;
  userBusinessType?: string;
  userElectrical?: string;
  userVoltageUpgrade?: string;
  fallbackError?: string;
}

/**
 * Compress attached photos on the client and request structured AI inquiry drafting from /api/analyze-inquiry.
 */
export async function analyzeInquiryPhotos({
  files,
  inquiryType,
  userTitle,
  userModel,
  userRegion,
  userDescription,
  userBusinessType,
  userElectrical,
  userVoltageUpgrade,
  fallbackError = "AI 사진 분석에 실패했습니다.",
}: AnalyzeInquiryPhotosParams): Promise<AnalyzeInquiryResponse> {
  const formData = new FormData();
  formData.append("inquiryType", inquiryType);
  if (userTitle) formData.append("userTitle", userTitle);
  if (userModel) formData.append("userModel", userModel);
  if (userRegion) formData.append("userRegion", userRegion);
  if (userDescription) formData.append("userDescription", userDescription);
  if (userBusinessType) formData.append("userBusinessType", userBusinessType);
  if (userElectrical) formData.append("userElectrical", userElectrical);
  if (userVoltageUpgrade) formData.append("userVoltageUpgrade", userVoltageUpgrade);

  for (const file of files.slice(0, MAX_PHOTOS)) {
    const compressedBlob = await compressImage(file, 1280, 0.8);
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const optimizedFile = new File([compressedBlob], `${baseName}.jpg`, {
      type: "image/jpeg",
    });
    formData.append("files", optimizedFile);
  }

  const res = await fetch("/api/analyze-inquiry", {
    method: "POST",
    body: formData,
  });

  const data = (await res
    .json()
    .catch(() => ({}))) as Partial<AnalyzeInquiryResponse> & { error?: string };
  if (!res.ok || !data.success) {
    throw new Error(data.error || fallbackError);
  }

  return data as AnalyzeInquiryResponse;
}

/**
 * Fire a non-blocking client fallback notification to /api/telegram when server-side dispatch did not confirm.
 */
export function dispatchTelegramFallback(payload: {
  inquiryId: string | number;
  name: string;
  phone: string;
  type: InquiryTypeValue | string;
  title: string;
}): void {
  fetch("/api/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
