-- supabase/migrations/0013_recruit.sql
--
-- 리크루팅 — 기수별 모집 라운드 + 지원서 접수.
--   recruit_rounds : 모집 라운드(44기·45기·...). 어드민이 접수 open/close 토글.
--   applications   : 지원자 PII + 지원서 PDF(private bucket) 경로.
--
-- 지원서 파일은 비공개 버킷(recruit-applications)에 저장하고, 어드민 페이지가
-- signed URL로만 접근한다. 43기까지는 구글폼 + PDF 업로드 방식이었고, 44기부터
-- 같은 구조를 사이트 자체 접수로 옮긴 것.
--
-- 전체가 멱등(idempotent)이라 SQL 에디터에서 재실행해도 안전하다.

-- ============================================================
-- recruit_rounds — 모집 라운드 (어드민 편집)
-- ============================================================
create table if not exists public.recruit_rounds (
  id uuid primary key default uuid_generate_v4(),
  cohort int not null check (cohort between 1 and 100),
  semester text not null check (semester in ('1학기','2학기')),
  is_current boolean not null default false,
  apply_open boolean not null default false,
  apply_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cohort)
);

-- is_current=true 인 행은 최대 한 개 (demoday_events와 동일한 관행).
create unique index if not exists recruit_rounds_is_current_idx
  on public.recruit_rounds (is_current)
  where is_current = true;

-- ============================================================
-- applications — 지원자 (PII)
-- ============================================================
create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid not null references public.recruit_rounds(id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null,
  file_path text not null,
  file_name text not null,
  remote_interview_reason text,
  notice_ack boolean not null,
  privacy_consent boolean not null,
  status text not null default 'submitted'
    check (status in ('submitted','docs_pass','docs_fail','final_pass','final_fail')),
  created_at timestamptz not null default now()
);

create index if not exists applications_round_idx
  on public.applications (round_id, created_at desc);

-- 라운드당 이메일 1회 접수 (대소문자 무시). 중복 제출은 23505로 막힌다.
create unique index if not exists applications_round_email_uniq
  on public.applications (round_id, lower(email));

-- ============================================================
-- RLS
-- ============================================================
alter table public.recruit_rounds enable row level security;
alter table public.applications enable row level security;

-- rounds: 공개 페이지가 접수 상태를 읽는다. 변경은 service_role 경유.
drop policy if exists "recruit_rounds public read" on public.recruit_rounds;
create policy "recruit_rounds public read" on public.recruit_rounds
  for select using (true);

-- applications: anon 정책 없음 = 전면 차단. INSERT/SELECT 모두
-- server action(service_role)만 수행한다. 지원자 본인도 다시 못 본다.

-- ============================================================
-- Storage bucket — 지원서 PDF (private)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'recruit-applications',
    'recruit-applications',
    false,
    5242880,
    array['application/pdf']
  )
  on conflict do nothing;

-- 비공개 버킷: anon 정책을 만들지 않는다. 업로드는 service_role,
-- 열람은 어드민 페이지가 발급하는 signed URL로만.

-- ============================================================
-- Seed — 44기 라운드 (접수는 닫힌 상태로 시작, 어드민에서 오픈)
-- ============================================================
insert into public.recruit_rounds (cohort, semester, is_current, apply_open)
  values (44, '2학기', true, false)
  on conflict do nothing;

select 'MIGRATION_OK' as result,
  (select count(*) from public.recruit_rounds) as rounds,
  exists(select 1 from storage.buckets where id = 'recruit-applications') as bucket_ok;
