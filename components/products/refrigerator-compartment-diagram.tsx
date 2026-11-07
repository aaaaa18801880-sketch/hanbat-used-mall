// 파일 경로: components/products/refrigerator-compartment-diagram.tsx
"use client";

import React, { useState } from "react";
import { Icon, ICON } from "../../lib/ui";

export interface CompartmentInfo {
  id: string;
  positionLabel: string;
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
}

export interface RefrigeratorCompartmentDiagramProps {
  title: string;
  description?: string | null;
  category?: string | null;
  className?: string;
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

  // 1. 비냉장고 카테고리/제품 제외 (클린 뷰)
  const isExcludedCategory =
    category === "세탁기/건조기" ||
    category === "에어컨/냉난방기" ||
    category === "TV/영상가전" ||
    category === "주방/생활가전";

  if (isExcludedCategory && !combined.includes("냉장") && !combined.includes("냉동")) {
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

  // 냉각 방식 판별
  let coolingType: "직냉식" | "간냉식" | "미지정" = "미지정";
  let coolingDesc = "정밀 컴프레서 제어로 신선 온도를 유지합니다.";
  if (combined.includes("직냉")) {
    coolingType = "직냉식";
    coolingDesc = "내벽 냉각 파이프 직접 냉각 방식으로 식자재 수분 증발을 억제하며 신선도를 오래 유지합니다 (주기적 성에 제상 관리 권장).";
  } else if (combined.includes("간냉") || combined.includes("노프로스트") || combined.includes("간접냉각")) {
    coolingType = "간냉식";
    coolingDesc = "팬 강제 대류 순환 방식으로 성에 발생이 없는 간접 냉각 시스템입니다.";
  }

  // 용량(리터/박스) 감지
  const boxMatch = combined.match(/\b(25|30|45|65)\s*박스/);
  const literMatch = combined.match(/\b(\d{2,4})\s*(?:l|리터)\b/);
  const capacityStr = boxMatch ? `${boxMatch[1]}박스` : literMatch ? `${literMatch[1]}L` : null;

  // 2. 스탠드형 김치냉장고 판별
  const isKimchiStand =
    combined.includes("김치냉장고") ||
    (combined.includes("김치") && (combined.includes("스탠드") || combined.includes("3단") || combined.includes("3룸")));

  if (isKimchiStand) {
    return {
      type: "kimchi_3tier",
      title: "스탠드 3단 전문 보관 원장",
      subtitle: "상칸(도어) · 중칸/하칸(서랍식) 독립 정온 제어",
      coolingType,
      coolingDesc: coolingType === "미지정" ? "룸별 독립 냉각 기술로 김치와 식자재 고유의 풍미를 보존합니다." : coolingDesc,
      capacity: capacityStr,
      compartments: [
        {
          id: "tier_top",
          positionLabel: "상칸 (스윙 도어)",
          role: "fridge",
          roleName: "다목적 신선·김치 보관실",
          tempRange: "-1℃ ~ +3℃",
          recommendedItems: ["보관 김치", "신선 채소·과일", "주류·음료"],
          features: "자주 꺼내는 식자재와 밀폐 김치통 수납에 최적화",
        },
        {
          id: "tier_mid",
          positionLabel: "중칸 (슬라이드 서랍)",
          role: "kimchi",
          roleName: "땅속 직접 냉각실",
          tempRange: "-1.5℃ ~ -0.5℃",
          recommendedItems: ["포기김치", "육류 숙성", "생선류"],
          features: "냉기 밀폐 서랍으로 온도 편차를 최소화한 정온 숙성실",
        },
        {
          id: "tier_bot",
          positionLabel: "하칸 (슬라이드 서랍)",
          role: "custom",
          roleName: "장기 보관 전문 서랍",
          tempRange: "-2℃ ~ +2℃",
          recommendedItems: ["묵은지", "쌀·잡곡", "뿌리채소"],
          features: "장기 보관 및 계절 식자재 맞춤 보관 서랍",
        },
      ],
    };
  }

  // 3. 4도어 (4칸 2x2 그리드) 판별
  const is4Door =
    combined.includes("45박스") ||
    combined.includes("4도어") ||
    combined.includes("4문") ||
    combined.includes("포도어") ||
    combined.includes("4칸");

  if (is4Door) {
    const isAllFreeze = combined.includes("올냉동") || combined.includes("전칸 냉동");
    const isAllFridge = combined.includes("올냉장") || combined.includes("전칸 냉장");
    const isHalfAndHalf =
      combined.includes("반반") ||
      combined.includes("2칸 냉동 / 2칸 냉장") ||
      combined.includes("상2칸") ||
      combined.includes("하2칸 냉동");

    if (isAllFreeze) {
      return {
        type: "4door_grid",
        title: "업소용 4도어 전칸 올냉동 원장",
        subtitle: "4개 구역 전체 급속 냉동 특화 구성",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "45박스 규격",
        compartments: [
          {
            id: "tl",
            positionLabel: "상단 좌측 도어",
            role: "freezer",
            roleName: "급속 냉동 1실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["소포장 육류", "가공 냉동식품"],
          },
          {
            id: "tr",
            positionLabel: "상단 우측 도어",
            role: "freezer",
            roleName: "급속 냉동 2실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["급랭 생선류", "해산물 식재료"],
          },
          {
            id: "bl",
            positionLabel: "하단 좌측 도어",
            role: "freezer",
            roleName: "대용량 냉동 3실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["대용량 박스 식자재", "비축 육류"],
          },
          {
            id: "br",
            positionLabel: "하단 우측 도어",
            role: "freezer",
            roleName: "대용량 냉동 4실",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["냉동 완제품", "업소용 대용량 식자재"],
          },
        ],
      };
    }

    if (isAllFridge) {
      return {
        type: "4door_grid",
        title: "업소용 4도어 전칸 올냉장 원장",
        subtitle: "4개 구역 전체 신선 냉장 특화 구성",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "45박스 규격",
        compartments: [
          {
            id: "tl",
            positionLabel: "상단 좌측 도어",
            role: "fridge",
            roleName: "신선 냉장 1실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["당일 손질 채소", "식재료 소스류"],
          },
          {
            id: "tr",
            positionLabel: "상단 우측 도어",
            role: "fridge",
            roleName: "신선 냉장 2실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["유제품", "계란 및 단기 식자재"],
          },
          {
            id: "bl",
            positionLabel: "하단 좌측 도어",
            role: "fridge",
            roleName: "대용량 냉장 3실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["대용량 반찬통", "김치 및 절임류"],
          },
          {
            id: "br",
            positionLabel: "하단 우측 도어",
            role: "fridge",
            roleName: "대용량 냉장 4실",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["주류", "음료 박스", "가공 부재료"],
          },
        ],
      };
    }

    if (isHalfAndHalf) {
      // 상단 2칸 냉장 / 하단 2칸 냉동 (또는 반반)
      return {
        type: "4door_grid",
        title: "업소용 4도어 반반형 (상단 냉장 / 하단 냉동)",
        subtitle: "상단 2도어 신선 냉장 + 하단 2도어 대용량 급속 냉동",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "45박스 규격",
        compartments: [
          {
            id: "tl",
            positionLabel: "상단 좌측 도어",
            role: "fridge",
            roleName: "신선 냉장실 (상좌)",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["채소류", "손질 식재료", "소스류"],
          },
          {
            id: "tr",
            positionLabel: "상단 우측 도어",
            role: "fridge",
            roleName: "신선 냉장실 (상우)",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["당일 사용 반찬", "유제품", "계란"],
          },
          {
            id: "bl",
            positionLabel: "하단 좌측 도어",
            role: "freezer",
            roleName: "급속 냉동실 (하좌)",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["육류 비축", "해산물 냉동"],
          },
          {
            id: "br",
            positionLabel: "하단 우측 도어",
            role: "freezer",
            roleName: "급속 냉동실 (하우)",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["가공 냉동식품", "얼음 및 냉동 보관품"],
          },
        ],
      };
    }

    // 기본 업소용 45박스 최다 보급형: 1/4 냉동 (상단 좌측 1칸 냉동 / 나머지 3칸 냉장)
    return {
      type: "4door_grid",
      title: "업소용 4도어 1/4 냉동형 (냉동 1칸 / 냉장 3칸)",
      subtitle: "상단 좌측 급속 냉동 1칸 + 나머지 3칸 와이드 신선 냉장",
      coolingType,
      coolingDesc,
      capacity: capacityStr ?? "45박스 규격",
      compartments: [
        {
          id: "tl",
          positionLabel: "상단 좌측 도어 (냉동 1칸)",
          role: "freezer",
          roleName: "급속 냉동실",
          tempRange: "-15℃ ~ -24℃",
          recommendedItems: ["육류", "생선", "소포장 냉동식자재"],
          features: "자주 꺼내는 핵심 냉동 품목 신속 인출",
        },
        {
          id: "tr",
          positionLabel: "상단 우측 도어 (냉장)",
          role: "fridge",
          roleName: "신선 냉장실 (상우)",
          tempRange: "0℃ ~ +7℃",
          recommendedItems: ["당일 손질 채소", "주방 조리 소스"],
          features: "눈높이에 맞춘 메인 조리 식자재 보관 구역",
        },
        {
          id: "bl",
          positionLabel: "하단 좌측 도어 (냉장)",
          role: "fridge",
          roleName: "대용량 냉장실 (하좌)",
          tempRange: "0℃ ~ +7℃",
          recommendedItems: ["대용량 반찬통", "김치 및 절임류"],
          features: "무거운 대형 용기 및 식자재 보관 구역",
        },
        {
          id: "br",
          positionLabel: "하단 우측 도어 (냉장)",
          role: "fridge",
          roleName: "대용량 냉장실 (하우)",
          tempRange: "0℃ ~ +7℃",
          recommendedItems: ["주류", "음료 박스", "가공 부재료"],
          features: "넉넉한 수납 공간으로 음료 및 식재료 비축",
        },
      ],
    };
  }

  // 4. 2도어 (상하 2칸 분할 - 25박스, 30박스, 소형 투도어) 판별
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

    const isAllFreeze = combined.includes("올냉동") || combined.includes("2도어 올냉동");
    const isAllFridge = combined.includes("올냉장") || combined.includes("2도어 올냉장");

    if (isAllFreeze) {
      return {
        type: "2door_vertical",
        title: "업소용 2도어 전칸 올냉동 원장",
        subtitle: "상하 2칸 전체 강력 급속 냉동 특화 구성",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "25/30박스 규격",
        compartments: [
          {
            id: "top",
            positionLabel: "상단 도어 (1칸)",
            role: "freezer",
            roleName: "급속 냉동실 (상단)",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["자주 꺼내는 냉동 식자재", "육류", "가공식품"],
          },
          {
            id: "bot",
            positionLabel: "하단 도어 (1칸)",
            role: "freezer",
            roleName: "대용량 급속 냉동실 (하단)",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["장기 보관 냉동육", "비축 식자재", "대용량 해산물"],
          },
        ],
      };
    }

    if (isAllFridge) {
      return {
        type: "2door_vertical",
        title: "업소용 2도어 전칸 올냉장 원장",
        subtitle: "상하 2칸 전체 신선 냉장 특화 구성",
        coolingType,
        coolingDesc,
        capacity: capacityStr ?? "25/30박스 규격",
        compartments: [
          {
            id: "top",
            positionLabel: "상단 도어 (1칸)",
            role: "fridge",
            roleName: "신선 냉장실 (상단)",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["당일 손질 채소", "주방 양념 및 소스", "유제품"],
          },
          {
            id: "bot",
            positionLabel: "하단 도어 (1칸)",
            role: "fridge",
            roleName: "대용량 냉장실 (하단)",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["대형 반찬통", "김치통", "주류 및 음료"],
          },
        ],
      };
    }

    if (isTopFridgeBottomFreeze) {
      return {
        type: "2door_vertical",
        title: "2도어 독립 냉각 원장 (상단 냉장 / 하단 냉동)",
        subtitle: "상단 인체공학적 신선 냉장 + 하단 대용량 급속 냉동",
        coolingType,
        coolingDesc,
        capacity: capacityStr,
        compartments: [
          {
            id: "top",
            positionLabel: "상단 도어 (1칸)",
            role: "fridge",
            roleName: "신선 냉장실 (상단)",
            tempRange: "0℃ ~ +7℃",
            recommendedItems: ["자주 꺼내는 반찬", "채소·과일", "음료·유제품"],
            features: "허리를 숙이지 않고 편안하게 수납하는 데일리 냉장 구역",
          },
          {
            id: "bot",
            positionLabel: "하단 도어 (1칸)",
            role: "freezer",
            roleName: "급속 냉동실 (하단)",
            tempRange: "-15℃ ~ -24℃",
            recommendedItems: ["장기 보관 냉동육", "생선류", "냉동 간편식"],
            features: "냉기 유출이 적고 깊이감이 뛰어난 대용량 냉동 보관 구역",
          },
        ],
      };
    }

    // 기본 최다 보급형: 상단 냉동 1칸 / 하단 냉장 1칸 (25박스 표준)
    return {
      type: "2door_vertical",
      title: "업소용 2도어 원장 (상단 냉동 1칸 / 하단 냉장 1칸)",
      subtitle: "상단 급속 냉동실(1도어) + 하단 신선 냉장실(1도어) 표준 분할",
      coolingType,
      coolingDesc,
      capacity: capacityStr ?? "25박스 규격",
      compartments: [
        {
          id: "top",
          positionLabel: "상단 도어 (냉동 1칸)",
          role: "freezer",
          roleName: "급속 냉동실",
          tempRange: "-15℃ ~ -24℃",
          recommendedItems: ["육류", "생선", "소포장 냉동 식자재", "얼음"],
          features: "직냉식 급속 파이프로 강력한 동결 온도를 유지하는 상단 냉동",
        },
        {
          id: "bot",
          positionLabel: "하단 도어 (냉장 1칸)",
          role: "fridge",
          roleName: "신선 냉장실",
          tempRange: "0℃ ~ +7℃",
          recommendedItems: ["손질 채소", "식당용 반찬통", "소스류", "음료·주류"],
          features: "깊고 넓은 수납 선반 구조로 대형 식재료를 신선하게 보관",
        },
      ],
    };
  }

  // 5. 일반 단문형 또는 기타 냉장고
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
    layout.compartments.find((c) => c.id === selectedId) ?? layout.compartments[0];

  return (
    <section
      aria-label="도어별 구조 및 칸별 역할 원장"
      className={`rounded-2xl border border-[#CBD2DC] bg-white p-5 sm:p-7 shadow-2xs space-y-5 ${className}`.trim()}
    >
      {/* 1. 상단 섹션 헤더 (Dieter Rams Technical Ledger 헤더) */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#E2E6EC]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#141A23] px-2.5 py-0.5 text-hb-xs font-bold text-white">
              <Icon d={ICON.sliders} className="h-3 w-3 text-[#FF8A50]" />
              구조 청사진
            </span>
            {layout.capacity && (
              <span className="rounded-md border border-[#CBD2DC] bg-[#F1F3F6] px-2 py-0.5 text-hb-xs font-bold text-[#141A23] tabular-nums">
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
          <h3 className="mt-2 text-hb-lg sm:text-hb-xl font-bold tracking-[-0.02em] text-[#141A23]">
            {layout.title}
          </h3>
          <p className="mt-0.5 text-hb-sm text-[#64748B]">
            {layout.subtitle}
          </p>
        </div>

        {/* 인터랙션 팁 배지 */}
        <div className="inline-flex items-center gap-1.5 rounded-md bg-[#F7F8FA] px-2.5 py-1 text-hb-xs text-[#64748B] border border-[#E2E6EC]">
          <Icon d={ICON.sparkles} className="h-3.5 w-3.5 text-[#E8521A]" />
          <span>도어 칸을 누르면 상세 스펙이 전환됩니다</span>
        </div>
      </div>

      {/* 2. 메인 시각화: 좌측 실물 모형 캐비닛 + 우측 선택 칸 테크니컬 원장 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-stretch">
        {/* A. 좌측: 스테인리스 스틸 실물 모형 섀시 (Dieter Rams Industrial Blueprint) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl border border-[#CBD2DC] bg-gradient-to-b from-[#F8FAFC] via-[#EDF2F7] to-[#E2E8F0]">
          {/* 캐비닛 상단 디지털 온도 컨트롤러 모형 */}
          <div className="w-full max-w-[240px] mb-2.5 flex items-center justify-between px-3 py-1 rounded bg-[#0F172A] border border-[#334155] text-white">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-hb-xs font-mono font-bold tracking-wider text-[#94A3B8]">
                HANBAT TECH
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-hb-xs font-bold text-[#38BDF8] tabular-nums">
              <span>{activeCompartment.tempRange.split("~")[0].trim()}</span>
              <span className="text-hb-xs text-[#64748B]">SET</span>
            </div>
          </div>

          {/* 실물 캐비닛 본체 */}
          <div className="w-full max-w-[240px] rounded-lg border-2 border-[#94A3B8] bg-[#CBD2DC] p-2 shadow-inner space-y-2">
            {/* 2도어 상하 분할 레이아웃 */}
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
                      className={`w-full text-left rounded-md p-3 relative transition-[border-color,background-color,transform] active:scale-[0.98] ${
                        isSelected
                          ? "ring-2 ring-[#E8521A] shadow-md"
                          : "hover:brightness-95"
                      } ${
                        isFreeze
                          ? "bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white border border-[#334155]"
                          : "bg-gradient-to-br from-[#F0FDFA] to-[#E6F4F1] text-[#141A23] border border-[#99F6E4]"
                      }`}
                    >
                      {/* 가상 손잡이 바 */}
                      <span
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full ${
                          isFreeze ? "bg-[#475569]" : "bg-[#94A3B8]"
                        }`}
                      />

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center justify-center h-4 w-4 rounded-full ${
                            isFreeze
                              ? "bg-[#334155] text-[#38BDF8]"
                              : "bg-[#CCFBF1] text-[#0F766E]"
                          }`}
                        >
                          <Icon
                            d={isFreeze ? ICON.snowflake : ICON.check}
                            className="h-2.5 w-2.5"
                          />
                        </span>
                        <span
                          className={`text-hb-xs font-bold ${
                            isFreeze ? "text-[#94A3B8]" : "text-[#0F766E]"
                          }`}
                        >
                          {comp.positionLabel}
                        </span>
                      </div>

                      <div className="mt-1 font-bold text-hb-sm">
                        {comp.roleName}
                      </div>

                      <div
                        className={`mt-1 inline-flex items-center gap-1 font-mono text-hb-xs font-bold tabular-nums rounded px-1.5 py-0.5 ${
                          isFreeze
                            ? "bg-[#0F172A] text-[#38BDF8]"
                            : "bg-white text-[#0F766E] border border-[#CCFBF1]"
                        }`}
                      >
                        {comp.tempRange}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 4도어 2x2 그리드 레이아웃 */}
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
                      className={`text-left rounded-md p-2.5 relative transition-[border-color,background-color,transform] active:scale-[0.98] ${
                        isSelected
                          ? "ring-2 ring-[#E8521A] shadow-md"
                          : "hover:brightness-95"
                      } ${
                        isFreeze
                          ? "bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white border border-[#334155]"
                          : "bg-gradient-to-br from-[#F0FDFA] to-[#E6F4F1] text-[#141A23] border border-[#99F6E4]"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className={`inline-flex items-center justify-center h-3.5 w-3.5 rounded-full ${
                            isFreeze
                              ? "bg-[#334155] text-[#38BDF8]"
                              : "bg-[#CCFBF1] text-[#0F766E]"
                          }`}
                        >
                          <Icon
                            d={isFreeze ? ICON.snowflake : ICON.check}
                            className="h-2 w-2"
                          />
                        </span>
                        <span
                          className={`text-hb-xs font-bold truncate ${
                            isFreeze ? "text-[#94A3B8]" : "text-[#0F766E]"
                          }`}
                        >
                          {comp.role === "freezer" ? "냉동" : "냉장"}
                        </span>
                      </div>

                      <div className="mt-1 font-bold text-hb-xs truncate">
                        {comp.roleName}
                      </div>

                      <div
                        className={`mt-1 font-mono text-hb-xs font-bold tabular-nums ${
                          isFreeze ? "text-[#38BDF8]" : "text-[#0F766E]"
                        }`}
                      >
                        {comp.tempRange}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 스탠드형 3단 김치냉장고 레이아웃 */}
            {layout.type === "kimchi_3tier" && (
              <div className="space-y-2">
                {layout.compartments.map((comp) => {
                  const isSelected = comp.id === activeCompartment.id;
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => setSelectedId(comp.id)}
                      className={`w-full text-left rounded-md p-2.5 relative transition-[border-color,background-color,transform] active:scale-[0.98] ${
                        isSelected
                          ? "ring-2 ring-[#E8521A] shadow-md"
                          : "hover:brightness-95"
                      } ${
                        comp.role === "kimchi"
                          ? "bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] text-[#141A23] border border-[#FDE68A]"
                          : "bg-gradient-to-br from-[#F0FDFA] to-[#E6F4F1] text-[#141A23] border border-[#99F6E4]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-hb-xs font-bold text-[#64748B]">
                          {comp.positionLabel}
                        </span>
                        <span className="font-mono text-hb-xs font-bold text-[#E8521A] tabular-nums">
                          {comp.tempRange}
                        </span>
                      </div>
                      <div className="mt-1 font-bold text-hb-sm text-[#141A23]">
                        {comp.roleName}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <span className="mt-2 text-hb-xs text-[#64748B] text-center">
            실물 규격 비율 기준 다이어그램
          </span>
        </div>

        {/* B. 우측: 선택된 도어 구역 상세 스펙 원장 (Technical Ledger) */}
        <div className="md:col-span-7 flex flex-col justify-between rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] p-4 sm:p-5">
          <div className="space-y-4">
            {/* 현재 선택 구역 배너 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E6EC]">
              <div>
                <span className="text-hb-xs font-bold text-[#64748B]">
                  선택된 도어 구역
                </span>
                <div className="mt-0.5 flex items-center gap-2">
                  <h4 className="text-hb-base sm:text-hb-lg font-bold text-[#141A23]">
                    {activeCompartment.positionLabel}
                  </h4>
                  <span
                    className={`rounded px-2 py-0.5 text-hb-xs font-bold ${
                      activeCompartment.role === "freezer"
                        ? "bg-[#141A23] text-white"
                        : "bg-[#CCFBF1] text-[#0F766E]"
                    }`}
                  >
                    {activeCompartment.roleName}
                  </span>
                </div>
              </div>

              {/* 온도 범위 하이라이트 */}
              <div className="text-right">
                <span className="text-hb-xs font-bold text-[#64748B]">
                  적정 권장 온도
                </span>
                <div className="font-mono text-hb-base sm:text-hb-lg font-bold text-[#E8521A] tabular-nums">
                  {activeCompartment.tempRange}
                </div>
              </div>
            </div>

            {/* 특징 설명 */}
            {activeCompartment.features && (
              <p className="text-hb-sm text-[#334155] leading-relaxed">
                {activeCompartment.features}
              </p>
            )}

            {/* 추천 보관 품목 (태그 칩) */}
            <div>
              <span className="text-hb-xs font-bold text-[#141A23] block mb-2">
                권장 보관 식자재 및 품목:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeCompartment.recommendedItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E2E6EC] bg-white px-2.5 py-1 text-hb-xs font-bold text-[#141A23]"
                  >
                    <Icon d={ICON.check} className="h-3 w-3 text-[#E8521A]" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 전체 칸 요약 미니 원장 (No Card-in-Card 평탄 표) */}
            <div className="pt-2">
              <span className="text-hb-xs font-bold text-[#64748B] block mb-1.5">
                전체 도어 역할 한눈에 보기
              </span>
              <div className="rounded-lg border border-[#E2E6EC] bg-white divide-y divide-[#E2E6EC] overflow-hidden">
                {layout.compartments.map((comp) => {
                  const isCurrent = comp.id === activeCompartment.id;
                  return (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedId(comp.id)}
                      className={`px-3 py-2 flex items-center justify-between gap-2 text-hb-xs cursor-pointer transition-colors ${
                        isCurrent ? "bg-[#FFF4EE]" : "hover:bg-[#F7F8FA]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            comp.role === "freezer"
                              ? "bg-[#141A23]"
                              : "bg-[#0D9488]"
                          }`}
                        />
                        <span className="font-bold text-[#141A23]">
                          {comp.positionLabel}
                        </span>
                        <span className="text-[#64748B]">
                          ({comp.roleName})
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#334155] tabular-nums">
                        {comp.tempRange}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 냉각 방식 가이드 푸터 */}
          <div className="mt-4 pt-3 border-t border-[#E2E6EC] flex items-start gap-2 text-hb-xs text-[#64748B]">
            <Icon d={ICON.shieldCheck} className="h-4 w-4 text-[#0D9488] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-[#141A23]">
                {layout.coolingType === "미지정" ? "냉각 특성" : `${layout.coolingType} 냉각 시스템`}:
              </strong>{" "}
              {layout.coolingDesc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
