import Link from 'next/link'
import type { Metadata } from 'next'
import type { Route } from 'next'
import { CURRICULUM } from '@/lib/content/curriculum'
import { IndustryInquiryForm } from '@/components/forms/industry-inquiry-form'

export const metadata: Metadata = {
  title: '커리큘럼',
  description:
    'VERY 43기 정규 커리큘럼. 10만원 프로젝트 → 프리토타이핑 → 아이디어톤 → 데모데이의 네 단계와 스터디·인사이트·컨벤션 세 갈래의 보조 세션, 그리고 산학 협력.',
}

/**
 * /curriculum — semester program page.
 *
 * Content mirrors VERY 43기 OT (Tracks / Sessions / Industry) so the
 * page reads like an extension of the OT deck. Light "code-tone" cues
 * (`~/curriculum` eyebrow path, accent-colored hashtag chips, prompt
 * mark on tracks) are layered on top of the existing magazine skeleton;
 * we did not redo the whole visual system, only added monospace
 * affordances per the officer feedback.
 */
export default function CurriculumPage() {
  return (
    <main className="pt-14 md:pt-16">
      <CurriculumHero />
      <TracksSection />
      <SessionsSection />
      <IndustrySection />
      <IndustryInquirySection />
      <ClosingSection />
    </main>
  )
}

function CurriculumHero() {
  const { eyebrow, headlineLine1, headlineLine2, subline } = CURRICULUM.hero
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

function TracksSection() {
  const { label, title, body, items } = CURRICULUM.tracks
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

        <ol
          aria-label="정규 4단계 진행 순서"
          className="about-anim-meta mt-12 hidden items-center gap-3 md:mt-16 md:flex"
        >
          {items.map((item, index) => (
            <li
              key={item.num}
              className="flex flex-1 items-center gap-3 last:flex-none"
            >
              <div className="flex shrink-0 items-baseline gap-2">
                <span
                  translate="no"
                  className="font-mono text-xs tracking-[0.16em] text-accent"
                >
                  {item.num}
                </span>
                <span className="font-display text-sm tracking-tight text-fg-primary">
                  {item.mono}
                </span>
              </div>
              {index < items.length - 1 && (
                <span
                  aria-hidden
                  className="flex flex-1 items-center gap-2"
                >
                  <span className="h-px flex-1 bg-border-strong" />
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span className="h-px flex-1 bg-border-strong" />
                </span>
              )}
            </li>
          ))}
        </ol>

        <ol className="about-anim-meta mt-12 grid grid-cols-1 gap-px overflow-hidden border-t border-border bg-border md:mt-10 md:grid-cols-2 md:border md:border-border">
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
                <ul
                  translate="no"
                  className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.24em] text-accent md:text-xs"
                >
                  {item.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
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

function SessionsSection() {
  const { label, title, body, items } = CURRICULUM.sessions
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
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
                  className="flex items-center font-mono text-[10px] uppercase tracking-[0.32em] text-accent md:text-xs"
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
                <p
                  translate="no"
                  className="font-display text-sm italic lowercase tracking-[0.06em] text-fg-subtle md:text-base"
                >
                  {item.summary}
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

function IndustrySection() {
  const { label, title, body, note } = CURRICULUM.industry
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <p className="about-anim-body mt-6 max-w-[58ch] text-base leading-[1.8] text-fg-subtle md:text-lg">
          {body}
        </p>
        <p
          translate="no"
          className="about-anim-meta mt-6 max-w-[58ch] font-mono text-[11px] uppercase tracking-[0.24em] leading-[1.8] text-fg-muted md:text-xs"
        >
          &gt; {note}
        </p>
      </div>
    </section>
  )
}

function IndustryInquirySection() {
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label="INQUIRY" className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          산학협력 문의
        </h2>
        <p className="about-anim-body mt-6 max-w-[58ch] text-base leading-[1.8] text-fg-subtle md:text-lg">
          멘토링, 세션 진행, 공동 프로젝트 — 함께 만들 일이 있다면 알려주세요.
        </p>
        <div className="about-anim-meta mt-12 border-t border-border pt-10">
          <IndustryInquiryForm />
        </div>
      </div>
    </section>
  )
}

function ClosingSection() {
  const { label, title, body, primary, secondary } = CURRICULUM.closing
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
