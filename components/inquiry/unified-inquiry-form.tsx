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
  QUOTE_BASKET_EVENT,
  type QuoteBasketItem,
  removeQuoteBasketItem,
  updateQuoteBasketItemQuantity,
  isProductSold,
  smsHref,
  STORAGE_BUCKETS,
  STORE,
  trackEvent,
  validateImageFiles,
} from "../../lib/site";
import { Icon, ICON } from "../../lib/ui";
import { AirconSetGuideBanner } from "../products/aircon-set-guide-banner";

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
  envNote?: string;
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
  fixedType,
  hideTypeSelector = false,
  linkedProduct,
  isAdmin = false,
  allowNoticeToggle = false,
  onSuccess,
  onCancel,
}: {
  defaultType?: InquiryTypeValue;
  fixedType?: InquiryTypeValue;
  hideTypeSelector?: boolean;
  linkedProduct?: LinkedProductContext | null;
  isAdmin?: boolean;
  allowNoticeToggle?: boolean;
  onSuccess?: (inquiryId?: string | null) => void;
  onCancel?: () => void;
}) {
  const initialType = fixedType || defaultType;
  const [inquiryType, setInquiryType] = useState<InquiryTypeValue>(initialType);
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

  /* 매입(내 물건 팔기) 전용 상태 */
  const [manufacturingDate, setManufacturingDate] = useState("");
  const [operatingStatus, setOperatingStatus] = useState<string>(
    "작동 상태 미확인 (상담 시 안내)"
  );
  const [conditionGrade, setConditionGrade] = useState<string>("");

  /* 대량·업소용 전용 구조화 상태 */
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
      summary.hasCommercialItem || items.length >= 2 || summary.totalUnitCount >= 2
        ? "대량·업소용 상담"
        : "구매 문의";
    setInquiryType(nextType);
    setTitle(summary.autoTitle);
    setDescription(summary.autoDescription);
    if (nextType === "대량·업소용 상담") {
      setBulkItems(
        items.map((it, idx) => ({
          id: `basket-${idx}`,
          category: `${it.title} (#${String(it.id).slice(0, 6)})`,
          requestedQuantity: `${it.quantity || 1}대`,
          modelNumber: it.modelName || "",
          specs: isProductSold(it.status)
            ? "판매완료(유사재고 요청)"
            : formatProductPrice(it.price, it.category),
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
      setInquiryType(fixedType || defaultType);
    });
  }, [defaultType, fixedType]);

  useEffect(() => {
    queueMicrotask(() => {
      if (!linkedProduct) {
        setTitle((prev) =>
          prev.startsWith("[상품문의]") ||
          prev.startsWith("[유사매물") ||
          prev.startsWith("[설치사례") ||
          prev.startsWith("[묶음견적")
            ? ""
            : prev
        );
        return;
      }
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
      if (linkedProduct?.envNote) {
        setDescription((prev) =>
          prev.trim()
            ? prev
            : `[고객 선택 현장·설치 조건]\n• ${linkedProduct.envNote}\n\n[추가 문의 사항]\n• 희망 배송/설치 지역(동 단위): \n• 희망 일정 및 문의 내용: `
        );
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

  /* 현재 선택된 상담 유형 및 입력 제목에 맞춘 직통 문자(SMS) 본문 프리필 */
  const smsBodyDraft = `[한밭중고전자 ${inquiryType}] ${
    title.trim() ? `${title.trim()} / ` : ""
  }지역·품목·사진을 함께 보내주시면 빠르게 견적을 안내해 드립니다.`;

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

  /* 첨부된 사진(1~3장)을 확인 버튼 클릭 시 상담 유형별로 제미나이 일괄 분석 */
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

      if (
        !isOther &&
        data.applianceCategory &&
        (PRODUCT_CATEGORIES as readonly string[]).includes(
          data.applianceCategory
        )
      ) {
        setApplianceCategory(data.applianceCategory);
      }

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

      if (isSell && data.sellAnalysis) {
        if (
          !manufacturingDate.trim() &&
          data.sellAnalysis.manufacturingDate &&
          !data.sellAnalysis.manufacturingDate.includes("미확인")
        ) {
          setManufacturingDate(data.sellAnalysis.manufacturingDate);
        }
      }

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
        ? "처분하실 가전 품목 또는 모델명을 입력해 주세요."
        : "문의하실 품목 또는 제목을 입력해 주세요.";
    }

    if (!isSell && !description.trim()) {
      errors.description = isNotice
        ? "공지 본문 내용을 입력해 주세요."
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

      const finalCustomerContent = description.trim()
        ? description.trim()
        : isSell
        ? `[방문 매입 견적 요청] ${applianceCategory} ${title.trim()} 최고가 방문 매입 견적 및 수거 일정 안내를 요청합니다.`
        : "";

      const structuredDescription = isNotice
        ? description.trim()
        : formatStructuredInquiryDescription({
            inquiryType,
            customerContent: finalCustomerContent,
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

      // 서버에서 텔레그램 즉시 발송이 실패한 경우에만 클라이언트 폴백 호출
      if (!isNotice && !resJson.telegramNotified && newId) {
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
        <h3 className="text-hb-xl font-bold text-[#0E1A2B]">
          {isSell
            ? "매입 견적 신청이 정상 접수되었습니다."
            : "상담 문의가 정상 접수되었습니다."}
        </h3>
        <p className="mt-2 text-hb-sm leading-relaxed text-[#4B5260]">
          남겨주신 내용은 담당자가 확인 후 연락드립니다. 설정하신 비밀번호로{" "}
          <strong className="text-[#0E1A2B]">문의게시판</strong>에서 진행 상태와 답변을 언제든 조회하실 수 있습니다.
        </p>

        <div className="mt-5 rounded border border-[#E4E0D8] bg-white p-4 text-left text-hb-sm text-[#4B5260] max-w-md mx-auto space-y-1">
          <p>
            • 접수 구분:{" "}
            <strong className="text-[#0E1A2B]">{inquiryType}</strong>
          </p>
          <p>
            • 접수 품목/제목:{" "}
            <strong className="text-[#0E1A2B]">{title}</strong>
          </p>
          {createdInquiryId && (
            <p className="text-hb-xs text-[#8A8478]">
              • 접수 번호: #{String(createdInquiryId).slice(0, 8)}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Link href="/inquiry" className="hb-btn-primary h-11 px-5 text-hb-sm">
            문의게시판에서 확인하기
          </Link>
          <button
            type="button"
            onClick={resetToInitial}
            className="hb-btn-outline h-11 px-5 text-hb-sm"
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
      className="space-y-6"
    >
      {isAdmin && allowNoticeToggle && (
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#FADCD0] bg-[#FFF5F0] px-4 py-3.5">
          <div>
            <span className="block text-hb-base font-bold text-[#B5431A]">
              최상단 고정 공지사항으로 등록
            </span>
            <span className="mt-0.5 block text-hb-xs text-[#D9531E]">
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

      {/* 1. 최상단 4대 상담 유형 대형 탭 (hideTypeSelector 또는 fixedType인 경우 4개 탭을 숨기고 간결한 안심 배너 표시) */}
      {!isNotice && !hideTypeSelector && !fixedType ? (
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-hb-base font-extrabold text-[#0E1A2B]">
              1. 원하시는 상담 유형을 선택해 주세요
            </span>
            <a
              href={smsHref(STORE.mobile, smsBodyDraft)}
              onClick={() =>
                trackEvent("click_sms_consult", {
                  location: "inquiry_form_top",
                  inquiry_type: inquiryType,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9531E] bg-[#FFF5F0] px-3 py-1.5 text-hb-sm font-extrabold text-[#D9531E] hover:bg-[#D9531E] hover:text-white transition-colors"
              title={`직통 휴대폰(${STORE.mobile}) 문자로 사진 바로 보내기`}
            >
              <Icon d={ICON.chat} className="h-4 w-4" />
              <span>문자({STORE.mobile}) 바로 전송</span>
            </a>
          </div>

          <div
            role="tablist"
            aria-label="상담 유형 선택"
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5"
          >
            {INQUIRY_TYPES.map((t) => {
              const active = inquiryType === t;
              const tabLabel =
                t === "내 물건 팔기"
                  ? "내 물건 팔기(매입)"
                  : t === "대량·업소용 상담"
                  ? "업소용·창업 상담"
                  : t;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setInquiryType(t);
                    setPendingConflicts(null);
                    if (t === "내 물건 팔기") {
                      setTitle((prev) =>
                        prev.startsWith("[상품문의]") ||
                        prev.startsWith("[유사매물") ||
                        prev.startsWith("[설치사례") ||
                        prev.startsWith("[묶음견적")
                          ? ""
                          : prev
                      );
                    }
                  }}
                  className={`h-11 sm:h-12 rounded-lg px-3 text-hb-sm sm:text-hb-base font-bold tracking-[-0.01em] transition-all flex items-center justify-center text-center leading-tight cursor-pointer ${
                    active
                      ? t === "내 물건 팔기"
                        ? "bg-[#D9531E] text-white shadow-2xs ring-2 ring-[#D9531E]/30"
                        : "bg-[#0E1A2B] text-white shadow-2xs ring-2 ring-[#0E1A2B]/25"
                      : "border border-[#E5E2DC] bg-[#FAF9F7] text-[#434B59] hover:border-[#0E1A2B] hover:bg-white hover:text-[#0E1A2B]"
                  }`}
                >
                  {tabLabel}
                </button>
              );
            })}
          </div>
        </div>
      ) : !isNotice && (isSell || fixedType === "내 물건 팔기") ? (
        <div className="rounded-xl border border-[#FADCD0] bg-[#FFF8F5] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D9531E] text-white">
              <Icon d={ICON.camera} className="w-4 h-4" />
            </span>
            <div className="text-hb-sm leading-snug">
              <strong className="text-[#0E1A2B] font-bold">
                사진과 수거 지역만 남겨주시면
              </strong>{" "}
              <span className="text-[#434B59]">
                확인 후 최고가 방문 매입 견적과 수거 일정을 빠르게 안내해 드립니다.
              </span>
            </div>
          </div>
          <a
            href={smsHref(STORE.mobile, smsBodyDraft)}
            onClick={() =>
              trackEvent("click_sms_consult", {
                location: "inquiry_form_top",
                inquiry_type: inquiryType,
              })
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D9531E] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#D9531E] hover:bg-[#D9531E] hover:text-white transition-colors shrink-0"
            title={`직통 휴대폰(${STORE.mobile}) 문자로 사진 바로 보내기`}
          >
            <Icon d={ICON.chat} className="h-3.5 w-3.5" />
            <span>문자({STORE.mobile}) 바로 전송</span>
          </a>
        </div>
      ) : null}

      {/* 관심 매물 견적함(묶음 문의) 자동 불러오기 배너 */}
      {!isNotice && basketItems.length > 0 && (
        <div className="rounded-xl border-2 border-[#0E1A2B] bg-[#F8FAFC] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#D9531E] text-hb-xs font-bold text-white">
                {basketItems.length}
              </span>
              <strong className="text-hb-base font-extrabold text-[#0E1A2B]">
                견적함에 담아둔 관심 상품 {basketItems.length}건
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
              className="rounded-lg bg-[#0E1A2B] px-3.5 py-1.5 text-hb-sm font-bold text-white hover:bg-[#1C2D47]"
            >
              {bundleApplied ? "목록 다시 반영" : "묶음 견적으로 자동 입력"}
            </button>
          </div>

          <ul className="mt-2.5 flex flex-wrap gap-2">
            {basketItems.map((item) => {
              const qty = item.quantity || 1;
              return (
                <li
                  key={item.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDD9D1] bg-white px-2.5 py-1 text-hb-sm"
                >
                  <span className="font-bold text-[#0E1A2B]">
                    {item.title}
                  </span>
                  <span className="text-[#D9531E] font-extrabold">
                    ({formatProductPrice(item.price, item.category)})
                  </span>
                  {/* 수량 조절 버튼 */}
                  <div className="inline-flex items-center rounded border border-[#CFCAC0] bg-[#FAF9F7] text-hb-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        const next = updateQuoteBasketItemQuantity(item.id, qty - 1);
                        if (bundleApplied && next.length > 0) applyBasketToForm(next);
                      }}
                      className="px-1.5 py-0.5 hover:bg-white"
                      aria-label={`${item.title} 수량 감소`}
                    >
                      -
                    </button>
                    <span className="px-1 tabular-nums">{qty}대</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = updateQuoteBasketItemQuantity(item.id, qty + 1);
                        if (bundleApplied && next.length > 0) applyBasketToForm(next);
                      }}
                      className="px-1.5 py-0.5 hover:bg-white"
                      aria-label={`${item.title} 수량 증가`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = removeQuoteBasketItem(item.id);
                      if (bundleApplied && next.length > 0) {
                        applyBasketToForm(next);
                      }
                    }}
                    aria-label={`${item.title} 제외`}
                    className="text-[#8A8478] hover:text-red-600 font-bold px-1"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 3. 성함 / 연락처 / 비밀번호 입력 (필수 입력) */}
      {!isNotice ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          <div>
            <label htmlFor="uf-name" className="hb-label">
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
              className={`hb-input mt-1.5 h-11 sm:h-12 text-hb-base font-medium ${
                fieldErrors.name ? "border-red-500 ring-1 ring-red-500" : ""
              }`}
            />
          </div>

          <div>
            <label htmlFor="uf-phone" className="hb-label">
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
              className={`hb-input mt-1.5 h-11 sm:h-12 text-hb-base font-semibold tabular-nums ${
                fieldErrors.phone ? "border-red-500 ring-1 ring-red-500" : ""
              }`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="uf-pw" className="hb-label">
                비밀번호 <span className="text-[#D9531E]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-hb-xs font-bold text-[#667085] hover:text-[#0E1A2B]"
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
              placeholder="숫자 4자리 (휴대폰 뒷자리 추천)"
              className={`hb-input mt-1.5 h-11 sm:h-12 text-hb-base ${
                fieldErrors.password
                  ? "border-red-500 ring-1 ring-red-500"
                  : ""
              }`}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="uf-name" className="hb-label">
              작성자명
            </label>
            <input
              id="uf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={STORE.name}
              className="hb-input mt-1.5 h-11 sm:h-12 text-hb-base"
            />
          </div>
          <div>
            <label htmlFor="uf-phone" className="hb-label">
              연락처 표시
            </label>
            <input
              id="uf-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder={STORE.tel}
              className="hb-input mt-1.5 h-11 sm:h-12 text-hb-base"
            />
          </div>
        </div>
      )}

      {/* 4. 사진 첨부(최대 3장, 선택) 및 사진 판독 자동입력 */}
      <div className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded bg-[#0E1A2B] px-2.5 py-1 text-hb-xs font-bold text-white">
              사진 첨부 ({selectedFiles.length}/{MAX_PHOTOS}장 · 선택)
            </span>
            {!isNotice && !isOther && (
              <button
                type="button"
                onClick={() => setShowPhotoGuide((v) => !v)}
                className="text-hb-xs font-bold text-[#D9531E] hover:text-[#B5431A] underline underline-offset-2 inline-flex items-center gap-1"
              >
                <span>{showPhotoGuide ? "촬영 가이드 접기" : "권장 촬영 가이드 보기"}</span>
                <span className="rounded bg-[#FFF0EB] border border-[#FADCD0] px-1.5 py-0.5 text-hb-xs font-extrabold text-[#D9531E]">
                  AI 가이드
                </span>
              </button>
            )}
          </div>

          {!isNotice && (
            <button
              type="button"
              onClick={handleRunGeminiAnalysis}
              disabled={selectedFiles.length === 0 || isAnalyzingPhotos}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-hb-sm font-bold transition-colors ${
                selectedFiles.length > 0
                  ? "bg-[#D9531E] text-white hover:bg-[#BE4415]"
                  : "bg-[#EAE6DF] text-[#858076] cursor-not-allowed"
              }`}
            >
              <span>
                {isAnalyzingPhotos
                  ? "사진 판독 중..."
                  : selectedFiles.length > 0
                  ? `사진 ${selectedFiles.length}장 AI 자동입력`
                  : "사진 첨부 시 AI 자동입력"}
              </span>
            </button>
          )}
        </div>

        {/* 사진 썸네일 + 추가 버튼 */}
        <div className="flex flex-wrap items-center gap-3">
          {filePreviews.map((preview, idx) => (
            <div
              key={preview}
              className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#DDD9D1] bg-white shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={`첨부 사진 ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              <span className="absolute left-1 bottom-1 rounded bg-black/70 px-1.5 text-hb-xs font-bold text-white">
                #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFile(idx)}
                aria-label="첨부 사진 삭제"
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/75 text-white hover:bg-red-600"
              >
                <Icon d={ICON.close} className="h-3 w-3" />
              </button>
            </div>
          ))}

          {selectedFiles.length < MAX_PHOTOS && (
            <label className="flex h-16 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#CFCAC0] bg-white text-hb-xs font-bold text-[#0E1A2B] hover:border-[#0E1A2B] transition-colors shrink-0">
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

          <p className="text-hb-sm text-[#3F4856] leading-snug flex-1 min-w-[200px]">
            {selectedFiles.length === 0
              ? "제품 전면 또는 모델명 스티커 사진을 첨부하시면 더 정확한 견적을 안내해 드립니다. (생략 가능)"
              : "우측 [AI 자동입력] 버튼을 누르면 사진에서 품목과 모델명을 읽어옵니다."}
          </p>
        </div>

        {/* 접이식 AI 권장 촬영 가이드 (일러스트 배너 + 3단계 설명) */}
        {!isNotice && !isOther && showPhotoGuide && (
          <div className="overflow-hidden rounded-xl border border-[#E5E2DC] bg-white shadow-2xs">
            {/* 사용자 제작 AI 가이드 배너 */}
            <div className="relative w-full overflow-hidden bg-[#FAF9F7] border-b border-[#E5E2DC]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/ai-photo-guide.png"
                alt="사진만 올리면 AI가 상품 설명을 작성해 드려요 - 권장 촬영 가이드"
                className="w-full h-auto object-contain block"
              />
            </div>
            <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 bg-white text-hb-xs">
              {photoGuideSteps.map((g) => (
                <li key={g.step} className="flex items-start gap-2">
                  <span className="shrink-0 rounded bg-[#0E1A2B] px-1.5 py-0.5 text-hb-xs font-bold text-white">
                    {g.step}
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
          </div>
        )}

        {/* 사진 판독 결과 요약, 기존 입력값 충돌 시 선택 반영 패널, 후속 질문 칩 */}
        {aiResult && (
          <div className="rounded-lg border border-[#0E1A2B]/20 bg-white p-3.5 space-y-3 text-hb-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-[#0E1A2B]">
                판독 요약: {aiResult.summaryNote}
              </span>
              <span className="text-hb-xs text-[#667085]">
                아래 입력칸에서 수정 가능합니다
              </span>
            </div>

            {pendingConflicts && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2 text-amber-950">
                <div className="flex items-center justify-between">
                  <strong className="text-hb-xs">
                    기존 입력 내용을 유지했습니다. 필요한 항목만 선택해 반영하세요.
                  </strong>
                  <button
                    type="button"
                    onClick={() => setPendingConflicts(null)}
                    className="text-hb-xs font-bold underline"
                  >
                    닫기
                  </button>
                </div>

                {pendingConflicts.title && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-3 py-2 border border-amber-200">
                    <span className="truncate">
                      판독된 제목: <strong>{pendingConflicts.title}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTitle(pendingConflicts.title!);
                        setPendingConflicts((prev) =>
                          prev ? { ...prev, title: undefined } : null
                        );
                      }}
                      className="rounded bg-[#0E1A2B] px-2.5 py-1 text-hb-xs font-bold text-white"
                    >
                      이 제목 적용
                    </button>
                  </div>
                )}

                {pendingConflicts.model && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-3 py-2 border border-amber-200">
                    <span>
                      판독된 모델명:{" "}
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
                      className="rounded bg-[#0E1A2B] px-2.5 py-1 text-hb-xs font-bold text-white"
                    >
                      이 모델명 적용
                    </button>
                  </div>
                )}

                {pendingConflicts.description && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-3 py-2 border border-amber-200">
                    <span>사진에서 확인된 품목 요약 내용이 있습니다.</span>
                    <div className="flex gap-2">
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
                        className="rounded border border-[#0E1A2B] bg-white px-2.5 py-1 text-hb-xs font-bold text-[#0E1A2B]"
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
                        className="rounded bg-[#0E1A2B] px-2.5 py-1 text-hb-xs font-bold text-white"
                      >
                        이 내용으로 교체
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {aiResult.extractedFacts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aiResult.extractedFacts.map((fact, idx) => (
                  <span
                    key={fact.label + idx}
                    className="inline-flex items-center gap-1 rounded border border-[#E5E2DC] bg-[#FAF9F7] px-2.5 py-1 text-hb-xs"
                  >
                    <strong className="text-[#0E1A2B]">{fact.label}:</strong>
                    <span className="text-[#4B5260]">{fact.value}</span>
                  </span>
                ))}
              </div>
            )}

            {aiResult.followUpQuestions.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="block text-hb-xs font-bold text-[#B5431A]">
                  추가 확인 항목 (클릭 시 본문에 입력 줄 추가):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {aiResult.followUpQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => appendFollowUpQuestionLine(q)}
                      className="rounded border border-[#FADCD0] bg-[#FFF6F2] px-2.5 py-1 text-left text-hb-xs font-bold text-[#B5431A] hover:bg-[#FADCD0]/60"
                    >
                      + {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. 상담 유형별 맞춤 입력란 */}
      <div className="space-y-4">
        {/* [대량·업소용 상담] 전용 구조화 입력 블록 */}
        {!isNotice && isBulk && (
          <div className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <strong className="text-hb-base font-bold text-[#0E1A2B]">
                업소용 · 창업 설비 체크 사항 (선택 입력)
              </strong>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="hb-label">
                  업종 / 용도 (선택)
                </label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="예: 식당 오픈, 카페, 폐업정리"
                  className="hb-input mt-1.5 h-11 sm:h-12 text-hb-base"
                />
              </div>
              <div>
                <label className="hb-label">
                  매장 전기 규격 (선택)
                </label>
                <select
                  value={electricalPhase}
                  onChange={(e) => setElectricalPhase(e.target.value)}
                  className="hb-input mt-1.5 h-11 sm:h-12 text-hb-base font-semibold"
                >
                  <option value="모름/미확인">모름 (상담/현장 확인)</option>
                  <option value="단상 220V">단상 220V (일반 상가)</option>
                  <option value="삼상 380V">삼상 380V (대형 주방/동력)</option>
                </select>
              </div>
              <div>
                <label className="hb-label">
                  승압 필요 여부 (선택)
                </label>
                <select
                  value={voltageUpgrade}
                  onChange={(e) => setVoltageUpgrade(e.target.value)}
                  className="hb-input mt-1.5 h-11 sm:h-12 text-hb-base font-semibold"
                >
                  <option value="모름·현장 확인 필요">
                    모름 (현장 확인 필요)
                  </option>
                  <option value="불필요">불필요 (기존 전력 충분)</option>
                  <option value="필요">필요 (승압 예정/상담 희망)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="hb-label">
                  필요 장비 종류 및 희망 수량
                </span>
                <button
                  type="button"
                  onClick={() => addBulkEquipmentRow("")}
                  className="text-hb-sm font-extrabold text-[#D9531E] underline"
                >
                  + 장비 줄 추가
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
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
                    className="rounded-lg border border-[#D7D2C8] bg-white px-3 py-1.5 text-hb-sm font-bold text-[#0E1A2B] hover:border-[#0E1A2B]"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {bulkItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-[#E5E2DC]"
                  >
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) =>
                          updateBulkItem(item.id, "category", e.target.value)
                        }
                        placeholder={`품목 ${idx + 1} (예: 45박스 냉장고, 제빙기)`}
                        className="hb-input h-[46px] text-hb-base"
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
                        placeholder="희망 수량 (예: 1대)"
                        className="hb-input h-[46px] text-hb-base"
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
                        className="hb-input h-[46px] text-hb-sm font-mono"
                      />
                    </div>
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => removeBulkItem(item.id)}
                        className="text-hb-sm font-bold text-red-600 px-2 py-1"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="hb-label">
                  설치 공간 · 급배수 · 가스 메모 (선택)
                </label>
                <input
                  type="text"
                  value={spaceAndUtilities}
                  onChange={(e) => setSpaceAndUtilities(e.target.value)}
                  placeholder="예: 1층 주방 급배수 완비 / 환기 후드 있음"
                  className="hb-input mt-1.5 h-11 sm:h-12 text-hb-base"
                />
              </div>
              <div>
                <label className="hb-label">
                  반입 동선(층수) 및 기존 기기 철거 여부 (선택)
                </label>
                <input
                  type="text"
                  value={accessAndRemoval}
                  onChange={(e) => setAccessAndRemoval(e.target.value)}
                  placeholder="예: 1층 진입 가능, 기존 냉장고 1대 철거 희망"
                  className="hb-input mt-1.5 h-11 sm:h-12 text-hb-base"
                />
              </div>
            </div>
          </div>
        )}

        {/* [내 물건 팔기(매입)] 간소화 전용 레이아웃 (복잡한 중복 입력·세트 강제 제거) */}
        {!isNotice && isSell ? (
          <div className="space-y-3.5 sm:space-y-4">
            {/* 1. 제품 종류 및 처분 품목명 (한눈에 이해되는 단일 행) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-4">
                <label htmlFor="uf-cat" className="hb-label">
                  제품 종류 <span className="text-[#D9531E]">*</span>
                </label>
                <select
                  id="uf-cat"
                  value={applianceCategory}
                  onChange={(e) => setApplianceCategory(e.target.value)}
                  className="hb-input mt-1.5 h-11 sm:h-12 text-hb-base font-semibold"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-8">
                <label htmlFor="uf-title" className="hb-label">
                  처분 품목 / 대략적인 모델명 <span className="text-[#D9531E]">*</span>
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
                  placeholder="예: 삼성 지펠 4도어 냉장고 / LG 트롬 드럼세탁기"
                  className={`hb-input mt-1.5 h-11 sm:h-12 text-hb-base font-semibold ${
                    fieldErrors.title ? "border-red-500 ring-1 ring-red-500" : ""
                  }`}
                />
              </div>
            </div>

            {/* 에어컨 선택 시 가이드 배너 */}
            {applianceCategory === "에어컨/냉난방기" && (
              <AirconSetGuideBanner variant="inline" className="mt-1" />
            )}

            {/* 2. 방문 수거 지역 & 희망 일정/층수 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="uf-region" className="hb-label">
                  방문 수거 지역 (구/동 단위) <span className="text-[#D9531E]">*</span>
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
                  placeholder="예: 대전 중구 중촌동 / 유성구 봉명동"
                  className={`hb-input mt-1.5 h-11 sm:h-12 text-hb-base ${
                    fieldErrors.region ? "border-red-500 ring-1 ring-red-500" : ""
                  }`}
                />
              </div>

              <div>
                <label htmlFor="uf-schedule" className="hb-label">
                  희망 수거 일정 · 층수 <span className="font-normal text-[#667085]">(선택)</span>
                </label>
                <input
                  id="uf-schedule"
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="예: 이번 주 금요일 오후 / 1층 또는 엘리베이터 있음"
                  className="hb-input mt-1.5 h-11 sm:h-12 text-hb-base"
                />
              </div>
            </div>

            {/* 3. 상태 및 연식 (선택 보조 옵션 콤팩트 박스) */}
            <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F7] p-3.5 sm:p-4">
              <span className="text-hb-sm font-bold text-[#0E1A2B] block mb-2.5">
                제품 상태 및 연식 <span className="font-normal text-[#667085]">(선택 사항 · 잘 모르시면 비워두셔도 됩니다)</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="uf-op" className="text-hb-xs font-bold text-[#646E7E] block mb-1">
                    작동 상태
                  </label>
                  <select
                    id="uf-op"
                    value={operatingStatus}
                    onChange={(e) => setOperatingStatus(e.target.value)}
                    className="hb-input h-[44px] text-hb-sm font-medium bg-white"
                  >
                    <option value="정상 작동 확인됨">정상 작동 (냉기/세탁 이상 없음)</option>
                    <option value="작동 상태 미확인 (상담 시 안내)">미확인 (기사님 방문 시 점검)</option>
                    <option value="일부 점검 필요">일부 점검 필요 (소음/약함 등)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="uf-mfg" className="text-hb-xs font-bold text-[#646E7E] block mb-1">
                    제조년월 / 연식
                  </label>
                  <input
                    id="uf-mfg"
                    type="text"
                    value={manufacturingDate}
                    onChange={(e) => setManufacturingDate(e.target.value)}
                    placeholder="예: 2021년식 / 미확인"
                    className="hb-input h-[44px] text-hb-sm bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="uf-model" className="text-hb-xs font-bold text-[#646E7E] block mb-1">
                    상세 모델 코드
                  </label>
                  <input
                    id="uf-model"
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="명판 스티커 코드 (선택)"
                    className="hb-input h-[44px] font-mono text-hb-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 4. 추가 메모 (선택 입력) */}
            <div>
              <label htmlFor="uf-desc" className="hb-label">
                추가 메모 및 요청사항 <span className="font-normal text-[#667085]">(선택)</span>
              </label>
              <textarea
                id="uf-desc"
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (fieldErrors.description)
                    setFieldErrors((p) => ({ ...p, description: "" }));
                }}
                placeholder="흠집 여부, 이전 설치 여부, 사다리차 필요 여부 등 전하고 싶으신 말씀을 편하게 남겨주세요. (비워두셔도 정상 접수됩니다)"
                className="hb-input mt-1.5 py-3 text-hb-base resize-y leading-relaxed"
              />
            </div>
          </div>
        ) : (
          /* 구매 문의, 대량·업소용, 기타 문의일 때의 기본 레이아웃 */
          <div className="space-y-4">
            {!isNotice && !isOther && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div>
                  <label htmlFor="uf-cat" className="hb-label">
                    제품 종류
                  </label>
                  <select
                    id="uf-cat"
                    value={applianceCategory}
                    onChange={(e) => setApplianceCategory(e.target.value)}
                    className="hb-input mt-1.5 h-11 sm:h-12 text-hb-base font-semibold"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="uf-region" className="hb-label">
                    설치/현장 지역 (선택)
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
                    placeholder="예: 대전 서구 둔산동"
                    className="hb-input mt-1.5 h-11 sm:h-12 text-hb-base"
                  />
                </div>

                <div>
                  <label htmlFor="uf-schedule" className="hb-label">
                    희망 일정 · 층수(엘리베이터)
                  </label>
                  <input
                    id="uf-schedule"
                    type="text"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="예: 금요일 오후 / 1층 상가"
                    className="hb-input mt-1.5 h-11 sm:h-12 text-hb-base"
                  />
                </div>
              </div>
            )}

            {!isNotice && !isOther && applianceCategory === "에어컨/냉난방기" && (
              <AirconSetGuideBanner variant="inline" className="mt-2" />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              <div
                className={
                  isNotice || isOther ? "sm:col-span-3" : "sm:col-span-2"
                }
              >
                <label htmlFor="uf-title" className="hb-label">
                  {isNotice
                    ? "공지 제목 *"
                    : isBulk
                    ? "업소용·창업 상담 제목 *"
                    : "문의 품목 / 제목 *"}
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
                    isBulk
                      ? "예: 식당 오픈용 45박스 냉장고·제빙기·세척기 견적 문의"
                      : isOther
                      ? "문의하실 제목을 입력해 주세요"
                      : "예: 캐리어 벽걸이 냉난방기 9평형 재고·설치 문의"
                  }
                  className={`hb-input mt-1.5 h-11 sm:h-12 text-hb-base font-semibold ${
                    fieldErrors.title ? "border-red-500 ring-1 ring-red-500" : ""
                  }`}
                />
              </div>

              {!isNotice && !isOther && (
                <div>
                  <label htmlFor="uf-model" className="hb-label">
                    모델명{" "}
                    <span className="font-normal text-[#667085]">(선택)</span>
                  </label>
                  <input
                    id="uf-model"
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="스티커 모델명 확인 시 입력"
                    className="hb-input mt-1.5 h-11 sm:h-12 font-mono text-hb-base"
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="uf-desc" className="hb-label">
                {isNotice ? "공지 본문 내용 *" : "상세 문의 내용 *"}
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
                  isBulk
                    ? "예: 대전 서구 둔산동 1층 식당 오픈 준비 중입니다. 중고 업소용 냉장고와 제빙기 세트 견적 부탁드립니다."
                    : "예: 대전 서구 둔산동 1층 상가입니다. 배송 및 기본 설치 포함 견적이 궁금합니다."
                }
                className={`hb-input mt-1.5 py-3.5 text-hb-base resize-y leading-relaxed ${
                  fieldErrors.description
                    ? "border-red-500 ring-1 ring-red-500"
                    : ""
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* 6. 하단 개인정보 동의 및 대형 제출 버튼 (높이 56px~60px, 글자 17px~18px) */}
      <div className="pt-4 border-t border-[#E4E0D8] space-y-4">
        {!isNotice && (
          <label className="flex cursor-pointer items-center gap-2.5 text-hb-base text-[#434B59]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (fieldErrors.agreed)
                  setFieldErrors((p) => ({ ...p, agreed: "" }));
              }}
              className="h-5 w-5 shrink-0 accent-[#0E1A2B]"
            />
            <span>
              상담·견적 안내를 위한{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-extrabold text-[#0E1A2B] underline underline-offset-2"
              >
                개인정보 수집·이용
              </Link>
              에 동의합니다. <span className="text-[#D9531E]">*</span>
            </span>
          </label>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {!isNotice && (
            <a
              href={smsHref(STORE.mobile, smsBodyDraft)}
              onClick={() =>
                trackEvent("click_sms_consult", {
                  location: "inquiry_form_bottom",
                  inquiry_type: inquiryType,
                })
              }
              className="hb-btn-outline h-12 sm:h-[52px] px-5 text-hb-base font-bold sm:col-span-5 whitespace-nowrap"
            >
              <Icon d={ICON.chat} className="h-4 w-4 text-[#D9531E]" />
              <span>문자로 사진 보내기</span>
            </a>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isBusy}
              className="hb-btn-outline h-12 sm:h-[52px] px-6 text-hb-base font-bold sm:col-span-3"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={isBusy}
            className={`${
              isSell || isNotice ? "hb-btn-accent" : "hb-btn-primary"
            } h-12 sm:h-[52px] px-7 text-hb-base font-extrabold shadow-card whitespace-nowrap cursor-pointer ${
              isNotice
                ? onCancel
                  ? "sm:col-span-9"
                  : "sm:col-span-12"
                : onCancel
                ? "sm:col-span-4"
                : "sm:col-span-7"
            }`}
          >
            {phase === "validating"
              ? "입력 확인 중..."
              : phase === "submitting"
              ? "접수 중..."
              : phase === "retrying"
              ? "재시도 중..."
              : isNotice
              ? "공지사항 등록하기"
              : isSell
              ? "무료 매입 견적 신청하기"
              : isBulk
              ? "업소용·창업 상담 신청하기"
              : bundleApplied
              ? "묶음 견적 신청하기"
              : "구매 상담 신청하기"}
          </button>
        </div>
      </div>

      {phase === "error" && submitErrorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-hb-sm text-red-800 flex flex-wrap items-center justify-between gap-2"
        >
          <span className="font-bold">{submitErrorMsg}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => executeSubmit(true)}
              className="rounded-lg bg-red-600 px-3.5 py-2 text-hb-sm font-bold text-white hover:bg-red-700"
            >
              그대로 재시도
            </button>
            <a
              href={smsHref(STORE.mobile, smsBodyDraft)}
              className="rounded-lg border border-red-300 bg-white px-3.5 py-2 text-hb-sm font-bold text-red-700"
            >
              문자({STORE.mobile}) 문의
            </a>
          </div>
        </div>
      )}
    </form>
  );
}