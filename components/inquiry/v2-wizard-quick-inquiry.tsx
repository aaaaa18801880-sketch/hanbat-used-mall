// 파일 경로: components/inquiry/v2-wizard-quick-inquiry.tsx
"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  formatPhone,
  formatStructuredInquiryDescription,
  INQUIRY_TYPES,
  isValidPhone,
  PRODUCT_CATEGORIES,
  smsHref,
  STORE,
  trackEvent,
  type InquiryTypeValue,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";
import {
  UnifiedInquiryForm,
  type LinkedProductContext,
} from "./unified-inquiry-form";

const WIZARD_ENV_CHIPS: Record<InquiryTypeValue, readonly string[]> = {
  "구매 문의": [
    "1층 / 엘리베이터 있음",
    "2층 이상 계단",
    "기존 가전 동시수거(보상매입)",
    "이번 주 내 배송 희망",
  ],
  "내 물건 팔기": [
    "정상 작동 확인됨",
    "1층 / 엘리베이터 있음",
    "매장·원룸 일괄 정리",
    "빠른 방문수거 희망",
  ],
  "대량·업소용 상담": [
    "식당·카페 오픈 세팅",
    "단상 220V",
    "삼상 380V",
    "전자세금계산서 발행",
    "폐업 설비 일괄철거·매입",
  ],
  "기타 문의": ["A/S 보증 문의", "배송 일정 문의", "세금계산서·결제 문의"],
};

export function V2InquirySectionWithWizard({
  defaultType = "구매 문의",
  linkedProduct = null,
  onSuccess,
}: {
  defaultType?: InquiryTypeValue;
  linkedProduct?: LinkedProductContext | null;
  onSuccess?: () => void;
}) {
  // 기본은 기존 올인원 상세 폼과 30초 위저드 모드 중 선택 가능 (상품 연동 시 상세 폼 우선)
  const [formMode, setFormMode] = useState<"wizard" | "full">("wizard");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inquiryType, setInquiryType] = useState<InquiryTypeValue>(defaultType);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    PRODUCT_CATEGORIES[0],
  ]);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [memo, setMemo] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.length > 1
          ? prev.filter((c) => c !== cat)
          : prev
        : [...prev, cat]
    );
  };

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      toast.error("성함 또는 상호명을 입력해 주세요.");
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error("올바른 연락처를 입력해 주세요.");
      return;
    }
    if (password.trim().length < 4) {
      toast.error("조회용 비밀번호 4자리 이상을 입력해 주세요.");
      return;
    }
    if (!agreed) {
      toast.error("개인정보 수집·이용에 동의해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const catSummary = selectedCategories.join(" · ");
      const autoTitle = `[${inquiryType}] ${catSummary} 상담 신청`;
      const chipLine =
        selectedChips.length > 0
          ? `• 선택 조건: ${selectedChips.join(", ")}`
          : "";
      const bodyContent = [
        `• 선택 품목: ${catSummary}`,
        chipLine,
        memo.trim() ? `• 추가 메모: ${memo.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const structuredDescription = formatStructuredInquiryDescription({
        inquiryType,
        customerContent: bodyContent,
        applianceCategory: selectedCategories[0],
        region: region.trim() || "대전/충청",
      });

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          password: password.trim(),
          inquiry_type: inquiryType,
          category: autoTitle,
          region: region.trim() || "대전/기타",
          description: structuredDescription,
          images: [],
          is_notice: false,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "접수 중 오류가 발생했습니다.");
      }

      trackEvent("submit_inquiry_success", {
        inquiry_type: inquiryType,
        has_photos: false,
      });
      toast.success("30초 간편 상담 접수가 완료되었습니다!");
      setStep(1);
      setMemo("");
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "접수에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 모드 전환 헤더: 30초 터치 위저드 vs 사진 AI 분석·전체 상세 폼 */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-2.5">
        <span className="px-2 text-[12.5px] font-bold text-[#0E1A2B]">
          편하신 작성 방식을 선택하세요
        </span>
        <div className="inline-grid grid-cols-2 rounded-lg bg-[#E5E2DC] p-1">
          <button
            type="button"
            onClick={() => setFormMode("wizard")}
            className={`rounded-md px-3 py-1.5 text-[12px] font-extrabold transition-all ${
              formMode === "wizard"
                ? "bg-[#0E1A2B] text-white shadow-2xs"
                : "text-[#3E4756] hover:text-[#0E1A2B]"
            }`}
          >
            ⚡ 30초 터치 간편접수
          </button>
          <button
            type="button"
            onClick={() => setFormMode("full")}
            className={`rounded-md px-3 py-1.5 text-[12px] font-extrabold transition-all ${
              formMode === "full"
                ? "bg-[#D9531E] text-white shadow-2xs"
                : "text-[#3E4756] hover:text-[#0E1A2B]"
            }`}
          >
            📷 사진 AI 분석 · 상세입력
          </button>
        </div>
      </div>

      {formMode === "full" || linkedProduct?.productTitle ? (
        <UnifiedInquiryForm
          defaultType={defaultType}
          linkedProduct={linkedProduct}
          onSuccess={() => onSuccess?.()}
        />
      ) : (
        <form
          onSubmit={handleWizardSubmit}
          className="rounded-xl border border-[#E5E2DC] bg-white p-4 sm:p-6 space-y-5 shadow-2xs"
        >
          {/* 상단 스텝 프로그레스 바 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px] font-extrabold">
              <span className="text-[#D9531E]">STEP {step} / 3</span>
              <span className="text-[#646E7E]">
                {step === 1
                  ? "상담 목적과 품목을 터치해 주세요"
                  : step === 2
                  ? "현장 조건과 지역을 선택해 주세요"
                  : "연락받을 번호만 입력하면 끝납니다"}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0EDE7]">
              <div
                style={{ width: `${(step / 3) * 100}%` }}
                className="h-full bg-[#0E1A2B] transition-all duration-300"
              />
            </div>
          </div>

          {/* STEP 1: 상담 유형 & 품목 터치 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <span className="hb-label mb-2">1. 어떤 상담이 필요하신가요?</span>
                <div className="grid grid-cols-2 gap-2">
                  {INQUIRY_TYPES.map((t) => {
                    const active = inquiryType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setInquiryType(t);
                          setSelectedChips([]);
                        }}
                        className={`h-12 rounded-xl border px-3 text-[13.5px] font-extrabold transition-all ${
                          active
                            ? "border-[#0E1A2B] bg-[#0E1A2B] text-white shadow-2xs"
                            : "border-[#E5E2DC] bg-[#FAF9F7] text-[#0E1A2B] hover:border-[#0E1A2B]"
                        }`}
                      >
                        {t === "내 물건 팔기" ? "가전 팔기(방문매입)" : t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="hb-label mb-2">
                  2. 해당되는 품목을 모두 터치해 주세요 (복수 선택)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRODUCT_CATEGORIES.map((cat) => {
                    const active = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-[13px] font-bold transition-all ${
                          active
                            ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E]"
                            : "border-[#E5E2DC] bg-white text-[#3E4756]"
                        }`}
                      >
                        <span>{cat}</span>
                        <span>{active ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="hb-btn-primary h-12 px-8 text-[14.5px] w-full sm:w-auto"
                >
                  <span>다음 단계 (조건 선택)</span>
                  <Icon d={ICON.arrow} className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: 현장 조건 칩 & 지역 입력 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <span className="hb-label mb-2">
                  3. 해당되는 현장 조건을 터치해 주세요 (선택)
                </span>
                <div className="flex flex-wrap gap-2">
                  {WIZARD_ENV_CHIPS[inquiryType].map((chip) => {
                    const active = selectedChips.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleChip(chip)}
                        className={`rounded-lg border px-3 py-2 text-[13px] font-bold transition-colors ${
                          active
                            ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E]"
                            : "border-[#E5E2DC] bg-[#FAF9F7] text-[#3E4756]"
                        }`}
                      >
                        {active ? `✓ ${chip}` : `+ ${chip}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="hb-label text-[13px]">
                    지역 (동 단위 권장)
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="예: 대전 중구 중촌동 / 서구 둔산동"
                    className="hb-input mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="hb-label text-[13px]">
                    간단 메모 (희망 모델·예산·일정 등)
                  </label>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="예: 금요일 오후 희망 / 45박스 냉장고"
                    className="hb-input mt-1 h-11"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="hb-btn-outline h-11 px-5 text-[13.5px]"
                >
                  ← 이전
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="hb-btn-primary h-11 px-7 text-[14px]"
                >
                  <span>다음 단계 (연락처 입력)</span>
                  <Icon d={ICON.arrow} className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: 연락처 입력 및 완료 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-3 text-[12.5px] text-[#3E4756]">
                <strong className="text-[#0E1A2B]">선택 요약:</strong> [
                {inquiryType}] {selectedCategories.join(", ")}{" "}
                {selectedChips.length > 0 && `(${selectedChips.join(", ")})`}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="hb-label text-[13px]">
                    성함 / 상호명 *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동 / 한밭식당"
                    className="hb-input mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="hb-label text-[13px]">연락처 *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="010-0000-0000"
                    className="hb-input mt-1 h-11 tabular-nums"
                  />
                </div>
                <div>
                  <label className="hb-label text-[13px]">
                    조회 비밀번호(4자+) *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="내 글 확인용"
                    className="hb-input mt-1 h-11"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-[12.5px] text-[#4B5260] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CFCAC0] accent-[#0E1A2B]"
                />
                <span>상담 안내를 위한 개인정보 수집·이용에 동의합니다.</span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="hb-btn-outline h-11 px-4 text-[13px]"
                >
                  ← 이전
                </button>

                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <a
                    href={smsHref(
                      STORE.mobile,
                      `[한밭중고전자 ${inquiryType}] 품목: ${selectedCategories.join(
                        ", "
                      )} / 조건: ${selectedChips.join(", ")} 문의드립니다.`
                    )}
                    className="hb-btn-outline h-11 px-4 text-[13px]"
                  >
                    ✉️ 문자로 바로 전송
                  </a>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="hb-btn-accent h-11 px-7 text-[14.5px] font-extrabold"
                  >
                    {submitting ? "접수 중..." : "상담 신청 완료하기"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
