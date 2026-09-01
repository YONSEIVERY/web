-- ============================================================
-- 0026: 삭제 감사 기록과 TRUNCATE 차단
--
-- 문제
--   삭제 기록이 어디에도 남지 않는다. 2026-08-09의 지원서 소실 의심은
--   결국 테스트 건이었던 것으로 종결됐지만(2026-08-28 대표 확인),
--   그 판정에 3주가 걸렸고 근거는 사람의 기억뿐이었다. 기록이 있었다면
--   당일에 끝났을 일이다. 다음에 같은 의심이 들 때 답할 수단을 만든다.
--
--   애플리케이션 로깅으로는 부족하다. 대시보드 수동 SQL을 잡지 못하기
--   때문이다. 경로와 무관하게 잡으려면 DB 트리거여야 한다.
--
-- 설계
--   1) 삭제된 행 전체를 jsonb로 보존한다. 감사 기록이 곧 마지막
--      복구 수단이 된다. Free 플랜이라 되돌릴 스냅숏이 없다.
--   2) 실행 주체를 남긴다. request.jwt.claims가 있으면 애플리케이션
--      경유(service_role 또는 로그인 사용자), 없으면 current_user가
--      찍힌다. 대시보드 SQL은 postgres로 남아 앱 경유와 구분된다.
--      이 구분 하나가 08-09에 없던 것이다.
--   3) TRUNCATE를 막는다. 행 트리거는 TRUNCATE를 잡지 못하므로
--      문장 트리거로 예외를 던져 아예 차단한다. 정말 필요하면
--      트리거를 내리고 실행한 뒤 다시 올리게 한다. 그 마찰이 안전장치다.
--
-- 범위
--   UPDATE는 기록하지 않는다. 출결 저장처럼 정상 흐름에서 빈번해
--   신호 대 잡음비가 나빠진다. 손실 경로는 DELETE다.
--
-- audit_log 자체는 백업 덤프에 넣지 않는다. 복원 시 과거 감사 기록을
-- 덮어쓰면 안 되기 때문이다 (scripts/check-backup-tables.mjs의 EXEMPT).
-- ============================================================

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  table_name text not null,
  op text not null,
  row_id text,
  actor text,
  actor_role text,
  client_addr inet,
  old_row jsonb not null
);

create index if not exists audit_log_occurred_at_idx
  on public.audit_log (occurred_at desc);
create index if not exists audit_log_table_name_idx
  on public.audit_log (table_name, occurred_at desc);

-- 삭제된 원본이 그대로 들어 있으므로 개인정보 테이블과 같은 등급으로
-- 다룬다. 정책을 두지 않아 anon·authenticated 양쪽에서 전면 차단된다.
-- service_role은 RLS를 우회하므로 서버에서는 읽을 수 있다.
alter table public.audit_log enable row level security;

revoke all on public.audit_log from anon, authenticated;

-- 트리거는 삭제를 수행한 역할의 권한과 무관하게 항상 기록되어야 하므로
-- SECURITY DEFINER로 둔다. search_path는 0022의 관행대로 고정한다.
create or replace function public.log_row_delete()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  claims jsonb;
begin
  begin
    claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then
    claims := null;
  end;

  insert into public.audit_log (
    table_name, op, row_id, actor, actor_role, client_addr, old_row
  )
  values (
    tg_table_name,
    tg_op,
    (to_jsonb(old) ->> 'id'),
    coalesce(claims ->> 'email', current_user),
    coalesce(claims ->> 'role', 'direct'),
    inet_client_addr(),
    to_jsonb(old)
  );
  return old;
end;
$$;

create or replace function public.block_truncate()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'TRUNCATE가 차단된 테이블입니다 (%). 정말 필요하면 0026의 트리거를 내리고 실행한 뒤 다시 올리십시오.',
    tg_table_name;
end;
$$;

do $$
declare
  t text;
  guarded text[] := array[
    'applications',
    'attendance',
    'club_sessions',
    'cohort_members',
    'member_intros',
    'session_posts',
    'notices',
    'recruit_rounds',
    'admins',
    'alumni',
    'partners'
  ];
begin
  foreach t in array guarded loop
    execute format('drop trigger if exists audit_delete on public.%I', t);
    execute format(
      'create trigger audit_delete after delete on public.%I
         for each row execute function public.log_row_delete()', t);

    execute format('drop trigger if exists no_truncate on public.%I', t);
    execute format(
      'create trigger no_truncate before truncate on public.%I
         for each statement execute function public.block_truncate()', t);
  end loop;
end $$;

select 'AUDIT_LOG_INSTALLED' as result;
