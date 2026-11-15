// 파일 경로: lib/guides/types.ts
import type { GuideDiagramId } from "../../components/guide/guide-diagrams";

export type InfoGuideCategory =
  | "에어컨 · A/S"
  | "에어컨 · 원리/설치"
  | "냉장고 · 세탁기"
  | "업소용 주방설비"
  | "전기 · 220V/380V"
  | "창업 · 폐업"
  | "배송 · 사다리차"
  | "중고 구매 팁";

export const INFO_GUIDE_CATEGORY_LIST = [
  "전체",
  "에어컨 · A/S",
  "에어컨 · 원리/설치",
  "냉장고 · 세탁기",
  "업소용 주방설비",
  "전기 · 220V/380V",
  "창업 · 폐업",
  "배송 · 사다리차",
  "중고 구매 팁",
] as const;

export type InfoGuideFilterCategory =
  (typeof INFO_GUIDE_CATEGORY_LIST)[number];

export interface InfoGuideTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface InfoGuideSection {
  heading: string;
  paragraphs: string[];
  diagram?: GuideDiagramId;
  bullets?: string[];
  table?: InfoGuideTable;
  tip?: {
    title: string;
    items: string[];
  };
}

export interface InfoGuideHeroImage {
  src: string;
  alt: string;
  caption: string;
}

export interface InfoGuideCta {
  label: string;
  href: string;
  variant: "primary" | "outline" | "accent";
}

export type InfoGuideSourceType =
  | "공식자료 기반"
  | "학술연구 기반"
  | "전문가 검토"
  | "현장사례 기반"
  | "소비자 경험";

export type InfoGuideRiskLevel =
  | "일반 정보 (권장 재검토 12개월)"
  | "기술·성능 정보 (권장 재검토 6개월)"
  | "안전·법률 정보 (권장 재검토 3개월)";

export interface InfoGuideSourceItem {
  org: string;
  title: string;
  url?: string;
  date?: string;
  usedFor: string;
}

export interface InfoGuideVerification {
  verifiedAt: string;
  contentTypes: InfoGuideSourceType[];
  riskLevel: InfoGuideRiskLevel;
  primarySources: InfoGuideSourceItem[];
  fieldNote: string;
}

export type InfoGuidePriorityTier = 1 | 2;

export type InfoGuidePriorityRole =
  | "매입·처분"
  | "구매·선택"
  | "설치·계약"
  | "고장·점검"
  | "안전·관리";

export interface InfoGuideArticle {
  number: number;
  slug: string;
  category: InfoGuideCategory;
  isPinned?: boolean;
  priorityTier?: InfoGuidePriorityTier;
  priorityRole?: InfoGuidePriorityRole;
  priorityRank?: number;
  title: string;
  summary: string;
  readMinutes: number;
  updatedAt: string;
  heroImage?: InfoGuideHeroImage;
  keywords: string[];
  keyPoints: [string, string, string];
  sections: InfoGuideSection[];
  ctas: InfoGuideCta[];
  verification?: InfoGuideVerification;
}

export interface PrioritizedInfoGuideArticle extends InfoGuideArticle {
  priorityTier: InfoGuidePriorityTier;
  priorityRole: InfoGuidePriorityRole;
  priorityRank: number;
}
