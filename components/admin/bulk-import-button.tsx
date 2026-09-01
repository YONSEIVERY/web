'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { bulkImportFinalPassMembers } from '@/app/admin/actions/bulk-import-members'
import {
  COHORT_MEMBER_ACTION_INITIAL,
  type CohortMemberActionState,
} from '@/app/admin/actions/cohort-members-state'

/**
 * 등록 회신을 마친 최종 합격자 일괄 등록 버튼.
 *
 * 되돌리기 어려운 동작이라 confirm에 대상 인원을 박아 둔다. 몇 명이
 * 들어가는지 모르는 채로 누르게 하지 않는다. 결과도 "N명 등록, M명 건너뜀
 * (이미 명부에 있음 …, 회신 없음 …)"으로 돌려받아 그 자리에서 보여준다.
 * 모르면 사용자는 다시 누른다.
 *
 * 이제 대상은 최종 합격자 전원이 아니라 등록 회신(registration='registered')을
 * 마친 사람이다. toImport·awaitingReply는 그 판정을 반영한 숫자이고, 부모가
 * 아직 넘겨주지 않으면(마이그레이션 직후 등) 인원 확정 없이 문구만 낮춰
 * 보여준다. 정확한 인원은 항상 서버 액션이 결과로 알려준다.
 *
 * 등록이 끝나면 대상이 0이 되지만 컴포넌트는 그대로 두고 버튼만 잠근다.
 * 부모가 조건부로 걷어내면 방금 받은 결과 문구까지 같이 사라진다.
 */
export function BulkImportButton({
  cohort,
  total,
  pending,
  toImport,
  awaitingReply,
}: {
  /** 등록 대상 기수 (site_config 현재 기수) */
  cohort: number
  /** 최종 합격자 전체 */
  total: number
  /** 그중 아직 명부에 없는 인원 (회신 여부는 보지 않음) */
  pending: number
  /** 이번에 실제로 들어갈 인원: 최종 합격 + 등록 회신 완료 + 명부에 없음 */
  toImport?: number
  /** 최종 합격자 중 아직 등록 회신이 표시되지 않은 인원 */
  awaitingReply?: number
}) {
  const [state, formAction] = useActionState<CohortMemberActionState, FormData>(
    bulkImportFinalPassMembers,
    COHORT_MEMBER_ACTION_INITIAL,
  )
  // 부모가 회신 기준 인원을 넘겨줬는지. 안 넘겨줬으면 숫자를 단정하지 않는다.
  const exact = typeof toImport === 'number'
  const count = toImport ?? pending
  const awaiting = awaitingReply ?? 0
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(buildConfirm({ cohort, total, pending, count, awaiting, exact })))
          e.preventDefault()
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input type="hidden" name="cohort" value={cohort} />
      <SubmitButton count={count} exact={exact} />
      {state.status === 'error' ? (
        <span className="text-xs text-red-400">{state.message}</span>
      ) : null}
      {state.status === 'success' ? (
        <span className="text-xs text-green-500">{state.message}</span>
      ) : null}
    </form>
  )
}

function buildConfirm({
  cohort,
  total,
  pending,
  count,
  awaiting,
  exact,
}: {
  cohort: number
  total: number
  pending: number
  count: number
  awaiting: number
  exact: boolean
}): string {
  const head = exact
    ? `${cohort}기 등록 회신을 마친 ${count}명을 학회원으로 등록합니다.\n\n` +
      `최종 합격자 ${total}명 중 등록 회신이 확인된 사람만 들어갑니다.\n` +
      (awaiting > 0
        ? `아직 회신 표시가 안 된 합격자 ${awaiting}명은 이번에 들어가지 않습니다.\n`
        : '')
    : `${cohort}기 최종 합격자 중 등록 회신을 마친 사람을 학회원으로 등록합니다.\n\n` +
      `명부에 아직 없는 최종 합격자는 ${pending}명이고, 그중 등록 회신이 확인된 사람만 들어갑니다.\n`
  return (
    head +
    '이미 등록된 사람은 건너뜁니다.\n' +
    '등록 후에는 한 명씩 지워야 되돌릴 수 있습니다.\n\n' +
    '계속하시겠습니까?'
  )
}

function SubmitButton({ count, exact }: { count: number; exact: boolean }) {
  const { pending: submitting } = useFormStatus()
  const label = submitting
    ? '등록 중…'
    : count === 0
      ? '등록 회신자 전원 등록 완료'
      : exact
        ? `등록 회신자 일괄 등록 (${count}명)`
        : '등록 회신자 일괄 등록'
  return (
    <button
      type="submit"
      disabled={submitting || count === 0}
      className="inline-flex min-h-11 items-center border border-fg-primary px-4 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base disabled:cursor-not-allowed disabled:border-border disabled:text-fg-muted disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-fg-muted"
    >
      {label}
    </button>
  )
}
