// 파일 경로: components/showroom/directions-vector-svg.tsx
"use client";

import React, { useId } from "react";
import { STORE } from "../../lib/site";
import type { DirectionRouteId } from "../../lib/store-directions";

export interface DirectionsVectorSvgProps {
  activeRoute: DirectionRouteId;
  highlightedStep?: number | null;
  onSelectStep?: (stepIndex: number) => void;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  className?: string;
}

/**
 * 한밭중고전자 오프라인 매장(대전광역시 중구 대전천서로 691-62 · 중촌동 144)
 * 실제 네이버 지도 실측 지형 1:1 정밀 반영 건축·에디토리얼 약도 SVG
 * - 대종로·중촌고가교 완만한 곡선 + 호남선 곡선 철로 + 대전선(공사중) 평행선
 * - 한남로(이마트24) ↔ 대전천서로 ↔ 주공하나마트 옆 골목 진입(01) ↔ 중촌사회복지관 직진(02) ↔ 중촌고가교 밑 매장 도착(03)
 */
export function DirectionsVectorSvg({
  activeRoute,
  highlightedStep = null,
  onSelectStep,
  svgRef,
  className = "w-full h-auto block",
}: DirectionsVectorSvgProps) {
  const uid = useId().replace(/:/g, "");
  const arrowId = `hb-dir-arrow-${uid}`;
  const photoClipId = `hb-photo-clip-${uid}`;
  const cardShadowId = `hb-card-shadow-${uid}`;
  const overpassShadowId = `hb-overpass-shadow-${uid}`;
  const pinShadowId = `hb-pin-shadow-${uid}`;
  const gridPatternId = `hb-grid-pattern-${uid}`;
  const routeGradId = `hb-route-grad-${uid}`;

  const isNorth = activeRoute === "north";
  const isSouth = activeRoute === "south";
  const isAll = activeRoute === "all";

  const interactive = typeof onSelectStep === "function";

  const renderStepNode = (
    stepIndex: number,
    cx: number,
    cy: number,
    label: string,
    accentFill: string,
    ariaTitle: string
  ) => {
    const isHot = highlightedStep === stepIndex;
    return (
      <g
        key={label}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={
          interactive
            ? `STEP ${label} 현장 사진 크게 보기: ${ariaTitle}`
            : undefined
        }
        onClick={
          interactive
            ? (e) => {
                e.stopPropagation();
                onSelectStep(stepIndex);
              }
            : undefined
        }
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectStep(stepIndex);
                }
              }
            : undefined
        }
        className={interactive ? "cursor-pointer outline-none" : undefined}
      >
        <circle
          cx={cx}
          cy={cy}
          r={isHot ? 20 : 15.5}
          fill={accentFill}
          fillOpacity={isHot ? 0.22 : 0.12}
        />
        <circle
          cx={cx}
          cy={cy}
          r={isHot ? 13.5 : 12}
          fill={accentFill}
          stroke="#FFFFFF"
          strokeWidth={isHot ? 3 : 2.4}
          filter={`url(#${pinShadowId})`}
        />
        <text
          x={cx}
          y={cy + 3.8}
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="10.2"
          fontWeight="800"
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 840 490"
      role="img"
      aria-label={`${STORE.name} 오시는 길 약도 — 대전천서로 주공하나마트 옆 골목 끝까지 직진, 중촌고가교 밑 (${STORE.roadAddress})`}
      className={className}
    >
      <defs>
        {/* 미세 건축 격자 패턴 */}
        <pattern
          id={gridPatternId}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="#E4E0D5"
            strokeWidth="0.7"
            strokeOpacity="0.52"
          />
        </pattern>

        {/* 경로 방향 그라디언트 */}
        <linearGradient id={routeGradId} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="65%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#1D4E89" />
        </linearGradient>

        {/* 정밀 경로 화살표 마커 */}
        <marker
          id={arrowId}
          viewBox="0 0 14 14"
          refX="9.5"
          refY="7"
          markerWidth="7.5"
          markerHeight="7.5"
          orient="auto-start-reverse"
        >
          <path
            d="M 1.5 1.8 L 12 7 L 1.5 12.2 L 4 7 Z"
            fill="#1D4ED8"
            stroke="#FFFFFF"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
        </marker>

        <clipPath id={photoClipId}>
          <rect x="24" y="22" width="204" height="94" rx="8" />
        </clipPath>

        <filter id={cardShadowId} x="-14%" y="-14%" width="128%" height="134%">
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="8"
            floodColor="#141A23"
            floodOpacity="0.14"
          />
        </filter>

        <filter
          id={overpassShadowId}
          x="-10%"
          y="-10%"
          width="124%"
          height="128%"
        >
          <feDropShadow
            dx="3"
            dy="6"
            stdDeviation="4"
            floodColor="#141A23"
            floodOpacity="0.17"
          />
        </filter>

        <filter id={pinShadowId} x="-35%" y="-25%" width="170%" height="175%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="2.5"
            floodColor="#141A23"
            floodOpacity="0.24"
          />
        </filter>
      </defs>

      {/* 1. 웜 에디토리얼 스톤 지도 캔버스 + 미세 격자 */}
      <rect x="0" y="0" width="840" height="490" fill="#F3F1EC" />
      <rect
        x="0"
        y="0"
        width="840"
        height="490"
        fill={`url(#${gridPatternId})`}
      />

      {/* 2. 실제 지형 기반 도시 필지 · 녹지 · 아파트 단지 블록 */}
      <g>
        {/* 서측(대종로 남측 · 리틀야구장 방향) 완만한 녹지대 */}
        <path
          d="M 0 232 Q 74 268, 128 314 L 58 490 L 0 490 Z"
          fill="#E1ECE0"
        />

        {/* 중촌역푸르지오 센터파크 대단지 (호남선 동측 ~ 대전천서로 서측, 상단) */}
        <path
          d="M 336 0 L 582 0 L 604 108 L 548 156 L 424 196 L 392 260 L 316 306 L 236 250 Z"
          fill="#EAE7DF"
          stroke="#DFDBD0"
          strokeWidth="1"
        />
        {/* 푸르지오 단지 동 실루엣 */}
        <g fill="#E0DCD2">
          <rect x="378" y="24" width="38" height="14" rx="2" transform="rotate(-14 378 24)" />
          <rect x="442" y="18" width="40" height="14" rx="2" transform="rotate(-14 442 18)" />
          <rect x="352" y="76" width="36" height="14" rx="2" transform="rotate(-14 352 76)" />
          <rect x="412" y="120" width="38" height="14" rx="2" transform="rotate(-14 412 120)" />
          <rect x="318" y="168" width="38" height="14" rx="2" transform="rotate(-14 318 168)" />
          <rect x="364" y="196" width="38" height="14" rx="2" transform="rotate(-14 364 196)" />
        </g>

        {/* 이마트24 (한남로 북서측 단지 초입) */}
        <rect
          x="530"
          y="72"
          width="44"
          height="26"
          rx="4"
          fill="#EFE9DC"
          stroke="#DDD3BE"
          strokeWidth="1"
          transform="rotate(-24 552 85)"
        />

        {/* 중촌주공2단지아파트 (기울어진 직사각 블록 · 201~204동) */}
        <polygon
          points="430,192 612,140 648,284 472,334"
          fill="#EAE7DF"
          stroke="#DFDBD0"
          strokeWidth="1"
        />
        {/* 주공2단지 201~204동 실루엣 */}
        <g fill="#E0DCD2">
          <rect x="462" y="196" width="54" height="14" rx="2" transform="rotate(-16 462 196)" />
          <rect x="536" y="174" width="54" height="14" rx="2" transform="rotate(-16 536 174)" />
          <rect x="476" y="250" width="54" height="14" rx="2" transform="rotate(-16 476 250)" />
          <rect x="550" y="226" width="50" height="14" rx="2" transform="rotate(-16 550 226)" />
        </g>

        {/* 주공하나마트 상가 (중촌주공2단지 남동 모서리 · 골목 입구 바로 옆) */}
        <rect
          x="568"
          y="252"
          width="58"
          height="32"
          rx="4"
          fill="#EFE7D6"
          stroke="#D7C39B"
          strokeWidth="1.2"
          transform="rotate(-16 597 268)"
        />

        {/* 중촌사회복지관 (중촌주공2단지 남서 모서리 · 골목 중앙 북측) */}
        <rect
          x="496"
          y="286"
          width="54"
          height="26"
          rx="4"
          fill="#E4E8EE"
          stroke="#CBD4E1"
          strokeWidth="1"
          transform="rotate(-16 523 299)"
        />

        {/* 백제타운 종합상가 (매장 바로 북측 · 호남선 동측) */}
        <rect
          x="294"
          y="270"
          width="66"
          height="32"
          rx="4"
          fill="#EFE9DC"
          stroke="#DDD3BE"
          strokeWidth="1.1"
          transform="rotate(-14 327 286)"
        />

        {/* 대전지방법원 차량보관소 부지 (중촌고가교 서남측 · 호남선 동측) */}
        <polygon
          points="154,368 232,398 202,464 128,452"
          fill="#EAE7DF"
          stroke="#DFDBD0"
          strokeWidth="1"
        />

        {/* 어덕마을 주거지 블록 (대전선·어덕마을로 남측) */}
        <polygon
          points="418,424 510,398 548,490 456,490"
          fill="#EAE7DF"
          stroke="#DFDBD0"
          strokeWidth="1"
        />
        <polygon
          points="596,368 666,348 706,490 634,490"
          fill="#EAE7DF"
          stroke="#DFDBD0"
          strokeWidth="1"
        />

        {/* 무릉어린이공원 (남측 하단 녹지) */}
        <polygon
          points="542,456 592,442 612,486 560,490"
          fill="#D9E7DA"
          stroke="#C2D8C4"
          strokeWidth="1"
        />
        <g fill="#B6D1B9" opacity="0.88">
          <circle cx="566" cy="466" r="5" />
          <circle cx="586" cy="460" r="4.5" />
        </g>

        {/* 대전천 동편 도시 블록 */}
        <polygon
          points="774,0 840,0 840,490 824,490"
          fill="#EAE7DF"
          stroke="#DFDBD0"
          strokeWidth="1"
        />
      </g>

      {/* 3. 대전천 수변 둔치 + 수계 (실제 네이버 지도 우측 NNW → SSE 직선 흐름) */}
      <g>
        {/* 둔치 녹지대 */}
        <path
          d="M 632 0 L 684 240 L 748 490 L 826 490 L 764 240 L 716 0 Z"
          fill="#E2ECE4"
        />
        {/* 본류 수로 */}
        <path
          d="M 652 0 L 702 240 L 766 490 L 806 490 L 742 240 L 692 0 Z"
          fill="#C5E0F4"
        />
        {/* 중앙 수면 하이라이트 */}
        <path
          d="M 666 0 L 716 240 L 780 490 L 792 490 L 728 240 L 678 0 Z"
          fill="#D6EAFA"
        />
        {/* 유속 라인 */}
        <path
          d="M 672 18 L 722 240 L 786 474"
          fill="none"
          stroke="#9CC6E8"
          strokeWidth="1.5"
          strokeDasharray="10 14"
          strokeLinecap="round"
        />
      </g>

      {/* 4. 철도망 (실제 호남선 완만한 곡선 + 골목 바로 아래 대전선) */}
      <g fill="none">
        {/* 호남선 본선 (실제 네이버 지도 곡률 1:1) */}
        <path
          d="M 332 0 Q 252 164, 188 308 T 106 490"
          stroke="#CBD2DC"
          strokeWidth="9"
        />
        <path
          d="M 332 0 Q 252 164, 188 308 T 106 490"
          stroke="#7E8C9E"
          strokeWidth="4.4"
        />
        <path
          d="M 332 0 Q 252 164, 188 308 T 106 490"
          stroke="#F8FAFC"
          strokeWidth="2.2"
          strokeDasharray="7 7"
        />

        {/* 대전선(공사중) — 골목 바로 남측 평행 통과 후 중촌고가교 밑으로 서남향 곡선 */}
        <path
          d="M 840 248 L 656 298 L 324 392 Q 254 416 154 490"
          stroke="#D4D9E1"
          strokeWidth="5.8"
        />
        <path
          d="M 840 248 L 656 298 L 324 392 Q 254 416 154 490"
          stroke="#8E9BAE"
          strokeWidth="2.3"
          strokeDasharray="6 6"
        />
      </g>

      {/* 5. 실제 도로망 (1차 외곽 케이싱 → 2차 순백 노면 → 3차 중앙선) */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* 5-A. 도로 외곽 케이싱 */}
        <g stroke="#D5D0C5">
          {/* 대전천북로 (우측 동편 도로) */}
          <path d="M 780 0 L 840 250" strokeWidth="16" />
          {/* 대전천서쪽자전거길 (하천변 보조길) */}
          <path d="M 656 106 L 748 490" strokeWidth="9" />

          {/* 중촌주공2단지 · 푸르지오 사이 도로 및 내부 진입로 */}
          <path d="M 618 122 L 424 188" strokeWidth="14" />
          <path d="M 428 188 L 474 338" strokeWidth="13" />
          {/* 푸르지오 서남측 · 백제타운 앞 연결길 */}
          <path d="M 262 288 Q 320 330 374 366" strokeWidth="12" />
          {/* 대전지방법원 차량보관소 진입 지선 */}
          <path d="M 218 338 L 166 400" strokeWidth="11" />

          {/* 어덕마을로 (대전선 바로 남측 평행 후 중촌고가교 밑으로 완만하게 합류) */}
          <path
            d="M 670 338 L 450 402 Q 376 420 326 392"
            strokeWidth="16"
          />
          <path d="M 480 394 L 542 490" strokeWidth="12" />
          <path d="M 584 364 L 628 490" strokeWidth="12" />

          {/* 대전천서로 (실제 NNW → SSE 직선 주간선) */}
          <path d="M 586 0 L 618 122 L 654 290 L 714 490" strokeWidth="29" />

          {/* 한남로 (우상단 대각선 간선 — 대전천 교량 횡단) */}
          <path d="M 792 0 L 618 122 L 568 156" strokeWidth="29" />

          {/* 핵심 진입 골목길 (주공하나마트 옆 입구 → 중촌사회복지관 앞 → 중촌고가교 밑 매장) */}
          <path d="M 654 290 L 322 382" strokeWidth="21" />
        </g>

        {/* 한밭중고전자 매장 앞 전용 주차 광장 에이프런 (백제타운 남측 ~ 고가교 북동측) */}
        <polygon
          points="266,326 346,304 370,368 294,390"
          fill="#FAF8F3"
          stroke="#D5D0C5"
          strokeWidth="1.4"
        />
        {/* 주차 구획선 */}
        <g stroke="#D9D5CA" strokeWidth="1.1">
          <line x1="330" y1="316" x2="338" y2="332" />
          <line x1="342" y1="312" x2="350" y2="328" />
          <line x1="354" y1="308" x2="362" y2="324" />
        </g>

        {/* 5-B. 도로 순백 노면 */}
        <g stroke="#FFFFFF">
          <path d="M 780 0 L 840 250" strokeWidth="13.5" />
          <path d="M 656 106 L 748 490" strokeWidth="6.5" stroke="#FAF9F5" />
          <path d="M 618 122 L 424 188" strokeWidth="11.5" />
          <path d="M 428 188 L 474 338" strokeWidth="10.5" />
          <path d="M 262 288 Q 320 330 374 366" strokeWidth="9.5" />
          <path d="M 218 338 L 166 400" strokeWidth="8.5" />
          <path
            d="M 670 338 L 450 402 Q 376 420 326 392"
            strokeWidth="13.5"
          />
          <path d="M 480 394 L 542 490" strokeWidth="9.5" />
          <path d="M 584 364 L 628 490" strokeWidth="9.5" />
          <path d="M 586 0 L 618 122 L 654 290 L 714 490" strokeWidth="26" />
          <path d="M 792 0 L 618 122 L 568 156" strokeWidth="26" />
          <path d="M 654 290 L 322 382" strokeWidth="18.5" />
        </g>

        {/* 5-C. 주간선 미세 중앙선 */}
        <g stroke="#DFE3EA" strokeWidth="1.2" strokeDasharray="8 9">
          <path d="M 586 0 L 618 122 L 654 290 L 714 490" />
          <path d="M 784 6 L 624 118" />
        </g>

        {/* 한남로 대전천 교량 난간 */}
        <g stroke="#94A3B8" strokeWidth="2.3" strokeLinecap="butt">
          <line x1="666" y1="71" x2="726" y2="29" />
          <line x1="680" y1="93" x2="740" y2="51" />
        </g>

        {/* 4.5m 철교 교량 덱 (대전선이 대전천서로 위를 통과 — 01단계 랜드마크) */}
        <g>
          <path
            d="M 638 303 L 678 292"
            stroke="#94A3B8"
            strokeWidth="9.5"
            strokeLinecap="butt"
          />
          <path
            d="M 638 303 L 678 292"
            stroke="#E2E8F0"
            strokeWidth="5.5"
            strokeLinecap="butt"
          />
        </g>
      </g>

      {/* 6. 대종로 → 중촌고가교 (실제 완만한 S-곡선 고가도로 + 초록색 철제 외곽 거더) */}
      <g filter={`url(#${overpassShadowId})`}>
        {/* 실제 현장 초록색 강재 난간 엣지 */}
        <path
          d="M -8 208 Q 140 264, 240 348 T 386 496"
          fill="none"
          stroke="#2E6F4E"
          strokeWidth="31"
          strokeLinecap="butt"
        />
        {/* 고가교 콘크리트 상판 */}
        <path
          d="M -8 208 Q 140 264, 240 348 T 386 496"
          fill="none"
          stroke="#FAFAF7"
          strokeWidth="24.5"
          strokeLinecap="butt"
        />
        {/* 고가교 중앙 분리선 */}
        <path
          d="M -8 208 Q 140 264, 240 348 T 386 496"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="1.5"
          strokeDasharray="9 8"
        />
      </g>

      {/* 7. 방면별 진입 동선 (3D 사진 속 코발트 블루 화살표와 톤 통일) */}
      {isAll && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 756 26 L 626 116 Q 618 122 621 134 L 649 270"
            stroke="#94A3B8"
            strokeWidth="2.3"
            strokeDasharray="5 6"
            opacity="0.72"
          />
          <path
            d="M 706 462 L 660 314"
            stroke="#94A3B8"
            strokeWidth="2.3"
            strokeDasharray="5 6"
            opacity="0.72"
          />
        </g>
      )}

      {/* 메인 네비게이션 경로 */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {isAll && (
          <>
            <path
              d="M 654 290 L 344 376"
              stroke="#2563EB"
              strokeWidth="12.5"
              strokeOpacity="0.14"
            />
            <path
              d="M 654 290 L 344 376"
              stroke="#FFFFFF"
              strokeWidth="8.2"
            />
            <path
              d="M 654 290 L 344 376"
              stroke={`url(#${routeGradId})`}
              strokeWidth="5"
              markerEnd={`url(#${arrowId})`}
            />
          </>
        )}

        {isNorth && (
          <>
            <path
              d="M 756 26 L 626 116 Q 618 122 621 134 L 651 276 Q 654 290 638 294 L 344 376"
              stroke="#2563EB"
              strokeWidth="12.5"
              strokeOpacity="0.14"
            />
            <path
              d="M 756 26 L 626 116 Q 618 122 621 134 L 651 276 Q 654 290 638 294 L 344 376"
              stroke="#FFFFFF"
              strokeWidth="8.2"
            />
            <path
              d="M 756 26 L 626 116 Q 618 122 621 134 L 651 276 Q 654 290 638 294 L 344 376"
              stroke={`url(#${routeGradId})`}
              strokeWidth="5"
              markerEnd={`url(#${arrowId})`}
            />
          </>
        )}

        {isSouth && (
          <>
            <path
              d="M 706 462 L 659 306 Q 654 290 638 294 L 344 376"
              stroke="#2563EB"
              strokeWidth="12.5"
              strokeOpacity="0.14"
            />
            <path
              d="M 706 462 L 659 306 Q 654 290 638 294 L 344 376"
              stroke="#FFFFFF"
              strokeWidth="8.2"
            />
            <path
              d="M 706 462 L 659 306 Q 654 290 638 294 L 344 376"
              stroke={`url(#${routeGradId})`}
              strokeWidth="5"
              markerEnd={`url(#${arrowId})`}
            />
          </>
        )}

        {/* 골목 직진 방향 화이트 쉐브론 */}
        <g
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 578 307 L 570 313 L 580 315.5" />
          <path d="M 426 349 L 418 355 L 428 357.5" />
        </g>
      </g>

      {/* 8. 실제 네이버 지도 랜드마크 · 도로명 · 하천 표기 (3계층 헤일로) */}
      <g
        fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
        paintOrder="stroke"
      >
        {/* 도로명 · 수계 */}
        <text
          x="690"
          y="58"
          textAnchor="middle"
          fill={isNorth ? "#C84312" : "#475569"}
          stroke="#F3F1EC"
          strokeWidth="4"
          fontSize="11.5"
          fontWeight="800"
          transform="rotate(-35 690 58)"
        >
          한남로 · 오정동 ↗
        </text>

        <text
          x="634"
          y="200"
          textAnchor="middle"
          fill="#1D4E89"
          stroke="#FFFFFF"
          strokeWidth="4"
          fontSize="11.5"
          fontWeight="800"
          transform="rotate(77 634 200)"
        >
          대전천서로
        </text>

        <text
          x="702"
          y="138"
          textAnchor="middle"
          fill="#2E6DA4"
          fontSize="11.5"
          fontWeight="700"
          letterSpacing="0.16em"
        >
          대전천
        </text>
        <text
          x="768"
          y="428"
          textAnchor="middle"
          fill="#2E6DA4"
          fontSize="11.5"
          fontWeight="700"
          letterSpacing="0.16em"
        >
          대전천
        </text>

        <text
          x="62"
          y="236"
          textAnchor="middle"
          fill="#475569"
          stroke="#FAFAF7"
          strokeWidth="3.5"
          fontSize="10.5"
          fontWeight="700"
          transform="rotate(22 62 236)"
        >
          대종로
        </text>

        <text
          x="244"
          y="358"
          textAnchor="middle"
          fill="#1F4D36"
          stroke="#FAFAF7"
          strokeWidth="3.5"
          fontSize="11.5"
          fontWeight="800"
          transform="rotate(41 244 358)"
        >
          중촌고가교 (초록 고가)
        </text>

        <text
          x="234"
          y="204"
          textAnchor="middle"
          fill="#64748B"
          stroke="#F3F1EC"
          strokeWidth="3.5"
          fontSize="10"
          fontWeight="700"
          transform="rotate(-64 234 204)"
        >
          호남선
        </text>

        <text
          x="496"
          y="393"
          textAnchor="middle"
          fill="#64748B"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          fontSize="10.2"
          fontWeight="700"
          transform="rotate(-16 496 393)"
        >
          어덕마을로
        </text>

        <text
          x="576"
          y="474"
          textAnchor="middle"
          fill="#3E6149"
          stroke="#D9E7DA"
          strokeWidth="3"
          fontSize="10"
          fontWeight="700"
        >
          무릉어린이공원
        </text>

        {/* 주변 실제 랜드마크 */}
        <circle cx="552" cy="84" r="3" fill="#B47B15" />
        <text
          x="552"
          y="72"
          textAnchor="middle"
          fill="#475569"
          stroke="#F3F1EC"
          strokeWidth="3.5"
          fontSize="10.5"
          fontWeight="700"
        >
          이마트24
        </text>

        <circle cx="430" cy="108" r="3.2" fill="#64748B" />
        <text
          x="430"
          y="96"
          textAnchor="middle"
          fill="#334155"
          stroke="#EAE7DF"
          strokeWidth="3.8"
          fontSize="11.5"
          fontWeight="700"
        >
          중촌역푸르지오
        </text>

        <circle cx="518" cy="232" r="3.2" fill="#475569" />
        <text
          x="518"
          y="221"
          textAnchor="middle"
          fill="#1E293B"
          stroke="#EAE7DF"
          strokeWidth="4"
          fontSize="12"
          fontWeight="800"
        >
          중촌주공2단지
        </text>

        <circle cx="596" cy="268" r="3.6" fill="#B47B15" />
        <text
          x="592"
          y="254"
          textAnchor="middle"
          fill="#141A23"
          stroke="#EAE7DF"
          strokeWidth="4"
          fontSize="12"
          fontWeight="800"
        >
          주공하나마트
        </text>

        <circle cx="523" cy="298" r="3.2" fill="#1D4E89" />
        <text
          x="523"
          y="286"
          textAnchor="middle"
          fill="#1E293B"
          stroke="#EAE7DF"
          strokeWidth="3.8"
          fontSize="11"
          fontWeight="800"
        >
          중촌사회복지관
        </text>

        <circle cx="327" cy="285" r="3.2" fill="#B47B15" />
        <text
          x="327"
          y="272"
          textAnchor="middle"
          fill="#1E293B"
          stroke="#EAE7DF"
          strokeWidth="3.8"
          fontSize="11.2"
          fontWeight="800"
        >
          백제타운 종합상가
        </text>

        <text
          x="654"
          y="330"
          textAnchor="end"
          fill="#475569"
          stroke="#F3F1EC"
          strokeWidth="3.5"
          fontSize="10.2"
          fontWeight="700"
        >
          중촌동거리미술관
        </text>

        <circle cx="176" cy="408" r="3" fill="#64748B" />
        <text
          x="176"
          y="424"
          textAnchor="middle"
          fill="#475569"
          stroke="#EAE7DF"
          strokeWidth="3"
          fontSize="10.2"
          fontWeight="700"
        >
          대전지방법원
        </text>
        <text
          x="176"
          y="438"
          textAnchor="middle"
          fill="#475569"
          stroke="#EAE7DF"
          strokeWidth="3"
          fontSize="10.2"
          fontWeight="700"
        >
          차량보관소
        </text>

        <text
          x="706"
          y="474"
          textAnchor="middle"
          fill={isSouth ? "#C84312" : "#475569"}
          stroke="#F3F1EC"
          strokeWidth="4"
          fontSize="11.5"
          fontWeight="800"
        >
          선화동 · 중앙로 ↓
        </text>
      </g>

      {/* 9. 정밀 콜아웃: 01 골목 진입 + 02 직진 거리 안내 */}
      <g filter={`url(#${cardShadowId})`}>
        <rect
          x="672"
          y="214"
          width="156"
          height="50"
          rx="10"
          fill="#FFFFFF"
          stroke={highlightedStep === 0 ? "#2563EB" : "#D4D1C7"}
          strokeWidth={highlightedStep === 0 ? "2" : "1.2"}
        />
        <text
          x="684"
          y="233"
          fill="#2563EB"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="10.2"
          fontWeight="800"
        >
          01 · 철교(4.5m) 직전
        </text>
        <text
          x="684"
          y="251"
          fill="#141A23"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="12.5"
          fontWeight="800"
        >
          주공하나마트 옆 진입
        </text>
      </g>
      {/* 01 콜아웃 연결선 */}
      <path
        d="M 672 254 L 664 260 L 658 278"
        fill="none"
        stroke="#2563EB"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 02 골목 직진 거리 안내 캡슐 */}
      <g filter={`url(#${pinShadowId})`}>
        <rect
          x="404"
          y="418"
          width="176"
          height="25"
          rx="12.5"
          fill="#141A23"
        />
        <text
          x="492"
          y="434.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="10.8"
          fontWeight="700"
          letterSpacing="-0.01em"
        >
          02 · 골목 끝까지 직진 (약 2분)
        </text>
      </g>

      {/* 10. 한밭중고전자 1·2층 건축 아이소메트릭 쇼룸 + P 주차 마크 (실제 회사 위치 1:1) */}
      <g>
        {/* 건물 지면 그림자 */}
        <polygon
          points="272,366 306,383 340,366 306,350"
          fill="#141A23"
          fillOpacity="0.14"
        />
        {/* 1·2층 좌측면 */}
        <polygon
          points="276,332 306,347 306,378 276,363"
          fill="#FFFFFF"
          stroke="#141A23"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <polygon points="276,332 306,347 306,356 276,341" fill="#1D4E89" />
        <polygon points="276,352 306,367 306,371 276,356" fill="#E8521A" />

        {/* 1·2층 우측면 */}
        <polygon
          points="306,347 336,332 336,363 306,378"
          fill="#EEF2F7"
          stroke="#141A23"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <polygon points="306,347 336,332 336,341 306,356" fill="#153B68" />
        <polygon points="306,367 336,352 336,356 306,371" fill="#C84312" />

        {/* 지붕면 */}
        <polygon
          points="276,332 306,317 336,332 306,347"
          fill="#DCE7F3"
          stroke="#141A23"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* 도착 웨이브 링 */}
        <ellipse
          cx="306"
          cy="330"
          rx="26"
          ry="12"
          fill="none"
          stroke="#C84312"
          strokeWidth={highlightedStep === 2 ? "2.4" : "1.4"}
          strokeOpacity={highlightedStep === 2 ? "0.68" : "0.32"}
          strokeDasharray="4 4"
        />

        {/* 목적지 메인 티어드롭 핀 (03 도착 · 한밭 시그니처 오렌지) */}
        <g
          filter={`url(#${pinShadowId})`}
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : undefined}
          aria-label={
            interactive
              ? "STEP 03 현장 사진 크게 보기: 중촌고가교 밑 매장 도착"
              : undefined
          }
          onClick={
            interactive
              ? (e) => {
                  e.stopPropagation();
                  onSelectStep(2);
                }
              : undefined
          }
          onKeyDown={
            interactive
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectStep(2);
                  }
                }
              : undefined
          }
          className={interactive ? "cursor-pointer outline-none" : undefined}
        >
          <path
            d="M 306 278 C 294 278, 286 286, 286 298 C 286 312, 306 330, 306 330 C 306 330, 326 312, 326 298 C 326 286, 318 278, 306 278 Z"
            fill="#C84312"
            stroke="#FFFFFF"
            strokeWidth={highlightedStep === 2 ? "3.2" : "2.4"}
          />
          <text
            x="306"
            y="302.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize="11.2"
            fontWeight="900"
          >
            03
          </text>
        </g>

        {/* 전용 주차장 P 마크 (매장 우측 전용 주차장) */}
        <g filter={`url(#${pinShadowId})`}>
          <circle
            cx="362"
            cy="338"
            r="12"
            fill="#141A23"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <text
            x="362"
            y="342.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize="12"
            fontWeight="900"
          >
            P
          </text>
        </g>
        <text
          x="396"
          y="330"
          textAnchor="start"
          fill="#141A23"
          stroke="#F3F1EC"
          strokeWidth="3.8"
          paintOrder="stroke"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="10.2"
          fontWeight="800"
        >
          전용 주차 8대
        </text>
      </g>

      {/* 11. 웨이파인딩 인터랙티브 단계 핀 (01 골목 진입 · 02 직진 구간) */}
      {renderStepNode(
        0,
        654,
        290,
        "01",
        "#2563EB",
        "철교(4.5m) 직전 골목 진입"
      )}
      {renderStepNode(
        1,
        500,
        333,
        "02",
        "#1D4ED8",
        "골목길 끝까지 직진"
      )}

      {/* 12. 건축 지시선 + 좌상단 실물 외관 폴리오 (/store-exterior.jpg) */}
      <g fill="none">
        <path
          d="M 164 170 L 164 246 L 274 320"
          stroke="#141A23"
          strokeWidth="1.4"
          strokeDasharray="3 3"
          strokeOpacity="0.6"
        />
        <circle cx="164" cy="170" r="3" fill="#141A23" />
        <circle
          cx="274"
          cy="320"
          r="3.8"
          fill="#FFFFFF"
          stroke="#C84312"
          strokeWidth="2"
        />
      </g>

      <g filter={`url(#${cardShadowId})`}>
        <rect
          x="18"
          y="16"
          width="216"
          height="154"
          rx="12"
          fill="#FFFFFF"
          stroke="#D4D1C7"
          strokeWidth="1.2"
        />
        <rect
          x="24"
          y="22"
          width="204"
          height="94"
          rx="8"
          fill="#ECEBE6"
        />
        <image
          href="/store-exterior.jpg"
          x="24"
          y="22"
          width="204"
          height="94"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${photoClipId})`}
        />
        <rect
          x="31"
          y="29"
          width="88"
          height="20"
          rx="5"
          fill="#141A23"
          fillOpacity="0.82"
        />
        <text
          x="75"
          y="42.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="9.5"
          fontWeight="700"
        >
          1·2층 직영 전시장
        </text>

        <rect x="28" y="130" width="7" height="7" rx="1.5" fill="#C84312" />
        <text
          x="42"
          y="138"
          fill="#141A23"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="14.2"
          fontWeight="800"
          letterSpacing="-0.02em"
        >
          {STORE.name}
        </text>
        <text
          x="28"
          y="156"
          fill="#475569"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="10.2"
          fontWeight="600"
        >
          중촌고가교 밑 · 전용 주차 8대 · 1톤 상차
        </text>
      </g>

      {/* 13. 미니멀 스위스 나침반 (우상단) + 축척 표기 (좌하단) */}
      <g opacity="0.9">
        <circle
          cx="808"
          cy="42"
          r="15.5"
          fill="#FFFFFF"
          fillOpacity="0.94"
          stroke="#D4D1C7"
          strokeWidth="1"
        />
        <path d="M 808 31 L 812 42 L 808 39.5 L 804 42 Z" fill="#C84312" />
        <path d="M 808 53 L 811 44 L 808 45.5 L 805 44 Z" fill="#94A3B8" />
        <text
          x="808"
          y="21"
          textAnchor="middle"
          fill="#475569"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="9"
          fontWeight="800"
        >
          N
        </text>
      </g>

      <g>
        <rect
          x="18"
          y="452"
          width="174"
          height="24"
          rx="6"
          fill="#FFFFFF"
          fillOpacity="0.92"
          stroke="#DCD8CE"
          strokeWidth="1"
        />
        <path
          d="M 28 467 L 28 463 M 28 465 L 68 465 M 68 467 L 68 463"
          stroke="#141A23"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
        <text
          x="76"
          y="468"
          fill="#334155"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="10"
          fontWeight="700"
        >
          약 200m · 골목 직진 2분
        </text>
      </g>
    </svg>
  );
}
