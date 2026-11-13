import { getInquiryTypeLabel, maskName, STORE } from "./site";

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
