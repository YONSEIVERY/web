import type { Metadata } from 'next'
import { CONTACT } from '@/lib/content/contact'

export const metadata: Metadata = {
  title: '연락',
  description:
    'VERY 학회 연락처. 모집·파트너십·언론 문의는 이메일과 인스타그램으로 받습니다. 담당자가 직접 확인해 회신드립니다.',
}

/**
 * /contact — channels-only contact page.
 *
 * No contact form: society has no routing inbox, so a real mailto/IG
 * is honest. Channels and tracks are split — channels are *where* to
 * send it, tracks are *what topic* goes where. FAQ disclosure uses
 * native <details>/<summary> so we stay RSC.
 */
export default function ContactPage() {
  return (
    <main className="pt-14 md:pt-16">
      <ContactHero />
      <IntroSection />
      <ChannelsSection />
      <FaqSection />
      <ClosingSection />
    </main>
  )
}

function ContactHero() {
  const { eyebrow, headlineLine1, headlineLine2, subline } = CONTACT.hero
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
  const { label, title, body } = CONTACT.intro
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

function ChannelsSection() {
  const { label, title, items } = CONTACT.channels
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <ul className="about-anim-meta mt-12 flex flex-col border-t border-border">
          {items.map((item) => (
            <li
              key={item.mono}
              className="grid grid-cols-12 items-baseline gap-x-4 border-b border-border py-8 md:gap-x-8 md:py-10"
            >
              <span
                translate="no"
                className="col-span-4 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:col-span-2 md:text-xs"
              >
                {item.mono}
              </span>
              <a
                href={item.href}
                {...(item.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                translate="no"
                className="col-span-8 inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight text-fg-primary transition-colors hover:text-accent md:col-span-4 md:text-xl"
              >
                {item.label}
                <span aria-hidden className="text-fg-muted">
                  {item.external ? '↗' : '→'}
                </span>
              </a>
              <p className="col-span-12 mt-2 text-sm leading-[1.7] text-fg-subtle md:col-span-6 md:mt-0 md:text-base">
                {item.note}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function FaqSection() {
  const { label, title, items } = CONTACT.faq
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <ul className="about-anim-meta mt-12 flex flex-col border-t border-border">
          {items.map((item) => (
            <li key={item.q} className="border-b border-border">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-6 md:py-8">
                  <span className="font-display text-base font-bold tracking-tight text-fg-primary md:text-lg">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="font-mono text-xs text-fg-muted transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[58ch] pb-6 text-sm leading-[1.8] text-fg-subtle md:pb-8 md:text-base">
                  {item.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ClosingSection() {
  const { label, title, body, primary, secondary } = CONTACT.closing
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
          <a
            href={primary.href}
            translate="no"
            className="inline-flex items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:text-xs"
          >
            {primary.label}
            <span aria-hidden>→</span>
          </a>
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
