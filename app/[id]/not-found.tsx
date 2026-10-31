// 파일 경로: app/[id]/not-found.tsx
import Link from "next/link";
import { STORE, telHref } from "../../lib/site";
import { SiteHeader, SiteFooter, MobileCtaBar } from "../../lib/ui";

export default function ProductNotFound() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col font-sans text-[#0E1A2B]">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center p-5">
        <div className="bg-white p-8 sm:p-10 rounded-xl shadow-card border border-[#E5E2DC] text-center max-w-md w-full">
          <p className="hb-eyebrow justify-center">Inventory Notice</p>
          <h1 className="mt-2 text-hb-xl font-bold text-[#0E1A2B]">
            찾으시는 상품 정보가 없습니다.
          </h1>
          <p className="mt-2.5 text-hb-sm leading-relaxed text-[#3E4756]">
            이미 판매가 완료되어 목록에서 내려갔거나 주소가 변경된 상품입니다. 판매 갤러리에서 현재 구매 가능한 다른 매물을 확인해 보세요.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link href="/gallery" className="hb-btn-primary h-11 px-6 text-hb-sm">
              판매 제품 갤러리로 이동
            </Link>
            <a href={telHref(STORE.tel)} className="hb-btn-outline h-11 px-5 text-hb-sm">
              전화로 유사 매물 문의
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
