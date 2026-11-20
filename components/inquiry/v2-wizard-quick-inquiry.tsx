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
  STORAGE_BUCKETS,
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
} from "../../lib/inquiry-client";
import { InquiryPhotoGuideModal } from "./inquiry-photo-guide-modal";
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
  useEffect(() => {
    previewsRef.current = filePreviews;
  }, [filePreviews]);

  useEffect(() => {
    return () => {
      revokeObjectUrls(previewsRef.current);
    };
  }, []);

  /* 3단계 연락처 상태 */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const goToPhotoStep = () => {
    if (selectedCategories.length === 0) {
      if (inquiryType === "내 물건 팔기") {
        if (
          aiResult?.applianceCategory &&
          (PRODUCT_CATEGORIES as readonly string[]).includes(
            aiResult.applianceCategory
          )
        ) {
          setSelectedCategories([aiResult.applianceCategory]);
          setStep(2);
          return;
        }
        if (selectedFiles.length > 0) {
          setSelectedCategories(["기타"]);
          setStep(2);
          return;
        }
      }
      toast.error(
        inquiryType === "내 물건 팔기"
          ? "사진을 첨부해 AI 판독을 실행하시거나 처분할 품목을 1개 이상 선택해 주세요."
          : "상담하실 품목을 1개 이상 선택해 주세요."
      );
      return;
    }
    setStep(2);
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

    setSelectedFiles((prev) => [...prev, ...ok]);
    setFilePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveFile = (index: number) => {
    revokeObjectUrls([filePreviews[index]]);
    if (selectedFiles.length <= 1) {
      setAiResult(null);
    }
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
    if (!name.trim()) {
      toast.error("성함 또는 상호명을 입력해 주세요.");
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error("올바른 연락처를 입력해 주세요.");
      return;
    }
    if (password.trim().length > 0 && password.trim().length < 4) {
      toast.error("조회용 비밀번호는 4자리 이상 입력하시거나 비워두세요.");
      return;
    }
    if (!agreed) {
      toast.error("개인정보 수집·이용에 동의해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. 사진 업로드 처리 (선택 첨부된 파일이 있는 경우에만 Supabase 스토리지 모듈 지연 로드)
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const { compressAndUploadProductImages } = await import(
          "../../lib/product-ops"
        );
        uploadedUrls = await compressAndUploadProductImages(selectedFiles, {
          maxWidth: 1400,
          quality: 0.8,
          bucket: STORAGE_BUCKETS.inquiryAttachments,
          prefix: "inquiries/inq",
        });
      }

      // 2. 구조화 본문 생성
      const catSummary =
        selectedCategories.length > 0
          ? selectedCategories.join(" · ")
          : aiResult?.applianceCategory ||
            (inquiryType === "내 물건 팔기" ? "방문매입 가전" : "상담 품목");
      const autoTitle = `[${inquiryType}] ${catSummary} 견적 신청`;
      const effectivePassword =
        password.trim().length >= 4
          ? password.trim()
          : phone.replace(/\D/g, "").slice(-4) || "0000";
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

      // 구매/설치/대량 상담 접수 시에만 구매용 묶음 견적함 비우기 (매입 신청 시 유지)
      if (inquiryType !== "내 물건 팔기") {
        clearQuoteBasket();
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
      setSelectedFiles([]);
      setFilePreviews([]);
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

  if (submittedSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-[#CCFBF1] bg-white p-6 sm:p-8 text-center space-y-4 shadow-2xs"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4]">
          <Icon d={ICON.check} className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-hb-lg font-bold text-[#141A23]">
            {isSell ? "매입 견적 신청이 접수되었습니다" : "견적 상담이 접수되었습니다"}
          </h3>
          <p className="text-hb-sm text-[#475569] leading-relaxed break-keep">
            {isSell
              ? "접수하신 제품 사진과 지역을 매장 담당자가 확인한 뒤 빠른 매입 견적과 방문 수거 일정을 안내해 드리겠습니다."
              : "요청하신 품목의 매장 작동 점검 상태와 배송 일정을 확인한 뒤 순차적으로 연락드리겠습니다."}
          </p>
        </div>

        {(submittedTitle || createdInquiryId) && (
          <div className="mx-auto max-w-md rounded-xl border border-[#E2E6EC] bg-[#F8F9FA] px-4 py-3 text-left text-hb-xs text-[#334155] space-y-1">
            {submittedTitle && (
              <p className="truncate">
                • 접수 내용:{" "}
                <strong className="font-bold text-[#141A23]">{submittedTitle}</strong>
              </p>
            )}
            {createdInquiryId && (
              <p className="font-mono text-[#475569] tabular-nums">
                • 접수 번호: #{createdInquiryId.slice(0, 8)}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Link
            href="/inquiry"
            className="hb-btn-primary h-10 px-4 text-hb-xs font-bold"
          >
            문의게시판에서 답변 확인
          </Link>
          <a
            href={STORE.kakaoChat}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("click_kakao_consult", { location: "v2_inquiry_success" })
            }
            className="hb-btn-outline h-10 px-4 text-hb-xs font-bold"
          >
            카카오톡 사진·추가 문의
          </a>
          <a
            href={telHref(STORE.tel)}
            onClick={() =>
              trackEvent("click_tel_consult", { location: "v2_inquiry_success" })
            }
            className="hb-btn-outline h-10 px-4 text-hb-xs font-bold"
          >
            {STORE.tel} 바로 통화
          </a>
          {variant === "embedded" && (
            <button
              type="button"
              onClick={() => {
                setSubmittedSuccess(false);
                setCreatedInquiryId(null);
                setSubmittedTitle("");
                setStep(1);
              }}
              className="hb-btn-outline h-10 px-4 text-hb-xs font-bold"
            >
              새 문의 작성하기
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
            ? "space-y-5"
            : "rounded-2xl border border-[#E2E6EC] bg-white p-4 sm:p-6 space-y-5 shadow-2xs"
        }
      >
        {/* 3단계 인디케이터 */}
        <ol className="grid grid-cols-3 gap-2 pb-3 border-b border-[#E2E6EC]">
          {[
            { num: 1, label: "상담 유형·품목" },
            { num: 2, label: "사진·가이드" },
            { num: 3, label: "현장조건·접수" },
          ].map((s) => {
            const isPast = step > s.num;
            const isCurrent = step === s.num;
            return (
              <li
                key={s.num}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex items-center gap-2 rounded-lg p-2 transition-colors ${
                  isCurrent
                    ? "bg-[#141A23] text-white"
                    : isPast
                    ? "bg-[#FFF4EE] text-[#E8521A] border border-[#E8521A]/30"
                    : "bg-[#F1F3F6] text-[#64748B]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-hb-xs font-bold tabular-nums ${
                    isCurrent
                      ? "bg-[#FB923C] text-[#141A23]"
                      : isPast
                      ? "bg-[#E8521A] text-white"
                      : "bg-[#E2E6EC] text-[#64748B]"
                  }`}
                >
                  {isPast ? (
                    <Icon d={ICON.check} className="w-3.5 h-3.5" />
                  ) : (
                    s.num
                  )}
                </span>
                <span className="truncate text-hb-xs font-bold">{s.label}</span>
              </li>
            );
          })}
        </ol>

        {/* STEP 1: 상담 유형 & 품목 선택 */}
        {step === 1 && (
          <div className="space-y-4">
            {!isSell && fixedType !== "내 물건 팔기" && basketItems.length > 0 && (
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
                    if (!fixedType && summary.hasCommercialItem) {
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
                        className={`h-12 rounded-xl border px-3 text-hb-sm font-bold transition-[color,background-color,border-color,box-shadow] duration-150 cursor-pointer ${
                          active
                            ? "border-[#141A23] bg-[#141A23] text-white shadow-2xs"
                            : "border-[#E2E6EC] bg-[#F7F8FA] text-[#141A23] hover:border-[#CBD2DC]"
                        }`}
                      >
                        {t === "내 물건 팔기" ? "가전 팔기(방문매입)" : t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isSell && (
              <div className="rounded-xl border border-[#BAE6FD] bg-[#F0F9FF]/60 p-3.5 sm:p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#0284C7] px-2 py-0.5 text-hb-xs font-bold text-white">
                      <Icon d={ICON.sparkles} className="w-3 h-3" />
                      <span>Photo-First AI 자동입력</span>
                    </span>
                    <p className="mt-1 text-hb-xs sm:text-hb-sm font-bold text-[#141A23]">
                      제품 사진이나 명판 스티커를 먼저 올리면 AI가 품목·모델명을 자동으로 채워드립니다
                    </p>
                  </div>
                  <span className="font-mono text-hb-xs font-bold text-[#0369A1] tabular-nums">
                    {selectedFiles.length} / {MAX_PHOTOS}장
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {filePreviews.map((src, i) => (
                    <div
                      key={src}
                      className="relative aspect-square w-16 sm:w-20 overflow-hidden rounded-xl border border-[#CBD2DC] bg-white shrink-0"
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
                    <label className="flex aspect-square w-16 sm:w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#0284C7]/50 bg-white text-hb-xs font-bold text-[#0369A1] hover:border-[#0284C7] hover:bg-[#F0F9FF] transition-colors shrink-0">
                      <Icon d={ICON.camera} className="w-4 h-4" />
                      <span className="mt-1">+ 사진</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}

                  {selectedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAiPhotoAnalyze}
                      disabled={analyzingAi}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0369A1] px-3.5 py-2 text-hb-xs font-bold text-white hover:bg-[#0284C7] transition-[background-color,transform] active:scale-[0.96] disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      <Icon d={ICON.sparkles} className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {analyzingAi
                          ? "AI 사진 판독 중..."
                          : "AI 사진 판독으로 품목·모델명 자동입력"}
                      </span>
                    </button>
                  )}
                </div>

                {aiResult && (
                  <div className="rounded-xl border border-[#CCFBF1] bg-white p-2.5 text-hb-xs text-[#0F766E] flex items-start gap-2">
                    <Icon
                      d={ICON.check}
                      className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5"
                    />
                    <div className="leading-relaxed">
                      <strong className="font-bold text-[#141A23]">
                        AI 판독 자동 반영됨:
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

            <div>
              <span className="hb-label mb-2">
                {hideTypeSelector || fixedType
                  ? "1. 처분하실 품목을 선택해 주세요 (사진 첨부 시 생략 가능 · 복수 선택)"
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
                      className={`flex h-11 items-center justify-between rounded-lg border px-3 text-hb-sm font-bold transition-[color,background-color,border-color,box-shadow] duration-150 cursor-pointer ${
                        active
                          ? "border-[#E8521A] bg-[#FFF4EE] text-[#E8521A] ring-1 ring-[#E8521A]"
                          : "border-[#E2E6EC] bg-white text-[#334155] hover:border-[#CBD2DC]"
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

            <div className="pt-2 flex justify-end border-t border-[#E2E6EC]">
              <button
                type="button"
                onClick={goToPhotoStep}
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
                <span className="text-hb-xs text-[#64748B]">
                  {selectedFiles.length} / {MAX_PHOTOS}장
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {filePreviews.map((src, i) => (
                  <div
                    key={src}
                    className="relative aspect-square w-20 sm:w-24 overflow-hidden rounded-lg border border-[#E2E6EC] bg-[#F1F3F6] shrink-0"
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
                  <label className="flex aspect-square w-20 sm:w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E2E6EC] bg-[#F7F8FA] text-hb-xs font-semibold text-[#64748B] hover:border-[#E8521A] hover:text-[#E8521A] transition-colors shrink-0">
                    <Icon d={ICON.camera} className="w-5 h-5 text-[#94A3B8]" />
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
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#BAE6FD] bg-[#F0F9FF] px-3.5 py-2 text-hb-xs font-bold text-[#0369A1] hover:bg-[#BAE6FD]/40 transition-[background-color,transform] active:scale-[0.96] disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <Icon d={ICON.sparkles} className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {analyzingAi
                        ? "AI 사진 판독 및 품목 분석 중..."
                        : "AI 사진 판독으로 품목·모델명 자동입력"}
                    </span>
                  </button>

                  {aiResult && (
                    <div className="rounded-lg border border-[#CCFBF1] bg-[#F0FDFA] p-2.5 text-hb-xs text-[#0F766E] flex items-start gap-2">
                      <Icon
                        d={ICON.check}
                        className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5"
                      />
                      <div className="leading-relaxed">
                        <strong className="font-bold text-[#141A23]">
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

              <p className="mt-2 text-hb-xs text-[#64748B]">
                제품 전면 또는 모델명 명판 스티커 사진을 첨부하시면 가장 신속하고 정확한 견적을 받으실 수 있습니다. (생략 가능)
              </p>

              {/* 권장 촬영 참고 사진 가이드 (실제 예시 그래픽 + 3단계 요약 카드 + 라이트박스 확대) */}
              <div className="mt-3 overflow-hidden rounded-xl border border-[#E2E6EC] bg-[#F7F8FA]">
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-[#E2E6EC]">
                  <div className="flex items-center gap-1.5 text-hb-xs font-bold text-[#141A23]">
                    <Icon d={ICON.camera} className="w-3.5 h-3.5 text-[#E8521A]" />
                    <span>권장 촬영 참고 사진</span>
                    <span className="text-[#94A3B8] font-normal hidden sm:inline">
                      · {guideInfo.subtitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoomGuide(true)}
                      className="hb-btn-outline h-7 px-2.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23]"
                    >
                      크게 보기
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGuide((prev) => !prev)}
                      className="rounded p-1 text-[#64748B] hover:text-[#141A23]"
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
                      className="group relative block w-full overflow-hidden bg-white text-left focus:outline-none cursor-zoom-in border-b border-[#E2E6EC]"
                      aria-label="권장 촬영 예시 사진 원본 크게 보기"
                    >
                      <SafeImg
                        src={guideInfo.image}
                        alt="권장 촬영 예시 사진 가이드"
                        className="w-full max-h-[170px] sm:max-h-[200px] object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
                      />
                    </button>

                    {/* 3단계 촬영 포인트 안내 (No Card-in-Card: divide-y / divide-x 평탄화) */}
                    <ol className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E6EC] bg-[#F7F8FA] text-hb-xs">
                      {guideInfo.steps.map((g) => (
                        <li
                          key={g.step}
                          className="flex items-start gap-2.5 p-3.5"
                        >
                          <span className="shrink-0 rounded bg-[#141A23] px-1.5 py-0.5 font-mono text-hb-xs font-bold text-white tabular-nums">
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

                    {/* 하단 팁 */}
                    <div className="border-t border-[#E2E6EC] bg-white px-3.5 py-2.5">
                      <p className="text-hb-xs text-[#334155] leading-relaxed">
                        {guideInfo.tip}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#E2E6EC]">
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
            <div className="rounded-lg border border-[#E2E6EC] bg-[#F7F8FA] p-3 text-hb-xs text-[#334155] flex flex-wrap items-center justify-between gap-1.5">
              <div>
                <strong className="text-[#141A23]">선택 요약:</strong> [{inquiryType}] {selectedCategories.join(", ")}
                {selectedFiles.length > 0
                  ? ` · 사진 ${selectedFiles.length}장 첨부됨`
                  : " · 사진 미첨부"}
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-hb-xs text-[#64748B] underline hover:text-[#141A23]"
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
                      className={`h-11 inline-flex items-center gap-1.5 rounded-lg border px-3 text-hb-sm font-bold transition-[color,background-color,border-color,box-shadow] duration-150 cursor-pointer ${
                        active
                          ? "border-[#E8521A] bg-[#FFF4EE] text-[#E8521A] ring-1 ring-[#E8521A]"
                          : "border-[#E2E6EC] bg-[#F7F8FA] text-[#334155] hover:border-[#CBD2DC]"
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
                <label htmlFor={`${uid}-region`} className="hb-label">
                  {isSell ? "2. 방문 수거 지역 (구/동 단위 권장)" : "2. 배송/설치 지역 (동 단위 권장)"}
                </label>
                <input
                  id={`${uid}-region`}
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="예: 대전 중구 중촌동 / 서구 둔산동"
                  className="hb-input mt-1 h-11"
                />
              </div>
              <div>
                <label htmlFor={`${uid}-memo`} className="hb-label">
                  간단 메모 (희망 일정·세부 모델 등)
                </label>
                <input
                  id={`${uid}-memo`}
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="예: 금요일 오후 희망 / 삼성 4도어 냉장고"
                  className="hb-input mt-1 h-11"
                />
              </div>
            </div>

            {/* 3. 연락처 및 신청자 정보 */}
            <div className="pt-2 border-t border-[#E2E6EC] space-y-2">
              <span className="hb-label">3. 신청자 정보 및 연락처 *</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor={`${uid}-name`} className="hb-label text-[#64748B]">성함 / 상호명 *</label>
                  <input
                    id={`${uid}-name`}
                    name="contact_name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동 / 한밭식당"
                    className="hb-input mt-1 h-11"
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-phone`} className="hb-label text-[#64748B]">연락처 *</label>
                  <input
                    id={`${uid}-phone`}
                    name="tel"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="010-0000-0000"
                    className="hb-input mt-1 h-11 tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-password`} className="hb-label text-[#475569]">조회 비밀번호(선택)</label>
                  <input
                    id={`${uid}-password`}
                    name="new_password"
                    type="password"
                    autoComplete="new-password"
                    minLength={4}
                    maxLength={32}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="미입력 시 연락처 뒷4자리 적용"
                    className="hb-input mt-1 h-11"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-hb-xs text-[#334155] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-4 w-4 rounded border-[#CBD2DC] accent-[#141A23]"
              />
              <span>상담 안내를 위한 개인정보 수집·이용에 동의합니다.</span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E6EC]">
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
                  className="hb-btn-outline h-11 px-4 text-hb-sm"
                >
                  <Icon d={ICON.chat} className="w-3.5 h-3.5 text-[#E8521A]" />
                  <span>문자로 바로 전송</span>
                </a>
                <button
                  type="submit"
                  disabled={submitting}
                  className="hb-btn-accent h-11 px-7 text-hb-sm font-bold"
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

      <InquiryPhotoGuideModal
        open={zoomGuide}
        onClose={() => setZoomGuide(false)}
        imageSrc={guideInfo.image}
        tip={guideInfo.tip}
      />
    </div>
  );
}
