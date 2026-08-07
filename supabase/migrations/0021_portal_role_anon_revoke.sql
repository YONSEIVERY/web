-- ============================================================
-- 0021: portal_role 익명 실행권 회수
--
-- 0014가 portal_role을 anon, authenticated 양쪽에 열어 두었으나
-- 호출부는 미들웨어 membersGate와 getPortalIdentity 둘뿐이고,
-- 둘 다 getUser() 통과 후 사용자 세션 토큰(authenticated)으로
-- 호출한다. anon 실행권은 임의 이메일의 등록 여부를 익명으로
-- 조회할 수 있는 공격면만 남기므로 회수한다.
-- (is_admin은 0003부터 authenticated 한정. 이제 관행이 일치한다.)
-- ============================================================

revoke execute on function public.portal_role(text) from anon;

select 'PORTAL_ROLE_ANON_REVOKED' as result;
