-- ==============================================================================
-- 파일 경로: supabase/telegram-inbox-migration.sql
-- 설명: 텔레그램 사진 수집함(telegram_inbox_photos) 테이블 및 검수대기(비공개) RLS 정책
-- 주의: 이 파일은 관리자 검토 후 Supabase SQL Editor에서 1회 실행합니다.
--       전제조건: supabase/security-rls-policies.sql 1단계의 public.is_hanbat_admin() 함수 필요
-- ==============================================================================

BEGIN;

-- 1. 관리자 판별 함수가 아직 없는 환경을 위한 안전 보장
CREATE OR REPLACE FUNCTION public.is_hanbat_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'sunny3815@naver.com'
    OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

-- 2. 텔레그램 사진 수집함 메타데이터 테이블
--    (원본 이미지 바이너리는 Supabase에 선저장하지 않고 file_id 만 경량 기록)
CREATE TABLE IF NOT EXISTS public.telegram_inbox_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_update_id bigint UNIQUE,
  chat_id text NOT NULL,
  message_id bigint NOT NULL,
  media_group_id text,
  file_id text NOT NULL,
  file_unique_id text NOT NULL,
  thumb_file_id text,
  source_kind text NOT NULL DEFAULT 'photo'
    CHECK (source_kind IN ('photo', 'document')),
  mime_type text,
  file_size integer,
  width integer,
  height integer,
  group_key text,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'committed', 'discarded')),
  committed_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ai_note text,
  taken_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 중복 웹훅 수신 방지 (chat_id + message_id + file_unique_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_telegram_inbox_msg_file
  ON public.telegram_inbox_photos (chat_id, message_id, file_unique_id);

-- 대기중인 사진 시간순 고속 조회용 부분 인덱스 (Partial Index)
CREATE INDEX IF NOT EXISTS idx_telegram_inbox_pending_chronological
  ON public.telegram_inbox_photos (taken_at ASC, message_id ASC, sort_order ASC)
  WHERE status = 'pending';

-- 연결된 등록 상품 역참조 인덱스
CREATE INDEX IF NOT EXISTS idx_telegram_inbox_committed_product
  ON public.telegram_inbox_photos (committed_product_id)
  WHERE committed_product_id IS NOT NULL;

-- 3. telegram_inbox_photos RLS: 익명 사용자 접근 원천 차단, 관리자 및 서비스 롤 전용
ALTER TABLE public.telegram_inbox_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "telegram_inbox_staff_all" ON public.telegram_inbox_photos;
CREATE POLICY "telegram_inbox_staff_all"
  ON public.telegram_inbox_photos
  FOR ALL
  TO authenticated, service_role
  USING (
    (SELECT auth.role()) = 'service_role'
    OR (SELECT public.is_hanbat_admin())
  )
  WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR (SELECT public.is_hanbat_admin())
  );

-- Explicit deny-all for anon role on exposed schema
DROP POLICY IF EXISTS "telegram_inbox_deny_anon" ON public.telegram_inbox_photos;
CREATE POLICY "telegram_inbox_deny_anon"
  ON public.telegram_inbox_photos
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- 4. products 공개 조회 정책 보강: '검수대기' 상품은 일반 방문자(anon)에게 비노출
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public"
  ON public.products
  FOR SELECT
  TO public
  USING (
    status IS DISTINCT FROM '검수대기'
    OR (SELECT auth.role()) = 'service_role'
    OR (SELECT public.is_hanbat_admin())
  );

-- 5. inquiries 스토리지 버킷에 allowed_mime_types 제약이 걸려 있을 경우 image/webp 허용 보장
UPDATE storage.buckets
SET allowed_mime_types = array(
  SELECT DISTINCT elem
  FROM unnest(coalesce(allowed_mime_types, ARRAY[]::text[]) || ARRAY['image/webp', 'image/jpeg', 'image/png']) AS elem
)
WHERE id = 'inquiries'
  AND allowed_mime_types IS NOT NULL
  AND NOT ('image/webp' = ANY(allowed_mime_types));

COMMIT;
