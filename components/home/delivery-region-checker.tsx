// 파일 경로: components/home/delivery-region-checker.tsx
"use client";

import React, { useState } from "react";
import { triggerQuickInquiry } from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";

const ZONES = [
  {
    id: "dj-core",
    label: "대전 중구·서구·유성구",
    tag: "당일·익일 최우선 배차",
    speed: "당일 ~ 익일 직영 배차",
    delivery: "전담 기사 2인 1조 직배송 · 수평 및 기본 급배수 즉시 설치",
    buyback: "무료 방문 견적 · 수거 완료 즉시 현장 100% 당일 현금 송금",
    areas: "중촌동 · 둔산동 · 탄방동 · 갈마동 · 가수원동 · 봉명동 · 노은동",
  },
  {
    id: "dj-east",
    label: "대전 동구·대덕구",
    tag: "당일·익일 직영 배차",
    speed: "당일 ~ 익일 직영 배차",
    delivery: "원룸 3종 패키지 및 업소용 주방 설비 직영 화물 일괄 안착",
    buyback: "가정 이사 가전 및 식당·카페 폐업 집기 방문 철거 · 당일 정산",
    areas: "용전동 · 가오동 · 성남동 · 중리동 · 송촌동 · 법동 · 신탄진동",
  },
  {
    id: "sejong-cj",
    label: "세종 · 청주 권역",
    tag: "익일·맞춤 직배송",
    speed: "익일 또는 희망일 지정 배차",
    delivery: "입주·오픈 희망일 맞춤 직배송 및 에어컨·냉난방기 전문 시공",
    buyback: "오피스텔 퇴실 가전 및 상가·식당 폐업 설비 일괄 방문 매입",
    areas: "세종시 전 지역(나성·다정·보람·조치원) · 청주 흥덕·서원·청원·상당",
  },
  {
    id: "chungnam",
    label: "계룡·공주·논산·천안",
    tag: "충청권 직영 배차",
    speed: "희망 일정 사전 예약 배차",
    delivery: "가정용 대형가전 및 업소용 45박스·쇼케이스·제빙기 안전 직배송",
    buyback: "사전 사진 견적 확인 후 약속 일정에 방문 수거 및 즉시 정산",
    areas: "계룡시 · 공주시 · 논산시 · 금산군 · 천안시 · 아산시 전역",
  },
] as const;

export function DeliveryRegionChecker({ className = "" }: { className?: string }) {
  const [selectedId, setSelectedId] = useState<string>(ZONES[0].id);
  const zone = ZONES.find((z) => z.id === selectedId) || ZONES[0];

  return (
    <div
      aria-label="대전·세종·충청권 직배송 및 방문매입 가능 지역 1초 조회"
      className={`rounded-2xl border border-[#E2E6EC] bg-white overflow-hidden shadow-2xs ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 px-4 py-3 bg-[#F7F8FA] border-b border-[#E2E6EC]">
        <div className="flex items-center gap-2 shrink-0">
          <Icon d={ICON.truck} className="w-4 h-4 text-[#E8521A]" />
          <h3 className="text-hb-sm font-bold text-[#141A23]">
            지역별 직배송 · 방문매입 배차 조회
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5" role="tablist">
          {ZONES.map((z) => {
            const active = z.id === zone.id;
            return (
              <button
                key={z.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedId(z.id)}
                className={`rounded-lg px-3 py-1.5 text-hb-xs font-bold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                  active
                    ? "bg-[#141A23] text-white shadow-2xs"
                    : "bg-white text-[#475569] border border-[#E2E6EC] hover:border-[#CBD2DC] hover:text-[#141A23]"
                }`}
              >
                {z.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3.5 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-hb-xs sm:text-hb-sm">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F0FDFA] border border-[#CCFBF1] px-2.5 py-0.5 text-hb-xs font-bold text-[#0F766E]">
              {zone.speed}
            </span>
            <span className="text-hb-xs text-[#64748B] truncate">
              {zone.areas}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-hb-xs text-[#334155]">
            <p className="truncate">
              <strong className="text-[#0F766E]">직배송:</strong> {zone.delivery}
            </p>
            <p className="truncate">
              <strong className="text-[#E8521A]">방문매입:</strong> {zone.buyback}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            triggerQuickInquiry({
              type: "구매 문의",
              envNote: `희망 배송지역: ${zone.label}`,
            })
          }
          className="hb-btn-outline h-9 px-3.5 text-hb-xs font-bold shrink-0 self-start lg:self-center cursor-pointer"
        >
          <span>이 지역 배차 문의</span>
          <Icon d={ICON.arrow} className="w-3.5 h-3.5 text-[#E8521A]" />
        </button>
      </div>
    </div>
  );
}
