"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  STORE,
  STORE_MERCHANT_POLICY,
  getCategoryWarrantyInfo,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/icons";
import { SafeImg } from "../../lib/ui";

type CleaningTabKey = "aircon" | "washer" | "commercial";
type GradeKey = "S" | "A" | "B";

interface CleaningProcessItem {
  key: CleaningTabKey;
  tabLabel: string;
  shortSpec: string;
  title: string;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  beforeCaption: string;
  afterCaption: string;
  beforeIssues: readonly [string, string, string];
  afterProofs: readonly [string, string, string];
  galleryHref: string;
}

const CLEANING_PROCESS_ITEMS: readonly CleaningProcessItem[] = [
  {
    key: "aircon",
    tabLabel: "에어컨 열교환기·송풍팬",
    shortSpec: "완전 분해 120bar",
    title: "에어컨 열교환기·송풍팬 완전 분해 고압세척",
    beforeImageUrl: null,
    afterImageUrl: null,
    beforeCaption: "입고 직후 · 냉각핀 먼지 고착 및 송풍팬 곰팡이",
    afterCaption: "출고 기준 · 120bar 분해 고압세척 및 살균 완료",
    beforeIssues: [
      "알루미늄 냉각핀 틈새 미세먼지와 습기 결합 오염",
      "송풍팬 날개·드레인판 곰팡이막 및 냄새 유발",
      "열교환 효율 저하로 냉방 약화 및 전력 소모 증가",
    ],
    afterProofs: [
      "전면 패널·필터·송풍팬 완전 분해 후 전용 약품 세척",
      "120bar 고압 헹굼 및 드레인 배수 라인 스팀 살균",
      "실외기 연결 정격 냉매 압력·토출 온도 실측 합격",
    ],
    galleryHref:
      "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
  },
  {
    key: "washer",
    tabLabel: "세탁기 내조·세탁조",
    shortSpec: "내·외조 분해 살균",
    title: "세탁기 내조(세탁조) 스케일 분해 살균",
    beforeImageUrl: null,
    afterImageUrl: null,
    beforeCaption: "입고 직후 · 외조 벽면 세제 찌꺼기 및 석회 스케일",
    afterCaption: "출고 기준 · 세탁조 완전 분리 고압 살균 완료",
    beforeIssues: [
      "외조 내부와 세탁조 뒷면에 누적된 세제 찌꺼기·물때",
      "스파이더 축 부위 석회질 고착 및 배수 펌프 이물질",
      "세탁물 검은 가루 묻어남 및 꿉꿉한 냄새 원인",
    ],
    afterProofs: [
      "스테인리스 내조·외조 완전 탈거 후 고압 스케일 제거",
      "도어 고무패킹·세제 투입구·배수 필터 스팀 살균",
      "급수·배수 누수 여부 및 고속 탈수 진동 밸런스 검수",
    ],
    galleryHref:
      "/gallery?category=%EC%84%B8%ED%83%81%EA%B8%B0%2F%EA%B1%B4%EC%A1%B0%EA%B8%B0",
  },
  {
    key: "commercial",
    tabLabel: "업소용 응축기·콤프레셔",
    shortSpec: "기계실 오버홀",
    title: "업소용 냉장고 응축기·콤프레셔 오버홀",
    beforeImageUrl: null,
    afterImageUrl: null,
    beforeCaption: "입고 직후 · 주방 유증기·먼지로 막힌 응축기 핀",
    afterCaption: "출고 기준 · 응축기 고압 탈지 및 24시간 냉각 검증",
    beforeIssues: [
      "주방 유증기와 먼지가 엉겨 붙은 응축기(콘덴서) 막힘",
      "방열 불량으로 인한 콤프레셔 과부하 및 냉각 불량 위험",
      "내부 선반·배수로 기름때 및 도어 패킹 밀폐력 저하",
    ],
    afterProofs: [
      "기계실 응축기 전용 탈지 고압세척 및 방열팬 점검",
      "내부 스텐 선반·배수 트랩 고온 스팀 소독 및 패킹 점검",
      "영하·냉장 목표 온도 도달 24시간 연속 시운전 완료",
    ],
    galleryHref:
      "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&view=table",
  },
] as const;

interface GradeSpecItem {
  key: GradeKey;
  code: string;
  label: string;
  shortTag: string;
  sightlineCriterion: string;
  recommendedUse: string;
  savingsRange: string;
  exteriorScore: number;
  exteriorLabel: string;
}

const GRADE_SPECS: readonly GradeSpecItem[] = [
  {
    key: "S",
    code: "S급",
    label: "전시급",
    shortTag: "신품급 외관",
    sightlineCriterion:
      "성인 팔 길이(50cm) 거리에서 사용 흔적이 거의 보이지 않는 전시급 외관 상태",
    recommendedUse:
      "신혼·입주 가정용 거실 가전, 인테리어 마감이 중요한 오픈 카페·쇼룸",
    savingsRange: "신품 대비 약 30~45% 절감",
    exteriorScore: 96,
    exteriorLabel: "최상 (미세 흔적 극소)",
  },
  {
    key: "A",
    code: "A급",
    label: "실사용 우수",
    shortTag: "가장 높은 선택률",
    sightlineCriterion:
      "50cm 거리에서 눈에 띄는 흠집 없이 깔끔하며 가까이 살필 때 미세 생활감 존재",
    recommendedUse:
      "가정용 냉장고·세탁기·에어컨 교체, 원룸 입주, 일반 식당·사무실 표준 도입",
    savingsRange: "신품 대비 약 45~60% 절감",
    exteriorScore: 86,
    exteriorLabel: "우수 (미세 생활감)",
  },
  {
    key: "B",
    code: "B급",
    label: "실속·업소 가성비",
    shortTag: "초기 예산 절감",
    sightlineCriterion:
      "측면·하단부 경미한 찍힘 또는 생활 스크래치가 50cm 거리에서 일부 식별됨",
    recommendedUse:
      "주방 내부 배치 업소용 냉장고·세척기, 원룸 임대 세팅, 창업 초기 예산 최소화",
    savingsRange: "신품 대비 약 60~75% 절감",
    exteriorScore: 72,
    exteriorLabel: "실속 (외관 사용감)",
  },
] as const;

function HardwareCutawayVisual({
  kind,
  stage,
}: {
  kind: CleaningTabKey;
  stage: "before" | "after";
}) {
  const isBefore = stage === "before";

  if (kind === "aircon") {
    return (
      <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
        <rect width="640" height="360" fill={isBefore ? "#231F1C" : "#111827"} />
        <rect x="52" y="42" width="536" height="276" rx="14" fill={isBefore ? "#2E2925" : "#1E293B"} stroke={isBefore ? "#78716C" : "#38BDF8"} strokeOpacity="0.55" strokeWidth="2" />
        <rect x="80" y="68" width="480" height="112" rx="8" fill={isBefore ? "#57534E" : "#E2E8F0"} />
        {Array.from({ length: 24 }).map((_, i) => (
          <line key={i} x1={96 + i * 19} y1="70" x2={96 + i * 19} y2="178" stroke={isBefore ? "#292524" : "#64748B"} strokeWidth={isBefore ? "3.5" : "1.2"} />
        ))}
        {isBefore ? (
          <path d="M90 92 C170 76, 260 118, 350 94 C430 78, 490 112, 550 96 L550 166 C470 156, 380 176, 290 162 C200 150, 140 172, 90 162 Z" fill="#3B2F26" fillOpacity="0.82" />
        ) : (
          <g>
            <path d="M120 76 L210 76 L178 172 L88 172 Z" fill="#FFFFFF" fillOpacity="0.28" />
            <rect x="88" y="102" width="464" height="3" rx="1.5" fill="#2DD4BF" />
            <rect x="88" y="148" width="464" height="3" rx="1.5" fill="#38BDF8" />
          </g>
        )}
        <rect x="80" y="204" width="480" height="68" rx="10" fill={isBefore ? "#1C1917" : "#0F172A"} stroke={isBefore ? "#78716C" : "#2DD4BF"} strokeWidth="1.5" />
        {Array.from({ length: 16 }).map((_, i) => (
          <rect key={i} x={98 + i * 28} y="216" width="14" height="44" rx="3" fill={isBefore ? "#574C44" : "#CBD5E1"} />
        ))}
        <rect x="80" y="286" width="480" height="14" rx="4" fill={isBefore ? "#78350F" : "#0F766E"} />
      </svg>
    );
  }

  if (kind === "washer") {
    return (
      <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
        <rect width="640" height="360" fill={isBefore ? "#231F1C" : "#111827"} />
        <circle cx="320" cy="180" r="138" fill={isBefore ? "#3B332C" : "#1E293B"} stroke={isBefore ? "#B45309" : "#2DD4BF"} strokeWidth="4" />
        <circle cx="320" cy="180" r="122" fill="none" stroke={isBefore ? "#713F12" : "#38BDF8"} strokeWidth={isBefore ? "14" : "3"} strokeDasharray={isBefore ? "18 8 10 6" : "none"} />
        <circle cx="320" cy="180" r="100" fill={isBefore ? "#57534E" : "#E2E8F0"} stroke={isBefore ? "#44403C" : "#94A3B8"} strokeWidth="3" />
        <g stroke={isBefore ? "#451A03" : "#0F766E"} strokeWidth="12" strokeLinecap="round">
          <line x1="320" y1="180" x2="320" y2="112" />
          <line x1="320" y1="180" x2="262" y2="216" />
          <line x1="320" y1="180" x2="378" y2="216" />
        </g>
        <circle cx="320" cy="180" r="24" fill={isBefore ? "#292524" : "#141A23"} stroke={isBefore ? "#D97706" : "#2DD4BF"} strokeWidth="3" />
        {isBefore ? (
          <g fill="#362417" fillOpacity="0.85">
            <circle cx="236" cy="122" r="15" />
            <circle cx="402" cy="128" r="17" />
            <circle cx="388" cy="244" r="15" />
            <circle cx="246" cy="240" r="13" />
          </g>
        ) : (
          <path d="M256 120 A82 82 0 0 1 388 124" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.75" />
        )}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
      <rect width="640" height="360" fill={isBefore ? "#231F1C" : "#111827"} />
      <rect x="48" y="44" width="544" height="272" rx="14" fill={isBefore ? "#2A2521" : "#1E293B"} stroke={isBefore ? "#78716C" : "#38BDF8"} strokeWidth="2" />
      <rect x="76" y="74" width="248" height="212" rx="8" fill={isBefore ? "#44403C" : "#CBD5E1"} />
      {Array.from({ length: 14 }).map((_, i) => (
        <line key={i} x1={92 + i * 16} y1="78" x2={92 + i * 16} y2="282" stroke={isBefore ? "#292524" : "#475569"} strokeWidth={isBefore ? "4" : "1.5"} />
      ))}
      {isBefore ? (
        <path d="M84 96 C148 84, 214 114, 316 98 L316 268 C242 278, 152 254, 84 270 Z" fill="#3B2D22" fillOpacity="0.82" />
      ) : (
        <rect x="88" y="82" width="68" height="196" fill="#FFFFFF" fillOpacity="0.25" />
      )}
      <rect x="354" y="74" width="210" height="74" rx="8" fill="#0B1120" stroke={isBefore ? "#D97706" : "#2DD4BF"} strokeWidth="2" />
      <text x="459" y="118" textAnchor="middle" fill={isBefore ? "#FCD34D" : "#2DD4BF"} fontSize="18" fontWeight="700" fontFamily="monospace">
        {isBefore ? "OVERHEAT" : "-20.0 C OK"}
      </text>
      <rect x="354" y="170" width="210" height="116" rx="12" fill={isBefore ? "#1C1917" : "#0F172A"} stroke={isBefore ? "#DC2626" : "#38BDF8"} strokeWidth="2" />
      <circle cx="422" cy="228" r="34" fill={isBefore ? "#44403C" : "#1E293B"} stroke={isBefore ? "#EF4444" : "#2DD4BF"} strokeWidth="3" />
      <circle cx="422" cy="228" r="12" fill={isBefore ? "#991B1B" : "#0F766E"} />
      <path d="M472 208 H540 M472 228 H540 M472 248 H520" stroke={isBefore ? "#78716C" : "#38BDF8"} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function RefurbishTransparencySection() {
  const [activeTab, setActiveTab] = useState<CleaningTabKey>("aircon");
  const [sliderPos, setSliderPos] = useState<number>(48);
  const [activeGrade, setActiveGrade] = useState<GradeKey>("A");

  const activeCleaning =
    CLEANING_PROCESS_ITEMS.find((item) => item.key === activeTab) ||
    CLEANING_PROCESS_ITEMS[0];
  const selectedGrade =
    GRADE_SPECS.find((g) => g.key === activeGrade) || GRADE_SPECS[1];

  const airconWarranty = getCategoryWarrantyInfo("에어컨/냉난방기");
  const majorWarranty = getCategoryWarrantyInfo("냉장고");

  return (
    <section
      id="refurbish-transparency-section"
      aria-labelledby="refurbish-transparency-title"
      className="border-b border-[#E2E6EC] bg-[#F7F8FA] py-12 sm:py-16 lg:py-20"
    >
      <div className="hb-container space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#E2E6EC]">
          <div>
            <p className="mb-1.5 text-hb-xs sm:text-hb-sm font-bold text-[#C84312]">
              분해 고압세척 공정 · 외관 등급 투명 기준
            </p>
            <h2
              id="refurbish-transparency-title"
              className="text-hb-xl sm:text-hb-2xl font-bold leading-[1.26] tracking-[-0.03em] text-[#141A23] break-keep [text-wrap:balance]"
            >
              보이지 않는 내부 세척부터 외관 등급까지 투명하게 공개합니다
            </h2>
            <p className="mt-2 max-w-2xl text-hb-sm sm:text-hb-base leading-[1.65] text-[#475569] break-keep">
              겉면만 닦아 판매하는 개인 직거래와 다릅니다. {STORE.name}은 전 품목 분해 고압세척과 연속 시운전을 통과한 실매물만 출고합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0 text-hb-xs font-bold tabular-nums">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#CCFBF1] bg-[#F0FDFA] px-3 py-1.5 text-[#0F766E]">
              <Icon d={ICON.shieldCheck} className="w-3.5 h-3.5" />
              <span>에어컨 {airconWarranty.compactLabel}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E6EC] bg-white px-3 py-1.5 text-[#141A23]">
              <Icon d={ICON.check} className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>주요가전 {majorWarranty.compactLabel}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-stretch">
          {/* 좌 7열: 분해 고압세척 Before / After 스크러버 */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-[#E2E6EC] bg-white overflow-hidden shadow-2xs">
            <div className="p-4 sm:p-6 border-b border-[#E2E6EC] space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#141A23] px-2.5 py-1 text-hb-xs font-bold text-white">
                    분해세척 비교
                  </span>
                  <span className="text-hb-xs font-bold text-[#475569]">
                    슬라이더를 좌우로 밀어 세척 전·후를 비교하세요
                  </span>
                </div>
                <span className="font-mono text-hb-xs font-bold text-[#0F766E] tabular-nums">
                  {activeCleaning.shortSpec}
                </span>
              </div>

              <div
                role="tablist"
                aria-label="분해 고압세척 비교 품목 선택"
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                {CLEANING_PROCESS_ITEMS.map((item) => {
                  const isActive = item.key === activeTab;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      id={`cleaning-tab-${item.key}`}
                      aria-selected={isActive}
                      aria-controls={`cleaning-panel-${item.key}`}
                      onClick={() => {
                        setActiveTab(item.key);
                        setSliderPos(48);
                      }}
                      className={`min-h-[44px] rounded-xl px-3 py-2 text-left text-hb-xs font-bold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] ${
                        isActive
                          ? "bg-[#141A23] text-white shadow-xs"
                          : "border border-[#E2E6EC] bg-[#F7F8FA] text-[#141A23] hover:border-[#94A3B8]"
                      }`}
                    >
                      <span className="block truncate">{item.tabLabel}</span>
                      <span
                        className={`mt-0.5 block text-hb-xs font-semibold truncate ${
                          isActive ? "text-[#FF8A50]" : "text-[#475569]"
                        }`}
                      >
                        {item.shortSpec}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              id={`cleaning-panel-${activeCleaning.key}`}
              role="tabpanel"
              aria-labelledby={`cleaning-tab-${activeCleaning.key}`}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="p-4 sm:p-6 bg-[#F7F8FA]">
                <div
                  className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#CBD2DC] bg-[#141A23] select-none"
                  style={{ "--pos": `${sliderPos}%` } as React.CSSProperties}
                >
                  <div className="absolute inset-0">
                    {activeCleaning.afterImageUrl ? (
                      <SafeImg
                        src={activeCleaning.afterImageUrl}
                        alt={`${activeCleaning.title} 세척 후`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <HardwareCutawayVisual kind={activeCleaning.key} stage="after" />
                    )}
                    <span className="pointer-events-none absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-[#0F766E] px-2.5 py-1 text-hb-xs font-bold text-white shadow-xs">
                      <Icon d={ICON.check} className="w-3.5 h-3.5" />
                      <span>세척 후 · 출고 기준</span>
                    </span>
                  </div>

                  <div
                    className="absolute inset-0 z-10"
                    style={{ clipPath: "inset(0 calc(100% - var(--pos)) 0 0)" }}
                  >
                    {activeCleaning.beforeImageUrl ? (
                      <SafeImg
                        src={activeCleaning.beforeImageUrl}
                        alt={`${activeCleaning.title} 세척 전`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <HardwareCutawayVisual kind={activeCleaning.key} stage="before" />
                    )}
                    <span className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-[#141A23]/90 border border-white/20 px-2.5 py-1 text-hb-xs font-bold text-white shadow-xs">
                      <Icon d={ICON.wrench} className="w-3.5 h-3.5 text-[#FF8A50]" />
                      <span>세척 전 · 입고 직후</span>
                    </span>
                  </div>

                  <div
                    className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-white shadow-md"
                    style={{ left: "var(--pos)" }}
                    aria-hidden="true"
                  >
                    <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#141A23] bg-white text-[#141A23] shadow-floating">
                      <Icon d={ICON.left} className="w-3.5 h-3.5 -mr-0.5" />
                      <Icon d={ICON.right} className="w-3.5 h-3.5 -ml-0.5" />
                    </div>
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 bg-[#141A23]/85 px-3.5 py-2 text-hb-xs text-white backdrop-blur-sm">
                    <span className="truncate font-semibold text-white/90">
                      {sliderPos >= 50
                        ? activeCleaning.beforeCaption
                        : activeCleaning.afterCaption}
                    </span>
                    <span className="shrink-0 font-mono font-bold text-[#FF8A50] tabular-nums">
                      전 {sliderPos}% · 후 {100 - sliderPos}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    aria-label={`${activeCleaning.title} 세척 전후 비교 슬라이더`}
                    aria-valuetext={`세척 전 ${sliderPos}퍼센트, 세척 후 ${100 - sliderPos}퍼센트`}
                    className="hb-compare-range absolute inset-0 z-30 h-full w-full cursor-ew-resize"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSliderPos(92)}
                      className={`min-h-[40px] rounded-xl px-3 text-hb-xs font-bold border transition-colors cursor-pointer ${
                        sliderPos >= 80
                          ? "border-[#141A23] bg-[#141A23] text-white"
                          : "border-[#CBD2DC] bg-white text-[#141A23] hover:border-[#141A23]"
                      }`}
                    >
                      세척 전
                    </button>
                    <button
                      type="button"
                      onClick={() => setSliderPos(50)}
                      className={`min-h-[40px] rounded-xl px-3 text-hb-xs font-bold border transition-colors cursor-pointer ${
                        sliderPos > 20 && sliderPos < 80
                          ? "border-[#141A23] bg-[#141A23] text-white"
                          : "border-[#CBD2DC] bg-white text-[#141A23] hover:border-[#141A23]"
                      }`}
                    >
                      50:50 비교
                    </button>
                    <button
                      type="button"
                      onClick={() => setSliderPos(8)}
                      className={`min-h-[40px] rounded-xl px-3 text-hb-xs font-bold border transition-colors cursor-pointer ${
                        sliderPos <= 20
                          ? "border-[#0F766E] bg-[#0F766E] text-white"
                          : "border-[#CBD2DC] bg-white text-[#141A23] hover:border-[#0F766E]"
                      }`}
                    >
                      세척 완료
                    </button>
                  </div>
                  <Link
                    href={activeCleaning.galleryHref}
                    className="inline-flex min-h-[40px] items-center gap-1 text-hb-xs font-bold text-[#C84312] hover:underline"
                  >
                    <span>해당 공정 통과 매물 보기</span>
                    <Icon d={ICON.arrow} className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E6EC] border-t border-[#E2E6EC] bg-white text-hb-xs sm:text-hb-sm">
                <div className="p-4 sm:p-5 space-y-2">
                  <p className="text-hb-xs font-bold text-[#475569] flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#475569]" aria-hidden="true" />
                    <span>입고 직후 흔한 오염 (미세척 위험)</span>
                  </p>
                  <ul className="space-y-1.5 text-[#334155]">
                    {activeCleaning.beforeIssues.map((issue) => (
                      <li key={issue} className="flex items-start gap-2 leading-snug break-keep">
                        <Icon d={ICON.close} className="w-3.5 h-3.5 text-[#475569] shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 sm:p-5 space-y-2 bg-[#F0FDFA]/40">
                  <p className="text-hb-xs font-bold text-[#0F766E] flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#0F766E]" aria-hidden="true" />
                    <span>{STORE.name} 출고 전 완료 공정</span>
                  </p>
                  <ul className="space-y-1.5 text-[#141A23] font-medium">
                    {activeCleaning.afterProofs.map((proof) => (
                      <li key={proof} className="flex items-start gap-2 leading-snug break-keep">
                        <Icon d={ICON.check} className="w-3.5 h-3.5 text-[#0F766E] shrink-0 mt-0.5" />
                        <span>{proof}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 우 5열: Back Market식 외관 등급 투명성 & 전 등급 동일 보증 스위처 */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-[#E2E6EC] bg-white overflow-hidden shadow-2xs">
            <div>
              <div className="bg-[#141A23] p-5 sm:p-6 text-white border-b border-[#1E2736]">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0F766E] px-2.5 py-1 text-hb-xs font-bold text-white">
                    <Icon d={ICON.shieldCheck} className="w-3.5 h-3.5" />
                    <span>전 등급 100% 동일 보증</span>
                  </span>
                  <span className="font-mono text-hb-xs font-bold text-[#FF8A50] tabular-nums">
                    50cm 시선 기준
                  </span>
                </div>
                <h3 className="mt-3 text-hb-base sm:text-hb-lg font-bold leading-snug break-keep">
                  S급·A급·B급 차이는 오직 50cm 거리에서 보이는 외관 흔적뿐입니다.
                </h3>
                <p className="mt-1.5 text-hb-xs sm:text-hb-sm leading-relaxed text-white/80 break-keep">
                  분해 고압세척·냉매 압력·24시간 시운전·무상 A/S 보증은 전 등급 100% 동일합니다.
                </p>
              </div>

              <div className="p-4 sm:p-5 border-b border-[#E2E6EC] bg-[#F7F8FA]">
                <div
                  role="tablist"
                  aria-label="외관 상태 등급 선택"
                  className="grid grid-cols-3 gap-2"
                >
                  {GRADE_SPECS.map((grade) => {
                    const isSelected = grade.key === activeGrade;
                    return (
                      <button
                        key={grade.key}
                        type="button"
                        role="tab"
                        id={`grade-tab-${grade.key}`}
                        aria-selected={isSelected}
                        aria-controls={`grade-panel-${grade.key}`}
                        onClick={() => setActiveGrade(grade.key)}
                        className={`min-h-[48px] rounded-xl px-2.5 py-2 text-center transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141A23] ${
                          isSelected
                            ? "bg-[#141A23] text-white shadow-xs"
                            : "border border-[#CBD2DC] bg-white text-[#141A23] hover:border-[#141A23]"
                        }`}
                      >
                        <strong className="block text-hb-sm font-bold tabular-nums">
                          {grade.code}
                        </strong>
                        <span
                          className={`block text-hb-xs font-semibold truncate ${
                            isSelected ? "text-[#FF8A50]" : "text-[#475569]"
                          }`}
                        >
                          {grade.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                id={`grade-panel-${selectedGrade.key}`}
                role="tabpanel"
                aria-labelledby={`grade-tab-${selectedGrade.key}`}
                className="p-5 sm:p-6 space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-md bg-[#FFF4EE] border border-[#FADCD0] px-2.5 py-0.5 text-hb-xs font-bold text-[#C84312]">
                      {selectedGrade.shortTag}
                    </span>
                    <h4 className="mt-1.5 text-hb-lg font-bold text-[#141A23]">
                      {selectedGrade.code} ({selectedGrade.label})
                    </h4>
                  </div>
                  <span className="font-mono text-hb-sm font-bold text-[#C84312] tabular-nums">
                    {selectedGrade.savingsRange}
                  </span>
                </div>

                <div className="space-y-3 rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] p-4 text-hb-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#475569]">50cm 외관 상태</span>
                      <span className="text-[#141A23] tabular-nums">
                        {selectedGrade.exteriorLabel}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#E2E6EC]">
                      <div
                        className="h-full rounded-full bg-[#141A23] transition-[width] duration-300"
                        style={{ width: `${selectedGrade.exteriorScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#0F766E]">
                        분해세척 · 냉각성능 · 무상 A/S
                      </span>
                      <span className="font-mono text-[#0F766E] tabular-nums">
                        전 등급 100% 동일
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#CCFBF1]">
                      <div className="h-full w-full rounded-full bg-[#0F766E]" />
                    </div>
                  </div>
                </div>

                <dl className="divide-y divide-[#E2E6EC] border-y border-[#E2E6EC] text-hb-xs sm:text-hb-sm">
                  <div className="py-3 flex flex-col gap-1">
                    <dt className="font-bold text-[#475569] flex items-center gap-1.5">
                      <Icon d={ICON.eye} className="w-3.5 h-3.5 text-[#141A23]" />
                      <span>외관 판정 기준 (팔 길이 50cm)</span>
                    </dt>
                    <dd className="font-semibold text-[#141A23] leading-relaxed break-keep">
                      {selectedGrade.sightlineCriterion}
                    </dd>
                  </div>
                  <div className="py-3 flex flex-col gap-1">
                    <dt className="font-bold text-[#475569]">추천 용도</dt>
                    <dd className="text-[#334155] leading-relaxed break-keep">
                      {selectedGrade.recommendedUse}
                    </dd>
                  </div>
                  <div className="py-3 flex items-center justify-between gap-2">
                    <dt className="font-bold text-[#475569]">보증·교환 기준</dt>
                    <dd className="font-bold text-[#0F766E] text-right tabular-nums">
                      에어컨 {airconWarranty.shortLabel} · {STORE_MERCHANT_POLICY.merchantReturnDays}일 교환
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="p-4 sm:px-6 border-t border-[#E2E6EC] bg-[#F7F8FA]">
              <Link
                href="/gallery"
                className="hb-btn-primary h-11 w-full px-4 text-hb-sm justify-between"
              >
                <span>등급별 실물 사진·가격 전체 보기</span>
                <Icon d={ICON.arrow} className="w-4 h-4 text-[#FF8A50]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
