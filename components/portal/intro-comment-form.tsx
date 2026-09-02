'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createIntroComment } from '@/app/members/actions/intro-comments'

/**
 * 자기소개 댓글 작성 폼. 성공하면 입력을 비우고 새로고침으로 목록에
 * 반영한다. 실패하면 입력이 남아 있어야 해서 form action 자동 초기화
 * 경로를 타지 않는다 (post-composer와 같은 구조).
 */
export function IntroCommentForm({ profileId }: { profileId: string }) {
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
      const res = await createIntroComment(profileId, body)
      if (!res.ok) throw new Error(res.error)
      setBody('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '작성에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="border border-border p-5">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="이 소개를 읽고 떠오른 한마디를 남겨주세요."
        className="w-full border border-border bg-bg-base px-4 py-3 font-display text-base text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none md:text-sm"
      />
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          translate="no"
          className="inline-flex items-center gap-3 border border-fg-primary px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? '남기는 중…' : '댓글 남기기'}
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
