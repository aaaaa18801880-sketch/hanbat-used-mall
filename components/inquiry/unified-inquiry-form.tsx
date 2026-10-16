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
    desc: "제품 외관 전체와 도어 형태가 한눈에 보이도록 촬영해 주세요.",
  },
  {
    step: "02",
    title: "모델명·연식 스티커",
    desc: "전면·측면·내부의 에너지효율등급 또는 명판 라벨을 가까이 찍어 주세요.",
  },
  {
    step: "03",
    title: "흠집 · 반출 경로",
    desc: "외관 찍힘 부위나 계단·출입문 등 특이사항이 있다면 함께 찍어 주세요.",
  },
] as const;

const BUY_PHOTO_GUIDE_STEPS = [
  {
    step: "01",
    title: "설치할 공간 전경",
    desc: "제품이 들어갈 자리와 주변 여유 공간을 찍어 주시면 치수 상담이 빠릅니다.",
  },
  {
    step: "02",
    title: "전원 · 배관 위치",
    desc: "업소용 기기·에어컨의 경우 콘센트(단상/삼상)나 배관 위치를 찍어 주세요.",
  },
  {
    step: "03",
    title: "찾으시는 모델 사진",
    desc: "원하시는 디자인이나 기존 사용하시던 제품의 명판 사진도 좋습니다.",
  },
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
  const [conditionGrade, setConditionGrade] = useState<string>(
    PRODUCT_CONDITION_GRADES[1]
  );
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");

  const [basketItems, setBasketItems] = useState<QuoteBasketItem[]>([]);
  const [bundleApplied, setBundleApplied] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [cachedUploadedUrls, setCachedUploadedUrls] = useState<string[] | null>(
    null
  );

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
    phase === "validating" || phase === "submitting" || phase === "retrying";

  const photoGuideSteps =
    isSell || isBulk ? SELL_PHOTO_GUIDE_STEPS : BUY_PHOTO_GUIDE_STEPS;

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
        errors.region = "방문 수거를 위해 지역(구/동까지)을 입력해 주세요.";
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
      className="space-y-5"
    >
      {isAdmin && allowNoticeToggle && (
        <label className="flex cursor-pointer items-center justify-between rounded-md border border-[#FADCD0] bg-[#FFF5F0] p-4">
          <div>
            <span className="block text-[14px] font-bold text-[#B5431A]">
              최상단 고정 공지사항으로 등록
            </span>
            <span className="mt-0.5 block text-[12px] text-[#D9531E]">
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

      {/* [신규 기능 ①] 관심 매물 견적함(묶음 문의) 자동 불러오기 배너 */}
      {!isNotice && basketItems.length > 0 && (
        <div className="rounded-md border border-[#0E1A2B] bg-[#F8FAFC] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#D9531E] text-[12px] font-bold text-white">
                {basketItems.length}
              </span>
              <strong className="text-[13.5px] font-bold text-[#0E1A2B]">
                견적함에 담아둔 관심 매물 {basketItems.length}건이 있습니다
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
              className="rounded bg-[#0E1A2B] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#1C2D47]"
            >
              {bundleApplied
                ? "견적함 목록 다시 반영하기"
                : "이 상품들 묶음 견적으로 자동 입력"}
            </button>
          </div>

          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {basketItems.map((item) => (
              <li
                key={item.id}
                className="inline-flex items-center gap-1.5 rounded border border-[#DDD9D1] bg-white px-2.5 py-1 text-[12px]"
              >
                <span className="font-semibold text-[#0E1A2B] truncate max-w-[180px]">
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

      {!isNotice && (
        <fieldset className="rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <legend className="hb-label flex items-center gap-2 text-[14px]">
              <span className="inline-flex h-5 items-center rounded-sm bg-[#0E1A2B] px-1.5 text-[10.5px] font-extrabold tracking-wider text-[#FF8A50]">
                STEP 01
              </span>
              <span>
                상담 유형 및 연락처 <span className="text-[#D9531E]">*</span>
              </span>
            </legend>
            <span className="hidden sm:inline text-[11.5px] font-semibold text-[#8A8478]">
              필수 항목(*)을 입력해 주세요
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-md bg-[#EAE6DF] p-1.5">
            {INQUIRY_TYPES.map((t) => {
              const active = inquiryType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInquiryType(t)}
                  aria-pressed={active}
                  className={`h-10 rounded px-2 text-[12.5px] sm:text-[13px] font-bold transition-all ${
                    active
                      ? "bg-[#0E1A2B] text-white shadow-xs"
                      : "bg-white/60 text-[#4B5260] hover:bg-white hover:text-[#0E1A2B]"
                  }`}
                >
                  {t === "내 물건 팔기" ? "내 물건 팔기(매입)" : t}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] sm:text-[12.5px] text-[#4B5260] leading-snug">
            {isSell
              ? "💡 고객님이 보유하신 중고 가전·주방설비의 방문 수거 및 매입 견적을 신청합니다."
              : isBulk
              ? "💡 식당·카페·사무실 창업 패키지 도입 또는 폐업·이전 대량 정리를 상담합니다."
              : inquiryType === "구매 문의"
              ? "💡 보고 계신 판매 상품 상담 또는 찾으시는 규격의 재고·가격을 문의합니다."
              : "💡 배송·설치 일정, A/S, 세금계산서 등 기타 문의를 남깁니다."}
          </p>

          <div className="mt-4 pt-4 border-t border-[#E4E0D8] grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
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
                placeholder="예: 홍길동 / 한밭식당"
                className={`hb-input mt-1 bg-white ${
                  fieldErrors.name ? "border-red-500 ring-1 ring-red-500" : ""
                }`}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-[12px] font-semibold text-red-600">
                  {fieldErrors.name}
                </p>
              )}
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
                className={`hb-input mt-1 bg-white tabular-nums ${
                  fieldErrors.phone ? "border-red-500 ring-1 ring-red-500" : ""
                }`}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-[12px] font-semibold text-red-600">
                  {fieldErrors.phone}
                </p>
              )}
            </div>
          </div>
        </fieldset>
      )}

      {isNotice && (
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
              className="hb-input mt-1"
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
              className="hb-input mt-1"
            />
          </div>
        </div>
      )}

      {!isNotice && linkedProduct?.productTitle && !bundleApplied && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-[#FADCD0] bg-[#FFF5F0] px-4 py-3 text-[13px]">
          <div className="min-w-0">
            <span className="font-bold text-[#D9531E]">
              선택 상품 자동 연결됨:{" "}
            </span>
            <strong className="text-[#0E1A2B]">
              {linkedProduct.productTitle}
            </strong>
            {linkedProduct.modelName && (
              <span className="ml-1.5 font-mono text-[12px] text-[#6B7280]">
                ({linkedProduct.modelName})
              </span>
            )}
          </div>
          <span className="shrink-0 text-[11.5px] font-semibold text-[#B5431A]">
            아래에서 수정 가능
          </span>
        </div>
      )}

      <div className="rounded-md border border-[#E4E0D8] bg-white p-4 sm:p-5 space-y-4">
        {!isNotice && (
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F0EDE7]">
            <div className="flex items-center gap-2 text-[14px] font-bold text-[#0E1A2B]">
              <span className="inline-flex h-5 items-center rounded-sm bg-[#0E1A2B] px-1.5 text-[10.5px] font-extrabold tracking-wider text-[#FF8A50]">
                STEP 02
              </span>
              <span>품목 및 상세 문의 내용</span>
            </div>
            <span className="text-[11.5px] text-[#8A8478]">
              {isSell ? "매입 희망 품목·지역 입력" : "문의 품목·내용 입력"}
            </span>
          </div>
        )}

        {!isNotice && (isSell || isBulk) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-3.5">
            <div>
              <label htmlFor="uf-cat" className="hb-label text-[12.5px]">
                제품 종류
              </label>
              <select
                id="uf-cat"
                value={applianceCategory}
                onChange={(e) => setApplianceCategory(e.target.value)}
                className="hb-input mt-1 py-2.5 text-[13.5px] font-semibold bg-white"
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
                <label htmlFor="uf-grade" className="hb-label text-[12.5px]">
                  외관 · 작동 상태
                </label>
                <select
                  id="uf-grade"
                  value={conditionGrade}
                  onChange={(e) => setConditionGrade(e.target.value)}
                  className="hb-input mt-1 py-2.5 text-[13.5px] font-semibold bg-white"
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
              <label htmlFor="uf-region" className="hb-label text-[12.5px]">
                {isSell ? "방문 수거 지역 (동/구까지) *" : "매장/현장 지역 (선택)"}
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
                className={`hb-input mt-1 py-2.5 text-[13.5px] bg-white ${
                  fieldErrors.region ? "border-red-500" : ""
                }`}
              />
              {fieldErrors.region && (
                <p className="mt-1 text-[11.5px] font-semibold text-red-600">
                  {fieldErrors.region}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          <div className={isNotice ? "sm:col-span-3" : "sm:col-span-2"}>
            <label htmlFor="uf-title" className="hb-label">
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
                  ? "예: 삼성 양문형 냉장고 800L 매입 문의"
                  : isBulk
                  ? "예: 카페 오픈용 제빙기·테이블냉장고 세트 견적"
                  : "예: 캐리어 벽걸이 냉난방기 9평형 재고·설치 문의"
              }
              className={`hb-input mt-1 ${
                fieldErrors.title ? "border-red-500 ring-1 ring-red-500" : ""
              }`}
            />
            {fieldErrors.title && (
              <p className="mt-1 text-[12px] font-semibold text-red-600">
                {fieldErrors.title}
              </p>
            )}
          </div>

          {!isNotice && (
            <div>
              <label htmlFor="uf-model" className="hb-label">
                모델명{" "}
                <span className="font-normal text-[#6B7280]">(선택)</span>
              </label>
              <input
                id="uf-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="아시는 경우 입력"
                className="hb-input mt-1 font-mono text-[13.5px]"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="uf-desc" className="hb-label">
            {isNotice
              ? "공지 본문 내용 *"
              : isSell
              ? "상세 상태 및 요청 사항 (구매 연도, 엘리베이터 유무, 희망 방문일 등) *"
              : "상세 문의 내용 (희망 지역, 설치 환경, 수량 등) *"}
          </label>
          <textarea
            id="uf-desc"
            rows={bundleApplied ? 7 : 4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (fieldErrors.description)
                setFieldErrors((p) => ({ ...p, description: "" }));
            }}
            placeholder={
              isSell
                ? "예: 2022년 구매했고 정상 작동합니다. 1층 매장이라 바로 반출 가능하며 이번 주 금요일 수거 희망합니다."
                : "예: 대전 서구 둔산동 1층 상가입니다. 배송 및 기본 설치 포함 견적이 궁금합니다."
            }
            className={`hb-input mt-1 resize-y leading-relaxed ${
              fieldErrors.description ? "border-red-500 ring-1 ring-red-500" : ""
            }`}
          />
          {fieldErrors.description && (
            <p className="mt-1 text-[12px] font-semibold text-red-600">
              {fieldErrors.description}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-md border border-[#E4E0D8] bg-white p-4 sm:p-5 space-y-4">
        {!isNotice && (
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F0EDE7]">
            <div className="flex items-center gap-2 text-[14px] font-bold text-[#0E1A2B]">
              <span className="inline-flex h-5 items-center rounded-sm bg-[#0E1A2B] px-1.5 text-[10.5px] font-extrabold tracking-wider text-[#FF8A50]">
                STEP 03
              </span>
              <span>사진 첨부 및 열람 비밀번호</span>
            </div>
            <span className="text-[11.5px] font-semibold text-[#8A8478] tabular-nums">
              사진 {selectedFiles.length} / {MAX_PHOTOS}장
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div>
            <p className="hb-label">
              사진 첨부{" "}
              <span className="font-normal text-[#6B7280]">
                (최대 {MAX_PHOTOS}장{isSell ? " · 전면/모델명 스티커 권장" : ""})
              </span>
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {filePreviews.map((preview, idx) => (
                <div
                  key={preview}
                  className="relative h-16 w-16 overflow-hidden rounded border border-[#DDD9D1] bg-[#EFECE6]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt={`첨부 사진 ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    aria-label="첨부 사진 삭제"
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600"
                  >
                    <Icon d={ICON.close} className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {selectedFiles.length < MAX_PHOTOS && (
                <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-[#CFCAC0] bg-[#FAF9F7] text-[11px] font-semibold text-[#6B7280] hover:border-[#0E1A2B] hover:text-[#0E1A2B] transition-colors">
                  <Icon d={ICON.camera} className="h-4 w-4 text-[#D9531E]" />
                  <span>사진 추가</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          {!isNotice && (
            <div>
              <label htmlFor="uf-pw" className="hb-label">
                조회용 비밀번호 <span className="text-[#D9531E]">*</span>{" "}
                <span className="font-normal text-[#6B7280]">(4자리 이상)</span>
              </label>
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
                placeholder="문의게시판 내 글 열람 시 사용"
                className={`hb-input mt-1 ${
                  fieldErrors.password ? "border-red-500 ring-1 ring-red-500" : ""
                }`}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-[12px] font-semibold text-red-600">
                  {fieldErrors.password}
                </p>
              )}
              <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-[#6B7280] select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[#0E1A2B]"
                />
                <span>비밀번호 문자 표시</span>
              </label>
            </div>
          )}
        </div>

        {/* 사진 촬영 3컷 시각 가이드 박스 */}
        {!isNotice && (
          <div className="rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-3.5">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#0E1A2B]">
                <Icon d={ICON.camera} className="h-3.5 w-3.5 text-[#D9531E]" />
                <span>
                  {isSell || isBulk
                    ? "이렇게 3장을 찍어주시면 매입 견적이 가장 정확합니다"
                    : "설치 환경이나 참고 사진을 함께 올려주시면 상담이 더욱 빠릅니다"}
                </span>
              </p>
              <span className="hidden sm:inline text-[11px] font-semibold text-[#8A8478]">
                권장 촬영 가이드
              </span>
            </div>

            <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {photoGuideSteps.map((g) => (
                <li
                  key={g.step}
                  className="rounded border border-[#E4E0D8] bg-white px-3 py-2.5 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex h-4.5 items-center justify-center rounded-sm bg-[#0E1A2B] px-1.5 text-[10px] font-bold tabular-nums text-white">
                      컷 {g.step}
                    </span>
                    <strong className="text-[12.5px] font-bold text-[#0E1A2B]">
                      {g.title}
                    </strong>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-snug text-[#4B5260]">
                    {g.desc}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {!isNotice && (
        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-[#4B5260]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (fieldErrors.agreed)
                  setFieldErrors((p) => ({ ...p, agreed: "" }));
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#0E1A2B]"
            />
            <span>
              상담 및 견적 안내를 위해 성함·연락처·문의 내용을 수집하며,{" "}
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
          {fieldErrors.agreed && (
            <p className="mt-1 text-[12px] font-semibold text-red-600">
              {fieldErrors.agreed}
            </p>
          )}
        </div>
      )}

      {phase === "error" && submitErrorMsg && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-[13px] text-red-800 space-y-2.5"
        >
          <p className="font-bold">{submitErrorMsg}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => executeSubmit(true)}
              className="rounded bg-red-600 px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-red-700"
            >
              입력 내용 그대로 재시도
            </button>
            <a
              href={telHref(STORE.tel)}
              className="rounded border border-red-300 bg-white px-3.5 py-2 text-[12.5px] font-bold text-red-700"
            >
              전화({STORE.tel})로 바로 문의
            </a>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E4E0D8]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="hb-btn-outline h-12 px-6 text-[14px]"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isBusy}
          className={`${
            isSell || isNotice ? "hb-btn-accent" : "hb-btn-primary"
          } h-12 px-8 text-[15px] w-full sm:w-auto`}
        >
          {phase === "validating"
            ? "입력 내용 확인 중..."
            : phase === "submitting"
            ? "안전하게 접수 중..."
            : phase === "retrying"
            ? "재시도 처리 중..."
            : isNotice
            ? "공지사항 등록하기"
            : isSell
            ? "무료 매입 견적 신청하기"
            : bundleApplied
            ? "묶음 견적 문의 접수하기"
            : "상담 문의 접수하기"}
        </button>
      </div>
    </form>
  );
}