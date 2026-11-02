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
    code: "SOLUTION 01",
    badge: "가정 · 원룸 · 자취 추천",
    title: "원룸 입주 · 신혼 · 가전 단품 구매",
    recommend: "소형~양문형 냉장고 + 통돌이/드럼 세탁기 + 벽걸이 에어컨",
    reason:
      "3종 가전 동시 직배송·수평 설치 지원 및 분해 고압세척 완료로 입주 즉시 사용 가능합니다.",
    ctaLabel: "가정용 실매물 보러가기",
    href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
  },
  {
    code: "SOLUTION 02",
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
    code: "SOLUTION 03",
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
      className="border-b border-[#E5E8EB] bg-[#F9FAFB] py-14 sm:py-20"
    >
      <div className="hb-container space-y-12">
        {/* 1. 개인 직거래 vs 한밭중고전자 비교 테이블 (토스/애플 클린 매트릭스) */}
        <div>
          <SectionHeading
            eyebrow="WHY HANBAT SHOWROOM"
            title={
              <span id="buying-guide-title">
                일반 개인 중고거래 vs {STORE.name} 직영 매장 비교
              </span>
            }
            desc={
              <>
                중고가전과 업소용 설비는 구매 가격만큼이나 &lsquo;내부 세척&rsquo;, &lsquo;운반·설치&rsquo;, &lsquo;사후 A/S 보증&rsquo;이 중요합니다.
                <br className="hidden sm:inline" /> 구매 전 아래 5가지 비교 기준을 꼭 확인해 보세요.
              </>
            }
          />

          <div className="mt-7 overflow-hidden rounded-3xl border border-[#E5E8EB] bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-hb-xs sm:text-hb-sm">
                <thead>
                  <tr className="border-b border-[#E5E8EB] bg-[#F2F4F6]/80 text-[#191F28]">
                    <th
                      scope="col"
                      className="py-4 px-5 sm:px-6 font-extrabold w-[24%] min-w-[130px] text-[#4E5968]"
                    >
                      비교 항목
                    </th>
                    <th
                      scope="col"
                      className="py-4 px-5 sm:px-6 font-semibold text-[#6B7684] w-[34%] min-w-[200px]"
                    >
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#E5E8EB] text-[#4E5968] text-hb-xs mb-1 font-bold">
                        위험 · 주의
                      </span>
                      <p>일반 개인간 중고거래 (직거래 앱 등)</p>
                    </th>
                    <th
                      scope="col"
                      className="py-4 px-5 sm:px-6 font-extrabold text-white bg-[#191F28] w-[42%] min-w-[240px]"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6F0F] px-2.5 py-0.5 text-hb-xs font-extrabold text-white tracking-wide">
                          <Icon d={ICON.shieldCheck} className="w-3 h-3 text-white" />
                          OFFICIAL GUARANTEE
                        </span>
                      </div>
                      <p className="text-white text-hb-sm">
                        {STORE.name} (SINCE {STORE.since} 직영 쇼룸)
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F4F6]">
                  {COMPARISON_ROWS.map((row) => (
                    <tr
                      key={row.criteria}
                      className="hover:bg-[#F9FAFB] transition-colors"
                    >
                      <th
                        scope="row"
                        className="py-4 px-5 sm:px-6 font-bold text-[#191F28]"
                      >
                        {row.criteria}
                      </th>
                      <td className="py-4 px-5 sm:px-6 text-[#6B7684] leading-relaxed">
                        {row.personal}
                      </td>
                      <td className="py-4 px-5 sm:px-6 font-bold text-[#191F28] bg-[#FFF4EE]/45 leading-relaxed">
                        <span className="inline-flex items-center gap-2 text-[#191F28]">
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF4EE] text-[#FF6F0F]">
                            <Icon d={ICON.check} className="w-3.5 h-3.5" />
                          </span>
                          <span>{row.hanbat}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 2. 상황별 맞춤 추천 가이드 3열 (토스/애플 벤토 카드) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h3 className="text-hb-lg sm:text-hb-xl font-extrabold text-[#191F28] tracking-[-0.025em]">
                고객 상황별 가장 많이 찾는 맞춤 솔루션
              </h3>
              <p className="mt-1 text-hb-sm text-[#4E5968]">
                대전 중구 중촌동 1·2층 직영 매장에서 실물을 직접 확인하시거나
                전화·카톡으로 즉시 재고 안내를 받으실 수 있습니다.
              </p>
            </div>
            <a
              href={telHref(STORE.tel)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E5E8EB] px-4 py-2 text-hb-xs sm:text-hb-sm font-extrabold text-[#F05600] hover:border-[#FF6F0F] transition-colors tabular-nums shrink-0 whitespace-nowrap shadow-2xs"
            >
              <Icon d={ICON.phone} className="w-3.5 h-3.5" />
              <span>직통 상담: {STORE.tel} / {STORE.mobile}</span>
            </a>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {SITUATION_GUIDES.map((g) => (
              <article
                key={g.title}
                className="group flex flex-col justify-between rounded-3xl border border-[#E5E8EB] bg-white p-6 shadow-card hover:-translate-y-0.5 hover:border-[#D1D6DB] transition-all duration-200 hover:shadow-card-hover"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-hb-xs font-extrabold text-[#8B95A1] tracking-wider">
                      {g.code}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#FFF4EE] px-3 py-0.5 text-hb-xs font-bold text-[#F05600]">
                      {g.badge}
                    </span>
                  </div>
                  <h4 className="mt-3 text-hb-lg font-extrabold tracking-[-0.02em] text-[#191F28]">
                    {g.title}
                  </h4>
                  <dl className="mt-3.5 space-y-2.5 text-hb-xs sm:text-hb-sm">
                    <div className="rounded-2xl bg-[#F2F4F6]/80 px-4 py-3">
                      <dt className="text-hb-xs font-bold text-[#6B7684]">
                        주요 구성 품목
                      </dt>
                      <dd className="mt-1 font-bold text-[#191F28]">
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

                <div className="mt-5 pt-4 border-t border-[#F2F4F6]">
                  <Link
                    href={g.href}
                    className="flex w-full items-center justify-between rounded-2xl bg-[#F2F4F6] px-4 py-3.5 text-hb-xs sm:text-hb-sm font-extrabold text-[#191F28] group-hover:bg-[#191F28] group-hover:text-white transition-colors"
                  >
                    <span>{g.ctaLabel}</span>
                    <Icon
                      d={ICON.arrow}
                      className="w-4 h-4 text-[#FF6F0F] group-hover:text-white group-hover:translate-x-0.5 transition-all"
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
