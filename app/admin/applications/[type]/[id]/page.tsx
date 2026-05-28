import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getApplicationDetail } from '@/lib/admin/queries'
import { approveAlumni, approvePartner, rejectApplication } from '@/app/admin/actions/applications'

export const dynamic = 'force-dynamic'

export default async function DetailPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params
  if (type !== 'alumni' && type !== 'partner') notFound()
  const data = await getApplicationDetail(type as 'alumni' | 'partner', id)
  if (!data) notFound()

  return (
    <div className="max-w-2xl">
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">{type === 'alumni' ? '알럼나이 신청' : '파트너 신청'}</p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">{(data as { name: string }).name}</h1>

      <dl className="mt-10 grid grid-cols-[120px_1fr] gap-y-3 text-sm">
        {Object.entries(data).map(([k, v]) => {
          if (v === null || k === 'id' || typeof v === 'object') return null
          return (
            <>
              <dt key={`${k}-dt`} className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">{k}</dt>
              <dd key={`${k}-dd`} className="text-fg-subtle">{String(v)}</dd>
            </>
          )
        })}
      </dl>

      {type === 'alumni' && (data as { alumni_companies?: unknown[] }).alumni_companies && (data as { alumni_companies: { name: string; logo_url: string; one_liner: string }[] }).alumni_companies.length > 0 && (
        <div className="mt-10 border-t border-border pt-10">
          <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">동반 회사</p>
          {(data as { alumni_companies: { name: string; logo_url: string; one_liner: string }[] }).alumni_companies.map((c, i) => (
            <div key={i} className="mt-4 flex items-start gap-4">
              <Image src={c.logo_url} alt={c.name} width={64} height={64} className="border border-border" />
              <div>
                <p className="font-display text-base text-fg-primary">{c.name}</p>
                <p className="text-sm text-fg-subtle">{c.one_liner}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 flex gap-3">
        <form action={async () => {
          'use server'
          if (type === 'alumni') await approveAlumni(id)
          else await approvePartner(id)
        }}>
          <button className="font-mono text-xs uppercase tracking-[0.28em] border border-fg-primary px-6 py-3 hover:bg-fg-primary hover:text-bg-base transition-colors">
            승인
          </button>
        </form>
        <form action={async (formData) => {
          'use server'
          await rejectApplication(type as 'alumni' | 'partner', id, String(formData.get('reason') ?? ''))
        }} className="flex gap-2">
          <input name="reason" placeholder="거절 사유 (선택)" className="border border-border px-3 py-2 text-sm" />
          <button className="font-mono text-xs uppercase tracking-[0.28em] border border-red-600 text-red-600 px-6 py-3">거절</button>
        </form>
      </div>
    </div>
  )
}
