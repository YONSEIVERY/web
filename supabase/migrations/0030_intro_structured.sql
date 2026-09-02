-- ============================================================
-- 0030: 자기소개 구조화 (member_intros 확장)
--
-- 43기 노션 자기소개 형식을 포털로 옮긴다. 자유 서술 한 칸(body_md)
-- 대신 대표사진, MBTI, 잘하는 것 3가지, 좋아하는 것 3가지, 자유로운 TMI,
-- 개인 포트폴리오로 항목을 나눈다.
--
-- body_md는 지우지 않는다. 구조화 항목이 전부 비어 있으면 화면이
-- body_md로 폴백하므로, 기존에 쓴 소개가 있는 사람도 깨지지 않는다.
--
-- strengths·likes는 jsonb 배열이다: [{"title": "듣기", "body": "..."}]
-- 최대 3개, 형식 검증은 서버 액션이 한다. photo_path는 비공개 버킷
-- portal-photos 안의 intros/{member_id}/ 경로만 허용한다(서버 액션 강제).
--
-- 멱등이라 SQL 에디터에서 재실행해도 안전하다.
-- ============================================================

alter table public.member_intros
  add column if not exists mbti text,
  add column if not exists photo_path text,
  add column if not exists strengths jsonb not null default '[]'::jsonb,
  add column if not exists likes jsonb not null default '[]'::jsonb,
  add column if not exists tmi text not null default '',
  add column if not exists portfolio text not null default '';

select 'INTRO_STRUCTURED_INSTALLED' as result,
  (select count(*) from information_schema.columns
    where table_schema = 'public'
      and table_name = 'member_intros'
      and column_name in ('mbti','photo_path','strengths','likes','tmi','portfolio')) as new_columns;
