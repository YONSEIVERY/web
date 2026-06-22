import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { getDemodayById } from '@/lib/demoday/queries'
import { EditDemodayForm } from '@/components/admin/demoday/edit-form'
import { PosterUploadForm } from '@/components/admin/demoday/poster-upload-form'
import { DemodayToggles } from '@/components/admin/demoday/toggles'
import { DeleteDemodayForm } from '@/components/admin/demoday/delete-form'

export const dynamic = 'force-dynamic'

export default async function AdminDemodayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getDemodayById(id)
  if (!event) notFound()

  const eventDateLocal = event.event_date
    ? toDatetimeLocal(event.event_date)
    : ''
  const eventEndDateLocal = event.event_end_date
    ? toDatetimeLocal(event.event_end_date)
    : ''
  const scheduleJson = JSON.stringify(event.schedule, null, 2)
  const choicesJson = JSON.stringify(event.form_choices, null, 2)

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        DEMODAY · VOL.{event.volume}
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        {event.semester} · {event.is_current ? '현재 회차' : '과거 회차'}
      </h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link href={'/admin/demoday' as Route} className="underline">
          ← 회차 목록
        </Link>
        <span className="mx-2">·</span>
        <Link
          href={`/admin/demoday/${event.id}/attendees` as Route}
          className="underline"
        >
          신청자 명단
        </Link>
      </p>

      <section className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2 max-w-5xl">
        <div className="border border-border p-6">
          <h2
            translate="no"
            className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
          >
            STATUS
          </h2>
          <DemodayToggles
            id={event.id}
            isCurrent={event.is_current}
            registerOpen={event.register_open}
          />
        </div>

        <div className="border border-border p-6">
          <h2
            translate="no"
            className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
          >
            POSTER
          </h2>
          {event.poster_url ? (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.poster_url}
                alt="현재 포스터"
                className="max-h-64 border border-border"
              />
            </div>
          ) : (
            <p className="mt-4 text-xs text-fg-muted">아직 등록된 포스터가 없습니다.</p>
          )}
          <PosterUploadForm id={event.id} />
        </div>
      </section>

      <section className="mt-10 max-w-5xl border border-border p-6">
        <h2
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
        >
          DETAILS
        </h2>
        <EditDemodayForm
          id={event.id}
          initial={{
            event_date: eventDateLocal,
            event_end_date: eventEndDateLocal,
            location: event.location ?? '',
            location_note: event.location_note ?? '',
            intro_text: event.intro_text ?? '',
            schedule: scheduleJson,
            form_choices: choicesJson,
          }}
        />
      </section>

      <section className="mt-10 max-w-5xl border border-red-300 p-6">
        <h2
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-red-700"
        >
          DANGER · DELETE
        </h2>
        <p className="mt-2 text-xs text-fg-muted">
          이 회차를 삭제하면 연결된 신청자 명단도 함께 삭제됩니다.
        </p>
        <DeleteDemodayForm id={event.id} />
      </section>
    </div>
  )
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
