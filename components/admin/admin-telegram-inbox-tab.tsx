// 파일 경로: components/admin/admin-telegram-inbox-tab.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { getAdminAuthHeaders } from "../../lib/supabase";
import { ICON, Icon } from "../../lib/icons";
import {
  buildInboxGroups,
  canCommitInboxGroup,
  mergeInboxGroupWithPrevious,
  pairInboxPhotosByFixedSize,
  removePhotoFromInboxGroups,
  splitInboxGroupBeforePhoto,
  TELEGRAM_MAX_PHOTOS_PER_PRODUCT,
  TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT,
  type TelegramGroupKeyOnlyUpdate,
  type TelegramInboxGroup,
  type TelegramInboxPhoto,
} from "../../lib/telegram-inbox";
import {
  createTelegramThumbStore,
  TelegramFullPreviewModal,
  TelegramThumbTile,
} from "./telegram-inbox-media";

interface TelegramEnvStatus {
  botConfigured: boolean;
  ingestChatConfigured: boolean;
  webhookSecretConfigured: boolean;
}

interface CleanupSummary {
  productCount: number;
  photoCount: number;
}

interface AdminTelegramInboxTabProps {
  onPendingCountChange?: (count: number) => void;
  onCleanupSummaryChange?: (summary: CleanupSummary) => void;
  onProductsChanged?: () => Promise<void> | void;
  onJumpToPendingReview?: () => void;
}

const AI_GROUP_CHUNK_SIZE = 16;
const GROUPS_PER_PAGE = 20;

function formatGroupTimeRange(group: TelegramInboxGroup): string {
  const formatOne = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };
  const from = formatOne(group.takenFrom);
  const to = formatOne(group.takenTo);
  return from === to ? from : `${from} ~ ${to}`;
}

/**
 * 텔레그램 사진 수집함 관리자 탭
 * - 경량 320px 썸네일 프록시 + AI 제품 묶음 + 클릭 1번 [나누기/합치기/제외] + 순차 일괄 등록 큐
 */
export function AdminTelegramInboxTab({
  onPendingCountChange,
  onCleanupSummaryChange,
  onProductsChanged,
  onJumpToPendingReview,
}: AdminTelegramInboxTabProps) {
  const [photos, setPhotos] = useState<TelegramInboxPhoto[]>([]);
  const [envStatus, setEnvStatus] = useState<TelegramEnvStatus | null>(null);
  const [cleanupSummary, setCleanupSummary] = useState<CleanupSummary>({
    productCount: 0,
    photoCount: 0,
  });
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [persistingOp, setPersistingOp] = useState(false);
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(false);
  const [registeringWebhook, setRegisteringWebhook] = useState(false);
  const [setupInfo, setSetupInfo] = useState<{
    webhookUrl: string | null;
    expectedWebhookUrl?: string;
    pendingUpdateCount: number;
    lastErrorMessage: string | null;
    recentChats: Array<{ chatId: string; title: string; type: string }>;
  } | null>(null);

  const [deselectedKeys, setDeselectedKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [failedByGroup, setFailedByGroup] = useState<Record<string, string>>({});
  const [committedCount, setCommittedCount] = useState(0);
  const [inspectingPhoto, setInspectingPhoto] =
    useState<TelegramInboxPhoto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [thumbStore] = useState(() => createTelegramThumbStore());

  useEffect(() => {
    return () => {
      thumbStore.revokeAll();
    };
  }, [thumbStore]);

  const [groupingProgress, setGroupingProgress] = useState({
    active: false,
    done: 0,
    total: 0,
    note: "",
  });

  const [commitProgress, setCommitProgress] = useState({
    active: false,
    done: 0,
    total: 0,
    success: 0,
    currentLabel: "",
  });

  const abortCommitRef = useRef(false);

  const fetchInbox = useCallback(async () => {
    const headers = await getAdminAuthHeaders();
    const res = await fetch("/api/admin/telegram-inbox", {
      headers,
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      photos?: TelegramInboxPhoto[];
      envStatus?: TelegramEnvStatus;
      cleanupSummary?: CleanupSummary;
      migrationRequired?: boolean;
      error?: string;
    };

    if (!res.ok) {
      throw new Error(json.error || "수집함을 불러오지 못했습니다.");
    }

    const nextPhotos = Array.isArray(json.photos) ? json.photos : [];
    const nextCleanup = json.cleanupSummary ?? {
      productCount: 0,
      photoCount: 0,
    };

    setPhotos(nextPhotos);
    setEnvStatus(json.envStatus ?? null);
    setCleanupSummary(nextCleanup);
    setMigrationRequired(Boolean(json.migrationRequired));
    setLoadError(json.error || "");
    onPendingCountChange?.(nextPhotos.length);
    onCleanupSummaryChange?.(nextCleanup);
  }, [onCleanupSummaryChange, onPendingCountChange]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await fetchInbox();
      } catch (err: unknown) {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : "수집함을 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [fetchInbox]);

  const handleManualRefresh = async () => {
    setLoading(true);
    setLoadError("");
    try {
      await fetchInbox();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "수집함 새로고침에 실패했습니다.";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const groups = useMemo(() => buildInboxGroups(photos), [photos]);

  const eligibleGroups = useMemo(
    () => groups.filter((g) => canCommitInboxGroup(g).allowed),
    [groups]
  );

  const oversizedGroups = useMemo(
    () => groups.filter((g) => !canCommitInboxGroup(g).allowed),
    [groups]
  );

  const selectedGroups = useMemo(
    () => eligibleGroups.filter((g) => !deselectedKeys.has(g.groupKey)),
    [deselectedKeys, eligibleGroups]
  );

  const badNotePhotos = useMemo(
    () => photos.filter((p) => Boolean(p.ai_note)),
    [photos]
  );

  const totalPages = showAllGroups
    ? 1
    : Math.max(1, Math.ceil(groups.length / GROUPS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStartIdx = showAllGroups ? 0 : (safePage - 1) * GROUPS_PER_PAGE;
  const visibleGroups = useMemo(
    () =>
      showAllGroups
        ? groups
        : groups.slice(pageStartIdx, pageStartIdx + GROUPS_PER_PAGE),
    [groups, pageStartIdx, showAllGroups]
  );

  const visibleSelectedGroups = useMemo(
    () =>
      visibleGroups.filter(
        (g) => canCommitInboxGroup(g).allowed && !deselectedKeys.has(g.groupKey)
      ),
    [deselectedKeys, visibleGroups]
  );

  const isBusy =
    loading ||
    persistingOp ||
    groupingProgress.active ||
    commitProgress.active;

  const persistUpdates = async (
    updates: readonly TelegramGroupKeyOnlyUpdate[]
  ) => {
    if (updates.length === 0) return;
    const headers = await thumbStore.getAuthHeaders();
    const res = await fetch("/api/admin/telegram-inbox", {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ updates }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      throw new Error(json.error || "묶음 변경 저장에 실패했습니다.");
    }
  };

  const handlePairFixedTwo = async () => {
    if (isBusy || photos.length === 0) return;
    const prevPhotos = photos;
    const paired = pairInboxPhotosByFixedSize(
      photos,
      TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT
    );
    setPhotos(paired.photos);
    setDeselectedKeys(new Set());
    setCurrentPage(1);
    setPersistingOp(true);
    try {
      await persistUpdates(paired.updates);
      toast.success(
        `${photos.length}장을 2장씩 ${paired.groupCount}개 묶음으로 즉시 나눴습니다 (AI 비용 0원).`
      );
    } catch (err: unknown) {
      setPhotos(prevPhotos);
      toast.error(
        err instanceof Error
          ? err.message
          : "2장씩 즉시 묶기 저장에 실패했습니다."
      );
    } finally {
      setPersistingOp(false);
    }
  };

  const handleSplitBefore = async (photoId: string) => {
    if (isBusy) return;
    const res = splitInboxGroupBeforePhoto(groups, photoId);
    if (!res.changed) return;

    const prevPhotos = photos;
    setPhotos(res.groups.flatMap((g) => g.photos));
    setPersistingOp(true);
    try {
      await persistUpdates(res.changedUpdates);
      toast.success("제품 묶음을 분리했습니다.");
    } catch (err: unknown) {
      setPhotos(prevPhotos);
      toast.error(
        err instanceof Error ? err.message : "묶음 분리에 실패했습니다."
      );
    } finally {
      setPersistingOp(false);
    }
  };

  const handleMergeWithPrevious = async (groupIndex: number) => {
    if (isBusy) return;
    const res = mergeInboxGroupWithPrevious(groups, groupIndex);
    if (!res.changed) return;

    const prevPhotos = photos;
    setPhotos(res.groups.flatMap((g) => g.photos));
    setPersistingOp(true);
    try {
      await persistUpdates(res.changedUpdates);
      toast.success("앞 묶음과 합쳤습니다.");
    } catch (err: unknown) {
      setPhotos(prevPhotos);
      toast.error(
        err instanceof Error ? err.message : "묶음 합치기에 실패했습니다."
      );
    } finally {
      setPersistingOp(false);
    }
  };

  const handleDiscardPhotos = async (ids: string[], confirmMsg?: string) => {
    if (isBusy || ids.length === 0) return;
    if (confirmMsg && !confirm(confirmMsg)) return;

    const prevPhotos = photos;
    let nextGroups = groups;
    for (const id of ids) {
      nextGroups = removePhotoFromInboxGroups(nextGroups, id);
    }
    const nextPhotos = nextGroups.flatMap((g) => g.photos);
    setPhotos(nextPhotos);
    onPendingCountChange?.(nextPhotos.length);
    setPersistingOp(true);

    try {
      const headers = await thumbStore.getAuthHeaders();
      const res = await fetch("/api/admin/telegram-inbox", {
        method: "DELETE",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || "사진 제외 처리에 실패했습니다.");
      }
      for (const id of ids) {
        thumbStore.revoke(id);
      }
      toast.success(
        ids.length === 1
          ? "선택한 사진을 수집함에서 제외했습니다."
          : `${ids.length}장을 수집함에서 제외했습니다.`
      );
    } catch (err: unknown) {
      setPhotos(prevPhotos);
      onPendingCountChange?.(prevPhotos.length);
      toast.error(
        err instanceof Error ? err.message : "사진 제외에 실패했습니다."
      );
    } finally {
      setPersistingOp(false);
    }
  };

  const handleRunAiGrouping = async () => {
    if (isBusy || photos.length === 0) return;
    const totalBatches = Math.max(1, Math.ceil(photos.length / AI_GROUP_CHUNK_SIZE));

    setGroupingProgress({
      active: true,
      done: 0,
      total: totalBatches,
      note: `총 ${photos.length}장을 기본 ${TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT}장(최대 ${TELEGRAM_MAX_PHOTOS_PER_PRODUCT}장) 단위로 분석 중입니다...`,
    });

    try {
      const headers = await getAdminAuthHeaders();
      let cursor = 0;
      let carryIds: string[] = [];
      let batchIdx = 0;

      while (cursor < photos.length) {
        const nextSlice = photos.slice(cursor, cursor + AI_GROUP_CHUNK_SIZE);
        cursor += nextSlice.length;

        const batchPhotoIds = Array.from(
          new Set([...carryIds, ...nextSlice.map((p) => p.id)])
        );

        const res = await fetch("/api/admin/telegram-inbox/group", {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ photoIds: batchPhotoIds }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
          lastGroupPhotoIds?: string[];
        };
        if (!res.ok) {
          throw new Error(
            json.error || `AI 자동 묶음 ${batchIdx + 1}번째 배치 실패`
          );
        }

        const tailIds = Array.isArray(json.lastGroupPhotoIds)
          ? json.lastGroupPhotoIds
          : [];
        carryIds =
          cursor < photos.length && tailIds.length >= 1 && tailIds.length <= 2
            ? tailIds
            : [];

        batchIdx++;
        setGroupingProgress({
          active: true,
          done: Math.min(batchIdx, totalBatches),
          total: totalBatches,
          note: `AI 묶음 배치 ${batchIdx}/${totalBatches} 완료`,
        });
      }

      await fetchInbox();
      setDeselectedKeys(new Set());
      toast.success(
        `AI 자동 묶음이 완료되었습니다 (기본 ${TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT}장 · 최대 ${TELEGRAM_MAX_PHOTOS_PER_PRODUCT}장 단위).`
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "AI 자동 묶음 중 오류가 발생했습니다."
      );
    } finally {
      setGroupingProgress({ active: false, done: 0, total: 0, note: "" });
    }
  };

  const runCommitQueue = async (targetGroups: readonly TelegramInboxGroup[]) => {
    const validTargets = targetGroups.filter((g) => canCommitInboxGroup(g).allowed);
    if (isBusy || validTargets.length === 0) return;

    abortCommitRef.current = false;
    setCommitProgress({
      active: true,
      done: 0,
      total: validTargets.length,
      success: 0,
      currentLabel: "순차 등록을 준비 중입니다...",
    });

    const nextFailures: Record<string, string> = { ...failedByGroup };
    const committedPhotoIdSet = new Set<string>();
    let successCount = 0;

    const headers = await getAdminAuthHeaders();

    for (let i = 0; i < validTargets.length; i++) {
      if (abortCommitRef.current) {
        toast("나머지 일괄 등록이 중단되었습니다.");
        break;
      }

      const grp = validTargets[i];
      const commitIds = grp.photos.map((p) => p.id);
      setCommitProgress({
        active: true,
        done: i,
        total: validTargets.length,
        success: successCount,
        currentLabel: `${i + 1}/${validTargets.length}번째 묶음 (${commitIds.length}장) 처리 중...`,
      });

      try {
        const res = await fetch("/api/admin/telegram-inbox/commit", {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ photoIds: commitIds }),
        });

        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
          committedPhotoIds?: string[];
        };

        if (!res.ok) {
          throw new Error(json.error || `등록 실패 (${res.status})`);
        }

        delete nextFailures[grp.groupKey];
        for (const cid of json.committedPhotoIds ?? commitIds) {
          committedPhotoIdSet.add(cid);
        }
        successCount++;
      } catch (err: unknown) {
        nextFailures[grp.groupKey] =
          err instanceof Error
            ? err.message
            : "등록 처리 중 알 수 없는 오류";
      }

      setCommitProgress({
        active: true,
        done: i + 1,
        total: validTargets.length,
        success: successCount,
        currentLabel: `${i + 1}/${validTargets.length} 처리 완료`,
      });
    }

    setFailedByGroup(nextFailures);

    if (committedPhotoIdSet.size > 0) {
      for (const cid of committedPhotoIdSet) {
        thumbStore.revoke(cid);
      }
      const remaining = photos.filter((p) => !committedPhotoIdSet.has(p.id));
      setPhotos(remaining);
      onPendingCountChange?.(remaining.length);
      setCommittedCount((prev) => prev + successCount);
      await onProductsChanged?.();
    }

    const failedCount = validTargets.filter(
      (g) => Boolean(nextFailures[g.groupKey])
    ).length;

    if (successCount > 0 && failedCount === 0) {
      toast.success(
        `${successCount}개 묶음이 [검수대기(비공개)]로 등록되었습니다. 가격 입력 후 공개해 주세요.`
      );
    } else if (successCount > 0) {
      toast.error(
        `${successCount}건 등록 완료, ${failedCount}건 실패했습니다. 실패 카드에서 재시도하세요.`
      );
    } else if (failedCount > 0) {
      toast.error("일괄 등록에 실패했습니다. 오류 메시지를 확인해 주세요.");
    }

    setCommitProgress({
      active: false,
      done: 0,
      total: 0,
      success: 0,
      currentLabel: "",
    });
  };

  const handleRunSoldCleanup = async () => {
    if (runningCleanup || cleanupSummary.photoCount === 0) return;
    if (
      !confirm(
        `판매완료 후 90일이 지난 ${cleanupSummary.productCount}개 매물의 보조사진 ${cleanupSummary.photoCount}장을 정리할까요?\n(대표 1번 사진은 보존됩니다)`
      )
    ) {
      return;
    }

    setRunningCleanup(true);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/cleanup-sold-photos", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dryRun: false, minAgeDays: 90 }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        cleanedProductCount?: number;
        deletedFileCount?: number;
      };
      if (!res.ok) {
        throw new Error(json.error || "보조사진 정리에 실패했습니다.");
      }

      toast.success(
        `${json.cleanedProductCount ?? 0}건의 오래된 판매완료 보조사진(${json.deletedFileCount ?? 0}장)을 정리했습니다.`
      );
      await fetchInbox();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "보조사진 정리에 실패했습니다."
      );
    } finally {
      setRunningCleanup(false);
    }
  };

  const handleInspectSetup = async () => {
    if (checkingSetup) return;
    setCheckingSetup(true);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/telegram-inbox/setup", {
        headers,
        cache: "no-store",
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        webhookUrl?: string | null;
        expectedWebhookUrl?: string;
        pendingUpdateCount?: number;
        lastErrorMessage?: string | null;
        recentChats?: Array<{ chatId: string; title: string; type: string }>;
      };
      if (!res.ok) {
        throw new Error(json.error || "텔레그램 연동 상태 확인에 실패했습니다.");
      }
      setSetupInfo({
        webhookUrl: json.webhookUrl ?? null,
        expectedWebhookUrl: json.expectedWebhookUrl,
        pendingUpdateCount: json.pendingUpdateCount ?? 0,
        lastErrorMessage: json.lastErrorMessage ?? null,
        recentChats: Array.isArray(json.recentChats) ? json.recentChats : [],
      });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "텔레그램 연동 상태 조회 중 오류가 발생했습니다."
      );
    } finally {
      setCheckingSetup(false);
    }
  };

  const handleRegisterWebhook = async () => {
    if (registeringWebhook) return;
    setRegisteringWebhook(true);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/telegram-inbox/setup", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "register_webhook" }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        webhookUrl?: string;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(json.error || "웹훅 자동 등록에 실패했습니다.");
      }
      toast.success(json.message || "텔레그램 웹훅이 등록되었습니다.");
      await handleInspectSetup();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "웹훅 등록에 실패했습니다."
      );
    } finally {
      setRegisteringWebhook(false);
    }
  };

  const envIncomplete =
    envStatus &&
    (!envStatus.botConfigured ||
      !envStatus.ingestChatConfigured ||
      !envStatus.webhookSecretConfigured);

  return (
    <section
      aria-label="텔레그램 사진 수집함"
      className="space-y-5"
    >
      {/* 환경/DB 설정 안내 배너 */}
      {(migrationRequired || envIncomplete || loadError) && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2 text-hb-xs text-amber-950">
          <p className="font-bold text-hb-sm">
            텔레그램 수집함 초기 연동 점검 필요
          </p>
          {loadError && <p className="text-red-700 font-semibold">{loadError}</p>}
          {envStatus && (
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-2.5 py-1 font-bold border ${
                  envStatus.botConfigured
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-red-300 bg-white text-red-700"
                }`}
              >
                TELEGRAM_BOT_TOKEN {envStatus.botConfigured ? "연결됨" : "미설정"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 font-bold border ${
                  envStatus.ingestChatConfigured
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-red-300 bg-white text-red-700"
                }`}
              >
                TELEGRAM_INGEST_CHAT_ID{" "}
                {envStatus.ingestChatConfigured ? "연결됨" : "미설정"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 font-bold border ${
                  envStatus.webhookSecretConfigured
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-red-300 bg-white text-red-700"
                }`}
              >
                TELEGRAM_WEBHOOK_SECRET{" "}
                {envStatus.webhookSecretConfigured ? "연결됨" : "미설정"}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={checkingSetup || !envStatus?.botConfigured}
              onClick={handleInspectSetup}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#141A23] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:bg-[#141A23] hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <Icon d={ICON.search} className="w-3.5 h-3.5" />
              <span>
                {checkingSetup
                  ? "조회 중..."
                  : "전용방 ID 찾기 · 웹훅 상태 조회"}
              </span>
            </button>

            <button
              type="button"
              disabled={
                registeringWebhook ||
                !envStatus?.botConfigured ||
                !envStatus?.webhookSecretConfigured
              }
              onClick={handleRegisterWebhook}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8521A] px-3 py-1.5 text-hb-xs font-bold text-white hover:bg-[#D9531E] disabled:opacity-40 cursor-pointer"
            >
              <Icon d={ICON.link} className="w-3.5 h-3.5" />
              <span>
                {registeringWebhook ? "등록 중..." : "웹훅 원클릭 자동 등록"}
              </span>
            </button>
          </div>
        </div>
      )}

      {setupInfo && (
        <div className="rounded-xl border border-[#CBD2DC] bg-white p-4 space-y-2.5 text-hb-xs text-[#141A23] shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-hb-sm">텔레그램 웹훅 · 방 ID 진단 결과</p>
            <button
              type="button"
              onClick={() => setSetupInfo(null)}
              className="text-hb-xs font-semibold text-[#6B7280] hover:text-[#141A23] cursor-pointer"
            >
              닫기
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              현재 웹훅 URL:{" "}
              <strong className="break-all">
                {setupInfo.webhookUrl || "미등록"}
              </strong>{" "}
              {setupInfo.pendingUpdateCount > 0 &&
                `(대기 업데이트 ${setupInfo.pendingUpdateCount}건)`}
            </p>
            <button
              type="button"
              disabled={
                registeringWebhook ||
                !envStatus?.botConfigured ||
                !envStatus?.webhookSecretConfigured
              }
              onClick={handleRegisterWebhook}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8521A] px-3 py-1.5 text-hb-xs font-bold text-white hover:bg-[#D9531E] disabled:opacity-40 cursor-pointer"
            >
              <Icon d={ICON.link} className="w-3.5 h-3.5" />
              <span>
                {registeringWebhook
                  ? "등록 중..."
                  : setupInfo.webhookUrl
                  ? "웹훅 다시 등록"
                  : "웹훅 원클릭 자동 등록"}
              </span>
            </button>
          </div>

          {setupInfo.lastErrorMessage && (
            <p className="text-red-700 font-semibold">
              최근 텔레그램 전송 오류: {setupInfo.lastErrorMessage}
            </p>
          )}

          {setupInfo.recentChats.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              <p className="font-bold text-[#374151]">
                최근 감지된 텔레그램 방/채널 (Chat ID 복사 가능):
              </p>
              <ul className="divide-y divide-[#E2E6EC] rounded-lg border border-[#E2E6EC] bg-[#F9FAFB]">
                {setupInfo.recentChats.map((chat) => (
                  <li
                    key={chat.chatId}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                  >
                    <span>
                      <strong>{chat.title}</strong> ({chat.type}) · ID:{" "}
                      <code className="rounded bg-white px-1.5 py-0.5 border border-[#E2E6EC]">
                        {chat.chatId}
                      </code>
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(chat.chatId);
                          toast.success(`Chat ID (${chat.chatId}) 복사 완료`);
                        } catch {
                          toast.error("복사에 실패했습니다.");
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded border border-[#CBD2DC] bg-white px-2.5 py-1 text-hb-xs font-bold hover:border-[#141A23] cursor-pointer"
                    >
                      <Icon d={ICON.copy} className="w-3.5 h-3.5" />
                      <span>ID 복사</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            !setupInfo.webhookUrl && (
              <p className="text-[#6B7280]">
                감지된 최근 채팅이 없습니다. 전용 채널에 봇을 [관리자]로 추가한 뒤 사진 또는 메시지 1개를 올리고 다시 조회하세요.
              </p>
            )
          )}
        </div>
      )}

      {/* 상단 액션 툴바 */}
      <div className="rounded-xl border border-[#E2E6EC] bg-white p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-hb-lg font-bold text-[#141A23]">
              텔레그램 사진 수집함
            </h2>
            <p className="mt-0.5 text-hb-xs text-[#6B7280]">
              수집 단계는 file_id만 보관해 용량 0바이트를 유지하며, 선택한 묶음만 1440px 고화질 WebP로 변환해 [검수대기] 상품으로 저장합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-[#E2E6EC] bg-[#F9FAFB] px-3 py-1.5 text-hb-xs font-bold text-[#141A23] tabular-nums">
              대기 사진 {photos.length}장 · 묶음 {groups.length}개
            </span>
            <button
              type="button"
              disabled={checkingSetup || !envStatus?.botConfigured}
              onClick={handleInspectSetup}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD2DC] bg-white px-3 py-2 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] disabled:opacity-40 cursor-pointer"
            >
              <Icon d={ICON.search} className="w-3.5 h-3.5" />
              <span>연동 점검</span>
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleManualRefresh}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD2DC] bg-white px-3 py-2 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] disabled:opacity-40 cursor-pointer"
            >
              <Icon d={ICON.rotate} className="w-3.5 h-3.5" />
              <span>새로고침</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[#E2E6EC] pt-3">
          <button
            type="button"
            disabled={isBusy || photos.length === 0}
            onClick={handlePairFixedTwo}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-hb-xs font-bold disabled:opacity-40 transition-colors cursor-pointer ${
              oversizedGroups.length > 0
                ? "bg-[#E8521A] text-white hover:bg-[#D9531E]"
                : "border border-[#141A23] bg-white text-[#141A23] hover:bg-[#141A23] hover:text-white"
            }`}
            title="AI API 호출 없이 시간순으로 2장씩 즉시 분리합니다 (비용 0원)"
          >
            <Icon d={ICON.scissors} className="w-4 h-4" />
            <span>
              2장씩 즉시 묶기 ({photos.length}장 · 0원)
            </span>
          </button>

          <button
            type="button"
            disabled={isBusy || photos.length === 0}
            onClick={handleRunAiGrouping}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#141A23] bg-white px-3.5 py-2 text-hb-xs font-bold text-[#141A23] hover:bg-[#141A23] hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Icon d={ICON.sparkles} className="w-4 h-4" />
            <span>
              AI 자동 묶음 ({photos.length}장)
            </span>
          </button>

          {eligibleGroups.length > 0 && (
            <>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  if (selectedGroups.length === eligibleGroups.length) {
                    setDeselectedKeys(
                      new Set(eligibleGroups.map((g) => g.groupKey))
                    );
                  } else {
                    setDeselectedKeys(new Set());
                  }
                }}
                className="rounded-lg border border-[#CBD2DC] bg-[#F9FAFB] px-3 py-2 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] disabled:opacity-40 cursor-pointer"
              >
                {selectedGroups.length === eligibleGroups.length
                  ? "전체 선택 해제"
                  : `등록 가능 묶음 전체 선택 (${eligibleGroups.length})`}
              </button>

              <button
                type="button"
                disabled={isBusy || selectedGroups.length === 0}
                onClick={() => runCommitQueue(selectedGroups)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-hb-xs font-bold text-white disabled:opacity-40 transition-colors cursor-pointer ${
                  oversizedGroups.length > 0
                    ? "bg-[#141A23] hover:bg-[#374151]"
                    : "bg-[#E8521A] hover:bg-[#D9531E]"
                }`}
              >
                <Icon d={ICON.bolt} className="w-4 h-4" />
                <span>
                  선택 묶음 일괄 등록 ({selectedGroups.length}개 제품)
                </span>
              </button>

              {totalPages > 1 && visibleSelectedGroups.length > 0 && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => runCommitQueue(visibleSelectedGroups)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8521A] bg-[#FFF4EE] px-3 py-2 text-hb-xs font-bold text-[#C84312] hover:bg-[#E8521A] hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Icon d={ICON.bolt} className="w-4 h-4" />
                  <span>
                    이 페이지만 등록 ({visibleSelectedGroups.length}개)
                  </span>
                </button>
              )}
            </>
          )}

          {badNotePhotos.length > 0 && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                handleDiscardPhotos(
                  badNotePhotos.map((p) => p.id),
                  `AI가 불량/식별 불가로 표시한 ${badNotePhotos.length}장의 사진을 수집함에서 일괄 제외할까요?`
                )
              }
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-hb-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-40 cursor-pointer"
            >
              <Icon d={ICON.trash} className="w-3.5 h-3.5" />
              <span>AI 불량컷 일괄 제외 ({badNotePhotos.length}장)</span>
            </button>
          )}
        </div>

        {oversizedGroups.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-hb-xs text-amber-950">
            <strong>
              {TELEGRAM_MAX_PHOTOS_PER_PRODUCT}장을 초과한 미분류 뭉치가{" "}
              {oversizedGroups.length}개 있습니다.
            </strong>{" "}
            여러 제품이 섞여 등록되지 않도록 4장 이상 묶음은 일괄 등록이 잠겨 있습니다. 먼저{" "}
            <strong>[AI 자동 묶음]</strong>을 눌러 기본 {TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT}장(최대{" "}
            {TELEGRAM_MAX_PHOTOS_PER_PRODUCT}장) 단위로 나눈 뒤 등록해 주세요.
          </div>
        )}

        {/* AI 자동 묶음 진행률 바 */}
        {groupingProgress.active && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border border-[#E2E6EC] bg-[#F9FAFB] p-3 space-y-2"
          >
            <div className="flex items-center justify-between text-hb-xs font-bold text-[#141A23]">
              <span>{groupingProgress.note}</span>
              <span className="tabular-nums">
                {groupingProgress.done} / {groupingProgress.total} 배치
              </span>
            </div>
            <progress
              value={groupingProgress.done}
              max={Math.max(1, groupingProgress.total)}
              className="w-full h-2.5 accent-[#141A23]"
            />
          </div>
        )}

        {/* 순차 일괄 등록 진행률 바 */}
        {commitProgress.active && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border border-[#FADCD0] bg-[#FFF4EE] p-3.5 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-hb-xs font-bold text-[#141A23]">
              <span>{commitProgress.currentLabel}</span>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-[#E8521A]">
                  진행 {commitProgress.done}/{commitProgress.total} (성공{" "}
                  {commitProgress.success})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    abortCommitRef.current = true;
                  }}
                  className="rounded border border-red-300 bg-white px-2.5 py-1 text-hb-xs font-bold text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  현재 건 후 중단
                </button>
              </div>
            </div>
            <progress
              value={commitProgress.done}
              max={Math.max(1, commitProgress.total)}
              className="w-full h-2.5 accent-[#E8521A]"
            />
          </div>
        )}

        {/* 방금 검수대기로 저장 완료된 매물 바로 이동 안내 */}
        {committedCount > 0 && !commitProgress.active && (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-hb-xs text-emerald-950"
          >
            <div className="flex items-center gap-2 font-bold">
              <Icon d={ICON.check} className="w-4 h-4 text-emerald-700" />
              <span>
                이번 작업에서 {committedCount}건의 상품이 [검수대기(비공개)]로
                등록되었습니다.
              </span>
            </div>
            {onJumpToPendingReview && (
              <button
                type="button"
                onClick={onJumpToPendingReview}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-hb-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
              >
                검수대기함에서 가격 입력 · 공개하기
              </button>
            )}
          </div>
        )}

        {/* 90일+ 판매완료 보조사진 정리 배너 */}
        {cleanupSummary.photoCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E2E6EC] bg-[#F9FAFB] px-3.5 py-2.5 text-hb-xs text-[#141A23]">
            <div>
              <span className="font-bold">무료 1GB 스토리지 순환 정리:</span>{" "}
              판매완료 90일+ 경과 매물 {cleanupSummary.productCount}건에서 보조사진{" "}
              <strong className="text-[#E8521A] tabular-nums">
                {cleanupSummary.photoCount}장
              </strong>
              을 정리할 수 있습니다 (대표 1번 사진은 유지).
            </div>
            <button
              type="button"
              disabled={runningCleanup}
              onClick={handleRunSoldCleanup}
              className="rounded-lg border border-[#141A23] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#141A23] hover:bg-[#141A23] hover:text-white disabled:opacity-40 cursor-pointer"
            >
              {runningCleanup
                ? "정리 중..."
                : `판매완료 90일+ 보조사진 정리 (${cleanupSummary.photoCount}장)`}
            </button>
          </div>
        )}
      </div>

      {/* 수집함 묶음 리스트 */}
      {loading ? (
        <div className="rounded-xl border border-[#E2E6EC] bg-white p-10 text-center text-hb-sm font-semibold text-[#6B7280]">
          텔레그램 수집함 사진 목록을 불러오는 중입니다...
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#CBD2DC] bg-white p-10 text-center space-y-2">
          <p className="text-hb-base font-bold text-[#141A23]">
            수집함에 대기 중인 사진이 없습니다.
          </p>
          <p className="text-hb-xs text-[#6B7280]">
            전용 텔레그램 방에 제품 사진을 보내면 이곳에 촬영·전송 순서대로 자동 수집됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.length > GROUPS_PER_PAGE && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E2E6EC] bg-white px-4 py-2.5 text-hb-xs text-[#141A23] shadow-2xs">
              <span className="font-bold tabular-nums">
                {showAllGroups
                  ? `전체 ${groups.length}개 묶음 모두 표시 중`
                  : `${pageStartIdx + 1}~${Math.min(
                      pageStartIdx + GROUPS_PER_PAGE,
                      groups.length
                    )}번 묶음 표시 (${safePage} / ${totalPages}페이지 · 총 ${
                      groups.length
                    }개)`}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {!showAllGroups && (
                  <>
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="rounded border border-[#CBD2DC] bg-white px-2.5 py-1 font-bold hover:border-[#141A23] disabled:opacity-40 cursor-pointer"
                    >
                      이전 20개
                    </button>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="rounded border border-[#CBD2DC] bg-white px-2.5 py-1 font-bold hover:border-[#141A23] disabled:opacity-40 cursor-pointer"
                    >
                      다음 20개
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowAllGroups((v) => !v)}
                  className="rounded border border-[#CBD2DC] bg-[#F9FAFB] px-2.5 py-1 font-bold hover:border-[#141A23] cursor-pointer"
                >
                  {showAllGroups ? "20개씩 나눠 보기" : "전체 한 번에 보기"}
                </button>
              </div>
            </div>
          )}

          {visibleGroups.map((group, localIdx) => {
            const groupIdx = pageStartIdx + localIdx;
            const checkboxId = `tg-group-select-${groupIdx}`;
            const commitCheck = canCommitInboxGroup(group);
            const isSelected =
              commitCheck.allowed && !deselectedKeys.has(group.groupKey);
            const groupFailure = failedByGroup[group.groupKey];

            return (
              <article
                key={group.groupKey}
                className={`rounded-xl border bg-white p-4 space-y-3 shadow-2xs transition-colors ${
                  groupFailure
                    ? "border-red-300"
                    : !commitCheck.allowed
                    ? "border-amber-300 bg-amber-50/20"
                    : isSelected
                    ? "border-[#141A23]/40"
                    : "border-[#E2E6EC] opacity-85"
                }`}
              >
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E6EC] pb-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={isSelected}
                      disabled={isBusy || !commitCheck.allowed}
                      onChange={(e) => {
                        if (!commitCheck.allowed) return;
                        setDeselectedKeys((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.delete(group.groupKey);
                          else next.add(group.groupKey);
                          return next;
                        });
                      }}
                      className="h-4 w-4 accent-[#E8521A] cursor-pointer disabled:cursor-not-allowed"
                    />
                    <label
                      htmlFor={checkboxId}
                      className="cursor-pointer text-hb-sm font-bold text-[#141A23] flex flex-wrap items-center gap-2"
                    >
                      <span>묶음 #{groupIdx + 1}</span>
                      <span className="rounded bg-[#F3F4F6] px-2 py-0.5 text-hb-xs font-bold text-[#374151] tabular-nums">
                        {group.photos.length}장
                      </span>
                      <span className="text-hb-xs font-medium text-[#6B7280] tabular-nums">
                        {formatGroupTimeRange(group)}
                      </span>
                    </label>

                    {!commitCheck.allowed && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-hb-xs font-bold text-amber-900">
                        4장+ 묶음 등록 잠금 · [AI 자동 묶음] 또는 [여기서 나누기]로 {TELEGRAM_MAX_PHOTOS_PER_PRODUCT}장 이하 분리 필수
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {groupIdx > 0 && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleMergeWithPrevious(groupIdx)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#CBD2DC] bg-[#F9FAFB] px-2.5 py-1.5 text-hb-xs font-bold text-[#141A23] hover:border-[#141A23] disabled:opacity-40 cursor-pointer"
                      >
                        <Icon d={ICON.link} className="w-3.5 h-3.5" />
                        <span>앞 묶음과 합치기</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isBusy || !commitCheck.allowed}
                      onClick={() => runCommitQueue([group])}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#FADCD0] bg-[#FFF4EE] px-2.5 py-1.5 text-hb-xs font-bold text-[#C84312] hover:bg-[#E8521A] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Icon d={ICON.bolt} className="w-3.5 h-3.5" />
                      <span>
                        {groupFailure
                          ? "이 묶음 재시도"
                          : commitCheck.allowed
                          ? "이 묶음만 등록"
                          : `${TELEGRAM_MAX_PHOTOS_PER_PRODUCT}장 이하만 등록`}
                      </span>
                    </button>
                  </div>
                </header>

                {groupFailure && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-hb-xs font-semibold text-red-700">
                    등록 실패 사유: {groupFailure}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {group.photos.map((photo, photoIdx) => (
                    <TelegramThumbTile
                      key={photo.id}
                      photo={photo}
                      indexInGroup={photoIdx}
                      disabled={isBusy}
                      thumbStore={thumbStore}
                      onInspectFull={setInspectingPhoto}
                      onSplitBefore={handleSplitBefore}
                      onDiscard={(id) => handleDiscardPhotos([id])}
                    />
                  ))}
                </div>
              </article>
            );
          })}

          {groups.length > GROUPS_PER_PAGE && !showAllGroups && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[#E2E6EC] bg-white px-4 py-2.5 text-hb-xs text-[#141A23] shadow-2xs">
              <span className="font-bold tabular-nums">
                {safePage} / {totalPages}페이지
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-[#CBD2DC] bg-white px-2.5 py-1 font-bold hover:border-[#141A23] disabled:opacity-40 cursor-pointer"
                >
                  이전 20개
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="rounded border border-[#CBD2DC] bg-white px-2.5 py-1 font-bold hover:border-[#141A23] disabled:opacity-40 cursor-pointer"
                >
                  다음 20개
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <TelegramFullPreviewModal
        photo={inspectingPhoto}
        onClose={() => setInspectingPhoto(null)}
      />
    </section>
  );
}
