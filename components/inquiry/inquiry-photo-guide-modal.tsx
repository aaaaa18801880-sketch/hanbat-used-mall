// 파일 경로: components/inquiry/inquiry-photo-guide-modal.tsx
"use client";

import React from "react";
import { Icon, ICON, Modal, SafeImg } from "../../lib/ui";

export function InquiryPhotoGuideModal({
  open,
  onClose,
  imageSrc,
  tip,
  title = "권장 촬영 참고 사진 가이드",
}: {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  tip: string;
  title?: string;
}) {
  if (!open) return null;

  return (
    <Modal label={title} onClose={onClose} panelClassName="max-w-3xl w-full">
      <div className="overflow-hidden rounded-xl border border-[#E2E6EC] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E2E6EC] px-5 py-3.5 bg-[#141A23] text-white">
          <div className="flex items-center gap-2">
            <Icon d={ICON.camera} className="w-4 h-4 text-[#E8521A]" />
            <h3 className="text-hb-sm font-bold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <Icon d={ICON.close} className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto bg-[#F7F8FA] p-4 flex flex-col items-center gap-3">
          <SafeImg
            src={imageSrc}
            alt={`${title} 원본`}
            className="max-h-[65vh] w-auto object-contain rounded-lg border border-[#E2E6EC] bg-white shadow-xs"
          />
          <p className="text-hb-xs text-[#64748B] text-center max-w-lg leading-relaxed">
            {tip}
          </p>
        </div>
      </div>
    </Modal>
  );
}
