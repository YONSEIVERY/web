import Link from 'next/link'
import type { Route } from 'next'
import { LeadershipForm } from '@/components/admin/leadership/leadership-form'

export const dynamic = 'force-dynamic'

export default function NewLeaderPage() {
  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        NEW LEADER
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">회장단 추가</h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link href={'/admin/leadership' as Route} className="underline">
          ← 회장단 목록
        </Link>
      </p>

      <LeadershipForm
        initial={{
          role_mono: '',
          role: '',
          name: '',
          mono_name: '',
          email: '',
          cohort_label: '',
          sort_order: 100,
        }}
      />
    </div>
  )
}
