import Link from 'next/link'
import type { Route } from 'next'
import { SponsorForm } from '@/components/admin/sponsors/sponsor-form'

export const dynamic = 'force-dynamic'

export default function NewSponsorPage() {
  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        NEW SPONSOR
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        후원자 추가
      </h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link href={'/admin/sponsors' as Route} className="underline">
          ← 후원자 목록
        </Link>
      </p>

      <SponsorForm
        initial={{
          name: '',
          kind: 'individual',
          category: 'prize',
          cohort_label: '',
          note: '',
          order_index: 0,
        }}
      />
    </div>
  )
}
