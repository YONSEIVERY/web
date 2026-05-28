import { getInquiries } from '@/lib/admin/queries'
import { updateInquiryStatus } from '@/app/admin/actions/inquiries'

export const dynamic = 'force-dynamic'

const STATUSES = ['new', 'in_progress', 'done'] as const

export default async function InquiriesPage() {
  const rows = await getInquiries()
  return (
    <div>
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">INQUIRIES</p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">문의</h1>

      {/* 메시지 펼침은 후속 — MVP에선 mailto로 답장 */}
      <table className="mt-10 w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <Th>유형</Th><Th>이름</Th><Th>이메일</Th><Th>분류</Th><Th>상태</Th><Th>접수</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border align-top">
              <Td><span className="text-xs uppercase tracking-wider">{r.type === 'INDUSTRY' ? '산학협력' : '일반'}</span></Td>
              <Td>{r.name}{r.affiliation ? <span className="block text-xs text-fg-muted">{r.affiliation}</span> : null}</Td>
              <Td><a href={`mailto:${r.email}`} className="underline">{r.email}</a></Td>
              <Td>{r.subject}</Td>
              <Td>
                <form action={async (fd) => {
                  'use server'
                  await updateInquiryStatus(r.id, String(fd.get('status')) as 'new' | 'in_progress' | 'done')
                }}>
                  <select name="status" defaultValue={r.status} className="border border-border px-2 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="ml-2 text-xs underline">변경</button>
                </form>
              </Td>
              <Td>{new Date(r.created_at).toLocaleDateString('ko-KR')}</Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td colSpan={6}><p className="py-12 text-center text-fg-muted">문의가 없습니다.</p></Td></tr>}
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
