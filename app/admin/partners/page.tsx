import { getApprovedPartners } from '@/lib/admin/queries'
import { togglePartnerPublished } from '@/app/admin/actions/publish'

export const dynamic = 'force-dynamic'

export default async function AdminPartnersPage() {
  const rows = await getApprovedPartners()
  return (
    <div>
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">PARTNERS</p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">승인된 파트너</h1>

      <table className="mt-10 w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <Th>회사</Th><Th>카테고리</Th><Th>순서</Th><Th>노출</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <Td>{r.name}</Td>
              <Td>{r.category}</Td>
              <Td>{r.sort_order}</Td>
              <Td>
                <form action={async () => {
                  'use server'
                  await togglePartnerPublished(r.id, !r.published)
                }}>
                  <button className={`text-xs underline ${r.published ? 'text-green-700' : 'text-fg-muted'}`}>
                    {r.published ? 'ON' : 'OFF'}
                  </button>
                </form>
              </Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td colSpan={4}><p className="py-12 text-center text-fg-muted">아직 승인된 파트너가 없습니다.</p></Td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted py-3 pr-4">{children}</th>
}
function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className="py-4 pr-4 text-fg-subtle">{children}</td>
}
