'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { bulkImportFinalPassMembers } from '@/app/admin/actions/bulk-import-members'
import {
  COHORT_MEMBER_ACTION_INITIAL,
  type CohortMemberActionState,
} from '@/app/admin/actions/cohort-members-state'

/**
 * 최종 합격자 일괄 등록 버튼.
 *
 * 되돌리기 어려운 동작이라 confirm에 대상 인원을 박아 둔다. 몇 명이
 * 들어가는지 모르는 채로 누르게 하지 않는다. 결과도 "N명 등록, M명 건너뜀"으로
 * 돌려받아 그 자리에서 보여준다. 모르면 사용자는 다시 누른다.
 *
 * 등록이 끝나면 pending이 0이 되지만 컴포넌트는 그대로 두고 버튼만 잠근다.
 * 부모가 조건부로 걷어내면 방금 받은 결과 문구까지 같이 사라진다.
 */
export function BulkImportButton({
  cohort,
  total,
  pending,
}: {
  /** 등록 대상 기수 (site_config 현재 기수) */
  cohort: number
  /** 최종 합격자 전체 */
  total: number
  /** 그중 아직 명부에 없는 인원 */
  pending: number
}) {
  const [state, formAction] = useActionState<CohortMemberActionState, FormData>(
    bulkImportFinalPassMembers,
    COHORT_MEMBER_ACTION_INITIAL,
  )
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `${cohort}기 최종 합격자 ${total}명 중 아직 명부에 없는 ${pending}명을 학회원으로 등록합니다.\n\n` +
              '이미 등록된 사람은 건너뜁니다.\n등록 후에는 한 명씩 지워야 되돌릴 수 있습니다.\n\n계속하시겠습니까?',
          )
        )
          e.preventDefault()
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input type="hidden" name="cohort" value={cohort} />
      <SubmitButton pending={pending} />
      {state.status === 'error' ? (
        <span className="text-xs text-red-400">{state.message}</span>
      ) : null}
      {state.status === 'success' ? (
        <span className="text-xs text-green-500">{state.message}</span>
      ) : null}
    </form>
  )
}

function SubmitButton({ pending }: { pending: number }) {
  const { pending: submitting } = useFormStatus()
  const label = submitting
    ? '등록 중…'
    : pending > 0
      ? `합격자 일괄 등록 (${pending}명)`
      : '합격자 전원 등록 완료'
  return (
    <button
      type="submit"
      disabled={submitting || pending === 0}
      className="inline-flex min-h-11 items-center border border-fg-primary px-4 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base disabled:cursor-not-allowed disabled:border-border disabled:text-fg-muted disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-fg-muted"
    >
      {label}
    </button>
  )
}
