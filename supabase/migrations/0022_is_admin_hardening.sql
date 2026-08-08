-- ============================================================
-- 0022: is_admin 경화 (search_path 고정 + 이메일 비교 정합화)
--
-- 1) search_path 미고정 (Supabase advisor WARN)
--    SECURITY DEFINER 함수가 호출자 search_path를 따르면 동명의
--    admins 테이블을 앞선 스키마에 심어 판정을 뒤집을 여지가 있다.
--    0014의 portal_role은 이미 public 고정. 관행을 일치시킨다.
--
-- 2) 이메일 비교 불일치
--    portal_role은 lower(email) = lower(check_email)로 비교하는데
--    is_admin만 대소문자를 구분했다. 같은 계정이 portal_role에서는
--    'exec'인데 is_admin에서는 false가 되는 엇갈림이 가능하다.
--    lower 비교는 기존 통과 케이스를 모두 포함하므로 회귀 없음.
--
-- 3) STABLE 부여. 단일 select라 트랜잭션 내 재호출을 최적화한다.
--
-- create or replace는 기존 grant(authenticated 한정)를 보존한다.
-- ============================================================

create or replace function public.is_admin(check_email text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from public.admins where lower(email) = lower(check_email)
  );
$$;

select 'IS_ADMIN_HARDENED' as result;
