// 파일 경로: components/ui/modern-icons.tsx
"use client";

import React from "react";

export type ModernIconType =
  | "all"
  | "aircon"
  | "fridge"
  | "washer"
  | "small"
  | "biz-fridge"
  | "showcase"
  | "kitchen"
  | "sell"
  | "closure"
  | "startup"
  | "shield"
  | "sparkle"
  | "tax";

interface ModernIconProps {
  name: ModernIconType;
  className?: string;
  dark?: boolean;
}

/**
 * 2026 Geometric Neo-Depth & Layered Duotone SVG Icon System
 * - OS 기본 이모지를 대체하는 한밭중고전자 전용 벡터 픽토그램
 * - 부모 요소에 `group` 클래스가 있을 때 호버 마이크로 인터랙션 자동 작동
 */
export function ModernApplianceIcon({
  name,
  className = "w-11 h-11 sm:w-12 sm:h-12",
  dark = false,
}: ModernIconProps) {
  const uid = React.useId().replace(/:/g, "");

  const isCyanType = name === "aircon" || name === "fridge" || name === "showcase";
  const isTealType = name === "washer" || name === "kitchen" || name === "sparkle" || name === "shield";

  const primaryStroke = dark ? "#FFFFFF" : "#0E1A2B";
  const secondaryFill = dark ? "rgba(255,255,255,0.14)" : "#F1F4F9";
  const accentColor = isCyanType
    ? (dark ? "#38BDF8" : "#0284C7")
    : isTealType
    ? (dark ? "#2DD4BF" : "#0D9488")
    : (dark ? "#FF8A50" : "#D9531E");

  const glowClass = isCyanType
    ? (dark ? "bg-[#38BDF8]/25" : "bg-[#0284C7]/15")
    : isTealType
    ? (dark ? "bg-[#2DD4BF]/25" : "bg-[#0D9488]/15")
    : (dark ? "bg-[#FF8A50]/25" : "bg-[#B5431A]/15");

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      {/* 호버 시 은은하게 퍼지는 후면 앰비언트 광원 */}
      <span
        className={`pointer-events-none absolute inset-1 rounded-2xl opacity-0 blur-md transition-all duration-300 group-hover:opacity-100 group-hover:scale-110 ${glowClass}`}
      />

      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.06]"
      >
        <defs>
          <linearGradient
            id={`navyGrad-${uid}`}
            x1="8"
            y1="6"
            x2="40"
            y2="42"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={dark ? "#2A4365" : "#1E324F"} />
            <stop offset="1" stopColor={dark ? "#16263D" : "#0E1A2B"} />
          </linearGradient>
          <linearGradient
            id={`orangeGrad-${uid}`}
            x1="12"
            y1="10"
            x2="36"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FF8A50" />
            <stop offset="1" stopColor="#D9531E" />
          </linearGradient>
          {/* 아이스 시안 → 오션 블루 (냉각·냉기 계열: 에어컨, 냉장고, 쇼케이스) */}
          <linearGradient
            id={`cyanGrad-${uid}`}
            x1="12"
            y1="10"
            x2="36"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#0284C7" />
          </linearGradient>
          {/* 클린 민트 → 에메랄드 틸 (고압 살균·세척·보증 계열: 세탁기, 주방설비, 스파클, 쉴드) */}
          <linearGradient
            id={`tealGrad-${uid}`}
            x1="12"
            y1="10"
            x2="36"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#2DD4BF" />
            <stop offset="1" stopColor="#0D9488" />
          </linearGradient>
          <linearGradient
            id={`glassGrad-${uid}`}
            x1="10"
            y1="8"
            x2="38"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="1" stopColor="#E5E9F0" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* 0. 전체 실매물 쇼룸 그리드 */}
        {name === "all" && (
          <>
            <rect
              x="7"
              y="7"
              width="15"
              height="15"
              rx="3.5"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
            <rect
              x="26"
              y="7"
              width="15"
              height="15"
              rx="3.5"
              fill={`url(#orangeGrad-${uid})`}
              stroke={primaryStroke}
              strokeWidth="2.2"
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
            <rect
              x="7"
              y="26"
              width="15"
              height="15"
              rx="3.5"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
            <rect
              x="26"
              y="26"
              width="15"
              height="15"
              rx="3.5"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
          </>
        )}

        {/* 1. 에어컨 · 냉난방기 */}
        {name === "aircon" && (
          <>
            <rect
              x="5"
              y="9"
              width="38"
              height="18"
              rx="4.5"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
            <path
              d="M9 22H39"
              stroke={primaryStroke}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <rect
              x="32"
              y="13"
              width="6"
              height="3"
              rx="1.5"
              fill={accentColor}
            />
            <g className="transition-transform duration-300 group-hover:translate-y-1">
              <path
                d="M13 31C13 34 10 35.5 10 38.5"
                stroke={accentColor}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M24 31V39"
                stroke={accentColor}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M35 31C35 34 38 35.5 38 38.5"
                stroke={accentColor}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          </>
        )}

        {/* 2. 양문형 · 4도어 냉장고 */}
        {name === "fridge" && (
          <>
            <rect
              x="10"
              y="5"
              width="28"
              height="38"
              rx="4"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
            <path d="M24 5V43" stroke={primaryStroke} strokeWidth="2" />
            <path d="M10 26H38" stroke={primaryStroke} strokeWidth="2" />
            <rect
              x="14"
              y="11"
              width="5"
              height="7"
              rx="1.5"
              fill={`url(#cyanGrad-${uid})`}
            />
            <path
              d="M21.5 12V20M26.5 12V20"
              stroke={primaryStroke}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}

        {/* 3. 드럼세탁기 · 워시타워 */}
        {name === "washer" && (
          <>
            <rect
              x="9"
              y="5"
              width="30"
              height="38"
              rx="4.5"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
            <path d="M9 13H39" stroke={primaryStroke} strokeWidth="2" />
            <circle cx="15" cy="9" r="1.5" fill={accentColor} />
            <rect
              x="28"
              y="7.5"
              width="6"
              height="3"
              rx="1"
              fill={primaryStroke}
            />
            <g className="origin-[24px_28px] transition-transform duration-500 group-hover:rotate-45">
              <circle
                cx="24"
                cy="28"
                r="9.5"
                fill={`url(#glassGrad-${uid})`}
                stroke={primaryStroke}
                strokeWidth="2.2"
              />
              <path
                d="M17.5 28C19.5 25.5 22 25.5 24 28C26 30.5 28.5 30.5 30.5 28"
                stroke={accentColor}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          </>
        )}

        {/* 4. 주방 · 소형가전 */}
        {name === "small" && (
          <>
            <rect
              x="6"
              y="11"
              width="36"
              height="26"
              rx="4"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
            <rect
              x="10"
              y="15"
              width="21"
              height="18"
              rx="2.5"
              fill={`url(#glassGrad-${uid})`}
              stroke={primaryStroke}
              strokeWidth="2"
            />
            <circle cx="36.5" cy="19" r="2" fill={accentColor} />
            <circle cx="36.5" cy="26" r="2" fill={primaryStroke} />
            <path
              d="M16 24H25"
              stroke={accentColor}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </>
        )}

        {/* 5. 업소용 45박스 수직 냉장·냉동고 */}
        {name === "biz-fridge" && (
          <>
            <rect
              x="8"
              y="5"
              width="32"
              height="36"
              rx="3"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
            <path d="M8 11H40" stroke={primaryStroke} strokeWidth="2" />
            <rect
              x="21"
              y="7"
              width="6"
              height="2.5"
              rx="1"
              fill={accentColor}
            />
            <path d="M24 11V41" stroke={primaryStroke} strokeWidth="2" />
            <path d="M8 26H40" stroke={primaryStroke} strokeWidth="2" />
            <path
              d="M12 41V44M36 41V44"
              stroke={primaryStroke}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M21 16V21M27 16V21M21 31V36M27 31V36"
              stroke={accentColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}

        {/* 6. 음료 · 주류 · 디저트 쇼케이스 */}
        {name === "showcase" && (
          <>
            <rect
              x="10"
              y="5"
              width="28"
              height="38"
              rx="3.5"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
            <rect
              x="14"
              y="11"
              width="20"
              height="27"
              rx="2"
              fill={`url(#glassGrad-${uid})`}
              stroke={primaryStroke}
              strokeWidth="1.8"
            />
            <path
              d="M14 20H34M14 29H34"
              stroke={primaryStroke}
              strokeWidth="1.8"
            />
            <rect
              x="18"
              y="14"
              width="4"
              height="6"
              rx="1"
              fill={`url(#cyanGrad-${uid})`}
            />
            <rect
              x="25"
              y="23"
              width="4"
              height="6"
              rx="1"
              fill={`url(#cyanGrad-${uid})`}
            />
          </>
        )}

        {/* 7. 업소용 제빙기 · 식기세척기 · 주방설비 */}
        {name === "kitchen" && (
          <>
            <rect
              x="8"
              y="7"
              width="32"
              height="34"
              rx="4"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
            <path d="M8 16H40" stroke={primaryStroke} strokeWidth="2" />
            <rect
              x="15"
              y="22"
              width="7"
              height="7"
              rx="2"
              fill={`url(#tealGrad-${uid})`}
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            />
            <rect
              x="26"
              y="26"
              width="7"
              height="7"
              rx="2"
              fill={primaryStroke}
              className="transition-transform duration-300 group-hover:translate-y-0.5"
            />
            <circle cx="14" cy="11.5" r="1.5" fill={accentColor} />
            <circle cx="19" cy="11.5" r="1.5" fill={primaryStroke} />
          </>
        )}

        {/* 8. 가전 팔기 (당일 현금 방문매입) */}
        {name === "sell" && (
          <>
            <rect
              x="6"
              y="12"
              width="36"
              height="24"
              rx="4.5"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
            <circle
              cx="24"
              cy="24"
              r="6.5"
              fill={`url(#orangeGrad-${uid})`}
            />
            <path
              d="M21.5 23L23.5 25.5L27 21.5"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11 17H14M34 31H37"
              stroke={primaryStroke}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}

        {/* 9. 폐업 일괄 정리 · 방문 수거 트럭 */}
        {name === "closure" && (
          <>
            <path
              d="M5 14C5 12.3431 6.34315 11 8 11H29V33H5V14Z"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M29 18H37.5L43 24.5V33H29V18Z"
              fill={`url(#orangeGrad-${uid})`}
              stroke={primaryStroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <circle
              cx="14"
              cy="34"
              r="4.5"
              fill="#FFFFFF"
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
            <circle
              cx="35"
              cy="34"
              r="4.5"
              fill="#FFFFFF"
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
          </>
        )}

        {/* 10. 식당·카페 창업 맞춤 세팅 */}
        {name === "startup" && (
          <>
            <path
              d="M8 20V39C8 40.1046 8.89543 41 10 41H38C39.1046 41 40 40.1046 40 39V20"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
            />
            <path
              d="M5 19L9.5 9H38.5L43 19C43 21.5 40.5 23 38 23C35.5 23 33.5 21.5 33.5 19C33.5 21.5 31 23 28.5 23C26 23 24 21.5 24 19C24 21.5 21.5 23 19 23C16.5 23 14.5 21.5 14.5 19C14.5 21.5 12 23 9.5 23C7 23 5 21.5 5 19Z"
              fill={`url(#orangeGrad-${uid})`}
              stroke={primaryStroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <rect
              x="19"
              y="28"
              width="10"
              height="13"
              rx="1.5"
              fill="#FFFFFF"
              stroke={primaryStroke}
              strokeWidth="2"
            />
          </>
        )}

        {/* 11. 무상 A/S 책임 보증 쉴드 */}
        {name === "shield" && (
          <>
            <path
              d="M24 5L39 10.5V22.5C39 32.5 32.5 39.5 24 43C15.5 39.5 9 32.5 9 22.5V10.5L24 5Z"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M18 24L22.5 28.5L31 19.5"
              stroke={accentColor}
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* 12. 분해 고압 살균 세척 스파클 */}
        {name === "sparkle" && (
          <>
            <path
              d="M24 6L27.8 18.2L40 22L27.8 25.8L24 38L20.2 25.8L8 22L20.2 18.2L24 6Z"
              fill={`url(#tealGrad-${uid})`}
              stroke={primaryStroke}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M37 8L38.2 11.8L42 13L38.2 14.2L37 18L35.8 14.2L32 13L35.8 11.8L37 8Z"
              fill={primaryStroke}
            />
          </>
        )}

        {/* 13. 세금계산서 · 직배송 증빙 */}
        {name === "tax" && (
          <>
            <path
              d="M11 6H37V42L32.5 39L28 42L24 39L20 42L15.5 39L11 42V6Z"
              fill={secondaryFill}
              stroke={primaryStroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M17 15H31M17 21H27"
              stroke={primaryStroke}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="28"
              cy="29"
              r="5.5"
              fill={`url(#orangeGrad-${uid})`}
            />
            <path
              d="M25.8 29L27.3 30.5L30.5 27.5"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
    </div>
  );
}
