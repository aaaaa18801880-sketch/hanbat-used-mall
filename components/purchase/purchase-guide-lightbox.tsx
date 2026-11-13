"use client";

import React, { useState } from "react";
import { STORE } from "../../lib/site";
import { Icon, ICON, Modal, SafeImg } from "../../lib/ui";

export function PurchaseGuideLightbox() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-[#E2E6EC] bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-hb-sm font-bold text-[#141A23]">
            {STORE.name} 매입 기준 안내문
          </h3>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="rounded-lg border border-[#CBD2DC] bg-[#F7F8FA] px-2.5 py-1 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] cursor-pointer"
          >
            크게 보기
          </button>
        </div>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          aria-label={`${STORE.name} 매입 기준 안내문 크게 보기`}
          className="group relative block w-full overflow-hidden rounded-xl border border-[#E2E6EC] bg-[#F7F8FA] p-2.5 text-left cursor-pointer"
        >
          <div className="aspect-[4/3] w-full overflow-hidden flex items-center justify-center bg-white rounded-lg">
            <SafeImg
              src="/매입 안내문.png"
              alt={`${STORE.name} 공식 매입 안내문`}
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        </button>
      </div>

      {guideOpen && (
        <Modal
          label={`${STORE.name} 공식 매입 안내문`}
          onClose={() => setGuideOpen(false)}
          panelClassName="max-w-2xl"
        >
          <div className="overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E6EC] px-5 py-3.5 bg-[#141A23] text-white">
              <h3 className="text-hb-base font-bold">
                {STORE.name} 공식 매입 안내문
              </h3>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                aria-label="닫기"
                className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <Icon d={ICON.close} className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[82vh] overflow-y-auto bg-[#F7F8FA] p-4 sm:p-6 flex justify-center">
              <SafeImg
                src="/매입 안내문.png"
                alt={`${STORE.name} 공식 매입 안내문 원본`}
                className="max-h-[74vh] w-auto object-contain rounded-lg border border-[#E2E6EC] bg-white"
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
