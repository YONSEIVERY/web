import Link from 'next/link'
import type { Route } from 'next'
import { requireExec } from '@/lib/portal/auth'
import { getSiteConfig } from '@/lib/data/site-config'
import {
  getSessions,
  SESSION_KIND_LABELS,
} from '@/lib/portal/queries'
import { formatKstDateTime } from '@/lib/utils/format-date'

export const dynamic = 'force-dynamic'

/** 출결 체크할 세션을 고르는 목록. */
export default async function ManageAttendanceIndexPage() {
  await requireExec()
  const siteConfig = await getSiteConfig()
  const sessions = await getSessions({
    cohort: siteConfig.cohort,
    publishedOnly: false,
  })

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        MANAGE · ATTENDANCE
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        Vol.{siteConfig.cohort} 출결 관리
      </h1>
      <p className="mt-3 font-display text-sm text-fg-subtle">
        출결을 기록할 세션을 선택하세요.
      </p>

      <ul className="mt-8 divide-y divide-border border border-border">
        {sessions.map((s) => (
          <li key={s.id}>
            <Link
              href={`/members/manage/attendance/${s.id}` as Route}
              className="flex items-baseline gap-3 p-4 transition-colors hover:bg-border/30"
            >
              <span
                translate="no"
                className="shrink-0 font-mono text-[10px] uppercase tracking-[0.24em] text-fg-muted"
              >
                {s.week !== null
                  ? `W${String(s.week).padStart(2, '0')}`
                  : SESSION_KIND_LABELS[s.kind]}
              </span>
              <span className="font-display text-sm font-bold text-fg-primary">
                {s.title}
              </span>
              {s.event_date && (
                <span className="ml-auto shrink-0 font-mono text-[10px] text-fg-muted">
                  {formatKstDateTime(s.event_date).slice(0, 10)}
                </span>
              )}
            </Link>
          </li>
        ))}
        {sessions.length === 0 && (
          <li className="p-12 text-center font-display text-sm text-fg-muted">
            먼저 세션을 등록하세요.
          </li>
        )}
      </ul>
    </div>
  )
}
