// 파일 경로: components/showroom/store-directions-map.tsx
"use client";

import React, { useId, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Icon, ICON, Modal } from "../../lib/ui";
import { STORE, STORE_NAVIGATION, trackEvent } from "../../lib/site";
import {
  STORE_DIRECTION_ROUTES,
  STORE_DIRECTION_LANDMARKS,
  getStoreDirectionRoute,
  buildStoreDirectionsShareText,
  type DirectionRouteId,
} from "../../lib/store-directions";

interface DirectionsSvgProps {
  activeRoute: DirectionRouteId;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  className?: string;
}

/**
 * 한밭중고전자 오프라인 매장(대전광역시 중구 대전천서로 691-62 · 중촌고가도로 밑)
 * 고정밀 에디토리얼 벡터 약도 SVG
 */
function DirectionsVectorSvg({
  activeRoute,
  svgRef,
  className = "w-full h-auto block",
}: DirectionsSvgProps) {
  const uid = useId().replace(/:/g, "");
  const arrowId = `hb-route-arrow-${uid}`;
  const shadowId = `hb-overpass-shadow-${uid}`;
  const pinShadowId = `hb-pin-shadow-${uid}`;

  const isWest = activeRoute === "west";
  const isEast = activeRoute === "east";
  const isNorth = activeRoute === "north";

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 440"
      role="img"
      aria-label={`${STORE.name} 오시는 길 약도 — ${STORE.roadAddress} (${STORE.addressNote})`}
      className={className}
    >
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 12 12"
          refX="9"
          refY="6"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 1 2 L 10 6 L 1 10 z" fill="#C84312" />
        </marker>
        <filter id={shadowId} x="-5%" y="-20%" width="110%" height="160%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="2.5"
            floodColor="#141A23"
            floodOpacity="0.18"
          />
        </filter>
        <filter id={pinShadowId} x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="2.5"
            floodColor="#141A23"
            floodOpacity="0.24"
          />
        </filter>
      </defs>

      {/* 1. 기본 지도 배경 (Warm Editorial Stone) */}
      <rect x="0" y="0" width="800" height="440" fill="#F7F4EE" />

      {/* 2. 주변 도시 블록 (시각적 지형 깊이) */}
      <g fill="#EFECE4" stroke="#E5DFD3" strokeWidth="1">
        <rect x="18" y="48" width="136" height="142" rx="10" />
        <rect x="208" y="48" width="276" height="104" rx="10" />
        <rect x="18" y="274" width="136" height="128" rx="10" />
        <rect x="208" y="264" width="194" height="138" rx="10" />
        <rect x="684" y="48" width="98" height="142" rx="10" />
        <rect x="684" y="274" width="98" height="128" rx="10" />
      </g>

      {/* 보조 구역 텍스트 (중촌동 / 선화동 / 삼성동) */}
      <g
        fill="#9C9588"
        fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="12"
        fontWeight="600"
        letterSpacing="0.06em"
      >
        <text x="230" y="82">
          중촌동 일대
        </text>
        <text x="72" y="346" textAnchor="middle">
          선화동 방면
        </text>
        <text x="733" y="114" textAnchor="middle">
          삼성동
        </text>
      </g>

      {/* 3. 대전천 (남북 하천 수계) */}
      <path
        d="M 564 0 C 570 110, 560 220, 554 330 C 550 380, 548 415, 546 440 L 622 440 C 625 405, 628 365, 632 320 C 638 215, 646 110, 640 0 Z"
        fill="#D8ECFC"
      />
      <path
        d="M 588 18 C 592 115, 584 220, 578 330 C 575 375, 573 405, 572 426"
        fill="none"
        stroke="#B3D7F5"
        strokeWidth="2"
        strokeDasharray="10 10"
        strokeLinecap="round"
      />
      <path
        d="M 612 36 C 615 125, 608 220, 602 330 C 600 375, 598 405, 597 422"
        fill="none"
        stroke="#B3D7F5"
        strokeWidth="1.5"
        strokeDasharray="6 12"
        strokeLinecap="round"
      />
      <g
        fill="#3B79B8"
        fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="12"
        fontWeight="700"
        letterSpacing="0.16em"
      >
        <text x="601" y="106" textAnchor="middle">
          대전천
        </text>
        <text x="588" y="356" textAnchor="middle">
          대전천
        </text>
      </g>

      {/* 4. 주요 간선도로 레이어 (외곽 테두리 + 백색 도로면) */}
      <g strokeLinecap="butt" strokeLinejoin="round" fill="none">
        {/* 대종로 (서측 남북 간선) */}
        <path d="M 180 0 L 180 440" stroke="#D5CFC3" strokeWidth="30" />
        <path d="M 180 0 L 180 440" stroke="#FFFFFF" strokeWidth="26" />

        {/* 대전천서로 (매장 앞 천변도로 — 남북) */}
        <path
          d="M 526 0 C 530 110, 522 220, 516 330 C 513 380, 511 415, 509 440"
          stroke="#CFC8BA"
          strokeWidth="30"
        />
        <path
          d="M 526 0 C 530 110, 522 220, 516 330 C 513 380, 511 415, 509 440"
          stroke="#FFFFFF"
          strokeWidth="26"
        />

        {/* 대전천동로 (동측 천변도로 — 남북) */}
        <path
          d="M 664 0 C 668 110, 660 220, 654 330 C 651 380, 649 415, 647 440"
          stroke="#D8D2C6"
          strokeWidth="20"
        />
        <path
          d="M 664 0 C 668 110, 660 220, 654 330 C 651 380, 649 415, 647 440"
          stroke="#FFFFFF"
          strokeWidth="16"
        />

        {/* 동서대로 (동서 주간선) */}
        <path d="M 0 218 L 800 218" stroke="#CFC8BA" strokeWidth="36" />
        <path d="M 0 218 L 800 218" stroke="#FFFFFF" strokeWidth="32" />

        {/* 중촌고가도로 하부 측도 (매장 진입 핵심 측도) */}
        <path d="M 218 248 L 518 248" stroke="#D9C7B6" strokeWidth="14" />
        <path d="M 218 248 L 518 248" stroke="#FFF9F3" strokeWidth="10" />
      </g>

      {/* 도로 중앙 점선 */}
      <g
        fill="none"
        stroke="#E2DDD3"
        strokeWidth="1.5"
        strokeDasharray="6 6"
      >
        <path d="M 180 42 L 180 194" />
        <path d="M 180 242 L 180 400" />
        <path d="M 526 42 C 529 115, 525 160, 523 194" />
        <path d="M 520 244 C 518 300, 514 355, 511 400" />
        <path d="M 24 218 L 154 218" />
        <path d="M 660 218 L 776 218" />
      </g>

      {/* 5. 현암교 (대전천 횡단 교량) */}
      <g>
        <rect
          x="552"
          y="198"
          width="92"
          height="40"
          rx="2"
          fill="#FFFFFF"
          stroke="#94A3B8"
          strokeWidth="2"
        />
        <line
          x1="552"
          y1="204"
          x2="644"
          y2="204"
          stroke="#CBD5E1"
          strokeWidth="2"
        />
        <line
          x1="552"
          y1="232"
          x2="644"
          y2="232"
          stroke="#CBD5E1"
          strokeWidth="2"
        />
        <line
          x1="558"
          y1="218"
          x2="638"
          y2="218"
          stroke="#CBD5E1"
          strokeWidth="1.5"
          strokeDasharray="5 5"
        />
      </g>

      {/* 6. 중촌고가도로 (입체 고가차도 상판) */}
      <g filter={`url(#${shadowId})`}>
        <rect
          x="246"
          y="202"
          width="256"
          height="30"
          rx="6"
          fill="#263244"
          stroke="#141A23"
          strokeWidth="1.5"
        />
        <line
          x1="254"
          y1="206"
          x2="494"
          y2="206"
          stroke="#64748B"
          strokeWidth="1"
          strokeOpacity="0.65"
        />
        <line
          x1="254"
          y1="228"
          x2="494"
          y2="228"
          stroke="#64748B"
          strokeWidth="1"
          strokeOpacity="0.65"
        />
        <text
          x="374"
          y="221.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="11.5"
          fontWeight="700"
        >
          중촌고가도로 (고가 위 진입 금지)
        </text>
      </g>

      {/* 고가 하부 측도 안내 라벨 (진입 동선 점선과 겹치지 않도록 하부 여백 배치) */}
      <text
        x="314"
        y="266"
        textAnchor="middle"
        fill="#9A3412"
        fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="10"
        fontWeight="700"
      >
        하부 측도 이용 →
      </text>

      {/* 7. 중촌네거리 교차로 노드 */}
      <g>
        <circle
          cx="180"
          cy="218"
          r="9"
          fill="#FFFFFF"
          stroke="#141A23"
          strokeWidth="2.5"
        />
        <circle cx="180" cy="218" r="3" fill="#141A23" />
      </g>

      {/* 8. 인터랙티브 방면별 추천 진입 동선 하이라이트 */}
      {isWest && (
        <path
          d="M 16 226 L 176 226 Q 198 226 212 248 L 502 248 Q 521 248 520 268 L 518 304 L 494 304"
          fill="none"
          stroke="#C84312"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10 6"
          markerEnd={`url(#${arrowId})`}
        />
      )}

      {isEast && (
        <path
          d="M 784 212 L 542 212 Q 522 212 521 232 L 519 304 L 494 304"
          fill="none"
          stroke="#C84312"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10 6"
          markerEnd={`url(#${arrowId})`}
        />
      )}

      {isNorth && (
        <path
          d="M 526 38 C 528 118, 523 200, 520 304 L 494 304"
          fill="none"
          stroke="#C84312"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10 6"
          markerEnd={`url(#${arrowId})`}
        />
      )}

      {/* 전체 약도 모드일 때: 매장 바로 앞 진입 방향 화살표 */}
      {activeRoute === "all" && (
        <g>
          <path
            d="M 520 262 L 519 304 L 495 304"
            fill="none"
            stroke="#C84312"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={`url(#${arrowId})`}
          />
        </g>
      )}

      {/* 9. 한밭중고전자 건물(1·2층 직영쇼룸) + 전용 주차장(8대) */}
      <g>
        {/* 매장 앞 전용 주차 구획 */}
        <rect
          x="414"
          y="280"
          width="82"
          height="62"
          rx="8"
          fill="#FFF4EE"
          stroke="#C84312"
          strokeWidth="2"
        />
        {/* 1·2층 쇼룸 건물 블록 */}
        <rect
          x="420"
          y="286"
          width="46"
          height="50"
          rx="5"
          fill="#141A23"
        />
        <text
          x="443"
          y="309"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="10"
          fontWeight="700"
        >
          1·2층
        </text>
        <text
          x="443"
          y="323"
          textAnchor="middle"
          fill="#FF8A50"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="9.5"
          fontWeight="700"
        >
          전시장
        </text>
        {/* P 주차 표시 */}
        <rect x="472" y="290" width="18" height="42" rx="3" fill="#FFFFFF" stroke="#E8521A" strokeWidth="1" />
        <text
          x="481"
          y="315"
          textAnchor="middle"
          fill="#C84312"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="12"
          fontWeight="800"
        >
          P
        </text>
      </g>

      {/* 매장 메인 핀 마커 (하부 측도와 겹치지 않는 상단 앵커) */}
      <g filter={`url(#${pinShadowId})`}>
        <path
          d="M 443 256 C 435 256, 429 262, 429 270 C 429 279, 443 291, 443 291 C 443 291, 457 279, 457 270 C 457 262, 451 256, 443 256 Z"
          fill="#C84312"
          stroke="#FFFFFF"
          strokeWidth="2.2"
        />
        <circle cx="443" cy="269" r="4.8" fill="#FFFFFF" />
      </g>

      {/* 한밭중고전자 콜아웃 카드 (겹침 제로 배치) */}
      <g filter={`url(#${shadowId})`}>
        <line
          x1="398"
          y1="311"
          x2="414"
          y2="311"
          stroke="#141A23"
          strokeWidth="2"
        />
        <rect
          x="212"
          y="278"
          width="186"
          height="66"
          rx="10"
          fill="#141A23"
          stroke="#C84312"
          strokeWidth="1.5"
        />
        <text
          x="226"
          y="301"
          fill="#FFFFFF"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="15"
          fontWeight="800"
        >
          {STORE.name}
        </text>
        <text
          x="226"
          y="319"
          fill="#FF8A50"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="10.8"
          fontWeight="700"
        >
          대전천서로 691-62 · 중촌고가 밑
        </text>
        <text
          x="226"
          y="334"
          fill="#CBD5E1"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="10.3"
          fontWeight="600"
        >
          전용 주차 8대 · 1톤 화물 상차 가능
        </text>
      </g>

      {/* 10. 지명 · 교차로 · 교량 · 도로명 라벨 */}
      <g fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif">
        {/* 중촌네거리 라벨 */}
        <rect
          x="136"
          y="165"
          width="88"
          height="24"
          rx="6"
          fill="#FFFFFF"
          stroke="#141A23"
          strokeWidth="1.4"
        />
        <text
          x="180"
          y="181"
          textAnchor="middle"
          fill="#141A23"
          fontSize="12"
          fontWeight="700"
        >
          중촌네거리
        </text>

        {/* 현암교 라벨 */}
        <rect
          x="568"
          y="165"
          width="60"
          height="24"
          rx="6"
          fill="#FFFFFF"
          stroke="#64748B"
          strokeWidth="1.2"
        />
        <text
          x="598"
          y="181"
          textAnchor="middle"
          fill="#1E293B"
          fontSize="12"
          fontWeight="700"
        >
          현암교
        </text>

        {/* 도로명 표기 */}
        <rect
          x="62"
          y="192"
          width="66"
          height="20"
          rx="4"
          fill="#FAF9F6"
          stroke="#E2DDD3"
          strokeWidth="1"
        />
        <text
          x="95"
          y="206"
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontWeight="700"
        >
          동서대로
        </text>

        <rect
          x="694"
          y="192"
          width="66"
          height="20"
          rx="4"
          fill="#FAF9F6"
          stroke="#E2DDD3"
          strokeWidth="1"
        />
        <text
          x="727"
          y="206"
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontWeight="700"
        >
          동서대로
        </text>

        <rect
          x="154"
          y="96"
          width="52"
          height="20"
          rx="4"
          fill="#FAF9F6"
          stroke="#E2DDD3"
          strokeWidth="1"
        />
        <text
          x="180"
          y="110"
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontWeight="700"
        >
          대종로
        </text>

        <rect
          x="456"
          y="96"
          width="76"
          height="22"
          rx="4"
          fill="#FFFFFF"
          stroke="#C84312"
          strokeWidth="1.2"
        />
        <text
          x="494"
          y="111"
          textAnchor="middle"
          fill="#C84312"
          fontSize="11.5"
          fontWeight="800"
        >
          대전천서로
        </text>

        <rect
          x="442"
          y="366"
          width="74"
          height="20"
          rx="4"
          fill="#FAF9F6"
          stroke="#E2DDD3"
          strokeWidth="1"
        />
        <text
          x="479"
          y="380"
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontWeight="700"
        >
          대전천서로
        </text>

        <text
          x="720"
          y="346"
          textAnchor="middle"
          fill="#64748B"
          fontSize="11"
          fontWeight="600"
        >
          대전천동로
        </text>
      </g>

      {/* 11. 4방면 진입 방향 안내 (상·하·좌·우) */}
      <g
        fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="11.5"
        fontWeight="700"
      >
        {/* 북쪽 (대종로 상단) */}
        <rect x="116" y="10" width="128" height="24" rx="6" fill="#FFFFFF" stroke="#E2DDD3" />
        <text x="180" y="26" textAnchor="middle" fill="#334155">
          ↑ 오정네거리 방면
        </text>

        {/* 북쪽 (대전천서로 상단) */}
        <rect
          x="454"
          y="10"
          width="144"
          height="24"
          rx="6"
          fill={isNorth ? "#C84312" : "#FFFFFF"}
          stroke={isNorth ? "#C84312" : "#E2DDD3"}
        />
        <text
          x="526"
          y="26"
          textAnchor="middle"
          fill={isNorth ? "#FFFFFF" : "#334155"}
        >
          ↑ 오정동 · 한남대
        </text>

        {/* 서쪽 (동서대로 좌측) */}
        <rect
          x="14"
          y="244"
          width="142"
          height="24"
          rx="6"
          fill={isWest ? "#C84312" : "#FFFFFF"}
          stroke={isWest ? "#C84312" : "#E2DDD3"}
        />
        <text
          x="85"
          y="260"
          textAnchor="middle"
          fill={isWest ? "#FFFFFF" : "#334155"}
        >
          ← 둔산 · 용문 (서구)
        </text>

        {/* 동쪽 (동서대로 우측) */}
        <rect
          x="650"
          y="244"
          width="138"
          height="24"
          rx="6"
          fill={isEast ? "#C84312" : "#FFFFFF"}
          stroke={isEast ? "#C84312" : "#E2DDD3"}
        />
        <text
          x="719"
          y="260"
          textAnchor="middle"
          fill={isEast ? "#FFFFFF" : "#334155"}
        >
          대전역 · 삼성동 →
        </text>

        {/* 남쪽 (대종로 하단) */}
        <rect x="112" y="406" width="136" height="24" rx="6" fill="#FFFFFF" stroke="#E2DDD3" />
        <text x="180" y="422" textAnchor="middle" fill="#334155">
          ↓ 선화네거리 · 중구청
        </text>

        {/* 남쪽 (대전천서로 하단) */}
        <rect x="444" y="406" width="134" height="24" rx="6" fill="#FFFFFF" stroke="#E2DDD3" />
        <text x="511" y="422" textAnchor="middle" fill="#334155">
          ↓ 선화동 · 중앙로
        </text>
      </g>

      {/* 12. 북쪽 나침반 마크 (좌상단) */}
      <g transform="translate(26, 26)">
        <circle
          cx="14"
          cy="14"
          r="15"
          fill="#FFFFFF"
          stroke="#E2DDD3"
          strokeWidth="1.2"
        />
        <path d="M 14 4 L 18 14 L 14 12 L 10 14 Z" fill="#C84312" />
        <path d="M 14 24 L 18 14 L 14 16 L 10 14 Z" fill="#CBD5E1" />
        <text
          x="14"
          y="42"
          textAnchor="middle"
          fill="#64748B"
          fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="10"
          fontWeight="800"
        >
          N
        </text>
      </g>
    </svg>
  );
}

/**
 * 현재 SVG 약도를 카카오톡 공유/인쇄용 2x 고해상도 PNG(매장명·주소·전화번호 헤더/푸터 포함)로 저장합니다.
 */
async function downloadBrandedDirectionsPng(svgEl: SVGSVGElement | null) {
  if (!svgEl) {
    toast.error("약도를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
    return;
  }

  try {
    const serializer = new XMLSerializer();
    const cloned = svgEl.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute("width", "1600");
    cloned.setAttribute("height", "880");
    const svgString = serializer.serializeToString(cloned);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });

    const width = 1600;
    const headerH = 128;
    const mapH = 880;
    const footerH = 112;
    const height = headerH + mapH + footerH;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      throw new Error("Canvas context unavailable");
    }

    // 상단 브랜드 헤더
    ctx.fillStyle = "#141A23";
    ctx.fillRect(0, 0, width, headerH);

    ctx.fillStyle = "#FF8A50";
    ctx.font = "700 24px Pretendard, -apple-system, sans-serif";
    ctx.fillText("1·2층 직영 전시장 · 오시는 길 약도", 52, 48);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 40px Pretendard, -apple-system, sans-serif";
    ctx.fillText(`${STORE.name} (${STORE.addressNote})`, 52, 98);

    ctx.textAlign = "right";
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "700 28px Pretendard, -apple-system, sans-serif";
    ctx.fillText(`대표전화 ${STORE.tel}`, width - 52, 62);
    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 22px Pretendard, -apple-system, sans-serif";
    ctx.fillText(`직통 ${STORE.mobile}`, width - 52, 96);
    ctx.textAlign = "left";

    // 중앙 벡터 약도
    ctx.drawImage(img, 0, headerH, width, mapH);
    URL.revokeObjectURL(url);

    // 하단 주소·진입 팁 푸터
    ctx.fillStyle = "#FAF9F6";
    ctx.fillRect(0, headerH + mapH, width, footerH);
    ctx.strokeStyle = "#E2DDD3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, headerH + mapH);
    ctx.lineTo(width, headerH + mapH);
    ctx.stroke();

    ctx.fillStyle = "#141A23";
    ctx.font = "700 26px Pretendard, -apple-system, sans-serif";
    ctx.fillText(
      `도로명: ${STORE.roadAddress}   |   지번: ${STORE.jibunAddress}`,
      52,
      headerH + mapH + 46
    );
    ctx.fillStyle = "#C84312";
    ctx.font = "700 22px Pretendard, -apple-system, sans-serif";
    ctx.fillText(
      `※ 중촌고가도로 위로 올라가지 마시고 하부 측도·대전천서로 방면으로 진입 (전용 주차 8대 · 1톤 화물 상차 가능 · ${STORE.hours})`,
      52,
      headerH + mapH + 86
    );

    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `${STORE.name}-오시는길-약도.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    trackEvent("download_store_directions_map");
    toast.success("오시는 길 약도 이미지(PNG)가 저장되었습니다.");
  } catch {
    toast.error("약도 이미지 저장에 실패했습니다. 다시 시도해 주세요.");
  }
}

export function StoreDirectionsMap({
  compact = false,
  onOpenGoogleMap,
}: {
  compact?: boolean;
  onOpenGoogleMap?: () => void;
}) {
  const [activeRoute, setActiveRoute] = useState<DirectionRouteId>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const currentRoute = getStoreDirectionRoute(activeRoute);

  const handleCopyDirections = async () => {
    try {
      await navigator.clipboard.writeText(buildStoreDirectionsShareText());
      toast.success("오시는 길 안내 문구(주소·진입 팁·지도 링크)가 복사되었습니다.");
    } catch {
      toast.error("안내 문구 복사에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="flex flex-col bg-[#F7F4EE]">
        {/* 상단 방면별 진입 동선 선택 바 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2DDD3] bg-[#FAF9F6] px-3.5 py-2.5 sm:px-4">
          <div
            role="tablist"
            aria-label="방면별 진입 동선 선택"
            className="flex flex-wrap items-center gap-1 rounded-lg bg-[#EFECE4] p-0.5"
          >
            {STORE_DIRECTION_ROUTES.map((route) => {
              const selected = activeRoute === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveRoute(route.id)}
                  className={`rounded-md px-2.5 py-1.5 text-hb-xs font-bold whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                    selected
                      ? "bg-[#141A23] text-white shadow-2xs"
                      : "text-[#475569] hover:text-[#141A23]"
                  }`}
                >
                  {route.shortLabel}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenGoogleMap && (
              <button
                type="button"
                onClick={onOpenGoogleMap}
                className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#475569] hover:text-[#141A23] underline underline-offset-4 whitespace-nowrap cursor-pointer"
              >
                <span>위성·구글지도</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => downloadBrandedDirectionsPng(svgRef.current)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D8D1C5] bg-white px-2.5 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Icon d={ICON.download} className="w-3.5 h-3.5 text-[#C84312]" />
              <span>약도 저장</span>
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D8D1C5] bg-white px-2.5 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#C84312]" />
              <span>크게 보기</span>
            </button>
          </div>
        </div>

        {/* 벡터 약도 캔버스 */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label={`${STORE.name} 오시는 길 약도 크게 보기`}
          className="group relative block w-full overflow-hidden bg-[#F7F4EE] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#141A23]"
        >
          <DirectionsVectorSvg
            activeRoute={activeRoute}
            svgRef={svgRef}
            className={`w-full block ${
              compact ? "max-h-[240px] object-contain" : "h-auto"
            }`}
          />
        </button>

        {/* 하단 선택 방면 진입 팁 요약 바 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#E2DDD3] bg-[#FFF8F4] px-3.5 py-2.5 sm:px-4 text-hb-xs">
          <p className="min-w-0 text-[#334155] leading-relaxed break-keep">
            <strong className="font-bold text-[#C84312]">
              {currentRoute.shortLabel} 진입 안내
            </strong>{" "}
            <span className="text-[#CBD2DC]" aria-hidden="true">
              ·
            </span>{" "}
            {currentRoute.summary}
          </p>
          {!compact && (
            <button
              type="button"
              onClick={handleCopyDirections}
              className="inline-flex items-center gap-1 font-bold text-[#141A23] hover:text-[#C84312] underline underline-offset-4 shrink-0 self-start sm:self-center whitespace-nowrap cursor-pointer"
            >
              <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#C84312]" />
              <span>약도 안내 복사</span>
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <StoreDirectionsModal
          open
          initialRoute={activeRoute}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

/**
 * 오시는 길 약도 확대·인쇄·저장 전용 모달
 */
export function StoreDirectionsModal({
  open,
  initialRoute = "all",
  onClose,
}: {
  open: boolean;
  initialRoute?: DirectionRouteId;
  onClose: () => void;
}) {
  const [activeRoute, setActiveRoute] =
    useState<DirectionRouteId>(initialRoute);
  const modalSvgRef = useRef<SVGSVGElement | null>(null);
  const currentRoute = getStoreDirectionRoute(activeRoute);

  const handleCopyDirections = async () => {
    try {
      await navigator.clipboard.writeText(buildStoreDirectionsShareText());
      toast.success("오시는 길 안내 문구가 복사되었습니다.");
    } catch {
      toast.error("안내 문구 복사에 실패했습니다.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={`${STORE.name} 오시는 길 약도`}
      panelClassName="max-w-4xl"
      closeOnOverlayClick={false}
    >
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-[#E2DDD3] bg-white shadow-2xl">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E2DDD3] bg-[#141A23] px-5 py-4 text-white">
          <div className="min-w-0">
            <span className="block text-hb-xs font-bold text-[#FF8A50]">
              {STORE.addressNote} · 1·2층 직영 전시장
            </span>
            <h3 className="text-hb-base sm:text-hb-lg font-bold truncate">
              {STORE.name} 오시는 길 약도
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <Icon d={ICON.close} className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="flex-1 overflow-y-auto bg-[#FAF9F6] p-4 sm:p-6 space-y-4">
          {/* 방면 선택 탭 + 약도 이미지 저장 */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div
              role="tablist"
              aria-label="방면별 추천 경로"
              className="flex flex-wrap items-center gap-1 rounded-xl border border-[#E2DDD3] bg-white p-1"
            >
              {STORE_DIRECTION_ROUTES.map((route) => {
                const selected = activeRoute === route.id;
                return (
                  <button
                    key={route.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveRoute(route.id)}
                    className={`rounded-lg px-3 py-1.5 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selected
                        ? "bg-[#141A23] text-white"
                        : "text-[#475569] hover:text-[#141A23]"
                    }`}
                  >
                    {route.shortLabel}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyDirections}
                className="hb-btn-outline h-9 px-3.5 text-hb-xs font-bold whitespace-nowrap cursor-pointer"
              >
                <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#C84312]" />
                <span>안내 문구 복사</span>
              </button>
              <button
                type="button"
                onClick={() => downloadBrandedDirectionsPng(modalSvgRef.current)}
                className="hb-btn-primary h-9 px-3.5 text-hb-xs font-bold whitespace-nowrap cursor-pointer"
              >
                <Icon d={ICON.download} className="w-3.5 h-3.5 text-[#FF8A50]" />
                <span>약도 이미지 저장 (PNG)</span>
              </button>
            </div>
          </div>

          {/* 대형 벡터 약도 프레임 */}
          <div className="overflow-hidden rounded-xl border border-[#E2DDD3] bg-[#F7F4EE]">
            <DirectionsVectorSvg
              activeRoute={activeRoute}
              svgRef={modalSvgRef}
              className="w-full h-auto block"
            />
          </div>

          {/* 선택 방면 단계별 안내 + 3대 현장 기준 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 rounded-xl border border-[#E2DDD3] bg-white p-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-hb-xs">
                <span className="font-bold text-[#C84312]">
                  {currentRoute.shortLabel}
                </span>
                <span className="text-[#CBD2DC]" aria-hidden="true">
                  ·
                </span>
                <span className="font-semibold text-[#475569]">
                  {currentRoute.originLabel}
                </span>
              </div>
              <ol className="mt-2.5 space-y-2 text-hb-xs sm:text-hb-sm text-[#334155]">
                {currentRoute.steps.map((step, idx) => (
                  <li key={step} className="flex items-start gap-2 break-keep">
                    <span className="font-mono font-bold text-[#C84312] tabular-nums shrink-0">
                      0{idx + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-[#E2DDD3] bg-white p-4 flex flex-col justify-between gap-2.5">
              <div className="space-y-2 text-hb-xs sm:text-hb-sm">
                {STORE_DIRECTION_LANDMARKS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-baseline justify-between gap-2 border-b border-[#F1EFEA] pb-2 last:border-b-0 last:pb-0"
                  >
                    <span className="text-[#64748B] shrink-0">{item.label}</span>
                    <strong className="font-bold text-[#141A23] text-right break-keep">
                      {item.value}
                    </strong>
                  </div>
                ))}
              </div>
              <p className="text-hb-xs text-[#475569] tabular-nums">
                문의: {STORE.tel} · 직통 {STORE.mobile}
              </p>
            </div>
          </div>
        </div>

        {/* 모달 푸터: 내비게이션 3사 연결 */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#E2DDD3] bg-white px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={STORE_NAVIGATION.naverMap}
              target="_blank"
              rel="noopener noreferrer"
              className="hb-btn-outline h-9 px-3.5 text-hb-xs font-bold whitespace-nowrap"
            >
              <span>네이버 지도</span>
              <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#0F766E]" />
            </a>
            <a
              href={STORE_NAVIGATION.kakaoTo}
              target="_blank"
              rel="noopener noreferrer"
              className="hb-btn-outline h-9 px-3.5 text-hb-xs font-bold whitespace-nowrap"
            >
              <span>카카오맵 길찾기</span>
              <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#64748B]" />
            </a>
            <a
              href={STORE_NAVIGATION.tmapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hb-btn-outline h-9 px-3.5 text-hb-xs font-bold whitespace-nowrap"
            >
              <span>티맵 길안내</span>
              <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#64748B]" />
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hb-btn-outline h-9 px-4 text-hb-xs font-bold cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
}
