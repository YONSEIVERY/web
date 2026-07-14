import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getLeaderById } from '@/lib/leadership/queries'
import { LeadershipForm } from '@/components/admin/leadership/leadership-form'
import { DeleteLeaderForm } from '@/components/admin/leadership/delete-leader-form'

export const dynamic = 'force-dynamic'

export default async function AdminLeaderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const leader = await getLeaderById(id)
  if (!leader) notFound()

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        EDIT LEADER
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        {leader.name}
      </h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link href={'/admin/leadership' as Route} className="underline">
          ← 회장단 목록
        </Link>
      </p>

      <section className="mt-10 max-w-2xl border border-border p-6">
        <h2
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
        >
          DETAILS
        </h2>
        <LeadershipForm
          initial={{
            id: leader.id,
            role_mono: leader.role_mono,
            role: leader.role,
            name: leader.name,
            mono_name: leader.mono_name,
            email: leader.email ?? '',
            cohort_label: leader.cohort_label ?? '',
            sort_order: leader.sort_order,
          }}
        />
      </section>

      <section className="mt-10 max-w-2xl border border-red-300 p-6">
        <h2
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-red-700"
        >
          DANGER · DELETE
        </h2>
        <p className="mt-2 text-xs text-fg-muted">
          이 회장단 항목을 삭제합니다.
        </p>
        <DeleteLeaderForm id={leader.id} />
      </section>
    </div>
  )
}
