import Link from 'next/link'
import type { Route } from 'next'
import { getAdminCounts } from '@/lib/admin/queries'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const {
    alumniPending,
    partnerPending,
    inquiriesNew,
    demodayCurrentAttendees,
  } = await getAdminCounts()
  const total = alumniPending + partnerPending

  return (
    <div>
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">DASHBOARD</p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">오늘의 처리할 일</h1>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-10 md:grid-cols-3 md:gap-6 max-w-4xl">
        <Card
          href="/admin/applications"
          label="대기 중 신청"
          count={total}
          hint={`알럼나이 ${alumniPending} · 파트너 ${partnerPending}`}
        />
        <Card
          href="/admin/inquiries"
          label="미처리 문의"
          count={inquiriesNew}
          hint="GENERAL + INDUSTRY"
        />
        <Card
          href="/admin/demoday"
          label="데모데이 신청자"
          count={demodayCurrentAttendees}
          hint="현 회차 누적"
        />
      </div>
    </div>
  )
}

function Card({ href, label, count, hint }: { href: string; label: string; count: number; hint: string }) {
  return (
    <Link href={href as Route} className="block border border-border p-5 hover:border-fg-primary transition-colors md:p-6">
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">{label}</p>
      <p className="mt-4 font-display text-4xl text-fg-primary md:text-5xl">{count}</p>
      <p className="mt-4 font-display text-xs text-fg-subtle">{hint}</p>
    </Link>
  )
}
