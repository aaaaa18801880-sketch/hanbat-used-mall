// 파일 경로: components/products/v2-visual-inspection-viewer.tsx
"use client";

import React, { useState } from "react";
import { normalizeProductCategory } from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";

interface HotspotPoint {
  id: string;
  label: string;
  part: string;
  status: string;
  detail: string;
}

const HOTSPOTS_BY_CATEGORY: Record<string, HotspotPoint[]> = {
  냉장고: [
    {
      id: "comp",
      label: "01. 콤프레샤 · 냉매 압력",
      part: "핵심 구동부 점검 기준",
      status: "출고 기준",
      detail:
        "24시간 연속 가동 테스트를 통해 냉장(2~4℃)·냉동(-18℃ 이하) 도달 시간 및 콤프레샤 소음·진동이 정상 범위인 매물만 선별합니다.",
    },
    {
      id: " gasket",
      label: "02. 도어 고무 패킹 밀착력",
      part: "냉기 보존 점검 기준",
      status: "밀착·세척",
      detail:
        "고온 스팀으로 패킹 틈새 곰팡이와 이물질을 살균 세척하고, 도어 여닫음 자력 및 냉기 누설 여부를 확인합니다.",
    },
    {
      id: "shelf",
      label: "03. 내부 선반 · 야채실 탈거 세척",
      part: "위생 클리닝 기준",
      status: "분해 살균",
      detail:
        "강화유리 선반과 서랍을 모두 분리해 친환경 세제로 세척·건조한 뒤 파손 유무를 점검합니다.",
    },
    {
      id: "ext",
      label: "04. 외관 · 수평 조절 발판",
      part: "외관·설치 점검 기준",
      status: "점검 완료",
      detail:
        "전면 도어와 측면 외관 상태를 확인하고, 하단 수평 조절 볼트 작동 여부를 출고 전 점검합니다.",
    },
  ],
  "세탁기/건조기": [
    {
      id: "drum",
      label: "01. 내조(세탁조) 완전 분해 세척",
      part: "위생 클리닝 기준",
      status: "고압 스팀",
      detail:
        "세탁조와 거름망, 세제 투입구를 고압 스팀으로 세척하여 내부 물때와 잔여 이물질을 제거합니다.",
    },
    {
      id: "motor",
      label: "02. 인버터 모터 · 고속 탈수 진동",
      part: "핵심 구동부 점검 기준",
      status: "출고 기준",
      detail:
        "표준 세탁·헹굼·고속 탈수 전 코스를 실제 급수 상태로 시운전하여 베어링 소음과 댐퍼 균형을 확인합니다.",
    },
    {
      id: "valve",
      label: "03. 급수 밸브 · 배수 펌프 누수",
      part: "누수 점검 기준",
      status: "누수 확인",
      detail:
        "냉·온수 급수 밸브 개폐 상태와 배수 호스 연결부 누수 여부를 테스트한 뒤 출고합니다.",
    },
    {
      id: "door",
      label: "04. 도어 락 · 조작부 버튼 반응",
      part: "전장·조작 점검 기준",
      status: "점검 완료",
      detail:
        "LED 디스플레이 표시 상태와 다이얼·터치 버튼 입력, 도어 안전 잠금장치 작동을 확인합니다.",
    },
  ],
  "에어컨/냉난방기": [
    {
      id: "gas",
      label: "01. 실외기 콤프레샤 · 냉매 순환",
      part: "핵심 냉난방 점검 기준",
      status: "출고 기준",
      detail:
        "실내기·실외기 1:1 세트 연결 시운전을 통해 정격 압력 유지 및 토출 온도 강하 성능을 확인합니다.",
    },
    {
      id: "eva",
      label: "02. 열교환기(에바) · 송풍팬 약품 세척",
      part: "위생 클리닝 기준",
      status: "분해 살균",
      detail:
        "전면 패널과 필터, 송풍팬, 냉각핀을 전용 세척제와 고압 세척기로 클리닝하여 쉰내와 먼지를 제거합니다.",
    },
    {
      id: "pcb",
      label: "03. 메인 기판(PCB) · 센서 통신",
      part: "전장 제어 점검 기준",
      status: "점검 완료",
      detail:
        "온도 센서, 풍향 날개(루버) 스윙 모터, 리모컨 수신부의 정상 작동 여부를 확인합니다.",
    },
    {
      id: "pipe",
      label: "04. 서비스 밸브 · 배수 드레인",
      part: "배관·누수 점검 기준",
      status: "누수 확인",
      detail:
        "동배관 연결 너트 산 마모 여부와 응축수 드레인 물 빠짐 상태를 사전 점검합니다.",
    },
  ],
  업소용기기: [
    {
      id: "cooling",
      label: "01. 상업용 콤프레샤 · 응축기 방열",
      part: "핵심 냉각부 점검 기준",
      status: "출고 기준",
      detail:
        "응축기(콘덴서) 코일 먼지를 고압 에어로 제거하고, 콤프레샤 기동 전류 및 설정 온도 유지력을 확인합니다.",
    },
    {
      id: "temp",
      label: "02. 디지털 온도조절기 · 제상 히터",
      part: "전장 제어 점검 기준",
      status: "점검 완료",
      detail:
        "정밀 온도 센서 오차 여부와 성에 제거(제상) 타이머·히터 작동 상태를 테스트합니다.",
    },
    {
      id: "stainless",
      label: "03. 내·외부 스테인리스 · 선반 살균",
      part: "주방 위생 클리닝 기준",
      status: "스팀 세척",
      detail:
        "업소 주방 환경에 맞춘 약제 세척과 고온 스팀 살균으로 유분기와 오염을 제거합니다.",
    },
    {
      id: "wheel",
      label: "04. 하부 캐스터(바퀴) · 도어 경첩",
      part: "기구부 점검 기준",
      status: "점검 완료",
      detail:
        "중량 설비 이동을 위한 바퀴 회전·고정 스토퍼 및 도어 자동 닫힘(토션바) 장력을 확인합니다.",
    },
  ],
};

const DEFAULT_HOTSPOTS: HotspotPoint[] = [
  {
    id: "power",
    label: "01. 전원부 · 핵심 구동 계통",
    part: "구동 성능 점검 기준",
    status: "출고 기준",
    detail:
      "입고 후 정격 전원 연결 및 장시간 연속 작동 테스트를 거쳐 기능 이상이 없는 매물만 출고합니다.",
  },
  {
    id: "clean",
    label: "02. 내·외부 분해 고압 스팀 살균",
    part: "위생 클리닝 기준",
    status: "분해 살균",
    detail:
      "손이 닿지 않는 내부 틈새와 필터까지 분해하여 친환경 세제와 고온 스팀으로 깨끗하게 세척합니다.",
  },
  {
    id: "control",
    label: "03. 조작 버튼 · 디스플레이 · 센서",
    part: "전장 점검 기준",
    status: "점검 완료",
    detail:
      "모든 코스 버튼과 다이얼, 화면 표시부, 안전 센서가 정상 작동하는지 확인합니다.",
  },
  {
    id: "body",
    label: "04. 외관 상태 · 부속품 완비",
    part: "외관·부속 점검 기준",
    status: "점검 완료",
    detail:
      "실사용에 필요한 필수 부속품 유무와 외관 상태를 투명하게 고지하고 출고합니다.",
  },
];

export function V2VisualInspectionViewer({
  category,
  conditionGrade,
}: {
  category?: string | null;
  conditionGrade?: string | null;
}) {
  const normCat = normalizeProductCategory(category);
  const points = HOTSPOTS_BY_CATEGORY[normCat] || DEFAULT_HOTSPOTS;
  const [activeId, setActiveId] = useState<string>(points[0].id);

  const activePoint = points.find((p) => p.id === activeId) || points[0];

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-6 shadow-2xs">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E5E2DC]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block rounded bg-[#FAF9F7] border border-[#E5E2DC] px-2 py-0.5 text-hb-xs font-bold text-[#0E1A2B]">
                한밭중고전자 공통 출고 기준
              </span>
              <span className="text-hb-xs font-semibold text-[#D9531E]">
                {normCat}
              </span>
            </div>
            <h2 className="mt-1.5 text-hb-lg font-bold text-[#0E1A2B]">
              품목별 4대 핵심 검수 · 세척 기준 안내
            </h2>
          </div>

          {conditionGrade && (
            <div className="rounded-lg border border-[#FED7AA] bg-[#FFF5F0] px-3 py-1.5 text-right">
              <span className="block text-hb-xs font-semibold text-[#646E7E]">
                본 매물 상태 등급
              </span>
              <strong className="text-hb-xs font-bold text-[#D9531E]">
                {conditionGrade}
              </strong>
            </div>
          )}
        </div>

        {/* 3단계 클리닝 공정 바 */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { step: "STEP 01", title: "입고 기능 점검", pct: "1단계" },
            { step: "STEP 02", title: "분해 고압 스팀 살균", pct: "2단계" },
            { step: "STEP 03", title: "출고 전 시운전", pct: "3단계" },
          ].map((s) => (
            <div
              key={s.step}
              className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-2.5"
            >
              <div className="flex items-center justify-between text-hb-xs font-bold">
                <span className="text-[#646E7E]">{s.step}</span>
                <span className="text-[#D9531E]">{s.pct}</span>
              </div>
              <p className="mt-1 text-hb-xs font-bold text-[#0E1A2B] truncate">
                {s.title}
              </p>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#E5E2DC]">
                <div className="h-full w-full bg-[#0E1A2B]" />
              </div>
            </div>
          ))}
        </div>

        {/* 4대 부위별 인터랙티브 탭 + 상세 판정 카드 */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {points.map((pt) => {
            const active = pt.id === activePoint.id;
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() => setActiveId(pt.id)}
                className={`flex items-center justify-between gap-2 rounded-lg border p-3 text-left transition-all cursor-pointer ${
                  active
                    ? "border-[#0E1A2B] bg-[#0E1A2B] text-white"
                    : "border-[#E5E2DC] bg-[#FAF9F7] text-[#0E1A2B] hover:border-[#0E1A2B]"
                }`}
              >
                <div className="min-w-0">
                  <span
                    className={`block text-hb-xs font-semibold ${
                      active ? "text-[#FF8A50]" : "text-[#646E7E]"
                    }`}
                  >
                    {pt.part}
                  </span>
                  <strong className="mt-0.5 block truncate text-hb-xs font-bold">
                    {pt.label}
                  </strong>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-hb-xs font-bold ${
                    active
                      ? "bg-[#D9531E] text-white"
                      : "bg-white text-[#434B59] border border-[#E5E2DC]"
                  }`}
                >
                  {pt.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 부위의 상세 검수 설명 */}
      <div className="mt-3.5 rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0E1A2B] text-white">
              <Icon d={ICON.check} className="w-3.5 h-3.5 text-[#FF8A50]" />
            </span>
            <strong className="text-hb-sm font-bold text-[#0E1A2B]">
              {activePoint.label}
            </strong>
          </div>
          <span className="rounded bg-white border border-[#E5E2DC] px-2 py-0.5 text-hb-xs font-bold text-[#434B59]">
            공통 점검 항목
          </span>
        </div>
        <p className="mt-2 text-hb-xs sm:text-hb-sm leading-relaxed text-[#434B59] break-keep">
          {activePoint.detail}
        </p>
        <p className="mt-2.5 pt-2 border-t border-[#E5E2DC] text-hb-xs text-[#646E7E] break-keep">
          ※ 위 내용은 품목별 공통 출고 기준 안내이며, 개별 매물의 외관·실측 상태는 상단 실물 사진과 상세 설명을 기준으로 확인하실 수 있습니다.
        </p>
      </div>
    </div>
  );
}
