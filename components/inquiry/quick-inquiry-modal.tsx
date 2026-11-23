// 파일 경로: components/inquiry/quick-inquiry-modal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Modal, Icon, ICON } from "../../lib/ui";
import {
  type LinkedProductContext,
} from "./unified-inquiry-form";
import {
  STORE,
  QUICK_INQUIRY_EVENT,
  type QuickInquiryDetail,
  type InquiryTypeValue,
} from "../../lib/site";

const V2InquirySectionWithWizard = dynamic(
  () =>
    import("./v2-wizard-quick-inquiry").then(
      (m) => m.V2InquirySectionWithWizard
    ),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 text-center text-hb-sm text-[#64748B]">
        문의 양식을 불러오는 중입니다...
      </div>
    ),
  }
);

export function QuickInquiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [openSession, setOpenSession] = useState(0);
  const [inquiryType, setInquiryType] = useState<InquiryTypeValue>("구매 문의");
  const [linkedProduct, setLinkedProduct] = useState<LinkedProductContext | null>(null);
  const [submittedDone, setSubmittedDone] = useState(false);

  const closeModal = useCallback(() => {
    setSubmittedDone(false);
    setIsOpen(false);
  }, []);

  const handleOpen = useCallback((e: Event) => {
    setSubmittedDone(false);
    const customEvent = e as CustomEvent<QuickInquiryDetail | undefined>;
    const detail = customEvent.detail;
    if (detail?.type) {
      setInquiryType(detail.type);
    } else {
      setInquiryType("구매 문의");
    }
    if (detail) {
      setLinkedProduct({
        productTitle: detail.productTitle,
        modelName: detail.modelName,
        category: detail.category,
        envNote: detail.envNote,
        useBundle: detail.useBundle,
      });
    } else {
      setLinkedProduct(null);
    }
    setOpenSession((prev) => prev + 1);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener(QUICK_INQUIRY_EVENT, handleOpen);
    return () => {
      window.removeEventListener(QUICK_INQUIRY_EVENT, handleOpen);
    };
  }, [handleOpen]);

  return (
    <Modal
      open={isOpen}
      onClose={closeModal}
      label="견적 문의"
      panelClassName="max-w-2xl w-full"
      closeOnOverlayClick={false}
    >
      <div className="relative rounded-2xl bg-white border border-[#E2DDD3] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 모달 상단 헤더 */}
        <div className="bg-[#141A23] text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded bg-[#C84312] px-2 py-0.5 text-hb-xs font-bold text-white tracking-wide">
                직영 매장 직통
              </span>
              <span className="text-hb-xs font-medium text-white/75">
                대표전화 {STORE.tel} · {STORE.hours}
              </span>
            </div>
            <h2 className="text-hb-lg font-bold text-white tracking-tight">
              견적 문의
            </h2>
            <p className="mt-0.5 text-hb-xs text-white/80">
              처분/구매 품목과 연락처를 남겨주시면 매장 담당자가 확인 후 안내해 드립니다.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="닫기"
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white active:scale-[0.96] transition-[background-color,color,transform] duration-150 shrink-0 cursor-pointer"
          >
            <Icon d={ICON.close} className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 (스크롤 영역) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#FAF9F6]">
          <V2InquirySectionWithWizard
            key={`${openSession}_${inquiryType}_${linkedProduct?.useBundle ? "bundle" : "single"}_${linkedProduct?.productTitle || ""}`}
            defaultType={inquiryType}
            linkedProduct={linkedProduct}
            onSuccess={() => {
              setSubmittedDone(true);
            }}
          />
          {submittedDone && (
            <div className="mt-4 flex justify-end border-t border-[#E2DDD3] pt-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg bg-[#141A23] px-4 py-2 text-hb-sm font-bold text-white hover:bg-[#2A3342] transition-colors"
              >
                확인 · 창 닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
