import Link from 'next/link'
import type { Route } from 'next'
import { getLeadership } from '@/lib/leadership/queries'

export const dynamic = 'force-dynamic'

export default async function AdminLeadershipPage() {
  const rows = await getLeadership()
  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        LEADERSHIP
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">회장단</h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link href={'/admin/leadership/new' as Route} className="underline">
          + 회장단 추가
        </Link>
      </p>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border">
            <tr className="text-left">
              <Th>직함</Th>
              <Th>이름</Th>
              <Th>영문</Th>
              <Th>이메일</Th>
              <Th>회차</Th>
              <Th>순서</Th>
              <Th>편집</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <Td>
                  <Link
                    href={`/admin/leadership/${r.id}` as Route}
                    className="underline hover:text-fg-primary"
                  >
                    {r.role}
                  </Link>
                  <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.24em] text-fg-muted">
                    {r.role_mono}
                  </span>
                </Td>
                <Td>{r.name}</Td>
                <Td>
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em]">
                    {r.mono_name}
                  </span>
                </Td>
                <Td>
                  {r.email ? (
                    <a
                      href={`mailto:${r.email}`}
                      className="underline hover:text-fg-primary"
                    >
                      {r.email}
                    </a>
                  ) : (
                    <span className="text-fg-muted">—</span>
                  )}
                </Td>
                <Td>{r.cohort_label ?? '—'}</Td>
                <Td>{r.sort_order}</Td>
                <Td>
                  <Link
                    href={`/admin/leadership/${r.id}` as Route}
                    className="font-mono text-[10px] uppercase tracking-[0.28em] underline"
                  >
                    편집
                  </Link>
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <Td colSpan={7}>
                  <p className="py-12 text-center text-fg-muted">
                    아직 등록된 회장단이 없습니다. “+ 회장단 추가”로 등록해주세요.
                    <br />
                    (0008_leadership 마이그레이션이 적용되지 않았을 수 있습니다.)
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
    <td colSpan={colSpan} className="py-4 pr-4 text-fg-subtle">
      {children}
    </td>
  )
}
