// 파일 경로: components/products/v2-spatial-fit-planner.tsx
"use client";

import React, { useState, useMemo } from "react";

export function extractDimensionsFromText(
  title?: string | null,
  description?: string | null
): { widthMm: number | null; depthMm: number | null; heightMm: number | null } {
  const text = `${title || ""}\n${description || ""}`;

  // 1) 1260 x 800 x 1900 형태 추출
  const tripleMatch = text.match(
    /\b(\d{3,4})\s*[x×*]\s*(\d{3,4})\s*[x×*]\s*(\d{3,4})\b/i
  );
  if (tripleMatch) {
    const w = Number(tripleMatch[1]);
    const d = Number(tripleMatch[2]);
    const h = Number(tripleMatch[3]);
    if (w >= 350 && w <= 3000) {
      return { widthMm: w, depthMm: d, heightMm: h };
    }
  }

  // 2) 가로/폭 단일 표기 추출
  const widthMatch = text.match(/(?:가로|폭)\s*[:：]?\s*(\d{3,4})\s*mm/i);
  if (widthMatch) {
    return {
      widthMm: Number(widthMatch[1]),
      depthMm: null,
      heightMm: null,
    };
  }

  // 3) 업소용/가정용 대표 규격 표준 추정치
  if (/45\s*박스/.test(text)) {
    return { widthMm: 1260, depthMm: 800, heightMm: 1900 };
  }
  if (/25\s*박스|30\s*박스/.test(text)) {
    return { widthMm: 650, depthMm: 800, heightMm: 1900 };
  }
  if (/양문형|4\s*도어|비스포크/.test(text)) {
    return { widthMm: 910, depthMm: 850, heightMm: 1830 };
  }

  return { widthMm: null, depthMm: null, heightMm: null };
}

const DOOR_PRESETS = [
  { label: "일반 방문 (800mm)", widthMm: 800 },
  { label: "아파트 현관 (900mm)", widthMm: 900 },
  { label: "상가 단문 (1,000mm)", widthMm: 1000 },
  { label: "상가 양개문 (1,400mm)", widthMm: 1400 },
] as const;

export function V2SpatialFitPlanner({
  title,
  description,
  overrideWidthMm,
}: {
  title?: string | null;
  description?: string | null;
  overrideWidthMm?: number | null;
}) {
  const detected = useMemo(
    () => extractDimensionsFromText(title, description),
    [title, description]
  );

  const productWidth = overrideWidthMm || detected.widthMm || 900;
  const productDepth = detected.depthMm || 750;
  const isEstimated = !overrideWidthMm && !detected.widthMm;

  const [wallWidthMm, setWallWidthMm] = useState<number>(
    Math.max(2000, productWidth + 600)
  );
  const [doorWidthMm, setDoorWidthMm] = useState<number>(900);

  // 방열 및 문열림 권장 여유폭 (양옆 합산 100mm)
  const clearanceMm = 100;
  const requiredTotalWidth = productWidth + clearanceMm;
  const occupyPercent = Math.min(
    100,
    Math.round((productWidth / wallWidthMm) * 100)
  );
  const clearancePercent = Math.min(
    100 - occupyPercent,
    Math.round((clearanceMm / wallWidthMm) * 100)
  );

  const fitsWall = wallWidthMm >= requiredTotalWidth;
  // 반입 시에는 제품의 가로 또는 깊이 중 작은 쪽으로 회전하여 진입 가능
  const minPassSide = Math.min(productWidth, productDepth);
  const fitsDoor = doorWidthMm >= minPassSide + 20;

  return (
    <div className="rounded-xl border border-[#E5E2DC] bg-white p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E2DC] pb-3">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#D9531E]">
            SPATIAL FIT SIMULATOR
          </span>
          <h3 className="text-[14.5px] sm:text-[15.5px] font-extrabold text-[#0E1A2B]">
            📏 우리 집·매장 설치 공간 및 문폭 시뮬레이터
          </h3>
        </div>
        <span className="rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2.5 py-1 text-[11.5px] font-bold text-[#0E1A2B] tabular-nums">
          기준 가로폭: {productWidth.toLocaleString()}mm{" "}
          {isEstimated ? "(표준규격 참고치)" : "(제품 사양 기준)"}
        </span>
      </div>

      {/* 1. 설치 벽면 가로 길이 슬라이더 & 1D 시각 게이지 바 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[12.5px]">
          <label htmlFor="wall-width-range" className="font-bold text-[#0E1A2B]">
            1) 설치할 자리(벽면) 가로 여유 폭 조절
          </label>
          <strong className="font-extrabold text-[#D9531E] tabular-nums">
            내 공간: {wallWidthMm.toLocaleString()}mm ({(wallWidthMm / 1000).toFixed(1)}m)
          </strong>
        </div>

        <input
          id="wall-width-range"
          type="range"
          min={800}
          max={4500}
          step={50}
          value={wallWidthMm}
          onChange={(e) => setWallWidthMm(Number(e.target.value))}
          className="w-full accent-[#0E1A2B] cursor-pointer"
        />

        {/* 시각적 1D 공간 점유 바 */}
        <div className="relative h-9 w-full overflow-hidden rounded-lg border border-[#CFCAC0] bg-[#FAF9F7] flex items-center">
          <div
            style={{ width: `${occupyPercent}%` }}
            className={`h-full flex items-center justify-center text-[11px] font-extrabold text-white transition-all duration-200 ${
              fitsWall ? "bg-[#0E1A2B]" : "bg-red-600"
            }`}
          >
            제품 {productWidth}mm
          </div>
          {clearancePercent > 0 && (
            <div
              style={{ width: `${clearancePercent}%` }}
              className="h-full bg-[#FADCD0] flex items-center justify-center text-[10px] font-bold text-[#B5431A] border-r border-dashed border-[#D9531E]"
              title="양옆 방열 여유 100mm"
            >
              방열 100
            </div>
          )}
          <div className="flex-1 px-2 text-right text-[11px] font-semibold text-[#646E7E] truncate tabular-nums">
            {fitsWall
              ? `남는 여유: ${(wallWidthMm - requiredTotalWidth).toLocaleString()}mm`
              : `폭 부족: ${(requiredTotalWidth - wallWidthMm).toLocaleString()}mm`}
          </div>
        </div>
      </div>

      {/* 2. 출입문 반입 통과 시뮬레이션 */}
      <div className="space-y-2 pt-1">
        <span className="block text-[12.5px] font-bold text-[#0E1A2B]">
          2) 출입구(현관·주방문) 폭 선택 — 반입 통과 여부 확인
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {DOOR_PRESETS.map((d) => {
            const active = doorWidthMm === d.widthMm;
            return (
              <button
                key={d.label}
                type="button"
                onClick={() => setDoorWidthMm(d.widthMm)}
                className={`rounded-lg border px-2.5 py-2 text-[11.5px] font-bold transition-colors ${
                  active
                    ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                    : "border-[#E5E2DC] bg-[#FAF9F7] text-[#3E4756] hover:border-[#0E1A2B]"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        <div
          className={`rounded-lg border px-3.5 py-2.5 text-[12.5px] flex items-center justify-between gap-2 ${
            fitsWall && fitsDoor
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-300 bg-amber-50 text-amber-950"
          }`}
        >
          <span>
            {fitsWall && fitsDoor ? (
              <>
                ✅ <strong>설치 공간 및 출입문 반입 여유 충분:</strong> 양옆 방열 공간(100mm)을 포함해 안정적인 배치가 가능합니다.
              </>
            ) : !fitsWall ? (
              <>
                ⚠️ <strong>설치 자리 폭 확인 필요:</strong> 방열 여유를 포함해 최소{" "}
                <strong>{requiredTotalWidth.toLocaleString()}mm</strong> 이상의 가로 공간이 권장됩니다.
              </>
            ) : (
              <>
                ⚠️ <strong>출입문 통과 확인 필요:</strong> 도어 탈거 반입이나 창문(사다리차) 진입 여부는 문의 시 알려주시면 안내해 드립니다.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
