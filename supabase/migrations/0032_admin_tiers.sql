-- ============================================================
-- 0032: 어드민 2등급 (lead / officer)
--
-- 문제
--   admins에 등록되면 권한이 하나뿐이었다. 지원자 PII 열람, 합불 확정,
--   결과 메일 일괄 발송, 영구 삭제가 전부 같은 자격으로 열린다. 임원진
--   11명 전원에게 이 전권을 주는 것은 최소권한 원칙에 어긋난다.
--
-- 등급
--   lead    : 전권. 학회장단 (2026-09-03 기준 고민서·임서현)
--   officer : 운영 실무. 지원자 열람은 되지만 합불 변경·결과 발송·
--             PII 반출(엑셀/CSV)·영구 삭제·명단 승인은 막힌다
--
--   기존 행은 default로 전부 officer가 되고, 학회장단만 아래 update로
--   lead가 된다. 즉 적용 즉시 권한이 좁아지는 방향이라 사고 반경이 작다.
--
-- 판정 함수
--   admin_tier()는 0023의 자기 판정 관행을 그대로 따른다. 인자를 받지
--   않고 auth.jwt()의 이메일을 스스로 읽으므로, 호출자가 남의 주소를
--   넣어 등급을 캐낼 수 없다. search_path 고정과 lower 비교도 0022와
--   동일하다. admins에 없으면 null을 돌려주고, 애플리케이션은 null을
--   officer보다도 낮은 것(=lead 아님)으로 다룬다. 실패는 닫는 쪽이다.
--
-- 배포 순서 (중요)
--   이 SQL을 먼저 적용하고 그다음 코드를 머지한다. 역순이면 코드가
--   존재하지 않는 admin_tier()를 호출해 어드민 화면이 통째로 잠긴다.
-- ============================================================

alter table public.admins
  add column if not exists tier text not null default 'officer';

-- 제약은 add constraint if not exists를 지원하지 않는다. 재실행 안전을
-- 위해 지우고 다시 건다.
alter table public.admins drop constraint if exists admins_tier_check;
alter table public.admins
  add constraint admins_tier_check check (tier in ('lead', 'officer'));

-- 학회장단만 lead. 이 목록을 바꾸는 것은 학회장 결정 사항이다.
update public.admins
   set tier = 'lead'
 where lower(email) in ('ms90@yonsei.ac.kr', 'seo1218hyun@yonsei.ac.kr');

-- 44기 임원진 11명 중 마지막 한 명 (디자이너, 학회장 지시 2026-09-03).
-- 등급은 default인 officer로 들어간다.
insert into public.admins (email, name) values
  ('choieunjee06@gmail.com', '최은지')
on conflict (email) do nothing;

create or replace function public.admin_tier()
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select tier
    from public.admins
   where lower(email) = lower(nullif(auth.jwt() ->> 'email', ''))
   limit 1;
$$;

-- anon revoke는 PUBLIC 회수와 별개로 명시해야 한다 (0023 주석 참고).
revoke all on function public.admin_tier() from public;
revoke execute on function public.admin_tier() from anon;
grant execute on function public.admin_tier() to authenticated;

-- PostgREST가 새 함수를 인식하려면 스키마 캐시를 다시 읽어야 한다.
notify pgrst, 'reload schema';

-- 기대값: lead 2 (학회장단), officer 10 (임원진 9 + 학회 공용 계정).
-- 학회 공용은 행위 주체 추적이 안 되므로 lead를 주지 않는다.
select
  (select count(*) from public.admins where tier = 'lead') as lead_count,
  (select count(*) from public.admins where tier = 'officer') as officer_count;
