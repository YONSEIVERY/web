'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  setDemodayCurrent,
  toggleDemodayRegisterOpen,
} from '@/app/admin/actions/demoday'
import {
  DEMODAY_ACTION_INITIAL,
  type DemodayActionState,
} from '@/app/admin/actions/demoday-state'

export function DemodayToggles({
  id,
  isCurrent,
  registerOpen,
}: {
  id: string
  isCurrent: boolean
  registerOpen: boolean
}) {
  return (
    <div className="mt-4 flex flex-col gap-4 text-sm">
      <CurrentRow id={id} isCurrent={isCurrent} />
      <RegisterRow id={id} registerOpen={registerOpen} />
      <p className="text-[10px] text-fg-muted">
        한 시점에 하나의 회차만 <em>현재</em>가 됩니다. 다른 회차로 현재를
        옮기면 기존 회차는 자동으로 해제됩니다.
      </p>
    </div>
  )
}

function CurrentRow({ id, isCurrent }: { id: string; isCurrent: boolean }) {
  const [state, action] = useActionState<DemodayActionState, FormData>(
    setDemodayCurrent,
    DEMODAY_ACTION_INITIAL,
  )
  return (
    <form action={action} className="flex items-center justify-between gap-3">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-col">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-primary">
          현재 회차
        </span>
        <span className="text-xs text-fg-subtle">
          /demoday에서 이 회차를 표시합니다.
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isCurrent ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
            CURRENT
          </span>
        ) : (
          <SetCurrentButton />
        )}
        {state.status === 'error' && (
          <span className="text-[10px] text-red-600">{state.message}</span>
        )}
      </div>
    </form>
  )
}

function SetCurrentButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-fg-primary px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-primary hover:bg-fg-primary hover:text-bg-base disabled:opacity-50"
    >
      {pending ? '...' : '현재로 지정'}
    </button>
  )
}

function RegisterRow({
  id,
  registerOpen,
}: {
  id: string
  registerOpen: boolean
}) {
  const [state, action] = useActionState<DemodayActionState, FormData>(
    toggleDemodayRegisterOpen,
    DEMODAY_ACTION_INITIAL,
  )
  return (
    <form action={action} className="flex items-center justify-between gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="value" value={String(!registerOpen)} />
      <div className="flex flex-col">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-primary">
          신청 접수
        </span>
        <span className="text-xs text-fg-subtle">
          OPEN일 때만 /demoday/register에서 폼이 노출됩니다.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <RegisterButton registerOpen={registerOpen} />
        {state.status === 'error' && (
          <span className="text-[10px] text-red-600">{state.message}</span>
        )}
      </div>
    </form>
  )
}

function RegisterButton({ registerOpen }: { registerOpen: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] disabled:opacity-50 ${
        registerOpen
          ? 'border-green-700 text-green-700 hover:bg-green-700 hover:text-bg-base'
          : 'border-fg-muted text-fg-muted hover:border-fg-primary hover:text-fg-primary'
      }`}
    >
      {pending ? '...' : registerOpen ? 'OPEN · 닫기' : 'CLOSED · 열기'}
    </button>
  )
}
