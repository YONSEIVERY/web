import Link from 'next/link'
import type { Metadata } from 'next'
import type { Route } from 'next'
import { DEMODAY } from '@/lib/content/demoday'
import {
  getCurrentDemoday,
  getDemodayVolumes,
  type DemodayEvent,
  type DemodayScheduleItem,
} from '@/lib/demoday/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '데모데이',
  description:
    'VERY의 학기 말 데모데이. 학회의 모든 창업팀이 한 무대에 올라 IR 피칭으로 한 학기를 결산하는 자리.',
}

const SEMESTER_LABEL: Record<string, string> = {
  '1학기': '1',
  '2학기': '2',
}

function formatVolumeMono(event: DemodayEvent) {
  const year = formatVolumeYear(event)
  const sem = SEMESTER_LABEL[event.semester] ?? '1'
  return year
    ? `Demoday — Vol.${event.volume} / ${year}—${sem}`
    : `Demoday — Vol.${event.volume} / ${event.semester}`
}

// 표시는 항상 한국 시간 기준. 서버 런타임(Vercel)의 TZ는 UTC이므로
// Date의 getHours/getFullYear가 아닌 Intl + timeZone:'Asia/Seoul'로 변환한다.
const KST = 'Asia/Seoul'

function getKSTParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    weekday: get('weekday').toUpperCase(),
    hour: get('hour'),
    minute: get('minute'),
  }
}

function formatVolumeYear(event: DemodayEvent): number | null {
  if (!event.event_date) return null
  const { year } = getKSTParts(new Date(event.event_date))
  return year ? Number(year) : null
}

function formatHM(date: Date) {
  const { hour, minute } = getKSTParts(date)
  return `${hour}:${minute}`
}

function formatVolumeDate(event: DemodayEvent) {
  if (!event.event_date) return null
  const start = new Date(event.event_date)
  const { year, month, day, weekday } = getKSTParts(start)
  const startTime = formatHM(start)
  if (event.event_end_date) {
    const end = new Date(event.event_end_date)
    return `${year}.${month}.${day} (${weekday}) ${startTime}–${formatHM(end)}`
  }
  return `${year}.${month}.${day} (${weekday}) ${startTime}`
}

export default async function DemodayPage() {
  const [current, volumes] = await Promise.all([
    getCurrentDemoday(),
    getDemodayVolumes(),
  ])
  return (
    <main className="pt-14 md:pt-16">
      <DemodayHero current={current} />
      <AboutSection />
      <FormatSection />
      {current && current.schedule.length > 0 && (
        <ScheduleSection schedule={current.schedule} />
      )}
      <VolumesSection volumes={volumes} />
      <AudienceSection />
      <ClosingSection current={current} />
    </main>
  )
}

function DemodayHero({ current }: { current: DemodayEvent | null }) {
  const { eventTitle, headlineLine1, headlineLine2, subline } = DEMODAY.hero
  const eyebrow = current
    ? formatVolumeMono(current)
    : 'Demoday'
  const dateLine = current ? formatVolumeDate(current) : null
  const location = current?.location ?? null
  const locationNote = current?.location_note ?? null
  const introText = current?.intro_text ?? subline
  const showRegister = current?.register_open ?? false
  return (
    <section className="about-hero relative px-6 pb-24 pt-28 md:px-10 md:pb-32 md:pt-44">
      <div className="md:grid md:grid-cols-12 md:items-start md:gap-x-10 lg:gap-x-16">
        <div className="md:col-span-7">
      <p
        translate="no"
        className="about-anim-eyebrow flex items-center font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs"
      >
        <span aria-hidden className="mr-3 inline-block h-px w-8 bg-fg-muted" />
        {eyebrow}
      </p>
      <h1
        translate="no"
        className="about-anim-headline mt-4 block font-sans font-bold tracking-tight text-fg-primary md:mt-6"
      >
        <span className="block text-[clamp(3.5rem,_11vw,_9rem)] leading-[0.95]">
          {eventTitle}
        </span>
      </h1>
      <p className="about-anim-subline mt-6 font-display font-bold tracking-tight text-fg-primary md:mt-8">
        <span className="block text-[clamp(1.75rem,_4.5vw,_3rem)] leading-[1.15]">
          {headlineLine1}
        </span>
        <span className="block text-[clamp(1.75rem,_4.5vw,_3rem)] leading-[1.15] text-fg-subtle">
          {headlineLine2}
        </span>
      </p>
      <p
        translate="no"
        className="about-anim-subline mt-8 max-w-[58ch] font-display text-sm italic lowercase tracking-[0.12em] text-fg-subtle md:mt-10 md:text-base"
      >
        {introText}
      </p>
      {(dateLine || location || locationNote || showRegister) && (
        <div className="about-anim-meta mt-10 flex flex-col gap-5 md:mt-12 md:gap-6">
          {(dateLine || location) && (
            <dl className="flex flex-col gap-2 md:gap-3">
              {dateLine && (
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <dt
                    translate="no"
                    className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs"
                  >
                    When
                  </dt>
                  <dd
                    translate="no"
                    className="font-mono text-xs uppercase tracking-[0.28em] text-fg-primary md:text-sm"
                  >
                    {dateLine}
                  </dd>
                </div>
              )}
              {location && (
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <dt
                    translate="no"
                    className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs"
                  >
                    Where
                  </dt>
                  <dd className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      translate="no"
                      className="font-mono text-xs uppercase tracking-[0.28em] text-fg-primary md:text-sm"
                    >
                      {location}
                    </span>
                    {locationNote && (
                      <span className="font-display text-xs text-fg-subtle md:text-sm">
                        {locationNote}
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          )}
          {showRegister && (
            <div>
              <Link
                href={'/demoday/register' as Route}
                translate="no"
                className="inline-flex items-center gap-3 rounded-full border-2 border-fg-primary px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:px-8 md:py-4 md:text-sm"
              >
                참관 신청
                <span aria-hidden className="text-base md:text-lg">→</span>
              </Link>
            </div>
          )}
        </div>
      )}
        </div>
        {current?.poster_url && (
          <div className="about-anim-meta mt-12 max-w-md md:col-span-5 md:mt-0 md:justify-self-end md:max-w-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.poster_url}
              alt={`Vol.${current.volume} 데모데이 포스터`}
              className="w-full border border-border"
            />
          </div>
        )}
      </div>
    </section>
  )
}

function AboutSection() {
  const { label, title, body } = DEMODAY.about
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

function FormatSection() {
  const { label, title, body, stats } = DEMODAY.format
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
        <ul className="about-anim-meta mt-12 grid grid-cols-1 gap-x-8 gap-y-10 border-t border-border pt-10 md:grid-cols-3">
          {stats.map((s) => (
            <li key={s.label} className="flex flex-col gap-2">
              <span
                translate="no"
                className="font-display text-[clamp(2.5rem,_5vw,_4rem)] font-bold leading-[0.95] tracking-tight text-fg-primary"
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

function ScheduleSection({ schedule }: { schedule: DemodayScheduleItem[] }) {
  const { label, title } = DEMODAY.schedule
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <ul className="about-anim-meta mt-12 flex flex-col border-t border-border">
          {schedule.map((s, idx) => (
            <li
              key={`${s.time}-${idx}`}
              className="grid grid-cols-12 items-baseline gap-x-4 border-b border-border py-6 md:gap-x-8 md:py-8"
            >
              <span
                translate="no"
                className="col-span-4 font-mono text-sm uppercase tracking-[0.2em] text-fg-primary md:col-span-2 md:text-base"
              >
                {s.time}
              </span>
              <span className="col-span-8 font-display text-base text-fg-subtle md:col-span-10 md:text-lg">
                {s.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function VolumesSection({ volumes }: { volumes: DemodayEvent[] }) {
  const { label, title } = DEMODAY.volumes
  if (volumes.length === 0) return null
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-24 md:gap-x-12 md:px-10 md:py-32">
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.75rem,_4vw,_2.75rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <ul className="about-anim-meta mt-12 flex flex-col border-t border-border">
          {volumes.map((v) => {
            const status = v.is_current
              ? v.register_open
                ? 'OPEN'
                : 'UPCOMING'
              : 'CLOSED'
            const year = formatVolumeYear(v)
            return (
              <li
                key={v.id}
                className="grid grid-cols-12 items-baseline gap-x-4 border-b border-border py-8 md:gap-x-8 md:py-10"
              >
                <span
                  translate="no"
                  className="col-span-4 font-display text-2xl font-bold tracking-tight text-fg-primary md:col-span-2 md:text-3xl"
                >
                  VOL.{v.volume}
                </span>
                <span
                  translate="no"
                  className="col-span-3 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:col-span-1 md:text-xs"
                >
                  {year ?? '—'}
                </span>
                <span
                  translate="no"
                  className={`col-span-5 font-mono text-[10px] uppercase tracking-[0.32em] md:col-span-2 md:text-xs ${
                    status === 'CLOSED' ? 'text-fg-muted' : 'text-accent'
                  }`}
                >
                  {status}
                </span>
                <div className="col-span-12 mt-3 md:col-span-7 md:mt-0">
                  <p className="font-display text-base font-bold tracking-tight text-fg-primary md:text-lg">
                    {v.semester}
                  </p>
                  {v.intro_text && (
                    <p className="mt-1 max-w-[58ch] text-sm leading-[1.7] text-fg-subtle md:text-base">
                      {v.intro_text}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function AudienceSection() {
  const { label, title, items } = DEMODAY.audience
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

function ClosingSection({ current }: { current: DemodayEvent | null }) {
  const { label, title, body, primary, secondary } = DEMODAY.closing
  const registerOpen = current?.register_open ?? false
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
          {registerOpen && (
            <Link
              href={'/demoday/register' as Route}
              translate="no"
              className="inline-flex items-center gap-3 rounded-full border-2 border-fg-primary px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:px-8 md:py-4 md:text-sm"
            >
              참관 신청
              <span aria-hidden className="text-base md:text-lg">→</span>
            </Link>
          )}
          <Link
            href={primary.href as Route}
            translate="no"
            className="inline-flex items-center gap-3 rounded-full border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:text-xs"
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
