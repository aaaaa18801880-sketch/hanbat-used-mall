// 파일 경로: lib/site/kst-and-contact.ts
// KST(Asia/Seoul) 날짜·경과일 계산, 전화번호 포맷/마스킹, next/image URL 판별 유틸리티

export function getDaysSinceCreated(createdAt?: string | null): number {
  if (!createdAt) return 0;
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return 0;
  return Math.max(
    0,
    Math.floor((Date.now() - createdMs) / (1000 * 60 * 60 * 24))
  );
}

export function isRecentlyCreated(
  createdAt?: string | null,
  days = 7
): boolean {
  if (!createdAt) return false;
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return false;
  return Date.now() - createdMs < days * 24 * 60 * 60 * 1000;
}

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export interface KstDateParts {
  year: number;
  month: string;
  day: string;
}

export function getKstDateParts(
  input: string | number | Date
): KstDateParts | null {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  const parts = KST_DATE_FORMATTER.formatToParts(d);
  const yearStr = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const year = yearStr ? Number(yearStr) : Number.NaN;
  if (!Number.isFinite(year) || !month || !day) return null;
  return { year, month, day };
}

export function getKstDateKey(input: string | number | Date): string {
  const parts = getKstDateParts(input);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatKstShortDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const parts = getKstDateParts(dateStr);
  if (!parts) return "";
  return `${Number(parts.month)}.${parts.day}`;
}

export function formatKstBoardDate(
  dateStr?: string | null,
  referenceDate: Date = new Date()
): string {
  if (!dateStr) return "";
  const target = getKstDateParts(dateStr);
  const ref = getKstDateParts(referenceDate);
  if (!target || !ref) return "";
  return target.year === ref.year
    ? `${target.month}-${target.day}`
    : `${String(target.year).slice(2)}-${target.month}-${target.day}`;
}

export function isWithinKstDays(
  createdAt: string | null | undefined,
  referenceKstDateKey: string,
  days = 7
): boolean {
  if (!createdAt || !referenceKstDateKey) return false;
  const createdKey = getKstDateKey(createdAt);
  if (!createdKey) return false;
  const createdUtc = Date.parse(`${createdKey}T00:00:00Z`);
  const refUtc = Date.parse(`${referenceKstDateKey}T00:00:00Z`);
  if (Number.isNaN(createdUtc) || Number.isNaN(refUtc)) return false;
  const diffDays = Math.floor((refUtc - createdUtc) / (24 * 60 * 60 * 1000));
  return diffDays >= 0 && diffDays <= days;
}

export const telHref = (num: string) => `tel:${num.replace(/[^0-9+]/g, "")}`;

export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export const isValidPhone = (value: string): boolean => {
  const cleaned = value.replace(/\D/g, "");
  return /^0\d{8,10}$/.test(cleaned);
};

export function maskName(rawName?: string | null): string {
  const t = (rawName ?? "").trim();
  if (!t) return "고*객";

  // "한밭식당(중촌동)" 또는 "홍길동 (둔산동)" 형태의 지역 괄호 분리 마스킹
  const match = t.match(/^(.*?)\s*(\(.*\))$/);
  if (match) {
    const main = match[1].trim();
    const region = match[2].trim();
    if (main.length <= 1) return `${main}* ${region}`;
    if (main.length === 2) return `${main.charAt(0)}* ${region}`;
    return `${main.charAt(0)}${"*".repeat(Math.min(main.length - 2, 3))}${main.slice(-1)} ${region}`;
  }

  if (t.length === 1) return `${t}*`;
  if (t.length === 2) return `${t.charAt(0)}*`;
  return `${t.charAt(0)}${"*".repeat(Math.min(t.length - 2, 3))}${t.slice(-1)}`;
}

export function maskPhone(rawPhone?: string | null): string {
  const cleaned = (rawPhone ?? "").replace(/\D/g, "");
  if (cleaned.length < 7) return "***-****";
  return `${cleaned.slice(0, 3)}-****-${cleaned.slice(-4)}`;
}

/**
 * next/image 최적화 대상 이미지 URL 판별 (자체 정적 자산 및 Supabase Storage HTTPS)
 */
export function canUseNextImageUrl(url: string | null | undefined): url is string {
  return Boolean(
    url &&
      (url.startsWith("/") ||
        /^https:\/\/[a-z0-9-]+\.supabase\.co\//i.test(url))
  );
}
