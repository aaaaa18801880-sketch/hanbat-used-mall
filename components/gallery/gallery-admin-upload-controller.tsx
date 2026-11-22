"use client";

// 파일 경로: components/gallery/gallery-admin-upload-controller.tsx
// 관리자 신규 상품 등록 상태·AI 판독·사진 보정 컨트롤러 (관리자 등록 모달 오픈 시에만 지연 로딩)

import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import { getOptionalAdminAuthHeaders } from "../../lib/admin-auth";
import {
  compressImage,
  enhanceImageFile,
  MAX_PHOTOS,
  PRODUCT_CATEGORIES,
  PRODUCT_IMAGE_TONE_PRESET,
  PRODUCT_STATUS,
  revokeObjectUrls,
  sanitizeOldManufactureYear,
  validateImageFiles,
  type AnalyzeProductApiPayload,
} from "../../lib/site";
import {
  applySmartCropToImageFile,
  formatSmartCropToastSummary,
  parseAnalyzedImageCrops,
  type PhotoCropState,
} from "../../lib/image-smart-crop";
import { GalleryAdminUploadModal } from "./gallery-admin-upload-modal";

export function GalleryAdminUploadController({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: () => Promise<void>;
}) {
  const [productTitle, setProductTitle] = useState("");
  const [productModel, setProductModel] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState<string>(
    PRODUCT_CATEGORIES[0]
  );
  const [productPrice, setProductPrice] = useState("");
  const [productStatus, setProductStatus] = useState<string>(
    PRODUCT_STATUS.SELLING
  );
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const productFilesRef = useRef<File[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);
  const [productCropStates, setProductCropStates] = useState<
    Array<PhotoCropState | null>
  >([]);
  const productCropStatesRef = useRef<Array<PhotoCropState | null>>([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [searchSpecs, setSearchSpecs] = useState(false);
  const [autoSmartCrop, setAutoSmartCrop] = useState(true);
  const [photoObserved, setPhotoObserved] = useState<string[]>([]);
  const [searchDerivedSpecs, setSearchDerivedSpecs] = useState<string[]>([]);
  const [reviewWarnings, setReviewWarnings] = useState<string[]>([]);
  const [foundSources, setFoundSources] = useState<string[]>([]);

  const userManuallyRotatedRef = useRef<Set<number>>(new Set());

  const updateProductCropStates = (
    updater:
      | Array<PhotoCropState | null>
      | ((prev: Array<PhotoCropState | null>) => Array<PhotoCropState | null>)
  ) => {
    const next =
      typeof updater === "function"
        ? updater(productCropStatesRef.current)
        : updater;
    productCropStatesRef.current = next;
    setProductCropStates(next);
  };

  const resetUploadForm = () => {
    revokeObjectUrls(productPreviews);
    productFilesRef.current = [];
    userManuallyRotatedRef.current.clear();
    setProductTitle("");
    setProductModel("");
    setProductDescription("");
    setProductPrice("");
    setProductCategory(PRODUCT_CATEGORIES[0]);
    setProductStatus(PRODUCT_STATUS.SELLING);
    setProductFiles([]);
    setProductPreviews([]);
    updateProductCropStates([]);
    setPhotoObserved([]);
    setSearchDerivedSpecs([]);
    setReviewWarnings([]);
    setFoundSources([]);
    setSearchSpecs(false);
    setIsAnalyzing(false);
  };

  const handleCloseUploadModal = () => {
    if (uploadingProduct || isAnalyzing) {
      if (
        !confirm(
          "상품 등록 또는 AI 분석이 진행 중입니다. 작업을 중단하고 창을 닫으시겠습니까?"
        )
      ) {
        return;
      }
    } else {
      const hasData =
        productFiles.length > 0 ||
        productPreviews.length > 0 ||
        productTitle.trim().length > 0 ||
        productPrice.trim().length > 0 ||
        productDescription.trim().length > 0 ||
        productModel.trim().length > 0;

      if (hasData) {
        if (
          !confirm(
            "작성 중인 상품 정보 및 사진이 있습니다. 등록을 취소하고 창을 닫으시겠습니까?\n(창을 닫으면 작성한 내용이 모두 사라집니다.)"
          )
        ) {
          return;
        }
      }
    }

    resetUploadForm();
    onClose();
  };

  const enhanceUploadFile = async (
    index: number,
    options: {
      degrees?: number;
      brightness?: number;
      contrast?: number;
      saturate?: number;
    } = {},
    isAuto = false
  ) => {
    const targetFile = productFilesRef.current[index] || null;
    if (!targetFile) return;

    const isRotateAction = Boolean(options.degrees);
    try {
      const enhanced = await enhanceImageFile(targetFile, options);
      setProductFiles((prev) => {
        const next = [...prev];
        if (index < next.length) next[index] = enhanced;
        productFilesRef.current = next;
        return next;
      });

      const existingCrop = productCropStatesRef.current[index];
      if (existingCrop) {
        const otherFile = existingCrop.active
          ? existingCrop.originalFile
          : existingCrop.croppedFile;
        let enhancedOther = otherFile;
        try {
          enhancedOther = await enhanceImageFile(otherFile, options);
        } catch {
          // keep fallback
        }
        updateProductCropStates((prev) => {
          const next = [...prev];
          if (index < next.length && next[index]) {
            next[index] = existingCrop.active
              ? { ...existingCrop, croppedFile: enhanced, originalFile: enhancedOther }
              : { ...existingCrop, originalFile: enhanced, croppedFile: enhancedOther };
          }
          return next;
        });
      }

      setProductPreviews((prev) => {
        const next = [...prev];
        if (index < next.length) {
          if (next[index]) revokeObjectUrls([next[index]]);
          next[index] = URL.createObjectURL(enhanced);
        }
        return next;
      });

      if (!isAuto) {
        userManuallyRotatedRef.current.add(index);
        toast.success(
          isRotateAction
            ? `${index + 1}번 사진이 90° 회전되었습니다.`
            : `${index + 1}번 사진이 한 단계 더 밝게 보정되었습니다.`
        );
      }
    } catch (err) {
      console.error("사진 보정 오류:", err);
      if (!isAuto) {
        toast.error(
          isRotateAction
            ? "사진 회전에 실패했습니다."
            : "사진 보정에 실패했습니다."
        );
      }
    }
  };

  const toggleUploadFileCrop = (index: number) => {
    const cropState = productCropStatesRef.current[index];
    if (!cropState) return;

    const nextActive = !cropState.active;
    const nextFile = nextActive ? cropState.croppedFile : cropState.originalFile;

    setProductFiles((prev) => {
      const next = [...prev];
      if (index < next.length) next[index] = nextFile;
      productFilesRef.current = next;
      return next;
    });

    setProductPreviews((prev) => {
      const next = [...prev];
      if (index < next.length) {
        if (next[index]) revokeObjectUrls([next[index]]);
        next[index] = URL.createObjectURL(nextFile);
      }
      return next;
    });

    updateProductCropStates((prev) => {
      const next = [...prev];
      if (index < next.length && next[index]) {
        next[index] = { ...cropState, active: nextActive };
      }
      return next;
    });

    toast.success(
      nextActive
        ? `${index + 1}번 사진에 AI 자동 크롭을 다시 적용했습니다.`
        : `${index + 1}번 사진을 크롭 전 원본으로 복구했습니다.`
    );
  };

  const analyzeImageWithAI = async (filesToAnalyze: File[]) => {
    if (filesToAnalyze.length === 0) return;
    setIsAnalyzing(true);
    const toastId = toast.loading(
      searchSpecs
        ? "AI가 사진을 판독하고 인터넷 제원을 정밀 검색 중입니다..."
        : "AI가 사진 속 모델명과 외관을 초고속 분석 중입니다..."
    );

    try {
      const formData = new FormData();
      formData.append("category", productCategory);
      formData.append("searchSpecs", searchSpecs ? "true" : "false");

      const baseFilesForAnalysis = filesToAnalyze
        .slice(0, MAX_PHOTOS)
        .map((f, idx) => productCropStatesRef.current[idx]?.originalFile ?? f);

      for (const file of baseFilesForAnalysis) {
        const compressedBlob = await compressImage(file, 1080, 0.72);
        const optimizedFile = new File([compressedBlob], file.name, {
          type: "image/jpeg",
        });
        formData.append("files", optimizedFile);
      }

      const authHeaders = await getOptionalAdminAuthHeaders();
      const res = await fetch("/api/analyze-product", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const rawText = await res.text();
      let data: AnalyzeProductApiPayload = {};
      try {
        data = rawText
          ? (JSON.parse(rawText) as AnalyzeProductApiPayload)
          : {};
      } catch {
        throw new Error(
          res.status === 504 || /error occurred|timeout/i.test(rawText)
            ? "서버 분석 시간이 초과되었습니다. '인터넷 공식 제원 정밀 검색' 체크를 끄고 다시 시도해 주세요."
            : "서버 응답을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."
        );
      }
      if (!res.ok) {
        throw new Error(data.error || "분석 요청에 실패했습니다.");
      }

      const cleanData = sanitizeOldManufactureYear(data);

      if (
        cleanData.category &&
        (PRODUCT_CATEGORIES as readonly string[]).includes(cleanData.category)
      ) {
        setProductCategory(cleanData.category);
      }
      if (cleanData.title) setProductTitle(cleanData.title);
      if (cleanData.modelNumber) setProductModel(cleanData.modelNumber);
      if (cleanData.specDetails) setProductDescription(cleanData.specDetails);

      setPhotoObserved(
        Array.isArray(cleanData.photoObserved) ? cleanData.photoObserved : []
      );
      setSearchDerivedSpecs(
        Array.isArray(cleanData.searchDerivedSpecs)
          ? cleanData.searchDerivedSpecs
          : []
      );
      setReviewWarnings(
        Array.isArray(cleanData.needsReview) ? cleanData.needsReview : []
      );
      setFoundSources(
        Array.isArray(cleanData.sourceUrls) ? cleanData.sourceUrls : []
      );

      const appliedRotationDegByIndex = new Map<number, number>();
      if (
        Array.isArray(data.imageRotations) &&
        data.imageRotations.length > 0
      ) {
        let rotatedCount = 0;

        try {
          for (const r of data.imageRotations as Array<{
            index?: unknown;
            rotate?: unknown;
          }>) {
            const idx = typeof r.index === "number" ? r.index - 1 : -1;
            const deg = typeof r.rotate === "number" ? r.rotate : 0;

            if (
              idx >= 0 &&
              idx < filesToAnalyze.length &&
              !userManuallyRotatedRef.current.has(idx) &&
              deg > 0 &&
              deg < 360
            ) {
              await enhanceUploadFile(idx, { degrees: deg }, true);
              appliedRotationDegByIndex.set(idx, deg);
              rotatedCount++;
            }
          }

          if (rotatedCount > 0) {
            toast.success(
              "AI가 옆으로 누운 사진을 감지하여 정방향으로 자동 회전했습니다."
            );
          }
        } catch (enhanceErr) {
          console.warn("AI 자동 회전 적용 중 오류:", enhanceErr);
        }
      }

      if (autoSmartCrop && Array.isArray(data.imageCrops)) {
        const parsedCrops = parseAnalyzedImageCrops(data.imageCrops);
        const appliedRoles: Array<"product" | "nameplate"> = [];

        for (const crop of parsedCrops) {
          const idx = crop.index - 1;
          if (idx < 0 || idx >= productFilesRef.current.length) continue;

          const baseFile =
            productCropStatesRef.current[idx]?.originalFile ??
            productFilesRef.current[idx];
          if (!baseFile) continue;

          try {
            const deg = appliedRotationDegByIndex.get(idx) ?? 0;
            const croppedResult = await applySmartCropToImageFile(
              baseFile,
              crop,
              deg
            );
            if (!croppedResult) continue;

            setProductFiles((prev) => {
              const next = [...prev];
              if (idx < next.length) next[idx] = croppedResult.file;
              productFilesRef.current = next;
              return next;
            });

            setProductPreviews((prev) => {
              const next = [...prev];
              if (idx < next.length) {
                if (next[idx]) revokeObjectUrls([next[idx]]);
                next[idx] = URL.createObjectURL(croppedResult.file);
              }
              return next;
            });

            updateProductCropStates((prev) => {
              const next = [...prev];
              while (next.length <= idx) next.push(null);
              next[idx] = {
                role: croppedResult.plan.role,
                active: true,
                croppedFile: croppedResult.file,
                originalFile: baseFile,
                paddedSquare: Boolean(croppedResult.plan.padBackground),
              };
              return next;
            });

            appliedRoles.push(croppedResult.plan.role);
          } catch {
            // 개별 크롭 실패 시 원본 유지
          }
        }

        const cropSummary = formatSmartCropToastSummary(appliedRoles);
        if (cropSummary) {
          toast.success(cropSummary);
        }
      }

      toast.success(
        "AI 초안이 작성되었습니다. 검토 필요 항목을 확인해 주세요.",
        { id: toastId }
      );
    } catch (error: unknown) {
      console.error("AI 분석 오류:", error);
      toast.error(
        (error instanceof Error && error.message) ||
          "자동 분석에 실패했습니다. 직접 입력해 주세요.",
        { id: toastId }
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    e.target.value = "";
    userManuallyRotatedRef.current.clear();
    const remaining = MAX_PHOTOS - productFiles.length;
    if (remaining <= 0) {
      toast.error(`사진은 최대 ${MAX_PHOTOS}장까지 등록 가능합니다.`);
      return;
    }

    const { ok, error } = validateImageFiles(files, remaining);
    if (error) toast.error(error);
    if (ok.length === 0) return;

    const toned = await Promise.all(
      ok.map(async (f) => {
        try {
          return await enhanceImageFile(f, PRODUCT_IMAGE_TONE_PRESET);
        } catch {
          return f;
        }
      })
    );

    const updatedFiles = [...productFilesRef.current, ...toned];
    productFilesRef.current = updatedFiles;
    setProductFiles(updatedFiles);
    setProductPreviews((prev) => [
      ...prev,
      ...toned.map((f) => URL.createObjectURL(f)),
    ]);
    updateProductCropStates((prev) => [...prev, ...toned.map(() => null)]);
    toast.success(
      `사진 ${toned.length}장에 쇼룸 스튜디오 톤업(밝기 +20%)을 자동 적용했습니다.`
    );

    if (productFiles.length === 0 && ok.length > 0) {
      void analyzeImageWithAI(ok);
    }
  };

  const handleRemoveUploadFile = (index: number) => {
    revokeObjectUrls([productPreviews[index]]);
    setProductFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      productFilesRef.current = next;
      return next;
    });
    setProductPreviews((prev) => prev.filter((_, i) => i !== index));
    updateProductCropStates((prev) => prev.filter((_, i) => i !== index));
  };

  const moveUploadFile = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= productFilesRef.current.length) return;
    const nextFiles = [...productFilesRef.current];
    const [movedFile] = nextFiles.splice(fromIdx, 1);
    nextFiles.splice(toIdx, 0, movedFile);
    productFilesRef.current = nextFiles;
    setProductFiles(nextFiles);
    setProductPreviews((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    updateProductCropStates((prev) => {
      const next = [...prev];
      const [movedCrop] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, movedCrop ?? null);
      return next;
    });
  };

  const makePrimaryUploadFile = (targetIdx: number) => {
    if (targetIdx <= 0 || targetIdx >= productFilesRef.current.length) return;
    const nextFiles = [...productFilesRef.current];
    const [pickedFile] = nextFiles.splice(targetIdx, 1);
    const reorderedFiles = [pickedFile, ...nextFiles];
    productFilesRef.current = reorderedFiles;
    setProductFiles(reorderedFiles);
    setProductPreviews((prev) => {
      const next = [...prev];
      const [picked] = next.splice(targetIdx, 1);
      return [picked, ...next];
    });
    updateProductCropStates((prev) => {
      const next = [...prev];
      const [pickedCrop] = next.splice(targetIdx, 1);
      return [pickedCrop ?? null, ...next];
    });
  };

  const appendSearchSpecsToDescription = () => {
    if (searchDerivedSpecs.length === 0) return;
    const block = searchDerivedSpecs.map((s) => `• ${s}`).join("\n");
    setProductDescription((prev) =>
      prev.trim() ? `${prev.trim()}\n\n[검색 참조 사양]\n${block}` : block
    );
    toast.success("검색 참조 사양이 설명란에 추가되었습니다.");
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle.trim()) {
      toast.error("제품명을 입력해 주세요.");
      return;
    }
    if (productFiles.length === 0) {
      toast.error("최소 1장의 상품 사진을 첨부해 주세요.");
      return;
    }

    setUploadingProduct(true);
    try {
      const { createProductRecord } = await import("../../lib/product-ops");
      await createProductRecord({
        title: productTitle,
        category: productCategory,
        status: productStatus,
        price: productPrice,
        conditionGrade: null,
        description: productDescription,
        modelName: productModel,
        files: productFiles,
      });

      toast.success("새 상품이 등록되었습니다.");
      resetUploadForm();
      onClose();
      await onUploaded();
    } catch (error: unknown) {
      toast.error(
        "등록 실패: " +
          (error instanceof Error ? error.message : "알 수 없는 오류")
      );
    } finally {
      setUploadingProduct(false);
    }
  };

  return (
    <GalleryAdminUploadModal
      open={open}
      onClose={handleCloseUploadModal}
      onSubmit={handleProductSubmit}
      isAnalyzing={isAnalyzing}
      uploadingProduct={uploadingProduct}
      searchSpecs={searchSpecs}
      setSearchSpecs={setSearchSpecs}
      autoSmartCrop={autoSmartCrop}
      setAutoSmartCrop={setAutoSmartCrop}
      productFiles={productFiles}
      productPreviews={productPreviews}
      productCropStates={productCropStates}
      analyzeImageWithAI={analyzeImageWithAI}
      onFileChange={handleFileChange}
      makePrimaryUploadFile={makePrimaryUploadFile}
      onRemoveUploadFile={handleRemoveUploadFile}
      enhanceUploadFile={enhanceUploadFile}
      toggleUploadFileCrop={toggleUploadFileCrop}
      moveUploadFile={moveUploadFile}
      photoObserved={photoObserved}
      searchDerivedSpecs={searchDerivedSpecs}
      reviewWarnings={reviewWarnings}
      foundSources={foundSources}
      appendSearchSpecsToDescription={appendSearchSpecsToDescription}
      productCategory={productCategory}
      setProductCategory={setProductCategory}
      productStatus={productStatus}
      setProductStatus={setProductStatus}
      productTitle={productTitle}
      setProductTitle={setProductTitle}
      productModel={productModel}
      setProductModel={setProductModel}
      productPrice={productPrice}
      setProductPrice={setProductPrice}
      productDescription={productDescription}
      setProductDescription={setProductDescription}
    />
  );
}
