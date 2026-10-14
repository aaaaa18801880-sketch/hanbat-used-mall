import React from "react";
import { STORE } from "../../lib/site";
import { SectionHeading } from "../../lib/ui";

const OPERATING_YEARS = new Date().getFullYear() - STORE.since;

const VERIFIED_FACTS = [
  {
    title: `SINCE ${STORE.since} (${OPERATING_YEARS}년차 운영)`,
    desc: "대전 중촌동 오프라인 매장을 기반으로 가정용·업소용 가전을 유통합니다.",
  },
  {
    title: "세척 · 정비 · 검수 후 출고",
    desc: "입고된 가전과 주방설비는 작동 테스트와 내·외부 세척을 마친 뒤 판매합니다.",
  },
  {
    title: "명확한 무상 A/S 기준",
    desc: "에어컨·냉난방기 8개월, 그 외 품목 4개월 보증(계약 조건에 따라 상이할 수 있음).",
  },
  {
    title: "대량 거래 · 세금계산서 발행",
    desc: "식당·카페 창업 설비 도입 및 폐업·이전 정리 시 세금계산서를 투명하게 발행합니다.",
  },
] as const;

const SERVICE_STANDARDS = [
  {
    no: "01",
    title: "직접 보고 결정할 수 있는 오프라인 매장",
    desc: "사진만으로 판단하기 어려운 대형 냉장고, 에어컨, 업소용 쇼케이스는 대전 중구 중촌동 매장에 방문하여 실물 상태를 직접 확인하고 구매하실 수 있습니다.",
  },
  {
    no: "02",
    title: "구매와 처분(매입)을 한 번에 해결",
    desc: "이사나 매장 오픈·폐업 시 필요한 가전 구매와 기존 사용하던 가전의 방문 수거·매입 상담을 한 곳에서 동시에 진행할 수 있어 일정을 단축해 드립니다.",
  },
  {
    no: "03",
    title: "전국 단위 배송 및 현장 맞춤 설치 상담",
    desc: "대전·세종·충청권은 물론 구미, 포항, 창원, 부산, 거제 등 타 지역도 품목과 수량, 설치 환경에 맞춰 배송 및 설치 일정을 조율해 드립니다.",
  },
] as const;

export function TrustSection() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="border-b border-[#E4E0D8] bg-white"
    >
      {/* 상단 4열 팩트 바 */}
      <div className="border-b border-[#E4E0D8] bg-[#FAF9F7]">
        <div className="hb-container">
          <dl className="grid grid-cols-1 divide-y divide-[#E4E0D8] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {VERIFIED_FACTS.map((fact, idx) => (
              <div
                key={fact.title}
                className={`py-6 ${
                  idx % 2 === 1 ? "sm:pl-6" : ""
                } ${idx >= 2 ? "sm:border-t sm:border-[#E4E0D8] lg:border-t-0" : ""} ${
                  idx > 0 ? "lg:px-6" : "lg:pr-6"
                }`}
              >
                <dt className="text-[16px] font-bold text-[#0E1A2B]">
                  {fact.title}
                </dt>
                <dd className="mt-1.5 text-[13.5px] leading-relaxed text-[#4B5260]">
                  {fact.desc}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* 하단 운영 기준 상세 */}
      <div className="hb-container py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14 items-start">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Our Standard"
              title={
                <span id="trust-heading">
                  중고 거래에서 가장 중요한 건
                  <br />
                  검수 상태와 사후 책임입니다.
                </span>
              }
              desc="과장된 홍보 문구 대신, 한밭중고전자가 실제로 지키고 있는 검수·보증·거래 원칙만 안내합니다."
            />
          </div>

          <ol className="lg:col-span-7 divide-y divide-[#E4E0D8] border-y border-[#E4E0D8]">
            {SERVICE_STANDARDS.map((item) => (
              <li
                key={item.no}
                className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[48px_1fr] sm:gap-4 sm:py-7"
              >
                <span className="text-[14px] font-bold tabular-nums text-[#D9531E]">
                  {item.no}
                </span>
                <div>
                  <h3 className="text-[17px] font-bold text-[#0E1A2B] sm:text-[18px]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[1.7] text-[#4B5260]">
                    {item.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}