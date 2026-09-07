-- 학회원 기록을 비정규 세션 과제 제출 칸으로
--
-- 배경: 인사이트 과제(소감문)는 글로 내는 과제라 0015의 session_posts가
-- 제자리인데, 기록에 마감이 없어 임원진이 0033의 발표자료 제출을 대신
-- 쓰고 있었다. 그쪽은 파일이 필수라 텍스트만으로는 제출 자체가 안 된다.
--
-- 비정규 세션 세 종류가 요구하는 모양이 서로 다르다.
--   인사이트 : 개인이 소감문 1건
--   스터디   : 조 단위(인증샷·책 정리·토론 녹음본·토론 정리)와
--              개인 단위(후기·배운 점)를 따로 받는다
--   컨벤션   : 개인이 기수 전체에 걸쳐 외부 행사 2건
--
-- 셋을 한 구조로 담기 위해 세 축을 세션 설정으로 뺀다.
--   post_scope : 개인만 / 조만 / 둘 다
--   post_quota : 인당(또는 조당) 필요 건수. 컨벤션이 2
--   post_teams : 조 목록. 조 편성 테이블을 새로 파지 않는다(0033과 같은
--                판단). 세션마다 조가 바뀔 수 있고, 목록이 있으면 학회원은
--                드롭다운으로 고르고 임원진은 미제출 조를 셀 수 있다.
--
-- 제출물 항목(인증샷·녹음본 등)을 컬럼으로 쪼개지 않는 이유는 스터디
-- 전용 스키마가 되기 때문이다. 무엇을 내야 하는지는 post_note에 적는다.

alter table public.club_sessions
  add column if not exists post_due timestamptz,
  add column if not exists post_note text,
  add column if not exists post_scope text not null default 'individual',
  add column if not exists post_quota int not null default 1,
  add column if not exists post_teams text[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'club_sessions_post_scope_check'
  ) then
    alter table public.club_sessions
      add constraint club_sessions_post_scope_check
      check (post_scope in ('individual', 'team', 'both'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'club_sessions_post_quota_check'
  ) then
    alter table public.club_sessions
      add constraint club_sessions_post_quota_check
      check (post_quota between 1 and 20);
  end if;
end $$;

-- 기록 한 건이 개인 것인지 조 것인지, 그리고 사진 외 첨부(녹음본·문서).
-- 이미지(image_paths)와 따로 두는 이유는 화면에서 다르게 다루기 때문이다.
-- 사진은 펼쳐 보여주고 파일은 내려받기 링크로 낸다.
alter table public.session_posts
  add column if not exists scope text not null default 'individual',
  add column if not exists team_label text,
  add column if not exists file_paths text[] not null default '{}',
  add column if not exists file_names text[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'session_posts_scope_check'
  ) then
    alter table public.session_posts
      add constraint session_posts_scope_check
      check (scope in ('individual', 'team'));
  end if;
end $$;

create index if not exists session_posts_scope_idx
  on public.session_posts (session_id, scope, created_at desc);

select
  'POST_ASSIGNMENTS_MIGRATION_OK' as result,
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'club_sessions'
      and column_name in
        ('post_due', 'post_note', 'post_scope', 'post_quota', 'post_teams')
  ) as session_cols,
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'session_posts'
      and column_name in ('scope', 'team_label', 'file_paths', 'file_names')
  ) as post_cols;
