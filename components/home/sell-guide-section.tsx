import React from "react";
import { STORE } from "../../lib/site";
import { Icon, ICON, SectionHeading } from "../../lib/ui";

const SELL_STEPS = [
  {
    step: "STEP 01",
    title: "사진 및 기본 정보 접수",
    desc: "홈페이지 문의 폼이나 카카오톡으로 제품 전체 사진, 모델명(라벨), 사용 기간, 수거 지역을 보내주세요.",
  },
  {
    step: "STEP 02",
    title: "사전 매입 견적 안내",
    desc: "보내주신 사진과 제품 상태를 확인한 뒤, 불필요한 현장 흥정 없이 합리적인 예상 매입가를 안내해 드립니다.",
  },
  {
    step: "STEP 03",
    title: "약속 일정 방문 및 수거",
    desc: "고객님이 원하시는 날짜와 시간에 맞춰 전문 기사님이 현장에 방문하여 작동 상태를 확인하고 안전하게 반출합니다.",
  },
  {
    step: "STEP 04",
    title: "현장 즉시 대금 입금",
    desc: "수거 작업이 완료되는 즉시 지정해 주신 계좌로 매입 대금 전액을 입금해 드립니다(세금계산서 발행 가능).",
  },
] as const;

const SELL_SITUATIONS = [
  "가정 이사 · 가전 교체",
  "원룸 · 오피스텔 퇴실 정리",
  "식당 · 카페 폐업 일괄 처분",
  "매장 업종 변경 · 리모델링",
  "사무실 · 학원 냉난방기 처분",
] as const;

export function SellGuideSection({
  onOpenSellInquiry,
}: {
  onOpenSellInquiry: () => void;
}) {
  return (
    <section
      id="sell-section"
      aria-labelledby="sell-heading"
      className="border-b border-[#E4E0D8] bg-[#0E1A2B] py-16 text-white sm:py-20 lg:py-24"
    >
      <div className="hb-container">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              dark
              eyebrow="Appliance Buyback"
              title={
                <span id="sell-heading">
                  쓰지 않는 가전과 주방설비,
                  <br />
                  사진 한 장으로 매입 견적을 받아보세요.
                </span>
              }
              desc="가정용 단품 가전부터 식당·카페 폐업 시 나오는 대량 주방기기까지, 직접 방문하여 수거하고 현장에서 즉시 정산합니다."
            />

            <div className="mt-8 rounded-md border border-white/15 bg-white/5 p-5">
              <p className="text-[13px] font-bold text-[#FF8A50]">
                견적 문의 시 알려주시면 좋은 정보
              </p>
              <ul className="mt-2.5 space-y-1.5 text-[14px] text-white/85">
                <li>• 제품 정면 사진 및 제조사·모델명 스티커 사진</li>
                <li>• 대략적인 구매 연도(연식) 및 정상 작동 여부</li>
                <li>• 수거 희망 지역(동 단위) 및 계단/엘리베이터 여부</li>
              </ul>
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {SELL_SITUATIONS.map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm border border-white/20 px-2.5 py-1 text-[12.5px] font-medium text-white/85"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onOpenSellInquiry}
                className="hb-btn-accent h-[52px] px-6 text-[15px]"
              >
                <span>무료 매입 견적 신청하기</span>
                <Icon d={ICON.arrow} className="w-4 h-4" />
              </button>
              <a
                href={STORE.kakaoChat}
                target="_blank"
                rel="noopener noreferrer"
                className="hb-btn-kakao h-[52px] px-6 text-[15px]"
              >
                <Icon d={ICON.chat} className="w-4 h-4" />
                <span>카톡으로 사진 보내기</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            <h3 className="text-[14px] font-bold uppercase tracking-wider text-white/60">
              매입 진행 4단계 프로세스
            </h3>
            <ol className="mt-4 divide-y divide-white/15 border-y border-white/15">
              {SELL_STEPS.map((item) => (
                <li
                  key={item.step}
                  className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[100px_1fr] sm:gap-4 sm:py-7"
                >
                  <span className="text-[13px] font-bold tracking-wider text-[#FF8A50]">
                    {item.step}
                  </span>
                  <div>
                    <h4 className="text-[18px] font-bold text-white">
                      {item.title}
                    </h4>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-white/75">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
