// 파일 경로: components/home/delivery-region-checker.tsx
"use client";

import React, { useState } from "react";
import {
  STORE,
  STORE_MERCHANT_POLICY,
  telHref,
  smsHref,
  trackEvent,
  triggerQuickInquiry,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";

interface RegionZoneSpec {
  id: string;
  label: string;
  shortTag: string;
  dispatchSpeed: string;
  deliverySpec: string;
  buybackSpec: string;
  installNote: string;
  sampleAreas: string;
  tone: "teal" | "cyan" | "orange";
}

const REGION_ZONES: readonly RegionZoneSpec[] = [
  {
    id: "daejeon-core",
    label: "대전 중구 · 서구 · 유성구",
    shortTag: "당일·익일 최우선 배차",
    dispatchSpeed: "당일 ~ 익일 직영 배차",
    deliverySpec: "전담 기사 2인 1조 직배송 · 수평 및 기본 급배수 즉시 설치",
    buybackSpec: "무료 방문 견적 · 수거 완료 즉시 현장 100% 당일 현금 송금",
    installNote: "중촌동 직영 본점 반경 15분~25분 핵심 권역 · 매장 방문 후 당일 상차 가능",
    sampleAreas: "중촌동 · 은행동 · 둔산동 · 탄방동 · 갈마동 · 가수원동 · 봉명동 · 전민동 · 노은동",
    tone: "teal",
  },
  {
    id: "daejeon-east",
    label: "대전 동구 · 대덕구",
    shortTag: "당일·익일 직영 배차",
    dispatchSpeed: "당일 ~ 익일 직영 배차",
    deliverySpec: "전담 기사 직배송 · 원룸 입주 3종 패키지 및 업소용 주방 설비 일괄 안착",
    buybackSpec: "가정 이사 가전 및 식당·카페 폐업 집기 방문 철거 · 당일 현금 정산",
    installNote: "대전 전 지역 직영 화물차 상시 순회 · 기존 노후 가전 동시 수거(보상판매) 지원",
    sampleAreas: "용전동 · 가오동 · 성남동 · 홍도동 · 중리동 · 송촌동 · 법동 · 신탄진동",
    tone: "teal",
  },
  {
    id: "sejong-cheongju",
    label: "세종 · 청주 권역",
    shortTag: "익일·맞춤 직배송",
    dispatchSpeed: "익일 또는 희망일 지정 배차",
    deliverySpec: "아파트·오피스텔·상가 희망 입주일 맞춤 직배송 및 에어컨·냉난방기 전문 시공",
    buybackSpec: "오피스텔·원룸 퇴실 가전 및 상가·식당 폐업 설비 일괄 방문 매입",
    installNote: "묶음 구매(원룸 세트 / 창업 주방 패키지) 시 통합 배차로 운반비 절감",
    sampleAreas: "세종시 전 지역(나성·다정·보람·고운·조치원) · 청주 흥덕구·서원구·청원구·상당구",
    tone: "cyan",
  },
  {
    id: "chungnam-near",
    label: "계룡 · 공주 · 논산 · 금산",
    shortTag: "충남 인접 직영권",
    dispatchSpeed: "1~2일 내 직영 기사 방문",
    deliverySpec: "가정용 대형가전 및 식당·카페 업소용 냉장·주방설비 안전 직배송",
    buybackSpec: "사전 사진 견적 확인 후 약속 일정에 방문 수거 및 현장 즉시 정산",
    installNote: "엘리베이터 유무 또는 1층 상가 진입 여건을 미리 알려주시면 맞춤 배차",
    sampleAreas: "계룡시(엄사·금암) · 공주시(신관·월송) · 논산시(내동·취암) · 금산군 · 옥천군",
    tone: "cyan",
  },
  {
    id: "cheonan-asan",
    label: "천안 · 아산 · 당진 · 평택",
    shortTag: "충청·경기남부 배차",
    dispatchSpeed: "희망 일정 사전 예약 배차",
    deliverySpec: "업소용 45박스 냉장고·쇼케이스·제빙기·중대형 냉난방기 및 묶음 가전 직배송",
    buybackSpec: "식당·카페·베이커리·마트 대량 폐업 설비 및 중고 가전 일괄 방문 매입",
    installNote: "사업자 전자세금계산서 100% 발행 · 출고 전 카톡으로 작동 영상 사전 전송",
    sampleAreas: "천안 서북구·동남구(불당·두정·성정·신부) · 아산 배방·탕정 · 세종 북부권",
    tone: "orange",
  },
  {
    id: "nationwide",
    label: "그 외 전국 안전 화물",
    shortTag: "전국 화물·용달 직송",
    dispatchSpeed: "결제·검수 후 1~3일 내 도착",
    deliverySpec: "출고 전 24시간 시운전 영상 전송 후 전용 완충 포장 · 전국 화물/독차 발송",
    buybackSpec: "대량 업소용 설비·창고 정리 건은 전화 또는 사진 접수로 전국 출장 협의",
    installNote: `수령 후 ${STORE_MERCHANT_POLICY.merchantReturnDays}일 이내 초기 기능 불량 시 무상 교환·A/S 보증 동일 적용`,
    sampleAreas: "서울 · 경기 · 전북(전주·익산·군산) · 경북(구미·김천·상주) · 강원 · 영호남 전역",
    tone: "orange",
  },
] as const;

export function DeliveryRegionChecker({
  className = "",
}: {
  className?: string;
}) {
  const [selectedId, setSelectedId] = useState<string>(REGION_ZONES[0].id);
  const activeZone =
    REGION_ZONES.find((z) => z.id === selectedId) || REGION_ZONES[0];

  const badgeToneClass =
    activeZone.tone === "teal"
      ? "bg-[#F0FDFA] border-[#CCFBF1] text-[#0F766E]"
      : activeZone.tone === "cyan"
      ? "bg-[#F0F9FF] border-[#BAE6FD] text-[#0369A1]"
      : "bg-[#FFF4EE] border-[#FADCD0] text-[#E8521A]";

  const smsDraft = `[${STORE.name} 지역 배차·견적 문의]\n• 희망 지역: ${activeZone.label}\n• 문의 내용(구매 직배송 / 방문매입): `;

  return (
    <div
      aria-label="대전·세종·충청권 직배송 및 방문매입 가능 지역 1초 조회"
      className={`rounded-2xl border border-[#E2E6EC] bg-white overflow-hidden shadow-2xs ${className}`}
    >
      {/* 1. 상단 헤더 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-4 bg-[#F7F8FA] border-b border-[#E2E6EC]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#141A23] text-white">
            <Icon d={ICON.truck} className="w-4 h-4 text-[#FF8A50]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-hb-base sm:text-hb-lg font-bold text-[#141A23] tracking-tight">
                우리 동네 직배송 · 방문매입 배차 1초 조회
              </h3>
              <span className="inline-flex items-center rounded-md border border-[#CCFBF1] bg-[#F0FDFA] px-2 py-0.5 text-hb-xs font-bold text-[#0F766E]">
                직영 기사 배차
              </span>
            </div>
            <p className="text-hb-xs text-[#64748B] truncate">
              지역을 선택하시면 직배송·설치 일정과 당일 현금 방문매입 기준을 바로 확인하실 수 있습니다.
            </p>
          </div>
        </div>

        <a
          href={telHref(STORE.tel)}
          onClick={() =>
            trackEvent("click_tel_consult", {
              location: "delivery_region_checker",
            })
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD2DC] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] active:scale-[0.96] transition-[border-color,transform] duration-150 tabular-nums shrink-0 self-start sm:self-center"
        >
          <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#E8521A]" />
          <span>배차 직통 {STORE.tel}</span>
        </a>
      </div>

      {/* 2. 권역 선택 컨트롤 독 (동심원 곡률: 외곽 p-2 내부 rounded-lg) */}
      <div className="p-2 bg-[#F1F3F6] border-b border-[#E2E6EC]">
        <div
          role="tablist"
          aria-label="배송 및 매입 권역 선택"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5"
        >
          {REGION_ZONES.map((zone) => {
            const isSelected = zone.id === activeZone.id;
            return (
              <button
                key={zone.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedId(zone.id)}
                className={`flex flex-col justify-between rounded-lg px-3 py-2.5 text-left transition-[background-color,color,border-color,box-shadow,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                  isSelected
                    ? "bg-[#141A23] text-white shadow-xs"
                    : "bg-white text-[#141A23] border border-[#E2E6EC] hover:border-[#CBD2DC]"
                }`}
              >
                <span
                  className={`text-hb-xs font-bold leading-snug break-keep ${
                    isSelected ? "text-white" : "text-[#141A23]"
                  }`}
                >
                  {zone.label}
                </span>
                <span
                  className={`mt-1 text-hb-xs font-semibold truncate ${
                    isSelected ? "text-[#FF8A50]" : "text-[#64748B]"
                  }`}
                >
                  {zone.shortTag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 선택 권역 상세 스펙 원장 (No Card-in-Card: divide-y / divide-x 평탄화) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E6EC]">
        {/* 좌측 8열: 배차 속도 · 직배송 설치 · 방문매입 기준 */}
        <div className="lg:col-span-8 divide-y divide-[#E2E6EC]">
          <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-hb-xs font-bold text-[#64748B]">
                선택 권역
              </span>
              <strong className="text-hb-base font-bold text-[#141A23]">
                {activeZone.label}
              </strong>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-hb-xs font-bold tabular-nums ${badgeToneClass}`}
            >
              <Icon d={ICON.clock} className="w-3.5 h-3.5" />
              <span>{activeZone.dispatchSpeed}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E6EC] text-hb-xs sm:text-hb-sm">
            <div className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#0F766E]">
                <Icon d={ICON.check} className="w-4 h-4 shrink-0" />
                <span>구매 시 직배송 · 설치 기준</span>
              </div>
              <p className="text-[#334155] leading-relaxed break-keep">
                {activeZone.deliverySpec}
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#E8521A]">
                <Icon d={ICON.wallet} className="w-4 h-4 shrink-0" />
                <span>처분 시 방문매입 · 철거 기준</span>
              </div>
              <p className="text-[#334155] leading-relaxed break-keep">
                {activeZone.buybackSpec}
              </p>
            </div>
          </div>

          <div className="px-4 py-3 sm:px-5 bg-[#F7F8FA] text-hb-xs text-[#64748B] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <span className="truncate">
              <strong className="text-[#141A23]">주요 배차 동네:</strong>{" "}
              {activeZone.sampleAreas}
            </span>
            <span className="text-[#334155] font-medium shrink-0">
              · {activeZone.installNote}
            </span>
          </div>
        </div>

        {/* 우측 4열: 선택한 지역명이 자동 프리필되는 원클릭 액션 콘솔 */}
        <div className="lg:col-span-4 p-4 sm:p-5 bg-[#F7F8FA]/60 flex flex-col justify-between gap-3">
          <div>
            <span className="text-hb-xs font-bold text-[#E8521A]">
              선택 지역 자동 입력 상담
            </span>
            <p className="mt-1 text-hb-xs sm:text-hb-sm font-bold text-[#141A23] break-keep">
              &lsquo;{activeZone.label}&rsquo; 기준으로 배송비나 방문매입 일정을 바로 물어보세요.
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                trackEvent("begin_buyback_inquiry", {
                  location: "region_checker_buy",
                  category: activeZone.id,
                });
                triggerQuickInquiry({
                  type: "구매 문의",
                  envNote: `희망 배송지역: ${activeZone.label} (${activeZone.dispatchSpeed})`,
                });
              }}
              className="hb-btn-primary h-10 w-full px-4 text-hb-xs font-bold justify-between cursor-pointer"
            >
              <span>이 지역 배송·구매 문의하기</span>
              <Icon d={ICON.arrow} className="w-3.5 h-3.5 text-[#FF8A50]" />
            </button>

            <button
              type="button"
              onClick={() => {
                trackEvent("begin_buyback_inquiry", {
                  location: "region_checker_sell",
                  category: activeZone.id,
                });
                triggerQuickInquiry({
                  type: "내 물건 팔기",
                  envNote: `방문 수거 희망지역: ${activeZone.label}`,
                });
              }}
              className="hb-btn-accent h-10 w-full px-4 text-hb-xs font-bold justify-between cursor-pointer"
            >
              <span>이 지역 방문매입 신청하기</span>
              <Icon d={ICON.arrow} className="w-3.5 h-3.5" />
            </button>

            <a
              href={smsHref(STORE.mobile, smsDraft)}
              onClick={() =>
                trackEvent("click_sms_consult", {
                  location: "region_checker_sms",
                })
              }
              className="hb-btn-outline h-9 w-full px-3 text-hb-xs font-bold justify-center"
            >
              <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#E8521A]" />
              <span>문자로 지역·사진 바로 전송</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
