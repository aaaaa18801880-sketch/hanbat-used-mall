// 파일 경로: components/admin/admin-smart-crop-modal.tsx
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Icon, ICON } from "../../lib/icons";
import { Modal, SafeImg } from "../../lib/ui";
import { getAdminAuthHeaders } from "../../lib/supabase";
import {
  compressImage,
  enhanceImageFile,
  MAX_PHOTOS,
  normalizeProductCategory,
  revokeObjectUrls,
  splitImages,
  type AnalyzeProductApiPayload,
} from "../../lib/site";
import {
  applySmartCropToImageFile,
  parseAnalyzedImageCrops,
} from "../../lib/image-smart-crop";
import { replaceProductImagesRecord } from "../../lib/product-ops";
import type { AdminProductRow } from "./admin-types";

interface CropPreviewItem {
  index: number;
  originalUrl: string;
  role: "product" | "nameplate" | "other";
  rotatedDeg: number;
  paddedSquare: boolean;
  croppedFile: File | null;
  croppedPreviewUrl: string | null;
  apply: boolean;
  skipNote: string | null;
}

interface AnalysisSessionState {
  productId: string;
  items: CropPreviewItem[];
  analyzed: boolean;
  errorMsg: string | null;
  savedNotice: boolean;
}

function buildInitialItems(product: AdminProductRow): CropPreviewItem[] {
  return splitImages(product.image_url)
    .slice(0, MAX_PHOTOS)
    .map((url, idx) => ({
      index: idx,
      originalUrl: url,
      role: "other",
      rotatedDeg: 0,
      paddedSquare: false,
      croppedFile: null,
      croppedPreviewUrl: null,
      apply: false,
      skipNote: null,
    }));
}

export function AdminSmartCropModal({
  product,
  productsQueue,
  onClose,
  onSelectProduct,
  onSaved,
}: {
  product: AdminProductRow | null;
  productsQueue: AdminProductRow[];
  onClose: () => void;
  onSelectProduct: (next: AdminProductRow) => void;
  onSaved: (productId: string, nextImageUrl: string) => void;
}) {
  const [session, setSession] = useState<AnalysisSessionState | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const requestSeqRef = useRef(0);
  const previewUrlsRef = useRef<string[]>([]);

  const clearPreviewUrls = useCallback(() => {
    revokeObjectUrls(previewUrlsRef.current);
    previewUrlsRef.current = [];
  }, []);

  const currentIdx = useMemo(() => {
    if (!product) return -1;
    return productsQueue.findIndex((p) => p.id === product.id);
  }, [product, productsQueue]);

  const prevProduct = currentIdx > 0 ? productsQueue[currentIdx - 1] : null;
  const nextProduct =
    currentIdx >= 0 && currentIdx < productsQueue.length - 1
      ? productsQueue[currentIdx + 1]
      : null;

  const activeSession: AnalysisSessionState | null = useMemo(() => {
    if (!product) return null;
    if (session && session.productId === product.id) return session;
    return {
      productId: product.id,
      items: buildInitialItems(product),
      analyzed: false,
      errorMsg: null,
      savedNotice: false,
    };
  }, [product, session]);

  const handleCloseModal = () => {
    if (saving) return;
    requestSeqRef.current += 1;
    clearPreviewUrls();
    setAnalyzing(false);
    setSession(null);
    onClose();
  };

  const handleStepProduct = (target: AdminProductRow) => {
    if (saving) return;
    requestSeqRef.current += 1;
    clearPreviewUrls();
    setAnalyzing(false);
    setSession(null);
    onSelectProduct(target);
  };

  const runAnalysis = async (target: AdminProductRow) => {
    const seq = ++requestSeqRef.current;
    clearPreviewUrls();
    setAnalyzing(true);

    const originalUrls = splitImages(target.image_url).slice(0, MAX_PHOTOS);
    if (originalUrls.length === 0) {
      setAnalyzing(false);
      setSession({
        productId: target.id,
        items: [],
        analyzed: true,
        errorMsg: "등록된 상품 사진이 없습니다.",
        savedNotice: false,
      });
      return;
    }

    setSession({
      productId: target.id,
      items: buildInitialItems(target),
      analyzed: false,
      errorMsg: null,
      savedNotice: false,
    });

    try {
      const fetchedFiles: File[] = [];
      for (let i = 0; i < originalUrls.length; i++) {
        const res = await fetch(originalUrls[i]);
        if (!res.ok) {
          throw new Error(`사진 ${i + 1}번을 불러오지 못했습니다.`);
        }
        const blob = await res.blob();
        fetchedFiles.push(
          new File([blob], `product_${target.id}_${i + 1}.jpg`, {
            type: blob.type || "image/jpeg",
          })
        );
      }

      if (requestSeqRef.current !== seq) return;

      const formData = new FormData();
      formData.append("category", normalizeProductCategory(target.category));
      formData.append("searchSpecs", "false");

      for (const file of fetchedFiles) {
        const compressed = await compressImage(file, 1080, 0.72);
        formData.append(
          "files",
          new File([compressed], file.name, { type: "image/jpeg" })
        );
      }

      const headers = await getAdminAuthHeaders();
      const aiRes = await fetch("/api/analyze-product", {
        method: "POST",
        headers,
        body: formData,
      });
      const rawText = await aiRes.text();
      let data: AnalyzeProductApiPayload = {};
      try {
        data = rawText
          ? (JSON.parse(rawText) as AnalyzeProductApiPayload)
          : {};
      } catch {
        throw new Error("서버 분석 시간이 초과되었거나 응답 형식이 올바르지 않습니다.");
      }
      if (!aiRes.ok) {
        throw new Error(data.error || "AI 사진 분석에 실패했습니다.");
      }

      if (requestSeqRef.current !== seq) return;

      const rotationMap = new Map<number, number>();
      if (Array.isArray(data.imageRotations)) {
        for (const r of data.imageRotations as Array<{
          index?: unknown;
          rotate?: unknown;
        }>) {
          const idx = typeof r.index === "number" ? r.index - 1 : -1;
          const deg = typeof r.rotate === "number" ? r.rotate : 0;
          if (idx >= 0 && idx < fetchedFiles.length && deg > 0 && deg < 360) {
            rotationMap.set(idx, deg);
          }
        }
      }

      const parsedCrops = parseAnalyzedImageCrops(data.imageCrops);
      const cropByIndex = new Map(parsedCrops.map((c) => [c.index - 1, c]));

      const createdUrls: string[] = [];
      const nextItems: CropPreviewItem[] = [];

      for (let i = 0; i < originalUrls.length; i++) {
        const origUrl = originalUrls[i];
        const deg = rotationMap.get(i) ?? 0;
        let workingFile = fetchedFiles[i];

        if (deg > 0) {
          try {
            workingFile = await enhanceImageFile(workingFile, { degrees: deg });
          } catch {
            // 회전 실패 시 원본 유지
          }
        }

        const crop = cropByIndex.get(i);
        if (!crop || crop.role === "other") {
          const rotatedPreview =
            deg > 0 ? URL.createObjectURL(workingFile) : null;
          if (rotatedPreview) createdUrls.push(rotatedPreview);
          nextItems.push({
            index: i,
            originalUrl: origUrl,
            role: "other",
            rotatedDeg: deg,
            paddedSquare: false,
            croppedFile: deg > 0 ? workingFile : null,
            croppedPreviewUrl: rotatedPreview,
            apply: deg > 0,
            skipNote:
              deg > 0
                ? `방향 자동 회전(${deg}°) 적용`
                : "이미 적정 구도 또는 전경/복수 제품 사진 — 원본 유지 권장",
          });
          continue;
        }

        try {
          const applied = await applySmartCropToImageFile(
            workingFile,
            crop,
            deg
          );
          if (!applied) {
            const rotatedPreview =
              deg > 0 ? URL.createObjectURL(workingFile) : null;
            if (rotatedPreview) createdUrls.push(rotatedPreview);
            nextItems.push({
              index: i,
              originalUrl: origUrl,
              role: crop.role,
              rotatedDeg: deg,
              paddedSquare: false,
              croppedFile: deg > 0 ? workingFile : null,
              croppedPreviewUrl: rotatedPreview,
              apply: deg > 0,
              skipNote:
                deg > 0
                  ? `방향 회전(${deg}°)만 적용 (이미 적정 크기)`
                  : "이미 화면에 꽉 찬 구도이거나 해상도 보호 기준 — 원본 유지 권장",
            });
            continue;
          }

          const previewUrl = URL.createObjectURL(applied.file);
          createdUrls.push(previewUrl);
          nextItems.push({
            index: i,
            originalUrl: origUrl,
            role: applied.plan.role,
            rotatedDeg: deg,
            paddedSquare: Boolean(applied.plan.padBackground),
            croppedFile: applied.file,
            croppedPreviewUrl: previewUrl,
            apply: true,
            skipNote: null,
          });
        } catch {
          nextItems.push({
            index: i,
            originalUrl: origUrl,
            role: crop.role,
            rotatedDeg: deg,
            paddedSquare: false,
            croppedFile: null,
            croppedPreviewUrl: null,
            apply: false,
            skipNote: "크롭 처리 중 오류 — 원본 유지",
          });
        }
      }

      if (requestSeqRef.current !== seq) {
        revokeObjectUrls(createdUrls);
        return;
      }

      previewUrlsRef.current = createdUrls;
      setSession({
        productId: target.id,
        items: nextItems,
        analyzed: true,
        errorMsg: null,
        savedNotice: false,
      });
    } catch (err) {
      if (requestSeqRef.current !== seq) return;
      const msg =
        err instanceof Error
          ? err.message
          : "기존 사진을 분석하지 못했습니다.";
      setSession({
        productId: target.id,
        items: buildInitialItems(target),
        analyzed: false,
        errorMsg: msg,
        savedNotice: false,
      });
    } finally {
      if (requestSeqRef.current === seq) {
        setAnalyzing(false);
      }
    }
  };

  if (!product || !activeSession) return null;

  const { items, analyzed, errorMsg, savedNotice } = activeSession;
  const selectedReplacements = items.filter((it) => it.apply && it.croppedFile);

  const handleToggleApply = (idx: number) => {
    setSession((prev) => {
      if (!prev || prev.productId !== product.id) return prev;
      return {
        ...prev,
        items: prev.items.map((it) =>
          it.index === idx && it.croppedFile ? { ...it, apply: !it.apply } : it
        ),
      };
    });
  };

  const handleSave = async () => {
    if (saving || selectedReplacements.length === 0) return;
    setSaving(true);
    const toastId = toast.loading(
      `보정 사진 ${selectedReplacements.length}장을 업로드하고 반영 중입니다...`
    );
    try {
      const allOriginalUrls = splitImages(product.image_url);
      const result = await replaceProductImagesRecord({
        id: product.id,
        originalUrls: allOriginalUrls,
        replacements: selectedReplacements.map((it) => ({
          index: it.index,
          file: it.croppedFile as File,
        })),
      });
      onSaved(product.id, result.imageUrl);
      setSession((prev) =>
        prev && prev.productId === product.id
          ? { ...prev, savedNotice: true }
          : prev
      );
      toast.success(
        `사진 ${result.replacedCount}장이 스마트 크롭본으로 교체되었습니다.`,
        { id: toastId }
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "보정 사진 저장에 실패했습니다.",
        { id: toastId }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(product)}
      onClose={handleCloseModal}
      label="기존 매물 AI 사진 스마트 크롭 보정"
      panelClassName="max-w-4xl"
      closeOnOverlayClick={false}
    >
      <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-[#E2E6EC] bg-white shadow-2xl">
        {/* 상단 헤더 + 연속 검수 내비게이션 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E6EC] bg-[#141A23] px-5 py-4 text-white">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-hb-xs font-bold text-[#FF8A50]">
              <span>기존 매물 AI 사진 스마트 크롭</span>
              {currentIdx >= 0 && (
                <span className="rounded bg-white/15 px-2 py-0.5 font-mono text-white tabular-nums">
                  {currentIdx + 1} / {productsQueue.length}
                </span>
              )}
              <span className="rounded bg-white/10 px-2 py-0.5 text-white/85">
                {normalizeProductCategory(product.category)}
              </span>
            </div>
            <h2 className="mt-1 truncate text-hb-base sm:text-hb-lg font-bold text-white">
              {product.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={!prevProduct || saving}
              onClick={() => prevProduct && handleStepProduct(prevProduct)}
              className="h-8 rounded-lg border border-white/20 bg-white/10 px-2.5 text-hb-xs font-bold text-white hover:bg-white/20 disabled:opacity-40 cursor-pointer"
            >
              ← 이전
            </button>
            <button
              type="button"
              disabled={!nextProduct || saving}
              onClick={() => nextProduct && handleStepProduct(nextProduct)}
              className="h-8 rounded-lg border border-white/20 bg-white/10 px-2.5 text-hb-xs font-bold text-white hover:bg-white/20 disabled:opacity-40 cursor-pointer"
            >
              다음 →
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleCloseModal}
              aria-label="스마트 크롭 창 닫기"
              className="ml-1 grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            >
              <Icon d={ICON.close} className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 본문: Before / After 비교 그리드 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FAF9F6]">
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#E2DDD3] bg-white px-4 py-3 text-hb-xs text-[#475569]">
            <p className="break-keep">
              현재 사진을 먼저 확인한 뒤 보정이 필요한 매물만{" "}
              <strong className="text-[#141A23]">AI 스마트 크롭 분석</strong>을 실행하세요. 세로형 가전은 1:1 스튜디오 여백으로 잘림을 방지하고, 명판은 모델명만 확대합니다.
            </p>
            <button
              type="button"
              disabled={analyzing || saving || items.length === 0}
              onClick={() => void runAnalysis(product)}
              className="shrink-0 rounded-lg bg-[#141A23] px-3.5 py-2 text-hb-xs font-bold text-white hover:bg-[#C84312] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {analyzing
                ? "AI 구도 분석 중..."
                : analyzed
                ? "AI 다시 분석"
                : "AI 스마트 크롭 분석 실행"}
            </button>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-hb-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {savedNotice && (
            <div className="rounded-xl border border-[#99F6E4] bg-[#F0FDFA] px-4 py-3 text-hb-xs font-bold text-[#0F766E] flex flex-wrap items-center justify-between gap-2">
              <span>보정 사진이 데이터베이스와 갤러리에 즉시 반영되었습니다.</span>
              {nextProduct && (
                <button
                  type="button"
                  onClick={() => handleStepProduct(nextProduct)}
                  className="rounded-lg bg-[#0F766E] px-3 py-1 text-hb-xs font-bold text-white hover:bg-[#115E59] cursor-pointer"
                >
                  다음 매물 바로 검수 →
                </button>
              )}
            </div>
          )}

          <div className="space-y-4">
            {items.map((item) => {
              const roleBadge = !analyzed
                ? "분석 대기 중"
                : item.role === "nameplate"
                ? "명판 확대 · 가독성 보정"
                : item.role === "product"
                ? item.paddedSquare
                  ? "제품 크롭 · 1:1 스튜디오 여백"
                  : "제품 본체 크롭"
                : "원본 유지 대상";

              return (
                <div
                  key={`${product.id}-${item.index}`}
                  className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-2xs"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#141A23] px-2 py-0.5 font-mono text-hb-xs font-bold text-white">
                        사진 {item.index + 1}
                        {item.index === 0 ? " (대표)" : ""}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-hb-xs font-bold ${
                          item.croppedFile
                            ? "bg-[#FFF4EE] text-[#C84312] border border-[#FED7AA]"
                            : "bg-[#F1F3F6] text-[#475569] border border-[#E2E6EC]"
                        }`}
                      >
                        {analyzing ? "AI 구도 판독 중..." : roleBadge}
                      </span>
                    </div>

                    {item.croppedFile && !analyzing && (
                      <button
                        type="button"
                        onClick={() => handleToggleApply(item.index)}
                        className={`h-8 rounded-lg px-3 text-hb-xs font-bold transition-colors cursor-pointer ${
                          item.apply
                            ? "bg-[#C84312] text-white hover:bg-[#A8360D]"
                            : "border border-[#CBD2DC] bg-white text-[#475569] hover:border-[#141A23] hover:text-[#141A23]"
                        }`}
                      >
                        {item.apply
                          ? "보정 적용 선택됨 (클릭 시 해제)"
                          : "원본 유지 중 (클릭 시 적용)"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Before */}
                    <div className="space-y-1.5">
                      <span className="block text-hb-xs font-bold text-[#64748B]">
                        BEFORE · 현재 등록 사진
                      </span>
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#E2E6EC] bg-[#F4F3F0]">
                        <SafeImg
                          src={item.originalUrl}
                          alt={`원본 사진 ${item.index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>

                    {/* After */}
                    <div className="space-y-1.5">
                      <span className="block text-hb-xs font-bold text-[#C84312]">
                        AFTER · AI 스마트 크롭 미리보기
                      </span>
                      <div
                        className={`relative aspect-square w-full overflow-hidden rounded-xl border bg-[#F4F3F0] flex items-center justify-center ${
                          item.apply && item.croppedPreviewUrl
                            ? "border-[#C84312] ring-2 ring-[#C84312]/20"
                            : "border-[#E2E6EC]"
                        }`}
                      >
                        {analyzing ? (
                          <div className="text-center px-4">
                            <p className="text-hb-xs font-bold text-[#475569] animate-pulse">
                              Gemini Vision이 제품/명판 영역을 분석 중입니다...
                            </p>
                          </div>
                        ) : !analyzed ? (
                          <div className="p-5 text-center space-y-2">
                            <p className="text-hb-xs font-bold text-[#141A23]">
                              보정이 필요하면 분석 버튼을 눌러주세요
                            </p>
                            <p className="text-hb-xs text-[#64748B] break-keep">
                              이미 구도가 깔끔하다면 바로 다음 매물로 넘어가실 수 있습니다.
                            </p>
                          </div>
                        ) : item.croppedPreviewUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.croppedPreviewUrl}
                              alt={`스마트 크롭 사진 ${item.index + 1}`}
                              className={`h-full w-full object-cover transition-opacity ${
                                item.apply ? "opacity-100" : "opacity-45"
                              }`}
                            />
                            {!item.apply && (
                              <span className="absolute rounded-lg bg-[#141A23]/85 px-3 py-1.5 text-hb-xs font-bold text-white">
                                저장 제외 (원본 유지)
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="p-5 text-center space-y-1">
                            <p className="text-hb-xs font-bold text-[#141A23]">
                              원본 사진 그대로 유지 권장
                            </p>
                            {item.skipNote && (
                              <p className="text-hb-xs text-[#64748B] break-keep">
                                {item.skipNote}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단 저장 액션 바 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E6EC] bg-white px-5 py-3.5">
          <span className="text-hb-xs font-semibold text-[#475569]">
            {analyzing
              ? "사진 분석이 끝나면 교체할 사진을 선택해 저장할 수 있습니다."
              : !analyzed
              ? "상단 [AI 스마트 크롭 분석 실행] 버튼으로 Before/After를 확인하세요."
              : selectedReplacements.length > 0
              ? `선택된 보정 사진 ${selectedReplacements.length}장을 교체 저장합니다. (순서 유지)`
              : "교체할 보정 사진이 없거나 모두 원본 유지로 설정되었습니다."}
          </span>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {nextProduct && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleStepProduct(nextProduct)}
                className="hb-btn-outline h-10 px-4 text-hb-xs font-bold cursor-pointer"
              >
                건너뛰고 다음 매물 →
              </button>
            )}
            <button
              type="button"
              disabled={analyzing || saving || selectedReplacements.length === 0}
              onClick={() => void handleSave()}
              className="hb-btn-accent h-10 px-5 text-hb-xs font-bold disabled:opacity-45 cursor-pointer"
            >
              {saving
                ? "저장 중..."
                : `보정 사진 ${selectedReplacements.length}장 저장`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
