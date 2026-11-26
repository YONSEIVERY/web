'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSubmissionFeedback } from '@/app/members/actions/feedback'

/**
 * 학회장단 피드백 작성 폼. 구조는 intro-comment-form과 같다: 성공하면
 * 입력을 비우고 새로고침, 실패하면 쓴 내용을 그대로 둔다.
 */
export function SubmissionFeedbackForm({
  submissionId,
}: {
  submissionId: string
}) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (pending) return
    if (!body.trim()) {
      setError('내용을 입력해주세요.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const res = await createSubmissionFeedback(submissionId, body)
      if (!res.ok) throw new Error(res.error)
      setBody('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        aria-label="이 발표자료에 대한 피드백"
        placeholder="이 팀에 줄 피드백을 적어주세요. 한 건에 한 가지씩 적으면 읽기 쉽습니다."
        className="w-full border border-border bg-bg-base px-4 py-3 font-display text-base text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none md:text-sm"
      />
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          translate="no"
          className="inline-flex items-center gap-3 border border-fg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? '저장 중…' : '피드백 등록'}
          <span aria-hidden>→</span>
        </button>
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
