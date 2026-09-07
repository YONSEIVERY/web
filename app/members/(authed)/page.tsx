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
  type ClubSession,
} from '@/lib/portal/queries'
import { SessionList } from '@/components/portal/session-list'
import { isPastDue } from '@/lib/portal/deadline'
import { formatKstDateTime } from '@/lib/utils/format-date'

export const dynamic = 'force-dynamic'

/**
 * 아직 낼 수 있고 마감이 걸린 회차의 마감 시각. 없으면 null.
 * 마감 없이 열려만 있는 제출은 급하지 않으므로 세지 않는다.
 */
function openDue(s: ClubSession): string | null {
  if (s.post_due && !isPastDue(s.post_due)) return s.post_due
  if (s.allow_submissions && s.submission_due && !isPastDue(s.submission_due))
    return s.submission_due
  return null
}

/**
 * 포털 홈. 공지 + 정규 세션. ?cohort=43 으로 지난 기수 아카이브 열람.
 * 학회원에게는 공개된 세션만, 임원진에게는 비공개 초안까지 보인다.
 *
 * 비정규 세션(인사이트·스터디·컨벤션·기타)은 사이드바의 종류별 페이지로
 * 뺐다. 인사이트가 주차별로 쌓이면 홈에서 정규 세션이 밀려나기 때문이다.
 * 아카이브만 예외로 전 종류를 여기서 보여준다. 사이드바 링크에는 기수가
 * 실리지 않아 지난 기수의 비정규 세션에 닿을 다른 경로가 없다.
 */
export default async function MembersHomePage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>
}) {
  const [{ cohort: cohortParam }, siteConfig, identity] = await Promise.all([
    searchParams,
    getSiteConfig(),
    getPortalIdentity(),
  ])
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

  const regular = sessions.filter((s) => s.kind === 'regular')
  const empty = isArchive ? sessions.length === 0 : regular.length === 0

  // 비정규 세션을 사이드바로 뺐더니 인사이트 과제 마감이 홈에서 사라졌다.
  // 종류와 무관하게 마감이 남은 회차를 임박순으로 한 자리에 모은다.
  // 세션은 이미 전 종류를 조회했으므로 추가 비용은 없다.
  const pending = isArchive
    ? []
    : sessions
        .map((s) => ({ session: s, due: openDue(s) }))
        .filter(
          (x): x is { session: ClubSession; due: string } => x.due !== null,
        )
        .sort((a, b) => Date.parse(a.due) - Date.parse(b.due))

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

      {pending.length > 0 && (
        <section className="mt-10">
          <SectionLabel>마감이 남은 제출</SectionLabel>
          <ul className="mt-4 divide-y divide-border border border-fg-primary">
            {pending.map(({ session: s, due }) => (
              <li key={s.id}>
                <Link
                  href={`/members/sessions/${s.id}` as Route}
                  className="flex flex-col items-start gap-1 p-4 transition-colors hover:bg-border/30 sm:flex-row sm:items-baseline sm:gap-3"
                >
                  <span className="font-display text-sm font-bold text-fg-primary md:text-base">
                    {s.title}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] tracking-[0.16em] text-fg-primary sm:ml-auto">
                    {formatKstDateTime(due)} 마감
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isArchive ? (
        SESSION_KINDS.map((k) => (
          <SessionList
            key={k}
            title={SESSION_KIND_LABELS[k]}
            sessions={sessions.filter((s) => s.kind === k)}
            isExec={isExec}
          />
        ))
      ) : (
        <SessionList
          title={SESSION_KIND_LABELS.regular}
          sessions={regular}
          isExec={isExec}
        />
      )}

      {empty && (
        <p className="mt-16 text-center font-display text-sm text-fg-muted">
          {isArchive
            ? '아직 등록된 세션이 없습니다.'
            : '아직 등록된 정규 세션이 없습니다.'}
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
