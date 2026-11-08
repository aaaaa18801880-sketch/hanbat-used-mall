// 파일 경로: app/[id]/page.tsx
import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { serializeJsonLd } from "../../lib/json-ld";
import {
  STORE,
  STORE_MERCHANT_POLICY,
  STORE_SHIPPING_POLICY,
  splitImages,
  isProductSold,
  getProductStatusLabel,
  normalizeProductCategory,
  formatProductPrice,
  hasProductPrice,
  extractModelName,
  extractSpecCapsules,
  getCategoryFaqs,
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
  InteractiveChecklistAndCta,
} from "../../components/products/product-detail-gallery";
import {
  ProductCard,
  type ProductItem,
} from "../../components/products/product-card";
import { AirconSetGuideBanner } from "../../components/products/aircon-set-guide-banner";
import { ProductStructuredDescription } from "../../components/products/product-structured-description";
import { RecentViewedStrip } from "../../components/products/product-compare-modal";
import { V2VisualInspectionViewer } from "../../components/products/v2-visual-inspection-viewer";
import { V2SpatialFitPlanner } from "../../components/products/v2-spatial-fit-planner";
import { RefrigeratorCompartmentDiagram } from "../../components/products/refrigerator-compartment-diagram";

export const revalidate = 300;

const getProductById = cache(async (id: string) => {
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  return { product, error };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const { product } = await getProductById(id);

  if (!product || product.category === "배송인증") {
    return {
      title: "상품을 찾을 수 없습니다",
      robots: { index: false, follow: false },
    };
  }

  const categoryLabel = normalizeProductCategory(product.category);
  const sold = isProductSold(product.status);
  const priceLabel = sold
    ? "판매완료"
    : formatProductPrice(product.price, categoryLabel);
  const warrantyLabel =
    categoryLabel === "에어컨/냉난방기"
      ? "최대 8개월 보증(계약별)"
      : categoryLabel === "냉장고" || categoryLabel === "세탁기/건조기"
      ? "최대 4개월 보증(계약별)"
      : "계약조건별 보증";
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
          ? [
              {
                url: images[0].startsWith("http")
                  ? images[0]
                  : `${STORE.url}${images[0].startsWith("/") ? "" : "/"}${images[0]}`,
                alt: product.title,
              },
            ]
          : [{ url: `${STORE.url}/og-image.jpg`, alt: STORE.name }],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { product, error } = await getProductById(id);

  if (error || !product || product.category === "배송인증") {
    notFound();
  }

  const images = splitImages(product.image_url);
  const sold = isProductSold(product.status);
  const statusLabel = getProductStatusLabel(product.status);
  const categoryLabel = normalizeProductCategory(product.category);
  const isB2B = categoryLabel === "업소용기기" || categoryLabel === "에어컨/냉난방기";
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
  const createdDate = product.created_at
    ? new Date(product.created_at).toLocaleDateString("ko-KR")
    : null;

  const inquiryParams = new URLSearchParams({
    write: "1",
    type: categoryLabel === "업소용기기" ? "대량·업소용 상담" : "구매 문의",
    productId: String(product.id),
    title: sold
      ? `[유사매물 재고문의] [${categoryLabel}] ${product.title}`
      : `[상품문의] [${categoryLabel}] ${product.title}`,
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

  const isHvacDetail = categoryLabel === "에어컨/냉난방기";
  const isMajorApplianceDetail =
    categoryLabel === "냉장고" || categoryLabel === "세탁기/건조기";
  const warrantySummary = isHvacDetail
    ? STORE_MERCHANT_POLICY.warrantyAircon
    : isMajorApplianceDetail
    ? STORE_MERCHANT_POLICY.warrantyMajor
    : STORE_MERCHANT_POLICY.warrantyGeneral;

  const categoryFaqs = getCategoryFaqs(categoryLabel, sold);
  const createdTimestamp = product.created_at
    ? new Date(product.created_at).getTime()
    : 1767225600000;
  const priceValidUntil = new Date(createdTimestamp + 90 * 86400000)
    .toISOString()
    .split("T")[0];

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
          `${STORE.name} ${categoryLabel} ${product.title} (작동 검수 완료 · ${warrantySummary})`,
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
          priceValidUntil,
          availability: sold
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
          itemCondition: "https://schema.org/UsedCondition",
          warranty: warrantySummary,
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: STORE_MERCHANT_POLICY.applicableCountry,
            returnPolicyCategory: STORE_MERCHANT_POLICY.returnPolicyCategory,
            merchantReturnDays: STORE_MERCHANT_POLICY.merchantReturnDays,
            returnMethod: STORE_MERCHANT_POLICY.returnMethod,
            returnFees: STORE_MERCHANT_POLICY.returnFees,
          },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value: STORE_SHIPPING_POLICY.rate,
              currency: STORE_SHIPPING_POLICY.currency,
            },
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: STORE_SHIPPING_POLICY.destinationCountry,
            },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: {
                "@type": "QuantitativeValue",
                minValue: STORE_SHIPPING_POLICY.minHandlingDays,
                maxValue: STORE_SHIPPING_POLICY.maxHandlingDays,
                unitCode: "d",
              },
              transitTime: {
                "@type": "QuantitativeValue",
                minValue: STORE_SHIPPING_POLICY.minTransitDays,
                maxValue: STORE_SHIPPING_POLICY.maxTransitDays,
                unitCode: "d",
              },
            },
          },
          seller: {
            "@type": "ElectronicsStore",
            name: STORE.name,
            telephone: STORE.tel,
            address: STORE.roadAddress,
          },
        },
      },
      ...(categoryFaqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${STORE.url}/${product.id}#faq`,
              mainEntity: categoryFaqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.a,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#141A23] flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />

      <SiteHeader />

      <main className="hb-container py-5 sm:py-8 flex-1">
        {/* 상단 브레드크럼 및 공유 액션 */}
        <nav
          aria-label="경로 이동"
          className="mb-4 sm:mb-5 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-2 text-hb-sm font-bold text-[#334155] min-w-0">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1.5 text-[#141A23] hover:text-[#E8521A] transition-colors shrink-0"
            >
              <Icon d={ICON.left} className="h-4 w-4" />
              <span>전체 제품 갤러리</span>
            </Link>
            <span className="text-[#94A3B8]" aria-hidden="true">/</span>
            <Link
              href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
              className="hover:text-[#141A23] underline underline-offset-4 shrink-0"
            >
              {categoryLabel}
            </Link>
            <span className="hidden md:inline text-[#94A3B8]" aria-hidden="true">/</span>
            <span className="hidden md:inline truncate max-w-[280px] text-[#64748B] font-medium">
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

        {/* 쇼룸 2컬럼 아키텍처 레이아웃: 모바일(사진 -> BuyBox -> 구조도/제원서) / 데스크톱(좌측 상단 사진, 좌측 하단 제원서, 우측 5컬럼 Sticky BuyBox) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 lg:gap-9 items-start">
          {/* 블록 1: 스튜디오 사진 갤러리 (모바일 1번째 노출, 데스크톱 좌측 상단) */}
          <div className="lg:col-start-1 lg:col-span-7 min-w-0">
            <ProductDetailGallery
              id={String(product.id)}
              title={product.title}
              category={categoryLabel}
              price={product.price}
              modelName={modelName}
              conditionGrade={product.condition_grade}
              images={images}
              status={product.status}
              createdAt={product.created_at}
            />
          </div>

          {/* 블록 2: 구매·문의 콘솔 BuyBox (모바일에서 사진 바로 다음 2번째로 즉시 노출, 데스크톱에서는 우측 5컬럼 Sticky) */}
          <div className="lg:col-start-8 lg:col-span-5 lg:row-start-1 lg:row-span-2 min-w-0 self-start lg:sticky lg:top-24">
            <div className="rounded-2xl border border-[#E2E6EC] bg-white p-5 sm:p-7 shadow-2xs">
              {/* 상단 카테고리 & 등록일 헤더 */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
                  className={`rounded-md px-2.5 py-0.5 text-hb-xs font-bold transition-colors ${
                    isB2B
                      ? "bg-[#141A23] text-white hover:bg-[#1E2736]"
                      : "border border-[#E2E6EC] bg-[#F7F8FA] text-[#141A23] hover:border-[#CBD2DC]"
                  }`}
                >
                  {categoryLabel}
                </Link>
                <span
                  className={`rounded-md px-2 py-0.5 text-hb-xs font-bold ${
                    sold
                      ? "bg-[#F1F3F6] text-[#64748B]"
                      : "bg-[#FFF4EE] text-[#E8521A]"
                  }`}
                >
                  {statusLabel}
                </span>
                <div className="ml-auto flex items-center gap-2.5 text-hb-xs text-[#64748B] tabular-nums">
                  {createdDate && <span>등록 {createdDate}</span>}
                  {typeof product.views === "number" && (
                    <span>조회 {product.views}</span>
                  )}
                </div>
              </div>

              {/* 2. 상품명 */}
              <h1 className="mt-3 text-hb-xl sm:text-hb-2xl font-bold leading-[1.3] tracking-[-0.025em] text-[#141A23] break-keep [text-wrap:balance]">
                {product.title}
              </h1>

              {/* 쇼룸 프라이스 콜아웃 박스 (가격, 세척·시운전 검수 완료 배지, 결제 증빙 안내 일체화) */}
              <div className="mt-4 rounded-xl bg-[#F7F8FA] border border-[#E2E6EC] p-4 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2.5">
                  <div>
                    {sold ? (
                      <span className="text-hb-xl sm:text-hb-2xl font-bold text-[#94A3B8]">
                        판매완료 · 유사 매물 상담 가능
                      </span>
                    ) : priced ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-hb-2xl sm:text-hb-3xl font-bold text-[#141A23] tabular-nums tracking-[-0.03em]">
                          {priceDisplay}
                        </span>
                        <span className="text-hb-xs font-semibold text-[#E8521A]">
                          수량별·세트 할인 문의 가능
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-hb-xl sm:text-hb-2xl font-bold text-[#E8521A] tabular-nums">
                          {priceDisplay}
                        </span>
                        <span className="text-hb-xs font-semibold text-[#0F766E]">
                          수량별·세트 할인 문의
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] px-2.5 py-1 text-hb-xs font-bold text-[#0F766E] shrink-0 shadow-2xs">
                    <Icon d={ICON.shieldCheck} className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>세척·시운전 검수 완료</span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#E2E6EC] text-hb-xs text-[#64748B]">
                  <span className="font-medium">
                    세금계산서 · 현금영수증 · 카드결제 지원
                  </span>
                  <span className="font-semibold text-[#141A23]">
                    100% 정식 증빙
                  </span>
                </div>
              </div>

              {/* 3, 4, 5. 상태 및 모델명 · 외관 상태 및 검수 정보 · 핵심 스펙 요약 (No Card-in-Card 평탄화 ListRow) */}
              <dl className="mt-4 border-y border-[#E2E6EC] divide-y divide-[#E2E6EC] text-hb-xs sm:text-hb-sm">
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="font-semibold text-[#64748B] shrink-0">
                    모델명 / 코드
                  </dt>
                  <dd className="font-mono font-bold text-[#141A23] text-right truncate tabular-nums">
                    {modelName || "매장 실물 확인 (상세 사진 참조)"}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="font-semibold text-[#64748B] shrink-0">
                    외관 · 상태 등급
                  </dt>
                  <dd className="font-semibold text-[#141A23] text-right flex items-center justify-end gap-1.5">
                    {product.condition_grade ? (
                      <>
                        <span className="inline-flex items-center rounded-md bg-[#FFF4EE] border border-[#FADCD0] px-2 py-0.5 text-hb-xs font-bold text-[#E8521A]">
                          {product.condition_grade}
                        </span>
                        <span>작동 점검 완료</span>
                      </>
                    ) : (
                      <span>작동 점검·세척 완료</span>
                    )}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="font-semibold text-[#64748B] shrink-0">
                    검수 · 보증 기준
                  </dt>
                  <dd className="font-semibold text-[#141A23] text-right tabular-nums">
                    {isHvacDetail
                      ? "무상 A/S 최대 8개월 보증"
                      : isMajorApplianceDetail
                      ? "무상 A/S 최대 4개월 보증"
                      : "작동 점검 완료 (계약별 보증)"}
                  </dd>
                </div>

                {specCapsules.length > 0 && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <dt className="font-semibold text-[#64748B] shrink-0">
                      핵심 스펙 요약
                    </dt>
                    <dd className="flex flex-wrap justify-end gap-1.5">
                      {specCapsules.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-[#F1F3F6] px-2.5 py-0.5 text-hb-xs font-bold text-[#141A23] tabular-nums"
                        >
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>

              {/* 6 & 7. 배송/설치 체크 정보 + 주요 문의 버튼 */}
              <InteractiveChecklistAndCta
                product={{
                  id: String(product.id),
                  title: product.title,
                  price: product.price,
                  status: product.status,
                  condition_grade: product.condition_grade,
                  description: product.description,
                }}
                categoryLabel={categoryLabel}
                sold={sold}
                modelName={modelName}
                firstImageUrl={images[0] || null}
              />
            </div>
          </div>

          {/* 블록 3: 도어 구조도 + 상세 제원서 + 에어컨 안내 (모바일 3번째 노출, 데스크톱 좌측 갤러리 바로 아래) */}
          <div className="lg:col-start-1 lg:col-span-7 min-w-0 space-y-6 sm:space-y-7">
            {/* 냉장고/냉동고 도어 구조 및 칸별 역할 원장 모형 (상하단 2도어, 4도어, 김치냉장고 등) */}
            <RefrigeratorCompartmentDiagram
              title={product.title}
              description={product.description}
              category={categoryLabel}
            />

            {/* 상세 제원 및 검수 소견서 (좌측 하단 배치로 우측 상담 콘솔의 첫 화면 시인성 확보) */}
            <ProductStructuredDescription description={product.description} />

            {categoryLabel === "에어컨/냉난방기" && (
              <AirconSetGuideBanner variant="card" />
            )}
          </div>
        </div>

        {/* 부가 참고 가이드: 품목별 공통 검수 기준 안내 & 설치 공간 시뮬레이터 */}
        <section
          aria-label="출고 전 정밀 검수 내역 및 우리 집 설치 환경 체크"
          className="mt-12 pt-8 border-t border-[#E2E6EC]"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <span className="text-hb-xs font-bold text-[#E8521A]">검수 기준 및 설치 환경 체크</span>
              <h2 className="mt-1 text-hb-xl font-bold text-[#141A23]">
                출고 전 정밀 검수 내역 &amp; 우리 집 설치 환경 체크
              </h2>
            </div>
            <p className="text-hb-xs text-[#64748B]">
              한밭중고전자 전문 엔지니어의 4대 핵심 검수 내역과 우리 집 설치 가능 여부를 한눈에 확인하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <V2VisualInspectionViewer
              category={categoryLabel}
              conditionGrade={product.condition_grade}
            />
            <V2SpatialFitPlanner
              productId={String(product.id)}
              title={product.title}
              description={product.description}
              category={categoryLabel}
            />
          </div>
        </section>

        {/* 동일 카테고리 추천 매물 4선 */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 pt-8 border-t border-[#E2E6EC]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-hb-xs font-bold text-[#E8521A]">동일 카테고리 추천 매물</p>
                <h2 className="mt-1 text-hb-xl font-bold text-[#141A23]">
                  같은 카테고리의 다른 실매물
                </h2>
              </div>
              <Link
                href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
                className="text-hb-sm font-bold text-[#141A23] hover:text-[#E8521A] underline underline-offset-4"
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

        {/* [기능 8] 해당 품목 구매·설치 관련 자주 묻는 질문 (FAQ) */}
        <section
          aria-label={`${categoryLabel} 자주 묻는 질문`}
          className="mt-12 pt-8 border-t border-[#E2E6EC]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E2E6EC]">
            <div>
              <span className="text-hb-xs font-bold text-[#E8521A]">품목별 자주 묻는 질문</span>
              <h2 className="mt-1 text-hb-lg sm:text-hb-xl font-bold text-[#141A23]">
                {categoryLabel} 구매 · 설치 자주 묻는 질문
              </h2>
            </div>
            <Link
              href="/#faq-section"
              className="text-hb-xs font-bold text-[#64748B] hover:text-[#141A23] underline underline-offset-4"
            >
              전체 FAQ 보기 →
            </Link>
          </div>
          <dl className="mt-5 grid gap-3">
            {categoryFaqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-[#E2E6EC] bg-white p-5 shadow-2xs">
                <dt className="flex items-start gap-2 text-hb-base font-bold text-[#141A23]">
                  <span className="text-[#E8521A] font-bold">Q.</span>
                  <span>{faq.q}</span>
                </dt>
                <dd className="mt-1.5 pl-6 text-hb-sm leading-relaxed text-[#334155] break-keep">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* [기능 4] 비로그인 최근 본 매물 스트립 */}
        <RecentViewedStrip excludeId={String(product.id)} className="mt-8" />
      </main>

      <SiteFooter />
      <MobileCtaBar
        productContext={{
          id: String(product.id),
          title: product.title,
          category: categoryLabel,
          price: product.price,
          status: product.status,
          conditionGrade: product.condition_grade,
          description: product.description,
          modelName,
          imageUrl: images[0] || null,
          inquiryHref,
        }}
      />
    </div>
  );
}
