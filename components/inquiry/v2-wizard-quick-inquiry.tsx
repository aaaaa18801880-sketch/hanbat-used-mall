// 파일 경로: components/inquiry/v2-wizard-quick-inquiry.tsx
"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  formatPhone,
  formatStructuredInquiryDescription,
  INQUIRY_TYPES,
  isValidPhone,
  MAX_PHOTOS,
  PRODUCT_CATEGORIES,
  smsHref,
  STORAGE_BUCKETS,
  STORE,
  trackEvent,
  type InquiryTypeValue,
  validateImageFiles,
} from "../../lib/site";
import { compressAndUploadProductImages } from "../../lib/product-ops";
import { Icon, ICON, SafeImg } from "../../lib/ui";
import { type LinkedProductContext } from "./unified-inquiry-form";

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
  fixedType,
  hideTypeSelector = false,
  linkedProduct = null,
  variant = "card",
  onSuccess,
}: {
  defaultType?: InquiryTypeValue;
  fixedType?: InquiryTypeValue;
  hideTypeSelector?: boolean;
  linkedProduct?: LinkedProductContext | null;
  variant?: "card" | "embedded";
  onSuccess?: () => void;
}) {
  const initialType = fixedType || defaultType;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inquiryType, setInquiryType] = useState<InquiryTypeValue>(initialType);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    linkedProduct?.category || PRODUCT_CATEGORIES[0],
  ]);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [memo, setMemo] = useState(linkedProduct?.productTitle || "");

  /* 사진 첨부 상태 (최대 3장) */
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  /* 3단계 연락처 상태 */
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;

    const remaining = MAX_PHOTOS - selectedFiles.length;
    if (remaining <= 0) {
      toast.error(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있습니다.`);
      return;
    }

    const { ok, error } = validateImageFiles(picked, remaining);
    if (error) toast.error(error);
    if (ok.length === 0) return;

    setSelectedFiles((prev) => [...prev, ...ok]);
    setFilePreviews((prev) => [
      ...prev,
      ...ok.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
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
      // 1. 사진 업로드 처리 (선택 첨부된 파일이 있는 경우)
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        uploadedUrls = await compressAndUploadProductImages(selectedFiles, {
          maxWidth: 1400,
          quality: 0.8,
          bucket: STORAGE_BUCKETS.inquiries,
          prefix: "inq",
        });
      }

      // 2. 구조화 본문 생성
      const catSummary = selectedCategories.join(" · ");
      const autoTitle = `[${inquiryType}] ${catSummary} 견적 신청`;
      const chipLine =
        selectedChips.length > 0
          ? `• 선택 조건: ${selectedChips.join(", ")}`
          : "";
      const bodyContent = [
        `• 선택 품목: ${catSummary}`,
        chipLine,
        memo.trim() ? `• 상세 메모: ${memo.trim()}` : "",
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
          images: uploadedUrls,
          is_notice: false,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "접수 중 오류가 발생했습니다.");
      }

      trackEvent("submit_inquiry_success", {
        inquiry_type: inquiryType,
        has_photos: uploadedUrls.length > 0,
      });

      toast.success(
        inquiryType === "내 물건 팔기"
          ? "매입 견적 신청이 정상 접수되었습니다!"
          : "견적 상담 접수가 정상 완료되었습니다!"
      );
      setStep(1);
      setMemo("");
      setSelectedFiles([]);
      setFilePreviews([]);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "접수에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isSell = inquiryType === "내 물건 팔기";

  return (
    <div className={variant === "embedded" ? "" : "space-y-4"}>
      <form
        onSubmit={handleWizardSubmit}
        className={
          variant === "embedded"
            ? "space-y-5"
            : "rounded-xl border border-[#E5E2DC] bg-white p-4 sm:p-6 space-y-5 shadow-2xs"
        }
      >
        {/* 상단 스텝 프로그레스 바 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-hb-xs font-extrabold">
            <span className="text-[#D9531E]">{step}단계 / 3단계</span>
            <span className="text-[#646E7E]">
              {step === 1
                ? isSell
                  ? "처분하실 품목을 선택해 주세요"
                  : "상담 목적과 품목을 선택해 주세요"
                : step === 2
                ? "사진 첨부(선택)와 지역·현장 조건을 확인해 주세요"
                : "연락받을 번호만 입력하면 완료됩니다"}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0EDE7]">
            <div
              style={{ width: `${(step / 3) * 100}%` }}
              className="h-full bg-[#0E1A2B] transition-all duration-300"
            />
          </div>
        </div>

        {/* STEP 1: 상담 유형 & 품목 선택 */}
        {step === 1 && (
          <div className="space-y-4">
            {!hideTypeSelector && !fixedType && (
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
                        className={`h-12 rounded-xl border px-3 text-hb-sm font-extrabold transition-all cursor-pointer ${
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
            )}

            <div>
              <span className="hb-label mb-2">
                {hideTypeSelector || fixedType
                  ? "1. 처분하실 품목을 모두 선택해 주세요 (복수 선택)"
                  : "2. 해당되는 품목을 모두 선택해 주세요 (복수 선택)"}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRODUCT_CATEGORIES.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`flex h-11 items-center justify-between rounded-lg border px-3 text-hb-sm font-bold transition-all cursor-pointer ${
                        active
                          ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E]"
                          : "border-[#E5E2DC] bg-white text-[#3E4756] hover:border-[#0E1A2B]"
                      }`}
                    >
                      <span>{cat}</span>
                      <span>{active ? "✓" : "+"}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-[#E5E2DC]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="hb-btn-primary h-11 px-7 text-hb-sm w-full sm:w-auto"
              >
                <span>다음 단계 (사진 및 조건 선택)</span>
                <Icon d={ICON.arrow} className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: 사진 첨부(선택) + 현장 조건 칩 + 지역 입력 */}
        {step === 2 && (
          <div className="space-y-4">
            {/* 사진 첨부 섹션 (한 화면 직접 내장) */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="hb-label">
                  {hideTypeSelector || fixedType
                    ? "2. 제품 사진 첨부 (선택, 최대 3장)"
                    : "3. 제품 사진 첨부 (선택, 최대 3장)"}
                </span>
                <span className="text-hb-xs text-[#646E7E]">
                  {selectedFiles.length} / {MAX_PHOTOS}장
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {filePreviews.map((src, i) => (
                  <div
                    key={src}
                    className="relative aspect-square w-20 sm:w-24 overflow-hidden rounded-lg border border-[#E5E2DC] bg-[#F0EDE7] shrink-0"
                  >
                    <SafeImg
                      src={src}
                      alt={`선택 사진 ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(i)}
                      aria-label="사진 제거"
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/75 text-white hover:bg-red-600 transition-colors"
                    >
                      <Icon d={ICON.close} className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {selectedFiles.length < MAX_PHOTOS && (
                  <label className="flex aspect-square w-20 sm:w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D7D2C8] bg-[#FAF9F7] text-hb-xs font-semibold text-[#667085] hover:border-[#D9531E] hover:text-[#D9531E] transition-colors shrink-0">
                    <Icon d={ICON.camera} className="w-5 h-5 text-[#858076]" />
                    <span className="mt-1">+ 사진 추가</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
              <p className="mt-2 text-hb-xs text-[#646E7E]">
                제품 전면 또는 모델명 명판 스티커 사진을 첨부하시면 가장 신속하고 정확한 견적을 받으실 수 있습니다. (생략 가능)
              </p>
            </div>

            {/* 현장 조건 칩 */}
            <div>
              <span className="hb-label mb-2">
                {hideTypeSelector || fixedType
                  ? "3. 해당되는 수거·현장 조건을 선택해 주세요 (선택)"
                  : "4. 해당되는 현장 조건을 선택해 주세요 (선택)"}
              </span>
              <div className="flex flex-wrap gap-2">
                {WIZARD_ENV_CHIPS[inquiryType].map((chip) => {
                  const active = selectedChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      className={`h-11 rounded-lg border px-3 text-hb-sm font-bold transition-colors cursor-pointer ${
                        active
                          ? "border-[#D9531E] bg-[#FFF5F0] text-[#D9531E]"
                          : "border-[#E5E2DC] bg-[#FAF9F7] text-[#3E4756] hover:border-[#0E1A2B]"
                      }`}
                    >
                      {active ? `✓ ${chip}` : `+ ${chip}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 지역 및 간단 메모 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="hb-label">
                  {isSell ? "방문 수거 지역 (구/동 단위 권장)" : "배송/설치 지역 (동 단위 권장)"}
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
                <label className="hb-label">
                  간단 메모 (희망 일정·세부 모델 등)
                </label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="예: 금요일 오후 희망 / 삼성 4도어 냉장고"
                  className="hb-input mt-1 h-11"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#E5E2DC]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="hb-btn-outline h-11 px-5 text-hb-sm"
              >
                ← 이전
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="hb-btn-primary h-11 px-7 text-hb-sm"
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
            <div className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-3 text-hb-xs text-[#3E4756]">
              <strong className="text-[#0E1A2B]">선택 요약:</strong> [{inquiryType}] {selectedCategories.join(", ")}{" "}
              {selectedChips.length > 0 && `(${selectedChips.join(", ")})`}{" "}
              {selectedFiles.length > 0 && `· 사진 ${selectedFiles.length}장 첨부됨`}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="hb-label">성함 / 상호명 *</label>
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
                <label className="hb-label">연락처 *</label>
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
                <label className="hb-label">조회 비밀번호(4자+) *</label>
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

            <label className="flex items-center gap-2 text-hb-xs text-[#4B5260] cursor-pointer select-none">
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
                className="hb-btn-outline h-11 px-4 text-hb-sm"
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
                  className="hb-btn-outline h-11 px-4 text-hb-sm"
                >
                  <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#D9531E]" />
                  <span>문자로 바로 전송</span>
                </a>
                <button
                  type="submit"
                  disabled={submitting}
                  className="hb-btn-accent h-11 px-7 text-hb-sm font-extrabold"
                >
                  {submitting
                    ? "접수 중..."
                    : isSell
                    ? "매입 견적 신청 완료하기"
                    : "견적 문의 완료하기"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
