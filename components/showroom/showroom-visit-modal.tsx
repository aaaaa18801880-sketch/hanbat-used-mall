// 파일 경로: components/showroom/showroom-visit-modal.tsx
"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  STORE,
  STORE_NAVIGATION,
  smsHref,
  buildShowroomVisitSmsBody,
  formatProductPrice,
  normalizeProductCategory,
  trackEvent,
} from "../../lib/site";
import { Icon, ICON, Modal, SafeImg } from "../../lib/ui";

export interface ShowroomVisitProduct {
  id?: string;
  title: string;
  category?: string;
  price?: number | null;
  modelName?: string | null;
  imageUrl?: string | null;
}

const VISIT_TIME_OPTIONS = [
  "오늘 오후 (14:00~17:00)",
  "오늘 저녁 (17:00~19:00)",
  "내일 방문 (09:00~18:00)",
  "주말/기타 일정 문의",
] as const;

export function ShowroomVisitModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product?: ShowroomVisitProduct;
}) {
  const [selectedTime, setSelectedTime] = useState<string>(
    VISIT_TIME_OPTIONS[0]
  );

  if (!open) return null;

  const cat = product ? normalizeProductCategory(product.category) : "";
  const priceDisplay = product ? formatProductPrice(product.price, cat) : "";
  const smsBody = buildShowroomVisitSmsBody({
    product: product
      ? {
          id: product.id,
          title: product.title,
          category: product.category,
          modelName: product.modelName,
          price: product.price,
        }
      : undefined,
    visitTime: selectedTime,
  });

  const handleCopyAddress = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(STORE.roadAddress);
        trackEvent("click_copy_address");
        toast.success("매장 도로명 주소가 복사되었습니다.");
      }
    } catch {
      toast.error("주소 복사에 실패했습니다.");
    }
  };

  const handleKakaoVisit = async () => {
    try {
      trackEvent("send_showroom_visit_kakao", {
        hasProduct: Boolean(product),
      });
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(smsBody);
      }
      toast.success(
        "방문 예약 내용이 복사되었습니다! 카카오톡 상담창에 붙여넣기(Ctrl+V) 해주세요.",
        { duration: 4000 }
      );
      window.open(STORE.kakaoChat, "_blank", "noopener,noreferrer");
    } catch {
      window.open(STORE.kakaoChat, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="직영 쇼룸 방문 및 실물 확인 예약"
      panelClassName="max-w-2xl"
    >
      <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-[#E5E2DC] bg-white shadow-2xl">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-[#E5E2DC] bg-[#0E1A2B] px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#FF8A50]/20 text-[#FF8A50]">
              <Icon d={ICON.pin} className="w-4 h-4" />
            </div>
            <div>
              <span className="text-hb-xs font-bold text-[#FF8A50]">
                대전 중촌동 1·2층 직영 쇼룸
              </span>
              <h2 className="text-hb-base sm:text-hb-lg font-extrabold text-white">
                매장 방문 실물 확인 &amp; 1초 길찾기
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <Icon d={ICON.close} className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. 실물 찜 대상 상품 요약 (선택된 상품이 있는 경우) */}
          {product && (
            <div className="rounded-xl border border-[#FADCD0] bg-[#FFF5F0] p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#FADCD0]/60 text-hb-xs font-bold text-[#D9531E]">
                <span>실물 확인 예약 대상 매물</span>
                <span className="rounded bg-[#D9531E] px-1.5 py-0.5 text-white">
                  방문 전 실물 찜
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                {product.imageUrl && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#E5E2DC] bg-white">
                    <SafeImg
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-hb-xs font-bold text-[#646E7E]">
                    [{cat}] {product.modelName ? `모델명: ${product.modelName}` : ""}
                  </span>
                  <h3 className="truncate text-hb-sm font-extrabold text-[#0E1A2B]">
                    {product.title}
                  </h3>
                  <span className="text-hb-sm font-bold text-[#D9531E] tabular-nums">
                    {priceDisplay}
                  </span>
                </div>
              </div>
              <p className="mt-2.5 text-hb-xs text-[#3E4756] leading-relaxed">
                ※ 방문 전 예약 문자를 남겨주시면, 오시는 동안 타 고객에게 판매되지 않도록 우선 안내해 드리고 매장에서 전원을 미리 연결하여 시운전 준비를 해드립니다.
              </p>
            </div>
          )}

          {/* 2. 방문 예정 시간대 선택 */}
          <div>
            <label className="block text-hb-xs sm:text-hb-sm font-bold text-[#0E1A2B] mb-2">
              방문 희망 일정 선택
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VISIT_TIME_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedTime(opt)}
                  className={`flex items-center justify-between rounded-lg border p-2.5 text-hb-xs sm:text-hb-sm font-bold transition-all text-left ${
                    selectedTime === opt
                      ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E] shadow-2xs"
                      : "border-[#E5E2DC] bg-[#FAF9F7] text-[#3E4756] hover:border-[#0E1A2B]"
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {selectedTime === opt && (
                    <Icon d={ICON.check} className="w-4 h-4 shrink-0 text-[#D9531E]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 1초 원터치 예약 문자 / 카톡 전송 버튼 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={smsHref(STORE.mobile, smsBody)}
              onClick={() => {
                trackEvent("send_showroom_visit_sms", {
                  hasProduct: Boolean(product),
                });
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0E1A2B] hover:bg-[#1A2E4C] h-12 px-4 text-hb-sm font-bold text-white transition-colors shadow-2xs"
            >
              <Icon d={ICON.phone} className="w-4 h-4 text-[#FF8A50]" />
              <span>문자로 방문 예약 및 실물 찜</span>
            </a>
            <button
              type="button"
              onClick={handleKakaoVisit}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] hover:bg-[#F2D900] h-12 px-4 text-hb-sm font-bold text-[#191600] transition-colors shadow-2xs"
            >
              <Icon d={ICON.chat} className="w-4 h-4" />
              <span>카카오톡 방문 예약 상담</span>
            </button>
          </div>

          {/* 4. 내비게이션 3사 원클릭 길찾기 */}
          <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-hb-xs font-bold text-[#646E7E] uppercase">
                ONE-CLICK NAVIGATION
              </span>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#D9531E] hover:underline"
              >
                <Icon d={ICON.copy} className="w-3.5 h-3.5" />
                <span>도로명 주소 복사</span>
              </button>
            </div>

            <div>
              <p className="text-hb-sm font-extrabold text-[#0E1A2B]">
                {STORE_NAVIGATION.roadAddress}
              </p>
              <p className="text-hb-xs text-[#646E7E] mt-0.5">
                지번: {STORE_NAVIGATION.jibunAddress} ({STORE_NAVIGATION.addressNote})
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <a
                href={STORE_NAVIGATION.naverMap}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("click_nav_naver")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[#03C75A]/30 bg-[#03C75A]/10 hover:bg-[#03C75A]/20 px-2 py-2.5 text-hb-xs font-bold text-[#03C75A] transition-colors"
              >
                <span>네이버 지도</span>
                <Icon d={ICON.external} className="w-3 h-3" />
              </a>
              <a
                href={STORE_NAVIGATION.kakaoMap}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("click_nav_kakao")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[#FEE500]/50 bg-[#FEE500]/20 hover:bg-[#FEE500]/30 px-2 py-2.5 text-hb-xs font-bold text-[#191600] transition-colors"
              >
                <span>카카오맵</span>
                <Icon d={ICON.external} className="w-3 h-3" />
              </a>
              <a
                href={STORE_NAVIGATION.tmapUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("click_nav_tmap")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E2DC] bg-white hover:bg-[#F0EDE7] px-2 py-2.5 text-hb-xs font-bold text-[#0E1A2B] transition-colors"
              >
                <span>티맵 길안내</span>
                <Icon d={ICON.external} className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 5. 1층 / 2층 쇼룸 층별 안내 & 주차 */}
          <div className="rounded-xl border border-[#E5E2DC] bg-white p-4 space-y-3">
            <span className="text-hb-xs font-bold text-[#646E7E]">
              쇼룸 층별 안내 &amp; 방문 편의
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-hb-xs">
              {STORE_NAVIGATION.floorGuide.map((f) => (
                <div
                  key={f.floor}
                  className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-2.5"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-extrabold text-[#0E1A2B] text-hb-sm">
                      {f.floor} · {f.title}
                    </span>
                    <span className="rounded bg-white border border-[#E5E2DC] px-1.5 py-0.5 text-hb-xs font-semibold text-[#646E7E]">
                      {f.badge}
                    </span>
                  </div>
                  <p className="text-[#646E7E] leading-relaxed">{f.items}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E2DC] pt-3 text-hb-xs text-[#3E4756]">
              <div className="flex items-center gap-1.5 font-bold text-[#0E1A2B]">
                <Icon d={ICON.check} className="w-3.5 h-3.5 text-[#D9531E]" />
                <span>{STORE_NAVIGATION.parking}</span>
              </div>
              <div className="text-[#646E7E]">
                <span>영업시간: {STORE_NAVIGATION.hours} ({STORE_NAVIGATION.closed})</span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 닫기 바 */}
        <div className="border-t border-[#E5E2DC] bg-[#FAF9F7] px-5 py-3 flex items-center justify-between">
          <span className="text-hb-xs text-[#646E7E]">
            방문 전 문의: {STORE.tel} · {STORE.mobile}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="hb-btn-outline h-9 px-4 text-hb-xs"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
}
