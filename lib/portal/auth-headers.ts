/**
 * 미들웨어가 확인한 포털 신원을 렌더에 넘기는 요청 헤더 이름.
 *
 * 미들웨어(쓰는 쪽)와 lib/portal/auth.ts(읽는 쪽)가 같은 문자열을 봐야
 * 하므로 한 곳에 둔다. 이 헤더는 미들웨어가 모든 경로에서 벗긴 뒤 인증된
 * 경로에서만 다시 채우므로, 서버 안에서는 위조될 수 없는 값이다.
 */
export const PORTAL_EMAIL_HEADER = 'x-portal-email'
export const PORTAL_ROLE_HEADER = 'x-portal-role'
