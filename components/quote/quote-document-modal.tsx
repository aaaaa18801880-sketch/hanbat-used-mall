// 파일 경로: components/quote/quote-document-modal.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "../layout/ui-primitives";
import { Icon, ICON } from "../../lib/icons";
import {
  STORE,
  STORE_MERCHANT_POLICY,
  smsHref,
  trackEvent,
  type QuoteBasketItem,
} from "../../lib/site";
import {
  buildQuoteDocumentSummary,
  buildQuotePdfFilename,
  buildQuoteShareMessage,
  formatQuoteDateKst,
} from "../../lib/quote-document";

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }
  if (typeof document === "undefined") return false;
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

export function QuoteDocumentModal({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: QuoteBasketItem[];
}) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [contactName, setContactName] = useState("");
  const [customQuoteName, setCustomQuoteName] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("직영 배송·설치 협의");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const quoteDate = useMemo(() => formatQuoteDateKst(), []);
  const summary = useMemo(() => buildQuoteDocumentSummary(items), [items]);

  const effectiveQuoteName = customQuoteName.trim() || summary.defaultQuoteName;

  const shareMessage = useMemo(
    () =>
      buildQuoteShareMessage(items, {
        recipientName,
        contactName,
        quoteName: effectiveQuoteName,
        quoteDate,
        validDays: 7,
        deliveryNote,
      }),
    [
      items,
      recipientName,
      contactName,
      effectiveQuoteName,
      quoteDate,
      deliveryNote,
    ]
  );

  const smsLink = useMemo(
    () => smsHref(STORE.mobile, shareMessage),
    [shareMessage]
  );

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    trackEvent("print_quote_document", {
      count: items.length,
    });
    document.body.classList.add("hb-printing-quote");
    const cleanup = () => {
      document.body.classList.remove("hb-printing-quote");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  const handleDownloadPdf = async () => {
    const node = sheetRef.current;
    if (!node || isExportingPdf) return;

    setIsExportingPdf(true);
    trackEvent("download_quote_pdf", {
      count: items.length,
    });

    try {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve());
        });
      });

      const [{ toPng }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      const rect = node.getBoundingClientRect();
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        skipFonts: true,
        width: Math.ceil(rect.width),
        height: Math.ceil(node.scrollHeight),
        style: {
          margin: "0",
          transform: "none",
        },
      });

      const img = new window.Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("견적서 이미지 변환 실패"));
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const marginMm = 12;
      const printableWidthMm = pageWidthMm - marginMm * 2;
      const printableHeightMm = pageHeightMm - marginMm * 2;
      const imgHeightMm = (img.height * printableWidthMm) / img.width;

      if (imgHeightMm <= printableHeightMm) {
        pdf.addImage(
          dataUrl,
          "PNG",
          marginMm,
          marginMm,
          printableWidthMm,
          imgHeightMm,
          undefined,
          "FAST"
        );
      } else {
        let remainingHeightMm = imgHeightMm;
        let offsetMm = 0;
        let pageIndex = 0;

        while (remainingHeightMm > 0.5) {
          if (pageIndex > 0) pdf.addPage();
          pdf.addImage(
            dataUrl,
            "PNG",
            marginMm,
            marginMm - offsetMm,
            printableWidthMm,
            imgHeightMm,
            undefined,
            "FAST"
          );
          offsetMm += printableHeightMm;
          remainingHeightMm -= printableHeightMm;
          pageIndex += 1;
        }
      }

      const filename = buildQuotePdfFilename(recipientName, quoteDate);
      pdf.save(filename);
      toast.success("견적서 PDF가 다운로드되었습니다.");
    } catch {
      toast.error(
        "PDF 생성 중 문제가 발생했습니다. 인쇄 버튼에서 'PDF로 저장'을 이용해 주세요.",
        { duration: 4000 }
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleKakaoShareClick = () => {
    trackEvent("click_quote_document_kakao", {
      count: items.length,
    });
    void copyTextToClipboard(shareMessage).then((copied) => {
      if (copied) {
        toast.success(
          "견적서 내용이 복사되었습니다! 카카오톡 창에 붙여넣기(Ctrl+V)해 보내주세요.",
          { duration: 4200 }
        );
      } else {
        toast("카카오톡 상담창이 열립니다. 견적 품목을 함께 전달해 주세요.");
      }
    });
  };

  const handleSmsShareClick = () => {
    trackEvent("click_quote_document_sms", {
      count: items.length,
    });
    void copyTextToClipboard(shareMessage).then((copied) => {
      if (copied) {
        toast.success(
          "문자 발송을 연결합니다. 견적서 내용도 함께 복사해 두었습니다.",
          { duration: 3500 }
        );
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="온라인 견적서"
      panelClassName="max-w-4xl"
    >
      <div className="flex max-h-[90dvh] flex-col overflow-hidden border border-[#D4D4D4] bg-white shadow-2xl">
        {/* 상단 모달 헤더 */}
        <div className="print:hidden flex items-center justify-between gap-3 border-b border-[#E5E5E5] bg-white px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-hb-lg font-bold tracking-tight text-[#141A23] truncate">
              온라인 견적서
            </h2>
            <span className="text-hb-xs text-[#737373]">
              · {summary.totalKindCount}종 {summary.totalUnits}대
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="견적서 창 닫기"
            className="grid h-9 w-9 place-items-center text-[#525252] hover:bg-[#F5F5F5] hover:text-[#141A23] transition-colors cursor-pointer"
          >
            <Icon d={ICON.close} className="w-5 h-5" />
          </button>
        </div>

        {/* 스크롤 본문: A4 공식 견적서 시트 */}
        <div className="flex-1 overflow-y-auto bg-[#F5F5F5] p-3 sm:p-6">
          {items.length === 0 ? (
            <div className="border border-[#E5E5E5] bg-white px-6 py-12 text-center">
              <p className="text-hb-base font-bold text-[#141A23]">
                견적서에 담길 매물이 없습니다.
              </p>
              <p className="mt-1 text-hb-sm text-[#737373]">
                관심 매물을 먼저 선택한 뒤 온라인 견적서를 작성해 주세요.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-[794px]">
              <div
                ref={sheetRef}
                className="hb-quote-print-sheet w-full border border-[#D4D4D4] bg-white p-5 sm:p-9 text-[#141A23]"
              >
                {/* 1. 견적서 상단 헤더 */}
                <div className="flex flex-col gap-3 border-b-2 border-[#141A23] pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-hb-lg sm:text-hb-xl font-extrabold tracking-tight text-[#141A23]">
                      {STORE.legalName}
                    </p>
                    <p className="mt-0.5 text-hb-xs text-[#64748B]">
                      SINCE {STORE.since} · 대전 직영 중고 가전·업소용 주방기기 전문
                    </p>
                  </div>
                  <h3 className="shrink-0 whitespace-nowrap text-hb-2xl font-extrabold tracking-[0.28em] text-[#141A23] sm:text-right">
                    견적서
                  </h3>
                </div>

                {/* 2. 수신처 / 공급사 2단 정보표 */}
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* 좌측: 수신처 */}
                  <table className="w-full border-collapse border border-[#334155] text-hb-xs sm:text-hb-sm">
                    <tbody>
                      <tr className="border-b border-[#CBD5E1]">
                        <th
                          scope="row"
                          className="w-[100px] bg-[#F8F8F8] px-3 py-2 text-left font-bold text-[#141A23] border-r border-[#CBD5E1]"
                        >
                          수신처
                        </th>
                        <td className="px-3 py-1.5">
                          {isExportingPdf ? (
                            <span className="font-semibold text-[#141A23]">
                              {recipientName.trim() || "귀하"}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={recipientName}
                              onChange={(e) => setRecipientName(e.target.value)}
                              placeholder="회사명 또는 성함을 입력해 주세요"
                              aria-label="수신처"
                              className="w-full bg-transparent py-0.5 text-hb-xs sm:text-hb-sm text-[#141A23] placeholder:text-[#94A3B8] focus:outline-none print:placeholder:text-transparent"
                            />
                          )}
                        </td>
                      </tr>
                      <tr className="border-b border-[#CBD5E1]">
                        <th
                          scope="row"
                          className="bg-[#F8F8F8] px-3 py-2 text-left font-bold text-[#141A23] border-r border-[#CBD5E1]"
                        >
                          담당자
                        </th>
                        <td className="px-3 py-1.5">
                          {isExportingPdf ? (
                            <span className="text-[#141A23]">
                              {contactName.trim() || "-"}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              placeholder="담당자명 / 연락처 입력"
                              aria-label="담당자"
                              className="w-full bg-transparent py-0.5 text-hb-xs sm:text-hb-sm text-[#141A23] placeholder:text-[#94A3B8] focus:outline-none print:placeholder:text-transparent"
                            />
                          )}
                        </td>
                      </tr>
                      <tr className="border-b border-[#CBD5E1]">
                        <th
                          scope="row"
                          className="bg-[#F8F8F8] px-3 py-2 text-left font-bold text-[#141A23] border-r border-[#CBD5E1]"
                        >
                          견적일
                        </th>
                        <td className="px-3 py-2 font-mono tabular-nums text-[#141A23]">
                          {quoteDate}
                        </td>
                      </tr>
                      <tr className="border-b border-[#CBD5E1]">
                        <th
                          scope="row"
                          className="bg-[#F8F8F8] px-3 py-2 text-left font-bold text-[#141A23] border-r border-[#CBD5E1]"
                        >
                          유효기간
                        </th>
                        <td className="px-3 py-2 text-[#141A23]">
                          견적일로부터 7일
                        </td>
                      </tr>
                      <tr>
                        <th
                          scope="row"
                          className="bg-[#F8F8F8] px-3 py-2 text-left font-bold text-[#141A23] border-r border-[#CBD5E1]"
                        >
                          배송·설치
                        </th>
                        <td className="px-3 py-1.5">
                          {isExportingPdf ? (
                            <span className="text-[#141A23]">
                              {deliveryNote.trim() || "직영 배송·설치 협의"}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={deliveryNote}
                              onChange={(e) => setDeliveryNote(e.target.value)}
                              aria-label="배송 및 설치 조건"
                              className="w-full bg-transparent py-0.5 text-hb-xs sm:text-hb-sm text-[#141A23] focus:outline-none"
                            />
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 우측: 공급사 (STORE SSOT) */}
                  <table className="w-full border-collapse border border-[#334155] text-hb-xs sm:text-hb-sm">
                    <tbody>
                      <tr className="border-b border-[#CBD5E1]">
                        <th
                          scope="row"
                          className="w-[100px] bg-[#F8F8F8] px-3 py-2 text-left font-bold text-[#141A23] border-r border-[#CBD5E1]"
                        >
                          공급사 명
                        </th>
                        <td className="px-3 py-2 font-bold text-[#141A23]">
                          {STORE.legalName}
                        </td>
                      </tr>
                      <tr className="border-b border-[#CBD5E1]">
                        <th
                          scope="row"
                          className="bg-[#F8F8F8] px-3 py-2 text-left font-bold text-[#141A23] border-r border-[#CBD5E1]"
                        >
                          사업자번호
                        </th>
                        <td className="px-3 py-2 font-mono tabular-nums text-[#141A23]">
                          {STORE.bizNo}
                        </td>
                      </tr>
                      <tr className="border-b border-[#CBD5E1]">
                        <th
                          scope="row"
                          className="bg-[#F8F8F8] px-3 py-2 text-left font-bold text-[#141A23] border-r border-[#CBD5E1]"
                        >
                          사업장 주소
                        </th>
                        <td className="px-3 py-2 text-[#141A23] break-keep">
                          {STORE.roadAddress}
                        </td>
                      </tr>
                      <tr className="border-b border-[#CBD5E1]">
                        <th
                          scope="row"
                          className="bg-[#F8F8F8] px-3 py-2 text-left font-bold text-[#141A23] border-r border-[#CBD5E1]"
                        >
                          대표자 명
                        </th>
                        <td className="px-3 py-2 text-[#141A23]">{STORE.ceo}</td>
                      </tr>
                      <tr>
                        <th
                          scope="row"
                          className="bg-[#F8F8F8] px-3 py-2 text-left font-bold text-[#141A23] border-r border-[#CBD5E1]"
                        >
                          직영 문의
                        </th>
                        <td className="px-3 py-2 font-mono tabular-nums text-[#141A23]">
                          {STORE.tel} / {STORE.mobile}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. 견적명 & 총 견적수량 (금액 계산 없음) */}
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-stretch border border-[#334155] text-hb-xs sm:text-hb-sm">
                    <div className="flex w-[100px] shrink-0 items-center bg-[#F8F8F8] px-3 py-2.5 font-bold text-[#141A23] border-r border-[#CBD5E1]">
                      견적명
                    </div>
                    <div className="flex flex-1 items-center px-3 py-2">
                      {isExportingPdf ? (
                        <span className="font-semibold text-[#141A23] break-keep">
                          {effectiveQuoteName}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={customQuoteName}
                          onChange={(e) => setCustomQuoteName(e.target.value)}
                          placeholder={summary.defaultQuoteName}
                          aria-label="견적명"
                          className="w-full bg-transparent text-hb-xs sm:text-hb-sm font-semibold text-[#141A23] placeholder:text-[#475569] focus:outline-none"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-stretch border border-[#334155] text-hb-xs sm:text-hb-sm">
                    <div className="flex w-[100px] shrink-0 items-center bg-[#F8F8F8] px-3 py-2.5 font-bold text-[#141A23] border-r border-[#CBD5E1]">
                      견적수량
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 px-3 py-2">
                      <span className="font-bold text-[#141A23] tabular-nums">
                        총 {summary.totalKindCount}종 · {summary.totalUnits}대
                      </span>
                      <span className="text-hb-xs font-semibold text-[#C84312]">
                        금액 별도 안내
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. 견적 품목 상세 테이블 (금액 컬럼 없음) */}
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[540px] border-collapse border border-[#334155] text-hb-xs sm:text-hb-sm">
                    <thead>
                      <tr className="bg-[#F8F8F8] border-b border-[#334155] text-[#141A23]">
                        <th className="w-12 px-2 py-2.5 text-center font-bold border-r border-[#CBD5E1]">
                          NO.
                        </th>
                        <th className="w-[126px] px-3 py-2.5 text-left font-bold border-r border-[#CBD5E1] whitespace-nowrap">
                          품목
                        </th>
                        <th className="px-3 py-2.5 text-left font-bold border-r border-[#CBD5E1]">
                          상품명
                        </th>
                        <th className="w-20 px-2.5 py-2.5 text-center font-bold border-r border-[#CBD5E1] whitespace-nowrap">
                          수량(EA)
                        </th>
                        <th className="w-[148px] px-3 py-2.5 text-left font-bold whitespace-nowrap">
                          비고
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.lineItems.map((line) => (
                        <tr
                          key={line.id}
                          className="border-b border-[#CBD5E1] align-middle"
                        >
                          <td className="px-2 py-2.5 text-center font-mono tabular-nums text-[#526071] border-r border-[#CBD5E1]">
                            {line.no}
                          </td>
                          <td className="px-3 py-2.5 text-[#334155] border-r border-[#CBD5E1] whitespace-nowrap">
                            {line.category}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-[#141A23] border-r border-[#CBD5E1] break-keep">
                            {line.title}
                          </td>
                          <td className="px-2.5 py-2.5 text-center font-mono font-bold tabular-nums text-[#141A23] border-r border-[#CBD5E1]">
                            {line.quantity}
                          </td>
                          <td className="px-3 py-2.5 text-hb-xs text-[#526071] break-keep">
                            {line.remark}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#F8F8F8] font-bold text-[#141A23]">
                        <td
                          colSpan={3}
                          className="px-3 py-2.5 text-right border-r border-[#CBD5E1]"
                        >
                          합계 수량
                        </td>
                        <td className="px-2.5 py-2.5 text-center font-mono text-[#C84312] tabular-nums border-r border-[#CBD5E1]">
                          {summary.totalUnits}대
                        </td>
                        <td className="px-3 py-2.5 text-hb-xs font-medium text-[#526071]">
                          총 {summary.totalKindCount}종 · 실물 확인 후 안내
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 5. 하단 안내 */}
                <div className="mt-5 border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-hb-xs leading-relaxed text-[#475569]">
                  <p className="font-bold text-[#141A23]">
                    견적 유의사항 및 보증 안내
                  </p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4">
                    <li>
                      본 문서는 온라인 견적 요청용이며, 실물 상태·매장 재고 및
                      설치 환경 확인 후 최종 금액과 일정을 안내해 드립니다.
                    </li>
                    <li>
                      배송·설치비(배관·사다리차·고층 운반 등) 및 세금계산서 발행
                      조건은 상담 시 안내해 드립니다.
                    </li>
                    <li>
                      보증 기준: {STORE_MERCHANT_POLICY.warrantyAircon} /{" "}
                      {STORE_MERCHANT_POLICY.warrantyMajor}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 바: PDF 다운로드 · 인쇄 · 카톡 발송 · 문자 발송 (이메일 제외) */}
        <div className="print:hidden border-t border-[#E5E5E5] bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              disabled={items.length === 0 || isExportingPdf}
              onClick={() => void handleDownloadPdf()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#141A23] px-6 text-hb-sm font-bold text-white hover:bg-[#273142] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-45"
            >
              <Icon d={ICON.download} className="w-4 h-4 shrink-0" />
              <span>{isExportingPdf ? "PDF 생성 중..." : "PDF 다운로드"}</span>
            </button>

            <button
              type="button"
              disabled={items.length === 0}
              onClick={handlePrint}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#737373] px-6 text-hb-sm font-bold text-white hover:bg-[#525252] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-45"
            >
              <Icon d={ICON.printer} className="w-4 h-4 shrink-0" />
              <span>인쇄</span>
            </button>

            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleKakaoShareClick}
              aria-disabled={items.length === 0}
              className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-[#D4D4D4] bg-white px-5 text-hb-sm font-bold text-[#141A23] hover:border-[#141A23] transition-colors whitespace-nowrap ${
                items.length === 0 ? "pointer-events-none opacity-45" : ""
              }`}
            >
              <Icon d={ICON.chat} className="w-4 h-4 shrink-0 text-[#B45309]" />
              <span>카톡 발송</span>
            </a>

            <a
              href={smsLink}
              onClick={handleSmsShareClick}
              aria-disabled={items.length === 0}
              className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-[#D4D4D4] bg-white px-5 text-hb-sm font-bold text-[#141A23] hover:border-[#141A23] transition-colors whitespace-nowrap ${
                items.length === 0 ? "pointer-events-none opacity-45" : ""
              }`}
            >
              <Icon d={ICON.phone} className="w-4 h-4 shrink-0 text-[#C84312]" />
              <span>문자 발송</span>
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}
