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
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

/**
 * 최소 권한 원칙(Least Privilege)을 위한 Anon + 선택적 사용자 JWT 전용 서버 클라이언트
 * - 관리자 JWT 검증(auth.getUser) 및 일반 권한 요청 시 Service Role 오남용을 방지합니다.
 */
export function createAnonServerClient(accessToken?: string): SupabaseClient {
  return createServerSupabaseClient(accessToken, false);
}

/**
 * 서버 백엔드 전용 Service Role 클라이언트
 * - RLS 우회가 반드시 필요한 서버 내부 작업(비공개 문의 비밀번호 대조 등)에만 제한적으로 사용합니다.
 */
export function createServiceRoleClient(): SupabaseClient {
  return createServerSupabaseClient(undefined, true);
}

export async function revalidateAdminCache(productId?: string | number): Promise<void> {
  try {
    const headers = await getAdminAuthHeaders();
    await fetch("/api/admin/revalidate", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId ? String(productId) : undefined }),
    });
  } catch {
    // Non-blocking
  }
}
