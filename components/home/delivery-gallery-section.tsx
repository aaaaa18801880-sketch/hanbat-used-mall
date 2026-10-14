"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { supabase, getAdminAuthHeaders } from "../../lib/supabase";
import {
  compressImage,
  MAX_FILE_MB,
  MAX_REVIEW_PHOTOS,
  splitImages,
  STORAGE_BUCKETS,
  STORE,
} from "../../lib/site";
import { Icon, ICON, Modal, SafeImg, SectionHeading } from "../../lib/ui";

export type DeliveryReview = {
  id: string | number;
  title: string | null;
  image_url: string | null;
  created_at: string;
};

const formatShortDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

export function DeliveryGallerySection({
  reviews,
  loading,
  isAdmin,
  onReload,
}: {
  reviews: DeliveryReview[];
  loading: boolean;
  isAdmin: boolean;
  onReload: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [lightbox, setLightbox] = useState<{
    review: DeliveryReview;
    index: number;
  } | null>(null);

  /* 관리자 등록 모달 상태 */
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const visibleReviews = showAll ? reviews : reviews.slice(0, 6);
  const lbImages = lightbox ? splitImages(lightbox.review.image_url) : [];

  const moveLightbox = useCallback((step: number) => {
    setLightbox((prev) => {
      if (!prev) return null;
      const imgs = splitImages(prev.review.image_url);
      if (imgs.length === 0) return prev;
      return {
        ...prev,
        index: (prev.index + step + imgs.length) % imgs.length,
      };
    });
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") moveLightbox(-1);
      if (e.key === "ArrowRight") moveLightbox(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, moveLightbox]);

  const closeUploadModal = useCallback(() => {
    setModalOpen(false);
    setTitle("");
    setFiles([]);
    setPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
    setAnalyzing(false);
  }, []);

  const analyzeDeliveryPhoto = async (targetFiles: File[]) => {
    if (targetFiles.length === 0) return;
    setAnalyzing(true);
    const toastId = toast.loading("AI가 현장 사진을 분석하여 제목을 생성 중입니다...");
    try {
      const formData = new FormData();
      for (const file of targetFiles.slice(0, 2)) {
        const blob = await compressImage(file);
        formData.append(
          "files",
          new File([blob], file.name, { type: "image/jpeg" })
        );
      }
      const authHeaders = await getAdminAuthHeaders();
      const res = await fetch("/api/analyze-delivery", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분석 실패");
      if (data.title) {
        setTitle(data.title);
        toast.success("배송·설치 제목이 자동 입력되었습니다.", { id: toastId });
      }
    } catch {
      toast.error("자동 제목 생성 실패. 직접 입력해 주세요.", { id: toastId });
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePickFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list).filter(
      (f) => f.type.startsWith("image/") && f.size <= MAX_FILE_MB * 1024 * 1024
    );
    const merged = [...files, ...picked].slice(0, MAX_REVIEW_PHOTOS);
    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles(merged);
    setPreviews(merged.map((f) => URL.createObjectURL(f)));

    if (!title.trim() && merged.length > 0) {
      analyzeDeliveryPhoto(merged);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("제목을 입력해 주세요.");
    if (files.length === 0) return toast.error("사진을 1장 이상 선택해 주세요.");

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const blob = await compressImage(f, 1600, 0.82);
        const fileName = `delivery_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .upload(fileName, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        urls.push(
          supabase.storage.from(STORAGE_BUCKETS.inquiries).getPublicUrl(fileName)
            .data.publicUrl
        );
      }

      const { error } = await supabase.from("products").insert({
        title: title.trim(),
        category: "배송인증",
        image_url: urls.join(","),
        price: 0,
        status: "판매중",
      });
      if (error) throw error;

      toast.success("배송·설치 사례가 등록되었습니다.");
      closeUploadModal();
      onReload();
    } catch {
      toast.error("등록 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: DeliveryReview["id"]) => {
    if (!confirm("이 배송·설치 인증 사진을 삭제하시겠습니까?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("삭제되었습니다.");
      onReload();
    } catch {
      toast.error("삭제하지 못했습니다.");
    }
  };

  return (
    <section
      id="reviews-section"
      aria-labelledby="delivery-heading"
      className="border-b border-[#E4E0D8] bg-white py-16 sm:py-20 lg:py-24"
    >
      <div className="hb-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Delivery & Installation"
            title={<span id="delivery-heading">배송 · 설치 현장 기록</span>}
            desc="단순 택배 발송이 아닌, 전문 기사님이 직접 현장에 운반하여 수평 맞춤과 배관·전원 연결까지 마친 실제 사례입니다."
          />

          <div className="flex items-center gap-3">
            {reviews.length > 0 && (
              <span className="text-[13.5px] font-semibold text-[#6B7280]">
                누적 현장 기록 <strong className="text-[#0E1A2B]">{reviews.length}</strong>건
              </span>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="hb-btn-primary h-10 px-4 text-[13.5px]"
              >
                <Icon d={ICON.plus} className="w-4 h-4" /> 인증사진 등록
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div
            className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3"
            aria-hidden="true"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] animate-pulse rounded-md bg-[#EFECE6]"
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-8 sm:flex-row sm:items-center">
            <div>
              <p className="text-[16px] font-bold text-[#0E1A2B]">
                배송·설치 현장 사진을 업데이트하고 있습니다.
              </p>
              <p className="mt-1 text-[14px] text-[#4B5260]">
                원하시는 지역의 배송 및 설치 가능 여부는 카카오톡이나 전화로 문의해 주시면 즉시 안내해 드립니다.
              </p>
            </div>
            <a
              href={STORE.kakaoChat}
              target="_blank"
              rel="noopener noreferrer"
              className="hb-btn-kakao h-11 px-5 text-[14px] shrink-0"
            >
              <Icon d={ICON.chat} className="w-4 h-4" /> 카카오톡 문의
            </a>
          </div>
        ) : (
          <>
            <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleReviews.map((item) => {
                const imgs = splitImages(item.image_url);
                return (
                  <li
                    key={item.id}
                    className="group relative flex flex-col overflow-hidden rounded-md border border-[#E4E0D8] bg-[#FAF9F7] transition-all hover:border-[#0E1A2B]/40 hover:shadow-card"
                  >
                    <button
                      type="button"
                      onClick={() => setLightbox({ review: item, index: 0 })}
                      className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFECE6] text-left"
                      aria-label={`${item.title || "배송·설치 사례"} 사진 크게 보기`}
                    >
                      <SafeImg
                        src={imgs[0]}
                        alt={item.title || "배송·설치 현장 사진"}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                      {imgs.length > 1 && (
                        <span className="absolute right-2.5 top-2.5 rounded-sm bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white">
                          +{imgs.length - 1}장
                        </span>
                      )}
                    </button>

                    <div className="flex items-center justify-between gap-3 p-4 bg-white">
                      <p className="line-clamp-1 text-[14.5px] font-bold text-[#0E1A2B]">
                        {item.title || "배송 및 설치 완료"}
                      </p>
                      <span className="shrink-0 text-[12px] text-[#8A8478]">
                        {formatShortDate(item.created_at)}
                      </span>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="absolute left-2.5 top-2.5 rounded-sm bg-white/95 px-2.5 py-1 text-[11px] font-bold text-red-600 shadow"
                      >
                        삭제
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {reviews.length > 6 && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="hb-btn-outline h-11 px-7 text-[14px]"
                >
                  <span>
                    {showAll
                      ? "배송·설치 사례 접기"
                      : `현장 사례 ${reviews.length - 6}건 더 보기`}
                  </span>
                  <Icon
                    d={ICON.down}
                    className={`w-4 h-4 transition-transform ${
                      showAll ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 라이트박스 모달 */}
      {lightbox && (
        <Modal
          open={!!lightbox}
          onClose={() => setLightbox(null)}
          label="배송·설치 사진 확대 보기"
          panelClassName="max-w-4xl"
        >
          <div className="relative flex flex-col rounded-lg bg-[#0B1522] p-4 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-bold">{lightbox.review.title}</p>
                <p className="text-[12px] text-white/60">
                  {formatShortDate(lightbox.review.created_at)}
                  {lbImages.length > 1 &&
                    ` · ${lightbox.index + 1} / ${lbImages.length}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="닫기"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <Icon d={ICON.close} className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex items-center justify-center bg-black/40 rounded min-h-[320px] max-h-[76vh] overflow-hidden">
              <SafeImg
                src={lbImages[lightbox.index]}
                alt={lightbox.review.title || "현장 사진"}
                eager
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
              {lbImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => moveLightbox(-1)}
                    aria-label="이전 사진"
                    className="absolute left-3 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <Icon d={ICON.left} className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLightbox(1)}
                    aria-label="다음 사진"
                    className="absolute right-3 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <Icon d={ICON.right} className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* 관리자용 인증사진 등록 모달 */}
      {modalOpen && (
        <Modal
          open={modalOpen}
          onClose={closeUploadModal}
          label="배송·설치 인증사진 등록"
          panelClassName="max-w-lg"
        >
          <form
            onSubmit={handleUploadSubmit}
            className="w-full rounded-lg border border-[#E4E0D8] bg-white p-6 sm:p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#0E1A2B]">
                배송·설치 인증사진 등록
              </h3>
              <button
                type="button"
                onClick={closeUploadModal}
                aria-label="닫기"
                className="grid h-8 w-8 place-items-center text-[#6B7280]"
              >
                <Icon d={ICON.close} className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <label htmlFor="delivery-title" className="hb-label">
                사례 제목
              </label>
              {analyzing && (
                <span className="text-[12px] font-bold text-[#D9531E] animate-pulse">
                  AI 제목 자동 생성 중...
                </span>
              )}
            </div>
            <input
              id="delivery-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="사진 첨부 시 AI가 제목을 자동 작성합니다"
              className="hb-input mt-1.5"
            />

            <p className="hb-label mt-4">
              현장 사진 (최대 {MAX_REVIEW_PHOTOS}장)
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {previews.map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-square overflow-hidden rounded border border-[#DDD9D1] bg-[#EFECE6]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`선택 사진 ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(src);
                      setFiles((f) => f.filter((_, idx) => idx !== i));
                      setPreviews((p) => p.filter((_, idx) => idx !== i));
                    }}
                    aria-label="사진 삭제"
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/65 text-white"
                  >
                    <Icon d={ICON.close} className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {files.length < MAX_REVIEW_PHOTOS && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded border border-dashed border-[#CFCAC0] text-[#8A8478] hover:border-[#0E1A2B] hover:text-[#0E1A2B]">
                  <Icon d={ICON.plus} className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={analyzing}
                    className="sr-only"
                    onChange={(e) => {
                      handlePickFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading || analyzing}
              className="hb-btn-primary mt-6 h-12 w-full text-[15px]"
            >
              {uploading ? "등록 중..." : "인증사진 등록하기"}
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}
