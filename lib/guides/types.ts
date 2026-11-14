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

export interface InfoGuideArticle {
  number: number;
  slug: string;
  category: InfoGuideCategory;
  isPinned?: boolean;
  title: string;
  summary: string;
  readMinutes: number;
  updatedAt: string;
  heroImage?: InfoGuideHeroImage;
  keywords: string[];
  keyPoints: [string, string, string];
  sections: InfoGuideSection[];
  ctas: InfoGuideCta[];
}
