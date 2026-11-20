"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Icon, ICON } from "../../lib/icons";
import { STORE, trackEvent } from "../../lib/site";

export function GuideShareButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const shareUrl = `${STORE.url}/guide/${slug}`;
    const textToCopy = `${title} — ${STORE.name}\n${shareUrl}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const ta = document.createElement("textarea");
        ta.value = textToCopy;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success("가이드 제목과 링크가 복사되었습니다. 카톡·블로그·당근에 바로 붙여넣기 하세요.");
      trackEvent("click_guide_tool_action", { action: "share_guide_link", slug });
    } catch {
      toast.error("링크 복사에 실패했습니다. 주소창 링크를 복사해 주세요.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      onMouseLeave={() => {
        if (copied) setCopied(false);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2DDD3] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] transition-colors cursor-pointer"
      aria-label="이 가이드 링크 복사하기"
    >
      <Icon
        d={copied ? ICON.check : ICON.copy}
        className={`w-3.5 h-3.5 ${copied ? "text-[#0F766E]" : "text-[#E8521A]"}`}
      />
      <span>{copied ? "링크 복사됨" : "링크 공유"}</span>
    </button>
  );
}
