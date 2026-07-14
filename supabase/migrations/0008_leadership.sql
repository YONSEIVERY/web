-- supabase/migrations/0008_leadership.sql
--
-- 회장단(회장·부회장 등) — 마케팅 /about 페이지 LEADERSHIP 섹션의
-- 원본. 어드민에서 CRUD하며, 이메일도 함께 저장한다.
--
-- role_mono: 화면에 그대로 노출할 영문 라벨 (예: PRESIDENT, VICE PRESIDENT)
-- role     : 한글 직함 (예: 회장, 부회장)
-- mono_name: 영문 이름 (예: HYUNWOO SHIN) — 라벨용
-- cohort_label: 자유 텍스트 (예: 43기) — 여러 기수 회장단 아카이브까지 확장 여지.
-- email    : 회장단 대표 이메일 (연락처)
-- sort_order: 화면 표시 순서 (작을수록 먼저)

create table public.leadership (
  id uuid primary key default uuid_generate_v4(),
  role_mono text not null,
  role text not null,
  name text not null,
  mono_name text not null,
  email text,
  cohort_label text,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leadership_sort_idx
  on public.leadership (sort_order, created_at asc);

alter table public.leadership enable row level security;

-- 공개 SELECT (mutation은 service_role만 — 정책 부재로 anon/authenticated 차단)
create policy "leadership public read" on public.leadership
  for select using (true);

-- 43기 회장단 시드
insert into public.leadership (role_mono, role, name, mono_name, cohort_label, sort_order)
values
  ('PRESIDENT', '회장', '신현우', 'HYUNWOO SHIN', '43기', 10),
  ('VICE PRESIDENT', '부회장', '구원근', 'WONKEUN KOO', '43기', 20);
