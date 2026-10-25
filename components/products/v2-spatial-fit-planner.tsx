// 파일 경로: components/products/v2-spatial-fit-planner.tsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  normalizeProductCategory,
  smsHref,
  STORE,
  trackEvent,
} from "../../lib/site";
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
  { label: "소형 주방 (120cm)", cm: 120 },
  { label: "일반 가정집 (150cm)", cm: 150 },
  { label: "넓은 벽면 (220cm)", cm: 220 },
] as const;

const DOOR_PRESETS = [
  { label: "좁은 방문 (75cm)", cm: 75 },
  { label: "일반 방문 (80cm)", cm: 80 },
  { label: "아파트 현관 (90cm)", cm: 90 },
  { label: "상가·양개문 (110cm+)", cm: 115 },
] as const;

export function V2SpatialFitPlanner({
  productId,
  title,
  description,
  category,
  overrideWidthMm,
  className = "",
}: {
  productId?: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  overrideWidthMm?: number | null;
  className?: string;
}) {
  const catLabel = normalizeProductCategory(category);
  const combinedText = `${title || ""}\n${description || ""}`;

  // 현재 보고 있는 상품 자체가 삼상(380V) 전용인지 단상(220V)인지 자동 감지
  const isProductThreePhase = /삼상|380\s*V/i.test(combinedText);
  const isProductSinglePhase = /단상|220\s*V/i.test(combinedText);

  /* 에어컨/냉난방기 선택 상태 */
  const [outdoorSpot, setOutdoorSpot] = useState<
    "ground" | "angle" | "rooftop"
  >("ground");
  const [pipeDistance, setPipeDistance] = useState<"short" | "long">("short");
  const [powerType, setPowerType] = useState<"220v" | "380v" | "unknown">(
    isProductThreePhase ? "380v" : "220v"
  );

  /* 냉장고/세탁기/업소용 공간 & 운반 층수 선택 상태 */
  const detected = useMemo(
    () => extractDimensionsFromText(title, description, catLabel),
    [title, description, catLabel]
  );

  const productWidthCm = Math.round(
    (overrideWidthMm || detected.widthMm) / 10
  );
  const productDepthCm = Math.round(detected.depthMm / 10);
  const clearanceCm = 10;
  const requiredSpaceCm = productWidthCm + clearanceCm;

  const [mySpaceCm, setMySpaceCm] = useState<number>(
    Math.max(120, requiredSpaceCm + 30)
  );
  const [myDoorCm, setMyDoorCm] = useState<number>(90);
  const [carryFloor, setCarryFloor] = useState<"1f_elev" | "stairs">("1f_elev");

  /* ──────────────────────────────────────────────────────────
     분기 A: 에어컨·냉난방기 — 호환성 판정 & 설치비 발생 항목 계산기
     ────────────────────────────────────────────────────────── */
  if (catLabel === "에어컨/냉난방기") {
    const hasPowerMismatch =
      (isProductThreePhase && powerType === "220v") ||
      (isProductSinglePhase && powerType === "380v");

    const spotLabel =
      outdoorSpot === "ground"
        ? "1층·베란다 바닥"
        : outdoorSpot === "angle"
        ? "외벽 앵글 거치"
        : "옥상·원거리";
    const pipeLabel =
      pipeDistance === "short" ? "기본거리(5~8m)" : "먼거리(연장필요)";
    const powerLabel =
      powerType === "220v"
        ? "단상 220V"
        : powerType === "380v"
        ? "삼상 380V"
        : "전원 미확인";

    const envSummary = `실외기:${spotLabel} / 배관:${pipeLabel} / 전원:${powerLabel}`;

    // 기본 포함 vs 별도 확인 항목을 구매자 관점에서 명확히 분류
    const basicItems: string[] = [
      "실내기 + 전용 실외기 + 리모컨 본체 세트",
      "출고 전 냉매 정량 충진 및 고압 살균 세척",
    ];
    const extraCheckItems: string[] = [];

    if (outdoorSpot === "ground") {
      basicItems.push("바닥 거치 환경 (별도 외벽 앵글 자재비 없음)");
    } else if (outdoorSpot === "angle") {
      extraCheckItems.push(
        "외벽 앵글: 기존 앵글 재사용 시 무료 / 신규 앵글 설치 시 자재비·위험수당 별도"
      );
    } else {
      extraCheckItems.push(
        "옥상·특수 거치: 옥상 배관 인양 및 고정 작업 여건 사전 확인 필요"
      );
    }

    if (pipeDistance === "short") {
      extraCheckItems.push(
        "기본 배관(5~8m 이내) 시공 및 벽체 타공(구멍 없는 경우 1홀 기준) 여부 확인"
      );
    } else {
      extraCheckItems.push(
        "배관 연장: 기본 길이 초과분은 1m당 추가 배관비 및 냉매 보충비 발생"
      );
    }

    if (powerType === "380v") {
      extraCheckItems.push(
        "삼상 380V 전원: 매장 분전반(4선식 차단기) 위치 및 전원선 연결 거리 확인"
      );
    }

    const smsBody = `[한밭중고전자 에어컨 설치견적 문의]\n• 상품: ${
      title || "에어컨/냉난방기"
    }\n• 내 설치조건: ${envSummary}\n위 조건으로 기기값 포함 예상 설치 견적 문의드립니다.`;

    const inquiryUrlParams = new URLSearchParams({
      write: "1",
      type: "구매 문의",
      ...(productId ? { productId } : {}),
      title: `[설치견적 문의] ${title || "에어컨/냉난방기"}`,
      category: catLabel,
      envNote: envSummary,
    });

    return (
      <div className={`flex h-full flex-col justify-between rounded-2xl border border-[#E5E2DC] bg-white p-5 sm:p-6 shadow-2xs space-y-5 ${className}`}>
        <div className="space-y-4">
          {/* 상단 헤더 */}
          <div className="border-b border-[#E5E2DC] pb-4">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FFF5F0] border border-[#FADCD0] px-2.5 py-1 text-hb-xs font-bold text-[#D9531E]">
              <Icon d={ICON.snowflake} className="w-3.5 h-3.5 text-[#D9531E] shrink-0" />
              <span>에어컨 설치비 · 호환성 판별기</span>
            </span>
            <h3 className="mt-2.5 text-hb-lg sm:text-hb-xl font-extrabold text-[#0E1A2B] tracking-tight">
              내 환경에선 어떤 추가 작업이 필요할까요?
            </h3>
            <p className="mt-1 text-hb-xs text-[#646E7E]">
              설치하실 장소 조건을 누르시면 <strong>전원 호환 여부</strong>와{" "}
              <strong>추가 비용 발생 항목</strong>을 바로 구분해 드립니다.
            </p>
          </div>

          {/* 1. 사용자 조건 선택 버튼 */}
          <div className="space-y-3">
            <div>
              <span className="block text-hb-xs font-extrabold text-[#0E1A2B] mb-1.5">
                1) 실외기를 놓을 위치
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "ground", label: "1층 · 베란다 바닥" },
                  { id: "angle", label: "외벽 앵글(난간)" },
                  { id: "rooftop", label: "옥상 · 원거리" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setOutdoorSpot(opt.id as "ground" | "angle" | "rooftop")
                    }
                    className={`rounded-lg border py-2 px-2 text-hb-xs font-bold transition-all ${
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
                <span className="block text-hb-xs font-extrabold text-[#0E1A2B] mb-1.5">
                  2) 실내기~실외기 배관 거리
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "short", label: "가까움 (5~8m 이내)" },
                    { id: "long", label: "멉니다 (연장 필요)" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setPipeDistance(opt.id as "short" | "long")
                      }
                      className={`rounded-lg border py-2 px-2 text-hb-xs font-bold transition-all ${
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
                <span className="block text-hb-xs font-extrabold text-[#0E1A2B] mb-1.5">
                  3) 우리 집·매장 전기 방식
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
                      className={`rounded-lg border py-2 px-1.5 text-hb-xs font-bold transition-all ${
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

          {/* 2. 전원 호환성 경고 배너 (불일치 시 즉시 경고) */}
          {hasPowerMismatch && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-hb-xs text-red-900">
              <strong className="flex items-center gap-1.5 font-extrabold text-red-700 mb-0.5">
                <Icon d={ICON.bolt} className="w-4 h-4 text-red-600 shrink-0" />
                <span>전원 규격 호환 확인이 꼭 필요합니다!</span>
              </strong>
              {isProductThreePhase ? (
                <span>
                  보고 계신 상품은 <strong>삼상(380V) 동력 전용 모델</strong>입니다. 일반 가정용/상가 단상(220V) 콘센트에는 바로 설치할 수 없으니 단상 모델 재고를 문의해 주세요.
                </span>
              ) : (
                <span>
                  보고 계신 상품은 <strong>단상(220V) 모델</strong>입니다. 매장 전기가 삼상(380V)이라도 일반 220V 콘센트가 있으면 설치 가능합니다.
                </span>
              )}
            </div>
          )}

          {/* 3. 실용적인 [기본 포함 vs 현장 추가비용 발생 항목] 비교표 */}
          <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-4 space-y-3 text-hb-xs">
            <div>
              <strong className="flex items-center gap-1.5 text-[#0E1A2B] font-extrabold">
                <Icon d={ICON.check} className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>기본 제공 및 추가비 없는 항목</span>
              </strong>
              <ul className="mt-1.5 space-y-1 pl-4 text-[#3E4756] list-disc">
                {basicItems.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[#E5E2DC] pt-2.5">
              <strong className="flex items-center gap-1.5 text-[#B5431A] font-extrabold">
                <Icon d={ICON.wrench} className="w-3.5 h-3.5 text-[#D9531E] shrink-0" />
                <span>선택하신 여건에서 확인·산정이 필요한 설치 항목</span>
              </strong>
              <ul className="mt-1.5 space-y-1 pl-4 text-[#3E4756] list-disc">
                {extraCheckItems.map((ex) => (
                  <li key={ex} className="break-keep">
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 4. 선택한 조건 그대로 바로 설치비 물어보는 직통 버튼 */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={smsHref(STORE.mobile, smsBody)}
              onClick={() =>
                trackEvent("click_sms_consult", {
                  location: "v2_fit_planner_hvac",
                })
              }
              className="hb-btn-accent h-11 px-4 text-hb-xs sm:text-hb-sm font-extrabold"
            >
              <Icon d={ICON.chat} className="w-4 h-4" />
              <span>이 조건으로 설치비 문자 문의</span>
            </a>
            <Link
              href={`/inquiry?${inquiryUrlParams.toString()}`}
              className="hb-btn-primary h-11 px-4 text-hb-xs sm:text-hb-sm font-extrabold"
            >
              <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#FF8A50]" />
              <span>이 조건 첨부해 온라인 문의</span>
            </Link>
          </div>
          <p className="flex items-center justify-center gap-1 text-center text-hb-xs text-[#646E7E]">
            <Icon d={ICON.sparkles} className="w-3.5 h-3.5 text-[#D9531E] shrink-0 inline" />
            <span>
              버튼을 누르시면 방금 선택하신 <strong>[{envSummary}]</strong> 조건이 자동으로 입력됩니다.
            </span>
          </p>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────
     분기 B: 냉장고 / 세탁기·건조기 / 업소용기기 — 공간·문폭·운반비 판별기
     ────────────────────────────────────────────────────────── */
  const spaceDiffCm = mySpaceCm - requiredSpaceCm;
  const fitsSpace = spaceDiffCm >= 0;

  const narrowestSideCm = Math.min(productWidthCm, productDepthCm);
  const doorDiffCm = myDoorCm - narrowestSideCm;
  const fitsDoorEasily = doorDiffCm >= 5;
  const fitsDoorTight = doorDiffCm >= -3 && doorDiffCm < 5;

  const applianceBarPercent = Math.min(
    84,
    Math.max(28, Math.round((productWidthCm / mySpaceCm) * 100))
  );

  const floorLabel =
    carryFloor === "1f_elev" ? "1층 또는 엘리베이터 있음" : "2층 이상 계단운반";
  const doorStatusLabel = fitsDoorEasily
    ? `출입문(${myDoorCm}cm) 그대로 통과`
    : fitsDoorTight
    ? `출입문(${myDoorCm}cm) 도어분리 반입`
    : `출입문(${myDoorCm}cm) 사다리차/창문반입 확인`;

  const spaceEnvSummary = `설치공간:${mySpaceCm}cm / ${doorStatusLabel} / 운반:${floorLabel}`;

  const applianceSmsBody = `[한밭중고전자 배송·설치 문의]\n• 상품: ${
    title || catLabel
  }\n• 내 공간·운반조건: ${spaceEnvSummary}\n위 조건으로 배송 및 설치 가능 여부 문의드립니다.`;

  const applianceInquiryParams = new URLSearchParams({
    write: "1",
    type: catLabel === "업소용기기" ? "대량·업소용 상담" : "구매 문의",
    ...(productId ? { productId } : {}),
    title: `[배송·설치 문의] ${title || catLabel}`,
    category: catLabel,
    envNote: spaceEnvSummary,
  });

  return (
    <div className={`flex h-full flex-col justify-between rounded-2xl border border-[#E5E2DC] bg-white p-5 sm:p-6 shadow-2xs space-y-4 ${className}`}>
      <div className="space-y-4">
        {/* 상단 헤더 */}
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E5E2DC] pb-3.5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FFF5F0] border border-[#FADCD0] px-2.5 py-1 text-hb-xs font-bold text-[#D9531E]">
              <Icon d={ICON.ruler} className="w-3.5 h-3.5 text-[#D9531E] shrink-0" />
              <span>공간 · 문폭 · 운반 여건 판별기</span>
            </span>
            <h3 className="mt-2 text-hb-lg sm:text-hb-xl font-extrabold text-[#0E1A2B] tracking-tight">
              우리 집에 들어가고, 추가 운반비가 들까요?
            </h3>
          </div>

          <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] px-3 py-1.5 text-right shrink-0">
            <span className="block text-hb-xs font-semibold text-[#646E7E]">
              {detected.isExact ? "제품 가로×깊이" : "동급 표준 참고치"}
            </span>
            <strong className="text-hb-sm font-extrabold text-[#0E1A2B] tabular-nums">
              가로 {productWidthCm}cm × 깊이 {productDepthCm}cm
            </strong>
          </div>
        </div>

        {/* 1. 공간 · 문폭 · 층수 선택 컨트롤 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="space-slider"
                className="text-hb-xs font-extrabold text-[#0E1A2B]"
              >
                1. 놓을 자리 가로폭
              </label>
              <span className="rounded bg-white border border-[#CFCAC0] px-2 py-0.5 text-hb-xs font-extrabold text-[#D9531E] tabular-nums">
                {mySpaceCm}cm
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {SPACE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setMySpaceCm(p.cm)}
                  className={`rounded border py-1.5 px-1.5 text-hb-xs font-bold transition-all ${
                    mySpaceCm === p.cm
                      ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                      : "border-[#E5E2DC] bg-white text-[#3E4756]"
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
              max={280}
              step={5}
              value={mySpaceCm}
              onChange={(e) => setMySpaceCm(Number(e.target.value))}
              className="w-full accent-[#0E1A2B] cursor-pointer"
            />
          </div>

          <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="door-slider"
                className="text-hb-xs font-extrabold text-[#0E1A2B]"
              >
                2. 출입문 폭 &amp; 층수
              </label>
              <span className="rounded bg-white border border-[#CFCAC0] px-2 py-0.5 text-hb-xs font-extrabold text-[#0E1A2B] tabular-nums">
                문폭 {myDoorCm}cm
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {DOOR_PRESETS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setMyDoorCm(d.cm)}
                  className={`rounded border py-1.5 px-1.5 text-hb-xs font-bold transition-all ${
                    myDoorCm === d.cm
                      ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                      : "border-[#E5E2DC] bg-white text-[#3E4756]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => setCarryFloor("1f_elev")}
                className={`rounded border py-1 text-hb-xs font-bold ${
                  carryFloor === "1f_elev"
                    ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E]"
                    : "border-[#E5E2DC] bg-white text-[#646E7E]"
                }`}
              >
                1층 / 엘리베이터 있음
              </button>
              <button
                type="button"
                onClick={() => setCarryFloor("stairs")}
                className={`rounded border py-1 text-hb-xs font-bold ${
                  carryFloor === "stairs"
                    ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E]"
                    : "border-[#E5E2DC] bg-white text-[#646E7E]"
                }`}
              >
                2층 이상 계단운반
              </button>
            </div>
          </div>
        </div>

        {/* 2. 공간 점유 다이어그램 */}
        <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-3 space-y-2">
          <div className="flex items-center justify-between text-hb-xs">
            <span className="font-bold text-[#0E1A2B]">
              설치 벽면({mySpaceCm}cm) 대비 제품+방열폭({requiredSpaceCm}cm)
            </span>
            <span
              className={`font-extrabold ${
                fitsSpace ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {fitsSpace
                ? `여유 +${spaceDiffCm}cm`
                : `권장폭보다 ${Math.abs(spaceDiffCm)}cm 좁음`}
            </span>
          </div>
          <div className="relative flex h-11 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#CFCAC0] bg-white px-2">
            <div className="flex h-7 items-center justify-center rounded-l bg-[#FFF5F0] border border-r-0 border-[#FADCD0] px-1.5 text-hb-xs font-bold text-[#D9531E]">
              방열 5cm
            </div>
            <div
              style={{ width: `${applianceBarPercent}%` }}
              className={`flex h-8 items-center justify-center text-hb-xs font-extrabold text-white ${
                fitsSpace ? "bg-[#0E1A2B]" : "bg-red-600"
              }`}
            >
              본체 {productWidthCm}cm
            </div>
            <div className="flex h-7 items-center justify-center rounded-r bg-[#FFF5F0] border border-l-0 border-[#FADCD0] px-1.5 text-hb-xs font-bold text-[#D9531E]">
              방열 5cm
            </div>
          </div>
        </div>

        {/* 3. 구매자가 바로 이해하는 판정 요약 표 */}
        <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-3.5 space-y-2 text-hb-xs">
          <div className="flex items-start justify-between gap-2">
            <span className="font-bold text-[#646E7E] shrink-0">• 반입 판정:</span>
            <strong className="text-right font-extrabold text-[#0E1A2B]">
              {fitsDoorEasily
                ? `그대로 통과 가능 (최소 통과면 ${narrowestSideCm}cm)`
                : fitsDoorTight
                ? "냉장고 문짝(도어) 임시 분리 후 반입 가능"
                : "출입문이 좁아 창문(사다리차) 반입 여부 확인 필요"}
            </strong>
          </div>
          <div className="flex items-start justify-between gap-2 border-t border-[#E5E2DC] pt-2">
            <span className="font-bold text-[#646E7E] shrink-0">• 비용 기준:</span>
            <span className="text-right font-semibold text-[#3E4756] break-keep">
              {carryFloor === "1f_elev" && fitsDoorEasily
                ? "1층/엘리베이터 일반 반입 및 기본 수평 설치 (사다리차 비용 없음)"
                : "계단 층수 작업비 또는 사다리차 필요 여부에 따라 사전 협의 후 진행"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. 선택한 조건 그대로 문의하는 직통 액션 버튼 */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <a
            href={smsHref(STORE.mobile, applianceSmsBody)}
            onClick={() =>
              trackEvent("click_sms_consult", {
                location: "v2_fit_planner_appliance",
              })
            }
            className="hb-btn-accent h-11 px-4 text-hb-xs sm:text-hb-sm font-extrabold"
          >
            <Icon d={ICON.chat} className="w-4 h-4" />
            <span>이 조건으로 배송·설치 문자 문의</span>
          </a>
          <Link
            href={`/inquiry?${applianceInquiryParams.toString()}`}
            className="hb-btn-primary h-11 px-4 text-hb-xs sm:text-hb-sm font-extrabold"
          >
            <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#FF8A50]" />
            <span>이 조건 첨부해 온라인 문의</span>
          </Link>
        </div>
        <p className="flex items-center justify-center gap-1 text-center text-hb-xs text-[#646E7E]">
          <Icon d={ICON.sparkles} className="w-3.5 h-3.5 text-[#D9531E] shrink-0 inline" />
          <span>
            클릭 시 선택하신 <strong>[{spaceEnvSummary}]</strong> 조건이 문의 내용에 자동으로 들어갑니다.
          </span>
        </p>
      </div>
    </div>
  );
}
