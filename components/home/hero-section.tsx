"use client";

import React, { useState } from "react";
import Link from "next/link";
import { STORE, telHref } from "../../lib/site";
import { Icon, ICON, SafeImg } from "../../lib/ui";

const SHOWROOM_SLIDES = [
  {
    src: "/main-bg.png",
    caption: "대전 중촌동 오프라인 매장 · 가정용 및 업소용 설비 상시 전시",
  },
  {
    src: "/main-bg2.png",
    caption: "입고 후 분해 세척 · 작동 점검을 마친 제품만 출고합니다",
  },
  {
    src: "/main-bg3.png",
    caption: "단품 배송부터 식당·카페 창업 및 폐업 대량 거래까지 상담",
  },
] as const;

export function HeroSection({
  onOpenInquiry,
}: {
  onOpenInquiry: (type: "구매 문의" | "내 물건 팔기") => void;
}) {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <section
      aria-labelledby="hero-heading"
      className="border-b border-[#E4E0D8] bg-[#0E1A2B] text-white"
    >
      <div className="hb-container py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* 좌측: 핵심 브랜드 메시지 및 전환 CTA */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-semibold tracking-wide text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D9531E]" aria-hidden="true" />
              <span>SINCE {STORE.since} · 대전 중촌동 오프라인 매장 직접 운영</span>
            </div>

            <h1
              id="hero-heading"
              className="mt-5 text-[30px] font-bold leading-[1.22] tracking-[-0.025em] text-white sm:text-[40px] lg:text-[44px]"
            >
              가정용 가전부터
              <br />
              업소용 주방기기까지,
              <br />
              <span className="text-[#FF8A50]">
                필요한 제품과 매입 상담을 한곳에서.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-[1.75] text-white/80 sm:text-[16px]">
              {STORE.name}는 {STORE.since}년부터 냉장고·세탁기·에어컨·냉난방기와 식당·카페용 냉장·주방 설비를 전문으로 취급해 왔습니다. 세척과 검수를 마친 실매물 확인부터 방문 매입 견적까지 투명하게 안내합니다.
            </p>

            {/* 핵심 전환 버튼 2개 */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/gallery"
                className="hb-btn-accent h-[52px] px-7 text-[15px] sm:text-[16px]"
              >
                <span>판매 제품 둘러보기</span>
                <Icon d={ICON.arrow} className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => onOpenInquiry("내 물건 팔기")}
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-md border border-white/30 bg-white/10 px-7 text-[15px] font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-[16px]"
              >
                <span>무료 매입 견적 문의</span>
              </button>
            </div>

            {/* 확인된 매장 연락처 및 영업시간 요약 */}
            <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-y-2 gap-x-6 text-[13px] sm:text-[14px] text-white/80">
              <div className="flex items-center gap-2">
                <Icon d={ICON.phone} className="w-4 h-4 text-[#FF8A50]" />
                <span>대표 상담전화</span>
                <a
                  href={telHref(STORE.tel)}
                  className="font-bold text-white underline underline-offset-4 hover:text-[#FF8A50]"
                >
                  {STORE.tel}
                </a>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Icon d={ICON.clock} className="w-4 h-4 text-white/50" />
                <span>
                  {STORE.hours} ({STORE.closed})
                </span>
              </div>
            </div>
          </div>

          {/* 우측: 제품/매장 형태가 왜곡되지 않는 쇼룸 포토 프레임 */}
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-md border border-white/15 bg-[#162438] shadow-2xl">
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#0B1522]">
                <SafeImg
                  src={SHOWROOM_SLIDES[activeSlide].src}
                  alt={SHOWROOM_SLIDES[activeSlide].caption}
                  eager
                  className="h-full w-full object-cover object-center"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#122033] px-4 py-3.5 border-t border-white/10">
                <p className="text-[13px] font-medium text-white/85">
                  {SHOWROOM_SLIDES[activeSlide].caption}
                </p>
                <div
                  className="flex items-center gap-1.5 shrink-0"
                  role="tablist"
                  aria-label="매장 사진 선택"
                >
                  {SHOWROOM_SLIDES.map((slide, idx) => (
                    <button
                      key={slide.src}
                      type="button"
                      role="tab"
                      aria-selected={activeSlide === idx}
                      aria-label={`매장 사진 ${idx + 1}번 보기`}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-7 px-2.5 rounded text-[12px] font-bold transition-colors ${
                        activeSlide === idx
                          ? "bg-[#D9531E] text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      0{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
