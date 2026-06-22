import type { Metadata } from 'next'
import type { Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentDemoday } from '@/lib/demoday/queries'
import { DemodayAttendeeForm } from '@/components/forms/demoday-attendee-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '데모데이 참관 신청',
  description:
    'VERY 데모데이 참관 신청. 한 학기 동안 다진 IR 피칭을 결산 무대에서 직접 관람하실 수 있습니다.',
}

export default async function DemodayRegisterPage() {
  const current = await getCurrentDemoday()
  if (!current) notFound()

  if (!current.register_open) {
    return (
      <main className="pt-14 md:pt-16">
        <section className="relative px-6 pb-24 pt-24 md:px-10 md:pb-32 md:pt-32">
          <p
            translate="no"
            className="flex items-center font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs"
          >
            <span aria-hidden className="mr-3 inline-block h-px w-8 bg-fg-muted" />
            Demoday — Vol.{current.volume}
          </p>
          <h1 className="mt-8 font-display text-[clamp(2rem,_5vw,_3.5rem)] font-bold leading-tight tracking-tight text-fg-primary md:mt-10">
            아직 신청을 받고 있지 않습니다.
          </h1>
          <p className="mt-6 max-w-[58ch] font-display text-base leading-[1.8] text-fg-subtle md:text-lg">
            구체적 일정은 인스타그램에 가장 먼저 올라갑니다. 잠시 후 다시 들러 주세요.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link
              href={'/demoday' as Route}
              translate="no"
              className="inline-flex items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:text-xs"
            >
              데모데이 페이지로
              <span aria-hidden>→</span>
            </Link>
            <a
              href="https://instagram.com/very_yonsei"
              target="_blank"
              rel="noopener noreferrer"
              translate="no"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-muted transition-colors hover:text-fg-primary md:text-xs"
            >
              @VERY_YONSEI
              <span aria-hidden>↗</span>
            </a>
          </div>
        </section>
      </main>
    )
  }

  const dateLine = current.event_date
    ? formatDate(current.event_date)
    : null

  return (
    <main className="pt-14 md:pt-16">
      <section className="relative px-6 pb-12 pt-24 md:px-10 md:pb-16 md:pt-32">
        <p
          translate="no"
          className="flex items-center font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs"
        >
          <span aria-hidden className="mr-3 inline-block h-px w-8 bg-fg-muted" />
          Demoday — Vol.{current.volume} / 참관 신청
        </p>
        <h1 className="mt-8 font-display text-[clamp(2rem,_5vw,_3.75rem)] font-bold leading-tight tracking-tight text-fg-primary md:mt-10">
          한 학기 결산의 객석으로 모십니다.
        </h1>
        <div className="mt-8 flex flex-wrap items-center gap-4 md:gap-6">
          {dateLine && (
            <span
              translate="no"
              className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs"
            >
              {dateLine}
            </span>
          )}
          {current.location && (
            <span
              translate="no"
              className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs"
            >
              @ {current.location}
            </span>
          )}
        </div>
        {current.location_note && (
          <p className="mt-4 max-w-[58ch] font-display text-sm leading-[1.7] text-fg-subtle md:text-base">
            {current.location_note}
          </p>
        )}
      </section>

      <section className="px-6 pb-32 md:px-10 md:pb-40">
        <div className="mx-auto max-w-2xl">
          <DemodayAttendeeForm
            purposes={[...current.form_choices.purposes]}
            roles={[...current.form_choices.roles]}
            sources={[...current.form_choices.sources]}
          />
        </div>
      </section>
    </main>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}`
}
