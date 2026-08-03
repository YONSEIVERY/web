-- supabase/migrations/0015_session_posts.sql
--
-- 학회원 포스트 — 비정규 세션(스터디/인사이트/컨벤션)에서 학회원이 직접
-- 사진과 소감문·내용 정리를 남기던 노션 상호작용의 대체.
--   club_sessions.allow_posts : 세션별 기록 허용 토글 (비정규 기본 켬)
--   session_posts             : 학회원 작성 글 + 사진 경로 배열
--   portal-photos             : 비공개 버킷. 업로드는 서명 업로드 URL
--                               (브라우저 → 스토리지 직접, Vercel 4.5MB 제한 우회),
--                               열람은 서명 읽기 URL.
--
-- 전체 멱등. RLS는 deny-all(정책 없음), 접근 통제는 서버 액션이 담당.

alter table public.club_sessions
  add column if not exists allow_posts boolean not null default false;

-- 기존 비정규 세션(43기 아카이브 포함)은 기록 허용으로
update public.club_sessions set allow_posts = true where kind = 'special';

create table if not exists public.session_posts (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.club_sessions(id) on delete cascade,
  member_id uuid references public.cohort_members(id) on delete set null,
  author_email text not null,
  author_name text not null,
  content_md text not null default '',
  image_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists session_posts_session_idx
  on public.session_posts (session_id, created_at desc);

alter table public.session_posts enable row level security;
-- 정책 없음 = 전면 차단. service_role 경유만 허용.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'portal-photos',
    'portal-photos',
    false,
    10485760,
    array['image/png','image/jpeg','image/webp','image/gif']
  )
  on conflict do nothing;

select 'POSTS_MIGRATION_OK' as result;
