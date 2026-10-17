// 파일 경로: components/ui/interactive-effects.tsx
"use client";

import React, { useRef, useId } from "react";
import { STORE, telHref, smsHref } from "../../lib/site";

/**
 * 1. [Aceternity UI: Cards Blocks 차용] SpotlightCard
 * - 마우스 커서 위치를 추적하여 은은한 광원(Radial Spotlight)과 입체 테두리 하이라이트를 부여합니다.
 * - React state 리렌더링 없이 CSS 변수(--spot-x, --spot-y)를 직접 갱신해 60fps 성능을 유지합니다.
 */
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(217, 83, 30, 0.085)",
  as: Component = "div",
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  as?: "div" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--spot-x", `${x}px`);
    el.style.setProperty("--spot-y", `${y}px`);
  };

  return (
    <Component
      ref={ref as React.RefObject<never>}
      onMouseMove={handleMouseMove}
      style={
        {
          "--spot-color": spotlightColor,
        } as React.CSSProperties
      }
      className={`hb-spotlight-card relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card ${className}`}
    >
      <div
        aria-hidden="true"
        className="hb-spotlight-overlay pointer-events-none absolute -inset-px z-0 rounded-[inherit] opacity-0 transition-opacity duration-300"
      />
      <div className="relative z-10 flex h-full w-full flex-col justify-between">
        {children}
      </div>
    </Component>
  );
}

/**
 * 2. [Eldora UI: Font Weight Text 차용] InteractiveHeroHeadline
 * - 마우스 커서 근접도에 따라 글자의 두께(font-weight)와 입체감이 부드럽게 반응하는 인터랙티브 헤드라인
 * - 줄바꿈이나 레이아웃 흔들림(CLS)이 발생하지 않도록 고정 폭/트래킹 내에서 동작합니다.
 */
export function InteractiveHeroHeadline({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLSpanElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLSpanElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const chars = container.querySelectorAll<HTMLSpanElement>("[data-char]");
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const maxDist = 130;

    chars.forEach((charEl) => {
      const rect = charEl.getBoundingClientRect();
      const charX = rect.left + rect.width / 2;
      const charY = rect.top + rect.height / 2;
      const dist = Math.hypot(mouseX - charX, mouseY - charY);

      if (dist < maxDist) {
        const ratio = 1 - dist / maxDist;
        const translateY = -(ratio * 2.5);
        charEl.style.transform = `translateY(${translateY.toFixed(2)}px)`;
        charEl.style.color = ratio > 0.45 ? "#B83E0E" : "#D9531E";
        charEl.style.textShadow = `0 ${Math.round(ratio * 6)}px ${Math.round(ratio * 14)}px rgba(217, 83, 30, ${(ratio * 0.22).toFixed(2)})`;
      } else {
        charEl.style.transform = "translateY(0px)";
        charEl.style.color = "";
        charEl.style.textShadow = "none";
      }
    });
  };

  const handleMouseLeave = () => {
    const container = containerRef.current;
    if (!container) return;
    const chars = container.querySelectorAll<HTMLSpanElement>("[data-char]");
    chars.forEach((charEl) => {
      charEl.style.transform = "translateY(0px)";
      charEl.style.color = "";
      charEl.style.textShadow = "none";
    });
  };

  return (
    <span
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block cursor-default ${className}`}
    >
      {Array.from(text).map((ch, idx) =>
        ch === " " ? (
          <span key={idx}> </span>
        ) : (
          <span
            key={idx}
            data-char
            className="inline-block transition-[transform,color,text-shadow] duration-150 ease-out"
          >
            {ch}
          </span>
        )
      )}
    </span>
  );
}

/**
 * 3. [Bundui: Animated Beam 차용] AnimatedBeamFlow
 * - 고객의 멀티채널 접수(카톡·문자·온라인폼)가 한밭 직영 검수 데스크를 거쳐
 *   당일 방문 수거·현금 입금 및 직배송으로 이어지는 실시간 데이터/업무 파이프라인 시각화 컴포넌트
 */
export function AnimatedBeamFlow({
  onSelectInquiry,
}: {
  onSelectInquiry?: (type: string) => void;
}) {
  const uid = useId().replace(/:/g, "");

  return (
    <div className="mb-10 overflow-hidden rounded-2xl border border-[#E6E3DC] bg-white p-5 sm:p-6 lg:p-7 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[#E6E3DC]">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF5F0] border border-[#FADCD0] px-3 py-1 text-[12px] font-extrabold text-[#D9531E]">
            <span className="h-2 w-2 rounded-full bg-[#D9531E] animate-ping" />
            실시간 직영 연동 시스템
          </span>
          <h3 className="text-[16px] sm:text-[17.5px] font-extrabold text-[#0E1A2B] tracking-[-0.02em]">
            사진 한 장으로 끝나는 원스톱 접수 · 당일 처리 흐름
          </h3>
        </div>
        <p className="text-[12.5px] sm:text-[13px] font-semibold text-[#667085]">
          원하시는 채널을 클릭하면 바로 연결됩니다
        </p>
      </div>

      {/* 데스크톱: 좌(접수 채널 3종) ──⚡Animated SVG Beam──> 중(직영 데스크) ──⚡Animated SVG Beam──> 우(당일 실행 2종) */}
      <div className="relative mt-6">
        {/* 배경 SVG Animated Beams (lg 이상 데스크톱에서 노드 간 곡선 광선 연결) */}
        <svg
          viewBox="0 0 1000 220"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`beam-grad-1-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D9531E" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#D9531E" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0E1A2B" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id={`beam-grad-2-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0E1A2B" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#2563EB" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* 기본 가이드 트랙 선 */}
          <path
            d="M 270 38 C 350 38, 360 110, 430 110"
            stroke="#E6E3DC"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="M 270 110 L 430 110"
            stroke="#E6E3DC"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="M 270 182 C 350 182, 360 110, 430 110"
            stroke="#E6E3DC"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="M 570 110 C 640 110, 650 62, 730 62"
            stroke="#E6E3DC"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="M 570 110 C 640 110, 650 158, 730 158"
            stroke="#E6E3DC"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* 흐르는 빛줄기(Animated Beams) */}
          <path
            d="M 270 38 C 350 38, 360 110, 430 110"
            stroke={`url(#beam-grad-1-${uid})`}
            strokeWidth="3"
            strokeLinecap="round"
            className="hb-beam-path"
          />
          <path
            d="M 270 110 L 430 110"
            stroke={`url(#beam-grad-1-${uid})`}
            strokeWidth="3"
            strokeLinecap="round"
            className="hb-beam-path hb-beam-delay-1"
          />
          <path
            d="M 270 182 C 350 182, 360 110, 430 110"
            stroke={`url(#beam-grad-1-${uid})`}
            strokeWidth="3"
            strokeLinecap="round"
            className="hb-beam-path hb-beam-delay-2"
          />
          <path
            d="M 570 110 C 640 110, 650 62, 730 62"
            stroke={`url(#beam-grad-2-${uid})`}
            strokeWidth="3"
            strokeLinecap="round"
            className="hb-beam-path hb-beam-delay-1"
          />
          <path
            d="M 570 110 C 640 110, 650 158, 730 158"
            stroke={`url(#beam-grad-2-${uid})`}
            strokeWidth="3"
            strokeLinecap="round"
            className="hb-beam-path hb-beam-delay-2"
          />
        </svg>

        <div className="relative z-10 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center lg:gap-6">
          {/* 좌측: 3대 접수 채널 노드 */}
          <div className="flex flex-col gap-2.5 lg:col-span-4">
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-xl border border-[#E6E3DC] bg-[#FAF9F7] px-4 py-3 hover:border-[#0E1A2B] hover:bg-white transition-all shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FEE500] text-[14px] font-black text-[#191600]">
                  톡
                </span>
                <div>
                  <p className="text-[14px] font-extrabold text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors">
                    카카오톡 사진 전송
                  </p>
                  <p className="text-[12px] text-[#667085]">
                    모델명·외관 사진 1초 접수
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-bold text-[#D9531E] group-hover:translate-x-0.5 transition-transform">
                연결 →
              </span>
            </a>

            <a
              href={smsHref(
                STORE.mobile,
                "[한밭중고전자 문자상담] 제품 사진을 첨부하여 문의합니다."
              )}
              className="group flex items-center justify-between rounded-xl border border-[#E6E3DC] bg-[#FAF9F7] px-4 py-3 hover:border-[#0E1A2B] hover:bg-white transition-all shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E0F2FE] text-[15px] font-extrabold text-[#0369A1]">
                  ✉️
                </span>
                <div>
                  <p className="text-[14px] font-extrabold text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors">
                    직통 문자 ({STORE.mobile})
                  </p>
                  <p className="text-[12px] text-[#667085]">
                    카톡 없이 기본 문자앱 즉시 실행
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-bold text-[#0369A1] group-hover:translate-x-0.5 transition-transform">
                문자 →
              </span>
            </a>

            <button
              type="button"
              onClick={() => onSelectInquiry?.("내 물건 팔기")}
              className="group flex w-full items-center justify-between rounded-xl border border-[#E6E3DC] bg-[#FAF9F7] px-4 py-3 text-left hover:border-[#0E1A2B] hover:bg-white transition-all shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF5F0] text-[15px] font-extrabold text-[#D9531E]">
                  📋
                </span>
                <div>
                  <p className="text-[14px] font-extrabold text-[#0E1A2B] group-hover:text-[#D9531E] transition-colors">
                    온라인 통합 견적 폼
                  </p>
                  <p className="text-[12px] text-[#667085]">
                    단골 패키지 1초 자동 양식 채움
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-bold text-[#D9531E] group-hover:translate-x-0.5 transition-transform">
                작성 ↓
              </span>
            </button>
          </div>

          {/* 중앙 허브: 한밭 직영 검수 & 견적 데스크 */}
          <div className="flex flex-col items-center justify-center lg:col-span-4 py-2 lg:py-0">
            <div className="relative flex flex-col items-center rounded-2xl border-2 border-[#0E1A2B] bg-[#0E1A2B] px-5 py-5 text-center text-white shadow-card w-full max-w-[260px]">
              <span className="rounded-full bg-[#D9531E] px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                중간 유통 수수료 0원
              </span>
              <p className="mt-2 text-[17px] font-extrabold tracking-tight">
                한밭중고전자 직영 데스크
              </p>
              <p className="mt-1 text-[12px] text-white/80 leading-relaxed">
                전문 기사 연식·상태 즉시 판독
                <br />
                투명한 정찰 시세 산출
              </p>
              <a
                href={telHref(STORE.tel)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-[12.5px] font-extrabold text-[#FF8A50] hover:bg-white/25 transition-colors tabular-nums"
              >
                📞 {STORE.tel}
              </a>
            </div>
          </div>

          {/* 우측: 즉시 실행 결과 노드 2종 */}
          <div className="flex flex-col gap-3 lg:col-span-4">
            <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="rounded bg-[#166534] px-2 py-0.5 text-[11px] font-extrabold text-white">
                  방문 매입 · 폐업 정리
                </span>
                <span className="text-[12px] font-extrabold text-[#15803D]">
                  100% 당일 정산
                </span>
              </div>
              <p className="mt-2 text-[15px] font-extrabold text-[#0E1A2B]">
                원하는 날짜 방문 수거 · 즉시 입금
              </p>
              <p className="mt-0.5 text-[12.5px] text-[#434B59]">
                직접 분리·운반 후 현장에서 계좌로 즉시 송금합니다.
              </p>
            </div>

            <div className="rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="rounded bg-[#0369A1] px-2 py-0.5 text-[11px] font-extrabold text-white">
                  가전 구매 · 창업 납품
                </span>
                <span className="text-[12px] font-extrabold text-[#0369A1]">
                  최대 8개월 A/S
                </span>
              </div>
              <p className="mt-2 text-[15px] font-extrabold text-[#0E1A2B]">
                대전·충청 직배송 설치 및 무상 보증
              </p>
              <p className="mt-0.5 text-[12.5px] text-[#434B59]">
                분해 살균 세척 완료 제품만 출고하며 세금계산서를 발행합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
