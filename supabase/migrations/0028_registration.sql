-- supabase/migrations/0028_registration.sql
--
-- 0028: 등록 회신 (applications.registration)
--
-- 배경
--   44기 최종 합격 24명 중 2명이 등록을 포기했다. 대표가 명단(cohort_members)에서
--   두 사람을 지웠지만 지원서의 status는 아직 final_pass다. 어드민의 "합격자 일괄
--   등록"은 final_pass를 기준으로 명단을 채우므로, 누가 그 버튼을 다시 누르면 두
--   사람이 명단에 되살아난다. 지금은 "누르지 마세요"가 유일한 방어다.
--
-- 설계 (status에 값을 추가하지 않는다)
--   status는 학회가 내린 심사 결과이고, 등록 회신은 지원자가 낸 응답이다. 한
--   컬럼에 섞으면 "합격했는데 등록을 안 함"과 "불합격"을 구분할 수 없게 된다.
--   이 저장소는 이미 같은 실수를 한 적이 있다. 면접 불참자를 담을 값이 없어
--   docs_fail에 밀어넣었고, 그래서 기수 이력이 실제와 다르게 남아 있다. 그래서
--   심사 결과(status)와 등록 회신(registration)을 두 컬럼으로 분리한다.
--
--     pending    회신 없음 또는 아직 최종 합격이 아님 (기본값)
--     registered 최종 등록함
--     declined   최종 미등록 (등록 포기)
--
-- 보안
--   applications는 개인정보 테이블이고 RLS 정책 0개(전면 차단)가 정상이다.
--   컬럼만 늘어나므로 정책·권한은 손대지 않는다. 읽기·쓰기는 그대로 서버
--   액션의 service_role만 수행한다.
--
-- 멱등성
--   전체가 멱등이라 SQL 에디터에서 재실행해도 안전하다. 다만 백필은 한 번만
--   의미가 있다. 두 번째 실행이 사람이 손으로 고쳐 놓은 값을 덮어쓰지 않도록
--   아래 DO 블록이 스스로 재실행을 차단한다.

-- ============================================================
-- 1) 컬럼
-- ============================================================
alter table public.applications
  add column if not exists registration text not null default 'pending';

-- add column의 인라인 check는 재실행 시(컬럼이 이미 있으면) 건너뛰므로,
-- 제약은 이름을 고정해 따로 건다. drop-then-add라 재실행해도 같은 결과다.
alter table public.applications
  drop constraint if exists applications_registration_check;
alter table public.applications
  add constraint applications_registration_check
  check (registration in ('pending','registered','declined'));

comment on column public.applications.registration is
  '지원자의 등록 회신. status(심사 결과)와 분리된 축이다. pending=회신 없음, registered=등록, declined=등록 포기. 합격자 일괄 등록은 이 컬럼을 본다.';

-- ============================================================
-- 2) 인덱스
-- ============================================================
-- 조회 패턴은 "현재 라운드에서 registered인 사람"이다(일괄 등록의 원천 목록).
-- 라운드가 선행 컬럼이어야 라운드로 먼저 좁히고 상태로 거를 수 있다.
--
-- 부분 인덱스(where registration = 'registered')도 후보였지만 쓰지 않는다.
-- 어드민 화면이 같은 라운드에서 registered·declined·pending 세 가지를 모두
-- 세기 때문에, 한 값만 담는 부분 인덱스는 나머지 두 질의를 놓친다.
-- 현재 규모(36행)에서는 어느 쪽이든 순차 스캔이 이기지만, 기수가 쌓이면
-- 라운드로 좁히는 이 순서가 그대로 쓰인다.
create index if not exists applications_round_registration_idx
  on public.applications (round_id, registration);

-- ============================================================
-- 3) 백필 (한 번만 의미가 있다)
-- ============================================================
-- 컬럼만 추가하고 전부 pending으로 두면 일괄 등록이 아무도 찾지 못한다.
-- 지금의 진실을 그대로 옮겨 담는다.
--
--   final_pass + 같은 기수 cohort_members에 이메일 있음 -> registered
--   final_pass + 명단에 없음                            -> declined
--   그 외                                               -> pending (기본값 유지)
--
-- 이메일은 반드시 lower(trim(...))로 비교한다. 저장소 전체가 그렇게 비교한다
-- (0014·0022·0023·bulk-import-members.ts). 기수는 site_config(key='current')에서
-- 읽는다. 하드코딩하지 않는다.
--
-- 재실행 차단: registration이 하나라도 기본값이 아니면 이미 백필했거나 사람이
-- 손으로 고친 뒤다. 그때는 아무것도 건드리지 않고 빠져나온다. 행 단위로
-- "pending인 것만" 고치는 조건만으로는 부족하다. 백필 이후 새로 final_pass가
-- 된(아직 회신 전인) 지원자를 두 번째 실행이 declined로 뒤집기 때문이다.
do $$
declare
  v_cohort   int;
  v_dirty    int;
  v_updated  int;
begin
  select cohort into v_cohort from public.site_config where key = 'current';
  if v_cohort is null then
    raise exception 'site_config(key=''current'') 행이 없다. 기수를 확정한 뒤 다시 실행할 것';
  end if;

  select count(*) into v_dirty
    from public.applications
   where registration <> 'pending';

  if v_dirty > 0 then
    raise notice '[0028] 백필 건너뜀: registration이 이미 %건 지정돼 있다(사람이 손댄 값을 덮어쓰지 않는다).', v_dirty;
    return;
  end if;

  update public.applications a
     set registration = case
           when exists (
             select 1
               from public.cohort_members m
              where m.cohort = v_cohort
                and lower(trim(m.email)) = lower(trim(a.email))
           ) then 'registered'
           else 'declined'
         end
   where a.status = 'final_pass'
     and a.registration = 'pending'
     and a.round_id in (
           select r.id from public.recruit_rounds r where r.cohort = v_cohort
         );

  get diagnostics v_updated = row_count;
  raise notice '[0028] 백필 완료: %기 최종 합격 %건 분류.', v_cohort, v_updated;
end $$;

-- ============================================================
-- 4) 결과 마커
-- ============================================================
-- 2026-09-02 기준 기대값: cohort 44 · registered 22 · declined 2 · pending 12.
-- registered와 declined가 둘 다 0이면 백필이 걸리지 않은 것이므로 rollback 한다.
select 'REGISTRATION_INSTALLED' as result,
  (select cohort from public.site_config where key = 'current') as cohort,
  count(*) filter (where a.registration = 'registered') as registered,
  count(*) filter (where a.registration = 'declined') as declined,
  count(*) filter (where a.registration = 'pending') as pending
from public.applications a
join public.recruit_rounds r on r.id = a.round_id
where r.cohort = (select cohort from public.site_config where key = 'current');
