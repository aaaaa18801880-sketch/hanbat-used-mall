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
  const [mapMode, setMapMode] = useState<"schematic" | "google">("schematic");
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
      className="border-b border-[#E2DDD3] bg-white py-7 sm:py-9"
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
          {/* 좌측 (7열): 오프라인 매장 약도·지도 및 주소·편의시설 일체형 카드 (#location-section) */}
          <div
            id="location-section"
            aria-labelledby="location-title"
            className="scroll-mt-24 lg:col-span-7 min-w-0 flex flex-col overflow-hidden rounded-2xl border border-[#E2DDD3] bg-white shadow-2xs"
          >
            {mapMode === "google" ? (
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-2 border-b border-[#E2DDD3] bg-[#FAF9F6] px-4 py-2.5">
                  <span className="text-hb-xs font-bold text-[#141A23]">
                    위성 · 구글 지도 ({STORE.jibunAddress})
                  </span>
                  <button
                    type="button"
                    onClick={() => setMapMode("schematic")}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#D8D1C5] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] transition-colors cursor-pointer"
                  >
                    <Icon d={ICON.pin} className="w-3.5 h-3.5 text-[#C84312]" />
                    <span>오시는 길 약도로 돌아가기</span>
                  </button>
                </div>
                <div className="relative h-[300px] sm:h-[360px] w-full bg-[#F1F3F6] overflow-hidden">
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
              <StoreDirectionsMap
                onOpenGoogleMap={() => setMapMode("google")}
              />
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
