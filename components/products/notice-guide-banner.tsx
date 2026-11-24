// 파일 경로: components/products/notice-guide-banner.tsx
"use client";

import React, { useMemo, useState } from "react";
import { SafeImg, Icon, ICON, Modal } from "../../lib/ui";
import { STORE, telHref } from "../../lib/site";
import {
  HOME_NOTICE_GUIDES,
  getCategoryBannerGuide,
  getProductDetailNoticeTabs,
  type NoticeGuideId,
  type NoticeGuideItem,
} from "../../lib/notice-guides";

interface CategoryNoticeGuideBannerProps {
  category?: string | null;
  variant?: "card" | "banner" | "inline";
  showTabs?: boolean;
  className?: string;
}

export function CategoryNoticeGuideBanner({
  category,
  variant = "card",
  showTabs = true,
  className = "",
}: CategoryNoticeGuideBannerProps) {
  const detailTabs = useMemo(
    () => getProductDetailNoticeTabs(category),
    [category]
  );
  const categoryBannerGuide = useMemo(
    () => getCategoryBannerGuide(category),
    [category]
  );

  const categoryKey = detailTabs[0].id;
  const [userSelection, setUserSelection] = useState<{
    categoryKey: NoticeGuideId;
    id: NoticeGuideId;
  } | null>(null);
  const [modalGuideIndex, setModalGuideIndex] = useState<number | null>(null);

  const selectedId =
    userSelection && userSelection.categoryKey === categoryKey
      ? userSelection.id
      : categoryKey;

  const selectGuideId = (id: NoticeGuideId) => {
    setUserSelection({ categoryKey, id });
  };

  // 1. 배너 형태 (갤러리 카테고리 탭 선택 시 상단 노출)
  if (variant === "banner") {
    if (!categoryBannerGuide) return null;

    return (
      <>
        <div
          className={`relative overflow-hidden rounded-xl border border-[#E2E6EC] bg-white p-4 sm:p-5 shadow-2xs transition-[border-color,box-shadow] duration-200 ${className}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#141A23] text-white">
                <Icon d={ICON.check} className="h-5 w-5 text-[#FF8A50]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-block rounded-md bg-[#FFF4EE] border border-[#FADCD0] px-2 py-0.5 text-hb-xs font-bold text-[#E8521A]">
                    {categoryBannerGuide.badge}
                  </span>
                  <span className="text-hb-xs font-bold text-[#4E5968]">
                    {categoryBannerGuide.title}
                  </span>
                </div>
                <h3 className="mt-1 text-hb-base sm:text-hb-lg font-bold text-[#141A23] tracking-tight leading-snug break-keep">
                  {categoryBannerGuide.headline}
                </h3>
                <p className="mt-0.5 text-hb-sm text-[#4E5968] leading-relaxed break-keep">
                  {categoryBannerGuide.summary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={() => setModalGuideIndex(0)}
                className="hb-btn-outline h-10 px-3.5 text-hb-xs cursor-pointer"
              >
                <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#E8521A]" />
                <span>안내문 크게 보기</span>
              </button>
              <a
                href={telHref(STORE.tel)}
                className="hb-btn-primary h-10 px-3.5 text-hb-xs"
              >
                <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#FF8A50]" />
                <span>{categoryBannerGuide.ctaLabel}</span>
              </a>
            </div>
          </div>
        </div>

        {modalGuideIndex !== null && (
          <NoticeGuideModal
            open
            guides={[categoryBannerGuide]}
            currentIndex={0}
            onClose={() => setModalGuideIndex(null)}
          />
        )}
      </>
    );
  }

  // 2. 인라인 바 형태 (문의 폼 내 품목 선택 시 노출)
  if (variant === "inline") {
    if (!categoryBannerGuide) return null;

    return (
      <>
        <div
          className={`flex items-center justify-between gap-3 rounded-lg border border-[#E2E6EC] bg-[#F7F8FA] px-3.5 py-2.5 text-hb-xs ${className}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="rounded bg-[#141A23] px-1.5 py-0.5 text-hb-xs font-bold text-white shrink-0">
              필독
            </span>
            <span className="font-semibold text-[#141A23] truncate">
              {categoryBannerGuide.inlineText}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setModalGuideIndex(0)}
            className="text-hb-xs font-bold text-[#E8521A] underline shrink-0 hover:text-[#C53F0F] cursor-pointer"
          >
            안내문 보기
          </button>
        </div>

        {modalGuideIndex !== null && (
          <NoticeGuideModal
            open
            guides={[categoryBannerGuide]}
            currentIndex={0}
            onClose={() => setModalGuideIndex(null)}
          />
        )}
      </>
    );
  }

  // 3. 카드 형태 (상품 상세 페이지 및 상품 상세 모달 — 품목 맞춤 + 출고 점검 · A/S · 직배송 탭 전환)
  const activeIndex = Math.max(
    0,
    detailTabs.findIndex((item) => item.id === selectedId)
  );
  const activeGuide = detailTabs[activeIndex] ?? detailTabs[0];

  return (
    <>
      <div
        className={`rounded-2xl border border-[#E2E6EC] bg-white overflow-hidden shadow-2xs ${className}`}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-[#E2E6EC] bg-[#F7F8FA]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="rounded-md bg-[#FFF4EE] border border-[#FADCD0] px-2 py-0.5 text-hb-xs font-bold text-[#E8521A] shrink-0">
              {activeGuide.badge}
            </span>
            <span className="text-hb-xs font-bold text-[#141A23] truncate">
              {activeGuide.title}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setModalGuideIndex(activeIndex)}
            className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#141A23] hover:text-[#E8521A] hover:underline shrink-0 cursor-pointer"
          >
            <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#E8521A]" />
            <span>크게 보기</span>
          </button>
        </div>

        {showTabs && detailTabs.length > 1 && (
          <div
            role="tablist"
            aria-label="구매 전 안내문 선택"
            className="flex items-center gap-1.5 overflow-x-auto border-b border-[#E2E6EC] bg-white px-4 py-2.5 scrollbar-none"
          >
            {detailTabs.map((guide) => {
              const isSelected = guide.id === activeGuide.id;
              return (
                <button
                  key={guide.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => selectGuideId(guide.id)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-hb-xs font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#141A23] text-white"
                      : "bg-[#F7F8FA] text-[#475569] hover:bg-[#ECEFF4] hover:text-[#141A23]"
                  }`}
                >
                  {guide.shortTabLabel}
                </button>
              );
            })}
          </div>
        )}

        <div className="p-4 sm:p-5">
          <button
            type="button"
            onClick={() => setModalGuideIndex(activeIndex)}
            className="group relative block w-full overflow-hidden rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] cursor-pointer transition-[border-color] duration-200 hover:border-[#141A23]"
          >
            <div
              className={`relative ${activeGuide.aspectClass} w-full overflow-hidden bg-[#F1F3F6]`}
            >
              <SafeImg
                src={activeGuide.imageSrc}
                alt={activeGuide.imageAlt}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E6EC] border-t border-[#E2E6EC] bg-[#F7F8FA] text-hb-xs">
          {activeGuide.highlights.map((item) => (
            <div key={item.title} className="p-3.5 sm:p-4">
              <span
                className={`font-bold block mb-0.5 tabular-nums ${
                  item.tone === "brand" ? "text-[#E8521A]" : "text-[#141A23]"
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

      {modalGuideIndex !== null && (
        <NoticeGuideModal
          open
          guides={detailTabs}
          currentIndex={modalGuideIndex}
          onChangeIndex={(nextIdx) => {
            setModalGuideIndex(nextIdx);
            if (detailTabs[nextIdx]) selectGuideId(detailTabs[nextIdx].id);
          }}
          onClose={() => setModalGuideIndex(null)}
        />
      )}
    </>
  );
}

/**
 * 홈페이지 신뢰 섹션 하단에 배치하는 공식 안내문 6종 비주얼 보드
 * 클릭 시 원본 해상도 확대 모달 + 좌우 전환 지원
 */
export function HomeNoticeGuidesStrip({
  className = "",
}: {
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={`mt-6 sm:mt-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3.5">
        <div>
          <span className="hb-eyebrow">한눈에 보는 구매 · 배송 · A/S 안내문</span>
          <h3 className="mt-1 text-hb-lg sm:text-hb-xl font-bold tracking-tight text-[#141A23] break-keep">
            구매 전 꼭 확인하실 6가지 핵심 안내
          </h3>
        </div>
        <p className="text-hb-xs text-[#475569] break-keep">
          카드를 누르면 원본 크기로 자세히 보실 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {HOME_NOTICE_GUIDES.map((guide, index) => (
          <button
            key={guide.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group flex flex-col overflow-hidden rounded-xl border border-[#E2DDD3] bg-white text-left shadow-2xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#141A23] hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] cursor-pointer"
          >
            <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#F1F3F6] border-b border-[#E2DDD3]">
              <SafeImg
                src={guide.imageSrc}
                alt={guide.imageAlt}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between p-3.5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-block rounded bg-[#FFF4EE] border border-[#FADCD0] px-2 py-0.5 text-hb-xs font-bold text-[#C84312]">
                    {guide.badge}
                  </span>
                  <span className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#475569] group-hover:text-[#C84312] transition-colors shrink-0">
                    <Icon d={ICON.search} className="w-3 h-3 text-[#C84312]" />
                    <span>크게 보기</span>
                  </span>
                </div>
                <h4 className="mt-1.5 text-hb-sm font-bold text-[#141A23] group-hover:text-[#C84312] transition-colors break-keep">
                  {guide.title}
                </h4>
              </div>
              <p className="mt-1 line-clamp-2 text-hb-xs text-[#475569] leading-relaxed break-keep">
                {guide.summary}
              </p>
            </div>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <NoticeGuideModal
          open
          guides={HOME_NOTICE_GUIDES}
          currentIndex={openIndex}
          onChangeIndex={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  );
}

/**
 * 공용 인포그래픽 안내문 원본 비율 확대 모달 (다중 안내문 좌우 전환 지원)
 */
export function NoticeGuideModal({
  open,
  guides,
  currentIndex,
  onChangeIndex,
  onClose,
}: {
  open: boolean;
  guides: readonly NoticeGuideItem[];
  currentIndex: number;
  onChangeIndex?: (nextIndex: number) => void;
  onClose: () => void;
}) {
  const safeIndex = Math.max(0, Math.min(currentIndex, guides.length - 1));
  const guide = guides[safeIndex];
  if (!guide) return null;

  const canSwitch = guides.length > 1 && Boolean(onChangeIndex);
  const goPrev = () => {
    if (!canSwitch || !onChangeIndex) return;
    onChangeIndex((safeIndex - 1 + guides.length) % guides.length);
  };
  const goNext = () => {
    if (!canSwitch || !onChangeIndex) return;
    onChangeIndex((safeIndex + 1) % guides.length);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={guide.modalTitle}
      panelClassName="max-w-3xl"
      closeOnOverlayClick={false}
    >
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white shadow-2xl">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b border-[#E2E6EC] bg-[#141A23] px-5 py-4 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[#E8521A] text-white">
              <Icon d={ICON.check} className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-hb-base font-bold truncate">
                {guide.modalTitle}
              </h3>
              <p className="text-hb-xs text-white/75 truncate">
                {guide.modalSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canSwitch && (
              <span className="hidden sm:inline-block font-mono text-hb-xs font-bold text-white/75 tabular-nums">
                {safeIndex + 1} / {guides.length}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Icon d={ICON.close} className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 다중 안내문 빠른 탭 바 */}
        {canSwitch && (
          <div className="flex items-center justify-between gap-2 border-b border-[#E2E6EC] bg-[#F7F8FA] px-4 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {guides.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeIndex?.(idx)}
                  className={`shrink-0 rounded-md px-2.5 py-1 text-hb-xs font-bold transition-colors cursor-pointer ${
                    idx === safeIndex
                      ? "bg-[#141A23] text-white"
                      : "bg-white text-[#475569] border border-[#E2E6EC] hover:text-[#141A23]"
                  }`}
                >
                  {item.shortTabLabel}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={goPrev}
                aria-label="이전 안내문"
                className="grid h-7 w-7 place-items-center rounded border border-[#CBD2DC] bg-white text-[#141A23] hover:bg-[#F1F3F6] cursor-pointer"
              >
                <Icon d={ICON.left} className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="다음 안내문"
                className="grid h-7 w-7 place-items-center rounded border border-[#CBD2DC] bg-white text-[#141A23] hover:bg-[#F1F3F6] cursor-pointer"
              >
                <Icon d={ICON.right} className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 본문: 고해상도 안내문 이미지 (뷰포트 내 한눈에 표시) */}
        <div className="flex-1 overflow-y-auto bg-[#F7F8FA] p-3 sm:p-4 flex items-center justify-center">
          <div className="rounded-xl border border-[#E2E6EC] bg-white p-1.5 shadow-2xs overflow-hidden max-w-full">
            <SafeImg
              src={guide.imageSrc}
              alt={guide.imageAlt}
              eager
              className="max-h-[calc(92vh-180px)] w-auto max-w-full h-auto object-contain mx-auto rounded-lg"
            />
          </div>
        </div>

        {/* 모달 하단 액션 버튼 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E6EC] bg-white px-5 py-3.5">
          <span className="text-hb-xs text-[#4E5968] hidden sm:inline">
            {guide.modalFooterNote}
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
              className="hb-btn-outline h-10 px-4 text-hb-sm cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
