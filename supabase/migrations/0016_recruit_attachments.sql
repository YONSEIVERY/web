-- supabase/migrations/0016_recruit_attachments.sql
--
-- 44기 지원서 문서가 안내하는 첨부 2종(사업계획서, 작업물 ZIP)을 받는다.
-- 업로드는 서명 업로드(브라우저 → 스토리지 직접)로 전환: Vercel 요청 본문
-- 4.5MB 하드 제한을 우회하고, 증명사진 포함 대용량 지원서도 수용한다.
--
-- 버킷 mime 제한은 해제한다: 사업계획서가 "문서형식 자유"(hwp 등 비표준
-- mime 포함)라 버킷 단에서 못 거른다. 확장자·크기 검증은 서버 액션이
-- 티켓 발급과 접수 확정 시 수행하며, 버킷은 private라 공개 노출이 없다.
-- 전체 멱등.

alter table public.applications
  add column if not exists business_plan_path text,
  add column if not exists business_plan_name text,
  add column if not exists portfolio_path text,
  add column if not exists portfolio_name text;

update storage.buckets
set file_size_limit = 31457280, -- 30MB (작업물 ZIP 상한)
    allowed_mime_types = null
where id = 'recruit-applications';

select 'ATTACHMENTS_MIGRATION_OK' as result,
  (select file_size_limit from storage.buckets where id = 'recruit-applications') as bucket_limit;
