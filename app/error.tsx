// 파일 경로: app/error.tsx
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { STORE, telHref } from "../lib/site";
import { SiteHeader, SiteFooter, MobileCtaBar } from "../lib/ui";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("클라이언트 런타임 오류 감지:", error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF9F7] font-sans text-[#0E1A2B] flex flex-col">
      <SiteHeader />

      <main className="hb-container py-16 sm:py-24 flex-1 flex items-center justify-center">
        <div className="max-w-md w-full rounded-xl border border-[#E5E2DC] bg-white p-8 sm:p-10 text-center shadow-card">
          <p className="hb-eyebrow justify-center">Temporary Issue</p>
          <h1 className="mt-2 text-hb-xl font-bold text-[#0E1A2B]">
            화면을 불러오는 중 일시적인 문제가 발생했습니다.
          </h1>
          <p className="mt-2.5 text-hb-sm leading-relaxed text-[#3E4756]">
            네트워크 연결이 불안정하거나 일시적인 오류입니다. 아래 버튼을 눌러 다시 시도해 주세요.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={() => reset()}
              className="hb-btn-primary h-11 px-6 text-hb-sm"
            >
              다시 시도하기
            </button>
            <Link href="/" className="hb-btn-outline h-11 px-5 text-hb-sm">
              홈으로 이동
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E5E2DC] text-hb-xs text-[#646E7E] tabular-nums">
            전화 상담 연결:{" "}
            <a
              href={telHref(STORE.tel)}
              className="font-bold text-[#D9531E] underline underline-offset-4"
            >
              {STORE.tel}
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
