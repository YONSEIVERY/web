'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteAlumni, deletePartner } from '@/app/admin/actions/delete'
import { deleteApplication } from '@/app/admin/actions/recruit'
import { deleteSessionPost } from '@/app/members/actions/posts'
import { deleteSessionMaterial } from '@/app/members/actions/materials'
import { deleteSessionSubmission } from '@/app/members/actions/submissions'
import { deleteIntroComment } from '@/app/members/actions/intro-comments'
import { deleteNotice, deleteSession } from '@/app/members/actions/portal'
import {
  DELETE_INITIAL,
  type DeleteState,
} from '@/app/admin/actions/delete-state'

type Kind =
  | 'alumni'
  | 'partner'
  | 'application'
  | 'session_post'
  | 'session_material'
  | 'session_submission'
  | 'intro_comment'
  | 'club_session'
  | 'notice'

const ACTIONS: Record<
  Kind,
  (prev: DeleteState, formData: FormData) => Promise<DeleteState>
> = {
  alumni: deleteAlumni,
  partner: deletePartner,
  application: deleteApplication,
  session_post: deleteSessionPost,
  session_material: deleteSessionMaterial,
  session_submission: deleteSessionSubmission,
  intro_comment: deleteIntroComment,
  club_session: deleteSession,
  notice: deleteNotice,
}

export function DeleteButton({
  kind,
  id,
  label,
}: {
  kind: Kind
  id: string
  label: string
}) {
  const [state, formAction] = useActionState<DeleteState, FormData>(
    ACTIONS[kind],
    DELETE_INITIAL,
  )
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`정말 삭제하시겠습니까?\n\n${label}\n\n복구할 수 없습니다.`))
          e.preventDefault()
      }}
      className="inline-flex items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton label={label} />
      {state.error ? (
        <span className="text-xs text-red-400">{state.error}</span>
      ) : null}
    </form>
  )
}

// 화면 텍스트는 '삭제' 하나뿐이라, 목록에서는 aria-label로만 대상이 구분된다.
// 모바일에서만 44px 타깃을 채우고 데스크톱 목록 밀도는 md 분기로 되돌린다.
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`${label} 삭제`}
      className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-xs text-red-400 underline disabled:opacity-50 md:min-h-0 md:px-0"
    >
      {pending ? '삭제 중…' : '삭제'}
    </button>
  )
}
