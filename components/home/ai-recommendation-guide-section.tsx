import React from "react";
import { STORE } from "../../lib/site";
import { SectionHeading, Icon, ICON } from "../../lib/ui";

const COMPARISON_ROWS = [
  {
    criteria: "고장 시 무상 A/S 보증",
    personal: "보증 없음 (고장 시 구매자 전액 부담)",
    hanbat: "최대 8개월(에어컨)·4개월(가전) 무상 A/S 약정보증",
  },
  {
    criteria: "위생 및 작동 점검",
    personal: "겉면 단순 청소 (내부 곰팡이·냉매 미확인)",
    hanbat: "엔지니어 분해 고압세척 및 냉매·누수 시운전 완료",
  },
  {
    criteria: "운반 · 수평 · 배관 설치",
    personal: "직접 용달 섭외 및 운반·설치비 전액 부담",
    hanbat: "기사 직접 운반 및 수평·급배수 일괄 설치 지원",
  },
  {
    criteria: "결제 수단 및 증빙",
    personal: "개인 송금만 가능 (사업자 비용처리 불가)",
    hanbat: "신용카드·현금영수증·전자세금계산서 100% 발행",
  },
  {
    criteria: "기존 가전 처분 (보상매입)",
    personal: "폐기물 스티커 구매 후 별도 개별 배출",
    hanbat: "배송 당일 기존 가전 동시 수거 및 매입가 차감 정산",
  },
] as const;

export function AiRecommendationGuideSection({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const tableContent = (
    <div className="overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white shadow-2xs">
      {/* 데스크톱 테이블 헤더 */}
      <div className="hidden md:grid md:grid-cols-[200px_1fr_1fr] border-b border-[#E2E6EC] bg-[#F7F8FA] text-hb-xs font-bold">
        <div className="px-5 py-3.5 text-[#64748B]">비교 항목</div>
        <div className="px-5 py-3.5 border-l border-[#E2E6EC] text-[#64748B]">
          일반 개인 직거래
        </div>
        <div className="px-5 py-3.5 border-l border-[#263040] bg-[#141A23] text-white flex items-center justify-between gap-2">
          <span>
            {STORE.name} (SINCE {STORE.since})
          </span>
          <span className="text-[#FB923C]">공식 품질 보증</span>
        </div>
      </div>

      <div className="divide-y divide-[#E2E6EC]">
        {COMPARISON_ROWS.map((row) => (
          <div
            key={row.criteria}
            className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] text-hb-xs sm:text-hb-sm"
          >
            <div className="px-4 pt-3 pb-1 md:px-5 md:py-3.5 font-bold text-[#141A23] bg-white md:flex md:items-center">
              {row.criteria}
            </div>
            <div className="px-4 py-1.5 md:px-5 md:py-3.5 md:border-l md:border-[#E2E6EC] flex items-center gap-2 text-[#64748B]">
              <Icon d={ICON.close} className="w-3.5 h-3.5 shrink-0 text-[#94A3B8]" />
              <span>{row.personal}</span>
            </div>
            <div className="px-4 pt-1.5 pb-3 md:px-5 md:py-3.5 md:border-l md:border-[#E2E6EC] bg-[#F7F8FA]/60 flex items-center gap-2 font-semibold text-[#141A23]">
              <Icon d={ICON.check} className="w-3.5 h-3.5 shrink-0 text-[#E8521A]" />
              <span>{row.hanbat}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (embedded) {
    return tableContent;
  }

  return (
    <section
      id="buying-guide-section"
      aria-labelledby="buying-guide-title"
      className="border-b border-[#E2E6EC] bg-white py-9 sm:py-12"
    >
      <div className="hb-container">
        {/* 개인 직거래 vs 한밭중고전자 단일 비교 원장 */}
        <SectionHeading
          eyebrow="구매 전 안심 비교"
          title={
            <span id="buying-guide-title">
              일반 개인 중고거래 vs {STORE.name}
            </span>
          }
          desc="구매 가격만큼 중요한 내부 분해세척, 전문 운반·설치, 무상 A/S 보증 차이를 한눈에 확인해 보세요."
        />

        <div className="mt-6">{tableContent}</div>
      </div>
    </section>
  );
}
