'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { sendStageResults } from '@/app/admin/actions/recruit'
import {
  SEND_RESULTS_INITIAL_STATE,
  type SendResultsState,
} from '@/app/admin/actions/send-results-state'

/**
 * 결과 통보 일괄 발송 버튼. 실수 방지 장치:
 * - 발송 대상 0건이면 비활성
 * - 클릭 시 합/불/제외 인원수를 보여주는 확인 대화상자
 * - 서버는 미발송 행에만 보내고 발송 시각을 기록 (중복 발송 차단)
 */
export function SendResultsButton({
  stage,
  passCount,
  failCount,
  excludedCount,
}: {
  stage: 'docs' | 'final'
  passCount: number
  failCount: number
  excludedCount: number
}) {
  const [state, formAction] = useActionState<SendResultsState, FormData>(
    sendStageResults,
    SEND_RESULTS_INITIAL_STATE,
  )
  const stageLabel = stage === 'docs' ? '서류' : '최종'
  const total = passCount + failCount

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const lines = [
          `${stageLabel} 결과 메일 ${total}건을 발송합니다.`,
          '',
          `합격 안내 ${passCount}건 · 불합격 안내 ${failCount}건`,
          excludedCount > 0
            ? `검토 전 ${excludedCount}건은 제외됩니다.`
            : null,
          '',
          '발송 후에는 되돌릴 수 없습니다. 진행할까요?',
        ].filter((l): l is string => l !== null)
        if (!confirm(lines.join('\n'))) e.preventDefault()
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input type="hidden" name="stage" value={stage} />
      <SubmitButton stageLabel={stageLabel} total={total} />
      {state.message && (
        <span
          role="status"
          className={`text-xs ${state.ok ? 'text-fg-subtle' : 'text-red-600'}`}
        >
          {state.message}
        </span>
      )}
    </form>
  )
}

function SubmitButton({
  stageLabel,
  total,
}: {
  stageLabel: string
  total: number
}) {
  const { pending } = useFormStatus()
  const disabled = pending || total === 0
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] transition-colors ${
        disabled
          ? 'cursor-not-allowed border-border text-fg-muted opacity-60'
          : 'border-fg-primary text-fg-primary hover:bg-fg-primary hover:text-bg-base'
      }`}
    >
      {pending
        ? '발송 중…'
        : `${stageLabel} 결과 발송${total > 0 ? ` (${total})` : ''}`}
    </button>
  )
}
