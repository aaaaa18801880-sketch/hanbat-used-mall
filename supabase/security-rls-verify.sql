-- ==============================================================================
-- 파일 경로: supabase/security-rls-verify.sql
-- 설명: security-rls-policies.sql 적용 후 노출 여부를 확인하는 점검 쿼리입니다.
--       SQL 편집기에서 항목별로 실행하고 기대값과 비교합니다. 데이터를 바꾸지 않습니다.
--       A~C 중 "permission denied" 오류가 나면 익명 역할의 테이블 접근이 막혔다는 뜻이므로 정상입니다.
-- ==============================================================================

-- A. 익명(anon) 역할: 공지가 아닌 고객 문의가 보이면 안 됩니다. 기대값 0
SET ROLE anon;
SELECT count(*) AS anon_visible_customer_inquiries
FROM public.purchase_requests
WHERE is_notice IS NOT TRUE;

-- B. 익명 역할: 고객 첨부 사진 버킷 목록이 보이면 안 됩니다. 기대값 0
SELECT count(*) AS anon_visible_inquiry_attachments
FROM storage.objects
WHERE bucket_id = 'inquiry-attachments';

-- C. 익명 역할: 상품·공지에 연결되지 않은 공개 버킷 객체 목록이 보이면 안 됩니다. 기대값 0
SELECT count(*) AS anon_visible_unreferenced_inquiries_objects
FROM storage.objects o
WHERE o.bucket_id = 'inquiries'
  AND NOT EXISTS (SELECT 1 FROM public.products p WHERE strpos(coalesce(p.image_url, ''), o.name) > 0)
  AND NOT EXISTS (SELECT 1 FROM public.purchase_requests pr WHERE pr.is_notice = true AND strpos(coalesce(pr.images::text, ''), o.name) > 0);
RESET ROLE;

-- D. 정책 목록 (1단계 전 백업용, 2단계 후 비교용)
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

-- E. 버킷 설정 (inquiry-attachments: public = false, inquiries·product-images: public = true 기대)
SELECT id, public, file_size_limit, allowed_mime_types
FROM storage.buckets
ORDER BY id;
