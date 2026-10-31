// 파일 경로: components/inquiry/v2-wizard-quick-inquiry.tsx
"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  compressImage,
  formatPhone,
  formatQuoteBasketSummary,
  formatStructuredInquiryDescription,
  getQuoteBasket,
  INQUIRY_TYPES,
  isValidPhone,
  MAX_PHOTOS,
  PRODUCT_CATEGORIES,
  type QuoteBasketItem,
  smsHref,
  STORAGE_BUCKETS,
  STORE,
  trackEvent,
  type InquiryTypeValue,
  validateImageFiles,
} from "../../lib/site";
import { compressAndUploadProductImages } from "../../lib/product-ops";
import { Icon, ICON, Modal, SafeImg } from "../../lib/ui";
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

const PHOTO_GUIDE_DATA: Record<
  InquiryTypeValue,
  {
    subtitle: string;
    image: string;
    tip: string;
    steps: readonly { step: string; title: string; desc: string }[];
  }
> = {
  "내 물건 팔기": {
    subtitle: "KC인증 라벨 및 제조년월 확인 필수",
    image: "/images/ai-photo-guide.png",
    tip: "팁: 제조년월과 모델명이 표기된 명판 스티커를 선명하게 찍어주시면 방문 전 100% 확정 매입 견적을 산출해 드립니다.",
    steps: [
      {
        step: "01",
        title: "정면 전체 샷",
        desc: "제품 외관과 도어 형태가 한눈에 보이게 촬영",
      },
      {
        step: "02",
        title: "모델명·제조년월 명판",
        desc: "에너지효율등급 또는 정격 라벨 스티커 근접 촬영",
      },
      {
        step: "03",
        title: "특이사항·반출 동선",
        desc: "흠집 부위나 계단·엘리베이터 등 참고 사진",
      },
    ],
  },
  "구매 문의": {
    subtitle: "희망 제품 및 설치 공간 확인 권장",
    image: "/images/photo-guide-buy.jpg",
    tip: "팁: 들어갈 자리 사진이나 기존 가전 사진을 올려주시면 규격 적합 여부 및 사다리차 필요 여부를 사전에 안내해 드립니다.",
    steps: [
      {
        step: "01",
        title: "원하는 제품·모델",
        desc: "찾으시는 가전 사진 또는 희망 모델명",
      },
      {
        step: "02",
        title: "설치할 공간 전경",
        desc: "제품이 들어갈 자리와 가로·세로 여유 공간",
      },
      {
        step: "03",
        title: "주변 환경·반입 동선",
        desc: "콘센트(단상/삼상), 배관, 현관문 폭 등",
      },
    ],
  },
  "대량·업소용 상담": {
    subtitle: "주방 공간 및 분전반 사진 권장",
    image: "/images/photo-guide-bulk.jpg",
    tip: "팁: 분전반(차단기)과 주방 전경 사진을 함께 보내주시면 현장 방문 전 가장 최적화된 맞춤 견적과 동선을 제안해 드립니다.",
    steps: [
      {
        step: "01",
        title: "도입/처분 설비 목록",
        desc: "필요한 업소용 장비 목록 또는 기존 장비",
      },
      {
        step: "02",
        title: "매장 분전반·전기",
        desc: "단상(220V) / 삼상(380V) 차단기 용량",
      },
      {
        step: "03",
        title: "주방 공간·반입 동선",
        desc: "설치할 주방 자리와 급배수·출입구 전경",
      },
    ],
  },
  "기타 문의": {
    subtitle: "문의 부위 및 현장 확인 사진",
    image: "/images/ai-photo-guide.png",
    tip: "팁: 현장 사진이나 제품 상태 사진을 첨부해 주시면 담당자가 빠르게 파악하여 정확히 안내해 드립니다.",
    steps: [
      {
        step: "01",
        title: "제품 및 현장 사진",
        desc: "확인이 필요한 제품 외관 및 증상 부위",
      },
      {
        step: "02",
        title: "모델명 라벨",
        desc: "제품 측면/후면의 모델명 표기 스티커",
      },
      {
        step: "03",
        title: "기타 참고 자료",
        desc: "배송지 환경 또는 참고 서류 사진",
      },
    ],
  },
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
  const initialMemo = linkedProduct?.productTitle
    ? linkedProduct.modelName
      ? `${linkedProduct.productTitle} (${linkedProduct.modelName})`
      : linkedProduct.productTitle
    : linkedProduct?.modelName
    ? `모델명: ${linkedProduct.modelName}`
    : "";
  const [memo, setMemo] = useState(
    linkedProduct?.envNote
      ? initialMemo
        ? `[선택한 설치조건: ${linkedProduct.envNote}]\n${initialMemo}`
        : `[선택한 설치조건: ${linkedProduct.envNote}]`
      : initialMemo
  );
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [basketItems, setBasketItems] = useState<QuoteBasketItem[]>([]);
  const [aiResult, setAiResult] = useState<{
    applianceCategory?: string;
    title?: string;
    modelNumber?: string;
    summaryNote?: string;
  } | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setBasketItems(getQuoteBasket());
    });
  }, []);

  useEffect(() => {
    if (!linkedProduct) return;

    queueMicrotask(() => {
      if (
        linkedProduct.category &&
        (PRODUCT_CATEGORIES as readonly string[]).includes(linkedProduct.category)
      ) {
        setSelectedCategories([linkedProduct.category]);
      }

      if (linkedProduct.useBundle) {
        const items = getQuoteBasket();
        if (items.length > 0) {
          const bundleLines = items
            .map(
              (it, idx) =>
                `${idx + 1}. [${it.category}] ${it.title} (수량: ${it.quantity || 1}대)`
            )
            .join("\n");
          setMemo(
            `[견적함 묶음 문의 - 총 ${items.length}개 품목]\n${bundleLines}`
          );
          const cats = Array.from(
            new Set(items.map((it) => it.category).filter(Boolean))
          );
          if (cats.length > 0) {
            setSelectedCategories(cats);
          }
        }
      } else if (linkedProduct.productTitle) {
        const text = linkedProduct.modelName
          ? `${linkedProduct.productTitle} (${linkedProduct.modelName})`
          : linkedProduct.productTitle;
        setMemo((prev) => {
          if (!prev) return text;
          if (!prev.includes(linkedProduct.productTitle!))
            return `${text}\n${prev}`;
          return prev;
        });
      }

      if (linkedProduct.envNote) {
        const envText = `[선택한 설치조건: ${linkedProduct.envNote}]`;
        setMemo((prev) => {
          if (!prev) return envText;
          if (!prev.includes(linkedProduct.envNote!))
            return `${envText}\n${prev}`;
          return prev;
        });
        setSelectedChips((prev) =>
          prev.includes(linkedProduct.envNote!)
            ? prev
            : [...prev, linkedProduct.envNote!]
        );
      }
    });
  }, [linkedProduct]);

  /* 사진 첨부 상태 (최대 3장) */
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  /* 3단계 연락처 상태 */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* 촬영 참고 가이드 토글 및 확대 보기 상태 */
  const [showGuide, setShowGuide] = useState(false);
  const [zoomGuide, setZoomGuide] = useState(false);
  const guideInfo =
    PHOTO_GUIDE_DATA[inquiryType] || PHOTO_GUIDE_DATA["내 물건 팔기"];

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

  const handleAiPhotoAnalyze = async () => {
    if (selectedFiles.length === 0 || analyzingAi) return;
    setAnalyzingAi(true);
    const toastId = toast.loading(
      "첨부된 사진을 AI가 분석하여 품목과 모델명을 추출 중입니다..."
    );
    try {
      const formData = new FormData();
      formData.append("inquiryType", inquiryType);
      formData.append("userTitle", memo);
      formData.append("userDescription", memo);
      formData.append("userRegion", region);

      for (const file of selectedFiles.slice(0, MAX_PHOTOS)) {
        const compressedBlob = await compressImage(file, 1280, 0.8);
        const optimizedFile = new File([compressedBlob], file.name, {
          type: "image/jpeg",
        });
        formData.append("files", optimizedFile);
      }

      const res = await fetch("/api/analyze-inquiry", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "AI 사진 분석에 실패했습니다.");
      }

      setAiResult({
        applianceCategory: data.applianceCategory,
        title: data.title,
        modelNumber: data.modelNumber,
        summaryNote:
          data.summaryNote ||
          (data.estimatedYear ? `연식: ${data.estimatedYear}` : undefined),
      });

      if (
        data.applianceCategory &&
        (PRODUCT_CATEGORIES as readonly string[]).includes(data.applianceCategory)
      ) {
        setSelectedCategories((prev) =>
          prev.includes(data.applianceCategory)
            ? prev
            : [data.applianceCategory, ...prev]
        );
      }

      const aiDetails: string[] = [];
      if (data.title) aiDetails.push(data.title);
      if (data.modelNumber) aiDetails.push(`모델명: ${data.modelNumber}`);
      if (data.summaryNote) aiDetails.push(data.summaryNote);
      else if (data.estimatedYear) aiDetails.push(`연식: ${data.estimatedYear}`);
      if (aiDetails.length > 0) {
        const aiText = `[AI 사진 판독: ${aiDetails.join(" / ")}]`;
        setMemo((prev) => (prev ? `${aiText}\n${prev}` : aiText));
      }

      toast.success(
        "AI 사진 판독 완료! 품목과 상세 정보가 자동으로 채워졌습니다.",
        { id: toastId }
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "AI 사진 분석에 실패했습니다.",
        { id: toastId }
      );
    } finally {
      setAnalyzingAi(false);
    }
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
          bucket: STORAGE_BUCKETS.inquiryAttachments,
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
        linkedProductUrl: linkedProduct?.productId
          ? `${STORE.url}/${linkedProduct.productId}`
          : undefined,
        modelNumber: linkedProduct?.modelName || undefined,
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
        {/* 모던 스텝퍼(Stepper) UI */}
        <div className="space-y-3 pb-2 border-b border-[#E5E2DC]">
          <div className="flex items-center justify-between text-hb-xs font-extrabold">
            <span className="text-[#B5431A]">{step}단계 / 3단계</span>
            <span className="text-[#646E7E]">
              {step === 1
                ? isSell
                  ? "처분하실 품목을 선택해 주세요"
                  : "상담 목적과 품목을 선택해 주세요"
                : step === 2
                ? "제품 사진 첨부 및 촬영 가이드 확인 (생략 가능)"
                : "수거·현장 조건과 연락처를 입력해 주세요"}
            </span>
          </div>

          {/* 3단계 스텝퍼 번호/체크 아이콘 인디케이터 */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { num: 1, label: "상담 유형·품목" },
              { num: 2, label: "사진·가이드" },
              { num: 3, label: "현장조건·접수" },
            ].map((s) => {
              const isPast = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div
                  key={s.num}
                  className={`flex items-center gap-2 rounded-lg p-2 transition-all ${
                    isCurrent
                      ? "bg-[#0E1A2B] text-white"
                      : isPast
                      ? "bg-[#FFF5F0] text-[#B5431A] border border-[#FED7AA]"
                      : "bg-[#F7F5F0] text-[#6E675C]"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-hb-xs font-bold ${
                      isCurrent
                        ? "bg-[#FF8A50] text-[#0E1A2B]"
                        : isPast
                        ? "bg-[#B5431A] text-white"
                        : "bg-[#E5E2DC] text-[#646E7E]"
                    }`}
                  >
                    {isPast ? (
                      <Icon d={ICON.check} className="w-3.5 h-3.5" />
                    ) : (
                      s.num
                    )}
                  </span>
                  <span className="truncate text-hb-xs font-bold">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F0EDE7]">
            <div
              style={{ width: `${(step / 3) * 100}%` }}
              className="h-full bg-[#0E1A2B] transition-all duration-300"
            />
          </div>
        </div>

        {/* STEP 1: 상담 유형 & 품목 선택 */}
        {step === 1 && (
          <div className="space-y-4">
            {basketItems.length > 0 && (
              <div className="rounded-lg border border-[#3B82F6]/30 bg-[#EFF6FF] p-3 text-hb-xs text-[#1E3A8A] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Icon d={ICON.bag} className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span>
                    견적함에 담긴 관심 매물 {basketItems.length}건을 문의 내용에 자동 반영하기
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const summary = formatQuoteBasketSummary(basketItems);
                    if (summary.hasCommercialItem) {
                      setInquiryType("대량·업소용 상담");
                    }
                    if (summary.autoDescription) {
                      setMemo(summary.autoDescription);
                    }
                    const cats = Array.from(
                      new Set(basketItems.map((it) => it.category).filter(Boolean))
                    );
                    if (cats.length > 0) {
                      setSelectedCategories(cats);
                    }
                    toast.success("견적함 매물이 문의 내용에 자동 반영되었습니다.");
                  }}
                  className="hb-btn-outline h-7 px-2.5 text-hb-xs font-bold bg-white text-[#1D4ED8] hover:bg-blue-50 border-[#93C5FD] cursor-pointer"
                >
                  견적함 자동 반영
                </button>
              </div>
            )}

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
                          ? "border-[#D9531E] bg-[#FFF5F0] text-[#B5431A] ring-1 ring-[#D9531E]"
                          : "border-[#E5E2DC] bg-white text-[#3E4756] hover:border-[#0E1A2B]"
                      }`}
                    >
                      <span>{cat}</span>
                      <Icon
                        d={active ? ICON.check : ICON.plus}
                        className="w-3.5 h-3.5 shrink-0"
                      />
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
                <span>다음 단계 (사진 첨부)</span>
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
                  <label className="flex aspect-square w-20 sm:w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D7D2C8] bg-[#FAF9F7] text-hb-xs font-semibold text-[#596273] hover:border-[#D9531E] hover:text-[#B5431A] transition-colors shrink-0">
                    <Icon d={ICON.camera} className="w-5 h-5 text-[#6E675C]" />
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

              {selectedFiles.length > 0 && (
                <div className="mt-2.5 space-y-2">
                  <button
                    type="button"
                    onClick={handleAiPhotoAnalyze}
                    disabled={analyzingAi}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B82F6]/30 bg-[#EFF6FF] px-3.5 py-2 text-hb-xs font-bold text-[#1D4ED8] hover:bg-[#DBEAFE] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <Icon d={ICON.sparkles} className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {analyzingAi
                        ? "AI 사진 판독 및 품목 분석 중..."
                        : "AI 사진 판독으로 품목·모델명 자동입력"}
                    </span>
                  </button>

                  {aiResult && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-hb-xs text-emerald-800 flex items-start gap-2">
                      <Icon
                        d={ICON.check}
                        className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                      />
                      <div className="leading-relaxed">
                        <strong className="font-bold text-emerald-900">
                          AI 판독 결과 적용됨:
                        </strong>{" "}
                        {[
                          aiResult.applianceCategory,
                          aiResult.title,
                          aiResult.modelNumber,
                          aiResult.summaryNote,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="mt-2 text-hb-xs text-[#646E7E]">
                제품 전면 또는 모델명 명판 스티커 사진을 첨부하시면 가장 신속하고 정확한 견적을 받으실 수 있습니다. (생략 가능)
              </p>

              {/* 권장 촬영 참고 사진 가이드 (실제 예시 그래픽 + 3단계 요약 카드 + 라이트박스 확대) */}
              <div className="mt-3 overflow-hidden rounded-xl border border-[#E5E2DC] bg-[#FAF9F7]">
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-[#E5E2DC]">
                  <div className="flex items-center gap-1.5 text-hb-xs font-bold text-[#0E1A2B]">
                    <Icon d={ICON.camera} className="w-3.5 h-3.5 text-[#B5431A]" />
                    <span>권장 촬영 참고 사진</span>
                    <span className="text-[#6E675C] font-normal hidden sm:inline">
                      · {guideInfo.subtitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoomGuide(true)}
                      className="hb-btn-outline h-7 px-2.5 text-hb-xs font-bold text-[#0E1A2B] hover:border-[#0E1A2B]"
                    >
                      크게 보기
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGuide((prev) => !prev)}
                      className="rounded p-1 text-[#646E7E] hover:text-[#0E1A2B]"
                      aria-label={showGuide ? "가이드 접기" : "가이드 펼치기"}
                    >
                      <Icon
                        d={showGuide ? ICON.up : ICON.down}
                        className="w-4 h-4"
                      />
                    </button>
                  </div>
                </div>

                {showGuide && (
                  <div>
                    {/* 실제 촬영 예시 배너 이미지 */}
                    <button
                      type="button"
                      onClick={() => setZoomGuide(true)}
                      className="group relative block w-full overflow-hidden bg-white text-left focus:outline-none cursor-zoom-in border-b border-[#E5E2DC]"
                      aria-label="권장 촬영 예시 사진 원본 크게 보기"
                    >
                      <SafeImg
                        src={guideInfo.image}
                        alt="권장 촬영 예시 사진 가이드"
                        className="w-full max-h-[170px] sm:max-h-[200px] object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
                      />
                    </button>

                    {/* 3단계 촬영 포인트 안내 카드 */}
                    <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-[#FAF9F7] text-hb-xs">
                      {guideInfo.steps.map((g) => (
                        <li
                          key={g.step}
                          className="flex items-start gap-2 rounded-lg bg-white p-2.5 border border-[#E5E2DC]"
                        >
                          <span className="shrink-0 rounded bg-[#0E1A2B] px-1.5 py-0.5 text-hb-xs font-extrabold text-white">
                            {g.step}
                          </span>
                          <div className="min-w-0 flex-1">
                            <strong className="font-bold text-[#0E1A2B] block">
                              {g.title}
                            </strong>
                            <span className="text-[#646E7E] leading-relaxed block mt-0.5">
                              {g.desc}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ol>

                    {/* 하단 팁 */}
                    <div className="px-3 pb-3 pt-0">
                      <p className="rounded-lg bg-white p-2.5 border border-[#E5E2DC] text-hb-xs text-[#4B5260] leading-relaxed">
                        {guideInfo.tip}
                      </p>
                    </div>
                  </div>
                )}
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
                <span>다음 단계 (조건 및 연락처 입력)</span>
                <Icon d={ICON.arrow} className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 현장 조건 + 지역/메모 + 연락처 입력 및 완료 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-3 text-hb-xs text-[#3E4756] flex flex-wrap items-center justify-between gap-1.5">
              <div>
                <strong className="text-[#0E1A2B]">선택 요약:</strong> [{inquiryType}] {selectedCategories.join(", ")}
                {selectedFiles.length > 0
                  ? ` · 사진 ${selectedFiles.length}장 첨부됨`
                  : " · 사진 미첨부"}
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-hb-xs text-[#646E7E] underline hover:text-[#0E1A2B]"
              >
                사진 수정
              </button>
            </div>

            {/* 1. 현장 조건 칩 */}
            <div>
              <span className="hb-label mb-2">
                {isSell
                  ? "1. 해당되는 수거·현장 조건을 선택해 주세요 (선택)"
                  : "1. 해당되는 현장·배송 조건을 선택해 주세요 (선택)"}
              </span>
              <div className="flex flex-wrap gap-2">
                {WIZARD_ENV_CHIPS[inquiryType].map((chip) => {
                  const active = selectedChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      className={`h-11 inline-flex items-center gap-1.5 rounded-lg border px-3 text-hb-sm font-bold transition-all cursor-pointer ${
                        active
                          ? "border-[#D9531E] bg-[#FFF5F0] text-[#B5431A] ring-1 ring-[#D9531E]"
                          : "border-[#E5E2DC] bg-[#FAF9F7] text-[#3E4756] hover:border-[#0E1A2B]"
                      }`}
                    >
                      <Icon
                        d={active ? ICON.check : ICON.plus}
                        className="w-3.5 h-3.5 shrink-0"
                      />
                      <span>{chip}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. 지역 및 간단 메모 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="hb-label">
                  {isSell ? "2. 방문 수거 지역 (구/동 단위 권장)" : "2. 배송/설치 지역 (동 단위 권장)"}
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

            {/* 3. 연락처 및 신청자 정보 */}
            <div className="pt-2 border-t border-[#E5E2DC] space-y-2">
              <span className="hb-label">3. 신청자 정보 및 연락처 *</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="hb-label text-[#646E7E]">성함 / 상호명 *</label>
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
                  <label className="hb-label text-[#646E7E]">연락처 *</label>
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
                  <label className="hb-label text-[#646E7E]">조회 비밀번호(4자+) *</label>
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
                ← 이전 (사진)
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
                  <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#B5431A]" />
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

      {zoomGuide && (
        <Modal
          label="권장 촬영 참고 사진 가이드"
          onClose={() => setZoomGuide(false)}
          panelClassName="max-w-3xl w-full"
          overlayClassName="z-[70]"
        >
          <div className="overflow-hidden rounded-xl border border-[#E5E2DC] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E2DC] px-5 py-3.5 bg-[#0E1A2B] text-white">
              <div className="flex items-center gap-2">
                <Icon d={ICON.camera} className="w-4 h-4 text-[#B5431A]" />
                <h3 className="text-hb-sm font-bold text-white">
                  권장 촬영 참고 사진 가이드
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setZoomGuide(false)}
                aria-label="닫기"
                className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Icon d={ICON.close} className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto bg-[#FAF9F7] p-4 flex flex-col items-center gap-3">
              <SafeImg
                src={guideInfo.image}
                alt="권장 촬영 참고 사진 가이드 원본"
                className="max-h-[65vh] w-auto object-contain rounded-lg border border-[#E5E2DC] bg-white shadow-xs"
              />
              <p className="text-hb-xs text-[#646E7E] text-center max-w-lg leading-relaxed">
                {guideInfo.tip}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
