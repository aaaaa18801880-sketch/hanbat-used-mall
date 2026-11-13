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
  { label: "좁은틈 (90cm)", cm: 90 },
  { label: "소형주방 (120cm)", cm: 120 },
  { label: "일반가정 (150cm)", cm: 150 },
  { label: "넓은벽면 (220cm)", cm: 220 },
] as const;

const DOOR_PRESETS = [
  { label: "좁은문 (75cm)", cm: 75 },
  { label: "일반방문 (80cm)", cm: 80 },
  { label: "현관문 (90cm)", cm: 90 },
  { label: "상가문 (110cm+)", cm: 115 },
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

  const isProductThreePhase = /삼상|3\s*상|380\s*V/i.test(combinedText);
  const isProductSinglePhase = /단상|220\s*V/i.test(combinedText);

  const [outdoorSpot, setOutdoorSpot] = useState<
    "ground" | "angle" | "rooftop"
  >("ground");
  const [pipeDistance, setPipeDistance] = useState<"short" | "long">("short");
  const [powerType, setPowerType] = useState<"220v" | "380v" | "unknown">(
    isProductThreePhase ? "380v" : "220v"
  );

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
     분기 A: 에어컨·냉난방기 — 전원 호환성 & 추가 설치비 항목 판별기
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

    const basicItems: string[] = [
      "실내기 + 전용 실외기 + 리모컨 본체 풀세트",
      "출고 전 냉매 정량 충진 및 열교환기 고압 살균 세척",
    ];
    const extraCheckItems: string[] = [];

    if (outdoorSpot === "ground") {
      basicItems.push("바닥 거치 환경 (외벽 앵글 자재비 없음)");
    } else if (outdoorSpot === "angle") {
      extraCheckItems.push(
        "외벽 앵글: 기존 앵글 재사용 시 무료 / 신규 설치 시 앵글 자재·작업비 별도"
      );
    } else {
      extraCheckItems.push(
        "옥상·원거리 거치: 옥상 배관 연장 및 고정 작업 여건 사전 확인 필요"
      );
    }

    if (pipeDistance === "short") {
      extraCheckItems.push(
        "기본 배관(5~8m 이내) 시공 및 벽체 타공(배관 구멍 없는 경우) 유무 확인"
      );
    } else {
      extraCheckItems.push(
        "장배관 연장: 기본 길이 초과 시 1m당 추가 배관비 및 냉매 보충비 산정"
      );
    }

    if (powerType === "380v") {
      extraCheckItems.push(
        "삼상 380V 동력 전원: 매장 분전반(4선식 차단기) 위치 및 전원선 거리 확인"
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
      <div className={`hb-surface-card flex h-full flex-col justify-between overflow-hidden ${className}`}>
        {/* 상단 헤더 */}
        <div className="border-b border-[#E2E6EC] bg-[#F7F8FA] px-5 py-5 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#BAE6FD] bg-[#F0F9FF] px-2.5 py-1 text-hb-xs font-bold text-[#0369A1] whitespace-nowrap">
            <Icon d={ICON.snowflake} className="w-3.5 h-3.5 text-[#0369A1] shrink-0" />
            <span>에어컨 설치비 · 전원 호환성 판별기</span>
          </span>
          <h3 className="mt-3 text-hb-lg sm:text-hb-xl font-bold text-[#141A23] tracking-tight">
            내 환경에선 어떤 추가 작업이 필요할까요?
          </h3>
          <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#334155]">
            설치 장소 조건을 누르시면 <strong>전원 호환 여부</strong>와{" "}
            <strong>추가 비용 발생 기준</strong>을 바로 구분해 드립니다.
          </p>
        </div>

        {/* 중앙 조작 및 결과 영역 (중첩 박스 없이 divide-y로 깔끔하게 분리) */}
        <div className="divide-y divide-[#E2E6EC] flex-1">
          {/* 1. 3가지 핵심 조건 터치 선택 */}
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <span className="block text-hb-xs sm:text-hb-sm font-bold text-[#141A23] mb-2">
                1. 실외기를 놓을 위치
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
                    className={`h-10 rounded-lg border px-2 text-hb-xs font-bold whitespace-nowrap transition-[transform,background-color,border-color,color] active:scale-[0.96] cursor-pointer ${
                      outdoorSpot === opt.id
                        ? "border-[#141A23] bg-[#141A23] text-white shadow-2xs"
                        : "border-[#E2E6EC] bg-[#F7F8FA] text-[#334155] hover:border-[#141A23]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-hb-xs sm:text-hb-sm font-bold text-[#141A23] mb-2">
                  2. 실내기~실외기 배관 거리
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "short", label: "가까움 (5~8m)" },
                    { id: "long", label: "멉니다 (연장)" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setPipeDistance(opt.id as "short" | "long")
                      }
                      className={`h-10 rounded-lg border px-2 text-hb-xs font-bold whitespace-nowrap transition-[transform,background-color,border-color,color] active:scale-[0.96] cursor-pointer ${
                        pipeDistance === opt.id
                          ? "border-[#E8521A] bg-[#FFF4EE] text-[#E8521A]"
                          : "border-[#E2E6EC] bg-[#F7F8FA] text-[#334155]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-hb-xs sm:text-hb-sm font-bold text-[#141A23] mb-2">
                  3. 우리 집·매장 전기 방식
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
                      className={`h-10 rounded-lg border px-1.5 text-hb-xs font-bold whitespace-nowrap transition-[transform,background-color,border-color,color] active:scale-[0.96] cursor-pointer ${
                        powerType === opt.id
                          ? "border-[#0284C7] bg-[#F0F9FF] text-[#0369A1]"
                          : "border-[#E2E6EC] bg-[#F7F8FA] text-[#334155]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {hasPowerMismatch && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-hb-xs text-red-900">
                <strong className="flex items-center gap-1 font-bold text-red-700 mb-0.5">
                  <Icon d={ICON.bolt} className="w-4 h-4 text-red-600 shrink-0" />
                  <span>전원 규격 호환 확인이 필요합니다</span>
                </strong>
                {isProductThreePhase
                  ? "본 상품은 삼상(380V) 동력 전용 모델입니다. 일반 단상(220V) 매장·가정에는 바로 설치할 수 없으니 단상 모델 재고를 문의해 주세요."
                  : "본 상품은 단상(220V) 모델입니다. 매장 내 일반 220V 콘센트 사용이 가능한지 확인해 주세요."}
              </div>
            )}
          </div>

          {/* 2. 기본 포함 vs 추가 비용 확인 항목 구분 */}
          <div className="p-5 sm:p-6 space-y-3.5 bg-[#F7F8FA]/60 text-hb-xs sm:text-hb-sm">
            <div>
              <strong className="flex items-center gap-1.5 text-[#0F766E] font-bold">
                <Icon d={ICON.check} className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span>기본 포함 및 추가 비용 없는 항목</span>
              </strong>
              <ul className="mt-1.5 space-y-1 pl-4 text-[#334155] list-disc">
                {basicItems.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-[#E2E6EC]">
              <strong className="flex items-center gap-1.5 text-[#E8521A] font-bold">
                <Icon d={ICON.wrench} className="w-3.5 h-3.5 text-[#E8521A] shrink-0" />
                <span>선택하신 여건에서 현장 산정이 필요한 항목</span>
              </strong>
              <ul className="mt-1.5 space-y-1 pl-4 text-[#334155] list-disc">
                {extraCheckItems.map((ex) => (
                  <li key={ex} className="break-keep">
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 하단 원클릭 문의 연결 바 */}
        <div className="border-t border-[#E2E6EC] bg-white p-5 sm:px-6 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={smsHref(STORE.mobile, smsBody)}
              onClick={() =>
                trackEvent("click_sms_consult", {
                  location: "v2_fit_planner_hvac",
                })
              }
              className="hb-btn-accent h-11 px-4 text-hb-xs sm:text-hb-sm font-bold"
            >
              <Icon d={ICON.chat} className="w-4 h-4" />
              <span>이 조건으로 설치비 문자 문의</span>
            </a>
            <Link
              href={`/inquiry?${inquiryUrlParams.toString()}`}
              className="hb-btn-primary h-11 px-4 text-hb-xs sm:text-hb-sm font-bold"
            >
              <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#FF8A50]" />
              <span>이 조건 첨부해 온라인 문의</span>
            </Link>
          </div>
          <p className="text-center text-hb-xs text-[#64748B]">
            클릭 시 선택하신 <strong>[{envSummary}]</strong> 조건이 문의 내용에 자동 입력됩니다.
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
    82,
    Math.max(28, Math.round((productWidthCm / mySpaceCm) * 100))
  );

  const floorLabel =
    carryFloor === "1f_elev" ? "1층/엘리베이터" : "2층이상 계단";
  const doorStatusLabel = fitsDoorEasily
    ? `문폭(${myDoorCm}cm) 여유통과`
    : fitsDoorTight
    ? `문폭(${myDoorCm}cm) 도어분리반입`
    : `문폭(${myDoorCm}cm) 사다리차확인`;

  const spaceEnvSummary = `설치벽면:${mySpaceCm}cm / ${doorStatusLabel} / 운반:${floorLabel}`;

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
    <div className={`hb-surface-card flex h-full flex-col justify-between overflow-hidden ${className}`}>
      {/* 상단 헤더 */}
      <div className="border-b border-[#E2E6EC] bg-[#F7F8FA] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#BAE6FD] bg-[#F0F9FF] px-2.5 py-1 text-hb-xs font-bold text-[#0369A1] whitespace-nowrap">
            <Icon d={ICON.ruler} className="w-3.5 h-3.5 text-[#0369A1] shrink-0" />
            <span>공간 · 문폭 · 운반 여건 판별기</span>
          </span>
          <span className="rounded-full border border-[#E2E6EC] bg-white px-3 py-1 text-hb-xs font-bold text-[#141A23] whitespace-nowrap tabular-nums">
            {detected.isExact ? "실측 규격" : "표준 참고치"}: 가로 {productWidthCm}cm × 깊이 {productDepthCm}cm
          </span>
        </div>
        <h3 className="mt-3 text-hb-lg sm:text-hb-xl font-bold text-[#141A23] tracking-tight">
          우리 집에 들어가고, 추가 운반비가 들까요?
        </h3>
        <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#334155]">
          놓을 자리와 출입문 폭을 선택하시면 <strong>통과 여부</strong>와{" "}
          <strong>운반 조건</strong>을 바로 판별해 드립니다.
        </p>
      </div>

      {/* 본문 영역 (No Card-in-Card: divide-y 구분선으로 깔끔하게 분리) */}
      <div className="divide-y divide-[#E2E6EC] flex-1">
        {/* 1. 조작 컨트롤 영역 */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* 놓을 자리 가로폭 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="space-slider"
                className="text-hb-xs sm:text-hb-sm font-bold text-[#141A23]"
              >
                1. 제품 놓을 자리(벽면) 가로폭
              </label>
              <strong className="text-hb-sm sm:text-hb-base font-bold text-[#E8521A] tabular-nums">
                {mySpaceCm}cm
              </strong>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {SPACE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setMySpaceCm(p.cm)}
                  className={`h-9 rounded-lg border px-2 text-hb-xs font-bold whitespace-nowrap transition-[transform,background-color,border-color,color] active:scale-[0.96] cursor-pointer ${
                    mySpaceCm === p.cm
                      ? "border-[#141A23] bg-[#141A23] text-white"
                      : "border-[#E2E6EC] bg-[#F7F8FA] text-[#334155] hover:border-[#141A23]"
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
              className="w-full accent-[#141A23] cursor-pointer"
            />
          </div>

          {/* 출입문 폭 & 운반 층수 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="door-slider"
                className="text-hb-xs sm:text-hb-sm font-bold text-[#141A23]"
              >
                2. 가장 좁은 출입문 폭 &amp; 운반 층수
              </label>
              <strong className="text-hb-sm sm:text-hb-base font-bold text-[#0369A1] tabular-nums">
                문폭 {myDoorCm}cm · {floorLabel}
              </strong>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {DOOR_PRESETS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setMyDoorCm(d.cm)}
                  className={`h-9 rounded-lg border px-2 text-hb-xs font-bold whitespace-nowrap transition-[transform,background-color,border-color,color] active:scale-[0.96] cursor-pointer ${
                    myDoorCm === d.cm
                      ? "border-[#0284C7] bg-[#F0F9FF] text-[#0369A1]"
                      : "border-[#E2E6EC] bg-[#F7F8FA] text-[#334155] hover:border-[#141A23]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <input
              id="door-slider"
              type="range"
              min={55}
              max={130}
              step={5}
              value={myDoorCm}
              onChange={(e) => setMyDoorCm(Number(e.target.value))}
              className="w-full accent-[#0284C7] cursor-pointer"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCarryFloor("1f_elev")}
                className={`h-9 rounded-lg border px-2 text-hb-xs font-bold whitespace-nowrap transition-[transform,background-color,border-color,color] active:scale-[0.96] cursor-pointer ${
                  carryFloor === "1f_elev"
                    ? "border-[#0D9488] bg-[#F0FDFA] text-[#0F766E]"
                    : "border-[#E2E6EC] bg-[#F7F8FA] text-[#64748B]"
                }`}
              >
                1층 또는 엘리베이터 있음
              </button>
              <button
                type="button"
                onClick={() => setCarryFloor("stairs")}
                className={`h-9 rounded-lg border px-2 text-hb-xs font-bold whitespace-nowrap transition-[transform,background-color,border-color,color] active:scale-[0.96] cursor-pointer ${
                  carryFloor === "stairs"
                    ? "border-[#E8521A] bg-[#FFF4EE] text-[#E8521A]"
                    : "border-[#E2E6EC] bg-[#F7F8FA] text-[#64748B]"
                }`}
              >
                2층 이상 계단 운반
              </button>
            </div>
          </div>
        </div>

        {/* 2. 공간 점유 바 & 2줄 핵심 판정 결과 */}
        <div className="p-5 sm:p-6 bg-[#F7F8FA]/60 space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-hb-xs tabular-nums">
              <span className="font-bold text-[#141A23]">
                설치 공간({mySpaceCm}cm) 대비 제품+양옆 방열폭({requiredSpaceCm}cm)
              </span>
              <strong
                className={
                  fitsSpace ? "text-[#0F766E]" : "text-red-600"
                }
              >
                {fitsSpace
                  ? `여유 +${spaceDiffCm}cm`
                  : `${Math.abs(spaceDiffCm)}cm 좁음`}
              </strong>
            </div>

            <div className="flex h-10 w-full items-center justify-center overflow-hidden rounded-lg border border-[#CBD2DC] bg-white px-2">
              <span className="flex h-7 items-center rounded-l bg-[#F0FDFA] border border-r-0 border-[#CCFBF1] px-2 text-hb-xs font-bold text-[#0F766E] whitespace-nowrap">
                방열 5cm
              </span>
              <div
                style={{ width: `${applianceBarPercent}%` }}
                className={`flex h-7 items-center justify-center text-hb-xs font-bold text-white whitespace-nowrap tabular-nums ${
                  fitsSpace ? "bg-[#141A23]" : "bg-red-600"
                }`}
              >
                본체 {productWidthCm}cm
              </div>
              <span className="flex h-7 items-center rounded-r bg-[#F0FDFA] border border-l-0 border-[#CCFBF1] px-2 text-hb-xs font-bold text-[#0F766E] whitespace-nowrap">
                방열 5cm
              </span>
            </div>
          </div>

          <dl className="divide-y divide-[#E2E6EC] text-hb-xs sm:text-hb-sm pt-1">
            <div className="py-2 flex items-start justify-between gap-3">
              <dt className="font-bold text-[#64748B] shrink-0">출입문 통과</dt>
              <dd className="font-bold text-[#141A23] text-right break-keep">
                {fitsDoorEasily
                  ? `그대로 통과 가능 (최소 통과면 ${narrowestSideCm}cm)`
                  : fitsDoorTight
                  ? "기사님이 도어(문짝) 임시 분리 후 반입 가능"
                  : "문폭이 좁아 창문(사다리차) 반입 여부 상담 필요"}
              </dd>
            </div>
            <div className="py-2 flex items-start justify-between gap-3">
              <dt className="font-bold text-[#64748B] shrink-0">운반·설치비</dt>
              <dd className="font-bold text-[#334155] text-right break-keep">
                {carryFloor === "1f_elev" && fitsDoorEasily
                  ? "일반 반입 및 기본 수평 설치 (사다리차 비용 없음)"
                  : "계단 층수 작업비 또는 사다리차 여부에 따라 사전 안내"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 하단 원클릭 문의 연결 바 */}
      <div className="border-t border-[#E2E6EC] bg-white p-5 sm:px-6 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href={smsHref(STORE.mobile, applianceSmsBody)}
            onClick={() =>
              trackEvent("click_sms_consult", {
                location: "v2_fit_planner_appliance",
              })
            }
            className="hb-btn-accent h-11 px-4 text-hb-xs sm:text-hb-sm font-bold"
          >
            <Icon d={ICON.chat} className="w-4 h-4" />
            <span>이 조건으로 배송·설치 문자 문의</span>
          </a>
          <Link
            href={`/inquiry?${applianceInquiryParams.toString()}`}
            className="hb-btn-primary h-11 px-4 text-hb-xs sm:text-hb-sm font-bold"
          >
            <Icon d={ICON.pen} className="w-3.5 h-3.5 text-[#FF8A50]" />
            <span>이 조건 첨부해 온라인 문의</span>
          </Link>
        </div>
        <p className="text-center text-hb-xs text-[#64748B]">
          클릭 시 선택하신 <strong>[{spaceEnvSummary}]</strong> 조건이 문의 내용에 자동 입력됩니다.
        </p>
      </div>
    </div>
  );
}
