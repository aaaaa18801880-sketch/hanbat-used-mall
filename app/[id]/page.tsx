// 파일 경로: app/[id]/page.tsx
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
import {
  ProductCard,
  type ProductItem,
} from "../../components/products/product-card";

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

  const inquiryParams = new URLSearchParams({
    write: "1",
    type: "구매 문의",
    productId: String(product.id),
    title: `[상품문의] ${product.title}`,
    category: categoryLabel,
  });
  if (modelName) {
    inquiryParams.set("model", modelName);
  }
  const inquiryHref = `/inquiry?${inquiryParams.toString()}`;

  const { data: relatedRows } = await supabase
    .from("products")
    .select("*")
    .neq("category", "배송인증")
    .neq("id", id)
    .eq("category", product.category)
    .order("created_at", { ascending: false })
    .limit(4);

  const relatedProducts = (relatedRows ?? []) as ProductItem[];

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

      <main className="hb-container py-7 sm:py-10 flex-1">
        {/* 상단 경로 네비게이션 */}
        <nav
          aria-label="경로 이동"
          className="mb-5 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-[#4B5260]">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1.5 text-[#0E1A2B] hover:text-[#D9531E] transition-colors"
            >
              <Icon d={ICON.left} className="h-4 w-4" />
              <span>판매 제품 갤러리</span>
            </Link>
            <span className="text-[#CFCAC0]">/</span>
            <Link
              href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
              className="hover:text-[#0E1A2B] underline underline-offset-4"
            >
              {categoryLabel}
            </Link>
          </div>

          <CopyProductLinkButton productTitle={product.title} />
        </nav>

        {/* 상품 상세 메인 그리드 (이미지 7 : 정보 5 비율) */}
        <div className="overflow-hidden rounded-md border border-[#E4E0D8] bg-white shadow-xs grid grid-cols-1 lg:grid-cols-12">
          {/* 좌측: 상품 이미지 갤러리 */}
          <div className="border-b lg:border-b-0 lg:border-r border-[#E4E0D8] lg:col-span-7">
            <ProductDetailGallery
              title={product.title}
              images={images}
              status={product.status}
              createdAt={product.created_at}
            />
          </div>

          {/* 우측: 상품 핵심 정보 및 상담 액션 */}
          <div className="flex flex-col justify-between p-5 sm:p-8 lg:col-span-5">
            <div>
              {/* 1. 카테고리 · 상태 등급 · 등록일 */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
                  className="rounded-sm border border-[#DDD9D1] bg-[#FAF9F7] px-2.5 py-0.5 text-[11.5px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B]"
                >
                  {categoryLabel}
                </Link>
                {product.condition_grade && (
                  <span className="rounded-sm border border-[#FADCD0] bg-[#FFF5F0] px-2.5 py-0.5 text-[11.5px] font-bold text-[#D9531E]">
                    {product.condition_grade}
                  </span>
                )}
                {createdDate && (
                  <span className="ml-auto text-[11.5px] text-[#8A8478]">
                    등록일 {createdDate}
                  </span>
                )}
              </div>

              {/* 2. 상품명 (가장 먼저 읽히는 타이틀) */}
              <h1 className="mt-3 text-[21px] sm:text-[25px] font-bold leading-[1.32] tracking-[-0.02em] text-[#0E1A2B] break-keep">
                {product.title}
              </h1>

              {/* 3. 판매 가격 (상품명 바로 아래에서 명확히 인지되도록 배치) */}
              <div className="mt-4 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-4">
                <div className="flex items-center justify-between text-[12px] font-bold text-[#6B7280]">
                  <span>판매 가격 ({statusLabel})</span>
                  {typeof product.views === "number" && (
                    <span className="font-normal text-[#8A8478]">
                      조회 {product.views}회
                    </span>
                  )}
                </div>

                {sold ? (
                  <p className="mt-1 text-[24px] font-bold text-[#8A8478]">
                    판매완료
                  </p>
                ) : priced ? (
                  <p className="mt-1 text-[26px] sm:text-[30px] font-bold tracking-tight text-[#D9531E]">
                    {priceDisplay}
                  </p>
                ) : (
                  <div className="mt-1">
                    <p className="text-[20px] sm:text-[22px] font-bold text-[#D9531E]">
                      {priceDisplay}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[#4B5260]">
                      설치 환경·배관 거리·수량에 따라 맞춤 견적을 안내해 드립니다.
                    </p>
                  </div>
                )}

                {modelName && (
                  <div className="mt-3 pt-2.5 border-t border-[#E4E0D8] flex items-center justify-between text-[12.5px]">
                    <span className="font-semibold text-[#6B7280]">확인 모델명</span>
                    <span className="font-mono font-bold text-[#0E1A2B]">
                      {modelName}
                    </span>
                  </div>
                )}
              </div>

              {/* 4. 사양 · 특징 · 구매 전 확인사항 구분 표시 */}
              <div className="mt-5 space-y-3.5">
                {parsedDesc.hasStructuredSections ? (
                  <>
                    {parsedDesc.specs.length > 0 && (
                      <div className="rounded-md border border-[#E4E0D8] bg-white p-4">
                        <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-[#0E1A2B] mb-2">
                          주요 사양
                        </h2>
                        <dl className="divide-y divide-[#F2F0EC] text-[13.5px]">
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
                        <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-[#0E1A2B] mb-2">
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
                      <div className="rounded-md border border-[#FADCD0] bg-[#FFF5F0] p-3.5 text-[12.5px] text-[#B5431A]">
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
                  <div className="rounded-md border border-[#E4E0D8] bg-white p-4">
                    <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-[#0E1A2B] mb-2">
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

            {/* 5. 상담 및 온라인 문의 버튼 (명확한 우선순위) */}
            <div className="mt-7 pt-5 border-t border-[#E4E0D8] space-y-2.5">
              {sold && (
                <p className="text-[12.5px] font-bold text-[#D9531E] text-center pb-1">
                  본 상품은 판매가 완료되었습니다. 동일·유사 모델 재고는 문의해 주세요.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={telHref(STORE.tel)}
                  className="hb-btn-primary h-12 text-[14.5px]"
                >
                  <Icon d={ICON.phone} className="h-4 w-4 text-[#FF8A50]" />
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

        {/* 매장 거래 및 보증 기준 요약 바 */}
        <section
          aria-label="거래 및 배송·설치 안내"
          className="mt-6 grid gap-3.5 sm:grid-cols-3"
        >
          <div className="rounded-md border border-[#E4E0D8] bg-white p-4 sm:p-5">
            <h2 className="text-[13.5px] font-bold text-[#0E1A2B]">
              오프라인 매장 실물 확인
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#4B5260]">
              {STORE.address} ({STORE.addressNote}) 매장에 방문하시면 제품을 직접 보고 결정하실 수 있습니다. ({STORE.hours})
            </p>
          </div>
          <div className="rounded-md border border-[#E4E0D8] bg-white p-4 sm:p-5">
            <h2 className="text-[13.5px] font-bold text-[#0E1A2B]">
              맞춤 배송 · 설치 상담
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#4B5260]">
              대전·세종·충청권 및 전국 배송·설치 여부는 품목과 현장 여건(층수, 배관, 전원 등)에 따라 사전 조율합니다.
            </p>
          </div>
          <div className="rounded-md border border-[#E4E0D8] bg-white p-4 sm:p-5">
            <h2 className="text-[13.5px] font-bold text-[#0E1A2B]">
              무상 보증 및 세금계산서
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#4B5260]">
              세척·작동 검수를 마친 제품이며 세금계산서 발행이 가능합니다. (에어컨·냉난방기 8개월, 일반 제품 4개월 A/S 기준)
            </p>
          </div>
        </section>

        {/* 동일 카테고리 추천 매물 4선 */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 pt-10 border-t border-[#E4E0D8]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="hb-eyebrow">Related Inventory</p>
                <h2 className="mt-1 text-[19px] sm:text-[22px] font-bold text-[#0E1A2B]">
                  {categoryLabel} 카테고리의 다른 매물
                </h2>
              </div>
              <Link
                href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
                className="text-[13px] font-bold text-[#0E1A2B] hover:text-[#D9531E] underline underline-offset-4"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}