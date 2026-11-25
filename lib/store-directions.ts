// 파일 경로: lib/store-directions.ts
// 한밭중고전자 오프라인 매장 오시는 길 약도 경로·랜드마크 단일 출처 (SSOT)

import { STORE, STORE_NAVIGATION } from "./site";

export type DirectionRouteId = "all" | "west" | "east" | "north";

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
    originLabel: "중촌고가도로 밑 · 대전천서로 변",
    summary:
      "중촌고가도로 위로 올라가지 마시고, 고가 하부 측도·대전천서로 방면으로 진입하시면 매장 앞 전용 주차장(8대 · 1톤 상차)으로 바로 들어오실 수 있습니다.",
    steps: [
      "내비게이션에 '한밭중고전자' 또는 '대전천서로 691-62' 검색",
      "중촌고가도로 하부 측도 · 대전천서로 변 진입",
      "1·2층 직영 전시장 앞 전용 주차장 바로 정차",
    ],
    entryCaution: "고가 위 진입 금지 · 하부 측도/대전천서로 이용",
  },
  {
    id: "west",
    shortLabel: "둔산 · 용문",
    originLabel: "서구 둔산동 · 용문동 · 중촌네거리 방면",
    summary:
      "동서대로를 따라 중촌네거리를 지난 뒤 중촌고가도로 위로 올라가지 말고 우측 하부 측도로 내려와 대전천서로 변 매장 앞으로 진입하세요.",
    steps: [
      "용문·둔산 방면에서 동서대로 직진 → 중촌네거리 통과",
      "중촌고가도로 진입 전 우측 하부 측도로 차선 변경",
      "대전천서로 만나기 직전 고가 밑 1·2층 매장 앞 주차장 진입",
    ],
    entryCaution: "중촌네거리 통과 후 우측 하부 측도로 진입",
  },
  {
    id: "east",
    shortLabel: "대전역 · 동구",
    originLabel: "동구 삼성동 · 대전역 · 복합터미널 방면",
    summary:
      "동서대로에서 현암교(대전천)를 건넌 직후 중촌고가도로 위로 올라가지 말고 하부 측도·대전천서로 방면으로 진입해 주세요.",
    steps: [
      "삼성동·대전역 방면에서 동서대로 진입 후 현암교 통과",
      "현암교 건넌 직후 중촌고가도로 하부·대전천서로 방면 진입",
      "대전천서로 변 중촌고가도로 밑 매장 앞 전용 주차장 이용",
    ],
    entryCaution: "현암교 통과 직후 고가 하부 · 대전천서로 진입",
  },
  {
    id: "north",
    shortLabel: "오정동 · 한남대",
    originLabel: "대덕구 오정동 · 한남대 · 북대전 방면",
    summary:
      "대전천서로를 따라 남쪽(선화동·원도심 방면)으로 직진하시면 중촌고가도로 밑 오른편에 한밭중고전자 1·2층 전시장이 바로 보입니다.",
    steps: [
      "오정동·한남대 방면에서 대전천서로 진입 후 남쪽(선화동 방향) 직진",
      "현암교·중촌고가도로 하부 통과 지점 오른편 매장 확인",
      "매장 앞 1톤 화물 진입 가능한 전용 주차장(8대) 바로 정차",
    ],
    entryCaution: "대전천서로 남하 시 중촌고가도로 밑 오른편 위치",
  },
] as const;

export const STORE_DIRECTION_LANDMARKS = [
  {
    label: "핵심 랜드마크",
    value: "중촌고가도로 밑 · 현암교 인근",
  },
  {
    label: "전용 주차 · 상차",
    value: "매장 앞 8대 · 1톤 화물 진입 수월",
  },
  {
    label: "영업시간",
    value: `${STORE.hours} (${STORE.closed})`,
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
    `진입 팁: 중촌고가도로 위로 올라가지 마시고 하부 측도·대전천서로 방면으로 진입해 주세요. (매장 앞 전용 주차 8대 · 1톤 화물 상차 가능)`,
    `영업시간: ${STORE.hours} (${STORE.closed})`,
    `대표전화: ${STORE.tel} / 직통: ${STORE.mobile}`,
    `네이버 지도: ${STORE_NAVIGATION.naverMap}`,
  ].join("\n");
}
