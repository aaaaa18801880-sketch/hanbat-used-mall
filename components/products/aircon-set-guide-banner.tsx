"use client";

import React, { useState } from "react";
import { SafeImg, Icon, ICON, Modal } from "../../lib/ui";
import { STORE, telHref } from "../../lib/site";

interface AirconSetGuideBannerProps {
  variant?: "card" | "banner" | "inline";
  className?: string;
}

export function AirconSetGuideBanner({
  variant = "card",
  className = "",
}: AirconSetGuideBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. 배너 형태 (갤러리 페이지 에어컨 카테고리 탭 선택 시 상단에 표시)
  if (variant === "banner") {
    return (
      <>
        <div
          className={`relative overflow-hidden rounded-xl border border-[#E5E2DC] bg-white p-4 sm:p-5 shadow-2xs transition-all ${className}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#0E1A2B] text-white">
                <Icon d={ICON.check} className="h-5 w-5 text-[#FF8A50]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-block rounded bg-[#FFF5F0] border border-[#FED7AA] px-2 py-0.5 text-hb-xs font-bold text-[#D9531E]">
                    구매 전 확인
                  </span>
                  <span className="text-hb-xs font-bold text-[#434B59]">
                    에어컨 · 냉난방기 구성 안내
                  </span>
                </div>
                <h3 className="mt-1 text-hb-base sm:text-hb-lg font-bold text-[#0E1A2B] tracking-tight leading-snug">
                  에어컨/냉난방기는 실내기 + 실외기 세트 구성 제품입니다
                </h3>
                <p className="mt-0.5 text-hb-sm text-[#434B59] leading-relaxed break-keep">
                  실외기만 별도로 단독 구매하시는 것은 어려우며, 반드시 실내기와 1:1 세트로 판매됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="hb-btn-outline h-10 px-3.5 text-hb-xs cursor-pointer"
              >
                <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#D9531E]" />
                <span>안내문 크게 보기</span>
              </button>
              <a
                href={telHref(STORE.tel)}
                className="hb-btn-primary h-10 px-3.5 text-hb-xs"
              >
                <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#FF8A50]" />
                <span>시공 견적 문의</span>
              </a>
            </div>
          </div>
        </div>

        {/* 안내문 원본 비율 확대 모달 */}
        {isModalOpen && (
          <AirconGuideModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
        )}
      </>
    );
  }

  // 2. 인라인 뱃지 형태 (문의 폼 등 슬림 영역에 배치)
  if (variant === "inline") {
    return (
      <>
        <div
          className={`flex items-center justify-between gap-3 rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] px-3.5 py-2.5 text-hb-xs ${className}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="rounded bg-[#0E1A2B] px-1.5 py-0.5 text-hb-xs font-bold text-white shrink-0">
              안내
            </span>
            <span className="font-semibold text-[#0E1A2B] truncate">
              에어컨/냉난방기는 실내기+실외기 세트 판매 제품입니다 (실외기 단독 구매 불가)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-hb-xs font-bold text-[#D9531E] underline shrink-0 hover:text-[#BF4415]"
          >
            안내문 보기
          </button>
        </div>

        {isModalOpen && (
          <AirconGuideModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
        )}
      </>
    );
  }

  // 3. 카드 형태 (상품 상세 페이지 및 상세 모달 내 임베딩)
  return (
    <>
      <div
        className={`rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-4 sm:p-5 ${className}`}
      >
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5E2DC]">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#FFF5F0] border border-[#FED7AA] px-2 py-0.5 text-hb-xs font-bold text-[#D9531E]">
              구매 전 확인
            </span>
            <span className="text-hb-xs font-bold text-[#0E1A2B]">
              실내기 + 실외기 세트 구성 안내
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#0E1A2B] hover:text-[#D9531E] hover:underline"
          >
            <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#D9531E]" />
            <span>크게 보기</span>
          </button>
        </div>

        {/* 안내문 이미지 썸네일 카드 (클릭 시 원본 확대) */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="group relative mt-3.5 block w-full overflow-hidden rounded-lg border border-[#E5E2DC] bg-white cursor-pointer transition-all hover:border-[#0E1A2B]"
          aria-label="에어컨/냉난방기 세트 구성 안내문 원본 크게 보기"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F4F2ED]">
            <SafeImg
              src="/images/aircon-set-guide.jpg"
              alt="에어컨/냉난방기 실외기·실내기 세트 구성 안내문"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#0E1A2B]/80 px-3 py-1 text-hb-xs font-bold text-white shadow">
              <Icon d={ICON.search} className="w-3.5 h-3.5" />
              <span>클릭하여 크게 보기</span>
            </span>
          </div>
        </button>

        {/* 3대 핵심 요약 카드 리스트 */}
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-hb-xs">
          <div className="rounded-lg border border-[#E5E2DC] bg-white p-2.5">
            <span className="font-bold text-[#0E1A2B] block mb-0.5">
              1:1 세트 구성
            </span>
            <p className="text-hb-xs text-[#434B59] leading-snug">
              실내기와 실외기가 한 조로 구성된 세트 제품으로 판매됩니다.
            </p>
          </div>
          <div className="rounded-lg border border-[#E5E2DC] bg-white p-2.5">
            <span className="font-bold text-[#D9531E] block mb-0.5">
              실외기 단독 구매 불가
            </span>
            <p className="text-hb-xs text-[#434B59] leading-snug">
              실외기만 별도로 구매하시는 것은 어려우니 양해 부탁드립니다.
            </p>
          </div>
          <div className="rounded-lg border border-[#E5E2DC] bg-white p-2.5">
            <span className="font-bold text-[#0E1A2B] block mb-0.5">
              사전 시공 상담 지원
            </span>
            <p className="text-hb-xs text-[#434B59] leading-snug">
              배관 거리 및 설치 환경 문의는 고객센터로 언제든 연락주세요.
            </p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AirconGuideModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}

/**
 * 에어컨 안내문 원본 비율 확대 모달 컴포넌트
 */
export function AirconGuideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      label="에어컨/냉난방기 세트 구성 안내문"
      panelClassName="max-w-3xl"
    >
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-xl border border-[#E5E2DC] bg-white shadow-2xl">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b border-[#E5E2DC] bg-[#0E1A2B] px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded bg-[#D9531E] text-white">
              <Icon d={ICON.check} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-hb-base font-bold">
                에어컨 · 냉난방기 세트 구성 안내
              </h3>
              <p className="text-hb-xs text-white/70">
                실내기 + 실외기 세트 구성 및 판매 기준 안내
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <Icon d={ICON.close} className="w-5 h-5" />
          </button>
        </div>

        {/* 본문: 고해상도 안내문 이미지 */}
        <div className="flex-1 overflow-y-auto bg-[#FAF9F7] p-3 sm:p-5">
          <div className="rounded-xl border border-[#E5E2DC] bg-white p-2 shadow-2xs overflow-hidden">
            <SafeImg
              src="/images/aircon-set-guide.jpg"
              alt="에어컨/냉난방기는 보통 셋트로 구성되어 있습니다. 실외기만 별도 구매 불가 안내"
              eager
              className="w-full h-auto object-contain mx-auto rounded-lg"
            />
          </div>
        </div>

        {/* 모달 하단 액션 버튼 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E2DC] bg-white px-5 py-3.5">
          <span className="text-hb-xs text-[#434B59] hidden sm:inline">
            설치 환경별 배관·전원 견적은 고객센터에서 상세히 상담해 드립니다.
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={telHref(STORE.tel)}
              className="hb-btn-primary h-10 px-4 text-hb-sm font-bold"
            >
              <Icon d={ICON.phone} className="w-4 h-4 text-[#FF8A50]" />
              <span>전화 상담 ({STORE.tel})</span>
            </a>
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              className="hb-btn-kakao h-10 px-4 text-hb-sm font-bold"
            >
              <Icon d={ICON.chat} className="w-4 h-4" />
              <span>카톡 상담</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="hb-btn-outline h-10 px-4 text-hb-sm"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
