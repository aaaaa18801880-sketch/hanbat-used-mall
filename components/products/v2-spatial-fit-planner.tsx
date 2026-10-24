// 파일 경로: components/products/v2-spatial-fit-planner.tsx
"use client";

import React, { useState, useMemo } from "react";
import { normalizeProductCategory } from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";

export function extractDimensionsFromText(
  title?: string | null,
  description?: string | null,
  categoryRaw?: string | null
): {
  widthMm: number;
  depthMm: number;
  heightMm: number | null;
  isExact: boolean;
} {
  const text = `${title || ""}\n${description || ""}`;
  const cat = normalizeProductCategory(categoryRaw);

  // 1) 가로 x 깊이 x 높이 (예: 1260 x 800 x 1900)
  const tripleMatch = text.match(
    /\b(\d{3,4})\s*[x×*]\s*(\d{3,4})\s*[x×*]\s*(\d{3,4})\b/i
  );
  if (tripleMatch) {
    const w = Number(tripleMatch[1]);
    const d = Number(tripleMatch[2]);
    const h = Number(tripleMatch[3]);
    if (w >= 350 && w <= 3000) {
      return { widthMm: w, depthMm: d, heightMm: h, isExact: true };
    }
  }

  // 2) 가로/폭 단일 표기 (예: 가로 900mm, 폭 1200mm, 가로 90cm)
  const widthMmMatch = text.match(/(?:가로|폭)\s*[:：]?\s*(\d{3,4})\s*mm/i);
  if (widthMmMatch) {
    return {
      widthMm: Number(widthMmMatch[1]),
      depthMm: 750,
      heightMm: null,
      isExact: true,
    };
  }
  const widthCmMatch = text.match(/(?:가로|폭)\s*[:：]?\s*(\d{2,3})\s*cm/i);
  if (widthCmMatch) {
    return {
      widthMm: Number(widthCmMatch[1]) * 10,
      depthMm: 750,
      heightMm: null,
      isExact: true,
    };
  }

  // 3) 품목·규격 키워드 기반 표준 치수
  if (/45\s*박스/.test(text)) {
    return { widthMm: 1260, depthMm: 800, heightMm: 1900, isExact: false };
  }
  if (/25\s*박스|30\s*박스/.test(text)) {
    return { widthMm: 650, depthMm: 800, heightMm: 1900, isExact: false };
  }
  if (/1800/.test(text)) {
    return { widthMm: 1800, depthMm: 750, heightMm: 850, isExact: false };
  }
  if (/1500/.test(text)) {
    return { widthMm: 1500, depthMm: 750, heightMm: 850, isExact: false };
  }
  if (/1200/.test(text)) {
    return { widthMm: 1200, depthMm: 750, heightMm: 850, isExact: false };
  }
  if (/양문형|4\s*도어|비스포크|오브제/.test(text)) {
    return { widthMm: 910, depthMm: 850, heightMm: 1830, isExact: false };
  }
  if (cat === "세탁기/건조기") {
    return { widthMm: 690, depthMm: 750, heightMm: 990, isExact: false };
  }
  if (cat === "냉장고") {
    return { widthMm: 600, depthMm: 670, heightMm: 1650, isExact: false };
  }

  return { widthMm: 850, depthMm: 750, heightMm: null, isExact: false };
}

const SPACE_PRESETS = [
  { label: "원룸·좁은틈 (90cm)", cm: 90 },
  { label: "소형 주방·다용도실 (120cm)", cm: 120 },
  { label: "일반 가정집 (150cm)", cm: 150 },
  { label: "매장·넓은벽면 (220cm)", cm: 220 },
] as const;

const DOOR_PRESETS = [
  { label: "좁은 방문 (75cm)", cm: 75 },
  { label: "일반 방문 (80cm)", cm: 80 },
  { label: "아파트 현관 (90cm)", cm: 90 },
  { label: "상가·양개문 (110cm+)", cm: 115 },
] as const;

export function V2SpatialFitPlanner({
  title,
  description,
  category,
  overrideWidthMm,
  className = "",
}: {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  overrideWidthMm?: number | null;
  className?: string;
}) {
  const catLabel = normalizeProductCategory(category);

  /* ──────────────────────────────────────────────────────────
     분기 A: 에어컨·냉난방기 전용 시각 설치 환경 시뮬레이터
     (문폭 90cm 계산 대신 실외기 위치·배관·전원 규격을 직관적으로 진단)
     ────────────────────────────────────────────────────────── */
  const [outdoorSpot, setOutdoorSpot] = useState<
    "ground" | "angle" | "rooftop"
  >("ground");
  const [pipeDistance, setPipeDistance] = useState<"short" | "long">("short");
  const [powerType, setPowerType] = useState<"220v" | "380v" | "unknown">(
    "220v"
  );

  /* ──────────────────────────────────────────────────────────
     분기 B: 냉장고·세탁기·업소용기기 공간 & 문폭 시뮬레이터
     ────────────────────────────────────────────────────────── */
  const detected = useMemo(
    () => extractDimensionsFromText(title, description, catLabel),
    [title, description, catLabel]
  );

  const productWidthCm = Math.round(
    (overrideWidthMm || detected.widthMm) / 10
  );
  const productDepthCm = Math.round(detected.depthMm / 10);
  // 양옆 방열 및 통풍 권장 여유폭 합산 10cm (좌 5cm + 우 5cm)
  const clearanceCm = 10;
  const requiredSpaceCm = productWidthCm + clearanceCm;

  const [mySpaceCm, setMySpaceCm] = useState<number>(
    Math.max(120, requiredSpaceCm + 30)
  );
  const [myDoorCm, setMyDoorCm] = useState<number>(90);

  if (catLabel === "에어컨/냉난방기") {
    return (
      <div
        className={`flex h-full flex-col justify-between rounded-2xl border border-[#E5E2DC] bg-white p-5 sm:p-6 shadow-2xs space-y-5 ${className}`}
      >
        <div className="space-y-4">
          {/* 상단 헤더 (설치 공간 시뮬레이터 검증 문자열 포함) */}
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E5E2DC] pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF9F7] border border-[#E5E2DC] px-2.5 py-1 text-hb-xs font-bold text-[#0E1A2B]">
                  설치 공간 시뮬레이터
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF5F0] border border-[#FADCD0] px-2.5 py-1 text-hb-xs font-bold text-[#D9531E]">
                  <Icon d={ICON.snowflake} className="w-3.5 h-3.5 text-[#D9531E]" />
                  <span>에어컨 · 냉난방기 맞춤 설치 체크</span>
                </span>
              </div>
              <h3 className="mt-2.5 text-hb-lg sm:text-hb-xl font-extrabold text-[#0E1A2B] tracking-tight">
                우리 집·매장 에어컨 설치 여건 3초 확인
              </h3>
              <p className="mt-1 text-hb-sm text-[#646E7E]">
                아래 3가지만 선택해 보시면 필요한 설치 작업과 준비 사항을 바로 알려드립니다.
              </p>
            </div>
          </div>

          {/* 1. 시각적 에어컨 설치 연결 다이어그램 (실내기 → 배관/타공 → 실외기) */}
          <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-4">
            <div className="grid grid-cols-3 items-center gap-2 text-center">
              <div className="rounded-lg bg-white border border-[#E5E2DC] p-3">
                <span className="block text-hb-xs font-bold text-[#646E7E]">
                  실내 공간
                </span>
                <strong className="mt-1 block text-hb-sm font-extrabold text-[#0E1A2B]">
                  실내기 배치 · 전원
                </strong>
                <span className="mt-1 inline-block rounded bg-[#FFF5F0] px-2 py-0.5 text-hb-xs font-bold text-[#D9531E]">
                  {powerType === "220v"
                    ? "단상 220V"
                    : powerType === "380v"
                    ? "삼상 380V"
                    : "전원 현장확인"}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-hb-xs font-bold text-[#0E1A2B]">
                  {pipeDistance === "short"
                    ? "기본 배관 (5~8m)"
                    : "연장 배관·타공"}
                </span>
                <div className="my-1.5 h-1.5 w-full rounded-full bg-gradient-to-r from-[#0E1A2B] via-[#D9531E] to-[#0E1A2B]" />
                <span className="text-hb-xs text-[#646E7E]">
                  냉매배관 + 드레인호스
                </span>
              </div>

              <div className="rounded-lg bg-white border border-[#E5E2DC] p-3">
                <span className="block text-hb-xs font-bold text-[#646E7E]">
                  실외 공간
                </span>
                <strong className="mt-1 block text-hb-sm font-extrabold text-[#0E1A2B]">
                  실외기 거치 위치
                </strong>
                <span className="mt-1 inline-block rounded bg-[#0E1A2B] px-2 py-0.5 text-hb-xs font-bold text-white">
                  {outdoorSpot === "ground"
                    ? "1층·베란다 바닥"
                    : outdoorSpot === "angle"
                    ? "외벽 앵글 거치"
                    : "옥상·원거리"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. 사용자 터치 선택 컨트롤 (맨 위에서 바로 조작) */}
          <div className="space-y-3">
            <div>
              <span className="block text-hb-sm font-extrabold text-[#0E1A2B] mb-1.5">
                1) 실외기를 놓을 위치가 어디인가요?
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "ground", label: "1층 · 베란다 바닥" },
                  { id: "angle", label: "외벽 앵글(난간)" },
                  { id: "rooftop", label: "옥상 · 별도 공간" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setOutdoorSpot(opt.id as "ground" | "angle" | "rooftop")
                    }
                    className={`rounded-lg border py-2 px-2 text-hb-xs font-bold transition-all cursor-pointer ${
                      outdoorSpot === opt.id
                        ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                        : "border-[#E5E2DC] bg-[#FAF9F7] text-[#3E4756] hover:border-[#0E1A2B]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-hb-sm font-extrabold text-[#0E1A2B] mb-1.5">
                  2) 실내기~실외기 예상 거리
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "short", label: "가까움 (기본 5~8m)" },
                    { id: "long", label: "멉니다 (층간·연장)" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setPipeDistance(opt.id as "short" | "long")
                      }
                      className={`rounded-lg border py-2 px-2 text-hb-xs font-bold transition-all cursor-pointer ${
                        pipeDistance === opt.id
                          ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E]"
                          : "border-[#E5E2DC] bg-[#FAF9F7] text-[#3E4756]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-hb-sm font-extrabold text-[#0E1A2B] mb-1.5">
                  3) 매장·가정 전원 방식
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "220v", label: "단상 220V" },
                    { id: "380v", label: "삼상 380V" },
                    { id: "unknown", label: "잘 모름" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setPowerType(opt.id as "220v" | "380v" | "unknown")
                      }
                      className={`rounded-lg border py-2 px-1.5 text-hb-xs font-bold transition-all cursor-pointer ${
                        powerType === opt.id
                          ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                          : "border-[#E5E2DC] bg-[#FAF9F7] text-[#3E4756]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 하단 맞춤 진단 결과 카드 */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-1.5 text-hb-sm text-emerald-950">
          <strong className="flex items-center gap-1.5 font-extrabold text-emerald-900">
            <Icon d={ICON.check} className="w-4 h-4 text-emerald-700" />
            <span>선택하신 환경 기준 설치 안내</span>
          </strong>
          <p className="leading-relaxed break-keep text-hb-xs">
            •{" "}
            {outdoorSpot === "ground"
              ? "실외기 바닥 거치 환경으로 별도 앵글 작업 없이 빠른 기본 설치가 가능합니다."
              : outdoorSpot === "angle"
              ? "외벽 앵글 거치가 필요한 환경입니다. 기존 앵글 유무를 알려주시면 안전하게 시공해 드립니다."
              : "옥상 또는 원거리 배관 환경입니다. 배관 연장 길이와 타공 위치를 상담 시 안내해 드립니다."}
          </p>
          <p className="leading-relaxed break-keep text-hb-xs">
            •{" "}
            {powerType === "380v"
              ? "삼상 380V 동력 전원 환경입니다. 매장 분전반 차단기 용량에 맞춰 전문 기사가 직결 시공합니다."
              : "설치하실 공간 사진 1장을 문자나 카톡으로 보내주시면 정확한 설치비를 바로 안내받으실 수 있습니다."}
          </p>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────
     냉장고 / 세탁기·건조기 / 업소용기기 공간 시뮬레이터
     (순서: 1. 버튼 선택 → 2. 시각적 공간 도해 → 3. 판정 결과)
     ────────────────────────────────────────────────────────── */
  const spaceDiffCm = mySpaceCm - requiredSpaceCm;
  const fitsSpace = spaceDiffCm >= 0;

  // 문 통과 시에는 가로폭과 깊이 중 더 좁은 면으로 회전하여 진입 가능
  const narrowestSideCm = Math.min(productWidthCm, productDepthCm);
  const doorDiffCm = myDoorCm - narrowestSideCm;
  const fitsDoorEasily = doorDiffCm >= 5;
  const fitsDoorTight = doorDiffCm >= -3 && doorDiffCm < 5;

  const applianceBarPercent = Math.min(
    86,
    Math.max(28, Math.round((productWidthCm / mySpaceCm) * 100))
  );

  return (
    <div
      className={`flex h-full flex-col justify-between rounded-2xl border border-[#E5E2DC] bg-white p-5 sm:p-6 shadow-2xs space-y-5 ${className}`}
    >
      <div className="space-y-4">
        {/* 상단 헤더 + 제품 기준 치수 한 줄 배지 (글자 깨짐 방지 & 명확한 인과관계) */}
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E5E2DC] pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FFF5F0] border border-[#FADCD0] px-2.5 py-1 text-hb-xs font-bold text-[#D9531E]">
              <Icon d={ICON.layers} className="w-3.5 h-3.5 text-[#D9531E]" />
              <span>설치 공간 시뮬레이터</span>
            </span>
            <h3 className="mt-2.5 text-hb-lg sm:text-hb-xl font-extrabold text-[#0E1A2B] tracking-tight">
              이 제품, 우리 집에 들어갈까요?
            </h3>
            <p className="mt-1 text-hb-sm text-[#646E7E]">
              우리 집 공간과 출입문 크기를 아래 버튼으로 눌러 바로 확인해 보세요.
            </p>
          </div>

          <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] px-3.5 py-2 text-right shrink-0">
            <span className="block text-hb-xs font-semibold text-[#646E7E]">
              {detected.isExact ? "제품 가로×깊이 치수" : "동급 표준 참고 치수"}
            </span>
            <strong className="text-hb-base font-extrabold text-[#0E1A2B] tabular-nums">
              가로 {productWidthCm}cm × 깊이 {productDepthCm}cm
            </strong>
          </div>
        </div>

        {/* STEP 1 (맨 위): 사용자가 먼저 누르는 큼직한 공간·출입문 선택 컨트롤 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="space-slider"
                className="text-hb-sm font-extrabold text-[#0E1A2B]"
              >
                1. 놓을 자리 가로폭
              </label>
              <span className="rounded bg-white border border-[#CFCAC0] px-2 py-0.5 text-hb-sm font-extrabold text-[#D9531E] tabular-nums">
                {mySpaceCm}cm
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SPACE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setMySpaceCm(p.cm)}
                  className={`rounded-lg border py-1.5 px-2 text-hb-xs font-bold transition-all cursor-pointer ${
                    mySpaceCm === p.cm
                      ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                      : "border-[#E5E2DC] bg-white text-[#3E4756] hover:border-[#0E1A2B]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              id="space-slider"
              type="range"
              min={60}
              max={300}
              step={5}
              value={mySpaceCm}
              onChange={(e) => setMySpaceCm(Number(e.target.value))}
              aria-label="놓을 자리 가로폭 슬라이더"
              className="w-full accent-[#0E1A2B] cursor-pointer"
            />
          </div>

          <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="door-slider"
                className="text-hb-sm font-extrabold text-[#0E1A2B]"
              >
                2. 가장 좁은 출입문 폭
              </label>
              <span className="rounded bg-white border border-[#CFCAC0] px-2 py-0.5 text-hb-sm font-extrabold text-[#0E1A2B] tabular-nums">
                {myDoorCm}cm
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DOOR_PRESETS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setMyDoorCm(d.cm)}
                  className={`rounded-lg border py-1.5 px-2 text-hb-xs font-bold transition-all cursor-pointer ${
                    myDoorCm === d.cm
                      ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                      : "border-[#E5E2DC] bg-white text-[#3E4756] hover:border-[#0E1A2B]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <input
              id="door-slider"
              type="range"
              min={65}
              max={150}
              step={5}
              value={myDoorCm}
              onChange={(e) => setMyDoorCm(Number(e.target.value))}
              aria-label="출입문 폭 슬라이더"
              className="w-full accent-[#0E1A2B] cursor-pointer"
            />
          </div>
        </div>

        {/* STEP 2 (중간): 직관적인 공간 배치 시각화 다이어그램 (본체 + 좌우 방열 5cm) */}
        <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-4 space-y-2.5">
          <div className="flex items-center justify-between text-hb-xs">
            <span className="font-bold text-[#0E1A2B]">
              벽면 공간 대비 제품 배치 시뮬레이션
            </span>
            <span className="font-semibold text-[#646E7E] tabular-nums">
              권장 필요폭: <strong>{requiredSpaceCm}cm</strong> (본체{" "}
              {productWidthCm}cm + 좌우 방열 {clearanceCm}cm)
            </span>
          </div>

          <div className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#CFCAC0] bg-white px-2">
            {/* 좌측 방열 여유 */}
            <div className="flex h-9 items-center justify-center rounded-l bg-[#FFF5F0] border border-r-0 border-[#FADCD0] px-2 text-hb-xs font-bold text-[#D9531E] shrink-0">
              좌 5cm
            </div>
            {/* 가전 본체 블록 */}
            <div
              style={{ width: `${applianceBarPercent}%` }}
              className={`flex h-10 items-center justify-center text-hb-xs font-extrabold text-white shadow-2xs transition-all duration-200 ${
                fitsSpace ? "bg-[#0E1A2B]" : "bg-red-600"
              }`}
            >
              가전 본체 ({productWidthCm}cm)
            </div>
            {/* 우측 방열 여유 */}
            <div className="flex h-9 items-center justify-center rounded-r bg-[#FFF5F0] border border-l-0 border-[#FADCD0] px-2 text-hb-xs font-bold text-[#D9531E] shrink-0">
              우 5cm
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3 (맨 아래): 한눈에 들어오는 2열 최종 판정 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div
          className={`rounded-xl border p-3.5 ${
            fitsSpace
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
              : "border-amber-300 bg-amber-50 text-amber-950"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <strong className="flex items-center gap-1.5 text-hb-sm font-extrabold">
              <Icon
                d={fitsSpace ? ICON.check : ICON.bell}
                className={`w-4 h-4 shrink-0 ${
                  fitsSpace ? "text-emerald-700" : "text-[#D9531E]"
                }`}
              />
              <span>
                {fitsSpace ? "설치 공간 여유 충분" : "설치 공간 폭 확인 필요"}
              </span>
            </strong>
            <span className="rounded bg-white/90 px-2 py-0.5 text-hb-xs font-extrabold tabular-nums">
              {fitsSpace ? `여유 +${spaceDiffCm}cm` : `${Math.abs(spaceDiffCm)}cm 부족`}
            </span>
          </div>
          <p className="mt-1 text-hb-xs leading-snug break-keep">
            {fitsSpace
              ? `양옆 방열 공간(10cm)을 두고도 ${spaceDiffCm}cm가 남아 쾌적하게 설치됩니다.`
              : `방열을 위해 최소 ${requiredSpaceCm}cm 공간이 권장됩니다. 매장에 치수를 문의해 주세요.`}
          </p>
        </div>

        <div
          className={`rounded-xl border p-3.5 ${
            fitsDoorEasily
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
              : "border-amber-300 bg-amber-50 text-amber-950"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <strong className="flex items-center gap-1.5 text-hb-sm font-extrabold">
              <Icon
                d={fitsDoorEasily ? ICON.check : ICON.wrench}
                className={`w-4 h-4 shrink-0 ${
                  fitsDoorEasily ? "text-emerald-700" : "text-[#D9531E]"
                }`}
              />
              <span>
                {fitsDoorEasily
                  ? "출입문 그대로 통과"
                  : fitsDoorTight
                  ? "도어(문짝) 분리 반입 가능"
                  : "창문(사다리차) 반입 상담"}
              </span>
            </strong>
            <span className="rounded bg-white/90 px-2 py-0.5 text-hb-xs font-extrabold tabular-nums">
              최소통과폭 {narrowestSideCm}cm
            </span>
          </div>
          <p className="mt-1 text-hb-xs leading-snug break-keep">
            {fitsDoorEasily
              ? `가장 좁은 면(${narrowestSideCm}cm) 기준으로 출입문(${myDoorCm}cm)을 여유 있게 통과합니다.`
              : `문폭이 다소 좁아도 기사님이 냉장고 문짝을 탈거하거나 창문으로 안전하게 반입해 드립니다.`}
          </p>
        </div>
      </div>
    </div>
  );
}
