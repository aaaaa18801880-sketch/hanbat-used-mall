// 파일 경로: components/inquiry/v2-wizard-quick-inquiry.tsx
"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  formatPhone,
  clearQuoteBasket,
  formatQuoteBasketSummary,
  formatStructuredInquiryDescription,
  getQuoteBasket,
  revokeObjectUrls,
  type ExtractedFactItem,
  INQUIRY_TYPES,
  isValidPhone,
  MAX_PHOTOS,
  PRODUCT_CATEGORIES,
  smsHref,
  STORE,
  telHref,
  trackEvent,
  type InquiryTypeValue,
} from "../../lib/site";
import { SafeImg, useQuoteBasket } from "../../lib/ui";
import { Icon, ICON } from "../../lib/icons";
import {
  analyzeInquiryPhotos,
  dispatchTelegramFallback,
  INQUIRY_PHOTO_GUIDES,
  postInquirySubmission,
  prepareInquiryFileAdditions,
  uploadInquiryAttachmentsViaSignedUrl,
} from "../../lib/inquiry-client";
import { InquiryPhotoGuideModal } from "./inquiry-photo-guide-modal";
import { type LinkedProductContext } from "./unified-inquiry-form";
import {
  WIZARD_QUICK_REGIONS,
  applyQuickRegion,
  getCategoryMeta,
  getStep1PrimaryCta,
  getStep3Readiness,
  getWizardDisplayStep,
  getWizardProgressPercent,
  getWizardStepCount,
} from "../../lib/purchase-wizard";

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
  const uid = useId();
  const initialType = fixedType || defaultType;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inquiryType, setInquiryType] = useState<InquiryTypeValue>(initialType);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    linkedProduct?.category ? [linkedProduct.category] : []
  );
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
  const basketItems = useQuoteBasket();
  const [bundleApplied, setBundleApplied] = useState(false);
  const [cachedUploadedUrls, setCachedUploadedUrls] = useState<string[] | null>(
    null
  );
  const [aiResult, setAiResult] = useState<{
    applianceCategory?: string;
    title?: string;
    modelNumber?: string;
    conditionGrade?: string;
    summaryNote?: string;
    extractedFacts?: ExtractedFactItem[];
    missingInfo?: string[];
    followUpQuestions?: string[];
  } | null>(null);

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
          setBundleApplied(true);
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
  const previewsRef = useRef<string[]>([]);

  const updateFilePreviews = (
    updater: string[] | ((prev: string[]) => string[])
  ) => {
    const next =
      typeof updater === "function" ? updater(previewsRef.current) : updater;
    previewsRef.current = next;
    setFilePreviews(next);
  };

  useEffect(() => {
    return () => {
      revokeObjectUrls(previewsRef.current);
    };
  }, []);

  /* 3단계 연락처 상태 */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [createdInquiryId, setCreatedInquiryId] = useState<string | null>(null);
  const [submittedTitle, setSubmittedTitle] = useState<string>("");

  /* 촬영 참고 가이드 토글 및 확대 보기 상태 */
  const [showGuide, setShowGuide] = useState(false);
  const [zoomGuide, setZoomGuide] = useState(false);
  const guideInfo =
    INQUIRY_PHOTO_GUIDES[inquiryType] || INQUIRY_PHOTO_GUIDES["내 물건 팔기"];

  const [step1Hint, setStep1Hint] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    setStep1Hint(null);
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const goToPhotoStep = () => {
    const targetStep: 2 | 3 =
      inquiryType === "내 물건 팔기" && selectedFiles.length > 0 ? 3 : 2;
    if (selectedCategories.length === 0) {
      if (inquiryType === "내 물건 팔기") {
        if (
          aiResult?.applianceCategory &&
          (PRODUCT_CATEGORIES as readonly string[]).includes(
            aiResult.applianceCategory
          )
        ) {
          setSelectedCategories([aiResult.applianceCategory]);
          setStep1Hint(null);
          setStep(targetStep);
          return;
        }
        if (selectedFiles.length > 0) {
          setSelectedCategories(["기타"]);
          setStep1Hint(null);
          setStep(targetStep);
          return;
        }
      }
      const msg =
        inquiryType === "내 물건 팔기"
          ? "사진을 먼저 올리시거나 정리하실 품목을 하나 이상 골라주세요."
          : "상담하실 품목을 하나 이상 골라주세요.";
      setStep1Hint(msg);
      toast.error(msg);
      return;
    }
    setStep1Hint(null);
    setStep(targetStep);
  };

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const { files: ok, previews, error } = prepareInquiryFileAdditions(
      picked,
      selectedFiles.length
    );
    if (error) toast.error(error);
    if (ok.length === 0) return;

    setStep1Hint(null);
    setSelectedFiles((prev) => [...prev, ...ok]);
    updateFilePreviews((prev) => [...prev, ...previews]);
    setCachedUploadedUrls(null);
  };

  const handleRemoveFile = (index: number) => {
    revokeObjectUrls([filePreviews[index]]);
    if (selectedFiles.length <= 1) {
      setAiResult(null);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    updateFilePreviews((prev) => prev.filter((_, i) => i !== index));
    setCachedUploadedUrls(null);
  };

  const handleAiPhotoAnalyze = async () => {
    if (selectedFiles.length === 0 || analyzingAi) return;
    setAnalyzingAi(true);
    const toastId = toast.loading(
      "첨부된 사진을 AI가 분석하여 품목과 모델명을 추출 중입니다..."
    );
    try {
      const data = await analyzeInquiryPhotos({
        files: selectedFiles,
        inquiryType,
        userTitle: memo,
        userDescription: memo,
        userRegion: region,
        fallbackError: "AI 사진 분석에 실패했습니다.",
      });

      setAiResult({
        applianceCategory: data.applianceCategory,
        title: data.title,
        modelNumber: data.modelNumber,
        conditionGrade: data.conditionGrade ?? undefined,
        summaryNote: data.summaryNote ?? undefined,
        extractedFacts: Array.isArray(data.extractedFacts) ? data.extractedFacts : [],
        missingInfo: Array.isArray(data.missingInfo) ? data.missingInfo : [],
        followUpQuestions: Array.isArray(data.followUpQuestions) ? data.followUpQuestions : [],
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
    if (inquiryType === "내 물건 팔기" && !region.trim()) {
      toast.error("방문 수거 지역(구·동)을 선택하거나 입력해 주세요.");
      return;
    }
    if (!name.trim()) {
      toast.error("성함 또는 상호명을 입력해 주세요.");
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error("올바른 연락처를 입력해 주세요.");
      return;
    }
    const pwTrimmed = password.trim();
    if (pwTrimmed.length < 4 || pwTrimmed.length > 32) {
      toast.error("글 확인·수정용 비밀번호(4~32자)를 입력해 주세요.");
      return;
    }
    if (!agreed) {
      toast.error("개인정보 수집·이용에 동의해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. 사진 업로드 처리 (서버 서명 업로드 URL 발급 및 재시도 캐시 유지)
      let uploadedUrls = cachedUploadedUrls ?? [];
      if (!cachedUploadedUrls && selectedFiles.length > 0) {
        uploadedUrls = await uploadInquiryAttachmentsViaSignedUrl(
          selectedFiles,
          { prefix: "inquiries/inq" }
        );
        setCachedUploadedUrls(uploadedUrls);
      }

      // 2. 구조화 본문 생성
      const catSummary =
        selectedCategories.length > 0
          ? selectedCategories.join(" · ")
          : aiResult?.applianceCategory ||
            (inquiryType === "내 물건 팔기" ? "방문매입 가전" : "상담 품목");
      const autoTitle = `[${inquiryType}] ${catSummary} 견적 신청`;
      const effectivePassword = pwTrimmed;
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
        modelNumber: aiResult?.modelNumber || linkedProduct?.modelName || undefined,
        aiReference: aiResult
          ? {
              summaryNote:
                aiResult.summaryNote ||
                (aiResult.title ? `[사진 판독] ${aiResult.title}` : "사진 판독 정보"),
              extractedFacts: aiResult.extractedFacts || [],
              missingInfo: aiResult.missingInfo || [],
              followUpQuestions: aiResult.followUpQuestions || [],
            }
          : null,
      });

      const resJson = await postInquirySubmission({
        payload: {
          name: name.trim(),
          phone: phone.trim(),
          password: effectivePassword,
          inquiry_type: inquiryType,
          category: autoTitle,
          region: region.trim() || "대전/충청",
          description: structuredDescription,
          model: aiResult?.modelNumber || linkedProduct?.modelName || null,
          condition_grade: aiResult?.conditionGrade || null,
          images: uploadedUrls,
          is_notice: false,
        },
        fallbackError: "접수 중 오류가 발생했습니다.",
      });

      trackEvent("submit_inquiry_success", {
        inquiry_type: inquiryType,
        has_photos: uploadedUrls.length > 0,
      });

      // 견적함 묶음 불러오기가 실제로 적용된 접수에서만 견적함 비우기
      if (bundleApplied) {
        clearQuoteBasket();
        setBundleApplied(false);
      }

      // 텔레그램 알림 클라이언트 폴백 (서버 즉시 알림 미도달 시)
      const newId = resJson.inquiryId;
      if (!resJson.telegramNotified && newId) {
        dispatchTelegramFallback({
          inquiryId: newId,
          name: name.trim(),
          phone: phone.trim(),
          type: inquiryType,
          title: autoTitle,
        });
      }

      // 메모리 해제 및 완료 상태 전환 (모달 2초 닫힘 전 빈 폼 깜빡임 방지)
      revokeObjectUrls(filePreviews);
      toast.success(
        inquiryType === "내 물건 팔기"
          ? "매입 견적 신청이 정상 접수되었습니다!"
          : "견적 상담 접수가 정상 완료되었습니다!"
      );
      setMemo("");
      setPassword("");
      setSelectedFiles([]);
      updateFilePreviews([]);
      setCachedUploadedUrls(null);
      setAgreed(false);
      setCreatedInquiryId(newId ? String(newId) : null);
      setSubmittedTitle(autoTitle);
      setSubmittedSuccess(true);
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
  const totalSteps = getWizardStepCount(isSell, selectedFiles.length);
  const displayStep = getWizardDisplayStep(step, isSell, selectedFiles.length);
  const progressPercent = getWizardProgressPercent(
    step,
    isSell,
    selectedFiles.length
  );
  const step1Cta = getStep1PrimaryCta({
    isSell,
    selectedCategoriesCount: selectedCategories.length,
    selectedFilesCount: selectedFiles.length,
  });
  const step3Readiness = getStep3Readiness({
    name,
    phone,
    password,
    agreed,
    requireRegion: isSell,
    region,
  });

  if (submittedSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-3xl bg-white p-6 sm:p-8 space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDFA] text-[#0F766E]">
            <Icon d={ICON.check} className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-hb-xl sm:text-hb-2xl font-bold tracking-[-0.025em] text-[#141A23] break-keep">
              {isSell
                ? "매입 견적 신청이 완료되었어요"
                : "견적 상담이 정상 접수되었어요"}
            </h3>
            <p className="mx-auto max-w-md text-hb-sm text-[#64748B] leading-relaxed break-keep">
              {isSell
                ? "남겨주신 사진과 지역을 매장 담당자가 확인한 뒤 빠른 매입 견적과 방문 수거 일정을 안내해 드릴게요."
                : "요청하신 품목의 작동 점검 상태와 배송 일정을 확인한 뒤 순차적으로 연락드릴게요."}
            </p>
          </div>
        </div>

        {(submittedTitle || createdInquiryId) && (
          <dl className="mx-auto max-w-md rounded-2xl bg-[#F6F5F1] px-5 py-4 divide-y divide-[#E8E6DF] text-hb-xs sm:text-hb-sm">
            {submittedTitle && (
              <div className="flex items-start justify-between gap-4 py-2 first:pt-0">
                <dt className="font-medium text-[#64748B] shrink-0">접수 내용</dt>
                <dd className="font-bold text-[#141A23] text-right break-keep">
                  {submittedTitle}
                </dd>
              </div>
            )}
            {createdInquiryId && (
              <div className="flex items-center justify-between gap-4 py-2">
                <dt className="font-medium text-[#64748B] shrink-0">접수 번호</dt>
                <dd className="font-mono font-bold text-[#141A23] tabular-nums">
                  #{createdInquiryId.slice(0, 8)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 py-2 last:pb-0">
              <dt className="font-medium text-[#64748B] shrink-0">보호 상태</dt>
              <dd className="font-semibold text-[#0F766E]">비밀글 자동 보호</dd>
            </div>
          </dl>
        )}

        <div className="mx-auto max-w-md space-y-2.5">
          <Link
            href="/inquiry"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#141A23] px-5 text-hb-sm font-bold text-white hover:bg-[#1E2736] active:scale-[0.985] transition-[background-color,transform] duration-150"
          >
            문의 게시판에서 답변 확인하기
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("click_kakao_consult", {
                  location: "v2_inquiry_success",
                })
              }
              className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#FEE500] px-3 text-hb-xs sm:text-hb-sm font-bold text-[#191600] hover:bg-[#F2D900] transition-colors"
            >
              <Icon d={ICON.chat} className="w-4 h-4 shrink-0" />
              <span>카톡 사진 추가</span>
            </a>
            <a
              href={telHref(STORE.tel)}
              onClick={() =>
                trackEvent("click_tel_consult", {
                  location: "v2_inquiry_success",
                })
              }
              className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#F6F5F1] px-3 text-hb-xs sm:text-hb-sm font-bold text-[#141A23] hover:bg-[#ECEAE3] transition-colors tabular-nums"
            >
              <Icon d={ICON.phone} className="w-4 h-4 text-[#C84312] shrink-0" />
              <span>{STORE.tel}</span>
            </a>
          </div>
          {variant === "embedded" && (
            <button
              type="button"
              onClick={() => {
                setSubmittedSuccess(false);
                setCreatedInquiryId(null);
                setSubmittedTitle("");
                setStep(1);
              }}
              className="w-full py-2.5 text-hb-xs font-semibold text-[#64748B] hover:text-[#141A23] transition-colors cursor-pointer"
            >
              다른 가전 추가로 신청하기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={variant === "embedded" ? "" : "space-y-4"}>
      <form
        onSubmit={handleWizardSubmit}
        className={
          variant === "embedded"
            ? "space-y-6"
            : "rounded-3xl border border-[#EAE8E2] bg-white p-5 sm:p-7 space-y-6"
        }
      >
        {/* 토스·증권앱 스타일 상단 슬림 프로그레스 바 + 뒤로가기 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 min-h-[32px]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setStep(
                    step === 3 && isSell && selectedFiles.length > 0
                      ? 1
                      : step === 3
                      ? 2
                      : 1
                  )
                }
                className="inline-flex items-center gap-1.5 -ml-1.5 rounded-xl px-2 py-1 text-hb-xs sm:text-hb-sm font-semibold text-[#475569] hover:bg-[#F5F4F0] hover:text-[#141A23] transition-colors cursor-pointer"
              >
                <Icon d={ICON.left} className="w-4 h-4" />
                <span>이전 단계</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-hb-xs font-semibold text-[#C84312]">
                <span>{isSell ? "30초 간편 매입 접수" : "30초 간편 견적 접수"}</span>
              </span>
            )}

            <div className="flex items-center gap-2 text-hb-xs font-semibold text-[#64748B] tabular-nums">
              <span className="text-[#141A23] font-bold">
                {displayStep} / {totalSteps}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {step === 1
                  ? isSell
                    ? "품목·사진"
                    : "유형·품목"
                  : step === 2
                  ? "사진 첨부"
                  : "방문·연락처"}
              </span>
            </div>
          </div>

          <div
            role="progressbar"
            aria-label="견적 신청 진행률"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFECE6]"
          >
            <div
              className="h-full w-full origin-left rounded-full bg-[#141A23] transition-transform duration-300 ease-out"
              style={{ transform: `scaleX(${progressPercent / 100})` }}
            />
          </div>
        </div>

        {/* STEP 1: 대화형 질문 + 사진 먼저 올리기 + 토널 품목 타일 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-hb-xl sm:text-hb-2xl font-bold tracking-[-0.025em] leading-[1.3] text-[#141A23] break-keep [text-wrap:balance]">
                {isSell
                  ? "어떤 가전을 정리하시나요?"
                  : "어떤 가전 상담이 필요하신가요?"}
              </h3>
              <p className="text-hb-sm text-[#64748B] leading-relaxed break-keep">
                {isSell
                  ? "사진만 먼저 올려주셔도 되고, 아래에서 품목을 여러 개 골라도 돼요."
                  : "상담 유형과 품목을 골라주시면 확인 후 안내해 드릴게요."}
              </p>
            </div>

            {!isSell && fixedType !== "내 물건 팔기" && basketItems.length > 0 && (
              <div className="rounded-2xl bg-[#F0F9FF] p-4 text-hb-xs sm:text-hb-sm text-[#0C4A6E] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon d={ICON.bag} className="w-4 h-4 text-[#0284C7] shrink-0" />
                  <span className="font-semibold">
                    견적함에 담아둔 관심 매물 {basketItems.length}건이 있어요
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const summary = formatQuoteBasketSummary(basketItems);
                    if (!fixedType && summary.hasCommercialItem) {
                      setInquiryType("대량·업소용 상담");
                    }
                    if (summary.autoDescription) {
                      setMemo(summary.autoDescription);
                    }
                    const cats = Array.from(
                      new Set(
                        basketItems.map((it) => it.category).filter(Boolean)
                      )
                    );
                    if (cats.length > 0) {
                      setSelectedCategories(cats);
                    }
                    setBundleApplied(true);
                    toast.success("견적함 매물이 문의 내용에 자동 반영되었습니다.");
                  }}
                  className="rounded-xl bg-white px-3.5 py-2 text-hb-xs font-bold text-[#0369A1] hover:bg-[#E0F2FE] transition-colors cursor-pointer shrink-0"
                >
                  한 번에 불러오기
                </button>
              </div>
            )}

            {!hideTypeSelector && !fixedType && (
              <div className="space-y-2.5">
                <span className="block text-hb-xs font-bold text-[#64748B]">
                  상담 유형
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {INQUIRY_TYPES.map((t) => {
                    const active = inquiryType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setInquiryType(t);
                          setSelectedChips([]);
                          setStep1Hint(null);
                        }}
                        className={`h-12 rounded-2xl px-4 text-hb-sm font-bold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.985] cursor-pointer ${
                          active
                            ? "bg-[#141A23] text-white"
                            : "bg-[#F6F5F1] text-[#334155] hover:bg-[#ECEAE3]"
                        }`}
                      >
                        {t === "내 물건 팔기" ? "가전 팔기 (방문매입)" : t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 매입 모드 전용: 토스 스타일 전체 너비 사진 먼저 올리기 탭 존 */}
            {isSell && (
              <div className="space-y-3">
                {selectedFiles.length === 0 ? (
                  <label className="group flex w-full cursor-pointer items-center justify-between gap-3.5 rounded-2xl bg-[#F6F5F1] p-4 sm:p-5 hover:bg-[#EFECE4] active:scale-[0.995] transition-[background-color,transform] duration-150">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#C84312] shadow-2xs group-hover:scale-[1.03] transition-transform">
                        <Icon d={ICON.camera} className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-hb-sm sm:text-hb-base font-bold text-[#141A23] leading-snug">
                          사진부터 먼저 올리기
                          <span className="ml-1.5 font-semibold text-hb-xs text-[#C84312]">
                            가장 빨라요
                          </span>
                        </p>
                        <p className="mt-0.5 text-hb-xs text-[#64748B] leading-relaxed break-keep">
                          정면·명판 스티커를 올리면 품목과 모델명을 자동으로 채워드려요
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-3.5 py-2 text-hb-xs font-bold text-[#141A23] shadow-2xs group-hover:bg-[#141A23] group-hover:text-white transition-colors">
                      사진 선택
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                ) : (
                  <div className="rounded-2xl bg-[#F6F5F1] p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-hb-sm font-bold text-[#141A23]">
                        올린 사진
                        <span className="ml-1.5 font-mono text-hb-xs font-bold text-[#C84312] tabular-nums">
                          {selectedFiles.length} / {MAX_PHOTOS}장
                        </span>
                      </p>
                      <span className="text-hb-xs font-medium text-[#0F766E]">
                        바로 연락처 단계로 넘어가요
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {filePreviews.map((src, i) => (
                        <div
                          key={src}
                          className="relative aspect-square w-20 overflow-hidden rounded-2xl bg-white ring-1 ring-[#E5E3DC] shrink-0"
                        >
                          <SafeImg
                            src={src}
                            alt={`선택 사진 ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(i)}
                            aria-label={`사진 ${i + 1} 제거`}
                            className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#141A23]/80 text-white hover:bg-[#C84312] transition-colors cursor-pointer"
                          >
                            <Icon d={ICON.close} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {selectedFiles.length < MAX_PHOTOS && (
                        <label className="flex aspect-square w-20 cursor-pointer flex-col items-center justify-center rounded-2xl bg-white text-hb-xs font-semibold text-[#475569] ring-1 ring-dashed ring-[#CFCBC0] hover:text-[#C84312] hover:ring-[#C84312] transition-colors shrink-0">
                          <Icon d={ICON.plus} className="w-4 h-4" />
                          <span className="mt-1">추가</span>
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

                    <button
                      type="button"
                      onClick={handleAiPhotoAnalyze}
                      disabled={analyzingAi}
                      className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#141A23] px-4 text-hb-xs sm:text-hb-sm font-bold text-white hover:bg-[#1E2736] active:scale-[0.985] transition-[background-color,transform] disabled:opacity-50 cursor-pointer"
                    >
                      <Icon
                        d={ICON.sparkles}
                        className="w-4 h-4 shrink-0 text-[#FF8A50]"
                      />
                      <span>
                        {analyzingAi
                          ? "사진에서 품목과 모델명을 읽는 중..."
                          : "사진에서 품목·모델명 자동 채우기"}
                      </span>
                    </button>

                    {aiResult && (
                      <div className="rounded-xl bg-white p-3 text-hb-xs text-[#0F766E] flex items-start gap-2">
                        <Icon
                          d={ICON.check}
                          className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5"
                        />
                        <div className="leading-relaxed">
                          <strong className="font-bold text-[#141A23]">
                            자동 입력 완료 ·
                          </strong>{" "}
                          {[
                            aiResult.applianceCategory,
                            aiResult.title,
                            aiResult.modelNumber,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 품목 선택 타일 (2열 균형 그리드 · 마지막 '기타' 전체 폭) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-hb-xs font-bold text-[#64748B]">
                  {isSell
                    ? "또는 정리하실 품목 선택 (복수 선택)"
                    : "상담 품목 선택 (복수 선택)"}
                </span>
                {selectedCategories.length > 0 && (
                  <span className="font-mono text-hb-xs font-bold text-[#C84312] tabular-nums">
                    {selectedCategories.length}개 선택됨
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRODUCT_CATEGORIES.map((cat, idx) => {
                  const active = selectedCategories.includes(cat);
                  const meta = getCategoryMeta(cat);
                  const isLastOdd =
                    idx === PRODUCT_CATEGORIES.length - 1 &&
                    PRODUCT_CATEGORIES.length % 2 === 1;
                  return (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleCategory(cat)}
                      className={`group flex items-center justify-between gap-3 rounded-2xl p-4 text-left transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.985] cursor-pointer ${
                        isLastOdd ? "sm:col-span-2" : ""
                      } ${
                        active
                          ? "bg-[#FFF6F1] ring-2 ring-[#C84312]"
                          : "bg-[#F6F5F1] hover:bg-[#EFECE4]"
                      }`}
                    >
                      <div className="min-w-0">
                        <span
                          className={`block text-hb-sm sm:text-hb-base font-bold leading-snug ${
                            active ? "text-[#C84312]" : "text-[#141A23]"
                          }`}
                        >
                          {meta.label}
                        </span>
                        {meta.hint && (
                          <span className="mt-0.5 block text-hb-xs text-[#64748B] truncate">
                            {meta.hint}
                          </span>
                        )}
                      </div>
                      <span
                        aria-hidden="true"
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors ${
                          active
                            ? "bg-[#C84312] text-white"
                            : "bg-white text-[#94A3B8] group-hover:text-[#141A23]"
                        }`}
                      >
                        <Icon
                          d={active ? ICON.check : ICON.plus}
                          className="w-3.5 h-3.5"
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {step1Hint && (
              <p
                role="alert"
                className="rounded-xl bg-[#FFF4EE] px-3.5 py-2.5 text-hb-xs font-semibold text-[#C84312]"
              >
                {step1Hint}
              </p>
            )}

            {/* 하단 풀-위드 토스 스타일 메인 CTA */}
            <div className="pt-1">
              <button
                type="button"
                onClick={goToPhotoStep}
                className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-6 text-hb-base font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.985] cursor-pointer ${
                  step1Cta.ready
                    ? "bg-[#141A23] text-white hover:bg-[#1E2736]"
                    : "bg-[#ECEAE3] text-[#475569] hover:bg-[#E2DFD6]"
                }`}
              >
                <span>{step1Cta.label}</span>
                {step1Cta.ready && <Icon d={ICON.arrow} className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: 사진 첨부 (선택) + 친절한 촬영 가이드 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-hb-xl sm:text-hb-2xl font-bold tracking-[-0.025em] leading-[1.3] text-[#141A23] break-keep [text-wrap:balance]">
                사진을 올려주시면 더 정확하게 봐드려요
              </h3>
              <p className="text-hb-sm text-[#64748B] leading-relaxed break-keep">
                정면 1장, 모델명 스티커 1장이면 충분해요. 지금 없어도 바로 다음으로 넘어갈 수 있어요.
              </p>
            </div>

            {/* 사진 업로드 영역 */}
            <div className="space-y-3">
              {selectedFiles.length === 0 ? (
                <label className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-[#F6F5F1] px-5 py-9 text-center cursor-pointer hover:bg-[#EFECE4] transition-colors">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#C84312] shadow-2xs group-hover:scale-[1.04] transition-transform">
                    <Icon d={ICON.camera} className="w-5 h-5" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-hb-sm sm:text-hb-base font-bold text-[#141A23]">
                      여기를 눌러 사진 선택하기
                    </p>
                    <p className="text-hb-xs text-[#64748B]">
                      최대 {MAX_PHOTOS}장까지 한 번에 올릴 수 있어요
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="rounded-2xl bg-[#F6F5F1] p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-hb-sm font-bold text-[#141A23]">
                      첨부된 사진
                    </span>
                    <span className="font-mono text-hb-xs font-bold text-[#C84312] tabular-nums">
                      {selectedFiles.length} / {MAX_PHOTOS}장
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {filePreviews.map((src, i) => (
                      <div
                        key={src}
                        className="relative aspect-square w-20 sm:w-24 overflow-hidden rounded-2xl bg-white ring-1 ring-[#E5E3DC] shrink-0"
                      >
                        <SafeImg
                          src={src}
                          alt={`선택 사진 ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(i)}
                          aria-label={`사진 ${i + 1} 제거`}
                          className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#141A23]/80 text-white hover:bg-[#C84312] transition-colors cursor-pointer"
                        >
                          <Icon d={ICON.close} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {selectedFiles.length < MAX_PHOTOS && (
                      <label className="flex aspect-square w-20 sm:w-24 cursor-pointer flex-col items-center justify-center rounded-2xl bg-white text-hb-xs font-semibold text-[#475569] ring-1 ring-dashed ring-[#CFCBC0] hover:text-[#C84312] hover:ring-[#C84312] transition-colors shrink-0">
                        <Icon d={ICON.plus} className="w-5 h-5" />
                        <span className="mt-1">추가</span>
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

                  <button
                    type="button"
                    onClick={handleAiPhotoAnalyze}
                    disabled={analyzingAi}
                    className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#141A23] px-4 text-hb-xs sm:text-hb-sm font-bold text-white hover:bg-[#1E2736] active:scale-[0.985] transition-[background-color,transform] disabled:opacity-50 cursor-pointer"
                  >
                    <Icon
                      d={ICON.sparkles}
                      className="w-4 h-4 shrink-0 text-[#FF8A50]"
                    />
                    <span>
                      {analyzingAi
                        ? "사진 분석 중..."
                        : "사진에서 품목·모델명 자동 채우기"}
                    </span>
                  </button>

                  {aiResult && (
                    <div className="rounded-xl bg-white p-3 text-hb-xs text-[#0F766E] flex items-start gap-2">
                      <Icon
                        d={ICON.check}
                        className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5"
                      />
                      <div className="leading-relaxed">
                        <strong className="font-bold text-[#141A23]">
                          자동 입력 완료 ·
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

              {/* 접이식 촬영 도움말 (필요할 때만 펼침) */}
              <div className="overflow-hidden rounded-2xl border border-[#EAE8E2] bg-white">
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setShowGuide((prev) => !prev)}
                    aria-expanded={showGuide}
                    className="flex flex-1 items-center gap-2 text-left text-hb-xs sm:text-hb-sm font-semibold text-[#334155] hover:text-[#141A23] cursor-pointer"
                  >
                    <Icon
                      d={ICON.camera}
                      className="w-4 h-4 text-[#C84312] shrink-0"
                    />
                    <span>어떻게 찍으면 견적이 잘 나오나요?</span>
                    <Icon
                      d={showGuide ? ICON.up : ICON.down}
                      className="w-4 h-4 text-[#94A3B8] ml-auto"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomGuide(true)}
                    className="rounded-lg bg-[#F6F5F1] px-2.5 py-1.5 text-hb-xs font-bold text-[#141A23] hover:bg-[#ECEAE3] transition-colors shrink-0 cursor-pointer"
                  >
                    예시 보기
                  </button>
                </div>

                {showGuide && (
                  <div className="border-t border-[#EAE8E2]">
                    <button
                      type="button"
                      onClick={() => setZoomGuide(true)}
                      className="group relative block w-full overflow-hidden bg-[#FAFAF8] text-left focus:outline-none cursor-zoom-in border-b border-[#EAE8E2]"
                      aria-label="권장 촬영 예시 사진 원본 크게 보기"
                    >
                      <SafeImg
                        src={guideInfo.image}
                        alt="권장 촬영 예시 사진 가이드"
                        className="w-full max-h-[180px] object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
                      />
                    </button>
                    <ol className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE8E2] text-hb-xs">
                      {guideInfo.steps.map((g) => (
                        <li
                          key={g.step}
                          className="flex items-start gap-2.5 p-3.5"
                        >
                          <span className="shrink-0 font-mono text-hb-xs font-bold text-[#C84312] tabular-nums">
                            {g.step}
                          </span>
                          <div className="min-w-0 flex-1">
                            <strong className="font-bold text-[#141A23] block">
                              {g.title}
                            </strong>
                            <span className="text-[#64748B] leading-relaxed block mt-0.5">
                              {g.desc}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#141A23] px-6 text-hb-base font-bold text-white hover:bg-[#1E2736] active:scale-[0.985] transition-[background-color,transform] duration-150 cursor-pointer"
              >
                <span>
                  {selectedFiles.length > 0
                    ? "이 사진으로 다음 단계"
                    : "사진 없이 바로 넘어가기"}
                </span>
                <Icon d={ICON.arrow} className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 방문 지역 · 현장 조건 · 연락처 입력 (마지막 단계) */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-hb-xl sm:text-hb-2xl font-bold tracking-[-0.025em] leading-[1.3] text-[#141A23] break-keep [text-wrap:balance]">
                {isSell
                  ? "어디로 방문하면 될까요?"
                  : "연락받으실 정보를 알려주세요"}
              </h3>
              <p className="text-hb-sm text-[#64748B] leading-relaxed break-keep">
                남겨주신 정보는 견적 안내에만 쓰이며 비밀글로 안전하게 보호돼요.
              </p>
            </div>

            {/* 선택한 항목 요약 바 */}
            <div className="rounded-2xl bg-[#F6F5F1] px-4 py-3 text-hb-xs sm:text-hb-sm text-[#334155] flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-bold text-[#141A23]">
                  {selectedCategories.join(" · ") || "품목 미지정"}
                </span>
                <span className="mx-1.5 text-[#94A3B8]" aria-hidden="true">
                  ·
                </span>
                <span className="text-[#64748B]">
                  {selectedFiles.length > 0
                    ? `사진 ${selectedFiles.length}장 첨부`
                    : "사진 없음"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep(isSell && selectedFiles.length > 0 ? 1 : 2)}
                className="text-hb-xs font-bold text-[#C84312] hover:underline shrink-0 cursor-pointer"
              >
                수정하기
              </button>
            </div>

            {/* 1. 1-tap 빠른 지역 선택 + 상세 지역 입력 */}
            <div className="space-y-2.5">
              <label
                htmlFor={`${uid}-region`}
                className="block text-hb-xs font-bold text-[#64748B]"
              >
                {isSell ? "방문 수거 지역 (필수)" : "배송 · 설치 지역"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {WIZARD_QUICK_REGIONS.map((preset) => {
                  const selected =
                    region.trim() === preset ||
                    region.trim().startsWith(`${preset} `);
                  return (
                    <button
                      key={preset}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setRegion((prev) => applyQuickRegion(prev, preset))
                      }
                      className={`h-9 rounded-xl px-3 text-hb-xs font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.97] cursor-pointer ${
                        selected
                          ? "bg-[#141A23] text-white"
                          : "bg-[#F6F5F1] text-[#334155] hover:bg-[#ECEAE3]"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
              <input
                id={`${uid}-region`}
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="동 이름까지 적어주시면 더 빨라요 (예: 대전 중구 중촌동)"
                className="w-full h-12 rounded-2xl border border-transparent bg-[#F6F5F1] px-4 text-hb-base sm:text-hb-sm text-[#141A23] placeholder:text-[#64748B] transition-colors focus:border-[#141A23] focus:bg-white focus:outline-none"
              />
            </div>

            {/* 2. 해당되는 현장 조건 (선택) */}
            <div className="space-y-2.5">
              <span className="block text-hb-xs font-bold text-[#64748B]">
                {isSell
                  ? "해당하는 현장 조건 (선택)"
                  : "해당하는 배송·설치 조건 (선택)"}
              </span>
              <div className="flex flex-wrap gap-2">
                {WIZARD_ENV_CHIPS[inquiryType].map((chip) => {
                  const active = selectedChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleChip(chip)}
                      className={`h-10 inline-flex items-center gap-1.5 rounded-xl px-3.5 text-hb-xs sm:text-hb-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97] cursor-pointer ${
                        active
                          ? "bg-[#FFF6F1] text-[#C84312] ring-1 ring-[#C84312] font-bold"
                          : "bg-[#F6F5F1] text-[#334155] hover:bg-[#ECEAE3]"
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

            {/* 3. 신청자 성함 & 연락처 (필수) */}
            <div className="space-y-3 pt-2 border-t border-[#EAE8E2]">
              <span className="block text-hb-xs font-bold text-[#64748B]">
                연락받으실 분 정보 (필수)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor={`${uid}-name`}
                    className="block text-hb-xs font-semibold text-[#334155]"
                  >
                    성함 또는 상호명
                  </label>
                  <input
                    id={`${uid}-name`}
                    name="contact_name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동 / 한밭식당"
                    className="w-full h-12 rounded-2xl border border-transparent bg-[#F6F5F1] px-4 text-hb-base sm:text-hb-sm text-[#141A23] placeholder:text-[#64748B] transition-colors focus:border-[#141A23] focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`${uid}-phone`}
                      className="block text-hb-xs font-semibold text-[#334155]"
                    >
                      연락처
                    </label>
                    {step3Readiness.phoneValid && (
                      <span className="inline-flex items-center gap-1 text-hb-xs font-bold text-[#0F766E]">
                        <Icon d={ICON.check} className="w-3 h-3" />
                        <span>확인됨</span>
                      </span>
                    )}
                  </div>
                  <input
                    id={`${uid}-phone`}
                    name="tel"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="010-0000-0000"
                    className="w-full h-12 rounded-2xl border border-transparent bg-[#F6F5F1] px-4 text-hb-base sm:text-hb-sm text-[#141A23] placeholder:text-[#64748B] transition-colors focus:border-[#141A23] focus:bg-white focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              {/* 선택 입력: 간단 메모 & 조회 비밀번호 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor={`${uid}-memo`}
                    className="block text-hb-xs font-semibold text-[#64748B]"
                  >
                    간단 메모 (선택)
                  </label>
                  <input
                    id={`${uid}-memo`}
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="희망 날짜, 모델명 등 편하게 적어주세요"
                    className="w-full h-12 rounded-2xl border border-transparent bg-[#F6F5F1] px-4 text-hb-base sm:text-hb-sm text-[#141A23] placeholder:text-[#64748B] transition-colors focus:border-[#141A23] focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`${uid}-password`}
                      className="block text-hb-xs font-semibold text-[#334155]"
                    >
                      글 확인·수정 비밀번호 (4자 이상 필수)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-hb-xs font-bold text-[#64748B] hover:text-[#141A23] cursor-pointer"
                    >
                      {showPassword ? "숨기기" : "표시"}
                    </button>
                  </div>
                  <input
                    id={`${uid}-password`}
                    name="new_password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={4}
                    maxLength={32}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="숫자·영문 4자리 이상 설정해 주세요"
                    className="w-full h-12 rounded-2xl border border-transparent bg-[#F6F5F1] px-4 text-hb-base sm:text-hb-sm text-[#141A23] placeholder:text-[#64748B] transition-colors focus:border-[#141A23] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 토스 스타일 전체 행 터치형 개인정보 동의 */}
            <label
              className={`flex items-center justify-between gap-3 rounded-2xl p-4 cursor-pointer select-none transition-colors ${
                agreed
                  ? "bg-[#F0FDFA] ring-1 ring-[#0F766E]/40"
                  : "bg-[#F6F5F1] hover:bg-[#EFECE4]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors ${
                    agreed
                      ? "bg-[#0F766E] text-white"
                      : "bg-white ring-1 ring-[#CBD2DC] text-transparent"
                  }`}
                >
                  <Icon d={ICON.check} className="w-3.5 h-3.5" />
                </span>
                <span className="text-hb-xs sm:text-hb-sm font-semibold text-[#141A23] break-keep">
                  상담 안내를 위한 개인정보 수집·이용에 동의해요
                </span>
              </div>
              <span className="text-hb-xs font-bold text-[#64748B] shrink-0">
                필수
              </span>
            </label>

            {/* 최종 제출 CTA + 문자 전송 대안 */}
            <div className="space-y-2.5 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#C84312] px-6 text-hb-base font-bold text-white hover:bg-[#AE380D] active:scale-[0.985] transition-[background-color,transform] duration-150 disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {submitting
                    ? "접수하는 중이에요..."
                    : isSell
                    ? "매입 견적 무료 신청하기"
                    : "견적 문의 완료하기"}
                </span>
              </button>

              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-hb-xs text-[#64748B]">
                <span>
                  {step3Readiness.missingHint ||
                    "입력 완료! 버튼을 누르면 바로 접수돼요."}
                </span>
                <a
                  href={smsHref(
                    STORE.mobile,
                    `[${STORE.name} ${inquiryType}] 품목: ${selectedCategories.join(
                      ", "
                    )} / 조건: ${selectedChips.join(", ")} 문의드립니다.`
                  )}
                  onClick={() =>
                    trackEvent("click_sms_consult", {
                      location: "v2_inquiry_wizard",
                      inquiry_type: inquiryType,
                    })
                  }
                  className="inline-flex items-center gap-1 font-semibold text-[#334155] hover:text-[#C84312] transition-colors shrink-0"
                >
                  <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#C84312]" />
                  <span>문자로 바로 보내기</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </form>

      <InquiryPhotoGuideModal
        open={zoomGuide}
        onClose={() => setZoomGuide(false)}
        imageSrc={guideInfo.image}
        tip={guideInfo.tip}
      />
    </div>
  );
}
