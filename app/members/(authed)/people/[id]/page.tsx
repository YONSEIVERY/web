import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getMemberByEmail, getPortalIdentity } from '@/lib/portal/auth'
import { getMemberProfile } from '@/lib/portal/queries'
import { Markdown } from '@/components/portal/markdown'

export const dynamic = 'force-dynamic'

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, identity] = await Promise.all([params, getPortalIdentity()])
  const profile = await getMemberProfile(id)
  if (!profile) notFound()

  const me = identity ? await getMemberByEmail(identity.email) : null
  const isSelf = me?.id === profile.id

  return (
    <div>
      <p className="text-sm text-fg-subtle">
        <Link href={'/members/people' as Route} className="underline">
          ← 멤버 목록
        </Link>
      </p>

      <div className="mt-8 flex items-start gap-6">
        {profile.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photo_url}
            alt={`${profile.name} 프로필 사진`}
            className="h-24 w-24 shrink-0 border border-border object-cover md:h-28 md:w-28"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-24 w-24 shrink-0 items-center justify-center border border-border bg-border/30 font-display text-3xl font-bold text-fg-muted md:h-28 md:w-28"
          >
            {profile.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0">
          <p
            translate="no"
            className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
          >
            VOL.{profile.cohort}
            {profile.role_label ? ` · ${profile.role_label}` : ''}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-fg-primary md:text-4xl">
            {profile.name}
          </h1>
          {(profile.college || profile.major) && (
            <p className="mt-2 font-display text-sm text-fg-subtle">
              {[profile.college, profile.major].filter(Boolean).join(' ')}
            </p>
          )}
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-8">
        {profile.intro_md.trim() ? (
          <Markdown content={profile.intro_md} />
        ) : (
          <p className="font-display text-sm text-fg-muted">
            아직 자기소개를 작성하지 않았습니다.
          </p>
        )}
      </div>

      {isSelf && (
        <div className="mt-10">
          <Link
            href={'/members/profile' as Route}
            className="inline-flex items-center gap-3 border border-fg-primary px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base"
          >
            내 소개 수정하기
            <span aria-hidden>→</span>
          </Link>
        </div>
      )}
    </div>
  )
}
