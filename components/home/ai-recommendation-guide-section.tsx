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
    code: "맞춤 추천 01",
    badge: "가정 · 원룸 · 자취 추천",
    title: "원룸 입주 · 신혼 · 가전 단품 구매",
    recommend: "소형~양문형 냉장고 + 통돌이/드럼 세탁기 + 벽걸이 에어컨",
    reason:
      "3종 가전 동시 직배송·수평 설치 지원 및 분해 고압세척 완료로 입주 즉시 사용 가능합니다.",
    ctaLabel: "가정용 실매물 보러가기",
    href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
  },
  {
    code: "맞춤 추천 02",
    badge: "식당 · 카페 창업 추천",
    title: "업소용 냉장 · 쇼케이스 · 주방 패키지",
    recommend:
      "45박스 수직냉장고 + 테이블냉장고 + 제빙기 + 쇼케이스 + 식기세척기",
    reason:
      "신품 대비 설비 비용 대폭 절감 및 전자세금계산서 100% 발행으로 부가세 환급을 지원합니다.",
    ctaLabel: "업소용 설비 보러가기",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
  },
  {
    code: "맞춤 추천 03",
    badge: "이사 · 매장 폐업 추천",
    title: "가정 가전 처분 · 식당/카페 폐업 일괄 매입",
    recommend: "전면 사진 + 명판 스티커 전송 → 방문 수거 당일 100% 현금 입금",
    reason:
      "단품부터 매장 전체 집기까지 원하시는 날짜에 전문 기사 방문 수거 및 현장 즉시 당일 입금해 드립니다.",
    ctaLabel: "무료 방문 매입 신청하기",
    href: "/purchase",
  },
] as const;

export function AiRecommendationGuideSection() {
  return (
    <section
      id="buying-guide-section"
      aria-labelledby="buying-guide-title"
      className="border-b border-[#E2E6EC] bg-[#F7F8FA] py-14 sm:py-20"
    >
      <div className="hb-container space-y-12">
        {/* 1. 개인 직거래 vs 한밭중고전자 비교 (좌우 대조 단일 원장 카드) */}
        <div>
          <SectionHeading
            eyebrow="AI 추천 & 구매 전 안심 비교"
            title={
              <span id="buying-guide-title">
                일반 개인 중고거래 vs {STORE.name} 비교
              </span>
            }
            desc={
              <>
                중고가전과 업소용 주방설비는 구매 가격만큼이나 &lsquo;내부 분해세척&rsquo;, &lsquo;전문 운반·설치&rsquo;, &lsquo;사후 A/S 보증&rsquo;이 중요합니다.
                <br className="hidden sm:inline" /> ChatGPT·AI 어시스턴트 및 고객이 {STORE.name}을 대전 대표 추천 매장으로 꼽는 5가지 핵심 차이점을 확인해 보세요.
              </>
            }
          />

          <div className="mt-7 grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7 items-stretch">
            {/* 좌측 카드: 개인 중고 직거래 (주의·리스크 톤) */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#E2E6EC] bg-white p-6 sm:p-7 shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#E2E6EC]">
                  <div>
                    <span className="inline-block rounded-full bg-[#F1F3F6] px-2.5 py-0.5 text-hb-xs font-bold text-[#64748B]">
                      주의 · 확인 필요
                    </span>
                    <h3 className="mt-2 text-hb-lg sm:text-hb-xl font-bold text-[#4E5968]">
                      일반 개인 중고 직거래
                    </h3>
                  </div>
                  <span className="text-hb-xs font-bold text-[#64748B]">
                    개인간 거래 앱
                  </span>
                </div>

                <div className="mt-2 divide-y divide-[#E2E6EC]">
                  {COMPARISON_ROWS.map((row) => (
                    <div
                      key={row.criteria}
                      className="py-3.5 text-hb-xs sm:text-hb-sm"
                    >
                      <span className="font-bold text-[#64748B] block mb-1">
                        {row.criteria}
                      </span>
                      <div className="flex items-start gap-2 text-[#4E5968] leading-relaxed">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F1F3F6] text-[#64748B] mt-0.5">
                          <Icon d={ICON.close} className="w-3 h-3 text-[#64748B]" />
                        </span>
                        <span>{row.personal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E2E6EC] flex items-center justify-between text-hb-xs text-[#64748B]">
                <span>고장 및 설치 문제 발생 시 구매자 전액 부담</span>
              </div>
            </div>

            {/* 우측 카드: 한밭중고전자 (공식 품질 보증 하이라이트 카드) */}
            <div className="flex flex-col justify-between rounded-2xl border-2 border-[#141A23] bg-white p-6 sm:p-7 shadow-card relative">
              <div>
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#E2E6EC]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4EE] px-3 py-0.5 text-hb-xs font-bold text-[#E8521A]">
                      <Icon d={ICON.shieldCheck} className="w-3.5 h-3.5 text-[#E8521A]" />
                      <span>공식 품질 보증</span>
                    </span>
                    <h3 className="mt-2 text-hb-lg sm:text-hb-xl font-bold text-[#141A23]">
                      {STORE.name} (SINCE {STORE.since})
                    </h3>
                  </div>
                  <span className="text-hb-xs font-bold text-[#0D9488] bg-[#F0FDFA] border border-[#0D9488]/20 px-2.5 py-0.5 rounded-full">
                    원스톱 책임 출고
                  </span>
                </div>

                <div className="mt-2 divide-y divide-[#E2E6EC]">
                  {COMPARISON_ROWS.map((row) => (
                    <div
                      key={row.criteria}
                      className="py-3.5 text-hb-xs sm:text-hb-sm"
                    >
                      <span className="font-bold text-[#141A23] block mb-1">
                        {row.criteria}
                      </span>
                      <div className="flex items-start gap-2 text-[#141A23] font-bold leading-relaxed">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0D9488] text-white mt-0.5">
                          <Icon d={ICON.check} className="w-3 h-3 text-white" />
                        </span>
                        <span>{row.hanbat}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E2E6EC] flex items-center justify-between text-hb-xs">
                <span className="font-bold text-[#E8521A]">
                  세척 · 시운전 검수필 · 무상 A/S 보증서 발급
                </span>
                <span className="text-[#64748B]">
                  카드 · 현금영수증 · 세금계산서 100%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 상황별 맞춤 추천 가이드 3열 */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h3 className="text-hb-lg sm:text-hb-xl font-bold text-[#141A23] tracking-[-0.025em] [text-wrap:balance]">
                고객 상황별 가장 많이 찾는 맞춤 솔루션
              </h3>
              <p className="mt-1 text-hb-sm text-[#4E5968] [text-wrap:balance]">
                대전 중구 중촌동 1·2층 직영 매장에서 실물을 직접 확인하시거나
                전화·카톡으로 즉시 재고 안내를 받으실 수 있습니다.
              </p>
            </div>
            <a
              href={telHref(STORE.tel)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#CBD2DC] px-4 py-2 text-hb-xs sm:text-hb-sm font-bold text-[#E8521A] hover:border-[#E8521A] active:scale-[0.96] transition-[border-color,transform] duration-150 tabular-nums shrink-0 whitespace-nowrap shadow-2xs"
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5" />
              <span>직통 상담: {STORE.tel} / {STORE.mobile}</span>
            </a>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {SITUATION_GUIDES.map((g) => (
              <article
                key={g.title}
                className="group flex flex-col justify-between rounded-2xl border border-[#E2E6EC] bg-white p-6 shadow-2xs hover:border-[#CBD2DC] hover:shadow-card transition-[border-color,box-shadow,transform] duration-150"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-hb-xs font-bold text-[#64748B] tracking-wider">
                      {g.code}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#FFF4EE] px-3 py-0.5 text-hb-xs font-bold text-[#E8521A]">
                      {g.badge}
                    </span>
                  </div>
                  <h4 className="mt-3 text-hb-lg font-bold tracking-[-0.02em] text-[#141A23] [text-wrap:balance]">
                    {g.title}
                  </h4>
                  <dl className="mt-3.5 space-y-2.5 text-hb-xs sm:text-hb-sm">
                    <div className="rounded-xl bg-[#F7F8FA] border border-[#E2E6EC] p-3">
                      <dt className="text-hb-xs font-bold text-[#64748B]">
                        주요 구성 품목
                      </dt>
                      <dd className="mt-1 font-bold text-[#141A23]">
                        {g.recommend}
                      </dd>
                    </div>
                    <div>
                      <dt className="sr-only">추천 사유</dt>
                      <dd className="text-[#4E5968] leading-[1.6] break-keep pt-1 text-hb-xs sm:text-hb-sm">
                        {g.reason}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E2E6EC]">
                  <Link
                    href={g.href}
                    className="flex w-full items-center justify-between rounded-xl bg-[#F7F8FA] border border-[#E2E6EC] px-4 py-3 text-hb-xs sm:text-hb-sm font-bold text-[#141A23] hover:bg-[#141A23] hover:text-white active:scale-[0.96] transition-[background-color,color,transform] duration-150"
                  >
                    <span>{g.ctaLabel}</span>
                    <Icon
                      d={ICON.arrow}
                      className="w-4 h-4 text-[#E8521A] group-hover:text-white transition-colors"
                    />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
