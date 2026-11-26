// 파일 경로: lib/purchase-wizard.ts
// 토스/증권사앱 스타일 매입·견적 위자드 순수 UX 헬퍼 (단위 테스트 대상)

import { isValidPhone, PRODUCT_CATEGORIES, type ProductCategoryValue } from "./site";

export const WIZARD_CATEGORY_META: Record<
  ProductCategoryValue,
  { label: string; hint: string }
> = {
  "에어컨/냉난방기": {
    label: "에어컨 · 냉난방기",
    hint: "스탠드 · 벽걸이 · 천장형 · 업소용",
  },
  냉장고: {
    label: "냉장고 · 김치냉장고",
    hint: "양문형 · 4도어 · 일반 · 김치",
  },
  "세탁기/건조기": {
    label: "세탁기 · 건조기",
    hint: "드럼 · 통돌이 · 워시타워",
  },
  업소용기기: {
    label: "업소용 주방 · 냉장",
    hint: "45박스 · 쇼케이스 · 제빙기 · 테이블",
  },
  기타: {
    label: "기타 가전",
    hint: "TV · 전자레인지 · 소형가전 등",
  },
};

export const WIZARD_QUICK_REGIONS = [
  "대전 중구",
  "대전 서구",
  "대전 유성구",
  "대전 동구",
  "대전 대덕구",
  "세종시",
  "충청 인근",
] as const;

export function getWizardStepCount(isSell: boolean, selectedFilesCount: number): 2 | 3 {
  return isSell && selectedFilesCount > 0 ? 2 : 3;
}

export function getWizardDisplayStep(
  step: 1 | 2 | 3,
  isSell: boolean,
  selectedFilesCount: number
): number {
  if (isSell && selectedFilesCount > 0 && step === 3) {
    return 2;
  }
  return step;
}

export function getWizardProgressPercent(
  step: 1 | 2 | 3,
  isSell: boolean,
  selectedFilesCount: number
): number {
  const total = getWizardStepCount(isSell, selectedFilesCount);
  const current = getWizardDisplayStep(step, isSell, selectedFilesCount);
  return Math.round((current / total) * 100);
}

export function getStep1PrimaryCta(params: {
  isSell: boolean;
  selectedCategoriesCount: number;
  selectedFilesCount: number;
}): { label: string; ready: boolean } {
  const { isSell, selectedCategoriesCount, selectedFilesCount } = params;
  if (isSell && selectedFilesCount > 0) {
    return {
      label: "바로 연락처 입력하기",
      ready: true,
    };
  }
  if (selectedCategoriesCount > 0) {
    return {
      label: isSell
        ? `${selectedCategoriesCount}개 품목 선택됨 · 다음으로`
        : `${selectedCategoriesCount}개 품목으로 다음 단계`,
      ready: true,
    };
  }
  return {
    label: isSell ? "사진을 올리거나 품목을 골라주세요" : "상담할 품목을 골라주세요",
    ready: false,
  };
}

export function applyQuickRegion(currentRegion: string, quickRegion: string): string {
  const trimmed = currentRegion.trim();
  if (!trimmed) return quickRegion;
  if (trimmed === quickRegion || trimmed.startsWith(`${quickRegion} `)) {
    return trimmed;
  }
  // 기존에 선택한 빠른 지역 접두사가 있으면 교체하고 나머지 동/상세 주소는 보존
  for (const preset of WIZARD_QUICK_REGIONS) {
    if (trimmed === preset) {
      return quickRegion;
    }
    if (trimmed.startsWith(`${preset} `)) {
      const rest = trimmed.slice(preset.length).trim();
      return rest ? `${quickRegion} ${rest}` : quickRegion;
    }
  }
  return `${quickRegion} ${trimmed}`;
}

export function getStep3Readiness(params: {
  name: string;
  phone: string;
  password: string;
  agreed: boolean;
}): {
  ready: boolean;
  phoneValid: boolean;
  missingHint: string | null;
} {
  const nameOk = params.name.trim().length > 0;
  const phoneValid = isValidPhone(params.phone);
  const pwLen = params.password.trim().length;
  const passwordValid = pwLen === 0 || pwLen >= 4;

  if (!nameOk) {
    return { ready: false, phoneValid, missingHint: "성함 또는 상호명을 입력해 주세요" };
  }
  if (!phoneValid) {
    return { ready: false, phoneValid, missingHint: "연락처를 정확히 입력해 주세요" };
  }
  if (!passwordValid) {
    return {
      ready: false,
      phoneValid,
      missingHint: "비밀번호는 4자리 이상 입력하거나 비워두세요",
    };
  }
  if (!params.agreed) {
    return {
      ready: false,
      phoneValid,
      missingHint: "개인정보 수집·이용에 동의해 주세요",
    };
  }

  return { ready: true, phoneValid, missingHint: null };
}

export function getCategoryMeta(category: string): { label: string; hint: string } {
  if ((PRODUCT_CATEGORIES as readonly string[]).includes(category)) {
    return WIZARD_CATEGORY_META[category as ProductCategoryValue];
  }
  return { label: category, hint: "" };
}
