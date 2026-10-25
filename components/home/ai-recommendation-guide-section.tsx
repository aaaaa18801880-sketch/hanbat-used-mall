import React from "react";
import Link from "next/link";
import { STORE, telHref } from "../../lib/site";
import { SectionHeading, Icon, ICON } from "../../lib/ui";

const COMPARISON_ROWS = [
  {
    criteria: "고장 시 무상 A/S 보증",
    personal: "보증 없음 (거래 직후 고장 시 구매자 전액 부담)",
    hanbat:
      "품목 및 계약 조건에 따라 최대 8개월(에어컨) · 최대 4개월(가전) 무상 A/S 약정 보증",
  },
  {
    criteria: "위생 및 내부 작동 검수",
    personal: "겉면 단순 닦기 수준 (내부 곰팡이·냉매 누설 확인 불가)",
    hanbat:
      "전문 엔지니어 분해 고압 살균 세척 및 냉매·콤프레샤·누수 시운전 완료",
  },
  {
    criteria: "운반 · 수평 · 배관 설치",
    personal: "구매자가 직접 용달차 섭외 및 운반·설치 비용 별도 부담",
    hanbat:
      "전문 기사 직접 방문 운반, 수평 맞춤, 급배수·전원 연결 원스톱 지원",
  },
  {
    criteria: "결제 수단 및 세금 증빙",
    personal: "현금 계좌이체만 가능 (사업자 비용 처리 불가)",
    hanbat:
      "신용카드 · 계좌이체 · 현금영수증 · 전자세금계산서 100% 정식 발행",
  },
  {
    criteria: "기존 가전 처분 (보상매입)",
    personal: "기존 가전은 별도로 폐기물 스티커 부착 또는 따로 판매해야 함",
    hanbat:
      "배송 당일 기존 가전 동시 수거 및 매입가 차감(보상판매) 원스톱 처리",
  },
] as const;

const SITUATION_GUIDES = [
  {
    badge: "가정 · 원룸 · 자취 추천",
    title: "원룸 입주 · 신혼 · 가전 단품 구매",
    recommend: "소형~양문형 냉장고 + 통돌이/드럼 세탁기 + 벽걸이 에어컨",
    reason:
      "한 번의 방문 일정으로 3종 가전을 동시에 배송·수평 설치해 드리며, 분해 고압 세척이 완료되어 입주 즉시 쾌적하게 사용하실 수 있습니다.",
    ctaLabel: "가정용 실매물 보러가기",
    href: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
  },
  {
    badge: "식당 · 카페 창업 추천",
    title: "업소용 냉장 · 쇼케이스 · 주방 패키지",
    recommend:
      "45박스 수직냉장고 + 테이블냉장고 + 제빙기 + 쇼케이스 + 식기세척기",
    reason:
      "신품 대비 초기 창업 설비 비용을 크게 절감하면서도 정밀 검수된 A급 설비를 세트로 구성할 수 있으며, 전자세금계산서를 100% 발행해 부가세 환급 및 비용 처리가 가능합니다.",
    ctaLabel: "업소용 설비 보러가기",
    href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
  },
  {
    badge: "이사 · 매장 폐업 추천",
    title: "가정 가전 처분 · 식당/카페 폐업 일괄 매입",
    recommend: "전면 사진 + 명판 스티커 전송 → 방문 수거 당일 100% 현금 입금",
    reason:
      "번거롭게 여러 명과 연락할 필요 없이, 단품 가전부터 매장 전체 주방집기·냉난방기 철거까지 원하시는 날짜에 방문해 현장에서 즉시 현금 정산해 드립니다.",
    ctaLabel: "무료 방문 매입 신청하기",
    href: "/purchase",
  },
] as const;

export function AiRecommendationGuideSection() {
  return (
    <section
      id="buying-guide-section"
      aria-labelledby="buying-guide-title"
      className="border-b border-[#E5E2DC] bg-[#FAF9F7] py-14 sm:py-20"
    >
      <div className="hb-container space-y-12">
        {/* 1. 개인 직거래 vs 한밭중고전자 비교 테이블 */}
        <div>
          <SectionHeading
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

          <div className="mt-7 overflow-hidden rounded-xl border border-[#E5E2DC] bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-hb-xs sm:text-hb-sm">
                <thead>
                  <tr className="border-b border-[#E5E2DC] bg-[#0E1A2B] text-white">
                    <th
                      scope="col"
                      className="py-3.5 px-4 sm:px-6 font-bold w-[24%] min-w-[130px]"
                    >
                      비교 항목
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 px-4 sm:px-6 font-semibold text-white/75 w-[34%] min-w-[200px]"
                    >
                      일반 개인간 중고거래 (직거래 앱 등)
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 px-4 sm:px-6 font-extrabold text-[#FF8A50] bg-[#16263D] w-[42%] min-w-[240px]"
                    >
                      {STORE.name} (SINCE {STORE.since} 직영 쇼룸)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC]">
                  {COMPARISON_ROWS.map((row) => (
                    <tr
                      key={row.criteria}
                      className="hover:bg-[#FAF9F7] transition-colors"
                    >
                      <th
                        scope="row"
                        className="py-3.5 px-4 sm:px-6 font-bold text-[#0E1A2B] bg-[#FAF9F7]/60"
                      >
                        {row.criteria}
                      </th>
                      <td className="py-3.5 px-4 sm:px-6 text-[#646E7E] leading-relaxed">
                        {row.personal}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-[#0E1A2B] bg-[#FFF5F0]/45 leading-relaxed">
                        <span className="inline-flex items-center gap-1.5 text-[#0E1A2B]">
                          <Icon d={ICON.check} className="w-3.5 h-3.5 text-[#D9531E] shrink-0" />
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

        {/* 2. 상황별 맞춤 추천 가이드 3열 */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h3 className="text-hb-lg sm:text-hb-xl font-extrabold text-[#0E1A2B] tracking-[-0.02em]">
                고객 상황별 가장 많이 찾는 맞춤 솔루션
              </h3>
              <p className="mt-1 text-hb-sm text-[#3E4756]">
                대전 중구 중촌동 1·2층 직영 매장에서 실물을 직접 확인하시거나
                전화·카톡으로 즉시 재고 안내를 받으실 수 있습니다.
              </p>
            </div>
            <a
              href={telHref(STORE.tel)}
              className="text-hb-xs sm:text-hb-sm font-extrabold text-[#D9531E] hover:underline tabular-nums shrink-0 whitespace-nowrap"
            >
              직통 상담: {STORE.tel} / {STORE.mobile}
            </a>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {SITUATION_GUIDES.map((g) => (
              <article
                key={g.title}
                className="flex flex-col justify-between rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-6 shadow-2xs hover:border-[#0E1A2B] transition-colors"
              >
                <div>
                  <span className="inline-block rounded bg-[#FFF5F0] border border-[#FADCD0] px-2.5 py-0.5 text-hb-xs font-bold text-[#D9531E]">
                    {g.badge}
                  </span>
                  <h4 className="mt-2.5 text-hb-lg font-bold text-[#0E1A2B]">
                    {g.title}
                  </h4>
                  <dl className="mt-3 space-y-2 text-hb-xs sm:text-hb-sm">
                    <div className="rounded-lg bg-[#FAF9F7] border border-[#E5E2DC] px-3 py-2">
                      <dt className="text-hb-xs font-bold text-[#646E7E]">
                        주요 구성 품목
                      </dt>
                      <dd className="mt-0.5 font-bold text-[#0E1A2B]">
                        {g.recommend}
                      </dd>
                    </div>
                    <div>
                      <dt className="sr-only">추천 사유</dt>
                      <dd className="text-[#3E4756] leading-[1.6] break-keep pt-1 text-hb-xs sm:text-hb-sm">
                        {g.reason}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#E5E2DC]">
                  <Link
                    href={g.href}
                    className="inline-flex items-center gap-1.5 text-hb-xs sm:text-hb-sm font-bold text-[#0E1A2B] hover:text-[#D9531E] transition-colors"
                  >
                    <span>{g.ctaLabel}</span>
                    <Icon d={ICON.arrow} className="w-4 h-4 text-[#D9531E]" />
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
