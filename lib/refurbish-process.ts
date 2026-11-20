// 파일 경로: lib/refurbish-process.ts
// 매장 실제 현장확인·고압세척·작동점검·직배송 4단계 공정 단일 출처 데이터 (SSOT)

import {
  STORE,
  STORE_MERCHANT_POLICY,
  getCategoryWarrantyInfo,
} from "./site";

export type RefurbishStepId = "intake" | "wash" | "precheck" | "delivery";

export interface RefurbishMetric {
  label: string;
  value: string;
  note: string;
  tone?: "default" | "brand" | "teal" | "cyan";
}

export interface RefurbishStep {
  id: RefurbishStepId;
  stepNumber: string;
  shortTitle: string;
  tabLabel: string;
  roleLabel: string;
  headline: string;
  summary: string;
  imageSrc: string;
  imageAlt: string;
  imageCaption: string;
  focusTag: string;
  metrics: readonly [RefurbishMetric, RefurbishMetric, RefurbishMetric];
  checkItems: readonly [string, string, string];
  warrantyScopeLabel: string;
  warrantyScopeDetail: string;
  targetCategoryHref: string;
  targetCategoryCta: string;
}

const AIRCON_WARRANTY = getCategoryWarrantyInfo("에어컨/냉난방기");
const MAJOR_WARRANTY = getCategoryWarrantyInfo("냉장고");

export const REFURBISH_STEPS: readonly RefurbishStep[] = [
  {
    id: "intake",
    stepNumber: "01",
    shortTitle: "현장 확인·입고",
    tabLabel: "01. 현장 확인·입고",
    roleLabel: "방문 현장 검수",
    headline: "매입 현장에서 직접 작동 상태와 고장·가스 누설을 확인하고 가져옵니다",
    summary:
      "가정집이나 업소 매입 현장에서 전원을 직접 켜 보고 작동이 원활한지, 고장이나 이상 소음이 없는지 먼저 살핍니다. 특히 에어컨은 현장에서 냉방 작동 상태와 가스 누설 여부를 확인한 뒤 정상 제품만 수거해 입고합니다.",
    imageSrc: "/images/field-intake-check.jpg",
    imageAlt: `${STORE.name} 방문 매입 현장에서 에어컨 냉방 작동 상태를 직접 확인하는 모습`,
    imageCaption: "매입 현장에서 전원·냉방 작동 상태 및 이상 유무 직접 확인",
    focusTag: "현장 작동 확인 · 고장·가스 누설 점검",
    metrics: [
      {
        label: "현장 1차 확인",
        value: "작동·고장 여부",
        note: "매입 현장에서 직접 구동 확인 후 수거",
        tone: "teal",
      },
      {
        label: "에어컨 현장 점검",
        value: "냉방·가스 누설",
        note: "현장에서 냉방 상태 및 가스 누설 여부 확인",
        tone: "cyan",
      },
      {
        label: "에어컨 취급 원칙",
        value: "1:1 정품 세트",
        note: "실내기·실외기 세트로만 정상 취급",
        tone: "brand",
      },
    ],
    checkItems: [
      "방문 매입 현장에서 전원을 켜고 작동이 원활한지, 고장이나 이상 소음이 없는지 직접 확인",
      "에어컨·냉난방기는 현장에서 냉방 작동과 가스 누설 여부를 살핀 뒤 정상 제품만 입고",
      "모델명·주요 사양과 실물 외관을 현장에서 확인하고 그대로 안내",
    ],
    warrantyScopeLabel: "현장 확인 통과 제품만 입고",
    warrantyScopeDetail:
      "현장에서 고장이 확인되거나 작동이 원활하지 않은 제품은 수거·판매 대상에서 제외합니다.",
    targetCategoryHref: "/gallery",
    targetCategoryCta: "현장 확인 전체 실매물 보기",
  },
  {
    id: "wash",
    stepNumber: "02",
    shortTitle: "고압세척·위생 정리",
    tabLabel: "02. 고압세척·위생 정리",
    roleLabel: "내·외부 클리닝",
    headline: "내·외부 먼지와 물때를 고압세척으로 깔끔하게 정리해 준비합니다",
    summary:
      "받으신 뒤 별도로 청소하실 부담이 없도록 에어컨 필터·열교환기 먼지, 세탁기 내부와 거름망, 냉장고 선반과 도어 패킹, 업소용 주방설비의 기름때를 고압세척과 꼼꼼한 클리닝으로 정리합니다.",
    imageSrc: "/images/guide/washer-inspection-parts.jpg",
    imageAlt: `${STORE.name} 세탁기 및 가전 내·외부 고압세척 및 위생 정리`,
    imageCaption: "가정용·업소용 가전 내·외부 고압세척 및 클리닝 정리",
    focusTag: "고압세척 · 내·외부 오염 제거",
    metrics: [
      {
        label: "세척 공정",
        value: "고압세척 정리",
        note: "열교환기·필터·세탁조·외관 찌든 때 제거",
        tone: "cyan",
      },
      {
        label: "위생 관리 부위",
        value: "선반·패킹·거름망",
        note: "냉장고 내부·도어 고무패킹·배수망 정리",
        tone: "teal",
      },
      {
        label: "업소용 설비",
        value: "유분·물때 세척",
        note: "식당·카페 바로 투입 가능하게 깔끔 마감",
        tone: "default",
      },
    ],
    checkItems: [
      "에어컨 필터·열교환기 먼지 및 외관 오염 고압세척 정리",
      "냉장고 선반·야채칸·도어 고무 패킹과 세탁기 거름망·내부 물때 세척",
      "업소용 45박스·쇼케이스·제빙기 등 주방 기름때 및 내부 위생 정리",
    ],
    warrantyScopeLabel: "바로 사용할 수 있는 출고 상태",
    warrantyScopeDetail:
      "가정 입주 가전과 업소용 설비 모두 설치 후 바로 사용하실 수 있게 정리해 출고합니다.",
    targetCategoryHref:
      "/gallery?category=%EC%84%B8%ED%83%81%EA%B8%B0%2F%EA%B1%B4%EC%A1%B0%EA%B8%B0",
    targetCategoryCta: "세척 완료 세탁기·건조기 보기",
  },
  {
    id: "precheck",
    stepNumber: "03",
    shortTitle: "배송 전 작동 점검",
    tabLabel: "03. 배송 전 작동 점검",
    roleLabel: "출고 직전 확인",
    headline: "배송·출고 전에 직접 돌려보며 정상 작동 여부를 한 번 더 확인합니다",
    summary:
      "고객님께 전달해 드리기 전 전원을 연결해 실제로 작동시켜 보며 이상이 없는지 다시 점검합니다. 냉장·냉동 냉기, 세탁기 급·배수와 탈수, 에어컨 냉방 등 핵심 기능을 확인한 뒤 출고합니다.",
    imageSrc: "/images/guide/fridge-warm-check.jpg",
    imageAlt: `${STORE.name} 배송 전 냉장고 냉각 및 주요 기능 작동 점검`,
    imageCaption: "배송·출고 전 전원 연결 및 냉각·탈수·배수 작동 확인",
    focusTag: "출고 전 실작동 확인 · 기능 점검",
    metrics: [
      {
        label: "냉장·냉동고",
        value: "냉기 도달 확인",
        note: "출고 전 전원 연결 후 냉장·냉동 작동 점검",
        tone: "cyan",
      },
      {
        label: "세탁·건조기",
        value: "급배수·탈수 확인",
        note: "세탁·탈수 구동 및 누수·에러 여부 확인",
        tone: "teal",
      },
      {
        label: "에어컨·업소용",
        value: "냉방·구동 확인",
        note: "실외기 작동 및 가스 상태 출고 전 재확인",
        tone: "brand",
      },
    ],
    checkItems: [
      "냉장고·업소용 냉장고 출고 전 전원 연결 후 냉장·냉동 냉기 작동 확인",
      "세탁기 급수·배수·탈수 구동 및 이상 소음·에러 발생 여부 확인",
      "에어컨·제빙기·쇼케이스 등 주요 기능 정상 작동 확인 후 상차 출고",
    ],
    warrantyScopeLabel: "출고 전 이중 확인 원칙",
    warrantyScopeDetail:
      "현장 확인에 더해 배송 나가기 전 작동 상태를 다시 한 번 확인해 초기 불량을 줄입니다.",
    targetCategoryHref: "/gallery?category=%EB%83%89%EC%9E%A5%EA%B3%A0",
    targetCategoryCta: "점검 완료 냉장고 실매물 보기",
  },
  {
    id: "delivery",
    stepNumber: "04",
    shortTitle: "직배송·설치·A/S",
    tabLabel: "04. 직배송·설치·A/S",
    roleLabel: "직영 배송 · 사후 관리",
    headline: "직영 기사가 배송·설치하고 사용 중 문제 시 무상 A/S를 지원합니다",
    summary:
      "매장 직영 기사가 직접 운반해 수평·기본 설치까지 마무리해 드립니다. 에어컨류와 주요 가전은 안내된 무상 보증 기간 동안 방문 점검·수리를 지원하며, 사업자 전자세금계산서 발행도 가능합니다.",
    imageSrc: "/store-exterior.jpg",
    imageAlt: `${STORE.name} ${STORE.jibunAddress} 1·2층 직영 전시장 및 배송 출고 현장`,
    imageCaption: `${STORE.name} ${STORE.jibunAddress} 직영 전시장 · 충청권 직배송`,
    focusTag: "직영 배송·설치 · 사후 A/S 보증",
    metrics: [
      {
        label: "에어컨·냉난방기",
        value: AIRCON_WARRANTY.compactLabel,
        note: "직영 기사 방문 점검·수리 지원",
        tone: "brand",
      },
      {
        label: "냉장·세탁 주요가전",
        value: MAJOR_WARRANTY.compactLabel,
        note: "정상 사용 중 기능 이상 시 무상 A/S",
        tone: "teal",
      },
      {
        label: "초기 불량·증빙",
        value: `${STORE_MERCHANT_POLICY.merchantReturnDays}일 교환·환불`,
        note: "카드·현금영수증·전자세금계산서 발행",
        tone: "default",
      },
    ],
    checkItems: [
      "대전·세종·충청권 직영 기사 직접 운반 및 수평·기본 설치 지원",
      `사용 중 이상 발생 시 대표전화(${STORE.tel}) 접수 후 직영 A/S 방문 점검`,
      "계좌이체·신용카드·현금영수증·사업자 전자세금계산서 정식 발행 지원",
    ],
    warrantyScopeLabel: `${STORE.name} 직영 책임 판매`,
    warrantyScopeDetail: `${STORE.roadAddress} 직영 전시장 실물 확인 및 충청권 당일·지정일 직배송`,
    targetCategoryHref: "/gallery",
    targetCategoryCta: "판매 중인 전체 실매물 확인",
  },
] as const;

export function getRefurbishStepById(id: RefurbishStepId): RefurbishStep {
  return REFURBISH_STEPS.find((step) => step.id === id) ?? REFURBISH_STEPS[0];
}

export function getAdjacentRefurbishStepId(
  currentId: RefurbishStepId,
  delta: 1 | -1
): RefurbishStepId {
  const index = REFURBISH_STEPS.findIndex((step) => step.id === currentId);
  const safeIndex = index < 0 ? 0 : index;
  const nextIndex =
    (safeIndex + delta + REFURBISH_STEPS.length) % REFURBISH_STEPS.length;
  return REFURBISH_STEPS[nextIndex].id;
}
