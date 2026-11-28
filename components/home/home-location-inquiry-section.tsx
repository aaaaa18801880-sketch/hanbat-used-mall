// 파일 경로: components/home/home-location-inquiry-section.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { SectionHeading } from "../../lib/ui";
import { Icon, ICON } from "../../lib/icons";
import {
  STORE,
  STORE_NAVIGATION,
  INQUIRY_STATUS,
  maskName,
  getInquiryTypeLabel,
  type InquiryTypeValue,
} from "../../lib/site";
import {
  formatInquiryRelativeDate,
  getInquiryTypeTone,
  isInquiryAnswered,
  summarizeInquiryActivity,
} from "../../lib/inquiry-feed";
import { SERVICE_DELIVERY_REGIONS } from "../../lib/home-showroom-filter";
import { StoreDirectionsMap } from "../showroom/store-directions-map";

export type HomeInquiryRow = {
  id: string | number;
  inquiry_type?: string | null;
  category: string | null;
  name: string | null;
  masked_name?: string | null;
  status: string | null;
  is_notice: boolean | null;
  created_at?: string | null;
};

const INITIAL_RECENT_COUNT = 5;

export function HomeLocationInquirySection({
  recent,
  totalInquiryCount,
  onOpenInquiry,
}: {
  recent: HomeInquiryRow[];
  totalInquiryCount: number | null;
  onOpenInquiry: (type?: InquiryTypeValue, productTitle?: string) => void;
}) {
  const [mapMode, setMapMode] = useState<"exterior" | "schematic" | "google">(
    "exterior"
  );
  const [showAllRecent, setShowAllRecent] = useState(false);

  const inquiryActivity = useMemo(
    () => summarizeInquiryActivity(recent),
    [recent]
  );

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(STORE.roadAddress);
      toast.success(`도로명 주소(${STORE.roadAddress})가 복사되었습니다.`);
    } catch {
      toast.error("주소 복사에 실패했습니다.");
    }
  };

  return (
    <section
      id="inquiry-section"
      className="hb-section-deferred border-b border-[#E2DDD3] bg-white py-10 sm:py-14"
      aria-labelledby="cta-title"
    >
      <div className="hb-container">
        <SectionHeading
          title={
            <span id="cta-title" className="[text-wrap:balance]">
              오프라인 매장 오시는 길 및 실시간 1:1 문의
            </span>
          }
          desc="대전·세종·충청권 직배송은 물론, 매장에 직접 방문해 실물 확인 후 상차하실 수 있습니다."
        />

        <div className="mt-5 grid gap-5 lg:grid-cols-12 items-stretch">
          {/* 좌측 (7열): 전시장 외관 · 오시는 길 약도 · 구글 지도 일체형 카드 (#location-section) */}
          <div
            id="location-section"
            aria-labelledby="location-title"
            className="scroll-mt-24 lg:col-span-7 min-w-0 flex flex-col overflow-hidden rounded-2xl border border-[#E2DDD3] bg-white shadow-2xs"
          >
            {/* 상단 통합 뷰 전환 탭바 */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2DDD3] bg-[#FAF9F6] px-3.5 py-2.5 sm:px-4">
              <div
                role="tablist"
                aria-label="매장 안내 보기 방식"
                className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto items-center gap-0.5 rounded-xl border border-[#E2DDD3] bg-[#F1EFEA] p-0.5"
              >
                {(
                  [
                    { id: "exterior", label: "전시장 외관" },
                    { id: "schematic", label: "오시는 길 약도" },
                    { id: "google", label: "위성 · 구글 지도" },
                  ] as const
                ).map((tab) => {
                  const active = mapMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setMapMode(tab.id)}
                      className={`min-h-[34px] sm:min-h-0 rounded-lg px-2.5 sm:px-3 py-1.5 text-hb-xs font-bold whitespace-nowrap transition-colors cursor-pointer text-center ${
                        active
                          ? "bg-[#141A23] text-white"
                          : "text-[#475569] hover:text-[#141A23]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <span className="hidden sm:inline text-hb-xs font-semibold text-[#64748B]">
                1·2층 직영 전시장 · 전용 주차 8대
              </span>
            </div>

            {mapMode === "exterior" ? (
              <div className="flex flex-col flex-1 bg-white">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#141A23]">
                  <Image
                    src="/images/store-exterior-flagship.jpg"
                    alt={`${STORE.name} ${STORE.roadAddress} 1·2층 직영 전시장 및 전용 주차장 외관 전경`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 760px"
                    quality={85}
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#141A23]/80 via-[#141A23]/30 to-transparent"
                    aria-hidden="true"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 px-4 py-3.5 text-white">
                    <div className="min-w-0">
                      <p className="text-hb-xs font-semibold text-white/80">
                        SINCE {STORE.since} · 중촌동 1·2층 직영 전시장
                      </p>
                      <p className="mt-0.5 text-hb-sm sm:text-hb-base font-extrabold tracking-tight break-keep">
                        {STORE.roadAddress}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMapMode("schematic")}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:bg-white transition-colors shrink-0 cursor-pointer"
                    >
                      <Icon d={ICON.pin} className="w-3.5 h-3.5 text-[#C84312]" />
                      <span>진입 약도 보기</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-[#ECEAE4] border-t border-[#E6E8EC] bg-white px-2 py-3 text-center">
                  <div className="px-2">
                    <span className="block text-hb-xs text-[#64748B]">매장 규모</span>
                    <strong className="mt-0.5 block text-hb-xs sm:text-hb-sm font-bold text-[#141A23]">
                      1·2층 상시 전시
                    </strong>
                  </div>
                  <div className="px-2">
                    <span className="block text-hb-xs text-[#64748B]">주차 · 상차</span>
                    <strong className="mt-0.5 block text-hb-xs sm:text-hb-sm font-bold text-[#141A23]">
                      전용 8대 · 1톤 진입
                    </strong>
                  </div>
                  <div className="px-2">
                    <span className="block text-hb-xs text-[#64748B]">출고 기준</span>
                    <strong className="mt-0.5 block text-hb-xs sm:text-hb-sm font-bold text-[#0F766E]">
                      실물 확인 · 당일 배송
                    </strong>
                  </div>
                </div>
              </div>
            ) : mapMode === "google" ? (
              <div className="flex flex-col flex-1">
                <div className="relative min-h-[320px] sm:min-h-[380px] flex-1 w-full bg-[#F1F3F6] overflow-hidden">
                  <iframe
                    title={`${STORE.name} 매장 위치 지도`}
                    src="https://maps.google.com/maps?q=%EB%8C%80%EC%A0%84+%EC%A4%91%EA%B5%AC+%EC%A4%91%EC%B4%8C%EB%8F%99+144&t=&z=16&ie=UTF8&iwloc=&output=embed"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 h-full w-full border-0"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <StoreDirectionsMap />
            )}

            <div className="px-4 sm:px-5 pb-4 pt-3 flex-1 flex flex-col justify-between border-t border-[#E6E8EC] bg-[#FAF9F6] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-hb-xs sm:text-hb-sm text-[#475569]">
                <div className="min-w-0 space-y-0.5">
                  <p id="location-title" className="break-keep">
                    <strong className="font-semibold text-[#141A23]">
                      영업시간
                    </strong>{" "}
                    · {STORE.hours} ({STORE.closed}) · 지번 {STORE.jibunAddress}
                  </p>
                  <p className="break-keep">
                    <strong className="font-semibold text-[#141A23]">
                      직영 배차 권역
                    </strong>{" "}
                    · {SERVICE_DELIVERY_REGIONS.join(" · ")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="hb-btn-outline h-10 sm:h-9 px-3.5 text-hb-xs font-bold shrink-0 w-full sm:w-auto active:scale-[0.96] cursor-pointer bg-white"
                >
                  <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#1D4E89]" />
                  <span>도로명 주소 복사</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <a
                  href={STORE.naverMap}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-outline h-10 bg-white text-hb-xs font-bold whitespace-nowrap"
                >
                  <span>네이버 지도</span>
                  <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                </a>
                <a
                  href={STORE_NAVIGATION.kakaoTo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-outline h-10 bg-white text-hb-xs font-bold whitespace-nowrap"
                >
                  <span>카카오맵</span>
                  <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                </a>
                <a
                  href={STORE_NAVIGATION.tmapUrl}
                  className="hb-btn-outline h-10 bg-white text-hb-xs font-bold whitespace-nowrap"
                >
                  <span>티맵 길안내</span>
                  <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                </a>
                <a
                  href={STORE.daangnLocalProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-outline h-10 bg-white text-hb-xs font-bold whitespace-nowrap"
                >
                  <span>당근 비즈</span>
                  <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#C84312] shrink-0" />
                </a>
              </div>
            </div>
          </div>

          {/* 우측 (5열): 실시간 고객 문의 현황 보드 */}
          <div className="lg:col-span-5 min-w-0 flex flex-col justify-between">
            <div className="rounded-2xl border border-[#E2DDD3] bg-white overflow-hidden flex-1 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="bg-[#FAF9F6] border-b border-[#E2DDD3] px-4 py-3 sm:px-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 min-w-0">
                      <Icon
                        d={ICON.chat}
                        className="h-4 w-4 text-[#C84312] shrink-0"
                      />
                      <h3 className="text-hb-sm sm:text-hb-base font-bold text-[#141A23] truncate">
                        실시간 접수된 문의 현황
                      </h3>
                    </div>
                    <Link
                      href="/inquiry"
                      className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#C84312] hover:underline shrink-0"
                    >
                      <span>전체 게시판</span>
                      <Icon d={ICON.right} className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* 실데이터 기반 3단 활동 요약 */}
                  <div className="mt-2.5 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[#E2DDD3] bg-[#E2DDD3]">
                    <div className="bg-white px-2.5 py-2 text-center">
                      <span className="block text-hb-xs text-[#64748B]">
                        누적 접수
                      </span>
                      <strong className="mt-0.5 block font-mono text-hb-sm font-extrabold text-[#141A23] tabular-nums">
                        {typeof totalInquiryCount === "number" &&
                        totalInquiryCount > 0
                          ? `${totalInquiryCount.toLocaleString()}건`
                          : `${recent.length}건`}
                      </strong>
                    </div>
                    <div className="bg-white px-2.5 py-2 text-center">
                      <span className="block text-hb-xs text-[#64748B]">
                        최근 답변율
                      </span>
                      <strong className="mt-0.5 block font-mono text-hb-sm font-extrabold text-[#0F766E] tabular-nums">
                        {inquiryActivity.totalShown > 0
                          ? `${inquiryActivity.answeredRate}%`
                          : "신속 응대"}
                      </strong>
                    </div>
                    <div className="bg-white px-2.5 py-2 text-center">
                      <span className="block text-hb-xs text-[#64748B]">
                        매입 · 구매
                      </span>
                      <strong className="mt-0.5 block font-mono text-hb-xs sm:text-hb-sm font-extrabold text-[#C84312] tabular-nums">
                        {inquiryActivity.totalShown > 0
                          ? `${inquiryActivity.sellCount} · ${inquiryActivity.buyOrBulkCount}`
                          : "상시 접수"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 최근 문의 피드 리스트 */}
                <div className="px-4 sm:px-5">
                  {recent.length === 0 ? (
                    <div className="py-6 text-hb-xs text-[#334155] space-y-1.5">
                      <p className="font-bold text-[#141A23]">
                        비밀번호로 보호되는 1:1 비공개 견적 게시판입니다.
                      </p>
                      <p className="text-[#475569] leading-relaxed break-keep">
                        가전 구매 재고 확인, 방문 매입, 식당·카페 업소용 묶음 견적을 남겨주시면 신속히 안내해 드립니다.
                      </p>
                    </div>
                  ) : (
                    <>
                      <ul className="divide-y divide-[#EFECE4]">
                        {(showAllRecent
                          ? recent
                          : recent.slice(0, INITIAL_RECENT_COUNT)
                        ).map((r) => {
                          const isDone = isInquiryAnswered(r.status);
                          const tone = getInquiryTypeTone(r.inquiry_type);
                          const cleanCategory = (
                            r.category || "상담 문의"
                          ).replace(/^\[[^\]]+\]\s*/, "");
                          const relDate = formatInquiryRelativeDate(
                            r.created_at
                          );

                          const typeTextClass =
                            tone === "sell"
                              ? "text-[#C84312]"
                              : tone === "bulk"
                              ? "text-[#0F766E]"
                              : "text-[#475569]";

                          return (
                            <li
                              key={r.id}
                              className="flex items-center justify-between gap-2.5 py-2.5 text-hb-xs"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                <span
                                  className={`shrink-0 text-hb-xs font-bold whitespace-nowrap ${typeTextClass}`}
                                >
                                  {getInquiryTypeLabel(r.inquiry_type)}
                                </span>
                                <span
                                  className="text-[#CFC7BA] shrink-0"
                                  aria-hidden="true"
                                >
                                  ·
                                </span>
                                <span className="min-w-0 flex-1 truncate text-hb-xs sm:text-hb-sm font-semibold text-[#141A23]">
                                  {cleanCategory || "상담 문의"}
                                </span>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5 text-hb-xs">
                                <span className="text-[#475569] font-medium">
                                  {r.masked_name || maskName(r.name)}
                                </span>
                                {relDate && (
                                  <span className="hidden sm:inline font-mono text-hb-xs text-[#64748B] tabular-nums">
                                    {relDate}
                                  </span>
                                )}
                                <span
                                  className="text-[#CFC7BA]"
                                  aria-hidden="true"
                                >
                                  ·
                                </span>
                                <span
                                  className={`text-hb-xs font-bold whitespace-nowrap ${
                                    isDone
                                      ? "text-[#0F766E]"
                                      : "text-[#C84312]"
                                  }`}
                                >
                                  {r.status ?? INQUIRY_STATUS.RECEIVED}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      {recent.length > INITIAL_RECENT_COUNT && (
                        <div className="pt-1.5 pb-1 text-center">
                          <button
                            type="button"
                            onClick={() => setShowAllRecent((v) => !v)}
                            className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#475569] hover:text-[#141A23] cursor-pointer"
                          >
                            <span>
                              {showAllRecent
                                ? "접기"
                                : `최근 문의 ${recent.length - INITIAL_RECENT_COUNT}건 더 보기`}
                            </span>
                            <Icon
                              d={ICON.down}
                              className={`h-3.5 w-3.5 transition-transform ${
                                showAllRecent ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 하단 즉시 견적 접수 영역 */}
              <div className="mt-2 border-t border-[#E2DDD3] bg-[#FAF9F6] px-4 py-3 sm:px-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-hb-xs text-[#475569]">
                  <span className="font-mono font-semibold tabular-nums">
                    {STORE.tel} · {STORE.mobile}
                  </span>
                  <span className="font-bold text-[#0F766E]">
                    비공개 비밀글 · 사진 첨부 가능
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenInquiry("구매 문의")}
                    className="hb-btn-accent min-h-[42px] h-10 px-3 text-hb-xs font-bold cursor-pointer active:scale-[0.96]"
                  >
                    <Icon d={ICON.pen} className="w-3.5 h-3.5" />
                    <span>1:1 간편 견적 접수</span>
                  </button>
                  <Link
                    href="/inquiry?write=1"
                    className="hb-btn-outline min-h-[42px] h-10 px-3 text-hb-xs font-bold active:scale-[0.96]"
                  >
                    <span>
                      {typeof totalInquiryCount === "number" &&
                      totalInquiryCount > 0
                        ? `문의글 작성 (${totalInquiryCount}건+)`
                        : "상세 문의글 작성 →"}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
