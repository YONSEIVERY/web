-- supabase/seed.sql
-- 학회 운영진 화이트리스트와 site_config 첫 행 (idempotent)

insert into public.admins (email, name) values
  ('ricky7@yonsei.ac.kr', '회장')   -- 사용자 본인 (필요 시 추가 임원진 append)
on conflict (email) do nothing;

insert into public.site_config (key, cohort, year, semester, since_year) values
  ('current', 43, 2026, '1학기', 1997)
on conflict (key) do nothing;
