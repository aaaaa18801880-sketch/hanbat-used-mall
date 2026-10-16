// 파일 경로: components/inquiry/unified-inquiry-form.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { supabase, getAdminAuthHeaders } from "../../lib/supabase";
import {
  clearQuoteBasket,
  compressImage,
  formatPhone,
  formatProductPrice,
  formatQuoteBasketSummary,
  formatStructuredInquiryDescription,
  getQuoteBasket,
  INQUIRY_TYPES,
  type InquiryTypeValue,
  type AnalyzeInquiryResponse,
  isSellInquiry,
  isBulkBizInquiry,
  isValidPhone,
  MAX_PHOTOS,
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITION_GRADES,
  QUOTE_BASKET_EVENT,
  type QuoteBasketItem,
  removeQuoteBasketItem,
  STORAGE_BUCKETS,
  STORE,
  telHref,
  trackEvent,
  validateImageFiles,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";

export type SubmissionPhase =
  | "idle"
  | "validating"
  | "submitting"
  | "success"
  | "error"
  | "retrying";

export interface LinkedProductContext {
  productId?: string;
  productTitle?: string;
  modelName?: string;
  category?: string;
  useBundle?: boolean;
}

const SELL_PHOTO_GUIDE_STEPS = [
  {
    step: "01",
    title: "정면 전체 샷",
    desc: "제품 외관과 도어 형태가 한눈에 보이게 촬영",
  },
  {
    step: "02",
    title: "모델명·제조년월 명판",
    desc: "에너지효율등급 또는 정격 명판 스티커 근접 촬영",
  },
  {
    step: "03",
    title: "특이사항·반출 경로",
    desc: "흠집 부위나 계단·출입문 등 참고 사진",
  },
] as const;

const BUY_PHOTO_GUIDE_STEPS = [
  {
    step: "01",
    title: "희망 제품 또는 설치 공간",
    desc: "찾으시는 제품 사진이나 들어갈 자리 전경 촬영",
  },
  {
    step: "02",
    title: "전원 · 급배수 · 배관",
    desc: "콘센트(단상/삼상) 또는 배관 타공 위치",
  },
  {
    step: "03",
    title: "반입 동선 참고 사진",
    desc: "출입구 폭이나 계단·엘리베이터 등 참고 사진",
  },
] as const;

const BULK_PHOTO_GUIDE_STEPS = [
  {
    step: "01",
    title: "도입/처분 장비 또는 도면",
    desc: "필요한 업소용 설비 참고 사진 또는 기존 장비 사진",
  },
  {
    step: "02",
    title: "매장 분전반 · 전원 환경",
    desc: "단상/삼상 차단기 용량이나 콘센트 위치 사진",
  },
  {
    step: "03",
    title: "주방 공간 · 반입 동선",
    desc: "설치할 주방 자리와 급배수·출입구 전경",
  },
] as const;

const QUICK_BULK_EQUIPMENT_PRESETS = [
  "업소용 45박스 냉장/냉동고",
  "테이블 냉장고",
  "음료/주류 쇼케이스",
  "업소용 제빙기",
  "업소용 식기세척기",
  "중대형 냉난방기",
  "스텐 작업대/세정대",
] as const;

export function UnifiedInquiryForm({
  defaultType = "구매 문의",
  linkedProduct,
  isAdmin = false,
  allowNoticeToggle = false,
  onSuccess,
  onCancel,
}: {
  defaultType?: InquiryTypeValue;
  linkedProduct?: LinkedProductContext | null;
  isAdmin?: boolean;
  allowNoticeToggle?: boolean;
  onSuccess?: (inquiryId?: string | null) => void;
  onCancel?: () => void;
}) {
  const [inquiryType, setInquiryType] = useState<InquiryTypeValue>(defaultType);
  const [isNotice, setIsNotice] = useState(false);

  const [name, setName] = useState(isAdmin && isNotice ? STORE.name : "");
  const [phone, setPhone] = useState(isAdmin && isNotice ? STORE.tel : "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [applianceCategory, setApplianceCategory] = useState<string>(
    linkedProduct?.category || PRODUCT_CATEGORIES[0]
  );
  const [title, setTitle] = useState(linkedProduct?.productTitle || "");
  const [model, setModel] = useState(linkedProduct?.modelName || "");
  const [region, setRegion] = useState("");
  const [schedule, setSchedule] = useState("");
  const [description, setDescription] = useState("");

  /* 매입(내 물건 팔기) 전용 상태 — 외관 상태와 실제 작동 상태를 엄격히 분리 */
  const [manufacturingDate, setManufacturingDate] = useState("");
  const [operatingStatus, setOperatingStatus] = useState<string>(
    "작동 상태 미확인 (상담 시 안내)"
  );
  const [conditionGrade, setConditionGrade] = useState<string>("");

  /* 대량·업소용 전용 구조화 상태 — 몰라도 제출 가능하도록 기본값 구성 */
  const [businessType, setBusinessType] = useState("");
  const [bulkItems, setBulkItems] = useState<
    Array<{
      id: string;
      category: string;
      requestedQuantity: string;
      modelNumber: string;
      specs: string;
    }>
  >([
    {
      id: "init-1",
      category: "",
      requestedQuantity: "미확인",
      modelNumber: "",
      specs: "",
    },
  ]);
  const [electricalPhase, setElectricalPhase] = useState<string>("모름/미확인");
  const [voltageUpgrade, setVoltageUpgrade] = useState<string>(
    "모름·현장 확인 필요"
  );
  const [spaceAndUtilities, setSpaceAndUtilities] = useState("");
  const [accessAndRemoval, setAccessAndRemoval] = useState("");

  /* 견적함 연동 상태 */
  const [basketItems, setBasketItems] = useState<QuoteBasketItem[]>([]);
  const [bundleApplied, setBundleApplied] = useState(false);

  /* 사진 첨부 및 Gemini 일괄 분석 상태 */
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [cachedUploadedUrls, setCachedUploadedUrls] = useState<string[] | null>(
    null
  );
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
  const [aiResult, setAiResult] = useState<AnalyzeInquiryResponse | null>(null);
  const [pendingConflicts, setPendingConflicts] = useState<{
    title?: string;
    model?: string;
    description?: string;
  } | null>(null);
  const [showPhotoGuide, setShowPhotoGuide] = useState(false);

  const [agreed, setAgreed] = useState(false);
  const [phase, setPhase] = useState<SubmissionPhase>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);
  const [createdInquiryId, setCreatedInquiryId] = useState<string | null>(null);

  const applyBasketToForm = useCallback((items: QuoteBasketItem[]) => {
    if (items.length === 0) return;
    const summary = formatQuoteBasketSummary(items);
    const nextType =
      summary.hasCommercialItem || items.length >= 2
        ? "대량·업소용 상담"
        : "구매 문의";
    setInquiryType(nextType);
    setTitle(summary.autoTitle);
    setDescription(summary.autoDescription);
    if (nextType === "대량·업소용 상담") {
      setBulkItems(
        items.map((it, idx) => ({
          id: `basket-${idx}`,
          category: it.title,
          requestedQuantity: "1대",
          modelNumber: it.modelName || "",
          specs: formatProductPrice(it.price, it.category),
        }))
      );
    }
    setBundleApplied(true);
  }, []);

  useEffect(() => {
    const syncBasket = () => {
      const current = getQuoteBasket();
      setBasketItems(current);
    };
    syncBasket();
    window.addEventListener(QUOTE_BASKET_EVENT, syncBasket);
    window.addEventListener("storage", syncBasket);
    return () => {
      window.removeEventListener(QUOTE_BASKET_EVENT, syncBasket);
      window.removeEventListener("storage", syncBasket);
    };
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setInquiryType(defaultType);
    });
  }, [defaultType]);

  useEffect(() => {
    queueMicrotask(() => {
      if (linkedProduct?.useBundle) {
        const items = getQuoteBasket();
        if (items.length > 0) {
          applyBasketToForm(items);
          return;
        }
      }
      if (linkedProduct?.productTitle) {
        setTitle(linkedProduct.productTitle);
      }
      if (linkedProduct?.modelName) {
        setModel(linkedProduct.modelName);
      }
      if (linkedProduct?.category) {
        setApplianceCategory(linkedProduct.category);
      }
    });
  }, [linkedProduct, applyBasketToForm]);

  const isSell = !isNotice && isSellInquiry(inquiryType);
  const isBulk = !isNotice && isBulkBizInquiry(inquiryType);
  const isOther = !isNotice && inquiryType === "기타 문의";
  const isBusy =
    phase === "validating" ||
    phase === "submitting" ||
    phase === "retrying" ||
    isAnalyzingPhotos;

  const photoGuideSteps = isBulk
    ? BULK_PHOTO_GUIDE_STEPS
    : isSell
    ? SELL_PHOTO_GUIDE_STEPS
    : BUY_PHOTO_GUIDE_STEPS;

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
    setCachedUploadedUrls(null);
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    setCachedUploadedUrls(null);
  };

  /* 첨부된 사진(1~3장)을 확인 버튼 클릭 시 상담 유형별로 제미나이 일괄 분석 (기존 고객 입력 보호) */
  const handleRunGeminiAnalysis = async () => {
    if (selectedFiles.length === 0 || isAnalyzingPhotos) {
      toast.error("먼저 분석할 사진을 1장 이상 첨부해 주세요.");
      return;
    }

    setIsAnalyzingPhotos(true);
    setPendingConflicts(null);
    const toastId = toast.loading(
      `첨부하신 사진 ${selectedFiles.length}장을 [${inquiryType}] 기준에 맞춰 AI가 분석하고 있습니다...`
    );

    try {
      const formData = new FormData();
      formData.append("inquiryType", inquiryType);
      formData.append("userTitle", title);
      formData.append("userModel", model);
      formData.append("userRegion", region);
      formData.append("userDescription", description);
      formData.append("userBusinessType", businessType);
      formData.append("userElectrical", electricalPhase);
      formData.append("userVoltageUpgrade", voltageUpgrade);

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

      const data = (await res.json().catch(() => ({}))) as AnalyzeInquiryResponse & {
        error?: string;
      };
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "사진 자동 분석에 실패했습니다. 직접 입력해 주세요."
        );
      }

      setAiResult(data);

      // 1) 카테고리 반영 (기타 문의 제외)
      if (
        !isOther &&
        data.applianceCategory &&
        (PRODUCT_CATEGORIES as readonly string[]).includes(
          data.applianceCategory
        )
      ) {
        setApplianceCategory(data.applianceCategory);
      }

      // 2) 고객이 이미 직접 작성한 값과 충돌 여부 검사 (조용히 덮어쓰지 않음)
      const conflicts: {
        title?: string;
        model?: string;
        description?: string;
      } = {};

      if (data.title) {
        if (!title.trim()) {
          setTitle(data.title);
          setFieldErrors((p) => ({ ...p, title: "" }));
        } else if (title.trim() !== data.title.trim()) {
          conflicts.title = data.title;
        }
      }

      if (!isOther && data.modelNumber) {
        if (!model.trim()) {
          setModel(data.modelNumber);
        } else if (model.trim() !== data.modelNumber.trim()) {
          conflicts.model = data.modelNumber;
        }
      }

      if (data.descriptionDraft && !bundleApplied) {
        if (!description.trim()) {
          setDescription(data.descriptionDraft);
          setFieldErrors((p) => ({ ...p, description: "" }));
        } else if (description.trim() !== data.descriptionDraft.trim()) {
          conflicts.description = data.descriptionDraft;
        }
      }

      // 3) 매입(내 물건 팔기) 전용 보조 필드 반영 (등급과 작동 상태는 AI가 확정하지 않음)
      if (isSell && data.sellAnalysis) {
        if (
          !manufacturingDate.trim() &&
          data.sellAnalysis.manufacturingDate &&
          !data.sellAnalysis.manufacturingDate.includes("미확인")
        ) {
          setManufacturingDate(data.sellAnalysis.manufacturingDate);
        }
      }

      // 4) 대량·업소용 전용 구조화 필드 반영
      if (isBulk && data.bulkAnalysis) {
        if (
          !businessType.trim() &&
          data.bulkAnalysis.businessType &&
          !data.bulkAnalysis.businessType.includes("미확인")
        ) {
          setBusinessType(data.bulkAnalysis.businessType);
        }

        const hasUserBulkItems = bulkItems.some((it) => it.category.trim());
        if (
          !hasUserBulkItems &&
          data.bulkAnalysis.requestedItems &&
          data.bulkAnalysis.requestedItems.length > 0
        ) {
          setBulkItems(
            data.bulkAnalysis.requestedItems.map((it, idx) => ({
              id: `ai-bulk-${idx}`,
              category: it.category,
              requestedQuantity: it.requestedQuantity || "미확인",
              modelNumber:
                it.modelNumber && it.modelNumber !== "미확인"
                  ? it.modelNumber
                  : "",
              specs: it.specs || "",
            }))
          );
        }

        if (
          electricalPhase === "모름/미확인" &&
          data.bulkAnalysis.electricalInfo.phaseType !== "모름/미확인"
        ) {
          setElectricalPhase(data.bulkAnalysis.electricalInfo.phaseType);
        }

        if (!spaceAndUtilities.trim()) {
          const spaceParts = [
            data.bulkAnalysis.installationInfo.spaceLayout,
            data.bulkAnalysis.installationInfo.utilities,
          ].filter((x) => x && !x.includes("확인 필요"));
          if (spaceParts.length > 0) {
            setSpaceAndUtilities(spaceParts.join(" / "));
          }
        }
      }

      if (Object.keys(conflicts).length > 0) {
        setPendingConflicts(conflicts);
        toast.success(
          "기존에 입력하신 내용을 유지했습니다. 아래 검토 창에서 AI 제안값 반영 여부를 선택해 주세요.",
          { id: toastId, duration: 4500 }
        );
      } else {
        toast.success(
          "AI 분석 초안이 반영되었습니다! 미확인 항목을 확인·수정해 주세요.",
          { id: toastId }
        );
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "사진 분석 중 오류가 발생했습니다.",
        { id: toastId }
      );
    } finally {
      setIsAnalyzingPhotos(false);
    }
  };

  const addBulkEquipmentRow = (presetCategory = "") => {
    setBulkItems((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        category: presetCategory,
        requestedQuantity: "미확인",
        modelNumber: "",
        specs: "",
      },
    ]);
  };

  const updateBulkItem = (
    id: string,
    field: "category" | "requestedQuantity" | "modelNumber" | "specs",
    value: string
  ) => {
    setBulkItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeBulkItem = (id: string) => {
    setBulkItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.id !== id) : prev
    );
  };

  const appendFollowUpQuestionLine = (question: string) => {
    setDescription((prev) =>
      prev.trim()
        ? `${prev.trim()}\n• [추가 확인] ${question}: `
        : `• [추가 확인] ${question}: `
    );
    setFieldErrors((p) => ({ ...p, description: "" }));
    toast.success("상세 문의란 하단에 답변 입력 줄이 추가되었습니다.");
  };

  const validateFields = (): boolean => {
    setPhase("validating");
    const errors: Record<string, string> = {};

    if (!isNotice) {
      if (!name.trim()) {
        errors.name = "성함 또는 상호명을 입력해 주세요.";
      }
      if (!phone.trim() || !isValidPhone(phone)) {
        errors.phone = "연락 가능한 전화번호를 정확히 입력해 주세요.";
      }
      if (password.trim().length < 4) {
        errors.password = "답변 확인용 비밀번호를 4자리 이상 입력해 주세요.";
      }
      if (isSell && !region.trim()) {
        errors.region = "방문 수거 지역(구/동까지)을 입력해 주세요.";
      }
      if (!agreed) {
        errors.agreed = "개인정보 수집·이용에 동의해 주세요.";
      }
    }

    if (!title.trim()) {
      errors.title = isNotice
        ? "공지 제목을 입력해 주세요."
        : isSell
        ? "처분하실 가전 품목 또는 제목을 입력해 주세요."
        : "문의하실 품목 또는 제목을 입력해 주세요.";
    }

    if (!description.trim()) {
      errors.description = isSell
        ? "제품 상태나 희망 수거 일정 등 간단한 설명을 입력해 주세요."
        : "문의하실 내용을 입력해 주세요.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setPhase("idle");
      toast.error(Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  const executeSubmit = async (isRetryAttempt = false) => {
    if (isBusy) return;
    setSubmitErrorMsg(null);

    if (!validateFields()) return;

    setPhase(isRetryAttempt ? "retrying" : "submitting");

    try {
      let uploadedUrls = cachedUploadedUrls ?? [];
      if (!cachedUploadedUrls && selectedFiles.length > 0) {
        const freshUrls: string[] = [];
        for (const file of selectedFiles) {
          const blob = await compressImage(file, 1400, 0.8);
          const fileName = `inq_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}.jpg`;
          const { error: uploadErr } = await supabase.storage
            .from(STORAGE_BUCKETS.inquiries)
            .upload(fileName, blob, { contentType: "image/jpeg" });
          if (uploadErr) {
            throw new Error(
              "사진 업로드 중 네트워크 오류가 발생했습니다. 다시 시도해 주세요."
            );
          }
          const { data: pubData } = supabase.storage
            .from(STORAGE_BUCKETS.inquiries)
            .getPublicUrl(fileName);
          if (pubData?.publicUrl) freshUrls.push(pubData.publicUrl);
        }
        uploadedUrls = freshUrls;
        setCachedUploadedUrls(freshUrls);
      }

      const structuredDescription = isNotice
        ? description.trim()
        : formatStructuredInquiryDescription({
            inquiryType,
            customerContent: description.trim(),
            linkedProductUrl: linkedProduct?.productId
              ? `${STORE.url}/${linkedProduct.productId}`
              : undefined,
            applianceCategory: !isOther ? applianceCategory : undefined,
            modelNumber: !isOther ? model.trim() : undefined,
            region: region.trim() || undefined,
            schedule: schedule.trim() || undefined,
            manufacturingDate: isSell ? manufacturingDate.trim() : undefined,
            operatingStatus: isSell ? operatingStatus : undefined,
            conditionGrade:
              isSell && conditionGrade.trim()
                ? conditionGrade.trim()
                : undefined,
            businessType: isBulk ? businessType.trim() : undefined,
            bulkItems: isBulk ? bulkItems : undefined,
            electricalPhase: isBulk ? electricalPhase : undefined,
            voltageUpgrade: isBulk ? voltageUpgrade : undefined,
            spaceAndUtilities: isBulk ? spaceAndUtilities.trim() : undefined,
            accessAndRemoval: isBulk ? accessAndRemoval.trim() : undefined,
            aiReference: aiResult
              ? {
                  summaryNote: aiResult.summaryNote,
                  extractedFacts: aiResult.extractedFacts,
                  missingInfo: aiResult.missingInfo,
                  followUpQuestions: aiResult.followUpQuestions,
                }
              : null,
          });

      const finalTitle =
        isSell && !title.includes("[")
          ? `[${applianceCategory}] ${title.trim()}`
          : title.trim();

      const authHeaders = isNotice ? await getAdminAuthHeaders() : {};
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: isNotice ? name.trim() || STORE.name : name.trim(),
          phone: isNotice ? phone.trim() || STORE.tel : phone,
          password: isNotice ? "0000" : password.trim(),
          inquiry_type: isNotice ? "공지사항" : inquiryType,
          category: finalTitle,
          model: !isOther && model.trim() ? model.trim() : null,
          condition_grade:
            isSell && conditionGrade.trim() ? conditionGrade.trim() : null,
          region: region.trim() || "대전/기타",
          description: structuredDescription,
          images: uploadedUrls,
          is_notice: isNotice,
        }),
      });

      const resJson = await res.json().catch(() => ({}));
      if (!res.ok || !resJson.success) {
        throw new Error(
          resJson.error ||
            "문의 접수 저장에 실패했습니다. 잠시 후 다시 시도해 주세요."
        );
      }

      const newId = resJson.inquiryId || null;
      setCreatedInquiryId(newId);
      setPhase("success");
      if (bundleApplied) {
        clearQuoteBasket();
      }
      trackEvent("submit_inquiry_success", {
        inquiry_type: isNotice ? "공지사항" : inquiryType,
        has_photos: uploadedUrls.length > 0,
      });

      toast.success(
        isNotice
          ? "공지사항이 등록되었습니다."
          : "접수가 정상적으로 완료되었습니다!"
      );

      if (!isNotice) {
        fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inquiryId: newId,
            name: name.trim(),
            phone,
            type: inquiryType,
            title: finalTitle,
          }),
        }).catch(() => {});
      }

      if (onSuccess) {
        onSuccess(newId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setPhase("error");
      setSubmitErrorMsg(
        msg ||
          "네트워크 연결 문제로 접수되지 않았습니다. 아래 [그대로 재시도] 버튼을 눌러주세요."
      );
      toast.error(msg || "접수 중 오류가 발생했습니다.");
    }
  };

  const resetToInitial = () => {
    filePreviews.forEach((u) => URL.revokeObjectURL(u));
    setSelectedFiles([]);
    setFilePreviews([]);
    setCachedUploadedUrls(null);
    setAiResult(null);
    setPendingConflicts(null);
    setTitle("");
    setModel("");
    setRegion("");
    setSchedule("");
    setManufacturingDate("");
    setOperatingStatus("작동 상태 미확인 (상담 시 안내)");
    setConditionGrade("");
    setBusinessType("");
    setSpaceAndUtilities("");
    setAccessAndRemoval("");
    setDescription("");
    setPassword("");
    setBundleApplied(false);
    setFieldErrors({});
    setSubmitErrorMsg(null);
    setCreatedInquiryId(null);
    setPhase("idle");
  };

  if (phase === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-6 sm:p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0E1A2B] text-white">
          <Icon d={ICON.check} className="h-6 w-6 text-[#FF8A50]" />
        </div>
        <h3 className="text-[20px] font-bold text-[#0E1A2B]">
          {isSell
            ? "매입 견적 신청이 정상 접수되었습니다."
            : "상담 문의가 정상 접수되었습니다."}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[#4B5260]">
          남겨주신 내용은 담당자가 확인 후 연락드립니다. 설정하신 비밀번호로{" "}
          <strong className="text-[#0E1A2B]">문의게시판</strong>에서 진행 상태와 답변을 언제든 조회하실 수 있습니다.
        </p>

        <div className="mt-5 rounded border border-[#E4E0D8] bg-white p-4 text-left text-[13px] text-[#4B5260] max-w-md mx-auto space-y-1">
          <p>
            • 접수 구분:{" "}
            <strong className="text-[#0E1A2B]">{inquiryType}</strong>
          </p>
          <p>
            • 접수 품목/제목:{" "}
            <strong className="text-[#0E1A2B]">{title}</strong>
          </p>
          {createdInquiryId && (
            <p className="text-[12px] text-[#8A8478]">
              • 접수 번호: #{String(createdInquiryId).slice(0, 8)}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Link href="/inquiry" className="hb-btn-primary h-11 px-5 text-[14px]">
            문의게시판에서 확인하기
          </Link>
          <button
            type="button"
            onClick={resetToInitial}
            className="hb-btn-outline h-11 px-5 text-[14px]"
          >
            추가 문의 작성하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        executeSubmit(false);
      }}
      noValidate
      className="space-y-4"
    >
      {isAdmin && allowNoticeToggle && (
        <label className="flex cursor-pointer items-center justify-between rounded-md border border-[#FADCD0] bg-[#FFF5F0] px-4 py-3">
          <div>
            <span className="block text-[13.5px] font-bold text-[#B5431A]">
              최상단 고정 공지사항으로 등록
            </span>
            <span className="mt-0.5 block text-[11.5px] text-[#D9531E]">
              체크 시 모든 방문자가 비밀번호 없이 열람할 수 있는 공지로 게시됩니다.
            </span>
          </div>
          <input
            type="checkbox"
            checked={isNotice}
            onChange={(e) => setIsNotice(e.target.checked)}
            className="h-5 w-5 accent-[#D9531E]"
          />
        </label>
      )}

      {/* 관심 매물 견적함(묶음 문의) 자동 불러오기 배너 */}
      {!isNotice && basketItems.length > 0 && (
        <div className="rounded-md border border-[#0E1A2B] bg-[#F8FAFC] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#D9531E] text-[11px] font-bold text-white">
                {basketItems.length}
              </span>
              <strong className="text-[13px] font-bold text-[#0E1A2B]">
                견적함에 담아둔 관심 매물 {basketItems.length}건
              </strong>
            </div>
            <button
              type="button"
              onClick={() => {
                applyBasketToForm(basketItems);
                toast.success(
                  `견적함 상품 ${basketItems.length}건이 문의 내용에 자동 입력되었습니다.`
                );
              }}
              className="rounded bg-[#0E1A2B] px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-[#1C2D47]"
            >
              {bundleApplied ? "목록 다시 반영" : "묶음 견적으로 자동 입력"}
            </button>
          </div>

          <ul className="mt-2 flex flex-wrap gap-1.5">
            {basketItems.map((item) => (
              <li
                key={item.id}
                className="inline-flex items-center gap-1.5 rounded border border-[#DDD9D1] bg-white px-2 py-0.5 text-[11.5px]"
              >
                <span className="font-semibold text-[#0E1A2B] truncate max-w-[160px]">
                  {item.title}
                </span>
                <span className="text-[#D9531E] font-bold">
                  ({formatProductPrice(item.price, item.category)})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = removeQuoteBasketItem(item.id);
                    if (bundleApplied && next.length > 0) {
                      applyBasketToForm(next);
                    }
                  }}
                  aria-label={`${item.title} 제외`}
                  className="text-[#8A8478] hover:text-red-600"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 1. 상단 컴팩트 블록: 상담 유형 4탭 + 성함/연락처/비밀번호 */}
      {!isNotice ? (
        <fieldset className="rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-3.5 sm:p-4">
          <legend className="sr-only">상담 유형 및 기본 정보</legend>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-md bg-[#EAE6DF] p-1">
            {INQUIRY_TYPES.map((t) => {
              const active = inquiryType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setInquiryType(t);
                    setPendingConflicts(null);
                  }}
                  aria-pressed={active}
                  className={`h-9 rounded px-2 text-[12px] sm:text-[12.5px] font-bold transition-all ${
                    active
                      ? "bg-[#0E1A2B] text-white shadow-2xs"
                      : "bg-white/60 text-[#4B5260] hover:bg-white hover:text-[#0E1A2B]"
                  }`}
                >
                  {t === "내 물건 팔기" ? "내 물건 팔기(매입)" : t}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div>
              <label htmlFor="uf-name" className="hb-label text-[12px]">
                성함 / 상호명 <span className="text-[#D9531E]">*</span>
              </label>
              <input
                id="uf-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name)
                    setFieldErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="홍길동 / 한밭식당"
                className={`hb-input mt-1 py-2 text-[13.5px] bg-white ${
                  fieldErrors.name ? "border-red-500 ring-1 ring-red-500" : ""
                }`}
              />
            </div>

            <div>
              <label htmlFor="uf-phone" className="hb-label text-[12px]">
                연락처 <span className="text-[#D9531E]">*</span>
              </label>
              <input
                id="uf-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(formatPhone(e.target.value));
                  if (fieldErrors.phone)
                    setFieldErrors((p) => ({ ...p, phone: "" }));
                }}
                placeholder="010-0000-0000"
                className={`hb-input mt-1 py-2 text-[13.5px] bg-white tabular-nums ${
                  fieldErrors.phone ? "border-red-500 ring-1 ring-red-500" : ""
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="uf-pw" className="hb-label text-[12px]">
                  비밀번호 <span className="text-[#D9531E]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[11px] font-semibold text-[#6B7280] hover:text-[#0E1A2B]"
                >
                  {showPassword ? "숨기기" : "표시"}
                </button>
              </div>
              <input
                id="uf-pw"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password)
                    setFieldErrors((p) => ({ ...p, password: "" }));
                }}
                placeholder="내 글 확인용 (4자 이상)"
                className={`hb-input mt-1 py-2 text-[13.5px] bg-white ${
                  fieldErrors.password
                    ? "border-red-500 ring-1 ring-red-500"
                    : ""
                }`}
              />
            </div>
          </div>
        </fieldset>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="uf-name" className="hb-label text-[12.5px]">
              작성자명
            </label>
            <input
              id="uf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={STORE.name}
              className="hb-input mt-1 py-2"
            />
          </div>
          <div>
            <label htmlFor="uf-phone" className="hb-label text-[12.5px]">
              연락처 표시
            </label>
            <input
              id="uf-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder={STORE.tel}
              className="hb-input mt-1 py-2"
            />
          </div>
        </div>
      )}

      {/* 2. 중단 핵심 블록: 사진 첨부(최대 3장) + 상담 유형별 AI 일괄 분석 + 맞춤형 입력란 */}
      <div className="rounded-md border border-[#E4E0D8] bg-white p-3.5 sm:p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#F0EDE7]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-sm bg-[#0E1A2B] px-2 py-0.5 text-[11px] font-bold text-[#FF8A50]">
              ✨ {inquiryType} AI 맞춤 분석
            </span>
            <span className="text-[13px] font-bold text-[#0E1A2B]">
              사진 첨부 ({selectedFiles.length}/{MAX_PHOTOS}장)
            </span>
            {!isNotice && !isOther && (
              <button
                type="button"
                onClick={() => setShowPhotoGuide((v) => !v)}
                className="text-[11.5px] font-semibold text-[#D9531E] underline underline-offset-2"
              >
                {showPhotoGuide ? "촬영 팁 닫기 ▲" : "권장 촬영 팁 ▾"}
              </button>
            )}
          </div>

          {!isNotice && (
            <button
              type="button"
              onClick={handleRunGeminiAnalysis}
              disabled={selectedFiles.length === 0 || isAnalyzingPhotos}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12.5px] font-bold transition-all shadow-2xs ${
                selectedFiles.length > 0
                  ? "bg-[#D9531E] text-white hover:bg-[#BF4715] ring-2 ring-[#D9531E]/25"
                  : "bg-[#F2F0EC] text-[#8A8478] cursor-not-allowed"
              }`}
            >
              <span>
                {isAnalyzingPhotos
                  ? "제미나이 AI 분석 중..."
                  : selectedFiles.length > 0
                  ? `✨ 사진 ${selectedFiles.length}장 AI 자동입력 확인`
                  : "사진 첨부 후 AI 자동입력"}
              </span>
            </button>
          )}
        </div>

        {/* 사진 썸네일 + 추가 버튼 */}
        <div className="flex flex-wrap items-center gap-2.5">
          {filePreviews.map((preview, idx) => (
            <div
              key={preview}
              className="relative h-14 w-14 overflow-hidden rounded border border-[#DDD9D1] bg-[#EFECE6] shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={`첨부 사진 ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              <span className="absolute left-0.5 bottom-0.5 rounded bg-black/65 px-1 text-[9px] font-bold text-white">
                #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFile(idx)}
                aria-label="첨부 사진 삭제"
                className="absolute right-0.5 top-0.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-black/75 text-white hover:bg-red-600"
              >
                <Icon d={ICON.close} className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}

          {selectedFiles.length < MAX_PHOTOS && (
            <label className="flex h-14 w-20 cursor-pointer flex-col items-center justify-center gap-0.5 rounded border border-dashed border-[#CFCAC0] bg-[#FAF9F7] text-[11px] font-bold text-[#4B5260] hover:border-[#0E1A2B] hover:text-[#0E1A2B] transition-colors shrink-0">
              <Icon d={ICON.camera} className="h-4 w-4 text-[#D9531E]" />
              <span>+ 사진 추가</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          )}

          <p className="text-[11.5px] text-[#6B7280] leading-snug flex-1 min-w-[180px]">
            {selectedFiles.length === 0
              ? "사진(1~3장)을 올리고 우측 [AI 자동입력 확인]을 누르면 상담 유형에 맞춰 초안을 작성합니다. (사진 없이 직접 입력도 가능)"
              : "추가할 사진을 모두 넣으셨다면 우측 [✨ AI 자동입력 확인] 버튼을 눌러주세요."}
          </p>
        </div>

        {/* 접이식 3컷 촬영 가이드 */}
        {!isNotice && !isOther && showPhotoGuide && (
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded bg-[#FAF9F7] p-2.5 border border-[#E4E0D8] text-[11.5px]">
            {photoGuideSteps.map((g) => (
              <li key={g.step} className="flex items-start gap-1.5">
                <span className="shrink-0 rounded-sm bg-[#0E1A2B] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  컷 {g.step}
                </span>
                <div>
                  <strong className="font-bold text-[#0E1A2B] block">
                    {g.title}
                  </strong>
                  <span className="text-[#4B5260]">{g.desc}</span>
                </div>
              </li>
            ))}
          </ol>
        )}

        {/* AI 분석 결과 요약, 기존 입력값 충돌 시 선택 반영 패널, 후속 질문 칩 */}
        {aiResult && (
          <div className="rounded border border-[#0E1A2B]/20 bg-[#F8FAFC] p-3 space-y-2.5 text-[12px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-[#0E1A2B]">
                ✅ {aiResult.summaryNote}
              </span>
              <span className="text-[11px] text-[#6B7280]">
                제출 전 아래 입력란에서 자유롭게 수정 가능
              </span>
            </div>

            {/* 고객이 이미 입력한 값과 AI 제안값이 다를 때 덮어쓰지 않고 선택권 부여 */}
            {pendingConflicts && (
              <div className="rounded border border-amber-300 bg-amber-50 p-2.5 space-y-2 text-amber-950">
                <div className="flex items-center justify-between">
                  <strong className="text-[11.5px]">
                    ⚠️ 먼저 입력해 두신 내용을 보호하기 위해 자동 덮어쓰기를 건너뛰었습니다.
                  </strong>
                  <button
                    type="button"
                    onClick={() => setPendingConflicts(null)}
                    className="text-[11px] underline"
                  >
                    닫기
                  </button>
                </div>

                {pendingConflicts.title && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-2.5 py-1.5 border border-amber-200">
                    <span className="truncate">
                      AI 제안 제목: <strong>{pendingConflicts.title}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTitle(pendingConflicts.title!);
                        setPendingConflicts((prev) =>
                          prev ? { ...prev, title: undefined } : null
                        );
                      }}
                      className="rounded bg-[#0E1A2B] px-2 py-0.5 text-[11px] font-bold text-white"
                    >
                      이 제목 적용
                    </button>
                  </div>
                )}

                {pendingConflicts.model && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-2.5 py-1.5 border border-amber-200">
                    <span>
                      AI 판독 모델명:{" "}
                      <strong className="font-mono">
                        {pendingConflicts.model}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setModel(pendingConflicts.model!);
                        setPendingConflicts((prev) =>
                          prev ? { ...prev, model: undefined } : null
                        );
                      }}
                      className="rounded bg-[#0E1A2B] px-2 py-0.5 text-[11px] font-bold text-white"
                    >
                      이 모델명 적용
                    </button>
                  </div>
                )}

                {pendingConflicts.description && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-2.5 py-1.5 border border-amber-200">
                    <span>AI가 작성한 상세 문의 초안이 준비되었습니다.</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDescription(
                            (prev) =>
                              `${prev.trim()}\n\n${pendingConflicts.description}`
                          );
                          setPendingConflicts((prev) =>
                            prev ? { ...prev, description: undefined } : null
                          );
                        }}
                        className="rounded border border-[#0E1A2B] bg-white px-2 py-0.5 text-[11px] font-bold text-[#0E1A2B]"
                      >
                        내 글 아래에 추가
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDescription(pendingConflicts.description!);
                          setPendingConflicts((prev) =>
                            prev ? { ...prev, description: undefined } : null
                          );
                        }}
                        className="rounded bg-[#0E1A2B] px-2 py-0.5 text-[11px] font-bold text-white"
                      >
                        AI 초안으로 교체
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 판독된 사실 배지 */}
            {aiResult.extractedFacts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {aiResult.extractedFacts.map((fact, idx) => (
                  <span
                    key={fact.label + idx}
                    className="inline-flex items-center gap-1 rounded border border-[#E4E0D8] bg-white px-2 py-0.5 text-[11px]"
                  >
                    <strong className="text-[#0E1A2B]">{fact.label}:</strong>
                    <span className="text-[#4B5260]">{fact.value}</span>
                    <span className="text-[10px] text-[#8A8478]">
                      ({fact.source} · {fact.status})
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* 사진만으로 알 수 없는 후속 확인 질문 칩 */}
            {aiResult.followUpQuestions.length > 0 && (
              <div className="space-y-1 pt-0.5">
                <span className="block text-[11px] font-bold text-[#B5431A]">
                  💬 사진만으로 알 수 없는 정보입니다 (클릭 시 본문에 답변 줄 추가):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {aiResult.followUpQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => appendFollowUpQuestionLine(q)}
                      className="rounded border border-[#FADCD0] bg-[#FFF5F0] px-2 py-1 text-left text-[11px] font-semibold text-[#B5431A] hover:bg-[#FADCD0]/60"
                    >
                      + {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* [대량·업소용 상담] 전용 구조화 입력 블록 */}
        {!isNotice && isBulk && (
          <div className="rounded-md border border-[#0E1A2B]/15 bg-[#FAF9F7] p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <strong className="text-[12.5px] font-bold text-[#0E1A2B]">
                🏢 업소용·대량 상담 맞춤 정보 (모르시는 항목은 비워두셔도 됩니다)
              </strong>
              <span className="text-[11px] text-[#6B7280]">
                사진 속 대수와 실제 희망 수량을 구분하여 적어주세요
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="hb-label text-[11.5px]">
                  업종 / 사용 목적 (선택)
                </label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="예: 식당 창업, 카페, 폐업정리"
                  className="hb-input mt-1 py-1.5 text-[12.5px] bg-white"
                />
              </div>
              <div>
                <label className="hb-label text-[11.5px]">
                  매장 전기 규격 (선택)
                </label>
                <select
                  value={electricalPhase}
                  onChange={(e) => setElectricalPhase(e.target.value)}
                  className="hb-input mt-1 py-1.5 text-[12.5px] font-semibold bg-white"
                >
                  <option value="모름/미확인">모름 (상담/현장 확인)</option>
                  <option value="단상 220V">단상 220V (일반 상가)</option>
                  <option value="삼상 380V">삼상 380V (대형 주방/동력)</option>
                </select>
              </div>
              <div>
                <label className="hb-label text-[11.5px]">
                  승압 필요 여부 (선택)
                </label>
                <select
                  value={voltageUpgrade}
                  onChange={(e) => setVoltageUpgrade(e.target.value)}
                  className="hb-input mt-1 py-1.5 text-[12.5px] font-semibold bg-white"
                >
                  <option value="모름·현장 확인 필요">
                    모름 (장비 사양·현장 확인 필요)
                  </option>
                  <option value="불필요">불필요 (기존 전력 충분)</option>
                  <option value="필요">필요 (승압 예정/상담 희망)</option>
                </select>
              </div>
            </div>

            {/* 필요 장비 및 희망 수량 리스트 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="hb-label text-[11.5px]">
                  필요 장비 종류 및 구매/처분 희망 수량
                </span>
                <button
                  type="button"
                  onClick={() => addBulkEquipmentRow("")}
                  className="text-[11.5px] font-bold text-[#D9531E] underline"
                >
                  + 장비 줄 추가
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {QUICK_BULK_EQUIPMENT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const emptyIdx = bulkItems.findIndex(
                        (it) => !it.category.trim()
                      );
                      if (emptyIdx >= 0) {
                        updateBulkItem(
                          bulkItems[emptyIdx].id,
                          "category",
                          preset
                        );
                      } else {
                        addBulkEquipmentRow(preset);
                      }
                    }}
                    className="rounded border border-[#DDD9D1] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#0E1A2B] hover:border-[#0E1A2B]"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                {bulkItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center bg-white p-1.5 rounded border border-[#E4E0D8]"
                  >
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) =>
                          updateBulkItem(item.id, "category", e.target.value)
                        }
                        placeholder={`품목 ${idx + 1} (예: 45박스 냉장고, 제빙기)`}
                        className="hb-input py-1 text-[12.5px]"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={item.requestedQuantity}
                        onChange={(e) =>
                          updateBulkItem(
                            item.id,
                            "requestedQuantity",
                            e.target.value
                          )
                        }
                        placeholder="희망 수량 (예: 1대 / 미확인)"
                        className="hb-input py-1 text-[12.5px]"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={item.modelNumber}
                        onChange={(e) =>
                          updateBulkItem(item.id, "modelNumber", e.target.value)
                        }
                        placeholder="모델·규격 (선택)"
                        className="hb-input py-1 text-[12px] font-mono"
                      />
                    </div>
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => removeBulkItem(item.id)}
                        className="text-[11.5px] font-bold text-red-600 px-1.5 py-0.5"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="hb-label text-[11.5px]">
                  설치 공간 · 급배수 · 가스 · 환기 메모 (선택)
                </label>
                <input
                  type="text"
                  value={spaceAndUtilities}
                  onChange={(e) => setSpaceAndUtilities(e.target.value)}
                  placeholder="예: 1층 주방 급배수 완비 / 환기 후드 있음"
                  className="hb-input mt-1 py-1.5 text-[12.5px] bg-white"
                />
              </div>
              <div>
                <label className="hb-label text-[11.5px]">
                  반입 동선(문폭·층수) 및 기존 기기 철거 여부 (선택)
                </label>
                <input
                  type="text"
                  value={accessAndRemoval}
                  onChange={(e) => setAccessAndRemoval(e.target.value)}
                  placeholder="예: 1층 양개문 진입 가능, 기존 냉장고 1대 철거 희망"
                  className="hb-input mt-1 py-1.5 text-[12.5px] bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* [내 물건 팔기(매입)] 전용 확인 블록: 작동 상태와 외관 상태를 분리 */}
        {!isNotice && isSell && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-3">
            <div>
              <label htmlFor="uf-mfg" className="hb-label text-[12px]">
                제조년월 / 연식{" "}
                <span className="font-normal text-[#6B7280]">(확인 시)</span>
              </label>
              <input
                id="uf-mfg"
                type="text"
                value={manufacturingDate}
                onChange={(e) => setManufacturingDate(e.target.value)}
                placeholder="예: 2022년식 / 미확인"
                className="hb-input mt-1 py-1.5 text-[13px] bg-white"
              />
            </div>

            <div>
              <label htmlFor="uf-op" className="hb-label text-[12px]">
                실제 작동 상태 확인
              </label>
              <select
                id="uf-op"
                value={operatingStatus}
                onChange={(e) => setOperatingStatus(e.target.value)}
                className="hb-input mt-1 py-1.5 text-[13px] font-semibold bg-white"
              >
                <option value="작동 상태 미확인 (상담 시 안내)">
                  작동 상태 미확인 (상담 시 안내)
                </option>
                <option value="정상 작동 확인됨">
                  정상 작동 (냉방·냉동·세탁 이상 없음)
                </option>
                <option value="일부 점검 필요">
                  일부 점검 필요 (소음·냉기약함 등)
                </option>
              </select>
            </div>

            <div>
              <label htmlFor="uf-grade" className="hb-label text-[12px]">
                외관 상태 선택{" "}
                <span className="font-normal text-[#6B7280]">(선택)</span>
              </label>
              <select
                id="uf-grade"
                value={conditionGrade}
                onChange={(e) => setConditionGrade(e.target.value)}
                className="hb-input mt-1 py-1.5 text-[13px] font-semibold bg-white"
              >
                <option value="">미선택 (사진/현장 확인 후 결정)</option>
                {PRODUCT_CONDITION_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 공통 품목/지역/일정 입력 (기타 문의에서는 불필요한 가전 분류/모델명 숨김) */}
        {!isNotice && !isOther && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
            <div>
              <label htmlFor="uf-cat" className="hb-label text-[12px]">
                제품 종류
              </label>
              <select
                id="uf-cat"
                value={applianceCategory}
                onChange={(e) => setApplianceCategory(e.target.value)}
                className="hb-input mt-1 py-2 text-[13px] font-semibold"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="uf-region" className="hb-label text-[12px]">
                {isSell ? "방문 수거 지역 (동/구까지) *" : "설치/현장 지역 (선택)"}
              </label>
              <input
                id="uf-region"
                type="text"
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  if (fieldErrors.region)
                    setFieldErrors((p) => ({ ...p, region: "" }));
                }}
                placeholder="예: 대전 중구 중촌동"
                className={`hb-input mt-1 py-2 text-[13px] ${
                  fieldErrors.region ? "border-red-500" : ""
                }`}
              />
            </div>

            <div>
              <label htmlFor="uf-schedule" className="hb-label text-[12px]">
                희망 일정 · 층수(엘리베이터)
              </label>
              <input
                id="uf-schedule"
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="예: 금요일 오후 / 1층 상가"
                className="hb-input mt-1 py-2 text-[13px]"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
          <div
            className={
              isNotice || isOther ? "sm:col-span-3" : "sm:col-span-2"
            }
          >
            <label htmlFor="uf-title" className="hb-label text-[12px]">
              {isNotice
                ? "공지 제목 *"
                : isSell
                ? "매입 신청 품목 / 제목 *"
                : isBulk
                ? "대량·업소용 상담 제목 *"
                : "문의 제목 *"}
            </label>
            <input
              id="uf-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title)
                  setFieldErrors((p) => ({ ...p, title: "" }));
              }}
              placeholder={
                isSell
                  ? "예: 삼성 양문형 냉장고 방문 매입 견적 문의"
                  : isBulk
                  ? "예: 식당 오픈용 45박스 냉장고·제빙기·세척기 도입 상담"
                  : isOther
                  ? "문의하실 제목을 입력해 주세요"
                  : "예: 캐리어 벽걸이 냉난방기 9평형 재고·설치 문의"
              }
              className={`hb-input mt-1 py-2 text-[13.5px] ${
                fieldErrors.title ? "border-red-500 ring-1 ring-red-500" : ""
              }`}
            />
          </div>

          {!isNotice && !isOther && (
            <div>
              <label htmlFor="uf-model" className="hb-label text-[12px]">
                모델명{" "}
                <span className="font-normal text-[#6B7280]">(선택/AI판독)</span>
              </label>
              <input
                id="uf-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="명판 확인 시 입력"
                className="hb-input mt-1 py-2 font-mono text-[13px]"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="uf-desc" className="hb-label text-[12px]">
            {isNotice
              ? "공지 본문 내용 *"
              : "상세 문의 내용 (AI 초안을 자유롭게 수정하실 수 있습니다) *"}
          </label>
          <textarea
            id="uf-desc"
            rows={bundleApplied || isBulk ? 5 : 4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (fieldErrors.description)
                setFieldErrors((p) => ({ ...p, description: "" }));
            }}
            placeholder={
              isSell
                ? "예: 정상 작동하며 1층 매장이라 반출 용이합니다. 이번 주 금요일 수거 희망합니다."
                : isBulk
                ? "예: 대전 서구 둔산동 1층 식당 오픈 준비 중입니다. 중고 업소용 냉장고와 제빙기 세트 견적 부탁드립니다."
                : "예: 대전 서구 둔산동 1층 상가입니다. 배송 및 기본 설치 포함 견적이 궁금합니다."
            }
            className={`hb-input mt-1 py-2 text-[13.5px] resize-y leading-relaxed ${
              fieldErrors.description
                ? "border-red-500 ring-1 ring-red-500"
                : ""
            }`}
          />
        </div>
      </div>

      {/* 3. 하단 개인정보 동의 및 제출 버튼 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E4E0D8]">
        {!isNotice ? (
          <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[#4B5260]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (fieldErrors.agreed)
                  setFieldErrors((p) => ({ ...p, agreed: "" }));
              }}
              className="h-4 w-4 shrink-0 accent-[#0E1A2B]"
            />
            <span>
              상담·견적 안내를 위한{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-bold text-[#0E1A2B] underline underline-offset-2"
              >
                개인정보 수집·이용
              </Link>
              에 동의합니다. <span className="text-[#D9531E]">*</span>
            </span>
          </label>
        ) : (
          <div />
        )}

        <div className="flex items-center justify-end gap-2 shrink-0">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isBusy}
              className="hb-btn-outline h-11 px-5 text-[13.5px]"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={isBusy}
            className={`${
              isSell || isNotice ? "hb-btn-accent" : "hb-btn-primary"
            } h-11 px-7 text-[14px] w-full sm:w-auto whitespace-nowrap`}
          >
            {phase === "validating"
              ? "확인 중..."
              : phase === "submitting"
              ? "안전하게 접수 중..."
              : phase === "retrying"
              ? "재시도 중..."
              : isNotice
              ? "공지사항 등록하기"
              : isSell
              ? "무료 매입 견적 신청하기"
              : bundleApplied
              ? "묶음 견적 문의 접수하기"
              : `${inquiryType} 접수하기`}
          </button>
        </div>
      </div>

      {phase === "error" && submitErrorMsg && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3.5 text-[12.5px] text-red-800 flex flex-wrap items-center justify-between gap-2"
        >
          <span className="font-bold">{submitErrorMsg}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => executeSubmit(true)}
              className="rounded bg-red-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-red-700"
            >
              그대로 재시도
            </button>
            <a
              href={telHref(STORE.tel)}
              className="rounded border border-red-300 bg-white px-3 py-1.5 text-[12px] font-bold text-red-700"
            >
              전화({STORE.tel}) 문의
            </a>
          </div>
        </div>
      )}
    </form>
  );
}