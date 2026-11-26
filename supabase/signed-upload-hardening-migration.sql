-- ==============================================================================
-- 파일 경로: supabase/signed-upload-hardening-migration.sql
-- 설명: [P0-1] POST /api/inquiries/upload-url 배포 완료 후 익명(anon) 직접 Storage 업로드 차단
-- 실행 시점: Next.js 앱 배포(서명 업로드 URL 전환)가 운영에 반영된 직후 1회 실행합니다.
-- ==============================================================================

BEGIN;

DROP POLICY IF EXISTS "Public Upload Inquiry Attachments" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_inquiry_attachments_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_inquiry_attachments_staff" ON storage.objects;

CREATE POLICY "storage_insert_inquiry_attachments_staff"
ON storage.objects
FOR INSERT
TO authenticated, service_role
WITH CHECK (
  bucket_id = 'inquiry-attachments'
  AND ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_hanbat_admin()))
  AND (storage.foldername(name))[1] = 'inquiries'
  AND array_length(storage.foldername(name), 1) = 1
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')
  AND length(name) <= 120
);

COMMIT;
