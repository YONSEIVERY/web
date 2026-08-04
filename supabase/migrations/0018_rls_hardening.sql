-- supabase/migrations/0018_rls_hardening.sql
--
-- 익명(anon) REST 공격면 제거 (2026-08-04 점검에서 실노출 확인).
--
-- 배경: 앱의 모든 테이블 읽기·쓰기는 서버 액션과 RSC의 service_role을
-- 경유한다. 따라서 아래 anon 정책들은 앱이 전혀 쓰지 않는데도 열려 있던
-- 통로다. 특히 RLS는 행 단위라, cohort_members(이름·이메일·전화·학번·생일)와
-- alumni(이메일)의 비공개 컬럼이 익명 REST로 그대로 조회됐다.
--
-- 유지하는 공개 정책: site_config, demoday_events, sponsors, recruit_rounds
-- (PII 없음), 스토리지 public read (로고·포스터·프로필 사진은 공개 자산).

-- 1) PII 테이블 익명 select 차단
drop policy if exists "cohort_members public read" on public.cohort_members;
drop policy if exists "alumni public read" on public.alumni;
drop policy if exists "alumni_companies public read" on public.alumni_companies;
drop policy if exists "partners public read" on public.partners;

-- 2) 직접 REST insert 차단 (모든 폼은 서버 액션의 검증·레이트리밋 경유)
drop policy if exists "alumni anon insert" on public.alumni;
drop policy if exists "alumni_companies anon insert" on public.alumni_companies;
drop policy if exists "partners anon insert" on public.partners;
drop policy if exists "inquiries anon insert" on public.inquiries;
drop policy if exists "demoday_attendees anon insert" on public.demoday_attendees;

-- 3) 스토리지 익명 업로드 차단 (로고·포스터 업로드는 어드민 서버 액션 경유)
drop policy if exists "alumni-company-logos anon insert" on storage.objects;
drop policy if exists "partner-logos anon insert" on storage.objects;
drop policy if exists "demoday-posters anon insert" on storage.objects;
