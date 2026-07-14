import Link from 'next/link'
import type { Metadata } from 'next'
import type { Route } from 'next'
import { getPublishedCohortList } from '@/lib/cohort-members/queries'

export const revalidate = 60

export const metadata: Metadata = {
  title: '기수 아카이브',
  description:
    '연세대학교 창업학회 VERY 기수별 학회원 프로필 아카이브. 회장단·임원진·학회원을 기수별로 정리.',
}

export default async function CohortsIndexPage() {
  const cohorts = await getPublishedCohortList()
  return (
    <main className="pt-14 md:pt-16">
      <section className="about-hero relative px-6 pb-16 pt-24 md:px-10 md:pb-24 md:pt-32">
        <p
          translate="no"
          className="about-anim-eyebrow flex items-center font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs"
        >
          <span aria-hidden className="mr-3 inline-block h-px w-8 bg-fg-muted" />
          Members — Archive
        </p>
        <h1 className="about-anim-headline mt-8 font-display font-bold tracking-tight text-fg-primary md:mt-10">
          <span className="block text-[clamp(2.5rem,_7.5vw,_6.5rem)] leading-[1.05]">
            기수 아카이브.
          </span>
        </h1>
        <p
          translate="no"
          className="about-anim-subline mt-8 max-w-[58ch] font-display text-sm italic lowercase tracking-[0.12em] text-fg-subtle md:mt-10 md:text-base"
        >
          매 학기 지반을 함께 다진 사람들의 기록.
        </p>
      </section>

      <section className="px-6 pb-32 md:px-10 md:pb-40">
        <div className="mx-auto max-w-4xl">
          {cohorts.length === 0 ? (
            <p className="text-sm text-fg-muted">
              아직 공개된 기수가 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col border-t border-border">
              {cohorts.map((c) => (
                <li key={c.cohort} className="border-b border-border">
                  <Link
                    href={`/cohorts/${c.cohort}` as Route}
                    className="group grid grid-cols-12 items-baseline gap-x-4 py-8 md:gap-x-8 md:py-10"
                  >
                    <span
                      translate="no"
                      className="col-span-4 font-display text-2xl font-bold tracking-tight text-fg-primary md:col-span-2 md:text-3xl"
                    >
                      VOL.{c.cohort}
                    </span>
                    <span
                      translate="no"
                      className="col-span-4 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:col-span-2 md:text-xs"
                    >
                      {c.count}명
                    </span>
                    <span
                      translate="no"
                      className="col-span-4 flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted transition-colors group-hover:text-fg-primary md:col-span-8 md:justify-end md:text-xs"
                    >
                      Members
                      <span aria-hidden>→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
