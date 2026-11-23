// 파일 경로: lib/site/structured-inquiry.ts
// 상담 유형별 AI 사진 분석 스키마 및 구조화 문의 포맷/파서

import type { InquiryTypeValue, ProductCategoryValue } from "../site";

type FactSourceType = "사진 판독" | "고객 직접 입력";
type FactVerificationStatus =
  | "확인됨"
  | "일부 판독(재확인 필요)"
  | "미확인";

export interface ExtractedFactItem {
  label: string;
  value: string;
  source: FactSourceType;
  status: FactVerificationStatus;
}

export interface PhotoBreakdownItem {
  photoIndex: number;
  role: string;
  summary: string;
}

interface PurchaseAnalysisData {
  photoTypes: string[];
  requestedProduct: string;
  confirmedSpecs: string[];
  installationObservations: string[];
  purchaseRequirements: string[];
}

interface SellAnalysisData {
  manufacturer: string;
  manufacturingDate: string;
  safetyLabelReadability:
    | "선명함"
    | "일부만 보임"
    | "판독 불가"
    | "라벨 사진 없음";
  safetyLabelDetails: string[];
  visibleConditionNotes: string[];
  photoLabelConsistency:
    | "일치 확인"
    | "단일 사진/비교 대상 없음"
    | "불일치 의심 — 확인 필요";
  operatingStatusNote: string;
  confirmedQuantity: string;
}

export interface BulkRequestedItem {
  id: string;
  category: string;
  observedInPhotoCount: number | null;
  requestedQuantity: string;
  modelNumber: string;
  specs: string;
  verificationStatus:
    | "고객 입력 확인"
    | "사진 참고 확인(수량 미정)"
    | "추가 확인 필요";
}

interface BulkElectricalInfo {
  phaseType: "단상 220V" | "삼상 380V" | "모름/미확인";
  observedVoltage: string;
  contractPower: string;
  readability: string;
  voltageUpgradeStatus: "필요" | "불필요" | "모름·현장 확인 필요";
  notes: string;
}

interface BulkInstallationInfo {
  spaceLayout: string;
  utilities: string;
  accessRoute: string;
  removalAndExtra: string;
  targetRegionAndSchedule: string;
}

interface BulkAnalysisData {
  businessType: string;
  requestedItems: BulkRequestedItem[];
  electricalInfo: BulkElectricalInfo;
  installationInfo: BulkInstallationInfo;
}

interface OtherAnalysisData {
  inquirySummary: string;
  observedItems: string[];
}

export interface AnalyzeInquiryResponse {
  success: boolean;
  inquiryType: InquiryTypeValue;
  applianceCategory: ProductCategoryValue | "";
  title: string;
  modelNumber: string;
  conditionGrade: string | null;
  descriptionDraft: string;
  summaryNote: string;
  photoBreakdown: PhotoBreakdownItem[];
  extractedFacts: ExtractedFactItem[];
  missingInfo: string[];
  followUpQuestions: string[];
  purchaseAnalysis?: PurchaseAnalysisData;
  sellAnalysis?: SellAnalysisData;
  bulkAnalysis?: BulkAnalysisData;
  otherAnalysis?: OtherAnalysisData;
}

interface StructuredInquiryPayload {
  inquiryType: InquiryTypeValue;
  customerContent: string;
  linkedProductUrl?: string;
  applianceCategory?: string;
  modelNumber?: string;
  region?: string;
  schedule?: string;
  /* 매입 전용 고객 확인 값 */
  manufacturingDate?: string;
  operatingStatus?: string;
  conditionGrade?: string;
  /* 대량·업소용 전용 고객 확인 값 */
  businessType?: string;
  bulkItems?: Array<{
    category: string;
    requestedQuantity: string;
    modelNumber?: string;
    specs?: string;
  }>;
  electricalPhase?: string;
  voltageUpgrade?: string;
  spaceAndUtilities?: string;
  accessAndRemoval?: string;
  /* AI 참고 메타데이터 (고객 직접 입력과 분리) */
  aiReference?: {
    summaryNote: string;
    extractedFacts: ExtractedFactItem[];
    missingInfo: string[];
    followUpQuestions: string[];
  } | null;
}

interface ParsedStructuredInquiry {
  isStructured: boolean;
  customerContent: string;
  structuredLines: Array<{ label: string; value: string }>;
  bulkItems: string[];
  aiSummaryLines: string[];
  missingAndQuestions: string[];
}

const STRUCTURED_HEADER = "[상담 조건 및 확인 정보]";
const AI_REF_HEADER = "[AI 사진 판독 참고 요약 — 관리자 확인용]";

export function formatStructuredInquiryDescription(
  payload: StructuredInquiryPayload
): string {
  const sections: string[] = [];

  const cleanContent = payload.customerContent.trim();
  if (cleanContent) {
    sections.push(cleanContent);
  }

  const metaLines: string[] = [];
  if (payload.linkedProductUrl?.trim()) {
    metaLines.push(`• 문의 상품 링크: ${payload.linkedProductUrl.trim()}`);
  }
  if (
    payload.inquiryType !== "기타 문의" &&
    payload.applianceCategory?.trim()
  ) {
    metaLines.push(`• 품목 분류: ${payload.applianceCategory.trim()}`);
  }
  if (payload.inquiryType !== "기타 문의" && payload.modelNumber?.trim()) {
    metaLines.push(`• 모델명: ${payload.modelNumber.trim()}`);
  }
  if (payload.region?.trim()) {
    metaLines.push(
      `• ${
        payload.inquiryType === "내 물건 팔기"
          ? "방문 수거 지역"
          : "설치/현장 지역"
      }: ${payload.region.trim()}`
    );
  }
  if (payload.schedule?.trim()) {
    metaLines.push(`• 희망 일정/층수: ${payload.schedule.trim()}`);
  }

  if (payload.inquiryType === "내 물건 팔기") {
    if (payload.manufacturingDate?.trim()) {
      metaLines.push(`• 제조년월(연식): ${payload.manufacturingDate.trim()}`);
    }
    if (payload.operatingStatus?.trim()) {
      metaLines.push(`• 고객 확인 작동 상태: ${payload.operatingStatus.trim()}`);
    }
    if (payload.conditionGrade?.trim()) {
      metaLines.push(`• 고객 선택 외관 상태: ${payload.conditionGrade.trim()}`);
    }
  }

  if (payload.inquiryType === "대량·업소용 상담") {
    if (payload.businessType?.trim()) {
      metaLines.push(`• 업종 및 용도: ${payload.businessType.trim()}`);
    }
    if (payload.bulkItems && payload.bulkItems.length > 0) {
      const itemStrings = payload.bulkItems
        .filter((it) => it.category.trim())
        .map((it) => {
          const qty = it.requestedQuantity.trim() || "미확인(상담 필요)";
          const mdl = it.modelNumber?.trim()
            ? ` / 모델·규격: ${it.modelNumber.trim()}`
            : "";
          const spc = it.specs?.trim() ? ` (${it.specs.trim()})` : "";
          return `  - ${it.category.trim()} | 희망 수량: ${qty}${mdl}${spc}`;
        });
      if (itemStrings.length > 0) {
        metaLines.push(`• 희망 장비 및 수량 목록:\n${itemStrings.join("\n")}`);
      }
    }
    if (payload.electricalPhase?.trim()) {
      metaLines.push(`• 매장 전기 환경: ${payload.electricalPhase.trim()}`);
    }
    if (payload.voltageUpgrade?.trim()) {
      metaLines.push(`• 승압 필요 여부: ${payload.voltageUpgrade.trim()}`);
    }
    if (payload.spaceAndUtilities?.trim()) {
      metaLines.push(
        `• 설치 공간·설비 조건: ${payload.spaceAndUtilities.trim()}`
      );
    }
    if (payload.accessAndRemoval?.trim()) {
      metaLines.push(
        `• 반입 동선·철거 요청: ${payload.accessAndRemoval.trim()}`
      );
    }
  }

  if (metaLines.length > 0) {
    sections.push(`${STRUCTURED_HEADER}\n${metaLines.join("\n")}`);
  }

  if (payload.aiReference) {
    const aiLines: string[] = [];
    if (payload.aiReference.summaryNote) {
      aiLines.push(`• 판독 요약: ${payload.aiReference.summaryNote}`);
    }
    const photoFacts = payload.aiReference.extractedFacts.filter(
      (f) => f.source === "사진 판독"
    );
    if (photoFacts.length > 0) {
      aiLines.push(
        `• 사진 확인 항목: ${photoFacts
          .map((f) => `${f.label}(${f.value} - ${f.status})`)
          .join(", ")}`
      );
    }
    if (payload.aiReference.missingInfo.length > 0) {
      aiLines.push(
        `• 미확인 항목: ${payload.aiReference.missingInfo.join(" / ")}`
      );
    }
    if (payload.aiReference.followUpQuestions.length > 0) {
      aiLines.push(
        `• 추가 확인 권장 질문: ${payload.aiReference.followUpQuestions.join(
          " / "
        )}`
      );
    }
    if (aiLines.length > 0) {
      sections.push(`${AI_REF_HEADER}\n${aiLines.join("\n")}`);
    }
  }

  return sections.join("\n\n").slice(0, 4900);
}

export function parseStructuredInquiryDescription(
  rawDescription?: string | null
): ParsedStructuredInquiry {
  const text = (rawDescription || "").trim();
  if (!text.includes(STRUCTURED_HEADER) && !text.includes(AI_REF_HEADER)) {
    return {
      isStructured: false,
      customerContent: text,
      structuredLines: [],
      bulkItems: [],
      aiSummaryLines: [],
      missingAndQuestions: [],
    };
  }

  let customerPart = text;
  let structuredPart = "";
  let aiPart = "";

  if (customerPart.includes(AI_REF_HEADER)) {
    const splitAi = customerPart.split(AI_REF_HEADER);
    customerPart = splitAi[0].trim();
    aiPart = (splitAi[1] || "").trim();
  }

  if (customerPart.includes(STRUCTURED_HEADER)) {
    const splitStruct = customerPart.split(STRUCTURED_HEADER);
    customerPart = splitStruct[0].trim();
    structuredPart = (splitStruct[1] || "").trim();
  }

  const structuredLines: Array<{ label: string; value: string }> = [];
  const bulkItems: string[] = [];

  structuredPart.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("- ")) {
      bulkItems.push(trimmed.slice(2).trim());
      return;
    }
    if (trimmed.startsWith("•")) {
      const body = trimmed.slice(1).trim();
      const colonIdx = body.indexOf(":");
      if (colonIdx > 0) {
        const label = body.slice(0, colonIdx).trim();
        const value = body.slice(colonIdx + 1).trim();
        if (value) {
          structuredLines.push({ label, value });
        }
      }
    }
  });

  const aiSummaryLines: string[] = [];
  const missingAndQuestions: string[] = [];

  aiPart.split("\n").forEach((line) => {
    const trimmed = line.replace(/^[•\-*]\s*/, "").trim();
    if (!trimmed) return;
    if (
      trimmed.startsWith("미확인 항목:") ||
      trimmed.startsWith("추가 확인 권장 질문:")
    ) {
      missingAndQuestions.push(trimmed);
    } else {
      aiSummaryLines.push(trimmed);
    }
  });

  return {
    isStructured: true,
    customerContent: customerPart,
    structuredLines,
    bulkItems,
    aiSummaryLines,
    missingAndQuestions,
  };
}
