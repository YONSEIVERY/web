import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import {
  getAdminCohortList,
  getAdminMembersByCohort,
} from '@/lib/cohort-members/queries'
import { getSiteConfig } from '@/lib/data/site-config'
import { getCurrentRecruitRound } from '@/lib/recruit/queries'
import { supabaseService } from '@/lib/supabase/service'
import { BulkImportButton } from '@/components/admin/bulk-import-button'

export const dynamic = 'force-dynamic'

const ROLE_LABEL: Record<string, string> = {
  president: '회장',
  vice_president: '부회장',
  officer: '임원',
  member: '학회원',
}

// 일괄 등록 액션(app/admin/actions/bulk-import-members.ts)과 같은 판정을 써야
// 화면의 대상 인원과 실제 등록 결과가 어긋나지 않는다. 정본은 액션 쪽이고
// 여기 계산은 미리보기다.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// registration 마이그레이션(0028) 미적용 환경에서 select가 이 코드로 깨진다.
const UNDEFINED_COLUMN = '42703'

/** 액션의 readReply와 같은 화이트리스트. 모르는 값은 회신 없음으로 본다. */
function isRegistered(v: unknown): boolean {
  return (
    String(v ?? '')
      .trim()
      .toLowerCase() === 'registered'
  )
}

function isDeclined(v: unknown): boolean {
  return (
    String(v ?? '')
      .trim()
      .toLowerCase() === 'declined'
  )
}

type ImportPreview =
  | { kind: 'no_round' }
  | { kind: 'cohort_mismatch'; roundCohort: number }
  | { kind: 'read_failed'; missingColumn: boolean }
  | {
      kind: 'ready'
      /** 최종 합격자 전체 */
      total: number
      /** 그중 아직 명부에 없는 인원 (회신 여부는 보지 않음) */
      pending: number
      /** 이번에 실제로 들어갈 인원: 최종 합격 + 등록 회신 완료 + 명부에 없음 */
      toImport: number
      /** 최종 합격자 중 아직 등록 회신이 표시되지 않은 인원 */
      awaitingReply: number
      /** 회신이 '최종등록'인 인원 (명부 등재 여부와 무관) */
      registered: number
      /** 회신이 '최종미등록'인 인원 */
      declined: number
    }

/**
 * 현재 기수의 최종 합격자 수와 이번에 명부로 들어갈 인원.
 *
 * 판정은 액션과 한 글자도 어긋나면 안 된다. 미리보기가 21명이라고 했는데
 * 결과가 18명이면 그 차이를 설명할 방법이 없다. 그래서 registration
 * 화이트리스트도, 이메일 정규화(lower(trim(...)))도, 이름 유효성도 액션과
 * 같은 규칙을 쓴다.
 *
 * 명부 Set은 두 벌을 따로 쓴다. pending과 toImport는 세는 모집단이 달라
 * 한 Set을 공유하면 먼저 도는 쪽이 뒤에 도는 쪽의 인원을 깎는다.
 */
async function getImportPreview(cohort: number): Promise<ImportPreview> {
  const round = await getCurrentRecruitRound()
  if (!round) return { kind: 'no_round' }
  if (round.cohort !== cohort)
    return { kind: 'cohort_mismatch', roundCohort: round.cohort }

  const [apps, members] = await Promise.all([
    supabaseService
      .from('applications')
      .select('name, email, registration')
      .eq('round_id', round.id)
      .eq('status', 'final_pass'),
    supabaseService.from('cohort_members').select('email').eq('cohort', cohort),
  ])
  // 읽기가 깨졌는데 0명으로 뭉뚱그리면 "합격자가 없습니다"라는 거짓말이 뜬다.
  if (apps.error || members.error) {
    console.error(
      '[admin/members] import preview read failed',
      apps.error ?? members.error,
    )
    return {
      kind: 'read_failed',
      missingColumn: apps.error?.code === UNDEFINED_COLUMN,
    }
  }

  const rows = (apps.data ?? []) as Record<string, unknown>[]
  const roster = new Set<string>()
  for (const row of (members.data ?? []) as Record<string, unknown>[]) {
    const key = String(row.email ?? '')
      .trim()
      .toLowerCase()
    if (key) roster.add(key)
  }

  const seenForPending = new Set(roster)
  const seenForImport = new Set(roster)
  let total = 0
  let pending = 0
  let toImport = 0
  let awaitingReply = 0
  let registered = 0
  let declined = 0
  for (const row of rows) {
    total += 1
    const name = String(row.name ?? '')
      .replace(/\s+/g, ' ')
      .trim()
    const email = String(row.email ?? '').trim()
    const key = email.toLowerCase()
    const usable = EMAIL_RE.test(email)

    if (usable && !seenForPending.has(key)) {
      seenForPending.add(key)
      pending += 1
    }
    if (isRegistered(row.registration)) {
      registered += 1
      // 액션은 이름이 비어도 "이메일 확인 필요"로 건너뛴다. 같이 뺀다.
      if (name && usable && !seenForImport.has(key)) {
        seenForImport.add(key)
        toImport += 1
      }
    } else if (isDeclined(row.registration)) {
      declined += 1
    } else {
      awaitingReply += 1
    }
  }
  return {
    kind: 'ready',
    total,
    pending,
    toImport,
    awaitingReply,
    registered,
    declined,
  }
}

/**
 * 자율 등록 승인 대기 건수. 승인 화면과 액션은 별도 담당 소유라
 * 여기서는 건수만 읽는다. 상태 어휘가 바뀌어도 버티도록 "승인·반려가
 * 끝나지 않은 행"을 센다. 테이블이 아직 없으면 0.
 */
async function getPendingSignupCount(): Promise<number> {
  const { data, error } = await supabaseService
    .from('member_signups')
    .select('status')
  if (error || !data) {
    if (error) console.error('[admin/members] signup count failed', error)
    return 0
  }
  return (data as Record<string, unknown>[]).filter((row) => {
    const s = String(row.status ?? '')
    return s !== 'approved' && s !== 'rejected'
  }).length
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>
}) {
  const [cohortList, params, config] = await Promise.all([
    getAdminCohortList(),
    searchParams,
    getSiteConfig(),
  ])
  const requested = params.cohort ? Number.parseInt(params.cohort, 10) : NaN
  const selectedCohort =
    Number.isInteger(requested) && requested > 0
      ? requested
      : (cohortList[0]?.cohort ?? 43)
  const nextCohort = (cohortList[0]?.cohort ?? 42) + 1
  const [rows, preview, pendingSignups] = await Promise.all([
    getAdminMembersByCohort(selectedCohort),
    getImportPreview(config.cohort),
    getPendingSignupCount(),
  ])

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        MEMBERS
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">학회원</h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link
          href={`/admin/members/new?cohort=${selectedCohort}` as Route}
          className="underline"
        >
          + {selectedCohort}기 회원 추가
        </Link>
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          기수
        </span>
        {cohortList.map((c) => {
          const active = c.cohort === selectedCohort
          return (
            <Link
              key={c.cohort}
              href={`/admin/members?cohort=${c.cohort}` as Route}
              className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] ${
                active
                  ? 'border-fg-primary text-fg-primary'
                  : 'border-border text-fg-subtle hover:border-fg-primary hover:text-fg-primary'
              }`}
            >
              {c.cohort}기 · {c.published}/{c.total}
            </Link>
          )
        })}
        <Link
          href={`/admin/members/new?cohort=${nextCohort}` as Route}
          className="border border-dashed border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted hover:border-fg-primary hover:text-fg-primary"
        >
          + 새 기수 시작 ({nextCohort}기)
        </Link>
      </div>

      <section className="mt-8 border border-border p-5">
        <p
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
        >
          ONBOARDING · {config.cohort}기
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
          {preview.kind === 'no_round' && (
            <p className="text-xs text-fg-muted">
              진행 중인 모집 라운드가 없어 합격자를 불러올 수 없습니다.{' '}
              <Link href={'/admin/recruit' as Route} className="underline">
                리크루팅
              </Link>
              에서 현재 라운드를 지정해주세요.
            </p>
          )}
          {preview.kind === 'cohort_mismatch' && (
            <p className="text-xs text-fg-muted">
              현재 기수({config.cohort}기)와 진행 중인 모집 라운드(
              {preview.roundCohort}기)가 달라 일괄 등록을 멈춥니다. 둘을 맞춘 뒤
              다시 확인해주세요.
            </p>
          )}
          {preview.kind === 'read_failed' && (
            <p className="text-xs text-red-400">
              {preview.missingColumn
                ? '등록 회신 컬럼(applications.registration)이 아직 없습니다. 0028 마이그레이션을 적용한 뒤 다시 확인해주세요.'
                : '합격자 명단을 읽지 못했습니다. 잠시 후 새로고침해주세요.'}
            </p>
          )}
          {preview.kind === 'ready' && preview.total === 0 && (
            <p className="text-xs text-fg-muted">
              {config.cohort}기 최종 합격 처리된 지원서가 없습니다.{' '}
              <Link href={'/admin/recruit' as Route} className="underline">
                리크루팅
              </Link>
              에서 합격 처리를 먼저 해주세요.
            </p>
          )}
          {/* 등록 후 pending이 0이 되어도 버튼 자리를 비우지 않는다.
              걷어내면 방금 받은 "N명 등록, M명 건너뜀"까지 같이 사라진다. */}
          {preview.kind === 'ready' && preview.total > 0 && (
            <>
              <BulkImportButton
                cohort={config.cohort}
                total={preview.total}
                pending={preview.pending}
                toImport={preview.toImport}
                awaitingReply={preview.awaitingReply}
              />
              {/* 회신 기준으로 말한다. "명부에 없는 N명"만 보여 주면 등록을
                  포기한 사람까지 들어갈 인원처럼 읽힌다. */}
              <p className="text-xs text-fg-muted">
                {`최종 합격자 ${preview.total}명 중 최종등록 ${preview.registered}명, 최종미등록 ${preview.declined}명, 회신 없음 ${preview.awaitingReply}명.`}{' '}
                {preview.toImport > 0
                  ? `이번에 들어갈 인원 ${preview.toImport}명.`
                  : '이번에 새로 들어갈 인원은 없습니다.'}
              </p>
            </>
          )}
          {selectedCohort !== config.cohort && (
            <Link
              href={`/admin/members?cohort=${config.cohort}` as Route}
              className="text-xs text-fg-subtle underline hover:text-fg-primary"
            >
              {config.cohort}기 명부 보기
            </Link>
          )}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <Link
            href={'/admin/members/signups' as Route}
            className="inline-flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-subtle hover:text-fg-primary"
          >
            자율 등록 승인
            {pendingSignups > 0 ? (
              <span className="inline-flex min-w-6 items-center justify-center bg-accent px-1.5 py-0.5 text-[10px] text-fg-primary">
                대기 {pendingSignups}
              </span>
            ) : (
              <span className="text-fg-muted">대기 없음</span>
            )}
          </Link>
        </div>
      </section>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-border">
            <tr className="text-left">
              <Th>사진</Th>
              <Th>이름</Th>
              <Th>역할</Th>
              <Th>표시 직책</Th>
              <Th>학과</Th>
              <Th>공개</Th>
              <Th>정렬</Th>
              <Th>편집</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <Td>
                  {r.photo_url ? (
                    <Image
                      src={r.photo_url}
                      alt={r.name}
                      width={40}
                      height={56}
                      className="h-14 w-10 border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-10 items-center justify-center border border-border text-[9px] text-fg-muted">
                      -
                    </div>
                  )}
                </Td>
                <Td>
                  <Link
                    href={`/admin/members/${r.id}` as Route}
                    className="underline hover:text-fg-primary"
                  >
                    {r.name}
                  </Link>
                </Td>
                <Td>
                  <span
                    translate="no"
                    className="font-mono text-[10px] uppercase tracking-[0.28em]"
                  >
                    {ROLE_LABEL[r.role_tier] ?? r.role_tier}
                  </span>
                </Td>
                <Td>{r.role_label ?? '-'}</Td>
                <Td>
                  <span className="text-xs">
                    {r.college ? `${r.college} · ` : ''}
                    {r.major ?? '-'}
                  </span>
                </Td>
                <Td>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.28em] ${r.published ? 'text-green-500' : 'text-fg-muted'}`}
                  >
                    {r.published ? 'ON' : 'OFF'}
                  </span>
                </Td>
                <Td>{r.sort_order}</Td>
                <Td>
                  <Link
                    href={`/admin/members/${r.id}` as Route}
                    className="font-mono text-[10px] uppercase tracking-[0.28em] underline"
                  >
                    편집
                  </Link>
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <Td colSpan={8}>
                  <p className="py-12 text-center text-fg-muted">
                    {selectedCohort}기에 등록된 회원이 없습니다. “+ {selectedCohort}기 회원 추가”로 시작하세요.
                  </p>
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
      {children}
    </th>
  )
}

function Td({
  children,
  colSpan,
}: {
  children: React.ReactNode
  colSpan?: number
}) {
  return (
    <td colSpan={colSpan} className="py-4 pr-4 align-middle text-fg-subtle">
      {children}
    </td>
  )
}
