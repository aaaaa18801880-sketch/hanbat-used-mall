import {
  extractInquiryImages,
  getInquiryTypeLabel,
  maskName,
  STORE,
} from "./site";
import { createAnonServerClient, createServiceRoleClient } from "./supabase";
import { signInquiryImageLists } from "./inquiry-attachments";

export const SAFE_INQUIRY_SELECT_COLUMNS =
  "id, name, phone, inquiry_type, category, model, condition_grade, region, description, images, image_url, is_notice, status, admin_reply, created_at";

export interface RawInquiryRow {
  id: number | string;
  name?: string | null;
  phone?: string | null;
  inquiry_type?: string | null;
  category?: string | null;
  model?: string | null;
  condition_grade?: string | null;
  region?: string | null;
  description?: string | null;
  images?: unknown;
  image_url?: unknown;
  is_notice?: boolean | null;
  status?: string | null;
  admin_reply?: string | null;
  created_at?: string | null;
}

function resolveDisplayInquiryType(
  row: RawInquiryRow,
  isAdmin: boolean,
  isNotice: boolean
): string {
  if (isNotice && !isAdmin) return "공지사항";
  const rawType = row.inquiry_type || (row.region ? "내 물건 팔기" : "기타 문의");
  return isAdmin ? rawType : getInquiryTypeLabel(rawType);
}

/**
 * 문의 목록 API(GET /api/inquiries)용 공개/관리자 응답 객체 생성기
 */
export function toInquiryListItem(
  row: RawInquiryRow,
  options: {
    isAdmin: boolean;
    images: string[];
    hasImages: boolean;
  }
) {
  const isNotice = Boolean(row.is_notice);
  const title =
    row.category || (row.model ? `${row.model} 매입 문의` : "문의드립니다.");
  const maskedName = maskName(row.name);

  if (options.isAdmin) {
    return {
      id: row.id,
      name: row.name || "고객",
      masked_name: maskedName,
      phone: row.phone || "",
      inquiry_type: resolveDisplayInquiryType(row, true, isNotice),
      category: title,
      model: row.model || null,
      condition_grade: row.condition_grade || null,
      region: row.region || null,
      description: row.description || "",
      images: options.images,
      has_images: options.hasImages,
      is_notice: isNotice,
      status: row.status || "접수",
      admin_reply: row.admin_reply || null,
      created_at: row.created_at,
    };
  }

  return {
    id: row.id,
    name: isNotice ? row.name || STORE.name : maskedName,
    masked_name: maskedName,
    phone: null,
    inquiry_type: resolveDisplayInquiryType(row, false, isNotice),
    category: title,
    description: isNotice ? row.description || "" : null,
    images: isNotice ? options.images : [],
    has_images: options.hasImages,
    is_notice: isNotice,
    status: row.status || (isNotice ? "공지" : "접수"),
    admin_reply: null,
    created_at: row.created_at,
  };
}

/**
 * 단건 열람/수정 API(POST, PATCH /api/inquiries/[id])용 응답 객체 생성기
 */
export function toInquiryDetailItem(
  row: RawInquiryRow,
  options: {
    isAdmin: boolean;
    images?: string[];
    preserveRawType?: boolean;
  }
) {
  const isNotice = Boolean(row.is_notice);
  const base = {
    id: row.id,
    name: options.isAdmin || isNotice ? row.name : maskName(row.name),
    phone: options.isAdmin ? row.phone : null,
    inquiry_type: options.preserveRawType
      ? row.inquiry_type
      : resolveDisplayInquiryType(row, false, isNotice),
    category: row.category || "문의 내용",
    model: row.model || null,
    condition_grade: row.condition_grade || null,
    region: row.region || null,
    description: row.description || "",
    is_notice: isNotice,
    status: row.status || "접수",
    admin_reply: row.admin_reply || null,
    created_at: row.created_at,
  };

  return options.images !== undefined
    ? { ...base, images: options.images }
    : base;
}

export interface SanitizedInquiryListItem {
  id: number | string;
  name: string;
  masked_name: string;
  phone: string | null;
  inquiry_type: string;
  category: string;
  model?: string | null;
  condition_grade?: string | null;
  region?: string | null;
  description: string | null;
  images: string[];
  has_images: boolean;
  is_notice: boolean;
  status: string;
  admin_reply: string | null;
  created_at: string | null | undefined;
}

/**
 * 문의 게시판(공개 마스킹 / 관리자 전체) 목록 조회·서명 URL 발급 공용 서버 로더
 */
export async function fetchSanitizedInquiryList(options: {
  isAdmin: boolean;
  limit?: number;
  accessToken?: string;
}): Promise<{
  inquiries: SanitizedInquiryListItem[];
  error: { message: string } | null;
}> {
  const effectiveLimit =
    options.limit && options.limit > 0 && options.limit <= 300
      ? options.limit
      : 200;

  const supabase = options.isAdmin
    ? createAnonServerClient(options.accessToken)
    : createServiceRoleClient();

  const { data, error } = await supabase
    .from("purchase_requests")
    .select(SAFE_INQUIRY_SELECT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(effectiveLimit);

  if (error) {
    console.error("문의 목록 조회 오류:", error.message);
    return { inquiries: [], error: { message: error.message } };
  }

  const rows = (data ?? []) as RawInquiryRow[];
  const rawImageLists = rows.map((row) => extractInquiryImages(row));
  const signTargetLists = rows.map((row, idx) =>
    options.isAdmin || Boolean(row.is_notice) ? rawImageLists[idx] : []
  );
  const imageLists = await signInquiryImageLists(supabase, signTargetLists);

  const sanitized = rows.map((row, index) =>
    toInquiryListItem(row, {
      isAdmin: options.isAdmin,
      images: imageLists[index],
      hasImages: rawImageLists[index].length > 0,
    })
  ) as SanitizedInquiryListItem[];

  return { inquiries: sanitized, error: null };
}

/**
 * SSR(/inquiry) 초기 렌더링용 안전 공개 문의 목록 로더
 */
export async function fetchInitialPublicInquiries(
  limit = 200
): Promise<{ inquiries: SanitizedInquiryListItem[]; loaded: boolean }> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { inquiries: [], loaded: false };
    }
    const { inquiries, error } = await fetchSanitizedInquiryList({
      isAdmin: false,
      limit,
    });
    return { inquiries, loaded: !error };
  } catch {
    return { inquiries: [], loaded: false };
  }
}

/**
 * 공지 제외 실제 누적 고객 문의 건수 조회 (실데이터 기반 신뢰 지표용)
 */
export async function fetchPublicInquiryTotalCount(): Promise<number | null> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    const supabase = createServiceRoleClient();
    const { count, error } = await supabase
      .from("purchase_requests")
      .select("id", { count: "exact", head: true })
      .or("is_notice.is.null,is_notice.eq.false");
    if (error || typeof count !== "number") return null;
    return count;
  } catch {
    return null;
  }
}
