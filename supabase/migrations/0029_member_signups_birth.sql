-- ============================================================
-- 0029: member_signups에 생년월일(birth) 추가
--
-- /join 자율 등록 폼에서 생년월일을 함께 받는다. 승인 시 cohort_members로
-- 옮겨 가는 값이라 타입도 cohort_members.birth와 같은 text로 맞춘다
-- (0011이 자유 형식 text로 정의했다). 폼은 date 입력이라 새 행에는
-- YYYY-MM-DD가 들어오고, 형식 검증은 서버 액션이 한다.
--
-- nullable로 둔다. 이 컬럼이 생기기 전의 기존 신청 행에는 값이 없고,
-- 필수 여부는 폼과 서버 액션이 강제한다.
--
-- 멱등이라 SQL 에디터에서 재실행해도 안전하다.
-- ============================================================

alter table public.member_signups
  add column if not exists birth text;

select 'MEMBER_SIGNUPS_BIRTH_INSTALLED' as result,
  (select count(*) from information_schema.columns
    where table_schema = 'public'
      and table_name = 'member_signups'
      and column_name = 'birth') as birth_column;
