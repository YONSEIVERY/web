-- supabase/migrations/0004_demoday.sql
--
-- 데모데이 — 매학기 운영. 회차별 행사 정보 + 참관 신청을 받는다.
--   demoday_events    : 회차(43기·44기·...). 어드민이 관리. 1개만 is_current=true.
--   demoday_attendees : 참관 신청자 PII. 작성자(anon)만 INSERT, 일반 조회 차단.
--
-- 폼 옵션(purposes/roles/sources)·일정(schedule)은 jsonb로 보관해 어드민이
-- 코드 배포 없이 학기마다 수정할 수 있게 한다.

-- ============================================================
-- demoday_events — 회차 행사 정보 (어드민 편집)
-- ============================================================
create table public.demoday_events (
  id uuid primary key default uuid_generate_v4(),
  volume int not null check (volume between 1 and 100),
  semester text not null check (semester in ('1학기','2학기')),
  is_current boolean not null default false,
  register_open boolean not null default false,
  event_date timestamptz,
  location text,
  location_note text,
  intro_text text,
  poster_url text,
  schedule jsonb not null default '[]'::jsonb,
  form_choices jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (volume, semester)
);

-- is_current=true 인 행은 최대 한 개. false 다수 허용.
create unique index demoday_events_is_current_idx
  on public.demoday_events (is_current)
  where is_current = true;

create index demoday_events_volume_desc_idx
  on public.demoday_events (volume desc);

-- ============================================================
-- demoday_attendees — 참관 신청자 (PII)
-- ============================================================
create table public.demoday_attendees (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.demoday_events(id) on delete cascade,
  name text not null,
  affiliation text not null,
  phone text not null,
  email text not null,
  is_very_alumni boolean not null,
  very_cohort int check (very_cohort between 1 and 100),
  attend_afterparty boolean,
  purposes text[] not null default '{}',
  role text not null,
  referral_sources text[] not null default '{}',
  privacy_consent boolean not null,
  created_at timestamptz not null default now()
);

create index demoday_attendees_event_idx
  on public.demoday_attendees (event_id, created_at desc);
create index demoday_attendees_created_idx
  on public.demoday_attendees (created_at);

-- ============================================================
-- RLS
-- ============================================================
alter table public.demoday_events enable row level security;
alter table public.demoday_attendees enable row level security;

-- events: 공개 회차 목록은 누구나 읽기. 어드민 변경은 service_role 경유.
create policy "demoday_events public read" on public.demoday_events
  for select using (true);

-- attendees: 일반 SELECT 전면 차단. 신청자 본인도 다시 못 본다.
-- service_role(서버 어드민 컨텍스트)만 조회.
create policy "demoday_attendees no read" on public.demoday_attendees
  for select using (false);

-- 동의 없으면 INSERT 자체가 막힌다.
create policy "demoday_attendees anon insert" on public.demoday_attendees
  for insert with check (privacy_consent = true);

-- ============================================================
-- Storage buckets — 포스터 (public read)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'demoday-posters',
    'demoday-posters',
    true,
    5242880,
    array['image/png','image/jpeg','image/webp']
  )
  on conflict do nothing;

create policy "demoday-posters public read" on storage.objects
  for select using (bucket_id = 'demoday-posters');
create policy "demoday-posters anon insert" on storage.objects
  for insert with check (bucket_id = 'demoday-posters');
