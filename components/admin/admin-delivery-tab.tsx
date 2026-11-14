// 파일 경로: components/admin/admin-delivery-tab.tsx
"use client";

import React from "react";
import { splitImages } from "../../lib/site";
import { SafeImg } from "../../lib/ui";
import type { AdminDeliveryRow } from "./admin-types";

interface AdminDeliveryTabProps {
  analyzingDelivery: boolean;
  savingDelivery: boolean;
  delivObserved: string[];
  delivReviewNotes: string[];
  delivTitle: string;
  setDelivTitle: (title: string) => void;
  deliveryCases: AdminDeliveryRow[];
  onDeliveryFilesChange: React.ChangeEventHandler<HTMLInputElement>;
  onSaveDeliveryCase: React.FormEventHandler<HTMLFormElement>;
  onDeleteDeliveryCase: (id: string, title: string) => void;
}

/** 관리자 페이지 배송·설치 현장 사례 등록/목록 탭 */
export function AdminDeliveryTab({
  analyzingDelivery,
  savingDelivery,
  delivObserved,
  delivReviewNotes,
  delivTitle,
  setDelivTitle,
  deliveryCases,
  onDeliveryFilesChange,
  onSaveDeliveryCase,
  onDeleteDeliveryCase,
}: AdminDeliveryTabProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-12 items-start">
      <section className="rounded-xl border border-[#E2E6EC] bg-white p-5 sm:p-6 lg:col-span-5 space-y-4 shadow-2xs">
        <h2 className="text-hb-lg font-bold text-[#141A23]">
          배송·설치 현장 사례 등록 (AI 제목 보조)
        </h2>
        <p className="text-hb-xs text-[#6B7280]">
          사진에서 확인되는 제품 유형과 설치 상황에 근거해 제목 초안을 생성합니다. 확인 후 수정하여 게시하세요.
        </p>

        <form onSubmit={onSaveDeliveryCase} className="space-y-4">
          <div>
            <label className="hb-label">현장 사진 선택 (최대 5장)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={analyzingDelivery}
              onChange={onDeliveryFilesChange}
              className="mt-1 w-full text-hb-xs"
            />
          </div>

          {(delivObserved.length > 0 || delivReviewNotes.length > 0) && (
            <div className="rounded-lg border border-[#E2E6EC] bg-[#F9FAFB] p-3 text-hb-xs space-y-1.5">
              {delivObserved.length > 0 && (
                <p>
                  <strong>판독된 요소:</strong> {delivObserved.join(", ")}
                </p>
              )}
              {delivReviewNotes.map((n, i) => (
                <p key={i} className="text-amber-800 font-semibold">
                  {n}
                </p>
              ))}
            </div>
          )}

          <div>
            <label className="hb-label">
              배송·설치 사례 제목 (수정 가능) *
            </label>
            <input
              type="text"
              required
              value={delivTitle}
              onChange={(e) => setDelivTitle(e.target.value)}
              placeholder="사진 첨부 시 AI가 초안을 작성합니다"
              className="hb-input mt-1"
            />
          </div>

          <button
            type="submit"
            disabled={savingDelivery || analyzingDelivery}
            className="hb-btn-primary h-11 w-full text-hb-sm"
          >
            {savingDelivery ? "등록 중..." : "제목 확인 완료 및 게시하기"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-[#E2E6EC] bg-white p-5 sm:p-6 lg:col-span-7 space-y-4 shadow-2xs">
        <h2 className="text-hb-lg font-bold text-[#141A23]">
          등록된 배송·설치 사례 ({deliveryCases.length}건)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {deliveryCases.map((item) => {
            const imgs = splitImages(item.image_url);
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-[#E2E6EC] p-3"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-[#F1F3F6]">
                  <SafeImg
                    src={imgs[0]}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-hb-sm font-bold text-[#141A23]">
                    {item.title}
                  </p>
                  <p className="text-hb-xs text-[#64748B]">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString("ko-KR")
                      : "-"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteDeliveryCase(item.id, item.title)}
                  className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-hb-xs font-bold text-red-600"
                >
                  삭제
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
