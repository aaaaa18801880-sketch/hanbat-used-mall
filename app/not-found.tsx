import Link from "next/link";
import { STORE, telHref } from "../lib/site";
import { SiteHeader, SiteFooter, MobileCtaBar } from "../lib/ui";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F6F5F2] font-sans text-[#1F2530] flex flex-col">
      <SiteHeader />

      <main className="hb-container py-16 sm:py-24 flex-1 flex items-center justify-center">
        <div className="max-w-md w-full rounded-md border border-[#E4E0D8] bg-white p-8 text-center shadow-xs">
          <p className="hb-eyebrow">404 Not Found</p>
          <h1 className="mt-2 text-[22px] sm:text-[26px] font-bold text-[#0E1A2B]">
            찾으시는 페이지를 찾을 수 없습니다.
          </h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-[#4B5260]">
            입력하신 페이지 주소가 변경되었거나 이미 판매 완료되어 삭제된 상품일 수 있습니다.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/gallery"
              className="hb-btn-primary h-11 px-5 text-[14px]"
            >
              판매 제품 갤러리 보기
            </Link>
            <Link href="/" className="hb-btn-outline h-11 px-5 text-[14px]">
              메인 홈으로 이동
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-[#EEEBE5] text-[13px] text-[#6B7280]">
            빠른 재고 문의:{" "}
            <a
              href={telHref(STORE.tel)}
              className="font-bold text-[#0E1A2B] underline"
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
