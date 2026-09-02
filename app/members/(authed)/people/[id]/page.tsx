import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { supabaseService } from '@/lib/supabase/service'
import { getSiteConfig } from '@/lib/data/site-config'
import { getMemberByEmail, getPortalIdentity } from '@/lib/portal/auth'
import { getMemberProfile, type IntroItem } from '@/lib/portal/queries'
import { Markdown } from '@/components/portal/markdown'

const SIGNED_URL_TTL_SEC = 60 * 60

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const profile = await getMemberProfile(id)
  if (!profile) return {}
  return { title: `${profile.name} · Vol.${profile.cohort}` }
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, identity, siteConfig] = await Promise.all([
    params,
    getPortalIdentity(),
    getSiteConfig(),
  ])
  // 프로필 조회와 본인 확인은 서로 의존하지 않으므로 함께 띄운다
  const [profile, me] = await Promise.all([
    getMemberProfile(id),
    identity ? getMemberByEmail(identity.email) : null,
  ])
  if (!profile) notFound()

  const isSelf = me?.id === profile.id
  // 구조화 소개(0030)가 하나라도 있으면 그것을, 없으면 옛 마크다운을 보여준다.
  const hasStructured =
    Boolean(profile.intro_photo_path) ||
    profile.strengths.length > 0 ||
    profile.likes.length > 0 ||
    profile.tmi.length > 0 ||
    profile.portfolio.length > 0

  // 대표사진은 비공개 버킷이라 서명 읽기 URL로만 보여준다.
  let introPhotoUrl: string | null = null
  if (profile.intro_photo_path) {
    const { data } = await supabaseService.storage
      .from('portal-photos')
      .createSignedUrl(profile.intro_photo_path, SIGNED_URL_TTL_SEC)
    introPhotoUrl = data?.signedUrl ?? null
  }
  // 지난 기수 멤버 페이지는 임원진만. 단 본인 페이지는 허용
  // (학회장 결정, 2026-08-04)
  if (
    profile.cohort !== siteConfig.cohort &&
    identity?.role !== 'exec' &&
    !isSelf
  )
    notFound()

  return (
    <div>
      <p className="text-sm text-fg-subtle">
        <Link href={'/members/people' as Route} className="underline">
          ← 멤버 목록
        </Link>
      </p>

      <div className="mt-8 flex items-start gap-6">
        {profile.photo_url ? (
          <Image
            src={profile.photo_url}
            alt={`${profile.name} 프로필 사진`}
            width={112}
            height={112}
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
            {profile.mbti ? ` · ${profile.mbti}` : ''}
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
        {hasStructured ? (
          <div className="space-y-12">
            {introPhotoUrl && (
              <IntroSection label="대표사진">
                {/* 서명 URL은 만료가 있어 next/image 캐시와 맞지 않는다 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={introPhotoUrl}
                  alt={`${profile.name}의 대표사진`}
                  className="max-h-[28rem] w-full max-w-md border border-border object-cover"
                />
              </IntroSection>
            )}
            {profile.strengths.length > 0 && (
              <IntroItemsSection
                label={`내가 잘하는 것 ${profile.strengths.length}가지`}
                items={profile.strengths}
              />
            )}
            {profile.likes.length > 0 && (
              <IntroItemsSection
                label={`내가 좋아하는 것 ${profile.likes.length}가지`}
                items={profile.likes}
              />
            )}
            {profile.tmi && (
              <IntroSection label="자유로운 TMI">
                <p className="max-w-[68ch] whitespace-pre-line font-display text-base leading-[1.9] text-fg-subtle">
                  {profile.tmi}
                </p>
              </IntroSection>
            )}
            {profile.portfolio && (
              <IntroSection label="개인 포트폴리오">
                {/^https?:\/\/\S+$/.test(profile.portfolio) ? (
                  <a
                    href={profile.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-display text-base text-fg-primary underline"
                  >
                    {profile.portfolio}
                  </a>
                ) : (
                  <p className="break-all font-display text-base text-fg-subtle">
                    {profile.portfolio}
                  </p>
                )}
              </IntroSection>
            )}
          </div>
        ) : profile.intro_md.trim() ? (
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

function IntroSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold tracking-tight text-fg-primary md:text-2xl">
        {label}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function IntroItemsSection({
  label,
  items,
}: {
  label: string
  items: IntroItem[]
}) {
  return (
    <IntroSection label={label}>
      <ol className="space-y-6">
        {items.map((it, i) => (
          <li key={i} className="flex gap-4">
            <span
              aria-hidden
              className="font-mono text-sm tabular-nums text-fg-muted"
            >
              {i + 1}.
            </span>
            <div className="min-w-0">
              <p className="font-display text-base font-bold text-fg-primary">
                {it.title}
              </p>
              {it.body && (
                <p className="mt-1.5 max-w-[62ch] font-display text-base leading-[1.8] text-fg-subtle">
                  {it.body}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </IntroSection>
  )
}
