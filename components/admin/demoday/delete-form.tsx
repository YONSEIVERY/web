'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteDemodayEvent } from '@/app/admin/actions/demoday'
import {
  DEMODAY_ACTION_INITIAL,
  type DemodayActionState,
} from '@/app/admin/actions/demoday-state'

export function DeleteDemodayForm({ id }: { id: string }) {
  const [state, action] = useActionState<DemodayActionState, FormData>(
    deleteDemodayEvent,
    DEMODAY_ACTION_INITIAL,
  )
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('정말 삭제하시겠습니까? 신청자 명단도 함께 삭제됩니다.')) {
          e.preventDefault()
        }
      }}
      className="mt-4 flex items-center gap-3"
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
      className="border border-red-600 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-red-700 hover:bg-red-600 hover:text-bg-base disabled:opacity-50"
    >
      {pending ? '삭제 중…' : '회차 삭제'}
    </button>
  )
}
