// 파일 경로: lib/supabase.ts
import { createClient, type User, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEFAULT_ADMIN_EMAILS = ["sunny3815@naver.com"];

export function getAllowedAdminEmails(): string[] {
  const raw =
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    "";
  const parsed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...parsed]));
}

/**
 * 관리자 권한 검증 (Fail-Closed)
 * - 일반 사용자가 임의 수정 가능한 user_metadata는 절대 신뢰하지 않고 app_metadata만 확인합니다.
 * - 등록된 관리자 이메일 화이트리스트에 포함된 계정만 관리자로 인가합니다.
 */
export function isAuthorizedAdminUser(user?: User | null): boolean {
  if (!user || !user.email) return false;

  const appRole = user.app_metadata && user.app_metadata.role;
  if (appRole === "admin") return true;

  const allowedEmails = getAllowedAdminEmails();
  return allowedEmails.includes(user.email.trim().toLowerCase());
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
