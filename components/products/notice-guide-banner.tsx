// 파일 경로: components/products/notice-guide-banner.tsx
"use client";

import React, { useState } from "react";
import { SafeImg, Icon, ICON, Modal } from "../../lib/ui";
import { STORE, telHref } from "../../lib/site";
import {
  getCategoryNoticeGuide,
  type NoticeGuideItem,
} from "../../lib/notice-guides";

interface CategoryNoticeGuideBannerProps {
  category?: string | null;
  variant?: "card" | "banner" | "inline";
  className?: string;
}

export function CategoryNoticeGuideBanner({
  category,
  variant = "card",
  className = "",
}: CategoryNoticeGuideBannerProps) {
  const guide = getCategoryNoticeGuide(category);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!guide) return null;

  // 1. 배너 형태 (갤러리 카테고리 탭 선택 시 상단 노출)
  if (variant === "banner") {
    return (
      <>
        <div
          className={`relative overflow-hidden rounded-xl border border-[#E2E6EC] bg-white p-4 sm:p-5 transition-colors duration-200 ${className}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-hb-xs">
                <span className="font-bold text-[#C84312]">{guide.kicker}</span>
                <span aria-hidden="true" className="text-[#CBD2DC]">
                  ·
                </span>
                <span className="font-semibold text-[#475569]">
                  {guide.title}
                </span>
              </div>
              <h3 className="mt-1 text-hb-base sm:text-hb-lg font-bold text-[#141A23] tracking-tight leading-snug break-keep">
                {guide.headline}
              </h3>
              <p className="mt-0.5 text-hb-sm text-[#4E5968] leading-relaxed break-keep">
                {guide.summary}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="hb-btn-outline h-10 px-3.5 text-hb-xs whitespace-nowrap cursor-pointer"
              >
                <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#E8521A]" />
                <span>안내문 크게 보기</span>
              </button>
              <a
                href={telHref(STORE.tel)}
                className="hb-btn-primary h-10 px-3.5 text-hb-xs whitespace-nowrap"
              >
                <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#FF8A50]" />
                <span>{guide.ctaLabel}</span>
              </a>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <NoticeGuideModal
            open
            guide={guide}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </>
    );
  }

  // 2. 인라인 바 형태 (문의 폼 내 품목 선택 시 노출)
  if (variant === "inline") {
    return (
      <>
        <div
          className={`flex items-center justify-between gap-3 rounded-lg border border-[#E2E6EC] bg-[#F7F8FA] px-3.5 py-2.5 text-hb-xs ${className}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-[#C84312] shrink-0">
              {guide.kicker}
            </span>
            <span aria-hidden="true" className="text-[#CBD2DC] shrink-0">
              ·
            </span>
            <span className="font-medium text-[#141A23] truncate">
              {guide.inlineText}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-hb-xs font-bold text-[#C84312] underline underline-offset-4 shrink-0 hover:text-[#141A23] whitespace-nowrap cursor-pointer"
          >
            안내문 보기
          </button>
        </div>

        {isModalOpen && (
          <NoticeGuideModal
            open
            guide={guide}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </>
    );
  }

  // 3. 카드 형태 (상품 상세 페이지 및 상품 상세 모달 — 해당 품목 전용 단일 안내)
  return (
    <>
      <div
        className={`rounded-2xl border border-[#E2E6EC] bg-white overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-[#E2E6EC] bg-[#FAF9F6]">
          <div className="flex items-center gap-2 min-w-0 text-hb-xs">
            <span className="font-bold text-[#C84312] shrink-0">
              {guide.kicker}
            </span>
            <span aria-hidden="true" className="text-[#CBD2DC] shrink-0">
              ·
            </span>
            <span className="font-bold text-[#141A23] truncate">
              {guide.title}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#141A23] hover:text-[#C84312] hover:underline underline-offset-4 shrink-0 whitespace-nowrap cursor-pointer"
          >
            <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#C84312]" />
            <span>크게 보기</span>
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="group relative block w-full overflow-hidden rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] cursor-pointer transition-[border-color] duration-200 hover:border-[#141A23]"
          >
            <div
              className={`relative ${guide.aspectClass} w-full overflow-hidden bg-[#F1F3F6]`}
            >
              <SafeImg
                src={guide.imageSrc}
                alt={guide.imageAlt}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E6EC] border-t border-[#E2E6EC] bg-[#FAF9F6] text-hb-xs">
          {guide.highlights.map((item) => (
            <div key={item.title} className="p-3.5 sm:p-4">
              <span
                className={`font-bold block mb-0.5 tabular-nums ${
                  item.tone === "brand" ? "text-[#C84312]" : "text-[#141A23]"
                }`}
              >
                {item.title}
              </span>
              <p className="text-hb-xs text-[#334155] leading-snug break-keep">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <NoticeGuideModal
          open
          guide={guide}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

/**
 * 품목 안내문 원본 비율 확대 모달
 */
export function NoticeGuideModal({
  open,
  guide,
  onClose,
}: {
  open: boolean;
  guide: NoticeGuideItem;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      label={guide.modalTitle}
      panelClassName="max-w-3xl"
      closeOnOverlayClick={false}
    >
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E2E6EC] bg-[#141A23] px-5 py-4 text-white">
          <div className="min-w-0">
            <h3 className="text-hb-base font-bold truncate">
              {guide.modalTitle}
            </h3>
            <p className="text-hb-xs text-white/75 truncate">
              {guide.modalSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <Icon d={ICON.close} className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F7F8FA] p-3 sm:p-4 flex items-center justify-center">
          <div className="rounded-xl border border-[#E2E6EC] bg-white p-1.5 overflow-hidden max-w-full">
            <SafeImg
              src={guide.imageSrc}
              alt={guide.imageAlt}
              eager
              className="max-h-[calc(92vh-180px)] w-auto max-w-full h-auto object-contain mx-auto rounded-lg"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E6EC] bg-white px-5 py-3.5">
          <span className="text-hb-xs text-[#4E5968] hidden sm:inline">
            {guide.modalFooterNote}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={telHref(STORE.tel)}
              className="hb-btn-primary h-10 px-4 text-hb-sm font-bold whitespace-nowrap"
            >
              <Icon d={ICON.phone} className="w-4 h-4 text-[#FF8A50]" />
              <span>전화 상담 ({STORE.tel})</span>
            </a>
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              className="hb-btn-kakao h-10 px-4 text-hb-sm font-bold whitespace-nowrap"
            >
              <Icon d={ICON.chat} className="w-4 h-4" />
              <span>카톡 상담</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="hb-btn-outline h-10 px-4 text-hb-sm whitespace-nowrap cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
