"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { revokeObjectUrls } from "../../lib/site";
import { prepareInquiryFileAdditions } from "../../lib/inquiry-client";

interface UseInquiryAttachmentsOptions {
  onFilesAdded?: (addedCount: number) => void;
  onEmptyAfterRemove?: () => void;
}

/**
 * 문의 폼(UnifiedInquiryForm / V2WizardQuickInquiry) 공통 사진 첨부·미리보기 Blob URL·업로드 캐시 훅.
 * - 파일 추가/삭제 시 캐시된 업로드 URL을 무효화합니다.
 * - 컴포넌트 언마운트 시 잔류 Blob URL을 일괄 해제합니다.
 */
export function useInquiryAttachments(
  options: UseInquiryAttachmentsOptions = {}
) {
  const { onFilesAdded, onEmptyAfterRemove } = options;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [cachedUploadedUrls, setCachedUploadedUrls] = useState<string[] | null>(
    null
  );

  const filePreviewsRef = useRef<string[]>([]);
  const onFilesAddedRef = useRef(onFilesAdded);
  const onEmptyAfterRemoveRef = useRef(onEmptyAfterRemove);

  useEffect(() => {
    onFilesAddedRef.current = onFilesAdded;
    onEmptyAfterRemoveRef.current = onEmptyAfterRemove;
  });

  const updateFilePreviews = useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      const next =
        typeof updater === "function"
          ? updater(filePreviewsRef.current)
          : updater;
      filePreviewsRef.current = next;
      setFilePreviews(next);
    },
    []
  );

  useEffect(() => {
    return () => {
      revokeObjectUrls(filePreviewsRef.current);
    };
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []);
      e.target.value = "";
      const { files: ok, previews, error } = prepareInquiryFileAdditions(
        picked,
        selectedFiles.length
      );
      if (error) toast.error(error);
      if (ok.length === 0) return;

      onFilesAddedRef.current?.(ok.length);
      setSelectedFiles((prev) => [...prev, ...ok]);
      updateFilePreviews((prev) => [...prev, ...previews]);
      setCachedUploadedUrls(null);
    },
    [selectedFiles.length, updateFilePreviews]
  );

  const handleRemoveFile = useCallback(
    (index: number) => {
      revokeObjectUrls([filePreviewsRef.current[index]]);
      if (selectedFiles.length <= 1) {
        onEmptyAfterRemoveRef.current?.();
      }
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
      updateFilePreviews((prev) => prev.filter((_, i) => i !== index));
      setCachedUploadedUrls(null);
    },
    [selectedFiles.length, updateFilePreviews]
  );

  const clearAttachments = useCallback(() => {
    revokeObjectUrls(filePreviewsRef.current);
    setSelectedFiles([]);
    updateFilePreviews([]);
    setCachedUploadedUrls(null);
  }, [updateFilePreviews]);

  return {
    selectedFiles,
    filePreviews,
    cachedUploadedUrls,
    setCachedUploadedUrls,
    handleFileChange,
    handleRemoveFile,
    clearAttachments,
  };
}
