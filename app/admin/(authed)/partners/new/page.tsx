import Link from 'next/link'
import type { Route } from 'next'
import { PartnerForm } from '@/components/admin/partners/partner-form'

export const dynamic = 'force-dynamic'

export default function NewPartnerPage() {
  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        NEW PARTNER
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">파트너 추가</h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link href={'/admin/partners' as Route} className="underline">
          ← 파트너 목록
        </Link>
      </p>

      <PartnerForm
        initial={{
          name: '',
          category: 'CORPORATE',
          one_liner: '',
          logo_url: '',
          marquee_logo_url: '',
          sort_order: 100,
          published: true,
        }}
      />
    </div>
  )
}
