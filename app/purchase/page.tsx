"use client";

import React from "react";
import { STORE, telHref } from "../../lib/site";
import { SiteHeader, SiteFooter, MobileCtaBar, Icon, ICON } from "../../lib/ui";
import { UnifiedInquiryForm } from "../../components/inquiry/unified-inquiry-form";

export default function PurchasePage() {
  return (
    <div className="min-h-screen bg-[#F6F5F2] font-sans text-[#1F2530] flex flex-col">
      <SiteHeader />

      <section className="bg-[#0E1A2B] text-white border-b border-[#E4E0D8]">
        <div className="hb-container py-10 sm:py-14">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#FF8A50]">
            Appliance Buyback
          </p>
          <h1 className="mt-2 text-[26px] sm:text-[34px] font-bold tracking-[-0.02em]">
            중고 가전 · 업소용 주방기기 매입 신청
          </h1>
          <p className="mt-2 max-w-2xl text-[14.5px] sm:text-[15.5px] text-white/80 leading-relaxed">
            가정 이사·가전 교체부터 식당·카페 폐업 및 매장 정리까지, 사진과 품목 정보를 남겨주시면 확인 후 방문 수거 및 현장 즉시 정산을 도와드립니다.
          </p>
        </div>
      </section>

      <main className="hb-container py-10 sm:py-14 flex-1">
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          <div className="rounded-md border border-[#E4E0D8] bg-white p-6 sm:p-8 shadow-xs lg:col-span-8">
            <UnifiedInquiryForm defaultType="내 물건 팔기" />
          </div>

          <aside className="space-y-4 lg:col-span-4">
            <div className="rounded-md border border-[#E4E0D8] bg-white p-6">
              <h2 className="text-[16px] font-bold text-[#0E1A2B]">
                빠른 매입 견적을 위한 안내
              </h2>
              <ul className="mt-3 space-y-2 text-[13.5px] text-[#4B5260] leading-relaxed">
                <li>• 제품 전체 외관 사진과 제조년월·모델명 스티커 사진을 첨부해 주시면 정확한 견적 안내가 가능합니다.</li>
                <li>• 접수된 내역은 문의게시판에서 설정하신 비밀번호로 안전하게 확인하실 수 있습니다.</li>
              </ul>
              <div className="mt-5 pt-4 border-t border-[#EEEBE5] space-y-2">
                <a
                  href={telHref(STORE.tel)}
                  className="hb-btn-primary h-11 w-full text-[13.5px]"
                >
                  <Icon d={ICON.phone} className="h-4 w-4 text-[#FF8A50]" />
                  <span>전화 매입 상담 ({STORE.tel})</span>
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-11 w-full text-[13.5px]"
                >
                  <Icon d={ICON.chat} className="h-4 w-4" />
                  <span>카카오톡으로 사진 보내기</span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
