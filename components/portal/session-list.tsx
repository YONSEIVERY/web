import Link from 'next/link'
import type { Route } from 'next'
import type { ClubSession } from '@/lib/portal/queries'
import { isPastDue } from '@/lib/portal/deadline'
import { formatKstDateTime } from '@/lib/utils/format-date'

/**
 * 세션 목록. 포털 홈(정규 세션)과 종류별 페이지가 같은 줄 모양을 쓴다.
 * title이 null이면 페이지 제목이 이미 종류를 말해주고 있다는 뜻이다.
 */
export function SessionList({
  title,
  sessions,
  isExec,
}: {
  title: string | null
  sessions: ClubSession[]
  isExec: boolean
}) {
  if (sessions.length === 0) return null
  return (
    <section className={title ? 'mt-10' : 'mt-6'}>
      {title && (
        <p
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
        >
          {title}
        </p>
      )}
      <ul
        className={`${title ? 'mt-4 ' : ''}divide-y divide-border border border-border`}
      >
        {sessions.map((s) => (
          <li key={s.id}>
            <Link
              href={`/members/sessions/${s.id}` as Route}
              className="flex items-baseline gap-3 p-4 transition-colors hover:bg-border/30"
            >
              {s.week !== null && (
                <span
                  translate="no"
                  className="shrink-0 font-mono text-[10px] uppercase tracking-[0.24em] text-fg-muted"
                >
                  W{String(s.week).padStart(2, '0')}
                </span>
              )}
              {/* 폰에서는 DRAFT 배지가 제목 폭을 잠식해 제목이 여러 줄로 접힌다 */}
              <span className="flex min-w-0 flex-1 flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                <span className="font-display text-sm font-bold text-fg-primary md:text-base">
                  {s.title}
                </span>
                {!s.is_published && isExec && (
                  <span
                    translate="no"
                    className="shrink-0 border border-fg-muted px-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-fg-muted"
                  >
                    DRAFT
                  </span>
                )}
                {/* 제출 칸이 세션 상세 안에만 있으면 낼 것이 있는지 목록에서
                    알 수 없다. 마감 전인 회차만 표시한다. */}
                {s.allow_submissions && !isPastDue(s.submission_due) && (
                  <span className="shrink-0 border border-fg-primary px-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-fg-primary">
                    제출
                  </span>
                )}
                {s.post_due && !isPastDue(s.post_due) && (
                  <span className="shrink-0 border border-fg-primary px-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-fg-primary">
                    과제
                  </span>
                )}
              </span>
              {s.event_date && (
                <span className="ml-auto shrink-0 font-mono text-[10px] text-fg-muted">
                  {formatKstDateTime(s.event_date).slice(0, 10)}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
