// 파일 경로: components/gallery/gallery-admin-upload-modal.tsx
"use client";

import React from "react";
import {
  MAX_PHOTOS,
  PRODUCT_CATEGORIES,
  PRODUCT_IMAGE_TONE_EXTRA,
  PRODUCT_STATUS,
} from "../../lib/site";
import { ICON, Icon, Modal } from "../../lib/ui";
import type { PhotoCropState } from "../../lib/image-smart-crop";

interface GalleryAdminUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  isAnalyzing: boolean;
  uploadingProduct: boolean;
  searchSpecs: boolean;
  setSearchSpecs: (v: boolean) => void;
  autoSmartCrop: boolean;
  setAutoSmartCrop: (v: boolean) => void;
  productFiles: File[];
  productPreviews: string[];
  productCropStates: Array<PhotoCropState | null>;
  analyzeImageWithAI: (files: File[]) => void;
  onFileChange: React.ChangeEventHandler<HTMLInputElement>;
  makePrimaryUploadFile: (index: number) => void;
  onRemoveUploadFile: (index: number) => void;
  enhanceUploadFile: (
    index: number,
    options?: {
      degrees?: number;
      brightness?: number;
      contrast?: number;
      saturate?: number;
    },
    isAuto?: boolean
  ) => void;
  toggleUploadFileCrop: (index: number) => void;
  moveUploadFile: (fromIdx: number, toIdx: number) => void;
  photoObserved: string[];
  searchDerivedSpecs: string[];
  reviewWarnings: string[];
  foundSources: string[];
  appendSearchSpecsToDescription: () => void;
  productCategory: string;
  setProductCategory: (v: string) => void;
  productStatus: string;
  setProductStatus: (v: string) => void;
  productTitle: string;
  setProductTitle: (v: string) => void;
  productModel: string;
  setProductModel: (v: string) => void;
  productPrice: string;
  setProductPrice: (v: string) => void;
  productDescription: string;
  setProductDescription: (v: string) => void;
}

/** 관리자 신규 판매 상품 등록 모달 (사진 순서 변경 + AI 판독/검색 사양 검토) */
export function GalleryAdminUploadModal({
  open,
  onClose,
  onSubmit,
  isAnalyzing,
  uploadingProduct,
  searchSpecs,
  setSearchSpecs,
  autoSmartCrop,
  setAutoSmartCrop,
  productFiles,
  productPreviews,
  productCropStates,
  analyzeImageWithAI,
  onFileChange,
  makePrimaryUploadFile,
  onRemoveUploadFile,
  enhanceUploadFile,
  toggleUploadFileCrop,
  moveUploadFile,
  photoObserved,
  searchDerivedSpecs,
  reviewWarnings,
  foundSources,
  appendSearchSpecsToDescription,
  productCategory,
  setProductCategory,
  productStatus,
  setProductStatus,
  productTitle,
  setProductTitle,
  productModel,
  setProductModel,
  productPrice,
  setProductPrice,
  productDescription,
  setProductDescription,
}: GalleryAdminUploadModalProps) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      label="판매 상품 등록"
      panelClassName="max-w-lg"
    >
      <div className="bg-white w-full max-h-[92vh] flex flex-col rounded-lg shadow-2xl border border-[#E2E6EC] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E6EC] bg-white shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <h2 className="text-hb-lg font-bold text-[#141A23]">
              판매 상품 등록
            </h2>
            {isAnalyzing && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-hb-xs font-bold bg-[#FFF4EE] text-[#E8521A] border border-[#FADCD0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8521A]" />
                사양 분석 중
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center text-[#64748B] hover:text-[#141A23]"
            aria-label="닫기"
          >
            <Icon d={ICON.close} className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          {/* 스크롤 가능한 본문 영역 */}
          <div className="overflow-y-auto flex-1 p-6 space-y-5 text-hb-sm">
            {/* 1. 사진 업로드 및 순서 변경 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="hb-label">
                  상품 사진 첨부 (최대 {MAX_PHOTOS}장) *
                </label>
                <span className="text-hb-xs font-bold text-[#E8521A]">
                  1번 사진이 대표 이미지로 노출됩니다
                </span>
              </div>

              <div className="mb-2.5 space-y-2 p-2.5 bg-[#F7F8FA] rounded border border-[#E2E6EC]">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-hb-xs font-semibold text-[#141A23] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={searchSpecs}
                      onChange={(e) => setSearchSpecs(e.target.checked)}
                      className="w-4 h-4 accent-[#141A23]"
                    />
                    <span>인터넷 공식 제원 정밀 검색 (필요 시 선택)</span>
                  </label>
                  {productFiles.length > 0 && (
                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => analyzeImageWithAI(productFiles)}
                      className="text-hb-xs font-bold text-[#E8521A] underline underline-offset-2 disabled:opacity-50 shrink-0"
                    >
                      AI 재분석
                    </button>
                  )}
                </div>
                <label className="flex items-center gap-2 text-hb-xs font-semibold text-[#4B5260] cursor-pointer select-none border-t border-[#E2E6EC]/80 pt-2">
                  <input
                    type="checkbox"
                    checked={autoSmartCrop}
                    onChange={(e) => setAutoSmartCrop(e.target.checked)}
                    className="w-4 h-4 accent-[#E8521A]"
                  />
                  <span>제품·명판 자동 크롭 (1:1 비율 보호 · 원본 복구 가능)</span>
                </label>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFileChange}
                disabled={productFiles.length >= MAX_PHOTOS || isAnalyzing}
                className="w-full text-hb-xs text-[#334155] file:mr-3 file:py-2 file:px-3.5 file:rounded file:border-0 file:text-hb-xs file:font-bold file:bg-[#141A23] file:text-white hover:file:bg-[#1E2736] cursor-pointer disabled:opacity-50"
              />

              {isAnalyzing && (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-2.5 p-3 bg-[#FFF4EE] border border-[#FADCD0] rounded-lg text-[#E8521A] text-hb-xs font-semibold"
                >
                  사진 속 명판과 제품 사양을 분석하고 있습니다...
                </p>
              )}

              {productPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2.5">
                  {productPreviews.map((preview, index) => (
                    <div
                      key={preview}
                      className="flex flex-col overflow-hidden rounded border border-[#E2E6EC] bg-[#F7F8FA]"
                    >
                      <div className="relative aspect-square bg-[#F1F3F6]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt={`업로드 미리보기 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === 0 ? (
                          <span className="absolute top-1.5 left-1.5 bg-[#E8521A] text-white text-hb-xs font-bold px-1.5 py-0.5 rounded-sm">
                            대표
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => makePrimaryUploadFile(index)}
                            className="absolute top-1.5 left-1.5 bg-[#141A23]/85 text-white text-hb-xs font-bold px-1.5 py-0.5 rounded-sm hover:bg-[#E8521A]"
                          >
                            대표 지정
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveUploadFile(index)}
                          aria-label="사진 삭제"
                          className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          <Icon d={ICON.close} className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            enhanceUploadFile(index, PRODUCT_IMAGE_TONE_EXTRA)
                          }
                          title="스튜디오 조명 톤업 (밝기+12%, 대비+4%)"
                          aria-label="스튜디오 조명 톤업"
                          className="absolute bottom-1.5 right-8 bg-black/75 hover:bg-[#E8521A] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md transition-colors"
                        >
                          <Icon
                            d={ICON.sparkles}
                            className="w-3.5 h-3.5 text-[#FF8A50]"
                          />
                        </button>
                        {/* 이미지 우하단 퀵 90도 회전 버튼 */}
                        <button
                          type="button"
                          onClick={() => enhanceUploadFile(index, { degrees: 90 })}
                          title="시계방향 90도 회전"
                          aria-label="시계방향 90도 회전"
                          className="absolute bottom-1.5 right-1.5 bg-black/75 hover:bg-[#E8521A] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md transition-colors"
                        >
                          <Icon d={ICON.rotate} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {productCropStates[index] && (
                        <button
                          type="button"
                          onClick={() => toggleUploadFileCrop(index)}
                          title={
                            productCropStates[index]?.active
                              ? "클릭하면 크롭 전 원본 사진으로 복구합니다"
                              : "클릭하면 AI 자동 크롭을 다시 적용합니다"
                          }
                          className={`w-full border-t border-[#E2E6EC] px-1.5 py-1 text-center text-hb-xs font-bold transition-colors ${
                            productCropStates[index]?.active
                              ? "bg-[#FFF4EE] text-[#C84312] hover:bg-[#FADCD0]"
                              : "bg-[#F3F4F6] text-[#4B5260] hover:bg-[#E5E7EB]"
                          }`}
                        >
                          {productCropStates[index]?.active
                            ? productCropStates[index]?.role === "nameplate"
                              ? "명판 크롭 · 원본 복구"
                              : "제품 크롭 · 원본 복구"
                            : "원본 · 크롭 적용"}
                        </button>
                      )}
                      <div className="border-t border-[#E2E6EC] bg-white text-hb-xs font-bold text-[#334155]">
                        <div className="grid grid-cols-2 divide-x divide-[#E2E6EC]">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveUploadFile(index, index - 1)}
                            className="py-1 hover:bg-[#F1F3F6] disabled:opacity-30"
                          >
                            ← 앞으로
                          </button>
                          <button
                            type="button"
                            disabled={index === productPreviews.length - 1}
                            onClick={() => moveUploadFile(index, index + 1)}
                            className="py-1 hover:bg-[#F1F3F6] disabled:opacity-30"
                          >
                            뒤로 →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. AI 분석 결과 구분 리포트 (사진 판독 vs 검색 사양 vs 검토 경고) */}
            {(photoObserved.length > 0 ||
              searchDerivedSpecs.length > 0 ||
              reviewWarnings.length > 0) && (
              <div className="space-y-2.5 rounded-md border border-[#E2E6EC] bg-[#F7F8FA] p-3.5 text-hb-xs">
                {photoObserved.length > 0 && (
                  <div>
                    <p className="font-bold text-[#141A23]">
                      사진에서 직접 판독된 정보
                    </p>
                    <ul className="mt-1 list-disc pl-4 text-[#334155] space-y-0.5">
                      {photoObserved.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {searchDerivedSpecs.length > 0 && (
                  <div className="pt-2 border-t border-[#E2E6EC]">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#141A23]">
                        인터넷 검색으로 보충된 참고 사양
                      </p>
                      <button
                        type="button"
                        onClick={appendSearchSpecsToDescription}
                        className="text-hb-xs font-bold text-[#E8521A] underline"
                      >
                        + 설명란에 반영
                      </button>
                    </div>
                    <ul className="mt-1 list-disc pl-4 text-[#334155] space-y-0.5">
                      {searchDerivedSpecs.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {reviewWarnings.length > 0 && (
                  <div className="rounded border border-amber-300 bg-amber-50 p-2.5 text-amber-950">
                    <p className="font-bold text-amber-900">
                      담당자 육안 확인이 필요한 항목
                    </p>
                    <ul className="mt-1 list-disc pl-4 text-amber-800 space-y-0.5">
                      {reviewWarnings.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {foundSources.length > 0 && (
                  <div className="pt-1 text-hb-xs text-[#64748B]">
                    <span className="font-semibold">참조 출처: </span>
                    {foundSources.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-2 text-blue-700 underline break-all"
                      >
                        [출처 {i + 1}]
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. 카테고리 · 판매 상태 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="gallery-upload-category" className="hb-label">
                  표준 카테고리 *
                </label>
                <select
                  id="gallery-upload-category"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="hb-input mt-1 font-semibold text-hb-sm"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="gallery-upload-status" className="hb-label">
                  판매 상태
                </label>
                <select
                  id="gallery-upload-status"
                  value={productStatus}
                  onChange={(e) => setProductStatus(e.target.value)}
                  className="hb-input mt-1 font-semibold text-hb-sm"
                >
                  <option value={PRODUCT_STATUS.SELLING}>판매중</option>
                  <option value={PRODUCT_STATUS.RESERVED}>예약중</option>
                  <option value={PRODUCT_STATUS.SOLD}>판매완료</option>
                </select>
              </div>
            </div>

            {/* 4. 제품명 및 모델명 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="hb-label">제품명 / 타이틀 *</label>
                <input
                  type="text"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  required
                  className="hb-input mt-1"
                  placeholder="예: 삼성 비스포크 양문형 냉장고 846L"
                />
              </div>
              <div>
                <label className="hb-label">모델명 (확인 시)</label>
                <input
                  type="text"
                  value={productModel}
                  onChange={(e) => setProductModel(e.target.value)}
                  className="hb-input mt-1 font-mono text-hb-sm"
                  placeholder="예: RF85B9111AP"
                />
              </div>
            </div>

            {/* 5. 판매 가격 */}
            <div>
              <label className="hb-label">
                판매 가격 (원){" "}
                <span className="font-normal text-[#64748B]">
                  — 비워두면 맞춤 견적 상담 문구로 표시됩니다
                </span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={
                  productPrice ? Number(productPrice).toLocaleString() : ""
                }
                onChange={(e) =>
                  setProductPrice(e.target.value.replace(/[^0-9]/g, ""))
                }
                className="hb-input mt-1"
                placeholder="예: 450,000"
              />
            </div>

            {/* 6. 상세 설명 */}
            <div>
              <label className="hb-label">상세 설명 및 확인된 사양</label>
              <textarea
                rows={6}
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="hb-input mt-1 font-mono text-hb-sm leading-relaxed resize-y"
                placeholder="[한눈에 보는 제품 정보], [제품 특징], [주요 사양] 핵심 3개 항목 위주로 초안이 자동 입력됩니다."
              />
            </div>
          </div>
          {/* 스크롤 본문 끝 */}

          {/* 하단 고정 액션 바: 스크롤 없이 즉시 클릭 가능 */}
          <div className="p-4 sm:px-6 border-t border-[#E2E6EC] bg-[#F7F8FA] shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-10">
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="hb-btn-outline w-1/3 sm:w-1/4 h-12 text-hb-sm"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={uploadingProduct || isAnalyzing}
                className="hb-btn-primary flex-1 h-12 text-hb-sm font-bold flex items-center justify-center gap-2"
              >
                {uploadingProduct ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>등록 중...</span>
                  </>
                ) : isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI 분석 중...</span>
                  </>
                ) : (
                  <>
                    <Icon d={ICON.check} className="w-4 h-4 text-white" />
                    <span>상품 등록 완료</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
