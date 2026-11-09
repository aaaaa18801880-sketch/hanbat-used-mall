-- ============================================================================
-- 파일 경로: supabase/security-hardening-migration.sql
-- 한밭중고전자(hanbat-mall) 2차 보안 강화 및 분산 동시성 제어 마이그레이션
-- 주의: 이 파일은 검토용 SQL 스크립트이며, 관리자 검토 후 Supabase SQL Editor에서 실행합니다.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. 상품 조회수 원자적 증가 RPC (Race Condition 방지)
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
-- 2. 서버리스 멀티 인스턴스 분산 Rate Limit 테이블 및 원자적 검증 RPC (SEC-001)
-- - p_key에는 원문 IP 대신 SHA-256 해시된 식별 키가 저장됩니다.
-- - p_increment = false 일 때는 카운트를 증가시키지 않고 잠금(Lockout) 도달 여부만 원자적으로 조회합니다.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  rate_key text PRIMARY KEY,
  attempt_count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

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
  p_window_sec integer,
  p_increment boolean DEFAULT true
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
  IF random() < 0.02 THEN
    DELETE FROM public.api_rate_limits WHERE reset_at < v_now;
  END IF;

  IF NOT p_increment THEN
    SELECT * INTO v_row
    FROM public.api_rate_limits
    WHERE rate_key = p_key AND reset_at >= v_now;

    IF NOT FOUND THEN
      RETURN QUERY SELECT true, 0, 0;
      RETURN;
    END IF;

    IF v_row.attempt_count >= p_max_attempts THEN
      RETURN QUERY SELECT
        false,
        GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_row.reset_at - v_now)))::integer),
        v_row.attempt_count;
    ELSE
      RETURN QUERY SELECT true, 0, v_row.attempt_count;
    END IF;
    RETURN;
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

REVOKE ALL ON FUNCTION public.check_rate_limit_atomic(text, integer, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit_atomic(text, integer, integer, boolean) TO service_role;

-- ----------------------------------------------------------------------------
-- 3. 서버리스 멀티 인스턴스 알림 발송 멱등성 상태 머신 테이블 및 RPC (REL-001)
-- - 상태: PENDING(발송 중) -> SENT(발송 완료) / FAILED(실패·폴백 재시도 허용)
-- - 일정 시간(p_stale_pending_sec)이 경과한 고착 PENDING 상태는 자동으로 복구하여 재시도를 허용합니다.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_dispatches (
  dedup_key text PRIMARY KEY,
  channel text NOT NULL DEFAULT 'telegram',
  status text NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  attempt_count integer NOT NULL DEFAULT 1,
  last_error text,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all public access to notification_dispatches" ON public.notification_dispatches;
CREATE POLICY "Deny all public access to notification_dispatches"
  ON public.notification_dispatches
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.claim_notification_idempotency(
  p_dedup_key text,
  p_channel text DEFAULT 'telegram',
  p_ttl_sec integer DEFAULT 180,
  p_stale_pending_sec integer DEFAULT 8,
  p_force_retry boolean DEFAULT false
)
RETURNS TABLE(is_duplicate boolean, current_status text, attempt_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_expires timestamptz := v_now + make_interval(secs => p_ttl_sec);
  v_existing public.notification_dispatches%ROWTYPE;
BEGIN
  IF random() < 0.02 THEN
    DELETE FROM public.notification_dispatches WHERE expires_at < v_now;
  END IF;

  SELECT * INTO v_existing
  FROM public.notification_dispatches
  WHERE dedup_key = p_dedup_key
  FOR UPDATE;

  IF FOUND AND v_existing.expires_at > v_now AND NOT p_force_retry THEN
    IF v_existing.status = 'SENT' THEN
      RETURN QUERY SELECT true, v_existing.status, v_existing.attempt_count;
      RETURN;
    END IF;

    IF v_existing.status = 'PENDING'
       AND v_existing.updated_at > (v_now - make_interval(secs => p_stale_pending_sec)) THEN
      RETURN QUERY SELECT true, v_existing.status, v_existing.attempt_count;
      RETURN;
    END IF;
  END IF;

  INSERT INTO public.notification_dispatches (
    dedup_key, channel, status, attempt_count, last_error, expires_at, updated_at
  )
  VALUES (
    p_dedup_key, p_channel, 'PENDING', 1, NULL, v_expires, v_now
  )
  ON CONFLICT (dedup_key) DO UPDATE
    SET status = 'PENDING',
        channel = EXCLUDED.channel,
        attempt_count = CASE
          WHEN public.notification_dispatches.expires_at <= v_now THEN 1
          ELSE public.notification_dispatches.attempt_count + 1
        END,
        expires_at = v_expires,
        updated_at = v_now
  RETURNING * INTO v_existing;

  RETURN QUERY SELECT false, v_existing.status, v_existing.attempt_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_notification_idempotency(
  p_dedup_key text,
  p_status text,
  p_ttl_sec integer DEFAULT 180,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  UPDATE public.notification_dispatches
  SET status = p_status,
      last_error = p_error,
      expires_at = v_now + make_interval(secs => p_ttl_sec),
      updated_at = v_now
  WHERE dedup_key = p_dedup_key;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_notification_idempotency(text, text, integer, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_notification_idempotency(text, text, integer, integer, boolean) TO service_role;

REVOKE ALL ON FUNCTION public.complete_notification_idempotency(text, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_notification_idempotency(text, text, integer, text) TO service_role;

-- ----------------------------------------------------------------------------
-- 4. 비공개 첨부파일 버킷(inquiry-attachments) 기존 넓은 정책 제거 및 단일 정책 통일 (SEC-002)
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

-- 기존 넓은 정책과 임시 정책 이름을 모두 DROP 후 단일 정책으로 통일 (OR 결합 우회 원천 차단)
DROP POLICY IF EXISTS "Public Upload Inquiry Attachments" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_inquiry_attachments_public" ON storage.objects;

CREATE POLICY "storage_insert_inquiry_attachments_public"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'inquiry-attachments'
    AND (storage.foldername(name))[1] = 'inquiries'
    AND array_length(storage.foldername(name), 1) = 1
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')
    AND length(name) <= 120
  );

-- ----------------------------------------------------------------------------
-- 5. 조회 및 필터링 성능 최적화를 위한 복합 인덱스 보강
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category_status_created
  ON public.products (category, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_notice_status_created
  ON public.purchase_requests (is_notice, status, created_at DESC);

COMMIT;
