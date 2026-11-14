"use client";

import { useMemo, useState } from "react";
import { STORE } from "../../lib/site";
import { ICON, Icon } from "../../lib/ui";

type GuideToolKind =
  | "aircon-sizing"
  | "power-contract"
  | "clearance-entry"
  | "energy-payback";

const SLUG_TO_TOOL: Record<string, GuideToolKind> = {
  // 1. 에어컨 냉방 평형 & 전압/전선 판정기
  "aircon-pyeong-sizing-cafe-restaurant": "aircon-sizing",
  "aircon-how-it-works-and-parts": "aircon-sizing",
  "why-ceiling-aircon-install-costs-more": "aircon-sizing",
  "why-no-outdoor-unit-on-walkway-defrost": "aircon-sizing",
  "fixed-speed-vs-inverter-aircon": "aircon-sizing",
  // 2. 매장 계약전력(kW) 부하 시뮬레이터
  "voltage-220v-vs-380v": "power-contract",
  "startup-closure-docs-and-power": "power-contract",
  "electricity-bill-capacity-and-kepco": "power-contract",
  // 3. 출입문 통로·사다리차 진입 판정기
  "ladder-truck-and-clearance": "clearance-entry",
  "why-never-lay-fridge-flat-moving": "clearance-entry",
  // 4. 에너지 라벨 kWh & 차액 회수기간 계산기
  "energy-efficiency-rating-myth-and-kwh": "energy-payback",
  "inverter-aircon-24h-on-vs-off-electricity": "energy-payback",
};

export function hasGuideInteractiveTool(slug: string): boolean {
  return slug in SLUG_TO_TOOL;
}

/* ------------------------------------------------------------------ */
/*  공통 래퍼                                                          */
/* ------------------------------------------------------------------ */
function ToolCard({
  badge,
  title,
  subtitle,
  iconPath,
  onReset,
  children,
}: {
  badge: string;
  title: string;
  subtitle: string;
  iconPath: string;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="my-6 rounded-2xl border border-[#DCE2EA] bg-[#F8FAFC] p-4 sm:p-6 shadow-2xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#E2E6EC]">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#141A23] text-white">
            <Icon d={iconPath} className="w-4 h-4" />
          </span>
          <div>
            <span className="inline-flex items-center rounded-md border border-[#E8521A]/30 bg-[#FFF4EE] px-2 py-0.5 text-hb-xs font-bold text-[#C84312]">
              {badge}
            </span>
            <h3 className="mt-1 text-hb-base sm:text-hb-lg font-bold text-[#141A23] leading-snug">
              {title}
            </h3>
            <p className="mt-0.5 text-hb-xs sm:text-hb-sm text-[#475569]">
              {subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE2EA] bg-white px-2.5 py-1.5 text-hb-xs font-semibold text-[#475569] hover:border-[#141A23] hover:text-[#141A23] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8521A]"
        >
          <Icon d={ICON.rotate} className="w-3.5 h-3.5" />
          초기화
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  1. 에어컨 냉방 평형 & 전압·차단기 산출기                             */
/* ------------------------------------------------------------------ */
const SPACE_LOAD_TYPES = [
  { id: "home", label: "주거 · 사무실", factor: 1.0, hint: "일반 채광·인원 적은 공간" },
  { id: "cafe", label: "카페 · 베이커리", factor: 1.45, hint: "에스프레소·제빙기·오븐 발열" },
  { id: "food", label: "일반 식당 · 미용실", factor: 1.35, hint: "드라이·조리 열기 및 출입 빈번" },
  { id: "grill", label: "고깃집 · 대형 주방", factor: 1.75, hint: "직화·화구·덕트 배기 열손실" },
] as const;

const ENVELOPE_FACTORS = [
  { id: "normal", label: "보통 창호 · 층고 2.7m 이하", factor: 1.0 },
  { id: "glass", label: "통창·서향 · 층고 3.5m 이상", factor: 1.2 },
] as const;

function AirconSizingTool() {
  const [pyeong, setPyeong] = useState<number>(20);
  const [spaceId, setSpaceId] = useState<(typeof SPACE_LOAD_TYPES)[number]["id"]>("cafe");
  const [envId, setEnvId] = useState<(typeof ENVELOPE_FACTORS)[number]["id"]>("normal");

  const result = useMemo(() => {
    const space = SPACE_LOAD_TYPES.find((s) => s.id === spaceId) ?? SPACE_LOAD_TYPES[0];
    const env = ENVELOPE_FACTORS.find((e) => e.id === envId) ?? ENVELOPE_FACTORS[0];
    const requiredPyeong = Math.round(pyeong * space.factor * env.factor);
    const estCoolingKw = Number((requiredPyeong * 0.36).toFixed(1));

    let modelSpec = "18~23평형 인버터 스탠드 1대";
    let breaker = "단상 220V · 20A 전용 차단기";
    let wireSpec = "2.5SQ (허용 ~25A)";
    let phaseBadge = "단상 220V 가능";
    let isThreePhase = false;
    let splitAdvice = "단독 1대로 커버 가능한 구간입니다.";

    if (requiredPyeong <= 16) {
      modelSpec = "15~18평형 인버터 벽걸이·스탠드";
      breaker = "단상 220V · 20A 단독 차단기";
      wireSpec = "2.5SQ 난연 전선";
    } else if (requiredPyeong <= 25) {
      modelSpec = "23~25평형 인버터 스탠드 또는 3평급 4Way";
      breaker = "단상 220V · 20~30A 단독 차단기";
      wireSpec = "2.5SQ ~ 4SQ 권장";
    } else if (requiredPyeong <= 36) {
      modelSpec = "30~36평형 대용량 스탠드 또는 4Way 1대";
      breaker = "단상 220V · 30A 단독 배선";
      wireSpec = "4SQ (직결 차단기 권장)";
      splitAdvice = "L자 구조·칸막이 매장은 18평+15평 2대 분산이 냉기 도달에 유리합니다.";
    } else if (requiredPyeong <= 45) {
      modelSpec = "40평형 스탠드 또는 23평형 2대 분산";
      breaker = "단상 220V 40A 또는 삼상 380V 4P 20A";
      wireSpec = "단상 6SQ / 삼상 2.5SQ 이상";
      phaseBadge = "40평 경계(전압 확인 필수)";
      isThreePhase = true;
      splitAdvice = "단상 40평 1대보다 23평형 2대 분산 시 전기 부하와 A/S 리스크가 줄어듭니다.";
    } else {
      const units = Math.max(2, Math.ceil(requiredPyeong / 36));
      modelSpec = `40평형급 ${units}대 또는 삼상 중대형 냉난방기`;
      breaker = "삼상 380V 4P 30A~40A 분전반";
      wireSpec = "4SQ ~ 6SQ 4선식";
      phaseBadge = "삼상 380V 적극 권장";
      isThreePhase = true;
      splitAdvice = "부하가 커서 삼상 380V 인입 여부와 계약전력 증설을 먼저 확인해야 합니다.";
    }

    return {
      requiredPyeong,
      estCoolingKw,
      modelSpec,
      breaker,
      wireSpec,
      phaseBadge,
      isThreePhase,
      splitAdvice,
    };
  }, [pyeong, spaceId, envId]);

  const meterPercent = Math.min(100, Math.round((result.requiredPyeong / 75) * 100));

  return (
    <ToolCard
      badge="실무 판정 도구"
      title="매장 발열량 기준 에어컨 권장 평형 · 전선/전압 계산기"
      subtitle="실측 면적과 업종 열원·창호 조건을 선택하면 필요한 냉방 평형과 차단기/전선 굵기를 계산합니다."
      iconPath={ICON.snowflake}
      onReset={() => {
        setPyeong(20);
        setSpaceId("cafe");
        setEnvId("normal");
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-4">
          {/* 평수 슬라이더 */}
          <div className="rounded-xl border border-[#E2E6EC] bg-white p-3.5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label htmlFor="aircon-pyeong-range" className="text-hb-xs font-bold text-[#141A23]">
                실내 전용 면적 (평수)
              </label>
              <span className="text-hb-base font-extrabold text-[#E8521A]">
                {pyeong}평 <span className="text-hb-xs font-medium text-[#64748B]">({Math.round(pyeong * 3.3058)}㎡)</span>
              </span>
            </div>
            <input
              id="aircon-pyeong-range"
              type="range"
              min={8}
              max={60}
              step={2}
              value={pyeong}
              onChange={(e) => setPyeong(Number(e.target.value))}
              className="w-full accent-[#E8521A] cursor-pointer"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[10, 15, 20, 25, 30, 40, 50].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPyeong(v)}
                  className={`rounded-md px-2 py-1 text-hb-xs font-semibold border transition-colors ${
                    pyeong === v
                      ? "bg-[#141A23] text-white border-[#141A23]"
                      : "bg-[#F8FAFC] text-[#475569] border-[#E2E6EC] hover:border-[#94A3B8]"
                  }`}
                >
                  {v}평
                </button>
              ))}
            </div>
          </div>

          {/* 업종 / 열원 */}
          <div className="rounded-xl border border-[#E2E6EC] bg-white p-3.5">
            <p className="text-hb-xs font-bold text-[#141A23] mb-2">공간 용도 및 기기 발열 조건</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SPACE_LOAD_TYPES.map((item) => {
                const active = spaceId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSpaceId(item.id)}
                    className={`rounded-lg border p-2.5 text-left transition-colors ${
                      active
                        ? "border-[#E8521A] bg-[#FFF4EE]"
                        : "border-[#E2E6EC] bg-[#F8FAFC] hover:border-[#94A3B8]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-hb-xs font-bold ${active ? "text-[#C84312]" : "text-[#141A23]"}`}>
                        {item.label}
                      </span>
                      <span className="text-hb-xs font-semibold text-[#64748B]">x{item.factor}</span>
                    </div>
                    <p className="mt-0.5 text-hb-xs text-[#64748B]">{item.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 창호 / 층고 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ENVELOPE_FACTORS.map((item) => {
              const active = envId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setEnvId(item.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-[#141A23] bg-[#141A23] text-white"
                      : "border-[#E2E6EC] bg-white text-[#475569] hover:border-[#94A3B8]"
                  }`}
                >
                  <p className="text-hb-xs font-bold">{item.label}</p>
                  <p className={`text-hb-xs ${active ? "text-[#CBD5E1]" : "text-[#64748B]"}`}>
                    열부하 계수 x{item.factor}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 산출 결과 패널 */}
        <div className="lg:col-span-5 rounded-xl border border-[#DCE2EA] bg-white p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-hb-xs font-bold text-[#64748B]">환산 필요 냉방용량</span>
              <span
                className={`rounded-md px-2 py-0.5 text-hb-xs font-bold border ${
                  result.isThreePhase
                    ? "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]"
                    : "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                }`}
              >
                {result.phaseBadge}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-hb-2xl font-extrabold text-[#141A23]">
                약 {result.requiredPyeong}평형
              </span>
              <span className="text-hb-xs font-semibold text-[#64748B]">
                (약 {result.estCoolingKw}kW 급)
              </span>
            </div>

            {/* 시각 부하 게이지 바 */}
            <div className="mt-3">
              <div className="h-2.5 w-full rounded-full bg-[#E2E6EC] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    result.isThreePhase ? "bg-[#DC2626]" : "bg-[#0F766E]"
                  }`}
                  style={{ width: `${meterPercent}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-hb-xs text-[#64748B]">
                <span>소형(15평)</span>
                <span>단상한계(40평)</span>
                <span>삼상권장(50평+)</span>
              </div>
            </div>

            <dl className="mt-4 space-y-2.5 border-t border-[#E2E6EC] pt-3 text-hb-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-[#64748B] shrink-0">추천 기종</dt>
                <dd className="font-bold text-[#141A23] text-right">{result.modelSpec}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#64748B] shrink-0">전압 · 차단기</dt>
                <dd className="font-bold text-[#141A23] text-right">{result.breaker}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#64748B] shrink-0">배선 규격</dt>
                <dd className="font-bold text-[#0F766E] text-right">{result.wireSpec}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E6EC] p-3 text-hb-xs text-[#334155] leading-relaxed">
            <p className="font-bold text-[#141A23]">현장 배치 가이드</p>
            <p className="mt-1">{result.splitAdvice}</p>
          </div>
        </div>
      </div>
    </ToolCard>
  );
}

/* ------------------------------------------------------------------ */
/*  2. 매장 계약전력(kW) 부하 시뮬레이터                                 */
/* ------------------------------------------------------------------ */
interface LoadApplianceItem {
  id: string;
  label: string;
  kw: number;
  category: string;
  defaultChecked: boolean;
}

const STORE_LOAD_ITEMS: LoadApplianceItem[] = [
  { id: "aircon30", label: "30~40평형 냉난방기 (최대운전 기준)", kw: 3.8, category: "냉난방", defaultChecked: true },
  { id: "fridge45", label: "45박스 냉장고 + 테이블 냉장고", kw: 1.1, category: "냉장", defaultChecked: true },
  { id: "espresso", label: "2그룹 에스프레소 머신 + 온수기", kw: 4.5, category: "가열", defaultChecked: true },
  { id: "icemaker", label: "제빙기 + 쇼케이스 2대", kw: 1.2, category: "카페", defaultChecked: true },
  { id: "dishwasher", label: "상업용 식기세척기 (보일러 히터)", kw: 3.8, category: "가열", defaultChecked: false },
  { id: "fryer", label: "전기 튀김기 / 오븐 / 인덕션 1구", kw: 3.5, category: "가열", defaultChecked: false },
  { id: "base", label: "LED 조명 · 간판 · POS · 냉온수기", kw: 1.2, category: "기본", defaultChecked: true },
];

function PowerContractTool() {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    STORE_LOAD_ITEMS.filter((i) => i.defaultChecked).map((i) => i.id)
  );
  const [simultaneousPct, setSimultaneousPct] = useState<number>(85);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const summary = useMemo(() => {
    const activeItems = STORE_LOAD_ITEMS.filter((i) => selectedIds.includes(i.id));
    const totalInstalledKw = Number(
      activeItems.reduce((sum, item) => sum + item.kw, 0).toFixed(1)
    );
    const peakKw = Number(((totalInstalledKw * simultaneousPct) / 100).toFixed(1));

    let tier = "5kW (소형 일반상가 기본)";
    let phaseNotice = "단상 220V 유지 가능 (메인 30A)";
    let statusTone: "ok" | "warn" | "danger" = "ok";

    if (peakKw > 14) {
      tier = "20kW 이상 증설 + 삼상 380V 검토";
      phaseNotice = "20kW부터는 한국전력 시설부담금과 삼상 380V 분전반 공사가 필요합니다.";
      statusTone = "danger";
    } else if (peakKw > 9.5) {
      tier = "15kW 계약전력 권장 (여유 15~20%)";
      phaseNotice = "단상 최대 구간 또는 삼상 380V 분배 권장 (동시 가열 기기 주의)";
      statusTone = "warn";
    } else if (peakKw > 4.8) {
      tier = "10kW 계약전력 권장";
      phaseNotice = "일반 5kW 상가라면 한전 증설(5kW에서 10kW) 및 간선 굵기 점검 필수";
      statusTone = "warn";
    }

    const barMax = 22;
    const barPct = Math.min(100, Math.round((peakKw / barMax) * 100));

    return { totalInstalledKw, peakKw, tier, phaseNotice, statusTone, barPct, activeCount: activeItems.length };
  }, [selectedIds, simultaneousPct]);

  return (
    <ToolCard
      badge="전기 용량 시뮬레이터"
      title="매장 계약전력(kW) 합계 & 증설 여부 진단기"
      subtitle="창업·추가 도입할 장비를 체크하면 동시 피크 전력(kW)과 5kW·10kW·20kW 경계 초과 여부를 계산합니다."
      iconPath={ICON.bolt}
      onReset={() => {
        setSelectedIds(STORE_LOAD_ITEMS.filter((i) => i.defaultChecked).map((i) => i.id));
        setSimultaneousPct(85);
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-2">
          {STORE_LOAD_ITEMS.map((item) => {
            const checked = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem(item.id)}
                className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                  checked
                    ? "border-[#141A23] bg-white shadow-2xs"
                    : "border-[#E2E6EC] bg-[#F1F5F9]/60 text-[#64748B]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      checked
                        ? "bg-[#E8521A] border-[#E8521A] text-white"
                        : "bg-white border-[#CBD5E1] text-transparent"
                    }`}
                  >
                    <Icon d={ICON.check} className="w-3 h-3" />
                  </span>
                  <span className={`text-hb-xs sm:text-hb-sm font-semibold truncate ${checked ? "text-[#141A23]" : "text-[#64748B]"}`}>
                    {item.label}
                  </span>
                </div>
                <span className="shrink-0 rounded-md bg-[#F8FAFC] border border-[#E2E6EC] px-2 py-0.5 text-hb-xs font-bold text-[#141A23]">
                  {item.kw.toFixed(1)} kW
                </span>
              </button>
            );
          })}

          <div className="pt-2 rounded-xl border border-[#E2E6EC] bg-white p-3.5">
            <div className="flex items-center justify-between text-hb-xs">
              <label htmlFor="simultaneous-rate" className="font-bold text-[#141A23]">
                동시 가동률 적용 (피크 시간대 기준)
              </label>
              <span className="font-extrabold text-[#141A23]">{simultaneousPct}%</span>
            </div>
            <input
              id="simultaneous-rate"
              type="range"
              min={65}
              max={100}
              step={5}
              value={simultaneousPct}
              onChange={(e) => setSimultaneousPct(Number(e.target.value))}
              className="mt-2 w-full accent-[#141A23] cursor-pointer"
            />
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-[#DCE2EA] bg-white p-4 flex flex-col justify-between space-y-4">
          <div>
            <p className="text-hb-xs font-bold text-[#64748B]">예상 동시 피크 부하 ({summary.activeCount}개 선택)</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-hb-2xl font-extrabold text-[#141A23]">{summary.peakKw} kW</span>
              <span className="text-hb-xs text-[#64748B]">(설비 합계 {summary.totalInstalledKw} kW)</span>
            </div>

            {/* 계약전력 기준 막대 */}
            <div className="mt-4 space-y-1.5">
              <div className="relative h-3.5 w-full rounded-full bg-[#E2E6EC] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    summary.statusTone === "danger"
                      ? "bg-[#DC2626]"
                      : summary.statusTone === "warn"
                        ? "bg-[#D97706]"
                        : "bg-[#0F766E]"
                  }`}
                  style={{ width: `${summary.barPct}%` }}
                />
              </div>
              <div className="flex justify-between text-hb-xs text-[#64748B] font-medium">
                <span>0</span>
                <span>5kW(기본)</span>
                <span>10kW</span>
                <span>15kW</span>
                <span>20kW+</span>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#E2E6EC] bg-[#F8FAFC] p-3 space-y-1.5">
              <p className="text-hb-xs font-bold text-[#64748B]">권장 계약전력 구간</p>
              <p className="text-hb-sm font-extrabold text-[#141A23]">{summary.tier}</p>
            </div>
          </div>

          <div
            className={`rounded-lg border p-3 text-hb-xs leading-relaxed ${
              summary.statusTone === "danger"
                ? "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]"
                : summary.statusTone === "warn"
                  ? "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]"
                  : "border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]"
            }`}
          >
            <p className="font-bold">현장 전기 점검 포인트</p>
            <p className="mt-1">{summary.phaseNotice}</p>
          </div>
        </div>
      </div>
    </ToolCard>
  );
}

/* ------------------------------------------------------------------ */
/*  3. 출입문 통로 · 엘리베이터 · 사다리차 진입 판정기                     */
/* ------------------------------------------------------------------ */
const APPLIANCE_SIZE_PRESETS = [
  { id: "side-by-side", label: "양문형 냉장고 (800L급)", width: 912, depth: 820, doorDetachDepth: 730, tallNoLay: true },
  { id: "box45", label: "45박스 업소용 냉장고", width: 1100, depth: 800, doorDetachDepth: 735, tallNoLay: true },
  { id: "washer24", label: "대형 드럼세탁기 (24kg)", width: 686, depth: 820, doorDetachDepth: 750, tallNoLay: false },
  { id: "aircon-stand", label: "중대형 스탠드 에어컨", width: 520, depth: 340, doorDetachDepth: 340, tallNoLay: true },
] as const;

function ClearanceEntryTool() {
  const [presetId, setPresetId] = useState<(typeof APPLIANCE_SIZE_PRESETS)[number]["id"]>("side-by-side");
  const [doorWidthMm, setDoorWidthMm] = useState<number>(800);
  const [floorType, setFloorType] = useState<"ground" | "elevator" | "stairs">("elevator");

  const selected = useMemo(
    () => APPLIANCE_SIZE_PRESETS.find((p) => p.id === presetId) ?? APPLIANCE_SIZE_PRESETS[0],
    [presetId]
  );

  const judgment = useMemo(() => {
    const minPassSide = Math.min(selected.width, selected.depth);
    const detachedSide = Math.min(selected.width, selected.doorDetachDepth);
    const clearance = doorWidthMm - minPassSide;
    const detachedClearance = doorWidthMm - detachedSide;

    let statusLabel = "정상 진입 가능";
    let tone: "ok" | "warn" | "danger" = "ok";
    let detail = `가장 좁은 진입 통로(${doorWidthMm}mm) 대비 여유 ${clearance}mm가 확보됩니다.`;

    if (clearance < 0 && detachedClearance >= 20) {
      statusLabel = "도어 분리 후 통과 가능";
      tone = "warn";
      detail = `도어를 달고는 ${Math.abs(clearance)}mm 걸리지만, 현관 전 문짝·경첩을 분리하면 ${detachedClearance}mm 여유로 통과합니다.`;
    } else if (detachedClearance < 20) {
      statusLabel = floorType === "stairs" ? "사다리차 · 샷시 창문 진입 권장" : "통로 간섭 (사다리차 확인)";
      tone = "danger";
      detail = `도어 탈거 시에도 여유가 부족(${detachedClearance}mm)해 찍힘 위험이 큽니다. 베란다·외부 창호 폭 확인이 필요합니다.`;
    } else if (floorType === "stairs") {
      statusLabel = "계단 회전폭 · 사다리차 병행 검토";
      tone = "warn";
      detail = "직선 출입문 폭은 맞지만 계단 참 회전 반경(최소 1,100mm)과 눕힘 금지(오일 역류)를 확인하세요.";
    }

    const fitRatio = Math.min(100, Math.round((minPassSide / doorWidthMm) * 100));
    return { minPassSide, clearance, detachedClearance, statusLabel, tone, detail, fitRatio };
  }, [selected, doorWidthMm, floorType]);

  return (
    <ToolCard
      badge="현장 반입 판정기"
      title="출입문 폭 · 도어 탈거 · 사다리차 필요 여부 판정기"
      subtitle="문틀 안쪽 유효 폭(손잡이 제외)과 제품 규격을 비교해 반입 가능 여부를 확인합니다."
      iconPath={ICON.ruler}
      onReset={() => {
        setPresetId("side-by-side");
        setDoorWidthMm(800);
        setFloorType("elevator");
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {APPLIANCE_SIZE_PRESETS.map((item) => {
              const active = presetId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPresetId(item.id)}
                  className={`rounded-xl border p-2.5 text-left transition-colors ${
                    active
                      ? "border-[#E8521A] bg-[#FFF4EE]"
                      : "border-[#E2E6EC] bg-white hover:border-[#94A3B8]"
                  }`}
                >
                  <p className={`text-hb-xs font-bold ${active ? "text-[#C84312]" : "text-[#141A23]"}`}>
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-hb-xs text-[#64748B]">
                    W {item.width} x D {item.depth}mm (탈거 시 {item.doorDetachDepth}mm)
                  </p>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-[#E2E6EC] bg-white p-3.5">
            <div className="flex items-center justify-between text-hb-xs mb-2">
              <label htmlFor="door-width-range" className="font-bold text-[#141A23]">
                현관문 · 엘리베이터 · 주방 문 최소 유효폭
              </label>
              <span className="text-hb-base font-extrabold text-[#141A23]">{doorWidthMm} mm</span>
            </div>
            <input
              id="door-width-range"
              type="range"
              min={680}
              max={1050}
              step={10}
              value={doorWidthMm}
              onChange={(e) => setDoorWidthMm(Number(e.target.value))}
              className="w-full accent-[#141A23] cursor-pointer"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                { label: "구형 방문 730", v: 730 },
                { label: "소형 엘리베이터 780", v: 780 },
                { label: "표준 현관 820", v: 820 },
                { label: "상가 양개 950", v: 950 },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setDoorWidthMm(b.v)}
                  className={`rounded-md border px-2 py-1 text-hb-xs font-semibold ${
                    doorWidthMm === b.v
                      ? "bg-[#141A23] text-white border-[#141A23]"
                      : "bg-[#F8FAFC] text-[#475569] border-[#E2E6EC]"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "ground", label: "1층 · 단차 없음" },
              { id: "elevator", label: "엘리베이터 이용" },
              { id: "stairs", label: "2층 이상 계단" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFloorType(f.id as "ground" | "elevator" | "stairs")}
                className={`rounded-lg border px-3 py-1.5 text-hb-xs font-semibold ${
                  floorType === f.id
                    ? "border-[#141A23] bg-[#141A23] text-white"
                    : "border-[#E2E6EC] bg-white text-[#475569]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-[#DCE2EA] bg-white p-4 flex flex-col justify-between space-y-4">
          <div>
            <span
              className={`inline-flex rounded-md border px-2 py-0.5 text-hb-xs font-bold ${
                judgment.tone === "danger"
                  ? "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]"
                  : judgment.tone === "warn"
                    ? "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]"
                    : "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
              }`}
            >
              {judgment.statusLabel}
            </span>

            {/* 문틀 vs 기기 폭 시각 비교 막대 */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-hb-xs font-semibold text-[#475569]">
                <span>기기 최소 통과폭: {judgment.minPassSide}mm</span>
                <span>문폭: {doorWidthMm}mm</span>
              </div>
              <div className="h-4 w-full rounded-md bg-[#E2E6EC] overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-sm transition-all duration-300 ${
                    judgment.tone === "danger"
                      ? "bg-[#DC2626]"
                      : judgment.tone === "warn"
                        ? "bg-[#D97706]"
                        : "bg-[#0F766E]"
                  }`}
                  style={{ width: `${judgment.fitRatio}%` }}
                />
              </div>
              <p className="text-hb-xs text-[#64748B]">
                도어 분리 시 최소 폭 {selected.doorDetachDepth}mm 기준 여유:{" "}
                <strong className="text-[#141A23]">
                  {judgment.detachedClearance >= 0
                    ? `+${judgment.detachedClearance}mm`
                    : `${judgment.detachedClearance}mm 부족`}
                </strong>
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E6EC] bg-[#F8FAFC] p-3 text-hb-xs text-[#334155] leading-relaxed space-y-1">
            <p className="font-bold text-[#141A23]">반입 및 운반 주의사항</p>
            <p>{judgment.detail}</p>
            {selected.tallNoLay && (
              <p className="font-semibold text-[#C84312]">
                콤프레샤 탑재 기기는 수직 운반 원칙(부득이 기울일 때도 45도 이내, 설치 후 최소 2~4시간 안정화)을 지켜야 합니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </ToolCard>
  );
}

/* ------------------------------------------------------------------ */
/*  4. 에너지 라벨 kWh & 기기 차액 회수기간 계산기                         */
/* ------------------------------------------------------------------ */
function EnergyPaybackTool() {
  const [priceHighMan, setPriceHighMan] = useState<number>(130);
  const [kwhHigh, setKwhHigh] = useState<number>(28);
  const [priceAltMan, setPriceAltMan] = useState<number>(58);
  const [kwhAlt, setKwhAlt] = useState<number>(38);
  const [wonPerKwh, setWonPerKwh] = useState<number>(210);

  const calc = useMemo(() => {
    const priceDiffWon = Math.max(0, (priceHighMan - priceAltMan) * 10000);
    const monthlyKwhDiff = kwhAlt - kwhHigh;
    const monthlyFeeDiff = Math.round(monthlyKwhDiff * wonPerKwh);
    const annualFeeDiff = monthlyFeeDiff * 12;

    let headline = "";
    let detail = "";
    let paybackYears = 0;

    if (monthlyKwhDiff <= 0 && priceHighMan > priceAltMan) {
      headline = "차액 회수 불가 (알뜰 모델이 kWh·가격 모두 유리)";
      detail = "비교 대상 B의 월 소비전력이 A와 같거나 더 적어, 초기 구매가 절감액이 그대로 순이익입니다.";
    } else if (monthlyFeeDiff > 0 && priceDiffWon > 0) {
      const months = Math.round(priceDiffWon / monthlyFeeDiff);
      paybackYears = Number((months / 12).toFixed(1));
      headline = `약 ${months}개월 (${paybackYears}년) 후 차액 회수`;
      detail = `기기 가격 차이 ${(priceDiffWon / 10000).toLocaleString()}만원을 월 전기요금 절감(${monthlyFeeDiff.toLocaleString()}원/월)으로 메우는 데 ${paybackYears}년이 걸립니다.`;
    } else {
      headline = "초기 비용 동일 또는 고효율 즉시 이득";
      detail = "구매 가격 차이가 없으므로 월 kWh가 낮은 제품을 선택하는 편이 매달 전기요금을 아낍니다.";
    }

    const maxKwh = Math.max(kwhHigh, kwhAlt, 1);
    return {
      priceDiffWon,
      monthlyKwhDiff,
      monthlyFeeDiff,
      annualFeeDiff,
      headline,
      detail,
      paybackYears,
      highPct: Math.round((kwhHigh / maxKwh) * 100),
      altPct: Math.round((kwhAlt / maxKwh) * 100),
    };
  }, [priceHighMan, kwhHigh, priceAltMan, kwhAlt, wonPerKwh]);

  return (
    <ToolCard
      badge="전기요금 · ROI 계산기"
      title="등급 숫자 대신 라벨 kWh로 계산하는 기기 차액 회수기간"
      subtitle="신품 1등급 vs 최신 3~4등급·중고 가전의 구매가 차액을 전기요금으로 회수하는 데 몇 년이 걸리는지 확인해 보세요."
      iconPath={ICON.sparkles}
      onReset={() => {
        setPriceHighMan(130);
        setKwhHigh(28);
        setPriceAltMan(58);
        setKwhAlt(38);
        setWonPerKwh(210);
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 모델 A */}
            <div className="rounded-xl border border-[#E2E6EC] bg-white p-3.5 space-y-2.5">
              <p className="text-hb-xs font-bold text-[#141A23]">비교 모델 A (신품·고효율 기준)</p>
              <label className="block text-hb-xs text-[#64748B]">
                구매 가격: <strong className="text-[#141A23]">{priceHighMan}만원</strong>
                <input
                  type="range"
                  min={20}
                  max={350}
                  step={5}
                  value={priceHighMan}
                  onChange={(e) => setPriceHighMan(Number(e.target.value))}
                  className="mt-1 w-full accent-[#141A23]"
                />
              </label>
              <label className="block text-hb-xs text-[#64748B]">
                월 소비전력: <strong className="text-[#0F766E]">{kwhHigh} kWh/월</strong>
                <input
                  type="range"
                  min={15}
                  max={180}
                  step={2}
                  value={kwhHigh}
                  onChange={(e) => setKwhHigh(Number(e.target.value))}
                  className="mt-1 w-full accent-[#0F766E]"
                />
              </label>
            </div>

            {/* 모델 B */}
            <div className="rounded-xl border border-[#E2E6EC] bg-white p-3.5 space-y-2.5">
              <p className="text-hb-xs font-bold text-[#E8521A]">비교 모델 B (3~4등급 · 중고 알뜰)</p>
              <label className="block text-hb-xs text-[#64748B]">
                구매 가격: <strong className="text-[#141A23]">{priceAltMan}만원</strong>
                <input
                  type="range"
                  min={15}
                  max={300}
                  step={5}
                  value={priceAltMan}
                  onChange={(e) => setPriceAltMan(Number(e.target.value))}
                  className="mt-1 w-full accent-[#E8521A]"
                />
              </label>
              <label className="block text-hb-xs text-[#64748B]">
                월 소비전력: <strong className="text-[#C84312]">{kwhAlt} kWh/월</strong>
                <input
                  type="range"
                  min={15}
                  max={180}
                  step={2}
                  value={kwhAlt}
                  onChange={(e) => setKwhAlt(Number(e.target.value))}
                  className="mt-1 w-full accent-[#E8521A]"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E2E6EC] bg-white px-3.5 py-2.5">
            <span className="text-hb-xs font-bold text-[#141A23] mr-1">적용 단가:</span>
            {[
              { label: "상가 일반용 160원", v: 160 },
              { label: "가정 중간구간 210원", v: 210 },
              { label: "여름 고누진 310원", v: 310 },
            ].map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setWonPerKwh(t.v)}
                className={`rounded-md border px-2.5 py-1 text-hb-xs font-semibold ${
                  wonPerKwh === t.v
                    ? "bg-[#141A23] text-white border-[#141A23]"
                    : "bg-[#F8FAFC] text-[#475569] border-[#E2E6EC]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-[#DCE2EA] bg-white p-4 flex flex-col justify-between space-y-4">
          <div>
            <p className="text-hb-xs font-bold text-[#64748B]">손익분기 판정</p>
            <p className="mt-1 text-hb-lg font-extrabold text-[#141A23] leading-snug">
              {calc.headline}
            </p>

            <div className="mt-3 space-y-2 text-hb-xs">
              <div>
                <div className="flex justify-between font-semibold text-[#334155]">
                  <span>모델 A ({kwhHigh}kWh)</span>
                  <span>월 {Math.round(kwhHigh * wonPerKwh).toLocaleString()}원</span>
                </div>
                <div className="mt-1 h-2.5 w-full rounded-full bg-[#E2E6EC] overflow-hidden">
                  <div className="h-full bg-[#0F766E] rounded-full" style={{ width: `${calc.highPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold text-[#334155]">
                  <span>모델 B ({kwhAlt}kWh)</span>
                  <span>월 {Math.round(kwhAlt * wonPerKwh).toLocaleString()}원</span>
                </div>
                <div className="mt-1 h-2.5 w-full rounded-full bg-[#E2E6EC] overflow-hidden">
                  <div className="h-full bg-[#E8521A] rounded-full" style={{ width: `${calc.altPct}%` }} />
                </div>
              </div>
            </div>

            <dl className="mt-4 space-y-1.5 border-t border-[#E2E6EC] pt-3 text-hb-xs">
              <div className="flex justify-between">
                <dt className="text-[#64748B]">초기 구매가 차이</dt>
                <dd className="font-bold text-[#141A23]">{(calc.priceDiffWon / 10000).toLocaleString()}만원</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#64748B]">월 전기요금 차이</dt>
                <dd className="font-bold text-[#0F766E]">
                  {calc.monthlyFeeDiff >= 0
                    ? `월 ${calc.monthlyFeeDiff.toLocaleString()}원`
                    : `모델 B가 월 ${Math.abs(calc.monthlyFeeDiff).toLocaleString()}원 절감`}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-[#E2E6EC] bg-[#F8FAFC] p-3 text-hb-xs text-[#334155] leading-relaxed">
            <p>{calc.detail}</p>
            <p className="mt-1 text-[#64748B]">
              {STORE.name}에서는 연식·소비전력 kWh 대비 가격 효율이 높은 모델 위주로 맞춤 추천해 드립니다.
            </p>
          </div>
        </div>
      </div>
    </ToolCard>
  );
}

/* ------------------------------------------------------------------ */
/*  외부 Export 진입점                                                  */
/* ------------------------------------------------------------------ */
export function GuideInteractiveTool({ slug }: { slug: string }): React.ReactElement | null {
  const kind = SLUG_TO_TOOL[slug];
  if (!kind) return null;

  switch (kind) {
    case "aircon-sizing":
      return <AirconSizingTool />;
    case "power-contract":
      return <PowerContractTool />;
    case "clearance-entry":
      return <ClearanceEntryTool />;
    case "energy-payback":
      return <EnergyPaybackTool />;
  }
}
