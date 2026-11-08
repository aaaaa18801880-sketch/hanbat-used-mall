"use client";

import React, { useState } from "react";
import { Icon, ICON } from "../../lib/ui";

export interface CompartmentInfo {
  id: string;
  positionLabel: string;
  shortPos: string;
  role: "freezer" | "fridge" | "kimchi" | "custom";
  roleName: string;
  tempRange: string;
  recommendedItems: string[];
  features?: string;
}

export interface RefrigeratorLayoutData {
  type: "2door_vertical" | "4door_grid" | "kimchi_3tier" | "table_horizontal";
  title: string;
  subtitle: string;
  coolingType: "직냉식" | "간냉식" | "미지정";
  coolingDesc: string;
  capacity?: string | null;
  widthSpec?: string | null;
  compartments: CompartmentInfo[];
  hasMachineryRoom?: boolean;
}

export interface RefrigeratorCompartmentDiagramProps {
  title: string;
  description?: string | null;
  category?: string | null;
  className?: string;
}

function stripParens(text: string): string {
  return text.replace(/\s*\([^)]*\)/g, "").trim();
}

/**
 * 상품명(title)과 상세 설명(description)에서 냉장고 도어 구조 및 칸별 역할을 정확히 판별하는 헬퍼
 */
export function detectRefrigeratorLayout(
  title: string,
  description?: string | null,
  category?: string | null
): RefrigeratorLayoutData | null {
  const titleLower = (title ?? "").toLowerCase();
  const combined = `${title} ${description ?? ""}`.toLowerCase();

  // 1. 비(非)냉장 가전 및 주방기기 원천 차단 (가열·조리·세척·가공·배기·주방집기 등)
  // ※ 생선구이기, 가스그릴, 튀김기, 간택기, 식기세척기 등이 업소용기기 카테고리라는 이유로 냉장고로 오인되는 것을 방지
  const isNonFridgeAppliance =
    /구이기|그릴|튀김기|간택기|가스렌지|가스레인지|인덕션|하이라이트|버너|화구|온수기|보일러|식기세척기|세척기|소독기|밥솥|취사기|제면기|반죽기|육절기|슬라이서|믹서기|분쇄기|씽크대|싱크대|세정대|잔반통|다단선반|벽선반|상부선반|식판대|후드|닥트|환풍기|실링기|진공포장기|온장고|보온고/i.test(
      titleLower
    );

  if (isNonFridgeAppliance) {
    return null;
  }

  // 2. 냉장고와 무관한 카테고리 배제
  const isExcludedCategory =
    category === "세탁기/건조기" ||
    category === "에어컨/냉난방기" ||
    category === "TV/영상가전" ||
    category === "주방/생활가전" ||
    category === "배송인증";

  if (
    isExcludedCategory &&
    !titleLower.includes("냉장") &&
    !titleLower.includes("냉동")
  ) {
    return null;
  }

  // 3. 실제로 냉장/냉동/김치냉장고 관련 기기인지 엄격 검증
  // 주의: category === "업소용기기" 만으로 통과시키면 비냉장 업소용 기기가 통과하므로 절대 금지!
  const hasFridgeKeywordInTitle =
    titleLower.includes("냉장") ||
    titleLower.includes("냉동") ||
    titleLower.includes("쇼케이스") ||
    titleLower.includes("김치") ||
    titleLower.includes("찬밧드") ||
    titleLower.includes("반찬냉장") ||
    titleLower.includes("테이블냉장") ||
    titleLower.includes("작업대냉장") ||
    titleLower.includes("토핑냉장") ||
    /\b(25|30|45|65)\s*박스/.test(titleLower);

  const hasFridgeKeywordInCombined =
    combined.includes("냉장고") ||
    combined.includes("냉동고") ||
    combined.includes("쇼케이스") ||
    combined.includes("찬밧드") ||
    combined.includes("김치냉장고") ||
    /\b(25|30|45|65)\s*박스/.test(combined) ||
    /\b(cwsm|cwt|wst|rtar|rtf|rtr|rt-)\b/i.test(combined);

  if (!hasFridgeKeywordInTitle && !hasFridgeKeywordInCombined) {
    return null;
  }

  let coolingType: "직냉식" | "간냉식" | "미지정" = "미지정";
  let coolingDesc =
    "정밀 온도 제어 시스템으로 식자재 적정 보관 온도를 일정하게 유지합니다.";
  if (combined.includes("직냉")) {
    coolingType = "직냉식";
    coolingDesc =
      "내벽 냉각 파이프 직접 냉각 방식으로 식자재 수분 증발을 억제하며 신선도를 오래 유지합니다 (주기적 성에 제상 관리 권장).";
  } else if (
    combined.includes("간냉") ||
    combined.includes("노프로스트") ||
    combined.includes("간접냉각")
  ) {
    coolingType = "간냉식";
    coolingDesc =
      "팬 강제 대류 순환 방식으로 성에가 끼지 않아 위생적이고 관리가 편리한 간접 냉각 시스템입니다.";
  }

  // 용량(박스 / 리터 - 1,060L 등 콤마 포함 숫자 정확히 인식) 및 가로폭 규격 추출
  const boxMatch = combined.match(/\b(25|30|45|65)\s*박스/);
  const literMatch = combined.match(
    /(?:^|[^\d,])(\d{1,2},\d{3}|\d{2,4})\s*(?:l|리터)\b/i
  );
  const tableWidthMatch = combined.match(
    /\b(900|1200|1500|1800|2100|2400)\b/
  );

  const capacityStr = boxMatch
    ? `${boxMatch[1]}박스`
    : literMatch
    ? `${literMatch[1]}L`
    : null;

  // 테이블/작업대/찬밧드 제품이거나 모델명에 폭이 명시된 경우에만 폭 규격 사용 (스탠드 25/30/45박스에 엉뚱한 900mm 배지 부착 방지)
  const isTableExplicit =
    titleLower.includes("테이블") ||
    titleLower.includes("작업대") ||
    titleLower.includes("찬밧드") ||
    titleLower.includes("반찬") ||
    titleLower.includes("밧드") ||
    titleLower.includes("토핑") ||
    titleLower.includes("김밥") ||
    titleLower.includes("피자") ||
    combined.includes("테이블 냉장고") ||
    combined.includes("작업대 냉장고") ||
    combined.includes("찬밧드 냉장고") ||
    combined.includes("반찬 냉장고") ||
    /\b(cwsm|cwt|wst|rtar|rtf|rtr|rt-)\b/i.test(combined);

  const widthSpecStr =
    tableWidthMatch && isTableExplicit ? `폭 ${tableWidthMatch[1]}mm` : null;

  // 1. 스탠드형 김치냉장고 판별
  const isKimchiStand =
    titleLower.includes("김치냉장고") ||
    (titleLower.includes("김치") &&
      (combined.includes("스탠드") ||
        combined.includes("3단") ||
        combined.includes("3룸")));

  if (isKimchiStand) {
    return {
      type: "kimchi_3tier",
      title: "스탠드 3단 독립 냉각 구조도",
      subtitle: "상칸(도어) · 중칸/하칸(서랍식) 독립 정온 제어",
      coolingType,
      coolingDesc:
        coolingType === "미지정"
          ? "룸별 독립 냉각 기술로 김치와 식자재 고유의 풍미를 보존합니다."
          : coolingDesc,
      capacity: capacityStr,
      widthSpec: widthSpecStr,
      compartments: [
        {
          id: "tier_top",
          positionLabel: "상칸 (스윙 도어)",
          shortPos: "상칸 도어",
          role: "fridge",
          roleName: "다목적 신선·김치실",
          tempRange: "-1℃ ~ +3℃",
          recommendedItems: ["보관 김치", "신선 채소·과일", "주류·음료"],
          features: "자주 꺼내는 식자재와 밀폐 김치통 수납에 최적화된 상부 공간입니다.",
        },
        {
          id: "tier_mid",
          positionLabel: "중칸 (슬라이드 서랍)",
          shortPos: "중칸 서랍",
          role: "kimchi",
          roleName: "정온 김치·육류 숙성실",
          tempRange: "-1.5℃ ~ -0.5℃",
          recommendedItems: ["포기김치", "육류 숙성", "생선류"],
          features: "냉기 유출을 막는 밀폐 서랍 구조로 온도 편차를 최소화한 핵심 구역입니다.",
        },
        {
          id: "tier_bot",
          positionLabel: "하칸 (슬라이드 서랍)",
          shortPos: "하칸 서랍",
          role: "custom",
          roleName: "장기 보관 전문 서랍",
          tempRange: "-2℃ ~ +2℃",
          recommendedItems: ["묵은지", "쌀·잡곡", "뿌리채소"],
          features: "무거운 김치통이나 곡류·채소를 장기간 신선하게 보관하는 하부 서랍입니다.",
        },
      ],
    };
  }

  // 2. 4도어 (4칸 2x2 그리드) 판별
  const is4Door =
    combined.includes("45박스") ||
    combined.includes("4도어") ||
    combined.includes("4문") ||
    combined.includes("포도어") ||
    combined.includes("4칸");

  if (is4Door) {
    const isAllFreeze =
      combined.includes("올냉동") ||
      combined.includes("전칸 냉동") ||
      combined.includes("4칸 전체 냉동");
    const isAllFridge =
      combined.includes("올냉장") ||
      combined.includes("전칸 냉장") ||
      combined.includes("4칸 전체 냉장") ||
      combined.includes("전체 냉장실");

    // 2냉동 2냉장 (반반형) 정밀 판별: "2냉동 2냉장", "냉동 2칸", "냉동2칸", "2RF", "2R2F" 등 모두 인식
    const isHalfAndHalf =
      combined.includes("2냉동") ||
      combined.includes("냉동 2칸") ||
      combined.includes("냉동2칸") ||
      combined.includes("반반") ||
      combined.includes("2칸 냉동") ||
      combined.includes("상2칸") ||
      combined.includes("하2칸") ||
      /\b\d*2r2f\b/i.test(combined);

    if (isAllFreeze) {
      return {
        type: "4door_grid",
        title: "업소용 4도어 전칸 올냉동 구조도",
        subtitle: "4개 도어 전체 급속 냉동 특화 구성",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "45박스 규격",
        compartments: [
          {
            id: "tl",
            positionLabel: "상단 좌측 도어",
            shortPos: "상단 좌측",
            role: "freezer",
            roleName: "급속 냉동 1실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["소포장 육류", "가공 냉동식품"],
            features: "자주 사용하는 주력 냉동 식자재를 눈높이에서 신속하게 인출",
          },
          {
            id: "tr",
            positionLabel: "상단 우측 도어",
            shortPos: "상단 우측",
            role: "freezer",
            roleName: "급속 냉동 2실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["급랭 생선류", "해산물 식재료"],
            features: "어패류 및 해산물을 타 식자재와 냄새 섞임 없이 분리 냉동",
          },
          {
            id: "bl",
            positionLabel: "하단 좌측 도어",
            shortPos: "하단 좌측",
            role: "freezer",
            roleName: "대용량 냉동 3실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["대용량 박스 육류", "비축 식자재"],
            features: "부피가 큰 냉동 육류 박스 및 장기 비축용 식자재 보관",
          },
          {
            id: "br",
            positionLabel: "하단 우측 도어",
            shortPos: "하단 우측",
            role: "freezer",
            roleName: "대용량 냉동 4실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["냉동 완제품", "업소용 대용량 식자재"],
            features: "넉넉한 하부 선반 공간으로 대용량 냉동 공산품 비축에 적합",
          },
        ],
      };
    }

    if (isAllFridge) {
      return {
        type: "4door_grid",
        title: "업소용 4도어 전칸 올냉장 구조도",
        subtitle: "4개 도어 전체 신선 냉장 특화 구성",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "45박스 규격",
        compartments: [
          {
            id: "tl",
            positionLabel: "상단 좌측 도어",
            shortPos: "상단 좌측",
            role: "fridge",
            roleName: "신선 냉장 1실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["당일 손질 채소", "주방 조리 소스"],
            features: "조리 동선에서 가장 빠르게 꺼내 쓰는 핵심 냉장 식자재 구역",
          },
          {
            id: "tr",
            positionLabel: "상단 우측 도어",
            shortPos: "상단 우측",
            role: "fridge",
            roleName: "신선 냉장 2실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["유제품", "계란", "단기 신선 식자재"],
            features: "눈높이 선반 배치로 소분 용기 및 데일리 식재료 수납에 최적화",
          },
          {
            id: "bl",
            positionLabel: "하단 좌측 도어",
            shortPos: "하단 좌측",
            role: "fridge",
            roleName: "대용량 냉장 3실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["대용량 반찬통", "김치 및 절임류"],
            features: "무거운 대형 스텐 반찬통과 김치통을 안정적으로 적재",
          },
          {
            id: "br",
            positionLabel: "하단 우측 도어",
            shortPos: "하단 우측",
            role: "fridge",
            roleName: "대용량 냉장 4실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["육수통", "음료 박스", "가공 부재료"],
            features: "대형 육수통이나 음료 박스를 넉넉하게 수납하는 하부 냉장 구역",
          },
        ],
      };
    }

    if (isHalfAndHalf) {
      // 상하 분할(가정용 4도어 등 상냉장 하냉동) vs 좌우 수직 분할(업소용 45박스 표준 좌2칸 냉동 / 우2칸 냉장) 구분
      const isHorizontalSplit =
        combined.includes("상냉장") ||
        combined.includes("하냉동") ||
        combined.includes("상단 2칸") ||
        combined.includes("하단 2칸");

      if (isHorizontalSplit) {
        return {
          type: "4door_grid",
          title: "4도어 상냉장 · 하냉동 구조도 (냉장 2칸 / 냉동 2칸)",
          subtitle: "상단 2도어 와이드 신선 냉장 + 하단 2도어 분리형 급속 냉동",
          coolingType,
          coolingDesc,
          capacity: capacityStr,
          widthSpec: widthSpecStr,
          compartments: [
            {
              id: "tl",
              positionLabel: "상단 좌측 도어 (냉장)",
              shortPos: "상단 좌측",
              role: "fridge",
              roleName: "신선 냉장실",
              tempRange: "0℃ ~ +7℃",
              recommendedItems: ["채소·과일", "손질 식재료", "소스류"],
              features: "허리를 숙이지 않고 자주 꺼내는 상부 좌측 신선 냉장 구역입니다.",
            },
            {
              id: "tr",
              positionLabel: "상단 우측 도어 (냉장)",
              shortPos: "상단 우측",
              role: "fridge",
              roleName: "신선 냉장실",
              tempRange: "0℃ ~ +7℃",
              recommendedItems: ["데일리 반찬", "유제품", "음료"],
              features: "자주 여닫는 일상 반찬과 음료를 편리하게 수납하는 상부 우측 구역입니다.",
            },
            {
              id: "bl",
              positionLabel: "하단 좌측 도어 (냉동)",
              shortPos: "하단 좌측",
              role: "freezer",
              roleName: "급속 냉동실",
              tempRange: "-15℃ ~ -24℃",
              recommendedItems: ["육류 비축", "해산물 냉동"],
              features: "안정적인 영하 온도를 유지하는 하부 좌측 집중 냉동 구역입니다.",
            },
            {
              id: "br",
              positionLabel: "하단 우측 도어 (냉동)",
              shortPos: "하단 우측",
              role: "freezer",
              roleName: "급속 냉동실",
              tempRange: "-15℃ ~ -24℃",
              recommendedItems: ["가공 냉동식품", "얼음·장기보관품"],
              features: "부피가 큰 냉동 완제품과 식자재를 분리 보관하는 하부 우측 구역입니다.",
            },
          ],
        };
      }

      // 업소용 45박스 수직 분할 2냉동 2냉장 (좌측 상·하 2칸 냉동 / 우측 상·하 2칸 냉장)
      return {
        type: "4door_grid",
        title: "업소용 4도어 수직 분할 구조도 (냉동 2칸 / 냉장 2칸)",
        subtitle: "좌측 상·하단 2도어 급속 냉동 + 우측 상·하단 2도어 신선 냉장",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "45박스",
        widthSpec: widthSpecStr,
        compartments: [
          {
            id: "tl",
            positionLabel: "상단 좌측 도어 (냉동)",
            shortPos: "상단 좌측",
            role: "freezer",
            roleName: "급속 냉동실 (상좌)",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["소포장 육류", "생선·해산물", "주요 냉동재"],
            features: "자주 꺼내는 핵심 냉동 식자재를 눈높이에서 빠르게 인출하는 상부 냉동실입니다.",
          },
          {
            id: "tr",
            positionLabel: "상단 우측 도어 (냉장)",
            shortPos: "상단 우측",
            role: "fridge",
            roleName: "신선 냉장실 (상우)",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["당일 손질 채소", "조리 소스", "유제품"],
            features: "조리 중 가장 손이 잘 닿는 우측 상단 데일리 신선 냉장실입니다.",
          },
          {
            id: "bl",
            positionLabel: "하단 좌측 도어 (냉동)",
            shortPos: "하단 좌측",
            role: "freezer",
            roleName: "대용량 냉동실 (하좌)",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["대용량 육류 박스", "비축 냉동품", "육수 냉동"],
            features: "좌측 독립 냉동 라인 하단부로 무거운 대용량 냉동 식자재를 안정적으로 비축합니다.",
          },
          {
            id: "br",
            positionLabel: "하단 우측 도어 (냉장)",
            shortPos: "하단 우측",
            role: "fridge",
            roleName: "대용량 냉장실 (하우)",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["대형 반찬통", "김치통", "음료·육수통"],
            features: "우측 독립 냉장 라인 하단부로 대형 반찬 용기와 식재료를 넉넉히 수납합니다.",
          },
        ],
      };
    }

    return {
      type: "4door_grid",
      title: "업소용 4도어 구조도 (냉동 1칸 / 냉장 3칸)",
      subtitle: "상단 좌측 급속 냉동 1칸 + 나머지 3칸 대용량 신선 냉장",
      coolingType,
      coolingDesc,
      capacity: capacityStr ?? "45박스 규격",
      compartments: [
        {
          id: "tl",
          positionLabel: "상단 좌측 도어 (냉동 1칸)",
          shortPos: "상단 좌측",
          role: "freezer",
          roleName: "급속 냉동실",
          tempRange: "-15℃ ~ -24℃",
          recommendedItems: ["육류", "생선", "소포장 냉동식자재"],
          features: "자주 꺼내는 핵심 냉동 품목을 눈높이에서 신속하게 인출합니다.",
        },
        {
          id: "tr",
          positionLabel: "상단 우측 도어 (냉장)",
          shortPos: "상단 우측",
          role: "fridge",
          roleName: "신선 냉장실",
          tempRange: "0℃ ~ +7℃",
          recommendedItems: ["당일 손질 채소", "주방 조리 소스"],
          features: "조리 시 가장 손이 잘 닿는 눈높이 메인 신선 냉장 구역입니다.",
        },
        {
          id: "bl",
          positionLabel: "하단 좌측 도어 (냉장)",
          shortPos: "하단 좌측",
          role: "fridge",
          roleName: "대용량 냉장실",
          tempRange: "0℃ ~ +7℃",
          recommendedItems: ["대용량 반찬통", "김치 및 절임류"],
          features: "무거운 대형 용기 및 대량 식자재를 안정적으로 보관합니다.",
        },
        {
          id: "br",
          positionLabel: "하단 우측 도어 (냉장)",
          shortPos: "하단 우측",
          role: "fridge",
          roleName: "대용량 냉장실",
          tempRange: "0℃ ~ +7℃",
          recommendedItems: ["주류", "음료 박스", "가공 부재료"],
          features: "넉넉한 수납 공간으로 음료 및 식재료 박스를 비축합니다.",
        },
      ],
    };
  }

  // 3. 스탠드형 상/하 2도어 (25박스, 30박스 및 상하 분할) 판별
  // ※ 핵심 invariant: 25박스, 30박스는 업소용 수직 2도어의 표준이므로 테이블 냉장고보다 반드시 먼저 판별!
  const isBox2Door =
    combined.includes("25박스") ||
    combined.includes("30박스");

  const isVertical2DoorExplicit =
    combined.includes("상단 냉동") ||
    combined.includes("하단 냉장") ||
    combined.includes("상단 냉장") ||
    combined.includes("하단 냉동") ||
    combined.includes("상냉동") ||
    combined.includes("하냉장") ||
    combined.includes("상냉장") ||
    combined.includes("상/하") ||
    combined.includes("상하") ||
    combined.includes("상·하");

  const is2DoorGeneral =
    !isTableExplicit &&
    !combined.includes("양문") &&
    (combined.includes("2도어") ||
      combined.includes("2문") ||
      combined.includes("투도어") ||
      combined.includes("냉장냉동고"));

  const is2DoorVertical = isBox2Door || isVertical2DoorExplicit || is2DoorGeneral;

  if (is2DoorVertical) {
    const isTopFridgeBottomFreeze =
      (combined.includes("상냉장") && combined.includes("하냉동")) ||
      combined.includes("상단 냉장 / 하단 냉동") ||
      combined.includes("상단 냉장 1칸 / 하단 냉동 1칸") ||
      combined.includes("상단 냉장") ||
      combined.includes("상냉장");

    const isAllFreeze =
      combined.includes("올냉동") ||
      combined.includes("2도어 올냉동") ||
      combined.includes("전칸 냉동") ||
      combined.includes("2칸 전체 냉동");

    const isAllFridge =
      combined.includes("올냉장") ||
      combined.includes("2도어 올냉장") ||
      combined.includes("전칸 냉장") ||
      combined.includes("2칸 전체 냉장") ||
      combined.includes("전체 냉장실");

    if (isAllFreeze) {
      return {
        type: "2door_vertical",
        title: isBox2Door
          ? `업소용 ${boxMatch?.[1] ?? "25/30"}박스 2도어 전칸 올냉동 구조도`
          : "업소용 2도어 전칸 올냉동 구조도",
        subtitle: "상·하 2칸 전체 급속 냉동 특화 구성",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "25/30박스",
        widthSpec: null,
        compartments: [
          {
            id: "top",
            positionLabel: "상단 도어 (냉동 1칸)",
            shortPos: "상단 도어",
            role: "freezer",
            roleName: "급속 냉동실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["자주 꺼내는 냉동 식자재", "육류", "가공식품"],
            features: "눈높이 상부 도어로 주력 냉동 식자재를 빠르게 수납·인출합니다.",
          },
          {
            id: "bot",
            positionLabel: "하단 도어 (냉동 1칸)",
            shortPos: "하단 도어",
            role: "freezer",
            roleName: "대용량 냉동실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["장기 보관 냉동육", "비축 식자재", "해산물"],
            features: "부피가 큰 냉동 박스와 비축용 식자재를 안정적으로 보관합니다.",
          },
        ],
      };
    }

    if (isAllFridge) {
      return {
        type: "2door_vertical",
        title: isBox2Door
          ? `업소용 ${boxMatch?.[1] ?? "30"}박스 2도어 전칸 올냉장 구조도`
          : "업소용 2도어 전칸 올냉장 구조도",
        subtitle: "상·하 2칸 전체 신선 냉장 특화 구성",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "25/30박스",
        widthSpec: null,
        compartments: [
          {
            id: "top",
            positionLabel: "상단 도어 (냉장 1칸)",
            shortPos: "상단 도어",
            role: "fridge",
            roleName: "신선 냉장실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["당일 손질 채소", "주방 양념·소스", "유제품"],
            features: "조리 중 가장 손이 잘 닿는 상부 데일리 신선 냉장 구역입니다.",
          },
          {
            id: "bot",
            positionLabel: "하단 도어 (냉장 1칸)",
            shortPos: "하단 도어",
            role: "fridge",
            roleName: "대용량 냉장실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["대형 반찬통", "김치통", "주류·음료"],
            features: "무거운 반찬 용기와 음료 박스를 넉넉하게 수납하는 하부 냉장실입니다.",
          },
        ],
      };
    }

    if (isTopFridgeBottomFreeze) {
      return {
        type: "2door_vertical",
        title: "2도어 독립 냉각 구조도 (상냉장 / 하냉동)",
        subtitle: "상단 인체공학적 신선 냉장 + 하단 대용량 급속 냉동",
        coolingType,
        coolingDesc,
        capacity: capacityStr,
        widthSpec: null,
        compartments: [
          {
            id: "top",
            positionLabel: "상단 도어 (냉장)",
            shortPos: "상단 도어",
            role: "fridge",
            roleName: "신선 냉장실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["자주 꺼내는 반찬", "채소·과일", "음료·유제품"],
            features: "허리를 숙이지 않고 편안하게 수납하는 데일리 냉장 구역입니다.",
          },
          {
            id: "bot",
            positionLabel: "하단 도어 (냉동)",
            shortPos: "하단 도어",
            role: "freezer",
            roleName: "급속 냉동실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["장기 보관 냉동육", "생선류", "냉동 간편식"],
            features: "냉기 유출이 적고 깊이감이 뛰어난 대용량 냉동 보관 구역입니다.",
          },
        ],
      };
    }

    // 기본 업소용 25박스/30박스 표준: 상단 냉동 1칸 / 하단 냉장 1칸
    return {
      type: "2door_vertical",
      title: isBox2Door
        ? `업소용 ${boxMatch?.[1] ?? "25"}박스 2도어 구조도 (상단 냉동 / 하단 냉장)`
        : "업소용 2도어 구조도 (상단 냉동 / 하단 냉장)",
      subtitle: "상단 급속 냉동실(1도어) + 하단 신선 냉장실(1도어) 수직 분할",
      coolingType,
      coolingDesc,
      capacity: capacityStr ?? "25박스",
      widthSpec: null,
      compartments: [
        {
          id: "top",
          positionLabel: "상단 도어 (냉동 1칸)",
          shortPos: "상단 도어",
          role: "freezer",
          roleName: "급속 냉동실",
          tempRange: "-15℃ ~ -24℃",
          recommendedItems: ["육류", "생선", "소포장 냉동 식자재", "얼음"],
          features: "직냉식 급속 파이프로 강력한 동결 온도를 유지하는 상단 냉동실입니다.",
        },
        {
          id: "bot",
          positionLabel: "하단 도어 (냉장 1칸)",
          shortPos: "하단 도어",
          role: "fridge",
          roleName: "신선 냉장실",
          tempRange: "0℃ ~ +7℃",
          recommendedItems: ["손질 채소", "식당용 반찬통", "소스류", "음료·주류"],
          features: "깊고 넓은 다단 선반 구조로 대형 식재료를 신선하게 보관합니다.",
        },
      ],
    };
  }

  // 4. 가로형 테이블 냉장고 / 찬밧드·반찬·토핑 냉장고 및 양문형 냉장고 (좌우 수평 2도어) 판별
  // 주의: 스탠드 박스형(25/30/45박스)이 아닌 실제 테이블/작업대/찬밧드 형태일 때만 진입!
  const isBanchanTopping =
    titleLower.includes("반찬") ||
    titleLower.includes("밧드") ||
    titleLower.includes("찬밧드") ||
    titleLower.includes("토핑") ||
    titleLower.includes("김밥") ||
    titleLower.includes("피자") ||
    titleLower.includes("샌드위치") ||
    combined.includes("찬밧드 냉장고") ||
    combined.includes("반찬 냉장고");

  const isTableFridge =
    isBanchanTopping ||
    isTableExplicit ||
    Boolean(
      tableWidthMatch &&
        (combined.includes("테이블") || combined.includes("작업대"))
    );

  const isSideBySide =
    combined.includes("양문") ||
    combined.includes("좌냉동") ||
    combined.includes("우냉장");

  if (isTableFridge || isSideBySide) {
    const isAllFreeze =
      combined.includes("올냉동") || combined.includes("전칸 냉동");
    const isHalfAndHalf =
      combined.includes("반반") ||
      combined.includes("1냉동 1냉장") ||
      combined.includes("냉동 1칸 / 냉장 1칸") ||
      (titleLower.includes("냉동") && titleLower.includes("냉장")) ||
      isSideBySide;

    if (isAllFreeze && !isHalfAndHalf) {
      return {
        type: "table_horizontal",
        hasMachineryRoom: !isSideBySide,
        title: isBanchanTopping
          ? "업소용 2도어 찬밧드 올냉동 구조도"
          : isTableFridge
          ? "업소용 2도어 테이블 올냉동 구조도"
          : "양문형 2도어 전칸 올냉동 구조도",
        subtitle: "좌·우 2도어 전체 급속 냉동 구성 (수평 배치)",
        coolingType,
        coolingDesc,
        capacity: capacityStr,
        widthSpec: widthSpecStr ?? (isTableFridge ? "테이블형" : null),
        compartments: [
          {
            id: "left",
            positionLabel: "좌측 도어 (1칸)",
            shortPos: "좌측 도어",
            role: "freezer",
            roleName: "급속 냉동실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["손질 육류", "급랭 해산물", "냉동 식재료"],
            features: "독립 급속 냉동 도어로 신속한 식자재 인출을 지원합니다.",
          },
          {
            id: "right",
            positionLabel: "우측 도어 (1칸)",
            shortPos: "우측 도어",
            role: "freezer",
            roleName: "대용량 냉동실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: [
              "대용량 비축 냉동육",
              "냉동 완제품",
              "박스 식자재",
            ],
            features: "넓은 내부 선반으로 대용량 냉동 품목을 안전하게 비축합니다.",
          },
        ],
      };
    }

    if (
      isHalfAndHalf &&
      !combined.includes("올냉장") &&
      !combined.includes("전칸 냉장") &&
      !combined.includes("전체 냉장실")
    ) {
      return {
        type: "table_horizontal",
        hasMachineryRoom: !isSideBySide,
        title: isBanchanTopping
          ? "업소용 찬밧드 2도어 구조도 (좌냉동 / 우냉장)"
          : isTableFridge
          ? "업소용 테이블 2도어 구조도 (좌냉동 / 우냉장)"
          : "양문형 2도어 구조도 (좌냉동 / 우냉장)",
        subtitle: "좌측 급속 냉동 1도어 + 우측 신선 냉장 1도어 수평 분할",
        coolingType,
        coolingDesc,
        capacity: capacityStr,
        widthSpec: widthSpecStr ?? (isTableFridge ? "테이블형" : null),
        compartments: [
          {
            id: "left",
            positionLabel: "좌측 도어 (냉동)",
            shortPos: "좌측 도어",
            role: "freezer",
            roleName: "급속 냉동실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["육류·생선", "소포장 냉동식자재", "얼음"],
            features:
              "좌측 독립 구역으로 냉기 손실 없이 신속하게 인출하는 급속 냉동실입니다.",
          },
          {
            id: "right",
            positionLabel: "우측 도어 (냉장)",
            shortPos: "우측 도어",
            role: "fridge",
            roleName: "신선 냉장실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: [
              "데일리 반찬",
              "당일 손질 채소",
              "주방 소스류",
              "음료",
            ],
            features:
              "자주 여닫는 작업 동선에 맞춘 대용량 와이드 신선 냉장실입니다.",
          },
        ],
      };
    }

    return {
      type: "table_horizontal",
      hasMachineryRoom: !isSideBySide,
      title: isBanchanTopping
        ? "업소용 2도어 찬밧드 반찬 냉장고 구조도"
        : isTableFridge
        ? "업소용 2도어 테이블 올냉장 구조도"
        : "양문형 2도어 전칸 올냉장 구조도",
      subtitle: isBanchanTopping
        ? "좌·우 2도어 전체 신선 냉장 구성 (상단 찬밧드 + 작업대 일체형)"
        : "좌·우 2도어 전체 신선 냉장 구성 (상판 스텐 조리 작업대 일체형)",
      coolingType,
      coolingDesc,
      capacity: capacityStr,
      widthSpec: widthSpecStr ?? (isTableFridge ? "테이블형" : null),
      compartments: [
        {
          id: "left",
          positionLabel: "좌측 도어 (냉장 1칸)",
          shortPos: "좌측 도어",
          role: "fridge",
          roleName: "신선 냉장실",
          tempRange: "0℃ ~ +7℃",
          recommendedItems: isBanchanTopping
            ? ["배식용 소분 반찬", "당일 손질 채소", "주방 양념·소스"]
            : ["당일 손질 채소", "주방 양념·소스", "유제품"],
          features: isBanchanTopping
            ? "상단 찬밧드 구획과 연계되어 신속한 서빙 및 데일리 식재료 인출을 지원합니다."
            : "상판 스텐 조리 작업대 바로 아래 위치해 조리 중 즉각적인 식재료 인출을 지원합니다.",
        },
        {
          id: "right",
          positionLabel: "우측 도어 (냉장 1칸)",
          shortPos: "우측 도어",
          role: "fridge",
          roleName: "대용량 냉장실",
          tempRange: "0℃ ~ +7℃",
          recommendedItems: ["대형 반찬통", "김치·절임류", "음료·주류"],
          features:
            "넓은 내부 선반 구조로 부피가 큰 반찬 용기와 식자재를 넉넉하게 수납합니다.",
        },
      ],
    };
  }



  return null;
}

export function RefrigeratorCompartmentDiagram({
  title,
  description,
  category,
  className = "",
}: RefrigeratorCompartmentDiagramProps) {
  const layout = detectRefrigeratorLayout(title, description, category);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!layout) {
    return null;
  }

  const activeCompartment =
    layout.compartments.find((c) => c.id === selectedId) ??
    layout.compartments[0];

  const isTable = layout.type === "table_horizontal";
  const isBanchan =
    isTable &&
    (layout.title.includes("찬밧드") ||
      layout.title.includes("반찬") ||
      layout.subtitle.includes("찬밧드"));

  return (
    <section
      aria-label="도어별 구조 및 칸별 역할 안내"
      className={`rounded-2xl border border-[#E2E6EC] bg-white p-5 sm:p-7 shadow-2xs ${className}`.trim()}
    >
      {/* 1. 상단 섹션 안내 헤더 */}
      <div className="flex flex-wrap items-end justify-between gap-2 pb-4 border-b border-[#E2E6EC]">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-hb-xs font-bold text-[#E8521A]">
              도어 구획 및 온도 안내
            </span>
            {layout.widthSpec && (
              <span className="rounded-md bg-[#F1F3F6] px-2 py-0.5 font-mono text-hb-xs font-bold text-[#141A23] tabular-nums">
                {layout.widthSpec}
              </span>
            )}
            {layout.capacity && (
              <span className="rounded-md bg-[#F1F3F6] px-2 py-0.5 font-mono text-hb-xs font-bold text-[#141A23] tabular-nums">
                {layout.capacity}
              </span>
            )}
            {layout.coolingType !== "미지정" && (
              <span
                className={`rounded-md px-2 py-0.5 text-hb-xs font-bold ${
                  layout.coolingType === "직냉식"
                    ? "bg-[#FFF4EE] text-[#E8521A] border border-[#FADCD0]"
                    : "bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]"
                }`}
              >
                {layout.coolingType}
              </span>
            )}
          </div>
          <h2 className="mt-1 text-hb-lg sm:text-hb-xl font-bold tracking-[-0.02em] text-[#141A23] break-keep">
            {layout.title}
          </h2>
        </div>
        <p className="text-hb-xs text-[#64748B]">{layout.subtitle}</p>
      </div>

      {/* 2. 하드웨어 캐비닛 모형 (Physical Appliance Blueprint) */}
      <div className="mt-4">
        {/* 본체 외곽 메탈 섀시 (Chassis) */}
        <div className="rounded-2xl border-2 border-[#CBD2DC] bg-[#E2E6EC] p-2 sm:p-3 shadow-card">
          {/* 상단 1: 세로형/4도어/김치냉장고일 때 다크 네이비 기계실 헤더 바 */}
          {!isTable && (
            <div className="rounded-t-xl bg-[#141A23] px-3.5 py-2.5 mb-1.5 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#334155] text-white">
              {/* 좌측: 기계실 루버 통풍구 그래픽 & 스펙 */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="hidden xs:flex flex-col gap-0.5 shrink-0" aria-hidden="true">
                  <span className="h-0.5 w-6 sm:w-8 rounded-full bg-[#475569]" />
                  <span className="h-0.5 w-6 sm:w-8 rounded-full bg-[#475569]" />
                  <span className="h-0.5 w-6 sm:w-8 rounded-full bg-[#475569]" />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-hb-xs font-bold tracking-wider text-white/90">
                    HANBAT CONTROL
                  </span>
                  {layout.capacity && (
                    <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-hb-xs font-bold text-[#E2E6EC] tabular-nums">
                      {layout.capacity}
                    </span>
                  )}
                  {layout.coolingType !== "미지정" && (
                    <span
                      className={`rounded px-2 py-0.5 text-hb-xs font-bold ${
                        layout.coolingType === "직냉식"
                          ? "bg-[#FFF4EE]/20 text-[#FF8A50] border border-[#FF8A50]/40"
                          : "bg-[#F0FDFA]/20 text-[#2DD4BF] border border-[#2DD4BF]/40"
                      }`}
                    >
                      {layout.coolingType}
                    </span>
                  )}
                </div>
              </div>

              {/* 우측: 디지털 LED 온도 디스플레이 */}
              <div className="flex items-center gap-2 rounded-lg bg-[#0E131B] border border-white/15 px-3 py-1 font-mono tabular-nums shadow-inner shrink-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full transition-colors duration-150 ${
                      activeCompartment.role === "freezer"
                        ? "bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]"
                        : activeCompartment.role === "fridge"
                        ? "bg-[#2DD4BF] shadow-[0_0_8px_#2DD4BF]"
                        : "bg-[#FF8A50] shadow-[0_0_8px_#FF8A50]"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-hb-xs font-bold tracking-wider text-white/60">
                    {activeCompartment.shortPos}
                  </span>
                </div>
                <span
                  className={`text-hb-sm sm:text-hb-base font-bold ${
                    activeCompartment.role === "freezer"
                      ? "text-[#38BDF8]"
                      : activeCompartment.role === "fridge"
                      ? "text-[#2DD4BF]"
                      : "text-[#FF8A50]"
                  }`}
                >
                  {activeCompartment.tempRange}
                </span>
              </div>
            </div>
          )}

          {/* 상단 2: 테이블 냉장고 / 찬밧드 냉장고일 때 상판 스테인리스 작업대 오버행 */}
          {isTable && (
            <div className="rounded-t-xl border-2 border-[#94A3B8] bg-gradient-to-b from-white via-[#F1F3F6] to-[#E2E6EC] p-2.5 sm:p-3 mb-1.5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 text-hb-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#141A23]">
                  <span className="h-2 w-2 rounded-full bg-[#0D9488]" />
                  <span>
                    {isBanchan
                      ? "상단 스텐 찬밧드(GN팬) 수납대 + 조리대"
                      : "상판 스테인리스 조리 작업대 (WORKTOP)"}
                  </span>
                </div>
                <span className="font-mono font-bold text-[#64748B] tabular-nums">
                  {[layout.widthSpec, layout.capacity, layout.coolingType !== "미지정" ? layout.coolingType : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>

              {isBanchan && (
                <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-1.5" aria-hidden="true">
                  {["1/3 밧드", "1/3 밧드", "1/3 밧드", "1/3 밧드", "1/3 밧드", "1/3 밧드"].slice(0, 4).map((pan, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-[#CBD2DC] bg-white py-1 px-1.5 text-center text-hb-xs font-mono font-semibold text-[#64748B] shadow-2xs"
                    >
                      {pan}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 도어 캐비닛 그리드 래퍼 (실제 고무 패킹 유격 홈: 다크 슬레이트 프레임 bg-[#334155]) */}
          <div className="rounded-xl bg-[#334155] p-1 sm:p-1.5">
            {/* Case A: 가로형 테이블 냉장고 / 양문형 (수평 배치 + 상단 가로 매립 손잡이) */}
            {layout.type === "table_horizontal" && (
              <div
                className={`grid gap-1 sm:gap-1.5 ${
                  layout.hasMachineryRoom
                    ? "grid-cols-1 sm:grid-cols-12"
                    : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                <div
                  className={`${
                    layout.hasMachineryRoom ? "sm:col-span-9" : "sm:col-span-2"
                  } grid grid-cols-2 gap-1 sm:gap-1.5`}
                >
                  {layout.compartments.map((comp) => {
                    const isSelected = comp.id === activeCompartment.id;
                    const isFreeze = comp.role === "freezer";

                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => setSelectedId(comp.id)}
                        className={`group relative flex flex-col justify-between rounded-lg p-3 sm:p-3.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? "bg-[#141A23] text-white shadow-card ring-2 ring-[#E8521A] border-transparent"
                            : "border border-[#CBD2DC] bg-gradient-to-br from-white via-[#F8FAFC] to-[#F1F3F6] hover:from-white hover:to-white text-[#141A23]"
                        }`}
                      >
                        {/* 도어 상단 매립형 가로 손잡이 홈 */}
                        <div
                          className={`h-1.5 w-14 sm:w-16 rounded-full mx-auto mb-2 transition-colors duration-150 ${
                            isSelected
                              ? "bg-[#E8521A]"
                              : "bg-[#CBD2DC] group-hover:bg-[#94A3B8]"
                          }`}
                          aria-hidden="true"
                        />

                        <div className="flex items-center justify-between gap-1.5 w-full">
                          <span
                            className={`text-hb-xs font-bold ${
                              isSelected ? "text-white/80" : "text-[#64748B]"
                            }`}
                          >
                            {comp.shortPos}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-hb-xs font-bold leading-none ${
                              isSelected
                                ? isFreeze
                                  ? "bg-[#0284C7] text-white"
                                  : "bg-[#0D9488] text-white"
                                : isFreeze
                                ? "bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD]"
                                : "bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]"
                            }`}
                          >
                            {isFreeze ? "냉동" : "냉장"}
                          </span>
                        </div>

                        <div className="my-2 flex flex-wrap items-baseline justify-between gap-1">
                          <strong
                            className={`text-hb-base font-bold tracking-tight ${
                              isSelected
                                ? "text-white"
                                : "text-[#141A23] group-hover:text-[#E8521A]"
                            }`}
                          >
                            {stripParens(comp.roleName)}
                          </strong>
                          <span
                            className={`font-mono text-hb-sm font-bold tabular-nums whitespace-nowrap ${
                              isSelected ? "text-[#38BDF8]" : "text-[#0F766E]"
                            }`}
                          >
                            {comp.tempRange}
                          </span>
                        </div>

                        <p
                          className={`text-hb-xs truncate ${
                            isSelected ? "text-white/75" : "text-[#64748B]"
                          }`}
                        >
                          {comp.recommendedItems.join(" · ")}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {layout.hasMachineryRoom && (
                  <div className="sm:col-span-3 rounded-lg border border-[#334155] bg-[#1E293B] p-3 flex sm:flex-col justify-between items-center text-center select-none shadow-inner">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      <span className="font-mono text-hb-xs font-bold text-white/90">
                        기계실 COMP
                      </span>
                    </div>
                    <div
                      className="hidden sm:flex flex-col gap-1.5 w-full my-2.5 px-2"
                      aria-hidden="true"
                    >
                      <div className="h-1 bg-[#475569] rounded-full" />
                      <div className="h-1 bg-[#475569] rounded-full" />
                      <div className="h-1 bg-[#475569] rounded-full" />
                      <div className="h-1 bg-[#475569] rounded-full" />
                      <div className="h-1 bg-[#475569] rounded-full" />
                    </div>
                    <div className="rounded bg-[#0E131B] border border-white/10 px-2.5 py-1 font-mono text-hb-xs text-[#38BDF8] tabular-nums">
                      {activeCompartment.tempRange}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Case B: 4도어 2×2 와이드 그리드 (중앙 수직선으로 모이는 손잡이) */}
            {layout.type === "4door_grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5">
                {layout.compartments.map((comp) => {
                  const isSelected = comp.id === activeCompartment.id;
                  const isFreeze = comp.role === "freezer";
                  const isLeftCol = comp.id === "tl" || comp.id === "bl";

                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => setSelectedId(comp.id)}
                      className={`group relative flex items-center justify-between gap-3 rounded-lg p-3.5 sm:p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] cursor-pointer ${
                        isSelected
                          ? "bg-[#141A23] text-white shadow-card ring-2 ring-[#E8521A] border-transparent"
                          : "border border-[#CBD2DC] bg-gradient-to-br from-white via-[#F8FAFC] to-[#F1F3F6] hover:from-white hover:to-white text-[#141A23]"
                      }`}
                    >
                      {/* 우측 도어일 때: 좌측 손잡이 바 (중앙선 마주봄) */}
                      {!isLeftCol && (
                        <div
                          className={`hidden sm:block w-1.5 h-12 sm:h-14 rounded-full shrink-0 transition-colors duration-150 ${
                            isSelected
                              ? "bg-[#E8521A]"
                              : "bg-[#CBD2DC] group-hover:bg-[#94A3B8]"
                          }`}
                          aria-hidden="true"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 w-full">
                          <span
                            className={`text-hb-xs font-bold ${
                              isSelected ? "text-[#FF8A50]" : "text-[#64748B]"
                            }`}
                          >
                            {comp.shortPos} 도어
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-hb-xs font-bold leading-none ${
                              isSelected
                                ? isFreeze
                                  ? "bg-[#0284C7] text-white"
                                  : "bg-[#0D9488] text-white"
                                : isFreeze
                                ? "bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD]"
                                : "bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]"
                            }`}
                          >
                            {isFreeze ? "냉동실" : "냉장실"}
                          </span>
                        </div>

                        <div className="my-2 flex items-baseline justify-between gap-2">
                          <strong
                            className={`text-hb-base font-bold tracking-tight ${
                              isSelected
                                ? "text-white"
                                : "text-[#141A23] group-hover:text-[#E8521A]"
                            }`}
                          >
                            {stripParens(comp.roleName)}
                          </strong>
                          <span
                            className={`font-mono text-hb-sm font-bold tabular-nums whitespace-nowrap ${
                              isSelected ? "text-[#38BDF8]" : "text-[#0F766E]"
                            }`}
                          >
                            {comp.tempRange}
                          </span>
                        </div>

                        <p
                          className={`text-hb-xs truncate ${
                            isSelected ? "text-white/75" : "text-[#64748B]"
                          }`}
                        >
                          권장 보관: {comp.recommendedItems.join(" · ")}
                        </p>
                      </div>

                      {/* 좌측 도어일 때(또는 모바일 기본): 우측 손잡이 바 (중앙선 마주봄) */}
                      {isLeftCol ? (
                        <div
                          className={`w-1.5 h-12 sm:h-14 rounded-full shrink-0 transition-colors duration-150 ${
                            isSelected
                              ? "bg-[#E8521A]"
                              : "bg-[#CBD2DC] group-hover:bg-[#94A3B8]"
                          }`}
                          aria-hidden="true"
                        />
                      ) : (
                        <div
                          className={`block sm:hidden w-1.5 h-12 sm:h-14 rounded-full shrink-0 transition-colors duration-150 ${
                            isSelected
                              ? "bg-[#E8521A]"
                              : "bg-[#CBD2DC] group-hover:bg-[#94A3B8]"
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Case C: 2도어 상·하 수직 분할 또는 3단 김치냉장고 */}
            {(layout.type === "2door_vertical" ||
              layout.type === "kimchi_3tier") && (
              <div className="space-y-1 sm:space-y-1.5">
                {layout.compartments.map((comp) => {
                  const isSelected = comp.id === activeCompartment.id;
                  const isFreeze = comp.role === "freezer";
                  const isKimchiDrawer =
                    layout.type === "kimchi_3tier" &&
                    (comp.id === "tier_mid" || comp.id === "tier_bot");

                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => setSelectedId(comp.id)}
                      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg p-3.5 sm:p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] cursor-pointer w-full ${
                        isSelected
                          ? "bg-[#141A23] text-white shadow-card ring-2 ring-[#E8521A] border-transparent"
                          : "border border-[#CBD2DC] bg-gradient-to-br from-white via-[#F8FAFC] to-[#F1F3F6] hover:from-white hover:to-white text-[#141A23]"
                      }`}
                    >
                      {/* 김치냉장고 서랍식일 때 상단 중앙 가로형 포켓 핸들 (모바일) */}
                      {isKimchiDrawer && (
                        <div
                          className={`h-1.5 w-20 sm:w-24 rounded-full mx-auto mb-1 transition-colors duration-150 sm:hidden ${
                            isSelected
                              ? "bg-[#E8521A]"
                              : "bg-[#CBD2DC] group-hover:bg-[#94A3B8]"
                          }`}
                          aria-hidden="true"
                        />
                      )}

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-hb-xs font-bold leading-none ${
                              isSelected
                                ? isFreeze
                                  ? "bg-[#0284C7] text-white"
                                  : comp.role === "kimchi" || comp.role === "custom"
                                  ? "bg-[#E8521A] text-white"
                                  : "bg-[#0D9488] text-white"
                                : isFreeze
                                ? "bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD]"
                                : comp.role === "kimchi" || comp.role === "custom"
                                ? "bg-[#FFF4EE] text-[#E8521A] border border-[#FADCD0]"
                                : "bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]"
                            }`}
                          >
                            {comp.shortPos}
                          </span>
                          <strong
                            className={`text-hb-base font-bold ${
                              isSelected
                                ? "text-white"
                                : "text-[#141A23] group-hover:text-[#E8521A]"
                            }`}
                          >
                            {stripParens(comp.roleName)}
                          </strong>
                        </div>
                        <p
                          className={`text-hb-xs ${
                            isSelected ? "text-white/75" : "text-[#64748B]"
                          }`}
                        >
                          권장 보관: {comp.recommendedItems.join(" · ")}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        {/* 김치냉장고 서랍식일 때 데스크톱 가로 포켓 핸들 */}
                        {isKimchiDrawer && (
                          <div
                            className={`hidden sm:block h-1.5 w-16 sm:w-20 rounded-full transition-colors duration-150 ${
                              isSelected
                                ? "bg-[#E8521A]"
                                : "bg-[#CBD2DC] group-hover:bg-[#94A3B8]"
                            }`}
                            aria-hidden="true"
                          />
                        )}

                        <span
                          className={`font-mono text-hb-base font-bold tabular-nums whitespace-nowrap ${
                            isSelected ? "text-[#38BDF8]" : "text-[#0F766E]"
                          }`}
                        >
                          {comp.tempRange}
                        </span>

                        {/* 스윙 도어일 때 우측 세로 손잡이 바 */}
                        {!isKimchiDrawer && (
                          <div
                            className={`w-1.5 h-8 sm:h-10 rounded-full shrink-0 transition-colors duration-150 ${
                              isSelected
                                ? "bg-[#E8521A]"
                                : "bg-[#CBD2DC] group-hover:bg-[#94A3B8]"
                            }`}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 본체 하단 받침 다리 (Legs / Leveling Feet) 실루엣 */}
        <div className="flex items-center justify-between px-6 sm:px-10" aria-hidden="true">
          <div className="h-2.5 w-10 sm:w-14 rounded-b-md bg-[#334155] border-x border-b border-[#141A23] shadow-xs" />
          {(layout.type === "4door_grid" || layout.type === "table_horizontal") && (
            <>
              <div className="h-2 w-8 sm:w-10 rounded-b-md bg-[#475569] border-x border-b border-[#141A23]" />
              <div className="h-2 w-8 sm:w-10 rounded-b-md bg-[#475569] border-x border-b border-[#141A23]" />
            </>
          )}
          <div className="h-2.5 w-10 sm:w-14 rounded-b-md bg-[#334155] border-x border-b border-[#141A23] shadow-xs" />
        </div>
      </div>

      {/* 3. 하단 선택 구역 요약 원장 (중첩 박스 없이 우측 구매 박스와 동일한 깔끔한 가로선 구조) */}
      <dl className="mt-4 divide-y divide-[#E2E6EC] border-t border-[#E2E6EC] text-hb-xs sm:text-hb-sm">
        <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <dt className="font-semibold text-[#64748B] shrink-0 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#E8521A]" />
            <span>선택 구역 ({activeCompartment.shortPos})</span>
          </dt>
          <dd className="font-bold text-[#141A23] sm:text-right break-keep">
            {activeCompartment.features ||
              `${stripParens(activeCompartment.roleName)} (${activeCompartment.tempRange})`}
          </dd>
        </div>

        <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <dt className="font-semibold text-[#64748B] shrink-0">
            권장 보관 품목
          </dt>
          <dd className="flex flex-wrap sm:justify-end gap-1.5">
            {activeCompartment.recommendedItems.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md bg-[#F1F3F6] px-2.5 py-0.5 text-hb-xs font-bold text-[#141A23]"
              >
                <Icon d={ICON.check} className="h-3 w-3 text-[#E8521A]" />
                <span>{item}</span>
              </span>
            ))}
          </dd>
        </div>

        <div className="pt-3 flex items-start gap-2 text-hb-xs text-[#64748B]">
          <Icon
            d={ICON.shieldCheck}
            className="h-4 w-4 text-[#0D9488] shrink-0 mt-0.5"
          />
          <p className="leading-relaxed break-keep">
            <strong className="text-[#141A23]">
              {layout.coolingType === "미지정"
                ? "냉각 특성"
                : `${layout.coolingType} 냉각 시스템`}
              :
            </strong>{" "}
            {layout.coolingDesc}
          </p>
        </div>
      </dl>
    </section>
  );
}
