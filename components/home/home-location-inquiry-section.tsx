// 파일 경로: components/home/home-location-inquiry-section.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
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
  const [mapLoaded, setMapLoaded] = useState(false);
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
      className="border-b border-[#E2E6EC] bg-white py-7 sm:py-9"
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
          {/* 좌측 (7열): 오프라인 매장 지도 및 주소·편의시설 일체형 카드 (#location-section) */}
          <div
            id="location-section"
            aria-labelledby="location-title"
            className="scroll-mt-24 lg:col-span-7 min-w-0 flex flex-col overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white shadow-2xs"
          >
            <div className="relative h-[240px] sm:h-[290px] lg:h-[310px] w-full bg-[#F1F3F6] overflow-hidden">
              {mapLoaded ? (
                <iframe
                  title={`${STORE.name} 매장 위치 지도`}
                  src="https://maps.google.com/maps?q=%EB%8C%80%EC%A0%84+%EC%A4%91%EA%B5%AC+%EC%A4%91%EC%B4%8C%EB%8F%99+144&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setMapLoaded(true)}
                  className="group relative flex h-full w-full flex-col items-center justify-center gap-2.5 bg-[radial-gradient(circle_at_top,_rgba(232,82,26,0.10),_transparent_55%),linear-gradient(135deg,#F8FAFC_0%,#E9EEF4_100%)] px-6 text-center transition-colors hover:bg-[#E4EBF2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#141A23] cursor-pointer"
                >
                  <span
                    className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,#CBD5E1_1px,transparent_1px),linear-gradient(to_bottom,#CBD5E1_1px,transparent_1px)] [background-size:32px_32px]"
                    aria-hidden="true"
                  />
                  <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E2E6EC] bg-white text-[#C84312] shadow-sm transition-transform group-hover:scale-105">
                    <Icon d={ICON.pin} className="h-5 w-5" />
                  </span>
                  <div className="relative z-10 space-y-1">
                    <span className="inline-block rounded-md bg-white/90 border border-[#CBD2DC] px-2.5 py-0.5 text-hb-xs font-bold text-[#0F766E]">
                      전용 주차 8대 · 1톤 화물 진입 수월
                    </span>
                    <p className="text-hb-base sm:text-hb-lg font-bold text-[#141A23]">
                      {STORE.name} 오프라인 매장 위치 지도
                    </p>
                    <p className="text-hb-xs sm:text-hb-sm text-[#475569]">
                      {STORE.roadAddress} ({STORE.addressNote})
                    </p>
                  </div>
                  <span className="relative z-10 inline-flex items-center gap-1.5 rounded-xl bg-[#141A23] px-4 py-2 text-hb-xs sm:text-hb-sm font-bold text-white shadow-xs transition-colors group-hover:bg-[#C84312]">
                    <span>크게 지도 펼치기</span>
                    <Icon d={ICON.right} className="h-3.5 w-3.5" />
                  </span>
                </button>
              )}
            </div>

            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between border-t border-[#E2E6EC] bg-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                <div className="min-w-0">
                  <h3
                    id="location-title"
                    className="text-hb-base sm:text-hb-lg font-bold text-[#141A23] break-keep [text-wrap:balance]"
                  >
                    {STORE.roadAddress}
                  </h3>
                  <p className="mt-0.5 text-hb-xs sm:text-hb-sm text-[#475569]">
                    지번: {STORE.jibunAddress} ({STORE.addressNote}) · {STORE.hours} ({STORE.closed})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="hb-btn-outline h-9 px-3.5 text-hb-xs font-bold shrink-0 self-start active:scale-[0.96] cursor-pointer"
                >
                  <Icon d={ICON.copy} className="w-3.5 h-3.5 text-[#C84312]" />
                  <span>주소 복사</span>
                </button>
              </div>

              <div className="pt-2.5 border-t border-[#E2DDD3] space-y-1.5 text-hb-xs sm:text-hb-sm text-[#475569] leading-relaxed">
                <p className="break-keep">
                  <strong className="font-semibold text-[#141A23]">전용 주차 8대</strong>(1톤 화물 진입 수월) ·{" "}
                  <strong className="font-semibold text-[#141A23]">현장 전원 확인</strong> 후 당일 상차 · 중촌고가교 밑 도보 2분
                </p>
                <p className="break-keep">
                  <strong className="font-semibold text-[#141A23]">직영 배차 권역</strong> ·{" "}
                  {SERVICE_DELIVERY_REGIONS.join(" · ")}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5">
                <a
                  href={STORE.naverMap}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-outline h-10 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap"
                >
                  <span>네이버 지도</span>
                  <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#64748B]" />
                </a>
                <a
                  href={STORE_NAVIGATION.kakaoTo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-outline h-10 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap"
                >
                  <span>카카오맵</span>
                  <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#64748B]" />
                </a>
                <a
                  href={STORE.daangnLocalProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-outline col-span-2 sm:col-span-1 h-10 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap"
                >
                  <span>당근 비즈프로필</span>
                  <Icon d={ICON.external} className="w-3.5 h-3.5 text-[#C84312]" />
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
                      <ul className="divide-y divide-[#F1F3F6]">
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

                          const typeBadgeClass =
                            tone === "sell"
                              ? "bg-[#FFF4EE] text-[#C84312] border border-[#FED7AA]"
                              : tone === "bulk"
                              ? "bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4]"
                              : "bg-[#F1F3F6] text-[#141A23] border border-[#E2E6EC]";

                          return (
                            <li
                              key={r.id}
                              className="flex items-center justify-between gap-2 py-2 text-hb-xs"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <span
                                  className={`shrink-0 rounded-md px-2 py-0.5 text-hb-xs font-bold leading-none ${typeBadgeClass}`}
                                >
                                  {getInquiryTypeLabel(r.inquiry_type)}
                                </span>
                                <Link
                                  href="/inquiry"
                                  className="min-w-0 flex-1 truncate text-hb-xs sm:text-hb-sm font-semibold text-[#141A23] hover:text-[#C84312] transition-colors"
                                >
                                  {cleanCategory || "상담 문의"}
                                </Link>
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
                                  className={`rounded-md px-1.5 py-0.5 text-hb-xs font-bold leading-none ${
                                    isDone
                                      ? "bg-[#F0FDFA] text-[#0F766E] border border-[#0D9488]/25"
                                      : "bg-[#FFF4EE] text-[#C84312] border border-[#C84312]/25"
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
