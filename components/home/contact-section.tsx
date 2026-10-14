"use client";

import React from "react";
import Link from "next/link";
import {
  type InquiryTypeValue,
  maskName,
  STORE,
  telHref,
  trackEvent,
} from "../../lib/site";
import { Icon, ICON, SectionHeading } from "../../lib/ui";
import { UnifiedInquiryForm } from "../inquiry/unified-inquiry-form";

export type RecentInquiryRow = {
  id: string | number;
  inquiry_type: string | null;
  category: string | null;
  name: string | null;
  masked_name?: string | null;
  status: string | null;
  is_notice: boolean | null;
  created_at: string;
};

const shortTypeLabel = (t?: string | null) =>
  t === "내 물건 팔기" || t === "내 물건팔기" || t === "매입문의"
    ? "매입"
    : t === "구매 문의" || t === "구매문의"
    ? "구매"
    : "기타";

export function ContactSection({
  inquiryType,
  prefillTitle,
  recentInquiries,
  onSubmitted,
}: {
  inquiryType: InquiryTypeValue;
  setInquiryType?: (t: InquiryTypeValue) => void;
  prefillTitle?: string;
  recentInquiries: RecentInquiryRow[];
  onSubmitted: () => void;
}) {
  return (
    <section
      id="inquiry-section"
      aria-labelledby="contact-heading"
      className="bg-[#F6F5F2] py-16 sm:py-20 lg:py-24"
    >
      <div className="hb-container">
        <SectionHeading
          eyebrow="Online Inquiry"
          title={<span id="contact-heading">판매 · 매입 통합 상담 신청</span>}
          desc="찾으시는 제품이나 처분하실 가전 정보를 남겨주시면 담당자가 확인 후 연락드립니다."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          {/* 좌측: 4단계에서 고도화한 6단계 상태 머신 통합 문의 폼 연결 */}
          <div
            id="inquiry-form"
            className="scroll-mt-24 rounded-md border border-[#E4E0D8] bg-white p-6 sm:p-8 lg:col-span-7"
          >
            <UnifiedInquiryForm
              defaultType={inquiryType}
              linkedProduct={
                prefillTitle ? { productTitle: prefillTitle } : null
              }
              onSuccess={() => {
                trackEvent("submit_inquiry_success", {
                  source: "home_contact_section",
                });
                onSubmitted();
              }}
            />
          </div>

          {/* 우측: 빠른 직통 상담 카드 & 최근 문의 현황 */}
          <aside className="flex flex-col gap-6 lg:col-span-5">
            <div className="rounded-md bg-[#0E1A2B] p-6 text-white sm:p-8">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#FF8A50]">
                Direct Contact
              </p>
              <h3 className="mt-2 text-[20px] font-bold">
                전화와 카카오톡으로 바로 물어보세요
              </h3>
              <p className="mt-1.5 text-[14px] text-white/75">
                급한 재고 확인이나 당일 방문 수거 일정은 전화 또는 카카오톡이 가장 빠릅니다.
              </p>

              <div className="mt-5 space-y-2 border-y border-white/15 py-4">
                <a
                  href={telHref(STORE.tel)}
                  onClick={() =>
                    trackEvent("click_tel_consult", {
                      location: "home_contact_card",
                    })
                  }
                  className="block text-[26px] font-bold tracking-tight text-white hover:text-[#FF8A50]"
                >
                  {STORE.tel}
                </a>
                <a
                  href={telHref(STORE.mobile)}
                  onClick={() =>
                    trackEvent("click_tel_consult", {
                      location: "home_contact_mobile",
                    })
                  }
                  className="block text-[17px] font-semibold text-white/85 hover:text-[#FF8A50]"
                >
                  휴대전화: {STORE.mobile}
                </a>
                <p className="text-[13px] text-white/65 pt-1">
                  {STORE.hours} · {STORE.closed}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <a
                  href={telHref(STORE.tel)}
                  onClick={() =>
                    trackEvent("click_tel_consult", {
                      location: "home_contact_btn",
                    })
                  }
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-white text-[14px] font-bold text-[#0E1A2B] hover:bg-neutral-100"
                >
                  <Icon d={ICON.phone} className="w-4 h-4 text-[#D9531E]" />
                  <span>전화 걸기</span>
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent("click_kakao_consult", {
                      location: "home_contact_btn",
                    })
                  }
                  className="hb-btn-kakao h-11 text-[14px]"
                >
                  <Icon d={ICON.chat} className="w-4 h-4" />
                  <span>카톡 채널 상담</span>
                </a>
              </div>
            </div>

            <div className="flex-1 rounded-md border border-[#E4E0D8] bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-[#0E1A2B]">
                  최근 접수된 문의 현황
                </h3>
                <Link
                  href="/inquiry"
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#4B5260] hover:text-[#0E1A2B]"
                >
                  <span>전체 게시판 보기</span>
                  <Icon d={ICON.right} className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentInquiries.length === 0 ? (
                <p className="mt-6 text-[14px] text-[#8A8478]">
                  최근 접수된 문의 내역이 없습니다.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-[#EEEBE5]">
                  {recentInquiries.map((row) => {
                    const badge = shortTypeLabel(row.inquiry_type);
                    const done =
                      row.status === "답변완료" || row.status === "매입완료";
                    return (
                      <li
                        key={row.id}
                        className="flex items-center gap-3 py-3 text-[14px]"
                      >
                        <span
                          className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-bold ${
                            badge === "매입"
                              ? "bg-[#FBE9E1] text-[#B5431A]"
                              : "bg-[#E8ECF2] text-[#0E1A2B]"
                          }`}
                        >
                          {badge}
                        </span>
                        <Link
                          href="/inquiry"
                          className="min-w-0 flex-1 truncate font-medium text-[#1F2530] hover:text-[#D9531E]"
                        >
                          {row.category || "상담 문의"}
                        </Link>
                        <span className="shrink-0 text-[12px] text-[#6B7280]">
                          {row.masked_name || maskName(row.name)}
                        </span>
                        <span
                          className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-bold ${
                            done
                              ? "bg-[#0E1A2B] text-white"
                              : "bg-[#F0EDE7] text-[#4B5260]"
                          }`}
                        >
                          {row.status || "접수"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}