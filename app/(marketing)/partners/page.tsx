import Link from 'next/link'
import type { Metadata } from 'next'
import type { Route } from 'next'
import { PARTNERS } from '@/lib/content/partners'
import { getPartners } from '@/lib/data/partners'
import type { Partner } from '@/lib/data/partners'
import { PartnerApplicationForm } from '@/components/forms/partner-application-form'

export const metadata: Metadata = {
  title: '파트너',
  description:
    'VERY의 산업·자본·교내 파트너십. 학회 팀이 학기 안에서 직접 만나는 기업·VC·교내 트랙.',
}

/**
 * /partners — external relationships page.
 *
 * Roster items are TBA placeholders until society confirms the current
 * volume's lineup. Category chip styling matches /demoday's status pill
 * pattern so all three pages read with a consistent "coming soon" voice.
 */
export default async function PartnersPage() {
  const roster = await getPartners()
  return (
    <main className="pt-14 md:pt-16">
      <PartnersHero />
      <IntroSection />
      <CategoriesSection />
      <RosterSection roster={roster} />
      <EngageSection />
      <ApplySection />
      <ClosingSection />
    </main>
  )
}

function PartnersHero() {
  const { eyebrow, headlineLine1, headlineLine2, subline } = PARTNERS.hero
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
        className="about-anim-subline mt-8 max-w-[58ch] font-display text-sm italic lowercase tracking-[0.12em] text-fg-subtle md:mt-10 md:text-base"
      >
        {subline}
      </p>
    </section>
  )
}

function IntroSection() {
  const { label, title, body } = PARTNERS.intro
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
      </div>
    </section>
  )
}

function CategoriesSection() {
  const { label, title, items } = PARTNERS.categories
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <ol className="about-anim-meta mt-12 grid grid-cols-1 gap-px overflow-hidden border-t border-border bg-border md:grid-cols-3 md:border md:border-border">
          {items.map((item) => (
            <li key={item.num} className="bg-bg-base">
              <div className="flex h-full flex-col gap-4 px-6 py-8 md:px-8 md:py-10">
                <div className="flex items-baseline gap-4">
                  <span
                    translate="no"
                    className="font-display text-3xl font-bold leading-none tracking-tight text-fg-muted md:text-4xl"
                  >
                    {item.num}
                  </span>
                  <span
                    translate="no"
                    className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs"
                  >
                    {item.mono}
                  </span>
                </div>
                <p className="font-display text-xl font-bold tracking-tight text-fg-primary md:text-2xl">
                  {item.title}
                </p>
                <p className="max-w-[42ch] text-sm leading-[1.7] text-fg-subtle md:text-base">
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

function RosterSection({ roster }: { roster: Partner[] }) {
  const { label, title, note } = PARTNERS.roster
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <p className="about-anim-body mt-6 max-w-[58ch] font-mono text-[11px] uppercase tracking-[0.24em] leading-[1.7] text-fg-muted md:text-xs">
          {note}
        </p>
        {roster.length === 0 ? (
          <p className="about-anim-body mt-12 border-t border-border pt-10 text-sm leading-[1.7] text-fg-muted md:text-base">
            곧 공개됩니다.
          </p>
        ) : (
          <ul className="about-anim-meta mt-12 flex flex-col border-t border-border">
            {roster.map((partner) => (
              <li
                key={partner.id}
                className="grid grid-cols-12 items-baseline gap-x-4 border-b border-border py-6 md:gap-x-8 md:py-8"
              >
                <span
                  translate="no"
                  className="col-span-4 font-mono text-[10px] uppercase tracking-[0.32em] text-accent md:col-span-2 md:text-xs"
                >
                  {partner.category}
                </span>
                <span
                  translate="no"
                  className="col-span-8 font-display text-lg font-bold tracking-tight text-fg-primary md:col-span-4 md:text-xl"
                >
                  {partner.name}
                </span>
                <p className="col-span-12 mt-2 text-sm leading-[1.7] text-fg-subtle md:col-span-6 md:mt-0 md:text-base">
                  {partner.oneLiner}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function EngageSection() {
  const { label, title, items } = PARTNERS.engage
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <ul className="about-anim-meta mt-12 grid grid-cols-1 gap-8 border-t border-border pt-10 md:grid-cols-3 md:gap-10">
          {items.map((item) => (
            <li key={item.mono} className="flex flex-col gap-3">
              <span
                translate="no"
                className="flex items-center font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs"
              >
                <span
                  aria-hidden
                  className="mr-3 inline-block h-px w-6 bg-fg-primary"
                />
                {item.mono}
              </span>
              <p className="font-display text-lg font-bold tracking-tight text-fg-primary md:text-xl">
                {item.title}
              </p>
              <p className="max-w-[36ch] text-sm leading-[1.7] text-fg-subtle md:text-base">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ApplySection() {
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label="APPLY" className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          파트너십 신청
        </h2>
        <p className="about-anim-body mt-6 max-w-[58ch] text-base leading-[1.8] text-fg-subtle md:text-lg">
          기업·자본·교내 어느 갈래든, 학기 안으로 함께 들어올 분이라면 아래로
          신청해 주세요. 검토 후 신청자 이메일로 회신드립니다.
        </p>
        <div className="about-anim-meta mt-12 border-t border-border pt-10">
          <PartnerApplicationForm />
        </div>
      </div>
    </section>
  )
}

function ClosingSection() {
  const { label, title, body, primary, secondary } = PARTNERS.closing
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
