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
        question: "Q. 중고 에어컨인데 찬바람이 약하거나 가스가 새진 않나요?",
        answerTitle: "실내기·실외기 연결 가동 및 냉매 압력 실측 통과",
        badge: "냉난방 성능 보증",
        desc: "입고 후 단순 전원만 켜보는 것이 아니라 배관을 직접 연결해 정격 냉매 압력과 토출구 바람 온도가 정상 기준에 도달하는지 시운전으로 확인합니다.",
      },
      {
        no: "02",
        question: "Q. 남이 쓰던 거라 안에서 곰팡이 냄새가 나진 않을까요?",
        answerTitle: "전면 커버·필터·열교환기(냉각핀) 분해 고압 살균",
        badge: "분해 고압 세척",
        desc: "겉면만 닦아서 보내지 않습니다. 케이스와 필터를 분리한 뒤 고압 세척 장비로 냉각핀 틈새의 묵은 먼지와 냄새 원인균까지 깨끗하게 씻어냅니다.",
      },
      {
        no: "03",
        question: "Q. 설치하고 얼마 안 돼서 고장 나면 수리비가 더 들지 않나요?",
        answerTitle: "개인 직거래와 다른 최대 8개월 무상 A/S 책임 보증",
        badge: "최대 8개월 무상보증",
        desc: "정상 사용 중 기기 기능 불량(콤프레샤·기판·냉매 누설 등) 발생 시 한밭중고전자 전문 기사가 직접 방문 수리 또는 동급 제품으로 교환해 드립니다. (계약 조건 기준)",
      },
      {
        no: "04",
        question: "Q. 구매하면 어떤 구성품이 오고, 설치는 누가 해주나요?",
        answerTitle: "실내기 + 전용 실외기 + 리모컨 세트 구성 & 전문 기사 시공",
        badge: "세트 구성 · 직영 시공",
        desc: "호환 문제없는 정품 실내기·실외기 1:1 세트와 작동 확인된 리모컨을 함께 준비하며, 매장 전문 시공팀이 현장 여건에 맞춰 직접 운반·설치해 드립니다.",
      },
    ];
  }

  if (cat === "업소용기기") {
    return [
      {
        no: "01",
        question: "Q. 영업장에 쓸 건데 냉동·냉장 온도가 안 떨어지면 어떡하죠?",
        answerTitle: "연속 가동 테스트로 영하/냉장 설정 온도 도달 완벽 확인",
        badge: "연속 시운전 통과",
        desc: "식자재를 보관하는 업소용 설비 특성상 출고 전 장시간 연속 가동을 통해 콤프레샤 힘과 디지털 온도 조절기 편차, 방열팬 상태를 철저히 검증합니다.",
      },
      {
        no: "02",
        question: "Q. 이전 가게 기름때나 음식물 냄새가 배어 있진 않나요?",
        answerTitle: "내부 스텐 선반·배수로·외부 광택까지 고온 스팀 살균",
        badge: "고온 스팀 클리닝",
        desc: "내부 스테인리스 벽면과 선반, 바닥 배수로, 그리고 고장 원인이 되는 응축기(콘덴서) 먼지망까지 고압 스팀과 전용 세제로 깨끗이 세척합니다.",
      },
      {
        no: "03",
        question: "Q. 중고 주방기기도 세금계산서 발행과 무상 A/S가 되나요?",
        answerTitle: "전자세금계산서 100% 발행 & 계약 조건별 최대 4개월 보증",
        badge: "세금계산서 · 무상A/S",
        desc: "창업 비용 처리를 위한 전자세금계산서·카드결제·현금영수증을 모두 지원하며, 출고 후 초기 작동 불량에 대해 무상 A/S를 책임 보증합니다.",
      },
      {
        no: "04",
        question: "Q. 무거운 업소용 장비를 매장 안까지 어떻게 옮기나요?",
        answerTitle: "전문 기사 직접 운반 · 주방 배치 · 수평 및 전원 연결",
        badge: "직배송 · 현장 안착",
        desc: "용달차를 따로 부르실 필요 없이 한밭중고전자 배송팀이 매장 주방 원하시는 자리까지 반입하여 수평 조절과 시운전까지 마쳐 드립니다.",
      },
    ];
  }

  return [
    {
      no: "01",
      question: "Q. 중고 냉장고·세탁기인데 소음이 심하거나 작동이 안 되면요?",
      answerTitle: "입고 직후 + 세척 후 2차례 연속 시운전 테스트 통과",
      badge: "2단계 작동 검수",
      desc: "냉장·냉동 온도 유지력, 세탁·헹굼·고속 탈수 시의 모터 소음과 진동, 배수 밸브 누수 여부를 출고 전 연속 가동으로 꼼꼼히 확인합니다.",
    },
    {
      no: "02",
      question: "Q. 남이 쓰던 가전이라 내부 위생 상태가 제일 걱정돼요.",
      answerTitle: "선반·서랍·세탁조 거름망 분리 후 고압 스팀 살균 세척",
      badge: "분해 살균 완료",
      desc: "부품을 하나하나 분리하여 고압 세척기와 살균 소독제로 보이지 않는 고무패킹 틈새 오염까지 제거한 뒤 출고하므로 받으신 즉시 사용하실 수 있습니다.",
    },
    {
      no: "03",
      question: "Q. 사서 쓰다가 고장 나면 개인 직거래처럼 내 돈으로 고쳐야 하나요?",
      answerTitle: "주요 가정용 가전 최대 4개월 무상 A/S 책임 보증",
      badge: "최대 4개월 무상보증",
      desc: "개인 중고거래의 가장 큰 불안인 '거래 직후 고장' 걱정을 덜어드리도록, 보증 기간 내 기능 불량 발생 시 무상 수리 또는 동급 교환을 보장합니다.",
    },
    {
      no: "04",
      question: "Q. 무거운 가전 운반과 기존에 쓰던 고장 난 가전 처리는요?",
      answerTitle: "전문 기사 직접 배송·수평 설치 & 기존 가전 동시 수거 가능",
      badge: "원스톱 배송·수거",
      desc: "설치 자리에 맞춰 수평과 급·배수 호스까지 연결해 드리며, 쓰시던 기존 가전 보상매입(차액 차감)이나 폐가전 동시 수거도 한 번에 해결해 드립니다.",
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
                안심 구매 체크포인트
              </span>
              <span className="rounded-md bg-[#FFF5F0] border border-[#FADCD0] px-2.5 py-1 text-hb-xs font-bold text-[#D9531E]">
                {catLabel}
              </span>
            </div>
            <h3 className="mt-2.5 text-hb-lg sm:text-hb-xl font-extrabold text-[#0E1A2B] tracking-tight">
              중고 구매 전 가장 걱정되는 4가지, 이렇게 해결합니다
            </h3>
            <p className="mt-1 text-hb-xs text-[#646E7E]">
              개인 중고거래와 무엇이 다른지 출고 검수 기준과 보증 범위를 먼저 확인해 보세요.
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
