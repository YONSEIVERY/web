-- supabase/migrations/0014_member_portal.sql
--
-- 학회원 포털(members.yonseivery.com) — 노션 워크스페이스 대체.
--   club_sessions : 주차별 정규/비정규 세션 자료 (임원진 작성, 학회원 열람)
--   notices       : 공지사항
--   attendance    : 세션 × 학회원 출결 (출석/지각/결석/조퇴/인정 + 과제 미제출)
--   portal_role() : 이메일 → 'exec'(admins) / 'member'(cohort_members) 판별
--
-- 세 테이블 모두 RLS deny-all: 미들웨어/서버 액션이 portal_role로 인가한 뒤
-- service_role로만 읽고 쓴다. 전체가 멱등(idempotent).

create table if not exists public.club_sessions (
  id uuid primary key default uuid_generate_v4(),
  cohort int not null check (cohort between 1 and 100),
  kind text not null default 'regular' check (kind in ('regular','special')),
  week int check (week between 0 and 30),
  title text not null,
  speaker text,
  event_date timestamptz,
  location text,
  location_note text,
  content_md text not null default '',
  is_published boolean not null default false,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_sessions_cohort_idx
  on public.club_sessions (cohort, kind, sort_order, week);

create table if not exists public.notices (
  id uuid primary key default uuid_generate_v4(),
  cohort int not null check (cohort between 1 and 100),
  title text not null,
  content_md text not null default '',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notices_cohort_idx
  on public.notices (cohort, pinned desc, created_at desc);

create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.club_sessions(id) on delete cascade,
  member_id uuid not null references public.cohort_members(id) on delete cascade,
  status text not null default 'present'
    check (status in ('present','late','absent','early_leave','excused')),
  assignment_missing boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, member_id)
);

create index if not exists attendance_member_idx
  on public.attendance (member_id, session_id);

alter table public.club_sessions enable row level security;
alter table public.notices enable row level security;
alter table public.attendance enable row level security;
-- 정책 없음 = anon/authenticated 전면 차단. service_role만 접근.

-- ============================================================
-- portal_role — 포털 접근 판별 (is_admin RPC와 같은 security definer 관행)
--   'exec'   : admins 화이트리스트에 있는 이메일 (임원진)
--   'member' : cohort_members에 등록된 이메일 (학회원)
--   null     : 접근 불가
-- ============================================================
create or replace function public.portal_role(check_email text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when exists (select 1 from public.admins where lower(email) = lower(check_email))
      then 'exec'
    when exists (
      select 1 from public.cohort_members
      where lower(email) = lower(check_email)
    )
      then 'member'
    else null
  end;
$$;

revoke all on function public.portal_role(text) from public;
grant execute on function public.portal_role(text) to anon, authenticated;

select 'PORTAL_MIGRATION_OK' as result;
