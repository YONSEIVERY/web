-- ============================================================
-- 0024: 인자 있는 is_admin(text)·portal_role(text) 드롭
--
-- 0023이 무인자 버전을 올리고 호출부 4곳(미들웨어 2곳, getPortalIdentity,
-- requireAdmin)을 전부 그쪽으로 옮겼다. 배포 후 어드민 로그인이 정상
-- 동작하는 것을 확인했으므로 남은 인자 버전을 지운다. 이 버전이 살아 있는
-- 한 authenticated는 임의 주소를 넣어 운영진·학회원 여부를 조회할 수 있다.
--
-- 사전 확인: 인자 버전을 참조하는 다른 함수도, RLS 정책도 없다
-- (PII 테이블은 정책 0개가 정상 상태라 애초에 참조할 자리가 없다).
--
-- 되돌리려면 0014(portal_role)와 0022(is_admin)의 정의를 다시 실행하면
-- 되지만, 그때는 애플리케이션도 인자 호출로 함께 되돌려야 한다.
-- ============================================================

drop function if exists public.is_admin(text);
drop function if exists public.portal_role(text);

notify pgrst, 'reload schema';

select 'EMAIL_ARG_RPC_DROPPED' as result;
