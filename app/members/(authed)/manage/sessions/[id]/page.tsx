import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { requireExec } from '@/lib/portal/auth'
import { getSessionById } from '@/lib/portal/queries'
import { deleteSession, updateSession } from '@/app/members/actions/portal'
import { SessionForm } from '@/components/portal/session-form'

export const dynamic = 'force-dynamic'

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireExec()
  const { id } = await params
  const session = await getSessionById(id)
  if (!session) notFound()

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        MANAGE · EDIT SESSION
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        {session.title}
      </h1>
      <div className="mb-10 mt-4 flex flex-wrap gap-6">
        <Link
          href={`/members/sessions/${session.id}` as Route}
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-subtle underline hover:text-fg-primary"
        >
          학회원 화면으로 보기
        </Link>
        <Link
          href={'/members/manage/sessions' as Route}
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-subtle underline hover:text-fg-primary"
        >
          ← 목록
        </Link>
      </div>

      <SessionForm
        action={updateSession}
        session={session}
        defaultCohort={session.cohort}
        submitLabel="저장"
      />

      <form action={deleteSession} className="mt-12 border-t border-border pt-6">
        <input type="hidden" name="id" value={session.id} />
        <button
          type="submit"
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-red-600 underline"
        >
          세션 삭제 (출결 기록 포함, 복구 불가)
        </button>
      </form>
    </div>
  )
}
