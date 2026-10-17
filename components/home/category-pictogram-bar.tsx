"use client";

import React from "react";
import Link from "next/link";
import { trackEvent, type InquiryTypeValue } from "../../lib/site";

export type PictogramKey =
  | "aircon"
  | "fridge"
  | "washer"
  | "small"
  | "bizFridge"
  | "showcase"
  | "kitchen"
  | "sell"
  | "clearance"
  | "storePkg"
  | "certified";

/**
 * 아정당 스타일 소프트 3D 클레이/글로시 픽토그램 일러스트 (투명 배경 · 레티나 무손실)
 */
function Soft3DPictogram({ type }: { type: PictogramKey }) {
  switch (type) {
    /* 1. 에어컨 · 냉난방기 (시원한 블루 3D 바람 + 스탠드/벽걸이 에어컨) */
    case "aircon":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16 overflow-visible transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.06]" aria-hidden="true">
          <defs>
            <linearGradient id="ac-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#E6F2FF" />
              <stop offset="100%" stopColor="#C5DFFF" />
            </linearGradient>
            <linearGradient id="ac-vent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="ac-wind" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          {/* 바닥 소프트 그림자 */}
          <ellipse cx="32" cy="57" rx="18" ry="3.5" fill="#94A3B8" opacity="0.22" />
          {/* 3D 에어컨 본체 */}
          <rect x="8" y="12" width="48" height="24" rx="7" fill="#93C5FD" transform="translate(0, 2.5)" />
          <rect x="8" y="12" width="48" height="24" rx="7" fill="url(#ac-body)" stroke="#BFDBFE" strokeWidth="1" />
          {/* 상단 하이라이트 */}
          <path d="M15 15.5H49" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          {/* 원형 냉기 디스플레이 & 송풍구 */}
          <circle cx="46" cy="21" r="3.5" fill="url(#ac-vent)" />
          <circle cx="46" cy="21" r="1.4" fill="#E0F2FE" />
          <rect x="14" y="29" width="36" height="3.5" rx="1.75" fill="url(#ac-vent)" />
          {/* 3D 쿨링 바람 물결 */}
          <path
            d="M18 41C18 45.5 14 47.5 14 51"
            stroke="url(#ac-wind)"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M32 41C32 46.5 29 49 29 53"
            stroke="url(#ac-wind)"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M45 41C45 45.5 49 47.5 49 51"
            stroke="url(#ac-wind)"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* 눈꽃 포인트 */}
          <circle cx="22" cy="48" r="2" fill="#38BDF8" />
          <circle cx="40" cy="50" r="1.8" fill="#60A5FA" />
        </svg>
      );

    /* 2. 냉장고 · 김치냉장고 (프리미엄 4도어 3D 글로시 냉장고) */
    case "fridge":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16 overflow-visible transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.06]" aria-hidden="true">
          <defs>
            <linearGradient id="fr-left" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="fr-right" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <linearGradient id="fr-accent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="58" rx="16" ry="3.5" fill="#64748B" opacity="0.22" />
          {/* 3D 후면 입체 두께 */}
          <rect x="15" y="9" width="34" height="46" rx="6" fill="#64748B" transform="translate(2, 2)" opacity="0.35" />
          {/* 본체 베이스 */}
          <rect x="14" y="8" width="36" height="47" rx="6" fill="url(#fr-left)" stroke="#CBD5E1" strokeWidth="1" />
          {/* 우측 도어 음영 */}
          <path d="M32 8H44C47.3 8 50 10.7 50 14V49C50 52.3 47.3 55 44 55H32V8Z" fill="url(#fr-right)" opacity="0.65" />
          {/* 4도어 십자 분할선 */}
          <line x1="32" y1="9" x2="32" y2="54" stroke="#64748B" strokeWidth="1.6" />
          <line x1="15" y1="32" x2="49" y2="32" stroke="#64748B" strokeWidth="1.8" />
          {/* 아이스 디스펜서 & 핸들 */}
          <rect x="20" y="16" width="6" height="8" rx="2" fill="url(#fr-accent)" />
          <rect x="28.5" y="16" width="1.8" height="10" rx="0.9" fill="#475569" />
          <rect x="33.7" y="16" width="1.8" height="10" rx="0.9" fill="#475569" />
          <rect x="28.5" y="36" width="1.8" height="9" rx="0.9" fill="#475569" />
          <rect x="33.7" y="36" width="1.8" height="9" rx="0.9" fill="#475569" />
          {/* 상단 광택 */}
          <path d="M18 11.5H28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    /* 3. 세탁기 · 건조기 (아쿠아 드럼 윈도우 3D 세탁기) */
    case "washer":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16 overflow-visible transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.06]" aria-hidden="true">
          <defs>
            <linearGradient id="ws-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#EFF6FF" />
              <stop offset="100%" stopColor="#BFDBFE" />
            </linearGradient>
            <linearGradient id="ws-drum" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="ws-water" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="58" rx="17" ry="3.5" fill="#64748B" opacity="0.22" />
          <rect x="13" y="9" width="38" height="46" rx="8" fill="#93C5FD" transform="translate(1.5, 2.5)" />
          <rect x="13" y="9" width="38" height="46" rx="8" fill="url(#ws-body)" stroke="#BFDBFE" strokeWidth="1" />
          {/* 상단 컨트롤 패널 */}
          <line x1="14" y1="20" x2="50" y2="20" stroke="#DBEAFE" strokeWidth="1.5" />
          <rect x="18" y="13" width="10" height="4" rx="2" fill="#93C5FD" />
          <circle cx="43" cy="15" r="2.5" fill="#3B82F6" />
          {/* 3D 원형 도어 링 */}
          <circle cx="32" cy="37" r="12.5" fill="#CBD5E1" />
          <circle cx="32" cy="37" r="10" fill="url(#ws-drum)" />
          {/* 드럼 내부 물결 */}
          <path
            d="M23 38C25.5 35.5 29 39.5 32 37.5C35 35.5 38.5 39 41 37C40.5 42.5 36.7 46.5 32 46.5C27.3 46.5 23.5 42.5 23 38Z"
            fill="url(#ws-water)"
          />
          {/* 유리창 반사광 */}
          <path d="M26 30C27.5 28.5 30 28 32 28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
        </svg>
      );

    /* 4. 생활 · 소형가전 (따뜻한 오렌지 코랄 3D 오븐/전자레인지) */
    case "small":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16 overflow-visible transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.06]" aria-hidden="true">
          <defs>
            <linearGradient id="sm-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF7ED" />
              <stop offset="65%" stopColor="#FFEDD5" />
              <stop offset="100%" stopColor="#FDBA74" />
            </linearGradient>
            <linearGradient id="sm-win" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#9A3412" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="19" ry="3.5" fill="#9A3412" opacity="0.18" />
          {/* 다리 */}
          <rect x="14" y="48" width="5" height="4" rx="1.5" fill="#C2410C" />
          <rect x="45" y="48" width="5" height="4" rx="1.5" fill="#C2410C" />
          {/* 3D 본체 */}
          <rect x="9" y="17" width="46" height="32" rx="7" fill="#FB923C" transform="translate(1.5, 2)" />
          <rect x="9" y="17" width="46" height="32" rx="7" fill="url(#sm-body)" stroke="#FED7AA" strokeWidth="1" />
          {/* 전면 조리창 */}
          <rect x="14" y="22" width="26" height="21" rx="4" fill="url(#sm-win)" />
          {/* 내부 따뜻한 조리 빛 */}
          <path d="M19 36C21 32 33 32 35 36" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <path d="M17 25H25" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
          {/* 우측 다이얼 노브 */}
          <circle cx="47" cy="27" r="3" fill="#EA580C" />
          <circle cx="47" cy="36" r="3" fill="#FB923C" />
          <rect x="44" y="42" width="6" height="2.2" rx="1.1" fill="#C2410C" />
        </svg>
      );

    /* 5. 업소용 냉장고 (45박스 스텐 4도어 + 디지털 온도창) */
    case "bizFridge":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16 overflow-visible transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.06]" aria-hidden="true">
          <defs>
            <linearGradient id="bf-steel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
            <linearGradient id="bf-head" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0E1A2B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#475569" opacity="0.24" />
          <rect x="12" y="8" width="40" height="47" rx="5" fill="#475569" transform="translate(2, 2)" opacity="0.4" />
          <rect x="12" y="8" width="40" height="47" rx="5" fill="url(#bf-steel)" stroke="#94A3B8" strokeWidth="1" />
          {/* 상단 기계실 패널 & 온도계 */}
          <rect x="12" y="8" width="40" height="9" rx="4" fill="url(#bf-head)" />
          <rect x="27" y="10.5" width="10" height="4" rx="1.5" fill="#10B981" />
          {/* 4도어 분할 */}
          <line x1="32" y1="17" x2="32" y2="55" stroke="#475569" strokeWidth="1.6" />
          <line x1="12" y1="36" x2="52" y2="36" stroke="#475569" strokeWidth="1.6" />
          {/* 매립형 손잡이 */}
          <rect x="28" y="23" width="2" height="7" rx="1" fill="#1E293B" />
          <rect x="34" y="23" width="2" height="7" rx="1" fill="#1E293B" />
          <rect x="28" y="41" width="2" height="7" rx="1" fill="#1E293B" />
          <rect x="34" y="41" width="2" height="7" rx="1" fill="#1E293B" />
        </svg>
      );

    /* 6. 쇼케이스 · 제빙기 (유리문 음료 쇼케이스 & 얼음 큐브) */
    case "showcase":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16 overflow-visible transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.06]" aria-hidden="true">
          <defs>
            <linearGradient id="sc-glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#7DD3FC" />
            </linearGradient>
            <linearGradient id="sc-frame" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="58" rx="16" ry="3.5" fill="#475569" opacity="0.22" />
          {/* 쇼케이스 프레임 */}
          <rect x="15" y="8" width="34" height="47" rx="6" fill="url(#sc-frame)" />
          {/* 상단 간판 라이트 */}
          <rect x="18" y="11" width="28" height="5" rx="2" fill="#FF8A50" />
          {/* 유리 진열창 */}
          <rect x="18" y="18" width="28" height="33" rx="3" fill="url(#sc-glass)" />
          {/* 선반 2단 */}
          <line x1="18" y1="29" x2="46" y2="29" stroke="#0284C7" strokeWidth="1.5" />
          <line x1="18" y1="40" x2="46" y2="40" stroke="#0284C7" strokeWidth="1.5" />
          {/* 진열 음료 & 얼음 */}
          <rect x="22" y="22" width="4" height="6" rx="1.5" fill="#F97316" />
          <rect x="29" y="21" width="4" height="7" rx="1.5" fill="#10B981" />
          <rect x="36" y="22" width="4" height="6" rx="1.5" fill="#3B82F6" />
          <rect x="23" y="33" width="5" height="6" rx="1.5" fill="#FFFFFF" opacity="0.9" />
          <rect x="31" y="33" width="5" height="6" rx="1.5" fill="#FFFFFF" opacity="0.9" />
          {/* 유리 하이라이트 */}
          <path d="M21 21L26 47" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
        </svg>
      );

    /* 7. 식기세척 · 주방기기 (업소용 스텐 세척기/작업대 & 클린 식기) */
    case "kitchen":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16 overflow-visible transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.06]" aria-hidden="true">
          <defs>
            <linearGradient id="kt-plate" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#DBEAFE" />
            </linearGradient>
            <linearGradient id="kt-rack" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="57" rx="18" ry="3.5" fill="#64748B" opacity="0.22" />
          {/* 3D 원형 식기 플레이트 */}
          <circle cx="30" cy="30" r="17" fill="#93C5FD" transform="translate(1.5, 2)" />
          <circle cx="30" cy="30" r="17" fill="url(#kt-plate)" stroke="#BFDBFE" strokeWidth="1.5" />
          <circle cx="30" cy="30" r="11" fill="none" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* 하단 업소용 세척 랙 */}
          <rect x="12" y="42" width="40" height="11" rx="4" fill="url(#kt-rack)" />
          <line x1="20" y1="44" x2="20" y2="51" stroke="#EFF6FF" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="44" x2="28" y2="51" stroke="#EFF6FF" strokeWidth="2" strokeLinecap="round" />
          <line x1="36" y1="44" x2="36" y2="51" stroke="#EFF6FF" strokeWidth="2" strokeLinecap="round" />
          <line x1="44" y1="44" x2="44" y2="51" stroke="#EFF6FF" strokeWidth="2" strokeLinecap="round" />
          {/* 반짝임 스파클 */}
          <path d="M48 14L50 19L55 21L50 23L48 28L46 23L41 21L46 19L48 14Z" fill="#F59E0B" />
        </svg>
      );

    /* 8. 내 가전 팔기 (당일 현금 정산 3D 골드 코인 & 매입 보드) */
    case "sell":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16 overflow-visible transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.06]" aria-hidden="true">
          <defs>
            <linearGradient id="sl-card" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="sl-coin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="55%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="57" rx="18" ry="3.5" fill="#64748B" opacity="0.22" />
          {/* 뒤쪽 정산 카드 */}
          <rect
            x="10"
            y="18"
            width="36"
            height="25"
            rx="5"
            transform="rotate(-8 28 30)"
            fill="url(#sl-card)"
          />
          <rect
            x="14"
            y="24"
            width="9"
            height="6"
            rx="1.5"
            transform="rotate(-8 18 27)"
            fill="#FBBF24"
          />
          {/* 전면 골드 코인 (당일 현금 정산 상징) */}
          <circle cx="43" cy="39" r="13" fill="#B45309" transform="translate(1, 2)" />
          <circle cx="43" cy="39" r="13" fill="url(#sl-coin)" stroke="#FEF08A" strokeWidth="1.5" />
          {/* 원화(₩) / P 심볼 */}
          <path
            d="M38 35L40.5 43L43 37L45.5 43L48 35M37 39H49"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );

    /* 9. 폐업 일괄정리 (방문 철거·수거 3D 박스 & 픽업 카트) */
    case "clearance":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16 overflow-visible transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.06]" aria-hidden="true">
          <defs>
            <linearGradient id="cl-box" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id="cl-top" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFEDD5" />
              <stop offset="100%" stopColor="#FED7AA" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="57" rx="17" ry="3.5" fill="#9A3412" opacity="0.2" />
          {/* 아정당 '이사' 스타일 3D 입체 패키지 박스 */}
          <path d="M14 23L32 14L50 23V46L32 54L14 46V23Z" fill="url(#cl-box)" />
          <path d="M14 23L32 14L50 23L32 31L14 23Z" fill="url(#cl-top)" />
          <path d="M32 31V54L50 46V23L32 31Z" fill="#C2410C" opacity="0.55" />
          {/* 테이프 디테일 */}
          <path d="M23 18.5L41 27V35L32 39V31L23 18.5Z" fill="#FEF3C7" opacity="0.9" />
        </svg>
      );

    /* 10. 창업 · 매장패키지 (아정당 '매장패키지' 스타일 3D 어닝 스토어) */
    case "storePkg":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16 overflow-visible transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.06]" aria-hidden="true">
          <defs>
            <linearGradient id="st-wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>
            <linearGradient id="st-roof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="57" rx="19" ry="3.5" fill="#92400E" opacity="0.2" />
          {/* 매장 벽체 */}
          <rect x="14" y="26" width="36" height="27" rx="4" fill="url(#st-wall)" stroke="#FCD34D" strokeWidth="1" />
          {/* 매장 출입문 & 쇼윈도 */}
          <rect x="20" y="34" width="10" height="19" rx="2" fill="#F59E0B" />
          <rect x="34" y="34" width="11" height="11" rx="2" fill="#38BDF8" opacity="0.85" />
          {/* 스트라이프 3D 어닝 지붕 */}
          <path d="M11 26L16 14H48L53 26H11Z" fill="url(#st-roof)" />
          <path d="M21 14L19 26H27L28 14H21Z" fill="#FFFFFF" />
          <path d="M36 14L37 26H45L43 14H36Z" fill="#FFFFFF" />
          {/* 어닝 물결 하단 */}
          <circle cx="15" cy="26" r="4" fill="#DC2626" />
          <circle cx="23" cy="26" r="4" fill="#F8FAFC" />
          <circle cx="32" cy="26" r="4" fill="#DC2626" />
          <circle cx="41" cy="26" r="4" fill="#F8FAFC" />
          <circle cx="49" cy="26" r="4" fill="#DC2626" />
        </svg>
      );

    /* 11. 배송 · 설치인증 (아정당 '보험/인증' 스타일 3D 블루 쉴드) */
    case "certified":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16 overflow-visible transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.06]" aria-hidden="true">
          <defs>
            <linearGradient id="ct-shield" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="55%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="58" rx="15" ry="3.5" fill="#1E3A8A" opacity="0.22" />
          {/* 3D 방패 본체 */}
          <path
            d="M32 10L50 17V31C50 43.5 42.2 51.8 32 55C21.8 51.8 14 43.5 14 31V17L32 10Z"
            fill="#1E40AF"
            transform="translate(1.5, 2)"
          />
          <path
            d="M32 10L50 17V31C50 43.5 42.2 51.8 32 55C21.8 51.8 14 43.5 14 31V17L32 10Z"
            fill="url(#ct-shield)"
            stroke="#93C5FD"
            strokeWidth="1.2"
          />
          {/* 내부 방패 테두리 */}
          <path
            d="M32 15L45 20.2V30.8C45 40.2 39.3 46.8 32 49.5C24.7 46.8 19 40.2 19 30.8V20.2L32 15Z"
            fill="#93C5FD"
            opacity="0.25"
          />
          {/* 화이트 3D 체크 마크 */}
          <path
            d="M25 32.5L30 37.5L40 26.5"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );
  }
}

interface QuickMenuItem {
  key: PictogramKey;
  label: string;
  subLabel?: string;
  href?: string;
  inquiryType?: InquiryTypeValue;
}

interface QuickMenuGroup {
  id: string;
  badgeText: string;
  badgeBgClass: string;
  items: QuickMenuItem[];
}

const QUICK_GROUPS: QuickMenuGroup[] = [
  {
    id: "home-appliances",
    badgeText: "무상 A/S + 살균세척",
    badgeBgClass: "bg-[#D9531E] text-white shadow-2xs",
    items: [
      {
        key: "aircon",
        label: "에어컨",
        href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
      },
      {
        key: "fridge",
        label: "냉장고",
        href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
      },
      {
        key: "washer",
        label: "세탁기",
        href: "/gallery?category=%EC%84%B8%ED%83%81%EA%B8%B0%2F%EA%B1%B4%EC%A1%B0%EA%B8%B0",
      },
      {
        key: "small",
        label: "소형가전",
        href: "/gallery?category=%EC%A3%BC%EB%B0%A9%2F%EC%86%8C%ED%98%95%EA%B0%80%EC%A0%84",
      },
    ],
  },
  {
    id: "commercial-equip",
    badgeText: "식당·카페 설비",
    badgeBgClass: "bg-[#0E1A2B] text-white shadow-2xs",
    items: [
      {
        key: "bizFridge",
        label: "업소용냉장",
        href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EB%83%89%EC%9E%A5",
      },
      {
        key: "showcase",
        label: "쇼케이스",
        href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0&q=%EC%87%BC%EC%BC%80%EC%9D%B4%EC%8A%A4",
      },
      {
        key: "kitchen",
        label: "주방설비",
        href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
      },
    ],
  },
  {
    id: "all-services",
    badgeText: "방문매입 · 원스톱",
    badgeBgClass: "bg-[#64748B] text-white shadow-2xs",
    items: [
      {
        key: "sell",
        label: "가전팔기",
        inquiryType: "내 물건 팔기",
      },
      {
        key: "clearance",
        label: "폐업정리",
        href: "/purchase",
      },
      {
        key: "storePkg",
        label: "창업상담",
        inquiryType: "대량·업소용 상담",
      },
      {
        key: "certified",
        label: "배송후기",
        href: "#reviews",
      },
    ],
  },
];

export function CategoryPictogramBar({
  onSelectInquiry,
}: {
  onSelectInquiry: (type: InquiryTypeValue) => void;
}) {
  const [hoveredKey, setHoveredKey] = React.useState<PictogramKey | null>(null);

  return (
    <section
      id="category-section"
      aria-label="취급 품목 및 주요 서비스 바로가기"
      className="bg-white border-b border-[#E6E3DC] pt-8 pb-7 sm:pt-9 sm:pb-8"
    >
      <div className="hb-container">
        {/* 데스크톱(lg 이상): 4 : 3 : 4 비례 분할로 11개 아이템의 가로폭 균일화 / 모바일·태블릿: 스택 카드 */}
        <div
          className="flex flex-col lg:flex-row gap-6 lg:gap-4 items-stretch"
          onMouseLeave={() => setHoveredKey(null)}
        >
          {QUICK_GROUPS.map((group) => {
            const flexBasisClass =
              group.id === "home-appliances"
                ? "lg:flex-[4]"
                : group.id === "commercial-equip"
                ? "lg:flex-[3]"
                : "lg:flex-[4]";

            const gridColsClass =
              group.items.length === 3 ? "grid-cols-3" : "grid-cols-4";

            return (
              <div
                key={group.id}
                className={`relative rounded-[24px] bg-[#F4F6FA] border border-[#E5E9F2] px-3 sm:px-5 pt-7 pb-4 sm:pb-5 flex flex-col justify-center min-w-0 transition-colors hover:border-[#D7D2C8] ${flexBasisClass}`}
              >
                {/* 상단 좌측 플로팅 캡슐 배지 (아정당 스타일) */}
                <span
                  className={`absolute -top-3.5 left-4 sm:left-5 inline-flex items-center rounded-full px-3 sm:px-3.5 py-1 text-[11.5px] sm:text-[12.5px] font-extrabold tracking-[-0.01em] whitespace-nowrap ${group.badgeBgClass}`}
                >
                  {group.badgeText}
                </span>

                <ul className={`grid ${gridColsClass} gap-1.5 sm:gap-2 items-center`}>
                  {group.items.map((item) => {
                    const isHovered = hoveredKey === item.key;
                    const content = (
                      <>
                        {/* [React Bits: Flowing Menu 차용] 유체형 하이라이트 밴드 배경 */}
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute inset-0 rounded-2xl border transition-all duration-250 ease-out ${
                            isHovered
                              ? "scale-100 border-[#E6E3DC] bg-white opacity-100 shadow-card"
                              : "scale-95 border-transparent bg-white/0 opacity-0"
                          }`}
                        />
                        <div className="relative z-10 flex flex-col items-center">
                          <Soft3DPictogram type={item.key} />
                          <span className="mt-1.5 text-center text-[13.5px] sm:text-[15px] font-extrabold tracking-[-0.02em] text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors whitespace-nowrap">
                            {item.label}
                          </span>
                          {/* 하단 유체형 액티브 인디케이터 바 */}
                          <span
                            aria-hidden="true"
                            className={`mt-1 h-1 rounded-full bg-[#D9531E] transition-all duration-250 ease-out ${
                              isHovered ? "w-6 opacity-100" : "w-0 opacity-0"
                            }`}
                          />
                        </div>
                      </>
                    );

                    if (item.inquiryType) {
                      return (
                        <li
                          key={item.key}
                          className="min-w-0"
                          onMouseEnter={() => setHoveredKey(item.key)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              trackEvent("begin_buyback_inquiry", {
                                category: item.label,
                                location: "top_pictogram_bar",
                              });
                              onSelectInquiry(item.inquiryType!);
                            }}
                            className="group relative flex w-full flex-col items-center justify-center py-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer"
                          >
                            {content}
                          </button>
                        </li>
                      );
                    }

                    return (
                      <li
                        key={item.key}
                        className="min-w-0"
                        onMouseEnter={() => setHoveredKey(item.key)}
                      >
                        <Link
                          href={item.href || "/gallery"}
                          onClick={() =>
                            trackEvent("filter_gallery", {
                              category: item.label,
                              location: "top_pictogram_bar",
                            })
                          }
                          className="group relative flex w-full flex-col items-center justify-center py-2.5 rounded-2xl transition-all active:scale-95"
                        >
                          {content}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
