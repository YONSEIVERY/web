import Link from 'next/link'
import type { Route } from 'next'
import { getPendingApplications } from '@/lib/admin/queries'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPage() {
  const { alumni, partners } = await getPendingApplications()

  return (
    <div>
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">QUEUE</p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">신청 큐</h1>

      <table className="mt-10 w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <Th>종류</Th><Th>요약</Th><Th>접수일</Th><Th>액션</Th>
          </tr>
        </thead>
        <tbody>
          {alumni.map((a) => (
            <tr key={a.id} className="border-b border-border">
              <Td>🎓 알럼나이</Td>
              <Td>{a.name} · {a.cohort}기 · {a.job_title}{(a.alumni_companies as { id: string }[]).length > 0 ? ` (+회사 ${(a.alumni_companies as { id: string }[]).length})` : ''}</Td>
              <Td>{new Date(a.created_at).toLocaleDateString('ko-KR')}</Td>
              <Td><Link href={`/admin/applications/alumni/${a.id}` as Route} className="underline">상세</Link></Td>
            </tr>
          ))}
          {partners.map((p) => (
            <tr key={p.id} className="border-b border-border">
              <Td>🤝 파트너</Td>
              <Td>{p.name} · {p.category} · {p.applicant_name}</Td>
              <Td>{new Date(p.created_at).toLocaleDateString('ko-KR')}</Td>
              <Td><Link href={`/admin/applications/partner/${p.id}` as Route} className="underline">상세</Link></Td>
            </tr>
          ))}
          {alumni.length === 0 && partners.length === 0 && (
            <tr><Td colSpan={4}><p className="py-12 text-center text-fg-muted">대기 중인 신청이 없습니다.</p></Td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted py-3">{children}</th>
}
function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className="py-4">{children}</td>
}
