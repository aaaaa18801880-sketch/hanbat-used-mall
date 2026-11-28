// 파일 경로: lib/hero-banners.ts
// 메인 페이지 기획전 히어로 배너 슬라이더 순수 데이터 및 내비게이션 헬퍼 (SSOT 연동)

import { STORE, getCategoryWarrantyInfo } from "./site";

export type HeroBannerAction =
  | { kind: "link"; href: string }
  | { kind: "visitModal" };

export type HeroBannerTheme =
  | "glacial-blue"
  | "champagne-gold"
  | "midnight-navy"
  | "sage-mist"
  | "charcoal-bronze"
  | "store-photo";

export type HeroHeaderTone = "light" | "dark";

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
  theme: HeroBannerTheme;
  /** 상단 투명 오버레이 헤더 연동 대비 톤 (밝은 배너=light, 어두운 배너=dark) */
  headerTone: HeroHeaderTone;
}

const AIRCON_WARRANTY = getCategoryWarrantyInfo("에어컨/냉난방기");
const MAJOR_WARRANTY = getCategoryWarrantyInfo("냉장고");
const OPERATING_YEARS = new Date().getFullYear() - STORE.since;

export const HERO_BANNER_SLIDES: readonly HeroBannerSlide[] = [
  {
    id: "aircon-special",
    eyebrowBrands: ["SAMSUNG", "LG", "CARRIER", "WINIA"],
    headlineTop: "고압세척 · 작동 점검 완료",
    headlineBottom: "중고 에어컨 · 냉난방기 실매물",
    subtitle: `벽걸이·스탠드·천장형까지 ${AIRCON_WARRANTY.compactLabel}으로 안심 설치`,
    ctaLabel: "중고 에어컨 실매물 보기",
    action: {
      kind: "link",
      href: "/gallery?category=%EC%97%90%EC%96%B4%EC%BB%A8%2F%EB%83%89%EB%82%9C%EB%B0%A9%EA%B8%B0",
    },
    imageSrc: "/images/banners/hero-aircon-v3.jpg",
    imageAlt:
      "아이스블루 링 조명 스튜디오 포디움 위에 스탠드 에어컨, 벽걸이 에어컨, 공기청정기, 제습기가 전시된 프로모션 배너",
    theme: "glacial-blue",
    headerTone: "light",
  },
  {
    id: "home-appliances",
    eyebrowBrands: ["삼성전자", "LG전자", "위니아", "대유"],
    headlineTop: "이사 · 입주 준비 끝!",
    headlineBottom: "우리 집 중고 가전 모음",
    subtitle: `중고 냉장고·세탁기·건조기 배송 전 작동 점검 · ${MAJOR_WARRANTY.compactLabel}`,
    ctaLabel: "중고 가정용 가전 모음",
    action: {
      kind: "link",
      href: "/gallery",
    },
    imageSrc: "/images/banners/hero-home-v3.jpg",
    imageAlt:
      "샴페인 골드 아치 스튜디오 포디움에 4도어 냉장고, 워시타워, 김치냉장고, 전자레인지가 배치된 생활가전 프로모션 배너",
    theme: "champagne-gold",
    headerTone: "light",
  },
  {
    id: "commercial-buyback",
    eyebrowBrands: ["대전 · 세종 · 충청권 직영 방문", "당일 현금 정산"],
    headlineTop: "식당·카페 창업부터 폐업까지",
    headlineBottom: "중고 업소용 설비 · 방문 매입",
    subtitle:
      "중고 45박스 냉장고·쇼케이스·제빙기 실매물 판매 및 사진 1장 즉시 매입 견적",
    ctaLabel: "방문 매입 · 창업 견적 신청",
    action: {
      kind: "link",
      href: "/purchase",
    },
    imageSrc: "/images/banners/hero-commercial-v3.jpg",
    imageAlt:
      "미드나잇 네이비 스포트라이트 아래 45박스 스텐 냉장고, 유리 쇼케이스, 제빙기, 테이블냉장고가 배치된 업소용 설비 배너",
    theme: "midnight-navy",
    headerTone: "dark",
  },
  {
    id: "cafe-showcase",
    eyebrowBrands: ["카페 · 디저트 · 베이커리", "업소용 실매물"],
    headlineTop: "카페 · 매장 오픈 필수 설비",
    headlineBottom: "제빙기 · 음료 쇼케이스 모음",
    subtitle:
      "유리 쇼케이스·테이블 냉장고·제빙기 작동 점검 후 대전·충청 직영 배송",
    ctaLabel: "업소용 실매물 보기",
    action: {
      kind: "link",
      href: "/gallery?category=%EC%97%85%EC%86%8C%EC%9A%A9%EA%B8%B0%EA%B8%B0",
    },
    imageSrc: "/images/banners/hero-cafe-v3.jpg",
    imageAlt:
      "세이지 미스트 스튜디오 포디움 위에 유리 음료 쇼케이스, 스텐 테이블 냉장고, 업소용 제빙기가 전시된 카페 창업 프로모션 배너",
    theme: "sage-mist",
    headerTone: "light",
  },
  {
    id: "self-quote-bundle",
    eyebrowBrands: ["가정용 · 업소용 일괄 견적", "PDF 견적서 즉시 저장"],
    headlineTop: "원하는 실매물만 직접 담아",
    headlineBottom: "온라인 셀프견적 · 즉시 상담",
    subtitle:
      "필요한 가전과 설비를 선택해 견적서를 PDF로 저장하고 카톡·문자로 바로 상담하세요",
    ctaLabel: "셀프견적서 작성하기",
    action: {
      kind: "link",
      href: "/quote",
    },
    imageSrc: "/images/banners/hero-bundle-v3.jpg",
    imageAlt:
      "차콜 브론즈 링 조명 아래 4도어 냉장고, 워시타워, 스탠드 에어컨이 함께 배치된 일괄 셀프견적 프로모션 배너",
    theme: "charcoal-bronze",
    headerTone: "dark",
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
    imageSrc: "/images/store-exterior-front.jpg",
    imageAlt: `${STORE.roadAddress}(${STORE.jibunAddress}) ${STORE.name} 1·2층 직영 대형 전시장 및 전용 주차장 외관 전경`,
    theme: "store-photo",
    headerTone: "dark",
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
