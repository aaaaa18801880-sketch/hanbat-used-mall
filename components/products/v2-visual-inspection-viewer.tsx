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
  tone: "cyan" | "teal" | "orange";
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
        question: "찬바람이 약하거나 냉매 가스가 새진 않나요?",
        answerTitle: "실내기·실외기 연결 가동 및 냉매 압력 실측 통과",
        badge: "냉난방 성능 실측",
        tone: "cyan",
        desc: "단순 전원만 켜보는 것이 아니라 배관을 직접 연결해 정격 냉매 압력과 토출구 바람 온도가 정상 기준에 도달하는지 시운전으로 확인합니다.",
      },
      {
        no: "02",
        question: "남이 쓰던 거라 안에서 곰팡이 냄새가 나진 않을까요?",
        answerTitle: "전면 커버·필터·열교환기(냉각핀) 분해 고압 살균",
        badge: "분해 고압 살균",
        tone: "teal",
        desc: "케이스와 필터를 분리한 뒤 고압 세척 장비로 냉각핀 틈새의 묵은 먼지와 냄새 원인균까지 깨끗하게 씻어내어 쾌적하게 출고합니다.",
      },
      {
        no: "03",
        question: "설치하고 얼마 안 돼서 고장 나면 수리비가 들지 않나요?",
        answerTitle: "개인 직거래와 다른 최대 8개월 무상 A/S 책임 보증",
        badge: "최대 8개월 보증",
        tone: "orange",
        desc: "정상 사용 중 기기 기능 불량(콤프레샤·기판·냉매 누설 등) 발생 시 매장 전문 기사가 직접 방문 수리 또는 동급 제품으로 교환해 드립니다.",
      },
      {
        no: "04",
        question: "구매하면 어떤 구성품이 오고, 설치는 누가 해주나요?",
        answerTitle: "실내기 + 전용 실외기 + 리모컨 세트 & 전문 기사 시공",
        badge: "풀세트 · 직영 시공",
        tone: "cyan",
        desc: "호환 문제없는 정품 실내기·실외기 1:1 세트와 작동 확인된 리모컨을 함께 준비하며, 전문 시공팀이 현장 여건에 맞춰 직접 설치해 드립니다.",
      },
    ];
  }

  if (cat === "업소용기기") {
    return [
      {
        no: "01",
        question: "영업장에 쓸 건데 냉동·냉장 온도가 안 떨어지면 어떡하죠?",
        answerTitle: "연속 가동 테스트로 영하/냉장 설정 온도 도달 확인",
        badge: "연속 시운전 통과",
        tone: "cyan",
        desc: "식자재를 보관하는 업소용 설비 특성상 출고 전 장시간 연속 가동을 통해 콤프레샤 힘과 디지털 온도 조절기 편차, 방열팬 상태를 검증합니다.",
      },
      {
        no: "02",
        question: "이전 가게 기름때나 음식물 냄새가 배어 있진 않나요?",
        answerTitle: "내부 스텐 선반·배수로·외부 광택까지 고온 스팀 살균",
        badge: "고온 스팀 클리닝",
        tone: "teal",
        desc: "내부 스테인리스 벽면과 선반, 바닥 배수로, 그리고 고장 원인이 되는 응축기(콘덴서) 먼지망까지 고압 스팀과 전용 세제로 세척합니다.",
      },
      {
        no: "03",
        question: "중고 주방기기도 세금계산서 발행과 무상 A/S가 되나요?",
        answerTitle: "전자세금계산서 100% 발행 & 계약 조건별 최대 4개월 보증",
        badge: "세금계산서 · 무상A/S",
        tone: "orange",
        desc: "창업 비용 처리를 위한 전자세금계산서·카드결제·현금영수증을 모두 지원하며, 출고 후 초기 작동 불량에 대해 무상 A/S를 책임 보증합니다.",
      },
      {
        no: "04",
        question: "무거운 업소용 장비를 매장 안까지 어떻게 옮기나요?",
        answerTitle: "전문 기사 직접 운반 · 주방 배치 · 수평 및 전원 연결",
        badge: "직배송 · 현장 안착",
        tone: "teal",
        desc: "용달차를 따로 부르실 필요 없이 한밭중고전자 배송팀이 매장 주방 원하시는 자리까지 반입하여 수평 조절과 시운전까지 마쳐 드립니다.",
      },
    ];
  }

  return [
    {
      no: "01",
      question: "중고 냉장고·세탁기인데 소음이 심하거나 작동이 안 되면요?",
      answerTitle: "입고 직후 + 세척 후 2차례 연속 시운전 테스트 통과",
      badge: "2단계 작동 검수",
      tone: "cyan",
      desc: "냉장·냉동 온도 유지력, 세탁·헹굼·고속 탈수 시의 모터 소음과 진동, 배수 밸브 누수 여부를 출고 전 연속 가동으로 꼼꼼히 확인합니다.",
    },
    {
      no: "02",
      question: "남이 쓰던 가전이라 내부 위생 상태가 제일 걱정돼요.",
      answerTitle: "선반·서랍·세탁조 분리 후 고압 스팀 살균 세척",
      badge: "분해 살균 완료",
      tone: "teal",
      desc: "부품을 분리하여 고압 세척기와 살균 소독제로 보이지 않는 고무패킹 틈새 오염까지 제거한 뒤 출고하므로 받으신 즉시 사용하실 수 있습니다.",
    },
    {
      no: "03",
      question: "사서 쓰다가 고장 나면 개인 직거래처럼 내 돈으로 고쳐야 하나요?",
      answerTitle: "주요 가정용 가전 최대 4개월 무상 A/S 책임 보증",
      badge: "최대 4개월 보증",
      tone: "orange",
      desc: "개인 중고거래의 가장 큰 불안인 '거래 직후 고장' 걱정을 덜어드리도록, 보증 기간 내 기능 불량 발생 시 무상 수리 또는 동급 교환을 보장합니다.",
    },
    {
      no: "04",
      question: "무거운 가전 운반과 기존에 쓰던 고장 난 가전 처리는요?",
      answerTitle: "전문 기사 직접 배송·수평 설치 & 기존 가전 동시 수거",
      badge: "원스톱 배송·수거",
      tone: "teal",
      desc: "설치 자리에 맞춰 수평과 급·배수 호스까지 연결해 드리며, 쓰시던 기존 가전 보상매입(차액 차감)이나 폐가전 동시 수거도 한 번에 해결해 드립니다.",
    },
  ];
}

const TONE_BADGE_STYLE = {
  cyan: "bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]",
  teal: "bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]",
  orange: "bg-[#FFF5F0] text-[#D9531E] border-[#FADCD0]",
} as const;

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
    <div className="hb-surface-card flex h-full flex-col justify-between overflow-hidden">
      {/* 상단 헤더 (중첩 박스 없이 하단 보더로만 분리) */}
      <div className="border-b border-[#E5E8EB] bg-gradient-to-r from-[#FAF9F7] via-white to-[#F0FDFA]/50 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#0E1A2B] px-2.5 py-1 text-hb-xs font-bold text-white whitespace-nowrap">
              안심 출고 검수 리포트
            </span>
            <span className="rounded-md border border-[#CCFBF1] bg-[#F0FDFA] px-2.5 py-1 text-hb-xs font-bold text-[#0F766E] whitespace-nowrap">
              {catLabel}
            </span>
          </div>

          <span className="rounded-full border border-[#FADCD0] bg-[#FFF5F0] px-3 py-1 text-hb-xs font-bold text-[#D9531E] whitespace-nowrap tabular-nums">
            {displayGrade} · {warrantyText}
          </span>
        </div>

        <h3 className="mt-3 text-hb-lg sm:text-hb-xl font-bold text-[#0E1A2B] tracking-tight">
          중고 구매 전 가장 걱정되는 4가지, 이렇게 해결합니다
        </h3>
        <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#334155]">
          입고 기능 진단 → 분해 고압 살균 → 출고 전 연속 시운전을 통과한 실매물입니다.
        </p>
      </div>

      {/* 본문 2×2 에디토리얼 그리드 (No Card-in-Card: 얇은 구분선과 여백만 사용) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E8EB] flex-1">
        <div className="divide-y divide-[#E5E8EB]">
          {items.slice(0, 2).map((item) => (
            <div key={item.no} className="p-5 sm:p-6 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-hb-xs font-bold text-[#64748B] tabular-nums">
                  CHECK {item.no}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-hb-xs font-bold whitespace-nowrap ${
                    TONE_BADGE_STYLE[item.tone]
                  }`}
                >
                  <Icon d={ICON.check} className="w-3 h-3 shrink-0" />
                  <span>{item.badge}</span>
                </span>
              </div>
              <p className="text-hb-xs font-bold text-[#D9531E] leading-snug break-keep">
                Q. {item.question}
              </p>
              <h4 className="text-hb-sm sm:text-hb-base font-bold text-[#0E1A2B] leading-snug break-keep">
                {item.answerTitle}
              </h4>
              <p className="text-hb-xs sm:text-hb-sm leading-[1.65] text-[#334155] break-keep pt-0.5">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="divide-y divide-[#E5E8EB]">
          {items.slice(2, 4).map((item) => (
            <div key={item.no} className="p-5 sm:p-6 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-hb-xs font-bold text-[#64748B] tabular-nums">
                  CHECK {item.no}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-hb-xs font-bold whitespace-nowrap ${
                    TONE_BADGE_STYLE[item.tone]
                  }`}
                >
                  <Icon d={ICON.check} className="w-3 h-3 shrink-0" />
                  <span>{item.badge}</span>
                </span>
              </div>
              <p className="text-hb-xs font-bold text-[#D9531E] leading-snug break-keep">
                Q. {item.question}
              </p>
              <h4 className="text-hb-sm sm:text-hb-base font-bold text-[#0E1A2B] leading-snug break-keep">
                {item.answerTitle}
              </h4>
              <p className="text-hb-xs sm:text-hb-sm leading-[1.65] text-[#334155] break-keep pt-0.5">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 푸터 스트립 */}
      <div className="border-t border-[#E5E8EB] bg-[#FAF9F7] px-5 py-3.5 text-hb-xs text-[#334155] flex items-center gap-2">
        <Icon d={ICON.pin} className="w-4 h-4 text-[#0D9488] shrink-0" />
        <span className="break-keep">
          <strong>대전 중촌동 1·2층 직영 쇼룸 상시 개방:</strong> 매장에 방문하시면 구매 전 직접 전원을 켜고 냉기·작동 상태를 확인하실 수 있습니다.
        </span>
      </div>
    </div>
  );
}
