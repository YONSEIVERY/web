'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteSponsor } from '@/app/admin/actions/sponsors'
import {
  SPONSOR_ACTION_INITIAL,
  type SponsorActionState,
} from '@/app/admin/actions/sponsors-state'

export function DeleteSponsorForm({ id }: { id: string }) {
  const [state, action] = useActionState<SponsorActionState, FormData>(
    deleteSponsor,
    SPONSOR_ACTION_INITIAL,
  )
  return (
    <form
      action={action}
      className="mt-4 flex items-center gap-3"
      onSubmit={(e) => {
        if (!confirm('정말 삭제할까요? 되돌릴 수 없습니다.')) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Submit />
      {state.status === 'error' && (
        <span className="text-xs text-red-600">{state.message}</span>
      )}
    </form>
  )
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-red-500 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-red-500 hover:bg-red-500 hover:text-bg-base disabled:opacity-50"
    >
      {pending ? '삭제 중…' : '이 후원자 삭제'}
    </button>
  )
}
