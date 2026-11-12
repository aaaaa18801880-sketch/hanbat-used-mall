import React from "react";
import Link from "next/link";
import { STORE, telHref } from "../../lib/site";
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
    hanbat: "기사 직접 운반 및 수평·급배수 원스톱 설치 지원",
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

const SITUATION_GUIDES = [
  {
    badge: "가정 · 원룸 · 자취",
    title: "입주·신혼 가전 단품 및 3종 세트",
    recommend: "소형~양문형 냉장고 · 세탁기 · 벽걸이 에어컨 동시 직배송 및 수평 설치",
    ctaLabel: "가정용 실매물 보기",
    href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
  },
  {
    badge: "식당 · 카페 창업",
    title: "업소용 냉장 · 쇼케이스 · 주방 패키지",
    recommend: "45박스 냉장고 · 테이블냉장고 · 제빙기 · 쇼케이스 세금계산서 100% 발행",
    ctaLabel: "업소용 설비 보기",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
  },
  {
    badge: "이사 · 매장 폐업",
    title: "가정 가전 처분 · 폐업 일괄 방문 매입",
    recommend: "사진 접수 후 방문 수거 및 당일 100% 현금 정산",
    ctaLabel: "방문 매입 신청",
    href: "/purchase",
  },
] as const;

export function AiRecommendationGuideSection() {
  return (
    <section
      id="buying-guide-section"
      aria-labelledby="buying-guide-title"
      className="border-b border-[#E2E6EC] bg-[#F7F8FA] py-9 sm:py-12"
    >
      <div className="hb-container space-y-8">
        {/* 1. 개인 직거래 vs 한밭중고전자 단일 비교 원장 */}
        <div>
          <SectionHeading
            eyebrow="구매 전 안심 비교"
            title={
              <span id="buying-guide-title">
                일반 개인 중고거래 vs {STORE.name}
              </span>
            }
            desc="구매 가격만큼 중요한 내부 분해세척, 전문 운반·설치, 무상 A/S 보증 차이를 한눈에 확인해 보세요."
          />

          <div className="mt-5 overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white shadow-2xs">
            {/* 데스크톱 테이블 헤더 */}
            <div className="hidden md:grid md:grid-cols-[200px_1fr_1fr] border-b border-[#E2E6EC] bg-[#F7F8FA] text-hb-xs font-bold">
              <div className="px-5 py-3 text-[#64748B]">비교 항목</div>
              <div className="px-5 py-3 border-l border-[#E2E6EC] text-[#64748B]">
                일반 개인 직거래
              </div>
              <div className="px-5 py-3 border-l border-[#E2E6EC] bg-[#F0FDFA] text-[#0F766E] flex items-center justify-between gap-2">
                <span>{STORE.name} (SINCE {STORE.since})</span>
                <span className="text-[#E8521A]">공식 품질 보증</span>
              </div>
            </div>

            <div className="divide-y divide-[#E2E6EC]">
              {COMPARISON_ROWS.map((row) => (
                <div
                  key={row.criteria}
                  className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] text-hb-xs sm:text-hb-sm"
                >
                  <div className="px-4 pt-3 pb-1 md:px-5 md:py-3 font-bold text-[#141A23] bg-white md:flex md:items-center">
                    {row.criteria}
                  </div>
                  <div className="px-4 py-1.5 md:px-5 md:py-3 md:border-l md:border-[#E2E6EC] flex items-center gap-2 text-[#64748B]">
                    <Icon d={ICON.close} className="w-3.5 h-3.5 shrink-0 text-[#94A3B8]" />
                    <span>{row.personal}</span>
                  </div>
                  <div className="px-4 pt-1.5 pb-3 md:px-5 md:py-3 md:border-l md:border-[#E2E6EC] bg-[#F0FDFA]/40 flex items-center gap-2 font-semibold text-[#141A23]">
                    <Icon d={ICON.check} className="w-3.5 h-3.5 shrink-0 text-[#0F766E]" />
                    <span>{row.hanbat}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. 상황별 바로가기 (슬림 3열) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
            <h3 className="text-hb-base sm:text-hb-lg font-bold text-[#141A23] tracking-[-0.02em]">
              목적별 빠른 안내
            </h3>
            <a
              href={telHref(STORE.tel)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#CBD2DC] px-3.5 py-1.5 text-hb-xs font-bold text-[#E8521A] hover:border-[#E8521A] active:scale-[0.96] transition-[border-color,transform] duration-150 tabular-nums shrink-0 whitespace-nowrap"
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5" />
              <span>직통 상담: {STORE.tel} / {STORE.mobile}</span>
            </a>
          </div>

          <div className="grid gap-3.5 lg:grid-cols-3">
            {SITUATION_GUIDES.map((g) => (
              <Link
                key={g.title}
                href={g.href}
                className="group flex flex-col justify-between rounded-xl border border-[#E2E6EC] bg-white p-4 sm:p-5 shadow-2xs hover:border-[#141A23] hover:shadow-card transition-[border-color,box-shadow] duration-150"
              >
                <div>
                  <span className="inline-flex items-center rounded-md bg-[#FFF4EE] px-2.5 py-0.5 text-hb-xs font-bold text-[#E8521A]">
                    {g.badge}
                  </span>
                  <h4 className="mt-2.5 text-hb-base font-bold tracking-[-0.02em] text-[#141A23] group-hover:text-[#E8521A] transition-colors">
                    {g.title}
                  </h4>
                  <p className="mt-1.5 text-hb-xs text-[#4E5968] leading-relaxed break-keep">
                    {g.recommend}
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-[#F1F3F6] flex items-center justify-between text-hb-xs font-bold text-[#141A23]">
                  <span>{g.ctaLabel}</span>
                  <Icon
                    d={ICON.arrow}
                    className="w-3.5 h-3.5 text-[#E8521A] transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
