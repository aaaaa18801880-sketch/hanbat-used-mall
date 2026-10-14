import { supabase } from "../../lib/supabase";
import {
  STORE,
  telHref,
  splitImages,
  isProductSold,
  getProductStatusLabel,
  normalizeProductCategory,
  formatProductPrice,
} from "../../lib/site";
import { SiteHeader, SiteFooter, MobileCtaBar, SafeImg } from "../../lib/ui";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product || product.category === "배송인증") {
    return (
      <div className="min-h-screen bg-[#F6F5F2] flex flex-col font-sans text-[#1F2530]">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-[#E4E0D8] text-center max-w-md w-full">
            <h1 className="text-lg font-bold text-[#0E1A2B] mb-2">
              상품을 찾을 수 없습니다.
            </h1>
            <p className="text-sm text-[#4B5260] mb-6">
              이미 판매가 완료되어 내려갔거나 삭제된 상품입니다.
            </p>
            <a
              href="/gallery"
              className="inline-block bg-[#0E1A2B] text-white font-semibold px-6 py-3 rounded-md text-sm hover:bg-[#22324A] transition"
            >
              판매 갤러리로 돌아가기
            </a>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const images = splitImages(product.image_url);
  const sold = isProductSold(product.status);
  const statusLabel = getProductStatusLabel(product.status);
  const categoryLabel = normalizeProductCategory(product.category);
  const priceDisplay = sold
    ? "판매완료"
    : formatProductPrice(product.price, categoryLabel);

  return (
    <div className="min-h-screen bg-[#F6F5F2] font-sans text-[#1F2530] flex flex-col">
      <SiteHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <div className="mb-4">
          <a
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4B5260] hover:text-[#0E1A2B]"
          >
            ← 전체 상품 갤러리로 돌아가기
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[#E4E0D8] overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* 좌측: 상품 이미지 (다중 이미지 모두 표시 지원) */}
          <div className="bg-[#FAF9F7] border-b md:border-b-0 md:border-r border-[#E4E0D8] flex flex-col">
            <div className="aspect-square relative overflow-hidden flex items-center justify-center p-4">
              {images.length > 0 ? (
                <SafeImg
                  src={images[0]}
                  alt={product.title}
                  eager
                  className={`object-contain max-w-full max-h-full ${
                    sold ? "grayscale opacity-75" : ""
                  }`}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-[#8A8478] text-sm">
                  등록된 사진이 없습니다
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center gap-1.5">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-sm shadow-xs ${
                    sold ? "bg-[#8A8478] text-white" : "bg-[#0E1A2B] text-white"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 p-3 border-t border-[#E4E0D8] bg-white">
                {images.map((imgUrl, idx) => (
                  <a
                    key={imgUrl + idx}
                    href={imgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded overflow-hidden border border-[#E4E0D8] bg-[#FAF9F7]"
                    title={`${idx + 1}번 사진 원본 보기`}
                  >
                    <SafeImg
                      src={imgUrl}
                      alt={`${product.title} 사진 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* 우측: 상품 정보 및 구매 문의 */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs bg-[#F6F5F2] border border-[#E4E0D8] text-[#4B5260] px-2.5 py-1 rounded-sm font-bold">
                  {categoryLabel}
                </span>
                {product.condition_grade && (
                  <span className="text-xs bg-[#FFF5F0] border border-[#FADCD0] text-[#D9531E] px-2.5 py-1 rounded-sm font-bold">
                    {product.condition_grade}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-[#0E1A2B] mb-4 leading-snug">
                {product.title}
              </h1>

              <div className="bg-[#FAF9F7] p-4 rounded-md border border-[#E4E0D8] mb-6">
                <span className="text-[11px] font-semibold text-[#8A8478] block mb-1">
                  판매 가격
                </span>
                <span
                  className={`text-2xl sm:text-3xl font-bold ${
                    sold ? "text-[#8A8478]" : "text-[#D9531E]"
                  }`}
                >
                  {priceDisplay}
                </span>
              </div>

              <div className="mb-6">
                <h2 className="text-xs font-bold text-[#8A8478] uppercase tracking-wider mb-2">
                  제품 규격 및 상세 설명
                </h2>
                <p className="text-sm text-[#1F2530] leading-relaxed whitespace-pre-line bg-[#FAF9F7] p-4 rounded-md border border-[#E4E0D8]">
                  {product.description ||
                    "등록된 상세 설명이 없습니다. 전화나 카카오톡으로 문의해 주시면 친절히 안내해 드립니다."}
                </p>
              </div>

              <div className="border-t border-[#E4E0D8] pt-4 text-xs text-[#4B5260] space-y-1.5">
                <p>📍 매장 위치: {STORE.address} ({STORE.addressNote})</p>
                <p>📞 대표 전화: {STORE.tel}</p>
                <p>🕒 영업 시간: {STORE.hours} ({STORE.closed})</p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E4E0D8] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={telHref(STORE.tel)}
                className="bg-[#0E1A2B] hover:bg-[#22324A] text-white text-center font-bold py-3.5 rounded-md transition text-sm flex items-center justify-center gap-2"
              >
                <span>📞 전화 문의 ({STORE.tel})</span>
              </a>
              <a
                href={STORE.kakaoChat}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FEE500] hover:bg-[#F2D900] text-[#191600] text-center font-bold py-3.5 rounded-md transition text-sm flex items-center justify-center gap-2"
              >
                <span>💬 카카오톡 상담</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}