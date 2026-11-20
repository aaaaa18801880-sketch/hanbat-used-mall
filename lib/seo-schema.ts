// 파일 경로: lib/seo-schema.ts
// SEO · AI 검색(GEO) · Schema.org JSON-LD 단일 출처 빌더 (SSOT)

import {
  STORE,
  STORE_MERCHANT_POLICY,
  getCategoryWarrantyInfo,
} from "./site";
import { REFURBISH_STEPS } from "./refurbish-process";

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

export interface HomeFaqEntry {
  question: string;
  answer: string;
}

const AIRCON_WARRANTY = getCategoryWarrantyInfo("에어컨/냉난방기");
const MAJOR_WARRANTY = getCategoryWarrantyInfo("냉장고");

/**
 * 메인 페이지 FAQPage JSON-LD 및 AI 검색 인용용 핵심 Q&A (실제 매장 운영 기준 SSOT)
 */
export const HOME_SCHEMA_FAQS: readonly HomeFaqEntry[] = [
  {
    question: `${STORE.name} 중고가전 무상 A/S 보증 기간은 얼마인가요?`,
    answer: `에어컨·냉난방기는 ${AIRCON_WARRANTY.compactLabel}, 냉장고·세탁기·업소용 냉장고 등 주요 가전은 ${MAJOR_WARRANTY.compactLabel} 기준을 적용하며, 수령 후 ${STORE_MERCHANT_POLICY.merchantReturnDays}일 이내 초기 기능 이상 시 교환·환불을 지원합니다.`,
  },
  {
    question: "중고가전 구매 전 매장에서 세척과 작동 확인을 거쳐 출고하나요?",
    answer:
      "네. 매입 현장에서 전원과 작동 상태(에어컨은 냉방·가스 누설 여부)를 먼저 확인해 정상 제품만 입고하며, 내·외부 고압세척과 배송 전 전원 연결 작동 점검을 마친 뒤 출고합니다.",
  },
  {
    question: "대전 외에 세종·청주·천안 등 충청권 배송 및 설치도 가능한가요?",
    answer: `네. ${STORE.roadAddress} 직영 매장에서 대전 전 지역은 물론 세종·청주·천안·공주·계룡·논산 등 충청권 직영 기사 배송·설치를 지원하며, 품목에 따라 전국 배송 상담도 가능합니다.`,
  },
  {
    question: "이사 가전이나 식당·카페 폐업 주방설비 방문 매입은 어떻게 신청하나요?",
    answer: `처분할 제품의 정면 사진과 제조년월이 적힌 명판 스티커 사진을 홈페이지 방문 매입 페이지(${STORE.url}/purchase)나 카카오톡·전화(${STORE.mobile})로 보내주시면 사전 시세를 안내하고 방문 수거 후 현장에서 즉시 정산해 드립니다.`,
  },
  {
    question: "사업자 전자세금계산서 발행과 카드 결제가 가능한가요?",
    answer:
      "네. 가정용·업소용 모두 신용카드 결제, 계좌이체, 현금영수증 및 사업자 전자세금계산서 정식 발행을 지원합니다.",
  },
] as const;

export function buildHomeFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${STORE.url}/#faq`,
    mainEntity: HOME_SCHEMA_FAQS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(items: readonly BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path.startsWith("http")
        ? item.path
        : `${STORE.url}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

export function buildBuybackServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${STORE.url}/purchase#service`,
    name: `${STORE.name} 중고가전 · 식당/카페 폐업 설비 방문 매입`,
    serviceType: "중고가전 방문 매입 및 업소용 주방설비 철거·매입",
    description:
      "대전·세종·충청권 가정용 냉장고·세탁기·에어컨 매입부터 식당·카페 폐업 주방설비 일괄 철거·매입까지 직영 차량 방문 수거 후 현장 즉시 현금/계좌 정산합니다.",
    url: `${STORE.url}/purchase`,
    image: `${STORE.url}/images/guide/buyback-appraisal.jpg`,
    provider: {
      "@type": "LocalBusiness",
      "@id": `${STORE.url}/#localbusiness`,
      name: STORE.name,
      telephone: STORE.tel,
      url: STORE.url,
    },
    areaServed: [
      { "@type": "City", name: "대전광역시" },
      { "@type": "City", name: "세종특별자치시" },
      { "@type": "City", name: "청주시" },
      { "@type": "City", name: "천안시" },
      { "@type": "City", name: "공주시" },
      { "@type": "City", name: "계룡시" },
      { "@type": "City", name: "논산시" },
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
      description: "사진 기반 사전 매입 견적 무료 상담 · 방문 수거 후 현장 즉시 정산",
    },
  };
}

/**
 * llms.txt / llms-full.txt용 실제 4단계 현장확인·세척·작동점검·출고 절차 마크다운 (SSOT)
 */
export function buildLlmsProcessMarkdown(): string {
  return REFURBISH_STEPS.map(
    (step) =>
      `${Number(step.stepNumber)}. **${step.shortTitle} (${step.roleLabel})**: ${step.summary}`
  ).join("\n");
}
