// 파일 경로: components/home/home-faq-section.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Icon, ICON } from "../../lib/icons";
import { STORE, telHref, type InquiryTypeValue } from "../../lib/site";

type FaqCategoryKey = "all" | "buy" | "delivery" | "sell";

const FAQ_FILTER_OPTIONS: ReadonlyArray<{
  key: FaqCategoryKey;
  label: string;
}> = [
  { key: "all", label: "전체 질문" },
  { key: "buy", label: "구매·A/S" },
  { key: "delivery", label: "배송·설치" },
  { key: "sell", label: "매입·결제" },
];

const FAQS: ReadonlyArray<{
  group: Exclude<FaqCategoryKey, "all">;
  tag: string;
  q: string;
  a: string;
}> = [
  {
    group: "buy",
    tag: "직거래 비교 · 매장 구매 혜택",
    q: "당근 등 개인 직거래 대신 매장에서 구매하면 어떤 점이 더 좋나요?",
    a: `개인 직거래는 용달 섭외와 무거운 가전 운반을 직접 해야 하고, 집에 가져와서 고장 나도 환불이나 수리를 받기 어렵습니다. ${STORE.name}에서는 매장 직영 기사가 집 안까지 직접 배송하고 수평·배관 설치까지 안전하게 마무리해 드립니다. 현장 확인 후 고압세척과 배송 전 작동 점검을 마친 제품만 판매하며, 에어컨 최대 8개월, 일반 가전 최대 4개월간 무상 A/S를 보증해 드리니 안심하고 쓰실 수 있습니다.`,
  },
  {
    group: "delivery",
    tag: "세종 · 충청권 배송 및 출장 매입",
    q: "대전 외에 세종, 청주 등 인근 지역도 배송과 방문 매입이 되나요?",
    a: `네, 가능합니다. 대전 전 지역은 물론 세종, 청주, 천안, 공주, 계룡, 논산 등 충청권 전역에 직영 기사가 직접 배송·설치해 드리며, 이사나 폐업 시 방문 매입도 함께 진행합니다. 그 외 지역도 안전한 화물 택배로 배송을 지원합니다.`,
  },
  {
    group: "delivery",
    tag: "배송 일정 · 이사 지정일 예약",
    q: "원하는 배송 날짜나 이사 일정에 맞춰서 받아볼 수 있나요?",
    a: "네, 가능합니다. 원하시는 이사나 입주 날짜에 맞춰 지정일 배송으로 예약해 두실 수 있습니다. 대전 및 인근 지역은 매장 재고 확인 후 당일이나 익일 빠른 배차도 가능하니, 급하게 가전이 필요하신 경우에도 편하게 일정 문의해 주세요.",
  },
  {
    group: "buy",
    tag: "A/S 접수 · 보증 기준",
    q: "사용하다가 고장 나면 A/S는 어떻게 신청하나요?",
    a: `대표전화(${STORE.tel})나 카카오톡으로 증상을 남겨주시면 직영 기사가 확인 후 방문 점검과 수리를 진행합니다. 보증 기간(에어컨 최대 8개월, 일반 가전 최대 4개월) 내 정상 사용 중 발생한 기능 이상은 무상으로 수리해 드리며, 수리가 어려운 경우 동급 제품으로 교환해 드립니다. (※ 출고 확인 기준 적용)`,
  },
  {
    group: "sell",
    tag: "보상판매 · 기존 가전 수거",
    q: "새로 사면서 기존에 쓰던 가전을 처분하거나 폐가전 수거도 가능한가요?",
    a: "네, 가능합니다. 새 가전을 배송·설치해 드리는 날 기존 가전을 현장에서 바로 수거해 드립니다. 연식과 작동 상태가 양호한 가전은 매입 금액만큼 결제 금액에서 빼드리는 보상판매를 진행하며, 노후 고장 가전도 현장 여건에 따라 함께 수거·철거 상담이 가능합니다.",
  },
  {
    group: "delivery",
    tag: "계단 운반 · 에어컨 설치비",
    q: "엘리베이터가 없는 층이거나 에어컨 설치 시 추가 비용이 나오나요?",
    a: "냉장고·세탁기는 1층 및 엘리베이터가 있는 건물 기준 기본 배송·수평 설치가 무료로 지원됩니다. 엘리베이터가 없는 2층 이상 계단 운반이나 사다리차 진입이 필요한 경우에만 사전 협의 후 최소 실비가 적용됩니다. 에어컨은 배관 길이, 타공 여부, 실외기 앵글 등에 따라 달라지므로, 설치 장소 사진을 보내주시면 현장 추가금 없이 정확한 견적을 먼저 안내해 드립니다.",
  },
  {
    group: "buy",
    tag: "에어컨 · 냉난방기 구매 안내",
    q: "에어컨 살 때 실외기만 따로 살 수도 있나요?",
    a: `${STORE.name}의 모든 에어컨과 냉난방기는 냉매 호환성과 냉방 효율 보증을 위해 실내기와 실외기를 1:1 세트로만 판매합니다. 실외기 단품 구매는 지원하지 않으니 양해 부탁드립니다. 공간 평수와 배관 환경에 맞는 모델은 언제든 문의해 주시면 맞춤 추천해 드립니다.`,
  },
  {
    group: "sell",
    tag: "비대면 주문 · 결제 방법",
    q: "매장에 직접 가지 않고 온라인이나 전화로 바로 구매할 수 있나요?",
    a: `네, 가능합니다. 원하시는 매물의 실물 사진과 작동 확인 내용을 카카오톡으로 꼼꼼하게 확인하신 뒤 비대면으로 주문하실 수 있습니다. 계좌이체, 신용카드 결제, 현금영수증 및 사업자 전자세금계산서 발행을 모두 지원합니다.`,
  },
  {
    group: "sell",
    tag: "가전 판매 견적 팁",
    q: "가전을 팔고 싶은데, 사진을 어떻게 찍어 보내야 견적이 바로 나오나요?",
    a: "① 제품 정면 전체 사진, ② 측면이나 문 안쪽에 붙은 '에너지소비효율 스티커 또는 정격 명판(모델명·제조년월)' 사진, ③ 외관 흠집 유무와 엘리베이터 유무(층수)를 함께 알려주시면 현장 감가 없이 가장 빠르고 정확한 매입 견적을 안내해 드립니다.",
  },
];

const INITIAL_ALL_FAQ_COUNT = 4;

function handleTabListKeyDown<T extends string>(
  e: React.KeyboardEvent<HTMLDivElement>,
  keys: readonly T[],
  current: T,
  onChange: (next: T) => void
) {
  const idx = keys.indexOf(current);
  if (idx < 0) return;

  let nextIdx = idx;
  if (e.key === "ArrowRight") nextIdx = (idx + 1) % keys.length;
  else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + keys.length) % keys.length;
  else if (e.key === "Home") nextIdx = 0;
  else if (e.key === "End") nextIdx = keys.length - 1;
  else return;

  e.preventDefault();
  onChange(keys[nextIdx]);
  const tabs = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  tabs[nextIdx]?.focus();
}

export function HomeFaqSection({
  onOpenInquiry,
  onOpenAirconGuide,
}: {
  onOpenInquiry: (type?: InquiryTypeValue, productTitle?: string) => void;
  onOpenAirconGuide: () => void;
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [faqFilter, setFaqFilter] = useState<FaqCategoryKey>("all");
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  const filteredFaqs = useMemo(
    () =>
      faqFilter === "all"
        ? FAQS
        : FAQS.filter((item) => item.group === faqFilter),
    [faqFilter]
  );

  const canToggleMore =
    faqFilter === "all" && filteredFaqs.length > INITIAL_ALL_FAQ_COUNT;

  const visibleFaqs =
    canToggleMore && !showAllFaqs
      ? filteredFaqs.slice(0, INITIAL_ALL_FAQ_COUNT)
      : filteredFaqs;

  return (
    <section
      id="faq-section"
      className="border-b border-hb-border bg-hb-surface-muted py-7 sm:py-9"
      aria-labelledby="faq-title"
    >
      <div className="hb-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-9 items-start">
          {/* 좌측 4컬럼: 제목 · 주제 필터 · 빠른 상담 카드 */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <p className="font-mono text-hb-xs font-bold uppercase tracking-widest text-[#C84312]">
              FAQ &amp; GUIDE
            </p>
            <h2
              id="faq-title"
              className="mt-1.5 text-hb-xl sm:text-hb-2xl font-extrabold tracking-tight text-[#141A23] leading-tight break-keep [text-wrap:balance]"
            >
              자주 묻는 질문
            </h2>
            <p className="mt-1.5 text-hb-sm text-[#475569] leading-relaxed break-keep">
              보증 기준, 배송·설치 비용, 기존 가전 매입까지 구매 전 가장 많이 확인하시는 내용을 모았습니다.
            </p>

            {/* 주제별 필터 탭 */}
            <div
              className="mt-4 flex flex-wrap gap-2"
              role="tablist"
              aria-label="자주 묻는 질문 주제 필터"
              onKeyDown={(e) =>
                handleTabListKeyDown(
                  e,
                  FAQ_FILTER_OPTIONS.map((o) => o.key),
                  faqFilter,
                  (next) => {
                    setFaqFilter(next);
                    setOpenFaq(0);
                  }
                )
              }
            >
              {FAQ_FILTER_OPTIONS.map((opt) => {
                const active = faqFilter === opt.key;
                const count =
                  opt.key === "all"
                    ? FAQS.length
                    : FAQS.filter((f) => f.group === opt.key).length;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="tab"
                    tabIndex={active ? 0 : -1}
                    aria-selected={active}
                    onClick={() => {
                      setFaqFilter(opt.key);
                      setOpenFaq(0);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-hb-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? "bg-hb-navy text-white"
                        : "border border-hb-border bg-white text-[#475569] hover:border-hb-navy hover:text-hb-text-primary"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`font-mono tabular-nums ${
                        active ? "text-white/75" : "text-[#64748B]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 바로 물어보기 안내 박스 */}
            <div className="mt-5 rounded-2xl border border-hb-border bg-white p-4 shadow-2xs">
              <p className="text-hb-xs font-bold text-[#141A23]">
                찾으시는 내용이 없으신가요?
              </p>
              <p className="mt-1 text-hb-xs text-[#475569] leading-relaxed break-keep">
                설치 공간 사진이나 모델명을 보내주시면 매장 담당자가 바로 확인해 드립니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenInquiry("구매 문의")}
                  className="hb-btn-primary h-9 px-3.5 text-hb-xs active:scale-[0.97]"
                >
                  <Icon d={ICON.chat} className="h-3.5 w-3.5" />
                  <span>1:1 간편 문의</span>
                </button>
                <a
                  href={telHref(STORE.tel)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#CFC7BA] bg-white px-3.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] transition-colors tabular-nums"
                >
                  <Icon d={ICON.phone} className="h-3.5 w-3.5 text-[#C84312]" />
                  <span>{STORE.tel}</span>
                </a>
              </div>
            </div>
          </div>

          {/* 우측 8컬럼: 아코디언 목록 */}
          <div
            className="lg:col-span-8"
            role="tabpanel"
            aria-label="선택한 주제의 자주 묻는 질문"
          >
            <div className="divide-y divide-hb-border rounded-2xl border border-hb-border bg-white shadow-2xs overflow-hidden">
              {visibleFaqs.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div
                    key={f.q}
                    className={`transition-colors ${
                      open ? "bg-[#FBF9F5]" : "bg-white hover:bg-hb-surface-muted"
                    }`}
                  >
                    <h3>
                      <button
                        type="button"
                        id={`faq-q-${i}`}
                        aria-expanded={open}
                        aria-controls={`faq-a-${i}`}
                        onClick={() => setOpenFaq(open ? null : i)}
                        className="flex w-full items-start justify-between gap-4 px-5 py-3.5 sm:px-6 sm:py-4 text-left cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="block text-hb-xs font-semibold text-[#64748B]">
                            {f.tag}
                          </span>
                          <span className="mt-1 flex items-start gap-2.5">
                            <span className="font-mono text-hb-xs sm:text-hb-sm font-bold text-[#C84312] shrink-0 pt-0.5 tabular-nums">
                              Q{String(i + 1).padStart(2, "0")}.
                            </span>
                            <span className="block text-hb-sm sm:text-hb-base font-bold leading-snug text-[#141A23] break-keep">
                              {f.q}
                            </span>
                          </span>
                        </div>
                        <span
                          className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-transform duration-200 ${
                            open
                              ? "rotate-45 bg-[#141A23] text-white border-[#141A23]"
                              : "bg-white border-[#CFC7BA] text-[#141A23]"
                          }`}
                        >
                          <Icon d={ICON.plus} className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </h3>
                    <div
                      id={`faq-a-${i}`}
                      role="region"
                      aria-labelledby={`faq-q-${i}`}
                      aria-hidden={!open}
                      data-open={open ? "true" : "false"}
                      inert={!open}
                      className="hb-faq-panel"
                    >
                      <div className="px-5 pb-4 sm:px-6 sm:pl-14 text-hb-xs sm:text-hb-sm leading-[1.7] text-[#475569] break-keep [text-wrap:pretty]">
                        {f.a.includes(STORE.tel) ? (
                          <>
                            {f.a.split(STORE.tel).map((part, pIdx, arr) => (
                              <React.Fragment key={pIdx}>
                                {part}
                                {pIdx < arr.length - 1 && (
                                  <a
                                    href={telHref(STORE.tel)}
                                    className="font-bold text-[#C84312] hover:underline underline-offset-2 tabular-nums"
                                  >
                                    {STORE.tel}
                                  </a>
                                )}
                              </React.Fragment>
                            ))}
                          </>
                        ) : (
                          f.a
                        )}

                        {f.tag === "에어컨 · 냉난방기 구매 안내" && (
                          <div className="mt-3 pt-2.5 border-t border-[#E2DDD3] flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={onOpenAirconGuide}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CFC7BA] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] hover:bg-[#FAF9F6] active:scale-[0.96] transition-[border-color,background-color,transform] duration-150 cursor-pointer"
                            >
                              <Icon d={ICON.search} className="w-3.5 h-3.5 text-[#C84312]" />
                              <span>에어컨 세트 구성 안내문 크게 보기</span>
                            </button>
                            <Link
                              href="/gallery?category=에어컨/냉난방기"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#141A23] px-3 py-1.5 text-hb-xs font-bold text-white hover:bg-[#232B36] active:scale-[0.96] transition-[background-color,transform] duration-150"
                            >
                              <span>에어컨 실매물 보러가기 →</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {canToggleMore && (
              <div className="mt-3.5 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllFaqs((prev) => !prev)}
                  className="hb-btn-outline h-10 px-5 text-hb-xs sm:text-hb-sm active:scale-[0.97] cursor-pointer"
                >
                  <span>
                    {showAllFaqs
                      ? "주요 질문 4개만 보기"
                      : `자주 묻는 질문 ${filteredFaqs.length - INITIAL_ALL_FAQ_COUNT}건 더 보기`}
                  </span>
                  <Icon
                    d={ICON.down}
                    className={`h-3.5 w-3.5 transition-transform ${
                      showAllFaqs ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
