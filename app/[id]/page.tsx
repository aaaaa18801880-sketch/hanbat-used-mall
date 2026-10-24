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
      <div className="min-h-screen bg-[#FAF9F7] flex flex-col font-sans text-[#0E1A2B]">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-5">
          <div className="bg-white p-8 sm:p-10 rounded-xl shadow-card border border-[#E5E2DC] text-center max-w-md w-full">
            <p className="hb-eyebrow justify-center">Inventory Notice</p>
            <h1 className="mt-2 text-[20px] sm:text-[22px] font-bold text-[#0E1A2B]">
              찾으시는 상품 정보가 없습니다.
            </h1>
            <p className="mt-2.5 text-[14px] leading-relaxed text-[#3E4756]">
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
    ? "에어컨류 계약조건별 최대 8개월 무상 보증 (사전 협의 및 계약서 명시 기준)"
    : isMajorApplianceDetail
    ? "주요 가전 계약조건별 최대 4개월 무상 보증 (사전 협의 및 계약서 명시 기준)"
    : "품목 및 거래 계약 조건에 따른 협의 보증 (사전 협의 및 계약서 명시 기준)";
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
          availability: sold
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
          itemCondition: "https://schema.org/UsedCondition",
          warranty: warrantySummary,
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

        <div className="overflow-hidden rounded-xl border border-[#E5E2DC] bg-white shadow-card grid grid-cols-1 lg:grid-cols-12">
          {/* 좌측 7컬럼: 상품 이미지 뷰어 (최근 본 매물 저장을 위해 category, price, modelName, conditionGrade 전달) */}
          <div className="border-b lg:border-b-0 lg:border-r border-[#E5E2DC] lg:col-span-7">
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
                      외관 · 상태 등급
                    </dt>
                    <dd className="font-semibold text-[#0E1A2B] text-right flex items-center justify-end gap-1.5">
                      {product.condition_grade ? (
                        <>
                          <span className="inline-flex items-center rounded bg-[#D9531E]/10 px-1.5 py-0.5 text-[11.5px] font-bold text-[#D9531E]">
                            {product.condition_grade}
                          </span>
                          <span>작동 점검 및 세척 완료</span>
                        </>
                      ) : (
                        <span>작동 점검·세척 완료 (매장 실물 확인 가능)</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2.5">
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

              {/* 3. 주요 사양 및 상태 설명 (통합 구조화 컴포넌트) */}
              <div className="mt-5">
                <ProductStructuredDescription description={product.description} />
              </div>
            </div>

            {/* 4. 인터랙티브 설치 환경 체크리스트 표 + 조건 첨부 상담 동선 */}
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

            {categoryLabel === "에어컨/냉난방기" && (
              <AirconSetGuideBanner variant="card" className="mt-4" />
            )}
          </div>
        </div>

        {/* V2 비주얼 검수 리포트 & 설치 공간 시뮬레이터 (좌우 2컬럼 완벽 대칭 레이아웃) */}
        <section
          aria-label="한밭중고전자 정밀 검수 리포트 및 설치 공간 시뮬레이터"
          className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"
        >
          <V2VisualInspectionViewer
            category={categoryLabel}
            conditionGrade={product.condition_grade}
          />
          <V2SpatialFitPlanner
            title={product.title}
            description={product.description}
          />
        </section>

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
              입고 후 정밀 작동 점검과 세척·클리닝을 마친 제품이며, 사업자 고객님을 위한 세금계산서 발행이 가능합니다. 사후 A/S 보증 기간 및 세부 적용 범위는 품목 특성 및 판매 계약서 약정에 따라 차등 적용됩니다.
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
        {/* [기능 8] 해당 품목 구매·설치 관련 자주 묻는 질문 (FAQ) */}
        <section
          aria-label={`${categoryLabel} 자주 묻는 질문`}
          className="mt-10 rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-7 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E5E2DC]">
            <div>
              <span className="hb-eyebrow">품목별 핵심 안내</span>
              <h2 className="mt-1 text-[18px] sm:text-[20px] font-extrabold text-[#0E1A2B]">
                {categoryLabel} 구매 · 설치 자주 묻는 질문
              </h2>
            </div>
            <Link
              href="/#faq-section"
              className="text-[12.5px] font-bold text-[#646E7E] hover:text-[#0E1A2B] underline underline-offset-4"
            >
              전체 FAQ 보기 →
            </Link>
          </div>
          <dl className="divide-y divide-[#E5E2DC]">
            {getCategoryFaqs(categoryLabel, sold).map((faq) => (
              <div key={faq.q} className="py-4 first:pt-4 last:pb-0">
                <dt className="flex items-start gap-2 text-[14.5px] font-bold text-[#0E1A2B]">
                  <span className="text-[#D9531E] font-extrabold">Q.</span>
                  <span>{faq.q}</span>
                </dt>
                <dd className="mt-1.5 pl-6 text-[13.5px] leading-relaxed text-[#3E4756] break-keep">
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