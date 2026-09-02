import Link from 'next/link'
import type { Route } from 'next'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/is-admin'
import { supabaseService } from '@/lib/supabase/service'
import { formatKstDateTime } from '@/lib/utils/format-date'
import { normName, phoneTail } from '@/lib/members/identity'
import { SignupReview } from '@/components/admin/signup-review'

/**
 * 자율 등록 신청 심사 화면.
 *
 * 공개 폼이라 오타와 사칭이 섞여 들어온다. 승인자가 눈으로 판단할 근거를
 * 만들어 주는 것이 이 화면의 목적이다. 각 신청을 같은 기수의 최종 합격
 * 지원서와 맞춰 배지로 표시한다.
 *
 * 대조는 신청 건마다 쿼리하지 않는다. 신청 전체를 한 번, 해당 기수의 라운드를
 * 한 번, 그 라운드의 final_pass 지원서를 한 번 읽어 메모리에서 색인한다.
 * 조회 3회로 끝나며 신청 수에 비례하지 않는다.
 */

export const dynamic = 'force-dynamic'

const SIGNUP_COLUMNS =
  'id, cohort, name, email, phone, student_id, college, major, note, status, created_at, reviewed_at, reviewed_by'

type SignupStatus = 'pending' | 'approved' | 'rejected'

type Signup = {
  id: string
  cohort: number
  name: string
  email: string
  phone: string | null
  student_id: string | null
  college: string | null
  major: string | null
  note: string | null
  status: SignupStatus
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

type Match =
  | { kind: 'email' }
  | { kind: 'identity'; applicationEmail: string }
  | { kind: 'none' }

const STATUS_LABEL: Record<SignupStatus, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '반려',
}

function normEmail(v: unknown): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
}

function toSignup(row: Record<string, unknown>): Signup {
  const raw = String(row.status ?? '')
  // approved · rejected만 처리 완료로 본다. 나머지는 전부 대기로 묶어
  // 신규 상태값이 들어와도 화면에서 사라지지 않게 한다.
  const status: SignupStatus =
    raw === 'approved' ? 'approved' : raw === 'rejected' ? 'rejected' : 'pending'
  return {
    id: String(row.id),
    cohort: Number(row.cohort),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: (row.phone as string | null) ?? null,
    student_id: (row.student_id as string | null) ?? null,
    college: (row.college as string | null) ?? null,
    major: (row.major as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    status,
    created_at: String(row.created_at),
    reviewed_at: (row.reviewed_at as string | null) ?? null,
    reviewed_by: (row.reviewed_by as string | null) ?? null,
  }
}

export default async function MemberSignupsPage() {
  try {
    await requireAdmin()
  } catch {
    redirect('/admin/login' as Route)
  }

  // 공개 폼이 원천이라 행 수를 신뢰할 수 없다. 상한 없이 읽으면 대량
  // 제출이 이 화면의 메모리와 렌더 시간을 그대로 부풀린다. 500이면 정상
  // 운영(기수당 수십 건)을 넉넉히 덮고, 넘친다는 것 자체가 스팸 신호다.
  const { data: signupRows, error: signupErr } = await supabaseService
    .from('member_signups')
    .select(SIGNUP_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(500)
  if (signupErr) console.error('[MemberSignupsPage] signups query failed', signupErr)

  const signups = ((signupRows ?? []) as Record<string, unknown>[]).map(toSignup)
  const pending = signups.filter((s) => s.status === 'pending')
  const reviewed = signups.filter((s) => s.status !== 'pending')

  // 같은 기수의 최종 합격 지원서 색인. 라운드 → 기수 매핑을 먼저 만든다.
  const cohorts = [...new Set(signups.map((s) => s.cohort))].filter((c) =>
    Number.isFinite(c),
  )
  const cohortByRound = new Map<string, number>()
  if (cohorts.length > 0) {
    const { data: roundRows, error: roundErr } = await supabaseService
      .from('recruit_rounds')
      .select('id, cohort')
      .in('cohort', cohorts)
    if (roundErr) console.error('[MemberSignupsPage] rounds query failed', roundErr)
    for (const r of (roundRows ?? []) as Record<string, unknown>[]) {
      cohortByRound.set(String(r.id), Number(r.cohort))
    }
  }

  const byEmail = new Set<string>() // `${cohort}|${이메일}`
  const byIdentity = new Map<string, string>() // `${cohort}|${이름}|${전화 끝 8자리}` → 지원서 이메일
  const roundIds = [...cohortByRound.keys()]
  if (roundIds.length > 0) {
    const { data: appRows, error: appErr } = await supabaseService
      .from('applications')
      .select('name, phone, email, round_id')
      .eq('status', 'final_pass')
      .in('round_id', roundIds)
    if (appErr) console.error('[MemberSignupsPage] applications query failed', appErr)
    for (const a of (appRows ?? []) as Record<string, unknown>[]) {
      const cohort = cohortByRound.get(String(a.round_id))
      if (cohort === undefined) continue
      const email = normEmail(a.email)
      byEmail.add(`${cohort}|${email}`)
      byIdentity.set(
        `${cohort}|${normName(a.name)}|${phoneTail(a.phone)}`,
        email,
      )
    }
  }

  function matchOf(s: Signup): Match {
    const email = normEmail(s.email)
    if (email && byEmail.has(`${s.cohort}|${email}`)) return { kind: 'email' }
    const tail = phoneTail(s.phone)
    const name = normName(s.name)
    if (name && tail) {
      const found = byIdentity.get(`${s.cohort}|${name}|${tail}`)
      if (found) return { kind: 'identity', applicationEmail: found }
    }
    return { kind: 'none' }
  }

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        MEMBERS · SIGNUPS
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        자율 등록 신청
      </h1>
      <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-fg-subtle">
        학회원이 직접 낸 신청입니다. 승인하면 해당 기수 학회원 명단에 등록되고
        그 이메일로 포털 로그인이 열립니다. 공개 폼이라 오타와 사칭이 섞일 수
        있으니, 지원서 대조 배지를 확인한 뒤 승인하십시오.
      </p>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link href={'/admin/members' as Route} className="underline">
          학회원 명단으로 이동
        </Link>
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Count label="대기" value={pending.length} highlight />
        <Count
          label="승인"
          value={signups.filter((s) => s.status === 'approved').length}
        />
        <Count
          label="반려"
          value={signups.filter((s) => s.status === 'rejected').length}
        />
      </div>

      {signupErr && (
        <p className="mt-6 border border-red-400/40 p-4 text-sm text-red-400">
          신청 목록을 불러오지 못했습니다. member_signups 테이블과 컬럼(note ·
          status · reviewed_at · reviewed_by)이 배포되었는지 확인하십시오.
        </p>
      )}

      {/* 0건일 때 표를 그리면 min-w-[960px] 때문에 안내 문구가 화면 밖으로
          밀려 잘린 헤더만 보인다. 빈 상태는 표 없이 문구만 낸다. */}
      {pending.length === 0 ? (
        <p className="mt-8 border border-border p-12 text-center text-sm text-fg-muted">
          대기 중인 신청이 없습니다.
        </p>
      ) : (
        /* 좁은 화면에서는 신청자 열을 고정한다. 오른쪽 끝 승인·반려를 누를 때
           대상이 화면에서 사라지지 않게 하기 위함이다. */
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
          <thead className="border-b border-border">
            <tr className="text-left">
              <Th sticky>신청자</Th>
              <Th>학번 · 학과</Th>
              <Th>지원서 대조</Th>
              <Th>메모</Th>
              <Th>신청일</Th>
              <Th>처리</Th>
            </tr>
          </thead>
          <tbody>
            {pending.map((s) => {
              const match = matchOf(s)
              return (
                <tr
                  key={s.id}
                  className="border-b border-border align-top transition-colors hover:bg-fg-primary/[0.03]"
                >
                  <Td sticky>
                    <p className="font-display font-bold text-fg-primary">
                      {s.name}
                      <span className="ml-2 font-mono text-[10px] font-normal tracking-[0.2em] text-fg-muted">
                        {s.cohort}기
                      </span>
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-fg-muted">
                      {s.email}
                    </p>
                    <p className="mt-0.5 whitespace-nowrap font-mono text-xs text-fg-muted">
                      {s.phone ?? '-'}
                    </p>
                  </Td>
                  <Td>
                    <p className="font-mono text-xs">{s.student_id ?? '-'}</p>
                    <p className="mt-1 text-xs">
                      {s.college ? `${s.college} · ` : ''}
                      {s.major ?? '-'}
                    </p>
                  </Td>
                  <Td>
                    <MatchBadge match={match} />
                  </Td>
                  <Td>
                    {s.note ? (
                      <p
                        className="line-clamp-3 max-w-[26ch] leading-relaxed"
                        title={s.note}
                      >
                        {s.note}
                      </p>
                    ) : (
                      '-'
                    )}
                  </Td>
                  <Td>
                    <span className="whitespace-nowrap font-mono text-[10px] text-fg-muted">
                      {formatKstDateTime(s.created_at)}
                    </span>
                  </Td>
                  <Td>
                    <SignupReview
                      id={s.id}
                      label={`${s.name} (${s.email})`}
                      cohort={s.cohort}
                    />
                  </Td>
                </tr>
              )
            })}
            </tbody>
          </table>
        </div>
      )}

      {reviewed.length > 0 && (
        <section className="mt-14">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
            처리 완료 · {reviewed.length}건
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border">
                <tr className="text-left">
                  <Th>신청자</Th>
                  <Th>결과</Th>
                  <Th>처리자</Th>
                  <Th>처리일</Th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map((s) => (
                  <tr key={s.id} className="border-b border-border align-top">
                    <Td>
                      <span className="text-fg-primary">{s.name}</span>
                      <span className="ml-2 break-all font-mono text-xs text-fg-muted">
                        {s.email}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.28em] ${
                          s.status === 'approved'
                            ? 'text-fg-primary'
                            : 'text-fg-muted'
                        }`}
                      >
                        {STATUS_LABEL[s.status]}
                      </span>
                    </Td>
                    <Td>
                      <span className="break-all font-mono text-xs text-fg-muted">
                        {s.reviewed_by ?? '-'}
                      </span>
                    </Td>
                    <Td>
                      <span className="whitespace-nowrap font-mono text-[10px] text-fg-muted">
                        {s.reviewed_at ? formatKstDateTime(s.reviewed_at) : '-'}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function Count({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  const tone = highlight && value > 0 ? 'text-fg-primary' : 'text-fg-muted'
  return (
    <span className="flex items-baseline gap-2">
      <span
        className={`font-mono text-[10px] uppercase tracking-[0.28em] ${tone}`}
      >
        {label}
      </span>
      <span
        translate="no"
        className={`font-display text-sm font-bold tabular-nums ${tone}`}
      >
        {value}
      </span>
    </span>
  )
}

/**
 * 대조 결과 배지.
 *  합격자 확인          : 이메일이 그 기수 최종 합격 지원서와 같다
 *  이름·전화 일치       : 이메일은 다르지만 이름과 전화가 합격자와 같다.
 *                        이 폼을 만든 이유이긴 하나, 이름과 전화는 아는
 *                        사람이 위조할 수 있는 값이다. 자동 통과 근거가
 *                        아니라 본인 확인을 거쳐 승인할 후보라는 신호다
 *  지원서에 없음        : 어디에도 맞지 않는다. 승인 전에 사람 확인이 필요하다
 */
function MatchBadge({ match }: { match: Match }) {
  if (match.kind === 'email')
    return (
      <span className="inline-block whitespace-nowrap border border-fg-primary px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-primary">
        합격자 확인
      </span>
    )
  if (match.kind === 'identity')
    return (
      <div>
        <span className="inline-block max-w-[22ch] border border-border-strong px-2 py-1 text-[11px] leading-snug text-fg-subtle">
          이름 · 전화 일치, 본인 확인 필요
        </span>
        <p className="mt-1.5 break-all font-mono text-[10px] text-fg-muted">
          지원서 {match.applicationEmail}
        </p>
      </div>
    )
  return (
    <span className="inline-block whitespace-nowrap border border-red-400/40 px-2 py-1 text-[11px] leading-snug text-red-400">
      지원서에 없음
    </span>
  )
}

/** 가로 스크롤이 생기는 좁은 화면에서만 열을 왼쪽에 고정한다. */
const STICKY_CELL = 'max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-bg-base'

function Th({
  children,
  sticky,
}: {
  children: React.ReactNode
  sticky?: boolean
}) {
  return (
    <th
      className={`py-3 pr-4 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted ${
        sticky ? STICKY_CELL : ''
      }`}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  colSpan,
  sticky,
}: {
  children: React.ReactNode
  colSpan?: number
  sticky?: boolean
}) {
  return (
    <td
      colSpan={colSpan}
      className={`py-4 pr-4 text-fg-subtle ${sticky ? STICKY_CELL : ''}`}
    >
      {children}
    </td>
  )
}
