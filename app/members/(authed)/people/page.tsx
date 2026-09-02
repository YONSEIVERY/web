import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { redirect } from 'next/navigation'
import { supabaseService } from '@/lib/supabase/service'
import { getSiteConfig } from '@/lib/data/site-config'
import { getMemberByEmail, getPortalIdentity } from '@/lib/portal/auth'
import { getDirectory, type DirectoryMember } from '@/lib/portal/queries'

export const dynamic = 'force-dynamic'

const SIGNED_URL_TTL_SEC = 60 * 60

const LEADER_TIERS = ['president', 'vice_president']
const LABELED_TIERS = [...LEADER_TIERS, 'officer']

/**
 * 학회원 디렉토리. 43기 노션의 "자기소개" 페이지를 대체한다.
 * 학회장·부학회장 / 임원진 / 학회원 세 섹션으로 나눠 보여준다
 * (2026-09-02 대표 결정). 44기 임원진은 43기 출신이라 sort_order만으로는
 * 일반 학회원과 섞여 보였다. 섹션은 role_tier 기준이므로 임원 행의
 * role_tier만 맞으면 자동으로 위 섹션에 들어간다.
 */
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>
}) {
  const [{ cohort: cohortParam }, siteConfig, identity] = await Promise.all([
    searchParams,
    getSiteConfig(),
    getPortalIdentity(),
  ])
  // ?cohort=abc 같은 값이 그대로 Number로 넘어가면 'NaN기'가 화면에 찍히고
  // PostgREST도 파싱 에러를 낸다. 0014 마이그레이션의 check 제약과 같은
  // 범위(1~100)를 벗어나면 현재 기수로 되돌린다.
  const parsedCohort = cohortParam ? Number(cohortParam) : NaN
  const cohort =
    Number.isInteger(parsedCohort) && parsedCohort >= 1 && parsedCohort <= 100
      ? parsedCohort
      : siteConfig.cohort
  const isArchive = cohort !== siteConfig.cohort
  const isExec = identity?.role === 'exec'
  // 지난 기수 아카이브는 임원진 전용 (학회장 결정, 2026-08-04)
  if (isArchive && !isExec) redirect('/members/people')

  const [members, me] = await Promise.all([
    getDirectory(cohort),
    identity ? getMemberByEmail(identity.email) : null,
  ])
  const myEntry = me ? members.find((m) => m.id === me.id) : null

  // 카드 사진은 본인이 소개에 올린 대표사진을 우선한다. 비공개 버킷이라
  // 서명 읽기 URL을 배치로 발급한다 (세션 기록과 같은 방식).
  const introPhotoUrls = new Map<string, string>()
  const photoPaths = members
    .map((m) => m.intro_photo_path)
    .filter((p): p is string => Boolean(p))
  if (photoPaths.length > 0) {
    const { data } = await supabaseService.storage
      .from('portal-photos')
      .createSignedUrls(photoPaths, SIGNED_URL_TTL_SEC)
    if (data) {
      for (const d of data) {
        if (d.path && d.signedUrl) introPhotoUrls.set(d.path, d.signedUrl)
      }
    }
  }

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        MEMBERS · PEOPLE
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        Vol.{cohort} 멤버 · {members.length}명
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {isArchive ? (
          <Link
            href={'/members/people' as Route}
            className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-subtle underline hover:text-fg-primary"
          >
            ← {siteConfig.cohort}기로 돌아가기
          </Link>
        ) : (
          isExec &&
          cohort > 1 && (
            <Link
              href={`/members/people?cohort=${cohort - 1}` as Route}
              className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-subtle underline hover:text-fg-primary"
            >
              {cohort - 1}기 보기
            </Link>
          )
        )}
      </div>

      {/* 본인 소개가 비어 있으면 작성 유도 */}
      {!isArchive && myEntry && !myEntry.hasIntro && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-border p-5">
          <p className="font-display text-sm text-fg-subtle">
            아직 {myEntry.name}님의 소개가 비어 있습니다. 동기들이 가장 먼저
            읽는 페이지입니다.
          </p>
          <Link
            href={'/members/profile' as Route}
            className="whitespace-nowrap border border-fg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base"
          >
            내 소개 쓰기
          </Link>
        </div>
      )}

      {members.length === 0 ? (
        <p className="mt-16 max-w-[52ch] font-display text-sm leading-relaxed text-fg-muted">
          Vol.{cohort} 명단이 아직 등록되지 않았습니다. 합격자 확정 후
          임원진이 명단을 등록하면 이곳에 멤버들이 나타납니다.
        </p>
      ) : (
        <MemberSections members={members} introPhotoUrls={introPhotoUrls} />
      )}
    </div>
  )
}

function MemberSections({
  members,
  introPhotoUrls,
}: {
  members: DirectoryMember[]
  introPhotoUrls: Map<string, string>
}) {
  // getDirectory가 sort_order·이름순으로 이미 정렬해 준다. 여기서는 tier로
  // 가르기만 하고, 학회장·부학회장 묶음 안에서만 학회장을 앞으로 당긴다.
  const leaders = members.filter((m) => LEADER_TIERS.includes(m.role_tier))
  leaders.sort(
    (a, b) => LEADER_TIERS.indexOf(a.role_tier) - LEADER_TIERS.indexOf(b.role_tier),
  )
  const officers = members.filter((m) => m.role_tier === 'officer')
  const general = members.filter((m) => !LABELED_TIERS.includes(m.role_tier))

  const sections = [
    { label: '학회장 · 부학회장', list: leaders },
    { label: '임원진', list: officers },
    { label: '학회원', list: general },
  ].filter((s) => s.list.length > 0)

  return (
    <div className="mt-10 space-y-12">
      {sections.map((s) => (
        <section key={s.label}>
          <h2 className="flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
            {s.label}
            <span translate="no" className="tabular-nums">
              {s.list.length}
            </span>
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {s.list.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                introPhotoUrl={
                  m.intro_photo_path
                    ? (introPhotoUrls.get(m.intro_photo_path) ?? null)
                    : null
                }
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function MemberCard({
  member: m,
  introPhotoUrl,
}: {
  member: DirectoryMember
  introPhotoUrl: string | null
}) {
  return (
    <li className="bg-bg-base">
      <Link
        href={`/members/people/${m.id}` as Route}
        className="flex h-full flex-col gap-4 p-5 transition-colors hover:bg-fg-primary/[0.03]"
      >
        <div className="flex items-center gap-4">
          {introPhotoUrl ? (
            // 서명 URL은 만료가 있어 next/image 캐시와 맞지 않는다
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={introPhotoUrl}
              alt=""
              loading="lazy"
              className="h-14 w-14 shrink-0 border border-border object-cover"
            />
          ) : m.photo_url ? (
            <Image
              src={m.photo_url}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 border border-border object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center border border-border bg-border/30 font-display text-lg font-bold text-fg-muted"
            >
              {m.name.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0">
            <p className="font-display text-base font-bold tracking-tight text-fg-primary">
              {m.name}
              {LABELED_TIERS.includes(m.role_tier) && m.role_label && (
                <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-fg-muted">
                  {m.role_label}
                </span>
              )}
            </p>
            {(m.college || m.major) && (
              <p className="mt-0.5 truncate font-display text-xs text-fg-muted">
                {[m.college, m.major].filter(Boolean).join(' ')}
              </p>
            )}
          </div>
        </div>
        {m.excerpt ? (
          <p className="line-clamp-2 font-display text-sm leading-relaxed text-fg-subtle">
            {m.excerpt}
          </p>
        ) : (
          <p className="font-display text-sm text-fg-muted">
            아직 소개가 없습니다
          </p>
        )}
      </Link>
    </li>
  )
}
