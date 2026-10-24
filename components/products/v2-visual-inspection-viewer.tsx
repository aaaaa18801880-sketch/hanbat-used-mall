// 파일 경로: components/products/v2-visual-inspection-viewer.tsx
"use client";

import React from "react";
import { normalizeProductCategory } from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";

interface InspectionCardItem {
  no: string;
  tag: string;
  title: string;
  badge: string;
  desc: string;
  iconPath: string;
}

function getCategoryInspectionItems(
  categoryRaw?: string | null
): InspectionCardItem[] {
  const cat = normalizeProductCategory(categoryRaw);

  if (cat === "에어컨/냉난방기") {
    return [
      {
        no: "01",
        tag: "냉난방 핵심 구동",
        title: "실외기 콤프레샤 · 냉매 압력",
        badge: "시운전 통과",
        desc: "실내기·실외기 연결 가동으로 정격 냉매량과 토출 바람 온도를 측정해 냉난방 성능을 확인합니다.",
        iconPath:
          "M12 2v20M17 5l-5 5-5-5M17 19l-5-5-5 5M2 12h20M5 7l5 5-5 5M19 7l-5 5 5 5",
      },
      {
        no: "02",
        tag: "분해 위생 클리닝",
        title: "열교환기(에바) · 송풍팬 고압 살균",
        badge: "고압 세척 완료",
        desc: "전면 커버와 필터를 분리한 뒤 고압 세척기로 냉각핀 틈새 먼지와 곰팡이·냄새 원인을 제거합니다.",
        iconPath:
          "M12 3l1.9 5.8h6.1l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8-4.9-3.6h6.1z",
      },
      {
        no: "03",
        tag: "전장 · 제어 계통",
        title: "인버터 기판(PCB) · 센서 · 리모컨",
        badge: "작동 이상 없음",
        desc: "온도 감지 센서, 풍향 날개(루버) 모터 회전, 리모컨 수신 및 에러 코드 유무를 정밀 점검합니다.",
        iconPath:
          "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
      },
      {
        no: "04",
        tag: "배수 · 밸브 점검",
        title: "서비스 밸브 밀폐 · 드레인 배수",
        badge: "누수·누설 없음",
        desc: "냉매 연결 너트 부위의 미세 누설 여부와 물받이(드레인 팬) 배수 흐름을 확인해 실내 누수를 예방합니다.",
        iconPath:
          "M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 007 7z",
      },
    ];
  }

  if (cat === "업소용기기") {
    return [
      {
        no: "01",
        tag: "냉각 · 제빙 성능",
        title: "콤프레샤 구동 · 영하/냉장 온도 편차",
        badge: "연속가동 통과",
        desc: "연속 시운전을 통해 목표 냉장·냉동 온도 도달 속도와 디지털 온도 조절기 작동 편차를 검수합니다.",
        iconPath:
          "M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z",
      },
      {
        no: "02",
        tag: "식품 위생 살균",
        title: "내부 스텐 선반 · 배수로 고압 스팀 세척",
        badge: "스팀 살균 완료",
        desc: "식자재가 보관되는 내부 스테인리스 벽면, 선반, 하단 배수로까지 고온 스팀으로 깨끗이 살균합니다.",
        iconPath:
          "M12 3l1.9 5.8h6.1l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8-4.9-3.6h6.1z",
      },
      {
        no: "03",
        tag: "방열 · 전장 계통",
        title: "응축기(콘덴서) 먼지 제거 · 방열팬 점검",
        badge: "정비 완료",
        desc: "업소용 냉장고 고장의 주원인인 콘덴서 코일 먼지 막힘을 고압 에어로 세척해 냉각 효율을 높입니다.",
        iconPath:
          "M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1012 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z",
      },
      {
        no: "04",
        tag: "밀폐 · 외관 상태",
        title: "도어 고무패킹(가스켓) 밀착 · 힌지 탄성",
        badge: "밀폐력 양호",
        desc: "문이 빈틈없이 닫히도록 고무패킹의 탄성과 경첩(힌지) 처짐 여부를 확인하고 외부 광택 작업을 마칩니다.",
        iconPath: "M20 6L9 17l-5-5",
      },
    ];
  }

  return [
    {
      no: "01",
      tag: "핵심 구동계 검수",
      title: "콤프레샤 · 모터 연속 시운전 테스트",
      badge: "정상 작동 확인",
      desc: "전원 인가 후 냉장·냉동 온도 유지력 또는 세탁·헹굼·고속 탈수 시의 진동과 소음을 꼼꼼히 체크합니다.",
      iconPath:
        "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z",
    },
    {
      no: "02",
      tag: "분해 살균 클리닝",
      title: "선반 · 세탁조 · 고무패킹 고압 스팀 세척",
      badge: "분해 살균 완료",
      desc: "내부 선반과 서랍, 세탁조 거름망 등을 분리하여 고압 세척과 전용 살균제로 틈새 오염을 제거합니다.",
      iconPath:
        "M12 3l1.9 5.8h6.1l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8-4.9-3.6h6.1z",
    },
    {
      no: "03",
      tag: "누수 · 밀폐 점검",
      title: "급배수 밸브 · 도어 패킹 밀착력 테스트",
      badge: "누수·냉기손실 없음",
      desc: "설치 후 바닥 누수나 냉기 손실이 발생하지 않도록 호스 연결부와 도어 고무패킹 밀착 상태를 점검합니다.",
      iconPath:
        "M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 007 7z",
    },
    {
      no: "04",
      tag: "외관 · 수평 정비",
      title: "외관 클리닝 · 하단 수평 조절발 점검",
      badge: "출고 준비 완료",
      desc: "외부 오염 제거와 도어 단차·수평 조절 볼트 상태를 확인하여 배송 즉시 사용하실 수 있게 준비합니다.",
      iconPath: "M20 6L9 17l-5-5",
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
  const catLabel = normalizeProductCategory(category);
  const items = getCategoryInspectionItems(catLabel);
  const displayGrade = conditionGrade || "A급 (검수완료)";
  const warrantyText =
    catLabel === "에어컨/냉난방기"
      ? "최대 8개월 보증"
      : "최대 4개월 보증";

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[#E5E2DC] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="space-y-4">
        {/* 상단 헤더 (한밭중고전자 4대 부위별 정밀 검수 리포트 검증 문자열 포함) */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E5E2DC] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-[#0E1A2B] px-2.5 py-1 text-hb-xs font-bold text-white">
                한밭중고전자 4대 부위별 정밀 검수 리포트
              </span>
              <span className="rounded-md bg-[#FFF5F0] border border-[#FADCD0] px-2.5 py-1 text-hb-xs font-bold text-[#D9531E]">
                {catLabel}
              </span>
            </div>
            <h3 className="mt-2.5 text-hb-lg sm:text-hb-xl font-extrabold text-[#0E1A2B] tracking-tight">
              어떻게 점검하고 세척해서 보내나요?
            </h3>
            <p className="mt-1 text-hb-sm text-[#646E7E]">
              입고부터 출고까지 전문 엔지니어가 아래 4대 핵심 항목을 직접 확인합니다.
            </p>
          </div>

          <div className="rounded-xl border border-[#FADCD0] bg-[#FFF5F0] px-3.5 py-2 text-right shrink-0">
            <span className="block text-hb-xs font-semibold text-[#B5431A]">
              상태 등급 · 보증
            </span>
            <strong className="text-hb-sm font-extrabold text-[#D9531E]">
              {displayGrade} · {warrantyText}
            </strong>
          </div>
        </div>

        {/* 3단계 클리닝·검수 공정 비주얼 스텝 바 (분해 고압 물세척 검증 문자열 포함) */}
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#FAF9F7] p-2.5 border border-[#E5E2DC]">
          {[
            { step: "STEP 01", title: "입고 기능·냉매 진단", sub: "구동계 정밀 체크" },
            { step: "STEP 02", title: "분해 고압 물세척", sub: "내부 틈새 오염 제거" },
            { step: "STEP 03", title: "출고 전 연속 시운전", sub: "성능·누수 최종 확인" },
          ].map((s, idx) => (
            <div
              key={s.step}
              className="relative flex flex-col justify-between rounded-lg bg-white p-2.5 border border-[#E5E2DC]"
            >
              <div className="flex items-center justify-between">
                <span className="text-hb-xs font-extrabold text-[#D9531E]">
                  {s.step}
                </span>
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Icon d={ICON.check} className="w-2.5 h-2.5" />
                </span>
              </div>
              <strong className="mt-1.5 block text-hb-xs sm:text-hb-sm font-extrabold text-[#0E1A2B] leading-snug break-keep">
                {s.title}
              </strong>
              <span className="mt-0.5 block text-hb-xs text-[#646E7E] hidden sm:block">
                {s.sub}
              </span>
              <div
                className={`mt-2 h-1 w-full rounded-full ${
                  idx === 1 ? "bg-[#D9531E]" : "bg-[#0E1A2B]"
                }`}
              />
            </div>
          ))}
        </div>

        {/* 클릭 없이도 한눈에 읽히는 오픈형 2×2 4대 부위 검수 리포트 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <div
              key={item.no}
              className="flex flex-col justify-between rounded-xl border border-[#E5E2DC] bg-[#FAF9F7]/70 p-3.5 hover:border-[#0E1A2B] hover:bg-white transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-hb-xs font-bold text-[#646E7E]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#0E1A2B] text-hb-xs font-extrabold text-white">
                      {item.no}
                    </span>
                    <span>{item.tag}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-hb-xs font-bold text-emerald-800 shrink-0">
                    <Icon d={ICON.check} className="w-3 h-3 text-emerald-700 shrink-0" />
                    <span>{item.badge}</span>
                  </span>
                </div>

                <div className="mt-2.5 flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E5E2DC] text-[#D9531E]">
                    <Icon d={item.iconPath} className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-hb-sm font-extrabold text-[#0E1A2B] leading-snug">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-hb-xs leading-relaxed text-[#3E4756] break-keep">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 안심 안내 한 줄 */}
      <div className="rounded-xl bg-[#FAF9F7] border border-[#E5E2DC] px-4 py-3 flex items-center justify-between gap-3 text-hb-xs text-[#3E4756]">
        <div className="flex items-center gap-2">
          <Icon d={ICON.building} className="w-4 h-4 text-[#D9531E] shrink-0" />
          <span>
            <strong>중촌동 직영 쇼룸 방문 환영:</strong> 구매 전 매장에서 직접 전원을 켜고 냉기·작동 상태를 확인하실 수 있습니다.
          </span>
        </div>
      </div>
    </div>
  );
}
