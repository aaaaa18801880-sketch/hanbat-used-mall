import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import {
  STORE,
  telHref,
  splitImages,
  isProductSold,
  getProductStatusLabel,
  normalizeProductCategory,
  formatProductPrice,
  hasProductPrice,
  extractModelName,
  parseProductDescription,
} from "../../lib/site";
import {
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
  Icon,
  ICON,
} from "../../lib/ui";
import {
  ProductDetailGallery,
  CopyProductLinkButton,
} from "../../components/products/product-detail-gallery";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const { data: product } = await supabase
    .from("products")
    .select("id, title, category, description, image_url, price, status")
    .eq("id", id)
    .single();

  if (!product || product.category === "배송인증") {
    return {
      title: `상품을 찾을 수 없습니다 | ${STORE.name}`,
      robots: { index: false, follow: false },
    };
  }

  const categoryLabel = normalizeProductCategory(product.category);
  const statusLabel = getProductStatusLabel(product.status);
  const modelName = extractModelName(product.description, product.title);
  const images = splitImages(product.image_url);
  const canonicalUrl = `${STORE.url}/${product.id}`;

  const cleanDesc = (product.description ?? "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/[•\-*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

  const metaDescription =
    cleanDesc ||
    `${STORE.name} ${categoryLabel} - ${product.title}${
      modelName ? ` (${modelName})` : ""
    }. 대전 중촌동 오프라인 매장 실물 확인 및 배송·설치 상담 가능.`;

  return {
    title: `${product.title} (${statusLabel}) | ${STORE.name}`,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: canonicalUrl,
      siteName: STORE.name,
      title: `${product.title} | ${STORE.name}`,
      description: metaDescription,
      images:
        images.length > 0
          ? [{ url: images[0], alt: product.title }]
          : [{ url: "/og-image.jpg", alt: STORE.name }],
    },
  };
}

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
        <main className="flex-1 flex items-center justify-center p-5">
          <div className="bg-white p-8 sm:p-10 rounded-md shadow-xs border border-[#E4E0D8] text-center max-w-md w-full">
            <h1 className="text-[20px] font-bold text-[#0E1A2B]">
              찾으시는 상품 정보가 없습니다.
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[#4B5260]">
              이미 판매가 완료되어 목록에서 내려갔거나 주소가 변경된 상품입니다. 판매 갤러리에서 현재 구매 가능한 다른 매물을 확인해 보세요.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link
                href="/gallery"
                className="hb-btn-primary h-11 px-6 text-[14px]"
              >
                판매 제품 갤러리로 이동
              </Link>
              <a
                href={telHref(STORE.tel)}
                className="hb-btn-outline h-11 px-5 text-[14px]"
              >
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

  const images = splitImages(product.image_url);
  const sold = isProductSold(product.status);
  const statusLabel = getProductStatusLabel(product.status);
  const categoryLabel = normalizeProductCategory(product.category);
  const priced = hasProductPrice(product.price);
  const priceDisplay = sold
    ? "판매완료"
    : formatProductPrice(product.price, categoryLabel);

  const modelName = extractModelName(product.description, product.title);
  const parsedDesc = parseProductDescription(product.description);
  const createdDate = product.created_at
    ? new Date(product.created_at).toLocaleDateString("ko-KR")
    : null;

  const inquiryHref = `/inquiry?write=1&type=${encodeURIComponent(
    "구매 문의"
  )}&title=${encodeURIComponent(`[상품문의] ${product.title}`)}`;

  // 구조화 데이터 (Product Schema - 확인된 사실만 포함)
  const productJsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    category: categoryLabel,
    description:
      product.description || `${STORE.name} ${categoryLabel} ${product.title}`,
    image: images.length > 0 ? images : [`${STORE.url}/og-image.jpg`],
    itemCondition: "https://schema.org/UsedCondition",
    brand: {
      "@type": "Organization",
      name: STORE.name,
    },
    offers: {
      "@type": "Offer",
      url: `${STORE.url}/${product.id}`,
      priceCurrency: "KRW",
      ...(priced ? { price: Number(product.price) } : {}),
      availability: sold
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": "Organization",
        name: STORE.name,
        telephone: STORE.tel,
      },
    },
  };

  if (modelName) {
    productJsonLd.model = modelName;
  }

  return (
    <div className="min-h-screen bg-[#F6F5F2] font-sans text-[#1F2530] flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <SiteHeader />

      <main className="hb-container py-8 sm:py-12 flex-1">
        {/* 9. 갤러리 복귀 경로 (브레드크럼 & 카테고리 바로가기) */}
        <nav
          aria-label="경로 이동"
          className="mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-[#4B5260]">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1.5 text-[#0E1A2B] hover:text-[#D9531E] transition-colors"
            >
              <Icon d={ICON.left} className="h-4 w-4" />
              <span>전체 제품 갤러리</span>
            </Link>
            <span className="text-[#CFCAC0]">/</span>
            <Link
              href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
              className="hover:text-[#0E1A2B] underline underline-offset-4"
            >
              {categoryLabel} 목록
            </Link>
          </div>

          <CopyProductLinkButton productTitle={product.title} />
        </nav>

        {/* 상단 메인 상품 카드 (좌측 갤러리 + 우측 핵심 구매 정보) */}
        <div className="overflow-hidden rounded-md border border-[#E4E0D8] bg-white shadow-xs grid grid-cols-1 lg:grid-cols-12">
          {/* 1. 상품 이미지 갤러리 (좌측 7컬럼) */}
          <div className="border-b lg:border-b-0 lg:border-r border-[#E4E0D8] lg:col-span-7">
            <ProductDetailGallery
              title={product.title}
              images={images}
              status={product.status}
              createdAt={product.created_at}
            />
          </div>

          {/* 2~8. 상품 핵심 정보 및 상담 동선 (우측 5컬럼) */}
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5">
            <div>
              {/* 2. 카테고리 및 상태 등급 배지 */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
                  className="rounded-sm border border-[#E4E0D8] bg-[#F6F5F2] px-2.5 py-1 text-[12px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B]"
                >
                  {categoryLabel}
                </Link>
                {product.condition_grade && (
                  <span className="rounded-sm border border-[#FADCD0] bg-[#FFF5F0] px-2.5 py-1 text-[12px] font-bold text-[#D9531E]">
                    상태: {product.condition_grade}
                  </span>
                )}
                {createdDate && (
                  <span className="ml-auto text-[12px] text-[#8A8478]">
                    등록일 {createdDate}
                  </span>
                )}
              </div>

              {/* 2. 상품명 */}
              <h1 className="mt-3.5 text-[22px] sm:text-[26px] font-bold leading-[1.3] tracking-[-0.02em] text-[#0E1A2B] break-keep">
                {product.title}
              </h1>

              {/* 3. 모델명 (확인된 경우에만 표시) */}
              <dl className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-[#EEEBE5] bg-[#FAF9F7] p-3.5 text-[13px]">
                <div>
                  <dt className="text-[#8A8478] font-medium">모델명</dt>
                  <dd className="mt-0.5 font-mono font-bold text-[#0E1A2B] break-all">
                    {modelName || "매장 문의 (상세 사진 참조)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#8A8478] font-medium">현재 판매 상태</dt>
                  <dd
                    className={`mt-0.5 font-bold ${
                      sold ? "text-[#6B7280]" : "text-[#0E1A2B]"
                    }`}
                  >
                    {statusLabel}
                  </dd>
                </div>
              </dl>

              {/* 4. 가격과 판매 상태 */}
              <div className="mt-4 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    판매 가격
                  </span>
                  {typeof product.views === "number" && (
                    <span className="text-[12px] text-[#8A8478]">
                      조회수 {product.views}회
                    </span>
                  )}
                </div>

                {sold ? (
                  <p className="mt-1 text-[26px] font-bold text-[#8A8478]">
                    판매완료
                  </p>
                ) : priced ? (
                  <p className="mt-1 text-[28px] sm:text-[32px] font-bold tracking-tight text-[#D9531E]">
                    {priceDisplay}
                  </p>
                ) : (
                  <div className="mt-1.5">
                    <p className="text-[22px] sm:text-[24px] font-bold text-[#D9531E]">
                      {priceDisplay}
                    </p>
                    <p className="mt-1 text-[12.5px] text-[#4B5260]">
                      설치 환경·배관 거리·수량에 따라 최적 견적을 안내해 드립니다.
                    </p>
                  </div>
                )}
              </div>

              {/* 5 & 6. 제품 사양 및 확인된 특이사항 */}
              <div className="mt-6 space-y-4">
                {parsedDesc.hasStructuredSections ? (
                  <>
                    {parsedDesc.specs.length > 0 && (
                      <div className="rounded-md border border-[#E4E0D8] bg-white p-4">
                        <h2 className="text-[13px] font-bold text-[#0E1A2B] mb-2.5">
                          주요 사양
                        </h2>
                        <dl className="divide-y divide-[#F0EDE7] text-[13.5px]">
                          {parsedDesc.specs.map((s, i) => (
                            <div
                              key={s.label + i}
                              className="py-1.5 flex justify-between gap-4"
                            >
                              <dt className="font-semibold text-[#6B7280] shrink-0">
                                {s.label}
                              </dt>
                              <dd className="font-medium text-[#1F2530] text-right">
                                {s.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}

                    {parsedDesc.features.length > 0 && (
                      <div className="rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-4">
                        <h2 className="text-[13px] font-bold text-[#0E1A2B] mb-2">
                          제품 특징 및 상태
                        </h2>
                        <ul className="space-y-1.5 text-[13.5px] leading-relaxed text-[#4B5260]">
                          {parsedDesc.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#D9531E] font-bold">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parsedDesc.checkPoints.length > 0 && (
                      <div className="rounded-md border border-[#FADCD0] bg-[#FFF5F0] p-3.5 text-[13px] text-[#B5431A]">
                        <strong className="block font-bold mb-1">
                          설치 및 구매 전 확인사항
                        </strong>
                        {parsedDesc.checkPoints.map((c, i) => (
                          <p key={i}>• {c}</p>
                        ))}
                      </div>
                    )}

                    {parsedDesc.rawRest.length > 0 && (
                      <div className="rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-4 text-[13.5px] leading-relaxed text-[#1F2530] whitespace-pre-line">
                        {parsedDesc.rawRest.join("\n")}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-4">
                    <h2 className="text-[13px] font-bold text-[#0E1A2B] mb-2">
                      제품 사양 및 상세 설명
                    </h2>
                    <p className="text-[14px] leading-[1.75] text-[#1F2530] whitespace-pre-line break-words">
                      {product.description ||
                        "상세 사양은 전화 또는 카카오톡으로 문의해 주시면 실물 확인 후 정확히 안내해 드립니다."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 8. 전화 · 카카오톡 · 온라인 문의 상담 동선 */}
            <div className="mt-8 pt-5 border-t border-[#E4E0D8] space-y-2.5">
              {sold && (
                <p className="text-[13px] font-semibold text-[#D9531E] text-center pb-1">
                  본 상품은 판매가 완료되었습니다. 동일·유사 모델 재고는 문의해 주세요.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={telHref(STORE.tel)}
                  className="hb-btn-primary h-12 text-[14.5px]"
                >
                  <Icon d={ICON.phone} className="h-4 w-4 text-[#D9531E]" />
                  <span>전화 상담 ({STORE.tel})</span>
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-12 text-[14.5px]"
                >
                  <Icon d={ICON.chat} className="h-4 w-4" />
                  <span>카카오톡 문의</span>
                </a>
              </div>
              <Link
                href={inquiryHref}
                className="hb-btn-outline h-11 w-full text-[13.5px]"
              >
                <Icon d={ICON.pen} className="h-4 w-4 text-[#D9531E]" />
                <span>이 상품 온라인 문의글 남기기</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 7. 배송·설치 및 오프라인 매장 거래 안내 (확인된 사실만 기재) */}
        <section
          aria-label="거래 및 배송·설치 안내"
          className="mt-8 grid gap-4 sm:grid-cols-3"
        >
          <div className="rounded-md border border-[#E4E0D8] bg-white p-5">
            <h2 className="text-[14px] font-bold text-[#0E1A2B]">
              오프라인 매장 실물 확인
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#4B5260]">
              {STORE.address} ({STORE.addressNote}) 매장에 방문하시면 제품을 직접 보고 결정하실 수 있습니다. ({STORE.hours}, {STORE.closed})
            </p>
          </div>
          <div className="rounded-md border border-[#E4E0D8] bg-white p-5">
            <h2 className="text-[14px] font-bold text-[#0E1A2B]">
              배송 · 설치 안내
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#4B5260]">
              대전·세종·충청권 및 타 지역 배송·설치 여부는 품목과 설치 환경(층수, 배관, 전원 규격 등)에 따라 사전 상담 후 조율합니다.
            </p>
          </div>
          <div className="rounded-md border border-[#E4E0D8] bg-white p-5">
            <h2 className="text-[14px] font-bold text-[#0E1A2B]">
              검수 및 증빙 안내
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#4B5260]">
              입고 후 작동 점검과 세척을 거친 제품이며, 사업자 고객님을 위한 세금계산서 발행이 가능합니다. A/S 조건은 품목 및 계약 조건에 따라 안내해 드립니다.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
