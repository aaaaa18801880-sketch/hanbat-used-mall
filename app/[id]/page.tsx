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
    <div className="min-h-screen bg-[#FAF9F7] font-sans text-[#0E1A2B] flex flex-col">
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
          <div className="flex flex-wrap items-center gap-2 text-hb-sm font-bold text-[#3E4856] min-w-0">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1.5 text-[#0E1A2B] hover:text-[#B5431A] transition-colors shrink-0"
            >
              <Icon d={ICON.left} className="h-4 w-4" />
              <span>전체 제품 갤러리</span>
            </Link>
            <span className="text-[#6E675C]" aria-hidden="true">/</span>
            <Link
              href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
              className="hover:text-[#0E1A2B] underline underline-offset-4 shrink-0"
            >
              {categoryLabel}
            </Link>
            <span className="hidden md:inline text-[#6E675C]" aria-hidden="true">/</span>
            <span className="hidden md:inline truncate max-w-[280px] text-[#596273] font-medium">
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

        {/* 쇼룸 2컬럼 아키텍처 레이아웃: 좌측(사진 + 상세 제원서) / 우측(첫 화면 의사결정·상담 콘솔) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-9 items-start">
          {/* 좌측 7컬럼: 1. 스튜디오 사진 뷰어 + 하단 상세 제원서 */}
          <div className="lg:col-span-7 min-w-0 space-y-7">
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

            {/* 상세 제원 및 검수 소견서 (좌측 하단 배치로 우측 상담 콘솔의 첫 화면 시인성 확보) */}
            <ProductStructuredDescription description={product.description} />

            {categoryLabel === "에어컨/냉난방기" && (
              <AirconSetGuideBanner variant="card" />
            )}
          </div>

          {/* 우측 5컬럼: 2~7. 상품명·가격·상태·모델명·검수·핵심스펙·설치체크·즉시문의 콘솔 (Sticky) */}
          <div className="lg:col-span-5 min-w-0 lg:sticky lg:top-24">
            <div className="border-t-2 border-[#0E1A2B] bg-white p-5 sm:p-6 rounded-b-xl border-x border-b border-[#E5E2DC] shadow-card">
              {/* 상단 카테고리 & 등록일 헤더 */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
                  className={`rounded px-2.5 py-0.5 text-hb-xs font-bold transition-colors ${
                    checklistConfig.isB2B
                      ? "bg-[#0E1A2B] text-white hover:bg-[#182942]"
                      : "border border-[#E5E2DC] bg-[#FAF9F7] text-[#0E1A2B] hover:border-[#0E1A2B]"
                  }`}
                >
                  {categoryLabel}
                </Link>
                <span
                  className={`rounded px-2 py-0.5 text-hb-xs font-bold ${
                    sold
                      ? "bg-[#E5E2DC] text-[#646E7E]"
                      : "bg-[#B5431A]/10 text-[#B5431A]"
                  }`}
                >
                  {statusLabel}
                </span>
                <div className="ml-auto flex items-center gap-2.5 text-hb-xs text-[#646E7E] tabular-nums">
                  {createdDate && <span>등록 {createdDate}</span>}
                  {typeof product.views === "number" && (
                    <span>조회 {product.views}</span>
                  )}
                </div>
              </div>

              {/* 2. 상품명 */}
              <h1 className="mt-2.5 text-hb-xl sm:text-hb-2xl font-bold leading-[1.28] tracking-[-0.025em] text-[#0E1A2B] break-keep">
                {product.title}
              </h1>

              {/* 가격 하이라이트: 다크 네이비 & 오렌지 포인트의 공식 프라이스 티켓 */}
              <div className="mt-4 rounded-xl bg-[#0E1A2B] text-white p-4 sm:p-5 shadow-card border border-[#1E2F47]">
                {/* 상단 마이크로 보증 헤더 */}
                <div className="flex items-center justify-between pb-2.5 border-b border-white/15">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon d={ICON.shieldCheck} className="w-3.5 h-3.5 text-[#FF8A50] shrink-0" />
                    <span className="text-hb-xs font-bold text-[#FF8A50] truncate">
                      직영 쇼룸 검수 완료 · 실매물 공급가
                    </span>
                  </div>
                  <span className="text-hb-xs font-bold text-white/60 shrink-0 ml-2">
                    세금계산서 발행
                  </span>
                </div>

                {/* 하단 공급가 및 타이포그래피 */}
                <div className="mt-3.5 flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-hb-xs font-bold text-white/70">
                      쇼룸 실매물 공급가
                    </span>
                    <span className="text-hb-xs text-white/50">
                      부가세 증빙 100% · 현금영수증 발행
                    </span>
                  </div>
                  {sold ? (
                    <span className="text-hb-lg sm:text-hb-xl font-bold text-slate-400">
                      판매완료 (유사 매물 문의 가능)
                    </span>
                  ) : priced ? (
                    <span className="text-hb-2xl sm:text-hb-3xl font-extrabold text-white tabular-nums tracking-tight">
                      {priceDisplay}
                    </span>
                  ) : (
                    <div className="text-right">
                      <span className="text-hb-lg sm:text-hb-xl font-extrabold text-[#FF8A50]">
                        {priceDisplay}
                      </span>
                      <p className="text-hb-xs text-white/60">
                        설치 환경·배관·수량별 맞춤 견적
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3, 4, 5. 상태 및 모델명 · 외관 상태 및 검수 정보 · 핵심 스펙 요약 */}
              <dl className="mt-3.5 divide-y divide-[#E5E2DC] border-y border-[#E5E2DC] text-hb-xs sm:text-hb-sm">
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="font-semibold text-[#646E7E] shrink-0">
                    모델명 / 코드
                  </dt>
                  <dd className="font-mono font-bold text-[#0E1A2B] text-right truncate">
                    {modelName || "매장 실물 확인 (상세 사진 참조)"}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="font-semibold text-[#646E7E] shrink-0">
                    외관 · 상태 등급
                  </dt>
                  <dd className="font-semibold text-[#0E1A2B] text-right flex items-center justify-end gap-1.5">
                    {product.condition_grade ? (
                      <>
                        <span className="inline-flex items-center rounded bg-[#B5431A]/10 px-1.5 py-0.5 text-hb-xs font-bold text-[#B5431A]">
                          {product.condition_grade}
                        </span>
                        <span>작동 점검 및 세척 완료</span>
                      </>
                    ) : (
                      <span>작동 점검·세척 완료 (실물 확인 가능)</span>
                    )}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="font-semibold text-[#646E7E] shrink-0">
                    검수 · 보증 기준
                  </dt>
                  <dd className="font-semibold text-[#0E1A2B] text-right">
                    {isHvacDetail
                      ? "세척·점검 완료 (계약별 최대 8개월)"
                      : isMajorApplianceDetail
                      ? "세척·점검 완료 (계약별 최대 4개월)"
                      : "작동 점검 완료 (품목·계약별 협의)"}
                  </dd>
                </div>

                {specCapsules.length > 0 && (
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="font-semibold text-[#646E7E] shrink-0">
                      핵심 스펙 요약
                    </dt>
                    <dd className="flex flex-wrap justify-end gap-1">
                      {specCapsules.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2 py-0.5 text-hb-xs font-bold text-[#0E1A2B]"
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
                checklistConfig={checklistConfig}
              />
            </div>
          </div>
        </div>

        {/* 부가 참고 가이드: 품목별 공통 검수 기준 안내 & 설치 공간 시뮬레이터 */}
        <section
          aria-label="출고 전 정밀 검수 내역 및 우리 집 설치 환경 체크"
          className="mt-12 pt-8 border-t-2 border-[#0E1A2B]"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <span className="hb-eyebrow">INSPECTION &amp; INSTALLATION GUIDE</span>
              <h2 className="mt-1 text-hb-xl font-bold text-[#0E1A2B]">
                출고 전 정밀 검수 내역 &amp; 우리 집 설치 환경 체크
              </h2>
            </div>
            <p className="text-hb-xs text-[#646E7E]">
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
          <section className="mt-12 pt-8 border-t-2 border-[#0E1A2B]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="hb-eyebrow">RELATED SHOWROOM INVENTORY</p>
                <h2 className="mt-1 text-hb-xl font-bold text-[#0E1A2B]">
                  같은 카테고리의 다른 실매물
                </h2>
              </div>
              <Link
                href={`/gallery?category=${encodeURIComponent(categoryLabel)}`}
                className="text-hb-sm font-bold text-[#0E1A2B] hover:text-[#B5431A] underline underline-offset-4"
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
          className="mt-12 pt-8 border-t-2 border-[#0E1A2B]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E5E2DC]">
            <div>
              <span className="hb-eyebrow">CATEGORY FAQ</span>
              <h2 className="mt-1 text-hb-lg sm:text-hb-xl font-bold text-[#0E1A2B]">
                {categoryLabel} 구매 · 설치 자주 묻는 질문
              </h2>
            </div>
            <Link
              href="/#faq-section"
              className="text-hb-xs font-bold text-[#646E7E] hover:text-[#0E1A2B] underline underline-offset-4"
            >
              전체 FAQ 보기 →
            </Link>
          </div>
          <dl className="divide-y divide-[#E5E2DC]">
            {categoryFaqs.map((faq) => (
              <div key={faq.q} className="py-4">
                <dt className="flex items-start gap-2 text-hb-base font-bold text-[#0E1A2B]">
                  <span className="text-[#B5431A] font-extrabold">Q.</span>
                  <span>{faq.q}</span>
                </dt>
                <dd className="mt-1.5 pl-6 text-hb-sm leading-relaxed text-[#3E4756] break-keep">
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
