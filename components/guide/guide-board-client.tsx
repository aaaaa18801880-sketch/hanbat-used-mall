// 파일 경로: components/guide/guide-board-client.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  INFO_GUIDE_CATEGORY_LIST,
  type InfoGuideArticle,
  type InfoGuideFilterCategory,
} from "../../lib/info-guides";
import { STORE, telHref, trackEvent } from "../../lib/site";
import { ICON, Icon } from "../../lib/ui";

function parseInitialCategory(
  raw: string | null
): InfoGuideFilterCategory {
  if (!raw) return "전체";
  const matched = INFO_GUIDE_CATEGORY_LIST.find((cat) => cat === raw);
  return matched ?? "전체";
}

function getCategoryBadgeClass(category: InfoGuideArticle["category"]): string {
  switch (category) {
    case "에어컨 · A/S":
    case "에어컨 · 원리/설치":
      return "border-[#DBEAFE] bg-[#F8FAFC] text-[#1E40AF]";
    case "전기 · 220V/380V":
    case "업소용 주방설비":
      return "border-[#FED7AA] bg-[#FFFBF5] text-[#9A3412]";
    case "냉장고 · 세탁기":
    case "창업 · 폐업":
    case "배송 · 사다리차":
    case "중고 구매 팁":
      return "border-[#E2E6EC] bg-[#F8FAFC] text-[#334155]";
  }
}

export function GuideBoardClient({
  articles,
}: {
  articles: readonly InfoGuideArticle[];
}) {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] =
    useState<InfoGuideFilterCategory>(() =>
      parseInitialCategory(searchParams.get("category"))
    );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q")?.trim() ?? ""
  );

  const pinnedArticles = useMemo(
    () => articles.filter((a) => a.isPinned).slice(0, 3),
    [articles]
  );

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter((article) => {
      if (
        selectedCategory !== "전체" &&
        article.category !== selectedCategory
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        article.title,
        article.summary,
        article.category,
        ...article.keywords,
        ...article.keyPoints,
        ...article.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [articles, selectedCategory, searchQuery]);

  const handleSelectCategory = (
    cat: InfoGuideFilterCategory,
    btnEl: HTMLButtonElement
  ) => {
    setSelectedCategory(cat);
    btnEl.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (cat === "전체") url.searchParams.delete("category");
      else url.searchParams.set("category", cat);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const resetFilters = () => {
    setSelectedCategory("전체");
    setSearchQuery("");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/guide");
    }
  };

  return (
    <div className="space-y-7 sm:space-y-9">
      {/* 1. 많이 찾는 안내 3선 */}
      <section aria-labelledby="pinned-guides-heading">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2
            id="pinned-guides-heading"
            className="text-hb-sm sm:text-hb-base font-bold text-[#141A23] [text-wrap:balance]"
          >
            자주 찾는 필독 안내
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pinnedArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/guide/${article.slug}`}
              className="group hb-surface-card p-4 sm:p-5 flex flex-col justify-between gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23]"
            >
              <div>
                <span
                  className={`hb-trim inline-flex items-center rounded-md border px-2 py-0.5 text-hb-xs font-bold mb-2 ${getCategoryBadgeClass(
                    article.category
                  )}`}
                >
                  {article.category}
                </span>
                <h3 className="text-hb-base font-bold text-[#141A23] group-hover:text-[#E8521A] transition-colors leading-snug break-keep [text-wrap:balance]">
                  {article.title}
                </h3>
              </div>
              <p className="text-hb-xs sm:text-hb-sm text-[#475569] leading-[1.55] line-clamp-2 [text-wrap:pretty]">
                {article.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. 분류 필터 + 키워드 검색 툴바 */}
      <section aria-labelledby="guide-board-list-heading" className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div
            role="group"
            aria-label="정보 게시판 분류 필터"
            className="flex flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-none hb-hscroll-fade pb-1"
          >
            {INFO_GUIDE_CATEGORY_LIST.map((cat) => {
              const selected = selectedCategory === cat;
              const count =
                cat === "전체"
                  ? articles.length
                  : articles.filter((a) => a.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={selected}
                  onClick={(e) => handleSelectCategory(cat, e.currentTarget)}
                  className={`hb-tab-indicator shrink-0 inline-flex items-center gap-1.5 rounded-xl min-h-[40px] px-3.5 py-2 text-hb-xs sm:text-hb-sm font-semibold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.96] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] ${
                    selected
                      ? "bg-[#141A23] text-white border border-[#141A23]"
                      : "bg-white border border-[#E2E6EC] text-[#334155] hover:border-[#CBD2DC] hover:text-[#141A23]"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-hb-xs tabular-nums ${
                      selected ? "text-white/75" : "text-[#64748B]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-80 shrink-0">
            <label htmlFor="guide-search-input" className="sr-only">
              정보 게시글 검색
            </label>
            <Icon
              d={ICON.search}
              className="w-4 h-4 text-[#64748B] pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              id="guide-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="주제 검색 (예: 380V, 냉장고, 제빙기, 누수)"
              className="hb-input pl-10 pr-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="검색어 지우기"
                className="grid h-7 w-7 place-items-center rounded-full text-[#64748B] hover:bg-[#F1F3F6] hover:text-[#141A23] absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <Icon d={ICON.close} className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-hb-xs sm:text-hb-sm text-[#475569]">
          <h2 id="guide-board-list-heading" className="font-bold text-[#141A23]">
            전체 게시글 목록{" "}
            <span className="text-[#E8521A] tabular-nums">
              {filteredArticles.length}건
            </span>
          </h2>
          {(selectedCategory !== "전체" || searchQuery.trim() !== "") && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-hb-xs font-bold text-[#141A23] hover:text-[#E8521A] underline underline-offset-4 cursor-pointer"
            >
              필터 초기화
            </button>
          )}
        </div>

        {/* 3. 게시판 목록 */}
        <div className="overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white shadow-2xs">
          <div
            aria-hidden="true"
            className="hidden md:grid md:grid-cols-[64px_150px_1fr_44px] items-center border-b border-[#E2E6EC] bg-[#F7F8FA] px-5 py-3 text-hb-xs font-bold text-[#475569]"
          >
            <span>번호</span>
            <span>분류</span>
            <span>제목 · 내용 요약</span>
            <span />
          </div>

          {filteredArticles.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-3">
              <p className="text-hb-base font-bold text-[#141A23]">
                일치하는 정보 글이 없습니다.
              </p>
              <p className="text-hb-sm text-[#475569]">
                다른 검색어나 분류를 선택해 보시거나, 궁금한 내용은 문의 게시판에 남겨주세요.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="hb-btn-outline min-h-[40px] px-4 py-2 text-hb-xs"
                >
                  전체 글 보기
                </button>
                <Link
                  href="/inquiry?write=1"
                  className="hb-btn-primary min-h-[40px] px-4 py-2 text-hb-xs"
                >
                  1:1 질문 남기기
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-[#E2E6EC]">
              {filteredArticles.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/guide/${article.slug}`}
                    className="group grid grid-cols-1 md:grid-cols-[64px_150px_1fr_44px] items-start md:items-center gap-2 md:gap-3 px-4 py-4 sm:px-5 sm:py-4 hover:bg-[#F7F8FA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#141A23]"
                  >
                    {/* 번호 + 모바일 분류 */}
                    <div className="flex items-center justify-between md:justify-start gap-2">
                      <span className="font-mono text-hb-xs font-bold text-[#64748B] tabular-nums">
                        {String(article.number).padStart(2, "0")}
                      </span>
                      <span
                        className={`md:hidden hb-trim inline-flex items-center rounded-md border px-2 py-0.5 text-hb-xs font-bold ${getCategoryBadgeClass(
                          article.category
                        )}`}
                      >
                        {article.category}
                      </span>
                    </div>

                    {/* 데스크톱 분류 */}
                    <div className="hidden md:flex items-center">
                      <span
                        className={`hb-trim inline-flex items-center rounded-md border px-2.5 py-1 text-hb-xs font-bold ${getCategoryBadgeClass(
                          article.category
                        )}`}
                      >
                        {article.category}
                      </span>
                    </div>

                    {/* 제목 + 요약 */}
                    <div className="min-w-0">
                      <h3 className="text-hb-base sm:text-hb-lg font-bold text-[#141A23] group-hover:text-[#E8521A] transition-colors leading-snug break-keep [text-wrap:balance]">
                        {article.title}
                      </h3>
                      <p className="mt-1 max-w-[68ch] text-hb-xs sm:text-hb-sm text-[#475569] leading-[1.6] line-clamp-2 [text-wrap:pretty]">
                        {article.summary}
                      </p>
                    </div>

                    {/* 화살표 */}
                    <div className="hidden md:flex items-center justify-end">
                      <Icon
                        d={ICON.right}
                        className="w-4 h-4 text-[#94A3B8] group-hover:text-[#E8521A] group-hover:translate-x-0.5 transition-transform"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 4. 현장 상담 연결 */}
      <section
        aria-label="현장 조건 직접 문의 안내"
        className="rounded-2xl border border-[#E2E6EC] bg-white px-5 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <p className="text-hb-sm text-[#334155]">
          분전함이나 출입구 폭이 애매하다면 사진을 찍어 문의글이나 전화로 미리 확인하실 수 있습니다.
        </p>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/inquiry?write=1"
            className="hb-btn-primary min-h-[40px] px-3.5 py-2 text-hb-xs sm:text-hb-sm"
          >
            <span>사진 첨부해 문의하기</span>
          </Link>
          <a
            href={telHref(STORE.tel)}
            onClick={() =>
              trackEvent("click_tel_consult", { location: "guide_board" })
            }
            className="hb-btn-outline min-h-[40px] px-3.5 py-2 text-hb-xs sm:text-hb-sm tabular-nums"
          >
            <Icon d={ICON.phone} className="w-4 h-4 text-[#E8521A]" />
            <span>{STORE.tel}</span>
          </a>
        </div>
      </section>
    </div>
  );
}
