import Link from 'next/link'
import type { Route } from 'next'
import { getApprovedPartners } from '@/lib/admin/queries'
import { PublishToggle } from '@/components/admin/publish-toggle'
import { DeleteButton } from '@/components/admin/delete-button'

export const dynamic = 'force-dynamic'

export default async function AdminPartnersPage() {
  const rows = await getApprovedPartners()
  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        PARTNERS
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">승인된 파트너</h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link href={'/admin/partners/new' as Route} className="underline">
          + 파트너 추가
        </Link>
      </p>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border">
            <tr className="text-left">
              <Th>회사</Th>
              <Th>카테고리</Th>
              <Th>순서</Th>
              <Th>노출</Th>
              <Th>편집</Th>
              <Th>삭제</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <Td>
                  <Link
                    href={`/admin/partners/${r.id}` as Route}
                    className="underline hover:text-fg-primary"
                  >
                    {r.name}
                  </Link>
                </Td>
                <Td>{r.category}</Td>
                <Td>{r.sort_order}</Td>
                <Td>
                  <PublishToggle
                    kind="partner"
                    id={r.id}
                    published={r.published}
                  />
                </Td>
                <Td>
                  <Link
                    href={`/admin/partners/${r.id}` as Route}
                    className="font-mono text-[10px] uppercase tracking-[0.28em] underline"
                  >
                    편집
                  </Link>
                </Td>
                <Td>
                  <DeleteButton kind="partner" id={r.id} label={r.name} />
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <Td colSpan={6}>
                  <p className="py-12 text-center text-fg-muted">
                    아직 승인된 파트너가 없습니다. 위 “+ 파트너 추가”로 등록해주세요.
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
