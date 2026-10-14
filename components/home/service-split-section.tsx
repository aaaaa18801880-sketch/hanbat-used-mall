import React from "react";
import Link from "next/link";
import { Icon, ICON, SafeImg, SectionHeading } from "../../lib/ui";

export function ServiceSplitSection({
  onOpenInquiry,
}: {
  onOpenInquiry: (type: "구매 문의" | "내 물건 팔기", defaultTitle?: string) => void;
}) {
  return (
    <section
      aria-labelledby="split-heading"
      className="border-b border-[#E4E0D8] bg-[#F6F5F2] py-16 sm:py-20 lg:py-24"
    >
      <div className="hb-container">
        <SectionHeading
          eyebrow="Tailored Solutions"
          title={
            <span id="split-heading">
              가정용 단품 구매부터 식당·카페 창업 설비까지
            </span>
          }
          desc="사용하시는 공간과 목적에 따라 확인해야 할 규격과 상담 방식이 다릅니다. 고객님의 상황에 맞는 경로를 선택해 보세요."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* 1. 가정용 가전 카드 */}
          <div className="flex flex-col overflow-hidden rounded-md border border-[#E4E0D8] bg-white">
            <div className="aspect-[16/8] w-full overflow-hidden bg-[#EFECE6]">
              <SafeImg
                src="/images/home-bg.png"
                alt="가정용 중고가전 쇼룸"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-1 flex-col p-6 sm:p-8">
              <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#D9531E]">
                For Home &amp; Office
              </span>
              <h3 className="mt-2 text-[22px] font-bold text-[#0E1A2B] sm:text-[26px]">
                가정용 · 원룸 · 사무실 중고가전
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-[#4B5260]">
                이사, 신혼살림, 자취방, 사택·기숙사, 사무실 휴게 공간에 필요한 가전을 합리적인 예산으로 구성해 드립니다.
              </p>

              <dl className="mt-6 space-y-2.5 border-t border-[#EEEBE5] pt-5 text-[14px]">
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 font-bold text-[#0E1A2B]">주요 품목</dt>
                  <dd className="text-[#4B5260]">
                    벽걸이·스탠드 에어컨, 양문형·일반 냉장고, 김치냉장고, 드럼·통돌이 세탁기, 의류건조기
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 font-bold text-[#0E1A2B]">체크 포인트</dt>
                  <dd className="text-[#4B5260]">
                    설치 공간 가로·깊이 치수, 엘리베이터 유무, 에어컨 실외기 거치 환경
                  </dd>
                </div>
              </dl>

              <div className="mt-8 pt-4 flex flex-wrap gap-2.5">
                <Link
                  href="/gallery?category=냉장고"
                  className="hb-btn-primary h-11 px-5 text-[14px]"
                >
                  <span>가정용 매물 보기</span>
                  <Icon d={ICON.arrow} className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => onOpenInquiry("구매 문의", "가정용 가전 구매 상담")}
                  className="hb-btn-outline h-11 px-5 text-[14px]"
                >
                  맞춤 추천 문의
                </button>
              </div>
            </div>
          </div>

          {/* 2. 업소용·상업용 설비 카드 */}
          <div className="flex flex-col overflow-hidden rounded-md border border-[#0E1A2B] bg-[#0E1A2B] text-white">
            <div className="aspect-[16/8] w-full overflow-hidden bg-[#162438]">
              <SafeImg
                src="/images/biz-bg.png"
                alt="업소용 냉장고 및 상업용 주방기기"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-1 flex-col p-6 sm:p-8">
              <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#FF8A50]">
                For Restaurant &amp; Cafe (B2B)
              </span>
              <h3 className="mt-2 text-[22px] font-bold text-white sm:text-[26px]">
                업소용 냉장 · 상업용 주방설비
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-white/75">
                식당·카페·베이커리·주점 오픈에 필요한 주방 설비 도입부터 폐업·업종 변경 시 일괄 매입·철거까지 원스톱으로 지원합니다.
              </p>

              <dl className="mt-6 space-y-2.5 border-t border-white/15 pt-5 text-[14px]">
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 font-bold text-white">주요 품목</dt>
                  <dd className="text-white/80">
                    25·45박스 냉장·냉동고, 테이블냉장고, 음료·주류 쇼케이스, 제빙기, 식기세척기, 중대형 냉난방기
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 font-bold text-white">체크 포인트</dt>
                  <dd className="text-white/80">
                    단상/삼상 전원 규격, 급·배수 라인 위치, 복수 품목 세트 도입 시 견적 및 세금계산서 발행
                  </dd>
                </div>
              </dl>

              <div className="mt-8 pt-4 flex flex-wrap gap-2.5">
                <Link
                  href="/gallery?category=업소용기기"
                  className="hb-btn-accent h-11 px-5 text-[14px]"
                >
                  <span>업소용 설비 보기</span>
                  <Icon d={ICON.arrow} className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    onOpenInquiry("구매 문의", "업소용 주방설비·냉장고 견적 문의")
                  }
                  className="inline-flex h-11 items-center justify-center rounded-md border border-white/30 bg-white/10 px-5 text-[14px] font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  창업·대량 견적 문의
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}