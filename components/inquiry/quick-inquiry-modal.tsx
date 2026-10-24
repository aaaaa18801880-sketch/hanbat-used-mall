// 파일 경로: components/inquiry/quick-inquiry-modal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal, Icon, ICON } from "../../lib/ui";
import {
  type LinkedProductContext,
} from "./unified-inquiry-form";
import { V2InquirySectionWithWizard } from "./v2-wizard-quick-inquiry";
import {
  STORE,
  QUICK_INQUIRY_EVENT,
  type QuickInquiryDetail,
  type InquiryTypeValue,
} from "../../lib/site";

export function QuickInquiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [inquiryType, setInquiryType] = useState<InquiryTypeValue>("구매 문의");
  const [linkedProduct, setLinkedProduct] = useState<LinkedProductContext | null>(null);

  const handleOpen = useCallback((e: Event) => {
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
    setIsOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener(QUICK_INQUIRY_EVENT, handleOpen);
    return () => {
      window.removeEventListener(QUICK_INQUIRY_EVENT, handleOpen);
    };
  }, [handleOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={() => setIsOpen(false)}
      label="견적 문의"
      panelClassName="max-w-2xl w-full"
    >
      <div className="relative rounded-2xl bg-white border border-[#E5E2DC] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 모달 상단 헤더 */}
        <div className="bg-[#0E1A2B] text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded bg-[#D9531E] px-2 py-0.5 text-hb-xs font-bold text-white tracking-wide">
                직영 매장 직통
              </span>
              <span className="text-hb-xs font-medium text-white/70">
                대표전화 {STORE.tel} · {STORE.hours}
              </span>
            </div>
            <h2 className="text-hb-lg font-bold text-white tracking-tight">
              견적 문의
            </h2>
            <p className="mt-0.5 text-hb-xs text-white/75">
              처분/구매 품목과 연락처를 남겨주시면 담당 엔지니어가 확인 후 안내해 드립니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="닫기"
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors shrink-0"
          >
            <Icon d={ICON.close} className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 (스크롤 영역) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#FAF9F7]">
          <V2InquirySectionWithWizard
            key={`${inquiryType}_${linkedProduct?.productTitle || ""}`}
            defaultType={inquiryType}
            linkedProduct={linkedProduct}
            onSuccess={() => {
              setTimeout(() => {
                setIsOpen(false);
              }, 2000);
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
