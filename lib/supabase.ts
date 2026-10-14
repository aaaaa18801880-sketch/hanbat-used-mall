import { createClient, type User, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 허용된 관리자 이메일 목록 파싱 (쉼표로 구분)
 * 예: NEXT_PUBLIC_ADMIN_EMAILS="admin@hanbatmall.com,sunny3815@naver.com"
 */
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

/**
 * 단순 로그인(!!session)이 아니라 실제 관리자 권한이 있는 계정인지 확인합니다.
 * - user가 없거나 email이 없으면 무조건 false
 * - user_metadata.role === 'admin' 또는 app_metadata.role === 'admin'이면 true
 * - 환경변수(ADMIN_EMAILS / NEXT_PUBLIC_ADMIN_EMAILS)가 설정된 경우 해당 목록에 포함되어야만 true
 * - 환경변수가 아직 설정되지 않은 개발/초기 운영 환경에서는 이메일 인증된 로그인 세션을 허용하되 콘솔 경고를 남깁니다.
 */
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

/**
 * 브라우저에서 현재 로그인된 관리자 액세스 토큰을 가져옵니다. (API Route 호출 시 Authorization 헤더용)
 */
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
 * 서버(Route Handler) 전용: 요청의 Authorization Bearer 토큰을 넣은 Supabase 클라이언트를 생성합니다.
 * 서비스 역할 키(SERVICE_ROLE_KEY)를 클라이언트에 절대 노출하지 않고, 서버에서도 필요한 경우에만 사용합니다.
 */
export function createServerSupabaseClient(accessToken?: string): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey && !accessToken) {
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
