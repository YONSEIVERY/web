-- ============================================================
-- 0031: 자기소개 댓글 (intro_comments)
--
-- 43기 노션 자기소개의 댓글을 포털로 옮긴다. 학회원이 서로의 소개
-- 페이지에 한마디를 남기는 가벼운 소셜 기능이다.
--
-- member_id는 소개 페이지의 주인. 주인이 명단에서 지워지면 댓글도
-- 같이 지워진다(cascade). 0026 감사 트리거가 지워진 행을 원본째
-- audit_log에 남기므로 복구 근거는 유지된다. 작성자는 session_posts와
-- 같은 방식으로 이메일·이름을 복사해 두고, author_member_id는 작성자
-- 행이 지워지면 null이 된다(댓글은 남는다).
--
-- 보안 등급: 학회원끼리만 보는 콘텐츠 + 이메일이 들어 있다. 0027과
-- 같은 관행으로 정책 0개(= service_role 전용)로 만든다.
--
-- 의존: 0026의 public.log_row_delete()·public.block_truncate().
-- 전체가 멱등이라 SQL 에디터에서 재실행해도 안전하다.
-- ============================================================

create table if not exists public.intro_comments (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null
    references public.cohort_members(id) on delete cascade,
  author_member_id uuid
    references public.cohort_members(id) on delete set null,
  author_email text not null,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- 소개 페이지당 시간순 조회.
create index if not exists intro_comments_member_idx
  on public.intro_comments (member_id, created_at);

-- ============================================================
-- RLS: 정책 0개 = anon·authenticated 전면 차단
-- ============================================================
alter table public.intro_comments enable row level security;
revoke all on public.intro_comments from anon, authenticated;

-- ============================================================
-- 감사·TRUNCATE 차단 (0026의 설치 방식을 그대로 적용)
-- ============================================================
drop trigger if exists audit_delete on public.intro_comments;
create trigger audit_delete
  after delete on public.intro_comments
  for each row execute function public.log_row_delete();

drop trigger if exists no_truncate on public.intro_comments;
create trigger no_truncate
  before truncate on public.intro_comments
  for each statement execute function public.block_truncate();

select 'INTRO_COMMENTS_INSTALLED' as result,
  (select count(*) from pg_policies where tablename = 'intro_comments') as policies,
  (select count(*) from pg_trigger t
     join pg_class c on c.oid = t.tgrelid
    where c.relname = 'intro_comments'
      and not t.tgisinternal
      and t.tgname in ('audit_delete','no_truncate')) as guards;
