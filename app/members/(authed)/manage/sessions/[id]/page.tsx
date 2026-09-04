import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { requireExec } from '@/lib/portal/auth'
import { getSessionById } from '@/lib/portal/queries'
import { updateSession } from '@/app/members/actions/portal'
import { SessionForm } from '@/components/portal/session-form'
import { SessionMaterials } from '@/components/portal/session-materials'
import { MaterialUploader } from '@/components/portal/material-uploader'
import { DeleteButton } from '@/components/admin/delete-button'

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

      {/* 자료 첨부는 SessionForm 바깥이다. 파일은 폼 제출이 아니라 서명
          업로드로 즉시 올라가고, form 안에 두면 중첩 폼이 된다. */}
      <section className="mt-14 max-w-3xl border-t border-border pt-10">
        <p
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
        >
          MANAGE · MATERIALS
        </p>
        <p className="mt-2 text-xs text-fg-muted">
          여기 올린 파일은 세션 안내글 아래에 붙어 학회원이 내려받습니다.
          저장 버튼과 무관하게 즉시 반영됩니다.
        </p>
        <div className="mt-6">
          <MaterialUploader sessionId={session.id} />
        </div>
        <div className="mt-8">
          <SessionMaterials sessionId={session.id} manage />
        </div>
      </section>

      <section className="mt-12 max-w-3xl border border-red-400 p-6">
        <h2
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-red-400"
        >
          DANGER · DELETE
        </h2>
        {/* 0025 이후 출결이나 기록이 딸린 세션은 DB가 삭제를 막는다.
            "함께 사라진다"는 옛 CASCADE 시절 문구라 사실과 다르다. */}
        <p className="mt-2 text-xs text-fg-muted">
          출결, 학회원 기록, 자료, 제출물 중 하나라도 딸린 세션은 삭제되지
          않습니다. 그런 기록이 없는 세션만 삭제되며, 삭제는 복구할 수
          없습니다. 지난 세션을 정리하려면 삭제 대신 비공개(초안)로 돌리세요.
        </p>
        <div className="mt-4">
          <DeleteButton
            kind="club_session"
            id={session.id}
            label={`${session.week !== null ? `${session.week}주차 · ` : ''}${session.title}`}
          />
        </div>
      </section>
    </div>
  )
}
