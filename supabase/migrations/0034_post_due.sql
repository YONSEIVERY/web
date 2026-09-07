-- 학회원 기록 마감
--
-- 배경: 인사이트 세션 과제(영상 시청 후 소감문)는 0015가 만든
-- session_posts가 담당하는 자리다. 그런데 기록에는 마감이 없어서
-- 임원진이 0033의 발표자료 제출을 대신 썼다. 그쪽은 파일이 필수라
-- 텍스트만 내는 과제와 맞지 않고, 화면 이름도 "발표자료 제출"이라
-- 학회원이 헷갈렸다.
--
-- 기록 쪽에 마감을 붙여 원래 자리로 돌린다. 컬럼을 따로 두는 이유는
-- 한 세션에서 기록과 발표자료 제출을 동시에 켤 수 있고 마감이 서로
-- 다를 수 있기 때문이다.
--
-- 새 테이블이 없으므로 BACKUP_TABLES는 그대로다.

alter table public.club_sessions
  add column if not exists post_due timestamptz;

select
  'POST_DUE_MIGRATION_OK' as result,
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'club_sessions'
      and column_name = 'post_due'
  ) as new_col;
