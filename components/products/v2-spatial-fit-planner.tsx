// 파일 경로: components/products/v2-spatial-fit-planner.tsx
"use client";

import React, { useState, useMemo, useId } from "react";
import { Icon, ICON } from "../../lib/ui";
import { STORE, telHref } from "../../lib/site";

function parseDimensionsFromText(text: string): {
  widthMm: number;
  depthMm: number | null;
  heightMm: number | null;
  isEstimated: boolean;
  sourceNote: string;
} {
  // 1) W x D x H (예: 910 x 900 x 1850mm 또는 1260*800*1900)
  const tripleMatch = text.match(
    /(\d{3,4})\s*[x×*]\s*(\d{3,4})\s*[x×*]\s*(\d{3,4})/i
  );
  if (tripleMatch) {
    const w = Number(tripleMatch[1]);
    const d = Number(tripleMatch[2]);
    const h = Number(tripleMatch[3]);
    if (w >= 350 && w <= 3000) {
      return {
        widthMm: w,
        depthMm: d,
        heightMm: h,
        isEstimated: false,
        sourceNote: "상품 제원(가로×깊이×높이) 표기 기준",
      };
    }
  }

  // 2) 가로/폭 단독 표기
  const widthMatch = text.match(/(?:가로|폭)\s*[:：]?\s*(\d{3,4})\s*mm/i);
  if (widthMatch) {
    const w = Number(widthMatch[1]);
    if (w >= 350 && w <= 3000) {
      return {
        widthMm: w,
        depthMm: null,
        heightMm: null,
        isEstimated: false,
        sourceNote: "상품 상세 설명 가로폭 표기 기준",
      };
    }
  }

  // 3) 품목 키워드 기반 표준 참고 치수 (실측 아님 명시)
  if (/45\s*박스/.test(text)) {
    return {
      widthMm: 1260,
      depthMm: 800,
      heightMm: 1900,
      isEstimated: true,
      sourceNote: "업소용 45박스 표준 참고 규격",
    };
  }
  if (/25\s*박스|30\s*박스/.test(text)) {
    return {
      widthMm: 650,
      depthMm: 800,
      heightMm: 1900,
      isEstimated: true,
      sourceNote: "업소용 25·30박스 표준 참고 규격",
    };
  }
  if (/테이블\s*냉장|작업대/.test(text)) {
    return {
      widthMm: 1200,
      depthMm: 700,
      heightMm: 850,
      isEstimated: true,
      sourceNote: "테이블 냉장고 1200형 표준 참고 규격",
    };
  }
  if (/양문형|비스포크|오브제|8\d\d\s*L/i.test(text)) {
    return {
      widthMm: 912,
      depthMm: 910,
      heightMm: 1850,
      isEstimated: true,
      sourceNote: "양문형 800L급 표준 참고 규격",
    };
  }
  if (/일반\s*냉장고|소형\s*냉장고|원룸/.test(text)) {
    return {
      widthMm: 555,
      depthMm: 635,
      heightMm: 1445,
      isEstimated: true,
      sourceNote: "원룸·일반 냉장고 표준 참고 규격",
    };
  }
  if (/드럼|건조기|워시타워/.test(text)) {
    return {
      widthMm: 700,
      depthMm: 770,
      heightMm: 990,
      isEstimated: true,
      sourceNote: "드럼·건조기 표준 참고 규격",
    };
  }

  return {
    widthMm: 900,
    depthMm: 750,
    heightMm: null,
    isEstimated: true,
    sourceNote: "일반 중형 가전 표준 참고 규격",
  };
}

export function V2SpatialFitPlanner({
  title,
  description,
  overrideWidthMm,
  className = "",
}: {
  title?: string | null;
  description?: string | null;
  overrideWidthMm?: number | null;
  className?: string;
}) {
  const patternId = useId().replace(/:/g, "");
  const combinedText = `${title || ""}\n${description || ""}`;
  const parsed = useMemo(
    () => parseDimensionsFromText(combinedText),
    [combinedText]
  );

  const productWidthMm =
    overrideWidthMm && overrideWidthMm > 0 ? overrideWidthMm : parsed.widthMm;
  const productWidthCm = Math.round(productWidthMm / 10);

  // 좌우 방열 및 여유 공간: 좌 50mm + 우 50mm = 총 100mm (10cm)
  const clearanceTotalMm = 100;
  const clearanceTotalCm = 10;
  const requiredSpaceMm = productWidthMm + clearanceTotalMm;
  const requiredSpaceCm = Math.round(requiredSpaceMm / 10);

  // 사용자 입력 상태 (기본값: 필요 공간 + 40cm, 50cm 단위 반올림)
  const [wallSpaceCm, setWallSpaceCm] = useState<number>(() => {
    const initCm = Math.ceil((requiredSpaceCm + 40) / 10) * 10;
    return Math.min(350, Math.max(80, initCm));
  });
  const [doorWidthCm, setDoorWidthCm] = useState<number>(85);

  const wallSpaceMm = wallSpaceCm * 10;
  const doorWidthMm = doorWidthCm * 10;

  // 1) 설치 공간 여유 판정
  const fitsWall = wallSpaceMm >= requiredSpaceMm;
  const marginCm = wallSpaceCm - requiredSpaceCm;

  // 2) 출입문 통과 판정 (제품의 최소 통과 폭 기준)
  const minPassSideMm = parsed.depthMm
    ? Math.min(productWidthMm, parsed.depthMm)
    : productWidthMm;
  const minPassSideCm = Math.round(minPassSideMm / 10);
  // 문틀 손잡이 및 여유 여백 3cm(30mm) 감안
  const fitsDoor = doorWidthMm >= minPassSideMm + 30;
  const doorMarginCm = doorWidthCm - minPassSideCm;

  // 슬라이더 및 직접 입력 핸들러
  const handleWallInput = (valueStr: string) => {
    const num = Number(valueStr.replace(/[^0-9]/g, ""));
    if (!Number.isNaN(num)) {
      setWallSpaceCm(Math.min(450, Math.max(40, num)));
    }
  };

  const handleDoorInput = (valueStr: string) => {
    const num = Number(valueStr.replace(/[^0-9]/g, ""));
    if (!Number.isNaN(num)) {
      setDoorWidthCm(Math.min(200, Math.max(50, num)));
    }
  };

  return (
    <div
      className={`flex h-full flex-col justify-between rounded-2xl border border-[#E5E2DC] bg-white p-5 sm:p-6 shadow-2xs ${className}`}
    >
      <div>
        {/* ── 0. 헤더 영역 (고객 중심 질문형 타이틀 & 신뢰 뱃지) ── */}
        <div className="pb-4 border-b border-[#ECE9E2]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F7] border border-[#E5E2DC] px-2.5 py-0.5 text-hb-xs font-bold text-[#0E1A2B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D9531E]" aria-hidden="true" />
              설치 공간 시뮬레이터
            </span>
            <span
              className={`rounded-md px-2.5 py-0.5 text-hb-xs font-bold ${
                !overrideWidthMm && parsed.isEstimated
                  ? "bg-[#FFF5F0] border border-[#FADCD0] text-[#D9531E]"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-800"
              }`}
            >
              {!overrideWidthMm && parsed.isEstimated
                ? "예상 참고 치수"
                : "상품 정보 확인 치수"}
            </span>
          </div>

          <h3 className="mt-2 text-hb-lg sm:text-hb-xl font-extrabold text-[#0E1A2B] tracking-tight">
            이 제품, 우리 집에 설치할 수 있을까요?
          </h3>
          <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#434B59] leading-relaxed break-keep">
            설치할 공간과 출입문 폭을 입력하면 대략적인 설치 가능성을 확인할 수 있습니다.
          </p>
        </div>

        {/* ── A. 제품 치수 정보 카드 (실측 vs 추정 명확 분리) ── */}
        <div className="mt-4 rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="block text-hb-xs font-bold text-[#646E7E]">
                {overrideWidthMm
                  ? "선택 매물 합산 가로폭"
                  : !parsed.isEstimated
                  ? "상품 가로폭 (확인됨)"
                  : "예상 참고 치수 (가로폭)"}
              </span>
              <div className="mt-0.5 flex items-baseline gap-2">
                <strong className="text-hb-xl sm:text-hb-2xl font-extrabold text-[#0E1A2B] tabular-nums">
                  약 {productWidthCm}cm
                </strong>
                <span className="text-hb-xs text-[#646E7E] tabular-nums font-mono">
                  ({productWidthMm.toLocaleString()}mm)
                </span>
              </div>
            </div>

            <div className="sm:text-right max-w-sm">
              <span className="inline-block rounded bg-white px-2 py-0.5 text-hb-xs font-semibold text-[#0E1A2B] border border-[#E5E2DC]">
                {overrideWidthMm
                  ? "비교함 매물 기준"
                  : !parsed.isEstimated
                  ? "상품 상세 정보 기준"
                  : "유사 품목 표준 참고치"}
              </span>
              <p className="mt-1 text-hb-xs text-[#646E7E] leading-snug break-keep">
                {!overrideWidthMm && parsed.isEstimated
                  ? "실측 정보가 없어 유사 품목의 참고값을 표시합니다. 정확한 배치는 매장 상담을 권장합니다."
                  : "상세 스펙에 표기된 가로폭 수치입니다."}
              </p>
            </div>
          </div>
        </div>

        {/* ── D. 핵심 계산 결과 영역 (시각화 그래픽보다 먼저 읽히도록 전진 배치) ── */}
        <div className="mt-4 space-y-2.5">
          {/* 결과 카드 1: 설치 공간 판정 */}
          <div
            className={`rounded-xl border p-4 transition-all duration-200 ${
              fitsWall
                ? "border-emerald-300 bg-emerald-50/60 text-[#0E1A2B]"
                : "border-amber-300 bg-amber-50/70 text-[#0E1A2B]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                  fitsWall ? "bg-emerald-600" : "bg-[#D9531E]"
                }`}
                aria-hidden="true"
              >
                <Icon d={fitsWall ? ICON.check : ICON.close} className="h-3.5 w-3.5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <strong className="text-hb-sm sm:text-hb-base font-extrabold text-[#0E1A2B]">
                    {fitsWall
                      ? "설치 공간은 여유가 있어요"
                      : "설치 공간이 부족할 수 있어요"}
                  </strong>
                  <span
                    className={`rounded px-2 py-0.5 text-hb-xs font-bold tabular-nums ${
                      fitsWall
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-[#D9531E]"
                    }`}
                  >
                    {fitsWall ? `여유 +${marginCm}cm` : `약 ${Math.abs(marginCm)}cm 부족`}
                  </span>
                </div>

                <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#434B59] leading-relaxed break-keep">
                  필요 공간 약{" "}
                  <strong className="text-[#0E1A2B] tabular-nums font-bold">
                    {requiredSpaceCm}cm
                  </strong>
                  (가전 {productWidthCm}cm + 좌우 방열·여유 {clearanceTotalCm}cm) / 입력한 공간{" "}
                  <strong className="text-[#0E1A2B] tabular-nums font-bold">
                    {wallSpaceCm}cm
                  </strong>
                </p>

                {!fitsWall && (
                  <p className="mt-1 text-hb-xs font-medium text-[#D9531E] break-keep">
                    가전의 원활한 열 배출과 문 열림을 위해 좌우 최소 5cm씩 여유가 필요하므로 더 넓은 벽면 위치를 권장합니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 결과 카드 2: 출입문 반입 가능성 판정 */}
          <div
            className={`rounded-xl border p-4 transition-all duration-200 ${
              fitsDoor
                ? "border-emerald-300 bg-emerald-50/60 text-[#0E1A2B]"
                : "border-amber-300 bg-amber-50/70 text-[#0E1A2B]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                  fitsDoor ? "bg-emerald-600" : "bg-[#D9531E]"
                }`}
                aria-hidden="true"
              >
                <Icon d={fitsDoor ? ICON.check : ICON.bell} className="h-3.5 w-3.5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <strong className="text-hb-sm sm:text-hb-base font-extrabold text-[#0E1A2B]">
                    {fitsDoor
                      ? !overrideWidthMm && parsed.isEstimated
                        ? "출입문 폭은 충분해 보이지만, 실측 확인이 필요해요"
                        : "출입문 통과는 가능해 보여요"
                      : "출입문 통과가 어려울 수 있어요"}
                  </strong>
                  <span
                    className={`rounded px-2 py-0.5 text-hb-xs font-bold tabular-nums ${
                      fitsDoor
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-[#D9531E]"
                    }`}
                  >
                    {fitsDoor ? `문폭 여유 +${doorMarginCm}cm` : `통과 공간 협소`}
                  </span>
                </div>

                <p className="mt-1 text-hb-xs sm:text-hb-sm text-[#434B59] leading-relaxed break-keep">
                  {fitsDoor ? (
                    !overrideWidthMm && parsed.isEstimated ? (
                      <>
                        참고 치수 기준 최소 통과폭(약 {minPassSideCm}cm) 대비 문폭({doorWidthCm}cm)이 넓어 보이나, 실제 제품 깊이와 복도 회전 반경을 매장에 확인해 주세요.
                      </>
                    ) : (
                      <>
                        최소 통과폭(약 {minPassSideCm}cm) 대비 문폭({doorWidthCm}cm)에 여유가 있습니다. 단, 문 손잡이 돌출이나 복도 꺾임 구간을 함께 확인해 주세요.
                      </>
                    )
                  ) : (
                    <>
                      출입문 폭({doorWidthCm}cm)이 가전 최소 폭(약 {minPassSideCm}cm)보다 좁아 문짝 탈거 후 진입이나 사다리차 진입 여부를 확인해야 합니다.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── B & C. 사용자 측정 입력 영역 (친절한 설명과 cm 우선 조작) ── */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 입력 1: 설치할 공간의 가로 길이 */}
          <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-4">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="wall-space-cm-input"
                className="text-hb-sm font-extrabold text-[#0E1A2B]"
              >
                1. 제품을 놓을 공간은 얼마나 넓나요?
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="wall-space-cm-input"
                  type="number"
                  min={50}
                  max={450}
                  step={1}
                  value={wallSpaceCm}
                  onChange={(e) => handleWallInput(e.target.value)}
                  className="w-16 rounded-md border border-[#CFCAC0] bg-white px-2 py-1 text-right text-hb-sm font-extrabold text-[#0E1A2B] tabular-nums focus:border-[#0E1A2B] focus:outline-none"
                  aria-label="설치할 벽면 가로 길이 직접 입력 (cm)"
                />
                <span className="text-hb-xs font-bold text-[#0E1A2B]">cm</span>
              </div>
            </div>

            <p className="mt-1 text-hb-xs text-[#646E7E] leading-snug break-keep">
              제품을 놓을 벽면의 양 끝 사이(가구 사이 빈자리)를 측정해 주세요.
            </p>

            <input
              type="range"
              min={60}
              max={350}
              step={5}
              value={wallSpaceCm}
              onChange={(e) => setWallSpaceCm(Number(e.target.value))}
              aria-label="설치 벽면 폭 조절 슬라이더"
              className="mt-3.5 w-full accent-[#0E1A2B] cursor-pointer"
            />

            {/* 빠른 추천 프리셋 버튼 */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {[
                { cm: 80, label: "80cm (원룸)" },
                { cm: 120, label: "120cm (소형)" },
                { cm: 180, label: "180cm (일반)" },
                { cm: 250, label: "250cm+ (대형)" },
              ].map((p) => (
                <button
                  key={p.cm}
                  type="button"
                  onClick={() => setWallSpaceCm(p.cm)}
                  className={`rounded-md px-2 py-1 text-hb-xs font-semibold border transition-colors cursor-pointer ${
                    wallSpaceCm === p.cm
                      ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                      : "border-[#D7D2C8] bg-white text-[#434B59] hover:border-[#0E1A2B]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 입력 2: 출입문 폭 */}
          <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-4">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="door-width-cm-input"
                className="text-hb-sm font-extrabold text-[#0E1A2B]"
              >
                2. 제품이 들어올 입구는 충분히 넓나요?
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="door-width-cm-input"
                  type="number"
                  min={50}
                  max={200}
                  step={1}
                  value={doorWidthCm}
                  onChange={(e) => handleDoorInput(e.target.value)}
                  className="w-16 rounded-md border border-[#CFCAC0] bg-white px-2 py-1 text-right text-hb-sm font-extrabold text-[#0E1A2B] tabular-nums focus:border-[#0E1A2B] focus:outline-none"
                  aria-label="가장 좁은 출입문 폭 직접 입력 (cm)"
                />
                <span className="text-hb-xs font-bold text-[#0E1A2B]">cm</span>
              </div>
            </div>

            <p className="mt-1 text-hb-xs text-[#646E7E] leading-snug break-keep">
              현관문이나 방문 중 가장 좁은 입구의 통과 폭(문틀·손잡이 제외)을 확인해 주세요.
            </p>

            <input
              type="range"
              min={60}
              max={140}
              step={5}
              value={doorWidthCm}
              onChange={(e) => setDoorWidthCm(Number(e.target.value))}
              aria-label="출입문 폭 조절 슬라이더"
              className="mt-3.5 w-full accent-[#0E1A2B] cursor-pointer"
            />

            {/* 출입문 표준 규격 빠른 선택 */}
            <div className="mt-2.5 grid grid-cols-4 gap-1">
              {[
                { cm: 70, label: "70cm (좁은문)" },
                { cm: 80, label: "80cm (방문)" },
                { cm: 90, label: "90cm (현관)" },
                { cm: 110, label: "110cm (넓은문)" },
              ].map((d) => (
                <button
                  key={d.cm}
                  type="button"
                  onClick={() => setDoorWidthCm(d.cm)}
                  className={`rounded-md py-1 px-1 text-center text-hb-xs font-semibold border transition-colors cursor-pointer ${
                    doorWidthCm === d.cm
                      ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                      : "border-[#D7D2C8] bg-white text-[#434B59] hover:border-[#0E1A2B]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── E. 보조 시각화 (CAD 블루프린트 대신 이해하기 쉬운 쇼룸 2D 배치도) ── */}
        <div className="mt-5 rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#ECE9E2]">
            <span className="text-hb-xs font-bold text-[#0E1A2B]">
              한눈에 보는 공간 배치도
            </span>
            <span className="text-hb-xs font-medium text-[#646E7E]">
              입력한 공간 대비 가전 크기 비율
            </span>
          </div>

          {/* 친절한 2D 평면/입면 다이어그램 */}
          <div className="relative w-full overflow-hidden rounded-lg bg-white p-3 border border-[#E5E2DC]">
            {(() => {
              const maxDiagramW = 300;
              const ratio = Math.min(1, productWidthCm / wallSpaceCm);
              const scaledW = Math.max(50, Math.min(230, Math.round(ratio * maxDiagramW)));
              const clearanceScaledW = Math.max(10, Math.min(25, Math.round((5 / wallSpaceCm) * maxDiagramW)));
              const startX = 35 + Math.max(0, Math.round((maxDiagramW - scaledW) / 2));

              return (
                <svg
                  viewBox="0 0 370 125"
                  className="w-full h-auto max-h-[140px] select-none"
                  aria-label="가전 공간 배치도 그래픽"
                >
                  <defs>
                    <pattern
                      id={`grid-${patternId}`}
                      width="15"
                      height="15"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 15 0 L 0 0 0 15"
                        fill="none"
                        stroke="#F0ECE3"
                        strokeWidth="0.8"
                      />
                    </pattern>
                  </defs>
                  <rect width="370" height="125" fill={`url(#grid-${patternId})`} rx="6" />

                  {/* 좌·우 벽면 경계 기둥 */}
                  <rect x="15" y="15" width="12" height="95" fill="#E5E2DC" stroke="#CFCAC0" strokeWidth="1" rx="2" />
                  <text x="21" y="65" textAnchor="middle" fontSize="8" fill="#858076" transform="rotate(-90 21 65)">
                    왼쪽 벽
                  </text>

                  <rect x="343" y="15" width="12" height="95" fill="#E5E2DC" stroke="#CFCAC0" strokeWidth="1" rx="2" />
                  <text x="349" y="65" textAnchor="middle" fontSize="8" fill="#858076" transform="rotate(90 349 65)">
                    오른쪽 벽
                  </text>

                  {/* 전체 측정 벽면 치수선 (상단) */}
                  <line x1="30" y1="20" x2="340" y2="20" stroke="#0E1A2B" strokeWidth="1.2" />
                  <line x1="30" y1="16" x2="30" y2="24" stroke="#0E1A2B" strokeWidth="1.5" />
                  <line x1="340" y1="16" x2="340" y2="24" stroke="#0E1A2B" strokeWidth="1.5" />
                  <rect x="135" y="10" width="100" height="18" rx="4" fill="#FAF9F7" stroke="#E5E2DC" strokeWidth="0.8" />
                  <text
                    x="185"
                    y="22"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#0E1A2B"
                  >
                    입력 공간: {wallSpaceCm}cm
                  </text>

                  {/* 좌·우 5cm 방열 여유 공간 영역 표시 */}
                  {fitsWall && (
                    <>
                      <rect
                        x={Math.max(28, startX - clearanceScaledW)}
                        y="35"
                        width={clearanceScaledW}
                        height="65"
                        fill="#FFF5F0"
                        stroke="#D9531E"
                        strokeWidth="1"
                        strokeDasharray="3 2"
                      />
                      <rect
                        x={startX + scaledW}
                        y="35"
                        width={clearanceScaledW}
                        height="65"
                        fill="#FFF5F0"
                        stroke="#D9531E"
                        strokeWidth="1"
                        strokeDasharray="3 2"
                      />
                    </>
                  )}

                  {/* 가전 제품 본체 박스 */}
                  <rect
                    x={startX}
                    y="32"
                    width={scaledW}
                    height="70"
                    rx="5"
                    fill={fitsWall ? "#0E1A2B" : "#DC2626"}
                    stroke={fitsWall ? "#182942" : "#991B1B"}
                    strokeWidth="1.5"
                  />

                  {/* 본체 내부 라벨 */}
                  <text
                    x={startX + scaledW / 2}
                    y="62"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#FFFFFF"
                  >
                    가전 약 {productWidthCm}cm
                  </text>
                  <text
                    x={startX + scaledW / 2}
                    y="78"
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="rgba(255,255,255,0.85)"
                  >
                    {fitsWall ? "좌우 방열 여유 확보" : "공간 부족 주의"}
                  </text>

                  {/* 바닥 지지선 */}
                  <line x1="20" y1="105" x2="350" y2="105" stroke="#0E1A2B" strokeWidth="2" />
                </svg>
              );
            })()}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-hb-xs text-[#646E7E]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#0E1A2B]" />
              가전 본체 폭 (약 {productWidthCm}cm)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#FFF5F0] border border-[#D9531E]" />
              권장 좌우 방열 여유 (각 5cm)
            </span>
            <span className="font-medium text-[#0E1A2B]">
              바닥 설치 시 수평 조절 발판 포함
            </span>
          </div>
        </div>

        {/* ── F. 측정 유의사항 & 전화/상담 브릿지 ── */}
        <div className="mt-4 rounded-xl border border-[#FADCD0] bg-[#FFF5F0]/60 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <strong className="block text-hb-xs sm:text-hb-sm font-bold text-[#D9531E]">
                반입 전 필수 확인 안내
              </strong>
              <p className="text-hb-xs text-[#434B59] leading-relaxed break-keep">
                본 계산 결과는 가로폭 기준의 예상치이며, 제품 깊이·손잡이 돌출·엘리베이터 용량·계단 꺾임 구간에 따라 실제 설치 여건이 달라질 수 있습니다.
              </p>
            </div>

            <a
              href={telHref(STORE.tel)}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0E1A2B] px-3.5 py-2 text-hb-xs font-bold text-white hover:bg-[#182942] transition-colors"
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#FF8A50]" />
              <span>설치 여건 유선 문의 ({STORE.tel})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
