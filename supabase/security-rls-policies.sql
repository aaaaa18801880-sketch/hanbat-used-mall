-- ==============================================================================
-- 파일 경로: supabase/security-rls-policies.sql
-- 설명: 한밭중고전자(hanbat-mall) Supabase 프로덕션 RLS(행 단위 보안) 및 Storage 보안 정책
-- 적용 대상 테이블: public.products, public.purchase_requests, storage.objects
-- 관리자 계정: cocomat@naver.com (STORE.adminEmail) 및 service_role
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. public.products 테이블 RLS 활성화 및 권한 설정
-- ------------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 1-1. [SELECT] 일반 방문자 및 검색엔진: 등록된 모든 매물 조회 허용
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public"
ON public.products
FOR SELECT
TO public
USING (true);

-- 1-2. [INSERT] 인가된 관리자 및 service_role만 신규 상품 등록 허용
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin"
ON public.products
FOR INSERT
TO authenticated, service_role
WITH CHECK (
  auth.role() = 'service_role' OR
  (auth.jwt()->>'email' = 'cocomat@naver.com')
);

-- 1-3. [UPDATE] 인가된 관리자 및 service_role만 상품 정보 수정 허용
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin"
ON public.products
FOR UPDATE
TO authenticated, service_role
USING (
  auth.role() = 'service_role' OR
  (auth.jwt()->>'email' = 'cocomat@naver.com')
)
WITH CHECK (
  auth.role() = 'service_role' OR
  (auth.jwt()->>'email' = 'cocomat@naver.com')
);

-- 1-4. [DELETE] 인가된 관리자 및 service_role만 상품 영구 삭제 허용
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin"
ON public.products
FOR DELETE
TO authenticated, service_role
USING (
  auth.role() = 'service_role' OR
  (auth.jwt()->>'email' = 'cocomat@naver.com')
);


-- ------------------------------------------------------------------------------
-- 2. public.purchase_requests (고객 문의 및 매입 신청) RLS 활성화 및 권한 설정
-- ------------------------------------------------------------------------------
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

-- 2-1. [SELECT]
--  - 일반 방문자: 등록된 공지사항(is_notice = true)만 조회 허용
--  - 인가된 관리자 및 service_role: 모든 고객 문의·매입 신청 내역 전체 조회
DROP POLICY IF EXISTS "purchase_requests_select_policy" ON public.purchase_requests;
CREATE POLICY "purchase_requests_select_policy"
ON public.purchase_requests
FOR SELECT
TO public
USING (
  (is_notice = true) OR
  (auth.role() = 'service_role') OR
  (auth.jwt()->>'email' = 'cocomat@naver.com')
);

-- 2-2. [INSERT]
--  - 일반 고객: 문의 접수 허용 (단, 익명 고객이 공지사항(is_notice = true)을 등록하는 것은 방지)
--  - 인가된 관리자 및 service_role: 공지사항 포함 모든 접수 등록 허용
DROP POLICY IF EXISTS "purchase_requests_insert_policy" ON public.purchase_requests;
CREATE POLICY "purchase_requests_insert_policy"
ON public.purchase_requests
FOR INSERT
TO public
WITH CHECK (
  (auth.role() = 'service_role') OR
  (auth.jwt()->>'email' = 'cocomat@naver.com') OR
  (is_notice IS NOT TRUE)
);

-- 2-3. [UPDATE] 인가된 관리자 및 service_role만 진행 상태 변경 및 관리자 답변 저장 허용
DROP POLICY IF EXISTS "purchase_requests_update_admin" ON public.purchase_requests;
CREATE POLICY "purchase_requests_update_admin"
ON public.purchase_requests
FOR UPDATE
TO authenticated, service_role
USING (
  auth.role() = 'service_role' OR
  (auth.jwt()->>'email' = 'cocomat@naver.com')
)
WITH CHECK (
  auth.role() = 'service_role' OR
  (auth.jwt()->>'email' = 'cocomat@naver.com')
);

-- 2-4. [DELETE] 인가된 관리자 및 service_role만 문의 내역 삭제 허용
DROP POLICY IF EXISTS "purchase_requests_delete_admin" ON public.purchase_requests;
CREATE POLICY "purchase_requests_delete_admin"
ON public.purchase_requests
FOR DELETE
TO authenticated, service_role
USING (
  auth.role() = 'service_role' OR
  (auth.jwt()->>'email' = 'cocomat@naver.com')
);


-- ------------------------------------------------------------------------------
-- 3. storage.objects (Supabase Storage 버킷: inquiries, product-images) 보안 정책
-- ------------------------------------------------------------------------------

-- 3-1. [SELECT] 누구나 상품 사진 및 문의 첨부 사진 읽기 가능 (public bucket)
DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
CREATE POLICY "storage_select_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id IN ('inquiries', 'product-images'));

-- 3-2. [INSERT] 누구나 inquiries 버킷에 사진 업로드 가능 (고객 견적 사진 및 관리자 상품 사진)
DROP POLICY IF EXISTS "storage_insert_inquiries" ON storage.objects;
CREATE POLICY "storage_insert_inquiries"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'inquiries');

-- 3-3. [DELETE] 인가된 관리자 및 service_role만 스토리지 파일 삭제 가능
DROP POLICY IF EXISTS "storage_delete_admin" ON storage.objects;
CREATE POLICY "storage_delete_admin"
ON storage.objects
FOR DELETE
TO authenticated, service_role
USING (
  (bucket_id IN ('inquiries', 'product-images')) AND
  (auth.role() = 'service_role' OR auth.jwt()->>'email' = 'cocomat@naver.com')
);
