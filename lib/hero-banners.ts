// 파일 경로: lib/hero-banners.ts
// 메인 페이지 기획전 히어로 배너 슬라이더 순수 데이터 및 내비게이션 헬퍼 (SSOT 연동)

import { STORE, getCategoryWarrantyInfo } from "./site";

export type HeroBannerAction =
  | { kind: "link"; href: string }
  | { kind: "visitModal" };

export interface HeroBannerSlide {
  id: string;
  eyebrowBrands: readonly string[];
  headlineTop: string;
  headlineBottom: string;
  subtitle: string;
  ctaLabel: string;
  action: HeroBannerAction;
  imageSrc: string;
  imageAlt: string;
  /** 배너 바탕 및 좌측 텍스트 보호 그라데이션 톤 */
  theme: "glacial-blue" | "champagne-gold" | "midnight-navy" | "store-photo";
}

const AIRCON_WARRANTY = getCategoryWarrantyInfo("에어컨/냉난방기");
const MAJOR_WARRANTY = getCategoryWarrantyInfo("냉장고");
const OPERATING_YEARS = new Date().getFullYear() - STORE.since;

export const HERO_BANNER_SLIDES: readonly HeroBannerSlide[] = [
  {
    id: "aircon-special",
    eyebrowBrands: ["SAMSUNG", "LG", "CARRIER", "WINIA"],
    headlineTop: "고압세척 · 작동 점검 완료",
    headlineBottom: "에어컨 · 냉난방기 실매물",
    subtitle: `벽걸이·스탠드·천장형까지 ${AIRCON_WARRANTY.compactLabel}으로 안심 설치`,
    ctaLabel: "에어컨 인기 실매물 보기",
    action: {
      kind: "link",
      href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
    },
    imageSrc: "/images/banners/hero-aircon-v2.jpg",
    imageAlt:
      "아이스블루 링 조명 스튜디오 포디움 위에 스탠드 에어컨, 벽걸이 에어컨, 공기청정기, 제습기가 전시된 프로모션 배너",
    theme: "glacial-blue",
  },
  {
    id: "home-appliances",
    eyebrowBrands: ["삼성전자", "LG전자", "위니아", "대유"],
    headlineTop: "이사 · 입주 준비 끝!",
    headlineBottom: "우리 집 검증 가전 모음",
    subtitle: `냉장고·세탁기·건조기까지 배송 전 작동 점검 · ${MAJOR_WARRANTY.compactLabel}`,
    ctaLabel: "가정용 인기 가전 모음",
    action: {
      kind: "link",
      href: "/gallery",
    },
    imageSrc: "/images/banners/hero-home-v2.jpg",
    imageAlt:
      "샴페인 골드 아치 스튜디오 포디움에 4도어 냉장고, 워시타워, 김치냉장고, 전자레인지가 배치된 생활가전 프로모션 배너",
    theme: "champagne-gold",
  },
  {
    id: "commercial-buyback",
    eyebrowBrands: ["대전 · 세종 · 충청권 직영 방문", "당일 현금 정산"],
    headlineTop: "식당·카페 창업부터 폐업까지",
    headlineBottom: "업소용 설비 · 방문 매입",
    subtitle:
      "45박스 냉장고·쇼케이스·제빙기 실매물 판매 및 사진 1장 즉시 매입 견적",
    ctaLabel: "방문 매입 · 창업 견적 신청",
    action: {
      kind: "link",
      href: "/purchase",
    },
    imageSrc: "/images/banners/hero-commercial-v2.jpg",
    imageAlt:
      "미드나잇 네이비 스포트라이트 아래 45박스 스텐 냉장고, 유리 쇼케이스, 제빙기, 테이블냉장고가 배치된 업소용 설비 배너",
    theme: "midnight-navy",
  },
  {
    id: "direct-showroom",
    eyebrowBrands: [`SINCE ${STORE.since}`, `${OPERATING_YEARS}년 직영 매장`],
    headlineTop: "직접 눈으로 보고 고르는",
    headlineBottom: `${STORE.name} 중촌동 쇼룸`,
    subtitle: `${STORE.roadAddress} · 매장 앞 8대 전용 주차 · 당일 직영 배송`,
    ctaLabel: "오시는 길 · 주차 안내",
    action: {
      kind: "visitModal",
    },
    imageSrc: "/store-exterior.jpg",
    imageAlt: `${STORE.roadAddress}(${STORE.jibunAddress}) ${STORE.name} 1·2층 직영 대형 전시장 및 전용 주차장 실물 외관 전경`,
    theme: "store-photo",
  },
] as const;

export function getWrappedBannerIndex(
  currentIndex: number,
  delta: number,
  total: number
): number {
  if (total <= 0) return 0;
  const normalized = ((currentIndex + delta) % total + total) % total;
  return normalized;
}
