import Link from 'next/link'
import type { Route } from 'next'

/**
 * 포털 전용 404. (authed) 레이아웃 안에서 렌더되므로 PortalNav가 남는다.
 * 루트 app/not-found.tsx는 SiteNav·SiteFooter를 단 마케팅 프레임이라,
 * members.* 호스트에서는 그 메뉴가 미들웨어의 /members 프리픽스 때문에
 * 다시 같은 404로 되돌아온다. 여기서 경계를 끊어 그 2차 오류까지 막는다.
 */
export default function PortalNotFound() {
  return (
    <div className="max-w-2xl">
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs"
      >
        404 · Not Found
      </p>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
        찾을 수 없는 페이지입니다.
      </h1>
      <p className="mt-4 max-w-[52ch] font-display text-sm leading-relaxed text-fg-subtle">
        세션이 삭제되었거나, 아직 공개되지 않았거나, 열람 권한이 없는
        주소입니다. 지난 기수 자료는 임원진만 열 수 있습니다.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-6">
        <Link
          href={'/members' as Route}
          className="inline-flex w-fit items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:text-xs"
        >
          포털 홈
          <span aria-hidden>→</span>
        </Link>
        <Link
          href={'/members/people' as Route}
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-subtle underline hover:text-fg-primary"
        >
          멤버 목록
        </Link>
      </div>
    </div>
  )
}
