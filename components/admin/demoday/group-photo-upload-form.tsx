'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { uploadDemodayGroupPhoto } from '@/app/admin/actions/demoday'
import {
  DEMODAY_ACTION_INITIAL,
  type DemodayActionState,
} from '@/app/admin/actions/demoday-state'

export function GroupPhotoUploadForm({ id }: { id: string }) {
  const [state, action] = useActionState<DemodayActionState, FormData>(
    uploadDemodayGroupPhoto,
    DEMODAY_ACTION_INITIAL,
  )
  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <input
        type="file"
        name="group_photo"
        accept="image/png,image/jpeg,image/webp"
        required
        className="text-xs text-fg-subtle file:mr-3 file:border-0 file:bg-transparent file:font-mono file:text-[10px] file:uppercase file:tracking-[0.28em] file:text-fg-primary"
      />
      <div className="flex items-center gap-3">
        <Submit />
        {state.status === 'success' && (
          <span className="text-xs text-green-700">{state.message}</span>
        )}
        {state.status === 'error' && (
          <span className="text-xs text-red-600">{state.message}</span>
        )}
      </div>
      <p className="text-[10px] text-fg-muted">PNG·JPEG·WEBP / 5MB 이하</p>
    </form>
  )
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit border border-fg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-primary hover:bg-fg-primary hover:text-bg-base disabled:opacity-50"
    >
      {pending ? '업로드 중…' : '단체사진 업로드'}
    </button>
  )
}
