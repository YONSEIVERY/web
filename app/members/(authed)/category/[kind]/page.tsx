import { notFound } from 'next/navigation'
import { getSiteConfig } from '@/lib/data/site-config'
import { getPortalIdentity } from '@/lib/portal/auth'
import {
  getSessions,
  SESSION_KINDS,
  SESSION_KIND_LABELS,
  type SessionKind,
} from '@/lib/portal/queries'
import { SessionList } from '@/components/portal/session-list'

export const dynamic = 'force-dynamic'

/**
 * 종류별 세션 목록. 사이드바의 인사이트 · 스터디 · 컨벤션 · 기타가 여기로
 * 온다. 정규 세션은 홈이 맡으므로 이 경로로는 열리지 않는다.
 *
 * 경로를 /members/[kind]로 두지 않은 이유가 있다. 그러면 /members/오타가
 * 404 대신 이 화면으로 빨려들어 "회차가 없습니다"를 보여준다.
 */
type CategoryKind = Exclude<SessionKind, 'regular'>
const CATEGORY_KINDS = SESSION_KINDS.filter(
  (k): k is CategoryKind => k !== 'regular',
)

export default async function SessionCategoryPage({
  params,
}: {
  params: Promise<{ kind: string }>
}) {
  const { kind } = await params
  if (!CATEGORY_KINDS.includes(kind as CategoryKind)) notFound()
  const target = kind as CategoryKind

  const [siteConfig, identity] = await Promise.all([
    getSiteConfig(),
    getPortalIdentity(),
  ])
  const isExec = identity?.role === 'exec'
  const sessions = await getSessions({
    cohort: siteConfig.cohort,
    publishedOnly: !isExec,
  })
  const shown = sessions.filter((s) => s.kind === target)

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        VERY · VOL.{siteConfig.cohort}
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        {SESSION_KIND_LABELS[target]}
      </h1>

      <SessionList title={null} sessions={shown} isExec={isExec} />

      {shown.length === 0 && (
        <p className="mt-16 text-center font-display text-sm text-fg-muted">
          아직 등록된 회차가 없습니다.
        </p>
      )}
    </div>
  )
}
