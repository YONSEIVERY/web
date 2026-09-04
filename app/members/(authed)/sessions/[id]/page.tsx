import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getSiteConfig } from '@/lib/data/site-config'
import { getPortalIdentity } from '@/lib/portal/auth'
import { getSessionById, SESSION_KIND_LABELS } from '@/lib/portal/queries'
import { formatKstDateTime } from '@/lib/utils/format-date'
import { Markdown } from '@/components/portal/markdown'
import { SessionPosts } from '@/components/portal/session-posts'
import { SessionMaterials } from '@/components/portal/session-materials'
import { SessionSubmissions } from '@/components/portal/session-submissions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const session = await getSessionById(id)
  // 비공개 초안 제목은 임원진 전용이라 탭 제목으로도 내보내지 않는다
  if (!session || !session.is_published) return {}
  return { title: session.title }
}

export default async function MemberSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, identity, siteConfig] = await Promise.all([
    params,
    getPortalIdentity(),
    getSiteConfig(),
  ])
  const session = await getSessionById(id)
  if (!session) notFound()
  const isExec = identity?.role === 'exec'
  // 비공개 초안은 임원진만
  if (!session.is_published && !isExec) notFound()
  // 지난 기수 아카이브 세션도 임원진만 (학회장 결정, 2026-08-04)
  if (session.cohort !== siteConfig.cohort && !isExec) notFound()

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
          안내글이 아직 등록되지 않았습니다.
        </p>
      )}

      <Suspense fallback={null}>
        <SessionMaterials sessionId={session.id} />
      </Suspense>

      {session.allow_submissions && identity && (
        <Suspense fallback={<SessionPostsFallback />}>
          <SessionSubmissions
            session={session}
            viewerEmail={identity.email}
            viewerIsExec={isExec}
          />
        </Suspense>
      )}

      {session.allow_posts && identity && (
        <Suspense fallback={<SessionPostsFallback />}>
          <SessionPosts
            sessionId={session.id}
            viewerEmail={identity.email}
            viewerIsExec={isExec}
          />
        </Suspense>
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

/**
 * 기록 피드는 서명 URL 배치 발급까지 기다리므로 세션 본문보다 늦다.
 * 경계를 두어 본문을 먼저 흘려보내고, 이 골격이 자리를 잡아둔다.
 * 모양은 sessions/[id]/loading.tsx의 스켈레톤 관용구를 따른다.
 */
function SessionPostsFallback() {
  return (
    <div
      role="status"
      className="mt-14 border-t border-border pt-10 motion-safe:animate-pulse"
    >
      <span className="sr-only">불러오는 중</span>
      <div aria-hidden>
        <div className="h-3 w-40 bg-border/30" />
        <div className="mt-3 h-7 w-40 bg-border/30 md:h-8" />
        <div className="mt-6 h-24 border border-border" />
        <div className="mt-8 h-28 border border-border" />
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
