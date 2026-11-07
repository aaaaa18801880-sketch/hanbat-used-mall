// 파일 경로: components/home/delivery-region-checker.tsx
"use client";

import React, { useState } from "react";
import { STORE, telHref, smsHref, trackEvent, triggerQuickInquiry } from "../../lib/site";
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
  const smsDraft = `[${STORE.name} 지역 배차문의] 희망지역: ${zone.label} / 문의내용: `;

  return (
    <div
      aria-label="대전·세종·충청권 직배송 및 방문매입 가능 지역 1초 조회"
      className={`rounded-2xl border border-[#E2E6EC] bg-white overflow-hidden shadow-2xs ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-[#F7F8FA] border-b border-[#E2E6EC]">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#141A23] text-white">
            <Icon d={ICON.truck} className="w-4 h-4 text-[#FF8A50]" />
          </span>
          <h3 className="text-hb-base font-bold text-[#141A23]">
            우리 동네 직배송 · 방문매입 배차 1초 조회
          </h3>
        </div>
        <a
          href={telHref(STORE.tel)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD2DC] bg-white px-3 py-1 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] active:scale-[0.96] transition-[border-color,transform] tabular-nums"
        >
          <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#E8521A]" />
          <span>배차 직통 {STORE.tel}</span>
        </a>
      </div>

      <div className="p-2 bg-[#F1F3F6] border-b border-[#E2E6EC] grid grid-cols-2 lg:grid-cols-4 gap-1.5" role="tablist">
        {ZONES.map((z) => {
          const active = z.id === zone.id;
          return (
            <button
              key={z.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedId(z.id)}
              className={`rounded-lg px-3 py-2 text-left transition-[background-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                active ? "bg-[#141A23] text-white shadow-xs" : "bg-white text-[#141A23] border border-[#E2E6EC]"
              }`}
            >
              <strong className="block text-hb-xs font-bold truncate">{z.label}</strong>
              <span className={`block text-hb-xs font-semibold truncate ${active ? "text-[#FF8A50]" : "text-[#64748B]"}`}>
                {z.tag}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E6EC]">
        <div className="lg:col-span-8 divide-y divide-[#E2E6EC] text-hb-xs sm:text-hb-sm">
          <div className="px-5 py-3 flex items-center justify-between gap-2">
            <strong className="text-hb-sm font-bold text-[#141A23]">{zone.label}</strong>
            <span className="rounded-full bg-[#F0FDFA] border border-[#CCFBF1] px-2.5 py-0.5 text-hb-xs font-bold text-[#0F766E]">
              {zone.speed}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E6EC]">
            <div className="p-4">
              <span className="font-bold text-[#0F766E] block mb-1">구매 직배송 · 설치</span>
              <p className="text-[#334155] leading-relaxed break-keep">{zone.delivery}</p>
            </div>
            <div className="p-4">
              <span className="font-bold text-[#E8521A] block mb-1">방문매입 · 폐업철거</span>
              <p className="text-[#334155] leading-relaxed break-keep">{zone.buyback}</p>
            </div>
          </div>
          <div className="px-5 py-2.5 bg-[#F7F8FA] text-hb-xs text-[#64748B] truncate">
            <strong className="text-[#141A23]">주요 배차 동네:</strong> {zone.areas}
          </div>
        </div>

        <div className="lg:col-span-4 p-4 bg-[#F7F8FA]/60 flex flex-col justify-center gap-2">
          <button
            type="button"
            onClick={() => triggerQuickInquiry({ type: "구매 문의", envNote: `희망 배송지역: ${zone.label}` })}
            className="hb-btn-primary h-10 w-full px-4 text-hb-xs font-bold justify-between cursor-pointer"
          >
            <span>이 지역 배송·구매 문의</span>
            <Icon d={ICON.arrow} className="w-3.5 h-3.5 text-[#FF8A50]" />
          </button>
          <button
            type="button"
            onClick={() => triggerQuickInquiry({ type: "내 물건 팔기", envNote: `방문 수거 지역: ${zone.label}` })}
            className="hb-btn-accent h-10 w-full px-4 text-hb-xs font-bold justify-between cursor-pointer"
          >
            <span>이 지역 방문매입 신청</span>
            <Icon d={ICON.arrow} className="w-3.5 h-3.5" />
          </button>
          <a
            href={smsHref(STORE.mobile, smsDraft)}
            onClick={() => trackEvent("click_sms_consult", { location: "region_checker_sms" })}
            className="hb-btn-outline h-9 w-full px-3 text-hb-xs font-bold justify-center"
          >
            <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#E8521A]" />
            <span>문자로 지역·사진 전송</span>
          </a>
        </div>
      </div>
    </div>
  );
}
