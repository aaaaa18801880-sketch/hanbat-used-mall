import React from "react";
import Link from "next/link";
import Image from "next/image";
import { STORE, telHref } from "../../lib/site";
import { serializeJsonLd } from "../../lib/json-ld";
import {
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
} from "../../lib/ui";
import { Icon, ICON } from "../../lib/icons";
import { V2InquirySectionWithWizard } from "../../components/inquiry/v2-wizard-quick-inquiry";
import { PurchaseGuideLightbox } from "../../components/purchase/purchase-guide-lightbox";

const SELL_ELIGIBLE_CRITERIA = [
  "제조 10년 이내 정상 작동 가정용 냉장고 · 세탁기 · 에어컨 · TV",
  "업소용 45박스 · 쇼케이스 · 제빙기 등 식당/카페 설비 일괄 매입",
  "최근 연식 · 외관 양호 · 실외기/부속 완비 시 우대 시세 적용",
] as const;

const SELL_EXCLUDED_CRITERIA = [
  "작동 불능 · 심한 부식 · 침수 및 주요 부품이 파손된 기기",
  "단순 생활폐기물 처리 대행 및 재판매가 어려운 초구형 모델",
  "엘리베이터 없는 고층 · 천장형/벽걸이 철거 · 사다리차 시 비용 협의",
] as const;

const BUYBACK_FAQS = [
  {
    q: "사진은 몇 장 정도 어떤 각도로 찍어서 보내야 하나요?",
    a: "제품 전체 정면 사진 1장, 내부(또는 사용 상태) 사진 1장, 모델명·제조년월이 적힌 명판 스티커 근접 사진 1장 등 2~4장을 올려주시면 정확한 사전 시세 안내가 가능합니다.",
  },
  {
    q: "방문 수거 가능 지역과 정산 방식이 궁금합니다.",
    a: "대전 전역(중구·서구·유성구·동구·대덕구)과 세종시, 계룡·공주·논산·금산·옥천·청주 등 인근 충청권에 직영 차량이 출장 방문하며, 수거 확인 즉시 현장 계좌 입금 또는 현금으로 정산해 드립니다.",
  },
  {
    q: "식당·카페 폐업이나 이전 시 대량 집기 철거도 함께 되나요?",
    a: "네, 45박스·테이블냉장고·쇼케이스·제빙기·스탠드/천장형 냉난방기 등 업소용 설비 일괄 매입과 철거를 한 번에 진행합니다.",
  },
] as const;

const BUYBACK_STEPS = [
  {
    step: "01단계",
    num: "01",
    title: "사진 · 모델명 접수",
    desc: "전면 사진과 모델명·제조년월 스티커 사진을 첨부해 온라인 또는 카톡으로 접수합니다.",
    icon: "sell" as const,
  },
  {
    step: "02단계",
    num: "02",
    title: "예상 견적 및 일정 조율",
    desc: "담당자가 연식과 외관 상태를 확인한 뒤 매입 가능 여부와 방문 일정을 안내해 드립니다.",
    icon: "closure" as const,
  },
  {
    step: "03단계",
    num: "03",
    title: "방문 수거 · 현장 즉시 정산",
    desc: "약속된 일정에 전문 기사가 직접 방문하여 안전하게 분리·수거 후 현장에서 즉시 정산합니다.",
    icon: "shield" as const,
  },
] as const;

export default function PurchasePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${STORE.url}/purchase#faq`,
    mainEntity: BUYBACK_FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#141A23] flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
      />
      <SiteHeader />

      {/* 상단 매입 전용 에디토리얼 헤더 (좌측 핵심 안내 + 우측 명판 촬영 비주얼 카드) */}
      <section className="bg-white border-b border-[#E5E3DC]">
        <div className="hb-container py-6 sm:py-9">
          <nav
            aria-label="페이지 경로"
            className="flex items-center gap-1.5 text-hb-xs font-medium text-[#64748B] mb-3.5"
          >
            <Link href="/" className="hover:text-[#141A23] transition-colors">
              홈
            </Link>
            <Icon d={ICON.right} className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span className="font-bold text-[#141A23]">가전 매입</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-9 items-center">
            <div className="lg:col-span-7 space-y-3">
              <span className="hb-eyebrow">가전 · 업소용 주방설비 방문 매입</span>
              <h1 className="text-hb-2xl sm:text-hb-3xl font-bold tracking-[-0.03em] leading-[1.2] text-[#141A23] break-keep [text-wrap:balance]">
                중고 가전 · 업소용 주방기기 방문 매입 신청
              </h1>
              <p className="max-w-2xl text-hb-sm sm:text-hb-base text-[#4E5968] leading-relaxed break-keep [text-wrap:pretty]">
                가정 이사·가전 교체부터 식당·카페·사무실 폐업 및 이전 대량 정리까지,
                사진과 품목 정보를 남겨주시면 확인 후 직영 차량 방문 수거 및 현장 즉시 정산을 도와드립니다.
              </p>

              {/* 경량 3단계 요약 헤어라인 스트립 (무박스) */}
              <ol
                aria-label="방문 매입 진행 절차"
                className="pt-3 mt-1 grid grid-cols-3 divide-x divide-[#E5E3DC] border-y border-[#E5E3DC] py-2.5"
              >
                {BUYBACK_STEPS.map((item, idx) => (
                  <li
                    key={item.step}
                    className={
                      idx === 0
                        ? "pr-2.5 sm:pr-4 min-w-0"
                        : idx === 1
                        ? "px-2.5 sm:px-4 min-w-0"
                        : "pl-2.5 sm:pl-4 min-w-0"
                    }
                  >
                    <span className="block font-mono text-hb-xs font-bold text-[#C84312] tabular-nums">
                      {item.num}.
                    </span>
                    <strong className="mt-0.5 block text-hb-xs sm:text-hb-sm font-bold text-[#141A23] break-keep leading-snug">
                      {item.title}
                    </strong>
                  </li>
                ))}
              </ol>

              <div className="pt-1.5 flex flex-wrap items-center gap-2">
                <a
                  href="#purchase-form"
                  className="hb-btn-primary h-11 px-5 text-hb-sm"
                >
                  <span>사진으로 견적 신청하기</span>
                  <Icon d={ICON.arrow} className="w-4 h-4" />
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-11 px-4 text-hb-sm"
                >
                  <Icon d={ICON.chat} className="w-4 h-4" />
                  <span>카톡 사진 전송</span>
                </a>
                <a
                  href={telHref(STORE.mobile)}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#DFDCD4] bg-white px-4 text-hb-sm font-mono font-bold text-[#141A23] hover:border-[#141A23] transition-colors tabular-nums"
                >
                  <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#C84312]" />
                  <span>{STORE.mobile}</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F3F1EB]">
                  <Image
                    src="/images/guide/buyback-appraisal.jpg"
                    alt="가전 정면과 명판 스티커를 촬영해 현장 감가 없이 매입 견적을 확인하는 안내 일러스트"
                    fill
                    sizes="(max-width: 1024px) 100vw, 480px"
                    priority
                    loading="eager"
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#141A23]/80 via-[#141A23]/35 to-transparent"
                    aria-hidden="true"
                  />
                  <div className="absolute inset-x-3.5 bottom-3 flex items-end justify-between gap-2 text-white">
                    <div>
                      <p className="text-hb-xs font-bold text-[#FF8A50]">
                        빠른 견적 핵심 팁
                      </p>
                      <p className="text-hb-xs sm:text-hb-sm font-bold leading-snug">
                        정면 1장 + 명판 스티커 1장이면 가장 정확합니다
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3 text-hb-xs bg-[#FAFAF8] border-t border-[#EAE8E2]">
                  <span className="font-medium text-[#475569]">
                    현장 감가 막는 사전 체크 방법
                  </span>
                  <Link
                    href="/guide/appliance-buyback-no-deduction-guide"
                    className="inline-flex items-center gap-1 font-bold text-[#C84312] hover:text-[#141A23] transition-colors shrink-0"
                  >
                    <span>요령 보기</span>
                    <Icon d={ICON.right} className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main id="main-content" tabIndex={-1} className="hb-container py-6 sm:py-9 flex-1 space-y-6 sm:space-y-8 focus:outline-none">
        {/* 1순위: 온라인 매입 신청 폼 + 직통 매입 상담 데스크 (스크롤 최소화, 즉시 전환) */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-12 items-start">
          {/* 좌측 8컬럼: 통합 매입 신청 폼 (토스·증권앱 스타일 경량 헤더) */}
          <div
            id="purchase-form"
            className="scroll-mt-24 rounded-3xl border border-[#EAE8E2] bg-white p-5 sm:p-8 lg:col-span-8"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#F0EEE8]">
              <h2 className="text-hb-base font-bold text-[#141A23]">
                온라인 매입 견적 신청서
              </h2>
              <span className="inline-flex items-center gap-1.5 text-hb-xs font-semibold text-[#0F766E]">
                <Icon d={ICON.shieldCheck} className="w-3.5 h-3.5 shrink-0" />
                <span>비밀글 자동 보호</span>
              </span>
            </div>

            <V2InquirySectionWithWizard
              defaultType="내 물건 팔기"
              fixedType="내 물건 팔기"
              hideTypeSelector={true}
              variant="embedded"
            />
          </div>

          {/* 우측 4컬럼: 직통 매입 상담 데스크 + 공식 매입 안내문 원본 프리뷰 */}
          <aside className="space-y-4 sm:space-y-5 lg:col-span-4 lg:sticky lg:top-[92px]">
            <div className="rounded-3xl border border-[#EAE8E2] bg-white p-5 sm:p-6">
              <h2 className="text-hb-lg font-bold text-[#141A23] break-keep">
                급매 · 폐업 일괄 정리 직통 상담
              </h2>
              <p className="mt-1.5 text-hb-sm text-[#64748B] leading-relaxed break-keep">
                품목이 많거나 빠른 방문 수거가 필요하시면 전화나 카톡으로 바로 사진 보내주시면 가장 빨라요.
              </p>

              <dl className="mt-4 rounded-2xl bg-[#F6F5F1] px-4 py-1 divide-y divide-[#E8E6DF] text-hb-xs sm:text-hb-sm">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="font-medium text-[#64748B]">매장 대표전화</dt>
                  <dd>
                    <a
                      href={telHref(STORE.tel)}
                      className="font-mono font-bold text-[#141A23] hover:text-[#C84312] tabular-nums"
                    >
                      {STORE.tel}
                    </a>
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="font-medium text-[#64748B]">매입·수거 직통</dt>
                  <dd>
                    <a
                      href={telHref(STORE.mobile)}
                      className="font-mono font-bold text-[#C84312] hover:underline tabular-nums"
                    >
                      {STORE.mobile}
                    </a>
                  </dd>
                </div>
              </dl>

              <div className="mt-4 space-y-2">
                <a
                  href={telHref(STORE.tel)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#141A23] px-4 text-hb-sm font-bold text-white hover:bg-[#1E2736] active:scale-[0.985] transition-[background-color,transform] duration-150"
                >
                  <Icon d={ICON.phone} className="h-4 w-4 text-[#FF8A50]" />
                  <span>전화 매입 상담 ({STORE.tel})</span>
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] px-4 text-hb-sm font-bold text-[#191600] hover:bg-[#F2D900] active:scale-[0.985] transition-[background-color,transform] duration-150"
                >
                  <Icon d={ICON.chat} className="h-4 w-4" />
                  <span>카카오톡으로 사진 보내기</span>
                </a>
              </div>
            </div>

            {/* 공식 매입 안내문 원본 보기 카드 (크롭 없이 object-contain) */}
            <PurchaseGuideLightbox />
          </aside>
        </div>

        {/* 2순위: 매입 가능/우대 기준 vs 매입 불가/사전 확인 (단일 카드 내 2열 헤어라인 분할) */}
        <section
          aria-label="매입 가능 및 제외 기준"
          className="rounded-2xl border border-[#E5E3DC] bg-white grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#EAE8E2]"
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EAE8E2]">
              <h2 className="text-hb-base sm:text-hb-lg font-bold text-[#141A23]">
                매입 가능 · 우대 기준
              </h2>
              <span className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#0F766E] shrink-0">
                <Icon d={ICON.check} className="w-3.5 h-3.5" />
                <span>우선 매입</span>
              </span>
            </div>
            <ul className="mt-3.5 space-y-2.5 text-hb-xs sm:text-hb-sm text-[#334155] leading-relaxed">
              {SELL_ELIGIBLE_CRITERIA.map((line) => (
                <li key={line} className="flex items-start gap-2 break-keep">
                  <Icon
                    d={ICON.check}
                    className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EAE8E2]">
              <h2 className="text-hb-base sm:text-hb-lg font-bold text-[#141A23]">
                매입 불가 · 사전 확인 필요
              </h2>
              <span className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#C84312] shrink-0">
                <Icon d={ICON.close} className="w-3.5 h-3.5" />
                <span>제외 · 협의</span>
              </span>
            </div>
            <ul className="mt-3.5 space-y-2.5 text-hb-xs sm:text-hb-sm text-[#4E5968] leading-relaxed">
              {SELL_EXCLUDED_CRITERIA.map((line) => (
                <li key={line} className="flex items-start gap-2 break-keep">
                  <Icon
                    d={ICON.close}
                    className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3순위: 지역 매입 출장 범위 및 자주 묻는 질문 (내부 중첩 박스 제거 → 3열 헤어라인 분할) */}
        <section
          aria-labelledby="purchase-faq-title"
          className="rounded-2xl border border-[#E5E3DC] bg-white p-5 sm:p-7"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EAE8E2]">
            <h2
              id="purchase-faq-title"
              className="text-hb-lg sm:text-hb-xl font-bold text-[#141A23]"
            >
              대전 · 세종 · 충청 방문 매입 안내
            </h2>
            <span className="text-hb-xs font-medium text-[#64748B]">
              대전 전역 · 세종 · 계룡 · 공주 · 논산 · 옥천 · 청주 출장 수거
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#EAE8E2]">
            {BUYBACK_FAQS.map((item, idx) => (
              <div
                key={item.q}
                className={
                  idx === 0
                    ? "pb-4 md:pb-0 md:pr-5"
                    : idx === 1
                    ? "py-4 md:py-0 md:px-5"
                    : "pt-4 md:pt-0 md:pl-5"
                }
              >
                <h3 className="text-hb-sm font-bold text-[#141A23] break-keep leading-snug">
                  {item.q}
                </h3>
                <p className="mt-2 text-hb-xs sm:text-hb-sm text-[#4E5968] leading-relaxed break-keep">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
      <MobileCtaBar
        inquiryScrollTargetId="purchase-form"
        inquiryFallbackType="내 물건 팔기"
        primaryActionLabel="매입 신청"
        kakaoLabel="카톡 사진전송"
        accentPrimary
      />
    </div>
  );
}
