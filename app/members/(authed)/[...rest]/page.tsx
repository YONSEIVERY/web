import { notFound } from 'next/navigation'

/**
 * 포털 catch-all. 라우트 자체가 없는 주소(/members/없는메뉴)는 세그먼트가
 * 매칭되지 않아 (authed)/not-found.tsx가 아니라 루트 마케팅 404로 떨어진다.
 * members 호스트에서 그 404의 메뉴는 미들웨어 리라이트 때문에 다시 같은
 * 404로 되돌아오는 막다른 길이다. 이 catch-all이 모든 미매칭 주소를 잡아
 * notFound()를 호출하면 사이드바가 살아 있는 포털 404가 뜬다.
 *
 * 정적 세그먼트가 catch-all보다 항상 우선하므로 기존 라우트에는 영향이 없다.
 */
export default function PortalCatchAll() {
  notFound()
}
