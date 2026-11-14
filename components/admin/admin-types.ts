// 파일 경로: components/admin/admin-types.ts

export type AdminTab =
  | "overview"
  | "inquiries"
  | "products"
  | "delivery"
  | "notifications";

export interface AdminProductRow {
  id: string;
  title: string;
  price?: number | null;
  category?: string | null;
  condition_grade?: string | null;
  status?: string | null;
  description?: string | null;
  image_url?: string | null;
  views?: number | null;
  created_at?: string | null;
}

export interface AdminDeliveryRow {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  created_at?: string | null;
}

export interface AdminInquiryRow {
  id: string;
  name: string;
  masked_name?: string;
  phone: string;
  inquiry_type: string;
  category: string;
  model?: string | null;
  condition_grade?: string | null;
  region?: string | null;
  description?: string | null;
  images?: string[];
  image_url?: string | null;
  has_images?: boolean;
  is_notice?: boolean;
  status: string;
  admin_reply?: string | null;
  created_at: string;
}
