// 파일 경로: components/admin/admin-storage-guard-bar.tsx
"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { getAdminAuthHeaders } from "../../lib/supabase";
import { formatBytesCompact } from "../../lib/storage-orphan";
import { Icon, ICON } from "../../lib/ui";

interface OrphanPreviewResult {
  scannedCount: number;
  orphanCount: number;
  totalBytes: number;
  skippedTooNewCount: number;
  minAgeHours: number;
  samplePaths: Array<{
    bucket: string;
    path: string;
    sizeBytes: number;
    ageHours: number;
  }>;
}

interface AdminStorageGuardBarProps {
  soldCleanupSummary: { productCount: number; photoCount: number };
  busyActionId: string | null;
  onRunSoldPhotoCleanup: () => void;
}

/**
 * Supabase 무료 1GB Storage 용량 보호 바
 * - 90일+ 판매완료 보조사진 정리 대상 알림 배지 및 원클릭 정리
 * - DB 미연결(고아) Storage 파일 미리보기(Dry-run) 및 안전 일괄 정리
 */
export function AdminStorageGuardBar({
  soldCleanupSummary,
  busyActionId,
  onRunSoldPhotoCleanup,
}: AdminStorageGuardBarProps) {
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<OrphanPreviewResult | null>(null);
  const [showSamples, setShowSamples] = useState(false);

  const handleScanOrphans = async () => {
    if (scanning || deleting) return;
    setScanning(true);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/cleanup-orphan-storage", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dryRun: true, minAgeHours: 24 }),
      });
      const json = (await res.json().catch(() => ({}))) as Partial<OrphanPreviewResult> & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error || "미연결 파일 점검에 실패했습니다.");
      }
      const next: OrphanPreviewResult = {
        scannedCount: json.scannedCount ?? 0,
        orphanCount: json.orphanCount ?? 0,
        totalBytes: json.totalBytes ?? 0,
        skippedTooNewCount: json.skippedTooNewCount ?? 0,
        minAgeHours: json.minAgeHours ?? 24,
        samplePaths: Array.isArray(json.samplePaths) ? json.samplePaths : [],
      };
      setPreview(next);
      setShowSamples(next.orphanCount > 0);
      if (next.orphanCount === 0) {
        toast.success(`총 ${next.scannedCount}개 파일 점검 완료 · 미연결 파일이 없습니다.`);
      } else {
        toast.success(
          `미연결 파일 ${next.orphanCount}개(${formatBytesCompact(next.totalBytes)})를 찾았습니다.`
        );
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "미연결 파일 점검 중 오류가 발생했습니다."
      );
    } finally {
      setScanning(false);
    }
  };

  const handleDeleteOrphans = async () => {
    if (!preview || preview.orphanCount === 0 || scanning || deleting) return;
    const batchCount = Math.min(preview.orphanCount, 100);
    if (
      !confirm(
        `DB와 연결이 끊긴 미연결 파일 ${batchCount}개(총 대상 ${preview.orphanCount}개, 약 ${formatBytesCompact(preview.totalBytes)})를 삭제할까요?\n(최근 ${preview.minAgeHours}시간 이내 업로드된 파일과 현재 등록된 상품·문의 사진은 모두 보호됩니다)`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/cleanup-orphan-storage", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dryRun: false,
          confirmDelete: true,
          minAgeHours: preview.minAgeHours,
          maxDelete: 100,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        deletedCount?: number;
        freedBytes?: number;
        remainingCount?: number;
      };
      if (!res.ok) {
        throw new Error(json.error || "미연결 파일 삭제에 실패했습니다.");
      }

      toast.success(
        `미연결 파일 ${json.deletedCount ?? 0}개(${formatBytesCompact(json.freedBytes ?? 0)})를 정리했습니다.`
      );
      if ((json.remainingCount ?? 0) > 0) {
        await handleScanOrphans();
      } else {
        setPreview({
          scannedCount: Math.max(0, preview.scannedCount - (json.deletedCount ?? 0)),
          orphanCount: 0,
          totalBytes: 0,
          skippedTooNewCount: preview.skippedTooNewCount,
          minAgeHours: preview.minAgeHours,
          samplePaths: [],
        });
        setShowSamples(false);
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "미연결 파일 정리 중 오류가 발생했습니다."
      );
    } finally {
      setDeleting(false);
    }
  };

  const hasSoldAlert = soldCleanupSummary.photoCount > 0;
  const soldBusy = busyActionId === "sold-photo-cleanup";

  return (
    <section
      aria-label="무료 스토리지 용량 보호 도구"
      className={`rounded-xl border px-4 py-3 transition-colors ${
        hasSoldAlert || (preview && preview.orphanCount > 0)
          ? "border-[#E9C9A8] bg-[#FFF9F2]"
          : "border-[#E6E1D9] bg-white"
      }`}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-hb-xs sm:text-hb-sm">
          <span className="inline-flex items-center gap-1.5 font-bold text-[#141A23]">
            <Icon d={ICON.shieldCheck} className="h-4 w-4 text-[#D9531E]" />
            무료 1GB 스토리지 보호
          </span>

          {hasSoldAlert ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E8B88A] bg-[#FFF1E0] px-2.5 py-1 text-hb-xs font-bold text-[#9A420A]">
              90일+ 판매완료 보조사진 {soldCleanupSummary.photoCount}장 (
              {soldCleanupSummary.productCount}건) 정리 가능
            </span>
          ) : (
            <span className="text-hb-xs text-[#6B7280]">
              90일+ 판매완료 정리 대상 없음
            </span>
          )}

          {preview && (
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-hb-xs font-bold ${
                preview.orphanCount > 0
                  ? "border-[#F1B8A5] bg-[#FFF0EA] text-[#C2410C]"
                  : "border-[#C7E2D1] bg-[#F1FAF4] text-[#166534]"
              }`}
            >
              {preview.orphanCount > 0
                ? `미연결 파일 ${preview.orphanCount}개 (${formatBytesCompact(preview.totalBytes)})`
                : `미연결 파일 0개 (${preview.scannedCount}개 정상)`}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasSoldAlert && (
            <button
              type="button"
              onClick={onRunSoldPhotoCleanup}
              disabled={soldBusy || Boolean(busyActionId)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#D9531E] px-3 py-1.5 text-hb-xs font-bold text-white hover:bg-[#B84315] disabled:opacity-50 transition-colors"
            >
              <Icon d={ICON.trash} className="h-3.5 w-3.5" />
              {soldBusy ? "정리 중..." : "90일+ 보조사진 정리"}
            </button>
          )}

          <button
            type="button"
            onClick={handleScanOrphans}
            disabled={scanning || deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4CEC4] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:bg-[#F5F2EC] disabled:opacity-50 transition-colors"
          >
            <Icon d={ICON.search} className="h-3.5 w-3.5" />
            {scanning ? "점검 중..." : "고아 파일 점검(미리보기)"}
          </button>

          {preview && preview.orphanCount > 0 && (
            <button
              type="button"
              onClick={handleDeleteOrphans}
              disabled={scanning || deleting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#141A23] px-3 py-1.5 text-hb-xs font-bold text-white hover:bg-[#2A3342] disabled:opacity-50 transition-colors"
            >
              <Icon d={ICON.trash} className="h-3.5 w-3.5" />
              {deleting
                ? "삭제 중..."
                : `안전 정리 실행 (${Math.min(preview.orphanCount, 100)}개)`}
            </button>
          )}
        </div>
      </div>

      {preview && preview.orphanCount > 0 && (
        <div className="mt-2.5 border-t border-[#EFE5D8] pt-2.5 text-hb-xs text-[#4B5260]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              전체 {preview.scannedCount}개 중 DB 미연결 {preview.orphanCount}개 발견
              (최근 {preview.minAgeHours}시간 이내 업로드 {preview.skippedTooNewCount}
              개는 자동 보호됨)
            </span>
            <button
              type="button"
              onClick={() => setShowSamples((prev) => !prev)}
              className="font-bold text-[#141A23] underline underline-offset-2"
            >
              {showSamples ? "샘플 접기" : "샘플 경로 보기"}
            </button>
          </div>
          {showSamples && preview.samplePaths.length > 0 && (
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {preview.samplePaths.slice(0, 6).map((item) => (
                <li
                  key={`${item.bucket}/${item.path}`}
                  className="flex items-center justify-between gap-2 rounded border border-[#EAE4DB] bg-white px-2.5 py-1 font-mono text-hb-xs text-[#4B5260]"
                >
                  <span className="truncate">
                    {item.bucket}/{item.path}
                  </span>
                  <span className="shrink-0 tabular-nums text-[#6B7280]">
                    {formatBytesCompact(item.sizeBytes)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
