import { getSiteConfig, volLabel } from '@/lib/data/site-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentRecruitRound } from '@/lib/recruit/queries'
import { RECRUIT } from '@/lib/content/recruit'
import { RecruitApplicationForm } from '@/components/forms/recruit-application-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '지원하기',
  description:
    '연세대학교 창업학회 VERY 학회원 모집. 지원서 접수부터 데모데이까지, 한 학기의 시작.',
}

export default async function RecruitPage() {
  const [round, siteConfig] = await Promise.all([
    getCurrentRecruitRound(),
    getSiteConfig(),
  ])
  const open = Boolean(round?.apply_open)
  const heroEyebrow = `Recruit · ${volLabel(siteConfig)}`

  if (!open) {
    return (
      <main className="pt-14 md:pt-16">
        <section className="relative px-6 pb-24 pt-24 md:px-10 md:pb-32 md:pt-32">
          <p
            translate="no"
            className="flex items-center font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs"
          >
            <span aria-hidden className="mr-3 inline-block h-px w-8 bg-fg-muted" />
            {heroEyebrow}
          </p>
          <h1 className="mt-8 font-display text-[clamp(2rem,_5vw,_3.5rem)] font-bold leading-tight tracking-tight text-fg-primary md:mt-10">
            {RECRUIT.closedNotice.title}
          </h1>
          <p className="mt-6 max-w-[58ch] font-display text-base leading-[1.8] text-fg-subtle md:text-lg">
            {RECRUIT.closedNotice.body}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <a
              href="https://instagram.com/very_yonsei"
              target="_blank"
              rel="noopener noreferrer"
              translate="no"
              className="inline-flex items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:text-xs"
            >
              @VERY_YONSEI
              <span aria-hidden>↗</span>
            </a>
            <Link
              href="/contact"
              translate="no"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-muted transition-colors hover:text-fg-primary md:text-xs"
            >
              CONTACT
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="pt-14 md:pt-16">
      {/* Hero */}
      <section className="relative px-6 pb-12 pt-24 md:px-10 md:pb-16 md:pt-32">
        <p
          translate="no"
          className="flex items-center font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs"
        >
          <span aria-hidden className="mr-3 inline-block h-px w-8 bg-fg-muted" />
          {heroEyebrow}
        </p>
        <h1 className="mt-8 font-display text-[clamp(2rem,_5vw,_3.75rem)] font-bold leading-tight tracking-tight text-fg-primary md:mt-10">
          {RECRUIT.hero.headlineLine1}
        </h1>
        <p className="mt-6 max-w-[58ch] font-display text-base leading-[1.8] text-fg-subtle md:text-lg">
          {RECRUIT.hero.subline}
        </p>
      </section>

      {/* Schedule */}
      <section className="px-6 pb-16 md:px-10 md:pb-20">
        <h2 className="font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
          {RECRUIT.schedule.title}
        </h2>
        <dl className="mt-8 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
          {RECRUIT.schedule.items.map((item) => (
            <div key={item.mono} className="bg-bg-base p-5">
              <dt
                translate="no"
                className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
              >
                {item.mono}
              </dt>
              <dd className="mt-3 font-display text-sm font-bold text-fg-primary">
                {item.label}
              </dd>
              <dd className="mt-1 font-display text-sm text-fg-subtle">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* How to apply */}
      <section className="px-6 pb-16 md:px-10 md:pb-20">
        <h2 className="font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
          {RECRUIT.howTo.title}
        </h2>
        <ol className="mt-8 grid max-w-2xl grid-cols-1 gap-4">
          {RECRUIT.howTo.steps.map((step, i) => (
            <li key={step} className="flex items-start gap-4">
              <span
                translate="no"
                className="mt-0.5 font-mono text-[11px] tracking-[0.2em] text-fg-muted"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-display text-sm leading-[1.8] text-fg-subtle md:text-base">
                {step}
              </span>
            </li>
          ))}
        </ol>
        <a
          href={RECRUIT.howTo.formTemplateUrl}
          download={RECRUIT.howTo.formTemplateDownloadName}
          translate="no"
          className="mt-8 inline-flex items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:text-xs"
        >
          {RECRUIT.howTo.formTemplateLabel}
          <span aria-hidden>↓</span>
        </a>
      </section>

      {/* Notice */}
      <section className="px-6 pb-16 md:px-10 md:pb-20">
        <h2 className="font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
          {RECRUIT.notice.title}
        </h2>
        <ul className="mt-8 max-w-2xl border border-border p-6 md:p-8">
          {RECRUIT.notice.items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 py-1.5 font-display text-sm leading-[1.8] text-fg-subtle md:text-base"
            >
              <span aria-hidden className="mt-3 inline-block h-px w-3 shrink-0 bg-fg-muted" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Form */}
      <section className="px-6 pb-32 md:px-10 md:pb-40">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
            지원서 접수
          </h2>
          <RecruitApplicationForm />
          <p className="mt-10 font-display text-xs text-fg-muted md:text-sm">
            {RECRUIT.contactNote}
          </p>
        </div>
      </section>
    </main>
  )
}
