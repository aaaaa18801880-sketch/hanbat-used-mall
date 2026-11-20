// 파일 경로: lib/guides/meta.ts
import {
  INFO_GUIDE_CATEGORY_LIST,
  LEGACY_GUIDE_CATEGORY_ALIASES,
  type InfoGuideCategory,
  type InfoGuideFilterCategory,
  type InfoGuidePriorityRole,
  type InfoGuidePriorityTier,
  type PrioritizedInfoGuideArticle,
} from "./types";

export {
  INFO_GUIDE_CATEGORY_LIST,
  LEGACY_GUIDE_CATEGORY_ALIASES,
  type InfoGuideCategory,
  type InfoGuideFilterCategory,
  type InfoGuidePriorityRole,
  type InfoGuidePriorityTier,
};

import { resolveGuideThumbnail } from "./thumbnails";

export interface GuideBoardSummaryItem {
  number: number;
  slug: string;
  category: InfoGuideCategory;
  priorityTier: InfoGuidePriorityTier;
  priorityRole: InfoGuidePriorityRole;
  priorityRank: number;
  title: string;
  summary: string;
  readMinutes: number;
  updatedAt: string;
  keywords: string[];
  hasTable: boolean;
  hasDiagram: boolean;
  thumbnailSrc: string;
  thumbnailAlt: string;
}

export function sortGuidesByPriority<
  T extends {
    priorityTier: InfoGuidePriorityTier;
    priorityRank: number;
    number: number;
  },
>(articles: readonly T[]): T[] {
  return [...articles].sort((a, b) => {
    if (a.priorityTier !== b.priorityTier) {
      return a.priorityTier - b.priorityTier;
    }
    if (a.priorityRank !== b.priorityRank) {
      return a.priorityRank - b.priorityRank;
    }
    return a.number - b.number;
  });
}

export function toGuideBoardSummary(
  article: PrioritizedInfoGuideArticle,
): GuideBoardSummaryItem {
  const thumb = resolveGuideThumbnail(article);
  return {
    number: article.number,
    slug: article.slug,
    category: article.category,
    priorityTier: article.priorityTier,
    priorityRole: article.priorityRole,
    priorityRank: article.priorityRank,
    title: article.title,
    summary: article.summary,
    readMinutes: article.readMinutes,
    updatedAt: article.updatedAt,
    keywords: article.keywords,
    hasTable: article.sections.some((section) => Boolean(section.table)),
    hasDiagram: Boolean(article.heroImage),
    thumbnailSrc: thumb.src,
    thumbnailAlt: thumb.alt,
  };
}
