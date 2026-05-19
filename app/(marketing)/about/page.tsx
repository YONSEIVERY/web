import Link from 'next/link'
import type { Metadata } from 'next'
import type { Route } from 'next'
import { ABOUT } from '@/lib/content/about'

export const metadata: Metadata = {
  title: '소개',
  description:
    '연세대학교 창업학회 VERY. 1997년 벤처창업연구회로 발족, 매 학기를 한 권의 잡지처럼 묶어 43권째 이어오고 있는 학회.',
}

/**
 * /about — society profile page.
 *
 * Five stacked editorial blocks under a hero. Sections inherit the same
 * eyebrow + hairline + content rhythm as the home manifesto/stats so the
 * page reads as the back-half of one continuous magazine, not a separate
 * design system.
 */
export default function AboutPage() {
  return (
    <main className="pt-14 md:pt-16">
      <AboutHero />
      <OriginSection />
      <WhatWeDoSection />
      <LeadershipSection />
      <ClosingSection />
    </main>
  )
}

function AboutHero() {
  const { eyebrow, headlineLine1, headlineLine2, subline } = ABOUT.hero
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

function OriginSection() {
  const { label, title, body, milestones } = ABOUT.origin
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
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
                className="font-display text-[clamp(2.5rem,_5vw,_4rem)] font-bold leading-[0.95] tracking-tight text-fg-primary"
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

function WhatWeDoSection() {
  const { label, title, items } = ABOUT.whatWeDo
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
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

function LeadershipSection() {
  const { label, title, members } = ABOUT.leadership
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <ul className="about-anim-meta mt-10 grid grid-cols-1 gap-8 md:mt-14 md:grid-cols-2 md:gap-12">
          {members.map((m) => (
            <li key={m.roleMono} className="flex flex-col gap-3 border-t border-border pt-6">
              <span
                translate="no"
                className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs"
              >
                {m.roleMono}
              </span>
              <p className="font-display text-3xl font-bold tracking-tight text-fg-primary md:text-4xl">
                {m.name}
              </p>
              <p
                translate="no"
                className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-subtle md:text-xs"
              >
                {m.monoName} · {m.role}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ClosingSection() {
  const { label, title, body, primary, secondary } = ABOUT.closing
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-32 md:gap-x-12 md:px-10 md:py-40">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
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

function SectionLabel({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <p
      translate="no"
      className={`about-anim-eyebrow flex items-start font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs ${className ?? ''}`}
    >
      <span aria-hidden className="mr-3 mt-2 inline-block h-px w-6 bg-fg-muted md:w-8" />
      {label}
    </p>
  )
}
