import Link from 'next/link'
import type { Route } from 'next'

/**
 * 어드민 전용 404. (authed) 레이아웃 안에서 렌더되므로 어드민 네비가 남는다.
 * 루트 404는 마케팅 프레임이라 여기서 뜨면 관리 흐름이 끊긴다.
 */
export default function AdminNotFound() {
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
        항목이 삭제되었거나 주소가 바뀌었을 수 있습니다.
      </p>

      <div className="mt-10">
        <Link
          href={'/admin' as Route}
          className="inline-flex w-fit items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:text-xs"
        >
          어드민 홈
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  )
}
