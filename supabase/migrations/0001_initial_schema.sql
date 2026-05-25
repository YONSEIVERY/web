-- supabase/migrations/0001_initial_schema.sql

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- admins — 임원진 화이트리스트
-- ============================================================
create table public.admins (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- site_config — 단일 행
-- ============================================================
create table public.site_config (
  key text primary key,
  cohort int not null,
  year int not null,
  semester text not null check (semester in ('1학기','2학기')),
  since_year int not null,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- alumni — 알럼나이 개인
-- ============================================================
create table public.alumni (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cohort int not null check (cohort between 1 and 100),
  email text not null,
  current_role text not null,
  bio text not null,
  linkedin_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reject_reason text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create index alumni_status_idx on public.alumni(status);
create index alumni_published_idx on public.alumni(published) where published = true;

-- ============================================================
-- alumni_companies — 알럼나이 창업 회사
-- ============================================================
create table public.alumni_companies (
  id uuid primary key default uuid_generate_v4(),
  founder_alumni_id uuid references public.alumni(id) on delete set null,
  name text not null,
  logo_url text not null,
  one_liner text not null,
  stage text check (stage in ('idea','seed','seriesA','seriesB','growth','exit')),
  website_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reject_reason text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create index alumni_companies_status_idx on public.alumni_companies(status);
create index alumni_companies_founder_idx on public.alumni_companies(founder_alumni_id);

-- ============================================================
-- partners — 공식 파트너
-- ============================================================
create table public.partners (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in ('CORPORATE','CAPITAL','ACADEMIC')),
  one_liner text not null,
  logo_url text,
  sort_order int not null default 100,
  applicant_name text not null,
  applicant_email text not null,
  applicant_note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reject_reason text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create index partners_status_idx on public.partners(status);
create index partners_published_idx on public.partners(published, sort_order) where published = true;

-- ============================================================
-- inquiries — 일반·산학협력 통합 문의
-- ============================================================
create table public.inquiries (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('GENERAL','INDUSTRY')),
  name text not null,
  email text not null,
  affiliation text,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','done')),
  created_at timestamptz not null default now()
);
create index inquiries_status_idx on public.inquiries(status, created_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table public.admins enable row level security;
alter table public.site_config enable row level security;
alter table public.alumni enable row level security;
alter table public.alumni_companies enable row level security;
alter table public.partners enable row level security;
alter table public.inquiries enable row level security;

-- admins: anon은 직접 읽기 불가. service_role만 접근. (정책 없음 = 전부 deny under RLS)

-- site_config: public read
create policy "site_config public read" on public.site_config
  for select using (true);

-- alumni: 승인+공개만 read, anon insert는 status='pending' published=false 강제 (트리거로)
create policy "alumni public read" on public.alumni
  for select using (status = 'approved' and published = true);
create policy "alumni anon insert" on public.alumni
  for insert with check (status = 'pending' and published = false);

create policy "alumni_companies public read" on public.alumni_companies
  for select using (status = 'approved' and published = true);
create policy "alumni_companies anon insert" on public.alumni_companies
  for insert with check (status = 'pending' and published = false);

create policy "partners public read" on public.partners
  for select using (status = 'approved' and published = true);
create policy "partners anon insert" on public.partners
  for insert with check (status = 'pending' and published = false);

create policy "inquiries anon insert" on public.inquiries
  for insert with check (status = 'new');

-- ============================================================
-- Storage buckets (public read)
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('alumni-company-logos', 'alumni-company-logos', true),
         ('partner-logos', 'partner-logos', true)
  on conflict do nothing;

-- Storage RLS — anon upload, public read
create policy "alumni-company-logos public read" on storage.objects
  for select using (bucket_id = 'alumni-company-logos');
create policy "alumni-company-logos anon insert" on storage.objects
  for insert with check (bucket_id = 'alumni-company-logos');

create policy "partner-logos public read" on storage.objects
  for select using (bucket_id = 'partner-logos');
create policy "partner-logos anon insert" on storage.objects
  for insert with check (bucket_id = 'partner-logos');
