// 파일 경로: components/home/category-pictogram-bar.tsx
"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackEvent } from "../../lib/site";
import { Icon, ICON } from "../../lib/icons";
import {
  buildHomeGallerySearchHref,
  HOME_QUICK_SEARCH_KEYWORDS,
} from "../../lib/home-showroom-filter";
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
  searchQuery = "",
  onSearchQueryChange,
  onQuickKeywordSelect,
  filteredCount,
  embedded = false,
}: {
  selectedKey?: PictogramKey;
  onSelectCategory?: (item: ShowroomCategoryItem) => void;
  categoryCounts?: Partial<Record<PictogramKey, number>>;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onQuickKeywordSelect?: (keyword: string) => void;
  filteredCount?: number;
  embedded?: boolean;
}) {
  const router = useRouter();
  const railRef = useRef<HTMLDivElement | null>(null);
  const [groupFilter, setGroupFilter] = useState<ShowroomGroupFilter>("all");
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
  const trimmedSearch = searchQuery.trim();
  const selectedCount =
    trimmedSearch && typeof filteredCount === "number"
      ? filteredCount
      : typeof categoryCounts?.[selectedItem.key] === "number"
      ? categoryCounts[selectedItem.key]
      : categoryCounts?.all;
  const selectedWarranty = getShowroomCategoryWarrantyLabel(selectedItem);

  const cardViewHref = buildHomeGallerySearchHref({
    baseHref: selectedItem.href || "/gallery",
    searchQuery: trimmedSearch,
    view: "card",
  });
  const tableViewHref = buildHomeGallerySearchHref({
    baseHref: selectedItem.href || "/gallery",
    searchQuery: trimmedSearch,
    view: "table",
  });

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchQuery.trim();
    trackEvent("search_products", {
      query_length: q.length,
      category: selectedItem.label,
      location: "home_showroom_bar",
    });
    router.push(
      buildHomeGallerySearchHref({
        baseHref: selectedItem.href || "/gallery",
        searchQuery: q,
        view: "card",
      })
    );
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
    };

    const finishDrag = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", finishDrag);
      window.removeEventListener("blur", finishDrag);
      dragCleanupRef.current = null;

      if (!moved) return;

      setIsDragging(false);

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
      const container = railRef.current;
      if (container.scrollWidth > container.clientWidth + 4) {
        buttonEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }

    if (onSelectCategory) {
      onSelectCategory(item);
    }
  };

  const handleGroupTabClick = (nextGroup: ShowroomGroupFilter) => {
    setGroupFilter(nextGroup);
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

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      id="category-section"
      aria-label="취급 품목 및 쇼룸 카테고리"
      className={
        embedded
          ? "bg-white pt-10 pb-4 sm:pt-14 sm:pb-5"
          : "bg-white pt-10 pb-6 sm:pt-14 sm:pb-8"
      }
    >
      <div className="hb-container">
        {/* 1. 간결한 쇼룸 헤더 & 갤러리/일람표 바로가기 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h2
                id={embedded ? "category-heading" : "featured-heading"}
                className="text-hb-xl sm:text-hb-2xl font-bold text-[#141A23] tracking-[-0.028em] leading-tight break-keep"
              >
                {selectedItem.key === "all"
                  ? "찾으시는 품목을 선택해 보세요"
                  : selectedItem.label}
              </h2>
              {typeof selectedCount === "number" && (
                <span className="font-mono text-hb-xs sm:text-hb-sm font-bold text-[#64748B] tabular-nums">
                  {trimmedSearch
                    ? `${selectedCount}건 검색됨`
                    : `${selectedCount}건 전시중`}
                </span>
              )}
              {(selectedItem.key !== "all" || trimmedSearch) &&
                onSelectCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setGroupFilter("all");
                      onSelectCategory(SHOWROOM_CATEGORIES[0]);
                      onSearchQueryChange?.("");
                    }}
                    className="text-hb-xs font-bold text-[#C84312] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
                  >
                    {trimmedSearch ? "검색 초기화" : "전체 보기"}
                  </button>
                )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-hb-xs sm:text-hb-sm">
            <Link
              href={tableViewHref}
              className="inline-flex items-center gap-1 font-semibold text-[#526071] hover:text-[#141A23] transition-colors whitespace-nowrap"
            >
              <Icon d={ICON.list} className="w-3.5 h-3.5 text-[#C84312]" />
              <span>스펙 일람표</span>
            </Link>
            <span className="text-[#CFC7BA]" aria-hidden="true">
              ·
            </span>
            <Link
              href={cardViewHref}
              className="inline-flex items-center gap-1 font-bold text-[#141A23] hover:text-[#C84312] transition-colors whitespace-nowrap"
            >
              <span>전체 갤러리 보기</span>
              <Icon d={ICON.right} className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 2. 원형 카테고리 레일 (불스원몰 스타일 경량 스튜디오 원형 썸네일) */}
        <div className="mt-6 sm:mt-8">
          <div
            ref={setRailRef}
            onMouseDown={handleRailMouseDown}
            onClickCapture={handleRailClickCapture}
            onDragStart={(e) => e.preventDefault()}
            data-dragging={isDragging ? "true" : "false"}
            className={`flex items-start gap-3 sm:gap-5 lg:gap-4 overflow-x-auto lg:overflow-visible [overscroll-behavior-x:contain] snap-x snap-mandatory scrollbar-none py-2 px-1 -mx-1 select-none ${
              groupFilter === "all" ? "lg:justify-between" : "lg:justify-start"
            } ${
              isDragging
                ? "scroll-auto cursor-grabbing"
                : "scroll-smooth cursor-pointer"
            }`}
          >
            {visibleItems.map((item) => {
              const isSelected = selectedItem.key === item.key;
              const count = categoryCounts?.[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={isSelected}
                  data-active={isSelected ? "true" : "false"}
                  onClick={(e) => handleCategoryClick(item, e.currentTarget)}
                  className={`group snap-start shrink-0 w-[84px] sm:w-[104px] ${
                    groupFilter === "all"
                      ? "lg:w-auto lg:flex-1 lg:max-w-[132px]"
                      : "lg:w-[120px]"
                  } flex flex-col items-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] focus-visible:ring-offset-4 rounded-2xl py-1 [touch-action:manipulation] ${
                    isDragging ? "cursor-grabbing" : "cursor-pointer"
                  }`}
                >
                  {/* 정원 스튜디오 썸네일: layout 점프 없이 ring-shadow만으로 활성 강조 */}
                  <span
                    className={`relative grid h-[74px] w-[74px] sm:h-[92px] sm:w-[92px] rounded-full overflow-hidden bg-[#F5F4F0] transition-[transform,box-shadow] duration-200 ${
                      isSelected
                        ? "ring-2 ring-[#C84312] ring-offset-2 shadow-sm scale-[1.03]"
                        : "ring-1 ring-[#E6E1D6] group-hover:ring-[#CFC7BA] group-hover:-translate-y-0.5"
                    }`}
                  >
                    <Image
                      src={item.imageSrc}
                      alt={item.imageAlt}
                      fill
                      draggable={false}
                      sizes="(max-width: 640px) 74px, 92px"
                      referrerPolicy="no-referrer"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                    />
                  </span>

                  <span
                    className={`mt-2.5 block w-full text-hb-xs sm:text-hb-sm leading-snug tracking-tight truncate transition-colors ${
                      isSelected
                        ? "text-[#C84312]"
                        : "text-[#141A23] group-hover:text-[#C84312]"
                    }`}
                  >
                    <strong className="font-bold">{item.label}</strong>
                  </span>
                  <span className="mt-0.5 block font-mono text-hb-xs text-[#64748B] tabular-nums">
                    {typeof count === "number"
                      ? `${count}건`
                      : item.group === "biz"
                      ? "업소"
                      : "전체"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 가정용 · 업소용 구분 탭 + 슬림 검색바 통합 1줄 도크 */}
        <div className="mt-6 pt-5 border-t border-[#ECE7DE] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex items-center gap-5 shrink-0 overflow-x-auto scrollbar-none"
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
                  className={`relative pb-2 text-hb-sm font-bold transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] rounded-t [touch-action:manipulation] ${
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

          {onSearchQueryChange && (
            <form
              role="search"
              aria-label="홈 쇼룸 매물 빠른 검색"
              onSubmit={handleSearchSubmit}
              className="flex flex-1 max-w-xl items-center gap-2"
            >
              <div className="relative flex-1 min-w-0">
                <Icon
                  d={ICON.search}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]"
                />
                <input
                  id="home-showroom-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder="품목·브랜드·규격 검색 (예: 45박스, 벽걸이 에어컨, 삼성)"
                  aria-label="품목, 브랜드, 규격 빠른 검색"
                  className="w-full h-10 rounded-full border border-[#DFD9CE] bg-[#F7F6F3] pl-10 pr-9 text-hb-sm text-[#141A23] placeholder:text-[#64748B] focus:border-[#141A23] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#141A23]/10 transition-[border-color,background-color,box-shadow]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchQueryChange("")}
                    aria-label="검색어 지우기"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full text-[#64748B] hover:bg-[#E7E2D8] hover:text-[#141A23] cursor-pointer"
                  >
                    <Icon d={ICON.close} className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="hb-btn-outline h-10 rounded-full px-4 text-hb-xs font-bold shrink-0 whitespace-nowrap cursor-pointer bg-white"
              >
                <span>
                  {trimmedSearch && typeof selectedCount === "number"
                    ? `${selectedCount}건 결과 →`
                    : "전체 검색"}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* 4. 인기 검색어 + 선택 품목 출고 기준 1줄 스트립 */}
        {onSearchQueryChange && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-hb-xs text-[#64748B]">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <span className="font-semibold text-[#64748B] shrink-0 whitespace-nowrap pr-1">
                인기
              </span>
              {HOME_QUICK_SEARCH_KEYWORDS.map((keyword) => {
                const isActiveKeyword =
                  trimmedSearch.toLowerCase() === keyword.toLowerCase();
                return (
                  <button
                    key={keyword}
                    type="button"
                    aria-pressed={isActiveKeyword}
                    onClick={() => {
                      const nextKeyword = isActiveKeyword ? "" : keyword;
                      trackEvent("search_products", {
                        query_length: nextKeyword.length,
                        category: "인기검색어",
                        location: "home_showroom_quick_keyword",
                      });
                      if (onQuickKeywordSelect) {
                        setGroupFilter("all");
                        onQuickKeywordSelect(nextKeyword);
                      } else {
                        onSearchQueryChange(nextKeyword);
                      }
                    }}
                    className={`min-h-[28px] rounded-full px-2.5 py-0.5 text-hb-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActiveKeyword
                        ? "bg-[#141A23] text-white font-semibold"
                        : "bg-[#F5F4F0] text-[#475569] hover:bg-[#EAE6DD] hover:text-[#141A23]"
                    }`}
                  >
                    {keyword}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0 text-hb-xs">
              <span className="text-[#526071]">{selectedItem.specPoint}</span>
              <span className="text-[#CFC7BA]" aria-hidden="true">
                ·
              </span>
              <span className="font-bold text-[#C84312]">{selectedWarranty}</span>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
