"use client";

import React from "react";

/**
 * 카카오뱅크 Answer 스타일 팝아트 아이소메트릭 2.5D/3D 일러스트 컴포넌트
 * - 특징: 또렷한 블랙 아웃라인(#111827, strokeWidth 2.2) + 파스텔 컬러 블록(#7DD3FC, #F9A8D4, #FDE047, #86EFAC, #C4B5FD)
 */

export function BuybackStepIllustration({ step }: { step: 1 | 2 | 3 | 4 }) {
  switch (step) {
    /* 1단계: 스마트폰으로 사진·품목 접수 (스카이블루 파스텔) */
    case 1:
      return (
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7DD3FC] border-2 border-[#111827] shadow-[3px_3px_0px_#111827] overflow-hidden">
          <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
            {/* 배경 반짝이 */}
            <path
              d="M12 16L14 11L16 16L21 18L16 20L14 25L12 20L7 18L12 16Z"
              fill="#FDE047"
              stroke="#111827"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* 아이소메트릭 스마트폰 입체 두께 */}
            <rect
              x="22"
              y="13"
              width="24"
              height="38"
              rx="5"
              transform="rotate(-8 34 32)"
              fill="#F472B6"
              stroke="#111827"
              strokeWidth="2.2"
            />
            {/* 스마트폰 전면 */}
            <rect
              x="19"
              y="11"
              width="24"
              height="38"
              rx="5"
              transform="rotate(-8 31 30)"
              fill="#FFFFFF"
              stroke="#111827"
              strokeWidth="2.2"
            />
            {/* 액정 화면 */}
            <rect
              x="22"
              y="16"
              width="18"
              height="26"
              rx="2.5"
              transform="rotate(-8 31 29)"
              fill="#A7F3D0"
              stroke="#111827"
              strokeWidth="1.8"
            />
            {/* 카메라 뷰파인더 속 미니 냉장고 */}
            <rect
              x="27"
              y="20"
              width="8"
              height="16"
              rx="1.5"
              transform="rotate(-8 31 28)"
              fill="#FDE047"
              stroke="#111827"
              strokeWidth="1.8"
            />
            <line
              x1="27"
              y1="27"
              x2="35"
              y2="26"
              stroke="#111827"
              strokeWidth="1.8"
            />
            {/* 셔터 버튼 */}
            <circle
              cx="33"
              cy="45"
              r="2.2"
               fill="#F43F5E"
              stroke="#111827"
              strokeWidth="1.6"
            />
          </svg>
        </div>
      );

    /* 2단계: 매입 가능 여부 및 가견적 안내 (핑크 파스텔) */
    case 2:
      return (
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#F9A8D4] border-2 border-[#111827] shadow-[3px_3px_0px_#111827] overflow-hidden">
          <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
            {/* 견적 보드 입체 그림자 */}
            <rect
              x="15"
              y="17"
              width="28"
              height="34"
              rx="4"
              fill="#60A5FA"
              stroke="#111827"
              strokeWidth="2.2"
            />
            {/* 견적서 본체 */}
            <rect
              x="12"
              y="14"
              width="28"
              height="34"
              rx="4"
              fill="#FEF08A"
              stroke="#111827"
              strokeWidth="2.2"
            />
            {/* 체크 라인 */}
            <path
              d="M18 24H34M18 31H30M18 38H26"
              stroke="#111827"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* 우측 상단 OK 말풍선 */}
            <rect
              x="32"
              y="10"
              width="22"
              height="16"
              rx="8"
              fill="#4ADE80"
              stroke="#111827"
              strokeWidth="2.2"
            />
            <path
              d="M39 18L42 21L48 15"
              fill="none"
              stroke="#111827"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    /* 3단계: 방문 수거 일정 조율 (민트 그린 파스텔) */
    case 3:
      return (
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#86EFAC] border-2 border-[#111827] shadow-[3px_3px_0px_#111827] overflow-hidden">
          <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
            {/* 트럭 화물칸 */}
            <rect
              x="10"
              y="20"
              width="26"
              height="22"
              rx="4"
              fill="#60A5FA"
              stroke="#111827"
              strokeWidth="2.2"
            />
            {/* 트럭 운전석 */}
            <path
              d="M36 26H47L53 34V42H36V26Z"
              fill="#FDE047"
              stroke="#111827"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* 운전석 창문 */}
            <path
              d="M39 29H45.5L49.5 34H39V29Z"
              fill="#FFFFFF"
              stroke="#111827"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* 바퀴 2개 */}
            <circle
              cx="21"
              cy="44"
              r="5.5"
              fill="#F472B6"
              stroke="#111827"
              strokeWidth="2.2"
            />
            <circle cx="21" cy="44" r="2" fill="#FFFFFF" />
            <circle
              cx="44"
              cy="44"
              r="5.5"
              fill="#F472B6"
              stroke="#111827"
              strokeWidth="2.2"
            />
            <circle cx="44" cy="44" r="2" fill="#FFFFFF" />
          </svg>
        </div>
      );

    /* 4단계: 현장 확인 및 당일 현금 정산 (옐로우/오렌지 파스텔) */
    case 4:
      return (
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#FDE047] border-2 border-[#111827] shadow-[3px_3px_0px_#111827] overflow-hidden">
          <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
            {/* 토스터/지갑 슬롯 베이스 (카카오뱅크 오마주) */}
            <rect
              x="14"
              y="28"
              width="36"
              height="22"
              rx="6"
              fill="#C4B5FD"
              stroke="#111827"
              strokeWidth="2.2"
            />
            {/* 솟아오르는 골드 원화 코인 2개 */}
            <circle
              cx="26"
              cy="22"
              r="10"
              fill="#FB923C"
              stroke="#111827"
              strokeWidth="2.2"
            />
            <circle
              cx="38"
              cy="20"
              r="11"
              fill="#FACC15"
              stroke="#111827"
              strokeWidth="2.2"
            />
            {/* 원화(₩) 마크 */}
            <path
              d="M34 16L36 24L38 18L40 24L42 16M33 20H43"
              fill="none"
              stroke="#111827"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 전면 입금 완료 슬롯 */}
            <rect
              x="22"
              y="36"
              width="20"
              height="6"
              rx="3"
              fill="#4ADE80"
              stroke="#111827"
              strokeWidth="1.8"
            />
          </svg>
        </div>
      );
  }
}

export function UspPopIllustration({ index }: { index: number }) {
  switch (index) {
    /* 01. 분해 고압 살균 세척 — 카카오뱅크 게이지/버블 오마주 */
    case 0:
      return (
        <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-[#7DD3FC] border-2 border-[#111827] shadow-[2.5px_2.5px_0px_#111827]">
          <svg viewBox="0 0 80 56" className="h-12 w-18" aria-hidden="true">
            {/* 컬러풀 반원 클린 게이지 */}
            <path
              d="M16 42 A24 24 0 0 1 64 42"
              fill="none"
              stroke="#111827"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M16 42 A24 24 0 0 1 32 20"
              fill="none"
              stroke="#F472B6"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M32 20 A24 24 0 0 1 50 20"
              fill="none"
              stroke="#FDE047"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M50 20 A24 24 0 0 1 64 42"
              fill="none"
              stroke="#4ADE80"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* 100% 살균 바늘 */}
            <line
              x1="40"
              y1="42"
              x2="56"
              y2="24"
              stroke="#111827"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle
              cx="40"
              cy="42"
              r="5"
              fill="#FDE047"
              stroke="#111827"
              strokeWidth="2.2"
            />
          </svg>
        </div>
      );

    /* 02. 최대 8개월 무상 A/S 보증 — 3D 방패 & 안심 체크 */
    case 1:
      return (
        <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-[#F9A8D4] border-2 border-[#111827] shadow-[2.5px_2.5px_0px_#111827]">
          <svg viewBox="0 0 80 56" className="h-12 w-18" aria-hidden="true">
            <path
              d="M40 8L60 15V28C60 39 51 46 40 50C29 46 20 39 20 28V15L40 8Z"
              fill="#60A5FA"
              stroke="#111827"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <path
              d="M33 28L38 33L48 22"
              fill="none"
              stroke="#FDE047"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    /* 03. 대전 직영 매장 상시 전시 — 귀여운 쇼룸 빌딩 */
    case 2:
      return (
        <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-[#FDE68A] border-2 border-[#111827] shadow-[2.5px_2.5px_0px_#111827]">
          <svg viewBox="0 0 80 56" className="h-12 w-18" aria-hidden="true">
            <rect
              x="20"
              y="20"
              width="40"
              height="28"
              rx="3"
              fill="#FFFFFF"
              stroke="#111827"
              strokeWidth="2.2"
            />
            <path
              d="M16 22L22 11H58L64 22H16Z"
              fill="#FB923C"
              stroke="#111827"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <rect
              x="26"
              y="28"
              width="12"
              height="20"
              fill="#7DD3FC"
              stroke="#111827"
              strokeWidth="2"
            />
            <rect
              x="42"
              y="28"
              width="12"
              height="12"
              fill="#F9A8D4"
              stroke="#111827"
              strokeWidth="2"
            />
          </svg>
        </div>
      );

    /* 04. 전문 기사 직접 배송·설치 — 민트 키캡/배송 트럭 */
    case 3:
      return (
        <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-[#A7F3D0] border-2 border-[#111827] shadow-[2.5px_2.5px_0px_#111827]">
          <svg viewBox="0 0 80 56" className="h-12 w-18" aria-hidden="true">
            <rect
              x="16"
              y="16"
              width="28"
              height="22"
              rx="4"
              fill="#FDE047"
              stroke="#111827"
              strokeWidth="2.2"
            />
            <path
              d="M44 22H56L62 30V38H44V22Z"
              fill="#60A5FA"
              stroke="#111827"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <circle
              cx="27"
              cy="40"
              r="5"
              fill="#F472B6"
              stroke="#111827"
              strokeWidth="2.2"
            />
            <circle
              cx="52"
              cy="40"
              r="5"
              fill="#F472B6"
              stroke="#111827"
              strokeWidth="2.2"
            />
          </svg>
        </div>
      );

    /* 05. 가정용·업소용 원스톱 매입 — 카카오뱅크 저울 일러스트 오마주 */
    default:
      return (
        <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-[#DDD6FE] border-2 border-[#111827] shadow-[2.5px_2.5px_0px_#111827]">
          <svg viewBox="0 0 80 56" className="h-12 w-18" aria-hidden="true">
            {/* 저울 중심축 */}
            <path
              d="M32 46H48L43 30H37L32 46Z"
              fill="#F472B6"
              stroke="#111827"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* 저울 수평대 */}
            <line
              x1="18"
              y1="28"
              x2="62"
              y2="24"
              stroke="#111827"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* 좌측 가전 박스 */}
            <rect
              x="14"
              y="14"
              width="14"
              height="14"
              rx="2"
              fill="#4ADE80"
              stroke="#111827"
              strokeWidth="2"
            />
            {/* 우측 골드 코인 */}
            <circle
              cx="58"
              cy="15"
              r="7.5"
              fill="#FDE047"
              stroke="#111827"
              strokeWidth="2"
            />
          </svg>
        </div>
      );
  }
}
