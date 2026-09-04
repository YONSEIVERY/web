-- supabase/migrations/0033_session_files.sql
--
-- 세션에 붙는 파일 두 방향.
--   session_materials   : 임원진이 세션 안내글에 첨부하는 자료 (발표 슬라이드, 양식, 참고 문서)
--   session_submissions : 학회원이 세션에 제출하는 발표자료
--   portal-files        : 비공개 버킷. 업로드는 서명 업로드 URL
--                         (브라우저 → 스토리지 직접, Vercel 요청 본문 4.5MB 제한 우회),
--                         열람은 원본 파일명을 실어 발급하는 서명 읽기 URL.
--
-- 버킷에 mime 제한을 걸지 않는 이유는 0016 지원서 첨부와 같다. 발표자료는
-- 형식이 자유롭고(pptx, pdf, key, hwp, zip) 그중 다수가 비표준 mime이라
-- 버킷 단에서는 거를 수 없다. 확장자와 크기는 서버 액션이 티켓 발급 시점에
-- 검증하며, 버킷이 private라 경로를 알아도 공개 노출이 없다.
--
-- 두 테이블 모두 session_id는 RESTRICT다(0025의 판단을 그대로 따른다).
-- 제출물은 학회원이 만든 결과물이라 재생성이 불가능하고, 세션 삭제 한 번에
-- 딸려 사라지면 되돌릴 수단이 없다. 세션을 정말 지우려면 파일을 먼저
-- 명시적으로 정리해야 하고, 그 과정에서 사람이 무엇을 지우는지 알게 된다.
--
-- 전체 멱등. RLS는 deny-all(정책 없음), 접근 통제는 서버 액션이 담당.

-- ============================================================
-- 세션 제출 설정
--   allow_submissions   : 세션별 제출 허용 토글 (기본 꺼짐)
--   submission_due      : 마감 시각. 지나면 새 제출을 받지 않는다
--   submission_note     : 제출 안내 문구 (형식, 분량, 파일명 규칙 등)
--   submissions_visible : 학회원이 서로의 제출물을 볼 수 있는지.
--                         기본 꺼짐이다. 발표 전 자료는 팀의 결과물이고
--                         10만플처럼 경쟁이 걸린 회차가 있어, 공개는
--                         임원진이 회차별로 명시적으로 켜는 쪽이 맞다.
-- ============================================================
alter table public.club_sessions
  add column if not exists allow_submissions boolean not null default false,
  add column if not exists submission_due timestamptz,
  add column if not exists submission_note text,
  add column if not exists submissions_visible boolean not null default false;

-- ============================================================
-- 세션 자료 (임원진 → 학회원)
-- ============================================================
create table if not exists public.session_materials (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.club_sessions(id) on delete restrict,
  file_path text not null,
  file_name text not null,
  file_size bigint not null default 0,
  label text,
  sort_order int not null default 100,
  uploaded_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists session_materials_session_idx
  on public.session_materials (session_id, sort_order, created_at);

alter table public.session_materials enable row level security;
-- 정책 없음 = 전면 차단. service_role 경유만 허용.

-- ============================================================
-- 발표자료 제출 (학회원 → 임원진)
--   team_label : "3조"처럼 자유 입력. 10만플·아이디어톤은 조 단위로 내고
--                인사이트 과제는 개인이 낸다. 팀 테이블을 새로 파는 대신
--                라벨 한 칸으로 양쪽을 받는다.
--   재제출은 새 행으로 쌓인다. 최신이 위로 오고 본인이 옛 것을 지운다.
--   덮어쓰기로 만들면 실수로 낸 파일이 원본을 지워 복구할 수 없다.
-- ============================================================
create table if not exists public.session_submissions (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.club_sessions(id) on delete restrict,
  member_id uuid references public.cohort_members(id) on delete set null,
  submitter_email text not null,
  submitter_name text not null,
  team_label text,
  title text,
  note text,
  file_path text not null,
  file_name text not null,
  file_size bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists session_submissions_session_idx
  on public.session_submissions (session_id, created_at desc);

alter table public.session_submissions enable row level security;
-- 정책 없음 = 전면 차단. service_role 경유만 허용.

-- ============================================================
-- 파일 버킷
--   50MB. 지원서 첨부(30MB)보다 크게 잡는다. 발표 슬라이드는 이미지가
--   많이 들어가 pptx 하나가 수십 MB로 나오는 일이 흔하다.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('portal-files', 'portal-files', false, 52428800, null)
  on conflict (id) do nothing;

select 'SESSION_FILES_MIGRATION_OK' as result,
  (select file_size_limit from storage.buckets where id = 'portal-files') as bucket_limit;
