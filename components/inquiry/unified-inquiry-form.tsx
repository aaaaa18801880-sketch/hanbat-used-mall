// 파일 경로: components/inquiry/unified-inquiry-form.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { supabase, getAdminAuthHeaders } from "../../lib/supabase";
import {
  clearQuoteBasket,
  compressImage,
  formatPhone,
  formatProductPrice,
  formatQuoteBasketSummary,
  getQuoteBasket,
  INQUIRY_TYPES,
  type InquiryTypeValue,
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
import { Icon, ICON, Modal } from "../../lib/ui";

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
    title: "안전관리법 표시사항 (라벨)",
    desc: "모델명·정격전압·KC인증마크가 보이도록 선명하게 촬영",
  },
  {
    step: "02",
    title: "제조년월 스티커 (연식)",
    desc: "제조년월 숫자가 확인 가능하도록 근접 촬영",
  },
  {
    step: "03",
    title: "제품 전체 사진 (외관)",
    desc: "제품 전체 모습과 도어/외관 상태가 잘 보이도록 촬영",
  },
] as const;

const BUY_PHOTO_GUIDE_STEPS = [
  {
    step: "01",
    title: "원하는 제품 · 모델",
    desc: "제품 사진이나 희망 모델명이 있으면 함께 첨부",
  },
  {
    step: "02",
    title: "설치할 공간",
    desc: "제품을 설치할 장소 전체 모습이 보이도록 촬영",
  },
  {
    step: "03",
    title: "주변 환경 · 배관",
    desc: "콘센트 · 배관 · 문폭 등 반입 및 설치 관련 환경 촬영",
  },
] as const;

const BULK_PHOTO_GUIDE_STEPS = [
  {
    step: "01",
    title: "업종 및 용도",
    desc: "식당 · 카페 · 마트 · 사무실 등 매장 용도 및 업종",
  },
  {
    step: "02",
    title: "필요한 제품 종류 및 수량",
    desc: "냉장고/냉동고, 제빙기/식기세척기, 주방기기 등",
  },
  {
    step: "03",
    title: "전기 용량 및 승압 여부",
    desc: "단상/삼상, 기존 용량(220V/380V), 승압 필요 여부",
  },
  {
    step: "04",
    title: "설치 공간 정보",
    desc: "가로/세로/높이, 배수·급수 위치, 환기/배선 등",
  },
  {
    step: "05",
    title: "설치 가능 날짜 및 지역",
    desc: "희망 설치 날짜, 설치 주소 상세, 연락 가능한 연락처",
  },
  {
    step: "06",
    title: "추가 요청사항",
    desc: "기존 제품 철거 여부, 배송 일정 조율 등",
  },
] as const;

export function UnifiedInquiryForm({
  defaultType = "내 물건 팔기",
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
  const [conditionGrade, setConditionGrade] = useState<string>(
    PRODUCT_CONDITION_GRADES[1]
  );
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");

  const [basketItems, setBasketItems] = useState<QuoteBasketItem[]>([]);
  const [bundleApplied, setBundleApplied] = useState(false);

  /* 사진 첨부 및 Gemini 일괄 분석 상태 */
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [cachedUploadedUrls, setCachedUploadedUrls] = useState<string[] | null>(
    null
  );
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
  const [aiAnalysisSummary, setAiAnalysisSummary] = useState<string | null>(
    null
  );
  const [showPhotoGuide, setShowPhotoGuide] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{
    src: string;
    alt: string;
    title: string;
    desc?: string;
  } | null>(null);

  const [agreed, setAgreed] = useState(false);
  const [phase, setPhase] = useState<SubmissionPhase>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);
  const [createdInquiryId, setCreatedInquiryId] = useState<string | null>(null);

  const applyBasketToForm = useCallback((items: QuoteBasketItem[]) => {
    if (items.length === 0) return;
    const summary = formatQuoteBasketSummary(items);
    setInquiryType(
      summary.hasCommercialItem || items.length >= 2
        ? "대량·업소용 상담"
        : "구매 문의"
    );
    setTitle(summary.autoTitle);
    setDescription(summary.autoDescription);
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
  const isBusy =
    phase === "validating" ||
    phase === "submitting" ||
    phase === "retrying" ||
    isAnalyzingPhotos;

  const currentGuide = useMemo(() => {
    if (isBulk) {
      return {
        headerTitle: "대량·업소용 상담 시 필수 확인 및 권장 안내",
        badge: "※ 주방 공간 · 분전반 사진 권장",
        imageSrc: "/images/photo-guide-bulk.jpg",
        imageAlt:
          "한밭중고전자 대량·업소용 상담 필수 정보: 1. 업종/용도, 2. 제품종류/수량, 3. 전기용량/승압여부, 4. 설치공간정보, 5. 설치가능일자/지역, 6. 추가요청사항",
        zoomTitle: "대량·업소용 상담 가이드 (공간 · 전기용량 · 품목)",
        zoomDesc:
          "식당·카페·마트 등 매장 집기 견적은 분전반과 주방 공간 사진을 함께 보내주시면 가장 빠르고 최적화된 맞춤 견적을 받으실 수 있습니다.",
        steps: BULK_PHOTO_GUIDE_STEPS,
        gridCols: "grid-cols-2 sm:grid-cols-3",
        note: (
          <div className="rounded border border-[#FADCD0] bg-[#FFF5F0] p-2.5 text-[11.5px] text-[#B5431A] leading-relaxed">
            <strong>💡 대량·업소용 맞춤 견적 안내</strong>:
            식당, 카페, 마트 등 대형 집기나 다량 견적은 분전반(단상/삼상) 및 주방 가로/세로/높이 사진을 함께 올려주시면 현장 방문 전 가장 정확한 맞춤 견적과 최적 설치 동선을 안내해 드립니다.
          </div>
        ),
      };
    }

    if (isSell) {
      return {
        headerTitle: "빠르고 정확한 매입 견적을 위한 필수 촬영 3컷 예시",
        badge: "※ 안전인증(KC) 및 제조년월 확인 필수",
        imageSrc: "/images/photo-guide.jpg",
        imageAlt:
          "한밭중고전자 매입 필수 촬영 항목: 1. 안전관리법 표시사항 라벨, 2. 제조년월, 3. 제품 전체 사진",
        zoomTitle: "매입 권장 촬영 예시 (KC인증 라벨 · 제조년월 · 외관)",
        zoomDesc:
          "명판 스티커의 모델명과 제조년월이 선명하게 보이도록 촬영해 주시면 가장 빠르고 정확한 견적을 산출해 드립니다.",
        steps: SELL_PHOTO_GUIDE_STEPS,
        gridCols: "grid-cols-1 sm:grid-cols-3",
        note: (
          <div className="rounded border border-[#FADCD0] bg-[#FFF5F0] p-2.5 text-[11.5px] text-[#B5431A] leading-relaxed">
            <strong>⚠️ 전기용품 및 생활용품 안전관리법 안내</strong>:
            제조년월과 안전인증(KC) 표기가 확인되지 않을 경우 매입 및 상담이 제한될 수 있습니다. 위 예시 사진처럼 명판 스티커를 가까이서 선명하게 촬영해 주세요.
          </div>
        ),
      };
    }

    return {
      headerTitle: "구매 문의 시 권장 촬영 3컷 및 확인 안내",
      badge: "※ 사진이 없어도 모델명 입력 시 상담 가능",
      imageSrc: "/images/photo-guide-buy.jpg",
      imageAlt:
        "한밭중고전자 구매 문의 필수 가이드: 1. 원하는 제품·모델, 2. 설치할 공간, 3. 주변 환경·배관",
      zoomTitle: "구매 문의 권장 촬영 예시 (원하는 제품 · 설치 공간 · 주변 환경)",
      zoomDesc:
        "원하시는 제품 모델이나 설치할 장소 전체 모습, 콘센트/배관 사진을 올려주시면 설치 가능 여부와 배송 일정을 정확하게 안내해 드립니다.",
      steps: BUY_PHOTO_GUIDE_STEPS,
      gridCols: "grid-cols-1 sm:grid-cols-3",
      note: (
        <p className="text-[11.5px] text-[#4B5260] bg-white p-2.5 rounded border border-[#EAE6DF] leading-relaxed">
          💡 사진은 1~3장 밝고 선명하게 올려주시면 좋으며, 사진이 없더라도 원하시는 제품명이나 모델명을 상세 문의 내용에 적어주시면 실시간 재고와 가격을 빠르게 확인해 드립니다.
        </p>
      ),
    };
  }, [isBulk, isSell]);

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
    setAiAnalysisSummary(null);
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    setCachedUploadedUrls(null);
    setAiAnalysisSummary(null);
  };

  /* [핵심 신규 기능] 첨부된 사진(1~3장)을 확인 버튼 클릭 시 제미나이로 한 번에 일괄 분석 */
  const handleRunGeminiAnalysis = async () => {
    if (selectedFiles.length === 0 || isAnalyzingPhotos) {
      toast.error("먼저 분석할 제품 사진을 1장 이상 첨부해 주세요.");
      return;
    }

    setIsAnalyzingPhotos(true);
    const toastId = toast.loading(
      `첨부하신 사진 ${selectedFiles.length}장을 제미나이 AI가 한 번에 분석하고 있습니다...`
    );

    try {
      const formData = new FormData();
      formData.append("inquiryType", inquiryType);

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
        throw new Error(
          data.error || "사진 자동 분석에 실패했습니다. 직접 입력해 주세요."
        );
      }

      if (data.applianceCategory) {
        setApplianceCategory(data.applianceCategory);
      }
      if (data.title) {
        setTitle(data.title);
        setFieldErrors((p) => ({ ...p, title: "" }));
      }
      if (data.modelNumber) {
        setModel(data.modelNumber);
      }
      if (data.conditionGrade) {
        setConditionGrade(data.conditionGrade);
      }
      if (data.descriptionDraft && !bundleApplied) {
        setDescription(data.descriptionDraft);
        setFieldErrors((p) => ({ ...p, description: "" }));
      }

      setAiAnalysisSummary(
        data.summaryNote ||
          `사진 ${selectedFiles.length}장 분석 완료! 품목·모델명·상세 내용이 자동 입력되었습니다.`
      );
      toast.success(
        "AI가 사진을 분석하여 품목·모델명·내용을 자동으로 채웠습니다!",
        { id: toastId }
      );
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

  const validateFields = (): boolean => {
    setPhase("validating");
    const errors: Record<string, string> = {};

    if (!isNotice) {
      if (!name.trim()) {
        errors.name = "상호명(성함) 및 지역(동까지)을 입력해 주세요.";
      }
      if (!phone.trim() || !isValidPhone(phone)) {
        errors.phone = "연락 가능한 전화번호를 정확히 입력해 주세요.";
      }
      if (password.trim().length < 4) {
        errors.password = "답변 확인용 비밀번호를 4자리 이상 입력해 주세요.";
      }
      const hasRegion =
        region.trim().length > 0 ||
        name.includes("(") ||
        name.includes("동") ||
        name.includes("구") ||
        name.includes("시");
      if (isSell && !hasRegion) {
        errors.name =
          "방문 수거를 위해 지역(동까지)을 함께 입력해 주세요. 예: 한밭식당(중촌동)";
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
        : "문의하실 제품명 또는 제목을 입력해 주세요.";
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

      const metaLines: string[] = [];
      if (!isNotice) {
        if (linkedProduct?.productId) {
          metaLines.push(
            `• 문의 상품 링크: ${STORE.url}/${linkedProduct.productId}`
          );
        }
        if (isSell || isBulk) {
          metaLines.push(`• 품목 분류: ${applianceCategory}`);
        }
        if (model.trim()) {
          metaLines.push(`• 모델명: ${model.trim()}`);
        }
        if (isSell) {
          metaLines.push(`• 제품 상태: ${conditionGrade}`);
          if (region.trim()) {
            metaLines.push(`• 수거 지역: ${region.trim()}`);
          }
        } else if (region.trim()) {
          metaLines.push(`• 배송/설치 희망 지역: ${region.trim()}`);
        }
      }

      const structuredDescription =
        metaLines.length > 0
          ? `${metaLines.join("\n")}\n\n[상세 내용]\n${description.trim()}`
          : description.trim();

      const finalTitle =
        isSell && !title.includes("[")
          ? `[${applianceCategory}] ${title.trim()}`
          : title.trim();

      // 지역 정보 추출: 별도 입력한 region 우선, 없으면 name의 "한밭식당(중촌동)" 등에서 자동 추출
      let parsedRegion = region.trim();
      if (!parsedRegion) {
        const regionMatch = name.match(/\((.*?)\)/);
        if (regionMatch && regionMatch[1]) {
          parsedRegion = regionMatch[1].trim();
        }
      }
      if (!parsedRegion) {
        parsedRegion = "대전/기타";
      }

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
          model: model.trim() || null,
          condition_grade: isSell ? conditionGrade : null,
          region: parsedRegion,
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
          "네트워크 연결 문제로 접수되지 않았습니다. 아래 [입력 내용 그대로 재시도] 버튼을 눌러주세요."
      );
      toast.error(msg || "접수 중 오류가 발생했습니다.");
    }
  };

  const resetToInitial = () => {
    filePreviews.forEach((u) => URL.revokeObjectURL(u));
    setSelectedFiles([]);
    setFilePreviews([]);
    setCachedUploadedUrls(null);
    setAiAnalysisSummary(null);
    setTitle("");
    setModel("");
    setRegion("");
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

      {/* 1. 상단 컴팩트 블록: 상담 유형 + 성함/연락처/비밀번호 한눈에 입력 */}
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
                  onClick={() => setInquiryType(t)}
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
                상호명(성함) / 지역(동까지) <span className="text-[#D9531E]">*</span>
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
                placeholder="예: 한밭식당(중촌동) / 홍길동(둔산동)"
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

      {/* 2. 중단 핵심 블록: 사진 첨부(최대 3장) + [✨ 사진 다 넣고 AI 한 번에 분석] 원클릭 바 */}
      <div className="rounded-md border border-[#E4E0D8] bg-white p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#F0EDE7]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-sm bg-[#0E1A2B] px-2 py-0.5 text-[11px] font-bold text-[#FF8A50]">
              ✨ AI 자동입력 지원
            </span>
            <span className="text-[13px] font-bold text-[#0E1A2B]">
              사진 첨부 ({selectedFiles.length}/{MAX_PHOTOS}장)
            </span>
            {!isNotice && (
              <button
                type="button"
                onClick={() => setShowPhotoGuide((v) => !v)}
                className="inline-flex items-center gap-1 rounded bg-[#FFF5F0] border border-[#FADCD0] px-2.5 py-1 text-[11.5px] font-bold text-[#D9531E] hover:bg-[#FFEBE0] transition-colors"
              >
                <span>
                  {showPhotoGuide
                    ? "가이드 닫기 ▲"
                    : isBulk
                    ? "📷 업소용 상담 가이드 보기 ▾"
                    : isSell
                    ? "📷 매입 촬영 예시 사진 보기 ▾"
                    : "📷 구매 권장 촬영 사진 보기 ▾"}
                </span>
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

        {/* 사진 썸네일 + 추가 버튼 (컴팩트 가로 배치) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {filePreviews.map((preview, idx) => (
            <div
              key={preview}
              className="relative h-14 w-14 overflow-hidden rounded border border-[#DDD9D1] bg-[#EFECE6] shrink-0 group"
            >
              <button
                type="button"
                onClick={() =>
                  setZoomedImage({
                    src: preview,
                    alt: `첨부 사진 ${idx + 1}`,
                    title: `첨부 사진 ${idx + 1}번 확대 보기`,
                    desc: "고객님이 첨부하신 원본 사진입니다.",
                  })
                }
                className="h-full w-full cursor-zoom-in text-left focus:outline-hidden"
                aria-label={`첨부 사진 ${idx + 1} 크게 보기`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt={`첨부 사진 ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
              </button>
              <span className="pointer-events-none absolute left-0.5 bottom-0.5 rounded bg-black/65 px-1 text-[9px] font-bold text-white">
                #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFile(idx)}
                aria-label="첨부 사진 삭제"
                className="absolute right-0.5 top-0.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-black/75 text-white hover:bg-red-600 transition-colors"
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
              ? "정면 사진과 모델명 스티커 등 1~3장을 올리고 우측 [AI 자동입력 확인]을 누르면 아래 항목이 한 번에 채워집니다."
              : "추가할 사진을 모두 넣으셨다면 우측 [✨ AI 자동입력 확인] 버튼을 눌러주세요."}
          </p>
        </div>

        {/* 접이식 가이드 (상담 유형별 전용 촬영/정보 가이드 그래픽) */}
        {!isNotice && showPhotoGuide && (
          <div className="space-y-3 rounded-md bg-[#FAF9F7] p-3 sm:p-4 border border-[#E4E0D8]">
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-[#EAE6DF]">
              <span className="text-[12.5px] font-bold text-[#0E1A2B] flex items-center gap-1.5">
                <Icon d={ICON.camera} className="w-4 h-4 text-[#D9531E]" />
                {currentGuide.headerTitle}
              </span>
              <span className="text-[11px] font-bold text-[#D9531E]">
                {currentGuide.badge}
              </span>
            </div>

            {/* 실제 촬영 예시 그래픽 안내 이미지 (상담 유형별 전용 그래픽, 클릭 시 원본 확대) */}
            <div className="overflow-hidden rounded border border-[#DDD9D1] bg-white shadow-2xs">
              <button
                type="button"
                onClick={() =>
                  setZoomedImage({
                    src: currentGuide.imageSrc,
                    alt: currentGuide.imageAlt,
                    title: currentGuide.zoomTitle,
                    desc: currentGuide.zoomDesc,
                  })
                }
                className="group relative block w-full text-left focus:outline-hidden cursor-zoom-in"
                aria-label={`${currentGuide.zoomTitle} 원본 크게 보기`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={currentGuide.imageSrc}
                  src={currentGuide.imageSrc}
                  alt={currentGuide.imageAlt}
                  className="w-full h-auto object-contain max-h-[380px] sm:max-h-[420px] mx-auto transition-transform duration-200 group-hover:scale-[1.008]"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-[11.5px] font-bold text-white shadow-md backdrop-blur-xs transition-all group-hover:bg-[#D9531E] group-hover:scale-105">
                  <Icon d={ICON.search} className="w-3.5 h-3.5" />
                  <span>사진 클릭 시 크게 보기</span>
                </span>
              </button>
            </div>

            {/* 요약 뱃지 그리드 (상담 유형별 3컷 또는 6단계) */}
            <ol className={`grid ${currentGuide.gridCols} gap-2 text-[11.5px]`}>
              {currentGuide.steps.map((g) => (
                <li
                  key={g.step}
                  className="flex items-start gap-1.5 rounded bg-white p-2.5 border border-[#EAE6DF]"
                >
                  <span className="shrink-0 rounded-sm bg-[#0E1A2B] px-1.5 py-0.5 text-[10px] font-bold text-white">
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

            {currentGuide.note}
          </div>
        )}

        {/* AI 분석 완료 안내 배지 */}
        {aiAnalysisSummary && (
          <div className="flex items-center justify-between gap-2 rounded border border-[#FADCD0] bg-[#FFF5F0] px-3 py-2 text-[12px] font-semibold text-[#B5431A]">
            <span>✅ {aiAnalysisSummary}</span>
            <span className="text-[11px] text-[#D9531E] shrink-0">
              아래에서 자유롭게 수정 가능
            </span>
          </div>
        )}

        {/* 품목/상태/지역 + 제목/모델명 + 상세내용 컴팩트 입력 */}
        {!isNotice && (isSell || isBulk) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
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

            {isSell && (
              <div>
                <label htmlFor="uf-grade" className="hb-label text-[12px]">
                  외관 · 작동 상태
                </label>
                <select
                  id="uf-grade"
                  value={conditionGrade}
                  onChange={(e) => setConditionGrade(e.target.value)}
                  className="hb-input mt-1 py-2 text-[13px] font-semibold"
                >
                  {PRODUCT_CONDITION_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={isSell ? "" : "sm:col-span-2"}>
              <label htmlFor="uf-region" className="hb-label text-[12px]">
                {isSell ? "방문 수거 지역 (동/구까지) *" : "현장 지역 (선택)"}
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
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className={isNotice ? "sm:col-span-3" : "sm:col-span-2"}>
            <label htmlFor="uf-title" className="hb-label text-[12px]">
              {isNotice
                ? "공지 제목 *"
                : isSell
                ? "매입 신청 품목 / 제목 *"
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
                isSell
                  ? "예: 삼성 양문형 냉장고 매입 문의 (사진 첨부 시 AI 자동입력)"
                  : "예: 캐리어 벽걸이 냉난방기 9평형 재고·설치 문의"
              }
              className={`hb-input mt-1 py-2 text-[13.5px] ${
                fieldErrors.title ? "border-red-500 ring-1 ring-red-500" : ""
              }`}
            />
          </div>

          {!isNotice && (
            <div>
              <label htmlFor="uf-model" className="hb-label text-[12px]">
                모델명{" "}
                <span className="font-normal text-[#6B7280]">(선택/AI추출)</span>
              </label>
              <input
                id="uf-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="명판 사진 시 자동입력"
                className="hb-input mt-1 py-2 font-mono text-[13px]"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="uf-desc" className="hb-label text-[12px]">
            {isNotice
              ? "공지 본문 내용 *"
              : "상세 문의 내용 (희망 지역·층수·일정 등) *"}
          </label>
          <textarea
            id="uf-desc"
            rows={bundleApplied ? 5 : 3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (fieldErrors.description)
                setFieldErrors((p) => ({ ...p, description: "" }));
            }}
            placeholder={
              isSell
                ? "예: 정상 작동하며 1층 매장이라 반출 용이합니다. 이번 주 금요일 수거 희망합니다."
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

      {/* 3. 하단 개인정보 동의 및 제출 버튼 (1줄 인라인 정렬) */}
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
              : "상담 문의 접수하기"}
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

      {/* ── 사진 원본 / 권장 촬영 예시 확대 보기 라이트박스 모달 ── */}
      {zoomedImage && (
        <Modal
          open={!!zoomedImage}
          onClose={() => setZoomedImage(null)}
          label={zoomedImage.title}
          panelClassName="max-w-4xl w-full"
          overlayClassName="!z-[90]"
        >
          <div className="relative flex w-full flex-col rounded-lg bg-[#0E1A2B] p-4 sm:p-5 text-white shadow-2xl border border-white/15">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF8A50] block">
                  Photo Preview &amp; Guide
                </span>
                <p className="truncate text-[15px] sm:text-[16px] font-bold text-white">
                  {zoomedImage.title}
                </p>
                {zoomedImage.desc && (
                  <p className="mt-0.5 text-[12px] text-white/75 leading-relaxed">
                    {zoomedImage.desc}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                aria-label="닫기"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Icon d={ICON.close} className="w-4 h-4" />
              </button>
            </div>

            <div className="relative flex items-center justify-center bg-[#070D16] rounded-md p-2 overflow-auto max-h-[75vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomedImage.src}
                alt={zoomedImage.alt || zoomedImage.title}
                className="max-h-[72vh] w-auto max-w-full rounded object-contain select-none"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-white/60">
              <span className="flex items-center gap-1">
                <span>💡</span>
                <span>모바일에서는 두 손가락으로 화면을 확대(핀치 줌)하여 작은 글씨까지 선명하게 보실 수 있습니다.</span>
              </span>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="hb-btn-outline border-white/30 text-white hover:bg-white/10 text-[12px] h-8 px-4 ml-auto"
              >
                닫기
              </button>
            </div>
          </div>
        </Modal>
      )}
    </form>
  );
}