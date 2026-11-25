// 파일 경로: lib/store-directions.ts
// 한밭중고전자 오프라인 매장 오시는 길 약도 경로·랜드마크 단일 출처 (SSOT)

import { STORE, STORE_NAVIGATION } from "./site";

export type DirectionRouteId = "all" | "north" | "south";

export interface StoreDirectionRoute {
  id: DirectionRouteId;
  shortLabel: string;
  originLabel: string;
  summary: string;
  steps: readonly string[];
  entryCaution: string;
}

export const STORE_DIRECTION_ROUTES: readonly StoreDirectionRoute[] = [
  {
    id: "all",
    shortLabel: "전체 약도",
    originLabel: "대전천서로 · 주공하나마트 옆 골목 진입",
    summary:
      "대전천서로에서 주공하나마트·중촌동거리미술관 사이 골목 입구로 진입해 중촌사회복지관·백제타운 종합상가 앞 골목길 끝까지 쭉 직진(약 2분)하시면 중촌고가교 밑 한밭중고전자가 바로 나옵니다.",
    steps: [
      "내비게이션에 '한밭중고전자' 또는 '대전천서로 691-62' 검색",
      "대전천서로 주공하나마트(중촌주공2단지) 남측 골목 입구로 진입",
      "중촌사회복지관·대전선 옆 골목 끝까지 직진(약 2분) → 중촌고가교 밑 매장 도착",
    ],
    entryCaution: "주공하나마트 옆 골목 입구 진입 후 끝까지 직진",
  },
  {
    id: "north",
    shortLabel: "한남로 · 오정동",
    originLabel: "한남로 · 오정동 · 대덕구청 방면 (우회전 진입)",
    summary:
      "한남로에서 대전천서로(남쪽)로 내려오다 중촌주공2단지·주공하나마트 직후 골목 입구에서 우회전해 중촌사회복지관·백제타운 앞 끝까지 쭉 직진(약 2분)해 주세요.",
    steps: [
      "한남로·오정동 방면에서 대전천서로로 진입해 남쪽(선화동 방향) 직진",
      "중촌주공2단지아파트·주공하나마트를 지나자마자 오른쪽 골목으로 우회전",
      "중촌사회복지관·대전선 옆 골목 끝까지 직진 → 중촌고가교 밑 전용 주차장 도착",
    ],
    entryCaution: "주공하나마트 직후 우회전 → 골목 끝까지 직진",
  },
  {
    id: "south",
    shortLabel: "선화동 · 중앙로",
    originLabel: "선화동 · 중앙로 방면 (대전천서로 북상 · 좌회전 진입)",
    summary:
      "대전천서로를 따라 북쪽으로 올라오다 중촌동거리미술관을 지나 주공하나마트 직전 골목 입구에서 좌회전 후 중촌고가교 밑 끝까지 쭉 직진해 주세요.",
    steps: [
      "선화동·중앙로 방면에서 대전천서로 진입 후 북쪽(한남로 방향) 직진",
      "중촌동거리미술관 직후, 주공하나마트 앞 골목 입구에서 좌회전",
      "중촌사회복지관·대전선 옆 골목 끝까지 직진 → 중촌고가교 밑 전용 주차장 도착",
    ],
    entryCaution: "중촌동거리미술관·주공하나마트 사이 골목 좌회전 후 직진",
  },
] as const;

export const STORE_DIRECTION_LANDMARKS = [
  {
    label: "핵심 진입 지점",
    value: "주공하나마트 옆 골목 입구 (끝까지 직진 약 2분)",
  },
  {
    label: "전용 주차 · 상차",
    value: "중촌고가교 밑 매장 앞 8대 · 1톤 화물 상차",
  },
  {
    label: "영업시간",
    value: `${STORE.hours} (${STORE.closed})`,
  },
] as const;

export interface StoreDirectionPhotoStep {
  stepNumber: string;
  title: string;
  shortCaption: string;
  detailCaption: string;
  imageSrc: string;
  imageAlt: string;
}

/**
 * 처음 방문하는 고객을 위한 실제 골목 진입 3단계 실사 사진 안내 (SSOT)
 */
export const STORE_DIRECTION_PHOTO_STEPS: readonly StoreDirectionPhotoStep[] = [
  {
    stepNumber: "01",
    title: "철교(4.5m) 직전 골목 진입",
    shortCaption: "통과제한높이(4.5m) 다리 바로 앞 횡단보도 우측 진입",
    detailCaption:
      "대전천서로 주공하나마트를 지나 '통과 제한 높이 4.5m' 철교 밑으로 들어가기 바로 직전, 횡단보도 옆 골목길로 우회전(선화동 방면은 좌회전)해 들어오세요.",
    imageSrc: "/images/directions/step-1-alley-entrance-3d.jpg",
    imageAlt:
      "대전천서로 통과 제한 높이 4.5m 철교 직전 한밭중고전자 방향 골목 진입 입구 실사 사진",
  },
  {
    stepNumber: "02",
    title: "골목길 끝까지 직진",
    shortCaption: "정면 초록색 중촌고가교·파란 간판 보고 쭉 직진",
    detailCaption:
      "철길 옆 골목길을 따라 약 2분 정도 끝까지 직진하시면 정면에 초록색 중촌고가교와 오른쪽 파란색 '한밭중고전자 · 한밭에어컨' 간판이 보입니다.",
    imageSrc: "/images/directions/step-2-alley-straight-3d.jpg",
    imageAlt:
      "한밭중고전자 진입 골목길 직진 구간에서 정면 중촌고가교와 매장 간판이 보이는 실사 사진",
  },
  {
    stepNumber: "03",
    title: "중촌고가교 밑 매장 도착",
    shortCaption: "고가교 바로 옆 1·2층 직영 전시장 · 전용 주차장",
    detailCaption:
      "골목 끝에 다다르면 초록색 중촌고가교 바로 옆에 1·2층 한밭중고전자 직영 전시장과 넓은 전용 주차장(8대 · 1톤 화물 상차 가능)이 바로 나옵니다.",
    imageSrc: "/images/directions/step-3-store-arrival-3d.jpg",
    imageAlt:
      "중촌고가교 바로 밑 한밭중고전자 1·2층 직영 전시장과 매장 앞 전용 주차장 도착 실사 사진",
  },
] as const;

export function getStoreDirectionRoute(
  id?: string | null
): StoreDirectionRoute {
  return (
    STORE_DIRECTION_ROUTES.find((route) => route.id === id) ??
    STORE_DIRECTION_ROUTES[0]
  );
}

/**
 * 카카오톡·문자 등으로 고객에게 바로 전달할 수 있는 오시는 길 안내 문구를 생성합니다.
 */
export function buildStoreDirectionsShareText(): string {
  return [
    `[${STORE.name} 오시는 길 안내]`,
    `도로명: ${STORE.roadAddress}`,
    `지번: ${STORE.jibunAddress} (${STORE.addressNote})`,
    `진입 팁: 대전천서로 주공하나마트(중촌주공2단지) 옆 골목 입구로 들어오신 뒤 중촌사회복지관·백제타운 앞 골목 끝까지 쭉 직진(약 2분)하시면 중촌고가교 밑 매장이 나옵니다. (전용 주차 8대 · 1톤 화물 상차 가능)`,
    `영업시간: ${STORE.hours} (${STORE.closed})`,
    `대표전화: ${STORE.tel} / 직통: ${STORE.mobile}`,
    `네이버 지도: ${STORE_NAVIGATION.naverMap}`,
  ].join("\n");
}
