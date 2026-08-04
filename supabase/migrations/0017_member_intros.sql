-- supabase/migrations/0017_member_intros.sql
--
-- 학회원 자기소개 (셀프서비스). 43기 노션의 "자기소개" 페이지를 대체한다.
-- 포털에 로그인한 학회원이 본인 소개를 마크다운으로 직접 작성·수정한다.
--
-- cohort_members에 컬럼을 추가하지 않는 이유: 그 테이블은 공개 read 정책이
-- 있어(published=true) 자기소개가 익명 REST로 노출된다. 소개는 학회원끼리만
-- 보는 콘텐츠이므로 전용 테이블에 두고 RLS를 전면 차단한다 (정책 0개 =
-- service_role 전용). 접근 통제는 서버 액션의 포털 인증이 담당한다.

create table if not exists public.member_intros (
  member_id uuid primary key references public.cohort_members(id) on delete cascade,
  body_md text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.member_intros enable row level security;
