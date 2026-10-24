// 파일 경로: components/products/v2-spatial-fit-planner.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Icon, ICON } from "../../lib/ui";

function parseDimensionsFromText(text: string): {
  widthMm: number;
  depthMm: number | null;
  heightMm: number | null;
  isEstimated: boolean;
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
      return { widthMm: w, depthMm: d, heightMm: h, isEstimated: false };
    }
  }

  // 2) 가로/폭 단독 표기
  const widthMatch = text.match(/(?:가로|폭)\s*[:：]?\s*(\d{3,4})\s*mm/i);
  if (widthMatch) {
    const w = Number(widthMatch[1]);
    if (w >= 350 && w <= 3000) {
      return { widthMm: w, depthMm: null, heightMm: null, isEstimated: false };
    }
  }

  // 3) 품목 키워드 기반 표준 참고 치수 (실측 아님 명시)
  if (/45\s*박스/.test(text)) {
    return { widthMm: 1260, depthMm: 800, heightMm: 1900, isEstimated: true };
  }
  if (/25\s*박스|30\s*박스/.test(text)) {
    return { widthMm: 650, depthMm: 800, heightMm: 1900, isEstimated: true };
  }
  if (/테이블\s*냉장|작업대/.test(text)) {
    return { widthMm: 1200, depthMm: 700, heightMm: 850, isEstimated: true };
  }
  if (/양문형|비스포크|오브제|8\d\d\s*L/i.test(text)) {
    return { widthMm: 912, depthMm: 910, heightMm: 1850, isEstimated: true };
  }
  if (/일반\s*냉장고|소형\s*냉장고|원룸/.test(text)) {
    return { widthMm: 555, depthMm: 635, heightMm: 1445, isEstimated: true };
  }
  if (/드럼|건조기|워시타워/.test(text)) {
    return { widthMm: 700, depthMm: 770, heightMm: 990, isEstimated: true };
  }

  return { widthMm: 900, depthMm: 750, heightMm: null, isEstimated: true };
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
  const combinedText = `${title || ""}\n${description || ""}`;
  const parsed = useMemo(
    () => parseDimensionsFromText(combinedText),
    [combinedText]
  );

  const productWidthMm =
    overrideWidthMm && overrideWidthMm > 0 ? overrideWidthMm : parsed.widthMm;
  const clearanceTotalMm = 100; // 양옆 방열 및 여유 공간 50mm x 2
  const requiredSpaceMm = productWidthMm + clearanceTotalMm;

  const [wallSpaceMm, setWallSpaceMm] = useState<number>(() =>
    Math.min(5000, Math.max(1200, Math.ceil((requiredSpaceMm + 300) / 100) * 100))
  );
  const [doorWidthMm, setDoorWidthMm] = useState<number>(800);

  const spaceRatioPct = Math.min(
    100,
    Math.round((productWidthMm / wallSpaceMm) * 100)
  );
  const clearanceRatioPct = Math.min(
    100 - spaceRatioPct,
    Math.round((clearanceTotalMm / wallSpaceMm) * 100)
  );

  const fitsWall = wallSpaceMm >= requiredSpaceMm;
  const minPassSideMm = parsed.depthMm
    ? Math.min(productWidthMm, parsed.depthMm)
    : productWidthMm;
  const fitsDoor = doorWidthMm >= minPassSideMm + 30;

  return (
    <div
      className={`flex h-full flex-col justify-between rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-6 shadow-2xs ${className}`}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#E5E2DC]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2 py-0.5 text-hb-xs font-bold text-[#0E1A2B]">
                설치 공간 시뮬레이터
              </span>
              <span
                className={`rounded px-2 py-0.5 text-hb-xs font-bold ${
                  !overrideWidthMm && parsed.isEstimated
                    ? "bg-[#FFF5F0] border border-[#FED7AA] text-[#D9531E]"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                }`}
              >
                {!overrideWidthMm && parsed.isEstimated
                  ? "표준 참고치 (실측 아님)"
                  : "상세 설명 표기 치수"}
              </span>
            </div>
            <h3 className="mt-1.5 text-hb-lg font-bold text-[#0E1A2B]">
              우리 집·매장 설치 공간 &amp; 출입문 통과 계산기
            </h3>
          </div>

          <div className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] px-3 py-1.5 text-right tabular-nums">
            <span className="block text-hb-xs font-semibold text-[#646E7E]">
              {overrideWidthMm
                ? "선택 매물 합산 폭"
                : parsed.isEstimated
                ? "카테고리 표준 참고폭"
                : "확인된 제품 가로폭"}
            </span>
            <strong className="text-hb-sm font-extrabold text-[#0E1A2B]">
              {productWidthMm.toLocaleString()}mm{" "}
              <span className="text-hb-xs font-medium text-[#646E7E]">
                ({(productWidthMm / 10).toFixed(0)}cm)
              </span>
            </strong>
          </div>
        </div>

        {/* 표준 참고치 안내 배너 (추정값일 때 명확히 고지) */}
        {!overrideWidthMm && parsed.isEstimated && (
          <div className="mt-3 rounded-lg border border-[#FED7AA] bg-[#FFF5F0] px-3.5 py-2 text-hb-xs text-[#434B59] leading-snug break-keep">
            <strong className="font-bold text-[#D9531E]">참고 안내:</strong> 상세 설명에 가로 치수가 별도 기재되지 않아 동일 품목의{" "}
            <strong className="text-[#0E1A2B]">일반 표준 참고폭({productWidthMm}mm)</strong>으로 시뮬레이션합니다. 정확한 실측 규격은 전화·카톡 상담으로 확인해 주세요.
          </div>
        )}

        {/* 컨트롤 1: 설치할 벽면 여유 폭 슬라이더 */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-3.5">
            <div className="flex items-center justify-between text-hb-xs font-bold">
              <label htmlFor="wall-space-range" className="text-[#0E1A2B]">
                1. 설치할 벽면 가로 폭 조절
              </label>
              <span className="text-[#D9531E] tabular-nums">
                {wallSpaceMm.toLocaleString()}mm ({(wallSpaceMm / 1000).toFixed(2)}m)
              </span>
            </div>
            <input
              id="wall-space-range"
              type="range"
              min={600}
              max={4000}
              step={50}
              value={wallSpaceMm}
              onChange={(e) => setWallSpaceMm(Number(e.target.value))}
              className="mt-2.5 w-full accent-[#0E1A2B] cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-hb-xs text-[#646E7E] tabular-nums">
              <span>60cm (좁은 틈새)</span>
              <span>200cm (일반 거실/주방)</span>
              <span>400cm (대형 주방)</span>
            </div>
          </div>

          {/* 컨트롤 2: 현관문 / 주방 출입구 폭 선택 */}
          <div className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-3.5">
            <div className="flex items-center justify-between text-hb-xs font-bold mb-2">
              <span className="text-[#0E1A2B]">2. 출입문(현관·방문) 유효 폭</span>
              <span className="text-[#434B59] tabular-nums">
                선택: {doorWidthMm}mm ({doorWidthMm / 10}cm)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { mm: 700, label: "70cm(좁은문)" },
                { mm: 800, label: "80cm(일반문)" },
                { mm: 900, label: "90cm(현관문)" },
                { mm: 1100, label: "110cm+(양개문)" },
              ].map((d) => {
                const active = doorWidthMm === d.mm;
                return (
                  <button
                    key={d.mm}
                    type="button"
                    onClick={() => setDoorWidthMm(d.mm)}
                    className={`rounded-md py-1.5 px-1 text-hb-xs font-bold border transition-colors cursor-pointer ${
                      active
                        ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                        : "border-[#D7D2C8] bg-white text-[#434B59] hover:border-[#0E1A2B]"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 시각적 가구/가전 배치 게이지 바 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-hb-xs font-semibold text-[#434B59] mb-1.5">
            <span>
              벽면 점유 시뮬레이션 (권장 방열 여유폭 +100mm 포함 총{" "}
              <strong className="text-[#0E1A2B] tabular-nums">
                {requiredSpaceMm.toLocaleString()}mm
              </strong>{" "}
              필요)
            </span>
            <span
              className={`font-bold ${
                fitsWall ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {fitsWall
                ? `여유 공간 +${(wallSpaceMm - requiredSpaceMm).toLocaleString()}mm`
                : `폭 ${(requiredSpaceMm - wallSpaceMm).toLocaleString()}mm 부족`}
            </span>
          </div>

          <div className="relative h-9 w-full overflow-hidden rounded-lg border border-[#D7D2C8] bg-[#F3F1EC] flex items-center">
            <div
              style={{ width: `${spaceRatioPct}%` }}
              className={`h-full flex items-center justify-center text-hb-xs font-bold text-white transition-all duration-200 ${
                fitsWall ? "bg-[#0E1A2B]" : "bg-red-600"
              }`}
            >
              <span className="truncate px-2 tabular-nums">
                {!overrideWidthMm && parsed.isEstimated ? "참고폭" : "제품"}{" "}
                {productWidthMm}mm ({spaceRatioPct}%)
              </span>
            </div>
            {fitsWall && clearanceRatioPct > 0 && (
              <div
                style={{ width: `${clearanceRatioPct}%` }}
                className="h-full bg-[#D9531E]/25 border-r border-dashed border-[#D9531E] flex items-center justify-center text-hb-xs font-bold text-[#D9531E] overflow-hidden"
                title="양옆 방열 및 문열림 여유 공간 100mm"
              >
                <span className="truncate px-1">+10cm</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 판정 요약 바 */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-hb-xs">
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${
            fitsWall
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <Icon
            d={fitsWall ? ICON.check : ICON.close}
            className={`w-4 h-4 shrink-0 ${
              fitsWall ? "text-emerald-700" : "text-red-600"
            }`}
          />
          <span>
            <strong>벽면 배치:</strong>{" "}
            {fitsWall
              ? "설치 공간 여유가 충분합니다."
              : "설치할 벽면 가로 폭이 좁아 상담이 필요합니다."}
          </span>
        </div>

        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${
            fitsDoor
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          <Icon
            d={fitsDoor ? ICON.check : ICON.bell}
            className={`w-4 h-4 shrink-0 ${
              fitsDoor ? "text-emerald-700" : "text-[#D9531E]"
            }`}
          />
          <span>
            <strong>출입문 반입:</strong>{" "}
            {fitsDoor
              ? `최소 진입폭(약 ${minPassSideMm}mm) 통과 가능 예상`
              : "도어 탈거 반입 또는 사다리차 여건 확인 필요"}
          </span>
        </div>
      </div>
    </div>
  );
}
