import { pageMeta } from '@/lib/content/shared-metadata'
import Link from 'next/link'
import type { Route } from 'next'
import { ABOUT } from '@/lib/content/about'
import { getSiteConfig, volLabel } from '@/lib/data/site-config'
import { getPublicLeadership } from '@/lib/cohort-members/queries'

export const metadata = pageMeta({
  title: '소개',
  description:
    '연세대학교 창업학회 VERY. 1997년 벤처창업연구회로 발족, 매 학기 더 단단해진 지반을 다음 기수에게 넘겨오며 44기째 이어오고 있는 학회.',
  path: '/about',
})

export const revalidate = 60

const CURRENT_COHORT = 44

/**
 * /about - society profile page.
 *
 * Leadership 섹션은 cohort_members(role_tier in (president, vice_president))
 * 에서 조회. 데이터가 없으면 ABOUT.leadership.members 상수로 폴백한다.
 * "전체 멤버 보기" 링크로 /cohorts/[cohort] 로 이동.
 */
export default async function AboutPage() {
  const leaders = await getPublicLeadership(CURRENT_COHORT)
  const members: LeadershipMember[] =
    leaders.length > 0
      ? leaders.map((l) => ({
          roleMono:
            l.role_tier === 'president'
              ? 'PRESIDENT'
              : l.role_tier === 'vice_president'
                ? 'VICE PRESIDENT'
                : 'OFFICER',
          role: l.role_label ?? '',
          name: l.name,
          monoName: l.mono_name ?? '',
          email: l.email,
        }))
      : ABOUT.leadership.members.map((m) => ({ ...m, email: null }))
  return (
    <main className="pt-14 md:pt-16">
      <AboutHero />
      <OriginSection />
      <ManifestoSection />
      <CoreValueSection />
      <MindsetSection />
      <WhatWeDoSection />
      <LeadershipSection members={members} />
      <ClosingSection />
    </main>
  )
}

type LeadershipMember = {
  roleMono: string
  role: string
  name: string
  monoName: string
  email: string | null
}

async function AboutHero() {
  const eyebrow = `About · ${volLabel(await getSiteConfig())}`
  const { headlineLine1, headlineLine2, subline } = ABOUT.hero
  return (
    <section className="about-hero relative px-6 pb-24 pt-24 md:px-10 md:pb-32 md:pt-32">
      <p
        translate="no"
        className="about-anim-eyebrow flex items-center font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs"
      >
        <span aria-hidden className="mr-3 inline-block h-px w-8 bg-fg-muted" />
        {eyebrow}
      </p>
      <h1 className="about-anim-headline mt-8 font-display font-bold tracking-tight text-fg-primary md:mt-10">
        <span className="block text-[clamp(2.5rem,_7.5vw,_6.5rem)] leading-[1.05]">
          {headlineLine1}
        </span>
        <span className="block text-[clamp(2.5rem,_7.5vw,_6.5rem)] leading-[1.05] text-fg-subtle">
          {headlineLine2}
        </span>
      </h1>
      <p
        translate="no"
        className="about-anim-subline mt-8 max-w-[52ch] font-display text-sm italic lowercase tracking-[0.12em] text-fg-subtle md:mt-10 md:text-base"
      >
        {subline}
      </p>
    </section>
  )
}

async function OriginSection() {
  const sc = await getSiteConfig()
  const { title, body } = ABOUT.origin
  // 두 번째 마일스톤(현재 기수)은 site_config에서 동적으로 채운다
  const milestones = [
    ABOUT.origin.milestones[0],
    {
      year: String(sc.year),
      label: `VOL.${sc.cohort}`,
      note: `${sc.cohort}기, 현재 진행 중`,
    },
  ]
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <div className="col-span-12 md:col-span-8 md:col-start-3">
        <h2 className="about-anim-title font-display text-[clamp(2rem,_5vw,_3.5rem)] font-bold leading-[1.1] tracking-tight text-fg-primary">
          {title}
        </h2>
        <p className="about-anim-body mt-6 max-w-[58ch] text-base leading-[1.8] text-fg-subtle md:text-lg">
          {body}
        </p>

        <ul className="about-anim-meta mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-border pt-10">
          {milestones.map((m) => (
            <li key={m.year} className="flex flex-col gap-2">
              <span
                translate="no"
                className="whitespace-nowrap font-display text-[clamp(2.5rem,_5vw,_4rem)] font-bold leading-[0.95] tracking-tight text-fg-primary"
              >
                {m.year}
              </span>
              <span
                translate="no"
                className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs"
              >
                {m.label}
              </span>
              <span className="font-display text-sm leading-[1.6] text-fg-subtle">
                {m.note}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ManifestoSection() {
  const { title, body, lines } = ABOUT.manifesto
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <div className="col-span-12 md:col-span-8 md:col-start-3">
        <h2
          translate="no"
          className="about-anim-title font-display text-[clamp(2.5rem,_7vw,_5.5rem)] font-bold leading-[1.05] tracking-tight text-fg-primary"
        >
          {title}
        </h2>
        <p className="about-anim-body mt-8 max-w-[58ch] text-base leading-[1.8] text-fg-subtle md:text-lg">
          {body}
        </p>
        <ul className="about-anim-meta mt-12 flex flex-col gap-4 border-t border-border pt-10">
          {lines.map((line) => (
            <li
              key={line}
              className="flex gap-3 text-sm leading-[1.7] text-fg-subtle md:text-base"
            >
              <span
                aria-hidden
                translate="no"
                className="mt-[0.3em] inline-block font-mono text-xs text-accent-text"
              >
                &gt;
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function CoreValueSection() {
  const { title, body, items } = ABOUT.coreValue
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <div className="col-span-12 md:col-span-8 md:col-start-3">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <p className="about-anim-body mt-6 max-w-[58ch] text-base leading-[1.8] text-fg-subtle md:text-lg">
          {body}
        </p>
        <ol className="about-anim-meta mt-12 grid grid-cols-1 gap-px overflow-hidden border-t border-border bg-border md:grid-cols-3 md:border md:border-border">
          {items.map((item, index) => (
            <li key={item.mono} className="bg-bg-base">
              <div className="flex h-full flex-col gap-4 px-6 py-8 md:px-8 md:py-10">
                <div className="flex items-baseline gap-4">
                  <span
                    translate="no"
                    className="font-display text-3xl font-bold leading-none tracking-tight text-fg-muted md:text-4xl"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    translate="no"
                    className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent-text md:text-xs"
                  >
                    {item.mono}
                  </span>
                </div>
                <p className="font-display text-xl font-bold tracking-tight text-fg-primary md:text-2xl">
                  {item.title}
                </p>
                <p className="max-w-[36ch] text-sm leading-[1.7] text-fg-subtle md:text-base">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function MindsetSection() {
  const { title, body, items } = ABOUT.mindset
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <div className="col-span-12 md:col-span-8 md:col-start-3">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <p className="about-anim-body mt-6 max-w-[58ch] text-base leading-[1.8] text-fg-subtle md:text-lg">
          {body}
        </p>
        <ul className="about-anim-meta mt-12 flex flex-col border-t border-border">
          {items.map((item) => (
            <li
              key={item.mono}
              className="grid grid-cols-12 items-start gap-x-4 border-b border-border py-10 md:gap-x-8 md:py-12"
            >
              <div className="col-span-12 flex flex-col gap-2 md:col-span-4">
                <span
                  translate="no"
                  className="flex items-center font-mono text-[10px] uppercase tracking-[0.32em] text-accent-text md:text-xs"
                >
                  <span
                    aria-hidden
                    className="mr-3 inline-block h-px w-6 bg-accent"
                  />
                  {item.mono}
                </span>
                <p className="font-display text-xl font-bold tracking-tight text-fg-primary md:text-2xl">
                  {item.title}
                </p>
              </div>
              <ul className="col-span-12 mt-4 flex flex-col gap-3 md:col-span-8 md:mt-0">
                {item.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex gap-3 text-sm leading-[1.7] text-fg-subtle md:text-base"
                  >
                    <span
                      aria-hidden
                      translate="no"
                      className="mt-[0.3em] inline-block font-mono text-xs text-fg-muted"
                    >
                      &gt;
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function WhatWeDoSection() {
  const { title, items } = ABOUT.whatWeDo
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <div className="col-span-12 md:col-span-8 md:col-start-3">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <ul className="about-anim-meta mt-12 grid grid-cols-1 gap-px overflow-hidden border-t border-border bg-border md:grid-cols-2 md:border md:border-border">
          {items.map((item) => (
            <li key={item.monoLabel} className="bg-bg-base">
              <Link
                href={item.href as Route}
                className="group flex h-full flex-col gap-4 px-6 py-8 transition-colors hover:bg-bg-elev md:px-8 md:py-10"
              >
                <span
                  translate="no"
                  className="flex items-center font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs"
                >
                  <span
                    aria-hidden
                    className="mr-3 inline-block h-px w-6 bg-fg-primary"
                  />
                  {item.monoLabel}
                </span>
                <p className="font-display text-xl font-bold tracking-tight text-fg-primary md:text-2xl">
                  {item.title}
                </p>
                <p className="max-w-[40ch] text-sm leading-[1.7] text-fg-subtle md:text-base">
                  {item.body}
                </p>
                <span
                  translate="no"
                  className="mt-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted transition-colors group-hover:text-fg-primary md:text-xs"
                >
                  Read
                  <span aria-hidden>→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function LeadershipSection({ members }: { members: LeadershipMember[] }) {
  const { title } = ABOUT.leadership
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <div className="col-span-12 md:col-span-8 md:col-start-3">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <ul className="about-anim-meta mt-10 grid grid-cols-1 gap-8 md:mt-14 md:grid-cols-2 md:gap-12">
          {members.map((m) => {
            const meta = [m.monoName, m.role].filter(Boolean).join(' · ')
            return (
              <li
                key={`${m.roleMono}-${m.name}`}
                className="flex flex-col gap-3 border-t border-border pt-6"
              >
                <span
                  translate="no"
                  className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs"
                >
                  {m.roleMono}
                </span>
                <p className="font-display text-3xl font-bold tracking-tight text-fg-primary md:text-4xl">
                  {m.name}
                </p>
                {meta && (
                  <p
                    translate="no"
                    className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-subtle md:text-xs"
                  >
                    {meta}
                  </p>
                )}
                {m.email && (
                  <a
                    href={`mailto:${m.email}`}
                    translate="no"
                    className="mt-1 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted transition-colors hover:text-fg-primary md:text-xs"
                  >
                    {m.email}
                    <span aria-hidden>→</span>
                  </a>
                )}
              </li>
            )
          })}
        </ul>
        <div className="mt-10 md:mt-14">
          <Link
            href={'/cohorts' as Route}
            translate="no"
            className="inline-flex items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:text-xs"
          >
            기수별 멤버 보기
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

function ClosingSection() {
  const { title, body, primary, secondary } = ABOUT.closing
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-32 md:gap-x-12 md:px-10 md:py-40">
      <div className="col-span-12 md:col-span-8 md:col-start-3">
        <h2 className="about-anim-title font-display text-[clamp(2rem,_5vw,_3.5rem)] font-bold leading-[1.1] tracking-tight text-fg-primary">
          {title}
        </h2>
        <p className="about-anim-body mt-6 max-w-[52ch] text-base leading-[1.8] text-fg-subtle md:text-lg">
          {body}
        </p>
        <div className="about-anim-meta mt-10 flex flex-wrap items-center gap-6 md:gap-8">
          <Link
            href={primary.href as Route}
            translate="no"
            className="inline-flex items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:text-xs"
          >
            {primary.label}
            <span aria-hidden>→</span>
          </Link>
          <a
            href={secondary.href}
            target="_blank"
            rel="noopener noreferrer"
            translate="no"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-muted transition-colors hover:text-fg-primary md:text-xs"
          >
            {secondary.label}
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}
