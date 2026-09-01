'use client'
import { useTransition } from 'react'
import { setAttendance } from '@/app/members/actions/portal'

const DISABLED_CLASS = 'disabled:cursor-not-allowed disabled:opacity-60'

/**
 * 출결 저장 버튼. 이 버튼은 form={formId}로 폼 바깥에 놓이는 배치라
 * useFormStatus가 잡지 못한다(훅은 <form> 자손일 때만 동작한다). 그래서
 * 제출을 직접 받아 useTransition으로 서버 왕복을 표시한다. 저장은 upsert라
 * 여러 번 눌러도 안전하고, 브라우저 기본 검증은 reportValidity로 살린다.
 */
export function SaveButton({
  formId,
  recorded,
  memberName,
  className = '',
}: {
  formId: string
  recorded: boolean
  memberName: string
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  const label = recorded ? '수정' : '기록'
  return (
    <button
      type="submit"
      form={formId}
      disabled={pending}
      aria-label={`${memberName} 출결 ${label}`}
      onClick={(event) => {
        const form = event.currentTarget.form
        if (!form) return
        event.preventDefault()
        if (!form.reportValidity()) return
        const data = new FormData(form)
        startTransition(async () => {
          await setAttendance(data)
        })
      }}
      className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${DISABLED_CLASS} ${
        recorded
          ? 'border-border text-fg-subtle hover:border-fg-primary hover:text-fg-primary'
          : 'border-fg-primary text-fg-primary hover:bg-fg-primary hover:text-bg-base'
      } ${className}`}
    >
      {pending ? '저장 중…' : label}
    </button>
  )
}
