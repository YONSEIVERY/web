'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  approveMemberSignup,
  rejectMemberSignup,
} from '@/app/admin/actions/member-signups'
import {
  MEMBER_SIGNUP_ACTION_INITIAL,
  type MemberSignupActionState,
} from '@/app/admin/actions/member-signups-state'

/**
 * 자율 등록 신청 한 건의 승인·반려 버튼.
 *
 * 승인은 되돌리기 어렵다(학회원 행이 생기고 포털 로그인이 열린다). 그래서
 * 두 동작 모두 confirm으로 한 번 막고, 제출 중에는 버튼을 비활성화한다.
 * 비활성화가 없으면 연타가 그대로 통과해 같은 사람이 두 번 들어간다.
 */
export function SignupReview({
  id,
  label,
  cohort,
}: {
  id: string
  label: string
  cohort: number
}) {
  const [approveState, approveAction] = useActionState<
    MemberSignupActionState,
    FormData
  >(approveMemberSignup, MEMBER_SIGNUP_ACTION_INITIAL)
  const [rejectState, rejectAction] = useActionState<
    MemberSignupActionState,
    FormData
  >(rejectMemberSignup, MEMBER_SIGNUP_ACTION_INITIAL)

  const state =
    approveState.status !== 'idle'
      ? approveState
      : rejectState.status !== 'idle'
        ? rejectState
        : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form
          action={approveAction}
          onSubmit={(e) => {
            if (
              !confirm(
                `승인하시겠습니까?\n\n${label}\n\n${cohort}기 학회원 명단에 등록되고 포털 로그인이 열립니다.`,
              )
            )
              e.preventDefault()
          }}
        >
          <input type="hidden" name="id" value={id} />
          <ReviewButton
            label="승인"
            pendingLabel="승인 중…"
            ariaLabel={`${label} 승인`}
            className="border-fg-primary text-fg-primary hover:bg-fg-primary hover:text-bg-base"
          />
        </form>
        <form
          action={rejectAction}
          onSubmit={(e) => {
            if (
              !confirm(
                `반려하시겠습니까?\n\n${label}\n\n학회원으로 등록되지 않습니다. 신청 기록은 남습니다.\n\n` +
                  '이 이메일로는 다시 신청할 수 없습니다(기수당 1회). ' +
                  '오타나 착오로 반려한 것이라면 학회원 등록 화면에서 직접 추가하십시오.',
              )
            )
              e.preventDefault()
          }}
        >
          <input type="hidden" name="id" value={id} />
          <ReviewButton
            label="반려"
            pendingLabel="반려 중…"
            ariaLabel={`${label} 반려`}
            className="border-border text-red-400 hover:border-red-400"
          />
        </form>
      </div>
      {state ? (
        <p
          className={`max-w-[24ch] text-xs leading-relaxed ${
            state.status === 'error' ? 'text-red-400' : 'text-fg-subtle'
          }`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  )
}

function ReviewButton({
  label,
  pendingLabel,
  ariaLabel,
  className,
}: {
  label: string
  pendingLabel: string
  ariaLabel: string
  className: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={ariaLabel}
      className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap border px-4 font-mono text-[10px] uppercase tracking-[0.28em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:min-h-9 ${className}`}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}
