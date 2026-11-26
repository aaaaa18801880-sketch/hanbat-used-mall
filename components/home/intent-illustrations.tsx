// 파일 경로: components/home/intent-illustrations.tsx
"use client";

import React from "react";

export type IntentIllustrationKind = "buyback" | "showroom" | "commercial";

/**
 * 3열 세로 목적 분기 카드 하단 전용 컬러 듀오톤 SVG 일러스트
 * - 이모지 없이 입체 그라데이션·면·빛 레이어로 구성된 깔끔한 쇼룸 그래픽
 */
export function IntentCardIllustration({
  kind,
}: {
  kind: IntentIllustrationKind;
}) {
  const uid = React.useId().replace(/:/g, "");

  if (kind === "buyback") {
    return (
      <svg
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="w-32 h-24 sm:w-36 sm:h-28 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.03]"
      >
        <defs>
          <linearGradient id={`bgOrange-${uid}`} x1="20" y1="20" x2="140" y2="110" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF9666" />
            <stop offset="1" stopColor="#C84312" />
          </linearGradient>
          <linearGradient id={`applianceBody-${uid}`} x1="34" y1="18" x2="94" y2="104" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F8FAFC" />
            <stop offset="1" stopColor="#DCE3EE" />
          </linearGradient>
        </defs>

        {/* 바닥 부드러운 그림자 */}
        <ellipse cx="80" cy="108" rx="56" ry="8" fill="#E6EAF0" />

        {/* 가전 실물 본체 (세탁기/냉장고 모티프) */}
        <rect
          x="32"
          y="20"
          width="58"
          height="84"
          rx="10"
          fill={`url(#applianceBody-${uid})`}
          stroke="#1E293B"
          strokeWidth="2.5"
        />
        <rect x="40" y="29" width="42" height="10" rx="4" fill="#1E293B" fillOpacity="0.12" />
        <circle cx="72" cy="34" r="3" fill="#C84312" />
        <circle
          cx="61"
          cy="68"
          r="17"
          fill="#FFFFFF"
          stroke="#1E293B"
          strokeWidth="2.5"
        />
        <circle cx="61" cy="68" r="10.5" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />

        {/* 현장 정산 포인트 원형 배지 + 체크 */}
        <circle
          cx="106"
          cy="72"
          r="26"
          fill={`url(#bgOrange-${uid})`}
          stroke="#FFFFFF"
          strokeWidth="3.5"
        />
        <path
          d="M97.5 68L102 79L106 70.5L110 79L114.5 68"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M95 72.5H117"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* 상단 촬영/스캔 포인트 스파클 */}
        <rect x="96" y="20" width="32" height="22" rx="6" fill="#132238" />
        <circle cx="112" cy="31" r="5" fill="#FF9666" />
        <circle cx="122" cy="25" r="1.5" fill="#FFFFFF" />
      </svg>
    );
  }

  if (kind === "showroom") {
    return (
      <svg
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="w-32 h-24 sm:w-36 sm:h-28 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.03]"
      >
        <defs>
          <linearGradient id={`skyShield-${uid}`} x1="86" y1="30" x2="132" y2="94" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id={`fridgeBody-${uid}`} x1="30" y1="16" x2="86" y2="104" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#DFE6F0" />
          </linearGradient>
        </defs>

        <ellipse cx="80" cy="108" rx="56" ry="8" fill="#DCE4F0" />

        {/* 프리미엄 냉장고·가전 쇼룸 본체 */}
        <rect
          x="32"
          y="16"
          width="54"
          height="88"
          rx="9"
          fill={`url(#fridgeBody-${uid})`}
          stroke="#132238"
          strokeWidth="2.5"
        />
        <path d="M59 16V104" stroke="#132238" strokeWidth="2.2" />
        <path d="M32 64H86" stroke="#132238" strokeWidth="2.2" />
        <rect x="52" y="34" width="3" height="16" rx="1.5" fill="#132238" />
        <rect x="63" y="34" width="3" height="16" rx="1.5" fill="#132238" />
        <rect x="38" y="25" width="12" height="6" rx="2" fill="#0284C7" fillOpacity="0.25" />

        {/* 무상 A/S 보증 쉴드 */}
        <path
          d="M108 32L132 41V63C132 79.5 121.5 91.5 108 97C94.5 91.5 84 79.5 84 63V41L108 32Z"
          fill={`url(#skyShield-${uid})`}
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M98.5 64L105 70.5L118 57.5"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 세척 완료 포인트 */}
        <circle cx="122" cy="24" r="5" fill="#0D9488" />
        <circle cx="134" cy="30" r="3" fill="#38BDF8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-32 h-24 sm:w-36 sm:h-28 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.03]"
    >
      <defs>
        <linearGradient id={`steelBody-${uid}`} x1="24" y1="18" x2="88" y2="102" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E2E8F0" />
          <stop offset="1" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id={`showcaseGlass-${uid}`} x1="88" y1="32" x2="132" y2="98" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0F2FE" />
          <stop offset="1" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>

      <ellipse cx="80" cy="108" rx="58" ry="8" fill="#E6EAF0" />

      {/* 45박스 스텐 업소용 냉장고 */}
      <rect
        x="26"
        y="18"
        width="56"
        height="82"
        rx="6"
        fill={`url(#steelBody-${uid})`}
        stroke="#132238"
        strokeWidth="2.5"
      />
      <rect x="26" y="18" width="56" height="14" rx="4" fill="#132238" />
      <rect x="46" y="22.5" width="16" height="5" rx="2" fill="#FF9666" />
      <path d="M54 32V100" stroke="#132238" strokeWidth="2.2" />
      <path d="M26 66H82" stroke="#132238" strokeWidth="2.2" />
      <path d="M49 44V54M59 44V54M49 77V87M59 77V87" stroke="#132238" strokeWidth="2.2" strokeLinecap="round" />

      {/* 옆 음료 쇼케이스 */}
      <rect
        x="88"
        y="30"
        width="44"
        height="72"
        rx="6"
        fill="#FFFFFF"
        stroke="#132238"
        strokeWidth="2.5"
      />
      <rect
        x="94"
        y="38"
        width="32"
        height="52"
        rx="3"
        fill={`url(#showcaseGlass-${uid})`}
        stroke="#132238"
        strokeWidth="1.8"
      />
      <path d="M94 55H126M94 72H126" stroke="#132238" strokeWidth="1.8" />
      <rect x="99" y="43" width="6" height="9" rx="1.5" fill="#0284C7" />
      <rect x="108" y="43" width="6" height="9" rx="1.5" fill="#C84312" />
      <rect x="100" y="60" width="6" height="9" rx="1.5" fill="#0D9488" />
      <rect x="109" y="60" width="6" height="9" rx="1.5" fill="#0284C7" />
    </svg>
  );
}
