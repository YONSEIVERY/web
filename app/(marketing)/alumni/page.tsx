import Link from 'next/link'
import type { Metadata } from 'next'
import type { Route } from 'next'
import { ALUMNI } from '@/lib/content/alumni'
import { getAlumniCompanies } from '@/lib/data/alumni'
import type { AlumniCompany } from '@/lib/data/alumni'

export const metadata: Metadata = {
  title: '알럼나이',
  description:
    'VERY의 알럼나이 네트워크. 1997년부터 누적된 회원·동문 창업가·후속 합류·투자 라운드로 이어지는 책장.',
}

/**
 * /alumni — accumulated network page.
 *
 * Spotlight uses TBA placeholders until the society's Notion roster is
 * wired. Status pill ("TBA") is styled like /demoday's status column so
 * users read it as "coming soon" rather than missing data.
 */
export default async function AlumniPage() {
  const companies = await getAlumniCompanies()
  return (
    <main className="pt-14 md:pt-16">
      <AlumniHero />
      <IntroSection />
      <StatsSection />
      <SpotlightSection companies={companies} />
      <PathwaysSection />
      <ClosingSection />
    </main>
  )
}

function AlumniHero() {
  const { eyebrow, headlineLine1, headlineLine2, subline } = ALUMNI.hero
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
  const { label, title, body } = ALUMNI.intro
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

function StatsSection() {
  const { label, title, items } = ALUMNI.stats
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <ul className="about-anim-meta mt-12 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-border pt-10 md:grid-cols-4">
          {items.map((s) => (
            <li key={s.label} className="flex flex-col gap-2">
              <span
                translate="no"
                className="font-display text-[clamp(2.25rem,_4.5vw,_3.5rem)] font-bold leading-[0.95] tracking-tight text-fg-primary"
              >
                {s.value}
              </span>
              <span
                translate="no"
                className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs"
              >
                {s.label}
              </span>
              <span className="font-display text-sm leading-[1.6] text-fg-subtle">
                {s.note}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function SpotlightSection({ companies }: { companies: AlumniCompany[] }) {
  const { label, title, note } = ALUMNI.spotlight
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
        {companies.length === 0 ? (
          <p className="about-anim-body mt-12 border-t border-border pt-10 text-sm leading-[1.7] text-fg-muted md:text-base">
            곧 공개됩니다.
          </p>
        ) : (
          <ul className="about-anim-meta mt-12 grid grid-cols-1 gap-px overflow-hidden border-t border-border bg-border md:grid-cols-2 md:border md:border-border">
            {companies.map((company) => (
              <li key={company.id} className="bg-bg-base">
                <div className="flex h-full flex-col gap-4 px-6 py-8 md:px-8 md:py-10">
                  <div className="flex items-baseline justify-between gap-4">
                    <p
                      translate="no"
                      className="font-display text-xl font-bold tracking-tight text-fg-primary md:text-2xl"
                    >
                      {company.name}
                    </p>
                    {company.stage && (
                      <span
                        translate="no"
                        className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent md:text-xs"
                      >
                        {company.stage}
                      </span>
                    )}
                  </div>
                  <p className="max-w-[42ch] text-sm leading-[1.7] text-fg-subtle md:text-base">
                    {company.oneLiner}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function PathwaysSection() {
  const { label, title, items } = ALUMNI.pathways
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

function ClosingSection() {
  const { label, title, body, primary, secondary } = ALUMNI.closing
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
