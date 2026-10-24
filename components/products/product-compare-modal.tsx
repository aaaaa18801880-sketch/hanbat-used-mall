// 파일 경로: components/products/product-compare-modal.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  clearRecentViewedProducts,
  extractModelName,
  extractSpecCapsules,
  formatProductPrice,
  getProductStatusLabel,
  getRecentViewedProducts,
  isProductSold,
  normalizeProductCategory,
  parseProductDescription,
  RECENT_VIEWED_EVENT,
  removeRecentViewedProduct,
  type QuoteBasketItem,
  type RecentViewedItem,
  updateQuoteBasketItemQuantity,
  removeQuoteBasketItem,
} from "../../lib/site";
import { Icon, ICON, Modal, SafeImg } from "../../lib/ui";
import { V2SpatialFitPlanner } from "./v2-spatial-fit-planner";

function extractWidthMmFromItem(item: QuoteBasketItem): number | null {
  const text = `${item.title || ""}\n${item.description || ""}`;
  // 1) 명시적 가로/폭 mm 패턴 또는 가로×세로×높이 첫 숫자 추출
  const dimMatch = text.match(
    /(?:가로|폭)\s*[:：]?\s*(\d{3,4})\s*mm|\b(\d{3,4})\s*[x×*]\s*\d{3,4}/i
  );
  if (dimMatch) {
    const val = Number(dimMatch[1] || dimMatch[2]);
    if (val >= 350 && val <= 3000) return val;
  }
  // 2) 업소용 표준 박스 규격 참고치
  if (/45\s*박스/.test(text)) return 1260;
  if (/25\s*박스|30\s*박스/.test(text)) return 650;
  return null;
}

export function ProductCompareModal({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: QuoteBasketItem[];
}) {
  const compareItems = items.slice(0, 3);

  // 각 상품의 description에서 파싱된 실제 사양(specs) 추출
  const parsedSpecsPerItem = compareItems.map((item) => {
    const parsed = parseProductDescription(item.description);
    const map = new Map<string, string>();
    for (const s of parsed.specs) {
      if (s.label && s.value) {
        map.set(s.label.trim(), s.value.trim());
      }
    }
    return map;
  });

  // 실제 데이터에 존재하는 사양 라벨만 수집 (최대 6개 핵심 항목)
  const allSpecLabels = Array.from(
    new Set(
      parsedSpecsPerItem.flatMap((map) =>
        Array.from(map.keys()).filter((k) => k !== "모델명")
      )
    )
  ).slice(0, 6);

  const getWarrantyText = (catRaw: string) => {
    const cat = normalizeProductCategory(catRaw);
    if (cat === "에어컨/냉난방기") return "계약조건별 최대 8개월";
    if (cat === "냉장고" || cat === "세탁기/건조기")
      return "계약조건별 최대 4개월";
    return "품목·계약조건별 협의";
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="관심 매물 상세 비교"
      panelClassName="max-w-4xl"
    >
      <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-[#E5E2DC] bg-white shadow-2xl">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-[#E5E2DC] bg-[#0E1A2B] px-5 py-4 text-white">
          <div>
            <span className="text-[11.5px] font-bold text-[#FF8A50]">
              실매물 스펙 · 조건 한눈에 비교
            </span>
            <h2 className="text-[17px] sm:text-[19px] font-extrabold">
              선택한 매물 비교 ({compareItems.length}건)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="비교 창 닫기"
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <Icon d={ICON.close} className="w-5 h-5" />
          </button>
        </div>

        {/* 비교 테이블 본문 */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6">
          {compareItems.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-[#646E7E]">
              비교할 상품이 없습니다. 갤러리에서 관심 매물을 견적함에 담아주세요.
            </div>
          ) : (
            <>
              {(() => {
                const widths = compareItems
                  .map((it) => {
                    const w = extractWidthMmFromItem(it);
                    const qty = it.quantity && it.quantity > 0 ? it.quantity : 1;
                    return w ? { title: it.title, width: w * qty, qty } : null;
                  })
                  .filter(
                    (x): x is { title: string; width: number; qty: number } =>
                      Boolean(x)
                  );

                if (widths.length === 0) return null;
                const totalWidthMm = widths.reduce(
                  (acc, cur) => acc + cur.width,
                  0
                );

                return (
                  <div className="mb-4 space-y-3">
                    <div className="rounded-lg border border-[#FADCD0] bg-[#FFF5F0] px-4 py-2.5 text-[12.5px] text-[#3E4756] flex flex-wrap items-center justify-between gap-2">
                      <span>
                        📏{" "}
                        <strong className="text-[#0E1A2B]">
                          설치 공간 가로폭 참고:
                        </strong>{" "}
                        치수가 확인된 {widths.length}종 매물의 가로폭 합계는 약{" "}
                        <strong className="text-[#D9531E] font-extrabold tabular-nums">
                          {totalWidthMm.toLocaleString()}mm (
                          {(totalWidthMm / 1000).toFixed(2)}m)
                        </strong>
                        입니다.
                      </span>
                      <span className="text-[11.5px] text-[#646E7E]">
                        ※ 방열 및 문열림을 위해 양옆 최소 100mm 이상 여유 공간을
                        권장합니다.
                      </span>
                    </div>
                    <V2SpatialFitPlanner
                      overrideWidthMm={totalWidthMm}
                      title={compareItems.map((it) => it.title).join(" + ")}
                    />
                  </div>
                );
              })()}

              <table className="w-full min-w-[540px] border-collapse text-left text-[13px] sm:text-[13.5px]">
              <thead>
                <tr className="border-b border-[#E5E2DC]">
                  <th className="w-[110px] sm:w-[130px] bg-[#FAF9F7] p-3 font-bold text-[#646E7E] align-middle">
                    비교 항목
                  </th>
                  {compareItems.map((item) => {
                    const sold = isProductSold(item.status);
                    return (
                      <th
                        key={item.id}
                        className="w-1/3 p-3 align-top border-l border-[#E5E2DC]"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-[#E5E2DC] bg-[#F4F2ED]">
                            <SafeImg
                              src={item.imageUrl}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                            {sold && (
                              <span className="absolute inset-0 flex items-center justify-center bg-[#0E1A2B]/55 text-[11px] font-bold text-white">
                                판매완료
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/${item.id}`}
                            onClick={onClose}
                            className="font-bold text-[#0E1A2B] hover:text-[#D9531E] line-clamp-2 leading-snug"
                          >
                            {item.title}
                          </Link>
                          <div className="flex items-center justify-between gap-1 pt-1">
                            <Link
                              href={`/${item.id}`}
                              onClick={onClose}
                              className="text-[11.5px] font-semibold text-[#646E7E] underline"
                            >
                              상세보기
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeQuoteBasketItem(item.id)}
                              className="text-[11.5px] font-semibold text-red-600 hover:underline"
                            >
                              제외
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DC]">
                {/* 1. 판매 가격 */}
                <tr>
                  <th className="bg-[#FAF9F7] p-3 font-bold text-[#0E1A2B]">
                    판매 가격
                  </th>
                  {compareItems.map((item) => {
                    const sold = isProductSold(item.status);
                    return (
                      <td
                        key={item.id}
                        className="p-3 font-extrabold text-[15px] text-[#D9531E] border-l border-[#E5E2DC] tabular-nums"
                      >
                        {sold
                          ? "판매완료 (유사재고 문의)"
                          : formatProductPrice(item.price, item.category)}
                      </td>
                    );
                  })}
                </tr>

                {/* 2. 희망 수량 조절 */}
                <tr>
                  <th className="bg-[#FAF9F7] p-3 font-bold text-[#0E1A2B]">
                    문의 수량
                  </th>
                  {compareItems.map((item) => {
                    const qty = item.quantity || 1;
                    return (
                      <td
                        key={item.id}
                        className="p-3 border-l border-[#E5E2DC]"
                      >
                        <div className="inline-flex items-center rounded border border-[#CFCAC0] bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuoteBasketItemQuantity(item.id, qty - 1)
                            }
                            aria-label="수량 감소"
                            className="h-7 w-7 font-bold text-[#0E1A2B] hover:bg-[#FAF9F7]"
                          >
                            -
                          </button>
                          <span className="px-2.5 text-[12.5px] font-bold tabular-nums">
                            {qty}대
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuoteBasketItemQuantity(item.id, qty + 1)
                            }
                            aria-label="수량 증가"
                            className="h-7 w-7 font-bold text-[#0E1A2B] hover:bg-[#FAF9F7]"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* 3. 품목 분류 및 판매 상태 */}
                <tr>
                  <th className="bg-[#FAF9F7] p-3 font-bold text-[#0E1A2B]">
                    품목 / 상태
                  </th>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3 border-l border-[#E5E2DC]">
                      <span className="font-semibold text-[#0E1A2B]">
                        {normalizeProductCategory(item.category)}
                      </span>
                      <span className="ml-1.5 inline-block rounded bg-[#FAF9F7] border border-[#E5E2DC] px-1.5 py-0.5 text-[11px] font-bold text-[#3E4756]">
                        {getProductStatusLabel(item.status)}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 4. 확인된 모델명 */}
                <tr>
                  <th className="bg-[#FAF9F7] p-3 font-bold text-[#0E1A2B]">
                    모델명
                  </th>
                  {compareItems.map((item) => {
                    const model =
                      item.modelName ||
                      extractModelName(item.description, item.title);
                    return (
                      <td
                        key={item.id}
                        className="p-3 font-mono text-[12.5px] border-l border-[#E5E2DC]"
                      >
                        {model ? (
                          <span className="font-bold text-[#0E1A2B]">
                            {model}
                          </span>
                        ) : (
                          <span className="text-[#858076]">
                            정보 없음 (상세 문의)
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 5. 확인된 상태 등급 */}
                <tr>
                  <th className="bg-[#FAF9F7] p-3 font-bold text-[#0E1A2B]">
                    상태 등급
                  </th>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3 border-l border-[#E5E2DC]">
                      {item.conditionGrade ? (
                        <span className="inline-block rounded bg-[#FFF5F0] border border-[#FADCD0] px-2 py-0.5 text-[12px] font-bold text-[#D9531E]">
                          {item.conditionGrade}
                        </span>
                      ) : (
                        <span className="text-[#646E7E]">
                          세척·점검 완료 (상세 문의)
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 6. 핵심 규격 캡슐 */}
                <tr>
                  <th className="bg-[#FAF9F7] p-3 font-bold text-[#0E1A2B]">
                    주요 규격
                  </th>
                  {compareItems.map((item) => {
                    const tags = extractSpecCapsules(
                      item.title,
                      item.description,
                      4
                    );
                    return (
                      <td
                        key={item.id}
                        className="p-3 border-l border-[#E5E2DC]"
                      >
                        {tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {tags.map((t) => (
                              <span
                                key={t}
                                className="rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2 py-0.5 text-[11.5px] font-semibold text-[#0E1A2B]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#858076]">
                            정보 없음 (상세 문의)
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 7. 실제 상세 설명에서 파싱된 세부 사양 행 */}
                {allSpecLabels.map((label) => (
                  <tr key={label}>
                    <th className="bg-[#FAF9F7] p-3 font-semibold text-[#3E4756]">
                      {label}
                    </th>
                    {compareItems.map((item, idx) => {
                      const val = parsedSpecsPerItem[idx]?.get(label);
                      return (
                        <td
                          key={item.id + label}
                          className="p-3 border-l border-[#E5E2DC] text-[#0E1A2B]"
                        >
                          {val || (
                            <span className="text-[#858076]">
                              정보 없음 (상세 문의)
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* 8. 보증 및 증빙 기준 */}
                <tr>
                  <th className="bg-[#FAF9F7] p-3 font-bold text-[#0E1A2B]">
                    보증 / 증빙
                  </th>
                  {compareItems.map((item) => (
                    <td
                      key={item.id}
                      className="p-3 border-l border-[#E5E2DC] text-[12.5px] text-[#3E4756]"
                    >
                      <span className="block font-semibold text-[#0E1A2B]">
                        {getWarrantyText(item.category)}
                      </span>
                      <span className="text-[11.5px] text-[#646E7E]">
                        세금계산서 · 카드 · 직배송 상담
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            </>
          )}
        </div>

        {/* 하단 액션 바 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E2DC] bg-[#FAF9F7] px-5 py-3.5">
          <p className="text-[12px] text-[#646E7E]">
            ※ 표기된 사양 외에 설치 공간·전원·배관 호환 여부는 묶음 문의로 남겨주시면 정확히 안내해 드립니다.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="hb-btn-outline h-10 px-4 text-[13px]"
            >
              닫기
            </button>
            <Link
              href="/inquiry?write=1&bundle=1"
              onClick={onClose}
              className="hb-btn-accent h-10 px-5 text-[13px]"
            >
              <span>이 구성으로 일괄 견적 문의</span>
              <Icon d={ICON.arrow} className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/**
 * [신규 기능 ④] 비로그인 최근 본 매물 가로 스트립 컴포넌트
 * - /gallery 및 /[id] 하단에 배치되어 최근 조회한 매물로 즉시 복귀할 수 있습니다.
 */
export function RecentViewedStrip({
  excludeId,
  className = "",
}: {
  excludeId?: string;
  className?: string;
}) {
  const [items, setItems] = useState<RecentViewedItem[]>([]);

  useEffect(() => {
    const sync = () => {
      const all = getRecentViewedProducts();
      setItems(excludeId ? all.filter((x) => x.id !== excludeId) : all);
    };
    sync();
    window.addEventListener(RECENT_VIEWED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(RECENT_VIEWED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section
      aria-label="최근 본 매물"
      className={`rounded-xl border border-[#E5E2DC] bg-white p-4 sm:p-5 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#D9531E]" />
          <h2 className="text-[15px] sm:text-[16px] font-extrabold text-[#0E1A2B]">
            최근 본 매물 ({items.length})
          </h2>
          <span className="hidden sm:inline text-[12px] text-[#646E7E]">
            로그인 없이 현재 기기에만 안전하게 저장됩니다
          </span>
        </div>
        <button
          type="button"
          onClick={() => clearRecentViewedProducts()}
          className="text-[12px] font-semibold text-[#646E7E] hover:text-[#0E1A2B] underline underline-offset-2"
        >
          기록 비우기
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {items.map((item) => {
          const sold = isProductSold(item.status);
          return (
            <div
              key={item.id}
              className="group relative flex w-[170px] sm:w-[190px] shrink-0 flex-col overflow-hidden rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] hover:border-[#0E1A2B] transition-colors"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  removeRecentViewedProduct(item.id);
                }}
                aria-label={`${item.title} 최근 본 목록에서 삭제`}
                className="absolute right-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white hover:bg-red-600"
              >
                <Icon d={ICON.close} className="w-3 h-3" />
              </button>

              <Link href={`/${item.id}`} className="flex flex-1 flex-col">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFECE6] border-b border-[#E5E2DC]">
                  <SafeImg
                    src={item.imageUrl}
                    alt={item.title}
                    className={`h-full w-full object-cover ${
                      sold ? "grayscale opacity-70" : ""
                    }`}
                  />
                  {sold && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-[#0E1A2B]/85 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      판매완료
                    </span>
                  )}
                </div>
                <div className="p-2.5 flex flex-1 flex-col justify-between">
                  <div>
                    <span className="block text-[10.5px] font-semibold text-[#646E7E] truncate">
                      {item.category}
                    </span>
                    <p className="mt-0.5 line-clamp-1 text-[12.5px] font-bold text-[#0E1A2B] group-hover:text-[#D9531E]">
                      {item.title}
                    </p>
                  </div>
                  <strong className="mt-1.5 block text-[13px] font-extrabold text-[#D9531E] tabular-nums">
                    {sold
                      ? "판매완료"
                      : formatProductPrice(item.price, item.category)}
                  </strong>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
