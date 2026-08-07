import Link from 'next/link'
import { SiteNav } from '@/components/site/site-nav'
import { SiteFooter } from '@/components/site/site-footer'

/**
 * 전역 404. 루트 세그먼트 소속이라 (marketing) 레이아웃 밖에서 렌더되므로
 * 네비·푸터를 직접 조합해 사이트 프레임을 유지한다 (마키는 제외, 유틸리티
 * 페이지에는 과함). 카피는 매거진 메타포를 따른다: 없는 주소 = 인쇄되지
 * 않은 페이지.
 */
export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="pt-14 md:pt-16">
        <section className="relative grid grid-cols-12 gap-x-8 px-6 pb-24 pt-24 md:gap-x-12 md:px-10 md:pb-32 md:pt-32">
          <div className="col-span-12 md:col-span-8 md:col-start-3">
            <p
              translate="no"
              className="flex items-center font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs"
            >
              <span aria-hidden className="mr-3 inline-block h-px w-8 bg-fg-muted" />
              404 · Page Not Found
            </p>
            <h1 className="mt-8 font-display text-[clamp(2rem,_5vw,_3.5rem)] font-bold leading-tight tracking-tight text-fg-primary md:mt-10">
              이 페이지는 인쇄되지 않았습니다.
            </h1>
            <p className="mt-6 max-w-[58ch] font-display text-base leading-[1.8] text-fg-subtle md:text-lg">
              주소가 바뀌었거나 처음부터 없던 페이지입니다.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                href="/"
                translate="no"
                className="inline-flex items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:text-xs"
              >
                HOME
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/recruit"
                translate="no"
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-muted transition-colors hover:text-fg-primary md:text-xs"
              >
                RECRUIT
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
