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
  compartments: CompartmentInfo[];
  hasMachineryRoom?: boolean;
}

export interface RefrigeratorCompartmentDiagramProps {
  title: string;
  description?: string | null;
  category?: string | null;
  className?: string;
}

/**
 * 괄호 부가 설명을 깔끔하게 제거하는 헬퍼 (이중 괄호 원천 방지)
 */
function stripParens(text: string): string {
  return text.replace(/\s*\([^)]*\)/g, "").trim();
}

/**
 * 상품명과 상세 설명에서 냉장고 도어 구조 및 칸별 역할을 분석하는 헬퍼
 */
export function detectRefrigeratorLayout(
  title: string,
  description?: string | null,
  category?: string | null
): RefrigeratorLayoutData | null {
  const combined = `${title} ${description ?? ""}`.toLowerCase();

  const isExcludedCategory =
    category === "세탁기/건조기" ||
    category === "에어컨/냉난방기" ||
    category === "TV/영상가전" ||
    category === "주방/생활가전" ||
    category === "배송인증";

  if (
    isExcludedCategory &&
    !combined.includes("냉장") &&
    !combined.includes("냉동")
  ) {
    return null;
  }

  const isFridgeLike =
    category === "냉장고" ||
    category === "업소용기기" ||
    combined.includes("냉장") ||
    combined.includes("냉동") ||
    combined.includes("쇼케이스") ||
    combined.includes("박스");

  if (!isFridgeLike) {
    return null;
  }

  let coolingType: "직냉식" | "간냉식" | "미지정" = "미지정";
  let coolingDesc = "정밀 컴프레서 제어로 식자재 적정 온도를 안정적으로 유지합니다.";
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
      "팬 강제 대류 순환 방식으로 성에가 끼지 않아 관리가 편리한 간접 냉각 시스템입니다.";
  }

  const boxMatch = combined.match(/\b(25|30|45|65)\s*박스/);
  const literMatch = combined.match(/\b(\d{2,4})\s*(?:l|리터)\b/);
  const tableWidthMatch = combined.match(/\b(900|1200|1500|1800)\b/);
  const capacityStr = boxMatch
    ? `${boxMatch[1]}박스`
    : literMatch
    ? `${literMatch[1]}L`
    : tableWidthMatch
    ? `${tableWidthMatch[1]}mm 규격`
    : null;

  // 1. 스탠드형 김치냉장고 판별
  const isKimchiStand =
    combined.includes("김치냉장고") ||
    (combined.includes("김치") &&
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
      compartments: [
        {
          id: "tier_top",
          positionLabel: "상칸 (스윙 도어)",
          shortPos: "상칸 도어",
          role: "fridge",
          roleName: "다목적 신선·김치실",
          tempRange: "-1℃ ~ +3℃",
          recommendedItems: ["보관 김치", "신선 채소·과일", "주류·음료"],
          features: "자주 꺼내는 식자재와 밀폐 김치통 수납에 최적화된 상부 공간",
        },
        {
          id: "tier_mid",
          positionLabel: "중칸 (슬라이드 서랍)",
          shortPos: "중칸 서랍",
          role: "kimchi",
          roleName: "정온 김치·육류 숙성실",
          tempRange: "-1.5℃ ~ -0.5℃",
          recommendedItems: ["포기김치", "육류 숙성", "생선류"],
          features: "냉기 유출을 막는 밀폐 서랍 구조로 온도 편차를 최소화한 핵심 구역",
        },
        {
          id: "tier_bot",
          positionLabel: "하칸 (슬라이드 서랍)",
          shortPos: "하칸 서랍",
          role: "custom",
          roleName: "장기 보관 전문 서랍",
          tempRange: "-2℃ ~ +2℃",
          recommendedItems: ["묵은지", "쌀·잡곡", "뿌리채소"],
          features: "무거운 김치통이나 곡류·채소를 장기간 신선하게 보관하는 하부 서랍",
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
      combined.includes("올냉동") || combined.includes("전칸 냉동");
    const isAllFridge =
      combined.includes("올냉장") || combined.includes("전칸 냉장");
    const isHalfAndHalf =
      combined.includes("반반") ||
      combined.includes("2칸 냉동 / 2칸 냉장") ||
      combined.includes("상2칸") ||
      combined.includes("하2칸 냉동");

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
      return {
        type: "4door_grid",
        title: "업소용 4도어 반반형 구조도 (냉장 2 / 냉동 2)",
        subtitle: "상단 2도어 신선 냉장 + 하단 2도어 급속 냉동 분할",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "45박스 규격",
        compartments: [
          {
            id: "tl",
            positionLabel: "상단 좌측 도어 (냉장)",
            shortPos: "상단 좌측",
            role: "fridge",
            roleName: "신선 냉장실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["채소류", "손질 식재료", "소스류"],
            features: "허리를 숙이지 않고 자주 꺼내는 주방 메인 냉장 식자재 구역",
          },
          {
            id: "tr",
            positionLabel: "상단 우측 도어 (냉장)",
            shortPos: "상단 우측",
            role: "fridge",
            roleName: "신선 냉장실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["당일 사용 반찬", "유제품", "계란"],
            features: "영업 중 도어 개폐가 잦은 데일리 반찬 및 부재료 보관 구역",
          },
          {
            id: "bl",
            positionLabel: "하단 좌측 도어 (냉동)",
            shortPos: "하단 좌측",
            role: "freezer",
            roleName: "급속 냉동실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["육류 비축", "해산물 냉동"],
            features: "안정적인 영하 온도를 유지하는 대용량 육류·수산물 냉동 구역",
          },
          {
            id: "br",
            positionLabel: "하단 우측 도어 (냉동)",
            shortPos: "하단 우측",
            role: "freezer",
            roleName: "급속 냉동실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["가공 냉동식품", "얼음 및 냉동 보관품"],
            features: "대용량 냉동 식자재와 완제품을 여유 있게 비축하는 구역",
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

  // 3. 가로형 테이블 냉장고 / 찬밧드·반찬·토핑 냉장고 및 양문형 냉장고 (좌우 수평 2도어) 판별
  const isTableFridge =
    combined.includes("테이블") ||
    combined.includes("반찬") ||
    combined.includes("밧드") ||
    combined.includes("찬밧드") ||
    combined.includes("토핑") ||
    combined.includes("김밥") ||
    combined.includes("작업대") ||
    combined.includes("서랍식 테이블") ||
    combined.includes("가로형") ||
    combined.includes("수평") ||
    combined.includes("좌우") ||
    combined.includes("좌/우") ||
    combined.includes("좌·우") ||
    combined.includes("상부선반") ||
    combined.includes("상치선반") ||
    combined.includes("슬라이딩") ||
    Boolean(
      tableWidthMatch &&
        (combined.includes("2도어") ||
          combined.includes("올냉장") ||
          combined.includes("냉장"))
    ) ||
    /\b(cwsm|cwt|wst|rtar|rtf|rtr|rt-)\b/i.test(combined);

  const isSideBySide =
    (combined.includes("양문") && !is4Door) ||
    combined.includes("좌냉동") ||
    combined.includes("우냉장");

  if (isTableFridge || isSideBySide) {
    const isBanchanTopping =
      combined.includes("반찬") ||
      combined.includes("밧드") ||
      combined.includes("찬밧드") ||
      combined.includes("토핑") ||
      combined.includes("김밥");

    const isAllFreeze =
      combined.includes("올냉동") || combined.includes("전칸 냉동");
    const isHalfAndHalf =
      combined.includes("반반") ||
      combined.includes("1냉동 1냉장") ||
      combined.includes("냉동 1칸 / 냉장 1칸") ||
      (combined.includes("냉동") && combined.includes("냉장")) ||
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
        capacity: capacityStr ?? (isTableFridge ? "테이블 규격" : "대용량 규격"),
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
              "업소용 박스 식자재",
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
          ? "업소용 찬밧드 2도어 (좌냉동 / 우냉장)"
          : isTableFridge
          ? "업소용 테이블 2도어 (좌냉동 / 우냉장)"
          : "양문형 2도어 구조도 (좌냉동 / 우냉장)",
        subtitle: "좌측 급속 냉동 1도어 + 우측 신선 냉장 1도어 수평 분할",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? (isTableFridge ? "테이블 규격" : "대용량 규격"),
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
        ? "좌·우 2도어 전체 신선 냉장 구성 (상단 밧드 + 작업대 일체형)"
        : "좌·우 2도어 전체 신선 냉장 구성 (상판 조리 작업대 일체형)",
      coolingType,
      coolingDesc,
      capacity: capacityStr ?? (isTableFridge ? "테이블 규격" : "대용량 규격"),
      compartments: [
        {
          id: "left",
          positionLabel: "좌측 도어 (1칸)",
          shortPos: "좌측 도어",
          role: "fridge",
          roleName: "신선 냉장실",
          tempRange: "0℃ ~ +7℃",
          recommendedItems: isBanchanTopping
            ? ["배식용 소분 반찬", "당일 손질 채소", "주방 양념 및 소스"]
            : ["당일 손질 채소", "주방 양념 및 소스", "유제품"],
          features: isBanchanTopping
            ? "상단 찬밧드 구획과 연계되어 신속한 서빙 및 데일리 식재료 인출을 지원합니다."
            : "상판 조리 작업대 바로 아래 위치해 손쉬운 데일리 식재료 인출을 지원합니다.",
        },
        {
          id: "right",
          positionLabel: "우측 도어 (1칸)",
          shortPos: "우측 도어",
          role: "fridge",
          roleName: "대용량 냉장실",
          tempRange: "0℃ ~ +7℃",
          recommendedItems: ["대형 반찬통", "김치통", "주류 및 음료"],
          features:
            "넓은 내부 수납 선반으로 대용량 식재료와 소분 반찬통을 넉넉하게 수납합니다.",
        },
      ],
    };
  }

  // 4. 2도어 수직 분할 (상하 2칸 분할 - 25박스, 30박스, 일반 투도어) 판별
  const is2Door =
    combined.includes("25박스") ||
    combined.includes("30박스") ||
    combined.includes("2도어") ||
    combined.includes("2문") ||
    combined.includes("투도어") ||
    combined.includes("상단 냉동") ||
    combined.includes("하단 냉동") ||
    combined.includes("상냉장") ||
    combined.includes("상냉동");

  if (is2Door || combined.includes("냉장냉동고")) {
    const isTopFridgeBottomFreeze =
      (combined.includes("상냉장") && combined.includes("하냉동")) ||
      combined.includes("상단 냉장 / 하단 냉동") ||
      combined.includes("상단 냉장 1칸 / 하단 냉동 1칸");

    const isAllFreeze =
      combined.includes("올냉동") || combined.includes("2도어 올냉동");
    const isAllFridge =
      combined.includes("올냉장") || combined.includes("2도어 올냉장");

    if (isAllFreeze) {
      return {
        type: "2door_vertical",
        title: "업소용 2도어 전칸 올냉동 구조도",
        subtitle: "상·하 2칸 전체 급속 냉동 특화 구성",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "25/30박스 규격",
        compartments: [
          {
            id: "top",
            positionLabel: "상단 도어 (1칸)",
            shortPos: "상단 도어",
            role: "freezer",
            roleName: "급속 냉동실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["자주 꺼내는 냉동 식자재", "육류", "가공식품"],
            features: "눈높이 상부 도어로 주력 냉동 식자재를 빠르게 수납·인출합니다.",
          },
          {
            id: "bot",
            positionLabel: "하단 도어 (1칸)",
            shortPos: "하단 도어",
            role: "freezer",
            roleName: "대용량 냉동실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: [
              "장기 보관 냉동육",
              "비축 식자재",
              "대용량 해산물",
            ],
            features: "부피가 큰 냉동 박스와 비축용 식자재를 안정적으로 보관합니다.",
          },
        ],
      };
    }

    if (isAllFridge) {
      return {
        type: "2door_vertical",
        title: "업소용 2도어 전칸 올냉장 구조도",
        subtitle: "상·하 2칸 전체 신선 냉장 특화 구성",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "25/30박스 규격",
        compartments: [
          {
            id: "top",
            positionLabel: "상단 도어 (1칸)",
            shortPos: "상단 도어",
            role: "fridge",
            roleName: "신선 냉장실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["당일 손질 채소", "주방 양념 및 소스", "유제품"],
            features: "조리 중 가장 손이 잘 닿는 상부 데일리 신선 냉장 구역입니다.",
          },
          {
            id: "bot",
            positionLabel: "하단 도어 (1칸)",
            shortPos: "하단 도어",
            role: "fridge",
            roleName: "대용량 냉장실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["대형 반찬통", "김치통", "주류 및 음료"],
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

    return {
      type: "2door_vertical",
      title: "업소용 2도어 구조도 (상단 냉동 / 하단 냉장)",
      subtitle: "상단 급속 냉동실(1도어) + 하단 신선 냉장실(1도어) 수직 분할",
      coolingType,
      coolingDesc,
      capacity: capacityStr ?? "25박스 규격",
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

  return (
    <section
      aria-label="도어별 구조 및 칸별 역할 안내"
      className={`rounded-2xl border border-[#E2E6EC] bg-white p-5 sm:p-6 shadow-2xs space-y-5 ${className}`.trim()}
    >
      {/* 1. 상단 섹션 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E6EC]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#141A23] px-2.5 py-1 text-hb-xs font-bold text-white">
              <Icon d={ICON.sliders} className="w-3.5 h-3.5 text-[#FF8A50]" />
              <span>도어 구조 청사진</span>
            </span>
            {layout.capacity && (
              <span className="rounded-md border border-[#E2E6EC] bg-[#F7F8FA] px-2.5 py-1 font-mono text-hb-xs font-bold text-[#141A23] tabular-nums">
                {layout.capacity}
              </span>
            )}
            {layout.coolingType !== "미지정" && (
              <span
                className={`rounded-md px-2.5 py-1 text-hb-xs font-bold ${
                  layout.coolingType === "직냉식"
                    ? "bg-[#FFF4EE] text-[#E8521A] border border-[#FADCD0]"
                    : "bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]"
                }`}
              >
                {layout.coolingType}
              </span>
            )}
          </div>
          <h3 className="text-hb-lg sm:text-hb-xl font-bold text-[#141A23] tracking-tight break-keep">
            {layout.title}
          </h3>
          <p className="mt-0.5 text-hb-xs sm:text-hb-sm text-[#64748B] break-keep">
            {layout.subtitle}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F8FA] px-3 py-1.5 text-hb-xs font-semibold text-[#334155] border border-[#E2E6EC] shrink-0">
          <Icon d={ICON.sparkles} className="h-3.5 w-3.5 text-[#E8521A]" />
          <span>도어 칸을 누르면 구역별 스펙이 전환됩니다</span>
        </div>
      </div>

      {/* 2. 메인 2열 레이아웃 (좌: 일체형 하드웨어 캐비닛 모형 / 우: 선택 구역 스펙 시트) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* A. 좌측 (6열): 상단 빈 여백을 없애고 컨트롤러 베젤을 본체에 일체화한 캐비닛 다이어그램 */}
        <div className="md:col-span-6 flex flex-col justify-center rounded-2xl border border-[#E2E6EC] bg-[#F7F8FA] p-4 sm:p-5">
          <div className="w-full max-w-[380px] mx-auto rounded-2xl border border-[#CBD2DC] bg-white shadow-xs overflow-hidden">
            {/* 상단 일체형 디지털 컨트롤러 헤드 베젤 */}
            <div className="flex items-center justify-between bg-[#141A23] px-3.5 py-2.5 text-white border-b border-[#1E2736]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0D9488]" />
                <span className="font-mono text-hb-xs font-bold tracking-wider text-white/90">
                  HANBAT CONTROL
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-0.5 font-mono text-hb-xs font-bold tabular-nums">
                <span className="text-[#38BDF8]">
                  {activeCompartment.tempRange}
                </span>
                <span className="text-white/60">SET</span>
              </div>
            </div>

            {/* 테이블형 냉장고일 때 상판 스테인리스 작업대 표시 */}
            {layout.type === "table_horizontal" && layout.hasMachineryRoom && (
              <div className="flex items-center justify-between bg-[#F1F5F9] border-b border-[#CBD2DC] px-3.5 py-1.5 text-hb-xs">
                <span className="font-mono font-bold text-[#334155]">
                  STAINLESS WORKTOP · 상판 작업대
                </span>
                <span className="font-mono font-bold text-[#E8521A] tabular-nums">
                  {layout.capacity ?? "테이블형"}
                </span>
              </div>
            )}

            {/* 캐비닛 도어 그리드 영역 (내부 텍스트 잘림 제로) */}
            <div className="p-2.5 bg-[#F1F3F6]">
              {/* Case 1: 테이블형 / 양문형 좌우 수평 배치 */}
              {layout.type === "table_horizontal" && (
                <div
                  className={`grid gap-2 ${
                    layout.hasMachineryRoom ? "grid-cols-11" : "grid-cols-2"
                  }`}
                >
                  <div
                    className={`${
                      layout.hasMachineryRoom ? "col-span-8" : "col-span-2"
                    } grid grid-cols-2 gap-2`}
                  >
                    {layout.compartments.map((comp) => {
                      const isSelected = comp.id === activeCompartment.id;
                      const isFreeze = comp.role === "freezer";

                      return (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => setSelectedId(comp.id)}
                          className={`group relative flex flex-col justify-between rounded-xl p-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] cursor-pointer min-h-[124px] ${
                            isSelected
                              ? "bg-[#141A23] text-white shadow-card ring-2 ring-[#E8521A]"
                              : "border border-[#CBD2DC] bg-white text-[#141A23] hover:border-[#141A23]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-hb-xs font-bold leading-none ${
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
                            <span
                              className={`h-1.5 w-5 rounded-full ${
                                isSelected ? "bg-white/35" : "bg-[#CBD2DC]"
                              }`}
                              aria-hidden="true"
                            />
                          </div>

                          <div className="my-2">
                            <strong
                              className={`block text-hb-sm font-bold leading-tight break-keep ${
                                isSelected
                                  ? "text-white"
                                  : "text-[#141A23] group-hover:text-[#E8521A]"
                              }`}
                            >
                              {comp.shortPos}
                            </strong>
                            <span
                              className={`mt-0.5 block text-hb-xs font-semibold break-keep ${
                                isSelected ? "text-[#FF8A50]" : "text-[#64748B]"
                              }`}
                            >
                              {stripParens(comp.roleName)}
                            </span>
                          </div>

                          <div
                            className={`font-mono text-hb-xs font-bold tabular-nums whitespace-nowrap ${
                              isSelected ? "text-[#38BDF8]" : "text-[#0F766E]"
                            }`}
                          >
                            {comp.tempRange}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* 우측 기계실 (컴프레서 챔버) */}
                  {layout.hasMachineryRoom && (
                    <div className="col-span-3 rounded-xl border border-[#CBD2DC] bg-[#E2E6EC]/70 p-2.5 flex flex-col justify-between items-center text-center select-none">
                      <span className="font-mono text-hb-xs font-bold text-[#334155]">
                        기계실
                      </span>
                      <div className="w-full space-y-1.5 my-2 px-1">
                        <div className="h-1 bg-[#94A3B8] rounded-full" />
                        <div className="h-1 bg-[#94A3B8] rounded-full" />
                        <div className="h-1 bg-[#94A3B8] rounded-full" />
                        <div className="h-1 bg-[#94A3B8] rounded-full" />
                      </div>
                      <span className="font-mono text-hb-xs font-semibold text-[#64748B]">
                        COMP
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Case 2: 2도어 상하 수직 분할 */}
              {layout.type === "2door_vertical" && (
                <div className="space-y-2">
                  {layout.compartments.map((comp) => {
                    const isSelected = comp.id === activeCompartment.id;
                    const isFreeze = comp.role === "freezer";

                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => setSelectedId(comp.id)}
                        className={`group relative flex items-center justify-between gap-3 rounded-xl p-3.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] cursor-pointer w-full min-h-[88px] ${
                          isSelected
                            ? "bg-[#141A23] text-white shadow-card ring-2 ring-[#E8521A]"
                            : "border border-[#CBD2DC] bg-white text-[#141A23] hover:border-[#141A23]"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-hb-xs font-bold leading-none ${
                                isSelected
                                  ? isFreeze
                                    ? "bg-[#0284C7] text-white"
                                    : "bg-[#0D9488] text-white"
                                  : isFreeze
                                  ? "bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD]"
                                  : "bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]"
                              }`}
                            >
                              {isFreeze ? "냉동구역" : "냉장구역"}
                            </span>
                            <strong
                              className={`text-hb-sm font-bold break-keep ${
                                isSelected
                                  ? "text-white"
                                  : "text-[#141A23] group-hover:text-[#E8521A]"
                              }`}
                            >
                              {comp.shortPos} · {stripParens(comp.roleName)}
                            </strong>
                          </div>
                          <p
                            className={`text-hb-xs font-medium break-keep ${
                              isSelected ? "text-white/75" : "text-[#64748B]"
                            }`}
                          >
                            권장 보관: {comp.recommendedItems.slice(0, 3).join(", ")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span
                            className={`font-mono text-hb-xs sm:text-hb-sm font-bold tabular-nums whitespace-nowrap ${
                              isSelected ? "text-[#38BDF8]" : "text-[#0F766E]"
                            }`}
                          >
                            {comp.tempRange}
                          </span>
                          <span
                            className={`w-1.5 h-8 rounded-full ${
                              isSelected ? "bg-[#E8521A]" : "bg-[#CBD2DC]"
                            }`}
                            aria-hidden="true"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Case 3: 4도어 2x2 그리드 */}
              {layout.type === "4door_grid" && (
                <div className="grid grid-cols-2 gap-2">
                  {layout.compartments.map((comp) => {
                    const isSelected = comp.id === activeCompartment.id;
                    const isFreeze = comp.role === "freezer";

                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => setSelectedId(comp.id)}
                        className={`group relative flex flex-col justify-between rounded-xl p-3.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] cursor-pointer min-h-[112px] ${
                          isSelected
                            ? "bg-[#141A23] text-white shadow-card ring-2 ring-[#E8521A]"
                            : "border border-[#CBD2DC] bg-white text-[#141A23] hover:border-[#141A23]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 w-full">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-hb-xs font-bold leading-none ${
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
                          <span
                            className={`w-1.5 h-4 rounded-full ${
                              isSelected ? "bg-[#E8521A]" : "bg-[#CBD2DC]"
                            }`}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="my-2">
                          <strong
                            className={`block text-hb-sm font-bold leading-snug break-keep ${
                              isSelected
                                ? "text-white"
                                : "text-[#141A23] group-hover:text-[#E8521A]"
                            }`}
                          >
                            {stripParens(comp.roleName)}
                          </strong>
                          <span
                            className={`block text-hb-xs font-medium ${
                              isSelected ? "text-white/75" : "text-[#64748B]"
                            }`}
                          >
                            {comp.shortPos} 도어
                          </span>
                        </div>

                        <div
                          className={`font-mono text-hb-xs font-bold tabular-nums whitespace-nowrap ${
                            isSelected ? "text-[#38BDF8]" : "text-[#0F766E]"
                          }`}
                        >
                          {comp.tempRange}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Case 4: 스탠드형 3단 김치냉장고 */}
              {layout.type === "kimchi_3tier" && (
                <div className="space-y-2">
                  {layout.compartments.map((comp) => {
                    const isSelected = comp.id === activeCompartment.id;

                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => setSelectedId(comp.id)}
                        className={`group relative flex items-center justify-between gap-3 rounded-xl p-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] cursor-pointer w-full min-h-[72px] ${
                          isSelected
                            ? "bg-[#141A23] text-white shadow-card ring-2 ring-[#E8521A]"
                            : "border border-[#CBD2DC] bg-white text-[#141A23] hover:border-[#141A23]"
                        }`}
                      >
                        <div>
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-hb-xs font-bold ${
                              isSelected
                                ? "bg-white/15 text-[#FF8A50]"
                                : "bg-[#FFF4EE] text-[#E8521A]"
                            }`}
                          >
                            {comp.shortPos}
                          </span>
                          <strong
                            className={`mt-1 block text-hb-sm font-bold ${
                              isSelected
                                ? "text-white"
                                : "text-[#141A23] group-hover:text-[#E8521A]"
                            }`}
                          >
                            {stripParens(comp.roleName)}
                          </strong>
                        </div>
                        <span
                          className={`font-mono text-hb-xs font-bold tabular-nums whitespace-nowrap ${
                            isSelected ? "text-[#38BDF8]" : "text-[#0F766E]"
                          }`}
                        >
                          {comp.tempRange}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <p className="mt-2.5 text-center text-hb-xs font-medium text-[#64748B]">
            실물 도어 배치 기준 인터랙티브 모형 (터치하여 구역 전환)
          </p>
        </div>

        {/* B. 우측 (6열): 선택된 도어 구역 상세 스펙 시트 (불필요한 세로 늘어짐 제거) */}
        <div className="md:col-span-6 flex flex-col justify-between rounded-2xl border border-[#E2E6EC] bg-white p-4 sm:p-5 space-y-4">
          <div className="space-y-4">
            {/* 상단 구역 빠른 전환 탭 바 */}
            <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-[#F1F3F6]">
              {layout.compartments.map((comp) => {
                const isCurrent = comp.id === activeCompartment.id;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => setSelectedId(comp.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-hb-xs font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                      isCurrent
                        ? "bg-[#141A23] text-white shadow-2xs"
                        : "bg-[#F1F3F6] text-[#334155] hover:bg-[#E2E6EC]"
                    }`}
                  >
                    {comp.shortPos}
                  </button>
                );
              })}
            </div>

            {/* 현재 선택 구역 타이틀 & 권장 온도 */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-hb-xs font-bold text-[#64748B] block">
                  선택된 도어 구역
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h4 className="text-hb-lg font-bold text-[#141A23] tracking-tight">
                    {activeCompartment.positionLabel}
                  </h4>
                  <span
                    className={`rounded-md px-2 py-0.5 text-hb-xs font-bold ${
                      activeCompartment.role === "freezer"
                        ? "bg-[#141A23] text-white"
                        : "bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E]"
                    }`}
                  >
                    {stripParens(activeCompartment.roleName)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-[#FFF4EE] border border-[#FADCD0] px-3 py-1.5 text-right shrink-0">
                <span className="block text-hb-xs font-bold text-[#64748B]">
                  적정 권장 온도
                </span>
                <strong className="font-mono text-hb-base font-bold text-[#E8521A] tabular-nums">
                  {activeCompartment.tempRange}
                </strong>
              </div>
            </div>

            {/* 구역 특징 설명 */}
            {activeCompartment.features && (
              <p className="rounded-xl bg-[#F7F8FA] border border-[#E2E6EC] p-3 text-hb-sm text-[#334155] leading-relaxed break-keep">
                {activeCompartment.features}
              </p>
            )}

            {/* 권장 보관 식자재 칩 */}
            <div>
              <span className="text-hb-xs font-bold text-[#141A23] block mb-2">
                권장 보관 식자재 및 품목
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeCompartment.recommendedItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E6EC] bg-[#F7F8FA] px-3 py-1.5 text-hb-xs font-bold text-[#141A23]"
                  >
                    <Icon d={ICON.check} className="h-3.5 w-3.5 text-[#E8521A]" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 전체 도어 구성 요약 (컴팩트 2열 그리드로 높이 절감 & 이중 괄호 제거) */}
            <div className="pt-1">
              <span className="text-hb-xs font-bold text-[#64748B] block mb-2">
                전체 도어 구성 한눈에 보기
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {layout.compartments.map((comp) => {
                  const isCurrent = comp.id === activeCompartment.id;
                  const cleanRole = stripParens(comp.roleName);

                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => setSelectedId(comp.id)}
                      className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-hb-xs cursor-pointer transition-[background-color,border-color] duration-150 text-left ${
                        isCurrent
                          ? "bg-[#141A23] text-white font-bold"
                          : "border border-[#E2E6EC] bg-[#F7F8FA] text-[#141A23] hover:border-[#CBD2DC]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            isCurrent
                              ? "bg-[#E8521A]"
                              : comp.role === "freezer"
                              ? "bg-[#0284C7]"
                              : "bg-[#0D9488]"
                          }`}
                        />
                        <span className="font-bold truncate">
                          {comp.shortPos}
                        </span>
                        <span
                          className={`truncate ${
                            isCurrent ? "text-[#FF8A50]" : "text-[#64748B]"
                          }`}
                        >
                          · {cleanRole}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold tabular-nums shrink-0 ${
                          isCurrent ? "text-[#38BDF8]" : "text-[#334155]"
                        }`}
                      >
                        {comp.tempRange}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 하단 냉각 방식 가이드 */}
          <div className="pt-3 border-t border-[#E2E6EC] flex items-start gap-2 text-hb-xs text-[#64748B]">
            <Icon
              d={ICON.shieldCheck}
              className="h-4 w-4 text-[#0D9488] shrink-0 mt-0.5"
            />
            <p className="leading-relaxed break-keep">
              <strong className="text-[#141A23]">
                {layout.coolingType === "미지정"
                  ? "냉각 시스템 특성"
                  : `${layout.coolingType} 냉각 시스템`}
                :
              </strong>{" "}
              {layout.coolingDesc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
