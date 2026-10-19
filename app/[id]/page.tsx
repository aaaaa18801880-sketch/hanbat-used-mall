// 파일 경로: app/[id]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import {
  STORE,
  telHref,
  smsHref,
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

export const dynamic = "force-dynamic";

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
      badge: "업소용 설비 확인",
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
      badge: "냉난방기 시공 확인",
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
    badge: "가정용 배송 확인",
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
    .select(
      "id, title, category, description, image_url, price, status, condition_grade"
    )
    .eq("id", id)
    .single();

  if (!product || product.category === "배송인증") {
    return {
      title: `상품을 찾을 수 없습니다 | ${STORE.name}`,
      robots: { index: false, follow: false },
    };
  }

  const categoryLabel = normalizeProductCategory(product.category);
  const sold = isProductSold(product.status);
  const priceLabel = sold
    ? "판매완료"
    : formatProductPrice(product.price, categoryLabel);
  const warrantyLabel =
    categoryLabel === "에어컨/냉난방기" ? "무상A/S 8개월" : "무상A/S 4개월";
  const modelName = extractModelName(product.description, product.title);
  const capsules = extractSpecCapsules(product.title, product.description, 3);
  const images = splitImages(product.image_url);
  const canonicalUrl = `${STORE.url}/${product.id}`;

  const cleanDesc = (product.description ?? "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/[•\-*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 110);

  // CTR 유도형 타이틀: 상품명 + [판매가 · 무상A/S 보증]
  const ctrHook = sold
    ? `(판매완료 · 유사매물 문의)`
    : `[${priceLabel} · ${warrantyLabel}]`;

  const metaDescription = [
    `[${STORE.name} 실매물 · ${warrantyLabel} 보증]`,
    `${product.title}${modelName ? ` (모델명: ${modelName})` : ""}`,
    capsules.length > 0 ? `핵심규격: ${capsules.join("/")}.` : "",
    cleanDesc ||
      `분해 고압 세척 및 작동 검수 완료. 대전 중촌동 직영 매장 실물 확인 및 직배송·설치·세금계산서 발행 가능.`,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 160);

  return {
    title: `${product.title} ${ctrHook}`,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: canonicalUrl,
      siteName: STORE.name,
      title: `${product.title} ${ctrHook} | ${STORE.name}`,
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

  const warrantyMonths = categoryLabel === "에어컨/냉난방기" ? 8 : 4;
  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: STORE.name,
            item: STORE.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "판매 제품 갤러리",
            item: `${STORE.url}/gallery`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: categoryLabel,
            item: `${STORE.url}/gallery?category=${encodeURIComponent(
              categoryLabel
            )}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: product.title,
            item: `${STORE.url}/${product.id}`,
          },
        ],
      },
      {
        "@type": "Product",
        "@id": `${STORE.url}/${product.id}#product`,
        name: product.title,
        sku: String(product.id),
        ...(modelName ? { model: modelName, mpn: modelName } : {}),
        category: categoryLabel,
        description:
          product.description ||
          `${STORE.name} ${categoryLabel} ${product.title} (분해 고압 세척 완료 · 무상 A/S ${warrantyMonths}개월 보증)`,
        image: images.length > 0 ? images : [`${STORE.url}/og-image.jpg`],
        itemCondition: "https://schema.org/UsedCondition",
        brand: {
          "@type": "Organization",
          name: STORE.name,
        },
        ...(specCapsules.length > 0
          ? {
              additionalProperty: specCapsules.map((tag) => ({
                "@type": "PropertyValue",
                name: "핵심규격",
                value: tag,
              })),
            }
          : {}),
        offers: {
          "@type": "Offer",
          url: `${STORE.url}/${product.id}`,
          priceCurrency: "KRW",
          ...(priced ? { price: Number(product.price) } : {}),
          availability: sold
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
          itemCondition: "https://schema.org/UsedCondition",
          warranty: `무상 A/S ${warrantyMonths}개월 보증 (계약 조건 기준)`,
          seller: {
            "@type": "ElectronicsStore",
            name: STORE.name,
            telephone: STORE.tel,
            address: STORE.roadAddress,
          },
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] font-sans text-[#0E1A2B] flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <SiteHeader />

      <main className="hb-container py-6 sm:py-10 flex-1">
        <nav
          aria-label="경로 이동"
          className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-2 text-[13px] sm:text-[13.5px] font-bold text-[#3E4856] min-w-0">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1.5 text-[#0E1A2B] hover:text-[#D9531E] transition-colors shrink-0"
            >
              <Icon d={ICON.left} className="h-4 w-4" />
              <span>전체 제품 갤러리</span>
            </Link>
            <span className="text-[#D8D3C8]">/</span>
            <Link
              href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
              className="hover:text-[#0E1A2B] underline underline-offset-4 shrink-0"
            >
              {categoryLabel}
            </Link>
            <span className="hidden md:inline text-[#D8D3C8]">/</span>
            <span className="hidden md:inline truncate max-w-[260px] text-[#667085] font-medium">
              {product.title}
            </span>
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

        <div className="overflow-hidden rounded-xl border border-[#E6E3DC] bg-white shadow-card grid grid-cols-1 lg:grid-cols-12">
          {/* 좌측 7컬럼: 상품 이미지 뷰어 */}
          <div className="border-b lg:border-b-0 lg:border-r border-[#E6E3DC] lg:col-span-7">
            <ProductDetailGallery
              id={String(product.id)}
              title={product.title}
              images={images}
              status={product.status}
              createdAt={product.created_at}
            />
          </div>

          {/* 우측 5컬럼: 상품명·가격·사양 + 설치 체크리스트 + 상담 CTA */}
          <div className="flex flex-col justify-between p-5 sm:p-7 lg:p-8 lg:col-span-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
                  className={`rounded px-2.5 py-1 text-[12px] font-bold transition-colors ${
                    checklistConfig.isB2B
                      ? "bg-[#0E1A2B] text-white hover:bg-[#182942]"
                      : "border border-[#E5E2DC] bg-[#FAF9F7] text-[#0E1A2B] hover:border-[#0E1A2B]"
                  }`}
                >
                  {categoryLabel}
                </Link>
                {createdDate && (
                  <span className="ml-auto text-[12px] text-[#646E7E] tabular-nums">
                    등록일 {createdDate}
                  </span>
                )}
              </div>

              {/* 1. 상품명 및 규격 태그 */}
              <h1 className="mt-3 text-[21px] sm:text-[25px] font-bold leading-[1.3] tracking-[-0.025em] text-[#0E1A2B] break-keep">
                {product.title}
              </h1>

              {specCapsules.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {specCapsules.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2.5 py-0.5 text-[12px] font-semibold text-[#3E4756]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 2. 판매 가격 및 기본 요약 표 */}
              <div className="mt-4 pt-4 border-t border-[#E5E2DC]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-semibold text-[#646E7E]">
                    판매 가격 ({statusLabel})
                  </span>
                  {typeof product.views === "number" && (
                    <span className="text-[12px] text-[#646E7E] tabular-nums">
                      조회 {product.views}회
                    </span>
                  )}
                </div>

                {sold ? (
                  <p className="mt-1 text-[24px] font-bold text-[#646E7E]">
                    판매완료
                  </p>
                ) : priced ? (
                  <p className="mt-1 text-[28px] sm:text-[31px] font-bold tracking-tight text-[#D9531E] tabular-nums">
                    {priceDisplay}
                  </p>
                ) : (
                  <div className="mt-1">
                    <p className="text-[21px] sm:text-[24px] font-bold text-[#D9531E]">
                      {priceDisplay}
                    </p>
                    <p className="mt-1 text-[13px] text-[#3E4756]">
                      설치 환경·배관 거리·수량에 따라 최적 견적을 안내해 드립니다.
                    </p>
                  </div>
                )}

                <dl className="mt-4 divide-y divide-[#E5E2DC] border-y border-[#E5E2DC] text-[13px]">
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <dt className="font-semibold text-[#646E7E] shrink-0">
                      모델명 / 코드
                    </dt>
                    <dd className="font-mono font-bold text-[#0E1A2B] text-right truncate">
                      {modelName || "매장 문의 (상세 사진 참조)"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <dt className="font-semibold text-[#646E7E] shrink-0">
                      검수 · 보증 기준
                    </dt>
                    <dd className="font-semibold text-[#0E1A2B] text-right">
                      {categoryLabel === "에어컨/냉난방기"
                        ? "분해 세척 완료 · 무상 A/S 8개월"
                        : "분해 세척 완료 · 무상 A/S 4개월"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <dt className="font-semibold text-[#646E7E] shrink-0">
                      결제 · 거래 증빙
                    </dt>
                    <dd className="font-semibold text-[#0E1A2B] text-right">
                      전자세금계산서 · 카드 · 현금영수증
                    </dd>
                  </div>
                </dl>
              </div>

              {/* 3. 주요 사양 및 상태 설명 */}
              <div className="mt-5 space-y-5">
                {parsedDesc.hasStructuredSections ? (
                  <>
                    {parsedDesc.summary.length > 0 && (
                      <div className="bg-[#FAF9F7] rounded-md border border-[#E5E2DC] p-4 text-[13.5px] leading-relaxed text-[#2D333F]">
                        <h2 className="text-[13.5px] font-bold text-[#0E1A2B] mb-2 flex items-center gap-1.5">
                          <Icon d={ICON.check} className="h-4 w-4 text-[#D9531E]" />
                          <span>한눈에 보는 제품 정보</span>
                        </h2>
                        {parsedDesc.summary.map((line, i) => (
                          <p key={i} className="mt-1 first:mt-0 leading-relaxed text-[#3E4756]">
                            {line}
                          </p>
                        ))}
                      </div>
                    )}

                    {parsedDesc.specs.length > 0 && (
                      <div>
                        <h2 className="text-[13.5px] font-bold text-[#0E1A2B] mb-2">
                          주요 규격 및 사양
                        </h2>
                        <dl className="divide-y divide-[#E5E2DC] border-y border-[#E5E2DC] text-[13.5px]">
                          {parsedDesc.specs.map((s, i) => (
                            <div
                              key={s.label + i}
                              className="py-2 flex justify-between gap-4"
                            >
                              <dt className="font-medium text-[#646E7E] shrink-0">
                                {s.label}
                              </dt>
                              <dd className="font-semibold text-[#0E1A2B] text-right">
                                {s.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}

                    {parsedDesc.features.length > 0 && (
                      <div>
                        <h2 className="text-[13.5px] font-bold text-[#0E1A2B] mb-2">
                          제품 특징
                        </h2>
                        <ul className="space-y-1.5 text-[13.5px] leading-relaxed text-[#3E4756]">
                          {parsedDesc.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#D9531E] font-bold">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parsedDesc.inspectionAndAs.length > 0 && (
                      <div className="bg-[#FAF9F7] rounded-md border border-[#E5E2DC] p-3.5 text-[13px] text-[#3E4756]">
                        <h2 className="text-[13.5px] font-bold text-[#0E1A2B] mb-2">
                          점검 및 A/S 안내
                        </h2>
                        <ul className="space-y-1.5">
                          {parsedDesc.inspectionAndAs.map((as, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#15803D] font-bold">✔</span>
                              <span>{as}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parsedDesc.checkPoints.length > 0 && (
                      <div className="border-l-2 border-[#D9531E] bg-[#FAF9F7] pl-3.5 pr-3 py-2.5 text-[13px] text-[#3E4756]">
                        <strong className="block font-bold text-[#0E1A2B] mb-1">
                          구매 및 설치 전 확인사항
                        </strong>
                        {parsedDesc.checkPoints.map((c, i) => (
                          <p key={i}>• {c}</p>
                        ))}
                      </div>
                    )}

                    {parsedDesc.consultationGuide.length > 0 && (
                      <div className="bg-[#FAF9F7] rounded-md border border-[#E5E2DC] p-3.5 text-[13px] text-[#4B5260] leading-relaxed">
                        <strong className="block font-bold text-[#0E1A2B] mb-1">
                          상담 안내
                        </strong>
                        {parsedDesc.consultationGuide.map((cg, i) => (
                          <p key={i}>💬 {cg}</p>
                        ))}
                      </div>
                    )}

                    {parsedDesc.rawRest.length > 0 && (
                      <div className="text-[13.5px] leading-relaxed text-[#0E1A2B] whitespace-pre-line">
                        {parsedDesc.rawRest.join("\n")}
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <h2 className="text-[13.5px] font-bold text-[#0E1A2B] mb-2">
                      제품 사양 및 상태 설명
                    </h2>
                    <p className="text-[14px] leading-[1.7] text-[#3E4756] whitespace-pre-line break-words">
                      {product.description ||
                        "상세 사양은 전화 또는 카카오톡으로 문의해 주시면 실물 확인 후 정확히 안내해 드립니다."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. 설치 환경 체크리스트 표 + 상담 동선 */}
            <div className="mt-7 pt-5 border-t border-[#E5E2DC] space-y-5">
              <div aria-label={checklistConfig.title}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[13.5px] font-bold text-[#0E1A2B] flex items-center gap-1.5">
                    <Icon
                      d={ICON.check}
                      className="h-3.5 w-3.5 text-[#D9531E]"
                    />
                    <span>{checklistConfig.title}</span>
                  </h2>
                  <span className="text-[11.5px] font-semibold text-[#646E7E]">
                    {checklistConfig.badge}
                  </span>
                </div>

                <dl className="divide-y divide-[#E5E2DC] border-y border-[#E5E2DC] text-[12.5px]">
                  {checklistConfig.rows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[78px_1fr] sm:grid-cols-[84px_1fr] gap-2.5 py-2 items-start"
                    >
                      <dt className="font-semibold text-[#0E1A2B]">
                        {row.label}
                      </dt>
                      <dd className="text-[#3E4756] leading-snug break-keep">
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
                    className="hb-btn-primary h-11 text-[14px]"
                  >
                    <Icon d={ICON.phone} className="h-4 w-4 text-[#FF8A50]" />
                    <span>전화 상담</span>
                  </a>
                  <a
                    href={STORE.kakaoChat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hb-btn-kakao h-11 text-[14px]"
                  >
                    <Icon d={ICON.chat} className="h-4 w-4" />
                    <span>카카오톡 문의</span>
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={smsHref(
                      STORE.mobile,
                      `[한밭중고전자 상품문의] ${product.title}${
                        modelName ? ` (${modelName})` : ""
                      } 재고 및 배송·설치 견적 문의드립니다.`
                    )}
                    className="hb-btn-outline h-10 text-[13px]"
                  >
                    <Icon d={ICON.chat} className="h-3.5 w-3.5 text-[#D9531E]" />
                    <span>문자({STORE.mobile}) 문의</span>
                  </a>
                  <Link
                    href={inquiryHref}
                    className="hb-btn-outline h-10 text-[13px]"
                  >
                    <Icon d={ICON.pen} className="h-3.5 w-3.5 text-[#D9531E]" />
                    <span>온라인 문의 남기기</span>
                  </Link>
                </div>
                <p className="pt-1 text-center text-[12px] text-[#646E7E] tabular-nums">
                  매장 대표전화 <strong className="text-[#0E1A2B]">{STORE.tel}</strong> · 직통{" "}
                  <strong className="text-[#0E1A2B]">{STORE.mobile}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 매장 거래 및 배송 안내 (기존 문구 100% 보존 + 오픈 구분선 레이아웃) */}
        <section
          aria-label="거래 및 배송·설치 안내"
          className="mt-8 border-y border-[#E6E3DC] py-6 grid gap-6 sm:grid-cols-3 sm:divide-x sm:divide-[#E6E3DC]"
        >
          <div className="sm:pr-4">
            <h2 className="text-[14.5px] font-extrabold text-[#0E1A2B]">
              오프라인 매장 실물 확인
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#3E4856]">
              {STORE.address} ({STORE.addressNote}) 매장에 방문하시면 제품을 직접 보고 결정하실 수 있습니다. ({STORE.hours}, {STORE.closed})
            </p>
          </div>
          <div className="sm:px-6">
            <h2 className="text-[14.5px] font-extrabold text-[#0E1A2B]">
              배송 · 설치 안내
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#3E4856]">
              대전·세종·충청권 및 타 지역 배송·설치 여부는 품목과 설치 환경(층수, 배관, 전원 규격 등)에 따라 사전 상담 후 조율합니다.
            </p>
          </div>
          <div className="sm:pl-6">
            <h2 className="text-[14.5px] font-extrabold text-[#0E1A2B]">
              검수 및 증빙 안내
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#3E4856]">
              입고 후 작동 점검과 세척을 거친 제품이며, 사업자 고객님을 위한 세금계산서 발행이 가능합니다. A/S 조건은 품목 및 계약 조건에 따라 안내해 드립니다.
            </p>
          </div>
        </section>

        {/* 동일 카테고리 추천 매물 4선 */}
        {relatedProducts.length > 0 && (
          <section className="mt-10 pt-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="hb-eyebrow">연관 추천 매물</p>
                <h2 className="mt-1 text-[21px] sm:text-[24px] font-extrabold text-[#0E1A2B]">
                  같은 카테고리의 다른 매물
                </h2>
              </div>
              <Link
                href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
                className="text-[13.5px] font-bold text-[#0E1A2B] hover:text-[#D9531E] underline underline-offset-4"
              >
                {categoryLabel} 전체 보기 →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
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