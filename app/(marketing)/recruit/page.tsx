import { getSiteConfig, volLabel } from '@/lib/data/site-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  getCurrentRecruitRound,
  isDeadlinePassed,
  daysUntilDeadline,
  formatDeadlineKst,
} from '@/lib/recruit/queries'
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
  const deadlinePassed = isDeadlinePassed(round)
  const open = Boolean(round?.apply_open) && !deadlinePassed
  const heroEyebrow = `Recruit · ${volLabel(siteConfig)}`
  const notice = deadlinePassed ? RECRUIT.deadlineNotice : RECRUIT.closedNotice
  const daysLeft = daysUntilDeadline(round)
  const deadlineText = formatDeadlineKst(round)

  if (!open) {
    return (
      <main className="pt-14 md:pt-16">
        <section
          className={`relative grid grid-cols-12 gap-x-8 px-6 pt-24 md:gap-x-12 md:px-10 md:pt-32 ${
            deadlinePassed ? 'pb-12 md:pb-16' : 'pb-24 md:pb-32'
          }`}
        >
          <div className="col-span-12 md:col-span-8 md:col-start-3">
            <p
              translate="no"
              className="flex items-center font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs"
            >
              <span aria-hidden className="mr-3 inline-block h-px w-8 bg-fg-muted" />
              {heroEyebrow}
            </p>
            <h1 className="mt-8 font-display text-[clamp(2rem,_5vw,_3.5rem)] font-bold leading-tight tracking-tight text-fg-primary md:mt-10">
              {notice.title}
            </h1>
            <p className="mt-6 max-w-[58ch] font-display text-base leading-[1.8] text-fg-subtle md:text-lg">
              {notice.body}
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
          </div>
        </section>
        {/* 마감 직후 이 페이지를 찾는 사람은 대개 결과를 기다리는 지원자다.
            면접·발표 날짜를 다시 확인할 수 있게 일정만 남긴다. */}
        {deadlinePassed && (
          <div className="pb-16 md:pb-24">
            <ScheduleSection />
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="pt-14 md:pt-16">
      {/* Hero */}
      <section className="relative grid grid-cols-12 gap-x-8 px-6 pb-12 pt-24 md:gap-x-12 md:px-10 md:pb-16 md:pt-32">
        <div className="col-span-12 md:col-span-8 md:col-start-3">
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
          <Countdown left={daysLeft} deadline={deadlineText} />
        </div>
      </section>

      <ScheduleSection />

      {/* How to apply */}
      <section className="grid grid-cols-12 gap-x-8 px-6 pb-16 md:gap-x-12 md:px-10 md:pb-20">
        <div className="col-span-12 md:col-span-8 md:col-start-3">
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
        </div>
      </section>

      {/* Notice */}
      <section className="grid grid-cols-12 gap-x-8 px-6 pb-16 md:gap-x-12 md:px-10 md:pb-20">
        <div className="col-span-12 md:col-span-8 md:col-start-3">
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
        </div>
      </section>

      {/* Form */}
      <section id="apply" className="px-6 pb-32 md:px-10 md:pb-40">
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

/** 5칸 일정 스트립은 본문(8칸)보다 넓은 10칸 밴드 (cohorts 상세 관행). */
function ScheduleSection() {
  return (
    <section className="grid grid-cols-12 gap-x-8 px-6 pb-16 md:gap-x-12 md:px-10 md:pb-20">
      <div className="col-span-12 md:col-span-10 md:col-start-2">
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
      </div>
    </section>
  )
}

/**
 * 마감 카운트다운. 남은 일수가 있을 때만 뜨고 3일 이하면 accent로 바뀐다.
 * 누르면 접수 폼으로 내려간다. 마감 임박 유입을 폼까지 끌고 가는 것이 목적.
 */
function Countdown({
  left,
  deadline,
}: {
  left: number | null
  deadline: string | null
}) {
  if (left === null) return null
  const urgent = left <= 3
  return (
    <a
      href="#apply"
      className="group mt-8 inline-flex items-baseline gap-4 border border-border px-5 py-3 transition-colors hover:border-fg-primary md:mt-10"
    >
      <span
        translate="no"
        className={`font-mono text-xs uppercase tracking-[0.28em] ${
          urgent ? 'text-accent' : 'text-fg-primary'
        }`}
      >
        {left === 0 ? 'D-DAY' : `D-${left}`}
      </span>
      {deadline && (
        <span className="font-display text-sm text-fg-subtle">
          {deadline} 마감
        </span>
      )}
      <span
        aria-hidden
        className="font-mono text-xs text-fg-muted transition-transform group-hover:translate-x-1"
      >
        →
      </span>
      <span className="sr-only">지원서 접수 폼으로 이동</span>
    </a>
  )
}
