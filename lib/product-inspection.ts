// 파일 경로: lib/product-inspection.ts
import {
  getCategoryWarrantyInfo,
  normalizeProductCategory,
  STORE,
} from "./site";

export interface BuyerConcernItem {
  no: string;
  question: string;
  answerTitle: string;
  badge: string;
  tone: "cyan" | "teal" | "orange";
  desc: string;
  guide: {
    slug: string;
    label: string;
  };
}

export const INSPECTION_SUMMARY_SUBTITLE =
  "현장 작동 확인 → 입고 고압세척 → 배송 전 작동 점검을 마친 실매물입니다.";

/**
 * 상품 상세 페이지 품목별 핵심 우려 해소·점검 안내 SSOT
 * (실제 매장 운영 사실 기준 — 과장 문구 배제, lib/site.ts 보증 정책 연동)
 */
export function getBuyerConcernItems(
  categoryRaw?: string | null
): BuyerConcernItem[] {
  const cat = normalizeProductCategory(categoryRaw);

  if (cat === "에어컨/냉난방기") {
    const warranty = getCategoryWarrantyInfo("에어컨/냉난방기").compactLabel;
    return [
      {
        no: "01",
        question: "찬바람이 약하거나 냉매 가스가 새진 않나요?",
        answerTitle: "현장 가스 누설 확인 및 배송 전 냉방 작동 점검 완료",
        badge: "냉난방 작동 점검",
        tone: "cyan",
        desc: "입고 전 현장에서 가스 누설 여부와 냉방 작동 상태를 확인하고, 배송 전에도 전원·풍량·냉기 출력을 다시 점검해 정상 제품만 출고합니다.",
        guide: {
          slug: "aircon-refrigerant-annual-recharge-myth",
          label: "매년 가스 충전 오해 vs 냉매 누설 진단 보기",
        },
      },
      {
        no: "02",
        question: "남이 쓰던 거라 안에서 곰팡이 냄새가 나진 않을까요?",
        answerTitle: "필터·커버·열교환기 고압세척 및 오염 제거 완료",
        badge: "고압세척 완료",
        tone: "teal",
        desc: "입고 후 필터와 전면부, 내부 먼지와 묵은 오염을 고압세척으로 정리해 쾌적하게 바로 사용하실 수 있는 상태로 출고합니다.",
        guide: {
          slug: "aircon-indoor-water-leak-causes",
          label: "곰팡이 냄새·누수 원인 및 세척 관리 보기",
        },
      },
      {
        no: "03",
        question: "설치하고 얼마 안 돼서 고장 나면 수리비가 들지 않나요?",
        answerTitle: `개인 직거래와 다른 ${warranty} 책임 보증`,
        badge: warranty,
        tone: "orange",
        desc: "정상 사용 중 기기 기능 불량(콤프레샤·기판·냉매 누설 등) 발생 시 매장 담당 기사가 직접 방문 수리 또는 동급 제품으로 교환해 드립니다.",
        guide: {
          slug: "why-used-over-new-and-store-over-p2p",
          label: "개인 직거래 vs 직영 매장 보증 차이 비교",
        },
      },
      {
        no: "04",
        question: "구매하면 어떤 구성품이 오고, 설치는 누가 해주나요?",
        answerTitle: "실내기 + 전용 실외기 + 리모컨 세트 & 전문 기사 시공",
        badge: "풀세트 · 직영 시공",
        tone: "cyan",
        desc: "호환 문제없는 실내기·실외기 1:1 세트와 작동 확인된 리모컨을 함께 준비하며, 직영 시공팀이 현장 여건에 맞춰 직접 설치해 드립니다.",
        guide: {
          slug: "aircon-pipe-reuse-aluminum-vs-copper",
          label: "동배관 vs 알루미늄 배관·설치 기준 확인",
        },
      },
    ];
  }

  if (cat === "업소용기기") {
    const warranty = getCategoryWarrantyInfo("업소용기기").compactLabel;
    return [
      {
        no: "01",
        question: "영업장에 쓸 건데 냉동·냉장 온도가 안 떨어지면 어떡하죠?",
        answerTitle: "배송 전 설정 온도 도달 및 냉각·방열 작동 점검 완료",
        badge: "냉각 작동 점검",
        tone: "cyan",
        desc: "식자재를 보관하는 업소용 설비 특성상 배송 전 전원을 인가해 냉장·냉동 온도 하강과 콤프레샤·방열팬 작동 이상 유무를 확인합니다.",
        guide: {
          slug: "commercial-45box-direct-vs-fan-cooling",
          label: "업소용 직냉식 vs 간냉식 냉각 차이 보기",
        },
      },
      {
        no: "02",
        question: "이전 가게 기름때나 음식물 냄새가 배어 있진 않나요?",
        answerTitle: "내부 스텐 선반·배수로·응축기 먼지망 고압세척 완료",
        badge: "내·외부 고압세척",
        tone: "teal",
        desc: "내부 스테인리스 벽면과 선반, 바닥 배수로, 그리고 고장 원인이 되는 응축기(콘덴서) 먼지망까지 전용 세제와 고압세척으로 정리합니다.",
        guide: {
          slug: "commercial-fridge-condenser-cleaning",
          label: "업소용 응축기 청소 및 고장 예방법 보기",
        },
      },
      {
        no: "03",
        question: "중고 주방기기도 세금계산서 발행과 무상 A/S가 되나요?",
        answerTitle: `전자세금계산서 100% 발행 & ${warranty}`,
        badge: "세금계산서 · 무상 A/S",
        tone: "orange",
        desc: "창업 비용 처리를 위한 전자세금계산서·카드결제·현금영수증을 모두 지원하며, 업소용 주방설비 보증·A/S 기준을 명확히 안내해 드립니다.",
        guide: {
          slug: "startup-closure-docs-and-power",
          label: "창업 시 사업자 증빙·전기 확인 가이드",
        },
      },
      {
        no: "04",
        question: "무거운 업소용 장비를 매장 안까지 어떻게 옮기나요?",
        answerTitle: "직영 기사 직접 운반 · 주방 배치 · 수평 및 전원 확인",
        badge: "직배송 · 현장 안착",
        tone: "teal",
        desc: `용달차를 따로 부르실 필요 없이 ${STORE.name} 배송팀이 매장 주방 원하시는 자리까지 반입하여 수평 조절과 전원 작동 확인까지 마쳐 드립니다.`,
        guide: {
          slug: "compressor-appliance-clearance-heat-dissipation",
          label: "업소 주방 벽면 방열 간격·배치 기준 보기",
        },
      },
    ];
  }

  const warranty = getCategoryWarrantyInfo("냉장고").compactLabel;
  return [
    {
      no: "01",
      question: "중고 냉장고·세탁기인데 소음이 심하거나 작동이 안 되면요?",
      answerTitle: "현장 확인 및 배송 전 냉각·급배수·탈수 작동 점검 완료",
      badge: "배송 전 작동 점검",
      tone: "cyan",
      desc: "냉장·냉동 냉각 상태와 세탁·헹굼·탈수 시 소음·진동·누수 여부를 배송 전에 직접 전원을 연결해 확인한 뒤 출고합니다.",
      guide: {
        slug: "why-never-lay-fridge-flat-moving",
        label: "콤프레셔 가전 수직 운반·작동 원리 보기",
      },
    },
    {
      no: "02",
      question: "남이 쓰던 가전이라 내부 위생 상태가 제일 걱정돼요.",
      answerTitle: "선반·서랍·도어패킹 및 내·외부 고압세척 정리 완료",
      badge: "내·외부 세척 완료",
      tone: "teal",
      desc: "분리 가능한 선반과 서랍, 도어 고무패킹과 외관 오염까지 고압세척으로 깨끗하게 정리해 받으신 즉시 사용하실 수 있습니다.",
      guide: {
        slug: "fridge-washer-gasket-mold-cleaning-safety",
        label: "고무패킹·세탁조 위생 관리 기준 보기",
      },
    },
    {
      no: "03",
      question: "사서 쓰다가 고장 나면 개인 직거래처럼 내 돈으로 고쳐야 하나요?",
      answerTitle: `주요 가정용 가전 ${warranty}`,
      badge: warranty,
      tone: "orange",
      desc: "개인 중고거래의 가장 큰 불안인 '거래 직후 고장' 걱정을 덜어드리도록, 보증 기간 내 기능 불량 발생 시 무상 수리 또는 동급 교환을 지원합니다.",
      guide: {
        slug: "why-used-over-new-and-store-over-p2p",
        label: "개인 직거래 vs 직영 매장 보증 비교",
      },
    },
    {
      no: "04",
      question: "무거운 가전 운반과 기존에 쓰던 고장 난 가전 처리는요?",
      answerTitle: "직영 기사 직접 배송·수평 설치 & 기존 가전 동시 수거",
      badge: "배송·수거 동시 진행",
      tone: "teal",
      desc: "설치 자리에 맞춰 수평과 급·배수 호스까지 연결해 드리며, 쓰시던 기존 가전 보상매입(차액 차감)이나 폐가전 동시 수거도 함께 진행해 드립니다.",
      guide: {
        slug: "ladder-truck-and-clearance",
        label: "현관문 폭·계단 반입·사다리차 기준 보기",
      },
    },
  ];
}
