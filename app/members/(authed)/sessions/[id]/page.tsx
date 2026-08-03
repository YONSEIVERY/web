import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getPortalIdentity } from '@/lib/portal/auth'
import { getSessionById, SESSION_KIND_LABELS } from '@/lib/portal/queries'
import { formatKstDateTime } from '@/lib/utils/format-date'
import { Markdown } from '@/components/portal/markdown'
import { SessionPosts } from '@/components/portal/session-posts'

export const dynamic = 'force-dynamic'

export default async function MemberSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, identity] = await Promise.all([params, getPortalIdentity()])
  const session = await getSessionById(id)
  if (!session) notFound()
  const isExec = identity?.role === 'exec'
  // 비공개 초안은 임원진만
  if (!session.is_published && !isExec) notFound()

  return (
    <div className="max-w-3xl">
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
      >
        VOL.{session.cohort} · {SESSION_KIND_LABELS[session.kind]}
        {session.week !== null && ` · W${String(session.week).padStart(2, '0')}`}
      </p>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
        {session.title}
      </h1>

      {(session.event_date ||
        session.location ||
        session.speaker ||
        session.location_note) && (
        <dl className="mt-6 grid grid-cols-1 gap-2 border border-border p-5 text-sm sm:grid-cols-2">
          {session.event_date && (
            <MetaRow label="일시" value={formatKstDateTime(session.event_date)} />
          )}
          {session.location && (
            <MetaRow label="장소" value={session.location} />
          )}
          {session.speaker && <MetaRow label="연사" value={session.speaker} />}
          {session.location_note && (
            <MetaRow label="안내" value={session.location_note} />
          )}
        </dl>
      )}

      {session.content_md ? (
        <div className="mt-8">
          <Markdown content={session.content_md} />
        </div>
      ) : (
        <p className="mt-8 font-display text-sm text-fg-muted">
          자료가 아직 등록되지 않았습니다.
        </p>
      )}

      {session.allow_posts && identity && (
        <SessionPosts
          sessionId={session.id}
          viewerEmail={identity.email}
          viewerIsExec={isExec}
        />
      )}

      <div className="mt-12 flex flex-wrap gap-6">
        <Link
          href={`/members?cohort=${session.cohort}` as Route}
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-subtle underline hover:text-fg-primary"
        >
          ← 목록으로
        </Link>
        {isExec && (
          <Link
            href={`/members/manage/sessions/${session.id}` as Route}
            className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-subtle underline hover:text-fg-primary"
          >
            편집
          </Link>
        )}
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt
        translate="no"
        className="w-12 shrink-0 font-mono text-[10px] uppercase tracking-[0.24em] text-fg-muted leading-6"
      >
        {label}
      </dt>
      <dd className="font-display text-sm text-fg-subtle">{value}</dd>
    </div>
  )
}
