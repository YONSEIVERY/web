import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import {
  getAdminCohortList,
  getAdminMembersByCohort,
} from '@/lib/cohort-members/queries'

export const dynamic = 'force-dynamic'

const ROLE_LABEL: Record<string, string> = {
  president: '회장',
  vice_president: '부회장',
  officer: '임원',
  member: '학회원',
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>
}) {
  const cohortList = await getAdminCohortList()
  const params = await searchParams
  const requested = params.cohort ? Number.parseInt(params.cohort, 10) : NaN
  const selectedCohort =
    Number.isInteger(requested) && requested > 0
      ? requested
      : (cohortList[0]?.cohort ?? 43)
  const nextCohort = (cohortList[0]?.cohort ?? 42) + 1
  const rows = await getAdminMembersByCohort(selectedCohort)

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
                      —
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
                <Td>{r.role_label ?? '—'}</Td>
                <Td>
                  <span className="text-xs">
                    {r.college ? `${r.college} · ` : ''}
                    {r.major ?? '—'}
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
