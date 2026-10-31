-- ==============================================================================
-- 파일 경로: supabase/security-rls-policies.sql
-- 설명: 한밭중고전자(hanbat-mall) Supabase RLS(행 단위 보안) 및 Storage 보안 정책
-- 적용 대상: public.products, public.purchase_requests, storage.objects
-- 관리자 계정: sunny3815@naver.com (lib/supabase.ts 의 DEFAULT_ADMIN_EMAILS 와 동일 기준)
--
-- 실행 순서 (각 단계를 SQL 편집기에서 따로 실행합니다)
--   0. 사전 백업: security-rls-verify.sql 의 D 항목(정책 목록) 결과를 저장합니다.
--   1단계: 지금 실행해도 안전합니다. 고객 사진 비공개 버킷과 관리자 판별 함수를 만듭니다.
--   [코드 배포] 새 업로드 경로(inquiry-attachments)와 서명 URL 발급 코드를 배포합니다.
--   [마이그레이션] scripts/migrate-inquiry-attachments.mjs 로 기존 고객 사진을 옮깁니다.
--   2단계: Vercel 운영 환경에 SUPABASE_SERVICE_ROLE_KEY 가 설정된 것을 확인한 뒤에만 실행합니다.
--          키가 없으면 고객 문의 조회와 첨부 사진 표시가 중단됩니다.
--   3. 검증: supabase/security-rls-verify.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1단계 (코드 배포 전 실행 가능)
-- ------------------------------------------------------------------------------
BEGIN;

-- 1-1. 관리자 판별 함수 (관리자 이메일 또는 app_metadata.role = 'admin', 앱의 isAuthorizedAdminUser 와 동일 기준)
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

-- 1-2. 고객 첨부 사진 전용 비공개 버킷 (공개 URL 접근 불가, 서버가 서명 URL로만 제공)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('inquiry-attachments', 'inquiry-attachments', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 1-3. 고객 첨부 사진 업로드 (고객이 문의 작성 시 브라우저에서 직접 업로드)
DROP POLICY IF EXISTS "storage_insert_inquiry_attachments_public" ON storage.objects;
CREATE POLICY "storage_insert_inquiry_attachments_public"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'inquiry-attachments');

-- 1-4. 고객 첨부 사진 조회: 관리자와 서비스 롤만
DROP POLICY IF EXISTS "storage_select_inquiry_attachments_staff" ON storage.objects;
CREATE POLICY "storage_select_inquiry_attachments_staff"
ON storage.objects
FOR SELECT
TO authenticated, service_role
USING (
  bucket_id = 'inquiry-attachments' AND
  ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_hanbat_admin()))
);

-- 1-5. 관리자의 상품·공지 사진 업로드 (관리자 세션 전용, 익명 업로드 차단은 2단계에서 적용)
DROP POLICY IF EXISTS "storage_insert_staff_product_photos" ON storage.objects;
CREATE POLICY "storage_insert_staff_product_photos"
ON storage.objects
FOR INSERT
TO authenticated, service_role
WITH CHECK (
  bucket_id IN ('inquiries', 'product-images') AND
  ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_hanbat_admin()))
);

-- 1-6. 삭제: 관리자와 서비스 롤만 (기존 cocomat@naver.com 기준 정책을 대체)
DROP POLICY IF EXISTS "storage_delete_admin" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_staff" ON storage.objects;
CREATE POLICY "storage_delete_staff"
ON storage.objects
FOR DELETE
TO authenticated, service_role
USING (
  bucket_id IN ('inquiries', 'product-images', 'inquiry-attachments') AND
  ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_hanbat_admin()))
);

COMMIT;

-- ------------------------------------------------------------------------------
-- 2단계 (코드 배포 + 마이그레이션 완료 후, SUPABASE_SERVICE_ROLE_KEY 확인 뒤 실행)
-- ------------------------------------------------------------------------------
BEGIN;

-- 2-1. 고객 문의(purchase_requests): 익명 방문자는 공지만 조회, 고객 문의는 서버 API를 통해서만 접근
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'purchase_requests' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.purchase_requests', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "purchase_requests_select_notice_or_staff"
ON public.purchase_requests
FOR SELECT
TO public
USING (
  is_notice = true OR
  (SELECT auth.role()) = 'service_role' OR
  (SELECT public.is_hanbat_admin())
);

CREATE POLICY "purchase_requests_insert_customer_or_staff"
ON public.purchase_requests
FOR INSERT
TO public
WITH CHECK (
  (SELECT auth.role()) = 'service_role' OR
  (SELECT public.is_hanbat_admin()) OR
  (is_notice IS NOT TRUE AND admin_reply IS NULL AND (status IS NULL OR status = '접수'))
);

CREATE POLICY "purchase_requests_update_staff"
ON public.purchase_requests
FOR UPDATE
TO authenticated, service_role
USING ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_hanbat_admin()))
WITH CHECK ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_hanbat_admin()));

CREATE POLICY "purchase_requests_delete_staff"
ON public.purchase_requests
FOR DELETE
TO authenticated, service_role
USING ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_hanbat_admin()));

-- 2-2. 상품(products): 공개 조회, 등록·수정·삭제는 관리자와 서비스 롤만
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "products_select_public"
ON public.products
FOR SELECT
TO public
USING (true);

CREATE POLICY "products_insert_staff"
ON public.products
FOR INSERT
TO authenticated, service_role
WITH CHECK ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_hanbat_admin()));

CREATE POLICY "products_update_staff"
ON public.products
FOR UPDATE
TO authenticated, service_role
USING ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_hanbat_admin()))
WITH CHECK ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_hanbat_admin()));

CREATE POLICY "products_delete_staff"
ON public.products
FOR DELETE
TO authenticated, service_role
USING ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_hanbat_admin()));

-- 2-3. Storage: 공개 버킷(inquiries)에 남아 있던 익명 업로드·전체 조회 정책 제거
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (
        coalesce(qual, '') ILIKE '%inquiries%' OR
        coalesce(with_check, '') ILIKE '%inquiries%' OR
        coalesce(qual, '') ILIKE '%product-images%' OR
        coalesce(with_check, '') ILIKE '%product-images%'
      )
      AND policyname NOT IN (
        'storage_insert_staff_product_photos',
        'storage_delete_staff',
        'storage_insert_inquiry_attachments_public',
        'storage_select_inquiry_attachments_staff'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "storage_select_product_images_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 공개 버킷(inquiries)은 상품·공지 사진 전용으로 유지하고, 목록 조회는 상품·공지에 연결된 객체로만 제한
CREATE POLICY "storage_select_inquiries_referenced_public"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'inquiries' AND (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE strpos(coalesce(p.image_url, ''), storage.objects.name) > 0
    ) OR
    EXISTS (
      SELECT 1 FROM public.purchase_requests pr
      WHERE pr.is_notice = true AND strpos(coalesce(pr.images::text, ''), storage.objects.name) > 0
    ) OR
    (SELECT auth.role()) = 'service_role' OR
    (SELECT public.is_hanbat_admin())
  )
);

COMMIT;
