"use client";

import React from "react";
import Link from "next/link";
import { ICON, Icon } from "../../lib/icons";
import { STORE, telHref, trackEvent } from "../../lib/site";
import { QuickInquiryModal } from "../inquiry/quick-inquiry-modal";
import { HanbatBrandLogo } from "./ui-primitives";
import {
  QuoteBasketFloatingBar,
  FloatingQuickWing,
} from "./quote-basket-floating";

export function SiteFooter({
  isAdmin = false,
  onAdminClick,
}: {
  isAdmin?: boolean;
  onAdminClick?: () => void;
}) {
  return (
    <>
      <QuoteBasketFloatingBar />
      <FloatingQuickWing />
      <QuickInquiryModal />
      <footer className="relative bg-[#141A23] text-white/80 mt-auto border-t border-[#1E2736]">
        <div className="hb-container py-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-12 pb-8 border-b border-white/10">
            {/* 브랜드 및 직통 고객센터 영역 (타이포그래피 중심 절제형) */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="flex items-center gap-3">
                <HanbatBrandLogo dark size="compact" />
                <span className="rounded bg-[#E8521A]/20 border border-[#E8521A]/40 px-2 py-0.5 text-hb-xs font-bold text-[#FF8A50]">
                  {STORE.since}년 개업
                </span>
              </div>
              <p className="max-w-md text-hb-sm leading-[1.7] text-white/70 break-keep">
                가정용 중고가전부터 식당·카페 업소용 설비까지 고압세척과 배송 전 작동 점검을 마친 정직한 매물만 출고합니다.
              </p>

              <div className="pt-2 text-hb-xs space-y-1">
                <div className="flex flex-wrap items-baseline gap-3">
                  <a
                    href={telHref(STORE.tel)}
                    onClick={() =>
                      trackEvent("click_tel_consult", {
                        location: "site_footer",
                      })
                    }
                    className="text-hb-xl font-bold text-white hover:text-[#FF8A50] transition-colors tabular-nums"
                  >
                    {STORE.tel}
                  </a>
                  <a
                    href={telHref(STORE.mobile)}
                    onClick={() =>
                      trackEvent("click_tel_consult", {
                        location: "site_footer_mobile",
                      })
                    }
                    className="text-hb-sm font-semibold text-white/80 hover:text-white transition-colors tabular-nums"
                  >
                    직통 {STORE.mobile}
                  </a>
                </div>
                <p className="text-white/55">
                  영업시간 {STORE.hours} · {STORE.closed} · 세금계산서 발행
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={telHref(STORE.tel)}
                  onClick={() =>
                    trackEvent("click_tel_consult", { location: "site_footer" })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-hb-xs font-semibold text-white transition-colors tabular-nums"
                >
                  <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#FF8A50]" />
                  전화 연결
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent("click_kakao_consult", {
                      location: "site_footer",
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#FEE500] hover:bg-[#F2D900] px-3 py-1.5 text-hb-xs font-semibold text-[#191600] transition-colors"
                >
                  <Icon d={ICON.chat} className="w-3.5 h-3.5" />
                  카톡 상담
                </a>
              </div>
            </div>

            {/* 내비게이션 링크 */}
            <nav
              className="grid grid-cols-2 gap-8 text-hb-sm sm:grid-cols-3 lg:col-span-7"
              aria-label="푸터 메뉴"
            >
              <div>
                <p className="font-bold text-white text-hb-sm">
                  취급 품목 안내
                </p>
                <ul className="mt-3.5 space-y-2.5 text-white/70">
                  <li>
                    <Link
                      href="/gallery?category=에어컨/냉난방기"
                      className="inline-flex min-h-6 items-center hover:text-white transition-colors"
                    >
                      에어컨 · 냉난방기
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/gallery?category=냉장고"
                      className="inline-flex min-h-6 items-center hover:text-white transition-colors"
                    >
                      냉장고 · 김치냉장고
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/gallery?category=세탁기/건조기"
                      className="inline-flex min-h-6 items-center hover:text-white transition-colors"
                    >
                      세탁기 · 건조기
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/gallery?category=업소용기기"
                      className="inline-flex min-h-6 items-center hover:text-white transition-colors"
                    >
                      업소용 냉장 · 주방기기
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/gallery?category=기타"
                      className="inline-flex min-h-6 items-center hover:text-white transition-colors"
                    >
                      주방 · 생활 소형가전
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-white text-hb-sm">
                  고객 지원 · 매입
                </p>
                <ul className="mt-3.5 space-y-2.5 text-white/70">
                  <li>
                    <Link
                      href="/gallery"
                      className="inline-flex min-h-6 items-center hover:text-white transition-colors"
                    >
                      판매 제품 갤러리
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/purchase"
                      className="inline-flex min-h-6 items-center hover:text-white transition-colors"
                    >
                      중고가전 방문 매입 신청
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/#reviews-section"
                      className="inline-flex min-h-6 items-center hover:text-white transition-colors"
                    >
                      배송 · 설치 현장 사례
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/inquiry"
                      className="inline-flex min-h-6 items-center hover:text-white transition-colors"
                    >
                      견적 문의 · 매입 게시판
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/guide"
                      className="inline-flex min-h-6 items-center hover:text-white transition-colors"
                    >
                      가전 · 전기 정보 게시판
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="inline-flex min-h-6 items-center hover:text-white transition-colors"
                    >
                      개인정보처리방침
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="font-bold text-white text-hb-sm">
                  오프라인 매장 안내
                </p>
                <ul className="mt-3.5 space-y-2 text-white/70 text-hb-sm leading-relaxed">
                  <li className="text-white font-semibold">{STORE.roadAddress}</li>
                  <li className="text-white/85">지번: {STORE.jibunAddress}</li>
                  <li>({STORE.addressNote})</li>
                  <li>영업시간: {STORE.hours}</li>
                  <li>휴무안내: {STORE.closed}</li>
                  <li className="pt-1 text-[#FF8A50] font-semibold">
                    매장 앞 전용 주차 · 실물 확인 가능
                  </li>
                </ul>
              </div>
            </nav>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-hb-xs leading-relaxed text-white/55">
            <div>
              <p>
                상호: {STORE.legalName} · 대표자: {STORE.ceo} · 사업자등록번호:{" "}
                {STORE.bizNo} · 통신판매업신고: {STORE.mailOrderNo}
              </p>
              <p className="mt-0.5">
                개인정보보호책임자: {STORE.privacyOfficer} · 주소:{" "}
                {STORE.roadAddress} (지번: {STORE.jibunAddress}, {STORE.addressNote}) · 대표전화: {STORE.tel} ·
                휴대전화: {STORE.mobile}
              </p>
              <p className="mt-1">
                &copy; {new Date().getFullYear()} {STORE.name}. All rights reserved.
              </p>
            </div>

            {onAdminClick && (
              <button
                type="button"
                onClick={onAdminClick}
                className="inline-flex min-h-6 items-center text-hb-xs text-white/55 hover:text-white underline underline-offset-4 transition-colors self-start sm:self-end shrink-0"
              >
                {isAdmin ? "관리자 로그아웃" : "관리자 로그인"}
              </button>
            )}
          </div>
        </div>
        <div className="h-[calc(62px+env(safe-area-inset-bottom))] lg:hidden" aria-hidden="true" />
      </footer>
    </>
  );
}
