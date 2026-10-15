import { createClient, type User, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getAllowedAdminEmails(): string[] {
  const raw =
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAuthorizedAdminUser(user?: User | null): boolean {
  if (!user || !user.email) return false;

  const metaRole =
    (user.app_metadata && user.app_metadata.role) ||
    (user.user_metadata && user.user_metadata.role);
  if (metaRole === "admin") return true;

  const allowedEmails = getAllowedAdminEmails();
  if (allowedEmails.length > 0) {
    return allowedEmails.includes(user.email.toLowerCase());
  }

  return Boolean(user.id && user.email);
}

export async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

/**
 * 서버(Route Handler) 전용 Supabase 클라이언트 생성
 * - 서버에 SUPABASE_SERVICE_ROLE_KEY가 설정되어 있고 useServiceRole이 true이면,
 *   서버가 자체 검증(관리자 인증 또는 비밀번호 대조)을 마친 후 RLS 제약 없이 안전하게 쿼리를 수행합니다.
 */
export function createServerSupabaseClient(
  accessToken?: string,
  useServiceRole = true
): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey && useServiceRole) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}
