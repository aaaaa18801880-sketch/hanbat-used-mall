// 파일 경로: lib/telegram-inbox.ts
// 텔레그램 사진 수집함 웹훅 파서, 시간순 그룹 분할/합치기/제외, AI 경계 정제 및 90일+ 판매완료 사진 정리 순수 로직

import { isProductSold, splitImages } from "./site";

export interface TelegramInboxPhoto {
  id: string;
  telegram_update_id?: number | null;
  chat_id: string;
  message_id: number;
  media_group_id?: string | null;
  file_id: string;
  file_unique_id: string;
  thumb_file_id?: string | null;
  source_kind: "photo" | "document";
  mime_type?: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
  group_key?: string | null;
  sort_order: number;
  status: "pending" | "committed" | "discarded";
  committed_product_id?: string | null;
  ai_note?: string | null;
  taken_at: string;
  created_at: string;
}

export interface TelegramInboxGroup {
  groupKey: string;
  photos: TelegramInboxPhoto[];
  takenFrom: string;
  takenTo: string;
}

export interface TelegramGroupPersistenceUpdate {
  id: string;
  group_key: string;
  sort_order: number;
}

export interface ParsedTelegramWebhookPhoto {
  telegramUpdateId: number | null;
  chatId: string;
  messageId: number;
  mediaGroupId: string | null;
  fileId: string;
  fileUniqueId: string;
  thumbFileId: string | null;
  sourceKind: "photo" | "document";
  mimeType: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  takenAtIso: string;
}

export interface SoldProductCleanupTarget {
  productId: string;
  title: string;
  createdAt: string;
  primaryImageUrl: string;
  removableUrls: string[];
}

const MAX_RAW_CHUNK_SIZE = 12;
const UNGROUPED_TIME_GAP_MS = 3 * 60 * 1000;

export const TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT = 2;
export const TELEGRAM_MAX_PHOTOS_PER_PRODUCT = 3;

export type QuarterTurnDegrees = 0 | 90 | 180 | 270;

/**
 * 임의의 회전 각도 입력을 안전한 90도 단위(0 | 90 | 180 | 270)로 정규화합니다.
 */
export function normalizeQuarterTurnDegrees(raw: unknown): QuarterTurnDegrees {
  const num = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(num)) return 0;
  const snapped = ((Math.round(num / 90) * 90) % 360 + 360) % 360;
  if (snapped === 90 || snapped === 180 || snapped === 270) {
    return snapped;
  }
  return 0;
}

/**
 * 현재 회전 각도에서 90/-90/180도만큼 회전한 다음 각도를 계산합니다.
 */
export function stepQuarterTurnDegrees(
  current: unknown,
  delta: 90 | -90 | 180 = 90
): QuarterTurnDegrees {
  return normalizeQuarterTurnDegrees(normalizeQuarterTurnDegrees(current) + delta);
}

/**
 * 클라이언트/요청 바디에서 넘어온 photoId -> 회전 각도 맵을 화이트리스트 검증합니다.
 */
export function sanitizeManualRotationMap(
  raw: unknown,
  allowedIds?: readonly string[]
): Record<string, QuarterTurnDegrees> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const allowSet = allowedIds ? new Set(allowedIds) : null;
  const result: Record<string, QuarterTurnDegrees> = {};

  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const id = key.trim();
    if (!id || id.length > 64) continue;
    if (allowSet && !allowSet.has(id)) continue;
    const deg = normalizeQuarterTurnDegrees(val);
    if (deg !== 0) {
      result[id] = deg;
    }
  }
  return result;
}

/**
 * 수집함 수동 회전과 AI 판정 회전을 안전하게 조합합니다.
 * - 사용자가 수동 회전을 지정한 사진은 AI 판독 전에 미리 정방향으로 회전(preAiDeg)시키고,
 *   이후 AI의 추가 회전 추측은 무시(postAiDeg = 0)해 이중 회전이나 오판을 원천 차단합니다.
 * - 사용자가 회전하지 않은 사진(0도)은 AI가 감지한 회전 각도(postAiDeg)만 적용합니다.
 */
export function resolvePhotoCommitRotations(params: {
  manualDeg?: unknown;
  aiDeg?: unknown;
}): {
  preAiDeg: QuarterTurnDegrees;
  postAiDeg: QuarterTurnDegrees;
  totalDeg: QuarterTurnDegrees;
} {
  const preAiDeg = normalizeQuarterTurnDegrees(params.manualDeg);
  if (preAiDeg !== 0) {
    return {
      preAiDeg,
      postAiDeg: 0,
      totalDeg: preAiDeg,
    };
  }
  const postAiDeg = normalizeQuarterTurnDegrees(params.aiDeg);
  return {
    preAiDeg: 0,
    postAiDeg,
    totalDeg: postAiDeg,
  };
}

function createSyntheticGroupKey(seed: string, idx: number): string {
  const safeSeed = seed.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 12) || "tg";
  return `grp_${safeSeed}_${idx}`;
}

function asRecord(val: unknown): Record<string, unknown> | null {
  return val && typeof val === "object" && !Array.isArray(val)
    ? (val as Record<string, unknown>)
    : null;
}

/**
 * 텔레그램 Webhook Update에서 이미지(일반 사진 최고해상도 + 원본 이미지 파일 document) 메타데이터만 추출합니다.
 */
export function parseTelegramWebhookUpdate(
  update: unknown,
  expectedChatId: string
):
  | { matched: false; reason: "invalid_payload" | "chat_mismatch" | "not_image" }
  | { matched: true; photo: ParsedTelegramWebhookPhoto } {
  const root = asRecord(update);
  if (!root) return { matched: false, reason: "invalid_payload" };

  const msg = asRecord(root.message) ?? asRecord(root.channel_post);
  if (!msg) return { matched: false, reason: "invalid_payload" };

  const chat = asRecord(msg.chat);
  const chatId = chat?.id !== undefined ? String(chat.id).trim() : "";
  if (!chatId || chatId !== expectedChatId.trim()) {
    return { matched: false, reason: "chat_mismatch" };
  }

  const updateId =
    typeof root.update_id === "number" && Number.isFinite(root.update_id)
      ? root.update_id
      : null;
  const messageId =
    typeof msg.message_id === "number" && Number.isFinite(msg.message_id)
      ? msg.message_id
      : 0;
  if (!messageId) return { matched: false, reason: "invalid_payload" };

  const mediaGroupId =
    typeof msg.media_group_id === "string" && msg.media_group_id.trim()
      ? msg.media_group_id.trim()
      : null;

  const unixDate =
    typeof msg.date === "number" && Number.isFinite(msg.date) && msg.date > 0
      ? msg.date * 1000
      : Date.now();
  const takenAtIso = new Date(unixDate).toISOString();

  // 1) 일반 압축 사진 배열 (photo)
  if (Array.isArray(msg.photo) && msg.photo.length > 0) {
    const sizes = msg.photo
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item.file_id === "string"));

    if (sizes.length > 0) {
      const largest = sizes[sizes.length - 1];
      // 경량 미리보기용 (~320px 내외 중간 사이즈 우선 선택)
      const thumbCandidate =
        sizes.find((s) => {
          const w = typeof s.width === "number" ? s.width : 0;
          const h = typeof s.height === "number" ? s.height : 0;
          return Math.max(w, h) >= 240 && Math.max(w, h) <= 420;
        }) ?? sizes[Math.min(1, sizes.length - 1)];

      return {
        matched: true,
        photo: {
          telegramUpdateId: updateId,
          chatId,
          messageId,
          mediaGroupId,
          fileId: String(largest.file_id),
          fileUniqueId: String(largest.file_unique_id || largest.file_id),
          thumbFileId:
            typeof thumbCandidate?.file_id === "string"
              ? thumbCandidate.file_id
              : null,
          sourceKind: "photo",
          mimeType: "image/jpeg",
          fileSize:
            typeof largest.file_size === "number" ? largest.file_size : null,
          width: typeof largest.width === "number" ? largest.width : null,
          height: typeof largest.height === "number" ? largest.height : null,
          takenAtIso,
        },
      };
    }
  }

  // 2) '파일로 보내기' 원본 이미지 (document)
  const doc = asRecord(msg.document);
  if (doc && typeof doc.file_id === "string") {
    const mimeType =
      typeof doc.mime_type === "string" ? doc.mime_type.trim().toLowerCase() : "";
    const fileName =
      typeof doc.file_name === "string" ? doc.file_name.trim().toLowerCase() : "";
    const looksLikeImage =
      mimeType.startsWith("image/") ||
      /\.(jpe?g|png|webp|heic|heif)$/i.test(fileName);

    if (looksLikeImage) {
      const thumbObj = asRecord(doc.thumbnail) ?? asRecord(doc.thumb);
      return {
        matched: true,
        photo: {
          telegramUpdateId: updateId,
          chatId,
          messageId,
          mediaGroupId,
          fileId: doc.file_id,
          fileUniqueId: String(doc.file_unique_id || doc.file_id),
          thumbFileId:
            thumbObj && typeof thumbObj.file_id === "string"
              ? thumbObj.file_id
              : null,
          sourceKind: "document",
          mimeType: mimeType || "image/jpeg",
          fileSize: typeof doc.file_size === "number" ? doc.file_size : null,
          width: thumbObj && typeof thumbObj.width === "number" ? thumbObj.width : null,
          height:
            thumbObj && typeof thumbObj.height === "number" ? thumbObj.height : null,
          takenAtIso,
        },
      };
    }
  }

  return { matched: false, reason: "not_image" };
}

/**
 * 수집함 사진을 촬영/전송 시간순 -> 메시지 ID -> 정렬 순번 순으로 안정 정렬합니다.
 */
export function sortTelegramPhotosChronologically(
  photos: readonly TelegramInboxPhoto[]
): TelegramInboxPhoto[] {
  return [...photos].sort((a, b) => {
    const ta = new Date(a.taken_at).getTime();
    const tb = new Date(b.taken_at).getTime();
    if (ta !== tb) return ta - tb;
    if (a.message_id !== b.message_id) return a.message_id - b.message_id;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.id.localeCompare(b.id);
  });
}

function finalizeGroupFromPhotos(
  groupKey: string,
  photos: TelegramInboxPhoto[]
): TelegramInboxGroup {
  return {
    groupKey,
    photos,
    takenFrom: photos[0]?.taken_at ?? "",
    takenTo: photos[photos.length - 1]?.taken_at ?? "",
  };
}

/**
 * 대기중인 수집함 사진 목록을 시간순 제품 묶음 목록으로 변환합니다.
 * - DB에 저장된 group_key가 있으면 해당 경계를 그대로 유지합니다.
 * - group_key가 아직 없는 사진은 media_group_id 또는 시간 간격(3분) 기준으로 임시 묶음 생성합니다.
 */
export function buildInboxGroups(
  rawPhotos: readonly TelegramInboxPhoto[]
): TelegramInboxGroup[] {
  const pending = sortTelegramPhotosChronologically(
    rawPhotos.filter((p) => p.status === "pending")
  );
  if (pending.length === 0) return [];

  const groups: TelegramInboxGroup[] = [];
  let currentPhotos: TelegramInboxPhoto[] = [];
  let currentKey = "";
  let syntheticSeq = 1;

  const flush = () => {
    if (currentPhotos.length === 0) return;
    groups.push(finalizeGroupFromPhotos(currentKey, currentPhotos));
    currentPhotos = [];
  };

  for (const photo of pending) {
    const explicitKey = photo.group_key?.trim() || "";
    const prev = currentPhotos[currentPhotos.length - 1];

    if (!prev) {
      currentKey =
        explicitKey || createSyntheticGroupKey(photo.id, syntheticSeq++);
      currentPhotos = [photo];
      continue;
    }

    const prevExplicitKey = prev.group_key?.trim() || "";

    // 둘 중 하나라도 명시적 group_key가 있을 때
    if (explicitKey || prevExplicitKey) {
      if (explicitKey && prevExplicitKey && explicitKey === prevExplicitKey) {
        currentPhotos.push(photo);
      } else {
        flush();
        currentKey =
          explicitKey || createSyntheticGroupKey(photo.id, syntheticSeq++);
        currentPhotos = [photo];
      }
      continue;
    }

    // 둘 다 미분류(group_key 없음): 동일 media_group_id이거나 3분 이내 연속 전송 & 청크 상한 내이면 함께 표시
    const sameAlbum =
      Boolean(photo.media_group_id) &&
      photo.media_group_id === prev.media_group_id;
    const withinGap =
      Math.abs(
        new Date(photo.taken_at).getTime() - new Date(prev.taken_at).getTime()
      ) <= UNGROUPED_TIME_GAP_MS;

    if (
      (sameAlbum || (!photo.media_group_id && !prev.media_group_id && withinGap)) &&
      currentPhotos.length < MAX_RAW_CHUNK_SIZE
    ) {
      currentPhotos.push(photo);
    } else {
      flush();
      currentKey = createSyntheticGroupKey(photo.id, syntheticSeq++);
      currentPhotos = [photo];
    }
  }

  flush();
  return groups;
}

/**
 * 그룹 내 모든 사진에 대한 DB 저장용 (id, group_key, sort_order) 평탄화 목록을 생성합니다.
 */
export function flattenGroupsToPersistenceUpdates(
  groups: readonly TelegramInboxGroup[]
): TelegramGroupPersistenceUpdate[] {
  const updates: TelegramGroupPersistenceUpdate[] = [];
  let globalOrder = 1;
  for (const group of groups) {
    for (const photo of group.photos) {
      updates.push({
        id: photo.id,
        group_key: group.groupKey,
        sort_order: globalOrder++,
      });
    }
  }
  return updates;
}

export interface TelegramGroupKeyOnlyUpdate {
  id: string;
  group_key: string;
}

/**
 * 특정 사진 직전에서 그룹을 2개로 분할합니다.
 */
export function splitInboxGroupBeforePhoto(
  groups: readonly TelegramInboxGroup[],
  targetPhotoId: string,
  newKeySuffix = String(Date.now()).slice(-6)
): {
  groups: TelegramInboxGroup[];
  updates: TelegramGroupPersistenceUpdate[];
  changedUpdates: TelegramGroupKeyOnlyUpdate[];
  changed: boolean;
} {
  const nextGroups: TelegramInboxGroup[] = [];
  const changedUpdates: TelegramGroupKeyOnlyUpdate[] = [];
  let changed = false;

  for (const group of groups) {
    const idx = group.photos.findIndex((p) => p.id === targetPhotoId);
    if (idx <= 0) {
      nextGroups.push(group);
      continue;
    }

    changed = true;
    const headPhotos = group.photos.slice(0, idx);
    const tailPhotos = group.photos.slice(idx);
    const tailKey = `${group.groupKey.slice(0, 24)}_s${newKeySuffix}`;

    for (const p of headPhotos) {
      if ((p.group_key || "") !== group.groupKey) {
        changedUpdates.push({ id: p.id, group_key: group.groupKey });
      }
    }
    for (const p of tailPhotos) {
      changedUpdates.push({ id: p.id, group_key: tailKey });
    }

    nextGroups.push(
      finalizeGroupFromPhotos(
        group.groupKey,
        headPhotos.map((p) => ({ ...p, group_key: group.groupKey }))
      ),
      finalizeGroupFromPhotos(
        tailKey,
        tailPhotos.map((p) => ({ ...p, group_key: tailKey }))
      )
    );
  }

  return {
    groups: nextGroups,
    updates: changed ? flattenGroupsToPersistenceUpdates(nextGroups) : [],
    changedUpdates,
    changed,
  };
}

/**
 * 선택한 묶음을 바로 앞 묶음과 하나로 합칩니다.
 */
export function mergeInboxGroupWithPrevious(
  groups: readonly TelegramInboxGroup[],
  groupIndex: number
): {
  groups: TelegramInboxGroup[];
  updates: TelegramGroupPersistenceUpdate[];
  changedUpdates: TelegramGroupKeyOnlyUpdate[];
  changed: boolean;
} {
  if (groupIndex <= 0 || groupIndex >= groups.length) {
    return {
      groups: [...groups],
      updates: [],
      changedUpdates: [],
      changed: false,
    };
  }

  const prev = groups[groupIndex - 1];
  const curr = groups[groupIndex];
  const changedUpdates: TelegramGroupKeyOnlyUpdate[] = [];

  for (const p of prev.photos) {
    if ((p.group_key || "") !== prev.groupKey) {
      changedUpdates.push({ id: p.id, group_key: prev.groupKey });
    }
  }
  for (const p of curr.photos) {
    changedUpdates.push({ id: p.id, group_key: prev.groupKey });
  }

  const mergedPhotos = [...prev.photos, ...curr.photos].map((p) => ({
    ...p,
    group_key: prev.groupKey,
  }));

  const nextGroups = [
    ...groups.slice(0, groupIndex - 1),
    finalizeGroupFromPhotos(prev.groupKey, mergedPhotos),
    ...groups.slice(groupIndex + 1),
  ];

  return {
    groups: nextGroups,
    updates: flattenGroupsToPersistenceUpdates(nextGroups),
    changedUpdates,
    changed: true,
  };
}

/**
 * AI API 호출 없이 대기중인 사진을 시간순으로 N장(기본 2장)씩 즉시 묶습니다.
 */
export function pairInboxPhotosByFixedSize(
  rawPhotos: readonly TelegramInboxPhoto[],
  pairSize = TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT,
  seed = String(Date.now()).slice(-7)
): {
  photos: TelegramInboxPhoto[];
  updates: TelegramGroupKeyOnlyUpdate[];
  groupCount: number;
} {
  const safeSize = Math.max(1, Math.min(TELEGRAM_MAX_PHOTOS_PER_PRODUCT, pairSize));
  const ordered = sortTelegramPhotosChronologically(
    rawPhotos.filter((p) => p.status === "pending")
  );
  const nextPhotos: TelegramInboxPhoto[] = [];
  const updates: TelegramGroupKeyOnlyUpdate[] = [];
  let groupIdx = 0;

  for (let i = 0; i < ordered.length; i += safeSize) {
    groupIdx++;
    const groupKey = `pair_${seed}_${groupIdx}`;
    const slice = ordered.slice(i, i + safeSize);
    for (const photo of slice) {
      nextPhotos.push({ ...photo, group_key: groupKey });
      updates.push({ id: photo.id, group_key: groupKey });
    }
  }

  return {
    photos: nextPhotos,
    updates,
    groupCount: groupIdx,
  };
}

/**
 * 선택한 사진 직전에서 묶음을 끊고, 그 사진부터 끝까지를 기본 2장 단위로 일괄 재정렬합니다.
 * - 도미노처럼 뒤쪽 묶음이 1장씩 밀렸을 때 클릭 1번으로 뒤 전체를 즉시 맞춥니다.
 */
export function rePairInboxFromPhoto(
  groups: readonly TelegramInboxGroup[],
  targetPhotoId: string,
  pairSize = TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT,
  seed = String(Date.now()).slice(-7)
): {
  groups: TelegramInboxGroup[];
  photos: TelegramInboxPhoto[];
  changedUpdates: TelegramGroupKeyOnlyUpdate[];
  repaintedGroupCount: number;
  changed: boolean;
} {
  let targetGroupIdx = -1;
  let targetPhotoIdx = -1;
  for (let gi = 0; gi < groups.length; gi++) {
    const pi = groups[gi].photos.findIndex((p) => p.id === targetPhotoId);
    if (pi >= 0) {
      targetGroupIdx = gi;
      targetPhotoIdx = pi;
      break;
    }
  }

  if (targetGroupIdx < 0) {
    return {
      groups: [...groups],
      photos: groups.flatMap((g) => g.photos),
      changedUpdates: [],
      repaintedGroupCount: 0,
      changed: false,
    };
  }

  const safeSize = Math.max(
    1,
    Math.min(TELEGRAM_MAX_PHOTOS_PER_PRODUCT, pairSize)
  );
  const changedUpdates: TelegramGroupKeyOnlyUpdate[] = [];
  const nextGroups: TelegramInboxGroup[] = [...groups.slice(0, targetGroupIdx)];

  const targetGroup = groups[targetGroupIdx];
  if (targetPhotoIdx > 0) {
    const headPhotos = targetGroup.photos.slice(0, targetPhotoIdx).map((p) => {
      if ((p.group_key || "") !== targetGroup.groupKey) {
        changedUpdates.push({ id: p.id, group_key: targetGroup.groupKey });
      }
      return { ...p, group_key: targetGroup.groupKey };
    });
    nextGroups.push(finalizeGroupFromPhotos(targetGroup.groupKey, headPhotos));
  }

  const tailPhotos: TelegramInboxPhoto[] = [
    ...targetGroup.photos.slice(targetPhotoIdx),
    ...groups.slice(targetGroupIdx + 1).flatMap((g) => g.photos),
  ];

  let repaintedGroupCount = 0;
  for (let i = 0; i < tailPhotos.length; i += safeSize) {
    repaintedGroupCount++;
    const nextKey = `rp_${seed}_${repaintedGroupCount}`;
    const slice = tailPhotos.slice(i, i + safeSize).map((p) => {
      if ((p.group_key || "") !== nextKey) {
        changedUpdates.push({ id: p.id, group_key: nextKey });
      }
      return { ...p, group_key: nextKey };
    });
    nextGroups.push(finalizeGroupFromPhotos(nextKey, slice));
  }

  return {
    groups: nextGroups,
    photos: nextGroups.flatMap((g) => g.photos),
    changedUpdates,
    repaintedGroupCount,
    changed: true,
  };
}

/**
 * 불필요한/흔들린 사진 1장을 그룹 목록에서 제거하고 빈 그룹을 정리합니다.
 */
export function removePhotoFromInboxGroups(
  groups: readonly TelegramInboxGroup[],
  targetPhotoId: string
): TelegramInboxGroup[] {
  const nextGroups: TelegramInboxGroup[] = [];
  for (const group of groups) {
    const filtered = group.photos.filter((p) => p.id !== targetPhotoId);
    if (filtered.length > 0) {
      nextGroups.push(finalizeGroupFromPhotos(group.groupKey, filtered));
    }
  }
  return nextGroups;
}

/**
 * 3장을 초과하는 사진 인덱스 묶음을 기본 2장(끝자리 3장 허용) 단위로 안전 분할합니다.
 */
export function partitionIndicesForProductSize(
  indices: readonly number[],
  maxPerProduct = TELEGRAM_MAX_PHOTOS_PER_PRODUCT,
  preferredPerProduct = TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT
): number[][] {
  if (indices.length === 0) return [];
  if (indices.length <= maxPerProduct) return [[...indices]];

  const step = Math.max(1, Math.min(preferredPerProduct, maxPerProduct));
  const result: number[][] = [];
  let cursor = 0;

  while (cursor < indices.length) {
    const remaining = indices.length - cursor;
    if (remaining <= maxPerProduct) {
      result.push(indices.slice(cursor));
      break;
    }
    if (remaining === step + 1 && maxPerProduct >= step + 1) {
      result.push(indices.slice(cursor));
      break;
    }
    result.push(indices.slice(cursor, cursor + step));
    cursor += step;
  }

  return result;
}

/**
 * AI가 반환한 제품 묶음 인덱스(1-based)를 검증·정규화해 누락/중복/과다묶음(3장 초과) 없는 연속 묶음 업데이트로 변환합니다.
 */
export function normalizeAiGroupingResult(params: {
  orderedPhotos: readonly TelegramInboxPhoto[];
  rawGroups: unknown;
  rawBadPhotos: unknown;
  batchSeed?: string;
  maxGroupSize?: number;
}): {
  updates: TelegramGroupPersistenceUpdate[];
  badNotesById: Record<string, string>;
  groupCount: number;
  lastGroupPhotoIds: string[];
} {
  const { orderedPhotos, rawGroups, rawBadPhotos } = params;
  const seed = params.batchSeed || String(Date.now()).slice(-7);
  const maxGroupSize = params.maxGroupSize ?? TELEGRAM_MAX_PHOTOS_PER_PRODUCT;
  const total = orderedPhotos.length;

  const badNotesById: Record<string, string> = {};
  if (Array.isArray(rawBadPhotos)) {
    for (const item of rawBadPhotos) {
      const rec = asRecord(item);
      if (!rec) continue;
      const idx = typeof rec.index === "number" ? Math.round(rec.index) : 0;
      if (idx < 1 || idx > total) continue;
      const reason =
        typeof rec.reason === "string" && rec.reason.trim()
          ? rec.reason.trim().slice(0, 50)
          : "촬영 불량/식별 불가 의심";
      badNotesById[orderedPhotos[idx - 1].id] = reason;
    }
  }

  const assigned = new Set<number>();
  const resolvedRanges: number[][] = [];

  if (Array.isArray(rawGroups)) {
    for (const grp of rawGroups) {
      let indices: number[] = [];
      if (Array.isArray(grp)) {
        indices = grp
          .map((n) => Math.round(Number(n)))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= total);
      } else {
        const rec = asRecord(grp);
        if (rec && Array.isArray(rec.indices)) {
          indices = rec.indices
            .map((n) => Math.round(Number(n)))
            .filter((n) => Number.isInteger(n) && n >= 1 && n <= total);
        }
      }

      const fresh = indices.filter((n) => !assigned.has(n));
      if (fresh.length > 0) {
        fresh.sort((a, b) => a - b);
        fresh.forEach((n) => assigned.add(n));
        resolvedRanges.push(
          ...partitionIndicesForProductSize(
            fresh,
            maxGroupSize,
            TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT
          )
        );
      }
    }
  }

  // 누락된 사진이 있으면 순서대로 안전하게 단독/2장 단위로 편입
  const missing: number[] = [];
  for (let n = 1; n <= total; n++) {
    if (!assigned.has(n)) {
      missing.push(n);
      assigned.add(n);
    }
  }
  if (missing.length > 0) {
    resolvedRanges.push(
      ...partitionIndicesForProductSize(
        missing,
        maxGroupSize,
        TELEGRAM_RECOMMENDED_PHOTOS_PER_PRODUCT
      )
    );
  }

  // 각 그룹 첫 사진 순번 기준으로 시간순 재정렬
  resolvedRanges.sort((a, b) => a[0] - b[0]);

  const updates: TelegramGroupPersistenceUpdate[] = [];
  let sortSeq = 1;
  resolvedRanges.forEach((indices, gIdx) => {
    const groupKey = `ai_${seed}_${gIdx + 1}`;
    for (const oneBasedIdx of indices) {
      updates.push({
        id: orderedPhotos[oneBasedIdx - 1].id,
        group_key: groupKey,
        sort_order: sortSeq++,
      });
    }
  });

  const lastRange = resolvedRanges[resolvedRanges.length - 1] ?? [];
  const lastGroupPhotoIds = lastRange.map(
    (oneBasedIdx) => orderedPhotos[oneBasedIdx - 1].id
  );

  return {
    updates,
    badNotesById,
    groupCount: resolvedRanges.length,
    lastGroupPhotoIds,
  };
}

/**
 * 단일 묶음이 상품 일괄 등록(최대 3장) 조건을 충족하는지 판별합니다.
 */
export function canCommitInboxGroup(
  group: TelegramInboxGroup,
  maxPerProduct = TELEGRAM_MAX_PHOTOS_PER_PRODUCT
): { allowed: true } | { allowed: false; reason: "empty" | "too_many_photos" } {
  if (group.photos.length === 0) {
    return { allowed: false, reason: "empty" };
  }
  if (group.photos.length > maxPerProduct) {
    return { allowed: false, reason: "too_many_photos" };
  }
  return { allowed: true };
}

/**
 * 등록 사진 목록에서 제품 외관(role === 'product') 사진이 명판('nameplate')보다 앞(1번 대표 썸네일)에 오도록 안정 정렬합니다.
 */
export function orderCommitItemsWithPrimaryExterior<
  T extends { role?: "product" | "nameplate" | "other" | null },
>(items: readonly T[]): T[] {
  const rank = (role?: string | null): number => {
    if (role === "product") return 0;
    if (role === "nameplate") return 2;
    return 1;
  };
  return items
    .map((item, idx) => ({ item, idx, priority: rank(item.role) }))
    .sort((a, b) => a.priority - b.priority || a.idx - b.idx)
    .map((entry) => entry.item);
}

/**
 * 판매완료 후 지정 일수(기본 90일)가 지난 매물 중 2장 이상 사진이 남은 정리 대상을 선별합니다.
 * - 대표 1번 사진은 보존하고, 2번 이후 보조사진 URL만 반환합니다.
 */
export function detectOldSoldProductCleanupTargets(
  products: ReadonlyArray<{
    id: string;
    title: string;
    category?: string | null;
    status?: string | null;
    image_url?: string | null;
    created_at?: string | null;
  }>,
  options?: { minAgeDays?: number; nowMs?: number }
): SoldProductCleanupTarget[] {
  const minAgeDays = options?.minAgeDays ?? 90;
  const nowMs = options?.nowMs ?? Date.now();
  const cutoffMs = nowMs - minAgeDays * 24 * 60 * 60 * 1000;

  const targets: SoldProductCleanupTarget[] = [];

  for (const product of products) {
    if (product.category === "배송인증") continue;
    if (!isProductSold(product.status)) continue;
    const createdMs = product.created_at
      ? new Date(product.created_at).getTime()
      : Number.NaN;
    if (!Number.isFinite(createdMs) || createdMs > cutoffMs) continue;

    const images = splitImages(product.image_url);
    if (images.length <= 1) continue;

    targets.push({
      productId: String(product.id),
      title: product.title || "제목 없음",
      createdAt: product.created_at || "",
      primaryImageUrl: images[0],
      removableUrls: images.slice(1),
    });
  }

  return targets;
}
