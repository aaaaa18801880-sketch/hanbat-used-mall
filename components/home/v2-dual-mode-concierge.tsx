// 파일 경로: components/home/v2-dual-mode-concierge.tsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  formatProductPrice,
  hasProductPrice,
  isProductSold,
  normalizeProductCategory,
  splitImages,
  toggleQuoteBasketItem,
  trackEvent,
  type InquiryTypeValue,
} from "../../lib/site";
import { Icon, ICON, SafeImg } from "../../lib/ui";
import type { ProductItem } from "../products/product-card";

type ShowroomMode = "b2c" | "b2b";

interface ScenarioOption {
  id: string;
  mode: ShowroomMode;
  label: string;
  desc: string;
  targetCategories: string[];
  keywords: string[];
  defaultBudget: number;
}

const SCENARIOS: readonly ScenarioOption[] = [
  {
    id: "oneroom",
    mode: "b2c",
    label: "🏡 원룸·자취 알뜰 세트",
    desc: "냉장고 + 세탁기 + 에어컨 실속 조합",
    targetCategories: ["냉장고", "세탁기/건조기", "에어컨/냉난방기"],
    keywords: ["소형", "일반", "통돌이", "벽걸이", "드럼"],
    defaultBudget: 800000,
  },
  {
    id: "family",
    mode: "b2c",
    label: "🛋️ 신혼·가정집 업그레이드",
    desc: "양문형/4도어 냉장고 + 드럼/건조기 + 스탠드 에어컨",
    targetCategories: ["냉장고", "세탁기/건조기", "에어컨/냉난방기"],
    keywords: ["양문형", "4도어", "비스포크", "드럼", "건조기", "스탠드", "2in1"],
    defaultBudget: 1500000,
  },
  {
    id: "cafe",
    mode: "b2b",
    label: "☕ 카페·디저트 오픈 패키지",
    desc: "제빙기 + 테이블냉장고 + 쇼케이스 필수 조합",
    targetCategories: ["업소용기기", "에어컨/냉난방기"],
    keywords: ["제빙기", "테이블", "쇼케이스", "냉난방"],
    defaultBudget: 1800000,
  },
  {
    id: "restaurant",
    mode: "b2b",
    label: "🍖 식당·주방 핵심 설비 세트",
    desc: "45박스 수직냉장고 + 식기세척기 + 중대형 냉난방기",
    targetCategories: ["업소용기기", "에어컨/냉난방기"],
    keywords: ["45박스", "25박스", "세척기", "작업대", "냉난방"],
    defaultBudget: 2200000,
  },
] as const;

const BUDGET_STEPS = [
  { label: "60만원 이하", value: 600000 },
  { label: "100만원 안팎", value: 1000000 },
  { label: "150만원 안팎", value: 1500000 },
  { label: "250만원 이하", value: 2500000 },
  { label: "예산 무관(추천순)", value: 9900000 },
] as const;

export function V2DualModeConcierge({
  products,
  onOpenInquiry,
}: {
  products: ProductItem[];
  onOpenInquiry: (type: InquiryTypeValue, prefillTitle?: string) => void;
}) {
  const [mode, setMode] = useState<ShowroomMode>("b2c");
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<string>("oneroom");
  const [budget, setBudget] = useState<number>(1000000);

  const activeScenario = useMemo(
    () =>
      SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0],
    [selectedScenarioId]
  );

  const handleModeSwitch = (nextMode: ShowroomMode) => {
    setMode(nextMode);
    const firstScenario = SCENARIOS.find((s) => s.mode === nextMode);
    if (firstScenario) {
      setSelectedScenarioId(firstScenario.id);
      setBudget(firstScenario.defaultBudget);
    }
  };

  // 실제 판매중(selling) 재고 중에서 선택한 시나리오와 예산에 맞는 최대 3개 세트 자동 조합
  const curatedBundle = useMemo(() => {
    const available = products.filter((p) => !isProductSold(p.status));
    if (available.length === 0) return { items: [], totalPrice: 0 };

    const scored = available.map((p) => {
      const cat = normalizeProductCategory(p.category);
      const text = `${p.title} ${p.description || ""}`.toLowerCase();
      let score = 0;

      if (activeScenario.targetCategories.includes(cat)) score += 5;
      if (mode === "b2b" && cat === "업소용기기") score += 4;
      if (mode === "b2c" && cat !== "업소용기기") score += 3;

      for (const kw of activeScenario.keywords) {
        if (text.includes(kw.toLowerCase())) score += 4;
      }
      return { product: p, cat, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const picked: ProductItem[] = [];
    const usedCats = new Set<string>();
    let runningTotal = 0;

    // 1차: 서로 다른 카테고리 조합 우선 선택 (예산 내)
    for (const candidate of scored) {
      if (picked.length >= 3) break;
      if (candidate.score <= 0) continue;
      const price = hasProductPrice(candidate.product.price)
        ? Number(candidate.product.price)
        : 0;

      if (
        !usedCats.has(candidate.cat) ||
        activeScenario.mode === "b2b"
      ) {
        if (runningTotal + price <= budget || budget >= 9000000 || price === 0) {
          picked.push(candidate.product);
          usedCats.add(candidate.cat);
          runningTotal += price;
        }
      }
    }

    // 만약 예산이 너무 낮아 덜 채워졌다면 점수 순으로 보충
    if (picked.length < 2) {
      for (const candidate of scored) {
        if (picked.length >= 3) break;
        if (!picked.some((x) => x.id === candidate.product.id)) {
          picked.push(candidate.product);
          if (hasProductPrice(candidate.product.price)) {
            runningTotal += Number(candidate.product.price);
          }
        }
      }
    }

    return { items: picked, totalPrice: runningTotal };
  }, [products, activeScenario, budget, mode]);

  const handleAddBundleToBasket = () => {
    let addedCount = 0;
    for (const item of curatedBundle.items) {
      const imgs = splitImages(item.image_url);
      const res = toggleQuoteBasketItem({
        id: item.id,
        title: item.title,
        category: normalizeProductCategory(item.category),
        price: item.price,
        status: item.status,
        conditionGrade: item.condition_grade,
        description: item.description,
        imageUrl: imgs[0] || null,
        quantity: 1,
      });
      if (res.added) addedCount += 1;
    }
    trackEvent("add_to_quote_basket", {
      category: activeScenario.label,
      location: "v2_concierge_bundle",
    });
    toast.success(
      addedCount > 0
        ? `추천 세트 매물 ${addedCount}건을 견적함에 담았습니다! 하단 바에서 비교·일괄 문의가 가능합니다.`
        : "이미 견적함에 담겨 있는 매물입니다."
    );
  };

  const isB2B = mode === "b2b";

  return (
    <section
      aria-label="맞춤 쇼룸 모드 및 스마트 세트 추천"
      className={`border-b transition-colors duration-300 ${
        isB2B
          ? "border-[#1E2F48] bg-[#0E1A2B] text-white"
          : "border-[#E5E2DC] bg-[#FAF9F7] text-[#0E1A2B]"
      }`}
    >
      <div className="hb-container py-8 sm:py-10 space-y-6">
        {/* 상단: B2C 가정용 vs B2B 프로 주방 듀얼 모드 스위처 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-current/10">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider ${
                isB2B ? "text-[#FF8A50]" : "text-[#D9531E]"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {isB2B
                ? "PRO COMMERCIAL KITCHEN MODE · 사업자 전용 쇼룸"
                : "HOME & LIVING RE-COMMERCE MODE · 가정·원룸 쇼룸"}
            </span>
            <h2 className="mt-1 text-[20px] sm:text-[24px] font-extrabold tracking-tight">
              {isB2B
                ? "식당·카페 오픈 설비부터 세금계산서·전원 규격까지 한눈에"
                : "분해 고압 살균을 마친 깨끗한 가정·원룸 가전 맞춤 큐레이션"}
            </h2>
          </div>

          {/* 모드 전환 캡슐 스위치 */}
          <div
            role="tablist"
            aria-label="쇼룸 모드 전환"
            className={`inline-grid grid-cols-2 rounded-xl p-1 border self-start shrink-0 ${
              isB2B
                ? "border-white/15 bg-[#16263D]"
                : "border-[#CFCAC0] bg-white shadow-2xs"
            }`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isB2B}
              onClick={() => handleModeSwitch("b2c")}
              className={`rounded-lg px-4 py-2 text-[13px] sm:text-[13.5px] font-extrabold transition-all ${
                !isB2B
                  ? "bg-[#0E1A2B] text-white shadow-2xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              🏡 가정 · 원룸 모드
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isB2B}
              onClick={() => handleModeSwitch("b2b")}
              className={`rounded-lg px-4 py-2 text-[13px] sm:text-[13.5px] font-extrabold transition-all ${
                isB2B
                  ? "bg-[#D9531E] text-white shadow-2xs"
                  : "text-[#3E4756] hover:text-[#0E1A2B]"
              }`}
            >
              🏢 식당 · 카페 프로 모드
            </button>
          </div>
        </div>

        {/* 중단: 상황 선택 + 예산 필터 컨트롤 바 */}
        <div className="grid gap-4 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 flex flex-wrap gap-2">
            {SCENARIOS.filter((s) => s.mode === mode).map((sc) => {
              const active = sc.id === selectedScenarioId;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                    setBudget(sc.defaultBudget);
                  }}
                  className={`flex-1 min-w-[200px] rounded-xl border p-3.5 text-left transition-all ${
                    active
                      ? isB2B
                        ? "border-[#FF8A50] bg-white/10 text-white"
                        : "border-[#D9531E] bg-white text-[#0E1A2B] shadow-card ring-1 ring-[#D9531E]"
                      : isB2B
                      ? "border-white/15 bg-white/5 text-white/75 hover:border-white/35"
                      : "border-[#E5E2DC] bg-white/70 text-[#3E4756] hover:border-[#0E1A2B]"
                  }`}
                >
                  <strong className="block text-[14.5px] font-extrabold">
                    {sc.label}
                  </strong>
                  <span
                    className={`mt-0.5 block text-[12px] ${
                      isB2B ? "text-white/70" : "text-[#646E7E]"
                    }`}
                  >
                    {sc.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-6 flex flex-wrap items-center justify-end gap-1.5">
            <span
              className={`text-[12px] font-bold mr-1 ${
                isB2B ? "text-white/75" : "text-[#646E7E]"
              }`}
            >
              희망 세트 예산:
            </span>
            {BUDGET_STEPS.map((b) => {
              const active = budget === b.value;
              return (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setBudget(b.value)}
                  className={`rounded-lg px-2.5 py-1.5 text-[12px] font-bold border transition-colors ${
                    active
                      ? "border-[#D9531E] bg-[#D9531E] text-white"
                      : isB2B
                      ? "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                      : "border-[#E5E2DC] bg-white text-[#3E4756] hover:border-[#0E1A2B]"
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 하단: 실시간 DB 재고 기반 추천 번들 카드 3선 + 일괄 담기 액션 */}
        {curatedBundle.items.length > 0 && (
          <div
            className={`rounded-xl border p-4 sm:p-5 ${
              isB2B
                ? "border-white/15 bg-[#132238]"
                : "border-[#E5E2DC] bg-white shadow-2xs"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-current/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#D9531E] px-2 py-0.5 text-[11px] font-bold text-white">
                  실시간 재고 매칭
                </span>
                <h3 className="text-[15px] sm:text-[16px] font-extrabold">
                  {activeScenario.label} 추천 실매물 조합 ({curatedBundle.items.length}종)
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {curatedBundle.totalPrice > 0 && (
                  <span className="text-[13px] font-bold tabular-nums mr-1">
                    표시가 합계:{" "}
                    <strong className="text-[16px] text-[#D9531E]">
                      {curatedBundle.totalPrice.toLocaleString()}원
                    </strong>
                    <span className="text-[11px] opacity-75 ml-1">
                      (세트 협의 가능)
                    </span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleAddBundleToBasket}
                  className="hb-btn-accent h-9 px-3.5 text-[12.5px]"
                >
                  <Icon d={ICON.plus} className="w-3.5 h-3.5" />
                  <span>이 조합 견적함에 한 번에 담기</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onOpenInquiry(
                      isB2B ? "대량·업소용 상담" : "구매 문의",
                      `[${activeScenario.label}] ${curatedBundle.items
                        .map((i) => i.title)
                        .join(" + ")} 세트 견적 문의`
                    )
                  }
                  className={`h-9 rounded-lg border px-3.5 text-[12.5px] font-bold transition-colors ${
                    isB2B
                      ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                      : "border-[#CFCAC0] bg-[#FAF9F7] text-[#0E1A2B] hover:border-[#0E1A2B]"
                  }`}
                >
                  바로 세트 문의 →
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {curatedBundle.items.map((item, idx) => {
                const imgs = splitImages(item.image_url);
                const cat = normalizeProductCategory(item.category);
                return (
                  <Link
                    key={item.id}
                    href={`/${item.id}`}
                    className={`group flex items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                      isB2B
                        ? "border-white/10 bg-white/5 hover:border-[#FF8A50]"
                        : "border-[#E5E2DC] bg-[#FAF9F7] hover:border-[#0E1A2B]"
                    }`}
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-black/10 bg-[#EFECE6]">
                      <SafeImg
                        src={imgs[0]}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute left-1 top-1 rounded bg-[#0E1A2B]/85 px-1 text-[9.5px] font-bold text-white">
                        구성 {idx + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] font-semibold opacity-70 truncate">
                        {cat}
                      </span>
                      <p className="truncate text-[13.5px] font-bold group-hover:text-[#D9531E]">
                        {item.title}
                      </p>
                      <strong className="mt-0.5 block text-[13.5px] font-extrabold text-[#D9531E] tabular-nums">
                        {formatProductPrice(item.price, cat)}
                      </strong>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
