-- supabase/migrations/0002_hardening.sql

-- ============================================================
-- site_config 단일 행 보장 — key는 항상 'current'
-- 선제 DELETE: dashboard에서 수동 시드한 비-'current' 행이 있어도
-- ADD CONSTRAINT check violation으로 마이그레이션이 실패하지 않도록.
-- ============================================================
delete from public.site_config where key <> 'current';

alter table public.site_config
  add constraint site_config_singleton_key check (key = 'current');

-- ============================================================
-- Storage 버킷 방어: 2MB 상한 + PNG/JPEG/SVG MIME 화이트리스트
-- 0001에서 이미 INSERT된 행을 UPDATE → 0001 적용 여부와 무관하게 동작
-- ============================================================
update storage.buckets
  set file_size_limit = 2097152,
      allowed_mime_types = array['image/png','image/jpeg','image/svg+xml']
  where id in ('alumni-company-logos','partner-logos');
