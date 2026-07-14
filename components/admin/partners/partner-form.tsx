'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createPartner, updatePartner } from '@/app/admin/actions/partners'
import {
  PARTNER_ACTION_INITIAL,
  type PartnerActionState,
} from '@/app/admin/actions/partners-state'

type Category = 'CORPORATE' | 'CAPITAL' | 'ACADEMIC'

type Initial = {
  id?: string
  name: string
  category: Category
  one_liner: string
  logo_url: string
  marquee_logo_url: string
  sort_order: number
  published: boolean
}

export function PartnerForm({ initial }: { initial: Initial }) {
  const isEdit = Boolean(initial.id)
  const [state, action] = useActionState<PartnerActionState, FormData>(
    isEdit ? updatePartner : createPartner,
    PARTNER_ACTION_INITIAL,
  )
  return (
    <form action={action} className="mt-6 grid max-w-2xl grid-cols-1 gap-6">
      {isEdit && <input type="hidden" name="id" value={initial.id} />}

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          회사명
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
          카테고리
        </span>
        <select
          name="category"
          defaultValue={initial.category}
          className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        >
          <option value="CORPORATE">CORPORATE · 기업</option>
          <option value="CAPITAL">CAPITAL · VC</option>
          <option value="ACADEMIC">ACADEMIC · 교내·학술</option>
        </select>
      </label>

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          한 줄 소개
        </span>
        <input
          type="text"
          name="one_liner"
          required
          defaultValue={initial.one_liner}
          className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          로고 URL (카드용 · 원본 로고 · 선택)
        </span>
        <input
          type="text"
          name="logo_url"
          defaultValue={initial.logo_url}
          placeholder="/partners/foo.png 또는 https://…"
          className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          마퀴 배너 로고 URL (다크 배경용 흑백 SVG · 선택)
        </span>
        <input
          type="text"
          name="marquee_logo_url"
          defaultValue={initial.marquee_logo_url}
          placeholder="/partners/foo.svg 또는 https://…"
          className="w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        />
        <span className="text-[10px] text-fg-muted">
          비워두면 사이트 하단 마퀴 배너에 노출되지 않습니다. 카드용
          로고와 별도 저장(다크 배경에 맞춘 흰색/실루엣 SVG 권장).
        </span>
      </label>

      <label className="grid gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          정렬 순서 (작을수록 위)
        </span>
        <input
          type="number"
          name="sort_order"
          defaultValue={initial.sort_order}
          step={1}
          className="w-40 border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </label>

      <label className="inline-flex items-center gap-3">
        <input
          type="checkbox"
          name="published"
          defaultChecked={initial.published}
          className="h-4 w-4"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          공개 페이지에 노출
        </span>
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
