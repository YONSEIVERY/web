'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteAlumni, deletePartner } from '@/app/admin/actions/delete'
import {
  DELETE_INITIAL,
  type DeleteState,
} from '@/app/admin/actions/delete-state'

type Kind = 'alumni' | 'partner'

const ACTIONS: Record<
  Kind,
  (prev: DeleteState, formData: FormData) => Promise<DeleteState>
> = {
  alumni: deleteAlumni,
  partner: deletePartner,
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
      <SubmitButton />
      {state.error ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-red-600 underline disabled:opacity-50"
    >
      {pending ? '삭제 중…' : '삭제'}
    </button>
  )
}
