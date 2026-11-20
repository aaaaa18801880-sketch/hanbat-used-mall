// 파일 경로: components/home/category-pictogram-bar.tsx
"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackEvent } from "../../lib/site";
import { Icon, ICON } from "../../lib/icons";
import {
  SHOWROOM_CATEGORIES,
  SHOWROOM_GROUP_TABS,
  computeRailDragScroll,
  filterShowroomCategoriesByGroup,
  getShowroomCategoryWarrantyLabel,
  matchesShowroomCategory,
  type PictogramKey,
  type ShowroomCategoryItem,
  type ShowroomGroupFilter,
} from "../../lib/showroom-categories";

export {
  SHOWROOM_CATEGORIES,
  getShowroomCategoryWarrantyLabel,
  matchesShowroomCategory,
  type PictogramKey,
  type ShowroomCategoryItem,
};

export function CategoryPictogramBar({
  selectedKey = "all",
  onSelectCategory,
  categoryCounts,
  embedded = false,
}: {
  selectedKey?: PictogramKey;
  onSelectCategory?: (item: ShowroomCategoryItem) => void;
  categoryCounts?: Partial<Record<PictogramKey, number>>;
  embedded?: boolean;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [groupFilter, setGroupFilter] = useState<ShowroomGroupFilter>("all");
  const [scrollRatio, setScrollRatio] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const suppressClickRef = useRef(false);
  const momentumRafRef = useRef<number | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  const cancelMomentum = useCallback(() => {
    if (momentumRafRef.current !== null) {
      window.cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }
  }, []);

  const setRailRef = useCallback(
    (node: HTMLDivElement | null) => {
      railRef.current = node;
      if (!node) {
        cancelMomentum();
        dragCleanupRef.current?.();
      }
    },
    [cancelMomentum]
  );

  const visibleItems = filterShowroomCategoriesByGroup(groupFilter);

  const selectedItem =
    SHOWROOM_CATEGORIES.find((c) => c.key === selectedKey) ||
    SHOWROOM_CATEGORIES[0];
  const selectedIndex = Math.max(
    0,
    visibleItems.findIndex((c) => c.key === selectedItem.key)
  );
  const selectedCount =
    typeof categoryCounts?.[selectedItem.key] === "number"
      ? categoryCounts[selectedItem.key]
      : categoryCounts?.all;
  const selectedWarranty = getShowroomCategoryWarrantyLabel(selectedItem);

  const cardViewHref = selectedItem.href || "/gallery";
  const tableViewHref = cardViewHref.includes("?")
    ? `${cardViewHref}&view=table`
    : `${cardViewHref}?view=table`;

  const syncScrollProgress = () => {
    const el = railRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 4) {
      setScrollRatio(0);
      return;
    }
    setScrollRatio(Math.min(1, Math.max(0, el.scrollLeft / maxScroll)));
  };

  const scrollRailBy = (direction: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    cancelMomentum();
    el.style.scrollBehavior = "";
    const step = Math.max(260, Math.round(el.clientWidth * 0.55));
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const handleRailMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = railRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    if (maxScrollLeft <= 4) return;

    cancelMomentum();
    dragCleanupRef.current?.();

    const startX = e.clientX;
    const startScrollLeft = el.scrollLeft;
    let moved = false;
    let lastX = e.clientX;
    let lastTime = e.timeStamp;
    let velocityPxPerMs = 0;

    const handleMouseMove = (moveEv: MouseEvent) => {
      const currentMaxScroll = el.scrollWidth - el.clientWidth;
      const result = computeRailDragScroll({
        startX,
        currentX: moveEv.clientX,
        startScrollLeft,
        maxScrollLeft: currentMaxScroll,
      });

      const dt = Math.max(1, moveEv.timeStamp - lastTime);
      const instantVelocity = (lastX - moveEv.clientX) / dt;
      velocityPxPerMs = velocityPxPerMs * 0.5 + instantVelocity * 0.5;
      lastX = moveEv.clientX;
      lastTime = moveEv.timeStamp;

      if (!result.isDragging) return;

      if (!moved) {
        moved = true;
        suppressClickRef.current = true;
        el.style.scrollBehavior = "auto";
        setIsDragging(true);
      }

      moveEv.preventDefault();
      el.scrollLeft = result.nextScrollLeft;
      syncScrollProgress();
    };

    const finishDrag = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", finishDrag);
      window.removeEventListener("blur", finishDrag);
      dragCleanupRef.current = null;

      if (!moved) return;

      setIsDragging(false);

      /* 드래그 직후 발생하는 click 1회만 차단하고, 레일 밖에서 놓은 경우 다음 프레임에 자동 해제 */
      window.requestAnimationFrame(() => {
        suppressClickRef.current = false;
      });

      let frameVelocity = velocityPxPerMs * 16;
      if (Math.abs(frameVelocity) > 1.2) {
        const glideStep = () => {
          const maxScroll = el.scrollWidth - el.clientWidth;
          const next = Math.min(
            maxScroll,
            Math.max(0, el.scrollLeft + frameVelocity)
          );
          el.scrollLeft = next;
          syncScrollProgress();
          frameVelocity *= 0.91;

          const hitEdge = next <= 0 || next >= maxScroll;
          if (!hitEdge && Math.abs(frameVelocity) > 0.35) {
            momentumRafRef.current = window.requestAnimationFrame(glideStep);
          } else {
            momentumRafRef.current = null;
            el.style.scrollBehavior = "";
          }
        };
        momentumRafRef.current = window.requestAnimationFrame(glideStep);
      } else {
        el.style.scrollBehavior = "";
      }
    };

    dragCleanupRef.current = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", finishDrag);
      window.removeEventListener("blur", finishDrag);
      el.style.scrollBehavior = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", finishDrag);
    window.addEventListener("blur", finishDrag);
  };

  const handleRailClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClickRef.current = false;
  };

  const handleCategoryClick = (
    item: ShowroomCategoryItem,
    buttonEl?: HTMLButtonElement | null
  ) => {
    trackEvent("filter_gallery", {
      category: item.label,
      location: "top_pictogram_bar",
    });

    if (buttonEl && railRef.current) {
      buttonEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }

    if (onSelectCategory) {
      onSelectCategory(item);
    }
  };

  const handleGroupTabClick = (nextGroup: ShowroomGroupFilter) => {
    setGroupFilter(nextGroup);
    setScrollRatio(0);
    if (railRef.current) {
      railRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
    if (nextGroup !== "all" && onSelectCategory) {
      const nextItems = filterShowroomCategoriesByGroup(nextGroup);
      const stillVisible = nextItems.some((c) => c.key === selectedKey);
      if (!stillVisible && nextItems[0]) {
        onSelectCategory(nextItems[0]);
      }
    }
  };

  /* 스크롤바가 없는 넓은 뷰포트에서는 선택 카드 위치를 진행 바로 표시 */
  const trackSegmentWidthPct = Math.max(
    18,
    Math.round(100 / Math.max(visibleItems.length, 1))
  );
  const derivedOffsetPct =
    scrollRatio > 0.01
      ? Math.round(scrollRatio * (100 - trackSegmentWidthPct))
      : visibleItems.length > 1
      ? Math.round(
          (selectedIndex / (visibleItems.length - 1)) *
            (100 - trackSegmentWidthPct)
        )
      : 0;

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      id="category-section"
      aria-label="취급 품목 및 쇼룸 카테고리"
      className={
        embedded
          ? "bg-white pt-8 pb-5 sm:pt-11 sm:pb-6"
          : "bg-white pt-10 pb-6 sm:pt-12 sm:pb-8"
      }
    >
      <div className="hb-container">
        {/* 1. 상단 에디토리얼 타이틀 & 뷰 스위처 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2
                id={embedded ? "category-heading" : "featured-heading"}
                className="text-hb-2xl sm:text-hb-3xl font-bold text-[#141A23] tracking-[-0.03em] leading-[1.2] break-keep"
              >
                {selectedItem.key === "all"
                  ? "품목별 쇼룸"
                  : selectedItem.label}
              </h2>
              {typeof selectedCount === "number" && (
                <span className="font-mono text-hb-sm sm:text-hb-base font-bold text-[#475569] tabular-nums">
                  {selectedCount}건 전시중
                </span>
              )}
              {selectedItem.key !== "all" && onSelectCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setGroupFilter("all");
                    onSelectCategory(SHOWROOM_CATEGORIES[0]);
                  }}
                  className="text-hb-xs font-bold text-[#C84312] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
                >
                  전체 보기
                </button>
              )}
            </div>
            <p className="mt-1.5 text-hb-sm text-[#475569] leading-[1.55] break-keep">
              {selectedItem.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div
              className="hb-segmented-control"
              role="group"
              aria-label="갤러리 보기 방식"
            >
              <Link
                href={cardViewHref}
                className="hb-segmented-item bg-[#141A23] text-white shadow-2xs hover:bg-[#1E2736]"
              >
                <Icon d={ICON.grid} className="w-3.5 h-3.5 text-[#FF8A50]" />
                <span>카드형 갤러리</span>
              </Link>
              <Link
                href={tableViewHref}
                className="hb-segmented-item text-[#334155] hover:bg-white hover:text-[#141A23]"
              >
                <Icon d={ICON.list} className="w-3.5 h-3.5 text-[#C84312]" />
                <span>스펙 일람표</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. 가정용 · 업소용 빠른 구분 탭 (모바일·데스크톱 단일행 고정) */}
        <div className="mt-5 flex items-center justify-between gap-3 border-b border-[#E2DDD3] overflow-x-auto scrollbar-none">
          <div
            className="flex items-center gap-5 sm:gap-7 shrink-0"
            role="tablist"
            aria-label="품목 그룹 선택"
          >
            {SHOWROOM_GROUP_TABS.map((tab) => {
              const active = groupFilter === tab.key;
              const tabCount = filterShowroomCategoriesByGroup(tab.key).length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleGroupTabClick(tab.key)}
                  className={`relative pb-3 text-hb-sm font-bold transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] rounded-t ${
                    active
                      ? "text-[#141A23]"
                      : "text-[#64748B] hover:text-[#141A23]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="ml-1.5 font-mono text-hb-xs font-semibold text-[#64748B] tabular-nums">
                    {tabCount}
                  </span>
                  <span
                    className={`absolute inset-x-0 bottom-0 h-[2px] bg-[#141A23] transition-opacity duration-150 ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 삼성·LG 쇼룸 스타일 스튜디오 품목 레일 (마우스 클릭·드래그 가로 이동 지원) */}
        <div className="mt-5">
          <div className="relative">
            <div
              ref={setRailRef}
              onScroll={syncScrollProgress}
              onMouseDown={handleRailMouseDown}
              onClickCapture={handleRailClickCapture}
              onDragStart={(e) => e.preventDefault()}
              data-dragging={isDragging ? "true" : "false"}
              className={`flex items-stretch gap-3 sm:gap-3.5 overflow-x-auto scrollbar-none py-1.5 px-0.5 -mx-0.5 pr-8 select-none ${
                isDragging
                  ? "scroll-auto cursor-grabbing"
                  : "scroll-smooth cursor-grab"
              }`}
            >
              {visibleItems.map((item) => {
                const isSelected = selectedItem.key === item.key;
                const count = categoryCounts?.[item.key];
                const warrantyLabel = getShowroomCategoryWarrantyLabel(item);

                if (isSelected) {
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={true}
                      data-active="true"
                      onClick={(e) => handleCategoryClick(item, e.currentTarget)}
                      className={`hb-showroom-card group snap-start shrink-0 w-[308px] sm:w-[364px] lg:w-[392px] min-h-[172px] sm:min-h-[188px] border-2 border-[#141A23] grid grid-cols-[1.06fr_0.94fr] items-stretch text-left ${
                        isDragging ? "cursor-grabbing" : "cursor-grab"
                      }`}
                    >
                      {/* 좌측: 에디토리얼 품목 정보 */}
                      <div className="flex flex-col justify-between p-4 sm:p-5 pr-3 min-w-0">
                        <div>
                          <strong className="block text-hb-base sm:text-hb-lg font-bold tracking-[-0.025em] text-[#141A23] leading-snug">
                            {item.label}
                          </strong>
                          <p className="mt-1 text-hb-xs font-semibold text-[#334155] leading-snug">
                            {item.subLabel}
                          </p>
                          <p className="mt-1.5 text-hb-xs text-[#64748B] leading-[1.45] line-clamp-2 break-keep">
                            {item.tagline}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[#E2DDD3] flex flex-wrap items-center gap-x-2 gap-y-0.5 text-hb-xs">
                          <span className="font-bold text-[#141A23] tabular-nums">
                            {typeof count === "number"
                              ? `${count}건`
                              : item.group === "biz"
                              ? "업소"
                              : "전체"}
                          </span>
                          <span className="text-[#CBD2DC]" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-semibold text-[#C84312] truncate">
                            {warrantyLabel}
                          </span>
                        </div>
                      </div>

                      {/* 우측: 풀블리드 스튜디오 가전 오브젝트 */}
                      <div className="relative overflow-hidden bg-[#F2EFE7] border-l border-[#E7E2D8]">
                        <Image
                          src={item.imageSrc}
                          alt={item.imageAlt}
                          fill
                          draggable={false}
                          sizes="(max-width: 640px) 160px, 200px"
                          referrerPolicy="no-referrer"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                        />
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={false}
                    data-active="false"
                    onClick={(e) => handleCategoryClick(item, e.currentTarget)}
                    className={`hb-showroom-card group snap-start shrink-0 w-[146px] sm:w-[166px] lg:w-[176px] min-h-[172px] sm:min-h-[188px] border border-[#EAE6DD] hover:border-[#CFC8BA] flex flex-col items-center justify-between pt-3.5 pb-2 px-2 text-center ${
                      isDragging ? "cursor-grabbing" : "cursor-grab"
                    }`}
                  >
                    {/* 상단: 정갈한 중앙 타이틀 + 무박스 수량 텍스트 */}
                    <div className="w-full px-1">
                      <strong className="block text-hb-sm font-bold tracking-[-0.02em] text-[#141A23] group-hover:text-[#C84312] transition-colors duration-150 truncate">
                        {item.label}
                      </strong>
                      <span className="mt-0.5 block font-mono text-hb-xs font-medium text-[#64748B] tabular-nums">
                        {typeof count === "number"
                          ? `${count}건`
                          : item.group === "biz"
                          ? "업소용"
                          : "전체"}
                      </span>
                    </div>

                    {/* 하단: 라운드 스튜디오 프레임 */}
                    <div className="relative mt-2 w-full h-[108px] sm:h-[120px] rounded-xl overflow-hidden bg-[#F2EFE7]">
                      <Image
                        src={item.imageSrc}
                        alt={item.imageAlt}
                        fill
                        draggable={false}
                        sizes="(max-width: 640px) 146px, 176px"
                        referrerPolicy="no-referrer"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 좌측 수평 스크롤 힌트 페이드 */}
            <div
              className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent transition-opacity duration-200 ${
                scrollRatio > 0.03 ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            />

            {/* 우측 수평 스크롤 힌트 페이드 */}
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent transition-opacity duration-200 ${
                scrollRatio > 0.92 ? "opacity-0" : "opacity-100"
              }`}
              aria-hidden="true"
            />
          </div>

          {/* 4. 하단 삼성·LG 스타일 진행 트랙 & 원형 좌우 네비게이션 */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md flex items-center gap-3">
              <div
                className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-[#E2DDD3]"
                aria-hidden="true"
              >
                <div
                  className="absolute inset-y-0 rounded-full bg-[#141A23] transition-[left,width] duration-200"
                  style={{
                    left: `${derivedOffsetPct}%`,
                    width: `${trackSegmentWidthPct}%`,
                  }}
                />
              </div>
              <span className="font-mono text-hb-xs font-semibold text-[#64748B] tabular-nums shrink-0">
                {String(selectedIndex + 1).padStart(2, "0")} /{" "}
                {String(visibleItems.length).padStart(2, "0")}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scrollRailBy(-1)}
                aria-label="이전 품목 보기"
                className="hb-nav-circle"
              >
                <Icon d={ICON.left} className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRailBy(1)}
                aria-label="다음 품목 보기"
                className="hb-nav-circle"
              >
                <Icon d={ICON.right} className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 5. 선택 품목 핵심 점검·보증 요약 스트립 (헤어라인 1줄, Zero-Pill) */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-y border-[#E2DDD3] py-3 text-hb-xs sm:text-hb-sm">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[#334155]">
            <span className="font-bold text-[#141A23]">
              {selectedItem.label} 점검 기준
            </span>
            <span className="text-[#CBD2DC]" aria-hidden="true">
              ·
            </span>
            <span>{selectedItem.specPoint}</span>
            <span className="text-[#CBD2DC]" aria-hidden="true">
              ·
            </span>
            <span className="font-bold text-[#C84312]">{selectedWarranty}</span>
          </div>

          <Link
            href={cardViewHref}
            className="inline-flex items-center gap-1 text-hb-xs sm:text-hb-sm font-bold text-[#141A23] hover:text-[#C84312] transition-colors whitespace-nowrap"
          >
            <span>{selectedItem.label} 전체 보기</span>
            <Icon d={ICON.right} className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Wrapper>
  );
}
