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
  extractSpecCapsules,
  parseProductDescription,
  type ProductCategoryValue,
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
  CopyPromoPostButton,
  QuoteBasketButton,
} from "../../components/products/product-detail-gallery";
import {
  ProductCard,
  type ProductItem,
} from "../../components/products/product-card";

/**
 * 카테고리별(업소용 B2B / 에어컨·냉난방기 / 가정용 B2C) 맞춤 설치 환경 체크리스트 정의
 */
function getCategoryChecklistConfig(category: ProductCategoryValue): {
  badge: string;
  title: string;
  isB2B: boolean;
  rows: ReadonlyArray<{ label: string; desc: string }>;
} {
  if (category === "업소용기기") {
    return {
      badge: "B2B COMMERCIAL CHECK",
      title: "업소용 설비 도입 · 설치 환경 체크리스트",
      isB2B: true,
      rows: [
        {
          label: "전원 규격",
          desc: "단상 220V / 삼상 380V 여부 및 매장 분전반(차단기) 용량 확인",
        },
        {
          label: "급·배수 / 가스",
          desc: "제빙기·세척기 급배수 배관 위치 / 가스기기(도시가스·LPG) 규격",
        },
        {
          label: "반입 동선",
          desc: "주방 출입구 가로 폭·문턱 높이 및 기존 폐업·철거 기기 유무",
        },
      ],
    };
  }

  if (category === "에어컨/냉난방기") {
    return {
      badge: "HVAC INSTALLATION CHECK",
      title: "에어컨 · 냉난방기 시공 환경 체크리스트",
      isB2B: true,
      rows: [
        {
          label: "전원 · 면적",
          desc: "단상 220V / 삼상 380V 전원 규격 및 설치 공간 평형 확인",
        },
        {
          label: "배관 · 타공",
          desc: "실내기~실외기 예상 배관 거리 및 벽체 타공 여부 확인",
        },
        {
          label: "실외기 거치",
          desc: "베란다·옥상·외벽 앵글 등 실외기 안착 공간 및 층수 확인",
        },
      ],
    };
  }

  return {
    badge: "HOME DELIVERY CHECK",
    title: "가정용 가전 배송 · 설치 환경 체크리스트",
    isB2B: false,
    rows: [
      {
        label: "진입로 · 문폭",
        desc: "현관문·방문·설치 공간의 가로 × 깊이 × 높이 여유 치수 확인",
      },
      {
        label: "운반 환경",
        desc: "엘리베이터 유무 또는 계단 층수(사다리차 필요 여부) 사전 확인",
      },
      {
        label: "수도 · 콘센트",
        desc: "세탁기·냉장고 급배수 수도꼭지 위치 및 전용 콘센트 확인",
      },
    ],
  };
}

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
  const checklistConfig = getCategoryChecklistConfig(categoryLabel);
  const priced = hasProductPrice(product.price);
  const priceDisplay = sold
    ? "판매완료"
    : formatProductPrice(product.price, categoryLabel);

  const modelName = extractModelName(product.description, product.title);
  const specCapsules = extractSpecCapsules(
    product.title,
    product.description,
    4
  );
  const parsedDesc = parseProductDescription(product.description);
  const createdDate = product.created_at
    ? new Date(product.created_at).toLocaleDateString("ko-KR")
    : null;

  const inquiryParams = new URLSearchParams({
    write: "1",
    type: categoryLabel === "업소용기기" ? "대량·업소용 상담" : "구매 문의",
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

  const productJsonLd: Record<string, unknown> = {
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

      <main className="hb-container py-6 sm:py-10 flex-1">
        <nav
          aria-label="경로 이동"
          className="mb-5 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-[#4B5260]">
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

          <div className="flex flex-wrap items-center gap-2">
            <CopyPromoPostButton
              product={{
                id: String(product.id),
                title: product.title,
                category: product.category,
                price: product.price,
                status: product.status,
                condition_grade: product.condition_grade,
                description: product.description,
              }}
            />
            <CopyProductLinkButton productTitle={product.title} />
          </div>
        </nav>

        <div className="overflow-hidden rounded-md border border-[#E4E0D8] bg-white shadow-xs grid grid-cols-1 lg:grid-cols-12">
          {/* 좌측 7컬럼: 상품 이미지 뷰어 */}
          <div className="border-b lg:border-b-0 lg:border-r border-[#E4E0D8] lg:col-span-7">
            <ProductDetailGallery
              id={String(product.id)}
              title={product.title}
              images={images}
              status={product.status}
              createdAt={product.created_at}
            />
          </div>

          {/* 우측 5컬럼: 상품명·가격·사양 + 업소용/가정용 맞춤 설치 체크리스트 + 상담 CTA */}
          <div className="flex flex-col justify-between p-5 sm:p-8 lg:col-span-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
                  className={`rounded-sm px-2.5 py-0.5 text-[11.5px] font-bold transition-colors ${
                    checklistConfig.isB2B
                      ? "bg-[#0E1A2B] text-white hover:bg-[#1C2D47]"
                      : "border border-[#E4E0D8] bg-[#F6F5F2] text-[#0E1A2B] hover:border-[#0E1A2B]"
                  }`}
                >
                  {categoryLabel}
                </Link>
                {product.condition_grade && (
                  <span className="rounded-sm border border-[#FADCD0] bg-[#FFF5F0] px-2.5 py-0.5 text-[11.5px] font-bold text-[#D9531E]">
                    상태: {product.condition_grade}
                  </span>
                )}
                {createdDate && (
                  <span className="ml-auto text-[11.5px] text-[#8A8478]">
                    등록일 {createdDate}
                  </span>
                )}
              </div>

              {/* 1순위: 상품명 */}
              <h1 className="mt-3 text-[21px] sm:text-[25px] font-bold leading-[1.3] tracking-[-0.02em] text-[#0E1A2B] break-keep">
                {product.title}
              </h1>

              {specCapsules.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {specCapsules.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-sm bg-[#F6F5F2] border border-[#E4E0D8] px-2 py-0.5 text-[11.5px] font-semibold text-[#4B5260]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 2순위: 판매 가격 */}
              <div className="mt-4 pb-5 border-b border-[#EEEBE5]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    판매 가격 ({statusLabel})
                  </span>
                  {typeof product.views === "number" && (
                    <span className="text-[12px] text-[#8A8478]">
                      조회수 {product.views}회
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
                    <p className="text-[20px] sm:text-[23px] font-bold text-[#D9531E]">
                      {priceDisplay}
                    </p>
                    <p className="mt-1 text-[12.5px] text-[#4B5260]">
                      설치 환경·배관 거리·수량에 따라 최적 견적을 안내해 드립니다.
                    </p>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-[13px] text-[#4B5260]">
                  <span className="font-medium text-[#8A8478]">모델명</span>
                  <span className="font-mono font-bold text-[#0E1A2B]">
                    {modelName || "매장 문의 (상세 사진 참조)"}
                  </span>
                </div>
              </div>

              {/* 3순위: 주요 사양 및 특징 */}
              <div className="mt-5 space-y-5">
                {parsedDesc.hasStructuredSections ? (
                  <>
                    {parsedDesc.specs.length > 0 && (
                      <div>
                        <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-[#0E1A2B] mb-2">
                          주요 사양
                        </h2>
                        <dl className="divide-y divide-[#F0EDE7] border-y border-[#F0EDE7] text-[13.5px]">
                          {parsedDesc.specs.map((s, i) => (
                            <div
                              key={s.label + i}
                              className="py-2 flex justify-between gap-4"
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
                      <div>
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
                      <div className="rounded-md bg-[#FFF5F0] px-4 py-3 text-[13px] text-[#B5431A]">
                        <strong className="block font-bold mb-1">
                          제품별 추가 확인사항
                        </strong>
                        {parsedDesc.checkPoints.map((c, i) => (
                          <p key={i}>• {c}</p>
                        ))}
                      </div>
                    )}

                    {parsedDesc.rawRest.length > 0 && (
                      <div className="text-[13.5px] leading-relaxed text-[#1F2530] whitespace-pre-line">
                        {parsedDesc.rawRest.join("\n")}
                      </div>
                    )}
                  </>
                ) : (
                  <div>
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

            {/* 4순위: 업소용(B2B) vs 가정용(B2C) 톤앤매너 분리형 사전 체크리스트 표 + 상담 버튼 */}
            <div className="mt-7 pt-5 border-t border-[#E4E0D8] space-y-4">
              <div
                aria-label={checklistConfig.title}
                className={`overflow-hidden rounded-md border ${
                  checklistConfig.isB2B
                    ? "border-[#0E1A2B]/25 bg-[#F8FAFC]"
                    : "border-[#E4E0D8] bg-[#FAF9F7]"
                }`}
              >
                <div
                  className={`flex items-center justify-between px-3.5 py-2 text-[12px] font-bold ${
                    checklistConfig.isB2B
                      ? "bg-[#0E1A2B] text-white"
                      : "bg-[#EFECE6] text-[#0E1A2B]"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Icon
                      d={ICON.check}
                      className={`h-3.5 w-3.5 ${
                        checklistConfig.isB2B
                          ? "text-[#FF8A50]"
                          : "text-[#D9531E]"
                      }`}
                    />
                    <span>{checklistConfig.title}</span>
                  </span>
                  <span
                    className={`text-[10px] tracking-wider uppercase ${
                      checklistConfig.isB2B ? "text-white/70" : "text-[#6B7280]"
                    }`}
                  >
                    {checklistConfig.badge}
                  </span>
                </div>

                <dl className="divide-y divide-[#E4E0D8] text-[12.5px]">
                  {checklistConfig.rows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[82px_1fr] gap-2.5 px-3.5 py-2.5 items-start"
                    >
                      <dt className="font-bold text-[#0E1A2B]">{row.label}</dt>
                      <dd className="text-[#4B5260] leading-snug">
                        {row.desc}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* 상담 버튼 그룹 */}
              <div className="space-y-2.5">
                {sold && (
                  <p className="text-[12.5px] font-semibold text-[#D9531E] text-center pb-0.5">
                    본 상품은 판매가 완료되었습니다. 동일·유사 모델 재고는 문의해 주세요.
                  </p>
                )}
                {!sold && (
                  <QuoteBasketButton
                    item={{
                      id: String(product.id),
                      title: product.title,
                      category: categoryLabel,
                      price: product.price,
                      modelName,
                      imageUrl: images[0] || null,
                    }}
                  />
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={telHref(STORE.tel)}
                    className="hb-btn-primary h-12 text-[14px]"
                  >
                    <Icon d={ICON.phone} className="h-4 w-4 text-[#FF8A50]" />
                    <span>전화 상담</span>
                  </a>
                  <a
                    href={STORE.kakaoChat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hb-btn-kakao h-12 text-[14px]"
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
        </div>

        {/* 하단 매장 거래 및 배송 안내 (기존 문구 100% 보존 + 오픈 구분선 레이아웃) */}
        <section
          aria-label="거래 및 배송·설치 안내"
          className="mt-8 border-y border-[#E4E0D8] py-6 grid gap-6 sm:grid-cols-3 sm:divide-x sm:divide-[#E4E0D8]"
        >
          <div className="sm:pr-4">
            <h2 className="text-[14px] font-bold text-[#0E1A2B]">
              오프라인 매장 실물 확인
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#4B5260]">
              {STORE.address} ({STORE.addressNote}) 매장에 방문하시면 제품을 직접 보고 결정하실 수 있습니다. ({STORE.hours}, {STORE.closed})
            </p>
          </div>
          <div className="sm:px-6">
            <h2 className="text-[14px] font-bold text-[#0E1A2B]">
              배송 · 설치 안내
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#4B5260]">
              대전·세종·충청권 및 타 지역 배송·설치 여부는 품목과 설치 환경(층수, 배관, 전원 규격 등)에 따라 사전 상담 후 조율합니다.
            </p>
          </div>
          <div className="sm:pl-6">
            <h2 className="text-[14px] font-bold text-[#0E1A2B]">
              검수 및 증빙 안내
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#4B5260]">
              입고 후 작동 점검과 세척을 거친 제품이며, 사업자 고객님을 위한 세금계산서 발행이 가능합니다. A/S 조건은 품목 및 계약 조건에 따라 안내해 드립니다.
            </p>
          </div>
        </section>

        {/* 동일 카테고리 추천 매물 4선 */}
        {relatedProducts.length > 0 && (
          <section className="mt-10 pt-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="hb-eyebrow">Related Products</p>
                <h2 className="mt-1 text-[20px] sm:text-[23px] font-bold text-[#0E1A2B]">
                  같은 카테고리의 다른 매물
                </h2>
              </div>
              <Link
                href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
                className="text-[13px] font-bold text-[#0E1A2B] hover:text-[#D9531E] underline underline-offset-4"
              >
                {categoryLabel} 전체 보기 →
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
      <MobileCtaBar
        productContext={{
          id: String(product.id),
          title: product.title,
          category: categoryLabel,
          price: product.price,
          status: product.status,
          modelName,
          imageUrl: images[0] || null,
          inquiryHref,
        }}
      />
    </div>
  );
}