'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  TOGGLE_INITIAL,
  toggleAlumniCompanyPublished,
  toggleAlumniPublished,
  togglePartnerPublished,
  type ToggleState,
} from '@/app/admin/actions/publish'

type Kind = 'alumni' | 'alumni_company' | 'partner'

const ACTIONS: Record<
  Kind,
  (prev: ToggleState, formData: FormData) => Promise<ToggleState>
> = {
  alumni: toggleAlumniPublished,
  alumni_company: toggleAlumniCompanyPublished,
  partner: togglePartnerPublished,
}

export function PublishToggle({
  kind,
  id,
  published,
}: {
  kind: Kind
  id: string
  published: boolean
}) {
  const [state, formAction] = useActionState<ToggleState, FormData>(
    ACTIONS[kind],
    TOGGLE_INITIAL,
  )
  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="value" value={String(!published)} />
      <ToggleButton published={published} />
      {state.error ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}
    </form>
  )
}

function ToggleButton({ published }: { published: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`text-xs underline disabled:opacity-50 ${published ? 'text-green-700' : 'text-fg-muted'}`}
    >
      {pending ? '...' : published ? 'ON' : 'OFF'}
    </button>
  )
}
