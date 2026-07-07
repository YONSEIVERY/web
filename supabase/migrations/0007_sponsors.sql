-- supabase/migrations/0007_sponsors.sql
--
-- 알럼나이 페이지에 노출할 후원자 명단(명예의 전당).
--   category = 'prize'      → 데모데이 상금 후원
--   category = 'operations' → 운영자금 후원
--
-- 금액은 저장하지 않는다(명예 목적). cohort_label은 자유 텍스트로 두어
-- 회차 표기가 정형화될 때 demoday_events 참조로 마이그레이션한다.

create table public.sponsors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  kind text not null check (kind in ('individual','company')),
  category text not null check (category in ('prize','operations')),
  cohort_label text,
  note text,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sponsors_category_order_idx
  on public.sponsors (category, order_index, created_at desc);

-- RLS: 공개 SELECT, mutation은 service_role만.
alter table public.sponsors enable row level security;

create policy "sponsors public read" on public.sponsors
  for select using (true);
