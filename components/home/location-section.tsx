import React from "react";
import { STORE, telHref } from "../../lib/site";
import { Icon, ICON, SectionHeading } from "../../lib/ui";

export function LocationSection() {
  return (
    <section
      id="location-section"
      aria-labelledby="location-heading"
      className="border-b border-[#E4E0D8] bg-white py-16 sm:py-20 lg:py-24"
    >
      <div className="hb-container">
        <SectionHeading
          eyebrow="Showroom Location"
          title={<span id="location-heading">오프라인 매장 오시는 길</span>}
          desc="대전 중촌고가도로 밑 전용 주차장이 마련된 매장에서 다양한 실물을 직접 확인하실 수 있습니다."
        />

        <div className="mt-10 grid overflow-hidden rounded-md border border-[#E4E0D8] bg-[#FAF9F7] lg:grid-cols-12">
          {/* 지도 영역 */}
          <div className="relative h-[340px] sm:h-[420px] lg:col-span-7 lg:h-auto lg:min-h-[460px] bg-[#EFECE6]">
            <iframe
              title="한밭중고전자 매장 위치 지도"
              src="https://maps.google.com/maps?q=%EB%8C%80%EC%A0%84+%EC%A4%91%EA%B5%AC+%EC%A4%91%EC%B4%8C%EB%8F%99+144&t=&z=16&ie=UTF8&iwloc=&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0"
              allowFullScreen
            />
          </div>

          {/* 매장 상세 정보 카드 */}
          <div className="flex flex-col justify-between bg-[#0E1A2B] p-6 text-white sm:p-8 lg:col-span-5 lg:p-10">
            <div>
              <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#FF8A50]">
                {STORE.name}
              </span>
              <h3 className="mt-2 text-[24px] font-bold tracking-tight">
                {STORE.address}
              </h3>
              <p className="mt-1 text-[14px] text-white/75">
                {STORE.addressNote} · {STORE.parking}
              </p>

              <dl className="mt-8 space-y-5 border-t border-white/15 pt-6 text-[14.5px]">
                <div className="flex items-start gap-3.5">
                  <Icon
                    d={ICON.phone}
                    className="w-5 h-5 text-[#FF8A50] shrink-0 mt-0.5"
                  />
                  <div>
                    <dt className="text-[12px] font-semibold text-white/60">
                      대표 전화 · 휴대전화
                    </dt>
                    <dd className="mt-0.5 font-bold text-[19px] tracking-wide">
                      <a href={telHref(STORE.tel)} className="hover:text-[#FF8A50]">
                        {STORE.tel}
                      </a>
                    </dd>
                    <dd className="text-[15px] text-white/85">
                      <a
                        href={telHref(STORE.mobile)}
                        className="hover:text-[#FF8A50]"
                      >
                        {STORE.mobile}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Icon
                    d={ICON.clock}
                    className="w-5 h-5 text-[#FF8A50] shrink-0 mt-0.5"
                  />
                  <div>
                    <dt className="text-[12px] font-semibold text-white/60">
                      영업시간 안내
                    </dt>
                    <dd className="mt-0.5 font-semibold text-white">
                      {STORE.hours}
                    </dd>
                    <dd className="text-[13px] text-[#FF8A50] mt-0.5">
                      ※ {STORE.closed}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="mt-8 pt-6 border-t border-white/15">
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={STORE.naverMap}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-[#03C75A] text-[14px] font-bold text-white hover:bg-[#02b350] transition-colors"
                >
                  네이버 지도 길찾기
                </a>
                <a
                  href="https://map.kakao.com/link/to/한밭중고전자,36.335503,127.406981"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-[#FEE500] text-[14px] font-bold text-[#191600] hover:bg-[#F2D900] transition-colors"
                >
                  카카오맵 길찾기
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}