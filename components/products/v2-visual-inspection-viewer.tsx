// 파일 경로: components/products/v2-visual-inspection-viewer.tsx
"use client";

import React from "react";
import { normalizeProductCategory } from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";

interface BuyerConcernItem {
  no: string;
  question: string;
  answerTitle: string;
  badge: string;
  desc: string;
}

function getBuyerConcernItems(
  categoryRaw?: string | null
): BuyerConcernItem[] {
  const cat = normalizeProductCategory(categoryRaw);

  if (cat === "에어컨/냉난방기") {
    return [
      {
        no: "01",
        question: "Q. 찬바람 토출 및 냉매 누설 검증",
        answerTitle: "실내·실외기 배관 연결 가동 및 정격 냉매 압력 실측 통과",
        badge: "냉난방 성능 보증",
        desc: "정격 냉매 압력 및 토출구 바람 온도 기준 합격 판정 완료",
      },
      {
        no: "02",
        question: "Q. 필터 및 내부 위생·냄새 점검",
        answerTitle: "전면 커버 · 필터 · 냉각핀 분해 고압 살균 세척",
        badge: "분해 고압 세척",
        desc: "열교환기 틈새 고압 세척 및 피톤치드 살균 소독 완료",
      },
      {
        no: "03",
        question: "Q. 설치 후 고장 시 무상 보증",
        answerTitle: "에어컨 핵심 부품 최대 8개월 무상 A/S 책임 보증",
        badge: "최대 8개월 무상보증",
        desc: "콤프레샤·기판 이상 시 직영 기사 무상 출장 수리 및 교환",
      },
      {
        no: "04",
        question: "Q. 실외기 세트 및 시공 여부",
        answerTitle: "정품 실내기 + 실외기 + 리모컨 세트 & 직영 전문 시공",
        badge: "세트 구성 · 직영 시공",
        desc: "호환 검증 정품 세트 완비 및 현장 여건 맞춤 안전 시공",
      },
    ];
  }

  if (cat === "업소용기기") {
    return [
      {
        no: "01",
        question: "Q. 냉동·냉장 목표 온도 도달",
        answerTitle: "연속 부하 시운전 및 디지털 설정 온도 도달 확인",
        badge: "연속 시운전 통과",
        desc: "장시간 연속 가동을 통한 콤프레샤 압축력 및 방열팬 정상 검증",
      },
      {
        no: "02",
        question: "Q. 내부 기름때 및 위생 소독",
        answerTitle: "스텐 선반 · 배수구 · 응축기 고온 스팀 정밀 클리닝",
        badge: "고온 스팀 클리닝",
        desc: "식자재 보관 구역 살균 및 고장 원인 콘덴서 먼지망 청소 완료",
      },
      {
        no: "03",
        question: "Q. 세금계산서 및 무상 보증",
        answerTitle: "전자세금계산서 100% 발행 & 최대 4개월 무상 보증",
        badge: "세금계산서 · 무상A/S",
        desc: "부가세 매입세액 공제 증빙 지원 및 주요 부품 기능 보증",
      },
      {
        no: "04",
        question: "Q. 대형 설비 매장 안착 운반",
        answerTitle: "전문 기사 직배송 · 주방 배치 및 수평 안착 지원",
        badge: "직배송 · 현장 안착",
        desc: "용달 외주 없이 직영 시공팀이 매장 내부까지 직접 운반·설치",
      },
    ];
  }

  return [
    {
      no: "01",
      question: "Q. 모터 소음 · 진동 · 누수 결함",
      answerTitle: "입고 및 세척 전후 2단계 연속 시운전 테스트 통과",
      badge: "2단계 작동 검수",
      desc: "냉각·고속 탈수 모터 소음 및 배수 밸브 누수 정밀 검수 완료",
    },
    {
      no: "02",
      question: "Q. 내부 선반 및 패킹 위생",
      answerTitle: "선반 · 서랍 분해 고압 스팀 살균 및 세척 완료",
      badge: "분해 살균 완료",
      desc: "부품 분리 세척으로 수령 즉시 바로 사용 가능한 청결 상태 출고",
    },
    {
      no: "03",
      question: "Q. 출고 후 사후 무상 보증",
      answerTitle: "주요 가정용 가전 최대 4개월 무상 A/S 책임 보증",
      badge: "최대 4개월 무상보증",
      desc: "보증 기간 내 기능 불량 발생 시 직영 기사 무상 수리 및 동급 교환",
    },
    {
      no: "04",
      question: "Q. 전문 기사 배송 및 기존 가전",
      answerTitle: "전문 기사 맞춤 배송 · 수평 설치 & 폐가전 수거 지원",
      badge: "원스톱 배송·수거",
      desc: "원하는 자리 수평 설치 및 기존 노후 가전 수거·보상매입 일괄 진행",
    },
  ];
}

function getInspectionBadgeStyle(badge: string) {
  if (
    badge.includes("세척") ||
    badge.includes("살균") ||
    badge.includes("클리닝")
  ) {
    return {
      wrap: "bg-[#F0FDFA] border-[#CCFBF1] text-[#0F766E]",
      icon: "text-[#0F766E]",
    };
  }
  if (badge.includes("보증") || badge.includes("무상")) {
    return {
      wrap: "bg-[#FFF5F0] border-[#FADCD0] text-[#D9531E]",
      icon: "text-[#D9531E]",
    };
  }
  if (
    badge.includes("성능") ||
    badge.includes("시운전") ||
    badge.includes("검수")
  ) {
    return {
      wrap: "bg-[#F0F9FF] border-[#BAE6FD] text-[#0369A1]",
      icon: "text-[#0369A1]",
    };
  }
  return {
    wrap: "bg-[#F1F4F9] border-[#D8E1EC] text-[#1E3A5F]",
    icon: "text-[#1E3A5F]",
  };
}

export function V2VisualInspectionViewer({
  category,
  conditionGrade,
}: {
  category?: string | null;
  conditionGrade?: string | null;
}) {
  const catLabel = normalizeProductCategory(category);
  const items = getBuyerConcernItems(catLabel);
  const displayGrade = conditionGrade || "A급 (검수완료)";
  const warrantyText =
    catLabel === "에어컨/냉난방기"
      ? "최대 8개월 무상보증"
      : "최대 4개월 무상보증";

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[#E5E2DC] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="space-y-4">
        {/* 상단 헤더 */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E5E2DC] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-[#0E1A2B] px-2.5 py-1 text-hb-xs font-bold text-white">
                한밭중고전자 4대 부위별 정밀 검수 리포트
              </span>
              <span className="rounded-md bg-[#FFF5F0] border border-[#FADCD0] px-2.5 py-1 text-hb-xs font-bold text-[#D9531E]">
                {catLabel}
              </span>
            </div>
            <h3 className="mt-2.5 text-hb-lg sm:text-hb-xl font-extrabold text-[#0E1A2B] tracking-tight">
              실물 출고 전 4대 핵심 품질 검수 기준
            </h3>
            <p className="mt-1 text-hb-xs text-[#646E7E]">
              입고 후 분해 고압세척 · 부하 시운전 · 무상 A/S 책임 보증 기준을 확인하세요.
            </p>
          </div>

          <div className="rounded-xl border border-[#FADCD0] bg-[#FFF5F0] px-3.5 py-2 text-right shrink-0">
            <span className="block text-hb-xs font-semibold text-[#B5431A]">
              본 매물 등급 · 보증
            </span>
            <strong className="text-hb-sm font-extrabold text-[#D9531E]">
              {displayGrade} · {warrantyText}
            </strong>
          </div>
        </div>

        {/* 4대 소비자 질문 & 해결 카드 (2×2 그리드) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => {
            const badgeStyle = getInspectionBadgeStyle(item.badge);
            return (
              <div
                key={item.no}
                className="flex flex-col justify-between rounded-xl border border-[#E5E2DC] bg-[#FAF9F7]/75 p-4 hover:border-[#0E1A2B] hover:bg-white transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#0E1A2B] text-hb-xs font-extrabold text-white">
                      {item.no}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-hb-xs font-bold shrink-0 ${badgeStyle.wrap}`}
                    >
                      <Icon
                        d={ICON.check}
                        className={`w-3 h-3 shrink-0 ${badgeStyle.icon}`}
                      />
                      <span>{item.badge}</span>
                    </span>
                  </div>

                  <p className="text-hb-xs font-bold text-[#D9531E] leading-snug break-keep">
                    {item.question}
                  </p>
                  <h4 className="mt-1 text-hb-sm font-extrabold text-[#0E1A2B] leading-snug break-keep">
                    {item.answerTitle}
                  </h4>
                  <p className="mt-1.5 text-hb-xs leading-relaxed text-[#3E4756] break-keep">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 쇼룸 실물 확인 안내 */}
      <div className="rounded-xl bg-[#FAF9F7] border border-[#E5E2DC] px-4 py-3 flex items-center gap-2.5 text-hb-xs text-[#3E4756]">
        <Icon d={ICON.pin} className="w-4 h-4 text-[#D9531E] shrink-0" />
        <span className="break-keep">
          <strong>대전 중촌동 1·2층 직영 매장 상시 개방:</strong> 사진만으로 결정하기 망설여지신다면 매장에 오셔서 직접 전원을 켜보고 선택하셔도 됩니다.
        </span>
      </div>
    </div>
  );
}
