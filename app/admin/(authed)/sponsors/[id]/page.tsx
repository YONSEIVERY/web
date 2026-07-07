import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { getSponsorById } from '@/lib/sponsors/queries'
import { SponsorForm } from '@/components/admin/sponsors/sponsor-form'
import { DeleteSponsorForm } from '@/components/admin/sponsors/delete-sponsor-form'

export const dynamic = 'force-dynamic'

export default async function AdminSponsorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sponsor = await getSponsorById(id)
  if (!sponsor) notFound()

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        EDIT SPONSOR
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">{sponsor.name}</h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link href={'/admin/sponsors' as Route} className="underline">
          ← 후원자 목록
        </Link>
      </p>

      <section className="mt-10 max-w-2xl border border-border p-6">
        <h2
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
        >
          DETAILS
        </h2>
        <SponsorForm
          initial={{
            id: sponsor.id,
            name: sponsor.name,
            kind: sponsor.kind,
            category: sponsor.category,
            cohort_label: sponsor.cohort_label ?? '',
            note: sponsor.note ?? '',
            order_index: sponsor.order_index,
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
          이 후원자를 명단에서 완전히 삭제합니다.
        </p>
        <DeleteSponsorForm id={sponsor.id} />
      </section>
    </div>
  )
}
