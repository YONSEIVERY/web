import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getApplicationDetail } from '@/lib/admin/queries'
import { PartnerForm } from '@/components/admin/partners/partner-form'
import { DeleteButton } from '@/components/admin/delete-button'

export const dynamic = 'force-dynamic'

type PartnerRow = {
  id: string
  name: string
  category: 'CORPORATE' | 'CAPITAL' | 'ACADEMIC'
  one_liner: string
  logo_url: string | null
  sort_order: number
  published: boolean
  status: 'pending' | 'approved' | 'rejected'
  applicant_name: string | null
  applicant_email: string | null
  applicant_note: string | null
  reject_reason: string | null
  created_at: string
  updated_at: string | null
  approved_at: string | null
}

export default async function AdminPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const partner = (await getApplicationDetail('partner', id)) as PartnerRow | null
  if (!partner) notFound()

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        EDIT PARTNER
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">{partner.name}</h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link href={'/admin/partners' as Route} className="underline">
          ← 파트너 목록
        </Link>
      </p>

      <section className="mt-10 max-w-2xl border border-border p-6">
        <h2
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
        >
          DETAILS
        </h2>
        <PartnerForm
          initial={{
            id: partner.id,
            name: partner.name,
            category: partner.category,
            one_liner: partner.one_liner,
            logo_url: partner.logo_url ?? '',
            sort_order: partner.sort_order,
            published: partner.published,
          }}
        />
      </section>

      {(partner.applicant_name !== 'ADMIN' ||
        partner.applicant_note ||
        partner.status === 'pending') && (
        <section className="mt-10 max-w-2xl border border-border p-6">
          <h2
            translate="no"
            className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
          >
            APPLICATION META
          </h2>
          <dl className="mt-4 grid grid-cols-[110px_1fr] gap-y-2 text-sm">
            <dt className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
              신청자
            </dt>
            <dd className="text-fg-subtle">{partner.applicant_name ?? '—'}</dd>
            <dt className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
              신청 이메일
            </dt>
            <dd className="text-fg-subtle">
              {partner.applicant_email ? (
                <a
                  href={`mailto:${partner.applicant_email}`}
                  className="underline hover:text-fg-primary"
                >
                  {partner.applicant_email}
                </a>
              ) : (
                '—'
              )}
            </dd>
            {partner.applicant_note && (
              <>
                <dt className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
                  신청 메모
                </dt>
                <dd className="whitespace-pre-wrap text-fg-subtle">
                  {partner.applicant_note}
                </dd>
              </>
            )}
            <dt className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
              상태
            </dt>
            <dd className="text-fg-subtle">{partner.status}</dd>
            {partner.status === 'rejected' && partner.reject_reason && (
              <>
                <dt className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
                  거절 사유
                </dt>
                <dd className="text-red-500">{partner.reject_reason}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      <section className="mt-10 max-w-2xl border border-red-300 p-6">
        <h2
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-red-700"
        >
          DANGER · DELETE
        </h2>
        <p className="mt-2 text-xs text-fg-muted">
          이 파트너를 목록에서 완전히 삭제합니다. 로고 파일도 함께 정리됩니다.
        </p>
        <div className="mt-3">
          <DeleteButton kind="partner" id={partner.id} label={partner.name} />
        </div>
      </section>
    </div>
  )
}
