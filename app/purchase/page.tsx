import React from "react";
import { STORE, telHref } from "../../lib/site";
import {
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
  Icon,
  ICON,
} from "../../lib/ui";
import { ModernApplianceIcon } from "../../components/ui/modern-icons";
import { V2InquirySectionWithWizard } from "../../components/inquiry/v2-wizard-quick-inquiry";
import { PurchaseGuideLightbox } from "../../components/purchase/purchase-guide-lightbox";

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
  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#141A23] flex flex-col">
      <SiteHeader />

      {/* 상단 매입 전용 헤더 */}
      <section className="bg-white border-b border-[#E2E6EC]">
        <div className="hb-container py-8 sm:py-11">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <span className="hb-eyebrow">가전 · 업소용 주방설비 방문 매입</span>
              <h1 className="mt-2 text-hb-2xl sm:text-hb-3xl font-bold tracking-[-0.03em] leading-[1.2] text-[#141A23]">
                중고 가전 · 업소용 주방기기 매입 신청
              </h1>
              <p className="mt-2.5 max-w-2xl text-hb-sm sm:text-hb-base text-[#4E5968] leading-relaxed break-keep [text-wrap:pretty]">
                가정 이사·가전 교체부터 식당·카페·사무실 폐업 및 이전 대량 정리까지,
                <br className="hidden sm:inline" /> 사진과 품목 정보를 남겨주시면 확인 후 방문 수거 및 현장 즉시 정산을 도와드립니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="rounded-xl border border-[#E2E6EC] bg-[#F1F3F6] px-3.5 py-2 text-hb-xs font-bold text-[#141A23]">
                가정용 · 업소용 전 품목
              </span>
              <span className="rounded-xl border border-[#E2E6EC] bg-[#F1F3F6] px-3.5 py-2 text-hb-xs font-bold text-[#141A23]">
                전문 기사 직접 철거·수거
              </span>
              <span className="rounded-xl border border-[#E8521A]/30 bg-[#FFF4EE] px-3.5 py-2 text-hb-xs font-bold text-[#E8521A]">
                현장 즉시 정산
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="hb-container py-7 sm:py-10 flex-1 space-y-6 sm:space-y-8">
        {/* 3단계 매입 진행 프로세스 일체형 아키텍처 바 */}
        <section
          aria-label="방문 매입 진행 절차"
          className="rounded-2xl border border-[#E2E6EC] bg-white divide-y md:divide-y-0 md:divide-x divide-[#E2E6EC] shadow-2xs grid grid-cols-1 md:grid-cols-3 overflow-hidden"
        >
          {BUYBACK_STEPS.map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 p-5 sm:p-6"
            >
              <ModernApplianceIcon
                name={item.icon}
                className="w-11 h-11 sm:w-12 sm:h-12 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-hb-xs font-bold tracking-[0.06em] text-[#E8521A]">
                    {item.step}
                  </span>
                </div>
                <h2 className="mt-0.5 text-hb-base sm:text-hb-lg font-bold text-[#141A23]">
                  {item.title}
                </h2>
                <p className="mt-1.5 text-hb-sm text-[#4E5968] leading-relaxed break-keep">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-12 items-start">
          {/* 좌측 8컬럼: 통합 매입 신청 폼 */}
          <div className="rounded-2xl border border-[#E2E6EC] bg-white p-5 sm:p-7 shadow-2xs lg:col-span-8">
            <div className="mb-5 pb-4 border-b border-[#E2E6EC] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-hb-lg sm:text-hb-xl font-bold text-[#141A23]">
                  온라인 매입 견적 신청서
                </h2>
                <p className="mt-1 text-hb-sm text-[#64748B]">
                  사진과 수거 지역을 남겨주시면 담당 기사가 확인 후 최고가 견적과 수거 일정을 빠르게 안내해 드립니다.
                </p>
              </div>
              <span className="rounded-lg bg-[#F7F8FA] border border-[#E2E6EC] px-3 py-1 text-hb-xs font-bold text-[#141A23]">
                개인정보 보호 비밀글 자동 적용
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
            <div className="rounded-2xl border border-[#E2E6EC] bg-white p-5 sm:p-6 shadow-2xs">
              <span className="hb-eyebrow">급매 · 폐업 직통 상담</span>
              <h2 className="mt-1.5 text-hb-lg font-bold text-[#141A23]">
                급매 · 폐업 일괄 정리 직통 상담
              </h2>
              <p className="mt-2 text-hb-sm text-[#4E5968] leading-relaxed break-keep">
                품목이 많거나 빠른 방문 수거가 필요하신 경우, 전화 또는 카카오톡으로 사진을 보내주시면 가장 빠르게 견적을 안내해 드립니다.
              </p>

              <div className="mt-4 rounded-xl bg-[#F7F8FA] border border-[#E2E6EC] p-3.5 space-y-2 text-hb-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#64748B]">매장 대표전화</span>
                  <a
                    href={telHref(STORE.tel)}
                    className="font-bold text-[#141A23] hover:text-[#E8521A] tabular-nums"
                  >
                    {STORE.tel}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#64748B]">매입/수거 직통</span>
                  <a
                    href={telHref(STORE.mobile)}
                    className="font-bold text-[#E8521A] hover:underline tabular-nums"
                  >
                    {STORE.mobile}
                  </a>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <a
                  href={telHref(STORE.tel)}
                  className="hb-btn-accent h-11 w-full text-hb-sm"
                >
                  <Icon d={ICON.phone} className="h-4 w-4" />
                  <span>전화 매입 상담 ({STORE.tel})</span>
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-11 w-full text-hb-sm"
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
      </main>

      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
