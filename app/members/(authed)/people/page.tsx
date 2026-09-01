import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { redirect } from 'next/navigation'
import { getSiteConfig } from '@/lib/data/site-config'
import { getMemberByEmail, getPortalIdentity } from '@/lib/portal/auth'
import { getDirectory } from '@/lib/portal/queries'

export const dynamic = 'force-dynamic'

const ROLE_TIER_ORDER = ['president', 'vice_president', 'officer']

/**
 * 학회원 디렉토리. 43기 노션의 "자기소개" 페이지를 대체한다.
 * 임원진이 먼저, 이후 일반 학회원 (getDirectory가 sort_order로 보장).
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
        <ul className="mt-10 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <li key={m.id} className="bg-bg-base">
              <Link
                href={`/members/people/${m.id}` as Route}
                className="flex h-full flex-col gap-4 p-5 transition-colors hover:bg-fg-primary/[0.03]"
              >
                <div className="flex items-center gap-4">
                  {m.photo_url ? (
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
                      {ROLE_TIER_ORDER.includes(m.role_tier) &&
                        m.role_label && (
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
          ))}
        </ul>
      )}
    </div>
  )
}
