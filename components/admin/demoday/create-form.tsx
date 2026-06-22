'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createDemodayEvent } from '@/app/admin/actions/demoday'
import {
  DEMODAY_ACTION_INITIAL,
  type DemodayActionState,
} from '@/app/admin/actions/demoday-state'

export function CreateDemodayForm() {
  const [state, action] = useActionState<DemodayActionState, FormData>(
    createDemodayEvent,
    DEMODAY_ACTION_INITIAL,
  )
  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          회차
        </span>
        <input
          type="number"
          name="volume"
          min={1}
          max={100}
          required
          className="w-24 border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          학기
        </span>
        <select
          name="semester"
          required
          defaultValue="1학기"
          className="border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        >
          <option value="1학기">1학기</option>
          <option value="2학기">2학기</option>
        </select>
      </label>
      <CreateSubmit />
      {state.status === 'error' && (
        <span className="text-xs text-red-600">{state.message}</span>
      )}
    </form>
  )
}

function CreateSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-fg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-primary hover:bg-fg-primary hover:text-bg-base disabled:opacity-50"
    >
      {pending ? '생성 중…' : '회차 생성'}
    </button>
  )
}
