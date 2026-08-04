import type { Metadata } from 'next'
import { PRIVACY } from '@/lib/content/privacy'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description:
    '연세대학교 창업학회 VERY의 개인정보처리방침. 수집 항목, 이용 목적, 보유 기간, 처리위탁과 정보주체의 권리를 안내합니다.',
}

export default function PrivacyPage() {
  return (
    <main className="pt-14 md:pt-16">
      <section className="px-6 pb-16 pt-24 md:px-10 md:pb-20 md:pt-32">
        <p
          translate="no"
          className="flex items-center font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs"
        >
          <span aria-hidden className="mr-3 inline-block h-px w-8 bg-fg-muted" />
          Privacy
        </p>
        <h1 className="mt-8 font-display text-[clamp(2rem,_5vw,_3.5rem)] font-bold leading-tight tracking-tight text-fg-primary md:mt-10">
          개인정보처리방침
        </h1>
        <p className="mt-6 max-w-[58ch] font-display text-base leading-[1.8] text-fg-subtle md:text-lg">
          {PRIVACY.intro}
        </p>
        <p
          translate="no"
          className="mt-6 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs"
        >
          시행일 · {PRIVACY.effectiveDate}
        </p>
      </section>

      {/* 수집 항목 */}
      <section className="px-6 pb-16 md:px-10 md:pb-20">
        <h2 className="font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
          {PRIVACY.collection.title}
        </h2>
        <div className="mt-8 grid max-w-3xl grid-cols-1 gap-px border border-border bg-border">
          {PRIVACY.collection.channels.map((ch) => (
            <div key={ch.name} className="bg-bg-base p-6 md:p-8">
              <h3 className="font-display text-lg font-bold tracking-tight text-fg-primary md:text-xl">
                {ch.name}
              </h3>
              <dl className="mt-5 grid grid-cols-1 gap-4">
                <ChannelRow label="수집 항목" value={ch.items} />
                <ChannelRow label="이용 목적" value={ch.purpose} />
                <ChannelRow label="보유 기간" value={ch.retention} />
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* 거부권 */}
      <TextSection title={PRIVACY.refusal.title} body={PRIVACY.refusal.body} />

      {/* 처리위탁·국외이전 */}
      <section className="px-6 pb-16 md:px-10 md:pb-20">
        <h2 className="font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
          {PRIVACY.outsourcing.title}
        </h2>
        <p className="mt-6 max-w-[58ch] font-display text-base leading-[1.8] text-fg-subtle">
          {PRIVACY.outsourcing.body}
        </p>
        <ul className="mt-8 max-w-3xl border border-border">
          {PRIVACY.outsourcing.vendors.map((v) => (
            <li
              key={v.name}
              className="flex flex-col gap-1 border-b border-border p-5 last:border-b-0 md:flex-row md:items-baseline md:gap-6 md:p-6"
            >
              <span
                translate="no"
                className="w-28 shrink-0 font-mono text-xs uppercase tracking-[0.28em] text-fg-primary"
              >
                {v.name}
              </span>
              <span className="font-display text-sm leading-[1.8] text-fg-subtle md:text-base">
                {v.work}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 파기 */}
      <TextSection
        title={PRIVACY.destruction.title}
        body={PRIVACY.destruction.body}
      />

      {/* 정보주체 권리 */}
      <TextSection title={PRIVACY.rights.title} body={PRIVACY.rights.body} />

      {/* 안전성 확보 조치 */}
      <section className="px-6 pb-16 md:px-10 md:pb-20">
        <h2 className="font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
          {PRIVACY.security.title}
        </h2>
        <ul className="mt-8 max-w-2xl">
          {PRIVACY.security.items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 py-1.5 font-display text-sm leading-[1.8] text-fg-subtle md:text-base"
            >
              <span
                aria-hidden
                className="mt-3 inline-block h-px w-3 shrink-0 bg-fg-muted"
              />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* 보호책임자 */}
      <section className="px-6 pb-16 md:px-10 md:pb-20">
        <h2 className="font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
          {PRIVACY.officer.title}
        </h2>
        <p className="mt-6 max-w-[58ch] font-display text-base leading-[1.8] text-fg-subtle">
          {PRIVACY.officer.body}
        </p>
        <div className="mt-6 max-w-2xl border border-border p-6 md:p-8">
          <p className="font-display text-sm font-bold text-fg-primary md:text-base">
            {PRIVACY.officer.role}
          </p>
          <a
            href={`mailto:${PRIVACY.officer.email}`}
            translate="no"
            className="mt-2 inline-block break-all font-mono text-xs uppercase tracking-[0.28em] text-fg-subtle transition-colors hover:text-fg-primary md:text-sm"
          >
            {PRIVACY.officer.email}
          </a>
        </div>
      </section>

      {/* 고지 */}
      <section className="px-6 pb-32 md:px-10 md:pb-40">
        <h2 className="font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
          {PRIVACY.notice.title}
        </h2>
        <p className="mt-6 max-w-[58ch] font-display text-base leading-[1.8] text-fg-subtle">
          {PRIVACY.notice.body}
        </p>
      </section>
    </main>
  )
}

function ChannelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 md:grid-cols-[7rem_1fr] md:gap-4">
      <dt className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs md:pt-1">
        {label}
      </dt>
      <dd className="font-display text-sm leading-[1.8] text-fg-subtle md:text-base">
        {value}
      </dd>
    </div>
  )
}

function TextSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="px-6 pb-16 md:px-10 md:pb-20">
      <h2 className="font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
        {title}
      </h2>
      <p className="mt-6 max-w-[58ch] font-display text-base leading-[1.8] text-fg-subtle">
        {body}
      </p>
    </section>
  )
}
