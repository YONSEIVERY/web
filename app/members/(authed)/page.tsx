import Link from 'next/link'
import type { Route } from 'next'
import { redirect } from 'next/navigation'
import { getSiteConfig } from '@/lib/data/site-config'
import { getPortalIdentity } from '@/lib/portal/auth'
import {
  getNotices,
  getSessions,
  SESSION_KINDS,
  SESSION_KIND_LABELS,
  SESSION_KIND_SHORT,
  type ClubSession,
  type SessionKind,
} from '@/lib/portal/queries'
import { isPastDue } from '@/lib/portal/deadline'
import { formatKstDateTime } from '@/lib/utils/format-date'

export const dynamic = 'force-dynamic'

/** 아직 낼 수 있는 것이 남은 회차. 탭에 점을 찍을지 판단한다. */
function hasOpenTask(s: ClubSession): boolean {
  if (s.allow_submissions && !isPastDue(s.submission_due)) return true
  return Boolean(s.post_due) && !isPastDue(s.post_due)
}

/**
 * 포털 홈. 공지 + 세션 목록. ?cohort=43 으로 지난 기수 아카이브 열람.
 * 학회원에게는 공개된 세션만, 임원진에게는 비공개 초안까지 보인다.
 *
 * 세션은 종류별 탭 하나씩만 그린다(?kind=insight). 인사이트가 주차별로
 * 쌓이면 한 화면에 스무 건이 넘어 정규 세션까지 밀려나기 때문이다.
 * 다른 탭에 낼 것이 남아 있으면 탭 이름 옆에 점을 찍어 놓치지 않게 한다.
 */
export default async function MembersHomePage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string; kind?: string }>
}) {
  const [{ cohort: cohortParam, kind: kindParam }, siteConfig, identity] =
    await Promise.all([searchParams, getSiteConfig(), getPortalIdentity()])
  const currentCohort = siteConfig.cohort
  const cohort = cohortParam ? Number(cohortParam) : currentCohort
  const isArchive = cohort !== currentCohort
  const isExec = identity?.role === 'exec'
  // 지난 기수 아카이브는 임원진 전용 (학회장 결정, 2026-08-04)
  if (isArchive && !isExec) redirect('/members')

  const [notices, sessions] = await Promise.all([
    isArchive ? Promise.resolve([]) : getNotices(cohort),
    getSessions({ cohort, publishedOnly: !isExec }),
  ])

  // 세션이 한 건이라도 있는 종류만 탭으로 낸다. 스터디 회차를 만들기 전까지
  // 빈 탭을 보여줄 이유가 없다.
  const tabs = SESSION_KINDS.filter((k) => sessions.some((s) => s.kind === k))
  const activeKind: SessionKind | undefined =
    tabs.find((k) => k === kindParam) ?? tabs[0]
  const shown = activeKind
    ? sessions.filter((s) => s.kind === activeKind)
    : []

  // 아카이브를 보는 중이면 탭을 옮겨도 기수가 유지돼야 한다.
  const tabHref = (k: SessionKind) =>
    (isArchive
      ? `/members?cohort=${cohort}&kind=${k}`
      : `/members?kind=${k}`) as Route

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        VERY · VOL.{cohort}
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        {isArchive ? `${cohort}기 아카이브` : `${cohort}기 학회원 페이지`}
      </h1>
      <div className="mt-4 flex flex-wrap gap-4">
        {isArchive ? (
          <Link
            href={'/members' as Route}
            className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-subtle underline hover:text-fg-primary"
          >
            ← {currentCohort}기로 돌아가기
          </Link>
        ) : (
          isExec && (
            <Link
              href={`/members?cohort=${currentCohort - 1}` as Route}
              className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-subtle underline hover:text-fg-primary"
            >
              {currentCohort - 1}기 아카이브 보기
            </Link>
          )
        )}
      </div>

      {notices.length > 0 && (
        <section className="mt-10">
          <SectionLabel>공지사항</SectionLabel>
          <ul className="mt-4 divide-y divide-border border border-border">
            {notices.map((n) => (
              <li key={n.id} className="p-4">
                <div className="flex items-baseline gap-3">
                  {n.pinned && (
                    <span
                      translate="no"
                      className="font-mono text-[10px] uppercase tracking-[0.24em] text-fg-primary"
                    >
                      PIN
                    </span>
                  )}
                  <span className="font-display text-sm font-bold text-fg-primary md:text-base">
                    {n.title}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-fg-muted">
                    {formatKstDateTime(n.created_at).slice(0, 10)}
                  </span>
                </div>
                {n.content_md && (
                  <p className="mt-2 whitespace-pre-wrap font-display text-sm leading-relaxed text-fg-subtle">
                    {n.content_md}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tabs.length > 1 && (
        <nav className="mt-10 flex flex-wrap gap-x-6 border-b border-border">
          {tabs.map((k) => {
            const active = k === activeKind
            const pending = sessions.some((s) => s.kind === k && hasOpenTask(s))
            return (
              <Link
                key={k}
                href={tabHref(k)}
                aria-current={active ? 'page' : undefined}
                className={`-mb-px flex items-center gap-1.5 border-b-2 pb-3 font-mono text-[11px] tracking-[0.24em] transition-colors ${
                  active
                    ? 'border-fg-primary text-fg-primary'
                    : 'border-transparent text-fg-muted hover:text-fg-primary'
                }`}
              >
                {SESSION_KIND_SHORT[k]}
                {/* 다른 탭에 마감 전 제출이 남아 있으면 들어가 보게 만든다 */}
                {pending && (
                  <span
                    aria-label="제출할 것이 남아 있습니다"
                    className="h-1.5 w-1.5 rounded-full bg-fg-primary"
                  />
                )}
              </Link>
            )
          })}
        </nav>
      )}

      {activeKind && (
        <SessionList
          title={tabs.length > 1 ? null : SESSION_KIND_LABELS[activeKind]}
          sessions={shown}
          isExec={isExec}
        />
      )}

      {sessions.length === 0 && (
        <p className="mt-16 text-center font-display text-sm text-fg-muted">
          아직 등록된 세션이 없습니다.
        </p>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      translate="no"
      className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
    >
      {children}
    </p>
  )
}

/** title이 null이면 탭 바가 이미 종류를 말해주고 있다는 뜻이다. */
function SessionList({
  title,
  sessions,
  isExec,
}: {
  title: string | null
  sessions: Awaited<ReturnType<typeof getSessions>>
  isExec: boolean
}) {
  if (sessions.length === 0) return null
  return (
    <section className={title ? 'mt-10' : 'mt-6'}>
      {title && <SectionLabel>{title}</SectionLabel>}
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
