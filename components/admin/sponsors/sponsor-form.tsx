'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createSponsor, updateSponsor } from '@/app/admin/actions/sponsors'
import {
  SPONSOR_ACTION_INITIAL,
  type SponsorActionState,
} from '@/app/admin/actions/sponsors-state'
import type { SponsorCategory, SponsorKind } from '@/lib/sponsors/queries'

type Initial = {
  id?: string
  name: string
  kind: SponsorKind
  category: SponsorCategory
  cohort_label: string
  note: string
  order_index: number
}

export function SponsorForm({ initial }: { initial: Initial }) {
  const isEdit = Boolean(initial.id)
  const [state, action] = useActionState<SponsorActionState, FormData>(
    isEdit ? updateSponsor : createSponsor,
    SPONSOR_ACTION_INITIAL,
  )
  return (
    <form action={action} className="mt-6 grid grid-cols-1 gap-6 max-w-2xl">
      {isEdit && <input type="hidden" name="id" value={initial.id} />}

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          이름 (표시명 · 익명은 "익명")
        </span>
        <input
          type="text"
          name="name"
          required
          defaultValue={initial.name}
          className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
            종류
          </span>
          <select
            name="kind"
            defaultValue={initial.kind}
            className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
          >
            <option value="individual">개인</option>
            <option value="company">기업</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
            카테고리
          </span>
          <select
            name="category"
            defaultValue={initial.category}
            className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
          >
            <option value="prize">데모데이 상금 후원</option>
            <option value="operations">운영자금 후원</option>
          </select>
        </label>
      </div>

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          회차 라벨 (예: VOL.42 데모데이 · 선택)
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
          소감·메모 (선택)
        </span>
        <textarea
          name="note"
          rows={3}
          defaultValue={initial.note}
          className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          정렬 순서 (작을수록 위)
        </span>
        <input
          type="number"
          name="order_index"
          defaultValue={initial.order_index}
          step={1}
          className="w-40 border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>

      <div className="flex items-center gap-3">
        <Submit isEdit={isEdit} />
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
