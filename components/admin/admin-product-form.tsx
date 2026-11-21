// 파일 경로: components/admin/admin-product-form.tsx
"use client";

import React from "react";
import {
  MAX_PHOTOS,
  PRODUCT_CATEGORIES,
  PRODUCT_IMAGE_TONE_EXTRA,
  PRODUCT_STATUS_LIST,
} from "../../lib/site";
import { Icon, ICON, SafeImg } from "../../lib/ui";
import type { PhotoCropState } from "../../lib/image-smart-crop";

interface AdminProductFormProps {
  editingProductId: string | null;
  editingExistingImages: string[];
  setEditingExistingImages: React.Dispatch<React.SetStateAction<string[]>>;
  prodTitle: string;
  setProdTitle: (value: string) => void;
  prodModel: string;
  setProdModel: (value: string) => void;
  prodPrice: string;
  setProdPrice: (value: string) => void;
  prodCategory: string;
  setProdCategory: (value: string) => void;
  prodStatus: string;
  setProdStatus: (value: string) => void;
  prodDesc: string;
  setProdDesc: (value: string) => void;
  prodFiles: File[];
  prodPreviews: string[];
  prodCropStates: Array<PhotoCropState | null>;
  savingProduct: boolean;
  useSearchSpecs: boolean;
  setUseSearchSpecs: (value: boolean) => void;
  autoSmartCrop: boolean;
  setAutoSmartCrop: (value: boolean) => void;
  analyzingProduct: boolean;
  aiPhotoObserved: string[];
  aiSearchSpecs: string[];
  aiWarnings: string[];
  aiSourceNote: string;
  aiSources: string[];
  onResetForm: () => void;
  onSaveProduct: React.FormEventHandler<HTMLFormElement>;
  onProductFileChange: React.ChangeEventHandler<HTMLInputElement>;
  onRunGeminiAnalysis: (files: File[]) => void;
  onEnhanceProdFile: (
    index: number,
    options?: {
      degrees?: number;
      brightness?: number;
      contrast?: number;
      saturate?: number;
    }
  ) => void;
  onToggleProdFileCrop: (index: number) => void;
  onRemoveProdFile: (index: number) => void;
  onMoveProdFile: (fromIdx: number, toIdx: number) => void;
  onMakePrimaryProdFile: (targetIdx: number) => void;
  onAppendSearchSpecs: () => void;
}

/** 관리자 대시보드 상품 등록·수정 폼 (AI 3계층 판독 및 스튜디오 톤업 지원) */
export function AdminProductForm({
  editingProductId,
  editingExistingImages,
  setEditingExistingImages,
  prodTitle,
  setProdTitle,
  prodModel,
  setProdModel,
  prodPrice,
  setProdPrice,
  prodCategory,
  setProdCategory,
  prodStatus,
  setProdStatus,
  prodDesc,
  setProdDesc,
  prodFiles,
  prodPreviews,
  prodCropStates,
  savingProduct,
  useSearchSpecs,
  setUseSearchSpecs,
  autoSmartCrop,
  setAutoSmartCrop,
  analyzingProduct,
  aiPhotoObserved,
  aiSearchSpecs,
  aiWarnings,
  aiSourceNote,
  aiSources,
  onResetForm,
  onSaveProduct,
  onProductFileChange,
  onRunGeminiAnalysis,
  onEnhanceProdFile,
  onToggleProdFileCrop,
  onRemoveProdFile,
  onMoveProdFile,
  onMakePrimaryProdFile,
  onAppendSearchSpecs,
}: AdminProductFormProps) {
  return (
    <section className="rounded-xl border border-[#E2E6EC] bg-white p-5 sm:p-6 lg:col-span-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <h2 className="text-hb-lg font-bold text-[#141A23]">
          {editingProductId ? "상품 정보 수정" : "신규 상품 등록 (AI 보조)"}
        </h2>
        {editingProductId && (
          <button
            type="button"
            onClick={onResetForm}
            className="text-hb-xs font-bold text-[#E8521A] underline"
          >
            신규 등록으로 전환
          </button>
        )}
      </div>

      <form onSubmit={onSaveProduct} className="space-y-4 text-hb-sm">
        {editingProductId && editingExistingImages.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="hb-label">
                기존 등록 사진 ({editingExistingImages.length}장)
              </span>
              <span className="text-hb-xs font-semibold text-[#E8521A]">
                1번 사진이 대표 이미지입니다
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {editingExistingImages.map((imgUrl, idx) => (
                <div
                  key={imgUrl + idx}
                  className="relative aspect-square rounded border border-[#E2E6EC] overflow-hidden bg-[#F1F3F6]"
                >
                  <SafeImg
                    src={imgUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {idx === 0 ? (
                    <span className="absolute left-1 top-1 rounded-sm bg-[#E8521A] px-1.5 py-0.5 text-hb-xs font-bold text-white">
                      대표
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingExistingImages((prev) => {
                          const next = [...prev];
                          const [picked] = next.splice(idx, 1);
                          return [picked, ...next];
                        })
                      }
                      className="absolute left-1 top-1 rounded-sm bg-[#141A23]/85 px-1.5 py-0.5 text-hb-xs font-bold text-white hover:bg-[#E8521A]"
                    >
                      대표 지정
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setEditingExistingImages((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    aria-label="기존 사진 제거"
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600"
                  >
                    <Icon d={ICON.close} className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="hb-label">
            {editingProductId
              ? "추가할 상품 사진"
              : `상품 사진 (최대 ${MAX_PHOTOS}장)`}
          </label>
          <div className="mt-1 mb-2 space-y-2 rounded border border-[#E2E6EC] bg-[#F9FAFB] p-2.5 text-hb-xs">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 font-semibold text-[#141A23] cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSearchSpecs}
                  onChange={(e) => setUseSearchSpecs(e.target.checked)}
                  className="h-4 w-4 accent-[#141A23]"
                />
                <span>모델명 인터넷 검색 사양 참조</span>
              </label>
              {prodFiles.length > 0 && (
                <button
                  type="button"
                  disabled={analyzingProduct}
                  onClick={() => onRunGeminiAnalysis(prodFiles)}
                  className="font-bold text-[#E8521A] underline shrink-0"
                >
                  AI 재분석
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 font-semibold text-[#4B5260] cursor-pointer border-t border-[#E2E6EC]/80 pt-2">
              <input
                type="checkbox"
                checked={autoSmartCrop}
                onChange={(e) => setAutoSmartCrop(e.target.checked)}
                className="h-4 w-4 accent-[#E8521A]"
              />
              <span>제품·명판 자동 크롭 (1:1 비율 보호 · 원본 복구 가능)</span>
            </label>
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            disabled={analyzingProduct}
            onChange={onProductFileChange}
            className="w-full text-hb-xs"
          />
          <p className="mt-1 text-hb-xs font-semibold text-[#646E7E]">
            업로드 즉시 쇼룸 스튜디오 톤업(밝기 +20%·대비 +9%)과 AI 제품·명판 자동 프레이밍이 적용되며,
            썸네일에서 한 번 클릭으로 크롭 전 원본으로 되돌릴 수 있습니다.
          </p>

          {analyzingProduct && (
            <p
              role="status"
              aria-live="polite"
              className="mt-2 rounded bg-[#FFF4EE] p-2.5 text-hb-xs font-bold text-[#E8521A]"
            >
              AI가 사진 판독 및 사양 초안을 작성 중입니다...
            </p>
          )}

          {prodPreviews.length > 0 && (
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {prodPreviews.map((src, index) => (
                <div
                  key={src}
                  className="flex flex-col overflow-hidden rounded border border-[#E2E6EC] bg-[#F9FAFB]"
                >
                  <div className="relative aspect-square bg-[#F1F3F6]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`신규 사진 ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {editingExistingImages.length === 0 && index === 0 ? (
                      <span className="absolute top-1 left-1 rounded-sm bg-[#E8521A] px-1.5 py-0.5 text-hb-xs font-bold text-white">
                        대표
                      </span>
                    ) : (
                      editingExistingImages.length === 0 && (
                        <button
                          type="button"
                          onClick={() => onMakePrimaryProdFile(index)}
                          className="absolute top-1 left-1 rounded-sm bg-[#141A23]/85 px-1.5 py-0.5 text-hb-xs font-bold text-white hover:bg-[#E8521A]"
                        >
                          대표 지정
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveProdFile(index)}
                      aria-label="사진 삭제"
                      className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600"
                    >
                      <Icon d={ICON.close} className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onEnhanceProdFile(index, PRODUCT_IMAGE_TONE_EXTRA)
                      }
                      title="한 단계 더 밝게 (밝기 +12%, 대비 +4%)"
                      aria-label="한 단계 더 밝게 보정"
                      className="absolute bottom-1 right-8 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white hover:bg-[#E8521A] transition-colors"
                    >
                      <Icon
                        d={ICON.sparkles}
                        className="w-3.5 h-3.5 text-[#FF8A50]"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnhanceProdFile(index, { degrees: 90 })}
                      title="시계방향 90도 회전"
                      aria-label="시계방향 90도 회전"
                      className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white hover:bg-[#E8521A]"
                    >
                      <Icon d={ICON.rotate} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {prodCropStates[index] && (
                    <button
                      type="button"
                      onClick={() => onToggleProdFileCrop(index)}
                      title={
                        prodCropStates[index]?.active
                          ? "클릭하면 크롭 전 원본 사진으로 복구합니다"
                          : "클릭하면 AI 자동 크롭을 다시 적용합니다"
                      }
                      className={`w-full border-t border-[#E2E6EC] px-1.5 py-1 text-center text-hb-xs font-bold transition-colors ${
                        prodCropStates[index]?.active
                          ? "bg-[#FFF4EE] text-[#C84312] hover:bg-[#FADCD0]"
                          : "bg-[#F3F4F6] text-[#4B5260] hover:bg-[#E5E7EB]"
                      }`}
                    >
                      {prodCropStates[index]?.active
                        ? prodCropStates[index]?.role === "nameplate"
                          ? "명판 크롭 · 원본 복구"
                          : "제품 크롭 · 원본 복구"
                        : "원본 · 크롭 적용"}
                    </button>
                  )}
                  <div className="grid grid-cols-2 divide-x divide-[#E2E6EC] border-t border-[#E2E6EC] bg-white text-hb-xs font-bold text-[#4B5260]">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveProdFile(index, index - 1)}
                      className="py-1 hover:bg-[#F7F8FA] disabled:opacity-30"
                    >
                      ← 앞
                    </button>
                    <button
                      type="button"
                      disabled={index === prodPreviews.length - 1}
                      onClick={() => onMoveProdFile(index, index + 1)}
                      className="py-1 hover:bg-[#F7F8FA] disabled:opacity-30"
                    >
                      뒤 →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(aiPhotoObserved.length > 0 ||
          aiSearchSpecs.length > 0 ||
          aiWarnings.length > 0) && (
          <div className="rounded border border-[#E2E6EC] bg-[#F9FAFB] p-3 text-hb-xs space-y-2">
            {aiPhotoObserved.length > 0 && (
              <div>
                <strong className="text-[#141A23]">
                  1) 이미지 직접 판독 정보:
                </strong>
                <ul className="list-disc pl-4 text-[#4B5260]">
                  {aiPhotoObserved.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiSearchSpecs.length > 0 && (
              <div>
                <div className="flex items-center justify-between">
                  <strong className="text-[#141A23]">
                    2) 검색으로 확인한 참고 제원:
                  </strong>
                  <button
                    type="button"
                    onClick={onAppendSearchSpecs}
                    className="text-hb-xs font-bold text-[#E8521A] underline"
                  >
                    + 설명란에 반영
                  </button>
                </div>
                <ul className="list-disc pl-4 text-[#4B5260]">
                  {aiSearchSpecs.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiSourceNote && (
              <p className="text-[#E8521A] font-semibold">{aiSourceNote}</p>
            )}
            {aiWarnings.length > 0 && (
              <div className="rounded bg-amber-50 border border-amber-200 p-2 text-amber-900">
                <strong>담당자 확인 필요 항목:</strong>
                <ul className="list-disc pl-4">
                  {aiWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiSources.length > 0 && (
              <div className="text-hb-xs">
                근거 출처:{" "}
                {aiSources.map((u, i) => (
                  <a
                    key={i}
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mr-2 text-blue-700 underline"
                  >
                    [출처 {i + 1}]
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="admin-prod-category" className="hb-label">
              표준 카테고리
            </label>
            <select
              id="admin-prod-category"
              value={prodCategory}
              onChange={(e) => setProdCategory(e.target.value)}
              className="hb-input mt-1 py-2 text-hb-sm font-semibold"
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="admin-prod-status" className="hb-label">
              판매 상태
            </label>
            <select
              id="admin-prod-status"
              value={prodStatus}
              onChange={(e) => setProdStatus(e.target.value)}
              className="hb-input mt-1 py-2 text-hb-sm font-semibold"
            >
              {PRODUCT_STATUS_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="admin-prod-title" className="hb-label">
            상품명 *
          </label>
          <input
            id="admin-prod-title"
            type="text"
            required
            value={prodTitle}
            onChange={(e) => setProdTitle(e.target.value)}
            className="hb-input mt-1 py-2.5"
            placeholder="예: 캐리어 9평형 인버터 벽걸이형 냉난방기 (단상 220V, 모델명)"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="admin-prod-model" className="hb-label">
              모델명 (확인 시)
            </label>
            <input
              id="admin-prod-model"
              type="text"
              value={prodModel}
              onChange={(e) => setProdModel(e.target.value)}
              className="hb-input mt-1 py-2 font-mono text-hb-sm"
            />
          </div>
          <div>
            <label htmlFor="admin-prod-price" className="hb-label">
              가격 (원, 비우면 가격 문의)
            </label>
            <input
              id="admin-prod-price"
              type="text"
              inputMode="numeric"
              value={prodPrice}
              onChange={(e) =>
                setProdPrice(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="hb-input mt-1 py-2"
              placeholder="예: 450000"
            />
          </div>
        </div>

        <div>
          <label htmlFor="admin-prod-desc" className="hb-label">
            AI 작성 설명 초안 (검토 및 편집 후 저장)
          </label>
          <textarea
            id="admin-prod-desc"
            rows={6}
            value={prodDesc}
            onChange={(e) => setProdDesc(e.target.value)}
            className="hb-input mt-1 font-mono text-hb-xs"
          />
        </div>

        <button
          type="submit"
          disabled={savingProduct || analyzingProduct}
          className="hb-btn-primary h-11 w-full text-hb-sm"
        >
          {savingProduct
            ? "저장 처리 중..."
            : editingProductId
            ? "상품 수정내용 승인 및 저장"
            : "검토 완료 후 상품 등록하기"}
        </button>
      </form>
    </section>
  );
}
