'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createLeader, updateLeader } from '@/app/admin/actions/leadership'
import {
  LEADERSHIP_ACTION_INITIAL,
  type LeadershipActionState,
} from '@/app/admin/actions/leadership-state'

type Initial = {
  id?: string
  role_mono: string
  role: string
  name: string
  mono_name: string
  email: string
  cohort_label: string
  sort_order: number
}

export function LeadershipForm({ initial }: { initial: Initial }) {
  const isEdit = Boolean(initial.id)
  const [state, action] = useActionState<LeadershipActionState, FormData>(
    isEdit ? updateLeader : createLeader,
    LEADERSHIP_ACTION_INITIAL,
  )
  return (
    <form action={action} className="mt-6 grid max-w-2xl grid-cols-1 gap-6">
      {isEdit && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
            영문 직함 (예: PRESIDENT)
          </span>
          <input
            type="text"
            name="role_mono"
            required
            defaultValue={initial.role_mono}
            className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
          />
        </label>
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
            한글 직함 (예: 회장)
          </span>
          <input
            type="text"
            name="role"
            required
            defaultValue={initial.role}
            className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
            이름 (한글)
          </span>
          <input
            type="text"
            name="name"
            required
            defaultValue={initial.name}
            className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
          />
        </label>
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
            이름 (영문, 예: HYUNWOO SHIN)
          </span>
          <input
            type="text"
            name="mono_name"
            required
            defaultValue={initial.mono_name}
            className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
          />
        </label>
      </div>

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          이메일 (선택 · 학회 대표 연락처로 노출 가능)
        </span>
        <input
          type="email"
          name="email"
          defaultValue={initial.email}
          placeholder="name@yonsei.ac.kr"
          className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
            회차 라벨 (예: 43기 · 선택)
          </span>
          <input
            type="text"
            name="cohort_label"
            defaultValue={initial.cohort_label}
            className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
          />
        </label>
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
            정렬 순서 (작을수록 위)
          </span>
          <input
            type="number"
            name="sort_order"
            defaultValue={initial.sort_order}
            step={10}
            className="w-40 border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Submit isEdit={isEdit} />
        {state.status === 'success' && (
          <span className="text-xs text-green-700">
            {state.message ?? '저장됨'}
          </span>
        )}
        {state.status === 'error' && (
          <span className="text-xs text-red-600">{state.message}</span>
        )}
      </div>
    </form>
  )
}

function Submit({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-fg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-primary hover:bg-fg-primary hover:text-bg-base disabled:opacity-50"
    >
      {pending ? '저장 중…' : isEdit ? '저장' : '추가'}
    </button>
  )
}
