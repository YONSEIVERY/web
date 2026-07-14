'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  deleteMember,
  deleteMemberPhoto,
  uploadMemberPhoto,
} from '@/app/admin/actions/cohort-members'
import {
  COHORT_MEMBER_ACTION_INITIAL,
  type CohortMemberActionState,
} from '@/app/admin/actions/cohort-members-state'

export function PhotoUploadForm({ id }: { id: string }) {
  const [state, action] = useActionState<CohortMemberActionState, FormData>(
    uploadMemberPhoto,
    COHORT_MEMBER_ACTION_INITIAL,
  )
  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <input
        type="file"
        name="photo"
        accept="image/png,image/jpeg,image/webp"
        required
        className="text-xs text-fg-subtle file:mr-3 file:border file:border-border file:bg-bg-base file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.28em] file:text-fg-primary hover:file:border-fg-primary"
      />
      <UploadButton />
      {state.status === 'success' && (
        <span className="text-xs text-green-700">{state.message}</span>
      )}
      {state.status === 'error' && (
        <span className="text-xs text-red-600">{state.message}</span>
      )}
    </form>
  )
}

function UploadButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-fg-primary px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-primary hover:bg-fg-primary hover:text-bg-base disabled:opacity-50"
    >
      {pending ? '업로드 중…' : '업로드'}
    </button>
  )
}

export function DeletePhotoForm({ id }: { id: string }) {
  const [state, action] = useActionState<CohortMemberActionState, FormData>(
    deleteMemberPhoto,
    COHORT_MEMBER_ACTION_INITIAL,
  )
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('사진을 삭제할까요?')) e.preventDefault()
      }}
      className="mt-3"
    >
      <input type="hidden" name="id" value={id} />
      <DeleteBtn />
      {state.status === 'error' && (
        <span className="ml-3 text-xs text-red-600">{state.message}</span>
      )}
    </form>
  )
}

function DeleteBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-red-500 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-red-500 hover:bg-red-500 hover:text-bg-base disabled:opacity-50"
    >
      {pending ? '삭제 중…' : '사진 삭제'}
    </button>
  )
}

export function DeleteMemberForm({ id, label }: { id: string; label: string }) {
  const [state, action] = useActionState<CohortMemberActionState, FormData>(
    deleteMember,
    COHORT_MEMBER_ACTION_INITIAL,
  )
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`정말 삭제할까요?\n\n${label}\n\n이 회원의 사진도 함께 삭제됩니다.`))
          e.preventDefault()
      }}
      className="mt-4 flex items-center gap-3"
    >
      <input type="hidden" name="id" value={id} />
      <MemberDeleteBtn />
      {state.status === 'error' && (
        <span className="text-xs text-red-600">{state.message}</span>
      )}
    </form>
  )
}

function MemberDeleteBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-red-500 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-red-500 hover:bg-red-500 hover:text-bg-base disabled:opacity-50"
    >
      {pending ? '삭제 중…' : '이 회원 삭제'}
    </button>
  )
}
