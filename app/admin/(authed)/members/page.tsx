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

type ImportPreview =
  | { kind: 'no_round' }
  | { kind: 'cohort_mismatch'; roundCohort: number }
  | { kind: 'ready'; total: number; pending: number }

/** 현재 기수의 최종 합격자 수와 그중 아직 명부에 없는 인원. */
async function getImportPreview(cohort: number): Promise<ImportPreview> {
  const round = await getCurrentRecruitRound()
  if (!round) return { kind: 'no_round' }
  if (round.cohort !== cohort)
    return { kind: 'cohort_mismatch', roundCohort: round.cohort }

  const [apps, members] = await Promise.all([
    supabaseService
      .from('applications')
      .select('email')
      .eq('round_id', round.id)
      .eq('status', 'final_pass'),
    supabaseService.from('cohort_members').select('email').eq('cohort', cohort),
  ])
  const taken = new Set<string>()
  for (const row of (members.data ?? []) as Record<string, unknown>[]) {
    const key = String(row.email ?? '')
      .trim()
      .toLowerCase()
    if (key) taken.add(key)
  }
  let total = 0
  let pending = 0
  for (const row of (apps.data ?? []) as Record<string, unknown>[]) {
    total += 1
    const email = String(row.email ?? '').trim()
    if (!EMAIL_RE.test(email)) continue
    const key = email.toLowerCase()
    if (taken.has(key)) continue
    taken.add(key)
    pending += 1
  }
  return { kind: 'ready', total, pending }
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
              />
              <p className="text-xs text-fg-muted">
                {preview.pending > 0
                  ? `최종 합격자 ${preview.total}명 중 ${preview.pending}명이 아직 명부에 없습니다.`
                  : `최종 합격자 ${preview.total}명 전원이 명부에 있습니다.`}
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
