"use client";

import React, { useState } from "react";
import { STORE, telHref } from "../../lib/site";
import { Icon, ICON, SectionHeading } from "../../lib/ui";

export const HOME_FAQS = [
  {
    q: "대전 외 타 지역(충청·영남·수도권 등)도 배송이나 설치가 가능한가요?",
    a: "가능합니다. 제품 종류와 수량, 지역 여건에 따라 전국 단위 배송·설치 상담을 진행하고 있습니다. 실제로 대전·세종·충청권뿐 아니라 구미, 포항, 경산, 안동, 창원, 부산, 거제 등 다양한 지역의 가정 및 업소 거래 사례가 있습니다.",
  },
  {
    q: "구매한 중고가전이 고장 나면 A/S 보증은 어떻게 되나요?",
    a: "에어컨 및 냉난방기는 8개월, 그 외 냉장고·세탁기·업소용 기기 등은 4개월 무상 A/S를 기본 보장합니다. (단, 계약 조건 및 품목 특성에 따라 보증 기간과 범위는 사전 안내 후 달라질 수 있습니다.)",
  },
  {
    q: "중고가전 매입 시 대금 지급은 언제 이루어지나요?",
    a: "기사님이 약속된 일시에 방문하여 제품 상태를 최종 확인하고 수거가 완료되는 즉시, 현장에서 지정해 주신 계좌로 100% 전액 입금 처리해 드립니다.",
  },
  {
    q: "오프라인 매장 방문 구매와 세금계산서 발행이 가능한가요?",
    a: `네, ${STORE.address}(${STORE.addressNote})에 위치한 매장에 방문하시면 전시된 실물을 직접 확인하고 구매하실 수 있으며, 법인·개인사업자 고객님을 위한 세금계산서 발행도 가능합니다.`,
  },
] as const;

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section
      id="faq-section"
      aria-labelledby="faq-heading"
      className="border-b border-[#E4E0D8] bg-[#F6F5F2] py-16 sm:py-20 lg:py-24"
    >
      <div className="hb-container grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading
            eyebrow="FAQ"
            title={<span id="faq-heading">자주 묻는 질문</span>}
            desc="구매·매입·배송과 관련하여 고객님들이 자주 물어보시는 내용을 정리했습니다."
          />
          <p className="mt-5 text-[14.5px] leading-relaxed text-[#4B5260]">
            추가 문의사항은 대표전화{" "}
            <a
              href={telHref(STORE.tel)}
              className="font-bold text-[#0E1A2B] underline underline-offset-4"
            >
              {STORE.tel}
            </a>{" "}
            또는{" "}
            <a
              href={telHref(STORE.mobile)}
              className="font-bold text-[#0E1A2B] underline underline-offset-4"
            >
              {STORE.mobile}
            </a>
            로 연락해 주세요.
          </p>
        </div>

        <div className="lg:col-span-8 divide-y divide-[#DDD9D1] border-y border-[#DDD9D1] bg-white px-6 rounded-md">
          {HOME_FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={item.q}>
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${idx}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${idx}`}
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="flex w-full items-start justify-between gap-4 py-5 text-left sm:py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1A2B] rounded"
                  >
                    <span className="flex gap-3 text-[16px] font-bold leading-snug text-[#0E1A2B] sm:text-[17px]">
                      <span className="text-[#D9531E]">Q.</span>
                      <span>{item.q}</span>
                    </span>
                    <span
                      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#DDD9D1] text-[#0E1A2B] transition-transform duration-200 ${
                        isOpen ? "rotate-45 bg-[#0E1A2B] text-white" : ""
                      }`}
                    >
                      <Icon d={ICON.plus} className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <div
                    id={`faq-a-${idx}`}
                    role="region"
                    aria-labelledby={`faq-q-${idx}`}
                    className="pb-6 pl-7 pr-4 text-[15px] leading-[1.75] text-[#4B5260]"
                  >
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}