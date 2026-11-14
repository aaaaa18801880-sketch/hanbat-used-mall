"use client";

import { useState } from "react";
import { STORE } from "../../lib/site";
import { SafeImg } from "../../lib/ui";

type HotspotTone = "red" | "orange" | "blue" | "teal" | "slate";

const TONE_STYLES: Record<
  HotspotTone,
  {
    accentBg: string;
    accentBorder: string;
    accentText: string;
    cardBg: string;
    ringClass: string;
  }
> = {
  red: {
    accentBg: "bg-[#DC2626]",
    accentBorder: "border-[#DC2626]",
    accentText: "text-[#DC2626]",
    cardBg: "bg-[#FEF2F2]",
    ringClass: "ring-[#DC2626]",
  },
  orange: {
    accentBg: "bg-[#E8521A]",
    accentBorder: "border-[#E8521A]",
    accentText: "text-[#C84312]",
    cardBg: "bg-[#FFF7ED]",
    ringClass: "ring-[#E8521A]",
  },
  blue: {
    accentBg: "bg-[#1D4ED8]",
    accentBorder: "border-[#1D4ED8]",
    accentText: "text-[#1D4ED8]",
    cardBg: "bg-[#EFF6FF]",
    ringClass: "ring-[#1D4ED8]",
  },
  teal: {
    accentBg: "bg-[#0F766E]",
    accentBorder: "border-[#0F766E]",
    accentText: "text-[#0F766E]",
    cardBg: "bg-[#ECFDF5]",
    ringClass: "ring-[#0F766E]",
  },
  slate: {
    accentBg: "bg-[#141A23]",
    accentBorder: "border-[#141A23]",
    accentText: "text-[#141A23]",
    cardBg: "bg-[#F8FAFC]",
    ringClass: "ring-[#141A23]",
  },
};

export interface PhotoHotspotItem {
  id: string;
  num: string;
  partName: string;
  title: string;
  details: [string, string];
  verdict: string;
  pinLeft: string;
  pinTop: string;
  boxLeft: string;
  boxTop: string;
  boxWidth: string;
  boxHeight: string;
  tone: HotspotTone;
}

function PhotoHotspotDiagram({
  src,
  alt,
  spots,
}: {
  src: string;
  alt: string;
  spots: readonly PhotoHotspotItem[];
}) {
  const [lockedId, setLockedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeId = hoveredId ?? lockedId;

  const toggleZone = (id: string) => {
    setLockedId((prev) => (prev === id ? null : id));
  };

  const gridClass =
    spots.length === 3
      ? "grid grid-cols-1 md:grid-cols-3 gap-2.5"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5";

  return (
    <div className="space-y-3.5">
      {/* 상단: 무문자 실물 기술 사진 + 정밀 좌표 핀 오버레이 */}
      <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-[#CBD5E1] bg-[#0F172A]">
        <SafeImg
          src={src}
          alt={alt}
          width={1376}
          height={768}
          eager
          className="h-full w-full object-cover block select-none"
        />

        <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-md bg-[#0F172A]/80 px-2 py-1 text-hb-xs font-medium text-white">
          ※ 이해를 돕기 위한 예시 이미지 · 번호 클릭 시 구역 강조
        </span>

        {spots.map((spot) => {
          const style = TONE_STYLES[spot.tone];
          const isActive = activeId === spot.id;
          const isDimmed = activeId !== null && !isActive;

          return (
            <div key={spot.id}>
              <div
                aria-hidden="true"
                style={{
                  left: spot.boxLeft,
                  top: spot.boxTop,
                  width: spot.boxWidth,
                  height: spot.boxHeight,
                }}
                className={`pointer-events-none absolute rounded-lg border-2 transition-all duration-200 ${
                  isActive
                    ? `${style.accentBorder} bg-white/15 shadow-lg opacity-100`
                    : isDimmed
                      ? "border-white/25 bg-transparent opacity-30"
                      : "border-white/60 border-dashed bg-transparent opacity-80"
                }`}
              />

              <button
                type="button"
                onClick={() => toggleZone(spot.id)}
                onMouseEnter={() => setHoveredId(spot.id)}
                onMouseLeave={() => setHoveredId(null)}
                aria-pressed={lockedId === spot.id}
                aria-label={`${spot.partName} — ${spot.title}`}
                style={{ left: spot.pinLeft, top: spot.pinTop }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full border-2 border-white font-mono text-hb-xs font-extrabold text-white shadow-md transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  style.accentBg
                } ${isActive ? "h-8 w-8 sm:h-9 sm:w-9 scale-110 z-20" : "h-7 w-7 sm:h-8 sm:w-8 z-10 hover:scale-110"}`}
              >
                {spot.num}
              </button>
            </div>
          );
        })}
      </div>

      {/* 하단: 사진 위 01~04 핀과 1:1 매칭되는 진단 카드 */}
      <div className={gridClass}>
        {spots.map((spot) => {
          const style = TONE_STYLES[spot.tone];
          const isActive = activeId === spot.id;

          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => toggleZone(spot.id)}
              onMouseEnter={() => setHoveredId(spot.id)}
              onMouseLeave={() => setHoveredId(null)}
              aria-pressed={lockedId === spot.id}
              className={`group rounded-xl border p-3 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8521A] ${
                style.cardBg
              } ${
                isActive
                  ? `${style.accentBorder} ring-2 ${style.ringClass} shadow-sm`
                  : "border-[#CBD5E1] hover:border-[#94A3B8]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-hb-xs font-bold text-white ${style.accentBg}`}
                >
                  {spot.num}
                </span>
                <span className="text-hb-xs font-semibold text-[#475569] truncate">
                  {spot.partName}
                </span>
              </div>

              <p className={`mt-2 text-hb-sm font-bold ${style.accentText}`}>
                {spot.title}
              </p>

              <ul className="mt-1.5 space-y-0.5 text-hb-xs text-[#334155] leading-snug">
                <li>{spot.details[0]}</li>
                <li>{spot.details[1]}</li>
              </ul>

              <p
                className={`mt-2.5 rounded-md border border-[#E2E6EC] bg-white px-2.5 py-1.5 text-center text-hb-xs font-bold ${style.accentText}`}
              >
                {spot.verdict}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  1. 실외기 인버터 PCB 4대 손상 위치 (10번 글)                         */
/* ------------------------------------------------------------------ */
const PCB_HOTSPOTS: readonly PhotoHotspotItem[] = [
  {
    id: "surge",
    num: "01",
    partName: "전원 단자 · EMI 코일 · 퓨즈",
    title: "1. 전력 서지 · 과전류",
    details: ["낙뢰·정전 후 복전 충격", "불안정한 건물 분전함 전압"],
    verdict: "퓨즈·바리스터·IPM 동시 소손",
    pinLeft: "27%",
    pinTop: "48%",
    boxLeft: "17.5%",
    boxTop: "36.5%",
    boxWidth: "18%",
    boxHeight: "41%",
    tone: "red",
  },
  {
    id: "heat",
    num: "02",
    partName: "DC 평활 전해콘덴서 뱅크",
    title: "2. 고온 · 통풍 불량",
    details: ["실외기실 루버창 닫고 가동", "기판 주변 70도 이상 과열"],
    verdict: "콘덴서 상단 부풀음·용량 저하",
    pinLeft: "42%",
    pinTop: "41%",
    boxLeft: "36%",
    boxTop: "29%",
    boxWidth: "13%",
    boxHeight: "46%",
    tone: "orange",
  },
  {
    id: "moisture",
    num: "03",
    partName: "알루미늄 방열판 · IPM 모듈",
    title: "3. 습기 · 결로 부식",
    details: ["고압 세척 물 튐·배관 결로", "커넥터·소자 다리 습기 침투"],
    verdict: "구동 모듈 단락 · 통신 에러",
    pinLeft: "59%",
    pinTop: "49%",
    boxLeft: "52.5%",
    boxTop: "27%",
    boxWidth: "12.8%",
    boxHeight: "45.5%",
    tone: "blue",
  },
  {
    id: "insect",
    num: "04",
    partName: "MCU 제어부 · 다핀 커넥터",
    title: "4. 개미 · 벌레 유입 쇼트",
    details: ["대기전력 미열 찾아 침투", "전원·센서 핀 사이 몸체 접촉"],
    verdict: "고압 트래킹 합선 · 동박 소손",
    pinLeft: "73%",
    pinTop: "51%",
    boxLeft: "66%",
    boxTop: "28%",
    boxWidth: "15%",
    boxHeight: "48%",
    tone: "slate",
  },
];

export function PcbPhotoFailureDiagram() {
  return (
    <PhotoHotspotDiagram
      src="/images/guide/outdoor-unit-pcb-inspection.jpg"
      alt="상단 커버를 연 에어컨 실외기 내부 인버터 PCB 기판과 4대 주요 손상 위치 예시 사진"
      spots={PCB_HOTSPOTS}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  2. 실외기 내부 방수·방진 보호 구조 (9번 글)                          */
/* ------------------------------------------------------------------ */
const OUTDOOR_WEATHERPROOF_SPOTS: readonly PhotoHotspotItem[] = [
  {
    id: "top-pcb",
    num: "01",
    partName: "겹침 경사 상판 · 상단 전장함",
    title: "1. 상단 수직 밀폐 PCB 구획",
    details: ["지붕형 아연강판으로 낙수 차단", "기판은 수직 배치+실리콘 방습 코팅"],
    verdict: "위에서 직접 고압 호스 분사는 금지",
    pinLeft: "70%",
    pinTop: "25%",
    boxLeft: "58.5%",
    boxTop: "9.5%",
    boxWidth: "26.5%",
    boxHeight: "37%",
    tone: "orange",
  },
  {
    id: "fan-motor",
    num: "02",
    partName: "방열 알루미늄 핀 · 팬모터",
    title: "2. 방수 실링 팬모터 · 코일",
    details: ["실링 베어링으로 빗물 유입 차단", "핀 뒤쪽 개방 구조로 열풍 배출"],
    verdict: "루버창 닫힘 시 70도+ 과열 정지",
    pinLeft: "38%",
    pinTop: "52%",
    boxLeft: "18%",
    boxTop: "26%",
    boxWidth: "38%",
    boxHeight: "48%",
    tone: "blue",
  },
  {
    id: "compressor",
    num: "03",
    partName: "용접 밀폐 압축기 · 방진고무",
    title: "3. 완전 밀폐 콤프레샤 · 마운트",
    details: ["두꺼운 철제 용접 쉘로 수분 차단", "하단 방진 고무로 가동 진동 흡수"],
    verdict: "비바람 노출 환경에서도 안정 가동",
    pinLeft: "71%",
    pinTop: "68%",
    boxLeft: "59%",
    boxTop: "49%",
    boxWidth: "24%",
    boxHeight: "40%",
    tone: "teal",
  },
  {
    id: "drain-pan",
    num: "04",
    partName: "바닥 강판 배수 채널 · 홀",
    title: "4. 하단 배수 홀 vs 바닥 침수",
    details: ["들이친 빗물·결로수 하부 홀 배출", "폭우 시 10cm 이상 침수되면 수몰"],
    verdict: "반지하·저지대는 받침대 높이 확보",
    pinLeft: "36%",
    pinTop: "86%",
    boxLeft: "17%",
    boxTop: "80%",
    boxWidth: "37%",
    boxHeight: "13%",
    tone: "red",
  },
];

export function OutdoorUnitWeatherproofPhotoDiagram() {
  return (
    <PhotoHotspotDiagram
      src="/images/guide/outdoor-unit-weatherproof-inside.jpg"
      alt="전면·상단 패널을 개방한 에어컨 실외기 내부 상단 전장함, 팬모터, 밀폐 압축기, 바닥 배수판 구조 예시 사진"
      spots={OUTDOOR_WEATHERPROOF_SPOTS}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  3. 중고 세탁기 구매 현장 점검 3대 포인트 (14번 글)                    */
/* ------------------------------------------------------------------ */
const WASHER_INSPECTION_SPOTS: readonly PhotoHotspotItem[] = [
  {
    id: "gasket",
    num: "01",
    partName: "도어 고무 패킹 틈새 (드럼)",
    title: "1. 고무 패킹 주름 안쪽 확인",
    details: ["고무 틈새를 손으로 젖혀 확인", "찢어짐·곰팡이·잔수 고임 체크"],
    verdict: "패킹 교체비 8~12만원 발생 여부 판별",
    pinLeft: "57%",
    pinTop: "68%",
    boxLeft: "48%",
    boxTop: "58%",
    boxWidth: "17%",
    boxHeight: "15%",
    tone: "blue",
  },
  {
    id: "drum-bearing",
    num: "02",
    partName: "스텐 내통 · 후면 베어링 유격",
    title: "2. 세탁조 유격 · 회전 소음",
    details: ["드럼 안쪽 상단을 위아래 흔들어 체크", "통돌이는 4모서리 눌러 댐퍼 반동 확인"],
    verdict: "덜컹 유격·갈림음 시 스파이더 수리 필요",
    pinLeft: "63%",
    pinTop: "42%",
    boxLeft: "51%",
    boxTop: "29%",
    boxWidth: "19%",
    boxHeight: "32%",
    tone: "red",
  },
  {
    id: "drain-filter",
    num: "03",
    partName: "하단 배수 펌프 거름망",
    title: "3. 배수 필터 · 잔수 호스 확인",
    details: ["하부 커버 열어 동전·이물질 확인", "급수·고속탈수·배수 펌프 연속 가동"],
    verdict: "펌프 막힘·누수 자국 없으면 상태 양호",
    pinLeft: "70%",
    pinTop: "85%",
    boxLeft: "61%",
    boxTop: "77%",
    boxWidth: "17%",
    boxHeight: "21%",
    tone: "teal",
  },
];

export function WasherInspectionPhotoDiagram() {
  return (
    <PhotoHotspotDiagram
      src="/images/guide/washer-inspection-parts.jpg"
      alt="도어 고무 패킹을 젖혀 점검하고 있는 세탁기 내부 스테인리스 드럼통과 하단 배수펌프 거름망 예시 사진"
      spots={WASHER_INSPECTION_SPOTS}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  4. 에어컨 동배관 vs 알루미늄 배관 & 단면 비교 (26번 글)               */
/* ------------------------------------------------------------------ */
const AIRCON_PIPE_SPOTS: readonly PhotoHotspotItem[] = [
  {
    id: "copper",
    num: "01",
    partName: "순수 KS 동(구리) 배관",
    title: "1. 동배관 · 황동 플레어 너트",
    details: ["연성 높아 재확관·재체결 내구성 우수", "찌그러짐·꺾임 없으면 끝단 절단 후 재사용"],
    verdict: `${STORE.name} 기준: 신규·이전 모두 동관 시공`,
    pinLeft: "18%",
    pinTop: "46%",
    boxLeft: "5%",
    boxTop: "31%",
    boxWidth: "43%",
    boxHeight: "46%",
    tone: "teal",
  },
  {
    id: "aluminum",
    num: "02",
    partName: "알루미늄(합금) 배관",
    title: "2. 백화 부식 · 크랙 위험",
    details: ["스마트링크/합금관은 재조임 시 나팔 균열", "습기·보온재 속 점부식(핀홀) 누설 잦음"],
    verdict: "이전 설치 시 새 동관 교체가 유리",
    pinLeft: "75%",
    pinTop: "50%",
    boxLeft: "51%",
    boxTop: "36%",
    boxWidth: "45%",
    boxHeight: "42%",
    tone: "red",
  },
  {
    id: "cut-end",
    num: "03",
    partName: "절단 단면 · 매립배관 점검",
    title: "3. 관벽 두께 · 매립 기밀 시험",
    details: ["구형 R-22 광유와 인버터 오일 혼입 금지", "벽체 매립관은 질소 세척·40kgf/cm² 기밀"],
    verdict: "사전 기밀 유지 확인 후 냉매 진공 주입",
    pinLeft: "50%",
    pinTop: "70%",
    boxLeft: "39%",
    boxTop: "57%",
    boxWidth: "22%",
    boxHeight: "23%",
    tone: "blue",
  },
];

export function AirconPipeComparisonPhotoDiagram() {
  return (
    <PhotoHotspotDiagram
      src="/images/guide/aircon-copper-vs-alu-pipe.jpg"
      alt="황동 너트가 체결된 왼쪽 순수 동배관과 백화 부식·꺾임이 생긴 오른쪽 알루미늄 배관 및 절단 단면 비교 예시 사진"
      spots={AIRCON_PIPE_SPOTS}
    />
  );
}
