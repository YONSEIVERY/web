-- ============================================================
-- 0023: is_admin·portal_role 자기 판정 전환 (임의 이메일 조회 차단)
--
-- 문제
--   두 함수 모두 이메일을 인자로 받는다. SECURITY DEFINER라 호출자
--   권한과 무관하게 실행되므로, 로그인만 하면 아무 주소나 넣어 그 사람이
--   운영진인지 학회원인지 알아낼 수 있었다 (Supabase advisor WARN).
--   0021에서 anon 실행권을 회수해 공격면을 줄였지만, authenticated는
--   구글 계정만 있으면 누구나 얻는 자격이라 실질 차단이 아니다.
--
-- 해법
--   인자를 없애고 함수 안에서 auth.jwt()의 이메일을 읽는다. 호출자는
--   자기 자신에 대해서만 물을 수 있고, 다른 주소를 넣을 자리가 없다.
--   판정 로직 자체는 기존과 동일하다 (lower 비교, admins 우선).
--
-- 배포 순서 (중요)
--   기존 인자 버전을 여기서 드롭하지 않는다. 무인자 버전을 오버로드로
--   먼저 올리고, 애플리케이션이 무인자 호출로 배포된 것을 확인한 뒤
--   0024에서 인자 버전을 드롭한다. 역순이면 DB 적용과 배포 사이에
--   어드민과 포털이 통째로 잠긴다.
--
-- 안전장치
--   auth.jwt()에 이메일이 없으면 (서버 사이드 service_role 호출 등)
--   nullif로 null이 되어 비교가 성립하지 않고 false/null을 돌려준다.
--   즉 실패 시 권한을 여는 쪽이 아니라 닫는 쪽으로 떨어진다.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from public.admins
    where lower(email) = lower(nullif(auth.jwt() ->> 'email', ''))
  );
$$;

-- anon revoke는 PUBLIC 회수와 별개로 반드시 명시해야 한다. Supabase는
-- public 스키마 함수에 default privileges로 anon·authenticated·service_role
-- 실행권을 자동으로 붙이므로, from public만 회수하면 anon 직접 권한이 남는다.
-- (실제로 0023 최초 적용 직후 anon 키로 호출이 통과하는 것을 확인했다.)
revoke all on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.portal_role()
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select case
    when exists (
      select 1 from public.admins
      where lower(email) = lower(nullif(auth.jwt() ->> 'email', ''))
    )
      then 'exec'
    when exists (
      select 1 from public.cohort_members
      where lower(email) = lower(nullif(auth.jwt() ->> 'email', ''))
    )
      then 'member'
    else null
  end;
$$;

revoke all on function public.portal_role() from public;
revoke execute on function public.portal_role() from anon;
grant execute on function public.portal_role() to authenticated;

-- PostgREST가 새 시그니처를 인식하려면 스키마 캐시를 다시 읽어야 한다.
notify pgrst, 'reload schema';

select 'SELF_SCOPED_RPC_OK' as result;
