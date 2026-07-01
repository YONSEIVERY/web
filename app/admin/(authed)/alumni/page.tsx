import { getApprovedAlumni } from '@/lib/admin/queries'
import { PublishToggle } from '@/components/admin/publish-toggle'
import { DeleteButton } from '@/components/admin/delete-button'

export const dynamic = 'force-dynamic'

export default async function AdminAlumniPage() {
  const rows = await getApprovedAlumni()
  return (
    <div>
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">ALUMNI</p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">승인된 알럼나이</h1>

      <div className="mt-10 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <Th>이름</Th><Th>기수</Th><Th>현재</Th><Th>노출</Th><Th>삭제</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <Td>{r.name}</Td>
              <Td>{r.cohort}기</Td>
              <Td>{r.job_title}</Td>
              <Td>
                <PublishToggle kind="alumni" id={r.id} published={r.published} />
              </Td>
              <Td>
                <DeleteButton kind="alumni" id={r.id} label={`${r.name} (${r.cohort}기)`} />
              </Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td colSpan={5}><p className="py-12 text-center text-fg-muted">아직 승인된 알럼나이가 없습니다.</p></Td></tr>}
        </tbody>
      </table>
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted py-3 pr-4">{children}</th>
}
function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className="py-4 pr-4 text-fg-subtle">{children}</td>
}
