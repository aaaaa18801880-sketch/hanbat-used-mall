-- ============================================================================
-- 파일 경로: supabase/security-hardening-migration.sql
-- 한밭중고전자(hanbat-mall) 운영 보안 강화 및 원자적(Atomic) 동시성 제어 마이그레이션
-- 주의: 이 파일은 검토용 SQL 스크립트이며, 관리자 검토 후 Supabase SQL Editor에서 실행합니다.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. 상품 조회수 원자적 증가 RPC (Race Condition 방지)
-- app/api/products/[id]/view/route.ts 에서 호출하며, 단일 UPDATE ... RETURNING으로 동작
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_product_views(target_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_views integer;
BEGIN
  UPDATE public.products
  SET views = COALESCE(views, 0) + 1
  WHERE id::text = target_id
  RETURNING views INTO new_views;

  RETURN new_views;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_product_views(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_product_views(text) TO service_role;

-- ----------------------------------------------------------------------------
-- 2. 서버리스 멀티 인스턴스 분산 Rate Limit 테이블 및 원자적 검증 RPC
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  rate_key text PRIMARY KEY,
  attempt_count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- 외부(anon/authenticated) 직접 접근 전면 차단 (service_role 전용)
DROP POLICY IF EXISTS "Deny all public access to api_rate_limits" ON public.api_rate_limits;
CREATE POLICY "Deny all public access to api_rate_limits"
  ON public.api_rate_limits
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.check_rate_limit_atomic(
  p_key text,
  p_max_attempts integer,
  p_window_sec integer
)
RETURNS TABLE(allowed boolean, retry_after_sec integer, current_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_reset timestamptz := v_now + make_interval(secs => p_window_sec);
  v_row public.api_rate_limits%ROWTYPE;
BEGIN
  -- 만료된 레코드 경량 정리 (확률적 GC)
  IF random() < 0.02 THEN
    DELETE FROM public.api_rate_limits WHERE reset_at < v_now;
  END IF;

  INSERT INTO public.api_rate_limits (rate_key, attempt_count, reset_at, updated_at)
  VALUES (p_key, 1, v_reset, v_now)
  ON CONFLICT (rate_key) DO UPDATE
    SET attempt_count = CASE
          WHEN public.api_rate_limits.reset_at < v_now THEN 1
          ELSE public.api_rate_limits.attempt_count + 1
        END,
        reset_at = CASE
          WHEN public.api_rate_limits.reset_at < v_now THEN v_reset
          ELSE public.api_rate_limits.reset_at
        END,
        updated_at = v_now
  RETURNING * INTO v_row;

  IF v_row.attempt_count > p_max_attempts THEN
    RETURN QUERY SELECT
      false,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_row.reset_at - v_now)))::integer),
      v_row.attempt_count;
  ELSE
    RETURN QUERY SELECT
      true,
      0,
      v_row.attempt_count;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit_atomic(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit_atomic(text, integer, integer) TO service_role;

-- ----------------------------------------------------------------------------
-- 3. 비공개 첨부파일 버킷(inquiry-attachments) 용량·MIME·경로 제한 강화
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inquiry-attachments',
  'inquiry-attachments',
  false,
  6291456, -- 6MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 6291456,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

DROP POLICY IF EXISTS "Public Upload Inquiry Attachments" ON storage.objects;
CREATE POLICY "Public Upload Inquiry Attachments"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'inquiry-attachments'
    AND (storage.foldername(name))[1] = 'inquiries'
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')
  );

-- ----------------------------------------------------------------------------
-- 4. 조회 및 필터링 성능 최적화를 위한 복합 인덱스 보강
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category_status_created
  ON public.products (category, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_notice_status_created
  ON public.purchase_requests (is_notice, status, created_at DESC);

COMMIT;
