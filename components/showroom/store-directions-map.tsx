// 파일 경로: components/showroom/store-directions-map.tsx
"use client";

import React, { useRef, useState } from "react";
import NextImage from "next/image";
import toast from "react-hot-toast";
import { Icon, ICON, Modal } from "../../lib/ui";
import { STORE, STORE_NAVIGATION } from "../../lib/site";
import {
  STORE_DIRECTION_ROUTES,
  STORE_DIRECTION_PHOTO_STEPS,
  getStoreDirectionRoute,
  buildStoreDirectionsShareText,
  type DirectionRouteId,
} from "../../lib/store-directions";
import { DirectionsVectorSvg } from "./directions-vector-svg";
import { downloadBrandedDirectionsPng } from "./directions-png-export";

function AlleyPhotoGuideStrip({
  highlightedStep,
  onHoverStep,
  onSelectPhoto,
}: {
  highlightedStep: number | null;
  onHoverStep: (index: number | null) => void;
  onSelectPhoto: (index: number) => void;
}) {
  return (
    <div className="pt-4">
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-hb-xs sm:text-hb-sm font-bold text-[#141A23]">
            실제 골목 진입 사진 안내
          </span>
          <span className="text-hb-xs text-[#64748B]">
            지도의 01 · 02 · 03 핀과 같은 순서입니다
          </span>
        </div>
        <span className="text-hb-xs text-[#64748B]">
          사진 클릭 시 크게 보기
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {STORE_DIRECTION_PHOTO_STEPS.map((step, index) => {
          const isArrival = index === STORE_DIRECTION_PHOTO_STEPS.length - 1;
          const isHighlighted = highlightedStep === index;
          return (
            <button
              key={step.stepNumber}
              type="button"
              onMouseEnter={() => onHoverStep(index)}
              onMouseLeave={() => onHoverStep(null)}
              onFocus={() => onHoverStep(index)}
              onBlur={() => onHoverStep(null)}
              onClick={() => onSelectPhoto(index)}
              aria-label={`STEP ${step.stepNumber} 실제 사진 크게 보기: ${step.title}`}
              className={`group flex flex-col overflow-hidden rounded-xl border bg-white text-left transition-[border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] cursor-pointer ${
                isHighlighted
                  ? isArrival
                    ? "border-[#C84312]"
                    : "border-[#2563EB]"
                  : "border-[#E5E3DC] hover:border-[#141A23]"
              }`}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#ECEBE6]">
                <NextImage
                  src={step.imageSrc}
                  alt={step.imageAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, 240px"
                  referrerPolicy="no-referrer"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <span
                  className={`absolute left-2 top-2 rounded-md px-1.5 py-0.5 font-mono text-hb-xs font-extrabold text-white tabular-nums ${
                    isArrival ? "bg-[#C84312]" : "bg-[#2563EB]"
                  }`}
                >
                  {step.stepNumber}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute bottom-2 right-2 grid h-6 w-6 place-items-center rounded-md bg-[#141A23]/70 text-white opacity-85 transition-opacity group-hover:opacity-100"
                >
                  <Icon d={ICON.search} className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 px-2.5 py-2">
                <span className="text-hb-xs font-bold text-[#141A23] group-hover:text-[#C84312] transition-colors break-keep">
                  {step.title}
                </span>
                <span className="text-hb-xs text-[#64748B] leading-snug break-keep">
                  {step.shortCaption}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AlleyPhotoLightboxModal({
  selectedIndex,
  onSelectIndex,
  onClose,
}: {
  selectedIndex: number | null;
  onSelectIndex: (index: number) => void;
  onClose: () => void;
}) {
  if (selectedIndex === null) return null;
  const total = STORE_DIRECTION_PHOTO_STEPS.length;
  const step =
    STORE_DIRECTION_PHOTO_STEPS[selectedIndex] ?? STORE_DIRECTION_PHOTO_STEPS[0];
  const isArrival = selectedIndex === total - 1;
  const handlePrev = () => onSelectIndex((selectedIndex - 1 + total) % total);
  const handleNext = () => onSelectIndex((selectedIndex + 1) % total);

  return (
    <Modal
      open
      onClose={onClose}
      label={`실제 골목 진입 사진 ${step.stepNumber}단계: ${step.title}`}
      panelClassName="max-w-2xl"
    >
      <div className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#243041] bg-[#141A23] px-4 py-3 text-white sm:px-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`rounded-md px-2 py-0.5 font-mono text-hb-xs font-extrabold tabular-nums ${
                isArrival ? "bg-[#C84312]" : "bg-[#2563EB]"
              }`}
            >
              {step.stepNumber} / 0{total}
            </span>
            <h3 className="text-hb-sm sm:text-hb-base font-bold truncate">
              {step.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="사진 닫기"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <Icon d={ICON.close} className="w-5 h-5" />
          </button>
        </div>

        <div className="relative h-[min(54vh,440px)] w-full shrink-0 bg-[#141A23]">
          <NextImage
            src={step.imageSrc}
            alt={step.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            referrerPolicy="no-referrer"
            className="object-contain"
            priority
          />
          <button
            type="button"
            onClick={handlePrev}
            aria-label="이전 진입 사진 보기"
            className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-[#141A23]/75 text-white hover:bg-[#141A23] transition-colors cursor-pointer"
          >
            <Icon d={ICON.left} className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="다음 진입 사진 보기"
            className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-[#141A23]/75 text-white hover:bg-[#141A23] transition-colors cursor-pointer"
          >
            <Icon d={ICON.right} className="w-5 h-5" />
          </button>
        </div>

        <div className="shrink-0 space-y-3 overflow-y-auto bg-white p-4 sm:p-5">
          <p className="text-hb-xs sm:text-hb-sm text-[#1E293B] leading-relaxed break-keep">
            {step.detailCaption}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#ECEBE6]">
            <div className="flex flex-wrap items-center gap-1.5">
              {STORE_DIRECTION_PHOTO_STEPS.map((item, idx) => (
                <button
                  key={item.stepNumber}
                  type="button"
                  onClick={() => onSelectIndex(idx)}
                  className={`rounded-lg px-2.5 py-1.5 text-hb-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    idx === selectedIndex
                      ? "bg-[#141A23] text-white"
                      : "bg-[#F4F4F1] text-[#475569] hover:text-[#141A23]"
                  }`}
                >
                  {item.stepNumber}. {item.title}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hb-btn-outline h-8 px-3.5 text-hb-xs font-bold cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function StoreDirectionsMap({
  compact = false,
  onOpenGoogleMap,
}: {
  compact?: boolean;
  onOpenGoogleMap?: () => void;
}) {
  const [activeRoute, setActiveRoute] = useState<DirectionRouteId>("all");
  const [highlightedStep, setHighlightedStep] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const currentRoute = getStoreDirectionRoute(activeRoute);

  const handleCopyDirections = async () => {
    try {
      await navigator.clipboard.writeText(buildStoreDirectionsShareText());
      toast.success(
        "오시는 길 안내 문구(주소·진입 팁·지도 링크)가 복사되었습니다."
      );
    } catch {
      toast.error("안내 문구 복사에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="flex flex-col bg-white">
        {/* 상단 방면 선택 세그먼트 + 유틸리티 툴바 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E3DC] bg-[#FAFAF8] px-3.5 py-2.5 sm:px-4">
          <div
            role="tablist"
            aria-label="방면별 진입 동선 선택"
            className="inline-flex flex-wrap items-center gap-0.5 rounded-xl border border-[#E5E3DC] bg-[#F4F4F1] p-0.5"
          >
            {STORE_DIRECTION_ROUTES.map((route) => {
              const selected = activeRoute === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveRoute(route.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-hb-xs font-bold whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                    selected
                      ? "bg-[#141A23] text-white"
                      : "text-[#475569] hover:text-[#141A23]"
                  }`}
                >
                  {route.shortLabel}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenGoogleMap && (
              <button
                type="button"
                onClick={onOpenGoogleMap}
                className="text-hb-xs font-semibold text-[#475569] hover:text-[#141A23] underline underline-offset-4 whitespace-nowrap cursor-pointer"
              >
                위성·구글지도
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                downloadBrandedDirectionsPng(svgRef.current, activeRoute)
              }
              className="inline-flex items-center gap-1 rounded-lg border border-[#D4D1C7] bg-white px-2.5 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Icon d={ICON.download} className="w-3.5 h-3.5 text-[#141A23]" />
              <span>약도 저장</span>
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D4D1C7] bg-white px-2.5 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#141A23]" />
              <span>크게 보기</span>
            </button>
          </div>
        </div>

        {/* 일체형 정밀 약도 + 하단 딥 네이비 주소바 */}
        <div className={compact ? "p-3" : "p-3.5 sm:p-4 pb-0"}>
          <div className="overflow-hidden rounded-xl border border-[#D4D1C7] bg-[#F3F1EC]">
            <div
              className="relative cursor-pointer"
              onClick={() => setModalOpen(true)}
            >
              <DirectionsVectorSvg
                activeRoute={activeRoute}
                highlightedStep={highlightedStep}
                onSelectStep={(idx) => setSelectedPhotoIdx(idx)}
                svgRef={svgRef}
                className={`w-full block ${
                  compact ? "max-h-[250px] object-contain" : "h-auto"
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-[#141A23] px-4 py-2.5 text-white">
              <p className="text-hb-xs sm:text-hb-sm font-bold tracking-tight break-keep">
                {STORE.roadAddress}
              </p>
              <span className="text-hb-xs font-medium text-[#CBD5E1] whitespace-nowrap">
                {STORE.addressNote} · 전용 주차 8대
              </span>
            </div>
          </div>

          {!compact && (
            <AlleyPhotoGuideStrip
              highlightedStep={highlightedStep}
              onHoverStep={setHighlightedStep}
              onSelectPhoto={(index) => setSelectedPhotoIdx(index)}
            />
          )}
        </div>

        {/* 에디토리얼 2단 핵심 안내 (불필요한 중첩 박스·아이콘 원형 제거, 여백과 헤어라인 중심) */}
        {!compact ? (
          <div className="mt-4 border-t border-[#ECEBE6] px-4 sm:px-5 py-4 bg-white space-y-3.5">
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-hb-sm font-extrabold text-[#141A23]">
                    오시는 길
                  </span>
                  <span className="text-hb-xs font-medium text-[#64748B]">
                    · {currentRoute.shortLabel} 기준
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDirections}
                  className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#475569] hover:text-[#141A23] underline underline-offset-4 whitespace-nowrap cursor-pointer"
                >
                  <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#141A23]" />
                  <span>약도 안내 복사</span>
                </button>
              </div>
              <p className="text-hb-xs sm:text-hb-sm text-[#334155] leading-relaxed break-keep">
                {currentRoute.summary}
              </p>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-[#F1F0EB] pt-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-hb-sm font-extrabold text-[#141A23]">
                  전용 주차 · 상차
                </span>
                <span className="text-hb-xs sm:text-hb-sm text-[#334155] break-keep">
                  매장 앞 전용 주차장{" "}
                  <strong className="font-bold text-[#141A23] tabular-nums">
                    8대
                  </strong>{" "}
                  무료 이용 ·{" "}
                  <strong className="font-bold text-[#141A23] tabular-nums">
                    1톤
                  </strong>{" "}
                  화물 상차 가능
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-3.5 pb-3 text-hb-xs text-[#334155] leading-relaxed break-keep">
            <strong className="font-bold text-[#141A23]">
              {currentRoute.shortLabel} 진입 안내
            </strong>{" "}
            · {currentRoute.summary}
          </div>
        )}
      </div>

      {modalOpen && (
        <StoreDirectionsModal
          open
          initialRoute={activeRoute}
          onClose={() => setModalOpen(false)}
        />
      )}

      <AlleyPhotoLightboxModal
        selectedIndex={selectedPhotoIdx}
        onSelectIndex={setSelectedPhotoIdx}
        onClose={() => setSelectedPhotoIdx(null)}
      />
    </>
  );
}

export function StoreDirectionsModal({
  open,
  initialRoute = "all",
  onClose,
}: {
  open: boolean;
  initialRoute?: DirectionRouteId;
  onClose: () => void;
}) {
  const [activeRoute, setActiveRoute] =
    useState<DirectionRouteId>(initialRoute);
  const [highlightedStep, setHighlightedStep] = useState<number | null>(null);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number | null>(null);
  const modalSvgRef = useRef<SVGSVGElement | null>(null);

  if (!open) return null;

  const currentRoute = getStoreDirectionRoute(activeRoute);

  const handleCopyDirections = async () => {
    try {
      await navigator.clipboard.writeText(buildStoreDirectionsShareText());
      toast.success(
        "오시는 길 안내 문구(주소·진입 팁·지도 링크)가 복사되었습니다."
      );
    } catch {
      toast.error("안내 문구 복사에 실패했습니다.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={`${STORE.name} 오시는 길 약도 크게 보기`}
      panelClassName="max-w-4xl"
    >
      <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white shadow-2xl">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E5E3DC] bg-[#FAFAF8] px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="text-hb-base sm:text-hb-lg font-extrabold text-[#141A23] truncate">
              {STORE.name} 오시는 길 약도
            </h2>
            <p className="mt-0.5 text-hb-xs text-[#64748B] truncate">
              {STORE.roadAddress} · {STORE.jibunAddress} ({STORE.addressNote})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="약도 크게 보기 닫기"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#E5E3DC] bg-white text-[#475569] hover:border-[#141A23] hover:text-[#141A23] transition-colors cursor-pointer"
          >
            <Icon d={ICON.close} className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* 방면 선택 + 공유/PNG 저장 */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div
              role="tablist"
              aria-label="방면별 진입 동선 선택"
              className="inline-flex flex-wrap items-center gap-0.5 rounded-xl border border-[#E5E3DC] bg-[#F4F4F1] p-1"
            >
              {STORE_DIRECTION_ROUTES.map((route) => {
                const selected = activeRoute === route.id;
                return (
                  <button
                    key={route.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveRoute(route.id)}
                    className={`rounded-lg px-3 py-1.5 text-hb-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selected
                        ? "bg-[#141A23] text-white"
                        : "text-[#475569] hover:text-[#141A23]"
                    }`}
                  >
                    {route.shortLabel}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyDirections}
                className="hb-btn-outline h-9 px-3 text-hb-xs font-bold whitespace-nowrap cursor-pointer"
              >
                <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#141A23]" />
                <span>안내 문구 복사</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadBrandedDirectionsPng(modalSvgRef.current, activeRoute)
                }
                className="hb-btn-primary h-9 px-3.5 text-hb-xs font-bold whitespace-nowrap cursor-pointer"
              >
                <Icon d={ICON.download} className="w-3.5 h-3.5" />
                <span>약도 이미지 저장 (PNG)</span>
              </button>
            </div>
          </div>

          {/* 대형 일체형 약도 */}
          <div className="mx-auto w-full max-w-[820px] overflow-hidden rounded-xl border border-[#D4D1C7] bg-[#F3F1EC]">
            <DirectionsVectorSvg
              activeRoute={activeRoute}
              highlightedStep={highlightedStep}
              onSelectStep={(idx) => setSelectedPhotoIdx(idx)}
              svgRef={modalSvgRef}
              className="w-full h-auto block"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#141A23] px-4 py-2.5 text-white">
              <p className="text-hb-xs sm:text-hb-sm font-bold tracking-tight break-keep">
                {STORE.roadAddress}
              </p>
              <span className="text-hb-xs font-medium text-[#CBD5E1] whitespace-nowrap">
                {STORE.addressNote} · 전용 주차 8대
              </span>
            </div>
          </div>

          {/* 실제 골목 진입 3단계 실사 사진 안내 */}
          <div className="mx-auto w-full max-w-[820px]">
            <AlleyPhotoGuideStrip
              highlightedStep={highlightedStep}
              onHoverStep={setHighlightedStep}
              onSelectPhoto={(index) => setSelectedPhotoIdx(index)}
            />
          </div>

          {/* 2단 상세 단계별 안내 */}
          <div className="mx-auto w-full max-w-[820px] grid gap-4 border-t border-[#ECEBE6] pt-4 sm:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-hb-sm font-extrabold text-[#141A23]">
                  방면별 진입 순서
                </span>
                <span className="text-hb-xs text-[#64748B]">
                  · {currentRoute.originLabel}
                </span>
              </div>
              <ol className="mt-2 space-y-1.5 text-hb-xs sm:text-hb-sm text-[#334155]">
                {currentRoute.steps.map((step, idx) => (
                  <li key={step} className="flex items-start gap-2 break-keep">
                    <span className="font-mono font-bold text-[#C84312] tabular-nums shrink-0">
                      0{idx + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="sm:border-l sm:border-[#ECEBE6] sm:pl-5 space-y-2">
              <span className="block text-hb-sm font-extrabold text-[#141A23]">
                전용 주차 및 방문 안내
              </span>
              <p className="text-hb-xs sm:text-hb-sm text-[#334155] leading-relaxed break-keep">
                <strong className="font-bold text-[#141A23]">
                  매장 앞 전용 주차장(8대 · 1톤 화물 상차 가능)
                </strong>
                을 무료로 이용하실 수 있습니다.
              </p>
              <p className="text-hb-xs text-[#475569] leading-relaxed break-keep">
                영업시간 {STORE.hours} ({STORE.closed}) · 대표전화{" "}
                <span className="font-mono font-semibold text-[#141A23] tabular-nums">
                  {STORE.tel}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 모달 푸터: 내비게이션 3사 연결 */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#E5E3DC] bg-[#FAFAF8] px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={STORE_NAVIGATION.naverMap}
              target="_blank"
              rel="noopener noreferrer"
              className="hb-btn-outline h-9 px-3.5 text-hb-xs font-bold whitespace-nowrap"
            >
              <span>네이버 지도</span>
              <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#0F766E]" />
            </a>
            <a
              href={STORE_NAVIGATION.kakaoTo}
              target="_blank"
              rel="noopener noreferrer"
              className="hb-btn-outline h-9 px-3.5 text-hb-xs font-bold whitespace-nowrap"
            >
              <span>카카오맵 길찾기</span>
              <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#64748B]" />
            </a>
            <a
              href={STORE_NAVIGATION.tmapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hb-btn-outline h-9 px-3.5 text-hb-xs font-bold whitespace-nowrap"
            >
              <span>티맵 길안내</span>
              <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#64748B]" />
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hb-btn-outline h-9 px-4 text-hb-xs font-bold cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>

      <AlleyPhotoLightboxModal
        selectedIndex={selectedPhotoIdx}
        onSelectIndex={setSelectedPhotoIdx}
        onClose={() => setSelectedPhotoIdx(null)}
      />
    </Modal>
  );
}
