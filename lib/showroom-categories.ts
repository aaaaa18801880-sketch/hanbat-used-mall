// 파일 경로: lib/showroom-categories.ts
// 품목별 쇼룸 카탈로그 순수 데이터·필터·매칭 SSOT

import {
  getCategoryWarrantyInfo,
  normalizeProductCategory,
} from "./site";
import type { ModernIconType } from "../components/ui/modern-icons";

export type PictogramKey =
  | "all"
  | "aircon"
  | "fridge"
  | "washer"
  | "small"
  | "bizFridge"
  | "showcase"
  | "kitchen";

export type ShowroomGroupFilter = "all" | "home" | "biz";

export interface ShowroomCategoryItem {
  key: PictogramKey;
  label: string;
  subLabel: string;
  tagline: string;
  specPoint: string;
  imageSrc: string;
  imageAlt: string;
  imageClassName?: string;
  icon: ModernIconType;
  href: string;
  filterCategory: string;
  filterKeyword?: string;
  group: "all" | "home" | "biz";
}

export const SHOWROOM_GROUP_TABS: readonly {
  key: ShowroomGroupFilter;
  label: string;
}[] = [
  { key: "all", label: "전체 품목" },
  { key: "home", label: "가정용 가전" },
  { key: "biz", label: "업소 · 창업 설비" },
] as const;

export const SHOWROOM_CATEGORIES: ShowroomCategoryItem[] = [
  {
    key: "all",
    label: "전체 실매물",
    subLabel: "가정·업소 전 품목",
    tagline: "고압세척과 배송 전 작동 점검을 마친 직영 실매물",
    specPoint: "현장 확인 · 고압세척 · 작동 점검",
    imageSrc: "/images/showroom/all.jpg",
    imageAlt: "에어컨·냉장고·세탁기 전 품목 스튜디오 대표 이미지",
    imageClassName: "object-contain",
    icon: "all",
    href: "/gallery",
    filterCategory: "전체",
    group: "all",
  },
  {
    key: "aircon",
    label: "에어컨·냉난방",
    subLabel: "벽걸이·스탠드·천장형",
    tagline: "평형별 인버터 냉난방기, 가스 누설·냉방 점검 완료",
    specPoint: "인버터 · 평형 · 가스 누설 점검",
    imageSrc: "/images/showroom/aircon.jpg",
    imageAlt: "스탠드 및 벽걸이 인버터 에어컨 스튜디오 이미지",
    imageClassName: "object-contain",
    icon: "aircon",
    href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
    filterCategory: "에어컨/냉난방기",
    group: "home",
  },
  {
    key: "fridge",
    label: "냉장고·김치냉장",
    subLabel: "양문·4도어·김치냉장고",
    tagline: "도어 패킹 밀착과 냉장·냉동 온도 확인 완료",
    specPoint: "도어패킹 · 냉각 온도 점검",
    imageSrc: "/images/showroom/fridge.jpg",
    imageAlt: "4도어 프렌치 냉장고 스튜디오 이미지",
    imageClassName: "object-contain",
    icon: "fridge",
    href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
    filterCategory: "냉장고",
    group: "home",
  },
  {
    key: "washer",
    label: "세탁기·건조기",
    subLabel: "드럼·통돌이·건조기",
    tagline: "급수·배수·탈수 진동 확인 및 고압세척 완료",
    specPoint: "급배수 · 탈수 · 작동 점검",
    imageSrc: "/images/showroom/washer.jpg",
    imageAlt: "드럼 세탁기 스튜디오 이미지",
    imageClassName: "object-contain",
    icon: "washer",
    href: "/gallery?category=%EC%84%B8%ED%83%81%EA%B8%B0%2F%EA%B1%B4%EC%A1%B0%EA%B8%B0",
    filterCategory: "세탁기/건조기",
    group: "home",
  },
  {
    key: "small",
    label: "TV·소형가전",
    subLabel: "TV·전자레인지·기타",
    tagline: "화면·단자·전원 정상 작동 확인 후 실매물 출고",
    specPoint: "화면 · 단자 · 전원 작동 확인",
    imageSrc: "/images/showroom/small.jpg",
    imageAlt: "TV와 전자레인지 소형가전 스튜디오 이미지",
    imageClassName: "object-contain",
    icon: "small",
    href: "/gallery?category=%EA%B8%B0%ED%83%80",
    filterCategory: "기타",
    group: "home",
  },
  {
    key: "bizFridge",
    label: "업소용 냉장고",
    subLabel: "25·45박스·테이블",
    tagline: "식당·카페용 스텐 냉장·냉동고, 220V 단상 점검",
    specPoint: "220V 단상 · 냉각 작동 점검",
    imageSrc: "/images/showroom/biz-fridge.jpg",
    imageAlt: "업소용 45박스 스텐 4도어 냉장고 스튜디오 이미지",
    imageClassName: "object-contain",
    icon: "biz-fridge",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EB%83%89%EC%9E%A5",
    filterCategory: "업소용기기",
    filterKeyword: "냉장",
    group: "biz",
  },
  {
    key: "showcase",
    label: "음료·주류 쇼케이스",
    subLabel: "음료·주류·디저트",
    tagline: "전면 유리 결로 열선과 내부 냉각 작동 점검 완료",
    specPoint: "결로 열선 · 냉각 작동 점검",
    imageSrc: "/images/showroom/showcase.jpg",
    imageAlt: "업소용 음료·주류 유리 도어 쇼케이스 스튜디오 이미지",
    imageClassName: "object-contain",
    icon: "showcase",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EC%87%BC%EC%BC%80%EC%9D%B4%EC%8A%A4",
    filterCategory: "업소용기기",
    filterKeyword: "쇼케이스",
    group: "biz",
  },
  {
    key: "kitchen",
    label: "제빙기·주방설비",
    subLabel: "제빙기·세척기·스텐",
    tagline: "카페 제빙기·식기세척기 현장 설치·배수 상담",
    specPoint: "220V 단상 · 급배수 작동 점검",
    imageSrc: "/images/showroom/kitchen.jpg",
    imageAlt: "업소용 제빙기와 식기세척기 스튜디오 이미지",
    imageClassName: "object-contain",
    icon: "kitchen",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EC%A0%9C%EB%B9%99%EA%B8%B0",
    filterCategory: "업소용기기",
    group: "biz",
  },
];

export function filterShowroomCategoriesByGroup(
  group: ShowroomGroupFilter
): ShowroomCategoryItem[] {
  if (group === "all") return SHOWROOM_CATEGORIES;
  return SHOWROOM_CATEGORIES.filter((item) => item.group === group);
}

export function getShowroomCategoryWarrantyLabel(
  item: ShowroomCategoryItem
): string {
  if (item.key === "all") {
    return "직영 무상 A/S 보증";
  }
  return getCategoryWarrantyInfo(item.filterCategory).compactLabel;
}

/**
 * 쇼룸 카테고리별 상호 배타(1:1) 매칭 SSOT
 * — 업소용기기 세부 3분류(업소용 냉장고 / 쇼케이스 / 제빙기·주방설비)가 겹치지 않도록 분리해
 *   세부 카테고리 합계가 항상 전체 매물 건수(all)와 일치하도록 보장합니다.
 */
export function matchesShowroomCategory(
  product: {
    category?: string | null;
    title?: string | null;
    description?: string | null;
    commercial_hint?: "showcase" | "bizFridge" | "kitchen" | null;
  },
  catItem: ShowroomCategoryItem
): boolean {
  if (catItem.key === "all") return true;
  if (normalizeProductCategory(product.category) !== catItem.filterCategory) {
    return false;
  }

  if (catItem.filterCategory === "업소용기기") {
    if (product.commercial_hint) {
      return catItem.key === product.commercial_hint;
    }
    const hay = `${product.title || ""} ${product.description || ""}`.toLowerCase();
    const isShowcase = hay.includes("쇼케이스");
    const isBizFridge =
      (hay.includes("냉장") || hay.includes("냉동")) && !isShowcase;

    if (catItem.key === "showcase") return isShowcase;
    if (catItem.key === "bizFridge") return isBizFridge;
    if (catItem.key === "kitchen") return !isShowcase && !isBizFridge;
  }

  if (catItem.filterKeyword) {
    const hay = `${product.title || ""} ${product.description || ""}`.toLowerCase();
    return hay.includes(catItem.filterKeyword.toLowerCase());
  }

  return true;
}

export const RAIL_DRAG_THRESHOLD_PX = 6;

export interface RailDragScrollInput {
  startX: number;
  currentX: number;
  startScrollLeft: number;
  maxScrollLeft: number;
  multiplier?: number;
}

export interface RailDragScrollResult {
  deltaX: number;
  isDragging: boolean;
  nextScrollLeft: number;
}

/**
 * 마우스 클릭-드래그 가로 이동량 계산 순수 함수
 * - 왼쪽으로 끌면(currentX < startX, deltaX < 0) scrollLeft가 증가해 오른쪽 품목이 노출됩니다.
 * - 미세 흔들림(RAIL_DRAG_THRESHOLD_PX 미만)은 일반 클릭으로 유지합니다.
 */
export function computeRailDragScroll({
  startX,
  currentX,
  startScrollLeft,
  maxScrollLeft,
  multiplier = 1.15,
}: RailDragScrollInput): RailDragScrollResult {
  const deltaX = currentX - startX;
  const isDragging = Math.abs(deltaX) >= RAIL_DRAG_THRESHOLD_PX;
  const clampedMax = Math.max(0, maxScrollLeft);

  if (!isDragging || clampedMax === 0) {
    return {
      deltaX,
      isDragging: false,
      nextScrollLeft: Math.min(clampedMax, Math.max(0, Math.round(startScrollLeft))),
    };
  }

  const rawScrollLeft = startScrollLeft - deltaX * multiplier;
  const nextScrollLeft = Math.min(clampedMax, Math.max(0, Math.round(rawScrollLeft)));

  return {
    deltaX,
    isDragging: true,
    nextScrollLeft,
  };
}

