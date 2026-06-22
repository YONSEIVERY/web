'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateDemodayEvent } from '@/app/admin/actions/demoday'
import {
  DEMODAY_ACTION_INITIAL,
  type DemodayActionState,
} from '@/app/admin/actions/demoday-state'

type Initial = {
  event_date: string
  event_end_date: string
  location: string
  location_note: string
  intro_text: string
  schedule: string
  form_choices: string
}

export function EditDemodayForm({ id, initial }: { id: string; initial: Initial }) {
  const [state, action] = useActionState<DemodayActionState, FormData>(
    updateDemodayEvent,
    DEMODAY_ACTION_INITIAL,
  )
  return (
    <form action={action} className="mt-6 grid grid-cols-1 gap-6">
      <input type="hidden" name="id" value={id} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
            행사 시작 (선택)
          </span>
          <input
            type="datetime-local"
            name="event_date"
            defaultValue={initial.event_date}
            className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
          />
        </label>
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
            행사 종료 (선택)
          </span>
          <input
            type="datetime-local"
            name="event_end_date"
            defaultValue={initial.event_end_date}
            className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
          />
        </label>
      </div>

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          장소 (예: 티오더 사옥)
        </span>
        <input
          type="text"
          name="location"
          defaultValue={initial.location}
          className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          장소 안내 (선택)
        </span>
        <textarea
          name="location_note"
          rows={2}
          defaultValue={initial.location_note}
          className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          한 줄 안내 (히어로 서브라인)
        </span>
        <textarea
          name="intro_text"
          rows={3}
          defaultValue={initial.intro_text}
          className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          일정 (JSON · [{`{time, label}`}])
        </span>
        <textarea
          name="schedule"
          rows={8}
          defaultValue={initial.schedule}
          className="w-full border border-border bg-bg-base px-3 py-2 font-mono text-xs text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          폼 옵션 (JSON · {`{purposes, roles, sources}`})
        </span>
        <textarea
          name="form_choices"
          rows={12}
          defaultValue={initial.form_choices}
          className="w-full border border-border bg-bg-base px-3 py-2 font-mono text-xs text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>

      <div className="flex items-center gap-3">
        <Submit />
        {state.status === 'success' && (
          <span className="text-xs text-green-700">{state.message ?? '저장됨'}</span>
        )}
        {state.status === 'error' && (
          <span className="text-xs text-red-600">{state.message}</span>
        )}
      </div>
    </form>
  )
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-fg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-primary hover:bg-fg-primary hover:text-bg-base disabled:opacity-50"
    >
      {pending ? '저장 중…' : '저장'}
    </button>
  )
}
