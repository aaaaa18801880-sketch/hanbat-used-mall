// 파일 경로: app/not-found.tsx
import Link from "next/link";
import { STORE, telHref } from "../lib/site";
import { SiteHeader, SiteFooter, MobileCtaBar } from "../lib/ui";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] font-sans text-[#0E1A2B] flex flex-col">
      <SiteHeader />

      <main className="hb-container py-16 sm:py-24 flex-1 flex items-center justify-center">
        <div className="max-w-md w-full rounded-xl border border-[#E5E2DC] bg-white p-8 sm:p-10 text-center shadow-card">
          <p className="hb-eyebrow justify-center">404 Not Found</p>
          <h1 className="mt-2 text-hb-xl sm:text-hb-2xl font-bold text-[#0E1A2B]">
            찾으시는 페이지를 찾을 수 없습니다.
          </h1>
          <p className="mt-3 text-hb-sm leading-relaxed text-[#3E4756]">
            입력하신 페이지 주소가 변경되었거나 이미 판매 완료되어 삭제된 상품일 수 있습니다.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/gallery"
              className="hb-btn-primary h-11 px-5 text-hb-sm"
            >
              판매 제품 갤러리 보기
            </Link>
            <Link href="/" className="hb-btn-outline h-11 px-5 text-hb-sm">
              메인 홈으로 이동
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-[#E5E2DC] text-hb-xs text-[#646E7E] tabular-nums">
            빠른 재고 문의:{" "}
            <a
              href={telHref(STORE.tel)}
              className="font-bold text-[#0E1A2B] underline underline-offset-4 hover:text-[#B5431A]"
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
