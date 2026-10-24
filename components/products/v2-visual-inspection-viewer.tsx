// 파일 경로: components/products/v2-visual-inspection-viewer.tsx
"use client";

import React, { useState } from "react";
import { normalizeProductCategory } from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";

interface InspectionPoint {
  id: string;
  badge: string;
  title: string;
  status: string;
  detail: string;
}

function getInspectionPoints(
  categoryRaw?: string | null,
  conditionGrade?: string | null
): InspectionPoint[] {
  const cat = normalizeProductCategory(categoryRaw);
  const gradeText = conditionGrade || "A급 (매장 검수 통과)";

  if (cat === "에어컨/냉난방기") {
    return [
      {
        id: "hvac-core",
        badge: "구동 · 냉매",
        title: "콤프레샤 압력 및 냉난방 토출 온도",
        status: "정상 작동 확인",
        detail:
          "실내기·실외기 연결 시운전을 통해 정격 냉매 압력과 목표 토출 온도 도달 여부를 점검했습니다.",
      },
      {
        id: "hvac-clean",
        badge: "분해 살균",
        title: "열교환기(에바) · 송풍팬 고압 약제 세척",
        status: "고압 살균 완료",
        detail:
          "전면 패널과 필터, 송풍팬을 분리하여 고압 세척기로 내부 먼지와 냄새 유발 물질을 제거했습니다.",
      },
      {
        id: "hvac-elec",
        badge: "전장 · 센서",
        title: "인버터 기판 · 온도 센서 · 드레인 배수",
        status: "점검 통과",
        detail:
          "응축수 배수 불량(누수) 여부와 리모컨 수신부, 풍향 날개 모터 작동을 확인했습니다.",
      },
      {
        id: "hvac-body",
        badge: "외관 등급",
        title: `외관 컨디션 (${gradeText})`,
        status: gradeText,
        detail:
          "중고 특성상 미세한 생활 흔적은 있을 수 있으나 깨짐이나 변형 없이 깔끔하게 정비된 상태입니다.",
      },
    ];
  }

  if (cat === "업소용기기") {
    return [
      {
        id: "biz-comp",
        badge: "냉각 · 콤프",
        title: "콤프레샤 구동 및 영하/냉장 온도 편차",
        status: "시운전 통과",
        detail:
          "연속 가동 테스트를 통해 설정 온도 도달 시간과 디지털 온도 조절기(온도 편차) 정상 작동을 확인했습니다.",
      },
      {
        id: "biz-clean",
        badge: "스텐 · 내부",
        title: "내부 스텐 선반 · 배수로 고압 스팀 살균",
        status: "스팀 세척 완료",
        detail:
          "식자재가 닿는 내부 선반과 바닥 배수로, 응축기(콘덴서) 먼지망까지 고압 세척 및 살균을 마쳤습니다.",
      },
      {
        id: "biz-seal",
        badge: "밀폐 · 패킹",
        title: "도어 고무패킹 밀착력 및 힌지 탄성",
        status: "냉기 누설 없음",
        detail:
          "문 닫힘 시 냉기가 새지 않도록 도어 가스켓(고무패킹)의 찢어짐 여부와 밀착 상태를 점검했습니다.",
      },
      {
        id: "biz-body",
        badge: "외관 등급",
        title: `외관 컨디션 (${gradeText})`,
        status: gradeText,
        detail:
          "매장 주방이나 홀에 바로 배치하실 수 있도록 외부 광택 및 오염 제거 작업을 완료했습니다.",
      },
    ];
  }

  return [
    {
      id: "home-motor",
      badge: "모터 · 냉각",
      title: "핵심 구동계(콤프레샤·모터) 연속 시운전",
      status: "정상 작동 확인",
      detail:
        "입고 직후와 세척 완료 후 총 2회에 걸쳐 전원 인가 및 정상 가동(소음·진동·냉각) 테스트를 거쳤습니다.",
    },
    {
      id: "home-clean",
      badge: "분해 세척",
      title: "내부 선반 · 세탁조 · 고무패킹 고압 살균",
      status: "살균 세척 완료",
      detail:
        "일반 물걸레질이 아닌 부품 분리 후 고압 스팀·전용 세제로 보이지 않는 틈새 오염까지 제거했습니다.",
    },
    {
      id: "home-leak",
      badge: "누수 · 배수",
      title: "급배수 밸브 · 도어 밀폐력 점검",
      status: "이상 없음",
      detail:
        "설치 후 누수나 냉기 손실이 발생하지 않도록 패킹 밀착도와 배수 계통을 꼼꼼히 확인했습니다.",
    },
    {
      id: "home-body",
      badge: "외관 등급",
      title: `외관 컨디션 (${gradeText})`,
      status: gradeText,
      detail:
        "중촌동 직영 매장에 방문하시면 실제 외관과 내부 상태를 직접 열어보고 확인하실 수 있습니다.",
    },
  ];
}

export function V2VisualInspectionViewer({
  category,
  conditionGrade,
}: {
  category?: string | null;
  conditionGrade?: string | null;
}) {
  const points = getInspectionPoints(category, conditionGrade);
  const [activeId, setActiveId] = useState<string>(points[0].id);

  const activePoint =
    points.find((p) => p.id === activeId) || points[0];

  return (
    <div className="h-full flex flex-col justify-between rounded-xl border border-[#E5E2DC] bg-white p-4 sm:p-6 space-y-4 shadow-card">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E2DC] pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0E1A2B] text-white">
              <Icon d={ICON.check} className="w-3.5 h-3.5 text-[#FF8A50]" />
            </span>
            <h3 className="text-[14.5px] sm:text-[15.5px] font-extrabold text-[#0E1A2B]">
              한밭중고전자 4대 부위별 정밀 검수 리포트
            </h3>
          </div>
          <span className="text-[11.5px] font-semibold text-[#646E7E]">
            항목을 누르면 세부 점검 기준을 확인할 수 있습니다
          </span>
        </div>

        {/* 3단계 세척·검수 공정 프로그레스 바 */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11.5px] font-bold">
          {[
            { step: "STEP 1", name: "입고 작동·냉매 진단" },
            { step: "STEP 2", name: "분해 고압 스팀 살균" },
            { step: "STEP 3", name: "출고 전 연속 시운전" },
          ].map((st) => (
            <div
              key={st.step}
              className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] px-2 py-2"
            >
              <span className="block text-[10px] font-extrabold text-[#D9531E]">
                {st.step} ✓
              </span>
              <span className="mt-0.5 block text-[#0E1A2B] truncate">
                {st.name}
              </span>
            </div>
          ))}
        </div>

        {/* 4대 부위별 인터랙티브 핀포인트 탭 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {points.map((pt, idx) => {
            const isSelected = pt.id === activeId;
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() => setActiveId(pt.id)}
                aria-pressed={isSelected}
                className={`flex flex-col items-start justify-between rounded-lg border p-2.5 text-left transition-all ${
                  isSelected
                    ? "border-[#0E1A2B] bg-[#0E1A2B] text-white shadow-2xs"
                    : "border-[#E5E2DC] bg-[#FAF9F7] text-[#0E1A2B] hover:border-[#0E1A2B]"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${
                      isSelected
                        ? "bg-[#D9531E] text-white"
                        : "bg-white text-[#646E7E]"
                    }`}
                  >
                    0{idx + 1} · {pt.badge}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isSelected ? "bg-[#FF8A50]" : "bg-emerald-500"
                    }`}
                  />
                </div>
                <strong className="mt-2 block text-[12px] font-bold leading-snug line-clamp-1">
                  {pt.status}
                </strong>
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 부위 상세 설명 박스 */}
      <div className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-3.5 text-[13px] mt-2">
        <div className="flex items-center justify-between gap-2 mb-1">
          <strong className="font-extrabold text-[#0E1A2B]">
            • {activePoint.title}
          </strong>
          <span className="shrink-0 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
            ✔ {activePoint.status}
          </span>
        </div>
        <p className="text-[#3E4756] leading-relaxed break-keep">
          {activePoint.detail}
        </p>
      </div>
    </div>
  );
}
